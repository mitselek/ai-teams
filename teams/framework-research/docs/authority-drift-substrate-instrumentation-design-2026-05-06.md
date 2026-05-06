---
author: brunel
team: framework-research
project: Phase B #2 — authority-drift detection at federation scale (joint with Monte)
date: 2026-05-06
phase: B.2 (design draft)
type: design (substrate-side instrumentation — pairs with scope memo 2026-05-06)
status: draft v0.2 — cite-and-fold pass on T04 §Authority-Drift Detection at Federation Scale (Monte canonical detector-side surface per his 11:42); Herald 04 typed-shape cross-links; Cal §6 corrective-authority resolution; #1 v0.7 envelope shape cascade
inputs:
  - teams/framework-research/docs/authority-drift-substrate-instrumentation-scope-2026-05-06.md (scope memo, ratified by Aen 2026-05-06 11:18)
  - Aen 11:18 nudges 1/2/3 (observation-point grounding, boundary refinement, discriminated union)
  - wiki/patterns/poll-only-substrate-sidecar-derivation.md (Cal — substrate sync mechanism)
  - wiki/patterns/protocol-shapes-are-typed-contracts.md (typed-contract consumer-side discipline — Monte 11:14 D5 reconciliation)
  - Monte [COORDINATION] open 2026-05-06 10:52 + Brunel close 10:54 (registry-shared composition)
  - topics/04-hierarchy-governance.md §Authority-Drift Detection at Federation Scale v1.2 (canonical detector-side surface; Monte 11:42 confirmed citation target for v0.2 cite-and-fold)
  - prism/designs/herald/04-federation-authority-record-contract.md v0.1.1 commit 2fa0618 (Herald typed-shape canonical source; §3 SovereigntyClaim, §4 BaselineDeviation, §3.1 PathSovereigntyAccessor)
  - teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md v0.7 (#1 federation-bootstrap envelope shape; observer reads RegistrationAuthority records this template emits)
  - Cal Protocol B 12:24 resolution (relayed by Aen 12:30): per-namespace curator = write-authority only, NOT corrective-authority recipient; L1 router → team-lead-of-accused-team is recipient. T04 §Authority-Drift §Recipient-and-authority-chain locks the framing.
  - Monte 2026-05-06 11:14 D5 framing reconciliation — typed-contract consumer-side discipline (detector consumes typed SovereigntyClaim, not raw fields)
  - Monte 2026-05-06 11:42 canonical citation target = T04 §Authority-Drift Detection (no separate design v1 file; substantive content lives in T04 amendment chain v1.0 → v1.2)
  - Phase A primitives: R2 sovereignty invariant, WriteRejection 5-class enum, ProducerAction closed enum, CuratorAuthority v2.0 discriminated union, pull/poll sync
amendments:
  - "2026-05-06: v0.1 — folds scope memo + Aen Nudges 1/2/3; ships with [GATE-PENDING-CAL] on §3.2"
  - "2026-05-06: v0.1 → v0.2 — cite-and-fold pass on T04 §Authority-Drift Detection (canonical detector-side surface per Monte 11:42); §3 signal shape adds typed SovereigntyClaim + BaselineDeviation cross-references citing Herald 04 §3 + §4; §3.1 explicit commitment-to-expose PathSovereigntyAccessor on observer surface (Monte 11:14 D5 reconciliation: detector consumes typed union, not raw fields, per protocol-shapes-are-typed-contracts.md); §6 default-recipient framing locked via T04 §Recipient-and-authority-chain (L1 router → team-lead-of-accused-team per Cal 12:24); §6.5 cross-link sub-sections citing T04 sub-section anchors per Monte 11:42 maximum-specificity citation table; §3.3 [GATE-PENDING-CAL] still open (output-substrate namespace path subject to Cal namespace ratification; structurally same-substrate either way per Monte D7-Δ ack at 11:42)."
---

# Authority-Drift Substrate-Side Instrumentation — Design Draft v0.2

(*FR:Brunel*)

## Posture (one paragraph)

The federation-side observer is a **typed-event relayer**, not a classifier. The substrate already classifies its own events (R2 sovereignty invariant, WriteRejection 5-class enum, ProducerAction closed enum, CuratorAuthority discriminated union); the observer's job is to surface those classifications to Monte's drift consumer, plus a small set of raw observable facts that no substrate primitive yet types. This posture preserves my read-only-on-substrate constraint, keeps the seam with Monte clean (substrate-asserted classifications + raw facts → Monte's semantics), and matches Aen's Nudge 2 reframe.

## §1 — Sidecar placement

**Decision:** **co-located** with existing Brilliant infra. One observer process per federation, polling the Brilliant substrate over its standard MCP read interface.

Rationale:

- Phase A.1 posture decision applies: "Prism is a pattern, not a container" + "co-located on existing Brilliant infra" (see `designs/brunel/container-deployment-posture-2026-05-05.md` on Prism repo). Adding a second co-located process for observation extends the same posture; the alternative (per-spoke observer) would n-tuple infrastructure cost without a load-bearing reason.
- Single observer = single source of truth for the typed-event stream Monte's consumer reads. n-observer aggregation would require its own consistency contract — designed-from-aspiration territory at this stage.
- Symmetric decoupling preserved: ITOps's eventual E-deployment migration of Brilliant carries the observer along; observer doesn't add to ITOps's plate.

**What this is not:** a per-spoke observer pulling from each spoke's container. The poll target is the substrate (Brilliant), not the spokes. Spokes write to the substrate; observer reads what the substrate received.

## §2 — Read sources

The observer reads the substrate's append-only envelope log via the same poll mechanism Cal's `poll-only-substrate-sidecar-derivation.md` derives. Specifically, the observer's read scope:

| Source | Substrate event type | What the observer surfaces |
|---|---|---|
| `WriteAccept` envelopes | typed-by-substrate | Curator-write trace (curator, target-namespace, timestamp, accepted producer-identity) |
| `WriteRejection` envelopes | typed by 5-class enum | Per-spoke per-class rejection counts; R2-class rejections specifically tagged |
| `RegistrationAuthority` envelopes | typed by Monte/Brunel registry-shared composition (see §5) | Latest non-superseded registry entry per team |
| `ProducerAction` envelopes | closed enum | Per-spoke action distribution |
| (Open question) Pre-rejection attempt log | TBD with Tier-0 — see §3.4 | If it exists: substrate-pre-rejection violation events. If not: noted as substrate-side requirement. |

**Nudge 1 fold (observation-point grounding):** R2 violations are rejected at write-time by the substrate's typed contract. The observer reads the **rejection trace** tagged with class `R2-sovereignty-violation`, NOT a hypothetical "pre-rejection violation event." If the substrate maintains a pre-rejection attempt log (some implementations do — they record what was attempted before rejection for audit purposes), the observer additionally reads that. If not, this is a substrate-side requirement to surface to Tier-0 in design phase. **Open question retained for Tier-0:** does Brilliant maintain a pre-rejection attempt log? Filing as §3.4.

## §3 — Signal shape (output to Monte's consumer)

**Nudge 3 fold (discriminated union):** signal-class as tag, payload typed by class. Cite CuratorAuthority v2.0 precedent.

```typescript
type ObservedDriftSignal =
  | { kind: "substrate-asserted-rejection",
      class: WriteRejectionClass,                 // 5-class enum from Phase A
      sourceTeam: string,
      targetNamespace: string,
      timestamp: ISO8601,
      envelopeId: string }
  | { kind: "substrate-asserted-curator-write",
      curator: string,
      targetNamespace: string,
      timestamp: ISO8601,
      envelopeId: string,
      acceptedAgainstRegistry: string | null }   // registry envelope id at write-time, null if pre-bootstrap
  | { kind: "raw-observable-fact",
      facet: "rate" | "cross-spoke-pattern" | "out-of-enum-action",
      payload: { /* facet-typed payload */ },
      timestamp: ISO8601 };
```

### §3.1 — Substrate-asserted classifications (Nudge 2 fold, surface (a)) + typed accessor commitments

The first two `kind` branches are **mechanical relays**. The substrate already typed the classification; the observer wraps the substrate's verdict in a poll-stream signal. Nothing semantic on my side. Monte's consumer reads the `class` field and applies whatever drift-thresholds his design specifies.

**Typed-accessor commitment (Monte 11:14 D5 reconciliation per `wiki/patterns/protocol-shapes-are-typed-contracts.md`):** the observer surface exposes a typed accessor `pathSovereignty(logicalPath: LogicalPath) → SovereigntyClaim` per Herald 04 §3.1 `PathSovereigntyAccessor`. The 3-state union `SovereigntyClaim` is per Herald 04 §3:
- `R2-self` — canonical R2-compliant case
- `R2-ratified-cross-team` — with `ratifiedBy: <recordId>` pointer to `RegistrationAuthority.recordId` from #1 federation-bootstrap stream
- `R2-violated` — anomaly; should be rejected upstream

**Detector consumes the typed union, NOT raw `logicalPath.team` fields.** Substrate decodes `logicalPath.team` AND observer classifies `SovereigntyClaim`; the typed union is the consumer-facing contract; the underlying derivation method is observer's implementation freedom. v0.1 observer was relayer-only per Aen Nudge 2; v0.2 commits to typed-accessor exposure. Cited in T04 §Authority-Drift §Signal classes (D5: `SovereigntyClaim.state === "R2-violated"`).

**Statistical-signal typed-accessor (D7 / D3):** per Herald 04 §4, the observer emits typed `BaselineDeviation` 4-state union (`within-baseline` / `deviating-conservatively` / `deviating-aggressively` / `insufficient-data`) with normalized magnitude. My §3.2 raw-fact `facet: "rate"` is continuous-magnitude (count-per-unit-time over (spoke, class, window)); composes with continuous-magnitude `BaselineDeviation` without categorical-fallback variant per Monte D7-Δ ack 11:42. Severity mapping per T04 §Signal classes: `within-baseline` → no signal, `deviating-conservatively` → info, `deviating-aggressively` → warning, `insufficient-data` → info-with-flag.

### §3.2 — Raw observable facts (Nudge 2 fold, surface (b))

The third `kind` branch is **unclassified observation**. Three facets the substrate does NOT type:

- **rate** — per-spoke per-class rejection rate over a window. Substrate emits individual rejections; the observer aggregates over (spoke, class, window) and emits the rate as a fact. **It is NOT drift** in observer's view; Monte's consumer decides whether a particular rate crosses a threshold.
- **cross-spoke-pattern** — same target-namespace receiving rejections from multiple spokes within a window. Observer surfaces the co-occurrence; Monte applies semantics (coordinated probe? misconfigured spoke? legitimate cross-team activity?).
- **out-of-enum-action** — `ProducerAction` enum is closed; observations not matching the enum surface as raw facts. This is itself a drift signal (substrate or spoke not honoring the contract), but the **classification** is Monte's call — he may treat it as severity `breach` or as `info` depending on circumstance.

### §3.3 — Output substrate (where the signal stream lands)

**Lean output substrate** (still `[GATE-PENDING-CAL]` on namespace path):
- Per-cycle observations: `Projects/federation/observations/<date>/<observer-poll-cycle-id>/`
- Per-team baselines: `Projects/federation/observations/<baselines>/<team>/` (parallel-tree to per-cycle observations under `<date>/`)

**Status of Cal gate (partial resolution per Cal 12:24 Protocol B answer):** Cal's 12:24 answer addressed the §6 corrective-authority-recipient question (per-namespace curator = write-authority only, NOT corrective-authority recipient). The output-substrate **namespace ratification** question remains open — my own Cal Protocol B 11:05 / 11:21 substrate-tested via re-send (worktree-OUTBOUND mount-asymmetry per `wiki/patterns/worktree-spawn-asymmetry-message-delivery.md` Sub-shape B). Aen's 13:38 path-b relay folded Cal's 8-citation response on v0.5 §0 cross-read; output-substrate-specific namespace ratification not yet surfaced.

**Structural risk: minimal.** If Cal's eventual answer changes the namespace shape, both per-cycle observations + per-team baselines move together (single namespace family). Detector reads from the namespace family; the observer writes to the namespace family. Path-string drift is absorbed by both consumers at fold time. **Same-substrate baselines confirmed by Monte D7-Δ at 11:42**: detector reads from `<baselines>/<team>/`; same substrate, no separate per-team locality storage needed.

If the federation namespace lands cleanly: observer is the sole-writer (observer-as-curator for `Projects/federation/observations/*`). If the curator-authority resolution lands a different shape (e.g., observation namespace owned by a designated drift-authority team, with observer as participating-writer not sole-writer), the design adapts — output mechanics same, governance overlay different.

### §3.4 — Open questions to Tier-0

- Pre-rejection attempt log: does Brilliant maintain it? If yes, observer reads it as additional `kind: "substrate-asserted-rejection"` payload (with `state: "pre-rejection"` discriminator); if no, surface as substrate-side requirement.
- Append-only-additive guarantee on `WriteAccept`/`WriteRejection` envelopes: is it contractual? Phase A typed contracts assume yes; observer's no-re-derivation-per-poll assumption depends on this. Likely already typed; verifying with Tier-0 is the discipline.

## §4 — Pull/poll integration

Observer cadence = sync-aligned with substrate sync (single cadence in the system). Per Phase A pull/poll DECISION + Cal's `poll-only-substrate-sidecar-derivation.md` cost-bounding insight: derive signals first, emit derived events to escalation channel; do not spawn per-raw-event handlers.

Concretely:

- One poll cycle = one observer pass over the new envelopes since last cycle (cursor-based, idempotent).
- Per cycle, observer emits zero-or-more `ObservedDriftSignal` records to the output substrate (§3.3, gated).
- Staleness budget: detection latency ≤ one poll cycle. Acceptable per scope memo.
- No push listener. No real-time stream. No long-polling.

**Crash recovery:** observer cursor is durable on the substrate side (substrate stores the cursor); on observer crash + restart, polling resumes from last-acknowledged cursor. No signal loss on crash; possible re-emission of last cycle's signals on imperfect crash boundary — Monte's consumer must be **idempotent on `envelopeId`** (which is already a Phase A guarantee on substrate envelope identifiers).

## §5 — Scaling shape (n=2 → n=20+)

**Same observer scaled,** NOT sharded-by-namespace observers. Until empirical pressure surfaces shard need (no future-proofing).

Rationale:

- n=2 prototype = one observer reading the whole envelope log. No per-spoke logic at the observer level — substrate already aggregates.
- n=20+ projection: poll-cycle work scales with envelope volume per cycle, NOT spoke count. Per-spoke instrumentation cost is FLAT at the observer (the substrate's append-only log includes all spokes).
- Central aggregation cost (the observer's own poll-cycle compute) scales with envelope volume — bounded by substrate write throughput, which substrate already governs at Tier-0.
- If empirical pressure surfaces shard need (e.g., poll cycles taking longer than the staleness budget at n=20+), the design escalates to a sharded shape — but that's a decision FROM observation, not designed-from-aspiration.

**Anti-pattern explicitly rejected:** per-spoke observer process. Doing this at n=2 would n-tuple infrastructure with no load-bearing reason; doing it at n=20+ would require an aggregation layer the substrate already provides. Don't do it.

## §6 — Cite-and-fold to T04 §Authority-Drift Detection (canonical detector-side surface)

(Per Aen 11:18 cadence shift — cite-and-fold, no co-design. Monte 11:42 confirmed citation target: detector-side substantive content lives in `topics/04-hierarchy-governance.md §Authority-Drift Detection at Federation Scale` v1.2; no separate Monte design v1 file on disk.)

**Maximum-specificity citation map** (per Monte 11:42 sub-section table; paragraph-stable across T04 amendments):

| What this design references | T04 path |
|---|---|
| Detector overall placement + below-governance structural argument | `§Authority-Drift Detection at Federation Scale §Substrate-typed detection` (line ~866) |
| D1-D8 typed-invariant + statistical signals catalog | `§Authority-Drift Detection at Federation Scale §Signal classes` (line ~872) |
| `BaselineDeviation` severity mapping (within-baseline / deviating-conservatively / deviating-aggressively / insufficient-data) | `§Authority-Drift Detection at Federation Scale §Signal classes` (closing paragraph, line ~888) |
| Digest-first output mode + per-event escalation by exception | `§Authority-Drift Detection at Federation Scale §Output design — digest-first, escalate by exception` (line ~890) |
| L1 router → team-lead-of-accused-team recipient (Cal-ratified 12:24) | `§Authority-Drift Detection at Federation Scale §Recipient and authority chain` (line ~894) |
| Detector flow ASCII diagram | `§Cross-Team Audit Authority §Federation-Scale Drift Detection Flow` (line ~361) |
| What the detector MAY NOT do (5 forbidden actions) | `§Cross-Team Audit Authority §What the Drift Detector May NOT Do (Federation-Scale)` (line ~399) |
| References (Herald 04 spec, federation-bootstrap-template v0.6+) | `§Authority-Drift Detection at Federation Scale §Reference` (line ~900) |

**Asymmetry locked at admission-binding / drift-advisory:** per T04 §Substrate-typed detection (line 870): *"the asymmetry — admission needs to commit, observation needs to caution — keeps binding-by-bootstrap separate from advisory-by-drift."* This is the framing I introduced in #1 v0.2 §6 and Monte cited back in his Topic 04 amendment chain. Adoption-not-contestation.

**Default recipient framing locked via T04 §Recipient and authority chain:**
- Drift detector emits typed `ProducerAction` advisory signals (`escalate-to-team-lead`, `escalate-to-governance`).
- L1 router → team-lead-of-accused-team is the recipient.
- The per-namespace curator named in a drift signal is the *subject* of the signal, not the *recipient* of governance authority. (Cal 12:24 Protocol B resolution citing `wiki/patterns/substrate-shape-vs-authority-shape-orthogonality.md`.)
- ProducerAction emission targets are L1 (typed-invariant breach) or digest-aggregator (statistical signal); never the named curator directly.

**Registry-shared composition (10:54 [COORDINATION] handshake closure):** The `RegistrationAuthority` envelope from #1 federation-bootstrap-template v0.7 is the typed reference-data my D6 detector reads. Field-name alignment verified end-to-end via Herald 04 v0.1.1 spec direct citation: `kind: "RegistrationAuthority"`, `recordId: string` (producer-side), `team: TeamId`, `namespace: LogicalPath`, `curator: { team: TeamId; agent: string }`, `ratifiedBy: { team: TeamId; agent: string }`, `ratifiedAt: ISOInstant`, `justification: { curatorRosterCite, justificationProse }`, `conventionRetestCount: number` (bootstrap-time-only snapshot), `supersedes: string | null` (nullable). My §3 signal `kind: "substrate-asserted-curator-write"` carries `acceptedAgainstRegistry: string | null` referencing the registration's `recordId`.

Monte's severity enum attaches at his consumer side per T04 §Signal classes (`BaselineDeviation` 4-state union maps to severity: `within-baseline` → no signal, `deviating-conservatively` → info, `deviating-aggressively` → warning, `insufficient-data` → info-with-flag). The observer surfaces facts and substrate-asserted classifications; consumer applies severity per T04. Boundary preserved.

**Monte's substantive content lives in T04 §Authority-Drift Detection v1.2** (Monte 11:42 confirmation: no separate design v1 file; design content moved straight from his SendMessage payload to T04 amendment chain). v0.2 cite-and-fold pass (this revision) closes the cite-and-fold from-Monte pending-state.

## §7 — Failure modes

| Mode | Symptom | Recovery |
|---|---|---|
| Observer crash | Poll cycle stops; backlog accumulates on substrate | Auto-restart; cursor resumes from last-acknowledged; backlog drained on next cycle |
| Substrate down | Observer poll fails; no signals emit | Tier-0 SLA applies; observer surfaces "substrate-unreachable" once on recovery |
| Output substrate gate unresolved | §3.3 cannot land | `[GATE-PENDING-CAL]` flag; signals buffer locally until gate resolves |
| Signal-shape mismatch with Monte's consumer | Type mismatch errors at consumer | Pre-merge typed-contract cross-read with Monte (per `wiki/patterns/protocol-shapes-are-typed-contracts.md`) before v0.2 ratification |
| Pre-rejection attempt log absent | §3.4 question resolves "no" | Surface as Tier-0 substrate-side requirement; observer's substrate-asserted-rejection branch retains relevance with `state: "post-rejection"` only |

## §8 — Acceptance check

**Draft v0.2 status — three closed, one partial-open, one routing-deferred:**

1. ✓ **Aen ratification** — confirmed at 11:18 (Nudges 1/2/3 folded) + 11:46 (#2 design v0.1 ratified end-to-end with five line-items confirmed). v0.2 cite-and-fold pass folds Monte D5 reconciliation per Aen's 11:46 lean ("accept Monte's typed-output framing").
2. ✓ **Monte verification** — closed via Monte 11:14 (envelope verified consumable for D5/D6/D7/D8/D2; D5 reconciliation surfaced) + Monte 11:40 (reciprocal close on field-name alignment) + Monte 11:42 (canonical citation target = T04 §Authority-Drift Detection; D5-Δ + D7-Δ folded; v0.2 cite-and-fold target confirmed).
3. **Cal §3.3 output-substrate gate — partial:** Cal's 12:24 Protocol B answered §6 corrective-authority recipient (L1 router → team-lead-of-accused-team; folded into §6 of this design). Output-substrate namespace ratification still open; structural risk minimal per §3.3 (single namespace family absorbs path drift). Cal's 8-citation Protocol B response on v0.5 §0 of #1 cross-read folded by Aen 13:38 path-b relay; output-substrate-specific question deferred to next Cal cycle.
4. → **Tier-0 §3.4 open questions** (via Aen routing): pre-rejection attempt log existence + append-only-additive guarantee on `WriteAccept`/`WriteRejection`. Aen 11:46 routed to Cal first-pass via Protocol B; if Cal returns `not-documented`, escalates to PO at session-tail. Non-blocking on v0.2 ship per Aen 11:46.

**v0.2 SHIPPED.** Execution-ready when (3) Cal output-substrate namespace ratifies + (4) Tier-0 questions resolve. Both non-blocking on the design's structural correctness; both fold cleanly when answers land per cite-and-fold discipline.

## §9 — Cross-link to #1

**#1 federation-bootstrap-template v0.7** (`teams/framework-research/docs/federation-bootstrap-template-2026-05-06.md`) ships the spoke-config + `RegistrationAuthority` envelope at admission. This design (#2 v0.2) reads the registry envelope on poll cadence to validate post-admission writes. Cleanly composable; the seam ratified in [COORDINATION] handshake at 10:54 is the load-bearing decomposition. **Bootstrap = admission control; drift = post-admission monitoring.** Orthogonal cuts, composable through the registry envelope as shared substrate primitive.

**Detector-side hooks already in #1 v0.7 §6.5 cross-link:** D5 (R2 sovereignty boundary crossing — typed `SovereigntyClaim` consumer contract per Monte 11:14 reconciliation), D6 (Authority-floor regression — advisory-emit per T04 §Recipient-and-authority-chain), D7 (rejection-rate anomaly — continuous-magnitude `BaselineDeviation`), D8 (admission-velocity anomaly — Monte 10:55 catalog addition). Bidirectional cite-and-fold complete.

(*FR:Brunel*)
