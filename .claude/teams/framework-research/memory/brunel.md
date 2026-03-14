---

# Brunel scratchpad

[DECISION] 2026-03-14 11:45 — Full isolation redesign (PO requirement): no host bind mounts. Repo in named volume repo-data, cloned/pulled by entrypoint. Git auth via GITHUB_TOKEN env var (HTTPS). Claude installed via npm inside image.

[DECISION] 2026-03-14 11:45 — Two named volumes: claude-home (~/.claude/) + repo-data (git repo). Both survive docker stop/start. Wipe separately: --wipe-memory or --wipe-all flag on session-stop.sh.

[DECISION] 2026-03-14 11:45 — gosu for privilege drop in entrypoint.sh. Preserves full env (ANTHROPIC_API_KEY etc), no login shell overhead, no `su -c` quoting issues.

[DECISION] 2026-03-14 11:45 — $HOME inside container = /home/michelek (matches host). Load-bearing: lifecycle scripts use $HOME to derive runtime team dir. Also required for ~/.claude/projects/ memory key stability (keys are absolute paths).

[GOTCHA] 2026-03-14 11:45 — Docker creates named volumes owned by root before any user exists. entrypoint.sh: runs as root, chowns ~/.claude/ to HOST_UID:HOST_GID, then gosu drops to user.

[GOTCHA] 2026-03-14 11:45 — Ubuntu 24.04 base image has GID 1000 ('ubuntu') and UID 1000. Dockerfile uses groupmod -n + usermod -l to rename rather than create fresh.

[GOTCHA] 2026-03-14 11:45 — npm-installed Claude is Node.js version (cli.js). Host Claude is a compiled 225MB ELF — separate distribution, no public download URL. Node.js version is functionally equivalent for agent teams.

[PATTERN] 2026-03-14 11:45 — Two-volume pattern (full isolation): (1) claude-home for ~/.claude/ auto-memory, (2) repo-data for git repo. Entrypoint does git clone (first run) or git pull (subsequent). No host filesystem access.

[LEARNED] 2026-03-14 11:45 — Entrypoint ordering is load-bearing (R6): git pull/clone must complete before shell opens. If clone fails (bad GITHUB_TOKEN), container exits — correct, prevents Claude starting without repo.

[CHECKPOINT] 2026-03-14 11:45 — Full isolation implementation complete and tested:

- Build: ubuntu:24.04 + nodejs + npm + git + jq + openssh + gosu
- entrypoint.sh: root → chown ~/.claude → git clone/pull → gosu drop
- docker-compose.yml: two named volumes, env passthrough, no bind mounts
- session-start.sh: loads .env, validates GITHUB_TOKEN, exports vars, runs compose
- session-stop.sh: --wipe-memory / --wipe-all options
- .env.example: documents required vars
- Tested E2E: clone, git log, claude --version, identity, volume persistence across 2 restarts

[DEFERRED] 2026-03-14 11:45 — MCP server connectivity. No MCP servers currently configured. If added, may need additional ports or socket mounts in docker-compose.yml.
