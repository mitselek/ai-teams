# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S55 closed 2026-06-18 -- **the 2.1.178+ migration is FULLY DESIGNED + VALIDATED, but NOT yet cut over.** PO halted the cutover at the commit gate (coordination over-churned on cosmetics -- env-name, prose, mode-a/b re-confirms). **CLI still 2.1.177; courier untouched (pid 38044, explicit config).** Durable work committed to main; the new 2.1.178+ lifecycle files (`startup.md` + `restore/persist` scripts) are staged on branch **`fr/unpin-2.1.181-lifecycle`** (kept OFF main so S56 boots CLEAN on 2.1.177).
- **NEXT SESSION (S56) SCOPE (PO-stated, verbatim intent):** boot clean on 2.1.177 -> **(a) CLOSE all open questions + BRIEF the team on the DECIDED DIRECTIONS below -- state them ONCE, do NOT reopen/re-decide/cross-decide.** -> **(b) THEN unpin to 2.1.181** (runbook below).
- **All migration decisions are FINAL.** Do NOT reopen them. The churn is the thing the PO halted -- brief once, execute.

---

### DECIDED DIRECTIONS (S55 -- FINAL; communicate to the team once, do NOT re-decide)

1. **Target version = 2.1.181** (PO-decided; npm `latest`=`next`=2.1.181; `stable`=2.1.170 is BELOW the 2.1.178+ floor, so "latest stable" was a contradiction -- 2.1.181 is the call).
2. **Resolver liveness = PROCESS-based, NOT status.** V3 proved `sessions/<pid>.json` is NOT GC'd on exit and lingers `status:"idle"` (indistinguishable from live). Fix = `os.kill` + `/proc/<pid>/stat` start-time guard, layered on the EXISTING cross-platform `_pid_alive` (Windows-safe), + a null-pid guard. **MERGED into `stationmaster-courier.py` + validated: Linux 12/12 unit, Windows 11/11 + 4/4 InstanceLock + 17/17 integration. DONE (on main).**
3. **Courier rotation fix = mode-(b) bare restart for v1.** Step 2.5 calls `restart-fr-courier-with-pid.ps1` (NO args) -> bare `"auto"`+process-liveness resolves FR's sole live `session-<id>`; restart-at-session-start handles rotation. The `-SessionPid` path (mode-a) is the documented **v2 multi-migrated-team** upgrade ONLY.
4. **Courier config = LAUNCH-OVERRIDE.** Two LOCAL (gitignored) configs: `fr-courier.config.json` (explicit, ALWAYS-safe default -- a plain start can never crash) + `fr-courier.config.auto.json` (the `"auto"` variant the wrapper's `-Config` defaults to). Only the wrapper loads `.auto.json`, behind its V4 pre-flight dry-run guard. Courier stays UP. Configs persist on disk; NOT committed.
5. **V5b/P6 = NON-BLOCKING for the unpin.** Courier polls (delivery guaranteed); Step 3 inbox-restore rides active-session P4-class delivery (confirmed on 2.1.181), NOT idle-proactive-wake. The attached-pane proactive-wake re-test is DEFERRED/RfC-scope (task #9) -- only if real recipient-wake latency shows post-unpin or the teamless-courier RfC needs it.
6. **Env override name = `FR_COURIER_TEAM_DIR_NAME`** (Volta's scripts' 2.1.177-bridge override -> `--team-dir-name`). KEEP as-is. The courier does NOT read it (cosmetic). Do NOT revert.
7. **Lifecycle (Volta WS2) = FLIP-READY on branch `fr/unpin-2.1.181-lifecycle`:** startup.md (Step 0.5 reads auto-config; Step 2' Discover via `--resolve-team-dir` shim; Step 2.5 courier restart; S5 deleted -> 4-phase shutdown; gotchas #3/#4 historical, #5 stale-dir + process-liveness) + topic-06 banners (on main) + restore/persist scripts (runtime-discover). Grounded in `docs/lifecycle-rework-implicit-teams-2026-06-18.md` (Herald, on main).
8. **Known constraints (documented, NOT blockers):** (a) bare-liveness valid only while FR is the SOLE live 2.1.178+ team (2nd migrated team -> mode-a pid); (b) `session-<id>` rotates per session -> restart-at-session-start re-resolves; (c) 12-team host -> discovery MUST disambiguate (`--session-pid` on 2.1.178+, `--team-dir-name framework-research` on the 2.1.177 bridge); (d) Windows `$PPID` is best-effort, degrades to liveness (non-fatal).

---

### NEXT-SESSION BOOT (re-orient for S56)

1. Read `startup.md` first -- it is the OLD 2.1.177 version on main (TeamDelete+TeamCreate Step 2). The new 2.1.178+ version is on branch `fr/unpin-2.1.181-lifecycle`, applied AT the unpin, NOT before. Boot the team CLEAN on 2.1.177 as normal.
2. Pull `mitselek-ai-teams`.
3. Don't pre-spawn. On PO go, the migration team = Brunel + Herald + Volta + Hopper (+ Cal). Confirm with PO.
4. **PRIMARY: (a) brief the team on the DECIDED DIRECTIONS above (once, no reopening). (b) then unpin.**
5. **UNPIN RUNBOOK (on PO go):**
   - a. Apply lifecycle: `git checkout fr/unpin-2.1.181-lifecycle -- teams/framework-research/startup.md teams/framework-research/restore-inboxes.sh teams/framework-research/persist-inboxes.sh` -> commit to main.
   - b. Confirm `fr-courier.config.auto.json` exists on disk (local; recreate if missing) + wrapper `-Config` defaults to it.
   - c. PO runs `npm i -g @anthropic-ai/claude-code@2.1.181` (KEEP `DISABLE_AUTOUPDATER=1` -- adopt-but-controlled).
   - d. End the session; the NEXT boot is on 2.1.181 with the new lifecycle (Step 2' Discover + Step 2.5 courier restart on `.auto.json`) = the live validation.
   - e. ROLLBACK: `npm i -g @anthropic-ai/claude-code@2.1.177` + revert the lifecycle commit; the explicit courier config is the safe on-disk default.
6. Empirical ground truth = `docs/migration-validation-probe-findings-2026-06-18.md` (V1-V5). Repeatable harness = `designs/new/migration-probe-harness/` (reusable for future CLI-version migrations).

### Standing watch items going into S56

- **CUT THE CHURN (PO feedback S55, memory `feedback_cut_coordination_churn`):** brief the decided directions ONCE; do NOT let the team re-harmonize cosmetics. When agent messages stop adding substance and start re-affirming settled choices, that's the cue to cut it and execute.
- **GitHub #86** = migration tracking issue. **#75/#76** + teamless-courier RfC remain open, lower priority.
- **Cal wiki 147->152** committed S55 (process-liveness / field-22 family: "a recorded flag is a claim, not proof; OS start-time is proof"). Hopper owes a read-back on `decisions/courier-must-runtime-discover-team-name` (PARTIAL->CONFIRMED).
- **apex** unchanged; **comms-dev** may chime on the 2.1.178 findings.
- Tasks #3 (unpin) + #9 (P6 re-test, deferred) + #11 (courier restart integration, design-done) carry forward.

(*FR:Aen*)

---
*Earlier sessions pruned per 100-line discipline. S54 = -courier convention + 2.1.179 probe (empirically answered the migration question). S53 = CCR protocol + apex ref instance. Full history in git; durable knowledge in `wiki/`.*
