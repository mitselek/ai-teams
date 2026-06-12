---
source-agents:
  - hopper
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-commits:
  - f022fed
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster/entrypoint.sh
  - teams/framework-research/docs/operations-log-2026-06.md
---

# `ssh-keygen -A -f <dir>` does NOT write host keys under `<dir>` — `-A` ignores `-f`

**Verified OpenSSH 9.2p1, Debian bookworm-slim, 2026-06-12.** `-A` ("generate all default host key types for any that are missing") writes to the **compiled-in default location** (`/etc/ssh/`). The `-f` flag — which is the *keyfile* flag for single-key generation — is **silently ignored in `-A` mode**. It is NOT a relocation prefix.

So `ssh-keygen -A -f "$STATE_DIR"`, expecting keys at `$STATE_DIR/etc/ssh/ssh_host_*`, writes **ZERO keys there**.

## The failure chain (container host-key persistence)

A container entrypoint generates persistent SSH host keys onto a mounted volume with `ssh-keygen -A -f "$STATE_DIR"`, then points sshd at that path via `-o HostKey=...`:

1. `-A` writes to `/etc/ssh/` (ephemeral, inside the container layer), NOT the volume. The volume's key dir stays **empty**.
2. sshd is pointed at the empty volume path → exits `"sshd: no hostkeys available -- exiting"`.
3. Container **crash-loops** under `restart: unless-stopped`.

**Invisible at build time.** `docker compose build` succeeds; the failure surfaces only at `up` (runtime) — the entrypoint runs only when the container starts. This is the runtime-only-defect class that the build dry-run cannot catch.

## Fix

Generate each needed key type **directly with an explicit `-f` path** (single-key mode, where `-f` IS honored):

```sh
ssh-keygen -t ed25519 -f "$HK_DIR/ssh_host_ed25519_key" -N "" -C <comment>
```

- Guard for idempotent persist-across-restart: `[ ! -f "$HK_DIR/ssh_host_ed25519_key" ]`.
- If `sshd_config` references only one host-key type (e.g. ed25519), generate just that one — **no need for `-A` at all**.

## Diagnostic signature

- Container logs repeat `"Unable to load host key: <path>"` → `"sshd: no hostkeys available -- exiting"`.
- `docker inspect` shows `ExitCode=1` + climbing `RestartCount`.
- The volume's host-key dir enumerates EMPTY: `sudo ls /var/lib/docker/volumes/<vol>/_data/ssh_host_keys/`.

## Revision trigger

Architectural-fact at the OpenSSH-CLI-contract layer — `-A` ignoring `-f` is deliberate CLI design (`-f` means keyfile-for-single-key, `-A` is the all-default-types mode that has no relocation concept). n+1 re-encounters do NOT strengthen this; the trigger to revise is an **OpenSSH CLI contract change** (a future version that teaches `-A` to honor `-f` as a prefix, or deprecates one of the flags). Verified on 9.2p1; re-check the man page if on a substantially different OpenSSH version.

## Evidence

- Stationmaster hub deploy, prod-llm (10.100.136.162), 2026-06-12. Defect in `entrypoint.sh:27` (commit ≤`62bba75`); fixed in `f022fed` (direct ed25519 gen).
- Ops-log: `teams/framework-research/docs/operations-log-2026-06.md`, 2026-06-12T17:01 (crash-loop + Layer-3 empty-volume root cause) + 17:07/17:24 (fix verified).
- Substrate fingerprint: OpenSSH_9.2p1, Debian bookworm-slim, Docker 29.3.0.

## Related

- [`process/standby-agent-fix-then-flag-discipline.md`](../process/standby-agent-fix-then-flag-discipline.md) — this is the **substrate root-cause** of that entry's Clause-A catalyzing incident (the `f022fed` fix). That entry catalogs the *deployment-discipline* response (fix-then-flag under deployment pressure); this entry is the *technical fact* underneath.
- [`gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md`](per-filesystem-gate-targets-tmp-measures-wrong-fs.md) — sibling runtime-vs-build-time divergence from the same deploy (a defect invisible to the build, surfacing only at `up`/runtime).
- [`patterns/three-layer-substrate-truth-discipline.md`](../patterns/three-layer-substrate-truth-discipline.md) — the empty-volume root cause was a Layer-3 (running-state) observation; the build dry-run only exercised Layer-1/Layer-2.
- [`patterns/live-inject-plus-dockerfile-bake-dual-track.md`](../patterns/live-inject-plus-dockerfile-bake-dual-track.md) — adjacent container-entrypoint discipline.

(*FR:Hopper* — submitted; *FR:Callimachus* — filed)
