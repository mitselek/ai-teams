#!/usr/bin/env bash
# entrypoint-probe.sh -- THROWAWAY migration-probe container entrypoint (*FR:Brunel*)
#
# Verbatim from designs/new/teams-migration-probe/entrypoint-probe.sh (S54) -- version-agnostic,
# no change needed for the harness. Runs as root, sets up SSH + volume ownership, drops to
# ai-teams. No courier, no repos, no MCP. Auth is a LATER interactive `claude login` over tmux.
set -e

CONTAINER_USER="ai-teams"
CONTAINER_UID="1000"
CONTAINER_GID="1000"

# -- Volume ownership (Docker creates named volumes as root) --
for DIR in /home/ai-teams/.claude; do
    mkdir -p "$DIR"
    if [ "$(stat -c '%u' "$DIR")" = "0" ]; then
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    fi
done

# -- Operator SSH pubkey (for the tmux send-keys/capture-pane drive) --
if [ -n "${SSH_PUBLIC_KEY:-}" ]; then
    install -d -m 700 -o "$CONTAINER_UID" -g "$CONTAINER_GID" /home/ai-teams/.ssh
    printf '%s\n' "$SSH_PUBLIC_KEY" > /home/ai-teams/.ssh/authorized_keys
    chmod 600 /home/ai-teams/.ssh/authorized_keys
    chown "${CONTAINER_UID}:${CONTAINER_GID}" /home/ai-teams/.ssh/authorized_keys
    /usr/sbin/sshd -p 2222
    echo "[entrypoint] sshd up on 2222; operator key installed."
else
    echo "[entrypoint] WARNING: PROBE_SSH_PUBLIC_KEY not set -- no SSH-in; use docker exec to drive."
fi

# -- Sanity: claude present + version (auth comes LATER, via tmux `claude login`) --
echo "[entrypoint] claude version: $(gosu "$CONTAINER_USER" claude --version 2>&1 | head -1)"
echo "[entrypoint] CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-<unset>}"
echo "[entrypoint] NOTE: ~/.claude starts EMPTY by design. Auth = run 'claude login' over tmux (option c)."

# -- Hand off: stay alive so the operator can exec/ssh in and drive the probes --
echo "[entrypoint] probe container ready. Drive via: ssh -p 2229 ai-teams@<rc-host>  (or docker exec)."
exec "$@"
