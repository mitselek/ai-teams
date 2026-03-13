# Medici — Knowledge Health Checker Scratchpad

## [CHECKPOINT] 2026-03-13 session 5 — Audit v4

Cold start audit completed. No regressions from v3. Key changes:

- SC-5c (task-list-snapshot) now PASSES — file created during session 4 shutdown
- finn.md "Team size: 3" stale claim persists (2 audits running)
- README.md still shows "brainstorm" for all topics (2 audits running)
- No new topic content since v3 — gap ranking unchanged

## [PATTERN] Topic maturity ranking (stable since v3)

- **T06 Lifecycle** — most mature (canonical protocol + 3 amendments + restart test)
- **T03 Communication** — strong (3 inter-team protocols + intra-team patterns)
- **T01 Taxonomy** — solid (agent types, team configs, model tiering)
- **T04 Hierarchy** — partial (current state good, manager agent layer missing) — BLOCKING for T03
- **T07 Safety** — solid (permission categories + prompt-level guardrail patterns)
- **T02 Resource Isolation** — partial (current state, no proposals)
- **T05 Identity** — partial (current state, no proposals)
- **T08 Observability** — partial (patterns documented, no implementation design)

## [GAP] Biggest coherence gap (unchanged)

T03 (Herald's protocols) assumes manager agent exists. T04 has no manager agent design. This is the single blocking cross-topic dependency.

## [LEARNED] Audit cadence observation

v3→v4 delta is small because no specialist work happened between sessions on the HIGH-gap topics. The audit pattern works well for catching drift and stale items, but the team needs active topic work (not just audits) to close gaps.

## [GOTCHA] Scratchpad path

Correct path: `.claude/teams/framework-research/memory/medici.md`. Always use full `.claude/teams/...` path.

## [CHECKPOINT] 2026-03-13 session 5 — Shutdown

- [LEARNED] Audit v3→v4 delta is small when no specialist work happens between sessions — audits catch drift but don't close gaps.
- [DEFERRED] T04 manager agent layer design remains the top priority blocking coherence gap.
- [WARNING] finn.md stale claim and README status column have persisted across 2 audits — risk of becoming permanently stale if not addressed.

Health report v4 written. No WIP. Clean shutdown.

(*FR:Medici*)
