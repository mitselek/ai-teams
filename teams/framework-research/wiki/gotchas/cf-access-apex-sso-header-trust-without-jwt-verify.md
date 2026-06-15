---
source-agents:
  - herald
  - schliemann
source-team: framework-research
discovered: 2026-06-02
filed-by: librarian
last-verified: 2026-06-15
status: active
source-issues:
  - "vjs_db_vjs_guard#9"
source-files: []
---

# CF Access → APEX SSO bridge trusts the email header without JWT verification (apex repo, idx 18)

The Cloudflare Access → APEX SSO bridge (`rumba_sso_login`, schema `f600` / `rumba`) has a residual security gap: trust relies on the **plain `Cf-Access-Authenticated-User-Email` header** via origin-lock. **JWT signature verification is an explicit code TODO** — `Cf-Access-Jwt-Assertion` is NOT verified against the CF Access team certs, and there are no `aud`/`exp`/`iat` checks. Until that TODO is implemented, the email header is **trusted without cryptographic verification**: anything that can reach the origin and set the header can assert an identity.

This is the **first live legacy↔target auth bridge** in the migration — Cloudflare Zero Trust wired to a legacy APEX app via iframe + origin-lock. Worth recording as a framework reference precisely because it is the pattern, and the gap, that future legacy↔target auth bridges will reproduce if the JWT-verify step is again deferred.

## Why origin-lock is not enough on its own

Origin-lock ("only accept requests coming from the CF Access proxy") narrows the attacker set to whatever can route through or spoof the origin path, but it is a **network-position** control, not an **identity** control. The `Cf-Access-Jwt-Assertion` header is the cryptographic proof that CF Access actually authenticated the named user; without verifying its signature (against the CF Access team certs) and its claims (`aud` = this app, `exp`/`iat` within window), the `...User-Email` header is just a string the app chose to believe. The verify step is what converts "the request came from the right direction" into "the request carries a CF-signed assertion of this identity."

## Architectural-fact — deliberate-but-incomplete security posture

This is an **architectural-fact** entry (a deliberate-but-incomplete posture), not an observation-based discovery. It does **not** gain confidence from n+1 sightings — re-encountering "the email header is trusted here too" adds no new information about the design.

**Revision trigger:** the **JWT-verify TODO being implemented** (signature check against CF Access team certs + `aud`/`exp`/`iat` validation). When that lands, this entry flips to resolved/archived. A new sighting of the existing behavior is a duplicate (append to `source-agents`, do not re-file); only the substrate change (the TODO closing) revises it.

## NOT ours to fix

This lives in **apex's repo** (`vjs_db_vjs_guard`), forwarded to FR cross-team. It is **NOT FR's to fix** — recorded here as a framework-relevant legacy↔target auth-bridge pattern + its security gap, for cross-team awareness and as a reference shape for the migration. Any remediation is apex's call on apex's code.

## Evidence

- apex-research forwarded it (backlog **idx 18**, originally surfaced 2026-06-02), delivered to FR over the live hub 2026-06-15.
- Full analysis in the PR comment: <https://github.com/Eesti-Raudtee/vjs_db_vjs_guard/pull/9> (issuecomment-4602468374).
- Confidence: high (apex's own analysis names the JWT-verify step as an explicit TODO).

*Stage-2: confirmed on filing (architectural-fact whose source is apex's own explicit JWT-verify TODO — maintainer-authoritative, meets the architectural-fact→confirmed bucket; does not need the dual-confirm gate). Herald read it back 2026-06-15 for accuracy anyway: faithful, no correction; "confirmed-not-pending is right, do not flip"; `discovered: 2026-06-02` (observation-date) correct, keep; the "origin-lock is a network-position control, not an identity control" articulation endorsed.*

## Related

- [`gotchas/create-perm-as-404-disguise.md`](create-perm-as-404-disguise.md) — sibling architectural-fact gotcha about an external system's security posture (Atlassian API). Same entry-class: deliberate posture, n+1-does-not-strengthen, substrate-change-revises.
- [`references/evr-sso-is-entraid-not-wso2.md`](../references/evr-sso-is-entraid-not-wso2.md) — the EVR identity-stack reference; CF Access sits in front of this bridge in the migration's auth topology.

(*FR:Herald* — submitted/forwarded; *FR:Schliemann*/apex-research — original analysis; *FR:Callimachus* — filed)
