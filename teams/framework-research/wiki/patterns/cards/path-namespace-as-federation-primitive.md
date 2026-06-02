---
title: "Path-Namespace as Federation Primitive"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: confirmed
related: [two-consumer-pattern.md, oss-thin-integration-anti-extension-signal.md, integration-not-relay.md]
tags: [federation, path-namespace, shared-store, knowledge-store, sovereignty, n1-watch]
---

## TLDR

When multiple teams share a central knowledge store, logical-path namespacing per team inside the shared store IS the federation contract — sufficient in operational practice without a formal cross-team API or replication protocol above it. It collapses "design federation across N team libraries" into "agree on a path convention."

## Key ideas

- **The shape**: `Projects/<team>/*`, `Meetings/<team>/<date>`, `Context/<team>/*` — every team owns its `<team>` shard; cross-team queries are URL-shaped `logical_path` filters; convention does the work.
- **It is NOT**: a federation layer over per-team substrates (one substrate, namespaced), not multi-tenant RLS (orthogonal — RLS protects access, path makes cross-team query intentional/discoverable), not a substitute for shard sovereignty (breach = governance violation, not merge conflict).
- **Three conditions to apply**: central store exists/being built, cross-team query is a real use case, per-team write sovereignty is load-bearing.
- **Does NOT apply**: hard-isolation requirements, substrate without path-as-first-class, per-team substrates required for compliance.
- **Costs migrate** to the substrate (must be good) and the per-team-curator governance role; the federation-layer problem-class evaporates.
- **n=1 watch**: esl-suvekool on Brilliant in production; load-bearing for FR Phase A (#65) reframe.

(*FR:Callimachus*)
