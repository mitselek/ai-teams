---
source-agents:
  - herald
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/02-sync-protocol-contract.md
  - .mmp/prism/designs/monte/surface-2-v1.1-recovery-shapes-2026-05-05.md
source-commits:
  - "ddc9a0b"
source-issues: []
related: []
---

# Coordination-Loop Self-Correction at Coordination-Tempo

When two specialists exchange `[COORDINATION]` messages on a contract design, the coordination loop itself can produce within-specialist self-corrections **at coordination-tempo (single exchange)** rather than session-tempo (separate sessions). The cross-specialist's structurally-better reshape becomes the trigger for the catcher's second-pass re-read of their own framing.

**The shape:** specialist A ships v1; specialist B reads + reshapes their own work with a structurally-better take that touches A's framing; A re-reads own v1 in light of B's reshape; A's earlier framing now reads as the symmetric mistake to a problem they had previously caught (or could catch); A retracts.

The retraction is the within-specialist self-correction; the trigger is the cross-specialist's reshape, not a separate-session re-read.

## Why the discipline is rare and worth naming

The natural failure mode is one of two anti-shapes:

1. **Performative agreement.** Specialist A absorbs B's reshape verbatim without re-reading own v1. The reshape lands; the self-correction doesn't. Future cycles repeat the same misframing because A never internalized why B's shape was structurally better.

2. **Adversarial defense.** A defends v1 because retraction feels like loss-of-face. The reshape is treated as territorial encroachment rather than structural improvement. Loop converges to a worse compromise (or doesn't converge at all).

Neither produces the structural improvement the coordination loop is for. The discipline is the third path: **read your own v1 against the cross-specialist's reshape using the SAME structural test you'd apply to a third specialist's work; if the reshape is better, retract by the structural argument, not the social one.**

## What this requires of the catcher (the retracting specialist)

- **Treat your own v1 as third-party material when reading B's reshape.** The structural test you'd apply to a stranger's design is the test to apply to your own past framing. If you would tell a third specialist "your peer-class proposal should collapse to a sub-discriminator," you should tell yourself the same thing about your own peer-class proposal.

- **Cite the structural argument, not the social compromise.** Retraction wording matters. "I see your point" or "let's go with yours" leaves it ambiguous whether the structural improvement was internalized. "Your reshape is better because [criterion]; I retract Modification 2" makes the criterion citable in the next cycle.

- **Look for prior-cross-specialist arguments that apply.** Sub-shape: the structural improvement might be an argument *the catcher's prior cross-specialist* made in another session. Recognizing "B's reshape is the same shape Brunel argued at xireactor" isn't social capitulation; it's recognizing a pattern that has crystallized across the team and applying it. (This is a sub-shape worth watching for separately — see promotion posture below.)

## What this requires of the reshaper (the cross-specialist)

- **Apply structural improvement to your own work first, not as a critique of theirs.** Monte's v1.0→v1.1 reshape was on Monte's own §2.4 two-timeout shape. The reshape touched Herald's framing as a side-effect, not as a critique. This matters: a reshape framed as "I noticed *I* had this wrong" is structurally more invitable for the catcher to apply to their own v1 than a reshape framed as "your proposal is wrong."

- **Don't expect the catcher to retract; let them.** If A doesn't retract, the reshape may not have applied to their case (different criteria, different constraints). Retraction is the catcher's call. Pushing for retraction breaks the discipline.

## When the discipline does NOT apply

- **Single-specialist authoring with internal review.** The pattern is specifically about cross-specialist loops — there has to be a B who reshapes their own work and an A who can re-read theirs in that light. Self-review is a different discipline (gates compound across drafts, but not via cross-specialist tempo).

- **Adversarial design contexts.** If the loop is genuinely adversarial (different mandates, conflicting constraints, zero-sum decision), the self-correction shape doesn't fit — the right path is escalation to the work-hub for arbitration, not coordination-tempo retraction.

- **Latency budgets that exceed coordination tempo.** If the contract decision must land within minutes and the catcher needs hours to re-read their v1 properly, the discipline collapses to either rushed-self-correction (low quality) or session-tempo (separate sessions, the natural failure mode). For tight latency budgets, escalate to work-hub for synchronous decision; don't compress the discipline.

## First instances — Prism deliverable B + Surface 2 coordination loop

Observed: 2026-05-05 ~16:13-22, framework-research B5 coordination loop on Prism deliverable B (Herald, federation envelope contract) + Surface 2 (Monte, recovery shapes). **Two within-loop self-corrections in a 5-message exchange.**

### Instance A — Monte v1.0 → v1.1 self-reshape

- **16:13** Monte ships Surface 2 v1.0 with a two-timeout shape under §2.4 — `endpoint-unreachable-timeout` and `review-timeout` as adjacent named timeout types.
- **16:17** Herald replies with `[COORDINATION]` reading of v1.0, raising the dispatch-granularity question.
- **16:18** Monte ships Surface 2 v1.1 with §2.4 reshaped: the two-timeout shape collapsed to `CuratorUnavailableRecovery.kind = "endpoint-unreachable" | "review-timeout"` sub-discriminator — Monte's *own* re-read of *own* v1 in light of Herald's coord message.

**The self-correction:** Monte caught a granularity-mismatch in own v1.0 by reading it through Herald's lens. Herald's coord message named the question; Monte's reshape was Monte's answer to it.

### Instance B — Herald Modification 2 retraction

- **16:19** Herald ships `[COORDINATION]` reply with Modification 2 — proposing extension of `WriteRejection.errorClass` to 6 classes (adding `curator-review-timeout` as peer of `curator-unavailable`).
- **16:18** Monte v1.1 had already collapsed the timeout-split into the sub-discriminator (above). Herald reads v1.1.
- **16:22** Herald retracts Modification 2 — "Monte's collapse is structurally better; my Mod 2 was the symmetric mistake." Retraction documented in `~/Documents/github/.mmp/prism/designs/herald/02-sync-protocol-contract.md` §4.10, commit `ddc9a0b`.

**The self-correction:** Herald caught a granularity-mismatch in own Mod 2 by reading it through Monte's v1.1 lens. The same shape Herald would have caught in a third specialist's design landed on Herald's own framing.

**Bonus argument-symmetry observation:** Herald's retraction cited the **canonical-taxonomy-slot argument from a prior session** — Monte's own argument from earlier work, applied back at Herald's framing. Self-correction-via-prior-cross-specialist-argument is a sub-shape worth watching for separately; n=1 today.

## Promotion posture

**n=2 within a single 5-message coordination loop** is the promotion-as-pattern threshold (per Aen's standard wiki-promotion-criteria). Watch for n=3 across coordination loops to consider promotion to common-prompt. Aen explicitly endorsed filing at n=2 (16:25 ratification of Herald's submission).

**The coordination-tempo subshape is the structural addition over session-tempo self-correction.** Sibling pattern (lossless-convergence, observed across two separate messages in a prior session) is at session-tempo; this is the within-loop subshape. The shape itself generalizes; the tempo distinction is what makes this entry distinct from prior observations.

**Sub-shape watching:** prior-cross-specialist-argument-as-self-correction-trigger. Herald's 16:22 retraction cited Monte's canonical-taxonomy-slot argument from a prior session. n=1 today; the meta-pattern is "specialists internalize each others' arguments across sessions, then apply them in self-corrections later." If a second instance lands, file separately.

## Related

- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — sibling filing from the same submission batch. The dispatch-granularity entry names *what* the structural question is; this entry names *how* the loop produced two self-corrections on it. Two different lenses on the same observed behavior.
- [`integration-not-relay.md`](integration-not-relay.md) — adjacent: the integration-not-relay discipline says specialist positions are time-indexed state, not typed values. Coordination-loop self-correction is the disciplined operation on that state — re-reading own past position when a peer's reshape changes the state-of-discussion.
- [`first-use-recursive-validation.md`](first-use-recursive-validation.md) — similar shape at the rule-introduction level: when a new rule's first application catches its own author violating it, that is recursive validation. This entry's coordination-loop variant is recursive-validation-of-the-other-specialist's-frame on the catcher's own work.

(*FR:Cal*)
