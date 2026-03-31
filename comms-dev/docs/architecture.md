# comms-dev Architecture — v2 Hub/Relay Mode

(*CD:Babbage*)

## Overview

v2 introduces a **hub daemon** — a central relay that accepts mTLS connections from all team daemons and forwards messages to their destinations. This replaces the peer-to-peer topology required when the fleet spans multiple Docker hosts (where direct team-to-team TCP is not routable).

```
Host A                          Host B
┌──────────────────┐            ┌──────────────────────────────┐
│  comms-dev       │  mTLS/TCP  │  relay (hub daemon)          │  mTLS/TCP  │  framework-research  │
│  TunnelManager ──┼────────────┼──► TlsServer                 │            │                      │
│  peers:          │            │    handleInbound()           │────────────┼──► TlsServer          │
│    relay: host:B │            │    → forward to fr tunnel    │            │                      │
└──────────────────┘            │  TunnelManager               │            └──────────────────────┘
                                │    peers: {cd, fr, ...}      │
                                └──────────────────────────────┘
```

---

## 1. DaemonV2 Hub Mode

### Config change

Add `role` field to `DaemonV2Options`:

```typescript
export interface DaemonV2Options {
  // ... existing fields ...
  role?: 'team' | 'hub';  // default: 'team'
}
```

Team config (simplified):
```typescript
{
  teamName: 'comms-dev',
  peers: { relay: { host: 'host-b', port: 9000 } },
  role: 'team',
}
```

Hub config:
```typescript
{
  teamName: 'relay',
  peers: {
    'comms-dev':           { host: 'host-a', port: 9001 },
    'framework-research':  { host: 'host-b', port: 9002 },
    // ...all other teams
  },
  role: 'hub',
}
```

---

## 2. Forwarding Logic in handleInbound()

In hub mode, `handleInbound()` routes by `msg.to.team`:

```
receive message M from peer P (mTLS authenticated)
  if M.to.team === 'relay'  →  deliver to local inbox (hub-local agent)
  else                       →  forwardMessage(M)

forwardMessage(M):
  dedup via messageStore (prevent forward loops)
  tunnelManager.send(M.to.team, M)
  if PEER_UNKNOWN:   log error — destination not in hub's peer config
  if PEER_UNAVAILABLE: log + discard (v1); persist to retry queue (v2)
  if OK: done
```

### ACK semantics (important limitation)

`TlsServer.handleFrame()` sends ACK **before** dispatching to `messageHandlers`. This means:
- Sender gets ACK when **hub receives** the message — not when destination delivers it
- If destination is offline after hub ACK: **message is lost in v1**

ACK = "relay received". End-to-end delivery guarantee requires:
- v2: hub holds ACK until destination ACKs → async ACK chain
- v1: acceptable because hub is on reliable infrastructure; destination outages trigger sender retry independently

---

## 3. The from.team Invariant — Resolved by Vigenere's v2 Design

`tls-server.ts:handleFrame()` currently enforces `msg.from.team === mTLS peer cert CN`.
In hub mode the TLS peer is always `"comms-hub"`, so this check can never pass for forwarded messages.

**Vigenere's solution (crypto-spec.md §Hub-Mode):** Replace the check with two-layer auth:

| Layer | v1 (peer-to-peer) | v2 (hub mode) |
|---|---|---|
| Transport auth | `from.team === peerCertCN` | `peerCertCN === "comms-hub"` |
| Message auth | (implicit from transport) | Ed25519 signature verified against key bundle |

### TlsServer change (team-side, receiving from hub)

```typescript
// In handleFrame(), when peerCertCN is a known hub peer:
if (this.hubPeers.has(authenticatedTeam)) {
  // peerCertCN is "comms-hub" — skip from.team check,
  // rely on Ed25519 signature in handleInbound()
} else {
  const check = validateSenderIdentity(message, authenticatedTeam);
  if (!check.valid) { /* FORGERY */ }
}
```

### Hub-side TlsServer

Hub's TlsServer KEEPS the existing `from.team === peerCertCN` check for incoming team→hub connections. This prevents a team from claiming to be another team at the hub level.

### Signature verification in DaemonV2

On message receipt from hub, before delivering to inbox:
```typescript
if (message is SignedMessage && cryptoV2) {
  const valid = cryptoV2.verifySignature(signedMessage);
  if (!valid) { drop + log; return; }
}
```

The hub MAY also verify signatures before forwarding (defense-in-depth, see crypto-spec.md).

### New DaemonV2Options fields (v2)

```typescript
export interface DaemonV2Options {
  // ... existing ...
  role?: 'team' | 'hub';
  hubPeers?: string[];       // cert CNs of trusted hub peers (skip from.team check)
  keyBundlePath?: string;    // path to comms-key-bundle.json
  signKeyPath?: string;      // path to Ed25519 signing private key
  encKeyPath?: string;       // path to X25519 encryption private key
}
```

**Dependency:** Requires `createCryptoAPIv2` from `src/crypto/index.ts` — not yet implemented.
Filed [COORDINATION] with Vigenere for API timeline.

---

## 4. Connection Model — No TunnelManager Changes

TunnelManager already supports N peers with independent reconnect/retry per peer. No structural changes needed.

- Teams: 1 peer entry (`relay`)
- Hub: N peer entries (one per team)
- Reconnect, heartbeat, dead-connection detection work identically

---

## 5. Hub ACL

In hub mode, ACL is **routing-only** — the hub doesn't enforce per-agent permissions (it can't, since it doesn't know which agent will receive the message locally at the destination).

Options:
- Hub has no `acl.json` — make it optional in hub mode
- Hub has a minimal ACL: `{ default: 'allow' }` for all authenticated peers
- Hub validates that `msg.to.team` is a known peer (already done by TunnelManager returning PEER_UNKNOWN)

Recommended: skip ACL load in hub mode (`role: 'hub'` + no `acl.json`), add `makeAclOptional: true` flag or just guard the ACL load with `if (role !== 'hub')`.

---

## 6. Hub Availability Model

**Hub is the only path. No fallback. No graceful degradation.**

Teams have one peer (`relay`). If the hub is down, teams are isolated — this is an ops concern, not an application concern. The hub is restarted; teams reconnect automatically via existing exponential backoff in TunnelManager.

No dual-path routing, no direct peer-to-peer fallback. One path, one source of truth. (PO decision 2026-03-30.)

---

## 7. Message Integrity Through Forwarding

The hub forwards the message **verbatim** — no field modification. Specifically:
- `id`, `from`, `to`, `timestamp`, `body` (encrypted), `checksum` — all unchanged
- Hub does NOT recompute checksum (it can't, because that would require the PSK — and even if it has it, recomputing would change nothing since no fields changed)
- Destination verifies checksum as normal

This works in v1 because all teams share the same PSK. If v2 introduces per-team PSKs, the hub cannot forward without re-encrypting, making Option B (envelope wrapping) mandatory.

---

## 8. Open Questions — Resolved

Vigenere's v2 crypto spec (crypto-spec.md §Hub-Mode, 2026-03-30) resolved all trust model questions:
- Hub is untrusted — E2E encryption with X25519 pairwise keys between teams
- `from.team === peerCertCN` replaced by Ed25519 signature verification
- AAD = `"v2:" + id + ":" + sender_team + ":" + receiver_team` (both teams bound)
- Option A (trusted relay exception) is NOT the path — Ed25519 signatures are the path

---

## Implementation Plan

**Blocked on:** `createCryptoAPIv2` in `src/crypto/` (Vigenere's domain).

**Can start now (no crypto dependency):**
1. `DaemonV2Options`: add `role`, `hubPeers`, key path fields
2. `DaemonV2.handleInbound()`: hub forwarding branch (verbatim forward)
3. `TlsServerOptions`: add `hubPeers?: string[]`
4. `TlsServer.handleFrame()`: skip `from.team` check when `peerCertCN ∈ hubPeers`
5. ACL optional in hub mode
6. TunnelManager: wire outbound queue for offline peers (HUB-7)
7. TunnelManager: `reconnectMaxMs` configurable (HUB-7)
8. MessageStore: persist dedup to file on cleanup cycle (HUB-4)

**Blocked on `createCryptoAPIv2`:**
9. Send path: `e2eEncrypt` + `signEnvelope` integration
10. Receive path: `verifySignature` + `e2eDecrypt` integration
11. Key bundle loading in `DaemonV2`

**Tests (Kerckhoffs):** Three-daemon test (cd → relay → fr), hub failure detection, queue drain on reconnect.

(*CD:Babbage*)
