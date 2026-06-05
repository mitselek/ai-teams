# Celes — Scratchpad

## Summary (lines 1-15 — always read on startup)
- **Current state:** S42 (2026-06-05). **BOTH TASKS COMPLETE.** Task#1 (assess #4–#8 prompt improvements) DONE. Task#2 (#73 round-2 re-review, 9 steps) DONE through step 9 — reported to team-lead, awaiting Task#2-close confirmation.
- **Task#1 verdict:** all 5 personas SUBSTANTIALLY ADOPTED synergy+gates (Action-1). KEY FINDING: gap-reaction **Action 2 (file issue) was absent from ALL 5 prompts** (addendum was last issue comment). Resolved via PO Option-A: Action-2 delivered through round-2 DISPATCH brief; team-lead filing a follow-up Arhitecture issue to prompt-encode it. Report: `docs/2026-06-05-persona-improvement-assessment.md`.
- **Task#2 verdict: HYPOTHESIS CONFIRMED — prompt-encoded gates+synergy ≥ ad-hoc R1; guild-specialist consultancy role = SETUP-ONLY, not per-engagement.** Mechanism Option-A (team-lead spawned 5 fresh-context agents from merged prompts; I wrote briefs, scored, assembled). 5/5 APPROVE dispositions-correct; **D2 zero-fab 5/5 incl. both highest-risk lenses (regression test PASSED)**; both wired consensus signals reproduced from independent contexts + a THIRD UNWIRED pairing emerged (Booch⟷Leveson, FINDING-6 bounds Leveson HIGH); **Action-2 fired 4/4 live → Arhitecture #10/#11/#12/#13 all OPEN-verified**; D8 efficiency-not-skim (3 went deeper than R1). Caveats: 4.8-vs-4.6 substrate uncontrolled (directional verdict only, no precise quality-delta claim); peer-DM delivery lag/stall ("disk inbox ≠ delivery truth").
- **Step 8/9 DONE (PO-sanctioned):** posted round-2 panel comments to dev-toolkit PR#45 (issuecomment-4630259710) + PR#46 (issuecomment-4630260113) with FINDING-6⟷Leveson-HIGH cross + issue links + clean attribution; added round-2 rubric + collected reviews to the gist (a20d0be); updated topic 10 `10-guild-specialists.md` with S42 round-2 evidence section + unwired-pairing subsection + honest caveats (my `(*FR:Celes*)` section in Aen-authored doc).
- **Artifacts:** `docs/2026-06-05-{persona-improvement-assessment,round2-dispatch-briefs,round2-reviews-collected,round2-retro-rubric}.md`. Briefs doc carries the v2/v3 SPAWNED-VERSION NOTE (Wiki-115 doc-vs-substrate divergence in real time, closed by Phase-2b MCP re-verify, zero effect).
- **Mechanism = OPTION A (team-lead spawns 5 fresh bg agents: beck/bach/booch/leveson/anderson).** Each fetches own merged prompt via gh, reads ONLY prompt+brief+PR+its-R1-review (contamination guard: NO FR memory/docs/wiki). Action-2 LIVE (agent really files Arhitecture issues). Reviewers report finished review to ME (celes) via SendMessage; I assemble+post (step 8). 5 verbatim briefs HANDED to team-lead: `teams/framework-research/docs/2026-06-05-round2-dispatch-briefs.md`. **Substrate note for retro:** R2 on opus-4.8 (1-off, roster intent stays 4.6), R1 on 4.6-era — note as uncontrolled var, don't over-claim quality delta. Mechanism delta IS the treatment def, not a confound.
- **S42 durable learnings (Task#2 mechanics):** (a) **D6 headline — UNWIRED-pairing consensus emerges** (Booch⟷Leveson: structural lens caught a safety-axis hole it defers content on; stronger signal than reproducing wired pairings). (b) **PR files live on PR HEAD branch not master** while PRs open — `gh api .../contents/<f>?ref=<sha>`. (c) **SUBSTRATE: peer-DM (agent→celes) delivery lag/stall, high-variance; "disk inbox JSON ≠ delivery truth"** — recover by reading own inbox file; spawner↔agent vectors fine (worktree-spawn-asymmetry cluster). (d) **Doc-vs-substrate divergence (Wiki-115) can hit a running experiment** — spawn used v2 briefs, my v3 edit landed after; runner rule = NO mid-run supplement (splits instrument), log the delta; PO post-submission uniform addendum (Phase-2b) is the clean way to add a whitelist after all submitted. (e) **D8 — fast ≠ skim**; discriminate via ground-truth verification of the reviewer's own claims (I verified every [GAP] + filing + schema claim).
- **Active items (carry):** S41 retro NOW SCORED (Task#2 rubric). 3 candidate FR patterns from S41 still await PO wiki-grade ruling before Cal routing (below). Possible round-3 hypothesis parked: bonus-8 panel expansion (does a larger panel find more?) — deferred-by-design, not overlooked.
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

[FOR CAL QUEUE — S42 substrate, n=2 anomalies one run]: (1) peer-DM (agent→celes) delivery LAG/stall, high-variance (live channel ~4hr late; inbox-file copy earlier) → "disk inbox JSON ≠ delivery truth"; worktree-spawn-asymmetry cluster. (2) task-list STATE LOSS — TaskList returned empty for BOTH celes + team-lead mid-session (tasks #1/#2 vanished); different subsystem, same run. Both → Cal when he next spawns.

(*FR:Celes*)
