# esl-legal -- Startup

This is the lean startup checklist. Case-driven activation; sessions spawned when a case is active, dormant between cases.

## On every team session start (Papinianus runs this)

1. **Date check.** Run `date '+%Y-%m-%d %H:%M'`. Identify active case from `cases/` (most recent subdir with `README.md` status `active`). Note T-counter position in scratchpad as `[CHECKPOINT]`.
2. **TeamCreate.** Bootstrap the runtime team registry: `TeamCreate(team_name: "esl-legal")` -- this is a first-class harness tool, bare name (NOT `mcp__teamwork__TeamCreate`). Inboxes are created at registration -- service roles (Gaius, then specialists) must spawn after this.
3. **Restore inboxes.** Run `./restore-inboxes.sh` at repo root. The script pumps repo-side `inboxes/` (committed to git, survives across machines and runtime cleans) into runtime `~/.claude/teams/esl-legal/inboxes/`, pruning stale shutdown messages per `restore-filter.jq`. Cold start (no `inboxes/` dir) is handled gracefully.
4. **Plan re-read.** Open `cases/<active-case>/README.md` (case index). For case #1 (Peterson), the source-of-record brief lives at `~/Documents/ESL-research/peterson-sp-muusika-2026-05/2026-05-13-legal-scan-brief.md` -- read once during onboarding, refer to the case README thereafter. Identify what's open for this session.
5. **Brilliant pulse.** Run a tight `mcp__brilliant__search_entries` with `logical_path="Context/esl/sp-muusika-peterson-2026"` (or the relevant case path for case ≥ 2). Skim `updated_at` and `domain_meta.status`. Anything new since last session? Note in scratchpad.
6. **Wiki pulse.** Quick scan of `wiki/index.md` for any entries Gaius flagged `[WIP]` or `[NEEDS-REVIEW]` last session. Surface to current-session priorities.
7. **Inbox.** Check messages from PO and from any teammates that ran in the last session.
8. **Greet the team.** SendMessage to each agent confirming session is live. Do NOT spawn agents preemptively -- only spawn when you have work for them. **Spawn order when spawning multiple at once:** Gaius first (he's the corpus surface other agents depend on), then specialists by case demand.

## On agent spawn (per-agent first run)

When Papinianus first spawns an agent in a session, that agent runs:

1. Read own scratchpad at `memory/<own-name>.md`.
2. Read `common-prompt.md`.
3. Read the brief (`~/Documents/ESL-research/peterson-sp-muusika-2026-05/2026-05-13-legal-scan-brief.md`) once during onboarding.
4. Read the active case index (`cases/<active-case>/README.md`).
5. Read whatever the assigned task points to.
6. SendMessage to Papinianus: `[YYYY-MM-DD HH:MM] <name> here, ready for assigned task.`

## On session end (Papinianus runs this last)

1. Confirm every agent has shut down (each sends `[LEARNED]/[DEFERRED]/[WARNING]/[UNADDRESSED]` closing message).
2. Update `cases/<active-case>/README.md` with current status (`active` → either still-`active` for next session, or `pending-jurist-review` once memo lands).
3. **Persist inboxes.** Run `./persist-inboxes.sh` at repo root. The script pumps runtime `~/.claude/teams/esl-legal/inboxes/` to repo-side `inboxes/`, pruning to last 100 messages per agent. Repo-side is then `git add inboxes/ && git commit` (PO greenlights commit).
4. **TeamDelete on graceful exit:** `TeamDelete(team_name: "esl-legal")` -- first-class harness tool, bare name. **This clears the runtime registry, NOT the roster definition in repo.** Persistent roster carries between sessions.
5. Update own scratchpad with session `[CHECKPOINT]`.
6. SendMessage to PO: session summary -- what shipped, what's open, next session's focus.

## What this startup is NOT

- This is not a CI/CD pipeline. The team produces research artifacts; PO ships outcomes (jurist conversations, posture decisions).
- This is not a Peterson-only team. Case #1 happens to be Peterson; the team's identity is the support function.
- This is not an operational team like esl-suvekool. The team produces analysis, not drafts-for-PO-to-send. No external mail is ever drafted by this team.

## Restart-readiness

Sessions may span days (Peterson active phase ~10 days, then gap before case #2). Each session re-bootstraps via TeamCreate + restore-inboxes. The `.claude/startup.md` hook at repo root auto-bootstraps fresh Claude sessions opened in the workdir.
