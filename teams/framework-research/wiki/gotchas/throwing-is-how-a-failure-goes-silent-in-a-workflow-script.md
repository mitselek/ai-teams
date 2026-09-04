---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-09-04
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: high
source-files:
  - designs/new/lelle/spec.md
source-commits:
  - c422f7a
source-issues:
  - 116
related:
  - lifecycle-bridge-reports-success-over-empty-payload.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md
  - deposit-ok-without-data-line-means-nothing-landed.md
  - ../patterns/solicited-reply-primitives-close-on-the-sender.md
  - ../decisions/lelle-gen-3-evr-island-comms.md
---

# Throwing Is How a Failure Goes Silent in a Workflow Script

**Gotcha (team-wide, ARCHITECTURAL-FACT, high confidence).** In the Claude Code Workflow runtime, **an exception is not propagated to the author -- it is converted into `null`.** Three documented behaviours, all in the same direction:

| Construct | How a `null` gets to the caller |
|---|---|
| a stage inside `pipeline()` | *"A stage that throws drops that item to `null` and skips its remaining stages."* |
| a thunk inside `parallel()` | *"A thunk that throws **(or whose agent errors)** resolves to `null` **in the result array** -- the call itself never rejects, so `.filter(Boolean)` before using the results."* |
| `agent()` | *"Returns null if **the user skips the agent mid-run or** the subagent dies on a terminal API error after retries."* |

> **The normal defensive instinct -- throw on an unexpected condition so it cannot be ignored -- produces exactly the opposite result here. The throw is swallowed and the caller receives a `null` indistinguishable from an empty result.**

> **[COLUMN HEADER CORRECTED 2026-09-04, on Herald's read-back.] This table was headed *"What a throw does"*, and that overreached.** Row 3 is **not a throw-conversion at all** -- `agent()` returning `null` is a **separate null source**, not an absorbed exception. Row 2's restored parenthetical widens it the same way: **a thunk that never throws still nulls if its agent errors.** The claim that survives is the one below the table -- *three documented behaviours, all in the same direction* -- and the direction is **toward `null`**, not away from exceptions. **Corrected rather than quietly reworded, because the header was the part a scanning reader would have taken away.**

## Why this inverts the usual advice

In most runtimes, throwing is the *loud* option and returning a sentinel is the quiet one. Author habit is built on that. **This runtime reverses it**: the sentinel (`null`) is what survives, and the exception is what disappears, because the surrounding combinator absorbs it to keep the pipeline going.

**The consequence for any protocol implemented in a workflow script is a design constraint, not a style preference:**

> **Return statuses; never throw.** A workflow-side protocol must express every protocol-level outcome as a value the author is forced to branch on, and reserve throwing for programmer error -- a missing required argument, a malformed address -- where a `null` would be a bug in the script rather than an event in the world.

**A bare `null` reaching the author is the silent failure.** Any helper wrapping `agent()` must convert `null` into an explicit failure status before returning it, or the death of a subagent becomes indistinguishable from a legitimately empty answer.

> **And the status it converts to must not name a cause it does not know.** `agent()`'s `null` has **two** documented causes -- *the user skips the agent mid-run*, **or** the subagent dies after retries. **The first is not an error at all; it is a deliberate human action.** The runtime does not distinguish them, **so any helper that labels the `null` a crash is itself a fresh instance of the family this entry exists to close** -- a failure reported as the wrong thing, by the very code written to stop failures going quiet. **Report the cause as unknown, because it is.**

## First application -- Lelle

The [Lelle](../decisions/lelle-gen-3-evr-island-comms.md) spec (§3.3, §4) applies exactly this. Its `hubSignal()` **returns for every protocol-level outcome and throws only on programmer error**, and its helper **must convert `agent()`'s `null` into an explicit status** before returning.

**The code was corrected on Herald's read-back, and the reason is this entry's own rule.** The spec first prescribed `{status:'unsent', error:{code:'E_AGENT_DIED'}}` -- **which mislabels a user skip as a crash.** It now reads:

```js
{status:'unsent', error:{code:'E_AGENT_NULL', detail:'skipped-or-died -- the runtime does not distinguish'}}
```

**`E_AGENT_DIED` is retracted and should not be quoted from any earlier version of this entry.**

**A precision worth carrying, because the count is easy to get wrong -- and there are three counts, not two.**

| Count | What it is | Why it differs from the one above |
|---|---|---|
| **7** | states in the machine | `pending` is non-terminal |
| **6** | statuses in the returned union | the call does not return while `pending` holds |
| **5** | reachable by a single `hubSignal()` | `abandoned` arises **only** from `hubSignalAny()` losing a race |

**Consequence for anyone writing the `switch`: in a single-signal handler, BOTH `case 'pending'` and `case 'abandoned'` are branches that can never run.**

**Provenance of this table, because it was built in two halves by two people.** The librarian caught **six-versus-seven** at filing time, against the spec rather than against the relay that reported it as *"a 7-state status"*. **Herald then checked that correction against their own §11.1 and found the third number**: a section claiming its station-5 `switch` was *"exhaustive over §3.4"* -- **which it is not, and the switch was right anyway**, because five is all a single call can reach. **The false exhaustiveness claim is corrected in the spec.** Neither half would have surfaced the other.

**Note also which of the seven leave a live consignment at the hub** -- `expired`, `abandoned`, and the `unsent`-that-actually-landed. A returned failure status is a statement about *the caller's knowledge*, not a guarantee about the world, which is the same distinction [`deposit-ok-without-data-line-means-nothing-landed`](deposit-ok-without-data-line-means-nothing-landed.md) draws one layer down.

## Family

This is the workflow-runtime member of a family this wiki already holds, all of the shape *a failure that reports as a non-failure*:

- [`lifecycle-bridge-reports-success-over-empty-payload`](lifecycle-bridge-reports-success-over-empty-payload.md) -- a success line that counts files instead of messages.
- [`trailing-pipe-reports-the-pipes-exit-status-not-the-commands`](trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md) -- a shell construct that discards the status that mattered.
- [`capability-guard-conflates-tool-absent-with-check-failed`](capability-guard-conflates-tool-absent-with-check-failed.md) -- a branch that picks one cause for two conditions.

**Cross-linked, not merged.** Each has a different remedy in a different substrate -- return a status here, count messages there, split the branch in the third -- and by the disjoint-remedy test that is a family, not an umbrella.

## Revision trigger (architectural-fact entry)

**This is documented, deliberate runtime design, so n+1 sightings do NOT raise confidence** -- another author hitting a swallowed throw adds no information about the substrate. **The trigger to revise is a runtime change:** the Workflow tool propagating exceptions to the caller, `agent()` gaining a distinguishable error return, or the combinators gaining an error channel. Re-verify against the runtime documentation, not on the next sighting.

## What is verified and what is not

**Verified:** that Herald's spec states these behaviours and builds on them, read directly at `designs/new/lelle/spec.md` §3.3 and §4, commit `22772b3`.

**Verified on Herald's read-back, 2026-09-04:** all three runtime quotations, checked verbatim against the `workflow-authoring` skill text by the one person who could read it.

> **The split earned its keep on first use. Two of the three quotations were defective, and both defects were in the place this section flagged as unverified.** Had they been transcribed as verified, **both would have entered this wiki as substrate facts about a runtime nobody here had read.**

| Quotation | Verdict |
|---|---|
| `pipeline()` | **exact**, no change |
| `parallel()` | **material elision** -- `(or whose agent errors)` and `in the result array` were dropped; **the parenthetical widens the null channel past throwing** |
| `agent()` | **incomplete, and the one that mattered** -- the *user skips the agent mid-run* cause was missing, and its absence had propagated into a prescribed error code that mislabels a skip as a crash |

**Both defects originated in the spec, not in the filing** -- the elisions were Herald's, made before the librarian ever saw the text, and Herald corrected the spec and this entry together. **That is the useful shape: a relayed quotation can be faithfully relayed and still be wrong, because fidelity to the relay is not fidelity to the source.**

## Provenance

Discovered and documented by **(*FR:Herald*)** while drafting the Lelle spec v0.1, from the `workflow-authoring` skill text; relayed as a Protocol-A candidate by team-lead. **The family placement, the six-statuses-versus-seven-states precision and the verification split are the librarian's.**

**`stage-2: confirmed`** -- Herald read back both the entry and the card on 2026-09-04 and checked the three quotations against the skill text.

> **[CONDITIONAL ADVANCE -- stated because it is an unusual gate shape.] Herald confirmed a SPECIFIED TARGET STATE, not the text they read:** *advance once the two quotation corrections and the `E_AGENT_NULL` code are applied -- not before, since the entry currently prescribes a code I have retracted.* **The confirmed version is therefore one nobody has read in final form.** The corrections above are applied verbatim as Herald wrote them, and **the cheap closing check is for Herald to confirm the applied text matches what they prescribed.** Recorded rather than smoothed over, because *"confirmed"* on a version the confirmer never saw is exactly the kind of claim the referent discipline exists to make visible.

## Amendments

- **2026-09-04 (filing).** Created `pending`, with the three runtime quotations named as the specific confirmation owed.
- **2026-09-04 (Herald read-back).** Two quotations corrected (`parallel()` elision restored, `agent()` user-skip cause restored); the table's *"What a throw does"* header corrected as an overreach; `E_AGENT_DIED` retracted for `E_AGENT_NULL` with an explicit unknown-cause detail; the count table extended from two numbers to three; `source-commits` repinned `22772b3` -> `c422f7a`. Advanced to `confirmed` on the conditional above.

**Pin note.** `c422f7a` (§1.1 naming rule, PO gate 9) is the current committed spec; **every section this entry cites was checked to still resolve there, at identical line numbers.** Herald's read-back corrections to the spec itself were uncommitted at the time of writing, so **a further commit will supersede this pin without changing any cited section.**

(*FR:Herald* found and documented the behaviour and the design constraint, checked all three quotations against the skill text and supplied the corrections; *FR:Callimachus* filed, placed the family, caught six-versus-seven against the spec, separated verified from relayed, and applied the read-back)
