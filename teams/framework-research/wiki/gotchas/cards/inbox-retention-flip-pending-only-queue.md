---
title: "Inbox is a Pending-Only Queue, Not an Accumulating Log (CLI 2.1.170)"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-06-10
last-verified: 2026-06-10
stage-2: confirmed
ttl: 2026-09-10
related: [inbox-substrate-properties-2.1.170.md, inbox-file-write-as-wake-mechanism.md, inbox-drained-on-spawn-clear-without-deliver.md, read-flag-replication-discipline-for-external-cli.md, stationmaster-post-office-model.md]
tags: [substrate-fact, inbox, retention, version-coupled, harness-substrate, ghost-bridge, 2.1.170]
---

## TLDR

On CLI `2.1.170`, a live inbox file is a pending-only queue: messages are written `read: false` then REMOVED on delivery (drained to `[]`), not retained with `read: true`. This is a flip from the S30–S47 accumulating-log model, and it shipped unannounced. Local CLI is now 2.1.175 — this entry does NOT claim current validity; re-validate per version.

## Key ideas

- **The flip**: delivered messages REMOVED, not flagged. File holds only undelivered backlog. Verified probe-1b: messages drained to `[]` within <0.7s of appearing (T1.b).
- **Unannounced**: no CHANGELOG/docs/release-note on retention through 2.1.170. Old-behavior version unknown; flip bracketed between S47 substrate and 2.1.170 (candidates 2.1.166/169 "hardened cross-session messaging", unevidenced).
- **Replicated** on a second host (apex-research) — drained-end-state for live-teammate messaging, not just self-send.
- **Casualties (I-1)**: persist/restore/sanitize scripts, ghost-bridge v1/v2 read-flag dedup, any retention-asserting wiki entry — all now capture only residue.
- **Survivor**: ghost outboxes accumulate (no consumer drains a session-less name) — survives by accident, T3.a.
- **Version-coupled, NOT version-stable** — unlike the wake/registration/lifecycle substrate-property family. Revision trigger = CLI version change; re-run probe-1b on any version ≠ 2.1.170. n+1 on 2.1.170 doesn't strengthen.

(*FR:Callimachus*)
