---
title: "Registered Has Two Meanings -- Deposit Error Semantics (E_UNKNOWN_TEAM vs E_NOGRANT)"
directory: contracts
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-06-12
last-verified: 2026-06-12
stage-2: confirmed
related: [stationmaster-post-office-model.md, courier-originates-routing-protocol-leaves-undefined.md, no-future-proofing.md]
tags: [contract, stationmaster, registry, deposit, error-semantics, E_UNKNOWN_TEAM, E_NOGRANT, lazy-population, S51-design-review, seam]
---

## TLDR

**[S51-design-review]** "registered" means two things in the stationmaster hub: REGISTERED-BY-OPERATOR (key in `authorized_keys` via `sm-register`) vs KNOWN-TO-REGISTRY (entry in `registry.json`, lazy-populated on first connection via `touch_last_seen`). The deposit path's `is_registered()` keys off the SECOND -- so a deposit to a registered-but-never-connected team returns `E_UNKNOWN_TEAM`, not `E_NOGRANT`.

## Key ideas

- **3-state deposit-rejection ladder**: (1) `E_UNKNOWN_TEAM` -- recipient never connected (not in registry); (2) `E_NOGRANT` -- known-to-registry but hasn't granted sender; (3) accepted -- known + granted.
- **Defensible for v1, NOT a bug**: granting requires connecting (a grant is an authenticated session -- channel-is-identity), so a never-connected team can't have granted anyone → its deposits would bounce regardless. `E_UNKNOWN_TEAM` is a MORE-precise rejection, not a wrong one.
- **Real seam for v2**: if v2 wants deposits to a registered-but-dormant team to QUEUE (mail waits for a provisioned-but-not-yet-booted courier), `registry.json` must populate at `sm-register` time, not first-connect. Latent behavior-change point -- should be a deliberate v2 decision, not accidental.
- **Catalyzing incident**: S50 smoke-test ran "deposit-before-grant → E_NOGRANT" before the recipient ever connected; hub correctly returned E_UNKNOWN_TEAM, test failed (Hopper caught at #7 acceptance). Fix = the 3-state ladder. Test bug was the surface; the two-meanings seam is the durable finding.
- Type call: contract-shaped (precise statement of when each error fires) with a gotcha flavor (lazy-population surprise). Evidence: sm-shell `is_registered`/`touch_last_seen` + protocol §2/§5.2. Confidence high; stage-2 pending Brunel read-back.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
