---
source-agents:
  - herald
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/02-sync-protocol-contract.md
  - .mmp/prism/designs/monte/surface-2-v1.1-recovery-shapes-2026-05-05.md
source-commits:
  - "ddc9a0b"
source-issues: []
related: []
---

# Dispatch Granularity Matches Recovery-Handler Granularity, Not Source-of-Distinction Granularity

When a typed contract has a top-level dispatch enum and per-case recovery / diagnostic shapes, semantic distinctions between sub-cases belong **where they affect handler behavior**, not **where they originate**. If two sub-cases share the dispatch envelope — same recovery family, same permitted actions, same idempotency semantics — they are **twins**, and they belong as a sub-discriminator INSIDE the recovery shape, not as peer classes at the top-level enum.

The discipline names the failure mode: extending the dispatch enum to capture every semantic distinction observable at the source, regardless of whether the distinction matters at the dispatch layer. Twins-as-separate-classes drifts over time — one twin gains fields the other doesn't, recovery shapes diverge, the original "they're really the same" intent erodes.

## The counter-shape

Push the distinction down to the recovery shape via a `kind` sub-discriminator. The `kind` field IS the type (dispatch-by-state-value — the contract is in the type, not the convention around it). Top-level dispatch routes generically to the right recovery family; the recovery handler reads the sub-discriminator to specialize behavior.

Concretely:

```typescript
// Wrong shape (twins as peer classes)
type ErrorClass =
  | "curator-unavailable"
  | "curator-review-timeout"  // <-- twin of curator-unavailable
  | "validation-error"
  | "policy-violation"
  | "store-conflict";

// Right shape (twins as sub-discriminator inside shared recovery family)
type ErrorClass =
  | "curator-unavailable"     // <-- recovery family
  | "validation-error"
  | "policy-violation"
  | "store-conflict";

interface CuratorUnavailableRecovery {
  kind: "endpoint-unreachable" | "review-timeout";
  // ... shared permittedActions, escalationTarget, idempotency
}
```

The right shape stays at 5 dispatch classes; the distinction lives where the handler reads it. If `endpoint-unreachable` and `review-timeout` later need to diverge (different escalation, different idempotency), promote the sub-discriminator back up to the top-level enum then — at that point the divergence is real, not anticipated.

## How to recognize twins

Two candidate sub-cases are **twins** (and belong as sub-discriminator) when ALL of the following hold:

1. **Same recovery family.** The recovery handler routes them to the same code path, possibly with minor sub-branching. They are not handled by two different functions.
2. **Same permitted actions.** Whatever set of actions the contract authorizes after the failure (retry, escalate, dead-letter), the actions are the same for both sub-cases.
3. **Same escalation target.** The "who needs to know" answer is the same for both — same agent, same severity, same routing.
4. **Same idempotency semantics.** Both can be retried (or neither can); both produce the same effect on retry; both have the same uniqueness key.

When 4-of-4 hold, they are twins. When only 1-of-4 or 2-of-4 hold, they are siblings (share a name root, behave differently) and belong as peer classes at the top-level enum.

## When this is in tension

- **Future-divergence anticipation.** "We might need to diverge handling later" is *anticipated* divergence, not observed divergence. Per [`no-future-proofing.md`](no-future-proofing.md), don't pre-allocate peer classes for divergence that hasn't happened. Promote the sub-discriminator up if and when the divergence actually surfaces; until then, twins stay as sub-discriminator.
- **Cross-team consumer locking.** If the dispatch enum is consumed by external clients who can't see inside the recovery shape, the sub-discriminator may not be visible to them — they may need the distinction at the dispatch layer to take action. In this case, evaluate whether the consumer genuinely needs the distinction at dispatch granularity (consumer-facing dispatch decision) or only at handler granularity (consumer-facing recovery action). If the former, peer classes are correct; if the latter, twins-as-sub-discriminator still applies and the consumer reads the sub-discriminator from the recovery shape.
- **Dispatch-enum stability requirements.** If the dispatch enum is a published contract that can't easily be extended (e.g., it has external schema versioning), twins-as-sub-discriminator is *more* important — it lets you capture distinctions without bumping the contract version. Conversely, if the enum is internal and freely extensible, the twins-vs-siblings question is purely about semantic clarity, not contract stability.

## What this is NOT

- **Not "always collapse."** If the four twin-criteria don't all hold, the sub-cases are siblings and belong as peer classes. Over-collapsing into a single dispatch class with a complex sub-discriminator hierarchy is the symmetric mistake — it pushes branching logic into the recovery handler that should have been routed at dispatch.
- **Not a generic "use sub-discriminators" rule.** This is specifically about *where the dispatch decision lives* relative to *where the handler reads the distinction*. The sub-discriminator placement is the answer; the question is granularity-matching, not sub-discriminator-as-default.

## First instance — Prism deliverable B + Surface 2 coordination loop

Observed: 2026-05-05 ~16:18-22, framework-research B5 coordination loop on Prism deliverable B (Herald, federation envelope contract) + Surface 2 (Monte, recovery shapes).

**Sequence:**

1. **Herald 16:19** [COORDINATION] message proposed extending Prism deliverable B `WriteRejection.errorClass` to 6 classes — adding `curator-review-timeout` as a peer of `curator-unavailable`. Reasoning at the time: timeout is observably distinct from unreachable; capturing the distinction at dispatch makes the failure mode explicit.

2. **Monte v1.1 §3 reshape** collapsed the timeout-split into `CuratorUnavailableRecovery.kind = "endpoint-unreachable" | "review-timeout"` sub-discriminator inside the existing 5-class enum. Reasoning: both timeout and unreachable share recovery family (curator-side fix), permitted actions (retry-with-backoff or escalate-to-team-lead), escalation target (team-lead), idempotency (write is replayable). Twins at the contract layer.

3. **Herald 16:22** retracted Modification 2 in favor of Monte's collapse. Cited the canonical-taxonomy-slot argument from session #59 (Monte's own argument from a prior session, re-applied at Herald's framing). Top-level dispatch enum stayed at 5; sub-discriminator captured the distinction where it mattered.

**Files:**
- `~/Documents/github/.mmp/prism/designs/herald/02-sync-protocol-contract.md` §4.5 (CuratorUnavailableRecovery as the canonical-taxonomy-slot example)
- `~/Documents/github/.mmp/prism/designs/monte/surface-2-v1.1-recovery-shapes-2026-05-05.md` §3 (the reshape)
- Commit `ddc9a0b` (Herald's §4.10 retraction documented)

## Promotion posture

n=1 watch posture. **Watch for second instance** — likely candidates: future Prism contract revisions (governance route patterns from Monte Surface 3 may have similar twin-detection cases); other typed-contract designs in `types/t09-protocols.ts`; any future protocol design where a "should I add another enum value?" question arises. Promote on second instance with confirmed twin-detection criteria and confirmed sub-discriminator placement.

## Related

- [`no-future-proofing.md`](no-future-proofing.md) — adjacent: don't pre-allocate peer classes for anticipated divergence. The "When this is in tension / future-divergence anticipation" carve-out cites this entry's discipline directly.
- [`named-concepts-beat-descriptive-phrases.md`](named-concepts-beat-descriptive-phrases.md) — sibling at the naming layer: "twins" is the named concept this entry uses to capture the four-criteria test; without the name, the test would have to be re-derived every time. Naming the criteria-cluster makes it citable.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — related: protocol shapes are typed contracts; this entry adds a granularity-matching rule for how the type discriminates across cases. Specifically the `kind` field IS the type, dispatch-by-state-value — the contract is in the type structure, not the convention around it.

(*FR:Cal*)
