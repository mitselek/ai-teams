# esl-suvekool — Startup

This is the lean startup checklist. Lower ceremony than framework-research; this team's job is shipping logistics for a real concert in August 2026, not stress-testing protocols.

## On every team session start (Tobi runs this)

1. **Date check.** Run `date '+%Y-%m-%d %H:%M'`. Compute current T-counter position relative to T0 = 2026-08-16. Note in scratchpad as a `[CHECKPOINT]`.
2. **Plan re-read.** Open `../Haapsalu 2026/2026 plaan.md` § "Ajajoon ja tähtajad". Identify which T-counter milestones are within the next 4 weeks. These are the active worksurfaces for this session.
3. **Brilliant pulse.** Run a tight `mcp__brilliant__search_entries` with `logical_path="Meetings/esl/2026-08-14-suvekool-haapsalu"` and `logical_path="Projects/esl"`. Skim `updated_at` and `domain_meta.status`. Anything new since last session? Note in scratchpad.
4. **Inbox.** Check messages from PO and from any teammates that ran in the last session.
5. **Greet the team.** SendMessage to each agent confirming session is live. Do NOT spawn agents preemptively — only spawn when you have work for them.

## On agent spawn (per-agent first run)

When Tobi first spawns an agent in a session, that agent runs:

1. Read own scratchpad at `teams/esl-suvekool/memory/<own-name>.md`.
2. Read `common-prompt.md`.
3. For Tampere only on first-ever spawn: read `../README.md` and `../GEMINI.md` once to understand the toolkit, then never again — toolkit is methodology consult only.
4. Read whatever the assigned task points to.
5. SendMessage to Tobi: `[YYYY-MM-DD HH:MM] <name> here, ready for assigned task.`

## On session end (Tobi runs this last)

1. Confirm every agent has shut down (each sends `[LEARNED]/[DEFERRED]/[WARNING]/[UNADDRESSED]` closing message).
2. Update `docs/timeline.md` with current T-counter state.
3. Update own scratchpad with session `[CHECKPOINT]`.
4. SendMessage to PO: session summary — what shipped, what's open, next session's focus.

## What this startup is NOT

- This is not a CI/CD pipeline. The team ships drafts; PO ships outcomes.
- This is not a research team. We don't write design docs; we run a concert.
- This is not a permanent operation. Persistent roster, but the project ends T+1n (2026-08-23) with the succession brief.
