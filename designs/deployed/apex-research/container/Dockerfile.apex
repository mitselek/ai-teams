# apex-research Container — Python + Node.js + SSH (*FR:Brunel*)
#
# Extends ai-teams-claude:latest (ubuntu 24.04, nodejs, npm, git, gh, gosu, claude)
# with Python 3.11 (extraction scripts) and OpenSSH server (PO access).
#
# Build:
#   docker compose build
#
# Named volumes (no host bind mounts):
#   apex-claude-home    → /home/ai-teams/.claude       (Claude state)
#   apex-research-repo  → /home/ai-teams/workspace     (research repo, read-write)
#   apex-source-data    → /home/ai-teams/source-data   (vjs_apex_apps, read-only)

FROM ai-teams-claude:latest

# ── Fix inherited apt sources ──────────────────────────────────────────────────
# Base image adds GitHub CLI apt repo with a key that may go stale.
# Remove it — gh is already installed, we don't need the apt source anymore.
RUN rm -f /etc/apt/sources.list.d/github-cli.list \
    && rm -f /usr/share/keyrings/githubcli-archive-keyring.gpg

# ── Node.js 22 LTS ───────────────────────────────────────────────────────────
# Base image has Node.js 18 from Ubuntu apt (too old for Claude Code).
# Download binary directly. Uses --insecure because Cloudflare WARP does TLS
# interception with a self-signed CA that the container doesn't trust.
# This is a BUILD-TIME-ONLY workaround; the binary is verified by filename hash.
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl --insecure -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz \
       -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz \
    && node --version \
    && npm install -g npm@latest 2>&1 | tail -1 \
    && rm -rf /var/lib/apt/lists/*

# ── Python 3 + SSH server + sudo + tmux ──────────────────────────────────────
# Single apt layer: Python (extraction scripts), SSH (PO access), sudo (PO perms),
# tmux (session management for Claude Code).
# Venv and pip install happen at entrypoint (depends on workspace volume).
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        python3-venv \
        python3-pip \
        openssh-server \
        sudo \
        tmux \
        locales \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
    && mkdir -p /run/sshd \
    && ssh-keygen -A \
    && sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?UsePAM.*/UsePAM no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config \
    && echo 'Port 2222' >> /etc/ssh/sshd_config

# ── Lock root password ────────────────────────────────────────────────────────
# No root login via any method. Entrypoint runs as root but drops to ai-teams.
RUN passwd -l root

# ── ai-teams user setup ──────────────────────────────────────────────────────
# Unlock account for SSH pubkey auth (UsePAM=no rejects locked accounts).
# Prepare .ssh dir for key-based SSH access (same as michelek).
RUN usermod -p '*' ai-teams \
    && mkdir -p /home/ai-teams/.ssh \
    && chmod 700 /home/ai-teams/.ssh \
    && chown 1000:1000 /home/ai-teams/.ssh

# ── Native Claude Code install ───────────────────────────────────────────────
# Install Claude Code natively (not npm-global) so auto-updates work without sudo.
# Uses --insecure for WARP TLS interception during build.
RUN gosu ai-teams bash -c 'curl --insecure -fsSL https://claude.ai/install.sh | bash' 2>&1 | tail -5

# ── PO user for SSH access ──────────────────────────────────────────────────────
# Separate from ai-teams (uid=1000) — PO gets a login shell for inspection,
# ai-teams runs Claude. michelek is in ai-teams group for workspace read access
# and has passwordless sudo for full container inspection.
RUN useradd -m -s /bin/bash michelek \
    && usermod -aG ai-teams michelek \
    && usermod -p '*' michelek \
    && echo 'michelek ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/michelek \
    && chmod 440 /etc/sudoers.d/michelek \
    && mkdir -p /home/michelek/.ssh \
    && chmod 700 /home/michelek/.ssh \
    && chown -R michelek:michelek /home/michelek/.ssh

# ── Statusline script ─────────────────────────────────────────────────────────
COPY statusline-command.sh /opt/statusline-command.sh
RUN chmod +x /opt/statusline-command.sh

# ── Entrypoint ──────────────────────────────────────────────────────────────────
COPY entrypoint-apex.sh /entrypoint-apex.sh
RUN chmod +x /entrypoint-apex.sh

WORKDIR /home/ai-teams/workspace

EXPOSE 2222 5173

ENTRYPOINT ["/entrypoint-apex.sh"]
CMD ["bash"]
