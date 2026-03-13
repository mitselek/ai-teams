# HR Devs — Common Standards

## Team

- **Team name:** `hr-devs`
- **Members:** team-lead, sven (frontend), dag (database), tess (testing), marcus (AR/code review), finn (research coordinator), arvo (requirements analyst), medici (health audit), eilama (local LLM scaffolding)

## Communication Rule

Every message you send via SendMessage must be prepended with the current timestamp in `[YYYY-MM-DD HH:MM]` format. Get the current time by running: `date '+%Y-%m-%d %H:%M'` before sending any message.

**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata. Raport peab sisaldama: mis tehti, mis on tulemus (testid, CI), ja kas midagi jäi pooleli.

## Author Attribution

All persistent text output must carry the author agent's name in the format `(*RC-DEV:<AgentName>*)`.

**Where to add it:**

| Output type | Placement |
|---|---|
| `.md` file — short block | On a new line directly below the block |
| `.md` file — whole section by one agent | Next to the section heading, e.g. `## Analysis (*RC-DEV:Finn*)` |
| GitHub issue / PR body | At the bottom of the body |
| Commit message | At the end of the message body (not subject line) |
| Jira issue description | At the bottom of the description |

**Rules:**

- Use the environment prefix `RC-DEV` and your agent name: `(*RC-DEV:Sven*)`, `(*RC-DEV:Marcus*)`, etc.
- Team-lead attribution: `(*RC-DEV:team-lead*)`
- If multiple agents contributed to one document, each section gets its own attribution
- SendMessage between agents does NOT need attribution (timestamps are enough)

## Language Rules

- **User-facing content** (UI labels, user stories, AC, Jira descriptions): **Estonian**
- **Developer-facing content** (code, comments, commit messages, PR descriptions, technical docs, GitHub issues, code review verdicts, dashboard reports): **English**

## Standards

- Read `dev-toolkit/CODING_STANDARDS.md` for TypeScript, Svelte 5, and D1 patterns
- Follow `dev-toolkit/WORKFLOW.md` for the story workflow (TDD mandatory)
- **Branch from `develop`** — never branch from or target `main`. PR base is always `develop`
- Branch naming: `story/<issue-number>-short-description` or `fix/<issue-number>-short-description`
- Quality gates before PR: `npm run tests`, `npm run check`, `npm run lint`
- **PR body:** use the PR template format. All `[ ]` checkboxes must be ticked (`[x]`) before running `gh pr create`. Do not create a PR with unchecked boxes.
- Use **npm** (NOT pnpm) for hr-platform/conversations

## Agent Spawning Rule

**KOHUSTUSLIK:** Agente tuleb ALATI spawnida `run_in_background: true` parameetriga. Foreground Agent tool blokeerib team-lead'i ja ta ei saa vahepeal SendMessage sõnumeid vastu võtta.

```
Agent tool parameetrid:
  run_in_background: true    <-- ALATI
  name: "agent-name"
  prompt: "..."
```

## Research Support

When you need information gathered (GitHub issues, Jira tickets, codebase lookups, schema references), message **finn**. He will collect the data and send you a markdown report. Use Finn before burning your own tokens on exploration.

## Jira Access

Jira credentials are at `~/.claude/.env`. Load before API calls:

```bash
source ~/.claude/.env
curl -s -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" "$ATLASSIAN_BASE_URL/rest/api/3/issue/VL-XXX?fields=summary,status,assignee,description"
```

Project key: **VL** (Vestluste lahendus). Board: <https://eestiraudtee.atlassian.net/browse/VL>

## On Startup

1. Read `hr-platform/.claude/teams/hr-devs/memory/<your-name>.md` if it exists — this is your scratchpad from previous sessions
2. Read shared knowledge files relevant to your role (see Team Memory below)
3. Send a brief intro message to `team-lead` saying you're ready and what you recall from your scratchpad

## Team Memory

### Directory Structure

- **`memory/`** — agent scratchpads (personal, per-session state). One file per agent.
- **`docs/`** — shared knowledge files (team-wide reference material).

### Personal Scratchpads

Each teammate maintains a personal notes file at `hr-platform/.claude/teams/hr-devs/memory/<your-name>.md`.
You own this file — only you write to it. Keep it under 100 lines; prune stale entries.

Use tags to categorize entries (date every entry):

- `[DECISION]` — settled choices and rationale
- `[PATTERN]` — discovered approaches that work
- `[WIP]` — in-progress state (resume points)
- `[CHECKPOINT]` — periodic progress snapshots during long tasks
- `[DEFERRED]` — items pending a decision, with reason
- `[GOTCHA]` — important pitfalls or surprises
- `[LEARNED]` — key discoveries worth remembering

### Shared Knowledge Files

For cross-cutting discoveries, append to the relevant shared file in `hr-platform/.claude/teams/hr-devs/docs/`:

- **`architecture-decisions.md`** — settled architectural choices (format: decision, rationale, date). Any teammate may append.
- **`test-gaps.md`** — untested areas for triage (Tess appends, team-lead triages into issues).
- **`api-contracts.md`** — agreed API shapes between frontend and backend (Sven and Dag both write).

### When to Save

- **Immediately on discovery** — don't defer to session end; context compaction kills deferred writes
- **During long tasks** — checkpoint progress periodically (tag: `[CHECKPOINT]`)
- **Before shutdown** — see Shutdown Protocol below

### What to Save

Only persist knowledge that:

- Is non-obvious from reading the code
- Is stable (won't change next commit)
- Cost real tokens to discover
- Would save a fresh you >5 minutes of re-discovery

### What NOT to Save

- Search paths ("I grepped for X")
- Transient failures already fixed
- Anything already in CLAUDE.md, MEMORY.md, or one grep away
- Draft work that got superseded

## Shutdown Protocol

Follow `hr-platform/.claude/teams/hr-devs/docs/startup-shutdown.md` for the full procedure.

**Teammates — when you receive a shutdown request:**

1. Write in-progress state to your scratchpad (`[WIP]` or `[CHECKPOINT]`)
2. Send a closing message to team-lead with: `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (1 bullet each, max)
3. Then approve the shutdown

## Shared Workspace Protocol

The team shares one git working directory. To prevent conflicts:

- **Only one agent owns git operations at a time** — the agent creating the PR handles all git (checkout, add, commit, push)
- **Team-lead is read-only during implementation** — delegates, doesn't touch files
- **Coordinate before switching branches** — message team-lead before `git checkout` so they can alert other agents
- **Never force-push or reset** without team-lead approval

## Code Review Protocol (Marcus)

Marcus posts all code review verdicts via the GitHub Reviews API — never as plain PR comments:

```bash
source ~/.claude/.env && GH_TOKEN=$GITHUB_TOKEN gh pr review <PR_NUMBER> --repo Eesti-Raudtee/hr-platform --comment --body "..."
```

Using `--comment` (COMMENTED state) creates a formal review record visible in the GitHub reviews widget, providing an audit trail even though the shared account cannot self-approve. Never use `gh pr comment` for review verdicts — those appear only in the comment thread and not in `reviews: []`.

## Issue Closure Protocol

When a story/issue is complete and merged, add a completion comment before closing:

```markdown
## Completed

- **Summary:** [1-2 sentences of what was done]
- **Files changed:** [list key files]
- **Tests:** [X/X passing, new tests added]
- **AC verification:** [confirm each acceptance criterion is met]
```

Mark all task checkboxes as complete. Team-lead closes the issue (not teammates).

## Dashboard Docs

You can push any document to the team dashboard for the user (PO) to read. Use this freely whenever you produce a report, analysis, mapping, or any markdown output worth sharing.

```bash
~/github/dev-toolkit/.claude/teams/add-doc-to-dashboard.sh <file-path> [title]
```

- Renders as a tab in the dashboard header strip
- User can close tabs with `×` when done reading
- In-memory only — docs disappear on dashboard restart
- Title defaults to filename without extension if omitted

**When to use:** research reports, code review summaries, architecture docs, test coverage reports, schema mappings — anything the user would want to read in a formatted view rather than as a raw SendMessage.

## Known Pitfalls

- **`$app/paths` in `.server.ts`** — NEVER import `$app/paths` in server files. Use literal strings. workerd vitest pool resolves `window`-dependent code at module load time, causing CI failures.
- **gray-matter YAML dates** — `gray-matter` coerces bare YAML dates to JS Date objects. Convert back with `.toISOString().slice(0, 10)` before Zod validation.
- **`~/.claude/.env` values MUST be quoted** — special chars break without quotes.
- **Jira API endpoint** — use `/rest/api/3/search/jql` (old `/search` removed by Atlassian).
- **`overflow-x: auto/scroll/hidden` blocks `position: sticky`** — use `overflow-x: clip` instead (clips without creating a scroll context).

## Contextual Guidance

When team-lead assigns work via message, the message should include:

- **Current state** — what's already merged, what branches exist
- **Starting point** — which files to read first
- **Dependencies** — what must be done before or after
- **Branch name** — what to call the branch

## Team-Lead Role Boundary (enforced by all teammates)

The team-lead is a **coordinator only**. If you (as a teammate) observe the team-lead doing any of the following, message them with a reminder:

- Editing source code files (.ts, .svelte, .js, .sql, .css)
- Running builds, tests, or deployments
- Writing git commits or pushing code
- Reading source code to understand implementation details

The correct team-lead actions are: reading team config/memory files, messaging teammates, managing tasks, and closing issues after review.

**Teammates own their work end-to-end:** research (with Finn), implement, test, commit, push, create PR. Team-lead only assigns, monitors, and closes.
