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

## Hires Delivered (cumulative — 24 agents)

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

## Session 2026-03-18 (R9)

[DECISION] T01 updated: Data Flow Architecture section (pipeline vs independent-output). Hybrid Teams corrected (trunk, not worktree). Common-prompt table updated.
[DECISION] RFC #3 Q4: No TDD split for apex-research Berners-Lee — strengthen test mandate instead. Roster well-balanced at 5.
[DECISION] polyphony-dev full redesign: 8 agents, music-themed lore, TL upgraded sonnet→opus, Polly→Victoria (Requirements Analyst).
[DECISION] Finn scratchpad exception pattern: read-only agent gets one-file write permission for personal scratchpad.
[DECISION] Spec quality audit (ARMSPV + wagon-maintenance): builder-ready, 5 gaps identified, 2 partially addressed after re-push. Team-designable from spec alone (demonstrated with 5-agent ARMSPV team sketch).
[LEARNED] First cross-project roster design (polyphony-dev). Music domain enables thematic lore coherence.
[LEARNED] Finn's gap analysis (8 items vs reference teams) is a checklist for prompt quality — use in future designs.
[LEARNED] Spec-to-team-design is a valid audit method: "could I staff a migration team from this spec alone?" reveals gaps that content review misses.
[DEFERRED] Remaining FR specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] polyphony-dev common-prompt.md needs update: new agent names, author attribution `(*PD:<Agent>*)`, TDD workflow with new names.

(*FR:Celes*)
