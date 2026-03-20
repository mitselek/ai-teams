# Backlog Triage Team — Design Spec

**Team:** `backlog-triage`
**Mission:** Cross-reference the Jira VL project backlog with GitHub issues, PRs, and commits in `Eesti-Raudtee/hr-platform` to identify which Jira tickets can be closed.
**Deployment:** Container on RC server (`dev@100.96.54.170`)

(*FR:team-lead*)

## 1. Problem Statement

The Jira VL project backlog contains 97 items (primarily VL-116 through VL-198, plus older items). Many of these may already be implemented — evidenced by closed GitHub issues, merged PRs, and commits in the hr-platform repo. There is no systematic link between the two systems.

The team performs **functional matching**: understanding what each Jira ticket describes, then searching GitHub and the codebase for evidence that the work has been done — even when no explicit cross-reference exists.

## 2. Team Composition

| Agent | Role | Model | Description |
|---|---|---|---|
| **team-lead** | Coordinator | opus | Picks tickets, routes through pipeline, posts to Jira, compiles report docs |
| **archivist** | Issue Researcher | sonnet | Searches GitHub issues, PRs, and discussions for functional matches |
| **forensic** | Code Researcher | sonnet | Searches commits, diffs, and live codebase for implementation evidence |
| **consul** | Stakeholder Advocate | opus | Reviews evidence with product/business lens, renders verdict |

**Model rationale:** Consul gets opus because verdict requires judgment — understanding whether code actually fulfills a business requirement. The two researchers are pattern-matching tasks that sonnet handles well. Lead gets opus for coordination and Jira write operations.

## 3. Pipeline Flow

Each of the 97 Jira tickets is processed sequentially through the pipeline, in ticket number order (lowest VL-number first):

```
Lead → Archivist → Forensic → Consul → Lead
```

### Step 1 — Lead picks ticket

Reads the Jira ticket (summary, description, acceptance criteria) via `jira_get_issue`. Sends ticket details to Archivist.

### Step 2 — Archivist researches issues

Searches hr-platform GitHub for:

- Issues with matching keywords/functionality
- PRs that reference related features
- Closed issues whose resolution matches the ticket's intent

Reports findings (with links) back to Lead, who forwards to Forensic.

### Step 3 — Forensic researches code

Receives the ticket + Archivist's findings. Searches for:

- Commits that implement the described functionality
- Code in the codebase that fulfills the ticket's requirements
- Test files that validate the described behavior

Reports findings (with links) back to Lead, who forwards to Consul.

### Step 4 — Consul renders verdict

Receives the ticket + all evidence. Evaluates:

- Does the evidence actually satisfy the ticket's intent, not just touch related code?
- Are there edge cases or partial implementations?
- Is the UI behavior verifiable from code, or does it need manual confirmation?

Renders one of three verdicts: `not_connected`, `needs_confirmation`, `done`.

### Step 5 — Lead acts on verdict

| Verdict | Jira action | Report file |
|---|---|---|
| `not_connected` | None | `todo.md` |
| `needs_confirmation` | Post comment with evidence links | `toconfirm.md` |
| `done` | Post comment with evidence links + transition to Done | `done.md` |

## 4. Tools & Access

### Jira (MCP tools)

- `jira_search` — query the VL backlog
- `jira_get_issue` — read individual ticket details
- `jira_update_issue` — post comments with evidence links
- `jira_transition` — move tickets to Done (transition ID 31)

### GitHub (`gh` CLI + git)

- `gh issue list/view` — search hr-platform issues
- `gh pr list/view` — search PRs
- `git log --all --grep` — search commit messages
- `git log -S` / `git log -G` — search for code changes (pickaxe)
- Standard file reading for codebase inspection

### Access matrix

| Agent | Jira read | Jira write | GitHub issues/PRs | Git/codebase |
|---|---|---|---|---|
| Lead | yes | yes | yes | no |
| Archivist | `jira_get_issue` | no | `gh issue`, `gh pr` | no |
| Forensic | `jira_get_issue` | no | `git log` | yes |
| Consul | `jira_get_issue` | no | yes (verify links) | yes (spot-check) |

Lead holds the write tools (`jira_update_issue`, `jira_transition`) since all verdicts flow through Lead.

## 5. Output Documents

Three markdown files in the team's working directory, updated incrementally as each ticket is processed:

### `todo.md` — Not connected

| Jira | Summary | Notes |
|---|---|---|
| VL-xxx | ... | No matching GitHub activity found |

### `toconfirm.md` — Connected, needs PO confirmation

| Jira | Summary | GitHub evidence | Jira comment posted | Why uncertain |
|---|---|---|---|---|
| VL-xxx | ... | #215, #220, abc123 | Yes | UI behavior not verifiable from code |

### `done.md` — Connected and closed

| Jira | Summary | GitHub evidence | Jira comment posted | Transitioned |
|---|---|---|---|---|
| VL-xxx | ... | #345, #346, 81697b6 | Yes | Done |

One row per ticket. Lead appends after each verdict.

## 6. Deployment

Container on RC server (`dev@100.96.54.170`), following the apex-research / entu-research pattern:

- Dedicated SSH port and dev server port (next available after entu's 2224/5177)
- SSH key generated for the team
- `Eesti-Raudtee/hr-platform` cloned inside the container (read access to code + git history)
- `gh` CLI authenticated for GitHub API access
- Jira env vars configured (`ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`)

### Container requirements

- **Base image: Debian** (not Ubuntu)
- Node.js (for Claude Code)
- `gh` CLI
- Git
- Jira env vars
- SSH access for PO to monitor progress

### Persistence

The container stays available after the first pass. The team can be restarted for future re-triage runs as more development lands and `todo.md` items get implemented.

## 7. Completion Criteria

The team's job is done when all 97 backlog items have been processed:

- Every VL backlog ticket appears in exactly one of `todo.md`, `toconfirm.md`, or `done.md`
- Every `done` ticket has been transitioned in Jira with a comment linking GitHub evidence
- Every `toconfirm` ticket has a Jira comment posted, awaiting PO review
- No tickets left unprocessed

### After completion

1. PO reviews `toconfirm.md` — decides which to close, which stay open
2. `todo.md` becomes the remaining backlog — what actually still needs development
3. Container stays available for future re-triage runs

## 8. Jira Reference

- **Project:** VL
- **Board:** 461
- **Epics:** VL-2 (Annual), VL-3 (Probation), VL-4 (Internship), VL-5 (Exit), VL-21 (Dynamics 365), VL-115 (Infra & Quality)
- **Transition IDs:** 11=To Do, 21=In Progress, 31=Done, 41=Open
- **GitHub repo:** `Eesti-Raudtee/hr-platform`
