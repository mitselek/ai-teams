---
author: finn
team: framework-research
date: 2026-05-05
phase: A (handoff brief — synthesis from existing artifacts only)
issue: 65
audience: Brunel, Monte, Herald (architecture specialists, on spawn)
sources:
  - docs/2026-05-05-postgres-library-discovery-brief.md (C-phase verdict)
  - docs/2026-05-05-phase-a/finn-dedup-census-2026-05-05.md
  - docs/2026-05-05-phase-a/finn-cross-team-query-frequency-2026-05-05.md
  - team-lead scratchpad SESSION 25 WRAP block
  - team-lead messages 2026-05-05 15:46/15:51
---

# Phase A Handoff Brief — Postgres Library Federation

(*FR:Finn*)

**Read this instead of digging through C-phase brief + my two reports + team-lead's scratchpad.** This is the synthesis pass for what the architecture specialists can assume, what they decide, and what's still unknown. ~750 words.

## §1 — Substrate baseline (5 facts you can ASSUME)

Each is observed, not speculative. Cite the source if you want to verify.

1. **One-tenant Brilliant.** Only esl-suvekool populates Brilliant today (6 documented entries across 4 namespaces). FR has no MCP config; polyphony glance returned clean negative. → `finn-dedup-census-2026-05-05.md` §1, §4.
2. **Namespace-shape mismatch.** Brilliant's production top-level is content-categorical: `Projects/`, `Meetings/`, `Context/`, `Resources/`. FR wiki's top-level is document-type: `patterns/`, `gotchas/`, `decisions/`, `contracts/`. Orthogonal axes. → `finn-dedup-census-2026-05-05.md` §3 + §7 candidate 2.
3. **Asymmetric hub-and-spoke topology.** FR is the methodology-producing hub (~10× more cross-team-aware than apex by wiki-mention rate). raamatukoi/screenwerk/esl-suvekool consume; reverse flow ~0. apex is large (77 entries) but cross-team-unaware (~0.09 cross-team mentions/entry). → `finn-cross-team-query-frequency-2026-05-05.md` §1, §6, §8.
4. **5+ orders of magnitude latency headroom.** Observed cross-team query rate (proxy from materialized cross-pollinations, sessions 20-25): ~1-10 events/week cluster-wide. Brilliant published throughput: ~178 ops/s. Polling, weekly-sync, eventual-consistency are all within budget. → `finn-cross-team-query-frequency-2026-05-05.md` §6, §7.
5. **Two query patterns, not one.** Methodology namespace = many-readers/few-writers (hub model, cross-team-shared). Product namespace = one-writer/few-readers (esl-suvekool model, team-private). Different cadence, different access shape, likely different contract. → `finn-dedup-census-2026-05-05.md` §3 ("Asymmetry observation"), `finn-cross-team-query-frequency-2026-05-05.md` §9 (5).

## §2 — Open architecture decisions (your turf, do not pre-empt)

Each phrased as a question with the pre-empirics, not a recommended answer.

1. **Namespace taxonomy.** Single (which axis?) / both with mapping rules / orthogonal-axes (a `(content-category × document-type)` 2D address)? esl-suvekool uses content-categorical only. FR's wiki populates document-type only in markdown. Phase A picks the contract. → `finn-dedup-census-2026-05-05.md` §6 item-1.
2. **Federation topology.** Hub-and-spoke (empirical today, FR-as-hub) / peer-mesh (aspirational, every team produces methodology) / hybrid (hub for methodology, mesh for product cross-references)? The empirical answer is hub-and-spoke; peer-mesh is design-from-aspiration not from-observation. → `finn-cross-team-query-frequency-2026-05-05.md` §8.
3. **Sync mechanism.** Polling-with-cursor / weekly batch sync / event-driven (`pg_notify`/sidecar)? Latency budget allows all three. Cost-of-derivation considerations from session-25 still apply (sidecar polling with sequence-cursor is C-phase recommended starting shape; PO walked back the "every read/write triggers" framing, time-based is also valid). → `2026-05-05-postgres-library-discovery-brief.md` "Event surface — push vs poll" + "Substrate-map verdict."
4. **Methodology vs product namespace asymmetry.** Shared contract (one schema, two access patterns) or separate (different schemas, federated at query-layer)? Volume × privacy × write-frequency differ across the two. → `finn-dedup-census-2026-05-05.md` §3 + §6 item-1.
5. **Cal's role evolution.** From "sole writer to FR's markdown wiki" to "FR's namespace-curator inside shared Brilliant" — what's the scope of namespace curation? Single team (Projects/fr/*)? Methodology-namespace shared with apex/sibling-libraries? Cross-team conflict resolution authority? → `2026-05-05-postgres-library-discovery-brief.md` "What this means for phase A" item-3.
6. **Write-block error semantics.** Session-25 [DECISION] locked: refuse-with-retry-when-curator-up if Tier 3+ writes arrive without curator team alive (no fallback, per `feedback_no_fallbacks.md`). Open: HTTP 503 / queued-with-retry-after / per-tier degradation rules? → `2026-05-05-postgres-library-discovery-brief.md` "Decision: write-availability is gated on team-availability."

## §3 — Cal-routing block (Protocol A candidates, queued by team-lead)

Eight candidates queued (six from this session + two carried from session-24):

| # | Candidate | Class | Source |
|---|---|---|---|
| 1 | OSS thin-integration anti-extension signal | pattern | `finn-staging-review-deepread.md` (Brunel-domain hint) |
| 2 | Poll-only-substrate + sidecar-derivation as event-driven shape | pattern | `finn-staging-review-deepread.md` |
| 3 | Soft-verdict discipline on substrate-mapping briefs | pattern (process) | `finn-staging-review-deepread.md` Q7 reframings |
| 4 | Cross-repo glance: confirm citation before assuming inheritance | pattern (process) | `finn-polyphony-dev-glance.md` |
| 5 | Path-namespace as federation primitive | pattern | `finn-haapsalu-suvekool-glance.md` |
| 6 | Two-consumer pattern: direct-MCP vs synthesized-snapshot | pattern | `finn-haapsalu-suvekool-glance.md` (roadwarrior-sync) |
| 7 | Brilliant has zero cross-team population (provisioned but unused at n≥2) | gotcha | this-session §0 (both phase-A docs) |
| 8 | Brilliant namespace shape is content-categorical, not document-type | reference | `finn-dedup-census-2026-05-05.md` §3, §7 |
| 9 | Pre-scaling census of one-tenant federation measures configuration, not overlap | pattern (process) | `finn-dedup-census-2026-05-05.md` §5 + §7 |
| (carried) | `source-team` frontmatter promotion to standard schema | Protocol C | session-24 [WIP] |
| (carried) | Architectural-fact convention promotion to Cal's prompt | Protocol C | session-24 [WIP] |

Cal routes after current Protocol A batch finishes. Specialists do not need to act on this list — informational only.

## §4 — Known gaps (what you CANNOT assume)

Bound the inferences:

- **Brilliant content not directly inspected this session.** MCP unavailable for FR; counts are HIGH-confidence on entry *names* (6 documented entries), inferred on contents/sizes. Configure Brilliant MCP for FR is itself a Setup-phase deliverable for issue #65. → `finn-dedup-census-2026-05-05.md` §1.
- **Live federation traffic does not exist.** Cross-team query rate (~1-10/week) is the *proxy* from materialized cross-pollinations (`source-team:` frontmatter, prose backlinks, harvest docs), not from instrumented federation logs. Real post-scaling rate may differ. → `finn-cross-team-query-frequency-2026-05-05.md` §0.
- **Pre-scaling dedup count is structurally near-zero.** Phase A's research deliverable on dedup is *instrumentation design*, not a baseline number. Defer the measurement to post-scaling. → `finn-dedup-census-2026-05-05.md` §5.
- **Cross-team-pattern n=2 examples are thin (~10 entries).** Wiki-cross-link-convention is the only "co-discovered, not seeded" instance. Most n=2 cases are FR→raamatukoi seeding, not independent rediscovery. → `finn-cross-team-query-frequency-2026-05-05.md` §5.
- **Apex's low cross-team-awareness is empirical, not normative.** Don't assume FR's cross-team rate is "right" or apex's is "wrong" — could be a steady-state or pre-cross-team-discovery. Re-survey on contact event. → `finn-cross-team-query-frequency-2026-05-05.md` §10 last row (open question).

(*FR:Finn*)
