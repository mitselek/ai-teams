# Spec: FR Courier as a persistent Windows service (*FR:Aen*)

**Date:** 2026-06-15 · **Status:** approved design, pre-implementation

## Goal

Run `fr-courier-daemon.py` (hub-and-spoke model, hub `sm@10.100.136.162:2222`)
24/7 on the dev host, decoupled from FR session lifecycle. The courier deposits
hub→inbox continuously; the next FR session drains its queue on spawn (same model
proven with apex in S52). No admin rights required.

> Substrate note: this consciously overrides the "Windows is never a deploy
> target" memory. PO made the call explicitly (2026-06-15). Mechanism mirrors the
> proven `ApexResearch-DBTunnels` Scheduled Task pattern.

## Architecture -- 3-part DB-tunnel template

All files live in `teams/framework-research/poc/ghost-bridge/`.

1. **Supervisor** -- `fr-courier-supervisor.sh`
   - `while true` loop. Per iteration: pre-clean any stale `fr-courier-daemon.py`
     (`pkill -f`), run `python fr-courier-daemon.py --config fr-courier.config.json`,
     log exit, `sleep` backoff, repeat.
   - Logs to `~/.claude/logs/fr-courier-supervisor.log`.
   - Analog of `apex .claude/bin/autossh-db-tunnels.sh`.

2. **Hidden launcher** -- `run-courier-hidden.vbs`
   - `WshShell.Run "<git-bash> -l -c 'exec <supervisor.sh>'", 0, True`
   - `style=0` hidden (no console flash); `wait=True` keeps wscript alive for the
     supervisor's lifetime so the task's single-instance guard detects it.
   - Analog of `apex run-tunnel-hidden.vbs`.

3. **Task registration** -- `register-courier-task.ps1`
   - Registers user-context task **`FrameworkResearch-Courier`**.
   - Triggers: at-logon (`-AtLogOn -User $env:USERNAME`) + power-resume
     (Power-Troubleshooter EventID 1, via CIM `MSFT_TaskEventTrigger`).
   - Settings: `MultipleInstances=IgnoreNew`, `ExecutionTimeLimit=0`,
     `StartWhenAvailable`, `AllowStartIfOnBatteries`, `DontStopIfGoingOnBatteries`.
   - Principal: `LogonType=Interactive`, `RunLevel=Limited` (no admin).
   - Analog of `apex register-tunnel-task.ps1`.

## Single-instance -- three layers

1. Task `MultipleInstances=IgnoreNew` (VBS `wait=True` exposes the running instance).
2. Supervisor `pkill` pre-clean before each daemon launch.
3. The daemon's own lock file.

## Cleanup (one-time, DONE 2026-06-15)

Killed the two decommissioned `ghost-bridge.py` v2 orphans (PIDs 2408, 28392).
v2 (peer-to-peer) was decommissioned in commit c488fa1; superseded by the hub model.

## Error handling

- Network drop / hub unreachable: daemon exits non-zero → supervisor restarts after backoff.
- Crash loop: backoff sleep (start 10s) prevents tight spin; logged each cycle.
- Stale lock after host crash: supervisor pre-clean kills orphaned daemon PID before relaunch.

## Companion (not a blocker)

Queued fix #1 (lock-staleness boot_id→PID-1-starttime) improves the daemon's *own*
lock correctness. The supervisor's pre-clean covers the restart path without it, so
this ships independently; the lock fix lands separately.

## Out of scope

- Containerizing FR on Linux (the larger "FR off Windows" project).
- Changes to `fr-courier-daemon.py` internals beyond what supervision requires.

## Delegation (post-plan)

Brunel (persistence infra) authors the 3 scripts; Hopper (operator) registers and
verifies the task, confirms round-trip against the hub.
