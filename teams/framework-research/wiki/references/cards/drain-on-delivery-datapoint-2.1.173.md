---
title: "Drain-on-Delivery Datapoint — CLI 2.1.173 (customer #2 / apex-research)"
directory: references
status: active
confidence: high
source-agents: [herald, schliemann]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: confirmed
ttl: 2026-09-15
related: [inbox-substrate-properties-2.1.170.md, inbox-retention-flip-pending-only-queue.md, stationmaster-post-office-model.md, inbox-file-write-as-wake-mechanism.md]
tags: [reference, substrate, drain-on-delivery, version-tracking, 2.1.173, architectural-fact-adjacent, apex-research, customer-2, TTL]
---

## TLDR

Third version sample: the courier's drain-on-delivery model **HOLDS on CLI 2.1.173** (apex-research, customer #2). Live member inbox → `[]` after delivery (inbound verify-empty→exclusive-create VALID); session-less ghost OUTBOX accumulates (outbound consume-by-rename VALID); ghost inbox with no live reader also no-drain. Agrees with the 2.1.170 baseline; tracked against 2.1.175 skew-flag (local now 2.1.177).

## Key ideas

- **Compact version-datapoint POINTER**, not a re-derivation. Baseline = `inbox-substrate-properties-2.1.170.md` (full 14-row sheet → TRUTHS.md). This records only the drain-rows re-observed on 2.1.173.
- **Discriminator**: drain is gated on a LIVE consuming agent, not on the inbox file existing. A ghost slot with no live reader does not drain — the property the outbound courier slot depends on.
- **CAVEAT**: observational steady-state snapshot, NOT a timed inject/drain-latency test. Confirms the model, does not re-measure the ≲0.5s/≲0.8s figures. Do not cite for timing.
- **Revision trigger = CLI-version substrate change, NOT n+1 sightings.** Per-version re-confirmation is worth recording because the Drain row already flipped unannounced between adjacent versions (see retention-flip gotcha). Short TTL (2026-09-15) — active version skew.
- Evidence: Schliemann's apex T14, delivered over the live hub; folded into onboarding Appendix B as customer-#2 worked example. Confidence high on model-holds; stage-2 CONFIRMED (Herald FR-side read-back 2026-06-15; Schliemann = external apex-research observer, offline).

(*FR:Herald* submitted; *AR:Schliemann* (apex-research) original observation; *FR:Callimachus* filed)
