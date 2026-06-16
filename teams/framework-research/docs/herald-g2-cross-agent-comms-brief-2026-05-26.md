# Herald G2 -- cross-agent A→B message delivery (Isolate, Round 1)

**Targeted brief for Herald's v1.1.1 fold-pass on comms.md §1.2.**
**Substrate ground: Brunel B2 (separate `AgentMailbox` DO class).**
**Companion to:** `docs/webhook-sandbox-research-2026-05-26.md` (full surface).

Date: 2026-05-26. Author: Finn.

---

## G2 in one paragraph

In the Isolate-Round-1 model, **Pilot-A does not directly send a message to Pilot-B**. Pilot-A's Anthropic agent emits a `send_message` *custom tool call*; the tool handler runs inside Pilot-A's `IsolateRunner` Durable Object (NOT inside the isolate sandbox itself); the handler decides routing and writes to Pilot-B's `AgentMailbox` DO; the mailbox is then responsible for waking Pilot-B via an outbound webhook to Anthropic. The agent-author writes natural tool-call code; the substrate handles delivery + wake.

---

## The five-step path

### Step 1 -- Pilot-A emits a custom tool call

At agent-create time, Pilot-A is registered with a `send_message` custom tool in its `tools[]`:

```jsonc
// POST /api/agents
{
  "name": "pilot-a",
  "backend": "isolate",
  "model": "claude-sonnet-4-6",
  "tools": [
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
  ]
}
```

The agent model invokes this tool the same way it invokes any other tool -- there's no special primitive. **From the LLM's perspective, sending a message is indistinguishable from calling `cf_read` or `bash`.**

### Step 2 -- In-DO custom-tool handler

The tool call lands on Pilot-A's `IsolateRunner` Durable Object, which runs Anthropic's `ToolDispatcher` against the tool list. The reference dispatcher pattern (`src/isolate/custom-dispatch.ts` in the CMA repo) registers a handler closure over the Worker `env`:

```ts
// inside IsolateRunner.start(), tool list assembly
const customTools: BetaRunnableTool[] = [
  {
    name: "send_message",
    description: "...",
    input_schema: {...},
    run: async (args: { to: string; summary?: string; message: string }, _ctx) => {
      // STEP 3 happens here -- see below
      return await deliverInterAgentMessage(env, {
        fromAgentId: this.agentId,
        fromSessionId: this.sessionId,
        toAgentName: args.to,
        summary: args.summary,
        message: args.message,
      });
    },
  },
];
```

**The handler runs INSIDE Pilot-A's DO**, with full access to:

- Worker `env` (so it can RPC the AgentMailbox DO directly)
- Pilot-A's `agentId` and `sessionId` (auto-attributed for provenance)
- Egress policy already attached (any outbound fetch goes through `IsolateOutboundGateway`)

This is the key Round-1 design lever: **all comms primitives are just custom tools whose handlers run in our Worker's address space, not in the isolate sandbox**. The sandbox never sees the network; the DO is what touches it.

### Step 3 -- Forwarding decision (two candidate paths)

The handler has two structural options for how it actually delivers the message. Both work; we should pick one for Round 1 and document the trade.

#### Path (a) -- Direct DO-to-DO RPC (RECOMMENDED for Round 1)

```ts
async function deliverInterAgentMessage(env: Env, msg: InterAgentMessage) {
  const toAgentId = await resolveAgentByName(env.DB, msg.toAgentName);
  if (!toAgentId) {
    return { ok: false, error: `unknown agent: ${msg.toAgentName}` };
  }
  const mailboxId = env.AgentMailbox.idFromName(toAgentId);
  const mailbox = env.AgentMailbox.get(mailboxId);
  return await mailbox.append({
    from: { agentId: msg.fromAgentId, sessionId: msg.fromSessionId },
    summary: msg.summary,
    message: msg.message,
    timestamp: Date.now(),
  });
}
```

**Pros:**

- Single hop, no HTTP serialization, no auth boundary inside our own substrate.
- Type-safe across the call (`AgentMailbox` is just a class).
- Backpressure is implicit -- DO RPC awaits the append before returning.
- Failures propagate as exceptions back into the tool call, so Pilot-A's agent gets a real error result if delivery fails.

**Cons:**

- Couples Pilot-A's DO to the `AgentMailbox` binding being present. Not a real problem (it's the same Worker), but it does mean the binding can't be removed without breaking comms.
- Harder to swap out for a remote/cross-Worker mailbox later (Round 2+). Not a Round-1 concern.

#### Path (b) -- Indirect via Worker HTTP route

```ts
async function deliverInterAgentMessage(env: Env, msg: InterAgentMessage) {
  const resp = await fetch(`https://${env.WORKER_HOSTNAME}/inbox/${msg.toAgentName}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-auth": env.INTERNAL_AUTH_SECRET,
      "x-from-agent": msg.fromAgentId,
      "x-from-session": msg.fromSessionId,
    },
    body: JSON.stringify({
      summary: msg.summary,
      message: msg.message,
    }),
  });
  return { ok: resp.ok, status: resp.status };
}
```

The Worker route at `/inbox/:name` then does the name-resolution + DO RPC.

**Pros:**

- Same route is reusable by external callers (admin tools, dashboard) -- one mailbox-write surface for everyone.
- Cleaner Round-2+ migration story if mailbox ever moves off-Worker.
- Observability: every inter-agent message shows up as a Worker request in logs/metrics.

**Cons:**

- Adds an HTTP serialization round-trip + auth check for what is ultimately a same-Worker call. Wasted CPU.
- The outbound fetch goes through `IsolateOutboundGateway` (egress policy) -- Pilot-A would need an egress allowlist entry for its own Worker's hostname, which is an awkward circular dependency.
- Auth secret (`INTERNAL_AUTH_SECRET`) becomes a shared bearer the DO needs access to.

**Round-1 recommendation: path (a).** The HTTP route can be added later as a thin proxy that delegates to the same RPC method, giving both surfaces without the early circular-egress problem. Document (b) in comms.md as the "external delivery surface -- out of Round 1 scope."

### Step 4 -- Mailbox write (Brunel B2 substrate)

Per Brunel's B2 read, `AgentMailbox` is a **separate DO class**, not a method on `IsolateRunner`. This matters:

- Pilot-B's `AgentMailbox` exists independently of whether Pilot-B has a live session. A message can be appended to a sleeping or never-yet-instantiated mailbox.
- The DO id is `env.AgentMailbox.idFromName(agentId)` -- keyed by **agent_id, NOT session_id**. Sessions come and go; the mailbox is per-agent (immutable identity).
- Storage append is via DO SQLite (consistent with Isolate's persistence model -- same as `IsolateRunner` uses for the workspace).

```ts
// Sketch of AgentMailbox DO
export class AgentMailbox extends DurableObject<Env> {
  async append(msg: InboundMessage): Promise<{ ok: true; id: string }> {
    const id = crypto.randomUUID();
    this.ctx.storage.sql.exec(
      `INSERT INTO messages (id, from_agent, from_session, summary, body, ts, read)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      id, msg.from.agentId, msg.from.sessionId, msg.summary ?? null, msg.message, msg.timestamp,
    );
    // STEP 5 -- wake Pilot-B
    await this.wakeRecipient();
    return { ok: true, id };
  }

  async drainUnread(): Promise<InboundMessage[]> {
    const rows = this.ctx.storage.sql.exec(
      `SELECT * FROM messages WHERE read = 0 ORDER BY ts ASC`,
    ).toArray();
    this.ctx.storage.sql.exec(`UPDATE messages SET read = 1 WHERE read = 0`);
    return rows.map(toInboundMessage);
  }
}
```

Append is **fire-and-acknowledge** from Pilot-A's perspective -- the tool call returns once storage commits + the wake-trigger fires, but does NOT block until Pilot-B reads. This matches the human-mail analogy (sender confirms postal-system handoff, not recipient pickup).

### Step 5 -- Waking Pilot-B

This is where Round 1's two-credentials-from-the-research come back into play. The mailbox needs to cause Anthropic to start Pilot-B's next session. **It cannot create a sandbox directly** -- per Task #6 §3 of the companion doc, sandbox creation is exclusively webhook-driven from Anthropic.

The path:

```ts
// inside AgentMailbox.wakeRecipient()
async wakeRecipient() {
  const client = new Anthropic({
    apiKey: null,
    authToken: this.env.ANTHROPIC_API_KEY,   // or ANTHROPIC_ENVIRONMENT_KEY -- TBD per S35 token decision
    baseURL: resolveAnthropicBaseURL(this.env),
  });
  // Anthropic Managed Agents SDK call to enqueue work against the recipient.
  // Exact API surface -- `beta.sessions.create` or
  // `beta.environments.work.enqueue` -- needs SDK doc lookup; the principle
  // is "tell Anthropic there's work for agent_id=<recipient>".
  await client.beta.something.enqueue({ agent_id: this.recipientAgentId, ... });
  // Anthropic then issues `session.status_run_started` webhook → our /webhooks →
  // drainWork() → IsolateRunner.start() → Pilot-B's session boots.
}
```

**Open question for comms.md:** Round 1 needs to identify the exact Anthropic SDK call that triggers an inbound webhook for a named agent. The reference CMA repo doesn't include this path (CMA assumes Anthropic is the originator; we're inverting the flow). Three candidate shapes:

- **(W1) Sessions API direct create.** If `beta.sessions.create({ agent_id })` exists in the 0.96 SDK, this is the cleanest path -- explicit "start a session for this agent."
- **(W2) Environments work-enqueue.** If sessions are platform-managed and only the work queue is writable, we'd enqueue work and let Anthropic decide whether to start a session.
- **(W3) Custom orchestration.** If neither API surface supports inbound trigger, Round 1 would need a polling shape -- every X seconds, our Worker checks for non-empty mailboxes and… stalls, because we still can't create sandboxes without Anthropic.

If **(W3)** turns out to be the actual state of the SDK, this is a Round-1 blocker -- not for the comms-doc design, but for executability. Hopper should verify against the 0.96 SDK + ant 1.8 CLI before Pilot-B is expected to wake on inbound. **I'm flagging this as a research follow-up, NOT answering it in this brief** -- the SDK call surface is outside Task #6 scope.

### Step 6 (implicit) -- Pilot-B reads on session start

When Pilot-B's `IsolateRunner.start()` runs, its first action (before invoking the agent loop) is to drain its mailbox:

```ts
// inside IsolateRunner.start(), before ToolDispatcher kicks off
const mailbox = env.AgentMailbox.get(env.AgentMailbox.idFromName(this.agentId));
const unread = await mailbox.drainUnread();
if (unread.length > 0) {
  // Inject the unread messages into the conversation as a synthetic user
  // turn (or a structured tool result, depending on agent shape).
  this.initialContext = formatInboxAsPrompt(unread);
}
```

This makes the **mailbox the only place Pilot-B sees inbound messages** -- no push to a running agent, no streaming. Pilot-B's session boundary IS the message-receive boundary. Matches the human-mail analogy and keeps the conversation-window discipline clean.

---

## Summary diagram

```
Pilot-A's agent (LLM)
        │ emits tool_use: send_message(to="pilot-b", ...)
        ▼
ToolDispatcher (inside IsolateRunner_A DO)
        │ runs custom_tools["send_message"].run(args)
        ▼
deliverInterAgentMessage(env, msg)        ┐
        │ resolveAgentByName → agent_id   │ STEPS 3-4
        │ env.AgentMailbox.idFromName(id) │
        ▼                                  │
AgentMailbox_B DO                          ┘
        │ .append(msg) → SQLite insert
        ▼
AgentMailbox_B.wakeRecipient()             ┐
        │ Anthropic SDK call (W1/W2 TBD)   │ STEP 5
        ▼                                   │
Anthropic Managed Agents platform           │
        │ webhook → POST /webhooks          │
        ▼                                   ┘
Our Worker /webhooks handler
        │ drainWork → IsolateRunner_B.start()
        ▼
IsolateRunner_B.start()                    ┐ STEP 6
        │ mailbox.drainUnread()             │
        │ inject as initialContext          │
        ▼                                   │
Pilot-B's agent (LLM)                       ┘
        sees inbound message in first turn
```

---

## Concrete questions for Herald's v1.1.1 fold

1. **Does comms.md §1.2 explicitly state the custom-tool nature of `send_message`?** It should -- otherwise readers will reach for "send to a fetch endpoint" intuitions.
2. **Path (a) vs (b) -- does Round 1 need both, or can (b) defer?** My read: defer (b); add a one-line "external delivery surface deferred to Round 2" note.
3. **Mailbox key = agent_id, not session_id -- is this captured?** Critical for understanding why mailbox survives session boundaries and sandbox restarts. Brunel's B2 implies this; comms.md should make it explicit.
4. **Step 5 wake-mechanism -- is the SDK surface confirmed, or assumed?** If assumed, comms.md should flag it as a precondition on Hopper's research (one of W1/W2/W3 must be tractable).
5. **Step 6 mailbox-drain-on-start -- is comms.md prescriptive about WHEN Pilot-B reads (session start only) vs polling-while-running?** Strongly recommend "session-start only" for Round 1; polling complicates the conversation-window model.

---

## Cross-references

- Comprehensive surface map (substrate + webhook + sandbox-creation): `docs/webhook-sandbox-research-2026-05-26.md`
- Brunel B2 substrate grounding: separate `AgentMailbox` DO class (mailbox ≠ method on IsolateRunner)
- Herald's exec-readiness review G2 framing: cross-agent A→B (NOT agent-to-control-plane)
- S35 OAuth-token decision: ripple in §5 of this doc -- wake-mechanism credential is TBD against S35's single-token choice

---

(*FR:Finn*)
