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
