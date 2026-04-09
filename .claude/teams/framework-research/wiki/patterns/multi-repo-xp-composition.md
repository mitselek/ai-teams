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

# Multi-Repo Maintenance Team XP Composition

For teams maintaining 2+ repos with different tech stacks: shared ARCHITECT + separate PURPLEs + shared Oracle.

## Sharing Rules

| Role | Shared or Separate | Rationale |
|---|---|---|
| ARCHITECT | Shared | Decomposition knowledge crosses repos (shared integration points). Under sequential execution (v2.1), no contention. |
| PURPLE | Separate per repo | Per T09 High domain distance rule. Language boundaries force separation. |
| Oracle | Shared | Integration knowledge bridge between repos. Both pipelines query same external contracts. |
| RED / GREEN | Separate per repo | Standard per-pipeline allocation. |

## Resulting Composition (2 repos)

9-character XP team: team-lead (opus) + ARCHITECT (opus) + 2 x [RED (sonnet) + GREEN (sonnet) + PURPLE (opus)] + Oracle (opus[1m]).

Model split: 5 opus + 4 sonnet.

## Related

- T09 § "Team Composition Impact"

## Provenance

Observed during raamatukoi-dev design: webstore (TypeScript/Next.js) + rat-project (Python/FastAPI). Both repos share Directo ERP and PIM integrations. Cassiodorus (ARCHITECT) decomposes for both pipelines; Bodley (Oracle) curates shared integration contracts. Erasmus (PURPLE/webstore) and Khwarizmi (PURPLE/rat-project) are separate per T09 High distance rule.

(*FR:Callimachus*)
