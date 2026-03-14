# Communications Development — Common Standards

## Team

- **Team name:** `comms-dev`
- **Members:** team-lead, vigenere (cryptography engineer), babbage (backend engineer), kerckhoffs (QA & security engineer)
- **Mission:** Build a secure encrypted chat system for inter-team agent communication across Docker containers
- **Attribution prefix:** `(*CD:<AgentName>*)`

## Workspace

- **Repo:** `mitselek/ai-teams` (private) — shared with framework-research
- **Source code:** `comms-dev/` directory at repo root
- **Reference specs:** Herald's inter-team transport spec (from framework-research)

## Tech Stack

- **Language:** TypeScript (Node.js runtime)
- **Transport:** Unix Domain Socket via shared Docker volume at `/shared/comms/`
- **Encryption v1:** TLS-PSK (pre-shared symmetric key via Docker secrets)
- **Message format:** JSON envelope (version, id, timestamp, from, to, type, priority, reply_to, body, checksum) + Markdown body
- **Wire format:** 4-byte length-prefixed framing
- **Discovery:** `registry.json` on shared volume (file-locked writes, 60s heartbeat, 120s stale cleanup)
- **Delivery:** At-least-once with sender retry + receiver dedup by message ID
- **Testing:** Vitest

## Deliverables

1. **Message broker daemon** — per-team broker that listens on `<team-name>.sock`, handles encryption, routing, and delivery
2. **`comms-send` CLI** — send encrypted messages to other teams via broker
3. **`comms-publish` CLI** — bridge operational findings to GitHub Issues (`gh` CLI wrapper)

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*CD:<AgentName>*)`.

| Output type | Placement |
|---|---|
| Source code file | Comment at top of file |
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| GitHub Issue body | At the bottom of the body |

## Language Rules

- **Code, comments, docs:** English
- **User-facing content:** Estonian (when applicable)

## GitHub Issues as Knowledge Base

Both comms-dev and framework-research teams share `mitselek/ai-teams` issues as a cross-team knowledge base.

### Creating Issues

Use `gh` CLI with `--body-file` (never inline backticks in `--body`):

**GOTCHA:** `gh` CLI cannot read files from `/tmp/` due to sandbox isolation. Always write temp files to the working directory, and clean up after.

```bash
# Write body to working directory (NOT /tmp/)
cat > .gh-issue-body.md << 'ISSUE_EOF'
## Context
...

## Finding / Decision / Question
...

(*CD:<AgentName>*)
ISSUE_EOF

gh issue create --repo mitselek/ai-teams \
  --title "..." \
  --label "team:comms-dev" \
  --label "type:finding" \
  --body-file .gh-issue-body.md

# Clean up
rm .gh-issue-body.md
```

### Label Convention

| Label | Purpose |
|---|---|
| `team:comms-dev` | Created by this team |
| `team:framework-research` | Created by FR team |
| `affects:<team-name>` | Cross-team relevance |
| `type:finding` | Discovered pattern or fact |
| `type:decision` | Architectural or design decision |
| `type:question` | Open question needing input |
| `type:blocker` | Blocked issue needing resolution |

### Rules

- **Create and comment:** all members may create issues and comment
- **Close/delete:** team-lead approval required
- **Search before creating:** check for duplicates with `gh issue list --label "team:comms-dev"`
- Decisions and findings MUST be persisted as GitHub Issues, not only in scratchpads

## Standards

- This is a DEVELOPMENT team — we write production code
- All code goes into `comms-dev/` at repo root
- Tests are mandatory for all functionality
- Code review happens via team-lead before merge
- Git commits follow conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`
- All commits must include team attribution in the trailer: `Team: comms-dev`

## Development Method: TDD (Test-Driven Development)

All new functionality follows the **Red → Green → Refactor** cycle:

1. **Kerckhoffs writes failing tests first** — from the spec or task description, before any implementation exists
2. **Babbage/Vigenere implement** — write the minimum code to make the tests pass
3. **Refactor** — clean up while keeping tests green

**Workflow for new features:**
1. Team-lead assigns a feature task
2. Kerckhoffs reads the spec/task and writes test cases with real assertions (NOT todos)
3. Kerckhoffs confirms tests fail (`RED`) and sends `[COORDINATION]` to the implementer with test file location
4. Implementer writes code until tests pass (`GREEN`)
5. Implementer sends `[COORDINATION]` back — Kerckhoffs verifies and adds edge cases if needed

**Rule:** No implementation work begins until Kerckhoffs has committed failing tests for that module. The tests define the contract.

## Agent Spawning Rule

Agents MUST be spawned with `run_in_background: true`.

## On Startup

1. Read your personal scratchpad at `.claude/teams/comms-dev/memory/<your-name>.md` if it exists
2. Read this common-prompt.md
3. Send a brief intro message to `team-lead`

## Team Memory

### Personal Scratchpads

Each teammate maintains a scratchpad at `.claude/teams/comms-dev/memory/<your-name>.md`.
Keep it under 100 lines; prune stale entries.

Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

## Shutdown Protocol

1. Write in-progress state to your scratchpad
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.
