# Montesquieu — Governance Architect Scratchpad

## Cumulative Decisions & Patterns (R8–R10)

[DECISION] T04: 39 decision types mapped across 4 authority levels (L0 PO, L1 manager, L2 TL, L3 specialist). Cross-team audit is ADVISORY. Spec HANDED-OFF requires PO. Emergency authority is time-bounded + scope-limited.
[DECISION] T07: 4 permission tiers (T0–T3), 5 enforcement layers (E0–E4), 5 blast-radius containment mechanisms. Defense in depth — no single layer sufficient.
[DECISION] Manager agent: 6 responsibilities, PO-to-L1 handoff is atomic (broadcast + ACK). Richelieu prompt needs 3 updates (Celes's responsibility).
[DECISION] GitHub Apps (one per team) is governance-optimal for identity/access. L0 decision. Supersedes machine-user approach.
[PATTERN] De facto governance is 5-layer: MEMORY.md (constitutional) → common-prompt (team law) → agent prompt (role) → peer enforcement → incident amendments.
[PATTERN] Governance gaps cluster at team boundaries. Cross-team governance designed but untested.
[PATTERN] Authority uncertainty in autonomous teams — TL asks permission for TL-scope decisions. Fix: authority quick-reference in common-prompt.
[PATTERN] App manifest = agent prompt analogy. Manifest = L0 ceiling; installation = L2 delegation; token = L3 credential.

## Open Questions (carried forward)

#1 Multiple manager agents — when/how to split L1 authority across multiple managers
#2 Amendment protocol — how governance rules themselves get changed
#4 Compliance audit — periodic governance compliance checks

## Session 27 (2026-05-06) — Phase B authority-drift detection at federation scale (joint w/ Brunel)

[CHECKPOINT 10:50] Oriented in worktree. Read complete: prompt, common-prompt, scratchpad, Brunel `poll-only-substrate-sidecar-derivation.md`, Cal `path-namespace-as-federation-primitive.md`, Cal `convention-as-retroactive-telemetry.md`, my own session-26 outputs (`dispatch-granularity-matches-recovery-handler.md`, `protocol-completeness-across-surfaces.md`). Topic 04 §Failure Modes (lines 799-810) confirmed single-team drift framing; OQ #4 (compliance audit at scale) is the Phase B question.

[WIP] Phase B framing locked:
- Single-team drift today = narrative-detected (Medici reads scratchpads). Does NOT scale to n=20+.
- Federation-scale drift = substrate-typed signals from poll/pull metadata. Two load-bearing convention-typed contracts:
  - **Path-namespace breach:** team A writes to `Projects/<other-team>/*` without authorization. Detectable from envelope (writer-identity vs logical_path-namespace).
  - **CuratorAuthority overreach:** curator emits `WriteAccept` for namespace outside `CuratorAuthority.scope`. Detectable from envelope (curator-identity, target-namespace).
- Both observable on the *same poll stream* Brunel's federation-bootstrap sidecar consumes. Drift detector = additional reducer, not a new substrate. Per Cal's `convention-as-retroactive-telemetry`: path-namespace + CuratorAuthority conventions, once consistently enforced, produce drift telemetry as a free byproduct.

[DECISION-DRAFT] Drift detector is **observe-only, no authority** (per session 26 R20 single-provider analysis: sidecar integration sits below governance layer; "no authority level, no delegation matrix entry"). Output is advisory signal → escalation to L1 (manager agent) or L2 (team-lead of accused team), severity-graded. Does NOT touch federation-curators-as-class per-namespace scoping → Surface 1 commitment carry-forward intact.

[PATTERN-DRAFT] **Drift = (envelope-claim) ⊕ (governance-truth-as-of-envelope-time).** Detector runs the same dispatch-completeness check Aen named for Phase A (`every value has a destructor; every error has a recovery`) but inverted — every accepted write must have a matching authority claim that was in-scope at the time of the write. Drift surfaces when this invariant fails AT POLL TIME (not at write time — write-time is curator's job).

[WIP] Boundary with Brunel: **bootstrap = admission control (how teams JOIN with correct authority floor); drift = post-admission monitoring (how the federation NOTICES when the floor is later violated).** Sidecar shape shared, reducers different. [COORDINATION] handshake pending — to send next.

[OPEN] Sent Aen non-blocking question: confirm drift output is advisory (default assumption, per cross-team-audit precedent in Topic 04). Awaiting.

[CHECKPOINT 10:48] Aen confirmed all three: (1) advisory by default — load-bearing structural argument: *if substrate auto-corrects governance violations, the substrate IS governance, separation collapses* (Herald's S26 framing "asymmetries should live above the substrate, not in the substrate" — drift is a load-bearing test of this principle, not an exception). (2) Brunel boundary endorsed exactly as cut: bootstrap=admission control, drift=post-admission monitoring; orthogonal to Brunel's instrumentation-vs-semantics cut (he owns sidecar location/reads/signals; Monte owns drift semantics — what counts, thresholds, response, governance authority for corrective action). (3) Sequenced next-moves confirmed; report scope memo before drafting design.

[NUDGE-FOLDED] Aen: Surface 1 commitment is a GATE on the design, not just a fold-in. If per-namespace curators are corrective-authority recipients (highly likely), Cal's flag becomes a structural gate. Plan Protocol B query to Cal EARLY — receiving-authority shape determines severity-threshold design.

[DECISION] Severity thresholds typed enum, **3-tier** (collapsed from 4-tier per Aen 11:14): `Severity = "info" | "warning" | "breach"`. Discriminator: `breach` = authority-line crossed (governance-impact), `warning` = substrate-typed mismatch without authority-crossing, `info` = telemetry only. `violation` collapsed into `warning` — were two names for substrate-impact-without-authority-crossing.

[DECISION-DRAFT] Drift detector emits **`ProducerAction` enum values** (`escalate-to-team-lead`, `escalate-to-governance`) — slots cleanly into existing Phase A typed contract. Detection in substrate, escalation as ProducerAction, corrective authority above-substrate. Composes with separation-of-powers structurally.

[WIP-NEXT] Cadence commit per Brunel's Phase A pattern: **412w scope memo → 1300w design**. Scope memo deliverables:
1. Severity taxonomy (typed enum + threshold semantics)
2. Drift signal catalog (n=5-7 typed signals, all envelope-derivable)
3. Corrective-authority recipient (per-namespace curator? L1 manager? team-lead?) — depends on Cal Protocol B response
4. Scaling analysis at n=2/5/10/20 (signal volume, escalation rate, cost-bound)
5. Surface 1 gate confirmation (no co-ownership / shared-curatorship introduced)
6. Boundary affirmation with Brunel (registry-shared composition)

[CHECKPOINT 10:55] Topic 04 cross-team-audit precedent re-read (lines 311-358): cross-team Medici findings → L1 (or PO) → target team-lead → team-lead decides action. Recipient pattern is **team-lead of audited team, L1 as router**. NOT direct-to-specialist, NOT direct-to-curator. Strong default for Cal's Q3.

[WIP — DRIFT SIGNAL CATALOG draft, scope-memo deliverable #2]
Source: envelope poll-stream only (no scratchpad reads, no content reads). All signals are envelope-derivable. Field set per Phase A: `sourceTeam`, `logical_path`, `ContentCategory`, `curator-identity` (on accept), `target-namespace`, `WriteRejection.errorClass`, `ProducerAction`, timestamp/seq cursor.

| # | Signal | Detection rule (envelope-derivable) | Severity (draft) | Phase A field(s) consumed |
|---|---|---|---|---|
| D1 | Path-namespace breach | `sourceTeam ≠ leading segment of logical_path` AND no cross-write authorization on file | violation | sourceTeam, logical_path |
| D2 | CuratorAuthority overreach | `curator-identity` NOT IN authorized-curators-for(target-namespace) at write-time | breach | curator-identity, target-namespace, registry |
| D3 | Cross-namespace WriteAccept anomaly | `WriteAccept` whose target-namespace ≠ curator's primary scope (legitimate cross-write but unusual frequency) | warning | curator-identity, target-namespace, time-window |
| D4 | ContentCategory misclassification | category claimed in envelope ≠ category implied by logical_path tier (e.g., `Meetings/...` written as `decisions` category) | info → warning if recurring | ContentCategory, logical_path |
| D5 | R2 sovereignty boundary crossing | envelope claims R2-sovereign artifact but logical_path is in a non-sovereign namespace, or vice versa | violation | R2-sovereignty flag, logical_path |
| D6 | Authority-floor regression | per-team curator authority registered at admission has been silently narrowed/widened post-bootstrap (without §3.4 ratification) | breach | registry diff over time, ratification log |
| D7 | Rejection-rate anomaly | per-team `WriteRejection.errorClass` distribution diverges sharply from federation baseline (esp. high `policy-violation` rate) | warning → violation | errorClass, sourceTeam, time-window |

Notes:
- D1, D2, D5, D6 are *typed-invariant violations* (binary detection, observable on single envelope).
- D3, D4, D7 are *statistical drift* (detection requires time-window aggregation; D7 needs federation-baseline knowledge).
- Severity column is draft; final taxonomy pending Cal's Protocol B response (whether per-namespace curator is recipient affects whether `breach` or `violation` is the right ceiling for D2).
- D6 specifically requires Brunel's bootstrap-writes-registry composition; if that doesn't materialize, D6 must derive registry from envelope log directly (more expensive but possible).

[CHECKPOINT 10:55] Scope memo v1 shipped to Aen — option (b), partial, ~440w, §6 GATE-PENDING-CAL. Sections §1-§5 + §7 ratifiable independently. Awaiting (a) Aen ratify/reshape, (b) Cal Protocol B response, (c) Brunel [COORDINATION] response on registry composition.

[LEARNED 10:55] Filing-to-citation latency <30min target binds even on multi-input dependencies — partition deliverables by gate-dependency and ship the independent slice. (Citing Aen's S26 [LEARNED] precedent in option-(b) reasoning.) The partition itself was the load-bearing structural move enabling option (b) to be viable.

[WIP — SCALING ANALYSIS draft, scope-memo deliverable #4]
Cost-bound vs Brunel's Brilliant baseline (~178 ops/s flat):

| n teams | Speculative writes/day | Sidecar reducer ops/s | Drift signals/day (est.) | Escalation rate (est.) |
|---|---|---|---|---|
| 2 | ~1,200 | <0.05 | <5 (mostly D4 noise) | 0-1/week |
| 5 | ~3,000 | ~0.1 | ~10-15 | 1-2/week |
| 10 | ~6,000 | ~0.2 | ~25 | 3-5/week |
| 20 | ~12,000 | ~0.4 | ~50-75 | 8-15/week |

Cost-bound holds well inside Brilliant headroom even at n=20. Escalation rate is the harder constraint — at >10/week, advisory-fatigue risk for L1 router. Mitigations: (a) tier severity (only `breach` paginates to L1; `info`/`warning` digest weekly), (b) per-team trend reports (drift posture summary, not per-event firehose), (c) auto-suppress recurring D4 misclassifications below per-team threshold.

[CHECKPOINT 10:55] Brunel [COORDINATION] integrated cleanly. Q1/Q2/Q3 confirmed. Registry envelope shape drafted: `{ kind: "RegistrationAuthority", team, namespace, curator, ratifiedBy, ratifiedAt, justification: { curatorRosterCite, justificationProse }, conventionRetestCount, supersedes? }`. Append-only-additive. Bootstrap writes; drift reads.

[DECISION] D6 derivation strategy = registry-shared composition (cheap). D2 sharpened to `latest-non-superseded-RegistrationAuthority(team).curator` cross-check. New signal **D8 admission-velocity anomaly** added to catalog (Brunel's n=k counter surfaced as drift signal). New forensic field `provablyUncoordinated: boolean` on D2 advisory payload (curator-identity ∈ prior curatorRosterCite chain — false = unknown actor → higher escalation severity).

[REFINEMENT-PROPOSED] To Brunel: add `effectiveAt` field distinct from `ratifiedAt` for future-effective admissions. His call to accept or declare future-effective disallowed. Either composes.

[FRAMING-FOLD] Brunel's "**admission needs to commit, observation needs to caution**" — binding-by-bootstrap, advisory-by-drift asymmetry. Cleanest argument yet for §6 L1/team-lead-recipient default if Cal returns `not-documented`. Citing in Topic 04 design draft. Locks against T04 cross-team-audit precedent.

[ROUTING] Brunel asked if `kind: "RegistrationAuthority"` belongs to enum I curate — answered NO, that enum (`WriteAccept`/`WriteReject`/`ProducerAction`) is in `types/t09-protocols.ts`, Herald's primary domain. Routed enum-naming ratification through Aen, not bypassing to Herald myself.

[OPEN]
- §1-§5/§7 awaiting Aen ratify/reshape
- §6 awaiting Cal Protocol B response (10:50, blocking)
- Brunel v0.2 ship → tag me on shape verification

[CHECKPOINT 11:08] Aen ratified scope memo §1-§5/§7 at 11:30, greenlit design draft with §6-as-stub. Three nudges folded: (1) D5 grounding → forwarded to Brunel as [COORDINATION] D5-Δ, (2) D7 baseline location → forwarded to Brunel as [COORDINATION] D7-Δ, (3) digest-as-first-class → §5 of design promotes per-team digest from mitigation to primary output mode, per-event escalate becomes exception mode. Aen also created task #4 (Herald ratifying RegistrationAuthority enum addition) — routing-pending confirmed.

[DESIGN-v1 SHIPPED 11:08] ~1310w, 9 sections. Structure follows Aen's guidance: §1 structural argument leads, §2/§3 organize around typed-invariant/statistical partition, §4 severity taxonomy with canonical-taxonomy-check dogfood cite, §5 digest-first output mode, §6 stub (no future-proofing), §7 surface 1 by construction, §8 SemVer-strict v2.0 amendment posture cite, §9 open follow-ups.

[DOGFOOD] Wiki citations grounded — verified all 4 exist before citing per `prompt-to-artifact-cross-verification` discipline: `canonical-taxonomy-check-before-naming.md` (§4 4-tier→3-tier collapse — recursive dogfood of my own session 26 work), `semver-strict-typed-contract-discipline.md` (§8 v1.1-vs-v2.0 amendment classification), `no-future-proofing.md` (§6 stub discipline). `timestamp-crossed-messages.md` carried as cross-team-handshake awareness, not direct cite (no cross-message in this exchange yet).

[OPEN-v1]
- Aen ratify/reshape on design v1
- Cal Protocol B response → §6 resolution → v1.1 or v2.0 amendment
- Brunel D5-Δ response → D5 detection class (typed-invariant or statistical)
- Brunel D7-Δ response → baseline-state location confirmation
- Brunel v0.2 ship → final registry envelope shape verification
- Task #4 Herald ratification of `RegistrationAuthority` enum addition (Aen-routed)
- Topic 04 write delegated on full ratification

[CHECKPOINT 11:04] Aen 11:38: Cal reported Protocol B (10:50) NOT in her inbox; substrate-investigation requested. Three confirmations folded (D6/D2/D8/provablyUncoordinated additive ratification, Herald spawn confirmed correct routing, §6 default framing locked structurally independent of Cal). Substrate finding executed.

[GOTCHA / SUBSTRATE-INVARIANT-MISMATCH n=6] Verified empirically: SendMessage harness confirmed dispatch ("success: true, callimachus's inbox"); message present in `$HOME/.claude/teams/framework-research/inboxes/callimachus.json` entry [1] (`from: monte, summary: [Protocol B] Curator authority shape..., timestamp: 07:49:10.552Z, read: false`); Cal's `read` flags non-monotonic by timestamp — read forward (entries 2/3/4 marked read at 07:50:35/07:54:50/07:56:39) past entry 1 (07:49:10) without visiting it. Substrate claim ("delivered, recipient will iterate") ≠ observed substrate ("recipient iteration skipped this position"). LAYER-DISTINCT from prior 5 instances: harness inbox-write vs runtime inbox-iteration ordering, new layer.

[ACTION] Submitted Protocol A to Cal at 11:04 with full evidence + n=5→n=6 amendment + diagnostic question + 3-layer remediation sketch. Recursive surface-don't-bridge: if this submission also fails to iterate, that's n=7 confirmation; if it surfaces, amendment is non-deterministic (race condition shape, not ordering-bug shape).

[DECISION] Per Aen 11:38 the original Protocol B is no longer urgency=blocking — §6 default structurally anchored. No re-send. Cal answers when she eventually reads, severity ceilings amend in v1.1 if her evidence supports per-namespace-curator-recipient.

[LEARNED] Cross-side substrate verification (sender-side disk-read of recipient's inbox) is the only available detection mechanism for harness-inbox-write-vs-runtime-iteration gap. Neither sender (sees only "success: true") nor recipient (sees consistent forward-progress) has local signal. Detection requires third-party-with-disk-access OR explicit cross-check tooling. Same shape as Phase A's protocol-shapes-typed-contracts gate: completeness check is multi-party, not within-party.

[CHECKPOINT 11:06] Aen 11:48: Design v1 §1-§5/§7-§8 ratified. Topic 04 write-back greenlit (don't gate on §6). Compound-signals nudge surfaced for v1.1/v2.0. Two notes: submit single-channel-saturation-via-mode-partition pattern to Cal as Protocol A (cross-cutting reach beyond drift detection); Topic 04 §Failure Modes amendment ships at v1.0; §Cross-Team Audit Authority full update lands on full ratification.

[TOPIC-04-v1.0 SHIPPED 11:06] Three targeted edits to `topics/04-hierarchy-governance.md`:
1. §Failure Modes table: split "Authority drift" row into single-team (narrative) and federation-scale (substrate-typed) variants
2. New section §Authority-Drift Detection at Federation Scale (between Failure Modes and Open Questions): structural argument, signal classes, output design, recipient/authority chain, design-v1 reference
3. §Open Questions #4 (governance compliance audit) resolved with composition framing — Medici handles single-team scratchpad evidence, substrate detector handles federation envelope evidence; the two compose, not compete

[NUDGE-FOLD-v1.1] Compound-signals: D7-when-also-D2 and D8-when-also-curatorRosterCite-failure currently expressed as severity-escalation rules in v1; Aen's nudge: promote to first-class typed `kind: "CompoundDriftSignal"` discriminated-union member with explicit composition rules. Otherwise compound logic lives in consumer-side semantic layer, importing it back across the seam. v1.1 candidate, not v1 blocker.

[QUEUED-FOR-CAL] Protocol A submission: single-channel-saturation-via-mode-partition pattern. Per Aen 11:48: "digest carries advisory-fatigue load; escalation carries breach load; they do not compete for the same channel" — the structural framing that resolved the n=20 advisory-fatigue forecast. Cross-cutting beyond drift detection. Will draft after compound-signals v1.1 fold settles + Cal Protocol A on substrate-mismatch acknowledged.

[OPEN-v1.1]
- Brunel D5-Δ → D5 typed-invariant or statistical class commit
- Brunel D7-Δ → baseline-state location confirmation
- Brunel v0.2 ship + Herald enum ratification → final RegistrationAuthority shape
- Cal Protocol B response → §6 severity ceilings + Topic 04 §Cross-Team Audit Authority full update
- Cal Protocol A submissions queued: substrate-invariant-mismatch n=6 (sent 11:04) + single-channel-saturation-via-mode-partition (queued)
- Compound-signals v1.1 fold (typed CompoundDriftSignal kind)

[CHECKPOINT 11:10] Aen 11:58: substrate-finding authorized as cross-side observation (post-hoc — already submitted 11:04, framing matches). Six Herald ratifications shipped (his 11:02). Folded into Topic 04 §Authority-Drift section.

[DECISION] Herald ratifications folded:
1. **`RegistrationAuthority` slot** = new top-level discriminated-union member in sibling `FederationAuthorityRecord` union, NOT in WriteAccept/WriteReject/ProducerAction. No fold needed on my side; Brunel folds into v0.2.
2. **D5 typed accessor RATIFIED — `SovereigntyClaim` 3-state union** (R2-self / R2-ratified-cross-team / R2-violated). D5 detection rule simplifies to `SovereigntyClaim.state === "R2-violated"`. D5 stays in typed-invariant class — substrate has done classification work; detector flags observation that should never have reached it. Cross-link to `RegistrationAuthority.recordId` via `R2-ratified-cross-team.ratifiedBy`.
3. **D7 typed accessor RATIFIED — `BaselineDeviation` 4-state union** with normalized magnitude. Severity mapping: `within-baseline` → no signal, `deviating-conservatively` → info, `deviating-aggressively` → warning, `insufficient-data` → info-with-flag. Implementation-flexibility-via-typed-output preserves Brunel's measurement-method freedom.
4. **`conventionRetestCount` semantics**: bootstrap-time-only typed scalar on envelope. D8 admission-velocity derives cumulative count via supersedes-chain traversal MY side (no stored cumulative field).
5. **Compound-signal nudge folds into Herald 03 spec scope.** When `CompoundDriftSignal` lands as typed `kind` (v1.1), surface to Herald via [COORDINATION] for 03 spec discriminated-union scope expansion.
6. **Herald 03 design doc**: `prism/designs/herald/03-federation-authority-record-contract.md` (in-flight). My v1.1 cite-and-fold async on his ship event.

[ACTION 11:10] Topic 04 §Authority-Drift Detection at Federation Scale — typed-shape language updated:
- D5 detection rule: `SovereigntyClaim.state === "R2-violated"` (typed-invariant, simplified from XOR rule)
- D7/D3 statistical signals consume `BaselineDeviation` typed union
- D8 derives via supersedes-chain traversal (not stored field)
- BaselineDeviation severity mapping prose inserted
- Reference updated: Herald's 03 spec named as typed-shape source-of-truth

[ACK-CROSS-MESSAGE] Aen's "Authorize Protocol A submission to Cal" + "submit when ready, cite my authorization" crossed with my 11:04 already-shipped Protocol A. Per `timestamp-crossed-messages.md`: surface, don't bridge. Submission IS already with Cal at 11:04 with the cross-side-of-substrate framing he authorized — his authorization is post-hoc validation that the framing was correct. No re-submit needed; will surface the cross-message resolution to Aen.

[CHECKPOINT 11:14] Brunel async ratification: v0.2 SHIPPED + v0.3 in-place fold of Herald typed-contract directives. Read end-to-end at `teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`. Verified envelope shape consumable for D5/D6/D7/D8/D2 — all fields present. Three Q answers shipped to Brunel.

[DECISION] Brunel verification answers (sent 11:14):
- Q1 envelope shape: VERIFIED. Field-to-detector mapping table sent. `recordKind`/`recordId` rename (Herald Directive B) accepted.
- Q2 supersedes semantics: CHAIN REIFIED — D6 needs audit trail across changes. Append-only-additive with supersedes-marker preserves history; do NOT add `deactivated: boolean` flag.
- Q3 `effectiveAt` disallow: ACCEPT, no concrete need now, document as "revisit on observation."

[D6 SHARPENING] Per Herald Directive C in Brunel v0.3: invalid-supersedes (broken chain) is R9-rule under `EnvelopeInvalidRecovery`, NOT a 6th `WriteRejection.errorClass` class. Preserves 5-class enum stability per SemVer-strict discipline. D6 is now sharpened: fires on **structurally-valid `RegistrationAuthority.supersedes` chain advancing without corresponding §3.4 ratification record**. Broken chains route to substrate-validation (R9), not authority-floor (D6). Topic 04 §Authority-Drift D6 description updated 11:14.

[OPEN-D5-RECONCILIATION] Surfaced to Brunel as proposed v0.4 fold (non-blocking): his v0.3 §6.5 D5 phrasing says "detector relays substrate's `logicalPath.team` decoding"; my Topic 04 v1.10 phrasing says "detector consumes typed `SovereigntyClaim`." Compatible at runtime but typed-output-discipline (per `protocol-shapes-are-typed-contracts.md`) says the contract should be in terms of the typed union, not raw fields. Awaiting his accept/reshape; either composes.

[FILES-UPDATED-11:14]
- `topics/04-hierarchy-governance.md` §Authority-Drift §Signal classes — D6 description sharpened per Herald Directive C / Brunel v0.3

[OBSERVATION] Cal Task #1 (queue flush) marked completed in task list — Cal has worked through her ~13-pattern queue. Her Protocol B response on my 10:50 query may land soon; my Protocol A on substrate-invariant-mismatch n=6 (11:04) and the original Protocol B (10:50) may both surface as she catches up.

[CHECKPOINT 11:21] Cal Protocol B response RECEIVED at her 11:18-ish. **Full ratification of design-B (write-authority only / L1+L2 corrective recipient).** All four sub-questions answered with wiki+topic-file canon. Cal-flag retires; severity ceilings do not shift; ProducerAction emission targets stated explicitly: L1 (typed-invariant breach) or digest-aggregator (statistical), never named curator directly.

[DECISION] Cal's Q1+Q2 establish the canonical answer:
- **Q1 — curator authority is write-authority only.** Surface 1 §1.1: "each curator is sole-writer for their team's namespace shard." Boundary stops at write-authority.
- **Q2 — `wiki/patterns/substrate-shape-vs-authority-shape-orthogonality.md`** (filed today, source-agents [herald, monte]) is load-bearing. Diagnostic half (my §1.4 M2 rejection) + normative half (Herald deliverable C "asymmetries above substrate") = corrective authority lives above substrate, not at substrate's write-authority layer.
- **Q3 — Topic 04 §Recipient and authority chain (lines 845-849) is canonical.** Recursive — my own ratification was already the answer; the pending-flag was epistemic caution.
- **Q4 — §3.4 ratification curator-rejection-route is bootstrap-time admission, NOT drift-time observation.** Different shapes; do not mirror.

[ACTION 11:20] Topic 04 v1.10 → v1.1 amendment shipped (two targeted edits):
1. §Recipient and authority chain — replaced pending-flag paragraph with Cal-ratified language. Cites `substrate-shape-vs-authority-shape-orthogonality.md` + Surface 1 §1.1 + governance-layer-above-substrate framing. **ProducerAction emission targets stated explicitly: L1 or digest-aggregator, never curator directly.**
2. §Reference — pending-flag retired in prose; Cal Protocol B resolution date noted.

[LEARNED 11:21] **Recursive load-bearing structure of Protocol B + topic-file canon.** My own Topic 04 §Recipient and authority chain prose (shipped 11:06) was the canonical source for the answer to my own Protocol B query at 10:50. The query was structurally redundant — but load-bearing as epistemic-caution-of-the-author seeking external evidence. Cal's response converts the pending-flag into a citation. Two-consumer pattern instance (per `wiki/patterns/two-consumer-pattern.md`): topic-file consumer + wiki consumer need same answer; wiki citation ratifies topic-file canon; bridge-not-sync.

[OBSERVATION] (SUPERSEDED 11:36 — see CHECKPOINT 11:36 below for resolution) Substrate-invariant-mismatch n=6 finding may downgrade from "consistent failure" to "non-deterministic race" — Cal eventually iterated to my 07:49:10 message (either substrate self-corrected or 11:08 priority sweep caught it). Race-condition shape sharpens the wiki #45 amendment framing. Asked Cal in 11:20 ACK whether she iterated naturally or was externally prompted; her receiver-side amendment to the n=6 entry will resolve.

[OPEN-v1.2]
- §Cross-Team Audit Authority full update — gate now OPEN per Cal resolution; awaiting Aen judgment on draft-now vs hold (sent 11:21)
- Compound-signals v1.1 fold + Herald [COORDINATION] (no urgency)
- Single-channel-saturation Protocol A submission for Cal (queued)
- D5 v0.4 framing reconciliation awaiting Brunel accept/reshape (non-blocking)
- Cal receiver-side amendment to n=6 entry pending her processing of my 11:04 + 11:20

[CHECKPOINT 11:23] Aen 12:26 update: my 11:04 Protocol A ALSO did not land in Cal's inbox; Cal at 12:04 still expecting. Aen relaying full evidence chain to Cal at 12:18 via team-lead → Cal (working channel). Hypothesis emerging team-wide: worktree-spawned ↔ non-worktree-spawned has substrate failures.

[GOTCHA / DIRECTIONAL SHARPENING] Aen named hypothesis as "BOTH directions"; my surface evidence shows ASYMMETRIC failure: **Cal→Monte (non-worktree → worktree) WORKS** — her 11:18-ish Protocol B response landed in my inbox at start of session-window, cited verbatim in my 11:21 status. Failure direction is **worktree-OUTBOUND to non-worktree-recipient specifically**, not bidirectional. Sent directional-sharpening note to Aen at 11:23.

[HYPOTHESIS] Failure shape: when worktree session calls SendMessage to non-worktree-recipient, harness write may land in worktree's mounted view of `$HOME/.claude/teams/...` but parent-process's mounted view of same path may differ — write lands in worktree's $HOME mirror, but parent-process Cal's read-cursor advances over a parent-mounted file that doesn't have the write. `dual-team-dir-ambiguity`-shaped at filesystem-mirror layer (not Path Convention layer). Diagnostic: my 11:00 worktree-side disk-read DID see the message ("entry [1] from monte" on `callimachus.json`) — but that's the worktree's view; parent-process Cal's view may differ.

[POLICY 11:23] Per Aen 12:26: future Cal-bound submissions dispatch normally; if they don't land, surface to Aen for relay-on-behalf via team-lead → Cal. Brunel-bound and Herald-bound dispatches use direct path (worktree → worktree confirmed working). Single-channel-saturation Protocol A queued — will dispatch when ready, with relay-fallback path if needed.

[CHECKPOINT 11:26] Aen 12:33: Cal answered §6 question via direct relay (Cal 12:24 her clock). Full ratification of NO-SHIFT design — per-namespace curator is write-authority only, NOT corrective-authority recipient; drift advisory recipient = L1 → team-lead-of-accused-team; severity ceilings hold; **v1 → v1.0 final without recipient amendment, NOT v2.0** (no consumer-breaking change per SemVer-strict). Two unblocks: (1) design v1 §6 STUB resolves to NO-SHIFT, (2) Topic 04 §Cross-Team Audit Authority v1.1 amendment now unblocked.

[DECISION] Design v1 §6 STUB → final (NO-SHIFT): Recipient = L1 router → team-lead-of-accused-team per T04 §Recipient-and-authority-chain. Per-namespace curator = subject-of-signal, not recipient. Severity ceilings hold. Cal Protocol B (12:24) cited as authoritative. Cal-flag from Surface 1 commitment did NOT trigger.

[ACTION 11:26] Topic 04 §Cross-Team Audit Authority v1.1 amendment shipped — three additive edits paralleling existing structure:
1. **Audit Types table**: added 5th row "Authority drift (federation-scale)" — substrate-typed drift detector / continuous trigger / advisory `ProducerAction` / per-team weekly digest + per-event escalation
2. **New sub-section §Federation-Scale Drift Detection Flow** — ASCII flow diagram paralleling Cross-Team Audit Flow structurally; severity classification → per-event escalation (typed-invariant) or digest (statistical)
3. **New sub-section §What the Drift Detector May NOT Do (Federation-Scale)** — five forbidden actions paralleling §What Medici May NOT Do; closes with citation to `substrate-shape-vs-authority-shape-orthogonality.md`

Both new sub-sections mirror existing Cross-Team Audit Authority structure (auditor produces findings; L1 routes; audited team-lead decides) — preserves Topic 04 internal consistency.

[ACK Brunel D5 reconciliation status] Aen 12:33 directed Brunel to typed-output framing (typed `SovereigntyClaim` union as consumer contract) for v0.5 fold. My proposed v0.4 reshape lands per Aen's lean. Topic 04 phrasing already aligned.

[ACK Phase B v1.0-final designation] confirmed correct per SemVer-strict no-consumer-breaking-change criterion. v1.0-final, not v2.0.

[OPEN-v1.2-RESIDUAL]
- Compound-signals v1.1 fold + Herald [COORDINATION] (no urgency, my cadence)
- Single-channel-saturation Protocol A submission for Cal (now unblocked per Aen 12:33; will dispatch with relay-fallback awareness)
- ~~Brunel v0.5 fold of D5 typed-output framing~~ → COMPLETE: Brunel shipped v0.6 with Herald typed-accessor commitment as "Per Herald typed accessor commitment" addendum (load-bearing). Topic 04 v1.2 cite-and-fold shipped 11:30 with corrected `prism/designs/herald/04-` path + spec-version + bootstrap-template citation
- Cal receiver-side amendment to substrate-mismatch n=6 entry — Cal already amended at her 11:28 ACK with two-sub-shape framing + my three enrichments folded (Diagnostic Question 5 + Three-layer remediation)

[CHECKPOINT 11:33] Aen 13:02: Topic 04 §Cross-Team Audit Authority v1.1 ratified end-to-end. **Phase B v1.0-final cluster CLOSED.** Three additive edits accepted: 5th audit-type table row, §Federation-Scale Drift Detection Flow, §What the Drift Detector May NOT Do. Two-section parallel structure (Drift Flow + Drift Restrictions mirroring Medici Flow + Medici Restrictions) recognized as load-bearing for future-reader vocabulary consistency. The 5th restriction ("read scratchpad content or message bodies") locks the substrate-typed boundary against future scope-creep into narrative-detection territory.

[LEARNED 11:33 — TWO-CONSUMER-PATTERN RECURSIVE VALIDATION] My Topic 04 §Recipient-and-authority-chain prose ratified at 11:06 contained the canonical answer to my own 10:50 Protocol B query. The query was structurally redundant once the ratification landed; Cal's 12:24 response converted my epistemic-flag into a citation. This IS `wiki/patterns/two-consumer-pattern.md`-shaped — topic-file consumer (future readers) + wiki consumer (Protocol B query) need the same answer; wiki citation ratifies topic-file canon. Bridge-not-sync: both consumers update on the same answer without forcing one channel through the other. Per Aen 13:02 explicit guidance to fold this as scratchpad observation. Recursive within-session validation of the pattern.

[PHASE B SUMMARY — preserved per Aen 13:02 invitation] **Session 27 (2026-05-06) Phase B v1.0-final shipped in ~150min session-elapsed.** Joint deliverables across team:
- **Brunel federation-bootstrap-template** v0.1 → v0.6 (`teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`) — admission-control protocol, typed `RegistrationAuthority` envelope, append-only-additive supersedes-chain
- **Monte authority-drift-detection design v1 → v1.0-final** — substrate-typed signals (D1-D8), typed-invariant + statistical partition, digest-first / escalate-by-exception output, severity taxonomy `info|warning|breach`, §6 NO-SHIFT (Cal Protocol B 12:24)
- **Herald 04 spec** `prism/designs/herald/04-federation-authority-record-contract.md` v0.1.1 — typed contracts ratified (`RegistrationAuthority`, `SovereigntyClaim` 3-state, `BaselineDeviation` 4-state, `kind` discriminator, `recordId` producer-side)
- **Topic 04 amendments** v1.0 → v1.2 — §Failure Modes split, new §Authority-Drift section (~280w), §Open Q #4 resolved, §Cross-Team Audit Authority v1.1 closure (5th audit-type + drift-flow + drift-restrictions), Cal-resolution + Brunel-v0.6 cite-and-fold
- **Cal queue 14/15** with dense citation traffic (8 wiki entries cited in single Brunel Protocol B response); substrate-invariant-mismatch n=5 → n=6 amendment (joint Monte+Cal source-agents); `substrate-shape-vs-authority-shape-orthogonality.md` filed as load-bearing for §6 default
- **Phase A (S26) → Phase B (S27)** continuity: Phase A's typed contracts (`WriteAccept`, `WriteReject`, `ProducerAction`, envelope v2.0) are the consumer surface drift detection composes against; cite-and-fold cadence engaged (Brunel v0.6 → Topic 04 v1.2 inside one session-window)

[LEARNED — STRUCTURAL DISCIPLINE TRACK FROM SESSION 27]
- **Surgical-edit discipline as Pass-1 cadence:** in-place targeted touchpoints with named edits + frontmatter `revisions:` log preserves provenance without document-rewrite churn (per `pass1-pass2-rename-separation.md`)
- **Filing-to-citation latency <30min target hit recursively:** Cal filed `canonical-taxonomy-check-before-naming.md` at 11:08, I cited it in design v1 at 11:08 (mine), Aen ratified at 11:48 — wiki-as-active-citation, not wiki-as-archive
- **[CROSS-DETECTED] surfacing as session-pattern:** four crossed-message instances detected and surfaced (Aen authorize/Monte already-shipped × 2; substrate-relay vs disk-state-transition; Brunel v0.5/Aen status-check vs v0.6 actual). All surfaced via `timestamp-crossed-messages.md` discipline; no silent bridges
- **Substrate-finding empirical rigor:** sender-side disk-read across worktree boundary surfaced n=6 substrate-invariant-mismatch with three-finding evidence chain. Directional-asymmetry sharpening (worktree-OUTBOUND only, Cal→Monte WORKS as positive control) elevated framing from "non-deterministic race" to "deterministic worktree-mount asymmetry" — same-root-cause-different-layer connection to `dual-team-dir-ambiguity.md` is the structural elevation that may carry to common-prompt promotion at n=6+

[CHECKPOINT 11:36 — DETERMINISTIC MOUNT-DECOMPOSITION CONFIRMED] Cal's 11:36 receiver-side empirical answer rules out non-determinism: inbox file unchanged at 312 lines across entire S27 work span; Aen's 12:18 conversation-channel relay was the ONLY delivery path. **Absence of eventual-iteration-catch-up is negative-evidence-as-positive-data**: non-determinism would have produced eventual catch-up; the empirical absence rules it out. Mechanism is **deterministic mount-decomposition** (worktree-mirror's $HOME view ≠ parent-process's $HOME view at the file Cal iterates). Not race; not eventual-consistency; not self-correcting. This sharpens the n=6 entry to common-prompt-promotion candidate at higher confidence.

[LEARNED 11:36 — NEGATIVE-EVIDENCE-AS-POSITIVE-DATA] Cal's diagnostic move "absence of eventual-iteration-catch-up across the session is informative" elevates the inference from "we observed X" to "we observed not-Y, which rules out the racing-conditions alternative." This is structurally a Bayesian update: observed-absence-of-expected-recovery-signal reduces P(non-determinism) → 0; mass moves to deterministic-mount-decomposition. The diagnostic principle is reusable: when ruling out a hypothesis, look for the absent signal that hypothesis would have produced, not just the present signal of the failure.

[FRAMING-FOLD 11:36] Two-consumer-pattern citation in Aen ACK (11:21 [LEARNED]) was **mis-categorized**. Cal's 11:36 re-categorization is correct: the recursive-citation observation is structurally distinct from `two-consumer-pattern.md` (different-access-bridge) — it's actually a sibling to `wiki/patterns/first-use-recursive-validation.md` (recursive-validation family). Different surface (citation-of-prior-canon-by-author vs first-application-of-new-rule-by-author); shared structural connection: author-side action becomes recursive validation when the action is independent of the canon-creation moment. First-use validates by application; recursive-citation validates by query. Tentative title for filing: `recursive-citation-as-canonical-validation.md` (preferred; explicit about validation function) or `query-of-self-authored-canon.md` (more descriptive). Queueing as Protocol A submission #2 after single-channel-saturation.

[QUEUE-UPDATE 11:36] Cal-bound submission queue (per Protocol A live-submission discipline; relay-fallback per Aen 12:26):
1. **Single-channel-saturation-via-mode-partition** (queued first; was post-substrate-finding-ack cadence)
2. **Recursive-citation-as-canonical-validation** (queued second; ride-along)

[LEARNED 11:38 — `string | null` vs `?: string` IN STRICT-DISCRIMINATED-UNIONS] Per Aen 13:15 catch on Brunel's v0.6 correction: Herald spec `supersedes: string | null` (nullable, NOT optional). My 12:21 paraphrase rendered as `?: string` (optional). NOT equivalent at strict-discriminated-union level: explicit `null` at chain-head is a *signal* ("first registration, no prior"); `?:` allows absence which loses the signal. Brunel caught via "primary artifact > relay-quote" production rule. **The difference matters at typed-contract level even when both "work" at runtime** — the discriminated union is the type, and the signal-vs-absence distinction is part of the type's expressive power. Cite for any future cite-and-fold pass on typed contracts where I'm relaying-relayed material.

## SHUTDOWN — 2026-05-06 11:43 (Aen 14:18 PO closure)

[CLOSURE] Phase B v1.0-final cluster mutually closed end-to-end. Aen ratified all amendments: design v1 §1-§5/§7-§8 + §6 NO-SHIFT final; Topic 04 v1.0/v1.10/v1.11/v1.1 (Cal-resolution)/v1.1 (Cross-Team Audit Authority closure)/v1.2 (Brunel-v0.6 cite-and-fold). Cal Protocol B resolved (write-authority-only, L1 → team-lead recipient). Substrate-invariant-mismatch wiki amended n=5 → n=6 with joint Monte+Cal source-agents. Brunel v0.6 envelope-shape verified; D5-Δ (Herald 04 §3.1 `PathSovereigntyAccessor`) + D7-Δ (same-substrate baselines) folded; canonical-target answered (b) T04 with max-specificity citation table sent.

[QUEUED-FOR-S28]
1. Compound-signals v1.1 typed `kind: "CompoundDriftSignal"` discriminated-union member fold + Herald [COORDINATION] surface for 04 spec scope expansion
2. Cal-bound Protocol A: `single-channel-saturation-via-mode-partition` (digest-load + breach-load do not compete for the same channel — cross-cutting beyond drift detection per Aen 11:48)
3. Cal-bound Protocol A: `recursive-citation-as-canonical-validation` (sibling to `first-use-recursive-validation.md`; tentative title; Cal's 11:36 framing)
4. Brunel v0.7 §6.5 D8 cross-link async + #2 v0.2 ship cite-and-fold async (his cadence)
5. Optional T04 v1.3 path-string update if Cal's namespace gate reshapes `Projects/federation/observations/` family

[DISPATCH-POLICY-FOR-S28] Cal-bound submissions: dispatch direct first; if hits worktree-OUTBOUND mount-asymmetry mode (Sub-shape B per `worktree-spawn-asymmetry-message-delivery.md` filed by Cal 13:22), surface to team-lead for relay-on-behalf per Aen 13:30 codification. Brunel/Herald-bound (worktree → worktree): direct, working path.

[STANDING-FRAMING-PRESERVED]
- "Admission needs to commit, observation needs to caution" (Brunel 10:54) — load-bearing structural anchor for advisory-by-drift design
- "Asymmetries should live above the substrate, not in the substrate" (Herald S26) — framing that drift detection is a load-bearing test of, not an exception to
- Both carry forward to any future amendment

(*FR:Montesquieu*)

## Session 2026-04-10 — Discussion #56 (Single-Provider Model Strategy)

[DECISION] Single-provider is governance-optimal at 2-5 teams. Provider choice is Row 8 (technology stack) — L0/PO decision.
[PATTERN] Correlated failure: all 5 enforcement layers (E0-E4) depend on same provider. Provider outage collapses entire safety stack simultaneously. Gap in Emergency Authority Protocol — covers PO unavailability but not provider unavailability.
[PATTERN] Governance complexity scales non-linearly with provider count: 7 new governance requirements identified for even limited multi-provider adoption.
[PATTERN] Audit-provider separation is the one multi-provider pattern that reduces governance complexity (genuine audit independence). BUT requires audit calibration protocol — auditor on different provider cannot distinguish provider-specific idioms from governance violations without calibration.
[PATTERN] Sidecar integration (Eilama pattern) sits below governance layer — no authority level, no delegation matrix entry. Peer agent integration sits inside governance layer — must be accounted for in every authority decision. Integration seam determines governance impact.
[GOTCHA] Multi-provider even as sidecar-only still requires: credential isolation (T05), incident response protocol changes, PO authorization per Row 8. Team-leads may NOT experiment with alternative providers without L0 approval.
[LEARNED] Callimachus's Oracle classification concern strengthens E4 audit argument: knowledge quality degradation from provider heterogeneity weakens the audit enforcement layer, not just the knowledge layer.
[LEARNED] Celes's 53 agent prompts are governance assets encoding behavioral assumptions — porting is governance re-validation, not just prompt engineering.
[LEARNED] Herald's protocol interpretation variance adds third failure mode to audit: governance violation vs protocol bug vs provider mismatch. Ambiguity tax compounds with team count.
[DEFERRED] Provider outage emergency protocol — actionable consensus item from all 6 participants. Awaiting task assignment to draft T04 amendment.

(*FR:Montesquieu*)
