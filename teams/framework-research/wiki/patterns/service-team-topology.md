---
source-agents:
  - callimachus
source-team: comms-dev
discovered: 2026-05-12
filed-by: librarian
last-verified: 2026-05-12
status: active
confidence: medium
source-files: []
source-commits: []
source-issues:
  - "47"
  - "66"
related:
  - patterns/ghost-member-as-universal-integration-surface.md
  - references/inbox-file-write-as-wake-mechanism.md
  - patterns/wiki-cross-link-convention.md
  - patterns/two-consumer-pattern.md
  - patterns/path-namespace-as-federation-primitive.md
---

# Service-Team Topology -- Members are Ghosts of Consumer Teams

A **service team** is a team whose `members[]` are ghost representations of the teams it serves. The canonical example is a library team -- a team-lead (master librarian) plus `ghost-team-A`, `ghost-team-B`, ... entries, one per consuming team. From the master librarian's seat, every consuming team is *literally a teammate*. A query from team A arrives as a message from `ghost-team-A`; the librarian replies via SendMessage to that same ghost; the response routes back to the original asker's inbox in team A.

Per RFC #66 (2026-05-12), proposed as direct answers to Issue #47's open questions on the Librarian / cross-team knowledge layer.

## The topology

```
              library team
              ┌────────────────────────────────────────┐
              │                                        │
              │   master-librarian (team-lead)         │
              │   ── reads/writes wiki/                │
              │   ── curates index, cross-references   │
              │                                        │
              │   ghost-team-A  ◄─── transport ───►  team A's `library` ghost
              │   ghost-team-B  ◄─── transport ───►  team B's `library` ghost
              │   ghost-team-C  ◄─── transport ───►  team C's `library` ghost
              │   ghost-team-D  ◄─── transport ───►  team D's `library` ghost
              │                                        │
              └────────────────────────────────────────┘
```

From the service-team side: every consumer is a named member, addressable like any teammate. From the consumer-team side: a single `library` ghost (no awareness of how many other consumers connect, who's asking what, or how the library is structured internally).

Built on [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the abstraction that makes "a teammate" equivalent to "a name + an inbox file."

## Properties that fall out

- **Canonical view at the service team.** The librarian sees all queries, from all teams, in one inbox. Cross-team learning is structural, not a feature: when alice@team-A asks about D1 BLOBs and dag@team-B asked the same thing two sessions ago, the librarian sees both messages on the same team.
- **Per-consumer view at the consuming end.** Team A specialists only see their own `library` ghost; they don't know how many other teams are connected, who's asking what, or how the library is structured internally. Information hiding by default.
- **ACL is one-sided.** The service team controls who connects by adding or removing ghost members in its own `members[]`. Revoking a consumer is a single config edit. Consumer doesn't need to cooperate.
- **Audit trail is the inbox.** Every query and every answer is a JSON entry in `inboxes/ghost-team-X.json` on the service-team side. No separate logging.
- **Bidirectional knowledge flow without ceremony.** Same channel carries queries (consumer → service) and pushes (service → consumer -- e.g., proactive `[NEW PATTERN AVAILABLE]` notifications, or a librarian noticing team-B is about to repeat a mistake team-A already fixed).
- **Findings ingest is just inbound messages.** Each consumer team can expose a `findings` ghost (write-only emitter) that pipes `[LEARNED]` entries from scratchpads into the service team's inbox. The Librarian's "Ingest" operation becomes "process new messages from ghost-team-X." No polling of remote scratchpads, no special protocol.

## Generalization beyond libraries

The service-team pattern is broader than the library case (RFC #66 table):

| Service team | Members are ghosts of | Purpose |
|---|---|---|
| Library | every consumer team | Knowledge curation, query, ingest |
| Manager / coordinator | every L2 team under it (T04 hierarchy) | Handoff routing, broadcast governance, dispute mediation (Protocol 1) |
| Audit / compliance | every team being audited | Cross-team consistency, policy enforcement |
| DevOps / SRE | every team using shared infrastructure | Deployment coordination, incident response, capacity signals |
| Cross-team Finn | every team that needs research help | One Finn shared across teams instead of N team-local Finns rediscovering the same things (#47 OQ4) |

In each case: service team is the **canonical view**; consumer teams hold thin per-link references. Service-team agents have full context on their service domain; consumer agents have the same SendMessage tool they already use.

## Direct answers to Issue #47 OQs (RFC #66's claim, this entry's assessment)

| OQ | RFC #66 claim | Assessment |
|---|---|---|
| OQ1 (Librarian standalone vs Medici evolution) | Standalone -- but more than that: standalone *team*, not just standalone agent | **Partial**: the standalone choice is confirmed; the original within-team binary (one agent vs Medici-evolution) is sidestepped, not answered. The reframe is sound but exceeds the original OQ scope |
| OQ2 (trigger mechanism: poll/tagged-msgs/Medici-batches) | No polling. `[LEARNED]` entries become messages from a `findings` ghost; master librarian wakes on inbox write like any teammate | **Holds clearly** -- substrate-level guarantee from [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) makes this clean |
| OQ3 (cross-team wiki: global vs per-team) | Library *team* IS the cross-team layer. Per-team wikis can stay where they are; library is a peer service, not a replacement | **Holds** -- resolves layering without forcing redesign of per-team Librarian-equivalents |
| OQ5 (write conflicts) | Library team is sole writer to its own `wiki/`. Standard directory-ownership pattern. No locking needed | **Holds** -- already proven discipline at within-team layer (FR's "Wiki Directory Sovereignty" rule); generalizes cleanly to service-team layer |
| OQ7 (bootstrapping) | Consumer teams don't bootstrap; library does, once, centrally. New consumers register a `library` ghost -- no wiki initialization on their side | **Holds**, AND sidesteps the Karpathy-ingest-vs-empty debate by making bootstrap a one-time central event with later organic accumulation |
| OQ8 (Memex / associative trails) | Trails are observable in the librarian's inbox itself -- convergent queries on same page IS a trail | **Partial** -- mechanism is present, but trail-preservation requires explicit inbox-retention discipline. Once messages are marked `read: true` and old messages are pruned, trail material vanishes. Surfacing trails is a deliberate curation task on top of the substrate, not free |

**Unanswered OQs from #47** (not addressed by RFC #66):

- **OQ4** (wiki/scratchpad boundary): the classification work stays with the consuming-team librarian -- RFC presupposes per-team scratchpads + per-team wikis continue. Still open at within-team layer.
- **OQ6** (token cost / Sprint/Standard/Cathedral tiering): the service team itself has token cost (continuous master-librarian + ghost-members). Open.

## Composition with FR's existing cross-pollination pattern

FR already operates a primitive cross-team flow:

- [`patterns/wiki-cross-link-convention.md`](wiki-cross-link-convention.md) introduced `source-team` frontmatter as a single-entry experiment -- first cross-pollination filing from apex-research.
- [`process/companion-pair-submission-protocol.md`](../process/companion-pair-submission-protocol.md) cross-pollinated from apex-research via Finn's comparative analysis.

These flows are today **Finn-mediated, ad-hoc, low-frequency**. The service-team topology generalizes the same pattern to **inbox-mediated, structured, higher-frequency**. The substrate change is significant: cross-team-applicable entries become first-class messages to the service-team library; the `source-team` frontmatter field becomes a population-time property rather than a manual-curation marker.

**Implication for FR's wiki**: under the third reading of RFC #66 (library team as new peer-service alongside per-team Librarians), FR's wiki/ continues unchanged. The new question is: which entries belong at the FR layer vs. the service-team layer? Default heuristic: cross-team-applicable entries flow up via a `findings` ghost; team-local entries stay. The `source-team` frontmatter + `scope: cross-team` markers already in use are the mechanism. **No new FR-internal tooling needed.**

## Why this beats peer-to-peer for service relationships

A peer-to-peer model (every team has a `library` ghost talking to every other team via direct links) has N² potential channels and no central view. The service-team model has N channels (one per consumer) and a single locus where the librarian works. For relationships that are inherently asymmetric -- service provider vs. consumers -- modeling them as such is honest and structural. Topic 03 §Protocol 2 already chose hub-and-spoke for inter-team comms with similar reasoning; the service-team pattern applies that decision to specific service domains.

## Confidence

**Medium.** Coherent topology proposal with substrate-level enabler (inbox-file-write wake). Direct answers to Issue #47 OQs are mostly clean (4 hold clearly, 2 partial, 2 unanswered). Implementation has not started; the local-fs plugin needed to test the topology end-to-end is sketched but not built.

Confidence will upgrade to `high` on:

- First service-team deployment (e.g., a library team running with two consumer teams) demonstrating end-to-end query/response/findings-ingest cycle
- Cross-team confirmation that the topology survives the operational realities not captured in the design (e.g., what happens when a consumer team has its own internal Librarian -- do the two coexist? does the cross-team Librarian observe the within-team Librarian as a peer or as a passthrough?)

## Promotion posture

**n=1 watch posture.** First articulation in RFC #66. Promotion candidates:

- Cross-team confirmation: a second framework or product team independently arrives at the same topology
- Implementation of any service-team variant (library, manager, audit, DevOps) demonstrating the pattern's operational robustness

## What this is NOT

- **Not a redesign of per-team Librarians.** Per-team `wiki/` directories and within-team Callimachus-equivalents remain. The service team adds a layer above; it does not replace the within-team layer.
- **Not free.** The service team has its own continuous-context cost (master librarian + N ghost-members). The OQ6 token-cost question is unaddressed; service-team topology is a *redistribution* of where the cost lives, not a removal of cost.
- **Not a relay model.** Each ghost-pair is a first-class communication link with its own transport. The service team is a peer to its consumers, not a router between them.
- **Not a substitute for the [`two-consumer-pattern.md`](two-consumer-pattern.md) bridge.** The service-team pattern handles consumer teams that CAN query directly. Consumers without direct query capability (e.g., claude.ai Projects in the original two-consumer-pattern case) still need a manual synthesis-and-handshake bridge.

## Related

- [`patterns/ghost-member-as-universal-integration-surface.md`](ghost-member-as-universal-integration-surface.md) -- the abstraction this topology builds on.
- [`references/inbox-file-write-as-wake-mechanism.md`](../references/inbox-file-write-as-wake-mechanism.md) -- the substrate property that makes ghost-as-teammate work.
- [`patterns/wiki-cross-link-convention.md`](wiki-cross-link-convention.md) -- FR's first cross-pollination filing; precedent for `source-team` frontmatter that this topology formalizes.
- [`patterns/two-consumer-pattern.md`](two-consumer-pattern.md) -- handles asymmetric consumer access; service-team topology is the complementary shape for symmetric-access consumers.
- [`patterns/path-namespace-as-federation-primitive.md`](path-namespace-as-federation-primitive.md) -- the convention-as-federation-contract pattern; service-team topology is the message-mediated counterpart to path-namespace-mediated federation.

## Source

RFC #66 (2026-05-12) §"Service teams: when a team's members are ghosts of other teams" and §"Direct answers to #47's open questions": <https://github.com/mitselek/ai-teams/discussions/66>. Issue #47 (Librarian / Knowledge Base): <https://github.com/mitselek/ai-teams/discussions/47>. Cross-team-pollinated into FR's wiki because the topology has direct framework-level implications for Callimachus's role and for the dual-hub knowledge architecture FR runs today.

(*FR:Callimachus*)
