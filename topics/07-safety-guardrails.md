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

## Patterns from Reference Teams (*FR:Finn*)

### Guardrails are prompt-level, not infrastructure-level

Both reference teams implement safety primarily through agent prompts, not infrastructure enforcement. The team-lead is forbidden from editing source code by prompt instruction, not by file system ACLs. Any agent could technically violate these rules — the guardrail is behavioral.

### Team-lead tool restriction is the primary blast radius control

The strictest guardrails are on the team-lead (highest-privilege coordinator):

**Hard forbidden:**
- Edit/Write on source code (.ts, .svelte, .js, .sql, .css, .json config)
- Running builds, tests, deployments
- `git add/commit/push`
- Reading source code for implementation understanding

**Allowed Bash:** only `date`, tmux commands, `git pull` (on dev-toolkit only), cleanup scripts, `gh` commands for issue/PR management.

This limits the team-lead's blast radius — it cannot accidentally modify or deploy code.

### Peer enforcement mechanism

Teammates are instructed to message the team-lead with a reminder if they observe a boundary violation. This is social enforcement by the team, not technical enforcement.

### Pre-commit quality gates

Before any PR creation, agents must pass:
- `npm run tests`
- `npm run check`
- `npm run lint`

PR template: all `[ ]` checkboxes must be ticked to `[x]` before `gh pr create`. Cannot create PR with unchecked boxes. This is a hard gate — behavioral, enforced by prompt instruction.

### No-force-push / no-reset rule

Common-prompt (both teams): `Never force-push or reset without team-lead approval`. The workspace MEMORY.md adds: "Prefer to create a new commit rather than amending an existing commit."

### Known Pitfalls section as safety documentation

Both common-prompts include a `## Known Pitfalls` section with concrete failure modes discovered in practice:
- `$app/paths` in `.server.ts` causes CI failures
- `gray-matter` YAML date coercion bug
- `~/.claude/.env` values must be quoted
- Jira API endpoint change (`/search` → `/search/jql`)
- `overflow-x: auto/scroll/hidden` blocks `position: sticky`

This is a living safety checklist — pitfalls discovered in production get added to the common-prompt to prevent recurrence.

### External communication gates

- **GitHub issues:** agents can create and comment freely
- **Jira issues:** only when user explicitly requests — agents do NOT create/update on own initiative
- **Email:** never post to external systems without PO review
- **Production deployment:** human approval required (Level 0)

### Coding safety standards

From workspace CLAUDE.md: "Be careful not to introduce security vulnerabilities such as command injection, XSS, SQL injection, and other OWASP top 10 vulnerabilities. If you notice that you wrote insecure code, immediately fix it."

### Cyrillic homoglyph detection

From MEMORY.md: LLM-generated text can contain Cyrillic homoglyphs. `audit_cyrillic.py` exists to detect them. This is a content safety mechanism — code that looks correct but contains invisible wrong characters.

### git worktree isolation for parallel agents

When 2+ agents need different branches: use `isolation: "worktree"` when spawning. Shared workspace without worktrees causes branch conflicts and lost work. (Noted as REPEATED violation in MEMORY.md.)
