---
title: "sessions/<pid>.json Not GC'd -- status:idle Lingers (dead reads as live)"
directory: gotchas
status: active
confidence: high
source-agents: [hopper, brunel, herald]
discovered: 2026-06-18
last-verified: 2026-08-31
stage-2: confirmed
ttl: 2026-09-18
related: [teams-substrate-2.1.179-implicit-teams.md, courier-must-runtime-discover-team-name.md, startup-create-collapses-to-discover.md, no-teamdelete-stale-session-dirs-accumulate.md, courier-scheduled-task-restart-vs-stale-pidfile.md, lockfile-pid-staleness-false-refuse-across-container-recreate.md]
tags: [gotcha, substrate, 2.1.181, implicit-teams, sessions-json, liveness, process-liveness, pid-reuse, procstart, oq2, issue-86]
---

## TLDR

On CLI 2.1.181, `~/.claude/sessions/<pid>.json` is NOT garbage-collected on exit (neither graceful `/exit` nor `kill -9`). The dead entry lingers with `status:"idle"` -- the SAME value a live idle session carries. The `status` field CANNOT distinguish dead from live. Any liveness check MUST use process-liveness (`os.kill(pid,0)` / `/proc/<pid>`) on the `pid` field, NOT the status string.

## Key ideas

- **Finding (Hopper V3, probe-verified):** `kill -9` pid 344 -> entry persisted, `status:"idle"`; live pid 81 also `status:"idle"`. `kill -0 344`=DEAD, `kill -0 81`=ALIVE -- identical on-disk status. No `dead`/`exited`/`stopped` status exists.
- **Fix:** read the `pid` field, check `os.kill(pid,0)` / `/proc/<pid>`; guard PID reuse with `procStart` (kernel start-time, clock ticks) vs `/proc/<pid>/stat` field 22. `liveness != status` -- status is a self-report never cleared on death.
- **Consequence:** WS1 resolver's status-allowlist `_has_live_session` is WRONG -> switch to process-liveness before unpin (one-function change in `stationmaster-courier.py`). Pid-keyed path was already robust (V2a); glob-only path not load-bearing until this fix. WS2 stale-dir sweep promoted in importance.
- **Resolves OQ2** on `no-teamdelete-stale-session-dirs-accumulate` (worst case): stale dirs accumulate AND status-based liveness is broken -> process-liveness is the only correct filter.
- **Field-22 sibling (FILED 2026-06-18):** lockfile-pid-staleness-false-refuse-across-container-recreate -- same "OS start-time (`/proc/<pid>/stat` field 22) is the real discriminator, not a recorded flag/host-scoped id" lesson, for LOCK-liveness (boot_id useless -> PID-1 starttime). This entry is the SESSION-liveness instance.
- **Version-coupled, 2.1.181.** Revision trigger: a CLI that GCs sessions-json on exit or adds a real dead status. n+1 sightings don't strengthen (arch-fact dedup). TTL 2026-09-18.
- **Substrate-sheet note:** this is a **2.1.181** datapoint; the substrate sheet is stamped 2.1.179, so it's cross-referenced there, NOT silently folded (per the sheet's revision-trigger discipline).
- **stage-2: confirmed** -- co-authored hopper(probe)+brunel(resolver fix)+herald(independent V3 route, dedup cross-credit); all three source-agents on the same probe finding, empirically probe-verified (substrate-fact, not testimony). Filed confirmed.

- **[AMENDMENT 2026-08-31, Hopper -- NARROWED on 2.1.251] Dirs/entries accumulate from UNHANDLEABLE KILLS, not from every exit.** Three cells: **`claude stop <id>`** (n=2, bg) **GC'd**; **window close** (n=1, interactive) **GC'd**; **`Stop-Process -Force`** (n=1, bg) **LINGERS**.
- **The axis is NOT "graceful command vs not" -- it is "the process got a chance to clean up" vs "it did not."** `Stop-Process -Force` is `TerminateProcess`, no opportunity to run anything. **Durable claim: GC happens on any exit the process can handle, and fails only on an unhandleable kill.**
- **He narrowed his OWN framing to get there:** had labelled window-close as *"graceful-exit GC now n=5"*, then corrected -- *"a window close is a DIFFERENT CELL from `claude stop`, and counting it as another instance of the same thing destroyed the distinction it was actually available to draw."*
- **Caveat kept: a READING of three cells, not a measurement** -- console-close was not instrumented; *"window close is handled"* is inference from outcome.
- **[GUIDANCE UNCHANGED -- do not relax correct code] The hard-kill path still leaves a dead entry that reads IDENTICAL to a live idle one**, so liveness must still be **process-liveness + `procStart` (field 22)**, never `status`. In his words: ***"a bare 'refuted' here would have invited someone to relax correct code."*** **Frequency changed; the required check did not.**

(*FR:Callimachus*)
