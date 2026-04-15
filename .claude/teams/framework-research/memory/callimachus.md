# Callimachus Scratchpad (*FR:Callimachus*)

## Session 11 — 2026-04-15 (Fix session, in progress)

[CHECKPOINT] **Three tasks from team-lead spawn prompt.** (1) Pass 1 nomenclature rename in persist-project-state-leaks gotcha — "memory" → "auto-memory" in prose, filename unchanged. (2) Protocol A intake: structural-match-beats-free-string pattern (#40). (3) Protocol A intake: jq-file-vs-arg-escape-divergence gotcha (#41). Wiki 39 → 41 entries.
[CHECKPOINT] **Task 1 complete.** 5 prose edits in `wiki/gotchas/persist-project-state-leaks-per-user-memory.md`, `last-verified` updated. Grep-clean: zero bare "project memory" concept references remaining. Literal paths, `project-memory/` dir name, `MEMORY.md` filename all preserved.
[CHECKPOINT] **Task 2 filed.** `wiki/patterns/structural-match-beats-free-string-for-protocol-filters.md` (#40). Source: Volta, F1, commit `88ced06`. Cross-team scope. uikit-dev `1deb90e` noted as deferred debt. Empirical evidence table (25 vs 26 matches, montesquieu.json false positive). Dedup: no match — distinct from substrate-invariant-mismatch (filter-predicate fidelity vs environment assumptions).
[CHECKPOINT] **Task 3 filed.** `wiki/gotchas/jq-file-vs-arg-escape-divergence.md` (#41). Source: Volta, F1, commit `88ced06`. jq file parser vs command-line arg parser use different string-parsing paths; `\s` in `.jq` file is invalid escape, needs `\\s`. Standalone entry.
[CHECKPOINT] **Gate #4 correspondence check: PASS.** 41 files on disk = 41 entries in index.md. Source-file paths corrected (were `scripts/restore-*`, actual `restore-*` — caught by verifying source-files exist before commit).
[DEFERRED] **Pass 2 filename rename** for `persist-project-state-leaks-per-user-memory.md`. 7 back-references: `wiki/index.md`, `wiki/gotchas/dual-team-dir-ambiguity.md`, `memory/callimachus.md`, `memory/team-lead.md`, `inboxes/volta.json`, `inboxes/team-lead.json`, `docs/uikit-dev-harvest-2026-04-14.md`. Inboxes are runtime state outside my write scope. Ship as coordinated batch only when all 7 consumers can be updated. Team-lead has parallel `[DEFERRED]` note.

## Session 10 — 2026-04-15 (Complete)

[CHECKPOINT] **Protocol B prior-art query served — Ruth team design.** 5-angle search across 39 wiki entries. Result: 2 partial hits, 3 clean gaps (dual-track archetype, principal-boundary, consent/HITL).
[LEARNED] **"Principal boundary" as fourth team-boundary type.** Scope defined by a person, not a codebase or deliverable. Reframes T01 if validated.
[LEARNED] **Sensitivity boundary as wiki filing constraint.** Content sensitivity as a pre-filing gate (generalize before filing).
[WIP] **Three high-severity gaps awaiting Protocol A from Ruth team design:** dual-track archetype naming, principal-boundary team shape, consent/HITL model.
[WIP] Carried: structural-discipline cluster (6 members), identifier-to-persona mapping (n=1), substrate-invariant-mismatch (n=2 draft queued), empty subdir review (contracts/ + findings/ still empty).

## Session 9 — 2026-04-14/15 (Complete)

[CHECKPOINT] **Scope-block-drift pattern filed** (#39). Wiki 38 → 39. Structural-discipline cluster 5 → 6 members.
[LEARNED] **"Load-bearing instance"** = role whose failure is most consequential (refined by Celes: consequence-weighting, not surprise factor).
[WIP] **`[CLUSTER-OBSERVATION]` tag convention** (Celes). Not yet used. Threshold for Medici escalation: n>=3 multi-gate members.

## Session 8 — 2026-04-14 (Complete)

[CHECKPOINT] Wiki 36 → 38 (+pane-border #37, +project-memory leak #38). Delivery-window freeze held.
[DEFERRED] substrate-invariant-mismatch pattern (n=2), dual-sourcing defense Protocol C (awaiting Brunel), identifier-to-persona (n=1), container bootstrap sync-directionality (awaiting Brunel), empty subdir review.

## Sessions 1-7 (pruned — key decisions retained)

[DECISION] Phase 2 activated session 6. Gap Tracking + Health Sensing active. Gate is one-way.
[DECISION] Protocol C first cycle complete session 6: Structural Change Discipline in common-prompt.
[PATTERN] Default-no-reply convention. Notification-of-fact messages need no ack.
[PATTERN] Execute + coordinate, not execute + silent (asymmetric urgency drives asymmetric coordination).
[LEARNED] One data point is a gotcha; two is a pattern. Don't promote n=1.
[LEARNED] Sibling entries beat one-entry-with-two-variants when failure surfaces diverge.
[LEARNED] Cross-references describe relationships, not positions.
[LEARNED] Batch submission: process one-at-a-time end-to-end, not interleaved.
[LEARNED] External intake requires explicit provenance frontmatter.
