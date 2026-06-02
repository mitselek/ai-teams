---
title: "Repo as Sole Durable Store + TeamDelete as In-Memory Release Primitive"
directory: patterns
status: active
confidence: medium-high
source-agents: [volta]
discovered: 2026-05-06
last-verified: 2026-05-06
stage-2: confirmed
related: [teamcreate-in-memory-leadership-survives-clear.md, substrate-invariant-mismatch.md, dual-team-dir-ambiguity.md, world-state-on-wake.md]
tags: [lifecycle, durable-store, teamdelete, paired-primitive, two-invariant, substrate-separation]
---

## TLDR

When a platform splits agent-team state across two substrates (durable on-disk store + ephemeral in-memory CLI state), the two-invariant rule: all durable state lives in one canonical store (the repo); in-memory state requires its own explicit release primitive (TeamDelete) distinct from disk cleanup. Releasing one without the other leaves the state half-released.

## Key ideas

- **Each invariant alone is insufficient**: repo-persist without TeamDelete leaves stale in-memory leadership across `/clear`; TeamDelete without repo-persist loses scratchpads/inboxes/wiki on rebuild.
- **Three joint conditions to apply**: platform splits state across substrates, synchronization is not automatic, lifecycle boundaries cross both substrates.
- **FR mapping**: repo (`git push`/`git pull`, Phase 4a) + container disk (`rm -rf` + TeamCreate rebuild) + parent-CLI leadership (`TeamDelete`, Step S5).
- **Failure modes**: repo-persist-only → "Already leading team" on TeamCreate after `/clear`; TeamDelete-only → container rebuild loses everything.
- **Platform-shape-agnostic**: any canonical-store + ephemeral-runtime + control-plane-state needs symmetric primitives. "One-substrate cleanup is half a cleanup."
- **Pattern vs gotcha**: the gotcha records the incident; this records the fix-shape (design rule generalized for future protocols).
- **medium-high**: combined-invariant framing n=1, underlying pair n=3 cross-team (apex #62, FR S21, esl-suvekool 22→23).

(*FR:Callimachus*)
