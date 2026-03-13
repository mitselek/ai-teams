# Hierarchy & Governance

Supervision chains, escalation, and approval authority.

## Open Questions

- How many levels of hierarchy? (PO → manager agent → team lead → agents?)
- Can a manager agent approve PRs or only humans?
- What decisions require human approval vs. can be delegated?
- How do we prevent a manager agent from going rogue?
- Conflict resolution — when two teams disagree, who decides?

## Hierarchy Levels

### Level 0: Product Owner (human)
- Final authority on priorities, architecture, external communication
- Approves production deployments

### Level 1: Manager agents
- Supervise multiple teams
- Coordinate cross-team work
- Escalate to PO when needed

### Level 2: Team leads
- Own team's backlog and workflow
- Assign tasks to specialists
- Report to manager agent

### Level 3: Specialist agents
- Execute tasks within their domain
- Report to team lead

## Governance Rules

- What requires human sign-off?
- What can manager agents decide autonomously?
- What can team leads decide?

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Current hierarchy: 2-level (flat teams)

Both reference teams are flat: PO → team-lead → specialists. No manager agent layer exists yet. The framework vision adds a Level 1 manager agent layer, but it's not implemented in either reference team.

### Team-lead is coordinator-only — enforced by prompt

The team-lead role boundary is explicit and enforced by agent prompts:

**Forbidden tools for team-lead:**
- `Edit/Write` on source code (.ts, .svelte, .js, .sql, .css, .json config)
- Running builds, tests, deployments
- `git add/commit/push`
- Reading source code to understand implementation (that's Finn's job)

**Allowed tools for team-lead:**
- `Read` for team config, memory files, CLAUDE.md, roster
- `Edit/Write` only under the team's memory directory and roster JSON
- `Bash` for `date`, tmux commands, `git pull` (dev-toolkit only), cleanup scripts, `gh` commands for issue/PR management
- `SendMessage` — primary tool
- Task coordination tools

**Enforcement mechanism:** Teammates are instructed to send a reminder message if they observe team-lead violating these boundaries. Self-policing by the team, not infrastructure enforcement.

### Issue closure is team-lead's exclusive responsibility

Closing GitHub issues is the team-lead's job, never delegated. This creates a clean governance signal: issue closed = team-lead has reviewed and confirmed completion.

### Spawn-before-delegate rule

Team-lead cannot do work themselves even when no specialist is available. The rule: if no teammate is spawned, spawn one first, then delegate. This prevents role drift.

### Anti-patterns table

Both team-lead prompts include an explicit anti-patterns table:

| Violation | Why wrong | Correction |
|---|---|---|
| Team-lead read + edited .ts files | Wastes tokens, breaks workflow | Delegate to Finn + specialist |
| Team-lead ran tests | Implementer's job | Include "run tests" in delegation message |
| Team-lead wrote git commit | Implementer owns branch end-to-end | Implementer commits, pushes, creates PR |
| Team-lead spawned via Agent tool | Ignores roster model, wastes expensive tokens | Use spawn_member.sh |
| Team-lead did a "quick fix" | Breaks habit | Even 1-line fixes go through the team |

### Jira governance: human-gated

Jira issue creation/update requires explicit user request (from workspace MEMORY.md). Agents do not create Jira epics/stories/tasks on their own initiative. GitHub issues are agent-managed; Jira is human-gated.

### PR governance

Code review (Marcus) uses GitHub Reviews API with `--comment` (COMMENTED state) — creates formal review record in reviews widget, provides audit trail. Issue closure happens only after GREEN review from Marcus.

### Schedule awareness rule

Agents must run `date` before any schedule-related statement. No relative dates ("Monday", "tomorrow") without verifying the actual date. Prevents stale scheduling claims.
