# Lifecycle

Spawning, scaling, shutdown, and handover of teams.

## Open Questions

- How is a team created — manually by PO or automatically by manager agent?
- What triggers team shutdown — task completion? idle timeout?
- How does handover work between sessions? (context, state, progress)
- Can teams self-replicate or split?
- How do we handle stale teams that lost context?

## Lifecycle Stages

### 1. Creation

- Who decides to create a team?
- Initial configuration: roster, permissions, repo access
- Bootstrap: load context, read CLAUDE.md, understand codebase

### 2. Operation

- Continuous work on assigned tasks
- Health monitoring (context usage, error rates)
- Dynamic scaling — add/remove agents as needed

### 3. Handover

- Session boundaries — what persists across restarts?
- Context compression — what to save to memory?
- Work-in-progress state — branches, uncommitted changes

### 4. Shutdown

- Clean shutdown — commit work, update issues, notify
- Forced shutdown — context limit, error, human decision
- Resource cleanup — branches, worktrees, temp files

## Notes

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

**Why:** Agent tool ignores roster model settings — all agents get default model, wasting expensive opus tokens. `spawn_member.sh` reads roster JSON for model, color, session ID.

**Rule:** NEVER spawn via Agent tool. NEVER use raw `claude` CLI (runs in background without tmux pane — agent invisible to user).

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
