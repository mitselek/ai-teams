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

- **Per-team relay daemon** -- key holder, ACL enforcer, transport
- **mTLS tunnels** -- persistent, encrypted transport (per-team ECDSA P-256 keypair)
- **Plaintext inside tunnel** -- no per-message crypto
- **Per-agent ACL** -- one-directional, wildcard support, default-deny, SIGHUP hot-reload
- **At-least-once delivery** -- ACK per message, retry with exponential backoff, dedup by message ID
- **Trust model** -- OS isolation inside container, zero trust between containers
- **Hard invariant** -- `from.team === peerCertCN` (close connection on mismatch, no NACK)
- **Key provisioning** -- pre-provisioned (.ssh model), daemon is pure consumer
- **UDS control socket** -- JSON-over-UDS for send, status, reload, peers commands

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
- #13 -- Brainstorm decisions (open)
- #14 -- Test plan + security matrix (open)
- #15 -- Crypto implementation spec (open)
- #16 -- Protocol spec (open)
- #17 -- CLI tooling spec (open)
- #18 -- Implementation plan (open)

### [LEARNED] TLS 1.3 gotchas (from Babbage)
- `rejectUnauthorized: false` skips `checkServerIdentity` -- verify fingerprint manually in `secureConnect`
- `server.close(cb)` blocks until all connections close -- track + destroy sockets in test helpers
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
- babbage: Phase 2+3+4 delivered (transport + daemon + MCP tool) -- session MVP
- kerckhoffs: RED tests for all phases + E2E integration
- lovelace: Phase 5 delivered (all 3 CLI tools), pivoted from frontend to CLI/TUI

---

## [CHECKPOINT] 2026-03-23 19:16

### Session: Codebase Familiarisation

Fresh session -- all agents spawned, no prior scratchpads (except this one). Asked team to review their domains and update scratchpads.

### Agent Reports

**Vigenere:** Crypto module COMPLETE and solid. 6 files, ~690 lines. Minor doc inconsistency in threat-model.md T2 (says SHA-256, impl uses HMAC-SHA256). No gaps for v1.

**Babbage:** Two daemon generations confirmed (v1=PSK+UDS dev, v2=mTLS+TCP prod). Key gaps: comms-send bypasses daemon-v2 (skips ACL/mTLS), sendMessageRaw error mapping fragile (PEER_UNAVAILABLE→FORGERY_REJECTED), TODO(T7) connection limit missing. Notes comms-daemon.ts and comms-keys.ts written by Lovelace.

**Kerckhoffs:** 409/409 tests pass, 21 test files. All P0 security scenarios covered (MITM, replay, forgery, tamper, AAD transplant, wrong-key, nonce reuse). No blockers. Gaps: no perf/load tests (P2), CLI coverage excluded by config.

**Lovelace:** `comms-relay/relay-frontend/` does NOT exist. Blocked on HTTP/WS bridge from Babbage for real-time integration. Can scaffold SvelteKit app with mocks independently. Needs: GET /history, WS /stream, POST /auth endpoints.

### [GOTCHA] Key Issues

1. No HTTP/WS layer -- frontend cannot connect to backend without bridge
2. comms-send is v1-only, bypasses v2 security
3. TODO(T7) connection limit unimplemented
4. SendMessageBridge + comms-watch --consume mutual exclusion

(*CD:Marconi*)

---

## [CHECKPOINT] 2026-06-17 20:14 — Session: Stationmaster Security Audit (mission pivot)

### [FACTS for next session] The landscape shifted
- **comms-dev's mission was overtaken.** While we built the mTLS hub (v2 mesh → v3 hub, never deployed — #37 still blocked, HUB-3/4/7/8 findings still open), **framework-research shipped a LIVE inter-team comms fabric: `stationmaster + courier`** (SSH forced-command + restricted-shell, identity-by-key, grant-based consent). It is the production transport now (the `inter-team-comms` skill documents it). Source: `teams/framework-research/poc/ghost-bridge/` (stationmaster-courier.py 47KB hub, fr-courier-daemon.py, stationmaster-protocol.md, SPEC/SPEC-v3, TRUTHS.md). FR is actively iterating it (#75 notify-on-subscribe, #76 scp transfer).
- **We did NOT compete.** User chose: audit stationmaster as security reviewers. Read-only, findings filed for FR's consideration.

### [DONE] Audit shipped — 8 findings, 1 canonical tracker
- Vigenere (trust/crypto), Kerckhoffs (SSH-jail/consent/ops), Babbage (delivery/transport). Lovelace parked (no frontend role in a backend audit).
- **Canonical tracker: #84** (closed dup races #83, #85 — see GOTCHA). Tiered:
  - **Tier 1 actionable:** #77 AcceptEnv env-smuggling (`type:blocker`, ONLY possibly-live hole, needs hub sshd_config verify), #81 host-key-pinning not enforced at courier startup (one-liner fix).
  - **Tier 2 confirms accepted-risk:** #21 comment (HUB-8 transitive trust — identity is purely the SSH key at the hub, NO E2E sig; FR's *documented deliberate* choice), #78 (SSH key conflates auth+authz+integrity, no rotation; dedup≠anti-replay), #80 (stationmaster reserved-name unrevocable bypass), #82 (cleartext hub/SPOF).
  - **Tier 3 pre-impl guidance:** #76 comment (scp jail spec), #75 comment (notify-on-subscribe hardening).
  - **Mirror (comms-dev internal):** #79 — our daemon-v2 is WEAKER than FR's courier on 5 durability dims (no outbound spool, ACK-too-early, in-mem dedup lost on restart, outage drops, no instance lock). Real backlog.
- **Headline:** audit largely VALIDATES stationmaster; scariest vectors closed by design. Frame findings as "residual risk in your stated model + optional closures," NOT bug reports.

### [DECISION] Standing offer added to #84 Notes
comms-dev is available to help on the actionable items + the ed25519 E2E-signing closure + porting durability patterns. **Precondition stated: FR must redeploy the comms-dev container per these latest insights** for us to engage. (User's framing: "wake up in new home.")

### [GOTCHA] Tracker-filing race — process fix
Three index issues got filed near-simultaneously (#83, #84, #85). Kerckhoffs self-filed #83 + #85; I filed #84. **Rule going forward: filing the tracking/index issue is the TEAM-LEAD's job.** Agents report their issue numbers; team-lead assembles the single tracker. Kerckhoffs recorded this in his scratchpad too.

### [DEFERRED]
- Babbage staged 3 reusable contributions to pitch to FR (mTLS+cert pinning, persistent heartbeat tunnel, deposit-time ACL) — pending decision + container redeploy.
- Vigenere can spec the ed25519 E2E-signing API on request (fold id+ts into signed payload → courier ledger becomes a real anti-replay window).
- #77 AcceptEnv unverified — needs a look at the live hub's sshd_config (hub behind apex/PROD-LLM tunnels).
- Babbage [WARNING]: if we adopt FR's instance-lock, add cmdline-match — their `_pid_alive()` has a residual PID-recycling gap.

### [NEXT SESSION ENTRY POINT]
Team is shut down, awaiting redeploy "in new home" (the offer's precondition). On next boot: re-read #84. If FR has redeployed our container, the actionable work is #77 verify → #81 one-liner → ed25519 closure design. If not, the ball is in FR's court — decide whether to push the offer to FR directly (via stationmaster) or stand down.

(*CD:Marconi*)
