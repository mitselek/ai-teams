---
author: monte
team: framework-research
date: 2026-05-05
phase: A — scope-and-approach (plan-for-design, NOT the design itself)
issue: 65
codename: Prism (PO-ratified 2026-05-05; optical lineage Obsidian → Brilliant → Prism — federation as one substrate, multiple per-team views)
audience: team-lead (Aen) for cross-specialist alignment with Brunel + Herald
artifact-routing: research artifacts (this memo, Finn's brief, dedup census, etc.) STAY in `mitselek-ai-teams/docs/2026-05-05-phase-a/`. Phase A *design* deliverables ship to `mitselek/prism` (Brunel bootstrapping the repo).
sources:
  - docs/2026-05-05-phase-a/finn-phase-a-handoff-brief-2026-05-05.md
  - team-lead session 25 mandate (2026-05-05)
  - feedback_no_fallbacks.md (no fallback chains)
  - docs/xireactor-pilot-governance-2026-04-15.md (precedent: tenancy + ownership invariants)
---

# Phase A — Monte Scope-and-Approach Memo

(*FR:Monte*)

## §1 — Read confirmation: what I took from Finn's brief

Five facts I am inheriting as load-bearing for governance design:

1. **Asymmetric topology is observed, not aspirational.** FR is the methodology hub (~10× cross-team-aware). apex/raamatukoi/screenwerk/esl-suvekool consume; reverse flow ~0. → Governance should be designed FROM this hub-and-spoke shape, not toward an idealized peer-mesh. Symmetric governance is a hypothesis, not a default.
2. **Two query patterns, not one.** Methodology namespace = many-readers/few-writers (FR-as-hub). Product namespace = one-writer/few-readers (esl-suvekool, team-private). → Likely demands asymmetric governance. Treating them as a single contract is a design smell.
3. **One-tenant Brilliant.** Only esl-suvekool populates Brilliant today. FR has no MCP config. → No live federation governance to study. I'm designing forward from the path-namespace primitive, not extracting from production behavior.
4. **5+ orders of magnitude latency headroom.** ~1-10 cross-team events/week vs ~178 ops/s. → Governance can be deliberative (write-block + retry, multi-curator review) without degrading throughput. Time budget is not the constraint; correctness is.
5. **Cal as today's sole writer to FR markdown wiki.** Cal's authority shape (Protocols A/B/C/D, sole-writer invariant) is the precedent I am scaling. → My job is not "design federation curatorship from scratch"; my job is "scale the discipline Cal already enforces, while preserving its preconditions."

Three precedents from session-24/25 I will lean on heavily: xireactor four-zone tenancy (asymmetric default-isolation), `owned_by` first-class invariant (ownership never auto-flips), Protocol D as the canonical inter-tenant submission pattern.

## §2 — Decision shape: design surfaces I'll produce

Three governance surfaces, all targeted at issue #65 phase A. Each has a distinct audience and a distinct decision-class:

**Surface 1 — Curator-role-evolution map.** A bounded comparison of three curator-scope models (per-team-curator-per-team / cluster-wide-single-curator / federation-curators-as-class), evaluated against (a) authority preservation of team-specific curation discipline, (b) failure modes per scope, (c) scaling behavior at 2/5/10 teams. Output: recommendation with explicit rejection of the two non-chosen models and the *reason* each fails. Audience: PO + team-lead.

**Surface 2 — Write-block error-semantics contract.** A typed contract spec for "Tier 3+ write arrives, home curator down" — what the writing agent sees (status code class, retry-after semantics, idempotency-token requirement, timeout shape). Explicit non-design: no fallback-curator chain (per `feedback_no_fallbacks.md`); refuse-not-corrupt is the only path. Audience: Herald (consumes for protocol contract) + Brunel (consumes for substrate timing).

**Surface 3 — Cross-team write authority decision matrix.** DACI-style matrix for "agent on team X writes to entry team Y will also consume": rows = write-class (methodology / product / cross-cutting observation), columns = source-team-curator / target-team-curator / federation-curator-role / no-write-allowed. Plus the asymmetric-governance question: methodology namespace and product namespace get same matrix or different? Audience: Herald + Brunel for contract integration; PO for ownership-transfer ritual scope.

All three surfaces ship as a single composite document (`docs/2026-05-05-phase-a/monte-governance-design-2026-05-05.md`), with §1/§2/§3 corresponding to the three surfaces above plus a §0 shared-assumptions block and §4 open-questions block (PO-scope items + cross-specialist intersections).

## §3 — Blockers (decisions I'd block on)

Routed by ownership; intersections flagged for Aen to align across specialists.

**Aen-mine-to-make (governance-internal):**
- B1. **Curator-role-evolution recommendation** — surface 1's chosen model. I will produce this; team-lead ratifies before I draft Surface 3 (matrix shape depends on it).
- B2. **Asymmetric vs symmetric governance for the two namespace patterns** — methodology and product likely diverge. I will recommend asymmetric in Surface 3 unless Brunel's substrate constraint forces collapse.

**Brunel-blocks-me (substrate decisions I consume):**
- B3. **Federation topology** (hub-and-spoke / peer-mesh / hybrid) — Brunel's call from Finn §2 item 2. My curator-role design depends on this. If hub-and-spoke (likely from Finn §1.3), curator-as-class is the natural shape. If peer-mesh, federation-curator-role becomes load-bearing. → I draft Surface 1 with both branches and lock after Brunel lands.
- B4. **Sync mechanism** (Finn §2 item 3) — affects Surface 2 timing semantics (retry-after value class). I can draft surface 2 with parameterized timing and lock the parameter after Brunel lands.

**Herald-blocks-me (protocol contract intersections):**
- B5. **Protocol shape for inter-tenant write under curator-down** — my Surface 2 produces the *error-semantics* spec; Herald produces the *protocol shape*. I write to Herald's contract. Coordination handshake per common-prompt §Coordination-with-Herald: I send `[COORDINATION]` with proposed error-semantics; Herald confirms integration into Protocol D variant or amendment.
- B6. **Routing for ownership-transfer ratification messages** — if surface 3 introduces federation-level curator role, that role needs a routing addressee. Herald-domain.

**PO-blocks-team (out of phase A scope, flag for PO brief):**
- B7. **Authority for promoting a methodology entry from FR-private to federation-shared** — co-owned-via-ratification (xireactor four-signature analog) or unilateral-source-curator-with-target-curator-veto? I'll recommend in Surface 3 §4 but the actual ratification ritual is a PO-call.

## §4 — Expected output: phase A deliverable, scope-bounded

**Single composite document:** ships to `mitselek/prism/designs/monte-governance-design-2026-05-05.md` (repo bootstrapped 2026-05-05 16:14, root commit `2f26706`; local clone at `~/Documents/github/.mmp/prism`). ~2,500-3,500 words, structured:

- §0 — Shared assumptions (5 inherited from Finn + 3 precedent claims from session-24/25). One-page block.
- §1 — Surface 1: Curator-role-evolution map (comparison + recommendation). ~600 words.
- §2 — Surface 2: Write-block error-semantics contract (typed contract). ~500 words + a small contract table.
- §3 — Surface 3: Cross-team write authority decision matrix (DACI table + asymmetric-governance treatment). ~700 words + DACI table.
- §4 — Open questions and PO-scope items (B7 + any post-draft surfaces).
- §5 — Cross-specialist intersection log (Brunel B3/B4, Herald B5/B6 — what I assumed and where I need confirmation).

**Scope-bound exclusions** (NOT in this deliverable, flagged for follow-up):
- Bootstrap protocol for new team joining federation (post-phase-A).
- Authority-drift detection mechanisms at federation scale (Surface "1.5" — could fold into Surface 1 if word budget permits, otherwise deferred).
- Conflict resolution between curators when both claim authority on the same entry (overlaps with Brunel's `owned_by` invariant — coordinate before drafting).
- T04 topic-file amendment text (post-deliverable; T04 codifies after phase A lands).

**Definition of done:** team-lead has the three surfaces in one place, with Brunel and Herald able to read §2 and §3 against their own deliverables and either confirm integration or surface a contradiction. NOT: a final governance specification ratified across teams.

(*FR:Monte*)
