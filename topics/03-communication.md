# Communication

How teams communicate with each other and with humans.

## Open Questions

- How does a project team request a review from the QA team?
- How does a human PO broadcast a priority change to all teams?
- Sync vs async communication — when is each appropriate?
- How do teams avoid duplicate work?
- Message format — structured (JSON) or natural language?

## Communication Patterns

### Human → Team

- Direct task assignment
- Priority changes, blockers
- Feedback and corrections

### Team → Human

- Status updates
- Decisions needing approval
- Blockers and escalations

### Team → Team

- Work handoff (e.g., dev team → QA team)
- Resource coordination (e.g., "I'm deploying, hold off")
- Knowledge sharing (e.g., "found a pattern you should know about")

### Broadcast

- Merge freezes
- Incident response
- Architecture decisions

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Message format: timestamped natural language

Every SendMessage is prefixed with `[YYYY-MM-DD HH:MM]`. Agents run `date '+%Y-%m-%d %H:%M'` before sending. No structured JSON envelopes — plain markdown prose with timestamps for ordering.

### Mandatory reporting: no silent idle

Common-prompt rule (both teams): after every completed task, send a report to team-lead. Idle without reporting is forbidden. Report format: what was done, test/CI result, what's pending. This creates a reliable activity log in the team-lead's inbox.

### Research broker pattern (Finn)

Finn is the designated research coordinator. Before any specialist burns their own tokens on exploration, they message Finn. Finn decomposes requests into parallel subtasks, spawns haiku subagents, consolidates results, and delivers a markdown report. This reduces token waste across all agents.

**Key principle:** Finn acts immediately — no task lists, no "I'll do this later." Same-turn execution.

### Attribution on persistent output

All persistent text (md files, GitHub issues/PRs, Jira descriptions, commit messages) carries `(*RC-DEV:AgentName*)`. SendMessage between agents does not need attribution — timestamps are sufficient. Attribution enables post-hoc audit of which agent produced which artifact.

**Known gap:** hr-devs still uses the `RC-DEV` prefix (not updated to `HR-DEV`) — shows that inter-team prefix conventions aren't being enforced.

### Dashboard for human-readable reports

Both teams have a dashboard mechanism: `add-doc-to-dashboard.sh <file> [title]`. Any agent can push a markdown report as a dashboard tab for the PO. This is the async human → read path. Used for: research reports, code review summaries, architecture docs, test coverage.

### Shutdown protocol: ordered, confirmed

Communication at shutdown follows a strict sequence:

1. Team-lead stops all new work
2. Sends shutdown to all agents (broadcast or one-by-one)
3. Waits for confirmation from each
4. Each agent: write WIP to scratchpad → send closing message (LEARNED / DEFERRED / WARNING) → approve

**rc-team:** all steps inline in common-prompt. **hr-devs:** externalised to `docs/startup-shutdown.md` — cleaner separation of concerns.

### Language protocol: Estonian for users, English for devs

- User-facing content (UI, stories, Jira descriptions, AC): Estonian
- Dev-facing content (code, PRs, tech docs, reviews, dashboards): English
- Arvo writes issue descriptions in Estonian; Marcus reviews in English

### Contextual guidance for delegation messages

Every task delegation message must include: current state (what's merged), starting point (files to read), dependencies, branch name. Standardized context packaging reduces back-and-forth.
