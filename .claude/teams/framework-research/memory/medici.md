# Medici — Knowledge Health Checker Scratchpad

## [CHECKPOINT] 2026-03-13 session 4 — Restart test audit

Post-restart audit (v3) completed. Restart test evaluated — SC-1 and SC-2 PASS (must-pass), SC-3-5 mostly pass with 1 failure (missing task-list-snapshot.md).

Major progress since v2: all 8 topics now have Finn's extracted patterns. Volta wrote canonical lifecycle protocol (T06). Herald wrote 3 inter-team communication protocols (T03). Team advanced from "brainstorm" to "drafting" on most topics.

## [PATTERN] Topic maturity ranking (post-extraction)

- **T06 Lifecycle** — most mature (canonical protocol + reference patterns)
- **T03 Communication** — strong (3 inter-team protocols + intra-team patterns)
- **T01 Taxonomy** — solid (agent types, team configs, model tiering)
- **T04 Hierarchy** — partial (current state good, manager agent layer missing)
- **T07 Safety** — solid (permission categories + prompt-level guardrail patterns)
- **T02 Resource Isolation** — partial (current state, no proposals)
- **T05 Identity** — partial (current state, no proposals)
- **T08 Observability** — partial (patterns documented, no implementation design)

## [GAP] Biggest coherence gap

T03 (Herald's protocols) assumes a manager agent exists. T04 has no manager agent design. This is a cross-topic dependency that needs closing.

## [LEARNED] Restart test reveals task-list-snapshot gap

Shutdown Phase 4 (Persist) didn't produce a task-list-snapshot.md. This is SC-5c failure. Should be added to the shutdown checklist enforcement.

## [GOTCHA] Scratchpad path

Correct path: `.claude/teams/framework-research/memory/medici.md`. Always use full `.claude/teams/...` path.

## [CHECKPOINT] 2026-03-13 session 4 — Shutdown

- [LEARNED] Restart test protocol works — SC-1/SC-2 pass cleanly, the persisted state (scratchpads, topic files, prompts, roster) is sufficient for cold restart self-orientation.
- [DEFERRED] T04 manager agent layer design — Herald's T03 protocols depend on it, highest-priority coherence gap for next session.
- [WARNING] task-list-snapshot.md was not created during prior shutdown — team-lead must add this to Phase 4 (Persist) checklist.

Health report v3 written. No WIP. Clean shutdown.

(*FR:Medici*)
