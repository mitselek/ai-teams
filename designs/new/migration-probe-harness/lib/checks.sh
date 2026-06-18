#!/usr/bin/env bash
# checks.sh -- V1-V5 migration-validation checks, deterministic + scripted (*FR:Brunel*)
#
# Sourced by harness.sh. Each check is a function returning 0=PASS, 1=FAIL, 2=MEASURE-ONLY
# (V4 records an ordering, not a pass/fail). Every check appends a structured line to
# $RESULTS_LOG and human detail to stderr. All container interaction is via dx()/dxu()
# (docker exec) so there is NO ssh/tmux quoting fragility -- this is the part S54 left ad-hoc.
#
# Conventions:
#   CID            = container name (teams-migration-probe)
#   CU             = container user (ai-teams)
#   CLAUDE_HOME    = ~/.claude inside the container
#   dx  <cmd...>   = run as root in the container
#   dxu <cmd...>   = run as the ai-teams user in the container
#   tmux_send / tmux_capture = drive the interactive Claude pane (the one human-ish surface,
#                              but scripted: send-keys + capture-pane via docker exec, no ssh)
# These helpers + RESULTS_LOG + record() are defined in harness.sh before this file is sourced.

# --------------------------------------------------------------------------------------
# V3 -- sessions/<pid>.json GC-on-exit (RUN FIRST: its finding tells us how V2b reads).
# THE load-bearing capture. Records the EXACT post-exit status string + full dead-entry body.
# --------------------------------------------------------------------------------------
check_v3_session_gc() {
    log "V3: sessions/<pid>.json GC-on-exit (graceful + kill -9). LOAD-BEARING: capture exact status."

    # Need two live sessions so one can be killed while an observer survives. The harness has
    # already brought up ONE authed session (the auth pane). Spawn a second throwaway session.
    dxu tmux new-session -d -s v3victim "claude" || { record V3 FAIL "could not start victim session"; return 1; }
    sleep 20   # let it register in sessions/

    local victim_pid victim_json
    victim_pid="$(dxu 'ls ~/.claude/sessions/ 2>/dev/null | sed "s/\.json$//" | sort -n | tail -1')"
    if [ -z "$victim_pid" ]; then record V3 FAIL "no sessions/<pid>.json appeared for victim"; return 1; fi
    log "V3: victim pid=$victim_pid; baseline entry:"
    dxu "cat ~/.claude/sessions/${victim_pid}.json" | tee -a "$RESULTS_LOG"

    # -- V3a graceful exit: send /exit to the victim pane, wait, re-observe. --
    tmux_send v3victim "/exit"
    sleep 8
    local after_graceful
    after_graceful="$(dxu "cat ~/.claude/sessions/${victim_pid}.json 2>/dev/null")"
    if [ -z "$after_graceful" ]; then
        record V3 PASS "graceful-exit: sessions/${victim_pid}.json REMOVED (absence==dead; liveness filter trivially correct)"
    else
        local st; st="$(printf '%s' "$after_graceful" | jq -r '.status // "NO_STATUS_FIELD"' 2>/dev/null)"
        record V3 PASS "graceful-exit: entry LINGERS status='${st}' -- FULL BODY: ${after_graceful}"
        log "V3 ** LOAD-BEARING: graceful dead-entry status='${st}'. Real WS1 _has_live_session() must key on this."
    fi

    # -- V3b ungraceful exit: kill -9 a fresh victim, re-observe. --
    dxu tmux new-session -d -s v3victim2 "claude" || { record V3 PARTIAL "v3a done; could not start v3b victim"; return 0; }
    sleep 20
    local vp2; vp2="$(dxu 'ls ~/.claude/sessions/ 2>/dev/null | sed "s/\.json$//" | sort -n | tail -1')"
    dxu "kill -9 ${vp2} 2>/dev/null || true"
    sleep 5
    local after_kill
    after_kill="$(dxu "cat ~/.claude/sessions/${vp2}.json 2>/dev/null")"
    if [ -z "$after_kill" ]; then
        record V3 PASS "kill-9: sessions/${vp2}.json REMOVED"
    else
        local st2; st2="$(printf '%s' "$after_kill" | jq -r '.status // "NO_STATUS_FIELD"' 2>/dev/null)"
        record V3 PASS "kill-9: entry LINGERS status='${st2}' -- FULL BODY: ${after_kill}"
        log "V3 ** LOAD-BEARING: kill-9 dead-entry status='${st2}'. THIS is the crash case the liveness filter must survive."
    fi
    return 0
}

# --------------------------------------------------------------------------------------
# V4 -- sessions/<pid>.json write-order vs config.json on a cold session start (MEASURE-ONLY).
# --------------------------------------------------------------------------------------
check_v4_write_order() {
    log "V4: cold-start write-order config.json vs sessions/<pid>.json (measurement, not pass/fail)."
    # Poll both paths at fine granularity while a fresh session starts. We can't wipe the authed
    # session's ~/.claude (auth lives there), so we observe a NEW session's dirs appearing: a new
    # teams/session-<id>/config.json and a new sessions/<pid>.json. Snapshot the pre-existing set,
    # start a session, and record which NEW path lands first.
    local pre_teams pre_sessions
    pre_teams="$(dxu 'ls ~/.claude/teams 2>/dev/null | sort')"
    pre_sessions="$(dxu 'ls ~/.claude/sessions 2>/dev/null | sort')"

    dxu tmux new-session -d -s v4cold "claude"
    # Tight poll loop INSIDE the container (one docker exec, no per-tick round-trip).
    local order
    order="$(dxu bash -c '
        PRE_T="'"$(printf '%s' "$pre_teams" | tr "\n" "," )"'"
        PRE_S="'"$(printf '%s' "$pre_sessions" | tr "\n" "," )"'"
        for i in $(seq 1 300); do
            NT=""; NS=""
            for d in $(ls ~/.claude/teams 2>/dev/null); do case ",$PRE_T," in *",$d,"*) ;; *) NT="$d";; esac; done
            for f in $(ls ~/.claude/sessions 2>/dev/null); do case ",$PRE_S," in *",$f,"*) ;; *) NS="$f";; esac; done
            CT=""; CS=""
            [ -n "$NT" ] && [ -f ~/.claude/teams/"$NT"/config.json ] && CT=Y
            [ -n "$NS" ] && CS=Y
            if [ -n "$CT" ] || [ -n "$CS" ]; then
                echo "$(date +%s.%N) config=${CT:-N} sessions=${CS:-N} newteam=${NT} newsess=${NS}"
                [ -n "$CT" ] && [ -n "$CS" ] && break
            fi
            sleep 0.1
        done
    ')"
    log "V4 timeline:"; printf '%s\n' "$order" | tee -a "$RESULTS_LOG"
    # Determine first-seen of each (first line where each column flips to Y).
    local first_cfg first_sess
    first_cfg="$(printf '%s\n' "$order" | grep -n 'config=Y' | head -1 | cut -d: -f1)"
    first_sess="$(printf '%s\n' "$order" | grep -n 'sessions=Y' | head -1 | cut -d: -f1)"
    if [ -n "$first_cfg" ] && [ -n "$first_sess" ]; then
        if [ "$first_cfg" -lt "$first_sess" ]; then
            record V4 MEASURE "config.json FIRST, sessions/<pid>.json after -> early-discovery window EXISTS (Step 2' wait-for-pid OR accept single-dir-glob + retry)"
        elif [ "$first_sess" -lt "$first_cfg" ]; then
            record V4 MEASURE "sessions/<pid>.json FIRST -> no window; pid always available at discovery (simpler)"
        else
            record V4 MEASURE "config.json and sessions/<pid>.json SAME poll cycle -> effectively co-written; no meaningful window"
        fi
    else
        record V4 MEASURE "INCONCLUSIVE: did not observe both new paths within poll window -- see timeline, re-run with longer poll"
    fi
    dxu tmux kill-session -t v4cold 2>/dev/null || true
    return 2
}

# --------------------------------------------------------------------------------------
# V1 -- resolver config-glob path (courier vantage, session_pid=None).
# --------------------------------------------------------------------------------------
check_v1_courier_glob() {
    log "V1: resolver config-glob path (courier, no pid). Uses the AUTHED session (already up)."
    # The authed session's team dir already exists (config eager). Resolve with NO pid.
    local resolved
    resolved="$(dxu "python3 /home/ai-teams/resolve_team_dir.py 2>/dev/null")"
    local rc=$?
    local live_dirs; live_dirs="$(dxu 'ls -d ~/.claude/teams/*/ 2>/dev/null | wc -l')"
    log "V1: resolver -> '${resolved}' (rc=$rc); live team dirs=${live_dirs}"
    if [ $rc -ne 0 ] || [ -z "$resolved" ]; then
        record V1 FAIL "resolver did not return a dir on a live single-team session (rc=$rc)"
        return 1
    fi
    case "$resolved" in
        */teams/session-*) : ;;  # expected: a session-<id> dir
        */teams/framework-research*) record V1 FAIL "resolver returned the HARDCODED framework-research path -- the bug"; return 1 ;;
    esac
    # Resolution flow: prove the courier's inboxes_dir:"auto" sentinel resolves to the discovered
    # dir (NOT framework-research). config_resolve_check.py reproduces the WS1 Config.__init__
    # branch verbatim. NB: it does NOT run a full courier --once -- the throwaway has no hub
    # (no SSH egress to a stationmaster), so the round-trip is scoped to PATH RESOLUTION, which is
    # what V1 actually validates. (A live --once round-trip belongs to the post-unpin integration
    # test against the real hub, not this throwaway.)
    local resolve_log rc2
    resolve_log="$(dxu "python3 /home/ai-teams/config_resolve_check.py /home/ai-teams/fr-courier.config.json 2>&1")"; rc2=$?
    log "V1 inboxes_dir resolution:"; printf '%s\n' "$resolve_log" | tee -a "$RESULTS_LOG"
    if [ $rc2 -ne 0 ] || printf '%s' "$resolve_log" | grep -q 'framework-research'; then
        record V1 FAIL "inboxes_dir:'auto' did NOT resolve to the discovered session-<id> dir (see log)"
        return 1
    fi
    record V1 PASS "resolver -> ${resolved}; inboxes_dir:'auto' resolved to <discovered>/inboxes (no hardcoded framework-research path)"
    return 0
}

# --------------------------------------------------------------------------------------
# V5 -- P4 (members[]-injection) + P6 (external-write-wake) regression on the target version.
# Runs AFTER V1 (reuses the authed session), BEFORE V2 (so V2's planted stale dir is absent).
# --------------------------------------------------------------------------------------
check_v5_p4_p6_regression() {
    log "V5: P4 members[]-injection + P6 external-write-wake regression on the target version."
    local team_dir; team_dir="$(dxu "python3 /home/ai-teams/resolve_team_dir.py 2>/dev/null")"
    if [ -z "$team_dir" ]; then record V5 FAIL "could not resolve team dir for V5"; return 1; fi

    # -- V5a P4: externally append a ghost member to config.json members[], then have the lead
    #    SendMessage it; the harness confirms the harness routed (ghost inbox file written). --
    dxu python3 - "$team_dir" <<'PY'
import json,sys,os
cfg=os.path.join(sys.argv[1],"config.json")
d=json.load(open(cfg))
d.setdefault("members",[])
if not any(m.get("name")=="ghost-courier" for m in d["members"]):
    d["members"].append({"name":"ghost-courier","model":"opus","backendType":"in-process"})
json.dump(d,open(cfg,"w"))
print("appended ghost-courier")
PY
    tmux_send auth "Use SendMessage to send 'V5-P4-ping' to ghost-courier, then tell me if it succeeded."
    sleep 25
    local ghost_inbox
    ghost_inbox="$(dxu "cat ${team_dir}/inboxes/ghost-courier.json 2>/dev/null")"
    if printf '%s' "$ghost_inbox" | grep -q 'V5-P4-ping'; then
        record V5 PASS "P4: members[]-injection routes -- ghost-courier.json received the SendMessage (ghost-registration trick survives target version)"
    else
        record V5 FAIL "P4: SendMessage to injected ghost-courier did NOT land in ghost-courier.json -- members[]-injection regressed"
    fi

    # -- V5b P6: external process writes a well-formed entry into inboxes/team-lead.json; no nudge;
    #    confirm the idle session proactively wakes + the entry is delivered (inbox drains). --
    dxu python3 - "$team_dir" <<'PY'
import json,sys,os,time
p=os.path.join(sys.argv[1],"inboxes","team-lead.json")
os.makedirs(os.path.dirname(p),exist_ok=True)
try: d=json.load(open(p))
except Exception: d=[]
d.append({"from":"probe-ext","text":"V5-P6-wake","summary":"V5 wake","timestamp":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime()),"type":"message","read":False})
json.dump(d,open(p,"w"))
print("wrote external wake entry")
PY
    sleep 20   # P6: ~15s proactive wake on the target version
    local pane; pane="$(tmux_capture auth)"
    local inbox_after; inbox_after="$(dxu "cat ${team_dir}/inboxes/team-lead.json 2>/dev/null")"
    if printf '%s' "$pane" | grep -qi 'V5-P6-wake' || [ "$inbox_after" = "[]" ]; then
        record V5 PASS "P6: external inbox-write proactively woke the idle session (pane rendered the msg and/or inbox drained to [])"
    else
        record V5 FAIL "P6: external write did NOT wake the session within 20s -- external-write-wake regressed (inbox still: ${inbox_after})"
    fi
    return 0
}

# --------------------------------------------------------------------------------------
# V2 -- resolver pid-keyed path (lifecycle vantage). Plants a stale dir to force multi-dir.
# Runs LAST (its planted session-deadbeef dir must not be present during V5's P4/P6).
# --------------------------------------------------------------------------------------
check_v2_lifecycle_pid() {
    log "V2: resolver pid-keyed path (lifecycle, session_pid supplied) + planted stale dir."
    local live_dir; live_dir="$(dxu "python3 /home/ai-teams/resolve_team_dir.py 2>/dev/null")"
    local live_slug; live_slug="$(basename "$live_dir")"
    # Plant a stale session-deadbeef dir whose config.json .name=session-deadbeef and leadSessionId
    # matches NO live sessions/<pid>.json.
    dxu bash -c "cp -r '${live_dir}' ~/.claude/teams/session-deadbeef 2>/dev/null; \
        python3 -c \"import json;p='/home/ai-teams/.claude/teams/session-deadbeef/config.json';d=json.load(open(p));d['name']='session-deadbeef';d['leadSessionId']='deadbeefdeadbeef';json.dump(d,open(p,'w'))\""
    local n_dirs; n_dirs="$(dxu 'ls -d ~/.claude/teams/*/ 2>/dev/null | wc -l')"
    log "V2: planted stale dir; team dirs now=${n_dirs} (live slug=${live_slug})"

    # -- V2a in-session pid-keyed: pass the LIVE session pid -> must pick the live dir, not stale. --
    # FIDELITY NOTE (Herald, 2026-06-18): this pgrep|head is a PROBE STAND-IN for "the in-session
    # caller's own pid". The REAL lifecycle caller passes its OWN pid (os.getpid()/getppid() of the
    # Claude session/script), NOT a pgrep heuristic -- pgrep|head could grab the wrong claude proc if
    # >1 runs. Findings must NOT canonize pgrep|head as the discovery mechanism; it's a single-session
    # probe convenience only. The resolver contract is `session_pid=<the caller's own pid>`.
    local live_pid; live_pid="$(dxu 'pgrep -f "claude" | head -1')"
    local r_pid; r_pid="$(dxu "python3 /home/ai-teams/resolve_team_dir.py --session-pid ${live_pid} 2>/dev/null")"
    if [ "$(basename "$r_pid")" = "$live_slug" ]; then
        record V2 PASS "V2a pid-keyed: selected LIVE dir ${live_slug} over planted stale (pid tiebreaker works)"
    else
        record V2 FAIL "V2a pid-keyed: returned '$(basename "$r_pid")', expected ${live_slug}"
    fi

    # -- V2b glob-only (no pid): liveness filter must drop the stale dir. Coupled to V3's GC finding. --
    local r_glob rc_glob
    r_glob="$(dxu "python3 /home/ai-teams/resolve_team_dir.py 2>/dev/null")"; rc_glob=$?
    if [ "$(basename "$r_glob")" = "$live_slug" ]; then
        record V2 PASS "V2b liveness-filter: dropped stale dir without pid, returned ${live_slug}"
    elif [ $rc_glob -ne 0 ]; then
        record V2 PARTIAL "V2b liveness-filter: FAIL-FAST on ambiguity (SAFE degradation -- expected IF V3 showed dead entries linger live-looking; operator sets team_dir_name)"
    else
        record V2 FAIL "V2b: returned '$(basename "$r_glob")' -- neither live-dir nor safe fail-fast"
    fi

    # -- V2c single-dir self-confirm (Aen hardening): remove stale, pass live pid, expect warn on mismatch only. --
    dxu rm -rf ~/.claude/teams/session-deadbeef
    local v2c; v2c="$(dxu "python3 /home/ai-teams/resolve_team_dir.py --session-pid ${live_pid} 2>&1")"
    if printf '%s' "$v2c" | grep -q "$live_slug"; then
        record V2 PASS "V2c single-dir self-confirm: returned the one dir with live pid (warn-on-mismatch path present)"
    else
        record V2 FAIL "V2c: single-dir + live pid did not return the dir (got: ${v2c})"
    fi
    return 0
}
