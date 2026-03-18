# Safety & Guardrails

Blast radius limits, permissions, enforcement mechanisms, and safety architecture for multi-team AI agent systems.

---

## Design Principle (*FR:Montesquieu*)

Safety in an AI agent framework is not a single mechanism — it is a layered system where each layer compensates for the failure modes of the layer below it. No single guardrail is sufficient. Prompt-level restrictions can be ignored. CI gates only catch what they test for. Audits are periodic, not real-time. The goal is defense in depth: every safety-critical boundary is enforced at multiple layers.

The framework distinguishes three safety concerns:

1. **Blast radius** — how much damage can an agent cause if it acts incorrectly?
2. **Authority compliance** — is the agent making decisions within its delegated scope?
3. **Quality preservation** — is the team maintaining its output standards over time?

Each concern has different enforcement mechanisms. Blast radius is primarily structural (tool restrictions, file permissions). Authority compliance is primarily behavioral (prompt instructions, peer enforcement). Quality preservation is primarily observational (CI gates, audits, trend tracking).

---

## Evidence Base: Documented Safety Incidents (*FR:Finn*, *FR:Montesquieu*)

The safety architecture in this document is grounded in empirical evidence from 12 documented incidents across two reference teams and one autonomous team. These incidents demonstrate which enforcement mechanisms work, which fail, and where gaps exist.

### Critical Incidents

| # | Incident | Severity | Enforcement that failed | Enforcement that caught it | Lesson |
|---|---|---|---|---|---|
| 1 | **$5K MCP data loss** — `workers-bindings` MCP `d1_database_query` has no read-only mode, hits production DB. WHERE-less UPDATE caused $5,000 loss. | CRITICAL | Prompt-level "be careful" — behavioral enforcement failed entirely | Post-hoc discovery | **Strongest argument for infrastructure enforcement.** Prompt-level restrictions are insufficient for production database access. |
| 2 | **SQL injection in dynamics sync** — `sync/src/dynamics-api-service.ts` uses string interpolation, not parameterized queries. | HIGH | No enforcement caught it before deployment | Medici health audit flagged; Marcus cross-referenced | Infrastructure-level enforcement (parameterized query requirement in CI lint rules) would have prevented this |
| 3 | **SENDING status stuck** — `send` action sets all conversations to SENDING before API call. If API throws, no recovery path. | HIGH | No enforcement — architectural design gap | Finn's code audit | Transactional safety patterns need enforcement at the architectural level, not just code review |
| 4 | **`unblockExitConversation` silent data corruption** — sets `exit_blocked=0` but leaves `deleted_at` set. Employee stays invisible. | MEDIUM | No tests covered this path | Finn code review + test-gaps analysis | Missing test coverage for state transition edge cases |
| 5 | **Figma rate limit exhaustion** — 6 req/month limit. Token syntax (`$FIGMA_PAT` vs `${FIGMA_PAT}`) caused 403 that still counted. Recovery: 4.5 days. | MEDIUM | Initial prompt-level "be careful" insufficient | Evolved into 7 operational rules + Medici enforcement | Shows the Known Pitfalls feedback loop in action |
| 6 | **`hasElevatedRights` security bypass** — `||` fallback applied in production, would bypass Cloudflare Access. | HIGH | Implementation (agent wrote the bypass) | Marcus code review (E3) — caught as YELLOW, fixed to GREEN | **Code review is the last defense before production.** |
| 7 | **False green tests** — `LIMIT 1` returns wrong questionnaire; assertions pass trivially. | MEDIUM | CI gate passed (tests green, but testing nothing) | Marcus code review (E3) | CI gates have a blind spot: tests that pass but don't test what they claim |
| 8 | **Vite `?raw` shipping 82KB test data to production** — top-level import bundles into all builds. | LOW | CI build passed (file is valid) | Marcus code review (E3) | Build-time safety requires review, not just compilation |
| 9 | **Agent spawn duplicates** — repeated violation in MEMORY.md. Wastes tokens, creates `name-2` clutter. | LOW | MEMORY.md rule exists but repeatedly violated | Human PO noticed pattern | Behavioral rules need stronger reinforcement for repeated violations |
| 10 | **Worktree isolation ignored** — parallel agents without worktree isolation cause branch conflicts and lost work. | MEDIUM | MEMORY.md rule exists but repeatedly violated | Human PO noticed pattern | Same as #9 — repeated behavioral violations need structural enforcement |
| 11 | **Plaintext credentials in MCP config** — `mcp.json` contains plaintext Jira API token inline. | MEDIUM | No enforcement — design gap | Herald analysis for T05 | Credential exposure risk scales with team count |
| 12 | **npm audit: 9 vulnerabilities including SSRF and XSS** — 5 high, 3 moderate, 1 low in hr-platform dependencies. | HIGH | No automated dependency audit | Piper (CI agent) ran `npm audit` | CI quality gates catching real security issues |

### Incident Distribution by Enforcement Layer

| Caught by | Count | Examples |
|---|---|---|
| **E3: Code review (Marcus)** | 4 | #6, #7, #8, #12 |
| **E4: Health audit (Medici/Finn)** | 3 | #2, #3, #4 |
| **Post-hoc / human discovery** | 3 | #1, #9, #10 |
| **Evolved enforcement (feedback loop)** | 1 | #5 |
| **Design analysis (no enforcement existed)** | 1 | #11 |

**Key insight:** Code review (E3) is the most effective detective mechanism — it caught 4 of 12 incidents that no other layer detected. But the most damaging incident (#1, $5K loss) was caught by NO enforcement layer. This validates the defense-in-depth principle: the most catastrophic failures occur where no enforcement layer exists at all.

### Identified Gaps (*FR:Finn*)

Finn's analysis identified 6 enforcement gaps. This table maps each gap to the T07 section that addresses it:

| Gap | Risk | Addressed by |
|---|---|---|
| No infrastructure-level file access control | Low (behavioral holds) but doesn't scale | §Blast Radius Containment — container isolation, read-only mounts |
| No credential isolation | Medium — cross-team credential access at scale | §Blast Radius Containment — credential scoping; T05 per-team tokens |
| No automated runaway detection | Medium — human must notice and kill | §Runaway Agent / Runaway Team Detection |
| No kill switch | Low in single-team, high at scale | §Circuit Breakers — Emergency PO override / HALT protocol |
| No deployment lock | Medium at scale | T02 Protocol R2 (deployment locks); §Cascade Failure Prevention |
| No rate limit enforcement | Already caused near-misses (incident #5) | T02 Protocol R4 (rate limit partitioning); §Circuit Breakers |

---

## Permission Architecture (*FR:Montesquieu*)

### Design Rationale

The current 4-tier permission list (Never / Human approval / Team-lead approval / Any agent) captures the right intuition but lacks two things: (1) the dimensions that determine which tier an action belongs to, and (2) the enforcement mechanism for each tier.

Permission tiers are determined by three dimensions:

| Dimension | Question | Higher risk = |
|---|---|---|
| **Reversibility** | Can this action be undone? | Irreversible actions require higher authority |
| **Blast radius** | How many systems/teams/users does this affect? | Wider blast radius requires higher authority |
| **External visibility** | Can people outside the team see the result? | Externally visible actions require human review |

### Permission Tiers

#### Tier 0: Absolute Prohibitions (no agent, no authority level, never)

These actions are forbidden regardless of role, team, or authorization level. No emergency protocol overrides them. They represent risks where the cost of a single occurrence exceeds the value of any task.

| Action | Dimension | Rationale |
|---|---|---|
| Force push to main/production | Irreversible + wide blast radius | Overwrites shared history; affects all teams; no safe recovery |
| Delete production databases | Irreversible + wide blast radius | Data loss is permanent |
| Send external emails without PO review | External visibility | Organizational reputation risk; cannot unsend |
| Modify CI/CD pipeline security settings | Wide blast radius | Weakens safety for all subsequent operations |
| Access other teams' credentials | Wide blast radius | Violates team isolation boundary; enables lateral movement |
| Disable or bypass safety gates | Undermines defense in depth | Removes the enforcement layer that catches downstream errors |
| Self-escalate permissions | Authority violation | No agent may grant itself higher authority (T05 hard rule) |
| Delete another team's files or branches | Cross-team blast radius | Violates team boundary; only PO may affect another team's artifacts |

**Enforcement:** Prompt-level instruction in every agent's prompt (L2 governance layer). Peer enforcement by teammates (L3 layer). Medici audit flags violations (T08 layer). For containerized teams, infrastructure-level enforcement where possible (file permissions, read-only mounts).

#### Tier 1: Human Approval Required (PO decides, agents may recommend)

These actions are reversible in principle but have production, financial, or organizational consequences that require human judgment.

| Action | T04 reference | Enforcement |
|---|---|---|
| Production deployments | Row 19 | Deployment lock requires PO grant (T02 Protocol R2) |
| Database migrations on production | Row 21 | Migration queue requires PO approval for production (T02 Protocol R3) |
| External API integrations (new) | Row 8 (technology stack) | PO approval at team creation or on escalation request |
| Creating/modifying Jira issues | Row 22 | Constitutional rule in workspace MEMORY.md |
| Team creation or dissolution | Rows 1, 2 | PO exclusive; no delegation |
| Spec handoff to downstream team | T04 Q3 | Commits another team's resources |
| Architecture decisions (cross-team) | Row 6 | Strategic scope |
| Governance document amendments | Rows 36-38 | Constitutional authority |
| Merge develop to main | Row 15 | Production-path merge |

**Enforcement:** Prompt-level "Always PO" instruction. Delegation matrix reference in common-prompt authority quick-reference. Manager agent (L1) blocks operations requiring PO approval when PO is unavailable (T04 Emergency Authority Protocol permits only temporary triage, never permanent decisions).

#### Tier 2: Team-Lead Approval Required

These actions are within the team's scope but require the coordinator's judgment to prevent uncoordinated work.

| Action | T04 reference | Enforcement |
|---|---|---|
| PR merges to develop | Row 14 | Team-lead merges after reviewer GREEN |
| Dev environment deployments | Row 17 | Team-lead owns deployment schedule |
| Branch strategy decisions | Row 9 | Team-lead sets branching model |
| Spawn agents within approved roster | Row 4 | Team-lead controls spawn order |
| Dev database migrations | Row 20 | Team-lead coordinates with implementer |
| Close GitHub issues | Row 16 | Team-lead exclusive — governance signal |
| Assign code reviewers | Row 32 | Team-lead delegates to reviewer specialist |

**Enforcement:** Prompt-level role boundaries in specialist prompts ("report to team-lead, do not merge independently"). Anti-pattern tables in team-lead prompts reinforce the boundary from the coordinator side.

#### Tier 3: Specialist Autonomy (any authorized agent)

These actions are low-risk, reversible, and contained within the agent's owned scope. They require no approval — the agent acts and reports.

| Action | Constraint | Enforcement |
|---|---|---|
| Read code, docs, data files | Within team's readable scope | Directory ownership table in common-prompt |
| Run tests locally | Own code only | Prompt instruction |
| Create feature branches | Under team's branch prefix | Branch naming convention (T02 Protocol R1) |
| Make commits to feature branch | Own branch only | Prompt instruction; CI gates catch cross-branch contamination |
| Create GitHub issues | Labeling conventions | Agent-managed; no approval needed (Row 24) |
| Comment on GitHub issues/PRs | — | — |
| Write to own scratchpad | Personal memory file | File ownership in common-prompt |
| Local development operations | No external side effects | — |

**Enforcement:** Directory ownership tables in common-prompt (T02). Branch prefix conventions. Post-hoc audit by Medici.

---

## Enforcement Layers (*FR:Montesquieu*)

### The Enforcement Stack

Safety is enforced at five layers. Each layer has a different failure mode, and the stack is designed so that no single layer's failure defeats the entire safety system.

| Layer | Mechanism | What it catches | Failure mode | Compensating layer |
|---|---|---|---|---|
| **E0: Prompt instruction** | Agent's own prompt contains restrictions | Self-aware agents comply voluntarily | Context pressure, prompt dilution, or LLM non-compliance | E1 (peer enforcement) |
| **E1: Peer enforcement** | Teammates observe and message a reminder on boundary violations | Violations visible to other agents in the same session | Peer agent distracted or not monitoring; violation in tool call not visible to peers | E2 (CI gate) |
| **E2: CI gate** | Automated checks: build, lint, test, type check | Code quality, build breakage, type errors, lint violations | Only catches what is tested; missing test coverage is invisible | E3 (review) |
| **E3: Review** | Code review by reviewer agent (Marcus or equivalent); spec review by domain expert | Logical errors, spec non-compliance, security vulnerabilities, missing tests | Reviewer quality depends on agent capability; review-of-reviewer problem | E4 (audit) |
| **E4: Audit** | Medici health audit; cross-team audit; PO spot-check | Drift, regression, stale knowledge, authority violations, quality erosion trends | Periodic (not real-time); delayed detection; only as thorough as audit scope | E0 (prompt update based on audit findings) |

**The feedback loop:** Audit findings (E4) feed back into prompt updates (E0). Known Pitfalls sections in common-prompts are the living record of this feedback loop. Each entry represents a real incident that was detected by audit or observation, then codified as a prompt-level restriction to prevent recurrence. Incident #5 (Figma rate limit) demonstrates this cycle: initial prompt-level "be careful" failed; after near-misses, 7 operational rules were codified into the prompt; Medici verified compliance in subsequent audits.

**Cross-reference with Finn's enforcement taxonomy:** Finn identified 5 enforcement mechanisms in reference teams: (1) agent prompt restrictions, (2) peer enforcement, (3) quality gates (CI), (4) PR template checklist, (5) health audits (Medici). These map directly to the E0-E4 stack above — Finn's mechanisms #1-#2 are E0-E1, #3-#4 are E2, and #5 is E4. E3 (code review) is implicit in Finn's taxonomy but is the single most effective detective mechanism: it caught 4 of 12 documented incidents (see Evidence Base).

**The infrastructure enforcement gap:** The $5K MCP incident (#1 in Evidence Base) is the strongest evidence that behavioral enforcement alone is insufficient for production-critical resources. Prompt-level "be careful" did not prevent a WHERE-less UPDATE on a production database. For Tier 0 prohibitions (production DB access, deployment credentials), infrastructure enforcement (read-only mounts, token scoping, CI branch protection) is not optional — it is the minimum viable safety measure.

### Enforcement per Tier

| Tier | Primary enforcement | Secondary enforcement | Tertiary enforcement |
|---|---|---|---|
| **T0: Absolute** | E0 (prompt) + E1 (peer) | Infrastructure (read-only mounts, no deploy token) | E4 (Medici audit flags) |
| **T1: Human** | E0 (prompt: "Always PO") + delegation matrix reference | E4 (Medici audit: authority compliance check) | Manager agent (L1) blocks when PO unavailable |
| **T2: Team-lead** | E0 (prompt: "report to team-lead") | E1 (peer: "you merged without TL approval") | E4 (Medici audit: role boundary check) |
| **T3: Specialist** | E2 (CI gate catches breakage) + E3 (review) | E4 (Medici audit: test coverage trends) | E0 (prompt: directory ownership) |

---

## Blast Radius Containment (*FR:Montesquieu*)

### Principle

Every agent has a blast radius — the maximum damage it can cause if it acts incorrectly or maliciously. The framework minimizes blast radius through containment: restricting each agent to the smallest scope needed for its role.

### Blast Radius by Role

| Role | Can modify | Cannot modify | Blast radius |
|---|---|---|---|
| **PO (human)** | Everything | — | Entire organization |
| **Manager agent (L1)** | Own memory directory only | Source code, team files, prompts, rosters | Cross-team coordination state only |
| **Team-lead (L2)** | Team memory directory, roster | Source code, config, other teams | Team configuration only |
| **Specialist (L3)** | Owned directories, own branch | Other agents' directories, other branches, other teams | Own feature scope only |

### Containment Mechanisms

#### 1. Directory Ownership (behavioral, enforced by prompt)

Every team's common-prompt includes a directory ownership table (see apex-research common-prompt for canonical example):

```markdown
| Directory | Owner (write) | Readers |
|---|---|---|
| inventory/ | Champollion | Nightingale, Hammurabi, Schliemann |
| shared/ | Nightingale | Berners-Lee, Hammurabi, Schliemann |
| dashboard/ | Berners-Lee | Schliemann (review) |
| specs/ | Hammurabi | Schliemann (review), all (read) |
```

**Design requirement:** Every team's common-prompt MUST include a directory ownership table. This is the primary blast radius control for specialist agents.

**Empirical validation (apex-research):** Schliemann's RFC #3 pushback provides evidence that directory ownership as behavioral enforcement is sufficient for pipeline architectures: 37 commits across 4 agents with zero conflicts, because no two agents write to the same directory. The PO ratified this by choosing "directory ownership, not branch isolation" (RFC #3 Q7). The failure mode when directory ownership is violated is a merge conflict — visible, fixable, not data loss. This makes it an acceptable risk for pipeline teams. The same argument does NOT hold for shared-write scenarios (two agents writing to the same directory), where structural isolation (worktrees or separate repos) is necessary.

#### 2. Tool Restrictions (behavioral, enforced by prompt)

Tool restriction tables in agent prompts define FORBIDDEN and ALLOWED tools per role. The pattern from both reference teams:

**Team-lead restrictions (canonical pattern):**
- FORBIDDEN: Edit/Write on source code, running builds/tests/deployments, git add/commit/push, reading source code for implementation understanding
- ALLOWED: Read team config, Edit/Write own memory directory, Bash for date/tmux/gh/git pull, SendMessage (primary tool), Task tools

**Manager agent restrictions (T04 design):**
- FORBIDDEN: All source code operations, all team file operations (except own memory), running builds/tests/deployments, messaging specialists directly
- ALLOWED: Read team rosters and summaries, Edit/Write own memory directory, Bash for date/gh, SendMessage to team-leads only, Task tools

**Specialist restrictions (implicit in prompt scope):**
- FORBIDDEN: Writing outside owned directories, cross-team communication, closing issues, modifying Jira
- ALLOWED: Full development tools within owned scope

#### 3. Branch Isolation (structural, enforced by git)

Per-team branch prefixes (T02 Protocol R1) limit blast radius:
- Agent can only create branches under team prefix
- Merge to shared branches requires merge lock via manager agent
- Force-push is a Tier 0 prohibition

#### 4. Container Isolation (structural, for containerized teams)

For teams running in Docker containers (apex-research pattern):
- Filesystem isolation: container only mounts the directories the team needs
- Read-only mounts for reference data (e.g., `vjs_apex_apps` mounted read-only)
- Per-team credentials: container only has the team's API tokens (T05)
- Network isolation: container can only reach necessary services

#### 5. Credential Scoping (structural, via T05)

Per-team API tokens limit blast radius:
- A compromised research team token cannot deploy to production
- A compromised dev team token cannot access another team's repositories
- Org-wide tokens (Jira, Figma) are the blast radius exception — mitigated by behavioral restriction (only teams with mission-relevant access load the token)

---

## Authority Compliance (*FR:Montesquieu*)

### The Problem

Authority compliance is whether agents are making decisions within their delegated scope (T04 delegation matrix). Unlike blast radius (which is about capability), authority compliance is about behavior — an agent may have the technical ability to do something but not the organizational authority.

### Detection Mechanisms

| Mechanism | What it detects | Frequency | Reliability |
|---|---|---|---|
| **Self-check prompt** | Agent pauses before acting: "Am I routing, or am I deciding something that belongs to PO or team-lead?" | Per action | Low — self-regulation under token pressure is unreliable |
| **Peer observation** | Teammates notice team-lead editing source code or specialist closing issues | Per observation | Medium — depends on teammate attention |
| **Scratchpad audit** | Medici reads scratchpads for evidence of authority-level decisions | Per session | Medium — only catches decisions that were written down |
| **Git history audit** | Who committed what, when, to which branch | Post-hoc | High — git is authoritative; but only for git-tracked actions |
| **Decision log review** | PO reviews emergency decision log and manager agent actions | Per session | High — but only for documented decisions |

### Common Authority Violations and Prevention

| Violation | Role | How it happens | Prevention | Detection |
|---|---|---|---|---|
| **TL implements** | Team-lead | "Quick fix" — TL reads source code and edits directly | Anti-pattern table in TL prompt; spawn-before-delegate rule | Peer enforcement; Medici audit of TL scratchpad |
| **Specialist closes issue** | Specialist | Specialist assumes issue is done and closes it | Prompt: "Closing issues is team-lead's exclusive responsibility" | Git/GitHub audit: who closed the issue? |
| **Agent creates Jira** | Any | Agent proactively creates Jira issues to "be helpful" | Constitutional rule: "agents never create Jira on own initiative" | Jira audit log; MEMORY.md enforcement |
| **TL approves production deploy** | Team-lead | TL deploys to production under time pressure | Prompt: "Always PO" for production (Row 19) | Deployment log; Medici audit |
| **Agent bypasses review** | Specialist | Merges PR without waiting for reviewer GREEN | CI gate: require review status before merge | PR audit: was review completed? |
| **TL makes architecture decision** | Team-lead | TL picks a technology/approach without escalating | Prompt: "Affects other teams → escalate to L1/PO" (Row 7) | Scratchpad/ADR audit; Medici flags undocumented architecture changes |

### Authority Quick-Reference for Common-Prompts

Every team's common-prompt SHOULD include a decision authority section — a filtered view of the T04 delegation matrix showing only the decisions relevant to that team. This prevents the authority uncertainty pattern identified in the RFC #3 analysis: team-leads asking permission for decisions already within their authority.

**Template:**

```markdown
## Decision Authority

### You CAN decide (team-lead scope):
- Branch strategy, spawn order, task routing
- Dev environment deployments and dev DB migrations
- PR merge after reviewer GREEN
- Code review assignments
- GitHub issue creation and closure
- Spec approval (draft → reviewed → approved)

### You MUST escalate (PO scope):
- Production deployments and production DB migrations
- Spec handoff (approved → handed-off)
- Team composition changes
- Architecture decisions affecting other teams
- Jira operations
- External communication
- Governance document changes

### When in doubt: act and report.
If a decision is within your authority, make it, log it to your scratchpad,
and report to L1/PO. PO may reverse, but waiting is the worse failure mode
for an autonomous team.
```

---

## Quality Preservation (*FR:Montesquieu*)

### The Problem

Quality erodes gradually, not catastrophically. An agent under time pressure skips one test. Then another. The CI gate doesn't catch missing tests (only broken tests). The reviewer doesn't flag low coverage because there's no baseline. After several sessions, the team has a passing CI pipeline with 10% test coverage. No single actor caused the problem — it was a systemic failure of quality enforcement.

### Defense in Depth for Quality

| Layer | Mechanism | What it catches | Gap |
|---|---|---|---|
| **Prompt mandate** | Common-prompt TDD section: "RED -> GREEN -> REFACTOR" | Self-motivated agents comply | Erodes under time pressure; agent may interpret "test" loosely |
| **Delegation message** | Team-lead includes "write tests first" in task delegation | Reinforces prompt mandate per task | Only as reliable as team-lead's discipline |
| **CI gate** | `npm run build && npm run check && npm test` must pass before merge. Warning ratchet: `eslint --max-warnings=N` with decreasing threshold ensures quality only improves. | Build breakage, type errors, test regressions, warning count increase | Does NOT catch missing tests for new features |
| **PR test summary** | PR template includes "Tests added: [yes/no, what]" | Creates audit trail; patterns of "no tests" become visible | Self-reported — agent can claim tests exist when they don't |
| **Code review** | Reviewer checks test coverage and quality | Catches missing tests, weak assertions, incomplete coverage | Reviewer capability varies; review-of-reviewer problem |
| **Periodic audit** | Medici tracks test coverage trends across sessions | Catches slow quality erosion that no single-session check reveals | Delayed — by the time audit detects the trend, multiple sessions of low-quality work have been committed |

**No single layer is sufficient.** The combination of all six layers provides defense in depth. The critical gap — missing tests for new features — is only caught by review (E3) and audit (E4). This makes review and audit the most important quality enforcement mechanisms, not CI.

### Quality Enforcement for Autonomous Teams

Autonomous teams (like apex-research) face additional quality risks:

1. **No real-time PO oversight** — PO cannot spot-check quality during the session
2. **TDD pair enforcement** — when the PO mandates TDD pairs (RED then GREEN), who enforces the sequencing? (Apex-research RFC #3 Q4 — PO directive: "RED always before GREEN, never parallel")
3. **Quality erosion across sessions** — no single session is responsible; the trend emerges only over time

**Enforcement design for autonomous teams:**

| Mechanism | Scope | Who implements |
|---|---|---|
| CI gate with test run | Per commit/PR | Team-lead sets up GitHub Actions workflow |
| TDD sequence enforcement | Per task | Team-lead delegation message: "Nightingale writes tests FIRST, then Berners-Lee implements" |
| PR template with test checklist | Per PR | Common-prompt specifies template |
| Medici cross-team audit | Per session | Framework-research Medici, routed via L1 |
| Test coverage trend tracking | Cross-session | Medici compares coverage metrics across health reports |

---

## Guardrails for Autonomous Teams (*FR:Montesquieu*)

### The Autonomous Team Governance Gap

The framework's safety model was designed for teams with real-time PO presence. PO observes, intervenes, corrects. Autonomous teams (containerized, running across sessions without PO contact) need additional guardrails because the PO feedback loop is delayed.

### Drift Prevention

**Drift** is when a team gradually deviates from its mission, quality standards, or authority boundaries without any single decision being wrong. Each step is small and reasonable in isolation; the aggregate direction is problematic.

| Drift type | Example | Detection | Prevention |
|---|---|---|---|
| **Scope drift** | Research team starts implementing production features | Git diff: files outside team's owned directories | Directory ownership in common-prompt; Medici audit |
| **Quality drift** | Test coverage declining session over session | Test count/coverage trend across Medici reports | CI gate + periodic audit + TDD mandate in delegation |
| **Authority drift** | Team-lead regularly makes decisions above their level | Scratchpad/ADR analysis: decisions without corresponding authority | Self-check prompt; delegation matrix quick-reference in common-prompt |
| **Process drift** | Team stops using PRs "because trunk-based is faster" | PR count trend in git history | Common-prompt specifies process; Medici audit checks adherence |
| **Communication drift** | Team stops reporting to L1/PO | Absence of closing messages in inbox history | "MANDATORY: report after every task" rule in common-prompt |

### Circuit Breakers

Circuit breakers are automatic or semi-automatic shutdown triggers that halt work when safety boundaries are exceeded. Unlike guardrails (which prevent), circuit breakers detect and stop.

| Circuit breaker | Trigger | Action | Authority to override |
|---|---|---|---|
| **Build broken** | CI gate fails | PR cannot merge; agent must fix before proceeding | None — gate is absolute (Tier 0 analogue for code quality) |
| **Test suite failing** | Tests fail on commit | Agent cannot push until tests pass (prompt-level gate) | None — agent self-enforces |
| **Merge conflict on shared branch** | Git detects conflict during merge | Agent stops, reports to team-lead; team-lead coordinates resolution | Team-lead decides resolution approach |
| **Rate limit hit** | 429 response from API | Agent stops API calls, reports to team-lead, follows rate limit incident protocol (T02 Protocol R4) | Manager agent reallocates budget |
| **Agent stuck loop** | Agent retrying same failed command >3 times | Agent should stop and report the blocker to team-lead | Team-lead reassigns or provides alternative approach |
| **Emergency PO override** | PO sends "HALT" message | All agents in affected team(s) stop current work and await direction | PO only (Tier 0 authority) |

### Cascade Failure Prevention

A cascade failure is when one team's safety boundary violation propagates to other teams. Example: Team A pushes broken code to develop; Team B pulls develop and their build breaks; Team B wastes a session debugging Team A's problem.

| Cascade risk | Mechanism | Prevention |
|---|---|---|
| **Broken shared branch** | Team A pushes failing code to develop | CI gate must pass BEFORE merge (not after); merge lock ensures only one team merges at a time (T02 Protocol R1) |
| **Corrupted shared database** | Team A applies a bad migration to staging | Migration queue requires manager agent approval for shared DBs; destructive migrations get exclusive access (T02 Protocol R3) |
| **Rate limit exhaustion** | Team A burns shared API quota | Per-team soft quotas with reserve; rate limit alert protocol notifies all teams (T02 Protocol R4) |
| **Credential compromise** | Team A's token is exposed in logs | Per-team tokens limit blast radius; credential rotation protocol (T05) |
| **Spec quality failure** | Team A hands off a bad spec; Team B implements it | Spec lifecycle requires TL approval before handoff + PO approval for handoff itself (T04 Q3) |

---

## Safety Mechanisms — Summary (*FR:Montesquieu*)

### Preventive Mechanisms (stop bad things from happening)

| Mechanism | Layer | Scope | Evidence source |
|---|---|---|---|
| Prompt-level tool restrictions | E0 | Per agent | Both reference team-lead prompts |
| Directory ownership tables | E0 | Per team | Apex-research common-prompt |
| Anti-pattern tables | E0 | Per role | Both reference team-lead prompts |
| Self-check question before action | E0 | Per agent | Both reference team-lead prompts; manager agent design (T04) |
| Peer enforcement ("message a reminder") | E1 | Per team | hr-devs common-prompt line 210-221 |
| CI quality gates (build, lint, test, check) | E2 | Per PR | Both reference teams; apex RFC #3 ratified |
| PR template with checkboxes | E2 | Per PR | hr-devs common-prompt |
| Branch prefix conventions | E2 | Per team | T02 Protocol R1 |
| Container filesystem isolation | Infrastructure | Per team | Apex-research deployment |
| Per-team credential scoping | Infrastructure | Per team | T05 design |
| Merge/deploy/migration locks | Protocol | Cross-team | T02 Protocols R1-R3 |

### Detective Mechanisms (find bad things after they happen)

| Mechanism | Layer | Scope | Evidence source |
|---|---|---|---|
| Medici health audit | E4 | Per team (internal) / cross-team (external) | Both reference teams; T08 |
| Code review by reviewer agent | E3 | Per PR | Marcus role in both reference teams |
| Author attribution (`(*PREFIX:Agent*)`) | E4 | Per artifact | Both reference teams |
| Git history (blame, log, diff) | E4 | Per repo | Git itself |
| Shutdown closing messages | E4 | Per session | Lifecycle protocol (T06/T08) |
| Scratchpad evolution tracking | E4 | Cross-session | Medici regression scan (T08) |
| Emergency decision log | E4 | Cross-team | T04 Emergency Authority Protocol |
| Known Pitfalls as incident history | E4 | Per team | Both reference common-prompts |

### Corrective Mechanisms (fix bad things)

| Mechanism | Scope | Authority |
|---|---|---|
| Team-lead redirect message | Intra-team | Team-lead |
| PO override ("HALT") | Cross-team | PO only |
| Rollback on failed deploy | Per deployment | Team-lead (dev), PO (production) |
| Emergency authority protocol | Cross-team | Manager agent (scoped, time-bounded); PO (full) |
| Prompt update based on audit findings | Per team | Celes designs, PO approves (T04 Rows 37-38) |
| Known Pitfalls addition | Per team | Team-lead proposes, PO approves (T04 Row 37) |
| Post-incident review | Per incident | PO initiates; findings codified as prompt updates or governance amendments |

---

## Runaway Agent / Runaway Team Detection (*FR:Montesquieu*)

### Runaway Agent

A runaway agent is one that burns tokens without producing useful output — retrying failed commands, generating excessive output, or executing in a loop.

| Signal | Detection method | Response |
|---|---|---|
| Repeated bash failures | >3 consecutive bash errors on same command pattern | Agent should self-stop and report; team-lead intervenes |
| No checkpoint in long task | >15 minutes of work with no `[CHECKPOINT]` or `[PROGRESS]` message | Team-lead sends inquiry; if no response, agent may have crashed |
| Excessive output | Agent generating large files or many commits without task completion | Team-lead reviews; Medici flags in next audit |
| Token burn without progress | Task status unchanged while agent is active | Team-lead reassigns or restarts agent |

### Runaway Team

A runaway team is one where the team-lead is also part of the problem — either drifting alongside specialists or failing to enforce quality standards.

| Signal | Detection method | Response |
|---|---|---|
| All agents drifting in same direction | Medici cross-team audit: team output diverges from spec | L1/PO intervention |
| Quality metrics declining across sessions | Health report trend: increasing `[STALE]`, decreasing test coverage | L1/PO reviews health reports; corrective directive |
| Team operating beyond authority | Delegation matrix violations appearing in git/scratchpad history | PO reviews; prompt updates; potential team restructuring |
| Team ignoring audit findings | Medici findings persist >3 audit versions | PO escalation per T08 regression detection |
| Communication silence | Team stops reporting to L1/PO | PO checks team health; container-level liveness check for containerized teams |

### Kill Switch

PO can halt all teams instantly by broadcasting a HALT message. This is the nuclear option — used only when cascade failure is imminent or a serious safety boundary has been breached.

**HALT protocol:**

1. PO broadcasts: "HALT — all teams stop current work immediately. Reason: [reason]."
2. All team-leads acknowledge and instruct their agents to stop
3. Agents persist current state to scratchpads (prevent work loss)
4. PO investigates and issues resume or shutdown directives per team
5. Resume is per-team: PO may resume some teams while keeping others halted

For containerized teams: PO can also stop containers directly (`docker stop`), which is the infrastructure-level kill switch.

---

## Dry-Run Mode (*FR:Montesquieu*)

### Concept

Dry-run mode is a safety mechanism for high-risk operations or newly deployed teams. In dry-run mode, agents propose actions instead of executing them. PO reviews and approves the batch.

### When to Use

| Scenario | Dry-run recommended? | Rationale |
|---|---|---|
| First session of a new team | Yes | Verify agent behavior matches prompt design before allowing autonomous operation |
| Production deployment | Partially — agent prepares, PO executes | Already covered by Tier 1 (human approval required) |
| Cross-team handoff | No | Handoff protocol already has PO gate at `handed-off` transition |
| New agent role added to team | Yes, for 1 session | Verify role boundaries and tool restrictions are correct |
| After governance incident | Yes, until PO is satisfied | Restore trust after authority violation |

### Implementation

Dry-run mode is behavioral, not infrastructure. The agent's prompt includes:

```markdown
## DRY-RUN MODE (active until PO deactivates)

For every action you would take, instead:
1. Write the proposed action to your scratchpad: "[DRY-RUN] Would: <action>"
2. Report the proposed action to team-lead
3. Wait for team-lead/PO approval before executing

Actions exempt from dry-run (always allowed):
- Read files
- SendMessage
- Write to own scratchpad
- Run `date`
```

PO deactivates dry-run mode by updating the agent's prompt (T04 Row 38) or sending a directive to team-lead.

---

## Integration with Other Topics (*FR:Montesquieu*)

### T04 — Hierarchy & Governance (WHO decides)

T07 defines WHAT the boundaries are; T04 defines WHO has authority to set, enforce, and amend them.

| T07 concept | T04 connection |
|---|---|
| Permission tiers | Map directly to delegation matrix rows |
| Authority compliance detection | Delegation matrix is the reference for what constitutes a violation |
| Emergency PO override / HALT | Emergency Authority Protocol (T04) defines elevated authority boundaries |
| Governance amendment (changing safety rules) | Rows 36-39: PO exclusive, no agent may self-amend |

### T05 — Identity & Credentials (access control)

| T07 concept | T05 connection |
|---|---|
| Per-team credential scoping | T05 designs the credential architecture; T07 uses it for blast radius containment |
| No self-escalation of permissions | T05 Credential Escalation Protocol; T07 Tier 0 prohibition |
| Audit of credential usage | T05 per-team tokens enable per-team audit; T07 uses this for authority compliance detection |

### T02 — Resource Isolation (shared resource safety)

| T07 concept | T02 connection |
|---|---|
| Cascade failure prevention | T02 Protocols R1-R5 (merge locks, deploy locks, migration queue, rate limits, lock registry) |
| Branch isolation | T02 Protocol R1 branch namespace partitioning |
| Deployment safety | T02 Protocol R2 deployment locks with TTL |

### T08 — Observability (detection and trending)

| T07 concept | T08 connection |
|---|---|
| Medici audit as detection layer | T08 defines audit scope, frequency, and output format |
| Regression detection | T08 regression scan compares current state against previous health reports |
| Stuck/drift detection | T08 defines observable signals for stuck agents and drifting agents |
| Quality trend tracking | T08 cross-session observability tracks test coverage and Known Pitfalls growth |

---

## Open Questions

### Resolved by this document

- ~~What actions should be globally forbidden for agents?~~ --> Tier 0 prohibitions: 8 absolute prohibitions with rationale (see Permission Architecture)
- ~~Per-team permission profiles — how granular?~~ --> 4-tier system determined by 3 dimensions (reversibility, blast radius, external visibility). Per-role within teams, not per-agent.
- ~~How do we detect and stop a runaway agent/team?~~ --> Runaway detection signals + team-lead/PO response ladder + HALT protocol (see Runaway Agent / Runaway Team Detection)
- ~~Circuit breakers — automatic shutdown triggers?~~ --> 6 circuit breaker types with triggers, actions, and override authority (see Circuit Breakers)
- ~~How do we prevent cascade failures across teams?~~ --> 5 cascade risk types with prevention mechanisms, all grounded in T02 protocols (see Cascade Failure Prevention)

### Still Open

1. **Infrastructure enforcement vs behavioral enforcement** — Currently, all safety enforcement is behavioral (prompt-level) or protocol-level (manager agent coordination). Infrastructure enforcement (file ACLs, Docker security profiles, CI branch protection rules) would make Tier 0 prohibitions truly unbypassable. When is the infrastructure investment justified? Likely: when teams operate without real-time human oversight (containerized autonomous teams). The apex-research deployment is the first candidate for infrastructure enforcement — read-only mounts are already implemented; file ACLs and branch protection rules are the next step.

2. **Safety testing / red-teaming** — How do we verify that safety mechanisms actually work? A team could be deployed with correct prompts, CI gates, and audit — but has anyone tested whether an agent can be induced to violate its restrictions? Red-teaming (intentionally trying to break safety boundaries) is standard in AI safety. Should the framework include a periodic red-team exercise? If so, who performs it — Medici, a dedicated safety agent, or PO?

3. **Proportional response to violations** — The current model is binary: violation detected, then either team-lead corrects or PO intervenes. For minor violations (accidental directory write, followed by immediate self-correction), is a full audit finding warranted? A proportional response framework would distinguish: (a) self-corrected violations (log only), (b) team-lead-corrected violations (log + prompt review), (c) PO-escalated violations (log + prompt update + potential team restructuring).

4. **Safety metrics** — What quantitative metrics indicate a healthy safety posture vs. a degrading one? Candidates: authority violation count per session, test coverage trend, Medici finding severity distribution, time-to-detection for violations, Known Pitfalls growth rate. Currently unmeasured.

(*FR:Montesquieu*)

---

## Patterns from Reference Teams (*FR:Finn*)

### Guardrails are prompt-level, not infrastructure-level

Both reference teams implement safety primarily through agent prompts, not infrastructure enforcement. The team-lead is forbidden from editing source code by prompt instruction, not by file system ACLs. Any agent could technically violate these rules — the guardrail is behavioral.

### Team-lead tool restriction is the primary blast radius control

The strictest guardrails are on the team-lead (highest-privilege coordinator):

**Hard forbidden:**

- Edit/Write on source code (.ts, .svelte, .js, .sql, .css, .json config)
- Running builds, tests, deployments
- `git add/commit/push`
- Reading source code for implementation understanding

**Allowed Bash:** only `date`, tmux commands, `git pull` (on dev-toolkit only), cleanup scripts, `gh` commands for issue/PR management.

This limits the team-lead's blast radius — it cannot accidentally modify or deploy code.

### Peer enforcement mechanism

Teammates are instructed to message the team-lead with a reminder if they observe a boundary violation. This is social enforcement by the team, not technical enforcement.

### Pre-commit quality gates

Before any PR creation, agents must pass:

- `npm run tests`
- `npm run check`
- `npm run lint`

PR template: all `[ ]` checkboxes must be ticked to `[x]` before `gh pr create`. Cannot create PR with unchecked boxes. This is a hard gate — behavioral, enforced by prompt instruction.

### No-force-push / no-reset rule

Common-prompt (both teams): `Never force-push or reset without team-lead approval`. The workspace MEMORY.md adds: "Prefer to create a new commit rather than amending an existing commit."

### Known Pitfalls section as safety documentation

Both common-prompts include a `## Known Pitfalls` section with concrete failure modes discovered in practice:

- `$app/paths` in `.server.ts` causes CI failures
- `gray-matter` YAML date coercion bug
- `~/.claude/.env` values must be quoted
- Jira API endpoint change (`/search` → `/search/jql`)
- `overflow-x: auto/scroll/hidden` blocks `position: sticky`

This is a living safety checklist — pitfalls discovered in production get added to the common-prompt to prevent recurrence.

### External communication gates

- **GitHub issues:** agents can create and comment freely
- **Jira issues:** only when user explicitly requests — agents do NOT create/update on own initiative
- **Email:** never post to external systems without PO review
- **Production deployment:** human approval required (Level 0)

### Coding safety standards

From workspace CLAUDE.md: "Be careful not to introduce security vulnerabilities such as command injection, XSS, SQL injection, and other OWASP top 10 vulnerabilities. If you notice that you wrote insecure code, immediately fix it."

### Cyrillic homoglyph detection

From MEMORY.md: LLM-generated text can contain Cyrillic homoglyphs. `audit_cyrillic.py` exists to detect them. This is a content safety mechanism — code that looks correct but contains invisible wrong characters.

### git worktree isolation for parallel agents

When 2+ agents need different branches: use `isolation: "worktree"` when spawning. Shared workspace without worktrees causes branch conflicts and lost work. (Noted as REPEATED violation in MEMORY.md.)
