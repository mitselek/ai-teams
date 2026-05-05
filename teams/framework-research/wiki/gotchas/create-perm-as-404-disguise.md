---
source-agents:
  - team-lead
discovered: 2026-04-22
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files: []
source-commits: []
source-issues: []
ttl: 2027-05-04
---

# Confluence space create-perm denial returns 404, not 403

When a `createConfluencePage` call (Atlassian MCP, REST API, or any client) is issued against a Confluence space without create-permission, the API returns **404 Not Found**, not 403 Forbidden. The space exists; the caller simply lacks permission to write to it. The 404 disguises this distinction.

## Why 404 instead of 403

Almost certainly an Atlassian security best-practice: returning 403 would leak the existence of the space to an unauthorized party. By returning 404, Atlassian makes "space does not exist" and "you cannot write to this space" indistinguishable from the caller's perspective. Authorized parties see the right answer; unauthorized parties cannot probe for existence.

This is a defensible design choice, but it is a defect-disguising failure mode for legitimate callers who *do* know the space exists (because they read it earlier) but lack write permission specifically.

## Symptom

You attempt `createConfluencePage` against a known-existing space. The API returns 404. The natural diagnostic chain is:

1. "Space does not exist" — but you read from the space minutes ago, so this is wrong.
2. "Space ID is wrong" — verify the ID, it is correct.
3. "Path is malformed" — try several variations, all return 404.
4. **Eventually**: "I do not have create-permission" — and the 404 was actually a 403 in disguise.

The cost is reviewer-time spent on (1)–(3) before reaching (4). Naming the gotcha shortcuts this.

## Affects

Any team or workflow that publishes from a non-owner account into a restricted Confluence space:

- Atlassian MCP `createConfluencePage` from Claude agents.
- Direct REST API calls from scripts or CI.
- Library wrappers around Atlassian APIs that do not pre-check permissions.

The gotcha is in Atlassian's API contract, not in any specific client. Switching clients does not fix it.

## Workaround

Do not try to "force" the create — there is no client-side fix that converts a 404 into success. Instead, route around the permission constraint:

1. Confirm via direct read that the space exists (if you have read permission). The asymmetry — read works, create returns 404 — is the diagnostic signal.
2. Publish in a space where you do have create-permission (e.g., the PO's permitted space).
3. Hand off to the canonical-space owner per the [`two-stage-adoption-for-org-standards.md`](../process/two-stage-adoption-for-org-standards.md) pattern (Stage 0 in your space, Stage 1 escalation issue, Stage 2 owner moves the page).

## Specifically observed

Session 22, attempting `createConfluencePage` against the V2 Confluence space — create-permission is restricted to the space owner (Ruth Türk). Multiple attempts returned 404. The two-stage adoption pattern was the resulting workaround.

## Confidence

High — single direct observation but the failure mode is unambiguous and matches Atlassian's documented security posture for cross-tenant resource probing. The "404 disguises 403" pattern is well-known in API security; the empirical observation just confirms Atlassian Confluence implements it.

## Revision trigger

This is an architectural-fact gotcha (per [Atlassian API design intent](#why-404-instead-of-403)), not an observation-based one. The trigger to revise is a *change in Atlassian's API contract* (e.g., they introduce explicit 403 for permission denial, or a separate "permission probe" endpoint), not additional sightings of the same behavior. n+1 sightings add no information.

## TTL

2027-05-04 (12 months) — substrate-fact, but Atlassian could change the API contract. Re-verify behavior at TTL or sooner if a write-permission story changes underneath us.

## Related

- [`two-stage-adoption-for-org-standards.md`](../process/two-stage-adoption-for-org-standards.md) — the workflow pattern that the gotcha makes necessary. Knowing the gotcha tells you when the two-stage pattern applies.

(*FR:Callimachus*)
