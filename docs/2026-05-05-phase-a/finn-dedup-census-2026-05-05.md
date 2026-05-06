---
author: finn
team: framework-research
date: 2026-05-05
phase: A (research — read-only)
issue: 65
sources:
  - on-disk Haapsalu-Suvekool repo @ ~/Documents/github/.mmp/ESL/Haapsalu-Suvekool/teams/esl-suvekool/
  - on-disk apex-research wiki @ ~/Documents/github/apex-migration-research/teams/apex-research/
  - on-disk raamatukoi-dev wiki @ ~/Documents/github/.mmp/tugigrupp/.claude/teams/raamatukoi-dev/wiki/
  - on-disk screenwerk-dev team config @ ~/Documents/github/ai-team/.claude/teams/screenwerk-dev/
  - on-disk framework-research wiki @ ~/Documents/github/mitselek-ai-teams/teams/framework-research/wiki/
related:
  - docs/2026-05-05-postgres-library-discovery-brief.md (C-phase deliverable)
  - docs/2026-05-05-postgres-library-discovery/finn-haapsalu-suvekool-glance.md
---

# Phase A — Dedup Census (read-only)

(*FR:Finn*)

## Scoping clarification (load-bearing)

The brief asked for an overlap census across "team-namespaced areas in esl-suvekool's central Brilliant pattern" — `Projects/esl/*`, `Meetings/esl/<date>`, `Context/esl/*`, `Resources/esl/*`. Three findings reframe the measurable surface:

1. **Brilliant MCP is not configured for FR this session.** I cannot query the Brilliant database directly — `mcp__brilliant__*` tools unavailable here. Counts of *actual entries* are inferred from on-disk references in the esl-suvekool repo, not from the live database.
2. **Today, only ONE team populates Brilliant.** esl-suvekool is the sole production user of the central Brilliant. No other team in our universe (FR, apex, raamatukoi, screenwerk, polyphony, comms-dev) has any Brilliant entries. The cross-team-dedup census the brief envisions therefore has no second team to cross-reference against — yet.
3. **The brief's "standards / contracts / gotchas / decisions" lexicon is FR-wiki taxonomy, not Brilliant namespace structure.** Brilliant's actual top-level paths in production use are `Projects/`, `Meetings/`, `Context/`, `Resources/` — content categories, not document types. The dedup census the brief envisions is asking the wrong question of the wrong substrate at the current scale.

What I can usefully measure today is therefore reframed in three parts:

- **§1 — esl-suvekool's Brilliant footprint inventory.** What entries exist (named) and what they contain. Phase A baseline.
- **§2 — esl-suvekool internal redundancy.** Where on-disk artifacts duplicate, mirror, or summarize Brilliant content (the substrate maintains an explicit two-consumer pattern, so some duplication is by design).
- **§3 — Synthetic dedup census.** What FR-wiki content WOULD overlap with Brilliant content if FR were also writing to Brilliant today. Establishes the baseline expected dedup at hypothetical scale-2.

## §1 — esl-suvekool's Brilliant footprint (inventory)

Enumerated from textual references in `~/Documents/github/.mmp/ESL/Haapsalu-Suvekool/teams/esl-suvekool/` (27 markdown files scanned). Confidence: **high for entry existence** (multiple corroborating references with version numbers + IDs); **unknown for entry counts/sizes** (would need MCP access to confirm).

| Namespace | Named entries | Status | Cited version | Approx content scope |
|---|---|---|---|---|
| `Projects/esl` | 1 (`Projects/esl`) | confirmed in production | v7 (touched 2026-05-02 16:07 UTC) | board roster, annual cadence, governance rhythm, business identity, registry-document index, 2024 financial snapshot |
| `Meetings/esl/<date>` | 2 (`2026-08-14-suvekool-haapsalu`, `2025-09-28-erakorraline-volikogu`) | confirmed in production | v8, v2 | live Suvekool 2026 state (concert details, registration tally, soloists/musicians, procurement_state, mihkel_action_items, carus_verlag_contact, head_conductor fee, orchestra fee); 31-attendee voting list with succession notes |
| `Context/esl/*` | 2 (`liisa-rahusoo-lahkumine-2027`, `lodewijk-van-der-ree`) | confirmed in production | v1, v3 | Liisa-departure narrative + succession context; Lodewijk language assumption + email |
| `Resources/esl/*` | 1 (`pohikiri-2026`, id `fb589044-…`) | confirmed in production | v1 | full text + § map + compliance-gap notes for ESL põhikiri |

**Total entries documented: 6 distinct entries across 4 namespaces.** All four namespaces in active operational use; `Projects/`, `Meetings/`, `Context/`, `Resources/` corresponds 1:1 to esl-suvekool's `common-prompt.md:130-132` declared contract.

Versioning observation: highest live entry is `Projects/esl` at v7 (revisions every ~3-7 days). `Meetings/esl/2026-08-14-suvekool-haapsalu` at v8 with a v9 staged but pending PO greenlight. Brilliant treats every save as a version bump (matches Brilliant's `entry_versions` append-only design). The version-bump rate is a useful signal for query-frequency in §3.

## §2 — esl-suvekool internal redundancy (intentional two-consumer duplication)

esl-suvekool's `roadwarrior-sync` skill (filed at session 23) is a documented two-consumer pattern: the local team has direct MCP access to Brilliant, while the road-warrior claude.ai Project consumer can ONLY read on-disk markdown. Some on-disk markdown therefore intentionally mirrors Brilliant content for the road-warrior consumer. This is "duplication-by-design" not "dedup target."

| On-disk artifact | Brilliant counterpart | Relationship | Dedup-candidate? |
|---|---|---|---|
| `docs/stakeholders.md` | `Projects/esl` v5+, `Context/esl/lodewijk-van-der-ree` v1, `Context/esl/liisa-rahusoo-lahkumine-2027` v1 | Synthesizes Brilliant rows into manual format; explicit "Brilliant on tõe-allikas, see fail on käsiraamat" | **NO** — this is a synthesis, not a duplicate |
| `docs/timeline.md` | `Meetings/esl/2026-08-14-suvekool-haapsalu` (id `53f256fd-…`) | Source-of-truth = canonical/2026 plaan.md + Brilliant entry; doc is a derived T-counter view | **NO** — derived view |
| `docs/procurement/esl-business-identity.md` | `Resources/esl/pohikiri-2026` | Local notes complement registry data; full text in Brilliant | **PARTIAL** — registry-canonical lives both places (audit trail vs queryable) |
| `canonical/2026 plaan.md` | (external, not in Brilliant) | Plan doc managed outside Brilliant | NOT IN SCOPE |
| `memory/<agent>.md` (×3 scratchpads) | (none — operational state) | Per-agent ephemeral working memory | NOT IN SCOPE |
| `drafts/*.md` (×5 drafts) | (none — workflow artifacts) | Email drafts, throwaway after PO sends | NOT IN SCOPE |

**Synthesized observation:** Out of 27 on-disk markdown files, **3 explicitly reference Brilliant entries as source-of-truth** (`stakeholders.md`, `timeline.md`, `esl-business-identity.md`). The other 24 are either (a) operational artifacts with no Brilliant counterpart (drafts, scratchpads, prompts, common-prompt), or (b) team config files. **Internal redundancy rate at this scale: ~11% of files (3/27) by count; near 0% by content-volume because the synthesized files compress Brilliant content rather than copy it.**

The pattern is consistent with the source-of-truth discipline declared in `docs/stakeholders.md:166`: the synthesized files are *handbooks*, not *replicas*.

## §3 — Synthetic dedup census (FR ↔ esl-suvekool, hypothetical)

What if FR's content lived in Brilliant under `Projects/fr/*`, `Meetings/fr/<date>`, `Context/fr/*`, `Resources/fr/*` today — would there be deduplicable overlap with esl-suvekool's content?

Sample tested: FR's 61 wiki entries × esl-suvekool's 6 documented Brilliant entries.

### Method
For each FR wiki entry, asked: "could this content factually appear under esl-suvekool's namespaces?" — i.e., is the content team-shareable substrate (process patterns, gotchas about tooling, framework conventions) or is it team-specific domain content (Estonian baroque music, ESL board roster, Suvekool 2026 procurement)?

### Candidate cross-namespace content from FR's wiki

Methodology patterns potentially useful to esl-suvekool's substrate IF Brilliant had a generic `Standards/` or `Patterns/` namespace (hypothetical — does not currently exist in esl-suvekool's substrate):

| FR wiki entry | Generalizable to esl-suvekool? | Notes |
|---|---|---|
| `patterns/wiki-cross-link-convention.md` | YES (cross-team filing already n=2 with apex) | Already labeled cross-pollination; Brilliant has `entry_links` substrate that subsumes this |
| `patterns/operational-team-archetype.md` | YES — esl-suvekool IS the n=1 instance described in this entry | Self-referential — esl-suvekool reading this would be reading about itself |
| `patterns/claude-startup-md-as-cross-team-handoff.md` | YES — also self-referential (esl-suvekool = the n=1 instance) | Same as above |
| `patterns/named-concepts-beat-descriptive-phrases.md` | YES — generic writing discipline | Would apply to Koidula's drafting work |
| `patterns/wiki-cross-link-convention.md` | YES | Already cross-team-shaped |
| `gotchas/teamcreate-in-memory-leadership-survives-clear.md` | YES — esl-suvekool IS the third empirical reproduction (per Tobi's S2 [DEFERRED] block) | n=3 across 3 teams, Brilliant-substrate-substrate-shareable |
| `gotchas/dual-team-dir-ambiguity.md` | YES — esl-suvekool team uses same Claude Code substrate | Generic |

**Estimated cross-team-shareable content in FR's wiki: ~25-40 of 61 entries (~40-65%).** The remainder (gotchas/cloudflare-d1-migration-query.md, references/rc-host-db-tunnel-architecture.md, etc.) are platform-specific and would not generalize to esl-suvekool.

### Reverse direction (esl-suvekool → FR)

Of esl-suvekool's 6 Brilliant entries, **0 would have meaningful overlap with FR's wiki content** today. Domain-specific (board roster, concert state, individual stakeholders, põhikiri text) — none of it methodology-substrate.

### Asymmetry observation

The dedup-census shape the brief envisions (cross-team duplicates of "standards, contracts, gotchas, decisions") **is asymmetric in direction**: methodology-team content (FR, apex) flows naturally into a shared `Patterns/`/`Gotchas/`/`Decisions/` namespace; product/operational-team content (esl-suvekool) does NOT flow into shared namespaces because it's domain-specific.

Implication for phase A: **the federation primitive may need TWO namespace shapes**, not one:

- **Per-team product-namespace** (`Projects/esl/`, `Meetings/esl/`, `Context/esl/` → already in production, esl-suvekool case)
- **Cross-team methodology-namespace** (`Patterns/*`, `Gotchas/*`, `Decisions/*` → does NOT exist in Brilliant today; FR + apex wikis populate this content per-team in markdown)

The methodology-namespace is where actual cross-team dedup (n=2+ instances of same fact across teams) accumulates. It's where the federation layer's leverage lives.

## §4 — Numerical summary

| Measure | Value | Confidence | Source |
|---|---|---|---|
| Brilliant entries (esl-suvekool) | 6 documented + ≥1 staged (v9 pending) | HIGH (multi-source corroboration) | scratchpads + stakeholders.md sources block + S5 checkpoint |
| Brilliant namespaces in production use | 4 (`Projects`, `Meetings`, `Context`, `Resources`) | HIGH | common-prompt.md:130-132 |
| Other teams populating Brilliant | 0 | HIGH (FR has no MCP config; absence-of-evidence verified for polyphony at session 25) | session 25 brief + finn-polyphony-dev-glance |
| esl-suvekool on-disk md files referencing Brilliant entries | 3 of 27 (~11%) | HIGH | Grep on full repo |
| FR wiki entries cross-team-generalizable to esl-suvekool product namespace | 0 of 61 | HIGH | Domain mismatch (methodology vs operational) |
| FR wiki entries that WOULD live in a hypothetical cross-team `Patterns/`/`Gotchas/` namespace | ~40-65% of 61 (~25-40 entries) | EYEBALL | Read titles + descriptions from index.md |
| Actual cross-team dedup (n=2+ identical-substrate facts across teams in production today) | 1 entry: `wiki-cross-link-convention.md` (FR + apex co-discovery, Finn 2026-04-29) | HIGH | source-team frontmatter + finn comparison doc |
| Substrate-invariant-mismatch confirmation count (cross-team pattern n=N) | 5 (apex, FR×2, xireactor, Brilliant) | HIGH | wiki/patterns/substrate-invariant-mismatch.md amendment 2026-05-05 |

## §5 — Headline finding (parked per team-lead 2026-05-05 15:51)

The dedup census the brief envisions cannot be measured today because **only one team populates Brilliant**. Per team-lead's reframe acknowledgment: phase A's research deliverable on dedup is the **instrumentation design**, not a baseline number.

Park as: *"instrument as post-scaling measurement; pre-scaling cross-team dedup is structurally near-zero by tenancy, not by absence of overlap."*

Concretely, three follow-on items for phase A:

1. Establish what "scaling" means concretely (how does FR's content land in Brilliant? Methodology namespace? Per-team product namespace? Both?).
2. Design instrumentation that captures dedup AFTER scaling — the count is meaningful at n≥2 teams populating, not at n=1.
3. The synthetic census above (§3) suggests **methodology-namespace is where dedup leverage lives**, not product-namespace.

The pre-scaling number is structurally near-zero at the current configuration and tells us nothing about the post-scaling rate.

## §6 — Open questions for phase A team

0. **Setup-phase dependency: configure Brilliant MCP for FR.** Per issue #65 framing, this is itself a phase A Setup deliverable, not blocked-on; flagged here so the dedup-census instrumentation design depends on it landing.
1. **Does Brilliant's path-namespace pattern require methodology + product as separate top-level namespaces?** esl-suvekool only uses product namespaces. If FR adopts Brilliant for `Patterns/`/`Gotchas/`/`Decisions/`, that's a new top-level convention. *Architectural decision, bigger than this mandate — phase A surface for Brunel/Monte/Herald.* Frame: "does the federation layer adopt a single namespace taxonomy (which?), preserve both (with mapping rules), or treat document-type and content-category as orthogonal axes?"
2. **What's the cross-team-dedup mechanism in Brilliant?** Brilliant's `entry_links` table has `relates_to | supersedes | contradicts | depends_on | part_of | tagged_with` types. Do any of these encode "co-discovered cross-team" the way FR's `source-team` frontmatter does today?
3. **Is `pohikiri-2026` (the 1 `Resources/esl/*` entry) representative of all `Resources/`?** Or will `Resources/` host things like vendor catalogs, playbooks, and standards? The single-instance sample doesn't characterize the namespace shape.
4. **Do team-specific scratchpads belong in Brilliant or stay on-disk?** esl-suvekool keeps `memory/<agent>.md` on-disk as ephemeral. FR has 13 on-disk scratchpads. If federation includes scratchpads, the volume × privacy considerations change substantially.

## §7 — Cal Protocol A candidates (team-lead-flagged 2026-05-05 15:51, routed by team-lead)

Three substrate findings worth surfacing to Cal once this report lands:

1. **"Brilliant currently has zero cross-team population — federation pattern is provisioned but unused at n=2+."** Substrate-fact, gotcha-shaped — future agents must not assume scale-2 measurements are meaningful when only scale-1 exists.
2. **"Brilliant namespace shape is content-categorical, not document-type."** Substrate-fact, references-shaped — paired contrast with FR wiki's document-type structure. n=2 substrate (Brilliant production + FR wiki) at orthogonal axes.
3. **"Pre-scaling census of a one-tenant federation measures configuration, not overlap."** Methodology pattern, sibling-shape to session-25 "soft-verdict discipline on substrate-mapping briefs."

Sibling cross-references for Cal: substrate-invariant-mismatch n=5 (substrate-mismatch class), wiki-cross-link-convention #50 (cross-pollination filing precedent).

(*FR:Finn*)
