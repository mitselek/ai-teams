# Threat Model — comms-dev Encrypted Chat System (v1) (*CD:Vigenere*)

## Scope

This threat model covers **v1** of the inter-team encrypted chat system:
- Transport: Unix Domain Sockets (UDS) over a shared Docker volume at `/shared/comms/`
- Encryption: TLS-PSK (pre-shared symmetric key, AES-256-GCM)
- Key provisioning: Docker secrets (`/run/secrets/comms-psk`)
- Message format: 4-byte length-prefixed JSON envelope with Markdown body
- Discovery: `registry.json` on shared volume with file-locked writes

**Out of scope for v1:** X25519 key exchange, per-team keypairs, certificate authorities, forward secrecy, v2 upgrade path (documented separately).

---

## System Architecture (Security View)

```
┌──────────────────┐         /shared/comms/          ┌──────────────────┐
│  Container A     │    ┌─────────────────────┐      │  Container B     │
│                  │    │  registry.json      │      │                  │
│  Broker A        │    │  team-a.sock        │      │  Broker B        │
│  ├─ TLS-PSK      │◄──┤  team-b.sock        │──►   │  ├─ TLS-PSK      │
│  ├─ encrypt()    │    └─────────────────────┘      │  ├─ decrypt()    │
│  └─ HMAC verify  │         shared volume           │  └─ HMAC verify  │
│                  │                                  │                  │
│  PSK from:       │                                  │  PSK from:       │
│  /run/secrets/   │                                  │  /run/secrets/   │
│  comms-psk       │                                  │  comms-psk       │
└──────────────────┘                                  └──────────────────┘
```

---

## Trust Boundaries

| Boundary | Description |
|---|---|
| **B1: Container boundary** | Each team runs in its own Docker container. Process isolation is enforced by the container runtime. |
| **B2: Shared volume** | `/shared/comms/` is readable/writable by all containers that mount it. This is the primary attack surface. |
| **B3: Docker secrets** | `/run/secrets/comms-psk` is mounted read-only into each container. Accessible to all processes within the container. |
| **B4: Host filesystem** | The Docker host has full access to volumes, secrets, and container state. |

---

## Assets

| Asset | Value | Location |
|---|---|---|
| **Pre-shared key (PSK)** | Master encryption key — compromise breaks all confidentiality and integrity | `/run/secrets/comms-psk` in each container |
| **Message plaintext** | Inter-team operational messages — may contain task details, decisions, coordination | In-memory during encrypt/decrypt |
| **Registry** | Team discovery metadata — socket paths, capabilities, heartbeats | `/shared/comms/registry.json` |
| **Socket files** | UDS endpoints for each team's broker | `/shared/comms/<team>.sock` |

---

## Threat Analysis

### T1: Inter-Container Eavesdropping

**Threat:** An attacker with access to the shared volume reads raw bytes from UDS traffic or intercepts data in transit between containers.

**Attack vector:** A compromised container, a malicious container on the same Docker network, or a process with access to the shared volume.

**Mitigation:**
- All messages are encrypted with AES-256-GCM before transmission over UDS
- GCM provides authenticated encryption — ciphertext without the PSK yields no plaintext
- UDS traffic does not traverse the network stack (kernel-internal IPC), reducing sniffing surface compared to TCP

**Residual risk:** An attacker with access to the shared volume can observe *metadata*: which sockets exist, connection timing, message sizes (length prefix is unencrypted). Traffic analysis remains possible. v1 does NOT defend against traffic analysis.

**Severity:** HIGH if PSK is compromised, LOW if PSK is intact.

---

### T2: Message Tampering

**Threat:** An attacker modifies ciphertext in transit to alter the message content.

**Attack vector:** Man-in-the-middle on the shared volume, or a compromised broker relaying modified messages.

**Mitigation:**
- AES-256-GCM provides built-in authentication — any modification to ciphertext, AAD, IV, or tag causes decryption to fail
- The JSON envelope `checksum` field (SHA-256 of the plaintext body) provides an additional application-layer integrity check after decryption
- Modified messages are rejected and logged; they are never delivered to the application layer

**Residual risk:** An attacker can *drop* messages (denial of service) but cannot *modify* them undetected.

**Severity:** MITIGATED by AES-GCM authentication tag.

---

### T3: Replay Attacks

**Threat:** An attacker captures a valid encrypted message and retransmits it later to trigger duplicate processing.

**Attack vector:** Access to the shared volume or UDS traffic capture, followed by replay of recorded bytes.

**Mitigation:**
- Each message carries a unique `id` field (`msg-<uuid>`)
- The receiving broker maintains a dedup set of recently seen message IDs
- Duplicate IDs are rejected at the broker level before decryption
- AES-GCM uses a unique 96-bit IV (nonce) per message — reuse of an IV with the same key would be catastrophic, so the crypto module MUST guarantee IV uniqueness (counter-based or random with collision check)

**Residual risk:** The dedup window is finite. If an attacker replays a message after the dedup window expires, it may be accepted. Mitigation: timestamp validation — reject messages older than a configurable threshold (default: 300 seconds).

**Severity:** LOW with dedup + timestamp validation in place.

---

### T4: Impersonation

**Threat:** A malicious container or process creates a socket file on the shared volume pretending to be another team's broker.

**Attack vector:**
1. Attacker creates `/shared/comms/legitimate-team.sock` before the real team starts
2. Attacker registers in `registry.json` with the legitimate team's name
3. Other teams connect to the attacker's socket, believing it to be the legitimate team

**Mitigation:**
- In v1, **impersonation defense is limited**. All containers share the same PSK, so possession of the PSK does not prove identity — it only proves membership in the set of authorized containers.
- The `from.team` field in the message envelope is self-asserted and NOT cryptographically verified in v1.
- Registry writes are file-locked but not authenticated — any container can write any team name.

**Residual risk:** HIGH. v1 relies on Docker's container isolation and the assumption that only authorized containers mount the shared volume. If an unauthorized container gains volume access, it can impersonate any team.

**v2 mitigation path:** Per-team X25519 keypairs with public keys in the registry. Messages are signed with the sender's private key, and the receiver verifies against the registered public key. This binds identity to a cryptographic key, not just volume access.

**Severity:** HIGH — accepted risk in v1, mitigated by infrastructure trust.

---

### T5: Key Compromise

**Threat:** The pre-shared key is leaked, extracted, or brute-forced.

**Attack vectors:**
1. **Container escape:** Attacker breaks out of a container and reads `/run/secrets/comms-psk` from another container or the host
2. **Volume access:** PSK file is accidentally placed on a shared volume instead of Docker secrets
3. **Log exposure:** PSK is logged in debug output, error messages, or crash dumps
4. **Weak key:** PSK is not generated with sufficient entropy

**Impact of compromise:**
- All confidentiality is lost — attacker can decrypt all past and future messages (no forward secrecy in v1)
- All integrity is lost — attacker can forge valid messages
- All authentication is lost — attacker can impersonate any team

**Mitigation:**
- PSK MUST be 256 bits of cryptographically random data (e.g., `openssl rand -hex 32`)
- PSK is provisioned via Docker secrets (tmpfs mount, not written to disk on host)
- The crypto module MUST NOT log, print, or include the PSK in error messages
- Key rotation: generate a new PSK and restart all containers. There is no online key rotation in v1.

**Residual risk:** No forward secrecy. A recorded ciphertext + later key compromise = full plaintext recovery for all recorded messages. v2's X25519 ephemeral key exchange addresses this.

**Severity:** CRITICAL if compromised. Probability is LOW given Docker secrets isolation.

---

### T6: Registry Poisoning

**Threat:** An attacker modifies `registry.json` to redirect traffic, inject false team entries, or remove legitimate teams.

**Attack vector:** Any process with write access to the shared volume can modify the registry.

**Mitigation:**
- File locking prevents concurrent corruption (but not malicious writes)
- Brokers validate registry entries before connecting: socket file must exist, team name must match expected format
- Stale entry cleanup (heartbeat > 120s) limits the window for phantom entries

**Residual risk:** A malicious writer can continuously poison the registry faster than cleanup runs. v1 accepts this risk under the assumption that only authorized containers have volume access.

**Severity:** MEDIUM — enables impersonation (T4) and denial of service.

---

### T7: Denial of Service

**Threat:** An attacker disrupts communication between teams.

**Attack vectors:**
1. **Socket deletion:** Remove a team's `.sock` file from the shared volume
2. **Socket flooding:** Open many connections to a broker, exhausting file descriptors
3. **Message flooding:** Send a high volume of valid (encrypted) messages to overwhelm a broker
4. **Registry deletion:** Remove or corrupt `registry.json`
5. **Volume fill:** Write large files to the shared volume, exhausting disk space

**Mitigation:**
- Broker should enforce connection limits (max concurrent connections per source)
- Message size limit: reject messages with length prefix > 1 MB
- Rate limiting at the broker level (messages per second per connection)
- Registry cached in memory; broker continues operating with cached registry if file is corrupted

**Residual risk:** DoS is inherently difficult to fully prevent when the attacker has write access to the shared volume. v1 relies on Docker isolation to limit the attack surface.

**Severity:** MEDIUM — disrupts availability but does not compromise confidentiality or integrity.

---

## What v1 Defends Against

| Threat | Defense | Confidence |
|---|---|---|
| Eavesdropping on message content | AES-256-GCM encryption | HIGH |
| Message tampering | GCM authentication tag + SHA-256 checksum | HIGH |
| Replay attacks | Message ID dedup + timestamp validation | MEDIUM |
| Accidental key exposure in logs | Crypto module design (no key logging) | HIGH |
| Weak keys | Enforced 256-bit minimum entropy | HIGH |

## What v1 Does NOT Defend Against

| Threat | Reason | Mitigation Path |
|---|---|---|
| **Impersonation** | Shared PSK provides no per-team identity | v2: per-team X25519 keypairs |
| **Traffic analysis** | Message sizes and timing are observable | Padding + constant-rate heartbeats (future) |
| **Forward secrecy** | PSK compromise reveals all past messages | v2: ephemeral X25519 key exchange |
| **Compromised Docker host** | Host has full access to volumes, secrets, memory | Out of scope — infrastructure trust assumption |
| **Insider threat (authorized container)** | All authorized containers share the PSK | v2: per-team keys + message signing |
| **Key rotation without downtime** | No online key rotation protocol | v2: key versioning + graceful rollover |
| **Side-channel attacks** | Timing attacks on crypto operations | Use constant-time crypto primitives (Node.js `crypto` module) |

---

## Cryptographic Primitive Choices (v1)

| Function | Primitive | Rationale |
|---|---|---|
| Symmetric encryption | AES-256-GCM | NIST-approved AEAD. Built into Node.js `crypto`. 256-bit key matches PSK size. GCM provides authentication + encryption in one pass. |
| Message integrity | SHA-256 (application-layer checksum) | Defense-in-depth: even if GCM tag is somehow bypassed, checksum catches tampering. Standard, fast, no key required. |
| Nonce generation | 96-bit random (crypto.randomBytes) | GCM standard nonce size. Random nonces are safe for message counts well below 2^48 (birthday bound). |
| Key derivation | HKDF-SHA256 | Derive separate encryption and MAC keys from the PSK. Prevents key reuse across different cryptographic operations. |

---

## Assumptions

1. **Docker isolation is intact.** Container boundaries are not bypassed. If an attacker escapes a container, all bets are off.
2. **Shared volume access is limited to authorized containers.** Only containers in the `docker-compose.yml` mount `/shared/comms/`.
3. **Docker secrets are secure.** The PSK at `/run/secrets/comms-psk` is not accessible outside the container.
4. **System clocks are approximately synchronized.** Timestamp validation assumes clocks are within a few seconds of each other (Docker containers share the host clock).
5. **Node.js `crypto` module is correctly implemented.** We rely on OpenSSL via Node.js for all cryptographic operations.

---

## Revision History

| Date | Author | Change |
|---|---|---|
| 2026-03-14 | (*CD:Vigenere*) | Initial v1 threat model |
