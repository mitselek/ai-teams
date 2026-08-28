---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - teams/framework-research/docs/evr-island-hub-formation-spec-2026-08-27.md
  - designs/deployed/stationmaster/stationmaster-protocol.md
  - designs/deployed/stationmaster/stationmaster-hub-deployment-runbook.md
source-commits:
  - f022fed
source-issues:
  - 97
related:
  - ../decisions/stationmaster-post-office-model.md
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
  - at-least-once-without-age-alarm-hides-unbounded-latency.md
  - deposit-ok-without-data-line-means-nothing-landed.md
  - v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md
  - ../process/smoke-test-a-live-hub-with-throwaway-identities.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
---

# A Hub Without Fail-Loud fsync Can Return `accepted` for Mail It Never Durably Wrote

**Gotcha (cross-team, high confidence on the code fact, urgency elevated -- it is a durability-guarantee defect).**

The stationmaster contract defines `deposit` -> `accepted` as **fsync-durable**. That is the guarantee **the entire courier retry model rests on**: a courier that receives `accepted` **stops retrying.**

**The image running on the prod-llm hub is `f022fed`** (uptime-dated 2026-06-12) and **predates the #97 sm-shell fail-loud fsync change.** On that build, **a write whose fsync fails can still return `accepted`** -- the hub reports success for mail that was never durably written.

## Why this is worse than an ordinary durability bug

**It is silent and non-recoverable by the protocol.** The sender has been told it may stop retrying, so **nothing anywhere retries.** There is no queue holding a copy, no alarm, and no party who believes anything is outstanding. The loss is invisible from every vantage the protocol defines.

Contrast the two neighbouring failure modes, which are both *loud*:

- [`v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md) -- arrives N times. Noisy, obvious, harmless.
- [`at-least-once-without-age-alarm-hides-unbounded-latency.md`](at-least-once-without-age-alarm-hides-unbounded-latency.md) -- arrives once, months late. Silent, but **arrives**; retry is still working.

**This one does not arrive at all, and the retry arm has been switched off by the false `accepted`.** The post-office design's own sub-decision 5 priced loss above duplication; this defect spends exactly the currency that decision refused to spend.

## Consequence

> **Upgrading the running hub image is REQUIRED, not advisable, before any deployment treats `accepted` as a durability guarantee.**

Anything already relying on `accepted` on that hub has been relying on a guarantee the build does not implement -- see [`../patterns/artifact-claims-more-than-it-implements.md`](../patterns/artifact-claims-more-than-it-implements.md) for the genus.

## Evidence

- Image identity and date read from the **running prod-llm container** (Brunel, 2026-08-27).
- The **#97 diff** establishes what `f022fed` lacks.
- Contract **§5.0** verb table for the `accepted` semantics.

## Revision trigger

**Substrate change, not a sighting:** the running hub image being upgraded past #97. **Verify by reading the deployed image's identity, not the contract** -- the contract has been correct all along; it is the deployed build that diverges. This is [`../patterns/documentation-vs-substrate-truth-divergence.md`](../patterns/documentation-vs-substrate-truth-divergence.md) at the durability layer, and it is why the check is *which image is running*, not *what does the spec say*.

**Note the island scope:** this is the **EVR island's** hub (prod-llm). The sagres hub is a separate instance with its own build -- say which hub you mean, per [`singular-convention-plural-instances-enumerate-from-the-registry.md`](singular-convention-plural-instances-enumerate-from-the-registry.md).

## Filing note

Submitted as the a1.2 EVR-island formation work owed from 2026-08-27. Brunel offered the split himself and it was taken: this entry is the **substrate defect** and is urgent; the operational half -- how to smoke-test a hub that already carries live registrations -- is a process pattern with a different revision trigger and is filed at [`../process/smoke-test-a-live-hub-with-throwaway-identities.md`](../process/smoke-test-a-live-hub-with-throwaway-identities.md).

(*FR:Brunel* submitted; *FR:Callimachus* filed)
