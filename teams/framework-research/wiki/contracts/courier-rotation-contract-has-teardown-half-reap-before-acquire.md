---
name: courier-rotation-contract-has-teardown-half-reap-before-acquire
description: Courier-process rotation is a SYMMETRIC contract -- reap-prior (kill + drain + release lock) THEN resolve-live-dir THEN acquire. The "re-resolve on restart" rule (startup Step 2.5) is only the ACQUIRE half; a rotation that re-resolves the path but leaves the old courier running (still holding its lock, maybe polling a dead session-<id>) is INCOMPLETE -> lock collision or two couriers race. The reap is the structural complement of the acquire, NOT an optional Windows .ps1 detail. Mechanism (WHEN a lock is reapable = lock-staleness PID-1-starttime spec) vs requirement (the reap MUST happen at every rotation = this contract) are both needed.
type: contract
source-agents:
  - herald
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/docs/lifecycle-rework-implicit-teams-2026-06-18.md
  - teams/framework-research/docs/courier-lock-staleness-fix-spec-2026-06-15.md
  - teams/framework-research/poc/ghost-bridge/stop-fr-courier.ps1
source-issues:
  - mitselek/ai-teams#86
related:
  - decisions/courier-must-runtime-discover-team-name.md
  - gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md
  - gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - gotchas/explicit-courier-config-hardcoded-path-stale-on-2.1.181.md
---

# Courier rotation contract: the teardown half (reap before acquire)

**Contract (structural requirement), version-neutral but surfaced on 2.1.181.** Courier-process rotation has two halves and the contract is **symmetric**:

```
reap-prior (kill + drain + release lock)  ->  resolve live dir  ->  acquire
```

The "re-resolve on restart" rule (startup Step 2.5 -- see [[courier-must-runtime-discover-team-name]]) is only the **ACQUIRE** half. The design previously stated **only** that half. This contract closes the silence: the **REAP** half is the structural complement, not optional.

## The requirement

At **every** rotation, the restart MUST **reap the prior session's courier process and release its lock BEFORE the new courier acquires.** Reap = **kill** the old process + **drain** its outstanding work + **release** its lock.

A rotation that re-resolves the path but leaves the old courier process running is **INCOMPLETE**:

- the old courier still **holds its lock** -> the new courier collides (`FileExistsError`); or
- two couriers **race** the same inbox/outbox files; and
- the orphan may still be **polling a dead `session-<id>` dir** (the stale path the rotation exists to abandon).

The reap is **NOT** merely a Windows `.ps1` implementation detail -- it is a **structural requirement of the rotation contract**, true wherever a courier rotates across a session boundary.

## Mechanism vs. requirement (keep both)

This contract is the **requirement** that the reap happens. It is distinct from the **mechanism** that detects *when* a lock is safely reapable:

- **Requirement (this entry):** the reap MUST occur at every rotation.
- **Mechanism ([[lockfile-pid-staleness-false-refuse-across-container-recreate]], `docs/courier-lock-staleness-fix-spec-2026-06-15.md`):** the PID-1-starttime epoch test that decides *when* a lock is reapable across a boot / PID-reuse boundary (so the reap doesn't yank a live holder, and isn't fooled by a recycled pid).

Both are needed: the requirement without the mechanism reaps blindly (might kill a live unrelated process); the mechanism without the requirement detects-but-never-acts. A correct rotation uses the mechanism to execute the requirement safely.

## OPEN / v2-at-scale -- single-point resolution is not self-healing (TRACKED GAP, NOT v1 knowledge) (*FR:Herald*)

> **This subsection is a TRACKED OPEN, not active operational knowledge.** It records a known v2 gap so it is discoverable when at-scale work opens, rather than re-derived. **Disposition (Aen, 2026-06-18): explicitly NOT a v1 unpin blocker.** Owner TBD when a second team migrates.

The reap-then-acquire contract above hardens *rotation at restart*. But the courier resolves its `inboxes_dir` **ONCE, at Config-load**, and refreshes it **only via a per-session RESTART** (startup Step 2.5). There is **no mid-session re-validation** of the resolved path:

- **v1 (FR = sole live 2.1.178+ team): correct and sufficient.** The per-session restart cadence MATCHES the per-session team-dir rotation cadence -- no window where the live dir rotates without a restart.
- **Does NOT generalize.** If the live session's dir rotates or dies **without** a courier restart -- a session crash + re-derive, OR the **v2 multi-migrated-team** case (bare liveness sees >1 live `session-<id>` and the courier's bound dir can change under it) -- a once-resolved courier **silently delivers nothing, with no detection.**
- **v2 fix (deferred):** add a **self-healing** layer -- either (a) periodic re-resolution of `inboxes_dir` on the courier's poll loop, OR (b) a liveness check on the resolved `inboxes_dir` before each delivery (re-resolve on stale). Both turn "single-point resolution + restart-to-refresh" into "continuous resolution."

**Why this lives here (not a standalone entry):** it is the **at-scale hardening of this same rotation contract** -- the contract's teardown half fixes rotation *at restart*; this OPEN extends the same concern to *mid-session* (no restart). Co-located so a v2 reader finds the requirement and its known scaling limit together. **Live root-cause proof:** S58 Bug C ([[explicit-courier-config-hardcoded-path-stale-on-2.1.181]]) -- a stale `inboxes_dir` resolved at a prior Config-load survived into a session where the dir was dead, confirming once-at-load resolution is the root hazard and restart-to-refresh is the only refresh path. Design home: `docs/lifecycle-rework-implicit-teams-2026-06-18.md` Section 9 OQ #6 (filed S58) + Section 10 queue.

## Relationship to Bug B (the incident that exposed the silence)

The Bug B gotcha [[orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim]] is the **live instance** that surfaced this contract: at S58 rotation an orphaned prior-session courier + a stale lock collided, and the fix was the wrapper's reap (`stop-fr-courier.ps1`: hard-kill + external `--drain-once` + lock release, then `start`). Until S58 this teardown lived **only** in the `.ps1` wrapper + the lock-staleness spec -- it was **not in the lifecycle DESIGN**. This contract is the design-level requirement; Bug B is the gotcha that proves omitting it bites; the lock-staleness spec is the mechanism. Three artifacts, three roles -- cross-referenced, not merged.

## Where stated

Design home: `docs/lifecycle-rework-implicit-teams-2026-06-18.md` Section 3, new subsection "The rotation contract has a teardown half" (filed S58) + Section 10 queue. The implementation lives in the courier wrapper (`stop-fr-courier.ps1`, the reap; `start-fr-courier.ps1`, the acquire); this entry is the **queryable requirement**, the design doc is authoritative.

## Related

- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the ACQUIRE half (re-resolve the live `session-<id>` on restart); this contract supplies the missing REAP half that must precede it.
- [`gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md`](../gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md) -- **Bug B, the live instance**: the incident where a missing reap left an orphan holding the lock. This contract is the design requirement that gotcha proves load-bearing.
- [`gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md`](../gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md) -- the **mechanism** (PID-1-starttime epoch) for detecting *when* a lock is reapable; the safe-execution counterpart to this requirement.
- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](../gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md) -- the dead-pid stale-presence corner; the reap must validate liveness (via the mechanism) so it neither yanks a live holder nor trusts a stale pidfile.

(*FR:Callimachus*)
