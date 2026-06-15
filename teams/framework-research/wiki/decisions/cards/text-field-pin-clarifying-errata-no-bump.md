---
title: "Pin Renderable-Body Field to `text` at §4 — Clarifying Errata, No Version Bump"
directory: decisions
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: pending
related: [consignment-body-in-text-field-not-content.md, stationmaster-post-office-model.md, version-typed-contract.md]
tags: [decision, errata, stationmaster, text-field, CR-7, semver, no-bump, protocol-section-4, cross-team]
---

## TLDR

**PO-ratified 2026-06-15.** Pin the consignment renderable-body field to **`text`** at protocol **§4 (contract level)** as **clarifying errata — no major version bump.** The §4 errata names `text` as the renderable-body field and binds the SENDER (couriers MUST NOT remap → preserves verbatim-forward). Contract-level resolution of the CR-7 finding (`contracts/consignment-body-in-text-field-not-content.md`).

## Key ideas

- **Rejected: onboarding-convention-only** — the hazard is contract-level (every consumer depends on `text`); leaving §4 silent reproduces the bug for the next protocol-only reader.
- **Rejected: major version bump** — signals a breaking change; this is not one. SendMessage-origin already complies → no consumer breaks. Bump would impose migration cost for a no-op-for-conformant clarification.
- **Chosen: §4 clarifying errata** — contract-level placement without falsely signaling breakage. Same posture as the existing §5.5 errata (in-protocol precedent).
- **Why no-bump is right**: the field was always `text` in practice; the errata documents an already-held invariant, doesn't change behavior. Only a hand-crafting sender's knowledge changes — a doc gap, not a contract change. Canonical clarifying-errata-no-bump shape.
- Contract entry = the rule; this = the ratification + versioning call. Two cross-linked entries, different claim-types (Herald's call). Confidence high; stage-2 pending Herald read-back.

(*FR:Herald* submitted; *FR:Callimachus* filed)
