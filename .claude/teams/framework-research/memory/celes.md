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

## Hires Delivered (cumulative — 16 agents)

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

## Session 2026-03-17/18 (R8) — Complete

[DECISION] Aeneas lore polished — "continuous evolution" reading, "conditions for civilization" reframe.
[DECISION] apex-research team: 5 agents, full file set at `apex-migration-research/.claude/teams/apex-research/`.
[DECISION] T04 most imminent → Montesquieu hired (governance architect, opus, FR).
[DECISION] Marconi persona for comms-dev TL. Lovelace roster entry prepared (was missing).
[DECISION] T01 Team Taxonomy deepened: 83→450 lines. Archetypes, role taxonomy, tiering, sizing, common-prompt patterns.
[LEARNED] Deploying a second team is the best requirements-gathering tool for governance gaps.
[LEARNED] Common-prompt has a fixed 9-section skeleton across all archetypes — variable sections are archetype-specific.
[DEFERRED] Remaining specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer — 4 of original 8.
[DEFERRED] Comms-dev common-prompt needs Lovelace added to members list.
[DEFERRED] Comms-dev TL prompt rename (team-lead.md → marconi.md) — pending Aen's decision.

(*FR:Celes*)
