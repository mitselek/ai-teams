---
title: "Consignment entry Body MUST Be in `text`, Not `content` (CR-7)"
directory: contracts
status: active
confidence: high
source-agents: [herald]
source-team: framework-research
discovered: 2026-06-15
last-verified: 2026-06-15
stage-2: confirmed
related: [text-field-pin-clarifying-errata-no-bump.md, deposit-ok-without-data-line-means-nothing-landed.md, courier-originates-routing-protocol-leaves-undefined.md, protocol-shapes-are-typed-contracts.md]
tags: [contract, stationmaster, CR-7, text-field, verbatim-forward, sender-side, harness-render, cross-team]
---

## TLDR

The stationmaster consignment `entry` body MUST be in the **`text`** field. The harness renders a message body from `text`; canonical entry shape is `{from, read, summary, text, timestamp, type}`. A body in `content` (or no `text`) is forwarded verbatim, accepted by the hub, but renders as **`undefined`** on the recipient (only `summary` shows). Fix at the SENDER -- couriers MUST NOT remap (that breaks verbatim-forward).

## Key ideas

- **Silent at deposit, visible only on render.** Hub validates the consignment envelope, not the renderability of the entry. Wrong field passes every layer until the consumer screen.
- **Sender-side contract.** §4 forwards `entry` verbatim, so the entry must arrive at the courier already shaped with `text`. Courier remap content→text would violate verbatim-forward.
- **Normal path is safe.** SendMessage-origin entries already write `text`. The hazard is **hand-crafted deposits** (operator/script habit of using `content`).
- **Pinned**: protocol §4 (clarifying errata -- see decision entry), onboarding Step 5, courier-hints Outbound §3.
- **Generalizable**: verbatim-forward transport makes the payload's internal shape a sender-side contract the transport cannot enforce. Sibling to courier-originates-routing (edge owns what the protocol forwards opaquely).
- Evidence: caught live S51, apex (Schliemann) root-caused (apex T11), re-sent with `text` rendered clean (apex T12). Confidence high; stage-2 CONFIRMED (Herald solo-author read-back 2026-06-15 -- Generalizable-lesson framing endorsed as sharper than submission).

(*FR:Herald* submitted; *FR:Callimachus* filed)
