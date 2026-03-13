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

