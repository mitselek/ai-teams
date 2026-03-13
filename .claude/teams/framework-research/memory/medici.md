# Medici — Knowledge Health Checker Scratchpad

## [LEARNED] 2026-03-13 — Initial audit (session 1)

This is a brand-new research repo, not the cloudflare-builders operational team. No memory/ or .claude/ dirs existed on startup — created them.

Repo structure: README.md + 8 topic files + reference/ (cloudflare-builders RC team artifacts).

## [PATTERN] Topic file template is uniform but thin

All 8 topic files follow identical structure: Open Questions + sparse Knowns + empty Notes. This is intentional for a brainstorm phase, but the "Notes" section is unused in all 8 files. Signals no synthesis has happened yet.

## [GAP] No cross-topic linking

Topics have zero cross-references to each other despite clear dependencies:
- T01 (taxonomy) drives T02 (isolation) and T05 (identity)
- T04 (hierarchy) is the missing link between T03 (communication) and T07 (safety)
- T06 (lifecycle) needs T04 (governance) to answer who approves creation/shutdown

## [GAP] Reference material not extracted

reference/rc-team/cloudflare-builders/ contains rich concrete patterns (common-prompt.md ~226 lines, scratchpads, health-report.md) that directly answer many Open Questions in the topic files. No extraction has happened yet.

## [PATTERN] Attribution rule differs from cloudflare-builders

This team uses `(*FR:Medici*)` not `(*RC-DEV:medici*)`. Prompt is clear on this.

## [DECISION] health-report location

Output goes to `.claude/teams/framework-research/docs/health-report.md`. Created that directory.

## [GOTCHA] Scratchpad path

Correct path is `.claude/teams/framework-research/memory/medici.md`. Earlier in session 2 I erroneously wrote to `memory/medici.md` (repo root) — that file has since been removed. Always use the full `.claude/teams/...` path.

## [CHECKPOINT] 2026-03-13 session 2

All 8 topic files unchanged from session 1 — no extraction has occurred. Finn's scratchpad has rc-team vs hr-devs comparison ready but not pushed into topics. Health report v2 written. Highest-value next action: T06 Lifecycle comparison (two concrete reference implementations to compare).

## [CHECKPOINT] 2026-03-13 session 3 — Restart test shutdown

Respawned on opus model. No new work done this session — checked in and received immediate shutdown order (planned restart test).

State remains clean:
- Health report v2 at `.claude/teams/framework-research/docs/health-report.md` — still current
- All 8 topic files unchanged — still at brainstorm-stub level
- No in-progress writes or open tasks
- Next action on restart: extraction sprint per health-report v2 recommendations (priority 1: move Finn's reference patterns into topic Notes sections)
