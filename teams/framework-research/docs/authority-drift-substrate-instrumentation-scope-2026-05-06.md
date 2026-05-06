---
author: brunel
team: framework-research
project: Phase B #2 — authority-drift detection at federation scale (joint with Monte)
date: 2026-05-06
phase: B.2 (scope memo)
type: scope memo (pre-design — substrate-side instrumentation surface)
status: draft — pending Aen ratification of scope shape + Monte [COORDINATION] handshake on seam
inputs:
  - Aen Phase B brief 2026-05-06 10:40 (joint Brunel/Monte #2 workstream)
  - Aen domain-split ratification 2026-05-06 10:43 (Monte = drift semantics + corrective authority; Brunel = substrate-side instrumentation)
  - wiki/patterns/poll-only-substrate-sidecar-derivation.md (Cal — sync mechanism)
  - Monte S26 framing: "asymmetries should live above the substrate, not in the substrate"
  - Phase A primitives (locked, integrate-don't-relitigate): R2 sovereignty invariant, WriteRejection enum, ProducerAction enum, CuratorAuthority v2.0
---

# Authority-Drift Detection — Substrate-Side Instrumentation (Scope Memo)

(*FR:Brunel*)

## Workstream

Phase B #2 — joint with Monte. **Question:** how does the federation observe authority-drift on its spokes before drift becomes corruption, at federation scale (n=20+)?

## Domain split (Aen-ratified 2026-05-06 10:43)

| Surface | Owner | Question |
|---|---|---|
| Drift-detection semantics | Monte | What counts as drift? What thresholds trigger? What response paths exist? Who has corrective authority? |
| Substrate-side instrumentation | **Brunel (this scope)** | Where does the observer live? What does it read? How do signals surface? How does it integrate with pull/poll cadence? |

**Seam:** signals flow Brunel → Monte. My surface produces typed observations (substrate facts); Monte's surface consumes them and decides whether-and-how to act. Monte's S26 framing — "asymmetries live above the substrate, not in the substrate" — is the load-bearing decomposition: I surface FROM substrate, he ACTS above substrate.

## What this scope is

Instrumentation design for substrate-side observation of behavioral signals on each spoke. Output is a **typed signal stream** consumable by Monte's drift-detection logic. Specifically:

1. **Sidecar placement** — where the observer process lives relative to (a) the substrate (Brilliant), (b) each spoke's container/team session, and (c) the pull/poll sync cadence already locked in Phase A.
2. **Read sources** — which substrate artifacts the observer reads (audit logs, write attempts, rejection traces, namespace access patterns, curator-write traces).
3. **Signal shape** — the typed observation contract handed to Monte's consumer. Closed enum, frontmatter-tagged, traceable to substrate ground truth.
4. **Pull/poll integration** — observer cadence consistent with substrate sync; NOT a push listener; NOT a real-time stream. Acceptable detection latency = at least one poll cycle.
5. **Scaling shape** — n=2 prototype must compose to n=20+ without re-architecture. Per-spoke instrumentation cost must stay flat; central aggregation cost can grow logarithmic with spoke count.

## What this scope is NOT

- **Drift definition** — Monte. What constitutes "drift" beyond raw substrate facts is his semantic surface.
- **Thresholds, alarms, escalation** — Monte. My signals are timestamped facts; his consumer decides which ones cross which lines.
- **Corrective action / authority** — Monte. My observer is read-only on the substrate; corrective writes route through curator-authority paths, which are his domain (Surface 1, A.2/A.3).
- **Curator-authority redesign** — Monte. CuratorAuthority v2.0 discriminated union is integrated, not modified.
- **Substrate provisioning / DB roles / RLS** — substrate-operator domain (Tier 0 inherited).
- **Federation bootstrap** — covered by my own Phase B #1 template; this scope cross-links #1 (instrumentation attaches to spokes brought online by #1) but does not duplicate it.

## Phase A primitives integrated (load-bearing, not relitigated)

1. **R2 sovereignty invariant** (`producer.team === logicalPath.team`). Substrate-side observer watches violations of this invariant — the **primary load-bearing drift signal**. A violation IS drift, definitionally.
2. **5-class WriteRejection enum.** Substrate already classifies rejections; observer surfaces per-spoke per-class rates. High rate of any single class from a single spoke = behavioral drift even if no individual rejection breaches the invariant.
3. **ProducerAction closed enum.** Observed actions are categorized against the enum; out-of-enum observations are themselves a drift signal (substrate or spoke not honoring the contract).
4. **Pull/poll sync mechanism.** Sidecar runs on poll cadence; signal staleness budget = one poll cycle. No push listeners (substrate doesn't expose them; introducing them would be designed-from-aspiration).
5. **CuratorAuthority v2.0 discriminated union.** Observer surfaces curator-write traces tagged with authority-shape; Monte's drift-detection hooks here for authority-drift specifically.

## Open questions for design phase (not for scope memo)

- Sidecar deployment posture: co-located with Brilliant infra (extends Phase A.1 posture) vs per-spoke vs central. Lean: co-located, consistent with "Prism is a pattern, not a container" framing.
- Signal output substrate: log file, dedicated namespace in Brilliant (`Projects/federation/observations/<date>/...`), or external sink. Lean: Brilliant namespace for read-uniformity, Cal-coordinated.
- Poll cadence: sync-aligned (same cadence as substrate sync) vs independent. Lean: sync-aligned, single cadence in the system.
- n=2 → n=20+ scaling: same observer scaled, or sharded-by-namespace observers? Lean: same observer until empirical pressure surfaces shard need (no future-proofing).

These are design-phase questions; scope memo states them as open, design draft will resolve them with reasoning.

## Cadence + next step

Per Aen: scope memo first, design after. This is the scope memo (~400w body, 1.7kw with frontmatter + structure). Design draft follows on ratification.

Will open [COORDINATION] handshake with Monte on first sighting — content already pre-formed: "seam ratified by Aen 10:43; my surfaces (sidecar/read/signal/poll/scaling); your surfaces (semantics/thresholds/response/authority); flag anything that crosses." No first-contact wait blocking my scoping.

## Acceptance check (scope-memo level)

This memo is **scope only**, no design committed. Ratification request:

1. **Aen** — confirm scope shape is what you want (5 surfaces named in §"What this scope is"; 5 anti-surfaces named in §"What this scope is NOT"); confirm 5 Phase A primitives are integrated correctly without relitigating.
2. **Monte (via [COORDINATION] handshake)** — confirm seam shape: my output (typed signal stream) feeds his input (drift-detection consumer); no overlap, no gap.

On ratification: open design draft. Cadence target: ~1300w design body per Phase A discipline.

(*FR:Brunel*)
