# Eilama — Ollama-Based Agent Concept

(*RC-DEV:Marcus*)

## 1. Executive Summary

Eilama is a local code-generation specialist that runs `codellama:13b-instruct` via ollama
(`http://localhost:11434`). It occupies the "mechanical code factory" niche: given a short,
precise English spec, it outputs TypeScript/SQL/Python boilerplate so Claude agents preserve
their context budget for reasoning tasks.

Eilama is **not** a Claude agent. It is a lightweight Python daemon that watches its inbox,
calls the ollama REST API, and posts results back to the requester's inbox — behaving exactly
like any other team member from the outside.

---

## 2. Agent Profile

### Role: Code Scaffold Specialist

Eilama handles work that is:

- Mechanically repetitive (boilerplate, type stubs, SQL patterns)
- Fully specified in < 400 tokens
- Language: TypeScript, SQL, or Python

### Strengths (what 13B codellama does well)

| Task | Notes |
|---|---|
| TypeScript interface/type generation | Given a JSON example or schema |
| SQL migration drafts | Simple CREATE / ALTER / INSERT patterns |
| Test stub generation | Given function signature + scenario list |
| Boilerplate component scaffold | Given prop list and component name |
| Regex helpers | Simple patterns with test cases |
| Repetitive data transformations | Map/filter/reduce patterns |
| Code format conversion | JSON → Zod schema, SQL → TS types |

### Limitations (do NOT send Eilama)

| Task | Reason |
|---|---|
| Multi-file analysis | 4K context — can't hold more than ~1 file |
| Architecture decisions | 13B reasoning depth insufficient |
| Estonian language | Model has minimal Estonian training data |
| Security review | Subtle logic errors missed by 13B |
| Complex TypeScript inference | Generic constraints, conditional types |
| Anything needing >400 token context | Will hallucinate or truncate |
| Long explanations | Codellama optimized for code output, not prose |

### Capacity note

`codellama:13b-instruct` fits in ~8GB VRAM. The RTX 2000 Ada has 16GB, leaving headroom.
Claude agents run via Anthropic API (cloud) — **no VRAM conflict** between Eilama and Claude
teammates. The "one model at a time" constraint only applies if a second ollama model is added.

---

## 3. Integration Recommendation

### Chosen: Option B — Standalone inbox-polling daemon

**Rationale over other options:**

| Option | Verdict | Reason |
|---|---|---|
| A: Ollama MCP server | Rejected | Adds MCP process complexity; Claude agents still need to hold full context; no async |
| B: Inbox-polling daemon | **Recommended** | Fits existing team architecture exactly; async; Eilama "looks like" a teammate |
| C: Bash wrapper | Rejected | Not team-integrated; no async; no history; requires human to relay results |

**Why B works with existing architecture:**

The team already uses `~/.claude/teams/cloudflare-builders/inboxes/<name>.json` as the
messaging substrate. Eilama just needs a daemon that:

1. Polls `inboxes/eilama.json` for new messages
2. Extracts the task prompt
3. POSTs to `http://localhost:11434/api/generate`
4. Writes the ollama response into the requester's inbox

No changes to spawn_member.sh, TeamCreate, or config.json format needed.

### Architecture

```
Claude agent (Sven/Tess/etc.)
    │  SendMessage → eilama
    ▼
~/.claude/teams/cloudflare-builders/inboxes/eilama.json
    │  (polled every 2s)
    ▼
eilama-daemon.py
    │  POST /api/generate
    ▼
localhost:11434  (ollama, codellama:13b-instruct)
    │  streamed response
    ▼
eilama-daemon.py
    │  writes response to requester's inbox
    ▼
~/.claude/teams/cloudflare-builders/inboxes/<requester>.json
```

### Daemon sketch (Python, ~80 lines)

```python
# dev-toolkit/teams/eilama-daemon.py
import json, time, requests, pathlib, datetime

INBOX = pathlib.Path("~/.claude/teams/cloudflare-builders/inboxes/eilama.json").expanduser()
INBOXES = pathlib.Path("~/.claude/teams/cloudflare-builders/inboxes").expanduser()
OLLAMA = "http://localhost:11434/api/generate"
MODEL = "codellama:13b-instruct"
SYSTEM_PROMPT = open("dev-toolkit/teams/cloudflare-builders/prompts/eilama-system.txt").read()

seen_ids = set()

def process(msg: dict) -> str:
    payload = {
        "model": MODEL,
        "system": SYSTEM_PROMPT,
        "prompt": msg["text"],
        "stream": False,
        "options": {"num_ctx": 4096, "temperature": 0.1}
    }
    r = requests.post(OLLAMA, json=payload, timeout=120)
    return r.json()["response"]

def reply(to: str, text: str):
    inbox = INBOXES / f"{to}.json"
    msgs = json.loads(inbox.read_text()) if inbox.exists() else []
    msgs.append({
        "from": "eilama",
        "to": to,
        "type": "message",
        "text": text,
        "timestamp": datetime.datetime.utcnow().isoformat()
    })
    inbox.write_text(json.dumps(msgs, indent=2))

while True:
    if INBOX.exists():
        msgs = json.loads(INBOX.read_text())
        for msg in msgs:
            mid = msg.get("timestamp", "") + msg.get("from", "")
            if mid not in seen_ids and msg.get("type") == "message":
                seen_ids.add(mid)
                response = process(msg)
                reply(msg["from"], f"[eilama]\n\n{response}")
    time.sleep(2)
```

---

## 4. Interaction Protocol

### How a teammate sends work to Eilama

```
[YYYY-MM-DD HH:MM] SendMessage → eilama

task: generate TypeScript interface
input: {"id": 1, "name": "foo", "active": true, "score": 3.5}
output: src/lib/types/employee.ts
constraints: use readonly fields, export named interface EmployeeRecord
```

**Rules teammates must follow:**

- Write in **English** (not Estonian)
- Keep the entire message under **400 tokens**
- One task per message (no compound requests)
- Provide concrete examples (a JSON sample, a function signature, a table name)
- Do NOT paste large files — paste only the relevant fragment

### Eilama's response format

```
[eilama]

```typescript
export interface EmployeeRecord {
  readonly id: number;
  readonly name: string;
  readonly active: boolean;
  readonly score: number;
}
```

Review before use.

```

Eilama always ends with "Review before use." — a reminder that 13B output needs human check.

---

## 5. Prompt File

The prompt file at `prompts/eilama.md` serves as:
- Human-readable description for teammates
- Source for the system prompt injected into ollama

See `prompts/eilama.md` (created alongside this document).

The **system prompt** sent to ollama is a condensed version (< 200 tokens) stored separately
as `prompts/eilama-system.txt` (created at implementation time).

---

## 6. Open Questions for Team-Lead

1. **VRAM scheduling:** Should Eilama's daemon load/unload the model on demand, or keep it
   hot? Keeping it hot uses ~8GB VRAM permanently. Unloading frees VRAM but adds ~10s cold
   start. Recommend: keep hot during active story work, unload during overnight.

2. **Error handling:** If ollama is down or returns garbage, should Eilama silently drop the
   task or reply with an error message to the requester? Recommend: reply with explicit error.

3. **Scope creep guard:** Should Marcus review Eilama's output as part of normal code review,
   or treat it as "Sven/Tess wrote this" (i.e., author is the teammate who sent the task)?
   Recommend: the requesting teammate is responsible; Eilama output is draft material only.

4. **Startup:** Should Eilama be included in `spawn_member.sh` flow with a separate tmux pane,
   or started manually? The daemon doesn't need a TTY. Recommend: add a one-liner to the
   startup checklist, not to spawn_member.sh.

5. **Estonian text tasks:** If a teammate needs Estonian boilerplate (e.g., error messages),
   they should provide the Estonian text themselves and ask Eilama only to wire it into code.

---

## 7. Summary

| Attribute | Value |
|---|---|
| Model | codellama:13b-instruct |
| Context | 4096 tokens |
| Temperature | 0.1 (deterministic code) |
| Integration | Inbox-polling Python daemon |
| Languages (input) | English only |
| Code output | TypeScript, SQL, Python |
| Startup | `python3 dev-toolkit/teams/eilama-daemon.py &` |
| VRAM | ~8GB (always-on), no conflict with Claude API agents |
| Team role | Code Scaffold Specialist (boilerplate, stubs, SQL drafts) |
