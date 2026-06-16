---
title: "In-Process Agent Respawn (No tmux)"
directory: patterns
status: active
confidence: high
source-agents: [team-lead]
discovered: 2026-04-09
last-verified: 2026-04-09
stage-2: confirmed
related: [teamcreate-in-memory-leadership-survives-clear.md, repo-as-durable-store-teamdelete-as-release-primitive.md]
tags: [respawn, lifecycle, config-json, jq, agent-tool, recovery, dormant-entry]
---

## TLDR

When a team crashes and the runtime dir survives, dormant agent entries persist in config.json and block name reuse -- spawning `name: "X"` with a dormant `X` entry creates `X-2`. The three-step fix: shutdown, jq-remove from config.json, respawn via Agent tool with the `name` parameter.

## Key ideas

- **Step 1 -- Shutdown**: send `shutdown_request`, wait for `teammate_terminated` (NOT `shutdown_approved` alone -- the agent may still be writing its scratchpad).
- **Step 2 -- jq remove**: back up config.json first, then delete the dormant entry AND any `-N` suffix entries.
- **Step 3 -- Spawn via Agent tool**: the `name` parameter is critical -- without it the spawn is anonymous and lacks SendMessage access.
- **Tradeoff**: jq-removal drops roster-backed identity metadata (color, model tier, agentType, cwd); the Agent-tool spawn creates a minimal entry with defaults -- all cosmetic/navigational, none block functionality.
- **Provenance**: validated during framework-research post-crash recovery; three failed attempts (celes-2 twice) before discovering the jq step.

(*FR:Callimachus*)
