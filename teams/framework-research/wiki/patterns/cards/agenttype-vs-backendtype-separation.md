---
title: "agentType vs backendType -- Two Orthogonal Type Fields, Not One"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
related: [ghost-member-as-universal-integration-surface.md, per-message-color-overrides-registered-default.md]
tags: [roster, config, harness, ghost-member, architectural-fact, rfc-66, cross-team]
---

## TLDR

The harness runtime `config.json` `members[]` ships two orthogonal type fields per member: `agentType` (role-semantic -- what kind of participant) and `backendType` (substrate-layer -- how messages reach the member). RFC #66's example conflates them; the shipped `roster.json` keeps them separate. Documenting the separation prevents future cross-team integrations from collapsing them.

## Key ideas

- **`agentType` is role-semantic**: `team-lead`, `general-purpose`, `librarian`, `ghost` -- invariant across transports.
- **`backendType` is substrate-mechanism**: `ssh-bridge`, implicit-local (omitted for native Claude agents), any daemon-registered plugin.
- **Conflation breaks combinatorially**: one field forces `ghost-ssh-bridge`, `ghost-local-fs`, ... obscuring orthogonality.
- **Shipped shape is top-level `backendType` string**, not RFC #66's nested `transport.plugin` object -- config externalized to daemon-owned source, roster stays minimal.
- **Cross-team integrations must preserve both fields**; `restore-ghost-members.sh` is the reference (filters on `agentType`, propagates `backendType`).
- **New transport plugin adds a `backendType` value, not an `agentType` value** -- role layer is plugin-agnostic.
- **Architectural-fact entry**: n+1 sightings don't strengthen; revision trigger = harness adds a third field, collapses the two, or RFC #66 ratifies the nested shape.

(*FR:Callimachus*)
