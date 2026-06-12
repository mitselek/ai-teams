#!/bin/sh
# stationmaster hub entrypoint.
# Prepares the runtime state dir, records start time for `status` uptime,
# fixes up the authorized_keys mount, and execs sshd in the foreground so the
# container's lifecycle == sshd's lifecycle (one process, killable, restartable).
# (*FR:Brunel*)
set -eu

STATE_DIR="${SM_STATE_DIR:-/var/lib/stationmaster}"
SM_USER="${SM_USER:-sm}"
SSHD_PORT="${SSHD_PORT:-2222}"

# --- state dir -----------------------------------------------------------
mkdir -p "$STATE_DIR/grants" "$STATE_DIR/spool" "$STATE_DIR/dedup"
[ -f "$STATE_DIR/registry.json" ] || echo '{}' > "$STATE_DIR/registry.json"

# Same-filesystem assertion (courier-hints line 54: rename atomicity is
# per-volume). sm-shell writes consignments tmp-file then os.replace(tmp,final)
# within the spool subtree; that rename is atomic only if the whole STATE_DIR
# subtree is one filesystem. Refuse to start if spool/ or dedup/ sit on a
# different device than STATE_DIR -- a misconfigured layout (e.g. spool bind-
# mounted onto a second volume) would make durability writes non-atomic and
# silently break the "accepted = fsync-durable" guarantee.
ROOT_DEV=$(stat -c %d "$STATE_DIR")
SPOOL_DEV=$(stat -c %d "$STATE_DIR/spool")
DEDUP_DEV=$(stat -c %d "$STATE_DIR/dedup")
if [ "$ROOT_DEV" != "$SPOOL_DEV" ] || [ "$ROOT_DEV" != "$DEDUP_DEV" ]; then
    echo "FATAL: $STATE_DIR subtree spans multiple filesystems" >&2
    echo "  STATE_DIR dev=$ROOT_DEV spool dev=$SPOOL_DEV dedup dev=$DEDUP_DEV" >&2
    echo "  rename atomicity is per-volume; refusing to start (courier-hints:54)." >&2
    exit 1
fi

# Record container-start epoch for `status` uptime (sm-shell is per-conversation).
date +%s > "$STATE_DIR/started_at"
# The sm user must own its own spool (named volume is created root-owned).
chown -R "$SM_USER:$SM_USER" "$STATE_DIR"

# --- host keys -----------------------------------------------------------
# Persist host keys on the state volume so a rebuild/restart does not change
# the hub fingerprint out from under registered couriers.
HK_DIR="$STATE_DIR/ssh_host_keys"
mkdir -p "$HK_DIR"
if [ -z "$(ls -A "$HK_DIR" 2>/dev/null || true)" ]; then
    ssh-keygen -A -f "$STATE_DIR" >/dev/null 2>&1 || true
    # ssh-keygen -A writes under <dir>/etc/ssh; relocate into HK_DIR.
    if [ -d "$STATE_DIR/etc/ssh" ]; then
        mv "$STATE_DIR"/etc/ssh/ssh_host_* "$HK_DIR"/ 2>/dev/null || true
        rm -rf "$STATE_DIR/etc"
    fi
fi
chmod 600 "$HK_DIR"/ssh_host_*_key 2>/dev/null || true

# --- authorized_keys -----------------------------------------------------
# Registrations live on the state volume (operator-managed). Link them into
# the sm user's ~/.ssh so the operator never edits inside the image layer.
SSH_HOME="/home/$SM_USER/.ssh"
mkdir -p "$SSH_HOME"
AK="$STATE_DIR/authorized_keys"
[ -f "$AK" ] || : > "$AK"
cp "$AK" "$SSH_HOME/authorized_keys"
chown -R "$SM_USER:$SM_USER" "$SSH_HOME"
chmod 700 "$SSH_HOME"
chmod 600 "$SSH_HOME/authorized_keys"

echo "stationmaster hub up: sshd :$SSHD_PORT  state=$STATE_DIR  user=$SM_USER" >&2

exec /usr/sbin/sshd -D -e \
    -p "$SSHD_PORT" \
    -o "HostKey=$HK_DIR/ssh_host_ed25519_key" \
    -o "AuthorizedKeysFile=$SSH_HOME/authorized_keys" \
    -f /etc/ssh/sshd_config.stationmaster
