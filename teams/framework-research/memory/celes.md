# Celes -- Scratchpad

## Summary (lines 1-15 -- always read on startup)
- **Current state (S72, 2026-09-03):** **paunvere prompt-layer health check DELIVERED** -- `teams/framework-research/docs/paunvere-prompt-health-2026-09-03.md`. Verdict **healthy-with-fixes**: 9 fix-now, 7 watch. Top 3: (1) `saxby.md:11` vs `:46` self-contradiction -- "Joosep decides" AND "not on Joosep's word", with "the documented sign-off" now an undefined term after the PO withdrew the Ruth gate 08-31; (2) that withdrawn gate survives in SIX places (roster `_principal` + saxby `significance`, minot:26/27, trevithick:39/64) -- a 4-hop phantom mediator chain and an unreachable escape hatch in Trevithick's MAY-WRITE; (3) **no permission-wall procedure anywhere** -- policy stated 4x, executable shape 0x; proposed a `## When you hit a wall` section for common-prompt (stop / NEED-line / do the rest / don't sit and wait). Also: `FIRST-TASKS.md` still says `vedur` in 4 places (139/140/151/175) so Joosep's task 4 points at a dir that does not exist and 5b writes drafts outside TEAM_ROOT; Trevithick resp.3 (SOAP wire-mode switch) = told to ship what he is forbidden to write; rail enumerated lexically so a NEW send-path file clears Saxby's trigger list; specialists told to "wait" hold background agents on Joosep's licence; shutdown-only commit vs documented detach-and-leave-running. NOT checked: the live container copies, any behaviour (no scratchpads exist), the repo source (S66 reading carried forward), Atlassian. No git this task. [PATTERN -- Cal queue] **Withdrawn-gate drift:** when a PO withdraws an authority gate, grep the gate-holder's NAME across prompts+roster, not the gate's wording -- 5 of 6 stale sites named Ruth without repeating the withdrawn phrase.
- **Prior (S67, 2026-08-31 -- design FINAL):** **`paunvere`** (PO renamed from my `vedur`; Kevade parish; member names stay railway-pioneers, no Kevade cast), Joosep Madar's personal team, at `designs/new/joosep/teams/paunvere/` (roster 6 = Minot lead + Trevithick/Rastrick/Saxby/Bradshaw/Smiles; common-prompt w/ authority table + hard safety rule as-built; startup.md; README = design of record). Railway-pioneer lore, structural fit. Reported to Aen 16:15; Brunel handed count + Estonian FIRST-TASKS 4-6 + 4 layout items (seed team dir, ~/work/CLAUDE.md, pnpm/corepack, TEAM_NAME touchpoints). **Findings for PO:** (1) endpoint IS env-configurable (`SK_ENDPOINT`, substring guard `includes('EvrSK_test')` x3 in send-request.ts) -- rule encoded vs variable+guard; (2) Joosep dropped reserved-range check `faa287e` 08-27 -- encoded as team discipline; (3) task-1 PAT contents:read cannot push -> task 5 read-only, task 6 first named widening. Brunel: all 4 layout items accepted, launcher decoupled from TEAM_NAME (rename now free), FIRST-TASKS.md Estonian done + my safety-section review applied (md5 `530329c2`, 17:21) -- CLOSED. Third rail finding: `timetable.ts:10` docstring "enforced server-side" is stale after `faa287e`. Container is UP. Aen review S67 08-31: accepted w/ 3 fixes, ALL APPLIED -- (a) startup rewritten implicit-team (no TeamCreate, CLI 2.1.178+, `session-<id>` discovered); (b) settings.json deny = tripwire not backstop (HEAD:main / renamed remote / gh api walk past; real wall = rumba branch protection, PO raising); (c) model-pin reality (pins=intent, runs on Joosep's licence ITSD-39589, first boot checks /model, flag if fable unavailable). Brunel notified: TEAM_NAME touchpoints compose:113/.env.example:63/entrypoint:135. Nothing open for me unless PO hand-over bounces. **Carry-forward (for Finn/next session):** pre-S41 deferreds below still live; Cal-queue S66 patterns (read-the-rail-at-source; credential-ladder-matches-first-task) submitted via scratchpad only -- not yet Protocol-A filed.
- **Prior (S63, 2026-08-22 -- rev 4, DEPLOYED path):** package now AT `designs/deployed/passepartout/` (git mv done). Name **Passepartout RATIFIED** (PO); §11.2-6 deferred to PA's early sessions; rev 4 = §2 alias purpose-split (`passe` = greeting launch w/ session-start prompt -- substrate opens silent; `pp` = bare launch), PO-ratified from Hopper's install test-run. rev 2 = six third-party review findings, PO-sanctioned (mail-suppression gate contacts-scoped + archived-visibility; draft provenance; §4 hub-egress amendment; memory freshness w/ FR-S62-TTL cite; monthly restore drill; confirm-semantics default -- explicit+quoted, in-session, expires). Designed the PO's **private-life personal assistant** -- solo Claude Code project (NOT a team), sibling of Sagres. Package at `designs/new/personal-assistant/`: `design.md` (approved architecture captured + my rulings) + `assistant-claude-md.md` (ready-to-install CLAUDE.md). My rulings: name **Passepartout** (Verne's valet; passe-partout = master key -> full-sudo steward; gas-lamp incident = box-changelog lore anchor; runners-up Kratt/Figaro on file, Jeeves rejected as cliché + wrong authority dynamic); dir `~/passepartout`; aliases `passe`/`pp` (append-to-.bashrc, quote "$HOME" -- literal `~/` dir exists on the box); model **fable-5[1m] no downshift** (no test suite, headless runs, sudo). Key mechanism: settings.json deny-list (send/reply/forward/RSVP) = authority table's mechanical backstop for headless `claude -p`; confirm-first via `inbox/` + briefing flag, silence=waiting. Open params (Mihkel): name ratify, hub grant values, non-GitHub git remote, 2nd backup target, install-time verifications, confirmed-send habit.
- **S60 po-team (2026-07-14, deployed 07-16):** full design in `designs/deployed/po-team/roster-design.md`; channel model superseded 07-15 by #90 inbox/hub arch -- protocols.md rev 5 §1 authoritative. Henry/Gama/Nunes live on sagres.
- **[LEARNED S60]** Cite-don't-restate for cross-owned contracts: point at the durable §-anchor, match the pen-holder's wording.
- **Prior sessions (git + topic-10):** S44 Entu consultants; S43 competency-gap taxonomy; S41-S42 Arhitecture consultancy.

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `teams/framework-research/memory/celes.md` -- NOT `memory/celes.md` at repo root.

---

## Session 66 -- vedur (Joosep) commission (2026-08-28)

[DECISION] 7 -> 6: fixture-warden folded into reviewer (Saxby spawns with every builder -- the rail gets a member who is always there); hygienist into cartographer. Scribe kept separate for the read-wide/write-narrow property (one auditable Atlassian-writing prompt). No librarian (extension path). Weighting 3:1:2 by register, recency-led.
[PATTERN -- Cal queue] **Read the rail at source before encoding it.** Commission rule text paraphrased a mechanism ("endpoint never configurable") that the code contradicts (`SK_ENDPOINT` env + substring guard); brief had already caught the same class on `isTest`. Rule: safety text in a prompt cites file:line of the as-built guard, never the decision's paraphrase.
[PATTERN -- Cal queue] **Credential ladder must match the first task.** Read-only PAT + "branch + PR only" = cannot push; resolve by sequencing (read-only task first, first write = first named widening), not by widening task 1.
[GOTCHA] Rastrick cannot run Nightwatch in the container (needs shared `.env`, Chrome, Azure-AD reach) -- "keeper who does not run" is the honest role shape; say so in the prompt or the agent will hunt for credentials.

## Session 63 -- personal-assistant commission (2026-08-22)

[DECISION] Solo-project-not-team shape was PO-approved before I got the commission; my lane was identity + tier only. Design input included a live home-dir survey (Aen): 93%-full /home, 96 loose files, literal `~/` dir -- folded in as §1 "existing environment" + backlog seeds #4-6. Playbook BODIES deliberately unwritten (backlog #3); design.md §3 carries the binding one-paragraph contract per playbook.

[DECISION -- CLOSED 17:10] Deploy-time pointer item APPLIED at ratification: design-of-record pointer now `designs/deployed/passepartout/design.md` (post-move path, written before Aen's `git mv designs/new/personal-assistant designs/deployed/passepartout`). Name RATIFIED: Passepartout (PO). §11.2-6 deferred by PO to the PA's own early sessions. Hopper bootstrapping the box install in parallel.

[CAL-QUEUE -- S63, Cal not spawned] (1) **Solo-assistant-as-degenerate-team pattern:** playbooks = roster-precursor, memory files = scratchpad-precursor; YAGNI now, shards into a team later along playbook seams. (2) **Deny-list-as-authority-backstop:** for headless `claude -p`, the settings.json deny list mechanically enforces the CONFIRM-FIRST half of an authority table (can't prompt -> must pre-deny); confirm channel = `inbox/` files + briefing flags, silence=waiting. (3) **Environment-survey-as-design-input:** probing the target substrate before designing (the `~` survey) yielded 3 backlog seeds + a quoting rule -- cheap, high-yield. (4) **Suppression-must-be-visible** (rev 2): autonomous triage runs on attacker-authored content -> scope burial to known senders + report what was SUPPRESSED, not just what arrived. (5) **Confirms-expire semantics:** a confirmation is explicit, quotes the exact item, executes in-session, and goes stale on change or delay.

## Session 41 -- PRUNED to git + topic 10 (detail in git; [GOTCHA] Arhitecture repo pull-only, branch `master`, arch-docs MCP 500 docs)

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
