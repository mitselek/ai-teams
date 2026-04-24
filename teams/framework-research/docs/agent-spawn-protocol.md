---
title: Subagent Fallback Protocol — Framework
doc_id: subagent-fallback-framework
authors: [herald, schliemann]
version: 2.0.0
last_updated: 2026-04-24
supersedes: apex-research v1.0.0 (framing only — operational rules carried forward verbatim)
tags: [operations, fallback, subagent, team, agent-tool]
---

# Subagent Fallback Protocol — Framework

The framework's default spawn mode is the **persistent Agent-tool teammate** (Agent tool with `team_name` + `name` parameters — see issue #60). When a persistent teammate is overkill or impractical, run a **one-shot Agent-tool subagent** (Agent tool with no `team_name`) instead.

Both modes use the same Agent tool. The discriminator is two parameters:

| Mode | `team_name` | `name` | Lifetime | Inbox | Peer DMs |
|---|---|---|---|---|---|
| Persistent teammate (default) | required | required | session-bounded (dies with parent) | yes | yes |
| One-shot subagent (fallback) | omitted | omitted | task-bounded (returns then exits) | no | no |

This document specifies the one-shot subagent fallback mode.

## When to use the fallback

- **Small one-shot tasks** where persistent-teammate overhead (config.json registration, scratchpad bootstrap, intro message round-trip) is disproportionate to the work.
- **Auto-mode / focus sessions** with clear single-track work and no need for cross-agent coordination mid-task.
- **Diagnosing instability** — narrows whether a bug is in the persistent-teammate infrastructure (inbox routing, dual-hub, scratchpad growth) vs the work itself.
- **Surge work** where the persistent team is at capacity and the surge task has no continuity dependency.

The fallback is NOT a default. The default is the persistent Agent-tool teammate. Use the fallback only when one of the above triggers applies.

## Protocol

1. **Sequential, never parallel.** Subagent work blocks the parent's context until the agent returns. Even two "independent" subagents must run one at a time. (This is a property of the Agent-tool runtime, not a discipline rule — but worth stating because callers reach for parallelism by reflex.)
2. **GH issue is the brief.** The subagent prompt should point at `gh issue view NNN`, not restate the issue body. Same handoff discipline as persistent teammates. Keeps the issue as the single source of truth.
3. **Scratchpad update before signoff** is mandatory. The subagent must append `[CHECKPOINT] / [LEARNED] / [DEFERRED] / [WARNING]` entries to their own scratchpad at `teams/<team>/memory/<name>.md` **before** returning their final report. Their context dies with the return — anything not written is lost.
4. **Knowledge submissions** — if the subagent discovers a wiki-worthy pattern/gotcha, they write a Protocol A draft to `/tmp/knowledge-submission-<slug>.md` and mention it in their report. Parent (team-lead or whichever persistent agent dispatched) relays it to the librarian (live if up, or directly into the wiki dir if running fully fallback team-wide).
5. **Directory ownership still applies.** Whatever per-agent directory partition the team uses (e.g., apex-research's `inventory/`, `shared/`, `dashboard/`, `specs/`+`decisions/`, `wiki/`) survives the fallback — subagent briefs must respect it.
6. **Commit + push before returning.** Same rule as persistent teammates. No uncommitted work in the subagent's sandbox. Without this, the next session has no record the work happened.

## Prompt template

```
You are <AgentName>, <role> on the <team> team.

## Persona
<contents of teams/<team>/prompts/<name>.md>

## Read-orient before starting
1. teams/<team>/common-prompt.md
2. teams/<team>/memory/<name>.md
3. <task-specific files>

## Session context
<1–3 sentences on what's happening in the team, in enough detail for the
subagent to make judgment calls>

## Your task
Read and execute:
    gh issue view NNN

Work sequentially. Do not delegate.

## Knowledge submission
If you discover a wiki-worthy pattern/gotcha, write a Protocol A draft
to /tmp/knowledge-submission-<slug>.md and mention it in your report.

## Scratchpad update (mandatory before signoff)
Before returning your final report, append to
`teams/<team>/memory/<name>.md`:
- [CHECKPOINT] commits shipped (SHAs)
- [LEARNED] new insights worth preserving
- [DEFERRED] anything left over
- [WARNING] gotchas for future sessions

## Commit + push
Before signoff, commit + push your changes on the current branch.

## Report
Return a concise closing report: what you shipped, what was deferred,
1–2 things you'd do differently.
```

## Tradeoffs

| Gained (fallback) | Lost vs persistent teammate |
|---|---|
| Lower bootstrap cost (no intro round-trip, no inbox setup) | Peer DMs between teammates |
| Zero inbox overhead | Direct Protocol A/B routing to the librarian |
| Parent-context visibility of agent work | Parallel work (sequential only) |
| No persistent registration to clean up afterwards | Persistent scratchpad-growth context |
| Single failure surface (Agent tool only — no inbox path) | Multi-step continuity within one session |

## Known limitations

- **Sequential only.** Subagents are parent-context-blocking; the next one starts after the previous returns.
- **No real-time coordination.** Subagents cannot talk to each other or to parent mid-task.
- **No live librarian Protocol A/B.** Knowledge submissions are relayed by parent, not routed directly. Queries cannot be served at all unless the librarian is itself run as a fallback subagent on a fresh prompt.
- **No team-alive dashboard signal.** Parent thread is the only "alive" entity for the session window.

## When to use a persistent Agent-tool teammate instead

- Multi-session continuity matters (long analysis phase with accumulated context).
- Concurrent work on >1 track (e.g., dashboard + extraction simultaneously).
- Real-time librarian queries needed.
- Cross-agent coordination expected mid-task (peer DMs, mid-flight protocol exchanges).
- User explicitly asks for a persistent teammate.

## Caveat — session lifetime (load-bearing)

Persistent Agent-tool teammates live inside the parent team-lead Claude Code process. **If the parent session dies, the teammates die too.** Under the retired tmux-pane mode, each pane was its own `claude` CLI and could outlive the team-lead session. Apex-research's session-19 reasoning (issue #60): "non-blocking for us; environment is stable and sessions are trending shorter." Other teams should weigh their own session-lifetime profile before adopting persistent Agent-tool teammates as their default.

The fallback subagent does not have this concern — it returns within a single tool call and is gone before the parent session ends.

## Housekeeping after a fallback session

1. **Save scratchpads** — subagent scratchpad updates are already on disk (they wrote directly), so no separate persist step. Verify with `git status teams/<team>/memory/`.
2. **Relay pending knowledge submissions** — any `/tmp/knowledge-submission-*.md` files, routed to the wiki by parent or a next-session librarian subagent.
3. **Commit + push** the session's artefacts the same way persistent-teammate sessions do.
4. **No inbox to persist** — subagents had no inboxes. Persistent-team runtime dir `$HOME/.claude/teams/<team>/` can be cleaned (`rm -rf`) since it is ephemeral by platform design.

## Provenance

- v1.0.0 (apex-research, 2026-04-23, Schliemann) — original framing as "persistent-tmux-pane teammate vs one-shot Agent-tool subagent."
- v2.0.0 (framework, 2026-04-24, Herald + Schliemann) — reframed for issue #60: tmux-pane mode retired; both modes now use the Agent tool, distinguished by `team_name` + `name` parameters. Operational rules (1)–(6) carried forward verbatim.

(*FR:Herald*)
