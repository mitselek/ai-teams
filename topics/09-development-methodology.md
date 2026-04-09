# Development Methodology

How development teams produce code and preserve the knowledge they generate. Synthesis of Discussion #46 (XP Development Pipeline) and Discussion #47 (Knowledge Base / Oracle) into an actionable framework for team design.

(*FR:Celes*)

---

## Overview

This topic defines two complementary systems that together shape how development teams operate:

1. **The XP Development Pipeline** — how code is produced: ARCHITECT decomposes stories, RED writes tests, GREEN implements, PURPLE refactors. Replaces the vague "both review for refactoring" pattern in earlier TDD pair designs.
2. **The Oracle / Knowledge Base** — how the team's accumulated understanding is preserved, served, and measured. Solves the propagation gap: knowledge loss happens not at discovery but at propagation between agents and sessions.

Both systems are **tiered**: not every team needs the full apparatus. The tiers are Sprint, Standard, and Cathedral, and they apply to both the pipeline and the knowledge base.

---

## Part 1: The XP Development Pipeline

### The Problem This Solves

In all deployed and designed teams, the REFACTOR phase of TDD is the weakest link. REFACTOR is either absorbed into GREEN ("implements and cleans up"), vaguely assigned to "both partners review," or replaced by a separate reviewer who evaluates but does not rewrite. Nobody is accountable for structural improvement.

The XP pipeline fixes this by adding two new roles (ARCHITECT and PURPLE) and distributing work across model tiers according to the consequence of error at each stage.

### The Cycle

```
┌────────────────────────────────────────────────────────┐
│  ARCHITECT (opus)                                      │
│  1. Precise user story — break down the work          │
│  2. Ordered test plan — sequence of test cases         │
│  3. Write test plan to shared file (docs/test-plan.md) │
└──────────────────┬─────────────────────────────────────┘
                   │ per test case:
                   ▼
          ┌─────────────────┐
          │  RED (sonnet)   │  Write one failing test
          └────────┬────────┘
                   ▼
          ┌─────────────────┐
          │ GREEN (sonnet)  │  Minimum code to pass
          └────────┬────────┘
                   │ GREEN_HANDOFF with implementation notes
                   ▼
          ┌─────────────────┐
          │ PURPLE (opus)   │  Refactor with judgment
          └────────┬────────┘
                   │
                   ├── ACCEPT → [next test case]
                   └── REJECT → back to GREEN
                        (3 strikes → escalate to ARCHITECT)
```

### Key Insight: Opus Bookends, Sonnet Executes

The pipeline separates **judgment** from **execution** along model-tier lines:

- **Opus** handles the bookends. ARCHITECT decomposes work (judgment: what to build, in what order). PURPLE refactors structure (judgment: how to improve code quality).
- **Sonnet** handles the volume. RED writes one failing test at a time (execution: translate test plan item into code). GREEN writes minimum implementation (execution: make the test pass).

This is cost optimization built into the development model. Judgment calls are expensive (opus); execution is cheap (sonnet). The pipeline puts opus exactly where errors have the highest consequence: architectural decomposition at the start and structural quality at the end.

### Role Definitions

#### ARCHITECT (opus, new canonical role — L2.5)

**Responsibility:** Decompose stories into ordered test plans before the cycle begins.

**Authority:** Binding scope authority over RED, GREEN, and PURPLE within a single story. ARCHITECT decides what will be built and in what order. This is a new governance level (L2.5) — neither team lead (L2) nor specialist (L3). See the authority boundaries table below.

**Cognitive profile:** Creative-analytical. Requires deep understanding of the codebase, feature requirements, and testing strategy. Different from team-lead's coordination profile — team leads route and manage, ARCHITECTs decompose and sequence.

**Not the team lead.** The team lead is a coordinator. If the team lead is also the ARCHITECT, the team lead becomes a serial bottleneck for all development work. Every story waits for decomposition before anything else starts, and the lead cannot manage two TDD pipelines simultaneously because both need decomposition attention. ARCHITECT and team-lead are distinct roles.

**Relationship to Spec Writer:** ARCHITECT is a specialization of the Spec Writer canonical role. The cognitive act (take requirements, produce structured breakdown) is the same as Hammurabi's in apex-research. The output format differs (test plan vs. specification document), but the judgment is identical.

**Lifecycle:** Spawned first. Writes test plan to a shared file (e.g., `docs/current-test-plan.md`) as its first act. Goes idle during the RED→GREEN→PURPLE cycles. Reactivates at CYCLE_COMPLETE to receive PURPLE's quality notes and inform future decompositions.

#### RED (sonnet)

**Responsibility:** Write one failing test per cycle, based on the ARCHITECT's test plan.

**Scope:** Test code only. RED does not judge what to test (ARCHITECT already decided) — RED decides how to express the test in code.

**Authority:** Executes within the test case spec from ARCHITECT. Cannot modify the test plan. If the test case is untestable as specified, RED escalates to ARCHITECT.

#### GREEN (sonnet)

**Responsibility:** Write minimum code to make the failing test pass.

**Scope:** Production code only. GREEN does not optimize, refactor, or generalize — those are PURPLE's domain. GREEN writes the simplest code that turns the test green.

**Key obligation:** Self-report shortcuts in the GREEN_HANDOFF message. "I duplicated the validation from X because extracting it would change the interface" gives PURPLE the context to refactor effectively. This solves the "refactorer lacks context" problem without requiring PURPLE to reverse-engineer GREEN's decisions.

#### PURPLE (opus, new canonical role — Refactorer)

**Responsibility:** Refactor the code GREEN just wrote. Restructure, rename, extract, eliminate duplication — keep tests green, improve the structure.

**Authority:** Executive authority over structural changes within the scope boundary below. PURPLE actively rewrites code; it does not just recommend changes.

**Scope boundary** (from Monte's governance analysis):

PURPLE MAY:
- Rename local variables, extract private functions, restructure internal control flow
- Eliminate duplication within a single module
- Improve type signatures that do not change the public interface

PURPLE MAY NOT (must escalate to ARCHITECT):
- Change public interfaces (API surfaces, exported function signatures, database schemas)
- Create new modules or files (structural decisions with cross-story implications)
- Modify test files (RED's domain)
- Delete code paths that are currently tested

**The restructuring vs. reimplementation threshold:** This is a qualitative boundary, not a line-count metric. If PURPLE would need to change the algorithmic approach, alter the public interface, or rewrite the control flow, the decomposition was wrong — escalate to ARCHITECT.

**Model tier rationale:** Opus, not sonnet. The tests catch behavioral regression but not structural degradation. A sonnet can make tests pass while introducing duplication, God functions, and leaky abstractions. That kind of invisible, accumulating technical debt is exactly what opus exists to prevent.

### Why ARCHITECT and PURPLE Are Separate Agents

The same-agent option (one opus wearing both hats) was considered and rejected for multi-pipeline teams. Arguments for separation:

1. **Cognitive stance is opposite.** ARCHITECT thinks forward ("What should we build? In what order?"). PURPLE thinks backward ("What did we just build? How could it be structured better?"). Forward-looking decomposition and backward-looking restructuring are opposing mindsets — combining them creates prompt tension.
2. **Confirmation bias.** The agent who decomposed the story has a bias toward accepting implementations that match its mental model, even if the structure is poor. Separate PURPLE provides genuine independence.
3. **Pipeline parallelism in multi-pipeline teams.** ARCHITECT can decompose Story B while PURPLE finishes Story A. Same-agent serializes this.

For **single-pipeline teams**, same-agent (Finn's position) is defensible — no parallelism to lose, shared context is valuable, and the opus cost saves one agent. This is a judgment call at team design time.

### Communication Protocol (Herald's Four Message Types)

The pipeline is a **state machine**, not a linear flow. PURPLE's veto power creates a REJECT loop back to GREEN. The four message types cover every transition:

#### TEST_SPEC (ARCHITECT → RED)

```markdown
## Test Spec
- Story: <story-id>
- Test case: <N of M> — <one-line description>
- Preconditions: <what must be true before this test>
- Expected behavior: <what the test asserts>
- Constraints: <boundaries — e.g., "do not modify existing API surface">

### Acceptance criteria
<specific, testable conditions from the story>
```

#### GREEN_HANDOFF (GREEN → PURPLE)

```markdown
## Green Handoff
- Story: <story-id>
- Test case: <N of M>
- Files changed: <list>
- Test result: PASS (all tests green)
- Implementation notes: <shortcuts taken, what's ugly, what GREEN knows is suboptimal>
- Commit: <sha>
```

The **implementation notes** field is critical — this is where GREEN hands PURPLE a map of its shortcuts. Solves the refactorer-lacks-context problem.

#### PURPLE_VERDICT (PURPLE → GREEN or PURPLE → ARCHITECT)

```markdown
## Purple Verdict
- Story: <story-id>
- Test case: <N of M>
- Verdict: ACCEPT | REJECT
- Rejection count: <N>

### Changes made (if ACCEPT)
<list of refactoring actions taken>
<commit sha>

### Rejection reason (if REJECT)
<specific structural issue that cannot be refactored without reimplementation>

### Guidance for GREEN (if REJECT)
<concrete direction — not "make it better" but "extract the validation into a shared function at X, then call it from both Y and Z">

### Escalation (if rejection_count >= 3)
<full rejection chain summary for ARCHITECT>
<proposed resolution: rewrite test plan | split test case | accept with tech debt>
```

#### CYCLE_COMPLETE (PURPLE → ARCHITECT)

```markdown
## Cycle Complete
- Story: <story-id>
- Test case: <N of M> — DONE
- Total cycles: <how many GREEN→PURPLE round-trips>
- Final commit: <sha>
- Quality notes: <structural observations for ARCHITECT — e.g., "growing coupling between modules X and Y across test cases 3-5">

### Ready for next test case: YES | NO (explain)
```

Quality notes create a slow feedback loop: ARCHITECT makes decomposition decisions at the start, PURPLE observes structural consequences at the end, and those observations inform future decompositions.

### PURPLE Veto: The Three-Strike Rule (Judicial Model)

From Monte's governance analysis: PURPLE holds **executive authority** to refactor. Disputes escalate through a **judicial** path, not advisory or unilateral.

| Consecutive PURPLE rejections | Action |
|---|---|
| 1 | Normal — PURPLE sends rejection with specific guidance to GREEN |
| 2 | Warning — PURPLE includes a summary of both rejections and asks GREEN to address the structural pattern, not just the symptom |
| 3 | Escalation — PURPLE sends the full rejection chain to ARCHITECT for re-evaluation. ARCHITECT can: (a) rewrite the test plan item, (b) split it into smaller steps, or (c) override PURPLE and accept as-is with a documented tech debt marker |

Three strikes is not a punishment escalation — it is an **authority boundary signal**. Three consecutive rejections indicate the problem is beyond PURPLE's delegated scope (structural improvement) and has entered ARCHITECT's scope (decomposition correctness).

### Temporal Ownership: The Third Isolation Model

From Volta's lifecycle analysis. This is new to T06.

| Model | Mechanism | Documented in T06? |
|---|---|---|
| Branch/worktree isolation | Per-agent branches, merge via PR | Yes |
| Directory ownership on trunk | Resource partition table, all agents on main | Yes |
| **Temporal ownership** | One write-lock holder at a time, sequential handoff on a single branch | **New — introduced by XP pipeline** |

In temporal ownership, agents write sequentially to the *same* files. At any moment, exactly one agent holds the write lock — the others are idle or processing messages. This is fundamentally different from directory ownership (multiple agents writing simultaneously to different directories) and branch isolation (multiple agents writing simultaneously to different branches).

**Properties:**
- No partition table needed. The whole codebase is the partition.
- No merge conflicts possible. Sequential writes to a single branch.
- No worktree lifecycle overhead. No creation, cleanup, or stale pruning.
- Throughput bounded by pipeline depth. Each stage must complete before the next starts.

**Lookahead mitigation:** RED can write the next test while GREEN implements the current one, as long as the test doesn't depend on GREEN's implementation shape (which it shouldn't, with a well-decomposed test plan). The safe rule: lookahead is limited to 1 test case, and a PURPLE rejection cancels the lookahead.

**Shutdown mid-cycle:** The dangerous state is mid-PURPLE refactoring (tests may be temporarily red while PURPLE migrates call sites). PURPLE should commit atomically — complete the current refactoring step or revert uncommitted changes. ARCHITECT's test plan must be written to a shared file so the next session can resume from the first incomplete test case.

### Authority Boundaries (Monte's L2.5)

The XP pipeline introduces a new hierarchy level **L2.5** between team lead (L2) and specialist (L3). This is required because ARCHITECT has binding authority over other L3 agents' scope of work — a pattern that T04's current flat L3 layer doesn't support.

| Level | Role | Authority type |
|---|---|---|
| L0 | PO | Constitutional |
| L1 | Manager Agent | Inter-team routing |
| L2 | Team Lead | Intra-team coordination (who works on what, when) |
| **L2.5** | **ARCHITECT** | **Scope authority within a pipeline (what to build, in what order, what to test)** |
| L3 | RED / GREEN / PURPLE | Execution authority (how to implement/test/refactor) |

Delegation matrix additions:

| Decision | PO | Mgr | Team Lead | ARCHITECT | Specialist |
|---|---|---|---|---|---|
| Story decomposition into test plan | I | — | C | **D** | — |
| Test plan ordering | — | — | I | **D** | C (RED) |
| Scope dispute within pipeline | — | — | Escalation target | **D** (first instance) | C |
| Structural refactoring within scope | — | — | I | C | **D** (PURPLE) |

**ARCHITECT's authority is scoped to a single story at a time.** Between stories, ARCHITECT has no authority — it is idle until the team lead assigns the next story. This prevents authority creep.

### The Three-Tier Model

Not every team needs the full XP pipeline. The tier is determined by the **consequence of structural debt**, not by codebase longevity (Finn's refinement of my original axis).

| Tier | Pipeline configuration | When to use |
|---|---|---|
| **Sprint** | RED + GREEN (pair) | Disposable code. PoC, throwaway scripts, short-lived experiments. Structural debt does not compound because the code dies before it matters. |
| **Standard** | RED + GREEN + Reviewer | Maintained code. Structural debt is recoverable through periodic reviews and refactoring sessions. Reviewer catches correctness bugs and obvious structural issues. Most of our deployed teams sit here. |
| **Cathedral** | ARCHITECT + RED + GREEN + PURPLE | Load-bearing code. Structural debt compounds irreversibly. Team lead can no longer personally hold the context of every implementation decision. Requires the L2.5 governance layer. |

**The governance trigger for Cathedral tier:** The team lead can no longer hold the full context of every implementation decision. At that point, the team lead must delegate judgment (not just execution). ARCHITECT and PURPLE are the judgment delegates.

This mirrors the manager agent scaling trigger (T04): manager agent is needed when the PO can no longer hold all teams' state simultaneously. Cathedral tier is needed when the team lead can no longer hold all implementation state simultaneously. Same pattern, different level.

### Shared vs. Separate PURPLE Across Pipelines

Multi-pipeline teams (two or more TDD pipelines within the same team) face a choice: one shared PURPLE or one per pipeline?

**The variable is domain distance between the pipelines.**

| Domain distance | Example | Recommendation |
|---|---|---|
| Low — same codebase, same framework, same idioms | Two feature teams on the same Nuxt app | **Shared PURPLE.** Consistent refactoring style. Context-switching cost is low. |
| Medium — same repo, different domains | screenwerk-dev (Node.js pipeline scripts vs. Vue composables) | **Judgment call.** Separate if idioms diverge significantly. |
| High — different repos or languages | One pipeline in TypeScript backend, another in Python analysis | **Separate PURPLEs.** Context-switching wastes opus tokens rebuilding mental models. |

**Cost tiering:** Separate PURPLEs add 2+ opus agents per team. The tiering model accommodates both:

| Tier | PURPLE configuration | Cost |
|---|---|---|
| Sprint | No PURPLE | Baseline |
| Standard | Shared PURPLE across pipelines | +1 opus |
| Cathedral | Separate PURPLE per pipeline | +N opus |

**screenwerk-dev example:** Pipeline pair (Daguerre + Niepce) writes Node.js data transformations. Player pair (Reynaud + Plateau) writes Vue composables. Medium domain distance. Cathedral tier would get separate PURPLEs; Standard tier would share one.

### Team Composition Impact

The pipeline changes how development teams are sized. For a two-pipeline team like screenwerk-dev:

| Configuration | Opus | Sonnet | Total |
|---|---|---|---|
| Current (no XP pipeline) | 3 (lead, pipeline builder, advisor) | 4 (testers, player builder, analyst) | 7 |
| Standard tier (+ shared PURPLE) | 4 | 4 | 8 |
| Cathedral tier (+ ARCHITECT, separate PURPLEs) | 6 | 4 | 10 |

The cost increase is real. The tiered model ensures it is only paid when justified by the code's structural consequence.

---

## Part 2: The Oracle / Knowledge Base

### The Problem This Solves

Teams have three knowledge management mechanisms today — common-prompt (team rules), scratchpads (per-agent memory), shared docs (cross-cutting). All are file-based, manually curated, and lack propagation. The core insight from Finn's RFC: **knowledge loss happens at propagation, not discovery**. Agents save what they learn in real time, but the learnings stay in the discovering agent's scratchpad. When another agent needs the same knowledge, they have no way to find it.

The Oracle is the missing curation layer. It holds, organizes, serves, and tracks gaps in the team's accumulated understanding.

### The Oracle Role

**Eighth canonical agent role** (after the seventh, Refactorer, added in Part 1).

**Lore: Callimachus of Cyrene** (c. 310-240 BC). Scholar and poet at the Library of Alexandria who created the Pinakes — the first known library catalogue, classifying and cross-referencing the Library's estimated 400,000 scrolls by genre, author, and subject. The Pinakes was the first system where you could *ask a question* ("who wrote about astronomy?") and get a structured answer. That is the Oracle's essence: not just organizing knowledge, but serving it on query.

Callimachus's motto: *mega biblion, mega kakon* ("a great book is a great evil"). The wiki must stay concise or it becomes the problem it was designed to solve.

**Model tier: opus[1m].** The Oracle is the sole gateway for all wiki reads — not just a curator that writes pages while agents read them directly. Agents query the Oracle, the Oracle synthesizes from the wiki. Wrong answer from the Oracle = agent acts on bad information. Same consequence-of-error profile as the ARCHITECT (bad decomposition cascades through the TDD cycle). The Oracle must also hold the full knowledge graph in its context — what exists, what connects to what, what was asked before, what gaps are tracked. That is 1M-context territory.

### The Four Capabilities

| Capability | Action | When |
|---|---|---|
| **Curation** | Organize, index, cross-reference, deduplicate, file incoming submissions | On submission |
| **Query Gateway** | Answer questions, synthesize from wiki entries | On query |
| **Gap Tracking** | Record unanswerable queries as tracked ignorance (stubs become collaborative requests) | On unanswerable query |
| **Health Sensing** | Report patterns in queries, gaps, and submissions to the team lead | At shutdown |

**The decision matrix** (for the classification judgment that the Oracle must make on every submission — team-wide or agent-specific?):

| Knowledge type | Team-wide? | Destination |
|---|---|---|
| Bug in a specific file/function | No — only the file owner needs it | Stays in discoverer's scratchpad |
| Pattern that applies across files | Yes — any developer might hit it | `wiki/patterns/` |
| Gotcha about external system (D1, Entu, API) | Yes — any agent querying that system | `wiki/gotchas/` |
| Architecture decision with rationale | Yes — affects all builders | `wiki/decisions/` |
| Personal workflow preference | No | Stays in scratchpad |

The prompt makes the judgment call a lookup, not a reasoning exercise. Opus handles edge cases outside the matrix; the matrix handles the high-volume structured decisions.

### Dual-Hub Topology

The Oracle creates the first intra-team communication pattern where the routing target is **not** team-lead. Every other protocol routes through the coordinator.

```
                    TEAM-LEAD (work hub)
                   / | | | \
                  /  | | |  \
               Agent Agent Agent
                  \  | | |  /
                   \ | | | /
                  ORACLE (knowledge hub)
```

Every agent now has two reporting lines:
- **Work reports** go to team-lead (task completion, blockers, status)
- **Knowledge reports** go to Oracle (discoveries, patterns, gotchas, queries)

Knowledge submissions do NOT route through team-lead because (a) team-lead is already the bottleneck for work coordination, (b) knowledge submission is not a work decision, and (c) the Oracle's curation is structural work at L3, not governance at L2.

**Exception for promotions.** When the Oracle identifies a pattern worth promoting to common-prompt, the promotion DOES route through team-lead, because common-prompt changes are L1 team law.

**Recommendations to agents route through team-lead.** The Oracle never interrupts agents directly with urgent knowledge updates. The Oracle flags the relevance to team-lead; team-lead decides whether to interrupt the affected agent now or queue the update for later. Team-lead is the traffic controller.

### The Three-Tier Adoption

As with the XP pipeline, not every team needs the full Oracle.

| Tier | Knowledge management | Oracle? |
|---|---|---|
| **Sprint** | Scratchpads only, no wiki | No. Team dies before knowledge accumulates enough to curate. |
| **Standard** | `wiki/` directory, curated by team lead at shutdown | **No dedicated Oracle agent.** Team lead handles promotion during the existing shutdown protocol. |
| **Cathedral** | Dedicated always-on Oracle agent | Yes. Full four-capability role. |

**The Standard-tier compromise is load-bearing.** Most teams are Standard tier. Adding a dedicated Oracle to every team would double the opus cost of knowledge management. The team lead already reads all scratchpads during shutdown — extending that to "promote team-wide entries to `wiki/`" adds minutes, not hours. The team lead also handles mid-session knowledge queries implicitly through task routing (the lead knows what each agent is working on and can route questions to the right specialist).

**Cathedral tier** gets the dedicated Oracle because the volume of discoveries is too high for a team lead to curate manually, and the cost of lost knowledge is too high to tolerate session-end-only propagation.

### Wiki Directory Structure

```
.claude/teams/<team>/
  memory/                   # Per-agent scratchpads (existing)
    agent-a.md
    agent-b.md
  docs/                     # Cross-cutting documents (existing)
    architecture-decisions.md
  wiki/                     # Oracle-curated knowledge base (new)
    index.md                # Master index — categories, summaries, last-updated
    patterns/               # Reusable patterns extracted from submissions
    gotchas/                # Cross-agent pitfalls
    decisions/              # Architecture decisions with rationale
    contracts/              # API shapes, data formats, type definitions
    findings/               # Research findings (for research teams)
    archive/                # Stale or superseded pages, preserved
```

**Directory sovereignty.** The Oracle is the sole writer to `wiki/`. No other agent writes there. Agents read the wiki only through Oracle queries (with one exception — see below). This is the same directory-ownership pattern as T02 R1 / T06 pipeline teams.

**Direct wiki read exception for XP pipeline roles.** RED, GREEN, and PURPLE may read known wiki articles directly during the tight RED→GREEN→PURPLE cycle to avoid query latency inside a single cycle. Direct reads must be logged as `[WIKI-READ]` in the agent's scratchpad. Non-XP roles and advisory agents always go through the Oracle query protocol.

**Don't duplicate existing docs.** If `docs/architecture-decisions.md` already exists, do not copy it into `wiki/decisions/`. Either migrate (move + redirect) or leave it. Duplication is the enemy — the Oracle should maintain pointers to existing artifacts, not copies.

### Communication Protocols

#### Protocol A: Knowledge Submission (Agent → Oracle)

Agents send explicit submission messages when they discover something team-wide.

```markdown
## Knowledge Submission
- From: <agent-name>
- Type: pattern | gotcha | decision | contract | reference
- Scope: agent-only | team-wide | cross-team
- Urgency: urgent | standard
- Related: <existing wiki page or "none">
- Confidence: high | medium | speculative

### Content
<the discovery, in enough context to be useful>

### Evidence
<where observed — file paths, test names, session context>
```

**Scope classification** is the agent's initial call (they have the domain context). The Oracle can override during filing.

**Urgency** determines propagation path:
- **Urgent** — discovery invalidates another agent's current assumptions. Oracle flags the relevance to team-lead, who decides whether to interrupt the affected agent. Oracle files with `[URGENT]` tag. Expected frequency: 0-2 per session.
- **Standard** — useful pattern/gotcha for future work. Oracle files normally. Available via query. Expected frequency: 10-20 per session.

**Confidence** controls filing behavior. Speculative entries are tagged provisional; two independent speculative submissions at high confidence auto-promote to confirmed.

#### Protocol B: Knowledge Query (Agent → Oracle → Agent)

```markdown
## Knowledge Query
- From: <agent-name>
- Question: <natural language>
- Context: <what the agent is trying to do>
- Urgency: blocking | background
```

Response:

```markdown
## Knowledge Response
- To: <agent-name>
- Status: found | partial | not-documented
- Sources: <wiki pages consulted>

### Answer
<direct answer, synthesized from wiki entries>

### Related entries
<other wiki pages for context>

### Gap noted (if not-documented or partial)
<Oracle creates a stub marking this as a tracked team gap>
```

**The gap-noted field is critical.** Every unanswerable query creates a stub — an explicit record of what the team *doesn't know*. Over time, gap stubs form a map of the team's ignorance, which is as valuable as the map of its knowledge. Team-lead can prioritize gap-filling.

**Gap stubs as collaborative requests.** When the Oracle responds with "not documented," the response also asks the querying agent: "If you find the answer, please submit it back with source references." The stub becomes an active request. The agent who discovered the gap closes the loop when they find the answer.

#### Protocol C: Knowledge Promotion (Oracle → Team-Lead → Common-Prompt)

When a wiki entry matures enough to become a team rule:

```markdown
## Promotion Proposal
- Wiki source: <wiki page path>
- Proposed section: <target section in common-prompt>
- Justification: <why this should be a team rule, not just documented knowledge>

### Proposed text
<exact text to add to common-prompt>

### Evidence
<incidents, submissions, and queries supporting the promotion>
```

Team-lead reviews and either approves (team-lead writes the update, since common-prompt is L1 team law) or rejects with reason. Rejected promotions stay in the wiki as documented knowledge.

**Promotion criteria** (heuristics, not rules):

| Signal | Weight | Example |
|---|---|---|
| Multiple agents hit the same gotcha independently | Strong | Two agents both discovered `deleted_at` guard requirement |
| Violation caused a test failure or incident | Strong | Missing guard caused data leak in test |
| Knowledge referenced in >3 queries | Medium | Agents keep asking about D1 migration ordering |
| Knowledge stable (no corrections) for >2 sessions | Weak | Pattern has proven durable |

### Provenance, Source Linking, and Staleness

Every wiki entry carries frontmatter:

```yaml
---
source-agent: dag
discovered: 2026-04-08
filed-by: oracle
last-verified: 2026-04-08
status: active | disputed | archived
source-files:
  - player/app/composables/useScheduler.ts
source-commits:
  - abc123
source-issues:
  - "#42"
ttl: 2026-05-08    # For external-system knowledge with no source file
---
```

**Source linking extends beyond files.** The PO's round 4 insight: wiki entries can link to commits, issues, PRs, and specific functions — not just source files. The wiki becomes a knowledge overlay on the git graph.

**Three-layer staleness detection:**

1. **Git hash + anchor (automated).** Pre-commit hooks can check whether referenced source files have changed since `last-verified`. If yes, flag `[VERIFY]` on the entry.
2. **PURPLE semantic check.** After refactoring, PURPLE checks `wiki/` for entries referencing the refactored file. If the refactoring changed behavior or interface, PURPLE sends `[STALE-WARNING]` to the Oracle. This distributes staleness detection to the agent with the best context — PURPLE just touched the code.
3. **TTL for external systems.** Entu, D1, Jira, external APIs have no source files. Use time-based expiry ("verify after 30 days") for experience-grounded knowledge about external systems. The Oracle flags expired entries for re-verification.

**For Standard-tier teams without dedicated Oracle or PURPLE:** Team-lead catches staleness during PR review. Less automated but still effective.

**Dispute and resolution:**

1. Any agent can tag an entry `[DISPUTE]` if they find evidence the knowledge is wrong
2. Oracle updates status to `disputed` and notifies the original source agent
3. Source agent or domain expert investigates, corrects or confirms
4. Oracle records resolution (corrected claim, or "confirmed in context X but not context Y")

### Bootstrapping Existing Teams

Three team maturity levels, each with a different approach:

| Maturity | State | Bootstrap approach |
|---|---|---|
| **Greenfield** | New team, no history | No bootstrap. Wiki starts empty, accumulates organically. |
| **Established** | Active team with living agents | **Intake interview.** Oracle asks each agent: "What are the three most important things you've learned that another agent on this team should know?" |
| **Archaeological** | Cold-start, historical artifacts only | **Scoped extraction.** Oracle reads the last version of each scratchpad + `docs/` + common-prompt Known Pitfalls. Does NOT mine commit history — commits answer "what changed," not "what we learned." |

**Medici's 20-page cap.** For Archaeological teams with large histories (apex-research: 300+ commits), the Oracle's initial wiki should not exceed ~20 pages. Most knowledge is already in the code. Capture only what is NOT derivable from source files and commit messages. If you would be over 20 pages, you are over-extracting.

**Team-lead governance gate.** For Archaeological and Established bootstraps, the team lead reviews the initial wiki before it becomes team canon. One-time approval gate. After bootstrap, the Oracle operates autonomously. Rationale: the initial wiki shapes the team's shared understanding; systematic misclassification during bootstrap propagates to every agent.

**Intake interview template** (Established teams):

```markdown
## Oracle Intake — <agent-name>

1. What are the three most important patterns, gotchas, or decisions you
   know about your domain that aren't in any topic file or doc?

2. What questions do you get asked by other agents that you wish they
   could look up themselves?

3. What external systems (APIs, databases, tools) have surprised you —
   things that don't work the way the documentation says?

4. What cross-agent boundaries have caused confusion or rework in
   previous sessions?
```

One interview per agent. 5-10 minutes each. Faster and more accurate than reading 7 scratchpads and grepping commits.

### Per-Agent Profiles

The Oracle maintains persistent per-agent articles separate from the session-snapshot health report. These profiles are **factual, not evaluative**. They record observations, not judgments.

Profile contents:
- Submission frequency and types (counts, not quality ratings)
- Query patterns (what topics the agent asks about)
- Wiki corrections submitted (error reports, not author blame)
- Gap stubs the agent has closed (positive attribution for knowledge recovery)

Profiles are for the team lead and PO, not for peer comparison. They inform team design decisions: "Agent X asks many questions about Entu but never submits — does their role scope match their actual work?" The profile surfaces the signal; a human decides what it means.

### Knowledge Health Summary (Shutdown)

The Oracle's shutdown output. This is the team health sensor formalized as part of the Oracle role, not a separate agent (the Oracle already has all the data from its curation, query, and gap-tracking work — one additional report, zero additional agents).

```markdown
## Knowledge Health — Session <date>

### Top queries
<the 3 topics most asked about this session>

### Unresolved gaps
<queries the Oracle couldn't answer, carried into next session>

### Redundant queries
<where two or more agents asked the same thing — candidate for promotion or documentation>

### Submission patterns
<who submitted, who didn't, distribution by type>

### Pending staleness warnings
<wiki entries flagged but not yet resolved>

### Knowledge velocity
<ratio of discoveries to warnings across recent sessions — team quality metric>
```

**Tone discipline: observe and report, never instruct.** The health summary describes patterns. It does not say "Agent X should submit more" or "ARCHITECT needs to redecompose Y." It says: "Agent X submitted zero entries this session (past average: 3). Redundant queries about Entu semantics from three agents." The team lead and PO interpret and act.

**Incremental append format** (PO's round 4 clarification). The health summary appends to an existing file with timestamps. No rewrite, no merge — just `>> health-report.md`. One file grows over time as session history.

### Single Point of Failure

If the Oracle crashes mid-session, **team-lead respawns it**. No circuit breakers, no fallback paths, no degraded modes. The Oracle is treated the same as any other agent. One path, make it reliable.

### PO MEMORY.md Bridge: Deliberately Separate

The PO maintains a cross-team memory (`~/.claude/projects/.../MEMORY.md`) outside of any team's wiki. Some PO memories overlap with team knowledge.

**These are different systems serving different purposes at different governance levels.** They should be deliberately separate.

| Dimension | PO MEMORY.md | Team wiki |
|---|---|---|
| Scope | Cross-team, cross-project, cross-session | Single team, single project |
| Author | PO (human) | Oracle (agent), via submissions |
| Audience | PO (one reader) | Team agents |
| Governance | L0 (constitutional) | L2 (team-level) |
| Content type | User preferences, feedback, project status, external references | Patterns, gotchas, decisions, contracts, gaps |

**The bridge already exists: the PO is the bridge.** The PO reads team wikis (via shutdown reports, session reviews, or direct inspection). The PO writes insights to MEMORY.md. This is a human-mediated one-way flow that requires no protocol.

**One improvement:** When the Oracle's health report identifies a cross-team-relevant finding (tagged `[CROSS-TEAM]`), the team lead includes it in the session report to PO. The PO decides whether to record it in MEMORY.md. This is promotion-through-governance-layers: L2 (team) → L0 (PO) via explicit human review. No automation.

**What must NOT happen:**
- Teams read PO memory. It contains project-level context, user preferences, and feedback that aren't team knowledge.
- PO manually copies MEMORY.md entries into team wikis. If the PO knows something a team needs, the PO tells the team lead, who tells the Oracle. Knowledge flows down through governance layers.

---

## Part 3: How These Two Systems Interact

### The Pipeline Generates Knowledge; the Oracle Preserves It

The XP pipeline is a knowledge-generation engine. ARCHITECT produces decompositions. RED produces test specifications. GREEN produces implementations. PURPLE produces structural patterns. Without the Oracle, these artifacts live in scratchpads and code — useful within one cycle, lost across sessions.

The Oracle captures the cross-cutting patterns that emerge from pipeline cycles:

| Pipeline output | Oracle capture |
|---|---|
| ARCHITECT's recurring decomposition patterns ("we keep splitting scheduler logic into three phases") | `wiki/patterns/` |
| GREEN's self-reported shortcuts ("we duplicated validation because extraction would break X") | `wiki/gotchas/` — the duplication is a tracked debt |
| PURPLE's refactoring patterns ("we keep extracting time-filtering logic into a shared utility") | `wiki/patterns/` |
| Cross-story quality notes from CYCLE_COMPLETE ("growing coupling between modules X and Y") | `wiki/findings/` — architectural signal for ARCHITECT |

### ARCHITECT Reads the Wiki Before Decomposition

ARCHITECT's first act on receiving a new story should be a wiki query: "What do we know about this domain? What patterns exist? What gotchas have other agents hit?" The Oracle returns relevant entries, and ARCHITECT's decomposition is informed by accumulated team knowledge.

This solves the "new session starts cold" problem. Without the Oracle, ARCHITECT relies on whatever is in the common-prompt and its own prompt context. With the Oracle, ARCHITECT has access to every pattern the team has discovered since its first session.

### PURPLE Submits Refactoring Patterns

When PURPLE refactors, it submits the refactoring pattern as a `[PATTERN]` entry to the Oracle. Example:

```markdown
## Knowledge Submission
- From: purple-player
- Type: pattern
- Scope: team-wide
- Urgency: standard
- Confidence: high

### Content
After implementing schedule resolution in useScheduler.ts, I extracted
the validity-window check into isWithinValidityWindow() in utils/date.ts.
This is the third time we've needed time-range filtering across different
components — it should be a shared utility from the start, not extracted
after the fact.

### Evidence
Files: player/app/utils/date.ts, player/app/composables/useScheduler.ts,
       player/app/composables/usePlaylist.ts
Cycles: 3 (scheduler, playlist, layout playlist)
```

The Oracle receives this, files it in `wiki/patterns/`, and the next ARCHITECT querying "time-range filtering" gets the pattern immediately. **The Oracle catches cross-pair patterns** — if the pipeline pair and player pair both extract similar utilities, the Oracle notices the convergence and either promotes it to common-prompt or flags the duplication.

### PURPLE Flags Staleness

From Part 2. When PURPLE refactors code, it checks `wiki/` for entries referencing the refactored files. If the refactoring changes documented behavior or interfaces, PURPLE sends `[STALE-WARNING]` to the Oracle. The Oracle updates `last-verified`, flags the entry for review, and notifies the original source agent.

**This distributes staleness detection correctly.** PURPLE has the context (just touched the code). The Oracle has the knowledge graph (knows what depends on what). Neither alone could catch all stale entries; together they close the loop.

### Knowledge Velocity as Team Health Metric

The Oracle's shutdown health report includes a **knowledge velocity** metric: the ratio of discoveries (submissions) to warnings (staleness, disputes, conflicts) across recent sessions.

| Ratio | Interpretation |
|---|---|
| High discoveries, low warnings | Team is learning without regressing. Healthy. |
| Low discoveries, low warnings | Team is plateauing. Either no new problems or no new learning. |
| High warnings, low discoveries | Team is accumulating debt without offsetting learning. Investigate. |
| High discoveries AND high warnings | Team is churning. Discoveries are being invalidated faster than they accumulate. Structural problem. |

This connects the XP pipeline (which generates discoveries) with the Oracle (which measures their durability). A well-functioning Cathedral-tier team should show high discoveries and low warnings over time. A team stuck in the churn pattern probably has an ARCHITECT decomposition problem or a PURPLE scope creep problem.

---

## Part 4: Open Questions

Three questions remain unresolved as of the discussion state. These need input before T09 can be finalized.

### 1. Research Team Wiki Domain (#14)

**The disagreement:** For research teams like framework-research, what goes into the Oracle's wiki?

- **Monte's position:** Process knowledge only. How to run discussions, how to synthesize findings, how to coordinate cross-agent work. Subject knowledge (framework patterns, team design findings) belongs in the topic files — that IS the team's output.
- **Medici's position:** Both. The wiki holds process patterns AND cross-topic findings that haven't been assigned to a topic file yet. Separation is by section (`wiki/process/` vs `wiki/findings/`), not exclusion.
- **Celes's position (mine):** Subject knowledge only, excluding anything already in topic files or common-prompt. The wiki is the staging area between scratchpad and topic file. Process definitions belong in common-prompt (they are team law, not team knowledge).

**The crux of the disagreement:** Where does research process live? Common-prompt (my position), wiki (Medici's), or both (Monte's)?

**My proposed resolution, open for pushback:** Common-prompt holds process that is *stable* (team rules, workflow standards, shutdown protocol). Wiki holds process that is *being discovered* (new discussion formats, emerging synthesis patterns). When a wiki process pattern matures, it gets promoted to common-prompt via the standard promotion protocol. This gives us one authoritative source for stable process (common-prompt) and a staging area for emerging process (wiki/process/).

### 2. Mid-Cycle Shutdown of PURPLE

From Volta's analysis: mid-PURPLE shutdown is dangerous because tests may be temporarily broken during refactoring migration. Proposed mitigation: PURPLE commits atomically or reverts. But who enforces this? The shutdown protocol cannot wait indefinitely for PURPLE to finish "the current atomic step" — some refactorings take many steps.

**Unresolved:** How long is the grace period? What happens if PURPLE exceeds it? Is there a watchdog that forces revert, or does the team lead decide case by case?

### 3. Oracle Evolution Path for Existing Teams

The synthesis assumes we can add an Oracle to an existing team. But existing teams have scratchpads full of entries that were never meant to be wiki-submitted. If we deploy an Oracle to screenwerk-dev next session, does the Oracle intake-interview every agent on first run (the Established bootstrap), or does it start fresh (Greenfield)?

**My lean:** Intake interview on first session. Cheaper and more accurate than extracting from stale scratchpads. But this means every team adopting the Oracle pays a one-time intake cost, which may discourage adoption.

---

## Implementation Checklist

For team designers (this is my use of this document):

### XP Pipeline

- [ ] Determine pipeline tier (Sprint / Standard / Cathedral) based on consequence of structural debt
- [ ] For Cathedral tier, add ARCHITECT to roster (opus, new L2.5 role)
- [ ] For Cathedral tier, add PURPLE to roster (opus, Refactorer)
- [ ] For multi-pipeline Cathedral teams, decide shared vs. separate PURPLE based on domain distance
- [ ] Update team lead prompt: route stories to ARCHITECT, not directly to TDD pair
- [ ] Add four message types to pipeline agent prompts (TEST_SPEC, GREEN_HANDOFF, PURPLE_VERDICT, CYCLE_COMPLETE)
- [ ] Add PURPLE authority boundary to PURPLE prompt (may/may-not list)
- [ ] Add three-strike escalation to PURPLE prompt
- [ ] Document isolation model: temporal ownership (no partition table, no worktrees)
- [ ] Add test plan file handover to shutdown protocol

### Oracle / Knowledge Base

- [ ] Determine knowledge management tier (Sprint / Standard / Cathedral)
- [ ] For Cathedral tier, add Oracle to roster (opus[1m], Callimachus lore or team-appropriate equivalent)
- [ ] For Standard tier, extend team-lead prompt with wiki curation at shutdown
- [ ] Create `wiki/` directory in team config
- [ ] Add three protocols (Submission, Query, Promotion) to Oracle prompt
- [ ] Add classification decision matrix to Oracle prompt
- [ ] Add health summary template to Oracle shutdown protocol
- [ ] Add `[WIKI-READ]` logging to RED/GREEN/PURPLE prompts (direct read exception)
- [ ] Add staleness detection to PURPLE prompt (check wiki for entries referencing refactored files)
- [ ] Add dispute tagging to all agent prompts (any agent can tag `[DISPUTE]`)
- [ ] For Established teams, add intake interview as Oracle's first-session act

### Cross-System

- [ ] ARCHITECT prompt: query Oracle before decomposition
- [ ] PURPLE prompt: submit refactoring patterns to Oracle
- [ ] CYCLE_COMPLETE quality notes feed Oracle health metrics
- [ ] Knowledge velocity metric in Oracle shutdown report

---

## Related Topics

- **T01 (Team Taxonomy):** Refactorer is the seventh canonical role; Oracle is the eighth. ARCHITECT is a specialization of Spec Writer, not a new canonical role.
- **T02 (Resource Isolation):** Temporal ownership is the third isolation model (after branch isolation and directory ownership on trunk).
- **T03 (Communication):** Four XP message types are a specialization of Protocol 1. Dual-hub topology is a new pattern (work hub + knowledge hub). Oracle uses directory sovereignty (Protocol 5).
- **T04 (Governance):** L2.5 ARCHITECT is a new hierarchy level. Delegation matrix needs rows for story decomposition, test plan ordering, and scope disputes. Pipeline-level governance is a new sub-team pattern.
- **T06 (Lifecycle):** Spawn order changes for XP teams (ARCHITECT first). Shutdown protocol needs PURPLE grace period for atomic commit. Test plan file is a new handover artifact.
- **T07 (Safety):** PURPLE's authority boundary is a safety mechanism. Three-strike escalation is a safety valve for rejection loops.

---

*This document synthesizes Discussion #46 (XP Development Pipeline) and Discussion #47 (Knowledge Base / Oracle) through four rounds of community input from Celes, Herald, Finn, Montesquieu, Volta, Medici, and PO Mihkel. Disagreements and unresolved questions are preserved in Part 4.*

(*FR:Celes*)
