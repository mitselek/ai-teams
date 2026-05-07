---
source-agents:
  - volta
discovered: 2026-05-06
filed-by: librarian
last-verified: 2026-05-06
status: active
source-files:
  - teams/framework-research/startup.md
  - topics/06-lifecycle.md
source-commits:
  - 426194d
source-issues: []
---

# Cross-Document Prose vs Procedure Drift

When a structural change to a procedure (e.g., a startup-protocol step) is applied to one document but not the other documents that describe the same procedure in prose, **the prose document goes stale silently**. No tool reports the inconsistency; the document still parses; the prose still reads. The drift only surfaces when a reader (an LLM agent, the next editor, a reviewer) acts on the stale prose and runs a procedure that no longer exists.

This is the **cross-document, within-team** variant of the structural-discipline gate-1 family. Within-document grep ([`patterns/within-document-rename-grep-discipline.md`](../patterns/within-document-rename-grep-discipline.md)) covers the one-file case. Cross-team Pass 1 / Pass 2 separation ([`patterns/pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md)) covers the framework-wide case. **This entry covers the missing middle:** N files in one team's repo, all describing the same procedure, where editing one without editing the others leaves the team's own documentation internally inconsistent.

## The Failure Mode

Two documents in the same repo describe the same procedure:

- **Document A (procedure-of-record):** `startup.md` — the executable steps an agent or human runs.
- **Document B (prose-explainer):** `topics/06-lifecycle.md` — the design narrative that explains *why* the steps are what they are.

A structural change to the procedure (collapsing Steps 2/3/4 into one Step 2 + adding Step S5) gets applied to Document A. The change to A is the urgent one — it is what executes — and the editor stops there, considering the work done.

Document B retains the original prose: "TeamDelete is pointless because the runtime team dir is ephemeral." That prose was true before the structural change and false after. It now contradicts Document A. No grep across documents was run; the editor's working memory holds Document A's new shape, but Document B was never reopened.

The drift window in the FR instance: **7 days** between the startup.md collapse (2026-04-30, commit `426194d`) and the topic 06 prose rewrite (2026-05-06). For 7 days, an agent reading topic 06 to understand the lifecycle would have learned an inverted version of what startup.md actually executed.

## Why "the docs still read OK" is the trap

The stale prose was internally coherent. "TeamDelete is pointless" was a perfectly readable sentence. The reader has no signal that it contradicts another document in the same repo unless they:

1. Read both documents in the same session, AND
2. Notice the contradiction, AND
3. Investigate which is current.

The default reader path is none of those — they read one document and trust it. The trust is misplaced because the documents are in lockstep at write-time but not at read-time.

## The Discipline (gate-1 extension to cross-document)

Common-prompt's Structural Change Discipline gate 1 ("Grep before editing") is currently scoped to within-document. Extending it to cross-document:

> Before structurally changing any procedure, grep **the entire team repo** (not just the file you're editing) for prose references to the procedure's old shape. Edit all references in one pass. Re-grep afterward — zero hits is the only acceptable result.

The cost is one additional `grep -r` invocation across the repo per structural change. The cost of skipping it is N days of stale-prose drift, where N is the time until someone reads the wrong document and acts on it.

## Revision Trigger

This is an architectural-fact entry: it describes the **structural failure mode** of cross-document discipline, not an empirical behavior whose intentionality is uncertain. The mechanism is fully exposed at n=1; n+1 sightings of the same drift do not strengthen this entry's confidence. The entry is invalidated by, and only by:

- **Tooling that auto-detects cross-document drift** — e.g., a CI check that fails when startup.md changes without a corresponding topic-06 change, or a docs-link-validator that catches the prose-vs-procedure contradiction. If such tooling lands in the team's CI, the failure mode becomes auto-detected and this discipline becomes redundant.
- **Procedure consolidation** — if the team eliminates the prose-explainer pattern (one canonical procedure-of-record, no separate explainer) the drift surface goes away.

Until either revision trigger fires, the discipline is the only line of defense.

## Why this is a separate entry from `within-document-rename-grep-discipline`

Both are gate-1 ("grep before editing") family members, but at different scopes:

- **Within-document** (sibling pattern): grep one file before editing. References are visible in the same buffer; the cost of skipping is ~30 seconds of context-switching.
- **Cross-document, within-team** (this entry): grep the team repo before editing. References are invisible without the grep; the cost of skipping is days of drift.

A reader who internalizes the within-document rule does not automatically internalize the cross-document one — the within-document case is solvable by attention; the cross-document case requires a tool invocation across files the editor isn't currently looking at. The discipline-shape is the same; the operational scope is different enough that it warrants its own entry.

## Distinct from `pass1-pass2-rename-separation`

[`patterns/pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md) covers **cross-team, framework-wide** identifier renames (machine identifiers across N teams' configs). That pattern's discipline is *temporal* (separate prose Pass 1 from machine-identifier Pass 2) because cross-team consumers cannot be enumerated atomically. This entry's scope is **one team's repo** where consumers *can* be enumerated atomically by `grep -r`, so the discipline is *spatial* (grep all consumers in one editing pass) rather than *temporal*.

The three siblings together cover the gate-1 family at three structural scales:

| Scope | Sibling | Discipline |
|---|---|---|
| One document | [`patterns/within-document-rename-grep-discipline.md`](../patterns/within-document-rename-grep-discipline.md) | Grep within file |
| One repo (this entry) | this entry | Grep across files in one pass |
| N teams (cross-team) | [`patterns/pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md) | Pass 1 prose / Pass 2 machine-identifiers, default to Pass 1 only |

## Evidence

n=1 (FR, Volta, S28, 2026-05-06).

- **Document A change:** `startup.md` Steps 2/3/4 collapsed to Step 2 + Step S5 added. Commit `426194d` on 2026-04-30.
- **Document B drift:** `topics/06-lifecycle.md` continued to assert "TeamDelete is pointless" until 2026-05-06 — a 7-day drift window.
- **Discovery:** Volta's S28 T06 path-tree rewrite session (2026-05-06) — caught while doing the rewrite, not while reading either document for execution. Indirect catch; the drift could have surfaced via a misled reader before this session and did not, by chance.

The chance-not-discipline catch is part of the entry's load-bearing-ness. The drift was repaired by the rewrite session, not by a discipline that detects it. That is exactly the gap this entry names.

## Confidence

Medium. Architectural-fact entry — n+1 sightings will not strengthen, per the [Architectural-Fact Convention](../../prompts/callimachus.md). Mechanism is fully exposed at n=1. Confidence rises only via revision-trigger satisfaction (tooling addition or procedure consolidation), not via more incidents.

## Related

- [`patterns/within-document-rename-grep-discipline.md`](../patterns/within-document-rename-grep-discipline.md) — within-document sibling. Same family, smaller scope.
- [`patterns/pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md) — cross-team sibling. Same family, larger scope.
- [`patterns/why-this-section-exists-incident-docs.md`](../patterns/why-this-section-exists-incident-docs.md) — adjacent at the prose-staleness layer. That pattern names *why* a section exists so future readers don't delete it; this entry names *how* prose drifts when a procedure changes. Both fix the same root cause (prose ages independently of the procedure it describes) at different angles.
- [`patterns/scope-block-drift-from-practice.md`](../patterns/scope-block-drift-from-practice.md) — also gate-1+2 family. Prompt scope blocks drift from agent practice; this entry has prose drifting from procedure. Same shape (declared shape diverges from operational shape) at different artifacts.

(*FR:Callimachus*)
