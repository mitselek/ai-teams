---
name: sessions-pid-json-not-gc-status-idle-lingers
description: On CLI 2.1.181 (implicit-teams) ~/.claude/sessions/<pid>.json is NOT garbage-collected when a session exits -- neither on graceful /exit nor kill -9. The dead entry lingers with status:"idle", the SAME value a live idle session carries, so the status field CANNOT distinguish dead from live. Any liveness check MUST use process-liveness (os.kill(pid,0) / /proc/<pid>) on the pid field, NOT the status string; guard PID-reuse with procStart.
type: gotcha
source-agents:
  - hopper
  - brunel
  - herald
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/docs/migration-validation-probe-findings-2026-06-18.md
source-issues:
  - mitselek/ai-teams#86
related:
  - references/teams-substrate-2.1.179-implicit-teams.md
  - decisions/courier-must-runtime-discover-team-name.md
  - decisions/startup-create-collapses-to-discover.md
  - gotchas/no-teamdelete-stale-session-dirs-accumulate.md
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md
ttl: 2026-09-18
---

# `sessions/<pid>.json` is not GC'd on exit -- `status:"idle"` lingers (dead reads identical to live)

**Substrate-property gotcha, version-stamped 2.1.181, empirically probe-verified (Hopper V3).** On CLI **2.1.181** (and the implicit-teams model generally), `~/.claude/sessions/<pid>.json` is **NOT garbage-collected when a session exits** -- neither on graceful `/exit` NOR on `kill -9`. The dead entry **lingers on disk with `status:"idle"`** -- the **identical** value a live idle session carries. So the `status` field **cannot distinguish a dead session from a live one**. There is no `dead`/`exited`/`stopped` status in this substrate.

## Symptom

A liveness check that reads `sessions/<pid>.json` and trusts the `status` field (e.g. an allowlist `status not in ("dead","exited","stopped")`) classifies a **dead** session as **live**. In a multi-dir discovery scenario this makes the glob+liveness path unable to disambiguate -- it either mis-selects a stale dir, or (if it fails closed) degrades to fail-fast.

## Evidence (Hopper V3, `docs/migration-validation-probe-findings-2026-06-18.md`)

Verbatim dead-entry body -- pid 344 was **`kill -9`'d**, the entry **persisted afterward**:

```json
{"pid":344,"sessionId":"b985912e-3186-4d30-90df-4f64e77c45b4","cwd":"/home/ai-teams","startedAt":1781774599170,"procStart":"786952200","version":"2.1.181","peerProtocol":1,"kind":"interactive","entrypoint":"cli","status":"idle","updatedAt":1781774599145,"statusUpdatedAt":1781774599145}
```

Direct confirmation: `kill -0 344` -> **DEAD**, but `sessions/344.json` still existed with `status:"idle"` -- identical to the **live** `sessions/81.json` (`kill -0 81` -> ALIVE, also `status:"idle"`). Graceful `/exit` produced the same lingering behavior.

## Fix

Any liveness check over `sessions/<pid>.json` MUST use **process-liveness**, not the `status` string:

1. Read the entry's **`pid`** field.
2. Check the process is actually alive -- `os.kill(pid, 0)` (Python) / `kill -0 <pid>` / `/proc/<pid>` existence.
3. **Guard against PID reuse:** compare the entry's **`procStart`** field (kernel start-time, clock ticks) against `/proc/<pid>/stat` field 22. A live pid whose start-time differs is a *different* process that recycled the pid -- treat the entry as dead.

**`liveness != status`.** The `status` field is a self-report that is never cleared on death; only the OS knows whether the process is alive.

## Consequence for the migration (WS1/WS2)

- The WS1 resolver's status-allowlist `_has_live_session` is **WRONG** as written -- it must switch to process-liveness before the unpin. This is a concrete, one-function change in `stationmaster-courier.py` (V3-driven must-fix per the probe's net verdict).
- The **glob-only (no-pid) liveness path** is not load-bearing until this fix lands; the **pid-keyed path** (lifecycle, which holds its own pid) was already robust (V2a PASS).
- The WS2 stale-dir sweep is **promoted in importance** -- with status-based liveness broken, only a pid-liveness filter or an explicit sweep clears stale dirs. See [[no-teamdelete-stale-session-dirs-accumulate]].

## Sibling lesson (field-22 family)

Same shape as the S52 **container-instance-discriminator** lesson, now filed at [[lockfile-pid-staleness-false-refuse-across-container-recreate]]: **the OS-level start-time (`/proc/<pid>/stat` field 22) is the real discriminator, not a recorded status flag or a host-scoped id.** There it is lock-liveness across container recreate (`boot_id` is host-scoped and useless; PID-1 starttime field-22 is real); here it is session-liveness across exit (`status:"idle"` is useless; the pid's process-liveness + `procStart` field-22 is real). Both teach **"a recorded flag/id is a claim, not proof; the OS start-time is proof."** (Watch-candidate resolved -- the sibling was filed 2026-06-18 via Brunel/Herald; the two now cross-reference each other.)

## [AMENDMENT 2026-08-31, Hopper -- SPLIT on 2.1.251: half refuted, half intact, guidance unchanged]

**Measured on CLI 2.1.251.** The claim *`sessions/<pid>.json` is not GC'd on exit* **splits**:

- **Graceful exit — REFUTED on 2.1.251.** `claude stop d9e036f4`: pid 34168 went alive → dead and `sessions/34168.json` was **REMOVED**. The graceful half of the 2.1.181 claim no longer holds.
- **Ungraceful exit — INTACT.** `Stop-Process -Force` on pid 5980: the entry **LINGERED with `status:"idle"`**, exactly as the body above documents.

**The better axis (his narrowing):** not *graceful command vs not*, but ***"the process got a chance to clean up" vs "it did not."*** `Stop-Process -Force` is `TerminateProcess`, which gives the process no opportunity to run anything. **GC happens on any exit the process can handle, and fails only on an unhandleable kill.** Third cell: an interactive **window close** also GC'd — flagged by him as **a reading, not a measurement** (console-close behaviour was not instrumented).

### The operational guidance STANDS UNCHANGED -- this is the point of the entry

**Nothing here licenses relaxing the liveness check.** The hard-kill path still leaves a dead entry that **reads identical to a live idle one**, so liveness must still be **process-liveness plus `procStart` (field 22)**, never the `status` field. The courier's process-liveness resolver stays load-bearing; **there is nothing to undo.**

> In the submitter's words: ***"a bare 'refuted' here would have invited someone to relax correct code."*** Filed as a **narrowing**, not a refutation, for exactly that reason — the claim's *frequency* changed, its *consequence for the check* did not.

**Sibling:** the same three-cell split governs stale **team dirs** — see [`no-teamdelete-stale-session-dirs-accumulate.md`](no-teamdelete-stale-session-dirs-accumulate.md), where it also carries the finding that **graceful exit removes a non-empty team dir, inboxes and all.**

*(*FR:Hopper* measured, and narrowed his own claim; *FR:Callimachus* filed)*

## Revision trigger

**Substrate change** (this is version-coupled, not version-stable): a future CLI that **GCs `sessions/<pid>.json` on exit**, or **adds a real dead/exited status**, invalidates this gotcha -- re-verify then. n+1 re-sightings on 2.1.181 do not strengthen it (architectural-fact dedup discipline). Stamp **2.1.181**; TTL 2026-09-18.

## Related

- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the substrate sheet; this gotcha fills its one open substrate-fact gap (GC-on-exit), but as a **2.1.181 datapoint** (the sheet is stamped 2.1.179 -- per its revision-trigger discipline, a different-version finding is a new datapoint, not a silent fold into the older sheet).
- [`gotchas/no-teamdelete-stale-session-dirs-accumulate.md`](no-teamdelete-stale-session-dirs-accumulate.md) -- the entry whose OQ2 caveat this **resolves** (worst case): stale dirs accumulate AND the status-based liveness filter that was supposed to skip them is broken -> the fix is process-liveness.
- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the resolver whose liveness-filter mechanism this gotcha corrects (status -> process-liveness).
- [`decisions/startup-create-collapses-to-discover.md`](../decisions/startup-create-collapses-to-discover.md) -- the lifecycle caller; its pid-keyed path is robust, but it shares the resolver whose no-pid path needs this fix.
- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md) -- **sibling, same abstraction:** "stale-state-on-a-persistent-substrate, the recorded flag is useless, fix = process-liveness." There a pidfile lingers after ungraceful exit; here a `sessions/<pid>.json` lingers `status:"idle"`. Shared lesson: **a recorded flag is a claim, not proof; only the OS knows liveness.** (Sibling edge strengthened per Herald, 2026-06-18.)
- [`gotchas/lockfile-pid-staleness-false-refuse-across-container-recreate.md`](lockfile-pid-staleness-false-refuse-across-container-recreate.md) -- **field-22 sibling:** the same "OS start-time is the real discriminator" lesson for LOCK-liveness (boot_id host-scoped/useless -> PID-1 starttime `/proc/1/stat` field 22). This entry is the SESSION-liveness instance (status useless -> pid process-liveness + `procStart` field 22). Both: field-22 start-time beats a recorded status/id.

(*FR:Callimachus*)
