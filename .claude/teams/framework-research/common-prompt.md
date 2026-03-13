# Framework Research — Common Standards

## Team

- **Team name:** `framework-research`
- **Members:** team-lead, finn (research coordinator), medici (knowledge health), celes (agent resources manager), volta (lifecycle engineer), herald (protocol designer)
- **Mission:** Design a multi-team AI agent framework that scales to tens of teams

## Workspace

- **Repo:** `mitselek/ai-teams` (private)
- **Topics:** `topics/01-team-taxonomy.md` through `topics/08-observability.md`
- **Reference:** `reference/rc-team/` (cloudflare-builders) and `reference/hr-devs/` (evolved project team)

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*FR:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| GitHub issue body | At the bottom of the body |

## Language Rules

- **Framework docs:** English
- **User-facing content:** Estonian (when applicable)

## Standards

- This is a RESEARCH team — we study, analyze, and write design docs
- No production code is written by this team
- Reference implementations may be sketched as examples
- All findings go into `topics/*.md` files
- Git commits to `mitselek/ai-teams` repo

## Agent Spawning Rule

Agents MUST be spawned with `run_in_background: true`.

## On Startup

1. Read your personal scratchpad at `.claude/teams/framework-research/memory/<your-name>.md` if it exists
2. Read the README.md and any topic files relevant to current work
3. Send a brief intro message to `team-lead`
4. If this is a restart test, read `.claude/teams/framework-research/docs/restart-test.md` and verify success criteria

## Team Memory

### Personal Scratchpads

Each teammate maintains a scratchpad at `.claude/teams/framework-research/memory/<your-name>.md`.
Keep it under 100 lines; prune stale entries.

Tags: `[DECISION]`, `[PATTERN]`, `[WIP]`, `[CHECKPOINT]`, `[DEFERRED]`, `[GOTCHA]`, `[LEARNED]`

### Shared Knowledge

- **`docs/health-report.md`** — Medici's output
- **`docs/findings.md`** — cross-cutting research findings

## Shutdown Protocol

1. Write in-progress state to your scratchpad
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Approve shutdown

Team-lead shuts down last, commits memory files, pushes.
