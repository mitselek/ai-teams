# Safety & Guardrails

Blast radius limits, permissions, and safety mechanisms.

## Open Questions

- What actions should be globally forbidden for agents?
- Per-team permission profiles — how granular?
- How do we detect and stop a runaway agent/team?
- Circuit breakers — automatic shutdown triggers?
- How do we prevent cascade failures across teams?

## Permission Categories

### Never (no team can do this)
- Force push to main/production
- Delete production databases
- Send external emails without human review
- Modify CI/CD pipeline security settings
- Access other teams' credentials

### Human approval required
- Production deployments
- Database migrations on production
- External API integrations (new)
- Creating/modifying Jira issues (per current policy)

### Team lead can approve
- PR merges to develop
- Dev environment deployments
- Seed data changes on dev

### Any agent can do
- Read code, run tests
- Create branches, make commits
- Create GitHub issues
- Local development operations

## Safety Mechanisms

- Rate limiting per team
- Blast radius containment — team can only affect its own resources
- Kill switch — human can halt all teams instantly
- Dry-run mode — team proposes actions, human approves batch

## Notes

