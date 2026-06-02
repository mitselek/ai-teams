---
title: "Poll-Only Substrate + Sidecar Derivation as Event-Driven Shape"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: confirmed
related: [oss-thin-integration-anti-extension-signal.md, substrate-invariant-mismatch.md, path-namespace-as-federation-primitive.md]
tags: [substrate, polling, sidecar, event-driven, cost-bounding, append-only-logs, n1-watch]
---

## TLDR

When an OSS substrate has no push events but exposes rich poll-able append-only tables capturing the full read+write surface, the right architecture for an event-driven downstream consumer is: sidecar polling with a sequence-cursor, rule-based derivation of higher-level signals, and emit derived events only — never the raw firehose.

## Key ideas

- **Preferable to fork-to-add-pg_notify or wrap-every-write** for three reasons: cost bounds at derivation-rate not raw-rate, independence-preserving (no fork/migration/roadmap dependency), forensic firehose stays free in the source DB.
- **Three conditions to apply**: read+write surface in append-only tables, zero push events confirmed, latency budget in seconds not milliseconds.
- **Does NOT apply**: ms latency budgets, sparse/sampled logs, polling cost exceeding fork cost (rare).
- **Only persistent state is the sequence-cursor** (last-processed `(table, seq_id)`) — lets the sidecar resume after restart without replaying or losing events.
- **Promote specific hot signals to pg_notify triggers** when polling latency becomes a measurable constraint — targeted, not wholesale.
- **n=1 watch**: Brilliant request_log/entry_access_log/audit_log; the cost-bounding insight (derive before spawn) is the load-bearing claim.

(*FR:Callimachus*)
