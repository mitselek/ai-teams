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

[DEFERRED] 2026-03-14 — MCP server connectivity. No MCP servers configured. If added, may need ports or socket mounts.
[DEFERRED] 2026-03-14 — SSH agent forwarding for git push over SSH. HTTPS + GITHUB_TOKEN covers current use.
[DEFERRED] 2026-03-14 — Shared repo-data race condition on simultaneous first start. Low priority for current sequential use.
[DEFERRED] 2026-03-14 — docker-compose.yml update to remove comms volume + psk + add RELAY_URL/RELAY_TOKEN. Blocked on comms-dev shipping the relay. Do not update compose until relay is live.
