# Startup — framework-research (*FR:Volta*)

**Read this file FIRST on every session start.** It tells you where everything is and what to do, without exploration.

**DO NOT use an Explore agent or broad file search.** In the 2026-03-13 restart, an Explore agent cost 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds. This file replaces all of that.

## This Installation

| Item | Path |
|---|---|
| Team config repo | `C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/` |
| Team config dir | `C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/.claude/teams/framework-research/` |
| Working directory | `C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/` |
| Runtime team dir | `C:/Users/mihkel.putrinsh/.claude/teams/framework-research/` |
| Roster | `.claude/teams/framework-research/roster.json` (relative to repo) |
| Common prompt | `.claude/teams/framework-research/common-prompt.md` |
| Agent prompts | `.claude/teams/framework-research/prompts/*.md` |
| Scratchpads | `.claude/teams/framework-research/memory/*.md` |
| Topic files | `topics/01` through `topics/08` |
| Reference teams | `reference/rc-team/`, `reference/hr-devs/` |

**Known gotcha #1:** `roster.json` says `workDir: "$HOME/github/mitselek-ai-teams"` — this is WRONG on this machine. The actual path is `C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/`. Until roster.json is fixed, use the path from this file.

**Known gotcha #2 (from Restart 4, 2026-03-13):** `$HOME` is UNRELIABLE on Windows/Git Bash. In some bash calls within the same session, `$HOME` resolves to an empty string — making `$HOME/.claude/teams/...` resolve to `/.claude/teams/...` (root path). **All bash commands in this file use absolute paths, not `$HOME`.** If you write new bash commands, use the absolute paths from the table above.

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
cd "C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams" && git pull
```
**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2: Diagnose

```bash
TEAM_DIR="C:/Users/mihkel.putrinsh/.claude/teams/framework-research"
if [ -d "$TEAM_DIR/inboxes" ]; then echo "WARM RESTART"; elif [ -d "$TEAM_DIR" ]; then echo "PARTIAL STATE"; else echo "COLD START"; fi
```

**WARNING:** Do NOT use `$HOME` here. On Windows/Git Bash, `$HOME` can resolve to empty string, making this check `/.claude/teams/framework-research` — producing a FALSE COLD START or FALSE WARM RESTART. Use the absolute path above.

| Result | Meaning | Next action |
|---|---|---|
| WARM RESTART | Normal — dir + inboxes from last session | Go to Step 3 |
| PARTIAL STATE | Dir exists but no inboxes — investigate why | Go to Step 2b, then Step 3 |
| COLD START | No dir at all | Go to Step 2b, then Step 3 |

#### Step 2b: Anomaly check (PARTIAL STATE or COLD START only)

The shutdown protocol says **do NOT call TeamDelete** — so the dir SHOULD exist on non-first sessions. Check:

```bash
cd "C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams" && git log --oneline -- .claude/teams/framework-research/memory/ | head -5
```

- **If commits exist** → team has run before → dir absence is **anomalous**. Ask the user: "The team dir is missing but the shutdown protocol says it should be preserved. What happened?"
- **If no commits** → genuinely first session → COLD START is expected. Proceed.

**Do NOT silently accept a missing dir.** In the 2026-03-13 field test, the team-lead said "No inboxes to backup" without investigating — the PO flagged this as a mistake.

### Step 3: Clean

```bash
TEAM_DIR="C:/Users/mihkel.putrinsh/.claude/teams/framework-research"

# No /tmp backup needed — inboxes are persisted to the repo during shutdown.
# Runtime dir inboxes are stale copies, safe to discard.

# Remove stale dir (safe even if it doesn't exist)
rm -rf "$TEAM_DIR"
```
**Verify:** `ls "C:/Users/mihkel.putrinsh/.claude/teams/framework-research/"` returns "No such file or directory".

### Step 4: Create

```
TeamCreate(team_name="framework-research")
```

**Verify (two checks):**
1. TeamCreate returned success with a `team_file_path` and `lead_agent_id`
2. Check disk: `ls "C:/Users/mihkel.putrinsh/.claude/teams/framework-research/config.json"`

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
- config.json exists on disk: `ls "C:/Users/mihkel.putrinsh/.claude/teams/framework-research/config.json"`
- If config.json is absent → do NOT proceed. Run Step 4 recovery.

This gate is cheap (one `ls`) and prevents the expensive failure of spawning agents into a broken team.

### Step 5: Restore inboxes from repo

```bash
REPO_INBOXES="C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/.claude/teams/framework-research/inboxes"
RUNTIME_INBOXES="C:/Users/mihkel.putrinsh/.claude/teams/framework-research/inboxes"

if [ -d "$REPO_INBOXES" ]; then
  mkdir -p "$RUNTIME_INBOXES"
  cp -r "$REPO_INBOXES"/* "$RUNTIME_INBOXES/"
fi
```
**Source:** The repo dir is the sole source of truth for inboxes. No `/tmp/` fallback.
**Verify:** If repo inboxes existed, `ls "C:/Users/mihkel.putrinsh/.claude/teams/framework-research/inboxes/"` shows files. If no repo inboxes (first-ever session), this step is a no-op.

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
REPO_INBOXES="C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/.claude/teams/framework-research/inboxes"
RUNTIME_INBOXES="C:/Users/mihkel.putrinsh/.claude/teams/framework-research/inboxes"

# Copy inboxes from runtime to repo with pruning (last 100 messages per file)
if [ -d "$RUNTIME_INBOXES" ]; then
  mkdir -p "$REPO_INBOXES"
  for inbox_file in "$RUNTIME_INBOXES"/*.json; do
    [ -f "$inbox_file" ] || continue
    filename=$(basename "$inbox_file")
    jq '.[-100:]' "$inbox_file" > "$REPO_INBOXES/$filename"
  done
fi

# Commit all session state
cd "C:/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams"
git add .claude/teams/framework-research/memory/
git add .claude/teams/framework-research/inboxes/
git commit -m "chore: save team state (scratchpads, tasks, inboxes)"
git push
```

**Verify:** `git log --oneline -1` shows the commit. Inboxes are in the repo.

### Step S5: Preserve

Do nothing. Do NOT call `TeamDelete`. The runtime dir stays on disk (convenience for next startup, but the repo is now the source of truth).

## Environment Notes

- **Platform:** Windows 11 (bash via Git Bash / MSYS2)
- **No admin rights** — use Scoop for dependencies
- **Git remote:** `mitselek/ai-teams` (private)
- **This is a research team** — no production code, only design docs

(*FR:Volta*)
