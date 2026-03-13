# Restart Test Plan — framework-research (*FR:Volta*)

## Purpose

Validate the canonical startup/shutdown protocol from `topics/06-lifecycle.md` by executing a full shutdown and cold restart of the framework-research team. The new session has no resumed context — a fresh team-lead must self-orient using only persisted state.

## Pre-Shutdown Checklist

Team-lead must verify these before initiating shutdown:

- [ ] All topic files are committed (topics/01 through 08)
- [ ] All scratchpads are written (memory/*.md) — 5 agents: celes, finn, herald, medici, volta
- [ ] docs/health-report.md is current
- [ ] This file (docs/restart-test.md) is committed
- [ ] roster.json reflects all 6 members (team-lead + 5 specialists)
- [ ] common-prompt.md On Startup section tells agents to read their scratchpad
- [ ] All memory and doc files are pushed to remote

## Shutdown Sequence (Exact Steps)

Following the canonical protocol from `topics/06-lifecycle.md`, Shutdown Phases 1-5:

### Phase 1: Halt
Team-lead announces shutdown. No new tasks delegated.

### Phase 2: Notify
Send shutdown_request to each active agent. Each agent must:
1. Write final state to scratchpad (`[WIP]` or `[CHECKPOINT]`)
2. Send closing message: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Approve shutdown

**Active agents in this session:** finn, celes, volta, herald, medici (check which are actually running — some may have been shut down already during model upgrades)

### Phase 3: Collect
Wait for `teammate_terminated` from each agent. Do NOT proceed on `shutdown_approved` alone.

### Phase 4: Persist
```bash
cd ~/Documents/github/mitselek-ai-teams
git add .claude/teams/framework-research/memory/
git add .claude/teams/framework-research/docs/
git add topics/
git add .claude/teams/framework-research/roster.json
git add .claude/teams/framework-research/common-prompt.md
git add .claude/teams/framework-research/prompts/
git commit -m "chore: save framework-research session state for restart test"
git push
```

### Phase 5: Preserve
Do NOT call TeamDelete. Directory stays on disk for inbox restoration.

## Success Criteria for New Session

The new team-lead (fresh context, no memory of this session) must verify each criterion. Check these in order:

### SC-1: Self-orientation (team-lead alone, before spawning)

| # | Criterion | How to verify | Pass/Fail |
|---|---|---|---|
| 1a | Team-lead can identify the team name and mission | Read common-prompt.md | |
| 1b | Team-lead can list all 6 roster members with roles | Read roster.json | |
| 1c | Team-lead can find the startup procedure | common-prompt.md → On Startup section | |
| 1d | Team-lead can find the canonical lifecycle protocol | Read topics/06-lifecycle.md | |

### SC-2: Startup protocol execution

| # | Criterion | How to verify | Pass/Fail |
|---|---|---|---|
| 2a | Stale team dir handled correctly | Phase 2 (Clean) completes without error | |
| 2b | TeamCreate succeeds with correct name | `config.json` exists with `leadSessionId` | |
| 2c | Inboxes restored (if backup existed) | `inboxes/` dir exists after Phase 4 | |
| 2d | Medici spawned first | Medici sends health report before other agents spawn | |

### SC-3: Agent continuity (after spawning)

| # | Criterion | How to verify | Pass/Fail |
|---|---|---|---|
| 3a | Each agent reads its scratchpad on startup | Agent's intro message references scratchpad content | |
| 3b | No duplicate agents spawned | `config.json` has no `name-2` entries | |
| 3c | Agents know their prior work | Ask any agent "what did you work on last session?" — answer should match scratchpad | |

### SC-4: Work product continuity

| # | Criterion | How to verify | Pass/Fail |
|---|---|---|---|
| 4a | topics/06-lifecycle.md contains canonical protocol | Read file — Volta's startup/shutdown protocol is present | |
| 4b | topics/03-communication.md contains Herald's inter-team design | Read file — Herald's routing/topology/broadcast design is present | |
| 4c | All 8 topic files have Finn's extracted patterns | Each file has `## Patterns from Reference Teams (*FR:Finn*)` section | |
| 4d | Celes's specialist gap analysis is in her scratchpad | memory/celes.md has 8-topic domain model | |

### SC-5: Protocol correctness

| # | Criterion | How to verify | Pass/Fail |
|---|---|---|---|
| 5a | No TeamDelete was called | Team dir exists on disk at session start | |
| 5b | Shutdown closing messages were received | Check scratchpads for `[LEARNED]`/`[DEFERRED]`/`[WARNING]` entries dated today | |
| 5c | Task snapshot exists | memory/task-list-snapshot.md or equivalent persisted by team-lead | |

## Where These Criteria Live

This file is at `.claude/teams/framework-research/docs/restart-test.md`. It is committed to git and will be discoverable by:

1. **Team-lead prompt** — if the prompt mentions restart test, it can point here
2. **Medici health report** — Medici should flag this file as action item on startup
3. **common-prompt.md** — could add a "Restart Validation" section (recommended)
4. **README.md** — could add a note (optional)

**Recommendation:** Add one line to `common-prompt.md` under "On Startup":

```markdown
4. If this is a restart test, read `docs/restart-test.md` and verify success criteria
```

This makes the test discoverable without changing any agent prompts.

## What Must Be Persisted (Summary)

| Category | Files | Owner |
|---|---|---|
| Scratchpads | memory/celes.md, finn.md, herald.md, medici.md, volta.md | Each agent |
| Shared docs | docs/health-report.md, docs/restart-test.md | Medici, Volta |
| Topic files | topics/01 through 08 | Various (attributed) |
| Team config | roster.json, common-prompt.md | Team-lead |
| Agent prompts | prompts/*.md (6 files) | Team-lead / Celes |
| Task snapshot | To be created by team-lead during shutdown Phase 4 | Team-lead |

## Open Questions

1. **Task tool state** — TaskCreate/TaskUpdate state is session-scoped and does NOT persist across restarts. The task-list-snapshot.md is the only cross-session record. Is this sufficient?

2. **Inbox message value** — Are there messages in the current session's inboxes worth preserving for the new session, or are scratchpads sufficient? For a research team (vs. a dev team), scratchpads likely capture everything valuable.

3. **Partial success** — If some criteria pass but others fail, what's the threshold for "protocol works"? Recommendation: SC-1 and SC-2 are must-pass (fundamental protocol). SC-3 through SC-5 are should-pass (continuity quality).
