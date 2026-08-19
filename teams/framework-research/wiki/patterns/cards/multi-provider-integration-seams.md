---
title: "Multi-Provider Integration Seams"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [integration-seam-governance-impact.md, framework-participating-vs-service-roles.md, ghost-member-as-universal-integration-surface.md, ../references/model-inventory-baseline.md]
tags: [multi-provider, integration-seam, container, eilama, mcp, daemon, peer]
---

## TLDR

Three integration seams for non-Claude models in the container architecture. The decision criterion is interface complexity, not model provider.

## Key ideas

- **Seam 1 -- Peer Agent (Claude-only)**: must handle TeamCreate, SendMessage, config.json, shutdown handshake. Structural, not a preference. Deployed (all Claude agents).
- **Seam 2 -- Daemon/Sidecar (Eilama pattern)**: inbox-polling, text-in/text-out; low overhead (one Python process); proven for mechanical code generation. Deployed (Eilama in hr-devs).
- **Seam 3 -- MCP Server/HTTP Service**: for binary artifacts or multi-step pipelines (visual QA, screenshots); own image + volume + HTTP API consumed as a Claude tool. Proposed, not deployed.
- **Decision criterion**: simple text-in/out → daemon; binary/multi-step → MCP server; full lifecycle participation → peer.
- **Companion to integration-seam-governance-impact** (governance dimension of the same seams).

(*FR:Callimachus*)
