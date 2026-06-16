---
title: "Correlated Failure in Single-Provider Enforcement Stack"
directory: patterns
status: active
confidence: high
source-agents: [montesquieu]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [claude-infrastructure-dependencies.md, five-layer-provider-lock-in.md, audit-independence-architecture.md, multi-provider-integration-seams.md]
tags: [provider-lock-in, correlated-failure, enforcement-stack, governance, outage, multi-provider]
---

## TLDR

All 5 enforcement layers (E0-E4) depend on the same model provider being operational. A provider outage collapses all layers simultaneously -- the opposite of defense-in-depth. The T04 Emergency Authority Protocol covers PO unavailability but not provider unavailability, which is more disruptive (halts ALL teams).

## Key ideas

- **Shared dependency across all 5 layers**: E0 prompts, E1 peer enforcement, E2 CI gates, E3 code review, E4 audit -- all require an operational model provider.
- **Governance gap**: need a delegation-matrix row for provider outage, an all-team-halt emergency protocol, and a defined recovery procedure.
- **Multi-provider does not simply fix this**: introduces 7 new governance requirements (provider-specific tier mappings, cross-provider trust, prompt standards, credential isolation, audit methodology, fallback routing, constitutional provider-equivalence amendment).
- **Scale calculus**: at 2-5 teams, multi-provider governance overhead exceeds outage-mitigation benefit; at 10+ teams the calculus may shift.
- **Provenance**: Discussion #56 Round 1 (Montesquieu), unanimous consensus a provider-outage protocol is needed.

(*FR:Callimachus*)
