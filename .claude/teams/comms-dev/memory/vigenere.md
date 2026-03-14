# Vigenere Scratchpad (*CD:Vigenere*)

## [CHECKPOINT] Session 2026-03-14

### Completed Tasks
- #4: Threat model (`comms-dev/docs/threat-model.md`) — 7 threats (T1-T7), v1 scope
- #5: Crypto API design + implementation (`comms-dev/src/crypto/`) — 4 files
- #18: AAD support added to CryptoProvider interface
- Security review of Babbage's integration — 5 findings (S1-S5), all tracked
- PSK provisioning review for Docker secrets
- 3 brainstorm rounds: central relay, cloud relay + WSS, web frontend auth

### Key Crypto Decisions

[DECISION] **Two-secret model** (supersedes PSK-for-everything):
- `RELAY_TOKEN`: bearer token for relay auth (transport layer)
- `COMMS_PSK`: 256-bit symmetric key for E2E payload encryption (application layer)
- Relay compromise exposes metadata only, not content

[DECISION] **Algorithm choices (v1)**:
- AES-256-GCM (encryption), HKDF-SHA256 (key derivation), HMAC-SHA256 (integrity)
- 96-bit random nonces, 128-bit GCM tags
- Separate encryption + integrity keys via HKDF domain separation

[DECISION] **AAD formula**: `message.id + ":" + message.from.team + ":" + message.conversation_id`
- Prevents ciphertext transplant between messages/conversations

[DECISION] **Web frontend auth**: WebAuthn/passkeys, NOT RELAY_TOKEN
- No E2E for web users in v1 — relay decrypts agent E2E, serves over TLS
- v2: per-session ephemeral X25519 via Web Crypto API

[DECISION] **Relay as content-blind router** for agent-to-agent traffic
- Relay reads only envelope metadata (from, to, type, priority, timestamp)
- Body is opaque encrypted blob — relay never inspects
- Exception: web-destined messages — relay decrypts with COMMS_PSK for web users

### Reusable for v2 (Cloudflare pivot)

| Module | Reuse | Notes |
|---|---|---|
| `src/crypto/*` | 100% | Transport-agnostic, stateless per-message |
| `src/types.ts` | 90% | Add `conversation_id` |
| `src/broker/message-builder.ts` | 80% | Canonicalization + checksum logic |
| `src/broker/message-store.ts` | 100% | Dedup by message ID |
| `src/broker/inbox.ts` | 100% | File-based inbox delivery |
| `src/transport/*` | 0% | UDS-specific, replace with WSS |
| `src/discovery/*` | 0% | File-based registry, relay handles discovery |

### Threat Model Updates Needed

[DEFERRED] Add relay-specific threats to threat-model.md:
- T-R1: Relay compromise (metadata exposure)
- T-R2: Relay as SPOF
- T-R3: Relay log exposure (must NEVER log bodies)
- T-R4: Relay-side replay

[DEFERRED] DO Storage security: queued messages must remain E2E encrypted blobs

### Test Vectors (for Kerckhoffs)

PSK: `a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`
Context: `comms-v1`
Encryption key: `379a447f9cbdb6d5f740bf45b5ab560084b91d0dd3d00508cf760f5edafedcca`
Integrity key: `05460b9c146eb6d124364d52a3ff76a7de45008f0d23a54f02827cabcdd8f826`
HMAC("Hello, World!"): `sha256:cc16d65760ecde69ee848beda3ece08c58c1bd12f695f4553ef49550edb3c4cc`

### v2 Crypto Upgrade Path

[DEFERRED] Per-team X25519 keypairs — relay as PKI/key distribution
[DEFERRED] Ed25519 per-agent signing (Volta's recommendation, NOT JWT)
[DEFERRED] Forward secrecy via ephemeral key exchange
[DEFERRED] Online key rotation with key versioning
