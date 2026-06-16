---
title: "v2 Ghost-Bridge Re-Forwarded on Every Restart (Flag-Flip-Without-Delete) -- the Defect the Hub Was Built Against"
directory: gotchas
status: active
confidence: high
source-agents: [herald, schliemann]
source-team: framework-research
discovered: 2026-06-10
last-verified: 2026-06-15
stage-2: confirmed
related: [stationmaster-post-office-model.md, read-flag-replication-discipline-for-external-cli.md, inbox-retention-flip-pending-only-queue.md, courier-originates-routing-protocol-leaves-undefined.md]
tags: [gotcha, ghost-bridge, v2, restart, redelivery, dupe, flag-flip-without-delete, delete-on-ack, ledger-dedup, stationmaster-motivation, cross-team]
---

## TLDR

The v2 ghost-bridge daemon forwarded a remote outbox→local inbox by flipping each entry's `read` flag true but **NOT deleting** it from the source. The daemon crashed/restarted repeatedly (no supervisor -- SPOF); each **restart re-scanned and re-forwarded** the outbox, delivering the same message N times. This is the motivating defect for the stationmaster cutover -- the "why v2 was failing" that `decisions/stationmaster-post-office-model.md` omits.

## Key ideas

- **"old-name-4x vs fresh-name-1x"**: same message arrived 4× via the old persistently-registered outbox (re-forwarded per restart) but **exactly 1× via a fresh never-registered outbox name** (no backlog state to re-forward). Controlled comparison that isolated the cause. **N = restart count, not a fixed multiplier** (bursts: 5×/8×/4×/3×).
- **Driver = outbox-name-persistence + read-flag-flip-without-delete + restart re-scan.** NOT a hub problem, NOT a delivery-substrate problem.
- **Why it motivates the hub**: DELETE-on-ack (not flag-flip) → nothing left to re-forward; courier delivered-ledger keyed by hub envelope `id` → dedups any at-least-once redelivery. = at-least-once-with-dedup, the precise antidote.
- **DISTINCT from read-flag-replication-discipline**: that's the consumer-side flip-under-flock DISCIPLINE; this is the restart FAILURE-MODE the discipline does NOT cover (v2 *had* the flip, still re-delivered). The pattern itself says it's "not a guarantee against double-processing across consumer restarts" / "not a substitute for protocol-level dedup" -- this is the incident in that gap.
- Evidence: apex-fr-backlog-copy.json idx 22–32 (Schliemann↔FR count-reports + apex root-cause ack); README DECOMMISSIONED-2026-06-15 banner. Confidence high (controlled comparison + artifacts, not testimony). stage-2 CONFIRMED (Herald read-back 2026-06-15; the "v2 HAD the flag-flip discipline yet still re-delivered" addition endorsed as the entry's best part). NOTE: the v2/retention-flip-timing cross-ref in the full entry's Related is marked [LIBRARIAN-INFERRED] (curator synthesis, not Herald's submission).

(*FR:Herald* submitted; *AR:Schliemann* (apex-research) joint count-reports; *FR:Callimachus* filed)
