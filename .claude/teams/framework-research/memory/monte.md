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
