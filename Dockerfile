# Claude Code Agent Team Container -- Full Isolation (*FR:Brunel*)
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
        tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -snf /usr/share/zoneinfo/Europe/Tallinn /etc/localtime \
    && echo "Europe/Tallinn" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata

# Container user: always 'ai-teams', uid=1000
# Ubuntu 24.04 has GID/UID 1000 = 'ubuntu' -- rename it
RUN \
    groupmod -n ai-teams ubuntu && \
    usermod -l ai-teams -d /home/ai-teams -m ubuntu && \
    # Ensure home dir exists with correct name
    mkdir -p /home/ai-teams && \
    chown 1000:1000 /home/ai-teams

# Install Claude Code globally (Node.js version from npm)
#
# This binary IS the one derived team images run: /usr/local/bin/claude, root-owned.
# Derived images that try to add a native ~/.local/bin/claude on top have failed
# silently in the past (apex Dockerfile.apex), so this layer is the single source
# of the CLI version for every team that FROMs this image.
#
# The `| tail -5` keeps build logs short but makes the RUN exit status tail's, not
# npm's -- a failed install would otherwise produce a GREEN layer with no claude
# (or a stale one) and the failure would only surface after a team is recreated
# onto the new image. dash (/bin/sh) has no `set -o pipefail`, so instead of
# changing SHELL we assert the postcondition directly: the pipeline below fails if
# claude is absent (empty substitution, string compare fails) or the version differs.
# The compare is exact on the first field, not a substring match: a pin of "2.1.25"
# would otherwise be satisfied by an installed "2.1.258". It deliberately ignores
# the " (Claude Code)" suffix, which is cosmetic and upstream's to change.
ARG CLAUDE_VERSION=2.1.258
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_VERSION} 2>&1 | tail -5 \
 && [ "$(claude --version | cut -d' ' -f1)" = "${CLAUDE_VERSION}" ]

ENV HOME=/home/ai-teams
ENV PATH="/usr/local/bin:${PATH}"

# Git identity -- configurable via build args
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
