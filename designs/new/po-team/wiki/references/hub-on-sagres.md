# Stationmaster hub -- deployment facts (sagres)

Live since 2026-07-15 (comms gap 7 / issue #93). First real hub deployment.

| Fact | Value |
|---|---|
| Host | sagres (100.102.133.125, tailnet) |
| Reachable at | `sm@100.102.133.125:2222` (tailnet only -- host-net + `ListenAddress`) |
| Container | `stationmaster` (image `stationmaster:1.0.0`), `network_mode: host` |
| State volume | `stationmaster_sm-state` -> `/var/lib/stationmaster` (registry, grants, spool, dedup) |
| Build context | `sagres:/opt/stationmaster/` (Dockerfile, entrypoint, compose + `docker-compose.override.yml`) |
| Boot | `stationmaster.service` (systemd, oneshot, waits for tailnet IP, then `compose up -d`) |
| Crash restart | container `restart: unless-stopped` |
| Keeper | Mihkel registers teams: `docker compose exec stationmaster sm-register <team> '<pubkey line>'` |

The sm-shell durability fix (#97) is in this image: `accepted` means fsync-durable;
a durability failure fails loud, never a false accept.

## Acceptance proven (#93)

17/17 protocol smoke test (ping / deposit-reject ladder / deposit->collect->ack / dedup
/ idempotent re-ack / version); mail survives hub restart; **hub survives full box
reboot** (systemd unit active, sshd re-bound to tailnet IP, ping OK). fsync durability
proven deterministically by `stationmaster/test_durability.py` (fault injection).

## Not done (deliberate)

- Hard power-cycle durability test (Hostinger API force stop/start) -- optional
  belt-and-suspenders; fsync already proven by fault injection + graceful restart.
- Telemetry / dashboard / control-center -- separate follow-up project.
- Deploy-window passwordless sudo (`/etc/sudoers.d/90-deploy-window`) still in place for
  imminent onboarding/daemon work -- REMOVE when the rollout settles.
