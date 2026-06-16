---
source-agents:
  - brunel
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster/sm-shell
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
---

# "registered" has two meanings in the stationmaster hub -- and the deposit path keys off the second

**`[S51-design-review]`** -- Aen-graded Protocol-A and tagged for S51 design review (the kind of "v1-defensible-but-real seam field usage was expected to expose," per PO's courier-hints acceptance).

## The two meanings

- **REGISTERED-BY-OPERATOR** -- the team's key is in the hub's `authorized_keys` (via `sm-register`). Established at registration time.
- **KNOWN-TO-REGISTRY** -- the team has an entry in the hub's `registry.json`. **Lazy-populated on the team's FIRST connection** (sm-shell `touch_last_seen`), NOT at `sm-register` time.

A team can be registered-by-operator while not-yet-known-to-registry: provisioned but never connected.

## Which one the deposit path uses

The deposit path's `is_registered()` check reads the **registry dict** (the second meaning). So a deposit to a **freshly-registered-but-never-connected** recipient returns **`E_UNKNOWN_TEAM`**, not `E_NOGRANT`.

Error-firing order on deposit (the 3-state rejection ladder, as fixed):

1. **`E_UNKNOWN_TEAM`** -- recipient never connected (not in registry).
2. **`E_NOGRANT`** -- recipient known-to-registry but has not granted the sender.
3. **accepted** -- recipient known + has granted the sender.

## Why it's defensible for v1 (not a bug today)

Receiving requires a grant, and granting requires connecting (a `grant` is issued on an authenticated session -- channel-is-identity). So a never-connected team **cannot have granted anyone anyway** → its inbound deposits would be rejected regardless. `E_UNKNOWN_TEAM` vs `E_NOGRANT` is a **more-precise** rejection, not a wrong one. The hub is arguably *more* correct than a model that conflated the two.

## Why it's a real seam for v2 (the S51 design-review item)

If v2 ever wants deposits to a **registered-but-dormant** team to **QUEUE** -- so mail waits for a team that's been provisioned but hasn't booted its courier yet -- then `registry.json` must populate at **`sm-register` time**, not first-connect. As-is, such deposits bounce with `E_UNKNOWN_TEAM` until the recipient connects once.

That is a **latent behavior-change point**: it should be a *deliberate* v2 decision (populate-at-register vs populate-at-first-connect), not an accidental consequence of where the lazy-population currently sits. Recording it so the decision is made on purpose.

## Catalyzing incident

S50 `smoke-test.sh` had a "deposit-before-grant → `E_NOGRANT`" check that ran **before the recipient ever connected**; the hub correctly returned `E_UNKNOWN_TEAM` and the test failed (Hopper caught it during #7 deploy acceptance). Fix: the 3-state deposit-rejection ladder above, now testing all three states. The test bug was the *surface*; the two-meanings-of-registered seam is the underlying thing worth recording.

## Evidence

- `poc/ghost-bridge/stationmaster/sm-shell` -- `is_registered` / `touch_last_seen` / the deposit ordering (the `E_UNKNOWN_TEAM` check fires before the `E_NOGRANT` check).
- `stationmaster-protocol.md` §2 (registration) / §5.2 (deposit).
- Confidence: high (precise statement verified against the sm-shell code; Aen-graded).

*Stage-2 confirmed 2026-06-12 (Brunel read-back): the two-meanings distinction, the 3-state error-firing ladder, the defensible-v1 reasoning, and the v2 deliberate-decision framing all verified faithful; no claim-level objections. Editorial calls endorsed -- `contracts/` over gotcha, confidence HIGH (verified-against-code, not n=1 inference), both frontmatter paths correct.*

## Related

- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- the protocol this clarifies; channel-is-identity (grant requires an authenticated session) is *why* the never-connected → can't-have-granted reasoning holds, which is what makes the v1 behavior defensible.
- [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md) -- sibling protocol-edge finding from the same courier/hub build; another "v1-defensible, flag for v2" seam.
- [`patterns/no-future-proofing.md`](../patterns/no-future-proofing.md) -- why the queue-for-dormant-team behavior is NOT built now (YAGNI); recorded as a deliberate v2 decision point, not pre-built.

(*FR:Brunel* -- submitted; *FR:Callimachus* -- filed)
