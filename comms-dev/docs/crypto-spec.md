# Cryptographic Protocol Specification — v1 (*CD:Vigenere*)

## Overview

This document specifies the cryptographic design of the comms-dev inter-team messaging system, version 1. It covers algorithm choices, key management, message encryption, and integrity verification.

For the threat model justifying these choices, see `threat-model.md`.

---

## Algorithm Choices

| Function | Primitive | Parameters | Rationale |
|---|---|---|---|
| Symmetric encryption | AES-256-GCM | 256-bit key, 96-bit IV, 128-bit tag | NIST-approved AEAD. Built into Node.js `crypto` (OpenSSL). Provides confidentiality + authentication in one pass. |
| Key derivation | HKDF-SHA256 | SHA-256 hash, empty salt, context-specific info | Extracts and expands PSK into separate keys. RFC 5869. Prevents key reuse across operations. |
| Message integrity | HMAC-SHA256 | 256-bit key | Keyed hash for the message envelope `checksum` field. Defense-in-depth above GCM. |
| Nonce generation | `crypto.randomBytes(12)` | 96-bit random | Standard GCM nonce. Random nonces safe for < 2^48 messages per key (birthday bound). |

### Why Not Other Algorithms

| Alternative | Rejection reason |
|---|---|
| ChaCha20-Poly1305 | Excellent algorithm, but AES-GCM has hardware acceleration (AES-NI) on all target platforms. No compelling advantage for our use case. |
| AES-256-CBC + HMAC | Two-pass (encrypt-then-MAC). GCM does both in one pass. CBC is vulnerable to padding oracles if implemented incorrectly. |
| XSalsa20 (NaCl secretbox) | Would require an additional dependency. Node.js `crypto` has native AES-GCM. |
| RSA / ECDSA for signing | Asymmetric crypto is deferred to v2. v1 uses symmetric PSK only. |

---

## Key Management

### Key Hierarchy

```
PSK (256-bit, hex-encoded)
 │
 ├── HKDF(psk, info="comms-v1:encryption") → Encryption Key (256-bit)
 │
 └── HKDF(psk, info="comms-v1:integrity")  → Integrity Key (256-bit)
```

### PSK Provisioning

1. Generate: `openssl rand -hex 32` (produces 64 hex characters = 256 bits)
2. Store as Docker secret: `echo "<hex>" | docker secret create comms-psk -`
3. Mount in container: `/run/secrets/comms-psk` (read-only tmpfs)
4. Load at broker startup: read file, strip whitespace, decode hex, validate length

### Key Derivation

HKDF-SHA256 with domain separation:

- **Salt:** empty (PSK already has high entropy)
- **Info (encryption):** `"comms-v1:encryption"` — binds the derived key to the encryption purpose
- **Info (integrity):** `"comms-v1:integrity"` — binds the derived key to the integrity purpose
- **Output length:** 32 bytes (256 bits) each

This ensures the encryption key and integrity key are cryptographically independent, even though they derive from the same PSK.

### Key Rotation

v1 does not support online key rotation. To rotate:

1. Generate a new PSK
2. Update the Docker secret
3. Restart all containers

All containers must use the same PSK. There is no key versioning in v1.

---

## Encryption Protocol

### Encrypt

Input: plaintext bytes, optional AAD (additional authenticated data)

1. Generate 12 random bytes as IV: `crypto.randomBytes(12)`
2. Create AES-256-GCM cipher with encryption key, IV, tag length = 16
3. If AAD is provided, call `cipher.setAAD(aad)`
4. Encrypt: `cipher.update(plaintext) + cipher.final()`
5. Extract authentication tag: `cipher.getAuthTag()`
6. Return `EncryptedPayload { iv, ciphertext, tag, aad, version: 1 }` (all base64-encoded)

### Decrypt

Input: `EncryptedPayload`

1. Validate version === 1
2. Decode IV, ciphertext, tag, AAD from base64
3. Validate IV length === 12, tag length === 16
4. Create AES-256-GCM decipher with encryption key, IV
5. Set authentication tag
6. If AAD is present, call `decipher.setAAD(aad)`
7. Decrypt: `decipher.update(ciphertext) + decipher.final()`
8. If `final()` throws, the authentication tag did not verify — data is tampered. **Reject the message.**
9. Return plaintext

### AAD Usage

The AAD field binds metadata to the ciphertext without encrypting it. Recommended AAD for messages:

```
AAD = message.id + ":" + message.from.team
```

This prevents **ciphertext transplant attacks**: an attacker cannot take an encrypted message from Team A→B and replay it as if it were from Team C, because the AAD would not match.

---

## Integrity (Checksum)

### Compute

The message envelope `checksum` field uses HMAC-SHA256:

1. Serialize all message fields **except** `checksum` as a deterministic JSON string
2. Compute `HMAC-SHA256(integrityKey, serializedMessage)`
3. Format as `"sha256:<hex>"`

### Verify

1. Extract the `checksum` field from the message
2. Recompute HMAC-SHA256 over all other fields
3. Compare using constant-time `timingSafeEqual` to prevent timing attacks
4. If mismatch: **reject the message**

### Why HMAC, Not Plain SHA-256

A plain SHA-256 hash can be recomputed by anyone who has the message. HMAC-SHA256 requires the integrity key, so only parties with the PSK can produce or verify valid checksums. This is defense-in-depth: even if GCM authentication is somehow bypassed (e.g., a bug in the framing layer that strips the tag), the HMAC checksum catches tampering.

---

## Wire Format Integration

When a message is sent over UDS:

```
┌──────────────────────────────────────────────┐
│ 4 bytes: length prefix (big-endian uint32)   │
├──────────────────────────────────────────────┤
│ JSON envelope (plaintext metadata)           │
│ {                                            │
│   "version": "1",                            │
│   "id": "msg-<uuid>",                        │
│   "from": { ... },                           │
│   "to": { ... },                             │
│   "type": "handoff",                         │
│   "priority": "normal",                      │
│   "reply_to": null,                          │
│   "body": "<EncryptedPayload as JSON>",      │
│   "checksum": "sha256:<hex>"                 │
│ }                                            │
└──────────────────────────────────────────────┘
```

The `body` field contains a JSON-serialized `EncryptedPayload`. The rest of the envelope is plaintext metadata needed for routing. The `checksum` covers the entire envelope (including the encrypted body) to detect tampering of metadata.

---

## Public API (TypeScript)

### Types

```typescript
interface EncryptedPayload {
  iv: string;         // base64, 12 bytes
  ciphertext: string; // base64
  tag: string;        // base64, 16 bytes
  aad: string;        // base64
  version: 1;
}

interface DerivedKeys {
  encryptionKey: Buffer;  // 32 bytes
  integrityKey: Buffer;   // 32 bytes
}

interface CryptoOptions {
  aad?: string;
}

interface CryptoAPI {
  encrypt(plaintext: Buffer, options?: CryptoOptions): Promise<EncryptedPayload>;
  decrypt(payload: EncryptedPayload): Promise<Buffer>;
  deriveKey(psk: Buffer, context: string): DerivedKeys;
  computeChecksum(data: Buffer): string;
  verifyIntegrity(data: Buffer, checksum: string): boolean;
}
```

### Usage

```typescript
import { createCryptoAPI, deriveKey, loadPsk } from './crypto/index.js';

// 1. Load PSK from Docker secret
const psk = loadPsk(readFileSync('/run/secrets/comms-psk', 'utf-8'));

// 2. Derive keys
const keys = deriveKey(psk, 'comms-v1');

// 3. Create API instance
const crypto = createCryptoAPI(keys);

// 4. Encrypt a message body
const encrypted = await crypto.encrypt(
  Buffer.from('Hello from Team A'),
  { aad: 'msg-abc123:framework-research' }
);

// 5. Decrypt
const plaintext = await crypto.decrypt(encrypted);

// 6. Compute envelope checksum
const checksum = crypto.computeChecksum(Buffer.from(envelopeJson));

// 7. Verify checksum
const valid = crypto.verifyIntegrity(Buffer.from(envelopeJson), checksum);
```

### CryptoProvider Adapter (for Babbage's broker)

```typescript
import { createCryptoProvider } from './crypto/provider.js';

const provider = createCryptoProvider(crypto);
// provider.encrypt(Buffer) → Buffer (JSON-serialized EncryptedPayload)
// provider.decrypt(Buffer) → Buffer (plaintext)
```

---

## Security Invariants

1. **IV uniqueness:** Every encrypt() call generates a fresh random IV. IV reuse with the same key is catastrophic for GCM — it leaks the XOR of two plaintexts and allows tag forgery.
2. **No key material in logs:** The crypto module never logs, prints, or includes keys in error messages.
3. **Fail closed:** Any crypto error (bad tag, bad IV length, bad version) throws an exception. The caller must not deliver the message.
4. **Constant-time comparison:** All checksum verification uses `timingSafeEqual`.
5. **Domain separation:** Encryption and integrity use different keys derived via HKDF with different info strings.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-03-14 | (*CD:Vigenere*) | Initial v1 crypto specification |
