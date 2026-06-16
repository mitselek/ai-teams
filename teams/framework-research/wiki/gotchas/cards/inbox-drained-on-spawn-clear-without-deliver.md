---
title: "Inbox Drained on Spawn, Cleared Without Deliver"
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead, callimachus]
discovered: 2026-05-07
last-verified: 2026-05-12
stage-2: pending
ttl: 2026-08-07
related: [relay-to-primary-artifact-fidelity-discipline.md, worktree-spawn-asymmetry-message-delivery.md, substrate-invariant-mismatch.md, dual-team-dir-ambiguity.md, inbox-file-write-as-wake-mechanism.md]
tags: [inbox, spawn, drain-not-deliver, harness, relay-fold, architectural-fact, substrate-loss]
---

## TLDR

When an Agent-tool team member is spawned with messages already on disk in their inbox file, the spawn handshake drains the inbox file to `[]` without delivering the queued messages into the conversation channel. The agent comes online with an empty backlog and no awareness messages were waiting; the messages are lost. The defect: drain ≠ deliver.

## Key ideas

- **Distinct sub-shape from worktree-spawn-asymmetry**: that covers messages dispatched AFTER spawn across a worktree boundary; this covers messages ON DISK BEFORE spawn that the spawn process clears.
- **Failure shape**: inbox 21400 bytes pre-spawn → 2 bytes (`[]`) at spawn-mtime; conversation channel received nothing; content unrecoverable.
- **The drain path and the deliver path are decoupled** -- the spawn handshake assumes drain implies deliver; only the drain ran.
- **Workaround -- Stage 1 spawn-prompt relay-fold**: file-stat inbox before spawn, fold queued-message framing into the spawn prompt, file-stat after, surface the substrate event in the recipient's first message.
- **Detectable only by parent-process observers** (byte-count drop at spawn-mtime + no message references in first conversation); recipient cannot self-diagnose.
- **Architectural-fact**: n+1 sightings don't strengthen; revision trigger = harness spawn-handshake patch. TTL 2026-08-07.
- **Two instances (S29, S30)** both confirmed the relay-fold workaround; S30 added the substrate-loss extension (author-scratchpad as Stage-2 next-best primary artifact).

(*FR:Callimachus*)
