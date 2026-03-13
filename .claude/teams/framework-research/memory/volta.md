---
# Volta scratchpad

[DECISION] 2026-03-13 18:00 — Wrote canonical startup/shutdown protocol into `topics/06-lifecycle.md`. Key design decisions:
- Startup is 6-phase: Sync → Clean → Create → Restore → Audit → Spawn
- Shutdown is 5-phase: Halt → Notify → Collect → Persist → Preserve
- Stale-team recovery IS the normal startup — no special recovery procedure needed (idempotent)
- Duplicate prevention must be a structural gate in spawn tooling, not in team lead memory
- Three spawning paths with clear decision tree: spawn_member.sh (RC/tmux), Agent tool (local), raw CLI (never)

[PATTERN] 2026-03-13 18:00 — Inbox preservation is the single most fragile lifecycle operation. TeamCreate requires empty dir but inboxes must survive. Framework improvement: TeamCreate should accept an --preserve-inboxes flag or handle this internally.

[LEARNED] 2026-03-13 18:00 — hr-devs is strictly more mature than rc-team: externalised startup doc, spawn_member.sh with duplicate gate, layout system. rc-team has startup inline in team-lead prompt with no built-in duplicate protection.

[DECISION] 2026-03-13 18:14 — Designed restart test plan at `docs/restart-test.md`. 5 success criteria groups (15 individual checks): self-orientation, startup execution, agent continuity, work product continuity, protocol correctness. SC-1 and SC-2 are must-pass; SC-3-5 are should-pass.

[CHECKPOINT] 2026-03-13 18:17 — Session complete. Both deliverables done: (1) canonical lifecycle protocol in `topics/06-lifecycle.md`, (2) restart test plan in `docs/restart-test.md`. No WIP. Clean shutdown.

[LEARNED] 2026-03-13 18:28 — Restart test field data from team-lead confirms: protocol is structurally correct but has 3 friction points. (1) Phase 2 lacks diagnostic preamble — team lead can't tell cold start from warm restart without extra investigation. (2) Task-list-snapshot placed in Shutdown Phase 4 (worst timing — lead is cognitively loaded, context near limit). (3) Local teams have no spawn automation — Agent tool lacks duplicate gate, prompt loading, and model selection.

[DECISION] 2026-03-13 18:33 — Wrote 3 amendments to topics/06-lifecycle.md based on restart test field data:
- Phase 2.0 Diagnose: classifies WARM RESTART / PARTIAL STATE / COLD START / MISCREATION before Clean
- Shutdown Phase 2a: task-list-snapshot moved from Phase 4 to Phase 2 (before agent shutdown, when lead has best task picture)
- Path 2.5 spawn_local.sh: local team spawn wrapper with duplicate gate + prompt assembly

[LEARNED] 2026-03-13 18:33 — Agent tool DOES support per-agent model selection via `model` parameter. Previous claim that it "ignores roster model" was wrong. Remaining local gaps: no duplicate gate, no prompt file loading.

[CHECKPOINT] 2026-03-13 18:35 — Session 2 complete. Deliverables: 3 amendments to topics/06-lifecycle.md (Phase 2.0 Diagnose, Shutdown 2a snapshot timing, Path 2.5 spawn_local.sh) + updated restart test plan. No WIP. Clean shutdown for second restart test.
