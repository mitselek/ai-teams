# Backlog Triage — Common Standards

## Team

- **Team name:** `backlog-triage`
- **Members:** team-lead/Theseus (coordinator), archivist/Hypatia (issue researcher), forensic/Vidocq (code researcher), consul/Portia (stakeholder advocate)
- **Mission:** Cross-reference the Jira VL project backlog with GitHub issues, PRs, and commits in `Eesti-Raudtee/hr-platform` to identify which Jira tickets can be closed

## Workspace

- **Working directory:** `~/workspace/hr-platform/`
- **Output files (in `~/workspace/`):**
  - `todo.md` — tickets with no matching GitHub activity
  - `toconfirm.md` — tickets with evidence but uncertain match (PO review needed)
  - `done.md` — tickets confirmed implemented and transitioned in Jira

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata.

**REQUIREMENT ACKNOWLEDGMENT:** When you receive a message containing new requirements or instructions, acknowledge EACH item explicitly before beginning work.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*BT:<AgentName>*)`.

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading |
| Jira comment | At the bottom of the comment body |

## Pipeline Protocol

Each Jira ticket is processed **sequentially** through a 5-step pipeline. Tickets are processed in VL-number order (lowest first).

### Step 1 — Lead picks ticket

Lead reads the Jira ticket (summary, description, acceptance criteria) via `jira_get_issue`. Sends ticket key, summary, and description to Archivist.

### Step 2 — Archivist researches issues

Archivist searches hr-platform GitHub for:

- Issues with matching keywords/functionality
- PRs that reference related features
- Closed issues whose resolution matches the ticket's intent

Reports findings (with links) back to Lead. Lead forwards ticket + Archivist's findings to Forensic.

### Step 3 — Forensic researches code

Forensic receives ticket + Archivist's findings. Searches for:

- Commits that implement the described functionality
- Code in the codebase that fulfills the ticket's requirements
- Test files that validate the described behavior

Reports findings (with links/hashes) back to Lead. Lead forwards ticket + all evidence to Consul.

### Step 4 — Consul renders verdict

Consul receives ticket + all evidence (Archivist's issues + Forensic's commits/code). Evaluates:

- Does the evidence actually satisfy the ticket's **intent**, not just touch related code?
- Are there edge cases or partial implementations?
- Is the UI behavior verifiable from code, or does it need manual confirmation?

Renders one of three verdicts with justification: `not_connected`, `needs_confirmation`, `done`.

### Step 5 — Lead acts on verdict

Lead receives the verdict and executes the corresponding action:

| Verdict | Jira action | Report file |
|---|---|---|
| `not_connected` | None | `todo.md` |
| `needs_confirmation` | Post comment with evidence links via `jira_update_issue` | `toconfirm.md` |
| `done` | Post comment with evidence links via `jira_update_issue` + transition to Done via `jira_transition` (ID 31) | `done.md` |

Lead appends one row to the appropriate file after each verdict. Then picks the next ticket.

## Verdict Definitions

### `not_connected`

No GitHub evidence found that matches the ticket's described functionality. Or evidence exists but is clearly unrelated. **Action:** append to `todo.md`, no Jira action.

### `needs_confirmation`

Evidence exists (issues, PRs, commits, code) that likely matches the ticket's intent, but certainty is not high enough to close. Reasons: UI behavior not verifiable from code alone, partial implementation, ambiguous functional match. **Action:** append to `toconfirm.md`, post a Jira comment summarizing the evidence with links so PO can decide.

### `done`

Clear evidence that the ticket's requirement is fully implemented — matching issues/PRs resolved, commits landed, code and tests present. **Action:** append to `done.md`, post a Jira comment with evidence links, transition ticket to Done (ID 31).

## Jira Reference

- **Project:** VL
- **Board:** 461
- **JQL for backlog:** `project = VL AND statusCategory != Done ORDER BY key ASC`
- **Epics:** VL-2 (Annual), VL-3 (Probation), VL-4 (Internship), VL-5 (Exit), VL-21 (Dynamics 365), VL-115 (Infra & Quality)
- **Transition IDs:** 11=To Do, 21=In Progress, 31=Done, 41=Open
- **Env vars:** `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` (loaded from environment)

## GitHub Reference

- **Repository:** `Eesti-Raudtee/hr-platform`
- **Local clone:** `~/workspace/hr-platform/`
- **CLI:** `gh` for issues/PRs, `git` for commits and codebase
- **Key search commands:**
  - `gh issue list --repo Eesti-Raudtee/hr-platform --state all --search "<keywords>"`
  - `gh pr list --repo Eesti-Raudtee/hr-platform --state all --search "<keywords>"`
  - `git log --all --oneline --grep="<keyword>"`
  - `git log -S "<string>" --oneline` (pickaxe — find code additions/removals)

## Shutdown Protocol

1. Write in-progress state to your scratchpad at `memory/<your-name>.md`
2. Send closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]`, `[UNADDRESSED]` (1 bullet each, max)
   - `[UNADDRESSED]`: any requirements from team-lead that were not completed or explicitly deferred
3. Approve shutdown

Team-lead shuts down last, ensures output files are saved.

(*BT:Celes*)
