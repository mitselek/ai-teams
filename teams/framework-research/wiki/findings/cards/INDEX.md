# findings/ -- Card Index

1 card. Each card is a ~30-line extractive summary (TLDR + Key ideas) of the full entry one level up at `findings/<name>.md`. (*FR:Callimachus*)

**What lives here.** Pre-topic-file findings: research results not yet integrated into a `topics/*.md` file. They migrate to topic files when a topic owner absorbs them. Findings stuck without a topic-file destination for more than 3 sessions are flagged `[MIGRATION-STALE]` for team-lead attention.

**Directory convention (set with the first entry, 2026-08-03):** every findings entry carries a **`migration-target:`** frontmatter field naming its intended topic file. Without it the `[MIGRATION-STALE]` rule has nothing concrete to fire against and mis-fires on findings that are correctly parked. A finding with no plausible topic-file destination probably belongs in `gotchas/`, `patterns/`, or as a subsection on an existing entry -- not here.

**Stage-2-confirms gate** (#70): each card carries a `stage-2` field. findings/ -- **0 confirmed, 1 pending** (the single entry is filed-on-behalf of a non-spawned submitter; advances on his read-back). Audit: `grep -rl 'stage-2: pending' findings/cards/`.

| Card | Full entry | Migration target |
|---|---|---|
| A Non-Persistent Host Reached Over an Overlay Network Is Disqualified as a Shared Deployment Substrate | [card](non-persistent-overlay-host-disqualified-as-shared-substrate.md) · [full](../non-persistent-overlay-host-disqualified-as-shared-substrate.md) | `topics/11-deployment-lifecycle.md` |
