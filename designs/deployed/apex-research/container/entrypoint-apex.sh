#!/usr/bin/env bash
# entrypoint-apex.sh (*FR:Brunel*)
#
# Runs as root. Sets up the apex-research container in 6 steps:
# 1. Fix volume ownership (Docker creates named volumes as root)
# 2. Clone/pull apex-migration-research repo (read-write)
# 3. Clone/pull vjs_apex_apps repo (read-only after clone)
# 4. Create symlink for script compatibility (../vjs_apex_apps/)
# 5. Setup Python venv (first run only)
# 6. Setup SSH (PO access)
# 7. Drop privileges and exec
#
# Required env vars:
#   GITHUB_TOKEN      — PAT with read access to both repos (same org)
#   ANTHROPIC_API_KEY — Claude Code CLI
#   SSH_PUBLIC_KEY    — PO's public key for SSH access
#
# Optional env vars:
#   REPO_URL          — research repo URL (default: Eesti-Raudtee/apex-migration-research)
#   SOURCE_REPO_URL   — source data repo URL (default: Eesti-Raudtee/vjs_apex_apps)
#   TEAM_NAME         — team name (default: apex-research)
set -e

CONTAINER_USER="ai-teams"
CONTAINER_UID="1000"
CONTAINER_GID="1000"
HOME_DIR="/home/ai-teams"
CLAUDE_DIR="${HOME_DIR}/.claude"
WORKSPACE="${HOME_DIR}/workspace"
SOURCE_DATA="${HOME_DIR}/source-data"

REPO_URL="${REPO_URL:-https://github.com/Eesti-Raudtee/apex-migration-research.git}"
SOURCE_REPO_URL="${SOURCE_REPO_URL:-https://github.com/Eesti-Raudtee/vjs_apex_apps.git}"

# ── Helpers ─────────────────────────────────────────────────────────────────────

clone_or_pull() {
    local repo_url="$1"
    local target_dir="$2"
    local auth_url

    auth_url=$(echo "$repo_url" | sed "s|https://|https://${GITHUB_TOKEN}@|")

    if [ -d "${target_dir}/.git" ]; then
        echo "[entrypoint] ${target_dir} exists — running git pull..."
        gosu "${CONTAINER_USER}" git -C "${target_dir}" remote set-url origin "${auth_url}"
        gosu "${CONTAINER_USER}" git -C "${target_dir}" pull --ff-only || {
            echo "[entrypoint] WARNING: git pull failed for ${target_dir} (non-fast-forward or network). Using existing state."
        }
    else
        echo "[entrypoint] First run — cloning ${repo_url} to ${target_dir}..."
        mkdir -p "${target_dir}"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "${target_dir}"
        gosu "${CONTAINER_USER}" git clone "${auth_url}" "${target_dir}"
    fi
}

# supervise <name> <command...>  — relaunch the service whenever it exits.
# Mirrors the sshd background-launch precedent (Step 7) but with a restart loop.
# Runs as the ai-teams user via gosu; backgrounded so PID 1 stays bash and reaps it.
supervise() {
    local name="$1"; shift
    (
        # set +e is REQUIRED: the script runs under `set -e` (errexit), which is
        # inherited by this subshell. The supervisor's whole job is to handle a
        # service's NON-ZERO exit (crash, SIGTERM=143, SIGKILL=137) and relaunch —
        # under errexit the first non-zero exit would kill this subshell BEFORE the
        # loop can restart it (verified: restart-on-exit silently fails with set -e).
        set +e
        while true; do
            echo "[supervisor] starting ${name}..."
            gosu "${CONTAINER_USER}" bash -lc "$*"
            rc=$?
            echo "[supervisor] ${name} exited (rc=${rc}); restarting in 5s"
            sleep 5
        done
    ) &
    echo "[supervisor] ${name} supervised (loop pid $!)"
}

# ── Step 0: Fix hostname resolution ─────────────────────────────────────────────
# network_mode: host + hostname: apex-research doesn't update /etc/hosts.
# Without this, sudo and other tools warn about unresolvable hostname.
if ! grep -q 'apex-research' /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 apex-research" >> /etc/hosts
fi

# ── Step 0b: WARP TLS CA ──────────────────────────────────────────────────────
# If WARP CA cert is bind-mounted, add it to the system CA store so curl, pip,
# and git trust HTTPS through the WARP proxy. Node.js uses NODE_EXTRA_CA_CERTS
# (set in docker-compose.yml) instead of the system store.
WARP_CA="/opt/warp-ca.pem"
if [ -f "$WARP_CA" ]; then
    cp "$WARP_CA" /usr/local/share/ca-certificates/warp-ca.crt
    update-ca-certificates --fresh > /dev/null 2>&1
    echo "[entrypoint] WARP CA added to system CA store."
fi

# ── Step 1: Fix volume ownership ────────────────────────────────────────────────
# Docker creates named volumes owned by root. Fix on every start.
# SOURCE_DATA excluded — its ownership is managed by step 4 (locked to root after clone).
for DIR in "$CLAUDE_DIR" "$WORKSPACE"; do
    if [ -d "$DIR" ]; then
        OWNER=$(stat -c '%u' "$DIR")
        if [ "$OWNER" = "0" ]; then
            chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
        fi
    else
        mkdir -p "$DIR"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "$DIR"
    fi
done

# ── Step 2: Validate required env vars ──────────────────────────────────────────
if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "ERROR: GITHUB_TOKEN is not set." >&2
    exit 1
fi

# ── Step 3: Clone/pull research repo (read-write) ──────────────────────────────
clone_or_pull "$REPO_URL" "$WORKSPACE"

# ── Step 4: Clone/pull source data repo ─────────────────────────────────────────
# vjs_apex_apps is cloned on first run, then made read-only for ai-teams user
# via filesystem permissions (chown root + remove group/other write bits).
# Volume is mounted read-write so entrypoint (root) can clone and update.
if [ -d "${SOURCE_DATA}/.git" ]; then
    # Temporarily make writable for pull (root owns it after lockdown)
    chmod -R u+w "${SOURCE_DATA}"
    chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "${SOURCE_DATA}"
    gosu "${CONTAINER_USER}" git -C "${SOURCE_DATA}" pull --ff-only || {
        echo "[entrypoint] WARNING: git pull failed for source-data. Using existing state."
    }
elif [ -z "$(ls -A "${SOURCE_DATA}" 2>/dev/null)" ]; then
    clone_or_pull "$SOURCE_REPO_URL" "$SOURCE_DATA"
else
    echo "[entrypoint] source-data has content but no .git — using as-is."
fi

# Lock down source-data: owned by root, read+execute only for others.
# ai-teams user can read but not write. Enforces "do NOT modify source" rule.
chown -R root:root "${SOURCE_DATA}"
chmod -R a-w,a+rX "${SOURCE_DATA}"
echo "[entrypoint] source-data locked to read-only for ${CONTAINER_USER}."

# ── Step 5: Symlink for script compatibility ────────────────────────────────────
# Existing Python scripts use ../vjs_apex_apps/ relative to workspace.
# workspace = /home/ai-teams/workspace, so .. = /home/ai-teams/
# Symlink: /home/ai-teams/vjs_apex_apps -> /home/ai-teams/source-data
ln -sfn "${SOURCE_DATA}" "${HOME_DIR}/vjs_apex_apps"

# ── Step 6: Python venv setup (first run only) ─────────────────────────────────
VENV_DIR="${WORKSPACE}/.venv"
if [ -d "${VENV_DIR}/bin" ]; then
    echo "[entrypoint] Python venv exists."
else
    echo "[entrypoint] Creating Python venv..."
    # Remove broken venv if present
    rm -rf "${VENV_DIR}"
    gosu "${CONTAINER_USER}" python3 -m venv "${VENV_DIR}"
    gosu "${CONTAINER_USER}" "${VENV_DIR}/bin/pip" install --quiet -e "${WORKSPACE}[dev]"
    echo "[entrypoint] Python venv created and deps installed."
fi

# ── Step 6b: Jira MCP server (first run only) ────────────────────────────────
# Clone dev-toolkit's Jira MCP server from GitHub if not already present.
# Lives at /opt/jira-mcp-server/ (container filesystem, rebuilt on image rebuild).
JIRA_MCP_DIR="/opt/jira-mcp-server"
JIRA_MCP_REPO="https://github.com/Eesti-Raudtee/dev-toolkit.git"
if [ ! -f "${JIRA_MCP_DIR}/dist/index.js" ]; then
    echo "[entrypoint] Installing Jira MCP server..."
    JIRA_TMP=$(mktemp -d)
    AUTH_URL=$(echo "$JIRA_MCP_REPO" | sed "s|https://|https://${GITHUB_TOKEN}@|")
    git clone --depth 1 --sparse "${AUTH_URL}" "${JIRA_TMP}"
    git -C "${JIRA_TMP}" sparse-checkout set jira-mcp-server
    cp -r "${JIRA_TMP}/jira-mcp-server" "${JIRA_MCP_DIR}"
    rm -rf "${JIRA_TMP}"
    cd "${JIRA_MCP_DIR}" && npm install --quiet 2>&1 | tail -2
    cd "${WORKSPACE}"
    if [ -f "${JIRA_MCP_DIR}/dist/index.js" ]; then
        echo "[entrypoint] Jira MCP server installed."
    else
        echo "[entrypoint] WARNING: Jira MCP server build failed."
    fi
else
    echo "[entrypoint] Jira MCP server exists."
fi

# ── Step 6c: Persist the container's OWN sshd host keys (*FR:Brunel*) ─────────────
# The Dockerfile's `ssh-keygen -A` writes host keys into /etc/ssh on the EPHEMERAL
# overlay (st_dev 78), so they REGENERATE on every rebuild → anyone SSHing IN
# (PO/operators) hits REMOTE-HOST-IDENTIFICATION-CHANGED after each rebuild.
# Fix (mirrors the stationmaster hub, which persists its host keys on its state
# volume, generate-if-absent): keep the host keys on the PERSISTENT volume
# (~/.claude, st_dev 65024), generate once on first boot, and copy them into
# /etc/ssh BEFORE sshd starts (Step 7). Stable identity across all future rebuilds.
# SECURITY: the host PRIVATE keys live ONLY here on the persistent volume — never
# baked into an image layer. Dir is root:root 700 so the agent (uid 1000) can't
# read them, even though it's under the ai-teams home volume.
HOSTKEY_DIR="/home/ai-teams/.claude/ssh-host-keys"
install -d -m 700 -o root -g root "${HOSTKEY_DIR}"
for kt in ed25519 rsa ecdsa; do
    if [ ! -f "${HOSTKEY_DIR}/ssh_host_${kt}_key" ]; then
        ssh-keygen -q -t "${kt}" -N "" -f "${HOSTKEY_DIR}/ssh_host_${kt}_key" \
            && echo "[entrypoint] generated persistent sshd ${kt} host key (first boot)."
    fi
    # Restore the persistent key into /etc/ssh (overwrites the build-time ephemeral one).
    if [ -f "${HOSTKEY_DIR}/ssh_host_${kt}_key" ]; then
        install -m 600 -o root -g root "${HOSTKEY_DIR}/ssh_host_${kt}_key"     /etc/ssh/ssh_host_${kt}_key
        install -m 644 -o root -g root "${HOSTKEY_DIR}/ssh_host_${kt}_key.pub" /etc/ssh/ssh_host_${kt}_key.pub
    fi
done
echo "[entrypoint] sshd host keys restored from persistent volume (stable across rebuilds)."

# ── Step 7: SSH setup ──────────────────────────────────────────────────────────
# Collects all SSH_PUBLIC_KEY* env vars into authorized_keys for both users.
# Supports SSH_PUBLIC_KEY, SSH_PUBLIC_KEY_2, SSH_PUBLIC_KEY_3, etc.
KEY_COUNT=0
KEYS=""
for var in $(env | grep '^SSH_PUBLIC_KEY' | sort | cut -d= -f1); do
    val="${!var}"
    if [ -n "$val" ]; then
        KEYS="${KEYS}${val}\n"
        KEY_COUNT=$((KEY_COUNT + 1))
    fi
done

if [ "$KEY_COUNT" -gt 0 ]; then
    # Install keys for both michelek (PO) and ai-teams (Claude agent)
    for user_home in /home/michelek /home/ai-teams; do
        user=$(basename "$user_home")
        mkdir -p "${user_home}/.ssh"
        printf "%b" "$KEYS" > "${user_home}/.ssh/authorized_keys"
        chmod 700 "${user_home}/.ssh"
        chmod 600 "${user_home}/.ssh/authorized_keys"
        chown -R "${user}:${user}" "${user_home}/.ssh"
    done
    echo "[entrypoint] ${KEY_COUNT} SSH public key(s) installed for michelek + ai-teams."

    # Start sshd in background on port 2222 (avoids conflict with host sshd on port 22)
    /usr/sbin/sshd -p 2222
    echo "[entrypoint] sshd started on port 2222."
else
    echo "[entrypoint] WARNING: No SSH_PUBLIC_KEY* vars set — SSH access disabled."
fi

# ── Step 7b: Seed courier key into ephemeral ~/.ssh (*FR:Brunel*) ────────────────
# ~/.ssh is on the ephemeral overlay (does not survive rebuild). The durable
# source is the build-baked seed on the image FS (Dockerfile build-secret RUN).
# Copy once per start; same key every build (seed generated once) => no hub-side churn.
# Key filename matches the name the live courier.json already dials (~/.ssh/stationmaster_apex)
# so no courier.json edit is needed — the hub registers by pubkey content, not filename.
if [ -f /home/ai-teams/.ssh-seed/stationmaster_apex ] && [ ! -f /home/ai-teams/.ssh/stationmaster_apex ]; then
    install -d -m 700 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" /home/ai-teams/.ssh
    install -m 600 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" /home/ai-teams/.ssh-seed/stationmaster_apex \
         /home/ai-teams/.ssh/stationmaster_apex
    echo "[entrypoint] courier key seeded into ~/.ssh."
fi

# ── Step 7c: Provision the hub HOST key into known_hosts (*FR:Brunel*) ───────────
# The courier dials the hub with StrictHostKeyChecking=yes +
# UserKnownHostsFile=~/.ssh/stationmaster_known_hosts. ~/.ssh is ephemeral (does
# NOT survive rebuild), so the known_hosts must be re-provisioned each start or the
# courier can't TRUST the hub → collect leg fails (ssh rc=255, "No ED25519 host key
# is known"). The host PUBLIC key is not secret, so we PIN it inline here (NOT a
# blind ssh-keyscan — that would defeat StrictHostKeyChecking). This key is verified:
# SHA256:CNcFjOxr8vREOueOS8nxJN8W3LaQHet62du+PHyK13U for [10.100.136.162]:2222.
# To rotate: update this line if the hub's host key changes (it persists on the
# hub's state volume, so it's stable across hub restarts).
KNOWN_HOSTS="/home/ai-teams/.ssh/stationmaster_known_hosts"
HUB_HOSTKEY='[10.100.136.162]:2222 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDr8dFknoJWDpD+tRz0uYcpBFWy5cw+GkNQu7BxDYVix'
install -d -m 700 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" /home/ai-teams/.ssh
if ! grep -qF "${HUB_HOSTKEY}" "${KNOWN_HOSTS}" 2>/dev/null; then
    echo "${HUB_HOSTKEY}" >> "${KNOWN_HOSTS}"
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "${KNOWN_HOSTS}"
    chmod 644 "${KNOWN_HOSTS}"
    echo "[entrypoint] hub host key pinned into ${KNOWN_HOSTS}."
fi

# ── Step 8: Runtime validation ──────────────────────────────────────────────────
echo "[entrypoint] Runtime validation:"

# Python version check (hard gate: 3.11+)
PYTHON_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+')
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
if [ "$PYTHON_MAJOR" -lt 3 ] || { [ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 11 ]; }; then
    echo "  FAIL: Python ${PYTHON_VERSION} < 3.11 — aborting." >&2
    exit 1
fi
echo "  OK: Python ${PYTHON_VERSION}"

# Node.js version check (hard gate: 20+)
NODE_VERSION=$(node --version 2>&1 | grep -oP '\d+' | head -1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "  FAIL: Node.js v${NODE_VERSION} < 20 — aborting." >&2
    exit 1
fi
echo "  OK: Node.js v${NODE_VERSION}"

# Claude check (hard gate)
if ! command -v claude >/dev/null 2>&1; then
    echo "  FAIL: claude not found — aborting." >&2
    exit 1
fi
echo "  OK: claude available"

# Repo checks
if [ -d "${WORKSPACE}/.git" ]; then
    echo "  OK: apex-migration-research repo"
else
    echo "  FAIL: workspace has no .git — aborting." >&2
    exit 1
fi

if [ -d "${SOURCE_DATA}/.git" ] || [ -d "${SOURCE_DATA}/db" ]; then
    echo "  OK: vjs_apex_apps source data"
else
    echo "  WARN: vjs_apex_apps not available — cached inventory still usable."
fi

# Oracle dev-DB tunnel check (soft: container starts regardless).
# Tunnels are opened by the operator from their Windows machine; see
# apex-migration-research/.claude/bin/open-db-tunnels.sh.
if command -v nc >/dev/null 2>&1 && nc -z -w3 127.0.0.1 11521 2>/dev/null; then
    echo "  OK: DB tunnel up (127.0.0.1:11521 -> VJSDBTEST)"
else
    echo "  WARN: DB tunnel down — run 'bash .claude/bin/open-db-tunnels.sh' on your Windows machine"
fi

echo "[entrypoint] All gates passed. Starting..."

# ── Step 9: Persist env vars for interactive shells ───────────────────────────
# Compose env vars don't propagate to interactive bash sessions (ssh, sudo su).
# Write current values to .bashrc so ai-teams has them in every shell.
BASHRC="${HOME_DIR}/.bashrc"
declare -A SHELL_VARS=(
    [HOME]="/home/ai-teams"
    [NODE_EXTRA_CA_CERTS]="/opt/warp-ca.pem"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-1}"
    [GITHUB_TOKEN]="${GITHUB_TOKEN}"
    [TEAM_NAME]="${TEAM_NAME:-apex-research}"
    [ATLASSIAN_EMAIL]="${ATLASSIAN_EMAIL}"
    [ATLASSIAN_API_TOKEN]="${ATLASSIAN_API_TOKEN}"
    [ATLASSIAN_BASE_URL]="${ATLASSIAN_BASE_URL}"
    [CLAUDE_ENV_ID]="APEX-R"
    [TERM]="xterm-256color"
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
    [CLAUDE_CODE_NO_FLICKER]="1"
)
# PATH for native Claude install (~/.local/bin)
if ! grep -q '\.local/bin' "$BASHRC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$BASHRC"
fi
for var in "${!SHELL_VARS[@]}"; do
    val="${SHELL_VARS[$var]}"
    if [ -n "$val" ]; then
        sed -i "/^export ${var}=/d" "$BASHRC"
        echo "export ${var}=${val}" >> "$BASHRC"
    fi
done

# ── Step 9a1: Source team aliases ────────────────────────────────────────────
ALIASES_SRC='[ -f ~/workspace/teams/apex-research/aliases.sh ] && source ~/workspace/teams/apex-research/aliases.sh'
if ! grep -q 'aliases.sh' "$BASHRC" 2>/dev/null; then
    echo "$ALIASES_SRC" >> "$BASHRC"
fi

# ── Step 9a2: tmux config ────────────────────────────────────────────────────
# .tmux.conf is on container filesystem — recreate on every start.
for user_home in "${HOME_DIR}" /home/michelek; do
    cat > "${user_home}/.tmux.conf" << 'TMUX_EOF'
set -g default-terminal "tmux-256color"
set -gq utf8 on
set -gq status-utf8 on
set -g mouse on
set -g history-limit 50000
set -g status-interval 5
TMUX_EOF
    chown "$(basename "${user_home}"):$(basename "${user_home}")" "${user_home}/.tmux.conf"
done

# ── Step 9a3: tmux-apex launcher ─────────────────────────────────────────────
cat > /usr/local/bin/tmux-apex << 'TMUX_APEX_EOF'
#!/usr/bin/env bash
tmux -u attach -t 'apex-research' 2>/dev/null || tmux -u new -s 'apex-research'
TMUX_APEX_EOF
chmod +x /usr/local/bin/tmux-apex

# ── Step 9b: Git attribution ──────────────────────────────────────────────────
# Base image sets git user to mitselek (personal). Override for apex-research team.
gosu "${CONTAINER_USER}" git config --global user.name "apex-research"
gosu "${CONTAINER_USER}" git config --global user.email "mihkel.putrinsh@evr.ee"

# ── Step 9c: Claude settings ─────────────────────────────────────────────────
# Pre-configure permission allow-list and model if settings.json doesn't exist yet.
# If it exists (persisted in volume), don't overwrite — PO may have customized it.
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Bash",
      "WebFetch",
      "WebSearch",
      "Skill(update-config)",
      "Read",
      "Edit",
      "Write"
    ],
    "deny": [
      "mcp__jira__jira_create_issue",
      "mcp__jira__jira_delete_issue",
      "mcp__jira__jira_update_issue",
      "mcp__jira__jira_transition"
    ]
  },
  "includeCoAuthoredBy": false,
  "attribution": {
    "commit": "",
    "pr": ""
  },
  "statusLine": {
    "type": "command",
    "command": "bash /opt/statusline-command.sh"
  }
}
SETTINGS_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SETTINGS_FILE"
    echo "[entrypoint] Claude settings.json created."
fi

# ── Step 9d: MCP server config ───────────────────────────────────────────────
# Configure Jira MCP server if not already configured.
# Uses env vars from compose for credentials. NODE_EXTRA_CA_CERTS needed for WARP.
MCP_FILE="${CLAUDE_DIR}/mcp.json"
if [ ! -f "$MCP_FILE" ] && [ -f "/opt/jira-mcp-server/dist/index.js" ]; then
    cat > "$MCP_FILE" << MCP_EOF
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/opt/jira-mcp-server/dist/index.js"],
      "env": {
        "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
        "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}",
        "ATLASSIAN_BASE_URL": "${ATLASSIAN_BASE_URL}",
        "NODE_EXTRA_CA_CERTS": "/opt/warp-ca.pem"
      }
    }
  }
}
MCP_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$MCP_FILE"
    echo "[entrypoint] MCP config (mcp.json) created with Jira server."
fi

# ── Step 9e: Supervise long-lived services (dashboard + courier) (*FR:Brunel*) ──
# Previously launched session-side (startup.md 4e/5); did NOT survive a container
# restart. Supervised here so they come up on every boot and relaunch on exit.
# Backgrounded — PID 1 stays bash (mirrors the sshd Step 7 precedent).
# Single-owner: apex drops the session-side launches as part of the cutover.
supervise dashboard 'cd /home/ai-teams/workspace/dashboard && npx vite --host 0.0.0.0 --port 5173'

# Courier config path: in-container-confirmed (Hopper find-sweep, S52) — single
# file, no alternates. Overridable via COURIER_CONFIG env. The guard below still
# degrades gracefully (loud warn, no crash-loop) if the script/config goes missing.
COURIER_SCRIPT="/home/ai-teams/workspace/teams/apex-research/stationmaster/stationmaster-courier.reference.py"
COURIER_CONFIG="${COURIER_CONFIG:-/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json}"

# Pre-create the courier inboxes_dir (boot-order fix, *FR:Brunel* S52).
# The supervised courier now launches at container BOOT — earlier than apex's
# agent session, which previously created this dir. The courier's validate_startup
# requires inboxes_dir to EXIST (files auto-create inside it, but the DIR must be
# present) and to be on the SAME VOLUME as state_dir. Both live under ~/.claude
# (persistent), so this mkdir satisfies both invariants and is what makes the
# supervised courier boot-order-independent. Idempotent; the session would create
# the same dir. ai-teams-owned because the courier runs as ai-teams.
COURIER_INBOXES_DIR="/home/ai-teams/.claude/teams/apex-research/inboxes"
install -d -m 755 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" "${COURIER_INBOXES_DIR}"

# Pre-clean a stale courier lock at boot (*FR:Brunel* S52). The courier's
# single-instance lock lives on the PERSISTENT state_dir (~/.claude), so an
# ungraceful prior-container death (SIGKILL/OOM/crash) leaves a lock that
# survives recreate. The courier's staleness check is pid-only, and PIDs reset
# per container → a prior-container pid can alias a live process in the new
# container → the courier false-refuses to start, defeating the supervisor.
# Boot invariant makes this SAFE: the entrypoint runs once at container start,
# BEFORE the supervised courier launches, so any lock present here is necessarily
# a prior-container artifact (no live courier can hold it yet) = stale by
# definition. Same boot-setup class as the inboxes_dir pre-create above.
# (The durable general fix — a container-instance discriminator in the lock —
# is Herald's courier.reference.py follow-up; this closes the apex case now.)
COURIER_LOCK="/home/ai-teams/.claude/teams/apex-research/stationmaster-state/courier.lock"
rm -f "${COURIER_LOCK}"

if [ -f "${COURIER_SCRIPT}" ] && [ -f "${COURIER_CONFIG}" ]; then
    supervise courier "python3 ${COURIER_SCRIPT} --config ${COURIER_CONFIG}"
else
    echo "[entrypoint] WARNING: courier NOT supervised — script or config missing (${COURIER_SCRIPT} / ${COURIER_CONFIG})."
fi

# ── Step 10: Drop privileges and exec ──────────────────────────────────────────
exec gosu "${CONTAINER_USER}" "$@"
