# 2.1.178+ Migration-Validation Probe -- Findings (V1-V5)

(*FR:Hopper*) -- 2026-06-18, S55, Task #5 / WS3b. Empirical results from running the migration-validation probe **through the scripted harness** (`designs/new/migration-probe-harness/`, dogfood) on a throwaway container pinned to **Claude Code 2.1.181** (the PO-confirmed unpin-target). Brief: [`migration-validation-probe-brief-2026-06-18.md`](migration-validation-probe-brief-2026-06-18.md). Sibling of the S54 P1-P6 findings ([`teams-migration-probe-findings-2026-06-17.md`](teams-migration-probe-findings-2026-06-17.md)).

## Environment

| Field | Value |
|---|---|
| CLI version | `2.1.181 (Claude Code)` -- Dockerfile build-arg asserted `installed==requested`; harness re-verified `claude --version`==2.1.181 in-container |
| Unpin-target invariant | probe-validated-version == unpin-target == **2.1.181** (PO decision; npm `stable`=2.1.170 below the 2.1.178+ floor, `latest`/`next`=2.1.181) |
| Host | rc `100.96.54.170` (WARP), `network_mode: host` + WARP CA mount `/usr/local/share/ca-certificates/managed-warp.pem -> /opt/warp-ca.pem` |
| Auth | option (c) fresh `claude login` (OAuth, PO seat `mihkel.putrinsh@evr.ee` / Claude Team eestiraudtee); team-driven tmux pipeline, PO did the browser auth + returned the code; `.credentials.json` 471B mode 600. OAuth code never logged. |
| Drive | scripted harness `./harness.sh` phase-by-phase (build/up/drive/teardown) via `docker exec` tmux (no SSH-in; entrypoint sshd skipped to avoid colliding with apex live :2222) |
| Live session | pid 81, sessionId `e7b15705-...`, status `idle`, model Opus 4.8 |
| Flag | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (baked in image) |
| Teardown | `docker compose down -v` + `rmi` of the version-tagged leaf image; evidence snapshot at host `/tmp/migration-probe-v1v5-evidence-20260618/` |
| Harness preflight | `phase_preflight` (df -P / >= 90% abort) PASSED at 76% -- the S55-first-run disk-full gate now fail-fast |

## Run note -- two runs this session

- **Run 1 (aborted-mid-execution, 11:55):** the rc host root FS was 100% full -> the auth tmux session could not launch ("No space left on device"). Aborted before auth, torn down clean. PO reclaimed ~13.6G (apt cache + journal); root dropped to 76%. Catalyzed Brunel's `phase_preflight` guard (committed `de2f24e`). Full record: ops-log 2026-06 11:55.
- **Run 2 (this findings doc, 12:13-12:34):** disk clear, full probe executed.

## Verdict summary

| Check | Verdict | One-line |
|---|---|---|
| **V3** (LOAD-BEARING) | **CAPTURED -- worst case** | `sessions/<pid>.json` is **NOT GC'd** on exit; lingers with **`status:"idle"`** (graceful AND kill -9). Status does NOT distinguish dead from live. |
| **V4** | **MEASURED** | `config.json` is written FIRST; `sessions/<pid>.json` appears only when the session reaches interactive-ready. Early-discovery window EXISTS. |
| **V1** | **PASS** (clean-isolated) | resolver glob -> live `session-<id>`; `inboxes_dir:"auto"` -> discovered `<dir>/inboxes`, NOT hardcoded `framework-research`. |
| **V2** | **pid-path PASS; glob-path fail-fast (SAFE)** | pid-keyed resolves the live dir robustly; glob-only liveness path fails-fast on stale idle-looking entries (the predicted V2b<->V3 coupling). |
| **V5a (P4)** | **PASS** | members[]-injection honored; lead `SendMessage` to injected `ghost-courier` wrote `ghost-courier.json`. |
| **V5b (P6)** | **INCONCLUSIVE -- leaning negative, confound named** | external inbox-write did NOT proactively wake a bare idle session within 35-90s across clean attempts; differs from S54 (woke ~15s). Confound: headless docker-exec/send-keys drive, never an attached pane (tmux `focus-events off`). Needs an attached-pane re-test. |

## Per-check detail

### V3 (LOAD-BEARING) -- `sessions/<pid>.json` GC-on-exit: **entries LINGER with `status:"idle"`**

This is the single most decision-relevant output of the probe, and the answer is the brief's **worst case**.

**Captured dead-entry bodies (verbatim):**

Graceful-exit victim (pid 81 baseline shape; same shape persisted post-exit):
```json
{"pid":81,"sessionId":"e7b15705-27a9-450a-aead-f5ea4b774460","cwd":"/home/ai-teams","startedAt":1781774519877,"procStart":"786895978","version":"2.1.181","peerProtocol":1,"kind":"interactive","entrypoint":"cli","status":"idle","updatedAt":1781774519857,"statusUpdatedAt":1781774519857}
```

Kill-9 victim (pid 344 -- process killed, entry STILL PRESENT afterward):
```json
{"pid":344,"sessionId":"b985912e-3186-4d30-90df-4f64e77c45b4","cwd":"/home/ai-teams","startedAt":1781774599170,"procStart":"786952200","version":"2.1.181","peerProtocol":1,"kind":"interactive","entrypoint":"cli","status":"idle","updatedAt":1781774599145,"statusUpdatedAt":1781774599145}
```

**Direct confirmation:** after the kill, `kill -0 344` -> DEAD, but `sessions/344.json` still existed with `status:"idle"` -- identical to the live `sessions/81.json` (`kill -0 81` -> ALIVE, also `status:"idle"`).

**THE FINDING:** `sessions/<pid>.json` is NOT removed on session exit (neither graceful `/exit` nor `kill -9`). The lingering entry keeps `status:"idle"` -- the SAME value a live idle session has. **The `status` field cannot distinguish a dead session from a live one.** There is no `dead`/`exited`/`stopped` status in this substrate.

**Consequence for WS1:** the resolver's `_has_live_session` GUESS allowlist (`status not in ("dead","exited","stopped")`) is **WRONG** -- it will classify a dead idle-lingering session as live. The real liveness check MUST use **process liveness** (`kill -0 <pid>` / `/proc/<pid>` / `os.kill(pid,0)`), keyed on the entry's `pid` field, NOT the `status` string. There is a `procStart` field that could additionally guard against PID reuse (compare to `/proc/<pid>/stat` start-time). Either way: liveness != status. This must land in `stationmaster-courier.py` before the unpin.

### V4 -- write-order config.json vs sessions/<pid>.json: **config FIRST**

Two corroborating observations:
- **Auth-flow observation:** `~/.claude/teams/session-<id>/config.json` was present (eager) through the entire onboarding (theme/login/security/trust prompts) while `~/.claude/sessions/` did NOT exist at all; `sessions/<pid>.json` appeared ONLY once the session reached its interactive-ready prompt.
- **Harness V4 poll:** across a ~300-cycle fine poll on a fresh cold session, `config=Y` from the first observation while `sessions=N` throughout the window -- the new `sessions/<pid>.json` had not appeared by the end of the poll. (The harness `record` verdict was `INCONCLUSIVE` because its `newsess` detection column stayed empty -- a harness poller bug, see Harness defects; but the config-first / sessions-late ordering is unambiguous from the raw timeline + the auth-flow observation.)

**Finding:** `config.json` is written well BEFORE `sessions/<pid>.json`. There IS a startup window where a discovery step sees the team dir but no pid entry. **Design consequence (Herald WS2 Step 2'):** in that window, single-dir glob still works (no pid needed); a multi-dir + no-pid-entry-yet case must fall back to fail-fast-then-retry, or wait-for-pid-entry if it intends to pass `session_pid`. Pid is NOT guaranteed available the instant the team dir is.

### V1 -- resolver config-glob path: **PASS** (verified in a clean-isolated single-dir state)

In the clean single-team-dir state (only the authed `session-e7b15705`):
```
resolve_team_dir.py            -> /home/ai-teams/.claude/teams/session-e7b15705   (rc=0)
config_resolve_check.py        -> AUTO-RESOLVED team_dir=.../session-e7b15705
                                  AUTO-RESOLVED inboxes_dir=.../session-e7b15705/inboxes   (rc=0)
```
The `inboxes_dir:"auto"` sentinel resolved to the discovered `session-<id>/inboxes` -- NOT the hardcoded `framework-research` path. **The resolver design works for the courier (no-pid) path in the clean case.** (Scoped to PATH RESOLUTION, no hub round-trip -- throwaway has no stationmaster, per brief.)

NB: the harness `RESULT V1 FAIL` from the in-sequence run was a **contamination artifact** -- V3/V4 had left stale victim/cold team dirs, putting the resolver in a multi-dir + stale-idle-sessions state where its (broken, status-based) liveness filter could not disambiguate. See V2 + Harness defects.

### V2 -- resolver pid-keyed path: **pid-path PASS; glob-path fail-fast (SAFE), the V2b<->V3 coupling confirmed**

Tested directly against the real multi-dir state left after V3/V4 (3 team dirs: live `e7b15705` pid81-alive; `b985912e` pid344-DEAD-but-idle-lingering; `b4b6d847` no sessions entry):

- **V2a pid-keyed (`--session-pid 81`):** returned `session-e7b15705` rc=0 -- **correctly selected the live dir** by resolving the live pid's sessionId, bypassing the broken status filter. ROBUST.
- **V2b glob-only (no pid):** `ambiguous: [b4b6d847, b985912e, e7b15705] (live: [b985912e, e7b15705])` rc=1. The status-based `_has_live_session` judged 2 of 3 "live" -- but only `e7b15705` is actually alive; `b985912e` (pid 344) is DEAD yet read "live" because its entry lingers `idle`. So the glob-only path **fails-fast (rc=1)** rather than mis-selecting.

**This is exactly the V2b<->V3 coupling the brief predicted:** because V3 found entries linger live-looking, the status-based liveness filter cannot disambiguate, and the glob-only path degrades to fail-fast. That is the SAFE degradation (never mis-selects) -- but it means **the glob-only liveness path is NOT load-bearing as currently written**, and:
1. The lifecycle (pid-keyed) path is the robust one and should be preferred where a pid is available.
2. The courier (no-pid) path needs the liveness filter FIXED to process-liveness (per V3) -- then glob-only becomes load-bearing again.
3. The WS2 stale-dir sweep gets PROMOTED in importance (Herald WS2 OQ3) -- with status-based liveness broken, stale dirs accumulate and only a pid-liveness filter or an explicit sweep clears them.

NB: the harness's in-sequence `RESULT V2 PASS x3` lines are **FALSE PASSES** -- `live_dir` resolved empty (the broken resolver), so `live_slug=""` and the checks compared empty-to-empty; the `session-deadbeef` plant even failed (FileNotFoundError, no source dir). The real V2 result is the direct probe above. See Harness defects.

### V5a (P4) -- members[]-injection / ghost-courier registration: **PASS**

Externally appended `{"name":"ghost-courier",...}` to the authed team's `config.json` `members[]`, then had the lead `SendMessage` `V5-P4-ping` to it. Result: lead reported `SENT`, and `inboxes/ghost-courier.json` received:
```json
[{"from":"team-lead","text":"V5-P4-ping","summary":"Sending ping message to ghost-courier","timestamp":"2026-06-18T09:26:54.434Z","type":"message","read":false}]
```
**Members[]-injection (the ghost-courier registration trick) SURVIVES 2.1.181** -- the courier's externally-injected ghost member still routes. (2.1.181 carries the `type` field, same as 2.1.179.)

### V5b (P6) -- external inbox-write wakes a bare session: **INCONCLUSIVE, leaning negative; confound named**

Tested twice: (1) against the authed lead session, (2) against a FRESH bare-idle session (pid 2782, team `session-8890e9bb`, clean empty prompt, no pending turns). In BOTH, an external write to `inboxes/team-lead.json` did NOT drain and did NOT visibly wake the pane within 35-90s. The entries persisted `read:false`.

**This DIFFERS from my S54 P6 result** (where a bare idle session woke ~15s with no nudge, and the inbox drained to `[]`). Two candidate explanations, NOT disambiguated this run:
1. **Real P6 regression in 2.1.181** -- the proactive external-write-wake no longer fires.
2. **Test-condition confound** -- this run drove the session purely headless via `docker exec` + `tmux send-keys`, NEVER attaching a terminal; the pane reported `focus-events off`. The proactive-wake may depend on a terminal-activity/focus signal that a never-attached headless pane doesn't generate, which S54's drive may have satisfied differently. My in-run `send-keys` nudges also stopped landing on the wedged authed pane, so I could not cleanly establish even nudge-triggered drain.

**Honest verdict:** I will NOT call this a clean pass OR a definitive regression. Per the disprove-your-own-report discipline (which reversed my "P6 inert" mis-read in S54), the responsible characterization is **inconclusive-leaning-negative with the headless-pane/focus-events confound named**. **Recommended resolution:** re-test P6 with an ATTACHED pane (the PO-driven `tmux attach` model can provide this) on 2.1.181, OR instrument the wake mechanism directly. This is the one V-check that did NOT cleanly validate and the one to chase before relying on external-write-wake in the post-unpin courier.

## Harness defects found (dogfood -- check-isolation, NOT design failures)

The harness `build`/`up`/`teardown`/`preflight` phases all dogfooded CLEAN (3.5/5 phases proven on-target across both runs; the 2.1.181 `installed==requested` assert fired correctly). The `drive` phase has two check-isolation defects that contaminated the in-sequence verdicts:

1. **V3/V4 leave their victim/cold session dirs + lingering `sessions/<pid>.json` entries behind**, so the downstream resolver-dependent checks (V1, V5, V2) run against a contaminated multi-dir + stale-idle-sessions state instead of a clean single-dir state. This is WHY the in-sequence V1=FAIL / V5=FAIL / V2=bogus-PASS verdicts are wrong; the true verdicts (above) came from clean-isolated direct re-probes. **Fix:** `phase_drive` should clean up each check's spawned sessions/dirs before the next check, OR run the resolver checks (V1/V2/V5) BEFORE the session-spawning checks (V3/V4), OR snapshot+restore `~/.claude` between checks.
2. **V2's PASS lines are false when `live_dir` resolves empty** (empty==empty comparison), and the `session-deadbeef` plant `cp -r` fails silently when the resolver gives no source dir. **Fix:** V2 must assert `live_dir` non-empty before proceeding, and fail loudly if the plant `cp` fails.
3. **V4 poller `newsess` detection bug:** the `newsess` column stayed empty the whole poll (the new `sessions/<pid>.json` filename diff logic didn't populate), so V4 self-reported INCONCLUSIVE even though the config-first ordering is clear from the raw timeline. **Fix:** the diff against `pre_sessions` needs correcting; also the poll window may be too short for `sessions/` (it lands only at interactive-ready, ~10-25s after launch).

These are WS3a+ harness-hardening items, surfaced to Brunel. None block the substrate findings (which were captured via direct probes).

## Net migration verdict

- **V1 (resolver core) VALIDATES** in the clean case -- runtime team-name discovery via config-glob + `inboxes_dir:"auto"` works; the hardcoded `framework-research` path is correctly avoided. This is the primary migration mechanism and it is sound.
- **V2 pid-keyed path VALIDATES**; the glob-only liveness path needs the V3 fix to be load-bearing.
- **V3 is the load-bearing finding that ADJUSTS the design:** `sessions/<pid>.json` is NOT GC'd and `status` stays `idle` for dead sessions -> the liveness filter MUST switch from the guessed status-allowlist to **process-liveness (`kill -0` on the `pid` field, optionally `procStart`-guarded)**. This is a concrete, known, one-function change before the unpin.
- **V4 measured:** config-first; the early-discovery window is real -> Herald's Step 2' folds the wait-for-pid-or-retry note.
- **V5a (members[]-injection) VALIDATES** on 2.1.181.
- **V5b (external-write-wake) is the one open risk** -- inconclusive-leaning-negative with a named confound; re-test with an attached pane before the unpin relies on it.

**Recommendation for WS3 (unpin):** the resolver design is validated; proceed with the unpin to 2.1.181 ONCE (a) the WS1 liveness filter is changed from status-allowlist to process-liveness (V3-driven, the one must-fix), and (b) V5b/P6 is re-confirmed with an attached-pane test (or the courier is designed to not depend on proactive-wake, falling back to its poll loop). V1/V2-pid/V5a impose no blockers.

## Isolation record

Throwaway image `teams-migration-probe:2.1.181` + named volume, `network_mode: host` + WARP CA. Teardown: `docker compose down -v` + `rmi` of the version-tagged LEAF image (confirmed no other container referenced it -- no cascade). On-host WARP compose edit reverted (committed file untouched -- bridge default is the deliberate portable default; host-net is the WARP-host operational variant). **No live-team container touched; apex-research UP 46h throughout; host :2222 never collided; ANTHROPIC_API_KEY unused; OAuth code never logged.** Evidence snapshot: host `/tmp/migration-probe-v1v5-evidence-20260618/` (sessions jsons, config, ghost-courier.json, team-lead.json, results log). Docker garbage (18.75G reclaimable images) left UNTOUCHED -- cross-team cascade risk, PO/host-owner call.

(*FR:Hopper*)
