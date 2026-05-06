# Herald Scratchpad

## 2026-05-05 (session #26 — Prism federation Phase A complete)

[CHECKPOINT] **Phase A on `mitselek/prism` STRUCTURALLY FINAL — 11 PRs merged.** My contributions:
- **PR #2** Deliverables A + B v1.0 — federation envelope contract (closed `ContentCategory` enum, R2 sovereignty as typed invariant, `sourceTeam` reuse from t09 Protocol C); pull-shape sync contract (cursor-based, four cadence tiers).
- **PR #5** Deliverable B v1.1 — Monte Surface 2 v1.1 recovery shapes folded; R2 dispatch clarification; Mod 2 retraction documented in §4.10.
- **PR #7** Mechanical fix — orphan v1.0 4-col table header in envelope §4 deleted.
- **PR #9** Deliverable C — two-pattern asymmetry decision matrix (5-axis: 3 converge / 2 diverge; "open + sovereign + cheap + auditable" composition).
- **PR #10** Envelope-v1.1 — `CuratorAuthority` typed shape integrated, REQUIRED with default; §3.2 migration semantics.
- **PR #11** SemVer-major bump v1.1.0 → v2.0.0 — strict-typed-contract discipline.

[DECISION] **"Symmetric envelope, mode-by-content-category"** as canonical structural answer to asymmetric-vs-symmetric. Asymmetry lives in tail-format-per-category, defended in deliverable C with 5-axis matrix.

[DECISION] **Strict-SemVer for typed-contract version bumps** — *"Migration mechanism makes the bump SAFE, not 'minor.'"* Consumer's type-check work determines bump level; substrate-side migration is orthogonal. Phase A's first production envelope contract sets the precedent.

[PATTERN] **Cross-specialist gate-2 work on Prism (4 instances today):** Mod 2 retraction (Monte's collapse > my extension; cited Monte's own session #59 canonical-taxonomy-slot argument back at myself); R2 dispatch clarification (Monte caught my §4 missing explicit dispatch); Mod 1 sourceTeam dedup (one field, one truth on second-pass cross-read); HOLD-then-retract on v1.2 cross-wires (surface-don't-bridge ratified despite false-positive).

[LEARNED] **n=8 cross-wires today on inbox-message-crossings.** Promotion-strong cumulative for queued #33. Distinct mechanism from within-loop-self-correction (sequential vs parallel). All resolved via surface-don't-bridge + re-process-inbox-first disciplines.

[LEARNED] **Worktree-isolation n=5 today across 5 work types** (Brunel n=1, my table fix n=2, deliverable C n=3, envelope-v1.1 n=4, SemVer bump n=5). PR #11 specifically used worktree to bypass dirty main-worktree state (Aen's unstaged markdown-linter edits) — surface-don't-bridge at git-state level.

[LEARNED] **"Asymmetries should live above the substrate, not in the substrate"** — Aen named as wiki-promotable in 17:25 composite review. Joint with Monte (M3 + DACI authority-layer; my 5-axis matrix). Source-agents `[herald, monte]`; deferred to Monte's queued #11 claim per 16:43 dedup discipline.

[LEARNED] **Event-deferred-to vs contract-deferred-to** distinction in deferral language (caught by Monte 16:44 on my "waiting on Brunel topology" framing when topology had already merged). Forward-cites can outlive event-pending phase; mental models need updating when events resolve, even when contract slots remain open.

[DEFERRED] **Cal Protocol A queue (8 submissions for session #27):**
- #32 cross-specialist-argument self-correction trigger (n=1) — internalized cross-pollination as self-test
- #33 timestamp-crossed-messages temporal divergence (**n=8 cumulative** — promotion-strong)
- #34 surfacing-with-stale-inbox + Monte's surface-bias-cost-asymmetry sibling (paired siblings)
- #35 snapshot-state-mis-names-path (per Aen 16:43)
- #40 504-then-success client-server temporal divergence (per Aen 17:13)
- #41 worktree-isolation amendment (n=5 today; Herald instances B/C/D/E paralleling Brunel's Instance A)
- #43 SemVer-strict-typed-contract discipline (per Aen 17:28; sibling to #41 in version-control-discipline cluster)
- (#13 protocol-asymmetries-live-above-substrate deduped to Monte's queue per 16:43 split)

[DEFERRED] **Monte's queue:** #3 pre-commit-to-extension w/ irony, #4 lossless-convergence (n=2 today: cadence + asymmetry), #4b surface-bias-cost-asymmetry, #5 wrap-target-naming canonical-taxonomy, #11 protocol-completeness-across-surfaces.

[WARNING] **Cal Protocol A authorization restored 17:08; 8-pattern queue NOT batch-filed yet.** Aen explicitly "file in your quieter window" — deferred all 8 to session #27 per shutdown timing. Session #27 should start with Cal-batch before any new Phase B work.

[GOTCHA] **Branch off `origin/main`, not main worktree** when main has unrelated unstaged changes from another session. PR #11 demonstrated this — Aen had cosmetic markdown-linter edits in main worktree; `git fetch && git worktree add ... origin/main` cleanly bypassed.

[UNADDRESSED] None — Phase A closeout confirmed by Aen 17:35.

## 2026-04-24 (session #60 — issue #60 protocol doc updates)

[WIP] Issue #60 — retire tmux-pane spawn as default, standardize on Agent-tool persistent spawn. Two deliverables: (a) framework-level `agent-spawn-protocol.md` rewrite (no framework version exists yet; only apex-research has one at `apex-migration-research/teams/apex-research/subagent-fallback-protocol.md` v1.0.0 by Schliemann), (b) startup.md flagged-line audit with proposed replacement text.

[DECISION] Reframed the "fallback" axis. The old framing was "persistent-tmux-pane teammate (default) vs one-shot-Agent-tool subagent (fallback)." The new framing is "persistent Agent-tool teammate (default) vs one-shot Agent-tool subagent (fallback)." Both modes share the Agent tool — the discriminator is the `team_name` + `name` parameters (persistent) vs no `team_name` (one-shot). This collapses the two-tool distinction into a one-tool, one-parameter distinction, which is structurally cleaner.

[PATTERN] Protocol substance preserved verbatim from apex-research v1.0.0: sequential, GH-issue-as-brief, scratchpad-update-before-signoff, knowledge-submission-via-/tmp-handoff, directory ownership respected, commit+push before signoff. All six rules survive the framing change because they describe the one-shot subagent's discipline, not the alternative-mode's discipline.

[GOTCHA] The session-lifetime caveat is the load-bearing tradeoff. Agent-tool teammates die when the parent team-lead session dies; under tmux, each pane is its own `claude` CLI and outlives the team-lead session. Apex-research's note: "non-blocking for us, sessions are trending shorter; other teams should weigh their own session-lifetime profile." This must be preserved verbatim in the framework doc — it is the one operational fact that determines which teams can adopt the new default.

[DECISION] Scope discipline. I'm NOT editing `spawn_member.sh`, container entrypoints, or `topics/06-lifecycle.md` Path 1/2/2.5/3 decision tree. Brunel owns container entrypoints (per issue #60 scope), and topic-file edits are out of my write-scope (proposed to team-lead, not authored by me). My scope is the protocol doc + the startup.md flagged-line audit.

[CHECKPOINT] Deliverable shipped to team-lead at 14:48: full rewrite of `agent-spawn-protocol.md` v2.0.0 + startup.md/SKILL.md audit findings (no edits needed for either) + open question on T06 Path-tree ownership.

[DECISION] Aen resolved scope boundaries (2026-04-24 14:50): Volta owns the T06 Path 1/2/2.5/3 decision-tree rewrite — filed as NEXT-SESSION-CHORE for her. My protocol doc defines the shapes each lifecycle path uses; her rewrite references my shapes, not the other way around. Clean separation: Herald = protocol shapes (T03), Volta = lifecycle state machine (T06). Aen landing the protocol doc at `docs/agent-spawn-protocol.md` himself per my recommended path. `tmux-spawn-guide.md` retirement is Brunel's timing call — parked as DEFERRED.

[LEARNED] **T03/T06 boundary, named clearly.** "Protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." The shape-vs-selection distinction is a cleaner articulation than my prior mental model ("T03 is how agents talk, T06 is when they spawn/die"). Shapes are typed contracts; path selection is a decision tree over operational state. If a future question sits on the boundary, the test is: "does answering require defining a new message/contract shape (T03/me), or does it require a new branch in the lifecycle decision tree (T06/Volta)?" Save for next-session scope disambiguation.

## 2026-04-15 (session #59 — xireactor pilot, condensed)

[CHECKPOINT] `docs/xireactor-pilot-protocol-2026-04-15.md` v1.2 shipped at outcome (c)/(c) preconditions per honest-precondition discipline. Five sections: query path, three-flow write path, SessionInitPreamble, MCP rollout (§4.5 fail-closed), Protocol A/B mapping. Pilot HALTS at outcome (b) per Aen — no design-past-the-gate.

[DECISION] **Protocol D ACCEPTED as canonical-taxonomy slot.** Monte's load-bearing argument: fills slot vs creates naming hole. NOT "D follows C" letter-pattern. v1.2.1 backlog (5 items: source-role enum, zone-ambiguity callout, Protocol D rename, CrossReviewAccept.superseded-by cross-ref, inverted-sequence family-member cross-ref).

[PATTERN] **Outcome (c) is gating diagnostic, not validation of hypothesis** (Monte's sharpening). Read code to find what it does, NOT to confirm the guess.

[PATTERN] **§2.2 dispatch-by-enum-value, NOT by flag** — three-valued OwnershipState; collapse-to-flag is family regression to bounce structurally.

[PATTERN] **Lossless independent convergence > worked-it-out convergence** (Monte's framing). n=2 today between Monte §3.6 and Herald §2.2 Flow B.

[PATTERN] **Surface-don't-bridge contradictions you didn't author.** Cross-specialist catch + within-specialist self-catch are both gate-2-on-self family. Aen's framing: *"when you detect your own scratchpad diverges from another participant's, surface the divergence rather than silently converge to their version."*

[LEARNED] **Dense self-correction clusters are a health signal**, not failure (Aen). 5 self-corrections this session = working correctly. Zero-correction sessions are the failure mode.

[DEFERRED] xireactor next-session sequencing: PO brief → Finn second-pass source survey (gating-diagnostic-not-validation) → Monte §7.2 + Brunel §10 §1.2-compliance → Herald v1.3 with v1.2.1 backlog folded.

## 2026-04-24 (session #60 — agent-spawn-protocol)

[CHECKPOINT] Shipped `docs/agent-spawn-protocol.md` v2.0.0 — retired tmux-pane spawn as default; standardized on Agent-tool persistent spawn with `team_name+name` parameters as discriminator. Six rules preserved verbatim from apex-research v1.0.0.

[GOTCHA] Session-lifetime caveat is load-bearing tradeoff: Agent-tool teammates die when parent team-lead session dies; tmux panes outlive. Apex-research's verbatim note must be preserved.

[LEARNED] **T03/T06 boundary, named clearly:** "Protocol doc defines the shapes each path uses; lifecycle doc defines which path to choose when." Shape-vs-selection is the test for new boundary questions. Herald = T03 protocol shapes; Volta = T06 lifecycle state machine.

## Pre-session-#59 (earlier work, condensed)

[DECISION] T03 Protocols 1-5 in `topics/03-communication.md`: Handoff (Protocol 1), Topology hybrid hub-and-spoke (Protocol 2), Broadcast Governance (Protocol 3), Inter-Team Transport UDS+GitHub-Issues (Protocol 4), Resource Partition Table (Protocol 5). Direct Link Lifecycle Protocol added to Protocol 2 with 5 review triggers; authority split with Montesquieu.

[DECISION] T09 development methodology shipped (Celes-led synthesis). My contributions: 4 XP message types, three-strike escalation (Monte's "judicial model" framing), three Librarian protocols (A submission, B query, C promotion), gap stubs, dual-hub topology, three-layer staleness net. All preserved verbatim in T09.

[DECISION] Single-provider as protocol-level design requirement (Discussion #56 R12). Protocols assume behavioral homogeneity; multi-provider introduces protocol interpretation variance that is untestable in advance.

[DECISION] Phase 2 Oracle→Librarian TS rename complete in `types/t09-protocols.ts` (`from: "Oracle"` → `"Librarian"`, `filedBy: "oracle"` → `"librarian"`). Grep-verified zero residual literals.

[DEFERRED] Contract enforcement layer design (Discussion #56 actionable #3): API contract definition, conformance test suite, runtime format validation at integration seam. Still pending.

[PATTERN] apex-research directory-partition isolation: 80+ commits, 4 agents, zero conflicts. Now canonical for pipeline teams.

[PATTERN] polyphony-dev temporal ownership chain: third isolation model alongside branch-reservation + directory-partition.

[PATTERN] Entu API for SvelteKit: BFF pattern, JWT in httpOnly cookie. Entity-property model is array-only; query filter shape `{property}.{type}.{operator}`.
