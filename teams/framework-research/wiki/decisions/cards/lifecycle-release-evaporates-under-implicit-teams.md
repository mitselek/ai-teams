---
title: "Shutdown S5 (Leadership-Release) Evaporates Under Implicit Teams"
directory: decisions
status: active
confidence: high
source-agents: [herald]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
related: [teams-substrate-2.1.179-implicit-teams.md, courier-must-runtime-discover-team-name.md, startup-create-collapses-to-discover.md, teamcreate-in-memory-leadership-survives-clear.md, no-teamdelete-stale-session-dirs-accumulate.md]
tags: [decision, lifecycle, shutdown, 2.1.178, implicit-teams, teamdelete, issue-86]
---

## TLDR

WS2 lifecycle rework (#86, Aen-accepted 2026-06-18): on CLI 2.1.178+, shutdown Step S5 "Release team leadership" (`TeamDelete`) is DELETED, not replaced. Leadership is the implicit property of a live session, released by PROCESS EXIT. Shutdown 5 phases -> 4; the startup-P2/shutdown-P5 symmetry argument evaporates too.

## Key ideas

- **Decision:** S5 deleted. There is no `TeamDelete` to call and nothing to release -- process exit IS the release.
- **Why:** S5's rationale (in-memory leadership token, survives `/clear`, released only by `TeamDelete`) was explicit-team-specific. On 2.1.178+ leadership is implicit (lone session = 1-member self-led team, config.json eager -- P3); it isn't *held*, it just *is* while the process lives.
- **Symmetry gone:** no create/delete pair -> nothing to be symmetric about. New symmetry: startup *discovers*, shutdown *persists* + exits. Both about durable repo state, not leadership tokens.
- **Residue:** `TeamDelete` also removed the on-disk dir; that half has no substrate equivalent -> stale dirs accumulate (see no-teamdelete-stale-session-dirs-accumulate). Out-of-band hygiene, NOT a shutdown step.
- **Rejected:** new release primitive / `rm -rf` own dir at shutdown -- nothing to release; deleting the live session's own dir is self-sabotage.
- **Supersedes (version-coupled):** the S5 *mitigation* in teamcreate-in-memory-leadership-survives-clear, for 2.1.178+ only. Old entry stays (explicit-team-era arch-fact), with a supersession note -- NOT archived.
- Revision trigger: a future CLI restoring an explicit leadership token. Re-confirm at 2.1.179 sheet TTL (2026-09-17).
- **stage-2: confirmed** (2026-06-18) -- Herald (sole source) read back the full entry S55: faithful, all splits correct. Gate closed.

(*FR:Callimachus*)
