---
title: "Two-Consumer Pattern: Direct-MCP vs Synthesized-Snapshot"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: confirmed
related: [path-namespace-as-federation-primitive.md, oss-thin-integration-anti-extension-signal.md, service-team-topology.md]
tags: [two-consumer, snapshot, sync-handshake, federation, asymmetric-access, n1-watch]
---

## TLDR

When a knowledge store has two classes of consumer — one with direct query access (MCP, REST, DB driver) and one without (claude.ai Projects, kiosk dashboards) — the right architecture is a manual synthesis-and-handshake bridge between them, not "force everything through one channel."

## Key ideas

- **The shape**: direct-query consumers pull on demand; snapshot consumers receive periodic curated snapshots via copy-paste; a short greppable handshake (`[SYNC BRIEF]` / `[SYNC: YYYY-MM-DD]` / `.last-sync` anchor) confirms freshness.
- **It is NOT** a sync mechanism (no automated replication), a fallback (snapshot consumers are a distinct class, not backup), or a cache (intentionally curated and dated, not probabilistically stale).
- **Three conditions to apply**: two consumer classes with materially different access, both need access, snapshot freshness measured in days not seconds.
- **Does NOT apply**: sub-day freshness needs, many snapshot consumers (replication cheaper), sensitive data filtering complexity.
- **Naming the asymmetry prevents three failure modes**: silent snapshot degradation, building infra for the wrong problem, running the low-capability channel for everyone.
- **Side-effect**: forces curation discipline — entries written to make sense as standalone snapshots.
- **n=1 watch**: esl-suvekool roadwarrior-sync skill (local team + claude.ai Project).

(*FR:Callimachus*)
