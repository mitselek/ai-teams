---
title: "Courier Rotation Contract Has a Teardown Half -- Reap Before Acquire"
directory: contracts
status: active
confidence: high
source-agents: [herald]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
related: [courier-must-runtime-discover-team-name.md, orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md, lockfile-pid-staleness-false-refuse-across-container-recreate.md, courier-scheduled-task-restart-vs-stale-pidfile.md, explicit-courier-config-hardcoded-path-stale-on-2.1.181.md]
tags: [contract, courier, rotation, teardown, reap, lock, lifecycle, 2.1.181, v2-open, self-healing, issue-86]
---

## TLDR

Courier-process rotation is a SYMMETRIC contract: `reap-prior (kill + drain + release lock) -> resolve live dir -> acquire`. The "re-resolve on restart" rule (Step 2.5) is only the ACQUIRE half. A rotation that re-resolves the path but leaves the old courier running (still holding its lock, maybe polling a dead session-<id>) is INCOMPLETE -> lock collision or two couriers race. The reap is the structural complement of the acquire, NOT an optional Windows .ps1 detail.

## Key ideas

- **Requirement:** at EVERY rotation, reap the prior courier (kill + drain + release lock) BEFORE the new one acquires. Skipping it -> FileExistsError on the held lock, or two couriers racing the same inbox/outbox, or an orphan polling the abandoned dead dir.
- **Mechanism vs requirement (both needed):** this contract = the REQUIREMENT that the reap happens. The lock-staleness spec (PID-1-starttime epoch, lockfile-pid-staleness-... gotcha) = the MECHANISM detecting WHEN a lock is reapable across boot/PID-reuse. Requirement without mechanism reaps blindly; mechanism without requirement detects-but-never-acts.
- **Bug B is the live instance:** S58 rotation hit an orphan + stale lock; the fix was the wrapper's reap (stop-fr-courier.ps1: hard-kill + --drain-once + lock release, then start). Until S58 the teardown lived ONLY in the .ps1 + the spec, NOT in the lifecycle DESIGN -- the silence this contract closes.
- **Three artifacts, three roles (cross-ref not merged):** this contract = design requirement; orphan-courier gotcha (Bug B) = the incident proving omission bites; lock-staleness gotcha/spec = the safe-execution mechanism.
- **Design home:** lifecycle-rework-implicit-teams-2026-06-18.md Section 3 ("The rotation contract has a teardown half", filed S58) + Section 10 queue. Implementation = courier wrapper (stop=reap, start=acquire); this entry is the queryable requirement.
- **OPEN / v2-at-scale (TRACKED GAP, not v1 knowledge -- co-located here, Herald submission 3/3):** single-point Config-load `inboxes_dir` resolution is NOT self-healing -- refreshed only by per-session restart (Step 2.5), no mid-session re-validation. v1 correct (restart cadence == rotation cadence, FR sole live team); does NOT generalize (session crash+re-derive OR v2 multi-team -> dir rotates under a once-resolved courier -> silent no-delivery, no detection). v2 fix (deferred): self-healing layer -- (a) periodic re-resolve on poll loop OR (b) liveness-check inboxes_dir before each delivery. **Disposition (Aen): NOT a v1 unpin blocker; owner TBD at second-team migration.** Live proof = S58 Bug C (stale once-at-load path survived into a dead-dir session). Design home: lifecycle-rework doc Section 9 OQ #6. Co-located as the contract's at-scale hardening (restart-rotation here; mid-session there).
- **stage-2: CONFIRMED** -- single-source, author-submitted (Herald is the sole author articulating his own knowledge via Protocol A; no co-authors to read back against). Filed confirmed per the author-solo rule.

(*FR:Callimachus*)
