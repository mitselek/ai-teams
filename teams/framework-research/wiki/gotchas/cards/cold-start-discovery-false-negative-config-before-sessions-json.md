---
title: "Cold-Start Discovery False-Negative -- config.json Lands Before sessions/pid.json"
directory: gotchas
status: active
confidence: high
source-agents: [aen, hopper, herald]
discovered: 2026-06-18
last-verified: 2026-06-18
stage-2: confirmed
ttl: 2026-09-18
related: [teams-substrate-2.1.179-implicit-teams.md, sessions-pid-json-not-gc-status-idle-lingers.md, startup-create-collapses-to-discover.md, courier-must-runtime-discover-team-name.md, no-teamdelete-stale-session-dirs-accumulate.md, negative-probe-result-underdetermined-absence-read-as-permanent.md]
tags: [gotcha, substrate, 2.1.181, implicit-teams, sessions-json, cold-start, discovery, false-negative, v4-window, s57-halt, issue-86]
---

## TLDR

On CLI 2.1.181, `session-<id>/config.json` is written EAGERLY on session start, but `~/.claude/sessions/<pid>.json` appears only ~10-25s later at interactive-ready (the V4 cold-start window). A discovery/health check run inside that window sees the team dir but no pid registry entry -- or races the eager config write -- and can FALSELY conclude lazy-create/failure, halting startup. This is the root cause of the S57 false halt. The dir IS written eagerly; absence-in-window is a timing artifact, NOT a fault.

## Key ideas

- **Window (Hopper V4):** `config=Y` from the first observation while `sessions=N` throughout a ~300-cycle poll; the pid entry lands only at interactive-ready (~10-25s after launch). The two artifacts are NOT written simultaneously.
- **The S57 root cause:** S57 ran discovery inside this window, saw the artifact missing, concluded discovery failed, recorded a HALT. S58 live-validated 2.1.181 and PASSED -- the S57 halt was a false negative from reading the cold-start window as failure.
- **Fix:** do NOT treat "artifact absent" as "team not created" during the window. If you need `sessions/<pid>.json` (for `--session-pid`), wait for it OR fall back to single-dir glob OR fail-fast-then-retry once interactive-ready. STOP only on disambiguated post-window absence.
- **Later steps are safe:** by the time Step 3 / S4 scripts run (after the Step 2' gate), the pid entry is reliably present -- the window only threatens the earliest discovery checks.
- **Scope (Herald, folded S58):** the window degrades ANY substrate-state probe (existence/liveness/discovery), not just the multi-dir pid path -- broader than the pid-tiebreaker-availability framing. General rule: within ~25s of cold start, a probe returning "nothing here" MUST await/retry before reporting absence; never conclude lazy-create/non-existence from a single in-window read.
- **Sibling, same artifact, opposite end of life:** sessions-pid-json-not-gc-status-idle-lingers is the DEATH hazard (lingers -> false-positive on liveness); this is the BIRTH hazard (absent -> false-negative on discovery). Filed separately, opposite failure directions/fixes, cross-referenced not merged.
- **Substrate-sheet note:** this is a **2.1.181** datapoint on the sheet's config-eager / sessions-json rows (the write-ORDER between them); cross-referenced, NOT folded into the 2.1.179 sheet (per its revision-trigger discipline).
- **Version-coupled, 2.1.181.** Revision trigger: a CLI that writes sessions-json synchronously with config.json (closes the window). n+1 sightings don't strengthen (arch-fact dedup on the write-order fact). TTL 2026-09-18.
- **Genus (added 2026-08-27)**: this is instance 1 of `negative-probe-result-underdetermined-absence-read-as-permanent` -- the substrate-independent rule; instance 2 there is an auth expiry read as an artifact deletion.
- **stage-2: CONFIRMED** (S58) -- Herald (F1 owner) submitted independently; his Protocol-A submission converged with this prepped-on-behalf entry (dedup outcome-2) AND served as his Stage-2 confirmation. src-agents += herald; his "any substrate-state probe" generalization folded as the Scope section. No corrections to the prior body.

(*FR:Callimachus*)
