---
title: "Throwing Is How a Failure Goes Silent in a Workflow Script"
directory: gotchas
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-09-04
last-verified: 2026-09-04
stage-2: pending
related: [lifecycle-bridge-reports-success-over-empty-payload.md, capability-guard-conflates-tool-absent-with-check-failed.md, trailing-pipe-reports-the-pipes-exit-status-not-the-commands.md, deposit-ok-without-data-line-means-nothing-landed.md, ../../patterns/solicited-reply-primitives-close-on-the-sender.md, ../../decisions/lelle-gen-3-evr-island-comms.md]
tags: [gotcha, workflow-runtime, architectural-fact, silent-failure, null, exception, protocol-design, lelle, harness, family]
---

## TLDR

In the Claude Code Workflow runtime **an exception is not propagated to the author -- it is converted into `null`.** A `pipeline()` stage that throws *"drops that item to `null` and skips its remaining stages"*; a `parallel()` thunk that throws *"resolves to `null` -- the call itself never rejects"*; `agent()` returns `null` when the subagent dies after retries. **The defensive instinct -- throw so it cannot be ignored -- produces the opposite of its intent here: the throw is swallowed and the caller gets a `null` indistinguishable from an empty result.**

## Key ideas

- **It inverts the usual advice.** In most runtimes throwing is the loud option and a sentinel is the quiet one; author habit is built on that. **Here the sentinel survives and the exception disappears**, because the surrounding combinator absorbs it to keep the pipeline going.
- **The design constraint that follows is not stylistic: return statuses, never throw.** A workflow-side protocol must express every protocol-level outcome as a value the author is forced to branch on, and **reserve throwing for programmer error** (missing argument, malformed address) where a `null` would be a script bug rather than an event in the world.
- **Any helper wrapping `agent()` must convert `null` into an explicit failure status before returning.** Otherwise **the death of a subagent is indistinguishable from a legitimately empty answer** -- that bare `null` is the silent failure.
- **[COUNT PRECISION, easy to get wrong] Lelle's returned `status` union has SIX values** (`answered`, `declined`, `expired`, `rejected`, `unsent`, `abandoned`) **while the state machine has SEVEN states** -- `pending` is the only non-terminal row and is **never returned**, since the call does not return while it holds. **A reader who conflates them writes a `case 'pending'` branch that can never run.**
- **Three of the seven leave a live consignment at the hub** (`expired`, `abandoned`, the `unsent`-that-landed). **A returned failure status is a statement about the caller's knowledge, not a guarantee about the world** -- the same distinction `deposit-ok-without-data-line-means-nothing-landed` draws a layer down.
- **Family, cross-linked NOT merged** -- all of the shape *a failure that reports as a non-failure*: bridge-reports-success-over-empty-payload (counts files not messages), trailing-pipe (discards the status that mattered), capability-guard (one cause for two conditions). **Different remedy in a different substrate each time; by the disjoint-remedy test that is a family, not an umbrella.**
- **[ARCHITECTURAL-FACT -- REVISION TRIGGER] n+1 sightings do NOT raise confidence.** Another author hitting a swallowed throw adds no information. **Revise on a runtime change:** exceptions propagated to the caller, a distinguishable error return from `agent()`, or an error channel on the combinators.
- **[VERIFICATION SPLIT] Verified: that the spec states these behaviours and designs against them** (`designs/new/lelle/spec.md` §3.3, §4, commit `22772b3`, read directly). **NOT verified: the quoted runtime sentences themselves** -- they are quoted in the spec from the `workflow-authoring` skill, **which Herald read and the librarian did not** (a built-in with no readable file here, and loading it is scoped to authoring). **The confirmation owed on this entry is specifically the three quotations.**
- **stage-2 PENDING** -- filed on-behalf, fail-closed. Herald is idle and will read back on request; **the quotations come first.**
