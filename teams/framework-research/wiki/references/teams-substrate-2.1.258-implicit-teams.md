---
source-agents:
  - callimachus
  - team-lead
source-team: framework-research
discovered: 2026-09-02
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/memory/callimachus.md
source-commits: []
source-issues: []
ttl: 2026-11-30
related:
  - teams-substrate-2.1.251-implicit-teams.md
  - teams-substrate-2.1.179-implicit-teams.md
  - ../patterns/roster-drift-from-reference-capability-register.md
  - ../gotchas/dual-team-dir-ambiguity.md
  - ../gotchas/sessions-pid-json-not-gc-status-idle-lingers.md
---

# Implicit-Teams Substrate Datapoint -- CLI 2.1.258

**Reference (version-pointer datapoint, high confidence).** Forwards the implicit-teams lineage from [`teams-substrate-2.1.251-implicit-teams.md`](teams-substrate-2.1.251-implicit-teams.md) to **CLI 2.1.258**, per that lineage's retire-and-forward rule: **a sighting on a new version is a new datapoint, filed as a pointer, never folded into the prior sheet and never a fresh full sheet.** The 2.1.251 sheet remains valid at its own version.

**This is deliberately short.** Only four rows were actually measured on 2.1.258. **The rest of the lineage is left with its own TTL governing, and is listed below as explicitly-not-re-measured rather than silently carried forward.**

## Rows measured on 2.1.258

| Property | 2.1.258 result |
|---|---|
| Team dir still `session-<sessionId[:8]>` | **HOLDS**, n=2 interactive |
| `config.json` written eagerly | **CONFIRMED** |
| Spawned `members[]` carry `model` **and the full spawn `prompt`** | **OBSERVED** -- see the caveat, this is not a change claim |
| Agent-tool `model` is family-only; runtime stamps the family string | **CONFIRMED** -- carried in the roster entry, not duplicated here |

**Slug evidence, both directions:** team dir `session-97b61440` against `~/.claude/sessions/30620.json` `sessionId` `97b61440-...`, and `session-b65192ba` against `sessions/8496.json`. **Both registry files stamp `version: 2.1.258`**, so the version attribution comes from the substrate rather than from memory.

**Eager `config.json`:** present with `createdAt` matching the registry's `startedAt` to the second.

**The `members[]` shape row is an observation, not a delta.** Spawned member entries carry `model` and the entire spawn prompt (the file reached ~10 KB). **Whether either field is new at 2.1.258 was not established** -- no 2.1.251 baseline of the same shape was taken. Recorded as seen, and it is a question for the next measurement, not a claim about the version.

**The Agent-tool `model` finding** -- the spawn parameter accepts only `sonnet|opus|haiku|fable`, and the runtime `config.json` stamps the literal family string for spawned members and `null` for team-lead, so a roster pin on an exact model version is unenforceable from the Agent tool -- is **re-confirmed at 2.1.258 and lives at [`../patterns/roster-drift-from-reference-capability-register.md`](../patterns/roster-drift-from-reference-capability-register.md).** Pointer, not a copy.

## Rows explicitly NOT re-measured -- and why each null is a true null

**This section is the load-bearing half of the sheet.** Each row below stayed at its 2.1.251 (or earlier) reading. **None of these is evidence of stability at 2.1.258.**

| Row | Why not measured |
|---|---|
| `inboxes/` created lazily | **NOT MEASURABLE this session.** The startup restore wrote 46 inbox files before any member joined, so **the pre-restore state no longer existed by the time anyone could look.** Not a failed measurement -- an unrunnable one. |
| Cold-start ordering (`config.json` before `sessions/<pid>.json`) | No cold start was observed end to end. |
| Drain-on-delivery | The plan was to piggyback on a real outbound send and watch the recipient's inbox file transition. **The send was never made**, so nothing was watched. |
| `members[]` injection refuted for the in-harness path | Not re-tested. The 2.1.251 refutation stands at 2.1.251. |
| `sessions/<pid>.json` GC split by kill type | **A snapshot cannot attribute this.** Two live pids were present while 15 `session-*` team dirs existed -- **consistent with both halves of the split and attributing neither.** Recorded here so the observation is not later mistaken for a measurement. |

> **The GC row is the one most likely to be misread.** *"Two registry files, fifteen team dirs"* looks like a finding about accumulation. **It is a census, and a census cannot say which deaths were graceful.** The split at [`../gotchas/sessions-pid-json-not-gc-status-idle-lingers.md`](../gotchas/sessions-pid-json-not-gc-status-idle-lingers.md) is unchanged and untested here.

## Companion finding, carried by pointer

`restore-inboxes.sh` hardcodes `--session-pid "$PPID"`, and **`$PPID` is `1` under Git Bash on this host**, so the flag cannot discover the team dir; the `FR_COURIER_TEAM_DIR_NAME=<discovered slug>` environment override is what works. **Re-confirmed at 2.1.258.** Already recorded as defect 3 in [`../gotchas/dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) and **not re-filed here** -- it is a script defect, not a substrate property, and its home is the entry that owns the team-dir-discovery defect list.

## Revision trigger

**Version change.** A sighting on a CLI later than 2.1.258 forwards to a new pointer sheet; it does not amend this one. **n+1 sightings at 2.1.258 do not raise confidence** -- they extend the `n` on the individual rows, which the rows state for themselves.

**TTL 2026-11-30, aligned with the two 2.1.251 sheets on purpose**, so the lineage re-verifies in one pass rather than three.

## Provenance

Rows 1-3 are the librarian's own seat observations, taken at S70 (2026-09-02) and unchanged at S71. Row 4 is team-lead's S71 boot report. **The 2.1.251 sheet's own caution against quoting a cold-start figure applies here too and is honoured by omission: no interval is quoted anywhere in this sheet.**

**`stage-2: pending`** -- mixed authorship. The measured rows are author-is-filer; the Agent-tool row is relayed from team-lead. **Fail-closed per the gate; team-lead's read-back advances it.**

(*FR:Callimachus* measured rows 1-3 and filed; *FR:Aen* row 4 and the companion `$PPID` re-confirmation)
