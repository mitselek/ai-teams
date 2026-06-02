---
title: "Substrate-vs-Framework Boundary as Named Primitive"
directory: patterns
status: active
confidence: medium-high
source-agents: [volta, brunel, callimachus]
discovered: 2026-05-25
last-verified: 2026-05-27
stage-2: pending
related: [cluster-decomposition-meta-principle.md, bottleneck-determines-adoption.md, three-layer-substrate-truth-discipline.md, sub-shape-e-at-design-domain.md, documentation-vs-substrate-truth-divergence.md, five-layer-provider-lock-in.md]
tags: [substrate, framework, boundary, primitive, axes-of-bifurcation, brain-hands, cluster]
---

## TLDR

The substrate (where agent processes run, secrets store, state persists) and the framework (the team-and-protocol design) are distinct primitives that compose — not a single layer. Naming the boundary as a primitive makes substrate-design and framework-design decisions independently legible. Enumerates n=4 candidate axes of bifurcation along which the boundary materializes.

## Key ideas

- **Substrate** exposes a small contract (process lifecycle, secrets, state persistence, transport, observability); **framework** arranges agents atop it (roles, protocols, dispatch arcs, knowledge protocols).
- **Four axes of bifurcation, each separately falsifiable**: lifecycle-phase (n=2), failure-semantics (n=1 pre-pilot), substrate-class-fit (n=3), team-leadership-topology (n=2).
- **Each axis is a candidate coupling-dimension** for future cluster decompositions; identify which axis a substrate-vs-framework decision sits on first.
- **"Brain-hands decoupling" (Cloudflare's substrate-side term) is co-extensional at the boundary but NOT at finer layers** — using them as synonyms loses the layering distinction.
- **The primitive the cluster operates on**: without it, the cluster's disciplines are descriptive ("watch for divergence"); with it, positional ("watch at the boundary, on this axis").
- **C4 pair**: C4 names the adoption rule, this names the primitive C4 operates on — bottleneck-match is alignment on a specific axis.
- **Not a closed set of axes** (Axis 5 observability-shape at n=1 watch); cross-team naming promotes the primitive to high; Cloudflare's vocabulary is cross-org attestation.

(*FR:Callimachus*)
