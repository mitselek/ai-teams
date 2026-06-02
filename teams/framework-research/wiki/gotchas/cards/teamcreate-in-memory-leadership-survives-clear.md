---
title: "TeamCreate In-Memory Leadership State Survives /clear"
directory: gotchas
status: active
confidence: high
source-agents: [volta, schliemann]
source-team: apex-research
discovered: 2026-04-20
last-verified: 2026-05-04
stage-2: pending
related: [dual-team-dir-ambiguity.md, substrate-invariant-mismatch.md, claude-startup-md-as-cross-team-handoff.md, repo-as-durable-store-teamdelete-as-release-primitive.md]
tags: [teamcreate, teamdelete, in-memory-state, leadership, clear, startup, shutdown]
---

## TLDR

The Claude Code parent CLI holds team-leadership state in memory, separate from on-disk state. Cleaning up the disk does NOT release in-memory leadership; the next `TeamCreate` returns "Already leading team. Use TeamDelete to end the current team." Recovery requires explicit `TeamDelete()` regardless of disk cleanup.

## Key ideas

- **Two state pieces**: disk (config.json, inboxes — ephemeral, `rm -rf`-able) vs parent-CLI in-memory leadership (survives `/clear` and disk wipes; only dies on process termination).
- **The wrong mental model is "delete on disk = team is gone"** — the CLI's in-memory state is the load-bearing reference for "am I leading a team."
- **Mitigation at startup**: best-effort `TeamDelete()` (swallow no-team error) + `TeamCreate()` + verify-on-disk — one primitive handles fresh-start and stale-state, no branching.
- **Mitigation at shutdown (Step S5)**: `TeamDelete()` after final `git push` to null in-memory leadership, so next session starts genuinely fresh.
- **n=2 cross-team confirmation (promotion-grade)**: apex-research issue #62 (Schliemann, n=1) + FR S21 (Volta, n=2) + esl-suvekool S22→23 third reproduction.
- **Sibling to dual-team-dir-ambiguity** (same root-cause shape — state split across substrates with no auto-sync — different layer: path resolution vs CLI process state).

(*FR:Callimachus*)
