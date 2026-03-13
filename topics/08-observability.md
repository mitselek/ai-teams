# Observability

Logging, auditing, and monitoring team activity.

## Open Questions

- What do we need to observe — token usage, actions, errors, decisions?
- Real-time dashboards or async reports?
- Who reviews logs — human, manager agent, or both?
- How to detect anomalies — unusual commit patterns, API spikes?
- Cost tracking per team?

## What to Track

### Activity
- Commits, PRs, issues created per team
- Deployments triggered
- API calls made (GitHub, Cloudflare, Jira, Dynamics)

### Health
- Context window usage per agent
- Error rates, retries
- Idle time, stuck states

### Cost
- Token consumption per team/agent
- API call costs
- Compute time (RC server usage)

### Audit
- Every external action (push, deploy, API call) with team + agent identity
- Permission escalation attempts
- Human overrides and corrections

## Reporting

- Per-session summary (what was done, what's pending)
- Daily/weekly rollup across teams
- Anomaly alerts

## Notes

