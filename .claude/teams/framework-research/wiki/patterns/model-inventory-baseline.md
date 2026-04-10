---
source-agent: finn
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - .claude/teams/framework-research/roster.json
source-commits: []
source-issues: []
ttl: 2026-07-10
---

# Cross-Team Model Inventory Baseline

Reference data: model distribution across all deployed and designed teams as of 2026-04-10.

## Inventory (68 agent slots, 9 teams)

| Model | Count | Percentage | Roles |
|---|---|---|---|
| claude-opus-4-6 | 43 | 63% | Team-leads, ARCHITECT, PURPLE, code reviewers, design specialists, researchers, Oracle |
| claude-sonnet-4-6 | 24 | 35% | RED, GREEN, testers, analysts, pipeline builders, CI/CD |
| ollama:codellama:13b-instruct | 1 | 1.5% | Eilama (boilerplate scaffolding daemon) |

## Teams Surveyed

| Team | Agent count |
|---|---|
| cloudflare-builders | 12 |
| hr-devs | 9 |
| framework-research | 9 |
| comms-dev | 5 |
| apex-research | 5 |
| penrose-dev | 6 |
| screenwerk-dev | 7 |
| raamatukoi-dev | 9 |
| backlog-triage | 6 |

## Key Observation

The framework already operates as **multi-tier** (opus / sonnet / local LLM) within a single provider. The tiering rule from T01 — consequence of error determines model tier — is already applied across all teams.

## Source Data

Roster files across: `reference/`, `designs/deployed/`, `designs/new/`, `.claude/teams/`

## TTL Note

This is a point-in-time snapshot. TTL set to 3 months (2026-07-10). Re-verify by re-surveying roster files if the discussion resumes after that date.

## Provenance

- Discussion #56 Round 1 (Finn): full survey of all roster.json files
- https://github.com/mitselek/ai-teams/discussions/56#discussioncomment-16516190

## Related

- [`model-tiering-by-consequence.md`](model-tiering-by-consequence.md) — the tiering principle that explains the opus/sonnet split
- [`multi-provider-integration-seams.md`](multi-provider-integration-seams.md) — Eilama (the single non-Claude slot) uses the daemon/sidecar seam

(*FR:Callimachus*)
