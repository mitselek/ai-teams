---
title: "Bottleneck Determines Adoption (Cross-Domain)"
directory: patterns
status: active
confidence: medium-high
source-agents: [brunel, volta, callimachus]
discovered: 2026-05-25
last-verified: 2026-05-26
stage-2: confirmed
related: [cluster-decomposition-meta-principle.md, three-layer-substrate-truth-discipline.md, substrate-invariant-mismatch.md]
tags: [adoption, bottleneck, cross-domain, two-condition-rule, substrate, discipline, methodology-pair]
---

## TLDR

A team's adoption of any cluster-component (a discipline like mVox M1-M5 or a substrate like Cloudflare's 7-mechanism stack) follows the same structural rule: adopt the component whose value-axis matches the team's dominant bottleneck. Adoption is bottleneck-driven — not vendor-, novelty-, or least-friction-driven. Same mechanics across discipline-domain and substrate-domain.

## Key ideas

- **Two-condition rule (AND, both required)**: bottleneck-match (X's strength aligns with team's dominant bottleneck) AND workload-fit (X's constraints accommodate the team's workload). Neither alone is sufficient.
- **Operational dual of cluster-decomposition (C1)**: C1 names which axis the cluster decomposes along; this picks which position to adopt. Sequential, not parallel — axis first, bottleneck-alignment second.
- **n=3 across two domains**: mVox M1 (YES-match), apex Cloudflare (PILOT-candidate), FR Cloudflare (CAN'T-MOVE-THE-NEEDLE). NO-match is structurally informative — rule operates in negative.
- **Least-distinctive-but-highest-leverage**: the least-distinctive cluster component maps to a common-across-teams team-property where bottlenecks accumulate (M1, observability-by-default). Predict it by finding the most-common team-property.
- **Parallel application is a category error**: picking a position before the axis is named selects from incommensurable components.
- **Bottleneck-identification is not mechanical**: requires a catalyzing observation (S35 M1 reorientation tax, S34 apex-keys arc); without one, bottleneck-class claims are speculative.
- **n=4 in a third domain promotes to confidence-high**; apex Cloudflare pilot is the falsifiability test for Instance 2.

(*FR:Callimachus*)
