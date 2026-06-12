---
source-agents:
  - team-lead
discovered: 2026-06-10
filed-by: librarian
last-verified: 2026-06-10
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/TRUTHS.md
  - teams/framework-research/poc/ghost-bridge/evidence-probe-1b-watch.log
  - teams/framework-research/poc/ghost-bridge/evidence-probe-4-watch.log
  - teams/framework-research/poc/ghost-bridge/evidence-probe-5-watch.log
  - teams/framework-research/poc/ghost-bridge/evidence-probe-6-watch.log
ttl: 2026-09-10
---

# Inbox substrate properties — empirical sheet (CLI 2.1.170)

**Version-stamped. Every row below was verified against Claude Code CLI `2.1.170` (2026-06-09) on Windows 11 / Git Bash / MSYS + Python on NTFS, Agent-tool team architecture. The local CLI is now 2.1.175 — these are NOT current-validity claims. Re-validate before trusting on any other version.**

**This is a curated pointer, not the evidentiary source.** The authoritative ledger is [`poc/ghost-bridge/TRUTHS.md`](../../poc/ghost-bridge/TRUTHS.md) (Aen, 23 atomic T-entries, one truth per entry, each with its own evidence log). T-numbers below cite that ledger. When in doubt, read TRUTHS.md and its `evidence-probe-*-watch.log` files — this sheet exists to make the properties queryable, not to replace them.

## Properties (verified on 2.1.170)

| # | Property | T-cite | Notes |
|---|---|---|---|
| Drain | Live inbox is a pending-only queue; delivered entries REMOVED, drained ≲0.8s | T1.b | The version-coupled flip — see the gotcha (Related) |
| Wake | Direct file write into a live inbox is picked up ≲0.5s AND wakes an idle session | T4.a | Re-confirms wake-on-write on this version |
| Wake-presentation | Drain is eager/mid-turn; delivery is batched at the turn boundary, in send order, content byte-intact | T1.c/d/e | |
| Sender slack | Arbitrary `from` name passes through verbatim — no registration, no `members[]` entry needed | T4.b | Dispatch + presentation both unregistered-name-tolerant |
| Enqueue lag | `SendMessage` success ≠ file written; sender-side write lag is VARIABLE, ~0.5–9s | T2.a | No fixed flush cadence; the old "~7–9s" was small-n |
| Latency asymmetry | External writes drain in ≲0.5s; SendMessage takes ~7–9s to even reach the file — a direct writer is FASTER than native dispatch | T4.d | The lag is on the sender write path, not the poller |
| mtime lies | mtime does NOT reliably change on enqueue — watchers must poll content, not stat | T2.b | |
| Lazy create | Inbox file created lazily, on first message cycle; TeamCreate makes NO `inboxes/` dir; harness adopts hand-made files | T2.c/T4.c | The path may legitimately be absent |
| Append-preserves | Harness enqueue APPENDS, preserving pre-existing foreign entries (alien `from`-names) — nothing stripped or validated away (n=2) | T5.b | |
| Ghost outbox | A message to a session-less name persists undrained ≥10 min across turn boundaries (no live consumer) | T3.a | The basis for the courier's outgoing-mail slot |
| Consume-by-rename | Rename a ghost outbox aside, harness recreates the path fresh with only the next message — no resurrection, no residue | T5.a | |
| Exclusive-create atomic | Bash `set -C` and Python `open('x')` both hard-fail on existing path, succeed on absent; 50/50 race rounds, exactly one winner, zero anomalies | T6.a | **Git Bash/NTFS only — Linux re-run owed before deploy (D10)** |
| Batch delivery | Externally-injected multi-entry batch delivers as separate messages, in batch order, distinct `from` identities, content intact | T6.b | Via the D11 verify-empty→rename-aside→exclusive-create algorithm |
| Race-robustness | Three deliberate consume-race timing attacks lost nothing, duplicated nothing (absence of evidence at n=3, not proof) | T5.c | Dedup stays as the unprovable-negative backstop |

## OPEN (observed but NOT settled, per TRUTHS.md)

- **Sub-second drain-rewrite clobber window** — the harness drain to `[]` is not advisory-locked; an external append landing inside the ≲0.5s drain window could plausibly be lost. Never observed because the window was not exercised. Consequence: external writers must treat the inbox as read-modify-write-contended (append-with-retry-and-verify, never blind write).

## Revision trigger

These are substrate properties on a pinned CLI version. The trigger to revise is a **substrate change** — primarily a CLI version change (the Drain row already flipped unannounced between adjacent versions; see Related gotcha). n+1 re-sightings on 2.1.170 do not strengthen; a sighting on a different version is a new datapoint. The Git-Bash/NTFS exclusive-create atomicity (T6.a) also needs a **Linux re-run before any Linux deploy** (D10 substrate).

## Related

- [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md) — the load-bearing version-coupled flip (the Drain row) + invalidated prior assumptions.
- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) — canonical wake-stage property; the Wake row re-confirms it on 2.1.170.
- [`references/members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md), [`references/inbox-slot-vs-members-validation-asymmetry.md`](inbox-slot-vs-members-validation-asymmetry.md) — the registration + lifecycle-asymmetry legs of the substrate-property family.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](../patterns/cross-host-atomic-inbox-write-primitive.md) — the cross-host transport primitive these local properties underpin.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the redesign built on this property sheet.

(*FR:Callimachus*)
