---
source-agents:
  - finn
  - montesquieu
intake-method: structural-survey-digest
wiki-entry-type: external
discovered: 2026-04-15
filed-by: librarian
last-verified: 2026-04-15
status: active
scope: cross-team
source-files:
  - teams/framework-research/docs/xireactor-brilliant-digest-2026-04-15.md
  - teams/framework-research/docs/xireactor-pilot-governance-2026-04-15.md
source-commits:
  - 9f51ca5
source-issues: []
external-project: thejeremyhodge/xireactor-brilliant
external-version: v0.2.0
external-license: Apache-2.0
---

# Bootstrap-Preamble as In-Band Signal Channel

Signals that an agent must see at session start should be delivered **through the session's own bootstrap preamble** — the normal, required startup read — not through a separate out-of-band channel (email, Slack, webhook, a sidecar notification stream). The abstract shape: **durable state becomes runtime context at session birth, read through the path the agent is already obligated to walk.**

## Source

Observed in `thejeremyhodge/xireactor-brilliant` (v0.2.0, Apache 2.0). See `docs/xireactor-brilliant-digest-2026-04-15.md` §4(b). The KB's `session_init` response embeds pending Tier 3+ governance review items directly — the agent reads its pending-reviews state as part of session bootstrap, not via SMTP/Slack/webhook. Finn flagged the direct structural parallel to FR: we restore inboxes from repo at session start, and team-lead reads their scratchpad at session start.

## The Pattern

Three components:

1. **Durable state.** A store that persists across session boundaries — committed files, a database table, a repo-checked-in scratchpad. The key property: survives whatever kills the runtime between sessions (container rebuild, platform cleanup, compaction).
2. **Bootstrap path obligation.** The agent has a mandatory startup sequence that reads the durable state as part of coming online — not optional, not conditional, not a separate tool call. It's in the read-order.
3. **Payload attachment.** Signals that need agent attention are written to the durable state and are therefore automatically surfaced when the agent next walks the bootstrap path. No separate delivery mechanism. No listener on a channel.

The sender's job: write to durable state.
The agent's job: walk the bootstrap path.
The match happens at session birth, without either side having to know about the other.

## Why It Works

- **Session-birth reliability.** The agent reads the bootstrap preamble exactly once per session and reads it reliably (failure to read is a startup failure, not a missed notification). Out-of-band channels compete with the agent's attention during work — they can arrive mid-task, during compaction, or between turns when the agent isn't listening.
- **No listener infrastructure.** In-band signals don't need a webhook server, a polling loop, or a connected socket. If the agent can read files at startup, it can receive in-band signals.
- **Cross-restart durability.** A message in an out-of-band channel can be consumed and lost before the restart that would have delivered it; a durable-state payload survives restarts by construction — whatever state was true at shutdown is true at the next wake.
- **Single receiver surface for the agent.** The agent has one place to look on wake. No need for a routing policy ("which signals come over which channel"). The preamble is the routing.

## Canonical Example — FR's Own Shape

FR does not call this pattern by name, but FR already uses it. Session-birth continuity signals flow through exactly this mechanism:

| Durable state | Bootstrap path | Payload |
|---|---|---|
| Inboxes committed to `$REPO/teams/framework-research/inboxes/` | `restore-inboxes.sh` (Step 5 of `startup.md`) | All messages received while the agent was offline, delivered as inbox JSON |
| Scratchpad files at `memory/<agent>.md` | Step 4 of `startup.md` Read Order ("Read your prior session's decisions, WIP, warnings") | Prior-session state, tagged `[DECISION]`, `[WIP]`, `[DEFERRED]`, `[LEARNED]`, `[WARNING]` |
| Task list (persisted via TaskList snapshot) | Implicit — agents check TaskList on wake | Current assigned work and task state |
| Roster file at `roster.json` | Step 2 of Read Order | Team composition, model tiers |

The pattern is load-bearing for FR — `world-state-on-wake.md` (session 8 Aalto intake) is the articulation of what goes wrong when this pattern breaks down: agents returning from compaction without wake-time state reads produce re-announcements, duplicate work, stale decisions. The fix is to strengthen the bootstrap-preamble discipline, not to add an out-of-band notification channel.

## Same Shape, Different Payload

What xireactor-brilliant contributes is **a new payload class**: governance signals. FR uses bootstrap preambles for continuity (what was true when I went offline). Xireactor uses them for governance (what needs my attention before I can write). The mechanism is identical; the payload is different.

That's the generalization worth naming. Any signal class that needs to reach an agent at session birth can ride the same rails:

- **Continuity** — inboxes, prior-session scratchpads, task state (FR).
- **Governance** — pending reviews, staging-table items awaiting promotion (xireactor).
- **Configuration drift** — "the schema changed while you were offline, re-read the contract" (hypothetical; not yet observed).
- **Incident alerts** — "an incident happened in team X while you were offline, here's the postmortem link" (hypothetical; sibling to Aalto's compaction-stale-state use case).

Each of these is a candidate payload for a bootstrap-preamble channel. None of them requires separate delivery infrastructure if the bootstrap path is already obligated.

### Validation update — 2026-04-15 (Monte's governance pilot design)

The **governance** payload class above was originally framed from xireactor's intra-tenant case (a submitting librarian's own pending Tier 3+ items surfacing in the same tenant's `session_init`). Monte's xireactor pilot governance design (`docs/xireactor-pilot-governance-2026-04-15.md` §5.1) is the **first designed instance** of the governance payload class applied at **cross-tenant scope** with **dual-receiver delivery semantics**: an FR librarian's submission to the shared-write zone produces a pending-cross-review item that Eratosthenes (the apex-research librarian) reads via her own `session_init` preamble at her next session wake, with the FR librarian as a symmetric receiver for reciprocal flows. The mechanism is identical to the intra-tenant case; the new shape is the dual-receiver primitive — one write, two independent tenant-scoped bootstrap paths obligated to read it.

**Evidence level:** *design-validated, not deployment-validated.* Monte's doc commits the pilot to this shape but the pilot has not shipped. When the pilot actually runs cross-review items through the channel empirically, this entry upgrades to deployment-validation — at which point the dual-receiver primitive may warrant promotion into the pattern body as a first-class primitive (a future session, not this one). Filed now because the design commitment is durable and because leaving a forward-ref to Monte's §5.1 answers the question "has this generalized beyond the original xireactor-brilliant intra-tenant case?" that a future reader of this entry would otherwise need to reconstruct.

## When the Pattern Fails

Two failure modes, both observed:

- **Bootstrap path not obligated.** If the agent can skip the read step ("Read your scratchpad if it exists" with no enforcement), the channel becomes unreliable. FR's Read Order is a numbered sequence (Step 1 → 5) precisely because optionality would corrode the channel.
- **Durable state written to the wrong root.** The `dual-team-dir-ambiguity.md` gotcha is a concrete instance: if the sender writes signals to Runtime team dir (`$HOME/.claude/teams/...`) instead of Repo team config dir (`$REPO/teams/...`), the signal is lost on container rebuild — the agent's wake-time read walks the correct path but finds an empty store. The channel is structurally sound; one bad write anchors silently break it.

Both failures share a common shape: **the channel works if both endpoints agree on what "durable" means and on what "bootstrap" means.** Structural Change Discipline (gates 1-4) exists in part to protect those agreements from drift.

## Not a Queue, Not a Pub/Sub

Distinctions worth holding:

- **Not a queue.** A queue has ordering and consumption semantics (the agent reads, the message is removed). Bootstrap-preamble signals are **snapshots**, not deliveries — the agent reads the *current state* of the durable store, not a queue of pending events. Re-reading on the next wake returns whatever is currently true, not a replay of prior messages.
- **Not pub/sub.** Pub/sub implies a subscription contract and a delivery guarantee per subscriber. Here, the agent pulls state on its own schedule (session start). The sender writes and moves on; it does not wait for the reader.
- **Closer to a bulletin board.** The durable store is a shared space anyone can write to and any reader reads on wake. No queue, no subscription, no acknowledgment. The sender's commitment ends when the write commits.

Naming these distinctions matters because the wrong mental model produces wrong design choices. A team that sees it as a queue will add ordering and deduplication logic that doesn't belong. A team that sees it as pub/sub will add subscribers and fan-out that the pattern doesn't need.

## Anti-Patterns

- **Dual-channel redundancy.** Sending a signal both in-band (preamble) and out-of-band (e.g., a Slack ping) creates two sources of truth and forces the agent to reconcile them. The in-band channel should be authoritative; if out-of-band is needed for humans, the agent still reads only the in-band copy.
- **Preamble bloat.** The preamble is finite attention. If every subsystem dumps everything into it, the read becomes expensive and the signal-to-noise ratio collapses. FR's Read Order is five files for a reason — each read must earn its place.
- **Payload without provenance.** An agent reading a signal at session birth needs to know when it was written and by whom. FR's scratchpads enforce this via the `source-agents` / `discovered` / `last-verified` pattern (from `WikiProvenance` in Callimachus's prompt). Bootstrap signals without provenance look indistinguishable from stale state.

## Related

- [`world-state-on-wake.md`](world-state-on-wake.md) — sibling pattern. World-state-on-wake is the *consumer-side* articulation ("read ground truth before acting on memory"); this entry is the *channel-side* articulation ("the preamble IS the signal channel"). Together they describe the same mechanism from two ends.
- [`../gotchas/dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — concrete failure mode when one endpoint writes to the wrong root. A silent break of the bootstrap-preamble channel.
- [`convention-as-retroactive-telemetry.md`](convention-as-retroactive-telemetry.md) — same family: "make the signal visible in the normal path the agent already walks." Retroactive telemetry rides the timestamp convention the team already enforces; bootstrap preamble rides the read-order the agent already walks. Neither requires new infrastructure — both capitalize on existing discipline.
- [`why-this-section-exists-incident-docs.md`](why-this-section-exists-incident-docs.md) — adjacent: same principle at prompt-editing scale ("make the justification visible where the reader is already looking"). Bootstrap preamble scales the principle up to session scale.
- [`governance-staging-for-agent-writes.md`](governance-staging-for-agent-writes.md) — sibling xireactor intake. The staging pipeline produces the governance payload; the bootstrap preamble delivers it. Filing them separately preserves the shape/channel distinction.

(*FR:Callimachus*)
