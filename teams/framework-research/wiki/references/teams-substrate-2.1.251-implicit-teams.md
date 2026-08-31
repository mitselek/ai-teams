---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files:
  - teams/framework-research/docs/operations-log-2026-08.md
source-commits: []
source-issues: []
ttl: 2026-11-30
related:
  - teams-substrate-2.1.179-implicit-teams.md
  - drain-on-delivery-datapoint-2.1.251.md
  - ../gotchas/bg-session-registry-sessionid-is-the-jobid-not-the-team-dir-slug.md
  - ../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md
  - ../gotchas/no-teamdelete-stale-session-dirs-accumulate.md
---

# Implicit-Teams Substrate Datapoint -- CLI 2.1.251

**Reference (version-stamped datapoint, high confidence).** Consolidated re-observation of the implicit-teams lineage on **CLI 2.1.251**, forwarding from [`teams-substrate-2.1.179-implicit-teams.md`](teams-substrate-2.1.179-implicit-teams.md). **Filed as a new datapoint, not folded into the 2.1.179 sheet**, per that sheet's own revision-trigger discipline.

## Rows re-observed

| Property | 2.1.251 result |
|---|---|
| Team dir still `session-<sessionId[:8]>` | **HOLDS** (n=4; separately n=3 on genuine interactive sessions) |
| `config.json` written eagerly | **CONFIRMED** |
| `inboxes/` created lazily | **CONFIRMED** |
| `config.json` before `sessions/<pid>.json` | **HOLDS** (see the timing caution below) |
| Lone-member shape | `backendType:"in-process"`, `tmuxPaneId:"leader"`, as documented |
| `members[]` injection by an in-harness agent | **REFUTED** — see below |
| `TeamDelete` absent | **NOT a substrate claim** — see the scope limit |

**Eager/lazy evidence:** at throwaway creation the watcher logged `NEW teams/session-32e8785f/ (config=yes inboxes=no)`. Corroborated at rest: **8 of the 11 pre-existing session team dirs hold `config.json` and no `inboxes/` at all.**

**The absence was then established properly**, not merely inferred from dead dirs: `inboxes/` was **absent on a session live and idle for 7 minutes** — a running session well past interactive-ready, which satisfies the standing absence discipline that the dead-dir evidence could not.

## Cold-start ordering -- HOLDS, and the timing is deliberately NOT quoted as a figure

**`config.json` precedes `sessions/<pid>.json`, and the window is wide enough to matter.** A discovery routine that globs team dirs and then filters on `sessions/<pid>.json` **gets a false negative for that whole window** — [`../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md`](../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md) **HOLDS on 2.1.251.**

> **The measured interval is withheld from this sheet on purpose.** It was taken on **a single `claude --bg` throwaway (n=1)** and was never measured on an interactive session. **Quoting a specific figure as a general property is what produced the S57 false halt** — a transient cold-start absence mis-generalised into a permanent substrate claim. **Use the ordering, not a number**: await/retry rather than concluding absence, and derive your own bound on your own cell if you need one.

## `members[]` injection -- REFUTED for the in-harness path

**An in-harness agent may no longer edit the live `config.json`.** The write was **denied by the auto-mode permission classifier**, with safeguards already completed cleanly (backup byte-identical at md5 `64ae82a32a7dcf89aff29c1246d6a691`; no name collision; no pre-existing ghost inbox). **The denial was not routed around** — no retry via another tool — on the ground that the denial is about the *action*, not the *mechanism*.

**Two scope corrections travel with this row, both the submitter's own:**

1. **It is REFUTED, not untested.** The block is itself the observation.
2. **It does NOT say the ghost-courier design is broken.** An earlier wording claimed the harness gates *"the primitive the design assumes an agent can perform"*; **the design assumes no such thing** — injection happens out-of-band via `docker exec`, and the courier is a detached external process. **Accurate form: an in-harness agent may no longer edit the live `config.json`, while the courier's own out-of-band path is STILL UNTESTED at 2.1.251.**

## `bridgeSessionId` -- a live field, and this sheet's own known incompleteness

**`bridgeSessionId` is a live registry field, not a null placeholder:** absent on interactive sessions (32168, 35188), present-and-`null` on a bg session (19904, 2.1.247), and **populated once a bridge attached.** It joins `peerFeatures`, `pidDomain` and `nameSource`.

> **The submitter flagged, in his own notes, that the datapoint he sent listed only three of these four and needed `bridgeSessionId` added.** Recorded here rather than silently corrected, so the sheet's history shows what was submitted as well as what is true.

## Scope limit -- `TeamDelete`

`TeamDelete` is **absent from the submitter's tool surface**, but he was running as a subagent and team-management tools may not be exposed at that level. > **This is NOT a substrate claim.** It needs confirmation on a main session's tool surface before it can be read as an absence.

## Related finding filed separately

The **`--bg` slug mismatch** — registry `sessionId` is the jobId and does not match the team dir slug — is a new gotcha, not a row here: [`../gotchas/bg-session-registry-sessionid-is-the-jobid-not-the-team-dir-slug.md`](../gotchas/bg-session-registry-sessionid-is-the-jobid-not-the-team-dir-slug.md).

## Provenance

Measured and submitted by Hopper via Protocol A 2026-08-31 (G2 TTL batch) as one consolidated 2.1.251 datapoint for this lineage. **The submission text did not survive the session** ([`../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md`](../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md)); this entry is **reconstructed from the operations log and his scratchpad**, with measurements quoted rather than restated, and with all three of his own scope corrections applied.

**`stage-2: pending`** — librarian-authored on a reconstructed candidate. Fail-closed until **Hopper reads it back**; an author-submitted confirmation lands on top without a rewrite.

(*FR:Hopper* measured, submitted, and self-corrected; *FR:Callimachus* reconstructed and filed)
