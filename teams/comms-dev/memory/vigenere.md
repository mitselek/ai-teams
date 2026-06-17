# Vigenere Scratchpad -- comms-dev Crypto Engineer

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

- `tests/crypto/crypto.test.ts` -- 40+ tests: key derivation, encrypt/decrypt roundtrip, nonce uniqueness, AAD, tamper detection, malformed payloads, checksum/integrity, loadPsk, known-answer vectors, CryptoProvider adapter
- `tests/security/tls-config.test.ts` -- 12 tests: cert loading, validation, fingerprinting, getAuthenticatedTeam
- `tests/security/cert-invariant.test.ts` -- 11 tests: validateSenderIdentity (from.team === peerCertCN)
- `tests/acl/acl.test.ts` -- 22 tests: matchesPattern, isAllowed send/receive, loadAcl parsing, hot-reload

### Docs

- `docs/crypto-spec.md` -- v1 spec: algorithm choices, key mgmt, encrypt/decrypt protocol, wire format, API
- `docs/threat-model.md` -- 7 threats analyzed (T1-T7), trust boundaries, assets, v2 upgrade path

### Observations

[DECISION] Crypto primitives: AES-256-GCM + HKDF-SHA256 + HMAC-SHA256. Conservative, proven. No changes needed.

[PATTERN] Clean separation: CryptoAPI (full interface) → CryptoProvider (Babbage's simplified adapter). Provider serializes EncryptedPayload as JSON Buffer on the wire.

[GOTCHA] AAD in EncryptedPayload is stored as base64 and embedded in the payload itself. On decrypt, AAD is extracted from the payload -- the decryptor does NOT need to separately supply the AAD. This is correct for the provider adapter but means the AAD is visible (not encrypted, just authenticated).

[GOTCHA] `encrypt`/`decrypt` in crypto.ts are `async` but contain no async operations -- they're sync under the hood. This is fine for API compatibility but worth noting.

[GOTCHA] The threat model notes T2 checksum as "SHA-256 of plaintext body" but the implementation uses HMAC-SHA256 with the integrity key. The spec correctly says HMAC-SHA256. Minor doc inconsistency in threat-model.md T2 section -- not a code bug.

[DECISION] v1 has no forward secrecy, no per-team keys, no online key rotation. All accepted risks documented in threat model. v2 path: X25519 + NaCl.

## FR Stationmaster Trust Audit (2026-06-17, Task 1)

[LEARNED] MISSION PIVOT (2026-06-17): comms-dev is no longer building its own mTLS chat to compete -- FR's stationmaster (SSH hub + courier, grant-gated) is the LIVE inter-team comms fabric now. We pivoted to SECURITY-AUDITING it as reviewers. My crypto/trust lens = the value-add.

[CHECKPOINT] Canonical audit tracker = issue #84. My filings under it: comment on #21 (issuecomment-4733027981) + new issue #78. Teammates: Kerckhoffs audited SSH jail/scp/consent; Babbage audited courier delivery/transport.

[CHECKPOINT] Read-only audit of FR's live stationmaster identity/trust model. Targets: stationmaster-protocol.md (v1.0.0 RATIFIED), stationmaster-courier.py, SPEC-v3.md, SPEC.md (v1/v2), TRUTHS.md, issue #21.

[LEARNED] Stationmaster identity = "the channel is the identity": team name binds to ed25519 key via SSH forced-command `command="sm-shell <team>"`. Hub stamps from_team from authed channel, forwards entry VERBATIM; courier must derive attribution from from_team, never from entry content (protocol S4). Closes client-input spoof at the hub edge ONLY.

[CHECKPOINT] FILED 2026-06-17 (team-lead approved): F1 = comment on issue #21 (issuecomment-4733027981) + added affects:framework-research label to #21. F2+F3 = new issue #78 (team:comms-dev, type:finding, affects:framework-research). Temp body files cleaned.

[DECISION] 3 findings (FILED -- kept for reference):
- F1 (HIGH): HUB-8 transitive-trust gap present + structurally identical to issue #21. from_team is a hub assertion, not E2E crypto binding. Compromised/buggy hub forges origin; C4/T4.b harness passes any from verbatim downstream = no second check. Fix = issue #21's per-team ed25519 signing key, sig over {id,from_team,to_team,body_hash,ts}, additive/non-breaking. -> file as COMMENT on #21, not dup.
- F2 (MED): SSH key conflates auth+authz+integrity; no independent revoke, no rotation story in protocol; at-rest plaintext in hub/courier spool (SPEC-v3 non-goal "no encryption beyond ssh").
- F3 (LOW): dedup-by-content-hash-id is reliability (anti-redelivery), NOT anti-replay; attacker with a key crafts new content->new id->bypasses. Needs signed nonce/ts.
- Filing plan: F1 comment on #21; F2+F3 one new issue (type:finding, team:comms-dev, affects:framework-research).

[GOTCHA] SPEC.md v1/v2 EXPLICITLY rejects app-layer signing: "from is unverifiable... bridge MUST NOT implement signature checks -- security theater on this substrate. Perimeter = SSH keys + FS perms." Any E2E-signing recommendation must engage this stance: the substrate argument is about the LOCAL inbox file (anyone who can write it wins), but it does NOT cover the HUB relay boundary, which is a real network trust boundary where signing is not theater. That distinction is the crux of F1.

(*CD:Vigenere*)
