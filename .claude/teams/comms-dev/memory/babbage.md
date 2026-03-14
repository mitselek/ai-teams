# Babbage Scratchpad
<!-- (*CD:Babbage*) -->

## State: ALL TASKS COMPLETE — standing by

## [CHECKPOINT] 2026-03-14 — Initial implementation complete

**What's implemented (all type-check clean):**
```
comms-dev/src/
  types.ts                     — all shared interfaces
  transport/
    framing.ts                 — 4-byte length-prefix encode/decode (FrameDecoder handles fragmentation)
    client.ts                  — UDSClient with exponential backoff + at-least-once retry
    server.ts                  — UDSServer with checksum validation + ACK
  discovery/
    registry.ts                — RegistryManager: read/write/heartbeat/cleanStale, .lock sentinel locking
  broker/
    message-builder.ts         — buildMessage() + computeChecksum() (sorted-key JSON for determinism)
    message-store.ts           — MessageStore: dedup by ID with TTL GC
    daemon.ts                  — Broker daemon: wires server+registry+store, heartbeat, stale cleanup
  cli/
    comms-send.ts              — CLI: send to team via UDS, looks up socket from registry
    comms-publish.ts           — CLI: create GitHub Issue via gh CLI with structured header+attribution
```

## [DECISION] Checksum canonical form — FIXED (Issue #2, Task #16)

~~JSON.stringify with sorted key array~~ — WRONG: array replacer only covers top-level keys, nested objects (`from`, `to`) serialise as `{}`.

**Correct:** `stableStringify()` from `src/util/stable-stringify.ts` — recursive key sort at every depth. Both `message-builder.ts` and `server.ts` import and use this function.

## [LEARNED] JSON.stringify array replacer gotcha

`JSON.stringify(obj, ['key1', 'key2'])` only filters top-level keys. Nested object values are included if the key appears in the array, but their own keys are NOT filtered recursively — they're just dropped, producing `{}`. Never use for canonical hashing of nested structures.

## [DECISION] File locking strategy

Sentinel `.lock` file with O_EXCL + 10s stale detection. No external dep. Atomic registry write via .tmp + rename (POSIX atomic).

## [WIP] Crypto integration pending

`CryptoProvider` interface defined in `types.ts`. Broker accepts `config.crypto?: CryptoProvider`. When Vigenere delivers their module:
1. Import from `comms-dev/src/crypto/`
2. Wire into UDSServer (decrypt incoming) and UDSClient (encrypt outgoing)
3. The interface: `{ encrypt(plaintext: Buffer): Promise<Buffer>, decrypt(ciphertext: Buffer): Promise<Buffer> }`

## [GOTCHA] Checksum computed before encryption

Checksum covers plaintext envelope fields. Encryption wraps the already-checksummed frame. On receive: decrypt first, then verify checksum.

## [DEFERRED] SendMessage integration glue

`daemon.ts:handleIncoming()` logs messages but doesn't yet deliver to local agent inbox. Need to define how broker writes to the inbox files that agents poll. File-based inbox? Named pipe? Requires team-lead decision.

## [GOTCHA] gh CLI / /tmp restriction

`comms-publish` writes body to cwd as `.gh-issue-body.md`, not /tmp. See common-prompt.md gotcha.

## Key scenario notes for Kerckhoffs

Test priorities:
1. `framing.ts` — encode/decode round-trip, fragmented chunks, oversized messages
2. `message-builder.ts` — checksum determinism (two builds of same payload = same checksum)
3. `registry.ts` — concurrent lock acquisition, stale entry cleanup
4. `message-store.ts` — dedup within TTL, accept after TTL expiry
5. Integration: server receives message → deduplicates → ACKs correctly
