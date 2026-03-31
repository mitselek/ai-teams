# comms-dev Architecture — v2.1 Hub/Relay Mode

(*CD:Babbage*)

**Version history:**
- v1: PSK + Unix Domain Socket peer-to-peer
- v2: mTLS + TCP peer-to-peer mesh
- **v2.1 (current):** hub relay topology, mTLS/TCP, v1 PSK crypto, inbound forwarding, defaultPeer routing, SendMessageBridge
- v3 (planned): E2E encryption (X25519) + Ed25519 message signing wired into daemon send/receive

## Overview

The hub daemon is a central relay that accepts mTLS connections from all team daemons and forwards messages to their destinations. Teams connect **inbound-only** to the hub — the hub never dials out. This supports firewalled containers and SSH-tunnelled hosts.

```
PROD-LLM host
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  relay (hub)        comms-dev          bt-triage               │
│  :8443  ◄─────────── :8444 ─────────── :8445                   │
│    ▲                                                           │
│    │  mTLS/TCP (inbound-only)                                  │
└────┼───────────────────────────────────────────────────────────┘
     │
     │ SSH tunnel (port-forward)
     ├──── framework-research (:8446, Windows)
     └──── entu-research (RC server)
```

---

## 1. Current Fleet

| Team | Port | Host | Notes |
|------|------|------|-------|
| relay | 8443 | PROD-LLM | hub daemon, `role: 'hub'` |
| comms-dev | 8444 | PROD-LLM | |
| bt-triage | 8445 | PROD-LLM | |
| framework-research | 8446 | Windows | inbound via SSH tunnel |
| entu-research | — | RC server | inbound via SSH tunnel |

---

## 2. Connection Model

All teams connect TO the hub (inbound-only). Hub dials nobody.

**Team config:**
```typescript
{
  teamName: 'comms-dev',
  peers: { relay: { host: 'prod-llm', port: 8443 } },
  hubPeers: ['relay'],   // skip from.team check for hub-forwarded messages
  defaultPeer: 'relay',  // route any unknown destination via relay
  role: 'team',
}
```

**Hub config:**
```typescript
{
  teamName: 'relay',
  peers: {},             // hub dials nobody — all peers connect inbound
  role: 'hub',
}
```

**defaultPeer routing:** `tunnelManager.send('framework-research', msg)` — if `framework-research` is not a direct peer, falls back to `peers.get(defaultPeer)` (the relay tunnel). The message content carries `to.team = 'framework-research'`; hub routes it onward.

---

## 3. Inbound Socket Forwarding (TC-H05)

When a team connects inbound to the hub, TlsServer authenticates the peer cert and calls `onPeerSocket(team, socket)` handlers. In hub mode, DaemonV2 wires this to `tunnelManager.registerInboundSocket(team, socket)`.

TunnelManager's `send()` priority:
1. Outbound tunnel connected → `sendAndWaitAck()` (ACK-tracked)
2. Outbound down but inbound socket available → `sendViaInbound()` (direct write, fire-and-forget, returns OK)
3. Neither → `PEER_UNKNOWN`

For messages arriving from hub on the team's outbound socket (hub writing back down the same connection the team dialed): `TunnelManager.makeDecoder` dispatches non-ACK frames to `inboundMessageHandlers`. DaemonV2 wires these to `handleInbound()`. MessageStore dedup prevents double-delivery if both TlsServer and TunnelManager paths fire for the same message.

**ACK semantics:** TlsServer sends ACK to sender when hub receives a message — not when destination delivers it. ACK frames are never themselves ACK'd (avoids storms). Hub delivery to destination is best-effort fire-and-forget; sender gets ACK = "relay received".

---

## 4. Hub Forwarding Logic

```
receive message M from peer P (mTLS authenticated)
  dedup via messageStore (prevent forward loops)
  if M.to.team === 'relay'  →  deliver to local hub inbox
  else                       →  forwardMessage(M)

forwardMessage(M):
  tunnelManager.send(M.to.team, M)
    → outbound tunnel: sendAndWaitAck
    → inbound socket:  sendViaInbound (fire-and-forget)
    → neither:         log PEER_UNKNOWN
```

---

## 5. from.team Invariant

| Layer | Peer-to-peer | Hub mode |
|---|---|---|
| Transport auth | `from.team === peerCertCN` | `peerCertCN === 'relay'` (in hubPeers) |
| Message auth | implicit from transport | Ed25519 signature (v2 crypto) |

Hub's own TlsServer keeps the `from.team === peerCertCN` check for incoming team→hub connections. Team daemons receiving from hub skip the check when `peerCertCN ∈ hubPeers`, relying on Ed25519 verification at the application layer.

---

## 6. Crypto (v2.1: PSK; v3: E2E implemented, not deployed)

**v2.1 (current):** mTLS with PSK certs only. No application-layer encryption or signing in production.

**v3 (implemented, not yet deployed):** `createCryptoAPIv2` in `src/crypto/crypto-v2.ts`. Code exists and is wired into DaemonV2 behind config flags — not yet deployed to any team daemon.

When deployed, send path (`DaemonV2.sendMessage()`): if `keyBundlePath` + `signKeyPath` + `encKeyPath` configured, calls `prepareOutbound()`:
1. `e2eEncrypt(body, receiverTeam, msgId)` → E2EPayload (X25519 + AES-256-GCM)
2. `msg.body = JSON.stringify(e2ePayload)`
3. `signEnvelope(msg)` → Ed25519 signature
4. Attaches `signature` and `body_hash` to message

Receive path (`DaemonV2.handleInbound()`): if `msg.signature` present and cryptoV2 loaded:
1. `verifySignature(msg)` → drop on failure
2. `e2eDecrypt(JSON.parse(msg.body), msg.id)` → restore plaintext body

Hub has no v3 keys — forwards E2E-opaque bodies verbatim. Hub cannot read message content.

**DaemonV2Options fields (v3 opt-in):**
```typescript
keyBundlePath?: string;   // comms-key-bundle.json
signKeyPath?: string;     // Ed25519 private key (PEM)
encKeyPath?: string;      // X25519 private key (PEM)
```

---

## 7. SendMessageBridge

`src/broker/sendmessage-bridge.ts` — bridges broker file inbox to the Claude Code agent framework.

Broker writes delivered messages as `<msg-id>.json` to `~/.claude/teams/<team>/inboxes/`. Bridge polls that directory every 500ms, converts each message to a framework InboxEntry, appends to `~/.claude/teams/<team>/inboxes/<agent>.json`, and deletes the broker file.

**Warning:** SendMessageBridge and `comms-watch --consume` both consume the same directory. Run one or the other — not both.

---

## 8. Hub ACL

Hub mode skips ACL entirely (`role: 'hub'` → no `acl.json` loaded). Hub validates routing only via TunnelManager's PEER_UNKNOWN for unknown destinations. Per-agent permissions are enforced at the destination team daemon.

---

## 9. Hub Availability Model

Hub is the only path. No fallback, no peer-to-peer direct connections.

If hub is down, teams are isolated. Hub is restarted; teams reconnect automatically via TunnelManager's exponential backoff (base 1s, cap 30s). (PO decision 2026-03-30.)

---

## 10. Message Integrity Through Forwarding

Hub forwards verbatim — `id`, `from`, `to`, `timestamp`, `body`, `checksum` unchanged. In v2, body is E2E-encrypted before transit; hub never modifies it. Destination verifies checksum and decrypts independently.

---

## 11. Human Endpoints (Designed, Not Yet Implemented)

Humans are identical to team daemons at the protocol layer. Same mTLS transport, same JSON envelope, same E2E crypto. Distinguished only by registry metadata.

**Provisioning** (same as a team):
- ECDSA P-256 TLS cert (`CN=alice`), fingerprint pinned in hub's `peers/`
- Ed25519 signing key + X25519 encryption key in key bundle
- `keysDir/` structure identical to team daemon

**Client tools:**
- `comms-listen --keys ~/.comms/alice/ --port <n>` — persistent daemon, hub connects to it; delivers to `~/.comms/inbox/`
- `comms-send --to agent@team --body "..." --keys ~/.comms/alice/` — ephemeral sender

**Message identity:** `from.team = 'humans'`, `from.agent = <username>`

**Offline buffering:** TunnelManager queues up to 100 messages for peers with `everConnected=true`. Delivered on reconnect.

**Registration:** Out-of-band for v1 — ops provisions cert and adds to hub config.

---

## 12. Registry Ownership (Pending Implementation)

Current: teams write/read `registry.json` on shared volume directly.
Planned: hub is source of truth. Hub exposes `peerInfoMap` via new UDS `registry` command. Teams query hub instead of reading shared file.

Pending: add `type: 'team' | 'human'` to DaemonV2 peer config; implement `registry` UDS command on hub; deprecate direct `registry.json` writes from team daemons.

---

## 13. TunnelManager

Outbound tunnel per peer. Key options:
- `reconnectBaseMs` (default 1000), `reconnectMaxMs` (default 30_000)
- `heartbeatIntervalMs` (default 30_000), `deadConnectionMs` (default 90_000)
- `maxQueueSize` (default 100) — per-peer outbound queue for temporarily-offline peers
- `defaultPeer` — fallback peer name for unknown destinations
- `ackTimeoutMs` (default 10_000)

Queue semantics: `send()` returns `'QUEUED'` immediately for peers with `everConnected=true` that are temporarily down. Never-connected peers return `'PEER_UNAVAILABLE'` (config error, fail fast).

---

## 14. MessageStore

In-memory dedup with TTL (default 5 min). Persists to disk every 60s and on clean shutdown (`storePath` constructor option). Loads on start; discards entries older than TTL. ≤60s replay window on restart (acceptable v1).

---

## 15. Planned: v3 E2E Crypto Deployment

Code is implemented (`createCryptoAPIv2`, `DaemonV2` send/receive hooks). Deployment requires:

1. Generate Ed25519 signing key + X25519 encryption key per team
2. Distribute public key bundles (`comms-key-bundle.json`) to all peers
3. Configure `keyBundlePath`, `signKeyPath`, `encKeyPath` in each team's daemon start args
4. Hub requires no changes — forwards E2E-opaque bodies verbatim

Teams can opt in one-by-one: v3 sender + v1 receiver drops the message (signature verify fails). Full deployment requires all teams to opt in simultaneously.

(*CD:Babbage*)
