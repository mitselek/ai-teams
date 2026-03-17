---

# Volta scratchpad

## Current session (2026-03-17 R8)

[WIP] 2026-03-17 10:31 — apex-research lifecycle analysis delivered to team-lead. Hybrid team pattern: research agents on trunk, dev agents in worktrees. Dual-runtime (Python + Node.js) Phase 0 validation. Spec handoff state machine (DRAFT→REVIEWED→APPROVED→ASSIGNED→REVISION_NEEDED). 4 open questions sent.

[WIP] 2026-03-17 14:32 — T08 Observability deepened. Added: 3-layer model (session/cross-session/cross-team), Medici audit formalization, stuck detection, regression detection, stale state detection, context loss detection, dashboard as observability tool, PO alerting taxonomy, observability data lifecycle. Preserved Finn's R6 patterns section intact.

## Prior session patterns (retained)

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths.

[PATTERN] 2026-03-14 17:06 — Cross-team code review via GitHub Issues works before transport is operational. Knowledge layer serves independently.

## R7 session (2026-03-15)

[DECISION] 2026-03-15 11:04 — COLD START protocol rewrite completed. Runtime dir is ephemeral by platform design. Removed: WARM RESTART/COLD START/PARTIAL STATE terminology, Anomaly Detection section, Shutdown Phase 5. Simplified Phase 2.0b to STALE DIR / CLEAN.

## R6 session (2026-03-14)

[DECISION] 2026-03-14 17:05 — RFC #7 relay lifecycle: soft-gate connectivity at startup (Phase 4.5), DEREGISTER on shutdown, in-memory queue loss acceptable v1, relay in own codebase (comms-relay/).

[DECISION] 2026-03-14 17:08 — Cloud-hosted WSS relay. Raw TCP → WebSocket. Heartbeat: 30s/90s. Reconnection: 1s base, 60s max, ±50% jitter.

[DECISION] 2026-03-14 17:27 — RFC #8 web frontend lifecycle: WebAuthn, transport-only TLS v1, SQLite (D1) from day one, multi-device, v2 scope after #7.

[DEFERRED] — Write relay lifecycle findings to topics/06-lifecycle.md (Phase 0.5, Phase 4.5, relay ops section). Awaiting team-lead approval on which sections to formalize.

[PATTERN] 2026-03-14 21:44 — Indirect spawning: when team-lead is a teammate (not PO), spawning is delegated. Need "indirect spawn path" variant in 06-lifecycle.md.

[GOTCHA] 2026-03-14 — Platform moved Windows→Linux. All hardcoded paths replaced. Scripts are platform-independent via $SCRIPT_DIR and $HOME.
