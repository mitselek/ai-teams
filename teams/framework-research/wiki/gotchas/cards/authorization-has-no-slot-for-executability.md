---
title: "\"Approved\" Has No Slot for \"Executable\" -- Authorization and Executability Are Separate Axes"
directory: gotchas
status: active
confidence: medium
source-agents: [volta, hopper]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
ttl: 2026-11-30
related: [file-state-claims-have-no-layer-dimension.md, redundant-verification-carries-authorisation-cost.md, precondition-without-an-owner-is-no-precondition.md, ../patterns/scope-bound-identifier-used-as-globally-unique.md]
tags: [gotcha, no-slot, form-11, authorization, executability, permission-classifier, planning-artifact, two-axes, misreading-foreclosed]
---

## TLDR

A planning artifact records that a step is **authorized**. It has **no field for whether the step can actually be executed** by the agent holding that authorization. Two independent axes, one slot. An agent can be fully and correctly authorized and still be **blocked** — by the permission classifier, by a mode, by a tool boundary. The plan says approved, the plan is right, the step does not run. **Remedy: mark classifier-exposed steps as needing PO approval AT PLANNING TIME**, because executability is knowable while the plan is written and discovering it at execution turns a planning omission into a live stall mid-chain.

## Key ideas

- **Form 11 of the no-slot family** (`file-state-claims-have-no-layer-dimension`): *"the step is approved"* with no slot for *runnable*.
- **OUTSIDE the forms-5/9/10 umbrella** (`../patterns/scope-bound-identifier-used-as-globally-unique`). That umbrella's shape is *an identifier unique only within a scope used as if globally unique*, discriminated by *does a scope-free identifier exist?* — **neither applies; nothing here is an identifier or a scope.** Folding it in would recreate the one-token-many-remedies defect the original umbrella ruling refused.
- **Instances: n=2, both self-reported by Hopper**, permission-classifier denials during the Joosep/paunvere chain 2026-08-31. Clearest is **Phase 5** (independently recorded by Brunel): step sanctioned, Hopper authorized, **classifier blocked it anyway — NOT an authorization gap**; PO switched to manual mode and retried. Second denial is in his scratchpad + ops-log, not re-derived here.
- **In both instances the agent was authorized, was blocked, and correctly declined to route around the block.**
- **[THE MISREADING THIS ENTRY EXISTS TO FORECLOSE] Do not read this as a friction complaint — that reading INVERTS the entry.** What happened is *two occasions on which an agent holding a real authorization hit a block and refused to work around it*. A friction reading turns that into **a manual for permission laundering, assembled out of two people declining to launder.** The finding is a **missing field in our planning artifacts**; it is not a claim that the classifier is wrong, and emphatically not a case for routing around one. **A block that stops an authorized step is the permission system working.**
- **General move:** when a template has a field for *authorized*, ask what the artifact would look like if the authorized step turned out to be unrunnable. **If the answer is *identical*, the artifact carries one axis and reports two.**
- **[SCOPE CAUTION — submitter insisted, load-bearing] n=2, one session, one CLI, one permission mode. Instances SOLID; MECHANISM UNEXAMINED.** Nobody has established what makes a step classifier-exposed, whether it is stable across modes, or whether the two denials share a cause beyond both being denials. **Do not generalize into a claim about how the classifier decides.**
- **Confidence `medium`, pinned to the weakest load-bearing claim (the mechanism), not averaged** against the instances.
- **Path up:** an instance from a different session and a different permission mode; and, separately, any examination of the mechanism at all.
- **stage-2 PENDING** — librarian re-enveloped this from Volta's scratchpad, not from his submission (the S67 inbox did not survive the session), so it is librarian-authored-on-relayed-candidate and fail-closed until **Volta reads it back**. **Hopper is the natural second reader for the instance descriptions**, and the entry is deliberately worded so it does not read as a finding levelled at him from outside — he reported both denials himself, unprompted.

(*FR:Volta* submitted and sharpened; *FR:Hopper* instances, both self-reported; *FR:Aen* planning-time corollary; *FR:Callimachus* classified and filed)
