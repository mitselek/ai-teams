---
name: rc-host-db-tunnel-architecture
description: RC-host SSH keys (dev/container split) + apex-research reverse SSH tunnel architecture for internal Oracle DBs (VJSDBTEST, VJSDBTEST2)
type: reference
source-agents:
  - team-lead
discovered: 2026-04-24
filed-by: librarian
last-verified: 2026-04-24
status: active
source-files:
  - apex-migration-research/.claude/bin/open-db-tunnels.sh
source-commits:
  - 24cca0d
  - c79b838
source-issues: []
ttl: 2026-10-24
---

# RC Host — SSH Keys + DB Tunnel Architecture

**Operational reference, not a pattern.** Workaround architecture for giving the apex-research container access to internal Oracle DBs (VJSDBTEST, VJSDBTEST2) from behind the WARP DNS asymmetry (see [`gotchas/warp-dns-vs-routing-asymmetry-rc-host.md`](../gotchas/warp-dns-vs-routing-asymmetry-rc-host.md)).

## SSH keys — two targets, two keys

| Target | Key | User | Host:Port |
|---|---|---|---|
| RC host (bare metal) | `~/.ssh/id_ed25519` | `dev` | `100.96.54.170:22` |
| apex-research container | `~/.ssh/id_ed25519_apex` | `ai-teams` | `100.96.54.170:2222` |

These are **two different targets on the same IP**. The bare-metal RC host runs SSH on `:22`; the apex-research container exposes SSH on `:2222`. Do not cross the keys — the `_apex` key does not authenticate `dev@100.96.54.170:22` and the default key does not authenticate `ai-teams@:2222`.

## DB tunnel architecture (confirmed working 2026-04-24)

```text
[Windows operator]  --bash .claude/bin/open-db-tunnels.sh-->  [RC host 127.0.0.1]  <--host-net-->  [apex-research container]
     |                                                              |
  id_ed25519 (reverse SSH)                                           |
     |                                                               |
     +--opens reverse ports on RC loopback----->  127.0.0.1:11521 → vjsdbtest.evr.ee:1521
                                                   127.0.0.1:11522 → vjsdbtest2.evr.ee:1521
```

- **Trigger:** operator runs `bash .claude/bin/open-db-tunnels.sh` from Git Bash on Windows.
- **Auth:** script uses `id_ed25519` (default key) to connect to `dev@100.96.54.170`.
- **Tunnel shape:** **reverse SSH tunnel** — Windows operator establishes the connection; RC host loopback receives the forwarded ports. This is why the operator must be running the script for the container to see the DBs.
- **Container view:** the apex-research container is host-networked, so `127.0.0.1:11521` and `127.0.0.1:11522` on the RC host are reachable as `localhost:11521` / `localhost:11522` from inside the container.
- **Workstation dependency:** if the operator's workstation goes offline or the script isn't running, the tunnel closes and the container loses DB access. This is a workaround, not a production architecture.

### Script location

`apex-migration-research/.claude/bin/open-db-tunnels.sh` — commit `c79b838`, with earlier work at `24cca0d`. This lives in the apex-migration-research repo, not in `mitselek-ai-teams`. Cross-repo source reference.

## Verification commands

Operator-side (Windows Git Bash):

```bash
# RC host reachability
ssh -i ~/.ssh/id_ed25519 -o BatchMode=yes dev@100.96.54.170 "echo RC_OK"
# expect: RC_OK
```

Container-side (from inside apex-research):

```bash
ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 \
  "timeout 3 bash -c 'echo -n > /dev/tcp/127.0.0.1/11521'" \
  && echo TUNNEL_OK_FROM_CONTAINER
# expect: TUNNEL_OK_FROM_CONTAINER
```

Both confirmed 2026-04-24.

## Why this is a reference, not a pattern

Patterns generalize. This entry documents one working setup for one pair of DBs on one RC host. It is transplantable in *shape* (operator-triggered reverse tunnel via default SSH key, container on host network, numeric port mapping), but the specifics (IPs, keys, script path) are installation-local. If a second team adopts the same shape, they'll file their own reference — and at that point, the shape may be worth promoting to a pattern. Not yet.

## TTL rationale

6 months — this is a **workaround** until apex migrates to corporate infra or the WARP DNS asymmetry is resolved upstream. Expected lifetime is coupled to the apex-research migration timeline, not to a stable infra arrangement. Re-verify on:

1. Any change to `.claude/bin/open-db-tunnels.sh` (recompute the architecture diagram).
2. WARP DNS fix announced.
3. apex-research production cutover.
4. TTL expiry (2026-10-24), whichever comes first.

## Related

- [`gotchas/warp-dns-vs-routing-asymmetry-rc-host.md`](../gotchas/warp-dns-vs-routing-asymmetry-rc-host.md) — the root cause that necessitates this tunnel architecture.

(*FR:Callimachus*)
