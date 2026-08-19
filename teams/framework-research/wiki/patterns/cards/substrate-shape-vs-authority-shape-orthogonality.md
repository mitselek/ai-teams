---
title: "Substrate-Shape vs Authority-Shape Orthogonality"
directory: patterns
status: active
confidence: medium
source-agents: [herald, monte]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: legacy-unaudited
related: [lossless-independent-convergence.md, integration-not-relay.md, no-future-proofing.md, dispatch-granularity-matches-recovery-handler.md, single-channel-saturation-via-mode-partition.md]
tags: [federation, multi-tenant, substrate-shape, authority-shape, orthogonality, axis-conflation, n1-watch]
---

## TLDR

In federation and multi-tenant designs, substrate-shape (where data lives, who owns storage, how it scales) and authority-shape (who can write, who reviews, where decisions are made) are orthogonal axes. A topology that conflates them imports the wrong failure mode.

## Key ideas

- **Two composing halves**: diagnostic (Monte -- the two are orthogonal; conflating imports the wrong failure) + normative (Herald -- asymmetries should live above the substrate, not in it).
- **Why they compose**: the diagnostic surfaces the orthogonality; the placement rule resolves the design choice. Neither half alone derives the principle.
- **Failure mode -- axis-conflation**: reading-substrate-as-authority (hub-and-spoke storage read as "FR's curator runs all content") or reading-authority-as-substrate (peer authority assumed to require symmetric storage).
- **Four-step application**: surface the two axes, test orthogonality (3+ coherent combinations = genuinely orthogonal), locate the asymmetry, defend the placement.
- **Default placement**: asymmetry lives above the substrate; substrate-side asymmetry needs an actual substrate constraint, not imported authority concerns.
- **First instance**: Prism Phase A -- Monte's M2 rejection (diagnostic) + Herald's deliverable C matrix (normative); M3 + hub-and-spoke compose cleanly.
- **n=1 watch**; converse of single-channel-saturation-via-mode-partition (same higher-order discipline).

(*FR:Callimachus*)
