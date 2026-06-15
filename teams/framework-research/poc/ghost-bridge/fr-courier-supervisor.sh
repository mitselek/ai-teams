#!/usr/bin/env bash
# fr-courier-supervisor.sh
#
# Persistent supervisor for the FR courier daemon (hub-and-spoke, hub
# sm@10.100.136.162:2222). Keeps fr-courier-daemon.py running 24/7,
# decoupled from FR session lifecycle: the courier deposits hub->inbox
# continuously, and the next FR session drains its queue on spawn (same
# model proven with apex in S52). Designed to be launched by Task Scheduler
# at user logon and on power-resume via run-courier-hidden.vbs -> git-bash —
# no admin rights required.
#
# Manual invocation:
#   bash fr-courier-supervisor.sh
#
# Pre-cleans any stale daemon before each launch (pkill), so re-running is
# safe and a crashed prior run does not block a restart.
#
# NB: set -u (nounset) ONLY — NOT set -e. errexit inside a supervisor
# while-loop is a known footgun (the S52 'set +e' learning): a single
# non-zero from the daemon or a `pkill` that matched nothing would kill the
# supervisor itself, defeating the whole point. We trap exits explicitly
# with `|| true` instead.
set -u

GHOST_BRIDGE_DIR="/c/Users/mihkel.putrinsh/Documents/github/mitselek-ai-teams/teams/framework-research/poc/ghost-bridge"
DAEMON="${GHOST_BRIDGE_DIR}/fr-courier-daemon.py"
CONFIG="fr-courier.config.json"

# Scoop's python, pinned by absolute path. Task Scheduler launches a git-bash
# login shell whose PATH normally carries the scoop shims, but pinning the
# binary avoids the transient-PATH-flap failure class the apex analog hit
# (an antivirus/update event briefly taking the binary out of reach with no
# scheduler trigger to revive it). The session launcher (start-fr-courier.ps1)
# relies on bare `python`; this 24/7 path does not.
PYTHON="/c/Users/mihkel.putrinsh/scoop/apps/python/current/python.exe"

LOG_DIR="${HOME}/.claude/logs"
LOG_FILE="${LOG_DIR}/fr-courier-supervisor.log"

mkdir -p "${LOG_DIR}"

# cwd must be the ghost-bridge dir: the daemon resolves the reference courier
# and the relative --config path against the working directory.
cd "${GHOST_BRIDGE_DIR}" || {
    echo "$(date '+%Y/%m/%d %H:%M:%S') supervisor: cannot cd to ${GHOST_BRIDGE_DIR}, aborting" >> "${LOG_FILE}"
    exit 1
}

echo "$(date '+%Y/%m/%d %H:%M:%S') supervisor: starting (daemon=${DAEMON}, config=${CONFIG})" >> "${LOG_FILE}"

# Retry loop: the daemon exits non-zero on network drop / hub unreachable;
# looping the supervisor itself guarantees recovery without waiting for the
# task to re-fire. Backoff sleep prevents a tight crash-loop spin.
while true; do
    # Pre-clean any conflicting prior daemon before each attempt: stale child
    # from a host crash, a lingering session-launched instance, etc. This is
    # single-instance layer 2 (layer 1 = task MultipleInstances=IgnoreNew,
    # layer 3 = the daemon's own lock file). pkill matching nothing returns
    # non-zero — masked with `|| true` so it never trips us up.
    pkill -f "fr-courier-daemon.py" 2>/dev/null || true
    sleep 1

    echo "$(date '+%Y/%m/%d %H:%M:%S') supervisor: launching daemon" >> "${LOG_FILE}"

    # Run the daemon (no flag = session-scoped poll loop). Append both streams
    # to the supervisor log. Capture rc directly and never let a non-zero
    # propagate (set -e is off precisely so this loop survives any exit code).
    "${PYTHON}" "${DAEMON}" --config "${CONFIG}" >> "${LOG_FILE}" 2>&1
    rc=$?
    echo "$(date '+%Y/%m/%d %H:%M:%S') supervisor: daemon exited (rc=${rc}), restarting in 10s" >> "${LOG_FILE}"
    sleep 10
done
