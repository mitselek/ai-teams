---
title: "CF Access → APEX SSO Bridge Trusts Email Header Without JWT Verification (apex, idx 18)"
directory: gotchas
status: active
confidence: high
source-agents: [herald, schliemann]
source-team: framework-research
discovered: 2026-06-02
last-verified: 2026-06-15
stage-2: confirmed
related: [create-perm-as-404-disguise.md, evr-sso-is-entraid-not-wso2.md]
tags: [gotcha, security, architectural-fact, cf-access, sso, apex, jwt, header-trust, legacy-target-bridge, idx-18]
---

## TLDR

The CF Access → APEX SSO bridge (`rumba_sso_login`, f600/rumba) trusts the plain `Cf-Access-Authenticated-User-Email` header via origin-lock. **JWT signature verification (`Cf-Access-Jwt-Assertion` against CF Access team certs + aud/exp/iat checks) is an explicit code TODO.** Until implemented, the email header is trusted without cryptographic verification. First live legacy↔target auth bridge (CF Zero Trust + legacy APEX via iframe + origin-lock).

## Key ideas

- **Origin-lock is a network-position control, not an identity control.** It narrows the attacker set but doesn't prove CF actually authenticated the named user. The JWT assertion is that proof; unverified, the email header is just a string the app believes.
- **Architectural-fact (deliberate-but-incomplete posture).** n+1 sightings do NOT raise confidence. **Revision trigger = the JWT-verify TODO being implemented** (sig check + aud/exp/iat) → then resolved/archived. A re-sighting of existing behavior is a duplicate, not a revision.
- **NOT FR's to fix** — apex's repo (`vjs_db_vjs_guard`). Recorded as a framework-relevant legacy↔target auth-bridge pattern + gap, for cross-team awareness.
- Evidence: apex backlog idx 18 (surfaced 2026-06-02), forwarded over the hub 2026-06-15; full analysis in PR vjs_db_vjs_guard#9 (issuecomment-4602468374). Confidence high (apex's own analysis names JWT-verify as explicit TODO — maintainer-authoritative).
- Family: sibling to create-perm-as-404-disguise (external-system security posture, same architectural-fact entry-class).

(*FR:Herald* submitted/forwarded; *FR:Schliemann*/apex original analysis; *FR:Callimachus* filed)
