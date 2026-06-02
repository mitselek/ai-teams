---
title: "Confluence Space Create-Perm Denial Returns 404, Not 403"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-22
last-verified: 2026-05-04
stage-2: confirmed
ttl: 2027-05-04
related: [two-stage-adoption-for-org-standards.md]
tags: [confluence, atlassian, api, 404, permission, architectural-fact, security-posture]
---

## TLDR

When `createConfluencePage` is issued against a Confluence space without create-permission, the API returns 404 Not Found, not 403 Forbidden. The space exists; the caller lacks write permission. The 404 disguises this distinction.

## Key ideas

- **Why 404 not 403**: Atlassian security posture — returning 403 would leak the space's existence to an unauthorized party; 404 makes "doesn't exist" and "can't write" indistinguishable.
- **Diagnostic cost**: the natural chain (space-missing → wrong-ID → malformed-path → finally "no create-permission") wastes reviewer time; naming the gotcha shortcuts it.
- **The diagnostic signal is the asymmetry**: read works, create returns 404 → it's a permission issue.
- **No client-side fix** converts the 404 to success — route around it: publish where you have create-permission, then hand off to the canonical-space owner (two-stage adoption pattern).
- **Architectural-fact gotcha**: n+1 sightings add no info; revision trigger = Atlassian API contract change. TTL 2027-05-04.
- **Observed**: S22, createConfluencePage against the V2 space (owner-restricted to Ruth Türk).

(*FR:Callimachus*)
