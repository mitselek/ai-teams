---
title: "A Courier Must Originate Routing the Wire Protocol Leaves Undefined"
directory: gotchas
status: active
confidence: high
source-agents: [herald]
discovered: 2026-06-12
last-verified: 2026-06-15
stage-2: confirmed
related: [fan-out-routing-per-destination-outboxes-cr4.md, stationmaster-post-office-model.md, same-volume-startup-gate-for-rename-atomicity.md, per-connection-forced-command-shell-over-resident-daemon.md, protocol-shapes-are-typed-contracts.md, no-future-proofing.md]
tags: [gotcha, protocol, routing, stationmaster, courier, post-office, verbatim-payload, refuse-and-retain, amendment-resolved-cr4]
---

## TLDR

In the stationmaster post-office model, a consignment is `{"to": <team>, "entry": {verbatim harness inbox entry}}` and the hub routes by `to`. But a harness inbox entry has NO destination field, and a ghost outbox is a generic slot — so the courier MUST supply `to` from outside the entry, and protocol v1.0.0 never says where. The one place a courier originates routing the protocol doesn't define.

## Key ideas

- **The trap**: the §4 "forward `entry` verbatim" guarantee actively prevents routing data living in the payload, yet the hub requires `to`. The tension is structural.
- **v1 convention (Aen-ratified, courier scope, no protocol change)**: (1) single configured outbox → its one destination; (2) `<team>-bridge` name → strip `-bridge` → `<team>` (hub §1 example `hr-devs-bridge`).
- **Undefined case** (one outbox → MULTIPLE teams): courier **refuses-and-retains** — logs, holds in spool, never drops (hints §7 no-TTL); does NOT guess. **RESOLVED 2026-06-15 (CR-4)**: refuse-and-retain ratified normative v1; single-outbox multi-dest fan-out OUT OF SCOPE; alternatives B/C rejected (kept as fallbacks). See `decisions/fan-out-routing-per-destination-outboxes-cr4.md`.
- **Generalizable lesson**: when a wire protocol forwards an opaque payload verbatim, routing metadata not IN the payload must come from the edge component; any uncovered case refuses-and-retains, never silently drops or guesses.
- Evidence: courier `deposit_spool()` + `_outbox_to_team()` (returns None + logs on undefined case); protocol §4. Confidence high.

(*FR:Herald* submitted; *FR:Callimachus* filed)
