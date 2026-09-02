---

# Volta scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S71 (2026-09-02) CLOSED. **startup.md heal SHIPPED** -- PR #114 squash-merged as `a239c01`. Runbook 30771 B/279 lines -> **13670 B on main / 200 lines** (13470 B as authored with LF; main's working copy is CRLF, hence +200 B -- not a discrepancy). History lives in `docs/startup-rationale.md` (16667 B). Both user-level skill files updated by Aen with my step list. Worktree removed, branch merged.
- **Active items:** none. Next session starts from the healed runbook: **Step 0 host check is mine to have designed but the team-lead's to run** -- if `claude --version` has moved past 2.1.258, the `Last validated CLI` line in startup.md needs updating at that session's end.
- **Key decisions this session:** (1) **Fixed the scripts in this PR** rather than deferring -- one line each, `--session-pid "${FR_COURIER_SESSION_PID:-$PPID}"`, verified non-regressive with the env unset. (2) Runbook keeps `FR_COURIER_TEAM_DIR_NAME="$SLUG"` as the PRIMARY disambiguator anyway: version-independent, needs no working pid, proven twice. (3) Deleted the Step 3.5 v1/v2 bare-liveness branch outright -- two live sessions is the measured norm, and that precondition already fired unnoticed once. (4) Added **Step 0 host check with a named owner and moment** -- the corrective for `precondition-without-an-owner`, which prose alone cannot supply.
- **Carry-forward (owners assigned at S71 close):** **[DEFECT -> BRUNEL]** courier never logs its resolved `inboxes_dir`; the wrapper's `pre-flight OK: would resolve to <path>` line is the only evidence of correct binding. Recorded in `docs/startup-rationale.md` open-defects list, item 2. **[DEFECT -> TEAM-LEAD]** `sanitize-inboxes` skill's `configs[0]` picks the wrong team on a multi-dir box; user-level skill file, outside the repo, so not mine to patch. Rationale doc item 3. **[UNFILED, hold]** 3 S67 Protocol-A candidates; 3 read-backs owed to Cal. **[DEFERRED]** OQ10 sweep hard precondition (no sweep on a host with unaccountable live bg sessions); OQ11 residue; version-drift tripwire -- **partially discharged**: Step 0 is now the owner+moment for CLI drift, but only for the startup path, not for the courier-hints/skill surfaces.

---
## Session transcript (prune beyond line 100)

## S71 -- startup.md heal DELIVERED (2026-09-02), PR #114

### Shipped
- `teams/framework-research/startup.md` -- 13470 B / 200 lines (44% of original). Executable only. **Step names frozen** (0.5, 1, 2', 3, 3.5, 4; S1-S4) -- wiki cites them.
- `teams/framework-research/docs/startup-rationale.md` -- NEW, 16667 B. Implicit-teams rework, gotchas #3/#4 (historical), retired 2.1.177 bridge, Step 0.5 + Step 3.5 design history, S5 deletion, probe cites (P3/P4/P6/V3/V4 + S57 halt), closed cutover notes, open-defect list. **Records that line-number cites decay** (existing wiki cites `:142/:162/:193` already wrong) and that step NAMES are the stable ids.
- `restore-inboxes.sh` + `persist-inboxes.sh` -- one line each + corrected bridge-era comment/error text.

### New/changed step content
- **Step 0 (NEW) Host check** -- `claude --version` vs a `Last validated CLI: 2.1.258` line in the file, plus python3/pwsh/live-session count. Owner = team-lead, moment = now. This is the overdue version-actual trigger.
- **Step 0.5** -- config.json has NO `model` key for team-lead, so compare parent model (system prompt / `/context`) to `roster members[0].model` directly; roster per-specialist pins are documentation-only (Agent enum `sonnet|opus|haiku|fable`).
- **Step 2'** -- derive CLAUDE_PID from `~/.claude/sessions/*.json` matched on `cwd`; never `$PPID`.
- **Step 3.5** -- `-SessionPid` unconditional + `run_in_background`; verify on the wrapper's `pre-flight OK: would resolve to <path>` line, NOT the daemon log.
- **S4** -- stop+drain courier FIRST, then persist, then commit.

### Verified this session (CLI 2.1.258)
FR pid **26376** (repo cwd) / home-dir session **8496** -> 2 live; 23 team dirs total; bare resolver = ambiguous rc=1; `--session-pid 26376` -> `session-1e8d8ae9` rc=0. Fixed expression: env set -> resolves; env unset -> identical to before. `bash -n` clean both. Fail-closed test with a bogus slug -> rc=1, refuses to write. **Did NOT run restore end-to-end** -- it would overwrite live runtime inboxes mid-session with agents active; changed line verified in isolation instead.

### Corrected step list for the stale skill files (Aen to paste)
Startup: **Step 0** Host check -> **Step 0.5** Parent model vs roster -> **Step 1** Sync -> **Step 2'** Discover -> **Step 3** Restore inboxes -> **Step 3.5** Restart courier -> **Step 4** Spawn.
Shutdown: **S1** Halt -> **S2** Scratchpad + snapshot + requests -> **S3** Collect -> **S4** Stop courier + persist + commit. (Four phases; there is no S5.)

[LEARNED] A 30 KB doc silently crossed the tool's output cap and nobody noticed until the reader was the one who needed it. Size is a correctness property of a runbook, not a style preference -- the split is the fix, and the rationale doc is where growth is allowed to happen.

(*FR:Volta*)

---

## S67 -- Group 2 TTL semantics (2026-08-31) [condensed; full verdicts in operations-log-2026-08]
6 entries verdicted (anchor MIXED; hook-wake ALL CONFIRMED + safety defect: `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` does NOT bound `additionalContext` self-wake, `asyncRewake` boundedness URGENT-OPEN, in-hook counter is the PRIMARY stop; stale-dirs REVISED to ungraceful-exit-only; cold-start CONFIRMED but keep interactive width; `sessions-pid-json` half-refuted, warning STRONGER; courier-inboxes-dir hold active). **OQ10 sweep hard precondition:** bg sessions' dirs are named from `leadSessionId` not the registry `sessionId` -- a sweep may not run on a host with unaccountable live bg sessions. Wake row refuted at 2.1.251, resolution (a) confirmed. 3 Protocol-A sent+ruled, filing HELD by PO; 3 candidates unfiled (stated-guarantee->checked-precondition pattern; slug-width hardcoded twice `:1122/:1136`; born-wrong audit needs surviving evidence). [LEARNED] a person-attached self-check is uncountable -- move the checker to an instrument or a cross-audit; "an eliminated confound is not an identified cause" (Hopper).

## S58 / S56 / S55 (2026-06-18) [condensed; main @309dcd8, ef96665]
Bug A: courier Step 2.5 -> 3.5 (after restore) + `validate_startup` self-mkdir (Brunel). WS2 cutover 2.1.177->2.1.181: implicit teams, Step 2' Discover, S5 deleted (4-phase). MULTI-DIR is the NORM -> always pass a disambiguator. [LEARNED] single-writer + flag-before-edit; validator asymmetry is a smell.

(*FR:Volta*)
