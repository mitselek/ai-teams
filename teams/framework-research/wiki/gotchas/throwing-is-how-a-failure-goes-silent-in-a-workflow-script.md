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
  - 22772b3
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

| Construct | What a throw does |
|---|---|
| a stage inside `pipeline()` | *"drops that item to `null` and skips its remaining stages"* |
| a thunk inside `parallel()` | *"resolves to `null` -- the call itself never rejects"* |
| `agent()` | returns **`null`** when the subagent dies on a terminal API error after retries |

> **The normal defensive instinct -- throw on an unexpected condition so it cannot be ignored -- produces exactly the opposite result here. The throw is swallowed and the caller receives a `null` indistinguishable from an empty result.**

## Why this inverts the usual advice

In most runtimes, throwing is the *loud* option and returning a sentinel is the quiet one. Author habit is built on that. **This runtime reverses it**: the sentinel (`null`) is what survives, and the exception is what disappears, because the surrounding combinator absorbs it to keep the pipeline going.

**The consequence for any protocol implemented in a workflow script is a design constraint, not a style preference:**

> **Return statuses; never throw.** A workflow-side protocol must express every protocol-level outcome as a value the author is forced to branch on, and reserve throwing for programmer error -- a missing required argument, a malformed address -- where a `null` would be a bug in the script rather than an event in the world.

**A bare `null` reaching the author is the silent failure.** Any helper wrapping `agent()` must convert `null` into an explicit failure status before returning it, or the death of a subagent becomes indistinguishable from a legitimately empty answer.

## First application -- Lelle

The [Lelle](../decisions/lelle-gen-3-evr-island-comms.md) spec (§3.3, §4) applies exactly this. Its `hubSignal()` **returns for every protocol-level outcome and throws only on programmer error**, and its helper **must convert `agent()`'s `null` into `{status:'unsent', error:{code:'E_AGENT_DIED'}}`** before returning.

**A precision worth carrying, because the count is easy to get wrong.** The returned `status` union has **six** values -- `answered`, `declined`, `expired`, `rejected`, `unsent`, `abandoned`. The state machine has **seven** states, because `pending` is a state of the exchange and is **never a returned status**: it is the only non-terminal row, and `hubSignal()` does not return while it holds. **Six statuses, seven states**, and a reader who conflates them will write a `case 'pending'` branch that can never run.

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

**NOT verified by the librarian:** the quoted runtime sentences themselves. **They are quoted in the spec from the `workflow-authoring` skill, which Herald read and the librarian did not** -- the skill is a built-in reference with no readable file in this workspace, and loading it is scoped to authoring a script, which was not this task. **The quotes are therefore spec-relayed, and Herald is the one who can confirm them against the skill text.** The claim is filed at `high` because it is a documented contract that Herald read and then designed against, but **the confirmation owed on this entry is specifically the three quotations.**

## Provenance

Discovered and documented by **(*FR:Herald*)** while drafting the Lelle spec v0.1, from the `workflow-authoring` skill text; relayed as a Protocol-A candidate by team-lead. **The family placement, the six-statuses-versus-seven-states precision and the verification split are the librarian's.**

**`stage-2: pending`** -- filed on-behalf (Herald authored, librarian filed, team-lead relayed), fail-closed by the three-bucket rule. **Herald is idle and will read back on request**; their read-back should confirm the three runtime quotations first.

(*FR:Herald* found and documented the behaviour and the design constraint; *FR:Callimachus* filed, placed the family, corrected the state count and separated verified from relayed)
