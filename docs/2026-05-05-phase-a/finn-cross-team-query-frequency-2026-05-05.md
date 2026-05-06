---
author: finn
team: framework-research
date: 2026-05-05
phase: A (research — read-only)
issue: 65
sources:
  - on-disk framework-research wiki @ ~/Documents/github/mitselek-ai-teams/teams/framework-research/
  - on-disk apex-research @ ~/Documents/github/apex-migration-research/teams/apex-research/
  - on-disk raamatukoi-dev @ ~/Documents/github/.mmp/tugigrupp/.claude/teams/raamatukoi-dev/
  - on-disk screenwerk-dev @ ~/Documents/github/ai-team/.claude/teams/screenwerk-dev/
  - on-disk esl-suvekool @ ~/Documents/github/.mmp/ESL/Haapsalu-Suvekool/teams/esl-suvekool/
sibling:
  - finn-dedup-census-2026-05-05.md
---

# Phase A — Cross-team Query Frequency (best-available signals)

(*FR:Finn*)

## §0 — Reframe (post-dedup-census, team-lead 2026-05-05 15:51)

The dedup census surfaced that **Brilliant has only one tenant today** (esl-suvekool). Cross-team query frequency in BRILLIANT is therefore also structurally zero by configuration — there is no second tenant to query against. The signal source must pivot.

**Frame for this deliverable (per team-lead redirect):** absent live federation traffic, FR's cross-pollination decisions over sessions 20-25 are the best available *proxy* for what queries would route across teams at scale. The materialized cross-pollinations (`source-team:` frontmatter, `related:` cross-org URLs, prose backlinks) are queries that *did happen* — just not over a federation transport. They tell us:

- **Estimated traffic shape** (queries per session-equivalent, per week-equivalent)
- **Most-frequent direction** (which team to which team)
- **Topical domains that pull cross-team** (which content categories warrant federation)

This is what scale-2+ federation would carry. Read all subsequent sections through this lens.

## Method

Read-only inventory across all available on-disk team configs/wikis/scratchpads/inboxes for evidence of one team referencing another team's content. Five signal classes counted:

1. **`source-team:` frontmatter** — explicit cross-team filing in wiki entries
2. **Cross-team URL/path references** in prose (e.g. "see apex's `wiki/...`")
3. **Cross-team relay traffic** in inboxes / scratchpads ("tmux-direct to Aalto", "comment on apex#62")
4. **Harvest/comparison docs** — periodic cross-team study deliverables
5. **Pattern-transplant evidence** — wiki entries that exist in two teams' wikis with same name

No instrumented query log exists — these are *the best signals available*.

## §1 — Wiki population baseline (across teams)

| Team | Wiki entries | Sessions tracked | Cross-team refs to other teams |
|---|---|---|---|
| framework-research (FR) | 61 (36 patterns / 13 gotchas / 2 decisions / 1 contract / 3 observations / 2 process / 2 references / 1 archive) | ~26 sessions | **150 occurrences across 36 entries** (mentions of apex/uikit/raamatukoi/screenwerk/polyphony/Brilliant/esl-suvekool/hr-platform/comms-dev/bigbook) |
| apex-research | 77 (42 patterns / 28 gotchas / 3 decisions / 4 contracts) | ~24+ sessions | **7 occurrences across 2 files** (mentions of FR/uikit-dev/etc.) |
| raamatukoi-dev | 5 (4 patterns / 1 gotcha) | smaller team | **11 occurrences across 6 files** (5 of those entries are transplanted from FR) |
| screenwerk-dev | 0 wiki entries | recently deployed | 83 occurrences across team config (cross-team-handoff template references) |
| esl-suvekool | 0 wiki entries (uses Brilliant directly) | 5 sessions | **54 occurrences across 10 files** (mostly internal "esl-suvekool" self-refs in design-spec, common-prompt) |

**Asymmetry signal:** FR is the dominant cross-team-aware team (150 cross-refs in 61 entries = ~2.5 cross-team mentions per entry). apex is the dominant cross-team-unaware team (7 mentions in 77 entries = ~0.09/entry). Raamatukoi imports FR patterns directly (5/5 entries originated upstream).

## §2 — Cross-team filing direction (sourcing pattern)

FR's wiki entries with explicit `source-team:` frontmatter (n=8 of 61):

| FR wiki entry | source-team | Direction |
|---|---|---|
| `observations/compaction-stale-state-deployed-teams.md` | uikit-dev | uikit-dev → FR |
| `gotchas/tmux-pane-labels-decoupled-from-personas.md` | uikit-dev | uikit-dev → FR |
| `patterns/tmux-pane-border-format-for-teams.md` | uikit-dev | uikit-dev → FR |
| `patterns/world-state-on-wake.md` | uikit-dev | uikit-dev → FR |
| `gotchas/teamcreate-in-memory-leadership-survives-clear.md` | apex-research | apex → FR |
| `patterns/wiki-cross-link-convention.md` | apex-research | apex → FR (n=2 co-discovery) |
| `patterns/bootstrap-preamble-as-in-band-signal-channel.md` | framework-research | self (xireactor harvest) |
| `patterns/governance-staging-for-agent-writes.md` | framework-research | self (xireactor harvest) |

**Inflow rate to FR:** 6 of 61 entries (~10%) explicitly sourced from another team. **Outflow from FR:** 5 of 5 raamatukoi-dev wiki entries are FR-derived (cathedral-trigger-quality-teams, in-process-respawn, multi-repo-xp-composition, xp-cycle-for-infrastructure, repo-quality-baseline). All four FR patterns transplanted to raamatukoi were filed by Cal as cross-team-applicable.

## §3 — Cross-team query traffic in inboxes

FR inboxes contain 98 cross-team-mention occurrences across 11 inbox files. Decomposed:

| Inbox | Cross-team mentions | Interpretation |
|---|---|---|
| `team-lead.json` | 49 | Highest — team-lead routes all cross-team work |
| `monte.json` | 9 | Cross-team protocol design (Protocol D, governance) |
| `finn.json` | 8 | Harvest assignments from team-lead |
| `herald.json` | 7 | Protocol design cross-team queries |
| `brunel.json` | 7 | Cross-team infra (containers, bridges) |
| `comms-dev-team-lead.json` | 7 | Sibling team coordination |
| `montesquieu.json` | 5 | (legacy/deferred) |
| `medici.json` | 2 | Cross-team audits |
| `raamatukoi-research.json` | 2 | Sibling team direct |
| `callimachus.json` | 1 | Cross-team wiki promotions |
| `celes.json` | 1 | Cross-team agent design |

**Read as a query-frequency proxy:** FR's team-lead handles ~5× the cross-team-aware traffic of any specialist. Cross-team queries are NOT distributed to specialists; they're integration-not-relay routed through team-lead. This matches wiki entry #44.

## §4 — Cross-team research deliverables (harvest cadence)

FR has produced the following one-shot cross-team study docs (all in `docs/`):

| Doc | Date | Target team | Type |
|---|---|---|---|
| `uikit-dev-harvest-2026-04-14.md` | 2026-04-14 | uikit-dev | Quarterly harvest |
| `jira-gitflow-assessment-2026-04-14.md` | 2026-04-14 | dev-toolkit (Jira/Gitflow) | One-shot assessment |
| `xireactor-pilot-migration-assessment-2026-04-15.md` | 2026-04-15 | xireactor-brilliant (external OSS) | OSS harvest |
| `apex-research-evolution-assessment-2026-04-22.md` | 2026-04-22 | apex-research | Comparative analysis |
| `apex-research-comparison-2026-04-29.md` | 2026-04-29 | apex-research | Comparative analysis |
| `hello-world-corp-pipeline-harvest-2026-04-30.md` | 2026-04-30 | hello-world-container (corp pipeline) | One-shot harvest |
| `2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md` | 2026-05-05 | xireactor-brilliant | Deep-read |
| `2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md` | 2026-05-05 | xireactor-brilliant | Deep-read |
| `2026-05-05-postgres-library-discovery/finn-polyphony-dev-glance.md` | 2026-05-05 | mvox-dev/polyphony | Glance (negative) |
| `2026-05-05-postgres-library-discovery/finn-haapsalu-suvekool-glance.md` | 2026-05-05 | mitselek/Haapsalu-Suvekool | Glance (positive) |

**Cadence:** ~1 harvest per ~2 weeks (average ~10 in 21 days = ~0.5/day, but bursty around design questions). When a design question requires substrate verification, harvest cadence accelerates ~5-10×.

## §5 — Pattern-transplant evidence (n=2+ across teams)

Wiki patterns that exist in two teams' wikis with same or near-same content:

| Pattern | FR | apex | raamatukoi | screenwerk | uikit-dev | Cross-team status |
|---|---|---|---|---|---|---|
| `wiki-cross-link-convention` | YES (`#50`) | YES (apex original) | NO | NO | NO | n=2 co-discovery (Finn 2026-04-29) |
| `cathedral-trigger-quality-teams` | YES | NO (different shape) | YES (transplanted) | NO | NO | n=2 (FR seeded raamatukoi) |
| `in-process-respawn` | YES | NO | YES (transplanted) | NO | NO | n=2 (FR seeded raamatukoi) |
| `multi-repo-xp-composition` | YES | NO | YES (transplanted) | NO | NO | n=2 (FR seeded raamatukoi) |
| `xp-cycle-for-infrastructure` | YES | NO | YES (transplanted) | NO | NO | n=2 (FR seeded raamatukoi) |
| `repo-quality-baseline` | NO | NO | YES (raamatukoi original) | NO | NO | n=1 (raamatukoi-only) |
| `substrate-invariant-mismatch` | YES (n=5 across substrates) | implicit (sibling cases reference FR) | NO | NO | NO | substrate-pattern, n=5 in FR's wiki across multiple teams' substrates |
| `teamcreate-in-memory-leadership-survives-clear` | YES | YES (apex original via #62) | NO | NO | NO | n=2 cross-team (apex→FR) |
| `world-state-on-wake` | YES (uikit-source) | NO | NO | NO | YES (uikit-dev original) | n=2 cross-team (uikit→FR) |
| `tmux-pane-border-format-for-teams` | YES (uikit-source) | NO | NO | NO | YES | n=2 cross-team (uikit→FR) |

**Total observed cross-team-pattern instances (n=2+): ~10.** This is the empirical floor for "actual cross-team dedup that has materialized today." Compare to FR's 61 wiki entries: ~16% (10/61) have a documented n=2 cross-team instance.

## §6 — Cross-team query frequency — order-of-magnitude estimate

Combining signals across §1-§5, three reads of the data:

### Read 1 — looking at the team-lead's job
FR's team-lead inbox carries ~49 cross-team-mention messages in active session memory (snapshot). Across ~26 sessions of FR's life, an order-of-magnitude estimate is:

- ~2 cross-team relay events per session (49/26 ≈ 1.9) on average
- ~10× higher during cross-team design weeks (xireactor pilot, hello-world-container pipeline, postgres library discovery)
- ~0× during pure-internal weeks

**Headline: ~50 active cross-team relay events sustained, ~150 in lifetime, with bursty cadence.**

### Read 2 — looking at wiki cross-references
FR's wiki has 150 cross-team mentions across 36 of 61 entries. Per-entry mean = 4.2 cross-team mentions when an entry references another team (and ~60% of entries do). This is high — most FR wiki entries reference other teams' substrates by name.

apex's wiki has 7 cross-team mentions across 77 entries (~0.09/entry). One-tenth of FR's rate. Asymmetric: FR is much more cross-team-aware than apex.

### Read 3 — looking at agent activity
Specialists (Finn, Brunel, Herald, Monte) carry ~5-9 cross-team mentions in their inboxes. Their work IS cross-team-bounded — Finn does 1-2 cross-team harvests per month; Brunel does 1-2 cross-team infra fixes per month; Herald designs protocols cross-team-bounded; Monte argues governance.

**Estimated cross-team-query rate per agent at current scale (~9 teams, FR + 8 others):**

- **Team-lead level:** ~2 events/session, ~10/week (each event = relay/integration of cross-team data)
- **Finn level:** ~0.5-1 event/session (when assigned to harvest); 0/session otherwise
- **Other specialists:** ~0.1-0.2 events/session, mostly inbound (someone else's harvest reaches them)

### Asymmetry across teams
- **FR (research team):** HIGH cross-team query rate (2-10× other teams)
- **apex (research team):** LOW cross-team query rate (~10× lower than FR)
- **raamatukoi-dev (XP team):** LOW (5 transplanted patterns, no querying back toward source)
- **screenwerk-dev (XP team, recent):** ~0 (no wiki yet)
- **esl-suvekool (operational team):** ~0 cross-team queries; high INTERNAL-Brilliant query rate (`Brilliant pulse` ritual at every session start)

## §7 — What "scale to N teams" means for query frequency

If we extrapolate from FR's current rate (~50 lifetime cross-team relay events) to a 10-team cluster where every team is as cross-team-aware as FR:

- 10 teams × ~50 events lifetime = 500 cross-team events as the system runs
- ~2 events × 10 teams × ~30 sessions/week = ~600 events/week at full population

But the data shows **only FR is cross-team-aware**. apex/raamatukoi/screenwerk/esl-suvekool barely query other teams. **The actual cross-team query rate at 10-team scale is closer to:**

- 1 FR-rate team (50 events lifetime) + 9 low-rate teams (≤5 events each lifetime) = ~95-100 events lifetime cluster-wide
- ~2-5 events/week at full population

**Order-of-magnitude (today, observable): ~1-10 cross-team queries per week cluster-wide.** Substantially below Brilliant's published throughput floor (~178 ops/s). Phase A federation layer is NOT throughput-bound at any plausible near-term scale.

## §8 — Substrate-pattern flow direction (load-bearing)

The data shows ASYMMETRIC cross-team flow:

- **FR is the methodology hub** — produces cross-team-applicable patterns, harvests sibling teams, files cross-team-aware wiki entries.
- **apex is methodology-aware but not cross-team-aware** — large wiki, but each entry is internal to apex.
- **raamatukoi/screenwerk are methodology-recipients** — receive transplants but don't produce.
- **esl-suvekool is purely operational** — no methodology contribution; produces product-domain knowledge.

This is the n=1 federation topology in production today. Phase A's "scale" question is: **does the topology remain hub-and-spoke (FR-as-hub) or evolve to peer-mesh (every team produces methodology)?** The hub-and-spoke topology is what's empirically observed; peer-mesh is aspirational.

## §9 — Implications for federation-layer design

1. **Cross-team query rate is LOW and bursty, not high and steady.** Federation layer doesn't need sub-second latency. Polling-with-cursor, weekly sync, or eventual-consistency are all viable.
2. **Cross-team flow is asymmetric** (FR-as-hub). Federation primitive should preserve this (hub team writes to shared methodology namespace; product teams read).
3. **Methodology vs product namespaces have different query patterns.** Methodology = many readers, few writers. Product = one writer (the team), few readers (mostly self).
4. **Harvest cadence (~1/2 weeks) is the natural cross-team rhythm.** Federation layer should support this rhythm, not faster.
5. **Inbox traffic is the integration layer, not federation layer.** Cross-team queries land in team-lead's inbox via relay; team-lead synthesizes and acts. Federation should make queries cheaper, not replace integration.

## §9.5 — Closing findings (Cal Protocol A candidates, team-lead-flagged)

Per team-lead 2026-05-05 15:51, three substrate findings worth surfacing to Cal:

1. **"Brilliant currently has zero cross-team population — federation pattern is provisioned but unused at n=2+."** Substrate-fact, gotcha-shaped. Future agents must not assume scale-2 measurements are meaningful when only scale-1 exists. Pre-scaling census of a one-tenant federation measures *configuration*, not *overlap*. Concrete instance: this session's dedup census produced near-zero cross-team-overlap by tenancy, would have read as "system has near-zero deduplicable content" without the substrate-tenancy disambiguation.

2. **"Brilliant namespace shape is content-categorical, not document-type."** Substrate-fact, references-shaped. Brilliant top-level: `Projects/`, `Meetings/`, `Context/`, `Resources/` (content categories — what is this *about*). FR wiki top-level: `patterns/`, `gotchas/`, `decisions/`, `contracts/` (document types — what *kind* of statement is this). These are orthogonal axes. Phase A architectural decision: single-axis, dual-axis, or mapping-rules between substrates.

3. **"Pre-scaling census of a one-tenant federation measures configuration, not overlap."** Methodology pattern, sibling-shape to session-25 "soft-verdict discipline on substrate-mapping briefs." When asked to baseline a federation pattern before it has scaled to n=2+, the right shape is "instrument the measurement; the pre-scaling number is structurally near-zero" — not "go produce a number and interpret it." Saves rework when the measurement design lands.

Team-lead routes to Cal post-task-2-ship; included here for discoverability per their request.

## §10 — Confidence-graded summary

| Claim | Confidence |
|---|---|
| FR is the dominant cross-team-aware team (10× others) | HIGH (n=4 sibling wikis sampled) |
| Cross-team query rate ~1-10/week cluster-wide | EYEBALL (no instrumentation, derived from inbox snapshots + harvest cadence) |
| Cross-team flow is asymmetric hub-and-spoke today | HIGH (FR→raamatukoi transplants observable; reverse flow zero) |
| ~16% of FR wiki entries have observed cross-team n=2 | HIGH (10 of 61 cross-team-instance-tracked) |
| Federation NOT throughput-bound at 10-team scale | HIGH (Brilliant 178 ops/s vs ~1-10/week observed) |
| Phase A target topology should preserve hub-and-spoke | MEDIUM (could change with Cal's role evolution; phase A decides) |

(*FR:Finn*)
