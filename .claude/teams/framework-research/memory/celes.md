# Celes — Scratchpad

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `.claude/teams/framework-research/memory/celes.md` — NOT `memory/celes.md` at repo root.

---

## Domain Knowledge (stable — from topics/01–08)

[LEARNED] 8 specialist gaps identified: Team Architect, Isolation Analyst, Protocol Designer, Governance Architect, Identity/Security Designer, Lifecycle Engineer, Safety Architect, Observability Designer.
[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure. Real incidents drive design.
[PATTERN] `spawn_member.sh` > Agent tool for model-tier correctness.
[GOTCHA] Topics 01–08 have genuinely unresolved open questions — specialists should help close them.

## Hires Delivered (cumulative)

| Agent | Lore | Team | Model | Prompt | Date |
|---|---|---|---|---|---|
| Volta | Alessandro Volta | FR | sonnet→opus | `prompts/volta.md` | 2026-03-13 |
| Herald | Hermes Trismegistus | FR | sonnet→opus | `prompts/herald.md` | 2026-03-13 |
| Brunel | Isambard Kingdom Brunel | FR | sonnet | `prompts/brunel.md` | 2026-03-14 |
| Vigenere | Blaise de Vigenere | CD | opus | CD prompts | 2026-03-14 |
| Babbage | Charles Babbage | CD | sonnet | CD prompts | 2026-03-14 |
| Kerckhoffs | Auguste Kerckhoffs | CD | sonnet | CD prompts | 2026-03-14 |
| Richelieu | Cardinal Richelieu | L1 mgr | opus | `prompts/richelieu.md` | 2026-03-14 |
| Lovelace | Ada Lovelace | CD | sonnet | CD prompts | 2026-03-14 |
| Aeneas | Virgil's Aeneas | FR TL | opus | `prompts/team-lead-aeneas.md` | 2026-03-17 |
| Schliemann | Heinrich Schliemann | AR TL | opus | AR `prompts/schliemann.md` | 2026-03-17 |
| Champollion | Jean-Francois Champollion | AR | sonnet | AR `prompts/champollion.md` | 2026-03-17 |
| Nightingale | Florence Nightingale | AR | sonnet | AR `prompts/nightingale.md` | 2026-03-17 |
| Berners-Lee | Tim Berners-Lee | AR | sonnet | AR `prompts/berners-lee.md` | 2026-03-17 |
| Hammurabi | Hammurabi | AR | opus | AR `prompts/hammurabi.md` | 2026-03-17 |
| Montesquieu | Charles de Montesquieu | FR | opus | `prompts/montesquieu.md` | 2026-03-17 |

## Session 2026-03-17 (R8)

[DECISION] Aeneas lore polished — added "continuous evolution" reading, Anchises/Ascanius detail, "conditions for civilization" reframe. Applied to roster.json by team-lead.
[DECISION] apex-research team designed: 5 agents (Schliemann, Champollion, Nightingale, Berners-Lee, Hammurabi). Full roster, common-prompt, and 5 prompts written to `apex-migration-research/.claude/teams/apex-research/`. Attribution prefix: `(*AR:*)`.
[DECISION] T04 Hierarchy & Governance identified as most imminent underdeveloped topic. Rationale: apex-research deployment created concrete multi-team governance gaps (cross-team audit authority, spec approval chain, manager agent need).
[DECISION] Montesquieu hired as Governance Architect (opus, FR team). Owns T04. Coordination boundary with Herald defined (Volta/Brunel handshake pattern).
[LEARNED] Designing a second team reveals governance gaps that pure research doesn't surface. The act of deployment is the best requirements-gathering tool.
[LEARNED] Coordination boundary tables (like Volta/Brunel section ownership) are the key pattern for preventing write conflicts between agents sharing adjacent domains.
[DEFERRED] Remaining specialist gaps: Isolation Analyst, Identity/Security Designer, Safety Architect, Observability Designer — 4 of original 8 still open.

(*FR:Celes*)
