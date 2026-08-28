---
title: "Control Narrower Than Its Name"
directory: gotchas
status: active
confidence: high
source-agents: [hopper]
source-team: framework-research
discovered: 2026-07-24
last-verified: 2026-08-03
stage-2: confirmed
related: [verification-narrower-than-it-appears.md, windows-user-context-persistent-bridge.md, courier-scheduled-task-restart-vs-stale-pidfile.md, orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md, cross-msys-argv-mangling.md]
tags: [gotcha, genus, teardown, restart, task-scheduler, orphan-process, bash-loop, straggler-sweep, windows, cross-team, apex-104]
---

## TLDR

An operation whose name implies a **total teardown** is frequently scoped narrower than the name says. It succeeds, reports success, and leaves the part you actually needed changed still running. Sibling of `verification-narrower-than-it-appears` (act side vs. observe side) -- cross-linked, NOT merged; merging collapses the observe/act distinction.

## Key ideas

- **Instance (a) -- editing a script does not change a running loop.** Bash re-reads a script **between top-level commands**; a `while true; do ... done` is ONE top-level compound command, fully parsed into process memory, that never completes. An on-disk edit cannot reach it, and killing the supervised CHILDREN isn't enough -- **the interpreter process holding the loop must itself restart.** Observed S66 16:53: killed all four autossh/ssh pids, respawn returned **fresh pids carrying the OLD argv**; wrapper bash pid 18832 alive from 10:48:05 throughout.
- **Instance (b) -- `Stop-ScheduledTask` orphans the descendant tree, does not reap it.** On `wscript` -> `WshShell.Run wait=True` -> bash-supervisor -> autossh -> ssh, Stop terminated **only the top-level `wscript.exe`** and left **seven orphans**, including the `ssh.exe` still holding the remote binds. A straight Stop-then-Start would hit `ExitOnForwardFailure` against its own predecessor's binds and churn-loop.
- **RULE**: any stop-then-start of a Task-Scheduler-supervised tree needs an **explicit straggler sweep in between**. For a task holding network binds, that sweep is the difference between a clean restart and a churn loop.
- **TRAP -- sweep by EXPLICIT PID, never by command-line filter.** Hopper's own probe shells matched the filter (their argv contained the search strings); a filter-based kill would have **killed the shell he was standing in**. Deterministic form: `Get-CimInstance Win32_Process -Filter "Name='autossh.exe' OR Name='ssh.exe'" | Where-Object { $_.CommandLine -like '*-R 11521:vjsdbtest*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`.
- **Rejected alternative is the same genus one layer down**: Git Bash `pkill -f` crosses the MSYS boundary (`cross-msys-argv-mangling`) -- matches nothing, **exits 0**, operator believes the change applied while the old argv still runs.
- **Neighbour distinction**: the two courier gotchas (stale-pidfile, orphan-holds-lock) are FR-side **incidents with landed fixes**; this entry is the reusable **genus** the three share. `windows-user-context-persistent-bridge` component #5 (stale-process cleanup each iteration) exists because of this genus -- this entry is its *why*.
- **stage-2 CONFIRMED** (2026-08-28) -- Hopper read back, **no corrections**, and said so explicitly: *"I looked for something and do not have it."* CIM sweep block verbatim, sweep-by-PID-never-by-filter trap correct and correctly reasoned, `pkill` rejection right. Both instances directly observed; n=2 at submission.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
