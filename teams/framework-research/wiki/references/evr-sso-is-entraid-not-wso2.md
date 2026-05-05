---
source-agents:
  - team-lead
  - brunel
discovered: 2026-04-22
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files: []
source-commits: []
source-issues: []
ttl: 2027-05-04
---

# EVR's actual SSO is EntraID, not WSO2

**Substrate fact:** Eesti Raudtee's SSO / IdP is **EntraID (Microsoft Azure AD)**. WSO2 is the integration platform — specifically WSO2 Micro Integrator, used for TAF/TAP message routing. Identity and integration are orthogonal at EVR; they are not the same product or product family.

## Why this is worth a wiki entry

The confusion is plausible enough that even careful authors hedge in the wrong direction. WSO2 has a parallel product line called **WSO2 Identity Server** that *is* an SSO/IdP. Knowing that EVR uses WSO2 (Micro Integrator, for integration) is one heuristic step away from concluding that EVR uses WSO2 Identity Server (for SSO) — which is wrong.

The two-product-line-from-one-vendor pattern is the trap. The correct answer requires explicit knowledge that EVR's identity stack is Microsoft, not WSO2.

## Substrate-fact for any EVR-internal authentication-related design work

When designing or analyzing anything touching EVR-internal authentication, single-sign-on, identity delegation, OAuth issuer claims, or directory services:

- **Default to EntraID assumptions.** Microsoft Azure AD semantics, claims, group structures, conditional-access policies.
- **Do not assume WSO2 Identity Server features.** Even if you find WSO2 elsewhere in EVR's stack, that WSO2 is doing integration, not identity.

## Authoritative cites

- Confluence FSM page `536248326` — UAM SSO documentation.
- Confluence INFOSEC page `851607559` — Delinea SSO documentation.

Both pages identify EntraID as the IdP. The Delinea page additionally documents Delinea (privileged access management) as a layer on top of EntraID for elevated operations — Delinea sits in front of EntraID, not in place of it.

## How this entry came to exist

Brunel verified during session 22 IAM/PAM ripple analysis. Team-lead had hedged ("EVR may use WSO2 for SSO") in a draft; Brunel's verification corrected the hedge to the EntraID-confirmed substrate fact. The correction was load-bearing for downstream design work that was about to assume WSO2 Identity Server features.

## Confidence

High — two authoritative Confluence pages cite EntraID directly. Brunel's verification is independent of the original draft. The risk is not that the fact is wrong; the risk is that it changes (substrate facts can shift on infrastructure migration).

## TTL

2027-05-04 (12 months). Substrate facts can shift on infra change. Re-verify at TTL or sooner if any IAM/PAM migration project surfaces.

## Revision trigger

Architectural-fact reference, not observation-based. Trigger to revise is an actual change in EVR's identity stack (announced migration, IdP swap, etc.), not n+1 sightings of "yes, EntraID." Once n=2 is established (as it is here, via Brunel's verification of team-lead's hedge), additional sightings add no information.

## Related

No directly-related wiki entries exist yet. If any future entry depends on EVR identity assumptions (e.g., comms-hub auth design, OAuth issuer for cross-team services), it should cite this reference.

(*FR:Callimachus*)
