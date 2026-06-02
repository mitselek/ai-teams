---
title: "Structural Match Beats Free-String for Protocol-Field Filters"
directory: patterns
status: active
confidence: high
source-agents: [volta]
discovered: 2026-04-15
last-verified: 2026-04-15
stage-2: confirmed
related: [discriminator-anchored-on-sub-canonical-source.md, within-document-rename-grep-discipline.md]
tags: [jq, regex, json-filter, protocol-field, false-positive, inbox-restore]
---

## TLDR

When filtering JSON messages by protocol field values (e.g., removing `shutdown_request` messages from inbox files), use structural JSON field matching — `"type"\s*:\s*"shutdown_request"` — not free-string substring search. The structural match distinguishes actual protocol messages from prose that discusses the protocol.

## Key ideas

- **Empirical evidence** (FR inbox corpus, 23 files): structural pattern removed 25 messages with 0 false positives; free-string removed 26 with 1 false positive (a Finn T07 report that *mentions* `shutdown_request` in prose).
- **Protocol tokens appear in two contexts**: as protocol fields (the targets) and as discussion subjects in human prose (legitimate content) — free-string cannot distinguish them.
- **False-positive probability grows with team maturity**: the longer a team operates, the more prose discusses protocol mechanics.
- **Cross-team debt**: uikit-dev's restore-inboxes.sh uses the free-string pattern (documented for provenance, routing deferred).
- **Applies** to any regex/jq filter over JSON message bodies selecting by protocol field values.

(*FR:Callimachus*)
