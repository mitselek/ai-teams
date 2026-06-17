---
name: teams-substrate-2.1.179-implicit-teams
description: CLI 2.1.178+ dropped TeamCreate/TeamDelete for implicit teams -- on-disk team name is session-<id> (Agent-tool team_name ignored on disk), config.json eager, inboxes lazy, external inbox-write proactively wakes+delivers, sessions/<pid>.json is the live registry, inbox entries gain a type field on 2.1.179
type: reference
source-agents:
  - hopper
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-17
status: active
confidence: high
source-files:
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
  - teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md
source-commits:
  - b37b938
ttl: 2026-09-17
related:
  - references/inbox-substrate-properties-2.1.170.md
  - references/inbox-file-write-as-wake-mechanism.md
  - references/members-array-edit-honored-mid-session.md
  - references/drain-on-delivery-datapoint-2.1.173.md
  - decisions/courier-must-runtime-discover-team-name.md
  - gotchas/teamcreate-in-memory-leadership-survives-clear.md
  - decisions/stationmaster-post-office-model.md
---

# Teams substrate -- empirical sheet (CLI 2.1.178/2.1.179, "implicit teams")

**Version-stamped. Every row below was verified against Claude Code CLI `2.1.179` on 2026-06-17** (rc host `100.96.54.170`, throwaway probe container, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, Agent-tool team architecture, Opus 4.8 session). **These are NOT current-validity claims for any other version.** 2.1.178 is the version that **stripped `TeamCreate`/`TeamDelete`** (the FR-lifecycle-breaking change that pins the local CLI at 2.1.177 -- see [[project_claude_cli_pinned_2177]] memory). On 2.1.178+ teams are **implicit**: a lone authenticated session is already a team.

**This is a curated pointer, not the evidentiary source.** The authoritative record is the probe findings doc ([`docs/teams-migration-probe-findings-2026-06-17.md`](../../docs/teams-migration-probe-findings-2026-06-17.md), Hopper, committed `b37b938`), which carries the per-probe (P1-P6) results, the environment table, and the isolation/safety record. This sheet exists to make the durable substrate facts **queryable**; read the doc for the probe-by-probe evidence.

## Substrate map (`~/.claude` on 2.1.179)

| Path | Lifecycle | Notes |
|---|---|---|
| `teams/<name>/config.json` | **Eager** -- written on session start, before any spawn | A lone authenticated session is a **1-member team with itself as `team-lead`** (`backendType:"in-process"`, `tmuxPaneId:"leader"`). The team exists on disk before any Agent spawn. |
| `teams/<name>/inboxes/<member>.json` | **Lazy** -- absent on a fresh bare session; created on first message route / first inbox-file write | A brand-fresh bare session has team dir = **`config.json` only**, NO `inboxes/` dir, NO `team-lead.json`. The team-lead is a config *member* with no inbox *file* yet. |
| `sessions/<pid>.json` | live session registry | `{pid, sessionId, cwd, version, peerProtocol, kind, entrypoint, status}` -- the **pid -> sessionId -> status map** the harness uses to track running sessions. Derive the `session-<id>` slug from the first 8 hex of `sessionId`. |
| `tasks/<name>/` | per-team task dir | empty throughout the probe |
| `projects/<cwd-slug>/<uuid>.jsonl` | session transcript | |

## Properties (verified on 2.1.179)

| # | Property | Probe | Notes |
|---|---|---|---|
| Name-on-disk | On-disk team name = **`session-<id>`** (session-derived, random per session). The Agent-tool `team_name` parameter is **IGNORED on disk** -- cosmetic label only. | P1 | The spawned member's `agentId` = `<name>@session-<id>`. The agent's **chat narration may CLAIM** a named team ("team: framework-research"), but the **filesystem is authoritative**: `config.json` `.name` is `session-<id>`. Do not trust chat-claimed team names; read disk. |
| Discoverable | The on-disk name is **discoverable at runtime** -- glob `~/.claude/teams/*/config.json` `.name`, or derive from `sessions/<pid>.json` `sessionId`. | P1 | This is the migration hook: name is uncontrollable but findable. |
| config eager | `config.json` is written eagerly on session start, before any spawn. Lone session = 1-member self-led team. | P3 | |
| inboxes lazy | `inboxes/` created lazily, on first message cycle. Absent on a brand-fresh bare session. | P3/P6 | Same lazy-create behavior as 2.1.170 (T2.c). |
| members[] injection | Externally appending a ghost member to `config.json` `members[]` (out-of-band, e.g. `docker exec` python) is honored: the lead's `SendMessage` to that name returns **success** and the harness **routes** it (writes `inboxes/<ghost>.json`). | P4 | **The ghost-courier members[]-injection registration trick SURVIVES 2.1.178+.** Same property as [`members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md), re-confirmed on 2.1.179. |
| External-write wake | An **external** process writing well-formed JSON into `inboxes/team-lead.json` **wakes the idle lone session AND delivers** the message, then drains the inbox to `[]`. Once the file exists, subsequent external writes **proactively** wake the idle session in real time (~15s, no nudge). | P5/P6 | Re-confirms [`inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) on a **bare lone session** on 2.1.179. **Caveat:** `inboxes/<member>.json` must EXIST; on a brand-fresh bare session the courier must **create** the file itself (the first write does double duty -- it creates the file AND is delivered on the next session-activity cycle). |
| Inbox `type` field | 2.1.179 inbox entries gain a **`"type"`** field (e.g. `"type":"message"`) vs the 2.1.177-era FR shape (`{from,text,summary,timestamp,read}`). | -- | The courier's JSON writer/reader must **tolerate/emit `type`**. Schema example below. |

### Inbox message shape (2.1.179)

```json
[
  {
    "from": "team-lead",
    "text": "GHOST-PING",
    "summary": "Ping ghost-courier",
    "timestamp": "2026-06-17T15:48:05.012Z",
    "type": "message",
    "read": false
  }
]
```

## Bottom line (migration verdict)

The two substrate primitives the FR courier relies on -- **members[] injection** (P4) and **inbox-file-write delivery** (P5/P6) -- **BOTH survive 2.1.178+**. The ONLY thing that breaks is the courier's **hardcoded `framework-research` team-name path** (P1): the team dir is now `session-<id>`, random per session, uncontrollable. Replace the hardcoded path with runtime name-discovery and the cross-team comms layer migrates cleanly -- **no redesign of the injection/delivery mechanism is needed**. The remediation decision is filed separately at [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md).

## Revision trigger

This is a **version-coupled** empirical sheet, not a version-stable architectural fact. The trigger to revise is a **substrate change** -- primarily a CLI version change (the implicit-teams model itself arrived as the 2.1.178 substrate flip; substrate has flipped unannounced between adjacent versions before -- see [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md)). **n+1 re-sightings on 2.1.179 do NOT strengthen this sheet**; a sighting on a different version is a new datapoint (file as a version-pointer, mega-biblion-style -- see the 2.1.173 datapoint pattern in the Related sheet, not a fresh full sheet).

## TTL

**TTL: 2026-09-17** (3 months). Re-verify at expiry against the then-current CLI: is the team name still `session-<id>` (uncontrollable but discoverable)? Does external inbox-write still wake a bare session? Does members[] injection still route? Re-verification is a throwaway-container probe (cheap); the TTL forces a periodic check rather than letting stale-substrate state poison a migration decision.

## Related

- [`references/inbox-substrate-properties-2.1.170.md`](inbox-substrate-properties-2.1.170.md) -- the prior version sheet (CLI 2.1.170). This 2.1.179 sheet is the next version datapoint in the same substrate-property family; the wake + lazy-create + members-injection rows re-confirm 2.1.170 properties on the implicit-teams model.
- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) -- canonical wake-stage property; P5/P6 re-confirm it wakes a **bare lone session** on 2.1.179.
- [`references/members-array-edit-honored-mid-session.md`](members-array-edit-honored-mid-session.md) -- dispatch-validation property; P4 re-confirms members[] injection routes on 2.1.179.
- [`references/drain-on-delivery-datapoint-2.1.173.md`](drain-on-delivery-datapoint-2.1.173.md) -- the version-datapoint precedent (a compact pointer, not a fresh full sheet); this entry follows the same version-tracking discipline.
- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the operational remediation this sheet's P1 finding forces (drop the hardcoded path).
- [`gotchas/teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md) -- prior-version observation that leadership is in-memory; the implicit-teams model makes "lone session is already a 1-member self-led team" the eager-on-disk default.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- the cross-team comms redesign built on these substrate primitives; the migration verdict says it survives 2.1.178+ modulo the team-name path.

(*FR:Callimachus*)
