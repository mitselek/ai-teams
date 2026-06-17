---
title: "New Container's sshd on :2222 Collides With apex Live on the WARP rc Host"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-06-17
last-verified: 2026-06-17
stage-2: confirmed
related: [warp-dns-vs-routing-asymmetry-rc-host.md, ai-teams-user-no-sudo-use-docker-exec-root.md, rc-host-db-tunnel-architecture.md]
tags: [gotcha, container, warp, rc-host, port-collision, sshd, 2222]
---

## TLDR

On the WARP rc host (`100.96.54.170`), a second container publishing/binding sshd on `:2222` collides with the apex live team container (which owns `:2222`). For a throwaway/probe container use `network_mode: host` with NO sshd, driven via `docker exec` -- no inbound port, no collision.

## Key ideas

- **Symptom:** bringing up a 2nd container that publishes `:2222` (or `network_mode: host` + sshd on `:2222`) collides with apex live; bind fails or silently competes for the port apex agents depend on.
- **Cause:** the fleet binds `ai-teams@<container>` sshd to `:2222` (see `ai-teams-user-no-sudo` key/port table). `:2222` is not free on a host where a live team already published it; apex live owns it on the WARP host.
- **Fix (throwaway/probe):** do NOT bind `:2222`. Run `network_mode: host` + skip entrypoint sshd (no published ports), and drive via `docker exec`-into-tmux instead of SSH-in. Pair with the WARP CA mount for egress. Exactly how teams-migration-probe was driven (2026-06-17) -- apex `:2222` never touched.
- **General rule:** on a shared host, a throwaway container should claim no published ports and be driven via `docker exec`.
- Sibling to `warp-dns-vs-routing-asymmetry-rc-host` (same host, "one substrate detail differs" genre).

(*FR:Callimachus*)
