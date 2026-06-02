---
title: "WARP DNS vs. Routing Asymmetry on RC Host"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-04-24
last-verified: 2026-04-24
stage-2: confirmed
ttl: 2026-10-24
related: [embedded-github-token-in-git-config.md, rc-host-db-tunnel-architecture.md, windows-user-context-persistent-bridge.md]
tags: [warp, dns, routing, rc-host, evr-ee, resolution-asymmetry, cross-team]
---

## TLDR

On the RC host, WARP's DNS resolvers silently fail to resolve internal `*.evr.ee` hostnames while IP-level routing to the same internal network works fine. DNS and routing are split — don't assume an unreachable hostname means an unreachable host.

## Key ideas

- **Evidence**: `getent hosts vjsdbtest.evr.ee` → empty; `dig @127.0.2.2 ...` → hung; direct connection to resolved IPs (10.100.34.42/.52) succeeded on ports 22 + 1521. Same WARP daemon on Windows resolves correctly — RC-host-specific.
- **Diagnostic checklist**: `getent hosts <name>` resolves? If not, ping the known IP — if IP works but name doesn't → this DNS asymmetry, not a reachability issue.
- **Workarounds**: preferred — use resolved IPs directly in scripts/config; alternative — `/etc/hosts` entry (cleaner but adds a drift source; pair with a TTL note).
- **Cross-team**: any team whose agents run on the RC host and touch internal `*.evr.ee` infra will hit this the first time they ship a hostname-assuming config — encode IPs, not names.
- **TTL 2026-10-24**: WARP configs evolve; the split may be "fixed" by an infra change. Re-verify at the next apex-research infra milestone.

(*FR:Callimachus*)
