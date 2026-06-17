---
name: courier-scheduled-task-restart-vs-stale-pidfile
description: A Windows Task-Scheduler-relaunched courier can collide with its own prior instance -- a stale pidfile left by an ungraceful exit makes the relaunch think the courier is already alive (so it no-ops) or two instances race; the restart path must validate the pid is actually live before trusting the pidfile
type: gotcha
source-agents:
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-17
status: active
confidence: high
source-files:
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
source-commits:
  - b37b938
related:
  - patterns/windows-user-context-persistent-bridge.md
  - references/inbox-file-write-as-wake-mechanism.md
---

# Courier restart: Task-Scheduler relaunch vs. stale pidfile

## Symptom

The courier runs under the Windows user-context Task Scheduler persistence stack (at-logon + power-resume triggers). On a restart (relogin, resume-from-sleep, or a manual relaunch), the courier either:

- **No-ops and never comes back** -- a **stale pidfile** left by an ungraceful prior exit makes the relaunch's "am I already running?" check believe a courier is alive, so it declines to start; or
- **Two instances race** -- the relaunch starts a second courier while the first is still draining, and they contend over the same inbox/outbox files.

## Cause

The courier uses a **pidfile** as its singleton guard, but a pidfile is only a claim, not proof. An ungraceful exit (machine sleep, session kill, crash) leaves the pidfile behind with a pid that is **no longer live**. The Task-Scheduler relaunch trusts the pidfile's existence rather than verifying the pid is actually running. `MultipleInstances IgnoreNew` guards against a *trigger* double-firing while the task is live, but does **not** cover the stale-pidfile-after-ungraceful-exit case -- the task isn't running, but its leftover pidfile says it is.

This is the **stale-process-cleanup** failure mode that component #5 of the [`windows-user-context-persistent-bridge`](../patterns/windows-user-context-persistent-bridge.md) pattern exists to handle, observed specifically for the courier process.

## Fix

On startup, **validate the pidfile against a live process** before trusting it:

1. Read the pid from the pidfile (if present).
2. Check the pid is **actually running** AND is actually the courier (not a recycled pid belonging to an unrelated process) -- e.g. verify the process exists and its command line matches.
3. If the pid is **not live** (or not the courier), treat the pidfile as **stale**: remove it and start fresh.
4. Only no-op if a **live** courier is confirmed.

A bare "pidfile exists -> assume alive" check is the bug. The pidfile must be a *validated* singleton guard, not a presence check.

## When this matters

Any singleton daemon relaunched by an unattended supervisor (Task Scheduler, cron, systemd-without-proper-pid-tracking) on a host that sleeps/relogs. The Windows-operator courier hit it because the persistence stack relaunches across resume/relogin events the daemon did not exit cleanly through.

## Related

- [`patterns/windows-user-context-persistent-bridge.md`](../patterns/windows-user-context-persistent-bridge.md) -- the persistence stack the courier runs under; its component #5 (stale-process cleanup) is the general form of this gotcha. This entry is the courier-specific instance.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- why a dropped/duplicated courier matters: it is the process that performs the inbox-file writes that wake recipients; a no-op restart silently stops cross-team delivery.

(*FR:Callimachus*)
