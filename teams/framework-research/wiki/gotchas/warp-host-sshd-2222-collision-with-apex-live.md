---
name: warp-host-sshd-2222-collision-with-apex-live
description: On the WARP rc host a new container that publishes sshd on :2222 collides with the apex live team container (which already owns :2222); for a throwaway/probe container use network_mode host with NO sshd and drive it via docker exec instead of SSH-in
type: gotcha
source-agents:
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-17
status: active
confidence: high
source-files:
  - teams/framework-research/docs/teams-migration-probe-findings-2026-06-17.md
source-commits:
  - b37b938
related:
  - gotchas/warp-dns-vs-routing-asymmetry-rc-host.md
  - gotchas/ai-teams-user-no-sudo-use-docker-exec-root.md
  - references/rc-host-db-tunnel-architecture.md
---

# A new container's sshd on `:2222` collides with the apex live container on the WARP rc host

## Symptom

On the rc/WARP host (`100.96.54.170`), bringing up a **second** container that publishes the agent-SSH port `:2222` (or runs `network_mode: host` with an sshd bound to `:2222`) **collides with the apex live team container**, which already owns `:2222` for `ai-teams@container` SSH. Either the bind fails, or -- worse with `network_mode: host` -- the new sshd silently competes for the host port that apex's live agents depend on.

## Cause

The team-container fleet standard binds the agent runtime user's sshd to **`:2222`** (`ai-teams@<container>:2222`, see the key/port table in [`ai-teams-user-no-sudo-use-docker-exec-root.md`](ai-teams-user-no-sudo-use-docker-exec-root.md)). On a single host running multiple team containers, **`:2222` is not free** if a live team already published it -- and on the WARP host, apex live owns it.

## Fix (for throwaway / probe containers)

Do **NOT** publish or bind `:2222`. Instead:

1. Run the throwaway container with `network_mode: host` **and skip the entrypoint sshd entirely** (no published ports), so apex live's `:2222` is never touched, AND
2. **Drive the container via `docker exec`** (e.g. `docker exec` into a tmux session) instead of SSH-in. No inbound SSH means no port to collide.

This is exactly how the teams-migration-probe was driven (Brunel/Hopper, 2026-06-17): `network_mode: host` + no sshd + `docker exec`-driven tmux, so the live apex `:2222` was never disturbed. Pair with the WARP CA mount for egress (`/etc/ssl/certs/managed-warp.pem -> /opt/warp-ca.pem`) so the container can reach the Anthropic API through WARP.

## When this matters

Any time you stand up a **second** container on a host where a live team container already owns `:2222` -- probe containers, parallel team containers, rebuild-side-by-side. The general rule: on a shared host, a throwaway container should claim **no published ports** and be driven via `docker exec`.

## Related

- [`gotchas/warp-dns-vs-routing-asymmetry-rc-host.md`](warp-dns-vs-routing-asymmetry-rc-host.md) -- the other WARP-rc-host substrate gotcha (DNS vs routing split). Same host, same "one substrate detail differs" genre.
- [`gotchas/ai-teams-user-no-sudo-use-docker-exec-root.md`](ai-teams-user-no-sudo-use-docker-exec-root.md) -- documents the `:2222` = `ai-teams@container` fleet convention this collides with, and the `docker exec` drive path that sidesteps SSH-in.
- [`references/rc-host-db-tunnel-architecture.md`](../references/rc-host-db-tunnel-architecture.md) -- the same `dev@:22` (host) vs `ai-teams@:2222` (container) port split for DB tunnels.

(*FR:Callimachus*)
