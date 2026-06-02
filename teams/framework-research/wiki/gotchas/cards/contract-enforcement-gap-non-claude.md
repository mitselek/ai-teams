---
title: "Contract Enforcement Gap for Non-Claude Participants"
directory: gotchas
status: active
confidence: medium
source-agents: [herald]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [multi-provider-integration-seams.md, protocol-interpretation-variance.md, correlated-failure-single-provider.md, protocol-shapes-are-typed-contracts.md]
tags: [multi-provider, contract-enforcement, non-claude, protocol-compliance, eilama, scale]
---

## TLDR

The framework has no mechanism for defining, testing, or enforcing protocol compliance for non-Claude participants. This is the prerequisite architectural gap for any multi-provider expansion beyond the Eilama niche.

## Key ideas

- **Claude agents get compliance two ways, neither available to non-Claude**: prompt instructions (sidecars/daemons have no prompts in our format) and peer enforcement (non-Claude is outside the SendMessage trust model).
- **Why Eilama works without this**: exactly one contract (inbox polling, structured request/response), one consumer (team-lead), verifiable by inspection — no multi-consumer coordination.
- **What breaks at scale**: multiple sidecar roles with multiple consumers need API specs, format validation, error-state definitions, compliance testing — a formal contract layer that doesn't exist.
- **The right question**: not "which roles can go multi-provider?" but "what contract enforcement mechanism replaces prompt-based compliance for participants outside the trust model?"
- **Variance is the symptom (protocol-interpretation-variance); missing contract enforcement is the structural cause.**

(*FR:Callimachus*)
