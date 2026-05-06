---
author: brunel
team: framework-research
date: 2026-05-05
phase: A (scope-and-approach memo — plan-for-design, NOT design)
issue: 65
project: Prism (federated knowledge substrate, post-Brilliant)
audience: team-lead (Aen) for cross-specialist alignment with Monte + Herald
domain: containerization + topology + setup
---

# Phase A Scope-and-Approach Memo — Brunel (project: Prism)

(*FR:Brunel*)

## §1 — Read confirmation

Anchoring on four Finn facts that constrain my domain:

1. **One-tenant Brilliant today** — FR has no MCP config (clean negative). Setup is real work. → Finn §1.1.
2. **5+ orders latency headroom** (~1-10/wk observed vs ~178 ops/s). Topology is shape-driven, NOT capacity-driven. → Finn §1.4.
3. **Asymmetric hub-and-spoke is the empirical baseline** — FR-as-hub, ~10× cross-team-aware vs apex. Peer-mesh is aspirational. → Finn §1.3.
4. **Path-namespace IS the federation primitive** (per `reference_brilliant_mcp.md` + Finn §1.2). Issue #65 says "scale the pattern" — my work supports an existing architecture, not a new one.

Implication: I'm shaping infra for an observed methodology-hub with weekly-cadence traffic, NOT a high-throughput mesh. Optimize for durability + ops-simplicity + single-instance-ok; do NOT optimize for multi-region replication or sub-second propagation.

Project codename: **Prism**. Optical lineage Obsidian → Brilliant → Prism (refractor — federation as one substrate, multiple per-team views). All design artifacts ship to `mitselek/prism`; this scope memo stays in FR-research as it's plan-for-design, not design.

## §2 — Decision shape (artifacts I'll produce)

1. **Federation topology recommendation.** Hub-and-spoke / mesh / hybrid, anchored to 12-month-out plausible scale (not today, not unbounded). Audience: Aen + Monte. Includes growth-trigger conditions for re-evaluation.
2. **Brilliant MCP setup-phase config path for FR.** Minimal-blast-radius: config-only, single-file revertible, no shared-state writes during setup. Audience: PO + operator. Cites esl-suvekool's `.mcp.json.example` shape; FR path-namespace claim (`Projects/fr/*`, `Context/fr/*`) negotiated upfront.
3. **Container-deployment posture for the federation layer.** Co-located / dedicated / per-tenant — graded against E-deployment (CF Tunnel + hello-world-container). Audience: Aen + Volta. Tier-maps to the EVR Konteinerite Standard.

## §3 — Blockers

- **Aen's call:** topology-decision authority is yours. Can't ship the deployment-posture memo without knowing if hub-and-spoke is locked.
- **Herald-first preference:** sync-mechanism shape (Finn §2.3 — poll / weekly-batch / event-driven) constrains my container resource-shape (cron? sidecar? long-running listener?). Prefer Herald's memo first, OR an Aen directive that fixes sync-shape across all three of us.
- **Monte-touch:** namespace-curator scope (Finn §2.5) affects whether the federation container hosts curator logic or just substrate. Soft blocker on the posture memo, not the topology one.

## §4 — Expected output (Phase A deliverable)

Three short memos in `teams/framework-research/docs/`, total ~900w combined:

1. `phase-a-federation-topology-2026-05-05.md` — topology recommendation
2. `phase-a-brilliant-mcp-fr-setup-2026-05-05.md` — FR setup runbook + config snippet
3. `phase-a-federation-container-posture-2026-05-05.md` — deployment posture + tier mapping

NOT shipping in Phase A: actual Dockerfile, actual `.mcp.json`, actual deploy. Phase A = decision docs; implementation = post-alignment.

(*FR:Brunel*)
