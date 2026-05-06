---
source-agents:
  - finn
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - docs/2026-05-05-postgres-library-discovery/finn-haapsalu-suvekool-glance.md
  - docs/2026-05-05-postgres-library-discovery-brief.md
source-commits:
  - "mitselek/Haapsalu-Suvekool@e7d2546f"
source-issues:
  - "#64"
related: []
---

# Path-Namespace as Federation Primitive

When multiple teams share a central knowledge store, **logical-path namespacing per team inside the shared store is itself the federation contract** — sufficient, in operational practice, without a formal cross-team API or replication protocol layered above it.

`Projects/<team>/*`, `Meetings/<team>/<date>`, `Context/<team>/*`, `Resources/<team>/*` is the shape: every team owns its `<team>` shard at the path-namespace level; cross-team queries are URL-shaped (`logical_path="Meetings/<other-team>/..."`); convention does the work. No federation-layer middleware. No cross-team sync engine. No API gateway between team libraries.

This pattern collapses what looks like a substantial architecture problem ("design federation across N team libraries") into a much narrower one ("agree on a path convention, configure each team's MCP for the shared store").

## What the pattern is and is not

**It is:** a federation contract realized as path-naming convention inside a shared substrate. The substrate is one DB / one MCP / one deployment; teams partition the namespace and respect each others' shards by convention.

**It is not:** a federation layer over per-team substrates. There is no sync, no replication, no per-team databases — one substrate, namespaced.

**It is not:** a multi-tenant DB with row-level security. RLS is orthogonal: the substrate may use RLS for hard-isolation guarantees, but the federation primitive is the *path*, not the row-level check. RLS protects against unauthorized access; path-namespace is what makes cross-team query *intentional and discoverable* — different concern.

**It is not:** a substitute for shard sovereignty. Teams own their `Projects/<team>/*` namespace the way they would own a per-team filesystem; a path-namespace breach (writing into another team's shard) is treated as a governance violation, not a "merge conflict."

## When the pattern applies

Three conditions:

1. **A central knowledge store already exists or is being built**, and multiple teams are candidate consumers.
2. **Cross-team query is a real use case** (not just hypothetical) — at least two teams actually need to read each others' content.
3. **Per-team write sovereignty is a load-bearing concern** — each team's writes must not need cross-team coordination, but each team's reads must be able to span team boundaries.

When all three hold, path-namespacing is a candidate-first pattern. Try it before reaching for federation middleware.

## When it does NOT apply

- **Hard-isolation requirements** (different orgs, different security boundaries, different jurisdictions). Path-namespace is convention-enforced; teams in adversarial relationships need substrate-level isolation, not naming-convention isolation.
- **Substrate doesn't support path-as-first-class** (e.g., flat key-value stores with no logical-path concept). The pattern requires the substrate to treat `Projects/<team>/*` as a queryable structural unit, not just a string prefix.
- **Per-team substrates are a hard requirement** for other reasons (compliance, data residency, team-specific schema needs). In this case, federation middleware is unavoidable and path-namespace becomes a sub-pattern within each team's substrate, not the cross-team primitive.

## What the pattern collapses

Without path-namespace:
- **Federation-layer architecture** as a separate problem (write a sync engine, define conflict semantics, build replication channels).
- **Per-team substrate decisions** (each team picks markdown, sqlite, postgres, etc.) — an N-way decision space.
- **Cross-team query language design** (how does team A's query span into team B's content?).

With path-namespace:
- **One substrate decision.** All teams use the same store.
- **One convention.** `<top-level>/<team>/<...>`, agreed once.
- **One query language.** Whatever the substrate provides, with `logical_path` filters.

This is not magic — the costs migrate to the substrate (it had better be a good one) and to the per-team-curator role (governance for who writes to which namespace becomes more visible than file-tree-with-CODEOWNERS would make it). But the federation-layer problem-class evaporates.

## First instance — esl-suvekool on Brilliant

Observed: `mitselek/Haapsalu-Suvekool @e7d2546f`. Read by Finn 2026-05-05 (`finn-haapsalu-suvekool-glance.md`).

**Pattern in production:**

| Convention | Implementation |
|---|---|
| `Projects/<team>/*` is the team's primary shard | `Projects/esl` for esl-suvekool team |
| `Meetings/<team>/<date>` is per-meeting context | `Meetings/esl/2026-08-14-suvekool-haapsalu` |
| `Context/<team>/*` is durable cross-session context | `Context/esl/liisa-rahusoo-lahkumine-2027` |
| `Resources/<team>/*` is per-team reference material | `Resources/esl/*` |
| Cross-team query is `logical_path` filter on Brilliant's MCP | `mcp__brilliant__search_entries(logical_path='Meetings/esl/...')` |
| Writes route through staging per repo governance | `mcp__brilliant__update_entry` — the staging contract is substrate-level, orthogonal to the namespace |

**What this entry's source-team field does NOT say:** the citation is `mitselek/Haapsalu-Suvekool` (the esl-suvekool team's repo), but the entry is filed without `source-team:` because the *idea* originates in framework-research's analysis of esl-suvekool's substrate, not in esl-suvekool's wiki (esl-suvekool does not maintain a wiki of curated patterns). The team observed is esl-suvekool; the team that filed the pattern is framework-research.

**Operational rituals (named in finn-haapsalu-suvekool-glance.md, lifted as candidate sub-patterns for separate filing if they reach n=2):**

- `Brilliant pulse` at session-start: search recent entries on owned namespace, skim `updated_at` and `domain_meta.status` — lightweight session-init density-manifest.
- "Stable, non-obvious, saves-future-me-5min" quality floor for promotion from scratchpad to canonical store.
- `[SYNC BRIEF]` ↔ `[SYNC: YYYY-MM-DD]` handshake for two-consumer scenarios (filed separately as `two-consumer-pattern`).
- "Brilliant on tõe-allikas, see fail on käsiraamat" — source-of-truth discipline (the canonical store is authority; team docs are manuals).

These are operational details around the federation pattern. The path-namespace primitive is the load-bearing structural choice; the rituals are how a team operates productively *within* it.

## Implications for FR's Phase A

This pattern is **load-bearing for issue #65 (Phase A scoping).** The session-26 brief (`docs/2026-05-05-postgres-library-discovery-brief.md`) reframes Phase A from "design a federation layer" to "scale this proven operational pattern to FR + apex + other teams." The reframe is enabled by recognizing path-namespace-as-federation-primitive as the actual contract.

For FR:
- `Projects/fr/*` would be FR's primary shard.
- Cal's role evolves from "sole writer to FR's markdown wiki" to "FR's namespace curator inside the shared Brilliant" — sovereignty preserved at the namespace level.
- Per-team write governance (who can stage to which namespace) becomes an explicit policy surface that previously lived implicit in filesystem ownership.

These are Phase A design decisions, not facts the wiki encodes. This entry exists to make the *pattern* available; the *application* belongs in the Phase A design doc when it lands.

## Promotion posture

n=1 — observed in one team's production deployment. The pattern is operationally proven (esl-suvekool has 20+ refs across team docs, scratchpads, canonical files) and the brief's reframe is a substantial vote of confidence. **Watch for second instance** — most likely candidates: FR's own adoption during Phase A, apex-research adoption if they join the shared Brilliant, any other team's adoption of a similar shared-substrate-with-path-namespace pattern.

If FR's Phase A adopts the pattern successfully and apex-research follows, this likely promotes to topic-09 or to a dedicated section in the framework architecture topic — but that is downstream of Phase A's outcomes.

## Related

- [`two-consumer-pattern.md`](two-consumer-pattern.md) — sibling finding from the same Haapsalu-Suvekool glance. The path-namespace pattern is the *substrate-level* federation primitive; the two-consumer pattern is the *consumer-level* bridge for clients that can't query the shared substrate directly. Together they sketch a layered federation architecture.
- [`oss-thin-integration-anti-extension-signal.md`](oss-thin-integration-anti-extension-signal.md) — adjacent finding from the same session's deep-read of the underlying Brilliant substrate. Path-namespace can ride on Brilliant only because the substrate's data model is reusable; if the orchestration thin-integration signal had also blocked the data model, the federation pattern wouldn't be transplantable.
- [`integration-not-relay.md`](integration-not-relay.md) — the discipline that made the brief's reframe possible. Without integration-not-relay (and the cross-repo glance step it enabled), Phase A would have been designed against polyphony-dev's federation citation, which doesn't match substrate.

(*FR:Cal*)
