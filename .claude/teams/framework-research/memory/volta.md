---

# Volta scratchpad

## R10 session (2026-03-19)

[CHECKPOINT] 2026-03-19 20:24 — Spawned, loaded scratchpad, no tasks assigned before session end.

## R9 session (2026-03-18)

[DECISION] 2026-03-18 12:07 — Git Isolation Strategy Selection written into T06. Two archetypes: independent-output (worktree isolation) vs pipeline (directory ownership on trunk). Decision tree, lifecycle implications, upgrade/downgrade signals.

[PATTERN] 2026-03-18 — Worktree isolation is a DOWNGRADE for pipeline teams. Directory ownership on trunk gives conflict safety without visibility cost. Pipeline is a third archetype alongside independent-output and hybrid.

[DECISION] 2026-03-18 15:55 — Polyphony-dev lifecycle: startup.md (6-phase) + memory dir + 3 shared knowledge files written. Team classified as independent-output.

[DEFERRED] — Polyphony-dev common-prompt.md amendments: author attribution + team-lead shutdown protocol. Design approved in report, not yet written to file.

## R8 session (2026-03-17)

[PATTERN] 2026-03-17 — Hybrid teams need split git strategy. AMENDED R9: pipeline teams are a third category.

[PATTERN] 2026-03-17 — Observability is a byproduct, not a system.

## Prior patterns (retained)

[PATTERN] 2026-03-13 — Two-level startup design: protocol (T06) = framework-level; instance (startup.md) = machine-specific checklist.

[PATTERN] 2026-03-14 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR + $HOME.

## R6 (2026-03-14)

[DEFERRED] — Relay lifecycle findings for T06 (Phase 0.5, Phase 4.5). Awaiting approval.

[PATTERN] 2026-03-14 — Indirect spawning: when team-lead is a teammate, spawning is delegated.
