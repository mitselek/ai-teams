---
title: "nologin Login Shell Silently Defeats an authorized_keys Forced Command"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [stationmaster-post-office-model.md, ssh-keygen-A-ignores-f-path-prefix.md, per-connection-forced-command-shell-over-resident-daemon.md, per-filesystem-gate-targets-tmp-measures-wrong-fs.md]
tags: [gotcha, substrate-fact, ssh, openssh, sshd, forced-command, authorized-keys, nologin, service-account, runtime-only-defect, protocol-layer, architectural-fact]
---

## TLDR

When sshd runs an `authorized_keys` forced command (`command="..."`/`restrict,command="..."`), it invokes the account's LOGIN SHELL as `<shell> -c "<cmd>"`. If the shell is `/usr/sbin/nologin`, the shell refuses to exec — prints "This account is currently not available.", exit 1 — so the forced command NEVER runs. `nologin` looks like correct service-account hardening but silently removes the function. Verified OpenSSH 9.2p1, Debian bookworm-slim.

## Key ideas

- **Why it hides — protocol layer, not transport**: sshd starts, host key fine, port listens, pubkey auth succeeds, port-liveness healthcheck goes green, and a unit test invoking the program DIRECTLY passes. Only an over-real-ssh acceptance test (actual protocol exchange through sshd's login-shell exec) reveals it.
- **Fix**: `useradd --shell /bin/sh` (dash, in Debian slim). The security gate is `restrict` + `command=` + pubkey-only in authorized_keys — sshd enforces those independent of the shell; the shell only needs to exec the forced command. `nologin` adds no security here (the key options already do), it just breaks function.
- **Diagnostic signature**: ssh with a registered key returns exactly "This account is currently not available." (exit 1); `getent passwd <user>` shows `/usr/sbin/nologin`; authorized_keys has `command="..."`.
- **Architectural-fact** (sshd invoking the login shell for forced commands is deliberate design); revision trigger = sshd contract change, NOT n+1. Verified 9.2p1.
- **Companion to `ssh-keygen-A-ignores-f` (same #7 deploy)**: both are runtime-only/protocol-layer defects the build + direct-unit-test miss, caught only by over-real-ssh acceptance. Shared lesson: forced-command-over-ssh services need an over-real-transport acceptance test. Defect Dockerfile:22 → fixed 909bbe9.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
