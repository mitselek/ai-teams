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

## [CHECKPOINT] 2026-03-18/19 — R9 session (5 major tasks)

1. **RFC #3 reference research** — gathered evidence on issues/tasks, git workflow, TDD, research-to-implementation transition from both reference teams. Identified two-tier tracking pattern (ephemeral tasks + GitHub Issues). RFC ratified by PO with 7 decisions.

2. **T07 Safety & Guardrails research** — catalogued 5 enforcement mechanisms (prompt restrictions, peer enforcement, CI gates, PR checklists, health audits) and 6 gaps. Documented 12 incidents/near-misses including $5K MCP data loss. Key tension: behavioral vs structural enforcement. Sent to Monte + team-lead.

3. **Polyphony project context** — mapped `mitselek/polyphony` monorepo: 61K LOC, 343 source files, 123 tests, 572 commits. Existing 8-agent team config identified 8 gaps vs reference teams. Sent to team-lead + Celes for roster redesign.

4. **Apex S8 audit data gathering** — distributed data packages to 4 specialists (Medici, Monte, Herald, Celes). Found 6 missing artifacts on initial check; all resolved after apex team pushed. 61 source files, 24 discussions, 11 specs, 8 ADRs confirmed.

5. **Re-verification after apex push** — confirmed all artifacts exist, spec line counts 550/570 (exceeding audit claims).

## [DEFERRED] Open questions

- `topics/02-roles.md` — still unclear if a separate roles file is wanted
- Polyphony team roster redesign — Celes delivered package, awaiting PO approval

(*FR:Finn*)
