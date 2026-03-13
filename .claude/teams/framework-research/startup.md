# Startup — framework-research (*FR:Volta*)

**Read this file FIRST on every session start.** It tells you where everything is and what to do, without exploration.

**DO NOT use an Explore agent or broad file search.** In the 2026-03-13 restart, an Explore agent cost 31 tool uses, 73.5k tokens, and 2 minutes 18 seconds. This file replaces all of that.

## This Installation

| Item | Path |
|---|---|
| Team config repo | `~/Documents/github/mitselek-ai-teams/` |
| Team config dir | `~/Documents/github/mitselek-ai-teams/.claude/teams/framework-research/` |
| Working directory | `~/Documents/github/mitselek-ai-teams/` |
| Runtime team dir | `~/.claude/teams/framework-research/` |
| Roster | `.claude/teams/framework-research/roster.json` (relative to repo) |
| Common prompt | `.claude/teams/framework-research/common-prompt.md` |
| Agent prompts | `.claude/teams/framework-research/prompts/*.md` |
| Scratchpads | `.claude/teams/framework-research/memory/*.md` |
| Topic files | `topics/01` through `topics/08` |
| Reference teams | `reference/rc-team/`, `reference/hr-devs/` |

**Known gotcha:** `roster.json` says `workDir: "$HOME/github/mitselek-ai-teams"` — this is WRONG on this machine. The actual path is `$HOME/Documents/github/mitselek-ai-teams/`. Until roster.json is fixed, use the path from this file.

## Read Order

On every session start, read these files in this exact order:

| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas for this installation |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, communication rules, shutdown protocol |
| 4 | `memory/team-lead.md` | Your prior session's decisions, WIP, warnings |
| 5 | `docs/health-report.md` | Latest Medici audit (if exists) |

After these 5 reads, you know everything you need to execute the startup protocol. Zero exploration required.

## Startup Procedure

**Execute these steps in exact order. Do not reorder, skip, or combine steps.** Each step has a precondition (the previous step completed) and a verifiable outcome. State the step name out loud before executing it (e.g., "Step 1: Sync").

Field test (2026-03-13) showed the team-lead scrambled the phase order AND mislabeled phases (called Create "Phase 1: Sync"). The checklist format below prevents this — follow it mechanically.

### Step 1: Sync

```bash
cd ~/Documents/github/mitselek-ai-teams && git pull
```
**Verify:** Output says "Already up to date" or shows pulled changes.

### Step 2: Diagnose

```bash
TEAM_DIR="$HOME/.claude/teams/framework-research"
if [ -d "$TEAM_DIR/inboxes" ]; then echo "WARM RESTART"; elif [ -d "$TEAM_DIR" ]; then echo "PARTIAL STATE"; else echo "COLD START"; fi
```

| Result | Meaning | Next action |
|---|---|---|
| WARM RESTART | Normal — dir + inboxes from last session | Go to Step 3 |
| PARTIAL STATE | Dir exists but no inboxes — investigate why | Go to Step 2b, then Step 3 |
| COLD START | No dir at all | Go to Step 2b, then Step 3 |

#### Step 2b: Anomaly check (PARTIAL STATE or COLD START only)

The shutdown protocol says **do NOT call TeamDelete** — so the dir SHOULD exist on non-first sessions. Check:

```bash
cd ~/Documents/github/mitselek-ai-teams && git log --oneline -- .claude/teams/framework-research/memory/ | head -5
```

- **If commits exist** → team has run before → dir absence is **anomalous**. Ask the user: "The team dir is missing but the shutdown protocol says it should be preserved. What happened?"
- **If no commits** → genuinely first session → COLD START is expected. Proceed.

**Do NOT silently accept a missing dir.** In the 2026-03-13 field test, the team-lead said "No inboxes to backup" without investigating — the PO flagged this as a mistake.

### Step 3: Clean

```bash
TEAM_DIR="$HOME/.claude/teams/framework-research"

# Backup inboxes (only if they exist)
if [ -d "$TEAM_DIR/inboxes" ]; then
  cp -r "$TEAM_DIR/inboxes" /tmp/fr-inboxes-backup
fi

# Remove stale dir (safe even if it doesn't exist)
rm -rf "$TEAM_DIR"
```
**Verify:** `ls ~/.claude/teams/framework-research/` returns "No such file or directory".

### Step 4: Create

```
TeamCreate(team_name="framework-research")
```
**Verify:** `config.json` exists with current `leadSessionId`.

### Step 5: Restore inboxes

```bash
BACKUP="/tmp/fr-inboxes-backup"
if [ -d "$BACKUP" ]; then
  mkdir -p "$HOME/.claude/teams/framework-research/inboxes"
  cp -r "$BACKUP"/* "$HOME/.claude/teams/framework-research/inboxes/"
  rm -rf "$BACKUP"
fi
```
**Verify:** If backup existed, `ls ~/.claude/teams/framework-research/inboxes/` shows files. If no backup, this step is a no-op.

### Step 6: Audit

Spawn Medici first (before any other agent). Wait for her health report before proceeding.
**Verify:** Medici sends a health report message to team-lead.

### Step 7: Spawn agents

Spawn per task requirements. Before each spawn, check `config.json` — if agent name already exists, use SendMessage instead of spawning.
**Verify:** No `name-2` entries in `config.json`.

## Environment Notes

- **Platform:** Windows 11 (bash via Git Bash / MSYS2)
- **No admin rights** — use Scoop for dependencies
- **Git remote:** `mitselek/ai-teams` (private)
- **This is a research team** — no production code, only design docs

(*FR:Volta*)
