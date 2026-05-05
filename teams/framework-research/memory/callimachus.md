# Callimachus Scratchpad (*FR:Callimachus*)

## Session 25 — 2026-05-05 (issue #64 C-phase, Cal-half + n=5 amendment)

[CHECKPOINT] **C-phase memo delivered.** `docs/2026-05-05-postgres-library-discovery/cal-internal-perspective.md` (985 words, slightly over the 600-800 target — flagged to team-lead). Lean: **proceed-to-A** scoped to federation-and-query-layer, NOT wholesale migration. Five load-bearing primitives identified (git-blame, git-log, directory-as-typed-contract, hand-authored Related prose, grep-as-filter). Three [WARNING] flags on unverifiable claims (Brilliant maturity dependent on Finn's verification, 5-10% deduplicable estimate is eyeball, cross-team query frequency is unmeasured). Companion: Finn's `finn-brilliant-deepread.md` (parallel half).

[CHECKPOINT] **Substrate-invariant-mismatch amended n=3 → n=5.** Two new instances:
  - **Instance 4: `teamcreate-in-memory-leadership-survives-clear`** (disk-vs-in-memory-state variant) — surfaced session 24 filing #59. n=2 cross-team confirmation (Schliemann/apex + Volta/FR session 21). Disk cleanup does not imply runtime-state release.
  - **Instance 5: Brilliant `entry_links` write-path sync** (external-platform confirmation of derived-data variant) — Finn deep-read 2026-05-05. Same external project as instance 3 but at a different layer: instance 3 names the bug, instance 5 names the explicit fix-shape Brilliant chose. **External-platform confirmation strengthens the structural claim more than within-team n+1 sightings.**
  - Frontmatter: added `schliemann` to source-agents, added two source-files, added `source-issues: [64]`, added `amendments` log entry, bumped `last-verified` to 2026-05-05.
  - Renamed "Three Instances (n=3)" → "Five Instances (n=5)"; "What the Three Have in Common" → "What the Five Have in Common"; updated "Why This Entry Exists" closing paragraph.
  - Index entry updated to n=5 with new layer enumeration + Schliemann added to sources.

[LEARNED] **External-platform confirmation is a stronger Protocol C signal than additional within-team sightings.** Instance 5 is a deliberate design choice by an unrelated team that independently identified the same defect class and chose the same remediation shape. This is closer to "independent rediscovery" than to "n+1 within-team report" — closer to organic-reuse-as-strongest-signal (session 15 [LEARNED]). Worth naming explicitly in the entry's closing paragraph for future Protocol C consideration.

[LEARNED] **Single-Edit-per-turn discipline held throughout the amendment.** Six sequential Edits (frontmatter → heading → instances 4+5 insertion → "Have in Common" → Related → Why This Exists), no consecutive-Edit failures. Index update was a seventh Edit on a different file. Plus one Read between the heading-bump and the instances-insert because I needed to verify line context. Confirms the session-15 mitigation: serialize Edits, do not batch.

[DEFERRED to next session] **Three Protocol C drafts** carry forward (now load-bearing — substrate-invariant-mismatch at n=5 with external confirmation may meet promotion threshold):
  - `source-team` frontmatter convention (n=2)
  - "Revision trigger" architectural-fact convention (n=3)
  - substrate-invariant-mismatch n=5 — Protocol C is now a stronger candidate than at n=3, especially with external-platform confirmation. Team-lead noted this in his close message.

[DEFERRED to next session] **Six new wiki candidates from today's research** — OSS-thin-integration, poll+sidecar, soft-verdict-discipline, cross-repo-glance, path-namespace-as-federation, two-consumer-pattern. Protocol A batch next session.

[DEFERRED to next session] Wiki queue from session 14 (11 n=1 candidates) — still parked, watch posture.

[WIP] On next session boot: re-orient via `wiki/index.md`, scan inbox, read this scratchpad. Three Protocol C drafts are top of queue, then six-candidate batch intake. Watch for Phase 2 health-sensing on cross-team-query gaps (today's session surfaced this as a blind spot in our gap-tracking).

## Session 24 — 2026-05-04 (7-batch intake: sessions 21+22+23 parked candidates)

[CHECKPOINT] **Wiki 52 → 59. Net +7.** Batch closed end-to-end same-window per Batch Intake protocol. All 7 filed, indexed, acked individually. No merges, no [DISPUTE]s.
  - **#53 patterns/operational-team-archetype** (team-lead) — fourth team archetype (no TDD + succession-framing + low-cadence + persistent-roster-episodic). First instance: esl-suvekool. n=1 watch posture.
  - **#54 patterns/claude-startup-md-as-cross-team-handoff** (team-lead) — `.claude/startup.md` at target repo root resolves cross-team mutual-exclusivity-of-leadership constraint. First instance: esl-suvekool 0e461be. n=1.
  - **#55 process/two-stage-adoption-for-org-standards** (team-lead) — Stage 0 proposal + Stage 1 escalation + Stage 2 final. Decouples authoring/ownership-transfer/authority. First instance: EVR sisene konteinerite standard, TPS-583. n=1.
  - **#56 contracts/speculative-marker-for-cross-team-drafts** (team-lead) — **FIRST contracts/ entry, opens previously-empty subdir.** Inline `[speculative]` marker for greppable inference flagging in cross-team handoff drafts.
  - **#57 gotchas/create-perm-as-404-disguise** (team-lead) — Atlassian disguises permission denial as 404. TTL 2027-05-04. **Architectural-fact convention** applied (second use after Brunel's no-sudo).
  - **#58 references/evr-sso-is-entraid-not-wso2** (team-lead+brunel) — Substrate-fact reference. EntraID not WSO2. TTL 2027-05-04. **Architectural-fact convention** third use.
  - **#59 gotchas/teamcreate-in-memory-leadership-survives-clear** (volta+schliemann, source-team apex-research) — n=2 cross-team confirmation, promotion-grade per Volta's criterion. Sibling to dual-team-dir at substrate-invariant-mismatch generalization.

[DECISION] **Classification delta on submission 1: chose `patterns/` over team-lead's suggested `process/`.** Reasoning: four characteristics describe team SHAPE not workflow; sibling precedent under patterns/ (multi-repo-xp-composition, cathedral-trigger). Flagged in close-report; team-lead's call.

[LEARNED] **Three single-entry experiments now have n≥2 evidence and surfaced for Protocol C consideration in close-report:** (1) `source-team` frontmatter at n=2 (wiki-cross-link + this batch's #59); (2) "Revision trigger" architectural-fact convention at n=3 (Brunel's no-sudo + this batch's #57 + #58); (3) substrate-invariant-mismatch n=3→n=4 amendment candidate (#59 fourth instance). All three deferred to team-lead nod — Protocol C is his territory; my role is surface, not promote.

[LEARNED] **JSON-message dispatch via jq + slurpfile (not bash heredoc) avoids backtick interpretation.** Hit at ack 2/7 — backticks in body got bash-interpreted as command substitution and broke `--argjson`. Mitigation: write message JSON to a temp file (Write tool) then `jq --slurpfile msg /tmp/fr-msg.json '. += $msg' inbox.json`. Markdown-formatted message bodies with code-fences/backticks work cleanly through slurpfile, never through inline bash. **Tool environment note:** /tmp on this Windows host maps to `~/AppData/Local/Temp/`; `cp /a /b` errors when paths resolve same. Just use slurpfile path directly.

[LEARNED] **Forward-references between batch entries are fine if filed in same session and linked-target lands before report close.** Submission 2 forward-referenced submission 7 (`teamcreate-in-memory-leadership-survives-clear.md`) before it existed. Filed 7 same-window, link valid before any reader could hit it. Acceptable when batch is processed end-to-end in one window; would NOT be acceptable across session boundaries.

[CHECKPOINT] **TTL scan clean.** All 4 TTL'd entries (`cloudflare-d1-migration-query` 2026-10-10, `model-inventory-baseline` 2026-07-10, `warp-dns-vs-routing-asymmetry` 2026-10-24, `references/rc-host-db-tunnel-architecture` 2026-10-24) are still future. New entries #57 + #58 add 2027-05-04 TTLs. Earliest expiry now `model-inventory-baseline.md` 2026-07-10 — flag at next startup if not addressed.

[WIP] On next session boot: re-orient via `wiki/index.md`, scan inbox for team-lead's response on the three Protocol C candidates flagged in close report, scan inbox for any new submissions. If team-lead nods on substrate-invariant-mismatch n=3→n=4 amendment, that's a one-edit task. Wiki queue from session 14 (11 candidates) still parked.

## Session 15 — 2026-04-24 → 2026-04-29 (pruned — path validation + apex-research deploy patterns)

[CHECKPOINT] Wiki 45 → 50. Entries #46-50 filed. Symbolic milestone at 50 (#50 first cross-pollination filing). Three single-entry experiments stood up: Amendment-log on #46, `source-team` on #50, `provenance-closed` on #48.
[DECISION] Cross-team wiki-cross-references use GitHub URL form (not relative paths); compliance retrofit slow-organic, no big-bang sweep.
[GOTCHA] **Consecutive Edits in a single message invalidate each other's read-state.** Sequence Edits serially (one per turn). Folded into session 25 single-Edit-per-turn discipline that held cleanly through the n=5 amendment.
[LEARNED] Cross-pollination unit is the idea, not the file (rewrite-not-mirror); architectural-fact gotchas don't gain confidence from n+1 sightings (revision trigger = design change, not reports); organic reuse is the stronger Protocol C signal than wiki-citation reuse.

## Session 14 — 2026-04-16 (pruned — wiki queue evaluation, two integration-meta filings)

[CHECKPOINT] Wiki 43 → 45. #44 patterns/integration-not-relay (n=6+ unified meta-pattern, four-check + pre-fold + meta-trap), #45 patterns/substrate-invariant-mismatch (n=3 formal pattern: dual-team-dir + protocol-shapes + xireactor link-index).
[DECISION] Unified integration-not-relay entry, not three siblings — all same discipline viewed from different roles, mega-biblion economy.
[DECISION] **Wiki queue: 11 candidates at n=1, parked.** Watch for second instances. Queue list maintained in git history (this scratchpad's session 14 close); revisit when new evidence absorbs items.
[LEARNED] **Meta-trap insight (sharpest session feedback):** "you ran in circles" — applying discipline vocabulary to the wrong layer is a higher-order failure than the object-level failure. Fix is periodic "what new evidence would settle this" check, not applying discipline harder. Hard-coded into #44.
[LEARNED] Promotion threshold is stricter for pattern entries than merged-into-existing. Recursive n=1 (own amendment IS the instance) is weaker than "I observed another team do X."
[LEARNED] Named-pattern absorption is wiki-queue discipline. Filing one entry can absorb multiple queued candidates; track absorption-count not just filing-count to avoid re-filing later.

## Sessions 8-13 (pruned — key items carried forward above; details in git history)

[DECISION] Forward-only cross-ref convention (S12). Load-bearing.
[LEARNED] Git-blame is a load-bearing primitive for Librarian dispute handling — `git log -p wiki/<entry>.md` answers "did this used to say something different?" in seconds. DB substrate loses this.
[LEARNED] Scope vs ownership are orthogonal (scope = who reads, ownership = who maintains).
[LEARNED] Scope Restrictions as positive discipline — draft in writable surface, route to team-lead, preserve boundary. Prevents silent self-reshape.
[DEFERRED S11] Pass 2 filename rename for persist-project-state-leaks (7 back-refs, coordinated batch).
[WIP] structural-discipline cluster (6 members), identifier-to-persona (n=1), `[CLUSTER-OBSERVATION]` tag convention (Celes, not yet used). Note: contracts/ no longer empty as of session 24 (#56 first entry); findings/ still empty.

## Sessions 1-7 (pruned — key decisions retained)

[DECISION] Phase 2 activated session 6. Gap Tracking + Health Sensing active. Gate is one-way.
[DECISION] Protocol C first cycle complete session 6: Structural Change Discipline in common-prompt.
[PATTERN] Default-no-reply convention. Notification-of-fact messages need no ack.
[LEARNED] One data point is a gotcha; two is a pattern. Don't promote n=1.
[LEARNED] Sibling entries beat one-entry-with-two-variants when failure surfaces diverge.
[LEARNED] Batch submission: process one-at-a-time end-to-end, not interleaved.
[LEARNED] External intake requires explicit provenance frontmatter.
