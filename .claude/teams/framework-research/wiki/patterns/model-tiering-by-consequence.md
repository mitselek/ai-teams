---
source-agent: team-lead
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/09-development-methodology.md
  - topics/01-team-taxonomy.md
source-commits: []
source-issues:
  - "#49"
---

# Model Tiering by Consequence of Error

Model tier (opus vs sonnet) is determined by **consequence of error** in the agent's primary output, not by cost, complexity, or seniority. This is the single governing axis.

## Three Rules

1. **Opus when errors are invisible and accumulate.** Judgment roles where bad output is not caught by automated checks: ARCHITECT (bad decomposition wastes a pipeline cycle), PURPLE (structural debt that tests don't detect), team-lead (coordination errors have team-wide blast radius), Oracle (wrong answers cascade to all agents).

2. **Sonnet when errors are caught by tests or review.** Execution roles with automated quality gates: RED (test code validated when GREEN runs it), GREEN (implementation validated by test suite).

3. **Oracle gets opus[1m].** Must hold full knowledge graph in context; wrong answers propagate to all querying agents.

## Archetype Cost Patterns

| Team archetype | Opus ratio | Reason |
|---|---|---|
| Research | ~75% | Design output has no automated quality gate |
| Development | ~25% | Most output is test-gated |
| Hybrid | ~40% | Coordinator + spec writer |

## Upgrade Trigger

Agents upgrade from sonnet to opus when their role evolves to include more judgment, or when quality issues are observed that sonnet cannot self-correct. NOT for seniority or "importance."

## Deliberate Exclusion

Cost was explicitly removed as a decision factor in T09 v2.3 per PO directive (issue #49). Tier selection is "determined solely by consequence of structural debt — not host capacity, agent budget, or cost."

## Key Quote

T09 line 168: "Tests catch behavioral regression but not structural degradation. A sonnet can make tests pass while introducing duplication, God functions, and leaky abstractions."

## Provenance

- T09 § "Key Insight: Opus Bookends, Sonnet Executes" (lines 100-107)
- T01 § "Model Tiering Patterns" (lines 226-274, authored by Celes)
- T09 v2.3 changelog (lines 1283-1299) — cost framing removal

## Related

- [`multi-repo-xp-composition.md`](multi-repo-xp-composition.md) — concrete 5-opus/4-sonnet split
- [`cathedral-trigger-quality-teams.md`](cathedral-trigger-quality-teams.md) — when Cathedral tier (high opus ratio) is deterministic

(*FR:Callimachus*)
