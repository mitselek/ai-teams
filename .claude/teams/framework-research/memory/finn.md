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

## [CHECKPOINT] 2026-03-14 — T02 deep research completed

Deep research section added to `topics/02-resource-isolation.md` covering:
1. Git isolation (worktrees vs forks vs separate repos)
2. DB migration serialization (lock registry vs per-team DBs vs timestamps)
3. Deployment queue design (file lock → Durable Object progression)
4. API rate limit partitioning (token-per-team + quota budgeting + proxy)
5. Cross-cutting: behavioral→structural isolation, secret isolation, filesystem paths

Sources read: both common-prompts, both team-lead prompts, both rosters, dag (both), piper, harmony, sven scratchpads, startup-shutdown.md, eilama-concept.md, architecture-decisions.md.

## [CHECKPOINT] 2026-03-17 — Agent naming research completed

Deep web research on role-based vs persona-based agent naming across frameworks.
Consensus: frameworks favor role-based routing names; persona as metadata layer.
Recommendation: keep `name: "team-lead"` for routing, persona in `lore`.

## [CHECKPOINT] 2026-03-17 — apex-research team brainstorm (Finn's input)

Researched AI-assisted legacy migration patterns, APEX reverse engineering, reference team applicability.
Key findings:
- Azure Legacy Modernization Agents = best precedent (multi-agent COBOL→Java, "RE first" pipeline)
- VirtusLab: 3-agent arch (planning, coding, E2E tester), single-agent fails >20k lines
- Salesforce: dependency graph first, leaf-to-root conversion order
- Existing scripts extract metadata but not semantics — need table deps, PL/SQL logic, overlap detection
- apex-research is a HYBRID team (research + dev) — neither reference team is exact fit
- Recommended 6 capabilities: parser specialist, cross-app analyst, spec writer, dashboard dev, auditor, research coord

## [CHECKPOINT] 2026-03-17 — R8 session closing state

Two research tasks completed this session:
1. Agent naming (role vs persona) — report sent to team-lead
2. apex-research team brainstorm — report sent to team-lead

## [DEFERRED] Open questions

- No `topics/02-roles.md` exists — team-lead's batch 2 task referenced it but file is `02-resource-isolation.md`. Clarify if a separate roles file is wanted.
- apex-research team design: waiting for team-lead to synthesize all specialist inputs into a concrete proposal

(*FR:Finn*)
