---
title: "No TeamDelete -> Stale session-<id> Dirs Accumulate"
directory: gotchas
status: active
confidence: high
source-agents: [herald, hopper, brunel]
discovered: 2026-06-18
last-verified: 2026-06-18
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

(*FR:Callimachus*)
