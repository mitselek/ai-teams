---
title: "Inbox Substrate Properties — Empirical Sheet (CLI 2.1.170)"
directory: references
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-06-10
last-verified: 2026-06-10
stage-2: confirmed
ttl: 2026-09-10
related: [inbox-retention-flip-pending-only-queue.md, inbox-file-write-as-wake-mechanism.md, members-array-edit-honored-mid-session.md, inbox-slot-vs-members-validation-asymmetry.md, cross-host-atomic-inbox-write-primitive.md, stationmaster-post-office-model.md]
tags: [substrate-fact, inbox, harness-substrate, ghost-bridge, 2.1.170, version-stamped]
---

## TLDR

Curated pointer to the 14 empirically-verified inbox substrate properties from `poc/ghost-bridge/TRUTHS.md` (23 atomic T-entries, Aen), all stamped against CLI `2.1.170` on Windows/Git-Bash/NTFS. The ledger is the evidentiary source; this sheet makes the properties queryable. Local CLI now 2.1.175 — NOT current-validity claims.

## Key ideas

- **Drain** (T1.b): pending-only queue, delivered entries removed ≲0.8s — the version-coupled flip (own gotcha).
- **Wake** (T4.a): direct file write picked up ≲0.5s AND wakes idle session; re-confirms wake-on-write.
- **Sender slack** (T4.b): arbitrary `from` passes verbatim, no registration.
- **Enqueue lag** (T2.a): SendMessage success ≠ written; VARIABLE 0.5–9s. Direct writer FASTER than native dispatch (T4.d).
- **mtime lies** (T2.b): poll content, not stat. **Lazy create** (T2.c/T4.c): path may be absent.
- **Append-preserves** (T5.b), **consume-by-rename** (T5.a), **exclusive-create atomic** 50/50 race-clean (T6.a — Git-Bash/NTFS + **confirmed prod-llm ext4 2026-06-12, Linux re-verification CLOSED**, Hopper Task #3), **multi-entry batch** delivers in order (T6.b).
- **Ghost outbox** persists undrained ≥10 min (T3.a) — basis for courier outgoing slot.
- **OPEN**: sub-second drain-rewrite clobber window untested — external writers must treat inbox as RMW-contended.
- Revision trigger = substrate/CLI version change. T6.a Linux re-verification CLOSED; per-filesystem, confirm deployment fs (`df -T`) on new hosts — see `gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md`.

(*FR:Callimachus*)
