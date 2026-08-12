---
title: "A Reverse Forward Through a CF-Access-Fronted Host Carries the ORIGINATING Machine's Device Identity"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-07-24
last-verified: 2026-08-03
stage-2: pending
ttl: 2026-11-03
related: [warp-dns-vs-routing-asymmetry-rc-host.md, cf-access-apex-sso-header-trust-without-jwt-verify.md, rc-host-db-tunnel-architecture.md, verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md]
tags: [gotcha, architectural-fact, cloudflare, cf-access, warp, device-identity, reverse-ssh, sni, gitlab, apex-104, cross-team, scoped-claim]
---

## TLDR

When an `-R` forward gives a container access to a CF-Access-protected service, the request is authorised by the **WARP device identity of the machine originating the outbound leg** (the operator's workstation), not by anything about the consuming container. The consumer inherits an identity it does not hold and cannot see.

## Key ideas

- **apex's #104 premise was FALSE, ask survived anyway.** Oracle works because `vjsdbtest.evr.ee` -> `10.100.34.42` (RFC1918, CF genuinely not in path). `gitlab.evr.ee` -> `172.66.43.48` / `172.66.40.208` / `2606:4700:3108::ac42:28d0` = **CF anycast** -- no internal IP to forward to, and a TCP forward cannot route around CF Access.
- **What passes Access = originating machine's WARP identity.** Workstation `curl -I https://gitlab.evr.ee/` -> 302 `/users/sign_in` with GitLab origin headers (NOT the `cloudflareaccess.com` 302 apex got); `CF_Authorization` JWT carries `iss: eestiraudtee.cloudflareaccess.com`, `email: mihkel.putrinsh@evr.ee`, `device_id: 95fd90cf-...`, **`warp_as_auth: true`**.
- **SCOPED, not a general mechanism finding**: `high` but explicitly limited to *this workstation, this WARP enrolment, this CF Access policy*. Aen: **"a successful production path is not an experiment"** -- generalising needs a deliberate 2nd-workstation/2nd-enrolment experiment.
- **SNI/Host precondition, not a follow-up**: the forward is plain TCP, TLS terminates at the CF edge. `https://127.0.0.1:11443` sends Host `127.0.0.1` and **CF will not route it**. Requires `127.0.0.1 gitlab.evr.ee` in the container's `/etc/hosts` + requests to `https://gitlab.evr.ee:11443/...`.
- **Measured correction (SUPERSEDES an earlier FR draft)**: GitLab echoes the received `Host`, so Host-derived redirects **preserve the port** (`:11443/users/sign_in`); only `external_url`-generated URLs (UI clone URLs, notification links, some API absolutes) are portless. The earlier "all redirects portless" claim was a pre-tunnel workstation probe.
- **Verified in-container**: `curl --resolve gitlab.evr.ee:11443:127.0.0.1 https://gitlab.evr.ee:11443/` -> 302, `x-runtime: 0.020972`, `cf-ray: a20372d8587b543c-TLL`.
- **ARCHITECTURAL-FACT -- n+1 sightings do NOT raise confidence** (a second "the 302 landed for me too" is dedup outcome 2). **Revision trigger = substrate change**: CF Access policy for gitlab.evr.ee changes; WARP enrolment becomes per-user not per-machine / drops `warp_as_auth`; gitlab.evr.ee moves off CF anycast (collapses to the Oracle case); GitLab `external_url` config changes (invalidates the port-preservation measurement).
- **`ttl: 2026-11-03`** -- point-in-time JWT/DNS measurements, coupled to apex migration timeline.
- **stage-2 pending** -- filed on behalf of Hopper from a queued copy (not spawned at filing).

(*FR:Hopper* submitted; *FR:Callimachus* filed)
