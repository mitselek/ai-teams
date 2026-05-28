# Startup — framework-research (*FR:Volta*)

**Read this file FIRST on every session start.** It tells you where everything is and what to do, without exploration.

**DO NOT use an Explore agent or broad file search.** In the 2026-03-13 restart, an Explore agent cost 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds. This file replaces all of that.

## This Installation

All paths are derived from two anchors:

| Anchor | How to resolve |
|---|---|
| `REPO` | The git repo root: run `git rev-parse --show-toplevel` or use the working directory |
| `TEAM_DIR` | `$HOME/.claude/teams/framework-research` (runtime, ephemeral) |

| Item | Path |
|---|---|
| Team config repo | `$REPO/` |
| Team config dir | `$REPO/teams/framework-research/` |
| Working directory | `$REPO/` |
| Runtime team dir | `$TEAM_DIR/` |
| Roster | `teams/framework-research/roster.json` (relative to repo) |
| Common prompt | `teams/framework-research/common-prompt.md` |
| Agent prompts | `teams/framework-research/prompts/*.md` |
| Scratchpads | `teams/framework-research/memory/*.md` |
| Topic files | `topics/01` through `topics/08` |
| Reference teams | `reference/rc-team/`, `reference/hr-devs/` |
| Lifecycle scripts | `teams/framework-research/restore-inboxes.sh`, `persist-inboxes.sh`, `restore-ghost-members.sh` |

**Known gotcha #1:** `roster.json` says `workDir: "$HOME/github/mitselek-ai-teams"` — this may be WRONG on your machine. Use `git rev-parse --show-toplevel` to get the actual repo path.

**Known gotcha #2 (from Restart 4, 2026-03-13):** `$HOME` can be UNRELIABLE on some platforms (e.g., Windows/Git Bash resolves it to empty string). The lifecycle scripts use `$SCRIPT_DIR` to derive repo paths and `$HOME` only for the runtime dir. If `$HOME` is empty, set it explicitly before running scripts.

**Known gotcha #3 (from Restart 4, 2026-03-13):** `TeamCreate` returns success and reports a `team_file_path`, but `config.json` may NOT exist on disk immediately. Other teams (e.g., cloudflare-builders) do have config.json on disk. Hypothesis: config.json may be written lazily (e.g., on first agent message). Step 2's verify-on-disk check (and Step 2b operational gate) defends against this.

**Known gotcha #4 (from session-startup 2026-04-30):** In-memory team-leadership state survives `/clear`. A bare `rm -rf $TEAM_DIR` cleans disk but does NOT release leadership; the next `TeamCreate` then fails with "Already leading team. Use TeamDelete to end the current team before creating a new one." Mitigation is structural — Step 2 always calls `TeamDelete` before `TeamCreate`. Shutdown Step S5 calls `TeamDelete` on graceful exit so next session's `/clear` start needs no cleanup at all.

## Read Order

On every session start, read these files in this exact order:

| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas for this installation |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, communication rules, shutdown protocol |
| 4 | `prompts/aeneas.md` | Team-lead role, scope, coordination rules |
| 5 | `memory/team-lead.md` | Your prior session's decisions, WIP, warnings |

After these 5 reads, you know everything you need to execute the startup protocol. Zero exploration required.

## Startup Procedure

**Execute these steps in exact order. Do not reorder, skip, or combine steps.** Each step has a precondition (the previous step completed) and a verifiable outcome. State the step name out loud before executing it (e.g., "Step 1: Sync").

Field test (2026-03-13) showed the team-lead scrambled the phase order AND mislabeled phases (called Create "Phase 1: Sync"). The checklist format below prevents this — follow it mechanically.

### Step 0.5: Verify parent CLI session model matches roster team-lead model

Before `TeamCreate`, verify the parent CLI session is running on the model the roster pins team-lead to. On Agent-tool team architecture, `roster.json`'s `model` field is **documentation-only** — `TeamCreate` stamps the *parent session model* into runtime `config.json` regardless of roster intent, and all subsequently-spawned specialists inherit it (Agent tool's `model` param accepts only family-level overrides `opus`/`sonnet`/`haiku`, which resolve to the current default version, not a specific pin like `claude-opus-4-6[1m]`).

```
Roster says:  claude-opus-4-6[1m]   (team-lead intent)
Parent says:  ???                   (run `claude --version` or check /context header for active model)
```

**If parent model ≠ roster team-lead.model:** STOP. Switch parent via `/model claude-opus-4-6[1m]` (or restart CLI with `--model claude-opus-4-6[1m]`) before proceeding. Substrate-truth catch from S38 (2026-05-28): parent on 4.7 stamped `"model": "claude-opus-4-7[1m]"` into config.json despite roster saying 4.6. All specialists would inherit 4.7 — ~40% context-cost differential per agent vs. the 4.6 baseline historic to S35-S37.

**Verify:** Parent model string matches roster `members[0].model`. If matched → proceed to Step 1.

### Step 1: Sync

```bash
REPO="$(git rev-parse --show-toplevel)"
cd "$REPO" && git pull
```

**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2: Reset team state

```
TeamDelete(team_name="framework-research")   # best-effort; ignore failure if no team to clean
TeamCreate(team_name="framework-research")
```

```bash
ls "$HOME/.claude/teams/framework-research/config.json"
```

**Verify (all three):**

1. TeamCreate returned success with a `team_file_path` and `lead_agent_id`
2. config.json exists on disk (the `ls` above)
3. Roster matches `teams/framework-research/roster.json`

**Why this collapses Steps 2–4 from R7-and-earlier:** The old Step 2 (diagnose) gated nothing — both branches went to Step 3. The old Step 3 (`rm -rf`) is strictly weaker than `TeamDelete`: it cleans disk but misses in-memory team-leadership state. The 2026-04-30 session-startup confirmed the failure mode empirically — `rm -rf` ran clean, then `TeamCreate` returned "Already leading team" because in-memory state survived `/clear`. Recovery required `TeamDelete()` anyway. `TeamDelete()` at the top is the single primitive that handles both fresh-start and stale-state paths.

**If `TeamDelete` errors with "no team to delete":** ignore. Best-effort by design.

**If verify check 2 fails (config.json absent after TeamCreate):** rare — observed once (Restart 4, 2026-03-13). The recovery is the same primitive: re-run `TeamDelete + TeamCreate` once. If it still fails → STOP. Ask the user. Do NOT proceed to spawn.

#### Step 2b: Operational gate (*FR:Volta* — from R4-3)

**Do NOT spawn any agent until the team is verified operational.** In Restart 4, an agent was spawned into a broken team state (TeamCreate returned "success" but team was non-functional). The agent was wasted.

The verify-on-disk check above IS this gate. One `ls` separates a working team from a broken one. Do not proceed to Step 4 (Spawn) until config.json is confirmed.

### Step 2c: Re-register ghost members from roster (*FR:Volta*)

`TeamCreate` seeds runtime `members[]` from harness-init state, NOT from `roster.json`. The harness consults `roster.json` on agent SPAWN to find a member's prompt/model — but ghost members (`agentType: "ghost"`) are never spawned (they're comm endpoints, no agent process), so they never enter runtime `members[]` via the natural `TeamCreate` → spawn path. Result: a fresh-session `config.json` is missing every ghost in the roster. Native `SendMessage` to a ghost name fails validation until somebody re-registers it.

The fix exploits substrate finding #8 v3 (canonical: [`wiki/references/members-array-edit-honored-mid-session.md`](wiki/references/members-array-edit-honored-mid-session.md)) — plain JSON edits to runtime `members[]` are honored on the next `SendMessage` validation. So after `TeamCreate`, we read the roster, filter for `agentType == "ghost"`, and append any missing entries directly to the runtime `config.json`.

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/teams/framework-research/restore-ghost-members.sh"
```

The script handles:

- Reads ghost entries (`agentType == "ghost"`) from `teams/framework-research/roster.json`
- For each ghost: appends to runtime `members[]` if missing; copies `backendType` and `color` from the roster entry; sets `isActive: false`, fresh `joinedAt`, empty `tmuxPaneId`/`cwd`/`subscriptions`
- Ensures an empty inbox file (`[]`) exists at `$HOME/.claude/teams/framework-research/inboxes/<ghost-name>.json` — the ghost-bridge daemon polls this file and would log missing-file warnings without it
- **Idempotent:** running twice produces the same final state (one-line "All ghost members already registered" on no-op)
- Exit 0 on success, non-zero on error

**Verify:** Script outputs `Re-registered N ghost member(s).` or `All ghost members already registered.` Non-zero exit = error, investigate before proceeding.

**Discipline:** runs unconditionally on every startup — no gate on "do we have ghosts?" The script self-checks and no-ops cheaply if all ghosts are already registered. Adding a new ghost to the roster requires zero startup-script changes; the next session picks it up automatically.

### Step 3: Restore inboxes from repo

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/teams/framework-research/restore-inboxes.sh"
```

The script handles:

- Precondition check (runtime dir must exist)
- Copies inbox JSON files from repo to runtime
- **Prunes stale shutdown/idle messages** (shutdown_request, shutdown_approved, shutdown_response, idle_notification)
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Verify:** Script outputs "Restored N inbox(es)..." or "No repo inboxes found..." (cold start). Non-zero exit = error, investigate before proceeding.

### Step 4: Spawn agents

Ask the user which agents to spawn. Do NOT auto-spawn any agent (including Medici). Spawn per task requirements. Before each spawn, check `config.json` — if agent name already exists, use SendMessage instead of spawning.
**Verify:** No `name-2` entries in `config.json`.

## Shutdown Procedure (*FR:Volta* — 2026-03-13)

**Execute these steps in exact order after deciding to shut down.** See `topics/06-lifecycle.md` for full rationale.

### Step S1: Halt

Stop accepting new work. Let agents finish current tasks.

### Step S2: Own scratchpad + task snapshot + shutdown requests

**S2a. Write your own scratchpad FIRST** — before task snapshot or agent shutdown. Write to `memory/team-lead.md` with tags: `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]`. You have the clearest picture of your own state right now — by S4 you'll be cognitively loaded with git operations.

**S2b. Task snapshot:**

```bash
# Create task snapshot BEFORE sending shutdown — this is when you have the best picture
# TaskList output → memory/task-list-snapshot.md
```

**S2c.** Send shutdown requests to all agents. Wait for each agent's closing report (`[LEARNED]`, `[DEFERRED]`, `[WARNING]`).

### Step S3: Collect

Wait for `teammate_terminated` from each agent. Do NOT proceed on `shutdown_approved` alone — the agent may still be writing its scratchpad.

### Step S4: Persist inboxes + commit

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/teams/framework-research/persist-inboxes.sh"

# Commit all session state
cd "$REPO"
git add teams/framework-research/memory/
git add teams/framework-research/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

The persist script handles:

- Copies inbox JSON files from runtime to repo
- Prunes to last 100 messages per file
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Verify:** `git log --oneline -1` shows the commit. Inboxes are in the repo.

### Step S5: Release team leadership

```
TeamDelete(team_name="framework-research")
```

**Why:** The in-memory team-leadership state (held by the parent CLI process) is independent of disk state. On graceful exit, `TeamDelete` nulls it cleanly so the next session's `/clear` startup has nothing to recover from — Step 2's `TeamDelete` becomes a no-op rather than a recovery. On crash exit (no S5), Step 2 still cleans up at next start; S5 is the happy-path optimization.

**Verify:** `TeamDelete` returns success or "no team to delete" (idempotent).

**Note:** R7 had no S5 — the conclusion that "TeamDelete is unnecessary because the runtime dir is ephemeral" was wrong. The runtime *dir* is ephemeral; the parent CLI's in-memory leadership state is NOT. The 2026-04-30 session-startup made this distinction empirically obvious. See gotcha #4.

## Environment Notes

- **Platform:** Linux (Ubuntu) — scripts are platform-independent via `$SCRIPT_DIR` and `$HOME`
- **Git remote:** `mitselek/ai-teams` (private)
- **This is a research team** — no production code, only design docs
- **jq** is available and used by lifecycle scripts

(*FR:Volta*)
