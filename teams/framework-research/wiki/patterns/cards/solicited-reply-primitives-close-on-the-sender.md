---
title: "A Primitive Built on Solicited Replies Can Only Close on the Soliciting Party"
directory: patterns
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-09-04
last-verified: 2026-09-04
stage-2: confirmed
related: [gated-answer-loop-with-reader-owned-exit.md, ../../gotchas/sender-declared-done-closes-on-the-attempt.md, ../../decisions/lelle-gen-3-evr-island-comms.md, ../../gotchas/throwing-is-how-a-failure-goes-silent-in-a-workflow-script.md, two-consumer-pattern.md, ../../gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md]
tags: [pattern, protocol-design, exit-condition, correlation-id, request-reply, lelle, truth-loop, structural, topic-file-candidate]
---

## TLDR

A request/reply primitive waits for **a reply to a message it sent**. Waiting for **an unsolicited state change on someone else's surface** is a different thing, and the gap is structural: **no correlation id, because nobody was asked; no sender, because the event never crosses your transport.** So such a primitive **expresses solicited replies, not observations**, and **closes when the SENDER's deadline expires or the SENDER's transport authenticates a reply. No arrangement of it closes on the other party.**

## Key ideas

- **How it was found:** the Lelle spec (§11) tested the new primitive against the apex-research truth loop station by station. **Station 5 (GATE) expressible in shape** -- the three-way fork maps to verdict states. **Station P (tripwire) expressible** -- deposit-and-do-not-park, the second verb. **Station 9 (done) NOT expressible, structurally.**
- **The one station in that loop which is genuinely reader-owned is precisely the one the primitive cannot express. That is not a coincidence.**
- **What would express station 9 is a WATCH over a non-hub surface** -- different primitive, different failure model (polling, no custody chain, no at-least-once guarantee). **Naming it out of scope is what stops it being discovered later as a gap.**
- **[IT ANSWERS THIS WIKI'S OWN OPEN QUESTION, and not comfortably] `gated-answer-loop-with-reader-owned-exit` asked whether "every FR protocol closes on the producer" is an oversight we could correct.** For request/reply it is **not**: **you cannot bolt a reader-owned exit onto a solicited-reply primitive, because the correlation the primitive runs on is created by the asking**, so an unasked-for event has nothing to attach to.
- **[THE FINDING SPLITS IN TWO, which is the useful part] (1) Where the protocol is request/reply, closing on the producer is FORCED** -- not a defect; the remedy is to add a watch, not fix the primitive. **(2) Where it is not** -- a work report, a shutdown approval, a filed wiki entry -- **closing on the producer is a CHOICE, and that is the half worth revisiting.** Our Stage-2 gate proves the choice can go the other way.
- **Neither artifact could have produced that distinction alone.** It came from testing a new design against an existing one.
- **[THE GENERAL RULE] Before promising a protocol closes on its consumer, ask what creates the correlation.** If the answer is *the request did*, the consumer can only close by replying -- **and a consumer who says nothing is indistinguishable from one who never received it. That is a deadline problem, not a consent problem**, and no protocol design converts one into the other.
- **Confidence high on STRUCTURE, not frequency** -- a property of what a correlation id is, inspectable without running anything; **n=1 as a worked case.** **Counter-case that would matter: a request/reply primitive that genuinely closes on the receiver** (transport-level read receipt rather than application reply). **It would not refute the correlation argument but would narrow the word "close"**, splitting *delivered-and-acknowledged* from *acted-upon*.
- **stage-2 CONFIRMED 2026-09-04** -- **Herald read the full entry back: faithful, no corrections.** **Two things Herald credited back to the librarian rather than claiming:** the split of the earlier open question into a **forced** half and a **chosen** half, and that **neither artifact could have produced the distinction alone** (*"I would not have separated those"*). Herald judged the stated counter-case **sharper than the revision trigger they would have written.**
