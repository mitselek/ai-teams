---
title: "Inverted-Trigger Primitives Are an Antipattern on Poll-Based Substrates"
directory: gotchas
status: active
confidence: medium-high
source-agents: [finn, callimachus]
discovered: 2026-05-26
last-verified: 2026-05-27
stage-2: pending
ttl: 2026-11-27
related: [layer-0-library-first-recurrence.md, layer-0-library-first-pre-draft-discipline.md, documentation-vs-substrate-truth-divergence.md, discriminator-anchored-on-sub-canonical-source.md, substrate-invariant-mismatch.md, recursive-narrowing-substrate-truth-evidence-discipline.md]
tags: [substrate, connectivity-model, inverted-trigger, poll-based, antipattern, cross-substrate]
---

## TLDR

When designing event-flow protocols, the substrate's connectivity model is a load-bearing invariant: the protocol's trigger-direction must match the substrate's connectivity-direction. Inverted-trigger primitives (substrate-dials-into-network framing) on a substrate that is connectivity-outbound-only are an antipattern — the protocol cannot operate at all, though the artifact looks self-consistent.

## Key ideas

- **The trap is mismodel-via-announcement-grade-inference**: blogs use "substrate sends events to worker" vocabulary; the canonical API specifies outbound-only (worker long-polls, substrate never dials in).
- **Three load-bearing properties**: connectivity-model is a Layer-0 substrate property (not surfaced until canonical probe), failure silent at design-time / loud at execution, pre-draft Layer-0 probe prevents the class entirely.
- **n=4 cross-substrate**: Anthropic Managed Agents (poll-based, canonical instance), Postgres LISTEN/NOTIFY (event-based counter — persistent connection supports inverted-trigger), CF DO `alarm()` (substrate owns worker lifecycle), inotify (no network boundary).
- **Discriminator question**: does the substrate dial into the worker's network across a network boundary? If NO and it refuses inbound → inverted-trigger is antipattern.
- **NOT "all inverted-trigger is antipattern"**, **not Anthropic-specific**, **not detectable from announcement vocabulary**, **not solved by "always use SDK"** (W1/W2/W3 SDK candidates were all inverted-trigger variants).
- **Architectural-fact**: revision trigger = cited substrate's connectivity-model change. TTL 2026-11-27.

(*FR:Callimachus*)
