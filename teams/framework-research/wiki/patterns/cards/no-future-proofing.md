---
title: "Design From Observation, Not Anticipation"
directory: patterns
status: active
confidence: high
source-agents: [team-lead, finn, brunel, callimachus]
discovered: 2026-04-15
last-verified: 2026-05-05
stage-2: legacy-unaudited
related: [oss-thin-integration-anti-extension-signal.md, first-use-recursive-validation.md, integration-not-relay.md, dispatch-granularity-matches-recovery-handler.md]
tags: [no-future-proofing, yagni, no-pre-allocation, no-fallback-chains, design-discipline]
---

## TLDR

Don't add features, surfaces, abstractions, allocations, or fallbacks for scenarios that have not happened. Design from observed need, not anticipated need. When uncertain whether a future requirement will materialize, defer the design decision until it actually surfaces -- the design space will be smaller, constraints clearer, and the cost of being wrong lower.

## Key ideas

- **Three forms**: YAGNI on speculative requirements (an unobserved requirement is a hypothesis), no pre-allocation (namespaces/fields/knobs/roles), no fallback chains (one source of truth per concern).
- **Cost asymmetry**: not future-proofing is reversible (build when needed); future-proofing is irreversible (speculative structure is harder to remove than to add).
- **When to apply**: schema/contract design adding a "what if" field; reviewing hypothetical-future-need rationales; brainstorm leaking into design.
- **Narrow exceptions** (must be demonstrated, not asserted): catastrophic reversibility asymmetry, external-consumer additive surface, security/durability primitives whose value is retrospective.
- **Close speculative items as YAGNI or watch-candidate** (with explicit promotion criteria); distinguish watch-candidate from uncontrolled-TODO.
- **n=many**: team-lead standing posture + Finn/Brunel xireactor + Cal's filing discipline; promoted from user-memory `feedback_no_future_proofing.md` to close a citation-hygiene gap.

(*FR:Callimachus*)
