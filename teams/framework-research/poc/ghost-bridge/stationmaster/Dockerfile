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
RUN useradd --create-home --shell /usr/sbin/nologin --uid 1000 sm \
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
