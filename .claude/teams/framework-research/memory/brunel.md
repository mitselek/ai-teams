# Brunel scratchpad

[DECISION] 2026-03-14 11:45 — Full isolation: no host bind mounts. GITHUB_TOKEN for git auth. Claude via npm. gosu for privilege drop.

[DECISION] 2026-03-14 11:45 — Final container layout (PO confirmed):
  User: ai-teams (uid=1000), HOME=/home/ai-teams
  ~/.claude/ → per-team named volume (auto-memory, isolated per team)
  Repo → /home/ai-teams/workspace/ (shared named volume, same repo both teams)
  Comms → /shared/comms/ (shared named volume, Unix socket inter-team comms)

[DECISION] 2026-03-14 12:12 — One shared Dockerfile for both teams (deps identical). gh CLI added. Both services → same ai-teams-claude:latest image. Per-team volumes: ai-teams_fr-claude-home, ai-teams_cd-claude-home.

[DECISION] 2026-03-14 17:xx — Relay architecture (issues #7/#8): full Cloudflare stack.

- Relay WS routing: Durable Object (hibernation API)
- Store-and-forward queue: DO Storage + DO Alarm (replaces setInterval)
- REST API + WS upgrade: Worker
- Message history + user registry: D1
- Frontend: CF Pages + SvelteKit + adapter-cloudflare + TailwindCSS 4
- Team containers: only change is RELAY_URL + RELAY_TOKEN env vars; comms volume removed

[DECISION] 2026-03-14 17:xx — UDS/comms volume is obsolete once relay is live. docker-compose.yml loses: comms volume, comms-psk secret, depends_on. Team containers become stateless WS clients pointing at cloud relay.

[GOTCHA] 2026-03-14 — Docker named volumes created as root. entrypoint.sh loops over ~/.claude/ and /shared/comms/, chowns both to 1000:1000 on first start.

[GOTCHA] 2026-03-14 — Ubuntu 24.04 has GID/UID 1000 = 'ubuntu'. Dockerfile uses groupmod -n + usermod -l to rename to 'ai-teams'.

[GOTCHA] 2026-03-14 — npm Claude = Node.js version (cli.js, ~5 packages). Host Claude = compiled ELF (no public URL). Functionally equivalent for agent teams.

[GOTCHA] 2026-03-14 — Shared repo-data volume: both teams clone/pull the same volume. First team to start does the clone; second team gets git pull. Race condition if both start simultaneously — not handled, acceptable for current use.

[GOTCHA] 2026-03-14 — DO hibernation: in-memory routing table (Map<teamName, WebSocket>) does NOT survive eviction. Must rebuild on every wake using socket tags. Pattern: acceptWebSocket(ws, [teamName]) at registration; ctx.getWebSockets(tag) to retrieve. Routing table reconstruction is O(n) per message wake.

[GOTCHA] 2026-03-14 — D1 multi-statement: db.prepare("stmt1; stmt2").run() only executes first statement in some workerd contexts. Use separate .run() per statement. (Source: RC-team architecture-decisions.md)

[GOTCHA] 2026-03-14 — D1 migrations: PRAGMA foreign_keys = OFF is a NO-OP in D1's migration runner. Use table-rebuild pattern (_new table + copy + drop + rename) for schema changes. (Source: RC-team architecture-decisions.md)

[GOTCHA] 2026-03-14 — WebAuthn is origin-bound. Frontend (CF Pages) and relay auth endpoint must share apex domain. CF Pages *.pages.dev domain won't work — PO needs a custom domain before WebAuthn can be tested E2E. rpId = apex domain (covers both subdomains).

[PATTERN] 2026-03-14 — session-start.sh takes team name as arg: ./session-start.sh framework-research | comms-dev. Defaults to framework-research.

[PATTERN] 2026-03-14 — Relay monorepo structure: comms-relay/relay-do/ + relay-worker/ + relay-frontend/ + migrations/. Separate wrangler.toml per service (CF Pages vs Workers have different deploy mechanisms).

[PATTERN] 2026-03-14 — Two-secret model for relay: RELAY_TOKEN (bearer auth on WS upgrade, relay access) + COMMS_PSK (AES-256-GCM E2E payload encryption, team-to-team). Relay never sees COMMS_PSK.

[LEARNED] 2026-03-14 — GITHUB_TOKEN fallback chain: env → .env file → gh auth token → error. gh CLI is available on host, so no manual token setup needed.

[LEARNED] 2026-03-14 — comms-send.ts requires COMMS_TEAM_PREFIX env var in addition to COMMS_TEAM_NAME and COMMS_SOCKET_DIR. Not documented in issue #1 instructions.

[LEARNED] 2026-03-14 — Background processes don't persist across bash shell sessions (shell state resets). Broker must be restarted each time. Not a problem in production (container keeps process alive) but relevant for manual testing.

[LEARNED] 2026-03-14 — DO Alarms: ctx.storage.setAlarm(Date.now() + TTL_MS) wakes the DO at the scheduled time. Max 1 alarm active per DO. Correct replacement for setInterval TTL sweeps in hibernating DOs.

[LEARNED] 2026-03-14 — DO single-instance = single geographic SPOF. CF pins DO to datacenter of first connection. Sharding by conversation_id (multiple DO instances) is the v2 scaling path. Acceptable for v1.

[CHECKPOINT] 2026-03-14 12:12 — v1 container implementation complete and tested:

- Dockerfile: ubuntu:24.04 + nodejs + npm + git + gh + jq + openssh + gosu
- entrypoint.sh: fix volume ownership (loop), git clone/pull, gosu drop
- docker-compose.yml: 2 services (framework-research, comms-dev), 4 volumes, YAML anchor for shared config
- session-start.sh: team arg, GITHUB_TOKEN fallback, per-team memory volume name in output
- session-stop.sh: --wipe-memory [team] / --wipe-all
- .env.example: GITHUB_TOKEN, ANTHROPIC_API_KEY
- Tested: clone, git pull, claude --version, memory isolation, comms volume read/write

[CHECKPOINT] 2026-03-14 17:35 — Relay architecture analysis complete (issues #7, #8):

- Reviewed RFC #7 (UDS→WSS relay), RFC #8 (web frontend + WebAuthn)
- Provided positions on 3 blocking decisions (best-effort queue, EXPIRED notification, dual routing table)
- Full CF stack analysis: DO hibernation gotchas, D1 patterns, monorepo structure, DO limits
- Team containers need minimal changes for relay: drop comms volume + psk, add RELAY_URL + RELAY_TOKEN
- No Brunel implementation tasks outstanding — analysis phase complete, awaiting comms-dev build

[CHECKPOINT] 2026-03-14 21:42 — T06 Container Lifecycle section rewritten to match actual implemented architecture (full isolation, named volumes, no bind mounts, ai-teams user, GITHUB_TOKEN). Added "Interaction with Volta's Startup/Shutdown Protocol" subsection confirming container is transparent to Volta's 7-phase startup and 5-phase shutdown — no protocol changes required. All phases verified compatible.

[DECISION] 2026-03-14 21:49 — Broker deployment: SIDECAR (confirmed with Herald). docker-compose.yml updated: broker-framework-research + broker-comms-dev services, depends_on+healthcheck(socket), TLS-PSK via Docker secrets on broker only, per-team broker inbox volumes (fr-broker-inbox, cd-broker-inbox). ai-teams-broker:latest is placeholder — comms-dev delivers implementation. T06 updated.

[GOTCHA] 2026-03-14 — Per-team broker inbox volume is essential. Without it, broker restart loses queued messages — same failure mode as inline daemon, just less frequent. Herald identified this gap; volumes added to compose.

[DEFERRED] 2026-03-14 — MCP server connectivity. No MCP servers configured. If added, may need ports or socket mounts.
[DEFERRED] 2026-03-14 — SSH agent forwarding for git push over SSH. HTTPS + GITHUB_TOKEN covers current use.
[DEFERRED] 2026-03-14 — Shared repo-data race condition on simultaneous first start. Low priority for current sequential use.
[DEFERRED] 2026-03-14 — docker-compose.yml update to remove comms volume + psk + add RELAY_URL/RELAY_TOKEN. Blocked on comms-dev shipping the relay. Do not update compose until relay is live.

[CHECKPOINT] 2026-03-17 13:40 — apex-research container deployed on RC server (dev@100.96.54.170):

- Dockerfile.apex: ai-teams-claude:latest + Node.js 22 (binary) + Python 3.12 + sshd (port 2222) + sudo
- docker-compose.yml: network_mode: host, 3 named volumes, no broker/comms
- entrypoint-apex.sh: clone 2 repos, symlink, venv, sshd, runtime validation gates
- All gates passing: Python 3.12, Node.js v22.14.0, Claude 2.1.77, both repos cloned, source-data read-only enforced

[GOTCHA] 2026-03-17 — RC server runs Cloudflare WARP. Docker bridge traffic NOT routed through WARP tunnel. Fix: network_mode: host in docker-compose.yml + --network=host for docker build.

[GOTCHA] 2026-03-17 — WARP does TLS interception with self-signed CA. curl/wget fail SSL verification inside containers. Fix for Node.js install: download binary with curl --insecure (build-time only).

[GOTCHA] 2026-03-17 — Base image (ai-teams-claude:latest) installs Node.js 18 via Ubuntu apt. Not enough for Claude Code. Apex Dockerfile overlays Node.js 22 binary from nodejs.org into /usr/local/ (overwrites 18).

[GOTCHA] 2026-03-17 — Base image's GitHub CLI apt source key goes stale in child images. Remove /etc/apt/sources.list.d/github-cli.list before apt-get update in derived Dockerfiles.

[GOTCHA] 2026-03-17 — useradd creates accounts with locked password (! in /etc/shadow). With UsePAM no, sshd rejects locked accounts even for pubkey auth ("User not allowed because account is locked"). Fix: usermod -p '*' <user> sets password to "no password" (*) instead of "locked" (!). This allows pubkey auth while still having no usable password.

[GOTCHA] 2026-03-17 — Docker :ro volume flag prevents ALL writes including root. Can't clone into :ro volume. Fix: mount read-write, then chown root:root + chmod a-w,a+rX after clone to enforce read-only at filesystem level.

[GOTCHA] 2026-03-17 — network_mode: host means container sshd shares host ports. Must use port 2222 to avoid conflict with host sshd on port 22.

[GOTCHA] 2026-03-17 — WARP CA cert must NOT be bind-mounted to /etc/ssl/certs/ — update-ca-certificates tries to create a symlink at the same path and fails ("Device or resource busy"). Mount to /opt/warp-ca.pem instead and set NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem. Entrypoint copies cert to /usr/local/share/ca-certificates/ and runs update-ca-certificates for system tools.

[GOTCHA] 2026-03-17 — Entrypoint multi-key SSH: collect all SSH_PUBLIC_KEY* env vars into authorized_keys. Docker Compose .env doesn't support multiline values, so use SSH_PUBLIC_KEY, SSH_PUBLIC_KEY_2, etc.

[GOTCHA] 2026-03-18 — Compose env vars don't propagate through sudo su or SSH login shells. Must persist to .bashrc via entrypoint. Use sed -i delete+append pattern to avoid duplicates on restart.

[GOTCHA] 2026-03-18 — Claude Code npm-global install requires sudo for auto-updates. Native install via curl <https://claude.ai/install.sh> | bash goes to ~/.local/bin/ and self-updates without sudo.

[GOTCHA] 2026-03-18 — tmux must be started with -u flag for UTF-8 rendering (Claude prompt ❯ symbol). Also needs .tmux.conf with "set -g default-terminal tmux-256color".

[CHECKPOINT] 2026-03-18 10:40 — apex-research container FINAL state on RC server (dev@100.96.54.170):

- Image: apex-research-claude:latest (ai-teams-claude base + Node.js 22 + Python 3.12 + sshd + tmux + locales + sudo + native Claude)
- Volumes: apex-claude-home, apex-research-repo, apex-source-data (3 named volumes)
- Network: host mode (WARP bypass), WARP CA bind-mounted at /opt/warp-ca.pem
- SSH: port 2222, both michelek + ai-teams, pubkey auth, passwordless sudo
- Claude Code: native install (~/.local/bin/claude v2.1.78), OAuth credentials (.credentials.json in volume)
- Settings: bypassPermissions, Jira write tools denied, statusLine with CLAUDE_ENV_ID=APEX-R
- MCP: Jira server at /opt/jira-mcp-server/ with Atlassian creds + WARP CA
- Locale: en_US.UTF-8, tmux -u for Unicode
- Entrypoint: 10 idempotent steps + sub-steps (hostname, WARP CA, volumes, 2 repos, symlink, venv, Jira MCP, SSH, validation, env vars, git config, tmux.conf, settings.json, mcp.json, exec gosu)
- Deployment runbook: .claude/teams/framework-research/docs/container-deployment-runbook.md

[DEFERRED] 2026-03-18 — Container files (Dockerfile.apex, entrypoint-apex.sh, docker-compose.yml, statusline-command.sh, .dockerignore, .env.example) need git commit+push. RC server has them via SCP — needs git pull after push to sync.
[DEFERRED] 2026-03-18 — Image rebuild on RC server needed to bake in: native Claude, tmux, locales, ai-teams unlock, ai-teams SSH, statusline script. Currently applied live but not in image.

[CHECKPOINT] 2026-03-18 — Timezone fix documented (3 layers): Dockerfile (tzdata + ln -snf + dpkg-reconfigure), docker-compose.yml (TZ=Europe/Tallinn env var), entrypoint SHELL_VARS ([TZ]=Europe/Tallinn). Live-fix commands without rebuild also provided.

[CHECKPOINT] 2026-03-18 — polyphony-dev container design complete. 3 files at .mmp/polyphony/:

- Dockerfile.polyphony: ai-teams-claude base + Node.js 22 + pnpm 9.15.0 + Playwright Chromium deps + browser at /opt/playwright/cache + native Claude + TZ baked in
- docker-compose.polyphony.yml: bridge network, ports 5173/5174, PLAYWRIGHT_BROWSERS_PATH, WARP CA commented out for local dev
- entrypoint-polyphony.sh: clone/pull → pnpm install --frozen-lockfile → gates → .bashrc → settings.json → gosu drop

[GOTCHA] 2026-03-18 — pnpm + containers: node_modules inside named volume (not host). --frozen-lockfile enforces lockfile discipline. Remove flag if team needs dep updates inside container.
[GOTCHA] 2026-03-18 — Playwright browser: install at build time as root, copy to /opt/playwright/cache, chmod a+rX. Set PLAYWRIGHT_BROWSERS_PATH in compose env AND .bashrc.
[DECISION] 2026-03-18 — No SSH server in polyphony container initially. Later reversed — SSH server added (port 2223, ai-teams user, pubkey auth, auto-tmux). Polyphony key: ssh-ed25519 ...6AAt (dedicated, NOT apex key). Connection: ssh -i ~/.ssh/id_ed25519_polyphony -p 2223 ai-teams@100.96.54.170.

[CHECKPOINT] 2026-03-19 — polyphony-dev container FINAL state (all tasks complete):

- Dockerfile.polyphony: sshd (port 2223), tmux, locales, Playwright Chromium deps + browser at /opt/playwright/cache, native Claude, TZ=Europe/Tallinn, pnpm 9.15.0, usermod -p '*' ai-teams
- docker-compose.polyphony.yml: network_mode: host (WARP), WARP CA at /opt/warp-ca.pem (uncommented), NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem (hardcoded), SSH_PUBLIC_KEY via .env, 2 named volumes
- entrypoint-polyphony.sh: 7 steps — WARP CA, volumes, clone/pull, pnpm install --frozen-lockfile, gates, .bashrc (CLAUDE_ENV_ID=POLY, NODE_EXTRA_CA_CERTS, TZ, PLAYWRIGHT_BROWSERS_PATH), tmux config + auto-tmux, git config, settings.json, SSH key+sshd, gosu drop
- .claude/statusline-command.sh: green badge, pnpm test cache from /tmp/polyphony-test-status.txt
- .claude/settings.json: statusLine.command → bash /home/ai-teams/workspace/.claude/statusline-command.sh
- Runbook: §12 (NODE_EXTRA_CA_CERTS 3-part fix) + §13 (statusline design rules) added

[DEFERRED] 2026-03-19 — polyphony container files need git commit+push to polyphony repo. Also: Dockerfile.apex + entrypoint-apex.sh git commit+push still pending from 2026-03-18.

[CHECKPOINT] 2026-03-19 — entu-research container design complete. 3 files at .mmp/entu-research/:

- Dockerfile.entu: polyphony base minus Playwright; SSH port 2224, pnpm 9.15.0, Node.js 22
- entrypoint-entu.sh: clones 3 repos (entu-research main + entu-webapp + entu-plugins refs); pnpm install skipped if no package.json yet; CLAUDE_ENV_ID=ENTU-R; tmux session=entu; sshd port 2224
- docker-compose.entu.yml: network_mode: host, 2 named volumes (entu-claude-home, entu-repo), WARP CA bind-mount, ports 2224/5177

[DECISION] 2026-03-19 — entu-research workspace: ~/workspace/entu-research/ (rw) + ~/workspace/entu-webapp/ + ~/workspace/entu-plugins/ (refs). All in single entu-repo volume. No read-only filesystem enforcement on refs — team needs git pull on them at startup.

[DEFERRED] 2026-03-19 — entu-research container files need git commit+push to entu/research repo + OAuth credentials copy from host after first deploy.

[CHECKPOINT] 2026-03-19 — entu-research tmux layout system complete. Files in .mmp/entu-research/.claude/teams/entu-research/:

- layouts/default.json: Saavedra left 30%, Codd+Hopper top-right, Semper+Hamilton bottom-right
- apply-layout.sh: recursive split tree → writes /tmp/entu-panes.env with PANE_* vars
- spawn_member.sh: duplicate gate + --target-pane + config.json registration; saavedra.md for team-lead
- reflow.sh: tiled fallback reflow after agent crash
- start-team.sh: one-shot apply-layout → source pane env → spawn 4 specialists
- startup.md: updated to use tmux scripts (start-team.sh) not Agent tool

[DECISION] 2026-03-19 — entu-research uses RC/tmux spawning path (spawn_member.sh), not local Agent tool. Container runs on RC server with tmux SSH access.

[GOTCHA] 2026-03-19 — tmux split-window -p <percent> fails with "size missing" when called from a Bash tool subprocess or external SSH against an attached session. Root cause: tmux needs a client to resolve percent to pixels. Fix: use -l <columns> (absolute size). Also use -d (keep focus) and -P -F '#{pane_id}' (reliable pane ID capture, no fragile tail -1).

[CHECKPOINT] 2026-03-19 — entu-research startup UX fixed (final). Three commits to entu/research:

- 6fe6ac8: apply-layout.sh uses -l not -p (safe from Bash tool subprocess)
- 383ab24: entrypoint auto-tmux block creates 5-pane layout + starts claude before attach
- a2fb91b: startup.md updated
Final flow: SSH → .bashrc creates layout + starts claude → PO lands in Claude → TeamCreate + spawn_member.sh. Runbook §17 added to mitselek-ai-teams runbook.

[GOTCHA] 2026-03-19 — tmux new-session -d fails with "no server running" if a stale socket exists from a crashed server. Acceptable: container restart cleans /tmp, so stale sockets don't persist across restarts.

[CHECKPOINT] 2026-03-19 — Runbook complete. §17 (size missing), §18 (SSH→hello pattern), §19 (pane labels) added to container-deployment-runbook.md. Generic enough for apex-research and future teams.

[CHECKPOINT] 2026-03-20 — Statusline live-fixed for entu-research container:

- statusline-command.sh written to ~/workspace/entu-research/.claude/ and pushed (commit 6525418)
- ~/.claude/settings.json patched: statusLine.command = bash .../statusline-command.sh
- CLAUDE_ENV_ID=ENTU-R already in .bashrc — no change needed
- Smoke test passed: colored statusline with ENTU-R badge confirmed
- Runbook: §13 marked MANDATORY with callout box; §20 (Statusline Deployment Checklist) added
- Quick Reference updated with Step 9d (statusline-command.sh) and CLAUDE_ENV_ID note on Step 9
- Root cause: entu deployed before §13 was written and statusline was treated as optional

[CHECKPOINT] 2026-03-20 — hr-devs container spec complete:

- Spec at: .claude/teams/framework-research/docs/hr-devs-container-spec.md
- Port allocation: SSH=2225, Vite=5178, Wrangler=8787
- Key deltas from entu: npm (not pnpm), Wrangler global, Jira+Dynamics MCP, dev-toolkit as 2nd repo
- Dynamics data: bind mount read-only from host (Option A — no named volume needed)
- MCP servers: Claude-launched processes (not sidecars), built by entrypoint if dist/ missing
- Eilama DROPPED, agent dashboard DROPPED (separate track)
- 6 open questions documented (Dynamics host path, wrangler pin, spawn script CA path override)

[CHECKPOINT] 2026-03-20 — hr-devs container implementation complete. 8 files at .mmp/hr-devs/:
- Dockerfile.hr-devs: Node.js 22, Wrangler@latest, SSH port 2225, native Claude, no pnpm
- entrypoint-hr-devs.sh: 10 steps — WARP CA, volumes, 2 repos, MCP builds (Jira+Dynamics), npm ci, gates, .bashrc (HR-DEVS, CF creds, Atlassian creds), tmux, settings.json, mcp.json, SSH, gosu drop
- docker-compose.hr-devs.yml: network_mode:host, 2 named volumes + Dynamics bind mount (:ro) at /home/dev/github/hr-platform/conversations/docs/temp, ports 2225/5178/8787
- .env.example: all required + optional vars documented, ANTHROPIC_API_KEY optional (OAuth standard)
- apply-layout.sh: "full" layout (finn+lead left 30%, marcus+tess+sven right 70%), -l absolute sizes, pane labels, /tmp/hr-devs-panes.env
- spawn_member.sh: container variant — NODE_EXTRA_CA_CERTS via .bashrc (not hardcoded), eilama removed, TMUX_SESSION default=hr-devs
- startup.md: PO onboarding — connect, TeamCreate, spawn sequence, Vite port 5178, Wrangler deploys, MCP verification
- statusline-command.sh: HR-DEVS blue badge, npm test cache at /tmp/hr-devs-test-status.txt

[GOTCHA] 2026-03-20 — hr-devs Vite port: apex uses 5173 on host. hr-devs must use 5178 (npm run dev -- --port 5178). Documented in startup.md + VITE_PORT in .bashrc. Wrangler dev = 8787 (no conflict).
