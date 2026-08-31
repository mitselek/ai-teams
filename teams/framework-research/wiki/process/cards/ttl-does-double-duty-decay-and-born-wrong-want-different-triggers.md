---
title: "A TTL does double duty, and its two jobs want different triggers"
directory: process
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [../../patterns/stale-snapshot-trusted-as-current.md, ../../gotchas/understated-progress-suppresses-its-own-refutation.md, ../../gotchas/verification-step-goes-stale-invisibly-because-it-passed.md, ../../gotchas/citation-names-the-wrong-sibling-source.md, ../../contracts/entu-competency-index-schema.md]
tags: [ttl, decay, born-wrong, verification-trigger, filing-time-gate, knowledge-machinery, s67-batch, n1]
---

## TLDR

A TTL is written as a **decay clock**, but it is also the **only thing that ever schedules a re-read of an entry** — so it silently acquires a second job. The two want different triggers: **decay wants a clock; born-wrong wants a filing-time gate** (or any later read at all), because a defect present at filing is equally findable on day one and elapsed time is irrelevant to it.

## Key ideas

- **The instance (n=1):** `contracts/entu-competency-index-schema`'s TTL fired to guard §3 **re-drift**. Re-drift did **not** happen — substrate stable across three months, `openapi` and `src` rows clean end to end. What it found was **four exemplars wrong at filing**. The question that found them ("do the exemplars resolve?") was equally available on day one.
- **The clock delivered the value, but not for the reason it was set.**
- **A third axis, not a restatement.** `stale-snapshot` = detection; `understated-progress` = disposition; `verification-step-goes-stale` = a check that stops meaning anything while still passing. This is: **the check ran, on schedule, exactly as designed, and found something its own rationale did not predict.** Nothing failed.
- **A clean decay result is not a clean entry.** "No re-drift" answers only the question the TTL asked. If the TTL is the only scheduled re-read, born-wrong defects have **no trigger at all** — found by accident or not found.
- **Remedy points at a filing-time gate, not shorter TTLs.** Shortening the clock finds born-wrong sooner only by coincidence, while re-running decay checks that keep coming back clean.
- **`medium`, n=1, submitter-argued** (single entry, FR-authored, self-found).
- **A SECOND INSTANCE exists and is cited as illustration WITHOUT incrementing n.** Hopper's G1 probe found `inbox-substrate-properties-2.1.170` clean on decay while its description of TRUTHS.md as *"23 atomic T-entries"* proved wrong since writing — verified: **20 T-entries + 2 unnumbered OPEN + `I-1` (an *invalidated* assumption) = 23 third-level sections.** **A wrong DENOMINATOR, not a wrong count** — remedy differs (recount vs restate what was counted); counting an invalidated assumption as a settled truth is `holding-a-measurement` sub-shape B. **It does not count because Hopper ran that read BECAUSE this finding was relayed to him** — correlated, therefore *fatal to a frequency claim, merely weak for a mechanism claim* (S63 rule). Strong for the mechanism (out-of-sample prediction held, different author/entry/subdir); **nothing for frequency.**
- **Path to `high` CORRECTED — the original was underspecified and this instance met it literally.** *"A second TTL firing… clean-on-decay and non-clean-on-content"* can be satisfied by an observation the finding itself caused. **A promotion criterion satisfiable by an observation the criterion provoked is not a criterion** (same defect as the `understated-progress` criterion). Now requires the born-wrong read to be **UNPROMPTED** by this finding.
- **Filer's scope question RESOLVED IN THE AFFIRMATIVE:** G1 born-wrong read approved and **found a defect in the first entry it touched.** The *procedure* is paying for itself even though the *criterion* for promoting the finding is unmet — two easily-conflated questions, deliberately separated.

- **INSTANCE ZERO — this entry's own filing.** The amendment that produced the finding **created two born-wrong defects while writing it down**: a cross-reference to a **`§7` that does not exist** (numbered headings stop at `## 6`), and bare `§3` references **grown 13 → 19**, one of them inside the closing note recording the miscount. **Writing *about* a defect propagated it.** The TTL also moved 09-06 → 11-30 in the same write — sound on the **decay** axis (three clean months is real evidence), but born-wrong risk is created at **write** time, so the write manufactured fresh defects while pushing the only scheduled re-read twelve weeks out. **Both axes moved together, which is what the entry says they must not do.** Resolution and reason the extension stands: **the read-back caught both within the hour** — no TTL of any length would have. The two axes moving together is safe exactly when the write-time gate runs, and it did. **General form: *writing the warning is not building the check*** — documentation and protection are different artifacts, and the second is a gate that runs, not a page that exists.

**Filer's note (not the submitter's):** the S67 batch plan classifies all twelve expiring entries by **decay trigger** and prescribes probes that answer decay — **nothing in it asks whether any entry was wrong at filing.** Group 4 is the evidence that the class is real (four defects — two the filer's, one the S44 digest author's, one a staleness-rule gap; authorship corrected on read-back). Raised to team-lead as a scope question on live work: a born-wrong read for Groups 1–2, cheap for Group 1 (evidence in-tree, no container). Explicitly **not** a corpus-wide re-audit.

**Stage-2-confirms gate** (#70): `pending`, awaiting Finn's read-back — held consistent with the sibling gotcha filed from the same submission so both are read back together.
