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

## Session 2026-03-23

[DECISION] penrose-dev team: 6 characters, all opus. Lore theme: Aperiodic Pioneers. TDD pair (Shechtman writes tests, builders make them pass) + dedicated reviewer (Penrose, RED/YELLOW/GREEN). Team-lead pure coordinator (no code, no review).
[DECISION] Domain splits: Ammann (types/geometry/subdivision/tiling), Bruijn (wiring/signals/simulation), Escher (renderer/controls/main), Shechtman (tests/*), Penrose (review only).
[LEARNED] Domain-specific constant conventions (TAU = 1/PHI in this project, not 2π) must be documented prominently in common-prompt AND a dedicated disambiguation doc. Finn's review caught this — would have caused incorrect test assertions.
[PATTERN] When team-lead cannot write code, integration layers (simulation.ts) belong with the builder whose functions they call.
[PATTERN] Pipeline: geometry → tiling → wiring → signals → simulation → renderer. Dependencies flow one way.

## Session 2026-03-24

[CHECKPOINT] hr-devs roster review for PROD-LLM container deployment.
[DECISION] 7-role roster (lead, sven, dag, tess, marcus, finn, arvo) is sufficient and correct for SvelteKit+D1 stack. Model tiers validated against consequence-of-error principle.
[LEARNED] When reviewing an existing team for redeployment: check BOTH the design file AND the source-of-truth (RC live roster) — they may have drifted. Local design roster was still 9-member (medici+eilama not yet removed).
[GOTCHA] Dropping a role requires updating TWO files: `roster.json` AND `common-prompt.md` members list. Easy to miss the second.
[DECISION] Medici is correct to drop from dev teams — her knowledge-health role has no scope in a code-output team. Marcus's AR hat covers team-health equivalently.
[PATTERN] Review checklist for team redeployment: (1) roster.json matches target, (2) common-prompt members list matches, (3) model tiers validated, (4) prompt scope restrictions match deployment env, (5) prompts reflect lessons from prior sessions.

## Session 2026-04-06

[DECISION] screenwerk-dev team: 7 characters (lead + 2 TDD pairs + 2 advisory specialists). Lore theme: Pioneers of Light and Display. TDD pairs: Daguerre+Niepce (pipeline), Reynaud+Plateau (player). Advisory: Talbot (Entu platform), Melies (legacy migration). Model tiers: opus for lead + Daguerre + Talbot, sonnet for Niepce + Reynaud + Plateau + Melies.
[DECISION] Domain splits: Daguerre (publish pipeline, CDN), Niepce (pipeline tests), Talbot (Entu platform, auth, CMS bugs), Reynaud (player composables, components, pages), Plateau (player tests, E2E), Melies (legacy analysis, migration docs). Shared: types.ts requires Daguerre + Reynaud + Talbot.
[LEARNED] Screenwerk is a PRIVATE project (not Eesti Raudtee). Three repos: ScreenWerk/2026 (Nuxt 4, primary), ScreenWerk/Screenwerk-2025 (vanilla JS, reference), ScreenWerk/Screenwerk-2016 (Electron legacy, read-only). 2016 repo uses `master` not `main`. Key gap is publish pipeline.
[LEARNED] 2016 player is an Electron app that fetches same `{screenId}.json` from API, downloads media to local FS. JSON shape is essentially the same ScreenConfig. Key diff: desktop app with local file caching vs web PWA with Cache API.
[PATTERN] For products with active clients hitting bugs, team must have dual tracks: (1) urgent bugfixes on live system, (2) parallel transition to new system. Work streams, not sequential phases.
[PATTERN] Advisory specialists (non-TDD, non-coding) are valid when expertise crosses TDD pair boundaries. Talbot advises both pipeline and player pairs on Entu semantics. Melies feeds gap analysis into both pairs' test specs.
[GOTCHA] Client communication is PO-only — agents draft, Mihkel sends. Must be explicit in common-prompt.
[GOTCHA] TDD pair is non-negotiable PO constraint — every dev team must have explicit builder+tester pairs (per entu-research pattern). Initial 4-agent design was corrected through two rounds to final 7.

## Hires Delivered (cumulative — 46 agents)

Added: Lumiere (SW TL), Daguerre (SW), Niepce (SW), Talbot (SW), Reynaud (SW), Plateau (SW), Melies (SW) — 7 agents, 2026-04-07.

## Session 2026-04-08 / 2026-04-09 — Discussions #46 and #47

[CHECKPOINT] Authored `topics/09-development-methodology.md` as synthesis of both discussions. This is my reference document for team design going forward.
[DECISION] PURPLE is the seventh canonical role (Refactorer, opus). Oracle is the eighth canonical role (Callimachus, opus[1m]). ARCHITECT is a Spec Writer specialization at L2.5.
[DECISION] Three tiers (Sprint / Standard / Cathedral) apply to BOTH XP pipeline adoption AND Oracle adoption. Standard-tier teams use team-lead-as-librarian at shutdown — no dedicated Oracle.
[DECISION] Temporal ownership is the third isolation model after branch and directory ownership. New to T06.
[DECISION] Shared vs separate PURPLE: determined by domain distance between pipelines, not team size. screenwerk-dev would get separate PURPLEs in Cathedral tier (Node.js pipeline vs Vue composables = medium distance).
[PATTERN] When synthesizing multi-round discussions into topic files: preserve disagreements in a Part 4 "Open questions" section, don't smooth over. Monte/Medici/Celes disagree on research team wiki domain — documented, not hidden.
[PATTERN] Four-round discussion protocol works: initial specialist responses → PO response → refinements → specialist pushback → PO new questions → synthesis. Takes ~2 sessions but converges on high-quality decisions.
[GOTCHA] Corrected my round 1 position on Oracle model tier (sonnet → opus[1m]) after PO's sole-gateway decision changed the consequence-of-error profile. Being willing to correct publicly is more valuable than being right on the first try.
[LEARNED] #46 has only 5 comments (initial specialist responses, no PO rounds yet). All PO rounds so far are on #47. Round 5 is seeded on both.

## Session 2026-04-09 — T09 v2 Binary Calls

[DECISION] 3-tier model preserved (Sprint/Standard/Cathedral). Finn's argument is load-bearing: "below Sprint is not a tier, it's the absence of methodology — three tiers map to where judgment lives." Herald's 4-tier proposal rejected. Framing clarified: tiers describe where judgment lives, not team size.
[DECISION] L2.5 governance level DROPPED. Finn's argument: ARCHITECT's authority is bounded (one story) and temporary (idle between stories), not structural. Kept Monte's scope-authority framing and delegation matrix rows but removed L2.5 label. T04 gets delegation rows without a new hierarchy level.
[DECISION] Shared PURPLE is the Cathedral default. Reframed around structural consistency (Herald's correction), added Monte's authority caveat (shared PURPLE flags cross-pipeline patterns to ARCHITECT via Oracle, does not extract them itself). Domain distance remains the decision variable.
[DECISION] #14 research team wiki domain: three-track structure (wiki/process/ + wiki/observations/ + wiki/findings/). Monte and Medici converged. Closes #14.
[DECISION] PURPLE grace period: integrate Volta's git-state watchdog AND Monte's 5-min clock with team-lead authority. They compose. Four exit states.

[PATTERN] When multiple specialists reach the same recommendation through different reasoning, preserve all three arguments — they validate each other.
[PATTERN] Operational additions from lifecycle/governance specialists often slot in with zero ambiguity. Structural disagreements (L2.5 vs Spec Writer, 3 vs 4 tier) require binary calls.
[PATTERN] Brunel's resource-constraint dimension is legitimately new. "Host capacity" is a deployment reality our tier model was missing. Degraded Cathedral is the escape hatch.
[LEARNED] Herald caught a drift in my synthesis: I attributed "ARCHITECT idle during execution" to him as "always idle" when his actual position was "passively available between events." Corrected.
[LEARNED] Finn's reference-team data (~304 lines, ~35 team-wide entries, ~12 wiki pages, ~30 min curation) is the strongest empirical evidence in either discussion. Cited directly in T09 v2.
[GOTCHA] Herald's "context bleed" framing was speculative. Reframed around structural consistency.

## Deferred (carried forward)

[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.
[DEFERRED] hr-devs design files need two corrections before deployment: roster.json (remove medici+eilama) and common-prompt.md (members list). Optional: tighten arvo step 7 wording.

(*FR:Celes*)
