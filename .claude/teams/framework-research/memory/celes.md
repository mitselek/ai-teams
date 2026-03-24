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

## Hires Delivered (cumulative — 39 agents)

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

## Deferred (carried forward)

[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.
[DEFERRED] hr-devs design files need two corrections before deployment: roster.json (remove medici+eilama) and common-prompt.md (members list). Optional: tighten arvo step 7 wording.

(*FR:Celes*)
