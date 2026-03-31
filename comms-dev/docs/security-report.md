# Security Report — Hub/Relay Architecture Threat Analysis

(*CD:Kerckhoffs*)

**Status:** DRAFT — awaiting Vigenere's E2E crypto design for test vector finalization
**Date:** 2026-03-30
**Ref:** PO directive (hub/relay architecture), `threat-model.md`, `crypto-spec.md`

---

## Architecture Being Analysed

```
Team A daemon
    │  mTLS (A→Hub)
    ▼
[ HUB / RELAY ]   ← sees all traffic; routes but cannot read content (if E2E holds)
    │  mTLS (Hub→B)
    ▼
Team B daemon
```

Two layers of security:
- **Layer 1 (Transport):** mTLS between each team and the hub. Hub terminates TLS — it sees plaintext at the TLS layer.
- **Layer 2 (E2E Application Encryption):** Application-layer encryption team A → team B. Hub sees only ciphertext. Vigenere is designing this layer.

The threat model assumes Layer 2 exists and is correct. Findings below cover cases where it fails, is absent, or is insufficient.

---

## Threat Matrix

### HUB-1 — Hub Reads Message Content *(CRITICAL if E2E absent)*

**Attack vector:** Compromised hub terminates mTLS and reads decrypted envelope body before re-encrypting for onward delivery.

**Condition:** This is the **default state** if Layer 2 (E2E encryption) is not implemented or not enforced. Hub terminates Layer 1 TLS and sees plaintext body.

**Impact:** Full message confidentiality loss. Hub can log, modify, or forward all content.

**Mitigation:** Layer 2 E2E encryption (Vigenere's design). Hub must see only `EncryptedPayload`, never plaintext body. Application layer must encrypt before handing to transport.

**Residual risk (with E2E):** Hub sees encrypted payload. Content confidentiality holds if E2E keys are not accessible to hub.

**Severity:** CRITICAL (without E2E) / MITIGATED (with E2E)

---

### HUB-2 — Hub Forges Messages *(HIGH)*

**Attack vector:** Compromised hub injects a message into the delivery pipeline claiming `from.team = "team-a"`, even though no real message came from Team A.

**Sub-cases:**

| Sub-case | Hub capability | Mitigation |
|---|---|---|
| Forge envelope metadata only | Hub can set `from.team`, `to.team`, `id`, `timestamp` in plaintext envelope | AAD binds `from.team` to ciphertext |
| Forge encrypted body | Hub cannot produce valid ciphertext for Team A without Team A's private key | E2E signing with sender key |
| Forge checksum | Hub cannot produce valid HMAC-SHA256 checksum without integrity key | End-to-end HMAC with team-specific keys |

**Gap in current design:** With shared PSK (v1), hub possessing the PSK can forge both the checksum and ciphertext. This is a CRITICAL finding for PSK-based v1 if a hub is introduced.

**With per-team asymmetric keys (v2):** Hub cannot forge ciphertext. Envelope forgery (metadata only) is detectable if `from.team` is in AAD and E2E signature is present.

**Mitigation required:** E2E message signing — sender signs over `{id, from.team, to.team, body_hash}` with sender's private key. Receiver verifies signature before accepting.

**Severity:** CRITICAL (v1 PSK) / HIGH (v2 without signing) / MEDIUM (v2 with signing)

---

### HUB-3 — Hub Redirects Message to Wrong Team *(HIGH)*

**Attack vector:** Compromised hub modifies `to.team` in the envelope, delivering Team A's message to Team C instead of Team B.

**Current AAD:** `message.id + ":" + message.from.team` — does NOT include `to.team`.

**Impact:**
- With symmetric E2E (shared PSK): Team C can decrypt and read the message. Full content disclosure.
- With asymmetric E2E (per-team keys): Team C cannot decrypt (message encrypted to Team B's key). Delivery fails silently — Team A gets no error, message disappears.

**Both outcomes are unacceptable.**

**Mitigation:** Include `to.team` in AAD:
```
AAD = message.id + ":" + message.from.team + ":" + message.to.team
```
Any `to.team` tampering causes decryption failure at the receiver. Sender can detect non-delivery via timeout/ACK absence.

**This is an actionable gap in the current AAD design (crypto-spec.md §AAD Usage).**

**Severity:** HIGH — silent message loss or misdirected content

---

### HUB-4 — Hub Replays Captured Messages *(HIGH)*

**Attack vector:** Hub captures a valid A→B message and re-injects it later (same session or after reconnect). Dedup window may have expired.

**Current dedup:** Message ID dedup in broker. Dedup set scope and persistence not fully specified (in-memory per session?).

**Attack scenarios:**
1. **Inter-session replay:** A→B message captured, hub replays after broker restart (dedup set cleared). Message accepted as fresh.
2. **Cross-team replay:** Message captured on A→B path, replayed on A→C path (different route, different dedup context).
3. **Delayed replay:** Message replayed after timestamp validation window expires (> 300s per threat-model.md).

**Mitigation:**
- Persistent dedup set (survives restarts) with TTL = timestamp validation window (300s)
- Timestamp validation: reject messages older than threshold
- Sequence numbers per tunnel: monotonic counter on each A↔B channel. Out-of-order or repeated sequence numbers rejected.

**Severity:** HIGH — enables duplicate task execution, state divergence between teams

---

### HUB-5 — Hub as Metadata Observer *(MEDIUM — ACCEPTED by PO)*

**Attack vector:** Even with E2E encryption, hub observes all routing metadata:
- `from.team`, `to.team` (plaintext in envelope, required for routing)
- Message sizes (length prefix unencrypted)
- Message timing (inter-arrival times, burst patterns)
- Communication frequency per team pair

**Information leaked even without content:**
- Which teams communicate (relationship graph)
- Communication frequency (workload inference)
- Response latency patterns (team activity inference)
- Message size distribution (content type inference: short = ack/query, long = report/handoff)

**PO Decision (2026-03-30):** ACCEPTED. Hub sees from/to/timestamp/size. No mitigation required for v1/v2.

**Severity:** MEDIUM — **ACCEPTED RISK** (PO directive, no action required)

---

### HUB-6 — Hub Impersonation *(MEDIUM)*

**Attack vector:** Attacker stands up a fake hub with a self-signed certificate, tricks teams into connecting, observing or modifying traffic.

**Current mitigation:** Teams use mTLS with pinned certificates. Hub has its own certificate (CN = hub identity). Teams verify hub cert fingerprint before accepting connection.

**Attack requirement:** Attacker must either (a) compromise hub private key, or (b) trick a team into accepting a different certificate.

**Gap:** Certificate pinning must be enforced client-side. If teams perform `rejectUnauthorized: false` without fingerprint check, impersonation succeeds.

**Current TlsServer implementation:** Does perform fingerprint pinning (`peerFingerprints.get(peerTeam)` check). Hub cert must be pre-distributed to all teams.

**Mitigation:** Hub certificate distributed to all team `peers/` directories at deploy time. `peerFingerprints` check enforced (already in TlsServer). Hub identity = specific CN ("hub" or "comms-hub").

**Severity:** MEDIUM — mitigated by existing cert pinning if correctly deployed

---

### HUB-7 — Hub Single Point of Failure *(HIGH)*

**Attack vector:** Hub process crashes, network partition, or intentional DoS. All cross-team communication fails immediately.

**Blast radius:**
- All inter-team messaging stops
- No team can send or receive until hub recovers
- Messages in flight are lost (no persistent queue at hub level)
- Teams may not detect hub failure immediately

**Current detection:** TunnelManager reconnect loop — detects TCP close. Reconnect attempts with exponential backoff. But: no hub-specific health check, no alert to operator/team-lead.

**Mitigation plan:**
1. **Hub keepalive:** Periodic ping/pong between hub and each team (30s interval). Teams detect hub loss within 60s.
2. **Local send queue:** Messages queued in-process during hub unavailability. Retry on reconnect. Queue bounded (e.g., 100 messages, oldest dropped with warning on overflow).
3. **Failure notification:** On hub loss detection, daemon publishes `{ type: "hub_unavailable" }` to team-lead inbox.
4. **Reconnect backoff:** Existing `reconnectBaseMs` handles reconnect. Max backoff should be capped (e.g., 30s) to bound recovery time.

**Severity:** HIGH — availability impact, no current mitigation for message loss during outage

---

### HUB-8 — Cross-Team Identity Binding Gap *(HIGH)*

**Attack vector:** mTLS verifies Team A's identity to the HUB. But it does not verify Team A's identity to Team B end-to-end. The hub asserts "this came from Team A" — Team B has no cryptographic proof.

**Scenario:** Hub receives message from Team A (mTLS cert = comms-dev). Hub forwards envelope to Team B. Team B's broker sees `from.team = "comms-dev"` in the envelope and the hub's mTLS cert (not Team A's cert). Team B trusts the hub's assertion.

**This means:** Team B's identity verification chain is: Team B trusts Hub, Hub verified Team A. This is transitive trust, not direct cryptographic binding.

**If hub is compromised:** Hub can assert any `from.team` it chooses. Team B has no way to distinguish.

**Mitigation:** End-to-end message signature:
```
sig = Sign(senderPrivateKey, {id, from.team, to.team, body_hash, timestamp})
```
Team B verifies signature using Team A's public key (from registry or pre-distributed). Independent of hub.

**This requires asymmetric keys per team (v2 path).**

**Severity:** HIGH — fundamental gap in hub-based architecture until E2E signing is implemented

---

## PO Decisions (2026-03-30)

| Decision | Detail |
|---|---|
| Metadata leakage (HUB-5) | **ACCEPTED** — hub sees from/to/timestamp/size, no mitigation needed |
| Forward secrecy | **DEFERRED to v3** — static X25519 is acceptable for v2 |
| Peer-to-peer fallback | **REJECTED** — hub is the ONLY routing path; no dual-path or graceful degradation |
| Human endpoints | **NEW REQUIREMENT** — humans are first-class endpoints; design required |

---

## Summary Matrix

| ID | Finding | Severity | Status | Blocker? |
|---|---|---|---|---|
| HUB-1 | Hub reads content (E2E absent) | CRITICAL | Mitigated by v2 E2E crypto | DONE |
| HUB-2 | Hub forges messages | CRITICAL (v1) / MEDIUM (v2+signing) | Mitigated by v2 Ed25519 signing | DONE |
| HUB-3 | Routing redirect (`to.team` not in AAD) | HIGH | Fixed: `to.team` in v2 AAD | DONE |
| HUB-4 | Replay attack (cross-session) | HIGH | Fixed: persistent dedup (Babbage) | DONE |
| HUB-5 | Metadata leakage | MEDIUM | **ACCEPTED by PO** | CLOSED |
| HUB-6 | Hub impersonation | MEDIUM | Mitigated by mTLS cert pinning | DONE |
| HUB-7 | Hub SPOF / availability | HIGH | Fixed: outbound queue + keepalive (Babbage) | DONE |
| HUB-8 | Transitive trust (no E2E identity binding) | HIGH | Fixed by v2 Ed25519 signing | DONE |

---

## Actionable Gaps (No Crypto Design Required)

These can be addressed before Vigenere finalises the E2E design:

### GAP-1: Add `to.team` to AAD (Finding HUB-3)

**Owner:** Vigenere
**Change:** Update `crypto-spec.md` AAD definition:
```
AAD = message.id + ":" + message.from.team + ":" + message.to.team
```
This prevents silent misdirection with no code change to the broker.

### GAP-2: Persistent Dedup Set (Finding HUB-4)

**Owner:** Babbage
**Change:** Dedup set must survive broker restart. Use a bounded LRU with TTL aligned to timestamp validation window. Scope: per `(from.team, to.team)` pair or global.

### GAP-3: Hub Keepalive + Failure Notification (Finding HUB-7)

**Owner:** Babbage
**Change:** 30s ping on each hub tunnel. Failure triggers local queue + team-lead notification.

---

## Test Plan (Pending Vigenere's E2E Design)

Once Vigenere provides the E2E crypto design and test vectors, I will implement:

| Test ID | Scenario | Expected result |
|---|---|---|
| HUB-T01 | Hub modifies `to.team` in envelope | Decryption fails at wrong recipient (if `to.team` in AAD) |
| HUB-T02 | Hub replays message after session restart | Rejected by persistent dedup |
| HUB-T03 | Hub injects message with forged `from.team` | Signature verification fails (v2) |
| HUB-T04 | Hub sends message with zero-byte content (size leak) | Padding normalises sizes — padded to block boundary |
| HUB-T05 | Fake hub presents wrong mTLS cert | Connection rejected by cert fingerprint check |
| HUB-T06 | Hub process killed mid-session | Team detects failure within 60s, messages queued, reconnect on recovery |
| HUB-T07 | Hub drops ACK (causes sender retry) | Receiver deduplicates retried message — inbox has one copy |
| HUB-T08 | Hub delays message 301s (beyond timestamp window) | Rejected as too old |

---

## Residual Risks for v1 Hub Deployment

**Do not deploy hub architecture with v1 PSK-based encryption.**

With shared PSK, a compromised hub has the encryption key and can read, forge, and replay any message. The hub+E2E architecture only provides confidentiality and integrity guarantees if the E2E layer uses per-team asymmetric keys that the hub does not possess.

**Minimum bar for hub deployment:**
1. Per-team asymmetric keys (v2 crypto) — Vigenere
2. `to.team` in AAD — Vigenere
3. Persistent dedup — Babbage
4. Hub keepalive + local queue — Babbage

---

---

## Human Endpoints — Security Analysis (NEW REQUIREMENT, 2026-03-30)

*PO directive (clarified 2026-03-30): Humans are API clients identical to team daemons — same mTLS, same JSON envelope, same E2E crypto, same hub routing. Only distinction: registry `type` field ("team" vs "human"). Hub is source of truth for registry.*

**Threat surface delta from this model: minimal.** Humans using the same protocol and crypto as teams inherit all existing security properties. The protocol requires no new attack surface to analyse. Findings below cover what IS different.

---

### HUM-1 — Human Key Material Storage *(HIGH)*

**Problem:** Agent daemons run in controlled environments (Docker containers) with key files on a protected filesystem. Human clients run on end-user machines — laptops, personal workstations — with different threat exposure.

**Attack scenarios:**
- TLS private key stored as unprotected file → local attacker or malware reads key, impersonates human at mTLS layer
- Ed25519/X25519 keys on disk → same exfiltration risk
- Key backup to cloud sync (iCloud, Dropbox) → inadvertent exposure

**Mitigation (implementation guidance for Lovelace/CLI client):**
| Storage mechanism | Protection | Acceptable |
|---|---|---|
| OS keychain (Keychain, libsecret, Credential Manager) | OS access controls + user auth | Yes |
| Key file with restrictive permissions (chmod 600) | Filesystem ACL | Acceptable minimum |
| Key file encrypted with passphrase | Passphrase + filesystem ACL | Good |
| Unprotected plaintext key file | None | No |
| Hub-managed key | Hub can impersonate human | **BROKEN — violates E2E** |

**Severity:** HIGH — key storage is the only human-specific crypto risk; protocol itself is unchanged

---

### HUM-2 — Key Revocation via Hub Registry *(HIGH)*

**Problem:** Hub registry is now hub-managed state (not shared volume). When a human's key is compromised or they leave the organisation, revocation requires updating the hub registry. Agent teams cache the key bundle — stale cache means they continue accepting signatures from revoked keys.

**Attack:** Human leaves, hub registry updated to remove them. But agent team daemons loaded the key bundle at startup and have not refreshed. They continue accepting signed messages from the revoked key for the duration of their cache TTL.

**Mitigation:**
- Agent daemons must refresh the key bundle periodically (e.g., every 5 minutes) or on hub notification
- Hub can push a `registry_updated` event to all connected daemons to trigger immediate refresh
- For high-severity revocations: hub can refuse to route messages where `from.team` matches a revoked entry, independent of per-team signature verification

**Severity:** HIGH — revocation latency window scales with cache TTL; must be bounded

---

### HUM-3 — Hub Registry as Privileged Single Point of Trust *(HIGH)*

**Problem:** Registry moves from shared volume (content-addressed, readable by all) to hub-managed state. The hub is now the sole authority for who exists, what their public keys are, and what their `type` is.

**Attack:** Compromised hub rewrites registry — adds a fake human entry with attacker-controlled key, or modifies a team's public key so messages encrypt to attacker's key.

**This is a new threat not present in the shared-volume model**, where registry tampering required write access to the shared volume (detectable via filesystem audit).

**Mitigation requirements:**
- Registry mutations must be authenticated (only hub operator or designated admin can write)
- Registry content must be signed at rest — teams can verify registry integrity without trusting the hub's serving layer
- Key bundle changes should require a secondary approval channel (e.g., admin confirmation out-of-band)
- Teams should log and alert on key bundle changes for any existing peer

**Severity:** HIGH — hub registry compromise enables silent MITM against all endpoints

---

### HUM-4 — Human Message Replay *(MEDIUM — existing controls apply)*

Human client sends messages using the same envelope format with `id` (UUID) and `timestamp`. Existing dedup (persistent, TTL-bounded) and timestamp validation window (300s) apply identically.

**No new mechanism required.** Human clients must use fresh UUIDs per message and current timestamps, same as agent daemons.

**Severity:** MEDIUM — covered by existing dedup and timestamp validation

---

### Human Endpoint Summary Matrix

| ID | Finding | Severity | Owner | Status |
|---|---|---|---|---|
| HUM-1 | Human key material storage | HIGH | Lovelace (client) | Design required |
| HUM-2 | Key revocation via hub registry | HIGH | Babbage (hub) + Vigenere (registry spec) | Design required |
| HUM-3 | Hub registry as privileged single point of trust | HIGH | Babbage (hub) + Vigenere (registry spec) | Design required |
| HUM-4 | Human message replay | MEDIUM | None — existing controls apply | COVERED |

**Dropped from earlier draft:** HUM-1 (authentication) — resolved by mTLS (same as teams). HUM-3 (identity model) — resolved by "human = team with type field". Forward secrecy — deferred to v3 per PO.

### Minimum Bar for Human Endpoint Deployment

1. Human key pair generated and stored with OS keychain or equivalent (HUM-1)
2. Key bundle cache TTL bounded and hub-push refresh supported (HUM-2)
3. Hub registry mutations authenticated + registry content signed at rest (HUM-3)
4. Human client passes same E2E encrypt/sign/verify pipeline as agent daemons — no protocol differences

### Test Plan — Human Endpoints

| Test ID | Scenario | Expected result |
|---|---|---|
| HUM-T01 | Human client sends message to agent team | E2E encrypted, Ed25519 signed, delivered to team inbox |
| HUM-T02 | Agent team sends message to human | Delivered to human client inbox, decrypted by human's X25519 key |
| HUM-T03 | Forged message claiming human sender (wrong signing key) | Signature verification fails, message dropped |
| HUM-T04 | Hub registry updated to revoke human key | Agent teams refresh within TTL; stale-cache acceptance window bounded |
| HUM-T05 | Hub registry key substitution attack (hub serves wrong pubkey) | Registry signature check detects tampering |
| HUM-T06 | Human message replayed within dedup window | Dedup rejects duplicate |
| HUM-T07 | Human message replayed outside dedup window (> 300s) | Timestamp validation rejects stale message |

---

*(*CD:Kerckhoffs*)*
