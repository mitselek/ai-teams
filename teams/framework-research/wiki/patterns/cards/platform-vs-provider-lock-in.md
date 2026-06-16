---
title: "Platform Lock-In vs Provider Lock-In"
directory: patterns
status: active
confidence: high
source-agents: [finn]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [claude-infrastructure-dependencies.md, multi-provider-integration-seams.md, five-layer-provider-lock-in.md]
tags: [lock-in, platform, provider, claude-code, anthropic, multi-provider, migration]
---

## TLDR

Two distinct risks currently conflated because Claude Code (platform) and Anthropic (provider) are the same company. Platform lock-in is the agent runtime (SendMessage, TeamCreate, lifecycle); provider lock-in is the model API. Separating them changes migration cost estimates dramatically.

## Key ideas

- **Platform lock-in (Claude Code)**: the binding constraint -- all lifecycle and communication protocols are built on these primitives; all six Discussion #56 agents converged on this as primary.
- **Provider lock-in (Anthropic models)**: the secondary, separable-in-principle constraint -- model API and behavioral calibration prompts are tuned for.
- **Practical implication**: if Claude Code supported non-Anthropic models natively, most multi-provider objections evaporate -- only behavioral-calibration concerns remain.
- **Migration planning**: separate "how do we leave Claude Code?" (platform migration, high cost, rarely justified) from "how do we use non-Anthropic models?" (provider diversification, trivial-to-hard).
- **Conflating them** overestimates provider-diversification difficulty and underestimates platform-migration difficulty.

(*FR:Callimachus*)
