# Arhitecture Persona Improvement Assessment (pre-#73-round-2)

**Date:** 2026-06-05 (S42)
**Author:** (*FR:Celes*)
**Purpose:** PO directive -- before the #73 round-2 re-review experiment runs, assess how the 5 persona prompts were actually improved after issues Eesti-Raudtee/Arhitecture #4–#8 were closed.

## Method

- Pulled current merged prompts from `Eesti-Raudtee/Arhitecture@master:.claude/agents/` via `gh api` (read-only; repo is pull-only for the mitselek account).
- Read each issue body + the gap-reaction addendum comment (identical on all 5) + the closing commit messages. Issues were closed by **direct commits to master** (no PRs -- consistent with their workflow), one commit per issue, plus three extra commits that go beyond the 5 issues.
- Compared each merged prompt against (a) its issue's stated requirements (synergy wiring + competency gates + the two-action gap-reaction protocol) and (b) the S41 gold-standard shape I defined (3 blocks: competency gates / synergy-interaction / task-scoped review focus).

## Per-persona verdict

| Persona | Issue | Synergy wiring | Competency gates (Action 1: `[GAP]`) | Gap Action 2 (file issue) | Verdict |
|---|---|---|---|---|---|
| Kent Beck | #4 | Yes -- Bach + Uncle Bob pairings, don't-double-book rule | Yes -- MCP query, ADR-012 by ID, kata `[GAP]`, never-fabricate | **Missing** | **Substantially adopted** |
| James Bach | #5 | Yes -- Beck pairing + hand-off chain (Uncle Bob/Beck → Fowler/code-reviewer) | Yes -- MCP, ADR-012/ADR-015, Workers-failure `[GAP]`, SFDPOT Platform/Time caveat | **Missing** | **Substantially adopted** |
| Grady Booch | #6 | Yes -- coherence anchor, defer-content-to-specialists, Plan/Define trio | Yes -- MCP, ADR-007/008 + T-43 + catalogue, verify-count-don't-assert | **Missing** | **Substantially adopted** |
| Nancy Leveson | #7 | Yes -- Anderson IT/OT overlap (conflation check), Booch express-vs-coherent, safety-gate trio | Yes -- strongest gate; ADR-010 Accepted / ADR-016 "Proposed every time", EN50716 not-in-repo `[GAP]`, no clause/SIL fabrication | **Missing** | **Substantially adopted** |
| Ross Anderson | #8 | Already present (unchanged -- gold standard) | Repointed local-dir → MCP; `[REGULATORY -- UNVERIFIED]` tag; ADR-011 Proposed-discipline added | **Missing** | **Substantially adopted** |

No persona is "diverged." None is "fully adopted" because of one shared, deliberate-looking omission (below).

## The one systematic gap: Action 2 was dropped from all 5

The gap-reaction addendum (Aen, posted on every issue #4–#8) required **two** actions encoded *in the prompt itself*:
- **Action 1** -- flag the gap with `[GAP]` in the output artifact. **Adopted everywhere.**
- **Action 2** -- when a competency claim can't be backed, **file an issue at the retainer repo** (which persona, what claim, what backing doc is missing, how to close it) so the retainer pool self-corrects over time. **Absent from all 5 prompts.**

Evidence: a grep for `file an issue|retainer|Eesti-Raudtee/Arhitecture/issues|gap-reaction|feedback loop` across all 5 merged prompts returns zero hits. The closing commit messages enumerate exactly what was added (synergy + gates) and never mention Action 2 -- it wasn't deferred-with-a-note, it was silently not implemented. The addendum was the *last* comment on each issue; the most likely cause is the implementer worked from the issue body (which only specified Action 1) and didn't fold in the later comment.

**Impact on round 2:** Action 2 is the half of the protocol that makes the retainer pool *self-correcting*. Its absence does not degrade the *honesty* of a single review (Action 1 still protects the client). It degrades the *closed-loop* property the experiment is partly meant to test -- does the framework's gap-reaction protocol produce repo issues that feed back into backing-doc procurement? If round 2 is scored against "did personas file gap-issues," it will score zero **for a prompt reason, not a behavioral one** -- the prompt never told them to.

## What the Arhitecture team added on their own (beyond the 5 issues)

Three extra commits show they ran further with the S41 synergy map than the 5 issues asked:
1. `b95ac57e` -- named the **Principle-Review Panel** in a process doc (#3 Rec1).
2. `660454c3` -- added synergy + gates to **Martin Fowler** (#3 Rec2).
3. `16dfcdc8` -- **extended competency gates to 7 more personas** (uncle-bob, code-reviewer, security-auditor, jeff-sutherland, david-anderson, bill-karwin, steve-schoger -- #2 Rec3).
4. `6dfb4e98` -- added `knowledge/anderson/COMPETENCIES.md`, a competency→backing-source map (9 competencies → repo-internal-via-MCP vs external-`[GAP]`).

The COMPETENCIES.md is **not** a regression to the local-dir dependency #8 told them to drop -- it explicitly routes every lookup "via the arch-docs MCP" and serves as a source-of-record table. It strengthens the gate. Net: the team adopted the *spirit* of the whole synergy-map engagement, not just the 5 narrow issues.

## Deltas vs the S41 gold-standard shape (block c)

My S41 gold standard had **3 blocks**: (a) competency gates, (b) synergy/interaction, (c) **task-scoped review-focus** ("what to look for in *this* artifact"). The merged prompts have (a) and (b) but **no (c)** -- they are generic-lens prompts. This is correct-by-design for a reusable persona: the artifact-specific focus belongs in the *dispatch brief*, not the standing prompt. Not a gap to fix in the prompt; it is a reminder that **round 2 must supply the per-artifact focus in the dispatch**, exactly as round 1 did.

## Recommendation

**Round 2 (#73) can proceed as-designed, with one decision for the PO first.**

The synergy wiring and competency gates -- the two improvements whose effect on review *quality* the experiment measures -- are solidly in place across all 5 personas, plus 7 bonus personas. The re-review will exercise them honestly.

The Action-2 omission forces a choice, because it changes what a clean round-2 result *means*:

- **Option A (recommended) -- run round 2 as-is, scope it to review quality.** Measure whether gates fire (`[GAP]` counts are grep-able) and whether the Leveson⟷Anderson `security_level` conflation check reproduces. Treat the Action-2 gap as a *separate finding* of this assessment: file a follow-up improvement issue at Arhitecture (Action 2 missing from the gate sections of all personas, with a one-line patch for each) so the loop is closed for *future* engagements. Do not block round 2 on it.
- **Option B -- patch first, then run.** Get the 5 (or all 12) gate sections amended with Action 2 before round 2, so the re-review can also test whether personas actually *file* gap-issues. Costs a round-trip with the Arhitecture team and delays the experiment.

I recommend **Option A**: the experiment's primary signal (gate-firing + synergy-produced findings) is ready now; Action 2's effect is a *second-order* loop-closure property better tested deliberately than bundled. If the PO wants the full two-action loop in scope, Option B is the clean way and I can draft the per-persona patch text.

(*FR:Celes*)
