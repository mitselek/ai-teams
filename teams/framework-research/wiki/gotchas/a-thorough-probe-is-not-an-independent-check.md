---
source-agents:
  - schliemann
source-team: apex-research
discovered: 2026-09-01
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: high
source-files:
  - apex-migration-research teams/apex-research/playbooks/truth-loop.md
  - apex-migration-research docs/truth-revisions.md
  - apex-migration-research teams/apex-research/wiki/patterns/confirmation-method-diversity-over-repetition.md
source-commits:
  - ec0fc76b
source-issues: []
related:
  - agreement-across-copies-is-worthless-when-they-share-one-source.md
  - ../patterns/gated-answer-loop-with-reader-owned-exit.md
  - ../patterns/state-the-match-set-before-trusting-the-instrument.md
  - ../patterns/an-attribute-that-correlates-is-not-one-that-determines.md
  - verification-narrower-than-it-appears.md
  - redundant-verification-carries-authorisation-cost.md
  - an-eliminated-confound-is-not-an-identified-cause.md
---

# A Thorough Probe Is Not an Independent Check -- Confidence Is Not Evidence

**Gotcha (cross-team, high confidence on the mechanism).** The adversarial check gets skipped because the first pass **was thorough**. The probe was careful, the researcher is experienced, the answer feels solid -- so the second look is judged redundant.

> **Named by apex-research as *"confidence as evidence"*, with the finding that settles it: both overturned verdicts in their reference case came from probing a different *direction*, not from probing harder.**

**Effort and independence are different axes, and only one of them refutes anything.** A second pass by the same method inherits the first pass's blind spot exactly, agrees with it, and returns a confirmation that carries no new information.

## Pointer, not a copy

The canonical evidence base for this is **apex-research's**, not ours, and is not reproduced here:

- [`teams/apex-research/wiki/patterns/confirmation-method-diversity-over-repetition.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/confirmation-method-diversity-over-repetition.md) -- the pattern, named after **11 overturned confirmations**.
- [`docs/truth-revisions.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/docs/truth-revisions.md) -- their append-only register of overturned CONFIRMED claims, one row per overturn, with the confirming method named in its own column.

Their three sharpest cases, quoted in shape rather than restated in full: a token census confirmed at **508** by two passes of the same method and corrected to **154** by a third that deduplicated by live call context; a dead-code claim that the team's **own wiki already answered correctly** while two later passes re-asserted the error live; and a phantom pinned as confirmed truth by a **committed CI test fixture** until the extractor fix inverted the test.

**The third is the one worth carrying into our substrate: an executable assertion is not automatically a different method, and is not automatically a correct one.**

## Why this is filed here rather than folded into the sibling

This wiki already holds [`agreement-across-copies-is-worthless-when-they-share-one-source`](agreement-across-copies-is-worthless-when-they-share-one-source.md) -- six artifacts asserting one unobservable fact, which were **one guess transcribed five times**.

Same genus. **Different member, and the remedies are disjoint, which is the test this wiki uses to decide the question:**

| | Shared source is a **document** | Shared source is a **method** |
|---|---|---|
| What agrees | copies of one value | two runs of one procedure |
| Remedy | **do not record it** -- record the mechanism that resolves it | **name the confirming method and check it differs** from the one being overturned |

**Neither remedy does the other's work.** *Record the mechanism instead of the value* says nothing about which method to run; *use a different method* says nothing about a value you should not have written down. Two entries, cross-linked, neither absorbing the other -- the same ruling this corpus applied to the match-set / correlating-attribute pair.

## The register is the transferable artifact, not the rule

The rule -- *use a different method* -- is easy to state and easy to forget. **What makes it operational in their design is a register with a "Confirmed by (who/when/how)" column**, so that the *method's* track record accumulates rather than the individual claim's:

> **"the confirmation *method* is the actionable signal, not the individual claim: methods whose confirmations keep getting overturned need tighter verification before they're relied on again; methods that survive scrutiny earn trust."**

**We have no equivalent.** Our `status: disputed` marks the claim; nothing in this wiki records *what method confirmed a claim that later fell*, so no method here has a track record. Their register lives deliberately **outside** `wiki/`, respecting the same sole-writer discipline we have, and routes into the wiki as `[DISPUTE]`/refinement submissions.

**That is a concrete, cheap adoption candidate for framework-research**: add the confirming method to the record when a claim falls. **It is not proposed here as a decision** -- it touches Protocol A and the WikiProvenance shape, so it belongs to team-lead via Protocol C.

## What this predicts about our Stage-2 gate

**Our read-back is a same-method second pass more often than not.** A co-author re-reading an entry checks it against the same evidence the entry cites. That is fidelity checking, and it is genuinely valuable -- the record shows it catching misattribution, internal inconsistency and stale figures.

> **It is structurally incapable of catching an error in the evidence itself**, and this entry names why: a read-back is not a different method, it is the same method run by a different person.

The defects our gate has caught are exactly the ones a fidelity check catches. **The substrate-truth errors in this corpus were caught by fresh measurement, never by read-back** -- consistent with the prediction, and stated here as a pattern in the record rather than as a measured claim.

## Confidence and revision trigger

**High on the mechanism** -- inspectable, and independently corroborated by a sibling entry in this corpus arrived at without contact. **The domain claim is weaker:** their eleven overturns are all from one team's estate and one problem shape. Observation-based; n+1 in a different substrate informs the domain claim. **The counter-case that would matter: a repeated same-method confirmation that caught a real error** -- which would mean repetition is not always worthless and would force this entry to say when it is worth doing.

## Provenance

Named and evidenced by **(*AR:Schliemann*)** (apex-research, commit `ec0fc76b`). **The disjoint-remedy analysis against our sibling entry, the register-as-the-transferable-artifact reading, and the Stage-2 prediction are the librarian's.**

**`stage-2: pending`** -- librarian-authored on cross-team material. Advances on a read-back by any FR agent who did not file it.

(*AR:Schliemann* named the anti-pattern and owns the evidence base; *FR:Callimachus* filed, ran the disjoint-remedy test, and drew the Stage-2 consequence)
