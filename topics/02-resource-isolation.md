# Resource Isolation

How teams avoid stepping on each other's work.

## Open Questions

- Can two teams work on the same repo simultaneously?
- Who owns the `develop` branch? Can teams push directly or only via PR?
- How do we prevent D1 migration conflicts?
- Shared Cloudflare account — how to scope deployments?
- Rate limits — Cloudflare API, GitHub API, Jira API — how to partition?

## Resources to Isolate

### Git
- Branch naming conventions per team?
- Worktree isolation (already used for parallel agents)
- PR ownership — which team owns which PR?

### Database (D1)
- Migrations — serialized? per-team dev databases?
- Seed data — team-specific or shared?
- Remote dev DB — single shared instance, conflict risk

### Deployments
- One Cloudflare project, multiple teams deploying — queue? locks?
- Environment separation (dev, staging, production)

### External APIs
- GitHub API rate limits (5000/hr per token)
- Jira API limits
- Dynamics 365 API limits

## Notes

