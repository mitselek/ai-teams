---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-07-24
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - apex-migration-research/.claude/bin/autossh-db-tunnels.sh
  - designs/deployed/apex-research/container/entrypoint-apex.sh
source-commits: []
source-issues:
  - 104
ttl: 2026-11-03
related:
  - warp-cgnat-address-misread-as-tailscale.md
  - warp-dns-vs-routing-asymmetry-rc-host.md
  - cf-access-apex-sso-header-trust-without-jwt-verify.md
  - rc-host-db-tunnel-architecture.md
  - verification-narrower-than-it-appears.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
---

# A Reverse Forward Through a CF-Access-Fronted Host Carries the ORIGINATING Machine's Device Identity, Not the Consumer's

**Gotcha (cross-team, architectural-fact).** When a reverse-SSH (`-R`) forward is used to give a container access to a Cloudflare-Access-protected service, the request is authorised by the **WARP device identity of the machine that originates the outbound leg** -- the operator's workstation -- not by anything about the consuming container. The consumer inherits an identity it does not hold and cannot see.

## The premise that was false, and why the request survived anyway

apex's stated premise for GH #104 was **wrong**, but the ask survived for a different reason.

- **Oracle works because CF is genuinely not in the path.** `vjsdbtest.evr.ee` -> `10.100.34.42` (internal RFC1918). A plain TCP forward is sufficient.
- **GitLab is different.** `gitlab.evr.ee` from this workstation -> `172.66.43.48` / `172.66.40.208` / `2606:4700:3108::ac42:28d0` = **Cloudflare anycast**. GitLab is CF-fronted; there is **no internal IP to forward to**, and a TCP forward cannot route around CF Access.
- **What actually passes Access is the WARP device identity of the originating machine.** `curl -I https://gitlab.evr.ee/` from the workstation returns **302 -> /users/sign_in** with GitLab origin headers (`x-gitlab-meta`, `x-request-id`, `x-runtime`) -- *not* the `cloudflareaccess.com` 302 apex received -- and sets `CF_Authorization`, whose JWT carries `iss: eestiraudtee.cloudflareaccess.com`, `email: mihkel.putrinsh@evr.ee`, `device_id: 95fd90cf-...`, and **`warp_as_auth: true`**.

## Scope -- this is NOT a general mechanism finding

The claim "WARP device identity carries through an ssh `-R` leg" is **`high` confidence but explicitly scoped to: this workstation, this WARP enrolment, this CF Access policy.**

Per Aen (S66 16:52): **a successful production path is not an experiment.** The 302 landing does not license generalisation. Generalising would need a deliberate experiment across a second workstation and a second enrolment -- the same standard [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) applies to its own `-R` mechanism sub-claim.

**Evidence at that scope (all directly measured):** from inside the apex container, `curl --resolve gitlab.evr.ee:11443:127.0.0.1 https://gitlab.evr.ee:11443/` -> `302 -> https://gitlab.evr.ee:11443/users/sign_in`, origin headers `x-gitlab-meta` / `x-request-id` / `x-runtime: 0.020972`, `set-cookie: CF_Authorization=<JWT>`, `cf-ray: a20372d8587b543c-TLL`.

## Precondition the consumer must not skip -- SNI/Host

**The forward is plain TCP and TLS terminates at the CF edge.** Connecting to `https://127.0.0.1:11443` sends SNI and `Host: 127.0.0.1`, and **CF will not route it.**

`127.0.0.1 gitlab.evr.ee` in the container's `/etc/hosts` plus requests to `https://gitlab.evr.ee:11443/...` is a **precondition, not a follow-up.** This was recorded because apex's #104 plan had not accounted for it.

## Measured correction -- redirects PRESERVE the port (supersedes an earlier FR draft)

GitLab echoes the received `Host`, so **Host-derived redirects preserve the port** (`:11443/users/sign_in`). Only `external_url`-generated URLs -- UI clone URLs, notification email links, some API absolutes -- are portless.

**An earlier FR draft claimed all redirects were portless. That claim was a workstation-side probe taken before the tunnel existed and is SUPERSEDED by the measurement above.**

## Revision trigger

Architectural-fact entry: it records **deliberate design** -- Cloudflare's WARP-as-auth device-identity posture and EVR's CF Access policy selection. **n+1 sightings do NOT raise confidence**; a second report of "the 302 landed for me too" is a duplicate (dedup outcome 2 -- append to `source-agents`), not new information about the substrate.

Revise on a **substrate change**, specifically any of:

- EVR's CF Access policy for `gitlab.evr.ee` changing (device-posture requirement added or removed, or the app's policy narrowed).
- WARP enrolment model changing (per-user instead of per-machine interception, or `warp_as_auth` no longer asserted).
- `gitlab.evr.ee` moving off CF anycast to an internal address (which would collapse this to the Oracle case).
- GitLab's `external_url` configuration changing, which would invalidate the port-preservation measurement above.

Also carries **`ttl: 2026-11-03`** -- the measured JWT/DNS observations are point-in-time and coupled to the apex migration timeline. Re-verify at expiry or at the next apex infra milestone, whichever is first.

## Evidence

S66, GH #104. Measured 2026-07-24 from the operator workstation and from inside the apex-research container. See also `references/rc-host-db-tunnel-architecture.md` for the tunnel shape this rides on.

## Provenance note

**Filed on behalf of Hopper from a queued copy** -- Hopper was not spawned in the filing session (2026-08-03 batch). Confidence was split at submission time and **resolved to `high` at S66 17:00 when the 302 landed**, with the scope restriction written into the entry body as an explicit condition of that promotion. `stage-2: pending` -- filed-on-behalf, not author-is-filer; advances on his read-back.

## Stage-2 read-back -- 2026-08-28, Hopper: CONFIRM with a scope note (`pending` -> `confirmed`)

Accurate as filed, including the split confidence resolving to `high` at S66 17:00 and the scope restriction in the body. Port-preservation correction and the SNI/Host precondition both right as measured. `ttl: 2026-11-03` still in the future; nothing observed 2026-08-28 invalidates the measurements.

**Cross-link confirmed by the submitter:** this entry touches the ground now held by [`warp-cgnat-address-misread-as-tailscale.md`](warp-cgnat-address-misread-as-tailscale.md) -- **EVR hosts are on Cloudflare WARP, never a tailnet**, and there is a PO standing rule (GH #109, relayed 2026-08-28 13:52) forbidding "tailnet"/"tailscale" in writing about any EVR host; the diagnostic is `warp-cli status`. Hopper scrubbed his own two artifacts the same day: 8 hits, 4 corrected, **4 deliberately kept** -- two as the historical record of the original 2026-08-03 correction (which explains the `100.64/10` CGNAT shared-range trap), one as a denial, one as the `tailscale not installed` probe result. **He corrected his scratchpad in place but the ops log BY APPEND**, on the ground that rewriting closed entries to satisfy a scrub would break the audit surface -- the same posture this wiki takes on historical records.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
