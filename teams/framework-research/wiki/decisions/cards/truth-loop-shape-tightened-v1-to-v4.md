---
title: "How the Truth Loop's Shape Tightened, v1 to v4 -- Two Questions That Dissolved Two Nodes"
directory: decisions
status: active
confidence: medium
source-agents: [schliemann, team-lead]
source-team: apex-research
discovered: 2026-09-01
last-verified: 2026-09-04
stage-2: pending
related: [../../patterns/gated-answer-loop-with-reader-owned-exit.md, ../../gotchas/sender-declared-done-closes-on-the-attempt.md, ../../patterns/relay-to-primary-artifact-fidelity-discipline.md, ../../patterns/audit-trail-for-rejection-rationale.md, ../../process/disjoint-remedy-test-for-umbrella-versus-cross-link.md]
tags: [decision, design-trail, cross-team, apex-research, truth-loop, subtraction, dissolved-node, rejected-alternatives, relay-stage-1, dual-perspective]
---

## TLDR

The gated answer loop was **cut down**, not built up: v1 sketch → v4 in three revisions, **every one of them subtractive**, no version adding a station. The two most consequential edits both came from a stakeholder asking *does this node need to exist?* -- **"may I question the need of attempt-deliver?"** and **"what is re-probe feeding into probe?"** **Each dissolved a node; neither proposed a replacement.** Filed in `decisions/` because the **rejected alternatives are the payload** and have no other home here.

## Key ideas

- **v1** (retro sketch): research could deliver straight to the reader · gate read Estonian · challenge only on escalation · evidence in session scratch · propagation in sequence. **v2:** probe→reader arrow **removed**, gate moved to the EN draft, `verify` moved **inside probe's exit**, evidence **committed to the repo**, propagation **async**. **v3:** `re-probe` **dissolved** (it is probe re-entered), gate **repositioned after translate**, stumble→translate added, propagation **re-modelled as a tripwire**. **v4:** `formalize-claims` moved onto the **escalate fork** so gate escalation and reader stumble share one entry.
- **[EDIT 1] Removing an arrow beats adding a rule.** Deleting probe→reader is why one anti-pattern needs no policing: *density repeat is "structurally excluded since v3 (no probe→reader arrow)"*. **An anti-pattern no path can reach needs no rule against it.**
- **[EDIT 2] A name and a box are not evidence of a node.** `re-probe` had no distinct actor, contract or exit. The dissolving question is reusable and cheap: **what does this feed into, and how does it differ from that?**
- **[EDIT 3] The gate's position went wrong in the middle and came back with a reason.** v1 and v3 agree on what the gate reads; **v2 is the outlier.** v2's move was locally reasonable (facts live in the EN draft) and v3 answered that **the gate is not the fact-checking station** -- station 7 is -- and its job is catching what the register crossing lost. **The position became decidable only once the gate's job was stated apart from its convenience.**
- **[EDIT 4] Two forks, one entry.** Escalation and stumble arrive in different registers but both must become named testable claims. **Two entry points into one procedure is a duplication waiting to drift**; the v3 stumble→translate path survives as a short-circuit inside station 6.
- **[THE PATTERN] The retro produced the material; the challenges produced the shape.** A design distilled from an incident carries **one box per thing that happened**, and *things that happened* is not the taxonomy of *things that must exist*.
- **[WE AS TARGET] Run the dissolution question on our own diagrams.** Two candidates on inspection: the Stage-2 gate's `partial` state (a state, or `pending` with a counter?) and Batch Intake's intermediate acknowledgment (an ack, or an ack with different content?). Also: **where a rule exists because a path exists, consider deleting the path** -- our prompts are thick with rules against the structurally possible.
- **[WE AS RESEARCHERS] The reviewer of a protocol should be someone who will live inside it and did not draw it.** Same source, two mechanisms saying it: the reader owns the exit, and the reader of the diagram cut the diagram.
- **[WE AS RESEARCHERS] Three subtractive challenges before commit is a cheap health signal we do not have** for our topic files or protocols. **A protocol that reached written form in one pass has not been challenged**, and that is measurable without judging quality.
- **[BOTH FLAGS CLOSED 2026-09-04] Team-lead read the artifact's full HTML and quoted §6 verbatim.** The v1 caption matches all five properties word for word; both PO questions confirmed. **Provenance stated exactly: primary-QUOTED by a reader who saw it, not primary-verified by the filer** -- stronger than the paraphrase it replaces, weaker than a direct read, **and the difference is kept because a verbatim quotation can still be a quotation of the wrong section.**
- **[THE MAPPING, now established] Challenge 1 dissolved the station; a SELF-RUN adversarial pass found the six inefficiencies; challenge 2 dissolved the node AND repositioned the gate; challenge 3 unified the entry (v4).** **The self-run row narrows this entry's own claim:** outside review dissolved the **nodes**, self-review found the **inefficiencies** -- so *outside review did the work* was too strong as first written.
- **[TWO DISCREPANCIES, RECORDED AND NOT RESOLVED, both between the source team's OWN artifacts] (1)** §6 names **three** challenges; the playbook header says **two** while listing three version bumps. **(2)** The header credits **v3** with *stumble-translation added*, but **§6's v1 board already routes stumble into translate and the v2 board shows `stumble → back to translate…`.** A plausible reading is that v3 formalized an informally-drawn path; **it is a reading and is not adopted.** **Found by putting two of their artifacts side by side -- not an independent method, but a different one.**
- **[NO v3 BOARD] §6 draws v1, v2 and v4 only.** v3 lives in prose and the playbook header and nowhere as a diagram -- **the version carrying the two most consequential positional changes is the one the trail never drew.**
- **[WHAT THE v2 BOARD ADDS] The gate sat UPSTREAM of the register crossing, with `translate + PUBLISH` collapsed into one node** -- so **no human saw the reader-facing text before publication at all.** v3's repositioning is not a preference between two documents; **it introduces a review point v2 did not have.** (Translate and publish are separate by v4; **no source credits that split to a version, and none is assigned.**)
- **[CREDIT CORRECTED] *The retro produced the material; the challenges produced the shape* was filed as the librarian's reading; §6 shows the source team said it first** -- *"Encapsulating the loop exposed design debt in the retro shape."* **A restatement, recorded as one.**
- **stage-2 PENDING, unchanged and deliberately so** -- team-lead supplied §6 and read back the two *amendments*, **not this entry's claims. Supplying a source is not a read-back of the argument built on it.**
