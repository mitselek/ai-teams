# hr-devs Container Spec

(*FR:Brunel*)

**Status:** Draft
**Date:** 2026-03-20
**Author:** Brunel

---

## Overview

This spec covers containerizing the `hr-devs` team, which currently runs bare-metal on the RC host (`dev@100.96.54.170`). The team develops the `hr-platform` SvelteKit app deployed to Cloudflare — this differs from all previous research-team containers: it needs Wrangler CLI for deploys and two MCP servers (Jira + Dynamics).

---

## 1. Delta Analysis

What hr-devs needs beyond the base image and previous containers:

| Requirement | apex-research | polyphony-dev | entu-research | **hr-devs** |
|---|---|---|---|---|
| Node.js 22 | yes | yes | yes | **yes** |
| npm (not pnpm) | no | pnpm | pnpm | **npm** — hr-platform uses npm |
| pnpm | no | yes | yes | **no** — not needed |
| Python | yes (3.12) | no | no | **no** |
| Playwright | no | yes | no | **no** |
| Wrangler CLI | no | no | no | **YES — new requirement** |
| MCP: Jira | yes | no | no | **yes** |
| MCP: Dynamics | no | no | no | **YES — new requirement** |
| Dynamics data volume | no | no | no | **YES — JSON dumps (~9,860 rows)** |
| SSH server | yes (2222) | yes (2223) | yes (2224) | **yes (2225)** |
| sshd port | 2222 | 2223 | 2224 | **2225** |
| Dev server port | 5173 | 5175–5176 | 5177 | **5178** (Vite / wrangler dev) |
| Eilama daemon | no | no | no | **DROPPED** (not in spec) |
| Agent dashboard | no | no | no | **DROPPED** (separate track) |

### Key deltas from entu-research (closest ancestor)

1. **npm instead of pnpm** — hr-platform uses npm; pnpm can be removed
2. **Wrangler CLI** — installed globally; requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` passed at runtime
3. **Dynamics MCP server** — compiled Node.js server from `dev-toolkit/mcp/dynamics/`; needs a volume for JSON data files
4. **Jira MCP server** — compiled Node.js server from `dev-toolkit/jira-mcp-server/`; credentials from env vars
5. **Two repos** — `hr-platform` (main) + `dev-toolkit` (MCP servers live here)
6. **No reference repos** (entu had 3 repos; hr-devs has 2)

---

## 2. Container Architecture

### User & Home

```
User:     ai-teams  (uid=1000)
$HOME:    /home/ai-teams/
Workspace: /home/ai-teams/workspace/
  ├── hr-platform/          — main working repo (Eesti-Raudtee/hr-platform)
  └── dev-toolkit/          — MCP servers + standards (Eesti-Raudtee/dev-toolkit)
```

### Volumes

| Volume name | Mount path | Purpose | Wipe impact |
|---|---|---|---|
| `hr-claude-home` | `/home/ai-teams/.claude` | Claude auth, auto-memory, team configs, MCP credentials | Loses Claude session, memory — re-auth required |
| `hr-repo` | `/home/ai-teams/workspace` | Both git repos + node_modules | Forces re-clone on next start |
| `hr-dynamics-data` | `/home/ai-teams/dynamics-data` | Dynamics JSON dumps (read-only data, updated by sync service) | Loses data — must re-copy from host |

**No host bind mounts** except WARP CA cert and Dynamics data source.

### Dynamics data strategy

The Dynamics JSON files live at `hr-platform/conversations/docs/temp/` on the host. The container needs these at runtime. Two options:

**Option A (recommended): bind mount the host path read-only**

```yaml
volumes:
  - /home/dev/github/hr-platform/conversations/docs/temp:/home/ai-teams/dynamics-data:ro
```

Pros: data stays fresh (sync service on host updates files); no copy step needed.
Cons: couples container to host path.

**Option B: named volume, entrypoint copies on start**

Uses named volume `hr-dynamics-data`; entrypoint rsync/cp from a host path passed as env var. More complex, no clear benefit.

**Decision: Option A** — bind mount read-only. DYNAMICS_DATA_DIR inside container = `/home/ai-teams/dynamics-data`.

### Network

`network_mode: host` — same as apex/polyphony/entu. Required on WARP-protected RC server.

### Ports

| Port | Service |
|---|---|
| 2225 | SSH (ai-teams, pubkey auth, auto-tmux) |
| 5178 | Wrangler dev server / Vite (hr-platform/conversations) |
| 8787 | Wrangler preview (`wrangler dev` default) — same as Cloudflare Workers emulator |

Note: With `network_mode: host`, the port declarations in docker-compose are documentation only.

---

## 3. Wrangler / Cloudflare Integration

### Install

Wrangler is installed globally via npm at image build time:

```dockerfile
RUN npm install -g wrangler@latest
```

Pin to a specific version for reproducibility once the team stabilises:

```dockerfile
RUN npm install -g wrangler@3.110.0
```

### Credentials passthrough

Wrangler uses two env vars for auth (API token model, not OAuth). These are passed via docker-compose `.env` and written to `.bashrc` by entrypoint:

```yaml
environment:
  - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
  - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
```

`wrangler.toml` / `wrangler.jsonc` in the repo reference these env vars. No `~/.wrangler/` credential store needed with API token model.

### Deploy from container

Team runs deploys as:

```bash
cd /home/ai-teams/workspace/hr-platform/conversations
npm run deploy:dev          # wraps wrangler deploy --env dev
npm run deploy:production   # wraps wrangler deploy --env production
```

The `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in environment are sufficient. The same token used on local + RC (per MEMORY.md).

### D1 migrations from container

```bash
npm run db:migrate:local     # runs against local DB
npx wrangler d1 execute conversations-dev --env dev --file=...  # remote dev
```

Remote D1 operations require `CLOUDFLARE_API_TOKEN`. Wrangler picks it up from env.

---

## 4. MCP Servers

### Architecture

Both MCP servers run as processes launched by Claude Code when an agent session starts — they are NOT Docker sidecars. The `~/.claude/mcp.json` inside the `hr-claude-home` volume configures them. On first deploy, the PO copies or writes `mcp.json` to the volume.

### Jira MCP server

- Source: `dev-toolkit/jira-mcp-server/dist/index.js` (compiled, in the `dev-toolkit` volume)
- Credentials: `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` — written to `.bashrc` by entrypoint (same pattern as other env vars)
- mcp.json entry:

```json
{
  "jira": {
    "command": "node",
    "args": ["/home/ai-teams/workspace/dev-toolkit/jira-mcp-server/dist/index.js"],
    "env": {
      "ATLASSIAN_BASE_URL": "https://eestiraudtee.atlassian.net",
      "ATLASSIAN_EMAIL": "mihkel.putrinsh@evr.ee",
      "ATLASSIAN_API_TOKEN": "<from-env>"
    }
  }
}
```

The entrypoint writes `mcp.json` during first-run setup (similar to `settings.json`).

### Dynamics MCP server

- Source: `dev-toolkit/mcp/dynamics/dist/index.js` (compiled, in the `dev-toolkit` volume)
- Data: `DYNAMICS_DATA_DIR=/home/ai-teams/dynamics-data` (bind mount from host)
- Uses `sql.js` (pure WASM SQLite) — no native binaries, works in container
- mcp.json entry:

```json
{
  "dynamics": {
    "command": "node",
    "args": ["/home/ai-teams/workspace/dev-toolkit/mcp/dynamics/dist/index.js"],
    "env": {
      "DYNAMICS_DATA_DIR": "/home/ai-teams/dynamics-data"
    }
  }
}
```

### MCP server build requirement

Both MCP servers must be compiled (`npm run build`) before the container can use them. The `dev-toolkit` repo is cloned by entrypoint; entrypoint then runs `npm ci && npm run build` in each server directory on first clone (or if `dist/` is missing).

Build commands:

```bash
cd /home/ai-teams/workspace/dev-toolkit/jira-mcp-server && npm ci && npm run build
cd /home/ai-teams/workspace/dev-toolkit/mcp/dynamics       && npm ci && npm run build
```

---

## 5. File List

### Files to create

| File | Location | Purpose |
|---|---|---|
| `Dockerfile.hr-devs` | `.mmp/hr-devs/` | Image definition |
| `entrypoint-hr-devs.sh` | `.mmp/hr-devs/` | Startup logic (runs as root, drops to ai-teams) |
| `docker-compose.hr-devs.yml` | `.mmp/hr-devs/` | Service + volumes + env |
| `.env.example` | `.mmp/hr-devs/` | Template for required env vars |
| `apply-layout.sh` | `.mmp/hr-devs/.claude/teams/hr-devs/` | tmux layout creation script |
| `spawn_member.sh` | `.mmp/hr-devs/.claude/teams/hr-devs/` | Agent spawn script (adapted from hr-platform bare-metal version) |
| `startup.md` | `.mmp/hr-devs/.claude/teams/hr-devs/` | PO onboarding doc for container session |
| `statusline-command.sh` | `.mmp/hr-devs/.claude/` | Claude Code status bar script (MANDATORY per runbook §13) |

The `roster.json`, `prompts/`, `common-prompt.md`, and `memory/` files remain in `hr-platform/.claude/teams/hr-devs/` (source of truth in the hr-platform repo). The container clones `hr-platform` — these files come in via git, not container bake.

### Files NOT created (rationale)

- Layout JSON files (default.json, lite.json, full.json) — only `full-review` layout is used; implemented directly in `apply-layout.sh`, no JSON driver needed
- Eilama daemon files — dropped per task spec
- Dashboard server — separate track, not in spec

---

## 6. Dockerfile Design

```dockerfile
# Dockerfile.hr-devs (*FR:Brunel*)
#
# Extends ai-teams-claude:latest
# Additions vs entu-research:
#   - Wrangler CLI (global npm install)
#   - MCP server builds in-image (jira-mcp-server, dynamics MCP)
#   - npm retained (pnpm NOT installed)
#   - SSH port 2225

FROM ai-teams-claude:latest

# ── Fix inherited apt sources ──────────────────────────────────────────────────
RUN rm -f /etc/apt/sources.list.d/github-cli.list \
    && rm -f /usr/share/keyrings/githubcli-archive-keyring.gpg

# ── Node.js 22 LTS ────────────────────────────────────────────────────────────
# Base has Node.js 18; overlay Node.js 22 binary.
# --insecure: WARP TLS interception at build time (no CA cert yet).
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && curl --insecure -fsSL https://nodejs.org/dist/v22.14.0/node-v22.14.0-linux-x64.tar.gz \
       -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm /tmp/node.tar.gz \
    && node --version \
    && npm install -g npm@latest 2>&1 | tail -1 \
    && rm -rf /var/lib/apt/lists/*

# ── Timezone + SSH server + tmux + locales ────────────────────────────────────
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
        tzdata openssh-server tmux locales \
    && rm -rf /var/lib/apt/lists/* \
    && sed -i 's/# en_US.UTF-8/en_US.UTF-8/' /etc/locale.gen && locale-gen \
    && ln -snf /usr/share/zoneinfo/Europe/Tallinn /etc/localtime \
    && echo "Europe/Tallinn" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata \
    && mkdir -p /run/sshd \
    && ssh-keygen -A \
    && sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?UsePAM.*/UsePAM no/' /etc/ssh/sshd_config \
    && sed -i 's/^#\?Port .*/Port 2225/' /etc/ssh/sshd_config \
    && echo 'Port 2225' >> /etc/ssh/sshd_config
ENV DEBIAN_FRONTEND=

# ── Unlock ai-teams for SSH pubkey auth ──────────────────────────────────────
RUN usermod -p '*' ai-teams \
    && mkdir -p /home/ai-teams/.ssh \
    && chmod 700 /home/ai-teams/.ssh \
    && chown 1000:1000 /home/ai-teams/.ssh

# ── Wrangler CLI ──────────────────────────────────────────────────────────────
# Install globally. Agents run `wrangler` or `npx wrangler` from workspace.
RUN npm install -g wrangler@latest 2>&1 | tail -3 \
    && wrangler --version

# ── Native Claude Code install ────────────────────────────────────────────────
RUN gosu ai-teams bash -c 'curl --insecure -fsSL https://claude.ai/install.sh | bash' 2>&1 | tail -5

# ── Entrypoint ────────────────────────────────────────────────────────────────
COPY entrypoint-hr-devs.sh /entrypoint-hr-devs.sh
RUN chmod +x /entrypoint-hr-devs.sh

WORKDIR /home/ai-teams/workspace

EXPOSE 2225 5178 8787

ENTRYPOINT ["/entrypoint-hr-devs.sh"]
CMD ["bash"]
```

---

## 7. Entrypoint Design (entrypoint-hr-devs.sh)

Steps (following entu pattern with hr-devs additions):

```
Step 0   Fix hostname (network_mode: host)
Step 0b  WARP CA → system CA store + NODE_EXTRA_CA_CERTS
Step 1   Fix volume ownership (hr-claude-home, hr-repo)
Step 2   Validate required env vars (GITHUB_TOKEN, ANTHROPIC_API_KEY, CF creds, Atlassian creds)
Step 3a  Clone/pull hr-platform (main working repo)
Step 3b  Clone/pull dev-toolkit (MCP servers + standards)
Step 4a  Build Jira MCP server (npm ci + npm run build) if dist/ missing
Step 4b  Build Dynamics MCP server (npm ci + npm run build) if dist/ missing
Step 5   npm ci in hr-platform/conversations (if package.json exists)
Step 6   Runtime validation gates (Node.js ≥22, wrangler, claude, repos)
Step 7   Persist env vars to .bashrc (including CF creds, Atlassian creds)
Step 7b  tmux config + auto-tmux on SSH login (session name: "hr-devs")
Step 7c  Git attribution
Step 8   Claude settings.json (first run only)
Step 8b  mcp.json (first run only — writes Jira + Dynamics config)
Step 8c  statusline-command.sh registration in settings.json
Step 9   SSH key install + start sshd on port 2225
Step 10  Drop privileges: exec gosu ai-teams "$@"
```

### .bashrc env vars injected

```bash
HOME=/home/ai-teams
TZ=Europe/Tallinn
CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
GITHUB_TOKEN=<from-env>
CLAUDE_ENV_ID=HR-DEVS
LANG=en_US.UTF-8
LC_ALL=en_US.UTF-8
NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem   # only if set (WARP hosts)
CLOUDFLARE_API_TOKEN=<from-env>
CLOUDFLARE_ACCOUNT_ID=<from-env>
ATLASSIAN_BASE_URL=<from-env>
ATLASSIAN_EMAIL=<from-env>
ATLASSIAN_API_TOKEN=<from-env>
```

---

## 8. Docker Compose Design

```yaml
# docker-compose.hr-devs.yml (*FR:Brunel*)
#
# Port allocation on RC server (100.96.54.170):
#   2222 / 5173  — apex-research
#   2223 / 5175  — polyphony-dev
#   2224 / 5177  — entu-research
#   2225 / 5178  — hr-devs  (this file)
#
# Connect: ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170

services:
  hr-devs:
    build:
      context: .
      dockerfile: Dockerfile.hr-devs
      network: host    # WARP bypass at build time
    image: hr-devs-claude:latest
    container_name: hr-devs
    hostname: hr-devs
    network_mode: host
    environment:
      - HOME=/home/ai-teams
      - TZ=Europe/Tallinn
      - REPO_URL=${REPO_URL:-https://github.com/Eesti-Raudtee/hr-platform.git}
      - TOOLKIT_URL=${TOOLKIT_URL:-https://github.com/Eesti-Raudtee/dev-toolkit.git}
      - GITHUB_TOKEN=${GITHUB_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
      - CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
      - TEAM_NAME=${TEAM_NAME:-hr-devs}
      - SSH_PUBLIC_KEY=${SSH_PUBLIC_KEY:-}
      - SSH_PUBLIC_KEY_2=${SSH_PUBLIC_KEY_2:-}
      # Cloudflare — required for Wrangler deploys and D1 operations
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
      # Atlassian — required for Jira MCP
      - ATLASSIAN_BASE_URL=${ATLASSIAN_BASE_URL:-https://eestiraudtee.atlassian.net}
      - ATLASSIAN_EMAIL=${ATLASSIAN_EMAIL}
      - ATLASSIAN_API_TOKEN=${ATLASSIAN_API_TOKEN}
      # WARP CA — only set on WARP-protected hosts
      - NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem
    volumes:
      # Claude auto-memory, credentials, team config
      - hr-claude-home:/home/ai-teams/.claude
      # Both working repos (hr-platform + dev-toolkit) + node_modules
      - hr-repo:/home/ai-teams/workspace
      # Dynamics data: JSON dumps from host (read-only)
      # Host path: wherever the sync service writes; update this for your host.
      - /home/dev/github/hr-platform/conversations/docs/temp:/home/ai-teams/dynamics-data:ro
      # WARP CA cert (read-only, RC server only)
      - /usr/local/share/ca-certificates/managed-warp.pem:/opt/warp-ca.pem:ro
    ports:
      # Documented; ignored by Docker with network_mode: host
      - "2225:2225"   # SSH
      - "5178:5173"   # Vite dev server (vite listens on 5173 inside)
      - "8787:8787"   # Wrangler dev server
    working_dir: /home/ai-teams/workspace/hr-platform/conversations
    stdin_open: true
    tty: true
    restart: unless-stopped

volumes:
  hr-claude-home:
    name: hr_hr-claude-home
  hr-repo:
    name: hr_hr-repo
```

---

## 9. tmux Layout

The container uses exactly **one layout**: `full-review`, sourced from `hr-platform/.claude/teams/hr-devs/docs/tmux-layouts.md`. No other layouts (default, lite, full) are needed.

```
| lead   | marcus  | arvo      |
|        |---------------------|
|--------| tess    | sven      |
| finn   |---------------------|
|        | dag                 |
```

7 agents: team-lead + finn (left 30%), marcus + arvo (top-right), tess + sven (mid-right), dag (bottom-right).

**Split tree** (for `apply-layout.sh` implementation):

```
Window (%0)
├── split -h 30% → left (lead), right (R)
│   ├── split left -v 50% → lead, finn
│   └── split R -v 35% → marcus_row, RB
│       ├── split marcus_row -h 50% → marcus, arvo
│       └── split RB -v 50% → tess_row, dag
│           └── split tess_row -h 50% → tess, sven
```

The `apply-layout.sh` script implements this split tree using `-l` absolute sizes (not `-p` percent — see runbook §17). It does NOT auto-spawn agents — team-lead runs `spawn_member.sh` per agent after attaching.

Auto-tmux on SSH login: lands in `team-lead` pane, layout pre-created, `claude` not yet started. Team-lead types `claude` to begin the session, then spawns agents.

**Single layout only** — no default, lite, or full variants, per PO requirement.

---

## 10. State Map

| Path | Survives container stop? | Survives `docker rm`? | Survives `docker rm -v`? |
|---|---|---|---|
| `~/.claude/` | yes (named volume) | yes | **no** — volume deleted |
| `~/workspace/` | yes (named volume) | yes | **no** — volume deleted |
| `~/dynamics-data/` | yes (host bind mount) | yes | yes — on host |
| `~/.tmux.conf` | no (container FS) | no | no — recreated by entrypoint |
| `.bashrc` exports | no (container FS) | no | no — recreated by entrypoint |
| MCP server dist/ | yes (inside hr-repo volume) | yes | **no** — volume deleted |
| Claude OAuth creds | yes (inside hr-claude-home) | yes | **no** — volume deleted |

---

## 11. SSH Key

A new dedicated SSH key pair should be generated for hr-devs:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_hr_devs -C "hr-devs-container"
```

Public key goes into `.env` as `SSH_PUBLIC_KEY`. Connection:

```bash
ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170
```

---

## 12. Migration Plan

Moving from bare-metal to container without disrupting ongoing work.

### Prerequisites

1. Confirm no active agent sessions on bare-metal (coordinate with team-lead)
2. Generate SSH key for hr-devs container (`id_ed25519_hr_devs`)
3. Ensure `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` are in local `~/.claude/.env` (already there per MEMORY.md)
4. Ensure Atlassian credentials are in `~/.claude/.env`
5. Confirm Dynamics data path on RC server (`/home/dev/github/hr-platform/conversations/docs/temp` or equivalent)

### Step-by-step

**Phase 1: Build**

```bash
# On RC server
scp .mmp/hr-devs/Dockerfile.hr-devs dev@100.96.54.170:/home/dev/.mmp/hr-devs/
scp .mmp/hr-devs/entrypoint-hr-devs.sh dev@100.96.54.170:/home/dev/.mmp/hr-devs/
scp .mmp/hr-devs/docker-compose.hr-devs.yml dev@100.96.54.170:/home/dev/.mmp/hr-devs/
scp .mmp/hr-devs/.env dev@100.96.54.170:/home/dev/.mmp/hr-devs/
```

```bash
# On RC server
cd /home/dev/.mmp/hr-devs
docker compose -f docker-compose.hr-devs.yml build
```

**Phase 2: First start + OAuth**

```bash
docker compose -f docker-compose.hr-devs.yml up -d
ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170
# Run: claude (follow OAuth flow — opens browser URL)
# OAuth credentials saved to hr-claude-home volume
# exit
```

**Phase 3: Validation**

```bash
ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170
# Verify:
#   claude --version
#   wrangler --version
#   cd ~/workspace/hr-platform/conversations && npm test
#   node ~/workspace/dev-toolkit/jira-mcp-server/dist/index.js --help
#   node ~/workspace/dev-toolkit/mcp/dynamics/dist/index.js --help (or similar smoke test)
#   ls ~/dynamics-data/  (should show JSON dumps)
```

**Phase 4: MCP config**

On first attach, the entrypoint writes `~/.claude/mcp.json`. Verify it looks correct:

```bash
cat ~/.claude/mcp.json
```

If entrypoint-generated mcp.json has placeholders (ATLASSIAN_API_TOKEN), the entrypoint must bake in the actual values from env. See §8b design note.

**Phase 5: Team-lead handover**

Team-lead runs bare-metal startup normally but invokes container instead:

```bash
# Instead of running spawn_member.sh locally, SSH into container and run there
ssh -i ~/.ssh/id_ed25519_hr_devs -p 2225 ai-teams@100.96.54.170
# Inside container — already in hr-devs tmux session
claude  # starts team-lead session
```

**Phase 6: Decommission bare-metal**

After one full session on container confirmed working:

- Stop any bare-metal claude processes
- Archive bare-metal memory files to `hr-platform/.claude/teams/hr-devs/memory/` (git commit)
- Container is now sole environment

---

## 13. Open Questions

1. **Dynamics data host path on RC server** — where does the sync service write? Must confirm before writing the bind mount path in docker-compose. Placeholder used above: `/home/dev/github/hr-platform/conversations/docs/temp`.

2. **ANTHROPIC_API_KEY vs OAuth** — current bare-metal uses OAuth credentials. Container approach: first-run OAuth, credentials saved to `hr-claude-home` volume. No ANTHROPIC_API_KEY needed in `.env` if OAuth is used. Document in `.env.example`.

3. **mcp.json credential injection** — entrypoint writes `mcp.json` with Atlassian token. Security: token plaintext in container FS (same as current bare-metal). Acceptable for now; Docker secrets or volume-mounted credential file is the upgrade path.

4. **hr-platform repo access** — `hr-platform` is private (`Eesti-Raudtee/hr-platform`). `GITHUB_TOKEN` must have `repo` scope for this org. Confirm token scope covers Eesti-Raudtee repos (same token already used on RC per MEMORY.md).

5. **Wrangler version pinning** — spec uses `wrangler@latest`. Once deployed, pin to the version the team uses to avoid surprise API changes on rebuild.

6. **spawn_member.sh NODE_EXTRA_CA_CERTS** — current bare-metal `spawn_member.sh` hardcodes `NODE_EXTRA_CA_CERTS=/home/dev/.claude/custom_certs.pem`. Container path is `/opt/warp-ca.pem`. The spawn script must be updated for the container (it gets the right value via `.bashrc` anyway, but the hardcoded export in spawn script will override).

---

## 14. .env.example

```
# Required
GITHUB_TOKEN=ghp_...            # PAT with repo scope for Eesti-Raudtee org
ANTHROPIC_API_KEY=              # Leave blank if using OAuth (recommended)

# Cloudflare — for Wrangler deploys and D1
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

# Atlassian — for Jira MCP
ATLASSIAN_BASE_URL=https://eestiraudtee.atlassian.net
ATLASSIAN_EMAIL=mihkel.putrinsh@evr.ee
ATLASSIAN_API_TOKEN=...

# SSH access
SSH_PUBLIC_KEY=ssh-ed25519 AAAA...   # ~/.ssh/id_ed25519_hr_devs.pub
SSH_PUBLIC_KEY_2=                     # Optional: PO second key

# Git attribution
GIT_USER_NAME=hr-devs
GIT_USER_EMAIL=mihkel.putrinsh@evr.ee

# Optional overrides
REPO_URL=https://github.com/Eesti-Raudtee/hr-platform.git
TOOLKIT_URL=https://github.com/Eesti-Raudtee/dev-toolkit.git
TEAM_NAME=hr-devs
TZ=Europe/Tallinn
```

---

## 15. Failure Modes

| Scenario | Behaviour | Recovery |
|---|---|---|
| Container crash | `restart: unless-stopped` — restarts automatically | SSH in, check `docker logs hr-devs` |
| `hr-claude-home` volume full | Claude writes fail silently | `docker volume inspect hr_hr-claude-home`, prune old files |
| GITHUB_TOKEN expired | entrypoint exits with error | Update `.env`, `docker compose down && up` |
| CLOUDFLARE_API_TOKEN expired | Wrangler deploys fail at runtime | Update `.env`, `docker compose down && up` |
| Git conflict in workspace | entrypoint git pull may fail with "non-fast-forward" | SSH in, resolve manually in `~/workspace/hr-platform/` |
| Dynamics bind mount missing | MCP server starts but returns empty results | Confirm host path exists; update compose and restart |
| MCP server dist/ missing | Claude can't start MCP; agents get no Jira/Dynamics tools | SSH in, run `npm ci && npm run build` in each server dir |
| WARP CA cert rotated | TLS errors in Node.js | Update bind-mount path or copy new cert; restart container |

---

*Spec complete. Ready for implementation.*

(*FR:Brunel*)
