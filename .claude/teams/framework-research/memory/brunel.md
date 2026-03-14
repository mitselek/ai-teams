---

# Brunel scratchpad

[DECISION] 2026-03-14 11:30 — Container architecture: bind-mount Claude binary from host (225MB ELF, minimal libc deps, no npm install needed). Named Docker volume for ~/.claude/. Named claude-home volume = ai-teams_claude-home.

[DECISION] 2026-03-14 11:30 — $HOME inside container = /home/michelek (matches host). This is load-bearing: lifecycle scripts (restore-inboxes.sh, persist-inboxes.sh) use $HOME to derive runtime team dir. No script changes needed.

[DECISION] 2026-03-14 11:30 — gosu for privilege drop in entrypoint.sh. Reasons: preserves full env (ANTHROPIC_API_KEY etc), no login shell overhead, no `su -c` quoting issues.

[GOTCHA] 2026-03-14 11:30 — Docker creates named volumes owned by root before any user exists in the container. Result: first-run permission denied on ~/.claude/. Fixed via entrypoint.sh: runs as root, chowns ~/.claude/ to HOST_UID:HOST_GID, then gosu drops to user.

[GOTCHA] 2026-03-14 11:30 — Ubuntu 24.04 base image already has GID 1000 (group 'ubuntu'). Dockerfile uses groupmod -n to rename existing group rather than groupadd. Same for UID 1000 (user 'ubuntu') — uses usermod -l to rename.

[PATTERN] 2026-03-14 11:30 — Three-mount pattern: (1) named volume for ephemeral runtime state (~/.claude/), (2) bind mount for git-versioned repo, (3) read-only bind mounts for credentials (SSH, gitconfig). Keeps durable state in git, runtime state in volume.

[LEARNED] 2026-03-14 11:30 — Claude binary is a self-contained 225MB ELF (libc, libpthread, libdl, libm only). No npm, no Node.js runtime needed in container. Mount from host: ~/.local/share/claude/ + ~/.local/bin/claude symlink.

[CHECKPOINT] 2026-03-14 11:30 — Implementation complete and tested:
- Dockerfile builds (ubuntu:24.04 + git + jq + openssh + gosu)
- entrypoint.sh: root → chown ~/.claude → gosu to michelek
- docker-compose.yml: volume + bind mounts + env passthrough
- session-start.sh / session-stop.sh: one-command UX
- Tested: identity OK, claude runs, git works, volume persists across restarts
- NOT tested: Claude interactive session (needs TTY + ANTHROPIC_API_KEY export)

[DEFERRED] 2026-03-14 11:30 — SSH agent forwarding. Without ssh-agent, `git push` requires HTTPS credentials (git-credentials file is mounted). SSH-based push needs `SSH_AUTH_SOCK` forwarded via docker-compose. Not implemented — HTTPS credentials file covers the common case.

[DEFERRED] 2026-03-14 11:30 — MCP server connectivity. No MCP servers are configured in ~/.claude/settings.json (mcpServers: {}). Container has no special MCP handling. If MCP servers are added later, they may need additional ports or socket mounts.
