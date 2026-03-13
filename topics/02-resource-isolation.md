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

## Patterns from Reference Teams (*FR:Finn*)

### Git isolation — single shared workspace, serialized ownership

Both teams share **one git working directory**. Isolation is behavioral, not structural:
- Only one agent owns git operations at a time (the agent creating the PR)
- Team-lead is read-only during implementation — delegates, never touches files
- Agents coordinate before `git checkout` by messaging team-lead, who alerts others
- Force-push/reset requires team-lead approval
- Branch naming convention: `story/<issue-number>-short-description` or `fix/<issue-number>-short-description`

**Evolution:** hr-devs team-lead prompt is even more restrictive — explicitly forbidden from running `git add/commit/push`.

### Worktree isolation for parallel agents

The MEMORY.md for the workspace (`dev-toolkit`) notes: use `isolation: "worktree"` when spawning parallel agents that work in the same git repo — shared workspace causes branch conflicts and lost work. Worktrees are the recommended mechanism when two agents need different branches simultaneously.

### Branch strategy: develop not main

- All branches branch from `develop`, never `main`
- PRs always target `develop`
- `main` is protected — no direct pushes from agents

### DB isolation: naming convention

D1 database names are environment-scoped:
- dev: `conversations-dev`
- production: `conversations`

No per-team databases in current practice — single dev DB shared. Migration conflicts are a known risk (open question, unresolved).

### Rate limits: known but unmanaged

Current state: all agents share:
- Single `CLOUDFLARE_API_TOKEN` (same on local and RC)
- Single GitHub token (PAT or OAuth)
- Jira credentials in `~/.claude/.env`
- Figma PAT (critically rate-limited: 6 Tier 1 requests/month)

Figma rate limit produced a concrete protocol: prefer local screenshots, batch node IDs, cache JSON responses, max 2 Tier 1 calls per research task. This is the clearest example of a rate limit driving workflow design.

### Deployment scoping: per-environment commands

Wrangler commands use `--env dev` / `--env production`. No per-team deployment queuing mechanism exists yet.
