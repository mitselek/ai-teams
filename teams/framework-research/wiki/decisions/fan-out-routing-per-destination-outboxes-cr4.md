---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-06-15
filed-by: librarian
last-verified: 2026-06-15
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
---

# Fan-out routing (CR-4): per-destination outboxes (candidate A), ratified normative v1

**PO-RATIFIED 2026-06-15 (via team-lead).** The stationmaster courier resolves the ghost-outbox → destination-team routing gap with **candidate A: per-destination outboxes.** An outbox named `<team>-bridge` routes to `<team>` (strip `-bridge`); there is **one outbox per destination team** (N teams = N outboxes). This is now **normative v1**.

**Single-outbox multi-destination fan-out is OUT OF SCOPE in v1** — when a single outbox would fan out to multiple teams, the courier **refuses-and-retains** (logs, holds in spool, never drops). It does not guess.

This decision **resolves** the deferred amendment-candidate documented in [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md) (the "one outbox fanning out to MULTIPLE teams" undefined case). That gotcha's status moves DEFERRED → RESOLVED-as-candidate-A.

## Rejected alternatives (why A, not B or C)

- **(B) Routing sidecar / local entry-envelope** — rejected: adds a **local-format contract** (a new schema the courier and its feeders must agree on, separate from the wire protocol). More machinery, new failure surface, for a need no real consumer has yet forced.
- **(C) Leave-undefined** — rejected: this is just status-quo-with-a-name; it documents the gap without resolving it. The team already had the undefined case recorded as a gotcha; "leave undefined" adds nothing.

## Rationale for A

1. **Zero protocol change.** A is a **courier-hints convention only** — the wire protocol (consignment shape, hub routing by `to`) is untouched. No version bump, no new contract.
2. **External n=2 corroboration.** The FR reference courier and apex's live courier **independently** used the `<team>-bridge` → `<team>` convention (apex CR-4, their T10). Two independent arrivals at the same convention is the strongest signal the shape is natural, not imposed.
3. **Sender-borne cost where it belongs.** The routing data the verbatim-forward protocol can't carry (per the courier-originates-routing gotcha) is supplied at the edge by the **naming convention on the outbox** — the sender names the slot for its destination. Cost sits with the party that has the routing knowledge.

## Scope and fallback posture

- **B and C are kept as future fallbacks** — only revisited if a **real consumer forces** single-outbox multi-destination fan-out. Until then, refuse-and-retain is the v1 behavior for that case (no silent drop, no guess). This is the [`patterns/no-future-proofing.md`](../patterns/no-future-proofing.md) discipline: cover the observed need, queue the uncovered case behind a real forcing consumer.
- Codified in stationmaster-onboarding.md ("Outbox routing") and courier-hints Outbound §3.

## Evidence

- Herald's deferred `[PO-ratification]` amendment candidate (was in his scratchpad, with A/B/C non-prescriptive write-up). apex CR-4 (apex T10) was the deciding external corroboration. Ratified by PO via team-lead 2026-06-15.
- Confidence: high (ratified decision + n=2 independent-implementation corroboration).

## Related

- [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md) — the gap this decision resolves; its v1 conventions (single-configured-outbox; `<team>-bridge`→`<team>`; refuse-and-retain on the undefined multi-dest case) are exactly what candidate A ratifies as normative.
- [`patterns/no-future-proofing.md`](../patterns/no-future-proofing.md) — why B/C are deferred rather than built; refuse-and-retain covers the observed need without pre-building the uncovered fan-out.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the post-office protocol this routing convention rides on (hub routes by `to`; the convention supplies `to` from the outbox name).
- [`contracts/consignment-body-in-text-field-not-content.md`](../contracts/consignment-body-in-text-field-not-content.md) — sibling sender-side/edge-owns-it finding from the same S51 exercise.

(*FR:Herald* — submitted; *FR:Callimachus* — filed)
