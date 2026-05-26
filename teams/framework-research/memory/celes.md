# Celes — Scratchpad

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `teams/framework-research/memory/celes.md` — NOT `memory/celes.md` at repo root.

---

## Session 35 — Hopper-Amendment-4 (2026-05-25 → 2026-05-26 shutdown)

[CHECKPOINT] Amendment-4 (three-layer Diagnostic Discipline) landed on `prompts/hopper.md` lines 130-211 in single coordinated Edit at 14:50 on 2026-05-25. Joint-review pass: Hopper conditional-clean with 3 calibrations (Option A line-126 cross-link, audit-template tied to §Graceful Degradation cases by number, first-dispatch front-loaded-within-pre-execution-phase wording); Brunel approve-with-2-optional-tightens (recreate-as-drift-resolution-event framing, Layer-2+3 fallback when L1 absent). All 5 folded into one batched edit per Pass 1 prose-only discipline. Brunel's cross-substrate-class forward-reference declined to preserve surgical-scope (lands separately as Cal queue E1 wiki extension). Aen close-out accepted 2026-05-25 13:32; Hopper + Brunel landing-confirmations received clean. Shutdown request 2026-05-26 10:39.

[LEARNED — STRONG] **Batched-iterate-on-multi-reviewer discipline.** When routing a prompt amendment past two joint authors in parallel, HOLD the iterate until both responses return rather than firing per-reviewer edits. Reasons: (i) Pass 1 prose-only structural-change-discipline gate calls for one coordinated batch, not multiple drips; (ii) reviewer-A's calibration may interact with reviewer-B's — folding A first might force B-rework when B's edit arrives; (iii) producer-consumer field-set-lock between wiki entry and prompt depends on single-pass consistency. Cost of holding: small latency (minutes-to-days). Cost of per-reviewer iterate: producer-consumer relock between passes. Asymmetric: hold-wins. Aen surfaced this for Cal as wiki-grade candidate (Pass-1-prose-only-batched-iterate-discipline).

[LEARNED — STRONG] **Surgical-scope claim is itself load-bearing structural property.** Aen explicitly framed Amendment-4 as "surgical amendment, not full rewrite." When Hopper offered Option A (low-touch supersession-line) vs Option B (also-edit-line-126), my call to take Option A was correct — Option B would have broken the surgical-scope claim and forced a scope-expand flag to Aen. Brunel made the same call by declining his own forward-reference suggestion ("preserve surgical-scope"). Pattern: when the surgeon offers two paths, the more-surgical one preserves the contract with the dispatcher.

[LEARNED] **Producer/consumer field-set-lock creates stale-back-reference burden on producer.** The amendment cross-LINKS the canonical wiki entry rather than re-deriving the three-layer model. This produces field-set lock: prompt is consumer, wiki is producer, both reference the same definitions. ALSO produces post-amendment staleness on the producer side: wiki lines 77 + 167 + 201 still describe Hopper's prompt as "Layer 1 only" — now stale post-Amendment-4. **Three-party-independent-surfacing signal:** Celes surfaced in close-out, Aen surfaced in 13:32 accept message, Brunel surfaced in landing-confirmation — three independent surfacings of the same producer-side text drift = strong signal staleness is structurally inevitable when amending cross-link-target, not Celes-specific oversight. Cal-routed; Aen surfaced as wiki-grade candidate (companion to batched-iterate).

[LEARNED — Aen-named] **Recursive-discipline-stress-test closure-loop.** Hopper's author-of-record sign-off included observation that the discipline she just signed off on documents the posture she's currently in (mid-arc on task #6 apex DEV db tunnels). Amendment stress-tested against live operational case in same window it shipped — real-world n=1 validation, not retrospective. Pattern shape: when amendment lands during active dispatch arc by the author-of-record, the arc itself becomes the first verification surface. Pattern title: "amendment-shipped-mid-operation = built-in stress-test surface."

[LEARNED] **Date-perception calibration on multi-day Phase windows.** Brunel's response surfaced 3-day delay from S35 start (2026-05-22) to landing (2026-05-25). My session-internal time-perception had collapsed elapsed time. Corrective: when joint-review messages reference "X days ago", treat as substrate-truth over my own elapsed-time estimate.

[CHECKPOINT — Hires Delivered cumulative] No new hires this session. Phase B is amendment work, not hiring. Cumulative still **61 agents across 13 teams** (last update post-Hopper deployment 2026-05-20).

[CHECKPOINT] Aen approved archival of `designs/new/hopper-amendment-4/` after this session's commit — staged draft serves as audit trail of the joint-review pass. Aen's commit handles housekeeping; not for me to delete proactively.

---

## Active deferred (carry-forward to S36)

[DEFERRED] **Brunel-side parallel amendment to `prompts/brunel.md` §Diagnostic Discipline — Read Your Own Deployed Artifacts** (lines 123-129, Layer-1-only same gap as Hopper had pre-Amendment-4). Aen QUEUED at 2026-05-25 13:32 — separate Celes-dispatch when ready, not S35. Joint-review pattern: Brunel author-of-record (his own prompt); me as cross-author; Hopper as cross-reviewer for symmetry. Same surgical-scope discipline shape as Amendment-4. **S36 standing watch.**

[DEFERRED] **Hopper-Amendment-5 candidate (Layer-0-library-first discipline)** — surfaced by Hopper 11:12 on 2026-05-25 from task #6 (apex DEV db tunnels) dispatch arc. Filed by Hopper as separate-amendment-pass candidate per our batched-iterate compact; pending task #6 verification PASS + catalyzing-incident materialization. Track in next-session reorientation; surface if Aen or Hopper routes a future amendment-pass after task #6 closes.

[DEFERRED — Cal queue, surfaced by Aen] Two of my S35 [LEARNED] entries elevated to Cal-grade wiki candidates per Aen 13:32: (1) Batched-iterate-on-multi-reviewer discipline; (2) Producer-side-staleness pattern (when amending a consumer, check the producer for back-references). Aen surfaces to Cal at her next spawn; not for me to file directly.

[DEFERRED — Cal queue] Wiki refresh at `wiki/patterns/three-layer-substrate-truth-discipline.md` lines 77 + 167 + 201 (post-amendment producer-side back-references now stale). Aen routed; Cal batches with C1+E1 queue.

[DEFERRED] Path-convention substrate question for mvox-dev (`~/projects/entu-research/`, `~/workspace/...`) held pending PO ruling on Medici's twin Flag (S33+). Mine and Medici's prompt/memory-side edits both wait on same root cause.

[DEFERRED] Comenius prompt design improvements (item 1: escalation subsection; items 2-6 from S33+ 13:23 opinion) — not requested as edits last session, just opinion. PO may pick them up later.

[DEFERRED — pre-S35 carry-forward] Brief-scope-conflation pattern (S32 Cal queue): NEW failure mode entry — not submitted yet, carry into next.

[DEFERRED] All-opus burn-rate posture for esl-legal. PO may want to downshift specialists to sonnet on dormant-between-cases re-spawns. Flag for case #2.

[DEFERRED — Aen prompt latent gap] `prompts/aeneas.md:43` restricts `Edit/Write` to `memory/` + roster, but team-lead routinely edits prompts. Non-urgent per Aen's own message — queue for post-session prompt-revision pass. Not a simple MAY WRITE addition; Aen's prompt has distinctive FORBIDDEN/ALLOWED structure and fix needs design round.

[DEFERRED] Pérotin's `~/workspace/...` startup paths (L127-130 mvox-dev) NOT touched in S33+ per Aen's explicit hold. When PO rules on the path convention, those 4 lines + 4 other prompts + 3 memory files + startup.md all move together.

---

## Standing Decisions / Patterns (durable)

[DECISION] Single-provider for governance/coordination/XP pipeline roles. Multi-provider only for (1) capability gaps (vision) and (2) fire-and-forget mechanical roles (Eilama-class).

[PATTERN] **Pass 1 / Pass 2 separation discipline** for terminology renames. Pass 1 = prose/documentation language ships immediately. Pass 2 = machine identifiers (filenames, frontmatter values, agentType, TS literals) ship as coordinated batch with all consumers updated together. Default to **prose-only Pass 1** unless explicitly told otherwise. Cal-filed at `wiki/patterns/pass1-pass2-rename-separation.md`.

[PATTERN] **Within-document rename grep discipline.** When renaming a field/identifier, grep ALL references not just declaration site; re-grep after edit; zero hits is only acceptable result. Cal-filed at `wiki/patterns/within-document-rename-grep-discipline.md` (cross-credited).

[PATTERN] **Protocol shapes are typed contracts, not prose.** A terse field-omitting form produces silent breakage at downstream behaviors. Cross-read producer-side and consumer-side specs before merging any protocol change. Brunel-filed.

[PATTERN] **Scope-block drift from practice.** Detect via cross-read MAY WRITE against (a) prompt's own body instructions and (b) accepted artifacts by that agent. Scope block is written LAST in any new prompt; every path referenced in body must appear in MAY READ/MAY WRITE. Cal-filed at `wiki/patterns/scope-block-drift-from-practice.md` (n=3).

[PATTERN] **Dual-team-dir ambiguity** — `teams/<team>/` exists in both `$HOME/.claude/` (ephemeral runtime, TeamCreate-managed) and `$REPO/.claude/` (durable). Bare relative paths must be anchored. Cal-filed at `wiki/gotchas/dual-team-dir-ambiguity.md`. Path Convention section in every prompt with cross-dir paths.

[PATTERN] **Cross-read gate discipline pays compound interest.** Reviewer catches structural bugs the author cannot see because they wrote the structure. Apply at protocol-shape time, design-time, and prompt-amendment time alike.

[PATTERN] **Convergent independent design = strong adopt signal.** When two specialists converge from different routes, evidence is stronger than either alone. Adopt without hesitation.

[PATTERN] **Throttling vs delegation distinction.** "Don't preemptively self-throttle" means don't decline to surface; it does NOT mean "always submit yourself, never let others surface on your behalf." Delegating through someone whose workflow fits better is fine.

[PATTERN] **Named concepts beat descriptive phrases.** When describing a concept with multi-word phrase more than once, coin a name, define it once, use it thereafter. Citable, reusable, harder to misremember.

[PATTERN] **Active dual-sourcing defense.** Same content in two places (per-team common-prompt + per-role prompt) is intentional, not a DRY violation — specialists never read each other's prompts; coordinated 2-file edits are cheaper than silent drift. Defend when challenged.

[PATTERN] **Brilliant-first / toolkit-first context-read ladder.** When designing teams that touch external orgs/people/projects, query Brilliant for context BEFORE forming opinion. When a role's scope claim says "extends existing toolkit X," READ the toolkit's README + active prompt + sample output BEFORE drafting.

[PATTERN] **Lore-fit: thematic vs structural.** Structural fit (Pérotin=layered organum atop Léonin's chant) produces behavioral payoff. Thematic fit (Comenius=multilingual education) produces competent prompts but leaves role's energy unclaimed.

[PATTERN] **Sonnet-fit calibration.** Model-tier rightness = (a) judgment-load shape + (b) escalation-path articulation. Downgrade to Sonnet only when judgment calls are clear-criteria AND escalation paths are crystal.

[PATTERN] **Promotion as label vs promotion as behavioral change.** Scan for contradictions with prior status; scan for missing "between dispatched work" framing; only when both are clean does the promotion mean something behavioral.

[PATTERN] **Naming-heuristic — domain-named-tradition over language-tiebreak when domain has one.** Cal-submitted from esl-suvekool (Estonian musical figures, language ruled) + esl-legal (Roman jurists, domain ruled).

[PATTERN] **Long-lived per-domain research support unit** archetype (esl-legal). Case-driven activation, domain-specific knowledge accumulation, dormant between cases. n=1 watch; promotion trigger n=2 from different domain.

[PATTERN] **Operational team archetype** (esl-suvekool). Persistent roster, episodic sessions, deliverables are drafts-for-PO-to-send. No `tdd-pipeline.md`. n=1; promote on n=2.

[PATTERN] **Adversarial research team archetype** (esl-legal). Built-in red-team specialist who STEALS the case against the team's defense. `[ADVERSARY-FLAG]` annotations must be addressed by Editor before delivery. Distinct from Cathedral-lite PURPLE which audits the build.

[PATTERN] **Cross-team author attribution edge case.** Files originally authored by another team's member keep the original trailer (`(*FR:Celes*)`) unless substantially rewritten. Cross-check host project's CLAUDE.md before flagging attribution surfaces for ruling.

[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure. Real incidents drive design.
[PATTERN] `spawn_member.sh` > Agent tool for model-tier correctness.
[PATTERN] Coordination boundary tables (section ownership + handshake protocol) for agents sharing adjacent domains.
[PATTERN] Model tier driven by **consequence of error**, not task complexity. Opus when no automated quality gate; sonnet when tests catch errors.
[PATTERN] Three team archetypes: Research, Development, Hybrid (+ Operational, Adversarial-Research, Long-lived-per-domain-research-support as candidates).
[PATTERN] Data flow architecture (pipeline vs independent-output) determines isolation model. Pipeline → trunk + directory ownership. Independent → branch/worktree safe.
[PATTERN] "Agent PO" is anti-pattern — PO is always human. Agent should be "Requirements Analyst" with explicit escalation rules.
[PATTERN] Staging area for cross-FR-team drafts is FR repo root `designs/new/<team-slug>/`, not under `teams/framework-research/`. When designing internal-to-FR artifacts, stay under `teams/framework-research/`.
[PATTERN] Inbox files created at registration, not lazily. Lost-message-has-no-recovery if a sender tries to message a destination before the destination's `<name>.json` inbox file exists. **Spawn-order rule: spawn-by-message-direction trumps spawn-by-data-dependency.** Service roles (Librarian, team-lead) spawn first.
[PATTERN] **"Why this section exists" documentation.** When a prompt section exists because of a specific incident, name the incident in the section itself. Prevents future readers from deleting as "looks redundant."
[PATTERN] **"Credit the gate, not the gate-runner"** (Brunel framing). Design good gates and trust them rather than relying on individual heroism.
[PATTERN] **Convention adopted before Phase 2 = retroactive telemetry.** Any structured marker (frontmatter, tags, message prefixes, bracket tags) adopted consistently before Phase 2 activation builds passive data substrate. Build telemetry-shaped conventions early even when telemetry isn't active.

[GOTCHA] Count **characters**, not roles-plus-characters. Team-lead IS one of the characters.
[GOTCHA] `TeamCreate`/`TeamDelete` are first-class harness tools, bare names — NOT `mcp__teamwork__*`. Grep existing canonical startup.md drafts before writing the section.
[GOTCHA] Read-side git permissions for curator/librarian/cross-session-aware roles — `log`, `diff`, `status` by default.
[GOTCHA] Inbox persistence belongs repo-side from day 1 (FR Volta pattern verbatim with TEAM_NAME hardcoded for single-team repos; scripts at repo root).
[GOTCHA] Long-lived team prompts must be case-agnostic; case paths live in `cases/<slug>/README.md`. Audit team-config for hardcoded case identifiers when designing a long-lived team; only `roster.json` and `README.md` may reference first case by name.
[GOTCHA] When two specialists co-own a question, the file boundary must be in design-spec AND both prompts.
[GOTCHA] Dropping a role requires updating TWO files: `roster.json` AND `common-prompt.md` members list. Easy to miss the second.
[GOTCHA] Brilliant `session_init` and broad `search_entries` overflow output limit. Use `logical_path` filters and tight queries; read overflow via grep/sed.

---

## Hires Delivered (cumulative — 61 agents across 13 teams)

Full table + per-team session detail in git history. Latest: Hopper (FR Deployment Operator, 2026-05-20 commit `25094d1`).

---

## Earlier session detail — in git history

Detailed session logs for FR S29-S34, Eratosthenes deployment (2026-04-13), apex-research Librarian replication, esl-suvekool deployment (2026-05-01), esl-legal deployment (2026-05-13), mvox-dev prompt audit (2026-05-20), Hopper design + deployment (2026-05-19→20) are in git history of this file. The durable patterns from those sessions are folded into the Standing Decisions / Patterns section above.

(*FR:Celes*)
