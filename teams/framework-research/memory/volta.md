---

# Volta scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S56 (2026-06-18) CLOSED -- **the 2.1.178+ migration is CUT OVER. WS2 lifecycle is on main (commit 309dcd8); CLI unpinned 2.1.177 -> 2.1.181.** My S56 work = pre-flip courier-config verification (Aen's runbook step-b), all PASS. No more staged/uncommitted WS2 work; it landed. I still do NOT touch git -- Aen owns commit/flip.
- **S56 verification (DONE, all PASS):** (1) both configs on disk: `fr-courier.config.json` (explicit always-safe default, gitignored) + `fr-courier.config.auto.json` (`inboxes_dir:"auto"`). auto.json was git-TRACKED (S55 commit 0882b86) -- divergence from direction-#4 "gitignored/not-committed"; I flagged it, Brunel cross-confirmed (his finding (d)); **Aen RULED (b): untrack+gitignore** (parity/intent-conformance, NOT security -- auto.json holds no host secrets; only the explicit config does). Brunel added the .gitignore line, Aen `git rm --cached`+committed. (2) wrapper `-Config` defaults to `.auto.json` (restart-fr-courier-with-pid.ps1:53). (3) V4 pre-flight dry-run guard present (wrapper L74-91): aborts BEFORE touching the live courier on resolve-fail; plain `start-fr-courier.ps1` defaults to the EXPLICIT config (L25) so a plain start can never crash.
- **Migration DECIDED DIRECTIONS (FINAL, do NOT reopen):** target 2.1.181; resolver liveness = PROCESS-based (os.kill+start-time guard, merged+validated); courier rotation = mode-(b) bare restart for v1 (-SessionPid is v2 multi-team only); config = LAUNCH-OVERRIDE (two local gitignored configs, courier stays UP); V5b/P6 NON-BLOCKING (RfC task #9); env override = `FR_COURIER_TEAM_DIR_NAME` (courier doesn't read it, keep); known constraints documented not blockers.
- **My WS2 surfaces (now on main):** `startup.md` (Step 0.5 auto-config; Step 2' Discover via `--resolve-team-dir` shim, multi-dir disambig; Step 2.5 courier-restart mode-(b); S5 deleted 5->4-phase shutdown; gotchas #3/#4 historical, #5 stale-dir+process-liveness); `topics/06-lifecycle.md` migration banners; `restore/persist-inboxes.sh` runtime-discover (`--session-pid $PPID` + `FR_COURIER_TEAM_DIR_NAME`->`--team-dir-name` bridge, fail-closed).
- **Carry-forward (NON-BLOCKING, post-cutover):** OQ10 stale `session-<id>` dir sweep (Brunel/Volta joint); OQ11 P6 attached-pane proactive-wake re-test (RfC task #9). [LEARNED S55->S56] verify-discipline works: independent Volta+Brunel cross-check of the auto.json tracking caught the #4 divergence cleanly; flag-as-owner's-call (don't reopen the decision) kept it churn-free this time.

---
## Session transcript (prune beyond line 100)

## S56 -- migration cutover: pre-flip courier-config verification (2026-06-18)

[CHECKPOINT 2026-06-18] **S56 = the CUTOVER session.** Booted clean on 2.1.177, absorbed Aen's S55 DECIDED DIRECTIONS (read-once, did NOT reopen). My task = runbook step-b: VERIFY the courier configs before Aen's flip. Verify-only, modified nothing (git is Aen's domain). All three items reported PASS:
- (1) Both configs on disk under `teams/framework-research/poc/ghost-bridge/`: `fr-courier.config.json` (explicit `inboxes_dir:"~/.claude/teams/framework-research/inboxes"`, gitignored .gitignore:8) + `fr-courier.config.auto.json` (`inboxes_dir:"auto"`, team_dir_name:null + _unpin_note).
- (2) Wrapper `restart-fr-courier-with-pid.ps1:53` `-Config` defaults to `.auto.json`. PASS.
- (3) V4 pre-flight dry-run guard L74-91: runs read-only `--resolve-team-dir`, aborts BEFORE touching the live courier on resolve-fail (only when inboxes_dir=="auto"). Plain `start-fr-courier.ps1:25` defaults to the EXPLICIT config -> a plain start can never crash. PASS.

[DECISION 2026-06-18 -- Aen ruling] **auto.json git-tracking divergence resolved.** I found auto.json was git-TRACKED (S55 commit 0882b86), diverging from direction-#4 ("both gitignored/not-committed"). Flagged as PASS-with-note (NOT reopening the decision -- flagged as Aen's call). Brunel independently cross-confirmed (his finding (d)). Key correction I supplied: this is NOT a security issue -- auto.json holds no host secrets; the explicit config is gitignored specifically because it holds the real ssh_target/hub address. Brunel's earlier untrack-lean had rested partly on a secret-worry that doesn't apply; my read corrected it. **Aen RULED (b): untrack+gitignore** (parity/intent-conformance with #4, NOT security). Brunel added the .gitignore line; Aen `git rm --cached`+committed. No #4 amendment needed.

[CHECKPOINT 2026-06-18] **WS2 lifecycle CUT OVER -- on main at commit 309dcd8; CLI unpinned 2.1.177 -> 2.1.181.** My S55 staged WS2 surfaces (startup.md Step 0.5/2'/2.5, S5-deleted 4-phase shutdown, gotcha #5; restore/persist runtime-discover scripts) landed on main. The migration is DONE.

[LEARNED 2026-06-18] **Verify-discipline + flag-as-owner's-call kept S56 churn-free** (contrast S55's over-churn HALT). Independent Volta+Brunel cross-check caught the auto.json #4-divergence cleanly; both of us flagged it to Aen as HIS call without reopening/re-deciding it ourselves; Aen ruled once; done. The discriminator vs S55: surface the finding + a crisp options-list, then STOP -- don't re-litigate across crossed messages.

[CARRY-FORWARD 2026-06-18 -- NON-BLOCKING, post-cutover] OQ10 stale `session-<id>` dir sweep (Brunel/Volta joint); OQ11 P6 attached-pane proactive-wake re-test (RfC task #9). Both filed as topic-06 Open Questions; neither gated the unpin.

(*FR:Volta*)

---

## S55 -- WS2 lifecycle-rework application (2026-06-18) [condensed; full work now on main @309dcd8]

[CHECKPOINT 2026-06-18] Applied Herald's WS2 design (`docs/lifecycle-rework-implicit-teams-2026-06-18.md`) to the operational surfaces -- 4 files. **startup.md:** "Implicit teams (2.1.178+)" block; Step 0.5 auto-config; Step 2 Clean+Create -> **Step 2' Discover** (`--resolve-team-dir --name` resolver shim, NO create-retry); Step 2.5 courier-restart mode-(b) bare; gotchas #3/#4 HISTORICAL, #5 stale-dir+process-liveness; Shutdown **S5 DELETED** (5->4 phases). **topic-06:** migration-amendment BANNERS (preserve historical rationale, not rewrites). **restore/persist-inboxes.sh:** runtime-discover via resolver (`--session-pid $PPID` + `FR_COURIER_TEAM_DIR_NAME`->`--team-dir-name` bridge), fail-closed, bash -n clean. Session HALTED by PO at the commit gate for cosmetic over-churn; all 4 files left flip-ready, committed in S56.

[DECISION 2026-06-18] **MULTI-DIR is the NORM** (Brunel WS1: 11 TeamCreate dirs on box; bare `--resolve-team-dir` -> rc1 ambiguous because liveness keys on `session-<id>` so no 2.1.177 dir matches). Scripts always pass a disambiguator: `--session-pid $PPID` (2.1.178+) + `--team-dir-name` (2.1.177 bridge via `FR_COURIER_TEAM_DIR_NAME` env). Verified n=2 on staged fake claude-home.

[DECISION 2026-06-18] Shim contract verified end-to-end vs MERGED production courier (`stationmaster-courier.py __main__` L1188-1227): `--resolve-team-dir --name` -> slug stdout exit0 / stderr exit1; pid precedence `--session-pid` arg else `FR_COURIER_SESSION_PID` env.

[LEARNED 2026-06-18] In a fast crossed-message thread, trust the COMMIT-OWNER's pre-commit ruling + on-disk verification over an intermediate teammate message; verify mechanism against disk before writing durable prose; don't re-edit on every crossed message. (This was the S55 over-churn lesson; applied successfully in S56.)

(*FR:Volta*)
