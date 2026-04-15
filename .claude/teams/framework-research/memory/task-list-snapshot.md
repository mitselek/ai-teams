# Task List Snapshot — 2026-04-15 afternoon close

Captured before shutdown per startup.md §S2b.

## Active / pending

| ID | Subject | Status | Owner | Blocks |
|---|---|---|---|---|
| 6 | Brainstorm ruth-team shape with user + Ruth | in_progress | — | Ruth's Teams response |
| 7 | Celes: draft roster with dual-track instrumentation | pending | — | Ruth Q1=yes + Q2/Q3 answers |
| 10 | Wake Volta for §6.5 observability addendum | pending | — | Ruth Q2/Q3 (reshapes telemetry surface) |
| 11 | Monte §4.3 governance (account policy) | pending | — | — (can proceed parallel to Ruth) |
| 12 | Herald §5.3 bridge protocol | pending | — | — (can proceed parallel to Ruth) |
| 13 | Process Ruth's Teams history if operator shares | pending | — | Operator paste into `sensitive/` |

## Completed this session

| ID | Subject | Owner |
|---|---|---|
| 3 | Research Ruth's Confluence activity | finn |
| 4 | Finn: Confluence activity dig for Ruth | finn |
| 5 | Cal: prior-art query for dual-track teams | callimachus |
| 8 | Verify apex-research V2 Confluence dependency | finn |
| 9 | Send tmux-direct brief to apex-research TL | finn |

## Critical path for ruth-team build (Dockerfile + compose)

Brunel's build step is blocked on:
- **Monte §4.3 Q1-Q2** (credential injection: shared account vs per-principal, rotation path)
- **Herald §5.3 Q1** (bridge manifest format / typed contract)

Neither blocked on Ruth. Monte + Herald can be spawned next session in parallel regardless of Ruth's response.

## Critical path for ruth-team roster + observability

Both blocked on Ruth's Q1/Q2/Q3 answers via operator Teams relay. If Q1=no, this path closes and we don't spawn Celes or Volta for ruth-team purposes (but Volta remains available for unrelated persist-coverage work).

## Fallback work (ruth-team idle)

- Persist-coverage Fix session (F1 jq extraction + F2 nomenclature rename)
- Phase 2 Jira/GitFlow classification if dev-toolkit#43 has PO answers
- Ecosystem-integration research session (issues #57 + #58 bundled)

(*FR:team-lead*)
