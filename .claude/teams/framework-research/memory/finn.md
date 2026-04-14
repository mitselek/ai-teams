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

## [CHECKPOINT 2026-04-14] uikit-dev harvest delivered

Full report: `docs/uikit-dev-harvest-2026-04-14.md`. Key finds: A7 steal-back (FR `restore-inboxes.sh` has latent inline-jq bug + semantic divergence from uikit-dev's extracted filter), A10 cross-pollinate (uikit-dev `ephemeral-snapshot-2026-04-14/MANIFEST.md` = empirical reference for Volta's persist/restore ship session), B3 wiki governance is divergent-not-substrate-variant (project-handbook vs methodology-kb, do NOT wire into Cal's n=2 substrate-invariant-mismatch candidate), B7 `b47544b` is pane-labels root-cause confirmation at structural layer (NOT n=2 — same instance viewed deeper). Three Cal Protocol A candidates queued for post-freeze: pane-labels addendum, memory-as-load-gated-surface pattern, wiki-governance-split pattern (lowest priority, wait for n=3). Six D-section questions queued for team-lead's tmux-direct routing decision to Aalto. No writes in evr-ui-kit, no branch switches, no subagent spawning, no cross-team contact — all constraints honored.

## [LEARNED 2026-04-14] Nomenclature overload is infrastructure debt

"Memory" is two distinct filesystem paths with two distinct substrate semantics: (1) `.claude/teams/<team>/memory/` = team scratchpads, in-repo, durable, cross-operator-visible; (2) `~/.claude/projects/<slug>/memory/` = Claude per-user auto-memory, runtime, per-operator. Volta's `persist-project-state.sh` addresses (2); Cal's gotcha `persist-project-state-leaks-per-user-memory.md` addresses (2); uikit-dev's `e543109 move scratchpads into repo` addresses (1). Section B2 briefly conflated them before I disambiguated. **The ambiguity is exactly why Cal's leak was easy to introduce.** Separate vocabulary (call (2) "auto-memory") would have made the hazard visible earlier. Worth fixing before the ship session, not after.

## [CHECKPOINT] 2026-04-10 — Bioforge roster research — COMPLETE

Researched bioforge project (`~/Documents/github/mitselek/projects/bioforge/`) for XP roster design. Key findings delivered to team-lead:
- Project at end of Phase 3 (11/16 core modules done, 220 tests passing, 68 commits)
- Recommended Cathedral tier, single pipeline, 5 agents (team-lead+ARCHITECT merged, RED sonnet, GREEN sonnet, PURPLE opus, optional Oracle)
- Used raamatukoi-dev as primary reference design (9-agent Cathedral with dual pipelines)
- T09 v2.3 "opus bookends, sonnet executes" applied to model tier recommendations
- Team-lead confirmed research shaped the final deployed design

## [DEFERRED] Open questions

- Polyphony team roster redesign — awaiting PO approval
- Entu: no server-side code repo studied
- #56: cost data not yet gathered for single-vs-multi comparison
- #56: provider unavailability emergency protocol — agreed as actionable deliverable by all 6 agents
- **Six Aalto questions from uikit-dev harvest Section D** — PO deferred routing per 2026-04-14 shutdown brief. Wait for next natural uikit-dev contact, then decide subset. Ranking: Q1 (feedback.md auto-load mechanism) + Q4 (librarian-equivalent role) highest; Q6 (Protocol A/B rejection reasoning) + Q3 (flat-vs-taxonomic wiki) medium; Q2 (#92 pruning / Rams cadence) + Q5 (rename history) lower.
- **Follow-up harvest check on sibling teams** — per B7, cheap cross-check of `cloudflare-builders`, `raamatukoi-dev`, `screenwerk` rosters to see if any use role-IDs-as-agent-addresses. Second-team-with-same-root-cause would be the true n=2 for pane-labels pattern promotion. Not this session.

## [LEARNED 2026-04-14 shutdown] Cross-team harvest has n-way leverage that within-team audit lacks

Team-lead's accept framed the three n-way gains cleanly: (a) latent FR bug Volta's audit couldn't surface — her scope was the NEW WIP scripts, not the EXISTING persist/restore pair, so cross-team view naturally expanded audit scope; (b) taxonomic distinction "same instance viewed deeper vs second independent instance" that only external evidence can force — saved Cal from promoting n=1 to n=2 on weak evidence; (c) architectural divergence framing in B3 that reframed the question from "convergence vs correction" to "load-bearing domain split." Cadence suggestion from team-lead: "quarterly + on-demand when a sibling team ships a major refactor." Worth remembering next time I return to this role.

## [WARNING] Session 8 boundary constraints were strict and load-bearing

Every constraint from the spawn brief mattered: read-only across both repos, no branch switching in evr-ui-kit, no subagent spawning (even though parallel haiku reads would have been cheaper), no direct contact with uikit-dev agents. All honored. Future harvests: replicate this boundary model — it forces synthesis into the report rather than information-gathering sprawl. The "narrow brief + strict boundaries" combination is the right envelope for this role.

## [UNADDRESSED] None

All items from team-lead's brief completed: Sections A (per-innovation 10 items), B (7 specific overlaps), C (Cal + Volta data points), D (6 open questions queued for routing), report saved to `docs/uikit-dev-harvest-2026-04-14.md`, scratchpad checkpoint + learned entries added. Shutdown-phase closing entries now written. Ready to approve.

(*FR:Finn*)
