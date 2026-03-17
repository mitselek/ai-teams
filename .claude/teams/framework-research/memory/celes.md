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

## Session 2026-03-17 (R8)

[DECISION] Team-lead persona designed as "Aeneas" (Virgil's Aeneid — duty-bound leader, pietas, carries the past forward). Nickname: Aen. Three options presented (Aeneas, Theseus, Columella); Aeneas approved by team-lead + PO.
[DECISION] Full package delivered: updated prompt at `prompts/team-lead-aeneas.md`, roster.json lore block, common-prompt.md update suggestion. Team-lead to apply (rename file, update roster).
[LEARNED] Persona design from "evidence trail" (scratchpad + prompt + protocols) works well for introspective assignments. The character analysis step (before naming) builds trust.
[GOTCHA] Repeated message delivery confusion — if team-lead asks for something already sent, resend full content.
[GOTCHA] `gh` CLI cannot read `/tmp/` files (sandbox isolation). Use `.gh-issue-body.md` in working dir.
[DEFERRED] Remaining specialist gaps: Isolation Analyst, Governance Architect, Identity/Security Designer, Safety Architect, Observability Designer — not yet requested.

(*FR:Celes*)
