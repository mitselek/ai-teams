---
title: "Three-Layer Substrate-Truth Discipline"
directory: patterns
status: active
confidence: medium-high
source-agents: [brunel, callimachus]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-26
stage-2: pending
related: [discriminator-anchored-on-sub-canonical-source.md, substrate-invariant-mismatch.md, sub-shape-e-at-design-domain.md, cluster-decomposition-meta-principle.md, dual-team-dir-ambiguity.md]
tags: [substrate-truth, three-layer, docker, drift, operator-defense, cluster, hopper-amendment-4]
---

## TLDR

For FR-shipped substrates that consumer teams operationalize, the substrate exists in three layers that can drift independently: Layer 1 (FR design-as-shipped), Layer 2 (consumer-team operational copy), Layer 3 (running container state). Reading only one layer — even the canonical FR-design layer — is insufficient for first-dispatch substrate-truth.

## Key ideas

- **Each layer is canonical for a different question**: L1 = design lineage, L2 = what next `docker compose up` does, L3 = what's currently serving. Confusing which layer is canonical is part of the failure mode.
- **Drift lives at the pair boundary, not at any single layer**: L1↔L2, L2↔L3 (L1↔L3 mediated by L2). Recreate is the L2→L3 drift-resolution event AND the multi-system failure surface if L2 is degraded.
- **Two joint halves**: Brunel's architectural distinction (the three layers + drift surfaces) + Hopper's operator-defense (first-dispatch Tier R three-layer probe-suite; subsequent-dispatch scratchpad-read-first).
- **FR-design-only discipline is insufficient** — FR ships L1, consumer teams operationalize L2+L3.
- **n=3 within-arc drift (S34 apex-keys) + n=2 cross-substrate-class (Docker-on-RC + Cloudflare-managed)**; substrate-class-invariant.
- **Recursive structure**: within 36h of Hopper-Amendment-4 landing, the discipline caught its own authors at the design layer (see sub-shape-e-at-design-domain).
- **Promoted to common-prompt via Hopper-Amendment-4** (Celes-landed 2026-05-25).

(*FR:Callimachus*)
