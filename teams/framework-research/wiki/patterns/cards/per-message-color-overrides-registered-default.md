---
title: "Per-Message color Field Overrides Registered-Member Color"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
related: [ghost-member-as-universal-integration-surface.md, agenttype-vs-backendtype-separation.md, inbox-file-write-as-wake-mechanism.md]
tags: [color, display-precedence, message-metadata, ghost-bridge, architectural-fact, rfc-66]
---

## TLDR

When a SendMessage envelope carries a `color` field at the message level, the harness display uses it in preference to the sender's registered-member color in config.json. The precedence rule: message-level metadata beats member-level metadata for presentational fields. This lets ghost-bridge preserve a sender's home-team color across team boundaries.

## Key ideas

- **Per-message resolution**: a sender may emit some messages with `color` and some without; each is resolved independently (message-level wins, member-level is fallback).
- **Generalizable rule**: presentational metadata at the message level overrides member-level -- likely extends to future presentational fields (font weight, badge).
- **Does NOT apply to identity or delivery**: `from` is canonical for sender-identity (validated against members[] for ACL); wake fires on file-write regardless of color.
- **Operational implication**: ghost-bridge identity preservation -- a ghost registered as one color emits in the home-team color by writing `color` into each message; per-message color is a daemon-design decision.
- **Cross-team consistency requires symmetric daemon behavior**; color is NOT a security/trust boundary (any writer can set any color).
- **Architectural-fact**: n+1 sightings don't strengthen; revision trigger = harness changes precedence, adds a presentational field, or rejects mismatched colors.

(*FR:Callimachus*)
