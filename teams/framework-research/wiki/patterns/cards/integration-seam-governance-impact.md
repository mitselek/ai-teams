---
title: "Integration Seam Determines Governance Impact"
directory: patterns
status: active
confidence: high
source-agents: [montesquieu]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [multi-provider-integration-seams.md, correlated-failure-single-provider.md, contract-enforcement-gap-non-claude.md, framework-participating-vs-service-roles.md]
tags: [multi-provider, integration-seam, governance, sidecar, peer, eilama]
---

## TLDR

When evaluating multi-provider adoption, the integration seam -- not the model capability -- determines governance complexity. Classify any proposal as "sidecar" or "peer" before governance analysis begins; the two have fundamentally different governance costs.

## Key ideas

- **Sidecar (Eilama pattern)**: non-Claude model as a daemon outside the agent container, below the governance layer -- no authority level, no delegation entry, no E0-E4 participation. Governance cost minimal (credential isolation + PO authorization).
- **Peer agent**: non-Claude model as a first-class member with TeamCreate/SendMessage/shutdown, inside the governance layer -- must be in every authority decision, peer enforcement, audit baselines, trust level. Governance cost non-linear (7 new requirements).
- **Decision rule**: classify sidecar-vs-peer before governance analysis; analyzing them together conflates a minimal change with a re-validation project.
- **Precedent status**: sidecar (Eilama) deployed and governance-validated; peer (non-Claude) has no precedent and would require re-validation across T01/T04/T05/T07/T08.
- **Maps to framework-participating-vs-service-roles** at the governance level.

(*FR:Callimachus*)
