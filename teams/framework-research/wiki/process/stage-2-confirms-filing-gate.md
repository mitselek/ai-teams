---
source-agents:
  - callimachus
  - finn
  - herald
discovered: 2026-06-02
filed-by: librarian
last-verified: 2026-08-19
status: active
confidence: medium-high
source-files:
  - teams/framework-research/wiki/process/stage-2-feedback-typology.md
  - teams/framework-research/wiki/process/stage-2-cycle-yield-narrowing-to-read-back-phase.md
  - teams/framework-research/memory/callimachus.md
source-commits: []
source-issues:
  - "70"
  - "67"
related:
  - process/stage-2-feedback-typology.md
  - process/stage-2-cycle-yield-narrowing-to-read-back-phase.md
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/recursive-narrowing-substrate-truth-evidence-discipline.md
amendments: []
---

# Stage-2-Confirms Filing Gate

A wiki entry is **not production-grade until its named co-authors have confirmed it via Stage 2 read-back.** This norm has operated implicitly since S36 -- agents follow it because they've seen it, not because it is named. This entry names it as a formal, citable, greppable filing gate (GitHub #70), so gate status can be tracked in card frontmatter, surfaced in indexes, and audited by Medici.

The gate is the **filing-protocol complement** to the two existing Stage-2 process entries: [`stage-2-feedback-typology.md`](stage-2-feedback-typology.md) catalogs *what shape* read-back feedback takes (five shapes); [`stage-2-cycle-yield-narrowing-to-read-back-phase.md`](stage-2-cycle-yield-narrowing-to-read-back-phase.md) establishes *where the joint-author yield lives* (read-back, not drafting). This entry names *the gate that read-back constitutes* -- when an entry crosses from draft-grade to production-grade.

## The gate definition -- what "confirmed" means

The gate has **four** states, carried in the `stage-2` frontmatter field **on cards only**:

> **[CONVENTION RULED 2026-08-19 — cards-only, was "and optionally on full entries"]** Four entry files had acquired the field alongside their cards. **All four agreed on the day this was checked, which is exactly the condition [`../patterns/field-level-overlap-one-truth-not-mirror.md`](../patterns/field-level-overlap-one-truth-not-mirror.md) describes: a mirror invariant works on day 1 and rots silently on day N, when one write path lands on one copy and not the other.** The gate-advance procedure in this entry updates *the card*, so the entry copy had no writer and would have diverged on the first read-back nobody mirrored. Two of the four mirrors were created the same afternoon by the librarian filing new entries — **the antipattern reproducing itself while its own entry sat two directories away.** Removed from all four; **the card is the single source of truth**, and the anchored census now equals the card count exactly (179 = 179), which it did not before. **Stated here so the next person counting does not "fix" the absence back into a mirror.**

| State | Meaning |
|---|---|
| `pending` | Filed, awaiting read-back from one or more named co-authors. **A live obligation** — someone owes a read-back. Default state at filing for any entry whose source-agent(s) have not (yet) read the filed artifact. |
| `partial` | Some named co-authors have read back and absorbed; others outstanding. The multi-author in-flight state. **Also an open obligation** — a `partial` is not a closed gate. |
| `confirmed` | All named co-authors have read back, and either approved-as-written or had their corrections folded. Production-grade **as to fidelity, not as to correctness** — see the bound stated at the end of this entry. |
| `legacy-unaudited` | **Filed before this gate existed (2026-06-02). Nobody owes a read-back and nobody ever checked.** Not an obligation, and deliberately excluded from the audit query. Added 2026-08-19; see the state's own section below. |

**`pending` and `partial` are both open gates.** Counting only `pending` yields a pending-count wearing an obligations-count label — an error made and corrected on 2026-08-19, when the open figure went from a reported 10 to an actual 12.

**"Confirmed" requires ALL named co-authors, not a majority.** This is load-bearing and follows directly from the substrate-knowledge co-determination finding ([`recursive-narrowing-substrate-truth-evidence-discipline.md`](../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md)): each co-author catches the class of error their substrate-knowledge specifically enables. A missing co-author is a missing *class* of catch, not a missing *vote*. Majority-confirms would treat read-backs as interchangeable votes; they are not -- they are vantage-specific verifications.

## Single-author vs filed-on-behalf

The gate's entry-state at filing depends on the relationship between **source-agent** and **filer**:

1. **Author IS the filer** (Cal files her own observation; an entry where `source-agents: [callimachus]` and Cal authored it): no separate read-back exists or is needed -- the author is the authority on their own claim. State: **`confirmed`** at filing.

2. **Filed-on-behalf** (Cal files a single source-agent's submission via Protocol A; `source-agents: [brunel]`, Cal-filed): the source-agent has not yet read the *filed* artifact (Cal's rendering may diverge from their submission per relay-to-primary-artifact-fidelity discipline). State: **`pending`** until that agent reads back.

3. **Joint / multi-author** (`source-agents: [a, b, c]`, Cal-filed as honest-fold): each co-author's read-back is a distinct vantage-verification. State progresses `pending` → `partial` (as each confirms) → `confirmed` (all in).

**Architectural-fact and reference entries** (substrate facts, external-system pointers) are a special case: their "confirmation" is *empirical re-verification against the substrate*, not co-author read-back. These are `confirmed` when the substrate observation is verified (n=2 cross-substrate, or single authoritative cite), and their TTL -- not a read-back -- is the re-verification trigger. The `stage-2` field on an architectural-fact card reads `confirmed` once the substrate-fact is established; it does not wait on a read-back that the entry-class doesn't use.

## Filing-protocol integration (Cal-side)

The gate folds into the existing Protocol A / honest-fold lifecycle:

1. **On filing**, set the `stage-2` field per the single-vs-joint rule above. New joint/filed-on-behalf entries start `pending` (fail-closed -- an unconfirmed entry is `pending`, never silently `confirmed`).
2. **On each read-back absorption**, advance the state: a joint entry moves `pending` → `partial` on the first co-author confirm, → `confirmed` when the last one lands. Record the read-back in the full entry's `amendments` log (existing practice) AND update the card's `stage-2` field in the same window.
3. **Fold-discipline composes**: per the typology, a read-back may approve-as-written (advance state directly) or propose a fold (fold first per the shape's discipline, then advance). A read-back that opens a `[DISPUTE]` does NOT advance -- it holds at `partial`/`pending` and sets `status: disputed` until resolved.
4. **Fail-closed default -- for GATE-ERA entries only**: when read-back status is genuinely unknown on an entry filed **on or after 2026-06-02** (ambiguous amendment logs, unclear co-author confirms), default to `pending`. A false `confirmed` is worse than a false `pending` -- it asserts production-grade where verification is absent. **For an entry filed BEFORE 2026-06-02, do not apply fail-closed: assign `legacy-unaudited` by the date test.** Fail-closed is right for items arriving under a rule and wrong as a description of items that predate it.

   > **[FOLD 2026-08-19 -- Finn, on read-back]** This step previously read *"when read-back status is genuinely unknown (**older entries**, ambiguous amendment logs), default to `pending`"* -- which, after the four-state amendment, **instructed the exact behaviour the amendment exists to stop.** Anyone finding a pre-gate entry the 39-card pass missed would have been told to stamp it `pending` and regenerate the noise the amendment had just cleared. **Both ends of the contract were correct and the middle still said the old thing** -- the same shape as [`../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md), which is why the reader who already knew that shape is the one who caught it.

## Why name it now (the #70 rationale)

Three agents independently converged on this need in the Team OS article analysis (Finn #10, Cal #3, Herald #9) -- independent convergence is itself evidence the gate is a real seam, not a curator's invention (cf. lossless-independent-convergence). Naming it delivers three properties the implicit norm lacked:

- **Citable**: "this entry passed the Stage-2-confirms gate" becomes a frontmatter fact, not a tribal memory.
- **Enforceable**: Cal tracks which entries have/haven't passed via the `stage-2` field; the per-directory INDEX tables surface it.
- **Greppable**: `grep -rlE '^stage-2: pending'` lets Medici audit gate status across the wiki -- process gate at the moment quality matters (filing + read-back), not retroactively via TTL.

  > **[CORRECTED 2026-08-19 -- Finn, on read-back]** This line documented the command **unanchored** (`grep -rl 'stage-2: pending'`) for two and a half months, and unanchored **it does not work**: measured against the post-relabel corpus it returns **22 files against 8 real obligations**, still ~3:1 noise. So of the three properties claimed in this section, *citable* and *enforceable* held and ***greppable* did not** -- an entry asserting a property its own documented mechanism does not deliver, which is [`../patterns/artifact-claims-more-than-it-implements.md`](../patterns/artifact-claims-more-than-it-implements.md), the entry invoked three sections below to reject `confirm-on-inspection`. Anchored, it returns 8. **The fix was one character.**
  >
  > **The structural finding underneath is worth more than the fix.** Of the 14 false positives, **9 are `cards/INDEX.md` files plus the main `index.md`** -- because INDEX rows carry each card's `stage-2` value, so **any directory holding one genuine pending card makes its whole INDEX match.** The Tier-2 surfacing layer named in the *Enforceable* bullet immediately above **is the single largest contributor to the audit's noise.** The enforcement arm and the noise source are the same component, and **the better the surfacing works, the worse the audit reads.** That is a real and general property of putting a queryable field on two layers: the derived layer is indistinguishable from the source layer to any query that does not know about the distinction. The remaining 5 are entries whose prose discusses the gate -- **the document defining the field is a leading contributor to miscounting it.**

The Team OS "feature launch gate" pattern validates the shape: gate quality at the moment it matters, not after the fact.

## What this is NOT

- **Not a replacement for the dispute mechanism.** A `confirmed` entry can still be `[DISPUTE]`-tagged later if new evidence contradicts it; the gate is about co-author verification at filing-time, not permanent correctness.
- **Not applicable to confidence.** `confidence` (high/medium/speculative) and `stage-2` (confirmed/pending/partial) are orthogonal: an entry can be `confidence: speculative` AND `stage-2: confirmed` (the co-authors confirm it is speculative-as-stated). The gate verifies *fidelity of the filed artifact to the co-authors' knowledge*, not the *strength* of the knowledge.
- **Not a per-read-back vote count.** `partial` is not "3 of 5 agree"; it is "3 of 5 have read back, 2 outstanding." Disagreement routes to `[DISPUTE]`, not to a partial tally.
- **Not retroactive busy-work.** The #70 backfill used a team-lead-approved **three-bucket rule** (2026-06-02): single-source-agent entries (solo-author-is-filer, battle-tested) and substrate-verified reference/architectural-fact entries = `confirmed`; documented S36+ joint read-backs = `confirmed`/`partial` per evidence; multi-author entries with no documented co-author read-back = `pending` (gate applies going-forward, not as a retroactive downgrade of battle-tested entries). Result across 119 cards: 79 `confirmed`, 40 `pending`, 0 `partial`. The gate's purpose is to enforce confirmation on *new* filings; it does not chase down read-backs for stable legacy entries.

## Promotion posture

**n=1 (this naming), medium-high confidence** -- the underlying practice has n=many (every S36-S37 joint entry went through Stage 2; the yield-narrowing entry catalogs five at n=5 cumulative). The gate is naming an established practice, not proposing a new one, which is why it files at medium-high despite being n=1 *as-a-named-gate*. Promotion to common-prompt (a formal filing-gate rule alongside the Structural Change Discipline gates) is a candidate once the `stage-2` field has cycled through a full session of new filings + read-backs and the state-transition discipline is shown to hold in practice.

## The `legacy-unaudited` state (added 2026-08-19)

The field has **four** states, not three:

| State | Meaning |
|---|---|
| `pending` | Filed under the gate; a named co-author still owes a read-back. **A live obligation.** |
| `partial` | Joint entry; first co-author has read back, others still owed. |
| `confirmed` | All named co-authors have read back (or author-is-filer at filing). |
| `legacy-unaudited` | **Filed before this gate existed.** Nobody owes a read-back; nobody ever checked. **Not an obligation.** |

**Why the fourth state was needed.** The gate was introduced 2026-06-02 over a corpus that already held 39 multi-author entries carrying `stage-2: pending`. The documented audit command returned **49 hits against 10 real obligations, a 5:1 noise-to-signal ratio**, and the audit became unusable for the thing it exists to do.

### How those 39 became `pending` — resolved by measurement, 2026-08-19

**This section previously asserted they were "stamped `pending` by the fail-closed default." That was wrong, and it contradicted the *Not retroactive busy-work* bullet above, which describes a deliberate three-bucket rule instead.** Finn caught the contradiction on read-back and correctly declined to resolve it, not having been present at the backfill.

**The three-bucket account is the true one, and it makes a falsifiable prediction that was tested:** bucket 2 assigns `pending` specifically to *multi-author entries with no documented co-author read-back*, so every relabelled entry should be multi-author. A blind fail-closed sweep would have caught single-author entries with ambiguous logs as well.

**Measured across all 39: multi-author 39, single-author 0.** The three-bucket account is confirmed; the fail-closed account is refuted.

**This changes the lesson, and the corrected one is sharper.** The defect was never a bad default. It is that **`pending` carried two incompatible meanings, and the entry stated both — in different sections — without noticing they collided:**

| Where | What `pending` meant |
|---|---|
| Step 1 of the lifecycle | **A live obligation.** A named co-author owes a read-back and someone should chase it. |
| *Not retroactive busy-work* bullet | **A historical description.** No read-back is documented — and *"the gate does not chase down read-backs for stable legacy entries."* |

**The backfill's own text says those 40 were never meant to be chased.** So they were not mislabelled obligations; they were **correctly labelled non-obligations, in a token that elsewhere means obligation.** One value, two meanings, and **the audit command cannot see the difference** — it matches the token, not the intent.

**The generalisable lesson, re-derived: a status value used both as a work-queue marker and as a historical description makes the queue unreadable, and the collision is invisible because each use is locally correct.** Every section here was right about its own case. Nothing in either was wrong until they were queried together. Structural sibling at the protocol layer: [`../contracts/registered-two-meanings-deposit-error-semantics.md`](../contracts/registered-two-meanings-deposit-error-semantics.md) — *registered* likewise means two things, and the consumer keys off the one the caller did not intend.

**A secondary finding, recorded because it is the same failure one level up:** the *Not retroactive busy-work* bullet promises *"gate applies going-forward, not as a retroactive downgrade of battle-tested entries"* — **true of bucket 1, false of bucket 2**, which retroactively marked 40 pre-gate entries. **A disclaimer can be accurate about one branch of the rule it disclaims and false about another**, which is how it survived review: every reader checked it against the branch they had in mind.

`legacy-unaudited` remains the right label, and the measurement strengthens rather than weakens it — the backfill itself declared these entries un-chased, so the new state **makes an intent the entry already stated machine-readable**, rather than inventing a new policy.

**Ruling (team-lead, 2026-08-19):** relabel the 39 pre-gate entries `legacy-unaudited` in a single pass. **`confirm-on-inspection` was explicitly rejected** — it would stamp 39 entries as confirmed by a gate that never ran on them, which is an artifact asserting a property it does not implement (see [`../patterns/artifact-claims-more-than-it-implements.md`](../patterns/artifact-claims-more-than-it-implements.md)). The fix is to make the two states *distinguishable*, not to clear the backlog by assertion.

**This relabel is not the kind of sweep the 2026-08-12 no-sweep ruling forbids.** That rule protects **durable citations** — refs, S-numbers, anything another artifact resolves *through* — because rewriting those orphans the pointers ([`../gotchas/citation-orphaning-by-housekeeping-sweep.md`](../gotchas/citation-orphaning-by-housekeeping-sweep.md)). `stage-2:` is a **status field that nothing cites**: no entry, card, or index row resolves through it. The hazard is structurally absent. **The one real coupling is the documented consumer** — `prompts/callimachus.md` names the audit command, so the field and its canonical definition must move together or we manufacture exactly the contract-versus-consumer mismatch this wiki already catalogs while cleaning up a different one. **Resolved 2026-08-19:** both prompt references *defer to this entry* for the specification, so defining the state here satisfies the coupling; the prompt's own wording is a clarification queued for its owner, not a blocker. **The command must be written anchored — `grep -rlE '^stage-2: pending'` — everywhere it appears.**

### `legacy-unaudited` has no consumer, and that is the design

Verified on read-back (Finn, 2026-08-19) against the three-point contract — what the label **means**, what **writes** it, what **consumes** it:

- **Means:** filed before 2026-06-02, never audited, not an outstanding obligation.
- **Written by:** exactly one documented event, the one-time backfill below. **There is no ongoing write path, and correctly so — nothing new can predate the gate.**
- **Consumed by:** *not matching* the obligation query.

**That last point is stated explicitly so nobody "fixes" it later.** This is a value whose entire function is to be **excluded** from a query, and having no consumer **is** its design. It is the exact inverse of [`../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md): there a sentinel needed to reach a consumer and had no slot, so the obligation was unreachable; here the absence of a consumer is what makes the state work. **A future reader applying the no-slot lesson mechanically would add a consumer this state does not need.**

## This entry's own gate status

**`partial` as of 2026-08-19 — and it went two and a half months without passing its own gate.** Filed 2026-06-02; **Finn read it back 2026-08-19** (three folds proposed and absorbed above, no dispute opened), advancing `pending` → `partial`. **Herald is the outstanding co-author** and is not spawned; it reaches `confirmed` when he reads back.

**What the delay demonstrates, recorded as evidence rather than as irony:** the stalled read-back was detected **only because a person remembered to schedule it by hand**, in a session about stale records. Nothing in the system surfaced it. **A gate whose own specification went unconfirmed for its entire existence has no enforcement arm** — the state simply persists, exactly as the pre-gate entries persisted, and the same detection-versus-recovery gap applies: the gate defines the transition and nothing measures the ones that never happen. See [`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md).

### `confirmed` certifies that a procedure occurred, not that the entry is correct

**This bounds what every `confirmed` in this wiki means, so it is stated on the gate's own face.**

On 2026-08-19 team-lead read back [`../patterns/shared-vocabulary-precondition-for-mergeable-fan-out.md`](../patterns/shared-vocabulary-precondition-for-mergeable-fan-out.md) and closed its gate to `confirmed`. Within the hour Finn opened a `[DISPUTE]` falsifying that entry's central mechanism — **using a measurement that had been sitting in team-lead's own scratchpad since 2026-08-12.** The confirmer had the falsifying evidence in his own notes and did not connect it to the claim it refutes. **The read-back genuinely happened; it simply is not a correctness check.**

So: **a `stage-2: confirmed` certifies that a named co-author read the entry. It does not certify that the entry is true.** Read as a quality signal it will mislead, because a co-author reads for *fidelity to what they contributed* — which is what the *Not applicable to confidence* bullet above already says, and which is easy to forget once the field renders as a green-looking token in an index table.

**Together with the missing enforcement arm, the shape is: the gate records that a procedure occurred, and we have been reading it as a quality signal.** Both halves were found on the same day, by the two mechanisms that do work — a hand-scheduled read-back and an independent reader with a contradicting measurement. Neither was found by the gate.

**Consequently `confirmed` was left in place on that entry and `status: disputed` set instead.** Rewriting the gate field would falsify the record of what occurred; the two fields are orthogonal and this is the case that shows why.

Recorded plainly rather than left as a wry aside, because it is evidence about the gate rather than a joke about it: **a gate whose own specification has gone unconfirmed for its entire existence is a gate with no enforcement arm.** Nothing detects a stalled read-back; the state simply persists, exactly as the pre-gate entries persisted as `pending`. That is the same detection-versus-recovery gap the wiki tracks elsewhere ([`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md)) — the gate defines the transition and nothing measures the ones that never happen. Noticed 2026-08-19 during a gate audit that nobody had scheduled either.

## A read-back performed against the ACK is not a read-back (added 2026-08-28, Brunel)

**The librarian's acknowledgment is a claim about the filed entry. It is not the entry.** A co-author who reads *“filed, confirmed, here is what I folded”* and answers from that has verified the librarian's account of the work, not the work -- which is the substitution this wiki spends most of its entries documenting.

**Evidence, 2026-08-28, and it is unusually clean because the control ran by accident.** Brunel sent a read-back correcting a misattribution in a filed entry. Two sends failed silently, so he **opened the entry on disk** rather than waiting -- and that is the only reason he found it. His own account:

> *“Had the channel worked I would have read your ack, seen ‘filed, confirmed’, and never opened the file. The delivery failure is the only reason the correction happened at all.”*

**The correction he was making was to a provenance sentence -- a credit for a catch that belonged to a third agent.** An ack would have reported the entry as filed and confirmed, truthfully, while the defect sat in it.

**Rule: a Stage-2 read-back reads the filed entry, not the acknowledgment.** The gate records that a co-author read the rendering; if what they read was a summary of the rendering, the gate records something weaker than it claims. **This is the same failure the gate itself already carries on its face** -- `confirmed` certifies that a procedure occurred, not that the content is correct -- and it names one specific way the procedure can occur while certifying nothing.

## ...and half two: a read-back RESULT is itself a moment-claim (added 2026-08-28, same incident)

**The rule above would have certified the mistake that actually occurred.** Brunel complied with it -- **he read the artifact** -- and his read-back was still wrong.

He grepped the entry at 16:31 (accurate then), the librarian's correction landed, and his *"confirmed not landed"* message was in flight across that gap. **Whether the claim was false when sent or only when read cannot now be established, because neither party stamped anything** -- which is the argument for the rule rather than an aside about it.

> **Both halves are required:**
> 1. **Read the artifact, not the ack.**
> 2. **A read-back result is itself a moment-claim.** Re-read if you are reporting later -- **and in every case, say when you read.**

**The stamp is the load-bearing half, and it is stronger than "re-read".** In a genuine race you cannot re-read fast enough; you can always state when you looked. *"Grepped at 16:31: the sentence is still there"* is checkable against an edit at any later minute. **A bare *"the entry is still wrong"* is an undated assertion, and an undated assertion reads as current** -- the same missing dimension as [`../gotchas/file-state-claims-have-no-layer-dimension.md`](../gotchas/file-state-claims-have-no-layer-dimension.md), one layer out: there the claim lacked *which layer*, here it lacks *at what moment*. Same remedy shape: a notation, not more diligence.

This is [`../patterns/verification-certifies-a-moment-not-a-session.md`](../patterns/verification-certifies-a-moment-not-a-session.md) applied to **the report of a verification** rather than to the verification -- the tightest turn of that pattern the wiki holds, and the check was **sound** in every respect that discipline usually governs.

*Attribution as the submitter asked:* **credited to the failure, not to his having spotted it.** He identified it only after being told the edits had landed.

## Corollary for the librarian -- and the first version was wrong on cost

The librarian's first corollary read: *an ack that quotes the fold in full makes it easier to skip the artifact, so acks should name what changed and where and say read it there.* **Brunel accepted the direction and rejected the cost model, correctly:**

> **A terse ack plus an unreliable channel is strictly worse than a quoting ack plus an unreliable channel** -- the quote is at least a **durable copy of the claim** if the artifact read never happens.

**Adopted version: terse acks that carry the artifact path AND a distinguishing quoted line or content hash.** That stops the ack from *substituting* for the artifact while still letting the reader verify they are looking at the version that was filed. **It is the md5-pin discipline from [`runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md`](runbook-source-tree-drifts-under-active-authorship-pin-by-checksum.md) applied to wiki entries** -- and two files were lost to exactly that drift on the same day for want of it.

(*FR:Brunel* observed both halves against his own case and corrected the librarian's cost model; *FR:Callimachus* filed)

(*FR:Callimachus*; `legacy-unaudited` state and the pre-gate ruling from *FR:Aen*, 2026-08-19)
