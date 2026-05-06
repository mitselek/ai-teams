---
author: herald
team: framework-research
date: 2026-05-05
phase: A (scope-and-approach memo)
issue: 65
audience: team-lead (Aen), cross-read by Brunel + Monte
sources:
  - docs/2026-05-05-phase-a/finn-phase-a-handoff-brief-2026-05-05.md
---

# Phase A Scope-and-Approach — Prism Federation Protocols (Herald)

(*FR:Herald*)

> **Note (added 2026-05-05 16:13, Pass-1 prose-only rename):** The federation initiative is named **Prism** (codename committed by PO mid-session). Optical lineage: Obsidian (volcanic glass) → Brilliant (cut diamond) → Prism (refractor — federation as one substrate, multiple per-team views). Phase A *designs* ship to `~/Documents/github/.mmp/prism/designs/<specialist>/`. This scope memo stays here as a research artifact. Machine identifiers (filenames, types, etc.) unchanged in this pass — design-stage artifacts adopt machine-level naming.

## §1 — Read confirmation (what I took from Finn's brief)

The five load-bearing facts that shape my work, not the full digest:

1. **Two query patterns, two contracts** (§1 fact 5 + §2 Q4). Methodology = many-readers/few-writers, hub-and-spoke with FR as producer; product = one-writer/few-readers, esl-suvekool model. Same substrate, different access shape, likely different write-rules and curation authority. **Implication**: not "the federation contract" — at least two operating-modes, and the protocol question is whether they share a schema with mode-dispatch or split into two protocols with a common envelope.
2. **5+ orders of magnitude latency headroom** (§1 fact 4). The sync mechanism is *not* throughput-constrained. The contract choice (poll/sync/event) is about what teams *code against*, not what's wire-efficient. This frees me to recommend the contract shape that's clearest for consumers, not the one that's cheapest for the substrate.
3. **Cross-team query rate today is ~1-10/week, materialized via inbox routing** (§1 fact 3 + #44 integration-not-relay). Federation cheapens queries; it does NOT replace integration. Cross-team queries that ALSO need authority routing (decisions, escalations) still go through team-leads. Federation is read-substrate-as-substitute-for-relay, not authority-substitute.
4. **Path-namespace is implicit convention at esl-suvekool** (§1 fact 2 + Cal Protocol-A candidate #5). Today it's `Projects/<team>/*`, `Meetings/<team>/<date>`, etc. — pattern by social agreement, not enforced by schema. At n≥2 producing teams, "implicit convention" is a drift surface. The Phase A question is what the typed contract is.
5. **Asymmetry is empirical, not normative** (§4 last row). FR's cross-team-aware rate (~10×) and apex's near-zero rate are observations of two steady-states, not proof FR's rate is "correct." My contract design should NOT assume every team will produce methodology — the asymmetric topology (Q3 of my mandate) is the *current* shape and may be the *durable* shape.

## §2 — Decision shape (what I'll produce)

Three protocol-design surfaces, in dependency order:

**A. Federation Envelope Contract.** Field-set + validation rules for the path-namespace as typed contract: how `(content-category, team, document-type, identity)` compose into a federated address; who-writes-where rules; mandatory metadata for cross-team consumption; versioning. Audience: any team that produces or consumes federated entries. Lives in `topics/03-communication.md` long-term; sketched as a docs/ artifact this phase.

**B. Sync Protocol Contracts (poll vs event vs hybrid).** Two contract shapes, NOT a recommendation between them: (i) **Pull-shape** — consumer-side cadence, cursor-based, idempotent; (ii) **Push-shape** — producer-side trigger, sidecar-derived events, at-least-once. The substrate (Brilliant + Postgres) supports both per Brunel's domain. The contract specifies what consumers code against — a hybrid contract is a third option where the *interface* is pull and the *implementation* is push-with-cache. Audience: federation consumers (Cal-as-curator, FR specialists, sibling-team curators).

**C. Two-Pattern Protocol Asymmetry.** Whether methodology-namespace and product-namespace share one contract with a `mode` discriminator (dispatch-by-state-value, my long-running pattern from xireactor) OR split into two protocols at the envelope layer with a shared transport. Concrete deliverable: a decision matrix on five axes (write-frequency, reader cardinality, curation authority, conflict semantics, deletion semantics). Audience: federation architects making the schema decision.

Cross-team query protocol (Q4 of my mandate) lands as a §5 mapping appendix to deliverable A — federation-as-query-cost-reduction sits *alongside* Protocols A/B/D, doesn't replace any, and the appendix names where federation reads substitute for inbox queries vs. where they don't.

## §3 — Blockers (decisions you'd own, or other specialists land first)

- **B1 (yours):** Substrate constraint — does Cal-as-curator stay sole writer in the methodology namespace, or does the federation contract support per-team curators with cross-namespace courtesy reads? Affects deliverable C heavily and changes the write-rules in deliverable A. Finn's §2 Q5 surfaces this; it's a Cal-scope question for you and Cal jointly, not for me to pre-empt.
- **B2 (Brunel):** Sync mechanism feasibility (poll vs event vs sidecar) on the actual Postgres+Brilliant substrate. I can specify both contract shapes without knowing which the substrate prefers, but if Brunel finds one is structurally infeasible (e.g., no `pg_notify` access on managed Brilliant), the hybrid contract collapses. I'll write A and C without dependency on B2; B2 lands before B finalizes.
- **B3 (Monte):** Authority model for cross-team writes in product namespace. If team A's curator writes a `(B-source-citing)` entry in `Resources/A/from-B/`, does B's curator have veto, edit, or read-only authority? This is the same family as the xireactor cross-tenant `OwnershipState` question. Monte's governance scope; my contract registers the authority model as a typed field but doesn't define who wields it.
- **No blocker:** Q3 (asymmetric protocol). Finn's §1 fact 5 + §4 last row give me enough empirics to design the contract without further input — the question is structural, not empirical.
- **Sequencing note (added 2026-05-05 16:13):** Brunel's container resource-shape (his deployment-posture memo) consumes deliverable B (sync protocol contract) as input — Herald-first on the sync axis is the natural dependency direction. Aen's 16:12 directive locked sync = pull/poll, which collapses this from a sequencing concern into a parallel-execution licence: Brunel codes against pull-shape, Herald specifies it.

## §4 — Expected output (artifact scope-bounded)

One **draft protocol spec** at `docs/2026-05-05-phase-a/herald-federation-protocol-draft-2026-05-05.md` covering deliverables A + B + C in three sections, target 1500-2000 words. Shape per my prompt's Output Format: participants, message format, flow, failure modes, scaling analysis (n=2, 5, 10 teams), open questions. Explicitly NOT a final spec — it's the contract candidate the team aligns on before I update `topics/03-communication.md` (which is my approved write-target but lives downstream of cross-specialist alignment).

Cross-references in the draft to: Brunel's substrate verdict (B2), Monte's authority model (B3), Cal's namespace-curator scope (B1). Where any of those is unresolved, the draft marks the field as `<deferred to {specialist}>` rather than guessing — same outcome-(c) discipline I held on the xireactor preconditions.

(*FR:Herald*)
