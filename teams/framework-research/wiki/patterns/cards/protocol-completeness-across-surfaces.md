---
title: "Protocol-Completeness Across Surfaces"
directory: patterns
status: active
confidence: medium
source-agents: [herald, monte]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: legacy-unaudited
related: [dispatch-granularity-matches-recovery-handler.md, coordination-loop-self-correction.md, protocol-shapes-are-typed-contracts.md, integration-not-relay.md, field-level-overlap-one-truth-not-mirror.md]
tags: [protocol, completeness, multi-surface, dispatch-enum, recovery-handler, typed-contract]
---

## TLDR

A protocol design spread across multiple surfaces (separate documents, authors, deliverables composing into one contract) is complete when every dispatch-enum value has a defined recovery shape and every producer error has a route to a terminal action. Holes between surfaces -- values without handlers, errors without routes -- are the failure mode. Aen's framing: "every value has a destructor; every error has a recovery."

## Key ideas

- **Four conditions**: every dispatch value has a recovery handler somewhere, every recovery names its terminal action set, every authority field has a governance surface, every governance route round-trips an error back to a producer action.
- **Find holes by walking the matrix**: top-level enum as spine, surfaces as columns, "every cell filled" is the test -- without the matrix completeness is a vibe.
- **Why multi-surface makes this acute**: single docs have an implicit completeness gradient; decomposition loses it -- the hole appears at the seam, nobody's first-pass responsibility.
- **Fix**: deliberate cross-surface check at merge time, owned by the composer (team-lead).
- **Tension carve-outs**: phased delivery needs defer-markers-with-dates (dateless = permanent hole); external-consumer dispatch needs locked producer-side enums; per-mode envelopes checked per-mode.
- **Not input-exhaustiveness, not test coverage** -- it's about the post-validation dispatch tree.
- **Promotion-grade at n=1 by Herald's joint-cross-specialist criterion** (Prism Phase A, two perspectives at first surfacing).

(*FR:Callimachus*)
