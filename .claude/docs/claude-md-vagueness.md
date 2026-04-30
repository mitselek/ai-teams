# CLAUDE.md — Remaining Vagueness

Review notes on `~/.claude/CLAUDE.md` after the 2026-04-14 translate + trim pass. These are spots where the instructions don't tell a fresh agent *how* or *where*, and would benefit from a concrete fix.

## 1. Missing file paths

Three sections reference artifacts without naming their location:

- **Roster JSON** — "Read the agent's `prompt` field from the roster JSON" never says where the JSON lives. Candidate: `teams/<team>/roster.json` (workdir-relative).
- **Scratchpads** — the memory-tags section assumes scratchpads exist but never names the path. Candidate: `teams/<team>/memory/<agent>.md`.
- **Inboxes** — "back up inboxes" mentions no path. Candidate: `teams/<team>/inboxes/<agent>.json`.

One line per section would fix all three.

## 2. Team Reuse section has a logic break

Numbered as a sequential recipe, but step 3 is actually a separate rule:

> 1. If yes: back up inboxes → delete the old team → TeamCreate(...) → restore inboxes
> 2. If an agent already exists in the team, send SendMessage — don't spawn a duplicate

After step 2 runs, the old team is gone — "agent already exists" can't apply from the same flow. Step 3 is really a general "don't spawn duplicates during an active session" rule, not step 3 of reuse.

**Fix:** pull step 3 out into its own top-level bullet ("During an active session, if an agent is already in the team, use SendMessage rather than spawning a duplicate").

## 3. "Has a team (roster)" — detection signal unspecified

> If the project has a team (roster), ALWAYS delegate to team members.

The detection rule is implicit. Is the check:

- `teams/` directory exists?
- `roster.json` present anywhere?
- User explicitly mentioned a team?

A concrete rule would make this mechanical. Suggested: "A project has a team if `teams/<name>/roster.json` exists for any `<name>`."

## 4. Shutdown mechanics are hand-wavy

Two under-specified steps:

- **"Send shutdown to every agent"** — using what? `SendMessage` with literal text "shutdown"? A specific protocol field? `TaskStop`? Needs a concrete channel.
- **"Wait for confirmation from each"** — what counts as confirmation? A reply matching a pattern? Task state reaching `completed`? Absence of signal can deadlock the protocol or be silently skipped.

**Fix:** name the exact send/confirm channel, e.g. "`SendMessage` with text starting `[SHUTDOWN]`; consider the agent shut down when it replies with `[SHUTDOWN-ACK]` or its task reaches `completed`".

## 5. Date format for scratchpad entries is unspecified

> Date every entry

Multiple plausible formats:

- `2026-04-14`
- `2026-04-14 18:30`
- ISO 8601 `2026-04-14T18:30:00Z`
- `[CHECKPOINT] 2026-03-20 08:07` (style seen in comms-dev scratchpads)

Pick one and name it.

## 6. "Max 1 of each" — grammatically ambiguous

> `[LEARNED]`, `[DEFERRED]`, `[WARNING]` (max 1 of each)

Could mean:

- (a) At most one tag *of each type* in the closing message (one `[LEARNED]`, one `[DEFERRED]`, one `[WARNING]`)
- (b) At most one *item under each tag* (not a laundry list of learnings)

Interpretation (b) is almost certainly the intent — the rule exists to force ranking. Reword to make it explicit, e.g. "keep each tag's content to a single most-important item".

---

## Priority ranking

If fixing in one pass, do these first:

1. **Path specifications** (item 1) — highest leverage; three sections become mechanical
2. **Team Reuse restructuring** (item 2) — removes a real logical contradiction
3. **Detection signal for "has a team"** (item 3) — makes the delegation rule mechanical
4. **Shutdown concrete channel** (item 4) — prevents silent deadlocks

Items 5 and 6 are cosmetic/clarity fixes and can ride along.
