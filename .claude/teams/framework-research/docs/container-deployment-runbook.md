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

## §12. NODE_EXTRA_CA_CERTS for Claude Code on WARP Hosts

**Symptom:** Claude Code fails with `SELF_SIGNED_CERT_IN_CHAIN` even though `update-ca-certificates` ran in the entrypoint and curl/git work fine.

**Cause:** Node.js does NOT use the system CA store (`/etc/ssl/certs/`). It has its own bundled CA bundle. `update-ca-certificates` adds the WARP cert to the system store, which fixes curl, pip, and git — but Node.js (and therefore Claude Code) is unaffected. It needs to be told about the cert explicitly via `NODE_EXTRA_CA_CERTS`.

This is a separate problem from §2 (WARP TLS interception for system tools). Both fixes are required on WARP hosts — §2 covers apt/curl/git, §12 covers Node.js/Claude Code.

**Fix — Three parts:**

### Part 1: Bind-mount the cert (docker-compose.yml)

```yaml
volumes:
  - /usr/local/share/ca-certificates/managed-warp.pem:/opt/warp-ca.pem:ro
```

Mount to `/opt/` — **NOT** to `/etc/ssl/certs/`. The `update-ca-certificates` tool creates symlinks in `/etc/ssl/certs/` and fails with "Device or resource busy" if a bind-mount already occupies a target path there.

### Part 2: Set NODE_EXTRA_CA_CERTS (docker-compose.yml environment)

```yaml
environment:
  - NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem
```

Hardcode this value — do not rely on the host env var being set. If `NODE_EXTRA_CA_CERTS` is empty or unset, Claude Code silently falls back to the bundled CA bundle and fails against WARP.

### Part 3: Persist to .bashrc (entrypoint)

Compose env vars don't propagate to interactive shells (SSH sessions, `docker exec`, `sudo su`). Persist to `.bashrc` in the entrypoint's SHELL_VARS block:

```bash
if [ -n "${NODE_EXTRA_CA_CERTS:-}" ]; then
    SHELL_VARS[NODE_EXTRA_CA_CERTS]="${NODE_EXTRA_CA_CERTS}"
fi
```

This covers any Claude Code session started from an interactive shell rather than the container's PID 1.

**Verify:**

```bash
docker exec <container> bash -c 'node -e "fetch(\"https://api.anthropic.com\").then(r=>console.log(r.status)).catch(e=>console.error(e.message))"'
# Should return: 404
# SELF_SIGNED_CERT error = NODE_EXTRA_CA_CERTS not reaching Node.js process
```

---

## §13. Statusline Script in Containerised Teams — MANDATORY

> **Checklist item:** Every new team container MUST have statusline configured before handoff to the team.
> Use §20 (Statusline Deployment Checklist) to verify. Missing statusline = incomplete deployment.

**Symptom:** Claude Code shows no statusline, or shows an error/blank line where the statusline should appear.

**Cause:** The statusline script is not found at the path referenced in `settings.json`, OR the script hard-fails on a missing tool, causing Claude to suppress the statusline entirely.

### Design rules

**1. Script lives in the repo, not the image.**
Keep `statusline-command.sh` in the project repo (e.g., `.claude/statusline-command.sh`). The repo is cloned to a predictable path by the entrypoint (`/home/ai-teams/workspace`). This means the script survives image rebuilds without requiring a Dockerfile change.

**2. `settings.json` references the container path, not the host path.**

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash /home/ai-teams/workspace/.claude/statusline-command.sh"
  }
}
```

The path must be the in-container absolute path. On local dev (non-containerised), the path must be adjusted to wherever the repo is checked out — or use a relative path via `$(git rev-parse --show-toplevel)/.claude/statusline-command.sh` if your shell supports it.

**3. The script must never hard-fail.**
Claude Code suppresses the statusline if the script exits non-zero or produces no output. Every external tool call must be guarded:

```bash
# BAD — fails if pnpm not installed
TESTS=$(pnpm test --reporter=json 2>&1 | jq '.numPassedTests')

# GOOD — graceful: no output if unavailable
TESTS=""
if command -v pnpm >/dev/null 2>&1; then
  TESTS=$(pnpm test --reporter=json 2>&1 | jq -r '.numPassedTests // ""' 2>/dev/null || true)
fi
```

**4. Don't run slow commands live.**
The statusline script is called on every prompt render. Running `pnpm test` live would block for seconds. Instead, write test results to a temp file after each test run and read the cached value:

```bash
# After a test run (agent writes this):
echo "PASS:42 FAIL:0" > /tmp/polyphony-test-status.txt

# Statusline reads the cache:
if [ -f /tmp/polyphony-test-status.txt ]; then
  CACHED=$(cat /tmp/polyphony-test-status.txt)
  # ... parse and display
fi
```

**5. `CLAUDE_ENV_ID` must be set in `.bashrc` (not just compose env).**
The statusline script reads `CLAUDE_ENV_ID` to show the environment badge. Compose env vars don't propagate to SSH sessions. Persist it in the entrypoint's SHELL_VARS block:

```bash
SHELL_VARS[CLAUDE_ENV_ID]="POLY"   # or whatever the container's env ID is
```

**Verify:**

```bash
# Test the script directly inside the container
docker exec -u ai-teams <container> bash -c \
  'echo "{\"model\":{\"display_name\":\"Claude Sonnet 4.6\"},\"workspace\":{\"current_dir\":\"/home/ai-teams/workspace\"},\"context_window\":{\"remaining_percentage\":80},\"cost\":{\"total_cost_usd\":0.05},\"session_id\":\"test\"}" | bash /home/ai-teams/workspace/.claude/statusline-command.sh'
# Should print a coloured statusline, not an error
```

---

## §14. Claude Settings.json for Agent Teams

**Symptom:** Agents are denied tool calls they need, or Claude prompts for permission on every action despite `bypassPermissions`.

**Cause:** `settings.json` with only `"defaultMode": "bypassPermissions"` or `"defaultMode": "default"` does not grant specific tool access. Without an explicit `allow` list, the result is either constant prompting (default) or blanket bypass with no per-tool control (bypassPermissions — only appropriate for fully autonomous, trusted containers).

**Fix — use `default` mode with an explicit allow list:**

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "permissions": {
    "defaultMode": "default",
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Write(*)",
      "Edit(*)",
      "Glob(*)",
      "Grep(*)",
      "WebFetch(domain:entu.app)",
      "WebFetch(domain:entu.dev)",
      "WebFetch(domain:api.github.com)"
    ],
    "deny": []
  },
  "includeCoAuthoredBy": false
}
```

**Rules:**

- `"Bash(*)"` — allow all shell commands. Narrow to specific patterns (e.g. `"Bash(git *)"`) for higher-trust environments.
- `"WebFetch(domain:...)"` — one entry per domain the agents need to reach. Required for external API calls (Entu, GitHub, Anthropic docs, etc.).
- `deny` list takes precedence over `allow`. Use it to block specific tools (e.g. `"mcp__jira__jira_update_issue"` for read-only Jira access).
- `bypassPermissions` is appropriate ONLY for fully automated pipelines where no human oversight is possible. For interactive agent teams accessed via SSH, use `default` + allow list.

**Entrypoint pattern:** Write settings only on first run (preserve PO customizations):

```bash
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
    cat > "$SETTINGS_FILE" << 'SETTINGS_EOF'
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" },
  "permissions": {
    "defaultMode": "default",
    "allow": ["Bash(*)", "Read(*)", "Write(*)", "Edit(*)", "Glob(*)", "Grep(*)"],
    "deny": []
  },
  "includeCoAuthoredBy": false
}
SETTINGS_EOF
    chown 1000:1000 "$SETTINGS_FILE"
fi
```

Add `WebFetch` entries for whatever external APIs the team needs.

---

## §15. Tmux Session Name Consistency

**Symptom:** `start-team.sh` or `apply-layout.sh` fails with "session not found", or spawns into the wrong session.

**Cause:** The entrypoint creates the tmux session with one name (e.g. `entu`), but the layout scripts default to a different name (e.g. `ENTU`). tmux session names are case-sensitive.

**Rule: use lowercase session names everywhere, consistently.**

The session name appears in three places that must all match:

| Location | Where it appears |
|---|---|
| `entrypoint-*.sh` | `exec tmux -u new-session -A -s <name>` in `.bashrc` auto-tmux block |
| `apply-layout.sh` | `TMUX_SESSION="${1:-<name>}"` default |
| `start-team.sh` | `TMUX_SESSION="${1:-<name>}"` default |
| `reflow.sh` | `TMUX_SESSION="${1:-<name>}"` default |
| `spawn_member.sh` | `TMUX_SESSION="${2:-<name>}"` default |

**Convention:** use the team's short identifier in lowercase as the session name.

| Team | Session name |
|---|---|
| apex-research | `apex` |
| polyphony-dev | `polyphony` |
| entu-research | `entu` |

**Verify:**

```bash
tmux list-sessions   # check what name the entrypoint actually created
```

---

## §16. Don't send-keys to Panes Running Claude

**Symptom:** `tmux split-window` after `tmux send-keys` fails with "size missing" or creates a zero-size pane.

**Cause:** `tmux send-keys -t <pane> "cd /some/dir && clear" Enter` injects keystrokes into the running Claude process. Claude receives the text as input, which disrupts its state. The subsequent `split-window` targeting that pane then fails because the pane is in an inconsistent state.

**Fix:** Never use `send-keys` to set the working directory. Use `-c <dir>` on `split-window` instead — it sets the starting directory for the new pane without touching any existing process.

```bash
# BAD — interferes with running Claude
PANE_SAAVEDRA=$(tmux list-panes -t "$SESSION" -F '#{pane_id}' | head -1)
tmux send-keys -t "$PANE_SAAVEDRA" "cd /home/ai-teams/workspace && clear" Enter
tmux split-window -t "$PANE_SAAVEDRA" -h -p 80   # may fail: size missing

# GOOD — -c sets cwd for the NEW pane, leaves existing pane untouched
PANE_SAAVEDRA=$(tmux list-panes -t "$SESSION" -F '#{pane_id}' | head -1)
tmux split-window -t "$PANE_SAAVEDRA" -h -p 80 -c "/home/ai-teams/workspace"
```

**Rule:** In `apply-layout.sh`, never call `send-keys` on any pane that may have Claude running. The `-c` flag on every `split-window` call is sufficient to set the working directory for new panes.

---

## §17. tmux split-window "size missing" from Bash Tool or External Process

**Symptom:** `apply-layout.sh` or any script calling `tmux split-window -p <percent>` fails with "size missing" when run from inside Claude's Bash tool or from an external SSH connection against an attached session.

**Cause:** `tmux split-window -p <percent>` requires an attached client to resolve the percentage into pixel dimensions. When the caller is a subprocess (Claude Bash tool, external SSH) rather than the terminal session itself, tmux cannot determine the client dimensions and aborts.

This is a separate issue from §16 (send-keys keyinjection). `split-window` does NOT inject keystrokes — it creates a new pane. The session attachment state is what matters.

**Fix:** Replace `-p <percent>` with `-l <columns/rows>` (absolute size). tmux can always compute absolute sizes without a client.

```bash
# BAD — fails with "size missing" from Bash tool subprocess
tmux split-window -t "$PANE_SAAVEDRA" -h -p 80 -c "$WORK_DIR"
PANE_DATA_COL=$(tmux list-panes -t "$SESSION" -F '#{pane_id}' | tail -1)   # also fragile

# GOOD — works from any context including Claude's Bash tool
TOTAL_W=$(tmux display-message -t "$SESSION" -p '#{window_width}')
TOTAL_H=$(tmux display-message -t "$SESSION" -p '#{window_height}')
RIGHT_W=$((TOTAL_W * 80 / 100))
PANE_DATA_COL=$(tmux split-window -t "$PANE_SAAVEDRA" -d -h -l $RIGHT_W -c "$WORK_DIR" -P -F '#{pane_id}' 'bash --norc -i')
```

Additional flags:

- `-d` — detached: keeps focus on the current pane (Saavedra stays active)
- `-P -F '#{pane_id}'` — prints the new pane ID to stdout; eliminates fragile `tail -1` pane tracking
- `tmux display-message -t "$SESSION" -p '#{window_width}'` — reads dimensions from the session, not from a client; works without attachment

**Implication for startup procedure:** With this fix, `apply-layout.sh` is safe to call from any context — `.bashrc`, entrypoint, Claude Bash tool, or external SSH. This enables the zero-friction startup pattern described in §18.

**Verify:**

```bash
# From external SSH (simulates Bash tool subprocess context):
ssh -p <port> ai-teams@host "bash ~/workspace/<team-repo>/.claude/teams/<team>/apply-layout.sh <session>"
# Should print pane IDs and succeed — no "size missing"
tmux list-panes -t <session>  # should show expected pane count
```

---

## §18. Zero-Friction Startup: SSH → "hello"

**Goal:** PO types `ssh ...` and lands directly in Claude, panes already created, ready to say hello and start the team.

**Pattern:** `.bashrc` auto-tmux block handles the full first-session bootstrap. No manual steps required.

```bash
# In entrypoint — always rewrite .bashrc auto-tmux block:
sed -i '/^# auto-tmux:/,/^fi$/{d}' "${BASHRC}"
cat >> "${BASHRC}" << 'AUTOTMUX_EOF'
# auto-tmux: attach or create session on SSH login
if [ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]; then
    cd /home/ai-teams/workspace/<team-repo>
    TMUX_SESSION="<team>"
    LAYOUT_SCRIPT="$HOME/workspace/<team-repo>/.claude/teams/<team>/apply-layout.sh"
    if ! tmux has-session -t "$TMUX_SESSION" 2>/dev/null; then
        # Path 1: fresh session — build layout, start claude
        tmux new-session -d -s "$TMUX_SESSION"
        bash "$LAYOUT_SCRIPT" "$TMUX_SESSION"
        tmux send-keys -t "$TMUX_SESSION" "claude" Enter
    fi
    # Path 2 + 3: session exists (detached or attached) — just attach
    exec tmux -u attach-session -t "$TMUX_SESSION"
fi
AUTOTMUX_EOF
```

**Three paths:**

| State | What happens |
|---|---|
| No tmux session | Create detached session → apply-layout.sh (panes + labels) → `claude` in pane 0 → attach |
| Session exists, detached | Straight to `exec attach-session` |
| Session exists, attached | Straight to `exec attach-session` (opens second client) |

**`apply-layout.sh` idempotency:** Only call from `.bashrc` (path 1). If the team lead needs to re-run layout manually from inside Claude, `apply-layout.sh` is safe to call from the Bash tool (uses `-l` absolute sizes — see §17).

**`start-team.sh` idempotency:** Make it conditional on the pane env file:

```bash
PANE_ENV="/tmp/<session>-panes.env"
if [ -f "$PANE_ENV" ]; then
    source "$PANE_ENV"   # layout already done
else
    bash "$SCRIPT_DIR/apply-layout.sh" "$TMUX_SESSION"
    source "$PANE_ENV"
fi
# then spawn agents...
```

**Result for the team lead:**

```
SSH → [auto: panes created + labeled, claude starts] → "hello"
→ TeamCreate → start-team.sh (spawn agents) → assign work
```

**Adapting for other teams:** replace `<team>` and `<team-repo>` tokens. The pattern is identical for apex-research, polyphony-dev, entu-research, or any future team.

---

## §19. Pane Labels for Agent Teams

**Goal:** When a PO attaches to a tmux session, each pane shows the agent's name in the border — no need to guess which pane ID maps to which agent.

**Pattern:** In `apply-layout.sh`, after all panes are created and before writing the env file:

```bash
# Label panes with agent names (replace with team's actual agent names)
tmux select-pane -t "$PANE_LEAD"    -T "team-lead"
tmux select-pane -t "$PANE_AGENT1"  -T "agent1"
tmux select-pane -t "$PANE_AGENT2"  -T "agent2"
# ... one line per agent

# Show labels in pane borders — scoped to this session only
tmux set-option -t "$TMUX_SESSION" pane-border-format " #{pane_title} "
tmux set-option -t "$TMUX_SESSION" pane-border-status top
```

**Notes:**

- `select-pane -T` sets the pane title. Persists for the session lifetime.
- `pane-border-status top` shows a border line above each pane with the title.
- Use `-t "$TMUX_SESSION"` on `set-option` **without** `-g` — scopes to this session only. Using `-g` changes the global tmux server config, affecting all sessions on the host.
- Add a corresponding note in `startup.md` so agents know pane labels exist without having to discover them visually.

**Result:** PO attaches and sees:

```
┌─ Saavedra ───┬─ Codd ───────┬─ Semper ─────┐
│              │              │              │
│   (claude)   ├─ Hopper ─────┼─ Hamilton ───┤
│              │              │              │
└──────────────┴──────────────┴──────────────┘
```

**Adapting for other teams:** replace agent names in the `select-pane -T` calls. The `set-option` lines are identical for all teams.

---

## §20. Statusline Deployment Checklist — MANDATORY FOR EVERY NEW CONTAINER

Run this checklist before marking a container deployment complete. All three items are required.

### Item 1: statusline-command.sh exists in the repo

The script must be committed to the team's repo at `.claude/statusline-command.sh`:

```bash
# Verify from inside the container:
ls -la ~/workspace/<team-repo>/.claude/statusline-command.sh
# Must exist and be executable (mode 755)
```

If missing, copy from an existing team. The apex-research container has the canonical script at
`/home/ai-teams/workspace/entu-research/.claude/statusline-command.sh` (also committed to `entu/research`
after the 2026-03-20 live fix). The script must be committed and pushed — container rebuilds clone fresh.

### Item 2: settings.json has statusLine entry

```bash
# Verify from inside the container:
python3 -c "import json,sys; d=json.load(open('/home/ai-teams/.claude/settings.json')); print('OK' if 'statusLine' in d else 'MISSING')"
```

If missing, add:

```json
"statusLine": {
  "type": "command",
  "command": "bash /home/ai-teams/workspace/<team-repo>/.claude/statusline-command.sh"
}
```

Adjust `<team-repo>` to the actual directory name. The path must be the in-container absolute path.

### Item 3: CLAUDE_ENV_ID is set in .bashrc

```bash
# Verify:
grep 'CLAUDE_ENV_ID' ~/.bashrc
# Must show: export CLAUDE_ENV_ID=<TEAM-ID>
```

Convention: `APEX-R` (apex-research), `POLY` (polyphony-dev), `ENTU-R` (entu-research).
Use 2–10 chars, A-Z0-9 and hyphen only. If missing, add to the entrypoint's `SHELL_VARS` block.

### Smoke test (all three items together)

```bash
# Run inside the container with the entu key or the team's SSH key:
export CLAUDE_ENV_ID=$(grep 'CLAUDE_ENV_ID' ~/.bashrc | cut -d= -f2)
echo '{"model":{"display_name":"Claude Sonnet 4.6"},"workspace":{"current_dir":"/home/ai-teams/workspace"},"context_window":{"remaining_percentage":80},"cost":{"total_cost_usd":0.05},"session_id":"smoke-test"}' \
  | bash ~/workspace/<team-repo>/.claude/statusline-command.sh
# Must print a colored statusline with the CLAUDE_ENV_ID badge — not an error
```

### What to do if statusline was missed (live fix, no rebuild)

```bash
# 1. Add the script to the repo (copy from another team, or write from scratch per §13)
chmod +x ~/workspace/<team-repo>/.claude/statusline-command.sh
cd ~/workspace/<team-repo>
git add .claude/statusline-command.sh
git commit -m "chore: add statusline-command.sh"
git push

# 2. Patch settings.json directly (takes effect on next Claude startup)
python3 -c "
import json
p = '/home/ai-teams/.claude/settings.json'
with open(p) as f: d = json.load(f)
d['statusLine'] = {'type': 'command', 'command': 'bash /home/ai-teams/workspace/<team-repo>/.claude/statusline-command.sh'}
with open(p, 'w') as f: json.dump(d, f, indent=2); f.write('\n')
print('Done')
"

# 3. Verify CLAUDE_ENV_ID is in .bashrc (see Item 3 above)
# 4. Run smoke test above, then restart Claude Code
```

(*FR:Brunel*)

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
         → CLAUDE_ENV_ID MANDATORY (for statusline — see §20)
Step 9b: Git attribution
Step 9c: Claude settings.json (first run only)
         → statusLine entry MANDATORY (see §13 / §20)
Step 9d: statusline-command.sh in repo — committed and pushed (see §20)
Step 10: exec gosu ai-teams "$@"
```

Every step is idempotent. Safe to restart.

---

## §21. spawn_member.sh — Operator Reference

**Context:** After SSHing into a container and completing TeamCreate, the PO spawns agents using `spawn_member.sh`. This section documents the argument order and session name so operators don't have to read the script.

### Argument order

```
spawn_member.sh [--target-pane %XX] <agent-name> [tmux-session]
```

| Argument | Required | Description |
|---|---|---|
| `--target-pane %XX` | optional | Spawn into an existing pre-split pane. Get the pane ID from `apply-layout.sh` output or `tmux list-panes -F '#{pane_id}'`. Omit to split a new pane automatically. |
| `<agent-name>` | required | Name as it appears in `roster.json` (e.g. `saavedra`, `codd`, `finn`). Case-sensitive. |
| `[tmux-session]` | optional | Session name to target. **Defaults to the team's short name** (see below). Only needed if you renamed the session. |

### Session name convention

The tmux session name is the team's **short identifier, lowercase** — NOT the full team name:

| Team directory | Session name |
|---|---|
| `apex-research` | `apex` |
| `polyphony-dev` | `polyphony` |
| `entu-research` | `entu` |
| `hr-devs` | `hr-devs` |

The entrypoint, `apply-layout.sh`, `start-team.sh`, and `spawn_member.sh` all default to this short name. If you pass the wrong name (e.g. `entu-research` instead of `entu`) the script will fail with "session not found".

Verify the actual session name before spawning:

```bash
tmux list-sessions
```

### Typical spawn sequence (after TeamCreate)

```bash
# 1. Layout is pre-created by auto-tmux on SSH login.
#    If not, create it manually:
bash ~/workspace/<team-repo>/.claude/teams/<team>/apply-layout.sh <session>

# 2. Source the pane env to get pane IDs
source /tmp/<team>-panes.env

# 3. Spawn agents into their panes
spawn_member.sh --target-pane $PANE_FINN    finn
spawn_member.sh --target-pane $PANE_MARCUS  marcus
spawn_member.sh --target-pane $PANE_TESS    tess
spawn_member.sh --target-pane $PANE_SVEN    sven
# etc.
```

The pane env file is written by `apply-layout.sh` to `/tmp/<session>-panes.env` with variables named `PANE_<AGENTNAME>` (uppercase).

### If you omit --target-pane

`spawn_member.sh` falls back to `split-window`, creating a new pane by splitting the last active pane. This works but produces an uncontrolled layout. Prefer `--target-pane` with a pre-created layout for predictable results.

---

## §22. Avoiding Duplicate Pane Map Output

**Symptom:** The pane ID table (saavedra → %1, codd → %2, …) prints twice when Saavedra runs `start-team.sh` after the auto-tmux `.bashrc` hook already ran `apply-layout.sh`.

**Cause:** Both `apply-layout.sh` and `start-team.sh` echo the pane map. When `.bashrc` calls `apply-layout.sh` on login and then Saavedra calls `start-team.sh`, the table appears twice.

**Fix:** Print the pane map only in `apply-layout.sh` (the source of truth). `start-team.sh` should only print a completion summary, not re-echo the IDs.

```bash
# apply-layout.sh — print pane IDs here (once)
echo "  codd     → $PANE_CODD"
echo "  hopper   → $PANE_HOPPER"
# ...
echo "[apply-layout] Done. Pane IDs written to $PANE_ENV"

# start-team.sh — do NOT repeat the pane map
echo "[start-team] Done. All 4 agents spawned."
echo "Panes are labeled in the tmux borders. Wait for intro messages."
```

**Rule for new teams:** `apply-layout.sh` owns pane ID reporting. `start-team.sh` owns spawn status reporting. No overlap.

---

## §23. set-option -g Scope Leak

**Symptom:** After running `apply-layout.sh`, other tmux sessions on the same host unexpectedly show pane borders with agent name labels.

**Cause:** `tmux set-option -t "$SESSION" -g pane-border-format " #{pane_title} "` — the `-g` flag overrides the session scope and sets the option globally on the tmux server, affecting all sessions.

**Fix:** Remove `-g`. Session-scoped `set-option` does not need it:

```bash
# BAD — sets globally, affects all sessions on the host
tmux set-option -t "$TMUX_SESSION" -g pane-border-format " #{pane_title} "
tmux set-option -t "$TMUX_SESSION" -g pane-border-status top

# GOOD — scoped to this session only
tmux set-option -t "$TMUX_SESSION" pane-border-format " #{pane_title} "
tmux set-option -t "$TMUX_SESSION" pane-border-status top
```

**Note:** `-t "$SESSION"` without `-g` already scopes the option to that session. The `-g` flag explicitly un-scopes it. They are mutually exclusive in intent.

(*FR:Brunel*)
