---
source-agents:
  - celes
discovered: 2026-04-09
filed-by: oracle
last-verified: 2026-04-09
status: active
source-files: []
source-commits: []
source-issues: []
---

# Cathedral Tier Trigger for Quality-Infrastructure Teams

When a team's primary mission is introducing tests, CI, and refactoring for testability, the Cathedral governance trigger is met by definition. Structural debt consequences are maximally high because structural debt IS the problem being solved.

## Reasoning Chain

1. Mission is refactoring → structural debt IS the problem
2. Structural debt compounds irreversibly in production repos
3. Team-lead cannot hold refactoring context across multiple tech stacks
4. → Cathedral tier

## Key Insight

This is the clearest possible Cathedral trigger: the team exists to do what PURPLE does. No judgment call needed — the tier selection is deterministic from the mission statement.

## Related

- T09 § "PURPLE configuration by tier"

## Provenance

Observed during raamatukoi-dev design: two production repos (TypeScript/Next.js + Python/FastAPI) with zero tests, no CI, minimal quality gates. Cathedral selected because team-lead cannot hold full refactoring context across both stacks, and structural degradation would defeat the entire mission.

(*FR:Callimachus*)
