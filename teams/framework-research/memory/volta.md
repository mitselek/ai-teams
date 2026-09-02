---

# Volta scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state:** S70 (2026-09-02) closed on PO decision at 15:28. **startup.md heal = NOT STARTED as a deliverable** (zero edits; branch `fr/s70-startup-heal` empty and removed). The **verification pass IS done** and its findings are below -- next session starts at "write", not at "verify".
- **Active items:** **[WIP] startup.md heal** (30771 B / 279 lines -> lean runbook + `docs/startup-rationale.md`). Structure decided, recipes tested (S70 block). Substrate truths a-e verified, with two corrections to the brief (see S70 block, "Corrections").
- **Key decisions this session:** Work in a `git worktree` at a SHORT path (`/c/Users/<u>/AppData/Local/Temp/wt-fr-s70`) -- the scratchpad path fails `git worktree add` (`Could not reset index file`, path length / 8.3 name). Keep step NAMES (Step 2', 3, 3.5, 4; S1-S4) stable -- wiki cites them; line-number cites (`startup.md:142/162/193`) will decay regardless, note that in the rationale doc.
- **Carry-forward:** **[DEFECT, unfiled]** restore/persist scripts pass `--session-pid "$PPID"` EXPLICITLY, and explicit beats the `FR_COURIER_SESSION_PID` env, so with `$PPID`=1 the env pid is IGNORED -> liveness -> 2 live -> ambiguous. Only `FR_COURIER_TEAM_DIR_NAME=$SLUG` works. **[DEFECT, unfiled]** courier never logs `inboxes_dir`; auto config sets `team: framework-research`, which masks the discovered slug in the "courier up" line -> Step 3.5's Verify is unverifiable from the log. **[UNFILED, hold]** 3 S67 Protocol-A candidates; 3 read-backs owed to Cal. **[DEFERRED]** OQ10 sweep precondition; OQ11 residue; version-drift tripwire.

---
## Session transcript (prune beyond line 100)

## S70 -- startup.md heal, verification pass only (2026-09-02) [NOT STARTED as deliverable]

### Verified against the tree (all on CLI 2.1.258, Windows, Bash tool)
- **(a) `$PPID`=1 under the Bash tool.** CONFIRMED (`echo $PPID` -> 1). Resolver with `--session-pid 1` and bare both -> `ambiguous ... (live: ['session-97b61440','session-b65192ba'])` rc=1.
- **(b) two live sessions is the norm.** CONFIRMED: `sessions/30620.json` (ours, busy, cwd=repo) + `8496.json` (idle, cwd=`C:\Users\<u>`), both `claude.exe` alive. Bare auto+liveness is ambiguous -> wrapper needs `-SessionPid`; `stop-fr-courier.ps1` has NO pid param, it inherits `FR_COURIER_SESSION_PID` from env (the daemon's `auto` branch reads it).
- **(c) wrapper hangs the caller.** NOT independently reproduced (no restart run this session). Mechanism from the scripts: `start-fr-courier.ps1` uses `Start-Process -NoNewWindow -PassThru` with stdout/stderr redirected to `fr-courier.log`/`.log.err` -- the daemon child keeps the caller's handles. Remedy: run via `run_in_background` or redirect the WRAPPER's output to a file and read it; the wrapper's `pre-flight OK: would resolve to <path>` line is the only evidence of correct resolution (see defect 2). Put that file under `~/.stationmaster/framework-research/` -- `restart.out` in the ghost-bridge dir is NOT gitignored.
- **(d) CORRECTION to the brief:** `config.json` has NO `model` key at all (`has("model")` = false on every session dir); `jq .model` prints `null` for an absent key, which is what Aen saw. Same consequence: Step 0.5's "parent model is stamped into config" premise is gone; the check must compare parent model (system prompt / `/context`) to `roster members[0].model` directly.
- **(e) courier stopped at S4.** Source = Aen's S69 WRAP only; consistent with the scripts (stop's drain defaults to `.auto.json`, so the drain resolves the live dir -- and with 2 live sessions it TOO needs the pid env). Order at S4: stop+drain FIRST (last inbound lands in `inboxes/`), THEN persist, THEN commit.
- **Gotchas #1/#2/#3/#4 status:** #3/#4 HISTORICAL -> rationale doc. #2 `$HOME` is fine on this box (`/c/Users/<u>`). `python3` AND `python` both on PATH (scoop). `pwsh` 7.6.5 present.
- **Skills:** `~/.claude/skills/framework-research-startup/SKILL.md` still says "Steps 1-5 (Sync -> Diagnose -> Clean -> Create -> Restore)" and next-session says "S1-S5" -- both stale vs the 2.1.178+ file; no repo copy exists (`.claude/skills/` absent). Out of my scope; flag to Aen when the heal lands.

### Tested recipe for the lean Step 2' (paste into the runbook)
```bash
REPO="$(git rev-parse --show-toplevel)"; REPO_WIN="$(cygpath -w "$REPO")"
CLAUDE_PID="$(jq -r --arg cwd "$REPO_WIN" 'select(.kind=="interactive" and .status=="busy" and .cwd==$cwd) | .pid' ~/.claude/sessions/*.json)"
# expect exactly one pid; verify alive: tasklist //FI "PID eq $CLAUDE_PID" //FO CSV //NH | grep -c claude.exe  -> 1
SHIM="$REPO/teams/framework-research/poc/ghost-bridge/stationmaster-courier.py"
SLUG="$(python3 "$SHIM" --resolve-team-dir --name --session-pid "$CLAUDE_PID")"; ls ~/.claude/teams/$SLUG/config.json
```
Measured: `CLAUDE_PID=30620`, `SLUG=session-97b61440`, config present. Then: `FR_COURIER_TEAM_DIR_NAME="$SLUG" bash restore-inboxes.sh` (env does NOT persist across Bash-tool calls -- inline it every call); courier: `pwsh -File restart-fr-courier-with-pid.ps1 -SessionPid $CLAUDE_PID > ~/.stationmaster/framework-research/restart.out 2>&1` in background, then read the file; S4: `FR_COURIER_SESSION_PID=$CLAUDE_PID pwsh -File stop-fr-courier.ps1`, then `FR_COURIER_TEAM_DIR_NAME="$SLUG" bash persist-inboxes.sh`, commit, push.

### Planned shape of the lean file (~8-10 KB)
Anchors+paths table (trimmed) / Substrate facts (5 truths + gotchas #1 #2 #5 compressed) / Read Order / Step 0 Host check (NEW: `claude --version` vs a `Last validated CLI` line in the file, python3, pwsh, `$PPID`, live-session count -- this IS the overdue version-actual trigger, Aen boot items 3+11) / Step 0.5 model check (rewritten per (d)) / Step 1 Sync / Step 2' Discover (recipe above) / Step 3 Restore / Step 3.5 Courier / Step 4 Spawn / S1-S4 with courier stop at S4 / Environment notes. Everything else moves VERBATIM into `docs/startup-rationale.md` (implicit-teams rationale, gotchas #3 #4, probe cites V3/V4/P3/P4/P6, 2.1.177 bridge branches, Direction #4 amendment, S5 deletion rationale, cutover notes) with a pointer line per section. Nothing deleted, only moved.

(*FR:Volta*)

---

## S67 -- Group 2 TTL semantics (2026-08-31) [condensed; full verdicts in operations-log-2026-08]
6 entries verdicted (anchor MIXED; hook-wake ALL CONFIRMED + safety defect: `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` does NOT bound `additionalContext` self-wake, `asyncRewake` boundedness URGENT-OPEN, in-hook counter is the PRIMARY stop; stale-dirs REVISED to ungraceful-exit-only; cold-start CONFIRMED but keep interactive width; `sessions-pid-json` half-refuted, warning STRONGER; courier-inboxes-dir hold active). **OQ10 sweep hard precondition:** bg sessions' dirs are named from `leadSessionId` not the registry `sessionId` -- a sweep may not run on a host with unaccountable live bg sessions. Wake row refuted at 2.1.251, resolution (a) confirmed. 3 Protocol-A sent+ruled, filing HELD by PO; 3 candidates unfiled (stated-guarantee->checked-precondition pattern; slug-width hardcoded twice `:1122/:1136`; born-wrong audit needs surviving evidence). [LEARNED] a person-attached self-check is uncountable -- move the checker to an instrument or a cross-audit; "an eliminated confound is not an identified cause" (Hopper).

## S58 / S56 / S55 (2026-06-18) [condensed; main @309dcd8, ef96665]
Bug A: courier Step 2.5 -> 3.5 (after restore) + `validate_startup` self-mkdir (Brunel). WS2 cutover 2.1.177->2.1.181: implicit teams, Step 2' Discover, S5 deleted (4-phase). MULTI-DIR is the NORM -> always pass a disambiguator. [LEARNED] single-writer + flag-before-edit; validator asymmetry is a smell.

(*FR:Volta*)
