---
name: orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim
description: On Windows, a prior-session courier (started by the Scheduled Task, on the explicit config) can stay ALIVE across a session boundary holding ~/.stationmaster/framework-research/courier.lock. Because that orphan is not tracked by the new session's wrapper pidfile, the wrapper's stop step cannot reclaim a lock it did not create -- so every new courier dies FileExistsError on the held lock. This is a LIVE-orphan/ownership problem, distinct from the dead-pid stale-pidfile gotcha. Fix: identity-based stop sweep (kill any courier by identity, not just the tracked pid) + disable the Scheduled Task that spawns the untracked orphan.
type: gotcha
source-agents:
  - aen
  - brunel
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/stop-fr-courier.ps1
  - teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1
source-issues:
  - mitselek/ai-teams#86
related:
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md
  - decisions/courier-must-runtime-discover-team-name.md
  - patterns/windows-user-context-persistent-bridge.md
ttl: 2026-09-18
---

# Orphan courier holds the lock across sessions; the wrapper can't reclaim it (Bug B)

**Observation-based gotcha, version-stamped 2.1.181 -- surfaced live during S58 startup; worked around by hand, needs a permanent fix (owner: Brunel).**

> **CURATION RESOLVED (Brunel read-back, S58): KEEP SEPARATE.** This stays a distinct sibling of [[courier-scheduled-task-restart-vs-stale-pidfile]] -- NOT folded. The two are the same *abstraction* (a stale/contended courier singleton-guard across a restart) but **different root cause**: that one = **dead pid, file lingers** (stale PRESENCE); this one = a **LIVE orphan from a prior session holds the lock**, and the new wrapper cannot reclaim a lock it did not create (**ownership**, not staleness). Brunel's call: folding would bury the live-contention corner inside a stale-presence entry; the cross-links between them are correct as-is.

## Symptom

On a new session's startup (Step 2.5), every attempt to start the courier **dies with `FileExistsError`** on `~/.stationmaster/framework-research/courier.lock`. The wrapper's stop step runs but does NOT clear the lock, so the restart loops on the held lock and no live courier comes up.

## Cause -- a LIVE orphan the wrapper doesn't track

- A **prior-session courier** (S58 observed pid 38044, running on the **explicit** config, likely started by the **Windows Scheduled Task** persistence stack) **stayed alive across the session boundary**, holding `~/.stationmaster/framework-research/courier.lock`.
- The new session's **wrapper stop step** (`stop-fr-courier.ps1`) reclaims only couriers it **tracks via its own pidfile**. The orphan was started **out-of-band** (by the Scheduled Task, not by this session's wrapper), so it is **not in the wrapper's pidfile** -> the stop step has nothing to kill and **cannot reclaim a lock it did not create**.
- Result: the orphan keeps holding `courier.lock`; the new courier hits `FileExistsError` and dies. Comms stay down until the orphan is killed by hand.

**S58 manual workaround:** killed pid 38044 + `rm`'d the stale `courier.lock`; the next courier (pid 41188, on `.auto.json`) then resolved `session-b2ad507b/inboxes` and stayed stable. This is the live diagnosis, not the permanent fix.

## Fix (owner Brunel -- task #3) -- LANDED (validation pending task #7)

1. **Identity-based stop sweep -- LANDED (S58, code).** `stop-fr-courier.ps1` new Step 1b: CIM `Win32_Process` `CommandLine` match on `fr-courier-daemon\.py` -> hard-kill any live match -> clear `courier.lock` **ONLY if the recorded pid is dead** (honors InstanceLock staleness; refuses to yank a *live* holder). Parse-check PASS. The stop step now kills **any** running courier by **identity** (cmdline match), not only the wrapper-tracked pid -- so an out-of-band orphan from a prior session is reclaimable. A lock-holder check that does NOT depend on "did *I* start it" is the core of the fix.
2. **Disable the Scheduled Task** that spawns the untracked orphan -- **EXECUTED (S58, 2026-06-18T16:06+03:00).** Hopper ran `Disable-ScheduledTask FrameworkResearch-Courier`: State `Ready` → `Disabled`; sole live courier pid 41188 on `.auto.json`, lock intact, **task registration RETAINED for rollback.** The orphan-lock recurrence (the pid-38044 source) is **closed.** Ops-log: `docs/operations-log-2026-06.md`. The Scheduled-Task-started courier was precisely the instance the wrapper cannot track; removing that spawn source removes the orphan class. (This couples to the Direction-#4 change retiring the always-on explicit-fallback courier -- see the [[explicit-courier-config-hardcoded-path-stale-on-2.1.181]] sibling, Bug C.)

**Precision (Brunel, S58):** the lock behaved **CORRECTLY** -- it SHOULD refuse a live holder. The defect was the **orphan being alive** (dual-launcher, no shared pid tracking), NOT the lock logic. The lock itself is sound as a singleton guard; the bug is **who is allowed to reclaim it.** An ownership-scoped reclaim ("only the creator may clear") is exactly wrong for a cross-session orphan -- the new session is a *different* creator. Reclaim must be **identity-scoped** (is *a* courier holding it, alive?), guarded by liveness.

**`status: active` held** until the fixes are validated end-to-end (task #7). **Both fixes now landed (S58):** fix (1) identity stop-sweep landed-in-code + parse-checked; fix (2) Scheduled Task **disabled** (Hopper, 16:06). The orphan-spawn source is closed; remaining is task #7 end-to-end validation before `resolved`.

## Relationship to the field-22 / process-liveness family

This sits in the same **stale-state-on-a-persistent-substrate** family as [[courier-scheduled-task-restart-vs-stale-pidfile]] and [[lockfile-pid-staleness-false-refuse-across-container-recreate]], but it is the **live-contention** corner of it: not "a dead holder left a stale claim" but "a *live* holder from a prior session can't be reclaimed by a stop step scoped to this session's own pidfile." The shared lesson across the family: **a singleton guard must be reclaimable by identity + liveness, never by `did-I-create-it` ownership** -- ownership-scoped reclaim breaks across the very boundaries (session, container, restart) the guard exists to span.

## Revision trigger

**Substrate/tooling change** (version-coupled, 2.1.181): resolved-by-design once (a) the stop step does identity-based reclaim and (b) the Scheduled Task that spawns the untracked orphan is disabled (task #3). Update `status` to reflect the landed fix at that point. Re-open if a future persistence model re-introduces an out-of-band courier spawn the wrapper cannot track.

## Related

- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md) -- **the dedup-outcome-3 sibling (kept separate, Brunel read-back S58).** That = dead pid, stale pidfile PRESENCE; this = LIVE orphan holding the lock, ownership-scoped reclaim fails. Same singleton-guard abstraction, different root cause.
- [`gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md`](lockfile-pid-staleness-false-refuse-across-container-recreate.md) -- the container-recreate corner of the same lock-staleness family (pid-reuse across PID namespaces); shares the "a recorded claim is not proof of the right holder" lesson.
- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the courier whose restart this blocks; the orphan was on the explicit config while the new courier targets `.auto.json`.
- [`patterns/windows-user-context-persistent-bridge.md`](../patterns/windows-user-context-persistent-bridge.md) -- the persistence stack (Scheduled Task) that spawns the untracked orphan; component #5 (stale-process cleanup) is the general form, and disabling the Task is part of the fix.

## Amendments log

- **2026-06-18 (S58, Brunel read-back = Stage-2 confirmation + curation decision):** stage-2 `pending` → **`confirmed`** (Brunel is the sole owning co-author with Aen). **Curation RESOLVED: KEEP SEPARATE** (do NOT fold into the stale-pidfile entry -- folding would bury the live-contention corner). Added Brunel's precision: the lock behaved correctly (it SHOULD refuse a live holder); the defect was the orphan being alive, not the lock logic.
- **2026-06-18 (S58, both fixes landed):** fix (1) identity-based stop sweep landed in `stop-fr-courier.ps1` Step 1b (CIM cmdline match + lock-clear-only-if-pid-dead, parse-check PASS); fix (2) Scheduled Task **EXECUTED-disabled** by Hopper 16:06+03:00 (State Ready→Disabled, registration retained for rollback, sole courier pid 41188 on `.auto.json`, lock intact) -- the orphan-spawn source (pid-38044 class) is closed. `status: active` held only until task #7 end-to-end validation; the disable itself is done, not pending.

(*FR:Callimachus*)
