# Lifecycle

Spawning, scaling, shutdown, and handover of teams.

## Canonical Startup Protocol (*FR:Volta*)

### Decision

Startup is a 6-phase sequence: **Sync → Clean → Create → Restore → Audit → Spawn**. Each phase has a precondition and a verifiable outcome. Skipping or reordering any phase produces a known failure mode (documented below).

### Rationale

Both reference teams (rc-team and hr-devs) converged on the same pattern independently, but with implementation scattered across prompts, scripts, and MEMORY.md entries. The core insight: `TeamCreate` is destructive — it requires a clean directory but must preserve inboxes. This forces a backup-delete-create-restore dance that is the single most fragile part of the lifecycle. Making it explicit and atomic prevents the most common startup failures.

### Phase 1: Sync

**Precondition:** Team lead has started (either via `rc-start.sh` or manually).
**Action:** Pull the team config repository to get the latest prompts, roster, and common-prompt.

```bash
cd <team-config-repo> && git pull
```

**Expected outcome:** Prompts, roster, and common-prompt are at HEAD.
**Failure if skipped:** Stale prompts or roster — agents spawn with outdated instructions or wrong models.

### Phase 2: Clean

**Precondition:** Sync complete. Team lead has read the roster and common-prompt (to know what to expect).
**Action:** Four sub-steps, strictly ordered:

```
2.0. Diagnose team dir state
2a.  Backup inboxes (if stale team dir exists)
2b.  Kill zombie agent processes (tmux panes, background daemons)
2c.  Remove stale team directory
```

#### Phase 2.0: Diagnose (*FR:Volta* — amendment from restart test 2026-03-13)

Before touching the filesystem, classify the starting scenario. This costs one `ls` and eliminates the diagnostic uncertainty of "why is the state this way?"

```bash
TEAM_DIR="$HOME/.claude/teams/<team-name>"

if [ -d "$TEAM_DIR/inboxes" ]; then
  echo "WARM RESTART — stale team dir with inboxes (normal)"
elif [ -d "$TEAM_DIR" ]; then
  echo "PARTIAL STATE — stale team dir, no inboxes (TeamDelete was called or inboxes never created)"
elif ls -d "$HOME/.claude/teams/<team-name>"-* 2>/dev/null | head -1 >/dev/null; then
  echo "MISCREATION — team dir exists under wrong name (prior TeamCreate without clean)"
else
  echo "COLD START — no prior state (first ever, different machine, or dir cleaned externally)"
fi
```

| Scenario | Meaning | What 2a–2c do |
|---|---|---|
| WARM RESTART | Normal session resumption | 2a backs up inboxes, 2c removes dir |
| PARTIAL STATE | Inboxes lost — TeamDelete was called or previous session crashed before inbox creation | 2a is a no-op (no inboxes), 2c removes dir |
| COLD START | No prior team state exists on this machine | 2a, 2b, 2c are all no-ops — proceed through them anyway |
| MISCREATION | TeamCreate ran against an existing dir, generated a suffixed name | 2c removes the wrong-name dir |

All four scenarios converge to the same outcome: `$TEAM_DIR` does not exist, inboxes (if any) are backed up. The diagnosis is informational — it tells the team lead what happened, not what to do differently. **Always run 2a–2c regardless of scenario** — they are idempotent and safe on empty state.

**Reference implementation (sub-steps 2a–2c):**

```bash
TEAM_DIR="$HOME/.claude/teams/<team-name>"

# 2a — preserve inbox state for cross-session continuity
if [ -d "$TEAM_DIR/inboxes" ]; then
  cp -r "$TEAM_DIR/inboxes" /tmp/<team-name>-inboxes-backup
fi

# 2b — kill zombies (RC: kill all non-%0 panes; local: N/A)
# RC-specific: tmux kill-pane for each agent pane
# Local: Agent tool processes terminate with parent session

# 2c — remove stale dir (REQUIRED)
rm -rf "$TEAM_DIR"
```

**Expected outcome:** `$TEAM_DIR` does not exist. Inboxes are in `/tmp/` (if they existed). Team lead knows which scenario was encountered.
**Failure if skipped:**

- Skip 2.0 → team lead wastes a round-trip investigating why the dir is/isn't there
- Skip 2a → inboxes lost → agents lose cross-session message history
- Skip 2b → zombie processes hold TTY → new spawn may fail or create invisible agents
- Skip 2c → `TeamCreate` generates a random name (e.g. `cloudflare-builders-a7f3`) → inbox routing breaks, all `SendMessage` calls fail silently

### Phase 3: Create

**Precondition:** `$TEAM_DIR` does not exist. Inboxes backed up.
**Action:** `TeamCreate(team_name="<team-name>")`

**Expected outcome:** Fresh `$TEAM_DIR` exists with `config.json` containing `leadSessionId`. No `inboxes/` subdirectory (TeamCreate does not create it).
**Failure if skipped:** No team context → all agent spawning and messaging fails.

**Critical invariant:** The `leadSessionId` in `config.json` must match the current session. A stale `leadSessionId` from a previous session breaks agent-to-lead messaging. This is why TeamCreate must run fresh each session — it generates a new `leadSessionId`.

### Phase 4: Restore

**Precondition:** TeamCreate succeeded. `config.json` exists with fresh `leadSessionId`.
**Action:** Restore inboxes from backup.

```bash
BACKUP="/tmp/<team-name>-inboxes-backup"
if [ -d "$BACKUP" ]; then
  mkdir -p "$TEAM_DIR/inboxes"
  cp -r "$BACKUP"/* "$TEAM_DIR/inboxes/"
  rm -rf "$BACKUP"
fi
```

**Expected outcome:** `$TEAM_DIR/inboxes/` exists with prior session messages. Stale `read: true` messages are harmless.
**Failure if skipped:** No inboxes dir → first SendMessage to any agent fails or creates messages in wrong location.

**Why `mkdir -p` is required:** TeamCreate does NOT create the `inboxes/` subdirectory. Without it, the `cp` command fails silently or writes to the wrong path.

### Phase 5: Audit

**Precondition:** Team is created with inboxes restored.
**Action:** Spawn Medici (health auditor) first, before any other agents.

Medici reads all scratchpads, prompts, and common-prompt, then reports:

- Stale scratchpad entries to prune
- Prompt/common-prompt inconsistencies
- Missing or outdated memory files

**Expected outcome:** Health report delivered. Team lead applies recommendations before spawning work agents.
**Failure if skipped:** Agents spawn with stale scratchpad state, outdated instructions, or conflicting prompt versions. Cost: wasted tokens on confused agents.

### Phase 6: Spawn

**Precondition:** Audit complete. Recommendations applied. Team lead knows which agents are needed (from roster + task).
**Action:** Spawn agents using the correct spawning path (see Spawning Paths below), with duplicate prevention gate.

**Spawn order:** Sequential with confirmation gates:

1. Research agent first (e.g., Finn) → wait for intro report → confirm
2. Review/oversight agents (e.g., Marcus) → wait → confirm
3. Implementation agents (parallel if independent: Sven + Tess + Dag)
4. Specialist agents (only if needed for current task)

**Expected outcome:** All needed agents registered in `config.json`, each with intro report received.

---

## Canonical Shutdown Protocol (*FR:Volta*)

### Decision

Shutdown is a 5-phase sequence: **Halt → Notify → Collect → Persist → Preserve**. Team lead shuts down last. TeamDelete is never called.

### Rationale

The key insight from operational experience: the team directory must survive shutdown so that the next session can restore inboxes. `TeamDelete` destroys this. The shutdown sequence is designed so that no state is lost even if the session is interrupted between phases.

### Phase 1: Halt

**Precondition:** Decision to shut down (task complete, session ending, or forced).
**Action:** Team lead stops accepting new work. No new tasks are delegated.

**Expected outcome:** All agents are either idle or completing their current task. No new work in flight.

### Phase 2: Notify

**Precondition:** Halt declared.
**Action:** Two sub-steps:

#### 2a. Create task-list-snapshot (*FR:Volta* — amendment from restart test 2026-03-13)

**Before** sending shutdown to agents, team lead creates `memory/task-list-snapshot.md`. This is when the lead has the best picture of task state — all agents still alive, tasks fresh in context. By Phase 4 (Persist), the lead's context is near limit and this step gets forgotten.

```bash
# Dump current task state — raw format, no synthesis needed
# TaskList output → memory/task-list-snapshot.md
# Include: task ID, status, assignee, one-line description, blockers
```

**Rationale for timing:** The previous protocol placed the snapshot in Shutdown Phase 4 (Persist). Field testing showed this is the worst possible timing — the team lead is the last agent standing, executing a multi-step git sequence, with context near limit. Moving it to Phase 2 (before agents shut down) means the lead can even ask agents for status updates to improve snapshot accuracy.

#### 2b. Send shutdown requests

Send shutdown request to all agents (broadcast or one-by-one).

Each agent, on receiving shutdown:

1. Write in-progress state to scratchpad (`[WIP]` or `[CHECKPOINT]`)
2. Send closing message to team-lead with exactly 3 items (1 bullet max each):
   - `[LEARNED]` — key discovery worth remembering
   - `[DEFERRED]` — unfinished work with reason
   - `[WARNING]` — risk or blocker for next session
3. Approve the shutdown

**Expected outcome:** Task snapshot created. All agents have saved state and sent closing messages.

### Phase 3: Collect

**Precondition:** All agents have responded (approved or rejected shutdown).
**Action:** Team lead waits for `teammate_terminated` from each agent.

**Critical:** `shutdown_approved` is NOT sufficient. The agent process may still be writing its scratchpad. Wait for `teammate_terminated` before proceeding.

**For RC/tmux:** Panes close automatically after `shutdown_approved` — do NOT call `tmux kill-pane` manually (causes race conditions with scratchpad writes).

**Expected outcome:** All agent processes terminated. Team lead is the only active process.

### Phase 4: Persist

**Precondition:** All agents terminated. Task snapshot already created (Phase 2a).
**Action:** Save session state to version control.

```bash
# Task snapshot was created in Shutdown Phase 2a — just commit it here
# Commit all memory files
git add .claude/teams/<team-name>/memory/
git commit -m "chore: save team scratchpads and task list"
git push
```

**Expected outcome:** All scratchpads and task snapshots are committed and pushed.
**Failure if skipped:** Next session has no scratchpad state — agents restart with amnesia.

### Phase 5: Preserve

**Precondition:** Persist complete.
**Action:** Do nothing. Specifically: **do NOT call TeamDelete**. The team directory remains on disk.

**Expected outcome:** `$TEAM_DIR` still exists with `config.json`, `inboxes/`, and all memory files. Next session's Phase 2 (Clean) will handle the stale directory correctly.

**Failure if violated (TeamDelete called):** Inboxes destroyed → next session has no message history to restore → agents lose cross-session context.

---

## Duplicate Prevention Gate (*FR:Volta*)

### Decision

Every spawn attempt must pass through a duplicate check. This is a hard gate — not a best practice, not a suggestion. Both reference teams document this as a REPEATED violation.

### The Gate

Before spawning agent `<name>`:

```
1. Read config.json
2. Check: does a member with name == <name> exist?
   YES → Do NOT spawn. SendMessage with the new task instead.
   NO  → Proceed with spawn.
```

### Where the gate lives

| Spawning path | Gate implementation |
|---|---|
| `spawn_member.sh` (RC/tmux) | Built-in: `jq` check on config.json, exits with error if duplicate found |
| `spawn_local.sh` + Agent tool (local) | Built-in: `jq` check on config.json, exits with error if duplicate found |
| Agent tool alone (local, no script) | Team lead must check config.json manually before calling Agent tool |
| Raw `claude` CLI | Not permitted (no gate possible) |

### Failure mode

Spawning without the gate creates `<name>-2` entries in `config.json`. Effects:

- Inbox routing becomes ambiguous (which `sven` gets the message?)
- Token waste (two agents doing the same role)
- Cleanup requires manual config.json editing or full team restart

### Why this keeps happening

The team lead's context window fills up over a long session. By the time a second spawn is needed, the lead has forgotten that the agent already exists. The fix is structural: the gate must be in the spawning mechanism (script), not in the lead's memory.

**Recommendation for framework:** Spawn tooling should refuse duplicates at the infrastructure level. The Agent tool itself should check `config.json` and reject duplicate names. Until that is implemented, `spawn_member.sh` (RC/tmux) and `spawn_local.sh` (local) provide built-in gates. Teams using the Agent tool without a wrapper script must rely on team lead discipline — a known failure mode.

---

## Spawning Paths (*FR:Volta*)

### Decision

Three spawning paths exist. Each is correct in exactly one context. Using the wrong path produces a specific failure.

### Decision Tree

```
Is the team running on a remote machine via tmux (RC)?
  YES → spawn_member.sh (reads roster, spawns in tmux pane)
  NO → Is it a local Claude Code session?
    YES → Does spawn_local.sh exist for this team?
      YES → spawn_local.sh (duplicate gate + prompt assembly) → Agent tool
      NO  → Agent tool directly (team lead must check duplicates and compose prompt manually)
    NO  → Not a supported configuration
```

### Path 1: `spawn_member.sh` (RC/tmux teams)

**When:** Remote Claude (RC) teams running in tmux sessions.
**How:** `spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]`
**Reads:** roster.json (model, color, agentType), config.json (leadSessionId, duplicate check)
**Produces:** New tmux pane with claude CLI process, config.json entry

**Advantages:**

- Respects roster model settings (opus vs sonnet per agent)
- Built-in duplicate gate
- Visible to user in tmux layout
- Handles daemon-backed agents (Eilama pattern)

**Disadvantages:**

- Requires tmux (not available in local Claude Code)
- Requires TTY (background spawn does not work)

### Path 2: Agent tool (local teams)

**When:** Local Claude Code sessions without tmux.
**How:** `Agent(name="<name>", model="<model>", prompt="...", run_in_background: true)`
**Reads:** Nothing automatically — team lead must supply model, prompt, and name as parameters.
**Produces:** Background agent process, config.json entry

**Advantages:**

- Works without tmux
- Simple — no shell script needed
- Supports per-agent model selection via `model` parameter (e.g., `model: "opus"`)

**Disadvantages:**

- No built-in duplicate gate — team lead must check config.json manually
- No prompt file loading — team lead must read prompt file and pass content inline
- `run_in_background: true` is MANDATORY — foreground blocks team lead from receiving messages

### Path 2.5: `spawn_local.sh` + Agent tool (local teams, automated) (*FR:Volta* — amendment from restart test 2026-03-13)

**When:** Local Claude Code sessions where the team has a roster and prompt files.
**How:** Team lead runs `spawn_local.sh` to get the duplicate check and assembled prompt, then passes the output to the Agent tool.
**Reads:** roster.json (model, name validation), config.json (duplicate check), prompts/<name>.md (prompt content)
**Produces:** Validated prompt text on stdout. Agent tool spawns the process.

**Reference implementation:**

```bash
#!/usr/bin/env bash
set -euo pipefail
# spawn_local.sh <team-name> <agent-name>
# For local Claude Code sessions. Validates and outputs spawn parameters.
# Team lead uses the output with the Agent tool.

TEAM_NAME="${1:?Usage: spawn_local.sh <team-name> <agent-name>}"
AGENT_NAME="${2:?Usage: spawn_local.sh <team-name> <agent-name>}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_DIR="$SCRIPT_DIR/$TEAM_NAME"
CONFIG="$HOME/.claude/teams/$TEAM_NAME/config.json"
ROSTER="$TEAM_DIR/roster.json"

# Validate prerequisites
[[ -f "$CONFIG" ]] || { echo "ERROR: $CONFIG not found. Run TeamCreate first." >&2; exit 1; }
[[ -f "$ROSTER" ]] || { echo "ERROR: $ROSTER not found." >&2; exit 1; }

# Duplicate gate
if jq -e ".members[] | select(.name == \"$AGENT_NAME\")" "$CONFIG" >/dev/null 2>&1; then
  echo "ERROR: $AGENT_NAME already registered in config.json. Use SendMessage instead." >&2
  exit 1
fi

# Read roster entry
ROSTER_ENTRY=$(jq -r ".members[] | select(.name == \"$AGENT_NAME\")" "$ROSTER")
[[ -n "$ROSTER_ENTRY" ]] || { echo "ERROR: $AGENT_NAME not found in roster." >&2; exit 1; }

MODEL=$(echo "$ROSTER_ENTRY" | jq -r '.model')

# Compose prompt
PROMPT=""
if [[ -f "$TEAM_DIR/prompts/$AGENT_NAME.md" ]]; then
  PROMPT=$(cat "$TEAM_DIR/prompts/$AGENT_NAME.md")
fi

echo "--- spawn_local output ---"
echo "agent: $AGENT_NAME"
echo "model: $MODEL"
echo "prompt_file: $TEAM_DIR/prompts/$AGENT_NAME.md"
echo "---"
echo "$PROMPT"
```

**Advantages over raw Agent tool:**

| Capability | Agent tool alone | spawn_local.sh + Agent tool |
|---|---|---|
| Duplicate gate | Manual (team lead remembers) | Structural (script exits with error) |
| Prompt assembly | Manual (team lead reads + pastes) | Automatic (script reads prompt file) |
| Model from roster | Manual (team lead looks up roster) | Automatic (script reads roster) |
| Roster validation | None | Agent name validated against roster |

**Disadvantages:**

- Requires shell execution before Agent tool call (two-step process)
- Team lead must still manually invoke the Agent tool with the script's output
- No tmux pane management (agent not visible as separate terminal)

### Path 3: Raw `claude` CLI

**When:** Never for teams. Only for standalone, non-team usage.

**Why forbidden:**

- No duplicate gate
- No config.json registration
- No tmux pane management (agent invisible to user)
- No roster model/color settings

**Exception:** `rc-start.sh` uses raw CLI to start the team-lead process itself (bootstrapping — the lead is not a team member being spawned).

---

## Cross-Session Handover (*FR:Volta*)

### Decision

Handover state lives in three places: **scratchpads** (per-agent), **shared knowledge files** (per-team), and **task snapshots** (team lead). Each has different write triggers and prune rules.

### Scratchpads

**Location:** `memory/<agent-name>.md` (within team directory)
**Owner:** The agent named in the file. No other agent writes to it.
**Max size:** 100 lines. Prune on startup (Medici flags violations).

#### Write triggers

| Trigger | Tag | Example |
|---|---|---|
| Discovered something non-obvious | `[LEARNED]` | "D1 batch size limit is 100, not documented" |
| Made a decision with rationale | `[DECISION]` | "Using sql.js instead of better-sqlite3 — binary won't build on this machine" |
| Found a repeatable approach | `[PATTERN]` | "Svelte 5 runes: `$derived` replaces `$:` reactive statements" |
| Mid-task checkpoint | `[CHECKPOINT]` | "3/5 tests passing, blocked on auth mock" |
| Stopping before completion | `[WIP]` | "Branch story/47-fix-rating at commit abc123, tests red" |
| Blocked, awaiting external input | `[DEFERRED]` | "Waiting for PO answer on AK-12 before implementing filter" |
| Surprising pitfall | `[GOTCHA]` | "overflow-x: auto breaks position: sticky" |

#### Save timing

- **Immediately on discovery** — never defer to session end. Context compaction can trigger at any time and will erase unsaved discoveries.
- **Periodically during long tasks** — checkpoint every significant milestone.
- **On shutdown** — final WIP/CHECKPOINT before approving shutdown.

#### What NOT to save

- Search paths ("I grepped for X in Y") — ephemeral, no re-discovery value
- Transient failures already fixed — the fix is in the code
- Anything in CLAUDE.md or derivable from `git log` / one grep
- Superseded draft work — clutters the scratchpad

#### Prune rules

On startup, Medici checks all scratchpads for:

- Entries older than 2 sessions with no `[DECISION]` or `[PATTERN]` tag → suggest removal
- `[WIP]` entries where the branch was already merged → safe to remove
- `[DEFERRED]` entries where the blocker was resolved → safe to remove
- Total lines > 100 → flag for agent to prune

### Shared Knowledge Files

**Location:** `docs/` (hr-devs) or `memory/` (rc-team) — convention varies
**Canonical location (recommendation):** `docs/` within team directory — separates team-wide knowledge from per-agent state

Files with defined owners and purpose:

| File | Who writes | Purpose |
|---|---|---|
| `architecture-decisions.md` | Any teammate | Settled choices with rationale and date |
| `test-gaps.md` | Tess (testing agent) | Untested areas for triage |
| `api-contracts.md` | Frontend + backend agents | Agreed API shapes |
| `health-report.md` | Medici | Latest health audit output |

**Write trigger:** When a cross-cutting discovery affects multiple agents.
**Prune trigger:** Team lead reviews on session start; Medici flags stale entries.

### Task Snapshots

**Location:** `memory/task-list-snapshot.md`
**Owner:** Team lead (created during Shutdown Phase 2a, committed during Phase 4)
**Purpose:** Next session's team lead can see what was in progress, what was completed, what was blocked.

**Format:** Simple markdown list with status, assignee, and blockers. Raw TaskList dump is sufficient — no synthesis required. Reduce activation energy to near zero.

**Why Phase 2a, not Phase 4:** Field testing (2026-03-13 restart) showed that placing the snapshot in Phase 4 (Persist) causes it to be forgotten — the team lead is cognitively loaded and executing a multi-step git sequence. Phase 2a is when the lead has the best task picture: all agents still alive, tasks fresh in context.

---

## Stale-Team Recovery (*FR:Volta*)

### Decision

A "stale team" is one where the team directory exists from a previous session but the current session has no live team context. This is the normal state at the start of every session. The canonical startup protocol (Phases 2-4) handles this case by design.

### When recovery is needed

| Scenario | Symptom | Recovery |
|---|---|---|
| Normal session start | `$TEAM_DIR` exists with stale `config.json` | Standard startup: Phase 2 (Clean) → Phase 3 (Create) |
| Crashed session | `$TEAM_DIR` exists, scratchpads may be incomplete | Same as above — scratchpads are best-effort |
| TeamDelete was called | `$TEAM_DIR` does not exist, no inboxes to restore | Phase 3 (Create) directly — inbox history is lost |
| Wrong team name | `$TEAM_DIR` exists under wrong name (e.g. `team-name-a7f3`) | Remove wrong dir, create with correct name |

### Key insight

There is no special "recovery" procedure. The canonical startup protocol IS the recovery procedure. Every session starts by assuming the team is stale and cleaning it. This makes the protocol idempotent — running it on a clean state or a stale state produces the same result.

---

## Non-Claude Agent Lifecycle (*FR:Volta*)

### Decision

Non-Claude agents (e.g., local LLM daemons like Eilama) use the same team infrastructure (inboxes, config.json) but have a different process lifecycle. `spawn_member.sh` already handles this via the `backendType` field in roster.json.

### Pattern

```json
{
  "name": "eilama",
  "model": "ollama:codellama:13b-instruct",
  "backendType": "daemon"
}
```

When `backendType == "daemon"`:

- `spawn_member.sh` starts a Python daemon instead of `claude` CLI
- Daemon polls its inbox file (`inboxes/<name>.json`) for messages
- Daemon registers in `config.json` like any other agent
- No TTY required — can run in background or in a tmux pane

**Shutdown:** Daemon agents do not respond to `shutdown_request` messages via the standard protocol. Team lead must send a poison-pill message or kill the process directly.

**Open question:** Should daemon agents implement the `shutdown_request` / `shutdown_response` protocol in their polling loop?

---

## Patterns from Reference Teams (*FR:Finn*)

### Creation: human-initiated, medici-first

Team creation is always human-triggered (no autonomous team spawning). Startup sequence:

**rc-team (inline in team-lead prompt):**

1. Pull dev-toolkit
2. Backup inboxes → kill zombie processes → remove stale team dir
3. `TeamCreate(team_name="cloudflare-builders")`
4. Restore inboxes (TeamCreate does NOT create inboxes/ dir — mkdir first)
5. Spawn Medici first for health audit, apply recommendations
6. Spawn remaining agents per configuration preset
7. Send ready message to user, wait for task

**hr-devs (externalised to `docs/startup-shutdown.md`):**
Same pattern, adds: dashboard startup (node server + browser kiosk), `spawn_member.sh` replaces Agent tool.

**Critical invariant:** TeamCreate must be called fresh each session. If old team dir exists, TeamCreate generates a random name — breaking inbox routing. Stale dir must be removed first, inboxes preserved separately.

### Spawning: shell script, not Agent tool

**Evolution:** rc-team originally used the Agent tool. hr-devs replaced it with `spawn_member.sh`.

**Why (RC/tmux teams):** `spawn_member.sh` reads roster JSON for model, color, session ID, manages tmux panes, and has a built-in duplicate gate. The Agent tool lacks tmux integration and prompt file loading.

**Correction (2026-03-13):** The Agent tool DOES support per-agent model selection via the `model` parameter. The original claim that it "ignores roster model settings" was incorrect. The remaining gaps for local teams are: no duplicate gate, no prompt file loading. See Path 2.5 (`spawn_local.sh`) for the local equivalent.

**Rule (RC/tmux):** Use `spawn_member.sh`. NEVER use raw `claude` CLI (runs in background without tmux pane — agent invisible to user).
**Rule (local):** Use `spawn_local.sh` + Agent tool when available. Raw Agent tool is acceptable but lacks structural safeguards.

**Spawn order matters:** Finn first (wait for intro report, user confirmation) → Marcus (wait, confirm) → Tess + Sven (parallel) → Dag (if needed).

### Duplicate prevention

Before spawning any agent:

1. Read `config.json` to see who is already registered
2. If name exists → SendMessage with new task
3. Only spawn if name is NOT in config

Spawning a duplicate creates `name-2` clutter and wastes tokens. This is a REPEATED violation across sessions (per MEMORY.md).

### Operation: handover across sessions

Each agent maintains a personal scratchpad (`memory/<name>.md`, max 100 lines). Tags structure the scratchpad:

- `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

**When to save:** immediately on discovery (not deferred to session end — context compaction kills deferred writes). Checkpoint during long tasks.

**What to save:** non-obvious, stable, costly-to-rediscover, >5 min of re-discovery value. NOT: search paths, transient failures already fixed, anything already in CLAUDE.md.

Shared knowledge files (`docs/` in hr-devs, `memory/` flat in rc-team):

- `architecture-decisions.md` — any teammate may append
- `test-gaps.md` — Tess appends, team-lead triages
- `api-contracts.md` — Sven + Dag write

### Shutdown: ordered, confirmed, no TeamDelete

Shutdown sequence (both teams):

1. Stop all new work
2. Send shutdown to all agents (broadcast or one-by-one)
3. Wait for confirmation from each
4. Save task list snapshot to memory/
5. `git add .claude/teams/.../memory/ && git commit -m "chore: save team scratchpads" && git push`
6. **DO NOT TeamDelete** — directory stays so next session can restore inboxes

Each agent on shutdown: write WIP to scratchpad → send closing message (LEARNED / DEFERRED / WARNING, 1 bullet max each) → approve.

**Gotchas from practice:**

- Panes close AUTOMATICALLY after shutdown_approved — do NOT call `tmux kill-pane` manually
- Stale inbox messages (`read: true`) do NOT cause problems on re-spawn
- Wait for `teammate_terminated` before re-spawning same-name agents — `shutdown_approved` is NOT enough
- Always show procedure and ask for confirmation BEFORE acting

### Eilama: lifecycle of a non-Claude agent

Eilama (codellama:13b daemon) has a different lifecycle:

- Not spawned via TeamCreate/spawn_member.sh
- Started as a background Python daemon: `python3 eilama-daemon.py &`
- Not given a tmux pane (doesn't need TTY)
- Added as a one-liner to the startup checklist
- "Appears" as a teammate via inbox polling — same messaging substrate

This shows the lifecycle framework can accommodate non-Claude agents transparently.

---

## Open Questions (*FR:Volta*)

### Resolved (by this design)

- ~~How do we handle stale teams that lost context?~~ → Canonical startup protocol is inherently stale-team recovery (Phase 2 Clean).
- ~~What triggers team shutdown?~~ → Human decision, task completion, or forced (context limit/error). No auto-shutdown.
- ~~How does handover work between sessions?~~ → Scratchpads + shared knowledge files + task snapshots, with defined write triggers and prune rules.

### Still open

1. **Inbox backup atomicity** — The backup-rm-create-restore sequence is not atomic. If the process crashes between Phase 2c (remove) and Phase 4 (restore), inboxes in `/tmp/` may be orphaned. A filesystem-level rename (swap old dir with new) would be safer, but TeamCreate requires the directory to not exist.

2. ~~**Agent tool duplicate gate**~~ → Resolved by `spawn_local.sh` (Path 2.5). Local teams now have a wrapper script with built-in duplicate gate and prompt assembly. (*FR:Volta* — resolved 2026-03-13)

3. **Daemon agent shutdown protocol** — Should non-Claude agents implement `shutdown_request`/`shutdown_response` in their polling loop, or is kill-process sufficient?

4. **Scratchpad prune automation** — Medici flags violations, but pruning is manual. Should there be an automatic prune step that removes `[WIP]` entries for merged branches?

5. **Multi-team startup coordination** — When tens of teams exist, do they start independently or is there an orchestrator that sequences team startups? (Connects to T04-hierarchy.)

6. **Can teams self-replicate or split?** — Not addressed. May be needed for scaling patterns. (Connects to T01-taxonomy.)
