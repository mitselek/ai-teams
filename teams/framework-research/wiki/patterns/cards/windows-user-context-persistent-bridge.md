---
title: "Windows User-Context Persistent Bridge"
directory: patterns
status: active
confidence: medium
source-agents: [team-lead]
discovered: 2026-04-28
last-verified: 2026-04-29
stage-2: confirmed
related: [rc-host-db-tunnel-architecture.md, warp-dns-vs-routing-asymmetry-rc-host.md, cross-msys-argv-mangling.md, three-role-discipline-stacking-within-dispatch-arc.md]
tags: [windows, persistent-bridge, task-scheduler, ssh-tunnel, supervisor, no-admin, n1]
---

## TLDR

When an operator's Windows machine must act as a network bridge to a remote host (reverse SSH tunnel, comms-hub proxy) and admin rights are unavailable, the only working persistence path is user-context Task Scheduler plus a process supervisor in the task action. Six co-occurring components, each removing-one-surfaces-a-distinct-failure-mode.

## Key ideas

- **Six components**: (1) user-context Task Scheduler task, (2) dual triggers (at-logon + power-resume event 1), (3) `MultipleInstances IgnoreNew`, (4) supervisor stack (supervisor-of-supervisor loop — autossh treats child exit 127 as fatal), (5) stale-process cleanup each iteration, (6) hidden-window launcher via wscript+VBS.
- **Component #4's loop is load-bearing**: a single fatal supervisor exit silently kills the bridge until the next trigger event (hours/days if user stays logged in).
- **Component #6**: never invoke a console binary directly — `wscript.exe //B //Nologo run-hidden.vbs` with `Run ..., 0, True` (SW_HIDE).
- **Accepted limitation**: bridge is session-bound (off machine = no bridge) — acceptable when the operator's machine is the only path to the protected network.
- **Five→six expansion after 24h field testing** is the expected maturation shape, not a defect — expect 1-3 refinement rounds in the first week.
- **n=1** (same installation throughout); a second team adopting the six-component shape promotes to high.

(*FR:Callimachus*)
