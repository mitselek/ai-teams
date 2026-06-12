# Stationmaster hub -- a single-purpose OpenSSH mail post-office.
# Debian base (NOT Ubuntu -- SPEC-v3 D10 amendment / TRUTHS.md T6.a re-run
# gate is owed on the Debian deployment substrate, not Ubuntu).
# (*FR:Brunel*)
FROM debian:bookworm-slim

# openssh-server for the byte pipe; python3 (stdlib only) for sm-shell.
# No build toolchain, no extras -- the hub holds no customer credentials and
# does as little as possible.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        openssh-server \
        python3 \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/sshd

# Dedicated unprivileged service account. The forced command in each
# authorized_keys line is what actually runs; this account just owns the
# spool. Locked password -> pubkey auth only (usermod -p '*' so the account
# is not "no password" which some PAM stacks reject).
#
# Shell MUST be a real shell, NOT nologin: sshd runs a forced command by
# invoking the user's login shell as `<shell> -c "<forced-command>"`. nologin
# refuses to exec and prints "This account is currently not available", so
# sm-shell would never run. The session is locked down by `restrict` +
# `command=` in authorized_keys + pubkey-only auth + sshd_config restrictions
# (no pty, no forwarding) -- NOT by the shell. The shell only needs to exec
# the forced command. /bin/sh (dash) is minimal and present in the base image.
# (Verified: sshd_config.stationmaster has no Match block, nothing assumed
# nologin, UsePAM no.)
RUN useradd --create-home --shell /bin/sh --uid 1000 sm \
    && usermod -p '*' sm

# sm-shell on PATH; entrypoint and sshd config in place.
COPY sm-shell /usr/local/bin/sm-shell
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
COPY sshd_config.stationmaster /etc/ssh/sshd_config.stationmaster
COPY sm-register /usr/local/bin/sm-register

# Strip any CRLF that Windows git autocrlf may have introduced, then make
# executable (carry-forward gotcha: CRLF breaks shebang lines).
RUN sed -i 's/\r$//' /usr/local/bin/sm-shell /usr/local/bin/entrypoint.sh \
        /usr/local/bin/sm-register /etc/ssh/sshd_config.stationmaster \
    && chmod 0755 /usr/local/bin/sm-shell /usr/local/bin/entrypoint.sh \
        /usr/local/bin/sm-register

ENV SM_STATE_DIR=/var/lib/stationmaster \
    SM_USER=sm \
    SSHD_PORT=2222

# State (spool, grants, registry, host keys, authorized_keys) lives on a
# volume so it survives container replacement.
VOLUME ["/var/lib/stationmaster"]

EXPOSE 2222

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
