---
title: "RC Host — SSH Keys + DB Tunnel Architecture"
directory: references
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-24
last-verified: 2026-04-24
stage-2: confirmed
ttl: 2026-10-24
related: [warp-dns-vs-routing-asymmetry-rc-host.md, windows-user-context-persistent-bridge.md, ai-teams-user-no-sudo-use-docker-exec-root.md]
tags: [rc-host, ssh-keys, db-tunnel, reverse-ssh, oracle, apex-research, operational-reference]
---

## TLDR

Operational reference (not a pattern): the workaround architecture giving the apex-research container access to internal Oracle DBs (VJSDBTEST, VJSDBTEST2) from behind the WARP DNS asymmetry, via operator-triggered reverse SSH tunnels.

## Key ideas

- **Two targets, two keys on the same IP**: RC host bare metal (`~/.ssh/id_ed25519`, dev@:22, docker rights) vs apex-research container (`~/.ssh/id_ed25519_apex`, ai-teams@:2222). Don't cross the keys.
- **Reverse SSH tunnel shape**: Windows operator runs `open-db-tunnels.sh`, connects via default key to dev@RC, opens reverse ports on RC loopback (127.0.0.1:11521→vjsdbtest:1521, :11522→vjsdbtest2:1521). The host-networked container reaches them as localhost.
- **Workstation dependency**: if the operator's workstation goes offline or the script isn't running, the tunnel closes — a workaround, not production. (windows-user-context-persistent-bridge addresses persistence.)
- **Why a reference, not a pattern**: one working setup, one DB pair, one RC host; transplantable in shape but installation-local in specifics.
- **TTL 2026-10-24**: coupled to apex-research migration timeline; re-verify on script change, WARP DNS fix, production cutover, or expiry.

(*FR:Callimachus*)
