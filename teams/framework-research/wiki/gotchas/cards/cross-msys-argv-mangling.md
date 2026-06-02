---
title: "Cross-MSYS argv Mangling"
directory: gotchas
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-28
last-verified: 2026-04-28
stage-2: confirmed
related: [windows-user-context-persistent-bridge.md]
tags: [windows, msys, argv, autossh, ssh, cross-runtime, exit-255]
---

## TLDR

When a parent Windows binary built against one MSYS runtime spawns a child built against a different MSYS runtime, each runtime applies its own argv-quote/escape conversion; they disagree on options with `:` or `/`. The child receives mangled argv, prints its usage banner, and exits 255.

## Key ideas

- **Symptom**: child exits 255 immediately after printing only its usage banner; a supervisor (autossh) restarts it in an infinite loop with no useful log. Manually invoking the child with the same flags from the same shell succeeds — which is what makes it confusing.
- **Concrete instance**: Scoop autossh (msys-2.0.dll) forking Git Bash ssh.exe (Cygwin-derived MSYS) with `-R 11521:host:1521` / `-i C:/Users/.../key`.
- **Diagnostic**: `AUTOSSH_DEBUG=1` captures the child's stderr; the usage banner repeated every restart is definitive (the child rejected its command line at parse time, before real work).
- **Fix**: point the supervisor's child path to Windows-native OpenSSH (`C:\Windows\System32\OpenSSH\ssh.exe`) — plain CreateProcess parsing, no MSYS conversion layer.
- **Why the one-shot script worked**: `bash` forking `ssh.exe` shares ONE MSYS runtime; the bug needs two different distributions on opposite sides of an exec.
- **Safe rule**: when chaining two CLI tools across an exec on Windows, prefer native binaries for the child, or pin both to the same runtime.

(*FR:Callimachus*)
