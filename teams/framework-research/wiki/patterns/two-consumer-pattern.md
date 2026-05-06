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

# Two-Consumer Pattern: Direct-MCP vs Synthesized-Snapshot

When a knowledge store has **two classes of consumer** — one with direct query access (MCP, REST, DB driver) and one without (claude.ai Projects, kiosk dashboards, offline mobile clients) — the right architecture is **a manual synthesis-and-handshake bridge** between them, not "force everything through one channel."

The shape:

- **Direct-query consumers** pull from the store on demand at session-start and during work.
- **Snapshot consumers** receive periodic synthesized snapshots (curated, summarized, dated) via copy-paste handshake.
- **A short, greppable sync handshake** (`[SYNC BRIEF]` from authoritative team → snapshot consumer; `[SYNC: YYYY-MM-DD]` echo back; `.last-sync` anchor file) confirms what was sent and when, so both sides know the snapshot's freshness.

This is preferable to forcing both consumers through the lower-capability channel ("just use snapshots for everyone") or building infrastructure to give snapshot consumers direct access ("expose Brilliant to claude.ai via webhook"). The two-consumer pattern accepts the asymmetry, names it, and bridges it with the cheapest possible handoff: structured copy-paste with a date anchor.

## What the pattern is and is not

**It is:** a deliberate, named bridge between two consumer classes with different capabilities. Both classes are first-class; neither is degraded.

**It is not:** a sync mechanism. There is no automated replication. The handshake is a copy-paste ritual a human or human-in-the-loop runs.

**It is not:** a fallback. Snapshot consumers are not "fallback for when the direct channel is down." They are a different consumer class with a different access model — possibly different security/network posture, possibly different platform constraints.

**It is not:** a cache. A cache is automatically refreshed and probabilistically stale. The snapshot is intentionally curated and dated; staleness is visible in the `[SYNC: YYYY-MM-DD]` echo.

## When the pattern applies

Three conditions:

1. **Two consumer classes** with materially different access capabilities (one queries directly, one cannot).
2. **Both classes need access** to the same knowledge — neither is optional.
3. **Snapshot freshness can be measured in days, not seconds.** The handshake cadence is the right cadence; if snapshot consumers need sub-day freshness, this pattern doesn't fit (build a thinner direct channel instead).

When all three hold, the two-consumer pattern collapses what looks like an integration problem into a copy-paste ritual.

## When it does NOT apply

- **Snapshot consumer needs sub-day freshness.** Build a thinner direct channel; do not run handshakes hourly.
- **Snapshot consumer outnumbers direct-query consumer.** The handshake's cost scales linearly with snapshot consumers; if there are many of them, replication infrastructure is cheaper.
- **The direct-query consumer's data is sensitive in ways the snapshot must not expose.** Filter at synthesis time (the brief is curated, not raw extract) — but if filtering complexity grows, build a separate channel rather than extending the handshake.

## What the handshake carries

Three things, minimum:

1. **Curated snapshot content.** Not a raw extract — a deliberately summarized, indexed, recency-marked digest of the canonical store filtered for what the snapshot consumer needs.
2. **A date anchor.** `[SYNC: YYYY-MM-DD]` — visible to both sides, anchored to the canonical store's state on that date.
3. **An echo signal.** The snapshot consumer echoes the date back when received, confirming the handshake completed (the canonical-side knows the snapshot is in use, not just sent).

Optional but useful:

- A delta marker (what changed since last sync) — surfaces churn without forcing a full re-read.
- A pending-questions block — what the snapshot consumer is currently working on that the canonical side may want to address in the next sync.
- A `.last-sync` anchor file in the snapshot consumer's repo, providing a queryable record of when the last handoff occurred.

## First instance — esl-suvekool roadwarrior-sync skill

Observed: `mitselek/Haapsalu-Suvekool @e7d2546f`, `.claude/skills/roadwarrior-sync/SKILL.md`. Read by Finn 2026-05-05 (`finn-haapsalu-suvekool-glance.md`).

**Pattern in production:**

| Component | Implementation |
|---|---|
| Direct-query consumer | The local 4-agent team — queries Brilliant directly via `mcp__brilliant__*` tools |
| Snapshot consumer | A claude.ai Project — cannot query Brilliant; receives synthesized snapshots only |
| Handshake direction | Local team → claude.ai Project via `[SYNC BRIEF]` |
| Echo signal | claude.ai Project → local team via `[SYNC: YYYY-MM-DD]` |
| Anchor file | `.last-sync` in the claude.ai Project's working state |
| Quoted from skill | "Project Claude **cannot query Brilliant** — knowledge is whatever you've uploaded. If a question genuinely needs Brilliant context, escalate to the local team." (`roadwarrior-sync/SKILL.md:140`) |

**Operational implications observed in the source memo:** the discipline forces explicit decisions about *what to synthesize* (curation) — there is no "just dump everything," because the snapshot has size limits and freshness windows. This pressures the canonical-side toward writing entries that make sense as standalone snapshots rather than entries-that-only-make-sense-in-context. A useful side-effect.

## Why naming the asymmetry helps

In a hypothetical world where the team didn't name the asymmetry, the most likely failure modes are:

- **The snapshot consumer silently degrades.** Without a date anchor, snapshot freshness becomes invisible; consumers act on stale knowledge until a discrepancy surfaces.
- **The team builds infrastructure for the wrong problem.** "Let's just give claude.ai Projects access to Brilliant" leads to a webhook system / DCR setup / cross-platform auth project — orders of magnitude more expensive than copy-paste, for a problem that copy-paste solves cleanly.
- **The team runs the lower-capability channel for everyone.** Direct-query consumers stop using their direct access ("we're already maintaining the snapshot, just read that") — losing the freshness and dynamic-query advantages they had.

Naming the pattern makes the asymmetry first-class: both consumers are valid, both have correct access models, and the handshake is the bridge — not the workaround.

## Promotion posture

n=1 — observed at one team's production deployment. **Watch for second instance** in the form of any team developing a similar bridge between direct-MCP and copy-paste-only consumers. Likely candidates: any FR consumer that's not the local 7-agent team (e.g., if FR work surfaces to a stakeholder dashboard or external review process); any team that uses claude.ai Projects as a reading-only context surface alongside their local agent team.

If FR's Phase A produces a federation layer, the two-consumer pattern is a candidate for documenting non-Claude consumers (REST API users, dashboards) versus Claude consumers (MCP-direct). The same asymmetry shape would apply.

## Related

- [`path-namespace-as-federation-primitive.md`](path-namespace-as-federation-primitive.md) — sibling finding from the same Haapsalu-Suvekool glance. Path-namespace is the *substrate-level* federation primitive (within-shared-store team partitioning); two-consumer-pattern is the *consumer-level* bridge for clients that can't reach the shared substrate. Together they sketch a layered architecture: substrate is namespaced; consumers are bridged.
- [`oss-thin-integration-anti-extension-signal.md`](oss-thin-integration-anti-extension-signal.md) — relevant when evaluating "should we add a snapshot-consumer-facing API to the canonical store?" If the substrate's integration shape shows thin-integration signals, building such an API is a replacement-grade undertaking, not an extension. The two-consumer pattern is a much cheaper alternative when the signals are present.

(*FR:Cal*)
