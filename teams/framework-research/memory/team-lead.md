# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S58 2026-06-18 **CLOSED**. Migration to CLI **2.1.181 LIVE-VALIDATED end-to-end** -- this overturned S57's halt (which was a COLD-START FALSE NEGATIVE). Steps 1/0.5/2'/3/2.5 all PASS. 3 courier bugs found+fixed+validated. apex round-trip ACK confirmed. **#86 CLOSED.** Courier UP (pid 41188 on `.auto.json`). Roster re-pinned `claude-opus-4-8[1m]` (PO chose proceed-on-opus over fable-5).
- **S58 KEY RESULTS:** Step 2' Discover PASSES -- eager dir `session-<sessionId[:8]>` (e.g. `session-b2ad507b`); resolver returns it BARE (liveness, FR sole live team) + via `--session-pid`. S57 "no dir" = checked inside V4 cold-start window (config.json first, sessions/<pid>.json +10-25s). `$PPID=1` broken-but-MOOT. python3 3.14.3 OK. Step 3 restore PASSES (44 inboxes). Bug A(b) live-validated w/ negative control. apex courier round-trip: deposit accepted -> inbound injected -> `ACK S58-RT-1` rendered.
- **3 courier bugs FIXED S58:** (A) runbook-order -> startup.md reorder Step3-before-courier(now Step3.5) + courier self-mkdir inboxes_dir (stationmaster-courier.py:1112). (B) orphan+lock -> stop-fr-courier.ps1 identity sweep + **Scheduled Task DISABLED** (the pid-38044 source; rollback `Enable-ScheduledTask -TaskName FrameworkResearch-Courier`). (C) stale explicit path -> stop drains against launched `-Config` (default `.auto.json`); Direction #4 amended (see below).
- **CARRY-FORWARD (top follow-up):** the **`inter-team-comms` skill is STALE post-S58** -- it hardcodes the old static `~/.claude/teams/framework-research/` paths + the now-disabled Scheduled Task. I adapted live to `session-<id>` + the wrapper courier, but the SKILL FILE needs a 2.1.178+ update. Queued, NOT tasked.
- **DEFERRED:** Bug-C at-scale OPEN (v2/RfC, lifecycle-rework OQ#6 -- only when a 2nd team migrates); optional Bug-B live-sweep test (defense-in-depth; Task source already disabled).

---

### DECIDED DIRECTIONS (S55 -- FINAL; #4 AMENDED+ratified S58; do NOT re-decide)

1. **Target version = 2.1.181** (npm `latest`=`next`=2.1.181; `stable`=2.1.170 BELOW the 2.1.178+ floor). Autoupdater ENABLED (S56 PO) -> may boot ABOVE 2.1.181; re-validate any bump via `designs/new/migration-probe-harness/` before trusting Step 2'/2.5.
2. **Resolver liveness = PROCESS-based, NOT status.** Merged+validated on main. (S58: confirmed live -- bare liveness resolved FR's sole live dir.)
3. **Courier rotation = mode-(b) bare restart for v1.** Step 2.5 = `restart-fr-courier-with-pid.ps1` (no args); `-SessionPid` (mode-a) = v2 multi-migrated-team only.
4. **Courier config = LAUNCH-OVERRIDE.** `fr-courier.config.json` (explicit) + `fr-courier.config.auto.json` (`"auto"`, wrapper `-Config` default, V4-guarded). LOCAL/gitignored. **AMENDED S58 (RATIFIED):** persistence is CLI-version-SPLIT. 2.1.177 = explicit static path MAY stay up between sessions (rollback baseline). **2.1.178+ = courier is PER-SESSION**, wrapper-restarted onto `.auto.json` each session start; "explicit stays UP between sessions" is RETIRED (obsolete -- the session-<id> dir it relied on rotates). Explicit-session-aware = REJECTED (dup resolver). `stop-fr-courier.ps1` drains against launched `-Config`, not a hardwired path.
5. **V5b/P6 = NON-BLOCKING.** Inbox-restore rides active-session P4 delivery. Proactive-wake re-test DEFERRED.
6. **Env override = `FR_COURIER_TEAM_DIR_NAME`** (2.1.177-bridge only; courier ignores it -- cosmetic).
7. **Lifecycle (Volta WS2) APPLIED to main S56** (`309dcd8`); **further corrected S58** (startup.md Step3-before-3.5 reorder + Step3.5 version-split prose; lifecycle-rework teardown-contract + OQ#6).
8. **Known constraints (NOT blockers):** (a) bare-liveness valid only while FR SOLE live 2.1.178+ team; (b) session-<id> rotates -> restart re-resolves; (c) many-team host -> discovery MUST disambiguate; (d) Windows `$PPID` best-effort -> degrades to liveness (lived this S58, worked).

---

### S58 WRAP

- Spawned migration team (Brunel/Herald/Volta/Hopper/Cal) on PO go; landed all 3 bug fixes + docs + 4 gotchas + 1 contract (Cal) in one fast clean pass, zero reopening (churn-halt held).
- Single-writer discipline on startup.md (Herald handed Volta the Step 2' sentence) avoided a background two-writer race -- worked.
- #86 CLOSED with the apex round-trip as closing evidence. Hub link healthy: bidirectional grants apex<->FR confirmed.
- Files this session: stationmaster-courier.py, stop-fr-courier.ps1, startup.md, topics/06, lifecycle-rework doc, ops-log, roster.json, all scratchpads, wiki (index + 4 gotchas + 1 contract + card INDEXes).

### NEXT-SESSION BOOT (re-orient instructions for S59)

1. Read `startup.md` first -- it is the validated 2.1.181 4-phase version (Steps 1, 0.5, 2', 2.5(=3.5 order), 3, 4). S58 proved it works on live 2.1.181/Windows.
2. Pull `mitselek-ai-teams`.
3. Boot is on 2.1.181+ (autoupdater ON). **If `claude --version` > 2.1.181**, re-validate lifecycle via `designs/new/migration-probe-harness/` before trusting Step 2'/2.5 -- only 2.1.181 is validated.
4. **Model: roster now pins `claude-opus-4-8[1m]` (re-pinned S58).** Step 0.5: if parent != opus-4-8, resolve before spawn.
5. **Cold-start patience:** Step 2' may see "no team dir" for ~10-25s after a cold boot (V4 window) -- AWAIT/RETRY, do NOT conclude failure (this is what burned S57; now a startup.md gotcha + wiki F1).
6. **Don't pre-spawn. Wait for PO.**
7. **If PO surfaces the `inter-team-comms` skill / cross-team comms:** the SKILL FILE is stale post-S58 (static `framework-research` paths + disabled Task). Spawn Volta (+ maybe Brunel) to update it for 2.1.178+ (session-<id> dir auto-discovery + wrapper courier, NOT the Scheduled Task). TOP queued follow-up.
8. **If PO surfaces Bug-B hardening:** optional orphan-sweep live test (Brunel authors shape, Hopper runs, Tier R-M throwaway). Defense-in-depth; not urgent (Task source disabled).
9. **If PO surfaces at-scale courier / a 2nd migrating team:** Bug-C OPEN (lifecycle-rework OQ#6) -- single-point Config-load resolution isn't self-healing; needs poll-loop re-resolution OR per-delivery liveness check. v2 only.
10. **Courier note:** it does NOT auto-restart between sessions now (Task disabled). Step 2.5 wrapper restart re-establishes it each session. Disabled Task is registered for rollback.

### Standing watch items going into S59

- **CUT THE CHURN** (`feedback_cut_coordination_churn`): S58 held it -- fast, clean, no reopening. Keep declaring DONE once the load-bearing thing is validated.
- **GitHub #86 = CLOSED S58.** #75/#76 + teamless-courier RfC remain open, lower priority.
- **inter-team-comms skill update = the top un-tasked follow-up** (item 7 above).
- Cal wiki ~156-157 entries (S58 added 4 gotchas + 1 contract). Nearest TTL 2026-09-17/18 (teams-substrate-2.1.179 / no-teamdelete-stale-dirs / sessions-pid-not-gc) -- 2.1.179 sheet now has 2.1.181 datapoints cross-ref'd.
- apex link proven (round-trip S58). Scheduled Task `FrameworkResearch-Courier` = DISABLED (rollback `Enable-ScheduledTask`).

(*FR:Aen*)

---
*Earlier sessions pruned per 100-line discipline. S57 = false-halt (cold-start FN), no team spawned. S56 = lifecycle flip applied to main + autoupdater ENABLE. S55 = migration design+validation. Full history in git; durable knowledge in `wiki/`.*
