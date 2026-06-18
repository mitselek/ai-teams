---
title: "Explicit Courier Config Hardcodes a framework-research Path That's Stale on 2.1.181 (Bug C)"
directory: gotchas
status: active
confidence: high
source-agents: [aen, brunel]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
ttl: 2026-09-18
related: [courier-must-runtime-discover-team-name.md, teams-substrate-2.1.179-implicit-teams.md, orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md, courier-restart-needs-inboxes-dir-step25-before-step3.md]
tags: [gotcha, 2.1.181, implicit-teams, courier, explicit-config, hardcoded-path, direction-4, fallback, bug-c, issue-86]
---

## TLDR

The explicit fr-courier.config.json hardcodes inboxes_dir = ...teams\framework-research\inboxes, which does NOT exist on 2.1.181 (team dir is session-<id>). So the "always-safe explicit-fallback courier" delivers NOTHING and the wrapper's final-drain always errors rc=1. This breaks DECIDED-DIRECTION #4's "explicit fallback stays up safe between sessions" clause -- on 2.1.181 the explicit config is structurally stale.

## Key ideas

- **Cause:** on 2.1.181 the team dir is session-<id>, not framework-research (see courier-must-runtime-discover-team-name + substrate sheet Name-on-disk row). So the hardcoded ...teams\framework-research\inboxes resolves to nowhere: no delivery, drain errors rc=1.
- **Breaks Direction #4:** the launch-override design relied on the explicit config being a SAFE between-session default. The safety came from the path being correct; on 2.1.181 it's stale -> the explicit fallback is a silent no-op, not safe.
- **Same root cause as the decision, different site:** courier-must-runtime-discover-team-name fixed the AUTO-discovery courier; Bug C is the EXPLICIT config still carrying the dead literal AND the between-session-fallback assumption built on it. Auto config solves rotation; it doesn't rescue the explicit literal.
- **Fix (task #4) -- LANDED:** (1) retire the "explicit-fallback stays up between sessions" assumption; the amended Direction #4 is CLI-version-split (2.1.177 explicit-may-stay-up = rollback baseline; 2.1.178+ per-session, between-session persistence retired-as-obsolete); (2) drain fix LANDED -- stop-fr-courier.ps1 `param($Config=.auto.json)` drains the launched config not the phantom literal (option-1, parse-check PASS); (3) Direction #4 amendment RATIFIED (team-lead.md L20). status:active held until task #7 validation.
- **Rejected alt (Brunel):** make the explicit config session-aware -- REJECTED, it duplicates .auto.json's resolver (a 2nd auto-resolver to sync). Decision: one auto-resolver (.auto.json+wrapper) + one rollback baseline (explicit, 2.1.177-ONLY). That's why the fix retires the between-session fallback rather than repairing the explicit path.
- **Version-coupled, 2.1.181.** Revision trigger: resolved-by-design (retire + drain-fix + amendment all landed S58); re-open only if a future CLI restores a controllable/static team name (same condition that would relax courier-must-runtime-discover).
- **Co-surfaced with Bug B:** the orphan that held the lock ran on this same explicit config; disabling its Scheduled Task couples to retiring the explicit fallback here.
- **stage-2: CONFIRMED** (S58, Brunel read-back) -- Brunel sole owning co-author (with Aen); confirmed accurate + added the rejected-alternative + reported fixes landed.

(*FR:Callimachus*)
