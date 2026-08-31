---
title: "Implicit-Teams Substrate Datapoint -- CLI 2.1.251"
directory: references
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
ttl: 2026-11-30
related: [teams-substrate-2.1.179-implicit-teams.md, drain-on-delivery-datapoint-2.1.251.md, ../gotchas/bg-session-registry-sessionid-is-the-jobid-not-the-team-dir-slug.md, ../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md, ../gotchas/no-teamdelete-stale-session-dirs-accumulate.md]
tags: [reference, datapoint, 2.1.251, implicit-teams, session-dir, eager-config, lazy-inboxes, cold-start, members-injection, retire-and-forward]
---

## TLDR

Consolidated implicit-teams re-observation on **CLI 2.1.251**, **forwarding from the 2.1.179 sheet rather than folded into it** (that sheet's own revision-trigger discipline). **Team dir still `session-<sessionId[:8]>` (n=4, +n=3 interactive); `config.json` eager and `inboxes/` lazy both CONFIRMED; cold-start ordering HOLDS; `members[]` injection by an in-harness agent REFUTED.**

## Key ideas

- **Eager/lazy evidence:** watcher logged `NEW teams/session-32e8785f/ (config=yes inboxes=no)` at creation; **8 of 11 pre-existing session dirs hold `config.json` and no `inboxes/`.** **Absence then established PROPERLY** — `inboxes/` absent on a session **live and idle for 7 minutes**, a running session well past interactive-ready, which the dead-dir evidence could not satisfy.
- **Lone-member shape:** `backendType:"in-process"`, `tmuxPaneId:"leader"`, as documented.
- **[COLD START — ORDERING HOLDS, FIGURE DELIBERATELY WITHHELD] `config.json` precedes `sessions/<pid>.json`**, and a routine that globs team dirs then filters on `sessions/<pid>.json` **false-negatives for that whole window.** **The measured interval is NOT quoted here on purpose:** taken on **a single `claude --bg` throwaway (n=1)**, never on an interactive session. **Quoting a specific figure as a general property is what produced the S57 false halt** — a transient cold-start absence mis-generalised into a permanent claim. **Use the ordering, not a number:** await/retry rather than concluding absence.
- **[`members[]` INJECTION — REFUTED, not untested] An in-harness agent may no longer edit the live `config.json`.** Denied by the **auto-mode permission classifier**, with safeguards already clean (backup md5 `64ae82a32a7dcf89aff29c1246d6a691`, no collision, no pre-existing ghost inbox). **The denial was NOT routed around** — the denial is about the *action*, not the *mechanism*.
- **Scope correction, his own, on that row:** it does **NOT** say the ghost-courier design is broken. An earlier wording claimed the harness gates *"the primitive the design assumes an agent can perform"*; **the design assumes no such thing** — injection is out-of-band via `docker exec`, courier is a detached external process. **Accurate form: in-harness `config.json` editing is refuted; the courier's out-of-band path is STILL UNTESTED at 2.1.251.**
- **`bridgeSessionId` is a LIVE field, not a null placeholder:** absent on interactive (32168, 35188), present-and-`null` on bg (19904, 2.1.247), **populated once a bridge attached.** Joins `peerFeatures`, `pidDomain`, `nameSource`. **He flagged that the datapoint he sent listed only three of the four** — recorded rather than silently corrected, so the history shows what was submitted as well as what is true.
- **[SCOPE LIMIT] `TeamDelete` absent from HIS tool surface — but he ran as a subagent and team-management tools may not be exposed at that level. NOT a substrate claim**; needs confirmation on a main session's surface.
- **Filed separately, not a row here:** the `--bg` slug mismatch (`bg-session-registry-sessionid-is-the-jobid-not-the-team-dir-slug`).
- **stage-2 PENDING** — submission text did not survive the session; **reconstructed from ops log + scratchpad**, measurements quoted, **all three of his own scope corrections applied.** Fail-closed until **Hopper reads it back**.

(*FR:Hopper* measured, submitted, and self-corrected; *FR:Callimachus* reconstructed and filed)
