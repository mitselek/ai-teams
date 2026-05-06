---
source-agents:
  - herald
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/01-federation-envelope-contract.md
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Field-Level Overlap: One Truth, Not Mirror

When two fields in a typed contract carry the same logical information at different levels of the same schema (e.g., `envelope.sourceTeam` and `envelope.entry.sourceTeam`), the right shape is **one field, one truth at the level it logically belongs** — not two fields with a documented mirror invariant. Mirror-invariant fields produce a class of bug — overlap drift — that gate-2 cross-reading catches reliably but only when the overlap surfaces; the structural fix is to remove the overlap entirely so the bug class doesn't exist.

The discipline names a specific failure mode in typed-contract composition: when an integrator surfaces overlapping fields by reviewing the contract from above and below the overlap point (gate-2 cross-read), the natural first reflex is to add a synchronization invariant ("if A is set, B must equal A"). That invariant works on day 1 and silently rots on day N when one path writes A without B or vice versa. The structural fix is to choose one location and make the other a derived view — or, better, remove the duplicate from the schema entirely.

## The discipline

Three rules in order:

1. **Detect the overlap.** Two fields in the same typed contract carry the same logical information when (a) they hold the same value across well-formed instances, OR (b) the contract documents a mirror invariant requiring them to match. Both conditions count as overlap.

2. **Choose the canonical location.** The canonical location is the level where the field's *governance* lives — who writes it, what semantics validate it, what dispatch reads it. If the field's authority is at the envelope level, the envelope-level field is canonical and any inner-level copy is the mirror. If authority is per-entry, the inner field is canonical.

3. **Remove the mirror.** Don't keep both with a sync rule; remove the non-canonical field from the schema. If consumers need to read the field at the non-canonical level, that's a derived-view question (resolve at read time from the canonical location), not a schema question.

The discipline composes with the **audit-trail-for-rejection-rationale** pattern (sibling, watch posture): when removing a mirror, cite the would-be-alternative + rejection reason inline so future readers don't re-introduce the duplicate from absence-of-justification.

## Why mirror-invariants rot silently

Two write paths is the failure mode. As long as exactly one write path exists for both fields, the invariant holds; the moment a second write path lands on one field but not the other, the invariant breaks at one site and the rest of the contract keeps reading the assumed-coupled state. The break is usually invisible until a downstream consumer reads the wrong copy and produces semantically-wrong-but-shape-valid output.

Gate-2 cross-read (producer-side and consumer-side reading) catches the overlap when the two specialists who own the producer side and the consumer side cross-check each other's drafts. But gate-2 catches the overlap on **first surfacing**, not on subsequent drift — the cross-read happens at design time, not on every write site. Once the contract ships, drift is on the writers, not the gate.

Removing the mirror — keeping one truth — eliminates the bug class at the schema level. There is no invariant to drift; there is no second write path to forget; there is no documentation to ignore. The discipline is structural, not procedural.

## When this is in tension

- **Performance / locality requirements.** A mirror sometimes exists for read-performance ("reading at the inner level avoids walking up the envelope"). When this is the actual reason, the mirror is a cache, not a schema element — it should be a derived view computed at read time or materialized in a separate read-optimized representation. Don't conflate cache with schema; if the read pattern justifies caching, build the cache as a separate concern.
- **External-consumer compatibility.** When external consumers already code against the inner-level field, removing it is a breaking change (per `semver-strict-typed-contract-discipline.md`). The discipline still applies — pick the canonical location — but the migration path becomes a major-version bump with the inner-level field deprecated and removed in a subsequent version. The end-state is the same: one truth.
- **Genuinely orthogonal fields with same name.** If `envelope.sourceTeam` (origin team) and `envelope.entry.sourceTeam` (data-source team for citation purposes, which may differ from origin) carry semantically-distinct information that happens to share a name, they are not overlapping — they are name-collisions. The fix is renaming, not removal. The discriminating test: do well-formed instances ever have these fields disagree? If yes, they are orthogonal; if no, they are overlapping.

## What this is NOT

- **Not "always flatten."** The discipline picks the canonical location based on where governance lives; that may be at any level of the schema. Sometimes the canonical location is an inner level (when authority is per-entry); flattening to the outer level would be wrong then.
- **Not a substitute for cross-read.** Field-level overlap is one of several classes of bug gate-2 catches; the cross-read discipline (Structural Change Discipline gate 2 in common-prompt) is the meta-discipline. Removing mirrors is what you do AFTER cross-read surfaces the overlap; the cross-read is what surfaces it.
- **Not an n=1 watch.** Two clean instances at session 26 surfaces (Herald's PR #8 sourceTeam dedup explicitly + the broader gate-2 work pattern that surfaced it) make this a re-classified n=2 entry; per Aen's S26 [LEARNED]-cluster note: *"field-level overlap is a class-of-bug gate-2 catches reliably — one field, one truth beats N fields with documented mirror invariant (Herald sourceTeam dedup catch)."* Promotion-grade by the n=2 standard. Filed at re-classified n=2 on intake.

## First instances

### Instance 1 — Prism envelope `sourceTeam` mirror (Herald + Monte gate-2 cross-read, PR #8)

Observed 2026-05-05 in Prism Phase A on `mitselek/prism`. Herald's deliverable A federation envelope had `sourceTeam` defined at two levels:

- **Envelope level** (`envelope.sourceTeam`) — origin team for the cross-team reference.
- **Inner / per-entry level** (within `envelope.entry`) — citation-level source team.

Initial framing: both fields existed; a mirror invariant was documented in §3 ("if envelope.sourceTeam is set and envelope.entry.sourceTeam is set, they must agree"). This was the "two fields with documented mirror invariant" shape.

Monte's gate-2 cross-read (PR #8 Mod 1) surfaced the overlap and ratified the structural fix: **single-source-of-truth at envelope-top-level**. The inner-level field was removed from the schema; consumers reading at the inner level resolve via reference to the envelope. The Mod 1 also added an audit-trail paragraph citing the would-be-alternative + rejection reason, preventing future readers from re-introducing the inner field from absence-of-justification (sub-shape: see `audit-trail-for-rejection-rationale`).

Aen ratified the change as load-bearing: *"one field, one truth on second-pass cross-read."* Herald scratchpad records the case as instance #3 of his session 26 four-instance cross-specialist gate-2 work cluster.

### Instance 2 — broader pattern: field-level overlap is a class-of-bug gate-2 catches reliably

Aen's S26 [LEARNED]-cluster note named the broader pattern explicitly: *"field-level overlap is a class-of-bug gate-2 catches reliably — one field, one truth beats N fields with documented mirror invariant."* The Herald sourceTeam dedup is the exemplar; the broader observation is that this is a recurrent class — when two specialists own producer/consumer halves of a typed contract, the overlap pattern surfaces during gate-2 cross-read and the structural fix is consistent (remove the mirror, pick canonical, pair with audit-trail).

The two instances together (specific catch + named class) make this re-classified n=2 promotion-grade — the specific catch is the evidence; the named class is the generalization that earns the wiki entry. Filed at n=2 on intake per Aen's re-classification call.

## Promotion posture

**n=2 cumulative, promotion-grade**. Watch for n=3 in future typed-contract designs — likely candidates: Phase B federation bootstrap protocol envelope (Brunel + Monte cross-design), authority-drift detection schema (Monte + governance), `types/t09-protocols.ts` evolutions. On n=3, evaluate Protocol C promotion to common-prompt as a structural-discipline gate alongside the existing four (likely scoped to "before merging a typed-contract design, scan for overlapping fields; remove mirrors, pick canonical").

Sibling to `dispatch-granularity-matches-recovery-handler` (sub-discriminator-vs-peer-class question) at the contract layer — both patterns address structural-placement decisions in typed contracts. The sibling-pair discipline: dispatch-granularity says where a *distinction* lives (sub-discriminator vs peer); field-level-overlap says where a *value* lives (canonical level vs derived view). Different decisions; same structural-thinking discipline.

## Related

- [`dispatch-granularity-matches-recovery-handler.md`](dispatch-granularity-matches-recovery-handler.md) — sibling at the contract layer. Both patterns address structural-placement decisions in typed contracts: dispatch-granularity for distinctions across cases; field-level-overlap for values across levels. Same gate-2 cross-read discipline catches both classes.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — foundational: protocol shapes are typed contracts that producer/consumer must read against. This entry adds a class of structural defect that surfaces during the cross-read.
- [`protocol-completeness-across-surfaces.md`](protocol-completeness-across-surfaces.md) — adjacent: protocol-completeness checks that every dispatch path has a handler across the union of surfaces. Field-level-overlap is the inverse check at the field-set layer — that the union of surfaces does not have *redundant* representations of the same field. Both are diagnostics applied to multi-surface composition.
- [`semver-strict-typed-contract-discipline.md`](semver-strict-typed-contract-discipline.md) — adjacent: removing a mirror field is a typed-contract change. SemVer-strict applies — if the inner-level field was published in a prior version, the removal is a breaking change requiring major bump unless the mirror was internal.
- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — adjacent process: the gate-2 cross-read that catches the overlap often produces a coordination-loop self-correction (one specialist's framing is reshaped by the other's cross-read). Field-level-overlap is one of the structural defects coordination-loop self-correction can resolve.

(*FR:Cal*)
