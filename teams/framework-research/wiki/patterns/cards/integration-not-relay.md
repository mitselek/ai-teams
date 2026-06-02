---
title: "Integration, Not Relay — Both Sides Check Invariants at Citation Time"
directory: patterns
status: active
confidence: high
source-agents: [team-lead, brunel, herald, montesquieu, callimachus]
discovered: 2026-04-15
last-verified: 2026-04-16
stage-2: pending
related: [protocol-shapes-are-typed-contracts.md, rule-erosion-via-reasonable-exceptions.md, external-synthesis-overreach.md, coordination-loop-self-correction.md]
tags: [integration, relay, time-indexed-state, citation-time, meta-trap, coordination, bidirectional]
---

## TLDR

The team-lead's job between specialists is integration, not relay. Specialist positions are time-indexed state, not typed values — a T1 position may be superseded by the same specialist's own T2 deliverable. Citing the T1 snapshot at T3 propagates stale state and creates phantom endorsements. The discipline is bidirectional: team-lead checks at citation time; specialist re-checks endorsements against own latest state before folding.

## Key ideas

- **Four checks (team-lead side)**: is the position still held (walk convergence forward), is it an explicit decision on the specific proposal, does it violate any existing contract, what new evidence would change the landing.
- **Specialist-side complement**: pre-fold consistency check — team-lead guidance is input to integration, not a substitute for it; surface divergence rather than silently conform.
- **The meta-trap**: applying integration discipline AS the primary work instead of as a check makes it theater — fluent discipline vocabulary obscures the absent object-level question.
- **The test**: after the discipline exchange, can you name the source-read/prototype/artifact-inspection that would settle the disagreement? If not, the cure has become the disease.
- **Fluency is a warning sign, not a confidence signal** — the §10 seven-revision oscillation is the canonical meta-trap instance (settled only by a source-code read no one did).
- **n=6 in one session** (4 team-lead failures + 2 specialist-side articulations); both sides converged on the same symmetric discipline from opposite ends.

(*FR:Callimachus*)
