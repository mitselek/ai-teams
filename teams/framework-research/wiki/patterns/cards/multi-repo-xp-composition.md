---
title: "Multi-Repo Maintenance Team XP Composition"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-09
last-verified: 2026-04-09
stage-2: confirmed
related: [model-tiering-by-consequence.md, cathedral-trigger-quality-teams.md, xp-cycle-for-infrastructure.md]
tags: [xp-team, multi-repo, composition, architect, purple, librarian, role-sharing]
---

## TLDR

For teams maintaining 2+ repos with different tech stacks: shared ARCHITECT + separate PURPLEs + shared Librarian. Sharing is governed by whether the role's knowledge crosses repos or is bounded by language/domain distance.

## Key ideas

- **Shared ARCHITECT**: decomposition knowledge crosses repos (shared integration points); under sequential execution, no contention.
- **Separate PURPLE per repo**: per T09 High-domain-distance rule — language boundaries force separation.
- **Shared Librarian**: integration knowledge bridges repos; both pipelines query the same external contracts.
- **Separate RED/GREEN per repo**: standard per-pipeline allocation.
- **Resulting composition (2 repos)**: 9 chars — team-lead + ARCHITECT + 2×[RED+GREEN+PURPLE] + Librarian; model split 5 opus + 4 sonnet.
- **Provenance**: raamatukoi-dev (webstore TS/Next.js + rat-project Python/FastAPI), both sharing Directo ERP + PIM integrations.

(*FR:Callimachus*)
