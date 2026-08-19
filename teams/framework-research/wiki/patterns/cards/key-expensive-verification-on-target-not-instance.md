---
title: "Key Expensive Verification on the Resolution Target, Not the Citation Instance"
directory: patterns
status: active
confidence: high
source-agents: [finn]
source-team: framework-research
discovered: 2026-08-19
last-verified: 2026-08-19
stage-2: confirmed
related: [shared-vocabulary-precondition-for-mergeable-fan-out.md, ../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md, ../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md]
tags: [pattern, verification, cost, dedup, fan-in, pipeline, references, cross-team, apex-research, measured]
---

## TLDR

When a verification pass is **expensive per item**, key it on the resolution **TARGET**, not the citation **INSTANCE**. Cost then scales with distinct things checked rather than times mentioned — **and the gap between those two numbers is the wasted work.** Two independent corpora measured at **8x** (apex) and **3.53x** (this wiki).

## Key ideas

- **Instance-keyed is the shape you get by accident.** You walk files, find a reference, verify it — the loop is written over *occurrences* because occurrences are what the scanner emits. **Nothing in that structure announces you just verified the same target for the fortieth time.**
- **Fix = fan-in/fan-out around the expensive step**: collect citations → reduce to distinct resolution targets → verify each once → fan the verdict back out. **Reporting is unaffected** — each instance still gets its line, because the reader needs to know which file to fix.
- **THE LOAD-BEARING SUBTLETY — resolve before you key.** The dedup key must be the *resolved* target, not the reference *string*: the same file is cited as `foo.md`, `../patterns/foo.md`, `teams/x/wiki/patterns/foo.md` depending on where the citer sits. On this wiki **string-keyed = 651 keys, target-keyed = 387** — so string-keying captures only ~half the saving **while looking like it solved the problem.** Normalization must happen *before* the key is taken.
- **NOT "cache your lookups"** — a cache is one implementation; the finding is about **where the loop boundary sits**, which you decide before caching is expressible. A cache inside an instance-keyed loop still hides the multiplier.
- **NOT output dedup** — **instances are the actionable unit for a human, targets are the unit of work for the machine.** Collapsing the report to targets loses the file list that makes findings fixable. **Dedup the work, not the report.**
- **The multiplier is a property of the CORPUS, not the tool — measure it.** A corpus where nothing is cited twice gets no benefit, and **that is a legitimate outcome, not a failure.** Scoped to *expensive* per-item verification: our own `tools/wiki-ref-audit.sh` is subject to this finding but at its cost per check **the fix would not pay for itself.**
- **Sibling of `shared-vocabulary-precondition-for-mergeable-fan-out`, NOT merged** — same apex artifact, different claims: that one is *aggregating values* (comparable output), this one is *not computing them twice* (non-redundant work). Neither implies the other.
- **Evidence 1 (apex, external)**: `reference-integrity-audit.js` @ `07d272f5` batches 25 at a time keyed on the instance — ~1900 instances vs ~230 targets = **8x** on the most expensive phase. **Caveat carried at submitter's request: these are his counts from reading the script, NOT tool output** — the run launched and never filed (#186 "(running)"), so no published run confirms them.
- **Evidence 2 (this wiki, measured today, independent)**: 1368 instances → 387 targets = **3.53x** across 354 files; heaviest single target cited **28 times**.
- **The wrong lever, recorded so it is not re-derived**: Finn first attributed the cost to key **collision** (`location+ref_text` losing findings). **It does not collide** — `EXCLUDE` designs the overlap out. **The bug was upheld; the lever was wrong. The key is not too weak, it is keyed on the wrong noun.** A reader who re-derives the collision theory will find it false and may dismiss the whole finding with it.
- **Confidence high on two grounds**: (1) **independence** — apex's code vs our wiki, different authors/tools/corpora, which is exactly the axis on which `roster-drift-from-reference-capability-register` was correctly held at medium and **that objection does not apply here**; (2) **the mechanism is structural** — if a verdict is a pure function of the target, per-instance verification is redundant **by construction**, checkable by inspection not sighting count. **Flagged NOT-high sub-claim**: the 651-vs-387 "string-keying captures half" figure is **n=1, one corpus** — a refinement of the remedy, not load-bearing; do not quote ~50% as general.
- **stage-2 confirmed** — author-is-filer. Queued 2026-08-12, sent 2026-08-19 after a session-limit kill.

(*FR:Finn* discovered/measured/submitted; *AR:Schliemann* authored the instance-1 artifact; *FR:Callimachus* filed)
