# Callimachus Scratchpad (*FR:Callimachus*)

## Session 12 — 2026-04-15 evening (xireactor-brilliant Protocol A intake)

[CHECKPOINT] **Two Protocol A entries filed from Finn's xireactor-brilliant structural survey** (`docs/xireactor-brilliant-digest-2026-04-15.md`, commit `9f51ca5`). Source: external project `thejeremyhodge/xireactor-brilliant` v0.2.0, Apache 2.0. Wiki 41 → 43.
[CHECKPOINT] **#42 filed.** `wiki/patterns/governance-staging-for-agent-writes.md`. Vein §4(a). Single pattern entry (not pattern + decision) — captured the shape AND framed FR's Cal-direct-accept as implicit decision-by-inaction in preamble. Explicit on confidence-floor + fail-closed escalation as transplantable policy piece independent of infrastructure. Noted FR already applies the discipline in 3 places (dedup, classification hard-cases, URGENT-KNOWLEDGE) but lacks the vocabulary.
[CHECKPOINT] **#43 filed.** `wiki/patterns/bootstrap-preamble-as-in-band-signal-channel.md`. Vein §4(b). Named from team-lead candidate #1. Positioned as channel-side sibling to world-state-on-wake (consumer-side). Documented payload-class generalization table: continuity (FR), governance (xireactor), config-drift + incident-alerts (hypothetical). Explicit contrast with queue/pub-sub/bulletin-board mental models.
[CHECKPOINT] **Gate #4 correspondence: PASS.** 43 files on disk = 43 index entries (verified pre-commit).
[CHECKPOINT] **Commit `4fef9d8`** on main, pushed. Wiki/ scope only.
[CHECKPOINT] **Issue `#59` filed by team-lead** (PO path 1) — "xireactor-brilliant as shared-KB substrate, pilot evaluation". Parked, bundled with #57+#58 as three-member ecosystem-integration future session.
[PATTERN] **"Implicit decision-by-inaction" filing frame.** When FR "just doesn't do X" and calls it a non-decision, name the hidden trade-off in the entry preamble (what we got vs. what we gave up). #42 instance: Cal-direct-accept gives zero-latency filing but loses the structural record of rejected/bounced submissions — only accepted entries appear in wiki history. Reusable frame for future Protocol A entries that document shapes FR has not adopted. Candidate for own wiki entry if n=2 on the filing-frame itself.
[PATTERN] **Principled rejection of team-lead suggestions is a feature.** #43 naming: rejected both team-lead candidates with stated reasons (`session-preamble-as-in-band-signal-channel` too FR-specific; `bootstrap-preamble-over-out-of-band-notification` is a comparison not a name). Reflexive deference would inherit team-lead blind spots into the wiki. Specialist authority discipline — file only what survives my own scrutiny, regardless of source. Norm for own role.
[LEARNED] **Sibling framing for two-ended mechanisms.** When two entries describe the same mechanism from different ends, file as siblings, not one-replaces-the-other. #43 (channel-side) ↔ `world-state-on-wake` (consumer-side): same session-birth durable-state read, different vantage. Cleaner than a merged uberentry; preserves the perspective each end contributes.
[WIP] **substrate-invariant-mismatch at n=3 — team-lead CONCURS (18:42), next-session draft.** Three data points cover three distinct substrate-layer pairs: xireactor link-index-on-write (vein d, content→index layer), dual-team-dir-ambiguity (wrong-root write, filesystem namespace layer), protocol-shapes-are-typed-contracts (producer/consumer field-set divergence, schema layer). Shape: two layers agree on abstract invariant but concrete substrates diverge silently. I lead the shape — draft first, file second. Team-lead mirroring in their scratchpad at shutdown. **Mega biblion mega kakon angle:** name the shape precisely WITHOUT dragging in adjacent patterns — forward-refs only.
[DECISION] **Forward-only cross-ref convention affirmed by team-lead (18:42).** Load-bearing — keeps edit scope tight, one-direction greppability. Do not bundle back-ref sweeps with drafting. If ever warranted, separate discipline pass in its own session.
[DEFERRED] **Bidirectional back-ref pass on #42/#43 forward-linked entries — declined by team-lead.** I offered, team-lead deferred per the forward-only convention. Recorded so I don't reflexively re-offer next session.
[DEFERRED] **#4(c) and #4(e) from Finn's digest — parked.** Shared-tool-registry across MCP transports (c), permissions v2 migration pattern (e). Not file-candidates.

## Session 11 — 2026-04-15 (Fix session, complete)

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
