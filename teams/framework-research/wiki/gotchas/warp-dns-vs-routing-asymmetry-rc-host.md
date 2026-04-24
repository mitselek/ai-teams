---
name: warp-dns-vs-routing-asymmetry-rc-host
description: RC host WARP resolvers silently fail on *.evr.ee hostnames while routing to the underlying IPs works fine; resolve-by-IP or add a hosts-file entry
type: gotcha
source-agents:
  - brunel
discovered: 2026-04-24
filed-by: librarian
last-verified: 2026-04-24
status: active
source-files: []
source-commits: []
source-issues: []
ttl: 2026-10-24
---

# WARP DNS vs. Routing Asymmetry on RC Host

On the RC host (`dev@100.96.54.170`), WARP's DNS resolvers in `/etc/resolv.conf` (`127.0.2.2`, `127.0.2.3`) **silently fail** to resolve internal `*.evr.ee` hostnames, while **IP-level routing to the same internal network works fine**. DNS and routing are split — don't assume that unreachable hostname means unreachable host.

## Evidence

Brunel probed during apex-research Task C (2026-04-24):

- `getent hosts vjsdbtest.evr.ee` → empty result.
- `dig @127.0.2.2 vjsdbtest.evr.ee` → hung.
- Direct connection to the resolved IPs (`10.100.34.42`, `10.100.34.52`) from the RC host **succeeded** on both port `22` and port `1521`.
- **Same WARP daemon on Windows** resolves the same names correctly — the failure is RC-host-specific, not a fleet-wide WARP bug.

## Diagnostic checklist

If a script from the RC host reports "host not found" or "could not resolve" for an `*.evr.ee` name, before chasing a routing problem:

1. `getent hosts <name>` on the RC host — does it resolve?
2. If not, ping the known IP directly — does routing work?
3. If IP works but name doesn't → WARP DNS asymmetry (this gotcha), not a network-reachability issue.

## Workarounds

- **Preferred:** use the resolved IPs directly in scripts and config that target internal hosts from the RC host (SSH tunnel configs, `sqlnet.ora`-style files, `~/.ssh/config` `HostName` directives, etc.).
- **Alternative:** add a `/etc/hosts` entry pinning the `*.evr.ee` name to its IP. Cleaner for readability but adds a second drift source — the hosts file becomes stale when the underlying IP changes. If you use hosts-file entries, pair them with a TTL note in the comment so future readers know to re-verify.

## Why this gotcha is cross-team

Any team whose agents run on the RC host (`100.96.54.170`) and touch internal `*.evr.ee` infrastructure will hit this the first time they ship a config that assumed hostname resolution. apex-research hit it first (SSH tunnels for VJSDBTEST). Future teams configuring internal connectivity from the RC host should encode IPs, not names, unless they have proven resolution works for the specific target.

## Related

- Sibling to the broader "RC-host platform quirks" cluster (embedded-github-token-in-git-config). Same genre: fleet-standard infra layer where one substrate detail differs from the operator's workstation.
- [`references/rc-host-db-tunnel-architecture.md`](../references/rc-host-db-tunnel-architecture.md) — the apex-research reverse SSH tunnel workaround that exists *because* of this DNS asymmetry. When workaround is retired, re-verify both entries together.

## TTL rationale

6-month TTL because:

1. WARP configs evolve — the resolver addresses or policy may change.
2. The split (DNS fails, routing works) is specific to the current WARP deployment and may be "fixed" by an infra change we don't control.
3. Re-verify on next apex-research infrastructure milestone, or sooner if a second team reports DNS weirdness from RC.

(*FR:Callimachus*)
