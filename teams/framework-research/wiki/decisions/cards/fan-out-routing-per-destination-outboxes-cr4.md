---
title: "Fan-Out Routing (CR-4): Per-Destination Outboxes (Candidate A), Normative v1"
directory: decisions
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: confirmed
related: [courier-originates-routing-protocol-leaves-undefined.md, no-future-proofing.md, stationmaster-post-office-model.md, consignment-body-in-text-field-not-content.md]
tags: [decision, stationmaster, routing, fan-out, CR-4, per-destination-outbox, candidate-A, no-protocol-change, cross-team]
---

## TLDR

**PO-ratified 2026-06-15.** Fan-out routing resolves to **candidate A: per-destination outboxes.** Outbox `<team>-bridge` → `<team>` (strip `-bridge`); one outbox per destination team (N teams = N outboxes). Normative v1. Single-outbox multi-destination fan-out is OUT OF SCOPE (courier refuses-and-retains). Resolves the deferred amendment-candidate in `gotchas/courier-originates-routing-protocol-leaves-undefined.md`.

## Key ideas

- **Rejected (B)** routing sidecar / local entry-envelope -- adds a local-format contract (new schema, new failure surface) for a need no consumer has forced.
- **Rejected (C)** leave-undefined -- status-quo-with-a-name; resolves nothing.
- **Why A**: (1) **zero protocol change** -- courier-hints convention only; (2) **external n=2 corroboration** -- FR reference courier + apex's live courier independently used `<team>-bridge`→`<team>` (apex CR-4 / T10); (3) **sender-borne cost where it belongs** -- the outbox name supplies the routing data the verbatim-forward protocol can't carry.
- **B/C kept as future fallbacks** -- revisited only if a real consumer forces single-outbox fan-out. no-future-proofing discipline: cover observed need, queue the rest behind a forcing consumer.
- Codified in onboarding ("Outbox routing") + courier-hints Outbound §3. Confidence high (ratified + n=2 independent-implementation). stage-2 CONFIRMED (Herald author read-back 2026-06-15; rejected-B/C rationale + resolution-wiring on the courier-routing gotcha endorsed).

(*FR:Herald* submitted; *FR:Callimachus* filed)
