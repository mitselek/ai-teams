#!/usr/bin/env bash
# entrypoint-hr-devs.sh (*FR:Brunel*)
#
# Runs as root. Prepares the hr-devs container before handing off to ai-teams.
#
# Steps:
#  0.   Fix hostname resolution (network_mode: host only)
#  0b.  WARP TLS CA → system CA store (no-op if /opt/warp-ca.pem not mounted)
#  1.   Fix volume ownership (Docker creates named volumes as root)
#  2.   Validate required env vars
#  3a.  Clone/pull hr-platform repo (main working repo)
#  3b.  Clone/pull dev-toolkit repo (MCP servers + standards)
#  4a.  Build Jira MCP server if dist/ missing
#  4b.  Build Dynamics MCP server if dist/ missing
#  5.   npm ci in hr-platform/conversations (if package.json exists)
#  6.   Runtime validation gates
#  7.   Persist env vars to .bashrc (covers SSH / interactive shells)
#  7b.  tmux config + auto-tmux on SSH login
#  7c.  Git attribution
#  8.   Claude settings.json (first run only)
#  8b.  mcp.json (first run only — Jira + Dynamics)
#  8c.  statusline-command.sh registration in settings.json
#  9.   SSH key install + start sshd on port 2225
#  10.  Drop privileges and exec
#
# Required env vars:
#   GITHUB_TOKEN       — PAT with repo scope for Eesti-Raudtee org
#   CLOUDFLARE_API_TOKEN  — for Wrangler deploys and D1 operations
#   CLOUDFLARE_ACCOUNT_ID — for Wrangler account targeting
#   ATLASSIAN_EMAIL       — for Jira MCP
#   ATLASSIAN_API_TOKEN   — for Jira MCP
#
# Optional env vars:
#   ANTHROPIC_API_KEY  — leave blank if using OAuth (standard)
#   REPO_URL           — hr-platform URL (default: github.com/Eesti-Raudtee/hr-platform.git)
#   TOOLKIT_URL        — dev-toolkit URL (default: github.com/Eesti-Raudtee/dev-toolkit.git)
#   TEAM_NAME          — team name (default: hr-devs)
#   NODE_EXTRA_CA_CERTS — path to WARP CA cert (set in compose on WARP hosts)
#   SSH_PUBLIC_KEY     — public key for ai-teams SSH access (port 2225)
#   SSH_PUBLIC_KEY_2   — additional key (supports SSH_PUBLIC_KEY_N pattern)
set -e

CONTAINER_USER="ai-teams"
CONTAINER_UID="1000"
CONTAINER_GID="1000"
HOME_DIR="/home/ai-teams"
CLAUDE_DIR="${HOME_DIR}/.claude"
WORKSPACE="${HOME_DIR}/workspace"

REPO_URL="${REPO_URL:-https://github.com/Eesti-Raudtee/hr-platform.git}"
REPO_DIR="${WORKSPACE}/hr-platform"

TOOLKIT_URL="${TOOLKIT_URL:-https://github.com/Eesti-Raudtee/dev-toolkit.git}"
TOOLKIT_DIR="${WORKSPACE}/dev-toolkit"

JIRA_MCP_DIR="${TOOLKIT_DIR}/jira-mcp-server"
DYNAMICS_MCP_DIR="${TOOLKIT_DIR}/mcp/dynamics"

CONVERSATIONS_DIR="${REPO_DIR}/conversations"

ATLASSIAN_BASE_URL="${ATLASSIAN_BASE_URL:-https://eestiraudtee.atlassian.net}"

# ── Helpers ───────────────────────────────────────────────────────────────────

clone_or_pull() {
    local repo_url="$1"
    local target_dir="$2"
    local auth_url
    auth_url=$(echo "$repo_url" | sed "s|https://|https://${GITHUB_TOKEN}@|")

    if [ -d "${target_dir}/.git" ]; then
        echo "[entrypoint] ${target_dir} exists — running git pull..."
        gosu "${CONTAINER_USER}" git -C "${target_dir}" remote set-url origin "${auth_url}"
        gosu "${CONTAINER_USER}" git -C "${target_dir}" pull --ff-only || {
            echo "[entrypoint] WARNING: git pull failed (non-fast-forward or network). Using existing state."
        }
    else
        echo "[entrypoint] First run — cloning ${repo_url} to ${target_dir}..."
        mkdir -p "${target_dir}"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "${target_dir}"
        gosu "${CONTAINER_USER}" git clone "${auth_url}" "${target_dir}"
    fi
}

build_mcp_server() {
    local server_dir="$1"
    local name="$2"
    if [ -d "${server_dir}" ] && [ ! -d "${server_dir}/dist" ]; then
        echo "[entrypoint] Building ${name} MCP server..."
        gosu "${CONTAINER_USER}" bash -c "cd '${server_dir}' && npm ci && npm run build" 2>&1 | tail -5
        echo "[entrypoint] ${name} MCP server built."
    elif [ -d "${server_dir}/dist" ]; then
        echo "[entrypoint] ${name} MCP server dist/ already exists — skipping build."
    else
        echo "[entrypoint] WARNING: ${name} MCP server directory not found: ${server_dir}"
    fi
}

# ── Step 0: Fix hostname resolution ───────────────────────────────────────────
if ! grep -q 'hr-devs' /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 hr-devs" >> /etc/hosts
fi

# ── Step 0b: WARP TLS CA ──────────────────────────────────────────────────────
WARP_CA="/opt/warp-ca.pem"
if [ -f "$WARP_CA" ]; then
    cp "$WARP_CA" /usr/local/share/ca-certificates/warp-ca.crt
    update-ca-certificates --fresh > /dev/null 2>&1
    echo "[entrypoint] WARP CA added to system CA store."
fi

# ── Step 1: Fix volume ownership ──────────────────────────────────────────────
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

# ── Step 2: Validate required env vars ────────────────────────────────────────
MISSING=""
[ -z "${GITHUB_TOKEN:-}" ]            && MISSING="${MISSING} GITHUB_TOKEN"
[ -z "${CLOUDFLARE_API_TOKEN:-}" ]    && MISSING="${MISSING} CLOUDFLARE_API_TOKEN"
[ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]   && MISSING="${MISSING} CLOUDFLARE_ACCOUNT_ID"
[ -z "${ATLASSIAN_EMAIL:-}" ]         && MISSING="${MISSING} ATLASSIAN_EMAIL"
[ -z "${ATLASSIAN_API_TOKEN:-}" ]     && MISSING="${MISSING} ATLASSIAN_API_TOKEN"
if [ -n "$MISSING" ]; then
    echo "ERROR: Missing required env vars:${MISSING}" >&2
    exit 1
fi

# ── Step 3a: Clone/pull hr-platform ───────────────────────────────────────────
clone_or_pull "$REPO_URL" "$REPO_DIR"

# ── Step 3b: Clone/pull dev-toolkit ───────────────────────────────────────────
clone_or_pull "$TOOLKIT_URL" "$TOOLKIT_DIR"

# ── Step 4a: Build Jira MCP server ────────────────────────────────────────────
build_mcp_server "$JIRA_MCP_DIR" "Jira"

# ── Step 4b: Build Dynamics MCP server ────────────────────────────────────────
build_mcp_server "$DYNAMICS_MCP_DIR" "Dynamics"

# ── Step 5: npm ci in hr-platform/conversations ───────────────────────────────
if [ -f "${CONVERSATIONS_DIR}/package.json" ]; then
    echo "[entrypoint] Running npm ci in conversations/..."
    gosu "${CONTAINER_USER}" npm --prefix "${CONVERSATIONS_DIR}" ci 2>&1 | tail -5
    echo "[entrypoint] npm ci complete."
else
    echo "[entrypoint] No package.json in conversations/ — skipping npm ci."
fi

# ── Step 6: Runtime validation gates ──────────────────────────────────────────
echo "[entrypoint] Runtime validation:"

NODE_VERSION=$(node --version 2>&1 | grep -oP '\d+' | head -1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "  FAIL: Node.js v${NODE_VERSION} < 20 — aborting." >&2
    exit 1
fi
echo "  OK: Node.js v${NODE_VERSION}"

if ! command -v wrangler >/dev/null 2>&1; then
    echo "  FAIL: wrangler not found — aborting." >&2
    exit 1
fi
echo "  OK: wrangler $(wrangler --version 2>&1 | head -1)"

if [ -f "${HOME_DIR}/.local/bin/claude" ]; then
    echo "  OK: claude (native install at ~/.local/bin/claude)"
elif command -v claude >/dev/null 2>&1; then
    echo "  OK: claude available"
else
    echo "  WARN: claude not found in PATH. OAuth credentials may still be in volume."
fi

if [ -d "${REPO_DIR}/.git" ]; then
    echo "  OK: hr-platform repo"
else
    echo "  FAIL: hr-platform repo missing — aborting." >&2
    exit 1
fi

if [ -d "${TOOLKIT_DIR}/.git" ]; then
    echo "  OK: dev-toolkit repo"
else
    echo "  FAIL: dev-toolkit repo missing — aborting." >&2
    exit 1
fi

if [ -d "${JIRA_MCP_DIR}/dist" ]; then
    echo "  OK: Jira MCP server built"
else
    echo "  WARN: Jira MCP server dist/ missing — Jira tools unavailable."
fi

if [ -d "${DYNAMICS_MCP_DIR}/dist" ]; then
    echo "  OK: Dynamics MCP server built"
else
    echo "  WARN: Dynamics MCP server dist/ missing — Dynamics tools unavailable."
fi

if [ -d "/home/ai-teams/dynamics-data" ] && [ "$(ls /home/ai-teams/dynamics-data/*.json 2>/dev/null | wc -l)" -gt 0 ]; then
    echo "  OK: Dynamics data ($(ls /home/ai-teams/dynamics-data/*.json | wc -l) JSON files)"
else
    echo "  WARN: Dynamics data not found at /home/ai-teams/dynamics-data — Dynamics MCP will return empty results."
fi

echo "[entrypoint] All gates passed. Starting..."

# ── Step 7: Persist env vars to .bashrc ───────────────────────────────────────
BASHRC="${HOME_DIR}/.bashrc"

declare -A SHELL_VARS=(
    [HOME]="/home/ai-teams"
    [TZ]="Europe/Tallinn"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-1}"
    [GITHUB_TOKEN]="${GITHUB_TOKEN}"
    [TEAM_NAME]="${TEAM_NAME:-hr-devs}"
    [CLAUDE_ENV_ID]="HR-DEVS"
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
    [CLOUDFLARE_API_TOKEN]="${CLOUDFLARE_API_TOKEN}"
    [CLOUDFLARE_ACCOUNT_ID]="${CLOUDFLARE_ACCOUNT_ID}"
    [ATLASSIAN_BASE_URL]="${ATLASSIAN_BASE_URL}"
    [ATLASSIAN_EMAIL]="${ATLASSIAN_EMAIL}"
    [ATLASSIAN_API_TOKEN]="${ATLASSIAN_API_TOKEN}"
)

if [ -n "${NODE_EXTRA_CA_CERTS:-}" ]; then
    SHELL_VARS[NODE_EXTRA_CA_CERTS]="${NODE_EXTRA_CA_CERTS}"
fi

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

# Vite port: apex-research uses 5173 on the host (network_mode:host = shared ports).
# hr-devs Vite must use 5178. Document the start commands clearly.
sed -i "/^export VITE_PORT=/d" "$BASHRC"
echo "export VITE_PORT=5178" >> "$BASHRC"
echo "# To start Vite on the correct port: npm run dev -- --port \$VITE_PORT" >> "$BASHRC"
echo "# Or: npm run local:start  (uses wrangler dev, check wrangler.jsonc for port)" >> "$BASHRC"

# ── Step 7b: tmux config + auto-tmux on SSH login ────────────────────────────
# NOTE (2026-04-24, #60): tmux here is HUMAN-TERMINAL scaffolding only.
# Agent spawning no longer uses tmux panes — agents spawn via the Agent tool
# (team_name + name) from the team-lead Claude Code session, not via
# `tmux send-keys`. The auto-tmux block below + apply-layout.sh remain useful
# for PO SSH-in (persistent shell, pre-arranged panes). If the team drops
# human SSH access, this entire step can be removed along with the tmux
# install in the Dockerfile. See issue #60.
cat > "${HOME_DIR}/.tmux.conf" << 'TMUX_EOF'
set -g default-terminal "tmux-256color"
set -gq utf8 on
set -gq status-utf8 on
set -g mouse on
set -g history-limit 50000
set -g status-interval 5
TMUX_EOF
chown "${CONTAINER_UID}:${CONTAINER_GID}" "${HOME_DIR}/.tmux.conf"

# Auto-tmux + auto-cd on SSH login.
# Path 1: no session — create layout + start claude.
# Path 2/3: session exists (detached or attached) — just attach.
sed -i '/^# auto-tmux:/,/^fi$/{d}' "${BASHRC}"
cat >> "${BASHRC}" << 'AUTOTMUX_EOF'
# auto-tmux: attach or create session on SSH login
if [ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]; then
    cd /home/ai-teams/workspace/hr-platform/conversations
    TMUX_SESSION="hr-devs"
    LAYOUT_SCRIPT="$HOME/workspace/hr-platform/.claude/teams/hr-devs/apply-layout.sh"
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux new-session -d -s "$TMUX_SESSION" -c /home/ai-teams/workspace/hr-platform/conversations
        if [ -f "$LAYOUT_SCRIPT" ]; then
            bash "$LAYOUT_SCRIPT" "$TMUX_SESSION"
        fi
        tmux send-keys -t "$TMUX_SESSION" "claude" Enter
    fi
    exec tmux -u attach-session -t "$TMUX_SESSION"
fi
AUTOTMUX_EOF

# ── Step 7c: Git attribution ──────────────────────────────────────────────────
GIT_USER_NAME="${GIT_USER_NAME:-hr-devs}"
GIT_USER_EMAIL="${GIT_USER_EMAIL:-mihkel.putrinsh@evr.ee}"
gosu "${CONTAINER_USER}" git config --global user.name "${GIT_USER_NAME}"
gosu "${CONTAINER_USER}" git config --global user.email "${GIT_USER_EMAIL}"

# ── Step 8: Claude settings.json (first run only) ─────────────────────────────
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
STATUSLINE_SCRIPT="/home/ai-teams/workspace/hr-platform/.claude/statusline-command.sh"

if [ ! -f "$SETTINGS_FILE" ]; then
    mkdir -p "${CLAUDE_DIR}"
    cat > "$SETTINGS_FILE" << SETTINGS_EOF
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "includeCoAuthoredBy": false,
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Read", "Glob", "Grep", "Edit", "Write", "Bash",
      "WebFetch(domain:github.com)", "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:eestiraudtee.atlassian.net)", "WebFetch(domain:cloudflare.com)"
    ],
    "deny": [
      "Bash(rm -rf /)", "Bash(git push --force:*)", "Bash(git reset --hard:*)"
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "bash ${STATUSLINE_SCRIPT}"
  }
}
SETTINGS_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SETTINGS_FILE"
    echo "[entrypoint] Claude settings.json created."
else
    # Ensure statusLine is present even if settings.json already exists
    # (idempotent: only adds if missing)
    if ! grep -q 'statusLine' "$SETTINGS_FILE" 2>/dev/null; then
        echo "[entrypoint] WARNING: settings.json exists but missing statusLine — add manually per runbook §13."
    fi
fi

# ── Step 8b: mcp.json (first run only) ────────────────────────────────────────
MCP_FILE="${CLAUDE_DIR}/mcp.json"
if [ ! -f "$MCP_FILE" ]; then
    mkdir -p "${CLAUDE_DIR}"
    cat > "$MCP_FILE" << MCP_EOF
{
  "mcpServers": {
    "jira": {
      "command": "node",
      "args": ["/home/ai-teams/workspace/dev-toolkit/jira-mcp-server/dist/index.js"],
      "env": {
        "ATLASSIAN_BASE_URL": "${ATLASSIAN_BASE_URL}",
        "ATLASSIAN_EMAIL": "${ATLASSIAN_EMAIL}",
        "ATLASSIAN_API_TOKEN": "${ATLASSIAN_API_TOKEN}"
      }
    },
    "dynamics": {
      "command": "node",
      "args": ["/home/ai-teams/workspace/dev-toolkit/mcp/dynamics/dist/index.js"],
      "env": {
        "DYNAMICS_DATA_DIR": "/home/ai-teams/dynamics-data"
      }
    }
  }
}
MCP_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$MCP_FILE"
    echo "[entrypoint] mcp.json created (Jira + Dynamics)."
fi

# ── Step 9: SSH setup ──────────────────────────────────────────────────────────
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
    mkdir -p "${HOME_DIR}/.ssh"
    printf "%b" "$KEYS" > "${HOME_DIR}/.ssh/authorized_keys"
    chmod 700 "${HOME_DIR}/.ssh"
    chmod 600 "${HOME_DIR}/.ssh/authorized_keys"
    chown -R "${CONTAINER_UID}:${CONTAINER_GID}" "${HOME_DIR}/.ssh"
    echo "[entrypoint] ${KEY_COUNT} SSH public key(s) installed for ${CONTAINER_USER}."
    /usr/sbin/sshd -p 2225
    echo "[entrypoint] sshd started on port 2225."
else
    echo "[entrypoint] WARNING: No SSH_PUBLIC_KEY* vars set — SSH access disabled."
fi

# ── Step 10: Drop privileges and exec ─────────────────────────────────────────
exec gosu "${CONTAINER_USER}" "$@"
