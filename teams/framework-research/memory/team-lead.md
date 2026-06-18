# Team-Lead Scratchpad (*FR:Aen*)

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S56 closed 2026-06-18 -- **lifecycle FLIPPED on main, hygiene closed, team briefed; npm unpin to 2.1.181 PAUSED at PO request pending an autoupdater-vs-pin decision.** CLI still 2.1.177; courier untouched (pid 38044, explicit config). Two commits on main: `309dcd8` (2.1.178+ lifecycle applied: new startup.md Step 0.5/2'/2.5 + 4-phase shutdown + runtime-discover restore/persist scripts) + `727a16a` (untrack fr-courier.config.auto.json, Direction #4 enforced -- now gitignored, still on disk).
- **OPEN PO DECISION (carry into S57 / pre-flip):** pin to 2.1.181 (keep `DISABLE_AUTOUPDATER=1`, adopt-but-controlled) **vs** enable the autoupdater. Runbook currently assumes PIN. Resolve before/at the npm step.
- **NEXT (post-decision):** PO runs `npm i -g @anthropic-ai/claude-code@2.1.181`; next boot is on 2.1.181 + new lifecycle (Step 2' Discover via `--resolve-team-dir` + Step 2.5 courier restart on `.auto.json` behind V4 guard) = the live validation. ROLLBACK: reinstall 2.1.177 + `git revert 727a16a 309dcd8`; explicit courier config is the safe on-disk default.
- **All migration decisions FINAL** (directions below). S56 brief landed CLEAN -- zero reopening. Do NOT re-decide.

---

### DECIDED DIRECTIONS (S55 -- FINAL; brief delivered + acknowledged S56, do NOT re-decide)

1. **Target version = 2.1.181** (PO-decided; npm `latest`=`next`=2.1.181; `stable`=2.1.170 is BELOW the 2.1.178+ floor).
2. **Resolver liveness = PROCESS-based, NOT status.** `os.kill` + `/proc/<pid>/stat` start-time guard on the existing cross-platform `_pid_alive` + null-pid guard. MERGED + validated on main (Linux 12/12, Windows 11/11 + 4/4 lock + 17/17 integration).
3. **Courier rotation = mode-(b) bare restart for v1.** Step 2.5 calls `restart-fr-courier-with-pid.ps1` (no args); `-SessionPid` (mode-a) is the v2 multi-migrated-team upgrade ONLY.
4. **Courier config = LAUNCH-OVERRIDE.** Two LOCAL (gitignored) configs: `fr-courier.config.json` (explicit, always-safe default) + `fr-courier.config.auto.json` (`"auto"` variant, wrapper `-Config` default, behind V4 dry-run guard). Persist on disk; NOT committed. (S56: auto.json untracked to enforce this.)
5. **V5b/P6 = NON-BLOCKING for the unpin.** Courier polls; Step 3 inbox-restore rides active-session P4-class delivery. Attached-pane proactive-wake re-test = DEFERRED/RfC (task #9).
6. **Env override name = `FR_COURIER_TEAM_DIR_NAME`** (Volta's 2.1.177-bridge override). KEEP as-is; courier does NOT read it (cosmetic).
7. **Lifecycle (Volta WS2) = APPLIED to main S56** (`309dcd8`): startup.md Step 0.5/2'/2.5 + S5-deleted 4-phase shutdown + gotcha #5; restore/persist runtime-discover. Was branch `fr/unpin-2.1.181-lifecycle`; flipped at the unpin gate.
8. **Known constraints (documented, NOT blockers):** (a) bare-liveness valid only while FR is SOLE live 2.1.178+ team; (b) `session-<id>` rotates per session -> restart-at-session-start re-resolves; (c) 12-team host -> discovery MUST disambiguate; (d) Windows `$PPID` best-effort, degrades to liveness.

---

### S56 WRAP

- Brief delivered to Brunel+Herald+Volta+Hopper+Cal; all 5 acknowledged the 8 directions, zero reopening (PO's S55 churn-halt held).
- Volta+Brunel verified configs PASS (a/b/c): both configs on disk under `teams/framework-research/poc/ghost-bridge/`; live courier on explicit config, stays up; wrapper defaults to `.auto.json` behind V4 guard; plain start loads explicit (can't crash).
- Finding (d): auto.json was committed in S55 `0882b86` (contradicts Direction #4). Ruled (b) untrack+gitignore (conformance, secret-free, NOT security). Brunel added `.gitignore:11`; committed `727a16a`.
- Hopper cleared S55 read-back -> Cal advanced `decisions/courier-must-runtime-discover-team-name` PARTIAL->CONFIRMED (wiki 152, 8 confirmed / 0 partial; no open stage-2 gates team-wide).

### NEXT-SESSION BOOT (re-orient instructions for S57)

1. Read `startup.md` first -- **NOTE: on disk it is now the NEW 2.1.178+ version** (Step 2' Discover, NO TeamDelete; 4-phase shutdown). Correct **iff** the npm flip to 2.1.181 happened. **If the flip did NOT happen and you booted on 2.1.177**, the new startup.md lacks the TeamDelete reset -- either apply `TeamDelete` manually at Step 2 (gotcha #4) OR `git checkout 309dcd8^ -- teams/framework-research/startup.md` to restore the 2.1.177 version for that boot.
2. Pull `mitselek-ai-teams`.
3. **RESOLVE THE OPEN PO DECISION FIRST** (autoupdater vs pin) if not already settled post-S56 -- it gates the npm step.
4. Don't pre-spawn. Migration team = Brunel + Herald + Volta + Hopper (+ Cal). Confirm with PO.
5. **If flip done (booted on 2.1.181):** the boot ITSELF is the live validation -- watch Step 2' Discover (`--resolve-team-dir`) + Step 2.5 courier restart (`.auto.json` behind V4 guard) run clean. Confirm courier stays up + inboxes restore. Report PASS/FAIL per surface; if clean, close #86 migration milestone.
6. **If flip NOT done:** hold, re-offer the runbook once the autoupdater decision lands.
7. Empirical ground truth = `docs/migration-validation-probe-findings-2026-06-18.md` (V1-V5). Reusable harness = `designs/new/migration-probe-harness/`.

### Standing watch items going into S57

- **CUT THE CHURN** (memory `feedback_cut_coordination_churn`): S56 brief landed with zero reopening -- keep that discipline; declare DONE once the load-bearing thing is validated.
- **GitHub #86** = migration tracking issue. **#75/#76** + teamless-courier RfC remain open, lower priority.
- Tasks #9 (P6 re-test, deferred) + #11 (courier restart integration, design-done) carry forward.
- Cal wiki 152 entries; nearest TTL expiries 2026-09-17/18 (teams-substrate-2.1.179 / no-teamdelete-stale-dirs / sessions-pid-not-gc).
- apex unchanged; comms-dev may chime on the 2.1.178 findings.

(*FR:Aen*)

---
*Earlier sessions pruned per 100-line discipline. S55 = migration design + validation, cutover deferred. S54 = -courier convention + 2.1.179 probe. Full history in git; durable knowledge in `wiki/`.*
