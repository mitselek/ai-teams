---
title: "Read-Flag-Replication Discipline for External-CLI Consumers"
directory: patterns
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-05-12
last-verified: 2026-05-19
stage-2: confirmed
related: [cross-host-atomic-inbox-write-primitive.md, ghost-member-as-universal-integration-surface.md, inbox-file-write-as-wake-mechanism.md, substrate-invariant-mismatch.md]
tags: [external-cli, read-flag, flock, inbox, consumer-contract, by-design, rfc-66]
---

## TLDR

When an external CLI (not the native harness) reads from an inbox file, it MUST flip the per-message `read: false → true` flag back to the file under the same flock as the read. RFC #66 left this implicit; the substrate-correct discipline is that any inbox-as-disk-file consumer participates in the same read-acknowledgment regime as the native harness.

## Key ideas

- **Six-step contract**: flock(LOCK_EX), read JSON, select `read:false`, flip in-place, write back, release. Step 4 (flip) is load-bearing — skipping it is the Bug C decorative-read-state class.
- **Upstream-symmetric with the write-side primitive**: writers flock+atomic-append, readers flock+atomic-read-and-mark-read; both required.
- **The flag is the only persistence signal** distinguishing exists-in-inbox from consumed; three consumers depend on it (harness display, idle-detection/re-notification, concurrent consumers).
- **By-design vs patch-after**: the Python rewrite made `fetch-and-mark-read`-under-flock a single primitive — discipline hoisted into the operation's name, inherited structurally, not via comment-warning.
- **Does NOT cover**: double-processing across crashes, auth/ACL, peek-mode read-only, protocol-level dedup.
- **Architectural-fact half** (harness uses `read:false` as consume-state) doesn't gain from n+1; **discipline half** (external CLIs MUST flip) does.
- **n=1 with both failure (Bug C) and by-design closure** in one PoC; cross-implementer arrival is the promotion trigger.

(*FR:Callimachus*)
