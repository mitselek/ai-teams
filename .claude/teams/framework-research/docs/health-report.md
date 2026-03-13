# Framework Research — Knowledge Health Report (Audit v3, 2026-03-13)

(*FR:Medici*)

## Summary

Third audit, first post-restart. **Major progress since v2:** all 8 topic files now have `## Patterns from Reference Teams (*FR:Finn*)` sections with substantial extracted content. Volta wrote a full canonical lifecycle protocol into T06. Herald designed 3 inter-team communication protocols in T03. The team is no longer at "brainstorm" — most topics are at "drafting" or better.

**Overall health: GOOD — substantial progress, some gaps remain**

---

## Restart Test Evaluation

Evaluating success criteria from `docs/restart-test.md`:

### SC-1: Self-orientation — PASS

| # | Criterion | Result |
|---|---|---|
| 1a | Team name and mission | PASS — common-prompt.md clearly states `framework-research`, mission: design multi-team AI agent framework |
| 1b | All 6 roster members with roles | PASS — roster.json lists 6 members: team-lead, finn, medici, celes, volta, herald |
| 1c | Startup procedure | PASS — common-prompt.md On Startup section exists |
| 1d | Canonical lifecycle protocol | PASS — topics/06-lifecycle.md has full startup/shutdown protocol |

### SC-2: Startup protocol execution — PARTIAL

| # | Criterion | Result |
|---|---|---|
| 2a | Stale team dir handled correctly | PASS — team is running |
| 2b | TeamCreate succeeds | PASS — team is operational |
| 2c | Inboxes restored | UNKNOWN — cannot verify from my position |
| 2d | Medici spawned first | PASS — I was spawned and am running the audit |

### SC-3: Agent continuity — PARTIAL (only Medici spawned so far)

| # | Criterion | Result |
|---|---|---|
| 3a | Each agent reads scratchpad on startup | PASS (Medici) — I read my scratchpad and referenced session 3 checkpoint |
| 3b | No duplicate agents | PASS — no `-2` entries observed |
| 3c | Agents know prior work | PASS (Medici) — I know my prior audit history, scratchpad state |

### SC-4: Work product continuity — MOSTLY PASS

| # | Criterion | Result |
|---|---|---|
| 4a | topics/06-lifecycle.md has canonical protocol | **PASS** — Volta's full startup/shutdown protocol, duplicate prevention gate, spawning paths, cross-session handover, stale-team recovery all present |
| 4b | topics/03-communication.md has Herald's design | **PASS** — 3 protocols (handoff, topology, broadcast governance), attribution design, 6 open questions |
| 4c | All 8 topic files have Finn's extracted patterns | **PASS** — every topic file has `## Patterns from Reference Teams (*FR:Finn*)` with substantial content |
| 4d | Celes's specialist gap analysis in scratchpad | **PASS** — memory/celes.md has full 8-topic domain model with specialist gap table |

### SC-5: Protocol correctness — PARTIAL

| # | Criterion | Result |
|---|---|---|
| 5a | No TeamDelete called | PASS — team dir existed at session start |
| 5b | Shutdown closing messages in scratchpads | PASS — all 5 scratchpads have dated entries from session 3 with appropriate tags |
| 5c | Task snapshot exists | **FAIL** — no `memory/task-list-snapshot.md` found |

### Restart Test Verdict

**SC-1 and SC-2 (must-pass): PASS** — fundamental protocol works.
**SC-3 through SC-5 (should-pass): MOSTLY PASS** — 1 failure (missing task snapshot).

**Recommendation:** Task snapshot should be part of the shutdown checklist enforcement. Team-lead should create `memory/task-list-snapshot.md` during Phase 4 (Persist) of shutdown.

---

## 1. [COHERENCE] — Are topic files consistent with each other?

**Status: PASS (improved from v2)**

Cross-references now exist implicitly through Finn's extraction sections — multiple topics reference the same operational patterns (e.g., `spawn_member.sh`, team-lead restrictions, attribution). No terminological contradictions found.

**Positive coherence signals:**
- T06 (lifecycle) and T03 (communication) both reference the same shutdown reporting protocol — consistent descriptions
- T04 (hierarchy) and T07 (safety) both describe team-lead tool restrictions — identical lists
- T01 (taxonomy) and T06 (lifecycle) both describe `spawn_member.sh` vs Agent tool — consistent

**Tension still unresolved:** T01 "Can an agent belong to multiple teams?" — still open, still load-bearing for T02, T05, T07.

---

## 2. [EXTRACTION] — Have patterns from reference/ been extracted into topics?

**Status: DONE**

All 8 topic files now have `## Patterns from Reference Teams (*FR:Finn*)` sections with material extracted from both reference implementations. This was the Priority 1 action from v2.

| Topic | Finn section present | Content quality |
|---|---|---|
| T01 Team Taxonomy | Yes | Rich — agent types table, team configs, model tiering |
| T02 Resource Isolation | Yes | Good — git isolation, worktree, branch strategy, DB naming, rate limits |
| T03 Communication | Yes | Excellent — 7 patterns + Herald's 3 inter-team protocols |
| T04 Hierarchy & Governance | Yes | Good — team-lead restrictions, anti-patterns table, governance rules |
| T05 Identity & Credentials | Yes | Good — credential listing, loading pattern, Figma rate-limit protocol |
| T06 Lifecycle | Yes | Excellent — creation, spawning, duplicate prevention, handover, shutdown, Eilama, plus Volta's canonical protocol |
| T07 Safety & Guardrails | Yes | Good — prompt-level guardrails, peer enforcement, quality gates, worktree isolation |
| T08 Observability | Yes | Good — Medici pattern, shutdown reports, attribution, dashboard, known pitfalls |

---

## 3. [GAP] — What's missing? Which topics are thin?

**Updated gap ranking (significant changes from v2):**

| Topic | Gap severity | Key missing element |
|---|---|---|
| T02 Resource Isolation | HIGH | D1 migration serialization and deployment locking still have no proposals — only current state documented |
| T04 Hierarchy & Governance | HIGH | Manager agent layer design is absent — only current flat hierarchy described. Governance rules section is still placeholder |
| T05 Identity & Credentials | HIGH | Per-team credential scoping still has no proposal — only current (shared) state documented |
| T08 Observability | MEDIUM | What-to-track list solid, but implementation mechanisms (metrics collection, dashboards, cost tracking) are entirely missing |
| T01 Taxonomy | MEDIUM | Elastic vs fixed roster answered (fixed roster, elastic active config), but multi-team agent membership and team-type lifecycle (when to create/dissolve specialty teams) unresolved |
| T07 Safety | LOW | Well-structured. Circuit breaker and runaway detection design still needed |
| T03 Communication | LOW (was HIGH) | Herald's protocols cover inter-team handoff, topology, and broadcast governance. Remaining: cross-team message delivery mechanism and cross-team Finn |
| T06 Lifecycle | LOW (was HIGH) | Volta's canonical protocol is comprehensive. Remaining: inbox backup atomicity, daemon shutdown protocol, multi-team startup coordination |

**Biggest gap shift:** T03 and T06 moved from HIGH to LOW — Herald and Volta did excellent work.

---

## 4. [CONTRADICTION] — Do any files contradict each other?

**Status: MINOR — 2 items found**

### 4a. Finn's scratchpad model claim vs roster.json

Finn's scratchpad says: "Team size: 3 agents (team-lead opus-4-6, finn opus-4-6, medici sonnet-4-6)" — but roster.json shows 6 members, and medici is now opus-4-6. This was accurate when written but is now stale.

**Severity:** Low — scratchpad text, not authoritative.
**Fix:** Finn should update on next startup.

### 4b. Health report v2 gap table vs actual state

The health report v2 (previous version of this file) listed T06 as HIGH gap and T03 as HIGH gap. Both are now substantially filled by Volta and Herald respectively. This report (v3) supersedes.

**Severity:** None — self-correcting (this report replaces v2).

---

## 5. [STALE] — Are scratchpads current and pruned?

| Scratchpad | Lines | Limit | Status | Issues |
|---|---|---|---|---|
| memory/celes.md | ~80 | 100 | Current | None — comprehensive domain model, all entries valid |
| memory/finn.md | ~41 | 100 | **Stale item** | Line 14: "Team size: 3 agents" is wrong (now 6). `[DEFERRED]` about `topics/02-roles.md` may be resolved |
| memory/herald.md | ~17 | 100 | Current | Clean, all entries valid |
| memory/medici.md | ~49 | 100 | Current | Will update after this audit |
| memory/volta.md | ~17 | 100 | Current | Clean, all entries valid |

**All under 100-line limit.** One stale item in finn.md (team size claim).

---

## 6. [PROMOTE] — Scratchpad entries worth adding to prompts or common-prompt

| Entry | Source | Promote to |
|---|---|---|
| Cross-cutting pattern: "Almost everything is behavioral/prompt-enforced, not infrastructure-enforced" | celes.md | Could go in common-prompt as a design principle |
| Pattern: "Real incidents drive design" | celes.md | Could go in common-prompt as a design principle |

---

## Cross-Topic Dependencies (new section)

These topic files depend on each other but don't explicitly cross-reference:

| Dependency | Why it matters |
|---|---|
| T01 → T06 | Team taxonomy drives lifecycle (project teams are long-lived, specialty teams are temporary) |
| T03 → T04 | Communication topology depends on governance hierarchy (who may broadcast, who routes messages) |
| T04 → T07 | Governance defines permission tiers that safety enforces |
| T05 → T02 | Credential scoping is a form of resource isolation |
| T06 → T01 | Lifecycle phases differ by team type (but T06 doesn't reference T01) |

**Recommendation:** Add a "Related topics" one-liner to each topic file header.

---

## Recommended Next Steps (for team-lead)

**Priority 1 — T04 Hierarchy: Manager agent layer design**
The manager agent is referenced in T03 (Herald's protocols assume it exists) but T04 has no design for it. This is now the biggest coherence gap — Herald designed protocols for an entity that T04 hasn't defined. Candidate: a new specialist or delegate to an existing agent.

**Priority 2 — T02 Resource Isolation: D1 + deployment proposals**
T02 has the current state well-documented but no proposals for multi-team resource management. Needs a concrete design (migration serialization, deployment queuing, per-team DB instances).

**Priority 3 — T05 Identity: Multi-team credential scoping proposal**
Similar to T02 — current state documented, future state not designed. Per-team tokens, rotation, audit-by-identity.

**Priority 4 — README status column update**
All 8 topics still show "brainstorm" in README.md but most are now at "drafting". Update the table.

**Priority 5 — Create task-list-snapshot.md**
Missing from shutdown — needed for SC-5c compliance.
