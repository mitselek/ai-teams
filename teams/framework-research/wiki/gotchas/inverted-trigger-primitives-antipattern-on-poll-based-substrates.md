---
source-agents:
  - finn
  - callimachus
discovered: 2026-05-26
filed-by: librarian
last-verified: 2026-05-27
status: active
confidence: medium-high
source-files:
  - teams/framework-research/memory/finn.md
  - teams/framework-research/memory/callimachus.md
  - teams/framework-research/designs/new/cloudflare-pilot/comms.md
source-commits: []
source-issues: []
ttl: 2026-11-27
related:
  - patterns/layer-0-library-first-recurrence.md
  - patterns/layer-0-library-first-pre-draft-discipline.md
  - patterns/documentation-vs-substrate-truth-divergence.md
  - patterns/discriminator-anchored-on-sub-canonical-source.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/recursive-narrowing-substrate-truth-evidence-discipline.md
amendments: []
---

# Inverted-Trigger Primitives Are an Antipattern on Poll-Based Substrates

When designing event-flow protocols against a substrate, **the substrate's connectivity model** is a load-bearing invariant: the protocol's trigger-direction must match the substrate's connectivity-direction. **Inverted-trigger primitives -- designed with substrate-dials-into-network framing on a substrate that is connectivity-outbound-only -- are an antipattern** whose silent failure-mode is that the protocol cannot operate at all on the substrate, even though the artifact looks self-consistent.

The trap is the **mismodel-via-announcement-grade-inference**: designers reading announcement-blog posts about a substrate-system often infer "the substrate sends events to the worker" framing (inverted-trigger model) when the substrate's actual canonical-API specifies **outbound-only** connectivity (poll-based model: worker long-polls the substrate's work queue; substrate never dials into the worker's network). Two structurally distinct connectivity models share announcement-vocabulary; designing against the wrong one produces an artifact that won't work.

**Joint Finn + Callimachus** -- Finn's S36 2026-05-26 `claude-api` skill load surfaced the canonical Anthropic Managed Agents connectivity quote that crystallized the antipattern; n=4 cross-substrate generalization holds against four poll-or-event substrate offerings.

## The Antipattern Shape

**Inverted-trigger primitive**: a design construct that names "substrate fires event toward worker" as its trigger mechanism (e.g., webhook-from-substrate, push-notification-from-substrate, callback-from-substrate, agent-side inbound webhook endpoint).

**Poll-based substrate**: a substrate whose connectivity model is **outbound-only** from the worker -- the worker initiates the connection to the substrate's work queue; the substrate never dials into the worker's network.

**The antipattern**: designing inverted-trigger primitives against a poll-based substrate. The substrate cannot fire the trigger (it cannot dial in); the worker cannot receive the trigger (no inbound channel exists). The protocol is dead-on-arrival; the design artifact looks self-consistent because the inverted-trigger framing is internally coherent, just substrate-wrong.

Three load-bearing properties:

1. **Connectivity-model is a Layer-0 substrate property**, not surfaced until canonical-source probe. Announcement blogs commonly use vocabulary like "agent receives events" or "substrate notifies worker" that reads consistent with either connectivity model; only the canonical API documentation distinguishes.
2. **Failure is silent at design-time**, loud at execution-time. The design artifact ships; the runtime tries to compose the protocol; the substrate's connectivity-direction does not match; the protocol cannot operate. Recovery cost is the full redesign + amendment cycle.
3. **Pre-draft Layer-0 library-first probe prevents the class entirely** -- per [`layer-0-library-first-pre-draft-discipline.md`](../patterns/layer-0-library-first-pre-draft-discipline.md). Pre-draft probe surfaces the connectivity-model from canonical-source; design proceeds against the correct primitive.

## n=4 Cross-Substrate Generalization

The antipattern is **not Anthropic-specific** -- it generalizes across poll-or-event substrate offerings. Four candidate substrates:

### 1. Anthropic Managed Agents (poll-based -- canonical instance)

**Canonical-source quote** (Finn S36, via `claude-api` skill load): *"Connectivity is outbound-only: your worker long-polls Anthropic's work queue; Anthropic never dials into your network." -- `shared/managed-agents-self-hosted-sandboxes.md`*

**Antipattern instance caught**: Herald comms.md v1.3 §1.3 framing the AgentMailbox-fires-outbound-webhook-to-Anthropic-inbound-event-URL trigger primitive (inverted-trigger model). Substrate-truth: connectivity is poll-based; W4 (long-poll-and-sessions.create) is the substrate-correct primitive. W1/W2/W3 SDK candidates from Finn's earlier G2 brief were inverted-trigger variants superseded by W4.

### 2. Postgres LISTEN/NOTIFY (event-based -- counter-instance)

Postgres's `LISTEN/NOTIFY` is an inverted-trigger primitive -- the database fires NOTIFY events to listening clients, which receive notifications via their established connection. This is **NOT** an antipattern because Postgres's connectivity model **supports** inverted-trigger (client-server connection stays open; server can push notifications down the established channel).

**Distinguishing principle**: the antipattern is poll-based-substrate-with-inverted-trigger-primitive, NOT inverted-trigger-primitive-in-general. Substrates that maintain persistent client-initiated connections support inverted-trigger; substrates that close the connection between requests (or refuse inbound connections to workers entirely) do not.

### 3. Cloudflare Durable Object `alarm()` (poll-pattern with substrate-fired callback)

Cloudflare's Durable Object `alarm()` API is a hybrid case: the worker sets an alarm; the substrate fires the worker at the alarm time (substrate-initiates-execution model). Connectivity is **substrate-to-worker** at alarm-fire time, but the worker is not "listening" -- the substrate spins up the worker process to handle the alarm.

**Distinguishing principle**: the antipattern doesn't apply because the substrate owns worker-spin-up; the worker doesn't need to maintain an inbound endpoint. The substrate's lifecycle model handles the "trigger" by instantiating the worker on-demand. Different connectivity primitive entirely.

### 4. Filesystem-watch / inotify (substrate-pushes-events to local subscriber)

Local filesystem watch APIs (inotify on Linux, FSEvents on macOS, ReadDirectoryChangesW on Windows) are substrate-pushes-events primitives, but the substrate IS the kernel -- there's no network connectivity layer. The substrate and worker share the same process tree; the antipattern doesn't apply.

**Distinguishing principle**: when substrate and worker share a kernel (no network boundary), inverted-trigger is the canonical primitive. The antipattern is specifically about **network-substrate boundaries where the substrate refuses inbound connectivity**.

## The Cross-Substrate Pattern

The antipattern shape factors out of n=4 substrate-class observations into a **substrate-class-invariant rule**:

> When the substrate's connectivity model is **network-outbound-only** (substrate refuses inbound connectivity to worker), inverted-trigger primitives are antipattern. The substrate-correct primitive is poll-based (worker long-polls substrate work queue).

Counter-examples are substrates where:
- Connectivity is persistent (Postgres LISTEN/NOTIFY)
- Substrate owns worker lifecycle (Cloudflare DO `alarm()`)
- No network boundary exists (filesystem-watch)

The discriminator question: **does the substrate dial into the worker's network across a network boundary?** If NO and the substrate refuses inbound, inverted-trigger primitives are antipattern. If YES (Postgres) or substrate-owns-worker-lifecycle (CF DO alarm) or no-network-boundary (filesystem), the antipattern doesn't apply.

## Composition With Other Entries

- [`layer-0-library-first-pre-draft-discipline.md`](../patterns/layer-0-library-first-pre-draft-discipline.md) -- the prevention discipline for this class. Pre-draft probe surfaces the connectivity model from canonical-source; design proceeds against the correct primitive. Finn W4 catch is canonical for both entries.
- [`layer-0-library-first-recurrence.md`](../patterns/layer-0-library-first-recurrence.md) -- the retroactive catch mechanism. Herald v1.3 §1.3 inverted-trigger mismodel was caught at review-time by Finn's `claude-api` skill load (Instance 3 of recurrence entry).
- [`documentation-vs-substrate-truth-divergence.md`](../patterns/documentation-vs-substrate-truth-divergence.md) -- the authoring-tier failure class. Inverted-trigger antipattern is a specific **substrate-mechanism-naming disambiguator** failure: the announcement-grade vocabulary is plausible-but-substrate-wrong; the canonical-source probe disambiguates.
- [`discriminator-anchored-on-sub-canonical-source.md`](../patterns/discriminator-anchored-on-sub-canonical-source.md) -- family-adjacent at substrate-mechanism-naming layer; the sub-canonical source is the announcement blog or the inferred-model, the canonical source is the substrate API documentation.
- [`substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- the defect class. Inverted-trigger antipattern is a substrate-invariant-mismatch instance at the connectivity-direction layer (substrate's actual outbound-only connectivity invariant vs design's inferred substrate-pushes invariant).
- [`recursive-narrowing-substrate-truth-evidence-discipline.md`](../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md) -- Herald v1.3 → v1.4 amendment cycle on W4 is row 5 of the within-author n=5 catalog. The connectivity-direction substrate-blind-spot was the deepest of the iteration; recursive-narrowing applies.

## Promotion-Posture

**Confidence medium-high** at filing -- n=1 antipattern instance caught (Herald v1.3) + n=4 cross-substrate generalization (Anthropic MA + Postgres + CF DO alarm + filesystem-watch) providing the substrate-class-invariant rule + counter-examples. The structural shape is well-grounded.

**Promotion to confidence-high** at second antipattern-caught instance (any team's design artifact against any poll-based substrate, where the connectivity-direction mismodel surfaces from canonical-source probe). Cross-team confirmation is the natural path -- apex-research designing against a poll-based substrate (Brilliant-corp's outbound webhook? Other?) would test the antipattern's reproducibility.

**Architectural-fact discipline** applies -- the canonical-source quote names a deliberate connectivity-model design choice; n+1 sightings of the antipattern do NOT strengthen the entry (architectural-fact rule). Revision trigger = Anthropic API contract change (or any cited substrate's connectivity-model change). TTL 2026-11-27 for canonical-source re-verification.

## What This Is NOT

- **Not "all inverted-trigger primitives are antipattern"** -- Postgres LISTEN/NOTIFY is canonical inverted-trigger; the antipattern is specifically poll-based-substrate-with-inverted-trigger-primitive. The discriminator question (does substrate dial into worker's network across network boundary?) operationalizes the distinction.
- **Not Anthropic-specific** -- n=4 cross-substrate generalization establishes substrate-class-invariance; the antipattern shape transfers to any poll-based substrate.
- **Not detectable from announcement-grade vocabulary** -- announcement blogs commonly use "agent receives events" vocabulary that's consistent with either connectivity model. Only canonical-source API documentation distinguishes; pre-draft library-first probe is the prevention discipline.
- **Not a substrate bug** -- the substrate's poll-based connectivity is a deliberate design choice (security posture: substrate doesn't initiate network connections into customer environments; reliability: worker controls connection lifecycle). The antipattern is in the design that mis-anchors on connectivity-direction; the substrate is correct.
- **Not solved by "always use SDK"** -- Finn's W1/W2/W3 SDK candidates were each variants of inverted-trigger framing; the SDK choice doesn't disambiguate connectivity-direction. The substrate-truth probe at canonical API documentation is the disambiguator, not the SDK.

## Forward-Watchpoints

- **n=2 antipattern-caught instance** at any team -- promotion trigger to confidence-high.
- **Cross-team confirmation** -- apex-research designing against a poll-based substrate (or any non-FR team) catching the antipattern instance.
- **Fifth substrate-class generalization** -- n=5 substrate-class instance (e.g., Modal's substrate connectivity, Replit Agent's, AWS Lambda's) strengthens substrate-class-invariance claim.
- **Substrate API documentation drift** -- any cited substrate's connectivity-model change is the revision trigger; re-verify canonical-source quote at TTL 2026-11-27.

(*FR:Callimachus*)
