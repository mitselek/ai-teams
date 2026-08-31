---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/docs/operations-log-2026-08.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
source-commits: []
source-issues: []
ttl: 2026-11-30
related:
  - dual-team-dir-ambiguity.md
  - no-teamdelete-stale-session-dirs-accumulate.md
  - cold-start-discovery-false-negative-config-before-sessions-json.md
  - sessions-pid-json-not-gc-status-idle-lingers.md
  - ../references/teams-substrate-2.1.179-implicit-teams.md
---

# For `--bg` Sessions the Registry `sessionId` Is the jobId -- and Does NOT Match the Team Dir Slug

**Gotcha (team-wide, observation-based, high confidence, CLI 2.1.251).**

The 2.1.179 substrate sheet's rule — *derive the `session-<id>` team dir slug from the first 8 hex of `sessionId`* — is **correct for interactive sessions and wrong for `--bg` sessions.**

**For a `--bg` session the team dir derives from `leadSessionId`, while the registry's `sessionId` field holds the jobId.** The two are different values, so slug-derivation from `sessionId` resolves a directory that does not exist.

## Measurements -- n=3 bg, n=2 interactive

| Session | Team dir | `leadSessionId` | registry `sessionId` |
|---|---|---|---|
| bg throwaway #1 | `session-32e8785f` | `32e8785f-…` | `d9e036f4-…` (= jobId) |
| bg throwaway #2 | `session-4282da57` | `4282da57-…` | `2488c58a-…` (= jobId) |
| bg #3 | `session-d1849d70` | `d1849d70-…` | `ce0fe144-…` (= jobId) |

**Interactive sessions: the two agree** (n=2, `b9269601` and `2aedf13c`; separately confirmed on three interactive sessions the same day).

## Why it matters -- and the honest scope

**It lands directly on the courier resolver's `discover_by_session_pid`, which derives the slug that way.** Binding it to a `--bg` session's pid **would resolve a dir that does not exist.**

**Scope, in the submitter's own words: "Latent (FR binds interactive), real edge."** FR's own path binds interactive sessions, so nothing is broken today. This is a correctness bound on the resolver, not a live defect — file it as the reason the resolver must not be pointed at a bg session, not as an outage.

## What this does NOT explain

The slug mismatch was **tested as a candidate explanation for the failed external-write wake and RULED OUT**: a discriminating second write to the registry-`sessionId` slug path (`session-d9e036f4/inboxes/team-lead.json`) **also went undelivered.** Recorded here because the mismatch is an inviting explanation for delivery failures and is not the one.

*(This is the elimination that [`an-eliminated-confound-is-not-an-identified-cause.md`](an-eliminated-confound-is-not-an-identified-cause.md) is about — a clean elimination, correctly reported as an elimination rather than as an identification.)*

## Naming caution

**The submitter never calls this a "jobId bug" and it should not be filed under that name.** His phrasing is *"the registry `sessionId` IS the jobId"*. It is a naming/derivation mismatch, not a defect in the harness.

## Provenance

Submitted by Hopper via Protocol A 2026-08-31 as a new entry (his G2 probe work, branch-2 routing). **The submission text did not survive the session** — see [`../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md`](../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md). **This entry is reconstructed from the operations log and his scratchpad, in his own words**, with all measurements quoted from the log rather than restated.

**`stage-2: pending`** — librarian-authored on a reconstructed candidate, which is a weaker basis than the usual relayed candidate. **Fail-closed until Hopper reads it back**; an author-submitted confirmation lands on top of this without a rewrite.

(*FR:Hopper* measured and submitted; *FR:Callimachus* reconstructed, classified and filed)
