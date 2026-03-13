# Finn's Scratchpad — framework-research

## [INDEX] 2026-03-13 — Session 1 startup

**Reference material available:**

- `reference/rc-team/cloudflare-builders/` — original RC team (11 agents, rc-oriented, tmux/SSH based)
  - common-prompt.md, eilama-concept.md, 11 agent prompts, 10 memory files
- `reference/hr-devs/` — evolved project team (9 agents, local + RC hybrid)
  - common-prompt.md, eilama-concept.md, 9 agent prompts, 7 memory files
  - docs/: startup-shutdown.md (canonical), tmux-layouts.md, api-contracts.md, architecture-decisions.md, health-report.md, test-gaps.md
  - spawn_member.sh (shell-based spawning, reads roster)
- `topics/` — 8 design topic files, all at "brainstorm" status (stubs only)
- `README.md` — mission overview, topic table, context

**Team size:** 3 agents (team-lead opus-4-6, finn sonnet-4-6, medici sonnet-4-6)

## [PATTERN] 2026-03-13 — Key differences between rc-team and hr-devs

1. **Spawning mechanism:** rc-team uses Agent tool; hr-devs uses `spawn_member.sh` (shell, reads roster, spawns into named tmux panes)
2. **Memory layout:** rc-team: single `memory/` flat; hr-devs: `memory/` (scratchpads) + `docs/` (shared knowledge) — cleaner separation
3. **Startup procedure:** hr-devs has canonical `docs/startup-shutdown.md`; rc-team has it inline in common-prompt.md
4. **Medici role:** both teams have Medici (health auditor), hr-devs version has more detailed audit checklist (6 categories vs implied)
5. **Attribution prefix:** rc-team uses `(*RC-DEV:Name*)`; hr-devs inherits same prefix (not yet updated to `(*HR-DEV:Name*)`)

## [PATTERN] 2026-03-13 — Finn's role across both teams

- Read-only except own scratchpad + delegated topic files
- Spawns haiku subagents for parallel data gathering (rc-team memory shows this in practice)
- Acts as research broker — saves other agents' tokens on exploration
- Never writes code, never creates external issues without explicit instruction

## [CHECKPOINT] 2026-03-13 — Session 2: Patterns extracted to all 8 topic files

All 8 topics now have `## Patterns from Reference Teams (*FR:Finn*)` sections.
Sources read: both common-prompts, both rosters, both team-lead prompts, both finn prompts, hr-devs medici prompt, hr-devs sven/dag/arvo prompts, startup-shutdown.md, eilama-concept.md.

Key patterns documented by topic:
- 01 taxonomy: roster structure, model tiering, non-Claude agents (eilama), named config presets
- 02 isolation: serialized git ownership, worktree isolation, branch strategy, Figma rate-limit protocol
- 03 communication: timestamped messages, Finn broker pattern, attribution rules, dashboard, shutdown report format
- 04 hierarchy: 2-level flat hierarchy, team-lead restrictions, peer policing, Jira human-gated
- 05 identity: shared ~/.claude/.env, honor-based attribution, no escalation path, no per-team isolation
- 06 lifecycle: human-initiated creation, medici-first, shell-script spawning evolution, scratchpad tags, TeamDelete forbidden
- 07 safety: prompt-level guardrails, quality gates, Known Pitfalls section as living safety list
- 08 observability: Medici 6-category audit, shutdown reports, attribution trail, code review in Reviews API

(*FR:Finn*)
