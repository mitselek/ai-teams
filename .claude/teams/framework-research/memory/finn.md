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

**Team size:** 3 agents (team-lead opus-4-6, finn opus-4-6, medici sonnet-4-6)

## [PATTERN] Key differences between rc-team and hr-devs

1. **Spawning:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh` (shell, reads roster)
2. **Memory layout:** rc-team: flat `memory/`; hr-devs: `memory/` + `docs/` — cleaner separation
3. **Startup:** hr-devs has canonical `docs/startup-shutdown.md`; rc-team inlines in common-prompt.md
4. **Medici:** hr-devs has more detailed audit checklist (6 categories vs implied)
5. **Attribution:** rc-team `(*RC-DEV:Name*)`; hr-devs same (not yet updated)

## [CHECKPOINT] 2026-03-13 — All 8 topics populated

All 8 topics have `## Patterns from Reference Teams (*FR:Finn*)` sections.
Sources: both common-prompts, both rosters, both team-lead prompts, both finn prompts, hr-devs medici/sven/dag/arvo prompts, startup-shutdown.md, eilama-concept.md.

Topics covered: taxonomy, isolation, communication, hierarchy, identity, lifecycle, safety, observability.

## [CHECKPOINT] 2026-03-13 — Session 3 (opus respawn)

- Respawned on opus-4-6 (was sonnet-4-6)
- No new research tasks assigned in this session
- Shutdown for planned restart test

## [CHECKPOINT] 2026-03-13 — Session 4

- Spawned on opus-4-6, startup completed, no tasks assigned
- Immediate shutdown requested by team-lead

## [DEFERRED] Open question

No `topics/02-roles.md` exists — team-lead's batch 2 task referenced it but file is `02-resource-isolation.md`. Clarify if a separate roles file is wanted.

(*FR:Finn*)
