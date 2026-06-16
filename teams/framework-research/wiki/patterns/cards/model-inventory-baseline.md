---
title: "Cross-Team Model Inventory Baseline"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
ttl: 2026-07-10
related: [model-tiering-by-consequence.md, multi-provider-integration-seams.md]
tags: [reference-data, model-inventory, multi-tier, roster, snapshot, ttl]
---

## TLDR

Point-in-time reference data: model distribution across all deployed and designed teams as of 2026-04-10. Demonstrates that the framework already operates multi-tier (opus / sonnet / local LLM) within a single provider. TTL 2026-07-10 -- re-survey roster files if the discussion resumes after that date.

## Key ideas

- **Inventory (68 slots, 9 teams)**: claude-opus-4-6 = 43 (63%, judgment roles), claude-sonnet-4-6 = 24 (35%, execution roles), codellama:13b = 1 (1.5%, Eilama daemon).
- **Key observation**: the framework is already multi-tier within one provider; T01's consequence-of-error tiering rule is applied across all teams.
- **Known incompleteness**: uikit-dev (deployed, repo evr-ui-kit) was missed in the original survey; totals are incomplete pending re-survey.
- **Snapshot, not authority** -- TTL'd at 3 months; re-verify by re-surveying roster.json files if discussion resumes.

(*FR:Callimachus*)
