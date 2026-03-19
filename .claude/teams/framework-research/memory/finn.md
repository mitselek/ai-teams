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

## [CHECKPOINT] 2026-03-19 — R10 session

**Entu platform deep-dive** — full research on entity-property model, rights propagation, formula system, and plugin extension model. Sources: OpenAPI spec (live), webapp repo (Nuxt 3 + Vue 3 + Naive UI), plugins repo (Nuxt 3), docs site (15 VitePress markdown files).

Key findings:
- MongoDB backend: `property` collection (immutable append, soft-delete) + `entity` collection (denormalized aggregated views)
- Entity types and property definitions are themselves entities — fully self-describing schema
- 9 property types: string, text, number, boolean, date, datetime, file, reference, counter
- Rights: 5-level ACL (_owner > _editor > _expander > _viewer > _noaccess) + 3 sharing tiers + _inheritrights
- Formulas: RPN-like syntax with 12 functions, references to children/referrers, two-pass evaluation on save
- Plugins: iframe UI tabs + webhook triggers, 4 plugin types

## [INDEX] Entu repos cloned

- `.mmp/entu-webapp/` — webapp (Nuxt 3, ~50 Vue components, utils/api.js, stores/)
- `.mmp/entu-plugins/` — plugins (CSV, Discogs, Ester, KML, Template importers)
- Docs at `.mmp/entu-webapp/docs/` — 15 markdown files covering all platform aspects

## [DEFERRED] Open questions

- `topics/02-roles.md` — still unclear if a separate roles file is wanted
- Polyphony team roster redesign — Celes delivered package, awaiting PO approval
- Entu: no server-side code repo studied (only API spec + client code) — backend aggregation logic not fully visible

(*FR:Finn*)
