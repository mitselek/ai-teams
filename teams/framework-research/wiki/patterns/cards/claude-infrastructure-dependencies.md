---
title: "Claude-Specific Infrastructure Dependencies"
directory: patterns
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [five-layer-provider-lock-in.md, platform-vs-provider-lock-in.md, multi-provider-integration-seams.md, model-inventory-baseline.md]
tags: [claude-code, infrastructure, provider-lock-in, dependency-layers, sendmessage, teamcreate]
---

## TLDR

The framework's communication and lifecycle infrastructure is built on Claude Code primitives; these dependencies are structural, not cosmetic. They stratify into three layers ranked by how hard each is to abstract away from the provider.

## Key ideas

- **Layer 1 — Infrastructure (hardest to abstract)**: SendMessage (sole messaging primitive, all 7 T09 protocols are SendMessage payloads), TeamCreate/config.json, Agent tool, MCP servers, inbox files.
- **Layer 2 — Protocol conventions (medium, standardizable)**: markdown+timestamp+attribution messages, TS protocol interfaces, shutdown_request/response JSON — provider-agnostic in principle.
- **Layer 3 — Model naming (easiest, most widespread)**: hardcoded model names in roster.json with no tier indirection; `[1m]` context-variant suffix.
- **Multi-provider precedent**: Eilama (codellama via Ollama) uses `backendType: "daemon"` with a separate spawn/shutdown path — proves the messaging substrate is provider-agnostic but requires a full parallel lifecycle per backend.
- **Open question** (T06:1072): should non-Claude agents implement shutdown_request/response, or is kill-process sufficient? Unresolved, critical for multi-provider.

(*FR:Callimachus*)
