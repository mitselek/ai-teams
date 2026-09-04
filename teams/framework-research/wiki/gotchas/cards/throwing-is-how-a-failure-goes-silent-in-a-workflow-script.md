---
title: "Throwing Is How a Failure Goes Silent in a Workflow Script"
directory: gotchas
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-09-04
last-verified: 2026-09-04
stage-2: confirmed
related: [lifecycle-bridge-reports-success-over-empty-payload.md, capability-guard-conflates-tool-absent-with-check-failed.md, trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md, deposit-ok-without-data-line-means-nothing-landed.md, ../../patterns/solicited-reply-primitives-close-on-the-sender.md, ../../decisions/lelle-gen-3-evr-island-comms.md]
tags: [gotcha, workflow-runtime, architectural-fact, silent-failure, null, exception, protocol-design, lelle, harness, family]
---

## TLDR

In the Claude Code Workflow runtime **an exception is not propagated to the author -- it is converted into `null`.** *"A stage that throws drops that item to `null` and skips its remaining stages."* *"A thunk that throws **(or whose agent errors)** resolves to `null` **in the result array** -- the call itself never rejects, so `.filter(Boolean)` before using the results."* *"Returns null if **the user skips the agent mid-run or** the subagent dies on a terminal API error after retries."* **The defensive instinct -- throw so it cannot be ignored -- produces the opposite of its intent here: the throw is swallowed and the caller gets a `null` indistinguishable from an empty result.**

## Key ideas

- **It inverts the usual advice.** In most runtimes throwing is the loud option and a sentinel is the quiet one; author habit is built on that. **Here the sentinel survives and the exception disappears**, because the surrounding combinator absorbs it to keep the pipeline going.
- **The design constraint that follows is not stylistic: return statuses, never throw.** A workflow-side protocol must express every protocol-level outcome as a value the author is forced to branch on, and **reserve throwing for programmer error** (missing argument, malformed address) where a `null` would be a script bug rather than an event in the world.
- **Any helper wrapping `agent()` must convert `null` into an explicit failure status before returning.** Otherwise **the death of a subagent is indistinguishable from a legitimately empty answer** -- that bare `null` is the silent failure.
- **[BUT THE STATUS MUST NOT NAME A CAUSE IT DOES NOT KNOW] `agent()`'s `null` has TWO documented causes -- a USER SKIP mid-run, or the subagent dying after retries. The first is not an error at all; it is a deliberate human action**, and the runtime does not distinguish them. **A helper that labels the `null` a crash is a fresh instance of the family this entry exists to close** -- a failure reported as the wrong thing, by the code written to stop failures going quiet. **`E_AGENT_DIED` is RETRACTED**; the spec now reads `{status:'unsent', error:{code:'E_AGENT_NULL', detail:'skipped-or-died -- the runtime does not distinguish'}}`.
- **[COLUMN HEADER CORRECTED on read-back] The entry's table was headed *"What a throw does"* and that overreached** -- **`agent()` returning `null` is a separate null source, not an absorbed exception**, and a thunk that never throws still nulls if its agent errors. **The surviving claim is *three documented behaviours, all in the same direction*, and the direction is toward `null`.**
- **[THREE COUNTS, NOT TWO] 7 states in the machine** (`pending` non-terminal) · **6 statuses in the returned union** (no return while `pending` holds) · **5 reachable by a single `hubSignal()`** (`abandoned` is `hubSignalAny()`-only). **So in a single-signal `switch`, BOTH `case 'pending'` and `case 'abandoned'` can never run.**
- **[BUILT IN TWO HALVES] The librarian caught six-versus-seven against the SPEC rather than the relay that said "a 7-state status"; Herald then checked that correction against their own §11.1 and found the third number** -- a `switch` claimed *"exhaustive over §3.4"*, **which it is not, though the switch was right anyway.** False claim corrected in the spec. **Neither half would have surfaced the other.**
- **Three of the seven leave a live consignment at the hub** (`expired`, `abandoned`, the `unsent`-that-landed). **A returned failure status is a statement about the caller's knowledge, not a guarantee about the world** -- the same distinction `deposit-ok-without-data-line-means-nothing-landed` draws a layer down.
- **Family, cross-linked NOT merged** -- all of the shape *a failure that reports as a non-failure*: bridge-reports-success-over-empty-payload (counts files not messages), trailing-pipe (discards the status that mattered), capability-guard (one cause for two conditions). **Different remedy in a different substrate each time; by the disjoint-remedy test that is a family, not an umbrella.**
- **[ARCHITECTURAL-FACT -- REVISION TRIGGER] n+1 sightings do NOT raise confidence.** Another author hitting a swallowed throw adds no information. **Revise on a runtime change:** exceptions propagated to the caller, a distinguishable error return from `agent()`, or an error channel on the combinators.
- **[VERIFICATION SPLIT] Verified: that the spec states these behaviours and designs against them** (`designs/new/lelle/spec.md` §3.3, §4, commit `22772b3`, read directly). **NOT verified: the quoted runtime sentences themselves** -- they are quoted in the spec from the `workflow-authoring` skill, **which Herald read and the librarian did not** (a built-in with no readable file here, and loading it is scoped to authoring). **The confirmation owed on this entry is specifically the three quotations.**
- **stage-2 CONFIRMED 2026-09-04** -- Herald read back both entries and both cards. **The verification split worked exactly as designed: two of the three quotations were defective, both in the place flagged as unverified.** Had they been transcribed as verified, both would have entered the wiki as substrate facts.
- **[CONDITIONAL ADVANCE, stated because it is unusual] Herald confirmed a SPECIFIED TARGET STATE, not the text as read** -- *advance once the two quotation corrections and the `E_AGENT_NULL` code are applied, not before.* **So the confirmed version is one nobody has read in final form.** The corrections are applied verbatim as Herald wrote them; **a cheap closing check is for Herald to confirm the applied text matches what they prescribed.**
