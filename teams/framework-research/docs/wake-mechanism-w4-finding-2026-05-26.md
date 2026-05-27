# Step-5 Wake Mechanism — W4 finding (resolves Task #11)

**For Hopper. Date 2026-05-26. Author Finn. Source: `claude-api` skill / `shared/managed-agents-self-hosted-sandboxes.md`.**

Supersedes the W1/W2/W3 framing in `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` §Step 5.

---

## TL;DR

There is no "tell Anthropic to fire an inbound webhook for agent X" primitive. **Anthropic-to-us connectivity is outbound-only — our worker long-polls; Anthropic never dials in.** The wake mechanism for Pilot-B is `client.beta.sessions.create(agent=pilot_b.id, environment_id=...)` posted by Pilot-A's mailbox handler immediately after the mailbox write. The new session enters Anthropic's queue; our continuously-polling worker (`EnvironmentWorker.run()`) picks it up; `IsolateRunner_B.start()` fires; Pilot-B drains the mailbox on session start.

**SDK call confirmed:** `client.beta.sessions.create(agent=<recipient_agent_id>, environment_id=<env_id>, title=..., metadata=...)`. Anthropic-managed-agents-2026-04-01 beta header is set automatically by the SDK on `client.beta.*` calls.

---

## Why W1/W2/W3 were wrong

The G2-brief framing assumed a push primitive existed on Anthropic's side ("call something that triggers a webhook to us"). The canonical doc says:

> "Connectivity is **outbound-only**: your worker long-polls Anthropic's work queue; Anthropic never dials into your network."
> — `shared/managed-agents-self-hosted-sandboxes.md`

Anthropic decides when to issue work to our worker based on session lifecycle state. The way we cause Anthropic to issue work to us is **by creating a session**, not by asking Anthropic to push something.

Both worker shapes are valid (and we can pick per Round 1 needs):

| Worker shape | When it polls | Trigger for Pilot-B wake |
|---|---|---|
| **Always-on** (`EnvironmentWorker.run()` in a long-lived process) | Continuously long-polls the queue | None needed — new session lands in queue, worker picks it up on next poll cycle |
| **Webhook-driven** (`session.status_run_started` webhook fires our endpoint → `EnvironmentWorker.run_one()`) | Per webhook | Mailbox handler creates the session; Anthropic fires `session.status_run_started` webhook → our handler calls `run_one()` once |

Either way, **the wake-trigger from our code is `sessions.create()`**, not a separate "wake" primitive.

---

## The corrected six-step path (overrides G2 brief Step 5)

1. Pilot-A's LLM emits `send_message` custom tool call. (unchanged)
2. ToolDispatcher inside `IsolateRunner_A` DO handles it. (unchanged)
3. Forwarding: direct DO RPC to `AgentMailbox_B`. (unchanged — Path (a))
4. `AgentMailbox_B.append(msg)` writes to SQLite. (unchanged)
5. **NEW: `AgentMailbox_B.wakeRecipient()` calls `client.beta.sessions.create(agent=pilot_b_agent_id, environment_id=env_id, ...)`.** That's the SDK call. Anthropic's response is the new `session_id`. Anthropic schedules work for that session in its queue.
6. **NEW: Our long-polling worker picks up the new session work item.** Worker dispatches to `IsolateRunner_B`. `IsolateRunner_B.start()` drains the mailbox via `drainUnread()`. Pilot-B's first agent turn sees the mailbox contents as `initialContext`.

---

## Skeleton code for `wakeRecipient()`

```ts
async wakeRecipient() {
  const client = new Anthropic({
    apiKey: null,
    authToken: this.env.ANTHROPIC_API_KEY,   // see credential note below
    baseURL: resolveAnthropicBaseURL(this.env),
  });
  const session = await client.beta.sessions.create({
    agent: this.recipientAgentId,            // string shorthand — uses latest agent version
    environment_id: this.env.ENVIRONMENT_ID,
    title: `Inbound from ${this.lastSenderAgentName}`,
    metadata: { triggered_by: "mailbox_append", message_count: this.unreadCount() },
  });
  // Optionally: log/persist session_id for traceability. No further action — worker picks up from here.
  return { session_id: session.id, ok: true };
}
```

**Important behavioral note (from skill `shared/managed-agents-core.md`):** sessions can be sent events while `running` or `idle`. If Pilot-B already has a live `idle` session, you could alternatively `events.send()` a `user.message` to that existing session instead of creating a new one. Choice between resume-existing-session vs. create-new-session is a Round-1 design call; my recommendation: **create-new-session for simplicity in Round 1** (no resume-discovery logic; each inter-agent message is its own session-scoped invocation). Resume optimization is Round 2+.

---

## Credential scope implications (feeds Task #10)

The credential used for `sessions.create()` needs **`sessions.create` scope** in whatever auth model we settle on for the OAuth subscription token (S35 DECISION).

- The reference CMA repo's `ANTHROPIC_API_KEY` (regular API key) covers `sessions.create` and `sessions.retrieve` — both go through `client.beta.*` against `api.anthropic.com`.
- The reference CMA repo's `ANTHROPIC_ENVIRONMENT_KEY` (env key, `sk-ant-oat01-…`) is for `environments.work.poll` / `ack` / `heartbeat` — these are worker-side calls.
- **If our OAuth subscription token replaces ANTHROPIC_API_KEY**, verify it has `sessions.create` scope. The mailbox handler calls this — if the scope is missing, inter-agent wake silently fails (the create call 403s, and Pilot-B never wakes).
- **If the OAuth token also needs to replace ANTHROPIC_ENVIRONMENT_KEY for worker polling**, that's a separate scope check (`environments.work.poll`).

So the credential-shape decision in Task #10 must consider both call surfaces. I'm folding this into the Surface-1 platform checklist (Task #10 owner: PO; my checklist surfaces what needs verifying).

---

## What this changes for Task #11

**Recommend marking Task #11 completed** on absorb. The three candidate SDK surfaces (W1/W2/W3) were mismodeled as a single primitive. The actual answer is the W4 framing above:

- **No inverted-trigger primitive exists** (NOT W1: `beta.sessions.create({agent_id})` doesn't exist as a "trigger webhook" — it just creates a session, and Anthropic's session-lifecycle naturally drives the queue. NOT W2: there is no "work.enqueue" — work appears via session creation. NOT W3: polling DOES work but it's worker-shaped, not orchestrator-shaped.)
- **The actual primitive is `sessions.create`** combined with our worker shape (always-on or webhook-driven). Both are documented; both work; both unblock Round 1.

**Task #11 is no longer a research task — it's a design choice between two implementation shapes (always-on worker vs. webhook-driven worker).** Both are tractable; pick based on operator preference for infra footprint vs. webhook complexity. Recommend always-on worker for Round 1 simplicity (one long-running process; no webhook endpoint to register beyond what we already have for inbound events).

---

## Cross-references

- Original (now-superseded) Step 5 framing: `docs/herald-g2-cross-agent-comms-brief-2026-05-26.md` §Step 5
- Comprehensive substrate map: `docs/webhook-sandbox-research-2026-05-26.md`
- Canonical source: `claude-api` skill / `shared/managed-agents-self-hosted-sandboxes.md` (Anthropic platform docs surface)
- Adjacent task: #10 (Round 1 op-step-2 credential-shape prep — fold sessions.create scope check)

(*FR:Finn*)
