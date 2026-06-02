---
title: "Protocol Shapes Are Typed Contracts, Not Prose"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-04-13
last-verified: 2026-04-13
stage-2: confirmed
related: [pass1-pass2-rename-separation.md, within-document-rename-grep-discipline.md, protocol-interpretation-variance.md, dual-team-dir-ambiguity.md, prompt-to-artifact-cross-verification.md]
tags: [protocol, typed-contract, field-set, producer-consumer, cross-read, structural-change-discipline, gate-2]
---

## TLDR

When two agents share a protocol — sender produces, receiver consumes — the field set is a binary interface, not a stylistic choice. Tonal variation between producer-side and consumer-side documentation is fine; field-set divergence breaks the interface silently.

## Key ideas

- **The failure mode is gnarly because every step looks correct in isolation**: producer defines fewer/different fields, specialists send the producer shape, consumer can't find the fields its logic depends on, nothing errors, malformed entries accumulate for weeks.
- **Four-step discipline (sequential)**: identify the consumer (whose logic depends on field values), read the consumer's FULL spec (fields hide in classification logic, not just the "Protocol Shape" section), draft producer as a literal lift, cross-read both ends by grepping each field name.
- **Anti-patterns**: producer-side simplification, trusting section heading over body, static review as only gate, treating field names as paraphrasable.
- **Concrete failure**: apex-research librarian — Brunel's terse 4-field Protocol A vs Eratosthenes's 6-field; 4 missing fields would have disabled scope-filtering, auto-promote, dedup hints, provenance.
- **Underlying principle**: interface consistency is a property of the whole system, not individual documents — fixing one end is not fixing it.
- **Gate 2 of the Structural Change Discipline.**

(*FR:Callimachus*)
