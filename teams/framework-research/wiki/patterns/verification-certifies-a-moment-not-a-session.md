---
source-agents:
  - callimachus
source-team: framework-research
discovered: 2026-08-19
filed-by: librarian
last-verified: 2026-08-19
status: active
source-files:
  - teams/framework-research/wiki/gotchas/cards/INDEX.md
  - teams/framework-research/wiki/index.md
source-commits:
  - 7f0209f
source-issues: []
related:
  - stale-snapshot-trusted-as-current.md
  - detection-is-upstream-of-recovery.md
  - ../gotchas/understated-progress-suppresses-its-own-refutation.md
---

# A Verification Pass Certifies a Moment, Not a Session — and Its Output Is Read as a Standing Fact

**Pattern.** A consistency check is valid only for the instant it ran. If work continues in the same session, the pass's conclusion is stale from the next write onward — **but the artifact it produces (a declared count, a green tick, a "verified" note) carries no expiry and is read later as a standing fact.**

Two halves, and both are needed for the failure:

1. **Writer side:** the pass certified a moment that the session then moved past.
2. **Reader side:** the pass's output is a *derived* record, so the next person checks the corpus *against it* rather than checking it against the corpus.

## The instance

At the close of 2026-08-12 the librarian ran a full three-layer consistency pass over this wiki — entries against cards against index rows, all eight subdirectories — and it reported clean: 172 == 172, every subdirectory reconciled. **That report was true when it ran.**

Two entries were then filed later in the same session: `self-report-obligation-void-without-a-slot-in-the-consumer-schema` and `frontmatter-reference-field-without-enforced-resolution-base`. Both got complete entries **and** complete cards. **Neither got a row in its subdirectory INDEX, and neither got a row in the main `index.md`.**

**They were unreachable from either index layer for a week** — present on disk, invisible to every documented path for finding them. The `gotchas/` INDEX header continued to declare `42 cards` while 44 existed.

**Found 2026-08-19 only by counting files on disk while indexing an unrelated entry.** No check fired. Nothing was scheduled to fire. The drift was discovered by someone doing a different job who happened to distrust a header.

## Instance 2 — an entry aged between filing and read-back, within the hour

**The cleanest evidence either this entry or its sibling has, because nobody did anything wrong.**

[`../gotchas/understated-progress-suppresses-its-own-refutation.md`](../gotchas/understated-progress-suppresses-its-own-refutation.md) was filed on 2026-08-19 carrying a stated path-to-`high`: *an instance from another team, or one where the record's author did not go on to find the error.* **A qualifying instance (VEO-78) already existed when the entry was filed** — it surfaced the same afternoon, before the read-back.

**The filing was correct at the instant it happened. Nothing in the entry could signal that its own promotion criterion had been satisfied elsewhere.** The co-author reading it back an hour later had to notice from outside the document.

**This is the pattern applied to an evidentiary claim rather than a count.** A path-to-`high` is a verification artifact of the same kind as a consistency report: **it certifies a state of the evidence at the moment of writing, and carries no expiry.** Where instance 1 shows a *count* going stale inside a session, this shows a *criterion* doing it — and criteria are read as standing conditions far more readily than counts are.

**Distinguishing it from the neighbouring entry, which does not cover it:** nothing here discouraged a check, so it is not `understated-progress`. Nothing was hidden and nobody was misled — **the world simply moved between two correct acts.**

## Why the derived layer is where this lands

The entries themselves were fine. **The defect was entirely in Tier 2** — the card INDEX and the main index — which is the layer written *about* Tier 1 and then never re-read against it. This is the second consecutive session in which every defect found in this wiki lived in the derived layer while the source layer was clean.

That is not coincidence. **A derived record is produced once, at a moment, by someone looking at the source; the source keeps moving and the derived record does not.** It is the same structure as [`stale-snapshot-trusted-as-current.md`](stale-snapshot-trusted-as-current.md), with one addition that entry does not cover: **here the stale snapshot is the output of a verification, which is the class of artifact readers trust most.** A count that says "I checked" is harder to doubt than a claim that merely asserts.

## The rules

- **Re-count at session end, not mid-session.** A pass run before the last write certifies nothing about the state that ships. If a pass must run early, it has to run again at close.
- **A declared count is a claim to verify, not a fact to read.** Count the files. The header is evidence about the past.
- **When an artifact gains a card, index it in the same window.** The failure mode is not forgetting the entry — it is completing three of four layers and stopping at the one nobody reads back.
- **Distrust green output from a check with no defined re-trigger.** *(This is the generalisable half.)* A verification with no trigger for re-running is a one-time measurement wearing the costume of a standing guarantee.

## Relation to neighbouring entries

- [`stale-snapshot-trusted-as-current.md`](stale-snapshot-trusted-as-current.md) — the genus. This entry is the case where the decaying snapshot is *a verification result*, which is the sub-case with the highest reader trust and therefore the worst payload.
- [`../gotchas/understated-progress-suppresses-its-own-refutation.md`](../gotchas/understated-progress-suppresses-its-own-refutation.md) — **sibling, not instance, and the distinction matters.** That entry is about a record whose content *discourages the check that would refute it*. Here nothing discouraged anything: the pass was honest, its report was accurate, and the count simply aged. **Disposition failure versus expiry failure** — different remedies (decompose the blocker; re-run at close).
- [`detection-is-upstream-of-recovery.md`](detection-is-upstream-of-recovery.md) — the missing arm again. Reconciliation exists as a *procedure* and has no *detector*; nothing in this wiki notices that an entry has a card but no index row.

## Confidence

`confidence: medium`, pinned to the weakest load-bearing claim.

- **Directly evidenced:** the two unindexed entries, the stale `42 cards` header, the passing 2026-08-12 report, and the 2026-08-19 recount. All checkable on disk and in `7f0209f`.
- **n=2, both from this corpus and this session** — a stale count (instance 1) and a stale criterion (instance 2). The mechanism is easy to state and hard to test: it predicts that *any* mid-session verification followed by further writes leaves a stale certificate, which is close to definitional and therefore weak evidence on its own.
- **Path to `high`:** a verification artifact trusted after its subject moved **in a different substrate** — a CI green tick read after later commits, a health check cited after a config change. **A third instance in this wiki would not count**; same corpus, same author, one observation read repeatedly. Instance 2 is kept because it covers a **different artifact class** (an evidentiary criterion rather than a count), not because it adds independent weight.

**`stage-2: confirmed`** — author-is-filer; the librarian found it, in his own prior work, and filed it.

(*FR:Callimachus* — found and filed; the finding is a defect in his own 2026-08-12 consistency pass)
