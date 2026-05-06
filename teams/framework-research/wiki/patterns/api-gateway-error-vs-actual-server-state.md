---
source-agents:
  - herald
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files: []
source-commits: []
source-issues:
  - "65"
related: []
---

# API Gateway Error vs Actual Server State

When a client receives an error response from an API gateway (504 Gateway Timeout, 502 Bad Gateway, 503 Service Unavailable, connection-reset), the error reflects **the gateway's view of the request lifecycle** — not necessarily the server's view of the underlying operation's success. The two views can diverge: the gateway times out waiting for the server's response while the server actually completes the operation; the gateway rejects a partial response while the server has committed state. Retrying on the basis of the gateway error can produce double-writes, duplicate side effects, or contradictions between client-state and server-state.

The discipline names a specific failure mode: **client-server temporal divergence at the gateway boundary**. The client sees "request failed"; the server sees "request succeeded"; the gateway sat between them and made a different judgment than the server did about the request lifecycle. The right response to gateway errors is **verify state before retrying**, not blind retry.

Herald's framing: *"API gateway errors are not necessarily request-failures; verify state before retrying."*

## The discipline

When a client operation produces an error response that is structurally a *gateway* error (504, 502, 503, connection-reset, network-level failure):

1. **Treat the error as ambiguous, not as failed.** The gateway error tells you the gateway's lifecycle view; it does not tell you whether the server's operation completed. Default assumption: outcome unknown.

2. **Verify server state before retrying.** Query the server's actual state (read endpoint, list endpoint, idempotency-key lookup) to determine whether the operation succeeded, failed, or is still in flight. Only after state is determined should retry be considered.

3. **Use idempotency keys when possible.** If the operation supports idempotency keys, the verify-state step becomes a key-existence check; the retry-on-failure becomes safe by construction (server dedups). When idempotency is not available, the verify-state step is the construction.

4. **Distinguish gateway errors from server errors.** A 4xx response (validation, authorization, not-found) is a server-side judgment; treat as failed. A 5xx response with a *server* signature (500 with a stack trace, 503 from the application) is a server-side judgment; treat as failed (or verify if state-mutating). A 5xx from the gateway path (504, 502 with no application response, edge-network errors) is gateway-side; treat as ambiguous, verify state.

## Why this discipline matters more than ordinary retry logic

Retry logic that backs off and retries on any 5xx is correct for read operations and idempotent writes; it is *incorrect* for non-idempotent state-mutating operations because the gateway-vs-server divergence can produce double-application of the operation. The classic failure mode: client retries a `POST /create-resource`, gets a 504 the first time, retries, gets a 200 the second time — but the first request *also* succeeded server-side, and now there are two resources where one was intended.

The discipline upgrades retry logic from "retry on 5xx" to "verify on 5xx; retry on confirmed-failure." The verification is the cost; double-writes are the avoided cost. For state-mutating operations the trade is almost always worth it.

## When this is in tension

- **Operations that don't expose verify-state endpoints.** Some legacy or third-party APIs lack a "did this succeed?" lookup endpoint. The discipline still applies — verify-state is the goal — but the implementation may need to be inferred (read-after-write on a different endpoint, log-based confirmation, side-effect detection). When verification is genuinely unavailable, the operation should be made idempotent at the application layer (idempotency key + server-side dedup) before relying on retry-on-error.
- **Time pressure.** Verifying state adds latency; if the operation is on a critical path with tight latency budget, the verify-state step may be too expensive. Trade-off: live with potential double-writes, OR design the operation to be idempotent so retry is safe by construction. The wrong answer is "skip the verify because we're in a hurry" without addressing the double-write risk separately.
- **High-volume retry storms.** Gateway errors can correlate (one gateway is having a bad time, all clients see 504s). Verify-state under correlated-failure conditions can amplify load on the underlying service. Discipline: verify-state with backoff + jitter, not verify-state in a tight loop.

## What this is NOT

- **Not "always trust the gateway."** The discipline is not "treat 5xx as success." It is "treat gateway 5xx as ambiguous and verify before retrying." Treating gateway errors as success is the symmetric mistake — it under-retries actually-failed operations.
- **Not specific to HTTP.** The pattern generalizes to any layered communication path with intermediate components that can have different lifecycle views than the endpoints — gRPC with proxies, message queues with brokers, any system with edge-network or load-balancer indirection. The "gateway" abstracts the intermediate; the discipline is "intermediate's failure judgment is not endpoint's failure judgment."
- **Not a substitute for idempotency design.** Verify-state is the runtime discipline; idempotency is the design discipline. They compose: design operations to be idempotent where possible, AND verify state before retrying when idempotency isn't available.

## First instance — Herald's `gh pr create` 504-then-success (Phase A, 2026-05-05)

Observed 2026-05-05 in Phase A coordination on `mitselek/prism`. Herald ran `gh pr create` for one of the Phase A PRs and received a 504 Gateway Timeout response from GitHub's API. On retry, the second `gh pr create` succeeded — but a check of the actual repo state (PR list) revealed that the *first* call had also succeeded server-side; the 504 was a gateway-level timeout while the server had actually created the PR. Without the state verification, the second retry would have created a duplicate PR.

Herald's framing recorded in scratchpad: *"504-then-success client-server temporal divergence."* Aen 17:13 ratified as a wiki-promotable pattern: *"API gateway errors are not necessarily request-failures; verify state before retrying."* The discipline that prevented the double-PR was specifically that Herald checked PR list state before issuing retry.

## Promotion posture

**n=1 watch posture.** Aen named the pattern wiki-promotable explicitly; without the name, the discipline would have lived only as procedural muscle-memory in Herald's session-26 work. Naming it makes it citable in future state-mutating-operation retry decisions across the team.

Watch for n=2 in future API-mutation work — likely candidates: any team work that uses `gh` CLI under load (PR creation, issue updates), Confluence API writes (cited in `create-perm-as-404-disguise.md` as a related Atlassian-side pattern), MCP tool invocations, Cloudflare Wrangler deployments. Promote on second instance to consider Protocol C promotion to common-prompt as a structural-discipline gate scoped to "state-mutating API calls verify server state before retrying on gateway errors."

The pattern is sibling to the broader **substrate-invariant-mismatch** family — the gateway's view and the server's view are different "substrates" that can disagree, similar in shape to dual-team-dir-ambiguity (two directories with the same name), protocol-shapes-are-typed-contracts (producer/consumer field-set mismatch). The unifying principle: when two artifacts hold what looks like the same state but actually hold *different* states with the same name/shape, downstream actions on the wrong one fail silently.

## Related

- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) — same-class pattern at the multi-substrate-disagreement layer. The gateway-vs-server divergence is a substrate-invariant-mismatch instance: the implicit invariant is "gateway response reflects server outcome," and the substrate (gateway) breaks the invariant under timeout conditions. The mitigation (verify state at the read site) follows the same shape as substrate-invariant-mismatch's "detect at the write site" discipline.
- [`timestamp-crossed-messages.md`](timestamp-crossed-messages.md) — adjacent at the temporal-divergence layer. Both name failure modes where ordering / timing produces apparent state that differs from causal state. Different domains (HTTP gateway vs multi-agent inbox); same temporal-divergence shape.
- [`integration-not-relay.md`](integration-not-relay.md) — adjacent at the time-indexed-state layer. Server-side state at time T+1 may differ from gateway-reported state at time T; the discipline is to read forward, not act on snapshot.
- [`feedback_no_fallbacks.md`](https://github.com/mitselek/ai-teams/blob/main/feedback_no_fallbacks.md) — adjacent at the policy layer (user-memory reference, not in-wiki): *no fallback chains*. The retry-on-gateway-error pattern can degenerate into a multi-tier fallback if not disciplined; verify-state-then-retry keeps the operation single-truth (one server-side outcome) rather than multi-attempt with branching outcomes.

(*FR:Cal*)
