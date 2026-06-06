# Celes — Scratchpad

## Summary (lines 1-15 — always read on startup)
- **Current state:** S44 (2026-06-06) — **DESIGN LEAD, Entu consultant-agents spec (entu/api #42), Task #3. BOTH ARTIFACTS GATE-FINAL — awaiting PO review-gate verdict from team-lead (commit/post/edits/shutdown).** Deliverables (both DRAFT, `(*FR:Celes*)`, I do NOT touch external repos — team-lead posts): `docs/2026-06-06-entu-consultant-agents-architecture.md` (full spec) + `docs/2026-06-06-entu-42-proposal-comment.md` (#42 digest). Spec-only, productizes topic-10 guild. Inputs: Cal schema v2 (`wiki/contracts/entu-competency-index-schema.md`, #2) + Finn grounding (`docs/2026-06-06-entu-consultant-grounding-digest.md`, #1), both done. ALL 5 PO-review items DONE; all teammate threads converged & closed. Protocol-A pattern FILED `wiki/patterns/citation-backed-beats-posture-backed-when-fact-is-subtle.md` (cross-credit Celes/Cal/Finn; stage-2 PARTIAL after my read-back, confirms on Finn's).
- **Key durable decisions (this engagement):** (a) container = global index `agents/competency-index/<domain>/` one-claim-per-file; agent `competencies.yaml` = GENERATED search_claims(domain=) slice w/ `generated-from:` provenance header, NEVER hand-edited (fork breaks audit). (b) 5th container element = PERSONA ANCHOR: posture/voice NEVER facts (Anderson fab=cautionary case; method-over-domain-fame selection). (c) `_sharing` = TWO claims (create-time escalation-copy `utils/entity.js` src + post-creation-no-propagation docs/probe) — atomicity-forces-the-split IS the index-over-prompt argument. (d) gap-loop = 3-RUNG ladder PR/issue/escalate-to-Argo-apex; apex rung terminates disputed claims. (e) Cal schema: 4 evidence TYPES (docs/openapi/src/probe) ≠ 5 METHOD rungs (+live-audit +maintainer-authoritative); `stance` confirms/contradicts/supersedes → confidence DERIVED not asserted; code-beats-docs. (f) `[GOTCHA]` #42's `src/api/*` = entu/www DOCS not entu/api code (Nitro routes/+utils/); inheritParentProperties in `utils/entity.js`. **[LEARNED] My 2 cross-reads caught load-bearing issues (Cal-acked): slice-not-copy provenance hole + type-vs-method axis inconsistency — flag tensions in others' contracts, don't propagate or silently pick.**
- **S43 (2026-06-05):** **#74 COMPLETE & RATIFIED (PO approved D1–D6 all).** Item1a (Medici landed `[ORPHAN-CLAIM]` in `prompts/medici.md`); Item2 (topic-10 3-way-taxonomy subsection, team-lead-approved + struck resolved "marking your own homework" open Q).
- **NEXT-SESSION carry (task #8, owner=celes):** ONE bundled "post-#74 prompt-edits" batch per team-lead ruling — all LOW, none-blocking, all edits to OTHER agents' prompts (I propose diffs, team-lead applies): (1b) `kind:external` tags on external claims (finn.md Claude-Code-docs line + any sweep-flagged); (G1) brunel.md surface-back-on-missing-artifact mirror of Hopper case-1; (C2) aeneas.md bilateral work-hub wiring. Source: design doc D4 + Medici health-report G1/C2. [LEARNED] competency scan splits across owners: audit CATEGORY = auditor's (Medici); per-claim TAGS = authoring (others' prompt bodies) = mine-propose/lead-apply.
- **#74 deliverable:** `docs/2026-06-05-competency-gap-analysis.md` (Medici's evidence: `docs/health-report-competency-gap-2026-06-05.md`). Answers 3 PO Qs + D1–D6 list. NO prompt edits required.
- **#74 KEY ARC — my first-draft Q3 was WRONG, revised on Medici's evidence:** I bucketed 5 "claim-heavy" roles assuming they cite external authority. Medici's per-prompt sweep = **0 of 10 FR roles cite external authority; all 10 internally backed.** Anderson failure-MODE transfers, fabrication-SURFACE does not exist on FR. [LEARNED] don't bucket on an assumed property — wait for the audit data. Team-lead flagged the tension; I read Medici's report directly (peer-DM lag, found it as a docs file) and rewrote.
- **#74 final answers:** **Q1** "the audit IS the gate" — competency-gap detection = Medici's existing coherence audit (BACKED/STALE axis, no new machinery) PLUS one ADDITIVE orphan-claim sub-check (external-claim-w/-zero-backing axis, NEW to his checklist — different scan shape: absence-of-artifact, not consistency). [LEARNED] honesty: "Medici already runs this" = 90% true / 10% aspirational; D1 names the 10%-new commitment explicitly rather than burying it (Medici's own flag — he'd rather commit openly than over-claim). **Q2** NO new per-agent artifact class; claim→backing map = Medici's single owned baseline table, refreshed on roster change; frontmatter demoted to YAGNI-if-consumer-appears. **Q3 (CONVERGENT both-lens, Medici's orphan-claim formulation)** = whole-roster YAGNI on internal-knowledge axis + ONE proactive orphan-claim scan = (a) NEW named audit category **`[ORPHAN-CLAIM]`** in `prompts/medici.md` (his verbatim §6 text quoted in D3, HIS to land post-ratification, NOT pre-applied) + (b) `kind: external` tag on the handful of external claims (e.g. Finn's Claude-Code-docs line). NOT 5/5 split, NOT 5 frontmatter blocks. [LEARNED] Medici's call: orphan-claim is NOT a `[GAP]` sub-case — `[GAP]` = artifact-vs-need (thin artifact); orphan = absence-of-ANY-artifact on a claim → own named category (anchored on named-concepts-beat-phrases + greppable-tag-counts patterns). Footprint = 1 new category + a few tags.
- **#74 framework finding (§5, credit Medici):** **"competency gate = two mechanisms wearing one name"** → three-way taxonomy: **citation-backed** (review personas, needs runtime gate) / **substrate-backed** (Hopper/Brunel, needs substrate-truth-read — FR re-derived this independently as three-layer-substrate-truth) / **posture-backed** (most standing roles, needs periodic audit only). Promotes to topic 10 post-ratification per team-lead D6 ruling (standalone until then, don't pre-merge). G4: FR's competency-backend-staleness instance = frozen `reference/` snapshots, not external standards.
- **S42 CLOSED (in git + topic 10):** #73 round-2 re-review HYPOTHESIS CONFIRMED — prompt-encoded gates+synergy = SETUP-ONLY consultancy; 5/5 zero-fab incl. highest-risk lenses; UNWIRED Booch⟷Leveson pairing emerged; Action-2 fired 4/4 (Arhitecture #10-#13). Artifacts: `docs/2026-06-05-{persona-improvement-assessment,round2-dispatch-briefs,round2-reviews-collected,round2-retro-rubric}.md`. Topic 10 has S42 evidence section. Detail in git.
- **Active items (carry):** 3 candidate FR patterns from S41 still await PO wiki-grade ruling before Cal routing (below). Round-3 panel-expansion hypothesis parked (deferred-by-design).
- **Key decisions S41:** synergy map = 5-lens panel proven cluster (n=2); 6 task-type compositions, 3 overlaps, 3 gaps. Competency gates wire to arch-docs MCP `search_docs`/`get_doc` (NOT local `knowledge/<agent>/` — superseded by issue#2 MCP pattern); flag missing external source docs, never fabricate. #45 well-backed (ADR-012 accepted); #46 has real gaps (Leveson: EN50716 absent + SEC-12 Proposed; Anderson: NIS2/ISO-Annex-A/KüTS source absent + ADR-011 Proposed; Booch well-backed). `security_level` filter intentionally unwired — omitted NFR chapter ≠ gap yet.
- **Carry-forward:** all S35→S36 DEFERRED items still live (see Active deferred). Marquee retro signal = Leveson⟷Anderson `security_level` safety-vs-security conflation check (the one finding only synergy wiring can produce).

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `teams/framework-research/memory/celes.md` — NOT `memory/celes.md` at repo root.

---

## Session 41 — Arhitecture consultancy (2026-06-03→05) — DURABLE

[CHECKPOINT] 4 deliverables to team-lead, all as message text (Arhitecture = collaborator repo, mitselek account is **pull-only / push:false** — filed synergy map as **issue #3** instead of a PR after push 403'd): (1) 13-persona synergy map; (2) issue #3 created; (3) 5 re-engineered persona prompts; (4) step-4 retro rubric. Default branch is `master`.

[LEARNED] **Synergy lives in the work product, not the agents** (issue #3 headline). Of 13 Arhitecture personas only Ross Anderson is fully-wired (lore, Core Competencies, Review Methodology, explicit "Interaction with the Review Team", scratchpad+tags). The other 12 are generic single-lens prompts. Yet 2 coordinated multi-lens reviews shipped — so the 5-lens panel cluster is real in practice but encoded in ONLY 1 of 13 prompts. A team can ship coordinated multi-lens output while the coordination is unstated in N-1 prompts; the cluster is fragile until prompt-encoded. **Candidate FR pattern — awaiting PO wiki-grade ruling before Cal.**

[LEARNED] **Stage-disambiguation resolves apparent role overlap.** security-auditor and Ross Anderson both "own security" but split by pipeline stage: security-auditor = code-level/OWASP/exploit (REVIEW); Anderson = design-level/regulatory/NIS2/threat-model (PLANNING/principle-review). Two agents on the same domain aren't redundant if split by stage — using both on the SAME review is. **Candidate FR pattern — awaiting PO ruling.**

[LEARNED] **Roster gaps mirror artifact gaps.** The persona set's blind spots (run-time/perf/observability — no owning lens) matched the reviewed principle set's blind spots (the 05-31 review's net: change-time discipline strong, run-time thin). A roster audit can predict deliverable blind spots. **Candidate FR pattern — awaiting PO ruling.**

[LEARNED] **Competency-gate gold-standard shape** (from Anderson gist + issue#2): 3 blocks — (a) Competency Gates HARD RULE: query MCP for repo-internal backing, cite real docs by ID, flag `[GAP]` for missing *external* source docs, never fabricate, say "Proposed" for un-ratified ADRs; (b) Synergy/Interaction scoped to THIS task naming who-pairs-with-whom + the productive overlap + consensus mechanism; (c) Review focus = what to look for in the specific artifact. Add a grep-able `[GAP]` tag so a retro can count whether gates fired. Watch BOTH failure directions: fabrication AND over-flagging (a gate that cries gap on everything is as useless as one that fabricates).

[LEARNED] **MCP supersedes local knowledge-dirs for repo-internal docs.** Anderson's original gist said `knowledge/anderson/` local checkout; issue#2 established the arch-docs MCP (`search_docs`/`get_doc`, 500 docs) as the access pattern. Re-engineering must repoint competency gates to MCP; only genuinely-external source docs (NIS2 text, EN50716, ISO Annex A, KüTS, GDPR) stay "on-disk-or-flag-it."

---

## Active deferred (carry-forward — pre-S41, still live)

[DEFERRED] **Brunel-side parallel amendment to `prompts/brunel.md` §Diagnostic Discipline** (lines 123-129, Layer-1-only gap, same as Hopper pre-Amendment-4). Aen QUEUED 2026-05-25 — separate Celes-dispatch when ready. Pattern: Brunel author-of-record, me cross-author, Hopper cross-reviewer. Standing watch.

[DEFERRED] **Hopper-Amendment-5 (Layer-0-library-first)** — Hopper-surfaced 2026-05-25 from task#6 arc; pending task#6 verification PASS + catalyzing incident. Surface if Aen/Hopper route a future amendment-pass.

[DEFERRED — Cal queue, Aen-routed] (1) Batched-iterate-on-multi-reviewer discipline; (2) Producer-side-staleness pattern; (3) wiki refresh at `wiki/patterns/three-layer-substrate-truth-discipline.md` lines 77+167+201 (stale post-Amendment-4). Aen surfaces to Cal; not for me to file directly.

[DEFERRED] Path-convention substrate for mvox-dev (`~/projects/entu-research/`, `~/workspace/...`) — held pending PO ruling on Medici's twin Flag (S33+). Mine + Medici's + Pérotin's L127-130 + 4 other prompts + 3 memory files + startup.md all move together when PO rules.

[DEFERRED] Comenius prompt design improvements (escalation subsection + items 2-6 from S33+) — opinion only, PO discretion.

[DEFERRED — pre-S35] Brief-scope-conflation pattern (S32 Cal queue): NEW failure-mode entry, not yet submitted.

[DEFERRED] All-opus burn-rate posture for esl-legal — PO may downshift specialists to sonnet on dormant re-spawns. Flag for case#2.

[DEFERRED — Aen prompt latent gap] `prompts/aeneas.md:43` restricts Edit/Write to `memory/`+roster but team-lead routinely edits prompts. Non-urgent; needs design round (distinctive FORBIDDEN/ALLOWED structure), not a simple MAY WRITE addition.

---

## Standing Decisions / Patterns (durable)

[DECISION] Single-provider for governance/coordination/XP pipeline roles. Multi-provider only for (1) capability gaps (vision) and (2) fire-and-forget mechanical roles (Eilama-class).

[PATTERN] **Pass 1 / Pass 2 rename separation.** Pass 1 = prose ships immediately; Pass 2 = machine identifiers ship as coordinated batch with all consumers. Default prose-only Pass 1. Cal-filed `wiki/patterns/pass1-pass2-rename-separation.md`.
[PATTERN] **Within-document rename grep discipline.** Grep ALL references, re-grep after edit, zero hits the only acceptable result. Cal-filed (cross-credited).
[PATTERN] **Protocol shapes are typed contracts, not prose.** Cross-read producer + consumer specs before merging a protocol change. Brunel-filed.
[PATTERN] **Scope-block drift from practice.** Cross-read MAY WRITE against prompt body + accepted artifacts. Scope block written LAST; every path in body must appear in MAY READ/WRITE. Cal-filed `scope-block-drift-from-practice.md` (n=3).
[PATTERN] **Dual-team-dir ambiguity** — `teams/<team>/` in both `$HOME/.claude/` (ephemeral) and `$REPO/.claude/` (durable). Anchor bare paths. Cal-filed; Path Convention section in cross-dir prompts.
[PATTERN] **Cross-read gate pays compound interest.** Reviewer catches structural bugs the author can't see. Apply at protocol-shape, design, and prompt-amendment time.
[PATTERN] **Convergent independent design = strong adopt signal.** Two specialists converging from different routes > either alone.
[PATTERN] **Throttling vs delegation distinction.** Don't decline to surface; but delegating through someone whose workflow fits better is fine.
[PATTERN] **Named concepts beat descriptive phrases.** Coin a name, define once, reuse.
[PATTERN] **Active dual-sourcing defense.** Same content in common-prompt + per-role prompt is intentional (specialists never read each other's prompts); coordinated 2-file edits cheaper than silent drift.
[PATTERN] **Brilliant-first / toolkit-first context-read ladder.** Query Brilliant for context before opinion; read a toolkit's README+prompt+sample-output before extending it.
[PATTERN] **Lore-fit: structural beats thematic.** Structural fit (Pérotin atop Léonin) produces behavioral payoff; thematic fit leaves role energy unclaimed.
[PATTERN] **Sonnet-fit calibration.** Downgrade only when judgment calls are clear-criteria AND escalation paths crystal.
[PATTERN] **Promotion as label vs behavioral change.** Scan for contradictions with prior status + missing "between dispatched work" framing.
[PATTERN] **Naming heuristic — domain-named-tradition over language-tiebreak when domain has one.** Cal-submitted (esl-suvekool + esl-legal).
[PATTERN] Team archetypes: Research / Development / Hybrid (+ candidates: Operational [esl-suvekool], Adversarial-Research [esl-legal red-team `[ADVERSARY-FLAG]`], Long-lived-per-domain-research-support [esl-legal, case-driven, dormant between cases]).
[PATTERN] **Cross-team author attribution edge case.** Files authored by another team's member keep original trailer unless substantially rewritten; cross-check host CLAUDE.md.
[PATTERN] Model tier driven by **consequence of error**, not complexity. Opus when no automated quality gate; sonnet when tests catch errors.
[PATTERN] Data flow (pipeline vs independent-output) determines isolation. Pipeline → trunk + directory ownership. Independent → branch/worktree safe.
[PATTERN] "Agent PO" is anti-pattern — PO is always human; agent = "Requirements Analyst" with explicit escalation rules.
[PATTERN] Staging for cross-FR-team drafts = FR repo root `designs/new/<team-slug>/`; internal-to-FR stays under `teams/framework-research/`.
[PATTERN] Inbox files created at registration, not lazily. **Spawn-order: spawn-by-message-direction trumps spawn-by-data-dependency.** Service roles (Librarian, team-lead) spawn first.
[PATTERN] **"Why this section exists" documentation** — name the incident in the section so future readers don't delete it as redundant.
[PATTERN] **"Credit the gate, not the gate-runner"** (Brunel) — design good gates, trust them, don't rely on heroism.
[PATTERN] **Convention adopted before Phase 2 = retroactive telemetry.** Adopt structured markers early even when telemetry isn't active.
[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure. Real incidents drive design. `spawn_member.sh` > Agent tool for model-tier correctness. Coordination boundary tables for adjacent-domain agents.

[GOTCHA] **Arhitecture repo (Eesti-Raudtee) = pull-only for mitselek account** (push:false). Can't open PRs by push; use issue route or hand patch to a write-capable account. Default branch `master`. arch-docs MCP indexes 500 docs (`search_docs`/`get_doc`/`list_index`).
[GOTCHA] Count **characters**, not roles-plus-characters. Team-lead IS one of the characters.
[GOTCHA] `TeamCreate`/`TeamDelete` are first-class harness tools, bare names — NOT `mcp__teamwork__*`.
[GOTCHA] Read-side git perms (`log`/`diff`/`status`) for curator/librarian/cross-session roles by default.
[GOTCHA] Inbox persistence repo-side from day 1 (Volta pattern, TEAM_NAME hardcoded for single-team repos).
[GOTCHA] Long-lived team prompts must be case-agnostic; case paths in `cases/<slug>/README.md`. Only roster.json + README may name the first case.
[GOTCHA] When two specialists co-own a question, the file boundary must be in design-spec AND both prompts.
[GOTCHA] Dropping a role updates TWO files: `roster.json` AND `common-prompt.md` members list.
[GOTCHA] Brilliant `session_init` + broad `search_entries` overflow output limit. Use `logical_path` filters + tight queries.

---

## Hires + earlier-session detail — in git history
61 agents / 13 teams cumulative; latest Hopper (FR Deploy Op, 2026-05-20 `25094d1`); no new hires S35-S42 (amendment + consultancy work). FR S29-S41 detail (Hopper-Amendment-4 S35, esl-suvekool/esl-legal deploys, mvox-dev audit, S41 Arhitecture consultancy) in git log. Durable patterns folded into Standing Decisions above.

[FOR CAL QUEUE — substrate anomalies, BOTH REPRODUCED S42 + S43]: (1) peer-DM (agent→celes) delivery LAG/stall, high-variance → "disk inbox JSON ≠ delivery truth"; worktree-spawn-asymmetry cluster. S43 repro: Medici's coordination DM (proposing labor split) arrived AFTER I'd already found his report on disk and built the design around it — recovered by reading the docs file, not waiting for the DM. (2) task-list STATE LOSS — S42: TaskList empty for both celes+team-lead mid-session. S43 repro: my 4 completed tasks vanished (TaskList "No tasks found"); a STALE task-assignment notification for #1 replayed AFTER completion. Recovery rule: don't recreate tasks on empty TaskList — verify deliverable on disk instead (the work was done + reported). Both anomalies now n≥2 across sessions → Cal when he next spawns.

(*FR:Celes*)
