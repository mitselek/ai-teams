---
source-agents:
  - finn
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - docs/2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md
  - docs/2026-05-05-postgres-library-discovery-brief.md
source-commits: []
source-issues:
  - "#64"
related: []
---

# Soft-Verdict Discipline on Substrate-Mapping Briefs

When PO framing is in flight and team-lead asks for a **surface map** (not an architecture pick), the right shape of the deliverable is:

> A table of N candidate options × {**accommodates without modification** / **accommodates with additions only** / **requires replacement**} with concrete code-cost notation per cell.

**Not** a "recommended" verdict, not a "we should do X," not a single chosen direction. The discipline is **soft-verdict**: deliver the substrate's accommodation profile across all live candidate shapes, and let the architecture pick happen later — by team-lead, in dialogue with PO, with the full table on the desk.

## Why this discipline exists

When the PO is still deciding between architecture shapes, a "recommended" verdict from the substrate-mapping brief commits early:

- The PO either accepts the recommendation (skipping the architecture-pick step the brief was *not* authorized to make), or
- The PO rejects it and the brief's structure is now wrong-shaped — the rejected verdict's surface analysis was bundled inside it, requiring rework to extract substrate facts that should have been independent of the verdict.

Soft-verdict avoids this by **structurally separating substrate facts from architecture choice**. The substrate's accommodation profile is the same regardless of which shape gets picked; the table answers "if we pick shape X, what does the substrate cost us?" for every X simultaneously. Picking X is a separate decision the brief does not pre-empt.

## The shape of a soft-verdict table

| Shape | Data model | Reviewer/orchestration code | Event surface |
|---|---|---|---|
| Shape A (status quo / as-shipped) | reusable / requires migration / N/A | as-is / requires replacement | n/a |
| Shape B (one alternative) | reusable / requires migration | requires replacement | accommodates without modification |
| Shape C (another alternative) | reusable / requires migration | requires replacement | accommodates with additions only |
| Shape D (hybrid) | reusable / requires migration | requires replacement | accommodates with additions only |

Every cell has a concrete code-cost notation (file paths, LOC estimates, schema-migration steps, addition shapes). The "what's free" and "what's not" rows live below the table, independent of shape — they describe the substrate's invariants.

## When the discipline is in tension

Soft-verdict is the right shape when **PO framing is mid-stream**. It is *not* the right shape when:

- **PO has already picked the shape** and asks "what does it cost?" — the brief should answer the picked shape's costs in detail and not waste columns on rejected alternatives.
- **The team is doing the architecture pick itself** (no PO in the loop) — in this case, soft-verdict converts to "table of options + verdict" once the team agrees, and the verdict belongs in a follow-up doc, not retrofitted into the substrate map.
- **The substrate has a single invariant blocker** that disqualifies most shapes — the brief should lead with the blocker, not bury it in a table.

The signal for "PO framing is in flight" is concrete: PO asks two or more reframing questions during the same session, OR the team-lead's request explicitly says "map, don't pick," OR the original problem statement still has open variables when the brief is being authored.

## When to convert soft-verdict to verdict

After the architecture pick is made (whether by PO or team), the soft-verdict table is **input** to the follow-up architecture-pick doc, not the doc itself. The pick doc cites the substrate map by reference, then commits to one shape. The substrate map remains valuable as the working artifact future readers consult to understand *why* the pick was made.

Do not retrofit the substrate map with the verdict after the fact. That collapses the separation the discipline existed to preserve. File the verdict in a follow-up; keep the map clean.

## First instance — Brilliant substrate map for issue #64 thinktank

Observed: Finn's two re-framings of his own Q7 during the 2026-05-05 #64 thinktank session.

The original Q7 framing was "is Brilliant's Tier 3 reviewer extensible enough to host a curator team?" — which implicitly asked Finn to **deliver a verdict** (yes/no, with reasoning).

After mid-session PO reframing (PO walked back from "every read/write triggers team-lead" to "time-based maintenance runs are also valid — vision not mature"), Finn re-framed his own Q7 to a **substrate-map shape**: a table of four candidate curator-team shapes (Brilliant-as-shipped, time-based maintenance run, sidecar event-bus, hybrid) × three substrate-accommodation columns (data model / reviewer code / event surface), with concrete cell-by-cell entries.

**Why this saved rework:** the sidecar-event-bus shape Finn had been about to recommend got walked back by PO's no-fallback constraint *during the same session*. Had Finn delivered the original verdict-shaped Q7 answer, the recommendation would have been instantly stale; the brief would need rework to extract substrate facts buried inside the (now-wrong) verdict. Because the substrate map was structurally separate from any verdict, PO's reframing landed cleanly: the table stayed correct, only the architecture-pick column moved.

**Meta-process discovery:** Finn caught his own framing drift mid-session. The discipline is not "always deliver soft-verdict"; it is "recognize when soft-verdict is the right shape and reframe before delivery." That meta-step (*re-framing one's own analysis before submitting*) is what made the discipline visible — without the reframe, soft-verdict would have looked like just-another-deliverable-format rather than a load-bearing methodological choice.

## Promotion posture

n=1. The pattern is internally consistent and the meta-process catch is unusually sharp (Finn re-framed his own Q7 mid-session, caught the drift before submission), but evidence is from one session. **Watch for second instance** — likely candidates: any future substrate-mapping brief during PO mid-stream framing, future thinktank sessions where the request is "map, don't pick." Promote on second instance with confirmed soft-verdict-vs-verdict shape distinction.

## Related

- [`integration-not-relay.md`](../patterns/integration-not-relay.md) — the discipline of verifying substrate claims against the substrate before downstream design depends on them. Soft-verdict is a *delivery shape* that supports integration-not-relay's *content discipline*: the table format makes substrate-facts queryable independent of any one architecture pick.
- [`oss-thin-integration-anti-extension-signal.md`](../patterns/oss-thin-integration-anti-extension-signal.md) — sibling finding from the same session. The thin-integration signal is a *content discovery* about Brilliant; the soft-verdict discipline is the *meta-process* that surfaced the discovery cleanly. Same source memo, two different layers.

(*FR:Cal*)
