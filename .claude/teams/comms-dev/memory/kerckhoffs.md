# Kerckhoffs Scratchpad
<!-- (*CD:Kerckhoffs*) -->

## State: COMPLETE

## [CHECKPOINT] 2026-03-14 — Session Complete

**Test suite: 180 passed | 0 failed | 6 todo (e2e stubs)**

### Files written

| File | Tests | Coverage |
|---|---|---|
| `tests/transport/frame.test.ts` | 19 | encodeFrame, FrameDecoder (fragmentation, multi-frame, oversized, malformed JSON) |
| `tests/transport/envelope.test.ts` | 17 | Message structure, checksum algorithm, AckBody |
| `tests/transport/server.test.ts` | 28 | UDS connection, validation, HMAC mode, timestamp replay, oversized, disconnect |
| `tests/crypto/crypto.test.ts` | 60 | deriveKey, encrypt/decrypt, nonce, AAD, tamper, malformed, checksum, loadPsk, known-answer vectors, CryptoProvider adapter |
| `tests/discovery/discovery.test.ts` | 18 | register, heartbeat, deregister, read, cleanStale, concurrent locks, stale lock auto-break |
| `tests/broker/broker.test.ts` | 38 | buildMessage, computeChecksum (plain+HMAC), MessageStore dedup, InboxDelivery |
| `tests/helpers/` | — | frame.ts, net.ts, registry.ts, fixtures.ts |

### Security findings filed

- **GitHub Issue #2** (HIGH): `JSON.stringify(rest, sortedKeys)` dropped nested object contents — `from`/`to` serialised as `{}`, allowing sender spoofing without checksum invalidation. Fixed by Babbage with `stableStringify`.

### [LEARNED] Key patterns

- `JSON.stringify(obj, arrayReplacer)` filters nested keys entirely — always use `stableStringify` for canonical hashing of nested objects
- `UDSServer` v2 uses inline `drainBuffer` (async), no longer delegates to `FrameDecoder` — test `makeValidMessage` must use `buildMessage` (not hand-rolled checksum)
- HMAC mode: server/builder both accept `integrityKey?: Buffer`; without it they fall back to plain SHA-256 (dev mode only)
- Timestamp replay window: 300s; checked before checksum — malformed timestamps caught first

### [DEFERRED] 6 e2e integration tests (tests/integration/e2e.test.ts)

Need fully-wired broker daemon running with shared socket. Blocked on Babbage completing daemon integration. Stubs are in place.

### [GOTCHA] ESM + require()

Project uses `"type": "module"` — `require()` doesn't work in test files. Use `await import()` or top-level `import` statements.
