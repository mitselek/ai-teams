# Babbage Scratchpad
# Last updated: 2026-06-17

(*CD:Babbage*)

---

## [CHECKPOINT] Codebase orientation -- 2026-03-23

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
| `src/broker/message-builder.ts` | Complete | buildMessage(), computeChecksum() -- HMAC or plain SHA-256 |
| `src/broker/inbox.ts` | Complete | File-based inbox, atomic write (tmp→rename) |
| `src/broker/sendmessage-bridge.ts` | Complete | Polls broker inbox, bridges to agent framework inbox format |
| `src/discovery/registry.ts` | Complete | registry.json, advisory file lock (O_EXCL), stale cleanup |
| `src/cli/comms-send.ts` | Complete | One-shot send via UDS client (v1 mode) |
| `src/cli/comms-publish.ts` | Complete | GitHub Issues via `gh` CLI |
| `src/cli/comms-watch.ts` | Complete | Inbox watcher / tail-f for inbox |
| `src/cli/comms-daemon.ts` | Complete | Daemon control CLI -- **written by Lovelace** |
| `src/cli/comms-keys.ts` | Complete | Cert inspection CLI -- **written by Lovelace** |
| `src/cli/comms-acl.ts` | ? | Not read yet -- probably Lovelace |
| `src/mcp/cross-team-send.ts` | Complete | MCP tool for crossTeamSend via daemon UDS command socket |
| `src/integration/inbox-watcher.ts` | Complete | InboxWatcher -- polls file inbox, dispatch + consume |
| `src/util/stable-stringify.ts` | Not read | Utility for canonical JSON serialization |

---

## [DECISION] Two daemon generations exist

- **v1** (`daemon.ts`): PSK-based symmetric encryption, UDS-only transport (no TCP), discovery via registry.json
- **v2** (`daemon-v2.ts`): mTLS with cert pinning, TCP transport (TlsServer/TunnelManager), ACL enforcement, UDS command socket for local agents

v2 is the production path per spec refs (#16, #18). v1 may be retained for dev/local-only mode.

---

## [CHECKPOINT] Mission context -- 2026-06-17

FR's stationmaster + courier is the LIVE inter-team comms fabric (SSH-based, hub-and-spoke). We audited it (session S53). Our daemon-v2 was NOT deployed first -- stationmaster shipped while we were building. The audit revealed our daemon-v2 is weaker on 5 durability dimensions, all filed as #79.

---

## [LEARNED] daemon-v2 has 5 durability gaps vs FR's courier (filed as #79)

Ordered by impact:

1. **No outbound spool** -- message lost if daemon crashes after dequeue-before-forward. FR fix: atomic rename outbox→spool; replay spool on restart; delete spool entry only on peer ACK.
2. **ACK timing too early** -- we ACK on wire receive, not after inbox write (local custody). FR fix: ACK only after `inject_batch` / `InboxDelivery.write()` succeeds. Ties to issue #19.
3. **In-memory dedup lost on restart** -- `MessageStore` is 5-min TTL in-memory; empty on restart. FR fix: durable append-only JSONL ledger keyed by message id; compact at startup (7-day/10k retention).
4. **Outage drops PEER_UNAVAILABLE** -- no queue for new messages when peer is down. FR fix: spool handles this (retained until hub reachable, no TTL). Ties to issue #24.
5. **No instance lock** -- no guard against double-start. FR fix: O_EXCL lock file + OS-native PID liveness check. NOTE: FR's own residual: PID liveness check does not verify cmdline match (PID recycling gap) -- our fix must add cmdline check.

FR patterns to adopt when implementing fixes:
- Outbound: `rename(outbox → spool/<utc-ts>-<seq>.json)` then deposit; delete spool on accepted/duplicate
- Inbound: inject-first, ledger-append-second, ack-last (crash table in courier hints §6)
- Dedup key: hub envelope id (SHA-256 over canonical entry) -- do NOT recompute locally

---

## [DEFERRED] Reusable contributions comms-dev could offer FR (pending team-lead decision)

1. **mTLS + cert fingerprint pinning** (`tls-server.ts`, `tls-client.ts`, `tunnel-manager.ts`): FR uses per-poll SSH connections; our mTLS layer is container-to-container native and would suit FR's planned REST/MCP transport binding.
2. **Persistent tunnel with heartbeat** (`tunnel-manager.ts`): lower latency than FR's per-poll SSH open/close.
3. **Deposit-time ACL enforcement** (`acl.ts`, `daemon-v2.ts`): FR's grant/revoke is hub-side only; our local ACL adds defense-in-depth.

Canonical tracker #84 carries a standing offer to help, conditional on FR redeploying our container.

---

## [GOTCHA] comms-send bypasses daemon-v2

`comms-send` CLI connects directly to the remote team's UDS socket using the v1 UDS client. This:
1. Bypasses ACL checking (daemon-v2 enforces ACL on both send and receive)
2. Bypasses daemon-v2's persistent tunnel (creates a fresh connection per send)
3. Requires PSK setup instead of mTLS certs

For production v2 usage, agents should use `crossTeamSend` (MCP tool) or a v2-compatible CLI that sends via daemon-v2's local UDS command socket.

---

## [GOTCHA] Mutual exclusion: SendMessageBridge vs comms-watch --consume

Both poll and delete from the same inbox directory. Running both simultaneously silently drops messages. Rule: run broker (with bridge) OR comms-watch --consume -- never both.

---

## [GOTCHA] daemon-v2 sendMessageRaw PEER_UNAVAILABLE mapping

`sendMessageRaw` maps `PEER_UNAVAILABLE` from TunnelManager to `FORGERY_REJECTED`. Fragile -- a genuinely unavailable peer looks identical to a forgery rejection. Fix required as part of #79 gap 4.

---

## [PATTERN] Atomic writes everywhere

Both `InboxDelivery` and `RegistryManager` use tmp-file + rename for atomic writes. `daemon-v2` inbound handler also uses this pattern. Consistent -- good.

---

## [PATTERN] TunnelManager: no queue on send path

`TunnelManager.send()` returns PEER_UNAVAILABLE immediately if peer is down. The queue is only drained on reconnect for messages queued before disconnect. Fix: spool layer above the tunnel (gap 1 in #79).

---

## [TODO] server.ts TODO(T7): connection limit

Per-server connection limit not implemented. Defense against socket flooding. Low priority unless DoS concern raised.

---

## [DEFERRED] comms-acl.ts -- not reviewed

Written by Lovelace (ACL management CLI). Not in my domain but integrates with daemon-v2's `aclManager`. Review if ACL integration issues arise.

---

## Integration points I consume

- `src/crypto/index.ts` -- `loadPsk`, `deriveKey`, `createCryptoAPI`, `createCryptoProvider`, `computeChecksum`, `verifyIntegrity`
- `src/crypto/types.ts` -- `DerivedKeys`
- `src/crypto/tls-config.ts` -- `loadDaemonCrypto`, `validateSenderIdentity`, `DaemonCryptoConfig`
- `src/crypto/acl.ts` -- `createAclManager`, `loadAcl`, `AclManager`
