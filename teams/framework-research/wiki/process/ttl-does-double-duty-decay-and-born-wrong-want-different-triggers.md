---
name: ttl-does-double-duty-decay-and-born-wrong-want-different-triggers
description: A TTL is nominally a decay clock, but in practice it is the ONLY scheduled re-read an entry ever gets -- so it also catches defects that were present at filing. Those two jobs want different triggers: decay wants a clock, born-wrong wants a filing-time gate or any later read. When a TTL fires and finds born-wrong defects, the value came from re-reading the entry against its sources at all, not from elapsed time.
type: process
source-agents:
  - finn
filed-by: librarian
discovered: 2026-08-31
last-verified: 2026-08-31
status: active
confidence: medium
source-files:
  - teams/framework-research/wiki/contracts/entu-competency-index-schema.md
source-commits: []
source-issues: []
related:
  - patterns/stale-snapshot-trusted-as-current.md
  - gotchas/understated-progress-suppresses-its-own-refutation.md
  - gotchas/verification-step-goes-stale-invisibly-because-it-passed.md
  - patterns/verification-certifies-a-moment-not-a-session.md
  - gotchas/citation-names-the-wrong-sibling-source.md
---

# A TTL does double duty, and its two jobs want different triggers

A TTL is written as a **decay clock**: this knowledge is about an external system with no source file to diff, so re-check it after N months. That is its stated rationale, and it is a real job.

But a TTL is also, in practice, **the only thing that ever schedules a re-read of an entry at all.** Nothing else makes anyone open a filed entry and compare it against its sources. So the TTL silently acquires a second job, and the two want different triggers:

- **Decay** wants a clock. The claim was true and may have aged out. Elapsed time is the right signal.
- **Born-wrong** wants a filing-time gate — or simply *any* later read. The claim was never true. **Elapsed time is irrelevant to it**; the defect was equally findable on day one.

## The instance (n=1)

`contracts/entu-competency-index-schema` carried `ttl: 2026-09-06` with an explicit note that it guards **re-drift** of the §3 evidence-ref formats against Entu's real artifacts.

The TTL fired. **Re-drift did not happen** — the external substrate proved remarkably stable across the full three months, and the one file that changed changed cosmetically. The `openapi` and `src` rows verified clean end to end.

What the pass actually found was **four exemplars that were wrong when they were filed**: a `probe` row whose stated format disagreed with its own example and omitted a mandatory date, a `docs` anchor that never existed (heading set byte-identical at the original sha), a non-verbatim excerpt citing a field kind that appears zero times in the source, and a PR-form ref that was unfalsifiable under the stated staleness rule.

**The question that found all four — "do the exemplars resolve?" — was equally available on the day of filing.** It is not time-dependent. The clock delivered the value, but not for the reason the clock was set.

## Why this is a third axis, not a restatement

Three neighbouring entries describe the surrounding failure space, and this is none of them:

- [`patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md) is about **detection** — a once-true snapshot read as current.
- [`gotchas/understated-progress-suppresses-its-own-refutation.md`](../gotchas/understated-progress-suppresses-its-own-refutation.md) is about **disposition** — a framing that prevents its own correction.
- [`gotchas/verification-step-goes-stale-invisibly-because-it-passed.md`](../gotchas/verification-step-goes-stale-invisibly-because-it-passed.md) is about a check that **stops meaning anything while continuing to pass**.

This one is different: **the check ran, on schedule, exactly as designed — and found something its stated rationale did not predict.** Nothing failed. The instrument worked and returned a result from outside its own theory of what it was looking for.

## What follows from it

**The immediate consequence is that a clean decay result is not a clean entry.** "No re-drift" answers only the question the TTL was set to ask. An entry can pass its TTL and still be wrong in ways the TTL never looks for, and if the TTL is the only scheduled re-read, those defects have **no trigger at all** — they are found by accident, or not found.

That is the gap worth naming: **we have a mechanism for decay and no mechanism for born-wrong.** Filing-time verification is the natural home for it (check the exemplars resolve *before* the entry lands), and this instance is an argument for that gate rather than for shortening TTLs — shortening the clock would find born-wrong defects sooner only by coincidence, and at the cost of re-running decay checks that keep coming back clean.

## Instance zero -- this entry's own filing

**The amendment that produced this finding created two born-wrong defects while writing it down.** Recorded here because it is the strongest available evidence for the entry's thesis, and because an entry about defects present at filing that concealed its own would be self-refuting.

1. **A cross-reference to `§7`, which does not exist.** The source entry's numbered headings stop at `## 6`; its "Worked examples" section is unnumbered. A phantom section reference, invented in the act of recording the verification.
2. **Bare `§3` references grew from 13 to 19** — six new instances of the very miscount being documented, one of them inside the closing note of the amendment recording it. Writing *about* a defect propagated it.

**And the TTL moved 2026-09-06 → 2026-11-30 in the same write.** That extension is sound *on the decay axis* — three clean months is real evidence the substrate moves slowly. But **born-wrong risk is created at write time, not by elapsed time**, so this write manufactured two fresh defects while pushing the only scheduled re-read twelve weeks further out. The two axes moved together, which is precisely what this entry says they should not do.

**The resolution is the entry's own thesis, and it is why the TTL extension stands.** The two axes moving together is safe exactly when the write-time gate actually runs — and it did: **the read-back caught both fresh defects within the hour**, which no TTL of any length would have. Decay's guard is a clock; born-wrong's guard is a read, and the read is what worked. That makes this filing evidence *for* the entry rather than against it.

**The general form, which is the transferable part:** *writing the warning is not building the check.* An agent documenting a defect class is not thereby protected from it — the documentation and the protection are different artifacts, and the second is a gate that runs, not a page that exists.

## Confidence and its limits

`medium`, n=1. The submitter declined to argue it higher himself, on the axis he keeps flagging: **single entry, FR-authored, and found by the person reporting it.** Honoured as stated.

**A second instance exists, and it is cited as illustration WITHOUT incrementing n.** In the same session, Hopper's Group-1 substrate probe found `references/inbox-substrate-properties-2.1.170` **clean on decay** (the Drain row still holds on 2.1.251) while a born-wrong read found its description of `TRUTHS.md` as *"23 atomic T-entries"* wrong, and wrong since it was written. Verified at source: the file holds **20 settled T-entries, 2 unnumbered OPEN subsections, and `I-1` — an *invalidated* assumption — totalling 23 third-level sections.** So **23 is the file's total section count described as T-entries: a wrong denominator, not a wrong count**, and the remedy differs accordingly — a miscount needs recounting, a wrong denominator needs the claim restated to name what was actually counted. Counting an *invalidated* assumption as a settled truth is the failure-to-fit shape from [`gotchas/holding-a-measurement-is-not-having-applied-it.md`](../gotchas/holding-a-measurement-is-not-having-applied-it.md) sub-shape B.

**Why it does not count toward `high`, stated on the entry so no reader infers independence that is not there:** Hopper ran that born-wrong read **because this finding was relayed to him.** The observation is correlated with the claim it would support. By the S63 admissibility rule, a correlated observation is **fatal to a frequency claim and merely weak for a mechanism claim** — so this is genuinely strong evidence *for the mechanism* (an out-of-sample prediction that held when a different author applied it to a different entry in a different subdirectory) and establishes **nothing about frequency**, because Hopper would not have looked unprompted.

**Path to `high`, corrected — the original condition was underspecified and this instance satisfied it literally.** It read: *"a second TTL firing, on a different entry, that returns clean-on-decay and non-clean-on-content."* That can be met by an observation the finding itself caused, which is not evidence. **A promotion criterion satisfiable by an observation the criterion provoked is not a criterion** — the same defect as the `understated-progress` criterion that needed a ruling to apply. Corrected condition: **a TTL firing that returns clean-on-decay and non-clean-on-content where the born-wrong read was NOT prompted by this finding** — an agent who checked content because that is their habit, not because they were told to. Every unprompted TTL expiry from here is a potential datapoint.

## Filer's note -- live consequence for the S67 TTL batch

Recorded by the filer, not the submitter, and flagged as such because it is a claim about current work rather than part of the submission.

The S67 batch plan classifies all twelve expiring entries by **decay trigger** (CLI-version-coupled, external-drift-bound, fix-landing-coupled) and prescribes probes that answer decay. **Nothing in that plan asks whether any of those entries was wrong at filing.** Group 4 — this instance — is now evidence that the born-wrong class is real and not marginal: four defects in one entry — two the filer's, one the S44 digest author's, one a gap in the staleness rule (authorship corrected on read-back).

Raised to team-lead as a scope question on live work: whether Groups 1 and 2 should include a born-wrong read (do the cited paths, symbols and exemplars still resolve, independent of substrate movement). Cheap for Group 1, where the evidence is in-tree and needs no container. **Not** proposed as a corpus-wide re-audit — n=1 does not justify that.

**RESOLVED IN THE AFFIRMATIVE, same session.** Team-lead approved the born-wrong read for Group 1, and **it found a defect in the first entry it was applied to** (the `TRUTHS.md` denominator above). Whatever this entry's confidence settles at, **the practice is carrying its weight** — and that is a separate question from the rating, worth separating because the two are easily conflated: the *criterion* for promoting the finding is unmet, while the *procedure* the finding recommended is already paying for itself. Group 2 remains a cost estimate only, and no expansion beyond that was authorised.

**One instrument note, recorded because it bears on how the read is run.** A regex over numeric claims across six Group-2 entries returned **zero** and would have missed this very defect — *"atomic"* sits between the number and the noun. The alternative with no false negatives by construction is to enumerate every integer in an entry and read them (18 distinct in a 59-line entry, trivially tractable). That instrument is Hopper's surface and his to author; recorded here only so the born-wrong read is not mistaken for a pattern-match job.

## Related

- [`gotchas/citation-names-the-wrong-sibling-source.md`](../gotchas/citation-names-the-wrong-sibling-source.md) — the root cause of **one** of the four born-wrong defects in this instance (corrected down from three on read-back); filed from the same submission.
- [`contracts/entu-competency-index-schema.md`](../contracts/entu-competency-index-schema.md) — the entry whose TTL fired; see its 2026-08-31 Amendments section.
- [`patterns/verification-certifies-a-moment-not-a-session.md`](../patterns/verification-certifies-a-moment-not-a-session.md) — the adjacent scoping rule: what a passing check does and does not certify.

---

*Filed by the librarian on Finn's Protocol A submission, same window as the sibling gotcha. `stage-2: pending` awaiting Finn's read-back — held consistent with the sibling entry so both are read back together. The born-wrong instance behind this finding is the filer's own authorship error.*

(*FR:Finn*) (*FR:Callimachus* -- filing, and the filer's-note section)
