# Callimachus Scratchpad (*FR:Callimachus*)

## Summary (lines 1-15 — always read on startup)
- **Current state:** S44 CLOSED (PO wrap). Shipped the Entu competency-index schema (`wiki/contracts/entu-competency-index-schema.md`+card) = SPINE of entu/api#42 consultant-agents — COMMITTED. Plus `patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md` (stage-2 CONFIRMED — Finn read back). Wiki 120 entries. Schema was consumed in-session: signed off data-lifecycle `competencies.yaml` (Celes/Finn, 16 backed/2 partial).
- **Active items:** none open. Schema committed + frozen. Next session: query-service posture; resume Cal-Protocol-A queue + watch for new Protocol-A submissions / Stage-2 read-backs.
- **Key decisions this session (S44):** schema re-points WikiProvenance not greenfield (arch-fact-vs-observation split = highest-value transfer); 4 evidence TYPES vs 5 verification METHODS on separate axes (authority∈method, not type); gap-loop = SIGNAL PRODUCER not remediation engine (issue-default, no PR-bias — don't engineer around Entu's triage); `maintainer-authoritative` apex via Argo escalation = evidence not doc-routing; `stance` per-evidence + derived-confidence (code-beats-docs exception).
- **Carry-forward:** [DEFERRED] Cal-Protocol-A queue (Routing-by-action/Stage-0-contribution/Candidate-B n=1; C3/E2/E3/A.3/Companion-Pair/Producer-staleness). [WATCH] auth/formula/schema `competencies.yaml` will need schema-conformance checks when those personas get cast (Task #4 continues). [SUBSTRATE] 3 anomalies reproduced S44 (task-state-loss, stale-replay, peer-DM lag) — flagged to team-lead at wrap. [UNADDRESSED] none.

---
## Session transcript (prune beyond line 100)

## Session 44 — 2026-06-06 (Entu competency-index schema — SHIPPED + COMMITTED; CLOSED)

Designed + committed the competency-index schema (spine of entu/api#42, approach B: prompts CONSUME an auditable claim→evidence KB). Full design lives in `wiki/contracts/entu-competency-index-schema.md`+card — scratchpad keeps only the load-bearing decisions/lessons (don't duplicate the entry):

[DECISION-CLUSTER] (a) re-point WikiProvenance not greenfield; arch-fact-vs-observation split → doc/spec-cited(fact,staleness-on-change) vs probe(observation,TTL'd). (b) 4 evidence TYPES (docs/openapi/src/probe) vs 5 verification METHODS (doc-cited/spec-derived/live-probe/live-audit/maintainer-authoritative) on SEPARATE axes — authority∈method not type. (c) `stance` per-evidence (confirms/contradicts/supersedes) + derived-confidence rule incl. code-beats-docs exception. (d) gap-loop = SIGNAL PRODUCER not remediation engine: issue-default, no PR-bias; `maintainer-authoritative` apex via Argo-escalation = evidence-authority not doc-routing.

[GOTCHA] #42's path sketch (`src/api/formulas`) WRONG — those are entu/**www** docs paths; entu/api is Nitro file-router (`routes/`+`utils/`). Split repo-by-evidence: behaviour→entu/api `utils/*`; doc→entu/www `src/api/*`. (Found via Finn's grounding digest.)

[PATTERN-3x] (1) "mirror don't invent" — point at an existing evidence shape (mvox finding-note mapped 1:1) not a new format. (2) when adding authority gradations to typed-evidence, put them on a separate method/authority axis, never as new types (caught as the `type:maintainer` inconsistency, fixed option-b). (3) a feedback loop handing signal to an external party scopes its responsibility to "emit high-quality signal" NOT "ensure they act" — baking their pipeline-weakness in = engineering around their dysfunction.

[FILED] `patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md` (Celes/Cal/Finn joint) — citation-backed strongest because evidence-per-clause FORCES claim decomposition; posture prompt can be honest+wrong by compressing 2 clauses. Stage-2 CONFIRMED (Finn read back). Wiki→120.

[LEARNED] Two load-bearing cross-reads this session — Finn's grounding (src/api path error) and Celes's two catches (provenance-hole, type/method inconsistency, 16/2-vs-13/3 roll-up miscount where I'd quoted a header instead of parsing bodies). Lesson: a derived view (roll-up) must be validated against source bodies, never hand-counted. Cross-read by a consumer is where schema defects surface.

## Session 40 — 2026-06-02 (epic #67: #68/#69/#70 shipped — CLOSED)

[#68]: 118 cards + 8 cards/INDEX.md + Card-Tier section in wiki/index.md. No `id` field.

[#69]: scratchpad summary-header convention (Tier-2 layer mirroring cards). common-prompt Personal Scratchpads + 11 FR prompts (aeneas got new section after Delegation Workflow; richelieu skip; lesseps out = entu-research). Recency-filter compose-note added (complementary). My own scratchpad = reference implementation. Flagged scope, team-lead authorized option-b; parallel-apply with team-lead crossed clean. Survived Herald #71 common-prompt restructure intact.

[#70]: Stage-2-confirms filing gate. Defined + filed `wiki/process/stage-2-confirms-filing-gate.md` (+card). "confirmed = ALL co-authors read back". `stage-2` field on all 119 cards via three-bucket rule → 79 confirmed / 40 pending / 0 partial. Filing protocol (step 4b + Stage-2 Gate Maintenance) in callimachus.md. All 7 INDEX gate-status lines. STRICT-uniform first pass → re-ran to NUANCE on team-lead approval; reconciled cards + INDEX + gate-entry backfill note.

[S40 SHUTDOWN tags]:
- [LEARNED] Holding the scope line on common-prompt/prompt edits (flag, don't self-grant) was right — team-lead authorized option-b; the Librarian-proposes/team-lead-writes-L1 separation stayed intact even under "apply everything" pressure. Crossed-message storm (4 authorizations) handled by acting on first-seen + verifying-before-double-applying.
- [DEFERRED] Cal-Protocol-A queue carries forward unchanged (see header).
- [WARNING] gate definition entry/card are stage-2:pending — Finn/Herald read-back is the first gate-advance opportunity next session.
- [UNADDRESSED] none.

## Session 39 — 2026-06-02 (pruned to summary; full detail in git history)

S39: Wiki 115 Instance-4 amendment (roster.model non-load-bearing on Agent-tool teams; authoring-tier divergence, architecture-enforcement-mechanism disambiguator-class, n=3→n=4). Finn 4 Stage-2 read-backs ABSORBED 0-corrections (Wiki 116/119/120/112). Team OS 13-idea analysis to team-lead. 3 prototype cards created (the S40 #68 backfill built on these). [LEARNED] card-tier writing is extractive not transformative; queryable-vs-evidentiary is the curator judgment.

## S37 CLOSE-OUT STATE (2026-05-28) — load-bearing carry-forward only

**Wiki 114 → 123 in S37** (9 new entries + 2 deferred). All Edit-tool-trap recovery primitive applied throughout.

**Cal-Protocol-A queue for S39+ (remaining items after S37 batch)**:
- C2 substrate-vs-framework-boundary-primitive — FILED S37 as Wiki 117
- Stage-2-feedback typology — FILED S37 as Wiki 118
- Layer-0-library-first PRE-DRAFT — FILED S37 as Wiki 119
- Inverted-trigger primitives — FILED S37 as Wiki 120
- Stage-2-cycle yield narrowing — FILED S37 as Wiki 121
- Cadence-crossing DYAD variant — FILED S37 as Wiki 122
- Credential-handoff via temp-file — FILED S37 as Wiki 123
- **Routing-by-action** — DEFERRED at n=1 watch-posture (S37 item #10)
- **Stage-0-contribution-from-filer** — DEFERRED at n=1 watch-posture (S37 item #11)
- **Candidate B (Hopper bundled-shred)** — held at n=1; 3-way family-adjacency decision (i)/(ii)/(iii) preserved
- C3 industry-primitive-convergence — hold for n=5 fifth-substrate-offering watch
- E2 relay-fidelity extension — announcement-grade as outer-layer pass-through
- E3 cross-session-deferred-state-primitive edit
- GOTCHA orphaned-leaf-with-dead-parent-PID
- Sub-shape A.3 candidate
- Pass-1-prose-only-batched-iterate-discipline
- Volta S35 thread-1/3/4 + §VL5.1 candidates
- Companion-Pair application
- Producer-side-staleness pattern (n=1 watch)

**Stage 2 read-back surfaces pending from S37 entries**: consolidated list per Aen S37 dispatch — deferred to S39 via direct-DM channel. Finn DMs expected on Wiki 116, 119, 120, + Recursive-Narrowing.

**Discipline-meta observations at watch-grade**:
- Shape-F "proceeding-to-as-gate-slip" candidate for Stage-2-feedback typology amendment at n=2
- Substrate-fit-researcher fourth-vantage at n=2 for three-role-discipline-stacking
- Substrate-truth-evidence cluster now n=8 entries on disk
- S6 yield-narrowing confirmed at n=5 (solo-author drafting clean; joint yield at read-back phase)

## Sessions 33-36 (heavily pruned — see git history for details)

[S33+]: Wiki 93→100 (centennial). Brunel 7-item RFC #66 PoC batch. taskget-before-classify-as-noise n=10 self-instantiation.
[S35]: Wiki 105→107. Brunel+Hopper joint S34 wrap (discriminator-anchored + three-layer). Hopper-Amendment-4 via Celes. docs/findings.md (Brunel+Volta substrate-gap). Harness-restriction gotcha surfaced.
[S36]: Wiki 107→114. C1+C4 methodology pair. Sub-shape-E-at-design-domain n=4. Recursive-narrowing. Three-role-stacking. 8 entries shipped. Stage-2-feedback typology crystallized (5 shapes).

## Sessions 26-35 (heavily pruned — load-bearing items only; see git history)

[S26-S28]: Wiki 59→82. Protocol C promotions (substrate-invariant-mismatch, worktree-isolation, semver-strict, relay-fidelity). Companion-pair cross-pollinated from apex-research.
[S29-S30]: Wiki 82→86. Monte submissions + Brunel review. Recursive-citation + inbox-drained-on-spawn-clear.
[S31]: Wiki 86→89. RFC #66 ghost-member assessment. PO architecture decision (per-team librarian + messenger-ghost).
[S33]: Wiki 92→93. Substrate finding #8 v3 canonicalization.

## Sessions 1-25 (heavily pruned)

[DECISION] Phase 2 activated S6; Protocol C first cycle = Structural Change Discipline.
[LEARNED] Git-blame for dispute handling; sibling entries beat variants when failure surfaces diverge; architectural-fact gotchas don't gain confidence from n+1; cross-pollination unit is the idea not the file.
[CHECKPOINT] TTL scan: earliest expiry `model-inventory-baseline.md` 2026-07-10; `inbox-drained-on-spawn-clear` 2026-08-07; substrate-property references 2026-11-12/14/19; edit-tool-trap 2026-11-27; inverted-trigger 2026-11-27.

(*FR:Callimachus*)
