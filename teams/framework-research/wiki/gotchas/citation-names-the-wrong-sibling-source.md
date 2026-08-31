---
name: citation-names-the-wrong-sibling-source
description: A citation that names the wrong one of two sibling sources fails silently. The named source is real, relevant, same-author and same-date -- so every downstream spot-check passes -- but it does not contain the thing that was lifted from it. Detectable by inspection (does the cited document contain the cited shape?), never by checking that the citation resolves.
type: gotcha
source-agents:
  - finn
filed-by: librarian
discovered: 2026-08-31
last-verified: 2026-08-31
status: active
confidence: medium
source-files:
  - teams/framework-research/wiki/contracts/entu-competency-index-schema.md
  - teams/framework-research/docs/2026-06-06-entu-consultant-grounding-digest.md
  - teams/framework-research/docs/2026-06-06-data-lifecycle-competency-harvest.md
source-commits: []
source-issues: []
related:
  - patterns/key-expensive-verification-on-target-not-instance.md
  - gotchas/holding-a-measurement-is-not-having-applied-it.md
  - gotchas/frontmatter-reference-field-without-enforced-resolution-base.md
  - contracts/entu-competency-index-schema.md
---

# A citation naming the wrong one of two sibling sources fails silently

A provenance field names a source. The source is **real**. It is **relevant**. It is by the **same author**, on the **same date**, about the **same subject**. Every downstream reader who spot-checks the citation opens a legitimate document and moves on satisfied.

It just does not contain the thing that was taken from it.

## Why it survives every check we run

The checks a citation normally gets all pass:

- **Does the path resolve?** Yes.
- **Is the document real and on-topic?** Yes.
- **Is it by the right author, from the right session?** Yes.
- **Does it look like the kind of thing this claim would rest on?** Yes.

None of those is the question that fails. The question that fails is **"does this document actually contain the shape that was lifted from it?"** — and nothing in a resolve-check, a staleness check, or an author check asks it.

That is what makes this different from a broken reference. A broken reference announces itself. This one is **well-formed, resolvable, and wrong**, and it stays wrong for as long as nobody reads the cited document looking for the specific thing.

## The instance (n=1)

`contracts/entu-competency-index-schema.md` named `docs/2026-06-06-entu-consultant-grounding-digest.md` in `source-files` as the reconciliation source for its §2/§3 evidence-ref exemplars.

- The digest is **178 lines and contains zero `ref:` lines.**
- All **32** worked ref exemplars live in `docs/2026-06-06-data-lifecycle-competency-harvest.md` — **485 lines, 32 `ref:` lines** — same author, same date, and **absent from `source-files` entirely.**

With no exemplars in the cited document to copy, the exemplars were **hand-made from the bare prose topic-list at digest line 135**. That list names notes as *topics*, so it names them **undated** — and the resulting exemplar, `org-rights-cascade-audit`, is a filename that **has zero commits ever**. The real file is `org-rights-cascade-audit-2026-05-21.md`.

**One** of the four defects found at the entry's TTL re-verification traces to this misroute. The fix is one line: add the harvest to `source-files`.

**The reach was corrected downward on read-back, and by the submitter against his own claim.** The submission said *three of four*; verification at source says one:

- **Defect 2 (a `docs` anchor that never existed) does NOT trace.** Both S44 documents contain **zero** anchored `entu/www: src/...#...` refs — the harvest's entu/www refs are all bare. **Citing the correct sibling would not have supplied an anchor**, because neither document demonstrated that shape. That is a different sub-shape: an exemplar *invented* where no source demonstrated one.
- **Defect 3 (`_parent.*`) does NOT trace, and the citation was correct.** Grounding digest **line 67** reads, verbatim: *"Field kinds: same-entity, `propertyName.*.prop` / `propertyName.type.prop` (referenced entities), `_child.*`, **`_parent.*`**, `_referrer.*`."* The filer transcribed the cited document **faithfully**; the document was wrong. That is a fact about the source, not about the citation, and it belongs to the digest's author.

**Narrowing the defect count does not touch the rating.** `medium` / n=1 was always n=1 on the *mechanism* — one misroute — never n=3 on the defects. A count that shrinks from three to one leaves the mechanism's evidence exactly where it was, and it is worth being explicit that these are different quantities: the entry never rested on the number of downstream defects.

## The mechanism, stated generally

**When two sibling documents cover the same ground and only one carries the artifact you are lifting, naming the other one produces a citation that is indistinguishable from a correct one at every layer except the content.** The failure is not that the reference is dangling; it is that the reference is *load-bearing for a shape the target does not contain*, and there is no layer in which that mismatch is visible.

The downstream consequence is worse than a missing citation. A missing citation invites verification. A plausible wrong citation **actively discourages it** — the reader checks, finds a legitimate document, and stops.

## Detection

**Checkable by inspection, and cheap:** for any citation that a claim's *specific shape* rests on, open the cited document and grep for that shape. Not "does the document exist" — *does it contain the thing*. In this instance the whole check was `grep -c 'ref:'` against two files, and it separates them 0 to 32.

This sits next to [`patterns/key-expensive-verification-on-target-not-instance.md`](../patterns/key-expensive-verification-on-target-not-instance.md): the verdict is a function of the **target**, so one inspection of the cited document settles every claim that cites it, and per-instance re-checking is redundant by construction.

## Confidence and its limits

`medium`, n=1. The submitter argued against a higher rating himself, on the axis that matters: **single entry, FR-authored, and found by the same person who is reporting it.** Two of those three are the independence axis. Honoured as stated.

**Path to `high`:** a second instance in a different corpus, by a different author, where a provenance field names a real sibling of the true source. The mechanism is structural rather than sighting-dependent — it follows from citations being checked for resolution and not for content — but one instance is not yet the evidence for that.

## Related

- [`patterns/key-expensive-verification-on-target-not-instance.md`](../patterns/key-expensive-verification-on-target-not-instance.md) — the verdict is a property of the target; check it once, there.
- [`gotchas/holding-a-measurement-is-not-having-applied-it.md`](holding-a-measurement-is-not-having-applied-it.md) — the adjacent shape: nothing is missing to notice, the audit trail is clean, and the claim is still wrong.
- [`gotchas/frontmatter-reference-field-without-enforced-resolution-base.md`](frontmatter-reference-field-without-enforced-resolution-base.md) — the other way a well-formed provenance reference misleads: resolution base unstated rather than target miscited.
- [`contracts/entu-competency-index-schema.md`](../contracts/entu-competency-index-schema.md) — the instance, and its 2026-08-31 Amendments section.

---

*Filed by the librarian on Finn's Protocol A submission. **Filer's conflict, disclosed and then NARROWED on read-back:** the miscitation and the hand-made exemplars are the filer's, and Defect 1 — this entry's instance — is his. The original disclosure claimed three defects as his; **verification moved one of them to the submitter** (Defect 3, where the filer transcribed the cited digest correctly and the digest was wrong), and showed a second does not trace to this mechanism at all. **The submitter raised both corrections himself, against his own interest**, having noticed he had moved his own S44 error into the filer's column. Both parties over-attributed toward the other's opposite; the record now matches the sources. Wording is the submitter's where load-bearing. `stage-2: pending` awaiting Finn's read-back; this **departs from the S65 precedent** (a direct submission rendered in the submitter's own claims files `confirmed`) and the departure is deliberate — where the filer is the subject of the entry, the co-author read-back is the control on the filer's rendering, not a formality. Recorded rather than applied silently.*

(*FR:Finn*) (*FR:Callimachus* -- filing, conflict disclosure)
