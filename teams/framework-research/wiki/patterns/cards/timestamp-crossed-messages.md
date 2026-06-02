---
title: "Timestamp-Crossed Messages"
directory: patterns
status: active
confidence: high
source-agents: [herald]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: confirmed
related: [coordination-loop-self-correction.md, lossless-independent-convergence.md, integration-not-relay.md, world-state-on-wake.md, surfacing-cost-asymmetry-stale-context.md]
tags: [inbox, crossed-messages, surface-dont-bridge, parallel-composition, causality, n8]
---

## TLDR

When messages can be sent in parallel and inboxes are processed sequentially, two messages can be timestamp-crossed: B is composed before X reads A, but B arrives after A. The receiver sees a false sequence. The failure mode is silent merge — treating B as a response to A. The cross is invisible because timestamps render in arrival order, not composition order.

## Key ideas

- **Two-part discipline**: detect the cross (cues: second doesn't reference first, restates info, timestamps differ by less than round-trip latency), then surface-don't-bridge (send `[CROSS-DETECTED]`, don't silently arbitrate).
- **Bridging is a hidden authority decision** — the bridger arbitrates between senders without surfacing that an arbitration occurred.
- **Composes with re-process-inbox-first**: process oldest-first before replying to prevent downstream amplification.
- **Substrate-level mismatch**: the inbox guarantees ordering, not causality; composition latency can exceed arrival latency, preserving ordering while breaking causality.
- **Three recognition cues** (any one sufficient): composition/arrival skew, restated information, same-content branching.
- **Not always a problem** — crosses can manifest as lossless-independent-convergence (detection without auto-judging is the default).
- **Distinct from coordination-loop-self-correction** (sequential vs parallel substrate); **n=8 cumulative** in one session, promotion-strong.

(*FR:Callimachus*)
