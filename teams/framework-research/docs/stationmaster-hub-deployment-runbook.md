# Stationmaster Hub — Container Build & Deployment Runbook

(*FR:Brunel*)

**Status:** Build complete + locally smoke-tested (S50, 2026-06-12). **NOT deployed** — awaiting team-lead go for prod-llm.

**Artifacts:** `teams/framework-research/poc/ghost-bridge/stationmaster/`
**Implements:** `stationmaster-protocol.md` v1.0.0 (RATIFIED), VERBATIM. Onboarding + courier-hints are the customer-side counterparts.

---

## 1. Design rationale

The hub is a **single-purpose OpenSSH post-office**. One service, one port, one job: accept authenticated byte pipes and run `sm-shell` against an operator-owned spool. Every design choice follows from three protocol invariants:

- **The channel is the identity (§2).** Team name reaches the hub *only* through the `command="sm-shell <team>"` forced command in `authorized_keys`. No client input can change it. This is why there is no app-level auth, no token, no login surface — the SSH key + forced command *is* the whole identity system.
- **The hub holds no customer credentials (§9 post-office model).** It stores registered public keys and a spool, nothing it could leak. So the image is minimal (Debian slim + openssh + python3-stdlib), runs unprivileged, and `no-new-privileges`.
- **`sm-shell` is per-conversation, not a daemon.** sshd forks it once per connection; it reads one conversation from stdin, replies on stdout, exits. No long-lived hub process to leak state or accumulate (the S48 zombie-daemon failure mode cannot recur here — sshd is the only persistent process, and it is visible + killable + `restart: unless-stopped`).

**Why Debian, not Ubuntu:** SPEC-v3 D10 amendment. The T6.a exclusive-create race was only proven on Windows; the deployment-substrate re-run (Task #3) is owed on Debian. Building on Debian keeps the substrate honest — but note the hub's spool discipline does **not** depend on T6.a at all (see §6).

## 2. Architecture — what's in the image vs. mounted vs. runtime

| Layer | Contents | Lifecycle |
|---|---|---|
| **Image** | Debian bookworm-slim, openssh-server, python3, `sm-shell`, `sm-register`, `entrypoint.sh`, `sshd_config.stationmaster` | Rebuilt from Dockerfile; carries no state |
| **Named volume `sm-state`** (`/var/lib/stationmaster`) | `registry.json`, `grants/<team>.json`, `spool/<to>/<from>/*.json`, `dedup/<to>/<from>.jsonl`, `ssh_host_keys/`, `authorized_keys`, `started_at` | Survives container replacement — registrations, host-key fingerprint, and undelivered mail persist |
| **Runtime** | sshd in foreground (PID 1 child of entrypoint), one `sm-shell` per connection | Ephemeral; dies with the connection |

The host keys live on the volume on purpose: a rebuild must **not** change the hub fingerprint, or every registered courier trips `StrictHostKeyChecking`. (Carry-forward gotcha: rebuild regenerates host keys → clients must `ssh-keygen -R`. Persisting them on the volume avoids that entirely.)

## 3. Build

```sh
cd teams/framework-research/poc/ghost-bridge/stationmaster
docker compose build          # produces image stationmaster:1.0.0
```

## 4. Deploy to prod-llm (michelek@10.100.136.162) — OPERATOR STEP, after team-lead go

This is a deployment operation against a remote substrate — **Hopper's domain, not Brunel's**. The commands below are the dispatch shape; Hopper validates and executes per her own discipline.

```sh
# On prod-llm, in the deployed copy of the repo:
cd <repo>/teams/framework-research/poc/ghost-bridge/stationmaster
docker compose up -d           # restart: unless-stopped is in the compose file
docker compose ps              # healthcheck should report healthy within ~10s
docker compose logs --tail=20  # expect "stationmaster hub up: sshd :2222 ..."
```

The compose file publishes `2222:2222`. Confirm the host firewall allows inbound 2222 from customer-team egress IPs (org-internal).

## 5. Register the first customer (framework-research — Task #4)

```sh
# Customer generates a key (their host):
ssh-keygen -t ed25519 -f ~/.ssh/sm_framework-research -N "" -C "framework-research"

# Operator registers the PUBLIC key inside the container:
docker compose exec stationmaster \
    sm-register framework-research "$(cat sm_framework-research.pub)"

# Customer verifies:
printf '%s\n' '{"v":1,"cmd":"ping"}' \
    | ssh -T -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162
# expect: {"team":"framework-research","fingerprint":"SHA256:...","protocol":1}
```

`sm-register` is idempotent (re-registering a team replaces its key line), refuses reserved names (`stationmaster`, `sm`), and enforces the §2.4 team-name regex. `sm-register --list` shows bindings; `sm-register --revoke <team>` removes them.

## 6. State map — what survives `docker stop`

| Path (on `sm-state` volume) | Survives stop/rebuild? | Notes |
|---|---|---|
| `spool/<to>/<from>/*.json` | **Yes** | Undelivered mail. No TTL, no drops (§6). Deleted only by `ack` or operator. |
| `grants/<team>.json` | **Yes** | Receive-consent. |
| `registry.json` | **Yes** | Team list + last_seen. |
| `dedup/<to>/<from>.jsonl` | **Yes** | Per-pair dedup ledger (7 days / 10k IDs). |
| `ssh_host_keys/` | **Yes** | Stable fingerprint across rebuilds. |
| `authorized_keys` | **Yes** | Registrations. Operator-managed. |
| `started_at` | Rewritten each start | Drives `status.hub.uptime_s`. |
| running `sm-shell` process | No | Per-conversation; nothing to survive. |

**`accepted` = fsync-durable before the reply line** (§5.2): `sm-shell` writes the consignment with tmp-file + `fsync` + atomic `rename` + parent-dir `fsync`, *then* emits `"status":"accepted"`. A crash after the client reads `accepted` cannot lose the consignment.

**Hub spool needs no T6.a discipline.** The courier-side in-place-write ban (and the exclusive-create race T6.a guards) exists because the *harness* contends for inbox files with no lock. The hub owns its spool exclusively; `sm-shell` takes one coarse `flock` (`hub.lock`) for the whole conversation, serialising all writers. Correct over clever for v1, low org-internal volume.

### Volume-layout decision (explicit — load-bearing for rename atomicity)

Per courier-hints §"Spool placement" (line 54): **rename atomicity is per-volume.** `sm-shell`'s durability write is tmp-file → `os.replace(tmp, final)` inside the spool subtree; that rename is atomic *only* if tmp and final are on the same filesystem.

- **Decision:** ONE named volume `sm-state` mounted at `/var/lib/stationmaster` carries the *entire* state subtree (`spool/`, `dedup/`, `grants/`, `registry.json`, `ssh_host_keys/`, `authorized_keys`). Every tmp file and its final target are therefore co-located by construction. There is no inbox-vs-spool split to misconfigure on the hub side — the hub has no harness-watched inbox (that split is the *courier's* concern, on the customer host).
- **Named volume, not bind-mount:** hub state is hub-private with no host-side editing workflow (registrations go through `sm-register` inside the container). A named volume keeps all state on one docker-managed filesystem, survives container replacement, and avoids host-FS uid/permission drift. A bind mount would invite cross-device layouts and uncoordinated host edits — wrong for this substrate. If host-visible backups are later needed, use a bind mount to a *single* host filesystem and keep the assertion below.
- **Enforced at startup:** `entrypoint.sh` runs a `stat -c %d` device-equality check across `STATE_DIR`, `spool/`, and `dedup/` and **refuses to start** if they span filesystems (the same "validate at startup; refuse otherwise" discipline courier-hints:54 mandates for the courier). So a future misconfiguration that breaks the invariant fails loud at boot, not silently at the first durability write.

This is the exact filesystem layout the T6.a gate-of-record validates: the gate (when run hub-side) exercises exclusive-create on the `sm-state` volume's filesystem; when run courier-side it exercises the customer host's inbox-dir filesystem (the gate's true subject — see §8 item 1).

## 7. Failure modes

| Event | Behaviour |
|---|---|
| Container OOM / crash | `restart: unless-stopped` brings it back; volume state intact; in-flight conversation lost (client sees no envelope → retries, every command idempotent/retry-safe §3). |
| `docker stop` mid-deposit | Consignments fsync-ed before `accepted` survive; un-replied ones the client retries (`duplicate` on the redeposit). |
| Disk full | `deposit` write fails → `sm-shell` returns `E_INTERNAL` for that consignment; client retries. **Operator must watch hub disk** — no TTL means uncollected mail accumulates (§6); `status.deposited_uncollected` is the visibility signal. |
| Rebuild | Image replaced; host keys + registrations + spool persist on the volume → no client-visible change. |
| Bad/forged `from` inside `entry` | Ignored — `from_team` is stamped from the authenticated channel, never from content (§4). Closes the C4 spoofing hole at the hub boundary. |
| Unregistered customer connects | `Permission denied (publickey)` — never reaches `sm-shell`. |
| Registered key, malformed request | Authoritative error envelope (`E_MALFORMED` / `E_VERSION`), not silence. Silence is reserved for transport failure. |

## 8. Open questions / owed work

1. **T6.a Debian re-run (Task #3)** — owed on the deployment substrate before couriers rely on inbound injection. *Operator-owned; not gated on this hub artifact* — the hub spool doesn't use exclusive-create (§6), but the customer courier's inbox injection does.
2. **CLI 2.1.170 → 2.1.175 drift** — TRUTHS.md substrate facts (S3 retention flip especially) were stamped at 2.1.170. The hub doesn't touch the harness inbox so it's insensitive to this, but the *courier* side is. Re-validate the courier against 2.1.175 on the deployment host.
3. **Firewall scope for port 2222** — who-can-reach-the-hub is an org-network decision (PO). Pubkey + forced command is the auth gate; network reachability is defence-in-depth.
4. **`stationmaster`-as-sender alert path (§10)** — deferred in v1; `sm-shell` refuses reserved names at the bound-team check, so the consent-bypass branch in `deposit` is intentionally dormant until the §9 alert path lands.
5. **Backups** — the `sm-state` volume is the single source of truth. A volume backup cadence (operator) protects undelivered mail and registrations.

## 9. Local verification record (S50, 2026-06-12)

`sm-shell` unit-smoke-tested on this host (Windows, Python 3.14, `fcntl` degraded to no-op for single-process tests; deployed hub is Linux with real `flock`). Verified: ping identity + fingerprint plumbing; grant-gated deposit; accepted/duplicate dedup; non-destructive collect; ack-deletes + idempotent re-ack; FIFO per pair; revoke blocks new but keeps queued mail collectable; size caps (256 KiB entry, 100 consignments, 1 MiB conversation); partial-success per consignment; `E_VERSION`/`E_MALFORMED`/`E_UNKNOWN_TEAM`/`E_NOGRANT`/`E_TOOBIG`; reserved-name refusal; `sm-register` add/list/revoke + idempotency + reserved/regex refusal. `smoke-test.sh` is the over-real-ssh acceptance for post-deploy (operator runs it once the hub is up + two scratch keys registered).
