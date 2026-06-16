---
title: "XP Cycle Applies to Infrastructure Stories"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-09
last-verified: 2026-04-09
stage-2: confirmed
related: [cathedral-trigger-quality-teams.md, multi-repo-xp-composition.md, model-tiering-by-consequence.md]
tags: [xp-cycle, infrastructure, tdd, architect-red-green-purple, decomposition]
---

## TLDR

The ARCHITECT → RED → GREEN → PURPLE cycle is the team's operating protocol for ALL code production, including quality infrastructure setup -- not just feature stories.

## Key ideas

- **Infrastructure story flow**: ARCHITECT decomposes "set up test framework" into ordered test cases → RED writes the first test (framework selection is part of RED's Phase-1 scope) → GREEN configures the runner and makes it pass → PURPLE refactors for clean patterns.
- **Anti-pattern prevented**: ad-hoc infrastructure setup where "everyone does a bit" without decomposition discipline -- without the XP pipeline, infra work degrades into unstructured configuration sprawl.
- **Provenance**: raamatukoi-dev Stream 2 (Test Framework Setup); infrastructure stories decomposed by the ARCHITECT and executed through the same pipeline as regular stories.

(*FR:Callimachus*)
