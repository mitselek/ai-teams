# v3 Crypto Integration Guide (*CD:Vigenere*)

Where E2E encryption and signing calls go in the v3 hub and MCP server.

---

## 1. Hub — `/api/send` route (server.ts:309-370)

### Current state

The hub already has signature verification at line 324-329:

```typescript
// Ed25519 signature verification — only when key is configured AND message carries sig + body_hash
const fromTeam = (msg.from as { team: string }).team;
if (options.signPubKeys?.[fromTeam] && msg.signature && msg.body_hash) {
  const sigError = verifySignature(msg, fromTeam);
  if (sigError) return reply.code(403).send({ error: sigError });
}
```

### What's correct

1. **Signature verification placement is correct.** It runs after field validation (line 313) and before dedup marking (line 332). This means:
   - Invalid signatures are rejected before the message ID is marked as seen
   - A replayed message with a tampered signature gets 403, not 409
   - Good ordering.

2. **The body stays opaque.** The hub reads `msg.body` only as a required-field check (`!msg?.body` at line 313). It never parses, decrypts, or modifies the body. The body is forwarded as-is through `writeEvent()` (line 362) and `queue.push()` (line 367). **This is correct — do not change it.**

### What needs attention

**Issue 1: Signature verification is conditional on `signPubKeys` config.**

Currently: `if (options.signPubKeys?.[fromTeam] && msg.signature && msg.body_hash)` — this means unsigned messages pass through silently when `signPubKeys` is configured but the sender isn't in it, or when the message lacks `signature`/`body_hash` fields.

**Recommendation for Babbage:** Add a strict mode option. When E2E is required:

```typescript
// In strict E2E mode, reject messages without signature + body_hash
if (options.requireE2E) {
  if (!msg.signature || !msg.body_hash) {
    return reply.code(400).send({ error: 'E2E required: missing signature or body_hash' });
  }
  if (!options.signPubKeys?.[fromTeam]) {
    return reply.code(403).send({ error: 'Unknown sender: no signing key registered' });
  }
}
```

This should be a separate config flag (`requireE2E: boolean`) so we can deploy with it off during migration and flip it on once all endpoints have keys.

**Issue 2: Sender identity binding.**

The hub verifies the Ed25519 signature against `fromTeam` extracted from the message envelope. But it should also verify that `fromTeam` matches the mTLS peer CN:

```typescript
const cn = getPeerCN(request.raw.socket as TLSSocket)!;
const fromTeam = (msg.from as { team: string }).team;
if (fromTeam !== cn) {
  return reply.code(403).send({ error: 'Sender team does not match TLS identity' });
}
```

This prevents a registered peer from sending messages with a forged `from.team` field. The Ed25519 signature would also catch this (the forger can't sign as the claimed sender), but belt-and-suspenders at the transport layer costs nothing.

**Issue 3: body_hash verification at hub (defense-in-depth).**

The hub CAN verify that `body_hash` matches `SHA-256(msg.body)` without decrypting anything — the body_hash is a hash of the encrypted body, not the plaintext. This catches accidental corruption before routing:

```typescript
import { createHash } from 'node:crypto';

// In verifySignature() or as a separate check:
const expectedHash = 'sha256:' + createHash('sha256').update(msg.body as string, 'utf-8').digest('hex');
if (msg.body_hash !== expectedHash) {
  return reply.code(400).send({ error: 'body_hash mismatch' });
}
```

---

## 2. Hub — SSE delivery (server.ts:237-306)

### What's correct

The SSE path is already E2E-clean:

- `writeEvent(stream, sseId, msg)` at line 362 sends the full message object via `JSON.stringify(msg)` — the encrypted body is base64 inside the JSON, forwarded opaquely.
- Queue drain at line 294-298 does the same: `queue.drain(cn)` returns the stored JSON, which is written to the stream as-is.
- The hub never inspects, modifies, or re-encrypts the body.

### No changes needed

The SSE delivery path is correct for E2E. The body is opaque at every stage: POST → queue/buffer → SSE event.

---

## 3. MCP Server — Send Path

The MCP server is the spoke-side client. When a Claude Code agent calls `comms_send`, the MCP server must:

### Step 1: Initialize crypto (once, at startup)

```typescript
import { readFileSync } from 'node:fs';
import { createCryptoAPIv2, loadKeyBundle } from '../../../src/crypto/index.js';

const crypto = createCryptoAPIv2({
  teamName: process.env.COMMS_TEAM_NAME!,            // e.g. "comms-dev"
  signKey: readFileSync('/run/secrets/comms-sign-key'),  // Ed25519 PEM
  encKey: readFileSync('/run/secrets/comms-enc-key'),    // X25519 PEM
  keyBundle: loadKeyBundle('/run/secrets/comms-key-bundle.json'),
});
```

### Step 2: Encrypt + Sign (per message send)

```typescript
async function sendMessage(draft: MessageDraft, receiverTeam: string): Promise<void> {
  // 1. E2E encrypt the body for the receiver
  const e2ePayload = await crypto.e2eEncrypt(
    Buffer.from(draft.body, 'utf-8'),
    receiverTeam,
    draft.id,  // messageId for AAD binding
  );

  // 2. Replace plaintext body with E2E-encrypted payload (JSON-stringified)
  const encryptedMessage = {
    ...draft,
    body: JSON.stringify(e2ePayload),  // Hub sees this as opaque string
  };

  // 3. Sign the envelope (signature covers encrypted body via body_hash)
  const signature = crypto.signEnvelope(encryptedMessage as Message);
  const bodyHash = 'sha256:' + createHash('sha256')
    .update(encryptedMessage.body, 'utf-8')
    .digest('hex');

  // 4. POST to hub
  const signedMessage = {
    ...encryptedMessage,
    signature,
    body_hash: bodyHash,
  };

  await fetch(`https://${HUB_HOST}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedMessage),
    // mTLS agent configured separately
  });
}
```

**Key point:** `body_hash` is SHA-256 of the *encrypted* body string, not the plaintext. The signature binds to `body_hash`, which binds to the ciphertext. This means the hub can verify `body_hash` without decrypting.

### Step 3: Verify + Decrypt (per message receive)

```typescript
function onSSEMessage(event: MessageEvent): void {
  const msg = JSON.parse(event.data);

  // 1. Verify Ed25519 signature
  if (!crypto.verifySignature(msg)) {
    console.error(`Signature verification failed for message ${msg.id}`);
    return;  // Drop — tampered or forged
  }

  // 2. Parse E2E payload from body
  const e2ePayload = JSON.parse(msg.body) as E2EPayload;

  // 3. Decrypt
  const plaintext = await crypto.e2eDecrypt(e2ePayload, msg.id);
  const body = plaintext.toString('utf-8');

  // 4. Deliver to agent with decrypted body
  deliverToAgent({ ...msg, body });
}
```

**Order matters:** Verify signature FIRST, then decrypt. If signature fails, don't waste cycles decrypting — and don't expose the decryption oracle to unsigned messages.

---

## 4. MCP Tool Definitions

For Lovelace's MCP server implementation:

### `comms_send` tool

Input schema should accept plaintext body. The MCP server handles encryption transparently:

```typescript
{
  name: 'comms_send',
  description: 'Send an E2E-encrypted message to another team via the hub',
  inputSchema: {
    type: 'object',
    properties: {
      to_team: { type: 'string', description: 'Recipient team name' },
      to_agent: { type: 'string', description: 'Recipient agent name' },
      body: { type: 'string', description: 'Message body (Markdown)' },
      type: { type: 'string', enum: ['query', 'response', 'broadcast', 'handoff'] },
      priority: { type: 'string', enum: ['blocking', 'high', 'normal', 'low'], default: 'normal' },
      reply_to: { type: 'string', description: 'Message ID being replied to', nullable: true },
    },
    required: ['to_team', 'to_agent', 'body', 'type'],
  },
}
```

The agent sees plaintext in, plaintext out. E2E is invisible to the tool consumer.

### `comms_inbox` tool

Returns decrypted, signature-verified messages only. Failed verification = silently dropped (logged but not delivered to the agent).

---

## 5. Summary: Where Each Crypto Call Goes

| Location | Function | Purpose |
|---|---|---|
| **Hub** `/api/send` | `verifySignature()` | Defense-in-depth: reject forged messages before routing |
| **Hub** `/api/send` | `body_hash` check | Integrity: detect corruption before routing |
| **Hub** `/api/send` | CN === `from.team` | Transport binding: prevent identity spoofing |
| **Hub** SSE delivery | *(none)* | Body is opaque — hub never decrypts |
| **MCP** send path | `e2eEncrypt()` | Encrypt plaintext body for receiver |
| **MCP** send path | `signEnvelope()` | Sign the envelope (with encrypted body) |
| **MCP** receive path | `verifySignature()` | Authenticate sender before decryption |
| **MCP** receive path | `e2eDecrypt()` | Decrypt body for the agent |

---

## 6. What NOT to Do

- **Hub must NOT call `e2eEncrypt` or `e2eDecrypt`.** It has no E2E keys. It's hub-blind by design.
- **Hub must NOT parse `msg.body` as JSON.** The body is an opaque string (happens to be JSON-encoded E2EPayload, but the hub doesn't know or care).
- **MCP must NOT skip `verifySignature` before `e2eDecrypt`.** Verify first, decrypt second. Always.
- **Nobody should compute `body_hash` from plaintext.** The hash is always over the encrypted body string.
