---

# Volta scratchpad

[DECISION] 2026-03-13 18:00 — Wrote canonical startup/shutdown protocol into `topics/06-lifecycle.md`. Key design decisions:

- Startup is 6-phase: Sync → Clean → Create → Restore → Audit → Spawn
- Shutdown is 5-phase: Halt → Notify → Collect → Persist → Preserve
- Stale-team recovery IS the normal startup — no special recovery procedure needed (idempotent)
- Duplicate prevention must be a structural gate in spawn tooling, not in team lead memory
- Three spawning paths with clear decision tree: spawn_member.sh (RC/tmux), Agent tool (local), raw CLI (never)

[PATTERN] 2026-03-13 18:00 — Inbox preservation is the single most fragile lifecycle operation. TeamCreate requires empty dir but inboxes must survive. Framework improvement: TeamCreate should accept an --preserve-inboxes flag or handle this internally.

[LEARNED] 2026-03-13 18:00 — hr-devs is strictly more mature than rc-team: externalised startup doc, spawn_member.sh with duplicate gate, layout system. rc-team has startup inline in team-lead prompt with no built-in duplicate protection.

[DECISION] 2026-03-13 18:14 — Designed restart test plan at `docs/restart-test.md`. 5 success criteria groups (15 individual checks): self-orientation, startup execution, agent continuity, work product continuity, protocol correctness. SC-1 and SC-2 are must-pass; SC-3-5 are should-pass.

[CHECKPOINT] 2026-03-13 18:17 — Session complete. Both deliverables done: (1) canonical lifecycle protocol in `topics/06-lifecycle.md`, (2) restart test plan in `docs/restart-test.md`. No WIP. Clean shutdown.

[LEARNED] 2026-03-13 18:28 — Restart test field data from team-lead confirms: protocol is structurally correct but has 3 friction points. (1) Phase 2 lacks diagnostic preamble — team lead can't tell cold start from warm restart without extra investigation. (2) Task-list-snapshot placed in Shutdown Phase 4 (worst timing — lead is cognitively loaded, context near limit). (3) Local teams have no spawn automation — Agent tool lacks duplicate gate, prompt loading, and model selection.

[DECISION] 2026-03-13 18:33 — Wrote 3 amendments to topics/06-lifecycle.md based on restart test field data:

- Phase 2.0 Diagnose: classifies WARM RESTART / PARTIAL STATE / COLD START / MISCREATION before Clean
- Shutdown Phase 2a: task-list-snapshot moved from Phase 4 to Phase 2 (before agent shutdown, when lead has best task picture)
- Path 2.5 spawn_local.sh: local team spawn wrapper with duplicate gate + prompt assembly

[LEARNED] 2026-03-13 18:33 — Agent tool DOES support per-agent model selection via `model` parameter. Previous claim that it "ignores roster model" was wrong. Remaining local gaps: no duplicate gate, no prompt file loading.

[CHECKPOINT] 2026-03-13 18:35 — Session 2 complete. Deliverables: 3 amendments to topics/06-lifecycle.md (Phase 2.0 Diagnose, Shutdown 2a snapshot timing, Path 2.5 spawn_local.sh) + updated restart test plan. No WIP. Clean shutdown for second restart test.

[DECISION] 2026-03-13 18:51 — Restart test 3 analysis. Field report from team-lead's actual restart attempt revealed 5 gaps. Wrote 3 amendments to topics/06-lifecycle.md:

- Phase 0 Orient: new phase before Sync — read roster.json, common-prompt.md, scratchpad in fixed order. Eliminates expensive exploration.
- Phase 0 workDir Resolution: validate workDir from roster.json, fallback with WARNING, flag for correction if wrong.
- Phase 2.0 Anomaly Detection: COLD START on non-first session is anomalous — check git log for prior team commits, ask user if dir is unexpectedly missing.
- Also updated: Phase 2 precondition (references Phase 0+1), stale-team recovery table (Phase 0 included), resolved open questions (3 new), restart-test.md success criteria (SC-2 expanded from 5 to 8 checks).

[PATTERN] 2026-03-13 18:51 — Startup protocol now 7-phase: Orient → Sync → Clean → Create → Restore → Audit → Spawn. Phase 0 (Orient) is the cheapest phase (3 file reads) but prevents the most expensive failure (broad exploration). Design principle: front-load the cheapest checks to prevent the costliest failures.

[LEARNED] 2026-03-13 18:51 — Silent acceptance of anomalous state is a protocol failure. The difference between "expected absence" and "unexpected absence" is a single git log check. Protocol should force investigation, not leave it to team-lead judgment (which fails under time pressure).

[DECISION] 2026-03-13 18:55 — Created `startup.md` — the bootstrap file for team-lead self-orientation. Per PO feedback: startup.md is the FIRST file read, before roster.json. Contains: installation-specific paths, read-order checklist, diagnostic procedure, known gotchas. Updated Phase 0 in 06-lifecycle.md to reference startup.md as step 0a. Key design distinction: lifecycle doc = protocol (framework-level), startup.md = instance (team+machine-specific executable checklist).

[PATTERN] 2026-03-13 18:55 — Two-level startup design: protocol (topics/06-lifecycle.md) defines the phases and failure modes; instance (startup.md per team) provides the concrete paths and condensed procedures. A team-lead should never need to read the 700-line protocol doc to start a session.

[LEARNED] 2026-03-13 18:58 — Raw transcript data (73.5k tokens, 31 tool uses, 2m18s for Explore) is far more persuasive than narrative field reports. The transcript also revealed phase ordering was scrambled AND mislabeled — a failure mode not visible in the narrative report. Quantified costs belong in protocol docs to make the "why" concrete.

[DECISION] 2026-03-13 18:58 — Added "Phase Ordering is Mandatory" section to 06-lifecycle.md with exact transcript costs. Updated startup.md with strict checklist format: verify-after-each-step, "state the step name out loud" instruction. Two enforcement mechanisms: (1) protocol doc explains WHY ordering matters, (2) startup.md provides HOW to follow it mechanically.

[DECISION] 2026-03-13 19:04 — Created `docs/restart-scorecard.md`. Running document tracking restart quality across sessions. Design: append-only log (one entry per restart), severity-based scoring (CRITICAL/HIGH/MEDIUM/LOW → grade A-D), issue resolution tracking table, trend summary. Restarts 1 and 2 pre-populated from field data. Restart 3 stub ready for next session. Key insight: Restart 2 scored worse (D) than Restart 1 (C) because R1 had warm context — cold restarts expose more failure modes, which is expected.

[CHECKPOINT] 2026-03-13 19:04 — Session 3 complete. All deliverables: (1) 06-lifecycle.md amended with Phase 0, Anomaly Detection, Phase Ordering Enforcement; (2) startup.md created; (3) restart-test.md SC-2 expanded; (4) restart-scorecard.md created. Ready for shutdown and Restart 4 test.
