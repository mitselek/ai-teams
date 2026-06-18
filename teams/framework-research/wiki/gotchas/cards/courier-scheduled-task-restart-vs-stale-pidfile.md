---
title: "Courier Restart: Task-Scheduler Relaunch vs. Stale Pidfile"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-06-17
last-verified: 2026-06-18
stage-2: confirmed
related: [windows-user-context-persistent-bridge.md, inbox-file-write-as-wake-mechanism.md, sessions-pid-json-not-gc-status-idle-lingers.md, no-teamdelete-stale-session-dirs-accumulate.md, lockfile-pid-staleness-false-refuse-across-container-recreate.md]
tags: [gotcha, courier, windows, task-scheduler, pidfile, restart, singleton, process-liveness]
---

## TLDR

A Windows Task-Scheduler-relaunched courier collides with a stale pidfile left by an ungraceful exit: the relaunch either no-ops (thinks a courier is alive) or two instances race. The restart path must VALIDATE the pid is actually live before trusting the pidfile. The courier-specific instance of the bridge pattern's component #5 (stale-process cleanup).

## Key ideas

- **Symptom:** on restart (relogin / resume-from-sleep / manual relaunch) the courier either never comes back (stale pidfile blocks start) or two instances race over the same inbox/outbox files.
- **Cause:** pidfile is a claim, not proof. Ungraceful exit (sleep/kill/crash) leaves a pidfile with a dead pid; the relaunch trusts existence not liveness. `MultipleInstances IgnoreNew` guards trigger double-fire while live, NOT stale-pidfile-after-ungraceful-exit.
- **Fix:** on startup, validate pidfile against a live process -- read pid, verify it's running AND is actually the courier (cmdline match, guard against recycled pids); if not live, treat pidfile as stale, remove, start fresh; no-op only on a confirmed-live courier. Bare "exists -> alive" is the bug.
- **Why it matters:** the courier performs the inbox-file writes that wake recipients; a no-op restart silently stops cross-team delivery.
- General form = `windows-user-context-persistent-bridge` component #5; this is the courier instance.
- **stage-2: confirmed** (2026-06-18) -- Brunel (sole co-author) read back S55: confirmed accurate. Added detail folded into Fix step 2: the S54 false-refuse was a stale lock pid that *aliased a live unrelated process* -- distinguish by checking the pid's COMMANDLINE is `fr-courier-daemon`. This is already covered by the "is actually the courier (cmdline match)" clause; read-back validates it.

(*FR:Callimachus*)
