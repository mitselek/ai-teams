# Webhook trigger + Cloudflare Sandboxes — concrete-action surface

**Task #6 deliverable. Audience: Hopper (execution), Brunel + Herald (design review). Date: 2026-05-26.**

Sources:

- `~/Documents/github/.mmp/claude-managed-agents/` @ HEAD — README, `docs/architecture.md`, `docs/isolate-vs-vm-sandboxes.md`, `src/webhooks.ts`, `src/index.ts`, `src/isolate/runner.ts`.
- `https://platform.claude.com/docs/en/managed-agents/` (top-level 404'd on direct fetch; `https://docs.standardwebhooks.com/verifying` is the canonical spec the reference implementation cites verbatim).
- `https://developers.cloudflare.com/sandbox/` + `/sandbox/bridge/http-api/`.

**Companion doc (Round-1-targeted, Herald G2 fold):** `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` — drills the inter-agent A→B message delivery path on top of this substrate map. Read this doc for the surface; read that one for the Round-1 cross-agent comms shape.

**Scope note (added 2026-05-26 post-DECISION):** PO ratified Brunel's Path 1 — Isolate-only for Round 1. The MicroVM coverage in §3 and §4 is retained as the "what we explicitly chose against in Round 1" comparator; treat it as Round-2+ reference, not active design surface.

---

## §1 — What Anthropic POSTs to `/webhooks`

### Request shape

| Element | Value |
|---|---|
| Method | `POST` |
| Path | `/webhooks` (caller-chosen; configured in the Claude Platform Console webhook settings) |
| Content-Type | `application/json` |
| Body | JSON `WebhookEvent`. See §1.1 |

### Required headers (Standard Webhooks spec)

| Header | Purpose |
|---|---|
| `webhook-id` | Unique delivery id; also part of the signed input |
| `webhook-timestamp` | Unix seconds; used for ±300s replay-window check |
| `webhook-signature` | Space-separated list of `v1,<base64-hmac-sha256>` values (one per active key version) |

The signed input is the literal string `${webhook-id}.${webhook-timestamp}.${rawBody}` with HMAC-SHA256 keyed by the webhook secret. Secret format: `whsec_<base64>` prefix expected; raw bytes accepted as fallback. **Verify before parsing.**

If any of the three headers is missing → return `401 {"error":"missing signature"}`. If signature is invalid → return `401 {"error":"invalid signature"}`. If JSON parse fails → return `400 {"error":"invalid JSON"}`.

### §1.1 — Body shape (`WebhookEvent`)

```jsonc
{
  "id": "evt_…",                // event id
  "timestamp": "<ISO-8601 or unix-ms>",
  "data": {
    "type": "session.status_run_started" |
            "session.status_terminated" |
            "session.status_idled" |
            "...",              // other event types are persisted but ignored by current dispatcher
    "id": "sess_…",             // session id
    // additional event-specific fields under data.*
  }
}
```

Field discipline observed in `src/webhooks.ts:336–392`:

- Anthropic test pings and unknown event types may NOT have the strict `{ data: { type, id } }` shape. Code defensively coerces.
- `event.id` may be absent — log it as `(no-id)` and persist anyway.
- Whatever `data.*` field names arrive are recorded so the egress-policy matcher UI can suggest them — this is a passive side-effect; not required for round-1.

### §1.2 — Response shape Anthropic expects

| Case | Response |
|---|---|
| Signature OK + `session.status_run_started` happy path | `200 {"status":"ok","spawned":[…]}` |
| Signature OK + drain failed | `200 {"status":"ok","drainError":true}` (still 200 — see below) |
| Signature OK + `session.status_terminated` / `session.status_idled` | `204` no body |
| Signature OK + unknown event type | `204` no body |
| Missing signature headers | `401 {"error":"missing signature"}` |
| Bad signature | `401 {"error":"invalid signature"}` |
| Bad JSON | `400 {"error":"invalid JSON"}` |

**Critical invariant from `src/webhooks.ts:408–410`:** even when downstream dispatch fails, return 2xx — because Anthropic retries non-2xx responses indefinitely, and an event already persisted in D1 should not be re-delivered. The cron + the next webhook re-drain idempotently.

---

## §2 — Auth + scope gotchas (S35 DECISION context)

Reference repo uses three credentials with three distinct purposes:

| Secret | Format | Used by | Used for |
|---|---|---|---|
| `WEBHOOK_SECRET` | `whsec_<base64>` (Standard Webhooks) | Worker (verify inbound) | HMAC-verifying Anthropic → us deliveries |
| `ANTHROPIC_ENVIRONMENT_KEY` | `sk-ant-oat01-…` (env key, NOT api key) | Worker (auth outbound) | `work.poll`, `ack`, heartbeat, force-stop, session event stream |
| `ANTHROPIC_API_KEY` | `sk-ant-…` (regular API key) | Worker (resolve agent metadata) | `beta.sessions.retrieve(sessionId)` to read `session.agent.id` |

### S35-DECISION cross-check — using an OAuth subscription token as `ANTHROPIC_API_KEY`

The reference repo distinguishes `ANTHROPIC_API_KEY` (regular key) from `ANTHROPIC_ENVIRONMENT_KEY` (env key, `sk-ant-oat01-…` prefix). The S35 decision to wire an OAuth subscription token into the `ANTHROPIC_API_KEY` slot is **a structural mismatch with the reference implementation** — that slot is hit for `beta.sessions.retrieve(sessionId)` (anthropic SDK call against `api.anthropic.com`), not for environment polling.

**Specific failure modes Hopper should expect / verify:**

1. **Double-auth header rejection.** Line 39-48 (`bearerClient` helper): `apiKey: null` is set explicitly to prevent the SDK from backfilling `ANTHROPIC_API_KEY` from `process.env` (which is populated under `nodejs_compat`). If both auth headers go out, "the managed-agents server rejects that combo with 401 on per-session endpoints." If our OAuth token is wired in via env-var path, the Anthropic SDK may attach BOTH and 401 every per-session call. Mitigation: explicit `authToken:` / `apiKey: null` pattern from `bearerClient`.
2. **Scope mismatch on the polling endpoint.** `beta.environments.work.poll(env.ENVIRONMENT_ID, …)` requires the environment key (`sk-ant-oat01-…`), not a generic API token. An OAuth subscription token may have entirely different scopes (`messages:write` rather than `environments:poll`). Verify scope grant on the OAuth token before assuming it can replace the env key.
3. **Two slots, two tokens.** The reference uses TWO distinct credentials for outbound work — env key for polling, regular API key for session metadata lookup. A single OAuth token may not satisfy both calls if its scope is narrower than the union. Document which call we expect each token to serve before Round 1 dispatch.

**Concrete action for Hopper:** before going live, run a smoke test that exercises (a) Standard-Webhooks signature verify with our `WEBHOOK_SECRET`, (b) `work.poll` with our chosen env-credential, (c) `sessions.retrieve` with our chosen session-metadata credential. Don't assume one token covers all three.

---

## §3 — Sandbox creation from a webhook handler (Isolate path)

For Round 1 the team chose Isolate sandboxes (per S35 carry-over). Isolate sandbox creation is **not a REST API call** — it's a Durable Object dispatch. The shape:

```ts
// inside the webhook handler, after signature + event-type checks pass
const runner = getIsolateRunner(env, sessionId);   // returns a DurableObjectStub
const wasLive = await runner.isLive();              // RPC on the stub
if (!wasLive) {
  await runner.start({
    sessionId,
    workId: work.id,
    environmentId: env.ENVIRONMENT_ID,
    baseURL,            // Anthropic API base; defaults to api.anthropic.com
    agentId,            // optional — drives the tool-catalog audit warning
  });
}
```

`getIsolateRunner` is `env.IsolateRunner.get(env.IsolateRunner.idFromName(sessionId))` — the Durable Object stub is **derived deterministically from the session id**, so the same session always routes to the same DO. The DO itself extends the Cloudflare Agents SDK `Agent` class (line 4 of `src/isolate/runner.ts`), which is what gives it SQLite-backed `Workspace` storage that survives hibernation.

### Required wrangler bindings for the Isolate path

```jsonc
"durable_objects": {
  "bindings": [
    { "class_name": "IsolateRunner", "name": "IsolateRunner" }
  ]
}
```

Plus, to enable code-execution tools (`execute`, `run_file`) inside the isolate sandbox:

```jsonc
// Worker Loader binding — Workers Paid plan required
"unsafe": { "bindings": [{ "name": "LOADER", "type": "worker-loader" }] }
```

`LOADER` is what enables `codemode` execution inside isolate. Without it, the isolate sandbox can still do workspace edits (`cf_read`/`cf_write`/`cf_edit`/`cf_grep`) but can't run arbitrary code.

### Dashboard-vs-API trigger paths

- **Dashboard trigger** = clicking "Start session" in the CMA UI; this resolves through `apiApp.fetch` (Hono REST API at `/api/*`) which records intent in D1; Anthropic then issues a webhook to drive actual sandbox creation. **The dashboard does NOT create sandboxes directly.**
- **API trigger** = Anthropic-driven webhook arrives → our `handleWebhook` → `drainWork()` → `IsolateRunner.start()`. This is the only sandbox-creation entry point.
- **No direct admin "create-a-sandbox" endpoint.** All sandbox creation is webhook-driven from Anthropic; the dashboard is a control surface that asks Anthropic to issue the webhook.

This matters for Round 1: **we cannot create a sandbox without an inbound webhook**. Any test scaffolding has to either (a) invoke `handleWebhook` directly in test mode, or (b) trigger a real Anthropic session start. There is no "sandbox.create" API the dashboard calls behind the scenes.

### MicroVM path (for completeness, not Round 1)

```ts
const stub = getSessionSandbox(env, sessionId);     // env.Sandbox DO stub
const wasLive = await stub.isLive();
if (!wasLive) {
  await stub.dispatch({ sessionId, workId, environmentId, baseURL });
}
```

Same shape, different DO class. Requires `containers` block in `wrangler.jsonc` declaring image + instance type. Workers Paid plan required (per README line 18-23).

---

## §4 — Cloudflare Sandboxes API surface (the public-facing surface, distinct from §3)

When Hopper or others reach for the public `developers.cloudflare.com/sandbox/` docs, they're looking at the Sandbox SDK. Two relevant code-shapes:

### §4.1 — In-Worker binding (used by MicroVM backend internally)

```ts
import { getSandbox } from "@cloudflare/sandbox";

const sandbox = getSandbox(env.Sandbox, 'user-123');   // env.Sandbox is the DO binding
const result = await sandbox.exec('python --version');
```

`env.Sandbox` is a Container-enabled Durable Object binding; instantiation is via `getSandbox()` factory, not direct stub access. Configuration:

```jsonc
"containers": [{
  "class_name": "Sandbox",
  "image": "./Dockerfile",
  "instance_type": "standard-1",
  "max_instances": 100
}]
```

### §4.2 — Sandbox bridge (HTTP API for non-Worker callers)

Cloudflare ships a "Sandbox bridge" — a separate Worker you deploy that exposes the sandbox SDK over HTTP for any language. Reference: `https://developers.cloudflare.com/sandbox/bridge/http-api/`. Not relevant to Round 1 (we control the Worker directly), but worth knowing exists.

### Authentication / quotas

- **Workers Paid plan minimum.** Both Cloudflare Containers (MicroVM) and Worker Loader (Isolate `execute`) are Paid-and-up.
- **No separate Sandbox API token.** Auth is by Worker binding presence; the binding is granted by `wrangler.jsonc` at deploy time. The only top-level credential needed is the `wrangler login` session at deploy time.
- **Rate limits not documented on the marketing page;** check `developers.cloudflare.com/workers/platform/limits/` for the live numbers. `max_instances: 100` is the per-deployment cap declared in the reference (configurable).

---

## §5 — Concrete-action summary

### For Hopper (Round 1 execution)

1. **Implement Standard Webhooks verification verbatim from `src/webhooks.ts:74–126`.** Don't roll your own HMAC — the spec has subtleties (whsec_ prefix, space-separated multi-version signatures, ±300s replay window).
2. **Smoke-test all three Anthropic credentials separately** before Round 1 dispatch — see §2's three failure modes. Especially: verify the OAuth subscription token Just Works on `work.poll` AND `sessions.retrieve`, or split into two tokens.
3. **Make webhook handler always return 2xx** for any signature-valid + JSON-valid event. 401/400 only for invalid signature/JSON. This is the difference between a clean retry-on-failure flow and an infinite Anthropic retry loop.
4. **Dispatch is Durable-Object stub RPC, not HTTP.** `getIsolateRunner(env, sessionId).start({…})` — no fetch, no api call. The DO binding does the routing.
5. **Add `webhook-id`/`webhook-timestamp`/`webhook-signature` to any path-rule allowlist BEFORE going live.** Task #1 (path-rule bypass on `/webhooks`) is precondition.

### For Brunel + Herald (design review)

1. **Sandbox creation is exclusively webhook-driven.** Round 1's lifecycle.md should make this explicit — there's no "admin creates a sandbox" path, only "Anthropic decides to wake a session, we react." Confirm this matches the lifecycle doc's framing.
2. **`session.id` is the natural primary key everywhere.** Webhook event ids are persisted but not used for dispatch; session id is what routes to the DO and what every API call needs. Substrate.md should treat session_id as the substrate boundary, not webhook event id.
3. **Two credentials minimum, possibly three.** If Round 1 substrate assumes a single Anthropic token, it's modelling an incomplete picture — confirm the env-key-vs-api-key split survives our OAuth-token decision (S35).
4. **No retry queue in our control.** Anthropic retries on non-2xx; we never originate retries. Comms.md should not propose a retry-worker or DLQ — it's structurally not our responsibility.
5. **Isolate sandbox DO survives hibernation but not deletion.** SQLite state persists across DO sleep; webhook re-arrives, `start()` re-attaches. But if the DO is destroyed (deploy that drops the binding), state is lost. R2 snapshots are MicroVM-only.

### Open questions surfaced (NOT for me to answer)

- Q1 (for PO): which Anthropic token model are we committing to long-term — single OAuth token, dual env-key+api-key, or some other shape? Decision affects substrate.md.
- Q2 (for Brunel): should the lifecycle doc capture the "always-2xx" invariant explicitly, or is that an implementation detail below the design surface?
- Q3 (for Herald): the egress-policy attach step happens inside the DO `start()`, not in the webhook handler. Should comms.md reference this, or is it scoped out of Round 1?

---

(*FR:Finn*)
