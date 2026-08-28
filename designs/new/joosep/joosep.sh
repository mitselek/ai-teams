#!/usr/bin/env bash
# joosep.sh -- host-side launcher for the joosep workbench (*FR:Brunel*)
#
# Modelled on /home/dev/allerk/allerk.sh. Run from this directory on the RC host.
#
#   ./joosep.sh            shell inside the container (starts it if down)
#   ./joosep.sh build      build the image
#   ./joosep.sh up         start, detached
#   ./joosep.sh down       stop, KEEP volumes
#   ./joosep.sh restart    recreate the container (picks up compose/env changes)
#   ./joosep.sh logs       follow container logs
#   ./joosep.sh <cmd...>   run <cmd> inside the container as joosep
#
# The bare form is the HOST-side analogue of `Connect-Joosep` with no switch;
# `./joosep.sh joosep-session` is the analogue of `-Session`.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

SERVICE="joosep"
COMPOSE=(docker compose)

# `docker compose exec` BYPASSES the entrypoint, so the entrypoint's gosu drop
# never runs and you land as the image's default user -- root. Files created
# that way are root-owned INSIDE THE NAMED VOLUMES, they outlive the session,
# and passing --user next time does not repair them; they have to be chowned.
# Hence --user on every exec, without exception.
EXEC=("${COMPOSE[@]}" exec --user "$SERVICE" "$SERVICE")

ensure_up() {
    if [ -z "$("${COMPOSE[@]}" ps -q --status running "$SERVICE" 2>/dev/null)" ]; then
        echo "[joosep.sh] container not running -- starting..."
        "${COMPOSE[@]}" up -d
        sleep 2
    fi
}

case "${1:-}" in
    build)
        shift
        exec "${COMPOSE[@]}" build "$@"
        ;;
    up)
        shift
        exec "${COMPOSE[@]}" up -d "$@"
        ;;
    down)
        shift
        # Deliberately no -v passthrough guard here beyond this warning:
        # `down -v` destroys joosep_home, which holds the OAuth credentials and
        # every agent scratchpad. That is the one-way door in this design.
        for a in "$@"; do
            if [ "$a" = "-v" ] || [ "$a" = "--volumes" ]; then
                echo "[joosep.sh] REFUSING -v: that destroys joosep_home (OAuth + all scratchpads)." >&2
                echo "[joosep.sh] If you really mean it, run the docker command by hand." >&2
                exit 1
            fi
        done
        exec "${COMPOSE[@]}" down "$@"
        ;;
    restart)
        shift
        exec "${COMPOSE[@]}" up -d --force-recreate "$@"
        ;;
    logs)
        shift
        exec "${COMPOSE[@]}" logs -f "$@"
        ;;
    "")
        ensure_up
        exec "${EXEC[@]}" bash -l
        ;;
    *)
        ensure_up
        exec "${EXEC[@]}" "$@"
        ;;
esac
