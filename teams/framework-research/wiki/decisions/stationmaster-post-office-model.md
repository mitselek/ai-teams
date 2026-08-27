---
source-agents:
  - team-lead
  - herald
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-08-27
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
  - teams/framework-research/poc/ghost-bridge/SPEC-v3.md
---

# Stationmaster: the post-office model for inter-team mail

**Pointer entry, not a copy.** The authoritative contract is [`poc/ghost-bridge/stationmaster-protocol.md`](../../poc/ghost-bridge/stationmaster-protocol.md) v1.0.0 (RATIFIED S49, PO read section-by-section 2026-06-12). This entry records *what was chosen and why, including the rejected alternatives* -- the decision rationale that the contract states but does not argue. Read the protocol for the wire shape; read this for why it is shaped that way.

*Stage-2 confirmed 2026-06-12 (Aen read-back): five sub-decisions + six rejected alternatives verified faithful to the S49 record; one correction folded -- onboarding doc status ACCEPTED not DRAFT (commit `87ef7d4`); reference courier landed S50.*

## The decision

Inter-team mail moves through a central **stationmaster hub** on a **post-office model**: customers dial **out** to the hub (only outbound ssh assumed); the hub never initiates connections and **holds no customer credentials, only registered public keys**. This is the SPEC-v4 delta over the SPEC-v3 hub-pull design.

The courier is a **customer-side pattern, not a product**: it does the local file disciplines (D1 consume-by-rename, D11 inject) on its own filesystem -- atomicity is per-filesystem, so it is forced to be local -- and pushes/pulls the hub over plain `ssh` exec. D1/D2/D11 transfer intact from SPEC-v3.

## Five named sub-decisions (S49)

1. **Post-office pivot.** Customers dial out; hub holds only pubkeys. Registration = pubkey + team name, landing in the hub's `authorized_keys` with a forced command (`restrict,command="sm-shell <team>"`). The two-phase hub protocol is `deposit` / `collect` + `ack` (hub deletes only after `ack` -- at-least-once end-to-end).
2. **Channel-is-identity.** The team name reaches the hub only via the forced-command argument, never from client input. Channel authentication **IS** the signature: a `grant` issued on an authenticated session is the team's signed word, needing no further cryptographic signature. Closes the spoofing hole at the hub boundary -- `from_team` is stamped from the channel, never trusted from message content.
3. **Consent as unilateral receive-grants.** A permit is "I agree to receive from team X," submitted over the team's own authenticated channel (channel auth is the signature, per #2). One grant = one direction live; two reciprocal grants = a full route. Revoke unilaterally. The route table is **compiled from grants**, not separately maintained.
4. **Transport-failure rule.** A received response envelope is authoritative. **No envelope = transport failure**: assume nothing happened and retry the whole conversation. Safety is bought by **per-command idempotency** -- `deposit` dedups by id, `collect` is non-destructive, `ack` is idempotent -- so a blind whole-conversation retry is always safe.
5. **Inject-before-ledger ordering.** The courier writes the entry into the local target inbox **first**, then appends to its delivered-ledger. This is the deliberate write order: a crash between the two re-delivers (one duplicate message, the accepted at-least-once cost per SPEC-v3 D2). Reversing the order would convert the rare duplicate into a rare **silent loss** (marked delivered, never injected) -- and loss costs more than duplication everywhere in this system. (Crash-point table: courier-hints §6.)

## Rejected alternatives (why this shape, not another)

- **Hub-pull / hub-initiated delivery** -- rejected: would require the hub to hold customer credentials and dial into customer networks. Reachability was empirically strictly one-way (rc→prod-llm only); the post-office model makes the asymmetry moot by assuming outbound-only.
- **True-mirror inbox replication** (SPEC-v2) -- rejected at SPEC-v3 §3.2: drain-back wipe race + contested-target ambiguity. Replication unit is the **entry**, never file state -- proceeds from [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md).
- **Co-sign / mutual-signature consent ceremony** -- rejected (PO reframing): unilateral receive-grants over the authenticated channel kill the ceremony; channel auth already is the signature.
- **Mail over MCP** -- rejected: MCP is control-plane only (grant/revoke/status/registry). **[AMENDED 2026-08-27 -- superseded for the OUTBOUND leg since #100; see "Amendments" below. The rest of this bullet is the S49 record as written.]** Mail never flows over MCP because wake semantics (C3) and the durability chain live on the inbox path. MCP ships phase 2; the protocol is designed for it now (rides ssh stdio, same key auth, no new port).
- **Relaying / multi-hop** -- left out as YAGNI.
- **Stationmaster silent grant** (hub→customer mail, `from_team: stationmaster`) -- needs no grant and is not revocable; not modeled in the grant system at all, only documented (protocol §10), since the hub runs the consent checks itself and a grant gating its own mail would be unenforceable.

## Scope notes

- **Team-level grants for v1** (not `user@team`); agent identity rides in message signatures (`(*FR:Aen*)`) per SPEC-v3 D9. Agent-level grants extend without breaking (the `to` field stays a string).
- **Registration is a human step in v1** (operator edits `authorized_keys`); self-service is deferred.
- Doc set statuses at S49 close: protocol v1.0.0 RATIFIED; onboarding ACCEPTED (commit `87ef7d4`, hub address placeholder until deployment); courier-hints ACCEPTED (field usage expected to expose shortcomings). Reference courier `stationmaster-courier.py` was owed at S49 close and **landed S50** (Herald, Task #2).
- This supersedes the ghost-bridge v2 daemon (kept alive until cutover, then decommissioned). **Why v2 was failing** (the motivating defect): v2 forwarded by flipping the `read` flag without deleting, so each daemon restart (it crashed/restarted repeatedly -- no supervisor) re-scanned and re-forwarded the outbox, multiply-delivering. This design's **delete-on-ack** (sub-decision 1) + the **courier delivered-ledger** (id-keyed dedup) are the direct antidote. Full incident + provenance: [`gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md).

## Amendments

### 2026-08-27 -- rejected alternative 4 ("Mail over MCP") superseded for the outbound leg (Herald, Protocol A; #108 amendment A5)

**What changed in the world.** Since #100 (2026-07-16) every team session runs the `comms` MCP, whose primary send path `send(to, message)` **deposits mail to the hub via an MCP tool call** (transport still ssh; hub verdict returned synchronously). Verified 2026-08-27: `poc/ghost-bridge/comms-mcp.py` `tool_send` (line 146) deposits via `sm.cmd_deposit`; the tool list is `send` (line 317) and `read_mail` (line 342) -- nothing else. `designs/deployed/po-team/protocols.md:72`: *"Native `SendMessage` cannot reach the outbox; `send` is the send path."* **Outbound mail therefore DOES flow through MCP.**

**What survives.** The S49 rationale -- *wake semantics (C3) and the durability chain live on the inbox path* -- holds for the **INBOUND** leg only: `read_mail` is a non-destructive local read, never a hub `collect`; the courier still owns collect -> inject -> ack. **The retained invariant is: inbound mail never over MCP; the courier owns the durability chain.** "Control-plane-only" is retired as a description of MCP's role.

**Secondary finding.** The same bullet sanctions MCP for `grant/revoke/status/registry`. **None of that has been built** -- the comms MCP exposes `send` + `read_mail` only. So the card described a control plane that exists in decision and not in code. This matters now because the age-alarm remedy discussed in [`../gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md`](../gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md) (`status`-side `oldest`) has **no agent-facing surface today**.

**Multi-instance caveat (same day).** The decision speaks of "the hub"; see [`../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md) -- two hubs are deployed with no relay between them, which this card's YAGNI exclusion of relaying makes a partition.

*Amend-not-erase: the original bullet stands as the S49 record; the amendment records what the deployed system does now and which half of the rationale it preserves. Pointer discipline unchanged -- the protocol remains authoritative for the wire; `protocols.md` rev 5 §1.1 for the deployed send path.*

## Related

- [`gotchas/inbox-retention-flip-pending-only-queue.md`](../gotchas/inbox-retention-flip-pending-only-queue.md), [`references/inbox-substrate-properties-2.1.170.md`](../references/inbox-substrate-properties-2.1.170.md) -- the substrate this design stands on.
- [`patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md), [`patterns/service-team-topology.md`](../patterns/service-team-topology.md) -- the integration-abstraction lineage the stationmaster instantiates.
- [`patterns/cross-host-atomic-inbox-write-primitive.md`](../patterns/cross-host-atomic-inbox-write-primitive.md), [`patterns/read-flag-replication-discipline-for-external-cli.md`](../patterns/read-flag-replication-discipline-for-external-cli.md) -- external-CLI courier disciplines.
- [`gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md`](../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md) -- the v2 failure-mode (flag-flip-without-delete + restart re-scan) this design's delete-on-ack + ledger-dedup were built against; the "why v2 was superseded" record.
- [`patterns/protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md), [`playbooks/version-typed-contract.md`](../../playbooks/version-typed-contract.md) -- the typed-contract + SemVer discipline the protocol versions under.

(*FR:Callimachus*)
