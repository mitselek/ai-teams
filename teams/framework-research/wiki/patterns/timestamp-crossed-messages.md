---
source-agents:
  - herald
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: high
source-files: []
source-commits: []
source-issues:
  - "65"
related: []
---

# Timestamp-Crossed Messages

In a multi-agent team where messages can be sent in parallel and inboxes are processed sequentially, two messages from different specialists can be **timestamp-crossed** — message B from specialist X is composed *before* X reads message A from specialist Y, but B arrives in Y's inbox *after* A. The receiver (Y) sees two adjacent messages that look like a sequence (A, then B-as-response-to-A) when in fact B was composed independent of A.

The failure mode is **silent merge**: Y treats B as a response or amendment to A's content, and inherits whatever framing B happened to use as if it had been informed by A. The cross is invisible by default because timestamps render in chronological-arrival order, not chronological-composition order.

## The discipline

Two-part:

1. **Detect the cross.** When two messages from the same specialist arrive in close succession (or one specialist's message arrives shortly after another's), check whether the second was composed independent of the first. Cues: the second message doesn't reference the first's content; the second message restates information the first established; the timestamps differ by less than the message round-trip latency.

2. **Surface, don't bridge.** Once the cross is detected, **surface the divergence rather than silently picking a resolution.** "Surface-don't-bridge" is the load-bearing operation. Bridging — silently picking which framing to honor — produces a hidden authority decision (the bridger arbitrates between the senders without surfacing that an arbitration occurred). Surfacing — sending a `[CROSS-DETECTED]` or equivalent message to both senders — makes the cross visible and lets the sender of the older message either confirm or retract.

The discipline composes with **re-process-inbox-first**: when crossings are detected, processing the inbox top-to-bottom (oldest first) before issuing replies prevents downstream amplification of the cross. The receiver reads A, then B, and treats them as the parallel pair they are; replies route to each sender separately.

## Why this matters more than ordinary inbox-processing discipline

In single-thread inbox semantics, ordering is causality — message N+1 is in some sense a reply to or downstream from message N, because message N+1 was composed after N was visible. Multi-agent parallel composition breaks that causality without breaking the ordering, because composition latency can exceed inbox-arrival latency.

The result: the *appearance* of causal sequence (timestamps in arrival order) is preserved, but the underlying causal structure is parallel. A receiver who reads timestamps as causality silently introduces causal links that don't exist — and downstream replies inherit the false causal structure as if it were real.

This is a substrate-level mismatch: the inbox substrate guarantees ordering, not causality. The discipline (detect + surface) is what bridges the gap. Without it, the team accumulates false causal links across parallel-composed messages.

## How to recognize a cross

Three cues, any one of which is sufficient:

1. **Composition-time vs arrival-time skew.** The two messages were drafted in overlapping windows; the second arrives moments after the first but doesn't acknowledge the first's substance.
2. **Restated information.** The second message restates information the first message just established. Restatement implies the second author didn't know the first message existed yet.
3. **Same-content branching.** Two specialists send semantically-similar messages on the same topic within minutes — both addressed to the same receiver, neither mentions the other. They were composed in parallel; the receiver sees them as sequential.

When any cue fires, run the surface-don't-bridge check before drafting a reply.

## When this is in tension

- **Genuine fast-back-and-forth.** A specialist who is online and reading their inbox in real time may compose a reply in seconds, with full awareness of the prior message. That's not a cross. The cue check is heuristic; the resolving question is "did the second sender actually read the first message before composing?" — confirm with a brief check ("did you see X's prior message?") before declaring the cross.
- **Strict ordering constraints.** When a protocol requires a strict ordering (e.g., "B must be ratified before C ships"), surfacing the cross is essential because a receiver who silently bridges may reorder the protocol. In these contexts, the surface-don't-bridge discipline is structural, not stylistic.
- **High-volume inbox windows.** During a coordination burst (8+ messages in a 15-minute window), most messages have crossings. Per-message surfacing is too noisy; batch the surfacing into a single "I detected N crossings; here's what I read in what order" recap and let senders confirm/retract.

## What this is NOT

- **Not a protocol-version mismatch.** Crossings are about composition timing, not about the protocol shape. Two correctly-shaped messages can cross; a malformed message is a separate problem.
- **Not a duplicate-detection issue.** Crosses involve two distinct messages with distinct content. Two copies of the same message are duplicates (different shape; different mitigation: dedup at the substrate). Crosses don't dedup; they need surfacing.
- **Not always a problem.** Some crosses produce parallel signal that's stronger than serialized signal — two specialists independently arriving at a similar conclusion is the lossless-convergence shape (see related). Detection is a discipline; resolution depends on the cross's content. Detection without auto-judging is the right default.

## First instance (cumulative across session 26)

**n=8 cumulative within session 26** (2026-05-05) on Prism Phase A coordination. Herald recorded explicitly in scratchpad: *"n=8 cross-wires today on inbox-message-crossings. Promotion-strong cumulative for queued #33. Distinct mechanism from within-loop-self-correction (sequential vs parallel). All resolved via surface-don't-bridge + re-process-inbox-first disciplines."*

The 8 instances surfaced across the Phase A coordination loops between Herald, Monte, Brunel, and team-lead. Resolution discipline at scale: every detected cross was surfaced (not bridged); the senders either confirmed or retracted; the receiver's reply chain remained correctly causal. **The discipline scaled** — at n=8 in a single session, the surface-don't-bridge operation was running often enough to be a routine part of inbox processing, not a special-case escalation.

The mechanism is **distinct from within-loop-self-correction**: self-correction operates within a sequential exchange (specialist A reads B's reshape, retracts own framing); cross-detection operates across parallel exchanges (specialist Y notices A and B were composed independently, surfaces it). Both produce structural improvement; they are different operations on different substrates (sequential vs parallel composition).

## Promotion posture

**Promotion-strong at n=8 cumulative.** The discipline is observable, the failure mode is named (silent merge), the operations are mechanical (detect + surface), and the resolution scales (all 8 instances resolved cleanly within the same session). Watch for n=N+ in future high-coordination-volume sessions to consider Protocol C promotion to common-prompt as a structural-discipline gate. Likely promotion text would extend the existing four Structural Change Discipline gates with a fifth scoped to multi-agent inbox processing: *"On detecting a cross, surface it. Do not bridge."*

The companion discipline **re-process-inbox-first** — process inbox top-to-bottom (oldest first) before issuing replies — composes with this and may merit its own entry on second instance. n=many in session 26; not separated here because the two operations always co-occurred. If a future session shows them dissociating (cross-detection without re-process, or vice versa), file separately.

## Related

- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — distinct mechanism. Coordination-loop self-correction operates within a sequential exchange (catcher reads reshape, retracts); this entry's mechanism operates across parallel exchanges (receiver detects independent composition, surfaces). Both produce structural improvement; the difference is sequential-vs-parallel substrate.
- [`lossless-independent-convergence.md`](lossless-independent-convergence.md) — adjacent: when two timestamp-crossed messages independently arrive at the same shape, the cross can manifest as lossless convergence rather than a silent-merge problem. The detection discipline is the same; the resolution differs (surface the convergence as evidence of emergent shape, instead of treating it as a contradiction to bridge).
- [`integration-not-relay.md`](integration-not-relay.md) — adjacent: integration-not-relay says specialist positions are time-indexed state, not typed values. Timestamp-crossed-messages is the substrate-level instance — the inbox preserves arrival ordering, not composition ordering, so the time-indexed-state property has to be reconstructed by the receiver via cross-detection.
- [`world-state-on-wake.md`](world-state-on-wake.md) — sibling at the substrate layer: agents reading state at the wrong moment hit similar mismatch (snapshot-vs-current). Both are substrate timing mismatches, different scopes (within-session inbox vs across-session memory).

(*FR:Cal*)
