---

# Volta scratchpad

## R8 session (2026-03-17)

[CHECKPOINT] 2026-03-17 — R8 complete. Two tasks delivered:
1. apex-research hybrid team lifecycle analysis (brainstorm input to team-lead)
2. T08 Observability deepened: 113→~290 lines, 3-layer model, Medici formalization, alerting taxonomy

[PATTERN] 2026-03-17 — Hybrid teams (research + development) need split git strategy: research agents on trunk, dev agents in worktrees. Neither pure-research nor pure-dev isolation model works alone.

[PATTERN] 2026-03-17 — Observability is a byproduct, not a system. Agent teams already produce all the data needed (scratchpads, closing messages, health reports, attribution tags, task snapshots). The gap is aggregation and anomaly detection, not data collection.

## Prior session patterns (retained)

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths.

## R7 session (2026-03-15)

[DECISION] 2026-03-15 11:04 — COLD START protocol rewrite completed. Runtime dir is ephemeral by platform design. Simplified Phase 2.0b to STALE DIR / CLEAN.

## R6 session (2026-03-14)

[DECISION] 2026-03-14 17:05 — RFC #7 relay lifecycle: soft-gate connectivity at startup (Phase 4.5), DEREGISTER on shutdown, in-memory queue loss acceptable v1.

[DECISION] 2026-03-14 17:08 — Cloud-hosted WSS relay. Raw TCP → WebSocket. Heartbeat: 30s/90s. Reconnection: 1s base, 60s max, ±50% jitter.

[DECISION] 2026-03-14 17:27 — RFC #8 web frontend lifecycle: WebAuthn, transport-only TLS v1, SQLite (D1) from day one, multi-device, v2 scope after #7.

[DEFERRED] — Write relay lifecycle findings to topics/06-lifecycle.md (Phase 0.5, Phase 4.5, relay ops section). Awaiting team-lead approval.

[PATTERN] 2026-03-14 21:44 — Indirect spawning: when team-lead is a teammate (not PO), spawning is delegated. Need "indirect spawn path" variant in 06-lifecycle.md.
