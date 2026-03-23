# Vigenere Scratchpad — comms-dev Crypto Engineer

## Codebase Review (2026-03-23)

[CHECKPOINT] Full review of crypto domain complete.

### Module Inventory (`src/crypto/`)

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `types.ts` | 88 | EncryptedPayload, DerivedKeys, CryptoOptions, CryptoAPI interfaces | Complete |
| `crypto.ts` | 227 | AES-256-GCM encrypt/decrypt, HKDF-SHA256 deriveKey, HMAC-SHA256 checksum, loadPsk | Complete |
| `provider.ts` | 33 | CryptoProvider adapter (Buffer→Buffer) for Babbage's broker | Complete |
| `tls-config.ts` | 203 | mTLS cert loading, fingerprinting, sender identity validation | Complete |
| `acl.ts` | 132 | Per-agent ACL with wildcard, default-deny, hot-reload via SIGHUP | Complete |
| `index.ts` | 7 | Re-exports public API | Complete |

### API Surface

- `createCryptoAPI(keys)` → CryptoAPI (encrypt, decrypt, deriveKey, computeChecksum, verifyIntegrity)
- `deriveKey(psk, context)` → DerivedKeys (encryptionKey + integrityKey via HKDF-SHA256)
- `encrypt(key, plaintext, opts?)` → EncryptedPayload (AES-256-GCM, random 96-bit IV)
- `decrypt(key, payload)` → Buffer (validates version, IV len, tag len, GCM auth)
- `computeChecksum(integrityKey, data)` → "sha256:<hex>" (HMAC-SHA256)
- `verifyIntegrity(integrityKey, data, checksum)` → boolean (constant-time)
- `loadPsk(hexString)` → Buffer (validates hex format, ≥32 bytes)
- `createCryptoProvider(api)` → CryptoProvider (Babbage's Buffer-in/Buffer-out interface)
- `loadDaemonCrypto(opts)` → DaemonCryptoConfig (key, cert, peer certs + fingerprints)
- `computeFingerprint(certPem)` → SHA-256 fingerprint string
- `getAuthenticatedTeam(socket)` → string | null
- `validateSenderIdentity(msg, authTeam)` → { valid, reason? }
- ACL: `loadAcl`, `isAllowed`, `matchesPattern`, `createAclManager`

### Test Coverage (`tests/`)

- `tests/crypto/crypto.test.ts` — 40+ tests: key derivation, encrypt/decrypt roundtrip, nonce uniqueness, AAD, tamper detection, malformed payloads, checksum/integrity, loadPsk, known-answer vectors, CryptoProvider adapter
- `tests/security/tls-config.test.ts` — 12 tests: cert loading, validation, fingerprinting, getAuthenticatedTeam
- `tests/security/cert-invariant.test.ts` — 11 tests: validateSenderIdentity (from.team === peerCertCN)
- `tests/acl/acl.test.ts` — 22 tests: matchesPattern, isAllowed send/receive, loadAcl parsing, hot-reload

### Docs

- `docs/crypto-spec.md` — v1 spec: algorithm choices, key mgmt, encrypt/decrypt protocol, wire format, API
- `docs/threat-model.md` — 7 threats analyzed (T1-T7), trust boundaries, assets, v2 upgrade path

### Observations

[DECISION] Crypto primitives: AES-256-GCM + HKDF-SHA256 + HMAC-SHA256. Conservative, proven. No changes needed.

[PATTERN] Clean separation: CryptoAPI (full interface) → CryptoProvider (Babbage's simplified adapter). Provider serializes EncryptedPayload as JSON Buffer on the wire.

[GOTCHA] AAD in EncryptedPayload is stored as base64 and embedded in the payload itself. On decrypt, AAD is extracted from the payload — the decryptor does NOT need to separately supply the AAD. This is correct for the provider adapter but means the AAD is visible (not encrypted, just authenticated).

[GOTCHA] `encrypt`/`decrypt` in crypto.ts are `async` but contain no async operations — they're sync under the hood. This is fine for API compatibility but worth noting.

[GOTCHA] The threat model notes T2 checksum as "SHA-256 of plaintext body" but the implementation uses HMAC-SHA256 with the integrity key. The spec correctly says HMAC-SHA256. Minor doc inconsistency in threat-model.md T2 section — not a code bug.

[DECISION] v1 has no forward secrecy, no per-team keys, no online key rotation. All accepted risks documented in threat model. v2 path: X25519 + NaCl.

(*CD:Vigenere*)
