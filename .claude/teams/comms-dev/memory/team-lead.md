# Team Lead Scratchpad

## [CHECKPOINT] 2026-03-20 08:07

### Session Summary
- Pivoted from CF relay (#7/#8) to **cross-team secure messaging** with per-team daemon mesh
- Brainstorm → spec → implementation in one session
- **409 tests passing across 21 files**, all 6 phases complete
- Lovelace joined the team (frontend → CLI/TUI tooling engineer pivot)

### Architecture: Cross-Team Messaging v2

```
Agent → MCP (CrossTeamSend) → Local Daemon → [persistent mTLS tunnel] → Remote Daemon → Recipient Inbox
```

- **Per-team relay daemon** — key holder, ACL enforcer, transport
- **mTLS tunnels** — persistent, encrypted transport (per-team ECDSA P-256 keypair)
- **Plaintext inside tunnel** — no per-message crypto
- **Per-agent ACL** — one-directional, wildcard support, default-deny, SIGHUP hot-reload
- **At-least-once delivery** — ACK per message, retry with exponential backoff, dedup by message ID
- **Trust model** — OS isolation inside container, zero trust between containers
- **Hard invariant** — `from.team === peerCertCN` (close connection on mismatch, no NACK)
- **Key provisioning** — pre-provisioned (.ssh model), daemon is pure consumer
- **UDS control socket** — JSON-over-UDS for send, status, reload, peers commands

### Key Directory Layout
```
/run/secrets/comms/
  daemon.key, daemon.crt
  peers/*.crt
  acl.json
```

### Implementation (6 Phases, TDD)
| Phase | Files | Tests | Author |
|---|---|---|---|
| 1 Crypto | tls-config.ts, acl.ts | 60 | Vigenere |
| 2 Transport | tls-server.ts, tls-client.ts, tunnel-manager.ts | ~47 | Babbage |
| 3 Daemon | daemon-v2.ts | 17 | Babbage |
| 4 MCP tool | cross-team-send.ts + UDS protocol | 16 | Babbage |
| 5.1 CLI | comms-keys.ts | 20 | Lovelace |
| 5.2 CLI | comms-acl.ts | 29 | Lovelace |
| 5.3 CLI | comms-daemon.ts | 19 | Lovelace |
| 6 E2E | cross-team-e2e.test.ts | 9 | Kerckhoffs |

### GitHub Issues
- #13 — Brainstorm decisions (open)
- #14 — Test plan + security matrix (open)
- #15 — Crypto implementation spec (open)
- #16 — Protocol spec (open)
- #17 — CLI tooling spec (open)
- #18 — Implementation plan (open)

### [LEARNED] TLS 1.3 gotchas (from Babbage)
- `rejectUnauthorized: false` skips `checkServerIdentity` — verify fingerprint manually in `secureConnect`
- `server.close(cb)` blocks until all connections close — track + destroy sockets in test helpers
- Client fires `secureConnect` BEFORE server fires `secureConnection` on loopback

### [DEFERRED] Items for v2+
- Per-agent Ed25519 signatures (non-repudiation)
- Online key rotation
- Dynamic peer discovery
- Persistent dedup across daemon restart
- Daemon query interface (beyond UDS)
- Container isolation verification tests
- Clock skew tolerance testing
- Cert rotation workflow

### Agent Status
- vigenere: Phase 1 delivered (tls-config + acl)
- babbage: Phase 2+3+4 delivered (transport + daemon + MCP tool) — session MVP
- kerckhoffs: RED tests for all phases + E2E integration
- lovelace: Phase 5 delivered (all 3 CLI tools), pivoted from frontend to CLI/TUI
