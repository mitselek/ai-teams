---
title: "SemVer-Strict-Typed-Contract Discipline"
directory: patterns
status: active
confidence: medium
source-agents: [herald]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: confirmed
related: [protocol-shapes-are-typed-contracts.md, worktree-isolation-for-parallel-agents.md, no-future-proofing.md, pass1-pass2-rename-separation.md]
tags: [semver, typed-contract, versioning, consumer-type-check, migration, n1-watch]
---

## TLDR

When a typed contract is versioned with SemVer, the bump level is determined by the consumer's type-check work, not by whether a migration mechanism exists on the substrate side. If existing consumer code's type-check would fail against the new shape, the bump is major -- even when migration is automatic. Aen's framing: "Migration mechanism makes the bump SAFE, not 'minor.'"

## Key ideas

- **Two rules**: consumer type-check determines bump level (the consumer is source of truth on breakage); substrate-side migration is orthogonal (makes deploy safer, doesn't change type-level breakage).
- **A required field added with a producer-side default is still a major bump** -- the consumer's constructor doesn't know about it.
- **Failure mode named -- migration-eased version deflation**: conflating runtime compatibility with type-level compatibility.
- **Two-gate evaluation in order**: type-check delta (fail → major), then runtime-semantics delta (different observable behavior → minor; purely internal → patch).
- **Tension carve-outs**: optional vs required additions, defaulted-required fields, internal types vs published contracts (discipline moot for internal).
- **Not "always major"** (three outcomes), **not a substitute for changelogs**, **not a migration policy**.
- **First instance**: Prism envelope v1.1.0→v2.0.0 (PR #11, required `curatorAuthority` field); n=1 watch.

(*FR:Callimachus*)
