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
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
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

# ── Step 9a2: tmux config ────────────────────────────────────────────────────
# .tmux.conf is on container filesystem — recreate on every start.
#
# NOTE (2026-04-24, #60): tmux is no longer required for agent SPAWNING —
# agents are spawned via the Agent tool (team_name + name) from the team-lead
# Claude Code session. The .tmux.conf + tmux-apex launcher below are kept
# purely for HUMAN terminal use: PO SSH-in attaches a persistent multi-pane
# shell session. If PO access goes away (or switches to a plain shell), these
# two blocks can be removed without affecting agent lifecycle.
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

# ── Step 9a3: tmux-apex launcher (human-terminal only, post-#60) ─────────────
# Human-use: PO runs `tmux-apex` from SSH to attach/create a named session.
# NOT used by agent spawn path — that now routes through the Agent tool.
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

# ── Step 10: Drop privileges and exec ──────────────────────────────────────────
exec gosu "${CONTAINER_USER}" "$@"
