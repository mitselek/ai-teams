---
source-agents:
  - team-lead
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
  - teams/framework-research/poc/ghost-bridge/SPEC-v3.md
---

# Stationmaster: the post-office model for inter-team mail

**Pointer entry, not a copy.** The authoritative contract is [`poc/ghost-bridge/stationmaster-protocol.md`](../../poc/ghost-bridge/stationmaster-protocol.md) v1.0.0 (RATIFIED S49, PO read section-by-section 2026-06-12). This entry records *what was chosen and why, including the rejected alternatives* — the decision rationale that the contract states but does not argue. Read the protocol for the wire shape; read this for why it is shaped that way.

*Stage-2 confirmed 2026-06-12 (Aen read-back): five sub-decisions + six rejected alternatives verified faithful to the S49 record; one correction folded — onboarding doc status ACCEPTED not DRAFT (commit `87ef7d4`); reference courier landed S50.*

## The decision

Inter-team mail moves through a central **stationmaster hub** on a **post-office model**: customers dial **out** to the hub (only outbound ssh assumed); the hub never initiates connections and **holds no customer credentials, only registered public keys**. This is the SPEC-v4 delta over the SPEC-v3 hub-pull design.

The courier is a **customer-side pattern, not a product**: it does the local file disciplines (D1 consume-by-rename, D11 inject) on its own filesystem — atomicity is per-filesystem, so it is forced to be local — and pushes/pulls the hub over plain `ssh` exec. D1/D2/D11 transfer intact from SPEC-v3.

## Five named sub-decisions (S49)

1. **Post-office pivot.** Customers dial out; hub holds only pubkeys. Registration = pubkey + team name, landing in the hub's `authorized_keys` with a forced command (`restrict,command="sm-shell <team>"`). The two-phase hub protocol is `deposit` / `collect` + `ack` (hub deletes only after `ack` — at-least-once end-to-end).
2. **Channel-is-identity.** The team name reaches the hub only via the forced-command argument, never from client input. Channel authentication **IS** the signature: a `grant` issued on an authenticated session is the team's signed word, needing no further cryptographic signature. Closes the spoofing hole at the hub boundary — `from_team` is stamped from the channel, never trusted from message content.
3. **Consent as unilateral receive-grants.** A permit is "I agree to receive from team X," submitted over the team's own authenticated channel (channel auth is the signature, per #2). One grant = one direction live; two reciprocal grants = a full route. Revoke unilaterally. The route table is **compiled from grants**, not separately maintained.
4. **Transport-failure rule.** A received response envelope is authoritative. **No envelope = transport failure**: assume nothing happened and retry the whole conversation. Safety is bought by **per-command idempotency** — `deposit` dedups by id, `collect` is non-destructive, `ack` is idempotent — so a blind whole-conversation retry is always safe.
5. **Inject-before-ledger ordering.** The courier writes the entry into the local target inbox **first**, then appends to its delivered-ledger. This is the deliberate write order: a crash between the two re-delivers (one duplicate message, the accepted at-least-once cost per SPEC-v3 D2). Reversing the order would convert the rare duplicate into a rare **silent loss** (marked delivered, never injected) — and loss costs more than duplication everywhere in this system. (Crash-point table: courier-hints §6.)

## Rejected alternatives (why this shape, not another)

- **Hub-pull / hub-initiated delivery** — rejected: would require the hub to hold customer credentials and dial into customer networks. Reachability was empirically strictly one-way (rc→prod-llm only); the post-office model makes the asymmetry moot by assuming outbound-only.
- **True-mirror inbox replication** (SPEC-v2) — rejected at SPEC-v3 §3.2: drain-back wipe race + contested-target ambiguity. Replication unit is the **entry**, never file state — proceeds from [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md).
- **Co-sign / mutual-signature consent ceremony** — rejected (PO reframing): unilateral receive-grants over the authenticated channel kill the ceremony; channel auth already is the signature.
- **Mail over MCP** — rejected: MCP is control-plane only (grant/revoke/status/registry). Mail never flows over MCP because wake semantics (C3) and the durability chain live on the inbox path. MCP ships phase 2; the protocol is designed for it now (rides ssh stdio, same key auth, no new port).
- **Relaying / multi-hop** — left out as YAGNI.
- **Stationmaster silent grant** (hub→customer mail, `from_team: stationmaster`) — needs no grant and is not revocable; not modeled in the grant system at all, only documented (protocol §10), since the hub runs the consent checks itself and a grant gating its own mail would be unenforceable.

## Scope notes

- **Team-level grants for v1** (not `user@team`); agent identity rides in message signatures (`(*FR:Aen*)`) per SPEC-v3 D9. Agent-level grants extend without breaking (the `to` field stays a string).
- **Registration is a human step in v1** (operator edits `authorized_keys`); self-service is deferred.
- Doc set statuses at S49 close: protocol v1.0.0 RATIFIED; onboarding ACCEPTED (commit `87ef7d4`, hub address placeholder until deployment); courier-hints ACCEPTED (field usage expected to expose shortcomings). Reference courier `stationmaster-courier.py` was owed at S49 close and **landed S50** (Herald, Task #2).
- This supersedes the ghost-bridge v2 daemon (kept alive until cutover, then decommissioned).

## Related

- [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md), [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) — the substrate this design stands on.
- [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md), [`patterns/service-team-topology.md`](../patterns/service-team-topology.md) — the integration-abstraction lineage the stationmaster instantiates.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](../patterns/cross-host-atomic-inbox-write-primitive.md), [`patterns/read-flag-replication-discipline-for-external-cli.md`](../patterns/read-flag-replication-discipline-for-external-cli.md) — external-CLI courier disciplines.
- [`patterns/protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md), [`playbooks/version-typed-contract.md`](../../playbooks/version-typed-contract.md) — the typed-contract + SemVer discipline the protocol versions under.

(*FR:Callimachus*)
