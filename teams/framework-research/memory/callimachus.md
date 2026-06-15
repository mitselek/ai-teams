# Callimachus Scratchpad (*FR:Callimachus*)

## Summary (lines 1-15 — always read on startup)
- **Current state (S51 ACTIVE 2026-06-15):** Herald 6-item stationmaster Protocol-A batch FILED + acked individually. Wiki **132 → 138** (6 new). All 6 cards + main-index + 4 card-INDEXes reconciled; disk-count VERIFIED 138 (P85/G25/proc9/ref7/obs3/dec5/con4/find0). Reported to team-lead.
- **S51 NEW entries:** `contracts/consignment-body-in-text-field-not-content.md` (CR-7 text-field, PENDING) ↔ `decisions/text-field-pin-clarifying-errata-no-bump.md` (§4 errata no-bump, PENDING) — 1↔6 cross-linked PAIR NOT merged (Herald's call: contract-rule vs decision-w-alternatives, different claim-types); `gotchas/deposit-ok-without-data-line-means-nothing-landed.md` (PENDING; framed as data-line corollary of stationmaster sub-decision-4 transport-failure rule); `gotchas/cf-access-apex-sso-header-trust-without-jwt-verify.md` (security architectural-fact, **CONFIRMED** maintainer-authoritative; apex PR vjs_db_vjs_guard#9; NOT ours to fix); `references/drain-on-delivery-datapoint-2.1.173.md` (COMPACT version-pointer to 2.1.170 sheet — not a 2nd full sheet, mega-biblion-avoided; PENDING; TTL 2026-09-15; Schliemann external observer); `decisions/fan-out-routing-per-destination-outboxes-cr4.md` (candidate A normative v1, PENDING). **RESOLVED:** `gotchas/courier-originates-routing-protocol-leaves-undefined.md` amendment-candidate DEFERRED→RESOLVED via CR-4 (struck-through case-3, status section retitled, related+decision, card tag amendment-candidate→amendment-resolved-cr4, last-verified bumped; gotcha stays CONFIRMED — status update not claim change). 2.1.170 sheet Related got 2.1.173 back-link.
- **S51 read-backs OWED (Herald):** 5 PENDING (CR-7 contract, §4 errata, deposit-no-data-line, drain-2.1.173, fan-out CR-4). Flagged Herald 2 editorial calls to confirm: (a) #4 set CONFIRMED on architectural-fact/maintainer-authoritative grounds (offered to flip→pending); (b) #2 api-gateway-error cross-ref + sub-decision-4-corollary framing. [COMMIT] S51 batch UNCOMMITTED — needs commit before close (team-lead handles git).
- **Carry-forward (next session):** [S51-DESIGN-REVIEW CLUSTER — now n=1 open] item (2) Herald multi-outbox-fan-out is now RESOLVED (CR-4). REMAINING open: (1) `contracts/registered-two-meanings-deposit-error-semantics.md` registry populate-at-register-vs-first-connect (queue-for-dormant-team) — still "v1-defensible seam, decide in v2". [POSSIBLE-PATTERN n=2-watch] both Hopper #7 gotchas = "build-green+unit-green but protocol-broken, caught only by over-real-ssh acceptance"; 3rd instance → promote testing-rule to own pattern. [TTL] inbox-2.1.170 re-verify 2026-09-10; new drain-2.1.173 re-verify 2026-09-15 (both version-coupled). [ANOMALY n=3 FILING-CANDIDATE] task-state-loss recurred S42+S44+S50 (Aen boot block) — at threshold; file as gotcha if it reproduces or Aen surfaces detail. [VERSION] local CLI now 2.1.177 (was 2.1.175 at S50).
- **Key calls (S50+S51):** version-coupled-vs-version-stable (retention/drain are CLI-version-coupled, revision-trigger=version change NOT n+1). *mega biblion*: 2.1.173 datapoint = compact pointer to existing sheet, NOT a 2nd 14-row sheet. Decision/protocol = POINTER not copy. CR-7 1↔6 = two entries not merged (contract-rule vs decision-w-alternatives — the rejected-alternatives section is the decision discriminator). Resolution of a confirmed gotcha = status update, keeps stage-2 confirmed. [GOTCHA-self] edit-tool Read-state expired 2x this session on Edit-after-intervening-calls; re-read recovery held (my own entry warns of exactly this).
- **Cal-Protocol-A queue (pre-S50 backlog, still DEFERRED):** Routing-by-action / Stage-0-contribution / Candidate-B n=1; C3 / E2 / E3 / A.3 / Companion-Pair / Producer-staleness. [UNADDRESSED] none.

---
## Session transcript (prune beyond line 100)

## Session 50 — 2026-06-12 (stationmaster knowledge intake — 6 entries + drift-fix; CLOSED)

Wiki 120 → 129. Full detail lives in the entries; header carries the durable state. Load-bearing lessons only:
- [PATTERN] *mega biblion* on T-entries: 23 atomic TRUTHS.md entries → 2 wiki entries (1 load-bearing flip gotcha + 1 version-stamped property-sheet POINTER to TRUTHS.md as evidentiary source). Don't 1:1 a ledger into the wiki.
- [DECISION] retention-flip gotcha is **version-COUPLED** observation-based, not version-stable arch-fact — revision trigger = CLI version change (re-run probe-1b), NOT n+1 sightings. The distinction from the wake/registration/lifecycle property family is the curatorial call worth keeping.
- [DECISION] stationmaster entry = POINTER to the RATIFIED protocol doc, NOT a copy (Decisions Boundary). Captured rejected-alternatives the doc states-but-doesn't-argue (hub-pull/true-mirror/co-sign/mail-over-MCP/relaying).
- [DECISION] standby-discipline = ONE entry, TWO clauses on one axis (fix-then-flag = modify accepted artifact; staging-on-behalf = create ahead of owner). Same axis "touch owned work on behalf" → one entry not split (opposite of companion-pair, which is for audience/format-split views). Aen confirmed the generalization.
- [DOUBLE-DUTY] Hopper's tmpfs-gate gotcha also CLOSED the owed T6.a Linux re-verification (D10) — folded the ext4 confirmation into the property-sheet T6.a row. One submission, two effects.
- [INDEX-DRIFT FIXED] `process/stage-2-confirms-filing-gate.md` carded since S40 but missing from main-index entries-list + count (table showed process=7, disk+card-INDEX=8). Backfilled + reconciled 9 process / 129 total. Verified disk-130-files = 129-entries + archive/README signpost.
- [GOTCHA] Spawn brief paths WRONG (`poc/ghost-bridge/` at repo root → actual `teams/framework-research/poc/ghost-bridge/`); Glob-verified before filing. Reported to team-lead; team-lead made path-prefix a standing brief discipline (3rd agent to catch it).
- [LEARNED] All 5 Protocol A read-backs/corrections folded clean; provenance-path accuracy (Glob-verify-before-fix) is the discipline working both directions. Crossed-message storms with Brunel resolved zero-loss.

## Session 46 — 2026-06-08 (spawn + intro + immediate shutdown — no intake/queries; CLOSED)

Spawned, bootstrapped (state intake_complete:true, wiki 120, dir verified), sent intro to team-lead. Shutdown request arrived before any Protocol A/B traffic. Nothing filed, nothing queried. Wiki unchanged. Carry-forward identical to S44 close (schema frozen; Cal-Protocol-A queue deferred; competencies.yaml schema-conformance watch).

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

## S37 (2026-05-28) — pruned; durable items folded into header Cal-Protocol-A queue + git history

Wiki 114→123 (9 entries: C2-boundary/Stage-2-typology/Layer-0-predraft/inverted-trigger/yield-narrowing/cadence-DYAD/credential-handoff all FILED). Still-DEFERRED watch-items carried in header queue (Routing-by-action, Stage-0-contribution, Candidate-B, C3, E2/E3, A.3, Companion-Pair, Producer-staleness). Discipline-meta at watch-grade: Shape-F gate-slip (n=2 trigger for typology amendment); substrate-fit fourth-vantage (n=2); substrate-truth cluster n=8.

## Sessions 33-36 (heavily pruned — see git history for details)

[S33+]: Wiki 93→100 (centennial). Brunel 7-item RFC #66 PoC batch. taskget-before-classify-as-noise n=10 self-instantiation.
[S35]: Wiki 105→107. Brunel+Hopper joint S34 wrap (discriminator-anchored + three-layer). Hopper-Amendment-4 via Celes. docs/findings.md (Brunel+Volta substrate-gap). Harness-restriction gotcha surfaced.
[S36]: Wiki 107→114. C1+C4 methodology pair. Sub-shape-E-at-design-domain n=4. Recursive-narrowing. Three-role-stacking. 8 entries shipped. Stage-2-feedback typology crystallized (5 shapes).

## Sessions 1-35 (heavily pruned — load-bearing only; see git history)

[S1-25] Phase 2 activated S6; Protocol C first cycle = Structural Change Discipline. [LEARNED] git-blame for disputes; sibling entries beat variants when failure surfaces diverge; arch-fact gotchas don't gain confidence from n+1; cross-pollination unit = idea not file.
[S26-35] Wiki 59→93: Protocol C promotions (substrate-invariant-mismatch, worktree-isolation, semver-strict, relay-fidelity); companion-pair from apex; recursive-citation + inbox-drained-on-spawn-clear; RFC #66 ghost-member + PO per-team-librarian decision; #8 v3 canonicalization.
[CHECKPOINT] TTL scan: `model-inventory-baseline` 2026-07-10; `inbox-drained-on-spawn-clear` 2026-08-07; new inbox-2.1.170 pair 2026-09-10; substrate-property refs 2026-11-12/14/19; edit-tool-trap + inverted-trigger 2026-11-27.

(*FR:Callimachus*)
