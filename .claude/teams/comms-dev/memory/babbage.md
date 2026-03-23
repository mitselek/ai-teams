# Babbage Scratchpad
# Last updated: 2026-03-23

(*CD:Babbage*)

---

## [CHECKPOINT] Codebase orientation — 2026-03-23

### Module inventory (my domain)

| File | State | Notes |
|------|-------|-------|
| `src/types.ts` | Complete | Message, Registry, BrokerConfig, CryptoProvider interfaces |
| `src/transport/framing.ts` | Complete | 4-byte length prefix, FrameDecoder handles stream fragmentation |
| `src/transport/server.ts` | Complete | UDS server (v1/PSK mode); race-condition fix: socket.pause during drain |
| `src/transport/client.ts` | Complete | UDS client (v1/PSK), exponential backoff, ACK-based |
| `src/transport/tls-server.ts` | Complete | mTLS server (v2), cert fingerprint pinning, forgery detection |
| `src/transport/tls-client.ts` | Complete | mTLS client (v2), per-peer fingerprint check |
| `src/transport/tunnel-manager.ts` | Complete | Persistent mTLS tunnels, per-peer state, heartbeat, dead-conn detection |
| `src/broker/daemon.ts` | Complete | v1 broker (PSK/UDS), wires server+discovery+store+inbox+bridge |
| `src/broker/daemon-v2.ts` | Complete | v2 broker (mTLS), wires TlsServer+TunnelManager+ACL+store+inbox |
| `src/broker/message-store.ts` | Complete | In-memory dedup, 5-min TTL, periodic cleanup |
| `src/broker/message-builder.ts` | Complete | buildMessage(), computeChecksum() — HMAC or plain SHA-256 |
| `src/broker/inbox.ts` | Complete | File-based inbox, atomic write (tmp→rename) |
| `src/broker/sendmessage-bridge.ts` | Complete | Polls broker inbox, bridges to agent framework inbox format |
| `src/discovery/registry.ts` | Complete | registry.json, advisory file lock (O_EXCL), stale cleanup |
| `src/cli/comms-send.ts` | Complete | One-shot send via UDS client (v1 mode) |
| `src/cli/comms-publish.ts` | Complete | GitHub Issues via `gh` CLI |
| `src/cli/comms-watch.ts` | Complete | Inbox watcher / tail-f for inbox |
| `src/cli/comms-daemon.ts` | Complete | Daemon control CLI — **written by Lovelace** |
| `src/cli/comms-keys.ts` | Complete | Cert inspection CLI — **written by Lovelace** |
| `src/cli/comms-acl.ts` | ? | Not read yet — probably Lovelace |
| `src/mcp/cross-team-send.ts` | Complete | MCP tool for crossTeamSend via daemon UDS command socket |
| `src/integration/inbox-watcher.ts` | Complete | InboxWatcher — polls file inbox, dispatch + consume |
| `src/util/stable-stringify.ts` | Not read | Utility for canonical JSON serialization |

---

## [DECISION] Two daemon generations exist

- **v1** (`daemon.ts`): PSK-based symmetric encryption, UDS-only transport (no TCP), discovery via registry.json
- **v2** (`daemon-v2.ts`): mTLS with cert pinning, TCP transport (TlsServer/TunnelManager), ACL enforcement, UDS command socket for local agents

v2 is the production path per spec refs (#16, #18). v1 may be retained for dev/local-only mode.

---

## [GOTCHA] comms-send bypasses daemon-v2

`comms-send` CLI connects directly to the remote team's UDS socket using the v1 UDS client. This:
1. Bypasses ACL checking (daemon-v2 enforces ACL on both send and receive)
2. Bypasses daemon-v2's persistent tunnel (creates a fresh connection per send)
3. Requires PSK setup instead of mTLS certs

For production v2 usage, agents should use `crossTeamSend` (MCP tool) or a v2-compatible CLI that sends via daemon-v2's local UDS command socket.

---

## [GOTCHA] Mutual exclusion: SendMessageBridge vs comms-watch --consume

Both poll and delete from the same inbox directory. Running both simultaneously silently drops messages. Documented in both files. Rule: run broker (with bridge) OR comms-watch --consume — never both.

---

## [GOTCHA] daemon-v2 sendMessageRaw PEER_UNAVAILABLE mapping

`sendMessageRaw` maps `PEER_UNAVAILABLE` from TunnelManager to `FORGERY_REJECTED`. Rationale: if peer closes connection due to forgery, socket drops → tunnel returns PEER_UNAVAILABLE. This mapping is fragile — a genuinely unavailable peer looks identical to a forgery rejection from the caller's perspective.

---

## [PATTERN] Atomic writes everywhere

Both `InboxDelivery` and `RegistryManager` use tmp-file + rename for atomic writes. `daemon-v2` inbound handler also uses this pattern. Consistent — good.

---

## [PATTERN] TunnelManager: no queue on send path

`TunnelManager.send()` returns PEER_UNAVAILABLE immediately if peer is down (no in-flight queueing for new messages). The queue is only drained on reconnect for messages queued before disconnect. This is intentional — at-least-once is the caller's (broker's) responsibility.

---

## [TODO] server.ts TODO(T7): connection limit

Per-server connection limit not implemented. Noted as defense against socket flooding. Low priority unless we're concerned about DoS from rogue containers.

---

## [DEFERRED] comms-acl.ts — not reviewed

Written by Lovelace (ACL management CLI). Not in my domain but integrates with daemon-v2's `aclManager`. Review if ACL integration issues arise.

---

## Integration points I consume

- `src/crypto/index.ts` — `loadPsk`, `deriveKey`, `createCryptoAPI`, `createCryptoProvider`, `computeChecksum`, `verifyIntegrity`
- `src/crypto/types.ts` — `DerivedKeys`
- `src/crypto/tls-config.ts` — `loadDaemonCrypto`, `validateSenderIdentity`, `DaemonCryptoConfig`
- `src/crypto/acl.ts` — `createAclManager`, `loadAcl`, `AclManager`
