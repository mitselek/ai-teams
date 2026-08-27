---
title: "Teams Substrate -- Empirical Sheet (CLI 2.1.178/2.1.179, implicit teams)"
directory: references
status: active
confidence: high
source-agents: [hopper, brunel]
discovered: 2026-06-17
last-verified: 2026-06-17
stage-2: confirmed
ttl: 2026-09-17
related: [../gotchas/session-wake-on-inbox-write-two-unstamped-claims-contradict.md, ../gotchas/precondition-without-an-owner-is-no-precondition.md, inbox-substrate-properties-2.1.170.md, inbox-file-write-as-wake-mechanism.md, members-array-edit-honored-mid-session.md, drain-on-delivery-datapoint-2.1.173.md, courier-must-runtime-discover-team-name.md, teamcreate-in-memory-leadership-survives-clear.md, stationmaster-post-office-model.md]
tags: [substrate-fact, inbox, harness-substrate, ghost-bridge, 2.1.178, 2.1.179, implicit-teams, version-stamped]
---

## TLDR

Version-stamped substrate sheet for CLI 2.1.178/2.1.179 ("implicit teams", after `TeamCreate`/`TeamDelete` were stripped). Curated pointer to the probe-findings doc (Hopper, Task #4, committed `b37b938`); read the doc for per-probe (P1-P6) evidence. NOT current-validity for any other version.

## Key ideas

- **Name-on-disk (P1, LOAD-BEARING):** on-disk team name = `session-<id>` (random per session). Agent-tool `team_name` is **IGNORED on disk** -- cosmetic label only; agent chat may CLAIM a named team but the filesystem is authoritative. **Discoverable** at runtime: glob `teams/*/config.json` `.name` or derive from `sessions/<pid>.json` `sessionId` (first 8 hex).
- **config eager (P3):** `config.json` written on session start before any spawn -- a lone session is a 1-member team with itself as `team-lead`.
- **inboxes lazy (P3/P6):** absent on a brand-fresh bare session (team dir = `config.json` only).
- **members[] injection survives (P4):** out-of-band ghost-member append to `config.json` `members[]` is honored; SendMessage routes (writes `inboxes/<ghost>.json`).
- **External-write wake survives (P5/P6):** external JSON write into `inboxes/team-lead.json` wakes + delivers to a bare lone session (proactively, ~15s, no nudge) then drains to `[]`. **Caveat:** the file must exist; courier creates it (first write double-duty).
- **`sessions/<pid>.json`** = live session registry (pid→sessionId→status).
- **Inbox `type` field** added on 2.1.179 (`"type":"message"`); courier writer/reader must tolerate/emit it.
- **Migration verdict:** injection (P4) + inbox-write delivery (P5/P6) BOTH survive; only the hardcoded team-name path breaks -> [`courier-must-runtime-discover-team-name`].
- Revision trigger = CLI version change. n+1 on 2.1.179 does not strengthen. TTL 2026-09-17 (throwaway-container re-probe).

(*FR:Callimachus*)
