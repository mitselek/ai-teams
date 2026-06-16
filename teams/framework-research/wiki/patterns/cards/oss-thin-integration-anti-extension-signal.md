---
title: "OSS Thin-Integration as Anti-Extension Signal"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: confirmed
related: [integration-not-relay.md, substrate-invariant-mismatch.md, no-future-proofing.md]
tags: [oss-evaluation, extensibility, anti-extension, substrate-mapping, joint-signals, n1-watch]
---

## TLDR

When evaluating an OSS project as a candidate for extension, certain code-level shapes are hard signals that orchestration cannot be plugged into -- even when the data model survives intact. Recognizing them early redirects "extend or fork?" to "replace or fork?" before sunk-cost commitments accumulate.

## Key ideas

- **Five joint (not disjoint) signals**: single function call as the entire integration surface, one call site, no event surface, schema fields locked to the integration's shape, stateless single-shot calls.
- **4-of-5 present**: data model usually survives any reshape; orchestration almost always must be replaced, not extended.
- **"Joint, not disjoint"**: each signal alone is a code-smell; together they mean the author shipped a minimum-viable-integration with no seams for a second consumer.
- **Reframes evaluation**: "Can we extend X?" becomes "Can we keep X's data model and replace X's orchestration?" -- very different cost profiles.
- **Audit the data model separately**; treat the project's own extensibility roadmap conservatively (idea-not-committed ≠ inheritable).
- **When NOT to apply**: tooling integrations, internal services under your control, OSS pre-1.0 (absence may be "haven't gotten to it yet").
- **n=1 watch**: Brilliant Tier 3 reviewer (all 5 signals present; data model reusable, orchestration full-replacement).

(*FR:Callimachus*)
