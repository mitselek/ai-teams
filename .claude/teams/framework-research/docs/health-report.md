# Framework Research — Knowledge Health Report (Audit v5, 2026-03-14)

(*FR:Medici*)

## Summary

Fifth audit. **Major progress since v4:** T03 gained Protocol 4 (inter-team transport specification — UDS + GitHub Issues knowledge layer), T06 gained container lifecycle sections (state preservation tiers, container isolation requirements). New infrastructure: Dockerfile, docker-compose.yml, session scripts, comms-dev team fully provisioned. Two new agents active since v4: Brunel (containerization) and Herald (protocol design, session 2). Volta produced lifecycle scripts (restore-inboxes.sh, persist-inboxes.sh).

**9 recommendations total (3 HIGH, 3 MEDIUM, 3 LOW)**

**Overall health: GOOD — significant forward progress, two blocking gaps reduced to one**

---

## 1. [COHERENCE] — Are topic files consistent with each other?

**Status: IMPROVED (from v4)**

### Positive coherence signals (verified):

- T03 Protocol 4 (Herald) explicitly references T06 container model (Volta/Brunel) — shared Docker volume for inter-team comms aligns with docker-compose.yml
- T03 Protocol 4 transport spec references Protocol 1 (Handoff), Protocol 2 (Topology), Protocol 3 (Broadcast) correctly — layered design is consistent
- T06 lifecycle scripts (restore-inboxes.sh, persist-inboxes.sh) implement the Phase 4a/Phase 4 Restore patterns documented in the protocol
- T06 container isolation (Brunel) and T02 resource isolation are consistent — both describe behavioral isolation with shared workspace
- T03 attribution format (`(*TEAM:Agent*)`) is consistent with actual practice across all topic files

### Key tensions:

1. **T03 → T04 manager agent dependency — STILL BLOCKING but REDUCED.** Herald's Protocols 1-3 assume a manager agent exists. T04 still has no manager agent design. However, Protocol 4's UDS transport works without a manager agent (point-to-point sockets). The transport layer is independent; the routing/governance layer still depends on T04.

2. **T03 Protocol 4 → T05 Identity gap.** Protocol 4 specifies TLS-PSK encryption with Docker secrets for inter-team transport. T05 (Identity) documents only current shared-credential state and doesn't reference the new PSK-based inter-team auth. These should cross-reference.

3. **T06 container model → T02 isolation.** Brunel's container design (shared repo-data volume, per-team claude-home volumes) is a concrete resource isolation proposal, but T02 doesn't reference it. T02 still reads as "current state only, no proposals" — the container model IS a proposal.

---

## 2. [EXTRACTION] — Have patterns from reference/ been extracted into topics?

**Status: DONE (unchanged) + NEW SOURCE MATERIAL**

All 8 original Finn extraction sections remain complete. No new reference material added to `reference/`.

**New source:** The comms-dev team (`/.claude/teams/comms-dev/`) is now a reference implementation for the framework's own inter-team communication design. Its roster (Vigenere, Babbage, Kerckhoffs), common-prompt, and agent prompts contain patterns not yet extracted into topics:

| Pattern | Source | Relevant topic |
|---|---|---|
| Cross-team code review via GitHub Issues | Volta scratchpad, Issues #3-#6 | T03, T08 |
| TDD across agent boundaries (Kerckhoffs writes tests, Babbage implements) | Volta scratchpad | T04 (governance), T07 (quality gates) |
| Provider adapter pattern for crypto/transport | comms-dev implementation | T02 (isolation seam design) |

**Recommendation:** These are not urgent extractions — comms-dev is still v1. Flag for Finn when comms-dev matures.

---

## 3. [GAP] — What's missing? Which topics are thin?

**Updated gap ranking:**

| Topic | Gap severity | v4 severity | Change | Key missing element |
|---|---|---|---|---|
| T04 Hierarchy & Governance | **HIGH** | HIGH | unchanged | Manager agent layer design absent — Protocols 1-3 depend on it |
| T02 Resource Isolation | **HIGH** → **MEDIUM** | HIGH | improved | Container model (Brunel) is a concrete proposal, but not integrated into T02 |
| T05 Identity & Credentials | **HIGH** | HIGH | unchanged | Per-team credential scoping — only current state documented |
| T08 Observability | MEDIUM | MEDIUM | unchanged | Implementation mechanisms for metrics, dashboards, cost tracking |
| T01 Taxonomy | MEDIUM | MEDIUM | unchanged | Multi-team agent membership and team-type lifecycle |
| T07 Safety | LOW | LOW | unchanged | Circuit breaker and runaway detection design |
| T03 Communication | **LOW** → **VERY LOW** | LOW | improved | Most open questions now resolved by Protocols 1-4 |
| T06 Lifecycle | **LOW** → **VERY LOW** | LOW | improved | Container lifecycle + scripts address most gaps |

**Key changes:**
- T02 drops from HIGH to MEDIUM: Brunel's container model provides concrete isolation proposals (per-team volumes, shared comms volume). The gap is now integration into the topic file, not missing design work.
- T03 drops to VERY LOW: Protocol 4 resolved the transport mechanism question. Remaining opens are edge cases (cross-team Finn, broadcast ACK).
- T06 drops to VERY LOW: Container lifecycle, state preservation tiers, lifecycle scripts all added. Remaining opens are minor (daemon shutdown, multi-team startup coordination).

**Top blocking gap remains T04** — manager agent layer design.

---

## 4. [CONTRADICTION] — Do any files contradict each other?

**Status: 4 items (2 carried, 2 new)**

### 4a. finn.md team size claim — STILL STALE (3rd audit)

`memory/finn.md` line 14: "Team size: 3 agents (team-lead opus-4-6, finn opus-4-6, medici sonnet-4-6)"

**Reality:** roster.json has 7 members (team-lead, finn, medici, celes, volta, herald, brunel). All opus-4-6 except brunel (sonnet-4-6).

**Severity:** Low — scratchpad text, not authoritative. But persists across 3 audits.

### 4b. README.md status column — STILL STALE (3rd audit)

README.md shows all 8 topics as "brainstorm". Updated actual status:

| Topic | README says | Actual status |
|---|---|---|
| T01 Taxonomy | brainstorm | drafting |
| T02 Isolation | brainstorm | drafting (container model adds proposals) |
| T03 Communication | brainstorm | **advanced draft** (4 inter-team protocols + transport spec) |
| T04 Hierarchy | brainstorm | brainstorm+ |
| T05 Identity | brainstorm | brainstorm+ |
| T06 Lifecycle | brainstorm | **advanced draft** (canonical protocol + scripts + container lifecycle) |
| T07 Safety | brainstorm | drafting |
| T08 Observability | brainstorm | drafting |

**Severity:** Medium — newcomer confusion. Elevated to recommendation.

### 4c. NEW — roster.json workDir path (Celes flagged)

`roster.json` line 5: `"workDir": "$HOME/Documents/github/mitselek-ai-teams"` — uses a dash, not slash. Actual repo path uses `mitselek/ai-teams`. This was flagged by Celes (scratchpad line 87) and is documented in T06 Phase 0 as a known issue. Still unfixed.

**Severity:** Medium — any script using roster.json's workDir will fail path resolution.

### 4d. NEW — T06 $HOME validation is Windows-specific but platform moved to Linux

T06 Phase 2.0a includes `$HOME` validation with a Windows/Git Bash fallback (`/c/Users/$(whoami)`). Volta's scratchpad notes "Platform moved Windows→Linux. All hardcoded paths replaced." But T06 still contains the Windows-specific fallback. The scripts (restore-inboxes.sh, persist-inboxes.sh) correctly use `$SCRIPT_DIR` (platform-independent), but the protocol text in T06 still references the Windows path.

**Severity:** Low — the scripts are correct; the protocol text is documentary and slightly stale.

---

## 5. [STALE] — Are scratchpads current and pruned?

| Scratchpad | Lines | Limit | Status | Issues |
|---|---|---|---|---|
| memory/finn.md | ~46 | 100 | **Stale item** | "Team size: 3" wrong (now 7). `[DEFERRED]` about `topics/02-roles.md` may be stale. |
| memory/medici.md | ~43 | 100 | **Will update** | Current content is v4 — updating now |
| memory/celes.md | ~89 | 100 | **Near limit** | 89/100 lines. All entries valid. Session 2026-03-14 section adds 6 lines. |
| memory/volta.md | ~36 | 100 | Current | Rich session content, all entries valid |
| memory/herald.md | ~40 | 100 | Current | Good — all decisions valid, checkpoint accurate |
| memory/brunel.md | ~38 | 100 | Current | Good — implementation complete, WIP/DEFERRED items tracked |
| memory/team-lead.md | ~12 | 100 | Current | Sparse but valid for session state |

**Concerns:**
- celes.md at 89% capacity. Next session will likely exceed 100 lines. Needs pruning — the "Domain Mental Model" section (lines 9-41) duplicates topic file content and could be reduced to references.
- finn.md stale claim persists across 3 audits. Risk of permanent staleness.

---

## 6. [PROMOTE] — Scratchpad entries worth adding to prompts or common-prompt

| Entry | Source | Promote to | Priority |
|---|---|---|---|
| "Almost everything is behavioral/prompt-enforced, not infrastructure-enforced" | celes.md | common-prompt as design principle | Medium |
| "Real incidents drive design" | celes.md | common-prompt as design principle | Medium |
| TDD across agent boundaries pattern (Kerckhoffs→Babbage) | volta.md | T07 Safety or T04 Governance (quality gate pattern) | Low |
| Cross-team code review via GitHub Issues | volta.md | T08 Observability (audit trail pattern) | Low |

---

## Cross-Topic Dependencies

| Dependency | Status | Why it matters |
|---|---|---|
| **T03 → T04** | **BLOCKING** | Protocols 1-3 assume manager agent; T04 hasn't designed it |
| T03 Protocol 4 → T05 | NEW | Transport encryption (TLS-PSK) is an identity/credential concern |
| T06 container → T02 | NEW | Container volumes are a resource isolation mechanism |
| T01 → T06 | unchanged | Team taxonomy drives lifecycle |
| T04 → T07 | unchanged | Governance defines permission tiers |
| T05 → T02 | unchanged | Credential scoping is resource isolation |

**Recommendation (carried + new):** Add "Related topics" cross-references to topic file headers. NEW: T03 and T06 are now tightly coupled via container transport — explicit cross-reference needed.

---

## What Changed Since v4

| Item | v4 Status | v5 Status | Change |
|---|---|---|---|
| T03 content | 3 inter-team protocols | **4 protocols + transport spec** | Protocol 4 (UDS + GitHub Issues) added |
| T06 content | Canonical protocol + amendments | **+ container lifecycle + scripts** | State preservation tiers, container isolation, lifecycle scripts |
| Roster | 6 members, all opus | **7 members** (+ brunel, sonnet) | Brunel added |
| comms-dev team | Did not exist | **Fully provisioned** | 3 agents, common-prompt, prompts, implementation started |
| Container infra | Did not exist | **Dockerfile + compose + scripts** | Full container setup by Brunel |
| T02 gap | HIGH | **MEDIUM** | Container model provides isolation proposals |
| T03 gap | LOW | **VERY LOW** | Transport mechanism resolved |
| T06 gap | LOW | **VERY LOW** | Container lifecycle + scripts |
| finn.md stale claim | 2 audits stale | **3 audits stale** | Still not fixed |
| README status | All "brainstorm" | **Still all "brainstorm"** | 3 audits stale |
| roster.json workDir | Not flagged | **Flagged by Celes** | mitselek-ai-teams (dash) vs mitselek/ai-teams (slash) |

---

## Recommendations (for team-lead)

### HIGH

**H1. T04 Hierarchy: Manager agent layer design** (carried from v4, 4th time)
Herald's T03 Protocols 1-3 depend on an entity that T04 hasn't defined. This is the single remaining blocking cross-topic dependency. Now more urgent: Protocol 4's hub-routed topology needs the manager agent to function. Candidate assignment: Herald (protocol expertise) or new Governance Architect.

**H2. README.md status column update** (elevated from MEDIUM)
3 audits stale. All 8 topics show "brainstorm" but T03 and T06 are at "advanced draft". This is the project's public face — inaccurate status misleads newcomers and understates progress. Low-effort fix.

**H3. roster.json workDir fix**
`mitselek-ai-teams` (dash) should be `mitselek/ai-teams` (slash). Any script consuming this field will break. One-line fix.

### MEDIUM

**M1. T02 Resource Isolation: Integrate container model**
Brunel's container design (per-team volumes, shared comms volume, shared repo) is a concrete resource isolation proposal that should be reflected in T02. Currently T02 still reads "only current state, no proposals."

**M2. Cross-reference T03 ↔ T05 on transport encryption**
Protocol 4 introduces TLS-PSK for inter-team comms. T05 should reference this as the first concrete per-team credential (PSK per Docker compose deployment).

**M3. celes.md pruning**
At 89/100 lines and growing. The "Domain Mental Model" section (30+ lines) duplicates topic file summaries. Replace with topic file references to free ~20 lines.

### LOW

**L1. finn.md stale claim cleanup** (3 audits running)
"Team size: 3 agents" is wrong (now 7). Finn should fix on next spawn.

**L2. T06 Windows path fallback cleanup**
Phase 2.0a still contains Windows/Git Bash `$HOME` fallback. Platform is now Linux. The scripts are correct (platform-independent); the protocol text is slightly stale.

**L3. Add "Related topics" cross-references to topic headers**
Carried from v4. T03↔T06 coupling (container transport) makes this more valuable now.
