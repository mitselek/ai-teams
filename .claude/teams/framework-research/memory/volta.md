---

# Volta scratchpad

## R12 session (2026-04-08)

[DECISION] 2026-04-08 — Temporal ownership is a fourth git isolation model (T06 decision tree needs update). XP pipeline: one writer at a time, sequential handoff on single branch. Distinct from directory ownership (parallel writers, non-overlapping dirs).

[PATTERN] 2026-04-08 — XP pipeline spawn order is pipeline order: ARCHITECT first (must decompose before cycle starts), then RED+GREEN+PURPLE (can idle until handoff). Specialization of Phase 6, not replacement.

[PATTERN] 2026-04-08 — ARCHITECT's test plan is the critical cross-session handover artifact. Must be written to file immediately, not held in context. Without it, mid-cycle shutdown loses the story decomposition.

[CHECKPOINT] 2026-04-08 13:05 — Posted lifecycle analysis on Discussion #46 (temporal ownership, spawn order, mid-cycle shutdown).

[DECISION] 2026-04-08 — Wiki persistence: same git-commit model as scratchpads/inboxes. No new infrastructure. Librarian spawns after Medici, shuts down before team lead (last work agent to terminate). Active/archive partition prevents unbounded wiki growth.

[CHECKPOINT] 2026-04-08 13:18 — Posted lifecycle perspective on Discussion #47 (knowledge base + Librarian).

[DECISION] 2026-04-08 — Pushed back on PO Decision 5 ("agents must not read other scratchpads"). Rule should be scoped to work agents only. Medici, team lead need cross-scratchpad access for audit/shutdown. Librarian does NOT need it (sole-gateway model).

[PATTERN] 2026-04-08 — Promotion timing matches development cadence, not urgency. Serial teams (XP pipeline): shutdown-only. Parallel teams (2+ TDD pairs): mid-session via Librarian. Common-prompt promotion always at shutdown (needs team-lead review).

[PATTERN] 2026-04-08 — Sole-gateway Librarian is single point of failure. Needs periodic state checkpoint (.librarian-state.json) for crash recovery. Fallback: agents write [WIKI] to scratchpads, Librarian catches up on respawn.

[CHECKPOINT] 2026-04-08 20:05 — Posted round 2 on Discussion #47 (PO response analysis, mid-session promotion, SPOF concern).

[LEARNED] 2026-04-09 — Medici is NOT in deployed teams. Phase 5 (Audit) must work without Medici. In deployed teams with Librarian, Librarian replaces Medici as first-spawn for wiki health audit. Without Librarian, team lead self-audits.

[PATTERN] 2026-04-09 — SPOF recovery for Librarian: just respawn (PO correction). No circuit breakers, no fallback paths. Active/archive wiki partition keeps respawn context-loading cost manageable.

[DECISION] 2026-04-09 — Wiki source linking: optional source-files frontmatter field. Librarian checks git log at startup to flag potentially stale entries. Detection, not auto-correction.

[PATTERN] 2026-04-09 — Librarian as health sensor: observe and report, never instruct. Diagnostic section in closing report covers redundant queries, persistent gaps, submission health, source staleness. Team lead interprets and acts.

[CHECKPOINT] 2026-04-09 08:51 — Posted round 3 on Discussion #47 (corrections accepted, topics 8/9/10).

## R11 session (2026-03-23)

[CHECKPOINT] 2026-03-23 19:24 — Spawned, loaded scratchpad. No tasks assigned — Brunel handled provisioning solo. Clean shutdown.

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
