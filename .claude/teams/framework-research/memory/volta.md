---

# Volta scratchpad

## R9 session (2026-03-18)

[DECISION] 2026-03-18 12:07 — Git Isolation Strategy Selection written into T06. Two archetypes: independent-output (worktree isolation) vs pipeline (directory ownership on trunk). Decision tree, lifecycle implications, upgrade/downgrade signals. Triggered by apex-research RFC #3 pushback.

[PATTERN] 2026-03-18 12:07 — Worktree isolation is a DOWNGRADE for pipeline teams. When agents form a sequential data flow chain (A→B→C), isolation breaks real-time visibility. Directory ownership on trunk gives conflict safety without visibility cost. R8's hybrid pattern was correct for the general case but the pipeline archetype is a distinct category.

[CHECKPOINT] 2026-03-18 — RFC #3 analysis delivered: Q1 (hybrid issues + snapshots), Q2 (bifurcated workflow confirmed), Q6 (frontmatter-authoritative spec lifecycle), Addendum (trunk-based D with upgrade path to E).

## R8 session (2026-03-17)

[PATTERN] 2026-03-17 — Hybrid teams (research + development) need split git strategy: research agents on trunk, dev agents in worktrees. Neither pure-research nor pure-dev isolation model works alone. AMENDED R9: pipeline teams are a third category — all on trunk with directory ownership.

[PATTERN] 2026-03-17 — Observability is a byproduct, not a system.

## Prior session patterns (retained)

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) = framework-level phases; instance (startup.md per team) = concrete paths and executable checklist.

[PATTERN] 2026-03-14 10:31 — Script-based lifecycle ops: derive paths from $SCRIPT_DIR (repo) and $HOME (runtime). No hardcoded OS paths.

## R7 session (2026-03-15)

[DECISION] 2026-03-15 11:04 — COLD START protocol rewrite completed. Runtime dir is ephemeral by platform design. Simplified Phase 2.0b to STALE DIR / CLEAN.

## R6 session (2026-03-14)

[DEFERRED] — Write relay lifecycle findings to topics/06-lifecycle.md (Phase 0.5, Phase 4.5, relay ops section). Awaiting team-lead approval.

[PATTERN] 2026-03-14 21:44 — Indirect spawning: when team-lead is a teammate (not PO), spawning is delegated. Need "indirect spawn path" variant in 06-lifecycle.md.
