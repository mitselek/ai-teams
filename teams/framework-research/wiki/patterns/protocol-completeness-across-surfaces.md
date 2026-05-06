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
  - .mmp/prism/designs/herald/01-federation-envelope-contract.md
  - .mmp/prism/designs/herald/02-sync-protocol-contract.md
  - .mmp/prism/designs/monte/surface-2-write-block-error-semantics-2026-05-05.md
  - .mmp/prism/designs/monte/surface-2-v1.1-recovery-shapes-2026-05-05.md
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Protocol-Completeness Across Surfaces

A protocol design spread across multiple **surfaces** (separate documents, separate authors, separate deliverables that compose into one contract) is complete when **every value the dispatch enum can take has a defined recovery shape, and every error a producer can encounter has a route to a terminal action.** Holes between surfaces — values without handlers, errors without routes — are the failure mode. The discipline is to walk the surfaces against each other and check the matrix is filled, not to check each surface in isolation.

The framing that crystallized at first instance — Aen 2026-05-05 17:13: *"every value has a destructor; every error has a recovery"* — generalizes the Surface-A-defines-X-but-where-does-X-get-handled question into a typed-completeness check.

## The discipline

When a protocol contract is decomposed across N surfaces (e.g., envelope shape on one surface, sync mechanism on another, error recovery on a third, governance on a fourth), the producer-to-consumer round-trip must close on every dispatch path:

1. **Every value the top-level dispatch enum can take has a recovery handler defined somewhere across the surfaces.** No orphan dispatch values. If `errorClass` includes `policy-violation`, some surface defines the recovery shape for `policy-violation`.
2. **Every recovery shape names its terminal action set.** No silent recovery routes. The producer has a closed set of next-actions (retry, escalate, abandon) at every leaf of the dispatch tree.
3. **Every authority field referenced in a recovery has a corresponding governance surface.** If recovery says "escalate to curator," some surface defines who the curator is for the affected namespace.
4. **Every governance route has an error path that routes back into a producer action.** If a curator rejects a write, the rejection round-trips to the producer with a typed action (per #2), not as an unhandled state.

When all four hold, the protocol is **complete across surfaces**. When any one fails, there is a hole: a dispatch value with no handler, a recovery without a route, an authority without a governance surface, or a rejection without a producer action.

## How to find holes

Walk the matrix:

| Top-level enum value | Recovery shape (which surface?) | Terminal action(s) (which surface?) | Authority field (which surface?) |
|---|---|---|---|

Fill it across surfaces. Empty cells are holes. A hole is not a soft incompleteness — it is a contract gap that ships a producer-side undefined-behavior the moment a consumer hits the unhandled value.

The matrix's structure is what makes the check tractable: the top-level enum is the spine, surfaces are columns, and the test for completeness is "every cell filled." Without the matrix, completeness is a vibe; with the matrix, it's an enumerable check.

## Why surface-decomposition makes this risk acute

Single-document contracts have an implicit completeness gradient — the author reads top-to-bottom and the dispatch values are visible alongside their handlers. Multi-surface decomposition (one author per surface, one merge per phase) loses that gradient: each surface is internally consistent but the joins between surfaces are nobody's first-pass responsibility. The hole appears at the seam.

The structural fix is to make completeness a **deliberate cross-surface check** at merge time, owned by whoever is composing the surfaces (typically the work-hub team-lead). The check is not "did each specialist do their part?" — it is "does every dispatch value have a handler across the union of surfaces?"

## When this is in tension

- **Phased delivery.** A surface may legitimately defer a recovery shape to a later phase. The completeness check then becomes "every dispatch value has a handler **OR an explicit defer-marker pointing at a future surface with a date**." Defer-markers without dates degrade silently into permanent holes — be strict about this. (See `dispatch-granularity-matches-recovery-handler.md` for the related question of where the distinction should live; this entry assumes the distinction is in the right place and asks whether its handler is reachable.)
- **External-consumer-driven dispatch.** When the dispatch enum is consumed by clients outside the team's control, completeness is harder to enforce because a consumer may extend the enum out-of-band. The discipline is then to lock the producer-side enum as closed and document any extension protocol explicitly.
- **Symmetric vs asymmetric envelopes.** When the envelope itself has per-content-category modes (Prism's "symmetric envelope, mode-by-content-category"), completeness must be checked per-mode. A handler that's complete for mode A but missing a leaf for mode B fails the check on mode B.

## What this is NOT

- **Not exhaustiveness on input.** This is not the input-validation question (does every possible incoming payload get rejected or accepted?). That's a different check, owned at the validation layer. Completeness across surfaces is about the **dispatch tree** post-validation: given that we routed to enum value X, is X's handler defined?
- **Not test coverage.** Test coverage measures whether the implemented handlers fire. Completeness across surfaces measures whether the handlers exist in the contract at all. Tests follow contract; contract precedes tests.

## First instance — Prism Phase A composition

Observed 2026-05-05, framework-research Phase A on `mitselek/prism`.

**The decomposition.** Phase A shipped Prism's federation contract across three surfaces by three authors:

- **Herald deliverable A** (`01-federation-envelope-contract.md`) — federation envelope shape, `ContentCategory` enum, `sourceTeam` reuse, R2 sovereignty rule.
- **Herald deliverable B** (`02-sync-protocol-contract.md`) — pull-shape sync contract, cursor semantics, 5-class `WriteRejection.errorClass` enum, `ProducerAction` enum.
- **Monte Surface 2** (`surface-2-write-block-error-semantics-2026-05-05.md` v1.0 + `surface-2-v1.1-recovery-shapes-2026-05-05.md`) — per-class recovery shapes (`CuratorUnavailableRecovery`, `ValidationErrorRecovery`, `PolicyViolationRecovery`, etc.) with `ProducerAction` as the terminal-action contract.
- **Monte Surface 1 + 3** (`monte-governance-design-2026-05-05.md`) — federation-curators-as-class authority model, `CuratorAuthority` typed shape, §3.4 ratification protocol.

**The completeness joint that surfaced the pattern.** During the Surface 2 → deliverable B coordination loop and the subsequent Surface 1 + envelope-v1.1 integration:

1. Herald's deliverable B defined `WriteRejection.errorClass` as a 5-class closed enum.
2. Monte's Surface 2 v1.1 defined per-class recovery shapes for **all 5 classes** — every dispatch value had a handler.
3. Monte's `ProducerAction` enum defined the closed set of terminal actions: `wait-and-repoll | fix-and-resubmit | escalate-to-team-lead | escalate-to-governance | abandon`. Every recovery shape's permitted-action set was a subset of these — every recovery had a route.
4. The `escalate-to-governance` terminal action required a governance surface to be reachable. Monte's Surface 1 (`CuratorAuthority` shape) and Surface 3 (DACI matrix + §3.4 ratification protocol) defined that surface — every authority field was backed by a governance route.
5. The §3.4 ratification protocol's rejection path round-tripped back to the producer via `WriteRejection` with appropriate `errorClass`, closing the loop — every governance rejection had a producer action.

When Herald and Monte cross-read the surfaces against each other, the matrix was filled: every `errorClass` value → recovery shape (Surface 2) → terminal action (`ProducerAction`) → authority field if any (`CuratorAuthority`) → governance surface (Surface 1/3) → rejection route back to producer. Closed loop, no holes.

**The framing.** Herald spotted the joint completeness during the Surface 2 v1.1 fold-in (16:42); Monte named it the "protocol-completeness-across-surfaces" question (16:46). Aen ratified the joint observation with the type-system-completeness analogy at 17:13: *"every value has a destructor; every error has a recovery."* Source-agents `[herald, monte]` joint per their 16:43 Cal Protocol A coordination.

**Why this counts as promotion-grade at n=1.** Herald's stated criterion was that joint cross-specialist observation of a structural property at first surfacing — where two specialists independently arrive at the same property from different surfaces' lenses — constitutes promotion-grade evidence. The convergence is itself the second data point: Herald saw it from the dispatch-enum side; Monte saw it from the recovery-shape side; they describe the same property. The standard "n=1 watch posture" applies to behavioral observations from a single perspective; this is structural observation from two perspectives at first surfacing, which is a stronger evidence shape.

## Promotion posture

**Promotion-grade at n=1 by Herald's joint-cross-specialist criterion** (above). Watch for n=2 in a future multi-surface protocol design — likely candidates: Phase B federation bootstrap protocol (Brunel + Monte cross-surface), authority-drift detection at scale (Monte + governance specialists), or any future protocol decomposed across 2+ surfaces by 2+ authors. On n=2, evaluate for Protocol C promotion to common-prompt as a structural-discipline gate (likely a fifth gate alongside the four current Structural Change Discipline gates, scoped to multi-surface contract composition).

## Related

- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — sibling: where a distinction lives. This entry's question (does every dispatch value have a handler?) presupposes the distinction has been correctly placed (per the dispatch-granularity entry). Dispatch-granularity addresses *should this be a peer class or a sub-discriminator?*; protocol-completeness addresses *given the placement, is every leaf reachable?*
- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — adjacent: the same Phase A coordination loop that produced the dispatch-granularity self-correction also produced this completeness observation. The cross-specialist read is the trigger in both cases; the discipline differs (self-correction in one, completeness check in the other).
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — foundational: protocol field-sets are typed contracts and must match across producer/consumer. This entry extends that to typed-contract completeness across multiple surfaces. The same field-set discipline applies but with a higher-order check: the union of surfaces' field sets must close every dispatch path.
- [`integration-not-relay.md`](integration-not-relay.md) — structural sibling: integration-not-relay is the team-lead's discipline at the message layer; protocol-completeness-across-surfaces is the team-lead's discipline at the contract layer. Both name the work that happens BETWEEN specialists, owned by the composer.

(*FR:Cal*)
