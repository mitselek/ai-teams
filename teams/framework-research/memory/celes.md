# Celes -- Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state (S72 CLOSED, 2026-09-03):** paunvere work, three deliverables, all committed by Aen. (1) **Prompt-layer health check** `docs/paunvere-prompt-health-2026-09-03.md` -- verdict healthy-with-fixes, 9 fix-now + 7 watch. (2) **Amendment note** `docs/paunvere-amendment-note-2026-09-03.md`. (3) **A1 SHIPPED** into `designs/deployed/joosep/teams/paunvere/`: new `AMENDMENTS.md` (38 lines) + `startup.md` patched 3 places (amendment stamp after the read-first line; `AMENDMENTS.md` as read-order item 2, 3-6 renumbered; CLI pin -> "2.1.178 or later"). LF verified by CR scan. md5: AMENDMENTS `4360afc2`, startup `e29fe123`->`97583e36`; amended trio untouched at README `36455e70` / common-prompt `5adad74f` / saxby `01114426`.
- **Active items:** none open. A2 is queued, not started.
- **Key decisions this session:** (a) **Withdrawn-gate drift is the headline defect** -- PO's `929ba8a` (08-31 13:22) postdates the image build (11:07) and TEAM_ROOT seed (11:14) by 2h08m, so the container ran the pre-amendment rule and Minot spent 09-03 enforcing it (declined Joosep 3x, declined the PO's own reply as probable social engineering, emailed Ruth.Tyrk directly, cleared 4 tests on her 09:56 yes). Note owns OUR slip; conduct affirmed correct against the text held; Ruth's clearance stands; no re-litigation. (b) **Amendment stamp `A<n>` anchored to the scratchpad summary header** -- the one artifact the agent already reads first and already rewrites at each checkpoint, so the freshness check is free. (c) Delivery is a hand-applied `diff -r`, never a rebuild (see GOTCHA below). (d) English for the note per common-prompt:80, with the Joosep one-liner supplied in Estonian.
- **Carry-forward:**
  - **A2 = my 8 remaining fix-now items**, to ride AFTER Minot's A1 health read (do not bundle; the note already promises A2). Full text with file:line and proposed wording in `docs/paunvere-prompt-health-2026-09-03.md`: saxby:46 self-contradiction; Ruth-gate stale in 6 sites; **no permission-wall procedure anywhere** (the `## When you hit a wall` section -- highest value); `FIRST-TASKS.md` still says `vedur` x4; trevithick resp.3 forbidden-but-required; rail enumerated lexically so a new send-path file clears the trigger list; specialists told to "wait" hold background agents on Joosep's licence; shutdown-only TEAM_ROOT commit. Plus 7 watch items.
  - **Three Protocol C candidates** for Cal, incl. the `hopper.md` tier taxonomy (per Aen S72 close).
  - **Finn: 2 items owed.**
  - Pre-S41 deferreds below still live; S66 Cal-queue patterns (read-the-rail-at-source; credential-ladder-matches-first-task) still scratchpad-only, not Protocol-A filed.
- **[GOTCHA] A rebuild does NOT deliver a prompt amendment on the joosep substrate.** `SRC == STAMP` and `DST != SRC` (Step 9c `git init` inside TEAM_DST puts DST off STAMP from boot 2 onward), so the auto-re-seed branch is unreachable by construction. Delivery = hand-applied `diff -r` + Joosep told beforehand. Measured by Hopper, ops-log `2026-09-03T13:24`.
- **[PATTERN -- Cal queue, S72]** **Withdrawn-gate drift:** when a PO withdraws an authority gate, grep the gate-HOLDER'S NAME across prompts + roster, not the gate's wording -- 5 of 6 stale sites named Ruth without repeating the withdrawn phrase.
- **[PATTERN -- Cal queue, S72]** **Amendment-level stamp anchored to an artifact the agent already reads and already rewrites** beats a changelog nobody is obliged to open.
- **Prior:** S67 `paunvere` design FINAL (6 members, railway-pioneer lore; detail in `designs/deployed/joosep/teams/paunvere/README.md`); S63 Passepartout, the PO's private-life PA, solo project not team, RATIFIED at `designs/deployed/passepartout/`; S60 po-team live on sagres; S44 Entu consultants; S43 competency-gap taxonomy; S41-S42 Arhitecture consultancy. All in git.

[LEARNED S60] Cite-don't-restate for cross-owned contracts: point at the durable section anchor, match the pen-holder's wording.
[GOTCHA] Scratchpad path is `teams/framework-research/memory/celes.md` -- NOT `memory/celes.md` at repo root.

---

## Session 66 -- paunvere commission (2026-08-28)  [S41 and earlier PRUNED to git + topic 10; GOTCHA: Arhitecture repo pull-only, branch `master`, arch-docs MCP 500 docs]

[DECISION] 7 -> 6: fixture-warden folded into reviewer (Saxby spawns with every builder -- the rail gets a member who is always there); hygienist into cartographer. Scribe kept separate for the read-wide/write-narrow property (one auditable Atlassian-writing prompt). No librarian (extension path). Weighting 3:1:2 by register, recency-led.
[PATTERN -- Cal queue] **Read the rail at source before encoding it.** Commission rule text paraphrased a mechanism ("endpoint never configurable") that the code contradicts (`SK_ENDPOINT` env + substring guard); brief had already caught the same class on `isTest`. Rule: safety text in a prompt cites file:line of the as-built guard, never the decision's paraphrase.
[PATTERN -- Cal queue] **Credential ladder must match the first task.** Read-only PAT + "branch + PR only" = cannot push; resolve by sequencing (read-only task first, first write = first named widening), not by widening task 1.
[GOTCHA] Rastrick cannot run Nightwatch in the container (needs shared `.env`, Chrome, Azure-AD reach) -- "keeper who does not run" is the honest role shape; say so in the prompt or the agent will hunt for credentials.


---

## Active deferred (carry-forward -- pre-S41, still live)

[DEFERRED] **Brunel-side parallel amendment to `prompts/brunel.md` §Diagnostic Discipline** (lines 123-129, Layer-1-only gap, same as Hopper pre-Amendment-4). Aen QUEUED 2026-05-25 -- separate Celes-dispatch when ready. Pattern: Brunel author-of-record, me cross-author, Hopper cross-reviewer. Standing watch.

[DEFERRED] **Hopper-Amendment-5 (Layer-0-library-first)** -- Hopper-surfaced 2026-05-25 from task#6 arc; pending task#6 verification PASS + catalyzing incident. Surface if Aen/Hopper route a future amendment-pass.

[DEFERRED -- Cal queue, Aen-routed] (1) Batched-iterate-on-multi-reviewer discipline; (2) Producer-side-staleness pattern; (3) wiki refresh at `wiki/patterns/three-layer-substrate-truth-discipline.md` lines 77+167+201 (stale post-Amendment-4). Aen surfaces to Cal; not for me to file directly.

[DEFERRED] Path-convention substrate for mvox-dev (`~/projects/entu-research/`, `~/workspace/...`) -- held pending PO ruling on Medici's twin Flag (S33+). Mine + Medici's + Pérotin's L127-130 + 4 other prompts + 3 memory files + startup.md all move together when PO rules.

[DEFERRED] Comenius prompt design improvements (escalation subsection + items 2-6 from S33+) -- opinion only, PO discretion.

[DEFERRED -- pre-S35] Brief-scope-conflation pattern (S32 Cal queue): NEW failure-mode entry, not yet submitted.

[DEFERRED] All-opus burn-rate posture for esl-legal -- PO may downshift specialists to sonnet on dormant re-spawns. Flag for case#2.

[DEFERRED -- Aen prompt latent gap] `prompts/aeneas.md:43` restricts Edit/Write to `memory/`+roster but team-lead routinely edits prompts. Non-urgent; needs design round (distinctive FORBIDDEN/ALLOWED structure), not a simple MAY WRITE addition.

---

## Standing Decisions / Patterns (durable)

[DECISION] Single-provider for governance/coordination/XP pipeline roles. Multi-provider only for (1) capability gaps (vision) and (2) fire-and-forget mechanical roles (Eilama-class).

[PATTERN] **Pass 1 / Pass 2 rename separation.** Pass 1 = prose ships immediately; Pass 2 = machine identifiers ship as coordinated batch with all consumers. Default prose-only Pass 1. Cal-filed `wiki/patterns/pass1-pass2-rename-separation.md`.
[PATTERN] **Within-document rename grep discipline.** Grep ALL references, re-grep after edit, zero hits the only acceptable result. Cal-filed (cross-credited).
[PATTERN] **Protocol shapes are typed contracts, not prose.** Cross-read producer + consumer specs before merging a protocol change. Brunel-filed.
[PATTERN] **Scope-block drift from practice.** Cross-read MAY WRITE against prompt body + accepted artifacts. Scope block written LAST; every path in body must appear in MAY READ/WRITE. Cal-filed `scope-block-drift-from-practice.md` (n=3).
[PATTERN] **Dual-team-dir ambiguity** -- `teams/<team>/` in both `$HOME/.claude/` (ephemeral) and `$REPO/.claude/` (durable). Anchor bare paths. Cal-filed; Path Convention section in cross-dir prompts.
[PATTERN] **Cross-read gate pays compound interest.** Reviewer catches structural bugs the author can't see. Apply at protocol-shape, design, and prompt-amendment time.
[PATTERN] **Convergent independent design = strong adopt signal.** Two specialists converging from different routes > either alone.
[PATTERN] **Throttling vs delegation distinction.** Don't decline to surface; but delegating through someone whose workflow fits better is fine.
[PATTERN] **Named concepts beat descriptive phrases.** Coin a name, define once, reuse.
[PATTERN] **Active dual-sourcing defense.** Same content in common-prompt + per-role prompt is intentional (specialists never read each other's prompts); coordinated 2-file edits cheaper than silent drift.
[PATTERN] **Brilliant-first / toolkit-first context-read ladder.** Query Brilliant for context before opinion; read a toolkit's README+prompt+sample-output before extending it.
[PATTERN] **Lore-fit: structural beats thematic.** Structural fit (Pérotin atop Léonin) produces behavioral payoff; thematic fit leaves role energy unclaimed.
[PATTERN] **Sonnet-fit calibration.** Downgrade only when judgment calls are clear-criteria AND escalation paths crystal.
[PATTERN] **Promotion as label vs behavioral change.** Scan for contradictions with prior status + missing "between dispatched work" framing.
[PATTERN] **Naming heuristic -- domain-named-tradition over language-tiebreak when domain has one.** Cal-submitted (esl-suvekool + esl-legal).
[PATTERN] Team archetypes: Research / Development / Hybrid (+ candidates: Operational [esl-suvekool], Adversarial-Research [esl-legal red-team `[ADVERSARY-FLAG]`], Long-lived-per-domain-research-support [esl-legal, case-driven, dormant between cases]).
[PATTERN] **Cross-team author attribution edge case.** Files authored by another team's member keep original trailer unless substantially rewritten; cross-check host CLAUDE.md.
[PATTERN] Model tier driven by **consequence of error**, not complexity. Opus when no automated quality gate; sonnet when tests catch errors.
[PATTERN] Data flow (pipeline vs independent-output) determines isolation. Pipeline → trunk + directory ownership. Independent → branch/worktree safe.
[PATTERN] "Agent PO" is anti-pattern -- PO is always human; agent = "Requirements Analyst" with explicit escalation rules.
[PATTERN] Staging for cross-FR-team drafts = FR repo root `designs/new/<team-slug>/`; internal-to-FR stays under `teams/framework-research/`.
[PATTERN] Inbox files created at registration, not lazily. **Spawn-order: spawn-by-message-direction trumps spawn-by-data-dependency.** Service roles (Librarian, team-lead) spawn first.
[PATTERN] **"Why this section exists" documentation** -- name the incident in the section so future readers don't delete it as redundant.
[PATTERN] **"Credit the gate, not the gate-runner"** (Brunel) -- design good gates, trust them, don't rely on heroism.
[PATTERN] **Convention adopted before Phase 2 = retroactive telemetry.** Adopt structured markers early even when telemetry isn't active.
[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure. Real incidents drive design. `spawn_member.sh` > Agent tool for model-tier correctness. Coordination boundary tables for adjacent-domain agents.

[GOTCHA] **Arhitecture repo (Eesti-Raudtee) = pull-only for mitselek account** (push:false). Can't open PRs by push; use issue route or hand patch to a write-capable account. Default branch `master`. arch-docs MCP indexes 500 docs (`search_docs`/`get_doc`/`list_index`).
[GOTCHA] Count **characters**, not roles-plus-characters. Team-lead IS one of the characters.
[GOTCHA] `TeamCreate`/`TeamDelete` are first-class harness tools, bare names -- NOT `mcp__teamwork__*`.
[GOTCHA] Read-side git perms (`log`/`diff`/`status`) for curator/librarian/cross-session roles by default.
[GOTCHA] Inbox persistence repo-side from day 1 (Volta pattern, TEAM_NAME hardcoded for single-team repos).
[GOTCHA] Long-lived team prompts must be case-agnostic; case paths in `cases/<slug>/README.md`. Only roster.json + README may name the first case.
[GOTCHA] When two specialists co-own a question, the file boundary must be in design-spec AND both prompts.
[GOTCHA] Dropping a role updates TWO files: `roster.json` AND `common-prompt.md` members list.
[GOTCHA] Brilliant `session_init` + broad `search_entries` overflow output limit. Use `logical_path` filters + tight queries.

---

## Hires + earlier-session detail -- in git history
61 agents / 13 teams cumulative; latest Hopper (FR Deploy Op, 2026-05-20 `25094d1`); no new hires S35-S42 (amendment + consultancy work). FR S29-S41 detail (Hopper-Amendment-4 S35, esl-suvekool/esl-legal deploys, mvox-dev audit, S41 Arhitecture consultancy) in git log. Durable patterns folded into Standing Decisions above.

[FOR CAL QUEUE -- substrate anomalies, BOTH REPRODUCED S42 + S43]: (1) peer-DM (agent→celes) delivery LAG/stall, high-variance → "disk inbox JSON ≠ delivery truth"; worktree-spawn-asymmetry cluster. S43 repro: Medici's coordination DM (proposing labor split) arrived AFTER I'd already found his report on disk and built the design around it -- recovered by reading the docs file, not waiting for the DM. (2) task-list STATE LOSS -- S42: TaskList empty for both celes+team-lead mid-session. S43 repro: my 4 completed tasks vanished (TaskList "No tasks found"); a STALE task-assignment notification for #1 replayed AFTER completion. Recovery rule: don't recreate tasks on empty TaskList -- verify deliverable on disk instead (the work was done + reported). Both anomalies now n≥2 across sessions → Cal when he next spawns.

(*FR:Celes*)
