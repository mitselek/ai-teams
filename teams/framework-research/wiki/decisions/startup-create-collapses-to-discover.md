---
name: startup-create-collapses-to-discover
description: On CLI 2.1.178+, startup Step 2 "Reset team state" (TeamDelete + TeamCreate + verify) collapses to Step 2' "Discover" -- the team auto-exists eagerly (P3), so the session discovers its session-<id> dir via the shared resolve_team_dir resolver (glob config.json .name canonical; pid tiebreaker when the caller holds the session pid; liveness filter; fail-fast never-guess) and verifies operational, rather than creating. No create-retry: genuine absence = STOP+report.
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
  - decisions/lifecycle-release-evaporates-under-implicit-teams.md
  - gotchas/teamcreate-in-memory-leadership-survives-clear.md
  - gotchas/no-teamdelete-stale-session-dirs-accumulate.md
---

# Startup Step 2 (Create) collapses to Step 2' (Discover)

**Operational decision (WS2 lifecycle rework, issue #86, design-accepted by Aen 2026-06-18).** On CLI **2.1.178+** the old startup **Step 2 "Reset team state" (`TeamDelete` + `TeamCreate` + verify-on-disk)** collapses to **Step 2' "Discover."** It is no longer a create -- it is a lookup.

## The collapse, sub-action by sub-action

| Old sub-action | Fate on 2.1.178+ | Why |
|---|---|---|
| `TeamDelete` (clean) | **DELETE** | Tool gone. Nothing to release -- leadership is not a held token (see [[lifecycle-release-evaporates-under-implicit-teams]]). |
| `TeamCreate` (create) | **DELETE** | Tool gone AND unneeded -- the team **auto-exists eagerly** on session start (probe **P3**); `config.json` is on disk before this step would run. |
| verify `config.json` on disk | **KEEP, repurposed** | Survives as the **discovery + operational gate** (old Step 2b's role, verbatim): confirm the auto-created team is present, discover its name, do not spawn into an unconfirmed team. |

Step 2' = **discover the live team dir + verify operational.** The team already exists; the session's job is to learn its own `session-<id>` name.

## How discovery works (shared resolver)

Step 2' calls the **same `resolve_team_dir(...)` resolver the courier uses** (WS1 -- see [[courier-must-runtime-discover-team-name]]). ONE function, two callers, path is caller-relative:

- **Lifecycle runs IN-session**, so it *holds* the live session pid and passes it (`session_pid=os.getpid()`); the **pid tiebreaker** fires first in the multi-dir case (O(1), unambiguous even amid stale leftovers).
- **The courier runs detached** (Scheduled Task), passes no pid, and relies on **glob `config.json` `.name` (canonical) + liveness filter**.

Resolution order: explicit-override -> single-dir-glob (canonical) -> pid tiebreaker (3a) -> liveness filter (3b) -> **FAIL FAST, never guess** (no hardcoded-name fallback -- that's the bug being removed). The lifecycle script calls the CLI shim `stationmaster-courier.py --resolve-team-dir`, capturing the bare slug from stdout.

## No create-retry

The old Step 2 recovery was "re-run `TeamDelete`+`TeamCreate`." There is **no create primitive to retry.** If discovery returns no dir / `config.json` genuinely absent, that is a **substrate fault** (the team is created by the same code path that started the session, so its absence means the session itself is broken): **STOP and report to the user.** Do NOT fabricate a team dir by hand (the harness owns that file). This is strictly rarer than the old retry case.

## Rejected alternative

- **Keep `TeamCreate` (or a hand-rolled `mkdir`+`config.json` write) as the create step.** Rejected: `TeamCreate` is gone, and hand-writing the team dir races the harness's own eager write and forges state the platform owns. The team auto-exists -- creating is redundant at best and corrupting at worst.

## Operational decision, not a framework rule

Courier-and-lifecycle implementation scope. The startup-sequence application (editing `startup.md` + `topics/06-lifecycle.md` SEQUENCE sections) is team-lead/Volta domain, not curated here -- this entry records the *decision*, the topic files record the *sequence*.

## Revision trigger

Revise if a future CLI **restores `TeamCreate`** (or an explicit create primitive), at which point a create step becomes meaningful again. Re-confirm against [[teams-substrate-2.1.179-implicit-teams]] at that sheet's TTL (2026-09-17).

## Related

- [`decisions/courier-must-runtime-discover-team-name.md`](courier-must-runtime-discover-team-name.md) -- the courier-side sibling that owns the `resolve_team_dir` resolver; this is the lifecycle caller of the same function. The WS1/WS2 intersection.
- [`decisions/lifecycle-release-evaporates-under-implicit-teams.md`](lifecycle-release-evaporates-under-implicit-teams.md) -- the shutdown-side sibling (S5 deleted). Same migration, exit side.
- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- P3 (eager auto-create) + P1 (name = `session-<id>`) are what force the create->discover collapse.
- [`gotchas/teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md) -- the explicit-team-era gotcha whose startup `TeamDelete`+`TeamCreate` mitigation this supersedes (version-coupled).
- [`gotchas/no-teamdelete-stale-session-dirs-accumulate.md`](../gotchas/no-teamdelete-stale-session-dirs-accumulate.md) -- why the multi-dir disambiguation in the resolver matters (stale dirs accumulate with no `TeamDelete`).

(*FR:Callimachus*)
