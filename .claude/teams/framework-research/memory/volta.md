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

[DECISION] 2026-04-09 — Head-scratcher #13 (shared PURPLE): NO. Same-branch parallel pairs → cross-pair write conflict. Worktree pairs → context-switching cost exceeds savings. PURPLE scales linearly with TDD pairs.

[PATTERN] 2026-04-09 — Research team wiki domain: META-knowledge (map of what team knows), not research output itself. Topic files stay in topics/, wiki indexes them. apex-research API inventory stays in output dirs; wiki holds patterns/gotchas/decisions about the inventory.

[DECISION] 2026-04-09 — PO MEMORY.md vs team wiki: DELIBERATELY SEPARATE. Different scope (cross-team vs single-team), audience (PO vs agents), lifecycle. Bridge adds complexity for marginal benefit. PO's manual curation is the promotion mechanism and it works.

[CHECKPOINT] 2026-04-09 11:39 — Posted round 4 on Discussion #47 (head-scratchers 13/14/15).

[DECISION] 2026-04-09 — Lookahead should be adaptive, not static. Max_lookahead is team-configured upper bound (default 1); effective depth adjusts to rolling PURPLE rejection rate. Lookahead cancellation: preserve on first rejection, ARCHITECT-reviews on second (three-strike path).

[DECISION] 2026-04-09 — PURPLE shutdown watchdog: monitor git working tree state, NOT wall-clock. Polls every 10s. Exit states: clean exit (shutdown_approved), atomic commit (working tree clean + new commit), hung (60s unchanged + no commits → force revert), stuck mid-refactor (3min changes no commits → team lead intervenes once).

[PATTERN] 2026-04-09 — Health sensor audit: 5 of 6 signals preserved in T09. Missing: single-source knowledge (concentration risk). Refinable: stale-but-accessed needs hot/cold split, query clustering needs domain density framing.

[PATTERN] 2026-04-09 — Oracle adoption trigger: scratchpad duplication threshold (30 [LEARNED]/[PATTERN] entries across team of 5+), not voluntary. Measured at Shutdown Phase 2c, decided by PO, next session spawns Oracle with intake interview. Additional trigger: team size >=7-8 (Phase 2 cognitive overload).

[CHECKPOINT] 2026-04-09 12:22 — Posted round 5 on #46 and #47.

[LEARNED] 2026-04-09 — T09 v2 composed my git-state watchdog with Monte's 5-minute authority + Medici's [DEFERRED-REFACTOR] Oracle handoff. Three-way integration is cleaner than my standalone proposal — watchdog IS the timing mechanism, Monte's boundary activates authority, Medici's submission bridges memory across forced reverts.

[CHECKPOINT] 2026-04-09 13:06 — Posted round 6 ACK on #47. All 6 round-5 contributions verified in T09 v2 (commits ad367f1 + c59bc76). Position accurately rendered.

[DEFERRED] — #48 (Oracle tier downgrade path) accepted by Celes as T09 v3 scope. She takes assignee. My lifecycle-analysis offer on transition mechanics accepted — loop-in coming when v3 starts (after T04 amendments). Three v3 questions to address: one-session vs transition session, wiki ownership post-downgrade, oracle-state.json re-adoption semantics.

[LEARNED] 2026-04-09 — Multi-round consensus value in one sentence (Celes): "Writing them side by side in round 4 made the composition visible." Three-way mid-cycle-shutdown integration emerged because standalone proposals sat next to each other, not because any single author reached it. This is why PO requested the Multi-Round Consensus Protocol section (c59bc76) — the pattern is load-bearing.

[DEFERRED] — Draft T06 Phase 3 amendment for PURPLE grace period watchdog. T09 v2 "Mid-Cycle Shutdown: Watchdog + Team Lead Authority" (line 259) is the spec. Cross-topic change, send to team-lead for review before updating T06.

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
