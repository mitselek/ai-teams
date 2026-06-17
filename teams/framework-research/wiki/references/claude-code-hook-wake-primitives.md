---
name: claude-code-hook-wake-primitives
description: Verified Claude Code hook primitives for waking/injecting into a live session -- UserPromptSubmit/Stop hooks inject additionalContext; a Stop hook fires content-agnostically every turn-end and can block+inject to wake; the harness caps consecutive Stop-hook blocks at 9 (CLAUDE_CODE_STOP_HOOK_BLOCK_CAP), check stop_hook_active; asyncRewake:true is an official setting (background hook wakes the model on exit-2)
type: reference
source-agents:
  - hopper
  - brunel
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-17
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
| **Consecutive-block cap = 9** | The harness caps **consecutive** `Stop`-hook blocks at **9** (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`). | Hard stop against infinite self-wake loops. Budget your wakes against this cap. |
| **Correct discipline: check `stop_hook_active`** | The hook receives a `stop_hook_active` flag; the correct discipline is to **check it** and not re-block when it is already set. | Prevents runaway loops and respects the cap cleanly rather than hitting it. |
| **`asyncRewake: true` is official** | `asyncRewake: true` is an **official** hook setting: a background hook **wakes the model on exit-2**. | The supported path for a background/async hook to re-engage the model, distinct from the synchronous Stop-block path. |

## Why this matters for the framework

These primitives are a **second wake substrate** alongside the inbox-file-write mechanism (see [`inbox-file-write-as-wake-mechanism.md`](inbox-file-write-as-wake-mechanism.md)):

- **Inbox-file-write** wakes a session when an external process writes its inbox file -- the cross-team courier path.
- **Hooks** wake/steer a session from *inside* the harness lifecycle (turn-end, prompt-submit, background exit-2) and can inject context the model reads on the next turn.

A Stop-hook-driven wake is the harness-native way to keep a session progressing or to deliver a "world-state on wake" snapshot ([`world-state-on-wake.md`](../patterns/world-state-on-wake.md)) without an external inbox write. The injected `additionalContext` is the same in-band signal channel as the bootstrap preamble ([`bootstrap-preamble-as-in-band-signal-channel.md`](../patterns/bootstrap-preamble-as-in-band-signal-channel.md)) -- durable state arriving as runtime context, here at turn-end rather than session-birth.

## Discipline notes

- **The cap is a safety rail, not a budget to spend.** Nine consecutive Stop-blocks is the ceiling; check `stop_hook_active` and yield rather than counting up to 9. A self-wake design that relies on approaching the cap is fragile.
- **Prefer `asyncRewake:true` for background-triggered re-engagement** over synchronous Stop-block chains when the wake originates from an out-of-band event -- it is the official path and does not consume the consecutive-block budget.

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
