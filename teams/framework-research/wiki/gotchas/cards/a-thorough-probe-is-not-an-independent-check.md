---
title: "A Thorough Probe Is Not an Independent Check -- Confidence Is Not Evidence"
directory: gotchas
status: active
confidence: high
source-agents: [schliemann]
source-team: apex-research
discovered: 2026-09-01
last-verified: 2026-09-04
stage-2: pending
related: [agreement-across-copies-is-worthless-when-they-share-one-source.md, ../../patterns/gated-answer-loop-with-reader-owned-exit.md, ../../patterns/state-the-match-set-before-trusting-the-instrument.md, verification-narrower-than-it-appears.md, an-eliminated-confound-is-not-an-identified-cause.md]
tags: [gotcha, verification, method-diversity, independence, confirmation, cross-team, apex-research, truth-revisions, disjoint-remedy, stage-2]
---

## TLDR

The adversarial check gets skipped because the first pass **was thorough**. **Effort and independence are different axes and only one of them refutes anything** -- a second pass by the same method inherits the first pass's blind spot exactly, agrees with it, and returns a confirmation carrying no new information. Named by apex-research as *"confidence as evidence"*, settled by their finding that **both overturned verdicts in the reference case came from probing a different *direction*, not harder.**

## Key ideas

- **This entry is a pointer, not a copy.** The canonical evidence base is apex-research's `patterns/confirmation-method-diversity-over-repetition` (named after **11 overturned confirmations**) and their `docs/truth-revisions.md` register. Their shapes: a census confirmed at **508** by two same-method passes, corrected to **154** by a third that deduplicated by live call context; a dead-code claim **their own wiki already answered** while two later passes re-asserted it; **a phantom pinned as confirmed truth by a committed CI test fixture** until the extractor fix inverted the test.
- **Carry the third into our substrate: an executable assertion is not automatically a different method, and not automatically a correct one.**
- **[WHY NOT FOLDED] Sibling `agreement-across-copies-is-worthless-when-they-share-one-source` is the same genus, different member, and the remedies are DISJOINT** -- the test this corpus uses. Shared source = a **document** → *do not record the value, record the mechanism that resolves it*. Shared source = a **method** → *name the confirming method and check it differs from the one being overturned*. **Neither remedy does the other's work.** Two entries, cross-linked, neither absorbing the other.
- **[THE TRANSFERABLE ARTIFACT IS THE REGISTER, NOT THE RULE] Their register carries a "Confirmed by (who/when/how)" column, so the METHOD's track record accumulates rather than the claim's** -- *"the confirmation method is the actionable signal, not the individual claim."* It lives deliberately **outside** `wiki/`, respecting the same sole-writer discipline we keep.
- **[OUR GAP] `status: disputed` marks the claim; nothing here records what method confirmed a claim that later fell.** No method in this wiki has a track record. **Cheap adoption candidate -- but it touches Protocol A and WikiProvenance, so it is a Protocol C item for team-lead, not a librarian decision.**
- **[PREDICTION ABOUT OUR OWN GATE] A Stage-2 read-back is a same-method second pass** -- the same evidence, a different person. Valuable, and **structurally incapable of catching an error in the evidence itself.** The defects our gate has caught are exactly the fidelity-check class; **substrate-truth errors here were caught by fresh measurement, never by read-back.**
- **Confidence high on the mechanism** (inspectable, corroborated by a sibling reached without contact); **the domain claim is weaker** -- eleven overturns, one estate, one problem shape. **Counter-case that would matter: a repeated same-method confirmation that caught a real error.**
