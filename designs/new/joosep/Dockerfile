# Dockerfile -- joosep personal workbench (*FR:Brunel*)
#
# Self-contained on debian:bookworm-slim. Deliberately does NOT derive from
# ai-teams-claude:latest (the apex lineage), for two reasons:
#   1. apex spends its first two layers UNDOING that base -- stripping a stale
#      GitHub-CLI apt source and replacing Ubuntu's Node 18 with a tarball.
#   2. allerk (the shape this follows) derives from nothing: 773 MB against
#      apex's 2.37 GB.
# The cost, stated so nobody rediscovers it: no shared base means no shared-base
# upgrades, so a toolchain bump has to be made in this image separately. For one
# colleague container that is the right trade; revisit if the fleet grows
# several person-shaped containers.
#
# Build:   docker compose build      (or ./joosep.sh build)
# Ports:   2231 -- SSH only. This container serves nothing else.

FROM debian:bookworm-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Tallinn
ENV LANG=en_US.UTF-8
ENV LC_ALL=en_US.UTF-8

# ── Base packages ─────────────────────────────────────────────────────────────
# curl           -- Node download, Claude native installer
# jq             -- entrypoint JSON manipulation (settings.json, mcp.json)
# git            -- clone/pull the two repos + dev-toolkit
# openssh-server -- SSH on 2231
# tmux           -- HUMAN terminal multiplexing only. Agents spawn via the Agent
#                   tool, not tmux panes (#60). tmux exists so a detached Claude
#                   session survives the SSH connection dropping.
# locales        -- Claude Code needs a UTF-8 locale
# gosu           -- privilege drop without a tty (su/sudo need one)
# sudo           -- see the note at the user-setup layer below [PO-11]
# ca-certificates, gnupg, lsb-release, apt-transport-https -- gh apt repo
#
# WARP note: apt has its own CA handling and does NOT need --insecure here.
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        jq \
        git \
        openssh-server \
        tmux \
        locales \
        gosu \
        sudo \
        tzdata \
        gnupg \
        lsb-release \
        apt-transport-https \
        ca-certificates \
        iproute2 \
        less \
        nano \
        vim-tiny \
    && rm -rf /var/lib/apt/lists/*

RUN sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
    && ln -snf /usr/share/zoneinfo/Europe/Tallinn /etc/localtime \
    && echo "Europe/Tallinn" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata

# ── GitHub CLI ────────────────────────────────────────────────────────────────
# WARP intercepts TLS with a corporate CA the base image does not yet trust, so
# the keyring fetch needs --insecure at BUILD time. The key is verified by what
# it is used for (signing the apt repo), not by the transport.
RUN curl --insecure -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && rm -rf /var/lib/apt/lists/* \
    && gh --version

# ── Node.js 22 LTS ────────────────────────────────────────────────────────────
# Official binary tarball. --insecure for the same WARP reason; the artifact is
# identified by its versioned filename, not by TLS alone.
RUN curl --insecure -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz \
        -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz \
    && node --version \
    && npm install -g npm@latest 2>&1 | tail -1

# ── Lock root ─────────────────────────────────────────────────────────────────
# No root login by any method. The entrypoint runs as root but drops to joosep.
RUN passwd -l root

# ── Container user ────────────────────────────────────────────────────────────
# uid/gid 1000 so named-volume ownership is consistent on mount.
# Password unlocked with '*' (not '!') so pubkey auth works with UsePAM=no.
#
# sudo [PO-11]: granted, matching allerk, whose user is in the sudo group. The
# argument against was reproducibility -- a container whose occupant can
# apt-get install diverges from this Dockerfile. That is weak grounds to break
# precedent, and given that this container is not a security boundary anyway
# (see the design doc §2.8), withholding sudo buys very little while pushing
# every missing package onto the PO. Convention, not a lock: if you install
# something, say so and it goes in this file.
# To withdraw the grant, delete the two sudoers lines below and rebuild.
RUN groupadd -g 1000 joosep \
    && useradd -m -u 1000 -g 1000 -s /bin/bash joosep \
    && usermod -p '*' joosep \
    && usermod -aG sudo joosep \
    && echo 'joosep ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/joosep \
    && chmod 440 /etc/sudoers.d/joosep \
    && mkdir -p /home/joosep/.ssh \
    && chmod 700 /home/joosep/.ssh \
    && chown 1000:1000 /home/joosep/.ssh

# ── sshd ──────────────────────────────────────────────────────────────────────
# Host keys live on the joosep_sshd volume (/etc/ssh/keys), generated once by
# the entrypoint, so they survive image rebuilds.
#
# SetEnv PATH is LOAD-BEARING, not cosmetic. `Connect-Joosep -Session` runs its
# launcher as an ssh REMOTE COMMAND -- a non-interactive, non-login shell. Three
# different PATH sources are in play: .profile/.bashrc for interactive shells,
# the image ENV for `docker exec`, and sshd's own compiled-in PATH for a remote
# command. Debian's .bashrc RETURNS EARLY when not interactive, so it does not
# help there, and ENV does not apply either. SetEnv is the only one of the three
# levers that reaches this case. Without it: `claude: command not found`, but
# ONLY over `ssh host <command>` -- which is exactly the -Session path.
# ~/.local/bin goes FIRST so the native Claude install always wins.
RUN mkdir -p /run/sshd \
    && sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/'                     /etc/ssh/sshd_config \
    && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/'       /etc/ssh/sshd_config \
    && sed -i 's/^#\?KbdInteractiveAuthentication.*/KbdInteractiveAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?UsePAM.*/UsePAM no/'                                       /etc/ssh/sshd_config \
    && sed -i '/^#\?Port /d'                                                    /etc/ssh/sshd_config \
    && sed -i '/^HostKey /d'                                                    /etc/ssh/sshd_config \
    && { \
         echo 'Port 2231'; \
         echo 'HostKey /etc/ssh/keys/ssh_host_ed25519_key'; \
         echo 'HostKey /etc/ssh/keys/ssh_host_rsa_key'; \
         echo 'AuthorizedKeysFile /opt/authorized_keys'; \
         echo 'SetEnv PATH=/home/joosep/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'; \
         echo 'LogLevel VERBOSE'; \
       } >> /etc/ssh/sshd_config

# ── Claude Code -- NATIVE install, and never npm ──────────────────────────────
# Native so it self-updates without sudo, which matters when the operator is not
# the person who builds the image.
#
# DO NOT ALSO `npm install -g @anthropic-ai/claude-code`. allerk hit the
# collision: npm put 2.1.235 in /usr/local/bin while the native installer put
# 2.1.245 in ~/.local/bin, both on PATH in different orders, so WHICH VERSION
# YOU GOT DEPENDED ON HOW YOU HAD LOGGED IN. It presents as a version
# discrepancy rather than a PATH bug, which is what makes it expensive to chase.
# Diagnostic if it ever recurs: `type -a claude`.
# --insecure for the WARP TLS interception during build.
RUN gosu joosep bash -c 'curl --insecure -fsSL https://claude.ai/install.sh | bash' 2>&1 | tail -5

ENV DEBIAN_FRONTEND=

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /home/joosep/work

# SSH only. This team reads and reports; it does not serve.
EXPOSE 2231

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
