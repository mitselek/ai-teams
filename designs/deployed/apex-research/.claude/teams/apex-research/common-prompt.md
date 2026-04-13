# apex-research — Common Standards

## Team

- **Team name:** `apex-research`
- **Members:** team-lead/Schliemann (coordinator), champollion (research coordinator), nightingale (data analyst), berners-lee (dashboard developer), hammurabi (spec writer)
- **Mission:** Reverse-engineer 57 legacy Oracle APEX apps, identify clusters, and produce migration specs for downstream teams

## Workspace

- **Repo:** `Eesti-Raudtee/apex-migration-research` (read-write)
- **Source data:** `vjs_apex_apps` mounted at `../vjs_apex_apps/` (READ-ONLY — never modify)
- **Dashboard:** `dashboard/` (SvelteKit + TailwindCSS)
- **Specs:** `specs/<cluster>/SPEC.md`

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**MANDATORY: After completing any task, send a SendMessage report to team-lead.** Do not go idle without reporting.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*AR:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| GitHub issue body | At the bottom of the body |
| Code file | In a comment at the top |

## Language Rules

- **Technical docs and specs:** English
- **User-facing content:** Estonian (when applicable)
- **Dashboard UI labels:** Estonian with English tooltips

## vjs_apex_apps — READ-ONLY (HARD RULE)

The `vjs_apex_apps` repo contains ~14,600 SQL files in APEX split-file format. This is the source data for all analysis.

**NEVER write to, modify, or delete any file in `vjs_apex_apps`.** It is a read-only reference. Only Champollion reads it directly. All other agents consume processed data from `inventory/` and `shared/`.

## Data Flow Rules

```
vjs_apex_apps (SQL)
    |
    v
Champollion (parse) --> inventory/*.md + *.json
                                |
                        Nightingale (analyze)
                                |
                shared/*.md + shared/*.json (dashboard data)
                       |                |
               Berners-Lee          Hammurabi
               (dashboard)       (cluster specs)
                       |                |
                dashboard/       specs/<cluster>/SPEC.md
```

### Directory Ownership

| Directory | Owner (write) | Readers |
|---|---|---|
| `inventory/` | Champollion | Nightingale, Hammurabi, Schliemann |
| `shared/` | Nightingale | Berners-Lee, Hammurabi, Schliemann |
| `dashboard/` | Berners-Lee | Schliemann (review) |
| `specs/` | Hammurabi | Schliemann (review), all (read) |
| `decisions/` | Hammurabi, Schliemann | all |
| `scripts/` | Champollion | Nightingale (read) |
| `.claude/teams/apex-research/memory/` | each agent owns their own file | Schliemann reads all |
| `dashboard/data/agents.json` | Schliemann | Berners-Lee (read) |

**Rule:** Do not write to directories you do not own. If you need data in another agent's directory, request it via SendMessage.

## Existing Assets

These scripts and documents already exist and are the starting point:

- `scripts/extract_app_inventory.py` — generates `inventory/apps.md`
- `scripts/extract_pages.py` — generates `inventory/fXXX/pages.md`
- `scripts/extract_lovs.py` — generates LOV inventories + `shared/common-lovs.md`
- `scripts/data_quality.py` — generates `inventory/data-quality-report.md`
- `decisions/001-migration-readiness-assessment.md` — ADR-001 (awaiting APEX owner review)
- `docs/USER_STORIES.md` — 6 epics, ~20 user stories

## Tech Stack

- **Analysis scripts:** Python 3.11+, pytest, mypy (strict)
- **Dashboard:** SvelteKit + TailwindCSS + TypeScript (strict)
- **Deployment:** Local dev server (localhost:5173) — dashboard is internal tooling

## Agent Spawning Rule

Agents MUST be spawned with `run_in_background: true`.

### Spawn Order (data dependencies)

1. **Champollion** — produces raw extraction data
2. **Nightingale** — consumes extraction data, produces analysis JSON
3. **Berners-Lee** — consumes analysis JSON, builds dashboard
4. **Hammurabi** — consumes analysis + dashboard context, writes specs

### Trunk-Based Development (ADR-004)

All agents commit directly to `main`. Directory ownership prevents conflicts. CI gate (`npm run build && npm run check && npm test`) runs on every push. PRs required only for changes to shared data contracts (`types/`).

### TDD Pair Protocol (ADR-004)

Dashboard work uses a sequential TDD pair — **never parallel**:

1. **RED (Nightingale)** — writes failing tests from acceptance criteria
2. **GREEN (Berners-Lee)** — makes tests pass, refactors
3. RED must complete before GREEN starts. No exceptions.

## On Startup

1. Read your personal scratchpad at `.claude/teams/apex-research/memory/<your-name>.md` if it exists
2. Read the CLAUDE.md and any files relevant to your current work
3. Send a brief intro message to `team-lead`

## Team Memory

### Personal Scratchpads

Each teammate maintains a scratchpad at `.claude/teams/apex-research/memory/<your-name>.md`.
Keep it under 100 lines; prune stale entries.

Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

## Shutdown Protocol

1. Write in-progress state to your scratchpad
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.

## Quality Audits

Quality audits are performed by framework-research Medici remotely (not a member of this team). Medici checks consistency between inventory data, analysis output, specs, and dashboard. Findings are reported to Schliemann via cross-team message.

## TDD Mandate

All code (Python scripts and dashboard) follows RED -> GREEN -> REFACTOR:

1. Write the failing test first
2. Write minimum code to pass
3. Refactor if needed
4. All tests must pass before committing
