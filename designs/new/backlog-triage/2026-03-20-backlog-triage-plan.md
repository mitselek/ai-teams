# Backlog Triage Team — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create and deploy the backlog-triage team — roster, agent prompts, container config — so it can autonomously cross-reference VL Jira backlog with hr-platform GitHub history.

**Architecture:** Four-agent team (lead + archivist + forensic + consul) deployed in a Debian-based Docker container on RC server. Lead coordinates a sequential pipeline per ticket. Container needs Jira MCP tools, `gh` CLI, and the hr-platform repo.

**Tech Stack:** Docker (Debian base), Claude Code, Jira MCP server, `gh` CLI, git

**Spec:** `designs/new/backlog-triage/2026-03-20-backlog-triage-design.md`

---

## Parallelism

Tasks 1–3 (Celes) and Tasks 4–6 (Brunel) are **fully independent** — run them in parallel. Task 7 (final review) depends on both completing.

```
Celes: Task 1 → Task 2 → Task 3 ──┐
                                  ├─→ Task 7 (Lead)
Brunel: Task 4 → Task 5 → Task 6 ─┘
```

## File Structure

All files created under `designs/new/backlog-triage/`:

| File | Responsibility |
|---|---|
| `roster.json` | Team members, models, prompt file paths, lore |
| `common-prompt.md` | Mission, communication rules, pipeline protocol, verdict definitions |
| `prompts/team-lead.md` | Lead agent prompt — ticket routing, Jira writes, report compilation |
| `prompts/archivist.md` | Issue researcher prompt — GitHub issues/PRs search |
| `prompts/forensic.md` | Code researcher prompt — commits, diffs, codebase search |
| `prompts/consul.md` | Stakeholder advocate prompt — evidence evaluation, verdict rendering |
| `container/Dockerfile.backlog-triage` | Debian-based container (no Wrangler, no Dynamics, simpler than hr-devs) |
| `container/docker-compose.backlog-triage.yml` | Compose file with env vars, volumes, ports |
| `container/entrypoint-backlog-triage.sh` | Container entrypoint — clone repo, build Jira MCP, SSH, env setup |

---

## Task 1: Roster (Celes)

**Assigned to:** Celes (Agent Resources Manager)
**Files:**

- Create: `designs/new/backlog-triage/roster.json`

- [ ] **Step 1: Write roster.json**

```json
{
  "name": "backlog-triage",
  "description": "Cross-reference Jira VL backlog with GitHub hr-platform to identify closeable tickets.",
  "commonPromptFile": "common-prompt.md",
  "workDir": "$HOME/workspace",
  "members": [
    {
      "name": "team-lead",
      "agentType": "team-lead",
      "model": "claude-opus-4-6",
      "prompt": "prompts/team-lead.md",
      "lore": { "fullName": "TBD by Celes", "origin": "TBD", "significance": "TBD" }
    },
    {
      "name": "archivist",
      "agentType": "general-purpose",
      "model": "claude-sonnet-4-6",
      "color": "yellow",
      "prompt": "prompts/archivist.md",
      "lore": { "fullName": "TBD by Celes", "origin": "TBD", "significance": "TBD" }
    },
    {
      "name": "forensic",
      "agentType": "general-purpose",
      "model": "claude-sonnet-4-6",
      "color": "blue",
      "prompt": "prompts/forensic.md",
      "lore": { "fullName": "TBD by Celes", "origin": "TBD", "significance": "TBD" }
    },
    {
      "name": "consul",
      "agentType": "general-purpose",
      "model": "claude-opus-4-6",
      "color": "green",
      "prompt": "prompts/consul.md",
      "lore": { "fullName": "TBD by Celes", "origin": "TBD", "significance": "TBD" }
    }
  ]
}
```

Celes fills in the lore fields — names, origins, and significance that match each agent's role. The structural fields (model, agentType, prompt path, color) are fixed per the design spec.

- [ ] **Step 2: Review roster for completeness**

Verify: 4 members, correct models (lead+consul=opus, archivist+forensic=sonnet), prompt paths match file structure, workDir is `$HOME/workspace`.

- [ ] **Step 3: Commit**

```bash
git add designs/new/backlog-triage/roster.json
git commit -m "feat(backlog-triage): add roster.json with team composition"
```

---

## Task 2: Common Prompt (Celes)

**Assigned to:** Celes
**Files:**

- Create: `designs/new/backlog-triage/common-prompt.md`

- [ ] **Step 1: Write common-prompt.md**

Must include these sections:

1. **Team** — name, members with roles, mission statement
2. **Workspace** — repo layout (`~/workspace/hr-platform/`), output files (`todo.md`, `toconfirm.md`, `done.md`)
3. **Communication Rule** — timestamp format `[YYYY-MM-DD HH:MM]`, mandatory report after each task
4. **Author Attribution** — `(*BT:<AgentName>*)` format (BT = Backlog Triage)
5. **Pipeline Protocol** — the 5-step sequential flow per ticket:
   - Step 1: Lead picks ticket via `jira_get_issue`, sends to Archivist
   - Step 2: Archivist searches GitHub issues/PRs, reports to Lead
   - Step 3: Forensic searches commits/code, reports to Lead
   - Step 4: Consul evaluates evidence, renders verdict
   - Step 5: Lead acts on verdict (update docs, post to Jira, transition if `done`)
6. **Verdict Definitions** — the three verdicts with exact actions:
   - `not_connected` → append to `todo.md`, no Jira action
   - `needs_confirmation` → append to `toconfirm.md`, post Jira comment with evidence links
   - `done` → append to `done.md`, post Jira comment with evidence links, transition to Done (ID 31)
7. **Jira Reference** — project VL, transition IDs (11=To Do, 21=In Progress, 31=Done, 41=Open)
8. **GitHub Reference** — repo `Eesti-Raudtee/hr-platform`, use `gh` CLI for issues/PRs, `git log` for commits
9. **Shutdown Protocol** — same as framework-research (scratchpad, closing message with tags, approve)

- [ ] **Step 2: Review for completeness against spec**

Verify all 9 sections present. Pipeline and verdict definitions must match the spec exactly.

- [ ] **Step 3: Commit**

```bash
git add designs/new/backlog-triage/common-prompt.md
git commit -m "feat(backlog-triage): add common-prompt.md with pipeline and verdict protocol"
```

---

## Task 3: Agent Prompts (Celes)

**Assigned to:** Celes
**Files:**

- Create: `designs/new/backlog-triage/prompts/team-lead.md`
- Create: `designs/new/backlog-triage/prompts/archivist.md`
- Create: `designs/new/backlog-triage/prompts/forensic.md`
- Create: `designs/new/backlog-triage/prompts/consul.md`

- [ ] **Step 1: Write team-lead.md**

Lead agent prompt. Key responsibilities:

- On startup: query Jira backlog with `jira_search` (JQL: `project = VL AND statusCategory != Done ORDER BY key ASC`), build the work queue
- Pick next ticket, read with `jira_get_issue`, send details to Archivist
- Receive reports from Archivist and Forensic, forward to next agent in pipeline
- Receive verdict from Consul, execute the action:
  - Post Jira comment via `jira_update_issue` with evidence links
  - Transition via `jira_transition` (ID 31) for `done` verdicts
  - Append row to the correct output file (`todo.md`, `toconfirm.md`, or `done.md`)
- Track progress — which tickets are processed, which remain
- Access: all 4 Jira MCP tools, `gh` CLI

- [ ] **Step 2: Write archivist.md**

Issue researcher prompt. Key responsibilities:

- Receive a Jira ticket (key, summary, description) from Lead
- Search GitHub issues: `gh issue list --repo Eesti-Raudtee/hr-platform --state all --search "<keywords>"`
- Search PRs: `gh pr list --repo Eesti-Raudtee/hr-platform --state all --search "<keywords>"`
- Read promising issues/PRs with `gh issue view` / `gh pr view` for details
- Extract keywords from the Jira ticket — feature names, component names, Estonian terms
- Report: list of matching GitHub issues/PRs with links and relevance explanation
- Access: `jira_get_issue` (read ticket directly), `gh` CLI (issues/PRs only), no codebase access
- Strictly read-only — no writes to any system

- [ ] **Step 3: Write forensic.md**

Code researcher prompt. Key responsibilities:

- Receive a Jira ticket + Archivist's issue findings from Lead
- Search commits: `git log --all --oneline --grep="<keyword>"` for message matches
- Search code changes: `git log -S "<string>" --oneline` (pickaxe) for added/removed code
- Search current codebase: grep/glob for files implementing the described feature
- Check test files for tests validating the described behavior
- Cross-reference with Archivist's findings — do the linked issues have commits?
- Report: list of matching commits (hash + message), relevant files, test coverage
- Access: `jira_get_issue`, git commands, file reading — no GitHub issue/PR access, no writes

- [ ] **Step 4: Write consul.md**

Stakeholder advocate prompt. Key responsibilities:

- Receive a Jira ticket + all evidence (Archivist's issues + Forensic's commits/code) from Lead
- Evaluate with product lens:
  - Does the evidence satisfy the ticket's **intent**, not just touch related code?
  - Is the implementation complete or partial?
  - Are there UI/UX aspects that can't be verified from code? → flag for manual review
- Render one of three verdicts with justification:
  - `not_connected` — no evidence found, or evidence is unrelated
  - `needs_confirmation` — evidence exists but intent match is uncertain, or UI verification needed
  - `done` — clear evidence that the ticket's requirement is fully implemented
- Access: `jira_get_issue`, `gh` CLI (to verify links), file reading (to spot-check code)
- Strictly read-only — no writes to any system

- [ ] **Step 5: Review all 4 prompts**

Verify:

- Each prompt references `common-prompt.md` for team-wide standards
- Access boundaries match the spec's access matrix (Section 4)
- No agent has write access to Jira except Lead
- Scratchpad paths are defined for each agent

- [ ] **Step 6: Commit**

```bash
git add designs/new/backlog-triage/prompts/
git commit -m "feat(backlog-triage): add agent prompts for lead, archivist, forensic, consul"
```

---

## Task 4: Dockerfile (Brunel)

**Assigned to:** Brunel (Containerization Engineer)
**Files:**

- Create: `designs/new/backlog-triage/container/Dockerfile.backlog-triage`

**Reference:** `designs/new/hr-devs/container/Dockerfile.hr-devs` — adapt, don't copy. This team is simpler:

- No Wrangler CLI (no Cloudflare deploys)
- No Dynamics MCP (not needed)
- No Vite/dev server port
- Debian base instead of Ubuntu (`ai-teams-claude:latest` is Ubuntu — must use a Debian base image instead)

- [ ] **Step 1: Write Dockerfile**

Key differences from hr-devs:

- `FROM debian:bookworm-slim` (not `FROM ai-teams-claude:latest`)
- Install from scratch: Node.js 22, git, gh CLI, openssh-server, tmux, locales, gosu, curl, jq
- No Wrangler
- SSH port: 2226 (next available after hr-devs' 2225)
- Expose only 2226 (SSH) — no dev server ports needed
- Claude Code native install
- Timezone Europe/Tallinn

- [ ] **Step 2: Verify Dockerfile builds cleanly**

```bash
# Dry-run syntax check
docker build --check -f designs/new/backlog-triage/container/Dockerfile.backlog-triage .
```

- [ ] **Step 3: Commit**

```bash
git add designs/new/backlog-triage/container/Dockerfile.backlog-triage
git commit -m "feat(backlog-triage): add Debian-based Dockerfile"
```

---

## Task 5: Docker Compose (Brunel)

**Assigned to:** Brunel
**Files:**

- Create: `designs/new/backlog-triage/container/docker-compose.backlog-triage.yml`

**Reference:** `designs/new/hr-devs/container/docker-compose.hr-devs.yml`

- [ ] **Step 1: Write docker-compose file**

Key settings:

- Port allocation: 2226 (SSH) — document in port allocation table
- Named volumes: `bt-claude-home` (Claude state), `bt-repo` (hr-platform repo)
- No Dynamics data bind mount
- No Cloudflare env vars
- Required env vars: `GITHUB_TOKEN`, `ANTHROPIC_API_KEY` (or OAuth), `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`
- WARP CA cert bind mount (same as other containers)
- `network_mode: host`
- `working_dir: /home/ai-teams/workspace/hr-platform`
- `restart: unless-stopped`
- Git attribution: `GIT_USER_NAME=backlog-triage`

- [ ] **Step 2: Review compose against Dockerfile**

Verify: ports match, volume paths match, env vars match entrypoint expectations.

- [ ] **Step 3: Commit**

```bash
git add designs/new/backlog-triage/container/docker-compose.backlog-triage.yml
git commit -m "feat(backlog-triage): add docker-compose with ports and volumes"
```

---

## Task 6: Entrypoint Script (Brunel)

**Assigned to:** Brunel
**Files:**

- Create: `designs/new/backlog-triage/container/entrypoint-backlog-triage.sh`

**Reference:** `designs/new/hr-devs/container/entrypoint-hr-devs.sh` — simplify significantly.

- [ ] **Step 1: Write entrypoint script**

Steps the entrypoint must perform:

1. Fix hostname resolution (`network_mode: host`)
2. WARP TLS CA → system CA store (if mounted)
3. Fix volume ownership (Docker creates as root)
4. Validate required env vars: `GITHUB_TOKEN`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`
5. Clone/pull `Eesti-Raudtee/hr-platform` to `~/workspace/hr-platform`
6. Clone/pull `Eesti-Raudtee/dev-toolkit` to `~/workspace/dev-toolkit` (for Jira MCP server)
7. Build Jira MCP server (`npm ci && npm run build` in `dev-toolkit/jira-mcp-server/`)
8. Runtime validation: Node.js >= 20, claude available, hr-platform repo exists, Jira MCP built
9. Persist env vars to `.bashrc` (for SSH sessions)
10. tmux config + auto-tmux on SSH login (session name: `backlog-triage`)
11. Git attribution
12. Claude `settings.json` (first run): permissions allow list, no Wrangler/Cloudflare tools
13. Claude `mcp.json` (first run): Jira MCP only (no Dynamics)
14. SSH key install + start sshd on port 2226
15. Drop privileges and exec

Omit compared to hr-devs:

- No Dynamics MCP build or config
- No Dynamics data validation
- No Wrangler validation
- No Vite port config
- No Cloudflare env vars

- [ ] **Step 2: Review entrypoint against Dockerfile and compose**

Verify: ports match (2226), volume paths match, env var names match compose, validation gates match Dockerfile installs.

- [ ] **Step 3: Commit**

```bash
git add designs/new/backlog-triage/container/entrypoint-backlog-triage.sh
git commit -m "feat(backlog-triage): add entrypoint script for container setup"
```

---

## Task 7: Final Review & Push

**Assigned to:** Team Lead (Aeneas)

- [ ] **Step 1: Verify all files exist**

```
designs/new/backlog-triage/
├── 2026-03-20-backlog-triage-design.md   (spec — already committed)
├── 2026-03-20-backlog-triage-plan.md     (this plan)
├── roster.json
├── common-prompt.md
├── prompts/
│   ├── team-lead.md
│   ├── archivist.md
│   ├── forensic.md
│   └── consul.md
└── container/
    ├── Dockerfile.backlog-triage
    ├── docker-compose.backlog-triage.yml
    └── entrypoint-backlog-triage.sh
```

- [ ] **Step 2: Cross-check roster ↔ prompts ↔ common-prompt**

Verify: roster prompt paths point to correct files, common-prompt team member list matches roster, pipeline protocol in common-prompt matches individual agent prompts.

- [ ] **Step 3: Cross-check container files**

Verify: Dockerfile port matches compose port matches entrypoint sshd port (2226). Compose env vars match entrypoint validation. Volume paths consistent.

- [ ] **Step 4: Push**

```bash
git push
```

- [ ] **Step 5: Report to PO**

Present the complete design for final review before deployment.
