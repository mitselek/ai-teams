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

## Callimachus Onboarding — compressed

[CHECKPOINT] Callimachus deployed. 6 deliverables committed. Oracle assessment format (5-part) reusable for future deployments.
[DECISION] Cathedral tier, Incremental Bootstrap, Phase 2 gate after 5 sessions, Medici/Oracle coexistence (L0/L1 vs L2/L3).

## Raamatukoi tugigrupp — compressed

[CHECKPOINT] Full design v2 deployed at `designs/new/raamatukoi-dev/` + live at `Raamatukoi/tugigrupp`. 9 characters, Cathedral tier, dual-hub, dual-pipeline.
[PATTERN] Multi-repo maintenance: one XP pipeline per repo, shared ARCHITECT + Oracle. Zero-test repos: "set up test framework" is a story.
[LEARNED] Three-document system: design-spec (PO rationale), common-prompt (agent rules), tdd-pipeline.md (runtime protocol). Reduce redundancy with pointers.

## Discussion #56 — Single-provider model strategy (2026-04-10)

[CHECKPOINT] Discussion complete. Rounds 1-2 + Cal's synthesis posted and reviewed. No corrections needed from role design perspective.
[DECISION] My position: single-provider for all governance/coordination/XP pipeline roles. Multi-provider only for (1) capability gaps (vision) and (2) fire-and-forget mechanical roles (Eilama-class).
[PATTERN] Five distinct provider lock-in layers: infrastructure (Brunel), protocol (Herald), knowledge (Callimachus), prompt (Celes), governance (Monte). Each has different switching costs. Convergent finding from six independent analyses.
[PATTERN] Two role categories for provider strategy: framework-participating (Claude-only, behavioral compliance required) vs. service roles (provider-agnostic, test/schema verified).
[PATTERN] "Adding a non-Claude model does not mean adding a non-Claude agent." Visual QA is a tool (MCP/HTTP), not an agent.
[GOTCHA] Gemini's synthesis conflated Eilama sidecar pattern (inbox-polling daemon) with multi-modal tool integration (MCP/HTTP callable service). Architecturally different patterns.
[GOTCHA] Audit independence (Monte's argument) is governance-sound but role-design-expensive: requires dual behavioral profiles, dual prompt variants, dual validation.
[GOTCHA] Cross-provider PURPLE review is untested: PURPLE (opus) is calibrated against Claude sonnet coding idioms. Non-Claude GREEN output may trigger false positives/negatives in structural judgment.

## Bioforge-dev roster (2026-04-10)

[CHECKPOINT] Complete design package at `designs/new/bioforge-dev/` — 7 files: roster.json, design-spec.md, common-prompt.md, 4 prompts (humboldt/merian/linnaeus/cuvier).
[DECISION] 4-character team: Humboldt (opus, team-lead/navigator/architect as main session), Merian (sonnet, RED), Linnaeus (sonnet, GREEN), Cuvier (opus, PURPLE). No ARCHITECT, no Oracle — single repo, single language.
[DECISION] Lore theme: Naturalists of the Enlightenment — scientists who studied ecosystems, classification, and structural biology. Connects to BioForge's domain (ecosystem simulation, energy conservation, species evolution).
[DECISION] Team-lead is main session per WORKFLOW.md §2 — not a spawned agent. PO communicates directly through main session.
[PATTERN] When project has single repo + single language: collapse ARCHITECT into team-lead, drop Oracle. 4 characters not 9. Cathedral-lite.
[PATTERN] WORKFLOW.md already specifies the full pipeline protocol — common-prompt can reference it rather than duplicating. Keep common-prompt as operational config, WORKFLOW.md as the process contract.

## Deferred (carried forward)

[DEFERRED] #48 (Oracle tier downgrade path) — paused per Task 3 directive, awaiting PO assessment. Now the last issue in the #48/#49 pair — #49 landed in v2.3.
[DEFERRED] `types/t03-protocols.ts` for Herald's inter-team protocols (work handoff, broadcast, transport layer). Principle is documented, implementation belongs to Herald when he formalizes T03's protocols.
[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.
[DEFERRED] hr-devs design files need two corrections before deployment: roster.json (remove medici+eilama) and common-prompt.md (members list). Optional: tighten arvo step 7 wording.

(*FR:Celes*)
