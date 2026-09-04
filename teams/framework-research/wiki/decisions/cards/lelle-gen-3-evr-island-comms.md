---
title: "Codename \"Lelle\" -- the Gen-3 Inter-Team Comms Method for the EVR Island"
directory: decisions
status: active
confidence: high
source-agents: [team-lead]
source-team: framework-research
discovered: 2026-09-04
last-verified: 2026-09-04
stage-2: pending
related: [two-islands-by-design-hub-topology-follows-network-boundary.md, stationmaster-post-office-model.md, ../../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md, ../../gotchas/precondition-without-an-owner-is-no-precondition.md, ../../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md, ../../patterns/named-concepts-beat-descriptive-phrases.md]
tags: [decision, codename, lelle, inter-team-comms, gen-3, evr-island, stationmaster, hubsignal, gh-116, gh-107, po-ruling, naming]
---

## TLDR

**PO ruling 2026-09-04 (S73): the gen-3 inter-team comms method for the EVR island -- and its hub instance -- is named "Lelle"**, over **Tapa** and **Koidula**. **The rationale is disambiguation, not aesthetics:** "the hub" resolves to the stationmaster software, the prod-llm instance, or the sagres instance, and this wiki already carries that defect twice. **Docs and messages now say *Lelle* when the gen-3 method or its instance is meant.** Ledger: [#116](https://github.com/mitselek/ai-teams/issues/116). Spec: Herald, `designs/new/lelle/spec.md`. Implementation: Brunel / Hopper / Volta. Gates: PO.

## Key ideas

- **Lineage:** gen 1 **ghost-bridge** (v1/v2 daemons, retired -- its redelivery defect is the one the hub was built against) → gen 2 **stationmaster post-office contract v1.0.0**, EVR instance `prod-llm` `sm@10.100.136.162:2222` → gen 3 **Lelle**. **Sagres (`sm@100.102.133.125:2222`) is the personal island and out of scope** -- Lelle is scoped to one of the two mail networks, not both. Island: framework-research, apex-research, Pepys, Paunvere and others.
- **Design source is Discussion #107** (2026-08-13): a workflow-level `hubSignal()` that sends through the hub, **parks the WORKFLOW rather than the session**, resumes with the payload, and **fires the peer-escalation disclaimer once at the boundary instead of every hop.** Read in full at filing; the submission's summary is faithful. **Its four open questions are the spec's inherited agenda** (slot hold vs release · timeout semantics · any/all across teams · grant-model constraints).
- **[THE FINDING, verified not relayed] #107 sat 22 days with ZERO comments and ZERO repo mentions; #111 the same for 5 days and still open.** Both arrived while #108 held the comms lane; **neither was assigned, neither got an issue.** Method stated: `gh api .../discussions` for counts, `grep -rniE` over the FR tree for mentions. > **A proposal filed as a Discussion with no owner and no issue produces no work and no objection. It does not fail -- it never starts, and nothing notices.**
- **[A MEASUREMENT CAUGHT CHANGING UNDER THE MEASURER] #107 read 0 comments early in the session and 1 twenty minutes later** -- team-lead's pointer landed between. **So "zero comments" is true only of a window with two ends, and both ends are stated rather than left implicit.** `verification-certifies-a-moment-not-a-session`, observed live on the claim being filed.
- **[GENUS RULING] Near-instance of `precondition-without-an-owner-is-no-precondition`, cross-linked and deliberately NOT counted.** **A precondition is a control that fails to fire when its condition comes true -- there is a moment something should have happened. A proposal has no triggering condition; it just sits.** Remedies differ: *an owner and a moment to evaluate* versus *a routing decision -- become an issue, or be declined on the record*. **Promotion condition written: a third instance where an input-to-work artifact was filed in a venue with no assignment step AND the cost is demonstrable.** n=2 today is **one circumstance sampled twice, not two sightings.**
- **[RAISED, NOT DISPUTED] The ruling assigns one token to two things -- the method AND its instance** -- which is the same shape as the ambiguity it fixes. **Not an objection:** one island with one instance makes the readings coincide today. **Recorded because the coincidence is contingent** -- a second gen-3 instance would give *Lelle* the same *which one?* problem. **Offered as a one-sentence spec question for Herald, not a wiki ruling.**
- **[COLLISION FOUND AT FILING, offered without inference] *Koidula*, a rejected alternative, is ALREADY an agent persona name** in 11 repo files (`designs/deployed/esl-legal/`, `designs/new/esl-suvekool/` -- a prompt, a roster entry, common-prompt references). **Whether the PO knew is not established and is not guessed.** Narrow relevance: the codename exists to remove an ambiguity, and that alternative was already bound to something else in the same repo. **Tapa and Lelle appear nowhere but today's records.**
- **Name origin:** a historic Estonian railway junction where the Pärnu and Viljandi lines split, station closed, chosen knowing that -- **recorded as the PO's stated rationale, not as verified railway history.**
- **Authoritative for the naming decision and rationale ONLY.** Contract, mechanism and the four questions belong to the spec and #116 -- **a pointer, not a copy**, per the Decisions Boundary.
- **stage-2 PENDING -- NOT author-is-filer**, though submitted as such: **the decision's author is the PO, the filer is the librarian, and team-lead is a witness relaying it.** Filed-on-behalf, fail-closed. **Read-back owed from team-lead; a PO confirmation would be stronger** and is what would settle the one-token and collision items.
