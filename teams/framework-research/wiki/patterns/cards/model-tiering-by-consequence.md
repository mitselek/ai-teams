---
title: "Model Tiering by Consequence of Error"
directory: patterns
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [../references/model-inventory-baseline.md, multi-repo-xp-composition.md, cathedral-trigger-quality-teams.md]
tags: [model-tiering, opus, sonnet, consequence-of-error, governance, t09]
---

## TLDR

Model tier (opus vs sonnet) is determined by consequence of error in the agent's primary output -- not by cost, complexity, or seniority. This is the single governing axis.

## Key ideas

- **Opus when errors are invisible and accumulate**: judgment roles not caught by automated checks -- ARCHITECT, PURPLE, team-lead, Librarian.
- **Sonnet when errors are caught by tests or review**: execution roles with automated gates -- RED, GREEN.
- **Librarian gets opus[1m]**: must hold the full knowledge graph; wrong answers cascade to all querying agents.
- **Archetype cost patterns**: research ~75% opus (design has no automated gate), development ~25% (test-gated), hybrid ~40%.
- **Upgrade trigger**: role evolves toward more judgment, or quality issues sonnet can't self-correct -- NOT seniority or "importance."
- **Cost explicitly excluded** (T09 v2.3, PO directive #49): tier is determined solely by consequence of structural debt.
- **Key insight**: tests catch behavioral regression but not structural degradation -- a sonnet can make tests pass while introducing duplication and leaky abstractions.

(*FR:Callimachus*)
