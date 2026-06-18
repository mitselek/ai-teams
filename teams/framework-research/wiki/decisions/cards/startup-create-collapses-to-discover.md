---
title: "Startup Step 2 (Create) Collapses to Step 2' (Discover)"
directory: decisions
status: active
confidence: high
source-agents: [herald]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
related: [teams-substrate-2.1.179-implicit-teams.md, courier-must-runtime-discover-team-name.md, lifecycle-release-evaporates-under-implicit-teams.md, teamcreate-in-memory-leadership-survives-clear.md, no-teamdelete-stale-session-dirs-accumulate.md]
tags: [decision, lifecycle, startup, 2.1.178, implicit-teams, teamcreate, discover, resolve-team-dir, issue-86]
---

## TLDR

WS2 lifecycle rework (#86, Aen-accepted 2026-06-18): on CLI 2.1.178+, startup Step 2 (TeamDelete + TeamCreate + verify) collapses to Step 2' Discover. The team auto-exists eagerly (P3), so the session discovers its `session-<id>` dir via the shared `resolve_team_dir` resolver and verifies operational, rather than creating.

## Key ideas

- **Collapse:** TeamDelete -> DELETE (tool gone, nothing to release); TeamCreate -> DELETE (tool gone + unneeded, team auto-exists eagerly P3); verify-config.json -> KEEP, repurposed as the discovery + operational gate.
- **Shared resolver:** same `resolve_team_dir(...)` the courier uses (WS1). ONE function, two callers. Lifecycle runs in-session, HOLDS the pid, passes it -> pid tiebreaker fires O(1) in multi-dir case. Courier detached, no pid -> glob `.name` (canonical) + liveness filter.
- **Resolution order:** explicit-override -> single-dir-glob (canonical) -> pid tiebreaker -> liveness filter -> FAIL FAST never-guess (no hardcoded-name fallback). Lifecycle calls CLI shim `--resolve-team-dir`.
- **No create-retry:** no create primitive to retry. Genuine absence = substrate fault -> STOP + report (do NOT hand-fabricate the dir; harness owns it). Rarer than old retry case.
- **Rejected:** keep TeamCreate / hand-roll mkdir+config.json -- tool gone; hand-writing races the harness eager write and forges platform-owned state.
- **Supersedes (version-coupled):** the startup TeamDelete+TeamCreate mitigation in teamcreate-in-memory-leadership-survives-clear, for 2.1.178+.
- Scope: courier/lifecycle implementation; startup.md + topic-06 SEQUENCE application is team-lead/Volta domain. Revision trigger: a CLI restoring TeamCreate. Re-confirm at 2.1.179 sheet TTL (2026-09-17).
- **stage-2: confirmed** (2026-06-18) -- Herald (sole source) read back the full entry S55: collapse table, shared-resolver framing, no-create-retry all faithful. Gate closed.

(*FR:Callimachus*)
