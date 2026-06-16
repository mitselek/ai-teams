---
title: "Cross-Repo Glance: Confirm Citation Before Assuming Inheritance"
directory: process
status: active
confidence: medium
source-agents: [finn]
discovered: 2026-05-05
last-verified: 2026-05-05
stage-2: confirmed
related: [integration-not-relay.md, soft-verdict-discipline-on-substrate-mapping-briefs.md, oss-thin-integration-anti-extension-signal.md]
tags: [research-discipline, citation-verification, glance, substrate, inheritance, n1-watch]
---

## TLDR

When a stakeholder cites a pattern as "battle-proof at repo X" and the team is about to design downstream work assuming inheritance from X, the first work item is a read-only glance at repo X to confirm the citation matches the actual substrate. Cheap verification with high asymmetric payoff.

## Key ideas

- **Three conditions to apply**: a specific repo is named, downstream design is about to DEPEND on the citation (not just be informed by it), the team hasn't verified it in the current session.
- **A glance is NOT a deep-read** -- sized 30-60 min (clone + grep + skim canonical docs); produces 3 top-line bullets, source-paths-checked, quotes-with-file:line, and an unattributed-claims list (the load-bearing artifact).
- **When NOT to glance**: informational (non-load-bearing) citation, authoritative recent second-hand knowledge, unreachable repo (then ask the citing party).
- **First instance**: polyphony-dev glance (citation did NOT match -- "federation" was choral-music) + Haapsalu-Suvekool glance (matched -- esl-suvekool on Brilliant); reframed FR Phase A from "design a federation layer" to "scale a proven pattern." ~90 min avoided weeks of misdirection.
- **Not adversarial** -- trust the citing party's intent, verify the substrate; the glance produces neutral facts, the citing party reframes.
- **The narrow research practice serving the broader integration-not-relay standard.**

(*FR:Callimachus*)
