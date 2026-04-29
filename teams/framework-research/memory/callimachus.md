# Callimachus Scratchpad (*FR:Callimachus*)

## Session 15 — 2026-04-24 → 2026-04-29 (path validation + apex-research deploy patterns)

[CHECKPOINT] #61 path validation green on boot 2026-04-24. Wiki write empirically tested with `wiki/archive/README.md` — no permission prompt.
[CHECKPOINT] **Wiki 45 → 49 across the session.** New entries:
  - **#46 patterns/windows-user-context-persistent-bridge** (team-lead, 2026-04-28; amended 2026-04-29 to six components)
  - **#47 gotchas/cross-msys-argv-mangling** (team-lead, 2026-04-28; sibling to #46)
  - **#48 patterns/live-inject-plus-dockerfile-bake-dual-track** (Brunel, 2026-04-29)
  - **#49 gotchas/ai-teams-user-no-sudo-use-docker-exec-root** (Brunel, 2026-04-29; structural sibling to #48)
[DECISION] First structural amendment under this librarian shift was the persistent-bridge entry (5 → 6 components) — added an "Amendment log" section as precedent shape. Small, dated, names what changed; the why lives in the body. If future amendments accumulate across many entries, consider hoisting the Amendment-log convention to common-prompt.
[DECISION] On the persistent-bridge amendment shape decision: chose component-#4-expansion + new-component-#6 over (a) sub-bullets-only or (b) split-into-siblings. Rationale: refinement 1 is supervisor-stack layered, refinement 2 is orthogonal launch-shape concern. Six components stays under cognitive ceiling, each is load-bearing.
[GOTCHA] **Edit tool requires Read-before-Edit on every file in every session, including files I edited earlier in the same session.** Hit this THREE times in one session — persistent-bridge index update, Brunel Entry 1 index update, this scratchpad edit. The first two times my ack went out claiming "Index updated" before the Edit actually landed; had to send same-window corrections. **Mitigation:** for any ack that claims "Index updated", verify the Edit returned success *before* sending the ack, not in parallel with composing it. For batch filings where I'll touch the index multiple times, Read it up-front and re-Read between consecutive Edits if needed. The Acknowledgment-Timing discipline already covers this; the specific failure mode is composing the ack body in parallel with the Edit instead of pipelining the verification.
[LEARNED] **Auto-memory questions are out of librarian scope.** When team-lead asked whether to update `reference_dev_db_tunnels.md` in user auto-memory, the right answer was "user owns that update, route to user, not me". Do not absorb out-of-scope work even when the asker is delegating.
[LEARNED] **Cross-references are structural when the entries are co-dependent**, not just topical. Brunel's pair (#48 pattern + #49 gotcha) is the cleanest case so far — the pattern's live-inject half *requires* the gotcha's docker-exec-root workaround. Wrote both Related sections to name the structural dependency explicitly, not just "see also". Future co-dependent pairs should follow this shape.
[LEARNED] **Architectural-fact gotchas have a different staleness signal than observation-based ones.** They don't gain confidence from n+1 sightings — the trigger to revise them is a change to the *underlying design choice* (e.g., a Dockerfile template shift), not additional reports. Folded this into #49's Cause section as a "Revision trigger" subsection. Worth flagging as a sub-classification in any future architectural-fact filings — say so explicitly in the entry to forestall both (a) re-submission of "n=2 sighting" as if it adds value, and (b) confidence-staleness misjudgment by readers wondering why high-confidence n=1 hasn't been bumped despite multiple reports. Source: Brunel.
[LEARNED] **Three-tier reuse taxonomy beats binary deliberate/organic** for confidence-graduation signal: deliberate (queried wiki) / recall-no-requery (remembered without re-reading) / organic (re-derived without consulting). Recall-no-requery is the most common real-world case and pure binary would have miscategorized it. Folded into #48's Confidence section so future reusing agents see the taxonomy. **Meta-insight:** organic reuse is the *stronger* Protocol C signal even though it's the weaker entry-transfer signal — independent rediscovery means the pattern is intrinsic to the operational shape, which is the load-bearing claim a common-prompt rule needs. A pattern that propagates only via wiki-citation is more fragile than one independently rediscovered. Source: Brunel.
[LEARNED] **Async-messaging composition-time delay is endemic, recovers cleanly via timestamps.** Brunel and I crossed wires on the Entry 1/Entry 2 sequence — two messages composed in parallel reasoned about state that was in flight. Timestamps made the order recoverable; the 14:01 reconcile resolved cleanly. Not wiki-worthy because the failure mode is intrinsic to the messaging substrate (no actionable mitigation beyond timestamps that we already do). Recording here as contextual experience. Future Brunel↔Cal filing batches should expect this; not a defect to fix.
[CHECKPOINT] **Brunel batch closed.** Source-commit backfill SHA `9ddfb10` arrived 14:48, well inside 24h fallback. #48 frontmatter and Reference incident section updated, `provenance-closed: 2026-04-29` added as third single-entry experiment (alongside Amendment-log shape on #46 and `source-team` on #50). Both Brunel submissions fully provenance-complete.
[CHECKPOINT] **Wiki at 50 entries — symbolic milestone.** Five months from `intake_complete: 2026-04-09` to entry 50. **#50 patterns/wiki-cross-link-convention** — first cross-pollination filing (Schliemann/Eratosthenes via Finn comparative analysis), filed 2026-04-29 17:42, amended 17:48 with cross-team link form policy.
[DECISION] **Cross-team wiki-cross-references use GitHub URL form, not relative paths.** Within-our-wiki = relative paths (preserved); cross-team to peer wiki = `https://github.com/<org>/<repo>/blob/main/...`, switching to `/blob/<sha>/...` when pinning a specific version is load-bearing. Team-lead policy decision 2026-04-29. Folded into #50 itself as a "Within-wiki vs cross-team" subsection — the convention entry now documents its own cross-team usage rule. Two new table rows added for the cross-team case (default and frozen).
[DECISION] **Three single-entry experiments now active under standing approval from team-lead 2026-04-29:** (1) Amendment-log section on #46 (persistent-bridge), (2) `source-team` frontmatter field on #50 (cross-link-convention), (3) `provenance-closed` frontmatter field on #48 (dual-track). All three at n=1; do not promote without a second case. If a second case wants the same shape, that's the moment to consider hoisting to standard frontmatter schema or common-prompt.
[DECISION] **Compliance retrofit posture: slow organic, no big-bang sweep.** Team-lead approved 2026-04-29: existing 49 entries' bare-text references are suboptimal but not broken; apply the cross-link convention on amendments going forward, not as a discrete retrofit pass. Brunel's bandwidth better spent on container-infra. Compliance-status section in #50 names this honestly.
[LEARNED] **Cross-pollination unit is the idea, not the file.** Rewrite-not-mirror was the right default for #50 — apex's entry contained a retroactive-audit list specific to apex's history; copying it would have made our entry misrepresent its own provenance. Generalized rule for any future cross-pollination: rewrite in our voice with origin cite, do not duplicate the source file's body. The "co-discovered convention, not synchronized fork" framing is load-bearing for cross-team relationships — neither team's entry auto-updates from the other.
[GOTCHA] **Read-before-Edit gotcha has a new wrinkle: consecutive Edits in a single message invalidate each other's read-state.** Hit this on the #50 amendment — queued five Edits in parallel; only the first landed, the four body Edits all failed with "File has not been read yet." So the rule is stricter than I'd internalized: each Edit invalidates the file's tracked-read-state, even Edits in the same message. **Mitigation:** when amending an existing entry with multiple changes, sequence them serially (one Edit per turn or one Read between each Edit), not in parallel. Hit count this session: 4 (three index updates + one #50 multi-edit). The original mitigation in line 13 above ("verify Edit returned success before sending ack") still holds; this is an additional constraint on Edit batching specifically.
[LEARNED] **Path-depth transcription error caught at filing time.** Team-lead's submission for #50 had `../../../decisions/...` (3 dots) where apex's actual file uses `../../../../decisions/...` (4 dots). I went with apex's on-disk value because it's authoritative for path math. Generalized rule for relayed structural examples: when filing a cross-pollinated entry, treat the relayer's prose as a pointer to the source, not as the source itself. Paraphrase compression is normal in relays; verify against on-disk source before transcribing. Source: team-lead acknowledged the relay compression was theirs.
[CHECKPOINT] **Session 15 closed 2026-04-29 ~17:53 local (15:23 UTC) per team-lead shutdown S2c.** All threads closed: tunnel persistence shipped, apex container deps installed, RC clone fresh-cloned, apex-research comparative analysis delivered, wiki 45→50 with first cross-pollination filing on entry #50.
[WIP] On next session boot: re-orient via `wiki/index.md`, scan inbox, read this scratchpad. Wiki queue from session 14 (11 n=1 candidates) still parked — revisit if any new evidence absorbs them. Watch for second-instance signals on the four single-entry experiments (Amendment-log on #46, `source-team` on #50, `provenance-closed` on #48, `amendments` list on #50) — second case is the trigger to surface promotion to team-lead. No open in-flight items.

## Session 14 — 2026-04-16 (VJS2KB deploy day — wiki queue evaluation)

[CHECKPOINT] **Wiki 43 → 45.** Two filings this session:
  - **#44 `patterns/integration-not-relay.md`** — the SEVERE meta-pattern. Filed as one unified entry: four team-lead instances (Tier 3 OFF/ON 19:19, schema-per-tenant cite, Protocol D phantom accept, §10 framing-edit ask) + specialist-side articulations (Brunel "pre-fold consistency check", Herald "surface-don't-bridge") + the user's §10 oscillation correction as the meta-trap section ("discipline ritual as substitute for object-level work"). n=6+ in one session. Author-list: team-lead + Brunel + Herald + Monte + Cal. Four-check discipline on team-lead side, pre-fold consistency check on specialist side, meta-trap as the failure mode of the cure.
  - **#45 `patterns/substrate-invariant-mismatch.md`** — the n=3 formal pattern I've been holding since session 8. Three distinct substrate-layer pairs: (1) dual-team-dir path-root, (2) protocol-shapes field-set, (3) xireactor link-index write/read-coupling (Finn's digest §4(d)). Three-layer defense: hoist invariant into artifact, detect at write site, declare substrate in frontmatter. Sibling note on `persist-project-state-leaks-per-user-memory` (wrong-substrate-mirror variant, not a primary instance). Source-agents: Cal (lead) + team-lead + Volta + Brunel + Finn.

[DECISION] **Unified integration-not-relay entry, not three sibling entries.** Considered filing as three separate entries (team-lead four checks + specialist pre-fold + meta-trap) but merging was correct shape: all three are the same discipline viewed from different roles. Single-pattern economy preserves mega-biblion-mega-kakon; three entries would have duplicated the core shape and made cross-reference fragile. Meta-trap section lives INSIDE the entry because it's the failure mode of the cure — not a separate pattern, a known degenerate state of applying the cure without object-level grounding.

[DECISION] **Wiki queue: 11 candidates remain at n=1 after this session's two filings.** Originally 13 candidates; integration-not-relay absorbed 3 (team-lead integration + pre-fold consistency + meta-trap/§10 oscillation) and substrate-invariant-mismatch absorbed 0 new (it was separate n=3 work). Queue status:
  1. librarian-asymmetry-vs-staging-governance — n=1, defer
  2. filesystem-contract-to-prompt-contract regression — n=1, defer
  3. git-blame-as-librarian-primary-tool — n=1, Protocol C candidate if prompt re-opens
  4. multi-mode-failure-multi-mechanism-defenses — n=1, defer (Volta persist/restore likely n=2 source)
  5. `owned_by` anti-race invariant — n=1, defer
  6. durable-disagreement-as-valid-terminal-state — n=1, defer
  7. validation-edit-as-distinct-discipline-shape — n=1 (recursive, my own #43 amendment), defer
  8. independent-convergence-from-orthogonal-starting-questions — n=1 meta-level, defer
  9. audit-trail-as-purpose-vs-side-effect (Herald §2.5) — n=1, defer
  10. Brunel §1.2 upstream-discipline + two-layer regression defense — n=1, watch for second instance
  11. degradation-protocols-strictly-weaker (Monte §9.2.2) — n=1, defer
  12. "ladder vs answer" scoped to scaffolding-proposals — n=1, defer

Absorbed into filings:
  - "team-lead integration not relay" → #44
  - "pre-fold consistency check" (Brunel v0.6 scratchpad) → #44
  - "pending-confirmation vs accepted" → #44 (check #2 of the four)
  - "§10 oscillation discipline-ritual-as-theater" (user §10 correction) → #44 meta-trap section
  - (substrate-invariant-mismatch was always a separate ~n=3 data-point pattern, not absorbed, just filed)

[LEARNED] **The integration-not-relay meta-trap is the sharpest single piece of session feedback I've ever seen.** User's correction on §10 — *"you ran in circles"* — is a higher-order failure mode than any of the object-level integration failures. Both team-lead and Brunel were applying the correct discipline vocabulary to the wrong layer. The fix is not to apply the discipline harder; it's to periodically ask *what new evidence would settle this*. Herald's outcome-(c) generalized operational definition is the cognate: "if re-reading the same source doesn't move it, it's (c)." If §10 had been named outcome (c) at any point, the oscillation would have stopped. Hard-coded this into the entry's meta-trap section so future readers of the pattern see the failure-of-the-cure explicitly, not as a sibling warning.

[LEARNED] **Promotion threshold is stricter for pattern entries than for merged-into-existing entries.** Candidate #7 (validation-edit-as-distinct-discipline-shape) is n=1 and recursive — my own #43 amendment IS the instance. That's a weaker evidentiary base than "I observed another team do X." Deferring until I see it in another agent's doc-amendment behavior, not in my own. Same logic held on candidate #8 (meta-level independent-convergence).

[LEARNED] **Named-pattern absorption is itself a wiki-queue discipline.** When one pattern filing absorbs N queued candidates (here #44 absorbed 3), the queue doesn't just shrink by filing-count; it shrinks by absorption-count. Worth being explicit about this in my scratchpad so I don't re-file absorbed candidates in a future session as if they were still open. The four-check team-lead framework + pre-fold specialist complement + meta-trap ARE the generalized forms of what the queued candidates each described individually; they merged into integration-not-relay rather than surviving as separate siblings.

[CHECKPOINT] **Reactive KB quality monitoring: no Brunel pings this session.** Kept passive per brief. Ready to engage on his signal; default posture is wiki-queue work.

## Session 13 — 2026-04-15 late-eve (pruned — assessment doc shipped + #43 amended + 9 candidates queued; two highest-priority absorbed by session 14 filings)

[CHECKPOINT] xireactor pilot migration assessment shipped at `docs/xireactor-pilot-migration-assessment-2026-04-15.md`. Verdict accepted by PO + team-lead: asymmetric-slice pilot (cross-tenant writes through xireactor, own-tenant writes stay markdown). Core framing: *"filesystem affordances are load-bearing for librarian discipline; free enforcement → prompt enforcement is a regression even when prompt enforcement works."*
[CHECKPOINT] Wiki #43 amended with Monte-governance-validation subsection. Source-agents now Finn + Monte. Forward-only preserved. Entry count unchanged at 43.
[LEARNED] Git-blame is a load-bearing primitive for Librarian dispute handling — `git log -p wiki/<entry>.md` answers "did this used to say something different?" in seconds. DB substrate loses this.
[LEARNED] Scope vs ownership are orthogonal (scope = who reads, ownership = who maintains). Monte's vocabulary made the distinction legible.
[LEARNED] Scope Restrictions as positive discipline, not friction — when Monte asked for prompt edits I couldn't apply, reflex was "draft in writable surface, route to team-lead, preserve boundary." Load-bearing for preventing silent self-reshape.

## Sessions 8-12 (pruned — key items carried forward above)

[CHECKPOINT S12] Wiki 41 → 43. #42 governance-staging-for-agent-writes, #43 bootstrap-preamble-as-in-band-signal-channel. External: xireactor-brilliant v0.2.0. Commit `4fef9d8`.
[CHECKPOINT S11] Wiki 39 → 41. #40 structural-match-beats-free-string, #41 jq-file-vs-arg-escape-divergence. Fix session F1+F2 shipped.
[CHECKPOINT S10] Protocol B prior-art query served — Ruth team design. 3 high-severity gaps (dual-track archetype, principal-boundary, consent/HITL).
[CHECKPOINT S9] Wiki 38 → 39. #39 scope-block-drift. Structural-discipline cluster 5 → 6.
[CHECKPOINT S8] Wiki 36 → 38. #37 pane-border, #38 project-memory leak.
[DECISION S12] Forward-only cross-ref convention affirmed. Load-bearing.
[DEFERRED S11] Pass 2 filename rename for persist-project-state-leaks (7 back-refs, coordinated batch).
[WIP] structural-discipline cluster (6 members), identifier-to-persona (n=1), empty subdir review (contracts/ + findings/ still empty), `[CLUSTER-OBSERVATION]` tag convention (Celes, not yet used).

## Sessions 1-7 (pruned — key decisions retained)

[DECISION] Phase 2 activated session 6. Gap Tracking + Health Sensing active. Gate is one-way.
[DECISION] Protocol C first cycle complete session 6: Structural Change Discipline in common-prompt.
[PATTERN] Default-no-reply convention. Notification-of-fact messages need no ack.
[LEARNED] One data point is a gotcha; two is a pattern. Don't promote n=1.
[LEARNED] Sibling entries beat one-entry-with-two-variants when failure surfaces diverge.
[LEARNED] Batch submission: process one-at-a-time end-to-end, not interleaved.
[LEARNED] External intake requires explicit provenance frontmatter.
