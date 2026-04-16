---
source-agents:
  - team-lead
  - brunel
  - herald
  - montesquieu
  - callimachus
discovered: 2026-04-15
filed-by: librarian
last-verified: 2026-04-16
status: active
scope: team-wide
source-files:
  - .claude/teams/framework-research/memory/team-lead.md
  - docs/xireactor-pilot-host-architecture-2026-04-15.md
  - docs/xireactor-pilot-governance-2026-04-15.md
source-commits:
  - 717568c
  - 89c4897
source-issues: []
---

# Integration, Not Relay — Both Sides of a Cross-Role Handoff Must Check Invariants at Citation Time

In a multi-specialist session, the team-lead's job between specialists is **integration**, not **relay**. Specialist positions are **time-indexed state**, not typed values — a position held at T1 may be superseded by the same specialist's own later deliverable at T2. Citing the T1 snapshot as current state at T3 propagates stale state downstream, creating phantom endorsements that another specialist then has to resist.

The discipline is **bidirectional**. Team-lead side: check the invariant at citation time. Specialist side: re-check a team-lead endorsement against your own latest integrated state before folding it into your next deliverable. If either side defers to the other without re-checking, the same class of framing error propagates. Integration discipline is not an asymmetric duty.

## The Four Checks (team-lead side)

Before citing a specialist's position in a message to another specialist, verify all four:

1. **Is this position still held?** (Walk convergence history forward — has the specialist shipped a later deliverable that supersedes the cited snapshot?)
2. **Is this position an explicit decision on the specific proposal?** (Or am I extrapolating from a related-but-different prior statement? — pending-confirmation vs accepted)
3. **Does this proposal violate any existing contract from the specialist or another specialist?** (Grep for prior rules the proposal touches; check self-consistency with the specialist's own §1.2-equivalent rules.)
4. **What would change the landing?** (Herald's generalized outcome-(c) test: if the answer is "re-read the same source," the landing doesn't move; if the answer is "new evidence — source code, prototype, stakeholder interview, empirical deployment data," the landing can move, but only via that new input.)

## The Complement (specialist side)

Before folding a team-lead endorsement, another specialist's classification, or any external position into your next deliverable, run a **pre-fold consistency check**:

- Is the incoming position consistent with the latest integrated state of my own doc?
- Was it derived from integrated reasoning across the current session state, or from a single message I or they wrote in isolation?
- If I cannot answer "consistent with my latest state" confidently, pause the fold and surface the divergence back upstream rather than silently conforming.

**Team-lead guidance is input to specialist integration, not a substitute for it.** A specialist who folds unreviewed is creating the same failure mode team-lead creates by relaying unreviewed — just at a different layer.

## The Meta-Trap: Discipline Ritual as Substitute for Object-Level Work

The failure mode has a **higher-order variant** that is sharper and more dangerous than any single instance:

**When you apply cross-role integration discipline as the primary thing you're doing instead of as the check before the primary thing, the discipline becomes theater.** You will rehearse "pre-fold consistency check," "walk convergence history forward," "integration not relay" to each other while the object-level epistemic question — the one that would actually settle the disagreement — goes unasked.

The test is simple: after the integration-discipline exchange, can you name the source-code read / prototype / artifact inspection / stakeholder question that would settle the object-level disagreement? If not, the discipline ritual is running in place of the work. The cure has become the disease.

The meta-trap shows up when both sides have strong integration-discipline vocabulary and are using it fluently. The fluency is a warning sign, not a confidence signal: the more articulate the discipline exchange, the more important it is to stop and ask what the object-level question is.

## Observed Instances (framework-research session 2026-04-15 late-eve)

Six instances in one session. Four team-lead integration failures, two specialist-side articulations of the complementary discipline:

1. **Tier 3 OFF/ON endorsement (19:19 → 19:26 retracted).** Team-lead endorsed Brunel's v0.1 Q3 as a "first-class pilot objective" without noticing it was phantom under Monte's asymmetric framing (which team-lead had separately endorsed). Brunel caught it in v0.2 self-rejection.
2. **Schema-per-tenant snapshot cite (earlier window).** Team-lead relayed Monte's v1 topology call to Brunel as current state after Monte had self-corrected to row-level-only in his own §3.2.1. Brunel caught it in v0.3 pushback. Monte articulated the meta-note: *"walk convergence history forward; don't cite snapshot as current."*
3. **Protocol D phantom-acceptance (19:45 → 19:53 retracted → 20:02 restored).** Team-lead echoed "accepted" on Herald's rename based on Monte's earlier "Protocol A-prime is a placeholder" note, without Monte's explicit decision on the specific proposal. Monte actually declined, then re-accepted with canonical-taxonomy-slot reasoning. Herald surfaced the scratchpad divergence via "surface, don't bridge."
4. **§10 PROPOSED-framing suboptimal ask (19:51 → 19:58).** Team-lead asked Brunel for a surface-level framing edit on §10 when the actual structural fix was full withdrawal on §1.2 upstream-discipline grounds. Brunel caught the deeper structural fix himself in v0.5.
5. **Brunel's specialist-side articulation (v0.6 scratchpad):** *"v0.2 and v0.5's self-rejections were correct precisely when I did my own integration check against Monte's framing; v0.4 and v0.6.1 were wrong precisely when I folded a team-lead endorsement without re-checking against my own prior reasoning. Team-lead guidance is input to my integration check, not a substitute for it."*
6. **Herald's "surface, don't bridge" (session):** when Herald's own scratchpad diverged from team-lead's on Protocol D acceptance, he surfaced the divergence back to team-lead rather than silently re-aligning. Specialist-side complement of team-lead's "relay" failure mode — Herald refused to relay a stale team-lead position back into his own doc.

Both sides independently articulated the same root discipline from opposite ends of the cross-role handoff. The convergence itself is evidence that integration-discipline is a symmetric property of the handoff, not an asymmetric duty.

## Meta-Trap Instance — The §10 Oscillation (user correction, 2026-04-15 late-eve)

The same session that produced the n=4+ integration-failure evidence also produced the sharpest instance of the **meta-trap** — discipline ritual running in place of the work.

The §10 PROPOSED/WITHDRAWN question oscillated across **seven revisions** (v0.1 phantom → v0.3 self-rejection → v0.4 novel proposal → v0.5 withdrawal → v0.6.1 PROPOSED restoration → v0.6.2 over-withdrawal → v0.6.3 PROPOSED restoration). Throughout the oscillation, team-lead and Brunel rehearsed integration-discipline vocabulary fluently: "pre-fold consistency check," "walk convergence history forward," "integration not relay."

The user's verbatim correction surfaced the failure: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."*

The object-level question was a **source-code read** — where does xireactor store per-tenant policy state, and can option (c) read it without a schema touch? Neither Brunel nor team-lead had read the xireactor source. Both were reasoning from intuitions about substrate behavior. The §1.2-compliance question was outcome (c) in Herald's framework — silent in current evidence, resolves only via new input. Naming it as (c) at any point would have stopped the oscillation.

**Instead, the discipline exchanges accumulated.** The fluency of the integration-discipline talk was obscuring the absence of object-level progress. Team-lead and Brunel were so focused on applying cross-role integration discipline that they missed the object-level epistemic question. The meta-discipline became a thing they performed *instead of* thinking.

This is the shape the entry's "Meta-Trap" section names. It is the failure mode of the cure, and it cannot be prevented by applying the cure harder. It can only be prevented by periodically asking, at the object level: *what new evidence would settle this?* If the answer is "we'd have to look at the artifact," look at the artifact — don't keep integrating.

## Relationship to Existing Entries

- **[`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md)** — the typed-contract discipline for protocol field sets. This entry generalizes the same shape to specialist *positions*: positions are time-indexed values that decay, and relay without citation-time check is the same class of defect as paraphrasing a field name. Cross-read is to protocols what walk-history-forward is to positions.
- **[`rule-erosion-via-reasonable-exceptions.md`](rule-erosion-via-reasonable-exceptions.md)** — sibling at the discipline-erosion layer. Rule-erosion warns that reasonable exceptions are corrosion vectors. The meta-trap in this entry is the dual failure: applying a rule so hard it substitutes for the work the rule is meant to enable. Both are failure modes of well-intentioned discipline; one drifts by softening, one drifts by calcifying into ritual.
- **[`external-synthesis-overreach.md`](../gotchas/external-synthesis-overreach.md)** — external reviewers promote conditionals to recommendations and flatten specialist nuance. This entry is the *internal* analog: team-lead over-cites specialists' positions and collapses time-indexed state to static claims. Same root cause (treating speculative state as settled), different agent position.

## Why Not Just "Walk Convergence History Forward"

Monte's "walk convergence history forward" names instance #2 cleanly but does not generalize to instances #1, #3, and #4 — those involve self-consistency checks (does the proposal violate a specialist's own existing rule?), pending-confirmation discipline (is this an explicit decision on the specific proposal?), and structural-fix detection (is the surface-level edit the real fix?). The pattern is broader: **all four checks share the shape "treat incoming positions as time-indexed state, verify at citation time."** History-walking is one of four checks; this entry captures all four, plus the specialist-side complement, plus the meta-trap that makes the discipline fail even when applied correctly.

## Anti-Patterns

- **"Specialist said yes to the category, so yes on the specific."** Category-level acceptance is not specific-proposal acceptance. Ping the specialist on the specific proposal before echoing downstream.
- **"Specialist's earlier position is authoritative because it's on the record."** On-the-record positions decay. An earlier endorsement that the specialist has since superseded is worse-than-useless as a citation — it carries the authority of the earlier position with none of the specialist's current reasoning.
- **"Team-lead endorsed it, so I should fold."** (Specialist side.) Team-lead endorsement is input, not verdict. Re-check against your own latest integrated state before folding. Brunel's v0.4 / v0.6.1 errors both look like this; his v0.2 / v0.5 self-catches both look like the correct discipline.
- **"We're applying the integration discipline, so we're doing the work."** (Meta-trap.) Rehearsing the discipline vocabulary is not the same as answering the object-level epistemic question. The test: can you name the new evidence (source read, prototype, artifact inspection) that would settle the disagreement? If not, the discipline is running in place of the work.
- **"The latest revision is the correct one because it's latest."** Oscillation without new evidence does not converge — it accumulates revisions without progress. Each revision in the §10 oscillation was a re-framing, not a re-grounding; the final v0.6.3 landing is the latest point in a speculative oscillation, not a resolved state.

## For Future Sessions

When two specialists' deliverables arrive in the same message window, cross-check their frames BEFORE endorsing either. When relaying a specialist position to another specialist, verify all four checks at citation time. When retracting an endorsement, state the retraction scope explicitly — which path is closed, why, and which adjacent paths remain open. When the discipline exchange starts to feel fluent, pause and ask what the object-level question is; fluency is a warning sign, not a confidence signal.

(*FR:Callimachus*)
