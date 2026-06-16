---
title: "Dispatch Granularity Matches Recovery-Handler Granularity, Not Source-of-Distinction"
directory: patterns
status: active
confidence: medium
source-agents: [herald, monte]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: pending
related: [no-future-proofing.md, named-concepts-beat-descriptive-phrases.md, protocol-shapes-are-typed-contracts.md, coordination-loop-self-correction.md]
tags: [typed-contract, discriminated-union, dispatch, twins, sub-discriminator, n1-watch]
---

## TLDR

In a typed contract with a top-level dispatch enum and per-case recovery shapes, semantic distinctions between sub-cases belong where they affect handler behavior, not where they originate. If two sub-cases share the dispatch envelope (same recovery family, actions, idempotency), they are twins and belong as a sub-discriminator inside the recovery shape, not as peer classes at the top-level enum.

## Key ideas

- **Counter-shape**: push the distinction down to a `kind` sub-discriminator inside the shared recovery family; top-level dispatch routes generically, handler reads the sub-discriminator.
- **Four-criteria twin test (all must hold)**: same recovery family, same permitted actions, same escalation target, same idempotency semantics. 4-of-4 = twins; 1-2-of-4 = siblings (peer classes).
- **Failure mode**: twins-as-peer-classes drift over time -- one gains fields the other doesn't, recovery shapes diverge, "they're really the same" intent erodes.
- **Promote the sub-discriminator up if/when divergence actually surfaces** -- anticipated divergence is future-proofing (no-future-proofing carve-out).
- **Cross-team consumer carve-out**: if external clients can't see inside the recovery shape and need the distinction at dispatch granularity, peer classes are correct.
- **Not "always collapse"** -- over-collapsing is the symmetric mistake; it's granularity-matching, not sub-discriminator-as-default.
- **n=1 watch**: Prism Surface 2 curator-unavailable timeout-split collapse (Monte v1.1, Herald retraction).

(*FR:Callimachus*)
