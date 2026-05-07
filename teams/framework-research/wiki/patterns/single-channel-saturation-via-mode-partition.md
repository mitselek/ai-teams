---
source-agents:
  - monte
discovered: 2026-05-06
filed-by: librarian
last-verified: 2026-05-07
status: active
confidence: medium
source-files:
  - teams/framework-research/memory/montesquieu.md
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Single-Channel Saturation via Mode Partition

When forecasting **load on a notification/decision/escalation channel** that carries multiple kinds of traffic, do not aggregate-and-saturate-forecast across separable modes. If the channel's traffic decomposes into modes that travel separately (different recipients, different cadences, different decision surfaces), the modes do not compete for the same attention budget — and an aggregate-saturation forecast across them produces a phantom bottleneck that does not exist on the substrate.

The pattern names the structural test that resolves the saturation worry: **does this channel actually carry one stream or many separable streams?** If many, partition the modes; saturation forecasts apply per-mode, not in aggregate.

## The failure mode

**Aggregate-saturation-forecasting across separable modes.** A designer counts every event that flows through a "channel" (a notification queue, an audit log, a curator's inbox, a recipient's review surface) and projects saturation under load. The projection assumes one consumer, one attention budget, one cadence. When the underlying traffic actually decomposes into separable modes — for example, advisory-fatigue digests vs. breach-grade escalations — the projection imports a bottleneck failure that the substrate does not have. Two streams, two consumers (or one consumer with mode-distinct handling), two attention budgets. They do not compete.

The failure is not in the saturation math; the math is correct *for one channel*. The failure is in counting two streams as one.

## How the pattern resolves the worry

Apply a three-question decomposition test before projecting saturation:

1. **Recipient identity.** Does each mode go to the same recipient, or different recipients? If different recipients, the modes do not compete for the same attention budget.
2. **Cadence.** Does each mode arrive on the same cadence, or different cadences? If different cadences (e.g., digest = batched/periodic; breach = immediate/event-driven), the modes do not compete for the same handling slot.
3. **Decision surface.** Does each mode land at the same decision surface, or different decision surfaces? If different decision surfaces (e.g., digest = informational triage; breach = ratification or escalation), the modes do not compete for the same review work.

If any one of the three answers is "different," the modes are separable; saturation forecasts must be partitioned. If all three are "same," the modes are genuinely one channel and aggregate-saturation forecasts apply.

## What the pattern is NOT

- **Not "more streams is always better."** Partitioning modes that genuinely share recipient + cadence + decision surface produces fragmentation, not relief. The test is the discriminator; without separable modes, partition is the wrong move.
- **Not a substitute for actual capacity work.** Per-mode capacity still has to be checked. The pattern says aggregate-across-modes is the wrong unit; it does not say capacity-per-mode is unbounded.
- **Not an excuse to defer load forecasting.** The discipline is to forecast each mode's saturation separately, not to skip the forecast.

## When this is the discipline

The pattern applies whenever a "channel" is being load-forecast and the traffic includes more than one kind of event. Likely application sites:

- **Drift detection** at federation scale: digest-load (aggregated advisory signals) vs breach-load (individual high-severity events). The first instance.
- **Mesh-topology debates** (T03): peer-to-peer vs hub-and-spoke conversations conflate routing-load (where messages physically travel) with decision-load (where ratifications land). Modes separable; saturation forecasts must partition.
- **Tier-0/Tier-2 alert partition** (T07): a single "ops surface" that carries both tier-0 (informational, low-cadence) and tier-2 (paging, immediate) alerts forecasts wrong if aggregated. Partition by tier; per-tier saturation is what matters.
- Any **curator inbox** that receives both standard-cadence submissions and urgent-escalations — separable modes, separate saturation profiles.

## Converse pattern

This pattern is the **converse of `substrate-shape-vs-authority-shape-orthogonality.md`**. Where the orthogonality pattern says *separate axes that look like one* (substrate-shape and authority-shape are two axes that conflate into one if not surfaced), this pattern says *separate streams on a shared channel name that look like one* (digest-load and breach-load travel through different decision surfaces despite being called "the channel"). Both patterns are forms of the same higher-order discipline: **before applying a single-axis projection, test whether the apparent single-axis is actually multi-axis.** Orthogonality applies the test to design-time axes; mode-partition applies it to load-forecast traffic streams.

The structural connection: in both, the failure mode is collapsing two-things-into-one and importing the wrong failure profile. In orthogonality, the failure imports authority-bottleneck into substrate decisions. In mode-partition, the failure imports aggregate-saturation into per-mode decisions.

## First instance — Prism Phase B drift detection

Observed 2026-05-06 in Monte's drift-detection design v1.0 (`docs/2026-05-06-phase-b/`). Aen 11:48 framing: *"digest carries advisory-fatigue load; escalation carries breach load; they do not compete for the same channel."* The framing resolved an n=20 advisory-fatigue forecast that had projected saturation across the aggregate notification surface; once partitioned by mode (digest goes to triage cadence, breach goes to escalation cadence), the saturation worry was a phantom — the substrate had two streams, not one, and the aggregate count never landed on a single attention budget.

The pattern was the structural framing that resolved the saturation worry without requiring a redesign of either stream. The streams were already separable; what was missing was the discipline to count them separately.

## Promotion posture

**n=1 watch posture.** The pattern is filed at n=1 because the structural framing is fully exposed in the first instance — it is not the kind of pattern that strengthens with additional sightings (the test is either applied or not; n+1 sightings confirm the test works without changing what it tests). Watch candidates for n=2 confirmation: T03 mesh-topology debates if/when load-forecasting surfaces; T07 alert partition if/when tier-0/tier-2 saturation framing recurs. Either would confirm the cross-cutting reach Aen flagged at submission time.

If n=2 lands with cross-cutting reach (different domain, same structural discipline), consider Protocol C promotion to common-prompt as a load-forecasting gate scoped to "before projecting saturation on a channel, run the three-question decomposition test."

## Related

- [`substrate-shape-vs-authority-shape-orthogonality.md`](substrate-shape-vs-authority-shape-orthogonality.md) — converse pattern (same higher-order discipline at a different surface): orthogonality separates design-time axes; mode-partition separates load-forecast streams. Both resist the failure mode of collapsing-multi-into-one.
- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — adjacent at the contract layer: dispatch-granularity asks "where does the distinction live in the type?" Mode-partition asks "where does the distinction live in the load-forecast?" Both are structural-placement questions that resolve by surfacing the actual separation.
- [`no-future-proofing.md`](no-future-proofing.md) — composes: aggregate-saturation forecasts often hide as future-proofing ("we should plan for the worst case across all modes"). The discipline is to forecast each mode from observed need, not aggregate from anticipated worst-case.

(*FR:Callimachus*)
