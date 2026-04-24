---
type: frozen-design-reference
frozen: 2026-04-15 late-eve (end-of-session state)
topic: xireactor-pilot VJS2KB governance + architecture design pass
active-state: memory/team-lead.md
load-when: resuming xireactor pilot evaluation OR ecosystem-integration bundle (#57+#58+#59) work
relocated-from: memory/team-lead.md (2026-04-16 scratchpad prune)
---

# Xireactor Pilot Design State (*FR:team-lead*, frozen 2026-04-15 late-eve)

Frozen record of the 2026-04-15 late-eve design pass that produced 4 docs:

- `docs/xireactor-pilot-host-architecture-2026-04-15.md` v0.6.3 (Brunel)
- `docs/xireactor-pilot-governance-2026-04-15.md` v5 (Monte)
- Herald bridge protocol v1.2 (in scratchpad / inline)
- `docs/xireactor-pilot-migration-assessment-2026-04-15.md` v2 (Cal)

**PO directive 2026-04-16** reframed these as **post-deploy evaluation frameworks**, not preconditions. VJS2KB deployment proceeded same day; this state preserved for re-entry at post-pilot efficacy review OR ecosystem-integration bundle session.

## Core pilot shape

[DECISION] **Strategic asymmetric use.** Protocol A governs intra-tenant writes (cheap gate, frequent); xireactor staging pipeline governs cross-tenant writes (expensive gate, rare). Doubled-coverage collapses because each layer governs a different boundary.

[DECISION] **Four-zone (+shared-write) tenancy model.** Five state values: FR-private, apex-private, FR-owned-shared-read, apex-owned-shared-read, shared-write. Default isolation; shared-read opt-in per-entry; shared-write rare and heavily governed. `co-owned` is the ONLY state staging governs (Monte §3.2.1).

[DECISION] **Three-valued ownership as first-class column.** `owned-by-FR` / `owned-by-apex` / `co-owned`. NOT a two-state model with "both bits set" promotion. Anti-race invariant: `owned_by` never auto-flips; every path into `co-owned` is a deliberate ratified act. Schema invariant: NOT NULL, defaults to submitting librarian's tenant value, NEVER defaults to `co-owned` (Monte v4 §3.6.3).

[DECISION] **Simultaneous-discovery protocol** (Monte §3.6). When both librarians independently discover the same cross-cutting pattern: (1) neither intra-tenant entry auto-promotes, (2) fresh `co-owned` entry filed in shared-write with both originals as sources, (3) Tier 3 routing + bootstrap-preamble cross-review with no proposer/reviewer power asymmetry, (4) both originals get `superseded-by` refs but NOT deleted, (5) **durable disagreement is a valid terminal state**. Filing-first has no advantage over filing-second.

[DECISION] **Ownership-transfer ritual: 4-signature** (2 librarians + 2 team-leads countersign; xireactor operator — not a librarian — flips the field). Separation of decision from execution. PO appropriateness TBD at post-pilot review.

[DECISION] **Three-check authority-drift defense (layered):** (a) ownership-transfer ritual (deliberate grabs), (b) shared-read sunset review (accidental accumulation), (c) audit-independent tenant boundary report (structural blind spots, auditor is neither tenant). Multi-mode failure modes need multi-mechanism defenses.

[DECISION] **Cross-review rides wiki #43 bootstrap-preamble channel.** Xireactor `session_init` surfaces pending cross-reviews to the OTHER tenant's librarian at their wake-time read. New payload class (governance, not continuity) on the same mechanism. Generalizes #43 from intra-team continuity to cross-tenant governance state. Validated in #43 amendment "Validation update — 2026-04-15 (Monte's governance pilot design)" — DESIGN-validated, not DEPLOYMENT-validated; upgrade when pilot ships cross-review items empirically.

[DECISION] **Row-level-only topology (not schema-per-tenant).** Single instance, single DB, RLS via `app.org_id` with three-state ownership column. Monte §7.1.1 self-correction + Brunel §3.2 evidence layer converge independently. Schema-per-tenant rejected: upstream's 21 migrations assume single-schema; forking upstream to test upstream = category-invalid per §1.2.

[DECISION] **Host placement: RC dev server 100.96.54.170, co-located with apex-research.** 3-service footprint ~500 MB baseline on RC (dropped from v0.2's 750 MB after stdio-only collapse). Port 8010 Tailscale-bound (NEVER 0.0.0.0) per host architecture doc. Deploy-day shift: actual port is 8000, not 8010 — updated in `mcp-client-snippets/` post-deploy.

[DECISION] **Stdio-only MCP transport** — upstream mcp HTTP+OAuth container NOT deployed. Consumers launch upstream `server.py` as stdio subprocess. Path back to HTTP+OAuth documented in Brunel v0.6.3 §3.4 (~1-2h operator work to re-enable).

[DECISION] **Upstream discipline: pin `thejeremyhodge/xireactor-brilliant` at a tag.** Do NOT fork. Customization: compose override + bootstrap SQL for tenants + cloudflared ingress + .env template. Opposite of ruth-team (where we own the Dockerfile). If upstream refactors, we bump the tag.

[DECISION] **Two-layer regression defense.** Layer 1 upstream pinning (drift we chose not to adopt); Layer 2 `9999_rls_lint.sql` CI lint (silent upstream regression at tag-bump). Layer 2 makes Layer 1 cheap.

[DECISION] **`audit_role BYPASSRLS` sidecar** (Brunel v0.3). Resolves Monte's §7.1.2 audit-container-read-pattern flag. One-line SQL (`CREATE ROLE audit_role BYPASSRLS`) + `default_transaction_read_only = on` + no write credentials. Structurally cleaner than schema-per-tenant for the audit mount.

[DECISION] **`9000_schema_ext.sql` bootstrap** with 4-point `owned_by` invariant: NOT NULL, `current_setting('app.org_id')` session-context default, three-state CHECK constraint, `co-owned` only via §2.3 or §3.6 path. Anti-ORM-accident move (session-context default, not static literal).

[DECISION] **Tier 3 rejection disposition** (Monte §9.2.1): bounce to proposer, not escalate to receiving librarian. Proposer is only party who can REVISE; escalation-on-low-confidence turns receiver into Tier 4 in all but name (anti-pattern per wiki #42 "Tier 4 as escape hatch").

[DECISION] **Ownership-quorum degradation** (Monte §9.2.2): freeze by default during pilot; provisional-transfer-with-expiry as post-pilot generalization. Degradation cannot RATIFY ownership changes, only delay them (structural anti-drift property).

[DECISION] **File placement: `containers/xireactor-pilot/` at repo root.** Serves two teams; `teams/framework-research/pilots/` would create ownership illusion. Repo-root signals shared cross-team substrate.

## Herald v1.2 three-flow write path

- **Flow A (intra-tenant, ~90% of actual write traffic):** `KnowledgeSubmission` **completely unchanged**, staging disabled, specialists don't see the pilot exists. The "additive-only" shape Cal's verdict requires.
- **Flow B (cross-tenant shared-write):** `CrossReviewProposal` + `CrossReviewVerdict` with `Accept/NeedsRevision/Reject` values, `suggestDurableDisagreement` flag (Monte §3.6.2), `isSimultaneousDiscoverySynthesis` flag (Monte §3.6 auditor-proposed).
- **Flow C (ownership transfer):** 4 typed interfaces (`OwnershipTransferProposal/-Accept/-Countersign×2`) as conventions on xireactor's existing comments table. Zero schema change.

§1.4 added `QualifiedSource.disagreementPeer` field (durable disagreement surfaces both views). §5 mapping table: intra-tenant column almost entirely "preserved" (one reshape: `sources` → `QualifiedSource[]`); cross-tenant column entirely new protocol shape.

## Cal §11.5 prompt edits drafted (not applied)

Cal drafted three prompt edits but did not apply (Scope Restriction: never edit agent prompts or roster.json):

- §11.5.1 pre-classification zone check (between Protocol A numbered list and Dedup Protocol — zone determines which wiki surface dedup searches)
- §11.5.2 bootstrap-path xireactor session_init read (AFTER scratchpad recency pass, fresh WIP context)
- §11.5.3 parallel startup.md Step 5.5

**Team-lead applies after PO confirms asymmetric-slice pilot shape.** Eratosthenes-side symmetric edits routed to Schliemann via tmux-direct — queued, STILL NOT FIRED per active NEXT-SESSION-CHORE in team-lead.md.

Include 2 Monte pattern candidates for Eratosthenes wiki routing (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel).

## Herald Q1/Q2 preconditions — outcome (c)/(c)

- **Q1 per-zone staging enablement: outcome (c).** Finn's digest silent on whether tier-assignment routes on `owned_by` or equivalent. Herald v1.1's "SOFT config only via indirect `(source, role)` encoding" was plausible extrapolation, not digest fact. Line 35 lists tier-assignment inputs as `(change_type, sensitivity, source, role)` — zone/tenant/org_id NOT named. Resolves only via source-code walkthrough of xireactor v0.2.0 — target files `api/services/staging.py` + `api/routers/session_init.py` (or equivalents once mapped).
- **Q2 tenant-scoped session_init: outcome (c), HIGHEST-CONSEQUENCE.** Silent cross-tenant leak breaks wiki #43 bootstrap-preamble channel INVISIBLY (both librarians still see preambles; content is subtly wrong — exact failure mode #43 names). Line 27 (pending Tier 3+ items surface in session_init) doesn't say whether tenant-scoped. Line 29 (`SET LOCAL app.user_id/org_id/role/department per transaction`) establishes per-tenant transaction context exists but doesn't say session_init queries run inside that context. Same walkthrough resolves.
- **Q3 ownership-transfer wire format: DELIVERABLE confirmed.** Zero code change; comment_type tag convention, 4 typed interfaces as conventions on xireactor's existing comments table. Herald v1.1 Flow C implemented this.

Three possible outcomes per Herald §7: (a) both capabilities exist → pilot proceeds; (b) one/both need xireactor enhancements → PILOT HALTS pending PO cost decision on upstream contribution investment; (c) deeper investigation needed (recursive).

§6.5.4 explicit about what does NOT unblock: Brunel's stand-up operational failure is a failure mode not an evaluation; Monte's ratification doesn't create capability; Cal's migration confirmation is orthogonal. **Only source-code read unblocks.**

Monte v3 §7.2 classification still based on retracted evidence (Herald self-retracted SOFT/MEDIUM labels in v1.2), needs future-session rework.

## §10 asymmetric-Tier-3 trajectory — seven-step oscillation (canonical #44 example)

§10 revision history (7 steps):

1. **v0.1 phantom:** flip Tier 3 flag under Monte's default → nothing fires on intra-tenant writes either way → nothing to compare
2. **v0.3 self-rejection** by Brunel (correct self-catch)
3. **v0.4 novel proposal:** deliberately route apex intra-writes through staging (AGAINST Monte §3.2.1 default) → Tier 3 actually fires on apex intra-writes → genuine comparison surface
4. **v0.5 overbroad withdrawal** citing §1.2 upstream-discipline violation (correct outcome, wrong reason — applied only to option (a) schema-column addition, not to option (c) application-layer short-circuit)
5. **v0.6.1 PROPOSED restoration** per team-lead 19:51 narrow-retraction clarification (wrong outcome, good intent)
6. **v0.6.2 over-withdrawal** on option-(a)-only §1.2 grounds (Brunel substrate-specialist authority: ALL three options — including (c) — require schema access to read per-tenant policy)
7. **v0.6.3 re-restoration** as PROPOSED with option (c) explicitly named as §1.2-compliant

**User's decisive correction:** *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."*

The honest state: 7 revisions traded framings without either specialist doing the empirical check — *"does option (c) application-layer pre-filter actually require adding a column to xireactor's schema?"* Neither Brunel nor team-lead read xireactor's source. Whatever version is currently in the doc (v0.6.3 PROPOSED) is the latest point in a speculative oscillation, not a resolved landing.

**§10 §1.2-compliance is itself outcome (c)** — same class as Herald Q1/Q2. Next-session Finn survey scope extended: *"where does xireactor store per-tenant policy, and would adding a per-tenant `staging_policy` flag require a schema change or can it be expressed via existing fields?"*

**Gates on §10 adoption (IF walkthrough resolves compliance favorably):**

1. **Apex consent required.** Eratosthenes + Schliemann must opt in; apex is pilot tenant not test subject. §10 forces apex into a governance mode Cal's verdict has argued is a downgrade for librarian-equipped teams. Route: tmux-direct to Schliemann with the §10 proposal IF PO approves.
2. **PO approval required.** §10 adds a SECOND pilot thesis ("which governance mode fits what team") on top of the first ("does cross-tenant-slice work for librarian-equipped teams"). PO has not seen pilot #2.

**Default if §10 rejected:** pilot runs Monte §3.2.1 symmetric shape — both tenants bypass staging on intra-tenant writes, cross-tenant writes through staging. This is the shape Cal's verdict and Monte §7.5 convergence already support.

**Brunel v0.4 §10.3 risks (preserved regardless of outcome):** 3 confounds named honestly — (1) baseline asymmetry, (2) reviewer-model dominates signal (Tier 3 AI = sonnet-4-6), (3) short window for rare-event detection. Signal is compound, not clean.

## Convergence as first-class section (Monte v5 §7.5)

*"The convergence is itself evidence."* Three specialists (Brunel/substrate, Monte/governance, Cal/discipline) independently reached the asymmetric-cross-tenant-only shape from orthogonal starting questions. *"This convergence was not designed"* — the three questions were structurally independent, which is why the convergence is load-bearing rather than just consistent.

PO-brief lead framing: *"all three architects agree that the full-adoption framing is worse than the asymmetric framing, and they agree for independent reasons."*

Framework-research meta-finding: independent convergence from orthogonal starting questions is evidence the shape is emergent from the problem, not an artifact of one architect's preference. Meta-level wiki candidate at n=1; watch for n=2 next session.

## Monte v4 §0.1 three framing principles (non-negotiable in doc scope)

1. **Isolation is the default, not sharing.**
2. **The `owned_by` invariant** — never auto-flips.
3. **Durable disagreement is a valid terminal state; forced consensus is a failure mode.**

*"The three principles are not negotiated in this document. If the PO or a stakeholder wants to reject any of them, that rejection propagates to mechanism-level rework throughout the pilot."*

## Monte §3.6.3 anti-pattern list (no auto-promote)

- No auto-promote on cross-reference threshold
- No auto-promote on read-count threshold

These are the exact "optimization" surfaces an engineer would reach for first — both would be `owned_by` invariant violations dressed up as features. Named explicitly to close drift paths before someone implements them.

## Cal §6.5 empowerment claim (verbatim)

*"NO per-tenant substrate change — FR's 43 entries stay where they are. Asymmetric adoption ADDS a capability without SUBTRACTING any existing one. This is the core empowerment claim."*

Structural shape: capability added, nothing subtracted, discipline layer preserved. Flow A's unchanged `KnowledgeSubmission` is the technical incarnation.

Cal §7.3: **ownership field is orthogonal to scope field.** scope = who within a tenant reads; ownership = which tenant maintains. Previous shorthand collapsing them was incorrect.

## Cal §6.4 pilot pass/fail criteria (runtime acceptance gate)

- ≥2 cross-tenant submissions
- ≤10% auto-promote error
- ≤1 session escalation latency

## Cal's professional verdict (load-bearing)

*"Filesystem affordances (grep, git blame, dir-as-contract, hand-authored cross-ref prose) are load-bearing for librarian discipline; free enforcement → prompt enforcement is a regression even when prompt enforcement works."*

Per-primitive fate table (Cal v2 §1.1.1): four enforcement primitives (`ttl`, `revisit-by`, `confidence`, `status='disputed'`) each degrade to prompt-enforcement on JSONB substrate. "At n=4 primitives the regression is a quadruple hit, not a single one." **BUT — none of this matters for the asymmetric pilot because FR's 43 entries stay in markdown.**

## Open design questions (carried forward)

**[OPEN] Cross-tenant URGENT-KNOWLEDGE routing authority.** Monte §2.2 gives Cal read-only to apex shared zones. URGENT-KNOWLEDGE is a routing authority (Protocol C payload class). For pilot v1, Herald default: "goes through team-leads as human escalation, not through librarians." Conservative but ugly. Needs follow-up authority-model doc — its own Monte/Herald pass.

**[OPEN] MCP tool availability fallback.** Cal §7.3: when cross-tenant submission fails because MCP tool unavailable, does submission fail closed (clear error) or silently route to authoring tenant (capability preserved, intent lost)? Team-lead + Herald + Cal converged on fail-closed — same shape as URGENT-KNOWLEDGE, matches wiki #42 confidence-floor discipline.

**[OPEN] §9.2 design probes** (deferred to next-session design work):

- Tier 3 rejection format (structured schema from Herald vs free-text)
- Rejection rationale structured-vs-free-text

## Wiki candidates queued from this design pass (routed to Cal)

All stay at n=1, held per Cal's own discipline (n=2 threshold). In Cal's queue:

- `owned_by` anti-race invariant
- Durable disagreement as valid terminal state
- Multi-mode failure modes need multi-mechanism defenses (possible n=2 with Volta's persist/restore)
- Bootstrap-preamble as cross-tenant pending-work channel (absorbed into #43 as amendment, not separate entry)
- Librarian-asymmetry-vs-staging-governance
- Filesystem-contract-to-prompt-contract regression
- Git-blame-as-librarian-primary-tool
- Audit-trail-as-purpose-vs-side-effect (Herald §2.5)
- Brunel §1.2 upstream-discipline + two-layer regression defense (n=1, watch for second instance; "piloting a different artifact than the one under evaluation is category-invalid")
- Degradation-protocols-strictly-weaker (Monte §9.2.2)
- "Ladder vs answer" scoped to scaffolding-proposals
- Specialist-authority norm (reject-team-lead-suggestions-with-stated-reason) — candidate for common-prompt amendment, need n=2

## Specialist gate-2-on-self instances (team-health signal)

Three in one session:

- **Brunel v0.1 → v0.2:** endorsed own Tier 3 OFF/ON in v0.1; folded Monte's asymmetric framing into v0.2 and **rejected own prior recommendation** as "solving a problem Monte's framing dissolves." Team-lead mistakenly endorsed v0.1 without catching incompatibility; Brunel caught first.
- **Herald v1.1 → v1.2:** shipped v1.1 §A with SOFT+MEDIUM precondition classification based on indirect-encoding and RLS-construction inferences; re-read honestly and **retracted both claims** as "plausible extrapolation, not digest fact" with line-level citation (27/29/35). Landed at (c)/(c). Cascade: Monte's §7.2 reclassification built on retracted evidence, needs future-session rework.
- **Brunel v0.5 → v0.6.2 → v0.6.3:** oscillation on §10 (see seven-step trajectory above). Self-catch + later self-uncatch + user correction named the substrate-speculation pattern.

**Absorbed into wiki #44** (pre-fold consistency check specialist-side pattern + integration-not-relay team-lead-side pattern).

**Brunel's specialist-side meta-lesson (verbatim):** *"v0.2 and v0.5's self-rejections were correct precisely when I did my own integration check against Monte's framing; v0.4 and v0.6.1 were wrong precisely when I folded a team-lead endorsement without re-checking against my own prior reasoning. The complementary lesson: team-lead guidance is input to my integration check, not a substitute for it."*

## End of frozen state

**Re-entry point:** when resuming xireactor pilot evaluation after deployment smoke-test A/B/C results are in, OR when evaluating issue #59 pilot readiness, OR when the ecosystem-integration bundle session (#57+#58+#59) fires.

Active state lives in `memory/team-lead.md`. This file is read-only reference.
