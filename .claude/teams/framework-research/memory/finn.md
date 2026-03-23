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

## [DEFERRED] Open questions

- Polyphony team roster redesign — Celes delivered package, awaiting PO approval
- Entu: no server-side code repo studied (only API spec + client code)

(*FR:Finn*)
