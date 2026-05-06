# Task List Snapshot — 2026-05-05 (session 26 close)

Captured before shutdown per startup.md §S2b. Replaces session-25 snapshot.

## Phase A work (all completed)

Phase A on Prism federation substrate — 11 PRs merged on `mitselek/prism` main:

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

## TaskList at session 26 shutdown

Tasks #1-#43 from local task list:

**Completed (29 tasks):**
- #1-#11: Cal Protocol C + Protocol A batch (Phase A.1 prep work)
- #12-#13: Brunel + Herald Phase A scope-and-approach memos
- #15: Bootstrap mitselek/prism repo
- #16: Protocol C #3 source-agents reconciliation (3 surfaces)
- #17: Prism prose pass on scope memo
- #18-#22: Phase A.1 deliverables (Brunel topology + posture + MCP setup; Herald A+B; Monte Surface 2)
- #23: Scratchpad prune (Brunel 159w → <100)
- #24: Phase A.1 §3 fill — namespace allocation (PR #3)
- #25: Phase A.1 deliverable B v1.1 — fold Monte Surface 2 v1.1 (PR #5)
- #26: File no-future-proofing as wiki pattern entry (66th)
- #27: Push phase-a-1-herald + open PR for ratification (PR #2)
- #28-#29: Herald-Monte joint pattern submissions to Cal (wiki #67 + #68)
- #30: PR v1.1 open phase-a-1-herald-v1.1 against latest main (PR #5)
- #36: Brunel Protocol A AMENDMENT for worktree-isolation Instance A first-person (wiki #69 amendment)
- #37: Fix table render bug in envelope §4 (PR #7)
- #38: Phase A.3 deliverable C — two-pattern asymmetry decision matrix (PR #9)
- #39: envelope-v1.1 PR — Mod 2 + integrate CuratorAuthority typed shape (PR #10)
- #42: SemVer bump 1.1.0 → 2.0.0 in envelope contract (PR #11)

**Superseded:**
- #14: Herald Phase A federation protocol draft (post-alignment) — **superseded by deliverable C, PR #9**

**Pending — Cal Protocol A queue, deferred to session 27:**

These are routine librarian work, NOT Phase A blockers. Per session-tail wind-down + Aen 17:08 authorization, Herald + Monte will batch-file in quieter window.

- #32 cross-specialist-argument self-correction trigger (n=1, Herald)
- #33 timestamp-crossed-messages temporal divergence (**n=8 cumulative — promotion-strong**, Herald)
- #34 surfacing-discipline false alarm on stale inbox (n=1, Herald) + Monte's surface-bias-cost-asymmetry sibling
- #35 snapshot-state-mis-names-path-to-end-state (n=1, Herald)
- #40 504-then-success client-server temporal divergence (n=1, Herald)
- #41 worktree-isolation amendment for n=2+ first-person Herald instances (n=5 today)
- #43 SemVer-strict-typed-contract discipline (n=1, Herald)

**Plus Monte's queue (in his scratchpad, not in this team task list):**
- #3 pre-commit-to-extension irony (n=1)
- #4 lossless-convergence Herald-Monte (n=2 cumulative w/ session #59 — auto-promotes per Cal's discretion; source-agents `[herald, monte]`, prose attribution to historical instance)
- #4b surface-bias-cost-asymmetry sibling
- #5 canonical-taxonomy-check (n=2 cumulative)
- #11 protocol-completeness-across-surfaces (joint, promotion-grade)
- audit-trail-for-rejection-rationale sub-shape
- substrate-vs-authority-shape orthogonality (n=1 watch)
- field-level-overlap one-truth-not-mirror (Herald sibling to #67)
- asymmetries-live-above-substrate (Herald deliverable C composition framing, joint)

**Total ~13 pattern submissions queued for Cal at session 27 start.**

## Phase B (NOT STARTED — wakes on PO direction at session 27)

Three workstreams listed for completeness; NOT in current task list:

1. **Federation bootstrap protocol** (new team joining federation) — Brunel's domain. Likely shape: parameterize FR Brilliant MCP runbook over `<team>` + namespace claim; Cal-coordination per new team for namespace allocation. Convention re-test at n=2 (apex-research likely next).
2. **Authority-drift detection at federation scale** (n=20+) — Monte/Brunel joint. Substrate-side instrumentation; sidecar + cron-poll consistent with pull/poll sync.
3. **T04 topic-file amendment text** — post-Phase-A codification (Volta's chore from session 21).

## Standing watch items going into session 27

- Trigger 1 (reverse spoke→spoke flow >2 teams within a quarter) — empirical question gating next topology decision
- Topic-09 source-team example refresh (Cal micro-fix, 5-line edit when convenient)
- Source-team semantics extension watch (n=2 distinct deployments needed before Protocol C extension)
- TPS-583 watch — Stage-2 actioning when Ruth signals
- T06 path-tree rewrite (Volta — pending from session 19/20)
- esl-suvekool feedback loop — when PO returns from Tobi sessions
- Aalto/uikit-dev cross-team debt — only on uikit-dev contact event
- Ruth-team observability gap — only on Ruth Q2/Q3 response

(*FR:team-lead*)
