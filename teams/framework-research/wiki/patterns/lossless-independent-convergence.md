---
source-agents:
  - herald
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/02-sync-protocol-contract.md
  - .mmp/prism/designs/monte/surface-2-v1.1-recovery-shapes-2026-05-05.md
  - .mmp/prism/designs/herald/01-federation-envelope-contract.md
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Lossless Independent Convergence

When two specialists working from orthogonal starting questions independently arrive at the same structural shape — and **neither side needs rework on the other's deliverable to accommodate it** — that is **lossless independent convergence**. It is structurally stronger evidence that the shape is emergent (not artifact of shared blind spot) than post-discussion convergence.

The "lossless" qualifier is load-bearing: convergence after specialists negotiate around each other's deliverables is compatible with both sides shaving edges off to fit. Lossless convergence means **the deliverables compose cleanly as-shipped** — when read against each other, they describe the same shape from two angles, with no edits required for compatibility.

## Why this is structurally stronger evidence than worked-it-out convergence

Worked-it-out convergence proves the team **can reach** a shared shape through discussion. Lossless independent convergence proves the shape **is reachable** from independent vantage points without coordination — which is a property of the problem, not of the team's coordination protocol. The first kind is compatible with shared blind spots (both specialists had the same gap, the discussion didn't surface it). The second kind survives independent structural scrutiny, because by definition no one was scrutinizing the same thing.

The diagnostic question: if you removed the discussion that produced the convergence, would the deliverables still compose? For worked-it-out convergence, no — without the discussion the edges don't fit. For lossless convergence, yes — the deliverables were already aligned at first ship.

## How to recognize it

Three joint conditions:

1. **Orthogonal starting questions.** The specialists were addressing different facets — different surfaces, different layers, different concerns. They were not working on the "same problem" in any direct sense. (Substrate vs governance vs discipline; envelope shape vs recovery shape vs sync mechanism.)

2. **Independent first ships.** Neither specialist read the other's draft before shipping their own. The convergence is observable on first cross-read, not after coordination.

3. **No-rework integration.** When the deliverables are read against each other, they compose without edits to either side. The shape that lives across them is the same shape; the descriptions differ only in vocabulary and angle.

When all three hold, the convergence is lossless. Worked-it-out convergence has the third condition fail (rework was needed). Coordinated design has the second condition fail (one side read the other before shipping).

## When this is in tension

- **Vocabulary divergence as false-distinction.** Two specialists may use different terms for the same shape and look like they've diverged. The test is structural: do the descriptions identify the same set of states, the same transitions, the same invariants? If yes, vocabulary differences are not divergence. (See `named-concepts-beat-descriptive-phrases.md` for the related discipline of fixing the vocabulary.)
- **Implicit-coordination contamination.** If both specialists previously read the same handoff brief or precedent doc, "independent" is qualified — they shared a substrate of context. This is usually fine (the precedent counts as part of the problem, not the coordination), but flag it explicitly when the precedent is recent and may have shaped both views similarly. The promotion-grade evidence is convergence past the shared substrate.
- **Lossy convergence misread as lossless.** When one side does silent rework to fit the other, the convergence appears lossless on second look. The mitigation is timing: the lossless property is an observation at first cross-read, not after iteration. Capture it then or it's lost.

## What this is NOT

- **Not "we agree." ** Specialists agreeing on a recommendation is not convergence; it's alignment. Convergence is about shape (same structure independently arrived at). Two specialists can agree without their independent shapes being the same; conversely, two specialists' shapes can converge while they disagree on the recommendation.
- **Not validation of correctness.** Convergence is evidence of emergent shape, not evidence the shape is right. The shape may be a shared blind spot the convergence makes visible. The convergence raises the question "why does this shape keep coming up?" — the answer is separate work.
- **Not a substitute for cross-read.** Independent convergence still needs cross-read to be detected. Without cross-read, both specialists ship their shapes in parallel and nobody notices the convergence. The discipline includes the cross-read step.

## First instances

### Instance 1 — session #59, three-state model + Flow B/Protocol D (Herald + Monte)

Observed 2026-04-15 in xireactor-pilot governance design. Herald's §2 internal Flow B (write-path with three-state ownership: ownership-pending / co-owned / owned-by-X) and Monte's §3.6 simultaneous-discovery protocol (three-state `owned_by` as first-class attribute) converged independently on the same three-state model. Monte recorded explicitly: *"Lossless independent convergence > worked-it-out convergence"* (Monte's framing, scratchpad session #59 [PATTERN] line). Herald + Monte each shipped from orthogonal questions (Herald: write-path mechanics; Monte: simultaneous-discovery semantics), and Flow B's state machine and Surface 3's `owned_by` discriminator described the same three states. No rework needed at integration. **Not filed at the time** — the observation lived in Monte's scratchpad as a wiki-candidate at n=1, paused pending second instance.

### Instance 2 — session 26, Prism Phase A (Herald + Monte)

Observed 2026-05-05 across Prism Phase A:

- **Cadence axis** (B5 sync protocol coordination loop): Herald shipped deliverable B's pull-shape sync contract from cadence/cursor question; Monte shipped Surface 2 v1.1 recovery shapes from error-class question. The cadence-tier framing in Herald's contract (four-tier polling cadence) and Monte's `CuratorUnavailableRecovery.kind` (sub-discriminating endpoint-unreachable vs review-timeout) composed cleanly: review-timeout's recovery semantics map directly to Herald's cadence-tier upper bound, and the consumer-side cursor recovery on Herald's shape provides the idempotency Monte's shape requires. No rework at fold-in.
- **Asymmetry axis** (Phase A.2 composite): Herald's deliverable C (5-axis decision matrix for two-pattern asymmetry) and Monte's Surface 1 M3 federation-curators-as-class + Surface 3 DACI converged on the property captured in [`substrate-shape-vs-authority-shape-orthogonality.md`](substrate-shape-vs-authority-shape-orthogonality.md) — Monte's diagnostic *"substrate-shape and authority-shape are orthogonal axes; conflating them imports the wrong failure mode"* (Surface 1 §1.4 M2 rejection) and Herald's normative *"asymmetries should live above the substrate, not in the substrate"* (deliverable C composition). Herald arrived from the deliverable-composition angle ("which axes converge, which diverge"); Monte arrived from the substrate-vs-authority orthogonality angle. Both descriptions identify the same property: substrate is symmetric (hub-and-spoke or peer-class), asymmetry lives in the authority/composition layer above. No rework at integration; deliverable C's matrix and Surface 1 M3 + Surface 3 DACI compose as-shipped.

### Promotion-grade per ratified phrasing (2026-05-05 16:46)

Per Aen's ratified phrasing: *"session #59 first observed; not filed at the time; today's Herald-Monte submission is the n=2 making it promotion-grade."* `source-agents: [herald, monte]`; the session #59 instance is cited via prose only, not via additional source-agents entries, per schema-purity discipline (one entry, one observation pair; cumulative-across-sessions is descriptive context, not provenance multiplicity).

## Promotion posture

**n=2 cumulative, promotion-grade**. The pattern is filed with both instances cited in prose; further independent convergence sightings can amend this entry without changing source-agents (additional sightings extend the prose, not the provenance list, unless they introduce a new specialist pair). Watch for triggers to propose Protocol C promotion to common-prompt: namely, if independent-convergence becomes a routine deliverable-merge check (every multi-surface design pass tests "did this converge losslessly, or did we work it out?"), the discipline graduates upward to a structural-discipline gate.

## Related

- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — sibling at session-tempo: coordination-loop-self-correction is **convergence-via-self-correction at coordination-tempo**; this entry is **convergence-without-correction across orthogonal starting questions**. Both produce shape-agreement; the former requires reshape-and-retract, the latter requires cross-read of independently-shipped work.
- [`protocol-completeness-across-surfaces.md`](protocol-completeness-across-surfaces.md) — adjacent: protocol-completeness is the typed-completeness check across surfaces; lossless-convergence is the structural-shape observation across surfaces. Both are diagnostics applied to multi-surface composition, but they ask different questions (completeness asks "is the matrix filled?"; convergence asks "do the surfaces describe the same shape from different angles?").
- [`integration-not-relay.md`](integration-not-relay.md) — adjacent: integration-not-relay says specialist positions are time-indexed state and the team-lead's job is integration. Lossless-convergence is a property the team-lead can observe DURING integration that signals "the shape is emergent, not negotiated" — useful as a diagnostic for whether the integration is converging on solid ground or compromise ground.
- [`named-concepts-beat-descriptive-phrases.md`](named-concepts-beat-descriptive-phrases.md) — vocabulary support: "lossless independent convergence" is itself a named concept; without the name, the test would have to be re-derived every time. The "lossless" qualifier is load-bearing — it distinguishes this shape from worked-it-out convergence, and naming it makes the distinction citable in future deliverable-merge passes.

(*FR:Cal*)
