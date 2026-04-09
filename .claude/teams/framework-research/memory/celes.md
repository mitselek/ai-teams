# Celes — Scratchpad

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `.claude/teams/framework-research/memory/celes.md` — NOT `memory/celes.md` at repo root.

---

## Domain Knowledge (stable)

[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure. Real incidents drive design.
[PATTERN] `spawn_member.sh` > Agent tool for model-tier correctness.
[PATTERN] Coordination boundary tables (section ownership + handshake protocol) are the key pattern for agents sharing adjacent domains.
[PATTERN] Model tier driven by **consequence of error**, not task complexity. Opus when no automated quality gate; sonnet when tests catch errors.
[PATTERN] Three team archetypes: Research, Development, Hybrid — determined by primary output type.
[PATTERN] Six canonical agent roles: Coordinator, Researcher, Analyst, Developer, Spec Writer, Design Specialist.
[PATTERN] Data flow architecture (pipeline vs independent-output) determines isolation model. Pipeline → trunk + directory ownership. Independent → branch/worktree safe.
[PATTERN] "Agent PO" is an anti-pattern — PO is always the human. Agent should be "Requirements Analyst" with explicit escalation rules.
[GOTCHA] Count **characters**, not roles-plus-characters. Team-lead IS one of the characters. "5-character team" not "team-lead + 5 agents = 6."

## Hires Delivered (cumulative — 46 agents)

| Agent | Lore | Team | Model | Date |
|---|---|---|---|---|
| Volta | Alessandro Volta | FR | opus | 2026-03-13 |
| Herald | Hermes Trismegistus | FR | opus | 2026-03-13 |
| Brunel | Isambard Kingdom Brunel | FR | sonnet | 2026-03-14 |
| Vigenere | Blaise de Vigenere | CD | opus | 2026-03-14 |
| Babbage | Charles Babbage | CD | sonnet | 2026-03-14 |
| Kerckhoffs | Auguste Kerckhoffs | CD | sonnet | 2026-03-14 |
| Richelieu | Cardinal Richelieu | L1 mgr | opus | 2026-03-14 |
| Lovelace | Ada Lovelace | CD | sonnet | 2026-03-14 |
| Aeneas | Virgil's Aeneas | FR TL | opus | 2026-03-17 |
| Schliemann | Heinrich Schliemann | AR TL | opus | 2026-03-17 |
| Champollion | J-F Champollion | AR | sonnet | 2026-03-17 |
| Nightingale | Florence Nightingale | AR | sonnet | 2026-03-17 |
| Berners-Lee | Tim Berners-Lee | AR | sonnet | 2026-03-17 |
| Hammurabi | Hammurabi | AR | opus | 2026-03-17 |
| Montesquieu | Charles de Montesquieu | FR | opus | 2026-03-17 |
| Marconi | Guglielmo Marconi | CD TL | opus | 2026-03-17 |
| Palestrina | G.P. da Palestrina | PD TL | opus | 2026-03-18 |
| Byrd | William Byrd | PD | sonnet | 2026-03-18 |
| Josquin | Josquin des Prez | PD | opus | 2026-03-18 |
| Tallis | Thomas Tallis | PD | sonnet | 2026-03-18 |
| Bentham | Jeremy Bentham | PD | opus | 2026-03-18 |
| Comenius | Jan Amos Comenius | PD | sonnet | 2026-03-18 |
| Victoria | Queen Victoria | PD | sonnet | 2026-03-18 |
| Finn | (reuse) | PD | sonnet | 2026-03-18 |
| Saavedra | Cervantes | ER TL | opus | 2026-03-19 |
| Codd | E.F. Codd | ER | opus | 2026-03-19 |
| Hopper | Grace Hopper | ER | opus | 2026-03-19 |
| Semper | Gottfried Semper | ER | opus | 2026-03-19 |
| Hamilton | Margaret Hamilton | ER | opus | 2026-03-19 |
| Theseus | Greek mythology | BT TL | opus | 2026-03-20 |
| Hypatia | Hypatia of Alexandria | BT | sonnet | 2026-03-20 |
| Vidocq | E.F. Vidocq | BT | sonnet | 2026-03-20 |
| Portia | Shakespeare | BT | opus | 2026-03-20 |
| Shechtman | Dan Shechtman | PEN | opus | 2026-03-23 |
| Ammann | Robert Ammann | PEN | opus | 2026-03-23 |
| Bruijn | N.G. de Bruijn | PEN | opus | 2026-03-23 |
| Escher | M.C. Escher | PEN | opus | 2026-03-23 |
| Penrose | Sir Roger Penrose | PEN | opus | 2026-03-23 |
| PEN TL | (user-assigned) | PEN TL | opus | 2026-03-23 |

## Patterns from earlier sessions (compressed 2026-04-09)

Detailed session logs for Mar 23, Mar 24, Apr 6, and the Apr 8/9 T09 discussion rounds are in git history and in `topics/09-development-methodology.md` itself. The patterns worth carrying forward:

[PATTERN] When team-lead cannot write code, integration layers belong with the builder whose functions they call. (penrose-dev)
[PATTERN] Pipeline dependencies flow one way; document the direction prominently. (penrose-dev)
[PATTERN] Review checklist for team redeployment: (1) roster.json matches target, (2) common-prompt members list matches, (3) model tiers validated, (4) prompt scope restrictions match deployment env, (5) prompts reflect lessons from prior sessions. (hr-devs redeployment)
[PATTERN] For products with active clients hitting bugs, team must have dual tracks: (1) urgent bugfixes on live system, (2) parallel transition to new system. Work streams, not sequential phases. (screenwerk-dev)
[PATTERN] Advisory specialists (non-TDD, non-coding) are valid when expertise crosses TDD pair boundaries. (screenwerk-dev — Talbot, Melies)
[PATTERN] Four-round discussion protocol works: initial specialist responses → PO response → refinements → specialist pushback → PO new questions → synthesis. Now codified in T09 § "Multi-Round Consensus Protocol".
[PATTERN] When synthesizing multi-round discussions into topic files: preserve disagreements in a Part 4 "Open questions" section, don't smooth over.
[PATTERN] When multiple specialists reach the same recommendation through different reasoning, preserve all three arguments — they validate each other.
[PATTERN] Operational additions from lifecycle/governance specialists often slot in with zero ambiguity. Structural disagreements require binary calls.
[PATTERN] Brunel's resource-constraint dimension (host capacity) is a deployment reality the tier model was missing. Degraded Cathedral is the escape hatch.
[GOTCHA] Client communication is PO-only — agents draft, Mihkel sends. Must be explicit in common-prompt. (screenwerk-dev)
[GOTCHA] TDD pair is non-negotiable PO constraint — every dev team must have explicit builder+tester pairs.
[GOTCHA] Dropping a role requires updating TWO files: `roster.json` AND `common-prompt.md` members list. Easy to miss the second.
[GOTCHA] When reviewing an existing team for redeployment: check BOTH the design file AND the source-of-truth (live roster) — they may have drifted.
[LEARNED] Being willing to correct a position publicly is more valuable than being right on the first try (Oracle model tier sonnet → opus[1m] after PO's sole-gateway decision).
[LEARNED] My v2 had an implicit "parallelism is a solved problem" assumption. #50 surfaced this. Distinguish "solved" from "deferred" carefully in synthesis work.
[LEARNED] "Multi-pipeline team" vs "multi-pipeline execution" is a synthesis-level clarity axis v2 did not make explicit. Now canonical in T09 v2.1.

## Session 2026-04-09 — Post-Crash Recovery (T09 v2.1, v2.2, #50/#51/#52)

[CHECKPOINT] T09 v2.1 committed as `264222d` before crash — "sequential-first default (resolves #50, #52)". Sequential First section added, max_lookahead → 0, Shared PURPLE moved behind Future Work gate, multi-pipeline team-shape-vs-execution-mode distinction surfaced, #52 RED design-vs-write invariant folded into Future Work. Validation criterion chosen: 10 successful sequential Cathedral sessions with watchdog + three-strike escalation + clean Knowledge Health Summary coverage.
[CHECKPOINT] T09 v2.2 committed as `9ea1e90` after crash recovery — "protocol typing principle + TypeScript interfaces (resolves #51)". New `types/t09-protocols.ts` with 12 interfaces covering every T09 protocol. New Protocol Typing Principle section before Related Topics. Every protocol block in T09 gains an "Interface: X in types/..." cross-reference line. T03 Related Topics entry extended with one-line principle cross-reference (no edit to T03 itself — Herald's file).
[CHECKPOINT] All three round-6 T09-followup issues assigned to me are closed: #50, #51, #52. #48 and #49 remain paused per task dispatch.

[DECISION] `PurpleVerdict` is a TypeScript discriminated union of `PurpleVerdictAccept`, `PurpleVerdictReject`, and `PurpleVerdictEscalate`. The three-strike rule becomes type-enforced — escalate variant requires `rejectionCount: 3` literal, reject variant is `1 | 2`. Callers can exhaustively match on verdict outcome and the compiler enforces the authority boundary.
[DECISION] Framework principle placement: new short section "Protocol Typing Principle" in T09 (before Related Topics), not in T03. Rationale: #51 was scoped to T09 and T09 is my topic. Adding the principle to T03 would be an edit to Herald's file. One-line cross-reference in T09's Related Topics → T03 entry is enough to flag the expectation for future T03 work.
[DECISION] `types/` placement at repo root (not under `topics/` or `.claude/`). Rationale: types are load-bearing for future implementations (comms daemons, prompt builders, test harnesses) that should import them directly. Topic-file-colocated types would couple consumers to research artifacts; repo-root `types/` is the conventional TypeScript placement.

[PATTERN] When a topic file documents a communication protocol, the prose + markdown template + TypeScript interface triad works well: prose for the *why*, markdown template for the shape you see in agent messages, interface for the shape a machine enforces. The three are redundant on purpose — agents read markdown, tools read interface.
[PATTERN] After a crash mid-work, verify both (a) the commit landed AND (b) the issue is actually closed. Commit message "resolves #N" does not auto-close on direct-to-main commits — only PR merges auto-close. On direct commits, the issue must be closed with an explicit `gh issue close` call. Missed this at the #50+#52 commit; caught during respawn reorientation.
[PATTERN] When the `types/` for a topic file is written, update the version line AND the changelog AND add interface cross-reference lines to every protocol block. Don't leave the prose and types drift-eligible — an explicit cross-reference per block is the cheapest insurance against future divergence.
[GOTCHA] A duplicate post-crash respawn can exist alongside the primary — during my respawn, team-lead initially believed a parallel spawn had delivered the report and ordered me to stand down. Ten minutes later the "parallel spawn" turned out to be an empty orphan with no tool surface and team-lead reversed the shutdown. Lesson: during recovery, verify any "duplicate" actually has tool capability before deferring to it. Tool-less orphans aren't authoritative.
[LEARNED] My scratchpad was NOT updated between 607ea8b and the crash — the Task 1 commit (264222d) landed but the scratchpad entry recording it did not. This is why the respawn brief had to warn me explicitly that in-memory notes were gone. Going forward: after every significant commit, update scratchpad in the same session before moving on to the next task. The 30-second cost is tiny; the risk of losing the reasoning is real.

## Session 2026-04-09 (later) — T09 v2.3 (#49)

[CHECKPOINT] T09 v2.3 committed as `9b8d0a3` — "cost framing removed, quality as the only axis (resolves #49)". Version bumped v2.2 → v2.3. Pushed to origin/main. Issue #49 was already in CLOSED state when I ran gh; resolution comment posted as comment 4213881485 so commit → issue link is recorded.

[DECISION] Degraded Cathedral renamed **Host Capacity as Deployment Prerequisite**, relocated in-place (still between the Cathedral governance trigger and the Shared vs. Separate PURPLE section — already the tier-selection zone). Under-provisioned host is a **deployment blocker**, not a tier variant. The team-lead-as-PURPLE pattern survives as an **emergency-only recorded deficiency** with explicit "fix the hardware, do not normalize the compensation" guidance. Deployment Prerequisites table lists **code consequence (the decision) × host sizing (the prerequisite)** — no implication that host sizing is a second decision axis.

[DECISION] PURPLE configuration table: Cost column dropped, renamed "Cost tiering" → "PURPLE configuration by tier". Degraded Cathedral row removed. Four rows remain.

[DECISION] Team Composition Impact table: Degraded Cathedral row removed. Emergency compensation referenced via pointer to the Host Capacity section, not as a table row.

[DECISION] Shared vs. Separate PURPLE convergence: Brunel's "resource capacity" cost bullet deleted. Now two quality arguments (Herald structural consistency + Finn Oracle cross-pattern detection) + Monte's authority caveat. Herald's bullet label changed from "cost + structural consistency" to "structural consistency". Brunel stays credited in the historical v2 Changelog entry.

[DECISION] Opus Bookends Key Insight: "cost optimization" replaced with "consequence of error" framing. "Expensive/cheap" phrasing replaced with "high consequence when wrong / verifiable by tests".

[DECISION] Single-pipeline same-agent ARCHITECT defense: "opus cost saves one agent" reframed as "one opus holds both cognitive stances coherently within a single story".

[DECISION] Implementation Checklist: host-capacity checkbox reframed as "verify host can sustain tier; else resolve at infrastructure layer, not tier downgrade". Pipeline-tier checkbox gains "this is the only decision axis".

[PATTERN] Part 2 (Oracle) cost mentions survived the scope directive verbatim. Lines ~598/609/880 reference "opus cost of knowledge management", "cost of lost knowledge", "costing 30+ minutes" — all consequence arguments for Part 2 Oracle adoption triggers, not tier decisions. PO's brief was explicit that Part 2 is untouched.

[PATTERN] Historical changelog entries (v2.1, v2, v2.2) contain Degraded-Cathedral-as-tier language — preserved verbatim. Changelogs are historical records; rewriting them to match new framing would falsify history. The new v2.3 entry is the authoritative statement of what changed.

[GOTCHA] Issue #49 was already CLOSED (`closedAt: 2026-04-09T11:39:34Z`, zero comments) when I went to close it. Something or someone — possibly team-lead, possibly automation — closed the issue earlier in the session without posting a resolution comment. Posted the resolution comment as a follow-up. Flagged in my report to team-lead. Lesson: `gh issue close` refuses to act on already-closed issues AND swallows the comment it was supposed to post. Use `gh issue comment` separately if the close-with-comment flow fails.

[GOTCHA] Working tree had uncommitted modifications to `.claude/teams/framework-research/memory/team-lead.md` when I ran `git status` — team-lead's scratchpad, not mine to commit. Staged only `topics/09-development-methodology.md` explicitly with `git add <file>`. Reminder: always check `git status` before committing — other agents' in-flight work can land in the same working tree during a shared-isolation session.

[LEARNED] Writing the scratchpad entry IMMEDIATELY after commit (before reporting to team-lead) is now habit. The previous session's crash cost me the v2.1 decision reasoning; I don't want to repeat that.

## Deferred (carried forward)

[DEFERRED] #48 (Oracle tier downgrade path) — paused per Task 3 directive, awaiting PO assessment. Now the last issue in the #48/#49 pair — #49 landed in v2.3.
[DEFERRED] `types/t03-protocols.ts` for Herald's inter-team protocols (work handoff, broadcast, transport layer). Principle is documented, implementation belongs to Herald when he formalizes T03's protocols.
[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.
[DEFERRED] hr-devs design files need two corrections before deployment: roster.json (remove medici+eilama) and common-prompt.md (members list). Optional: tighten arvo step 7 wording.

(*FR:Celes*)
