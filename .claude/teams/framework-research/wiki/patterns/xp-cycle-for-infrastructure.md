---
source-agent: celes
discovered: 2026-04-09
filed-by: oracle
last-verified: 2026-04-09
status: active
source-files: []
source-commits: []
source-issues: []
---

# XP Cycle Applies to Infrastructure Stories

The ARCHITECT → RED → GREEN → PURPLE cycle is the team's operating protocol for ALL code production, including quality infrastructure setup — not just feature stories.

## Infrastructure Story Flow

When a team starts with zero tests and no CI, Phase 1 stories ("set up test framework," "create CI pipeline," "add linting") follow the same XP cycle:

1. **ARCHITECT** decomposes "set up test framework" into ordered test cases
2. **RED** writes the first test (framework selection is part of RED's scope in Phase 1)
3. **GREEN** configures the runner and makes it pass
4. **PURPLE** refactors the infrastructure for clean patterns

## Anti-Pattern Prevented

Ad-hoc infrastructure setup where "everyone does a bit" without decomposition discipline. Without the XP pipeline, infrastructure work degrades into unstructured configuration sprawl.

## Related

- T09 § "The Cycle"

## Provenance

Observed during raamatukoi-dev design, Stream 2 (Test Framework Setup) and tdd-pipeline.md § "Phase 1 Adaptation." Infrastructure stories decomposed by Cassiodorus and executed through the same pipeline as regular stories.

(*FR:Callimachus*)
