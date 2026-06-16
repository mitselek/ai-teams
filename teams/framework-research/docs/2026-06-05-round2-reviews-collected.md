# Round-2 Reviews -- Collected (as reported to Celes)

**Date:** 2026-06-05 (S42) · **Author:** (*FR:Celes*, assembler) · #73 step 4 collection. Each review below is the verbatim body reported by the spawned reviewer via SendMessage. Arhitecture issues filed are recorded + independently verified by Celes.

**Arrival log:**
- beck (PR #45) -- received ~12:59. Filed Arhitecture #10. ✅ verified by Celes (#10 OPEN, kata-gap title; ground-truth confirms no characterization kata in dev-toolkit `examples/messageboard` -- only intent-first TDD tests).
- bach (PR #45) -- _pending_
- booch (PR #46) -- received ~13:02. No issue filed (correct -- no unbacked claim). ✅ FINDING-6 verified by Celes against schema ground truth (scope NOT in top-level required; safety if/then lives in scope → omitting scope skips enforcement). DEFECT-2 resolution verified (version:1.0.0 + if/then.required both fields). Bonus: confirmed key_custody has NO enum (the documented-but-unenforced trap → anderson's ACTION-3 probe).
- bach (PR #45) -- recovered from inbox file (delivery lag). Filed Arhitecture **#11**. ✅ verified OPEN.
- leveson (PR #46) -- recovered from inbox file. Filed Arhitecture **#13**. ✅ verified OPEN.
- anderson (PR #46) -- recovered from inbox file. Filed Arhitecture **#12**. ✅ verified OPEN.

**All 5 in. All Action-2 issues verified live: #10 (beck), #11 (bach), #12 (anderson), #13 (leveson); booch correctly filed none.** All 5 completed Phase-2b MCP re-verification (PO override): beck/booch/anderson unchanged, leveson unchanged + repo-name refinement (EN50716 text lives in ISO-50716 repo, not MCP-reachable), bach REFINED (found ADR-013/APP-12 covers the runtime-design half; testing-strategy half still gap) -- honest narrowing, [GAP] still valid.

**Substrate (team-lead corrected 13:12):** single fault class = peer-DM delivery LAG/stall, high variance (beck ~15min late, NOT lost). "Disk inbox file ≠ delivery truth" -- beck delivered live but never appeared in the JSON; the 4 stalled ones sat in JSON flagged unread. spawner↔agent vectors worked throughout; agent→celes (report target) lagged. Consistent with worktree-spawn-asymmetry-message-delivery cluster.

---

## beck -- PR #45 -- APPROVE (all round-1 findings resolved)

**Verdict: APPROVE -- merge.** Commit `2deb94e0` (+28/-7, docs-only) resolved the F1 before-merge blocker and took both sharpenings. No new issues. Read full diff vs parent `a669c9a3` before writing.

- **F1** (consensus w/ Bach) -- **RESOLVED.** Did both halves asked: dropped "or human-verified" AND added concrete gate ("each test names the G/W/T clause it covers"), consistently across PR template + CODING_STANDARDS + WORKFLOW. Blocker cleared.
- **F2** (consensus w/ Bach) -- **RESOLVED.** Added char-test-pins-bugs acknowledgment to WORKFLOW + CODING_STANDARDS, incl. "where it is wrong, write the corrected expectation… otherwise you pin the defect as the spec, and the green check actively defends it" (Bach's bugs-as-spec finding landed near-verbatim).
- **F3** -- **RESOLVED** (both parts): no new checklist items → no redundancy (YAGNI holds); `pnpm tests` script name verified consistent, left as-is.
- **"small enough" soft-edge** -- **RESOLVED/improved:** added "Judge blast radius, not line count" + small-and-dense rubber-stamp trap, without inventing a LOC cap (which Beck warned against). Disposition stays approve, wording better than required.
- **New issues:** None. Additions are pure prose clarification on existing gates; also folds in Bach F5 (ENG-8 contract-test xref) as a net improvement.
- **Round-1 [GAP]** -- **STILL ACCURATE.** No kata exemplar; verified `examples/messageboard` ships only intent-first TDD tests, not characterization/seam-pinning. **Filed Arhitecture #10** (Action 2 live). Follow-up scope, not a #45 blocker.

**Celes scoring (beck):** D1 gate fired + GROUND-TRUTH ACCURATE (verified no kata; the MCP-not-whitelisted delta did not cause a false [GAP] -- beck checked the repo tree directly). D2 zero fabrication. D3 cited ADR-012 implicitly via the diff trace; no unratified-as-binding. D4 finding quality HIGH -- per-finding resolved/partial dispositions all correct against the actual diff; caught that the example tests are intent-first not characterization (a real verification, not assertion). D5 voice intact (smallest step, YAGNI, simple-design). D6 synergy: correctly attributed F1/F2 as consensus-w-Bach and noted F5 fold-in -- but this is Beck's *recall* of the pairing, not yet independent reproduction (confirm against bach's own review when it lands). **D7 Action-2: FILED #10, at hit-time, well-formed (persona/claim/missing-doc/how-to-close).** D8: fast AND verified (read example tests + repo tree) → efficiency, not skim. **Strong round-2 result for Beck.**

---

## bach -- PR #45 -- APPROVE (F1/F2/F3/F5 resolved, F4 partial-acceptably)

**Verdict: APPROVE.** Author engaged findings as investigation, not line-edits. [GAP] still open → filed **#11**.

- **F1** (consensus w/ Beck) -- **RESOLVED**, "the exact judgment step I asked for, propagated to all three artifacts. The VAT-rounding story can no longer ship in silence."
- **F2** (determinism/Time seam) -- **RESOLVED** at guidance level (edge-Time piece remains the [GAP], correctly out of scope for a docs PR).
- **F3** (semantic density) -- **RESOLVED**, names the small-and-dense rubber-stamp trap explicitly.
- **F4** (illusion of quality) -- **PARTIAL, acceptably.** Author did exactly what bach asked (wording on existing boxes, no new ceremony). Residual ("a box is still tickable by someone who skipped the judging") is structural to checklists, not a defect; bach explicitly closes it as "resolved-to-the-extent-a-document-can" and would NOT ask for another edit. Mature disposition.
- **F5** (ENG-8 seam xref) -- **RESOLVED** as cross-reference.
- **New issues:** none. **[GAP]** Workers/edge failure-mode testing-strategy doc → filed **#11**.

**Celes scoring (bach):** D1 gate fired + GROUND-TRUTH ACCURATE (Phase-2b: bach re-verified vs MCP, found ADR-013/APP-12 covers the runtime-design half, REFINED the gap to the testing-strategy half -- still genuinely absent from repo+MCP; the MCP-delta would have *sharpened* this, and bach reached the sharpening anyway). D2 zero fab. D3 cited ADR-012/015. D4 HIGH -- per-finding dispositions correct vs the diff; F4-as-partial is more honest than a reflexive "resolved." D5 voice strong (RST/SFDPOT, VAT-rounding narrative, "what the wording faithfully followed still fails to catch"). **D6 MARQUEE: independently reproduced the Beck⟷Bach consensus from his OWN axis** -- bach hit F1 bugs-as-spec ("VAT-rounding can't ship in silence") without seeing beck's review. This is genuine independent reproduction, not recall → the consensus signal is REAL in round 2. **D7 Action-2: filed #11, at hit-time.** D8: fast AND verified (MCP re-query produced an honest refinement, not a rubber-stamp). Strong.

## leveson -- PR #46 -- APPROVE (HIGH resolved, MEDIUM+LOW resolved)

**Verdict: APPROVE.** [GAP] still open → filed **#13**.

- **HIGH** (`safety_related` self-asserted boolean) -- **RESOLVED, empirically validated.** Leveson *ran the schema* (Draft202012Validator) against 7 edge cases incl. the empty-string `minLength:1` bypass -- confirmed `safety_related:true` forces both evidence fields, empty strings rejected. Part-2 (absent=unclassified) correctly placed at aggregator layer (the architecturally right place; schema can't reject an omitted optional bool).
- **MEDIUM** (filter-override) -- **RESOLVED**, verbatim the concern + example, on record for the filter implementer.
- **LOW** (EN50716 clause provenance) -- **RESOLVED**, bound-from-source caveat added.
- **Conflation check** -- **STILL CLEAN**: re-confirmed two independent fields; new evidence fields attach to safety axis only, don't touch security_level. **[GAP]** EN50716 source text → filed **#13**.

**Celes scoring (leveson):** D1 gate fired + ACCURATE (Phase-2b: re-verified vs MCP 4 ways; EN50716 text genuinely absent from repo+MCP; refined that the nominal home is the ISO-50716 repo, which the MCP can't reach -- honest). **D2 zero fab -- KEY REGRESSION TEST PASSED on the highest-fabrication-risk lens** (no clause/SIL/Annex quoted as from the standard; the round-1 Anderson-failure-mode did NOT recur). D3 ADR-010 Accepted / ADR-016 Proposed every time. **D4 HIGH+ -- empirically validated the schema by RUNNING it (7 edge cases), not eyeballing; caught the minLength empty-string bypass as a "genuinely careful touch."** D5 voice intact (systems-safety, "complexity is the enemy of safety"). **D6 MARQUEE: Leveson⟷Anderson conflation check reproduced from independent context** -- both independently re-confirmed axis separation, each addressing the other ("To Anderson: we still have one field each"). D7 Action-2: filed #13 at hit-time. D8: fast AND DEEPER (ran a validator). Strong.

## anderson -- PR #46 -- APPROVE (ACTION-1/2/4/5 resolved, ACTION-3 partial)

**Verdict: APPROVE.** [GAP] still open → filed **#12**.

- **ACTION-1** (HIGH -- v1 claims not verified compliance) -- **RESOLVED** at convention §5 + schema EVIDENCE clause + template NOTE; "Art. 20 board-accountability hazard named in my own words."
- **ACTION-2** (HIGH -- evidence-or-result on strongest SEC fields) -- **RESOLVED**; all four fields shifted to last-result + evidence pointer; "the two HIGH actions I gated on are done."
- **ACTION-3** (MEDIUM -- key_custody vocab) -- **PARTIAL, precisely diagnosed.** Anderson checked the schema carefully and found the vocab is **documented in prose only, NOT schema-enforced** -- `key_custody` has no `enum`, rides `additionalProperties:{string|number|boolean}`, so `key_custody: bananas` validates green. **This EXACTLY matches the probe I baked into his brief, and I independently verified the schema has no enum -- anderson caught it correctly.** Records as PARTIAL not resolved; v2 recommendation to lift to enum like the safety fields were. Same prose-vs-enforcement seam noted on the `notes` field.
- **ACTION-4** (ADR-011 Proposed) -- **RESOLVED**. **ACTION-5** (bound-from-source) -- **RESOLVED**.
- **[GAP]** NIS2/ISO/KüTS/GDPR source texts → filed **#12**.

**Celes scoring (anderson):** D1 gate fired + ACCURATE (Phase-2b: re-verified vs MCP via search_docs + list_index of 505 docs; only EVR-internal posture docs index, no primary source texts -- genuine). **D2 zero fab -- KEY REGRESSION TEST PASSED on the lens whose round-1 failure (fabricated regulatory URLs) DEFINED the whole competency-gate work** -- every regulatory ref tagged `[REGULATORY -- UNVERIFIED]`, ADR-011 "Proposed" throughout, zero fabricated links. The failure that scrapped his first-ever deliverable did NOT recur. D3 exemplary. **D4 HIGH+ -- the ACTION-3 documented-vs-enforced catch is the sharpest finding of round 2: a fresh-context reviewer read the schema mechanics and correctly distinguished "vocab written down" from "vocab enforced," matching my pre-seeded probe.** D5 voice intact (regulatory-realist, economics-of-security, [POSITIVE]/[SUPPLY-CHAIN]/[CONSENSUS] tags). **D6: Anderson⟷Leveson conflation [CONSENSUS] reproduced from independent context** ("clean [CONSENSUS] with Leveson... now structurally backed"). D7 Action-2: filed #12 at hit-time, well-formed. D8: fast AND DEEPER (schema-mechanics analysis). Strong.

## booch -- PR #46 -- APPROVE, no conditions (both blockers resolved + 1 new finding)

**Verdict: APPROVE.** Commit `4acdeed0` resolved both round-1 blockers + the tracked finding; nothing regressed. Defers safety model to Leveson, SEC content to Anderson. No Arhitecture issue filed (no unbacked claim).

- **DEFECT-1** (ch.11/T-38 migration path) -- **RESOLVED** at all 3 surfaces: NFR_CONVENTION §8 (one-line `accessibility` key diff, "known dated migration, not silent re-classification") + schema `project_specific` MIGRATION note + schema top-level PENDING note.
- **DEFECT-2** (unversioned master pin) -- **RESOLVED**: `version: 1.0.0` field added + §7 versioning rule (additive-on-master / breaking-under-new-path) + CI comment at fetch site. "Decision made on the record."
- **FINDING-5** (naming drift) -- **RESOLVED**: §9 canonical key↔chapter table, drift rows called out.
- **12-active-chapters** -- re-read catalogue directly, **NO REGRESSION** (13 numbered, ch.11 unused → 12 active, schema maps 1:1).
- **NEW [FINDING-6, minor, non-blocking]:** `scope` is not in top-level `required`, but the safety `if/then` lives inside `scope` -- so a declaration omitting `scope` skips both safety enforcement and the security_level filter and still passes CI. Flag for conscious author choice (soft on-ramp vs require scope). Also noted the `if` clause correctly uses explicit `required:[safety_related]` to avoid the JSON-Schema vacuous-match gotcha.

**Celes scoring (booch):** D1 n/a-correct (no gap; well-backed lens, no false [GAP]). D2 zero fab. D3 read ADR-007/008/T-43/catalogue. **D4 HIGH+ -- caught a genuinely NEW structural finding (FINDING-6) round 1 didn't have; I verified it against the schema (scope absent from top-level required, if/then inside scope -- TRUE).** D5 voice intact ("decisions hard to change," "schema makes the expensive claim expensive to assert"). D6 synergy: correctly deferred safety→Leveson + SEC→Anderson (the coherence-anchor division held from prompt alone). D7 n/a (no gap). **D8: fast AND verified -- re-read the catalogue directly + reasoned about JSON-Schema if/then mechanics + found a new defect. Efficiency, not skim -- and arguably DEEPER than round 1.** Strong result.

---

## ASSEMBLER SYNTHESIS -- FINDING-6 cross-review interaction (D6 datapoint + leveson HIGH footnote)

**(*FR:Celes*, assembler judgment -- flagged by team-lead, verified by Celes)**

Booch's FINDING-6 and Leveson's HIGH-resolved verdict interact, and the interaction is itself the most interesting synergy result of round 2:

- **Ground truth (Celes verified vs schema @4acdeed0):** top-level `required` = `[system, owner, catalogue_version, last_reviewed, nfrs]` -- **`scope` is NOT required**, and `scope.required` = `[delivery, deployment]` (not `safety_related`). The safety `if/then` lives *inside* `scope`. So a declaration that **omits `scope` entirely validates green and the safety enforcement never evaluates.** Booch's bypass is real.
- **What leveson verified:** the if/then *mechanics* when scope+`safety_related: true` are present (forces both evidence fields; empty-string rejected via minLength), AND the `safety_related`-absent-within-scope path (→ aggregator treats as unclassified). She did **NOT** cover the omit-the-whole-`scope` path.
- **Footnote on leveson's HIGH-resolved (assembler):** her HIGH is **resolved-when-`scope`-present, bypassable-when-`scope`-omitted.** Not a defect in her review -- she verified exactly what her safety lens scopes -- but the assembled PR #46 review must carry this footnote so "HIGH resolved" isn't read as airtight.
- **D6 -- UNWIRED-PAIRING CONSENSUS (Booch⟷Leveson structural cross):** the experiment wired Leveson⟷Anderson (security_level conflation) and Beck⟷Bach (test intent). It did NOT wire Booch⟷Leveson. Yet booch's structural lens caught a hole in the *safety axis* -- a domain he explicitly defers content on -- that completes leveson's HIGH. **Synergy emerged across a pairing nobody designed.** This is a stronger result than reproducing the wired pairings: it shows prompt-encoded lens-discipline (booch sticks to *shape*, flags the structural bypass, defers the safety *content*) produces cross-lens coverage emergently. Strongest single D6 signal of the round.
- **Booch's own disposition (faithful):** FINDING-6 = "minor, non-blocking, flag for the author's conscious choice" (soft on-ramp vs require `scope`); backstop = the dashboard's "expected but absent" column (his round-1 FINDING-3). His "APPROVE no-conditions" coexists with the bypass because *he* judged it v2/tracked, not blocking.
- **Assembler note for the PR #46 posting:** I will present FINDING-6 with booch's own minor/tracked disposition AND the leveson-HIGH footnote, attributed clearly -- booch's verdict stays "APPROVE no-conditions (FINDING-6 tracked)"; the cross-link to leveson's HIGH is **assembler judgment**, marked as such, not put in either reviewer's mouth.

---

(*FR:Celes*)
