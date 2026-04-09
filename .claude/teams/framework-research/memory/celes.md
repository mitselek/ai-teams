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

## Hires Delivered (cumulative — 53 agents)

Full table in git history (commit `74b2e05`). Teams: FR(8+TL), CD(5+TL), AR(5+TL), PD(7+TL), ER(4+TL), BT(3+TL), PEN(5+TL), L1-mgr(1), RK(8+TL). Latest: Raamatukoi tugigrupp v2 (9 characters with full XP pipeline, 2026-04-09).

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
[PATTERN] Host capacity is a deployment prerequisite, not a tier dimension. Under-provisioning is a blocker to fix, not a tier to ship. (v2.3 reframing of Brunel's original)
[GOTCHA] Client communication is PO-only — agents draft, Mihkel sends. Must be explicit in common-prompt. (screenwerk-dev)
[GOTCHA] TDD pair is non-negotiable PO constraint — every dev team must have explicit builder+tester pairs.
[GOTCHA] Dropping a role requires updating TWO files: `roster.json` AND `common-prompt.md` members list. Easy to miss the second.
[GOTCHA] When reviewing an existing team for redeployment: check BOTH the design file AND the source-of-truth (live roster) — they may have drifted.
[LEARNED] Being willing to correct a position publicly is more valuable than being right on the first try (Oracle model tier sonnet → opus[1m] after PO's sole-gateway decision).
[LEARNED] My v2 had an implicit "parallelism is a solved problem" assumption. #50 surfaced this. Distinguish "solved" from "deferred" carefully in synthesis work.
[LEARNED] "Multi-pipeline team" vs "multi-pipeline execution" is a synthesis-level clarity axis v2 did not make explicit. Now canonical in T09 v2.1.

## T09 v2.1/v2.2 (#50/#51/#52) — compressed

[CHECKPOINT] v2.1 `264222d` (#50, #52): sequential-first default, max_lookahead → 0, Shared PURPLE deferred behind Future Work gate.
[CHECKPOINT] v2.2 `9ea1e90` (#51): 12 TypeScript interfaces in `types/t09-protocols.ts`, Protocol Typing Principle section, cross-references per protocol block.
[DECISION] `PurpleVerdict` as discriminated union (Accept/Reject/Escalate); `types/` at repo root; principle in T09, not T03.
[PATTERN] Prose + markdown template + TypeScript interface triad for communication protocols. Three forms are redundant on purpose.
[PATTERN] "resolves #N" in commit message does NOT auto-close on direct-to-main commits — only PR merges auto-close. Always `gh issue close` explicitly.
[LEARNED] Update scratchpad IMMEDIATELY after every significant commit. The crash between v2.1 commit and scratchpad update lost all reasoning.

## T09 v2.3 (#49) — compressed

[CHECKPOINT] v2.3 `9b8d0a3` (#49): cost framing removed, quality as the only axis. Degraded Cathedral → "Host Capacity as Deployment Prerequisite". Cost column dropped from PURPLE config table. Brunel's cost bullet removed from Shared vs. Separate PURPLE convergence.
[DECISION] Under-provisioned host = deployment blocker, not tier variant. Emergency team-lead-as-PURPLE is a "recorded deficiency" with "fix the hardware, do not normalize the compensation" guidance.
[DECISION] Part 2 (Oracle) cost mentions left untouched — consequence arguments for adoption triggers, not tier decisions.
[PATTERN] Historical changelog entries preserved verbatim even when new framing contradicts them.
[GOTCHA] `gh issue close --comment` swallows the comment if the issue is already closed. Always `gh issue comment` separately as fallback.
[GOTCHA] Shared working tree: always `git add <specific-file>`, never `-a`, when other agents may have uncommitted modifications.

## Callimachus Onboarding (Oracle for framework-research)

[CHECKPOINT] All 6 deliverables drafted, NOT committed (awaiting team-lead/PO review at session end):

- `prompts/callimachus.md` — full Oracle prompt (~230 lines), first Oracle prompt ever written for the framework
- `roster.json` — callimachus entry added (opus[1m], gold, agentType: oracle)
- `common-prompt.md` — members list + dual-hub routing section
- `wiki/` directory tree created (8 subdirs + index.md)
- `oracle-state.json` — `{"intake_complete": false}`
- 7 specialist prompts updated with Oracle Routing section (medici gets extra Medici/Oracle boundary paragraph)

[DECISION] Cathedral tier for knowledge management — both T09 v2.3 triggers exceeded: 170 tagged entries (threshold: 30), 8 agents (threshold: 7-8).
[DECISION] Incremental Bootstrap over Intake Interview — research team's primary outputs are already public (topic files, discussions, issues). Intake would re-extract what is documented.
[DECISION] Phase 2 gate for Gap Tracking and Health Sensing — enabled after 5 sessions. Phase 1 has Curation + Query Gateway only.
[DECISION] Medici/Oracle coexistence approved by PO — different governance scopes (L0/L1 vs L2/L3). Explicit boundary in both prompts.
[DECISION] Name: Callimachus (Pinakes lore, classical-figures convention). PO approved.
[PATTERN] The 47th agent I've designed. First Oracle. The assessment format (5-part: tier, bootstrap, artifacts, minimum viable, blockers) is reusable for future Oracle deployments on other teams.

## Raamatukoi tugigrupp (raamatukoi-dev) — 2026-04-09

[CHECKPOINT] Full design v2 at `designs/new/raamatukoi-dev/`. 13 files: design-spec, roster.json, common-prompt, 9 prompts, tdd-pipeline.md.
[DECISION] 9 characters: Manutius (TL, opus), Cassiodorus (ARCHITECT, opus), Jikji (RED/ws, sonnet), Aldus (GREEN/ws, sonnet), Erasmus (PURPLE/ws, opus), Babbage (RED/rat, sonnet), Hypatia (GREEN/rat, sonnet), Khwarizmi (PURPLE/rat, opus), Bodley (oracle, opus[1m]).
[DECISION] Cathedral tier — team's entire mission is refactoring; structural debt IS the problem.
[DECISION] Separate PURPLEs — High domain distance (different repos + different languages). Per T09 v2.3 table.
[DECISION] Shared ARCHITECT — one Cassiodorus for both pipelines. Sequential execution means no contention.
[DECISION] Lore theme: Pioneers of the Book (added: Cassiodorus, Erasmus, al-Khwarizmi).
[DECISION] Scope: bug fixes + refactoring + quality infrastructure ONLY. No new features.
[DECISION] Submodule model: tugigrupp parent, webstore + rat-project as submodules. PRs against real repos.
[DECISION] Dual-hub: Manutius (work) + Bodley (knowledge). Bodley curates Directo, PIM, RARA, SKU contracts.
[PATTERN] For maintenance teams covering 2+ repos with different stacks: one XP pipeline per repo, shared ARCHITECT + Oracle. Oracle bridges integration knowledge; ARCHITECT bridges decomposition knowledge.
[PATTERN] When repos have zero tests, Phase 1 applies XP cycle to infrastructure stories: "set up test framework" is a story decomposed by ARCHITECT, not an ad-hoc task.
[PATTERN] Cathedral tier for quality-infrastructure teams: if the mission IS refactoring, structural debt consequences are maximally high. This is the clearest Cathedral trigger.

## Deferred (carried forward)

[DEFERRED] #48 (Oracle tier downgrade path) — paused per Task 3 directive, awaiting PO assessment. Now the last issue in the #48/#49 pair — #49 landed in v2.3.
[DEFERRED] `types/t03-protocols.ts` for Herald's inter-team protocols (work handoff, broadcast, transport layer). Principle is documented, implementation belongs to Herald when he formalizes T03's protocols.
[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.
[DEFERRED] hr-devs design files need two corrections before deployment: roster.json (remove medici+eilama) and common-prompt.md (members list). Optional: tighten arvo step 7 wording.

(*FR:Celes*)
