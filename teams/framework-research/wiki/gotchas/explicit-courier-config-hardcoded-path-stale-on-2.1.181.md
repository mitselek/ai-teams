---
name: explicit-courier-config-hardcoded-path-stale-on-2.1.181
description: The explicit fr-courier.config.json hardcodes inboxes_dir = ...teams\framework-research\inboxes, which does NOT exist on CLI 2.1.181 (team dir is session-<id>, not framework-research). So the always-safe explicit-fallback courier delivers NOTHING and the wrapper's final-drain always errors rc=1. This breaks Direction #4's assumption that the explicit-fallback courier stays up and safe between sessions -- on 2.1.181 the explicit config is structurally stale. Fix: retire the explicit-fallback-between-sessions assumption; the auto-discovery config is the only one that resolves a live inboxes_dir.
type: gotcha
source-agents:
  - aen
  - brunel
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/poc/ghost-bridge/fr-courier.config.json
  - teams/framework-research/poc/ghost-bridge/restart-fr-courier-with-pid.ps1
source-issues:
  - mitselek/ai-teams#86
related:
  - decisions/courier-must-runtime-discover-team-name.md
  - references/teams-substrate-2.1.179-implicit-teams.md
  - gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md
  - gotchas/courier-restart-needs-inboxes-dir-step25-before-step3.md
  - contracts/courier-rotation-contract-has-teardown-half-reap-before-acquire.md
ttl: 2026-09-18
---

# Explicit courier config hardcodes a `framework-research` path that's stale on 2.1.181 (Bug C)

**Observation-based gotcha, version-stamped 2.1.181 -- surfaced live during S58; invalidates a load-bearing assumption of DECIDED-DIRECTION #4 (owner: Brunel).**

## Symptom

The "always-safe explicit-fallback courier" -- the one Direction #4 says stays up between sessions and can never crash -- **delivers nothing** on 2.1.181, and the wrapper's **final-drain always errors `rc=1`**. A courier appears to start and stay up, but no messages move.

## Cause -- the explicit config's path doesn't exist on 2.1.181

The explicit config `fr-courier.config.json` hardcodes:

```
inboxes_dir = ...teams\framework-research\inboxes
```

On CLI **2.1.181** the on-disk team dir is **`session-<id>`** (random per session), **NOT** `framework-research` -- see [[courier-must-runtime-discover-team-name]] and the `Name-on-disk` row of [[teams-substrate-2.1.179-implicit-teams]]. So `...teams\framework-research\inboxes` **does not exist**. The explicit-fallback courier resolves a path to nowhere: it delivers nothing, and the wrapper's external final-drain over that non-existent path errors `rc=1` every time.

## Why this breaks Direction #4

DECIDED-DIRECTION #4 (courier config = launch-override) rests on two configs: `fr-courier.config.json` (explicit, **"always-safe" default** that **stays up safe between sessions** and **can never crash on a plain start**) and `fr-courier.config.auto.json` (the `inboxes_dir:"auto"` variant the wrapper loads behind its V4 guard). The **"explicit fallback stays up and safe between sessions"** clause assumed the explicit path was *valid*. On 2.1.181 it is **structurally stale**: the hardcoded `framework-research` path never resolves, so the explicit fallback is **not** a safe between-session default -- it is a silent no-op (and an erroring drain). The safety the direction relied on came from the path being correct, and it no longer is.

This is the **same root cause** as [[courier-must-runtime-discover-team-name]] (hardcoded `framework-research` is dead on 2.1.178+) but at a **different site and with a different consequence**: that decision fixed the *auto-discovery* courier; Bug C is the **explicit** config still carrying the dead path AND the *between-session-safe-fallback* assumption built on it. The auto config solves rotation; it does not rescue the explicit config's stale literal.

## Fix (owner Brunel -- task #4) -- LANDED (validation pending task #7)

1. **Retire the "explicit-fallback courier stays up between sessions" assumption.** On 2.1.181 there is no valid static path to fall back to; only runtime discovery (the `.auto.json` path) resolves a live `inboxes_dir`. The between-session safe default must be re-grounded on auto-discovery, not a hardcoded literal. **The amended Direction #4 is CLI-version-split (Brunel, S58):** on **2.1.177** the explicit config may stay up = the **rollback baseline**; on **2.1.178+** the courier is **per-session** (wrapper-restarted), and between-session persistence is **RETIRED -- obsolete, not broken.**
2. **Fix the final-drain -- LANDED (S58, code).** `stop-fr-courier.ps1` now takes `param([string]$Config = .auto.json default)` and drains against the **launched** config, not the hardwired explicit path -> no more `rc=1` on the phantom literal. (Brunel chose **option-1 "drain against the actual launched config"** over option-2 "skip explicit-drain" -- option-1 keeps the drain functional.) Parse-check PASS.
3. **Amend DECIDED-DIRECTION #4** to remove/replace the "explicit fallback stays up safe between sessions" clause -- it is false on 2.1.181. **This amendment is RATIFIED (team-lead, 2026-06-18 S58, `memory/team-lead.md` L20)** -- the direction text is team-lead-owned; this wiki entry records the *why* the clause was retired. The "why" is settled, not pending.

## Rejected alternative (Brunel, S58)

**Make the explicit config session-aware** (give it its own runtime discovery) -- REJECTED. It would **duplicate `.auto.json`'s resolver**: a *second* auto-resolver to keep in sync with the first. Decision: **one auto-resolver** (`.auto.json` + wrapper) and **one rollback baseline** (the explicit config, **2.1.177-ONLY**). The explicit config stays a static 2.1.177 rollback artifact; it is NOT taught to runtime-discover. This is why the fix *retires* the between-session explicit fallback on 2.1.178+ rather than *repairing* the explicit path -- repairing it would mean maintaining two resolvers.

## Revision trigger

**Substrate/config change** (version-coupled, 2.1.181): resolved-by-design once the explicit-fallback-between-sessions assumption is retired (Direction #4 amended, RATIFIED S58) and the drain is fixed (LANDED S58, option-1). `status: active` held until task #7 validates the fixes end-to-end. Re-open only if a future CLI **restores a controllable/static team name** (then a hardcoded path could be valid again -- the same condition that would relax [[courier-must-runtime-discover-team-name]]). Re-confirm at the [[teams-substrate-2.1.179-implicit-teams]] TTL.

## Related

- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- **same root cause** (hardcoded `framework-research` is dead on 2.1.178+); that decision fixed the auto-discovery courier, this gotcha is the explicit config + between-session-fallback assumption still carrying the dead path. The decision is the fix's direction; this is the residual site it didn't cover.
- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the `Name-on-disk = session-<id>` substrate row that makes the hardcoded `framework-research` path stale; **2.1.181 datapoint** on the explicit-config consequence.
- [`gotchas/orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md`](orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md) -- **co-surfaced Bug B**; the orphan that held the lock was running on this same explicit config, and disabling its Scheduled Task couples to retiring the explicit-fallback-between-sessions assumption here.
- [`gotchas/courier-restart-needs-inboxes-dir-step25-before-step3.md`](courier-restart-needs-inboxes-dir-step25-before-step3.md) -- co-surfaced Bug A; all three (A/B/C) are 2.1.181 courier-lifecycle defects found in the same S58 startup.

## Amendments log

- **2026-06-18 (S58, Brunel read-back = Stage-2 confirmation):** stage-2 `pending` → **`confirmed`** (Brunel is the sole owning co-author with Aen; confirmed the entry accurate). **Added the Rejected-alternative section** (Brunel): making the explicit config session-aware was rejected -- it would duplicate `.auto.json`'s resolver; decision = one auto-resolver + one 2.1.177-only rollback baseline. **Fix status updated to LANDED:** drain fix landed in `stop-fr-courier.ps1` via `param($Config=.auto.json)` draining the launched config (option-1, parse-check PASS); Direction #4 amendment RATIFIED (team-lead.md L20) and is **CLI-version-split** (2.1.177 explicit-may-stay-up = rollback baseline; 2.1.178+ per-session, between-session persistence retired-as-obsolete). `status: active` held until task #7 validation.

(*FR:Callimachus*)
