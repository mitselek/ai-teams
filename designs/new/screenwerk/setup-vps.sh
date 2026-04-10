#!/usr/bin/env bash
# setup-vps.sh — Provision a Hostinger VPS for the screenwerk-dev AI team
#
# Target: srv1559865.hstgr.cloud (Debian)
# Run as: root
# Idempotent: safe to run multiple times
#
# (*FR:Brunel*)

set -euo pipefail

echo "=== screenwerk-dev VPS setup ==="

# ── 1. System packages ──────────────────────────────────────────────────────────
echo "[1/12] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Essential tools ──────────────────────────────────────────────────────────
echo "[2/12] Installing essential tools..."
apt-get install -y -qq git curl tmux jq ca-certificates gnupg locales

# ── 3. Locale ────────────────────────────────────────────────────────────────────
# Generate en_US.UTF-8 if not already present
echo "[3/12] Configuring locale..."
if ! locale -a 2>/dev/null | grep -q "en_US.utf8"; then
    sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen
    locale-gen en_US.UTF-8
fi
update-locale LANG=en_US.UTF-8
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# ── 4. Node.js 22 LTS ───────────────────────────────────────────────────────────
# Install from binary tarball (same pattern as evr-ai-base Dockerfile)
echo "[4/12] Installing Node.js 22 LTS..."
NODE_VERSION="22.14.0"
NODE_DIR="/usr/local/lib/nodejs"

if node --version 2>/dev/null | grep -q "v${NODE_VERSION}"; then
    echo "  Node.js ${NODE_VERSION} already installed, skipping."
else
    ARCH=$(dpkg --print-architecture)
    case "$ARCH" in
        amd64) NODE_ARCH="x64" ;;
        arm64) NODE_ARCH="arm64" ;;
        *) echo "ERROR: Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    TARBALL="node-v${NODE_VERSION}-linux-${NODE_ARCH}.tar.xz"
    curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${TARBALL}" -o "/tmp/${TARBALL}"
    mkdir -p "${NODE_DIR}"
    tar -xJf "/tmp/${TARBALL}" -C "${NODE_DIR}" --strip-components=1
    rm -f "/tmp/${TARBALL}"

    # Symlink node, npm, npx into /usr/local/bin (idempotent)
    for bin in node npm npx; do
        ln -sf "${NODE_DIR}/bin/${bin}" "/usr/local/bin/${bin}"
    done
    echo "  Installed Node.js $(node --version)"
fi

# ── 5. Claude Code ───────────────────────────────────────────────────────────────
echo "[5/12] Installing Claude Code..."
if command -v claude >/dev/null 2>&1; then
    echo "  Claude Code already installed, upgrading..."
fi
npm install -g @anthropic-ai/claude-code 2>&1 | tail -1
# Ensure claude is in PATH (npm global bin may not be /usr/local/bin)
NPM_BIN=$(npm config get prefix)/bin
if [ -f "${NPM_BIN}/claude" ] && [ ! -f "/usr/local/bin/claude" ]; then
    ln -sf "${NPM_BIN}/claude" /usr/local/bin/claude
fi
echo "  Claude Code: $(claude --version 2>/dev/null || echo 'installed')"

# ── 6. GitHub CLI ────────────────────────────────────────────────────────────────
echo "[6/12] Installing GitHub CLI..."
if command -v gh >/dev/null 2>&1; then
    echo "  gh already installed: $(gh --version | head -1)"
else
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        | dd of=/etc/apt/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
    chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list
    apt-get update -qq
    apt-get install -y -qq gh
    echo "  Installed: $(gh --version | head -1)"
fi

# ── 7. Create ai-teams user ─────────────────────────────────────────────────────
echo "[7/12] Creating ai-teams user..."
CONTAINER_USER="ai-teams"
HOME_DIR="/home/${CONTAINER_USER}"

if id "${CONTAINER_USER}" >/dev/null 2>&1; then
    echo "  User ${CONTAINER_USER} already exists."
else
    useradd -m -s /bin/bash "${CONTAINER_USER}"
    # Unlock account for pubkey auth (no password set)
    passwd -u "${CONTAINER_USER}" 2>/dev/null || usermod -p '*' "${CONTAINER_USER}"
    echo "  Created user ${CONTAINER_USER} (uid $(id -u ${CONTAINER_USER}))."
fi

# ── 8. SSH setup for ai-teams ────────────────────────────────────────────────────
echo "[8/12] Setting up SSH for ai-teams..."
SSH_DIR="${HOME_DIR}/.ssh"
AUTH_KEYS="${SSH_DIR}/authorized_keys"
PO_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAILYbEeEZ69iRYtoZIHj+ydAoLm2f7dvDZi+KVKsc0+TX mihkel.putrinsh@evr.ee"

mkdir -p "${SSH_DIR}"
chmod 700 "${SSH_DIR}"

# Add PO key if not already present
if ! grep -qF "${PO_KEY}" "${AUTH_KEYS}" 2>/dev/null; then
    echo "${PO_KEY}" >> "${AUTH_KEYS}"
    echo "  PO public key added."
else
    echo "  PO public key already present."
fi

chmod 600 "${AUTH_KEYS}"
chown -R "${CONTAINER_USER}:${CONTAINER_USER}" "${SSH_DIR}"

# ── 9. Harden sshd ──────────────────────────────────────────────────────────────
echo "[9/12] Hardening sshd..."
SSHD_CONFIG="/etc/ssh/sshd_config"

# Disable root login
sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' "${SSHD_CONFIG}"
# Disable password auth
sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' "${SSHD_CONFIG}"
# Enable pubkey auth
sed -i 's/^#*PubkeyAuthentication .*/PubkeyAuthentication yes/' "${SSHD_CONFIG}"

echo "  sshd hardened: root login disabled, password auth disabled, pubkey only."

# ── 10. Configure ai-teams .bashrc ───────────────────────────────────────────────
echo "[10/12] Configuring ai-teams environment..."
BASHRC="${HOME_DIR}/.bashrc"

# Add environment variables (idempotent: remove old lines first, then append)
declare -A ENV_VARS=(
    [LANG]="en_US.UTF-8"
    [LC_ALL]="en_US.UTF-8"
    [TERM]="xterm-256color"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="1"
)

for var in "${!ENV_VARS[@]}"; do
    val="${ENV_VARS[$var]}"
    sed -i "/^export ${var}=/d" "${BASHRC}"
    echo "export ${var}=${val}" >> "${BASHRC}"
done

# Ensure /usr/local/bin is in PATH (for node, claude, gh)
if ! grep -q '/usr/local/bin' "${BASHRC}" 2>/dev/null; then
    echo 'export PATH="/usr/local/bin:$PATH"' >> "${BASHRC}"
fi

chown "${CONTAINER_USER}:${CONTAINER_USER}" "${BASHRC}"
echo "  .bashrc configured."

# ── 11. Clone ScreenWerk/ai-team ─────────────────────────────────────────────────
echo "[11/12] Cloning ScreenWerk/ai-team..."
WORKSPACE="${HOME_DIR}/workspace"

if [ -d "${WORKSPACE}/.git" ]; then
    echo "  Repo already cloned. Pulling latest..."
    su - "${CONTAINER_USER}" -c "cd ${WORKSPACE} && git pull && git submodule update --init --recursive"
else
    su - "${CONTAINER_USER}" -c "git clone --recurse-submodules https://github.com/ScreenWerk/ai-team.git ${WORKSPACE}"
fi

# Ensure ownership
chown -R "${CONTAINER_USER}:${CONTAINER_USER}" "${HOME_DIR}"
echo "  Workspace ready at ${WORKSPACE}"

# ── 12. Restart sshd ────────────────────────────────────────────────────────────
echo "[12/12] Restarting sshd..."
systemctl restart sshd
echo "  sshd restarted."

# ── Summary ──────────────────────────────────────────────────────────────────────
echo ""
echo "=== Setup complete ==="
echo ""
echo "Installed:"
echo "  Node.js: $(node --version)"
echo "  npm:     $(npm --version)"
echo "  Claude:  $(claude --version 2>/dev/null || echo 'check PATH')"
echo "  gh:      $(gh --version | head -1)"
echo "  tmux:    $(tmux -V)"
echo "  git:     $(git --version)"
echo ""
echo "User: ai-teams (uid $(id -u ai-teams))"
echo "Workspace: ${WORKSPACE}"
echo "SSH: pubkey only, root login disabled"
echo ""
echo "Next steps:"
echo "  1. SSH in as ai-teams: ssh ai-teams@$(hostname -f)"
echo "  2. Run 'claude' and complete OAuth login"
echo "  3. Set GITHUB_TOKEN if needed for private repos"
echo ""
echo "WARNING: root login is now DISABLED. Make sure you can SSH as ai-teams"
echo "         before closing this session!"
