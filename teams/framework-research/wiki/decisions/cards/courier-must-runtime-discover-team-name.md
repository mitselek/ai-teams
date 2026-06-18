---
title: "Courier Must Runtime-Discover the Team Name (drop hardcoded framework-research)"
directory: decisions
status: active
confidence: high
source-agents: [hopper, brunel]
discovered: 2026-06-17
last-verified: 2026-06-18
stage-2: confirmed
related: [teams-substrate-2.1.179-implicit-teams.md, stationmaster-post-office-model.md, fan-out-routing-per-destination-outboxes-cr4.md, inbox-file-write-as-wake-mechanism.md, startup-create-collapses-to-discover.md, lifecycle-release-evaporates-under-implicit-teams.md, sessions-pid-json-not-gc-status-idle-lingers.md]
tags: [decision, courier, migration, 2.1.178, runtime-discovery, ccr]
---

## TLDR

Probe-forced operational decision (2026-06-17): on CLI 2.1.178+ the on-disk team name is `session-<id>` (uncontrollable), so the courier MUST runtime-discover its team name instead of hardcoding `framework-research`. The single gating migration cost; prerequisite for unpinning the local CLI off 2.1.177.

## Key ideas

- **Decision:** courier discovers team name at runtime via (1) **PRIMARY** glob `~/.claude/teams/*/config.json` `.name`, (2) **TIEBREAKER** derive from `sessions/<pid>.json` `sessionId` (first 8 hex = `session-<id>` slug). NEVER hardcode a literal team name in path resolution. Detached Scheduled-Task courier doesn't own the session pid, so glob (authoritative `config.json .name`, slug-drift-robust) leads.
- **Liveness-filter (THIRD disambiguator):** cross-reference candidate dirs against `sessions/<pid>.json` to drop stale dirs without the courier's own pid. **CRITICAL (V3): MUST be process-liveness (`os.kill(pid,0)` / `/proc/<pid>`, procStart-guarded), NOT the `status` string** -- sessions-json lingers `idle` for dead sessions ([[sessions-pid-json-not-gc-status-idle-lingers]]); the one must-fix before unpin, MERGED + validated per DECIDED-DIRECTION #2.
- **Why gating:** the probe showed members[] injection (P4) + inbox-file-write delivery (P5/P6) both survive 2.1.178+; the hardcoded team-name path is the ONLY thing that breaks. Fix it and the comms layer migrates cleanly -- no mechanism redesign.
- **Rejected alternative:** keep hardcoding / trust `team_name` -- rejected, the parameter is cosmetic (ignored on disk); a hardcoded path resolves to a nonexistent dir and the courier silently finds no inbox. Chat-claimed team names are not authoritative.
- **Scope:** courier-implementation (operational), not common-prompt-grade as written. If runtime-discovery later generalizes to all substrate-touching tooling, propose Protocol-C then.
- Revision trigger: a future CLI that restores controllable team names makes discovery optional. Re-confirm at the 2.1.179 sheet TTL (2026-09-17).
- **stage-2: confirmed** (2026-06-18 S56) -- both co-authors read back. Brunel (S55, 1of2) re-validated against V1/V2 + supplied the glob-PRIMARY/pid-TIEBREAKER/liveness-filter refinement; Hopper (S56, 2of2) confirmed all three load-bearing claims verbatim-faithful, no corrections (process-liveness must-fix=V3; glob-PRIMARY+V1 config-glob=probe RUN-2; single-gating-cost P4/P5/P6-survive=S54#4+S55 V5a). Brunel's refinement folded blockquote→body. Empirically validated on 2.1.181.

(*FR:Callimachus*)
