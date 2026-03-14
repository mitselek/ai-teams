# Celes — Scratchpad

*Agent Resources Manager, framework-research team*

[GOTCHA] Scratchpad path is `.claude/teams/framework-research/memory/celes.md` — NOT `memory/celes.md` at repo root.

---

## Domain Mental Model (from topics/01–08)

### 01 — Team Taxonomy

[LEARNED] Three team types: project (long-lived, full-stack), function (cross-project, e.g. QA/Security), specialty (narrow, temporary). Roster is fixed; active configuration is elastic (subsets per task type). Open question: can an agent belong to multiple teams? Needed specialist type: **Team Architect** — someone who can reason about optimal composition, specialization boundaries, and when to spin up/tear down a team type.

### 02 — Resource Isolation

[LEARNED] Git isolation is behavioral (branch naming, worktree, serial ownership). D1 migration conflicts unresolved. Rate limits unmanaged (except Figma protocol). No per-team deployment queue. Needed specialist type: **Isolation/Conflict Analyst** — maps resources (git, DB, deploy, APIs) to conflict scenarios and designs isolation policies. Could also be a sub-task for a general Research Analyst.

### 03 — Communication

[LEARNED] Timestamped NL messages. Mandatory reporting (no silent idle). Research broker (Finn). Attribution on all persistent output. Language split (Estonian user-facing / English dev-facing). Needed specialist type: **Protocol Designer** — designs message schemas, inter-team handoff conventions, broadcast governance. Could also model communication topologies (hub-and-spoke vs. mesh).

### 04 — Hierarchy & Governance

[LEARNED] Current: flat 2-level (PO → team-lead → specialists). Manager agent layer is a framework goal but not implemented. Team-lead is coordinator-only, enforced by prompt + peer accountability. Jira is human-gated. Needed specialist type: **Governance Architect** — designs approval authority matrix, manager agent scope, escalation paths, anti-pattern tables.

### 05 — Identity & Credentials

[LEARNED] All teams share one credential set. Attribution is honor-based. No escalation path for permissions. Figma rate-limit produced the most concrete discipline protocol. Needed specialist type: **Security/Identity Designer** — per-team credential scoping, rotation protocols, audit-by-identity, least-privilege profiles. High-stakes domain (small mistakes = real secrets exposed).

### 06 — Lifecycle

[LEARNED] Creation always human-triggered. Startup sequence is well-documented (backup inboxes, remove stale dir, TeamCreate, spawn Medici first). `spawn_member.sh` > Agent tool (model correctness). Duplicate prevention via config.json check. Scratchpad tags structure cross-session memory. Eilama shows non-Claude agents can share the lifecycle. Needed specialist type: **Lifecycle/State Engineer** — designs handover protocols, context compression rules, stale-team recovery, non-Claude agent integration patterns.

### 07 — Safety & Guardrails

[LEARNED] All guardrails are prompt-level (behavioral), not infrastructure. Team-lead restrictions are the primary blast radius control. Peer enforcement is the accountability mechanism. Known Pitfalls section is a living safety checklist. Cyrillic homoglyph detection is a content-safety edge case. Needed specialist type: **Safety Architect** — designs permission tiers, circuit breakers, blast radius containment, runaway detection. Must reason about both intentional and accidental violations.

### 08 — Observability

[LEARNED] Medici = periodic health audit agent. Shutdown reports = structured session audit trail. Attribution = post-hoc artifact audit. Dashboard = real-time PO delivery. Task tools = lightweight activity log. NOT tracked: token costs, API costs, context usage, error rates, idle detection. Needed specialist type: **Observability Designer** — designs metrics schema, real-time vs. async reporting, cross-team rollups, cost tracking, anomaly detection rules.

---

## Specialist Gaps (preliminary — not yet a hire request)

| Domain | Gap | Candidate role concept |
|---|---|---|
| Taxonomy | Composition reasoning | Team Architect |
| Isolation | Multi-resource conflict policy | Isolation Analyst |
| Communication | Inter-team protocol design | Protocol Designer |
| Governance | Manager-agent layer, approval matrix | Governance Architect |
| Identity | Per-team credentials, audit trail | Identity/Security Designer |
| Lifecycle | Cross-session state, non-Claude integration | Lifecycle Engineer |
| Safety | Prompt-level vs infra guardrails | Safety Architect |
| Observability | Metrics, cost tracking, anomaly detection | Observability Designer |

[DECISION] These are conceptual gaps, not confirmed hires. Team-lead decides which to pursue.
[DECISION] Lifecycle Engineer hire approved (2026-03-13). Designed as "Volta" (Alessandro Volta — battery/cycle lore). Prompt at `prompts/volta.md`. Model: sonnet. Roster entry prepared for team-lead to merge.

---

## Key Cross-Cutting Observations

[PATTERN] Almost everything is behavioral/prompt-enforced, not infrastructure-enforced. This is a consistent design choice — but it also means the framework cannot enforce guarantees, only norms.

[PATTERN] Real incidents drive design: Figma rate-limit → access protocol; known pitfalls section; cyrillic homoglyphs → audit script. The framework evolves from pain, not theory.

[PATTERN] The `spawn_member.sh` evolution (away from Agent tool) shows the framework maturing to respect model-tier correctness. Role design must account for model cost.

[GOTCHA] Topics 01–08 all have "open questions" that are genuinely unresolved — not placeholders. Specialist roles in this team should help close those questions, not assume they're already answered.

## Session State (2026-03-13, continued)

[LEARNED] Naming standard broadened: classical literature AND historical figures both accepted. Volta (Alessandro Volta) approved by PO.
[DECISION] Protocol Designer hire: prompt drafted at `prompts/herald.md`. Three name options presented: Herald (Hermes Trismegistus, recommended), Nuncio (Papal diplomacy), Cadmus (Greek mythology/alphabet). Model: sonnet. Color: green. Awaiting PO name pick.
[DEFERRED] Remaining specialist gaps: Isolation Analyst, Governance Architect, Identity/Security Designer, Safety Architect, Observability Designer — not yet requested.
[GOTCHA] Repeated message delivery confusion last session — if team-lead asks for something already sent, resend the full content rather than just pointing to a prior message.

## Session 2026-03-14

[DECISION] Brunel hire approved (2026-03-14). Designed as "Isambard Kingdom Brunel" (Victorian engineer — tunnels, ships, railways; containment and transport lore). Prompt at `prompts/brunel.md`. Model: sonnet. Color: yellow. Writes to 06-lifecycle.md (container sections), Docker config files, own scratchpad. Coordinates with Volta on lifecycle requirements.
[DECISION] Volta+Brunel coordination model: section ownership partition of 06-lifecycle.md + `[COORDINATION]` handshake protocol. Both prompts updated.
[DECISION] Brunel scope expanded: added compose architecture decisions (#7) and container networking (#8).
[DECISION] comms-dev team approved and fully provisioned (2026-03-14). Roster: Vigenere (crypto, opus, red), Babbage (backend, sonnet, blue), Kerckhoffs (QA/security, sonnet, green). All files at `.claude/teams/comms-dev/`. Includes GitHub Issues as cross-team knowledge base, `[COORDINATION]` handshake between Vigenere↔Babbage and Babbage↔Kerckhoffs.

(*FR:Celes*)
