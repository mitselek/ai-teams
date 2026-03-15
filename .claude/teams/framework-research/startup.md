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
| Team config dir | `$REPO/.claude/teams/framework-research/` |
| Working directory | `$REPO/` |
| Runtime team dir | `$TEAM_DIR/` |
| Roster | `.claude/teams/framework-research/roster.json` (relative to repo) |
| Common prompt | `.claude/teams/framework-research/common-prompt.md` |
| Agent prompts | `.claude/teams/framework-research/prompts/*.md` |
| Scratchpads | `.claude/teams/framework-research/memory/*.md` |
| Topic files | `topics/01` through `topics/08` |
| Reference teams | `reference/rc-team/`, `reference/hr-devs/` |
| Lifecycle scripts | `.claude/teams/framework-research/restore-inboxes.sh`, `persist-inboxes.sh` |

**Known gotcha #1:** `roster.json` says `workDir: "$HOME/github/mitselek-ai-teams"` — this may be WRONG on your machine. Use `git rev-parse --show-toplevel` to get the actual repo path.

**Known gotcha #2 (from Restart 4, 2026-03-13):** `$HOME` can be UNRELIABLE on some platforms (e.g., Windows/Git Bash resolves it to empty string). The lifecycle scripts use `$SCRIPT_DIR` to derive repo paths and `$HOME` only for the runtime dir. If `$HOME` is empty, set it explicitly before running scripts.

**Known gotcha #3 (from Restart 4, 2026-03-13):** `TeamCreate` returns success and reports a `team_file_path`, but `config.json` may NOT exist on disk immediately. Other teams (e.g., cloudflare-builders) do have config.json on disk. Hypothesis: config.json may be written lazily (e.g., on first agent message). The Step 4 verification has been updated to account for this.

## Read Order

On every session start, read these files in this exact order:

| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas for this installation |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, communication rules, shutdown protocol |
| 4 | `memory/team-lead.md` | Your prior session's decisions, WIP, warnings |
After these 4 reads, you know everything you need to execute the startup protocol. Zero exploration required.

## Startup Procedure

**Execute these steps in exact order. Do not reorder, skip, or combine steps.** Each step has a precondition (the previous step completed) and a verifiable outcome. State the step name out loud before executing it (e.g., "Step 1: Sync").

Field test (2026-03-13) showed the team-lead scrambled the phase order AND mislabeled phases (called Create "Phase 1: Sync"). The checklist format below prevents this — follow it mechanically.

### Step 1: Sync

```bash
REPO="$(git rev-parse --show-toplevel)"
cd "$REPO" && git pull
```
**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2: Diagnose

```bash
TEAM_DIR="$HOME/.claude/teams/framework-research"
if [ -d "$TEAM_DIR" ]; then echo "STALE DIR — will clean"; else echo "CLEAN — normal state"; fi
```

| Result | Meaning | Next action |
|---|---|---|
| STALE DIR | Runtime dir left over from interrupted or same-invocation session | Go to Step 3 |
| CLEAN | Normal state — platform cleaned up after last session | Go to Step 3 |

The runtime dir is **ephemeral by platform design** — the platform does not preserve it between CLI sessions. A missing dir is the normal state, not an anomaly. All durable state lives in the repo (scratchpads, inboxes). No investigation needed.

### Step 3: Clean

```bash
TEAM_DIR="$HOME/.claude/teams/framework-research"

# No /tmp backup needed — inboxes are persisted to the repo during shutdown.
# Runtime dir inboxes are stale copies, safe to discard.

# Remove stale dir (safe even if it doesn't exist)
rm -rf "$TEAM_DIR"
```
**Verify:** `ls "$TEAM_DIR"` returns "No such file or directory".

### Step 4: Create

```
TeamCreate(team_name="framework-research")
```

**Verify (two checks):**
1. TeamCreate returned success with a `team_file_path` and `lead_agent_id`
2. Check disk: `ls "$HOME/.claude/teams/framework-research/config.json"`

**If check 1 succeeds but check 2 fails (config.json not on disk):**

This happened in Restart 4 (2026-03-13). TeamCreate reported success but config.json did not exist. Agents spawned into this state are wasted — team is non-functional.

**Recovery (max 2 attempts):**
1. `TeamDelete(team_name="framework-research")`
2. `TeamCreate(team_name="framework-research")`
3. Re-check disk for config.json
4. If still fails after 2 attempts → STOP. Ask the user. Do NOT proceed to spawn.

#### Step 4b: Operational gate (*FR:Volta* — from R4-3)

**Do NOT spawn any agent until the team is verified operational.** In Restart 4, an agent was spawned into a broken team state (TeamCreate returned "success" but team was non-functional). The agent was wasted.

**Gate check:** After Step 4, before ANY spawn (Step 6):
- config.json exists on disk: `ls "$HOME/.claude/teams/framework-research/config.json"`
- If config.json is absent → do NOT proceed. Run Step 4 recovery.

This gate is cheap (one `ls`) and prevents the expensive failure of spawning agents into a broken team.

### Step 5: Restore inboxes from repo

```bash
REPO="$(git rev-parse --show-toplevel)"
bash "$REPO/.claude/teams/framework-research/restore-inboxes.sh"
```

The script handles:
- Precondition check (runtime dir must exist)
- Copies inbox JSON files from repo to runtime
- **Prunes stale shutdown/idle messages** (shutdown_request, shutdown_approved, shutdown_response, idle_notification)
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Verify:** Script outputs "Restored N inbox(es)..." or "No repo inboxes found..." (cold start). Non-zero exit = error, investigate before proceeding.

### Step 6: Spawn agents

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
bash "$REPO/.claude/teams/framework-research/persist-inboxes.sh"

# Commit all session state
cd "$REPO"
git add .claude/teams/framework-research/memory/
git add .claude/teams/framework-research/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

The persist script handles:
- Copies inbox JSON files from runtime to repo
- Prunes to last 100 messages per file
- Verification (source/dest count match)
- Exit code 0 on success, 1 on error

**Verify:** `git log --oneline -1` shows the commit. Inboxes are in the repo.

**Note:** Previous versions had a Step S5 (Preserve) that said "do NOT call TeamDelete." Removed in R7 — the runtime dir is ephemeral by platform design. Step S4 (Persist to repo) is the final shutdown step. The repo is the sole durable store.

## Environment Notes

- **Platform:** Linux (Ubuntu) — scripts are platform-independent via `$SCRIPT_DIR` and `$HOME`
- **Git remote:** `mitselek/ai-teams` (private)
- **This is a research team** — no production code, only design docs
- **jq** is available and used by lifecycle scripts

(*FR:Volta*)
