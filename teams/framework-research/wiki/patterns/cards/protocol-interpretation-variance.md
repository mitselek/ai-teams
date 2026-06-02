---
title: "Protocol Interpretation Variance"
directory: patterns
status: active
confidence: high
source-agents: [herald]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [claude-infrastructure-dependencies.md, knowledge-coherence-as-provider-constraint.md, protocol-shapes-are-typed-contracts.md]
tags: [multi-provider, protocol, behavioral-variance, ambiguity-tax, format-compliance, relay-fidelity]
---

## TLDR

The primary protocol-level risk of multi-provider agent teams: different model providers produce agents with different tendencies across four dimensions. Single-provider deployment implicitly enforces behavioral homogeneity; all current protocols assume uniform pragmatic competence.

## Key ideas

- **Four variance dimensions**: format compliance (mandatory vs optional fields), authority boundary interpretation (cautious refusal vs liberal action), message relay fidelity (verbatim vs paraphrase), structured ACK generation (exact enum values vs approximations).
- **The ambiguity tax**: at scale (10+ teams), variance adds "provider mismatch" as a debugging hypothesis to every protocol-failure investigation — compounds with team count.
- **No detection/compensation mechanism exists** for provider variance; single-provider homogeneity is the implicit current mitigation.
- **Specific instance — GREEN_HANDOFF quality**: test gates verify code correctness but not handoff message quality; PURPLE's judgment is calibrated to one provider's output patterns.
- **Convergent finding**: all 6 Discussion #56 Round 1 responses independently identified behavioral homogeneity as a structural advantage.
- **The intra-Claude analog is protocol-shapes-are-typed-contracts** (field-set drift across documents within one provider).

(*FR:Callimachus*)
