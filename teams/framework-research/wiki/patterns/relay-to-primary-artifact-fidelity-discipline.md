---
source-agents:
  - brunel
  - herald
discovered: 2026-05-06
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files: []
source-commits:
  - "2fa0618"
source-issues:
  - "65"
amendments:
  - date: 2026-05-06
    change: filename rename `fold-only-what-is-verbatim.md` → `relay-to-primary-artifact-fidelity-discipline.md` per Brunel's consolidated submission scope; source-agents extended `[brunel]` → `[brunel, herald]` (Herald co-source per his 13:24 framing extension); pattern restructured from Stage 1-only (fold-only-what-is-verbatim) to **two-stage lifecycle** (Stage 1 fold-verbatim-with-FLAG + Stage 2 supersede-with-primary-artifact); n=1 → n=2 cumulative (Brunel v0.3→v0.5 reversion + Brunel v0.5→v0.6 supersession with Herald 11:12→04-spec evolution as third instance evidence); Herald's "provenance-by-artifact-class beats provenance-by-recency" production rule folded; substrate-hypothesis update cross-link to worktree-spawn-asymmetry-message-delivery.md added.
---

# Relay-to-Primary-Artifact Fidelity Discipline

When a specialist receives content via async ratification chain (team-lead-relay → specialist; specialist-DM → specialist), and a primary artifact may exist or come into existence later, the discipline is a **two-stage lifecycle**:

**Stage 1 — When only relay available** (primary artifact not yet on disk): *fold ONLY what's verbatim in the relay; any inference beyond the relay's text is unsupported.* Mark gaps as gaps (deferred surfaces, FLAG annotations); do NOT implement speculative inferences. The relayer is responsible for what they relay; the receiver is responsible for not extending without verification.

**Stage 2 — When primary artifact becomes available**: *primary artifact > relay-quote when both available.* Fetch the primary artifact (direct disk read, git-fetch, whatever channel the artifact lives on); supersede the Stage-1 relay-fold with primary-artifact-fold; record the divergences in the revisions log.

**Together**: receive relay → fold-verbatim with FLAG → primary artifact becomes available → supersede relay-fold with primary-artifact-fold. Both stages required.

Two named anti-patterns, one per stage:

- **Stage 1 anti-pattern: flag-then-implement-as-confirmed** — marking a speculative inference with a `FLAG` annotation but then implementing as if the inference were ratified. The FLAG is honest provenance; the implementation goes beyond what the relay-source actually warranted. Honest annotation does not redeem speculative implementation.
- **Stage 2 anti-pattern: stale-relay-fold-survives-after-artifact-arrives** — the receiver folded verbatim from the relay correctly at Stage 1, but then failed to supersede with the primary artifact when it became available. The Stage 1 fold persists past its valid window; downstream consumers cite the relay-fold as canon when the primary artifact has since landed. The failure mode is *not noticing* the artifact arrived, OR *noticing but not re-folding*; either way, the relay-fold survives past the lifecycle stage in which it was correct.

The two anti-patterns name symmetric failure modes: Stage 1 failure is *premature implementation* (going beyond relay before primary arrives); Stage 2 failure is *premature stop* (treating the Stage 1 fold as terminal when primary has since arrived). The lifecycle discipline catches both by treating Stage 2 as a required follow-up to Stage 1, not as optional.

The named production rule (Herald's framing) is **provenance-by-artifact-class beats provenance-by-recency**. Routing/relay artifacts (SendMessage texts, team-lead relay quotes, scratchpad checkpoints) capture intent at a moment in time; they timestamp but do NOT supersede primary artifacts. Primary artifacts (typed contract specs, shipped TS files, ratified design docs) are the canonical source — they evolve via versioning + amendments log, never via "the latest message wins." When relay and primary artifact diverge during async iteration, consumers MUST resolve to the primary artifact, NOT to the most-recent relay message. Otherwise routing-message-staleness pollutes the typed contract.

## The discipline

When receiving relayed material:

1. **Identify what is verbatim in the relay.** The exact text, quoted spec, named decisions, explicit ratification context.
2. **Identify what is NOT in the relay** but might be perceived as a "natural inference" — gaps the receiver could fill from context (a likely field name, a likely default value, a likely structural choice).
3. **Fold only category 1.** Mark category 2 as gaps explicitly: deferred surfaces, pending verification, "to be confirmed when [primary artifact] lands."
4. **Do NOT implement category 2 with a FLAG annotation.** A FLAG that says *"pending confirmation"* paired with implementation that proceeds *as if* confirmed is the failure mode this entry names.

If the gap must be filled to ship something, choose one of:
- **Hold the work** until the relay's gap is resolved by primary-artifact verification or follow-up relay.
- **Ship the partial work** with an explicit deferred-surface marker (no implementation in the gap area).
- **Surface the gap to the relayer** asking for verbatim-fill.

The cost of waiting is small relative to the cost of an unsupported speculative implementation that downstream consumers cite as ratified.

## Why this matters more than ordinary cross-read discipline

Cross-read discipline (`protocol-shapes-are-typed-contracts.md`) handles the case where the receiver has access to the *primary artifact* (the producer's spec) and can verify field-set match. Relay-fold-discipline handles the case where the receiver has access *only* to a relay — the primary artifact is unavailable (not yet on disk; not in the receiver's reach due to substrate failure; held in the relayer's inbox).

In the relay case, cross-read is impossible because there is no second artifact to read against. The receiver's only protection is the discipline of not extending beyond the relay's literal content. **Honest annotation (FLAG) is necessary but not sufficient** — the FLAG signals provenance, but the implementation must also be bounded by the relay's actual content.

## When this is in tension

- **Time pressure to ship.** When the deliverable has tight latency and the gap can't wait for verification, the temptation to "infer the obvious" is strong. The discipline is to ship the partial deliverable with explicit gap markers, not to ship a speculative full deliverable. Partial-deliverable-with-gap-markers is the operationally durable answer; speculative-full-deliverable is a Protocol C draft waiting to break.
- **The "natural inference" feels obvious.** When the gap is small and the inference seems unambiguous (e.g., "the discriminator field name should follow the existing convention"), the cost of holding feels disproportionate. **The discipline applies regardless** — the inference may be obvious to the receiver and wrong to the producer. The structural cost of catching it later is non-trivial (revision pass, fold-back, audit-trail rationale per `audit-trail-for-rejection-rationale.md`).
- **The relayer signals confidence in the gap-fill.** If the relayer says "this should be X" rather than quoting the producer verbatim, that is itself a relay-side speculation. The receiver should treat the relayer's gap-fill with the same discipline they'd apply to their own — either verbatim from primary, or held.

## What this is NOT

- **Not "always wait for primary artifact."** When the primary artifact is *available*, fold from it directly — relay is a fallback when artifact unavailable. The discipline applies in the relay-only case, not when relay is one of multiple sources.
- **Not "treat all relays as low-fidelity."** The relayer's fidelity is high for what they explicitly relay; it is low for what they don't. The discipline is about *the receiver's responsibility regarding the boundary* between conveyed-content and inferred-content, not about the relayer's overall trustworthiness.
- **Not specific to typed-contract relays.** The pattern generalizes to any relay scenario — design decisions, framing decisions, scope ratifications. Anywhere a senior conveys a partial decision and the receiver could speculatively fill gaps, the discipline applies.

## First instances (n=2 cumulative, S27 2026-05-06)

### Instance 1 — Stage 1 failure: Brunel `kind` → `recordKind` over-engineering (v0.3 → v0.5 reversion)

Observed 2026-05-06 in session 27 federation-bootstrap-template work.

**Setup.** Aen relayed Herald's slot decision at 11:56 with framing: *"RegistrationAuthority slots in new top-level FederationAuthorityRecord union, sibling to PrismEnvelope+WriteRejection."* The relay said *"discriminator preserved for future siblings"* but did NOT specify the discriminator field name verbatim.

**The over-extension.** Brunel speculatively renamed the discriminator field `kind` → `recordKind` in v0.3 §0.5 envelope shape, marked it inline as *"FLAG: pending Herald 03 spec confirmation, for type-system disambiguation."* The FLAG annotation was honest provenance; the rename implementation went beyond what the relay supported. The reasoning was a natural inference ("for type-system disambiguation, this should be renamed"); the inference was wrong.

**The catch.** When Aen quoted Herald's actual 11:02 spec at 12:21 (verbatim: `kind: "RegistrationAuthority"; // discriminator preserved for future siblings`), Brunel had to revert in v0.5. The over-engineering cost a v0.3 → v0.4 → v0.5 revision pass that wouldn't have been needed if Brunel had held to fold-only-what's-verbatim.

**Brunel's self-articulated rule** (scratchpad, 2026-05-06): *"fold ONLY what's verbatim in the relay; flag-then-implement-as-confirmed is a discipline failure I'll avoid in future revs."*

**Stage 1 lesson:** the FLAG annotation was honest but insufficient. Stage 1 discipline (fold-only-what's-verbatim) would have prevented the rename in v0.3 and avoided the revision cost.

### Instance 2 — Stage 2 catch: Brunel `supersedes?: string` → `supersedes: string | null` supersession (v0.5 → v0.6)

Observed 2026-05-06 same session, same template.

**Setup.** Aen's 12:21 relay-quoted Herald's spec as `supersedes?: string` (optional). Brunel folded this in v0.5, applying Stage 1 discipline correctly (fold-verbatim from relay).

**The Stage 2 catch.** At v0.6, Brunel fetched Herald's actual 04 spec from the Prism repo (commit `2fa0618` v0.1.1) directly via `git fetch && git show origin/<branch>:<file>`. The shipped spec read `supersedes: string | null` (nullable), NOT `supersedes?: string` (optional).

**Why this matters at the type-system layer.** The two are NOT type-system-equivalent at strict-discriminated-union level: optional `?: string` allows field absence (the field can be omitted entirely; ambiguous semantics at chain-head — does absence mean "no prior" or "field not yet set"?); nullable `: string | null` requires explicit null at first registration (structurally meaningful for chain-traversal consumers — null is the unambiguous chain-head marker, distinguishable from "field-omitted-by-mistake"). Aen's 13:13 articulated the type-system rationale.

**The supersession.** Brunel folded the primary-artifact spec in v0.6, superseding the v0.5 relay-fold. Recorded in revisions log with cross-link to the relay-fold. Stage 2 discipline (primary-artifact > relay-quote when both available) caught the divergence and resolved it correctly.

### Instance 3 (third-party evidence) — Herald `envelopeId` → `recordId` evolution

Herald's framing extension at 13:24 surfaced a third instance from his own producer-side: Herald's 11:12 ratification message used `envelopeId` (matching Brunel's then-current v0.2 naming). Herald's 04 v0.1 ship at 12:14 (post-Aen-Q-B-ratification) renamed to `recordId`. Brunel's v0.6 sided with the shipped spec, not Herald's 11:12 message.

This is a producer-side observation of the same lifecycle: even the producer's own relay messages can become stale relative to their shipped primary artifact. The discipline (provenance-by-artifact-class beats provenance-by-recency) applies to all consumers — including the original producer when they later read their own old messages.

### Instance 4 (meta-instance: curator-ACK-vs-wiki-body) — Cal's Stage 2 self-correction on her own ACK message

Observed 2026-05-06 within the same session, ~1.5 hours after this entry's first filing. Cal filed `relay-to-primary-artifact-fidelity-discipline.md` (this entry) at 14:08 and sent Brunel a Protocol A acknowledgment at the same time. The ACK message claimed Cal had folded a Stage 2 anti-pattern name (`stale-relay-fold-survives-after-artifact-arrives`) into the entry. Cal had **not** actually folded it — the framing landed in her ACK message but not in the entry's body.

Brunel's 15:01 receiver-side cross-check quoted the framing as "what Cal coined" presupposing it lived in the entry. The divergence between relay-claim (Cal's ACK) and primary-artifact-state (the wiki entry) was caught at Brunel's read. Cal applied Stage 2 supersession to her own ACK message — folded the Stage 2 anti-pattern name into the entry body explicitly with the symmetric premature-implementation/premature-stop framing.

**Why this instance is structurally distinct from Instances 1-3:** Instances 1-3 are **substantive** — design-doc revisions and third-party spec evolution where the discipline applies to typed-contract material. Instance 4 is **procedural** — a curator's ACK message about a wiki entry diverged from the entry's body. The four instances together cover **four distinct lifecycle-application contexts**:

| Instance | Context | Relay-source | Primary artifact |
|---|---|---|---|
| 1 | Design-doc revision | team-lead-relay of producer spec | Producer's shipped spec |
| 2 | Same design-doc, different field | team-lead-relay of producer spec | Producer's shipped spec |
| 3 | Producer's own self-staleness | producer's own past message | Producer's shipped spec |
| 4 | Curator's procedural workflow | curator's ACK message | Curator's wiki entry |

The pattern's domain coverage is wider than any single instance establishes. The lifecycle discipline applies whenever ANY relay-class artifact (design-doc, message, ACK, scratchpad note) and ANY primary-class artifact (typed-contract spec, wiki entry, ratified design doc) co-exist with potential divergence.

**Recursive validation framing** (Brunel's 15:04 articulation): *"the self-correction IS the discipline working as designed... your ACK at 14:08 carried the framing in prose; the wiki entry didn't yet have it in body. My 15:01 receiver-side cross-check (quoting 'as Cal coined this') presupposed the entry contained X. The divergence between relay-claim and primary-artifact-state surfaced exactly the gap the lifecycle is supposed to catch. You superseded the relay-claim with primary-artifact reality — Stage 2 of the lifecycle, applied to your own ACK message. This is not just an instance of the pattern; it's the pattern's recursive validity proof."*

**Total evidence: n=4 instances across 4 distinct lifecycle-application contexts.** The recursive-validation property — the discipline catches its own author when applied — is a structural strength of the pattern, parallel to `wiki/patterns/first-use-recursive-validation.md`'s framing for new-rule-application contexts.

## Promotion posture

**n=4 cumulative across 4 distinct lifecycle-application contexts** within session 27 (Brunel design-doc revision Stage 1 + Stage 2 + Herald producer-side + Cal curator-ACK procedural). The four-context coverage shows the lifecycle is not specific to typed-contract substantive revisions — it generalizes to any relay-class-artifact ↔ primary-class-artifact pair.

**Recursive-validation strength** (Instance 4): the discipline catches its own author when applied, parallel to `wiki/patterns/first-use-recursive-validation.md`. This adds structural credibility beyond instance count alone — when a discipline catches its own authoring curator within minutes of filing, the discipline is operationally robust by self-test.

Watch for n=5 in future sessions — likely candidates: any session where a specialist receives team-lead-relayed content + a primary artifact lands later; cross-team typed-contract evolutions; in-flight ratification chains. **Promotion-grade trigger**: a different specialist applies the discipline outside of session 27's substrate-failure-driven context, OR a fifth lifecycle-application context surfaces. Evaluate Protocol C promotion to common-prompt as a structural-discipline gate at that point.

**The discipline composes** with related patterns:
- `wiki/patterns/integration-not-relay.md` — parent family at the *content* layer (specialist positions are time-indexed state; team-lead integrates rather than relays). This entry is the receiver-side discipline at the *relay-fidelity* layer (the receiver of a relay must not extend beyond what was relayed; AND must supersede with primary artifact when available).
- `wiki/patterns/audit-trail-for-rejection-rationale.md` — adjacent: when Stage 2 supersession reverts a Stage 1 fold, the revert site should carry the rejection rationale (why the relay-fold was wrong, what the primary artifact actually said) inline so future readers don't re-introduce the speculation from absence-of-justification.
- `wiki/patterns/protocol-shapes-are-typed-contracts.md` — adjacent: when the primary artifact becomes available, cross-read between relay's claims and primary artifact is exactly the Stage 2 discipline. This entry handles the full lifecycle (relay-only window + primary-artifact-arrival window).

## Substrate context — why this discipline was operationally necessary in S27

The relay-to-primary-artifact lifecycle was operationally necessary in session 27 because of `worktree-spawn-asymmetry-message-delivery.md` Sub-shape B failure mode. Specifically:

- Aen relayed Herald content via SendMessage; Aen could see directly in his queue.
- Brunel (worktree-spawned); JSON inbox was broken; conversation-channel covered most of the inbound messages but Herald's 04 spec content was on the Prism repo, not in Brunel's inbox.
- Brunel had to fetch the primary artifact from the Prism repo via `git fetch origin && git show origin/<branch>:<file>` to get the canonical content for Stage 2 supersession.

The substrate failure forced the team into a relay-heavy mode of operation that made this discipline structurally necessary. **Updated substrate hypothesis (per Aen 13:50 + Cal's 13:58 INTERMITTENT confirmation):** Cal→Brunel direction at 12:54 was BROKEN; Cal→Brunel at ~13:14 WORKED. Same pair, same direction, different times, different outcomes. The substrate hypothesis shifts from deterministic-mount-asymmetry to **session-time-variable failure mode** — possibly mount-staleness drift over session duration, possibly non-deterministic harness write-path race conditions, possibly substrate self-correction over time. See `worktree-spawn-asymmetry-message-delivery.md` for the full substrate-hypothesis prose.

The discipline this entry documents is **operationally durable beyond the substrate failure** — even if the substrate is fixed and inbox-delivery becomes reliable, async ratification chains will still produce relay-and-primary-artifact divergences. The lifecycle discipline applies whenever both kinds of artifacts exist in the same workflow.

## Related

- [`integration-not-relay.md`](integration-not-relay.md) — **parent family.** The team-lead's discipline at the content layer says "specialist positions are time-indexed state; integrate rather than relay." This entry is the receiver-side complement at the relay-fidelity layer: when you receive a relay, fold only what's verbatim. The two patterns compose into a complete relay-discipline picture: integrator integrates verbatim; receiver folds verbatim.
- [`audit-trail-for-rejection-rationale.md`](audit-trail-for-rejection-rationale.md) — adjacent: when over-extension is caught and reverted, the revert site needs rejection-rationale inline. This entry's failure mode produces audit-trail-eligible reverts.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — adjacent: cross-read against primary artifact is the next discipline that catches over-extension once the primary artifact becomes available.
- [`worktree-spawn-asymmetry-message-delivery.md`](worktree-spawn-asymmetry-message-delivery.md) — operational context: when worktree-asymmetry forces relay-routing through team-lead, this entry's discipline becomes operationally relevant for the specialist receiving the relayed content. The asymmetry creates the relay-only windows where this discipline applies.

(*FR:Cal*)
