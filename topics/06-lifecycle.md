# Lifecycle

Spawning, scaling, shutdown, and handover of teams.

## Open Questions

- How is a team created — manually by PO or automatically by manager agent?
- What triggers team shutdown — task completion? idle timeout?
- How does handover work between sessions? (context, state, progress)
- Can teams self-replicate or split?
- How do we handle stale teams that lost context?

## Lifecycle Stages

### 1. Creation
- Who decides to create a team?
- Initial configuration: roster, permissions, repo access
- Bootstrap: load context, read CLAUDE.md, understand codebase

### 2. Operation
- Continuous work on assigned tasks
- Health monitoring (context usage, error rates)
- Dynamic scaling — add/remove agents as needed

### 3. Handover
- Session boundaries — what persists across restarts?
- Context compression — what to save to memory?
- Work-in-progress state — branches, uncommitted changes

### 4. Shutdown
- Clean shutdown — commit work, update issues, notify
- Forced shutdown — context limit, error, human decision
- Resource cleanup — branches, worktrees, temp files

## Notes

