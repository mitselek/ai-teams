# Identity & Credentials

Authentication scoping and secret access per team.

## Open Questions

- One GitHub token for all teams or per-team tokens?
- How to scope Cloudflare API access per team?
- Who manages secrets — centralized vault or per-team?
- How do we audit which team used which credential?
- Can a team escalate its own permissions?

## Current State

- Single `CLOUDFLARE_API_TOKEN` shared between local and RC
- Single GitHub token (PAT or OAuth)
- Jira credentials in `~/.claude/.env`
- Dynamics 365 credentials in project `.env`

## Considerations

- Principle of least privilege — each team gets only what it needs
- Credential rotation — how to update across teams?
- Temporary credentials — short-lived tokens for temporary teams?
- Audit trail — log every API call with team identity

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Current state: shared credentials, single env file

All credentials live in `~/.claude/.env` (on both local and RC machines):
- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — same token, both environments
- `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` — Jira
- `FIGMA_PAT` — Figma personal access token
- `GITHUB_TOKEN` — GitHub

No per-team credential scoping. All agents on all teams share the same credentials. No per-team Cloudflare API tokens, no per-team GitHub tokens.

### Credential loading pattern

Agents source the env file before API calls:
```bash
source ~/.claude/.env
curl -s -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" "$ATLASSIAN_BASE_URL/rest/api/3/..."
```

**Known gotcha:** `~/.claude/.env` values MUST be quoted — special characters break without quotes. This is in the Known Pitfalls section of both common-prompts.

### Figma PAT: rate-limit scoping drives access discipline

The most concrete example of credential scoping pressure: Figma PAT is a View/Collab seat with only 6 Tier 1 requests per month. Recovery from 429 can take days. This produced a strict access protocol:
- Prefer local screenshots over API calls
- Batch all node IDs, make minimal calls
- Cache responses to /tmp
- Max 2 Tier 1 calls per research task
- Log headers on 429, never retry

This shows that access discipline emerges from rate-limit pressure, not from upfront credential scoping.

### Attribution without authentication

The current attribution system (`(*RC-DEV:AgentName*)`) is honor-based — any agent could claim any name. There is no cryptographic or infrastructure-level proof of which agent wrote what. It serves as an audit trail for humans, not a security mechanism.

### No secret access escalation mechanism

There is no protocol for an agent to request elevated permissions. If an agent needs access it doesn't have, it must send a message to team-lead, who escalates to the human PO. No self-escalation path exists by design.

### Per-team credential isolation: not yet implemented

Both reference teams run on a single shared credential set. Per-team tokens, credential rotation, and audit-by-team-identity are open problems. The workspace MEMORY.md notes this as a known state.
