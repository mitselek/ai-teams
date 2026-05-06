# Team-Lead Scratchpad (*FR:team-lead*)

## SESSION 27 WRAP — 2026-05-06 (Phase B v1.0-final shipped end-to-end across 4 artifacts; substrate-failure landscape characterized)

**Goal (PO-set 10:42):** Activate Phase B; let Cal flush queue.

**Both objectives met substantially.** Phase B v1.0-final cluster shipped end-to-end across all four design artifacts; Cal queue flushed (14/15 effective + 4 inbound batch processed → 80 wiki entries net 77→80).

### Phase B v1.0-final cluster — fully closed across 4 artifacts

| Artifact | Final | Owner | Cross-citation |
|---|---|---|---|
| #1 federation-bootstrap-template v0.7 | EXECUTION-READY for n=2 (apex-research) | Brunel | Herald 04 + T04 §Authority-Drift |
| #2 authority-drift-substrate-instrumentation v0.2 | bidirectional cite-and-fold complete | Brunel | #1 + T04 + Herald 04 |
| Topic 04 §Authority-Drift Detection v1.2 | canonical detector-side surface | Monte | #2 + Herald 04 + Cal Protocol B |
| `mitselek/prism` PR #12 v0.1.1 (04-spec) + PR #13 v2.0.0 (R9-rule) | typed-contract canonical sources | Herald | #1 + #2 + T04 |

**Asymmetry framing anchor locked at T04 line 870:** *"admission needs to commit, observation needs to caution"* — both #2 design AND T04 detector-side surface use identical structural framing. Cite-and-fold cadence held end-to-end across all four artifacts.

**Cluster statistics:** 7 versions of #1 + 2 versions of #2 + 6 amendments to T04 + 2 PRs on Prism. **Zero abandoned drafts.** Clean acceptance-gate closure across all consumers (Aen, Brunel, Monte, Cal, Herald). ~80min cadence to v0.7 execution-ready; ~4hr full-cluster closure.

### Substrate-failure landscape — characterized end-to-end

[DECISION — session 27] **`substrate-invariant-mismatch.md` n=5 → n=6** with two named sub-shapes:
- **Sub-shape A:** read-cursor-skip on present-on-disk message (Monte→Cal 10:50 evidence chain by Monte 11:02)
- **Sub-shape B:** on-disk-absence (Brunel inbox JSON not updating; Monte's 11:08 + Brunel's 11:05 evidence)

**Same-root-cause-different-layer connection to Instance 1 (`dual-team-dir-ambiguity`)** — converts "n=6 unrelated instances" → "the defect class manifests at multiple layers of a single substrate." This is a stronger Protocol C argument than n-count alone.

[DECISION — session 27] **New wiki entry `worktree-spawn-asymmetry-message-delivery.md`** filed standalone (n=4 evidence). Hypothesis evolved through the session:
- Initial framing (n=2): worktree-OUTBOUND specifically broken
- Sharpened (n=4): non-parent-process → recipient unreliable across worktree boundary
- Final empirical (n=4 + Cal→Brunel intermittent at 12:54 BROKEN, 13:14 SUCCESS, 15:00 SUCCESS): **transient mount-staleness**, not persistent direction-asymmetry, not non-deterministic-race

**Operational workaround codified:** team-lead → recipient relay path (no-worktree → no-worktree consistently works). Used multiple times this session for Monte/Brunel/Herald → Cal Protocol A relays.

[DECISION — session 27] **Negative-evidence-as-positive-data folded into Sub-shape A prose** (Monte's diagnostic move): *"absence of Y (no eventual catch-up) is sharper diagnostic than observing X (the skip)"* — observed-absence-of-expected-recovery-signal rules out non-deterministic-iteration mechanism. Diagnostic-method articulation makes the entry useful beyond the specific failure-mode.

### Wiki productivity

- **11 new entries:** protocol-completeness-across-surfaces, lossless-independent-convergence, canonical-taxonomy-check-before-naming, timestamp-crossed-messages, semver-strict-typed-contract-discipline, substrate-shape-vs-authority-shape-orthogonality, field-level-overlap-one-truth-not-mirror, audit-trail-for-rejection-rationale, surfacing-cost-asymmetry-stale-context, snapshot-state-mis-names-path-to-end-state, api-gateway-error-vs-actual-server-state, worktree-spawn-asymmetry-message-delivery, discriminator-field-name-consistency-over-uniqueness, relay-to-primary-artifact-fidelity-discipline (renamed from initial `fold-only-what-is-verbatim.md`)
- **5 substantive amendments:** substrate-invariant-mismatch n=5→n=6 (with two-sub-shape framing + Monte enrichments + Brunel dual-witness), worktree-isolation n=2→n=7 (with dirty-main-worktree-bypass sub-shape + orthogonality cross-link), prompt-to-artifact-cross-verification (runtime-variants extension; n=2 cumulative on runtime-variant), worktree-spawn-asymmetry hypothesis-relaxation + INTERMITTENT data point, relay-to-primary-artifact-fidelity Stage 2 + recursive-validation Instance 4
- **2 sub-shape folds** into coordination-loop-self-correction (#32 + #3 as named variants)
- **4 Protocol B responses** (Monte 10:50; Brunel 11:05; Tier-0 substrate Qs; Brunel pushbacks at 12:54) citing 8+ wiki entries each
- **3 Protocol A acknowledgments** (Monte n=6 substrate amendment; Brunel consolidated relay-discipline; Herald two-instance amendment)
- **Filing-to-citation latency average ~25min** — Phase A discipline target hit at peak. Cal entries cited within ~25min by Monte design v1, Herald slot decision, Brunel v0.7 envelope shape

**Wiki count: 77 → 80** with substantive entry enrichment beyond raw count.

### Protocol C promotion candidates (4 surfaced for next-session cycle)

1. **`substrate-invariant-mismatch.md` n=6** with same-root-cause-different-layer connection to Instance 1 `dual-team-dir-ambiguity`
2. **`worktree-isolation-for-parallel-agents.md` n=7** with 5 work types + 4 specialists (Brunel + Monte + Herald + team-lead)
3. **`semver-strict-typed-contract-discipline.md` n=2** with PR #11 + PR #13 instances (both v→v2.0.0 SemVer-major bumps)
4. **`relay-to-primary-artifact-fidelity-discipline.md` n=4** with different-specialist criterion satisfied (Brunel two-stage lifecycle + Herald third-party + Cal recursive-validation Instance 4)

Cal will surface these on next scratchpad-prune cycle (S28).

### Eight discipline surfaces dogfooded through the cluster

1. Cross-read discipline (gate 2)
2. Cite-and-fold cadence (held end-to-end across 4 artifacts)
3. Production-rule application (Brunel's two self-corrections)
4. Worktree-isolation discipline (n=7 cumulative this session)
5. Strict-typed-contract-discipline (Cal n=2 promotion-grade)
6. Brief-frame gate-4 runtime-variant (Herald's two instances)
7. Discriminator-field-name consistency (Herald's §2.3 lock + Brunel's near-miss)
8. Primary-artifact-vs-relay-quote (Brunel's queue, Cal's recursive-validation Instance 4)

### LEARNED — session 27 meta-patterns

- **Cite-and-fold-discipline-absorbs-co-design** (when structurally sound). Brunel's 14:58 closing observation. Two retroactively-ratified co-design instances this run (10:54 Brunel-Monte registry handshake + 11:14 D5 reconciliation) — both produced structurally superior outcomes than two-independent-shipped designs would have. Compose-or-conflict gate is the structural test; discipline doesn't reject co-design, it rejects UNNECESSARY co-design.
- **Negative-evidence-as-positive-data** (Monte 11:36). Observed-absence-of-expected-recovery-signal is a sharper diagnostic than observing the symptom itself. Bayesian update via observed-not-Y. Folded into substrate-invariant-mismatch Instance 6 prose.
- **[CROSS-DETECTED] as session-pattern** (5+ instances). Cal's `timestamp-crossed-messages.md` filed at ~11:08 was dogfooded continuously for 2+ hours across all four agents. Operationally load-bearing.
- **Recursive-validation Instance 4** in `relay-to-primary-artifact-fidelity-discipline.md` — Cal's own ACK claimed a fold she hadn't yet executed; Brunel's cross-check caught the divergence; Cal applied Stage 2 supersession to her own ACK. Discipline catches its own authoring curator within minutes of filing — operational robustness by self-test.
- **Filing-to-citation latency <30min target hit recursively** as default. Phase A discipline target hit at peak.
- **Substrate-finding empirical rigor** — directional-asymmetry → INTERMITTENT-via-mount-staleness through three rounds of evidence-driven sharpening (n=2 → n=4 → n=4-with-mixed-outcomes).

### Tail-end items going into S28 (all non-urgent)

- **Brunel:** Topic 06 write-back (Volta-resume timing; Herald co-author offer); Cal worktree-asymmetry entry accuracy review (he's co-source-agent)
- **Monte:** Compound-signals v1.1 fold + Herald [COORDINATION]; single-channel-saturation-via-mode-partition Protocol A; recursive-citation-as-canonical-validation Protocol A
- **Cal:** 4 Protocol C promotion candidates (surface to me next prune); receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up
- **Tier-0 §3.4 questions** (PO escalation): (1) Brilliant pre-rejection attempt log existence; (2) append-only-additive contract on `WriteAccept`/`WriteRejection` envelopes — both PARTIAL per Cal's wiki Protocol B; PO escalation at session-tail
- **Topic-09 micro-fix** (deferred to Volta): line 761 `WikiProvenance` example needs `source-team` field added per S26 Protocol C #1 schema add
- **Volta NEXT-SESSION-CHOREs:** T06 path-tree rewrite + T04 path-tree audit (lines 528 + 1025 contradicting S5 #62 patch) + Topic-09 micro-fix

### Standing watch items going into session 28

- **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status
- **apex-research n=2 invocation** — first deployment of #1 v0.7 template beyond FR; convention re-test point per template's load-bearing test
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions

### Meta-observations from session dynamics

- **Cite-and-fold cadence as default operational mode.** All four design artifacts cross-cite each other; co-design instances absorbed via fold-not-revert. Phase A established the discipline; Phase B operationalized it as the default cadence.
- **Worktree-isolation n=7 cumulative** with mixed work types (1 Brunel branch + 4 Herald PRs + 2 Monte preempts) demonstrates the discipline scales structurally.
- **Substrate-failure-mode characterization** turned an obstacle into a wiki contribution. n=6 substrate-invariant-mismatch + new worktree-spawn-asymmetry entry + relay path operationalized = three artifacts produced from what would otherwise have been a friction point.
- **Agent-self-organization at session-tail** — Cal-Brunel recursive-validation loop happened entirely without team-lead intervention. Discipline-catches-discipline emergent.
- **Five+ in-session timestamp-crossed events** all surface-not-bridge resolved cleanly. Wiki entry filed at 11:08 dogfooded continuously through session-tail.

### NEXT-SESSION BOOT (re-orient instructions for S28)

1. Read `startup.md` first (always). Steps 1-5 (Sync → Reset team state → Restore inboxes → Spawn — wait for PO direction).
2. **Pull `mitselek-ai-teams` repo** for any Cal scratchpad updates.
3. **Pull `mitselek/prism` repo** if you want to read Phase A/B Prism artifacts (PR #12 + PR #13 + envelope contracts).
4. **Don't pre-spawn any agent at session start.** Wait for PO direction.
5. **If PO surfaces Phase C activation** (next federation expansion phase, e.g., new team joining via #1 v0.7 template at apex-research): spawn Brunel for federation-bootstrap-template invocation + Cal for namespace allocation + likely Monte for drift-detector deployment.
6. **If PO surfaces Volta-resume tasks:** spawn Volta for T06 path-tree rewrite + T04 path-tree audit + Topic-09 micro-fix. Three NEXT-SESSION-CHOREs queued.
7. **If PO surfaces TPS-583 progression** (Ruth signal): action Stage-2 standard moves.
8. **First operational item if Cal-spawning:** her queue is genuinely flushed; surface-grade work would be Protocol C draft authorizations on the 4 promotion candidates from S27 + receiver-side amendment to substrate-invariant-mismatch n=6 if eventual self-iteration catches up.

---

## SESSION 26 WRAP — 2026-05-05 (Phase A on Prism — federation substrate ratified end-to-end)

**Major outcomes:**

- **Codename "Prism" committed** (PO ratified mid-session). Optical lineage: Obsidian (volcanic glass) → Brilliant (cut diamond) → Prism (refractor — federation as one substrate, multiple per-team views).
- **`mitselek/prism` private repo bootstrapped.** Local clone at `~/Documents/github/.mmp/prism/`. Brunel handled bootstrap; root commit `2f26706`.
- **Phase A STRUCTURALLY FINAL** — 11 PRs merged on `mitselek/prism` main. Federation substrate primitives ratified into typed contracts. Envelope contract at v2.0.

**Architecture team activated this session** (Brunel, Monte, Herald) plus Cal + Finn carried.

### 11 PRs merged on `mitselek/prism` main

| PR | Author | Phase | Content |
|---|---|---|---|
| #1 | Brunel | A.1 | Topology + container posture + setup-blocked |
| #2 | Herald | A.1 | Deliverables A + B v1.0 (envelope + sync) |
| #3 | Brunel | A.1 | §3 namespace allocation (`fr/` + `Projects/fr/wiki/*`) |
| #4 | Monte | A.1 | Surface 2 v1.0 + v1.1 (write-block error semantics) |
| #5 | Herald | A.1 | v1.1 (Monte recovery shapes fold + R2 dispatch + Mod 2 retraction) |
| #6 | Monte | A.2 | Surface 1 M3 + Surface 3 DACI |
| #7 | Herald | A.1-fix | Stale table header |
| #8 | Monte | A.2-mod1 | sourceTeam dedup |
| #9 | Herald | A.3 | Deliverable C — two-pattern asymmetry decision matrix |
| #10 | Herald | A.3 | Envelope-v1.1 (CuratorAuthority required + integrated) |
| #11 | Herald | A.3 | SemVer bump 1.1.0 → 2.0.0 |

### Substrate primitives ratified into typed contracts

- **Hub-and-spoke topology** (FR-as-hub) + 4 documented growth triggers
- **Pull/poll sync mechanism** (Brilliant poll-only substrate, observed-fact)
- **`fr/` short-form namespace + `Projects/fr/wiki/*` placement** (Cal-curator sole-writer preserved)
- **Symmetric envelope, mode-by-content-category** (resolves two-pattern asymmetry structurally)
- **R2 sovereignty** (`producer.team === logicalPath.team`) as typed invariant
- **5-class WriteRejection enum** (closed) + sub-discriminator approach (`kind: "endpoint-unreachable" | "review-timeout"`)
- **CuratorAuthority discriminated union** required at v2.0 (`mode: "self" | "ratified-cross-team"`)
- **ProducerAction closed enum** (`wait-and-repoll | fix-and-resubmit | escalate-to-team-lead | escalate-to-governance | abandon`) — operationalizes no-fallback discipline as contract teeth
- **M3 federation-curators-as-class** (asymmetric DACI: methodology-target-decides + product-no-write-allowed + observation-target-decides)
- **§3.4 ratification protocol** preserves R2 by routing cross-team writes through target-curator's producer identity
- **Strict-SemVer for typed contracts** as precedent (migration mechanism makes bump SAFE; SemVer level reflects whether consumers must change code)

### Composite framing (Herald deliverable C §3-§5)

*"Substrate sees one substrate; asymmetry lives in interpretation, not in shape."* Three axes converge (envelope shape, sync mechanism, error-recovery family); two diverge (curation authority, reader cardinality). Composition produces federation that is simultaneously **open** (cross-team contribution allowed via ratification) + **sovereign** (R2 enforced for product) + **cheap** (substrate-level federation reads) + **auditable** (`CuratorAuthority` + `sourceTeam` make all attribution machine-checkable).

### Wiki contributions today (66 → 69)

- 66 `wiki/patterns/no-future-proofing.md` (n=many across sessions; promoted from user memory)
- 67 `wiki/patterns/dispatch-granularity-matches-recovery-handler.md` (n=1, watch)
- 68 `wiki/patterns/coordination-loop-self-correction.md` (n=2 promotion-grade)
- 69 `wiki/patterns/worktree-isolation-for-parallel-agents.md` (n=2 with Brunel first-person amendment; n=5 empirically by session-end)

[DECISION — session 26] **Phase A on Prism federation substrate complete at v2.0.** All design surfaces ratified. Substrate primitives become the typed contract foundation for the federation.

[DECISION — session 26] **Strict-SemVer-as-typed-contract-discipline ratified as precedent.** Migration mechanism (substrate-side backfill) is orthogonal to consumer's type-check work. Minor bump = strictly additive; major bump = type-checking changes for consumers. Source: Herald PR #11 §3.2.

[DECISION — session 26] **Branch+PR convention for Phase A+ design work.** Each agent ships a feature branch + PR; team-lead ratifies-and-merges per merge action. Reversible without history rewrite; supports composite review.

[DECISION — session 26] **Worktree-isolation as default for parallel agent work.** n=5 dogfooded today (Brunel + Monte preempt + Herald table-fix + deliverable C + envelope-v1.1 + SemVer bump). Memory rule `feedback_no_fallbacks.md`'s "use isolation: worktree" guidance is empirically validated. Apply from session 27 onwards by default for any parallel-specialist branch work.

### [LEARNED — session 26 cluster] (compress on next session-tail)

- **Cross-wires-in-flight is a structural reality at coordination tempo** (n=8 cumulative today: inbox-message crossings + git-state crossings + PR-merge-vs-cross-read crossings)
- **Surface-don't-bridge** ratified even with false-positive HOLD (Herald 16:38). Refinement: *"is this divergence likely to have been resolved by a message I haven't read yet?"* — re-process inbox first if surfacing-cost > re-read-cost
- **Cherry-pick is the recovery for committed-and-pushed-but-orphaned commits.** Stash applies only to uncommitted changes. Different recoveries for different states. (Herald correction of my 16:31 path-misnaming.)
- **Snapshot-state-at-ratification-time can mis-name the path-to-end-state** even when end-state is correct (my 16:38 stash-workflow misnaming)
- **Coordination-loop self-correction runs at coordination-tempo, not just session-tempo** (n=2 within-loop self-corrections in single 5-message exchange — Monte v1.0→v1.1 + Herald Mod 2 retraction)
- **Field-level overlap is a class-of-bug gate-2 catches reliably** — one field, one truth beats N fields with documented mirror invariant (Herald sourceTeam dedup catch)
- **Audit-trail-for-rejection-rationale paragraph** protects against future re-duplication (Monte §3.5 "Why sourceTeam is not duplicated here" cite-back)
- **Substrate-shape vs authority-shape orthogonality** (Monte M2 rejection) — *"topology design that conflates them imports the wrong failure mode"*
- **Asymmetries should live above the substrate, not in the substrate** (Herald deliverable C §3-§5 composition framing) — wiki-promotable, joint Herald-Monte
- **Pre-commit-to-extension shapes reviewer-vs-author dynamics favorably** (Herald's opening [COORDINATION] move) — even with retraction-strengthens-pattern irony
- **Protocol-completeness across surfaces** (Herald spotted, Monte named): every error-class escalation has a ratification path back to a legitimate write — n=1 promotion-grade
- **Dense correction clusters are a team-health signal** (Herald's session-tail observation: 5 within-loop self-corrections + 2 cross-team race-conditions + 1 false-alarm-with-recovery = working correctly)
- **504-then-success API-gateway-error-vs-actual-server-state** (Herald's gh pr create observation): *"API gateway errors are not necessarily request-failures; verify state before retrying"*
- **412w-scope-memo + 1300w-shipped-design cadence** (Brunel's discipline) is the right team-shape — tight scope, expansive design — held across all three architecture specialists
- **Eratosthenes-already-aligned** ([LEARNED] from this morning): cross-team consumer leading the team on schema. Inverse: when planning typed-contract change, if consumer NOT yet aligned, change is premature
- **n-axis discipline** for promotion: distinguish *instance count of pattern* from *cardinality of dimension you're claiming pattern across*
- **Meta-coordination has compounding-cost shape** (Monte's framing): paying it incurs setup; clearing it unlocks throughput multiplier — don't interleave
- **Filing-to-citation latency <30 min** today (Cal `poll-only-substrate-sidecar-derivation.md` filed and cited in alignment directive within minutes); *complete-enough-to-cite is the bar from minute one, not "we'll polish later"*

### [WIP — Cal Protocol A queue, ~13 patterns deferred to next session]

**Promotion-grade or n=2 cumulative:**
- #4 lossless-convergence Herald-Monte (joint, n=2 cumulative w/ session #59 — auto-promotes per Cal's schema-purity discretion: source-agents `[herald, monte]`, prose attribution to session-59 historical instance)
- #5 canonical-taxonomy-check before naming wrap targets (Monte, n=2 cumulative w/ session #59)
- #11 protocol-completeness-across-surfaces (Herald+Monte joint, promotion-grade by Herald's stated criterion)

**Watch (n=1):**
- #3 pre-commit-to-extension irony (Monte)
- #6b self-correction-via-prior-self-argument (Herald — currently parked as sub-shape of #68)
- #32 cross-specialist-argument self-correction trigger (Herald)
- #33 timestamp-crossed-messages (n=8+ cumulative today; split or merged at Cal's discretion — strong promotion candidate)
- #34 surfacing-with-stale-inbox + Monte's surface-bias-cost-asymmetry sibling
- #35 snapshot-state-mis-names-path-to-end-state (n=1, my path-misnaming)
- #40 504-then-success client-server temporal divergence
- #41 worktree-isolation amendment (Brunel + Herald n=5 today)
- #43 SemVer-strict-typed-contract discipline
- field-level-overlap one-truth-not-mirror (Herald, sibling to #67)
- audit-trail-for-rejection-rationale (Monte sub-shape, n=1)
- substrate-vs-authority-shape orthogonality (Monte M2 rejection, n=1) — promotable on next sighting
- asymmetries-live-above-substrate (Herald deliverable C composition)

Herald + Monte coordinated on submission split per 16:43 [COORDINATION]. Cal will dedup-merge per Protocol A step 5 if duplicates surface. Cal's scratchpad pruned to 73 lines with headroom for ~13 patterns; will likely re-prune mid-session 27.

### [WIP — Phase B (NOT STARTED)]

Wakes on PO direction. Three workstreams:

1. **Federation bootstrap protocol** (new team joining federation) — Brunel's domain. Likely shape per Brunel's preview: parameterize FR Brilliant MCP runbook over `<team>` + namespace claim; Cal-coordination per new team for namespace allocation. Convention re-test at n=2 (apex-research likely next).
2. **Authority-drift detection at federation scale** (n=20+) — Monte/Brunel joint. Substrate-side instrumentation; likely sidecar + cron-poll consistent with pull/poll sync.
3. **T04 topic-file amendment text** — post-Phase-A codification (Volta's chore from session 21).

### Standing watch items going into session 27

- **Trigger 1 (reverse spoke→spoke flow >2 teams within a quarter)** — empirical question that gates next topology decision (hub-and-spoke → hybrid trigger). FR session-tail responsibility, not Brunel's.
- **Topic-09 source-team example refresh** (Cal micro-fix, 5-line edit when convenient)
- **Source-team semantics extension watch** — needs n=2 *distinct deployments* producing observation-class entries before Protocol C extension justified (Cal's n-axis disambiguation)
- **TPS-583 watch** — Stage-2 actioning when Ruth signals (no change from session 22)
- **T06 path-tree rewrite** (Volta — pending from session 19/20)
- **esl-suvekool feedback loop** — when PO returns from Tobi sessions
- **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event
- **Ruth-team observability gap** — only on Ruth Q2/Q3 response

### Meta-observations from session dynamics

- **Decision-cadence chain unblocked specialists fast:** 16:11 sync directive (mine) → 16:22 namespace ratification (mine) → §3 ship same-day (Brunel). Each downstream unblock arrived within ~10 min of upstream decision.
- **Cross-wires count ended n=8** across mostly inbox-message and git-state crossings. The pattern itself became a team-health observation rather than a coordination failure.
- **Team-shape "412w scope-memo + 1300w shipped-design"** (Brunel observation) held across all three architecture specialists — tight scope, expansive design.
- **Worktree-isolation surfaced organically from a near-miss, not postmortem.** Brunel hit it first; Monte caught preemptively; Herald dogfooded n=5. Pattern landed at n=2 by session-end.
- **Agent reuse rule held:** spawned each architecture agent once at 16:11/16:12; kept them alive across phases A.1→A.2→A.3. No name-2 duplicates today.

### NEXT-SESSION BOOT (re-orient instructions for session 27 me)

1. Read `startup.md` first (always) — its #62 patch keeps Step 2 collapsed to `TeamDelete + TeamCreate + verify`.
2. Pull `mitselek-ai-teams` repo for any Cal scratchpad updates from agent-side persists.
3. Pull `mitselek/prism` repo if you want to read the canonical Phase A artifacts on disk; otherwise you can read this scratchpad's PR table and the prism repo lives.
4. Don't pre-spawn any agent at session start. Wait for PO direction. Phase B activation is the most likely next direction.
5. **If PO surfaces Phase B activation:** spawn Brunel + Monte. Herald wakes on demand for protocol contract questions. Cal carries.
6. **If PO surfaces something else entirely:** ask which team is needed. The framework-research team's standing work (TPS-583 watch, T06 path-tree, etc.) is all NEXT-SESSION CHOREs not blocking.
7. **First operational item if Cal-spawning:** her queue has ~13 pattern submissions to file. She can file early-session in idle cycles before any new design work blocks her.

---

## SESSION 25 WRAP — 2026-05-05 (Postgres-backed library service C-phase + reframed phase A)

**Goal (PO-set):** Thinktank library concept; PO playing with thought of Postgres DB backend + dedicated 24/7 library team for org-wide KB services, learning from Brilliant.

**Shipped:**

- **Issue #64** filed and closed with verdict (proceed to phase A). C-phase deliverable: `docs/2026-05-05-postgres-library-discovery-brief.md` + 5 input memos in `docs/2026-05-05-postgres-library-discovery/` (cal-internal-perspective, finn-brilliant-deepread, finn-staging-review-deepread, finn-polyphony-dev-glance, finn-haapsalu-suvekool-glance).
- **Issue #65** filed with reframed phase A scope (scaling esl-suvekool path-namespace pattern, NOT designing federation from scratch).
- **Two commits pushed:** `2abb1ad` session-24 wiki batch (+7 entries, contracts/ opened), `9407966` C-phase discovery brief.
- **Cal substrate-invariant-mismatch amendment** n=3 → n=5 with two new instances (teamcreate-leadership + Brilliant write-path-sync) — applied this session.

**Mid-session reframe (load-bearing):**

- Initial framing: "design federation layer over per-team markdown wikis."
- Finn's Haapsalu-Suvekool glance (after submodule pin updated to HEAD) revealed: **Topology B is OPERATIONAL REALITY at esl-suvekool today**, implemented as `Projects/esl/*`, `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*` — path-namespace per team inside shared central Brilliant. Convention IS the federation contract; no separate layer needed.
- Phase A scope therefore dropped from "design from scratch" to "scale proven pattern + Cal-as-namespace-curator role evolution."

[DECISION — session 25] **Topology B confirmed.** Per-team libraries + central federation, where federation = path-namespace convention inside shared Brilliant.
[DECISION — session 25] **No fallbacks.** If no curator team alive, Tier 3+ writes refuse with retry-when-up error. `ai_reviewer.py` removed regardless of curator-team shape. Memory feedback `feedback_no_fallbacks.md` extended with this case.
[DECISION — session 25] **Independence posture.** No fork of `thejeremyhodge/xireactor-brilliant`; learn-from only.

[LEARNED — session 25, integration-not-relay validation] **Bio-memory mismatch is real and verification discipline matters.** PO cited polyphony-dev as battle-proof for Topology B; actual battle-proof was Haapsalu-Suvekool. Finn's polyphony glance returned a clean negative — caught the mismatch before phase A scoped against the wrong reference. Wiki #44 doing its job: verify substrate claims against the actual substrate before downstream design depends on them.

[LEARNED — session 25] **Submodule pin staleness silently misleads.** `.mmp/ESL/Haapsalu-Suvekool` was pinned to commit pre-dating the Brilliant integration. Quick grep on pinned content returned stale negative; updating to HEAD revealed 20+ refs. Always verify submodule pin freshness before trusting absence-of-evidence.

[WARNING — session 25] **Brilliant memory was wrong** (paertela6-only claim from prior session). Verified truth: per-team MCP config governs access, FR currently does NOT have it configured; esl-suvekool does. Memory file `reference_brilliant_mcp.md` rewritten with operational discipline (Brilliant pulse, quality floor, two-consumer pattern, source-of-truth principle).

**Wiki pattern candidates queued for next Cal Protocol A batch (six new from C-phase + two carried):**

1. OSS thin-integration anti-extension signal (Finn, n=1)
2. Poll-only-substrate + sidecar-derivation as event-driven shape (Finn, n=1)
3. Soft-verdict discipline on substrate-mapping briefs (Finn meta-process catch, n=1)
4. Cross-repo glance: confirm citation before assuming inheritance (Finn, n=1)
5. Path-namespace as federation primitive (Finn, n=1 esl-suvekool)
6. Two-consumer pattern: direct-MCP vs synthesized-snapshot (Finn, roadwarrior-sync skill, n=1)
7. (Carried from session 24) `source-team` frontmatter promotion to standard schema (n=2 — Cal Protocol C draft authorized but deferred)
8. (Carried from session 24) architectural-fact convention promotion to Cal's prompt (n=3 — Cal Protocol C draft authorized but deferred)

[DEFERRED — to next session] **Cal Protocol C drafts (2 items).** Bigger work, benefits from fresh context. Authorizations stand.

[DEFERRED — to next session] **Cal Protocol A batch on the 6 new candidates.** Should be batched together with the session-24 carry candidates.

## NEXT SESSION — phase A primary, plus deferred housekeeping

1. **Phase A on issue #65** — scale esl-suvekool path-namespace pattern. Setup (FR Brilliant MCP config, namespace allocation rules) + research (dedup census, cross-team query frequency) + design (Cal's role evolution, multi-reviewer schema, orchestration shape, signal derivation rules, write-block error semantics). Phase A team: Cal+Finn carry, add Brunel/Monte/Herald.
2. **Cal Protocol C drafts** — `source-team` to standard schema; architectural-fact convention to Cal's prompt.
3. **Cal Protocol A batch** — 8 candidates queued.
4. **TPS-583 watch** (no change) — Stage-2 actioning when Ruth signals progression.
5. **T06 path-tree rewrite** (Volta, no change).
6. **esl-suvekool feedback loop** (no change) — when PO returns from Tobi sessions.

If PO arrives with direction, that takes priority.

---

## SESSION 24 WRAP — 2026-05-04 (Cal wiki batch)

**Goal:** Route 7 wiki candidates parked from sessions 21-23 to Cal via Protocol A batch.

**Shipped (commit `2abb1ad`):**

- 7 wiki entries filed (52 → 59 entries).
- First `contracts/` subdir entry opened (speculative-marker-for-cross-team-drafts).
- 1 classification delta accepted: operational-team-archetype filed under `patterns/`, not `process/` (Cal's call — team-shape ≠ workflow; sibling precedent at multi-repo-xp-composition + cathedral-trigger).

**Promotion candidates surfaced and authorized:**

- `source-team` frontmatter → standard schema (n=2, Protocol C draft) — DEFERRED, carried.
- Architectural-fact convention → Cal's prompt (n=3, Protocol C draft) — DEFERRED, carried.
- `substrate-invariant-mismatch` n=3 → n=4 amendment — DEFERRED, eventually landed session 25 as n=5 (with Brilliant write-path-sync added).

[LEARNED — session 24] **Re-classify discipline accepted.** When pre-classifying submissions, default to suggestions-not-directives; let Cal use sibling precedent. My pattern/process/ disagreement on operational-team-archetype was where Cal's substrate knowledge beat my mental model.

---

## SESSION 23 WRAP — 2026-05-01/02 (esl-suvekool team designed + deployed)

**Goal (PO-set):** Design a new team to support PO in organising ESL Haapsalu Suvekool 2026 (concert 2026-08-16, Haapsalu Toomkirik). PO's role is gap-filler supporting Liisa Rahusoo (board lead).

**Shipped:**

- **8-file onboarding package** designed by Celes, deployed to `mitselek/Haapsalu-Suvekool` repo at `teams/esl-suvekool/`. Three commits: `d0526ee` (bootstrap), `f65fb2a` (startup amendment — TeamCreate + S5 added), `0e461be` (`.claude/startup.md` repo-root hook for fresh-session ergonomics).
- **Team architecture (Option C, Cathedral-lite-adapted, all opus-4-7):** Tobi (Rudolf Tobias, TL+timeline owner), Lyyd (Lydia Koidula, Estonian scribe + stakeholders.md gate), Saar (Mart Saar, logistician — Carus-Verlag tellimus is task-1 day-1), Tamp (Herbert Tampere, musicologist — singer-prep + kavaleht + listening guides for Zelenka/Hasse/Vivaldi).
- **Mission framing locked (PO confirmed):** "load-shed Liisa via Mihkel as liaison, succession-readiness baked in" — NOT "help Mihkel organise." Liisa announced board departure for Jan 2027 (or Apr 2027). Every artifact designed for the next Suvekool lead (not Liisa, not Mihkel).
- **First session of esl-suvekool started by PO same evening** (in separate Claude session, Haapsalu-Suvekool/ workdir; .claude/startup.md hook auto-bootstrapped Tobi). Confirmed engaged 2026-05-02.

**Workflow shape (reusable for future team designs):** PO intent → Aen brainstorming (work-types, architecture options) → spawn Celes for opinion → Celes Brilliant query for substrate → architecture + naming + workdir options → PO 4 decisions → Celes drafts package → Aen TL review → PO approval → Aen deploys (commit + push to target repo) → bootstrap hook → PO opens fresh session.

[LEARNED — substrate, promotion-grade]

- **Operational team archetype introduced** — first-of-its-kind in our corpus. Differentiators: no tdd-pipeline, succession-framing first-class, low-volume cadence (1-3x/week), persistent-roster-episodic-sessions. Wiki candidate (n=1, watch). Promotion trigger: a second similar team (non-code, multi-month, persistent roster) requesting same shape.
- **`.claude/startup.md` at repo root as fresh-session bootstrap hook** — novel pattern. Lets PO open Claude in a workdir and the assistant auto-identifies as the team-lead persona, reads team config, runs startup. Cleaner than expecting PO to type bootstrap incantations every session. Wiki candidate (n=1, watch).
- **Mutual exclusivity of team-leadership prevents in-session cross-team spawning** — confirmed empirically. Designing-team-Y from session-leading-team-X works; spawning agents into team-Y from team-X session does NOT (Agent tool with team_name=Y requires team-Y already TeamCreate'd, which conflicts). Solution: deploy team-Y artifacts + .claude/startup.md hook, hand to PO for fresh-session start.
- **API key in cleartext caught by Celes during toolkit read** — surfaced 5-file exposure (README + BACH-TOOLS-GUIDE) + `client_secret.json` filename in `mitselek/Haapsalu-Suvekool`. PO rotated same session: new key 35178654-…, old key e8cc9b68-… soft-deleted (30-day undelete window until 2026-05-31), 4 docs cleaned to `YOUR_API_KEY_HERE`, .env gitignored, .env.example added, history rewritten (HEAD c082fd9 → 0e461be), 67 files redacted (47 VSCode + 2 gcloud + 18 misc), local git GC pruned. Substrate finding: when reading any external repo as part of team design, do a credentials sweep early.

[LEARNED — process]

- **Celes wrote outside stated MAY-WRITE area** (designs/new/ at FR repo root, vs prompts/ in her permission block). Aen supported the call — staging at repo root is more discoverable than mixing into prompts/. Flagged in her scratchpad as [PATTERN]: when designing teams that LEAVE framework-research, staging area = FR repo root, not under FR's own teams/. Future-Celes shouldn't relitigate.
- **Celes's "lean startup" omitted TeamCreate bootstrap** — caught at deployment review. Lean is right principle, but TeamCreate is table stakes (not trauma history). Aen amended startup.md with FR's #62 patch pattern: `TeamDelete + TeamCreate + verify` at start, `TeamDelete()` at end. Lesson: when collapsing a checklist, distinguish "always-needed primitives" from "scar-tissue defensive steps." FR's S5 (#62 patch) is the right model — concise but complete.

**Wiki candidates held (Cal Protocol A on next Cal spawn) — 2 from session 23 + 5 carried from sessions 21/22:**

Session 23 new:

1. **Operational team archetype** (no tdd-pipeline, succession-first, low-volume cadence) — n=1, watch.
2. **`.claude/startup.md` repo-root bootstrap hook** for cross-team handoff — n=1, watch.

Carried from session 22 (4) + session 21 (1):
3. Two-stage adoption pattern (proposal-space → escalation → canonical-org-space) — substrate-relevant for future standards.
4. `[speculative]` marker convention for cross-team handoff — defines "this is inference, please confirm."
5. Confluence space create-perm-as-404 disguise — gotcha-shape.
6. EntraID-not-WSO2 — substrate-fact for EVR docs.
7. (Carried from session 21): "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR. **Empirically reinforced this session** by esl-suvekool's session-1 not needing recovery (S5 worked here at end of session 22, then again at start of session 23).

[DEFERRED — pending Tobi's first-week activity]

- **Watch esl-suvekool session 1 outcomes** — did Saar produce Carus-Verlag draft? Did the bootstrap hook surface any issues? Did Tobi register session-1 [LEARNED] worth bringing up. PO will tell us; do not poll.

## NEXT SESSION — TPS-583 watch primary (no change from session 22)

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 7 wiki candidates: 2 from session 23 (operational-team-archetype, .claude-startup-hook) + 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + 1 carried from session 21 (in-memory-survives-`/clear`, now n=2-empirically-reinforced).
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict S5 (#62 patch).
4. **esl-suvekool feedback loop** — when PO returns from Tobi's session(s), absorb any [LEARNED] worth promoting upstream.
5. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
6. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## SESSION 22 WRAP — 2026-04-30 (EVR konteinerite standard shipped: Stage-0 + Stage-1)

**Goal (PO-set):** Push hello-world-container PoC through corporate pipeline; end with adopted "EVR sisene konteinerite standard" + Jira intake protocol for ad-hoc dockerised installations at EVR.

**Shipped:**

- **Stage 0:** Standard published as Confluence page id `1713864752` ("EVR sisene konteinerite standard") in **D365 space** (temporary — V2 has restrictive create-perm; only Ruth as space owner can move/create). Banner-marked "Ettepanek — ootab ITOps poolt vastu võtmist". URL: `https://eestiraudtee.atlassian.net/wiki/spaces/D365/pages/1713864752/EVR+sisene+konteinerite+standard`
- **Stage 1:** Tracking issue [TPS-583](https://eestiraudtee.atlassian.net/browse/TPS-583) posted, assigned **Ruth Türk**. 4-step Stage-1 ask: move D365→V2 → review → escalate → identify subteam. RFC #2 close-bridge embedded in acceptance criteria.
- **Drafts in `docs/`:** `evr-sisene-konteinerite-standard-v0.1.md`, `evr-konteinerite-intake-template-v0.1.md`, `evr-konteinerite-tracking-issue.md`, plus harvest doc (Finn pruned 240→92 lines), audit reports (Medici pass 1+2), proposed-diff doc (Brunel pass 2 review surface).

**Workflow shape (reusable for future ad-hoc standards):** Finn harvest (RFC ref + repo state + Confluence space landscape + mirror target) → PO 4 confirms (home / Jira project / title / placement) → Brunel drafts (3 artifacts mirroring chosen reference) → Medici audit → revisions → Medici re-audit → propose-diff review → apply → Stage-0 publish → Stage-1 post.

**`[speculative]` markers convention introduced** — flag Brunel inferences, container-adaptations of Linux-standard patterns, RFC #2-derived RACI as draft-state. 16 surviving markers in standard, 2 in intake, 2 in tracking. Stage-1 reviewers scan as confirm/adjust points.

[LEARNED — substrate-level findings, multiple promotion-grade]

- **V2 Confluence space create-permission restricted to space owner (Ruth)** — affects ALL future publish flows from non-owner team members. Workaround: publish in PO's permitted space (D365 here), Ruth moves to V2 as Stage-1 step. Wiki candidate.
- **TPS Jira project rejects Task issue type, accepts Story** — workflow quirk; Story has same hierarchy level (0) and works. Worth noting for future TPS posts.
- **EVR's actual SSO is EntraID (Microsoft Azure AD), NOT WSO2.** WSO2 is the integration platform (Micro Integrator for TAF/TAP message routing). Cited via FSM page `536248326` (UAM SSO) + INFOSEC page `851607559` (Delinea SSO). Brunel verified — corrected my hedge during the IAM/PAM ripple. Wiki candidate (substrate-fact for EVR docs).
- **`createConfluencePage` MCP returns 404 on V2** (likely permission-as-404 disguise; Atlassian obscures permission denial behind 404 for security best-practice). Wiki candidate (gotcha-shape).
- **Mirror target: Roland Kilusk's "EVR sisene Linux standard"** (page `1335984130`, ITOps space `I`). Title format `EVR sisene <X> standard`, ~700-1000w single-ET prose, EN product nouns inline, no parallel EN, Tier 0/1/2 classification, no frontmatter, exception-doc in preamble. Peer: BYOD standard. **Tier-numeral inversion vs intuitive (Brunel's call):** Tier 0 = highest sensitivity (production-adjacent), Tier 2 = lowest (≤4-week PoC). Matches Linux standard convention.

**Wiki candidates (Cal Protocol A on next spawn) — 4 from session 22 + 1 carried from 21:**

1. **Two-stage adoption pattern** (proposal in own/permitted space → escalation → canonical org space) — substrate-relevant for future standards.
2. **`[speculative]` marker convention for cross-team handoff** — defines "this is inference, please confirm" without breaking flow.
3. **Confluence space create-perm-as-404 disguise** — gotcha-shaped, useful pattern.
4. **EntraID-not-WSO2** — substrate-fact for EVR docs going forward.
5. **(Carried from session 21):** "In-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team apex+FR.

[DEFERRED — Stage 2 ahead] Pending Ruth's escalation outcome via TPS-583:

- Move D365 page to V2 (Ruth's Stage-1 step 1; she has space-owner perms)
- Standard v0.1 → v1.0: banner removed, receiving role baked in
- Page moves V2 → ITOps space `I` (peer to Linux + BYOD)
- Close TPS-583
- Close RFC #2 (`Eesti-Raudtee/hello-world-container` PR #2) review status (PR stays open with `do not merge` flag, just review-status closed)

**Auth note:** Atlassian plugin OAuth (claude.ai/Atlassian) authenticated this session — read+write scopes for Confluence + Jira at cloudId `2309a7c9-1d93-47a4-80ef-ab7f528cbb77`. Token persists session-level; re-auth needed at next session start.

## SESSION 21 WRAP — 2026-04-30 (#62 patch shipped, new shutdown S5 dogfooded)

**#62 from apex-research/Schliemann** filed AS REFERENCE for FR — proposed startup/shutdown collapse based on apex session 23 in-memory-survives-`/clear` failure. Volta assessed; adopted with one modification (kept R4-3 operational gate as Step 2b — verify-on-disk is independently load-bearing, not just retry-loop scaffolding).

**Empirical confirmation (n=2 cross-team):** This session's startup hit the exact failure mode. `rm -rf "$TEAM_DIR"` ran clean, then `TeamCreate` returned "Already leading team. Use TeamDelete to end..." Recovery required `TeamDelete + TeamCreate` anyway. Same pathology Schliemann reported.

**Patch committed (`426194d`):** `teams/framework-research/startup.md`

- Steps 2 (Diagnose) + 3 (rm -rf Clean) + 4 (Create + retry block) → single Step 2 (Reset team state): `TeamDelete + TeamCreate + verify`. Recovery primitive hoisted to top of every startup instead of branched into on failure.
- Step 4b (operational gate) → Step 2b. The verify-on-disk check IS the gate.
- Steps 5/6 → 3/4.
- New Step S5 (Release team leadership): `TeamDelete()` after final `git push`. Nulls in-memory state on graceful exit; next session's `/clear` startup needs no recovery.
- Gotcha #3 updated (now references Step 2 verify, was Step 4).
- New gotcha #4 documents "in-memory team-leadership state survives `/clear`".
- Old R7 Note "S5 removed because runtime is ephemeral" replaced with corrected explanation: runtime *dir* IS ephemeral; parent CLI's in-memory leadership state is NOT.

**Cross-team:** Comment posted on mitselek/ai-teams#62 (`issuecomment-4350394024`) with FR-side confirmation, commit link, evidence correction (FR retry block was n=1, not n=0 — Restart 4 hit it).

**Volta's [LEARNED] — wiki promotion criterion:** "Cross-team gotcha promotion: when one team observes a failure mode and fixes it, second-team confirmation (n=2) is the trigger to elevate from team-local doc to wiki-level pattern. Schliemann's #62 + this session's startup is the canonical pair."

**Wiki candidate held (Cal Protocol A on next spawn):** "In-memory team-leadership state survives `/clear` independently of disk" — substrate-relevant, gotcha-shaped, n=2 cross-team. Cal not spawned this session.

**This shutdown is first to use new S5** — dogfooding the patch. Next session's startup runs 5 logical steps not 8, with no in-memory recovery branch.

## NEXT SESSION — TPS-583 watch primary

1. **TPS-583 watch** — when user signals Ruth has progressed (subteam identified, page moved to V2, or both), action Stage-2: page moves V2→ITOps `I`, banner removed, v1.0, intake-template assignee filled, close TPS-583, close RFC #2 review-status.
2. **Cal spawn (when next needed for wiki work)** — route 5 wiki candidates: 4 from session 22 (two-stage adoption, `[speculative]` marker convention, create-perm-404 disguise, EntraID-not-WSO2) + carried session-21 in-memory-survives-`/clear`. All via Protocol A.
3. **T06 path-tree rewrite (Volta)** — also scoped to fix DO-NOT-TeamDelete contradictions on T06 lines 528 + 1025 that contradict new S5 (#62 patch).
4. **Aalto/uikit-dev cross-team debt** — only on uikit-dev contact event.
5. **Ruth-team observability gap** — only on Ruth Q2/Q3 response.

If PO arrives with direction, that takes priority.

## NEXT-SESSION-CHOREs (still active)

- [ ] **TPS-583 status check + Stage 2 actioning.** When Ruth has identified ITOps receiving subteam (or moved page), action: page V2→`I` move, banner removal, v1.0 promotion, intake assignee bake-in, close TPS-583 + RFC #2 review-status.
- [ ] **Cal session-22 wiki candidates (4) + session-21 carry (1).** 5 promotion-grade candidates: two-stage adoption pattern, `[speculative]` marker convention, Confluence create-perm-404 disguise, EntraID-not-WSO2 substrate-fact, in-memory-survives-`/clear`.
- [ ] **T06 Path-tree rewrite (Volta).** `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree needs rewrite for Agent-tool spawn (post-#60). Herald's `agent-spawn-protocol.md` defines the shapes each path uses; Volta's rewrite references them. T03/T06 boundary named clearly (Herald session-19 [LEARNED]): "protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." **Session 21 addition:** also audit T06 lines 528 + 1025 for "DO NOT TeamDelete" assertions that contradict new shutdown S5 (#62 patch).
- [ ] **Cal: route in-memory-survives-`/clear` wiki candidate** (#62-derived, n=2 apex+FR) on next Cal spawn via Protocol A. Volta's session-21 [LEARNED] is the source — promotion-grade.
- [x] ~~Finn scratchpad prune (~190 lines → target 100)~~ — DONE this session, 129→98 lines, pointer block preserved.
- [ ] **Brunel: fix stale port 2224 in ruth-team container doc.** `docs/ruth-team-container-design-2026-04-15.md` has port 2224 but `deployments.md` already allocates entu-research:2224. 1-line fix, assign to Brunel on next ruth-team task.
- [ ] **Brunel: `tmux-spawn-guide.md` retirement decision** — currently banner-gated; Brunel's call on whether to delete outright. Parked DEFERRED per session 19.
- [ ] **Eratosthenes symmetric prompt edits — tmux-direct to Schliemann.** WITHDRAWN if Schliemann's apex shutdown persists. Preserved here only because the pattern (multi-mode-defenses + bootstrap-preamble-as-cross-tenant-channel wiki candidates) is substrate-independent — if revived under a new pilot, the structure carries forward.
- [ ] **Brunel n=2 watch.** Two RC-infra gotchas at n=1 watch posture: (a) `gh` not installed on RC host (only inside containers), (b) CRLF/LF reflow noise on apex-migration-research files (need `git diff -w` to evaluate "is diff substantive"). Promote to wiki on second sighting of either.

## META-LEARNINGS — carry forward

[LEARNED — session 20] **Path-depth transcription discipline on cross-pollination relays.** When relaying a structural example (path templates, code snippets, frontmatter schemas) from another team's wiki to ours, copy verbatim or include the on-disk path so the librarian can verify against source. Never paraphrase example bodies. Hit this turn: my relay of apex's `wiki-cross-link-convention` table compressed `../../../../decisions/...` (4 dots) to `../../../decisions/...` (3 dots). Cal caught it by using apex's actual on-disk values rather than trusting prose. Fix is mine, not Cal's: the protocol-A-relayer's responsibility is to transmit faithfully, not to shorten.

[LEARNED — session 20] **Multi-edit Read-before-Edit constraint requires per-message serialization.** Cal hit it 4 times today — queueing several Edits in parallel within one message only the first lands; each Edit invalidates the file's tracked-read-state. Librarian-side operational rule for now (Cal's scratchpad), n=1 librarian. If a future librarian replication or batch-wiki-edit agent hits the same shape, promotion-grade. Symmetric rule for me: when amending wiki entries via Cal, scope the request to one entry per message OR explicitly flag "serial edits expected."

[LEARNED — session 20] **`autossh -M 0` is necessary but not sufficient for Windows persistent bridges.** autossh treats child ssh exit code 127 as fatal and gives up — unrecoverable without external supervision. Pattern fix: wrap autossh itself in a retry loop (`while true; do autossh ... || true; sleep 10; done`) inside the wrapper script. Filed as wiki #46 amendment (5→6 components) same day.

[LEARNED — session 20] **Long-running Task Scheduler actions need wscript+VBS hidden launchers.** Direct invocation of bash.exe (or any console binary) under Win11 Task Scheduler with Windows Terminal as default console host opens a visible window that lingers for the action's lifetime. Filed as wiki #46 component #6.

[LEARNED — SEVERE, user-flagged, preserve verbatim] **§10 oscillation was substrate-speculation dressed as reasoning.** User's framing: *"the oscillation between you two was self-inflicted and you ran in circles, Brunel had couple of your self-corrections all the time enqueued and he again self-corrected against your self-corrections. so actually we don't have a clue about which result is correct."* The honest state: 7 revisions traded framings without either specialist doing the empirical check. Meta-discipline became a thing we performed INSTEAD of thinking. Fix: when the landing oscillates, ask *"what new evidence would settle this?"* — if the answer is "source-code read," it's outcome (c), not a reasoning problem. See wiki #44 meta-trap section.

[LEARNED] **integration-not-relay pattern (wiki #44)** — team-lead's job is integration, not relay. n=4 in one session (Tier 3 endorsement, schema-per-tenant snapshot-cite, Protocol D phantom-acceptance, §10 framing ask). Four-check discipline: walk-history-forward, pending-confirmation-vs-accepted, integration-not-relay, what-would-change-the-landing. Specialist-side complement: pre-fold consistency check (Brunel). Bidirectional integration checking.

[LEARNED] **Outcome (c) generalized definition** (Herald's sharpening): *"Outcome (c) is not 'we've thought about it enough,' it's 'we've exhausted what the current evidence can tell us and need new evidence.' The test is 'what new input would change the landing?'"* — applies across evidence types.

## STANDING DECISIONS

[DECISION — session 21] **#62 startup/shutdown patches adopted.** Steps 2/3/4 collapse to single `TeamDelete + TeamCreate + verify`; new Step S5 `TeamDelete()` after `git push`. Gotcha #3 updated, #4 added. Source: apex-research/Schliemann's #62, FR session-21 startup empirical confirmation (n=2 cross-team). T06 amendment (lines 528 + 1025 contradict new S5) batched with path-tree-rewrite chore, not new task.

[DECISION — session 20] **Cross-team wiki cross-references use GitHub URL form**, not repo-relative paths. Within our wiki, relative paths preserved (existing). For cross-team `related` frontmatter and prose links to apex/comms-dev/etc: default `https://github.com/<org>/<repo>/blob/main/<path>`; switch to `/blob/<sha>/<path>` when freezing a cross-cite is load-bearing (e.g., apex amends their entry and we want our cross-cite to remain literal to what we read). Path-depth assumptions (4-levels-deep math) hold within a team's wiki layout but break across teams' layouts. First applied on entry #50.

[DECISION — session 20] **Slow organic compliance for wiki-cross-link-convention** (entry #50), not a big-bang retrofit sweep. Apply on amendments going forward. Bare-text references in our existing 49 entries are suboptimal but not broken; Brunel's bandwidth stays on container-infra. Revisit only if a real query failure surfaces (reader can't find a referenced artifact) — that's the trigger to rethink, not aesthetics.

[DECISION — session 20] **Four single-entry frontmatter/structural experiments active under Cal's curation, all n=1, watch posture.** None promoted yet. If a second case requests the same shape, surface for hoist decision:

1. Amendment-log body section on #46 (windows-user-context-persistent-bridge)
2. `source-team` frontmatter field on #50 (wiki-cross-link-convention)
3. `provenance-closed` frontmatter field on #48 (live-inject-plus-dockerfile-bake-dual-track)
4. `amendments` frontmatter list on #50 (introduced incidentally during cross-team link form rewrite)

[DECISION] **xireactor-as-shared-KB (#59) parked standalone.** Counter-option preserved: Finn-style quarterly cross-team harvest passes (same info flow, markdown preserved). Pilot-eval proposal: 2 tenants (FR + apex-research) for 1 month cross-team traffic. Fits E-deployment pattern. Full team needed for ecosystem-integration session.

[DECISION] **E-deployment pattern** (CF Tunnel / hello-world-container) adopted as future target for ALL team deployments including migration. Near-term ruth-team = (B) co-located on `100.96.54.170`. Migration B→E is explicit future work — no dates. Ruth-team container MUST be portable.

[DECISION] **Sensitivity boundary** for ruth-team: `.gitignore` excludes `teams/*/sensitive/`. Patterns flow via Protocol A but generalize heavily — no direct quotes, no Jira tickets, Confluence titles, budget figures, or colleague names. Codename `ruth-team` acceptable inside FR only.

[DECISION] **Ruth-team: Brunel v1.0 accepted** at `docs/ruth-team-container-design-2026-04-15.md`. Build blocked on Monte §4.3 + Herald §5.3 open questions. Near-term channel = SSH + tmux pane.

[DECISION] **Protocol D naming ACCEPTED.** Herald v1.2.1 rename pass next session: (i) §2.2 introduce Protocol D, (ii) §5 mapping + §7 cross-refs, (iii) frontmatter note citing Monte Argument 1 (canonical taxonomy slot), (iv) `types/t09-protocols.ts` interface comments.

[DECISION] **Herald Q1/Q2 preconditions at outcome (c)/(c).** Both digest-silent, resolve via Finn source-code walkthrough only. Monte v3 §7.2 reclassification needs rework (built on retracted Herald v1.1 §A evidence). Compressed state: two design preconditions are empirical questions not yet answered; pilot-readiness honest-story = "two source-code walkthroughs + one deliverable."

## OPEN DESIGN QUESTIONS

- Cross-tenant URGENT-KNOWLEDGE routing authority (Monte/Herald future pass)
- MCP tool availability fallback: fail-closed (team-lead + Herald + Cal converged)
- §9.2 design probes: Tier 3 bounce-vs-escalate rejection format, structured-vs-free-text

## ACTIVE WIP

[WIP — session 21] **Cal wiki candidate held:** "in-memory team-leadership state survives `/clear` independently of disk" — n=2 cross-team (apex session 23 + FR session 21). Promotion-grade per Volta's n=2 criterion. Route on Cal's next spawn via Protocol A.

[WIP — session 20] **Three apex-research cross-pollination candidates from Finn's 2026-04-29 comparative analysis.** Status:

- ✅ `wiki-cross-link-convention` → filed as #50 with cross-team link form policy decision baked in.
- ⏸️ `adr-accepted-pending-prereqs-status` (three-state ADR flow) — parked, our ADR cadence is too light to bind on this. Revisit if we ever spin up an ADR practice.
- ⏸️ `silence-gap-helpdesk-vs-jira` (two-track prioritization) — parked, no helpdesk surface. Revisit if one materializes.

[WIP — session 20] **Brunel n=1 watch on two RC-infra gotchas.** `gh` not on RC host (only inside containers); CRLF/LF noise on apex-migration-research files (use `git diff -w` to evaluate diff substantiveness). Promote to wiki on second sighting of either. Carry forward into NEXT-SESSION-CHOREs.

[WIP] **Persist-coverage F/D split** (PO-approved 2026-04-14). Fix session: F1 jq filter extraction (Volta), F2 "memory"→"auto-memory" rename (Volta+Cal). Design session: D1-D7 full persist-coverage ship. Sources: `docs/persist-coverage-audit-2026-04-14.md` + `docs/uikit-dev-harvest-2026-04-14.md`.

[WIP] **Structural-discipline cluster Protocol C promotion.** 4 confirmed + 1 pending (Brunel's prompt-to-artifact cross-verification). Defer to session with Brunel spawned.

[WIP] **Cal wiki queue — 12 n=1 candidates held.** Full list in `memory/callimachus.md` session 14 [DECISION] block. Highest-watch: multi-mode-failure-multi-mechanism-defenses (possible n=2 with Volta's persist/restore), Bootstrap-preamble as cross-tenant channel (n=2 with existing #43, possible amendment not separate entry).

[WIP] **Cal post-freeze candidates from Finn harvest:** (1) Pane-labels gotcha addendum (root-cause confirmation, not n=2), (2) Memory-as-load-gated-surface pattern, (3) Wiki governance model split (project-handbook vs methodology-kb).

[WIP] **Aalto open questions** — 6 questions deferred (Finn Section D). Priority: Q1+Q4 highest (scaling evidence), Q6+Q3 medium, Q2+Q5 lower. Route subset via tmux-direct when next uikit-dev contact warranted.

[WIP] **Ruth-team observability gap.** Brunel's v1.0 is purely operational; dual-track (operational + research probe) needs Volta's §6.5 observability addendum. Gated on Ruth's Q2/Q3 answers — her answer reshapes telemetry surface ("weekly digest" ≠ "live interaction"). Do NOT wake Volta before Ruth responds.

[WIP] **Ruth-team: path (a) partial state.** Ruth received Teams relay, responded with one clarifier ("what is OKR?"), operator answered. Q1 (opt-in), Q2, Q3 still pending. Do NOT wake Celes/Volta speculatively — only after Q1 answer arrives.

## DEFERRED

- **Phase 2 Jira/GitFlow classification** — held pending PO reconciliation via dev-toolkit#43.
- **Discussion #56 actionable items:** Provider outage protocol (Monte, T04); Sidecar/peer framework (Brunel+Monte, T06); Contract enforcement (Herald); Platform/provider separation (Finn, T02).
- **Pass 2 filename rename** for `wiki/gotchas/persist-project-state-leaks-per-user-memory.md` — Cal inventoried 7 back-refs; ship as coordinated batch when warranted.
- **uikit-dev cross-team debt** — their `1deb90e` uses defective free-string jq pattern. Tmux-direct relay to Aalto deferred; bundle with Finn Section D questions.
- **MS Teams integration** (#57) + **Anthropic `/routines`** (#58) — ecosystem-integration bundle.
- **Timestamping convention** — promote to T03 + investigate cheaper implementation (auto-injection vs cached timestamp).
- **Team-lead prompt revision** — Celes design round (coordinator-only-by-conviction identity makes mechanical fix unsafe).
- **12-prompt broader scope-block audit** — Celes offered ~1h pass; not started.
- **Finn model inventory re-survey** (uikit-dev missing from baseline).
- **Celes assessment of Cal's first-day performance** (carried).

## CARRYOVERS

[DECISION] **Bioforge-dev team:** 4-character Cathedral-lite — Humboldt (TL/opus), Merian (RED/sonnet), Linnaeus (GREEN/sonnet), Cuvier (PURPLE/opus). Designed by Celes.
[DECISION] **"Cathedral-lite"** = Cathedral tier with ARCHITECT merged into team-lead. Valid for single-repo, single-language, single-pipeline projects.

## SESSION HISTORY (compressed)

**2026-04-30 (session 21):** #62 from apex-research/Schliemann assessed by Volta, patched, committed (`426194d`). startup.md Steps 2-4 collapse to single `TeamDelete + TeamCreate + verify`; new shutdown S5 `TeamDelete()` after `git push`. Gotcha #4 added (in-memory state survives `/clear`). Cross-team comment on #62 (`issuecomment-4350394024`) with FR-side n=2 confirmation. Wiki candidate held for Cal: "in-memory state survives `/clear`" (n=2 apex+FR). T06 amendment (lines 528 + 1025) batched with existing path-tree-rewrite chore. This shutdown is first to use new S5 — dogfooding the patch.

**2026-04-29 (session 20):** #61 validation passed empirically (Cal). Tunnel persistence work in apex-migration-research repo (3 commits + 1 PR-merge): supervisor-of-supervisor loop (`183de33`), wscript hidden launcher (`8edc230`), Chromium runtime deps Dockerfile bake (`9ddfb10`), operator env-var PR #115 merged (`049f766e`). RC clone fresh-cloned (Brunel triage). Apex-research comparative analysis (Finn) → `docs/apex-research-comparison-2026-04-29.md`. Wiki 45→50: #46 windows-bridge (5→6 amend), #47 cross-msys-argv, #48 dual-track, #49 ai-teams-sudo, #50 wiki-cross-link-convention (first cross-pollination filing). Cross-team link form policy adopted. 4 single-entry frontmatter experiments active under Cal.

**2026-04-24 (session 19):** #60 + #61 closed, xireactor dropped. #60 retired tmux-pane spawn (Herald `agent-spawn-protocol.md` v2.0.0 + Brunel cross-repo gating). #61 moved `.claude/teams/` → `teams/` (commit `7e72771`, 258 files). Wiki #45→#47: warp-dns-vs-routing-asymmetry-rc-host (#46), rc-host-db-tunnel-architecture (#47, first `references/` entry). Cross-team unblock: apex-research DB tunnel via reverse SSH from Windows operator (script `c79b838` in apex repo).

**2026-04-15 late-eve:** Xireactor pilot design pass. 4 agents (Brunel+Monte+Herald+Cal). 4 design docs shipped. Three-specialist convergence on asymmetric cross-tenant-only shape. Wiki 43→45 (#44 integration-not-relay at n=6+, #45 substrate-invariant-mismatch at n=3). Protocol D naming accepted. Frozen design state at `memory/xireactor-pilot-design-state-2026-04-15.md`.

**2026-04-15 afternoon:** Ruth-team genesis. Brunel v1.0 accepted. #57+#58 filed. Sensitivity boundary adopted. Ruth relay sent via Teams. Key LEARNEDs: thin-digital-footprint ≠ low-output, implicit-cross-team-contracts, sensitivity-boundary-via-gitignore.

**2026-04-14 eve + 2026-04-15 morning:** Jira/GitFlow assessment. Wiki 38→39 (#39 scope-block-drift). dev-toolkit#43 issue filed. Finn+Brunel prompts fixed by Celes. Team-lead prompt revision deferred.

**2026-04-14 midday:** Cleanup + Volta audit + Finn uikit-dev harvest. Wiki 37→38. Persist-coverage F/D split. [WARNING] team-lead coordinator-only discipline slipped pre-spawn — spawn-before-act even for cheap one-offs.

**2026-04-13 afternoon:** Oracle→Librarian Phase 1+2. Wiki 20→28. Commits `04522c7`+`ca0e56f`. Eratosthenes v2.7.1 live on apex-research. Phase 2 directive tmux-direct to Schliemann.

**Prior (2026-04-09 through 2026-04-10):** Cal bootstrap, raamatukoi-dev designed+deployed, bioforge-dev Cathedral-lite roster, Discussion #56 (wiki 4→20).

## SCRATCHPAD HYGIENE (adopted 2026-04-16 on Cal's advisory)

1. **Active vs frozen:** frozen design state → sibling archive files; scratchpad = active state only.
2. **Strike-through vN-1:** when specialist ships vN, strike prior vN-1 refs in-place rather than appending both.
3. **Wiki-candidate routing collapses sources:** when sending candidate to Cal at n=X, collapse source instances in scratchpad in same batch.
4. **[DECISION] vs [LEARNED] retention:** DECISIONs stay (standing rules). LEARNEDs collapse after wiki promotion.
5. **CHOREs top-of-file:** all NEXT-SESSION-CHOREs in dedicated block under NEXT SESSION, not buried inline.
6. **Tree-form tags, not session-log prose:** `[TAG] claim + why + applies-to-future`, not "and then we did X."
7. **2-session staleness check on n=1 wiki candidates:** if LEARNED hasn't reached promotion in 2 sessions, re-evaluate pattern reality.
