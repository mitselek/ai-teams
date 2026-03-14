# Kerckhoffs Scratchpad
<!-- (*CD:Kerckhoffs*) -->

## [CHECKPOINT] 2026-03-14 — End of session

**Test suite: 203 passing, 8 test files** (v1 complete)

### Test files owned
| File | Tests |
|---|---|
| `tests/transport/frame.test.ts` | 19 |
| `tests/transport/envelope.test.ts` | 17 |
| `tests/transport/server.test.ts` | 28 (HMAC, timestamp replay, UNREACHABLE) |
| `tests/crypto/crypto.test.ts` | 60 |
| `tests/discovery/discovery.test.ts` | 18 |
| `tests/broker/broker.test.ts` | 38 |
| `tests/integration/e2e.test.ts` | 6 (full pipeline) |
| `tests/integration/sendmessage-glue.test.ts` | 14 (InboxWatcher) |
| `tests/broker/sendmessage-bridge.test.ts` | 9 (7 RED — Babbage implementing #25) |

### Security findings
- **Issue #2** (HIGH): `stableStringify` fix — `from`/`to` were serialised as `{}`, sender spoofing bypass.
- **#24** (BUG): InboxWatcher deleted file on handler throw → message loss. Fixed.
- **#25** (BUG): SendMessageBridge `seen` set unbounded. RED tests written, Babbage implementing.

## [DECISION] v2 QA strategy (Cloudflare DO relay)

Three layers: Unit (Miniflare `@cloudflare/vitest-pool-workers`) → Integration (Miniflare in-process) → Acceptance (wrangler dev / staging).

**Playwright required** — Web Crypto browser-specific behavior (Safari ITP, `verify()` false-vs-throw) can't be tested in Node.

**Security bar:** CSP no `unsafe-inline`, DOMPurify on message bodies, private key `extractable:false` in IndexedDB, bearer tokens only, `from.team` bound to authenticated connection (not envelope).

## [DECISION] Protocol blockers for relay spec

1. Durability: in-memory queue OR DO Storage? Determines crash test design.
2. AAD must include `conversation_id` — Vigenere sign-off needed.
3. Silent TTL expiry breaks at-least-once — relay must notify sender.

## [LEARNED] DO hibernation — highest risk

`getWebSockets(tag)` rebuild after hibernation = silent drop if wrong. First test to write. `setInterval` doesn't survive — use DO Alarm.

## [DEFERRED] Task #25 GREEN

Verify `seenSize()`, `maxSeenSize`, eviction, `stop()` clear — all 9 tests pass.

## [PATTERN] TDD flow (active from 2026-03-14)

Kerckhoffs writes RED → `[COORDINATION]` to implementer → GREEN → Kerckhoffs verifies + edge cases.

## [GOTCHA] ESM — no require()

`"type":"module"` in package.json. Use top-level imports or `await import()`.
