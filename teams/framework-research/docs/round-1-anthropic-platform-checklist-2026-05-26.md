# Round 1 -- Anthropic Platform-Side Checklist

**For PO (operator), Hopper (executor), Brunel (substrate validator). Date 2026-05-26. Author Finn.**

This is a **pre-flight viability checklist** -- what gets configured in the Anthropic Console + verified for the EVR Anthropic environment (`env_01PpqWL9BfKZYD7SKPUEryRu`) BEFORE Round 1 dispatch. Source-of-truth: `claude-api` skill / `shared/managed-agents-*.md`. Template structure adapted from skill `shared/managed-agents-onboarding.md` §3 Pre-flight viability check.

**Companion docs:**

- Webhook + sandbox surface map: `docs/webhook-sandbox-research-2026-05-26.md`
- Herald-G2 cross-agent comms brief: `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md`
- W4 wake-mechanism finding (supersedes G2 Step 5): `docs/wake-mechanism-w4-finding-2026-05-26.md`

**Scope:** Anthropic Console and platform-side configuration. Code-side (Worker, DOs, bindings) is out of scope -- that's substrate.md / Hopper's territory.

---

## §1 -- Pre-flight viability reconciliation

The skill template's §3 walks each verb in the agent's job against four gap-classes. For Round 1 (Pilot-A and Pilot-B exchanging messages via mailboxes), apply this lens:

| Gap class | Round 1 verb → resource check | Operator verifies |
|---|---|---|
| **Tool / integration** | "Pilot-A sends a message" → custom tool `send_message` registered at agent-create | Pilot-A's `tools[]` includes `{type: "custom", name: "send_message", input_schema: {...}}`. Tool name not colliding with platform reserved prefix. |
| **Tool / integration** | "Pilot-B receives a message" → mailbox-drain-on-session-start | Pilot-B's `IsolateRunner.start()` (code-side) drains mailbox before agent loop. NOT a custom tool. Operator just needs to confirm Pilot-B's agent-create succeeded. |
| **Credential / access** | "Mailbox handler calls `sessions.create(agent=pilot_b.id, ...)`" → OAuth token has `sessions.create` scope | **PO must verify OAuth subscription token scope grants `sessions.create`.** See §3. If missing, inter-agent wake silently fails (403). |
| **Credential / access** | "Worker long-polls `environments.work.poll`" → credential has env-polling scope | **PO must verify token scope grants `environments.work.poll`.** Reference CMA repo splits this from API key -- our OAuth token may need both scopes. |
| **Credential / access** | Webhook signature verify | `WEBHOOK_SECRET` (Standard Webhooks `whsec_<base64>`) present in Worker secrets. Set up via Anthropic Console Webhooks settings. |
| **Data** | Pilot-A / Pilot-B agent identities | Both agents created via `client.beta.agents.create(...)`. Agent IDs persisted (NOT recreated per session). Agent versions pinned or "latest" -- operator confirms. |
| **Data** | Environment `env_01PpqWL9BfKZYD7SKPUEryRu` exists and is provisioned | Environment ID is set as Worker `ENVIRONMENT_ID` secret. `config.type` is `cloud` (Round 1 chose cloud-managed; `self_hosted` is Round 2+). |
| **Prompt quality** | Pilot-A and Pilot-B have `system` prompts | Operator confirms `system` field is set on both agent-create calls. If missing, agent has no persona/goal -- invalid setup. |
| **Prompt quality** | "Done" criteria for Round 1 | Operator confirms: what observable state means Round 1 succeeded? E.g., "Pilot-A sent N messages, Pilot-B received all N, both sessions transitioned to `terminated`." If undefined, Round 1 is open-ended. |

---

## §2 -- What gets configured in the Anthropic Console

**One-time setup, before Round 1 dispatch. Operator-side actions in the platform.claude.com Console.**

### 2.1 Environment configuration

In Console → Workspaces → (your workspace) → Environments → `env_01PpqWL9BfKZYD7SKPUEryRu`:

- [ ] Confirm environment exists and `config.type` is `cloud` (NOT `self_hosted` for Round 1)
- [ ] If networking is `limited`: ensure the Anthropic API host is reachable from the Worker's egress (default: yes; if our Cloudflare Worker has any egress restriction, confirm `api.anthropic.com` is in allowed-hosts)
- [ ] Note the `environment_id` (already known: `env_01PpqWL9BfKZYD7SKPUEryRu`) -- must match Worker's `ENVIRONMENT_ID` secret

### 2.2 Webhook registration

In Console → Manage → Webhooks:

- [ ] Webhook URL: `https://<our-worker-domain>/webhooks` -- operator pastes Worker URL once Hopper confirms deploy
- [ ] HTTPS on port 443, publicly resolvable hostname (Cloudflare Workers satisfy this by default)
- [ ] Subscribed event types: at minimum `session.status_run_started` (drives our `drainWork` flow). Optionally `session.status_terminated`, `session.status_idled` for full lifecycle visibility.
- [ ] Generate signing secret: copy the `whsec_<base64>` value, paste into Worker's `WEBHOOK_SECRET` secret via `npx wrangler secret put WEBHOOK_SECRET`. Secret is shown once -- store it before navigating away.

### 2.3 Agent creation (one-time, NOT per dispatch)

In Console (or via `ant beta:agents create < pilot-a.agent.yaml`) -- operator's choice. Recommend YAML + `ant` CLI per skill's onboarding doc (version-controlled definitions in our repo).

- [ ] Pilot-A agent created with `model: claude-opus-4-7` (or chosen model), `tools[]` including `send_message` custom tool, `system` prompt set
- [ ] Pilot-B agent created with same structure (mirror of Pilot-A or differing per pilot-task design)
- [ ] **Persist BOTH agent IDs to Worker secrets/D1.** Round 1 must NOT call `agents.create()` per dispatch -- that's the #1 anti-pattern flagged in the skill onboarding doc.
- [ ] Optional but recommended: pin agent `version` explicitly in `sessions.create(agent={type: "agent", id, version: N})` so Round 1 dispatches are reproducible against a known agent config.

### 2.4 OAuth subscription token / credentials

Per S35 DECISION and Task #10 follow-up:

- [ ] Operator confirms OAuth subscription token in hand
- [ ] **Scope check 1:** token has `sessions.create` permission (load-bearing for inter-agent wake -- see W4 finding doc)
- [ ] **Scope check 2:** token has `environments.work.poll` permission (load-bearing for worker dispatch loop)
- [ ] **Scope check 3:** token has `sessions.retrieve` permission (load-bearing for reference-CMA-style `resolveBackend` lookups)
- [ ] If single OAuth token covers all three: use as `ANTHROPIC_API_KEY` Worker secret AND drop `ANTHROPIC_ENVIRONMENT_KEY` from required-secrets list
- [ ] If OAuth token covers only some: keep dual-credential model from reference CMA repo. Task #10 (Round 1 op-step-2) is where PO finalizes this. **Do NOT proceed to Round 1 dispatch until Task #10 is resolved.**

---

## §3 -- Per-dispatch verification (operator runs these before each Round 1 invocation)

**These are smoke-tests Hopper or PO runs against the configured platform-side state before kicking off a Round 1 session pair. Run-once for Round 1 dispatch #1; re-run if any §2 setting changes.**

### 3.1 Credential smoke-tests

Per the comprehensive doc §2 (three concrete credential failure modes). Use `curl` or `ant` CLI:

- [ ] **Test A -- webhook signature verify path.** Send a test webhook from Anthropic Console → Webhooks → Test. Confirm Worker `/webhooks` endpoint returns 2xx + recorded the event in D1.
- [ ] **Test B -- `sessions.create` smoke.** Run `ant beta:sessions create --agent <pilot_b_id> --environment-id env_01PpqWL9BfKZYD7SKPUEryRu --title "smoke-test"` (or equivalent via SDK). Expect 201 + new `session_id`. If 403: OAuth token missing `sessions.create` scope → STOP, escalate to PO.
- [ ] **Test C -- `work.poll` smoke.** Run `EnvironmentWorker.run_one()` (or `ant beta:worker run` for one cycle) against the test session from Test B. Expect work item to be picked up + dispatched. If poll returns 401: token missing `environments.work.poll` scope → STOP, escalate to PO.
- [ ] **Test D -- `sessions.retrieve` smoke.** Retrieve the session created in Test B via `client.beta.sessions.retrieve(session_id)`. Expect 200 + session object. If 403: token missing `sessions.retrieve` scope → STOP, escalate to PO.

If all four smoke-tests pass: proceed to Round 1 dispatch. If any fail: STOP, do not dispatch -- the failure mode is silent in production (timeouts / no-op / silent wake failure) and won't surface until Pilot-A's first message attempt.

### 3.2 Agent-state smoke-tests

- [ ] **Pilot-A exists and is current.** `ant beta:agents retrieve --agent-id <pilot_a_id>` → 200 + expected `name`/`model`/`tools[]` shape
- [ ] **Pilot-B exists and is current.** Same for Pilot-B
- [ ] **Neither agent is archived.** `archived_at` is null in both retrieve responses. Archive is permanent + makes agent unreferenceable by new sessions -- fatal for Round 1 if accidental.
- [ ] **`send_message` custom tool is in Pilot-A's `tools[]`.** Operator visually confirms in retrieve response.

### 3.3 Environment-state smoke-tests

- [ ] **Environment is not archived.** Same archive check as above for `env_01PpqWL9BfKZYD7SKPUEryRu`.
- [ ] **Worker `ENVIRONMENT_ID` secret matches `env_01PpqWL9BfKZYD7SKPUEryRu` exactly.** Typo or stale value → all Round 1 traffic targets wrong environment → Anthropic returns 404 on session-create.

---

## §4 -- Round 1 anti-patterns to avoid

From the skill's `shared/managed-agents-overview.md` § Common Pitfalls + onboarding doc § Pre-flight:

- [ ] **Anti-pattern 1: Calling `agents.create()` on every dispatch.** Round 1 code MUST persist agent IDs in Worker secrets/D1 and reuse them. If Hopper's code path calls `agents.create()` per request, that's wrong -- flag immediately, refactor before dispatch.
- [ ] **Anti-pattern 2: Inline agent config on `sessions.create()`.** `model`/`system`/`tools` belong on `agents.create()`. If session-create call has these fields, that's wrong shape -- Anthropic API rejects.
- [ ] **Anti-pattern 3: Archiving in cleanup.** Worker cleanup code should NOT call `agents.archive()` / `environments.archive()` / `memory_stores.archive()` -- archive is **permanent + new sessions cannot reference archived resources**. Session archive is fine (sessions are per-run disposable); resource archive is fatal.
- [ ] **Anti-pattern 4: Returning non-2xx for valid webhooks.** Per comprehensive doc §1.2 -- invariant is always-2xx for signature-valid + JSON-valid events. Hopper's Worker code must follow this.
- [ ] **Anti-pattern 5: Putting OAuth token in agent system prompt or user messages.** Per skill `shared/managed-agents-client-patterns.md` Pattern 9 -- secrets in prompts/messages persist in event history, readable via the API for session lifetime. Tokens stay in Worker secrets, never in conversational content.

---

## §5 -- Round 1 exec-readiness gates

Before Hopper says "ready to dispatch," all of the following MUST be true. This is the gate I'd recommend Aen + PO sign off on:

- [ ] §2.1–2.4 setup complete (environment, webhook, agents, OAuth token in hand)
- [ ] §3.1 credential smoke-tests A/B/C/D all green
- [ ] §3.2 agent-state smoke-tests all green
- [ ] §3.3 environment-state smoke-tests all green
- [ ] §4 anti-patterns audited in Hopper's code path (none present)
- [ ] Task #10 (credential-shape decision) resolved by PO -- single-OAuth or dual-credential model committed
- [ ] Task #11 (wake mechanism) absorbed -- W4 framing confirmed, code path uses `sessions.create()` from mailbox handler
- [ ] Task #1 (path-rule bypass on `/webhooks`) resolved -- Round 0 verification complete

If ANY of the above is incomplete: Round 1 dispatch is NOT exec-ready. Operator escalates to Aen.

---

## §6 -- Open questions back to PO + Aen

(These are questions surfaced by this checklist that need PO/Aen decisions; NOT for me to resolve.)

1. **Q (PO):** When does the OAuth subscription token's scope get verified? Pre-Round-1 (smoke-tests in §3.1) is necessary but possibly insufficient -- long-running tokens may have their scopes narrowed mid-flight by upstream policy changes. Should we add a periodic scope-recheck (e.g., daily cron in Worker)?
2. **Q (PO):** For Round 1 reproducibility, do we pin agent `version` explicitly (`{type: "agent", id, version: N}`) or use string shorthand (`agent_id` → latest version)? Skill recommends pinning for reproducibility; pinning means agent updates require explicit Round 1 dispatch-config changes.
3. **Q (Aen):** Is the §5 exec-readiness gate the right shape for a "go/no-go" sign-off, or should it be folded into Brunel's substrate.md exec-readiness review per the existing review-task structure?
4. **Q (Aen):** Should §4 anti-pattern audit be done by me (extending Surface 1) or by Hopper (code-path self-review) or by Brunel (substrate validator)? Boundary unclear; my default is "Hopper self-audits, Brunel spot-checks, I'm done after this checklist."

---

(*FR:Finn*)
