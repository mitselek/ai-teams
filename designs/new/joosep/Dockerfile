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

# ── WARP CA at BUILD time ─────────────────────────────────────────────────────
# Placed early, before anything that fetches over HTTPS.
#
# WHY THIS EXISTS (2026-08-28, Hopper caught it at Step 5): the entrypoint
# installs this CA at RUNTIME, which is too late for the build. The Claude
# installer below is `curl ... | bash`, and the script it downloads runs its OWN
# curl with its OWN flags -- so the `--insecure` on the outer fetch does NOT
# reach it. That inner curl met WARP's TLS interception with an empty trust
# store and failed, and the layer still reported DONE (see the pipefail note
# below). Giving the whole build a real trust store fixes the class, not just
# the instance.
#
# The file is copied into the build context from the host by the provisioning
# runbook (Step 1: `cp /usr/local/share/ca-certificates/managed-warp.pem
# ./warp-ca.pem`). It is a public CA certificate, not a secret.
#
# NOTE: the `--insecure` flags on the gh/Node layers below are now redundant.
# They are left in place deliberately -- those layers are proven working and
# this build is not the moment to change them. Drop them in a later pass.
COPY warp-ca.pem /usr/local/share/ca-certificates/warp-ca.crt
RUN update-ca-certificates && echo "[build] WARP CA installed into the build trust store."

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
    && npm --version
# NOTE: `npm install -g npm@latest` was here and is deliberately GONE.
#
# It had NO CONSUMER. It is inherited cargo from the apex/backlog-triage
# lineage, where npm installed Claude Code globally -- this image installs
# Claude natively (see below), resolves rumba's deps with pnpm, gets `gh` from
# apt and Node from a tarball. Nothing in this Dockerfile, the entrypoint, the
# compose file or the launcher invokes npm. Verified by grep, not assumed.
#
# It was also BROKEN, on every build including the 16:07 image: `npm@latest`
# now resolves to npm 12.x, which requires node ^22.22.2 || ^24.15.0 || >=26,
# and this image pins Node 22.14.0 -- so the engine check refused and the layer
# exited 1. `| tail -1` had been swallowing that exit code, so every image
# shipped with npm 10.9.2 and a silently failed upgrade. Removing the mask did
# not create this failure; it revealed one that had been there for as long as
# npm 12 has existed.
#
# So the shipped state is now EXPLICIT rather than accidental: whatever npm
# Node 22.14.0 bundles (10.9.2), which is what every prior image actually had.
# Do not re-add an upgrade without a consumer that needs it -- and if one ever
# appears, pin the version, for the same reason pnpm is pinned below.
# ── pnpm via corepack (Celes, 2026-08-28) ─────────────────────────────────────
# `rumba` is a pnpm monorepo using `catalog:` deps; npm alone cannot resolve
# them and `pnpm --filter elron-test test` would fail at first use.
# Version PINNED rather than @latest: rumba's root package.json has no
# `packageManager` field, so `@latest` at image-build time is a moving target
# that can drift from what the repo expects. The durable fix is a
# `packageManager` pin in rumba itself -- that is the team's to propose, not
# ours to add. Bump this line deliberately when they do.
RUN corepack enable \
    && corepack prepare pnpm@9.12.3 --activate \
    && pnpm --version

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
# NO `| tail`. A trailing pipe makes the RUN report the exit status of `tail`,
# which is 0 -- so this layer previously printed a TLS failure and reported
# `DONE 0.6s`, shipping an image with no `claude` in it and a green build.
# `set -o pipefail` makes the inner `curl | bash` fail honestly too.
#
# The `RUN test -x` on the next line is the assertion that would have caught it
# regardless: a build step that installs a tool should prove the tool exists.
# The pipefail that matters is the INNER one: `bash -c` is genuinely bash, and
# the only pipeline in this layer (`curl | bash`) lives inside it.
#
# An outer `RUN set -o pipefail && ...` was here and is gone. Docker's default
# RUN shell is `/bin/sh -c`, and on Debian /bin/sh is dash, which has no
# `pipefail` -- so it died with `set: Illegal option -o pipefail` (exit 2)
# before curl ever ran. It was also guarding nothing: there is no pipeline in
# the outer command. Belt-on-a-belt, and the wrong belt for that shell.
#
# Do NOT "fix" this with `SHELL ["/bin/bash", "-o", "pipefail", "-c"]` unless
# you mean to re-validate every later RUN under bash instead of dash -- that
# directive changes the shell for the whole rest of the file.
RUN gosu joosep bash -c 'set -o pipefail; curl -fsSL https://claude.ai/install.sh | bash'
RUN test -x /home/joosep/.local/bin/claude \
    && gosu joosep /home/joosep/.local/bin/claude --version \
    && echo "[build] claude installed and executable."

ENV DEBIAN_FRONTEND=

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Onboarding backlog for Joosep's team. Baked here as the pristine copy; the
# entrypoint copies it to ~/FIRST-TASKS.md on first boot and never overwrites,
# so their progress survives a rebuild while the original stays available to
# diff against.
COPY FIRST-TASKS.md /opt/FIRST-TASKS.md

WORKDIR /home/joosep/work

# SSH only. This team reads and reports; it does not serve.
EXPOSE 2231

ENTRYPOINT ["/entrypoint.sh"]
CMD ["bash"]
