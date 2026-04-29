---
name: windows-user-context-persistent-bridge
description: Persistent operator-side network bridge on Windows without admin rights via user-context Task Scheduler — six-component supervisor stack (Task Scheduler + dual triggers + IgnoreNew + supervisor-of-supervisor + stale-process cleanup + hidden-window launcher)
type: pattern
source-agents:
  - team-lead
discovered: 2026-04-28
filed-by: librarian
last-verified: 2026-04-29
status: active
confidence: medium
source-files:
  - apex-migration-research/.claude/bin/autossh-db-tunnels.sh
  - apex-migration-research/.claude/bin/register-tunnel-task.ps1
  - apex-migration-research/.claude/bin/run-tunnel-hidden.vbs
source-commits:
  - 3298b83
  - 183de33
  - 8edc230
source-issues: []
---

# Windows User-Context Persistent Bridge

When the operator's Windows machine must act as a network bridge to a remote host (reverse SSH tunnel, comms-hub local proxy, anything that must stay alive across sleep/lock/relogin) and admin rights are not available, the only working persistence path is **user-context Task Scheduler** plus a **process supervisor** in the task action.

## The constraint

Corporate Windows machines without admin rights cannot register system services, install drivers, or run tasks under SYSTEM/non-interactive contexts. The bridge therefore has to live in the user's session — and that means it must survive the things a user session does that a system service does not need to: log off / lock / sleep / fast-startup wake.

## The six components

1. **Task Scheduler task in user context.** `LogonType: Interactive`, `RunLevel: Limited`, "Run only when user is logged on". No stored password, no service registration. This is the only no-admin persistence option on Windows.
2. **Two triggers.**
   - `At-logon` — restores the bridge after a fresh login.
   - Event-based trigger on `Microsoft-Windows-Power-Troubleshooter` event 1 (System log, readable without admin) — fires on resume from sleep, snaps the bridge back faster than waiting for ssh's TCP keepalive timeout.
3. **`MultipleInstances IgnoreNew`** in task settings, so a second trigger firing while the bridge is still running doesn't double-spawn.
4. **Supervisor stack: process supervisor wrapped in a retry loop inside the task script.** A naive supervisor (e.g., `autossh` for ssh) recovers from child drops, but supervisors have *their own* fatal-exit conditions that differ from the conditions they recover from. autossh, for example, treats child exit code 127 as fatal ("the supervised binary is missing") and gives up. The wrapper script must therefore loop the supervisor:

   ```bash
   while true; do
     kill_stale_processes      # see component 5
     "$SUPERVISOR" "${ARGS[@]}" || true
     sleep 10
   done
   ```

   The wrapper becomes the supervisor's supervisor. Task Scheduler triggers (logon, power-resume) are then a *tertiary* safety net for the rare case where the wrapper itself dies. Without the loop, a single fatal supervisor exit kills the bridge silently until the next logon or sleep-resume event — which may be hours or days away if the operator stays continuously logged in.

5. **Wrapper script kills any conflicting prior process before each launch.** Handles the case where the user manually started the bridge earlier in the session, and prevents bind/port-conflict loops with `ExitOnForwardFailure=yes`-style flags. With the loop in component #4, this stale-process cleanup runs on *every* iteration so each respawn rebinds cleanly.

6. **Hidden-window launcher: never invoke a console binary directly from the task action.** Under Windows 11 with Windows Terminal as the default console host, invoking `bash.exe -l -c "…"` (or any console binary) from a Task Scheduler action opens a visible terminal window that lingers for the lifetime of the task. The supervisor loop in component #4 makes this especially visible — the bash process running the loop never exits, so the window never closes. PowerShell's `-WindowStyle Hidden` does not work for non-PowerShell child processes; the standard Windows-native no-admin solution is `wscript.exe`:

   ```text
   Task action:  wscript.exe //B //Nologo run-hidden.vbs
   run-hidden.vbs:  CreateObject("WScript.Shell").Run "<full command line>", 0, True
   ```

   Window style `0` = `SW_HIDE`, wait `True` so wscript stays alive long enough for `MultipleInstances IgnoreNew` (component #3) to see the running instance. The supervisor loop never gets a console at all.

Removing any one of these six surfaces a different failure mode: drop (3) and you double-spawn on near-simultaneous triggers; drop the loop in (4) and a single fatal supervisor exit (autossh status-127, etc.) silently kills the bridge until the next trigger event; drop the inner supervisor in (4) and you stay down between sleep cycles; drop (5) and the first manual run wedges the scheduled run; drop the resume trigger and you wait 60-120s for SSH keepalive to time out before the supervisor reconnects; drop (6) and the operator sees a permanent visible terminal window on every login.

## Acceptance of the limitation

The bridge is bound to the Windows session — when the corporate machine is off, the network bridge is gone. Without admin rights, no system-wide service is possible. **For corporate-network-only bridges this is acceptable** because the operator's machine is the only path to the protected network anyway; "off machine = no bridge" matches reality. If a deployment cannot tolerate workstation-coupled availability, this pattern does not apply — the work belongs on a server with admin rights, not on the operator's machine.

## When this pattern applies

- Cross-network bridges where the operator's machine is the **only** path to the protected resource (corporate VPN, internal-only DB).
- Reverse SSH tunnels from operator → remote host loopback (the operator-initiated direction is what makes admin-less persistence even possible).
- Comms-hub local proxies that need to survive sleep/lock without admin rights.

When this pattern does **not** apply: anything that must stay reachable when the operator is asleep, on leave, or off-network. Use a server-hosted bridge instead.

## Evidence

### Initial deployment (2026-04-28, components 1–5)

- apex-migration-research commit `3298b83` (`feat: persist DB tunnels via autossh + Task Scheduler`).
- Files: `apex-migration-research/.claude/bin/autossh-db-tunnels.sh`, `apex-migration-research/.claude/bin/register-tunnel-task.ps1`.
- Task name: `ApexResearch-DBTunnels`, registered 2026-04-28.
- Use case: Windows operator → RC host loopback (`100.96.54.170`) reverse SSH tunnels for VJSDBTEST/VJSDBTEST2 Oracle access from the apex-research container.
- Verified end-to-end: TCP probe from inside apex container reached `127.0.0.1:11521` and `:11522` (host-networked container sees RC's loopback).

### 24-hour field testing surfaced two refinements (2026-04-29, components 4-loop and 6)

Both refinements address failure modes that are *not specific to ssh tunnels* — they generalize to any Windows-operator persistent bridge built on this pattern.

- **Refinement 1 — supervisor-of-supervisor (component #4 expansion).** Commit `183de33` (`fix(tunnels): supervise autossh with retry loop`). At 02:04 on 2026-04-29 (~12 hours after first deployment), the supervised ssh.exe exited with status 127 once (likely transient: AV scan, brief PATH flap, Windows Update fragment). autossh interpreted 127 as fatal and exited. Nothing restarted it because the operator stayed continuously logged in (no logon trigger) and the machine never slept (no power-resume trigger). The bridge was silently dead from 02:04 until manual restart at 10:12. Log line: `2026/04/29 02:04:13 autossh[35948]: ssh exited with status 127; autossh exiting`. Fix: loop the supervisor inside the wrapper script.
- **Refinement 2 — hidden-window launcher (component #6 added).** Commit `8edc230` (`fix(tunnels): hide bash console via wscript launcher`). User reported a visible Windows Terminal window with tab title `C:\Users\<user>\App…` (truncated bash.exe path) staying open permanently after task launch. Confirmed via screenshot. Once the supervisor became a `while`-loop in bash itself (Refinement 1), bash never exited and the window never closed. Fix: `wscript.exe` + VBS shim using `WshShell.Run …, 0, True` (window style 0 = `SW_HIDE`).
- Both refinements verified end-to-end 2026-04-29: tunnels up, no visible window, autossh PID 15444 + ssh PID 21836 alive under wscript PID 32352.

## Confidence and n=1 status

`medium` confidence; n=1 in the wiki — same single installation throughout, even after the 2026-04-29 amendment. The two refinements added 24 hours after initial deployment surfaced new failure modes at the same installation; they do not constitute independent confirmations of the pattern shape. Each refinement individually is also n=1.

Watch-list: a future comms-hub Windows-operator bridge would be a candidate n=2. If a second team adopts this six-component shape independently and either (a) hits the same failure modes or (b) deliberately includes the loop+wscript components on the basis of this entry, promote to `high` confidence and consider Protocol C promotion to common-prompt as the canonical Windows-operator persistence recipe.

The amendment-on-the-same-installation pattern is itself worth noting: real-world durable-deploy installations should expect 1-3 refinement rounds in the first week of operation as field conditions exercise edge cases that single-shot testing missed. The five-then-six expansion here is not a defect of the original pattern — it is the expected shape of how this kind of pattern matures.

## Related

- [`references/rc-host-db-tunnel-architecture.md`](../references/rc-host-db-tunnel-architecture.md) — the specific reverse SSH tunnel architecture that this pattern persists. The reference documents *what is being persisted*; this pattern documents *how persistence is achieved on Windows*.
- [`gotchas/warp-dns-vs-routing-asymmetry-rc-host.md`](../gotchas/warp-dns-vs-routing-asymmetry-rc-host.md) — the underlying network constraint that necessitates the tunnel in the first place.
- [`gotchas/cross-msys-argv-mangling.md`](../gotchas/cross-msys-argv-mangling.md) — the lurking failure mode of the supervisor component (#4 above) when parent and child binaries use different MSYS runtimes. Pin the child to Windows native OpenSSH to avoid.

## Amendment log

- **2026-04-28** — Initial filing, five components (1 Task Scheduler, 2 dual triggers, 3 IgnoreNew, 4 supervisor, 5 stale-process cleanup). Source: team-lead.
- **2026-04-29** — Amended to six components after 24-hour field testing surfaced two failure modes. Component #4 expanded to "supervisor stack" (supervisor-of-supervisor loop, recovers from supervisor's own fatal-exit conditions like autossh status-127); component #6 added (hidden-window launcher via wscript+VBS, prevents permanent visible terminal window on Win11). Source: team-lead. Same installation as initial filing — n=1 throughout.

(*FR:Callimachus*)
