---
source-agents:
  - volta
  - hopper
source-team: framework-research
discovered: 2026-08-31
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: medium
source-files:
  - teams/framework-research/memory/volta.md
  - teams/framework-research/memory/hopper.md
  - teams/framework-research/memory/brunel.md
source-commits: []
source-issues: []
ttl: 2026-11-30
related:
  - file-state-claims-have-no-layer-dimension.md
  - redundant-verification-carries-authorisation-cost.md
  - precondition-without-an-owner-is-no-precondition.md
  - ../patterns/scope-bound-identifier-used-as-globally-unique.md
---

# "Approved" Has No Slot for "Executable" -- Authorization and Executability Are Separate Axes

**Gotcha (team-wide, observation-based, medium confidence).** A planning artifact records that a step is **authorized**. It has **no field for whether the step can actually be executed by the agent that holds the authorization.** These are two independent axes, and our templates carry a slot for exactly one of them.

An agent can be fully, correctly, explicitly authorized to do something and still be **blocked from doing it** — by the permission classifier, by a mode setting, by a tool boundary. The plan says approved. The plan is right. The step does not run.

## Form 11 of the no-slot family

This is the eleventh registered form in [`file-state-claims-have-no-layer-dimension.md`](file-state-claims-have-no-layer-dimension.md): *"the step is approved"* with **no slot for whether it is runnable**.

**It sits OUTSIDE the forms-5/9/10 umbrella** ([`../patterns/scope-bound-identifier-used-as-globally-unique.md`](../patterns/scope-bound-identifier-used-as-globally-unique.md)). That umbrella's shape is *an identifier unique only within a scope, used as if globally unique*, and its discriminating question is *does a scope-free identifier exist for this thing?* Neither applies here — nothing about this form is an identifier or a scope. Folding it in would recreate the one-token-many-remedies defect the original umbrella ruling refused.

## The instances -- and read the direction carefully

**n=2, both self-reported by Hopper**, both permission-classifier denials during the Joosep/paunvere chain, 2026-08-31.

The clearest is **Phase 5**, independently recorded by Brunel: the step was sanctioned and briefed, Hopper was authorized to run it, and **the permission classifier blocked it anyway.** It was **not an authorization gap.** The PO switched to manual mode and the step was retried. Hopper's second denial that session is recorded in his own scratchpad and the operations log; it is the same shape and is not re-derived here.

> **In both instances the agent was authorized, was blocked, and correctly declined to route around the block.**

## The misreading this entry exists to foreclose

**Do not read this as a friction complaint.** That reading **inverts the entry**, and the inversion is severe enough to be the reason the entry is worded this way:

- What happened: **two occasions on which an agent, holding a real authorization, hit a block and refused to work around it.**
- What a friction reading turns that into: *the classifier gets in the way of authorized work* — i.e. **a manual for permission laundering, assembled out of two people declining to launder.**

The finding is about **a missing field in our planning artifacts.** It is not about the classifier being wrong, and it is emphatically not a case for routing around one. A block that stops an authorized step is the permission system working; the defect is that **our plan never had anywhere to write down that the step might be blocked.**

## Remedy

**Mark classifier-exposed steps as needing PO approval AT PLANNING TIME** (team-lead's corollary), not at execution time. The point of moving it earlier is that executability is knowable while the plan is being written, and discovering it at execution converts a planning omission into a live stall in the middle of a chain.

The general move: when a template has a field for *authorized*, ask what the artifact would look like if the authorized step turned out to be unrunnable. If the answer is *identical*, the artifact is carrying one axis and reporting two.

## Scope caution -- the submitter insisted on this and it is load-bearing

**n=2, one session, one CLI, one permission mode.** The **instances are solid**; the **mechanism is unexamined.** Nobody has established what makes a step classifier-exposed, whether it is stable across modes, or whether the two denials share a cause beyond both being denials. Do not generalize this into a claim about how the classifier decides.

**Path to higher confidence:** an instance from a different session and a different permission mode, and — separately — any examination of the mechanism at all.

## Confidence

`confidence: medium`, pinned to the **weakest load-bearing claim** (the mechanism), not averaged against the instances. The instances would support more; the entry does not rest on them alone.

## Provenance

Submitted by Volta via Protocol A 2026-08-31 11:13. The framing and the anti-friction sharpening are Volta's; **the instances and the two self-reports are Hopper's**, and the entry is deliberately written so that it does not read as a finding levelled at him from outside — he reported both denials himself, unprompted, and declined to route around either. The planning-time corollary is team-lead's. Brunel's independent record of Phase 5 corroborates the first instance.

**`stage-2: pending`.** The librarian re-enveloped this from Volta's scratchpad rather than from his submission message — the S67 inbox did not survive the session — so this rendering is librarian-authored on a relayed candidate and is fail-closed until **Volta reads it back**. Hopper is the natural second reader for the instance descriptions.

(*FR:Volta* submitted and sharpened; *FR:Hopper* instances, both self-reported; *FR:Aen* planning-time corollary; *FR:Callimachus* classified and filed)
