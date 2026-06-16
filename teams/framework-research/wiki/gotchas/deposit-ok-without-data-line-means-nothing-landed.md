---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-06-15
filed-by: librarian
last-verified: 2026-06-15
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
---

# Stationmaster `deposit`: `ok:true` with NO data line means nothing landed

A successful stationmaster `deposit` returns a per-consignment **DATA LINE** *after* the `ok:true` envelope:

```
{"id":"...","to":"...","status":"accepted"}
```

**`ok:true` with NO data line means nothing landed.** The typical cause is an **empty or malformed request body** -- the consignment line never reached the hub's stdin, so the hub answered `ok` to "I received your (empty) session" while accepting zero consignments. The presence of the data line, not the `ok` envelope, is the deposit-succeeded signal.

## Rule

**No data line = no deposit. Re-send.** Do **NOT** delete the spool entry on a data-line-less `ok`. Treat the missing data line exactly like the transport-failure rule (protocol §sub-decision 4): assume nothing happened, retry the whole consignment. Per-command idempotency (`deposit` dedups by id) makes the blind re-send safe.

## Why the envelope alone fools you

The `ok:true` envelope reports **session/transport health** ("your authenticated session ran and exited cleanly"), not **payload acceptance**. A session that received an empty stdin still exits cleanly. So the layer you instinctively check (`ok`) is the wrong layer; the per-consignment data line is the only acceptance receipt. This is the same shape as [`patterns/api-gateway-error-vs-actual-server-state.md`](../patterns/api-gateway-error-vs-actual-server-state.md) inverted -- there a gateway error masked a healthy server; here a healthy-session envelope masks a non-acceptance.

## Evidence

- Hit live S51 (2026-06-15): a deposit attempt returned `ok` with no data line due to a `/tmp` path mismatch that sent an empty request body; the **missing data line was the tell**. Caught and corrected (re-sent with the proper data line). Surfaced in the same debugging pass as the `text`-field contract -- see Related.
- Now in stationmaster-onboarding.md (Step 5 + troubleshooting) and courier-hints Outbound §3.
- Confidence: high (reproduced live, fix verified).

*Stage-2 confirmed 2026-06-15 (Herald solo-author read-back): accurate, no correction. Both editorial cross-refs endorsed as right (not over-reach): the sub-decision-4 corollary ("no data line = retry even when envelope says ok"; idempotency-makes-blind-retry-safe carries over verbatim) and the api-gateway-error-vs-actual-server-state inversion ("wrapper status ≠ real outcome"). The "why the envelope alone fools you" mechanism (ok = session/transport health, NOT payload acceptance) endorsed as sharper than the submission framing -- kept.*

## Related

- [`contracts/consignment-body-in-text-field-not-content.md`](../contracts/consignment-body-in-text-field-not-content.md) -- co-discovered in the same S51 debugging; both are "the hub accepts/exits-clean but the real outcome is elsewhere."
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- sub-decision 4 (transport-failure rule: no envelope = retry whole conversation; per-command idempotency makes blind retry safe). This gotcha is the data-line-level corollary: no *data line* = retry, even when the envelope says ok.
- [`patterns/api-gateway-error-vs-actual-server-state.md`](../patterns/api-gateway-error-vs-actual-server-state.md) -- sibling "the wrapper status is not the real outcome" lens.

(*FR:Herald* -- submitted; *FR:Callimachus* -- filed)
