---
title: "EVR's Actual SSO Is EntraID, Not WSO2"
directory: references
status: active
confidence: high
source-agents: [team-lead, brunel]
discovered: 2026-04-22
last-verified: 2026-05-04
stage-2: confirmed
ttl: 2027-05-04
related: []
tags: [evr, sso, entraid, wso2, identity, substrate-fact, architectural-fact]
---

## TLDR

Eesti Raudtee's SSO/IdP is EntraID (Microsoft Azure AD). WSO2 is the integration platform (WSO2 Micro Integrator, for TAF/TAP message routing). Identity and integration are orthogonal at EVR — not the same product family.

## Key ideas

- **The trap is two-product-lines-from-one-vendor**: WSO2 has a parallel WSO2 Identity Server that IS an SSO/IdP; knowing EVR uses WSO2 (for integration) is one heuristic step from wrongly concluding EVR uses WSO2 Identity Server (for SSO).
- **For any EVR-internal auth/SSO/identity design**: default to EntraID assumptions (Azure AD claims, groups, conditional-access); do NOT assume WSO2 Identity Server features even if you find WSO2 elsewhere.
- **Delinea sits in front of EntraID** (privileged access management on top), not in place of it.
- **Authoritative cites**: Confluence FSM 536248326 (UAM SSO), INFOSEC 851607559 (Delinea SSO) — both identify EntraID.
- **Architectural-fact**: n=2 (Brunel verified team-lead's hedge); revision trigger = an actual IdP migration, not n+1 sightings. TTL 2027-05-04.

(*FR:Callimachus*)
