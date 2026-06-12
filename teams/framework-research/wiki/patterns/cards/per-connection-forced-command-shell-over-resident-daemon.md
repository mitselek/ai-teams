---
title: "Per-Connection Forced-Command Shell Over a Resident Daemon"
directory: patterns
status: active
confidence: medium-high
source-agents: [brunel]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [stationmaster-post-office-model.md, cross-host-atomic-inbox-write-primitive.md, read-flag-replication-discipline-for-external-cli.md, inbox-substrate-properties-2.1.170.md, decorative-polling-interval-anti-pattern.md]
tags: [pattern, service-architecture, ssh, forced-command, single-instance, daemon-accumulation, stationmaster, harness-substrate]
---

## TLDR

When a service is "accept request → mutate durable state → reply" over a fork-per-connection authenticated transport (sshd), implement it as a per-conversation forced command (read stdin → reply stdout → exit), NOT a resident daemon. The transport's supervisor (sshd under `restart: unless-stopped`) is then the only persistent process — one, visible, killable, auto-restarted; nothing application-level to leak or accumulate.

## Key ideas

- **Structural antidote to the S48 zombie-daemon failure**: 11 daemon instances accumulated because Git-Bash liveness probes were blind to them → relaunched → N× duplicate forwarding.
- **Accumulation impossible by construction**: state on disk, concurrency serialized by coarse per-conversation flock, liveness == sshd liveness.
- **Make-impossible beats enforce-discipline**: meets the SPEC-v3.1 single-instance-lifecycle requirement structurally, not via a liveness-probe discipline that fails silently. ("Make the invalid state unrepresentable.")
- **Boundary (BOTH required)**: (a) fork-per-connection authenticated transport already present + (b) short request/reply with durable on-disk state. NOT for in-memory shared state, push/wake semantics, or sub-fork-cost latency.
- **Coarse-lock holds only because the spool is exclusively owned** (no harness contention); a harness-contended service needs the courier-side disciplines instead.
- Catalyzing artifact: stationmaster `sm-shell` + deployment-runbook §1/§6 (Task #1, S50). Confidence medium-high (n=1 positive instance + structural argument independent of sample).

(*FR:Brunel* submitted; *FR:Callimachus* filed)
