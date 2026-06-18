---

# Volta scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S58 (2026-06-18) CLOSED. Live re-validation on 2.1.181/Windows PASSES; S57's "Step 2' fails" was a COLD-START FALSE NEGATIVE (probed inside the V4 window before `sessions/<pid>.json` existed). My S58 work all landed single-pass, single-writer on startup.md. I still do NOT touch git -- Aen owns commit/flip.
- **Bug A DONE (task #1):** startup.md courier step RENAMED+MOVED Step 2.5 -> **Step 3.5**, now runs AFTER Step 3 (restore). Order is Step 2' Discover -> Step 3 Restore -> Step 3.5 Courier -> Step 4 Spawn. Added Ordering note (both fixes + restore-before-poll bonus); fixed all internal "Step 2.5" cross-refs; updated topics/06 "New sequence" line + Phase 2.5 amendment.
- **Bug A(b) co-signed (task #2, Brunel):** `validate_startup` now self-`mkdir(parents=True,exist_ok=True)`s its resolved `inboxes_dir` (matching sibling state/spool/inject dirs at stationmaster-courier.py:1109-1111). That is the CLASS fix (any boot order/caller); my reorder is the runbook belt-and-suspenders.
- **Bug C residue CLOSED (Aen ruled option 1):** amended Step 3.5 stale "stays UP / explicit untouched" prose into a tight CLI-version-SPLIT note -- 2.1.177=explicit static path MAY stay up = rollback baseline; 2.1.178+=PER-SESSION reap-then-restart (stop kills+drains+releases lock vs launched `-Config` .auto.json, then start re-resolves live `session-<id>` + acquires); property tagged RETIRED on 2.1.178+. Aligned to Direction #4 amendment + Herald rotation-teardown contract §3. Grep-clean.
- **Herald's cold-start false-negative sentence APPLIED (supports task #5):** folded verbatim into startup.md "Cold-start window note" block (startup.md:136, attributed *FR:Herald*) -- "probe returning nothing within ~25s of cold start must AWAIT/RETRY before reporting absence -- never conclude lazy-create." Confirmed to Herald.
- **F2 read-back DONE (Cal stage-2):** read `wiki/gotchas/courier-restart-needs-inboxes-dir-step25-before-step3.md` in full, CONFIRMED cause faithful + distinction-from-stale-pidfile correct (separate gotcha, not a fold); flagged both fixes landed S58 so Cal can flip status active->resolved. My read-back advances the Stage-2-Confirms gate.
- **Carry-forward (NON-BLOCKING):** OQ10 stale `session-<id>` dir sweep (Brunel/Volta joint, task #3 Bug B territory); OQ11 P6 attached-pane proactive-wake re-test (RfC task #9); Bug C at-scale OPEN/RfC (single-point Config-load resolution not self-healing; at N teams needs periodic re-resolution or per-delivery liveness check -- Herald task #5).

---
## Session transcript (prune beyond line 100)

## S58 -- Bug A reorder + Bug C residue + Herald sentence (2026-06-18) [single-pass, single-writer on startup.md]

[CHECKPOINT 2026-06-18] Booted on 2.1.181/Windows. Aen confirmed S57's halt = cold-start false negative; migration PASSES live. My assigned Bug A (runbook order): courier Step 2.5 needs `session-<id>/inboxes/` which Step 3 (`restore-inboxes.sh:78` `mkdir -p`) creates AFTER 2.5 -> dependency backwards. Root cause confirmed on disk: `validate_startup` (stationmaster-courier.py:1107-1108) raises on missing `inboxes_dir`; it self-creates state/spool/inject (1109-1111) but NOT inboxes -- the lone non-self-created precondition.

[DECISION 2026-06-18 -- Aen] Do BOTH fixes split by file-ownership: (a) Volta reorders startup.md (Step 3 before courier) + topics/06 note; (b) Brunel self-mkdirs in validate_startup, Volta co-signs. Single-writer on startup.md this round -- I held the edit until Herald's one sentence arrived, then applied everything in ONE pass.

[CHECKPOINT 2026-06-18] Applied: startup.md reorder (2.5->3.5 after Step 3) + Ordering note + cross-ref fixes + Herald's cold-start sentence (startup.md:136); topics/06 "New sequence" corrected + Phase 2.5 Bug A note. Then flagged Bug C residue (Step 3.5 "stays UP" prose stale per S58 Direction #4 amendment) as MY-file/single-writer issue -> Aen ruled option 1 -> amended in same pass as a version-split note. Grep-verified no remaining unscoped "stays UP/untouched" claims.

[LEARNED 2026-06-18] **Single-writer discipline + flag-before-edit worked cleanly.** I held startup.md until Herald's sentence was in hand (no premature edit), applied reorder+sentence+Bug-C-residue in one coherent pass, and surfaced the Bug C overlap as Aen's call rather than silently rewriting another bug-owner's content -- Aen routed it through me (single writer) so no two agents touched startup.md. Continuation of the S55->S56 lesson: surface finding + crisp options, then STOP.

[LEARNED 2026-06-18] **Validator asymmetry is a smell.** Bug A's real root cause wasn't just runbook order -- it was that `validate_startup` self-created every dir EXCEPT inboxes. The class fix (b) is to make the validator consistent (self-mkdir inboxes too), which removes the ordering coupling for ANY caller, not just our runbook. Reorder (a) alone would have left the latent bug for out-of-runbook courier launches.

(*FR:Volta*)

---

## S56 -- migration cutover: pre-flip courier-config verification (2026-06-18) [condensed]

[CHECKPOINT] S56 = CUTOVER. Verify-only (git is Aen's). All PASS: both configs on disk (explicit gitignored + `.auto.json`); wrapper `-Config` defaults `.auto.json`; V4 pre-flight dry-run guard aborts before touching live courier; plain `start-fr-courier.ps1` defaults explicit (can't crash). WS2 lifecycle CUT OVER on main @309dcd8; CLI unpinned 2.1.177->2.1.181.

[DECISION -- Aen] auto.json was git-TRACKED (0882b86), diverging from Direction #4. I flagged (not security -- auto.json holds no secrets; explicit config holds the real ssh_target). Aen RULED (b) untrack+gitignore (727a16a).

[LEARNED] Verify-discipline + flag-as-owner's-call kept S56 churn-free vs S55's over-churn HALT. Surface finding + crisp options, then STOP.

---

## S55 -- WS2 lifecycle-rework application (2026-06-18) [condensed; full work on main @309dcd8]

[CHECKPOINT] Applied Herald's WS2 design to 4 files: startup.md (Implicit-teams block, Step 0.5 auto-config, Step 2'->Discover, Step 2.5 courier-restart, S5 DELETED 5->4 phase, gotchas #3/#4 historical + #5); topic-06 amendment banners; restore/persist-inboxes.sh runtime-discover (`--session-pid $PPID` + `FR_COURIER_TEAM_DIR_NAME`->`--team-dir-name` bridge, fail-closed). MULTI-DIR is the NORM (11 dirs on box) -> always pass a disambiguator. Shim contract verified vs merged courier. Halted by PO at commit gate for over-churn; committed S56.

(*FR:Volta*)
