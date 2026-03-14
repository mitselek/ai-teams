# Claude Code Agent Team Container (*FR:Brunel*)
#
# Purpose: Preserve ~/.claude/ auto-memory across sessions by running Claude
# inside a container with a named volume for the home directory state.
#
# Design principles:
# - Claude binary is mounted from host (no install, always current version)
# - ~/.claude/ is a named volume (survives docker stop/start)
# - Repo is a bind mount (git ops work natively)
# - SSH keys and git config are bind-mounted read-only
# - $HOME inside = /home/michelek (matches host) so lifecycle scripts work unchanged

FROM ubuntu:24.04

# Minimal runtime deps for Claude binary (ELF, needs standard libc)
# + git for repo ops
# + jq for lifecycle scripts (restore-inboxes.sh, persist-inboxes.sh)
# + ssh for git over SSH
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    jq \
    openssh-client \
    ca-certificates \
    curl \
    gosu \
    && rm -rf /var/lib/apt/lists/*

# Create user matching host UID/GID to avoid permission issues with bind mounts
ARG HOST_UID=1000
ARG HOST_GID=1000
ARG HOST_USER=michelek

RUN \
    # Rename existing group if GID already taken, otherwise create it
    if getent group ${HOST_GID} >/dev/null 2>&1; then \
        groupmod -n ${HOST_USER} $(getent group ${HOST_GID} | cut -d: -f1); \
    else \
        groupadd -g ${HOST_GID} ${HOST_USER}; \
    fi && \
    # Create user, or modify existing user with same UID
    if getent passwd ${HOST_UID} >/dev/null 2>&1; then \
        usermod -l ${HOST_USER} -d /home/${HOST_USER} -m $(getent passwd ${HOST_UID} | cut -d: -f1); \
    else \
        useradd -u ${HOST_UID} -g ${HOST_GID} -m -s /bin/bash -d /home/${HOST_USER} ${HOST_USER}; \
    fi

ENV HOME=/home/${HOST_USER}
ENV PATH="/home/${HOST_USER}/.local/bin:${PATH}"

# Entrypoint: fix ownership of the named volume on first run (runs as root, then drops to user)
# This is needed because Docker creates named volumes owned by root before the user exists.
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /home/${HOST_USER}

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
