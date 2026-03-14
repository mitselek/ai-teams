# Claude Code Agent Team Container — Full Isolation (*FR:Brunel*)
#
# Final layout (PO decision 2026-03-14):
#   Container user:  ai-teams  (uid=1000)
#   $HOME:           /home/ai-teams/
#   ~/.claude/:      /home/ai-teams/.claude/   → named volume (auto-memory)
#   Repo:            /home/ai-teams/workspace/ → named volume (git-tracked team config)
#
# Clean separation: auto-memory and repo .claude/ are at different paths.
# No bind mounts to host filesystem (PO requirement).

FROM ubuntu:24.04

# Runtime deps:
# - nodejs/npm: Claude Code runtime
# - git: repo ops (clone, pull, push)
# - jq: lifecycle scripts (restore-inboxes.sh, persist-inboxes.sh)
# - openssh-client: SSH fallback
# - ca-certificates: HTTPS git, npm, and gh CLI
# - gh: GitHub CLI (used by session-start.sh for auto-token, and by teams for gh ops)
# - gosu: privilege drop in entrypoint (root → user, preserving env vars)
# Add GitHub CLI apt repo, then install all deps in one layer
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends \
        nodejs \
        npm \
        git \
        gh \
        jq \
        openssh-client \
        ca-certificates \
        gosu \
    && rm -rf /var/lib/apt/lists/*

# Container user: always 'ai-teams', uid=1000
# Ubuntu 24.04 has GID/UID 1000 = 'ubuntu' — rename it
RUN \
    groupmod -n ai-teams ubuntu && \
    usermod -l ai-teams -d /home/ai-teams -m ubuntu && \
    # Ensure home dir exists with correct name
    mkdir -p /home/ai-teams && \
    chown 1000:1000 /home/ai-teams

# Install Claude Code globally (Node.js version from npm)
ARG CLAUDE_VERSION=latest
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_VERSION} 2>&1 | tail -5

ENV HOME=/home/ai-teams
ENV PATH="/usr/local/bin:${PATH}"

# Git identity — configurable via build args
ARG GIT_USER_NAME=mitselek
ARG GIT_USER_EMAIL=mihkel.putrinsh@gmail.com
RUN git config --global user.name "${GIT_USER_NAME}" && \
    git config --global user.email "${GIT_USER_EMAIL}" && \
    git config --global credential.helper store

# Entrypoint handles:
# 1. Fix ~/.claude/ volume ownership (Docker creates volumes as root)
# 2. git clone (first run) or git pull (subsequent runs) to ~/workspace/
# 3. gosu drop to ai-teams and exec the requested command
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /home/ai-teams/workspace

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
