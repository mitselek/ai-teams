# Brunel scratchpad

[DECISION] 2026-03-14 11:45 — Full isolation: no host bind mounts. GITHUB_TOKEN for git auth. Claude via npm. gosu for privilege drop.

[DECISION] 2026-03-14 11:45 — Final container layout (PO confirmed):
  User: ai-teams (uid=1000), HOME=/home/ai-teams
  ~/.claude/ → per-team named volume (auto-memory, isolated per team)
  Repo → /home/ai-teams/workspace/ (shared named volume, same repo both teams)
  Comms → /shared/comms/ (shared named volume, Unix socket inter-team comms)

[DECISION] 2026-03-14 12:12 — One shared Dockerfile for both teams (deps identical). gh CLI added. Both services → same ai-teams-claude:latest image. Per-team volumes: ai-teams_fr-claude-home, ai-teams_cd-claude-home.

[GOTCHA] 2026-03-14 — Docker named volumes created as root. entrypoint.sh loops over ~/.claude/ and /shared/comms/, chowns both to 1000:1000 on first start.

[GOTCHA] 2026-03-14 — Ubuntu 24.04 has GID/UID 1000 = 'ubuntu'. Dockerfile uses groupmod -n + usermod -l to rename to 'ai-teams'.

[GOTCHA] 2026-03-14 — npm Claude = Node.js version (cli.js, ~5 packages). Host Claude = compiled ELF (no public URL). Functionally equivalent for agent teams.

[GOTCHA] 2026-03-14 — Shared repo-data volume: both teams clone/pull the same volume. First team to start does the clone; second team gets git pull. Race condition if both start simultaneously — not handled, acceptable for current use.

[PATTERN] 2026-03-14 — session-start.sh takes team name as arg: ./session-start.sh framework-research | comms-dev. Defaults to framework-research.

[LEARNED] 2026-03-14 — GITHUB_TOKEN fallback chain: env → .env file → gh auth token → error. gh CLI is available on host, so no manual token setup needed.

[CHECKPOINT] 2026-03-14 12:12 — Implementation complete and tested:
- Dockerfile: ubuntu:24.04 + nodejs + npm + git + gh + jq + openssh + gosu
- entrypoint.sh: fix volume ownership (loop), git clone/pull, gosu drop
- docker-compose.yml: 2 services (framework-research, comms-dev), 4 volumes, YAML anchor for shared config
- session-start.sh: team arg, GITHUB_TOKEN fallback, per-team memory volume name in output
- session-stop.sh: --wipe-memory [team] / --wipe-all
- .env.example: GITHUB_TOKEN, ANTHROPIC_API_KEY
- Tested: clone, git pull, claude --version, memory isolation, comms volume read/write

[WIP] 2026-03-14 15:38 — Next: team-lead running framework-research inside Docker container to test inter-team comms with comms-dev. Container setup is ready. No outstanding Brunel tasks.

[DEFERRED] 2026-03-14 — MCP server connectivity. No MCP servers configured. If added, may need ports or socket mounts.
[DEFERRED] 2026-03-14 — SSH agent forwarding for git push over SSH. HTTPS + GITHUB_TOKEN covers current use.
[DEFERRED] 2026-03-14 — Shared repo-data race condition on simultaneous first start. Low priority for current sequential use.
