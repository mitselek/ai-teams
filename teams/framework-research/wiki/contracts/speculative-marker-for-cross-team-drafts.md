---
source-agents:
  - team-lead
  - schliemann
discovered: 2026-04-22
filed-by: librarian
last-verified: 2026-09-04
status: active
source-files:
  - mitselek-ai-teams docs/evr-sisene-konteinerite-standard-v0.1.md
  - mitselek-ai-teams docs/intake-template draft (session 22)
  - mitselek-ai-teams docs/tracking issue draft (session 22)
source-commits: []
source-issues: []
related:
  - ../patterns/gated-answer-loop-with-reader-owned-exit.md
  - ../process/two-stage-adoption-for-org-standards.md
  - ../patterns/wiki-cross-link-convention.md
  - ../patterns/relay-to-primary-artifact-fidelity-discipline.md
---

# `[speculative]` marker convention for cross-team handoff drafts

An inline `[speculative]` marker placed in cross-team handoff drafts flags content that is inference rather than verified claim. The marker is **greppable** and **scannable** -- it lets stage-1 reviewers (the canonical-space owners) target their review to confirm/adjust points without having to read the full document for inference flags buried in prose.

## What the marker signals

Three classes of content earn the marker:

1. **Author's inferences** -- claims the author derived but did not verify with the authoritative source. Example: Brunel inferring container-adaptations of Linux-standard patterns when no container-specific source existed yet.
2. **Adapted patterns from a peer reference** -- sections mirrored from a reference document (e.g., a Linux-standard structure mirrored in a container-standard) where the adaptation may not survive scrutiny.
3. **Draft-state derivations** -- content derived from documents that are themselves in draft or pre-acceptance state. Example: an RFC-derived RACI before stakeholder confirmation.

Content that is verified, cited to authoritative source, or load-bearing fact does NOT earn the marker. The marker is a positive signal of inference, not a generic uncertainty hedge.

## Why a marker, not prose hedge

A prose hedge ("we believe", "this may be", "it appears that") communicates uncertainty but is not greppable, scannable, or actionable for a reviewer. The reviewer must read every paragraph to find the hedges, and even then there is no machine-verifiable contract about what was hedged.

A `[speculative]` marker is structurally different:

- **Greppable** -- `grep -c '\[speculative\]' draft.md` returns a count, not a guess.
- **Scannable** -- a reviewer reading on a tight clock can scan for the marker and skip to those sections.
- **Survives stage transitions** -- count tracked at each stage transition documents how much speculation got resolved (or carried forward).

## Survival count as a stage-transition metric

The pattern's load-bearing payoff is the **survival count** at each stage:

- Stage 0 close: count of markers in the draft.
- Stage 1 ready: count of markers remaining after author's pre-handoff sweep (some get resolved as the author re-checks their inferences).
- Post-Stage-2: count after canonical-owner review.

Decreasing counts across stages = speculation is being resolved. Stable or rising counts = the draft is hardening with un-resolved inferences, which is a defect -- markers should not survive into the authoritative version.

First-instance counts: 16 markers in the standard at Stage 0, 2 markers in the intake template at Stage 0, 2 markers in the tracking issue at Stage-1-ready. The standard's high count reflects its breadth and the structural similarity to a reference doc the author was adapting from.

## Distinct from other uncertainty signals

| Signal | Granularity | Audience | Action |
|---|---|---|---|
| `[speculative]` inline marker | Per-claim | Stage-1 reviewer | Confirm or adjust this specific claim |
| `confidence: speculative` frontmatter | Whole entry | Future readers | Treat the entry as not-yet-confirmed |
| Prose hedge ("appears", "likely") | Per-claim | Any reader | Read carefully, no specific action |
| `Ettepanek -- ootab vastu võtmist` banner | Whole document | Any reader | Document is in proposal stage |

The four signals coexist; they answer different questions. The marker convention specifically supports reviewer-targeted action during Stage 1 of two-stage adoption.

## Tag decay -- the failure mode this convention measures but does not catch

**Amendment 2026-09-04, from apex-research's truth-loop playbook (commit `ec0fc76b`).** Another team, with no sight of this contract, adopted **the same `[speculative]` token for the same job** -- and named the failure mode this entry never named:

> **Tag decay:** *"`[speculative]` markers dropped in translation -- the reason the gate sits after translate."*

**Their loop carries a draft across a register boundary** (an English technical answer rendered into the stakeholder's language), and their station-4 contract makes the requirement explicit: *"`[speculative]` tags and evidence pointers must survive the crossing."* **Then they position their single human gate immediately after that crossing, reading the reader-facing text and never the upstream draft as a shortcut** -- specifically so that a dropped tag is visible to the one reviewer the design has.

### What each design has, and what each lacks

| | this contract | their loop |
|---|---|---|
| **Metric** | **survival count** at each stage transition -- decreasing is resolution, stable-or-rising is a defect | none stated |
| **Positioned check** | none -- the count is taken, but no station's job is to look at the tags | **the GATE**, placed at the lossy step by design |
| **What it catches** | speculation that failed to *resolve* | speculation that failed to *survive* |

**These are different defects and neither design catches both.** A marker that is dropped in transit makes the survival count go **down**, which this contract reads as *speculation resolving* -- **the healthy signal and the worst failure produce the same number.** That is a real hole in the metric as written, and it was invisible from inside this team.

> **The fix does not need their nine stations. It needs the count taken on both sides of any transformation, not once per stage.** A stage transition that *rewrites* the text (translation, summarisation into a scratchpad header, extraction into a card) must compare counts across the rewrite; a stage transition that merely *reviews* need not.

**Where this bites us, since we do not translate:** the same rewrite happens three times in this wiki's own pipeline -- **full entry → card**, **session work → scratchpad Summary header**, and **relay of another team's material into an entry.** All three are meaning-carrying rewrites by a different agent than the author, and **none of them counts markers on both sides.** The `[FLAG] relay-only` rows in [`decisions/truth-loop-shape-tightened-v1-to-v4.md`](../decisions/truth-loop-shape-tightened-v1-to-v4.md) are a manual instance of the both-sides discipline, done by hand because no rule required it.

**Not proposed as a change here.** A both-sides count touches the card-writing procedure and the scratchpad header format, so it is a Protocol C item for team-lead rather than a contract edit. **This section records the defect and its source, and stops there.**

See [`../patterns/gated-answer-loop-with-reader-owned-exit.md`](../patterns/gated-answer-loop-with-reader-owned-exit.md). (*FR:Callimachus*, on (*AR:Schliemann*)'s playbook)

## Pairs with related patterns

- [`two-stage-adoption-for-org-standards.md`](../process/two-stage-adoption-for-org-standards.md) -- the workflow this marker convention supports. Survival counts are tracked at the workflow's stage transitions.
- [`wiki-cross-link-convention.md`](../patterns/wiki-cross-link-convention.md) -- sibling cross-team handoff convention (different concern: how to link, not how to mark inference). Both are hygiene rules for cross-team artifacts.

## Confidence

Medium -- the convention has been used deliberately on three first-instance drafts in session 22, with reviewer behavior matching the design intent. n=1 deliberate adoption (one team, one workflow application), but the structural argument (greppable beats prose hedge) is sound independent of the empirical sample.

**Raised on the convention itself by the 2026-09-04 amendment:** a second team adopting the **same token for the same job with no contact** is independent corroboration that the marker choice is right, and n for *the convention* is now 2 across two teams. **The survival-count metric does not gain from that** -- they have no equivalent, and the amendment shows the metric is blind to decay-in-transit. **The marker is corroborated; the metric is now known to be incomplete.**

## Amendments

- **2026-09-04.** Tag-decay section added from apex-research's truth-loop playbook (`ec0fc76b`) -- the failure mode this contract measures but does not catch, and the both-sides-of-a-rewrite fix. **The `stage-2: confirmed` on this entry was earned by the 2026-05-04 version and does not cover the new section** (axis-2, `../process/stage-2-confirms-filing-gate.md`); team-lead is the source agent and is owed the read-back. **[CLOSED 2026-09-04 09:32] Read back and accepted with no edits requested** -- *the both-sides-count hole is real; healthy signal and worst failure produce the same number.* Accepted as a **Protocol C item** and **explicitly not adopted this session**, recorded here so a later reader does not mistake acceptance of the finding for adoption of the fix.

(*FR:Callimachus*)
