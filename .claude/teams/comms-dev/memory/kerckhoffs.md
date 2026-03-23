# Kerckhoffs Scratchpad

## Session: 2026-03-23

[CHECKPOINT] Codebase review complete. 21 test files, 409 tests, all passing.

## Test Suite Status

| Category | File(s) | Count | Status |
|---|---|---|---|
| Crypto correctness | crypto/crypto.test.ts | ~50 | ✅ PASS |
| TLS config / cert loading | security/tls-config.test.ts | ~20 | ✅ PASS |
| Cert-CN identity invariant | security/cert-invariant.test.ts | ~14 | ✅ PASS |
| Transport framing | transport/frame.test.ts | ~20 | ✅ PASS |
| Message envelope/checksum | transport/envelope.test.ts | ~15 | ✅ PASS |
| UDS server + client | transport/server.test.ts | ~25 | ✅ PASS |
| TLS client (mTLS) | transport/tls-client.test.ts | ~? | ✅ PASS |
| TLS server (mTLS) | transport/tls-server.test.ts | ~? | ✅ PASS |
| TunnelManager | transport/tunnel-manager.test.ts | ~12 | ✅ PASS |
| ACL evaluation + hot-reload | acl/acl.test.ts | ~25 | ✅ PASS |
| Broker (builder/store/inbox) | broker/broker.test.ts | ~35 | ✅ PASS |
| SendMessageBridge seen-set | broker/sendmessage-bridge.test.ts | ~7 | ✅ PASS |
| InboxWatcher (integration glue) | integration/sendmessage-glue.test.ts | ~? | ✅ PASS |
| E2E in-process | integration/e2e.test.ts | ~7 | ✅ PASS |
| Phase 6 cross-team E2E | integration/cross-team-e2e.test.ts | ~9 | ✅ PASS |
| CrossTeamSend MCP tool | mcp/cross-team-send.test.ts | ~? | ✅ PASS |
| Discovery registry | discovery/discovery.test.ts | ~? | ✅ PASS |
| DaemonV2 | daemon/daemon-v2.test.ts | ~20 | ✅ PASS |
| comms-daemon CLI | cli/comms-daemon.test.ts | ~? | ✅ PASS |
| comms-keys CLI | cli/comms-keys.test.ts | ~? | ✅ PASS |
| comms-acl CLI | cli/comms-acl.test.ts | ~? | ✅ PASS |

## Coverage Assessment

### Well-covered (P0)
- AES-256-GCM encrypt/decrypt: happy path, empty, max-size, binary, nonce uniqueness
- Vigenere known-answer vectors: HKDF derivation, HMAC-SHA256 — all pinned
- Tamper detection: ciphertext, IV, auth tag, AAD transplant, wrong key
- Message integrity: checksum covers from/to fields (stableStringify fix from issue #2)
- Replay prevention: dedup by message ID + timestamp window (300s)
- from.team forgery: cert-CN invariant at both unit and E2E level
- MITM: GCM auth tag rejects corrupted ciphertext

### Well-covered (P1)
- ACL: allow/deny, wildcards, default-deny, SIGHUP hot-reload
- Transport: TCP fragmentation, oversized frames, connection drop
- TunnelManager: reconnect, queue, queue overflow, heartbeat, dead-connection
- DaemonV2: startup, delivery, ACL enforcement, SIGHUP, state reporting

### Gaps to note
[GOTCHA] vitest.config.ts excludes `src/cli/**` from coverage — CLI modules
are tested via tests/cli/ but not tracked in coverage report. Acceptable since
CLI tests are integration-level, but coverage threshold applies to non-CLI src only.

[DEFERRED] No performance/load tests. Noted as P2. Not blocking.
[DEFERRED] No timing side-channel tests. Crypto uses GCM (constant-time tag verify
via Node.js openssl). Low-priority for current threat model.

## Key Architectural Facts
- TDD enforced: tests define contract, implementers make them green
- Checksum: stableStringify (recursive key sort) — bug fix tracked in GitHub Issue #2
- PSK: hex-encoded, min 64 chars (32 bytes). Loaded via loadPsk().
- Key derivation: HKDF, context 'comms-v1', produces separate encryptionKey + integrityKey
- IV: 12 bytes (96-bit GCM standard), random per message
- Auth tag: 16 bytes (128-bit full GCM tag)
- Timestamp replay window: 300 seconds
- Queue per peer: max 100 messages
- Dedup: MessageStore by message ID, 5-minute TTL

## Write Scope
- `comms-dev/tests/` — all test files
- `comms-dev/vitest.config.ts` — test config
- `comms-dev/.github/` — CI pipeline
- `comms-dev/docs/security-report.md` — security findings
- This scratchpad

## Do NOT touch
- `comms-dev/src/` — report bugs to babbage/vigenere via SendMessage
- Team config, roster, prompts
- Git (team-lead handles)
