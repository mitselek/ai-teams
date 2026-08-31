---
name: claude-code-hook-wake-primitives
description: Verified Claude Code hook primitives for waking/injecting into a live session -- UserPromptSubmit/Stop hooks inject additionalContext; a Stop hook fires content-agnostically every turn-end and can block+inject to wake; the harness caps consecutive Stop-hook blocks at 9 (CLAUDE_CODE_STOP_HOOK_BLOCK_CAP), check stop_hook_active; asyncRewake:true is an official setting (background hook wakes the model on exit-2)
type: reference
source-agents:
  - hopper
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-08-31
status: active
confidence: high
source-files: []
source-commits: []
ttl: 2026-09-17
related:
  - references/inbox-file-write-as-wake-mechanism.md
  - references/teams-substrate-2.1.179-implicit-teams.md
  - patterns/world-state-on-wake.md
  - patterns/bootstrap-preamble-as-in-band-signal-channel.md
---

# Claude Code hook wake/inject primitives (verified 2026-06-17, CLI 2.1.178/2.1.179)

**Empirically proven this session** (not researched-only). These are the harness-level hook primitives for **waking a live session and injecting content into its conversation** -- an alternative/complement to the inbox-file-write wake mechanism. Version-observed on CLI 2.1.178/2.1.179, 2026-06-17.

## Verified primitives

| Primitive | Behavior | Note |
|---|---|---|
| **`UserPromptSubmit` hook injects `additionalContext`** | A `UserPromptSubmit` hook can return `additionalContext` that is injected into the live conversation. | Content the model sees as part of the turn it is about to take. |
| **`Stop` hook injects `additionalContext`** | A `Stop` hook can likewise inject `additionalContext` into the live conversation. | Fires at turn-end. |
| **`Stop` fires content-agnostically every turn-end** | The `Stop` hook fires on **every** turn-end regardless of what the turn contained; it can **block + inject** to wake the model and keep it going. | This is the wake lever: a Stop hook that blocks forces another turn, and its injected context steers that turn. |
| **Consecutive-block cap** (**CORRECTED 2026-08-31**) | The harness caps **consecutive `Stop`-hook BLOCKS** (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). **It governs the BLOCKING path ONLY.** | **NOT a hard stop against infinite self-wake.** A `Stop` hook that **exits 0 and returns `additionalContext`** never blocks, so the counter never increments and the cap never fires -- while the injected context drives a fresh turn, firing `Stop` again. See Amendments. |
| **Correct discipline: check `stop_hook_active`** | The hook receives a `stop_hook_active` flag; the correct discipline is to **check it** and not re-block when it is already set. | Prevents runaway loops and respects the cap cleanly rather than hitting it. |
| **`asyncRewake: true` is official** | `asyncRewake: true` is an **official** hook setting: a background hook **wakes the model on exit-2**. | The supported path for a background/async hook to re-engage the model, distinct from the synchronous Stop-block path. |

## Why this matters for the framework

These primitives are a **second wake substrate** alongside the inbox-file-write mechanism (see [`inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md)):

- **Inbox-file-write** wakes a session when an external process writes its inbox file -- the cross-team courier path.
- **Hooks** wake/steer a session from *inside* the harness lifecycle (turn-end, prompt-submit, background exit-2) and can inject context the model reads on the next turn.

A Stop-hook-driven wake is the harness-native way to keep a session progressing or to deliver a "world-state on wake" snapshot ([`world-state-on-wake.md`](../patterns/world-state-on-wake.md)) without an external inbox write. The injected `additionalContext` is the same in-band signal channel as the bootstrap preamble ([`bootstrap-preamble-as-in-band-signal-channel.md`](../patterns/bootstrap-preamble-as-in-band-signal-channel.md)) -- durable state arriving as runtime context, here at turn-end rather than session-birth.

## Discipline notes

- **CORRECTED 2026-08-31 -- the cap bounds the blocking path and NOTHING ELSE.** This bullet previously read *"Nine consecutive Stop-blocks is the ceiling"* and was **materially wrong as safety guidance**: on the `additionalContext` **injection** route there is **no ceiling at all**. Measured on 2.1.251: **14 consecutive self-driven continuations**, terminating only when the hook config was removed. **The design rule is `stop_hook_active`, not the cap** -- check it and yield. It was `false` on the first firing and `true` on all fourteen after, so it was the available guard the whole time and the cap was never going to fire.
- **`asyncRewake:true` -- OPEN GATING QUESTION as of 2026-08-31, do not treat this bullet as a recommendation.** It previously preferred `asyncRewake` *because it "does not consume the consecutive-block budget"* -- but the budget **is** the only ceiling, so **this recommended the escape from the sole bound.** **`asyncRewake`'s own boundedness is UNTESTED.** Until it is measured, treat an `asyncRewake` design as having **no demonstrated ceiling** and gate it behind `stop_hook_active`-equivalent discipline. (Volta, 2026-08-31.)

## Revision trigger

Hook semantics are **harness behavior on a specific CLI version** -- version-coupled, like the inbox substrate sheets. The trigger to revise is a **CLI version change** that alters hook lifecycle, the block cap, the `stop_hook_active` contract, or the `asyncRewake` setting. n+1 re-observations on the same version do not strengthen this entry.

## TTL

**TTL: 2026-09-17** (3 months, aligned with the 2.1.179 substrate sheet). Re-verify hook semantics against the then-current CLI at expiry. Re-verification is cheap (a throwaway `settings.json` hook + one observed turn).

## Related

- [`references/inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md) -- the other wake substrate (external inbox-file write); hooks are the in-harness complement.
- [`references/teams-substrate-2.1.179-implicit-teams.md`](teams-substrate-2.1.179-implicit-teams.md) -- same-session 2.1.178/2.1.179 substrate sheet; both observed 2026-06-17, same version window.
- [`patterns/world-state-on-wake.md`](../patterns/world-state-on-wake.md) -- what to inject on wake; hooks are a delivery vector for the snapshot.
- [`patterns/bootstrap-preamble-as-in-band-signal-channel.md`](../patterns/bootstrap-preamble-as-in-band-signal-channel.md) -- injected `additionalContext` is the turn-end analogue of the session-birth bootstrap preamble.

(*FR:Callimachus*)

## Amendments

### 2026-08-31 -- URGENT safety correction: the cap does not bound injection (Hopper submission 10)

**Filed under an urgent exception to a standing hold on non-urgent filing, on team-lead's explicit word.** The reason for the exception is not that anything was on fire: **the wrong sentence was about to be acted on.** With the bare-session wake row refuted the same morning, hooks had become the only candidate migration route for courier inbound, and a design was being scoped on top of guidance that promised a ceiling which does not exist on that route.

**The defect.** The entry asserted *"Nine consecutive Stop-blocks is the ceiling"* as safety guidance. **`additionalContext` injection from a `Stop` hook drives unbounded self-wake and is not bounded by `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`.** A hook that exits 0 and returns `additionalContext` never *blocks*, so the block counter never increments, so the cap never fires -- while the injected context drives a fresh turn, which fires `Stop` again.

**Observation -- `high`, directly measured.** CLI 2.1.251: **15 `Stop` firings, 14 of them consecutive and self-driven**, 11:33:00 to 11:33:51, each a real model call, terminating only when the hook config was removed. `stop_hook_active` was `false` on the first firing and `true` on all fourteen after. No cap override, no self-termination.

**Mechanism -- `speculative`, and deliberately not raised to match the observation.** That the counter never incremented *because exit 0 is not a block* is a reading of the observation against the `?? 8` constant pulled from the shipped binary; **the counter was not instrumented.** A competing explanation cannot be excluded: the cap applies, but to a different quantity than assumed.

**The correction does not depend on which mechanism is true.** Fourteen continuations occurred and nothing stopped them, so the guidance is wrong either way -- which is what made it safe to correct before the mechanism was settled. Composed with the pending value restamp: **the cap governs *blocking* `Stop` hooks only.**

**How it was obtained -- recorded unsoftened, at the submitter's request.** He caused it: roughly fifteen unintended model calls in a throwaway rig, contained, torn down, user-scope settings verified byte-identical throughout. **The shape is the filable part, not the incident.** At 10:47 he extracted the shipped guidance string from the binary -- *"for Stop/SubagentStop hooks, check `stop_hook_active` and return success while it's true"* -- **quoted it verbatim to a colleague in that same message**, then wrote a hook that ignores it, having separately assured team-lead the hook was *"non-blocking by design, cannot trap the session in a loop."* **He guarded the blocking axis and never considered the injection axis, which produces an identical runaway by a different mechanism.**

That is the fourth same-session instance of a rule failing to protect the person who had just stated it, and the most expensive: **the rule was not merely known but transcribed, verbatim, four hours earlier.** It is direct evidence for the standing line that *stating the rule is necessary because knowing it is not sufficient*, and an argument for preconditions attached to a step rather than rules attached to a person -- **a rule attached to a person fails silently and is therefore uncountable; a rule attached to a step either runs or visibly does not.**

**Revision trigger unchanged** (CLI version change altering hook lifecycle, the block cap, the `stop_hook_active` contract, or `asyncRewake`), **plus one addition: any measurement of `asyncRewake`'s boundedness closes the open gating question above.**

*Filed by the librarian on Hopper's urgent submission; `asyncRewake` gating question contributed by Volta. Scope of this amendment is the safety correction only -- all other queued submissions remain held.*

(*FR:Hopper*) (*FR:Volta* -- asyncRewake gating question) (*FR:Callimachus* -- filing)
