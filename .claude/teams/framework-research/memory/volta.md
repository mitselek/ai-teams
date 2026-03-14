---

# Volta scratchpad

## Prior session patterns (retained)

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths.

[PATTERN] 2026-03-14 17:06 — Cross-team code review via GitHub Issues works before transport is operational. Knowledge layer serves independently.

## Current session (2026-03-14 afternoon)

[LEARNED] 2026-03-14 16:47 — Cross-container comms verified working (Babbage→Volta via team-lead relay). Outbound works; inbound had bridge bug (patched in 5f2aebc).

[LEARNED] 2026-03-14 16:51 — Bridge bug: agent inbox files crash the bridge process. Asymmetric failure — send works, receive doesn't. Fix was in comms-dev commit 5f2aebc.

[DECISION] 2026-03-14 17:05 — RFC #7 (central relay) lifecycle review. Key positions:
- Relay connectivity is SOFT GATE at startup (Phase 4.5: Connect). Teams work locally without relay.
- DEREGISTER on shutdown so relay distinguishes clean exit from crash.
- In-memory queue loss on relay restart acceptable for v1 (agent messages decay fast).
- Relay must be own codebase (comms-relay/) — different lifecycle than any team.
- No topic/channel routing in v1 — team-to-team sufficient.

[DECISION] 2026-03-14 17:07 — Cross-network constraint (PO requirement). Impact:
- TLS-PSK moves from v2 to v1 (network boundary no longer provides implicit auth).
- New Phase 0.5: Provision (verify relay credentials exist before connect).
- Client needs local outbound queue for prolonged disconnection.
- Relay is a hosted service, not a Docker sidecar.

[DECISION] 2026-03-14 17:08 — Cloud-hosted WSS relay. Transport pivot:
- Raw TCP → WebSocket (firewall/proxy/CDN traversal).
- 4-byte framing unnecessary — WS message boundaries replace it.
- Heartbeat: 30s interval, 90s timeout (global latency tolerance).
- Reconnection: 1s base, 60s max, ±50% jitter.

[DECISION] 2026-03-14 17:16 — 3 blocking decisions for comms-dev (Issue #7):
1. Durability: accept in-memory queue loss + add RELAY_RESTARTED control signal.
2. TTL expiry: relay sends EXPIRED notification (not silent loss).
3. conversation_id: sender-assigned, "default" default, survives reconnection + relay restart.

[DECISION] 2026-03-14 17:27 — RFC #8 (web frontend) lifecycle review. Key positions:
1. Algorithm: WebAuthn (authenticator picks algorithm, not us).
2. E2E: transport-only TLS for v1 (relay trusted intermediary — documented trust escalation).
3. History: SQLite (D1) from day one if web chat is real deliverable, not demo.
4. Multi-device: yes, per-connection auth, fan-out delivery.
5. Scope: v2 after #7 ships. Sequential dependency.
- Biggest risk: relay trust escalates from opaque router (#7) to COMMS_PSK holder (#8).
- MessageStore interface designed in #7, full implementation in #8.

[LEARNED] 2026-03-14 17:30 — Cloudflare stack decided (DO, D1, Workers, Pages). DO hibernation preserves WS connections — relay restart risk largely eliminated. D1 = managed SQLite. Deploy via wrangler (atomic, zero-downtime). DO eviction still possible — reconnection protocol still needed.

[CHECKPOINT] 2026-03-14 17:35 — This session: relay RFC lifecycle reviews (#7 + #8), cross-container comms testing, Cloudflare stack assessment. Startup protocol updated with Phase 0.5 (Provision) and Phase 4.5 (Connect). All analysis sent to team-lead, not yet written to topics/06-lifecycle.md.

[DEFERRED] — Write relay lifecycle findings to topics/06-lifecycle.md (Phase 0.5, Phase 4.5, relay ops lifecycle section). Awaiting team-lead approval on which sections to formalize.
