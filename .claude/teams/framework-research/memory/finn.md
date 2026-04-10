# Finn's Scratchpad — framework-research

## [INDEX] 2026-03-13 — Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents, rc-oriented, tmux/SSH based)
- `reference/hr-devs/` — evolved project team (9 agents, local + RC hybrid)
- `topics/` — 8 design topic files + T09 development methodology
- `designs/` — deployed: apex-research; new: penrose-dev, screenwerk, raamatukoi-dev, backlog-triage

## [PATTERN] Key differences between rc-team and hr-devs

1. **Spawning:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh`
2. **Memory layout:** rc-team: flat `memory/`; hr-devs: `memory/` + `docs/`
3. **Startup:** hr-devs has canonical `docs/startup-shutdown.md`
4. **Medici:** hr-devs has more detailed audit checklist (6 categories vs implied)

## [LEARNED] Team-lead self-check pattern

penrose-dev team-lead.md: "SELF-CHECK: Am I Doing The Work Myself?" with FORBIDDEN/ALLOWED tool lists. Worth adopting in future team designs.

## [PATTERN] Team sizing heuristic

team size = number of distinct abstraction boundaries, not number of deliverables

## [LEARNED] 2026-04-09 — Round 1 tone-setting for multi-round RFCs

Sharp round 1 with binary claims → agents push back → genuine convergence in rounds 3-4. Cautious round 1 → weak synthesis.

## [PATTERN] 2026-04-09 — Multi-Round Consensus Protocol

Seed → round 1 binary claims → round 2-3 refinement → round 4 PO → round 5 synthesis → round 6 ACK. Documented in T09 (c59bc76).

## [CHECKPOINT] 2026-04-09 — T09 cluster closed (6 of 6 ACKs)

Zero position divergences. T09 v2 committed at c59bc76. L2.5 dropped per my resolution request.

## [CHECKPOINT] 2026-04-10 — Discussion #56: Single-provider model strategy — IN PROGRESS

Discussion: <https://github.com/mitselek/ai-teams/discussions/56>

**Round 1 posted** (independent assessment):

- Surveyed all 9 teams, 68 agent slots: 43 opus, 24 sonnet, 1 local LLM (eilama)
- Position: single-provider currently optimal, no role is capability-bottlenecked
- Eilama pattern is the proven migration path if needed
- Only experiment: more eilama-class local LLMs (deepseek-coder for Python teams)
- Comment: <https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16516190>

**Round 2 posted** (reacting to all 6 R1 + Gemini synthesis):

- Zero position divergence across all 6 agents on core question
- Gemini overreached on: audit independence (0 incidents), visual QA (team does not exist), flattened Callimachus/Celes distinction
- Key emergent finding: lock-in is to Claude Code *platform*, not Anthropic *models* — conceptually separable
- Nobody provided cost data — qualitative arguments inconclusive both ways
- Three items for next round: (1) provider unavailability protocol, (2) platform-vs-provider distinction, (3) cost data
- Comment: <https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16517116>

**Consensus map:**

| Agent | Multi-provider acceptable for |
|---|---|
| Brunel | Sidecar services with clean API boundary |
| Callimachus | Execution roles with test-gated output only |
| Celes | Fire-and-forget mechanical roles, vision gap |
| Montesquieu | Audit independence (cautiously) |
| Herald | Mechanical execution with test verification |
| Finn | Eilama-class local LLMs |

**Gemini participated as external reviewer.** Synthesis was accurate on core consensus, overreached on recommendations.

**Discussion paused** before authority assignment. State saved, 3 Protocol A submissions filed by Callimachus (platform-vs-provider, external synthesis overreach, model inventory baseline).

## [CHECKPOINT] 2026-04-10 — D1 gotcha research — COMPLETE

Consolidated 10 D1 gotchas from 6 sources (hr-platform#36, dev-toolkit#38, sven/dag/finn scratchpads, issue #237, CLAUDE.md). Submitted to Callimachus via Protocol A. Filed as `wiki/gotchas/cloudflare-d1-migration-query.md` with 6-month TTL.

## [LEARNED] 2026-04-10 — Callimachus reclassifies submissions

Cal reclassified my "external synthesis overreach" from pattern to gotcha — correct call. Gotchas are traps to avoid, patterns are techniques to apply. Check before submitting.

## [DEFERRED] Open questions

- Polyphony team roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data not yet gathered for single-vs-multi comparison
- #56: provider unavailability emergency protocol — agreed as actionable deliverable by all 6 agents

(*FR:Finn*)
