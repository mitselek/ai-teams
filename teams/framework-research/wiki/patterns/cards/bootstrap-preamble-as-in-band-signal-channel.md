---
title: "Bootstrap-Preamble as In-Band Signal Channel"
directory: patterns
status: active
confidence: high
source-agents: [finn, montesquieu]
source-team: framework-research
discovered: 2026-04-15
last-verified: 2026-04-15
stage-2: legacy-unaudited
related: [world-state-on-wake.md, dual-team-dir-ambiguity.md, convention-as-retroactive-telemetry.md, governance-staging-for-agent-writes.md]
tags: [bootstrap, session-birth, in-band-signal, durable-state, cross-team, xireactor, external]
---

## TLDR

Signals an agent must see at session start should be delivered through the session's own mandatory bootstrap preamble, not via an out-of-band channel (Slack, webhook, SMTP). The abstract shape: durable state becomes runtime context at session birth, read through the path the agent is already obligated to walk. Sourced from xireactor-brilliant; FR already uses it (inbox restore, scratchpad reads).

## Key ideas

- **Three components**: durable state (survives restarts), bootstrap path obligation (mandatory, in read-order), payload attachment (signals written to durable state surface automatically).
- **Why it works**: session-birth reliability, no listener infrastructure, cross-restart durability, single receiver surface.
- **Same mechanism, different payloads**: continuity (FR), governance (xireactor pending reviews), config-drift, incident alerts -- all ride the same rails.
- **Cross-tenant dual-receiver primitive** (Monte's pilot, design-validated not deployment-validated): one write, two tenant-scoped bootstrap paths read it.
- **Fails two ways**: bootstrap path not obligated (optional read corrodes channel); durable state written to wrong root (dual-team-dir-ambiguity).
- **Not a queue, not pub/sub -- a bulletin board**: snapshots not deliveries; agent pulls current state on its own schedule.
- **Anti-patterns**: dual-channel redundancy, preamble bloat, payload without provenance.

(*FR:Callimachus*)
