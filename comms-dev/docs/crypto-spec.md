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

# Hub-Mode Cryptographic Protocol — v2 (*CD:Vigenere*)

## Motivation

v1 assumes peer-to-peer mTLS between teams on a shared Docker volume. The fleet now spans two hosts (RC server + PROD-LLM) separated by a firewall. Cross-firewall tunnels for every peer pair are not viable — O(n²) tunnels for n teams. A hub/relay architecture reduces this to O(n) connections (each team connects to the hub).

**Critical constraint:** The hub routes messages but **MUST NOT read message content**. This requires E2E encryption between sender and receiver teams, with the hub blind to the payload.

v2 layers E2E encryption on top of mTLS:
- **mTLS** secures the transport (team ↔ hub): confidentiality, integrity, authentication of the connection
- **E2E encryption** secures the payload (sender team ↔ receiver team): the hub sees routing metadata but not the message body

---

## Threat Model Summary (Hub-Specific)

**Defending against:**
- Compromised or curious hub reading message content
- Hub forging messages claiming to be from another team
- Hub replaying messages between teams
- Man-in-the-middle between team and hub
- Metadata correlation by the hub (partially — see limitations)

**NOT defending against:**
- Hub dropping messages (availability — not a crypto problem)
- Hub performing traffic analysis on message sizes/timing (accepted risk, mitigate with padding)
- Compromise of a team's private keys (endpoint security, not hub crypto)
- Collusion between hub and a team (if hub + team A collude, team A's messages are readable by definition)

Full threat model: see `threat-model.md` §v2.

---

## Cryptographic Identity Model

### Per-Team Key Material

Each team possesses three independent keypairs, serving distinct purposes:

| Keypair | Algorithm | Purpose | Storage |
|---|---|---|---|
| **TLS identity** | ECDSA P-256 (existing) | mTLS authentication to the hub | `daemon.key` / `daemon.crt` |
| **Signing key** | Ed25519 | Message-level sender authentication | `/run/secrets/comms-sign-key` |
| **Encryption key** | X25519 | E2E key agreement with other teams | `/run/secrets/comms-enc-key` |

**Why three separate keypairs:**
- **TLS identity** authenticates the transport connection. The hub uses this to verify which team is connected. This is the existing ECDSA cert.
- **Signing key** authenticates individual messages. Replaces `from.team === peerCertCN` invariant — the receiver verifies the Ed25519 signature, not the TLS peer identity (which is now always "hub").
- **Encryption key** enables E2E confidentiality. X25519 DH between sender and receiver derives a pairwise symmetric key the hub never sees.

Ed25519 and X25519 are intentionally kept separate (even though they use the same curve) to enforce domain separation and avoid cross-protocol attacks.

### Hub Key Material

| Keypair | Algorithm | Purpose |
|---|---|---|
| **TLS identity** | ECDSA P-256 | mTLS authentication — hub authenticates to teams, teams authenticate to hub |
| **No signing key** | — | Hub does NOT sign messages. It forwards them opaquely. |
| **No encryption key** | — | Hub does NOT participate in E2E encryption. |

The hub's TLS certificate has `CN=comms-hub`. Teams authenticate the hub by having its cert in their `peers/` directory (existing mechanism).

### Key Generation

```bash
# Ed25519 signing keypair
openssl genpkey -algorithm ed25519 -out sign-key.pem
openssl pkey -in sign-key.pem -pubout -out sign-key.pub

# X25519 encryption keypair
openssl genpkey -algorithm x25519 -out enc-key.pem
openssl pkey -in enc-key.pem -pubout -out enc-key.pub
```

---

## Key Distribution

### Public Key Bundle

Each team needs the public keys (Ed25519 verify + X25519 encrypt) of every other team. These are distributed as a **key bundle** — a JSON file provisioned out-of-band (Docker Compose volume mount or secret).

```json
{
  "version": 1,
  "generated_at": "2026-03-30T12:00:00Z",
  "teams": {
    "framework-research": {
      "sign_pub": "MCowBQYDK2VwAyEA...",
      "enc_pub": "MCowBQYDK2VuAyEA..."
    },
    "comms-dev": {
      "sign_pub": "MCowBQYDK2VwAyEA...",
      "enc_pub": "MCowBQYDK2VuAyEA..."
    }
  }
}
```

**Path:** `/run/secrets/comms-key-bundle.json` (mounted as Docker secret)

**Why NOT via the hub:**
- The hub is untrusted for key distribution. If the hub provides public keys, a compromised hub can substitute its own keys (classic MITM on key exchange).
- Out-of-band distribution via Docker secrets/Compose means the key bundle is provisioned by the infrastructure operator, not by any runtime component.

**Key rotation:**
1. Generate new keypair for the rotating team
2. Update the key bundle with the new public key
3. Distribute the updated bundle to all teams (Docker secret update + container restart)
4. Old keys are removed from the bundle after a grace period

The key bundle includes a `version` field. Teams reject bundles with a lower version than what they've seen (downgrade protection).

---

## E2E Encryption Protocol

### Pairwise Key Derivation

When team A wants to send to team B:

```
shared_secret = X25519(A.enc_private, B.enc_public)
                  ≡ X25519(B.enc_private, A.enc_public)   // DH symmetry

pairwise_key = HKDF-SHA256(
  ikm:  shared_secret,           // 32 bytes from X25519
  salt: SHA-256(sorted_team_names),  // deterministic: "comms-dev|framework-research"
  info: "comms-v2:e2e:encryption",
  len:  32                       // AES-256 key
)

pairwise_integrity_key = HKDF-SHA256(
  ikm:  shared_secret,
  salt: SHA-256(sorted_team_names),
  info: "comms-v2:e2e:integrity",
  len:  32                       // HMAC-SHA256 key
)
```

**Salt construction:** Sort team names lexicographically, join with `|`, SHA-256 hash. This ensures both sides derive the same salt regardless of who initiates.

**Key caching:** Pairwise keys are derived once per team pair and cached in memory for the session. They do not change unless a team's X25519 key is rotated.

### Encrypt (E2E)

Input: plaintext body, sender team name, receiver team name, message ID

1. Look up (or derive) pairwise encryption key for the sender→receiver pair
2. Generate 12 random bytes as IV: `crypto.randomBytes(12)`
3. Construct AAD: `"v2:" + message.id + ":" + sender_team + ":" + receiver_team`
4. AES-256-GCM encrypt with pairwise key, IV, AAD
5. Return `E2EPayload { iv, ciphertext, tag, sender_team, version: 2 }`

AAD now includes both sender and receiver team names (v1 only had sender), preventing the hub from re-routing an encrypted message to a different receiver.

### Decrypt (E2E)

Input: `E2EPayload`, receiver's own team name

1. Extract sender_team from the payload
2. Look up (or derive) pairwise decryption key for the sender→receiver pair
3. Reconstruct AAD: `"v2:" + message.id + ":" + sender_team + ":" + receiver_team`
4. AES-256-GCM decrypt with pairwise key, IV, AAD, tag
5. If decryption fails: reject (tampered or wrong key)

### E2EPayload Type

```typescript
interface E2EPayload {
  /** AES-256-GCM initialization vector (12 bytes, base64) */
  iv: string;
  /** Ciphertext (base64) */
  ciphertext: string;
  /** GCM authentication tag (16 bytes, base64) */
  tag: string;
  /** Sender team name — needed by receiver to derive pairwise key */
  sender_team: string;
  /** Crypto protocol version */
  version: 2;
}
```

---

## Message Signing (Sender Authentication)

### The Problem

In v1 peer-to-peer, `from.team === peerCertCN` works because the TLS peer IS the sender. In hub mode, the TLS peer is always the hub (`CN=comms-hub`). The receiver cannot trust the `from.team` field in the envelope — the hub could forge it.

### The Solution: Ed25519 Envelope Signatures

The sender signs the message envelope with its Ed25519 private key. The receiver verifies against the sender's Ed25519 public key (from the key bundle).

**What is signed:**

```
sign_input = canonicalize({
  version, id, timestamp,
  from, to, type, priority,
  reply_to,
  body_hash: SHA-256(body),   // hash of the E2E-encrypted body, NOT plaintext
})
```

The signature covers:
- All routing metadata (from, to, type, priority, reply_to)
- Message identity (version, id, timestamp)
- A hash of the encrypted body (binding the metadata to the specific ciphertext)

The signature does NOT cover the body directly — it covers `body_hash` (SHA-256 of the encrypted body string). This allows the hub to forward the message without needing to understand the body contents while still binding the signature to the specific ciphertext.

### Signed Message Envelope

```typescript
interface SignedMessage extends Message {
  /** Ed25519 signature over canonical envelope (base64) */
  signature: string;
  /** SHA-256 hash of the body field (hex), included in signed data */
  body_hash: string;
}
```

### Sign

1. Compute `body_hash = SHA-256(message.body)` (hex-encoded)
2. Construct sign input: all envelope fields + body_hash, excluding `signature` and `checksum`
3. Canonicalize: deterministic JSON serialization (sorted keys, no whitespace)
4. Sign with Ed25519 private key: `crypto.sign('ed25519', sign_input, private_key)`
5. Encode signature as base64

### Verify

1. Extract `signature` from the message
2. Recompute `body_hash = SHA-256(message.body)` — verify it matches the claimed body_hash
3. Reconstruct sign input (same canonicalization)
4. Look up sender's Ed25519 public key from the key bundle using `message.from.team`
5. Verify: `crypto.verify('ed25519', sign_input, public_key, signature)`
6. If verification fails: **reject the message**

### Replacing `from.team === peerCertCN`

The old invariant is replaced by a two-step verification:

| Layer | v1 (peer-to-peer) | v2 (hub mode) |
|---|---|---|
| Transport auth | `from.team === peerCertCN` | `peerCertCN === "comms-hub"` (verify connected to hub) |
| Message auth | (implicit from transport) | Ed25519 signature verification against key bundle |

**Hub validation:** The hub itself should validate `from.team === peerCertCN` on the incoming connection (team→hub). This prevents a team from claiming to be another team at the hub level. But the receiver still MUST verify the Ed25519 signature — the hub's validation is defense-in-depth, not the primary trust mechanism.

---

## Hub Routing — What the Hub Sees

The hub sees the **envelope** (routing metadata) but NOT the **plaintext body**:

| Field | Visible to hub? | Purpose |
|---|---|---|
| `version`, `id`, `timestamp` | Yes | Message identity |
| `from`, `to` | Yes | Routing |
| `type`, `priority` | Yes | Routing priority |
| `body` (E2E-encrypted) | Ciphertext only | Hub forwards opaquely |
| `signature` | Yes | Hub MAY verify (defense-in-depth) |
| `body_hash` | Yes | Binding signature to body |
| `checksum` | Yes | Envelope integrity |

The hub SHOULD verify the Ed25519 signature before forwarding (to reject forged messages early), but the receiver MUST NOT rely on the hub having done so.

---

## Backward Compatibility (v1 ↔ v2)

### Version Detection

- `EncryptedPayload.version === 1`: v1 PSK-encrypted body (peer-to-peer)
- `E2EPayload.version === 2`: v2 E2E-encrypted body (hub mode)

### Migration Path

1. **Phase 1:** Deploy v2 key material (Ed25519 + X25519) alongside existing v1 PSK. Brokers support both versions.
2. **Phase 2:** Hub comes online. ALL communication routes through the hub with v2 E2E. No peer-to-peer fallback.
3. **Phase 3:** Deprecate v1. Remove v1 PSK support entirely.

A message with `signature` field present is v2. Absence means v1 (legacy).

---

## Hub Compromise and Availability

### Hub Compromise Impact

| Asset | Impact if hub is compromised |
|---|---|
| Message content | **SAFE** — E2E encrypted, hub has no decryption keys |
| Message metadata | **EXPOSED** — hub sees from, to, timestamp, type, priority |
| Message integrity | **SAFE** — Ed25519 signatures are verified by receiver, not hub |
| Availability | **AT RISK** — compromised hub can drop, delay, or reorder messages |
| Sender identity | **SAFE** — hub cannot forge Ed25519 signatures |

**Key insight:** A compromised hub is equivalent to a network adversary who can observe and drop traffic but cannot read or forge messages. This is the standard security model for E2E encrypted systems (analogous to Signal's server model).

### Hub Unavailability

There is **no peer-to-peer fallback**. The hub is the single communication path for all teams, whether same-host or cross-host. If the hub is down:

1. Teams queue messages locally with configurable retention
2. Hub restart is an ops responsibility (Docker restart policy, monitoring)
3. When hub recovers, queued messages are delivered

Hub availability is an operational concern, not an application-layer concern.

---

## Updated API (TypeScript)

### New Types

```typescript
/** Key bundle loaded from /run/secrets/comms-key-bundle.json */
interface KeyBundle {
  version: number;
  generated_at: string;
  teams: Record<string, {
    sign_pub: string;  // PEM-encoded Ed25519 public key
    enc_pub: string;   // PEM-encoded X25519 public key
  }>;
}

/** E2E encrypted payload (v2) */
interface E2EPayload {
  iv: string;           // base64, 12 bytes
  ciphertext: string;   // base64
  tag: string;          // base64, 16 bytes
  sender_team: string;  // needed for key derivation
  version: 2;
}

/** Extended message with Ed25519 signature */
interface SignedMessage extends Message {
  signature: string;    // base64 Ed25519 signature
  body_hash: string;    // "sha256:<hex>" — hash of body field
}
```

### New CryptoAPI Methods (v2 additions)

```typescript
interface CryptoAPIv2 extends CryptoAPI {
  /**
   * E2E encrypt a message body for a specific receiver team.
   * Uses X25519 key agreement to derive a pairwise AES-256-GCM key.
   * @param plaintext - Message body to encrypt
   * @param receiverTeam - Destination team name
   * @param messageId - Message ID for AAD binding
   * @returns E2EPayload (hub-opaque)
   */
  e2eEncrypt(plaintext: Buffer, receiverTeam: string, messageId: string): Promise<E2EPayload>;

  /**
   * E2E decrypt a message body from a sender team.
   * @param payload - E2EPayload received from hub
   * @param messageId - Message ID for AAD verification
   * @returns Decrypted plaintext
   * @throws Error if decryption fails (tampered data or wrong key)
   */
  e2eDecrypt(payload: E2EPayload, messageId: string): Promise<Buffer>;

  /**
   * Sign a message envelope with Ed25519.
   * @param message - Complete message (body should already be E2E-encrypted)
   * @returns base64-encoded Ed25519 signature
   */
  signEnvelope(message: Message): string;

  /**
   * Verify an Ed25519 signature on a message envelope.
   * @param message - SignedMessage to verify
   * @returns true if signature is valid, false otherwise
   */
  verifySignature(message: SignedMessage): boolean;

  /**
   * Load and validate a key bundle.
   * @param bundlePath - Path to comms-key-bundle.json
   * @returns Parsed and validated KeyBundle
   */
  loadKeyBundle(bundlePath: string): KeyBundle;

  /**
   * Derive pairwise keys for a specific team pair.
   * Cached after first derivation.
   * @param peerTeam - The other team's name
   * @returns DerivedKeys for E2E encryption with that team
   */
  derivePairwiseKeys(peerTeam: string): DerivedKeys;
}
```

### Usage (v2)

```typescript
import { createCryptoAPIv2 } from './crypto/index.js';

// 1. Load key material
const signKey = readFileSync('/run/secrets/comms-sign-key');
const encKey = readFileSync('/run/secrets/comms-enc-key');
const bundle = loadKeyBundle('/run/secrets/comms-key-bundle.json');

// 2. Create v2 API instance
const crypto = createCryptoAPIv2({
  teamName: 'comms-dev',
  signKey,
  encKey,
  keyBundle: bundle,
});

// 3. E2E encrypt body for receiver
const e2eBody = await crypto.e2eEncrypt(
  Buffer.from('Hello from comms-dev'),
  'framework-research',
  'msg-abc123'
);

// 4. Sign the envelope
const message = buildMessage({ body: JSON.stringify(e2eBody), ... });
const signature = crypto.signEnvelope(message);

// 5. Receiver: verify signature + decrypt
const valid = crypto.verifySignature(signedMessage);
const plaintext = await crypto.e2eDecrypt(e2eBody, signedMessage.id);
```

---

## Security Invariants (v2 additions)

6. **E2E key independence:** Pairwise keys are derived per team pair. Compromise of team A's key reveals only conversations involving team A, not conversations between teams B and C.
7. **Signature non-repudiation:** Ed25519 signatures bind the sender's identity to the message. The sender cannot deny having sent a signed message (assuming their private key is uncompromised).
8. **Hub blindness:** The hub MUST NOT possess any team's X25519 private key or Ed25519 signing key. The hub's TLS identity is sufficient for its routing function.
9. **AAD binding:** E2E AAD includes sender team, receiver team, and message ID. The hub cannot re-route a message to a different receiver (AAD mismatch causes decryption failure).
10. **Key bundle integrity:** Teams reject key bundles with a version lower than what they've previously seen. Downgrade attacks on the key bundle are detected.

---

## Algorithm Summary (v2)

| Function | Primitive | Parameters | Rationale |
|---|---|---|---|
| E2E key agreement | X25519 | 256-bit keys | RFC 7748. Constant-time, no special cases. Standard choice for DH key agreement. |
| E2E encryption | AES-256-GCM | 256-bit key, 96-bit IV, 128-bit tag | Same as v1. Proven, hardware-accelerated, AEAD. |
| E2E key derivation | HKDF-SHA256 | SHA-256 hash, team-pair salt, context info | Same primitive as v1. Domain separation via distinct info strings. |
| Message signing | Ed25519 | 256-bit keys, 512-bit signatures | RFC 8032. Deterministic signatures (no nonce generation needed). Fast, constant-time. |
| Signature hash binding | SHA-256 | Over encrypted body | Binds signature to ciphertext without requiring the signer to include the full body in the signed data. |

### Why These Specific Algorithms

| Choice | Rationale |
|---|---|
| X25519 over ECDH P-256 | Simpler, constant-time by design, no point validation needed. Montgomery ladder is side-channel resistant. |
| Ed25519 over ECDSA P-256 | Deterministic (no random nonce — eliminates a class of implementation bugs). Faster signature generation. |
| Separate Ed25519 + X25519 over dual-use | Avoids cross-protocol attacks. Ed25519 keys on twisted Edwards curve, X25519 on Montgomery curve — mathematically related but operationally isolated. |
| Static X25519 over ephemeral | Ephemeral DH per message would provide forward secrecy but requires a key exchange round-trip or prekey bundles (Signal-style). Static DH is simpler for v2; ephemeral ratcheting is a v3 upgrade path. |

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-03-14 | (*CD:Vigenere*) | Initial v1 crypto specification |
| 2026-03-30 | (*CD:Vigenere*) | v2 hub-mode: E2E encryption (X25519+AES-256-GCM), Ed25519 message signing, key bundle distribution |
