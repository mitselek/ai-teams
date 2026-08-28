---
title: "A Hub Without Fail-Loud fsync Can Return `accepted` for Mail It Never Durably Wrote"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-28
stage-2: confirmed
related: [../decisions/stationmaster-post-office-model.md, at-least-once-without-age-alarm-hides-unbounded-latency.md, v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md, deposit-ok-without-data-line-means-nothing-landed.md, ../process/smoke-test-a-live-hub-with-throwaway-identities.md]
tags: [gotcha, stationmaster, hub, fsync, durability, deposit, accepted, prod-llm, evr-island, gh-97, a1.2, elevated]
---

## TLDR

The contract defines `deposit` -> `accepted` as **fsync-durable** -- the guarantee the whole courier retry model rests on, since a courier that receives `accepted` **stops retrying**. The **prod-llm hub runs image `f022fed`** (uptime-dated 2026-06-12), which **predates the #97 fail-loud fsync change**: a write whose fsync fails **can still return `accepted`.**

## Key ideas

- **Silent and non-recoverable BY THE PROTOCOL.** The sender has been told it may stop retrying, so **nothing anywhere retries** -- no queue holds a copy, no alarm fires, no party believes anything is outstanding. **The loss is invisible from every vantage the protocol defines.**
- **Both neighbouring failure modes are loud by comparison:** `v2-ghost-bridge-restart-redelivery-dupe` = arrives N times (noisy, harmless); `at-least-once-without-age-alarm` = arrives once months late (silent, but **arrives** -- retry still works). **This one does not arrive, and the retry arm has been switched off by the false `accepted`.** The post-office design's sub-decision 5 priced loss above duplication; this spends exactly that currency.
- **Consequence: upgrading the running hub image is REQUIRED, not advisable**, before any deployment treats `accepted` as a durability guarantee. Anything already relying on it has relied on a guarantee the build does not implement (`artifact-claims-more-than-it-implements` genus).
- **Evidence:** image identity + date read from the **running** prod-llm container (2026-08-27); the #97 diff establishes what `f022fed` lacks; contract §5.0 verb table for `accepted` semantics.
- **Revision trigger: substrate change, not a sighting** -- the hub image being upgraded past #97. **Verify by reading the deployed image's identity, not the contract**: the contract has been right all along, the deployed build diverges. `documentation-vs-substrate-truth-divergence` at the durability layer.
- **Island scope:** this is the **EVR island's** hub (prod-llm); sagres is a separate instance with its own build. Say which hub you mean.
- **Split from its process half** at the submitter's offer: smoke-test ordering is `process/smoke-test-a-live-hub-with-throwaway-identities` -- different revision trigger, and only this half is urgent.

(*FR:Callimachus*)
