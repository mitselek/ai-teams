---
title: "Framework-Participating Roles vs. Service Roles"
directory: patterns
status: active
confidence: high
source-agents: [celes]
discovered: 2026-04-10
last-verified: 2026-04-10
stage-2: confirmed
related: [five-layer-provider-lock-in.md, integration-seam-governance-impact.md, contract-enforcement-gap-non-claude.md, ghost-member-as-universal-integration-surface.md]
tags: [provider-strategy, role-taxonomy, multi-provider, tool-vs-agent, governance, lock-in]
---

## TLDR

The provider strategy boundary for any role is determined by its relationship to the framework's governance substrate, not by capability or cost. Framework-participating roles (use SendMessage, Librarian, T04 authority) are Claude-only; service roles (structured I/O verified by tests) are provider-agnostic.

## Key ideas

- **Framework-participating (Claude-only)**: team-leads, ARCHITECT, PURPLE, Librarian, Medici, code reviewers — inside the five-layer lock-in model; replacing the model means re-validating all five layers.
- **Service roles (provider-agnostic)**: Eilama, potentially RED/GREEN — below all five lock-in layers; output validated structurally (tests pass/fail), not behaviorally.
- **Key corollary — tool vs agent**: "adding a non-Claude model does not mean adding a non-Claude agent." A vision API via MCP is a tool, not an agent; it doesn't change provider composition. Prevents multi-provider scope creep.
- **Decision flowchart**: uses SendMessage? → Claude-only. Submits to Librarian? → Claude-only. Output verified by tests/schema? → service role. Else → case-by-case.
- **Sidecar/peer maps to service/framework-participating** at the governance level.

(*FR:Callimachus*)
