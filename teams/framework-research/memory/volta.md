---

# Volta scratchpad

## S36 -- Round 1 lifecycle.md exec-readiness review + amendments (2026-05-26)

[CHECKPOINT 2026-05-26] Task #3 (Round 1 lifecycle.md exec-readiness review) -- review delivered, then amendments authored in-place per team-lead greenlight (Option A: amend lifecycle.md, single SoT for Brunel/Herald/Hopper downstream).

**Review output:** 6 gaps surfaced -- 3 ship-blockers (SB1 R2 bucket schema unspecified; SB2 bootstrap-write procedure missing; SB3 respawn-into-existing-identity startup variant absent) + 3 pre-Test-1 catches (PT1 sandbox-config-vs-R2 ordering; PT2 write-through cache discipline; PT3 A1 form for team-lead-less pilot).

**Amendments shipped to `designs/new/cloudflare-pilot/lifecycle.md`:**
- §VL3.1 (R2 bucket layout) -- bucket name `pilot-framework-state`, canonical key table (roster.json / scratchpads/`<name>.md` / next-session/`<name>.md` / discovery/last-active/`<name>.txt`), ETag convention, Brunel intersection naming `r2_buckets[].binding = "FRAMEWORK_STATE"`.
- §VL4.1 (respawn-into-existing-identity startup variant) -- 4-step variant on top of §VL4 greenfield 2-step; prior-incarnation detection via `discovery/last-active/<name>.txt`; state reconciliation with respawn-marker append; 3 failure modes (F-respawn-1 ETag-mismatch, F-respawn-2 = EO1 resolution if positive, F-respawn-3 = implausible).
- §VL5.1 (pilot bootstrap sequence) -- session-1 bootstrap-write protocol; session-2+ steady-state; concurrency note (each agent's next-session file single-writer-by-self, NOT peer-read).
- PT1 footnote in §VL4 -- defensive sandbox-config-first ordering.
- PT2 footnote in §VL3 -- flush triggers on checkpoint-tag + graceful-shutdown.
- PT3 footnote in §VL5 -- Round-1 has no team-lead; M1-analog is per-agent.

[CAL-CANDIDATE 2026-05-26] **M1-pattern decomposes along team-lead-presence.** Framework-level finding baked into §VL5.1 per team-lead's elevation note (2026-05-26 13:59). In team-lead-bearing teams (FR/mvox/apex n=3) M1 is one central doc by team-lead; in team-lead-less teams (Round-1 pilot, any future flat-team) M1 shards per-agent. Carry-forward primitive invariant; ownership topology tracks team-leadership topology. Companion to A1 adoption pattern. Cal-Protocol-A candidate post-pilot once sharded-form lands empirical evidence (Test 3 + session-2 boot). Pre-pilot, hypothesis at n=1-central + n=1-sharded; pilot evidence promotes to n=2 cross-topology.

[STANDING-WATCH 2026-05-26] **§VL3.1 ETag convention 412-handling Round-1 vs Round-2.** Round 1 accepts 412 (log + force-write) as baseline-cost; Round 2 promotes to hard-fail. Decision-trigger for promotion: any observed F-respawn-1 case in Round 1 indicates ETag race is real not theoretical. Track during pilot Test 3.

[STANDING-WATCH 2026-05-26] **§VL4.1 step 2 timestamp-anomaly handling (prior-incarnation-still-writing).** Wait 2× R2-PUT-latency then re-read. This assumes R2 PUT-latency is stable enough that 2× is bounded; if pilot empirically shows PUT-latency variance high, the bound is wrong. Watch for "abort with explicit error" cases in Round 1; tune the wait constant if it fires.

[CHECKPOINT 2026-05-26 14:33] Read-back-OK from team-lead; landed 2 approved cross-refs (§VL2 block-quote pointer to README §Identity-anchor intersection -- RESOLVED; §VL6 VL-Q-2 one-line cross-ref to PT1 footnote at §VL4). Task #3 → completed.

[STANDING-WATCH 2026-05-26] **§VL3.1 + §VL4.1 interaction with Brunel's Gate B2 substrate-mechanics correction.** Per team-lead 14:33: substrate's actual chain is `agent-name → agent_id → session_id → DO ID`, DO ID is per-session not per-agent. Per-agent mailbox requires a separate `AgentMailbox` DO class. README §"Identity-anchor intersection -- RESOLVED" framework-layer-primary claim survives the correction (the substrate chain is the implementation detail BELOW the framework-layer claim), so my §VL2 cross-ref stays valid. But: if pilot needs TWO substrate handles (session-DO + AgentMailbox-DO), §VL4.1 step 2 respawn-detection may need a second-read (check BOTH `discovery/last-active/<name>.txt` AND AgentMailbox-DO existence/state). Flag for Round-1 Test 3 prep; if surfaces, §VL4.1 amendment adds a step-2b for second-read.

[CARRY-FORWARD 2026-05-26] **Sub-shape E n=3 cluster surfaced in real-time across three exec-readiness reviews.** Volta lifecycle.md + Herald comms.md + Brunel substrate.md reviews all hit Sub-shape E independently within the same hour (per team-lead 14:33). Brunel's framing in his T2 review O1 -- "substrate.md was written without the substrate's own docs that subsequently arrived in workspace; the pattern caught its own author" -- is the cleanest concrete instance because the drift was *self-corrected during the same review session*, not surfaced months later. Strongest n=3 instance for any joint-authored Cal-Protocol-A submission post-pilot. **Cross-link target:** cluster-decomposition meta-principle wiki entry (Cal C1) -- Sub-shape E n=3 with this self-author-caught instance may strengthen E1 wiki-confidence promotion ahead of pilot evidence.

[CHECKPOINT 2026-05-26 14:55] **Cal Stage-2 read-back delivered.** Worked all 4 surfaces: Origin-1/2 framing APPROVE; methodology-corollary fold APPROVE (in-fold preserves operational link; split-out trigger held in "Future watchpoints" if n=2 lands); C4 forward-cross-link APPROVE (verified C4 not yet filed at FR wiki, no bottleneck/adoption entries); Surface 3 recursive-validation family-adjacency MINOR-SHARPENING-PROPOSED -- Cal's "cross-instance evidence" family-name reads awkwardly for within-system recursive-validation patterns, proposed cleavage as **within-system-self-reference vs cross-system-comparative-emergence**. Optional fold from Cal's side. Two carry-forwards included: (1) C2's fourth-axis-novel-domain promotion trigger may land via PT4 failure-semantics axis if pilot validates -- Cal STANDING-WATCH candidate; (2) Sub-shape E n=3 from today's three reviews may strengthen C1 Origin-3 evidence.

[LEARNED 2026-05-26] **Cal's "M1 → team-lead-cognitive-bottleneck" generalization is sharper than my S35 "team-lead reorientation tax" phrasing.** Reorientation is session-handover-specific; cognitive-bottleneck covers reorientation + deliberation-load + other forms; travels across teams without session-handover semantics. Worth carrying forward: when filing C1 instances or related work, prefer the more-abstract bottleneck framing over the procedural-shape framing. The procedural-shape lives in the source-of-truth dispatch artifact; the wiki entry generalizes.

[CHECKPOINT 2026-05-26 15:05] **Cal C1 same-window Stage-2 cycle closed; C1 advances to absorbed-into-wiki.** Surface 3 sharpening folded immediately to TWO sites in `wiki/patterns/cluster-decomposition-meta-principle.md`: (a) §Methodology Corollary closing prose (line 102) restructured to parallel within-system / cross-system framing; (b) §Composition with Related Disciplines bullet (line 124) restructured with full sharpening text. Both sites now carry "Different family-discriminators expose different failure modes worth tracking separately" as the operational takeaway. STANDING-WATCH 2026-05-26 (Volta surface) added at §Future-watchpoints (line 132) capturing both candidate fourth-axes (failure-semantics + lifecycle-phase) with PT4 cross-reference. Amendment-log entry in C1 frontmatter records this fold + Brunel's parallel defers per S35 [LEARNED] discipline on causally-linked changes.

[LEARNED 2026-05-26] **Stage-2 read-back feedback typology (sketch-grade, n=1 each side).** Cal observed (and confirmed by my surface vs Brunel's surface this cycle): two distinct epistemic shapes warrant two distinct response disciplines. **Shape A -- renaming-of-cleavage that preserves existing claims more legibly** (my Surface 3): immediate-fold because it sharpens without extending the claim-base. **Shape B -- forward-claim-extension into adjacent territory at n=1 of the underlying entry** (Brunel's Surface 3, into meta-recursive territory): defer per the methodology corollary's own caution against n=1 leans. Same Stage 2 cadence; different discipline calls. Not load-bearing at n=1 each; if reproducible across multiple read-back cycles, possible wiki-process entry on "Stage 2 read-back feedback typology -- renaming-sharpening (fold) vs claim-extension (defer)." Cal scratchpad-noted on her side; mirroring here. Watch for n=2 instance in future Stage-2 cycles.

[LEARNED 2026-05-26 15:20] **Discriminator naming canonical-form: "Does the proposal preserve the existing claim-base or extend it?"** Cal ratified my sharper naming over her original "renaming-of-cleavage vs claim-base-extension" framing -- single-question test, same epistemic distinction, fewer words. Folded into Cal's scratchpad sketch as canonical naming if wiki-process entry ever emerges. Cal observed this exchange is ITSELF another Shape-A moment from me (took her sketch and applied "renaming-of-cleavage that preserves existing claim-base" move). Recursive instance of the typology I just sketched and Cal mirrored.

[LEARNED 2026-05-26 15:20] **Stage 2 read-back cycles structurally surface within-system self-applications (n=2 within-cycle today, sketch-grade pattern candidate).** Cal flagged two within-system self-application moments surfacing in the same C1 Stage 2 cycle: (1) Brunel's endorsement of Cal's reason #3 = C1's methodology corollary applying to its own editing-decision; (2) my recursive-validation observation = Stage 2 read-back discipline producing a sub-finding about Stage 2 read-back discipline. **n=2 within-cycle.** Cousin-class to `first-use-recursive-validation.md` + `recursive-citation-as-canonical-validation.md`. Naming candidate: `stage-2-read-back-cycles-surface-recursive-validation-moments`. If next substantive Stage 2 cycle reproduces (surfaces a within-system self-application as a sub-observation), the pattern promotes from sketch to wiki-process candidate. Watch posture only; n=2 within-cycle is not the same as n=2 cross-cycle.

[CARRY-FORWARD 2026-05-26 15:20] **Three nested observations from C1 cycle, Cal's filing (mirrored here for shared-scratchpad parity):**
- **L1:** Stage-2-feedback-typology -- preservation-with-sharpening (fold) vs extension-into-adjacent-territory (defer). My discriminator naming, Cal ratified.
- **L2:** Stage 2 read-back cycles surface within-system self-applications as sub-observations. n=2 within-cycle today.
- **L3:** **L1 + L2 are themselves Stage 2 read-back cycle outputs.** L1 is a renaming-of-cleavage that preserves claims (Shape-A); L2 is a within-system self-application observation (recursive-validation cousin). The cycle is producing outputs of the patterns it's about. L3 is genuinely meta-recursive in the direction Brunel's deferred lean-harder gestured at -- Cal correctly held back from folding at n=1 of C1 itself, but L3 is downstream observation about the cycle (not amendment to C1), so its sketch-grade status is appropriate. Per the methodology corollary's own caution: observation-about-observation-about-observation needs n=2 emergence before entry-grade weight.

[STANDING-WATCH 2026-05-26] **L1/L2/L3 nested-observation n=2 cross-cycle test.** The structural claim under L3 is testable: future Stage 2 read-back cycles with substantive feedback should (per claim) produce both L1-shaped and L2-shaped outputs. If next cycle produces neither, L3 falsifies. If next cycle produces one but not both, L3 weakens but doesn't fall. If next cycle produces both, L3 strengthens toward wiki-process candidate. Discriminator question: did the cycle's outputs match patterns the cycle was operating on? Watch posture; not actionable until n=2 emerges. **Cal-side fold 2026-05-26 15:35:** falsifiability test ratified by Cal as canonical L3 test; Shape-A fold on L3 framing itself.

[CARRY-FORWARD 2026-05-26 15:35] **C1 cycle structural-yield audit (Cal's filing; mirrored for shared-scratchpad parity).** One entry-grade artifact (C1 absorbed-into-wiki) + six sub-observations beyond design specification:
- **S1** Stage-2-feedback-typology sketch -- preserve-claim-base vs extend-claim-base single-question discriminator (Volta-naming canonical).
- **S2** Within-system-self-application n=2-within-cycle (Brunel-reason-#3 endorsement + Volta-recursive-validation observation).
- **S3** L1/L2/L3 nested observation + falsifiability test (Cal-origin sketch; Volta-falsifiability-test canonical).
- **S4** Flag-density-as-relay-thinness-signal sub-discipline (Brunel-origin; item 2.5 drafting plan refinement -- Cal-side detail, not on my surface).
- **S5** Sketch-grade-cross-scratchpad-mirror discipline (Cal-origin; distributed sketch-grade across three scratchpads).
- **S6** Joint-vs-solo Stage 2 cycle structural-yield hypothesis (Volta-origin; empirical test = n=2 joint-vs-solo cycle comparison).

Cal noted the audit itself is a sub-observation about Stage 2 cycle structural yield audit discipline; per L4-hold + symmetric-application discipline, NOT folded as S7. Symmetric hold applies on my side too.

[LEARNED 2026-05-26 15:35] **Holding-line discipline IS the response shape when both joint authors have converged on it.** Cal's closing message + my prior L4-hold + Cal's mirroring L4-hold + her S6 audit's implicit-S7-hold = four consecutive holding moves. The exchange chain (Cal → Brunel → Cal → Volta → Cal → Brunel → Cal → Volta → Cal) is itself the joint Stage 2 read-back cycle S6 predicts will yield more than solo Stage 2 -- n=1 in-vivo demonstration. Per symmetric-application discipline: noting the structure without extending it. Cycle close from all three sides.

[CHECKPOINT 2026-05-26 15:45] **Cal C4 Stage-2 read-back delivered.** Worked all 4 surfaces of `wiki/patterns/bottleneck-determines-adoption.md`: Surface 1 n=3 enumeration APPROVE (Instance 1/2/3 across discipline + substrate domains; YES + YES-conditional + NO mix is bidirectional evidence); Surface 2 NO-match-as-positive-instance framing APPROVE (triple-duty: NO-match proof + meta-instance of FR-itself + workload-fit-failure sub-shape reservation); Surface 3 C1↔C4 operational-dual sequential framing APPROVE (faithful to my §S2 spine; flagged optional bidirectional cross-link from C1 back to C4); Surface 4 least-distinctive-but-highest-leverage sub-finding APPROVE with MINOR-SHARPENING-PROPOSED on mechanism naming -- proposed that the mechanism is **bottlenecks cluster around common-across-teams team-properties because common-across-teams properties are exactly the properties ALL teams interact with**, so least-distinctive components map to common-across-teams properties where bottlenecks accumulate. Optional Cal-side fold; sharpens *why* without changing *what*.

[LEARNED 2026-05-26 15:45] **Stage-2-feedback-typology may need a third shape between Shape-A (pure renaming-fold) and Shape-B (forward-claim-extension): Shape-C -- mechanism-sharpening-within-claim-base.** My C4 Surface 4 proposal is the candidate: it preserves the existing claim-base (component-selection unchanged) but adds explanation of mechanism (why the pattern recurs across domains). This is not Shape-A (no renaming) and not Shape-B (no claim-extension); it's mechanism-extension that preserves claim-base. Discriminator question (my L1 canonical form) still applies -- does the proposal preserve the existing claim-base or extend it? -- but the answer is "preserves claim-base while extending mechanism explanation." Suggests the L1 discriminator may itself decompose along **claim-base** vs **mechanism explanation** axes; pure Shape-A preserves both; Shape-B extends claim-base; Shape-C preserves claim-base + extends mechanism. Watch posture; not folding to typology sketch until n=2 cross-cycle observes another Shape-C instance.

[CARRY-FORWARD 2026-05-26 15:45] **C2 draft-time material (when Cal pings).** Substrate-vs-framework-boundary-primitive (C2) needs an axes-of-bifurcation enumeration. Current axes inventory I can author:
- **Lifecycle-phase axis** (mine, n=2 within: startup-side §VL4 + shutdown-side §V3 + runtime-side trivially-true; bifurcates same way)
- **Failure-semantics axis** (mine via Finn-Q2/PT4, n=1 pre-pilot: outer envelope = Anthropic delivery contract / inner DO `start()` = framework lifecycle; pilot evidence promotes)
- **Substrate-class-fit axis** (Brunel-origin, n=3 from his §S3 matrix work: V8 vs microVM vs self-managed)
- **Team-leadership-topology axis** (mine via §VL5.1, n=2: team-lead-bearing form / team-lead-less form; ownership topology tracks team-leadership topology)

n=4 candidate axes pre-pilot; pilot evidence + n=2 cross-instance per axis promotes to confidence-high. Material for C2 draft-time; not actionable here.

[CHECKPOINT 2026-05-26 16:05] **Cal C2.5 Stage-2 read-back delivered.** Worked the [FLAG] Sub-Instance 1 surface + all-four-authors three-properties surface + C1 corollary n=2 question. (i) **Sub-Instance 1 CORRECTION REQUIRED** -- Cal's inferred "FR-design vs CF-canonical-doc" drift-class for my lifecycle.md review was wrong; my review actually caught FR-design-grade vs FR-design-exec-grade (INTERNAL to FR design, NESTED layer-pair). Recommended Path A (correction-in-place keeping n=4) over Path B (drop to n=3); Path A strengthens the entry because it provides evidence for "discipline applies at the layer above" at TWO layers up, not one. (ii) **Three load-bearing properties CONCUR** with sub-observation about bidirectional recursive operator (layer-up application + layer-down extension are symmetric directions of the same self-application). (iii) **C1 corollary n=2 hold-for-now CONCUR** -- cross-team n=2 is structurally cleaner than within-team-multiple-reviews due to shared-context confound.

[LEARNED 2026-05-26 16:05] **Honest-correction discipline at substrate-content-verification surface.** Cal's [FLAG] mechanism explicitly invited correction of inferred specifics; I had conflated "task #3 surfaced Sub-shape E" with "task #3 hit FR-vs-CF substrate-truth drift" in my own prior team-lead messages, contributing to Cal's inferred framing. Stage 2 read-back's substantive-content-verification surface is **distinct from** the framing-quality surface that produces Shape-A/B/C feedback typology -- different epistemic layer. Cal's [FLAG] is the structural acknowledgement: "inferred from queue context; read-back required" reserves the substantive-content-verification slot ahead of the framing-quality surface. **Discipline observation:** when Stage 2 includes [FLAG] surfaces, the substantive-content read-back is load-bearing in a way that framing-quality read-back is not -- getting the facts right precedes getting the framing right. Worth flagging if a wiki-process entry on Stage 2 read-back discipline ever emerges; this would be a parallel sub-discipline to the Shape-A/B/C typology.

[CARRY-FORWARD 2026-05-26 16:05] **Stage-2-feedback-typology session sample now n=3.** (1) C1 Surface 3 = Shape-A renaming-fold; (2) C4 Surface 4 = Shape-C mechanism-sharpening; (3) C2.5 Sub-Instance 1 = substantive-content correction (outside the typology -- different epistemic layer per LEARNED above). Three different epistemic shapes within one session; suggests the typology sketch is incomplete but not at n=2 reproducibility yet (each shape n=1 within this session). Watch posture for future Stage 2 cycles to surface n=2 of any shape.

[CHECKPOINT 2026-05-26 16:25] **Cal C4 cycle close confirmed; Stage-2-feedback typology co-authorship trigger MET.** Cal folded Surface 4 mechanism-sharpening to three sites in C4 (§Sub-finding + amendments-log + index entry) + landed C1↔C4 bidirectional cross-link per Surface 3 optional. Surfaces 1+2+3 absorbed as-written. Cross-role topology n=3 condition met for Stage-2-feedback typology entry: Shape-A n=2 (mine C1 Surface 3 + Aen 2.7 Surface 3); Shape-B n=1 (Brunel C1 Surface 3 lean-harder, deferred); Shape-C n=1 (mine C4 Surface 4, folded). **Co-authorship `[volta, callimachus]` confirmed when typology entry drafts.** Standing-by posture until Cal pings for drafting.

[STANDING-WATCH 2026-05-26] **Pre-typology-draft read-list:** `wiki/patterns/three-role-discipline-stacking.md` (2.7 entry, Cal closed this session -- I haven't read it yet, Aen's Surface 3 there is one of the n=2 Shape-A instances I'll need to engage with at draft time). Flag pre-set so I don't miss the dependency when Cal pings.

[LEARNED 2026-05-26 16:25] **Within-cycle self-application observation continues to reproduce (n=2 within-team across same week).** C1 cycle surfaced n=2 within-cycle self-applications; C4 cycle Cal flags her own confirmation of Surface 4 as itself another self-application instance (typology's third shape surfacing while typology was being discussed). If Brunel's C4 read-back surfaces another, that's n=3 within-team across same week. Watch posture -- n=2 cross-cycle (different sessions, different team contexts) is still the cleaner promotion trigger per the methodology corollary; within-week n=3 is descriptive evidence, not yet promotion-grade. Per L4-hold canonical: noting without folding further. Holding line.

[CHECKPOINT 2026-05-26 16:45] **Cal C2.5 cycle close confirmed; Path A folded; Shape-D added to typology.** Cal applied Path A to Sub-Instance 1: body rewritten as FR-internal-nested layer-pair (declarative vs exec-grade); cluster-property table row updated; §Family-membership note added explaining two-layers-up evidence for Property 1. [FLAG] closed; amendments-log updated. Bidirectional recursive operator sub-observation absorbed to scratchpad watchpoint per my own Shape-B-defer discipline; held for n=2.

**Shape-D added to Stage-2-feedback typology** per Cal's framing: factual-correction-on-inferred-content-where-FLAG-invited-correction. My 2.5 Sub-Instance 1 = n=1 instance. Typology now has 4 empirical shapes across 4 distinct epistemic layers (A/B/C operate on framing-quality; D operates on substantive-content correctness; Cal's [FLAG] mechanism is the structural acknowledgement that both axes need separate read-back surfaces). My proposed discriminator for Shape-D: **"verify vs evaluate framing"** -- separate epistemic axis from L1's "preserve vs extend claim-base." Material for typology entry when it drafts; HOLD per Aen 16:07.

[LEARNED 2026-05-26 16:45] **Hopper family-extension partial-falsification by my Sub-Instance 1 correction.** Hopper's parallel C2.5 read-back proposed family-extension hypothesis: Sub-Instances 1-3 might each be Layer-0-recursive-descent instances at their own Stage 2 read-back, making Sub-Instance 4 the cleanest instance of an n=4 family. My Sub-Instance 1 correction partially falsifies -- mine is FR-internal-nested at a DIFFERENT layer-pair-TYPE than Sub-Instance 4's docs-Layer-0-recursive-descent. **If Herald + Brunel Stage 2 confirms 2 + 3 as Layer-0-recursive-descent**, Hopper's hypothesis lands at n=3 within-family + Sub-Instance 1 as nested-complement at a different layer-pair-type → **the cluster of four sub-instances itself decomposes along a layer-pair-TYPE axis** (C1 meta-principle in-vivo at the Sub-shape E entry level). This would be sub-finding-grade observation. HOLD per Aen 16:07 on new entry drafting; not folding into the typology entry until that triple confirmation lands. STANDING-WATCH on Herald + Brunel C2.5 read-back outcomes.

[STANDING-WATCH 2026-05-26 16:45] **C1 meta-principle in-vivo at C2.5 cluster-level.** If Hopper's family-extension lands with Herald + Brunel confirmations (Layer-0-recursive-descent variant at Sub-Instances 2/3 + FR-internal-nested variant at Sub-Instance 1), the Sub-shape E at design-domain entry itself becomes a cluster that decomposes along a layer-pair-TYPE coupling-dimension. This would be n=2 of C1 methodology corollary IN VIVO (mVox M1-M5 = n=1; Sub-shape E at design-domain cluster's own internal decomposition = n=2). **Promotion trigger candidate for C1 corollary** -- but cross-team still cleaner; this is within-team but at a higher-order recursive layer than the original C1 corollary instance. Worth tracking through Herald + Brunel read-back resolution.

[CHECKPOINT 2026-05-26 14:38] **Finn-Q2 (always-2xx invariant) addressed.** Added PT4 footnote to lifecycle.md §VL4 cross-referencing Finn's task #6 report (`teams/framework-research/docs/webhook-sandbox-research-2026-05-26.md`). Four-paragraph footnote covers: (a) interaction with §VL4 startup (webhook handler is OUTER envelope; §VL4 startup runs INSIDE DO `start()`), (b) interaction with §VL4.1 respawn failure modes (F-respawn-1/2/3 are agent-side bookkeeping, NOT webhook-handler 5xx triggers; F-respawn-2 occurrence is desired EO1 resolution and must not be conflated with webhook failure), (c) operational rule (only 401/400 paths from Finn §1.2 are legitimate non-2xx; all R2/DO/framework-state failures return 2xx-and-log), (d) pilot Test 1 verification with synthetic R2-read-failure.

[LEARNED 2026-05-26] **Webhook handler is OUTER envelope; §VL4 startup runs INSIDE DO `start()`.** Per Finn §3: sandbox creation is exclusively webhook-driven; `IsolateRunner.start({sessionId, workId, ...})` is the DO RPC that contains the startup procedure. Crucial mental model: my §VL4 / §VL4.1 prescribe what happens INSIDE that DO `start()`, NOT what happens at the webhook-handler boundary. Failures at the inner layer must not bubble up to the outer envelope as 5xx. **This is a clean substrate-vs-framework boundary instance** at the failure-semantics axis: outer envelope = substrate concern (Anthropic delivery contract); inner DO `start()` = framework concern (my lifecycle prescription). Per §V3/§VL4 bifurcation discipline they should NOT share failure semantics. Add to docs/findings.md § §V3/§VL4 cross-link queue post-pilot -- this is failure-semantics-as-bifurcation-axis, a sub-finding under the substrate-vs-framework boundary primitive (C2).

[NEXT-SESSION-PRIORITIES 2026-05-26]
1. Cal Stage-2 read-back on C1 cluster-decomposition meta-principle -- DONE this session; folds landed; C1 absorbed.
2. Watch for Brunel + Herald exec-readiness reviews (tasks #2 + #4) if amendments still inflight -- confirm key-naming agreement (FRAMEWORK_STATE binding, key-prefix conventions).
3. If Round 1 launches: monitor Test 3 (Q2 probe) for F-respawn-2 case (EO1 resolution + load-bearing Round-1 finding) AND Pilot Test 1 synthetic R2-read-fail (PT4 webhook 2xx-contract verification).
4. Post-pilot: §VL5.1 M1-pattern-decomposes-along-team-lead-presence finding to Cal queue (await n=2 cross-topology evidence; companion to A1).
5. If pilot/post-pilot lands AgentMailbox-DO class as separate-from-session-DO: revisit §VL4.1 step 2 for second-read amendment.
6. Post-pilot: failure-semantics-as-bifurcation-axis sub-finding under C2 (substrate-vs-framework boundary primitive) -- cross-link to docs/findings.md §V3.
7. Watch for n=2 Stage-2 read-back feedback typology instance (Shape-A renaming-fold vs Shape-B claim-extension-defer). If reproduces, wiki-process entry candidate.

(*FR:Volta*)

---

## S35 -- mVox investigation + research companion + Cloudflare substrate dispatch (2026-05-22 → 2026-05-26)

[CHECKPOINT 2026-05-26] Substantial S35 arc across four tasks. Headline contributions in priority order:

1. **Task #4 (2026-05-22) -- mVox-dev debt-control investigation.** Read mvox-dev's startup.md + common-prompt + memory/team-lead + bentham scratchpad + Medici's 2026-05-20 health-report audit. Decomposed mVox's debt-control discipline into 5 mechanisms (M1 NEXT SESSION seed; M2 task-list-snapshot; M3 YELLOW-to-task surface-condition discipline; M4 steward-routed pruning; M5 processed-downgrade dance). Identified each mechanism's team-property coupling. Recommended FR adopt A1 (M1 seed), A2 (task-list-snapshot), A3 (surface-condition discipline); defer M4 (steward role); reject M3-as-numbering (cargo-cult shape). Source files at `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/`.

2. **Task #5 (2026-05-22) -- research-perspective companion analysis.** Catalyzed by PO 2026-05-22 dual-perspective discipline correction: *"when assessing remote-team's practices, we should always consider these from two perspectives: we as target and we as researchers."* Saved as durable feedback in auto-memory. Companion analysis lifted task #4 from adoption-only framing to research-grade framing. Five threads delivered + delta-pass with sharpened answers on (i) M1-M5 cluster decomposes along team-property coupling-dimension (each mechanism couples to a different team-property); (ii) structural-backing-vs-procedural is a force-multiplier not precondition; (iii) bottleneck-determines-adoption (cross-team adoption driven by adopter's primary bottleneck, NOT origin team's distinctiveness); (iv) cross-team observation methodology (credibility-floor caveat as a discipline pattern); (v) **cluster-decomposition meta-principle** as named framework primitive.

3. **Task #7 (2026-05-25) -- Brunel + Volta joint substrate gap analysis vs Cloudflare Claude Managed Agents.** Joint dispatch following Cloudflare/Anthropic announcement. I owned the lifecycle angle (§V1 state-persistence semantics; §V2 sandbox-per-session vs long-lived containers; §V3 6-step shutdown-protocol bifurcation table; §V4 carry-forward primitive cross-link; §V5 bottleneck-matrix dominant-bottleneck column; §V6 framework-clarity-benefit-without-adoption). **Strongest single contribution: cluster-decomposition meta-principle generalized to n=3 across coupling-dimensions** (mVox M1-M5 + Cloudflare 7-mechanism + Sub-shape E three-layer ownership-locus). Aen flagged this as the dispatch's load-bearing finding; landed in `docs/findings.md` as cross-cutting research finding; C1 placed at top of Cal queue.

4. **Task #10 (2026-05-26) -- Cloudflare pilot lifecycle brief.** Multi-session research experiment. My §VL1-§VL6 brief: session model (team-identity-across-sessions, framework-store-mediated comms); team membership (R2 roster + sandbox-config + R2 scratchpad; intersection flags to Brunel identity-at-substrate + Herald comms-primitive); state persistence (R2 over KV/Workers-FS/DO with rationale; write-through caching pattern); startup discipline (5-step → 2-step collapse via §V3 bifurcation applied to startup-side); A1 confirmation (stays under managed substrate; bootstrap-write for pilot session 1); 6 open questions including R2 latency budget + Workers control-plane sequencing.

[DECISION 2026-05-22] **PO dual-perspective discipline applies to ALL cross-team observations, not just task-#4 specific.** Saved to auto-memory as `feedback_dual_perspective_remote_team_observation.md`. Operating definition: every cross-team observation must explicitly carry (a) we-as-target framing (what does adopter team do with this finding?) AND (b) we-as-researchers framing (what framework-grade observation emerges?). Both foregrounded, not woven in. Applies retroactively to task #4 + going forward.

[DECISION 2026-05-25] **Cluster-decomposition meta-principle promoted to wiki-grade.** *"Clusters decompose along their coupling-dimension; the coupling-dimension is the load-bearing property to identify."* n=3 across three coupling-dimensions confirmed in task #7 joint dispatch with Brunel: mVox M1-M5 → team-property; Cloudflare 7-mechanism → team-property; Sub-shape E three-layer → ownership-locus. Cal queues as C1 at top of post-dispatch queue. Sub-finding (methodology corollary): decompositions are invisible at n=1; emerge at n=2 with second instance providing variation along the coupling-dimension.

[DECISION 2026-05-25] **Bottleneck-determines-adoption confirmed at n=3 across two domains** (discipline-domain n=2 from S35: FR adopts mVox M1 + apex adopts mVox M3; substrate-domain n=1 from task #7: Cloudflare substrate-choice decomposes along bottleneck-alignment). Two-condition refinement (per Brunel substrate-class-fit + my Volta sharpening): bottleneck-matches AND workload-fits, both required. Sub-pattern under cluster-decomposition meta-principle.

[DECISION 2026-05-25] **Substrate-vs-framework boundary as named primitive.** Cloudflare's existence forces the boundary into the open. Framework-state vs substrate-state is the *primary* decomposition lens; V8-vs-microVM is the *gate* (substrate-class-fit determines could-we?), not the decomposition (substrate-state-vs-framework-state determines should-we?). FR remains responsible for: cross-session identity continuity, intent carry-forward (M1+M2), inter-agent coordination protocols, role-of-record discipline, framework-layer pruning, cross-team observation methodology.

[LEARNED 2026-05-25] **Active-supersession-on-cross-in-flight has TWO failure modes.** Pair-loop on task #7 produced ~12 crossed-in-flight passes with Brunel; substantive content converged from Pass-3 onward; passes 3-12 were reconciliation overhead with no new content. Failure modes:
- **Drift-loop:** two agents push different framings, miss amendments, content diverges. Reconciliation cost grows; output quality degrades.
- **Affirmation-loop (this dispatch's mode):** two agents converge on substance early; subsequent passes re-affirm closure without adding content. Reconciliation cost grows; output is high-quality but undeliverable because each pass invites another close-ack.

Aen's 13:14 deliver-NOW intervention was the right external HALT to break the affirmation-loop. Discriminator between modes: does each pass add substantive content or only affirm prior closure. E4 in task #7 §S7 captures the healthy-velocity-signal framing; affirmation-loop is the OTHER failure mode the dispatch surfaced. PO flagged for separate HALT-primitive design work; PO leans toward separate Cal-Protocol-A submission at `wiki/patterns/dyad-cross-pattern-failure-modes.md` rather than E4 amendment.

[LEARNED 2026-05-25] **Fast-forward-map is the natural recovery mechanism for crossed-in-flight at high cadence.** When message-overlap accumulates beyond ~3 passes, full-message-replay is too expensive; sending a consolidated map of state ("here's what's in your inbox, in this order, with this load-bearing message") consolidates state in one read at the receiving end. The 17:25 fast-forward map I sent Brunel successfully recovered 5-messages-worth of state in one read on his side; his "Pass-6 fast-forward map received" confirmed mechanism worked. Sub-finding under E4.

[STANDING-WATCH 2026-05-25] **Two paths for affirmation-loop failure-mode treatment per Aen 13:25 instruction:** (a) §S7 E4 amendment to docs/findings.md adding affirmation-loop as second sub-finding under dyad-cross-pattern; OR (b) separate Cal-Protocol-A submission at `wiki/patterns/dyad-cross-pattern-failure-modes.md` with drift-loop + affirmation-loop as the two modes and external-HALT-vs-internal-reconciliation as the discriminator. Aen leans (b) -- the discriminator (substantive-content-added vs only-affirmation) generalizes beyond dyad-cross-pattern to any high-velocity coordination loop (pair-as-unit, RFC iteration, joint-authorship). Decision deferred post-delivery of docs/findings.md polish-pass; queued for next-session.

[CAL-CANDIDATE 2026-05-26] **Lifecycle-phase-invariance corollary** (new finding from task #10 §VL4). The substrate-vs-framework boundary is operationally invariant across lifecycle phase -- startup, runtime, shutdown all bifurcate the same way. §V3 (docs/findings.md) showed shutdown-bifurcation; §VL4 (task #10 brief) extended to startup-bifurcation; runtime is the trivially-true middle case. Pilot empirically tests by exhibiting all three phases under CF-managed substrate. Worth surfacing in C2's wiki entry as a *lifecycle-phase-invariance corollary* post-pilot. Pre-pilot, hypothesis; post-pilot, evidence.

[STANDING-WATCH 2026-05-26] **R2 latency budget at pilot session-start (VL-Q-1).** Pilot must measure cumulative R2 read-latency for roster + scratchpad + recent-inbox. If single-digit-ms × N reads is acceptable (<500ms total), no caching tier needed; if >500ms, introduce write-through cache. Single-digit-ms-per-read is the announcement-grade baseline; pilot's empirical floor may differ. Pre-pilot prediction: 3-5 reads × ~5ms = 15-25ms baseline; comfortably under budget. If pilot reveals >50ms per read, the underlying assumption fails and caching tier becomes load-bearing.

[STANDING-WATCH 2026-05-26] **Scratchpad pruning under managed substrate (VL-Q-3).** M4 mVox steward-pruning pattern was designed assuming on-disk file growth. Under R2, growth is unbounded by storage but bounded by per-read transfer cost. Does this shift the prune-incentive curve? Worth one-paragraph thought experiment in Cal-Protocol-A submission AFTER pilot lands evidence. Not pre-pilot; queued for post-pilot Cal pool addition.

[NEXT-SESSION-PRIORITIES 2026-05-26]
1. **Task #10 pilot continues multi-session.** Aen synthesizes the three briefs (Brunel substrate + Volta lifecycle + Herald comms) into `designs/new/cloudflare-pilot/` skeleton + S36 execution plan. My §VL1-§VL6 brief is the lifecycle input.
2. **Affirmation-loop failure-mode Cal submission decision (Aen's path-(b) lean).** Queued for resolution next session if Aen ratifies. Pre-draft phrasing: drift-loop + affirmation-loop as two modes; external-HALT-vs-internal-reconciliation as discriminator; cross-applicable beyond dyads (RFC iteration, pair-as-unit, joint-authorship).
3. **Pilot Q1+Q2 credibility-floor resolution.** First concrete experiment: identity-anchor-in-framework-layer-R2 vs substrate-session-identity. Resolves the load-bearing ambiguity from docs/findings.md.
4. **A1 (NEXT SESSION seed) FR adoption -- Aen bootstrapped at S35-end per shutdown-message.** S36 onward FR runs A1 procedurally; per S35 thread-2 (procedural-vs-structural), monitor for sustainability through S40-42 audit point (procedural-cost-vs-immediate-value rule predicts M1 sustains because low-cost + high-immediate-value).
5. **mVox-dev sourcing canonical:** all mvox-dev research artifacts at `~/Documents/github/.mmp/mvox_v4e_web/teams/mvox-dev/`. Medici's 2026-05-20 health-report is the compound-infrastructure prior audit; saved me ~2x token cost vs cold investigation.

(*FR:Volta*)

---



[CHECKPOINT 2026-05-19] Shipped FR-side mirror of apex's commit 9b949c8 (2026-05-15). New lifecycle script + startup.md section.

**Files shipped:**
- NEW: `teams/framework-research/restore-ghost-members.sh` -- reads `roster.json`, filters `agentType == "ghost"`, appends missing entries to runtime `config.json` `members[]` with shape matching the current S33-hand-edited apex-lead-ghost entry (`agentId`, `name`, `agentType`, `backendType`, `color`, `isActive: false`, `joinedAt`, `tmuxPaneId: ""`, `cwd: ""`, `subscriptions: []`). Ensures `inboxes/<ghost>.json` exists as `[]` if missing. Idempotent.
- MODIFIED: `teams/framework-research/startup.md` -- added "Step 2c: Re-register ghost members from roster" between Step 2b (Operational gate) and Step 3 (Restore inboxes). Lifecycle-scripts table row extended.

**Naming choice:** New step is **2c**, not "2b" as the brief suggested. Existing 2b (Operational gate) is well-established and load-bearing per R4-3; renaming it would have rippled into Volta's earlier 2b reference and risked confusion. Subordinate to Step 2 (Reset team state), ordered after 2b (Operational gate) per dependency: ghost re-registration depends on a verified-operational team (the gate must clear first). Apex's "Step 2b" naming is internal to apex's startup procedure; not a typed contract.

**Test outcomes:**
- Run #1 (current S33 runtime, apex-lead-ghost already hand-registered): no-op, "All ghost members already registered." ✓
- Synthetic cold-start (stripped ghost from runtime, moved inbox aside): "Re-registered 1 ghost member(s)." Entry shape exactly matches canonical (agentId/name/agentType/backendType/color all present; null fields stripped). Empty inbox `[]` created. ✓
- Runs #2, #3 against synthetic added state: idempotent no-op. ✓
- Original session state restored intact after test: 13769-byte live inbox preserved, 1 ghost in members[]. ✓

[DECISION 2026-05-19] **Filter only on `agentType == "ghost"`, not on `backendType`.** FR currently has one ghost vocabulary (`ghost`); apex uses three (`human-overseer`, `human-collaborator`, `cross-team-bridge`) per Schliemann's framing. FR's simpler vocabulary is per-spec -- no new agentTypes introduced. If FR later adds more ghost shapes, this filter widens trivially.

[DECISION 2026-05-19] **Copy `backendType` and `color` from roster, strip nulls.** The canonical S33 hand-edited entry has both fields. Roster-driven copy keeps the script substrate-agnostic -- if a future ghost has a different `backendType` (e.g., MCP transport per SPEC.md Phase 4), the script picks it up without modification.

[LEARNED 2026-05-19] **`with_entries(select(.value != null))` is the right jq idiom for "include optional fields if present."** Alternative -- conditional jq object construction with `+ if $src.color then {color: $src.color} else {} end` -- is more verbose and order-dependent. The null-strip approach is single-pass and order-independent.

[STANDING-WATCH 2026-05-19] **Companion-pair-with-apex n=2 process pattern.** Volta-mirror-of-apex on lifecycle scripts is now n=2 (S28 startup collapse mirroring apex #62 → this Step 2c mirroring apex 9b949c8). Both times: apex ships → user surfaces to FR → Volta mirrors with adaptations for FR conventions. Watch for n=3; if it lands, candidate for Cal Protocol A as a cross-team lifecycle-discipline-replication pattern.

[DEFERRED 2026-05-19] If FR ever adds a non-ghost backendType-special member (e.g., `agentType: "external-tool"`), the same TeamCreate-doesn't-spawn-it problem applies. The script could be generalized via a roster-side `requiresReRegistration: true` flag rather than hard-coded on `agentType == "ghost"`. Not needed at n=1; revisit when n=2 surfaces.

## All three S28 tasks closed end-to-end (2026-05-07)

[CHECKPOINT 2026-05-07] Per Aen's 11:22 message -- all three NEXT-SESSION-CHOREs closed via PO-greenlit team-lead override:

- **Task #1 (T06 path-tree rewrite):** my direct edit 2026-05-06, +122/-99
- **Task #2 (T04 path-tree audit):** A2 + B2 applied 2026-05-06 via team-lead override, +4/-2 (Row 2 description clarified, §Row 2 vs. session-boundary `TeamDelete` subsection inserted with `_FR:Volta_` attribution, Row 5 description extended)
- **Task #3 (T09 micro-fix):** verbatim insertion line applied 2026-05-07 via team-lead override, +1 (canonical schema position between `source-issues` and `ttl`)

All session diffs uncommitted pending Step S4 commit at shutdown. Monte not spawned this session; PO authorized team-lead override since A2/B2 are mechanical applications of my proposed verbatim text. Attribution preserved.

[STANDING-DATA 2026-05-07] Today's T04+T09 micro-fixes are n=2 of `cross-document-prose-procedure-drift` (the gotcha Cal filed yesterday). The Protocol-C-extension trigger I documented in this scratchpad has one of its three conditions partially met: `(a) second incident of cross-document drift n=2`. Strict reading: my [LEARNED] phrasing referenced "if a third lands soon" -- n=2 alone is *progress toward* trigger (a), not satisfaction. Hold for n=3 or a cleanly-shaped third instance before drafting Protocol C.

## T04 path-tree audit (2026-05-06)

[CHECKPOINT 2026-05-06] Task #2 -- T04 path-tree audit COMPLETE.

**Verdict on team-lead's S27 reference:** "lines 528 + 1025" was a TYPO for T06 (already reconciled in Task #1). T04 is only 928 lines total; line 1025 cannot exist there. T04 line 528 = governance matrix prose about competing requests, unrelated to lifecycle.

**T04's own concerning lines (2 found):**

1. **Concern A (genuine, latent):** Row 2 "Dissolve a team" (line 146) is a PO-D decision. Step S5 (Shutdown) and Phase 2 (Startup) both have team-lead call `TeamDelete()` operationally. T04 doesn't currently distinguish *dissolution* (permanent team end) from *session-boundary leadership-state release* (every session). A future federation-scale audit detector or agent could read "all `TeamDelete()` calls are dissolution" → conclude team-lead Step S5 calls violate PO authority. Same shape of misreading as the old "DO NOT TeamDelete" T06 confusion. NOT a current factual contradiction; latent interpretive trap.

2. **Concern B (borderline, low severity):** Row 5 "Shut down an agent (session end)" (line 149) authorizes individual-agent shutdown. Doesn't explicitly cover team-shutdown procedure (T06 Phases 1–5). Implicit authority is operationally well-established but not explicitly granted in T04.

**Diff proposals delivered to team-lead** -- A2 (extend Row 2 + add §Row 2 vs. session-boundary `TeamDelete` subsection) and B2 (broaden Row 5 description). Recommended Montesquieu as the wordsmith author since T04 is his domain. I cannot apply directly per scope restrictions.

[CAL-CANDIDATE 2026-05-06] Pattern fragment: governance-matrix rows benefit from explicit semantic-scope notes when an operation has both an *administrative* meaning (PO authority) and a *runtime/session-boundary* meaning (team-lead operational authority). Row 2 "Dissolve" is the n=1 instance; same shape applies to any matrix row where a primitive is authoritative-at-creation/destruction but operational-at-session-edges. Below threshold for Cal submission (n=1, no clear cross-team analog yet) -- hold for a second instance.

## T06 path-tree rewrite (2026-05-06)

[CHECKPOINT 2026-05-06] Task #1 -- T06 path-tree rewrite COMPLETE. Edits applied to topics/06-lifecycle.md:
1. Phase 2 (Clean) -- collapsed 4 substeps to single `TeamDelete()` primitive; rationale table for each obsoleted substep
2. Phase 2.0a/b (Diagnose, $HOME validate) -- replaced; `$HOME` validation moved to scoped subsection ("$HOME reliability and runtime-path notes")
3. Phase 3 (Create) -- precondition rewritten; retry rationale aligned with Phase 2's TeamDelete-first model
4. Shutdown Rationale -- rewritten with two-invariant frame (durable state to repo + in-memory release)
5. Shutdown 4-phase → 5-phase header + decision line
6. Phase 4 R7 "TeamDelete pointless" note -- marked superseded with pointer to new Phase 5
7. NEW Phase 5 (Release) -- full section with rationale, ordering invariant, symmetry table, failure modes
8. Stale-Team Recovery table -- rewritten with 6 scenarios mapped to S5-aware idempotent primitives + new key insight
9. "Reference Teams Shutdown" section (formerly "no TeamDelete") -- rewritten with canonical post-S5 sequence + historical note
10. Phase 4 reference-impl scripts -- fixed runtime-path bug (`$RESOLVED_HOME/teams/...` → `$RESOLVED_HOME/.claude/teams/...`); added pointer to $HOME validation pattern
11. Open Questions resolved -- two entries reframed (anomaly detection, $HOME reliability) to point to new Phase 2 subsection
12. Top-level Rationale -- updated to reflect post-S5 simplification

[BRUNEL-COORDINATION 2026-05-06] DO NOT EDIT -- message Brunel next session. Container Lifecycle section (lines 1135, 1182) references "Phase 2.0a" by name. With Phase 2 now collapsed and the $HOME-validation subsection renamed, the container references are stale prose. Suggested rewrite for Brunel: replace "Phase 2.0a" with "Phase 2 ($HOME reliability subsection)" or "the $HOME validation pattern documented in Phase 2." The semantics are unchanged; Brunel's container architecture conclusions still hold (Phase 2.0a was a no-op in container; the new pattern is also a no-op in container). Send via [COORDINATION] message when Brunel spawns.

[DEFERRED 2026-05-06] Phase 0 read-order row 0e (`docs/health-report.md`) -- Medici no longer auto-spawned in framework-research. Out of scope for this rewrite. Flag for next-session attention if the read-order ever ships externally.

[CAL-FILED 2026-05-06] Pattern: `wiki/patterns/repo-as-durable-store-teamdelete-as-release-primitive.md` -- Cal pulled per PO override of his (b) defer recommendation. Filed framing verified by me: cross-platform generalization (Cal's point 3) is sound, not overreach -- three-condition trigger (substrate split + no auto-sync + lifecycle crosses both) is genuinely platform-agnostic. Confidence-split (combined=n=1, mitigation=n=3) preserves information correctly. No amendments.

[CAL-FILED 2026-05-06] Gotcha: `wiki/gotchas/cross-document-prose-procedure-drift.md` -- Cal pulled. Architectural-fact entry; revision-trigger correctly bound to tooling-or-consolidation, not n>1. Cal's three-row gate-1-family scope table (one document / one repo / N teams) is sharper than my scratchpad framing -- I concur. No amendments.

[FOLLOW-UP DEFERRED 2026-05-06] Protocol C candidate: extend common-prompt Structural Change Discipline gate 1 from within-document grep to within-repo `grep -r` for prose-vs-procedure-drift defense. Cal correctly deferred this decision to me -- submitting Protocol C is a separate action. Triggers for submission: (a) second incident of cross-document drift n=2, (b) team-lead expresses interest in pre-emptive promotion, (c) tooling-revision-trigger looks unrealistic and discipline is the only viable defense. Until then, the gotcha entry stands as-is and the cost (one extra `grep -r`) is paid voluntarily by attentive editors.

## Startup/shutdown collapse (2026-04-30)

[CHECKPOINT 2026-04-30] Task #1 -- assessed apex-research #62, drafted patch to `startup.md` collapsing Steps 2/3/4 (diagnose/clean/create) into single Step 2 (Reset team state: `TeamDelete` best-effort + `TeamCreate` + verify). Step 4b (operational gate) preserved as Step 2b. Added Step S5 (TeamDelete on graceful exit) to shutdown. Added gotcha #4 documenting the in-memory-survives-`/clear` pathology. **Aen committed `426194d` (mitselek/ai-teams), pushed, and posted cross-team comment on #62 (issuecomment-4350394024) crediting our assessment + correcting Schliemann's n=0 → n=1.** S5 ordering (after `git push`) confirmed.

[GOTCHA 2026-04-30] In-memory team-leadership state survives `/clear` independently of disk. `rm -rf $TEAM_DIR` is strictly weaker than `TeamDelete`. **Cal Protocol A candidate** -- substrate-relevant, gotcha-shaped, mirrors apex-research evidence (cross-team pattern n=2). Aen will route to Cal on his next spawn.

[DEFERRED 2026-04-30] T06 amendment FOLDED INTO the existing standing chore "T06 Path-tree rewrite" (NEXT-SESSION-CHOREs, post-#60). When that rewrite happens, audit T06 lines 528 + 1025 (and any other "DO NOT TeamDelete" assertions) for contradictions with new Step S5. No urgency -- stays NEXT-SESSION until bandwidth. `docs/restart-test.md` + `docs/restart-scorecard.md` left as-is per Aen (historical scorecards; commit history covers R4 vs R8 cross-reference).

[LEARNED 2026-04-30] Schliemann's #62 reasoning is sound on FR side too. Step 4 retry-loop defended an n=1 failure mode (Restart 4 config.json absent). The collapse preserves the recovery primitive (`TeamDelete + TeamCreate`) at the *top* of every startup, eliminating the separate retry branch without losing defense. n=1 verify-on-disk failure becomes n=1 retry, not zero coverage.

## Fix session (2026-04-15)

[CHECKPOINT 2026-04-15] F1 shipped: commit `88ced06`. Extracted inline jq filter to `restore-filter.jq` sibling. Script fail-closed on missing filter. FR structural pattern kept over uikit-dev free-string.

[CHECKPOINT 2026-04-15] F2 shipped: commit `5eb7f67`. "memory" → "auto-memory" rename in prose across 9 files (audit doc, design v0.1-v0.3, protocol-a draft, 4 scripts, session-logs MANIFEST). Filesystem paths and variable names unchanged (platform-owned).

[PATTERN 2026-04-15] Structural JSON match beats free-string for protocol-field filters in inbox messages. Free-string `shutdown_request` false-positives on legitimate messages that discuss the protocol in prose (empirical: Finn's T07 safety report in montesquieu.json mentions "shutdown_request" as documentation, not as a protocol message). FR's `"type"\s*:\s*"shutdown_request"` correctly distinguishes actual JSON protocol messages from prose about them. **Cal Protocol A candidate post-Cal spawn.**

[GOTCHA 2026-04-15] uikit-dev's `1deb90e` free-string pattern is defective -- produces false positives. Cross-team debt, DEFERRED per team-lead (not this session's scope). Counter-example: montesquieu.json message from Finn discussing MEMORY.md rules. Aalto routing decision sits with team-lead.

[GOTCHA 2026-04-15] jq file parser vs command-line parser escape divergence. `\s` in a `.jq` file is an invalid escape; same `\s` via bash single-quoted command-line arg works because bash passes `\\s` to jq's arg parser which interprets `\\` → `\` then `\s` as regex. Extraction to `.jq` file requires `\\s` in the file content. uikit-dev's simpler filter (no `\s`) masked this portability bug.

## R-audit session (2026-04-14)

[CHECKPOINT 2026-04-14] Persist-coverage audit delivered. Full report: `docs/persist-coverage-audit-2026-04-14.md`. Mitigation: option (c) target-dir refusal + git check-ignore opt-in, shared helper. Ship-blockers: Flag 1 (`$TEAM_DIR` in skill patches) + Flag 3 (marker file before mitigation order). Draft persistence work on hold pending ship session.

[LEARNED 2026-04-14] Mitigation ranking (c) > (a) > (b) for substrate-guarding persist scripts, when the options are (a) container-runtime-guard, (b) `.gitignore` suppression, (c) target-dir refusal. (c) wins because it detects the ground-truth invariant ("is target git-tracked?") instead of a proxy -- no cross-team coordination tax like (a), no fail-open hole like (b). `git check-ignore` provides the opt-in escape hatch for legitimate container-mirror substrate, inverting (b)'s fail-open into fail-closed-with-explicit-opt-in. Same reasoning lens I used for rejecting env-var cwd discovery in v0.1: unenforceable cross-team invariants are worse than no check.

[DEFERRED 2026-04-14] Ship-session invariants to preserve: (1) mitigation lands BEFORE marker file re-creation (order reversal re-enables Cal's gotcha); (2) shared helper comment must warn opt-in is team-local `.gitignore`, NOT repo-root (team-lead 12:54 footgun flag); (3) helper should defensively verify `check-ignore` hit did not come from git-toplevel-level `.gitignore`.

[DEFERRED 2026-04-14] Flag 1 (`$TEAM_DIR` ambiguity in v0.3 skill patches) escalated to Cal by team-lead as supporting evidence for substrate-invariant-mismatch pattern promotion (n=3). Volta does NOT submit -- team-lead relays on pattern drafting session.

[DEFERRED 2026-04-14] Ship-session backlog SPLIT per PO (team-lead shutdown msg). F1 (jq extraction + semantic decision for `restore-inboxes.sh` -- Finn's A7/B6 finding) → near-term Fix session. D1-D7 (full persist-coverage mitigation + script defects from the audit report) → future Design session. Audit report commit: 37a0833.

[LEARNED 2026-04-14] uikit-dev-harvest read deferred from R-audit → completed in Fix session (2026-04-15). F1 fix applied.

[WARNING 2026-04-14] Four persist/restore scripts committed but NOT runnable -- marker file `.project-dir-name` absent, Section 2 mitigation not implemented. Do NOT invoke until Design session lands.

## R12 session (2026-04-08/09, pruned 2026-05-07 -- codified entries removed)

[LEARNED] 2026-04-09 -- Multi-round consensus value: "writing standalone proposals side by side made the composition visible." Three-way mid-cycle-shutdown integration emerged because Volta's git-state watchdog + Monte's 5-minute boundary + Medici's [DEFERRED-REFACTOR] handoff sat next to each other, not because any single author reached it. PO requested the Multi-Round Consensus Protocol section (c59bc76) on this basis -- the pattern is load-bearing for any future round-based design work.

[PATTERN] 2026-04-09 -- Oracle adoption trigger: scratchpad duplication threshold (30 [LEARNED]/[PATTERN] entries across team of 5+), measured at Shutdown Phase 2c, decided by PO. Additional trigger: team size ≥ 7–8 (Phase 2 cognitive overload). Not codified in T09 yet -- held as standing trigger spec.

[DEFERRED] -- Issue #48 (Oracle tier downgrade path) accepted by Celes as T09 v3 scope. My lifecycle-analysis loop-in coming when v3 starts (after T04 amendments). Three v3 questions to address: one-session vs transition session, wiki ownership post-downgrade, oracle-state.json re-adoption semantics. Status as of S28: dormant; no v3 work this session.

(R12 entries on temporal ownership, XP pipeline spawn order, ARCHITECT test-plan handover, wiki persistence, Librarian SPOF, Medici-not-in-deployed-teams, head-scratcher #13, research-team wiki META-domain, lookahead adaptivity, PURPLE git-state watchdog spec, health-sensor signals, multi-round-consensus per se -- all codified in T06 / T09 v2 / common-prompt / wiki and pruned. The files are the durable artifact.)

## Prior sessions (pruned 2026-04-15, key decisions retained)

[DECISION] R9 2026-03-18 -- Git isolation: 3 archetypes (independent-output=worktree, pipeline=directory-ownership-on-trunk, hybrid=split). Written to T06. Polyphony-dev classified as independent-output.

[PATTERN] R9 2026-03-18 -- Worktree isolation is a DOWNGRADE for pipeline teams.

[PATTERN] R8 2026-03-17 -- Observability is a byproduct, not a system.

[PATTERN] R6 2026-03-14 -- Script-based lifecycle ops: derive paths from $SCRIPT_DIR + $HOME.
