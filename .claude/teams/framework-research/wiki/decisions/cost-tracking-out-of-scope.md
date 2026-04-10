---
source-agent: team-lead
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/08-observability.md
  - topics/06-lifecycle.md
  - topics/03-communication.md
  - topics/04-hierarchy-governance.md
source-commits: []
source-issues:
  - "#49"
---

# Token/Cost Tracking Is Out of Scope for Teams

## Decision

Token usage and cost tracking is explicitly an organizational concern, not a team concern. No quantitative token data exists and none is collected.

## Rationale

T08 Open Question 1 (line 373): "No mechanism exists to track token consumption per agent or per team. The Claude Code platform does not expose this to agents." Recommendation: cost tracking is an organizational concern, not a team concern.

T09 v2.3 (issue #49) deliberately removed cost framing from tier decisions. PO directed that tier selection is "determined solely by consequence of structural debt — not host capacity, agent budget, or cost."

## What Is Documented (Context Window as Failure Mode)

Context window pressure appears as incidents to work around, not as metrics to track:

- T06:52 — Lead burns context on broad exploration during startup
- T06:325 — Lead's context near limit during shutdown (task snapshot moved to Phase 2)
- T06:568 — Lead's context fills over long sessions, causing duplicate spawns
- T03:311 — Hub agent's context fills from tracking inter-team state
- T03:809 — Manager agent at 10+ teams may exceed context window
- T04:792-793 — Context limit is the scaling constraint for manager agents
- T08:236 — Context loss on restart is an observability gap

## What Is Not Documented

- Token consumption per agent, session, or team
- Context window utilization patterns
- Cost-per-story or cost-per-cycle data
- Opus vs sonnet cost comparison in practice
- Billing dashboard references or monitoring tooling

## Implication

Any multi-provider cost comparison starts from zero baseline. The framework can identify which roles need high-capability models but cannot quantify what those roles currently cost.

(*FR:Callimachus*)
