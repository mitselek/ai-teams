#!/usr/bin/env bash
# entrypoint-backlog-triage.sh (*FR:Brunel*)
#
# Runs as root. Prepares the backlog-triage container before handing off to ai-teams.
#
# This is a simplified entrypoint — no Wrangler, no Dynamics, no Vite port.
# The team only reads code and talks to Jira.
#
# Steps:
#  0.   Fix hostname resolution (network_mode: host only)
#  0b.  WARP TLS CA → system CA store (no-op if /opt/warp-ca.pem not mounted)
#  1.   Fix volume ownership (Docker creates named volumes as root)
#  2.   Validate required env vars (GITHUB_TOKEN, ATLASSIAN_EMAIL, ATLASSIAN_API_TOKEN)
#  3a.  Clone/pull hr-platform repo (read target: code + git history)
#  3b.  Clone/pull dev-toolkit repo (source for Jira MCP server)
#  4.   Build Jira MCP server if dist/ missing
#  5.   Runtime validation gates
#  6.   Persist env vars to .bashrc (covers SSH / interactive shells)
#  7.   tmux config + auto-tmux on SSH login (session: backlog-triage)
#  8.   Git attribution
#  9.   Claude settings.json (first run only — no Wrangler/Cloudflare in allow list)
#  9b.  mcp.json (first run only — Jira MCP only, no Dynamics)
#  10.  SSH key install + start sshd on port 2226
#  11.  Drop privileges and exec
#
# Required env vars:
#   GITHUB_TOKEN         — PAT with read access to Eesti-Raudtee org (clone + gh CLI)
#   ATLASSIAN_EMAIL      — Atlassian account email for Jira MCP
#   ATLASSIAN_API_TOKEN  — Atlassian API token for Jira MCP
#
# Optional env vars:
#   ANTHROPIC_API_KEY    — leave blank if using OAuth (standard on RC server)
#   REPO_URL             — hr-platform URL (default: github.com/Eesti-Raudtee/hr-platform.git)
#   TOOLKIT_URL          — dev-toolkit URL (default: github.com/Eesti-Raudtee/dev-toolkit.git)
#   ATLASSIAN_BASE_URL   — Jira base URL (default: https://eestiraudtee.atlassian.net)
#   TEAM_NAME            — team name written into env (default: backlog-triage)
#   GIT_USER_NAME        — git attribution name (default: backlog-triage)
#   GIT_USER_EMAIL       — git attribution email
#   NODE_EXTRA_CA_CERTS  — path to WARP CA cert (set in compose on WARP hosts)
#   SSH_PUBLIC_KEY       — public key for ai-teams SSH access (port 2226)
#   SSH_PUBLIC_KEY_2     — additional key (supports SSH_PUBLIC_KEY_N pattern)
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

ATLASSIAN_BASE_URL="${ATLASSIAN_BASE_URL:-https://eestiraudtee.atlassian.net}"

# ── Helpers ───────────────────────────────────────────────────────────────────

# clone_or_pull: If the target dir has a .git, pull. Otherwise, clone.
# Injects GITHUB_TOKEN into the URL so private org repos are accessible.
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

# build_mcp_server: Build a TypeScript MCP server if dist/ not present.
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
# network_mode: host means the container shares the host's network stack.
# The hostname 'backlog-triage' won't resolve unless we add it to /etc/hosts.
if ! grep -q 'backlog-triage' /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 backlog-triage" >> /etc/hosts
fi

# ── Step 0b: WARP TLS CA ──────────────────────────────────────────────────────
# Cloudflare WARP intercepts HTTPS and re-signs with a corporate CA.
# Without this cert in the system store, curl/apt inside the container fail.
# The cert is bind-mounted from the host at /opt/warp-ca.pem (read-only).
# NODE_EXTRA_CA_CERTS (set in compose) handles Node.js separately — Node does
# not use the system CA store.
WARP_CA="/opt/warp-ca.pem"
if [ -f "$WARP_CA" ]; then
    cp "$WARP_CA" /usr/local/share/ca-certificates/warp-ca.crt
    update-ca-certificates --fresh > /dev/null 2>&1
    echo "[entrypoint] WARP CA added to system CA store."
else
    echo "[entrypoint] No WARP CA at ${WARP_CA} — skipping (non-WARP host or not mounted)."
fi

# ── Step 1: Fix volume ownership ──────────────────────────────────────────────
# Docker creates named volumes owned by root. Fix before gosu drops to ai-teams.
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
# Fail fast — better to abort here than to have agents fail mid-task.
# No Cloudflare vars needed: this team does not deploy, only reads.
MISSING=""
[ -z "${GITHUB_TOKEN:-}" ]           && MISSING="${MISSING} GITHUB_TOKEN"
[ -z "${ATLASSIAN_EMAIL:-}" ]        && MISSING="${MISSING} ATLASSIAN_EMAIL"
[ -z "${ATLASSIAN_API_TOKEN:-}" ]    && MISSING="${MISSING} ATLASSIAN_API_TOKEN"
if [ -n "$MISSING" ]; then
    echo "ERROR: Missing required env vars:${MISSING}" >&2
    exit 1
fi

# ── Step 3a: Clone/pull hr-platform ───────────────────────────────────────────
# hr-platform is the read target: git history, commits, codebase.
clone_or_pull "$REPO_URL" "$REPO_DIR"

# ── Step 3b: Clone/pull dev-toolkit ───────────────────────────────────────────
# dev-toolkit contains the Jira MCP server source.
clone_or_pull "$TOOLKIT_URL" "$TOOLKIT_DIR"

# ── Step 4: Build Jira MCP server ─────────────────────────────────────────────
# No Dynamics MCP — this team does not need Dynamics data.
build_mcp_server "$JIRA_MCP_DIR" "Jira"

# ── Step 5: Runtime validation gates ──────────────────────────────────────────
echo "[entrypoint] Runtime validation:"

# Node.js must be >= 20 (Claude Code requirement).
NODE_VERSION=$(node --version 2>&1 | grep -oP '\d+' | head -1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "  FAIL: Node.js v${NODE_VERSION} < 20 — aborting." >&2
    exit 1
fi
echo "  OK: Node.js v${NODE_VERSION}"

# gh CLI — required for Archivist's GitHub issue/PR searches.
if ! command -v gh >/dev/null 2>&1; then
    echo "  FAIL: gh CLI not found — aborting." >&2
    exit 1
fi
echo "  OK: gh $(gh --version 2>&1 | head -1)"

# Claude Code — warn if missing (OAuth may still be in volume).
if [ -f "${HOME_DIR}/.local/bin/claude" ]; then
    echo "  OK: claude (native install at ~/.local/bin/claude)"
elif command -v claude >/dev/null 2>&1; then
    echo "  OK: claude available"
else
    echo "  WARN: claude not found in PATH. OAuth credentials may still be in volume."
fi

# hr-platform repo — must exist for the team to do anything.
if [ -d "${REPO_DIR}/.git" ]; then
    echo "  OK: hr-platform repo"
else
    echo "  FAIL: hr-platform repo missing — aborting." >&2
    exit 1
fi

# dev-toolkit repo — needed for Jira MCP server.
if [ -d "${TOOLKIT_DIR}/.git" ]; then
    echo "  OK: dev-toolkit repo"
else
    echo "  FAIL: dev-toolkit repo missing — aborting." >&2
    exit 1
fi

# Jira MCP server must be built — all agents depend on it.
if [ -d "${JIRA_MCP_DIR}/dist" ]; then
    echo "  OK: Jira MCP server built"
else
    echo "  WARN: Jira MCP server dist/ missing — Jira tools unavailable."
fi

echo "[entrypoint] All gates passed. Starting..."

# ── Step 6: Persist env vars to .bashrc ───────────────────────────────────────
# SSH sessions (and interactive shells) don't inherit docker-compose env vars.
# Writing to .bashrc ensures agents always have the required vars available.
BASHRC="${HOME_DIR}/.bashrc"

# PATH for native Claude install (~/.local/bin).
if ! grep -q '\.local/bin' "$BASHRC" 2>/dev/null; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$BASHRC"
fi

# Write each env var — remove stale value first, then append.
declare -A SHELL_VARS=(
    [HOME]="/home/ai-teams"
    [TZ]="Europe/Tallinn"
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-1}"
    [GITHUB_TOKEN]="${GITHUB_TOKEN}"
    [TEAM_NAME]="${TEAM_NAME:-backlog-triage}"
    [CLAUDE_ENV_ID]="BACKLOG-TRIAGE"
    [ATLASSIAN_BASE_URL]="${ATLASSIAN_BASE_URL}"
    [ATLASSIAN_EMAIL]="${ATLASSIAN_EMAIL}"
    [ATLASSIAN_API_TOKEN]="${ATLASSIAN_API_TOKEN}"
)

# NODE_EXTRA_CA_CERTS only written if set (avoids writing empty path on non-WARP hosts).
if [ -n "${NODE_EXTRA_CA_CERTS:-}" ]; then
    SHELL_VARS[NODE_EXTRA_CA_CERTS]="${NODE_EXTRA_CA_CERTS}"
fi

for var in "${!SHELL_VARS[@]}"; do
    val="${SHELL_VARS[$var]}"
    if [ -n "$val" ]; then
        sed -i "/^export ${var}=/d" "$BASHRC"
        echo "export ${var}=${val}" >> "$BASHRC"
    fi
done

# ── Step 7: tmux config + auto-tmux on SSH login ──────────────────────────────
cat > "${HOME_DIR}/.tmux.conf" << 'TMUX_EOF'
set -g default-terminal "tmux-256color"
set -gq utf8 on
set -gq status-utf8 on
set -g mouse on
set -g history-limit 50000
set -g status-interval 5
TMUX_EOF
chown "${CONTAINER_UID}:${CONTAINER_GID}" "${HOME_DIR}/.tmux.conf"

# Auto-tmux on SSH login.
# If no session: create named session + start claude.
# If session exists (detached or attached): attach.
sed -i '/^# auto-tmux:/,/^fi$/{d}' "${BASHRC}"
cat >> "${BASHRC}" << 'AUTOTMUX_EOF'
# auto-tmux: attach or create session on SSH login
if [ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]; then
    cd /home/ai-teams/workspace/hr-platform
    TMUX_SESSION="backlog-triage"
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        tmux new-session -d -s "$TMUX_SESSION" -c /home/ai-teams/workspace/hr-platform
        tmux send-keys -t "$TMUX_SESSION" "claude" Enter
    fi
    exec tmux -u attach-session -t "$TMUX_SESSION"
fi
AUTOTMUX_EOF

# ── Step 8: Git attribution ───────────────────────────────────────────────────
# Commits from agents are attributed to the team name, not a real person.
# Required even though this team is read-heavy — agents may write output files.
GIT_USER_NAME_VAL="${GIT_USER_NAME:-backlog-triage}"
GIT_USER_EMAIL_VAL="${GIT_USER_EMAIL:-mihkel.putrinsh@evr.ee}"
gosu "${CONTAINER_USER}" git config --global user.name "${GIT_USER_NAME_VAL}"
gosu "${CONTAINER_USER}" git config --global user.email "${GIT_USER_EMAIL_VAL}"

# ── Step 9: Claude settings.json (first run only) ─────────────────────────────
# Only written if the file doesn't already exist (volume persists it across restarts).
# No Wrangler or Cloudflare tools in the allow list — this team doesn't deploy.
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
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
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:eestiraudtee.atlassian.net)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(git push --force:*)",
      "Bash(git reset --hard:*)"
    ]
  }
}
SETTINGS_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$SETTINGS_FILE"
    echo "[entrypoint] Claude settings.json created."
fi

# ── Step 9b: mcp.json (first run only) ────────────────────────────────────────
# Jira MCP only. No Dynamics — this team doesn't need HR entity data.
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
    }
  }
}
MCP_EOF
    chown "${CONTAINER_UID}:${CONTAINER_GID}" "$MCP_FILE"
    echo "[entrypoint] mcp.json created (Jira only)."
fi

# ── Step 10: SSH setup ─────────────────────────────────────────────────────────
# Install public keys from SSH_PUBLIC_KEY, SSH_PUBLIC_KEY_2, ... env vars.
# All keys with that prefix pattern are accepted.
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
    /usr/sbin/sshd -p 2226
    echo "[entrypoint] sshd started on port 2226."
else
    echo "[entrypoint] WARNING: No SSH_PUBLIC_KEY* vars set — SSH access disabled."
fi

# ── Step 11: Drop privileges and exec ─────────────────────────────────────────
# gosu is the POSIX-correct alternative to su/sudo for privilege drop from init.
# Replaces the current process — PID 1 becomes ai-teams, not root.
exec gosu "${CONTAINER_USER}" "$@"
