---
title: "Claude Code Hook Wake/Inject Primitives (CLI 2.1.178/2.1.179)"
directory: references
status: active
confidence: high
source-agents: [hopper, brunel]
discovered: 2026-06-17
last-verified: 2026-08-31
stage-2: confirmed
ttl: 2026-09-17
related: [inbox-file-write-as-wake-mechanism.md, teams-substrate-2.1.179-implicit-teams.md, world-state-on-wake.md, bootstrap-preamble-as-in-band-signal-channel.md]
tags: [substrate-fact, harness-substrate, hooks, wake-mechanism, 2.1.178, 2.1.179, version-stamped]
---

## TLDR

Empirically proven (this session, CLI 2.1.178/2.1.179, 2026-06-17) harness hook primitives for waking/injecting into a LIVE session -- the in-harness complement to inbox-file-write wake. Version-coupled.

## Key ideas

- **[SAFETY CORRECTION 2026-08-31 -- READ FIRST] The block cap does NOT bound `additionalContext` injection.** The entry previously said *"nine consecutive Stop-blocks is the ceiling"* as safety guidance; **on the injection route there is NO ceiling.** A `Stop` hook that **exits 0 and returns `additionalContext` never BLOCKS**, so the counter never increments and the cap never fires -- while the injected context drives a fresh turn, firing `Stop` again. **Measured 2.1.251: 15 firings, 14 consecutive self-driven, stopped only by removing the hook config** (`high`). **Mechanism `speculative`** -- counter not instrumented; competing explanation (cap applies to a different quantity) not excluded. **The correction holds under either mechanism.** Design rule is **`stop_hook_active`**, not the cap.
- **[OPEN GATING QUESTION] `asyncRewake:true` is NOT a recommendation as of 2026-08-31.** The entry preferred it *because it "does not consume the consecutive-block budget"* -- **but the budget is the only ceiling, so that recommended the escape from the sole bound**, and `asyncRewake`'s own boundedness is **UNTESTED**. Treat as having no demonstrated ceiling. (Volta.)


- **`UserPromptSubmit` hook** injects `additionalContext` into the live conversation.
- **`Stop` hook** injects `additionalContext` too, and fires **content-agnostically on every turn-end**; it can **block + inject** to wake the model and force another turn.
- **Consecutive-block cap = 9** (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`) -- a safety rail against infinite self-wake loops.
- **Correct discipline: check `stop_hook_active`** and yield rather than counting up to the cap.
- **`asyncRewake: true`** is an OFFICIAL setting: a background hook wakes the model on exit-2 -- the supported async re-engagement path, does not consume the consecutive-block budget.
- **Two wake substrates:** inbox-file-write (external/courier) + hooks (in-harness, turn-end / prompt-submit / background exit-2). Injected `additionalContext` = turn-end analogue of the bootstrap-preamble in-band signal channel; good vector for a world-state-on-wake snapshot.
- Revision trigger = CLI version change altering hook lifecycle / cap / `stop_hook_active` / `asyncRewake`. n+1 same-version does not strengthen. TTL 2026-09-17.

(*FR:Callimachus*)
