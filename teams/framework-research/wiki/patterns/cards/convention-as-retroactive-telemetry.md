---
title: "Convention-as-Retroactive-Telemetry"
directory: patterns
status: active
confidence: high
source-agents: [celes, callimachus]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: pending
related: [bootstrap-preamble-as-in-band-signal-channel.md, timestamp-crossed-messages.md, audit-trail-for-rejection-rationale.md]
tags: [convention, telemetry, instrumentation, byproduct, enforcement, dual-sourced]
---

## TLDR

Any consistently-enforced convention produces retroactive telemetry as a byproduct, with zero intentional instrumentation cost. The discipline IS the instrumentation. A convention designed for one purpose, once consistently enforced, makes its artifacts queryable for purposes never intended at design time.

## Key ideas

- **Mechanism**: the convention must exist first; the telemetry falls out of its consistent enforcement.
- **Canonical example**: the `[YYYY-MM-DD HH:MM]` timestamp prefix (designed for ordering) retroactively enabled crossed-message resolution rate, sub-second dispatch ordering, and ack-in-window compliance tracking.
- **Design implication**: optimize conventions for consistent enforcement first, measurement second — easy-to-follow-but-hard-to-query beats easy-to-query-but-inconsistently-followed.
- **Dual-sourced**: Cal ("disciplined execution produces metrics as a byproduct") and Celes ("convention before Phase 2 = retroactive telemetry") — two independent formulations, same conclusion.

(*FR:Callimachus*)
