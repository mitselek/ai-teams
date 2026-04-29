---
name: cross-msys-argv-mangling
description: Two MSYS-flavored Windows binaries in a parent/child exec relationship mangle argv at the boundary; child sees malformed command line, prints usage banner, exits 255
type: gotcha
source-agents:
  - team-lead
discovered: 2026-04-28
filed-by: librarian
last-verified: 2026-04-28
status: active
confidence: high
source-files:
  - apex-migration-research/.claude/bin/autossh-db-tunnels.sh
source-commits:
  - 3298b83
source-issues: []
---

# Cross-MSYS argv Mangling

When a parent Windows binary built against one MSYS runtime spawns a child Windows binary built against a *different* MSYS runtime, the argv handoff goes through Windows `CreateProcess` — but each runtime applies its own argv-quote/escape conversion on the way out and on the way in. The conversions disagree on options containing `:`, `/`, or other punctuation. The child receives a mangled argv, fails to parse it, prints its usage banner, and exits 255.

## Symptom

Child process exits 255 immediately, having printed only its usage/help banner. If the parent is a supervisor (autossh, watchdog, etc.) it restarts the child, infinite loop, no useful diagnostic in the supervisor's log — only "child exited with status 255". Manually invoking the child with the *same flags* from the *same shell* succeeds, which is what makes this confusing.

## Concrete instance

- **Parent:** Scoop's `autossh` 1.4g, built against `msys-2.0.dll` (msys2.org distribution).
- **Child:** Git Bash's `ssh.exe` (Git for Windows' bundled MSYS, Cygwin-derived).
- **Failing arguments:** `-R 11521:host:1521`, `-i C:/Users/.../key`.
- **Failure cycle:** autossh forks ssh → ssh sees mangled argv → prints usage banner, exits 255 → autossh logs "ssh exited with error status 255" → autossh restarts ssh → loop.

## Diagnostic

`AUTOSSH_DEBUG=1` (or supervisor-equivalent) captures the spawned child's stderr. Seeing the child's **usage banner repeated on every restart cycle** is definitive — it means the child rejected its command line at parse time, before doing any real work. Healthy child failures (auth errors, network errors, etc.) do not print the usage banner.

## Fix

Set the supervisor's child-binary path (`AUTOSSH_PATH` for autossh, equivalent for other supervisors) to **Windows native OpenSSH** at `C:\Windows\System32\OpenSSH\ssh.exe`. Native Windows OpenSSH uses plain `CreateProcess` argv parsing with no MSYS conversion layer, so it interoperates cleanly with msys2 autossh.

```bash
# Failing: child = Git Bash ssh, parent = msys2 autossh
export AUTOSSH_PATH=/c/Users/<user>/AppData/Local/Programs/Git/usr/bin/ssh.exe
# Working: child = Windows native ssh, parent = msys2 autossh
export AUTOSSH_PATH=/c/Windows/System32/OpenSSH/ssh.exe
```

## Why the manual one-shot script worked

When `bash` directly forks `ssh.exe`, both binaries share the **same** MSYS runtime (Git Bash's), so argv conversion is symmetric — what the parent emits is exactly what the child decodes. The bug only appears when **two different MSYS distributions** sit on opposite sides of an exec.

## Generalization

Any Windows-side toolchain that combines:

- (a) a tool installed via Scoop or pacman/msys2, with
- (b) a tool installed via Git for Windows,

is at risk when (a) execs (b) (or vice versa) as a child process with non-trivial argv.

**Safe rule:** when chaining two long-running CLI tools across an exec on Windows, prefer **Windows-native binaries** for the child process, or pin both parent and child to the same MSYS runtime. The native-child option is usually the cheaper fix because Windows ships with native OpenSSH, native curl, and native tar — pinning runtimes is harder than swapping the child.

## Versions involved (as observed)

- autossh 1.4g (Scoop, msys-2.0.dll)
- Git Bash OpenSSH_10.2p1
- Windows OpenSSH_for_Windows_9.5p2 (LibreSSL 3.8.2)

## Related

- [`patterns/windows-user-context-persistent-bridge.md`](../patterns/windows-user-context-persistent-bridge.md) — the persistent-bridge pattern this gotcha lurks beneath. Any naive autossh+Git-Bash-ssh implementation of that pattern hits this argv-mangling failure mode. The pattern's "process supervisor" component is where the cross-MSYS hazard lives.

(*FR:Callimachus*)
