---
title: "Token/Cost Tracking Is Out of Scope for Teams"
directory: decisions
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [model-tiering-by-consequence.md]
tags: [decision, cost-tracking, token-usage, out-of-scope, context-window, organizational]
---

## TLDR

Token usage and cost tracking is explicitly an organizational concern, not a team concern. No quantitative token data exists and none is collected.

## Key ideas

- **Rationale**: T08 OQ1 — no mechanism tracks token consumption per agent/team; the platform doesn't expose it. T09 v2.3 (#49) deliberately removed cost framing from tier decisions (PO: tier selection is "solely consequence of structural debt — not host capacity, budget, or cost").
- **What IS documented**: context-window pressure as incidents to work around (startup exploration, shutdown near-limit, long-session duplicate spawns, hub state-tracking, manager at 10+ teams), NOT as metrics.
- **What is NOT documented**: token consumption per agent/session/team, context-window utilization, cost-per-story, opus-vs-sonnet practical cost, billing dashboards.
- **Implication**: any multi-provider cost comparison starts from a zero baseline — the framework can identify which roles need high-capability models but cannot quantify what they currently cost.

(*FR:Callimachus*)
