---
name: courier-restart-needs-inboxes-dir-step25-before-step3
description: On CLI 2.1.181 the Step 2.5 courier auto-restart resolves and binds its inboxes_dir to session-<id>/inboxes -- but on a cold session that dir does not exist until Step 3 (restore-inboxes.sh) mkdir's it. The startup runbook currently runs Step 2.5 BEFORE Step 3, so the courier restart hits a missing inboxes_dir. Fix: reorder (Step 3 before 2.5) OR have the courier self-mkdir its resolved inboxes_dir at startup.
type: gotcha
source-agents:
  - aen
  - volta
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/startup.md
  - teams/framework-research/restore-inboxes.sh
  - teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1
source-issues:
  - mitselek/ai-teams#86
related:
  - decisions/courier-must-runtime-discover-team-name.md
  - references/teams-substrate-2.1.179-implicit-teams.md
  - gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md
  - gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md
ttl: 2026-09-18
---

# Courier restart (Step 2.5) needs `inboxes/` that Step 3 creates -- runbook ordered wrong (Bug A)

**Observation-based gotcha, version-stamped 2.1.181 -- a startup-runbook ordering defect surfaced by S58's live validation.**

## Symptom

On a fresh cold session, the Step 2.5 courier auto-restart resolves its `inboxes_dir` to `~/.claude/teams/session-<id>/inboxes` (the live session's dir, per [[courier-must-runtime-discover-team-name]]) -- but that `inboxes/` directory **does not exist yet**. `inboxes/` is created **lazily** on the implicit-teams substrate (absent on a brand-fresh bare session -- see the `inboxes lazy` row of [[teams-substrate-2.1.179-implicit-teams]]), and the thing that creates it during FR startup is **Step 3** (`restore-inboxes.sh`, which `mkdir -p`s the inboxes dir). The courier restart resolves a directory that isn't there yet.

## Cause -- runbook order: Step 2.5 runs before Step 3

The startup runbook orders the courier restart (**Step 2.5**) **before** inbox restore (**Step 3**). But:

- **Step 3 (`restore-inboxes.sh`)** is the step that `mkdir -p`s `~/.claude/teams/<discovered-slug>/inboxes/` (the script explicitly handles "bare-fresh sessions have no `inboxes/` until first activity").
- **Step 2.5 (courier restart)** resolves and binds `inboxes_dir` to that same path at Config-load.

So on a cold session the courier restart in Step 2.5 reaches for an `inboxes_dir` that the not-yet-run Step 3 was going to create. The dependency runs backwards.

## Fix (owner Volta) -- BOTH LANDED (S58)

1. **Reorder the runbook -- LANDED (S58).** The courier step is **renamed/moved to Step 3.5**, now running **AFTER** Step 3 (inbox restore, which `mkdir`s `inboxes/`). The dependency is satisfied by ordering. (Task #1 -- startup.md reorder + topics/06 note, DONE.)
2. **Courier self-`mkdir`s its resolved `inboxes_dir` -- LANDED (S58).** Brunel's `validate_startup` now does `mkdir(parents=True, exist_ok=True)` (matching the sibling state/spool/inject dirs), so the courier owns its own precondition and no longer depends on a prior step. (Task #2 -- courier self-mkdir, COMPLETED.)

The two fixes are complementary, not exclusive: reorder is the runbook-discipline fix; self-mkdir is the courier-robustness fix that also protects any caller that invokes the courier outside the runbook. **Both landed S58 -> this gotcha is resolved-by-design** (the entry is retained as the record of *why* the order mattered; see Revision trigger).

**Note on the slug:** the slug `...step25-before-step3` names the now-FIXED defect (Step 2.5 before Step 3), not current state (the courier step is now Step 3.5, after Step 3). The slug is kept for link stability (Volta's call) -- read it as historical-defect-name, not live ordering.

## Distinction from the stale-pidfile courier gotcha

This is **NOT** [[courier-scheduled-task-restart-vs-stale-pidfile]] (that is a stale singleton-guard / pid-validation problem). This is a **step-ordering** problem: the courier restart's `inboxes_dir` **precondition** (the directory existing) is established by a **later** runbook step. Same process (the courier), different failure mode (missing-precondition-due-to-order vs. stale-guard-on-relaunch). Cross-referenced, not merged.

## Revision trigger

**Substrate or runbook change** (version-coupled, 2.1.181): if a future CLI creates `inboxes/` eagerly with `config.json` (closing the lazy-create gap), the missing-precondition disappears regardless of order. If the runbook is reordered (fix 1) or the courier self-mkdirs (fix 2), this gotcha is resolved-by-design -- update to `status` reflecting the landed fix at that point, keeping the record of why the order matters. Re-confirm the `inboxes lazy` substrate row at the [[teams-substrate-2.1.179-implicit-teams]] TTL.

## Related

- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the runtime-discovery that resolves `inboxes_dir` to `session-<id>/inboxes`; this gotcha is about that resolved dir not existing yet at Step 2.5 time.
- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the `inboxes lazy` substrate row (inboxes/ absent on a fresh bare session) that creates the precondition gap; **2.1.181 datapoint** on the ordering consequence.
- [`gotchas/courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md) -- a DIFFERENT courier-restart failure mode (stale pidfile / singleton guard); cross-referenced to keep the two distinct (ordering vs. guard-staleness).
- [`gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md`](cold-start-discovery-false-negative-config-before-sessions-json.md) -- a sibling cold-start timing gotcha (both are "a startup step run against a not-yet-ready substrate state on 2.1.181").

## Amendments log

- **2026-06-18 (S58, Volta read-back = Stage-2 confirmation):** stage-2 `pending` → **`confirmed`** (Volta is the sole owning co-author with Aen; confirmed the cause faithful + the distinction-from-stale-pidfile correct, separate-not-fold). **Fix status updated to BOTH LANDED:** fix (1) reorder DONE -- the courier step is renamed/moved to **Step 3.5** (runs after Step 3); fix (2) courier self-`mkdir` DONE (Brunel's `validate_startup` `mkdir(parents=True, exist_ok=True)`, task #2). The gotcha is **resolved-by-design**; `status: active` held (consistent with the F3/F4 sibling courier fixes) pending task #7 end-to-end validation, then retire/`resolved`. **Slug kept** (`...step25-before-step3`) for link stability per Volta -- it names the now-fixed defect, not current ordering (the courier step is now Step 3.5).
