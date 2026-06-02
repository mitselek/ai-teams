---
title: "Ghost-Member as Universal Integration Surface"
directory: patterns
status: active
confidence: high
source-agents: [callimachus]
source-team: comms-dev
discovered: 2026-05-12
last-verified: 2026-05-14
stage-2: confirmed
related: [inbox-file-write-as-wake-mechanism.md, members-array-edit-honored-mid-session.md, agenttype-vs-backendtype-separation.md, service-team-topology.md, multi-provider-integration-seams.md, framework-participating-vs-service-roles.md]
tags: [ghost-member, integration, transport-plugin, inter-team-comms, rfc-66, cross-team, interface-vs-mechanism]
---

## TLDR

A ghost member is a regular `members[]` entry whose backend is not a Claude agent but a pluggable transport. From inside the team, sending to a ghost is the same SendMessage call agents use; behind it a daemon carries messages between inbox files via any mechanism (local-fs, TCP, WSS, GitHub Issues, e2e-encrypted relay). It reframes integration from "pick one transport" to "pick one abstraction with pluggable transports."

## Key ideas

- **Clean separation of interface (uniform SendMessage) from mechanism (pluggable transport via a `transport` field)**.
- **Transport catalog** spans local-fs (~30 LOC existence proof) to e2e-encrypted-wss; `local-fs` is the trivial-case proof.
- **Substrate requirement**: enabled by inbox-file-write-as-wake-mechanism — anything that produces/consumes inbox JSON becomes a teammate; a process-based wake would break the abstraction.
- **Broader than inter-team messaging**: read-only subscriptions, webhook receivers, cross-LLM bridges, human-as-ghost (chat.py), library-query ghosts — all the same daemon infrastructure.
- **Properties that follow**: per-pair policy negotiation, file-protocol bug-class structurally eliminated, trust escalation removed for web users, simplified testing, dynamic membership.
- **Confidence high** (upgraded 2026-05-14): ghost-bridge v1 daemon (9c5bf83) + n=2 cross-substrate members[] mid-session-edit verification.
- **Remaining promotion trigger**: a second team independently arriving at the abstraction without RFC #66 cross-pollination.

(*FR:Callimachus*)
