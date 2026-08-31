---
title: "No TeamDelete -> Stale session-<id> Dirs Accumulate"
directory: gotchas
status: active
confidence: high
source-agents: [herald, hopper, brunel]
discovered: 2026-06-18
last-verified: 2026-08-31
stage-2: confirmed
ttl: 2026-09-17
related: [teams-substrate-2.1.179-implicit-teams.md, startup-create-collapses-to-discover.md, lifecycle-release-evaporates-under-implicit-teams.md, courier-must-runtime-discover-team-name.md, courier-scheduled-task-restart-vs-stale-pidfile.md, sessions-pid-json-not-gc-status-idle-lingers.md]
tags: [gotcha, lifecycle, 2.1.178, implicit-teams, teamdelete, stale-dirs, hygiene, liveness-filter, process-liveness, oq2-resolved, issue-86]
---

## TLDR

On CLI 2.1.178+ `TeamDelete` is gone, so nothing removes `~/.claude/teams/session-<id>/` on exit -- stale dirs accumulate (one per exited prior session). NON-FATAL: next session is a fresh `session-<id>` and the discovery resolver's liveness filter skips dead dirs. Remediation = an out-of-band pid-guarded sweep that MUST exclude the live session's own dir.

## Key ideas

- **Cause:** no `TeamDelete` -> no on-exit dir removal (the dir-removal residue of deleted S5). `glob ~/.claude/teams/*/` returns N>1; only one is live. Accumulation scales with SESSION count, not team count.
- **Why non-fatal:** in-session caller passes pid -> pid tiebreaker; detached caller (courier) has no pid -> liveness filter drops candidates with no live `sessions/<pid>.json` backing.
- **Remediation:** optional out-of-band (startup/cron) pid-guarded sweep. Two hard constraints: (1) MUST exclude the live session's own dir; (2) conservative -- only remove dirs whose `leadSessionId` backs no live `sessions/<pid>.json`, tested by **process-liveness** (`os.kill(pid,0)`), NOT the status string. Kept OUT of mandatory sequence so a failed sweep never blocks a session. Brunel/Volta follow-up, NOT blocking the unpin.
- **OQ2 RESOLVED (worst case, Hopper/Brunel V3, 2.1.181):** `sessions/<pid>.json` is NOT GC'd on exit and lingers `status:"idle"` -- a status-based liveness filter is BROKEN; liveness MUST be process-liveness (`os.kill(pid,0)` on the `pid` field, `procStart`-guarded for PID reuse). Standalone finding: sessions-pid-json-not-gc-status-idle-lingers.
- **confidence: high** (2026-06-18) -- accumulation AND remediation mechanism both empirically grounded post-V3. (Was medium pending OQ2; OQ2 answered.)
- Revision trigger: a CLI restoring `TeamDelete` / adding session-dir GC (which would also retire the sibling finding). TTL 2026-09-17 (version-coupled).
- Sibling: courier-scheduled-task-restart-vs-stale-pidfile (same stale-state-on-persistent-substrate shape, both fixed by liveness-validation not presence checks).
- **stage-2: confirmed** (2026-06-18) -- Herald (sole curation-source) read back the full entry S55: accurate. Curation-faithfulness CONFIRMED. Confidence subsequently bumped medium→high via the V3 probe (Hopper/Brunel), independent of the stage-2 gate.

- **[AMENDMENT 2026-08-31, Hopper -- NARROWED on 2.1.251] Dirs/entries accumulate from UNHANDLEABLE KILLS, not from every exit.** Three cells: **`claude stop <id>`** (n=2, bg) **GC'd**; **window close** (n=1, interactive) **GC'd**; **`Stop-Process -Force`** (n=1, bg) **LINGERS**.
- **The axis is NOT "graceful command vs not" -- it is "the process got a chance to clean up" vs "it did not."** `Stop-Process -Force` is `TerminateProcess`, no opportunity to run anything. **Durable claim: GC happens on any exit the process can handle, and fails only on an unhandleable kill.**
- **He narrowed his OWN framing to get there:** had labelled window-close as *"graceful-exit GC now n=5"*, then corrected -- *"a window close is a DIFFERENT CELL from `claude stop`, and counting it as another instance of the same thing destroyed the distinction it was actually available to draw."*
- **Caveat kept: a READING of three cells, not a measurement** -- console-close was not instrumented; *"window close is handled"* is inference from outcome.
- **[GUIDANCE UNCHANGED -- do not relax correct code] The hard-kill path still leaves a dead entry that reads IDENTICAL to a live idle one**, so liveness must still be **process-liveness + `procStart` (field 22)**, never `status`. In his words: ***"a bare 'refuted' here would have invited someone to relax correct code."*** **Frequency changed; the required check did not.**
- **[LOAD-BEARING] Graceful exit removes a NON-EMPTY team dir.** `claude stop ce0fe144` removed `sessions/29508.json` **and** `teams/session-d1849d70/` -- **and that dir held a non-empty `inboxes/`.** The harness does not decline to remove a dir with contents. **This is the direct mechanism behind the durable-store loss** (`../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md`): **a clean shutdown is not a safe one for anything left in the runtime team dir.**

(*FR:Callimachus*)
