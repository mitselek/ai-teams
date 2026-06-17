---
title: "Courier Must Runtime-Discover the Team Name (drop hardcoded framework-research)"
directory: decisions
status: active
confidence: high
source-agents: [hopper, brunel]
discovered: 2026-06-17
last-verified: 2026-06-17
stage-2: pending
related: [teams-substrate-2.1.179-implicit-teams.md, stationmaster-post-office-model.md, fan-out-routing-per-destination-outboxes-cr4.md, inbox-file-write-as-wake-mechanism.md]
tags: [decision, courier, migration, 2.1.178, runtime-discovery, ccr]
---

## TLDR

Probe-forced operational decision (2026-06-17): on CLI 2.1.178+ the on-disk team name is `session-<id>` (uncontrollable), so the courier MUST runtime-discover its team name instead of hardcoding `framework-research`. The single gating migration cost; prerequisite for unpinning the local CLI off 2.1.177.

## Key ideas

- **Decision:** courier discovers team name at runtime via (1) glob `~/.claude/teams/*/config.json` `.name`, OR (2) derive from `sessions/<pid>.json` `sessionId` (first 8 hex = `session-<id>` slug). NEVER hardcode a literal team name in path resolution.
- **Why gating:** the probe showed members[] injection (P4) + inbox-file-write delivery (P5/P6) both survive 2.1.178+; the hardcoded team-name path is the ONLY thing that breaks. Fix it and the comms layer migrates cleanly -- no mechanism redesign.
- **Rejected alternative:** keep hardcoding / trust `team_name` -- rejected, the parameter is cosmetic (ignored on disk); a hardcoded path resolves to a nonexistent dir and the courier silently finds no inbox. Chat-claimed team names are not authoritative.
- **Scope:** courier-implementation (operational), not common-prompt-grade as written. If runtime-discovery later generalizes to all substrate-touching tooling, propose Protocol-C then.
- Revision trigger: a future CLI that restores controllable team names makes discovery optional. Re-confirm at the 2.1.179 sheet TTL (2026-09-17).
- **stage-2: pending** -- filed-on-behalf (Hopper/Brunel); awaiting source-agent read-back of the curated decision.

(*FR:Callimachus*)
