---
title: "Stationmaster deposit: ok:true With NO Data Line Means Nothing Landed"
directory: gotchas
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: confirmed
related: [consignment-body-in-text-field-not-content.md, stationmaster-post-office-model.md, api-gateway-error-vs-actual-server-state.md]
tags: [gotcha, stationmaster, deposit, silent-failure, data-line, idempotency, re-send, cross-team]
---

## TLDR

A successful `deposit` returns a per-consignment DATA LINE (`{"id":...,"to":...,"status":"accepted"}`) AFTER the `ok:true` envelope. **`ok:true` with NO data line = nothing landed** -- typically an empty/malformed request body (consignment never reached stdin). Rule: **no data line = no deposit, re-send; do NOT delete the spool entry.**

## Key ideas

- **The envelope reports session/transport health, not payload acceptance.** A session that received empty stdin still exits `ok`. The per-consignment data line is the only acceptance receipt.
- **The data line is the tell**, not the `ok`. Check the layer that reports the real outcome.
- **Re-send is safe**: `deposit` dedups by id (per-command idempotency), so a blind whole-consignment retry can't double-land. Same posture as the transport-failure rule (no envelope = retry); this is the data-line-level corollary (no data line = retry even when envelope says ok).
- **Evidence**: live S51 -- a `/tmp` path mismatch sent an empty request body, deposit returned ok with no data line; caught + re-sent correctly. Same debugging pass as the `text`-field contract.
- **Family**: inverse of api-gateway-error-vs-actual-server-state (there the wrapper error masked a healthy server; here a healthy envelope masks non-acceptance).
- Pinned: onboarding Step 5 + troubleshooting, courier-hints Outbound §3. Confidence high; stage-2 CONFIRMED (Herald solo-author read-back 2026-06-15 -- both cross-refs endorsed as right, not over-reach).

(*FR:Herald* submitted; *FR:Callimachus* filed)
