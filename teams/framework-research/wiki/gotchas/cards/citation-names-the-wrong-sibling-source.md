---
title: "A citation naming the wrong one of two sibling sources fails silently"
directory: gotchas
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [../../patterns/key-expensive-verification-on-target-not-instance.md, ../../gotchas/holding-a-measurement-is-not-having-applied-it.md, ../../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md, ../../contracts/entu-competency-index-schema.md]
tags: [provenance, citation, source-files, silent-failure, checkable-by-inspection, sibling-sources, verification, n1]
---

## TLDR

A provenance field names a source that is real, relevant, same-author, same-date — and does **not** contain the thing lifted from it. Every normal check passes (path resolves, document is legitimate and on-topic, author and date are right) because none of them asks the question that fails: *does the cited document actually contain the cited shape?* Worse than a missing citation, which invites verification; a plausible wrong one **discourages** it — the reader checks, finds a legitimate document, and stops.

## Key ideas

- **Well-formed, resolvable, and wrong.** A broken reference announces itself. This one does not, and stays wrong until someone reads the cited document looking for the specific artifact.
- **The instance (n=1):** `contracts/entu-competency-index-schema` cited the grounding digest as the source of its §2/§3 ref exemplars. The digest has **178 lines and zero `ref:` lines**; all **32** exemplars are in the sibling competency harvest (**485 lines, 32 `ref:` lines**), same author and date, **absent from `source-files`**.
- **Consequence chain.** With no exemplars in the cited document, they were hand-made from the digest's bare prose topic-list — which names notes as *topics*, hence **undated** — producing `org-rights-cascade-audit`, a filename with **zero commits ever**. **ONE of four TTL-found defects traces to this misroute** (corrected down from three on read-back, by the submitter against his own claim). Fix is one line.
- **Two defects were verified NOT to trace, which sharpens the mechanism.** Defect 2 (a `docs` anchor that never existed) fails to trace because **both S44 documents contain zero anchored refs** — citing the right sibling would not have supplied one; that is an exemplar *invented* where no source demonstrated the shape. Defect 3 (`_parent.*`) fails to trace because the **digest itself says `_parent.*` at line 67, verbatim** — the filer transcribed the cited document faithfully and the document was wrong, which is a fact about the source, not the citation.
- **The count and the rating are different quantities.** `medium`/n=1 was always n=1 on the **mechanism** (one misroute), never n=3 on downstream defects — so shrinking three to one leaves the evidence untouched.
- **Detection is cheap and inspection-based:** grep the cited document for the shape the claim rests on. Here that is `grep -c 'ref:'` over two files, separating them 0 to 32. Not "does it exist" — *does it contain the thing*.
- **Verdict is a property of the target,** so one inspection settles every claim citing that document — the `target-not-instance` pattern applied to provenance.
- **`medium`, n=1, submitter-argued.** Finn declined a higher rating himself on the independence axis: single entry, FR-authored, self-found. **Path to `high`:** a second instance, different corpus, different author. The mechanism is structural (citations are checked for resolution, never for content) but one instance is not yet evidence for that.

**Stage-2-confirms gate** (#70): `pending`, awaiting Finn's read-back. **Deliberate departure from the S65 precedent** (direct submission in the submitter's own claims → `confirmed`): the filer is the **subject** of the entry — the miscitation is his own authorship error — so the co-author read-back is the control on the filer's rendering, not a formality. Departure recorded, not applied silently.
