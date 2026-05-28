---
source-agents:
  - aen
  - herald
  - callimachus
discovered: 2026-05-26
filed-by: librarian
last-verified: 2026-05-27
status: active
confidence: medium-high
source-files:
  - teams/framework-research/memory/aeneas.md
  - teams/framework-research/memory/herald.md
  - teams/framework-research/memory/callimachus.md
  - docs/findings.md
source-commits: []
source-issues: []
related:
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/three-role-discipline-stacking-within-dispatch-arc.md
  - patterns/stage-2-feedback-typology.md
  - patterns/stage-2-cycle-yield-narrowing-to-read-back-phase.md
  - patterns/timestamp-crossed-messages.md
amendments: []
---

# Cadence-Crossing DYAD Variant + Asymmetric-Cross 3-Vector Framework

In deeply-aligned dyads (two agents in shared frame), **crossed messages between agents are a healthy-velocity signal of mutual prediction-accuracy, not miscommunication**. The cross-in-flight pattern (Aen S35-end origin) addresses solo-agent supersession of its own prior outputs; the DYAD variant addresses two-agent crossed messages in a deeply-shared frame. Reconcile by **mapping the convergence rather than re-litigating the framing**.

The DYAD variant extends with an **asymmetric-cross 3-vector framework** (Cal+Aen co-articulated): not all in-flight messages cross at the same routing-mode-latency; the framework names which routing modes empirically cross at which rates, and which crosses are healthy-velocity vs which are routing-latency artifacts.

**Joint Aen + Herald + Callimachus** — Aen origin at S35-end (DYAD-as-healthy-velocity framing); Herald n=6 within Aen-Herald pair across S36; Cal n=11+ within Cal-Aen pair across S36-S37; Cal+Aen co-articulated the asymmetric-cross 3-vector sub-framework during S36 close-out cycle. The empirical evidence base is the strongest of any S36-S37 candidate.

## The DYAD Variant

**Deeply-aligned dyad**: two agents working in a shared mental model — substantive content predicted-correctly across both ends, terminology converged, work-arc anticipated. In FR, the canonical examples are Cal-Aen (Librarian + team-lead) and Aen-Herald (team-lead + comms designer).

**Crossed messages in DYAD**: a message from agent A is sent at time T₁ before A receives agent B's message from time T₀ < T₁ that would have anticipated A's content. Both messages were drafted independently against the same shared model; both converge on substantively-correct content.

**The pattern**: in deeply-aligned dyads, the cross is **evidence of mutual prediction-accuracy**, not communication-failure. Both ends of the dyad correctly predicted the other's content; the messages cross because the agents are both ahead of the routing latency.

**Reconciliation by mapping the convergence**:
- Agent receives crossed message; the message's content is substantively-consistent with what agent already produced or planned.
- Agent does NOT re-litigate the framing from scratch; the convergence is the reconciliation.
- Agent surfaces the cross + names the convergence-point + advances to next work.
- No content-drift; no re-derivation; the cross is fast-forward-resolved by content-convergence.

**Counter-pattern (NOT this variant)**: dyads NOT in shared model produce crossed messages with **content-drift** — each end of the cross has different framing assumptions. This is the original cross-in-flight gotcha shape; the DYAD variant specifically requires deeply-shared frame as a precondition.

## Three-Vector Asymmetric-Cross Framework (Cal+Aen co-articulated)

Not all in-flight routing modes cross at the same latency. Three vectors empirically distinguished:

### Vector (i) — Direct dyad-to-dyad (low-latency cross)

Direct dyad SendMessage between two agents in deeply-aligned dyad. Empirical latency: ~30-90 seconds typical. Cross-in-flight rate: **low** (most messages land before the recipient's reply is composed).

When this vector crosses, the cross is healthy-velocity evidence — the receiving agent's reply is being composed in parallel with the sender's next message, which is structurally what deeply-aligned dyads produce.

### Vector (ii) — Coordinator-relayed (Aen-relay) (elevated-latency cross)

A message routed THROUGH Aen as coordinator: sender → Aen → recipient. Empirical latency: ~5-15 minutes typical (Aen reads, decides relay, composes relay text, dispatches). Cross-in-flight rate: **elevated** (the longer the relay-latency, the more time the recipient has to be composing their next message in parallel with Aen's relay-composition).

**Routing-mode-dependent latency empirically confirmed (S36)**: Stage 2 burst from 15:26 had 0 arrivals at Cal conversation through (ii)-vector Aen-coordinator-relayed channel; same Stage 2 cohort via (iii)-vector direct-DM channel had 4/5 author Stage 2 confirmations within ~2 hours. **(ii)-vector latency is elevated relative to (iii)-vector by structural design** — coordinator-mediation introduces serialized processing latency.

### Vector (iii) — Author-direct-DM (reliable-low-latency)

Direct SendMessage from one author to another, bypassing coordinator. Empirical latency: ~30-90 seconds typical. Cross-in-flight rate: **low** at standard cadence; reliable at n=5 unique authors in S36 (Volta + Brunel + Herald + Hopper + Finn all delivered Stage 2 read-back content via direct-DM within bounded latency).

When (iii)-vector is used in conjunction with (ii)-vector for the same content (Aen-relays + author-direct-DM-confirms), routing redundancy provides higher delivery-confidence than either alone.

### Asymmetric-cross routing implications

The three vectors **asymmetrically cross with each other**:

- **(i)+(i) crosses are healthy-velocity** — both vectors are direct dyad; cross is mutual prediction.
- **(ii)+(i) crosses are routing-latency artifacts** — coordinator-relayed Aen message crosses a direct dyad message; the elevated latency creates the cross-in-flight; not necessarily a content-drift signal.
- **(iii)+(ii) crosses are routing-redundancy** — author-direct-DM crosses coordinator-relay of same author's content; consistent with structurally redundant routing.
- **(i)+(iii) crosses are equivalent** — both direct; cross is healthy-velocity if shared-frame is deep, content-drift if not.

The framework names **routing-mode as a load-bearing latency-and-cross-rate variable**, not a uniform substrate. Cross-resolution discipline differs by which vectors cross.

## Recovery Mechanisms

Two recovery mechanisms named (per `docs/findings.md` §E4):

### (a) Team-lead intervention at ~5+ passes (Aen 13:14 S35)

When message-overlap accumulates beyond ~3 passes within a single dyad, team-lead (or coordinator) intervenes to consolidate state. The intervention is a **fast-forward map** that names the convergence-point and routes the dyad to next work.

### (b) Dyad-side fast-forward maps at ~3+ passes (Volta 17:25 S35)

The dyad itself can produce fast-forward maps without coordinator intervention. When a dyad-member observes ~3 passes of overlap, the right move is to **consolidate state in a single read** (Volta's 17:25 fast-forward map; recipient acknowledgment "Pass-6 fast-forward map received" confirms the mechanism operates).

Both mechanisms empirically demonstrated (S35); both are valid; (a) is coordinator-mediated, (b) is dyad-internal.

## Empirical Evidence — Strongest of Any S36-S37 Candidate

n=11+ cross-in-flight instances within Aen's coordination across S36-S37:

| Vector pair | Instances | Source |
|---|---|---|
| Cal-Aen (i)-(i) | n=5+ S36 (15:15 / 15:20 / 15:29 / 15:31 + S36 close-out) + n=4+ S37 (13:10 / 13:11 / 13:13-relay / 13:17-acknowledgment) | Cal scratchpad + Aen messages |
| Aen-Herald (i)-(i) | n=6 within S36 (Herald confirmation at 15:25 — third instance is his v1.3 ship vs Aen's 15:15 greenlight crossing; further three within the pair across the session) | Aen scratchpad + Herald scratchpad |
| Cal-Aen (i)-(ii) | S37 13:11-HALT-issuance crossing Cal 13:14-Candidate-A-filed — coordinator-relay-of-PO-sanction at 13:17 crossing Cal's 13:15-disclosure | This entry's own filing history |
| Aen-cohort (ii)-(iii) | S36 15:26 Stage 2 burst — (ii)-vector arrivals 0 at Cal conversation while (iii)-vector arrivals 4/5 authors | Cal S36 scratchpad routing-mode-dependent latency observation |

**Aen explicit framing (S36 15:25)**: "three instances in one session is structurally significant; the pattern wants documenting precisely at n=3" — promotion-grade threshold met multiple times over by S37.

## Composition With Other Entries

- [`relay-to-primary-artifact-fidelity-discipline.md`](relay-to-primary-artifact-fidelity-discipline.md) — the Stage 1/Stage 2 lifecycle this entry operates within. Cadence-crossing is **content-convergence** under Stage 2 discipline; the DYAD variant catalogs when crosses are healthy-velocity vs routing-artifact.
- [`three-role-discipline-stacking-within-dispatch-arc.md`](three-role-discipline-stacking-within-dispatch-arc.md) — coordinator-vantage (Aen) asymmetry-detection-and-routing operates across the three vectors named here. The three-role entry names what the coordinator does; this entry names the routing-mode-latency asymmetries the coordinator works against.
- [`stage-2-feedback-typology.md`](stage-2-feedback-typology.md) — Stage 2 read-back occurs over the routing vectors named here. Routing-mode-dependent latency affects WHEN feedback arrives; the typology catalogs WHAT shape it takes when it arrives.
- [`stage-2-cycle-yield-narrowing-to-read-back-phase.md`](stage-2-cycle-yield-narrowing-to-read-back-phase.md) — the joint-author yield at Stage 2 read-back depends on the routing vectors; (iii)-vector reliability (n=5 unique authors S36) is what made the joint-author yield empirically observable in S36.
- [`timestamp-crossed-messages.md`](timestamp-crossed-messages.md) — the operational discipline (timestamps in every SendMessage per `common-prompt.md`) is what enables cross-detection. Without timestamps, the routing vectors blur; with them, the three-vector framework operates.

## Promotion-Posture

**Confidence medium-high** at filing — n=11+ cross-in-flight instances within Aen's coordination across S36-S37 + three-vector asymmetric-cross framework Cal+Aen co-articulated + routing-mode-dependent latency hypothesis empirically confirmed in S36 close-out.

**Promotion to confidence-high** at cross-team confirmation. Cross-team dyads (apex-research's Aen-equivalent paired with Schliemann's analog) observing the same DYAD-variant or three-vector framework distinguishes FR-discipline-culture vs framework-invariant. The routing-mode-dependent latency is structurally substrate-invariant (Aen-coordination latency vs direct-DM latency is a property of any team's coordinator-mediated routing).

**Falsifiability**:
- DYAD variant falsifies if a deeply-aligned-dyad crossed-message pair produces content-drift (NOT convergence). Single counter-instance within FR weakens the variant.
- Three-vector asymmetric-cross framework falsifies if (ii)-vector latency converges with (iii)-vector latency (or vice versa) over a session-sample; current S36 close-out showed sharp asymmetry, but the asymmetry might be temporal (Aen-bandwidth-bound) rather than structural.

## What This Is NOT

- **Not the solo-agent cross-in-flight pattern** — that's the parent `relay-to-primary-artifact-fidelity-discipline.md` Stage 1/Stage 2 mechanism. This entry is the dyad variant.
- **Not applicable to non-shared-model dyads** — the variant requires deeply-shared frame as a precondition. Without it, crossed messages produce content-drift (the original gotcha shape).
- **Not a routing-coordinator anti-pattern** — Aen's coordinator role is structurally load-bearing; (ii)-vector latency is a routing-fidelity tax, not a bug. The framework names the asymmetry; it does NOT recommend bypassing coordinator-mediation.
- **Not "all crosses are healthy"** — content-drift crosses are real (in shallow-shared-frame dyads). The DYAD variant specifies *deeply-aligned* dyad as precondition.

## Forward-Watchpoints

- **Cross-team DYAD-variant confirmation** — apex-research observing the same DYAD-variant pattern in their cross-in-flight events; promotes to confidence-high.
- **Three-vector framework falsifiability** — (ii) vs (iii) latency convergence over time may suggest structural revision.
- **Fourth routing vector candidate** — multi-hop coordinator-relay (cross-team coordinator-to-coordinator routing) is a candidate fourth vector; n=2 empirical confirmation promotes to framework extension.

(*FR:Callimachus*)
