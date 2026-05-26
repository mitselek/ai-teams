---
name: cloudflare-pilot-comms
description: Herald's comms-protocol design brief for the Cloudflare Claude Managed Agents pilot. Recommends Durable Object as per-recipient mailbox (single-instance addressable identity + strong consistency + persistent storage) + KV roster + Queues for broadcast. Identity is name-based via idFromName; envelope is FR's existing SendMessage shape.
type: design-brief
author: herald
discovered: 2026-05-26
status: draft
companion-briefs:
  - designs/new/cloudflare-pilot/substrate.md (Brunel)
  - designs/new/cloudflare-pilot/lifecycle.md (Volta)
synthesis: designs/new/cloudflare-pilot/README.md (Aen)
source-finding: docs/findings.md
---

# Cloudflare Pilot — Comms Protocol (Rough Design, Herald)

## Decision up-front

**For the minimal 2-agent A↔B experiment: Durable Object as shared mailbox.** One DO per agent, addressed by DO ID; each DO's storage holds an ordered append-only message log. Senders POST to recipient's DO via Worker route; recipient's agent process polls its own DO storage on wake. **For M2/M3 scale-out (broadcast / discovery): Workers KV as roster registry + Queues for fan-out.** DO remains the per-recipient mailbox; KV holds the rename-stable agent→DO-ID mapping (FR's `members[]` analog); Queues carry broadcast events so DOs don't have to maintain peer lists.

**One-sentence rationale:** DOs are the only CF primitive with strong-consistency + per-instance addressable identity + persistent storage in a single object — the smallest substrate shape that maps cleanly onto FR's "inbox file as wake mechanism + members[] as ACL" composition without splitting wake-and-ACL across two primitives.

## Per-question analysis

### 1. Transport primitive

| Primitive | Latency | Consistency | Durability | Cost shape | Fit for A↔B mailbox |
|---|---|---|---|---|---|
| Workers KV | ~10-60ms read (edge), eventual writes (<60s global) | Eventual | Disk-backed, multi-region | Per-op, cheap reads | **No.** Eventual consistency breaks read-after-write on the receiver's poll cycle; not a mailbox. |
| Durable Object | Single-digit ms in-region; routes to instance's home colo | Strong (single-instance serialization) | Per-object storage, replicated | Per-request + per-storage-op; sleep-when-idle | **Yes — primary.** Single-instance addressable identity == per-agent mailbox. Strong consistency means a write-then-read is observable in order. |
| R2 (object-as-mailbox) | ~20-100ms; HTTP-style | Strong for individual PUTs; no atomic append | Disk-backed, durable | Per-op, cheap storage | **No.** No atomic-append primitive — would require ETag-based optimistic concurrency or a DO-coordinated lock, which collapses to DO anyway. The fcntl-flock substrate property FR's `cross-host-atomic-inbox-write-primitive.md` relies on has no R2 analog. |
| Queues | ~100ms-seconds; pull-based | At-least-once delivery | Durable until consumed | Per-message | **Yes for broadcast (M2/M3); No for A↔B mailbox.** Queues are great fan-out, but no per-instance addressing — every consumer reads from the same queue. For a 1:1 mailbox, a queue is over-engineered; for 1:N broadcast (e.g., "new agent C joined"), it's the right shape. |
| Custom HTTP via Worker | Whatever the backing store is | Inherits backing store | Inherits | Per-request | **No — degenerate.** A Worker is a router, not a store. Needs to land somewhere. Punts the question. |

**Recommendation:**
- **Minimal experiment (2-agent):** DO-per-agent. Sender POSTs to `https://<worker>/inbox/<recipient-DO-id>` with envelope payload; recipient's DO appends to storage; recipient's agent reads storage on poll. **This is the structural analog of FR's inbox-file-write-as-wake-mechanism** — same shape, different substrate primitive.
- **Scale-out (M2/M3):** add KV-backed roster + Queues for broadcast events. Per-recipient DO mailbox unchanged; discovery and fan-out layer on top.

### 2. Identity addressing

FR-current: `members[]` array in `config.json` is the authoritative agent roster; SendMessage takes a name string, harness resolves name→inbox-file via the array. The `members[]` is **manually maintained**, validated at SendMessage time, mid-session edits honored (per `members-array-edit-honored-mid-session.md`).

CF-native options:
- **DO ID as primary key:** stable, opaque, globally unique. Bad UX for humans/agents.
- **DO name (idFromName):** human-readable string → deterministic DO ID. **This is the structural match to FR's name-based addressing.** `idFromName("brunel")` always resolves to the same DO; semantically equivalent to `members[]` lookup.
- **Worker route as URL:** `/agent/<name>/inbox` style. Forwards to the DO. Layers on top of idFromName, not orthogonal.

**Recommendation:** **DO `idFromName(<agent-name>)` keyed off a name; KV-backed roster as the authoritative `members[]` analog (canonical list of who-is-on-team, with metadata).** Pilot agents address each other by name; the runtime resolves name→DO via idFromName; KV roster is the source of truth for "is this name a valid teammate" (the ACL gate, FR's `inbox-slot-vs-members-validation-asymmetry.md` analog).

**Crucial framework-research observation:** identity model on CF substrate vs FR's framework is **same shape, different substrate primitive.** Both compose: (i) a name-based addressing layer, (ii) a roster validation layer, (iii) a per-recipient durable mailbox. FR uses `members[]` + JSON file inbox + filesystem. CF uses KV roster + DO storage + DO routing. **The substrate-vs-framework boundary from §S2 of findings.md materializes here: identity-as-name is framework-state (FR-owned); name-resolution-and-mailbox-storage is substrate-state (CF-owned under pilot).** This is the §S2 boundary mechanically visible at the comms layer.

### 3. Message envelope

FR-current (`types/t09-protocols.ts` + SendMessage tool): structured envelope with `to`, `from` (implicit, harness-injected), `summary`, `message` (string or typed protocol-response object), timestamp (implicit). Protocol-response variants (`shutdown_response`, `plan_approval_response`) are typed objects with `type` discriminator + `request_id`.

CF-native convention: zod-typed tool-call schemas per Cloudflare's announcement. JSON envelopes, schema-validated at the substrate edge.

**Recommendation:** **Use FR's existing SendMessage envelope shape as the pilot's canonical message contract.** Reasons:
1. **Transferability beats CF-native fit at the pilot stage.** The pilot's purpose is to test whether CF substrate can host FR's framework, not to invent a new framework. If the envelope diverges, we're measuring two things at once (substrate + envelope), and the experiment loses signal.
2. **The envelope IS framework-state, not substrate-state.** Per §S2 of findings.md: inter-agent coordination protocols stay framework-layer regardless of substrate. Re-shaping the envelope to fit CF-native conventions would be ceding framework-layer ground that the §S2 analysis explicitly reserves to FR.
3. **Typed-contract discipline (`protocol-shapes-are-typed-contracts.md`)** applies: the envelope is a binary interface between sender and receiver. Inventing a new shape for the pilot creates a cross-substrate-translation-layer problem we don't need.
4. **Zod-validation at substrate edge is additive, not substitutive.** We can validate the existing envelope with zod schemas at the DO entry point; the schema is just a wire-format enforcer, not a replacement envelope.

**Caveat (we-as-researchers):** the experiment SHOULD include a probe of CF-native envelope conventions as a sub-question — "does the FR envelope round-trip cleanly through DO storage + JSON serialization, or do we discover impedance?" If impedance, that's a framework-grade finding about envelope-substrate fit.

### 4. Discovery mechanism

FR-current: `roster.json` (FR-side) + `config.json` `members[]` (per-team). Manually maintained. Ghost-bridge daemon auto-detects via SSH-layer probes (`ghost-member-as-universal-integration-surface.md`). New member added = file edit + harness picks up next SendMessage.

CF-native options for "Agent C joins; A and B learn about C without prior registration":
- **KV roster as authoritative directory.** New agent writes its name + DO ID to KV; existing agents poll KV (or subscribe via DO alarms on change). Simple, but eventual-consistency on writes (<60s global) means a brief window where C exists but A/B don't see them.
- **DO-coordinated registry.** A `roster-DO` (single instance) holds the canonical agent list; agents query it on demand. Strong consistency. Bottleneck-shaped if roster query is frequent.
- **Queues broadcast on join.** Agent C publishes "joined" event to a `roster-events` Queue; A and B (and any future agent) consume the queue and update local cache. Push-based discovery; no polling.
- **Service Bindings.** Hard-wired at deploy time, doesn't help with runtime discovery.

**Recommendation for pilot (M2/M3 scope):** **`roster-DO` (single canonical registry) + Queue broadcast on join/leave.** Roster-DO is the source-of-truth (strong consistency, FR's `members[]` analog elevated to a substrate primitive); Queue is the change-notification channel (so agents don't poll on every send). Compared to FR's manual `members[]` editing, this is automation-via-substrate of what FR currently handles via team-lead's config.json edits + harness reload.

**Framework-research observation:** discovery is the surface where FR-current is most procedural (team-lead manually edits config.json) and where CF-native is most automated (substrate primitive handles it). **This is the bottleneck-alignment principle (§S3) at the comms layer: if a future FR team's bottleneck is "discovery/registration churn," CF substrate is the right adoption target; if not, FR's manual model is fine.** The pilot tests whether substrate-automated discovery actually moves needle for a 3-agent team (likely insufficient n; the bottleneck doesn't materialize until ~10+ agents with churn).

### 5. Persistence semantics

This is the §S6 Q1 + Q2 credibility-floor question, restated for comms specifically.

**What survives sandbox sleep (Q1 — explicit per CF announcement):**
- DO storage: **yes, explicitly.** This is the substrate guarantee.
- KV: **yes, by design.**
- Queues: **yes, durable until consumed.**
- R2: **yes, by design.**
- In-DO-memory state (non-storage-backed): **no — DO sleeps, RAM gone.** Important: mailbox-as-storage is durable; mailbox-as-in-memory-buffer is not.

**What survives distinct-session-termination (Q2 — load-bearing-implicit per Preamble of findings.md):**
- DO storage: **expected yes, but credibility-floor open** — announcement does not explicitly state DO storage survives session-termination separate from sleep. **This is the pilot's primary survivability probe.**
- KV: yes (independent of sessions).
- Queues: yes (independent of sessions).
- Roster (KV-backed): yes — so the `members[]` analog survives even if all agent DOs are torn down.

**Pilot probe design (we-as-researchers):**
1. Agent A sends message to Agent B's DO mailbox; observe write.
2. Terminate Agent B's session entirely (TeamDelete-equivalent on CF).
3. Spawn Agent B-prime with the same `idFromName("agent-b")`.
4. Does B-prime see the message in storage? **If yes, Q2 resolved positive for DO storage; the comms primitive choice is validated.** **If no, the pilot has falsified a load-bearing assumption and the comms primitive must be re-evaluated** (likely toward R2/KV-backed mailbox-as-object pattern instead).

**Comms-layer survivability claim — testable in execution:** A DO-mailbox + KV-roster composition makes survivability claims falsifiable in 2-3 probe-passes. The choice of DO-as-mailbox over R2-as-mailbox is **conditional on Q2 resolving positive**; if Q2 resolves negative, R2-with-ETag-versioning becomes the primary candidate (R2's storage durability is more conservatively documented than DO storage).

## Comparison to FR-existing (load-bearing table)

| Dimension | FR-current | CF-native (pilot proposal) | Boundary classification (per §S2) |
|---|---|---|---|
| **Identity** | `members[]` in config.json (name-string keys, manually maintained, mid-session edits honored) | `idFromName(<name>)` → deterministic DO ID; KV roster as authoritative list | Identity-as-name = framework-state; name-resolution-and-storage = substrate-state |
| **Transport** | JSON file append + fcntl.flock (atomic primitive per `cross-host-atomic-inbox-write-primitive.md`) | DO storage `put`/`list` (single-instance serialization gives atomic equivalent) | Transport mechanism = substrate-state; envelope shape on top = framework-state |
| **Envelope** | SendMessage tool shape (to/summary/message, typed protocol-responses) | Same envelope, zod-validated at DO entry | Envelope = framework-state (FR-owned per §S2) |
| **Discovery** | Manual config.json edit + ghost-bridge daemon for cross-team | KV roster + Queue broadcast on join/leave | Roster-as-data = framework-state; roster-storage-and-event-propagation = substrate-state |
| **Persistence** | inbox.json file on disk (survives container restart; lost on TeamDelete unless committed to repo) | DO storage (survives sleep — explicit; survives session-termination — credibility-floor open) | Persistence semantics = substrate-state (CF-owned under pilot) |

**Headline observation:** the **shape** (identity, transport, envelope, discovery, persistence) is invariant across FR-current and CF-native. The **substrate primitives** differ. This is §S5's Sub-shape E cross-substrate-class confirmation at the comms-protocol level: same boundary structure (5 dimensions, same coupling), different substrate ownership for the dimensions that fall on the substrate side of §S2's boundary.

## Open questions

**Blocking on CF account specifics (Brunel's parallel brief):**
- BO1: Are DOs available on the pilot CF account tier? (Some tiers exclude DOs.)
- BO2: Are Queues available on the pilot CF account tier?
- BO3: Pricing of DO storage at 3-agent pilot scale (likely negligible, but Brunel confirms).

**Testable only in pilot execution:**
- EO1 (Q2 resolution): does DO storage survive distinct-session-termination? Probe per §5 above.
- EO2: does FR's SendMessage envelope round-trip cleanly through DO storage JSON serialization without impedance? Probe = round-trip a typed `shutdown_response` envelope; check field-set integrity.
- EO3: latency of DO mailbox write+poll vs FR's current ssh+python3+fcntl baseline (657-854ms median per `cross-host-atomic-inbox-write-primitive.md`). Substrate-property baseline for comparison.
- EO4 (FR-S7-E4 connection): does the dyad-crossed-messages pattern recur on CF substrate? If yes, dyad pattern is substrate-invariant (strong finding). If no, it was FR-substrate-specific (different but useful finding).

**Framework-level open (not blocking the pilot but worth flagging):**
- FO1: if the pilot succeeds, does the CF-native discovery automation (KV roster + Queue broadcast) backflow to FR-current as a Sub-shape E inversion? I.e., could FR's manual config.json model be replaced by a substrate-style automated roster even before adopting CF substrate? (Per §S3 mvox-dev row: bottleneck-shaped, not substrate-shaped — likely no, but worth naming.)
- FO2: how does CF-native comms compose with FR's ghost-member pattern (`ghost-member-as-universal-integration-surface.md`)? Specifically: is a CF-pilot agent representable as a FR ghost-member for FR↔pilot interop? Likely yes (the ghost-member abstraction was designed substrate-agnostic), but the daemon-shape needs explicit thought. **Cross-link candidate for any future cross-substrate finding.**

(*FR:Herald*)
