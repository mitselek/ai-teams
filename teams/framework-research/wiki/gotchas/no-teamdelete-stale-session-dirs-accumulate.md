---
name: no-teamdelete-stale-session-dirs-accumulate
description: With TeamDelete gone on CLI 2.1.178+, nothing removes the on-disk ~/.claude/teams/session-<id>/ dir on session exit, so stale session-<id> dirs accumulate (one per crashed/exited prior session). NON-FATAL -- the next session is a fresh session-<id> and the discovery resolver's PROCESS-liveness filter skips dead dirs -- but remediation needs an out-of-band pid-guarded sweep that MUST exclude the live session's own dir. OQ2 RESOLVED (Hopper/Brunel V3, 2.1.181): sessions/<pid>.json is NOT GC'd and lingers status:idle, so liveness MUST be process-liveness not status -- see sessions-pid-json-not-gc-status-idle-lingers.
type: gotcha
source-agents:
  - herald
  - hopper
  - brunel
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/docs/lifecycle-rework-implicit-teams-2026-06-18.md
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
  - teams/framework-research/docs/migration-validation-probe-findings-2026-06-18.md
source-commits:
  - b37b938
source-issues:
  - mitselek/ai-teams#86
related:
  - references/teams-substrate-2.1.179-implicit-teams.md
  - decisions/startup-create-collapses-to-discover.md
  - decisions/lifecycle-release-evaporates-under-implicit-teams.md
  - decisions/courier-must-runtime-discover-team-name.md
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - gotchas/sessions-pid-json-not-gc-status-idle-lingers.md
ttl: 2026-09-17
---

# No `TeamDelete` -> stale `session-<id>` dirs accumulate

## Symptom

On CLI **2.1.178+**, `TeamDelete` is gone (see [[lifecycle-release-evaporates-under-implicit-teams]]), so **nothing removes the on-disk `~/.claude/teams/session-<id>/` dir on session exit.** Every crashed or exited prior session leaves an inert `session-<id>` dir behind. Over many sessions, `~/.claude/teams/` fills with dead dirs -- so `glob ~/.claude/teams/*/config.json` can return N>1 candidates, only one of which is the live session's.

## Why it is NON-FATAL

The next session derives its own **fresh** `session-<id>` and ignores leftovers. The discovery resolver (`resolve_team_dir`, see [[startup-create-collapses-to-discover]] / [[courier-must-runtime-discover-team-name]]) handles the multi-dir case:

- **In-session caller (lifecycle):** passes its live `session_pid` -> the pid tiebreaker selects the right dir directly.
- **Detached caller (courier):** has no pid -> the **liveness filter** cross-references each candidate dir against `sessions/<pid>.json` and **drops candidates with no live backing**, killing stale dirs *without* needing the caller's own pid. **The filter MUST test process-liveness (`os.kill(pid,0)` on the entry's `pid` field), NOT the `status` string** -- see the critical correction below.

So accumulation costs disk (small JSON dirs) and a discovery-disambiguation burden, but does not break anything. Accumulation scales with **session count**, not team count.

## Remediation: out-of-band, pid-guarded sweep -- NOT a mandatory lifecycle step

The fix is an **optional** startup-time or cron sweep that removes `~/.claude/teams/session-*/` dirs not backed by a live session. Two hard constraints:

1. **It MUST exclude the live session's own dir** (pid-keyed / `leadSessionId` check). Sweeping your own live dir is self-sabotage.
2. **It must be conservative** -- only remove dirs whose `config.json` `leadSessionId` corresponds to *no* live `sessions/<pid>.json`.

It is deliberately kept **OUT of the mandatory startup/shutdown sequence** so that **a failed sweep never blocks a session.** Sweep ownership is a Brunel/Volta platform-substrate follow-up (it touches the container/host filesystem lifecycle), explicitly NOT blocking the CLI unpin.

## OQ2 RESOLVED (worst case) -- liveness MUST be process-liveness, not status

> **RESOLVED 2026-06-18 (Hopper V3 + Brunel, probe-verified on CLI 2.1.181 -- `docs/migration-validation-probe-findings-2026-06-18.md`).** The OQ2 question ("does a dead session's `sessions/<pid>.json` read as dead?") got the **worst-case answer: NO.** `sessions/<pid>.json` is **NOT garbage-collected on exit** (neither graceful `/exit` nor `kill -9`), and the dead entry **lingers with `status:"idle"`** -- the identical value a live idle session carries. **A status-based liveness filter is therefore BROKEN** -- it classifies a dead idle-lingering session as live. The fix: the liveness filter MUST test **process-liveness** -- `os.kill(pid, 0)` / `/proc/<pid>` on the entry's `pid` field, PID-reuse-guarded via `procStart` -- NOT the `status` string. Full finding + verbatim dead-entry bodies: [[sessions-pid-json-not-gc-status-idle-lingers]].

**Confidence raised to `high`** (2026-06-18): both the accumulation behavior (no `TeamDelete` -> no cleanup) AND the remediation mechanism are now empirically grounded. The remediation text above and the sweep constraints below already assume process-liveness (a `pid`-keyed / `leadSessionId`-vs-live-`sessions/<pid>.json` check), which the V3 finding confirms is the *only* correct approach -- the earlier "status-based" reading of the filter would have been wrong. This entry's sweep design was process-liveness-shaped from the start; V3 retired the alternative.

## Revision trigger

- **Substrate change:** a future CLI that restores `TeamDelete` (or adds session-dir GC on exit) eliminates the accumulation -- revise/retire then.
- **Probe result (OQ2): RESOLVED 2026-06-18** -- WS3b V3 (Hopper/Brunel, 2.1.181) answered the GC question (worst case: not GC'd, lingers `idle`); folded above, confidence bumped medium→high, and the liveness mechanism corrected to process-liveness. The standalone finding lives at [[sessions-pid-json-not-gc-status-idle-lingers]]. Routing closed (arrived via Brunel rather than Herald -- same outcome). Re-confirm against [[teams-substrate-2.1.179-implicit-teams]] at its TTL (2026-09-17), and re-open if a future CLI starts GC'ing `sessions/<pid>.json`.

## Related

- [`decisions/lifecycle-release-evaporates-under-implicit-teams.md`](../decisions/lifecycle-release-evaporates-under-implicit-teams.md) -- the deletion of `TeamDelete`/S5 is the direct cause of this accumulation (the dir-removal residue of S5's old job lands here).
- [`decisions/startup-create-collapses-to-discover.md`](../decisions/startup-create-collapses-to-discover.md) -- the discovery resolver whose liveness filter / pid tiebreaker makes accumulation non-fatal.
- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the detached caller that relies on the liveness filter (no pid available).
- [`gotchas/sessions-pid-json-not-gc-status-idle-lingers.md`](sessions-pid-json-not-gc-status-idle-lingers.md) -- **the resolved OQ2 finding** (2.1.181): `sessions/<pid>.json` is not GC'd and `status:"idle"` lingers, so the liveness filter here MUST be process-liveness, not status. This entry's remediation depends on that finding being correct.
- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md) -- sibling "stale-state-on-a-persistent-substrate" failure mode (courier InstanceLock staleness across restart); both are stale leftovers on a substrate with no automatic GC, both fixed by liveness-validation rather than presence checks.

(*FR:Callimachus*)
