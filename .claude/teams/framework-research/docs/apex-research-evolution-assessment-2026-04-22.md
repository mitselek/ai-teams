# Apex-Research Team Evolution Assessment

**Date:** 2026-04-22
**Commissioned by:** PO
**Authors:** (*FR:Finn*) git history, (*FR:Celes*) design evolution, (*FR:team-lead*) framework alignment synthesis
**Repo assessed:** `Eesti-Raudtee/apex-migration-research`
**Live container:** RC `100.96.54.170:2222` (user `ai-teams`)

---

## 1. Git History Evolution (*FR:Finn*)

### 1.1 Timeline

- **First commit:** 2026-02-13
- **Latest commit:** 2026-04-22
- **Total commits:** 387 across ~10 weeks

| Month | Commits |
|-------|---------|
| Feb 2026 | 11 |
| Mar 2026 | 286 |
| Apr 2026 (to date) | 90 |

### 1.2 Weekly Cadence

| Week | Commits | Notes |
|------|---------|-------|
| W06 (Feb 9-15) | 10 | Project bootstrap |
| W07-W08 | 1 | Dormant |
| W09 | 1 | CLAUDE.md update |
| W11 (Mar 10-16) | 253 | **Explosive spike** — container deployed, dashboard scaffolded, bulk analysis |
| W12 | 3 | Cool-down |
| W13 | 44 | Steady analysis |
| W14 | 14 | Lighter week |
| W15 | 15 | ADR drafting, glossary pilot |
| W16 (current) | 46 | Re-acceleration — DB probes, source extraction, dashboard features |

**Pattern:** Single explosive week (W11) when the AI agent team went live in its container, followed by a sustained plateau of 14-46 commits/week. Pace re-accelerated in W16.

### 1.3 Contributors

| Author | Commits | % |
|--------|---------|---|
| apex-research | 342 | 88% |
| Mihkel Putrinsh | 45 | 12% |

The "apex-research" author is the AI agent team operating inside a Docker container. Mihkel acts as PO/reviewer — his commits are predominantly PR merges, ADR drafts, and session-boundary orchestration. 17 merge commits from GitHub (PR merges).

### 1.4 Content Evolution — Phases

| Phase | Period | Commits | Description |
|-------|--------|---------|-------------|
| Bootstrap | Feb 13-16 | ~10 | Project setup, extraction scripts, initial inventories (57 apps, 2120 pages), ADR-001. Solo PO work. |
| Dormant | Feb 17 — Mar 3 | 1 | Planning period. |
| Team deployment + sprint | Mar 4-17 | ~253 | Container deployed. AI team goes live. Dashboard scaffolded. Bulk analysis. |
| Steady analysis | Mar 18 — Apr 12 | ~75 | Deep dives — EA model, TAF/TAP, Juhendid, helpdesk, glossary. PRs with issue numbers. |
| Current phase | Apr 13-22 | ~46 | Librarian deployment, DB mapping probes, source document re-extraction, dashboard enhancements. |

### 1.5 Artifact Landscape

| Directory | File touches | Role |
|-----------|-------------|------|
| inventory/ | 1,892 | Core data — app inventories, extractions, probes |
| dashboard/ | 489 | SvelteKit visualization dashboard |
| docs/ | 163 | Wiki entries, analysis docs |
| .claude/ | 163 | Agent team config, memory, scratchpads |
| shared/ | 138 | Shared Python libraries (json_cli, glossary) |
| specs/ | 136 | Specifications, source documents |
| decisions/ | 50 | ADRs (Architecture Decision Records) |
| scripts/ | 45 | Python extraction/analysis scripts |
| tests/ | 24 | Test files |

Key outputs: 14 ADRs (ADR-0001 through ADR-0014), 39 wiki entries, SvelteKit dashboard with multiple views, 956 DB tables mapped across 7 schemas, source document extraction pipeline with table/image preservation.

### 1.6 Branch/PR Patterns

Mixed workflow: most work lands directly on main (agent commits). Larger features go through feature branches with GitHub PRs (7 merged PRs visible). Issue tracker at #103 — active backlog throughput.

15 branches total. Feature branches follow `<issue-num>-<slug>` convention (e.g., `53-ea-model-deep-dive`, `67-helpdesk-frequency-view`).

### 1.7 Recent Activity (Apr 8-22)

61 commits in 2 weeks. Key themes:

- Eratosthenes (librarian) bootstrapped as 6th team member (#57-#59)
- Oracle-to-librarian rename across infra
- ADR decisions dashboard view, helpdesk frequency view
- DOKOSIGN ADR blocker resolution (SMGS e-signature scope)
- Juhendid Phase 1 indexing (7+ medium-priority files)
- Auth complexity deep-dive (25 schemes mapped to 11 roles)
- ADR-0013 (Migration Wave Priority via Silence Gap), ADR-0014 (Wagon Record Amendment)
- Jira VJS1 full-dataset analysis
- DB tables probe (956 tables, 730 DB-only across 7 schemas)
- Source document re-extraction with preserved tables and images
- json_cli library generalized from glossary CLI

---

## 2. Team Design Evolution (*FR:Celes*)

### 2.1 Roster Changes

| Member | Design | Live | Change |
|--------|--------|------|--------|
| schliemann (TL) | opus-4-6 | opus-4-7 | Model upgrade |
| champollion | sonnet-4-6 | sonnet-4-6 | — |
| nightingale | sonnet-4-6 | sonnet-4-6 | — |
| berners-lee | sonnet-4-6 | sonnet-4-6 | — |
| hammurabi | opus-4-6 | opus-4-7 | Model upgrade; **not spawned in current runtime** |
| eratosthenes | — | sonnet-4-6 (roster) / opus-4-6[1m] (runtime) | **Added post-deployment** |

Team grew from 5 to 6 with the addition of Eratosthenes (librarian). agentType renamed from `"oracle"` to `"librarian"` (Pass 2 complete). Two agents upgraded to opus-4-7. Hammurabi is on roster but not active — team right-sizes organically by spawning only what's needed.

### 2.2 Prompt Evolution

**Original 5 prompts: UNCHANGED.** All five agent prompts (schliemann.md, champollion.md, nightingale.md, berners-lee.md, hammurabi.md) are byte-identical between the shipped design and the live container. Zero edits in 10 weeks and 387 commits.

**New prompt: eratosthenes.md** — 482 lines (38.7KB), the largest prompt on the team. Key structural sections:

- Dual-hub routing rule (front-loaded)
- Path Convention ($REPO vs $HOME disambiguation — born from a real deployment bug)
- Model tier justification (why opus[1m])
- Four Capabilities table with Phase 2 volume gate (15 entries + 10 queries)
- Decision Matrix for classification
- Three protocols: A (submission), B (query), C (promotion)
- Dedup Protocol with 4 outcomes
- Batch Intake rules (transferred from FR Session 3)
- Wiki provenance frontmatter spec
- "Prior Librarian Experience" — lessons transferred from Callimachus (FR)

### 2.3 Common-Prompt Changes

Design snapshot: 153 lines. Live version: significantly expanded.

Major additions:

- **Dual-Hub Routing** — the largest structural addition. Two communication hubs (team-lead for work, Eratosthenes for knowledge), routing table with examples, Protocol A/B shapes.
- **Directory ownership table** expanded with wiki/ row (Eratosthenes sole writer)
- **Context Management section** — 200K budget guidance, executor vs planner context strategies, brief self-containment rule, `/compact` guidance
- **Scratchpad tags** expanded with `[SUBMITTED]` for Protocol A tracking
- **Quality Audits** clarification: "Eratosthenes is NOT an auditor"

### 2.4 Wiki / Knowledge State

Eratosthenes is active and productive:

| Metric | Value |
|--------|-------|
| Total entries | 39 |
| Queries served | 2 |
| Current phase | 1 (Incremental Bootstrap) |
| Phase 2 gate | entries 39/15 MET, queries 2/10 NOT MET |

**Breakdown by directory:**

| Directory | Count | Sample topics |
|-----------|-------|---------------|
| patterns/ | 23 | Train numbers, legacy URLs, helpdesk frequency, carrier visibility, dispatch protocols, IFTMIN/SMGS, auth proliferation, schema landscape (48 schemas), APEX collection staging |
| gotchas/ | 13 | Carrier isolation broken, KA-9 notebook leak, proceeder misnomer, wagon inspector off-system, zombie job, commented exception handlers |
| decisions/ | 2 | Dislokatsiooni-muudatus preserved, wagon amendment ADR proposal |
| contracts/ | 1 | Confluence materjalid source registration |
| archive/ | 0 | Empty |

Wiki index is well-maintained (8.8KB) with structured tables per subdirectory and a bootstrap state block.

### 2.5 Memory / Scratchpad State

| Agent | Size | Current Focus |
|-------|------|---------------|
| schliemann | 16.5KB | Session 16: docx extraction pipeline, image extraction, dashboard image serving. Prior sessions: glossary, json_cli, DB mapping (48 schemas), silence gap |
| berners-lee | 8.7KB | Dashboard — source document viewer, image serving, chapter navigation, markdown rendering |
| champollion | 3.4KB | Extraction tooling — docx table extractor, image extraction, vmerge fix |
| nightingale | 3.4KB | Re-extraction runs, table preservation, source document analysis |
| hammurabi | 2.1KB | Spec writing (less recent activity) |
| eratosthenes | 2.0KB | Wiki curation, knowledge submissions processing |

### 2.6 Operational Maturity Indicators

- `aliases.sh` — shell aliases for agent management (`ar-remove-member`, `ar-respawn`)
- `tmux-spawn-guide.md` — pane map, spawn order, manual spawn instructions
- `startup.md` — evolved read order (5 items), spawn order updated (Eratosthenes first)
- Inbox state: ~731KB across 6 agents (team-lead's inbox alone is 368KB)
- 16+ sessions completed with clean shutdown/restore cycles

---

## 3. Framework Alignment (*FR:team-lead*)

Cross-referencing the empirical data from dimensions 1 and 2 against FR's framework design (topics/01-08, wiki 45 entries).

### 3.1 Where Apex-Research VALIDATES the Framework

**T01 Team Taxonomy** — Clean "Cathedral" instance. 6 members, stable roster, clear role separation. Librarian added as specialist role, not a refactor. Hammurabi's dormancy shows organic right-sizing — agents that don't have current work simply don't spawn.

**T03 Communication** — Dual-hub routing (work + knowledge) is the strongest empirical validation FR has produced. Routing table in common-prompt matches FR's pattern exactly. Timestamping convention in use. Protocol A/B/C shapes live and productive (39 wiki entries filed through Protocol A).

**T06 Lifecycle** — 16+ sessions with clean shutdown/restore cycles. Scratchpads maintained across sessions. Inbox persistence works (731KB state). Startup.md read-order pattern transferred successfully from FR. 11 explicit session-state commits in git history.

**T04 Hierarchy/Governance** — Team-lead delegates, doesn't implement. Git evidence: 88% agent commits, 12% PO commits. PRs for larger changes, direct-to-main for routine work. Matches the "team-lead + PO review" governance shape.

**T02 Resource Isolation** — Container-based isolation on RC works. `network_mode: host` pattern inherited from FR's runbook. Named volumes, SSH access, port allocation (2222) all follow documented patterns.

### 3.2 Where Apex-Research DIVERGES from the Framework

**Prompt stability is surprising.** Original 5 prompts are byte-identical to the shipped design — zero evolution in 10 weeks and 387 commits. FR's prompts get revised every few sessions (Celes audited and patched Finn + Brunel's prompts in a single session). Either apex-research prompts were better-designed upfront, or the team has undocumented conventions that compensate for prompt gaps.

**Model upgrades happened without framework governance.** Two agents moved to opus-4-7 — a model generation change, not a minor update. No ADR or wiki entry covers the decision. FR's framework doesn't yet have a model-upgrade protocol. Apex-research did it organically; the gap is in the framework, not in the team.

**Wiki Phase 2 gate is NOT MET despite 39 entries.** Eratosthenes has 39 entries (well above 15-entry threshold) but only 2 queries served (needs 10). The wiki is write-heavy, read-light — agents file knowledge but don't query the librarian. FR's Callimachus shows the same pattern. Cross-team signal that Protocol B (query) has a friction problem.

**No cross-team knowledge flow yet.** Apex-research has 39 wiki entries, FR has 45. Zero entries have flowed between them. The xireactor-pilot was designed for exactly this — but the cross-tenant write path hasn't shipped yet. This is the strongest empirical argument for completing the xireactor deployment: 84 wiki entries across two teams with no bridge.

**Branch/PR discipline is looser than FR.** Most work lands directly on main. Feature branches used inconsistently. FR doesn't have a branch-discipline standard either — both teams evolved the same pattern independently. Worth codifying.

### 3.3 Framework Gaps Apex-Research Reveals

| Gap | Framework topic | Evidence | Recommendation |
|-----|----------------|----------|----------------|
| No model-versioning protocol | T02/T04 | Two agents upgraded opus-4-6 → opus-4-7 with no documented decision | Define who decides, who documents, who verifies behavior on model upgrades |
| Protocol B friction | T03 | Two teams, same pattern: agents write to wiki but don't query it (2/10 queries on 39 entries) | Reduce Protocol B ceremony, or surface wiki content proactively via bootstrap-preamble (#43) |
| Prompt maturity curve undocumented | T01 | Apex prompts stable after 10 weeks; FR prompts revised frequently | Name the "prompt stabilization" phase transition so new teams know when to stop revising |
| Burst-then-sustain cadence unmodeled | T06 | W11 = 253 commits, then 14-46/week sustained | If consistent across teams, should inform capacity planning for new team deployments |
| Cross-team knowledge bridge absent | T03 | 84 wiki entries (39+45) across two teams, zero flow | Complete xireactor pilot cross-tenant write path; or formalize Finn-style quarterly harvest passes |
| Branch discipline uncodified | T09 | Both teams independently converged on "direct-to-main + PR for reviewed changes" | Codify as framework recommendation in T09 |

### 3.4 Maturity Assessment

Apex-research is the most mature deployed team in the framework. Evidence:

- **Longevity:** 10 weeks continuous operation, 16+ sessions, 387 commits
- **Output volume:** 14 ADRs, 39 wiki entries, SvelteKit dashboard, 956 DB tables mapped, source extraction pipeline
- **Team stability:** Original 5 prompts untouched, one role added (librarian), organic right-sizing (Hammurabi dormant when not needed)
- **Operational maturity:** Startup guides, aliases, spawn order docs, context management rules — all self-generated, not imposed by FR
- **Knowledge layer:** Active librarian producing real domain knowledge (railway operations, Oracle APEX migration analysis)

The team has transitioned from the "setup and configure" phase into a "produce and refine" steady state. This is the first FR-designed team to reach this maturity level, and its patterns should be treated as empirical ground truth for the framework — not just reference material.

---

## Appendix: Key Artifacts

| Artifact | Location |
|----------|----------|
| Apex-research repo | `Eesti-Raudtee/apex-migration-research` (GitHub) |
| Design snapshot | `mitselek-ai-teams/designs/deployed/apex-research/` |
| Live container | `ai-teams@100.96.54.170:2222` |
| Team config (repo) | `/home/ai-teams/workspace/.claude/teams/apex-research/` |
| Wiki | `/home/ai-teams/workspace/.claude/teams/apex-research/wiki/` |
| Scratchpads | `/home/ai-teams/workspace/.claude/teams/apex-research/memory/` |
| FR wiki (comparison) | `mitselek-ai-teams/.claude/teams/framework-research/wiki/` |
| Xireactor pilot | `mitselek-ai-teams/containers/xireactor-pilot/` |

(*FR:team-lead*)
