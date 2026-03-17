# Container Deployment Runbook — WARP-Protected Hosts

Reusable checklist for deploying Claude Code agent team containers on corporate hosts running Cloudflare WARP. Extracted from apex-research deployment on RC server (2026-03-17, session R8).

(*FR:Brunel*)

## Pre-Flight Checks

Before building or running anything:

```bash
# 1. Verify Docker is installed
docker --version    # need 24+
docker compose version

# 2. Check if WARP is active
warp-cli status     # "Connected" = WARP is intercepting traffic

# 3. Test Docker networking
docker run --rm ubuntu:24.04 apt-get update
# If this hangs or fails → WARP is blocking Docker bridge traffic (see §1)

# 4. Locate WARP CA cert
ls /usr/local/share/ca-certificates/managed-warp*
# If present → TLS interception is active (see §2)
```

---

## §1. Docker DNS on WARP Hosts

**Symptom:** Containers can't resolve hostnames. `apt-get update` hangs or returns `Temporary failure resolving`.

**Cause:** WARP rewrites `/etc/resolv.conf` to `127.0.2.2` / `127.0.2.3` (local WARP DNS). Docker copies this into containers, but the WARP DNS listener only binds to the host network namespace — containers on the bridge network can't reach it.

**Fix (daemon.json — applies to all containers):**
```bash
# /etc/docker/daemon.json
{
  "dns": ["1.1.1.1", "8.8.8.8"]
}
```
```bash
sudo systemctl restart docker
```

**Fix (per-container — if daemon.json isn't enough):**
```yaml
# docker-compose.yml
services:
  myservice:
    network_mode: host   # bypass bridge entirely
```

**Verify:** `docker run --rm ubuntu:24.04 apt-get update` succeeds.

**Note:** `network_mode: host` is the nuclear option — the container shares the host's full network stack. Use it when bridge DNS fixes aren't sufficient (WARP + corporate firewall combo).

---

## §2. WARP TLS Interception

**Symptom:** `SELF_SIGNED_CERT_IN_CHAIN` or `unable to verify the first certificate` from curl, Node.js, pip, or git inside the container.

**Cause:** Cloudflare WARP Gateway re-signs HTTPS traffic with a corporate CA. The container doesn't trust this CA.

**Fix — Three layers needed:**

### Layer 1: Bind-mount the CA cert
```yaml
# docker-compose.yml
volumes:
  - /usr/local/share/ca-certificates/managed-warp.pem:/opt/warp-ca.pem:ro
```

**WARNING:** Do NOT mount to `/etc/ssl/certs/` — `update-ca-certificates` creates symlinks there and will fail with "Device or resource busy" if a bind mount occupies the target path.

### Layer 2: System CA store (curl, pip, git)
```bash
# In entrypoint, running as root:
cp /opt/warp-ca.pem /usr/local/share/ca-certificates/warp-ca.crt
update-ca-certificates --fresh > /dev/null 2>&1
```

### Layer 3: Node.js (Claude Code)
```yaml
# docker-compose.yml environment:
environment:
  - NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem
```

Node.js does NOT use the system CA store. `NODE_EXTRA_CA_CERTS` is the only way.

### Layer 3b: Interactive shells
Compose env vars don't propagate through `sudo su` or SSH sessions. Persist in `.bashrc`:
```bash
# In entrypoint:
echo 'export NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem' >> /home/ai-teams/.bashrc
```

### Build-time workaround
During `docker build`, WARP intercepts HTTPS from build steps. For downloads that can't use the system CA store (e.g., NodeSource setup script), use:
```dockerfile
RUN curl --insecure -fsSL https://example.com/file.tar.gz -o /tmp/file.tar.gz
```
This is acceptable at build time only — the downloaded artifact should be verified by other means (checksum, known filename).

**Verify:**
```bash
docker exec mycontainer bash -c 'curl -sI https://api.anthropic.com | head -1'
# Should return: HTTP/2 404 (or 200)

docker exec mycontainer bash -c 'node -e "fetch(\"https://api.anthropic.com\").then(r=>console.log(r.status))"'
# Should return: 404
```

---

## §3. Compose Env Vars Not Reaching Interactive Shells

**Symptom:** `echo $MY_VAR` is empty when you SSH in or `sudo su - ai-teams`.

**Cause:** Docker Compose sets env vars on the entrypoint process (PID 1). But `su -` and SSH create new login shells that don't inherit PID 1's environment.

**Fix:** Write env vars to `.bashrc` in the entrypoint:
```bash
BASHRC="/home/ai-teams/.bashrc"
declare -A SHELL_VARS=(
    [NODE_EXTRA_CA_CERTS]="/opt/warp-ca.pem"
    [CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS]="1"
    [GITHUB_TOKEN]="${GITHUB_TOKEN}"
    [TEAM_NAME]="${TEAM_NAME:-my-team}"
)
for var in "${!SHELL_VARS[@]}"; do
    val="${SHELL_VARS[$var]}"
    if [ -n "$val" ]; then
        sed -i "/^export ${var}=/d" "$BASHRC"
        echo "export ${var}=${val}" >> "$BASHRC"
    fi
done
```

Use `sed -i` to delete-then-append (not just append) — prevents duplicates on restart.

---

## §4. Locked User Account Blocks SSH Pubkey Auth

**Symptom:** `Permission denied (publickey)` even though the key is correct, permissions are right, and sshd config looks fine.

**Cause:** `useradd` creates accounts with a locked password (`!` in `/etc/shadow`). With `UsePAM no` in sshd_config, OpenSSH rejects locked accounts entirely — the key is never checked. Debug log shows: `User michelek not allowed because account is locked`.

**Fix:**
```dockerfile
RUN useradd -m -s /bin/bash myuser \
    && usermod -p '*' myuser
```

`*` = "no password" (pubkey auth works). `!` = "locked" (all auth rejected when PAM is off).

**Debug:** Run sshd in debug mode to see the real reason:
```bash
docker exec -d mycontainer /usr/sbin/sshd -d -p 2223
ssh -p 2223 myuser@localhost  # watch debug output
```

---

## §5. Hostname Resolution with network_mode: host

**Symptom:** `sudo: unable to resolve host mycontainer: No address associated with hostname`.

**Cause:** `hostname: mycontainer` in docker-compose.yml sets the hostname but doesn't add it to `/etc/hosts`. With `network_mode: host`, Docker doesn't manage the hosts file.

**Fix (in entrypoint):**
```bash
if ! grep -q 'mycontainer' /etc/hosts 2>/dev/null; then
    echo "127.0.0.1 mycontainer" >> /etc/hosts
fi
```

---

## §6. Node.js Version Too Old in Ubuntu Apt

**Symptom:** Ubuntu 24.04 apt installs Node.js 18. Claude Code requires 20+.

**Cause:** Ubuntu noble ships Node.js 18 in the main repo. NodeSource setup script fails behind WARP (SSL interception).

**Fix — Direct binary install:**
```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl --insecure -fsSL \
       https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz \
       -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz \
    && node --version
```

**Notes:**
- Use `.tar.gz` not `.tar.xz` — base image may not have `xz`.
- `--insecure` needed for WARP TLS interception at build time.
- This overwrites the apt-installed Node.js 18 in `/usr/local/`.

---

## §7. Stale GitHub CLI Apt Source in Derived Images

**Symptom:** `apt-get update` in a child Dockerfile fails with `The repository 'https://cli.github.com/packages stable InRelease' is not signed`.

**Cause:** Base image (`ai-teams-claude:latest`) adds the GitHub CLI apt repo with a GPG key. The key expires or rotates, breaking `apt-get update` in derived images.

**Fix (in derived Dockerfile, before any apt-get):**
```dockerfile
RUN rm -f /etc/apt/sources.list.d/github-cli.list \
    && rm -f /usr/share/keyrings/githubcli-archive-keyring.gpg
```

`gh` is already installed — the apt source is only needed during the base image build.

---

## §8. Claude Code Auth: OAuth vs API Key

**Symptom:** `ANTHROPIC_API_KEY` env var is empty but Claude Code works on the host.

**Cause:** Claude Code on the host uses OAuth authentication via `claude login`, storing tokens in `~/.claude/.credentials.json`. There is no `ANTHROPIC_API_KEY`.

**Fix — Copy OAuth credentials into container:**
```bash
docker cp ~/.claude/.credentials.json mycontainer:/home/ai-teams/.claude/.credentials.json
docker exec mycontainer chown 1000:1000 /home/ai-teams/.claude/.credentials.json
```

**Persistence:** The file lives in the `~/.claude/` named volume — survives container restarts. Does NOT survive `docker compose down -v` (volume wipe).

**Alternative:** If you have an API key, set `ANTHROPIC_API_KEY` in `.env` — it takes precedence over OAuth credentials.

---

## §9. Claude Settings for Autonomous Teams

**Config:** `/home/ai-teams/.claude/settings.json`

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "defaultMode": "bypassPermissions"
  },
  "includeCoAuthoredBy": false
}
```

- `bypassPermissions` — autonomous team, no interactive approval needed
- `includeCoAuthoredBy: false` — don't add co-author trailer to commits
- Agent teams env var enables the experimental team features

**Entrypoint pattern:** Write settings only if file doesn't exist (preserve PO customizations):
```bash
if [ ! -f "$SETTINGS_FILE" ]; then
    cat > "$SETTINGS_FILE" << 'EOF'
    ...
EOF
    chown 1000:1000 "$SETTINGS_FILE"
fi
```

---

## §10. SSH Port Conflict with network_mode: host

**Symptom:** Container sshd can't bind to port 22 — host sshd already uses it.

**Fix:** Configure container sshd on a different port (e.g., 2222):
```dockerfile
RUN sed -i 's/^#\?Port .*/Port 2222/' /etc/ssh/sshd_config \
    && echo 'Port 2222' >> /etc/ssh/sshd_config
```

Entrypoint starts sshd explicitly on the port:
```bash
/usr/sbin/sshd -p 2222
```

PO connects with: `ssh -p 2222 myuser@host`

---

## §11. Read-Only Source Data Volume

**Symptom:** Need a volume that's writable for initial clone but read-only at runtime.

**Cause:** Docker `:ro` flag prevents ALL writes, including root. Can't clone into a read-only volume.

**Fix:** Mount read-write, enforce read-only via filesystem permissions after clone:
```bash
# Clone as ai-teams user
clone_or_pull "$SOURCE_REPO_URL" "$SOURCE_DATA"

# Lock down: owned by root, read+execute only for others
chown -R root:root "$SOURCE_DATA"
chmod -R a-w,a+rX "$SOURCE_DATA"
```

On restart, temporarily unlock for pull, then re-lock:
```bash
chmod -R u+w "$SOURCE_DATA"
chown -R 1000:1000 "$SOURCE_DATA"
gosu ai-teams git -C "$SOURCE_DATA" pull --ff-only
chown -R root:root "$SOURCE_DATA"
chmod -R a-w,a+rX "$SOURCE_DATA"
```

---

## Quick Reference: Full Entrypoint Order

```
Step 0:  Fix /etc/hosts (hostname resolution)
Step 0b: WARP CA → system CA store
Step 1:  Fix volume ownership (chown root → 1000)
Step 2:  Validate GITHUB_TOKEN
Step 3:  Clone/pull primary repo (read-write)
Step 4:  Clone/pull source data repo + lock to read-only
Step 5:  Symlink for path compatibility
Step 6:  Python venv setup (first run only)
Step 7:  SSH key installation + start sshd
Step 8:  Runtime validation gates (Python, Node.js, Claude, repos)
Step 9:  Persist env vars to .bashrc
Step 9b: Git attribution
Step 9c: Claude settings.json (first run only)
Step 10: exec gosu ai-teams "$@"
```

Every step is idempotent. Safe to restart.
