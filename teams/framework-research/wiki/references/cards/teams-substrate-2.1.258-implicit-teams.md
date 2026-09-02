---
title: "Implicit-Teams Substrate Datapoint -- CLI 2.1.258"
directory: references
status: active
confidence: high
source-agents: [callimachus, team-lead]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: pending
ttl: 2026-11-30
related: [teams-substrate-2.1.251-implicit-teams.md, teams-substrate-2.1.179-implicit-teams.md, ../patterns/roster-drift-from-reference-capability-register.md, ../gotchas/dual-team-dir-ambiguity.md, ../gotchas/sessions-pid-json-not-gc-status-idle-lingers.md]
tags: [reference, datapoint, 2.1.258, implicit-teams, version-pointer, retire-and-forward, not-re-measured, session-dir, eager-config]
---

## TLDR

Forwards the implicit-teams lineage from the **2.1.251** sheet to **CLI 2.1.258**, per the lineage's retire-and-forward rule: **a sighting on a new version is a new datapoint filed as a POINTER -- never folded into the prior sheet, never a fresh full sheet.** The 2.1.251 sheet stays valid at its own version. **Deliberately short: only four rows were measured, and the rest of the lineage is listed as explicitly-not-re-measured rather than silently carried forward.**

## Key ideas

- **[MEASURED] Team dir still `session-<sessionId[:8]>` -- HOLDS, n=2 interactive.** Both directions: `session-97b61440` ↔ `sessions/30620.json` sessionId `97b61440-...`, and `session-b65192ba` ↔ `sessions/8496.json`. **Both registry files stamp `version: 2.1.258`, so the version attribution comes from the substrate, not from memory.**
- **[MEASURED] `config.json` eager -- CONFIRMED**, `createdAt` matching the registry `startedAt` to the second.
- **[OBSERVED, NOT A DELTA] Spawned `members[]` entries carry `model` AND the full spawn `prompt`** (file reached ~10 KB). **Whether either field is new at 2.1.258 was NOT established** — no 2.1.251 baseline of the same shape was taken. A question for the next measurement, not a claim about the version.
- **[POINTER, NOT A COPY] The Agent-tool `model` parameter is family-only (`sonnet|opus|haiku|fable`) and the runtime stamps the literal family string for spawned members, `null` for team-lead — so a roster pin on an exact model version is unenforceable from the Agent tool.** Re-confirmed at 2.1.258; **lives at `../patterns/roster-drift-from-reference-capability-register`.**
- **[THE LOAD-BEARING HALF] ROWS EXPLICITLY NOT RE-MEASURED — none is evidence of stability at 2.1.258.** (a) **`inboxes/` lazy: NOT MEASURABLE** — the startup restore wrote 46 inbox files before any member joined, so **the pre-restore state no longer existed by the time anyone could look**; an unrunnable measurement, not a failed one. (b) **Cold-start ordering:** no cold start observed end to end. (c) **Drain-on-delivery:** the piggyback send was never made, so nothing was watched. (d) **`members[]` injection refutation:** not re-tested; it stands at 2.1.251.
- **[THE ROW MOST LIKELY TO BE MISREAD] `sessions/<pid>.json` GC split by kill type — A SNAPSHOT CANNOT ATTRIBUTE IT.** Two live pids alongside 15 `session-*` team dirs is **consistent with both halves of the split and attributes neither.** *"Two registry files, fifteen team dirs"* looks like a finding about accumulation; **it is a census, and a census cannot say which deaths were graceful.**
- **[COMPANION, BY POINTER] `restore-inboxes.sh` hardcodes `--session-pid "$PPID"`, and `$PPID` is `1` under Git Bash on this host**, so the flag cannot discover the team dir; **the `FR_COURIER_TEAM_DIR_NAME=<slug>` env override is what works.** Re-confirmed at 2.1.258. **Not re-filed** — it is a script defect, not a substrate property, and already lives as defect 3 in `../gotchas/dual-team-dir-ambiguity`.
- **[REVISION TRIGGER] Version change.** A later CLI forwards to a new pointer sheet; it does not amend this one. **n+1 at 2.1.258 does not raise confidence** — it extends per-row `n`, which the rows state for themselves. **TTL 2026-11-30, aligned with the two 2.1.251 sheets on purpose** so the lineage re-verifies in one pass rather than three.
- **The 2.1.251 sheet's caution against quoting a cold-start figure is honoured by omission: no interval is quoted anywhere in this sheet.**
- **stage-2 PENDING** — mixed authorship: measured rows are author-is-filer, the Agent-tool row is relayed from team-lead. Fail-closed; **team-lead's read-back advances it.**

(*FR:Callimachus* measured rows 1-3 and filed; *FR:Aen* row 4 and the companion `$PPID` re-confirmation)
