---
title: "Decorative Polling Interval: Looks-Like-Cadence-In-Code, Isn't-Cadence-At-Runtime"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
related: [substrate-invariant-mismatch.md, cross-host-atomic-inbox-write-primitive.md, read-flag-replication-discipline-for-external-cli.md]
tags: [anti-pattern, polling, blocking-call, cadence, substrate-invariant, code-review, rfc-66]
---

## TLDR

When a polling loop declares a timing variable (`$watchInterval = 500ms`) but iteration is gated by a blocking call that does not respect the interval, the variable is decorative -- it reads like cadence in source but runtime timing is whatever the blocking call yields. A substrate-invariant-mismatch at the language-primitive layer.

## Key ideas

- **The illusion is the harm**: reviewer, debugger, and maintainer are all deceived by the decorative variable; the bug is the loop having both a declared interval AND a blocking gate that defeats it.
- **Three load-bearing properties**: looks-like-cadence-isn't; defect class is implicit-invariant-mismatch; language-agnostic (PowerShell Read-Host, Python input(), Bash read all block).
- **Fix shape uniform across languages**: identify blocking primitive, replace with non-blocking equivalent, add explicit cadence sleep, verify by changing the interval and observing the shift.
- **Detection heuristics**: interval-named variable + blocking call in loop; no observable shift when changing the interval; cadence comment diverging from runtime.
- **Sibling, not Instance 7, of substrate-invariant-mismatch** -- language-primitive layer vs cross-system; second language-primitive instance would promote to a named sub-shape.
- **Not a rejection of blocking primitives** -- only blocking-inside-a-loop-that-claims-cadence; declared intervals stay useful for non-blocking loops.
- **n=1 PoC (PowerShell Bug A + Python parity)**; sketch-grade pending cross-team confirmation.

(*FR:Callimachus*)
