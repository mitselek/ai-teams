---
name: lockfile-pid-staleness-false-refuse-across-container-recreate
description: A single-instance lockfile on a PERSISTENT volume + a pid-only staleness check = FALSE-REFUSE across a container recreate -- the PID namespace resets per container, so a recorded pid from a prior container can alias a live unrelated process in the new container, os.kill(pid,0) returns true, the lock is judged not-stale, and the process refuses to start. The fix needs a container-instance discriminator: PID-1 starttime (/proc/1/stat field 22), NOT boot_id (host-kernel-scoped, same across containers).
type: gotcha
source-agents:
  - brunel
  - herald
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
related:
  - gotchas/sessions-pid-json-not-gc-status-idle-lingers.md
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - patterns/windows-user-context-persistent-bridge.md
  - references/inbox-file-write-as-wake-mechanism.md
---

# Lockfile pid-staleness false-refuse across container recreate

## Symptom

A single-instance daemon (e.g. the courier) uses a **lockfile on a persistent volume** plus a **pid-only staleness check** (`os.kill(pid,0)` on the lock's recorded pid). After a **container recreate** (the container is destroyed and a fresh one started against the same persistent volume), the daemon **refuses to start** -- it reads the old lockfile, the recorded pid `os.kill`s alive, so it judges the lock not-stale and concludes another instance is already running. **Nothing is actually holding the lock; the daemon false-refuses.**

## Cause

The **PID namespace resets per container.** A pid recorded by a *prior* container can, in the *new* container, alias a **live but unrelated** process (the kernel reissues low pids). So:

- lock records pid `P` from container instance A;
- container is recreated -> instance B starts; pid `P` is now some unrelated live process in B;
- `os.kill(P, 0)` -> **true** -> the pid-only check says "lock holder is alive" -> false-refuse.

A pid is meaningful only **within one container instance**. Across a recreate it is ambiguous. This is the *container-recreate* analogue of [`courier-scheduled-task-restart-vs-stale-pidfile`](courier-scheduled-task-restart-vs-stale-pidfile.md) (pid-reuse across a relaunch on one host) -- same pid-is-not-unique-enough root, one layer up (across container instances, not just across process restarts).

## Fix: a container-instance discriminator -- and the trap within it

The lock must record **which container instance** holds it, and the staleness check must compare instances, not just pids.

- **`boot_id` is WRONG.** `/proc/sys/kernel/random/boot_id` is **host-kernel-scoped** -- it is the **same** across all containers on a live host and is **unchanged by a container recreate**. Using it as the instance discriminator makes the check never detect a recreate.
- **Use PID-1 starttime.** `/proc/1/stat` **field 22** (the start-time of the container's own `init`/PID-1 process, in clock ticks) **changes on every container recreate** because PID-1 is a fresh process in the new instance. Parse field 22 **from after the last `)`** in `/proc/1/stat` (the comm field can contain spaces/parens, so naive whitespace-split is wrong).

**Algorithm:** record the lock's PID-1-starttime alongside the pid. On startup, compare the lock's recorded PID-1-starttime to the **current** `/proc/1/stat` field 22. **Mismatch = different container instance = the lock is stale -> reclaim it.** Match + pid-alive = a genuine live holder in this instance -> refuse.

## The shared lesson (field-22 sibling family)

**The OS-level start-time (`/proc/<pid>/stat` field 22) is the real discriminator -- NOT a recorded flag, NOT a host-scoped id.** Two gotchas in this family, both teaching "field-22 start-time beats a recorded status/id":

- **This entry (LOCK-liveness):** `boot_id` is host-scoped and useless across recreate; PID-1 starttime (field 22) is the real per-instance discriminator.
- [`sessions-pid-json-not-gc-status-idle-lingers`](sessions-pid-json-not-gc-status-idle-lingers.md) **(SESSION-liveness):** the recorded `status:"idle"` is useless (lingers for dead sessions); the pid's process-liveness + `procStart` (field 22) is the real discriminator.

Both reduce to: **a recorded flag/id is a claim, not proof; the OS start-time is proof.**

## Live home and sibling discipline

The live implementation is Herald's `stationmaster-courier.py` **InstanceLock** + `_pid_alive`. The cross-platform `_pid_alive` (conservative-on-error: refuse-to-reclaim when liveness can't be determined) is the **sibling discipline** to this gotcha's reclaim-only-if-truly-stale rule -- the two together avoid both false-refuse (this gotcha) and false-reclaim (killing a live holder).

## Revision trigger

Substrate change: a container runtime that does NOT reset the PID namespace per instance, or a lock design that moves off pid+starttime to a kernel-provided per-instance token, would change the discriminator. This is a container-substrate fact (PID-namespace-per-container); n+1 re-sightings do not strengthen it.

## Related

- [`gotchas/sessions-pid-json-not-gc-status-idle-lingers.md`](sessions-pid-json-not-gc-status-idle-lingers.md) -- **sibling, the field-22 lesson** for session-liveness (status flag useless; pid process-liveness + `procStart` field-22 real). This entry is the same lesson for lock-liveness (boot_id useless; PID-1 starttime field-22 real).
- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md) -- the same-host relaunch analogue (pid-reuse across a Task-Scheduler relaunch); this entry is the across-container-instance escalation of the same pid-ambiguity root.
- [`patterns/windows-user-context-persistent-bridge.md`](../patterns/windows-user-context-persistent-bridge.md) -- component #5 (stale-process cleanup) is the general supervisor concern; this gotcha is the container-recreate failure mode that a naive pid-only component #5 hits.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- why a false-refusing courier matters: it is the process that performs the inbox-file writes that wake recipients; a false-refuse silently stops cross-team delivery.

(*FR:Callimachus*)
