# Callimachus Scratchpad (*FR:Callimachus*)

## Summary (lines 1-15 — always read on startup)
- **Current state:** S44. Task #2 (Entu competency-index schema, SPINE for entu/api#42) COMPLETE + GROUNDED + PO-EXTENDED. `wiki/contracts/entu-competency-index-schema.md` (+card). v1=schema; reconciled §3 ref-formats vs Finn digest; PO-approved v2 extension folded: 5-rung method ladder (§2a: +live-audit, +maintainer-authoritative apex), §2b Argo escalation-records-back path, §3a `stance` field (confirms/contradicts/supersedes) + deterministic derived-confidence rule. Handed all to Celes for arch-doc §1. Query-service posture.
- **Active items:** NONE open on Task #2 (contract + card commit-ready; type:maintainer→method resolved). Protocol-A pattern `citation-backed-beats-posture-backed-when-fact-is-subtle.md` (Celes/Cal/Finn joint): gate now **stage-2:PARTIAL** (Celes read back 0-corrections + added §48 stance-tie; advances to confirmed on **Finn** read-back). Wiki 119→120 (patterns 82→83). Watching for Finn's read-back. (Possible follow-up: team-lead may send Finn's 15:47 method→count distribution to cite verbatim.)
- **Key decisions this session:** no `id` on cards (filename is key); #69 summary-header = Tier-2 scratchpad layer (mirrors cards), recency-filter complementary; #70 Stage-2 gate "confirmed = ALL co-authors read back" not majority; three-bucket backfill (single-source + substrate-verified-reference + documented-joint = confirmed; multi-author-no-readback = pending) → 79 confirmed / 40 pending; held scope line (flagged common-prompt/prompt edits, didn't self-grant — team-lead authorized option-b).
- **Carry-forward:** [DEFERRED] Cal-Protocol-A queue (Routing-by-action/Stage-0-contribution/Candidate-B n=1; C3/E2/E3/A.3/Companion-Pair/Producer-staleness); Stage-2 read-backs pending Hopper/Volta/Brunel/Herald on older joint entries (those cards are stage-2:pending — advance when read-backs land). [WARNING] gate definition entry + card are stage-2:pending (Finn/Herald haven't read the #70 naming back) — first new gate-advance opportunity next session. [UNADDRESSED] none.

---
## Session transcript (prune beyond line 100)

## Session 44 — 2026-06-06 (Task #2: Entu competency-index schema — the SPINE)

Spawned for a DESIGN contribution (not query-service): design the competency-index schema for Entu's product-native consultant agents (entu/api#42). PO chose index-as-spine (approach B): prompts CONSUME an auditable claim→evidence KB, don't embed.

[DECISION] Atomic unit = a **claim** (verifiable assertion, never "I know about X") + `evidence[]` of `{type: docs|openapi|src|probe, ref, excerpt?}` + `verification {method: doc-cited/spec-derived/live-probe, date, verifier}` + `confidence {backed/partial/unverified}` + `domain {data-lifecycle/auth/formula/schema}`. Filed `wiki/contracts/entu-competency-index-schema.md`.

[PATTERN] Key leverage delivered as briefed: schema **re-points WikiProvenance** (my own frontmatter) not reinvents — full parallel map in §3. The architectural-fact-vs-observation split maps onto doc/spec-cited (fact-like, staleness-on-change) vs probe (observation, TTL-guarded). TTL-for-external-knowledge reuses verbatim. `confidence`→deterministic runtime label (function of evidence, NOT self-assessment = #42's "trust is auditable"). On disk: one-claim-per-file sharded by domain (diffable/PR-able/auditable-before-hiring). Query surface `search_claims`/`get_claim` (arch-docs-MCP style). Wired to topic-10 three-way taxonomy = citation-backed row (only one needing runtime gap-loop).

[DONE] §3 GROUNDED via Finn's digest (`docs/2026-06-06-entu-consultant-grounding-digest.md`). Corrections: `src`→entu/api Nitro file-router (`utils/*.js`, `routes/[db]/...`) NOT `src/api/*` (that's entu/www DOCS — #42's path sketch was wrong); `docs`→`entu/www: src/api/*#anchor` or `PR #N`; `openapi`→live `https://api.entu.app/openapi` tag+op; `probe`→`mvox-dev: docs/migration/findings/<note>`. mvox finding-note shape maps 1:1 onto a claim (`## Question`→claim, probe-script/result-JSON/ratified-commit→evidence.ref, STEP|OP|RESULT row→excerpt). Added 3 real doc↔code discrepancies as worked examples (JWT 12h/48h `[GAP]`; S3-cleanup `src`>`openapi`; `_sharing` two-clause create-escalation-vs-no-post-propagation dispute). Cross-credited Finn in source-agents. Relayed grounded §3 to Celes; reported seam-closed to team-lead. Schema confidence medium→medium-high.

[GOTCHA] #42's own path sketch (`src/api/formulas` etc.) was WRONG — those are entu/**www** VitePress docs paths, not entu/api code. entu/api is a Nitro/h3 file-router (`routes/` + `utils/`). Any future Entu-citing work must split repo-by-evidence-type: behaviour→entu/api `utils/*`; documented contract→entu/www `src/api/*`.

[DECISION] PO-approved schema v2 extension (S44 directive): (a) 5-rung method ladder — doc-cited/spec-derived/live-probe/**live-audit**/**maintainer-authoritative**, ordered by authority; live-audit=probe-over-real-prod-data (prevalence claims, NOT a new type — still type:probe); maintainer-authoritative=APEX (Argo direct answer outranks all). (b) §2b Argo escalation-records-back: gap-loop is 3-rung PR→issue→escalate-to-Argo; Argo's answer recorded as apex evidence → claim apex-backed for whole pool. Strongest form of #42 "Argo gets prioritized signal." (c) §3a `stance` (confirms/contradicts/supersedes) per evidence + derived-confidence rule: apex-override / supersede-drop / equal-rank-deadlock→disputed+[GAP] / **code-beats-docs exception** (src-confirm vs docs-contradict = claim holds, docs is gap-target). JWT 12h/48h = canonical apex/escalate (code-vs-code deadlock); S3-delete + date-format = code-beats-docs. Re-points WikiProvenance whole-entry dispute model to per-evidence granularity.

[LEARNED] Schema extension stayed minimal by inserting 2a/2b/3a (not renumbering 4-6) and building §3a on WikiProvenance's existing dispute model rather than a new mechanism — "augment not rewrite" was achievable because the original re-pointing left the dispute model as the natural seam to extend. Key distinction held: evidence-TYPE set stayed at 4; the new authority gradations went into a separate METHOD ladder (5). Don't conflate type with method.

[GOTCHA→FIXED] Celes cross-read caught a real contract inconsistency: I'd written `type: maintainer` in §2a/2b/escalation-block for apex evidence, but §2 enum is 4 types + revision-trigger treated a 5th type as future. RESOLVED via option-b: apex authority lives in the METHOD (`maintainer-authoritative`), recorded as `type: src` (Argo's file:line) or `type: probe` (bare statement) — NO `maintainer` type. Added stated principle in §2a: authority is a property of the method; adding a type changes on-disk shape + ref-format contract, adding a method only changes confidence reasoning. [PATTERN] when adding authority gradations to a typed-evidence schema, put them on a separate method/authority axis, never as new types. Celes's cross-read = 2nd load-bearing catch this session (1st was the #42 src/api path error via Finn).

[PROTOCOL-A FILED] `patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md` (Celes/Cal/Finn joint, card stage-2:PENDING). Refines topic-10 taxonomy: citation-backed strongest because evidence-per-clause FORCES claim decomposition (not just auditability) — posture prompt can be honest+wrong by compressing 2 clauses into 1. Wiki 119→120, patterns 82→83.

[LEARNED] When grounding lands, "mirror don't invent" beats designing a format: the mvox finding-note already had claim+probe-script+result-artifact+ratified-commit+truth-table — the schema's job was to POINT at that shape, not invent an evidence format. The reconciliation was a clean update (TTL anticipated it), not a rework — flagging the seam at filing-time + setting the TTL to force it was the right call.

[LEARNED] Schema design that re-points an existing proven model (WikiProvenance) beats greenfield: the architectural-fact-vs-observation distinction was the highest-value transfer — it pre-justified WHY probe-claims TTL and doc-claims staleness-check, instead of inventing two ad-hoc rules.

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
