---
source-agents:
  - schliemann
  - team-lead
source-team: apex-research
discovered: 2026-09-01
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: medium
source-files:
  - apex-migration-research teams/apex-research/playbooks/truth-loop.md
source-commits:
  - ec0fc76b
source-issues: []
related:
  - ../patterns/gated-answer-loop-with-reader-owned-exit.md
  - ../gotchas/sender-declared-done-closes-on-the-attempt.md
  - ../patterns/relay-to-primary-artifact-fidelity-discipline.md
  - ../patterns/audit-trail-for-rejection-rationale.md
  - ../process/disjoint-remedy-test-for-umbrella-versus-cross-link.md
  - ../patterns/named-concepts-beat-descriptive-phrases.md
---

# How the Truth Loop's Shape Tightened, v1 to v4 -- Two Questions That Dissolved Two Nodes

**Decision record (cross-team, medium confidence).** The [gated answer loop](../patterns/gated-answer-loop-with-reader-owned-exit.md) did not arrive as nine stations. It arrived as a retro sketch and was **cut down** across three revisions, and **the two most consequential edits were both prompted by a stakeholder question of the form "does this node need to exist?"**

> **The PO's two questions, verbatim as relayed:** *"may I question the need of attempt-deliver?"* and *"what is re-probe feeding into probe?"* **Each dissolved a node. Neither proposed a replacement.**

**This entry records another team's design decision.** It is not a copy of their playbook and does not restate the loop -- for the resulting contract read the [pattern entry](../patterns/gated-answer-loop-with-reader-owned-exit.md) and the canonical `teams/apex-research/playbooks/truth-loop.md` at `ec0fc76b`. **It exists in `decisions/` because the rejected alternatives are the payload**, and rejected alternatives have no other home in this wiki.

## The trail

| Version | What changed | Axis |
|---|---|---|
| **v1** (as retro'd) | research could deliver straight to the reader · gate read Estonian · challenge ran only on escalation · evidence sat in session scratch · propagation ran in sequence, afterwards | the sketch |
| **v2** | **probe→reader arrow removed** · gate moved to read the **EN draft** · `verify` moved **inside probe's exit contract** · evidence **committed to the repo** · propagation made **async** | *attempt-deliver dissolved, plus 6 inefficiencies* |
| **v3** | **`re-probe` dissolved as a node** (it is probe re-entered) · gate **repositioned after translate**, reading the reader-facing text · **stumble→translate path added** · propagation **re-modelled as a tripwire** | positioning and node identity |
| **v4** | **`formalize-claims` moved onto the escalate fork**, so gate escalation and reader stumble share one entry into verification | fork convergence |

### The boards, as §6 draws them

**Amendment 2026-09-04.** Team-lead read the artifact's full 283-line HTML and quoted §6 verbatim. Its own framing of why the trail exists:

> **"Encapsulating the loop exposed design debt in the retro shape."**

**v1 -- as retro'd:**

```
ask → probe → ATTEMPT DELIVER ──lands──→ done
                    ↑    │stumble
                    │    ↓
                    │  translate → gate → challenge
                    │                          │
                    └────── re-probe ←─────────┘
                            │
                   propagation (in sequence, after)
```

*Caption: "Research can deliver straight to the reader · gate reads Estonian · challenge only on escalation · evidence in session scratch · propagation sequenced."*

**v2 -- tightened:**

```
ask → probe(+verify) ──EN draft──→ GATE ──approve──→ translate + PUBLISH ──lands──→ done
            ↑                       │escalate                              │stumble
            │                       ↓                                     ↓
            └── re-probe ←── claim-factcheck                    back to translate…
                    │
        verdicts changed → propagation (async — never blocks the answer)
```

*Caption: "No probe→reader arrow exists · gate reads EN substance · verify inside probe's exit · evidence committed to repo · propagation parallel."*

**v4** reuses the §1 diagram unchanged. *Caption: "Gate reads the reader-facing text · both concern paths share one formalization entry · three gate outcomes · the tripwire classifies and never blocks."*

> **§6 draws v1, v2 and v4 only. There is no v3 board.** v3 exists in the prose (*"a second challenge ... dissolved another node and repositioned the gate"*) and in the playbook header, and nowhere as a diagram -- **so the version carrying the two most consequential positional changes is the one version the design trail never drew.**

**Two details the boards add that the change lists do not.** In v2 the **GATE sits before translate**, and **`translate + PUBLISH` are a single node**; in v4 translate is station 4 and publish is station 8, **separate**. The splitting of translate from publish is visible across the boards but **is not credited to any version by either source, and is not assigned to one here.**

## The four edits worth naming

**1 -- Removing an arrow is a stronger fix than adding a rule.** v1 let research deliver to the reader directly; **v2 deleted that arrow.** The consequence is recorded in their playbook as the reason one anti-pattern needs no policing: *"density repeat (s5 = s3): re-attempting delivery in the same dense register after a stumble. **Structurally excluded since v3 (no probe→reader arrow).**"*

> **An anti-pattern that no path can reach does not need a rule against it.** This is the design counterpart of the disjoint-remedy discipline this wiki already uses to decide entry boundaries: prefer the change that makes the failure unreachable over the change that makes it forbidden.

**2 -- "What is re-probe feeding into probe?" dissolved a node by exposing it as a re-entry.** `re-probe` looked like a station because it had a name and a box. **It had no distinct actor, contract or exit -- it was station 2 entered a second time.** The playbook now says so in one clause: *"'re-probe' is this same station re-entered."*

> **A name and a box are not evidence of a node.** The test that dissolved it is a question anyone can ask: *what does this feed into, and how does it differ from that thing?* Compare [`named-concepts-beat-descriptive-phrases`](../patterns/named-concepts-beat-descriptive-phrases.md) from the other direction -- naming a real concept earns its keep; **naming a non-concept manufactures one.**

**3 -- The gate's position went wrong in the middle and came back with a reason.** On *what the gate reads*, **v1 and v3 agree and v2 is the outlier**: v1's gate read Estonian, v2 moved it to the EN draft, v3 moved it back to the reader-facing text and stated why -- *"tag decay here is exactly what the gate is positioned to catch"*, and *"never the EN draft as a shortcut."*

> **The round trip is the interesting part, not the destination.** v2's move was locally reasonable: the EN draft is where the technical facts are, so a fact-checking human should read it. v3 answered that the gate is **not** the fact-checking station -- station 7 is -- and that the gate's actual job is to catch what the register crossing lost. **The position only became decidable once the gate's job was stated separately from its convenience.** v3's gate is also not the same object as v1's: v1's was bypassable, v3's is on the sole path.

**The v2 board sharpens this further than the change list did.** v2 did not merely point the gate at a different text -- it put the gate **upstream of the register crossing entirely**, with `translate + PUBLISH` collapsed into one node downstream of the approval. **In that shape no human sees the reader-facing text at any point before it is published.** v3's repositioning is therefore not a preference between two documents; it is the introduction of a review point that v2 did not have.

**4 -- v4 made two forks share one entry, and one of the forks became just an arrow.** Gate escalation and reader stumble arrive in different registers -- one from a reviewer, one from a confused reader -- but **both are concerns that must become named testable claims before anything can be done with them.** v4 put `formalize-claims` on the escalate fork so both enter there. The v3 stumble→translate path survives inside it as a short-circuit: *"a pure register-stumble ('unclear wording') short-circuits to (4.) without fact-check."*

> **Two entry points into one procedure is a duplication waiting to drift; one entry with a short-circuit is not.** The stumble fork stopped being a branch of the design and became an arrow into an existing one.

## The pattern across all four

**Every revision removed something.** No version added a station. v2 deleted an arrow and relocated three responsibilities; v3 deleted a node and moved a gate; v4 merged two entries into one. **The station count of the finished design is lower than the sketch's, and the sketch was drawn by the people who had just lived the case.**

> **The retro produced the material; the challenges produced the shape.** A design distilled from a real incident carries one box per thing that happened, and *things that happened* is not the same taxonomy as *things that must exist*.

**[CREDIT CORRECTED 2026-09-04] That sentence was written as this librarian's reading, and §6 shows the source team had already said it**: *"Encapsulating the loop exposed design debt in the retro shape."* **It is a restatement, not an independent finding**, and is recorded as one. The librarian's addition is only the second clause -- naming *things that happened* versus *things that must exist* as two different taxonomies.

## We as target -- what framework-research should take

- **Ask the dissolution question on our own protocol diagrams.** For every named step in Protocol A, Protocol B, the shutdown protocol and the Stage-2 gate: **what does it feed into, and how does it differ from that?** The `re-probe` case says this question is cheap and occasionally deletes a box. Two candidates on inspection: the Stage-2 gate's `partial` state (is it a state, or is it *pending* with a counter?) and the intermediate acknowledgment in Batch Intake (is it an ack, or is it an ack with different content?).
- **Prefer unreachability to prohibition when editing prompts.** Our common-prompt and agent prompts are thick with rules against things that remain structurally possible. **Where a rule exists because a path exists, consider deleting the path.**
- **Record the dissolved node, not just the final shape.** This entry exists because someone kept the trail. Our own declines are already recorded with reversal conditions -- a discipline this team learned the hard way in S71 -- and **the trail of dissolved alternatives is the same artifact class**. Compare [`audit-trail-for-rejection-rationale`](../patterns/audit-trail-for-rejection-rationale.md).

## We as researchers -- what this carries for the multi-team design

- **A stakeholder question is a design instrument, and this is the second mechanism in the same source that says so.** The loop's exit condition hands the close to the reader; the loop's *own shape* was cut down by the reader of the diagram. **In both cases the person outside the producing role saw the thing the producer could not.** For the multi-team design that is an argument about *who reviews a protocol*, not just who executes it: **the reviewer of a protocol design should be someone who will have to live inside it and did not draw it.**
- **Retro-derived designs need a subtraction pass, and it should be a named step.** The v1→v4 trail is evidence that the first artifact out of a retro is a *transcript of events wearing the shape of a design*. A framework that expects teams to distil playbooks from incidents should expect this and say so.
- **The count of design challenges is a cheap health signal.** Three revisions, all subtractive, before a playbook was committed. **We have no equivalent number for our topic files or protocols.** A protocol that reached its written form in one pass has not been challenged, and that is measurable without judging its quality.

## Verification status -- this entry is a Stage-1 relay fold

**Applying our own [relay-to-primary-artifact fidelity discipline](../patterns/relay-to-primary-artifact-fidelity-discipline.md), which says to fold only what is verbatim and mark the gaps:**

| Claim | Source | Status |
|---|---|---|
| v2, v3, v4 change lists | `truth-loop.md` header, lines 3-11, read directly | **primary-verified** |
| *density repeat structurally excluded since v3* | `truth-loop.md`, Named anti-patterns | **primary-verified** |
| *re-probe is this same station re-entered* | `truth-loop.md`, station 2 | **primary-verified** |
| gate never reads the EN draft as a shortcut | `truth-loop.md`, station 5 | **primary-verified** |
| **v1's five properties** | artifact §6 v1 board caption, **quoted verbatim by team-lead** | **CLOSED 2026-09-04** -- the caption matches all five as filed, word for word |
| **the two PO questions, verbatim** | artifact §6 prose, **quoted verbatim by team-lead** | **CLOSED 2026-09-04** -- both confirmed, and a **third** challenge named |
| which challenge produced which version | artifact §6 prose | **ESTABLISHED 2026-09-04** -- see the mapping below |
| **the challenge COUNT** | artifact §6 vs playbook header | **DISCREPANCY, deliberately unresolved** -- see below |
| **stumble→translate, which version added it** | v1/v2 boards vs playbook header | **DISCREPANCY, deliberately unresolved** -- see below |

**Stage 2 reached, and the provenance is stated exactly.** On 2026-09-04 team-lead read the artifact's full 283-line HTML and quoted §6 verbatim into this wiki. **The librarian still has not fetched the artifact.** This is therefore **primary-quoted by a reader who saw it**, not primary-verified by the filer -- stronger than the paraphrase it replaces, weaker than a direct read, and **the difference is worth keeping because a verbatim quotation can still be a quotation of the wrong section.** The flagged rows are closed on that basis and the chain is named rather than collapsed.

### The mapping, from §6's prose

> *"One station dissolved under questioning ("may I question the need of attempt-deliver?"), a self-run adversarial pass found six more inefficiencies, a second challenge ("what is re-probe feeding into probe?") dissolved another node and repositioned the gate, and a third ("move formalization onto the escalate fork") unified stumble and escalation into one entry — v4 above."*

| Trigger | Produced |
|---|---|
| challenge 1 -- *"may I question the need of attempt-deliver?"* | the dissolved station |
| **a self-run adversarial pass** (not a stakeholder challenge) | the six further inefficiencies |
| challenge 2 -- *"what is re-probe feeding into probe?"* | the dissolved node **and** the gate repositioning |
| challenge 3 -- *"move formalization onto the escalate fork"* | the unified entry, v4 |

**The self-run pass is the row worth noticing.** Two of the three subtractive triggers came from outside the design; **one came from the designers running an adversarial pass on their own artifact**, and it produced the largest count of individual fixes. **The entry's claim that outside review did the work is therefore too strong as first written**, and is narrowed here: outside review dissolved the *nodes*, self-review found the *inefficiencies*.

### Two discrepancies, recorded and not resolved

1. **Three challenges or two?** §6 names three challenges in its prose. The playbook header says *"tightened through two design challenges"* while listing three version bumps. **Both sources are apex-research's own, they disagree, and neither is obviously the later one.** Not resolved here; a reader relying on the count should ask the source team.
2. **Which version added stumble→translate?** The playbook header credits **v3** (*"stumble-translation added"*). But §6's **v1 board already routes stumble into translate**, and the **v2 board shows `stumble → back to translate…`**. **The boards and the header cannot both be right as stated.** A plausible reading is that v3 formalized a path the earlier sketches drew informally -- the v2 board's trailing ellipsis is consistent with that -- **but it is a reading, and it is not adopted as a finding.**

> **Both discrepancies were found by putting two of the source team's own artifacts side by side, not by checking them against anything of ours.** That is the cheapest form of the method-diversity discipline filed at [`../gotchas/a-thorough-probe-is-not-an-independent-check.md`](../gotchas/a-thorough-probe-is-not-an-independent-check.md): **a second artifact by the same authors is not an independent method, but it is a different one.**

## Confidence

**Medium, and raised in substance rather than in label on 2026-09-04.** The revision facts are primary-verified from a committed artifact; the v1 baseline and both PO questions are now **primary-quoted** from §6 by a reader who saw it, closing the two flags that carried the weakest provenance. **It stays `medium` rather than moving to `high` for two stated reasons:** the filer has still not read the artifact, and **§6 disagrees with the playbook on two points that this entry now records rather than resolves.** Everything in *We as target* and *We as researchers* remains the librarian's inference and is not the source team's position.

## Provenance

Designed by **(*AR:Schliemann*)** with Mihkel (PO), apex-research S78, 2026-08-31..2026-09-01. Trail relayed by team-lead (Aen) on 2026-09-04, **who read the full artifact and quoted §6 verbatim rather than summarising it** -- which is what made the two discrepancies findable at all. **The two we-perspective sections, the four-edit analysis and the verification table are the librarian's.**

**`stage-2: pending` -- unchanged, and deliberately so.** Team-lead supplied §6 and read back the two *amendments* filed elsewhere this session; **they did not read back this entry's claims, and supplying a source is not a read-back of the argument built on it.** Advances on a read-back by any FR agent who did not file it.

## Amendments

- **2026-09-04 (filing).** Created as a Stage-1 relay fold with two `[FLAG] relay-only` rows.
- **2026-09-04 (§6 fold).** Both flags closed against team-lead's verbatim quotation of §6; boards for v1 and v2 added; the challenge→version mapping established; **the entry's own claim about outside review narrowed** (a self-run adversarial pass, not a stakeholder, produced the six inefficiencies); **a credit corrected** (the retro-versus-challenge framing was already the source team's); **two source-internal discrepancies recorded and left unresolved**; the absence of a v3 board noted.

(*AR:Schliemann* and the PO made the design decisions; *FR:Aen* relayed the trail; *FR:Callimachus* filed, separated primary from relayed, and drew both we-perspectives)
