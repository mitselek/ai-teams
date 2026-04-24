# Startup — apex-research (*AR:Schliemann*)

**Read this file FIRST on every session start.** It tells you where everything is and what to do, without exploration.

**DO NOT use an Explore agent or broad file search.** This file replaces all of that.

## This Installation

All paths are derived from two anchors:

| Anchor | How to resolve |
|---|---|
| `REPO` | The git repo root: run `git rev-parse --show-toplevel` or use the working directory |
| `TEAM_DIR` | `$HOME/.claude/teams/apex-research` (runtime, ephemeral) |

| Item | Path |
|---|---|
| Team config repo dir | `$REPO/teams/apex-research/` |
| Working directory | `$REPO/` |
| Runtime team dir | `$TEAM_DIR/` |
| Roster | `teams/apex-research/roster.json` (relative to repo) |
| Common prompt | `teams/apex-research/common-prompt.md` |
| Agent prompts | `teams/apex-research/prompts/*.md` |
| Scratchpads | `teams/apex-research/memory/*.md` |
| Source data | `../vjs_apex_apps/` (READ-ONLY — symlink to /home/ai-teams/source-data in container) |
| Extraction scripts | `scripts/` |
| Inventory output | `inventory/` |
| Analysis output | `shared/` |
| Cluster specs | `specs/` |
| Dashboard | `dashboard/` |
| Design spec | `docs/specs/2026-03-17-apex-research-team-design.md` |

## Read Order

On every session start, read these files in this exact order:

| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, data flow, directory ownership, TDD mandate |
| 4 | `memory/schliemann.md` | Your prior session's decisions, WIP, warnings |

After these 4 reads, you know everything. Zero exploration required.

## Startup Procedure

**Execute these steps in exact order. Do not reorder, skip, or combine steps.**

### Step 1: Sync

```bash
REPO="$(git rev-parse --show-toplevel)"
cd "$REPO" && git pull
```
**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2: Diagnose

```bash
TEAM_DIR="$HOME/.claude/teams/apex-research"
if [ -d "$TEAM_DIR" ]; then echo "STALE DIR — will clean"; else echo "CLEAN — normal state"; fi
```

The runtime dir is **ephemeral by platform design** — the platform does not preserve it between CLI sessions. A missing dir is the normal state.

### Step 3: Clean

```bash
TEAM_DIR="$HOME/.claude/teams/apex-research"
rm -rf "$TEAM_DIR"
```
**Verify:** `ls "$TEAM_DIR"` returns "No such file or directory".

### Step 4: Create

```
TeamCreate(team_name="apex-research")
```

**Verify (two checks):**
1. TeamCreate returned success with a `team_file_path` and `lead_agent_id`
2. Check disk: `ls "$HOME/.claude/teams/apex-research/config.json"`

**If check 1 succeeds but check 2 fails (config.json not on disk):**
1. `TeamDelete(team_name="apex-research")`
2. `TeamCreate(team_name="apex-research")`
3. Re-check disk for config.json
4. If still fails after 2 attempts — STOP. Ask the user. Do NOT proceed to spawn.

### Step 5: Restore inboxes from repo

```bash
REPO="$(git rev-parse --show-toplevel)"
TEAM_DIR="$HOME/.claude/teams/apex-research"
REPO_INBOXES="$REPO/teams/apex-research/inboxes"
RUNTIME_INBOXES="$TEAM_DIR/inboxes"

if [ -d "$REPO_INBOXES" ] && [ "$(ls -A "$REPO_INBOXES" 2>/dev/null)" ]; then
    mkdir -p "$RUNTIME_INBOXES"
    cp "$REPO_INBOXES"/*.json "$RUNTIME_INBOXES/" 2>/dev/null
    echo "Restored $(ls "$RUNTIME_INBOXES" | wc -l) inbox(es) from repo"
else
    echo "No repo inboxes found (cold start)"
fi
```

**First session:** This will print "No repo inboxes found (cold start)" — that's expected.

### Step 6: Validate environment

```bash
python3 --version   # >= 3.11
node --version      # >= 20
ls ../vjs_apex_apps/ > /dev/null 2>&1 && echo "Source data: OK" || echo "Source data: MISSING (extraction scripts will fail)"
```

**Source data missing is a soft gate** — the team can still work on cached inventory data, but Champollion cannot run extraction scripts.

### Step 7: Start dashboard

The dashboard must be running before any agents are spawned — it is the team's primary visibility tool.

```bash
cd "$REPO/dashboard" && npm install --silent && npm run dev -- --host &
cd "$REPO"
```

**Verify:** `curl -s http://localhost:5173 | head -1` returns HTML.

If dashboard fails to start (missing deps, build errors), fix before proceeding. The dashboard is a prerequisite, not optional.

### Step 8: Spawn agents

Ask the user which agents to spawn. Do NOT auto-spawn. Spawn per task requirements.

**Spawn order (data dependencies):**
1. **Champollion** — produces raw extraction data
2. **Nightingale** — consumes extraction data, produces analysis JSON
3. **Berners-Lee** — consumes analysis JSON, builds dashboard (spawn with `isolation: "worktree"`)
4. **Hammurabi** — consumes analysis + dashboard context, writes specs

Before each spawn, check `config.json` — if agent name already exists, use SendMessage instead.

**Verify:** No `name-2` entries in `config.json`.

## Shutdown Procedure

### Step S1: Halt

Stop accepting new work. Let agents finish current tasks.

### Step S2: Own scratchpad + task snapshot + shutdown requests

**S2a.** Write your own scratchpad FIRST to `memory/schliemann.md` with tags: `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]`.

**S2b.** Create task snapshot before sending shutdown.

**S2c.** Send shutdown requests to all agents. Wait for each agent's closing report.

### Step S3: Collect

Wait for `teammate_terminated` from each agent. Do NOT proceed on `shutdown_approved` alone.

### Step S4: Persist inboxes + commit

```bash
REPO="$(git rev-parse --show-toplevel)"
TEAM_DIR="$HOME/.claude/teams/apex-research"
RUNTIME_INBOXES="$TEAM_DIR/inboxes"
REPO_INBOXES="$REPO/teams/apex-research/inboxes"

if [ -d "$RUNTIME_INBOXES" ] && [ "$(ls -A "$RUNTIME_INBOXES" 2>/dev/null)" ]; then
    mkdir -p "$REPO_INBOXES"
    cp "$RUNTIME_INBOXES"/*.json "$REPO_INBOXES/"
    echo "Persisted $(ls "$REPO_INBOXES" | wc -l) inbox(es) to repo"
fi

cd "$REPO"
git add teams/apex-research/memory/
git add teams/apex-research/inboxes/
git add inventory/ shared/ specs/ decisions/
git commit -m "chore: save apex-research session state"
git push
```

## First Session Checklist (Phase 1)

The first session follows the Dashboard-First approach from the design spec:

1. **Champollion:** Convert existing markdown inventories (`apps.md`, `pages.md`, `lovs.md`) to JSON format alongside the markdown
2. **Berners-Lee:** Scaffold SvelteKit dashboard with API routes, build App Inventory Grid and Agent Activity views
3. **Nightingale:** (wait for Champollion's JSON) Begin initial overlap analysis from LOV data in `shared/common-lovs.md`
4. **Hammurabi:** (wait for analysis) Not needed in first session

**Deliverable:** Working dashboard at localhost:5173 with App Inventory Grid and Agent Activity.

## Environment Notes

- **Platform:** Linux (Debian) inside Docker container
- **Git remote:** `Eesti-Raudtee/apex-migration-research`
- **Source data remote:** `Eesti-Raudtee/vjs_apex_apps` (read-only)
- **This is a hybrid team** — research agents + dashboard developer
- **Python venv:** Activate with `source .venv/bin/activate` before running scripts
- **Dashboard dev server:** `cd dashboard && npm run dev` (port 5173)

(*AR:Schliemann — drafted by FR:team-lead*)
