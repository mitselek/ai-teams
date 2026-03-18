# Team Taxonomy

Types and organization of AI agent teams.

## Team Archetypes (*FR:Celes*)

### Decision

Three team archetypes exist, defined by the relationship between their primary output and their tools.

| Archetype | Primary output | Code? | Examples |
|---|---|---|---|
| **Research** | Design docs, frameworks, specs | No (reference implementations only) | framework-research |
| **Development** | Working software | Yes (TDD mandatory) | cloudflare-builders, hr-devs, comms-dev |
| **Hybrid** | Design docs + internal tooling | Yes (bounded to support tools) | apex-research |

### Research Teams

**Defining trait:** Output is knowledge artifacts (topic files, specs, protocols), not production code. Agents write to `.md` files, not `.ts` files.

**Observed in:** framework-research (8 agents)

**Structural patterns:**
- Every agent owns a **topic file** as their primary output target (Volta → `06-lifecycle.md`, Herald → `03-communication.md`, Montesquieu → `04-hierarchy-governance.md`)
- **Section ownership tables** prevent write conflicts when two agents share adjacent domains (Volta/Brunel partition `06-lifecycle.md`)
- **Coordination handshake protocol** between agents with overlapping concerns: `[COORDINATION] Topic: X. My finding: Y. Proposed change to your section: Z.`
- **No git access** for agents — team-lead commits all work
- Team-lead is pure coordinator (SendMessage is the primary tool)

**When to use:** Designing frameworks, analyzing legacy systems, producing architecture decisions. The team's value is in the quality of its analysis, not in shipped features.

### Development Teams

**Defining trait:** Output is deployed software. TDD is mandatory. Agents write code, run tests, create PRs.

**Observed in:** cloudflare-builders (12 agents), hr-devs (9 agents), comms-dev (5 agents)

**Structural patterns:**
- **Tech stack defines roles:** frontend (sven/lovelace), backend (dag/babbage), QA (tess/kerckhoffs), CI/CD (piper)
- **Domain specialists** may be added and removed as workstreams complete (alex for APEX migration in cloudflare-builders — removed in hr-devs)
- **Code review agent** (marcus) is separate from implementers — provides independent quality gate
- **Named spawn configurations:** "full" (story work), "lite" (quick fix), "full-review" (with requirements verification)
- Agents own branches end-to-end: implement → test → commit → push → PR
- Team-lead reviews PRs but never writes code

**When to use:** Building and shipping applications. The team's value is in working, tested, deployed software.

### Hybrid Teams

**Defining trait:** Primary output is research/analysis, but the team also builds and maintains internal tooling (dashboards, analysis scripts) to support its research.

**Observed in:** apex-research (5 agents)

**Structural patterns:**
- **Data pipeline ownership** replaces topic file ownership: Champollion → `inventory/`, Nightingale → `shared/`, Berners-Lee → `dashboard/`, Hammurabi → `specs/`
- **Strict directory boundaries** prevent hybrid teams from devolving into pure-dev teams — each agent has a MAY WRITE list that excludes other agents' directories
- **Trunk-based development** — all agents commit to `main` because hybrid teams are pipeline teams (dev agents consume research agents' output files). Branch isolation breaks the data flow. Directory ownership is the isolation mechanism, not branches. (See "Data Flow Architecture" section below.)
- **Dual output formats:** Markdown (human-readable) + JSON (machine-consumable) from analysis agents
- Dev agents consume research agents' output via files, not via messaging

**When to use:** Reverse-engineering, migration analysis, any domain where you need both understanding (research) and visibility (tooling). The research is the primary value; the tooling makes the research navigable.

### Data Flow Architecture (*FR:Celes*)

Orthogonal to archetype (research/development/hybrid), every team has a **data flow architecture** that determines its isolation model. This is a design-time decision made during team creation — it constrains how agents can be spawned and how they share work.

| Data flow | Agent relationship | Isolation model | Git strategy |
|---|---|---|---|
| **Pipeline** | Sequential — each agent's input is another agent's output | Directory ownership on trunk | All agents commit to `main`; directories prevent conflicts |
| **Independent-output** | Parallel — agents produce separate outputs with no inter-agent data dependency | Branch/worktree isolation | Each agent on own branch; PRs to `main` |

**Pipeline teams** have a data dependency chain: `Source → Researcher → Analyst → Developer → Spec Writer`. Each stage reads the previous stage's output directory. If agents work on separate branches, the downstream agent's branch goes stale the moment an upstream agent commits — leading to merge conflicts, data drift, and rebase pain that compounds with every commit.

**Independent-output teams** have agents working on unrelated deliverables. Frontend and backend developers in a dev team don't read each other's output files. Branch isolation prevents accidental interference without data flow consequences.

**Evidence from apex-research (RFC #3, ADR-004):** The team was originally designed with worktree isolation for Berners-Lee (dashboard on `dashboard-dev` branch while researchers commit to `main`). In practice, 37 commits across 4 agents interleaved on `main` with zero conflicts — because directory ownership was sufficient. The worktree model was formally rejected: dashboard reads `shared/*.json` (Nightingale's output) and `inventory/*.json` (Champollion's output) at build time, so a separate branch goes stale immediately.

**Design-time rule:** When sculpting a team, determine the data flow architecture first. If any agent reads another agent's output files, the team is a pipeline — use directory ownership on trunk, not branch isolation. The `isolation: "worktree"` spawn option is only appropriate for independent-output agents within the same team.

| Archetype | Typical data flow | Why |
|---|---|---|
| Research | Independent-output | Each agent owns a topic file; no inter-agent data dependency |
| Development | Independent-output | Frontend/backend/QA produce separate artifacts; integration via APIs, not files |
| Hybrid | Pipeline | Research agents feed analysis data to dev agents and spec writers |

**Caveat:** This is the typical pattern, not a hard rule. A development team with a shared `types/` contract directory has a pipeline element — contract changes must be coordinated. apex-research solved this with "PRs required only for `types/` contract changes" while keeping everything else on trunk.

---

### Team Boundary Definition

What defines a team's boundary is not a single axis but a combination:

| Boundary type | Example | Implication |
|---|---|---|
| **Repo** | apex-research owns `apex-migration-research/` | File system isolation is natural |
| **Domain** | comms-dev owns inter-team communication | Multiple repos possible (shared with framework-research) |
| **Mission lifecycle** | apex-research disbands when specs are handed off | Team is temporary by design |
| **Output type** | framework-research produces docs, comms-dev produces code | Determines archetype |

Most teams have a **dominant boundary** (repo for dev teams, domain for research teams) with secondary boundaries as constraints.

---

## Agent Role Taxonomy (*FR:Celes*)

### Decision

Six canonical agent roles recur across all observed teams. Every team is composed of these roles, though not every team needs all of them.

### Role 1: Coordinator (Team Lead)

**Observed in:** All teams (Aeneas/FR, Schliemann/AR, Marconi/CD, unnamed/CB, unnamed/HR)

| Property | Pattern |
|---|---|
| Model | Always opus — judgment-heavy |
| Primary tool | SendMessage |
| Code access | Forbidden (enforced by prompt) |
| Git access | Limited or forbidden |
| Unique authority | Issue closure, spec approval, agent status tracking |

**Invariant:** The coordinator delegates all implementation work. Even when it would be faster to do it themselves, they spawn-before-delegate. This is identity, not laziness — it prevents role drift.

**Enforcement:** Peer enforcement via prompt instruction. Teammates send reminders if they observe boundary violations. Anti-patterns table in prompt documents known violations and corrections.

### Role 2: Researcher

**Observed in:** Finn (FR, CB, HR), Champollion (AR)

| Property | Pattern |
|---|---|
| Model | Varies — sonnet for volume work, opus when upgraded for judgment |
| Primary output | Structured findings (tables, inventories, pattern reports) |
| Scope | Reads broadly, writes narrowly (findings to specific directory) |
| Subagent spawning | May spawn haiku subagents for parallel data gathering (Finn pattern) |

**Invariant:** Researchers gather and structure data. They do not interpret, decide, or design — that's for the coordinator or specialist. "Here's what I found" not "here's what we should do."

**Variations:**
- **Finn pattern (general):** Ranges across unknown territory, spawns parallel subagents, consolidates
- **Champollion pattern (domain-specific):** Parses a known source format, extends extraction scripts, produces structured output in dual format (Markdown + JSON)

### Role 3: Analyst

**Observed in:** Nightingale (AR), Medici (FR, AR — as remote auditor)

| Property | Pattern |
|---|---|
| Model | Sonnet — pattern matching, not judgment |
| Primary output | Analysis documents, scores, matrices, health reports |
| Input | Researcher's output (never raw source data) |
| Scope | Reads broadly, writes to analysis directory |

**Invariant:** Analysts transform raw data into actionable insights. "82 LOVs but only 3 unique" is more useful than "82 LOVs." They aggregate, cross-reference, score, and visualize.

**Medici subtype:** The auditor is a specialized analyst whose scope is knowledge health — consistency between artifacts, stale data detection, gap identification. Medici is the only role that has been **reused across teams** (framework-research Medici auditing apex-research remotely).

### Role 4: Developer

**Observed in:** Sven, Dag, Babbage, Lovelace, Berners-Lee, Piper, Harmony

| Property | Pattern |
|---|---|
| Model | Sonnet (standard), opus for senior roles (sven in hr-devs) |
| Primary output | Working, tested code |
| Scope | Reads specs + data, writes to assigned code directories |
| TDD | Mandatory — red → green → refactor |

**Invariant:** Developers own implementation end-to-end within their domain. They write code, run tests, commit, push, and create PRs. They do not make architecture decisions — those go to the coordinator.

**Subtypes:**

| Subtype | Examples | Distinguishing trait |
|---|---|---|
| Frontend | Sven, Lovelace, Berners-Lee | SvelteKit, UI components, reactive state |
| Backend | Dag, Babbage | Server code, transport, database |
| CI/CD | Piper | Deployment pipelines, environment config |
| Integration | Harmony | Auth flows, external API connections |
| Domain-specific | Alex | Temporary — scoped to one workstream, removed when done |

### Role 5: Spec Writer

**Observed in:** Hammurabi (AR)

| Property | Pattern |
|---|---|
| Model | Opus — consequential output (bad spec wastes a migration team's sprint) |
| Primary output | Formal specifications with structured frontmatter |
| Input | Analysis data (never raw source) |
| Scope | Reads broadly, writes to specs/ and decisions/ |

**Invariant:** Spec writers produce the contracts between teams. Their output must survive context loss — the consuming team won't have the research context. Precision over elegance. Open questions are first-class (honest "unknown" > plausible guess).

**Note:** This role emerges in hybrid and research teams that produce handoff artifacts. Pure dev teams don't need a dedicated spec writer — their "spec" is the working code.

### Role 6: Design Specialist

**Observed in:** Volta (lifecycle), Herald (protocols), Brunel (containers), Montesquieu (governance), Celes (agent resources), Vigenere (crypto), Kerckhoffs (QA + security)

| Property | Pattern |
|---|---|
| Model | Opus for judgment-heavy design, sonnet for implementation-focused specialties |
| Primary output | Design documents (research teams) or domain-specific code (dev teams) |
| Topic ownership | Owns one topic file or one code module |
| Coordination | Handshake protocol with adjacent-domain agents |

**Invariant:** Design specialists own a narrow domain and go deep. They are the authority on their topic within the team. The coordinator defers to them on domain questions.

**Key pattern: Adjacent-domain coordination.** When two specialists share a boundary (Volta/Brunel on lifecycle, Montesquieu/Herald on governance/communication), they use a section ownership table and handshake protocol to prevent write conflicts.

### Role Composition by Team Archetype

| Role | Research | Development | Hybrid |
|---|---|---|---|
| Coordinator | 1 (always) | 1 (always) | 1 (always) |
| Researcher | 1+ | 1 (Finn) | 1 |
| Analyst | 0-1 (Medici) | 0-1 (Medici) | 1 |
| Developer | 0 | 2-6 | 1-2 |
| Spec Writer | 0-1 | 0 | 1 |
| Design Specialist | 2-5 | 0-2 | 0 |
| **Typical total** | **5-8** | **5-12** | **5-6** |

---

## Model Tiering Patterns (*FR:Celes*)

### Decision

Model tier (opus vs sonnet) is determined by the **consequence of error** in the agent's primary output, not by the complexity of the task.

### Tiering Rules

| Criterion | Opus | Sonnet |
|---|---|---|
| **Error consequence** | Bad output wastes a team's sprint or creates a governance failure | Bad output is caught by tests or review |
| **Task type** | Judgment, design, prioritization, review | Volume processing, pattern matching, implementation |
| **Correction mechanism** | No automated check — requires human/agent judgment to detect errors | Tests, linters, type checkers catch errors automatically |

### Evidence from Deployed Teams

| Agent | Team | Model | Rationale |
|---|---|---|---|
| All team-leads | All | opus | Coordination decisions have team-wide blast radius |
| Hammurabi | AR | opus | Specs are handoff contracts — bad spec wastes migration team's sprint |
| Montesquieu | FR | opus | Governance design — bad framework creates bottlenecks or chaos at scale |
| Vigenere | CD | opus | Crypto decisions — wrong algorithm choice is a security vulnerability |
| Marcus | CB/HR | opus | Code review — missed bug in review reaches production |
| Finn | FR | opus | Research quality — wrong findings propagate through all downstream design |
| Champollion | AR | sonnet | File parsing — errors caught by pytest + mypy strict |
| Nightingale | AR | sonnet | Data aggregation — errors caught by dashboard inconsistencies |
| Berners-Lee | AR | sonnet | SvelteKit dev — errors caught by vitest + build |
| Babbage | CD | sonnet | Backend implementation — errors caught by tests |
| Kerckhoffs | CD | sonnet | QA — writes tests, doesn't make architecture decisions |
| Brunel | FR | sonnet | Container design — lower-consequence than lifecycle or protocol design |

### Cost Pattern

| Team archetype | Typical opus count | Total agents | Opus ratio |
|---|---|---|---|
| Research | 5-7 of 8 | 8 | ~75% — most roles are judgment-heavy |
| Development | 2-3 of 5-12 | 5-12 | ~25% — most roles have automated quality gates |
| Hybrid | 2 of 5 | 5 | 40% — coordinator + spec writer |

**Insight:** Research teams are expensive because their primary output (design documents) has no automated quality gate. Development teams are cheaper because tests and linters catch most errors. This is a structural property of the archetype, not a choice.

### Upgrade Pattern

Agents may be upgraded from sonnet to opus when:
1. Their role evolves to include more judgment (Finn: volume research → research quality matters for downstream design)
2. Their domain proves more consequential than initially estimated
3. The team-lead observes quality issues in their output that sonnet cannot self-correct

Agents should NOT be upgraded just because they're "important" or "senior." The criterion is always: can automated checks catch errors in this agent's output?

---

## Team Sizing Patterns (*FR:Celes*)

### Decision

Optimal team size is driven by **communication overhead** vs **domain coverage needs**.

### Evidence

| Team | Members | Archetype | Domain breadth |
|---|---|---|---|
| cloudflare-builders | 12 | Dev | Broad — full-stack + CI/CD + migration |
| hr-devs | 9 | Dev | Medium — same stack, narrower scope |
| framework-research | 8 | Research | Broad — 8 topic files |
| apex-research | 5 | Hybrid | Narrow — one source format, one output |
| comms-dev | 5 | Dev | Narrow — one protocol, one system |

### Sizing Formula

```
team_size = 1 (coordinator)
          + ceil(domain_scope / agent_bandwidth)
          + support_roles
```

Where:
- **domain_scope** = number of independent work areas that need parallel coverage
- **agent_bandwidth** = how many areas one agent can credibly own (typically 1-2 for deep work)
- **support_roles** = researcher + auditor (0-2, depending on archetype)

### Constraints

**Minimum: 3.** Coordinator + 2 specialists. Below this, you don't need a team — a single agent with a plan suffices.

**Maximum practical: 12.** Communication overhead scales O(N^2). At 12 agents, the coordinator spends most tokens on coordination, not decision-making. The cloudflare-builders team at 12 is at the practical ceiling — hr-devs pruned to 9 by removing workstream-complete specialists.

**Sweet spot: 5-7.** Large enough for meaningful parallelism, small enough that the coordinator can track all agents without losing context.

### Growth Strategy

Start small. Add agents when bottlenecks appear, not prophylactically.

| Signal | Action |
|---|---|
| One agent consistently blocked waiting for another | Split the blocking agent's scope into two agents |
| Coordinator can't track all work | Add a research coordinator (Finn pattern) to reduce coordinator's information-gathering burden |
| Quality issues in output | Add an auditor (Medici pattern) or upgrade model tier |
| New workstream opens | Add a domain specialist (temporary, like Alex) |
| Workstream completes | Remove the specialist — don't let idle agents accumulate |

### Shrinkage Strategy

Equally important. Teams that only grow become unwieldy.

| Signal | Action |
|---|---|
| Agent consistently idle | Remove from roster or merge into adjacent role |
| Workstream complete | Remove domain specialist (Alex pattern) |
| Two agents' scopes overlap significantly | Merge into one agent with combined scope |
| Team reaches 10+ with low parallelism | Split into two teams by domain |

---

## Common-Prompt Patterns (*FR:Celes*)

### Decision

Every team's common-prompt has a **fixed skeleton** (mandatory sections present in all teams) and **variable sections** (archetype-specific).

### Fixed Skeleton (present in all observed teams)

| Section | Purpose | Example |
|---|---|---|
| **Team header** | Name, members, mission | All teams |
| **Workspace** | Repo, directories, key paths | All teams |
| **Communication rule** | Timestamp format, mandatory reporting | All teams — identical wording |
| **Author attribution** | `(*PREFIX:Agent*)` format, placement rules | All teams — prefix varies per team |
| **Language rules** | Technical docs: English. User-facing: Estonian. | All teams |
| **Agent spawning rule** | `run_in_background: true` | All teams — identical wording |
| **On startup** | Read scratchpad, read common-prompt, intro to team-lead | All teams — 3-step pattern |
| **Team memory** | Scratchpad path, 100-line limit, tag list | All teams — identical structure |
| **Shutdown protocol** | Write scratchpad, send closing message, approve | All teams — identical 3-step pattern |

### Variable Sections by Archetype

| Section | Research | Development | Hybrid |
|---|---|---|---|
| **Standards** | "RESEARCH team — no production code" | "DEVELOPMENT team — production code, code review, conventional commits" | Implied by directory ownership |
| **Directory ownership table** | Topic file ownership | Not needed (prompts define scope) | Critical — data pipeline ownership |
| **Data flow diagram** | Not needed | Not needed | Critical — shows pipeline from source to output |
| **TDD mandate** | Not present | Present (detailed Red→Green→Refactor) | Present (for code-writing agents) |
| **Tech stack** | Not present | Present (SvelteKit, TypeScript, etc.) | Present (Python + SvelteKit) |
| **Spawn order** | Not specified | Named configurations ("full", "lite") | Explicit data-dependency order |
| **Isolation model** | Not needed | Branch/worktree (independent-output agents) | Directory ownership on trunk (pipeline data flow) |
| **Git workflow** | Team-lead commits | Agents own branches, PRs to develop | All agents on trunk; PRs only for shared contract changes (`types/`) |
| **External data rules** | N/A | N/A | READ-ONLY enforcement for source data |
| **Quality audit** | Internal (Medici is a team member) | Internal (Medici or Marcus) | Remote (cross-team Medici) |

### Attribution Prefix Convention

| Team | Prefix | Pattern |
|---|---|---|
| framework-research | FR | 2-letter abbreviation of team name |
| apex-research | AR | 2-letter abbreviation |
| comms-dev | CD | 2-letter abbreviation |
| cloudflare-builders | CB | 2-letter abbreviation |
| hr-devs | HR | 2-letter abbreviation |

Prefixes are registered in roster.json (Herald's T03 recommendation) and must be unique across all teams.

### Mandatory Estonian Sentence

All observed common-prompts contain one sentence in Estonian: "**KOHUSTUSLIK: Pärast iga ülesande lõpetamist saada team-leadile SendMessage raport.** Ära mine idle ilma raporteerimata." (Mandatory: after completing any task, send team-lead a report. Do not go idle without reporting.) This is the single most important behavioral rule and is written in Estonian for emphasis — it's the PO's voice, not the framework's.

---

## Multi-Agent Membership (*FR:Celes*)

### Can an agent belong to multiple teams?

**De facto answer: No — but roles can be replicated.**

No agent instance runs in two teams simultaneously. Each agent is spawned within one team context and can only SendMessage within that context. However:

- **Medici pattern:** The same *role* exists in multiple teams (Medici in FR, auditing AR remotely). These are separate agent instances with the same role definition, not one agent in two teams.
- **Finn pattern:** Finn exists in FR, CB, and HR — three separate instances of the same role design, adapted to each team's domain.
- **Cross-team service:** An agent in Team A can serve Team B via the handoff protocol (T03), but remains a member of Team A.

**Recommendation:** Do not attempt shared-membership. Instead, design roles that can be instantiated per-team (Medici, Finn) or provide cross-team service via protocols (T03 Protocol 1).

---

## Open Questions

### Resolved by this analysis

- ~~What team types do we need?~~ → Three archetypes: research, development, hybrid. Determined by primary output type.
- ~~How do project teams differ from function teams?~~ → Project teams (dev, hybrid) are scoped by repo/domain. Function teams (QA, security) are cross-project. Only project teams have been built so far.
- ~~Can an agent belong to multiple teams?~~ → No. Roles can be replicated across teams. Cross-team service via T03 protocols.
- ~~What defines a team's boundary?~~ → Dominant boundary varies: repo (dev teams), domain (research teams), mission lifecycle (temporary teams). Most teams have a primary boundary with secondary constraints.
- ~~How does team size scale?~~ → Fixed roster, elastic spawning. Start at 5, grow to 7-8 when bottlenecks appear, split at 10+.

### Still open

1. **Function teams not yet built.** All observed teams are project-scoped. When will we need a cross-project QA team or security team? What triggers the transition from "QA agent in each team" to "dedicated QA team"?

2. **Temporary team lifecycle.** apex-research is designed to disband when specs are handed off. What's the disbandment protocol? How does knowledge transfer to successor teams?

3. **Team evolution patterns.** cloudflare-builders (12) → hr-devs (9) shows organic shrinkage. What drives growth? What prevents teams from growing beyond the practical ceiling?

4. **Named spawn configurations at scale.** "full" and "lite" are manual conventions. At 10+ teams, should configurations be machine-enforced (roster-level definition, validation on spawn)?

## Patterns from Reference Teams (*FR:Finn*)

### Team composition in practice

**rc-team (cloudflare-builders) — 12 agents:**

- team-lead (opus-4-6), sven (frontend), dag (database), tess (testing), piper (CI/CD), harmony (integration/auth), alex (APEX migration), marcus (code review, opus-4-6), finn (research, sonnet), arvo (requirements), medici (health audit), eilama (local LLM)
- Includes a project-specific specialist (alex) for APEX migration — added and can be removed when that workstream ends

**hr-devs — 9 agents:**

- team-lead, sven, dag, tess, marcus, finn, arvo, medici, eilama (local LLM scaffolding)
- Removed: piper (CI/CD), harmony (integration/auth), alex (APEX)
- Added: eilama (local Ollama daemon, not a Claude agent — code boilerplate factory)
- Evolution: leaner roster after removing project-complete specialists; eilama shows non-Claude agent integration

### Roster is machine-readable

Both teams define membership in `roster.json` — name, model tier, agentType, prompt file path, color. This enables:

- `spawn_member.sh` to auto-read model/color without hardcoding
- Team-lead to check "is X registered?" before spawning

### Agent types observed

| Type | Examples | Characteristic |
|---|---|---|
| team-lead | team-lead | Coordinates only, forbidden to touch source code |
| specialist | sven, dag, tess, piper, harmony, alex | Domain-specific, owns work end-to-end |
| cross-cutting support | finn, arvo, marcus, medici | Serve multiple specialists; no primary deliverable |
| non-Claude agent | eilama | Daemon, polls inbox, communicates via same message substrate |

### Team-lead role boundary is explicitly enforced

The team-lead's tool set is restricted by prompt (cannot edit .ts/.svelte, cannot run tests/build/git). Teammates are instructed to *call out* team-lead if they observe a violation. This is a governance mechanism baked into agent prompts, not enforced by infrastructure.

### Model tiering

Senior roles (team-lead, marcus/code review, sven/frontend) use opus-4-6 in hr-devs. Others use sonnet-4-6. Eilama uses codellama:13b-instruct via ollama (no API cost). Cost optimization is built into team design.

### Team configurations are named presets

Both teams define named spawn configurations:

- **"full"** — story work: finn + marcus + tess + sven (+ dag if needed)
- **"full-review"** (hr-devs only) — adds arvo for AC verification
- **"lite"** — quick fix: finn + sven only

This answers the "fixed roster vs elastic" question: roster is fixed (defines available agents), but active configuration is elastic (spawn subset per task type).
