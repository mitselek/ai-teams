---
title: "Lockfile pid-Staleness False-Refuse Across Container Recreate"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, herald]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
related: [sessions-pid-json-not-gc-status-idle-lingers.md, courier-scheduled-task-restart-vs-stale-pidfile.md, windows-user-context-persistent-bridge.md, inbox-file-write-as-wake-mechanism.md]
tags: [gotcha, lockfile, pid, container-recreate, pid-namespace, boot-id, pid-1-starttime, field-22, process-liveness, instancelock, courier]
---

## TLDR

A single-instance lockfile on a PERSISTENT volume + a pid-only staleness check = FALSE-REFUSE across a container recreate. The PID namespace resets per container, so an old recorded pid can alias a live unrelated process in the new container -> `os.kill(pid,0)`=true -> lock judged not-stale -> daemon refuses to start. Fix needs a container-instance discriminator: PID-1 starttime (`/proc/1/stat` field 22), NOT boot_id.

## Key ideas

- **Cause:** PID namespace resets per container; a pid from a prior instance aliases a live unrelated process in the new one -> pid-only check false-positives "holder alive". Across-container escalation of the same pid-ambiguity root as courier-scheduled-task-restart-vs-stale-pidfile.
- **boot_id is WRONG:** `/proc/sys/kernel/random/boot_id` is host-kernel-scoped -- SAME across containers, unchanged by recreate.
- **PID-1 starttime is RIGHT:** `/proc/1/stat` field 22 (clock ticks) changes per recreate (PID-1 is fresh). Parse field 22 from AFTER the last `)` (comm field can contain parens). Record it with the lock; mismatch vs current = different instance = stale -> reclaim.
- **Shared lesson (field-22 sibling family):** OS-level start-time (`/proc/<pid>/stat` field 22) is the real discriminator, NOT a recorded flag/host-scoped id. Sibling: sessions-pid-json-not-gc (status:idle useless; pid process-liveness + procStart field-22 real). Both: "a recorded flag/id is a claim, not proof; OS start-time is proof."
- **Live home:** Herald's `stationmaster-courier.py` InstanceLock + `_pid_alive`. The conservative-on-error `_pid_alive` (refuse-to-reclaim on unknown) is the sibling discipline to this gotcha's reclaim-only-if-truly-stale rule -- together they avoid both false-refuse AND false-reclaim.
- Revision trigger: a container runtime that doesn't reset PID-namespace per instance, or a lock moving to a kernel per-instance token. Container-substrate fact; n+1 doesn't strengthen.
- **stage-2: confirmed** -- brunel (diagnosed S52) + herald (owns the fix), both source-agents on one empirically-verified incident (apex courier S52 container hardening). Substrate-fact, filed confirmed.

(*FR:Callimachus*)
