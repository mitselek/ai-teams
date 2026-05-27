---
title: Cloudflare Pilot — S35 Substrate State + S36 Decisions & Preparations + S37 Plan
date: 2026-05-26
author: aen
status: status-report
scope: Round-1 op-step-1 (path-rule bypass on /webhooks) execution-ready; downstream op-steps planned
audience: PO (Mihkel) + Hopper (executor) + Brunel (substrate validator) + Cal (knowledge-layer)
---

# Cloudflare Pilot — S35 Substrate State + S36 Decisions & Preparations + S37 Plan

## 1. CF substrate changes in previous session (S35, 2026-05-21 → 2026-05-26)

### 1.1 Deployment substrate established

Executed by Aen-direct per S35 DECISION (team-lead.md:51 — "Aen-direct execution sanctioned by PO for substrate operations Hopper couldn't reach via SSH paths"). Source: cloned CF managed-agents template at `~/Documents/github/.mmp/claude-managed-agents/`.

- **Worker:** `fr-cma-pilot` live at `https://fr-cma-pilot.evree.workers.dev/`
- **CF account:** EVR (`8f150f98013eec8cae0a9db20a010c49`)
- **Naming discipline:** experimental `fr-cma-pilot` prefix (visually distinct from production `conversations` / `vestlused` / `apex-research`)

### 1.2 Bindings provisioned

- **KV × 2:** `SECRETS` (id `cf67fa1020...`) + `EGRESS_POLICIES` (id `9780ffa017...`)
- **D1 × 1:** `fr-cma-pilot-db`, id `5d28cbc6-5b35-4479-9650-4d793ccbca44`
- **R2 × 1:** `fr-cma-pilot-snapshots`
- **DO classes declared in `wrangler.jsonc`:** `Sandbox`, `IsolateRunner` — both v1 migration as `new_sqlite_classes`
- **Container DO block:** **commented out** in `wrangler.jsonc:80-96` ("DISABLED FOR ROUND 0 (Isolate-only smoke test). MicroVM backend requires Docker for Dockerfile build at deploy time; not installed locally. Re-enable when (a) Docker installed locally, OR (b) deployed via Workers Builds.")
- **Cron trigger:** `"0 4 * * *"`
- **VPC bindings:** commented placeholder only — no actual VPC service bound

### 1.3 Worker-level secrets uploaded (4)

Per CF template `docs/securing-access.md:150-164` checklist:

| Secret | Purpose | Notes |
|---|---|---|
| `WEBHOOK_SECRET` | Anthropic-inbound HMAC verification (Standard Webhooks spec) | `whsec_<base64>` format |
| `ANTHROPIC_API_KEY` | Outbound to api.anthropic.com (sessions.retrieve etc.) | **OAuth subscription token (`sk-ant-oat...`) per S35 DECISION** — caveats: scope coverage, header format, audit attribution |
| `ANTHROPIC_ENVIRONMENT_KEY` | Control-plane work.poll/ack/heartbeat | sk-ant-oat01-… |
| (likely) `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` | R2 snapshot presigning per `wrangler.jsonc:139-142` | Counted as the 4th |

### 1.4 Anthropic platform-side

- Self-managed env `env_01PpqWL9BfKZYD7SKPUEryRu` configured
- Dashboard reports "ready for sandbox" state

### 1.5 What S35 explicitly did NOT do

- **EVR Cloudflare Access org-wide policy** still blocks Anthropic webhook delivery to `https://fr-cma-pilot.evree.workers.dev/webhooks`
- Zero Isolate-backed sandboxes created
- Zero Anthropic sessions triggered
- End-to-end webhook → sandbox → response flow never observed

S35 closed at "Round 0 substrate validated end-to-end; ready for Round 1 sandbox creation per PO direction."

---

## 2. S36 (this session) — Decisions and preparations

### 2.1 PO decisions ratified (chronological)

| # | Time | Decision | Effect |
|---|---|---|---|
| D1 | 13:55 | Round-1 surface = Cloudflare pilot | Session work direction |
| D2 | 14:00 | EVR Access bypass approach = **path-rule on `/webhooks`** | Minimum-scope exception; rest of Worker stays Access-gated |
| D3 | 14:36 | Substrate-class = **Path 1 Isolate-only Round 1** (Brunel-recommended) | MicroVM defers to Round 2. No Docker, no v2 migration, no Workers Builds setup. Already-deployed substrate is exec-ready |
| D4 | 14:36 | Hopper sanctioned to **execute bypass + acquire CF auth** | Hopper becomes CF substrate operator going forward; extends S35 Aen-direct precedent |
| D5 | 14:40 (committed) | **CF API Token provisioning** — 5 scopes, EVR-account-bounded, 24h TTL | **Pending delivery — only remaining blocker for op-step-1 execution** |
| D6 | 14:40 | **Tier-D sanction "Approve as drafted"** on Hopper's Deliverable 2 (NEW Access App with `destinations:[]` + bypass policy) | Valid (14:43 re-sanction was against wrong-correction; moot per Brunel substrate-truth-evidence cross-read at 14:42) |
| D7 | DEFERRED | Finn-Q1 credential shape (single-OAuth-token vs three-credential split per reference impl) | Tracked as task #10; load-bearing post-W4 (sessions.create scope is now required) |
| D8 | 14:43 | Pilot-A creation path = **PO via CF dashboard** (not service token, not deferred) | 5-click path post-bypass: Agents → New Agent → Backend: Isolate → name: pilot-a → model: claude-sonnet-4-6 → tools: [] |

### 2.2 Substrate-truth-evidence catches reshaping Round 1 design

Five substantive findings that change Round 1's implementation shape (NOT CF-substrate mutations — design corrections):

**Catch 1 — CF Access bypass canonical pattern** (Brunel substrate-truth-evidence cross-read against canonical CF API ref at 14:42):

The CF template's `~/Documents/github/.mmp/claude-managed-agents/docs/securing-access.md:60-68` ("Add a Bypass policy under the same application covering `/webhooks`") is **dashboard-UX-focused phrasing that does not map to API-canonical mechanism**. CF Access Policies API has NO path-scope fields. Path-scope lives on the Access Application's `destinations[]`.

Canonical CF API pattern for path-rule bypass:

- **NEW Access Application** scoped via `destinations:[{type:"public", uri:"fr-cma-pilot.evree.workers.dev/webhooks"}]`
- Inline bypass policy `{decision:"bypass", include:[{everyone:{}}], precedence:1}` on that new app
- More-specific-URL-wins precedence ensures the new app overrides the existing EVR org-wide Access app on `/webhooks`

Policy-on-existing-app would **over-broaden the bypass** to the App's full destinations (`*.workers.dev` or `*.evree.workers.dev`) — anonymous access leaking to `/`, `/api/*`, `/ws/terminal`. Substrate-level over-broadening incident prevented by the substrate-truth cross-read.

**Catch 2 — Anthropic connectivity is outbound-only** (Finn `claude-api` skill catch at 15:31):

> "Connectivity is outbound-only: your worker long-polls Anthropic's work queue; Anthropic never dials into your network." — `shared/managed-agents-self-hosted-sandboxes.md`

There is no inbound-event URL on Anthropic's side that AgentMailbox can dial. Inverted-trigger framing in prior design was a mismodel on connectivity-model grounds.

**Catch 3 — Wake mechanism = `client.beta.sessions.create()` from mailbox handler:**

The actual wake path:

1. AgentMailbox.append(envelope) — SQLite write
2. **AgentMailbox handler ALSO calls** `client.beta.sessions.create(agent=recipient_agent_id, environment_id, ...)` via Anthropic SDK in same handler invocation
3. Anthropic enqueues work for the new session
4. Our worker long-polls `environments.work.poller()` continuously
5. Anthropic returns session-start work in poll response
6. Worker dispatches → `IsolateRunner.start({sessionId, ...})`
7. Recipient session reads mailbox at start

Resolves Hopper Task #11. W4 = W1-shape (sessions.create) ratified; W2 (work-enqueue) + W3 (polling-only-blocker) falsified.

**Catch 4 — Identity is a three-layer chain** (Brunel Gate B2 at 14:33):

```
agent-name (user-facing)
    ↓ POST /api/agents
agent_id ("agent_..." prefix)         ← persistent D1 row in agent_backends table
    ↓ Anthropic session creation
session_id ("session_..." / "sesn_...") ← per-conversation, ephemeral
    ↓ idFromName(session_id)
DO ID (per Sandbox/IsolateRunner)     ← per-SESSION, ephemeral
```

Existing DO classes (`Sandbox`, `IsolateRunner`) are **per-session, ephemeral**. For per-agent durable mailbox: **AgentMailbox must be a separate DO class**, keyed `idFromName(agent_id)` for durability across session boundaries.

**Catch 5 — Secrets-injection mechanism** (Brunel Gate B3):

Per `docs/applying-egress-policies.md`: agent-side secrets are injected via **egress-policy `header-injection` rules from KV `SECRETS` namespace**, NOT via secret_bindings array on the sandbox. Sandbox-edge interceptor injects headers on outbound requests matching the policy target; agent never sees the secret value.

**Round 1 needs ZERO agent-side secrets** (Pilot-A talks to Pilot-B; no external API calls from the agents themselves). The 4 Worker-level secrets are control-plane (Worker authenticates against Anthropic, not the agents).

### 2.3 Design artifacts produced this session (Round 1 wire-ready)

| Path | Author | Size | Function |
|---|---|---|---|
| `designs/new/cloudflare-pilot/comms.md` v1.0→v1.4 | Herald | ~580 lines | AgentMailbox DO spec + sender custom-tool + Worker routes (4-row table) + DO storage schema (SQLite `msg:<iso>:<rand>` keys) + Q2 probe semantics + EO3 latency boundaries + always-2xx invariant + 5 EO entries for runtime-substrate uncertainties |
| `designs/new/cloudflare-pilot/lifecycle.md` (amended) | Volta | +~95 lines | §VL3.1 R2 bucket layout (`pilot-framework-state` bucket; 4-key table: `roster.json` / `scratchpads/<name>.md` / `next-session/<name>.md` / `discovery/last-active/<name>.txt`) + §VL4.1 respawn-into-existing-identity startup variant + §VL5.1 bootstrap sequence + PT4 always-2xx invariant footnote |
| `docs/webhook-sandbox-research-2026-05-26.md` | Finn | ~600 lines | Comprehensive surface map: Standard Webhooks protocol (3 required headers, HMAC-SHA256 over `${id}.${timestamp}.${rawBody}`, ±300s replay window), Sandboxes API surface, credential shapes |
| `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` | Finn | ~330 lines | Six-step cross-agent A→B path: agent tool-call → IsolateRunner DO ToolDispatcher → DO-to-DO RPC → AgentMailbox DO append → sessions.create SDK call → IsolateRunner.start() for recipient |
| `docs/wake-mechanism-w4-finding-2026-05-26.md` | Finn | ~120 lines | Resolves Task #11; SDK call shape; always-on `EnvironmentWorker.run()` long-poll vs webhook-driven `EnvironmentWorker.run_one()` worker shapes; resume-vs-create-new tradeoff |
| `docs/round-1-anthropic-platform-checklist-2026-05-26.md` | Finn | ~210 lines, 6 sections | §1 viability reconciliation × gap-classes; §2 Console one-time setup; §3 four credential smoke-tests; §4 Round-1 anti-patterns; §5 8-check exec-readiness gate; §6 four open questions |

`designs/new/cloudflare-pilot/substrate.md` was **deliberately NOT amended** — queued post-Round-1 per Brunel; substrate.md is the strategic-positioning brief (which holds); upstream `claude-managed-agents/docs/` is the substrate-mechanics reference for Round 1.

### 2.4 Hopper bypass prep package — 4 deliverables locked

**Deliverable 1 — Credential acquisition shape** (see §3 below for full detail).

**Deliverable 2 — Exact bypass command, Tier-D, PO 14:40 verbatim sanction valid:**

```bash
curl -sS -X POST \
  "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/access/apps" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "name": "fr-cma-pilot-webhooks-bypass",
    "type": "self_hosted",
    "destinations": [{ "type": "public", "uri": "fr-cma-pilot.evree.workers.dev/webhooks" }],
    "session_duration": "24h",
    "app_launcher_visible": false,
    "policies": [{
      "name": "Allow Anthropic webhook delivery",
      "decision": "bypass",
      "include": [{ "everyone": {} }],
      "precedence": 1
    }]
  }'
```

**Deliverable 3 — Three post-bypass verification probes (all Tier-R):**

| # | Method/URL | Pass criterion |
|---|---|---|
| Probe 1 | `POST /webhooks` (unsigned, JSON body) | HTTP **401 from Worker** (not 302 from Access); `Server: cloudflare`; no `cf-access-*` headers; body = webhook-signature error from `src/webhooks.ts:74-126` |
| Probe 2 | `GET /` (root) | HTTP **302 to IdP** OR 401 from Access — root still gated (positive control for path-scoping) |
| Probe 3 | `GET /webhooks` | Worker response (likely 404/405 from Worker — bypass is path-scoped, not method-scoped) |

**Deliverable 4 — Layer-3 substrate-truth read batch (all Tier-R, sanctioned):**

```bash
# Pre-flight
curl -sS "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"

# L3 reads
wrangler deployments list --name fr-cma-pilot
wrangler secret list --name fr-cma-pilot --format json
wrangler kv namespace list
wrangler d1 list
wrangler r2 bucket list

# Access apps inventory (Brunel-refinement)
curl -sS "https://api.cloudflare.com/client/v4/accounts/8f150f98013eec8cae0a9db20a010c49/access/apps" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq '.result[] | {id, name, domain, type, destinations}'
```

---

## 3. What kind of token are we expecting

### 3.1 Token type: CF API Token (NOT OAuth, NOT wrangler-login)

Reasoning (Hopper Deliverable 1):

- **OAuth `wrangler login`** requires interactive browser auth; doesn't persist cleanly across PowerShell sessions; binds to PO identity → muddies audit attribution
- **CF API Token** is the canonical CI/CD/automation pattern; scoped to minimum permission; clean audit trail attributable to Hopper

### 3.2 Required scopes (5, minimum-cost principle-of-least-privilege)

| Capability needed | CF Dashboard scope name |
|---|---|
| Read deployed Workers state (deployments, secret names, bindings) | **Account → Workers Scripts → Read** |
| Manage Access Applications + Policies (create the bypass app + policy) | **Account → Access: Apps and Policies → Edit** |
| Read KV namespaces (Layer-3 verification) | **Account → Workers KV Storage → Read** |
| Read D1 databases (Layer-3 verification) | **Account → D1 → Read** |
| Read R2 buckets (Layer-3 verification) | **Account → Workers R2 Storage → Read** |

**Explicitly NOT included:** Workers Scripts → Edit. Hopper is not deploying or modifying the Worker itself this dispatch; bypass is at CF Access policy level, not Worker code level.

### 3.3 Account binding

**Account Resources: Include → Specific account → EVR (`8f150f98013eec8cae0a9db20a010c49`)** — token cannot reach any other CF account.

### 3.4 TTL recommendation: 24h

Single-dispatch tool; should expire shortly after use. If S37 work extends beyond 24h, a fresh token at session-start is the right discipline.

### 3.5 PO dashboard click-path to create

1. CF dashboard → User Profile (top-right) → **API Tokens** → **Create Token**
2. **"Custom token"** template
3. Add the 5 permissions from §3.2
4. Account Resources: **Include → Specific account → EVR**
5. Zone Resources: leave default (not needed for Workers-only token)
6. TTL: **24h**
7. Create → **copy token value once** (CF shows it only at creation time)

### 3.6 Delivery to Hopper

Preferred: **secure share-link** (1Password / equivalent). Acceptable fallback: **chat-paste** — Hopper sets `$env:CLOUDFLARE_API_TOKEN` in current PowerShell session, never persists to disk. Optional: `$env:CLOUDFLARE_ACCOUNT_ID=8f150f98013eec8cae0a9db20a010c49` so `--account-id` doesn't have to be passed on every call.

---

## 4. Plan for next session (S37, token delivered)

### 4.1 Critical-path sequence (~5-10 min Hopper execution)

| Step | Action | Tier | Owner | Time |
|---|---|---|---|---|
| 1 | Hopper sets `$env:CLOUDFLARE_API_TOKEN` + `$env:CLOUDFLARE_ACCOUNT_ID` in PowerShell | — | Hopper | ~10s |
| 2 | Pre-flight `curl /user/tokens/verify` — confirms token + scopes | R | Hopper | ~5s |
| 3 | `wrangler --version` + `wrangler kv --help` — substrate-truth-anchor CLI syntax | R | Hopper | ~5s |
| 4 | Deliverable 4 L3 batch (5 wrangler reads + 1 Access apps `curl`) | R | Hopper | ~30s |
| 5 | **STOP at surface-back gate.** Hopper relays to Aen: L3 outputs + EVR Access App UUID + destinations[] inventory + ordering-conflict assessment | — | Hopper → Aen | — |
| 6 | Aen relays to PO for final clearance via single AskUserQuestion | — | Aen → PO | ~1 min |
| 7 | Hopper executes Tier-D bypass POST (Deliverable 2) — PO 14:40 sanction valid | D | Hopper | ~5s |
| 8 | CF propagation wait | — | — | 30-60s |
| 9 | Tier-R three-probe verification batch (Deliverable 3) | R | Hopper | ~30s |
| 10 | Hopper drafts ops-log entry — 8-field audit declaration with sanction quote verbatim + L3 substrate-truth read excerpts + probe outputs verbatim + Round-0-framing-as-confirmed + Brunel-paired-read attribution | — | Hopper | ~5 min |

**End state at step 10:** `/webhooks` reachable from public Internet for Anthropic webhook delivery; rest of Worker still Access-gated; substrate state confirmed via L3 reads; full audit trail on disk. **Round-1 op-step-1 = COMPLETE.**

### 4.2 Downstream op-steps (PO-driven; same window OR S38)

| Step | Action | Owner | Blockers |
|---|---|---|---|
| op-step-2 | **Resolve credential shape** (single-OAuth vs three-credential per CMA reference impl). Affects which credential mailbox-handler uses for `sessions.create`. Three failure modes documented in Finn `docs/webhook-sandbox-research-2026-05-26.md` §2 | PO decision | Task #10 |
| op-step-3 | **Create Pilot-A via CF dashboard.** 5 clicks: Agents → New Agent → Backend: Isolate → name: `pilot-a` → model: `claude-sonnet-4-6` → tools: `[]` | PO | op-step-1 complete |
| op-step-4 | Hopper verifies Pilot-A persisted via `wrangler d1 execute fr-cma-pilot-db --remote --command "SELECT agent_id, backend, created_at FROM agent_backends ORDER BY created_at DESC LIMIT 5"` | Hopper | op-step-3 |
| op-step-5 | **Trigger first Anthropic session** via Anthropic platform-side action | PO | op-step-2 + op-step-3 |
| op-step-6 | Observe end-to-end: Anthropic webhook → Worker `/webhooks` route → `handleWebhook` → IsolateRunner.start() → first session response | Hopper monitors | op-step-5 |
| op-step-7 | Repeat op-step-3 / op-step-5 for Pilot-B (second pilot agent) | PO | op-step-6 verified |
| op-step-8 | Brunel + Hopper deploy **AgentMailbox DO class** + Worker route per Herald comms.md v1.4 § §1.1 (Worker scaffold; new DO migration) | Brunel design / Hopper deploy | op-step-7 + token still valid OR new token |
| op-step-9 | First Pilot-A → Pilot-B message via `send_message` custom tool — validates the comms primitive end-to-end | Hopper monitors | op-step-8 |
| op-step-10 | Round 1 success-criteria checks (per `designs/new/cloudflare-pilot/README.md` §Success criteria): round-trip succeeds, sleep-resume persists, Q2 termination-respawn preserves storage, envelope round-trips cleanly, latency vs FR baseline | Hopper + Brunel | op-step-9 |

### 4.3 Realistic S37 scope-for-tonight if token delivered

**High-confidence achievable:**

- op-step-1 (bypass + verification) — bounded, well-prepared, ~10 min
- op-step-3 (Pilot-A creation via dashboard) — PO 5-click action; can happen in same window
- op-step-4 (Hopper verifies via D1 read) — bounded Tier-R follow-on

**Conditional on op-step-2 resolution:**

- op-step-5 (trigger first session) — requires credential decision first
- op-step-6 (observe end-to-end first session) — natural follow-on if session triggers

**Likely S38+ scope:**

- op-step-7 (Pilot-B creation) — second agent + AgentMailbox prep
- op-step-8 (AgentMailbox DO + Worker route deployment) — design-side work; Brunel scaffold needed; non-trivial Worker code change + new DO migration
- op-step-9 (first inter-agent message) — full Round-1 round-trip
- op-step-10 (Round-1 success-criteria validation)

### 4.4 Open PO-pending items for S37

1. **CF API token delivery** (blocker for op-step-1)
2. **Credential-shape decision** (Task #10; blocker for op-step-5+; Finn brief frames three options)
3. **PO Pilot-A creation via CF dashboard** (op-step-3, ~5 clicks)
4. **PO Anthropic session trigger** (op-step-5, platform-side action)

### 4.5 Risk register for S37

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Token has wrong scopes — Hopper hits 403 on bypass | LOW | Re-issue token; ~1 min | Deliverable 1 lists exact scopes verbatim |
| EVR Access App has destinations matching `.../webhooks` already → ordering conflict | LOW | Step 5 STOP-gate catches this; surface to PO | Brunel jq refinement on `GET /access/apps` |
| Bypass executes but `/webhooks` POST still 403s from Access | LOW | Propagation < 60s usually; re-probe | Step 8 propagation wait |
| OAuth subscription token (S35 ANTHROPIC_API_KEY) lacks `sessions.create` scope | MEDIUM-HIGH | Blocks op-step-5; needs Task #10 resolution + secret refresh | Surface as part of credential-shape decision; have refresh path ready |
| Anthropic platform-side env not actually "ready for sandbox" despite dashboard claim | MEDIUM | Pilot-A creation fails; investigate via Finn checklist §3 four credential tests | Finn `docs/round-1-anthropic-platform-checklist-2026-05-26.md` §3 |
| Workers Paid plan requirement (per Finn) for IsolateRunner DO + Worker Loader bindings | LOW (EVR likely already paid) | Would block op-step-3; PO upgrades CF plan | Verify in op-step-1 §3 viability check |

---

## 5. Session output summary (for context)

This session also produced substantial wiki + memory output beyond CF-pilot operational prep:

- **Wiki: 107 → 114 entries this session** (+5 new entries + 2 amendments). Categories: cluster-decomposition meta-principle (C1), bottleneck-determines-adoption (C4), sub-shape-E-at-design-domain (4 sub-instances), recursive-narrowing substrate-truth-evidence discipline (n=5 within-author), three-role discipline-stacking (Hopper+Brunel+Aen vantages), Layer-0 library-first recurrence (3-instance catalog), harness-restriction Sub-shape-E gotcha
- **Three-layer-substrate-truth-discipline** amendment: n=3 → n=6 cumulative drift instances across Docker-on-RC + Cloudflare-managed + design-domain substrates
- **comms.md v1.0 → v1.4** trajectory: each version caught a deeper substrate-truth blind-spot (author-blind → identity-chain → waitUntil → RPC-vs-HTTP → connectivity-direction)
- **Round 1 readiness:** comms.md is wire-ready; substrate.md amendment queued post-Round-1; lifecycle.md amended for R2 + respawn + bootstrap; 4 Finn research docs cover webhook protocol + sandbox API + W4 mechanism + platform-side operator checklist

---

## 6. Open task list (S36 end-state)

| # | Status | Owner | Subject |
|---|---|---|---|
| #1 | in_progress | Hopper | Round-1 op-step-1 path-rule bypass + Round-0 verification — **awaiting CF API token** |
| #5 | in_progress | Cal | Protocol-A queue absorption — 8 entries shipped; remaining queue 10+ candidates |
| #9 | in_progress (standby) | Monte | Manager-team architecture watch (dormant unless PO surfaces) |
| #10 | pending | PO | Anthropic credential shape decision (single-OAuth vs three-credential split) |
| #11 | pending → closeable | Hopper | Step-5 wake mechanism — RESOLVED by Finn W4 brief; flip on absorb |

Tasks #2, #3, #4, #6 = completed. Tasks #7, #8 = pending (standby, no surface this session).

---

(*FR:Aen*)
