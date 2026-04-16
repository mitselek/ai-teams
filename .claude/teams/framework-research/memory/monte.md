# Montesquieu — Scratchpad

## Session: 2026-04-08

[CHECKPOINT] Posted governance analysis to Discussion #46 (XP Development Pipeline)

- Comment URL: <https://github.com/mitselek/ai-teams/discussions/46#discussioncomment-16487422>

[DECISION] Key governance positions taken:

1. PURPLE authority model: Judicial (not Executive or Advisory) — disputes escalate to ARCHITECT
2. ARCHITECT sits at L2.5 — binding scope authority over pipeline agents, below team lead
3. Pipeline = micro-governance system nested inside team governance
4. PURPLE authority boundary: restructure yes, reimplementation no, test modification no, interface changes no
5. Three-strike rule reframed as jurisdiction signal, not punishment
6. Cathedral tier governance trigger: team lead context capacity overflow

[CHECKPOINT] Posted governance analysis to Discussion #47 (Shared Knowledge Base)

- Comment URL: <https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16487537>

[DECISION] Key governance positions taken (KB):

1. Librarian authority: autonomous specialist with Medici audit (editorial authority, not substantive)
2. Wiki ownership: directory sovereignty — Librarian is sole writer to wiki/
3. Conflict resolution: surface with [CONFLICT] tag, route to domain expert via team lead
4. Cross-team knowledge: federated model (each team owns wiki, share via T03 handoffs)
5. Deletion authority: Librarian archives freely, permanent deletion requires team lead approval
6. Knowledge provenance: every wiki entry carries source, discoverer, last-verified, status metadata
7. Librarian and Medici must be separate (audit vs. curation separation)
8. Cathedral tier only — Sprint/Standard teams do not need a Librarian

[CHECKPOINT] Posted round 3 governance analysis to Discussion #47 (topics 8-10)

- Comment URL: <https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16498611>

[DECISION] Key governance positions taken (KB round 3):

1. Bootstrap: three-phase (Librarian inventories → team lead reviews TOC → Librarian populates). Governance gate at Phase 2.
2. Source linking: wiki entries link to source files. [VERIFY] tag on changes, resolved by domain expert. No auto-invalidation.
3. Librarian diagnostic: formalized as Knowledge Health Diagnostic report. Librarian observes/reports, team lead acts. Covers 4/6 Medici categories.
4. Bright line: Librarian diagnoses, does not prescribe.

[CHECKPOINT] Posted round 4 governance analysis to Discussion #47 (head-scratchers 13-15)

- Comment URL: <https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16500365>
- Verified intact (15,306 chars, not truncated)

[DECISION] Key governance positions taken (KB round 4):

1. #13 Shared PURPLE: separate per pair. Cross-pipeline patterns = ARCHITECT's scope, not PURPLE's. Librarian bridges cross-pipeline insights.
2. #14 Wiki domain: subject knowledge stays in topics/*.md (already governed), wiki holds process knowledge + cross-cutting observations. Artifacts (apex-research API inventory) stay where they are.
3. #15 PO MEMORY.md: deliberately separate, no bridge. One-way flow team→PO only, at PO discretion. Constitutional analogy: team wikis = departmental KBs, PO MEMORY.md = head of state briefing book.

## Session: 2026-04-09 (Round 5)

[CHECKPOINT] Read Celes's T09 synthesis document and round 5 seeds on #46 and #47.

[LEARNED] Governance positions preserved accurately in T09:

- PURPLE scope boundary (lines 104-117): exact match to my round 4 language — may restructure/rename/extract, may not change public interfaces, create modules, modify tests, delete tested code paths
- Judicial model (line 202-212): PURPLE executive authority + judicial escalation + three-strike as jurisdiction signal — all preserved
- L2.5 ARCHITECT hierarchy (lines 236-257): delegation matrix additions intact, authority scoped to single story
- PO MEMORY.md as deliberately separate (lines 619-639): "the PO is the bridge" captures my constitutional analogy in concise form. Head-of-state briefing book framing not included verbatim but the principle (L0 vs L2 separation, no automation, one-way flow via human-mediated promotion) is intact

[GOTCHA] My #14 position is MISREPRESENTED in Part 4 line 720:

- Celes writes: "Monte's position: Process knowledge only. How to run discussions, how to synthesize findings... Subject knowledge (framework patterns, team design findings) belongs in the topic files"
- My actual round 4 position: process knowledge AND cross-cutting observations (insights that span topics but don't belong in any single topic file). Not "process only."
- Celes's proposed resolution (common-prompt holds stable process, wiki/process/ holds emerging process, subject stays in topics) is GOOD for the process dimension but silent on cross-cutting observations.
- I must clarify my position AND respond to her proposed resolution.

[DECISION] Celes's #14 resolution is ACCEPTABLE with one addition: wiki needs a `wiki/observations/` or `wiki/cross-cutting/` section for insights that span multiple topic files. Without it, cross-topic observations have nowhere to live — they're too specific for common-prompt, too cross-cutting for a single topic file, and too team-wide for scratchpads.

[DECISION] #13 Shared PURPLE — Celes's synthesis uses "domain distance" axis which is DIFFERENT from my round 4 "authority scope" argument, but they converge on the same answer for most cases. Her axis is pragmatic (cost-benefit). Mine is principled (authority boundary). Both lead to separate PURPLEs for Cathedral tier. I should endorse her framing as complementary.

[DECISION] PO MEMORY.md section in T09 is solid but could use one governance strengthening: explicit mention that L3→L0 automated flow is forbidden (not just "must not happen"). The principle is buried in bullet points — make it a named rule.

[CHECKPOINT] Other round 5 observations from reading T09:

- Line 368 "Exception for promotions" — my round 1 governance gate for common-prompt changes is preserved
- Line 405 "Directory sovereignty" — my round 1 wiki ownership is preserved
- Line 544 "Team-lead governance gate" for bootstrap (line 551) — my round 3 three-phase bootstrap with governance gate is preserved (though renamed and condensed)
- Line 611 "Tone discipline: observe and report, never instruct" — my round 3 "Librarian diagnoses, does not prescribe" is preserved verbatim concept

[CHECKPOINT] Posted round 5 responses on both discussions.

- #46: <https://github.com/mitselek/ai-teams/discussions/46#discussioncomment-16501179> (8,555 chars, intact)
- #47: <https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16501181> (12,105 chars, intact)

[DECISION] Round 5 positions:

- #46: Governance preserved correctly. Three minor refinements proposed: (1) name "pipeline-level governance" as first-class concept, (2) add authority caveat to shared PURPLE case, (3) mid-cycle PURPLE shutdown grace period = 5 min with team lead termination authority thereafter.
- #47: Clarified #14 position — process AND cross-cutting observations, not process only. Endorsed Celes's resolution with addition of `wiki/observations/` section governed by three rules (cite topics as authoritative, promotion requires topic owner consent, not substitute reading). PO MEMORY.md: request elevation from bullets to named rule "L3→L0 automated flow is forbidden."
- Endorsed Finn's "consequence of structural debt" axis over my original longevity framing.

## Session: 2026-04-09 (Round 6 ACK)

[CHECKPOINT] Verified T09 v2 rendering of governance contributions (commits ad367f1 + c59bc76).

[DECISION] L2.5 binary call: ACCEPTED.

- Label changed from "L2.5" to "Spec Writer specialization with scoped authority"
- Substance preserved: all 6 delegation matrix rows intact (story decomposition, test plan ordering, scope dispute, structural refactoring, mid-cycle termination, cross-pipeline pattern extraction)
- ARCHITECT still has binding authority — encoded in matrix "D" entries
- Pipeline Governance as a Nested System section exists as first-class section (my round 5 request)
- Call does NOT reverse my position (substance unchanged, only framing)

[GOTCHA] Hammurabi precedent has minor imprecision:

- Hammurabi in apex-research drafts specs, Schliemann (L2) approves transitions
- ARCHITECT has binding authority without per-decision L2 approval
- The precedent is weaker than the framing implies
- NOT a T09 v3 concern — matrix is correct; handle in T04 amendment drafting

[LEARNED] All round 5 contributions rendered verbatim:

- PURPLE scope boundary may/may-not list (lines 108-119)
- Shared PURPLE authority caveat (line 121) with my exact prompt text
- Mid-cycle shutdown: 5 min soft boundary composed with Volta's watchdog (lines 259-280)
- wiki/observations/ three rules verbatim (lines 1012-1016)
- L3→L0 named rule (lines 877-893) extended with Finn's anti-pattern
- Pipeline Governance as Nested System first-class section (lines 299-310)

[DECISION] Posting ACK option 1 (position accurately rendered, no further concerns). Delegation matrix carries the authority content; label change is secondary. Hammurabi nuance handled during T04 amendment drafting, not as a round 6 issue.

[CHECKPOINT] Celes ACK-of-ACK received (4 of 6). She endorsed my Hammurabi precedent nuance framing and sketched suggested T04 opening text (see below). Team-lead holds greenlight for T04 drafting; will arrive after remaining 2 ACKs (Volta, Finn).

[LEARNED] Celes's suggested T04 opening text for the Hammurabi precedent distinction (to use in first governance delegation row):

> ARCHITECT's binding authority over RED/GREEN/PURPLE is stronger than the canonical Spec Writer pattern (e.g., Hammurabi → Schliemann review gate). ARCHITECT's decomposition is binding without L2 re-approval within the story's scope. This is the innovation — a bounded zone of L3 autonomy over L3 peers that does not require a new hierarchy level because the scope (one story) is the structural constraint.

This is a starting sketch, not the final text — my job to write when drafting begins. But it captures the key framing: scope (one story) is the structural constraint that replaces the hierarchy level.

[DEFERRED] Next phase — T04 amendments (awaiting team-lead greenlight):

- 6 delegation matrix rows for #46 governance (encoded in T09 v2 already)
- ~4 Oracle governance rows for #47
- T04 cross-reference to "L3 → L0 automated flow forbidden" named rule
- Hammurabi precedent nuance explicit distinction in first governance row (per Celes's sketch)
- Pipeline Governance as Nested System as new T04 sub-team pattern

## Session: 2026-04-15 (xireactor-as-shared-KB pilot governance, #59)

### [DECISION] Governance design doc v6 committed

Artifact: `docs/xireactor-pilot-governance-2026-04-15.md` (v6 is session-final)

Key structural decisions:
1. **Four-zone tenancy** — FR-private, apex-private, FR-owned shared-read, apex-owned shared-read, + tiny shared-write zone. Isolation is the default; shared access is opt-in per-entry.
2. **Three framing principles (§0.1)** — (a) isolation is the default, (b) `owned_by` never auto-flips, (c) durable disagreement is a valid terminal state. "These principles are not negotiated in this document. If the PO or a stakeholder wants to reject any of them, that rejection propagates to mechanism-level rework."
3. **Three-state `owned_by` as first-class attribute (§3.2.1)** — `owned-by-FR`, `owned-by-apex`, `co-owned`. The ownership state alone selects which governance layer applies. `co-owned` is the ONLY state the staging pipeline governs.
4. **`owned_by` invariant (§3.6.3)** — named, first-class. `owned_by` never auto-flips; every path into `co-owned` is a deliberate ratified act. Schema constraint: `NOT NULL`, default to submitting librarian's single-tenant value, never `co-owned`.
5. **Strategic asymmetric use of staging (§3.2)** — Protocol A (librarian gate) for intra-tenant writes; xireactor staging pipeline for inter-tenant writes. They meet only at shared-write. Not bug, not feature — each layer governs a different boundary.
6. **Simultaneous-discovery protocol (§3.6)** — when both librarians discover same pattern, fresh co-owned entry is filed as synthesis; neither original entry auto-promotes; `owned_by` never auto-flips; disagreement is a valid terminal state.
7. **Four-signature ownership-transfer ritual (§2.3)** — two librarians + two team-leads countersign. PO appropriateness acceptance still pending.
8. **Three-layer authority-drift defense (§4)** — ownership-transfer ritual (deliberate grabs), shared-read sunset review (accidental accumulation), audit-independent tenant-boundary report (structural blind spots). Auditor is neither tenant.
9. **Cross-review rides bootstrap-preamble channel (§5)** — xireactor `session_init` surfaces pending cross-reviews via #43 pattern. New payload class: governance (not continuity).
10. **Topology converged with Brunel (§7.1)** — row-level-only, single instance, single DB, `app.org_id` RLS, `owned_by` column. My v1 schema-per-tenant recommendation was wrong and withdrawn.

### [DECISION] Protocol D naming locked

Herald proposed, Monte accepted. Cross-tenant submission+review protocol is Protocol D (sibling to Protocol A/B/C in `types/t09-protocols.ts`). Flow B is Herald's internal §2 label. "Protocol A-prime" is retired. Next-session revision pass replaces all A-prime references with Protocol D.

Key reasoning: Protocol D fills a canonical-taxonomy slot that already has three siblings (A/B/C). W3 (declined earlier) was a re-introduction of a discarded enumeration. The distinction between "filling a taxonomy slot" and "re-introducing a discarded ladder" is the load-bearing argument.

### [DECISION] §7.2 precondition classification — STALE, rework pending next session

Herald's v1.1 §A SOFT/MEDIUM classifications retracted on honest re-read of digest. Both Q1 (per-zone staging) and Q2 (tenant-scoped session_init) land at outcome (c) — digest silent, source-code walkthrough required. Q3 (ownership-transfer wire format) remains DELIVERABLE.

My v6 has a stale-classification warning stamp at the top of §7.2 flagging this. The SOFT/MEDIUM body text is preserved as historical context but explicitly marked superseded. **§7.2 rework is the first next-session task** — fold the (c)/(c)/DELIVERABLE landing cleanly and update §8 summary + §7.4 pilot sequencing references.

PO-brief framing: "two outcome-(c) source-code walkthroughs during infra stand-up + one deliverable." (c) = gating diagnostic (what does the endpoint do?), NOT validation of hypothesis (confirm it does what we think). Brunel scopes the walkthrough accordingly.

### [LEARNED] Self-correction discipline — three instances this session

**Instance 1 — my own v1→v4 schema-per-tenant → row-level-only.** I was reaching for structural cues that the three-state ownership model already provides at a cheaper layer. Schema separation was an attempt to give the cross-tenant boundary physical weight; once §3.2.1 named three ownership states as a first-class attribute, the structural cue was already in the data model — at the column level — and the schema boundary became redundant.

**Instance 2 — Message A → Message B on Protocol D.** Message A declined W3 (correct: the W-ladder was a climbing device, not the answer). Message B accepted Protocol D (correct: a pre-existing taxonomy slot in `types/t09-protocols.ts`). I over-generalized from "declining the W-ladder" to "declining any external label" and Herald caught the contradiction. The "ladder vs answer" framing applies to W3 but NOT to Protocol D — Protocol D is a pre-existing taxonomy slot that was always there.

**Meta-lesson on both:** when I reject a naming or structural pattern, check whether the rejection applies to the *specific instance* or the *category*. Generalizing from one rejection to the category is the shape that produced the Protocol D contradiction. Cal's offered reflex-phrase for the tenancy-model version: *"before introducing a new discriminator in a tenancy model, check whether it collapses with existing discriminators; if it does, the collapse IS the bug."* The naming-decision version: *"before rejecting a naming proposal, check whether the rejection applies to this label's rationale or to all labels' rationale."*

### [LEARNED] Second-read discipline and retraction cascades

Two specialists self-caught over-commitments on second-read this session (Brunel's v0.1 Tier-3 OFF/ON phantom experiment → v0.2; Herald's v1.1 SOFT/MEDIUM extrapolation → v1.2 outcome-c). One cross-specialist catch (Herald caught my Protocol D contradiction).

**The team-health property worth preserving: the second-read discipline is the load-bearing gate, not the first-read output.** If a specialist lands on a first-read they do not re-verify, downstream consumers build on extrapolations as facts.

**Adjacent property that makes self-catches work: the retraction cascades immediately.** Both specialists surfaced corrections in the NEXT MESSAGE, not the next session. If the retraction lags, downstream commits build on stale assumptions. The compounding failure mode is what turns a first-read error into a session-level regression.

**Cross-specialist extension (Herald's framing):** "Don't bridge contradictions you didn't author." When a teammate's two messages disagree, the catcher's default is surface-and-ask, not silently pick the resolution that matches their current scratchpad state. The silent-pick failure mode is seductive because the catcher's prior work acts as invisible bias.

Cal wiki candidates at n>=3: "honest second-read beats confident first-read" or "extrapolations compound downstream; retractions must cascade immediately."

### [LEARNED] Walk convergence history forward; don't cite snapshot as current

When referencing a specialist's earlier work, walk the history forward to the latest state rather than citing the snapshot. The failure mode: Aen relayed my v1 schema-per-tenant call to Brunel without checking whether my own later §3.2.1 had moved past it. Same discipline from three roles: my "walk convergence history forward," team-lead's "integration not relay," Brunel's "pre-fold consistency check."

### [LEARNED] Independent convergence from orthogonal starting questions is evidence the shape is emergent

Three specialists converged on asymmetric-cross-tenant-only shape from orthogonal questions:
- Brunel (substrate): "what is the physical topology that matches upstream?"
- Monte (governance): "how do two tenants share a governed space?"
- Cal (discipline): "what is the cost of moving FR's wiki to xireactor?"

The convergence was not designed. Independent convergence is structurally stronger evidence than post-discussion agreement — the second kind is compatible with shared blind spots, the first survives independent structural scrutiny.

Herald + Monte convergence on the three-state model + Flow B/Protocol D was also lossless and independent. "Lossless independent convergence" (no rework needed on either side to accommodate the other) is a distinct quality from "worked-it-out" convergence.

### [DEFERRED] Wiki-candidate patterns at n=1 (file-when-second-instance)

1. **"Degradation protocols must be strictly weaker than normal-path protocols, never stronger."** Test: if the failure mode completes an act the normal path wouldn't have completed, the degradation protocol is stronger than the normal one. From §9.2.2 quorum-under-degradation design. Routed to Cal.
2. **"Multi-mode failure modes need multi-mechanism defenses."** Three-check authority-drift design (§4.1) as instance. Defense-in-depth applied to governance, not security. Routed to Cal — she evaluated and deferred at n=1 in her §11.6.1.
3. **"Convergence decomposition: adopt (A) / reject (B) / sharpen (C)."** Three directions of lossless convergence between specialists. All three appeared on different axes this session. Direction C-reversed (cross-specialist catches the consumer's self-contradiction) is a subtype worth naming separately if n=2 surfaces.

### [WARNING] §7.2 stale classifications: next-session reader beware

The v6 stale-classification warning stamp in §7.2 prevents acting on retracted evidence, but does NOT rework the section. Next-session rework must also update §8 summary table and §7.4 pilot sequencing, both of which still cite the retracted SOFT/MEDIUM classifications. Grep for "STALE CLASSIFICATION WARNING" in the governance doc to find the stamp and all flagged touch points.

Additionally: Brunel's §10 oscillation (7-revision trajectory) was substrate-speculation dressed as reasoning. §10's §1.2-compliance is itself outcome (c) pending source-code walkthrough, not settled at v0.6.3. Relevant context for the §7.2 rework — both §7.2 and Brunel's §10 are (c)-class items that need the same source-code walkthrough to resolve.

### [NEXT-SESSION] First task: §7.2 rework

1. Fold Herald v1.2's honest (c)/(c) landing into §7.2 body text (remove SOFT/MEDIUM, replace with outcome (c) framing)
2. Update §8 summary table's §7.2-dependent rows
3. Update §7.4 pilot sequencing references from retracted classifications to (c)/(c)/DELIVERABLE
4. Replace "Protocol A-prime" placeholders with "Protocol D" throughout
5. Add §3.4 → Herald §2.5 cross-reference (audit-trail-as-purpose vs side-effect)
6. Cite Cal's §11.5.1 falsifiable-cross-tenant-claim rule as authoritative form of §7.3.1 pre-classification zone check
7. Cite Cal's §6.5 empowerment claim as canonical pilot-framing sentence

### [UNRESOLVED] PO-scope decisions tracked for the PO brief

- 4-signature ownership-transfer ritual appropriateness (my flag — PO's call)
- Post-pilot efficacy-review session trigger (my flag)
- Cal's §6.4 pass/fail criteria as runtime acceptance gate for the asymmetric-slice pilot (Cal's flag — needs explicit PO confirmation that the asymmetric shape is the pilot he wants)
