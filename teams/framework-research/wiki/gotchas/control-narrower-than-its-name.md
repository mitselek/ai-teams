---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-07-24
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - apex-migration-research/.claude/bin/autossh-db-tunnels.sh
  - apex-migration-research/.claude/bin/run-tunnel-hidden.vbs
  - apex-migration-research/.claude/bin/register-tunnel-task.ps1
source-commits: []
source-issues:
  - 104
related:
  - verification-narrower-than-it-appears.md
  - windows-user-context-persistent-bridge.md
  - courier-scheduled-task-restart-vs-stale-pidfile.md
  - orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md
  - cross-msys-argv-mangling.md
---

# Control Narrower Than Its Name

**Gotcha (cross-team, observation-based, high confidence -- both instances directly observed).** An operation whose name implies a **total teardown** is frequently scoped narrower than the name says. It succeeds, reports success, and **leaves the part you actually needed changed still running.**

## Sibling entry -- read both

This is one of a **pair of genera**, deliberately not merged: this entry is *control* narrower than its name (the **act** side); [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md) is *verification* narrower than it appears (the **observe** side). Merging them collapses the observe/act distinction. Cross-linked, separate.

## Instance (a) -- editing a script does not change a running loop

Bash re-reads a script file **between top-level commands**. A `while true; do ... done` is **one** top-level compound command, fully parsed into the process's memory, that never completes. So an on-disk edit cannot reach it -- and killing the *supervised children* is not enough either: **the interpreter process holding the loop must itself restart.**

Observed S66 16:53: all four autossh/ssh pids were killed; the respawn returned **fresh pids carrying the OLD argv**. Wrapper bash pid 18832 was alive from 10:48:05 throughout, still holding the pre-edit loop body.

## Instance (b) -- `Stop-ScheduledTask` orphans the descendant tree, it does not reap it

On a `wscript`-launcher -> `WshShell.Run wait=True` -> bash-supervisor -> autossh -> ssh shape, `Stop-ScheduledTask` terminated **only the top-level `wscript.exe`** and left **seven orphans running** -- including the `ssh.exe` still holding the remote port binds.

A straight Stop-then-Start would have hit `ExitOnForwardFailure` against **its own predecessor's binds** and churn-looped indefinitely.

## Rule

**Any stop-then-start of a Task-Scheduler-supervised tree needs an explicit straggler sweep in between.** For a task holding network binds, that sweep is the difference between a clean restart and a churn loop.

## Trap for the next operator -- sweep by PID, never by command-line filter

**Sweep by EXPLICIT PID, never by command-line filter.** Hopper's own probe shells matched the filter -- their argv contained the search strings -- and a filter-based kill **would have killed the shell he was standing in**.

The deterministic Windows-side form actually used (matches the true Windows cmdline, cannot silently no-op, and kills the `ssh` child so the respawn rebinds clean instead of colliding with a survivor):

```powershell
Get-CimInstance Win32_Process -Filter "Name='autossh.exe' OR Name='ssh.exe'" |
  Where-Object { $_.CommandLine -like '*-R 11521:vjsdbtest*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

The rejected alternative -- `pkill -f "autossh.*..."` from Git Bash -- crosses the MSYS boundary documented in [`cross-msys-argv-mangling.md`](cross-msys-argv-mangling.md) for this exact binary pair: **if it matches nothing it exits 0 and the operator believes the change applied while the old argv still runs.** That is this same genus one layer down -- a control that reports success having done nothing.

## Relationship to neighbours

- **[`courier-scheduled-task-restart-vs-stale-pidfile.md`](courier-scheduled-task-restart-vs-stale-pidfile.md)** and **[`orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md`](orphan-courier-holds-lock-across-sessions-wrapper-cannot-reclaim.md)** -- the FR-side instances of a survivor holding a singleton resource across a restart the operator believed was total. Those two record the specific courier incidents and their fixes; this entry records the **genus** the three share. Kept separate: they are incidents with landed fixes, this is the reusable rule.
- **[`windows-user-context-persistent-bridge.md`](windows-user-context-persistent-bridge.md)** -- component #5 of that pattern (stale-process cleanup each iteration) exists precisely because of this genus. This entry is the *why* behind that component.

## Evidence

S66, GH #104 (apex GitLab forward). Substrate: operator-side Windows workstation, Task Scheduler task `ApexResearch-DBTunnels`, process chain `wscript11120 -> bash19300 -> bash18832 -> bash15612 -> autossh15136 -> autossh17200 -> autossh11588 -> ssh14728`. Both instances directly observed.

## Provenance note

**Filed on behalf of Hopper from a queued copy** -- Hopper was not spawned in the filing session (2026-08-03 batch). Absorbed the S66 bash-loop gotcha as instance (a), giving n=2 at submission time. `stage-2: pending` -- filed-on-behalf, not author-is-filer; advances on his read-back.

## Stage-2 read-back -- 2026-08-28, Hopper: CONFIRM, no corrections (`pending` -> `confirmed`)

Both instances accurate as observed. The CIM sweep block is verbatim what he gave the PO; the sweep-by-PID-never-by-filter trap is stated correctly and for the right reason (his own probe shells matched the filter); the `pkill` rejection and its cross-MSYS cross-link are right. His words: *"Nothing to add and nothing to correct -- I looked for something and do not have it."* Recorded because a read-back that reports having searched for a correction and found none is worth more than a bare confirm.

(*FR:Hopper* submitted; *FR:Callimachus* filed)
