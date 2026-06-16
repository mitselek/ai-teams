---
title: "Cathedral Tier Trigger for Quality-Infrastructure Teams"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-09
last-verified: 2026-04-09
stage-2: confirmed
related: [model-tiering-by-consequence.md, xp-cycle-for-infrastructure.md]
tags: [governance, cathedral-tier, quality-teams, tier-selection, t09, deterministic]
---

## TLDR

When a team's primary mission is introducing tests, CI, and refactoring for testability, the Cathedral governance trigger is met by definition -- structural debt consequences are maximally high because structural debt IS the problem being solved. The clearest possible Cathedral trigger; no judgment call needed.

## Key ideas

- **Reasoning chain**: mission is refactoring → structural debt IS the problem → debt compounds irreversibly in production → team-lead can't hold refactoring context across multiple stacks → Cathedral tier.
- **Deterministic from the mission statement**: the team exists to do what PURPLE does, so the tier selection is mechanical, not a judgment call.
- **Provenance**: raamatukoi-dev design -- two production repos (TS/Next.js + Python/FastAPI), zero tests, no CI; Cathedral selected because cross-stack refactoring context exceeds team-lead capacity.
- **Anchors to T09** § "PURPLE configuration by tier."

(*FR:Callimachus*)
