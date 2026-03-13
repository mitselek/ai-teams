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

## Patterns from Reference Teams (*FR:Finn*)

### Health audit as periodic observability: Medici

The primary observability mechanism in both reference teams is **Medici**, a dedicated health audit agent. Medici runs at team startup and periodically on request.

**Medici's audit scope (hr-devs version — more detailed):**

1. `[PROMOTE]` — `[LEARNED]`/`[PATTERN]` scratchpad entries worth adding to agent prompts
2. `[CONSOLIDATE]` — knowledge duplicated across 2+ scratchpads → move to common-prompt
3. `[CROSSPOLL]` — knowledge in the wrong scratchpad (Agent A learned something for Agent B)
4. `[STALE]` — scratchpad entries no longer accurate (fixed bugs, changed architecture, completed issues)
5. `[GAP]` — repeated `[GOTCHA]` entries about the same topic = prompt should have included it
6. `[COMMON]` — patterns all agents follow but not documented in common-prompt

**Output:** writes `docs/health-report.md`, sends summary to team-lead. Lead decides what to apply. Medici never edits prompts or scratchpads directly — advisory role only.

**Scope restrictions:** Medici may read scratchpads, prompts, common-prompt, docs, and source files (to verify stale claims). May only write to its own scratchpad + health-report.md.

### Shutdown reports as session observability

At shutdown, every agent sends a structured closing message:

- `[LEARNED]` — key discovery (1 bullet)
- `[DEFERRED]` — item pending decision (1 bullet)
- `[WARNING]` — something important for next session (1 bullet)

Team-lead saves task list snapshot to `memory/task-list-snapshot.md` and commits all memory files. This creates a per-session audit trail of: what was done, what was deferred, what went wrong.

### Author attribution as audit trail

`(*RC-DEV:AgentName*)` on all persistent output (md files, GitHub issues, PRs, commits, Jira). Attribution placement rules:

- Short block: new line below block
- Whole section: next to heading (`## Analysis (*RC-DEV:Finn*)`)
- GitHub issue/PR: bottom of body
- Commit: end of message body (not subject line)

This enables post-hoc audit of which agent produced which artifact without infrastructure logging.

### Dashboard for human-facing reports

`add-doc-to-dashboard.sh <file> [title]` pushes any markdown doc as a tab in the team dashboard. Used for: research reports, code review summaries, architecture docs, test coverage. In-memory only — disappears on restart. This is the real-time report delivery channel to the PO.

### Task coordination tools as activity log

`TaskCreate/TaskUpdate/TaskList/TaskGet` used by team-lead for coordination. Task state transitions (created → in_progress → completed) are the lightweight activity log for the current session.

### Code review as quality observability

Marcus uses GitHub Reviews API (`--comment` / COMMENTED state) for all review verdicts — never plain PR comments. This creates formal review records visible in the GitHub reviews widget. Provides an audit trail distinguishing "code reviewed" from "someone commented." The shared account cannot self-approve, so COMMENTED state is the workaround that still provides traceability.

### Known Pitfalls as failure history

Both common-prompts maintain a `## Known Pitfalls` section. This is an informal but growing list of production failures turned into prevention rules. Each entry represents a real incident — it's a form of post-mortem documentation embedded in the agent's operational context.

### What is NOT tracked yet

- Token consumption per agent/team
- API call costs
- Context window usage per agent
- Error rates, retries
- Idle time, stuck states
- Cross-session rollup reports

These are all open questions — no observability infrastructure beyond what's described above.
