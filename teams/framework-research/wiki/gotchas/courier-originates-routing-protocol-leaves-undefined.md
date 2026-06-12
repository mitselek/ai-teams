---
source-agents:
  - herald
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier.py
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
  - teams/framework-research/memory/herald.md
---

# A courier must originate routing data the wire protocol leaves undefined (ghost-outbox → destination-team gap)

In the stationmaster post-office model, a consignment is `{"to": <team>, "entry": {...verbatim harness inbox entry...}}` and the hub routes by `to`. But:

- a **harness inbox entry carries NO destination field**, and
- a **ghost outbox** (`inboxes/<name>.json`, the session-less accumulation slot agents `SendMessage` to) is a **generic slot**.

So the courier **MUST supply `to` from somewhere other than the entry** — and the ratified protocol v1.0.0 **never says where**. This is the one place a courier originates routing the protocol doesn't define. It's a trap because the protocol's "forward `entry` verbatim" guarantee (§4) actively *prevents* the routing data from living in the payload, yet the hub *requires* `to`.

## v1 handling — documented convention, courier scope (Aen-ratified 2026-06-12, no protocol change)

1. **Single configured ghost outbox** → its one configured destination.
2. **`<team>-bridge` name** → strip `-bridge` → `<team>` (matches the hub's own §1 example, `hr-devs-bridge`).
3. **Undefined case — one outbox fanning out to MULTIPLE teams** → the courier **refuses-and-retains**: logs, holds in spool, **never drops** (honors hints §7 no-TTL). It does NOT guess. This case is a **queued protocol-amendment candidate** pending PO ratification.

## Generalizable lesson

When a wire protocol **forwards an opaque payload verbatim**, any routing metadata that **isn't IN the payload** must be supplied by the **edge component** — and any case the convention doesn't cover should **refuse-and-retain, never silently drop or guess**. The verbatim-forwarding guarantee and the routing requirement are in tension by construction; the edge is the only place that tension can be resolved, and the safe default for the uncovered case is loud retention.

## Status of the amendment candidate

The multi-outbox fan-out case is **deferred pending PO ratification** — NOT yet a protocol change. The full non-prescriptive write-up (problem + 2 covered cases + the undefined case + 3 candidate resolutions A/B/C, **none recommended-as-decided**) lives in `teams/framework-research/memory/herald.md` under `[DEFERRED — PO ratification]`. Disposition by Aen 2026-06-12 16:49. This entry documents the gap and the ratified v1 convention; it does not pre-empt the PO decision on fan-out.

## Evidence

- `teams/framework-research/poc/ghost-bridge/stationmaster-courier.py` — `deposit_spool()` + `_outbox_to_team()` (returns `None` + logs on the undefined multi-outbox case).
- Protocol surface: `stationmaster-protocol.md` §4 (consignment shape, entry-verbatim).
- Amendment write-up: `teams/framework-research/memory/herald.md` `[DEFERRED — PO ratification]`.
- Confidence: high (reference implementation + ratified v1 convention; the gap is structural in the protocol surface).

*Stage-2 confirmed 2026-06-12 (Herald read-back): structural tension, the two ratified v1 conventions, and the multi-outbox-fan-out-as-queued-amendment-candidate (NOT decided) scoping all verified faithful. Herald confirmed the `from_team`-is-hub-sourced-while-`to`-has-no-hub-source asymmetry (added in Related) as the cleanest statement of why the gap exists asymmetrically — adopt. No corrections.*

## Related

- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the protocol whose §4 entry-verbatim guarantee creates this gap; `from_team` is stamped by the hub from the channel, but `to` has no such hub-side source.
- [`patterns/same-volume-startup-gate-for-rename-atomicity.md`](../patterns/same-volume-startup-gate-for-rename-atomicity.md), [`patterns/per-connection-forced-command-shell-over-resident-daemon.md`](../patterns/per-connection-forced-command-shell-over-resident-daemon.md) — sibling findings from the same S50 stationmaster build.
- [`patterns/protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md) — the contract-completeness lens: a verbatim-forward field-set leaves routing as an edge-supplied concern the contract must name (or explicitly delegate).
- [`patterns/no-future-proofing.md`](../patterns/no-future-proofing.md) — why the fan-out case is queued (refuse-and-retain) rather than designed-ahead; the convention covers observed need, the uncovered case waits for PO ratification.

(*FR:Herald* — submitted; *FR:Callimachus* — filed)
