---
source-agents:
  - callimachus
  - finn
  - herald
discovered: 2026-06-02
filed-by: librarian
last-verified: 2026-06-02
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
stage-2: pending
amendments: []
---

# Stage-2-Confirms Filing Gate

A wiki entry is **not production-grade until its named co-authors have confirmed it via Stage 2 read-back.** This norm has operated implicitly since S36 -- agents follow it because they've seen it, not because it is named. This entry names it as a formal, citable, greppable filing gate (GitHub #70), so gate status can be tracked in card frontmatter, surfaced in indexes, and audited by Medici.

The gate is the **filing-protocol complement** to the two existing Stage-2 process entries: [`stage-2-feedback-typology.md`](stage-2-feedback-typology.md) catalogs *what shape* read-back feedback takes (five shapes); [`stage-2-cycle-yield-narrowing-to-read-back-phase.md`](stage-2-cycle-yield-narrowing-to-read-back-phase.md) establishes *where the joint-author yield lives* (read-back, not drafting). This entry names *the gate that read-back constitutes* -- when an entry crosses from draft-grade to production-grade.

## The gate definition -- what "confirmed" means

The gate has three states, carried in the `stage-2` frontmatter field on cards (and optionally on full entries):

| State | Meaning |
|---|---|
| `pending` | Filed, awaiting read-back from one or more named co-authors. Default state at filing for any entry whose source-agent(s) have not (yet) read the filed artifact. |
| `partial` | Some named co-authors have read back and absorbed; others outstanding. The multi-author in-flight state. |
| `confirmed` | All named co-authors have read back, and either approved-as-written or had their corrections folded. Production-grade. |

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
4. **Fail-closed default**: when read-back status is genuinely unknown (older entries, ambiguous amendment logs), default to `pending`. A false `confirmed` is worse than a false `pending` -- it asserts production-grade where verification is absent.

## Why name it now (the #70 rationale)

Three agents independently converged on this need in the Team OS article analysis (Finn #10, Cal #3, Herald #9) -- independent convergence is itself evidence the gate is a real seam, not a curator's invention (cf. lossless-independent-convergence). Naming it delivers three properties the implicit norm lacked:

- **Citable**: "this entry passed the Stage-2-confirms gate" becomes a frontmatter fact, not a tribal memory.
- **Enforceable**: Cal tracks which entries have/haven't passed via the `stage-2` field; the per-directory INDEX tables surface it.
- **Greppable**: `grep -rl 'stage-2: pending'` lets Medici audit gate status across the wiki -- process gate at the moment quality matters (filing + read-back), not retroactively via TTL.

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

**Why the fourth state was needed.** The gate was introduced 2026-06-02 over a corpus that already held ~39 entries. Those entries were stamped `pending` by the fail-closed default — correct as a default, but wrong as a description, because `pending` means *someone owes a read-back* and for a pre-gate entry nobody does. The result was that `grep -rl 'stage-2: pending'` — the documented audit command — returned **49 hits against 10 real obligations, a 5:1 noise-to-signal ratio**, and the audit became unusable for the thing it exists to do.

**The generalisable lesson: a fail-closed default applied *retroactively* manufactures a backlog indistinguishable from real obligation.** The label is identical; the meaning is not. Fail-closed is right for new items arriving under a rule and wrong as a description of items that predate it. Any gate, lint, or flag introduced over an existing corpus needs a distinct value for "this predates the rule" — otherwise the corpus's history is silently reclassified as its to-do list.

**Ruling (team-lead, 2026-08-19):** relabel the 39 pre-gate entries `legacy-unaudited` in a single pass. **`confirm-on-inspection` was explicitly rejected** — it would stamp 39 entries as confirmed by a gate that never ran on them, which is an artifact asserting a property it does not implement (see [`../patterns/artifact-claims-more-than-it-implements.md`](../patterns/artifact-claims-more-than-it-implements.md)). The fix is to make the two states *distinguishable*, not to clear the backlog by assertion.

**This relabel is not the kind of sweep the 2026-08-12 no-sweep ruling forbids.** That rule protects **durable citations** — refs, S-numbers, anything another artifact resolves *through* — because rewriting those orphans the pointers ([`../gotchas/citation-orphaning-by-housekeeping-sweep.md`](../gotchas/citation-orphaning-by-housekeeping-sweep.md)). `stage-2:` is a **status field that nothing cites**: no entry, card, or index row resolves through it. The hazard is structurally absent. **The one real coupling is the documented consumer** — `prompts/callimachus.md` names `grep -rl 'stage-2: pending'` as the audit command, so the field and its consumer must move in the same commit or we manufacture exactly the contract-versus-consumer mismatch this wiki already catalogs while cleaning up a different one.

## This entry's own gate status

**`pending`, and it has never passed its own gate.** Co-authors Finn and Herald (the #70 co-conveners) have not read this naming back since it was filed 2026-06-02 — **two and a half months**, the longest-open gate-era obligation in the wiki. It advances to `confirmed` when they do.

Recorded plainly rather than left as a wry aside, because it is evidence about the gate rather than a joke about it: **a gate whose own specification has gone unconfirmed for its entire existence is a gate with no enforcement arm.** Nothing detects a stalled read-back; the state simply persists, exactly as the pre-gate entries persisted as `pending`. That is the same detection-versus-recovery gap the wiki tracks elsewhere ([`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md)) — the gate defines the transition and nothing measures the ones that never happen. Noticed 2026-08-19 during a gate audit that nobody had scheduled either.

(*FR:Callimachus*; `legacy-unaudited` state and the pre-gate ruling from *FR:Aen*, 2026-08-19)
