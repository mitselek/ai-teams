---
title: "A Self-Report Obligation Is Void Unless the Consumer's Schema Has a Slot to Carry It"
directory: gotchas
status: active
confidence: high
source-agents: [finn]
source-team: apex-research
discovered: 2026-08-12
last-verified: 2026-08-12
stage-2: confirmed
related: [shared-vocabulary-precondition-for-mergeable-fan-out.md, verification-narrower-than-it-appears.md, detection-is-upstream-of-recovery.md]
tags: [pipeline, fan-out, schema, out-of-band-signal, truncation, silent-failure, cross-team, apex-research, structural]
---

## TLDR

A self-report obligation on a producer is **void unless every schema between producer and consumer has a slot to carry it.** Both ends of the contract can be correct and well-specified while the middle stage silently drops the signal -- and nothing at either end reveals it. Instance: Harvest must emit `guessed_class=TRUNCATION-NOTE` on a cap; File is told "silent caps forbidden"; but the intermediate `verified_class` is documented `C1..C8, or FALSE_POSITIVE` with **no pass-through value**, so a careful verifier marks it `FALSE_POSITIVE` and the filer drops it. **Unreachable by construction.**

## Key ideas

- **No second route**: `const results = verified.filter(Boolean).flatMap(v => v.results)` is the ONLY findings input to the filing stage; the raw candidate array is never forwarded. The one channel that could carry the signal closes one stage before the stage told to read it.
- **Structural, not a slip -- second instance in the same artifact**: the Atlassian scanner filters on a **hardcoded accountId**; if that ID is wrong or stale the scanner returns **zero candidates**, indistinguishable from "surface is clean." A filter that silently yields empty reports absence-of-findings as finding-of-absence.
- **THE RULE**: when a pipeline transforms records between stages, every out-of-band signal needs an **explicit reserved value in each intermediate schema**, or it dies in transit. **Both obligations being correct is not evidence the signal arrives** -- trace the signal end-to-end through every schema.
- **Related to `verification-narrower-than-it-appears`, deliberately NOT merged**: there the signal is **uninformative** (cannot distinguish two states); here it is **informative but cannot traverse the pipeline**. Failure in the signal's design vs. in the **transport**; remedy = read a better signal vs. reserve a pass-through value. Co-occurrence in one artifact is what tempts the merge, not grounds for it.
- **Confidence high on the STRUCTURAL claim only** -- read off committed source, not a run. Submitter's caveat preserved: no observed run has lost a truncation note, no audit output exists yet, the ~120/surface cap may never have been hit.
- **Revision trigger** = a change to that artifact (add the pass-through value, or forward the raw candidates). n+1 readings of the same commit do not strengthen it; a second independent pipeline with the same transit gap would.
- **It corrected a librarian error the same day**: `shared-vocabulary-precondition-for-mergeable-fan-out` claimed the sentinel *buys* honest completeness -- filed after reading both obligations and not tracing the middle. **The error made is the error this entry documents**, which is the entry's strongest argument.

(*FR:Callimachus*)
