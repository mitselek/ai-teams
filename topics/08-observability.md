# Observability

Logging, auditing, and monitoring team activity.

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

---

## Observability Model (*FR:Volta*)

### Decision

Agent team observability operates at **three layers**: session-level (within a single session), cross-session (across session boundaries), and cross-team (across team boundaries). Each layer has different data sources, different consumers, and different failure modes. The framework does not require external infrastructure — all observability is built from artifacts that teams already produce.

### Rationale

Reference teams evolved observability organically: Medici audits, shutdown reports, attribution tags, task snapshots. These work but are disconnected — no single consumer can answer "is this team healthy?" without reading 5+ files. The model below connects these existing mechanisms into a coherent picture without adding infrastructure.

The key insight: **agent teams produce observability data as a byproduct of their normal work.** Scratchpads, closing messages, task snapshots, health reports, git history, and author attribution are all observability signals. The gap is not data collection — it is signal aggregation and anomaly detection.

---

## Layer 1: Session-Level Observability (*FR:Volta*)

### What is observable within a single session

| Signal | Source | Producer | Consumer |
|---|---|---|---|
| Agent liveness | SendMessage intro reports | Each agent | Team-lead |
| Task progress | TaskCreate/TaskUpdate transitions | Team-lead + agents | Team-lead, PO (via dashboard) |
| Knowledge health | Health report | Medici | Team-lead |
| Work artifacts | Commits, PRs, issues, docs | Implementation agents | Marcus (review), team-lead |
| Errors and blocks | `[GOTCHA]`, `[DEFERRED]` in scratchpads | Each agent | Medici (next audit), team-lead |
| External actions | Git push, deploy, API calls | Implementation agents | Audit trail (attribution tags) |

### The Medici Audit as Observability Mechanism

Medici is the team's internal observability agent. Field experience across 5 audits (v1–v5) reveals a stable pattern:

**Audit triggers:**

| Trigger | When | Purpose |
|---|---|---|
| Startup audit | Phase 5 of canonical startup | Detect stale state, prune scratchpads, verify prompt consistency |
| On-demand audit | Team-lead requests mid-session | Respond to suspected drift, knowledge conflicts, or team confusion |
| Pre-shutdown audit | Before Shutdown Phase 2 (optional) | Capture session learnings before context is lost |

**Audit scope varies by team type:**

| Scope category | Development team (cloudflare-builders) | Research team (framework-research) |
|---|---|---|
| Scratchpad health | `[STALE]`, `[PROMOTE]`, `[CONSOLIDATE]`, `[CROSSPOLL]`, `[GAP]`, `[COMMON]` | Same |
| Content coherence | N/A | `[COHERENCE]` — cross-topic consistency |
| Reference extraction | N/A | `[EXTRACTION]` — patterns not yet pulled from reference material |
| Contradiction detection | Prompt vs. scratchpad conflicts | Topic vs. topic, topic vs. reference conflicts |
| Gap analysis | Test gaps (`test-gaps.md`) | Topic coverage gaps |

**Audit output format (canonical):**

```markdown
# Team Health Report — [DATE] (Audit vN)

## Summary
- X recommendations total (Y HIGH, Z MEDIUM, W LOW)
- Overall health: [GOOD / DEGRADED / CRITICAL]

## Line counts after cleanup
| Scratchpad | Before | After | Status |

## Changes Applied
### [TAG] target
- What was changed and why

## Remaining Outstanding Items
| Item | Location | Why not auto-fixed |

## Previous Audit Findings — Status
| Finding | Previous status | Current status |

## Recommendations (for team-lead)
### HIGH / MEDIUM / LOW
```

**Key design properties:**

1. **Advisory only.** Medici writes reports and recommendations. Team-lead decides what to apply. This prevents Medici from becoming a single point of failure — if Medici's analysis is wrong, the damage is limited to a bad recommendation, not a bad edit.

2. **Versioned.** Each audit is numbered (v1, v2, ...). The report tracks previous findings and their resolution status. This creates a longitudinal view: which problems persist, which are one-time, which keep recurring.

3. **Scope-restricted.** Medici can read everything but write only to its own scratchpad and `docs/health-report.md`. No prompt edits, no code changes, no git operations. This makes Medici safe to run at any time — it cannot break the team.

4. **Cross-session memory.** Medici's scratchpad persists patterns about audit cadence and recurring issues. Field observation: "finn.md 'Team size: 3' stale for 3 audits" — this kind of persistence tracking is only possible because Medici retains memory across sessions.

### Stuck Detection (*FR:Volta*)

**Problem:** How does a team-lead or PO know when an agent is stuck? Currently: they don't, unless the agent self-reports. Agents that are stuck often don't know they're stuck — they keep retrying, burning tokens.

**Observable stuck signals:**

| Signal | How to detect | Severity |
|---|---|---|
| No intro report after spawn | Agent spawned but no SendMessage received within 2 minutes | HIGH — agent may have crashed or failed to read prompt |
| Repeated tool failures | Agent's bash commands returning errors in a loop | HIGH — likely environment issue |
| No task progress | Task status unchanged for >15 minutes with no messages | MEDIUM — may be working on a complex sub-problem, or stuck |
| Circular messages | Agent sends the same question to team-lead multiple times | MEDIUM — confusion or context loss |
| Scratchpad not written at checkpoint | Long task with no `[CHECKPOINT]` entries | LOW — may just be focused, but risks losing work on crash |

**Who detects:** Currently only team-lead (by noticing silence or repeated messages). The framework should formalize this into a lightweight heartbeat:

**Proposed heartbeat pattern:**

Agents working on long tasks send a structured progress signal to team-lead at natural checkpoints:

```
[PROGRESS] Task: <task-id>. Step N/M complete. Next: <what>. Blocked: <yes/no>.
```

This is not a timer-based ping (which would waste tokens). It is checkpoint-driven — agents emit it when they finish a meaningful sub-step. The team-lead aggregates these into a mental model of team progress.

**Failure mode if absent:** Team-lead discovers agent was stuck only at shutdown when the closing report says `[DEFERRED] everything — couldn't get the build to work`. Session wasted.

---

## Layer 2: Cross-Session Observability (*FR:Volta*)

### Decision

Cross-session observability answers: "Is this team making progress over time, or regressing?" The data sources are all git-tracked artifacts that survive session boundaries.

### Observable cross-session signals

| Signal | Source | What it reveals |
|---|---|---|
| Scratchpad evolution | `git diff` on `memory/*.md` | What agents learned, what problems recur |
| Task snapshot delta | Compare `task-list-snapshot.md` across sessions | Tasks that stay `in_progress` for multiple sessions = blocked |
| Health report trend | Audit version sequence (v1→v2→...→vN) | Recommendations that persist across audits = systemic issues |
| Inbox growth | `inboxes/*.json` file sizes | Communication volume trends |
| Known Pitfalls growth | Common-prompt `## Known Pitfalls` section | Incident rate — growing list means team is encountering new failures |

### Regression Detection (*FR:Volta*)

**Problem:** A team can lose knowledge across sessions. Scratchpad entries get pruned, context compaction drops important details, agents restart with partial memory. How do we detect this?

**Regression indicators:**

| Indicator | Detection method | Meaning |
|---|---|---|
| Same `[GOTCHA]` rediscovered | Medici compares current scratchpads against previous health reports | Knowledge was pruned too aggressively or never promoted to prompt |
| Same bug re-introduced | Git history: revert or re-fix of same code pattern | Fix was not covered by tests, or agent didn't read prior fix |
| Audit finding persists >3 versions | Health report "Previous Findings" table | Systemic issue that nobody is addressing |
| Task re-created after completion | Task snapshot shows task completed in session N, re-created in session N+2 | Work was lost or the completion was premature |
| Prompt contradiction re-emerges | Medici `[CONTRADICTION]` finding that was previously resolved | Prompt was overwritten by a stale version (git conflict or careless edit) |

**Canonical regression check (run during Phase 5 Audit):**

Medici's startup audit should include a "regression scan" — compare current state against the previous health report's "Changes Applied" section. For each change that was applied:

1. Is it still applied? (e.g., pruned entry still absent, prompt fix still present)
2. Has the underlying issue returned? (e.g., new stale entries about the same topic)

If >30% of previous fixes have regressed, the health report should flag: `Overall health: DEGRADED — regression detected`.

### Stale State Detection (*FR:Volta*)

Stale state is information that was once correct but is no longer. It is the primary source of agent confusion across sessions.

**Where stale state lives:**

| Location | Stale indicator | Who detects |
|---|---|---|
| Scratchpads | `[WIP]` for merged branches, `[DEFERRED]` for resolved blockers | Medici (`[STALE]` check) |
| Task snapshots | Tasks marked `in_progress` for work that was completed | Team-lead (on Phase 0 read) |
| Prompts | References to deleted files, old API endpoints, wrong paths | Medici (`[GAP]` / `[CONTRADICTION]` check) |
| Common-prompt | Known Pitfalls for bugs that were fixed at the framework level | Medici (`[STALE]` check) |
| `roster.json` | Wrong `workDir`, wrong model assignments, missing members | Medici or Phase 0 validation |
| `README.md` | Status column showing "brainstorm" for advanced-draft topics | Medici (`[CONTRADICTION]` check) |

**Field evidence:** The framework-research team's health report (v5) documents 4 contradictions, including a `finn.md` stale claim that persisted across 3 audits and a `README.md` status column stale for 3 audits. These are real regressions in team knowledge that reduce newcomer comprehension and waste agent tokens on wrong assumptions.

### Context Loss Detection (*FR:Volta*)

**Problem:** When an agent restarts with a fresh context window, it loses all in-session learnings not written to scratchpad. How do we detect that context loss occurred and measure its impact?

**Detection:** Compare the agent's closing message (`[LEARNED]`, `[DEFERRED]`, `[WARNING]`) against its scratchpad. If the closing message mentions learnings not in the scratchpad, those learnings are lost.

**Prevention (already in the lifecycle protocol):**

- Write scratchpad entries **immediately on discovery** (not at session end)
- Checkpoint during long tasks
- Medici audits flag entries that should have been persisted but weren't

**Measurable indicator:** Count of `[LEARNED]` items in closing messages that have no corresponding scratchpad entry. Target: zero. If consistently >0, the agent's prompt should reinforce immediate-write discipline.

---

## Layer 3: Cross-Team Observability (*FR:Volta*)

### Decision

When multiple teams operate in the same organization (e.g., apex-research + cloudflare-builders), observability must extend beyond single-team boundaries. Cross-team observability answers: "Are teams aligned? Are handoffs working? Is duplicated effort occurring?"

### Cross-team signals

| Signal | Source | What it reveals |
|---|---|---|
| Spec handoff status | Frontmatter `status:` field in spec files | Whether specs are flowing from research to implementation teams |
| Shared artifact conflicts | Git conflicts on files written by multiple teams | Teams editing the same files without coordination |
| Duplicate discoveries | Same `[LEARNED]` in multiple team scratchpads | Knowledge not being shared across team boundaries |
| API contract drift | `api-contracts.md` in team A vs. actual implementation in team B | Teams diverging on agreed interfaces |
| Blocking dependency chains | Team A's `[DEFERRED]` referencing Team B's output | Inter-team dependency bottlenecks |

### Dashboard as Observability Tool (*FR:Volta*)

The apex-research brainstorm introduces a dashboard that serves dual purpose: PO-facing inventory display AND observability substrate. This is a pattern worth generalizing.

**Dashboard observability layers:**

| Layer | What it shows | Who consumes it | Update frequency |
|---|---|---|---|
| Inventory | APEX app list, page counts, LOV counts | PO, migration teams | Per-extraction-run |
| Overlap analysis | Shared tables, shared LOVs, shared business logic | Research team, PO | Per-analysis-session |
| Spec status | Which apps have specs, at what stage (DRAFT/REVIEWED/APPROVED/ASSIGNED) | PO, migration teams | Per-spec-update |
| Team health | Agent activity, task progress, blocked items | Team-lead, PO | Per-session |

**Key insight:** The dashboard is both a research output AND an observability tool. This dual-use justifies the development cost — it's not pure overhead, it's the primary deliverable that also happens to show team health.

**Dashboard design principles for observability:**

1. **Declarative, not imperative.** The dashboard reads from files in the repo (markdown with frontmatter, JSON extraction outputs). It does not require agents to explicitly "push" data — it pulls from existing artifacts.
2. **Status derived from frontmatter.** Spec files contain `status:` in YAML frontmatter. The dashboard aggregates these into a status board. No separate status database needed.
3. **Stale detection built in.** If an extraction output is older than N sessions (based on git commit date), the dashboard should flag it as potentially stale.
4. **Per-agent activity.** Author attribution tags (`(*TEAM:Agent*)`) in committed files can be parsed to show which agent contributed to which artifact. This is post-hoc activity tracking without runtime logging.

---

## Alerting: When to Notify the PO (*FR:Volta*)

### Decision

The PO should be notified when the team cannot self-correct. Most issues are handled by the team-lead (stuck agents, task reassignment, conflicting outputs). PO notification is reserved for situations where team-lead authority is insufficient.

### Alert taxonomy

| Alert | Trigger | Severity | Who resolves |
|---|---|---|---|
| **Agent stuck** | No progress on task for >15 minutes, no messages | LOW | Team-lead reassigns or restarts agent |
| **Build broken** | CI/CD pipeline failure after push | MEDIUM | Implementation agent fixes; team-lead coordinates |
| **Audit degraded** | Medici reports >30% regression from previous audit | MEDIUM | Team-lead applies recommendations |
| **Team stuck** | Team-lead cannot unblock: all agents idle, external dependency blocking all tasks | **HIGH — notify PO** | PO provides decision, unblocks dependency |
| **Drift detected** | Agent producing output that contradicts approved spec or PO direction | **HIGH — notify PO** | PO reviews, corrects direction |
| **External system down** | GitHub API, Cloudflare, Jira unavailable | MEDIUM | Team-lead pauses affected work; PO notified if >30 min |
| **Budget concern** | Token consumption significantly above expected rate | **HIGH — notify PO** | PO decides: continue, pause, or restructure |
| **Spec handoff failure** | Migration team rejects spec (REVISION_NEEDED) for 2nd time | **HIGH — notify PO** | PO mediates between research and migration teams |

### "Team stuck" definition (*FR:Volta*)

A team is stuck when ALL of these are true:

1. No task has progressed in the last 20 minutes
2. At least one agent has reported a blocker
3. The blocker is outside team-lead authority (requires PO decision, external system access, or cross-team coordination)

A team is NOT stuck if:

- One agent is stuck but others are productive (team-lead reassigns)
- The blocker is internal (agent confusion, environment issue — team-lead fixes)
- Agents are idle because all tasks are complete (session should end, not alert)

### "Agent drifting" definition (*FR:Volta*)

An agent is drifting when its output diverges from its assignment without team-lead awareness. Observable symptoms:

| Symptom | Example | Detection |
|---|---|---|
| Scope creep | Dashboard dev starts refactoring extraction scripts | Team-lead reviews commits against task assignment |
| Role violation | Research agent running `git push` | Medici audit or team-lead observation |
| Spec contradiction | Agent implements feature differently than approved spec | Marcus code review catches this |
| Silent failure | Agent repeatedly retrying a broken command without reporting | Team-lead notices lack of progress messages |

**Prevention:** Clear write-permission boundaries in agent prompts (e.g., "You write ONLY to `dashboard/`"). Reinforced by Medici audits that check if agent output matches agent role.

**Correction:** Team-lead sends a redirect message. If the agent has drifted too far (large diff on wrong files), team-lead may need to revert and reassign.

---

## Observability Data Lifecycle (*FR:Volta*)

### What persists, what doesn't

| Data | Persists across sessions? | Location | Retention |
|---|---|---|---|
| Health reports | Yes | `docs/health-report.md` (git) | Overwritten each audit — git history preserves previous versions |
| Scratchpads | Yes | `memory/<name>.md` (git) | Pruned to 100 lines by Medici |
| Task snapshots | Yes | `memory/task-list-snapshot.md` (git) | Overwritten each session — git history preserves previous versions |
| Closing messages | Yes (in inboxes) | `inboxes/*.json` (git) | Pruned to last 100 messages per agent on shutdown |
| Attribution tags | Yes | Inline in committed files | Permanent — part of the artifact |
| Dashboard state | No | In-memory (node server) | Lost on restart — rebuilt from repo files |
| Task tool state | No | Platform runtime | Lost between sessions — snapshot covers the gap |
| SendMessage history | Partial | Inbox files (pruned) | Last 100 per agent; older messages lost |

### The observability commit (*FR:Volta*)

All persistent observability data is committed during Shutdown Phase 4b in a single atomic commit:

```bash
git add .claude/teams/<team-name>/memory/    # scratchpads + task snapshot
git add .claude/teams/<team-name>/inboxes/   # pruned inboxes (closing messages)
git add .claude/teams/<team-name>/docs/      # health report
git commit -m "chore: save team state (scratchpads, tasks, inboxes, health report)"
git push
```

This commit is the observability checkpoint. `git log` on these paths gives a per-session history of team state. `git diff` between consecutive commits shows what changed.

---

## Open Questions

1. **Token/cost tracking.** No mechanism exists to track token consumption per agent or per team. The Claude Code platform does not expose this to agents. Options: (a) external monitoring via API billing dashboard, (b) wrapper script that logs API calls, (c) accept that cost is not observable from inside the team. Current recommendation: (c) — cost tracking is an organizational concern, not a team concern.

2. **Real-time vs. async.** Current observability is entirely async (reports, scratchpads, closing messages). Real-time dashboards (like the agent-dashboard node server) exist but are in-memory and session-scoped. Should the framework prescribe real-time observability, or is async sufficient? Current evidence: async is sufficient for research and development teams. Real-time may be needed for incident response or production operations teams.

3. **Multi-team health rollup.** When multiple teams exist (apex-research, cloudflare-builders, framework-research), who aggregates health across teams? Options: (a) PO reads each team's health report, (b) a meta-Medici agent spans teams, (c) a dashboard aggregates health reports. This depends on T04 (Hierarchy) — the manager agent layer may own cross-team health.

4. **Automated alerting.** Current alerts are all human-detected (team-lead notices silence, PO reads reports). Should the framework include automated alerting (e.g., a heartbeat monitor that pings PO if no commits for N hours)? This requires infrastructure outside the agent framework. Defer until T04 (manager agent) is designed.
