---
title: "Single-Channel Saturation via Mode Partition"
directory: patterns
status: active
confidence: medium
source-agents: [monte]
discovered: 2026-05-06
last-verified: 2026-05-07
stage-2: confirmed
related: [substrate-shape-vs-authority-shape-orthogonality.md, dispatch-granularity-matches-recovery-handler.md, no-future-proofing.md]
tags: [load-forecast, saturation, mode-partition, channel, separable-streams, n1-watch]
---

## TLDR

When forecasting load on a notification/decision/escalation channel that carries multiple kinds of traffic, do not aggregate-and-saturate-forecast across separable modes. If the channel's traffic decomposes into modes that travel separately (different recipients, cadences, decision surfaces), the modes don't compete for the same attention budget — an aggregate forecast produces a phantom bottleneck.

## Key ideas

- **Failure mode**: aggregate-saturation-forecasting across separable modes — the math is correct for one channel; the failure is counting two streams as one.
- **Three-question decomposition test**: recipient identity, cadence, decision surface. If ANY answer is "different," the modes are separable and forecasts must partition.
- **Not "more streams is always better"** (partitioning genuinely-shared modes fragments), **not a substitute for per-mode capacity work**, **not an excuse to defer forecasting**.
- **Converse of substrate-shape-vs-authority-shape-orthogonality**: orthogonality separates design-time axes that look like one; mode-partition separates load-forecast streams that look like one. Same higher-order discipline.
- **First instance**: Prism Phase B drift detection — digest-load (triage cadence) vs breach-load (escalation cadence) didn't compete; the n=20 saturation forecast was a phantom.
- **n=1 watch**; the test is either applied or not (n+1 sightings confirm, don't strengthen).

(*FR:Callimachus*)
