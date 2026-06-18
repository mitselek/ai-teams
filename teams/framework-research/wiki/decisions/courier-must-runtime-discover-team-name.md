---
name: courier-must-runtime-discover-team-name
description: On CLI 2.1.178+ the on-disk team name is session-<id> (uncontrollable), so the courier MUST runtime-discover the team name (glob ~/.claude/teams/*/config.json .name or derive from sessions/<pid>.json) instead of hardcoding framework-research -- prerequisite for unpinning the local CLI off 2.1.177
type: decision
source-agents:
  - hopper
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-18
status: active
source-files:
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
  - teams/framework-research/docs/migration-validation-probe-findings-2026-06-18.md
source-commits:
  - b37b938
related:
  - references/teams-substrate-2.1.179-implicit-teams.md
  - decisions/stationmaster-post-office-model.md
  - decisions/fan-out-routing-per-destination-outboxes-cr4.md
  - references/inbox-file-write-as-wake-mechanism.md
  - decisions/startup-create-collapses-to-discover.md
  - decisions/lifecycle-release-evaporates-under-implicit-teams.md
  - gotchas/sessions-pid-json-not-gc-status-idle-lingers.md
---

# The courier must runtime-discover the team name (drop the hardcoded `framework-research` path)

**Operational decision (probe-forced, 2026-06-17).** On CLI **2.1.178+** the on-disk team directory name is **`session-<id>`** -- session-derived, random per session, and **not controllable** via the Agent-tool `team_name` parameter (ignored on disk; see [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) row "Name-on-disk"). Therefore the courier's hardcoded path `~/.claude/teams/framework-research/inboxes/` **cannot survive** on 2.1.178+.

**Decision:** the courier MUST **discover the team name at runtime**. Two discovery paths, **ordered** (refinement folded S56 2026-06-18; empirically validated on CLI 2.1.181, probe `docs/migration-validation-probe-findings-2026-06-18.md` V1/V2a):

1. **PRIMARY -- Glob `~/.claude/teams/*/config.json`** and read `.name`. Rationale: the courier is a separate process from the Claude session and does NOT own the session pid -- under the detached Windows Scheduled Task there is no clean pid handoff, so pid-keyed lookup isn't reliably available. The glob reads the authoritative `config.json` `.name` directly and is robust to `sessionId`-slug-format drift. (V1 confirmed: config-glob discovery + `inboxes_dir:"auto"` resolves to the live `session-<id>/inboxes`, NOT the hardcoded `framework-research` path.)
2. **TIEBREAKER -- Derive from `sessions/<pid>.json`** -- read `sessionId`, take the first 8 hex as the `session-<id>` slug. Demoted to tiebreaker because of the pid-ownership gap above. (V2a confirmed the pid-keyed path is robust when a pid is available.)

It must **NOT hardcode `framework-research`** (or any literal team name) in its inbox/outbox path resolution.

### Disambiguating multiple `teams/*` dirs -- the liveness-filter

A **THIRD disambiguator** (beyond the two discovery paths) handles the common multi-dir case: a **liveness-filter** cross-references candidate `teams/*` dirs against `sessions/<pid>.json` to drop stale crashed-session dirs **without needing the courier's own pid**. This is the primary stale-dir killer.

**CRITICAL (WS3b V3, Hopper/Brunel, validated on 2.1.181):** the liveness-filter MUST test **process-liveness** (`os.kill(pid,0)` / `/proc/<pid>` on the entry's `pid` field, `procStart`-guarded), **NOT the `status` string** -- `sessions/<pid>.json` is not GC'd on exit and lingers `status:"idle"`, so a status-based filter is broken (it reads dead-as-live). This is the one must-fix in `stationmaster-courier.py` before the unpin. See [[sessions-pid-json-not-gc-status-idle-lingers]]. (Per DECIDED-DIRECTION #2, the fix is MERGED + validated: Linux 12/12 unit, Windows 11/11 + 4/4 InstanceLock + 17/17 integration.)

Verbatim source for all of the above: Brunel's WS1 design doc [`docs/courier-runtime-team-name-discovery-design-2026-06-18.md`](../../docs/courier-runtime-team-name-discovery-design-2026-06-18.md) + the V3 finding in the probe doc.

## Why this is the gating migration cost

This is the **single** thing that breaks the cross-team comms layer on 2.1.178+. The probe (Hopper, Task #4) verified that the other two substrate primitives the courier relies on -- **members[] injection** (P4) and **inbox-file-write delivery** (P5/P6) -- **both survive** 2.1.178+. No redesign of the injection/delivery mechanism is needed. Replace the hardcoded path with runtime name-discovery and the layer migrates cleanly.

**This decision is the prerequisite for unpinning the local CLI off 2.1.177.** The CLI is currently pinned at 2.1.177 because 2.1.178 stripped `TeamCreate`/`TeamDelete` ([[project_claude_cli_pinned_2177]]). Lifecycle tooling and the courier's hardcoded team-name path are the two things that assumed pre-2.1.178 behavior. Once the courier runtime-discovers its name, the courier-path blocker to unpinning is cleared (lifecycle-tooling migration is tracked separately).

## Rejected alternative

- **Keep hardcoding `framework-research` (or pass `team_name` and trust it).** Rejected: the probe proved the on-disk name is `session-<id>` regardless of the `team_name` parameter -- the parameter is a **cosmetic chat label only, ignored on disk**. A hardcoded path resolves to a directory that does not exist on 2.1.178+; the courier would silently find no inbox. The agent's chat narration *claiming* a named team does not make the directory exist (the filesystem is authoritative -- do not trust chat-claimed team names).

## Operational decision, not a framework rule

This is a **courier-implementation** decision (operational scope), not a candidate for common-prompt promotion as written. If the runtime-name-discovery requirement later generalizes to *all* substrate-touching tooling (not just the courier), propose a Protocol-C promotion of the general principle then -- do not pre-emptively broaden this entry. Operational decisions graduate upward; they do not bloat in place.

## Revision trigger

Revise if a future CLI version **restores controllable team names** (e.g. honors the Agent-tool `team_name` on disk, or restores `TeamCreate` with an explicit name) -- at which point runtime-discovery becomes optional rather than mandatory. Re-confirm against [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) at that sheet's TTL (2026-09-17).

## Related

- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the substrate sheet whose P1 finding (name = `session-<id>`, discoverable at runtime) forces this decision.
- [`decisions/stationmaster-post-office-model.md`](stationmaster-post-office-model.md) -- the cross-team comms model the courier serves; this decision keeps that model working on 2.1.178+.
- [`decisions/fan-out-routing-per-destination-outboxes-cr4.md`](fan-out-routing-per-destination-outboxes-cr4.md) -- a sibling courier-routing decision (outbox→destination naming); both are courier-implementation decisions in the same migration neighborhood.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- the delivery primitive that survives 2.1.178+ once the path is discovered correctly.
- [`decisions/startup-create-collapses-to-discover.md`](startup-create-collapses-to-discover.md) -- the lifecycle-side sibling (WS2) that CALLS the same `resolve_team_dir` resolver this decision motivates. ONE function, two callers (in-session lifecycle passes the pid; detached courier omits it). The WS1/WS2 intersection.
- [`decisions/lifecycle-release-evaporates-under-implicit-teams.md`](lifecycle-release-evaporates-under-implicit-teams.md) -- the shutdown-side lifecycle sibling (S5 deleted); same 2.1.178 migration neighborhood.

## Amendments log

- **2026-06-18 (S55, Brunel read-back):** stage-2 `pending` → `partial` (1 of 2 co-authors). Brunel's glob-PRIMARY / pid-TIEBREAKER / liveness-filter refinement held as a pending-refinement blockquote (orders + adds, not a correction).
- **2026-06-18 (S56, Hopper read-back):** stage-2 `partial` → **`confirmed`** (final co-author). Hopper confirmed all three load-bearing claims verbatim-faithful, no corrections: (1) CRITICAL process-liveness must-fix matches V3, (2) glob-PRIMARY/pid-TIEBREAKER + V1 config-glob resolution matches probe RUN-2, (3) single-gating-cost framing (P4 members[]-injection + P5/P6 delivery both survive; only hardcoded team-name breaks) matches S54 #4 + S55 V5a. Brunel's refinement folded from blockquote into the body; entry is substrate-faithful.

(*FR:Callimachus*)
