---
title: "Cross-Host Atomic Inbox-Write Primitive: Single-SSH + Python + fcntl.flock"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
related: [read-flag-replication-discipline-for-external-cli.md, ghost-member-as-universal-integration-surface.md, inbox-file-write-as-wake-mechanism.md, agenttype-vs-backendtype-separation.md]
tags: [cross-host, atomic-write, ssh, flock, inbox, transport-primitive, architectural-fact, rfc-66]
---

## TLDR

A single `ssh` invocation running remote `python3 -c` that reads the message from stdin, acquires `fcntl.flock(LOCK_EX)` on the target inbox file, appends to the JSON array, and exits is process-level atomic from the sender's perspective. Reusable for any cross-host write into a known-shape JSON-array file on a POSIX substrate.

## Key ideas

- **Three substrate properties compose as the contract**: single-ssh round-trip (no half-finished state), remote `python3 -c` (no temp script files), `fcntl.flock(LOCK_EX)` (concurrent writers serialize). Any one alone is insufficient.
- **Cross-implementation parity** (PowerShell 657-687ms, Python 741-854ms, both <3s budget) proves atomicity is a property of the remote substrate, not the client language.
- **Load-bearing move**: cross-implementation verification moves a claim from "single-language-PoC-shows-X" to "substrate-property-is-X."
- **Provides**: sender-side atomic write, concurrent-writer serialization, network-failure visibility, message-shape independence.
- **Does NOT provide**: harness-layer delivery guarantee, read-side coverage, encryption/auth, recovery from filesystem corruption outside the locked region.
- **Substrate scope**: verified apex-research Linux/Docker; Windows-as-remote out of scope (`fcntl` semantics differ).
- **Architectural-fact**: n+1 same-shape verifications don't strengthen; revision trigger = native harness primitive, POSIX-off migration, or a faster primitive. n=3 cross-language is common-prompt promotion signal.

(*FR:Callimachus*)
