# Vigenere Scratchpad (*CD:Vigenere*)

## [CHECKPOINT] Session 2026-03-19

### Completed This Session

- Assessed WireGuard mesh vs. Cloudflare relay (crypto perspective) — recommended against mesh
- Assessed capability-based selective sharing model — designed full crypto spec (later superseded)
- Brainstormed cross-team messaging crypto: per-agent keypairs, signing, ACL, tunnel design
- Published #15: mTLS config + ACL evaluation crypto implementation spec
- Cross-reviewed #16 (Babbage's protocol spec) — found fingerprint vs. DER discrepancy, resolved
- Implemented `src/crypto/tls-config.ts` — TLS config loading, fingerprint verification, sender identity validation
- Implemented `src/crypto/acl.ts` — ACL parsing, wildcard matching, default-deny, hot-reload via SIGHUP
- Phase 1 GREEN (57 tests), all 6 phases completed (409/409 green)

### Key Crypto Decisions (v2 — Cross-Team Messaging)

[DECISION] **mTLS tunnel model** (supersedes v1 PSK + relay model):
- Per-team ECDSA P-256 keypair + self-signed cert for mTLS
- TLS 1.3 only, mutual authentication, certificate fingerprint pinning
- Pre-provisioned certs (no TOFU, no key generation at runtime)
- Encrypted tunnel, NOT encrypted content — mTLS handles transport security

[DECISION] **No per-agent signatures in v1:**
- Trust OS process isolation inside container (SSH-agent model)
- mTLS authenticates daemon-to-daemon; daemon attests agent identity
- Per-agent Ed25519 signatures deferred to v2 if needed

[DECISION] **from.team === peerCertCN hard invariant:**
- Receiving daemon MUST validate from.team matches mTLS peer cert CN
- Mismatch = close connection immediately, no NACK, log WARNING
- First check before ACL, dedup, or delivery

[DECISION] **Per-agent ACL, default-deny:**
- Per-agent `allowed_to` / `allowed_from` lists
- Wildcard `*@team` supported, `*@*` NOT supported
- Enforced on both sender (outbound) and receiver (inbound)
- Hot-reload via SIGHUP, fail-safe (keep old ACL on parse error)

[DECISION] **Key directory layout:**
```
/run/secrets/comms/
  daemon.key, daemon.crt, acl.json, peers/*.crt
```

### Files I Own

| File | Purpose |
|---|---|
| `src/crypto/tls-config.ts` | TLS config loading, fingerprint verification, sender identity validation |
| `src/crypto/acl.ts` | ACL parsing, wildcard matching, isAllowed(), createAclManager() |
| `src/crypto/crypto.ts` | AES-256-GCM, HKDF, HMAC (v1, still available) |
| `src/crypto/types.ts` | Crypto type definitions (v1) |
| `src/crypto/provider.ts` | CryptoProvider adapter (v1) |

### GitHub Issues

- #15: mTLS config + ACL evaluation spec (mine, 3 update comments posted)
- #16: Cross-team protocol spec (Babbage, reviewed + commented)
- #13: Brainstorm decisions
- #18: Implementation plan

### Obsoleted

- `comms-dev/docs/sharing-crypto-spec.md` — superseded by cross-team messaging model, should be deleted
- v1 relay/PSK decisions from session 2026-03-14 — superseded by mTLS model

### v2+ Crypto Upgrade Path

[DEFERRED] Per-agent Ed25519 signing for non-repudiation
[DEFERRED] Forward secrecy enhancement beyond TLS 1.3 (application-layer)
[DEFERRED] Online key/cert rotation without daemon restart
[DEFERRED] Dynamic peer discovery (currently all peers pre-provisioned)
