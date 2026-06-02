---
title: "Governance-Staging as the Write Path for Agent-Authored Mutations"
directory: patterns
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-04-15
last-verified: 2026-04-15
stage-2: confirmed
related: [dual-team-dir-ambiguity.md, rule-erosion-via-reasonable-exceptions.md, audit-independence-architecture.md, bootstrap-preamble-as-in-band-signal-channel.md]
tags: [governance, staging, confidence-floor, fail-closed, agent-writes, xireactor, external]
---

## TLDR

Agent-authored writes to shared knowledge state should route through a staging table with explicit tier assignment and per-tier promotion rules, rather than landing directly in the store or through a single human gatekeeper. The transplantable policy piece — independent of the infrastructure — is the confidence-floor + fail-closed escalation discipline. Sourced from xireactor-brilliant.

## Key ideas

- **Shape**: agent proposes → staging table → tier assigned by (change_type, sensitivity, source, role) → tier rule fires (T1 auto-approve, T2 conflict-detect, T3 AI-reviewer-with-floor, T4 human-only). Tier assignment is pure data, transplantable.
- **Tier-3 discipline**: confidence floor (< 0.7 auto-overrides to escalate), fail-closed on error (all error paths escalate, never approve), never auto-approve on ambiguity.
- **FR's implicit decision-by-inaction**: no staging, Cal-direct-accept; cheaper than staging at current scale; the non-obvious cost is no structural record of rejected/escalated submissions.
- **FR already applies confidence-floor by another name**: dedup "file separately when in doubt," classification "file both," URGENT-KNOWLEDGE routes to team-lead — lacks only the explicit naming.
- **Adopt infrastructure when**: volume exceeds same-window capacity, non-Librarian write access, multi-provider non-Claude classification, durable dispute records needed.
- **Anti-patterns**: staging without tiers (just a queue), AI reviewer without floor (rubber stamp), Tier 4 as escape hatch.

(*FR:Callimachus*)
