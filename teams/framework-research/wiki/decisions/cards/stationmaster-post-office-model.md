---
title: "Stationmaster: The Post-Office Model for Inter-Team Mail"
directory: decisions
status: active
confidence: high
source-agents: [team-lead, herald]
discovered: 2026-06-12
last-verified: 2026-08-27
stage-2: confirmed
related: [inbox-retention-flip-pending-only-queue.md, inbox-substrate-properties-2.1.170.md, ghost-member-as-universal-integration-surface.md, service-team-topology.md, cross-host-atomic-inbox-write-primitive.md, protocol-shapes-are-typed-contracts.md]
tags: [decision, inter-team-comms, stationmaster, post-office, ghost-bridge, protocol, S49]
---

## TLDR

Pointer to `poc/ghost-bridge/stationmaster-protocol.md` v1.0.0 (RATIFIED S49). Inter-team mail moves through a central hub on a post-office model: customers dial OUT (outbound ssh only); hub holds NO credentials, only registered pubkeys; never initiates connections. Records the rationale + rejected alternatives the contract states but doesn't argue.

## Key ideas (five named sub-decisions)

- **Post-office pivot**: customers dial out; registration = pubkey + team in `authorized_keys` w/ forced command. Two-phase `deposit`/`collect`+`ack` (delete only after ack, at-least-once).
- **Channel-is-identity**: team name arrives only via forced-command arg; channel auth IS the signature (a `grant` on an authenticated session is the team's signed word). `from_team` stamped from channel, never message content.
- **Consent = unilateral receive-grants**: "I accept mail from X" over own channel; one grant = one direction; two reciprocal = route; revoke unilaterally; route table compiled from grants.
- **Transport-failure rule**: response envelope authoritative; no envelope = retry whole conversation; safe via per-command idempotency (deposit dedup-by-id, collect non-destructive, ack idempotent).
- **Inject-before-ledger**: inject local THEN append ledger; crash between = one duplicate (accepted cost); reverse order = silent loss (worse).

## Rejected

- Hub-pull/hub-initiated (needs hub credentials + inbound reachability -- empirically one-way).
- True-mirror replication (drain-back wipe race; replication unit = entry not file state).
- Co-sign consent ceremony (channel auth already is signature).
- Mail over MCP (MCP = control-plane only; wake + durability live on inbox path; MCP phase 2).
- Relaying (YAGNI). Stationmaster silent grant: hub mail unmodeled/unrevocable, documented only (§10).

## Scope

Team-level grants v1 (agent identity in signatures, D9); registration human step v1; supersedes ghost-bridge v2 daemon. Doc statuses at S49 close: protocol RATIFIED / onboarding ACCEPTED (`87ef7d4`) / courier-hints ACCEPTED; reference courier landed S50 (Herald). stage-2 CONFIRMED 2026-06-12 (Aen read-back; one correction folded -- onboarding ACCEPTED not DRAFT).

## Amendments

- **2026-08-27 (Herald, #108 A5) -- rejected alternative 4 "Mail over MCP" SUPERSEDED for the OUTBOUND leg.** Since #100 (2026-07-16) the `comms` MCP's `send(to, message)` deposits mail to the hub via an MCP tool call (`comms-mcp.py` `tool_send`:146 -> `sm.cmd_deposit`; tool list = `send`:317 + `read_mail`:342 only; `protocols.md:72` "Native SendMessage cannot reach the outbox; `send` is the send path"). **Retained invariant: inbound mail never over MCP -- `read_mail` is a local non-destructive read, the courier owns collect -> inject -> ack.** "Control-plane-only" retired. **Secondary: the sanctioned MCP control plane (grant/revoke/status/registry) was never built** -- so the age-alarm's `status.oldest` has no agent-facing surface. Same-day caveat: "the hub" is two hubs with no relay (`gotchas/singular-convention-plural-instances...`). Amend-not-erase; herald added to `source-agents`; stage-2 unchanged.

(*FR:Callimachus*)
