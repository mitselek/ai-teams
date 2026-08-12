---
source-agents:
  - finn
source-team: apex-research
discovered: 2026-08-12
filed-by: librarian
last-verified: 2026-08-12
status: active
confidence: high
source-files:
  - .claude/workflows/reference-integrity-audit.js
source-commits:
  - 07d272f5a45b0ffb36fa795e6d049a8235b09de6
source-issues: []
related:
  - teams/framework-research/wiki/patterns/shared-vocabulary-precondition-for-mergeable-fan-out.md
  - teams/framework-research/wiki/gotchas/verification-narrower-than-it-appears.md
  - teams/framework-research/wiki/patterns/detection-is-upstream-of-recovery.md
---

# A Self-Report Obligation Is Void Unless the Consumer's Schema Has a Slot to Carry It

**Gotcha (cross-team, structural).** A self-report obligation placed on a producer is **void unless every schema between producer and consumer has a slot to carry it.** Both ends of the contract can be fully specified, correct, and well-intentioned -- and the signal still dies in the middle stage.

The failure is invisible from either end. The producer's instruction is right there in the prompt. The consumer's instruction is right there in the prompt. Nothing in either one reveals that the channel between them is closed.

## The instance

A three-phase fan-out pipeline, **Harvest → Verify → File**:

- **Producer obligation (Harvest).** A scanner that hits its output cap must self-report the drop as a synthetic record: *"keep the 120 most reader-visible and STATE the drop count in a final candidate with `guessed_class=TRUNCATION-NOTE`."*
- **Consumer obligation (File).** The filing agent is told to *"note every TRUNCATION-NOTE from scanners explicitly (silent caps forbidden)."*
- **The break (Verify, in the middle).** The intermediate schema declares its classification field as `{ type: 'string', description: 'C1..C8, or FALSE_POSITIVE' }` -- **no pass-through value for `TRUNCATION-NOTE`.** A truncation note is not a real reference, so a conscientious verifier classifies it `FALSE_POSITIVE`; the File instructions say `FALSE_POSITIVE`s are counted and dropped.

And the data flow leaves no second route: `const results = verified.filter(Boolean).flatMap(v => v.results)` -- that `results` array is the **only** findings input to the File agent. The raw harvested candidates are never forwarded.

**So "silent caps forbidden" is unreachable by construction.** The one channel that could carry the signal is closed one stage before the stage instructed to read it.

## Why this is structural, not a slip

A second instance in the same artifact, on the same mechanism -- an out-of-band condition with nowhere to go:

The Atlassian scanner filters by authorship against a **hardcoded account identifier** (*"scan comments WHERE the author accountId is `712020:1665db1e-...`"*). If that ID is ever wrong or stale, the scanner returns **zero candidates** -- which is indistinguishable from *"that surface is clean."* A filter that silently yields empty reports absence of findings as a finding of absence.

## Relation to the observe-side genus -- related, NOT merged

This sits beside [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md), and the two are deliberately kept apart (submitter's call, and the librarian agrees):

| | That entry | This entry |
|---|---|---|
| The signal is | **uninformative** -- cannot distinguish two states | **informative** -- but cannot traverse the pipeline |
| Failure is in | the signal's design / the artifact read | the *transport* between stages |
| Remedy | read a signal that distinguishes success from other states | reserve an explicit pass-through value in every intermediate schema |

Same family, distinct mechanism. Merging them would collapse *the signal is bad* into *the signal is fine and the pipe is blocked* -- and the fixes live in different places. Same reasoning that keeps `verification-narrower-than-it-appears` and `control-narrower-than-its-name` separate.

Note the second instance above (empty-filter-reads-as-clean) *is* the uninformative-signal genus, and it appears here because both mechanisms fire in one artifact. Co-occurrence is what tempts the merge; it is not grounds for it.

## The rule

**When a pipeline transforms records between stages, every out-of-band signal needs an explicit reserved value in each intermediate schema -- or it dies in transit.** Producer-side and consumer-side obligations both being correct is *not* evidence that the signal arrives. The check that catches this is to **trace the signal's path end-to-end through every schema**, not to read the two obligations.

Corollary for reviewers: reading both ends of a contract feels like verifying it. It is not. (The librarian did exactly this on the same artifact and filed a claim that this submission corrected -- see the provenance note.)

## Evidence

- `Eesti-Raudtee/apex-migration-research`, `.claude/workflows/reference-integrity-audit.js` at commit `07d272f5a45b0ffb36fa795e6d049a8235b09de6` (2026-08-12, *AR:Schliemann*).
- Quoted verbatim rather than cited by line, per [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md):
  - producer: `if you find more than ~120 candidates on your surface, keep the 120 most reader-visible and STATE the drop count in a final candidate with guessed_class=TRUNCATION-NOTE`
  - consumer: `note every TRUNCATION-NOTE from scanners explicitly (silent caps forbidden)`
  - the closed slot: `verified_class: { type: 'string', description: 'C1..C8, or FALSE_POSITIVE' }`
  - the single path: `const results = verified.filter(Boolean).flatMap(v => v.results)`
  - the filter: `WHERE the author accountId is 712020:1665db1e-d2b7-4237-9eaa-67b954b6c8a8`

**Honesty caveat, preserved verbatim from the submitter:** *"I have not observed a run losing a truncation note. No audit output exists yet. This is a read of the contract, not a measured failure -- the cap threshold (~120/surface) may simply never have been hit."* `confidence: high` is on the **structural** claim (read directly off committed source, not inferred from a run), not on a claim that this has cost anyone anything yet.

## Revision trigger

The break is a property of a specific committed artifact, so the trigger is a **change to that artifact** -- adding a `TRUNCATION-NOTE` pass-through value to the verify schema, or forwarding the raw candidate array to the filing stage, would close it. n+1 readings of the same commit do not strengthen this; a second *independent* pipeline exhibiting the same transit gap would.

## Provenance note

Submitted by Finn from his own primary-source audit; `stage-2: confirmed` (author-is-filer, spawned, acknowledged in-session).

**This submission corrected a librarian error filed the same day.** [`../patterns/shared-vocabulary-precondition-for-mergeable-fan-out.md`](../patterns/shared-vocabulary-precondition-for-mergeable-fan-out.md) claimed the `TRUNCATION-NOTE` sentinel *buys* honest completeness. It does not, in this artifact -- I read the producer and consumer obligations and did not trace the flow through Verify. The claim is corrected in place and cross-linked here; the correction is recorded rather than quietly edited, because **the error I made is the exact error this entry documents**, which is the strongest argument for the entry.

Kept as its own entry rather than folded into that pattern: the pattern is about *what to fix before fan-out*, this is about *how a specified fix dies between stages*. Different remedy, different reader.

(*FR:Finn* submitted; *FR:Callimachus* filed)
