#!/usr/bin/env bash
# entrypoint-probe.sh -- THROWAWAY 2.1.178+ probe container entrypoint (*FR:Brunel*)
#
# Runs as root, sets up minimal substrate, drops to ai-teams. Deliberately tiny --
# this is a disposable probe, not a real team container. No courier, no repos, no MCP.
#
# Auth is NOT handled here (the image bakes no credentials). Per PO decision (option c),
# auth is a FRESH `claude login` run interactively over tmux AFTER `up` -- the probe's
# ~/.claude starts EMPTY and the login writes its own .credentials.json there. This
# entrypoint only sets up SSH + ownership so the operator can drive the tmux session
# (and the login) over SSH.
set -e

CONTAINER_USER="ai-teams"
CONTAINER_UID="1000"
CONTAINER_GID="1000"

# ── Volume ownership (Docker creates named volumes as root) ──────────────────────
for DIR in /home/ai-teams/.claude; do
    mkdir -p "$DIR"
    if [ "$(stat -c '%u' "$DIR")" = "0" ]; then
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    fi
done

# ── Operator SSH pubkey (for the tmux send-keys/capture-pane drive) ──────────────
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

# ── Sanity: claude present + version (auth comes LATER, via tmux `claude login`) ──
echo "[entrypoint] claude version: $(gosu "$CONTAINER_USER" claude --version 2>&1 | head -1)"
echo "[entrypoint] CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-<unset>}"
echo "[entrypoint] NOTE: ~/.claude starts EMPTY by design. Auth = run 'claude login' over tmux (option c)."
echo "[entrypoint] Do NOT expect 'claude -p' to work until the login completes."

# ── Hand off: stay alive so the operator can exec/ssh in and drive the probes ────
echo "[entrypoint] probe container ready. Drive via: ssh -p 2229 ai-teams@<rc-host>  (or docker exec)."
exec "$@"
