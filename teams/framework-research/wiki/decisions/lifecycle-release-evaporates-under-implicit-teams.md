---
name: lifecycle-release-evaporates-under-implicit-teams
description: On CLI 2.1.178+ (implicit teams), shutdown Step S5 "Release team leadership" (TeamDelete) is DELETED, not replaced -- leadership is the implicit property of a live session, released by PROCESS EXIT; there is no TeamDelete to call and nothing to release. Shutdown goes 5 phases -> 4, and the startup-Phase2 <-> shutdown-Phase5 symmetry argument evaporates with it.
type: decision
source-agents:
  - herald
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
source-files:
  - teams/framework-research/docs/lifecycle-rework-implicit-teams-2026-06-18.md
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
source-commits:
  - b37b938
source-issues:
  - mitselek/ai-teams#86
related:
  - references/teams-substrate-2.1.179-implicit-teams.md
  - decisions/courier-must-runtime-discover-team-name.md
  - decisions/startup-create-collapses-to-discover.md
  - gotchas/teamcreate-in-memory-leadership-survives-clear.md
  - gotchas/no-teamdelete-stale-session-dirs-accumulate.md
---

# Shutdown S5 (leadership-release) evaporates under implicit teams

**Operational decision (WS2 lifecycle rework, issue #86, design-accepted by Aen 2026-06-18).** On CLI **2.1.178+** the shutdown protocol's **Step S5 "Release team leadership" (`TeamDelete`) is DELETED, not replaced.** Shutdown goes from **5 phases to 4** (S1-S4 unchanged).

## Why it evaporates

S5's entire rationale (topic-06 Phase 5, startup.md S5, leadership-gotcha) assumed the **explicit-team model**: leadership was an in-memory token held by the parent CLI, surviving `/clear`, released only by `TeamDelete`. Every clause is version-specific:

- **"in-memory leadership held by the parent CLI"** -- on 2.1.178+ leadership is *not* an acquired token. It is the **implicit property of a live session** (a lone authenticated session is already a 1-member self-led team, `config.json` eager on session start -- probe **P3**). It is not *held*; it simply *is*, for as long as the process lives.
- **"survives `/clear`"** -- the failure this defended against was `TeamCreate` returning "Already leading team" when stale leadership outlived a `/clear`. **There is no `TeamCreate` to fail** and no acquire-step that stale state can block. The implicit team re-derives fresh from the live session next time.
- **"`TeamDelete` is the only primitive that releases it"** -- the tool is gone, and there is nothing to release: **process exit IS the release.** When the CLI process ends, the live session ends, and with it the implicit leadership.

So S5 is not *replaced* by a new release primitive -- it is **deleted**. The substrate releases leadership for free on process exit.

## The symmetry argument evaporates too

The old justification for S5 was a symmetry: startup Phase 2 `TeamDelete`+`TeamCreate` <-> shutdown Phase 5 `TeamDelete`. With no create/delete pair, there is nothing to be symmetric about. The new symmetry is simpler: **startup *discovers* the implicit team (see [[startup-create-collapses-to-discover]]); shutdown *persists* durable state and exits.** Entry and exit are both about durable state in the repo, not leadership tokens.

## The one residue: stale-dir hygiene moves out-of-band

`TeamDelete` did double duty -- it released in-memory leadership AND removed the on-disk team dir. The release half evaporates (above). The **dir-removal half has no substrate equivalent**: nothing removes the `session-<id>` dir on exit, so dirs accumulate. That is **disk hygiene, not a leadership concern and not a per-shutdown blocker** (the next session ignores leftovers). Handled out-of-band -- see [[no-teamdelete-stale-session-dirs-accumulate]].

## Rejected alternative

- **Replace S5 with a new release primitive / a manual `rm -rf` of the team dir at shutdown.** Rejected: there is nothing to release (process exit does it), and `rm -rf` of the team's own dir mid-session is self-sabotage (the live session owns its auto-created dir). Stale-*other*-dir cleanup is a separate, pid-guarded, out-of-band concern, never a mandatory shutdown step (a failed sweep must never block a session).

## Supersedes (version-coupled)

This **supersedes the mitigation half of [[teamcreate-in-memory-leadership-survives-clear]] for CLI 2.1.178+.** That entry's "at graceful shutdown, run `TeamDelete()`" mitigation (the original S5) was correct for the explicit-team era (2.1.177 and earlier) and remains historically accurate there. On 2.1.178+ the in-memory-leadership gotcha it documents no longer exists (no `TeamCreate` to refuse), so its mitigation is obsolete. The old entry is **not archived** -- it is a version-coupled architectural fact about the explicit-team substrate, retained with a supersession note.

## Revision trigger

Revise if a future CLI **restores an explicit leadership token** (re-introduces `TeamCreate`/`TeamDelete` or an equivalent acquire/release primitive), at which point a release step at shutdown becomes meaningful again. Re-confirm against [[teams-substrate-2.1.179-implicit-teams]] at that sheet's TTL (2026-09-17).

## Related

- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the substrate sheet (P3: eager config.json, implicit leadership) that forces this decision.
- [`decisions/startup-create-collapses-to-discover.md`](startup-create-collapses-to-discover.md) -- the startup-side sibling: Step 2 Create collapses to Step 2' Discover. Same migration, entry side.
- [`decisions/courier-must-runtime-discover-team-name.md`](courier-must-runtime-discover-team-name.md) -- the courier-side decision in the same migration neighborhood (WS1); shares the runtime team-identity-discovery primitive.
- [`gotchas/teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md) -- the explicit-team-era gotcha whose S5 mitigation this supersedes (version-coupled).
- [`gotchas/no-teamdelete-stale-session-dirs-accumulate.md`](../gotchas/no-teamdelete-stale-session-dirs-accumulate.md) -- where the dir-removal residue of S5's old job now lives.

(*FR:Callimachus*)
