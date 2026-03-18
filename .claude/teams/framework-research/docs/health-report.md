# Framework Research — Knowledge Health Report (Audit v6, 2026-03-18)

(*FR:Medici*)

## Summary

Sixth audit. **Major progress since v5:** T01 grew from 83→450 lines (Celes: archetypes, role taxonomy, model tiering, sizing, common-prompt patterns). T04 grew from ~103→770 lines (Montesquieu: 39-decision delegation matrix, manager agent design, emergency authority). T05 grew from 76→481 lines (Herald: 4-layer auth, credential passing, secrets management). T08 grew from 113→379 lines (Volta: 3-layer observability model, Medici formalization, alerting). T03 gained dispute handoff type + direct link lifecycle. apex-research team designed, containerized, and deployed autonomously (80 commits, 57 apps analyzed). Montesquieu hired (opus, governance architect). Total topic content: 4,614 lines across 8 files.

**12 recommendations total (3 HIGH, 5 MEDIUM, 4 LOW)**

**Overall health: GOOD — T04 manager agent gap RESOLVED (was blocking for 4 audits). T07 is now the primary concern.**

---

## 1. [COHERENCE] — Are topic files consistent with each other?

**Status: SIGNIFICANTLY IMPROVED (from v5)**

### Major coherence improvement:

- **T03 → T04 manager agent dependency: RESOLVED.** This was the single blocking cross-topic dependency flagged in audits v2–v5. Montesquieu's T04 now defines the manager agent role (§Manager Agent — Role Definition), delegation matrix (39 rows), authority boundaries, tool restrictions, and persistent state design. Herald's T03 Protocols 1-3 now have a concrete governance entity to reference.
- T04 delegation matrix Row 34 explicitly maps Medici's cross-team audit authority — consistent with T08's Medici formalization.
- T04 emergency authority protocol covers PO-unavailable scenarios — fills the governance gap that T07 (safety) couldn't address alone.
- T01 role taxonomy (6 canonical roles) is consistent with T04's hierarchy levels and T08's observability model.
- T05 credential escalation protocol explicitly references T04 delegation matrix and T07 permission categories ("Never" category).
- T03 direct link lifecycle references T04 delegation matrix Rows 27-28 — clean authority split between protocol mechanics (Herald) and authority model (Montesquieu).

### Remaining tensions:

1. **T07 Safety is thin relative to its cross-references.** T04, T05, and T08 all reference T07 permission categories, but T07 itself is only 120 lines — mostly Finn's extraction of current state. It lacks: circuit breaker design, runaway detection mechanisms, cascade failure prevention, and the formal permission tier model that other topics assume exists. T07 is now the weakest link in the framework.

2. **T02 → container model integration still pending.** Brunel's container design (docker-compose.yml, named volumes, network_mode: host) is a concrete resource isolation implementation, but T02 still reads as "patterns + deep research proposals." The implemented container model should be reflected as a validated pattern, not just a proposal. (Carried from v5 M1.)

3. **T03 Protocol 4 → T05 cross-reference still missing.** Protocol 4 specifies TLS-PSK encryption. T05 now has a full identity architecture but doesn't explicitly reference Protocol 4's PSK as the first concrete per-team credential. (Carried from v5 M2.)

4. **T06 Windows path fallback.** Phase 2.0a still contains Windows/Git Bash `$HOME` fallback (`/c/Users/$(whoami)`). The apex-research container runs Linux. Scripts are correct (platform-independent); protocol text is slightly stale. (Carried from v5 L2, low severity.)

---

## 2. [EXTRACTION] — Have patterns from reference/ been extracted into topics?

**Status: DONE for reference/ directory. NEW source: apex-research deployment.**

Original Finn extractions from `reference/rc-team/` and `reference/hr-devs/` remain complete.

**New empirical source: apex-research container deployment (2026-03-17/18).** Brunel's scratchpad documents 15+ deployment gotchas from real container operations. These are production-validated patterns not yet systematically extracted:

| Pattern | Source | Relevant topic |
|---|---|---|
| WARP tunnel causes Docker DNS failure + TLS interception | brunel.md | T02 (network isolation), T05 (credential/cert handling) |
| network_mode: host as WARP bypass | brunel.md | T02 (container networking) |
| OAuth credentials vs API key in containers | brunel.md, team-lead.md | T05 (credential injection) |
| Project-level .mcp.json for MCP server discovery | team-lead.md | T05 (MCP credential isolation) |
| `usermod -p '*'` for SSH pubkey auth with locked accounts | brunel.md | T06 (container setup gotchas) |
| Native Claude install (~/.local/bin/) vs npm global | brunel.md | T06 (container lifecycle) |

**Recommendation:** These are valuable operational patterns. Assign Finn to extract into T02/T05/T06 when those topics are next revised.

---

## 3. [GAP] — What's missing? Which topics are thin?

**Updated gap ranking:**

| Topic | Lines | Gap severity | v5 severity | Change | Key missing element |
|---|---|---|---|---|---|
| **T07 Safety** | 120 | **HIGH** | LOW | **ELEVATED** | Circuit breakers, runaway detection, cascade prevention, formal permission model |
| T02 Isolation | 791 | MEDIUM | MEDIUM | unchanged | Container model not integrated as validated pattern |
| T08 Observability | 379 | MEDIUM | MEDIUM | unchanged | Multi-team health rollup, automated alerting |
| T01 Taxonomy | 450 | LOW | MEDIUM | improved | Function teams not yet built (theoretical gap) |
| T05 Identity | 481 | LOW | HIGH | **improved** | Herald resolved all 5 original open questions |
| T04 Hierarchy | 770 | **VERY LOW** | **HIGH** | **RESOLVED** | Was blocking for 4 audits — now most complete governance doc |
| T03 Communication | 642 | VERY LOW | VERY LOW | unchanged | Edge cases only |
| T06 Lifecycle | 981 | VERY LOW | VERY LOW | unchanged | Most mature topic |

**Critical change:** T07 Safety is now the weakest topic by a significant margin.

- **T07 at 120 lines** vs average 577 lines across other 7 topics.
- T07 has no specialist owner. Volta owns T06, Herald owns T03, Montesquieu owns T04, Celes owns T01. T07 is orphaned — only Finn's extraction exists.
- T07's open questions (circuit breakers, runaway detection, cascade failures) are directly relevant to the apex-research team running autonomously in a container. If apex goes wrong, what stops it?
- Other topics (T04, T05, T08) reference T07's permission categories as if they're well-defined, but T07 only has a simple 4-tier list (Never / Human approval / Team lead / Any agent) with no design rationale, no enforcement mechanisms, and no scaling analysis.

**T04 and T05 are success stories.** Both went from HIGH gap to VERY LOW/LOW in one session. Montesquieu and Herald delivered substantial, well-structured content.

---

## 4. [CONTRADICTION] — Do any files contradict each other?

**Status: 6 items (2 resolved from v5, 2 carried, 4 total active)**

### Resolved since v5:

- **v5 H1 (T04 manager agent gap):** RESOLVED. Montesquieu delivered comprehensive T04 design.
- **v5 4a (finn.md team size):** PARTIALLY RESOLVED. Finn's scratchpad now says "Team size: 3 agents" at line 14 — actual roster has 8 members (team-lead, finn, medici, celes, volta, herald, brunel, montesquieu). Still wrong but the roster itself is authoritative.

### Active contradictions:

**4a. finn.md team size — STILL STALE (4th audit)**

`memory/finn.md` line 14: "Team size: 3 agents (team-lead opus-4-6, finn opus-4-6, medici sonnet-4-6)"

**Reality:** roster has 8 members. Medici is sonnet-4-6 per scratchpad, but common-prompt doesn't specify individual models.

**Severity:** Low — scratchpad text, not authoritative. But persists across 4 audits now.

**4b. README.md status column — STILL STALE (4th audit)**

README.md shows all 8 topics as "brainstorm". Updated actual status:

| Topic | README says | Actual status |
|---|---|---|
| T01 Taxonomy | brainstorm | **advanced draft** (450 lines, archetypes + roles + tiering + sizing) |
| T02 Isolation | brainstorm | **advanced draft** (791 lines, deep research + protocols R1-R5) |
| T03 Communication | brainstorm | **advanced draft** (642 lines, 4 protocols + transport spec) |
| T04 Hierarchy | brainstorm | **advanced draft** (770 lines, delegation matrix + manager agent + emergency) |
| T05 Identity | brainstorm | **advanced draft** (481 lines, 4-layer auth + secrets management) |
| T06 Lifecycle | brainstorm | **advanced draft** (981 lines, canonical protocol + container lifecycle) |
| T07 Safety | brainstorm | **drafting** (120 lines, extraction only) |
| T08 Observability | brainstorm | **advanced draft** (379 lines, 3-layer model + alerting) |

**Severity:** HIGH — 7 of 8 topics are at "advanced draft" but README says "brainstorm." This is the project's public face. Apex-research team or any newcomer seeing the README will drastically underestimate the framework's maturity.

**4c. roster.json workDir path — STILL UNFIXED (carried from v5)**

Uses `mitselek-ai-teams` — actual repo name. But the value should be a resolvable path, not just the repo name. Celes flagged this. T06 Phase 0 documents it as known. Still unfixed.

**Severity:** Medium — scripts consuming workDir will fail.

**4d. brunel.md exceeds 100-line scratchpad limit**

brunel.md is at 125 lines — 25% over the 100-line limit. Contains 15 `[GOTCHA]` entries from container deployment. All entries are valid and operationally valuable, but the scratchpad is oversized. Some entries could be promoted to T06 or a deployment-gotchas reference doc.

**Severity:** Medium — violates team standard. Content is valuable but needs relocation.

---

## 5. [STALE] — Are scratchpads current and pruned?

| Scratchpad | Lines | Limit | Status | Issues |
|---|---|---|---|---|
| brunel.md | 125 | 100 | **OVER LIMIT** | 25 lines over. 15 gotchas — valuable but should be promoted/relocated. |
| finn.md | 81 | 100 | **Stale item** | "Team size: 3" wrong (now 8). 4th audit flagging. |
| herald.md | 71 | 100 | Current | All entries valid. Good structure. |
| team-lead.md | 60 | 100 | Current | R8 session well-documented. Previous session notes could be pruned. |
| celes.md | 52 | 100 | **Improved** | Was 89 in v5 — pruned to 52. Good discipline. |
| volta.md | 35 | 100 | Current | Concise, all entries valid. |
| medici.md | 34 | 100 | **Will update** | This audit's findings. |
| montesquieu.md | 33 | 100 | Current | First session, well-structured. |

**Notable improvement:** celes.md dropped from 89→52 lines (pruned as recommended in v5 M3). Good response to audit feedback.

**Concern:** brunel.md at 125 lines is the only scratchpad over limit. The content is operationally critical (deployment gotchas that prevent repeating mistakes). Recommendation: promote the gotchas to a reference doc and keep scratchpad for decisions/checkpoints only.

---

## 6. [PROMOTE] — Entries worth promoting to persistent docs

| Entry | Source | Promote to | Priority |
|---|---|---|---|
| 15 container deployment gotchas | brunel.md | `docs/container-deployment-runbook.md` (already exists) or T06 | HIGH — solves brunel.md overflow AND preserves knowledge |
| Credential patterns (OAuth, .mcp.json, _FILE convention) | brunel.md, herald.md | T05 Identity | MEDIUM |
| "Behavioral enforcement first, infrastructure later" | celes.md, T02 | common-prompt design principles | MEDIUM |

---

## Previous Audit Findings — Status

| v5 Finding | v5 Priority | Current Status |
|---|---|---|
| H1: T04 manager agent design | HIGH | **RESOLVED** — Montesquieu delivered 770-line T04 |
| H2: README status column | HIGH | **STILL OPEN** — 4th audit, now worse (7/8 topics advanced) |
| H3: roster.json workDir fix | HIGH | **STILL OPEN** — 3rd audit |
| M1: T02 integrate container model | MEDIUM | **STILL OPEN** — container deployed, T02 not updated |
| M2: T03↔T05 cross-reference | MEDIUM | **STILL OPEN** — T05 expanded but no T03 reference |
| M3: celes.md pruning | MEDIUM | **RESOLVED** — pruned from 89→52 lines |
| L1: finn.md stale claim | LOW | **STILL OPEN** — 4th audit |
| L2: T06 Windows path fallback | LOW | **STILL OPEN** — low priority |
| L3: Cross-reference topic headers | LOW | **STILL OPEN** — not yet implemented |

**Regression rate:** 0% (no previously resolved findings regressed). 3 of 9 v5 findings resolved. 6 carried forward.

---

## Cross-Topic Dependencies

| Dependency | Status | Change from v5 |
|---|---|---|
| ~~**T03 → T04**~~ | **RESOLVED** | Was BLOCKING for 4 audits |
| T03 Protocol 4 → T05 | Open | Cross-reference needed |
| T06 container → T02 | Open | Container deployed, T02 not updated |
| T04 → T07 | **NEW concern** | T04 references T07 permissions, but T07 is thin |
| T05 → T07 | **NEW concern** | T05 references T07 "Never" category |
| T08 → T07 | **NEW concern** | T08 alerting references T07 permission tiers |
| T01 → T06 | Stable | Team taxonomy drives lifecycle |
| T05 → T02 | Stable | Credential scoping is resource isolation |

**Key observation:** T07 has become a dependency target for 3 other topics (T04, T05, T08) without having the substance to support those references. This is the inverse of the T04 problem from v2-v5: the references are outpacing the content.

---

## Recommendations (for team-lead)

### HIGH

**H1. T07 Safety & Guardrails needs a specialist owner and substantial expansion.**
At 120 lines, T07 is the thinnest topic by far (next thinnest: T08 at 379 lines). Three other topics (T04, T05, T08) reference T07's permission categories as if they're well-designed, but T07 only has a simple 4-tier list with no design rationale. With apex-research running autonomously in a container, safety is not theoretical — it's operational. Missing: circuit breaker design, runaway agent detection, cascade failure prevention, formal permission model with enforcement mechanisms, container-specific safety (what happens when an autonomous team goes wrong?).
**Suggested approach:** Assign to Montesquieu (governance expertise overlaps with safety) + Finn (research on safety patterns in multi-agent systems). Alternatively, hire a Safety Architect specialist.

**H2. README.md status column — 4th audit, increasingly misleading.**
7 of 8 topics are at "advanced draft" with 300-980 lines each. README shows all as "brainstorm." The apex-research team (or any newcomer) seeing this will drastically underestimate what exists. One-time fix, 5 minutes.

**H3. brunel.md exceeds 100-line limit — promote gotchas to reference doc.**
125 lines, 25% over limit. The 15 deployment gotchas are operationally critical but belong in `docs/container-deployment-runbook.md` (which already exists), not in a scratchpad. Pruning brunel.md to decisions/checkpoints only should bring it under 80 lines.

### MEDIUM

**M1. T02 Resource Isolation: integrate container model as validated pattern.** (Carried from v5.)
Brunel's container design is now deployed and running. T02 should reflect this as a proven pattern, not "future proposal."

**M2. T03↔T05 cross-reference on transport encryption.** (Carried from v5.)
T05 now has a full identity architecture. Add explicit reference to T03 Protocol 4's TLS-PSK.

**M3. Extract apex deployment patterns into topics.**
Brunel's 15 gotchas from real container deployment are valuable empirical data. Assign Finn to extract into T02 (network isolation), T05 (credentials), T06 (container lifecycle).

**M4. roster.json workDir fix.** (Carried from v5, downgraded from HIGH.)
Still unfixed after 3 audits. Downgraded because the team works around it, but scripts will break.

**M5. finn.md stale "Team size: 3" claim.** (Carried from v5, 4th audit.)
Elevating from LOW to MEDIUM — 4 audits is too long for a factual error to persist. Finn should fix on next spawn.

### LOW

**L1. T06 Windows path fallback cleanup.** (Carried from v5.)
Protocol text has Windows-specific path. Scripts are correct. Low impact.

**L2. Add "Related topics" cross-references to topic headers.** (Carried from v5.)
More valuable now that T04↔T07 and T05↔T07 dependencies are apparent.

**L3. common-prompt "Standards" section: add design principles.**
"Behavioral enforcement first, infrastructure later" and "real incidents drive design" (from celes.md) are team-wide principles worth codifying.

**L4. Team-lead scratchpad: prune R5-R7 notes.**
"Previous session notes (R5-R7)" section (lines 57-60) is sparse but aging. Either expand with useful context or remove to free space.
