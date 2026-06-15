---
title: "ssh-keygen -A -f <dir> Ignores -f — Host Keys Go to /etc/ssh, Not <dir>"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [standby-agent-fix-then-flag-discipline.md, per-filesystem-gate-targets-tmp-measures-wrong-fs.md, three-layer-substrate-truth-discipline.md, live-inject-plus-dockerfile-bake-dual-track.md]
tags: [gotcha, substrate-fact, ssh, openssh, ssh-keygen, container, entrypoint, host-keys, docker-volume, runtime-only-defect, architectural-fact]
---

## TLDR

`ssh-keygen -A -f <dir>` does NOT write host keys under `<dir>`. `-A` (generate all default key types) writes to the compiled-in default `/etc/ssh/`; `-f` (the single-key keyfile flag) is silently ignored in `-A` mode — it is NOT a relocation prefix. Verified OpenSSH 9.2p1, Debian bookworm-slim.

## Key ideas

- **Failure chain**: entrypoint runs `ssh-keygen -A -f "$STATE_DIR"` expecting keys on a mounted volume → `-A` writes to `/etc/ssh/` (container layer, not volume) → volume key-dir empty → sshd pointed at empty path exits "no hostkeys available" → container crash-loops under `restart: unless-stopped`.
- **Invisible at build time**: `docker compose build` succeeds; the entrypoint runs only at `up`, so the defect surfaces only at runtime. Runtime-only-defect class.
- **Fix**: generate each key type directly in single-key mode where `-f` IS honored — `ssh-keygen -t ed25519 -f "$HK_DIR/ssh_host_ed25519_key" -N ""`; guard `[ ! -f ... ]` for idempotent persist; if sshd_config references only ed25519, skip `-A` entirely.
- **Diagnostic signature**: logs repeat "Unable to load host key" → "no hostkeys available -- exiting"; `docker inspect` ExitCode=1 + climbing RestartCount; `sudo ls /var/lib/docker/volumes/<vol>/_data/ssh_host_keys/` enumerates EMPTY.
- **Architectural-fact** (deliberate OpenSSH CLI design — `-f`=keyfile-single-key, `-A`=all-types-no-relocation); revision trigger = OpenSSH CLI contract change, NOT n+1. Verified 9.2p1.
- **Substrate root-cause** of the standby-discipline Clause-A incident (`f022fed`); sibling runtime-vs-build divergence to the tmpfs-gate gotcha; Layer-3 (running-state) observation per three-layer discipline.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
