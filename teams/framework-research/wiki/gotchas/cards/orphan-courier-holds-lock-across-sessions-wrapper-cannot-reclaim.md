---
title: "Orphan Courier Holds the Lock Across Sessions; Wrapper Can't Reclaim It (Bug B)"
directory: gotchas
status: active
confidence: high
source-agents: [aen, brunel]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
ttl: 2026-09-18
related: [courier-scheduled-task-restart-vs-stale-pidfile.md, lockfile-pid-staleness-false-refuse-across-container-recreate.md, courier-must-runtime-discover-team-name.md, windows-user-context-persistent-bridge.md]
tags: [gotcha, 2.1.181, courier, lockfile, orphan, cross-session, ownership-reclaim, scheduled-task, bug-b, issue-86]
---

## TLDR

On Windows a prior-session courier (Scheduled-Task-started, explicit config) can stay ALIVE across a session boundary holding ~/.stationmaster/framework-research/courier.lock. The new session's wrapper tracks only couriers it started (its own pidfile), so its stop step CANNOT reclaim a lock it didn't create -> every new courier dies FileExistsError. A LIVE-orphan/ownership problem, distinct from the dead-pid stale-pidfile gotcha.

## Key ideas

- **CURATION RESOLVED (Brunel S58): KEEP SEPARATE** from courier-scheduled-task-restart-vs-stale-pidfile -- NOT folded (folding would bury the live-contention corner inside a stale-presence entry; cross-links correct as-is). Same abstraction (contended courier singleton guard across restart), different root cause: that = dead pid, stale PRESENCE; this = LIVE orphan holding the lock, ownership-scoped reclaim fails.
- **Cause:** orphan started out-of-band (Scheduled Task, not this session's wrapper) -> not in the wrapper's pidfile -> stop step has nothing to kill and can't reclaim a non-owned lock. S58: pid 38044 held it; new couriers died FileExistsError.
- **S58 workaround:** killed 38044 + rm'd stale lock -> next courier (41188 on .auto.json) resolved session-b2ad507b/inboxes, stable. Diagnosis, not the fix.
- **Fix (task #3) -- BOTH LANDED:** (1) identity-based stop sweep LANDED in stop-fr-courier.ps1 Step 1b (CIM cmdline match `fr-courier-daemon\.py` -> hard-kill + clear lock ONLY if recorded pid dead; parse-check PASS); (2) Scheduled Task EXECUTED-disabled by Hopper 16:06+03:00 (Ready->Disabled, registration retained for rollback, sole courier pid 41188 on .auto.json) -- orphan-spawn source (pid-38044 class) CLOSED. The lock is sound; the bug is WHO may reclaim it -- must be identity+liveness-scoped, never did-I-create-it ownership. **Precision (Brunel):** the lock behaved correctly (it SHOULD refuse a live holder); the defect was the orphan being alive (dual-launcher), not the lock logic. status:active held only until task #7 end-to-end validation.
- **Family lesson:** a singleton guard must be reclaimable by identity+liveness, never by ownership -- ownership-scoped reclaim breaks across the session/container/restart boundaries the guard exists to span. (Same family as lockfile-pid-staleness-across-container-recreate + courier-scheduled-task-vs-stale-pidfile.)
- **Version-coupled, 2.1.181.** Revision trigger: resolved-by-design once identity-reclaim + Task-disable land; re-open if a future persistence model re-adds an out-of-band courier spawn.
- **stage-2: CONFIRMED** (S58, Brunel read-back) -- Brunel is the sole owning co-author (with Aen); his read-back confirmed the entry + resolved the curation call (keep-separate) + reported both fixes landed.

(*FR:Callimachus*)
