# Dispatch Package -- Stationmaster Hub Build + Deploy + T6.a Gate (for Hopper)

(*FR:Brunel*)

**Status:** STAGED -- authored S50 (2026-06-12) ahead of Hopper's spawn. Aen reviews; releases to Hopper when she is online and the artifact set is review-passed.
**Tasker of record:** Brunel (diagnostic/design) → Hopper (execution). Report to both Brunel and Aen per Pairing discipline.
**Substrate:** stationmaster hub -- NEW FR-shipped substrate, prod-llm (`michelek@10.100.136.162`), Debian, passwordless sudo + docker confirmed (per PO).
**Artifacts (Layer 1, this repo):** `teams/framework-research/poc/ghost-bridge/stationmaster/` -- `Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, `sm-shell`, `sshd_config.stationmaster`, `sm-register`, `smoke-test.sh`. Read these as Layer 1 before executing.

---

## 0. First-dispatch note

This is the **first-ever dispatch against the stationmaster substrate**. It is **greenfield** -- no prior stationmaster container, image, or `sm-state` volume exists on prod-llm. Run the three-layer probe-suite in first-dispatch form, but note the layer-availability reality up front:

- **Layer 1 (FR design-as-shipped):** fully readable in this repo at the artifact paths above. This is the design lineage.
- **Layer 2 (operational copy on prod-llm):** the deployed copy of the repo on prod-llm. Discover the path; confirm the stationmaster artifacts are present and match Layer 1 (this repo). **There is no prior operational divergence to drift from -- this is the first deploy.**
- **Layer 3 (running container):** does not exist yet (no container). Per §Graceful Degradation case 3, Layer 3 is legitimately absent pre-deploy; it comes into existence as the *result* of this dispatch. Acknowledge the gap; proceed (the dispatch's purpose is to create Layer 3).

**Volume-layout note (explicit, per Aen's S50 requirement + courier-hints:54):** the hub puts its *entire* state subtree on ONE named volume `sm-state` at `/var/lib/stationmaster` -- `spool/`, `dedup/`, and the tmp side of every `os.replace` are co-located by construction (rename atomicity is per-volume). `entrypoint.sh` asserts single-filesystem at startup (`stat -c %d` across STATE_DIR/spool/dedup) and refuses to start if they diverge. On bring-up (step B), watch the logs for a `FATAL: ... spans multiple filesystems` line -- if it appears, the volume layout is wrong and that is a hard-gate STOP back to Brunel. Expected: no such line, hub comes up healthy. This is the exact filesystem layout the T6.a gate-of-record (step E) validates.

## 1. Tier classification -- Tier M throughout (greenfield bring-up)

| Step | Operation | Tier | Why |
|---|---|---|---|
| A | `docker compose build` | **M** | Builds an image; mutates no existing substrate state. Nothing deployed yet to destroy. |
| B | `docker compose up -d` | **M** | First bring-up of a new service. No existing container, no `--force-recreate`, no live state to recreate-over. Designed lifecycle event. |
| C | healthcheck + log confirm | **R** | Read-only. |
| D | register two scratch keys + run `smoke-test.sh` | **M** | `sm-register` appends to the operator-owned `authorized_keys` on the volume; non-destructive, idempotent. Scratch keys, scratch teams. |
| E | T6.a race harness (see §4) | **R** | Read-only race observation in a temp dir; creates + removes scratch files, touches no deployed state. |

**No Tier D in this dispatch.** There is no `docker volume rm`, no `compose down -v`, no `--force-recreate` against live state, no `rm -rf` against a bind-mount. If any step *would* require a destructive operation (e.g., a stale `sm-state` volume from a prior aborted test must be cleared), **STOP and surface back** -- that is a separate Tier D dispatch with its own three-component sanction, not part of this one.

**Tasker single-line acknowledgment (Tier M sanction), quoted for the log:**
> "Hopper, build + bring up the stationmaster hub on prod-llm per the artifacts in `poc/ghost-bridge/stationmaster/`; it is a greenfield deploy, restart:unless-stopped is in the compose file; then run the smoke-test and the T6.a gate. -- Brunel (staged S50; released by Aen)"

## 2. Build + deploy (steps A–C)

Run in the deployed copy of the repo on prod-llm:

```sh
cd <repo>/teams/framework-research/poc/ghost-bridge/stationmaster

# A -- build
docker compose build                 # -> image stationmaster:1.0.0

# B -- bring up (restart: unless-stopped is in the compose file)
docker compose up -d

# C -- confirm
docker compose ps                    # STATUS should reach healthy within ~10s (start_period)
docker compose logs --tail=20        # expect: "stationmaster hub up: sshd :2222 state=/var/lib/stationmaster user=sm"
```

**Expected outcome:** one container `stationmaster`, healthcheck `healthy`, sshd listening on `:2222`, log line present. Port `2222:2222` published.

**Verification probe (Tier R):**
```sh
docker compose exec stationmaster sm-register --list   # expect: header + no teams yet
```

## 3. First protocol acceptance (step D)

Generate two scratch ed25519 keys, register them, run the over-ssh acceptance:

```sh
ssh-keygen -t ed25519 -f /tmp/sm_alpha -N "" -C alpha
ssh-keygen -t ed25519 -f /tmp/sm_beta  -N "" -C beta
docker compose exec stationmaster sm-register alpha "$(cat /tmp/sm_alpha.pub)"
docker compose exec stationmaster sm-register beta  "$(cat /tmp/sm_beta.pub)"

# the hub publishes 2222 on the host, so dial localhost from prod-llm:
./smoke-test.sh 127.0.0.1 2222 /tmp/sm_alpha alpha /tmp/sm_beta beta
```

**Expected outcome:** `smoke-test.sh` prints `== N passed, 0 failed ==` and exits 0. It exercises ping/deposit/grant/accept/duplicate/collect-non-destructive/ack/re-ack-idempotent/status/registry/E_VERSION over real ssh -- this is what proves the forced-command binding + sshd config + sm-shell all line up on the Debian substrate.

**Clean up scratch state after the smoke test passes** (so the first real customer -- framework-research, Task #4 -- registers into a clean hub):
```sh
docker compose exec stationmaster sm-register --revoke alpha
docker compose exec stationmaster sm-register --revoke beta
rm -f /tmp/sm_alpha /tmp/sm_alpha.pub /tmp/sm_beta /tmp/sm_beta.pub
```
Note: the scratch teams' spool/grants files remain on the volume but are inert (no key can reach them after revoke). If a fully pristine volume is wanted, that is a Tier D `docker compose down -v` -- separate dispatch, separate sanction. For the gate it does not matter.

## 4. T6.a race-gate handover (step E) -- the SEPARATE owed gate

This is the gate the docs flag (`stationmaster-courier-hints.md` §4: *"T6.a's race harness was run on Windows; re-run on the deployment platform"*). **It is a COURIER-side property, not a hub property** -- it concerns the customer courier's inbound inbox injection (`exclusive-create` atomicity under a concurrent writer on Debian/ext4), NOT the stationmaster hub spool (which uses `flock`, not exclusive-create).

So the gate does not run *against* the hub container. It is a standalone race harness on the Debian substrate's filesystem, validating the primitive the courier relies on. Harness shape (the same 50-round two-process exclusive-create contention that T6.a ran on Windows):

```sh
# On prod-llm (or any Debian host with the same filesystem class as the courier target):
# 50 rounds: two concurrent processes race to exclusive-create the same path.
# Exactly one winner per round, zero mixed content == gate PASS.
```

I will hand over the **exact harness script** as a follow-up the moment you are spawned and we confirm the target filesystem (the courier runs on the customer team's host, not necessarily prod-llm -- confirm with Aen which filesystem class the gate should target). The harness is Tier R (temp-dir scratch files only). **Gate evidence (round count, winners, anomalies) routes back to Aen before Task #4 starts.**

## 5. Report shape

Operations-log entry (`docs/operations-log-2026-06.md`) with all 8 fields. Layer declaration:
- **Layer 1:** the artifact paths in §0 (this repo).
- **Layer 2:** the deployed repo path on prod-llm (discovered) + confirmation the stationmaster artifacts match Layer 1.
- **Layer 3:** "absent pre-deploy per §Graceful Degradation case 3; created by this dispatch -- post-deploy Config.Env / mount table read confirms it."
- **Audit artifacts:** this dispatch package + the runbook `docs/stationmaster-hub-deployment-runbook.md`.

Report outcome to Brunel (diagnosis loop closes) and Aen (role-of-record). Gate evidence to Aen.

## 6. Hard-gate triggers specific to this dispatch

Surface back, do not proceed, if:
- A prior `stationmaster` container or `sm-state` volume already exists on prod-llm (greenfield assumption violated → reuse-or-clear is a tasker decision; clear is Tier D).
- The build fails (image won't assemble -- this host is the FIRST place the image is actually built; this Windows dev box has no Docker, so Layer-1 was verified by `sh -n` + `py_compile` only, not by a real build).
- sshd won't start or the healthcheck never goes healthy (config/port/permission issue -- paste logs, surface back).
- `smoke-test.sh` reports any failure (the forced-command binding or sm-shell behaves differently on Debian than the Windows unit-smoke predicted).
