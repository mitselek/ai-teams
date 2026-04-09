# Finn's Scratchpad — framework-research

## [INDEX] 2026-03-13 — Reference material

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents, rc-oriented, tmux/SSH based)
  - common-prompt.md, eilama-concept.md, 11 agent prompts, 10 memory files
- `reference/hr-devs/` — evolved project team (9 agents, local + RC hybrid)
  - common-prompt.md, eilama-concept.md, 9 agent prompts, 7 memory files
  - docs/: startup-shutdown.md, tmux-layouts.md, api-contracts.md, architecture-decisions.md, health-report.md, test-gaps.md
  - spawn_member.sh (shell-based spawning, reads roster)
- `topics/` — 8 design topic files, all populated with patterns
- `README.md` — mission overview, topic table, context

## [PATTERN] Key differences between rc-team and hr-devs

1. **Spawning:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh` (shell, reads roster)
2. **Memory layout:** rc-team: flat `memory/`; hr-devs: `memory/` + `docs/` — cleaner separation
3. **Startup:** hr-devs has canonical `docs/startup-shutdown.md`; rc-team inlines in common-prompt.md
4. **Medici:** hr-devs has more detailed audit checklist (6 categories vs implied)
5. **Attribution:** rc-team `(*RC-DEV:Name*)`; hr-devs same (not yet updated)

## [CHECKPOINT] 2026-03-23 — Penrose dev team design — COMPLETE

Research report delivered, then reviewed Celes's final design at `designs/new/penrose-dev/`.
Final team: 6 agents, ALL opus (team-lead, shechtman/test, ammann/geometry, bruijn/simulation, escher/renderer, penrose/reviewer).
Celes chose math-historian names and added a code reviewer role (penrose).

Review found 14 issues, all HIGH/MEDIUM resolved in final pass. Package approved for deployment.

## [LEARNED] Team-lead self-check pattern

penrose-dev team-lead.md introduced a "SELF-CHECK: Am I Doing The Work Myself?" section with explicit FORBIDDEN/ALLOWED tool lists. Strong pattern for preventing team-lead scope creep — worth adopting in future team designs.

## [GOTCHA] TAU constant in Penrose project

TAU = 1/PHI ≈ 0.618 (golden ratio reciprocal), NOT 2π. This is project-specific naming that conflicts with the common math convention.

## [PATTERN] Team sizing heuristic

- comms-dev: 4+lead for crypto+transport+QA — domain split by security boundary
- backlog-triage: 3+lead for pipeline — one agent per pipeline stage
- penrose-dev (proposed): 4+lead for math+sim+render+test — domain split by abstraction layer
- Pattern: team size = number of distinct abstraction boundaries, not number of deliverables

## [CHECKPOINT] 2026-04-09 — Discussion #47 Round 3 Response — POSTED

https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16500125
Synthesized all 6 agents' positions across 3 rounds. Key contributions:
- Convergence table (8 settled decisions) + divergence table (2 open questions)
- Bootstrap: 3-phase (inventory→approve→build), Librarian proposes, lead approves. "Don't migrate — index."
- Expiry: 3 mechanisms (source linking, TTL for experience-grounded, access tracking). PURPLE + Librarian complementary.
- Health sensor: knowledge velocity metric (discovery-to-warning ratio across sessions)
- New: TTL on experience-grounded entries (external APIs have no source files to diff)
- Connected #46 XP pipeline to #47 knowledge base (ARCHITECT/PURPLE as knowledge-generating roles)

## [CHECKPOINT] 2026-04-08 — Knowledge Base RFC Discussion — POSTED

GitHub Discussion #47: https://github.com/mitselek/ai-teams/discussions/47
"RFC: Shared Knowledge Base and Librarian Agent for Team Memory" — Ideas category
Inspired by Karpathy's LLM Wiki pattern. Covers: 4-tier knowledge architecture analysis, knowledge loss evidence table,
Librarian concept (ingest/cross-ref/dedup/promote/prune/index/query), wiki/ directory structure, knowledge flow diagram.
8 open questions. Tagged Herald + Celes. Key insight: knowledge loss happens at propagation, not discovery.

## [CHECKPOINT] 2026-04-08 — XP Pipeline RFC Discussion — POSTED

GitHub Discussion #46: https://github.com/mitselek/ai-teams/discussions/46
"RFC: XP Development Pipeline for AI Agent Teams" — Ideas category
Covers: background (weak REFACTOR phase), 3 research options (A/B/C), PO's pipeline model (Architect→RED→GREEN→PURPLE), open questions (6).
Tagged for Herald + Celes input. No topic file changes.

## [CHECKPOINT] 2026-04-06 — XP Triples Research — COMPLETE

Research report delivered to team-lead. Key findings:
- REFACTOR is the weakest phase across all current teams (vague ownership)
- Three options analyzed: Refactorer (A), Reviewer (B), Rotating (C)
- Recommended Option B: Tester + Developer(+REFACTOR) + Reviewer
- penrose-dev (Shechtman→Implementers→Penrose) is the closest existing pattern
- Reviewer should be formalized as 7th canonical role in T01
- Reviewer can be shared across 2-3 TDD pairs (Marcus pattern)
- Communication: RED→GREEN→REVIEW with [COORDINATION] and [REVIEW] tags

## [DEFERRED] Open questions

- Polyphony team roster redesign — Celes delivered package, awaiting PO approval
- Entu: no server-side code repo studied (only API spec + client code)

(*FR:Finn*)
