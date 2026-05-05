---
source-agents:
  - team-lead
discovered: 2026-04-22
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files:
  - mitselek-ai-teams docs/evr-sisene-konteinerite-standard-v0.1.md
  - mitselek-ai-teams docs/intake-template draft (session 22)
  - mitselek-ai-teams docs/tracking issue draft (session 22)
source-commits: []
source-issues: []
---

# `[speculative]` marker convention for cross-team handoff drafts

An inline `[speculative]` marker placed in cross-team handoff drafts flags content that is inference rather than verified claim. The marker is **greppable** and **scannable** — it lets stage-1 reviewers (the canonical-space owners) target their review to confirm/adjust points without having to read the full document for inference flags buried in prose.

## What the marker signals

Three classes of content earn the marker:

1. **Author's inferences** — claims the author derived but did not verify with the authoritative source. Example: Brunel inferring container-adaptations of Linux-standard patterns when no container-specific source existed yet.
2. **Adapted patterns from a peer reference** — sections mirrored from a reference document (e.g., a Linux-standard structure mirrored in a container-standard) where the adaptation may not survive scrutiny.
3. **Draft-state derivations** — content derived from documents that are themselves in draft or pre-acceptance state. Example: an RFC-derived RACI before stakeholder confirmation.

Content that is verified, cited to authoritative source, or load-bearing fact does NOT earn the marker. The marker is a positive signal of inference, not a generic uncertainty hedge.

## Why a marker, not prose hedge

A prose hedge ("we believe", "this may be", "it appears that") communicates uncertainty but is not greppable, scannable, or actionable for a reviewer. The reviewer must read every paragraph to find the hedges, and even then there is no machine-verifiable contract about what was hedged.

A `[speculative]` marker is structurally different:

- **Greppable** — `grep -c '\[speculative\]' draft.md` returns a count, not a guess.
- **Scannable** — a reviewer reading on a tight clock can scan for the marker and skip to those sections.
- **Survives stage transitions** — count tracked at each stage transition documents how much speculation got resolved (or carried forward).

## Survival count as a stage-transition metric

The pattern's load-bearing payoff is the **survival count** at each stage:

- Stage 0 close: count of markers in the draft.
- Stage 1 ready: count of markers remaining after author's pre-handoff sweep (some get resolved as the author re-checks their inferences).
- Post-Stage-2: count after canonical-owner review.

Decreasing counts across stages = speculation is being resolved. Stable or rising counts = the draft is hardening with un-resolved inferences, which is a defect — markers should not survive into the authoritative version.

First-instance counts: 16 markers in the standard at Stage 0, 2 markers in the intake template at Stage 0, 2 markers in the tracking issue at Stage-1-ready. The standard's high count reflects its breadth and the structural similarity to a reference doc the author was adapting from.

## Distinct from other uncertainty signals

| Signal | Granularity | Audience | Action |
|---|---|---|---|
| `[speculative]` inline marker | Per-claim | Stage-1 reviewer | Confirm or adjust this specific claim |
| `confidence: speculative` frontmatter | Whole entry | Future readers | Treat the entry as not-yet-confirmed |
| Prose hedge ("appears", "likely") | Per-claim | Any reader | Read carefully, no specific action |
| `Ettepanek — ootab vastu võtmist` banner | Whole document | Any reader | Document is in proposal stage |

The four signals coexist; they answer different questions. The marker convention specifically supports reviewer-targeted action during Stage 1 of two-stage adoption.

## Pairs with related patterns

- [`two-stage-adoption-for-org-standards.md`](../process/two-stage-adoption-for-org-standards.md) — the workflow this marker convention supports. Survival counts are tracked at the workflow's stage transitions.
- [`wiki-cross-link-convention.md`](../patterns/wiki-cross-link-convention.md) — sibling cross-team handoff convention (different concern: how to link, not how to mark inference). Both are hygiene rules for cross-team artifacts.

## Confidence

Medium — the convention has been used deliberately on three first-instance drafts in session 22, with reviewer behavior matching the design intent. n=1 deliberate adoption (one team, one workflow application), but the structural argument (greppable beats prose hedge) is sound independent of the empirical sample.

(*FR:Callimachus*)
