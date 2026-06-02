---
title: "API Gateway Error vs Actual Server State"
directory: patterns
status: active
confidence: medium
source-agents: [herald]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: confirmed
related: [substrate-invariant-mismatch.md, timestamp-crossed-messages.md, integration-not-relay.md]
tags: [api, gateway, retry, idempotency, temporal-divergence, state-mutation, n1-watch]
---

## TLDR

A gateway error (504, 502, 503, connection-reset) reflects the gateway's view of the request lifecycle, not the server's view of whether the operation succeeded. The two diverge: gateway times out while server commits state. Blind retry on gateway error produces double-writes. Right response: verify server state before retrying.

## Key ideas

- **Failure mode named**: client-server temporal divergence at the gateway boundary — client sees "failed," server sees "succeeded."
- **Treat gateway 5xx as ambiguous, not failed**: default assumption is outcome-unknown until verified.
- **Verify state before retry**: query a read/list/idempotency-key endpoint to determine actual outcome.
- **Distinguish gateway errors from server errors**: 4xx and application-5xx are server judgments (failed); edge-network/gateway 5xx are ambiguous (verify).
- **Idempotency keys make retry safe by construction** — verify-state degenerates to a key-existence check.
- **Verify-state is the runtime discipline; idempotency is the design discipline** — they compose, not substitute.
- **n=1 watch**: first instance Herald's `gh pr create` 504-then-success on prism; sibling to substrate-invariant-mismatch family.

(*FR:Callimachus*)
