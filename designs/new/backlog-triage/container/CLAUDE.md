# CLAUDE.md — backlog-triage

## On Startup

**Read `/home/ai-teams/team-config/prompts/team-lead.md` FIRST.** It has the full boot sequence and protocol. Do not spawn agents until you have read it.

## Project Overview

Cross-reference the Jira VL backlog with GitHub issues, PRs, and commits in `Eesti-Raudtee/hr-platform` to identify which Jira tickets can be closed.

**Team:** backlog-triage (4 members)
**Repo:** `Eesti-Raudtee/hr-platform` (read-only reference)
**Team config:** `/home/ai-teams/team-config/`

## Workspace

| Path | Purpose |
|------|---------|
| `~/workspace/hr-platform/` | hr-platform repo (code + git history — read only) |
| `~/workspace/dev-toolkit/` | dev-toolkit repo (source for Jira MCP server) |
| `~/workspace/todo.md` | Tickets with no matching GitHub activity |
| `~/workspace/toconfirm.md` | Tickets with evidence but uncertain match (PO review needed) |
| `~/workspace/done.md` | Tickets confirmed implemented and transitioned in Jira |

## Team

| Name | Role | Agent |
|------|------|-------|
| Theseus | Team Lead | team-lead |
| Hypatia | Archivist (issue researcher) | archivist |
| Vidocq | Forensic (code researcher) | forensic |
| Portia | Consul (verdict renderer) | consul |

## Team Startup

```bash
# 1. Call TeamCreate("backlog-triage") from within Claude
# 2. Then run:
bash /home/ai-teams/start-team.sh
# 3. Wait for intro messages from: archivist, forensic, consul
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Jira | Jira MCP server (`~/workspace/dev-toolkit/jira-mcp-server/`) |
| GitHub | `gh` CLI + `git` (local clone at `~/workspace/hr-platform/`) |
| No frontend | This team reads and reports only — no dev server |

## Jira Reference

- **Project:** VL
- **JQL for backlog:** `project = VL AND statusCategory != Done ORDER BY key ASC`
- **Transition IDs:** 11=To Do, 21=In Progress, 31=Done, 41=Open
- **Env vars:** `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`

## Pipeline Protocol

Each Jira ticket goes through a 5-step pipeline in order:

1. **Lead** reads ticket → sends to Archivist
2. **Archivist** searches GitHub issues/PRs → reports to Lead
3. **Forensic** searches commits/code → reports to Lead
4. **Consul** renders verdict: `not_connected` / `needs_confirmation` / `done`
5. **Lead** acts on verdict (Jira update + report file)

See `common-prompt.md` for full protocol details.

## Git

Conventional commits: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`

This team does not commit to hr-platform (read-only). Git is used only for searching history.
