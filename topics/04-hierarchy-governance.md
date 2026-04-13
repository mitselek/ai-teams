# Hierarchy & Governance

Supervision chains, escalation, approval authority, and decision delegation.

---

## Governance Architecture (*FR:Montesquieu*)

### Design Principle

Governance is not about control — it is about defining who decides what, so that every agent can act without asking. The goal is a system where the default answer to "may I do this?" is derivable from a document, not from a person.

### Five-Layer Governance Stack

The framework already has a de facto governance system, accumulated from incidents and operational experience across two reference teams. This section names and formalizes it.

| Layer | Mechanism | Scope | Amendment process |
|---|---|---|---|
| **L0: Constitutional** | Workspace MEMORY.md | Cross-team, cross-session | PO edits directly; incident-driven |
| **L1: Team law** | Common-prompt per team | All agents in one team | Team-lead proposes, PO approves |
| **L2: Role boundary** | Agent prompt (per role) | Individual agent | Celes designs, PO approves |
| **L3: Peer enforcement** | Social policing by teammates | Intra-team, runtime | Self-correcting; violations logged to scratchpad |
| **L4: Incident amendment** | Known Pitfalls, MEMORY.md addenda | Varies by incident scope | Discoverer documents, PO reviews |

**Precedent over prescription.** De facto governance (how decisions were actually made) takes priority over de jure governance (how the document says they should be made). When the two diverge, the document must be updated to match reality — not the other way around. This prevents governance drift where the documentation becomes fiction.

**Evidence sources for this analysis:**

- `reference/rc-team/cloudflare-builders/` — common-prompt, team-lead prompt, memory files
- `reference/hr-devs/` — common-prompt, team-lead prompt, memory files
- Workspace MEMORY.md — accumulated governance rules from incidents
- `apex-migration-research/.claude/teams/apex-research/` — common-prompt, agent prompts
- `prompts/richelieu.md` — manager agent draft (input, not settled design)
- `topics/03-communication.md` — Herald's inter-team protocols
- `topics/07-safety-guardrails.md` — permission categories

### Constitutional Rules

Named rules that constrain governance across layers. Unlike delegation matrix rows (which describe who decides what), constitutional rules forbid certain flows regardless of who wants them. Named rules get enforced in prompts and reviews; unnamed constraints get skimmed.

#### Rule: L3 → L0 Automated Flow Is Forbidden

Knowledge produced at L3 (specialists, team wikis, Librarian-curated content) must not automatically propagate to L0 (workspace MEMORY.md, constitutional artifacts). The hierarchy must be preserved: information flows up through explicit governance review (team lead's session report, PO's cross-team context-gathering), gets synthesized by the human at L0, and flows back down through common-prompt edits or direct team-lead directives.

**Forbidden:**

- Automated sync of team wiki entries to workspace MEMORY.md
- Agents reading workspace MEMORY.md directly
- PO editing team wikis directly (PO messages team lead, who instructs the Librarian)
- PO copying MEMORY.md entries into team wikis (if PO knowledge needs to reach a team, it goes through team-lead, who submits it as a normal Knowledge Submission with PO attribution)

**Required:**

- Cross-team-relevant wiki entries are tagged `[CROSS-TEAM]` in the Librarian's session report
- Team lead includes tagged findings in session report to PO
- PO decides at own discretion whether to record in MEMORY.md
- PO directives to teams flow through common-prompt, team-lead messages, or explicit Knowledge Submissions to the Librarian (with attribution), never through direct wiki edits

**Why this is a constitutional rule, not a delegation matrix row.** The matrix specifies who *may* decide something. This rule specifies a flow that *no one* may authorize — not even the PO, because the L0 ↔ L3 gap exists by design. Preserving it preserves the hierarchy's synthesis-at-the-top property: the PO's context is deliberately curated, not flooded with raw team output.

**Source:** T09 v2 Part 2, lines 877-893 (PO MEMORY.md Bridge section). Extended from Monte's round 5 position with Finn's anti-pattern (round 5). See T09 v2 for the full PO MEMORY.md bridge discussion and the "PO is the bridge" framing.

---

## Hierarchy Levels

### Level 0: Product Owner (human)

Final authority. Cannot be overridden by any agent at any level.

- Approves: production deployments, team creation/dissolution, architecture decisions, external communication (email, Jira), team composition changes
- Constitutional author: writes and amends workspace MEMORY.md
- May intervene at any level at any time (no agent may refuse a PO directive)

### Level 1: Manager Agent

Coordination layer between PO and multiple team-leads. Operates autonomously within delegated authority; escalates everything outside that boundary.

- Routes inter-team work (handoff requests, broadcasts)
- Maintains cross-team state (handoff ledger, direct link registry)
- Resolves inter-team conflicts when existing policy applies
- Escalates to PO when: no policy exists, precedent-setting, blocking priority conflicts, team creation/dissolution, production deployment, security-sensitive decisions

**Current status:** Designed (see `prompts/richelieu.md`), never deployed. All L1 functions currently performed by PO directly. The authority boundaries defined in this document apply whether performed by a manager agent or by PO acting in that capacity.

### Level 2: Team Lead

Owns the team's workflow. Coordinator-only — never implements.

- Routes tasks to specialists within the team
- Controls spawn order and agent lifecycle
- Initiates code review (delegates to Marcus or equivalent)
- Closes issues after review approval (exclusive responsibility — never delegated)
- Reports to L1 (manager agent or PO)
- May NOT: edit source code, run builds/tests/deployments, commit/push, communicate cross-team without L1 routing

**Enforcement:** Prompt-level tool restrictions + peer enforcement (teammates message a reminder on observed violations).

### Level 3: Specialist Agent

Executes within delegated scope. Owns work end-to-end: research, implement, test, commit, push, create PR.

- Operates within directory/file ownership boundaries defined in common-prompt
- Reports to team-lead after every completed task (mandatory, no silent idle)
- May NOT: cross team boundaries, close issues, modify Jira, communicate externally, write outside owned directories

#### Scope Authority Within L3 (Spec Writer Specialization Spectrum)

The canonical L3 specialist has *execution* authority within its own scope — it decides how to implement, test, or refactor the work assigned to it. Some L3 specialists are additionally granted **scope authority over other L3 peers** for bounded durations. These are the "Spec Writer specialization" roles: they produce work breakdowns that other specialists consume.

**Scope authority does not create a new hierarchy level.** The scope constraint (the bounded duration over which the specialist's decisions bind other specialists) replaces what would otherwise be a hierarchical layer. When the scope ends, the authority ends. ARCHITECT's authority over RED, GREEN, and PURPLE lasts one story; at story boundaries, ARCHITECT returns to peer status.

**The precedent spectrum.** Not all Spec Writer specializations have identical authority scopes. There is a spectrum, and T04 must distinguish the points on it:

| Specialization | Precedent | Authority mechanics |
|---|---|---|
| **Drafting authority** | Hammurabi (apex-research) drafts specs that Schliemann (L2 team-lead) approves per decision (`draft → reviewed → approved → handed-off`). The specs are not binding on downstream consumers until the team-lead approves the transition. | L3 produces, L2 approves each instance, L3 peers consume approved output. L2 re-approval is a per-decision gate. |
| **Binding authority within bounded scope** | ARCHITECT (T09 v2 XP pipeline) decomposes a story into a test plan. The decomposition binds RED, GREEN, and PURPLE without team-lead re-approval during the story. Team-lead assigned the story; ARCHITECT owns the decomposition; the pipeline agents execute within it. | L3 produces, L3 peers are bound by the output within the assigned scope (one story). L2 re-approval is not required per decision — the scope assignment itself is the authorization. |

The innovation in T09 v2 is the second row: **a bounded zone of L3 autonomy over L3 peers that does not require a new hierarchy level because the scope (one story) is the structural constraint.** ARCHITECT does not sit at a new level between L2 and L3. ARCHITECT sits at L3 with scoped binding authority that expires when the story completes.

**Why both are "Spec Writer specializations."** Both roles produce work breakdowns that other specialists consume. Both use judgment over structural decomposition. Both fail in similar ways (bad decomposition cascades through downstream work). They differ in the authority mechanics, not the cognitive act. T04 recognizes both as valid patterns within the Spec Writer family.

**Implication for team designers.** When adopting a role with binding scope authority (like ARCHITECT), the scope must be explicit and bounded at the team-lead level. If the scope is unbounded or informal, the role drifts toward becoming a team-lead peer — which violates the L2 coordination monopoly. The delegation matrix rows that encode scope-authority roles (see rows 40-45) always include the scope constraint explicitly.

---

## Decision Delegation Matrix (*FR:Montesquieu*)

This is the central governance artifact. For any decision type, it specifies: who decides, who is consulted, who is informed, and when to escalate.

### Notation

- **D** = Decides (has authority)
- **C** = Consulted (provides input before decision)
- **I** = Informed (notified after decision)
- **—** = No involvement
- **Escalate →** = Must escalate to indicated level

### Matrix

| # | Decision type | PO (L0) | Mgr Agent (L1) | Team Lead (L2) | Specialist (L3) | Escalation trigger |
|---|---|---|---|---|---|---|
| **Team lifecycle** | | | | | | |
| 1 | Create a new team | D | C | — | — | Always PO |
| 2 | Dissolve a team | D | C | I | I | Always PO |
| 3 | Change team composition (add/remove agent role) | D | C | C | — | Always PO |
| 4 | Spawn an agent within approved roster | I | — | D | — | Agent not in roster → escalate to PO |
| 5 | Shut down an agent (session end) | I | — | D | I | — |
| **Architecture & design** | | | | | | |
| 6 | Architecture decision (cross-team) | D | C | C | — | Always PO |
| 7 | Architecture decision (within team scope) | I | — | D | C | Affects other teams → escalate to L1/PO |
| 8 | Technology stack choice | D | C | C | C | Always PO |
| **Code & delivery** | | | | | | |
| 9 | Branch strategy within a team | I | — | D | I | — |
| 10 | Create a feature branch | — | — | I | D | — |
| 11 | Commit and push to feature branch | — | — | I | D | — |
| 12 | Create a pull request | — | — | I | D | — |
| 13 | Code review verdict | — | — | I | D (reviewer) | — |
| 14 | Merge PR to develop | — | — | D | C (reviewer) | Quality gates must pass |
| 15 | Merge develop to main | D | I | C | — | Always PO |
| 16 | Close a GitHub issue | — | — | D | — | Exclusive to team-lead |
| **Deployment** | | | | | | |
| 17 | Deploy to dev environment | I | — | D | — | — |
| 18 | Deploy to staging | D | I | C | — | Always PO |
| 19 | Deploy to production | D | I | C | — | Always PO |
| 20 | Database migration (dev) | — | — | D | C | — |
| 21 | Database migration (production) | D | I | C | — | Always PO |
| **External systems** | | | | | | |
| 22 | Create/update Jira issues | D | — | — | — | Always PO; agents never on own initiative |
| 23 | Send external email | D | — | — | — | Always PO review first |
| 24 | Create GitHub issues | — | — | D | D | Agent-managed; no approval needed |
| 25 | Comment on GitHub issues/PRs | — | — | D | D | — |
| **Inter-team coordination** | | | | | | |
| 26 | Route a handoff request | I | D | C (requester) | — | Target team doesn't exist → escalate to PO |
| 27 | Grant a direct communication link | I | D | C | — | Security-sensitive resources → escalate to PO |
| 28 | Revoke a direct communication link | I | D | I | — | Team-lead disputes → escalate to PO |
| 29 | Broadcast to all teams | D (unrestricted) | D (with reason) | Escalate → L1 | — | Team-leads may not broadcast directly |
| 30 | Resolve inter-team resource conflict | I | D (if policy exists) | C | — | No policy exists → escalate to PO |
| 31 | Prioritize competing cross-team requests | I | D (normal/high) | C | — | Blocking priority conflict → escalate to PO |
| **Quality & audit** | | | | | | |
| 32 | Initiate code review | — | — | D | — | Team-lead assigns reviewer |
| 33 | Quality gate enforcement (tests, lint, check) | — | — | I | D (implementer) | Gates must pass before PR |
| 34 | Cross-team quality audit | I | D (assigns) | C (audited team) | D (auditor, e.g. Medici) | See §Cross-Team Audit Authority |
| 35 | Act on audit findings | — | D (routes) | D (within own team) | — | Disagreement → escalate to PO |
| **Governance** | | | | | | |
| 36 | Amend workspace MEMORY.md | D | — | — | — | Always PO |
| 37 | Amend team common-prompt | D | I | C | — | Team-lead proposes, PO approves |
| 38 | Amend agent prompt | D | I | C | — | Celes designs, PO approves |
| 39 | Override a governance rule | D | — | — | — | Always PO; no agent may override |
| **XP Pipeline governance** | | | | | | |
| 40 | Story decomposition into test plan | I | — | C | D (ARCHITECT) | ARCHITECT decides within assigned story; inability to decompose → escalate to team-lead |
| 41 | Test plan ordering | — | — | I | D (ARCHITECT), C (RED) | RED may flag untestable ordering; ARCHITECT revises or escalates to team-lead |
| 42 | Scope dispute within pipeline (RED/GREEN/PURPLE disagrees with test spec) | — | — | Escalation target | D (ARCHITECT, first instance); C (disputing agent) | Unresolvable after ARCHITECT ruling → escalate to team-lead (L2) → PO (L0) |
| 43 | Structural refactoring within PURPLE scope (rename, extract, restructure) | — | — | I | D (PURPLE); C (ARCHITECT) | Restructuring that would cross PURPLE's scope boundary (interface change, new module, test file edit) → escalate to ARCHITECT |
| 44 | Mid-cycle termination of PURPLE (forced shutdown during refactoring) | — | — | D (team-lead) | C (ARCHITECT); C (PURPLE) | Watchdog detects hung/stuck state at 5-minute soft boundary; team-lead authority activates; PURPLE cannot refuse |
| 45 | Cross-pipeline pattern extraction (shared utility across pipelines) | — | — | I | D (ARCHITECT); C (PURPLE flags via Librarian) | Shared PURPLE observing cross-pipeline pattern MUST flag to ARCHITECT via Librarian; may not extract unilaterally |
| **Knowledge base (Librarian) governance** | | | | | | |
| 46 | Knowledge submission scope classification (agent-only / team-wide / cross-team) | — | — | I | D (Librarian); C (submitting agent) | Submitting agent proposes scope; Librarian decides on filing; team-lead reviews disputes |
| 47 | Knowledge promotion proposal acceptance (wiki entry → common-prompt candidate) | I | — | D | C (Librarian proposes) | Team-lead decides whether to forward to PO; final common-prompt amendment is Row 37 |
| 48 | Librarian respawn authority (SPOF recovery) | — | — | D | — | Normal agent lifecycle per Rows 4-5; no special authority. Librarian state marker prevents re-running bootstrap. |
| 49 | `[URGENT-KNOWLEDGE]` interrupt decision (whether to interrupt an affected agent with new knowledge) | — | — | D | C (Librarian flags relevance); C (affected agent receives) | Librarian never interrupts agents directly. Team-lead is the traffic controller. |

**Reading the ARCHITECT, PURPLE, and Librarian rows.** Rows 40-49 use the existing 5-column format with role qualifiers in the Specialist (L3) column. ARCHITECT, PURPLE, and Librarian are all L3 specialists with scoped authority — they are not a new hierarchy level (see §Level 3: Scope Authority Within L3). The qualifier in parentheses identifies which L3 role holds the specified authority. Cross-reference `topics/09-development-methodology.md` Part 1 (Authority Boundaries, lines 284-299) for the 6-column view that isolates ARCHITECT into its own column for easier reading within the XP pipeline context.

**ARCHITECT's authority is scoped to a single story at a time.** Between stories, ARCHITECT has no scope authority — it is passively available until the team-lead assigns the next story. This prevents authority creep. See T09 v2 Part 1, "Pipeline Governance as a Nested System" for the full treatment.

**The mid-cycle termination row (44) is load-bearing for safety.** PURPLE's execution authority (Row 43) does NOT override team-lead's coordination authority (Row 44). When the watchdog detects a stuck state at the 5-minute soft boundary, team-lead termination activates and PURPLE cannot refuse. This preserves the L2-over-L3 termination invariant across the XP pipeline addition. See T09 v2 "Mid-Cycle Shutdown: Watchdog + Team Lead Authority" for the four exit states and the composition of Volta's git-state watchdog with the soft boundary.

(*FR:Montesquieu*)

---

## Apex-Research Governance Questions (*FR:Montesquieu*)

The deployment of the apex-research team (5 agents, containerized, reverse-engineering 57 legacy APEX apps) exposed 5 concrete governance gaps. This section answers each one, grounded in the delegation matrix above.

### Q1: Who coordinates between apex-research and framework-research?

**Answer: L1 manager agent (or PO acting in that capacity).**

Both teams are L2 entities. Neither team-lead has authority over the other. Cross-team coordination flows through L1 per the hybrid topology (T03 Protocol 2). In the current state (no manager agent deployed), PO performs this function directly.

Concrete implication: If apex-research needs a governance clarification from framework-research, Schliemann sends a handoff request to L1, who routes it to the framework-research team-lead. Schliemann does not message framework-research agents directly.

**Matrix reference:** Rows 26, 30, 31.

### Q2: When framework-research Medici audits apex-research, is it advisory or binding?

**Answer: Advisory with escalation path.**

Medici's cross-team audit findings are delivered to the audited team's team-lead (Schliemann) as recommendations, not commands. Medici has no authority to modify apex-research files, processes, or decisions.

**Governance chain:**

1. L1 (or PO) assigns Medici to perform cross-team audit (Row 34)
2. Medici performs audit, produces findings report
3. Medici sends findings to L1 (or PO), who routes to Schliemann
4. Schliemann decides how to act on findings within the team (Row 35)
5. If Schliemann disagrees with a finding, L1 mediates (Row 35 escalation)
6. If L1 cannot resolve, escalate to PO

**Why advisory, not binding:** Binding authority across teams would make the auditor a de facto manager of the audited team, collapsing L1 and L2 into one role. The separation of audit (assess) and executive (act) authority is a core governance principle.

**Apex-research common-prompt already reflects this:** "Quality audits are performed by framework-research Medici remotely (not a member of this team). Findings are reported to Schliemann via cross-team message."

### Q3: Who approves migration specs transitioning to HANDED-OFF?

**Answer: PO (L0).**

The `HANDED-OFF` status means a spec has been transferred to a downstream migration team for implementation. This is a cross-team deliverable handoff with production implications. Per the delegation matrix:

- **draft → reviewed:** Team-lead (Schliemann) initiates review, assigns reviewer (Row 32)
- **reviewed → approved:** PO approves (this is an architecture/scope decision with downstream team impact — Row 6)
- **approved → handed-off:** PO directs the handoff (this creates work for another team — Row 1 analogue: only PO authorizes inter-team work commitments of this magnitude)

**Why not team-lead?** A migration spec handed off to cloudflare-builders creates a commitment of that team's resources. Only PO has authority to commit one team's resources based on another team's output.

### Q4: Who authorizes deploying new teams?

**Answer: PO (L0). Always.**

Row 1 in the delegation matrix. No agent — not team-lead, not manager agent — may create a new team. The manager agent is consulted (provides assessment of whether the team design is sound), but the PO decides.

**Rationale:** Team creation commits resources (compute, tokens, human attention). At scale, uncontrolled team proliferation is the governance equivalent of a fork bomb.

**Process:**

1. Need identified (by any level)
2. L1 (or team-lead, if no L1) proposes team design to PO
3. PO approves team charter: mission, composition, resource boundaries
4. L1 (or PO) initializes team (roster, common-prompt, agent prompts)
5. Team-lead is spawned and begins startup protocol

### Q5: When teams disagree, who arbitrates?

**Answer: L1 manager agent for policy-resolvable disputes; PO for precedent-setting or high-stakes disputes.**

**Escalation ladder:**

```
Step 1: Team-leads discuss directly (if direct link exists)
   │
   ├─ Resolved → Both team-leads log decision, inform L1
   │
   └─ Unresolved ↓

Step 2: L1 manager agent gathers both positions
   │
   ├─ Policy exists → L1 applies policy, informs both teams + PO
   │
   ├─ Judgment call → L1 decides, documents reasoning, informs PO
   │
   └─ Precedent-setting or high-stakes ↓

Step 3: PO decides
   │
   └─ Decision becomes precedent → L1 codifies into policy for future disputes
```

**"Precedent-setting" means:** The decision would establish a new rule applicable to future similar disputes. Example: "When two teams need the same D1 database, who gets priority?" The first resolution creates a policy; subsequent disputes are resolved by L1 applying that policy.

**"High-stakes" means:** Production risk, resource commitment >1 session, external stakeholder impact, or security implications.

**Audit trail:** All disputes reaching Step 2 are logged to the Handoff Ledger (T03 Protocol 1) with `type: dispute`. This creates a record of disputes and resolutions, enabling pattern detection (e.g., recurring disputes between the same teams may signal a need for a direct link or shared ownership rules).

**Matrix reference:** Rows 30, 31.

---

## Cross-Team Audit Authority (*FR:Montesquieu*)

### Principle

Audit authority is separated from executive authority. The auditor assesses; the audited team's leadership acts. No auditor may directly modify another team's artifacts, processes, or decisions.

### Audit Types

| Audit type | Auditor | Trigger | Authority | Output |
|---|---|---|---|---|
| **Knowledge health** | Medici (any team) | Periodic (per session) or on-demand | Advisory — findings only | Health report to team-lead |
| **Cross-team health** | Medici (home team) | L1/PO assigns | Advisory — findings to L1 | Report to L1, who routes to audited team |
| **Code review** | Marcus (or equivalent) | Team-lead assigns per PR | Binding within team — GREEN required for merge | Review verdict on PR |
| **Spec review** | Domain expert | Team-lead assigns | Advisory — recommendations | Review comments on spec |

### Cross-Team Audit Flow

```
L1/PO assigns audit
    │
    v
Medici reads target team's:
  - Scratchpads (for consistency)
  - Topic files / specs (for completeness)
  - Common-prompt (for standards compliance)
    │
    v
Medici produces findings report
    │
    v
Findings delivered to L1 (or PO)
    │
    v
L1 routes findings to target team-lead
    │
    v
Target team-lead decides action:
  ├── Accept finding → implement fix
  ├── Reject finding → explain to L1 → L1 mediates or escalates
  └── Defer finding → log with reason and timeline
```

### What Medici May NOT Do (Cross-Team)

- Edit files in another team's workspace
- Message another team's specialists directly (must go through team-lead)
- Block another team's work (audit findings do not create blockers unless PO escalates)
- Override a team-lead's decision on how to handle a finding

---

## Manager Agent — Role Definition (*FR:Montesquieu*)

### Design Principle

The manager agent is an **information broker**, not a bottleneck. It routes information to the right team, does not accumulate it. It delegates research, delegates execution, and keeps only coordination state: the handoff ledger, the direct link registry, and one-line team status summaries.

The analogy is a switchboard operator, not a general. The manager agent has authority to make routing decisions and apply existing policy. It does not have authority to create policy, commit resources, or make strategic choices — those belong to PO.

### When Is a Manager Agent Needed?

**Current state (2-3 teams):** PO performs all L1 functions directly. This works because the PO can hold context on 2-3 teams, and cross-team interactions are infrequent.

**Scaling triggers for deploying a manager agent:**

| Trigger | Symptom | Threshold |
|---|---|---|
| PO routing overhead | PO spends >30% of session time routing inter-team messages | ~4 active teams |
| Context overload | PO cannot hold all teams' state simultaneously | ~5 active teams |
| Handoff latency | Cross-team requests wait >1 session for routing | Any team count |
| Conflict frequency | Inter-team resource conflicts occur >2x per session | ~3+ teams sharing repos |

**Below threshold:** PO acts as L1. No manager agent needed.
**Above threshold:** Deploy manager agent. PO shifts to L0-only (strategic decisions, approvals).

### Core Responsibilities

These are the operational functions the manager agent performs. Each maps to delegation matrix rows.

#### 1. Inter-Team Work Routing (Rows 26, 31)

The manager agent is the hub in the hybrid communication topology (T03 Protocol 2). All inter-team communication flows through it by default.

- Receive handoff requests from team-leads
- Validate: Is the target team correct? Is it available? Is the priority justified?
- Deliver to the target team-lead
- Track status in the Handoff Ledger
- Relay ACKs, rejections, and completions back to the requesting team

**Handoff Ledger** — persistent record of all inter-team work requests:

```markdown
| ID | From | To | Type | Priority | Status | Requested | Updated |
|---|---|---|---|---|---|---|---|
```

The ledger is the single source of truth for "who asked whom for what." It lives in the manager agent's memory directory, persisted to disk (not held in context). Types include: `review`, `deploy`, `build`, `test`, `consult`, `migrate`, `dispute` (per T03 Protocol 1).

#### 2. Direct Link Registry (Rows 27, 28)

Authorize and track direct team-to-team communication channels:

```markdown
| Team A | Team B | Reason | Authorized | Last active | Review due | Last review |
|---|---|---|---|---|---|---|
```

Direct links are exceptions to the hub-routed default. The manager agent grants them when:

- Two teams share the same repository (frequent resource conflicts)
- A standing handoff pattern exists (e.g., dev→QA on every PR)

The manager agent reviews direct links per Herald's lifecycle protocol (T03 Protocol 2): time-based (30 sessions), inactivity (10 sessions), scope change, incident, or on-demand. The manager agent may revoke links autonomously; if a team-lead disputes, escalate to PO.

#### 3. Broadcast Governance (Row 29)

Controls who broadcasts what to which teams (T03 Protocol 3).

- PO may broadcast unrestricted
- Manager agent may broadcast with stated reason
- Team-leads must request broadcast through the manager agent — it decides whether to broadcast or send targeted messages
- Maximum 3 broadcasts per session per authority level
- Scope-filter broadcasts: only send to affected teams, not all

#### 4. Conflict Resolution (Rows 30, 31)

When two teams disagree (resource conflicts, priority disputes, scope overlaps), the manager agent follows the Q5 escalation ladder:

1. If team-leads have a direct link, they discuss first
2. Manager agent gathers both positions
3. Policy exists → apply policy, inform both teams + PO
4. Judgment call → decide, document reasoning, inform PO
5. Precedent-setting or high-stakes → escalate to PO with summary + recommendation

All disputes reaching the manager agent are logged to the Handoff Ledger with `type: dispute`.

#### 5. Cross-Team Audit Routing (Rows 34, 35)

- Assigns cross-team audits (e.g., Medici auditing apex-research) on PO direction
- Routes audit findings from auditor to audited team's team-lead
- Mediates if audited team-lead disagrees with findings
- Escalates to PO if mediation fails

#### 6. Team Health Monitoring

- Track which teams are active (spawned) vs. dormant
- Detect teams that go silent (no reports within expected timeframe)
- Escalate to PO if a team appears stuck or unresponsive

This is observational, not directive. The manager agent does not tell a team how to fix its health — it flags the issue to PO.

### Manager Agent Authority Boundaries

Derived from the delegation matrix. This is the formal authority mapping.

**Autonomous decisions (manager agent decides, PO is informed):**

| Authority | Matrix row | Constraint |
|---|---|---|
| Route handoff requests to correct team | 26 | Target team must exist |
| Grant direct communication links | 27 | Not security-sensitive resources |
| Revoke direct communication links | 28 | No team-lead dispute |
| Broadcast with stated reason | 29 | ≤3 per session |
| Resolve inter-team conflicts (policy exists) | 30 | Policy must be documented |
| Prioritize competing normal/high requests | 31 | Not blocking priority |
| Route cross-team audit findings | 35 | — |
| Review direct links (per lifecycle protocol) | 27, 28 | Per T03 triggers |

**Always escalate to PO (manager agent may recommend, PO decides):**

| Decision | Matrix row | Reason |
|---|---|---|
| Create or dissolve a team | 1, 2 | Resource commitment |
| Change team composition | 3 | Resource commitment |
| Architecture decisions | 6, 8 | Strategic scope |
| Production deployment | 18, 19, 21 | Production risk |
| Database migration (production) | 21 | Production risk |
| Jira operations | 22 | Human-gated by constitutional rule |
| External communication | 23 | Organizational boundary |
| Amend governance documents | 36, 37, 38 | Constitutional authority |
| Blocking priority conflicts | 31 | High-stakes |
| Precedent-setting disputes | 30 | Creates new policy |
| Grant direct link for security-sensitive resources | 27 | Security risk |

**Never the manager agent's scope (belongs to L2 team-lead):**

| Action | Reason |
|---|---|
| Task routing within a team | Team-lead's backlog ownership |
| Spawn order within a team | Team-lead's operational decision |
| Issue closure | Team-lead's exclusive governance signal |
| PR merge decisions | Team-lead's quality gate |
| Code review assignments | Team-lead delegates to reviewer |
| Messaging specialists directly | Bypasses team-lead chain of command |

### Tool Restrictions — Hard Rules

The manager agent follows the same FORBIDDEN/ALLOWED pattern as team-leads, but scoped to the cross-team level.

**FORBIDDEN tools (absolute — no exceptions):**

- `Edit/Write` on source code, config files, or any team's working files
- `Edit/Write` on any team's memory directory (only own memory directory)
- `Edit/Write` on agent prompts, common-prompts, or roster files
- Running builds, tests, or deployments (`npm`, `wrangler`, `pytest`, etc.)
- `git commit/push` on any team's repository
- `NotebookEdit`

**FORBIDDEN actions (behavioral — enforced by prompt, detected by audit):**

- Messaging specialists directly (must route through team-lead)
- Creating or modifying Jira issues without PO request
- Making architecture decisions (advise only; PO decides)
- Reading source code files to understand implementation (delegate to team-leads, who delegate to Finn)
- Holding handoff requests without routing for >1 message cycle
- Accumulating team-internal context (read summaries, not details)

**ALLOWED tools:**

| Tool | Scope | Purpose |
|---|---|---|
| `Read` | Team rosters, team-lead scratchpads (summary only), handoff ledger, direct link registry, topic files, CLAUDE.md files | Situational awareness |
| `Edit/Write` | Own memory directory ONLY: handoff ledger, direct link registry, scratchpad, team status summary | Persistent coordination state |
| `Bash` | `date` only; `gh` commands for cross-team issue management | Time awareness, GitHub coordination |
| `SendMessage` | Team-leads only (never specialists) | PRIMARY tool |
| `TaskCreate/Update/List/Get` | Cross-team task coordination | Work tracking |

**Self-check (before every action):**
> "Am I routing, or am I deciding something that belongs to PO or a team-lead?"

### Persistent State

The manager agent maintains these files in its memory directory:

| File | Purpose | Update frequency |
|---|---|---|
| `handoff-ledger.md` | Active and recent inter-team handoffs | On every handoff event |
| `direct-links.md` | Registered direct communication channels | On grant/revoke/review |
| `team-status.md` | One-line status per team (active/dormant/blocked) | On team-lead reports |
| `scratchpad.md` | Session state, decisions, learned patterns | Per session |
| `policy-index.md` | Index of precedent decisions that became policy | On PO-approved precedent |

**Context budget rule:** The manager agent reads ledger/registry from disk at the start of each relevant decision. It does not hold all cross-team state in context simultaneously. At 10+ teams, context pressure is the primary scaling constraint (see Scaling Analysis).

### Cross-Reference with Richelieu Draft (*FR:Montesquieu*)

The existing `prompts/richelieu.md` (designed by Celes in R6) is the current manager agent prompt. This Phase 2 analysis confirms, modifies, or flags items in that draft:

| Richelieu prompt element | T04 assessment | Action needed |
|---|---|---|
| Position in hierarchy (L0→L1→L2→L3) | **Confirmed.** Matches delegation matrix exactly. | None |
| Core responsibilities 1-5 (routing, ledger, registry, broadcast, conflict) | **Confirmed.** All 5 map to delegation matrix rows. | None |
| Responsibility 6 (team health monitoring) | **Confirmed with clarification.** Observational only — manager agent flags, does not direct fix. | Minor update to prompt: add "observational, not directive" |
| Tool restrictions (FORBIDDEN/ALLOWED) | **Confirmed with additions.** Richelieu's prompt covers the essentials. T04 adds: explicit ban on editing other teams' memory directories, ban on reading source code, 1-message-cycle routing SLA. | Update prompt to add missing restrictions |
| Decision authority matrix (10 rows) | **Subsumed by T04 delegation matrix (39 rows).** Richelieu's 10-row table is a correct subset. The T04 matrix is now the canonical authority source. | Update prompt to reference T04 matrix instead of inlining a subset |
| Anti-patterns (6 rows) | **Confirmed.** All 6 are valid and appear in T04's failure modes. | None |
| Context budget management (4 strategies) | **Confirmed and expanded.** T04 adds persistent state file table and explicit disk-read-before-decide rule. | Update prompt to reference T04 persistent state design |
| Attribution: `(*MGR:Rich*)` | **Confirmed.** Matches Herald's T03 attribution convention. | None |
| Model tier: opus | **Confirmed.** Judgment-heavy role requires opus. | None |
| Personality section | **No T04 opinion.** Personality is Celes's domain. | None |
| Literary lore | **No T04 opinion.** Lore is Celes's domain. | None |

**Summary:** Richelieu's draft is well-aligned with the T04 governance model. No structural changes needed. Three minor prompt updates recommended:

1. Add "observational, not directive" to team health monitoring
2. Add missing tool restrictions (other teams' memory dirs, source code, routing SLA)
3. Replace inline decision authority matrix with reference to T04 delegation matrix

These prompt updates are Celes's responsibility (agent prompt ownership per governance layer L2). T04 provides the governance requirements; Celes translates them into prompt language.

---

## PO-to-Manager-Agent Handoff Protocol (*FR:Montesquieu*)

### The Problem

When a manager agent is first deployed, there is a transition period where both PO and manager agent could be issuing directives. This creates the "dual authority" failure mode (see Failure Modes table). The handoff must be explicit and atomic — team-leads must know exactly when the reporting chain changes.

### Handoff Procedure

```
Phase 1: PREPARATION (PO)
  │
  ├─ PO deploys manager agent
  ├─ PO gives manager agent read access to: all team rosters, handoff ledger (if any),
  │  direct link registry (if any), team status summaries
  ├─ PO briefs manager agent: active teams, pending handoffs, known conflicts,
  │  current policies
  └─ PO reviews manager agent's initial state assessment

Phase 2: ANNOUNCEMENT (PO → all team-leads)
  │
  ├─ PO broadcasts to all team-leads:
  │    "Manager agent [name] is now your L1 coordinator.
  │     Effective immediately:
  │     - Report to [name] for cross-team routing, handoffs, and conflicts.
  │     - PO handles: team creation, architecture, production, Jira, external comms.
  │     - If [name] is unavailable, escalate to PO."
  └─ Each team-lead ACKs (mandatory — no silent acceptance)

Phase 3: ACTIVE (manager agent operational)
  │
  ├─ Manager agent begins processing handoff requests
  ├─ PO stops routing inter-team messages (L1 authority transferred)
  └─ PO retains all L0 authority (unchanged)
```

### What Changes After Handoff

| Function | Before (PO as L1) | After (manager agent as L1) |
|---|---|---|
| Inter-team message routing | PO routes manually | Manager agent routes |
| Handoff ledger | PO tracks informally (or not at all) | Manager agent maintains persistent ledger |
| Direct link management | PO grants ad-hoc | Manager agent manages with lifecycle protocol |
| Broadcast | PO broadcasts directly | Manager agent controls + scope-filters |
| Conflict resolution | PO decides all disputes | Manager agent resolves policy-based; PO handles precedent-setting |
| Team health monitoring | PO notices ad-hoc | Manager agent tracks systematically |
| Team-lead reporting chain | Team-leads → PO | Team-leads → manager agent → PO (for escalations) |

### What Does NOT Change After Handoff

- PO retains all L0 authority (team creation, architecture, production, Jira, external comms, governance amendments)
- PO may intervene at any level at any time (emergency override)
- PO may communicate directly with any team-lead in emergencies (bypassing manager agent)
- The delegation matrix rows marked "Always PO" remain unchanged
- Team-lead authority within their team is unchanged

### Rollback

If the manager agent is not performing (bottleneck, authority drift, context overload):

1. PO broadcasts: "Manager agent [name] is decommissioned. Report to PO directly for cross-team coordination."
2. PO assumes L1 functions immediately
3. Manager agent persists final state (ledger, registry) to disk
4. Manager agent shuts down

This is a clean rollback because the PO was always capable of performing L1 functions — the manager agent was additive, not replacing.

---

## Emergency Authority Protocol (*FR:Montesquieu*)

### The Problem (Open Question #3)

When PO is unavailable and an urgent cross-team decision is needed that exceeds the manager agent's autonomous authority, who acts? The current model has no backup authority. At 2-3 teams this is acceptable (sessions are short, PO is usually present). At 10+ teams with asynchronous sessions, PO unavailability becomes a real risk.

### Design Principle

Emergency authority is **time-bounded** and **scope-limited**. It expires. It does not expand. The agent exercising emergency authority must document every decision for post-hoc PO review.

### Emergency Authority Levels

| Situation | Who acts | Authority granted | Duration | Post-hoc |
|---|---|---|---|---|
| **PO present** | Normal delegation matrix | Full matrix | N/A | N/A |
| **PO unavailable, manager agent present** | Manager agent (elevated) | Manager agent's autonomous scope + priority triage for blocking requests | Until PO returns or 1 session (whichever is shorter) | PO reviews all elevated decisions |
| **PO unavailable, no manager agent** | Senior team-lead (designated) | Cross-team routing only (no escalation decisions, no precedent-setting) | Until PO returns or 1 session | PO reviews all cross-team decisions |
| **PO unavailable, blocking production incident** | Any team-lead with production access | Defensive actions only: rollback, disable feature flag, halt deployment | Until incident resolved or PO returns | PO reviews; incident report required |

### Elevated Manager Agent Authority (PO unavailable)

When PO is unavailable, the manager agent may additionally:

- **Triage blocking priority conflicts** — choose which team proceeds first, with documented reasoning. This is normally a PO escalation (Row 31), but blocking means both teams are idle, which is worse than a possibly-wrong triage.
- **Defer precedent-setting disputes** — log the dispute, assign a temporary resolution, mark it as "pending PO review." The temporary resolution is explicitly reversible.

The manager agent may NOT, even in emergency:

- Create or dissolve teams
- Approve production deployments
- Make architecture decisions
- Modify Jira or external systems
- Amend governance documents
- Make precedent-setting decisions (only temporary resolutions)

### Emergency Decision Log

Every emergency decision is logged by the acting authority:

```markdown
## Emergency Decision Log

| # | Timestamp | Acting authority | Decision | Normal authority | Reason PO unavailable | Reversible? | PO reviewed |
|---|---|---|---|---|---|---|---|
| E-001 | 2026-03-20 14:30 | MGR:Rich | Prioritized apex-research handoff over hr-devs request | PO (Row 31 blocking) | Session timeout, PO offline | Yes — re-prioritize on PO return | Pending |
```

The log persists in the manager agent's memory directory. PO reviews all entries on return. PO may reverse any emergency decision.

### Designation of Senior Team-Lead

When no manager agent is deployed and PO is unavailable, the **senior team-lead** acts as emergency cross-team router. "Senior" is designated by PO in advance (not self-appointed):

- PO names a senior team-lead in the workspace MEMORY.md or team roster
- Senior team-lead has cross-team routing authority only (send messages between team-leads)
- Senior team-lead has NO escalation authority (cannot resolve disputes, cannot triage priorities)
- All cross-team messages routed by senior team-lead are logged for PO review

**Current state:** No senior team-lead is designated. This is acceptable at 2-3 teams. PO should designate before scaling to 4+ teams.

### Anti-Patterns

| Violation | Risk | Prevention |
|---|---|---|
| Emergency authority used when PO is available but busy | Authority creep — "busy" is not "unavailable" | Agent must attempt PO contact before invoking emergency protocol |
| Emergency decision treated as precedent | Bypasses PO's policy-making authority | All emergency decisions are explicitly temporary and reversible |
| Manager agent makes architecture decision under emergency | Scope expansion beyond what emergency authority grants | Emergency authority list is exhaustive — anything not listed is forbidden |
| No post-hoc review | Emergency decisions become de facto policy without PO awareness | PO reviews emergency log at start of every session |

---

## Patterns from Reference Teams (*FR:Finn*)

### Current hierarchy: 2-level (flat teams)

Both reference teams are flat: PO → team-lead → specialists. No manager agent layer exists yet. The framework vision adds a Level 1 manager agent layer, but it's not implemented in either reference team.

### Team-lead is coordinator-only — enforced by prompt

The team-lead role boundary is explicit and enforced by agent prompts:

**Forbidden tools for team-lead:**

- `Edit/Write` on source code (.ts, .svelte, .js, .sql, .css, .json config)
- Running builds, tests, deployments
- `git add/commit/push`
- Reading source code to understand implementation (that's Finn's job)

**Allowed tools for team-lead:**

- `Read` for team config, memory files, CLAUDE.md, roster
- `Edit/Write` only under the team's memory directory and roster JSON
- `Bash` for `date`, tmux commands, `git pull` (dev-toolkit only), cleanup scripts, `gh` commands for issue/PR management
- `SendMessage` — primary tool
- Task coordination tools

**Enforcement mechanism:** Teammates are instructed to send a reminder message if they observe team-lead violating these boundaries. Self-policing by the team, not infrastructure enforcement.

### Issue closure is team-lead's exclusive responsibility

Closing GitHub issues is the team-lead's job, never delegated. This creates a clean governance signal: issue closed = team-lead has reviewed and confirmed completion.

### Spawn-before-delegate rule

Team-lead cannot do work themselves even when no specialist is available. The rule: if no teammate is spawned, spawn one first, then delegate. This prevents role drift.

### Anti-patterns table

Both team-lead prompts include an explicit anti-patterns table:

| Violation | Why wrong | Correction |
|---|---|---|
| Team-lead read + edited .ts files | Wastes tokens, breaks workflow | Delegate to Finn + specialist |
| Team-lead ran tests | Implementer's job | Include "run tests" in delegation message |
| Team-lead wrote git commit | Implementer owns branch end-to-end | Implementer commits, pushes, creates PR |
| Team-lead spawned via Agent tool | Ignores roster model, wastes expensive tokens | Use spawn_member.sh |
| Team-lead did a "quick fix" | Breaks habit | Even 1-line fixes go through the team |

### Jira governance: human-gated

Jira issue creation/update requires explicit user request (from workspace MEMORY.md). Agents do not create Jira epics/stories/tasks on their own initiative. GitHub issues are agent-managed; Jira is human-gated.

### PR governance

Code review (Marcus) uses GitHub Reviews API with `--comment` (COMMENTED state) — creates formal review record in reviews widget, provides audit trail. Issue closure happens only after GREEN review from Marcus.

### Schedule awareness rule

Agents must run `date` before any schedule-related statement. No relative dates ("Monday", "tomorrow") without verifying the actual date. Prevents stale scheduling claims.

---

## Scaling Analysis (*FR:Montesquieu*)

How does this governance model behave as team count grows?

| Teams | L1 status | Governance load | Bottleneck risk |
|---|---|---|---|
| 1 | PO acts as L1 | Minimal — all intra-team | None |
| 2–3 | PO acts as L1 | Low — occasional cross-team routing | PO context switching |
| 4–5 | Manager agent recommended | Moderate — regular handoffs, potential conflicts | PO becomes routing bottleneck |
| 6–10 | Manager agent required | High — multiple concurrent handoffs, broadcast management | Manager agent context window |
| 10+ | Multiple manager agents or domain grouping | Very high — need sub-hierarchies | Single manager agent context limit |

**At 10+ teams:** Consider domain-grouped management — one manager agent per domain (e.g., project teams, infrastructure teams, research teams), with PO coordinating the managers. This adds a governance layer but prevents any single agent from holding context on 10+ teams.

---

## Failure Modes (*FR:Montesquieu*)

| Failure | Description | Detection | Recovery |
|---|---|---|---|
| **Authority drift** | An agent regularly makes decisions above its level | Decisions appear in scratchpads/PRs without corresponding authority | Medici audit flags; team-lead or L1 corrects |
| **Governance bypass** | Agent skips escalation and acts directly | Action taken without required approval in decision log | Post-hoc audit by Medici; PO reviews |
| **Bottleneck** | L1 (or PO acting as L1) becomes the constraint on team velocity | Handoff requests age; teams idle waiting for routing | Deploy manager agent; increase L1 autonomy |
| **Policy gap** | A decision type not in the matrix arises | Agent is unsure who decides; asks multiple parties | Agent escalates to next level up; PO adds to matrix |
| **Dual authority** | PO and manager agent both give directives to same team | Conflicting instructions; team-lead cannot comply with both | Clear handoff: when L1 is deployed, PO addresses L1, not team-leads directly (except emergencies) |
| **Audit overreach** | Auditor treats findings as binding directives | Audited team receives "you must" language from non-authority | Team-lead pushes back; L1 mediates |

---

## Open Questions

### Resolved by this document

- ~~How many levels of hierarchy?~~ → 4 levels: PO (L0) → Manager agent (L1) → Team lead (L2) → Specialist (L3)
- ~~Can a manager agent approve PRs or only humans?~~ → Neither. PR merge is team-lead scope (L2). Code review verdict is specialist scope (reviewer agent). Manager agent has no PR authority.
- ~~What decisions require human approval vs. can be delegated?~~ → See Decision Delegation Matrix (49 decision types mapped, including XP pipeline governance rows 40-45 and Librarian governance rows 46-49 added from T09 v2)
- ~~Conflict resolution — when two teams disagree, who decides?~~ → See Q5 (escalation ladder: direct → L1 → PO)
- ~~How do we prevent a manager agent from going rogue?~~ → See Anti-Patterns table + Failure Modes (authority drift, governance bypass)

### Still open

1. **Multiple manager agents** — At 10+ teams, one manager agent cannot hold context on all teams. Domain-grouped management is proposed but not designed. What are the domains? How do manager agents coordinate with each other?

2. **Governance document amendment protocol** — The delegation matrix says PO amends governance docs, but the process for proposing amendments (who drafts, who reviews, what approval looks like) is undefined beyond "PO edits directly."

3. ~~**Emergency authority override**~~ → Resolved. See §Emergency Authority Protocol. Time-bounded, scope-limited emergency authority with mandatory post-hoc PO review. Four escalation levels: PO present → PO unavailable with manager agent → PO unavailable without manager agent → blocking production incident.

4. **Governance compliance audit** — Medici audits knowledge health. Who audits governance compliance — whether agents are actually following the delegation matrix? Is this a Medici responsibility, a separate role, or a PO spot-check?

5. ~~**Direct link governance lifecycle**~~ → Resolved via T03/T04 coordination with Herald. L1 performs periodic reviews triggered by: time-based (30 sessions), inactivity (10 sessions), scope change, incident, or on-demand. Review process and registry extension defined in T03 Protocol 2. Authority to revoke is L1 per delegation matrix Rows 27-28.

(*FR:Montesquieu*)
