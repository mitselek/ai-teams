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

## Session: 2026-05-05 (Phase A — Postgres library federation, #65)

[CHECKPOINT] Spawned for Session 26 phase A. Read Finn handoff brief, common-prompt, montesquieu.md prompt, scratchpad.

[DECISION] Scope-and-approach memo shipped at `docs/2026-05-05-phase-a/monte-scope-and-approach-2026-05-05.md`. Three design surfaces: (1) curator-role-evolution map, (2) write-block error-semantics contract, (3) cross-team write authority decision matrix.

[WIP] Standing by for Aen's cross-specialist alignment from me/Brunel/Herald scope memos. Drafting blocked on B3 (Brunel federation topology) and B5 (Herald protocol contract) intersections — both flagged in §3.

[DECISION] Codename **Prism** ratified by PO 2026-05-05 (relayed by Brunel). Optical lineage: Obsidian → Brilliant → Prism (federation = one substrate, multiple per-team views). Use in all forthcoming scope memos and Phase A design docs.

[GOTCHA] Artifact-routing rule: research artifacts (Finn briefs, scope memos, my own scope memo) STAY in `mitselek-ai-teams/docs/2026-05-05-phase-a/`. Phase A *design* deliverables ship to `mitselek/prism` (Brunel bootstrapping). My scope memo updated in place to reflect this; the design composite will land in prism once the repo exists.

[CHECKPOINT] Aen accepted scope memo as-shipped (1200 words is over the 300-400 hint, but §3 blockers structure is the cross-specialist resolution surface — don't compress). Three integrations confirmed:
1. Surface 1 (curator-role-evolution map) is mine; Herald consumes my recommendation, no pre-coordination needed.
2. Surface 3 holds until Brunel ships scope memo (B3 federation topology blocks).
3. Surface 2 has leeway to start now (B5 to Herald is the only intersection, Herald also waiting).
Final design composite ships to `mitselek/prism/designs/`.

[WIP] Surface 2 — write-block error-semantics contract, working draft (workspace-only; ships to prism post-alignment)

Working assumptions (provisional):
- Per session-25 [DECISION]: "If no curator team alive, Tier 3+ writes refuse with retry-when-up error." Constraint: no fallback chains (`feedback_no_fallbacks.md`). Refuse-not-corrupt is the only path.
- "Tier 3+" terminology comes from session-25 — verify exact tier definition in Cal's wiki when she's available; for now treat as "writes that need curator review under normal-path discipline."
- Writing agent is on team X; target curator (home curator for the entry's `owned_by` value) is the authority. If home curator is down → refuse. NOT routed to another curator (that's the rejected fallback chain).

Contract surface (typed-contract sketch):
1. **Status class** — distinct from validation-failure (4xx) and substrate-failure (5xx-internal). Proposed: `503 Service Unavailable` with `Retry-After` header — semantically "service exists but temporarily unable to fulfill request." Validation already 4xx, this is explicitly retry-when-up. Alternative: a custom status class via response body type-tag (`{type: "curator-unavailable", curator: "fr-cal", ...}`) carried over generic 503. Lean toward generic 503 + typed body; cleaner than a non-standard class.
2. **Retry-After semantics** — three options: (a) absolute timestamp when curator expected up, (b) duration suggestion (e.g., "300s"), (c) "unknown" + backoff guidance. Cal-specific: curator-up is determined by curator-team-alive, not curator-process-alive. If FR is shut down for the night, Retry-After = next-FR-session-start (could be 12h+). Real answer is (c) "unknown" with backoff guidance — anything else over-promises.
3. **Idempotency** — writing agent should be able to retry without double-write risk. Write request carries an idempotency token (UUID); curator-side dedup. Without this, retry-after-timeout creates double-writes if the curator was actually up but slow. This intersects with Brunel's substrate (where dedup state lives) — note for B3.
4. **Timeout shape** — agent-side: how long does the agent wait before treating the request as "curator-unavailable" vs "in-flight"? Two distinct timeouts: connection-timeout (curator endpoint reachable) and review-timeout (curator received but hasn't decided). Both should be agent-configurable but with sane defaults. Review-timeout in particular should be generous — curator review is human-paced (or agent-paced, but not millisecond-paced).
5. **What the writing agent must NOT do on refusal** — explicit non-permissions: (a) write to a different curator's namespace as a fallback, (b) write to a "pending" zone that becomes auto-promoted later, (c) bypass-and-log "I tried but couldn't, here's what I would have written." All three are fallback chains. The contract is: write blocks, agent waits or escalates to its team-lead, team-lead decides whether the write is critical (escalates to PO) or can wait.
6. **Asymmetric namespace consideration** — does product-namespace (one-writer/few-readers, esl-suvekool model) need same contract as methodology-namespace? Provisional: YES for the write-block shape (refuse-not-corrupt is universal), but the curator-up sensitivity differs. Product writes are intra-team; the "curator" for product is the team's own librarian, who is up whenever the team is. So product-namespace write-block is a much rarer event than methodology-namespace write-block. Same contract, different operational frequency.

Open questions (carry to Surface 3 / B5 to Herald):
- Q1. Does Herald's Protocol D variant for inter-tenant writes (xireactor precedent) already define an error-shape, or is this a new contract surface? Need to read his §2 in the precedent doc + his forthcoming scope memo before locking.
- Q2. Where does the idempotency-token state live (curator-side cache, substrate row, both)? Brunel-domain (B3 dependent).
- Q3. For escalation to PO when write is critical: is there a session-25 protocol for "write-blocked-critical" or is this a new path? — likely in Cal's protocols, check post-alignment.

[DEFERRED until prism repo exists] Composite design doc target. Will draft Surface 2 to roughly 500 words + small contract table; full composite (§0-§5, ~2,500-3,500 words) ships to prism post-alignment.

[CHECKPOINT] `mitselek/prism` bootstrapped 2026-05-05 16:14 by Brunel (root commit `2f26706`, default branch `main`, private). Local clone: `~/Documents/github/.mmp/prism`. Layout: `docs/`, `designs/`, `decisions/` — schemas deliberately unfilled until phase A designs land. My §4 placeholder updated to resolved path: `mitselek/prism/designs/monte-governance-design-2026-05-05.md`.

[GOTCHA] Branch convention is currently **unwritten** in prism. Aen will likely speak to it once design work starts. Do NOT push to `main` directly without confirming convention; assume PR-based flow until told otherwise.

[CHECKPOINT] PR #4 (Surface 2 v1.0 + v1.1) MERGED to main 2026-05-05 16:33 (`06977a1`). Aen ratified three load-bearing elements: (1) `ProducerAction` enum as no-fallback teeth at dispatch, (2) sub-discriminator approach inside CuratorUnavailableRecovery, (3) v1.0 retention as HTTP-binding hint while v1.1 holds contract layer. Worktree cleaned up post-merge.

[LEARNED] **Worktree-isolation validated empirically n=1 in Prism context.** Faced a parallel-agent shared-clone collision at 16:25 (Herald uncommitted v1.1 fold-in modifications blocking my branch switch). Took the worktree path: `git worktree add ../prism-monte -b phase-a-1-monte origin/main`, copied files in, committed, pushed, opened PR #4 — all without touching Herald's working tree. Aen ratified the autonomous decision at 16:33 ("worktree-isolation autonomous decision is the superior approach"). Adopting as default for Phase A.2+ specialist work. Same memory rule reinforced: `feedback_use_isolation_worktree.md` applies to multi-specialist parallel design work, not just code branching.

[PATTERN] Six candidates emerged from this Surface 2 → v1.1 → Herald-coordination → PR loop. Will route to Cal Protocol A after coordinating split with Herald:
- #1 (jointly-authored): n=2 cross-specialist self-correction in single coordination exchange
- #2 (Herald): dispatch granularity matches recovery-handler granularity, not source-of-distinction
- #3 (mine, with second-order irony): pre-commit-to-extension as reviewer-vs-author meta-pattern (the pre-commit shaped dynamic favorably even when the specific extension didn't land)
- #4 (jointly-noted): n=2 lossless convergence Herald-Monte (cadence axis here, three-state-model + Flow-B in #59)
- #5 (mine): "before naming a wrap target by reference to an existing protocol codename, check whether codename is already claimed in canonical taxonomy" — n=2 cumulative (W3-vs-Protocol-D in #59 + Protocol-D-vs-Prism today)
- #6 (Herald): self-correction-via-prior-self-argument (Herald cited his own session #59 Argument 1 to retract his Mod 2)
- #7 (mine, observation post-PR-merge): worktree-isolation autonomous-decision validated under collision pressure as the durable fix; sequential branch-handoff only works when each specialist commits-and-merges before next starts

[DEFERRED] Phase A.2 wakes after Herald's v1.1 fold-in PR lands. Will ship Surface 1 (curator-role-evolution map) + Surface 3 (DACI matrix), preferably in worktree isolation. Federation-curators-as-class is the lean against Brunel's hub-and-spoke — empirical green light.

[CHECKPOINT] PR #6 (Surface 1 + Surface 3 composite) MERGED to main 2026-05-05 17:08 (`24e8359`). Aen ratified five load-bearing elements: M3 federation-curators-as-class as substrate-vs-authority decomposition; asymmetric DACI as right answer to two-pattern question; §3.4 ratification protocol preserves R2 by design; §3.5 CuratorAuthority discriminated union slots cleanly into Herald envelope; §3.6 B7 properly punted with named candidates + lean. Worktree `~/.mmp/prism-monte-a2` removed cleanly post-merge.

[LEARNED] **Substrate-shape vs authority-shape are orthogonal axes; topology design that conflates them imports the wrong failure mode.** Phase A.2 Surface 1 §1.4 — M2 (cluster-wide-single-curator) reads Brunel's hub-and-spoke as authority-shape ("FR's curator runs all teams' content") when it's actually substrate-shape ("FR contributes more methodology entries"). The conflation imports M2's bottleneck failure even though Brunel's substrate is fine. M3 (federation-curators-as-class) keeps them orthogonal — substrate can be hub-and-spoke while authority is peer-class. Aen flagged as wiki-promotable on next sighting. n=1 today.

[LEARNED] **Meta-coordination has compounding-cost shape — paying it incurs setup; clearing it unlocks throughput multiplier.** Phase A.2 sequence: 22 min of Cal Protocol A coordination + Herald split + corollary text felt like overhead at the time, but the tail clearing unlocked Surface 1+3 drafting at ~30 min versus my 60-90 min ETA estimate. Going head-down on a clear-structure problem produces step-change throughput once the meta-coordination tail is paid. **Operational lesson:** when meta-coordination is bursty, finish the burst before head-down work; don't try to interleave. The interleaving costs the multiplier.

[DEFERRED] Phase A.3 — Herald's deliverable C (two-pattern asymmetry decision matrix) consumes Surface 1 M3 + Surface 3 DACI as typed inputs. I'm on standby for cross-specialist questions. Cal Protocol A pause lifted; #3, #4, #4b, #5 ready to file when convenient (no urgency).

[CHECKPOINT] **Phase A STRUCTURALLY CLOSED at 2026-05-05 17:25 (Aen).** All 10 PRs merged on `mitselek/prism` main. PR #10 (Herald envelope-v1.1 — Mod 2 `curatorAuthority` required + default + CuratorAuthority typed shape integrated) is the closing merge.

**My phase-A contribution shape (final):**
- PR #4: Surface 2 v1.0 + v1.1 (write-block error semantics + per-class recovery shapes + ProducerAction enum)
- PR #6: Surface 1 M3 + Surface 3 DACI + §3.4 ratification + §3.5 CuratorAuthority typed shape
- PR #8: Mod 1 sourceTeam dedup (single-source-of-truth at envelope-top-level + audit-trail-paragraph for rejection rationale)

[LEARNED] **Audit-trail-for-rejection-rationale paragraphs in dedup decisions** (n=1 today). When a single-source-of-truth dedup removes a duplicate field, the removed-field's would-be alternative + reason for rejection must be cited inline so future readers don't re-introduce the duplicate. Without the cite, a future reader sees only the absence and may re-add what looks like a missing field. Sub-shape candidate of Herald's #6b field-overlap pattern. Promote on second sighting.

[DEFERRED] Cal Protocol A queue (5 patterns, all clear-to-file when convenient, deferred to next session per session-tail winding-down):
- #3 pre-commit-to-extension irony (n=1)
- #4 lossless convergence Herald-Monte (n=2 cumulative w/ session #59 — auto-promote at filing per Cal's discretion)
- #4b surface-bias-cost-asymmetry (n=2)
- #5 canonical-taxonomy-check before naming wrap targets (n=2 cumulative)
- #11 protocol-completeness across surfaces — Herald spotted, Monte named, source-agents [herald, monte] joint, Aen's type-system-completeness analogy folded in (n=1, promotion-grade)

Plus the substrate-vs-authority-shape orthogonality framing from Surface 1 §1.4 M2 rejection — wiki-promotable on next sighting (n=1 today).

[DEFERRED] Phase B not started:
- Federation bootstrap protocol (new team joining federation)
- Authority-drift detection at federation scale (n=20+)
- T04 topic-file amendment text

[NEXT-SESSION] Standing by for Phase B activation by PO direction OR session-tail signal. No active work; idling.

## Session: 2026-05-06 (Session 26 SHUTDOWN — Phase A on Prism final)

[CHECKPOINT] **Session 26 SHUTDOWN at 2026-05-06 10:06.** Aen shutdown_request: Phase A on Prism structurally final (11 PRs merged, envelope at v2.0). PO requested clean restart for fresh session 27.

**Final Phase A state on `mitselek/prism` main:**
- envelope-v2.0 (per Aen-Herald SemVer ruling 17:??-17:??: strict-type-check semantics → 2.0.0 since `unknown → CuratorAuthority` is a breaking change from TypeScript strict perspective)
- Surface 1 M3 federation-curators-as-class + Surface 2 v1.0+v1.1 + Surface 3 DACI + §3.4 ratification protocol all ratified-and-merged
- 11 PRs total (Brunel #1, Herald #2, Brunel #3, Monte #4, Herald #5, Monte #6, Herald-fix #7, Monte-Mod1 #8, Herald deliverable C #9, Herald envelope-v1.1 #10, plus 2.0.0 SemVer bump)

[DEFERRED to Session 27] **Cal Protocol A queue — 5 patterns, all clear-to-file, Aen-authorized 17:00:**
- #3 pre-commit-to-extension irony (n=1)
- #4 lossless convergence Herald-Monte cumulative (n=2 cumulative w/ session #59 — auto-promote at filing per Cal's discretion)
- #4b surface-bias-cost-asymmetry (n=2)
- #5 canonical-taxonomy-check before naming wrap targets (n=2 cumulative)
- #11 protocol-completeness across surfaces — joint source-agents [herald, monte], Aen ratified joint at 17:13, type-system-completeness analogy ("every value has a destructor; every error has a recovery") to fold verbatim into filing

**Plus n=1 watch [LEARNED] candidates** for n=2-promotion when sighted:
- substrate-shape vs authority-shape orthogonality (Surface 1 §1.4 M2 rejection framing)
- audit-trail-for-rejection-rationale paragraphs in dedup decisions (Mod 1 §3.5 prose; sub-shape of Herald's #6b field-overlap pattern)
- meta-coordination compounding-cost shape (Aen 17:08 framing — operational lesson on bursty meta-coordination)
- recipient-side stale-mental-model surfacing corollary (provided to Herald 16:52 for inclusion in his #9 #34 sibling-note format)

[DEFERRED to Phase B] Federation bootstrap protocol; authority-drift detection at federation scale (n=20+); T04 topic-file amendment text. PO direction triggers Phase B.

[LEARNED] **My session-26 contribution shape (final):** PR #4 (Surface 2 v1.0+v1.1 — write-block error semantics + ProducerAction enum), PR #6 (Surface 1 M3 + Surface 3 DACI + §3.4 ratification + §3.5 CuratorAuthority typed shape), PR #8 (Mod 1 sourceTeam dedup with audit-trail paragraph). Five Cal Protocol A submissions queued; one filed (#7 worktree-isolation, source-agents [brunel, monte] joint).

[WARNING] **Worktree cleanup verified clean before shutdown:** `~/.mmp/prism-monte` removed at 16:34 post-PR#4-merge; `~/.mmp/prism-monte-a2` removed at 17:09 post-PR#6-merge; `~/.mmp/prism-monte-a2-mod1` removed at 17:13 post-PR#8-merge. No orphan worktrees on my side. Herald may have his own (`~/.mmp/prism-herald-fix`) — out of my scope.

[DEFERRED] §4 exclusions: bootstrap protocol for new federation team, authority-drift detection at federation scale, T04 topic-file amendment text.

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
