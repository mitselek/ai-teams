---
name: cloudflare-pilot-comms
description: Herald's comms-protocol design brief for the Cloudflare Claude Managed Agents pilot. Recommends Durable Object as per-recipient mailbox (single-instance addressable identity + strong consistency + persistent storage) + KV roster + Queues for broadcast. Identity is name-based via idFromName; envelope is FR's existing SendMessage shape.
type: design-brief
author: herald
discovered: 2026-05-26
status: v1.4 (substrate-truth-evidence n=5 consolidation; connectivity-direction-model correction -- Anthropic outbound-only; sessions.create as wake primitive; Round 1 wire-ready)
companion-briefs:
  - designs/new/cloudflare-pilot/substrate.md (Brunel)
  - designs/new/cloudflare-pilot/lifecycle.md (Volta)
synthesis: designs/new/cloudflare-pilot/README.md (Aen)
source-finding: docs/findings.md
research-deps:
  - teams/framework-research/docs/webhook-sandbox-research-2026-05-26.md (Finn task #6 -- Standard Webhooks protocol, sandbox-creation-via-webhook-only, two-credential split)
  - teams/framework-research/docs/herald-g2-cross-agent-comms-brief-2026-05-26.md (Finn G2 -- cross-agent A→B delivery; custom-tool semantics; Path-(a)-RPC vs Path-(b)-HTTP)
  - teams/framework-research/docs/wake-mechanism-w4-finding-2026-05-26.md (Finn W4 -- connectivity-direction-model correction; sessions.create as wake primitive; resolves Task #11)
co-source-agents:
  - herald (primary author)
  - brunel (v1.2 Gate B2 substrate-truth-evidence; v1.3 S1+S2+waitUntil substrate-truth-evidence)
  - finn (v1.3 task #6 + G2 brief + v1.4 W4 brief; custom-tool semantics + Path-(a)-RPC + connectivity-direction-model correction)
amendments:
  - "v1.1 (2026-05-26 S36): exec-readiness amendment pass per Task #4 review. Added §1.1 Worker control-plane routes; §1.2 Sender-side calling primitive; §1.3 Recipient wake mechanism (webhook push, deletes polling language from §1 recommendation); §3.5 DO storage schema; §5.1 Q2 probe semantics; §EO3.1 Latency measurement boundaries; §6 watch-points G4 (`from`-injection authority) and G8 (KV roster validation gate). Land target: before Hopper T1 /webhooks path-rule bypass completes. (*FR:Herald*)"
  - "v1.2 (2026-05-26 S36): substrate-truth-evidence reconciliation per Brunel Gate B2 + PO Path-1 ratification. v1.1 was written against README §Identity-anchor-intersection two-layer chain; deployed substrate has THREE layers (agent-name → agent_id → session_id), with existing DO classes (Sandbox, IsolateRunner) per-session not per-agent. Folded AgentMailbox-as-NEW-DO-class (per-agent durable, sibling-not-subclass to per-session classes). Rewrote §1 recommendation, §1.1 route table (now 3-direction with Worker→Anthropic outbound), §1.3 wake sequence (agent_id-keyed AgentMailbox; direct-fire outbound webhook), §3.5 storage scoped to AgentMailbox class, §5.1 Q2 probe semantics (per-agent-DO durability across sessions). Path-1 Isolate-only Round 1 ratified by PO (microVM complications deferred to Round 2; AgentMailbox-as-separate-class unchanged across pilot-agent backend). §6.3 sharpened to substrate-truth-evidence-cross-check pairing. Three sharpenings (S1/S2/S3) folded as best-read per team-lead 14:36 routing; Brunel counter-amendment slot open if reads differ. Co-source-agents: [herald, brunel]. (*FR:Herald, cross-team-validated by Brunel*)"
  - "v1.3 (2026-05-26 S36): substrate-truth-evidence n=4 consolidation. Three INPUT streams folded in single pass: (i) Brunel S1/S2 confirmations + ctx.waitUntil shape (b) catch (S2 false-dichotomy: direct-fire-vs-alarm missed substrate's third option); (ii) Finn G2 brief (custom-tool semantics; tool handler runs IN IsolateRunner DO not in sandbox; Path-(a)-RPC primary, Path-(b)-HTTP-route deferred to Round-2 as external delivery surface; W1/W2/W3 SDK-wake-mechanism research flag); (iii) Finn task #6 report (Standard Webhooks always-2xx invariant; hibernation-vs-destruction; egress-policy sandbox-spawn-time scope). §1.2 ratified custom-tool path with IsolateRunner-DO clarification + Path-(a)/(b) trichotomy. §1.3 reshaped to ctx.waitUntil + always-2xx-asymmetry naming. §5.1.1 NEW sub-note on hibernation vs destruction-via-binding-drop. §6.1 G4 cross-ref to egress-policy scope. §6.3 RETITLED + REFRAMED to 'Recursive-Narrowing Substrate-Truth-Evidence Discipline' -- n=4 in one session catalog; doubly-self-validating Brunel-S2-cross-read-instance pinned. §6.4 NEW destruction-via-binding-drop watch. §6 EO-D1-1 + URL-stickiness + EO-DO-1 + EO-DO-2 added as substrate-research-grade open questions. Co-source-agents: [herald, brunel, finn]. (*FR:Herald, cross-team-validated by Brunel + Finn*)"
  - "v1.4 (2026-05-26 S36): substrate-truth-evidence n=5 consolidation. Finn W4 catch (via `claude-api` skill load surfacing `shared/managed-agents-self-hosted-sandboxes.md` canonical Anthropic doc) corrected v1.3's connectivity-direction-model mismodel: v1.3 §1.3 step 7 framed AgentMailbox as firing outbound webhook to 'Anthropic's per-agent inbound-event URL'; W4 substrate-truth-evidence shows Anthropic connectivity is OUTBOUND-ONLY-from-our-Worker -- Anthropic never dials our network. Wake primitive is `client.beta.sessions.create(agent=recipient_agent_id, environment_id=...)` SDK call, NOT an inbound-webhook trigger. Two valid worker shapes (always-on long-poll vs webhook-driven `session.status_run_started` → `run_one()`) -- Finn recommends always-on for Round 1 simplicity. v1.3 §1.2 W1 hypothesis RATIFIED (W4 = W1-shape); W2/W3 falsified by substrate-truth-evidence. Resume-vs-create-new tradeoff: create-new for Round 1; events.send-to-existing-idle-session deferred to Round 2. EO-W123 RESOLVED via W4 (Task #11 marked completed). Shape (b) ctx.waitUntil discipline carries forward unchanged: applies to the SDK call as the outbound work the DO does (verb shifts fetch→SDK call; DO-instance-blocking question identical). §1 + §1.1 + §1.2 + §1.3 + §EO3.1 + §6.3 (n=4→n=5 catalog) all updated. Credential scope feeds Task #10 (sessions.create scope check required against whatever auth token replaces ANTHROPIC_API_KEY). Co-source-agents: [herald, brunel, finn]. (*FR:Herald, cross-team-validated by Brunel + Finn*)"
---

# Cloudflare Pilot -- Comms Protocol (Rough Design, Herald)

## Decision up-front

**For the minimal 2-agent A↔B experiment: a new `AgentMailbox` Durable Object class** (defined in Worker code; **distinct from the deployed `Sandbox` and `IsolateRunner` classes** which are per-session). One AgentMailbox instance per AGENT, addressed by `idFromName(agent_id)` (the D1-persisted opaque ID, per Brunel Gate B2 three-layer identity chain). Each AgentMailbox's storage holds an ordered append-only message log.

**Delivery path (v1.4 per Finn G2 + Finn W4):** Pilot-A's agent emits a `send_message` **custom tool call**; the tool handler runs INSIDE Pilot-A's `IsolateRunner` DO (NOT inside the isolate sandbox itself -- the sandbox never sees the network); the handler performs **Path (a) direct DO-to-DO RPC** to `env.AgentMailbox.get(idFromName(recipientAgentId))` and calls `.append(envelope)`. The mailbox's `.append()` writes to its SQLite storage AND schedules the wake-trigger via `ctx.waitUntil(this.wakeRecipient())` (per Brunel S2; storage commits synchronously, outbound runs async, sender unblocks immediately). **The wake-trigger is an outbound SDK call `client.beta.sessions.create(agent=recipient_agent_id, environment_id=...)` to Anthropic's API** (per Finn W4; Anthropic connectivity is outbound-only-from-us -- Anthropic never dials our network). Anthropic enqueues work for the new session; our continuously-running long-poll worker picks up the new session-start work item; `IsolateRunner.start()` allocates the recipient's per-session DO; recipient agent drains its mailbox at session start. **For M2/M3 scale-out (broadcast / discovery): Workers KV as roster registry + Queues for fan-out.** AgentMailbox remains the per-recipient mailbox; KV holds the rename-stable agent_id→DO-ID mapping (FR's `members[]` analog); Queues carry broadcast events so DOs don't have to maintain peer lists.

**One-sentence rationale:** DOs are the only CF primitive with strong-consistency + per-instance addressable identity + persistent storage in a single object -- the smallest substrate shape that maps cleanly onto FR's "inbox file as wake mechanism + members[] as ACL" composition without splitting wake-and-ACL across two primitives. **AgentMailbox as a separate DO class is load-bearing** -- the deployed `Sandbox` and `IsolateRunner` classes are per-session/ephemeral (`idFromName(session_id)`-keyed); a per-agent durable mailbox cannot ride on them. AgentMailbox is per-agent durable by construction (idFromName(agent_id)-keyed; storage survives session boundaries).

**Round 1 substrate-backend (PO-ratified Path 1, 2026-05-26 14:36):** both pilot agents run on **Isolate-backed sandboxes** (sub-second cold-start; 60s idle TTL; DO SQLite native storage -- no R2 snapshots). AgentMailbox-as-separate-DO-class is **invariant across pilot-agent backend choice** -- it's a per-agent durability concern, distinct from per-session sandbox-class choice. Round 2 microVM expansion does not change AgentMailbox.

## Per-question analysis

### 1. Transport primitive

| Primitive | Latency | Consistency | Durability | Cost shape | Fit for A↔B mailbox |
|---|---|---|---|---|---|
| Workers KV | ~10-60ms read (edge), eventual writes (<60s global) | Eventual | Disk-backed, multi-region | Per-op, cheap reads | **No.** Eventual consistency breaks read-after-write on the receiver's poll cycle; not a mailbox. |
| Durable Object | Single-digit ms in-region; routes to instance's home colo | Strong (single-instance serialization) | Per-object storage, replicated | Per-request + per-storage-op; sleep-when-idle | **Yes -- primary.** Single-instance addressable identity == per-agent mailbox. Strong consistency means a write-then-read is observable in order. |
| R2 (object-as-mailbox) | ~20-100ms; HTTP-style | Strong for individual PUTs; no atomic append | Disk-backed, durable | Per-op, cheap storage | **No.** No atomic-append primitive -- would require ETag-based optimistic concurrency or a DO-coordinated lock, which collapses to DO anyway. The fcntl-flock substrate property FR's `cross-host-atomic-inbox-write-primitive.md` relies on has no R2 analog. |
| Queues | ~100ms-seconds; pull-based | At-least-once delivery | Durable until consumed | Per-message | **Yes for broadcast (M2/M3); No for A↔B mailbox.** Queues are great fan-out, but no per-instance addressing -- every consumer reads from the same queue. For a 1:1 mailbox, a queue is over-engineered; for 1:N broadcast (e.g., "new agent C joined"), it's the right shape. |
| Custom HTTP via Worker | Whatever the backing store is | Inherits backing store | Inherits | Per-request | **No -- degenerate.** A Worker is a router, not a store. Needs to land somewhere. Punts the question. |

**Recommendation (v1.4 -- Path-(a)-RPC primary per Finn G2; sessions.create-as-wake per Finn W4):**

- **Minimal experiment (2-agent, Round 1 Isolate-backed):** AgentMailbox DO class (new, defined in Worker code). **Agent-originated delivery uses Path (a) direct DO-to-DO RPC** -- Pilot-A's `send_message` custom-tool handler (running inside Pilot-A's IsolateRunner DO) resolves recipient via D1 (`name → agent_id`) → `env.AgentMailbox.idFromName(agent_id)` → calls `.append(envelope)` directly via RPC. AgentMailbox writes envelope to its SQLite storage AND schedules the wake-trigger via `ctx.waitUntil(this.wakeRecipient())` (sender unblocks on persist-ack; outbound runs async per §1.3). **Wake is via outbound SDK call `beta.sessions.create(agent=recipient_agent_id, environment_id=...)` -- NOT via outbound webhook** (corrected per Finn W4; Anthropic has no inbound-webhook URL for us to dial; connectivity is outbound-only-from-us, worker long-polls Anthropic). Our long-poll worker picks up the new session-start work; recipient agent drains its mailbox at session start. **This is the structural analog of FR's inbox-file-write-as-wake-mechanism** -- same shape, different substrate primitive (sessions.create SDK call as the wake-trigger verb).
- **External delivery surface (operators, debugging, future-Round-2 cross-Worker):** Path (b) `POST /inbox/<recipient-name>` Worker HTTP route -- same name-resolution + `AgentMailbox.append()` RPC under the hood, but exposed as HTTP for callers outside the Worker address space. **Deferred to Round 2 scope per Finn G2 §3** -- Round 1 wires Path (a) only; HTTP surface added later as thin proxy delegating to the same RPC method.
- **Scale-out (M2/M3):** add KV-backed roster + Queues for broadcast events. AgentMailbox class unchanged; discovery and fan-out layer on top. Round 2 may introduce `alarm()`-based batching for high-volume mailbox writes (shape (c) per Brunel S2); Round 1 uses `ctx.waitUntil` outbound SDK call (shape (b) per Brunel S2; verb is now `sessions.create` per Finn W4) -- see §1.3 for trichotomy detail.

### 1.1 Worker control-plane routes (v1.4 fold -- connectivity-direction-model correction; sessions.create as wake primitive; always-on long-poll worker)

The pilot has **five traffic shapes** crossing the Worker; two are HTTP paths ON our Worker, one is an in-process DO RPC, one is an outbound SDK call, one is a continuous outbound long-poll loop:

| Shape | Path / mechanism | Caller | Handler | Auth posture |
|---|---|---|---|---|
| **Anthropic → Worker** (platform callback) | `POST /webhooks` (on our Worker) | Anthropic Managed Agents platform (events: `session.status_run_started`, `session.status_terminated`, `session.status_idled`, etc.) | Verify Standard Webhooks signature (HMAC-SHA256, ±300s replay window); dispatch event to session-runtime allocation (`IsolateRunner.start(...)`) per Finn task #6 §3. **NOTE (v1.4):** `/webhooks` carries session-lifecycle events from Anthropic; it is NOT the wake-trigger receiver -- wake is triggered by OUR outbound `sessions.create` (row 4), not by an Anthropic-pushed wake-event. The webhook is the lifecycle-status channel | Path-rule **BYPASS** (Hopper T1) -- bare HTTPS reachability for Anthropic IPs; substrate-layer auth via Standard Webhooks signed payload (`webhook-id`, `webhook-timestamp`, `webhook-signature` headers per Finn task #6 §1) **NOT CF Access**. **MUST always return 2xx for any signature-valid + JSON-valid event** -- see footnote ⓐ below |
| **Agent A → AgentMailbox B** (Path (a) -- Round 1 primary) | In-Worker DO RPC: `env.AgentMailbox.get(idFromName(agent_id)).append(envelope)` | Pilot agent's `send_message` custom-tool handler (running inside SENDER's IsolateRunner DO; see §1.2) | AgentMailbox.append() persists envelope to its SQLite storage + schedules wake via `ctx.waitUntil` (see §1.3) | In-process service binding; no HTTP serialization; type-safe across the call; no auth boundary needed (same Worker address space) |
| **Operator/external → Worker** (Path (b) -- deferred to Round 2 external delivery surface) | `POST /inbox/<recipient-name>` (on our Worker) | External operators (FR team-lead, debugging tools) via authenticated Access route; Round-2-cross-Worker agents via internal-auth header | Worker reads recipient-name from URL; D1 lookup `name → agent_id`; resolves `env.AgentMailbox.idFromName(agent_id)` → AgentMailbox DO; delegates to same `.append()` RPC method as Path (a) | Path-rule **enforced** for operator traffic (Access-authenticated); internal-auth shared-secret for Round-2 cross-Worker callers |
| **AgentMailbox → Anthropic** (wake trigger via SDK call -- v1.4 W4 correction) | Outbound SDK call: `client.beta.sessions.create(agent=recipient_agent_id, environment_id=..., title=..., metadata=...)` -- NOT a path on our Worker; goes to `api.anthropic.com` | AgentMailbox DO via `ctx.waitUntil(this.wakeRecipient())` after storage append (per §1.3 step 7) | Anthropic platform receives the session-creation call; enqueues work for the new session; returns session_id synchronously to our DO. Worker long-poll loop (row 5) subsequently picks up the new session-start work | Anthropic platform contract -- Bearer token (`ANTHROPIC_API_KEY` per Finn task #6 §2; sessions.create scope required -- feeds Task #10 credential-shape decision); **fire-and-forget per shape (b) -- see §1.3 retry-direction-asymmetry** |
| **Worker → Anthropic** (continuous long-poll loop -- v1.4 NEW) | Always-on outbound long-poll: `client.beta.environments.work.poll(env.ENVIRONMENT_ID, ...)` in a long-lived process (`EnvironmentWorker.run()`) | Long-running Worker process (separate from AgentMailbox DO lifecycle); continuous since pilot bring-up | On work-item-returned: dispatch to `IsolateRunner.start({ sessionId, workId, ... })` per Finn task #6 §3 -- allocates per-session DO. **This is the closing loop**: AgentMailbox row 4 creates session → Anthropic queues work → row 5 picks it up → `IsolateRunner.start()` wakes the recipient | Environment-credential-scoped (`environments.work.poll` scope); Finn task #6 §2 ANTHROPIC_ENVIRONMENT_KEY split (env key for poll, regular API key for sessions.create). **Alternative**: webhook-driven shape -- `session.status_run_started` event on row 1 → `EnvironmentWorker.run_one()` invocation per webhook. Finn W4 recommends **always-on for Round 1 simplicity** (one long-running process; no extra webhook complexity beyond row 1's existing handler) |

**ⓐ Always-2xx invariant for `/webhooks` (Finn task #6 §1.2 + §5):** the inbound `/webhooks` handler MUST return 2xx for any signature-valid + JSON-valid event, EVEN if downstream dispatch fails. 401/400 only for invalid signature / malformed JSON respectively. **Anthropic retries non-2xx responses indefinitely** -- a non-2xx on dispatch failure is an infinite-loop hazard. Reference implementation pattern from Finn task #6: persist event to D1 inside the 2xx path; cron + next webhook re-drain idempotently. Idempotency at the persistence layer is what makes always-2xx safe.

**Connectivity-direction-model discipline (v1.4 -- Finn W4):** **Anthropic-to-us connectivity is OUTBOUND-ONLY-from-our-Worker.** Anthropic never dials our network -- there is no per-agent inbound-event URL on Anthropic's side we can fire. The only mechanism for causing Anthropic to take action is an outbound call from our code. Inbound `/webhooks` (row 1) is Anthropic's outbound-to-us channel for session-lifecycle EVENTS -- but it's only a STATUS channel, not a trigger primitive we control. **Wake-trigger primitives are outbound-from-us calls** (rows 4 and 5): `sessions.create` to create work, `work.poll` to receive work. Any future amendment that frames wake as "Anthropic-pushed to our Worker" is a regression of this v1.4 substrate-truth-evidence correction.

**Path collision clarification:** Three distinct directions involving Anthropic, easy to conflate at design-time, mechanically distinct at runtime:

- Anthropic → our Worker `/webhooks` (row 1): inbound lifecycle-event channel; T1 path-rule bypass covers this.
- Our Worker → Anthropic via `sessions.create` SDK call (row 4): outbound wake-trigger; no path-on-our-Worker; CF Access not relevant (outbound).
- Our Worker → Anthropic via `work.poll` long-poll loop (row 5): outbound continuous-receive; no path-on-our-Worker; CF Access not relevant (outbound).

T1 path-rule bypass unblocks row 1 specifically. Rows 4 and 5 have no CF Access concern. v1.3 framing of "outbound webhook to Anthropic's per-agent inbound-event URL" was incorrect -- that URL doesn't exist (W4 catch).

**Identity-chain note (S1 fold, Brunel-ratified):** Path (a) DO-RPC: tool handler already has `recipientAgentName` from agent's tool-call args; Worker D1 lookup `name → agent_id` happens INSIDE the tool handler before the `idFromName(agent_id)` resolution. Path (b) HTTP route: same lookup happens at Worker boundary after URL parse. Both paths converge on `idFromName(agent_id)` → AgentMailbox per Brunel B2 chain. **Why agent_id-keyed rather than agent-name-keyed:** agent_id is the persistence anchor per Brunel Gate B2; it's stable across rename, opaque, D1-row-keyed. AgentMailbox-by-agent_id survives rename-discipline without storage migration. (D1-read caching candidate flagged for §EO3 budget if dominates; URL-stickiness post-rename trade-off flagged at §6 EO-URL-1.)

**Resolution of v1.2 Finn-coordination-pending residual:** Finn G2 brief (2026-05-26) confirms Path (a) DO-RPC as the canonical Round 1 path for agent-originated delivery. The earlier v1.2 hypothesis "agent traffic flows via `/webhooks` if Anthropic payload carries inter-agent intents" is falsified -- Anthropic webhooks carry session-lifecycle events (Finn task #6 §1.1), NOT inter-agent messages. Inter-agent delivery is OUT-OF-BAND from Anthropic's platform protocol; we provide it via custom tool + DO RPC.

### 1.2 Sender-side calling primitive (v1.3 fold -- custom-tool RATIFIED per Finn G2; IsolateRunner-DO scoping clarified)

**Resolved (v1.3 from v1.2 hypothesis):** `send_message` as a **custom tool registered with the Managed Agent** is the canonical Round-1 path for inter-agent comms. Finn G2 brief (2026-05-26) ratifies this; v1.1/v1.2 hypothesis is now fact.

**Where the tool handler runs (load-bearing clarification per Finn G2 §2):**

- The agent (Claude model inside the sandbox) emits `tool_use: send_message(...)` exactly as it emits any other tool-call (`cf_read`, `bash`, etc.). From the LLM's perspective, **sending a message is indistinguishable from any other tool invocation** -- same protocol shape, no special primitive.
- The tool-call is dispatched to the **sender's `IsolateRunner` Durable Object** (the per-session DO), where Anthropic's `ToolDispatcher` runs the handler closure. **The handler runs INSIDE the DO, NOT inside the isolate sandbox.** This is critical:
  - The sandbox never sees the network -- egress is the DO's responsibility, not the sandbox's.
  - The handler has full access to Worker `env` (so it can RPC the AgentMailbox DO directly per Path (a) §1.1).
  - The handler has access to the sender's `agentId` and `sessionId` (for `from`-field auto-attribution per §3 + §6.1).
  - Egress policy is already attached at the IsolateRunner level (sandbox-spawn-time, per Finn task #6 §3) -- see §6.1 G4 cross-ref.

**Tool definition (registered at agent-create time via `POST /api/agents`):**

```jsonc
{
  "type": "custom",
  "name": "send_message",
  "description": "Send a message to another pilot agent's mailbox.",
  "input_schema": {
    "type": "object",
    "properties": {
      "to":      { "type": "string", "description": "Recipient agent name." },
      "summary": { "type": "string" },
      "message": { "type": "string" }
    },
    "required": ["to", "message"]
  }
}
```

**Handler runs inside IsolateRunner DO (Finn G2 §2 dispatch pattern):**

```ts
const customTools: BetaRunnableTool[] = [{
  name: "send_message",
  description: "...",
  input_schema: {...},
  run: async (args, _ctx) => {
    return await deliverInterAgentMessage(env, {
      fromAgentId: this.agentId,
      fromSessionId: this.sessionId,
      toAgentName: args.to,
      summary: args.summary,
      message: args.message,
    });
  },
}];
```

**`deliverInterAgentMessage` is Path-(a) DO-RPC per §1.1 row 2:** resolves `args.to` → `agent_id` via D1; gets `env.AgentMailbox.get(idFromName(agent_id))`; calls `.append(envelope)` directly. Single hop, no HTTP serialization, type-safe, backpressure-implicit (sender's tool-call awaits the RPC return).

**Reasons (sharpened from v1.2):**

1. **Transferability:** maps to FR's SendMessage tool one-for-one; envelope round-trip (EO2) preserved.
2. **Substrate-edge schema enforcement:** tool `input_schema` forces zod-typed payload at the agent boundary; complements §3 envelope discipline.
3. **Path-(a) DO-RPC simplicity:** no HTTP round-trip for what is ultimately a same-Worker call; no circular egress-policy dependency (which Path (b) would create -- sender would need its own Worker hostname in egress allowlist).
4. **Sandbox-network-isolation preserved:** sandbox is sealed; only DO touches network -- this is a security architecture property worth preserving even at Round 1.

**Wake-mechanism resolution (v1.4 -- Finn W4 supersedes v1.3 W1/W2/W3 framing):**

v1.3 §1.2 named W1/W2/W3 as candidate shapes for "the Anthropic SDK call that triggers an inbound webhook for a named agent." **The framing itself was substrate-blind**: there is NO Anthropic-side inbound-event URL we can fire (connectivity is outbound-only-from-us per §1.1 connectivity-direction-model discipline). Finn W4 brief (`teams/framework-research/docs/wake-mechanism-w4-finding-2026-05-26.md`) resolves the question:

- **W4 = W1-shape RATIFIED.** The wake primitive is `client.beta.sessions.create(agent=recipient_agent_id, environment_id=..., title=..., metadata=...)`. v1.3's W1 hypothesis ("`beta.sessions.create({ agent_id })`") was the right read; W4 confirms exact shape.
- **W2 FALSIFIED.** There is no `environments.work.enqueue(...)` -- work appears via session creation, not by direct queue-write.
- **W3 FALSIFIED.** Polling does work -- but it's worker-shaped (continuous receive of Anthropic-queued work), not orchestrator-shaped (would-be sender-side poll of mailboxes). The Round-1 polling concern that v1.3 framed as a blocker was a category error: long-polling is the always-on worker mechanism for receiving session-start work (row 5 of §1.1 table), NOT an inferior fallback for not having an inverted-trigger primitive.

**EO-W123 RESOLVED via W4** (Task #11 marked completed per Finn brief §5). v1.4 §6 retains the EO entry tombstoned-as-resolved for amendments-log traceability.

**Resume-vs-create-new tradeoff (Round 1 Disposition):** Finn W4 §"Skeleton code" notes that sessions can also receive `events.send()` calls (`user.message` event to existing `running` or `idle` session). Two structural options for inter-agent wake:

- **Create-new session per inter-agent message** (Round 1 -- recommended by Finn W4): each `send_message` tool-call triggers `sessions.create`; recipient agent gets a fresh session-scoped invocation per inbound. No resume-discovery logic; clean session boundaries.
- **Resume-existing-idle-session if available** (Round 2 evolution): mailbox handler checks for recipient's existing `idle` session; if present, `events.send()` instead of `sessions.create`. Avoids cold-start cost; adds resume-discovery complexity.

**Round 1 = create-new per Finn W4 recommendation.** Round 2 may add resume-optimization once latency profile from Round 1 EO3 is observed.

**Sender-side calling primitive (§1.2 substantive content unchanged from v1.3):** custom-tool with handler running inside IsolateRunner DO; Path (a) DO-RPC for delivery. v1.4 only updates wake-mechanism framing; sender-side ratification stands.

### 1.3 Recipient wake mechanism (v1.3 fold -- `ctx.waitUntil` shape (b) per Brunel S2; retry-direction-asymmetry naming)

**Polling language is deleted from §1 recommendation.** CF Managed Agents are NOT long-running poll loops -- they are wake-on-webhook session-scoped agent runtimes. The wake mechanism is push.

**Three substrate shapes for outbound wake from AgentMailbox (Brunel S2 trichotomy):**

| Shape | DO instance blocked? | Sender wait | Failure handling | Retry semantics | Round 1? |
|---|---|---|---|---|---|
| **(a) `await outboundFetch()` in handler** | YES -- blocks for outbound RTT | Sender waits for outbound complete | Exception bubbles to sender | None; sender re-sends | NO -- superseded by (b) |
| **(b) `ctx.waitUntil(outboundFetch())`** | NO -- returns immediately after persistence | Sender unblocks on persist-ack (sub-ms) | Exception swallowed by waitUntil; logged not surfaced | None; fire-and-forget | **YES (Round 1 canonical)** |
| **(c) `state.storage.setAlarm()` + `alarm()` handler** | NO -- returns immediately | Sender unblocks on persist-ack | `alarm()` throws → CF retries with backoff | **At-least-once retry built-in** | Deferred to Round 2 |

**Round 1 = shape (b) `ctx.waitUntil`** per Brunel S2 substrate-truth-evidence catch (v1.2's "direct-fire-vs-alarm" framing was a false dichotomy; shape (b) is the canonical middle-ground). Three reasons: (i) unblocks DO instance after persistence -- removes concurrent-inbound queueing concern (EO-DO-1) by structural design, not scale-luck; (ii) sub-ms sender ack on persist (storage-put only) vs outbound-RTT-included in shape (a); measurable EO3 win; (iii) structural separation of "persist succeeded" (sender's ack contract) from "outbound delivered" (DO's downstream responsibility). Round 2 evolves to shape (c) IF empirical outbound-failure-rate makes at-least-once retry necessary.

**Wake sequence (canonical, AgentMailbox-class-keyed per Brunel B2, shape (b) per Brunel S2):**

1. Sender's agent (Pilot-A, inside its IsolateRunner DO) emits `tool_use: send_message(to="pilot-b", ...)`.
2. ToolDispatcher inside Pilot-A's IsolateRunner DO invokes the registered `send_message` handler closure (per §1.2). Handler runs in DO address space; sandbox stays sealed.
3. Handler performs `D1 lookup: "pilot-b" → agent_id (e.g., "agent_xyz123")` -- the persistence anchor per Brunel B2 three-layer chain.
4. Handler resolves `env.AgentMailbox.idFromName(agent_id)` → recipient's **AgentMailbox** DO (the new per-agent DO class, NOT Sandbox/IsolateRunner which are per-session).
5. Handler calls **`mailbox.append(envelope)` via direct DO-RPC (Path (a) per §1.1)** -- single-hop, type-safe, no HTTP serialization.
6. **AgentMailbox.append() executes in recipient's DO context:** persists envelope to SQLite storage (see §3.5 schema); ALSO schedules the wake-trigger via `ctx.waitUntil(this.wakeRecipient())` -- storage commit synchronous, outbound async. **Returns to sender immediately after persist-ack** (sub-ms; ~storage-put latency only).
7. **In the waitUntil-managed async path: AgentMailbox makes an outbound SDK call `client.beta.sessions.create(agent=recipient_agent_id, environment_id=..., title="Inbound from <sender_name>", metadata={...})`** to Anthropic's API (v1.4 -- Finn W4 supersedes v1.3 "outbound webhook to inbound-event URL" framing). **Worker→Anthropic direction via `client.beta.*` SDK; NOT a path on our Worker** (see §1.1 row 4). Anthropic returns synchronously with the new session_id; AgentMailbox optionally logs/persists it for traceability.
7.5. **Anthropic enqueues work for the newly-created session in its work queue.** No further action from our DO code at this point -- the session is queued; pickup happens via row 5 (Worker long-poll loop).
8. **Our continuously-running long-poll worker (`EnvironmentWorker.run()`) -- separate process from any DO -- calls `client.beta.environments.work.poll(env.ENVIRONMENT_ID, ...)` on its current cycle and receives the new session-start work item** (v1.4 NEW -- Finn W4 §1.1 row 5). Pickup latency is bounded by the long-poll cycle period (typically seconds; SDK-managed).
9. **Worker dispatches the received work to `IsolateRunner.start({ sessionId, workId, environmentId, ... })`** per Finn task #6 §3 -- allocates Pilot-B's per-session DO (new `idFromName(session_id)`).
10. Pilot-B's `IsolateRunner.start()` performs **mailbox drain BEFORE invoking the agent loop**: `await env.AgentMailbox.get(env.AgentMailbox.idFromName(this.agentId)).drainUnread()`; formats inbox as initial-context (per Finn G2 §6); agent loop sees inbound message in its first turn.

**Retry-direction asymmetry (NEW, v1.3 -- Anthropic always-2xx + shape (b) cross-link):**

The pilot has **two distinct retry-direction semantics** that look superficially identical but are structurally opposite. Conflating them is a category error:

| Direction | Retry policy | Why |
|---|---|---|
| **Anthropic → us** (inbound `/webhooks` -- session-lifecycle events) | Anthropic retries non-2xx **indefinitely** per Standard Webhooks spec (Finn task #6 §1.2 + §5) | We MUST return 2xx for signature-valid + JSON-valid events -- see §1.1 ⓐ. Failure to do so = infinite Anthropic retry loop. |
| **Us → Anthropic** (outbound `sessions.create` SDK call via shape (b) waitUntil -- wake-trigger; v1.4 verb correction) | Fire-and-forget; **NO retry by us** | Anthropic's `sessions.create` endpoint is 2xx-always per their API contract; non-2xx = transient infrastructure or scope-misconfiguration (e.g., missing `sessions.create` scope on credential -- see Task #10 cross-link in §6), not application-layer-failure-we-can-resolve-by-retry. Shape (b)'s exception-swallowed-by-waitUntil is the substrate-truthful posture for Round 1; shape (c) alarm() is the Round-2 evolution if empirical failure-rate matters. |
| **Us → Anthropic** (continuous `environments.work.poll` long-poll loop -- v1.4 NEW) | SDK-managed retry (long-poll reconnects on transient failure per Anthropic SDK conventions) | Not application-level retry; this is the always-on receive channel. Worker process must restart on hard failure (separate concern from message-level retry semantics). |

**The asymmetry must be named explicitly** because both directions involve "Anthropic" and "webhook" terminology -- readers easily collapse them into a single retry-semantics model. They are NOT the same: inbound is at-least-once-by-Anthropic; outbound is at-most-once-by-us.

**Round 1 outbound failure-handling disposition (waitUntil-promise exception path):**

- `console.error()` + log entry for the failed outbound fetch (structured log: timestamp, recipient agent_id, error class, message id).
- **NO retry, NO DLQ** -- fire-and-forget per shape (b) discipline. Round 2 evolution to shape (c) alarm() ONLY IF empirical outbound-failure-rate observed in Round 1 makes retry-semantics necessary.
- Sender already got persist-ack (sub-ms); recipient un-woken silently. Recovery = next sender-initiated message OR operator manual trigger via Path (b) `/inbox/<name>` (deferred to Round 2 external delivery surface).
- **This is a known trade-off**, not a bug. Documented per Brunel S2: "shape (b) is the right Round-1 default; shape (c) is the right Round-2-when-retry-matters evolution; the discriminator is empirical observation of outbound-failure rate, not pre-emptive design."

**Three-layer identity chain mechanically visible in the wake sequence:**

| Layer | Where it appears | DO class involved |
|---|---|---|
| **agent-name** (user-facing) | Step 1 (tool arg), Step 2 (URL parameter) | None -- it's a string |
| **agent_id** (D1-persisted, "agent_..." prefix) | Steps 3-7 (Worker resolution → AgentMailbox addressing) | AgentMailbox (per-agent, NEW class) |
| **session_id** (per-conversation, "session_.../sesn_..." prefix) | Step 8 (Anthropic platform allocates a session at Pilot-B wake) | Sandbox or IsolateRunner (per-session, deployed substrate classes) |

**FR analog mapping (load-bearing -- v1.4 W4 updated):**

- FR's "inbox file write" ≡ CF's "AgentMailbox storage append" (step 6)
- FR's "wake mechanism via filesystem notify" ≡ CF's "AgentMailbox outbound `sessions.create` SDK call to Anthropic API + long-poll worker pickup" (steps 7 + 7.5 + 8) -- two-stage indirect wake via Anthropic queue, NOT a direct webhook (v1.4 W4 correction; v1.3 framing was substrate-blind on connectivity direction)
- FR's "agent reads inbox.json at session start" ≡ CF's "agent reads AgentMailbox storage at session start" (step 10)

**Sub-shape E observation (cross-team co-author with Brunel):** the wake mechanism is the substrate-most-divergent part of the comms primitive -- FR uses filesystem-notify; CF uses webhook-callback. Same framework-layer shape ("write triggers wake"), opposite substrate-direction (FR: poll-able file; CF: push-only webhook). The **three-layer identity chain** is itself another Sub-shape E instance -- FR has one identity layer (agent-name as inbox-file path); CF has three (name → agent_id → session_id), with per-agent durability ON A SEPARATE DO CLASS than per-session lifecycle. **This is exactly the §S2 substrate/framework boundary materializing at TWO sub-layers of the wake layer.** Joint-author finding with Brunel's Gate B2 substrate-truth-evidence pass.

**No-agent-polling discipline (v1.4 sharpened):** any future amendment that re-introduces "agent polls DO storage" language is a regression. **Note carefully:** v1.4's wake mechanism DOES involve polling -- but it's WORKER-side long-poll against Anthropic's work queue (row 5 of §1.1), NOT agent-side polling. Two distinct polling concerns; the regression-class is agent-side, not worker-side. The substrate IS polling-based on the worker layer; the framework-layer no-polling-by-agent discipline is preserved.

**No-per-session-mailbox-conflation discipline:** any future amendment that puts the mailbox on `Sandbox`/`IsolateRunner` (per-session DO classes) is a regression. The mailbox MUST be on AgentMailbox (per-agent DO class); otherwise messages are lost at session boundaries, falsifying Q2 by substrate design rather than by substrate behavior. Brunel B2 substrate-truth-evidence catch is the authoritative statement here.

**Sandbox-creation-is-Anthropic-driven discipline (v1.4 -- Finn task #6 §3 + Finn W4 sharpened):** there is NO "admin creates sandbox" REST endpoint, NO `POST /api/sandboxes`, NO out-of-band sandbox provisioning by us directly. **All sandbox creation flows through `sessions.create` (our outbound SDK call to Anthropic, per Finn W4) → Anthropic-side work-queue → our long-poll worker pickup → `IsolateRunner.start(sessionId, ...)`.** Two distinct mechanisms by which sandbox-creation may originate:

- **Inter-agent wake (v1.4 primary path):** AgentMailbox.wakeRecipient calls `sessions.create` → Anthropic enqueues work → our worker picks up via row 5 long-poll → `IsolateRunner.start()`.
- **Dashboard "Start session" UI:** records intent in D1 and pings Anthropic, which then issues the webhook event back to our `/webhooks` (row 1) -- Anthropic's standard session-lifecycle.

**Both paths converge at `IsolateRunner.start()`.** Both originate by our code (or operator action) telling Anthropic something; Anthropic responds via work-queue (which our worker polls) or session-lifecycle webhook (which our `/webhooks` receives). **Any future amendment proposing "have the Worker spawn an isolate sandbox directly without going through Anthropic" is a regression** -- the substrate doesn't support it; Anthropic's session-lifecycle protocol is the ONLY way sandboxes get created.

### 2. Identity addressing

FR-current: `members[]` array in `config.json` is the authoritative agent roster; SendMessage takes a name string, harness resolves name→inbox-file via the array. The `members[]` is **manually maintained**, validated at SendMessage time, mid-session edits honored (per `members-array-edit-honored-mid-session.md`).

CF-native options:

- **DO ID as primary key:** stable, opaque, globally unique. Bad UX for humans/agents.
- **DO name (idFromName) keyed on agent_id:** the D1-persisted "agent_..." opaque ID resolves deterministically to a DO ID via `idFromName(agent_id)`. **This is the structural match to FR's name-based addressing -- at the persistence-anchor layer**, per Brunel Gate B2 three-layer chain. agent-name is the user-facing string (UX); agent_id is what idFromName takes (durable, opaque, D1-row-keyed).
- **Worker route as URL:** `/inbox/<agent-name>` accepts the user-facing name; Worker resolves `name → agent_id` via D1 lookup, then `idFromName(agent_id)` → AgentMailbox DO.

**Recommendation (v1.2 fold):** **`idFromName(agent_id)` keyed off the D1-persisted persistence anchor; AgentMailbox is a new DO class (distinct from per-session Sandbox/IsolateRunner); D1 row is the authoritative `members[]` analog** (canonical list of who-is-on-team with metadata; KV roster is the M2 cache layer for high-frequency lookups). Pilot agents address each other by user-facing name in `send_message(recipient=<name>)`; Worker resolves to agent_id via D1; idFromName(agent_id) resolves to AgentMailbox DO. The user-facing name is framework-state (FR-owned); agent_id and DO-ID are substrate-state.

**Crucial framework-research observation:** identity model on CF substrate vs FR's framework is **same shape, different substrate primitive.** Both compose: (i) a name-based addressing layer, (ii) a roster validation layer, (iii) a per-recipient durable mailbox. FR uses `members[]` + JSON file inbox + filesystem. CF uses KV roster + DO storage + DO routing. **The substrate-vs-framework boundary from §S2 of findings.md materializes here: identity-as-name is framework-state (FR-owned); name-resolution-and-mailbox-storage is substrate-state (CF-owned under pilot).** This is the §S2 boundary mechanically visible at the comms layer.

### 3. Message envelope

FR-current (`types/t09-protocols.ts` + SendMessage tool): structured envelope with `to`, `from` (implicit, harness-injected), `summary`, `message` (string or typed protocol-response object), timestamp (implicit). Protocol-response variants (`shutdown_response`, `plan_approval_response`) are typed objects with `type` discriminator + `request_id`.

CF-native convention: zod-typed tool-call schemas per Cloudflare's announcement. JSON envelopes, schema-validated at the substrate edge.

**Recommendation:** **Use FR's existing SendMessage envelope shape as the pilot's canonical message contract.** Reasons:

1. **Transferability beats CF-native fit at the pilot stage.** The pilot's purpose is to test whether CF substrate can host FR's framework, not to invent a new framework. If the envelope diverges, we're measuring two things at once (substrate + envelope), and the experiment loses signal.
2. **The envelope IS framework-state, not substrate-state.** Per §S2 of findings.md: inter-agent coordination protocols stay framework-layer regardless of substrate. Re-shaping the envelope to fit CF-native conventions would be ceding framework-layer ground that the §S2 analysis explicitly reserves to FR.
3. **Typed-contract discipline (`protocol-shapes-are-typed-contracts.md`)** applies: the envelope is a binary interface between sender and receiver. Inventing a new shape for the pilot creates a cross-substrate-translation-layer problem we don't need.
4. **Zod-validation at substrate edge is additive, not substitutive.** We can validate the existing envelope with zod schemas at the DO entry point; the schema is just a wire-format enforcer, not a replacement envelope.

**Caveat (we-as-researchers):** the experiment SHOULD include a probe of CF-native envelope conventions as a sub-question -- "does the FR envelope round-trip cleanly through DO storage + JSON serialization, or do we discover impedance?" If impedance, that's a framework-grade finding about envelope-substrate fit.

### 3.5 AgentMailbox storage schema (v1.2 fold, G5 resolution + AgentMailbox-class scoping)

**This schema is the storage contract for the AgentMailbox DO class specifically** (per Brunel B2 -- not Sandbox/IsolateRunner per-session classes). Round 1 Path-1 Isolate-only deployment uses **DO SQLite native** as the storage backend (no R2 snapshots; substrate-trivial). The Round 2 microVM expansion will not change AgentMailbox storage shape -- only the per-session-sandbox storage gains R2-snapshot complexity.

**Without a spec'd storage layout, EO2 (envelope round-trip integrity) cannot be measured** -- impedance from "FR envelope can't survive CF substrate" is indistinguishable from "we discarded a field by storing it wrong." The schema below pins the contract.

**Write side (executed inside the recipient AgentMailbox on envelope receipt via service-binding fetch from Worker):**

```
key:   `msg:<iso-timestamp>:<random-suffix>`
value: JSON.stringify(envelope)
```

- `<iso-timestamp>` is the DO's `new Date().toISOString()` at append time (substrate-side; not sender's claimed timestamp -- keeps ordering authoritative to the DO clock and immune to clock skew).
- `<random-suffix>` is `crypto.randomUUID().slice(0,8)` -- disambiguates simultaneous appends within the same millisecond (DO single-instance serialization eliminates same-instance race, but cheap collision insurance is cheap).
- Value is the **entire envelope as a single JSON blob** -- preserves field-set integrity for EO2 measurement; we read what we wrote, byte-for-byte modulo JSON normalization. **Do NOT decompose into per-field DO storage keys** -- that's the substrate-tax shape that fails EO2 by construction.
- Key prefix `msg:` reserves namespace for other DO storage (e.g., `cursor:<reader>` for read-position tracking -- see read side below).

**Read side (executed inside AgentMailbox when the recipient agent session asks for new messages via service-binding from the per-session sandbox):**

```
// inside AgentMailbox.fetch() handler for GET /read?reader=<id>
const cursor = (await this.state.storage.get(`cursor:${readerName}`)) ?? "msg:";
const messages = await this.state.storage.list({ start: cursor, prefix: "msg:" });
// drain messages, deliver to caller
const lastKey = [...messages.keys()].at(-1);
if (lastKey) await this.state.storage.put(`cursor:${readerName}`, lastKey);
return messages;
```

- **High-water-mark cursor, NOT consume-and-delete.** Messages remain in DO storage after read; cursor advances. Trade-off: cumulative storage growth vs. re-readability and audit-trail.
- **`readerName`-scoped cursor** allows multiple readers (debug operator + the agent itself) to advance independently. For Round 1 only one reader matters (the agent), but the shape is M2-ready.
- **`list({ start: cursor })` semantics** -- DO storage `list` returns keys ≥ start. The cursor IS the lastReadKey, so the first returned message is the one immediately after the last read. Verified per Cloudflare DO docs canonical list semantics; if Finn's substrate research surfaces a different `list` semantic, fall back to `list({ startAfter: cursor })` or explicit-skip-first.
- **No TTL in Round 1.** Round 2 can introduce expiry per `members-array-edit-honored-mid-session.md` analog (configurable per-team retention).

**Round-trip integrity contract for EO2:**

```
sent_envelope (Pilot-A side, pre-tool-call)
  === JSON.parse(stored_value) (DO storage)
  === received_envelope (Pilot-B side, post-session-start read)
```

Three points of byte-comparison; any mismatch is a substrate-impedance finding worth filing. **EO2 measurement is now operationally defined** -- earlier draft's "round-trip cleanly" was unfalsifiable.

### 4. Discovery mechanism

FR-current: `roster.json` (FR-side) + `config.json` `members[]` (per-team). Manually maintained. Ghost-bridge daemon auto-detects via SSH-layer probes (`ghost-member-as-universal-integration-surface.md`). New member added = file edit + harness picks up next SendMessage.

CF-native options for "Agent C joins; A and B learn about C without prior registration":

- **KV roster as authoritative directory.** New agent writes its name + DO ID to KV; existing agents poll KV (or subscribe via DO alarms on change). Simple, but eventual-consistency on writes (<60s global) means a brief window where C exists but A/B don't see them.
- **DO-coordinated registry.** A `roster-DO` (single instance) holds the canonical agent list; agents query it on demand. Strong consistency. Bottleneck-shaped if roster query is frequent.
- **Queues broadcast on join.** Agent C publishes "joined" event to a `roster-events` Queue; A and B (and any future agent) consume the queue and update local cache. Push-based discovery; no polling.
- **Service Bindings.** Hard-wired at deploy time, doesn't help with runtime discovery.

**Recommendation for pilot (M2/M3 scope):** **`roster-DO` (single canonical registry) + Queue broadcast on join/leave.** Roster-DO is the source-of-truth (strong consistency, FR's `members[]` analog elevated to a substrate primitive); Queue is the change-notification channel (so agents don't poll on every send). Compared to FR's manual `members[]` editing, this is automation-via-substrate of what FR currently handles via team-lead's config.json edits + harness reload.

**Framework-research observation:** discovery is the surface where FR-current is most procedural (team-lead manually edits config.json) and where CF-native is most automated (substrate primitive handles it). **This is the bottleneck-alignment principle (§S3) at the comms layer: if a future FR team's bottleneck is "discovery/registration churn," CF substrate is the right adoption target; if not, FR's manual model is fine.** The pilot tests whether substrate-automated discovery actually moves needle for a 3-agent team (likely insufficient n; the bottleneck doesn't materialize until ~10+ agents with churn).

### 5. Persistence semantics

This is the §S6 Q1 + Q2 credibility-floor question, restated for comms specifically.

**What survives sandbox sleep (Q1 -- explicit per CF announcement):**

- DO storage: **yes, explicitly.** This is the substrate guarantee.
- KV: **yes, by design.**
- Queues: **yes, durable until consumed.**
- R2: **yes, by design.**
- In-DO-memory state (non-storage-backed): **no -- DO sleeps, RAM gone.** Important: mailbox-as-storage is durable; mailbox-as-in-memory-buffer is not.

**What survives distinct-session-termination (Q2 -- load-bearing-implicit per Preamble of findings.md):**

- DO storage: **expected yes, but credibility-floor open** -- announcement does not explicitly state DO storage survives session-termination separate from sleep. **This is the pilot's primary survivability probe.**
- KV: yes (independent of sessions).
- Queues: yes (independent of sessions).
- Roster (KV-backed): yes -- so the `members[]` analog survives even if all agent DOs are torn down.

**Pilot probe design (we-as-researchers):**

1. Agent A sends message to Agent B's DO mailbox; observe write.
2. Terminate Agent B's session entirely (TeamDelete-equivalent on CF).
3. Spawn Agent B-prime with the same `idFromName("agent-b")`.
4. Does B-prime see the message in storage? **If yes, Q2 resolved positive for DO storage; the comms primitive choice is validated.** **If no, the pilot has falsified a load-bearing assumption and the comms primitive must be re-evaluated** (likely toward R2/KV-backed mailbox-as-object pattern instead).

**Comms-layer survivability claim -- testable in execution:** A DO-mailbox + KV-roster composition makes survivability claims falsifiable in 2-3 probe-passes. The choice of DO-as-mailbox over R2-as-mailbox is **conditional on Q2 resolving positive**; if Q2 resolves negative, R2-with-ETag-versioning becomes the primary candidate (R2's storage durability is more conservatively documented than DO storage).

### 5.1 Q2 probe semantics -- what the test actually measures (v1.2 fold, G6 resolution + Brunel B2 clarification)

**Brunel B2 simplifies Q2 substantially.** Once AgentMailbox is a separate DO class (per-agent, idFromName(agent_id)-keyed) from Sandbox/IsolateRunner (per-session, idFromName(session_id)-keyed), Q2 is no longer ambiguous: the question is **"does AgentMailbox storage survive Pilot-B's session termination?"** Session termination affects per-session DO classes; per-agent AgentMailbox is structurally outside the affected scope.

**Three CF concepts in play (sharpened from v1.1):**

| Concept | Definition | Survives Pilot-B session termination? |
|---|---|---|
| **agent_id** (D1 row) | Per-agent persistent identifier; survives sessions; lifecycle controlled by `DELETE /api/agents/<agent_id>` only. | **Yes by construction** -- D1 is independent of session lifecycle. |
| **AgentMailbox DO ID** (per-agent class) | `idFromName(agent_id)` deterministic resolution. Storage is keyed on the DO ID. | **Yes by construction** -- agent_id stable → DO ID stable → storage stable. |
| **Sandbox / IsolateRunner DO ID** (per-session classes) | `idFromName(session_id)` deterministic resolution. Per-session state lives here. | Storage may survive (substrate guarantee unclear without probe); **but irrelevant to mailbox** -- mailbox is on AgentMailbox, not these classes. |

**Probe outcome interpretation table (sharpened):**

| Scenario | What the test sees | What it MEANS |
|---|---|---|
| B-prime reads stored messages from AgentMailbox via `list()` | AgentMailbox storage durable across Pilot-B session-termination | **Q2 positive** -- per-agent DO storage durability holds independent of Managed Agents session lifecycle. Comms primitive validated by construction (per Brunel B2 framing); probe is the empirical confirmation. |
| B-prime sees empty AgentMailbox storage | AgentMailbox storage gone OR DO namespace binding rebound | **Q2 negative -- diagnostic sub-causes:** (i) CF tore down per-agent-class DO storage at agent termination (note: not session-termination -- would mean termination cascades from session to agent_id, which would itself be a finding), OR (ii) Worker code drift between B and B-prime caused different `idFromName(...)` resolution (config-issue, not durability-issue). **Diagnostic follow-up needed.** |
| B-prime sees partial AgentMailbox storage | Suggests reaper / TTL behavior on AgentMailbox class | **Q2 partially positive** -- Round 2 characterizes the TTL surface for per-agent DO classes; for Round 1 record observation as substrate-property data. |

**Common mis-reads to avoid in execution:**

- ❌ "B-prime is a fresh session, so it gets a fresh DO" -- wrong. B-prime has the same `agent_id`; `idFromName(agent_id)` resolves to the SAME AgentMailbox DO ID; storage is the same backing. Per-session sandbox is fresh, but mailbox is per-agent.
- ❌ "We need to test storage continuity by reusing the same SESSION" -- Q2 explicitly tests session-termination resilience; reusing the session would fail to measure what the question asks.
- ❌ "If we put the mailbox on Sandbox/IsolateRunner instead, would the test be simpler?" -- that's the substrate-blindness trap. Putting mailbox on per-session classes makes Q2 trivially-negative by construction (messages live with the session, die with the session). Brunel B2 is load-bearing precisely because this trap is otherwise easy to fall into.
- ❌ "If idFromName returns the same ID, storage is automatically there" -- only true IF the per-agent-class DO storage survives across the session boundary. That IS the empirical question; the architecture makes a positive answer structurally expected, the probe confirms.

**Substrate-framework boundary materialization (joint with Brunel B2):** the test draws a TWO-layer boundary -- the framework owns `agent_id` (persistence anchor; D1-backed); the substrate owns `session_id` (Anthropic platform-managed, ephemeral). AgentMailbox-as-per-agent-class lives in the substrate but is **addressed via** the framework's persistence anchor. This is §S2's boundary materializing at the durability-vs-ephemerality layer of CF Managed Agents specifically. **Brunel's Gate B2 catch is the substrate-truth-evidence that revealed v1.1's two-layer collapse** -- credit log preserved.

**S1/S2/S3 sharpening posture (folded as best-read; Brunel counter-amendment slot open):**

- **S1 (agent_id vs agent-name as idFromName key)** -- folded as `idFromName(agent_id)` with Worker-layer D1 lookup `name → agent_id`. Add caching IF EO3 surfaces D1-read latency dominance.
- **S2 (alarm() vs direct-fire for outbound webhook)** -- folded as direct-fire for Round 1; alarm() flagged as Round 2 optimization.
- **S3 (three-direction route table)** -- folded as three-direction table in §1.1, distinguishing Anthropic→Worker `/webhooks` (inbound) from Worker→Anthropic outbound `fetch()`.

If Brunel B2 follow-up surfaces that any of S1/S2/S3 reads differ from his framing, fold as v1.2.1 amendment with the corrected position. None of the three reads are load-bearing on the cross-team-validated AgentMailbox-as-separate-class core decision.

### 5.1.1 Hibernation vs destruction-via-binding-drop (v1.3 -- Finn task #6 §5 line 213 fold)

**Three distinct AgentMailbox storage-lifecycle conditions, ranked by survivability:**

| Condition | Storage survives? | Mechanism |
|---|---|---|
| **Hibernation (DO sleep)** | **YES** (substrate guarantee) | DO instance is evicted from memory after idle TTL; SQLite-backed storage persists in CF's durable layer; next `idFromName(agent_id)` request re-allocates fresh instance and reloads storage from durable backing. Routine; not under our control; not affecting Q2 probe. |
| **Session termination** (Anthropic Managed Agents session ends) | **YES** (structurally expected per Brunel B2; Q2 empirically probes) | session_id-keyed per-session classes (Sandbox/IsolateRunner) end with the session; agent_id-keyed AgentMailbox is OUTSIDE this scope -- Q2 probe per §5.1. |
| **Destruction via binding drop** (deploy that removes AgentMailbox from `wrangler.jsonc` durable_objects bindings) | **NO** (per Finn task #6 §5 line 213) | If a deploy removes the `AgentMailbox` class binding from the Worker, CF reclaims storage for that class. **State is lost permanently.** This is NOT a routine condition; it requires explicit deploy-time action. |

**Round 1 disposition:** AgentMailbox binding is declared at pilot bring-up and stable through the pilot lifecycle. Destruction-via-binding-drop is **not a Round 1 concern** -- would require an explicit `wrangler.jsonc` edit removing the AgentMailbox binding. **But it IS a Round 2 watch-point** (see §6.4) when the pilot evolves and Worker configs churn.

**EO1 / Q2 probe scope clarification:** the probe (per §5.1) tests session-termination resilience; it does NOT test destruction-via-binding-drop resilience. The latter cannot be tested without a destructive deploy operation that's wholly outside the pilot's normal lifecycle. **§6.4 records this as a Round-2 watch-point** rather than a Round-1 probe item.

## Comparison to FR-existing (load-bearing table)

| Dimension | FR-current | CF-native (pilot proposal) | Boundary classification (per §S2) |
|---|---|---|---|
| **Identity** | `members[]` in config.json (name-string keys, manually maintained, mid-session edits honored) | Three-layer chain: agent-name (user-facing) → agent_id (D1-persisted, persistence anchor) → DO ID via `idFromName(agent_id)`; AgentMailbox is a NEW per-agent DO class | Identity-as-name = framework-state; agent_id + name-resolution + AgentMailbox storage = substrate-state |
| **Transport** | JSON file append + fcntl.flock (atomic primitive per `cross-host-atomic-inbox-write-primitive.md`) | AgentMailbox DO storage `put`/`list` (single-instance serialization gives atomic equivalent); Worker→AgentMailbox via service binding | Transport mechanism = substrate-state; envelope shape on top = framework-state |
| **Envelope** | SendMessage tool shape (to/summary/message, typed protocol-responses) | Same envelope, zod-validated at AgentMailbox DO entry | Envelope = framework-state (FR-owned per §S2) |
| **Discovery** | Manual config.json edit + ghost-bridge daemon for cross-team | D1 row (Round 1 source of truth) + KV roster cache + Queue broadcast on join/leave (Round 2) | Roster-as-data = framework-state; roster-storage-and-event-propagation = substrate-state |
| **Persistence** | inbox.json file on disk (survives container restart; lost on TeamDelete unless committed to repo) | AgentMailbox DO storage -- per-agent, distinct from per-session Sandbox/IsolateRunner classes (survives sleep -- explicit; survives session-termination -- structurally expected per Brunel B2; Q2 empirically probes) | Persistence semantics = substrate-state (CF-owned under pilot); class-choice (AgentMailbox vs per-session) = framework-state |

**Headline observation:** the **shape** (identity, transport, envelope, discovery, persistence) is invariant across FR-current and CF-native. The **substrate primitives** differ. This is §S5's Sub-shape E cross-substrate-class confirmation at the comms-protocol level: same boundary structure (5 dimensions, same coupling), different substrate ownership for the dimensions that fall on the substrate side of §S2's boundary.

## 6. Watch-points (v1.1 amendment)

Non-blocking-for-Round-1 gaps that are explicitly named here so they don't get re-discovered as bugs in Round 2 / M2.

### 6.1 `from`-field provenance under DO writes (G4)

**The gap:** comms.md §3 says `from` is "implicit, harness-injected" in FR-current. On CF substrate, there is no harness to inject; who fills `from`?

**Round 1 disposition:** **honest-trustless** -- sender's tool-call includes `from` in the envelope payload; Worker forwards it unverified to the DO; DO stores it as-is. **This is correct for Round 1 because the pilot has 2 hardcoded agents** with no adversarial threat model; envelope-integrity round-trip (EO2) is observable on receive side.

**Why this is a watch-point not a blocker:**

- 2-agent pilot has trivial trust topology; the cost of mis-attribution is operator confusion, not security failure.
- The honest-trustless contract is **easy to upgrade without envelope rework**: add a `from-verified-by` Worker-injected field at §1.2 evolution time (option (c) above with signature verification); the FR-side envelope shape stays intact.

**Round 2 resolution shape:** Worker injects an authenticated `from` value derived from the calling tool's identity (most likely the Anthropic Managed Agents agent-name extracted from the callback signature). Sender-claimed `from` is checked against verified value; mismatch is a 401-equivalent at the Worker boundary. **Spec this before adding a 3rd agent** -- that's the threshold where adversarial mis-attribution first matters.

**Important scope clarification (v1.3 -- Finn task #6 §3 + Finn G2 §2 cross-ref):** **egress policy is sandbox-spawn-time per-session-attachment, NOT inter-agent-write-time. It is scoped to substrate.md / lifecycle.md, NOT comms.md.** Egress policy controls what the per-session IsolateRunner DO can `fetch()` outward (Anthropic API, allowlisted hosts); it does NOT participate in `from`-injection authority for AgentMailbox writes. The `from`-injection-authority concern (G4) is comms-layer; egress-policy is sandbox-layer. **Two distinct concerns; folding them would be a category error.** Naming the boundary explicitly to remove who-owns-it ambiguity.

### 6.2 KV roster as ACL gate vs `idFromName` deterministic resolution (G8)

**The gap:** §2 claims the KV roster is the "is this name a valid teammate" gate, but `idFromName("any-string")` always resolves to a valid (possibly empty) DO. **The KV roster is only an ACL gate IF the Worker explicitly reads it before forwarding to the DO** -- which is not currently in the §1.1 handler spec.

**Round 1 disposition:** **two hardcoded agents (`pilot-a`, `pilot-b`) make the issue dormant** -- there's no scenario where a sender attempts a non-roster recipient in Round 1.

**Round 2 mitigation (required for KV roster to deliver on its §2 claim):**

```
// Worker /inbox/<recipient> handler pseudocode
const recipient = url.pathname.split('/')[2];
const roster = await env.KV.get('roster', 'json');
if (!roster.includes(recipient)) return new Response('unknown recipient', { status: 404 });
const id = env.DO_NS.idFromName(recipient);
const stub = env.DO_NS.get(id);
return stub.fetch(request);
```

The 404 (not 401) is deliberate -- at the substrate layer, unknown-recipient is "we don't have a mailbox for that name," not an authentication failure. The auth check (G4) is logically separate.

**Discipline note:** §2's claim "KV roster is the source of truth for is-this-name-a-valid-teammate" is a **substrate-discipline claim, not a substrate-guarantee** -- it only holds if the Worker handler enforces it. Adding the enforcement to §1.1 handler spec is the operational fix; flagged here as the Round 2 entry point.

### 6.3 Recursive-Narrowing Substrate-Truth-Evidence Discipline (v1.4 n=5 -- Brunel-endorsed; Cal-Protocol-A candidate, promotion-grade; separate entry per Aen 15:22 routing)

**Headline framing (v1.4, Brunel + Aen sharpened):** *"Substrate-truth-evidence catches substrate-blind-spots **recursively** on a single document's iteration-depth trajectory; each pass narrows but doesn't eliminate them, because the next-deeper substrate primitive can still hide behind the previous pass's framing -- AT PROGRESSIVELY DEEPER ARCHITECTURAL LAYERS, not just count-the-passes."*

**The discipline is NOT idempotent.** Applying it once does not eliminate the residual blind-spot class. EVERY layer is a residual class until the next-deeper substrate-truth pass.

**n=5 substrate-blind-spot catalog ON A SINGLE DOCUMENT'S TRAJECTORY** (within ~2-hour window, 14:01-15:50, on comms.md v1.0 → v1.1 → v1.2 → v1.3 → v1.4):

| n | Where the blind-spot lived | Architectural layer | Catch mechanism | Caught at |
|---|---|---|---|---|
| **n=1** | S35 draft → v1.1 fold: G1-G5 design-author blind-spots (operational gaps invisible to author) | Operational-spec layer | Same-author exec-readiness re-read (Herald) | 14:01 |
| **n=2** | v1.1 fold → v1.2 fold: two-layer identity-chain collapse (per-agent-vs-per-session DO blindness; mailbox-on-IsolateRunner would falsify Q2 by construction) | DO-class-keying layer | Cross-team substrate-truth-evidence (Brunel Gate B2) | 14:33 |
| **n=3** | v1.2 fold → v1.3 fold-in-flight: direct-fire-vs-alarm dichotomy at outbound wake (missing the substrate's `ctx.waitUntil` shape (b)) | Outbound-dispatch-mechanism layer | Cross-team substrate-truth-evidence (Brunel S2 response) | ~15:00 |
| **n=4** | v1.2 §1.1 → v1.3 fold-in-flight: agent-traffic-through-Worker-HTTP-route framing (missed Path (a) DO-to-DO RPC for agent-originated delivery; substrate offers RPC primitive bypassing Worker HTTP entirely) | Worker-route-shape layer | Cross-team substrate-truth-evidence (Finn G2 §3) | 14:45 |
| **n=5 (v1.4 NEW)** | v1.3 §1.3 step 7 → v1.4 fold: outbound-webhook-direction mismodel (Anthropic doesn't dial us; we long-poll them). v1.3 framed wake as "AgentMailbox fires outbound webhook to Anthropic's per-agent inbound-event URL" -- that URL doesn't exist on Anthropic's side. Actual mechanism is `sessions.create` SDK call + worker long-poll loop | **Connectivity-direction-model layer** (deeper than n=1-4; all of those were substrate-primitive-shape catches; n=5 is architectural-direction catch) | Cross-team substrate-truth-evidence (Finn-skill-load W4 brief; `claude-api` skill surfaced canonical Anthropic doc) | ~15:31 |

**Architectural-depth observation (v1.4 NEW):** n=5 demonstrates the recursive-narrowing pattern survives at deeper-than-substrate-primitives layer. n=1-4 were all substrate-primitive-shape catches (which DO class, which dispatch verb, which route, which DO method); n=5 is a **connectivity-direction-model** catch -- strictly architectural, not primitive-shape. **Each pass on the same document keeps finding substrate-truth at progressively deeper architectural layers**, not just deeper substrate primitives at the same architectural level. Brunel's structural-vs-coincidental falsifiability framing strengthens at n=5: within-author iteration-depth produces catches at architecturally-distinct depths, not just count-the-passes.

**Doubly self-validating pattern (Brunel-pinned):** the S2 cross-read instance that caught n=3 **IS itself an instance of the discipline applying to itself**. Herald's framing (direct-fire-vs-alarm) was design-time; Brunel's waitUntil-surfacing was the deployed-substrate-state catch. The catching process instantiated the discipline whose articulation the catch produced. **n=5 extends the pattern**: the W4 catch landed during the same session as the discipline was being articulated; the discipline catches a substrate-truth gap in the document that articulates the discipline, AT THE SAME TIME as the discipline's framing was being articulated. The Cal-entry's catalyzing-incident IS the artifact of the discipline working on the discipline's own articulation, AT MULTIPLE INSTANCES.

**Cal-entry framing recommendation (v1.4 -- Aen 15:22 routing-split + Brunel 15:18 within-author-first ordering):**

This entry routes to its own **separate Cal entry** (NOT joint-title with sub-shape-e-at-design-domain.md; that's a different axis per Aen 15:22). Two patterns are family-adjacent but axis-distinct:

- **Joint 2.5 entry (`teams/framework-research/wiki/patterns/sub-shape-e-at-design-domain.md` -- already shipped):** cross-author cross-document; coupling-dimension = design-layer-position-in-the-pilot. Reproducibility-evidence axis. Co-source-agents `[volta, herald, brunel, hopper, callimachus]`.
- **This entry (separate, pending Cal absorption):** within-one-document iteration-depth-of-substrate-truth-pass. coupling-dimension = iteration-depth. **Structural-evidence axis.** Co-source-agents `[herald, brunel, finn]`.

**Cal-entry drafting posture (Brunel 15:18 + Aen 15:22 + v1.4 sharpening):**

- **Title:** `Recursive-Narrowing Substrate-Truth-Evidence Discipline`
- **Headline:** "Substrate-truth-evidence catches substrate-blind-spots recursively on a single document's iteration-depth trajectory; each pass narrows but doesn't eliminate them, because the next-deeper substrate primitive can hide behind the previous pass's framing -- at progressively deeper architectural layers."
- **Open with within-author n=5 ON A SINGLE DOCUMENT'S TRAJECTORY** (comms.md v1.0 → v1.1 → v1.2 → v1.3 → v1.4) per Brunel 15:18 falsifiability framing + Aen 15:22 axis-distinction: within-author = sufficient condition (structural, not coincidental); the iteration-depth axis IS the coupling-dimension.
- **Close with cross-author reproducibility** at the iteration-boundaries (different reviewers caught different depths: Herald n=1; Brunel n=2 + n=3; Finn n=4 + n=5). AXIS is iteration-depth, not reviewer-identity -- but cross-author cooperation IS the necessary-condition demonstration.
- **Closing-prose-line (Brunel 15:18 offer, verbatim):** *"The entry's own catalyzing-incident -- the within-author-vs-cross-author falsifiability framing emerging from Brunel's S2 cross-read on Herald's v1.2 framing -- IS itself the discipline applying to its own articulation. Pinned for posterity; not extended into the catalog because doing so would conflate substrate-primitive-catches with framing-of-the-discipline catches. The two epistemic classes share a family (recursive-application of substrate-truth-evidence discipline) but distinct subjects (substrate primitives vs the discipline's own articulation)."*

**Filing posture:** pending Cal absorption per team-lead routing; bandwidth-cheap. Brunel + Finn both standing-down on substantive work; this entry is the last open Cal-queue item from S36's comms.md trajectory.

### 6.4 AgentMailbox destruction-via-binding-drop (v1.3 NEW watch -- Finn task #6 §5)

**The gap (Round-2 concern, NOT Round-1 blocker):** AgentMailbox DO storage survives hibernation (substrate guarantee per §5.1.1) and session termination (Brunel B2 structural; Q2 probe per §5.1). It does NOT survive destruction of the DO class binding -- if a future deploy removes the `AgentMailbox` entry from `wrangler.jsonc` `durable_objects.bindings[]`, CF reclaims the storage permanently.

**Round 1 disposition:** dormant. AgentMailbox binding is declared at pilot bring-up and stable through Round 1 lifecycle. No `wrangler.jsonc` churn expected; pilot operators understand the AgentMailbox binding is load-bearing and must not be dropped.

**Round 2 mitigation candidates (NOT in scope for Round 1, named for posterity):**

- **Pre-flight check** at deploy time: tooling that warns if AgentMailbox binding is being removed from the latest deploy. Cheap; defensive.
- **R2-mirrored mailbox snapshots:** AgentMailbox writes also append to an R2 object per agent (eventual-consistency dual-write); destruction-via-binding-drop loses DO storage but R2 retains backup. Trade-off: extra storage cost + dual-write latency for disaster-recovery resilience.
- **Operator runbook:** "if AgentMailbox needs to be renamed/replaced, migrate data first." Documentation-grade mitigation.

**Why this is a separate watch-point from §5.1 Q2:** Q2 probes session-termination resilience (routine condition); §6.4 names destruction-via-binding-drop (rare, deploy-time-explicit condition). Conflating them would make Q2 untestable (would require destructive deploy) AND would make §6.4 invisible (gets folded into Q2's "structurally expected positive"). They are **distinct lifecycle classes** and warrant distinct watch-points.

## Open questions

**Blocking on CF account specifics (Brunel's parallel brief):**

- BO1: Are DOs available on the pilot CF account tier? (Some tiers exclude DOs.)
- BO2: Are Queues available on the pilot CF account tier?
- BO3: Pricing of DO storage at 3-agent pilot scale (likely negligible, but Brunel confirms).

**Testable only in pilot execution:**

- EO1 (Q2 resolution): does DO storage survive distinct-session-termination? Probe per §5 above; semantics per §5.1.
- EO2: does FR's SendMessage envelope round-trip cleanly through DO storage JSON serialization without impedance? Probe = round-trip a typed `shutdown_response` envelope; check field-set integrity. Measurement contract per §3.5 (three-point byte comparison).
- EO3: latency of DO mailbox write→wake→read vs FR's current ssh+python3+fcntl baseline (657-854ms median per `cross-host-atomic-inbox-write-primitive.md`). Substrate-property baseline for comparison. Measurement boundaries per §EO3.1.
- EO3.1 (v1.1 amendment, G7 resolution) -- **latency measurement boundaries.** The FR baseline measures `sender's SendMessage tool call invocation → recipient's inbox.json file is readable by recipient process`. The CF analog requires three measurement endpoints, only one of which is apples-to-apples with FR:
  - **(a) Push-side latency:** Pilot-A's `send_message` tool-call → Pilot-B's `/webhooks` callback fires. Measures Worker + DO + Anthropic outbound webhook path. **Excludes agent wake.**
  - **(b) Full round-trip latency (canonical for EO3):** Pilot-A's `send_message` tool-call → Pilot-B's next session reads the message from DO storage. **Includes Managed Agents session allocation + agent wake + storage read.** This is the apples-to-apples comparison with FR's baseline.
  - **(c) Storage-write latency:** Worker POST received → DO storage append observable via `list()`. Measures DO single-instance serialization cost only. Useful for substrate-property characterization but NOT comparable to FR baseline.
  - **Canonical EO3 measurement = (b).** Report (a) and (c) as substrate-property data alongside (b) so we can decompose latency budget if needed.
  - **Instrumentation hooks (v1.4 -- W4 reframed; verbs updated for sessions.create + long-poll worker):**
    - `t0` = Pilot-A envelope `sent_at` field (set just before tool-call; carried in envelope per §3 + §3.5)
    - `t1` = AgentMailbox storage append timestamp (the `<iso-timestamp>` in the storage key per §3.5)
    - `t1.5` = `sessions.create` SDK call response timestamp (Anthropic returns the new session_id; outbound wake-trigger ack)
    - `t2` = long-poll worker pickup timestamp (`environments.work.poll` returns the new session-start work item; v1.4 NEW -- replaces v1.3's "/webhooks callback timestamp")
    - `t3` = Pilot-B's `drainUnread` invocation timestamp at IsolateRunner.start (session start)
    - **(a) = t2 - t0** (push-side latency: sender tool-call through Anthropic queue to worker pickup), **(b) = t3 - t0** (full round-trip: sender tool-call to recipient inbox-read at session start), **(c) = t1 - t0** (storage-write latency only).
    - **t1.5 - t1** = SDK call latency (Worker→Anthropic outbound). **t2 - t1.5** = Anthropic queue + long-poll cycle latency (substrate-property; not under our control).
  - **Repeatability:** target 20 round-trips minimum for median; report p50/p95 to surface tail-latency behavior.
- EO4 (FR-S7-E4 connection): does the dyad-crossed-messages pattern recur on CF substrate? If yes, dyad pattern is substrate-invariant (strong finding). If no, it was FR-substrate-specific (different but useful finding).

**Substrate-research-grade open questions (v1.3 -- Brunel S1/S2 + Finn G2 flags):**

- **EO-D1-1 (Brunel S1):** Cross-region D1 lookup consistency for fresh agents. D1 has eventual-consistency semantics at edge per CF docs; brief window after `POST /api/agents` where `name → agent_id` lookup could miss for a freshly-created agent. **Round 1 disposition:** 2-agent fixed-scale, agents created at pilot bring-up -- does not hit this. **Round 2 watch:** dynamic-roster scenarios; mitigation = retry-with-backoff on D1 miss or alternative resolution path. Optional fold.

- **EO-URL-1 (Brunel S1 trade-off):** URL-stickiness post-rename. The `/inbox/<recipient-name>` route (Path (b)) accepts user-facing agent-name for UX; sender-side URL caching → 404 if recipient is renamed. **Round 1 disposition:** no rename expected in Round 1. **Round 2 trade-off:** UX (readable URL) vs URL-stability (agent_id in URL eliminates D1 lookup AND survives rename, at cost of unreadable URL). Reopen deliberately when Round 2 dynamic-roster lands.

- **EO-DO-1 (Brunel S2 substrate-truth uncertainty):** DO concurrent-inbound behavior under handler-await. CF docs Brunel fetched did NOT explicitly confirm DO single-threaded-per-instance semantics under async handlers. Round-1 empirical probe: measure latency of inbound-fetch-2 while inbound-fetch-1 is mid-outbound-await. **Less critical given shape (b) waitUntil structurally removes the queueing concern**, but worth confirming substrate model. Probe shape: 5-second deliberate-delay outbound mock; two concurrent inbound fetches; observe whether second queues or parallel-handles.

- **EO-DO-2 (Brunel S2 substrate-truth uncertainty; LOAD-BEARING for shape (b)):** Hibernation timing with `ctx.waitUntil` promise pending. CF docs imply "events such as alarms, incoming requests, and scheduled callbacks prevent hibernation" -- unclear if waitUntil-pending-promise counts. **If hibernation kills in-flight waitUntil-managed outbound `fetch()`, the wake mechanism breaks silently.** Round-1 probe design (Brunel-belt-and-suspenders refinement adopted):
  - Instrument BOTH ends: log `Date.now()` at DO waitUntil-entry + at outbound-mock-receipt + at outbound-mock-response-return; record mock-side parallel timestamps.
  - Trigger: outbound fetch with 5-second deliberate delay at Anthropic-side mock (sleep).
  - Observation: if DO hibernates mid-flight, elapsed-at-DO-side gaps in a discoverable way (or the entire outbound silently fails). Adds zero substrate-cost; gives answer regardless of whether wake-trigger arrives.
  - **If positive (waitUntil prevents hibernation):** Round 1 shape (b) validated; no further action.
  - **If negative (hibernation kills in-flight waitUntil):** Round 1 needs shape (c) alarm() emergency fold (alarm() is documented to prevent hibernation); not blocking design, but executability-blocking until amendment.

- **EO-W123 (v1.4 RESOLVED via Finn W4):** identify which of (W1) `beta.sessions.create({ agent_id })` / (W2) `beta.environments.work.enqueue(...)` / (W3) no-SDK-API-supports-inbound-trigger is the actual state. **Resolved:** W4 = W1-shape ratified (`client.beta.sessions.create(agent=recipient_agent_id, environment_id=...)`). W2 falsified (no `work.enqueue` -- work appears via session creation). W3 falsified at orchestrator-shape but valid at worker-shape (long-poll IS the receive channel, just worker-side not orchestrator-side). v1.4 §1.2 + §1.3 + §1.1 rows 4 + 5 fold the W4 resolution. **Task #11 marked completable per Finn W4 §5 -- no longer a research task; design choice between always-on worker (recommended for Round 1) vs webhook-driven worker.** Entry tombstoned-as-resolved for amendments-log traceability.

- **EO-W123-Round-2 (v1.4 NEW -- resume-vs-create-new tradeoff):** Round 1 = create-new session per inter-agent message (Finn W4 recommendation). Round 2 evolution candidate: check for recipient's existing `idle` session before `sessions.create`; if present, `events.send()` `user.message` event instead of new session. Avoids cold-start latency; adds resume-discovery complexity. Discriminator for Round-2 reopen: empirical Round-1 cold-start latency observed in §EO3 baseline. Filed as substrate-research-grade open question for Round-2 design.

- **EO-W123-credential-scope (v1.4 NEW -- feeds Task #10):** the `sessions.create` SDK call requires `sessions.create` scope on whatever auth credential we settle on per S35 OAuth-token decision. Two distinct call-surface scopes: `sessions.create` (mailbox handler -- row 4) + `environments.work.poll` (long-poll worker -- row 5). If single OAuth token replaces both `ANTHROPIC_API_KEY` AND `ANTHROPIC_ENVIRONMENT_KEY`, scope must cover both. Mailbox wake fails silently (403 on create) if scope missing. **Cross-ref: Task #10 (Round 1 op-step-2 Anthropic credential shape) per Finn W4 §"Credential scope implications" + Finn task #6 §2 two-credential split.**

**Framework-level open (not blocking the pilot but worth flagging):**

- FO1: if the pilot succeeds, does the CF-native discovery automation (KV roster + Queue broadcast) backflow to FR-current as a Sub-shape E inversion? I.e., could FR's manual config.json model be replaced by a substrate-style automated roster even before adopting CF substrate? (Per §S3 mvox-dev row: bottleneck-shaped, not substrate-shaped -- likely no, but worth naming.)
- FO2: how does CF-native comms compose with FR's ghost-member pattern (`ghost-member-as-universal-integration-surface.md`)? Specifically: is a CF-pilot agent representable as a FR ghost-member for FR↔pilot interop? Likely yes (the ghost-member abstraction was designed substrate-agnostic), but the daemon-shape needs explicit thought. **Cross-link candidate for any future cross-substrate finding.**

(*FR:Herald -- v1.4 cross-team-validated by Brunel (Gate B2 + S1/S2/waitUntil substrate-truth-evidence) + Finn (task #6 + G2 brief + W4 brief -- connectivity-direction-model correction); co-source-agents: [herald, brunel, finn]*)
