# Framework Research — Knowledge Health Report (Audit v4, 2026-03-13)

(*FR:Medici*)

## Summary

Fourth audit, second cold start. **State since v3:** task-list-snapshot.md now exists (SC-5c resolved). Volta's scratchpad grew with 3 amendments from restart test field data. No other topic or scratchpad changes since v3. The team is stable and coherent — primary work remains in the HIGH-gap topics (T04, T02, T05).

**Overall health: GOOD — stable, no regressions, known gaps unchanged**

---

## 1. [COHERENCE] — Are topic files consistent with each other?

**Status: PASS (unchanged from v3)**

Cross-references remain implicitly consistent through Finn's extraction sections. No terminological contradictions.

**Positive coherence signals (verified):**
- T06 (lifecycle) and T03 (communication) — same shutdown reporting protocol, consistent
- T04 (hierarchy) and T07 (safety) — identical team-lead tool restrictions
- T01 (taxonomy) and T06 (lifecycle) — consistent spawn path descriptions
- T03 (Herald's protocols) and T06 (Volta's lifecycle) — both reference manager agent; neither contradicts

**Key tension (still unresolved):**
- T03 assumes a manager agent exists (Herald's protocols route through it). T04 has no manager agent design. This is the single biggest cross-topic dependency.
- T01 "Can an agent belong to multiple teams?" — still open, impacts T02, T05, T07.

---

## 2. [EXTRACTION] — Have patterns from reference/ been extracted into topics?

**Status: DONE (unchanged from v3)**

All 8 topic files have `## Patterns from Reference Teams (*FR:Finn*)` sections. No new reference material has been added since v3, so extraction remains complete.

| Topic | Finn section | Content quality |
|---|---|---|
| T01 Team Taxonomy | Yes | Rich — agent types table, team configs, model tiering |
| T02 Resource Isolation | Yes | Good — git isolation, worktree, branch strategy, DB naming, rate limits |
| T03 Communication | Yes | Excellent — 7 intra-team patterns + Herald's 3 inter-team protocols |
| T04 Hierarchy & Governance | Yes | Good — team-lead restrictions, anti-patterns table, governance rules |
| T05 Identity & Credentials | Yes | Good — credential listing, loading pattern, Figma rate-limit protocol |
| T06 Lifecycle | Yes | Excellent — Volta's canonical protocol + 3 restart-test amendments |
| T07 Safety & Guardrails | Yes | Good — prompt-level guardrails, peer enforcement, quality gates |
| T08 Observability | Yes | Good — Medici pattern, shutdown reports, attribution, dashboard |

---

## 3. [GAP] — What's missing? Which topics are thin?

**Updated gap ranking (unchanged from v3 — no new content added to gap topics):**

| Topic | Gap severity | Key missing element |
|---|---|---|
| T04 Hierarchy & Governance | **HIGH** | Manager agent layer design absent — Herald's T03 protocols depend on it |
| T02 Resource Isolation | **HIGH** | D1 migration serialization, deployment locking — only current state, no proposals |
| T05 Identity & Credentials | **HIGH** | Per-team credential scoping — only current (shared) state documented |
| T08 Observability | MEDIUM | Implementation mechanisms for metrics, dashboards, cost tracking missing |
| T01 Taxonomy | MEDIUM | Multi-team agent membership and team-type lifecycle unresolved |
| T07 Safety | LOW | Circuit breaker and runaway detection design still needed |
| T03 Communication | LOW | Cross-team message delivery mechanism and cross-team Finn pattern open |
| T06 Lifecycle | LOW | Inbox backup atomicity, daemon shutdown protocol, multi-team startup coordination |

**No gap movement since v3.** The HIGH-gap topics (T04, T02, T05) need specialist attention.

---

## 4. [CONTRADICTION] — Do any files contradict each other?

**Status: MINOR — 2 items (1 carried from v3, 1 resolved)**

### 4a. Finn's scratchpad team size claim — STILL STALE

`memory/finn.md` line 14: "Team size: 3 agents (team-lead opus-4-6, finn opus-4-6, medici sonnet-4-6)"

**Reality:** roster.json has 6 members, all on opus-4-6. This was flagged in v3 and in the task-list-snapshot. Still not updated (Finn not yet spawned this session).

**Severity:** Low — scratchpad text, not authoritative.
**Fix:** Finn should update on next startup.

### 4b. README.md status column — STILL STALE

README.md shows all 8 topics as "brainstorm". Multiple topics are now at "drafting" or better:

| Topic | README says | Actual status |
|---|---|---|
| T01 Taxonomy | brainstorm | drafting (patterns extracted, composition model clear) |
| T02 Isolation | brainstorm | brainstorm+ (patterns extracted, no proposals yet) |
| T03 Communication | brainstorm | drafting (3 inter-team protocols designed) |
| T04 Hierarchy | brainstorm | brainstorm+ (patterns extracted, manager agent undefined) |
| T05 Identity | brainstorm | brainstorm+ (patterns extracted, no proposals yet) |
| T06 Lifecycle | brainstorm | **advanced draft** (canonical protocol written + tested + amended) |
| T07 Safety | brainstorm | drafting (permission categories, enforcement patterns clear) |
| T08 Observability | brainstorm | drafting (Medici pattern, attribution, dashboard documented) |

**Severity:** Medium — the README is the first thing a newcomer reads. Inaccurate status misleads.
**Fix:** Team-lead should update the status column.

---

## 5. [STALE] — Are scratchpads current and pruned?

| Scratchpad | Lines | Limit | Status | Issues |
|---|---|---|---|---|
| memory/celes.md | ~80 | 100 | Current | Approaching limit (80/100). All entries valid. |
| memory/finn.md | ~41 | 100 | **Stale item** | Line 14: "Team size: 3 agents" is wrong (now 6). `[DEFERRED]` about `topics/02-roles.md` may be stale. |
| memory/herald.md | ~17 | 100 | Current | Clean, all entries valid |
| memory/medici.md | ~40 | 100 | **Stale** | Will update after this audit — current content is from session 4, needs session 5 checkpoint |
| memory/volta.md | ~28 | 100 | Current | Comprehensive, all entries valid with restart test amendments |

**All under 100-line limit.** finn.md stale item persists from v3. celes.md at 80% capacity — monitor.

### task-list-snapshot.md — NOW EXISTS

**v3 finding resolved:** `memory/task-list-snapshot.md` was created during session 4 shutdown (SC-5c now passes). Content accurately reflects: 2 completed items (Medici audit v3, Volta amendments), 3 not-started items from priorities, 2 minor deferred items.

---

## 6. [PROMOTE] — Scratchpad entries worth adding to prompts or common-prompt

| Entry | Source | Promote to | Priority |
|---|---|---|---|
| "Almost everything is behavioral/prompt-enforced, not infrastructure-enforced" | celes.md | common-prompt as design principle | Medium |
| "Real incidents drive design" | celes.md | common-prompt as design principle | Medium |

Same as v3 — still valid recommendations.

---

## Cross-Topic Dependencies

Unchanged from v3:

| Dependency | Why it matters |
|---|---|
| **T03 → T04** | Herald's inter-team protocols assume manager agent exists; T04 hasn't designed it. **BLOCKING.** |
| T01 → T06 | Team taxonomy drives lifecycle (project = long-lived, specialty = temporary) |
| T04 → T07 | Governance defines permission tiers that safety enforces |
| T05 → T02 | Credential scoping is a form of resource isolation |
| T06 → T01 | Lifecycle phases differ by team type (T06 doesn't reference T01) |

**Recommendation (carried from v3):** Add a "Related topics" one-liner to each topic file header.

---

## What Changed Since v3

| Item | v3 Status | v4 Status | Change |
|---|---|---|---|
| SC-5c task-list-snapshot | FAIL | **PASS** | Created during session 4 shutdown |
| Volta scratchpad | 17 lines | 28 lines | 3 amendments from restart test |
| finn.md "Team size: 3" | Stale | **Still stale** | Finn not spawned since v3 |
| README status column | All "brainstorm" | **Still all "brainstorm"** | Not yet updated |
| Topic file content | — | **Unchanged** | No new content since v3 |
| Roster | 6 members, all opus | **Same** | No changes |

---

## Recommended Next Steps (for team-lead)

**Priority 1 — T04 Hierarchy: Manager agent layer design** (carried from v3)
Herald's T03 protocols depend on an entity that T04 hasn't defined. This is a **blocking** cross-topic dependency. Candidate assignment: Herald (protocol expertise) or a new Governance Architect specialist (per Celes's gap analysis).

**Priority 2 — README.md status column update** (elevated from P4)
Low effort, high impact. All 8 topics still show "brainstorm" but most have progressed. Newcomer confusion risk.

**Priority 3 — T02 Resource Isolation: D1 + deployment proposals** (carried from v3)
Current state documented; future state not designed. Needs concrete multi-team resource management design.

**Priority 4 — T05 Identity: Multi-team credential scoping** (carried from v3)
Similar to T02 — current state documented, proposals needed.

**Priority 5 — finn.md stale claim cleanup**
Minor, but persists across 2 audits. Finn should fix "Team size: 3 agents" on next spawn.
