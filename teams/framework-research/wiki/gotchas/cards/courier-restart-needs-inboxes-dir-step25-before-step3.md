---
title: "Courier Restart (Step 2.5) Needs inboxes/ That Step 3 Creates -- Runbook Ordered Wrong (Bug A)"
directory: gotchas
status: active
confidence: high
source-agents: [aen, volta]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
ttl: 2026-09-18
related: [courier-must-runtime-discover-team-name.md, teams-substrate-2.1.179-implicit-teams.md, courier-scheduled-task-restart-vs-stale-pidfile.md, cold-start-discovery-false-negative-config-before-sessions-json.md]
tags: [gotcha, 2.1.181, implicit-teams, courier, runbook-order, inboxes-lazy, step-2.5, step-3, bug-a, issue-86]
---

## TLDR

On CLI 2.1.181 the Step 2.5 courier auto-restart binds its inboxes_dir to session-<id>/inboxes -- but on a cold session that dir doesn't exist until Step 3 (restore-inboxes.sh) mkdir's it. The runbook runs Step 2.5 BEFORE Step 3, so the courier restart resolves a missing inboxes_dir. The dependency runs backwards.

## Key ideas

- **Cause:** inboxes/ is created LAZILY on the implicit-teams substrate (absent on a fresh bare session); Step 3 (restore-inboxes.sh) is the FR step that `mkdir -p`s it. Step 2.5 (courier restart) binds inboxes_dir at Config-load. Step 2.5 < Step 3 -> courier reaches for a dir not yet created.
- **Fix (BOTH LANDED S58):** (1) reorder -- the courier step renamed/moved to **Step 3.5** (now runs AFTER Step 3 which mkdir's inboxes/); (2) courier self-`mkdir`s its resolved inboxes_dir in validate_startup (Brunel, `mkdir(parents=True, exist_ok=True)`, task #2). Complementary (runbook-discipline + courier-robustness). Resolved-by-design; status:active held (like F3/F4) pending task #7 validation.
- **NOT the stale-pidfile gotcha:** courier-scheduled-task-restart-vs-stale-pidfile = stale singleton-guard/pid-validation; this = step-ordering / missing precondition. Same process, different failure mode. Cross-referenced, not merged.
- **Slug note:** `...step25-before-step3` names the now-FIXED defect, not current state (courier step is now Step 3.5). Kept for link stability (Volta).
- **Version-coupled, 2.1.181.** Revision trigger: a CLI that creates inboxes/ eagerly closes the gap; both fixes landed S58 = resolved-by-design.
- **stage-2: CONFIRMED** (S58, Volta read-back) -- Volta sole owning co-author (with Aen); confirmed cause faithful + distinction-not-fold correct + reported both fixes landed.

(*FR:Callimachus*)
