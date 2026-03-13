# Framework Research — Knowledge Health Report (Audit v2, 2026-03-13)

(*FR:Medici*)

## Summary

Second audit. No changes to topic files since session 1 — all 8 remain at "brainstorm" stub status. Finn's scratchpad confirms reference material has been indexed but not yet extracted into topics. The framework-research team is correctly structured with common-prompt.md, member prompts, and scratchpads in place.

**Overall health: STALE — no extraction progress since last audit**

---

## 1. [COHERENCE] — Are topic files consistent with each other?

**Status: PASS (unchanged from v1)**

All 8 topic files remain internally consistent. Terminology is compatible. No contradictions introduced.

Tension to watch (unchanged): T01 "Can an agent belong to multiple teams?" — still unresolved, still load-bearing for T02, T05, T07.

---

## 2. [EXTRACTION] — Have patterns from reference/ been extracted into topics?

**Status: NOT DONE — no change since v1**

Finn's scratchpad (session 1) documents the key differences between rc-team and hr-devs reference implementations. That analysis exists in `memory/finn.md` but has not been pushed into the topic files.

Two reference implementations are now fully indexed:

| Reference | Key patterns available |
|---|---|
| `reference/rc-team/cloudflare-builders/` | Spawning via Agent tool, flat memory/, inline startup in common-prompt, `(*RC-DEV:Name*)` attribution |
| `reference/hr-devs/` | `spawn_member.sh` shell spawning, memory/ + docs/ separation, canonical startup-shutdown.md, health-report cadence |

The extraction table from v1 (10 open-question/answer pairs) remains valid and unacted on.

---

## 3. [GAP] — What's missing? Which topics are thin?

**All topics still thin. No change from v1 ranking.**

| Topic | Gap severity | Key missing element |
|---|---|---|
| T06 Lifecycle | HIGH | No concrete handover mechanism described; two reference implementations exist to compare |
| T03 Communication | HIGH | No message schema, no channel/inbox design, no routing rules |
| T05 Identity | HIGH | Current state documented but no proposal for multi-team scoping |
| T04 Hierarchy | MEDIUM | Governance rules section is placeholder |
| T01 Taxonomy | MEDIUM | No decision on elastic vs fixed roster |
| T02 Resource Isolation | MEDIUM | No proposal for D1 migration serialization or deployment locking |
| T07 Safety | LOW | Permission categories well-structured; needs circuit-breaker detail |
| T08 Observability | LOW | What-to-track list solid; implementation mechanism missing |

**New gap identified this session:**

T06 Lifecycle now has TWO concrete reference implementations to compare (rc-team vs hr-devs differ significantly in spawning mechanism — Agent tool vs shell script). This comparison hasn't been extracted or analyzed yet. It's the highest-value extraction target.

---

## 4. [CONTRADICTION] — Do any files contradict each other?

**Status: NONE FOUND**

No new contradictions. The T07/MEMORY.md Jira wording tension noted in v1 remains (compatible but differently worded) — still not a contradiction.

---

## 5. [STALE] — Are scratchpads current?

| Scratchpad | Status |
|---|---|
| `memory/medici.md` | Current — written session 1, updated this session |
| `.claude/teams/framework-research/memory/finn.md` | Current — written session 1, contains valid index and pattern notes |

No stale scratchpads.

---

## Actions Taken This Session

| Action | Detail |
|---|---|
| Read all 8 topic files | Confirmed no changes since v1 |
| Read finn.md scratchpad | Confirmed rc-team vs hr-devs comparison was done but not extracted |
| Updated health-report.md | This document (v2) |
| Updated memory/medici.md | Added session 2 notes |

---

## Recommended Next Steps (for team-lead)

**Priority 1 — Extraction sprint (unchanged from v1):**
Finn should extract concrete patterns from reference/ into topic Notes sections. Starting point: the extraction table in v1 of this report (10 open-question/answer pairs). Finn already has the material indexed.

**Priority 2 — T06 Lifecycle comparison (new):**
Finn has documented that rc-team and hr-devs use fundamentally different spawning/handover mechanisms. This should be written up as a structured comparison in `topics/06-lifecycle.md` Notes — it's the clearest case where reference material directly answers an open question.

**Priority 3 — T03 Communication design:**
Still the most structurally undefined topic and a prerequisite for any multi-team coordination design. Needs a concrete proposal before other topics can converge.

**Priority 4 — README status column:**
All 8 topics still show "brainstorm". Once extraction begins, update to "drafting".
