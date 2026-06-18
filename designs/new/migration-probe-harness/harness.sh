#!/usr/bin/env bash
# harness.sh -- repeatable CLI-migration validation probe (build -> auth-pause -> V1-V5 -> teardown).
# (*FR:Brunel*)  Run ON THE rc HOST (Linux/bash -- no Windows/PowerShell quoting traps).
#
# WHAT IT DOES: codifies the whole S54-derived probe lifecycle into one repeatable, version-pinned
# run, so the NEXT pin/unpin cycle re-runs the SAME harness against a new CLI version instead of
# re-deriving the drive mechanics. The ONLY non-scripted step is the OAuth `claude login` (code
# entry is interactive and must never be logged) -- the harness PAUSES cleanly for the PO there.
#
# USAGE:
#   CLAUDE_VERSION=2.1.181 PROBE_NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem ./harness.sh   # S55 target=2.1.181
#   # WARP host: also set PROBE_NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem and uncomment the WARP block
#   # in docker-compose.probe.yml.
#   # Phase control (default: all): ./harness.sh build | up | drive | teardown | all
#
# SAFETY: throwaway image+volume per version; `down -v` + `rmi` on teardown; snapshot to /tmp first.
# Tier R/M -- no live-team container touched, no host change beyond the throwaway. NOT idempotent
# across a half-run: re-run `teardown` then `all` for a clean slate.
set -euo pipefail

# ---- Config (env-driven; CLAUDE_VERSION is the unpin-target pin) ----------------------
: "${CLAUDE_VERSION:?set CLAUDE_VERSION to the unpin-target CLI version (S55 target: 2.1.181)}"
export CLAUDE_VERSION
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE="docker compose -f ${HERE}/docker-compose.probe.yml"
CID="teams-migration-probe"
CU="ai-teams"
PHASE="${1:-all}"
STAMP="$(date +%Y%m%d-%H%M%S)"
RESULTS_LOG="${HERE}/results-${CLAUDE_VERSION}-${STAMP}.log"
SNAPSHOT_DIR="/tmp/migration-probe-snapshot-${CLAUDE_VERSION}-${STAMP}"

# ---- Container interaction helpers (docker exec -- no ssh/tmux quoting fragility) ------
dx()  { docker exec "$CID" "$@"; }                       # as root
dxu() { docker exec -u "$CU" "$CID" bash -lc "$*"; }     # as ai-teams, login shell
tmux_send()    { dxu "tmux send-keys -t '$1' -l \"$2\"; tmux send-keys -t '$1' Enter"; }  # pane, literal text
tmux_capture() { dxu "tmux capture-pane -t '$1' -p | tail -50"; }
log()    { printf '[harness %s] %s\n' "$(date +%H:%M:%S)" "$*" | tee -a "$RESULTS_LOG" >&2; }
record() { # check, verdict(PASS/FAIL/PARTIAL/MEASURE), detail
    printf 'RESULT %-4s %-8s %s\n' "$1" "$2" "$3" | tee -a "$RESULTS_LOG"
}

# ---- Phase: BUILD ---------------------------------------------------------------------
phase_build() {
    log "BUILD: image teams-migration-probe:${CLAUDE_VERSION} (build-arg CLAUDE_VERSION=${CLAUDE_VERSION})"
    DOCKER_BUILDKIT=1 $COMPOSE build --build-arg "CLAUDE_VERSION=${CLAUDE_VERSION}"
    log "BUILD ok. (Dockerfile asserts installed==requested; a mismatch would have failed the build.)"
}

# ---- Phase: UP + stage probe files ----------------------------------------------------
phase_up() {
    log "UP: starting throwaway container"
    $COMPOSE up -d
    sleep 3
    log "UP: claude version in container = $(dxu 'claude --version' | head -1)  (MUST be ${CLAUDE_VERSION})"
    log "STAGE: copying reference resolver + config-resolve check + courier config into the container"
    docker cp "${HERE}/staging/resolve_team_dir.py"      "${CID}:/home/${CU}/resolve_team_dir.py"
    docker cp "${HERE}/staging/config_resolve_check.py"  "${CID}:/home/${CU}/config_resolve_check.py"
    docker cp "${HERE}/staging/fr-courier.config.json"   "${CID}:/home/${CU}/fr-courier.config.json"
    dx chown -R "${CU}:${CU}" \
        "/home/${CU}/resolve_team_dir.py" \
        "/home/${CU}/config_resolve_check.py" \
        "/home/${CU}/fr-courier.config.json" || true
    log "STAGE ok."
}

# ---- AUTH PAUSE: the ONE human step. Cannot be scripted (OAuth code entry, never logged). ----
phase_auth() {
    log "AUTH: starting the interactive Claude session in tmux pane 'auth'"
    dxu "tmux new-session -d -s auth 'claude'" || true
    sleep 4
    cat >&2 <<EOF

========================================================================
  AUTH PAUSE -- HUMAN STEP REQUIRED (cannot be scripted)
========================================================================
  The probe needs a fresh OAuth login on CLI ${CLAUDE_VERSION}.
  PO: attach to the container and run the login in the 'auth' pane:

      docker exec -it -u ${CU} ${CID} tmux attach -t auth
      # in the pane: run  /login  (or it may prompt automatically),
      # complete the device-code flow in your browser,
      # then detach: Ctrl-b d

  The OAuth code is entered by YOU and is NEVER captured by this harness.
  When the session shows an authed, idle prompt, press ENTER here to resume.
========================================================================
EOF
    read -r _ < /dev/tty
    # Verify auth landed before driving (cheap guard: credentials file exists).
    if dxu 'test -f ~/.claude/.credentials.json'; then
        log "AUTH: ~/.claude/.credentials.json present -- proceeding."
    else
        log "AUTH: WARNING -- no ~/.claude/.credentials.json. Login may be incomplete. Continuing, but checks may fail."
    fi
}

# ---- Phase: DRIVE (V3 -> V4 -> V1 -> V5 -> V2; order is load-bearing, see brief) -------
phase_drive() {
    # shellcheck source=lib/checks.sh
    source "${HERE}/lib/checks.sh"
    log "DRIVE: run order V3 -> V4 -> V1 -> V5 -> V2 (V3 first: its GC finding tells us how V2b reads)"
    check_v3_session_gc      || log "V3 returned nonzero (see results)"
    check_v4_write_order     || true   # MEASURE-ONLY returns 2
    check_v1_courier_glob    || log "V1 returned nonzero (see results)"
    check_v5_p4_p6_regression|| log "V5 returned nonzero (see results)"
    check_v2_lifecycle_pid   || log "V2 returned nonzero (see results)"
    log "DRIVE complete. Results summary:"
    grep '^RESULT' "$RESULTS_LOG" | tee -a "$RESULTS_LOG" >&2 || true
}

# ---- Phase: TEARDOWN (snapshot -> down -v -> rmi; S54 isolation discipline, scripted) --
phase_teardown() {
    log "TEARDOWN: snapshot ~/.claude to ${SNAPSHOT_DIR} for the record"
    mkdir -p "$SNAPSHOT_DIR"
    docker cp "${CID}:/home/${CU}/.claude" "$SNAPSHOT_DIR/" 2>/dev/null || log "snapshot skipped (container gone?)"
    log "TEARDOWN: down -v (deletes the throwaway volume)"
    $COMPOSE down -v || true
    log "TEARDOWN: rmi teams-migration-probe:${CLAUDE_VERSION}"
    docker rmi "teams-migration-probe:${CLAUDE_VERSION}" 2>/dev/null || log "image already gone"
    log "TEARDOWN done. Snapshot: ${SNAPSHOT_DIR}; results: ${RESULTS_LOG}"
}

# ---- Orchestration --------------------------------------------------------------------
log "migration-probe-harness | CLAUDE_VERSION=${CLAUDE_VERSION} | phase=${PHASE} | results=${RESULTS_LOG}"
case "$PHASE" in
    build)    phase_build ;;
    up)       phase_up ;;
    auth)     phase_auth ;;
    drive)    phase_drive ;;
    teardown) phase_teardown ;;
    all)      phase_build; phase_up; phase_auth; phase_drive; phase_teardown ;;
    *) echo "usage: CLAUDE_VERSION=<ver> $0 [build|up|auth|drive|teardown|all]" >&2; exit 2 ;;
esac
log "harness phase '${PHASE}' finished."
