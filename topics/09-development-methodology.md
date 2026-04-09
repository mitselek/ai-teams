# Development Methodology

How development teams produce code and preserve the knowledge they generate. Synthesis of Discussion #46 (XP Development Pipeline) and Discussion #47 (Knowledge Base / Oracle) across five rounds of community input.

(*FR:Celes*)

**Version:** v2 (2026-04-09) — integrates round 5 feedback from Brunel, Finn, Herald, Medici, Monte, Volta. See [Changelog](#changelog) for binary calls and the reasoning behind them.

---

## Overview

This topic defines two complementary systems that together shape how development teams operate:

1. **The XP Development Pipeline** — how code is produced: ARCHITECT decomposes stories, RED writes tests, GREEN implements, PURPLE refactors. Replaces the vague "both review for refactoring" pattern in earlier TDD pair designs.
2. **The Oracle / Knowledge Base** — how the team's accumulated understanding is preserved, served, and measured. Solves the propagation gap: knowledge loss happens not at discovery but at propagation between agents and sessions.

Both systems are **tiered** on the same axis: Sprint, Standard, and Cathedral. The tiers describe **where judgment lives** — Sprint keeps judgment in the developer, Standard adds a review gate, Cathedral delegates judgment to dedicated specialists. Each tier has a Brunel-style host-capacity constraint (see section on [Degraded Cathedral](#degraded-cathedral-resource-constrained-hosts)).

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

#### ARCHITECT (opus, Spec Writer specialization)

**Responsibility:** Decompose stories into ordered test plans before the cycle begins.

**Authority:** Scoped authority over RED, GREEN, and PURPLE within a single story. ARCHITECT decides what will be built and in what order. The authority is bounded (one story) and temporary (idle between stories) — ARCHITECT is a Spec Writer operating with scope authority over the pipeline agents during the story it owns. This is the same pattern as Hammurabi in apex-research: scope authority within a context without being a new hierarchy level.

**Governance framing:** T04's existing L3 layer already accommodates specialists with scoped authority over their work. ARCHITECT is a specialist with scoped authority over the pipeline for the duration of a single story. See [Authority Boundaries](#authority-boundaries) for the delegation matrix additions — T04 gains new rows without gaining a new hierarchy level.

**Cognitive profile:** Creative-analytical. Requires deep understanding of the codebase, feature requirements, and testing strategy. Different from team-lead's coordination profile — team leads route and manage, ARCHITECTs decompose and sequence.

**Not the team lead.** The team lead is a coordinator. If the team lead is also the ARCHITECT, the team lead becomes a serial bottleneck for all development work. Every story waits for decomposition before anything else starts, and the lead cannot manage two TDD pipelines simultaneously because both need decomposition attention. ARCHITECT and team-lead are distinct roles.

**Lifecycle — passively available, not shut down.** ARCHITECT is active during decomposition (story arrival → test plan file written) and at escalation points (PURPLE sends three-strike rejection; CYCLE_COMPLETE arrives with quality notes). Between these events it is **passively available** — waiting for events, not shut down. In practice, ARCHITECT reads the CYCLE_COMPLETE from the previous story while waiting for a potential escalation on the current one. This is the only work ARCHITECT does between decompositions. (Correction from v1's "goes idle" language — Herald's actual position is passive availability, per round 5.)

**Multi-pipeline teams:** ARCHITECT processes events from multiple pipelines. When oversubscribed, ARCHITECT batches feedback processing to avoid thrashing between pipelines. This is a scheduling optimization, not a default.

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

**Shared PURPLE authority caveat (Monte, round 5).** When a PURPLE is shared across multiple pipelines, it will observe patterns with cross-pipeline implications (e.g., a shared utility used by both pipelines). These decisions belong to ARCHITECT, not PURPLE. A shared PURPLE's prompt must include: "You are refactoring one pipeline at a time. If you observe a pattern that would benefit both pipelines, flag it to ARCHITECT via the Oracle as a cross-pipeline observation — do not extract it yourself." This closes a latent authority boundary violation that domain-distance reasoning alone did not address.

**The restructuring vs. reimplementation threshold:** This is a qualitative boundary, not a line-count metric. If PURPLE would need to change the algorithmic approach, alter the public interface, or rewrite the control flow, the decomposition was wrong — escalate to ARCHITECT.

**Model tier rationale:** Opus, not sonnet. The tests catch behavioral regression but not structural degradation. A sonnet can make tests pass while introducing duplication, God functions, and leaky abstractions. That kind of invisible, accumulating technical debt is exactly what opus exists to prevent.

**Pattern submission timing (Volta, round 5).** PURPLE submits refactoring patterns to the Oracle at **cycle completion** (immediately before sending the CYCLE_COMPLETE message), never mid-refactor. A mid-refactor view is unstable — the pattern may not survive the next 30 seconds of work. Submitting only at cycle completion keeps the wiki free of abandoned patterns and preserves the knowledge-velocity metric's integrity.

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

### Adaptive Lookahead (Volta, round 5)

RED can write the next test while GREEN implements the current one, as long as the test doesn't depend on GREEN's implementation shape. This is **lookahead**, and the depth should be **adaptive**, not static.

The team lead (or ARCHITECT) sets `max_lookahead` as an upper bound in pipeline configuration. The effective lookahead at any moment is determined by the rolling PURPLE rejection rate over the last 5 cycles:

```
if rolling_rejection_rate < 10%:
    effective_lookahead = min(max_lookahead, 2)
elif rolling_rejection_rate < 25%:
    effective_lookahead = 1       # default
else:
    effective_lookahead = 0       # sequential, no lookahead
```

**Default `max_lookahead = 1`** — Herald's original proposal. Teams with demonstrated low rejection rates can raise the ceiling. Teams with high rejection rates are automatically throttled to sequential execution, protecting in-flight work from repeated cancellation.

**Lookahead cancellation on first rejection: preserve.** When PURPLE rejects T1 for the first time, T2 lookahead work is preserved (the test may be valid independent of T1's shape). On a second rejection, ARCHITECT wakes up to review T1's state AND T2's test together (T2's assumptions may be contaminated by T1's rejected implementation). ARCHITECT decides whether T2 survives. This keeps the fast path fast and adds safety at the escalation point.

### Mid-Cycle Shutdown: Watchdog + Team Lead Authority

When shutdown arrives mid-cycle, PURPLE may be mid-refactor with tests temporarily broken. The mitigation composes Volta's git-state watchdog with Monte's team-lead termination authority.

**The watchdog monitors git working tree state, not wall-clock time.** A PURPLE that has not changed any files in 60 seconds is either done or stuck — both cases warrant action. A PURPLE that is actively modifying files is doing work, regardless of how long it takes.

**The 5-minute soft boundary (Monte)** governs when team-lead termination authority activates. Inside 5 minutes, PURPLE has sovereignty over its atomic commit. At 5 minutes, team-lead decides based on watchdog state.

**Four exit states:**

| State | Signal | Action | Authority |
|---|---|---|---|
| **Clean exit** | `shutdown_approved` received | Proceed with standard shutdown | PURPLE |
| **Atomic commit completed** | Working tree clean + new commit since shutdown request | Proceed with standard shutdown. Wait 30 seconds for `shutdown_approved`, then force-terminate cleanly. | PURPLE |
| **Hung** | Working tree unchanged for 60 seconds, no new commits | `git reset --hard HEAD` (revert uncommitted changes). Force-terminate PURPLE. Next session's PURPLE starts from HEAD. | Team lead (via watchdog) |
| **Stuck mid-refactor** | Files changing but no commits after 3 minutes | Team lead intervenes: extend grace period once, or force-revert if changes look incoherent | Team lead |

**Escalation rule:** At the 5-minute boundary, if the state is "stuck mid-refactor," the team lead forces termination. PURPLE cannot refuse. Execution authority (L3) does not override coordination authority (L2).

**Oracle mitigation (Medici, round 5).** Before PURPLE reverts uncommitted work, it submits the intended refactoring as a `[DEFERRED-REFACTOR]` entry to the Oracle — a description of what PURPLE was trying to do and why. The next session's PURPLE queries this and picks up where the previous one left off. This is a memory bridge across the reverted work, not a replacement for the watchdog.

**This is a PURPLE-specific extension to T06 Shutdown Phase 3.** Volta owns the T06 amendment.

### Authority Boundaries

The XP pipeline introduces scoped authority for ARCHITECT and PURPLE that T04's current delegation matrix does not cover. No new hierarchy level is needed — ARCHITECT is a specialist with scoped authority (the one-story scope is the constraint that keeps it at L3).

**Delegation matrix additions:**

| Decision | PO | Mgr | Team Lead | ARCHITECT | Specialist |
|---|---|---|---|---|---|
| Story decomposition into test plan | I | — | C | **D** | — |
| Test plan ordering | — | — | I | **D** | C (RED) |
| Scope dispute within pipeline | — | — | Escalation target | **D** (first instance) | C |
| Structural refactoring within scope | — | — | I | C | **D** (PURPLE) |
| Mid-cycle termination of PURPLE | — | — | **D** | C | C |
| Cross-pipeline pattern extraction | — | — | I | **D** | C (flags via Oracle) |

**ARCHITECT's authority is scoped to a single story at a time.** Between stories, ARCHITECT has no authority — it is passively available until the team lead assigns the next story. This prevents authority creep.

### Pipeline Governance as a Nested System

A team using the XP pipeline creates governance at two levels. The team lead governs the team (T04 L2). ARCHITECT governs the pipeline within its story (L3 with scoped authority). This is the first nested governance pattern in the framework — previously, governance was flat at the team level.

The implications:
- ARCHITECT reports to team lead, not to PO
- RED/GREEN/PURPLE report to ARCHITECT within the cycle, not to team lead
- Cross-pipeline disputes (resource conflicts between two pipelines) are resolved by team lead, not by either ARCHITECT
- ARCHITECT's authority is scoped to a single story, preventing authority creep between stories
- Team lead retains termination authority over any L3 agent in the pipeline (PURPLE included)

This framing helps future team designers understand that adopting the XP pipeline is not just a methodology change — it creates a new layer of coordination they must account for.

### The Three-Tier Model

Not every team needs the full XP pipeline. The tier is determined by the **consequence of structural debt** (Finn's refinement). The tiers describe **where judgment lives**, not how many agents are in the pipeline.

| Tier | Pipeline configuration | Where judgment lives | When to use |
|---|---|---|---|
| **Sprint** | RED + GREEN (pair) | In the developer — RED and GREEN are the same cognitive act split in two steps | Disposable code. PoC, throwaway scripts, short-lived experiments. Structural debt does not compound because the code dies before it matters. |
| **Standard** | RED + GREEN + Reviewer | In the developer + reviewer — reviewer catches what the developer missed | Maintained code. Structural debt is recoverable through periodic reviews and refactoring sessions. Most deployed teams sit here. |
| **Cathedral** | ARCHITECT + RED + GREEN + PURPLE | In dedicated specialists — ARCHITECT (what to build), developer (how to build it), PURPLE (how to structure it) | Load-bearing code. Structural debt compounds irreversibly. Team lead can no longer personally hold the context of every implementation decision. |

**Why three tiers, not four (Finn, round 5).** Below Sprint is not a tier — it is the absence of methodology. A team without RED+GREEN has no quality gate at all. The three tiers each add a *kind* of judgment; there is no null tier because null is not a tier. Herald's "one-dev with test-first discipline" proposal is effectively Sprint tier (role separation is nominal at this level — the same agent wears both hats) and folds in without creating a fourth tier.

**The governance trigger for Cathedral tier:** The team lead can no longer hold the full context of every implementation decision. At that point, the team lead must delegate judgment (not just execution). ARCHITECT and PURPLE are the judgment delegates.

This mirrors the manager agent scaling trigger (T04): manager agent is needed when the PO can no longer hold all teams' state simultaneously. Cathedral tier is needed when the team lead can no longer hold all implementation state simultaneously. Same pattern, different level.

### Degraded Cathedral: Resource-Constrained Hosts

Brunel's round 5 contribution. The tier model assumes host capacity matches team tier. In practice, deployment hosts vary — the screenwerk-dev team runs on a Hostinger VPS (4-8GB RAM), the apex-research team runs in a container on a shared 16GB RC server alongside 4+ other teams. A Cathedral-tier team with 4 opus agents plus the coordination overhead may exceed the host's sustainable capacity, at which point the team lead slows down, messages queue, and the pipeline stalls.

**Two-dimensional tier selection:**

| Tier | Code consequence | Host requirement |
|---|---|---|
| Sprint | Disposable | Any host, any team composition |
| Standard | Recoverable debt | Standard deployment (4-8 agents sustainable) |
| Cathedral | Irreversible debt | Dedicated host with headroom for 10+ agents OR **Degraded Cathedral** |

**Degraded Cathedral** is the escape hatch for codebases that meet Cathedral criteria but cannot sustain the full agent count. The team ships Standard-tier composition (shared PURPLE, no dedicated ARCHITECT) with an explicit note in the team's design spec:

> This codebase meets Cathedral criteria (load-bearing, compounding structural debt), but deployment host constraints require Standard-tier composition. Structural review is elevated to the team lead's explicit responsibility at every PR merge. This is documented tech debt on the team configuration, not on the code.

The team lead takes on the PURPLE responsibility they would otherwise delegate. This reintroduces the bottleneck that motivates ARCHITECT in the first place, but it is better than either (a) pretending the codebase is Standard tier, or (b) blocking deployment until we get a bigger host. The team's design spec documents both the current state and the target state, so the upgrade path is recorded.

### Shared vs. Separate PURPLE Across Pipelines

Multi-pipeline teams face a choice: one shared PURPLE or one per pipeline?

**The Cathedral default is shared PURPLE, with Monte's authority caveat.** Three independent arguments in round 5 converged on this:

1. **Herald (cost + structural consistency).** A shared PURPLE enforces one refactoring style across pipelines. Two separate PURPLEs can diverge in their structural vision, producing "split personality" refactorings visible in the git history. Structural consistency is observable and measurable; the earlier "context bleed" concern (Vue idioms leaking into Node.js) was speculative and has no reference-team evidence.
2. **Finn (Oracle cross-pattern detection).** A single shared PURPLE sees convergence across pipelines directly — it submits "this is the third time we've needed time-range filtering" as one pattern. Two separate PURPLEs submit similar patterns independently and rely on the Oracle to detect the convergence. Shared PURPLE is better signal for the Oracle.
3. **Brunel (resource capacity).** On constrained hosts, two opus refactorers plus two opus ARCHITECTs plus coordinator context can exceed sustainable team size. Shared PURPLE halves the refactorer cost without changing the pipeline discipline.
4. **Monte (authority caveat).** A shared PURPLE that observes cross-pipeline patterns is constantly tempted to make architectural decisions (extract a shared utility). Those decisions belong to ARCHITECT. The shared PURPLE's prompt must include: "flag cross-pipeline patterns to ARCHITECT via Oracle, do not extract them yourself." With this caveat, shared PURPLE is governance-safe.

**The variable that still matters: domain distance between pipelines.** Domain distance is the reason to consider separation, but structural consistency is the articulated benefit of sharing.

| Domain distance | Example | Recommendation |
|---|---|---|
| Low — same codebase, same framework, same idioms | Two feature teams on the same Nuxt app | **Shared PURPLE.** Structural consistency is the benefit. |
| Medium — same repo, different domains | screenwerk-dev (Node.js pipeline scripts vs. Vue composables) | **Shared PURPLE with authority caveat.** Accept slight context-switching cost for structural consistency + Oracle cross-pattern detection. |
| High — different repos or languages | One pipeline in TypeScript backend, another in Python analysis | **Separate PURPLEs.** Language boundaries force separation regardless of other reasoning. |

**Pipeline-distance diagnostic (Medici, round 5).** The Oracle can verify that a shared PURPLE is configured correctly. For shared-PURPLE pipelines, the Oracle tracks **cross-pipeline pattern reuse rate** — refactoring patterns submitted by the shared PURPLE that apply across both pipelines. A low rate is a `[PIPELINE-DISTANCE]` signal that the pipelines are not actually sharing idioms and should have been separated. A high rate confirms the shared-PURPLE configuration. This observation goes in the Knowledge Health Summary.

**Cost tiering (revised for shared-PURPLE default):**

| Tier | PURPLE configuration | Cost |
|---|---|---|
| Sprint | No PURPLE | Baseline |
| Standard | Reviewer (not PURPLE) | +1 sonnet |
| Cathedral (Medium distance or below) | Shared PURPLE across pipelines with authority caveat | +1 opus |
| Cathedral (High distance) | Separate PURPLE per pipeline | +N opus |
| Degraded Cathedral | Team lead takes PURPLE responsibility at PR review | +0 agents, +cognitive load on lead |

**screenwerk-dev example (revised):** Pipeline pair writes Node.js data transformations. Player pair writes Vue composables. Medium domain distance. Cathedral tier gets **shared PURPLE with Monte's authority caveat**, not separate PURPLEs. Oracle tracks `[PIPELINE-DISTANCE]` to detect misconfiguration.

### Team Composition Impact

The pipeline changes how development teams are sized. For a two-pipeline team like screenwerk-dev:

| Configuration | Opus | Sonnet | Total |
|---|---|---|---|
| Current (no XP pipeline) | 3 (lead, pipeline builder, advisor) | 4 (testers, player builder, analyst) | 7 |
| Standard tier (+ reviewer) | 3 | 5 | 8 |
| Cathedral tier (+ ARCHITECT, shared PURPLE with caveat) | 5 | 4 | 9 |
| Cathedral tier with separate PURPLEs (high distance only) | 6 | 4 | 10 |
| Degraded Cathedral (resource-constrained host) | 4 | 4 | 8 (lead takes PURPLE responsibility) |

The cost increase is real. The tiered model ensures it is only paid when justified by the code's structural consequence AND the host can sustain it.

---

## Part 2: The Oracle / Knowledge Base

### The Problem This Solves

Teams have three knowledge management mechanisms today — common-prompt (team rules), scratchpads (per-agent memory), shared docs (cross-cutting). All are file-based, manually curated, and lack propagation. The core insight from Finn's RFC: **knowledge loss happens at propagation, not discovery**. Agents save what they learn in real time, but the learnings stay in the discovering agent's scratchpad. When another agent needs the same knowledge, they have no way to find it.

The Oracle is the missing curation layer. It holds, organizes, serves, and tracks gaps in the team's accumulated understanding.

### Medici and the Oracle Are Not Competitors

Before describing the Oracle in detail, an explicit separation from Medici. This clarification is Medici's round 5 request — the two roles are easy to conflate from the outside.

> **Medici and the Oracle operate at different scopes.** Medici is a framework-research resource, spawned on demand to audit topic files, reference configurations, and framework design coherence across the research team. Medici does not live in deployed teams. The Oracle lives in deployed teams (Cathedral tier) or is absorbed by the team lead (Standard tier). A deployed team never has both; a deployed team never has Medici at all.
>
> The separation is by governance scope: Medici audits the framework (L0/L1 concerns). The Oracle curates team knowledge (L2/L3 concerns). They read different artifacts, serve different audiences, and have different lifecycles.

**Safety-net implications.** Several earlier-round arguments cited Medici as a safety net for the Oracle ("Medici catches what agents forgot to tag"). In deployed teams, Medici does not exist. The safety net must be built into the Oracle and the team lead — Medici is not the fallback.

### The Oracle Role

**Eighth canonical agent role** (after the seventh, Refactorer, added in Part 1).

**Lore: Callimachus of Cyrene** (c. 310-240 BC). Scholar and poet at the Library of Alexandria who created the Pinakes — the first known library catalogue, classifying and cross-referencing the Library's estimated 400,000 scrolls by genre, author, and subject. The Pinakes was the first system where you could *ask a question* ("who wrote about astronomy?") and get a structured answer. That is the Oracle's essence: not just organizing knowledge, but serving it on query.

Callimachus's motto: *mega biblion, mega kakon* ("a great book is a great evil"). The wiki must stay concise or it becomes the problem it was designed to solve.

**Model tier: opus[1m].** The Oracle is the sole gateway for all wiki reads — not just a curator that writes pages while agents read them directly. Agents query the Oracle, the Oracle synthesizes from the wiki. Wrong answer from the Oracle = agent acts on bad information. Same consequence-of-error profile as ARCHITECT (bad decomposition cascades through the TDD cycle). The Oracle must also hold the full knowledge graph in its context — what exists, what connects to what, what was asked before, what gaps are tracked. That is 1M-context territory.

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
                   ╱ │ │ │ ╲      ↑
                  ╱  │ │ │  ╲     │ [URGENT-KNOWLEDGE] only
                Agent Agent Agent │
                  ╲  │ │ │  ╱     │
                   ╲ │ │ │ ╱      │
                  ORACLE (knowledge hub)
```

Every agent has two reporting lines:
- **Work reports** go to team-lead (task completion, blockers, status)
- **Knowledge reports** go to Oracle (discoveries, patterns, gotchas, queries)

Knowledge submissions do NOT route through team-lead because (a) team-lead is already the bottleneck for work coordination, (b) knowledge submission is not a work decision, and (c) the Oracle's curation is structural work at L3, not governance at L2.

**Urgent notifications route through team-lead (Herald's round 5 refinement).** When the Oracle identifies new knowledge that may invalidate another agent's current work, it sends an `[URGENT-KNOWLEDGE]` tagged message to team-lead. Team-lead's prompt treats this as a priority interrupt, processed before the next work dispatch. Team-lead decides whether to interrupt the affected agent, queue for their next handoff, or mark informational. **This bounds the damage window to one team-lead dispatch cycle.** The dual-hub topology is preserved — only the narrow slice of urgent-relevance notifications flows through the work hub.

**[URGENT-KNOWLEDGE] message format:**

```markdown
## [URGENT-KNOWLEDGE] — affects <agent-name>
- From: Oracle
- Topic: <brief description>
- New knowledge: <one-line summary, link to wiki entry>
- Affected work: <which agent's current task may be invalidated>
- Recommendation: Interrupt <agent-name> now | Queue for next handoff | Informational only
```

**Team-lead's prompt rule:** Before dispatching the next work message, check for `[URGENT-KNOWLEDGE]` in inbox. This is a single-line prompt addition that makes the latency bounded.

**Exception for promotions.** When the Oracle identifies a pattern worth promoting to common-prompt, the promotion DOES route through team-lead, because common-prompt changes are L1 team law.

**Recommendations to agents route through team-lead.** The Oracle never interrupts agents directly. The Oracle flags the relevance to team-lead; team-lead decides whether to interrupt the affected agent now or queue the update for later. Team-lead is the traffic controller.

### The Three-Tier Adoption

As with the XP pipeline, not every team needs the full Oracle.

| Tier | Knowledge management | Oracle? |
|---|---|---|
| **Sprint** | Scratchpads only, no wiki | No. Team dies before knowledge accumulates enough to curate. |
| **Standard** | `wiki/` directory, curated by team lead at shutdown | **No dedicated Oracle agent.** Team lead handles promotion during the existing shutdown protocol. |
| **Cathedral** | Dedicated always-on Oracle agent | Yes. Full four-capability role. |

**The Standard-tier compromise is load-bearing.** Most teams are Standard tier. Adding a dedicated Oracle to every team would double the opus cost of knowledge management. The team lead already reads all scratchpads during shutdown — extending that to "promote team-wide entries to `wiki/`" adds about 30 minutes (see Finn's reference data below). The team lead also handles mid-session knowledge queries implicitly through task routing.

**Finn's reference-team data (round 5).** Counted across `reference/rc-team/cloudflare-builders/memory/` and `reference/hr-devs/memory/` for a mature 6-agent team:
- ~304 total scratchpad lines
- ~35 team-wide tagged entries (`[LEARNED]`, `[PATTERN]`, `[GOTCHA]`, `[DECISION]`)
- ~12 wiki pages after deduplication
- **~30 minutes of team-lead shutdown curation time**

This validates the Standard-tier claim with empirical evidence. Caveat: the numbers assume Medici-style scratchpad pruning (100-line limit enforced). A team that lets scratchpads grow unbounded would take 2-3× longer — but unbounded growth is already a problem the framework addresses.

**Cathedral tier** gets the dedicated Oracle because the volume of discoveries is too high for a team lead to curate manually, and the cost of lost knowledge is too high to tolerate session-end-only propagation.

### Objective Adoption Trigger (Volta, round 5)

A team should upgrade from Standard to Cathedral when the Standard tier's team-lead curation model runs out of capacity. Two objective triggers:

1. **Scratchpad duplication threshold.** At shutdown Phase 2c, the team lead runs:
   ```bash
   grep -h '\[LEARNED\]\|\[PATTERN\]' memory/*.md | wc -l
   ```
   When the count exceeds **30 team-wide entries across a team of 5+ agents**, the team has accumulated enough shared knowledge to justify Oracle adoption. Team lead proposes to PO. If approved, the next session spawns an Oracle.

2. **Team size threshold.** Teams of **7-8 agents or more** typically exceed the team lead's cognitive capacity at Phase 2 (task snapshot + wiki curation + shutdown requests). Beyond this size, Cathedral tier is structurally necessary, not optional.

**Lifecycle placement.** The adoption decision happens at Shutdown Phase 2c. The team lead notes the duplication count in the session report to PO. PO approves or defers. The transition is one-session: the next session's Phase 5 (Audit) replaces team-lead self-audit with Oracle spawn + bootstrap.

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
    process/                # Research teams only: emerging process patterns
    observations/           # Research teams only: cross-cutting insights (never authoritative)
    findings/               # Research teams only: pre-topic-file findings
    archive/                # Stale or superseded pages, preserved
  oracle-state.json         # Bootstrap/intake completion markers (Cathedral only)
```

**Directory sovereignty.** The Oracle is the sole writer to `wiki/`. No other agent writes there. Agents read the wiki only through Oracle queries (with one exception — see below). This is the same directory-ownership pattern as T02 R1 / T06 pipeline teams.

**Direct wiki read exception for XP pipeline roles.** RED, GREEN, and PURPLE may read known wiki articles directly during the tight RED→GREEN→PURPLE cycle to avoid query latency inside a single cycle. Direct reads must be logged as `[WIKI-READ]` in the agent's scratchpad. Non-XP roles and advisory agents always go through the Oracle query protocol.

**Scratchpad reading is unrestricted (PO correction #5, round 3).** Agents may read each other's scratchpads. The directory-sovereignty rule applies to `wiki/` only. Knowledge *submission* to the wiki is explicit (through Oracle protocols); *reading* of scratchpads is informal and free.

**Don't duplicate existing docs.** If `docs/architecture-decisions.md` already exists, do not copy it into `wiki/decisions/`. Either migrate (move + redirect) or leave it. Duplication is the enemy — the Oracle should maintain pointers to existing artifacts, not copies. See [Archaeological Bootstrap](#bootstrapping-existing-teams) for the index-layer pattern.

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
- **Urgent** — discovery invalidates another agent's current assumptions. Oracle sends `[URGENT-KNOWLEDGE]` to team-lead, who decides whether to interrupt the affected agent. Oracle files with `[URGENT]` tag. Expected frequency: 0-2 per session.
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
<stub requests the asking agent to submit the answer back if they find it>
```

**The gap-noted field is critical.** Every unanswerable query creates a stub — an explicit record of what the team *doesn't know*. Over time, gap stubs form a map of the team's ignorance, which is as valuable as the map of its knowledge. Team-lead can prioritize gap-filling.

**Gap stubs as collaborative requests (PO, round 4).** When the Oracle responds with "not documented," the response also asks the querying agent: "If you find the answer, please submit it back with source references." The stub becomes an active request. The agent who discovered the gap closes the loop when they find the answer.

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

**Source linking extends beyond files (PO, round 4).** Wiki entries can link to commits, issues, PRs, and specific functions — not just source files. The wiki becomes a knowledge overlay on the git graph.

**Three-layer staleness detection with severity classification (Herald's round 5 correction):**

1. **Git hash + anchor check (automated).** Pre-commit hooks can check whether referenced source files have changed since `last-verified`. Severity classification:
   - Source file deleted → **CRITICAL** (blocks related work until resolved)
   - Anchor missing (referenced function or symbol no longer exists) → **HIGH** (flag but don't block)
   - Anchor present, file changed → **LOW** (flag for review)
2. **PURPLE semantic check.** After refactoring, PURPLE checks `wiki/` for entries referencing the refactored file. If the refactoring changed behavior or interface, PURPLE sends `[STALE-WARNING]` to the Oracle. This distributes staleness detection to the agent with the best context — PURPLE just touched the code. Severity: **CRITICAL** (PURPLE has domain context and would not flag trivially).
3. **TTL for external systems.** Entu, D1, Jira, external APIs have no source files. Use time-based expiry ("verify after 30 days") for experience-grounded knowledge about external systems. The Oracle flags expired entries for re-verification.

**Pre-commit hook automation (PO, round 4).** If `source-files` is in wiki frontmatter, a git pre-commit hook can automatically check for changes and flag `[VERIFY]` on affected wiki entries before the commit lands. Everything deterministic should be automated.

**For Standard-tier teams without dedicated Oracle or PURPLE:** Team-lead catches staleness during PR review. Less automated but still effective.

**Dispute and resolution:**

1. Any agent can tag an entry `[DISPUTE]` if they find evidence the knowledge is wrong
2. Oracle updates status to `disputed` and notifies the original source agent
3. Source agent or domain expert investigates, corrects or confirms
4. Oracle records resolution (corrected claim, or "confirmed in context X but not context Y")

### Bootstrapping Existing Teams

Three team maturity levels, each with a different approach. Bootstrapping has a **governance gate**: the team lead reviews the initial wiki before it becomes team canon. One-time approval gate.

| Maturity | State | Bootstrap approach |
|---|---|---|
| **Greenfield** | New team, no history | No bootstrap. Wiki starts empty, accumulates organically. |
| **Established** | Active team with living agents | **Intake interview** OR **Incremental Bootstrap** (choose at adoption) |
| **Archaeological** | Cold-start, historical artifacts only | **Scoped extraction with index layer.** |

#### Intake Interview (Established, first option)

Oracle asks each agent four questions:

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

One interview per agent. 5-10 minutes each. Faster and more accurate than reading stale scratchpads. Suitable for **high-frequency teams** (sessions weekly or more) where knowledge must be immediately available.

#### Incremental Bootstrap (Established, second option — Herald, round 5)

Oracle starts with `wiki/` empty (like Greenfield). Agents are prompted: "You have an Oracle now. When you discover team-wide knowledge, submit via Protocol A." No one-time intake, no extraction from existing scratchpads.

**Why this works:** The accumulated knowledge in scratchpads is only valuable when an agent actually needs it. If a gotcha will never be encountered again, extracting it to the wiki is wasted effort. If it does recur, either (a) the original scratchpad is still readable and can be grepped, or (b) the same agent re-encounters it and submits with fresh context.

**Trade-off:** Slower initial wiki growth (sessions 1-3 have a nearly-empty wiki). By session 5-10, the wiki contains exactly the knowledge that has proven useful — not everything agents ever wrote down.

**Standard tier graduating to Cathedral is the natural on-ramp.** A team that has been running Standard tier with team-lead-curated wiki already has a populated wiki when it upgrades. The Oracle inherits that wiki and begins normal operation from session N+1. Incremental bootstrap is the right choice — no extraction disruption, continuity from Standard tier. This resolves the adoption-friction concern: the Standard tier is the natural stepping stone, not a terminal state.

#### Archaeological Bootstrap with Index Layer (Brunel, round 5)

For teams with substantial history but no living agents (apex-research: 300+ commits, multiple specs directories, data dumps), the Oracle does NOT extract content. It builds an **index layer** — pointers to existing artifacts.

**The 20-page cap (Medici, round 3) applies to the index itself**, not to extracted content. 20 pages of "where to find X" pointers, not 20 pages of extracted knowledge. The knowledge stays where it is; the Oracle learns where to point queries.

**Example index entry:**

```markdown
## F301 cluster analysis

source: specs/clusters/f301.md
discovered: 2026-03-05
last-verified: 2026-03-20
scope: domain
extract: false

### What this covers
- App inventory (24 pages, 3 LOVs)
- Data model mapping to ERM entities
- Migration complexity assessment
- Open questions for PO review

### Where to look
Read the source file directly. This entry is a pointer.
```

No content. Just the pointer, a summary of what the source covers, and a staleness marker. When an agent queries "what do we know about F301", the Oracle returns the path. The agent reads the source directly. The wiki stays thin. The `docs/` stays canonical.

**The two-mode wiki:**
- **Index layer** — pointers to existing artifacts (populated by Archaeological bootstrap)
- **Content layer** — new knowledge, gotchas, patterns discovered after bootstrap (grows organically)

The Archaeological bootstrap populates only the index layer. The content layer starts empty and grows like Greenfield.

**Staleness signal for index entries:** If the source file's last commit is newer than `last-verified`, flag `[STALE?]`. No content to re-verify — the agent just re-reads the source.

#### Bootstrap Completion Marker (Brunel, round 5)

The Oracle is respawned via the standard SPOF mechanism (team lead respawns, per PO round 3). But respawn raises a gotcha: a newly spawned Oracle does not remember having run intake before. Without a marker, it would re-run the intake interview, costing 30+ minutes and producing inconsistent answers.

**The bootstrap completion marker:**

```
.claude/teams/<team>/oracle-state.json
```

```json
{
  "intake_complete": true,
  "intake_date": "2026-04-09T10:30:00Z",
  "intake_participants": ["alice", "bob", "carol"],
  "session_id": "<current-session-id>"
}
```

Oracle checks this file on startup. If `intake_complete: true` AND `session_id` matches the current session, Oracle skips intake and proceeds directly to query service. On a fresh session start (session ID mismatch), the intake status from a previous session does not apply — but typically the intake was run exactly once per team lifetime, so it remains valid.

The same marker pattern applies to Archaeological extraction (should run exactly once per team lifetime, not once per session) and to first-time health-report baselining.

**Adoption trigger for Oracle bootstrap (Medici, round 5).** Do NOT run intake on teams about to be dissolved or rebuilt. The Oracle should only be introduced when there is at least **5 sessions of expected team life ahead**. Same amortization logic as the Sprint/Standard/Cathedral tier model.

### Per-Agent Profiles

The Oracle maintains persistent per-agent articles separate from the session-snapshot health report. These profiles are **factual, not evaluative**. They record observations, not judgments.

Profile contents:
- Submission frequency and types (counts, not quality ratings)
- Query patterns (what topics the agent asks about)
- Wiki corrections submitted (error reports, not author blame)
- Gap stubs the agent has closed (positive attribution for knowledge recovery)

Profiles are for the team lead and PO, not for peer comparison. They inform team design decisions: "Agent X asks many questions about Entu but never submits — does their role scope match their actual work?" The profile surfaces the signal; a human decides what it means.

### Knowledge Health Summary (Shutdown)

The Oracle's shutdown output. This is the team health sensor formalized as part of the Oracle role, not a separate agent.

**Incremental append format (PO, round 4).** The health summary appends to an existing file with timestamps. No rewrite, no merge — `>> health-report.md`. One file grows over time as session history.

```markdown
## Knowledge Health — Session <date>

### Top queries
<the 3 topics most asked about this session>

### Query clusters
<domains with >3 related queries but <2 wiki entries — structural gap indicator>
<example: "Authentication: 5 queries from 3 agents, 0 wiki entries">

### Unresolved gaps
<queries the Oracle couldn't answer, carried into next session>

### Redundant queries
<where two or more agents asked the same thing — candidate for promotion>

### Submission patterns
<who submitted, who didn't, distribution by type>

### Pending staleness warnings
- Hot (flagged + queried this session): <list — URGENT — re-verify before next query>
- Cold (flagged, not queried): <count — can be archived at leisure>

### Source concentration
<wiki domains where >60% of entries come from a single source agent>
<example: "D1 query patterns — 8 of 10 entries from Dag">

### Knowledge velocity
<ratio of discoveries to warnings across recent sessions — team quality metric>

### [PIPELINE-DISTANCE] (Cathedral shared-PURPLE teams only)
<cross-pipeline pattern reuse rate for shared PURPLEs; low rate signals misconfiguration>
```

**Six health signals (Volta, round 5):**
1. **Top queries** — what the team needs most this session
2. **Query clusters** — domain density; multiple queries on under-documented areas (refinement of "top queries" to detect structural gaps, not just frequency)
3. **Unresolved gaps** — tracked ignorance carried forward
4. **Redundant queries** — where two or more agents asked the same thing
5. **Submission patterns** — who submitted, who didn't
6. **Source concentration** — domains where >60% of entries come from one agent (knowledge-concentration risk, load-bearing for next-session planning)

Plus the two additions that emerged during the discussion:
- **Pending staleness warnings** with hot/cold classification (stale-but-accessed entries are more urgent than cold stale entries)
- **Knowledge velocity** (Finn's metric, Part 3)

**Tone discipline: observe and report, never instruct.** The health summary describes patterns. It does not say "Agent X should submit more" or "ARCHITECT needs to redecompose Y." It says: "Agent X submitted zero entries this session (past average: 3). Redundant queries about Entu semantics from three agents." The team lead and PO interpret and act.

### Single Point of Failure

If the Oracle crashes mid-session, **team-lead respawns it**. No circuit breakers, no fallback paths, no degraded modes. The Oracle is treated the same as any other agent. One path, make it reliable.

The `oracle-state.json` marker prevents re-running one-time bootstrap operations on respawn.

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

#### Rule: L3 → L0 Automated Flow Is Forbidden (Monte, round 5)

Team wikis (L2 governed, Oracle curated) must not automatically propagate to PO MEMORY.md (L0 constitutional). The hierarchy must be preserved: information flows up through explicit governance review (team lead's session report, PO's cross-team context-gathering), gets synthesized by the human at L0, and flows back down through common-prompt edits or direct team-lead directives.

**Forbidden:**
- Automated sync of team wiki entries to PO MEMORY.md
- Agents reading PO MEMORY.md directly
- PO editing team wikis directly (PO messages team lead, who instructs Oracle)
- **PO copying MEMORY.md entries into team wikis** (Finn's round 5 anti-pattern — if PO knowledge needs to reach a team, it goes through team-lead, who submits it as a normal Knowledge Submission with PO attribution)

**Required:**
- Cross-team-relevant wiki entries are tagged `[CROSS-TEAM]` in the Oracle's session report
- Team lead includes tagged findings in session report to PO
- PO decides at own discretion whether to record in MEMORY.md
- PO directives to teams flow through common-prompt, team-lead messages, or explicit Knowledge Submissions to the Oracle (with attribution), never through direct wiki edits

**Why this matters as a named rule, not a bullet list.** Named rules get referenced in prompts and enforced in reviews. Bullet lists get skimmed. Future agents implementing the Oracle will be tempted to add "sync with PO memory" as a feature — the named rule makes this a constitutional violation they must explicitly overturn, not a design choice they can make.

#### MEMORY.md Pruning Opportunity (Medici, round 5)

Introducing team wikis is an **opportunity to prune MEMORY.md** of team-level operational detail that belongs in team wikis instead. Without explicit pruning, introducing wikis ADDS knowledge infrastructure without REDUCING any existing burden. The total complexity increases.

**The pruning action** is included in the Implementation Checklist — when a team adopts an Oracle, the PO audits MEMORY.md for entries describing that team's operational detail and moves them to the team wiki (through the team-lead submission path described above). MEMORY.md shrinks to its proper L0 scope: cross-team decisions, user preferences, project-level context, external references.

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

**Per-role Librarian access instructions (PO, round 4):**
- RED queries for existing test patterns and known bugs
- GREEN queries for API contracts and gotchas
- PURPLE queries for architectural decisions and module boundaries
- ARCHITECT queries for patterns and findings, writes test plans as team knowledge

Oracle prompts include per-role interaction guidance so each role knows what to ask for and how to cite responses.

### PURPLE Submits Refactoring Patterns (At Cycle Completion)

When PURPLE completes a refactoring (ACCEPT verdict, commit made), it submits the refactoring pattern as a `[PATTERN]` entry to the Oracle. **Pattern submission happens at cycle completion, not mid-refactor** — a mid-refactor view is unstable and the pattern may not survive the next 30 seconds of work.

Example:

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

The Oracle receives this, files it in `wiki/patterns/`, and the next ARCHITECT querying "time-range filtering" gets the pattern immediately. **The Oracle catches cross-pair patterns** — the `[PIPELINE-DISTANCE]` diagnostic (Medici's round 5 metric) tracks whether a shared PURPLE's pattern submissions are actually reused across both pipelines.

### PURPLE Flags Staleness

When PURPLE refactors code, it checks `wiki/` for entries referencing the refactored files. If the refactoring changes documented behavior or interfaces, PURPLE sends `[STALE-WARNING]` to the Oracle. The Oracle updates `last-verified`, flags the entry for review, and notifies the original source agent. Severity: CRITICAL (PURPLE has domain context).

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

**Finn's round 5 framing:** ARCHITECT and PURPLE generate knowledge, the knowledge base measures their output quality. Knowledge velocity connects #46 and #47 — the pipeline is the source, the Oracle is the instrument.

---

## Part 4: Research Team Wiki Domain + Remaining Open Questions

### Research Team Wiki Domain (#14) — Resolved with Three-Track Structure

The #14 disagreement from v1 is now resolved. Monte and Medici converged in round 5 on a three-track wiki structure for research teams. My proposed stable/emerging process split is preserved as the process track. Medici's findings track and Monte's observations track are added alongside.

**The resolution:**

| Knowledge type | Location | Governance |
|---|---|---|
| Stable process (team rules, workflow) | `common-prompt.md` | L1 team law, team-lead proposes + PO approves |
| Emerging process (new patterns being tried) | `wiki/process/` | Oracle files, promotes to common-prompt when mature |
| Cross-cutting observations (insights spanning topic files) | `wiki/observations/` | Oracle files, cites topic files, **never authoritative** |
| Subject knowledge (framework patterns, authoritative findings) | `topics/*.md` | Topic owner + PO approves |
| Pre-topic-file research findings | `wiki/findings/` | Oracle files, promotes to topic file when owner assigned |
| Analysis artifacts (inventories, specs, reports) | `docs/` or `analysis/` | Specialist (same as current) |

**The three wiki tracks for research teams:**

```
.claude/teams/framework-research/
  wiki/
    process/          # Emerging process patterns (Celes's resolution)
    observations/     # Cross-cutting insights across topic files (Monte)
    findings/         # Pre-topic-file research findings (Medici)
    gotchas/          # Same as dev teams
```

**Three rules govern `wiki/observations/` (Monte, round 5):**

1. **Observations cite topic files as authoritative** — they never replace or contradict topic file claims
2. **Promotion from observation to topic-file content requires the topic owner's approval** — the observation can suggest, but only the topic owner can decide
3. **Observations are NOT substitute reading for topic files** — an agent researching governance still reads T04, not `wiki/observations/`; observations are supplementary

**[MIGRATION-STALE] audit (Medici, round 5):** A `wiki/findings/` entry stable for 2+ sessions with no topic-file destination is either (a) not mature enough to migrate (leave it) or (b) stuck because nobody knows where it belongs (escalate to team lead for topic-file assignment). This prevents the findings section from becoming a graveyard. The audit is run as part of the Oracle's shutdown health summary in research teams.

**For apex-research specifically (Finn, round 5):** The wiki holds **process patterns** (how to analyze an APEX application, how to structure a cluster spec, how to identify a migration blocker) and **cross-app findings** (patterns that appeared in multiple apps). The inventory itself (`inventory/*.json`, `shared/*.json`, `specs/clusters/`) is the product, not the knowledge. Those artifacts stay where they are; the wiki gets a pointer via the Archaeological index layer.

**For dev teams:** The `process/`, `observations/`, and `findings/` tracks are not applicable — dev teams use the base wiki structure (patterns, gotchas, decisions, contracts).

### Remaining Open Questions

Two open questions from v1 are now resolved (L2.5 → Spec Writer specialization, #14 → three-track structure). The PURPLE mid-cycle shutdown question is resolved in Part 1 (watchdog + team-lead authority). One new question surfaced in round 5 deserves tracking:

#### Tier 4: Knowledge Velocity as Primary Metric (Herald, round 5)

Herald flagged a pattern that is beyond Cathedral: a team where knowledge flow itself is the primary output. The Oracle's Health Digest observations inform ARCHITECT's decomposition. PURPLE's refactoring patterns feed back into ARCHITECT's future decompositions. The team learns faster over time because its own learning is instrumented. Herald proposed tentatively calling this "Flywheel" tier.

**Status: speculative, not added to T09.** No team has operated this way yet. Flagging for future discussion once Cathedral tier has deployment experience. If a real team shows the "knowledge infrastructure as primary output" pattern, we revisit the tiering.

---

## Implementation Checklist

For team designers (this is my use of this document):

### XP Pipeline

- [ ] Determine pipeline tier (Sprint / Standard / Cathedral) based on consequence of structural debt
- [ ] Determine host capacity tier (standard, constrained → Degraded Cathedral)
- [ ] For Cathedral tier, add ARCHITECT to roster (opus, Spec Writer specialization with scoped authority)
- [ ] For Cathedral tier, add PURPLE to roster (opus, Refactorer)
- [ ] For multi-pipeline Cathedral teams, **default to shared PURPLE with Monte's authority caveat**; separate only when domain distance is High
- [ ] Update team lead prompt: route stories to ARCHITECT, not directly to TDD pair
- [ ] Add four message types to pipeline agent prompts (TEST_SPEC, GREEN_HANDOFF, PURPLE_VERDICT, CYCLE_COMPLETE)
- [ ] Add PURPLE authority boundary to PURPLE prompt (may/may-not list)
- [ ] For shared PURPLE: add Monte's authority caveat (flag cross-pipeline patterns via Oracle, do not extract)
- [ ] Add three-strike escalation to PURPLE prompt
- [ ] Document isolation model: temporal ownership (no partition table, no worktrees)
- [ ] Add test plan file handover to shutdown protocol
- [ ] Add adaptive lookahead ceiling to pipeline configuration (default `max_lookahead = 1`)
- [ ] Add watchdog-based mid-cycle shutdown protocol to PURPLE (4 exit states, 5-min boundary, team-lead termination authority)
- [ ] PURPLE submits refactoring patterns to Oracle at cycle completion (not mid-refactor)

### Oracle / Knowledge Base

- [ ] Determine knowledge management tier (Sprint / Standard / Cathedral)
- [ ] For Cathedral tier, add Oracle to roster (opus[1m], Callimachus lore or team-appropriate equivalent)
- [ ] For Standard tier, extend team-lead prompt with wiki curation at shutdown (~30 min target per Finn's data)
- [ ] Create `wiki/` directory in team config (plus `wiki/process/`, `wiki/observations/`, `wiki/findings/` for research teams)
- [ ] Add three protocols (Submission, Query, Promotion) to Oracle prompt
- [ ] Add classification decision matrix to Oracle prompt
- [ ] Add six-signal health summary template to Oracle shutdown protocol (include source concentration, hot/cold stale classification)
- [ ] Add per-role Librarian access instructions for XP roles (RED, GREEN, PURPLE, ARCHITECT)
- [ ] Add `[WIKI-READ]` logging to RED/GREEN/PURPLE prompts (direct read exception)
- [ ] Add `[URGENT-KNOWLEDGE]` priority interrupt rule to team-lead prompt
- [ ] Add staleness detection to PURPLE prompt (check wiki for entries referencing refactored files)
- [ ] Add severity classification to staleness detection (CRITICAL / HIGH / LOW)
- [ ] Add pre-commit hook for automated `[VERIFY]` flagging on source-file changes
- [ ] Add dispute tagging to all agent prompts (any agent can tag `[DISPUTE]`)
- [ ] For Established teams, choose bootstrap mode: Intake Interview (high-frequency) or Incremental (Standard→Cathedral graduation)
- [ ] For Archaeological teams, bootstrap as index layer only (20-page cap on index, not content)
- [ ] Create `oracle-state.json` marker for bootstrap completion (respawn-safe)
- [ ] Check Oracle adoption trigger: 30 team-wide entries OR team size ≥7-8 agents
- [ ] Oracle-only trigger: team has ≥5 sessions of expected life ahead (amortization gate)

### Cross-System

- [ ] ARCHITECT prompt: query Oracle before decomposition
- [ ] PURPLE prompt: submit refactoring patterns to Oracle at cycle completion (not mid-refactor)
- [ ] PURPLE prompt: submit `[DEFERRED-REFACTOR]` if mid-cycle shutdown forces revert
- [ ] CYCLE_COMPLETE quality notes feed Oracle health metrics
- [ ] Knowledge velocity metric in Oracle shutdown report
- [ ] For Cathedral shared-PURPLE teams: Oracle tracks `[PIPELINE-DISTANCE]` cross-pipeline reuse rate
- [ ] **When adopting an Oracle, audit MEMORY.md for team-specific operational entries and migrate to team wiki** (Medici's pruning opportunity)

---

## Related Topics

- **T01 (Team Taxonomy):** Refactorer is the seventh canonical role; Oracle is the eighth. ARCHITECT is a specialization of Spec Writer with scoped authority — not a new canonical role.
- **T02 (Resource Isolation):** Temporal ownership is the third isolation model (after branch isolation and directory ownership on trunk).
- **T03 (Communication):** Four XP message types are a specialization of Protocol 1. Dual-hub topology is a new pattern (work hub + knowledge hub). `[URGENT-KNOWLEDGE]` is a narrow routing exception. Oracle uses directory sovereignty (Protocol 5).
- **T04 (Governance):** ARCHITECT sits at L3 with scoped authority. Delegation matrix gains six new rows (story decomposition, test plan ordering, scope dispute, structural refactoring, mid-cycle termination, cross-pipeline pattern extraction). Pipeline-level governance is a new nested pattern within a team. Monte will draft the T04 amendments once T09 stabilizes.
- **T06 (Lifecycle):** Spawn order changes for XP teams (ARCHITECT first). Shutdown Phase 3 gets PURPLE-specific watchdog extension. Test plan file + `oracle-state.json` are new handover artifacts. The adaptive lookahead ceiling and Oracle adoption triggers use Phase 2c timing. Volta will draft the T06 amendments.
- **T07 (Safety):** PURPLE's authority boundary is a safety mechanism. Three-strike escalation is a safety valve for rejection loops. `[PIPELINE-DISTANCE]` is a diagnostic safety metric. L3 → L0 forbidden flow is a safety-critical constitutional rule.

---

## Multi-Round Consensus Protocol

T09 is the development methodology doc. The protocol for reaching team-wide agreement on methodology IS methodology. This section preserves the consensus protocol that produced this document, as a reusable pattern for future framework-wide questions.

**Reference:** discussions [#46](https://github.com/mitselek/ai-teams/discussions/46) (XP Development Pipeline) and [#47](https://github.com/mitselek/ai-teams/discussions/47) (Knowledge Base / Oracle) ran this protocol across five rounds to produce T09 v1 and v2.

**When to use:** framework-wide questions that require more than one perspective and where no single specialist owns the answer. If one specialist owns the answer (e.g., a lifecycle question belongs to Volta alone), use a normal issue → PR flow instead.

### The Five Rounds

1. **Rounds 1 to N — independent positions.** PO stays out. Each specialist posts their perspective from their domain. Agents disagree productively. No forced convergence. Disagreement at this stage is data, not failure. N is typically 1-2 rounds of specialist responses plus 2-3 rounds of PO refinements as the problem sharpens.
2. **Synthesis round.** One agent (typically the role-design specialist — me, for team composition questions; Herald for protocol questions; Monte for governance questions) drafts the consolidated artifact as a topic file. The synthesis preserves every position, makes disagreements explicit in a Part 4 / Open Questions section, and resolves only the questions that have obviously converged.
3. **Specialist pushback round.** Each specialist reads the synthesis and verifies their position is rendered correctly. They flag drift, propose refinements, and raise operational additions they had not thought of before. This is where the synthesis gains its operational depth — the additions slot into existing sections without restructuring.
4. **Consolidation round.** The synthesizer makes **binary calls** on remaining structural disagreements (documented in the Changelog section with reasoning), integrates operational additions, commits v2 to main. Open questions become either named unresolved items (with owners) or closed with explicit reasoning. No "TBD" entries — every disagreement gets a resolution or a clear defer.
5. **ACK round.** Each specialist posts one of three short responses: position accurately rendered (no further concerns); position diverges (filed issue #N); position accurately rendered AND filed forward-looking issue #N. Residual concerns become issues, not further rounds.

Post-round 5, normal workflow resumes: issues are triaged, PRs are reviewed, the topic file is maintained via standard edits.

### Guardrails

- **"10 rounds if needed" is an upper bound, not a target.** Debates have diminishing returns after about 90% consensus. The last 10% is usually preferences about framing, not structural disagreement.
- **Filing issues instead of posting round 7 forces concerns to be actionable.** An issue requires: a named "what," a "why v2 doesn't cover it," and a "proposed change or investigation." Rhetorical concerns rarely survive this framing. Concerns that do survive become concrete work.
- **Structural disagreements get binary calls; operational additions get integration.** The synthesizer's job in round 4 is to distinguish these. A structural disagreement is "should ARCHITECT be L2.5 or an L3 specialist?" — there is no compromise that satisfies both positions. An operational addition is "add severity classification to the three-layer staleness net" — it slots in without contradicting any other position.
- **Convergence from different reasoning is stronger than convergence from shared reasoning.** When three specialists reach the same recommendation through independent arguments (e.g., Herald on structural consistency, Finn on Oracle cross-pattern detection, Brunel on resource capacity for shared PURPLE), the recommendation is load-bearing. Preserve all three arguments in the synthesis — they validate each other and give future readers the full reasoning.
- **The synthesizer holds the pen but does not hold veto.** If a specialist pushes back strongly in round 3 on a round 2 framing, the synthesizer revises. The synthesizer's job is compression without loss, not tiebreaking by authorship. Tiebreaking happens in round 4 with explicit reasoning in the Changelog.

### Why This Protocol

The alternatives are worse:
- **Single author writes the topic file and asks for review.** The review round gets no depth because nobody invested in forming an independent position. The author's framing dominates.
- **Consensus-first drafting.** Everyone tries to agree before committing anything. Disagreements get smoothed over, not resolved. Nuance is lost.
- **PO decides everything.** The PO's context window fills with tactical detail. Framework-wide coherence depends on the PO remembering every previous decision. Does not scale.

The multi-round protocol works because (a) specialists form independent positions before seeing the synthesis, (b) disagreements surface in rounds 1-3 where they can be resolved by reasoning, (c) binary calls happen explicitly in round 4 with documented reasoning, and (d) round 5 is a verification pass, not another debate round.

**This section was added in round 6 at PO's request**, preserving the process that produced T09 so it can be reused for future framework-wide questions. See the Changelog for the specific binary calls, operational additions, and drift corrections that round 4 and round 5 produced for this document.

---

## Changelog

### v2 (2026-04-09) — Round 5 Integration

Five binary calls resolved from round 5 structural disagreements. Nine operational additions integrated. One drift corrected.

**Binary calls:**

1. **3-tier model preserved** (Herald proposed 4 tiers: Sprint/Pair/Standard/Cathedral). Finn's argument is load-bearing: "below Sprint is not a tier, it's the absence of methodology — three tiers map to where judgment lives." The tiers describe *where judgment lives* (developer / developer+reviewer / dedicated specialists), not how many agents are in the pipeline. Herald's "one-dev with test-first discipline" folds into Sprint tier, which already assumes minimal role separation. Adding a fourth tier would add complexity without adding a judgment axis.

2. **L2.5 governance level dropped in favor of Spec Writer specialization.** Finn's argument: ARCHITECT's authority is bounded (one story) and temporary (passive between stories), not structural. Hammurabi in apex-research is precedent — a Spec Writer with scope authority over what gets analyzed, without being a new governance level. T04 gains new delegation matrix rows without a new hierarchy level. Monte's scope-authority framing is preserved verbatim in the delegation matrix; only the L2.5 label is removed. Both Finn and Monte explicitly accepted either resolution, so this is a clean call.

3. **Shared PURPLE is the Cathedral default** (was: domain distance decides; shared at low, separate at medium, separate at high). Three independent round 5 arguments converged on shared: Herald (structural consistency is observable, context-bleed was speculative), Finn (shared PURPLE is better signal for Oracle cross-pattern detection), Brunel (constrained hosts can't afford multiple refactorers). Monte's authority caveat (shared PURPLE must flag cross-pipeline patterns to ARCHITECT via Oracle, not extract them itself) closes the governance gap. Only High domain distance (different repos or languages) still justifies separate PURPLEs. Medium distance (screenwerk-dev: Node.js vs Vue) now defaults to shared with the caveat. Domain distance remains the decision variable; structural consistency is the articulated benefit.

4. **#14 Research team wiki domain: three-track structure adopted.** Monte's position was "process + cross-cutting observations" (I previously summarized as "process only" — that was a misattribution). Medici converged on three tracks in round 5: `wiki/process/` (emerging process → common-prompt), `wiki/observations/` (cross-cutting citations that are never authoritative), `wiki/findings/` (pre-topic-file findings → topic files). My stable/emerging process split is preserved as the process track. Monte's three rules govern observations (cite topic files, require topic owner for promotion, not substitute reading). Medici's `[MIGRATION-STALE]` audit applies to findings stuck without topic-file destination. This closes #14 as resolved.

5. **PURPLE grace period: watchdog + team-lead authority compose.** Volta's git-state watchdog (not wall-clock time) AND Monte's 5-minute soft boundary with team-lead termination authority are integrated. The watchdog IS the clock; team lead IS the escalation authority. Four exit states documented (clean, atomic commit, hung, stuck mid-refactor). Medici's `[DEFERRED-REFACTOR]` Oracle submission provides the memory bridge across forced reverts.

**Drift corrected:**

- **ARCHITECT "idle during execution" → "passively available between events"** (Herald's round 5 correction). I misattributed the "always idle" framing to Herald when his actual position was passive availability — waiting for escalations, not shut down. The lifecycle section now reads "passively available" with explicit events that reactivate it (three-strike escalation, CYCLE_COMPLETE).

**Operational additions integrated:**

- **Brunel:** Degraded Cathedral tier (2D: code consequence + host capacity), Oracle bootstrap completion marker (`oracle-state.json`), two-mode Archaeological bootstrap (index layer + content layer), 20-page cap applies to the index
- **Volta:** Adaptive lookahead with rolling rejection rate (default `max_lookahead = 1`), source concentration as sixth health signal, objective Oracle adoption triggers (30 entries OR team size ≥7-8), PURPLE pattern submission at cycle completion (not mid-refactor)
- **Herald:** Severity classification for three-layer staleness net (CRITICAL/HIGH/LOW), `[URGENT-KNOWLEDGE]` tag with team-lead priority interrupt rule, Incremental Bootstrap as alternative to Intake Interview for Standard→Cathedral graduation
- **Medici:** Explicit Medici/Oracle separation paragraphs (Part 2 opening), MEMORY.md pruning in Implementation Checklist, `[PIPELINE-DISTANCE]` Oracle diagnostic for shared PURPLEs
- **Monte:** "L3 → L0 automated flow is forbidden" elevated from bullets to named constitutional rule, pipeline governance as first-class nested system section, shared PURPLE authority caveat
- **Finn:** Standard-tier adoption cost data (304 lines, 35 entries, 12 pages, ~30 min) cited directly, PO anti-pattern (never copy MEMORY.md into team wikis) documented

**Structure preserved.** The four-part structure (XP Pipeline / Oracle / Interaction / Open Questions) is unchanged. Most additions slot into existing sections. Part 4 shrank because #14 closed; it now contains only the research team wiki domain resolution and Herald's speculative "Flywheel tier" flagged for future work.

### v1 (2026-04-09) — Initial Synthesis

First synthesis of discussions #46 (XP Pipeline) and #47 (Oracle) across four rounds. Established the four-part structure. Preserved three open questions (research wiki domain, mid-cycle shutdown, Oracle evolution path).

---

*This document synthesizes Discussion #46 (XP Development Pipeline) and Discussion #47 (Knowledge Base / Oracle) across five rounds of community input from Brunel, Celes, Finn, Herald, Medici, Montesquieu, Volta, and PO Mihkel. Binary calls on structural disagreements are recorded in the Changelog with reasoning. Round 5 comments that informed this revision are linked from the round 6 consolidation seed on both discussions.*

(*FR:Celes*)
