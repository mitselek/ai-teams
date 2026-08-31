---
title: "For `--bg` Sessions the Registry `sessionId` Is the jobId -- and Does NOT Match the Team Dir Slug"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
ttl: 2026-11-30
related: [dual-team-dir-ambiguity.md, no-teamdelete-stale-session-dirs-accumulate.md, cold-start-discovery-false-negative-config-before-sessions-json.md, sessions-pid-json-not-gc-status-idle-lingers.md, ../references/teams-substrate-2.1.179-implicit-teams.md]
tags: [gotcha, substrate, 2.1.251, bg-session, session-slug, team-dir, resolver, jobId, leadSessionId, latent-edge]
---

## TLDR

The 2.1.179 sheet's rule *derive the `session-<id>` slug from the first 8 hex of `sessionId`* is **correct for interactive sessions and WRONG for `--bg` sessions.** For a bg session **the team dir derives from `leadSessionId`, while the registry `sessionId` holds the jobId** — different values, so slug-derivation from `sessionId` **resolves a directory that does not exist.**

## Key ideas

- **Measured n=3 bg / n=2 interactive (CLI 2.1.251):**
  - `session-32e8785f` ← `leadSessionId 32e8785f-…`, registry `sessionId d9e036f4-…` (= jobId)
  - `session-4282da57` ← `leadSessionId 4282da57-…`, registry `sessionId 2488c58a-…` (= jobId)
  - `session-d1849d70` ← `leadSessionId d1849d70-…`, registry `sessionId ce0fe144-…` (= jobId)
  - **Interactive: the two AGREE** (`b9269601`, `2aedf13c`; separately confirmed on three interactive sessions the same day).
- **Lands directly on the courier resolver's `discover_by_session_pid`, which derives the slug that way.** Binding it to a bg session's pid **would resolve a dir that does not exist.**
- **[SCOPE, submitter's own words] "Latent (FR binds interactive), real edge."** FR's path binds interactive, so **nothing is broken today.** File as a **correctness bound on the resolver** — the reason it must not be pointed at a bg session — **not as an outage.**
- **[WHAT IT DOES NOT EXPLAIN] Tested as the explanation for the failed external-write wake and RULED OUT:** a discriminating second write to the registry-`sessionId` slug path (`session-d9e036f4/inboxes/team-lead.json`) **also went undelivered.** Recorded because the mismatch is an **inviting** explanation for delivery failures and is not the one. A clean elimination, correctly reported as an elimination — cf. `an-eliminated-confound-is-not-an-identified-cause`.
- **[NAMING CAUTION] The submitter never calls this a "jobId bug"; do not file it under that name.** His phrasing: *"the registry `sessionId` IS the jobId."* A naming/derivation mismatch, **not a harness defect.**
- **stage-2 PENDING, and on a weaker basis than usual** — the submission text did not survive the session (see `protocol-a-has-no-durable-store...`), so this is **reconstructed from the ops log + scratchpad in his own words**, measurements quoted not restated. **Fail-closed until Hopper reads it back**; an author-submitted `confirmed` lands on top without a rewrite.

(*FR:Hopper* measured and submitted; *FR:Callimachus* reconstructed, classified and filed)
