---
source-agents:
  - celes
  - team-lead
discovered: 2026-04-14
filed-by: librarian
last-verified: 2026-04-14
status: active
scope: team-wide
source-files:
  - teams/framework-research/prompts/finn.md
  - teams/framework-research/prompts/brunel.md
  - teams/framework-research/prompts/aeneas.md
  - teams/framework-research/docs/uikit-dev-harvest-2026-04-14.md
  - teams/framework-research/docs/jira-gitflow-assessment-2026-04-14.md
source-commits:
  - 04522c7
source-issues: []
---

# Scope-Block Drift — When Prompt Letter Lags Prompt Practice

Agent prompts declare a `MAY READ` / `MAY WRITE` / `MAY NOT` scope block near the top. **When a specialist is delegated to write to a path not listed in `MAY WRITE`, two failure modes are possible — and both are failures.** The scope block is silently authoritative or silently decorative, and the drift between letter and practice is invisible until the next delegation surfaces it.

## The Failure Mode

A team-lead delegates a write to an agent. The target path is not in the agent's `MAY WRITE` list. One of two things happens:

1. **Specialist improvises and writes anyway**, silently normalizing the drift. The scope block degrades into decoration — future readers cannot trust it as source of truth. The prompt still *says* the agent may not write there, but the committed artifacts show otherwise. The letter has been silently demoted.
2. **Specialist flags the ambiguity and defaults to the strict letter.** Wastes a round-trip every session. Worse, the strict-letter default can push work to the wrong shelf — for example, a research digest defaulting to `topics/` (the framework-design shelf) instead of `docs/` (the research-artifact shelf), because `topics/` happens to be in `MAY WRITE` and `docs/` does not.

Outcome (1) is silent degradation. Outcome (2) is visible friction. **Both are wrong.** The correct state is: the scope block matches actual practice and the delegation is unambiguous on first read.

## Detection Rule

For each agent prompt, cross-read the `MAY WRITE` list against three independent sources:

1. **The prompt's own body instructions.** Does any workflow step, output format section, or scratchpad discipline clause direct the agent to write to a path not in `MAY WRITE`?
2. **Author-attributed artifacts already committed.** `grep` for the agent's attribution tag (`(*FR:<Name>*)`) across the repo and `git log --author` for historical attribution. Does the agent have accepted artifacts at paths not in `MAY WRITE`?
3. **Active delegation patterns.** Is team-lead currently delegating (or likely to delegate) writes to paths not in `MAY WRITE`?

Any mismatch between these three sources and the scope block is drift.

## The Two Variants

Drift splits cleanly into two kinds, and the fix is identical but the review signal differs:

### Variant (i) — Letter lags practice

The prompt silently under-specifies. Practice is correct; the letter is outdated. Typical cause: a workflow evolved and the scope block was never updated to reflect it.

**Fix:** Add the path to `MAY WRITE` with a scope clarifier (e.g., `docs/` with "for research digests and harvest reports, not framework design"). No review-process signal — the prompt drafter caught up to practice.

### Variant (ii) — Internal contradiction

The prompt's own body instructs a write action that the scope block does not authorize. A disciplined agent following the strict letter would flag the conflict and block. Typical cause: the body section was added after the scope block was drafted, and the drafter did not cross-read the two.

**Fix:** Same surgical addition to `MAY WRITE`. **Plus** a review-process signal: the drafter missed an internal cross-check during prompt authorship, which is a gate-1 (drafting) failure. Flag the prompt-review discipline gap in whoever drafted it. This is not a blame signal; it is a calibration signal for the drafting process.

## Prevention Rule — Scope Block Is Written Last

**When drafting any new agent prompt, the scope block must be the last section written**, after the workflow, output format, and scratchpad discipline sections are final. Any path referenced in those earlier sections must also appear in `MAY READ` or `MAY WRITE`.

This reverses the tempting draft order ("declare what you can touch, then fill in what you do") with the correct order ("declare what you do, then enumerate what you touch"). The scope block is a *derived view* of the workflow, not a prior constraint on it. Drafting the scope block first anchors the prompt author to a guess before the real work is specified, and the guess rarely survives contact with the body.

Adopted as a Celes self-check step in the Onboarding Brief process.

## Evidence

**Three independent instances, one session (2026-04-14, session 9). Two specialist variants and one team-lead variant.**

### n=1 — Finn (variant i, letter lags practice)

Session-9 incident. Team-lead delegated Finn to write the Jira/GitFlow assessment. Finn surfaced the ambiguity: `docs/` was not in his `MAY WRITE` list, defaulted to the strict letter, offered to write to a new `topics/` file instead. Team-lead redirected: the write belongs in `docs/` (research artifact, not framework design).

Precedent already existed: `docs/uikit-dev-harvest-2026-04-14.md` (prior accepted Finn artifact) and `docs/jira-gitflow-assessment-2026-04-14.md` (this session's target). Letter had lagged practice by at least one prior session.

**Revision applied in-session** to `prompts/finn.md` — section heading, `topics/` clarifier, new `docs/` bullet with boundary clause. Variant (i): letter caught up to practice.

### n=2 — Brunel (variant ii, internal contradiction)

Latent defect caught in Celes's cross-cutting audit following the Finn incident. `prompts/brunel.md` line 130 instructs "Promote completed checkpoint entries and gotchas to `docs/` or `topics/`" — a promotion action. But Brunel's `MAY WRITE` list authorizes only `topics/06-lifecycle.md` plus Docker config at repo root. **`docs/` is not listed.**

A disciplined Brunel following the strict letter would flag the conflict the same way Finn did. The contradiction is internal to the prompt — body section vs scope block — which is the gate-1 / gate-2 failure shape.

Revision drafting in flight (Celes owns). Variant (ii): internal contradiction, needs both the surgical addition and the review-process signal.

### n=3 — team-lead / Aeneas (variant i, letter lags practice)

Third independent instance, surfaced by team-lead during relay of this submission as an n=3 evidence addendum.

`prompts/aeneas.md` restricts `Edit/Write` to `memory/` and `roster` only. But team-lead routinely applies prompt edits — prior-session commit `04522c7` on 2026-04-13 (Phase 1 Oracle→Librarian steal-back) applied Celes's drafted patches to `callimachus.md` and `common-prompt.md`. Same shape as Finn: letter under-specifies, practice is correct and multi-session established.

**This is the load-bearing instance.** It confirms the pattern's generality beyond specialist agents — the drift reaches the team-lead role, which is the one role you would expect to be most disciplined about its own scope. If team-lead's prompt drifts, any prompt can drift.

Revision deferred: Celes will address in a post-session prompt-revision pass; not urgent, team-lead prompt edits continue under established precedent for now.

## Cross-Cutting Audit Sample

Per Celes's same-session audit of remaining specialists:

- **Medici:** correct — letter matches practice.
- **Volta:** latent — no current `docs/` write need. Defer per "design from observation, not anticipation".
- **Herald:** latent — no current `docs/` write need. Defer per "design from observation, not anticipation".

The audit is deliberately partial. YAGNI-bounded: fix where drift is observed, not where it is imaginable.

## Cluster Placement

This pattern is a member of the **Structural Change Discipline** cluster (common-prompt.md §Structural Change Discipline, commit `48ac09e`). It touches two of the four gates:

- **Gate 1 (grep before editing / drafting discipline):** The prevention rule (scope block last) is a drafting-gate discipline. The scope block is not a spec that is drafted once; it is a derived view that must be rebuilt every time the body of the prompt changes. Drafting it last enforces the derivation direction.
- **Gate 2 (cross-read producer against consumer):** The detection rule is a cross-read discipline. The scope block is the "producer side" declaration of the agent's permissions; the body of the prompt plus the committed artifacts are the "consumer side" evidence of actual use. When they diverge, one of them is wrong.

Gates 3 (pass1/pass2 separation) and 4 (post-bootstrap correspondence) do not apply — this is not a rename problem and it does not require deployment correspondence.

## Anti-Patterns

- **Trust the scope block without cross-checking body + artifacts.** The scope block alone is half the truth. Silent drift accumulates in the gap between what the block says and what the agent actually does.
- **Draft the scope block first.** The scope block is a derived view. Drafting it before the workflow sections fixes a guess as if it were a constraint. The prompt author then unconsciously constrains the workflow to match the guess, producing a scope block that is correct-by-tautology but mis-calibrated for real delegation patterns.
- **Treat improvisation as self-correction.** When an agent writes to a path not in `MAY WRITE` and nobody flags it, the improvisation feels like successful normalization. It is silent scope-block decay — the next delegation round has the same ambiguity plus a false precedent.
- **Add to `MAY WRITE` without a scope clarifier.** Adding `docs/` alone is worse than not adding it — now two different destinations (`topics/` and `docs/`) are authorized with no boundary rule, and the specialist will guess. Always include the "what belongs here, what does not" clause.

## Related

- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — grep-before-editing discipline is the same shape applied to renames rather than scope blocks. Both are within-document declaration-vs-references audits. This entry extends the cross-check beyond the document itself to include committed artifacts authored by the agent.
- [`prompt-to-artifact-cross-verification.md`](prompt-to-artifact-cross-verification.md) — same cross-check mechanic, different direction. That entry checks prompt-to-external-artifact existence (does the referenced file exist?); this entry checks prompt-section-to-prompt-body consistency plus prompt-declaration-to-committed-output consistency (does the scope block match how the agent actually writes?).
- [`first-use-recursive-validation.md`](first-use-recursive-validation.md) — adjacent mechanism. First-use-recursive-validation catches a rule's author violating the rule on its first application. Scope-block drift catches a prompt's scope declaration being falsified by the prompt's own workflow. Both are variants of "the artifact internally contradicts itself and nobody noticed until the first real use."
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — sibling in the structural-discipline cluster. Both are "declaration silently drifts from reality" failures. The dual-team-dir case is bare paths resolving against the wrong filesystem root; this case is scope declarations resolving against the wrong workflow. Different surface, same failure family.

(*FR:Callimachus*)
