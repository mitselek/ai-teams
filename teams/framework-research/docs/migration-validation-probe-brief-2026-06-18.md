# 2.1.178+ Migration-Validation Probe -- Brief (single spin-up, validates the whole unpin)

(*FR:Brunel*) -- 2026-06-18, S55. WS3a of issue #86 (Task #4). Co-authored: Brunel (probe design + V1/V2 resolver checks + V3 substrate-gap) and Herald (V2 lifecycle call-shape + V4 write-order, his WS2 OQ2). **SCOPE + BRIEF ONLY. No build, no run, no Hopper dispatch.** Execution gated on team-lead spawning Hopper and PO auth-go (same gates as the S54 probe).

## 0. Purpose -- ONE container spin-up validates the entire migration

The S54 probe (`teams-migration-probe-findings-2026-06-17.md`, P1-P6) established the substrate FACTS: team dir = `session-<id>`, name discoverable, members[]-injection + inbox-write-wake survive. WS1 (Brunel) and WS2 (Herald) then DESIGNED the remediation against those facts. **This probe validates the designs against a live substrate before the unpin** -- it is the last gate before WS3 (unpin off 2.1.177). Per team-lead (2026-06-18): ONE throwaway spin-up exercises all five checks rather than spinning the WARP host up twice.

**VERSION PIN (PO-decided 2026-06-18 -- load-bearing): the unpin-target is `2.1.181`.** Hopper's npm dist-tag query surfaced that the literal `stable` tag (2.1.170) is BELOW the 2.1.178+ floor while `latest`=`next`=2.1.181 clears it; "latest stable 2.1.178+" was self-contradictory, and the PO resolved it to **2.1.181** (the `latest` release). `CLAUDE_VERSION=2.1.181` for the harness build; the probe runs on 2.1.181; the findings env table records `claude --version` == 2.1.181. The invariant holds: `probe-validated-version == unpin-target-version == 2.1.181`. S54 proved P1-P6 on 2.1.179; 2.1.181 is newer, so **V5** (P4 members[]-injection + P6 external-write-wake regression) + the resolver checks on 2.1.181 directly de-risk the 2.1.179->2.1.181 inter-version gap. Hopper re-queries dist-tags on the rc host at build to confirm 2.1.181 is still current; the Dockerfile asserts installed==requested.

This brief is a sibling of the S54 scope doc (`teams-migration-probe-container-scope-2026-06-17.md`); the **container recipe, auth, drive mechanism, and isolation discipline are REUSED UNCHANGED** from it (Section 4). Only the probe set is new. S54 probes were `P1-P6` (substrate discovery); these are `V1-V5` (design validation) to keep the numbering unambiguous in the findings record.

## 1. The five validation checks

| # | Check | Validates | Owner |
|---|---|---|---|
| **V1** | Resolver config-glob path (courier, `session_pid=None`) | WS1 §3/§5 -- the detached courier resolves the live `session-<id>` via glob, and `--once` round-trips through the discovered inboxes dir | Brunel |
| **V2** | Resolver pid-keyed path (lifecycle, `session_pid=<live>`) | WS2 §3/§4.2 -- the in-session caller resolves deterministically; pid tiebreaker fires in the multi-dir case; single-dir defensive self-confirm | Herald + Brunel |
| **V3** | `sessions/<pid>.json` GC-on-exit | WS1 OQ3 / WS2 OQ2 -- the liveness filter's correctness: does a dead session's entry linger, and with what status? | Brunel |
| **V4** | `sessions/<pid>.json` write-order vs early discovery | WS2 §8 row 3 / OQ2 -- the startup race: is the registry written before/after `config.json`; can a startup discovery run before the pid entry exists? | Herald |
| **V5** | P4 (members[]-injection) + P6 (external-write-wake) regression on the UNPIN-TARGET version | Herald req D / team-lead 2026-06-18 -- the two courier-critical primitives V1-V4 do NOT exercise: ghost-courier `members[]` registration (P4) and external inbox-write wake of a bare session (P6). S54 proved these on 2.1.179; V5 re-confirms them on the EXACT version we unpin to, closing the probe-validated-version == unpin-target-version invariant. | Herald + Brunel |

**Staging decision (team-lead, 2026-06-18 -- DECIDED):** V1 and V2 exercise `resolve_team_dir` + the `--resolve-team-dir` CLI shim. That code is a proposed patch into `stationmaster-courier.py` (Herald's file) and does not yet exist on disk. **The probe stages a standalone reference `resolve_team_dir.py` (Appendix A -- the WS1 §5 function verbatim + a `__main__` shim).** This validates the resolver LOGIC without blocking on the patch sequencing; the container is throwaway; and the back-compat `"auto"` sentinel means the real integration into `stationmaster-courier.py` (sequenced Brunel->Herald per WS1 §6.1) lands before the unpin regardless. V3/V4 need no courier code -- they probe the substrate directly. The real patch integration is a SEPARATE post-probe step, NOT part of this probe.

## 2. V1 -- resolver config-glob path (courier, detached)

**Question:** on a live 2.1.179 session, does `resolve_team_dir(claude_home, session_pid=None)` (the courier's call) return the correct live `session-<id>/` dir via the glob-canonical path, and does a courier `--once` cycle then round-trip through `<that-dir>/inboxes/`?

**Setup:** one live tmux Claude session (the S54 drive method). Stage the reference resolver (Appendix A) + a minimal courier `--once` config pointing `inboxes_dir: "auto"` (the WS1 §6.3 sentinel), `state_dir` on the same volume.

**Drive / observe (over SSH, no Claude-session round-trip needed for the FS checks):**
```
# V1a -- single-dir glob resolves:
ssh <conn> "python3 resolve_team_dir.py"                 # the --resolve-team-dir shim
  EXPECT: prints exactly one ~/.claude/teams/session-<id> path, exit 0.
ssh <conn> "ls -d ~/.claude/teams/*/"                    # cross-check: exactly one dir
  EXPECT: the printed path == the only teams/ dir.

# V1b -- courier --once round-trips through the discovered dir:
#   write a test entry into the discovered outbox, run --once, confirm it consumed
#   from <discovered>/inboxes/<outbox>.json (NOT a hardcoded framework-research path).
ssh <conn> "python3 fr-courier-daemon.py --config fr-courier.config.json --once"
  EXPECT: log line shows inboxes_dir resolved to teams/session-<id>/inboxes (NOT framework-research);
          validate_startup passes (the discovered dir exists); no 'inboxes_dir does not exist' error.
```
**PASS:** the shim prints the live `session-<id>` dir; `--once` resolves `inboxes_dir` to that discovered dir and validates cleanly. **FAIL/RISK:** shim errors on a single live dir, OR `--once` still looks for `framework-research`.

## 3. V2 -- resolver pid-keyed path (lifecycle, in-session)

**Question (Herald's call-shape):** does the in-session caller, passing `session_pid=<live session pid>`, resolve deterministically -- AND in the multi-dir case (stale leftover present), does the pid tiebreaker correctly select the LIVE dir over the stale one?

**Setup:** the same live session, PLUS a **planted stale dir** to force the multi-dir disambiguation: copy the live `teams/session-<id>/` to a fake `teams/session-deadbeef/` with a `config.json` whose `.name` = `session-deadbeef` and a `leadSessionId` that matches NO live `sessions/<pid>.json`. This simulates the WS2 §6 stale-leftover hazard.

**Drive / observe:**
```
# V2a -- in-session pid-keyed self-lookup (single live dir + planted stale):
LIVE_PID=$(ssh <conn> "pgrep -f 'claude' | head -1")     # the session pid lifecycle would pass
ssh <conn> "python3 resolve_team_dir.py --session-pid $LIVE_PID"
  EXPECT: returns the LIVE session-<id> dir, NOT session-deadbeef. exit 0.

# V2b -- glob-only (no pid) falls to liveness filter and still drops the stale dir:
ssh <conn> "python3 resolve_team_dir.py"                 # courier path, no pid
  EXPECT: liveness filter drops session-deadbeef (no live sessions/<pid>.json backing) ->
          returns the live dir. (This is the V3-dependent path -- see note.)

# V2c -- defensive single-dir self-confirm (Aen's hardening note):
#   remove the planted stale dir, leave one live dir, pass the live pid:
ssh <conn> "python3 resolve_team_dir.py --session-pid $LIVE_PID"
  EXPECT: still returns the one dir; if the pid's session-<id> does NOT match the single dir,
          the resolver should WARN (self-confirm mismatch) rather than blindly returning.
```
**PASS:** V2a selects the live dir via pid; V2b drops the stale dir via liveness; V2c self-confirms. **FAIL/RISK:** pid tiebreaker picks the stale dir, OR liveness filter can't distinguish (-> that's actually a V3 finding, see below).

**Note the V2b<->V3 coupling:** V2b's liveness filter can only drop `session-deabeef` if a dead/absent `sessions/<pid>.json` reads as not-live. If V3 finds that dead entries LINGER with a live-looking status, V2b will fail-fast instead (operator-override path) -- which is the SAFE degradation, not a bug. Run V3 first; it tells us whether V2b's liveness path is load-bearing or whether we lean on pid+override.

## 4. V3 -- `sessions/<pid>.json` GC-on-exit (the one substrate-fact gap)

**Question (the single unresolved substrate fact under the whole discovery design):** when a Claude session exits (graceful AND ungraceful), does its `sessions/<pid>.json` entry get removed, linger with a dead/exited status, or linger with a stale live-looking status?

**Setup:** two sessions, so we can kill one and observe its registry entry while the other (the observer) stays up.

**Drive / observe (pure substrate, no courier code):**
```
# V3 baseline -- capture the live entry shape:
ssh <conn> "cat ~/.claude/sessions/*.json | jq -c '{pid,sessionId,status}'"
  Record each live session's pid/sessionId/status.

# V3a -- GRACEFUL exit (the session /exits or its tmux pane is closed cleanly):
#   note the victim pid first, exit it, then re-observe:
ssh <conn> "ls ~/.claude/sessions/ ; echo VICTIM=$VICTIM_PID"
# (operator) cleanly exit the victim session
ssh <conn> "ls ~/.claude/sessions/ ; cat ~/.claude/sessions/$VICTIM_PID.json 2>/dev/null | jq -c '{pid,status}'"
  RECORD: is $VICTIM_PID.json GONE, or present? if present, what status?

# V3b -- UNGRACEFUL exit (kill -9 the session process, simulating crash/sleep):
ssh <conn> "kill -9 $VICTIM_PID2"
ssh <conn> "ls ~/.claude/sessions/ ; cat ~/.claude/sessions/$VICTIM_PID2.json 2>/dev/null | jq -c '{pid,status}'"
  RECORD: same question -- removed / dead-status / stale-live-status?
```

> **⚠ LOAD-BEARING CAPTURE (team-lead-flagged 2026-06-18):** if the entry LINGERS, **record the EXACT `status` string verbatim** (e.g. is it `"dead"`, `"exited"`, `"stopped"`, `"closed"`, something else, or unchanged-`"idle"`?). The WS1 resolver's liveness filter currently keys on a GUESSED allowlist (`dead`/`exited`/`stopped`, Appendix A `_has_live_session`) -- that guess MUST be replaced by whatever V3 actually reveals before the real `stationmaster-courier.py` integration. Capture the full `sessions/<pid>.json` body of the dead entry, not just the status field, in case GC behavior is encoded elsewhere (e.g. a missing field, a timestamp, a separate liveness marker). This is the single most decision-relevant string in the whole probe.

**The finding drives the design:**
- **Entry removed on exit** -> the liveness filter is trivially correct (absence == dead). WS1/WS2 liveness path is robust.
- **Entry lingers with dead/exited `status`** -> liveness filter reads `status` to drop it. Robust, but the filter MUST key on status not mere presence. (Confirm the exact dead-status string for the WS1 implementation.)
- **Entry lingers with a stale LIVE-looking status** (worst case) -> liveness filter CANNOT distinguish dead from live by `sessions/` alone. Then the stale-dir disambiguation degrades to pid-tiebreaker (lifecycle has it) or operator `team_dir_name` override (courier). SAFE (fail-fast, never mis-selects) but means V2b's liveness path is NOT load-bearing and the WS2 §6 sweep becomes more important. **This is the finding that hardens or weakens the liveness filter** -- it is the single most decision-relevant output of the whole probe.

## 5. V4 -- `sessions/<pid>.json` write-order vs early-startup discovery (Herald's OQ2)

**Question (Herald):** in the session-start sequence, is `sessions/<pid>.json` written BEFORE or AFTER `teams/<slug>/config.json`? Can a startup discovery step (Herald's Step 2') run in the window after the session is alive but before its registry entry exists -- and would that break pid-keyed lookup?

**Setup:** instrument the cold-start. The cleanest observable is write-order on a fresh session against an empty `~/.claude`.

**Drive / observe:**
```
# V4 -- watch both paths appear on a cold session start.
#   Start from an empty ~/.claude (throwaway volume, pre-login state captured),
#   then launch the session and poll both paths at fine granularity:
ssh <conn> "while true; do
    C=\$(ls ~/.claude/teams/*/config.json 2>/dev/null | head -1)
    S=\$(ls ~/.claude/sessions/*.json 2>/dev/null | head -1)
    echo \"\$(date +%s.%N) config=\${C:+Y} sessions=\${S:+Y}\"
    [ -n \"\$C\" ] && [ -n \"\$S\" ] && break
  done" &
# (operator) launch the session in the tmux pane; the poller records which appears first.
```
**The finding drives the design:**
- **config.json first, sessions/<pid>.json after** -> there IS a window where a startup discovery (glob) sees the team dir but NO pid entry. In that window: single-dir glob still works (no pid needed); multi-dir + no-pid-entry-yet -> fail-fast (safe, retry). Herald's Step 2' should either (i) wait for the pid entry if it intends to pass `session_pid`, or (ii) rely on single-dir glob and accept fail-fast-then-retry in the rare multi-dir-cold-start case.
- **sessions/<pid>.json first (or same cycle)** -> no window; pid is available whenever the team dir is. Herald's pid tiebreaker is always usable at Step 2'. Simpler.

**PASS criterion:** the ORDER is determined and recorded (this is a measurement, not a pass/fail). The design adjustment (wait-for-pid vs accept-retry in Step 2') is then a one-line note Herald folds into WS2 §4.2.

## 5b. V5 -- P4 + P6 regression on the unpin-target version (Herald req D / team-lead)

**Why V5 exists:** V1-V4 exercise the resolver and (via the courier `--once` round-trip in V1) the P5-adjacent delivery path -- but they do NOT exercise **P4 (members[]-injection)**, which is the mechanism the courier's ghost-outbox registration depends on, nor do they re-confirm **P6 (external inbox-write wakes a bare session)** on the unpin-target version. S54 proved both on 2.1.179. If the unpin-target version is newer than 2.1.179, those two load-bearing primitives are uncharacterized on the version we actually adopt. V5 closes that gap cheaply (both were run in S54; Hopper knows the moves) and makes this single probe validate the WHOLE migration on the precise unpin-target version.

**Runs alongside V1/V2** -- same live session, no extra spin-up. Sequence it after V1 (which already has the courier config + a live session up).

**Drive / observe (the S54 P4 + P6 moves, re-run on the target version):**
```
# V5a -- P4 members[]-injection (ghost-courier registration):
#   externally append a ghost member to the live session-<id>/config.json members[],
#   then have the lead SendMessage it; confirm the harness routes (writes the ghost inbox).
ssh <conn> "python3 -c \"...append {'name':'ghost-courier',...} to config.json members[]...\""
#   lead SendMessage ghost-courier -> observe:
ssh <conn> "cat ~/.claude/teams/session-*/inboxes/ghost-courier.json"
  EXPECT: SendMessage returns success (no unknown-recipient), ghost-courier.json written = P4 still holds.

# V5b -- P6 external-write wakes a bare session:
#   external process writes a well-formed JSON entry into inboxes/team-lead.json; no nudge.
ssh <conn> "python3 -c \"...append {'from':'probe-ext','text':'V5 wake','type':'message'...} to team-lead.json...\""
ssh <conn> "tmux capture-pane -t probe:0.0 -p | tail -40"   # ~15s later
  EXPECT: idle session proactively wakes + renders the message, inbox drains to [] = P6 still holds.
```
**PASS:** V5a -- members[]-injection routes (ghost inbox written); V5b -- external write proactively wakes the idle session. Both = the courier's injection + delivery primitives survive on the unpin-target version, same as S54 on 2.1.179. **FAIL/RISK:** either primitive regressed between 2.1.179 and the target version -> the cross-team comms layer needs rework before unpin (this is the inter-version gap V5 exists to catch). Note the 2.1.179 inbox `type` field (S54) -- V5b's external write must emit it.

## 6. Reused-unchanged from the S54 scope doc (do NOT re-litigate)

The following are carried VERBATIM from `teams-migration-probe-container-scope-2026-06-17.md` -- they are proven and need no re-decision:

- **Container recipe:** `ubuntu:24.04` + Node 22 + `npm i -g @anthropic-ai/claude-code@<latest-2.1.178+>` + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Reuse `designs/new/teams-migration-probe/` (Dockerfile.probe, docker-compose.probe.yml, entrypoint-probe.sh, README) -- they exist and built clean in S54.
- **Auth:** option (c), fresh `claude login` over tmux (no API key, no creds copy). Probe `~/.claude` starts empty -> own throwaway OAuth token. Apex's seat untouched.
- **Drive:** WARP rc host, `network_mode: host` + WARP CA mount, **no sshd** (avoid colliding apex live :2222), `docker exec` tmux. (Hopper's S54 on-host divergence; same here.)
- **Isolation:** throwaway image + named volume, `docker compose -f docker-compose.probe.yml down -v` teardown, snapshot `~/.claude` to `/tmp/` before teardown for the record. No live-team container touched. OAuth code never printed to logs/chat.
- **Version pin (CHANGED from S54 -- see §0):** **`CLAUDE_VERSION=2.1.181`** (PO-decided unpin-target; S54 was 2.1.179). `npm i -g @anthropic-ai/claude-code@2.1.181`; record the EXACT `claude --version` (== 2.1.181) in the findings environment table. `probe-validated-version == unpin-target-version == 2.1.181` is the invariant V5 protects.

**Deltas from S54:**
1. This probe stages the reference `resolve_team_dir.py` (Appendix A) + `config_resolve_check.py` + a minimal `fr-courier.config.json` with `inboxes_dir: "auto"`. Throwaway, copied in via `docker cp`.
2. **The drive is now a SCRIPTED HARNESS, not ad-hoc `docker exec` (PO scope addition, team-lead 2026-06-18).** The whole build->auth-pause->drive-V1-V5->teardown lifecycle is codified, version-parameterized by `CLAUDE_VERSION`, at [`designs/new/migration-probe-harness/`](../../../designs/new/migration-probe-harness/) (`harness.sh` + `lib/checks.sh` + version-arg Dockerfile/compose + `staging/`). The next pin/unpin cycle re-runs the harness against a new version instead of re-deriving the drive. **Hopper DOGFOODS it** -- running this probe THROUGH the harness both executes V1-V5 AND proves the scripts. The OAuth `claude login` stays a manual PO step (`harness.sh` pauses cleanly for it; the device code is never scripted/logged). Resolver logic + the `inboxes_dir:"auto"` resolution were locally verified against synthetic fixtures (single-dir / multi-dir+stale / no-dir / explicit-path-rollback) before dispatch.

## 7. Sequencing (for team-lead)

1. **Brief drafted + finalized** -> team-lead review (DONE: decision (b) + V5 added 2026-06-18). Herald confirm V2/V4 shapes is Brunel-to-close independently (does not gate dispatch).
2. **Hopper spawned + PO greenlit (BOTH GATES CLEAR 2026-06-18)** -> Brunel ROUTED the §8 dispatch-package to Hopper (10:34; V5 amendment relayed after). Hopper executes per its discipline. Tier R/M.
3. **Stage:** reference resolver (Appendix A) + `inboxes_dir:"auto"` config into the throwaway image, on the unpin-target version (§0 pin).
4. **Run order:** V3 FIRST (tells us whether V2b's liveness path is load-bearing), then V4 (cold-start measurement), then V1 (courier glob), then **V5 (P4+P6 regression -- reuses V1's live session + config)**, then V2 (lifecycle pid + planted stale dir; runs LAST so its planted `session-deadbeef` dir can't confuse V5's P4/P6 checks). Full order: **V3 -> V4 -> V1 -> V5 -> V2.** V3-before-V2 is deliberate (V3's GC finding determines how to read V2b).
5. **Findings doc:** Hopper authors `migration-validation-probe-findings-<date>.md` (sibling of the S54 findings), per-check **V1-V5** results + environment table (incl. the EXACT pinned version) + isolation record. Brunel + Herald read back the design-relevant findings.
6. **Feeds WS3:** the unpin proceeds only if V1+V2+V5 PASS and V3+V4 are characterized (V3/V4 have safe degradations so neither blocks, but both must be KNOWN before the live config flip; V5 PASS confirms the courier primitives survive on the exact unpin-target version).

## 8. Hopper dispatch-package (ROUTED 2026-06-18 10:34 -- both gates cleared)

Per the Pairing-with-Hopper discipline. **Routed** -- both gates cleared (team-lead spawned Hopper + PO greenlit the spin-up). The V5 amendment (team-lead 2026-06-18) was relayed to Hopper after the initial route. Auth = fresh OAuth `claude login` over tmux, PO-performed (same as S54).

- **Tier classification:** **R/M (read-heavy probe + bounded mutations on a throwaway substrate).** Reads: substrate FS introspection (`ls`/`cat`/`jq` against `~/.claude/`). Mutations are all confined to the throwaway container/volume: writing test inbox entries (V1 round-trip, V5 P6 wake), appending a ghost member to config.json members[] (V5 P4), planting a fake `session-deadbeef/` dir (V2), `kill -9` of a probe-internal session (V3b). **No destructive surface on any live artifact** -- no live-team container, no host change beyond the throwaway, no pinned-2.1.177 binary touched. NOT Tier D (nothing destructive that's irreversible against a real artifact). Hopper validates this tier on receipt against a deployed-artifacts read, per its discipline.
- **Recommended operation (RUN IT THROUGH THE HARNESS -- dogfood):** `cd designs/new/migration-probe-harness && CLAUDE_VERSION=<unpin-target> PROBE_SSH_PUBLIC_KEY=... ./harness.sh all`. The harness does build -> up+stage -> AUTH PAUSE (PO does the OAuth login; harness waits) -> drive **V3 -> V4 -> V1 -> V5 -> V2** -> snapshot + `down -v` + `rmi`. Running the probe through the harness BOTH executes V1-V5 AND proves the scripts (the WS3a+ deliverable). If a phase needs debugging, the harness supports per-phase invocation (`./harness.sh build|up|auth|drive|teardown`). Validate the harness's tier/safety on receipt against a read of `harness.sh` + `lib/checks.sh`, per your discipline -- confirm the mutations are throwaway-only before running.
- **Substrate-property reasoning:** the probe validates the WS1/WS2 designs against the live substrate on the EXACT unpin-target version (the `probe-validated-version == unpin-target-version` invariant, §0). V3 is run FIRST because its `sessions/<pid>.json` GC finding determines how V2's liveness path is read (the V2b<->V3 coupling, §3). V5 re-confirms the P4/P6 courier primitives V1-V4 don't exercise. The host-net + WARP-CA + no-sshd + docker-exec drive (§6) is the same isolation envelope S54 proved on this WARP rc host.
- **Expected outcome + verification:** V1 -- shim prints the live `session-<id>` dir, `--once` resolves `inboxes_dir` to it (not `framework-research`). V2 -- pid-tiebreaker selects the live dir over the planted stale dir; self-confirm warns on mismatch. V3 -- the EXACT post-exit `status` string (and full body) of a dead `sessions/<pid>.json` is recorded verbatim (the load-bearing capture, §4 NB). V4 -- the config.json-vs-sessions write-order is recorded. V5 -- members[]-injection routes (P4) + external inbox-write wakes the bare session (P6), both on the unpin-target version. Verification = the findings doc (`migration-validation-probe-findings-<date>.md`) carries per-check V1-V5 results + environment table (incl. exact pinned version) + isolation record; Brunel + Herald read back the design-relevant findings.
- **Reporting:** Hopper executes per its own discipline, reports back to Brunel with the operations-log entry timestamp + outcome. Brunel reports the diagnostic conclusion (does the migration validate?) to Aen; Hopper reports execution outcome + log entry to Aen.

## 9. Open items

- **V3 is the load-bearing unknown.** If GC leaves stale-live-looking entries, the WS2 §6 sweep gets promoted from "out-of-band convenience" to "recommended before multi-session hosts." Flagging so the sweep-ownership OQ (Herald WS2 OQ3) is decided with V3's result in hand.
- **`status` dead-string guess** (Appendix A `_has_live_session`: `dead`/`exited`/`stopped`) -- a placeholder pending V3's verbatim capture; the real `stationmaster-courier.py` integration keys on whatever V3 reveals, not this guess. (Team-lead-flagged; surfaced in the V3 NB.)
- **No new auth/host decisions** -- all reused from S54 (PO auth-go is the only gate, same as S54).

## Appendix A -- reference `resolve_team_dir.py` for the probe (WS1 §5 logic, standalone)

Throwaway standalone copy of the WS1 §5 resolver + a `__main__` shim, so V1/V2 validate the LOGIC without blocking on the patch into Herald's `stationmaster-courier.py`. The real integration is the patch (WS1 §6.2); this is the probe stand-in only.

```python
#!/usr/bin/env python3
# THROWAWAY probe stand-in for WS1 resolve_team_dir (real home = stationmaster-courier.py).
import json, sys, argparse
from pathlib import Path

def discover_by_config_glob(claude_home):
    out = []
    for cfg in sorted(Path(claude_home, "teams").glob("*/config.json")):
        try:
            name = json.loads(cfg.read_text(encoding="utf-8"))["name"]
        except (OSError, json.JSONDecodeError, KeyError):
            continue
        out.append((name, cfg.parent))
    return out

def discover_by_session_pid(claude_home, pid):
    s = Path(claude_home, "sessions", f"{pid}.json")
    try:
        sid = json.loads(s.read_text(encoding="utf-8"))["sessionId"]
    except (OSError, json.JSONDecodeError, KeyError):
        return None
    return f"session-{sid[:8]}"

def _has_live_session(claude_home, team_name):
    for s in Path(claude_home, "sessions").glob("*.json"):
        try:
            d = json.loads(s.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if f"session-{d.get('sessionId','')[:8]}" == team_name \
           and d.get("status") not in ("dead", "exited", "stopped"):
            return True
    return False

def resolve_team_dir(claude_home, *, session_pid=None, explicit_dir_name=None):
    teams_root = Path(claude_home, "teams")
    if explicit_dir_name:
        d = teams_root / explicit_dir_name
        if not d.is_dir():
            raise RuntimeError(f"explicit team_dir_name {explicit_dir_name!r} not found under {teams_root}")
        return d
    candidates = discover_by_config_glob(claude_home)
    if not candidates:
        raise RuntimeError(f"no team dir found under {teams_root}")
    if len(candidates) == 1:
        # defensive single-dir self-confirm (Aen hardening note): warn on pid mismatch.
        if session_pid is not None:
            want = discover_by_session_pid(claude_home, session_pid)
            if want and want != candidates[0][0]:
                sys.stderr.write(f"WARN: single dir {candidates[0][0]} != pid-derived {want}\n")
        return candidates[0][1]
    if session_pid is not None:
        want = discover_by_session_pid(claude_home, session_pid)
        for name, d in candidates:
            if name == want:
                return d
    live = [(n, d) for n, d in candidates if _has_live_session(claude_home, n)]
    if len(live) == 1:
        return live[0][1]
    raise RuntimeError(f"ambiguous: {[n for n,_ in candidates]} (live: {[n for n,_ in live]})")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--claude-home", default="~/.claude")
    ap.add_argument("--session-pid", type=int, default=None)
    ap.add_argument("--team-dir-name", default=None)
    # --name -> bare session-<id> slug (Herald's lifecycle bash contract, T2/T3:
    #   SLUG=$(resolve_team_dir.py --name); default -> full PATH (courier's inboxes_dir base).
    ap.add_argument("--name", action="store_true", help="print bare session-<id> slug, not the full path")
    a = ap.parse_args()
    try:
        d = resolve_team_dir(Path(a.claude_home).expanduser(),
                             session_pid=a.session_pid, explicit_dir_name=a.team_dir_name)
        print(d.name if a.name else d)
    except RuntimeError as e:
        sys.stderr.write(f"{e}\n"); sys.exit(1)
```

> **Shim contract (Herald's T1/T2/T3 lifecycle callers, added 2026-06-18):** `--name` prints the bare `session-<id>` slug to stdout (exit 0; stderr msg + nonzero on no-resolve) so restore/persist bash can `SLUG=$(resolve_team_dir.py --name)`. Default (no `--name`) prints the full team-dir PATH (the courier's `inboxes_dir` base). One resolver, two output shapes -- no behavior change to V1/V2 (which use the default path mode + `--session-pid`).

NB the `status` dead-string allowlist (`dead`, `exited`, `stopped`) in `_has_live_session` is a GUESS pending V3 -- V3 records the actual exit status string, and the real WS1 implementation keys on whatever V3 finds. That coupling is exactly why V3 runs first.

(*FR:Brunel*)
