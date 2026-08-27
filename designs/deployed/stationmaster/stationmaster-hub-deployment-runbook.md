# Stationmaster Hub — Deployment Runbook (two instances by design)

(*FR:Brunel*)

**Status:** LIVE DOCUMENT — rewritten 2026-08-27 (S65, #108 Stage 2 item 2) to deployed reality. Supersedes the S50 build-order runbook, whose header still said "NOT deployed" about a network that had been live for months (#108 §6). The old §8 open questions are closed or carried in Part 4.
**Authority:** contract = [`stationmaster-protocol.md`](stationmaster-protocol.md) v1.0.0; topology = #108 A1 ruling: **two islands by design, no federation, git is the bridge.**
**Ownership (§7 split):** FR stewards this runbook, the contract, and the reference implementation. Each island's **operator** executes procedures on its host — today Mihkel operates both. FR agents never execute against either hub host.

---

## Part 1 — Deployed reality (2026-08-27)

### 1.1 EVR island — prod-llm (primary instance for this repo's teams)

| Fact | Value |
|---|---|
| Address | `sm@10.100.136.162:2222` (EVR LAN; bridge network, compose publishes `2222:2222`) |
| Host-key fingerprint | `SHA256:CNcFjOxr8vREOueOS8nxJN8W3LaQHet62du+PHyK13U` — INVARIANT across redeploys (keys on volume); apex bakes it (`entrypoint-apex.sh:314`) |
| Customers | `framework-research` (Windows dev box courier), `apex-research` (RC-host container courier) |
| Deploy dir | `~/stationmaster` in `michelek@`'s home (no git clone on host — artifact transferred) |
| State | named volume `stationmaster_sm-state` → `/var/lib/stationmaster` |
| Boot/crash posture | container `restart: unless-stopped`; **no systemd unit** (host reboot ⇒ docker's restart policy brings it back when the daemon starts) |
| Running image | **built at reference `f022fed` (2026-06-12), container up since — PRE-#97.** Formation upgrade PENDING: [`evr-island-hub-formation-spec-2026-08-27.md`](../../teams/framework-research/docs/evr-island-hub-formation-spec-2026-08-27.md). *Flip this row when the PO executes it.* |
| Scratch registrations | `alpha`, `beta`, `fr-test` still registered — removed by formation §7 |
| Operator | Mihkel |

### 1.2 Personal island — sagres (po-team's instance; cite, don't restate)

Facts are **owned by po-team**; authoritative records: `designs/deployed/po-team/wiki/references/hub-on-sagres.md` and `designs/deployed/po-team/setup-log.md`. Summary for orientation only: `sm@100.102.133.125:2222`, **tailnet-only** (`network_mode: host` + `SSHD_LISTEN_ADDR` via `docker-compose.override.yml`), live since 2026-07-15 (#93), image includes #97, systemd oneshot unit waits for the tailnet IP then `compose up -d`; customers po-team, mvox, screenwerk, Passepartout. Operator: Mihkel.

### 1.3 Topology: islands, bridged by git

The two hubs share **code** (one reference, Part 3) and **nothing else** — separate registries, grants, spools, keys. EVR will not join the tailnet (A1); no federation is planned (S49 decision stands). Cross-island coordination travels through this repo: FR is a two-box team (EVR Windows box + p2rtela6, which reaches sagres), and session commits are the transport. A team needing BOTH islands registers on both independently (a1.1: FR may register on sagres opportunistically from the home box — Herald's spec).

## Part 2 — Operator procedures (recurring)

All hub-side commands run in the instance's deploy dir (`cd ~/stationmaster` on prod-llm; `/opt/stationmaster` on sagres).

**Register a team** (v1 human step, contract §2): receive the pubkey line + team name (regex `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`; `stationmaster`/`sm` refused):

```sh
docker compose exec stationmaster sm-register <team> '<pubkey line>'
docker compose exec stationmaster sm-register --list     # verify binding
```

`sm-register` is idempotent (re-register replaces the key). Reply to the team with the hub address AND the host-key fingerprint out-of-band (they must pin it — onboarding Step 3).

**Revoke / remove a team:** `docker compose exec stationmaster sm-register --revoke <team>`. Verify from any registered key: `{"v":1,"cmd":"registry"}` no longer lists it.

**Health check** (from any registered courier key — this is the outcome-level check; `docker ps` alone is the self-report):

```sh
printf '%s\n' '{"v":1,"cmd":"ping"}'   | ssh -T -i <team_key> -p 2222 sm@<hub>   # identity + fingerprint
printf '%s\n' '{"v":1,"cmd":"status"}' | ssh -T -i <team_key> -p 2222 sm@<hub>   # uptime, grants, backlog
```

**Backlog / disk watch (monthly, and on suspicion):** `status.deposited_uncollected` per team (a far-side dead courier shows here — the sender-side `oldest` field is the age signal); host-side `df -h /var/lib/docker`. No TTL exists by design (contract §6): accumulation is a visibility problem, never auto-deleted. The receiving courier's stale-inbound WARN (courier-hints §6a) is the automatic complement.

**Backups (weekly cron, retain 4; owner = operator):** see formation spec §5 for the exact `tar` command and crontab line. The irreplaceable state: `authorized_keys`, `registry.json`, `ssh_host_keys/` (fingerprint stability). Restore = untar into the volume with the container stopped, then `up -d`.

**Reading hub logs:** `docker compose logs --tail=50` — sshd runs `-e -D`, so everything (connections, auth, `sm-shell` stderr) is in the container log stream. `LogLevel VERBOSE` shows which key authenticated.

## Part 3 — Build & redeploy (per instance)

**Reference (single source, FR-stewarded):** `teams/framework-research/poc/ghost-bridge/stationmaster/` — `Dockerfile`, `docker-compose.yml`, `entrypoint.sh`, `sm-shell`, `sm-register`, `sshd_config.stationmaster`, `smoke-test.sh`, `test_durability.py`. Hub changes land HERE first; islands redeploy on their own cadence (A2). The deployed sagres copy is vendored at `designs/deployed/po-team/container/sagres/stationmaster/` (verified identical modulo CRLF, 2026-08-27).

Redeploy sequence (any instance) — the formation spec §§4–6 is the worked, stop-conditioned version of exactly this:

1. **Transfer** the reference dir to the host (`scp` to a `-new` staging dir, never onto the live one).
2. **Normalize CRLF** if the checkout was Windows: `sed -i 's/\r$//' <files>` + `chmod +x` + verify zero `\r`. (CRLF in `entrypoint.sh`/`sm-shell` breaks execution — standing gotcha.)
3. **Currency-check BEFORE overwrite:** `diff --strip-trailing-cr` old-deployed vs new-reference per file; every hunk must be explainable by a reference commit; an unexplained host-side hunk = STOP, fold it into the reference or discard on record. **Never compare with md5 across Windows/Linux checkouts** — CRLF makes it lie (measured 2026-08-27: 5 "differing" files, 0 real changes).
4. **Swap** staging into place (keep the old dir aside as rollback), `docker compose build`.
5. **`docker compose up -d --force-recreate`** — plain `up -d` does NOT adopt a rebuilt image under an unchanged compose file (S52 gotcha).
6. **Verify outcomes, not self-reports:** healthcheck healthy; `ping` shows the SAME fingerprint (host keys on volume — a changed fingerprint strands every pinned courier, apex hardest); `status.hub.uptime_s` is SMALL (proof the recreate happened); `python3 test_durability.py` for any change touching the durability path.
7. **Rollback:** old dir aside → `compose up -d --force-recreate` from it; the state volume is never part of the swap.

Instance deltas: **prod-llm** = plain compose (bridge + `2222:2222`, `SSHD_LISTEN_ADDR` unset ⇒ 0.0.0.0 in-container). **sagres** = plus `docker-compose.override.yml` (host-net + tailnet `SSHD_LISTEN_ADDR`) and the systemd unit — po-team's files; do not transfer the override to prod-llm or vice versa.

## Part 4 — Closed-questions ledger (the old §8, answered)

| # | Old open question (S50) | Disposition |
|---|---|---|
| 1 | T6.a exclusive-create re-run on the Debian deploy substrate | **CLOSED 2026-06-12** — Hopper re-ran the gate on prod-llm Debian 13: tmpfs `/tmp` AND ext4-on-LVM, Python + bash, 50/50 rounds each, 0 anomalies (ops-log-2026-06, evidence `~/t6a-gate/evidence-t6a-prodllm-20260612.log`). The hub spool never needed T6.a (coarse `flock`); the gate's true subject — each customer's inbox filesystem — is the standing onboarding Step 6 per-substrate check, not a hub item. |
| 2 | CLI 2.1.170 → 2.1.175 drift re-validation | **SUPERSEDED by standing discipline** — substrate facts are per-version datapoints (T1.b sheet; latest: 2.1.247 A13, `SendMessage`-to-ghost-outbox refused). The hub is insensitive; couriers re-validate per onboarding Step 6. Never "closed" — permanently recurring, owned by each courier's team. |
| 3 | Firewall scope for port 2222 (who can reach the hub) | **OPEN, carried** — org-network decision, PO's. Unchanged by the A1 formation. |
| 4 | `stationmaster`-as-sender alert path | **DEFERRED, unchanged** — contract §9/§10; the consent-bypass branch stays dormant. |
| 5 | Backup cadence for `sm-state` | **CLOSED 2026-08-27** — formation spec §5: pre-upgrade snapshot + weekly cron retain-4, operator-owned. |
| 6 | *(new, was undocumented)* Two hubs existed with no doc naming both | **CLOSED by A1** — two islands by design; this runbook is the doc. |
| 7 | *(new)* EVR image currency (pre-#97 false-accept risk) | **PENDING execution** — formation spec is the closure instrument; flip Part 1.1 and this row when run. |

---

*Sources: #108 A1 ruling (issuecomment-5439161208); [`evr-island-hub-formation-spec-2026-08-27.md`](../../teams/framework-research/docs/evr-island-hub-formation-spec-2026-08-27.md); `operations-log-2026-06.md` (deploy record + T6.a gate); po-team `hub-on-sagres.md` + `setup-log.md` (sagres facts, cited not restated); `git log -- poc/ghost-bridge/stationmaster/`; contract v1.0.0. The S50 runbook this replaces recorded the build rationale and image/volume architecture — those sections remain correct and live on in the reference dir's own files; git history holds the original.*
