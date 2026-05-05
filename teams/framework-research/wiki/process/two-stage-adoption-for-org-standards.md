---
source-agents:
  - team-lead
discovered: 2026-04-23
filed-by: librarian
last-verified: 2026-05-04
status: active
source-files:
  - mitselek-ai-teams docs/evr-sisene-konteinerite-standard-v0.1.md
  - Confluence page 1713864752 ("EVR sisene konteinerite standard")
source-commits: []
source-issues:
  - TPS-583
---

# Two-stage adoption for org-wide standards

When the publisher of a standard, policy, or org-wide document does not have create-permission in the canonical destination space, route adoption through three explicit stages. The pattern lets work proceed at full quality before formal acceptance, while preserving authoritative-space ownership.

## The three stages

### Stage 0 — proposal

Publish the document in your own permitted space (or a known-permitted intermediate). Add a banner at the top:

> **Ettepanek — ootab vastu võtmist** *(Proposal — awaiting acceptance)*

The banner makes the draft state structurally visible — readers know this is not authoritative, even though the content is full-quality. Other draft-state markers (e.g., `[speculative]` inline tags — see [`speculative-marker-for-cross-team-drafts.md`](../contracts/speculative-marker-for-cross-team-drafts.md)) layer on top.

The work is real and complete at Stage 0. The banner is the only thing distinguishing it from the eventual v1.0.

### Stage 1 — escalation

Open a tracking issue in the canonical-space owner's queue (e.g., a Jira ticket in their project). The issue asks the owner to:

(a) **Move the page** to the canonical space.
(b) **Review** the content.
(c) **Escalate** to the appropriate decision-maker if needed.
(d) **Identify the receiving subteam** within the canonical space, if scope is ambiguous.

The issue is the formal handoff signal. Until the issue exists, Stage 0 is just a draft sitting in your space; once the issue exists, the canonical-space owner has been informed and the adoption clock is running.

### Stage 2 — final

When the canonical-space owner accepts:

- Banner removed.
- Document promoted to v1.0.
- Page moves to the authoritative space.
- Tracking issue closed.

The document at this point is identical in content to Stage 0 (modulo any reviewer-requested edits). The shift is in *location and authority*, not in substance.

## Why this works

The pattern decouples three concerns that conventional adoption conflates:

1. **Authoring** (what does the document say) — done at Stage 0, full quality.
2. **Ownership transfer** (who maintains it going forward) — done at Stage 1.
3. **Authority** (what is the canonical version) — granted at Stage 2.

Conflating these typically produces one of two failure modes: either the document is published authoritatively without owner buy-in (creates two-source-of-truth problems later), or it sits in draft indefinitely while the team waits for owner-side bandwidth to author it themselves (the owner is rarely the right author).

## When to use

The pattern applies when **all three** conditions hold:

- The publisher does not have create-permission in the canonical destination space.
- The publisher has the substantive expertise to author the content (the canonical-space owner does not, or does not have bandwidth).
- The document needs to land authoritatively in the canonical space eventually (otherwise just publish in the publisher's space and stop).

When the publisher has create-permission, just write directly in the canonical space — no staging needed.

## Pairs with related patterns

- [`create-perm-as-404-disguise.md`](../gotchas/create-perm-as-404-disguise.md) — the underlying constraint that makes Stage 0 necessary (Confluence returns 404 not 403 on create-perm denial). Knowing the gotcha tells you when this two-stage pattern applies.
- [`speculative-marker-for-cross-team-drafts.md`](../contracts/speculative-marker-for-cross-team-drafts.md) — the marker convention used inside Stage 0 documents to flag inferences the Stage 1 reviewer should confirm.

## First instance

EVR sisene konteinerite standard, session 22 (2026-04-22 to 2026-04-23):

- Stage 0: Published in D365 Confluence space (PO's permitted space) as `mitselek-ai-teams docs/evr-sisene-konteinerite-standard-v0.1.md` and Confluence page `1713864752`, banner present.
- Stage 1: TPS-583 tracking issue assigned to Ruth Türk, asking for V2/`I` move.
- Stage 2: pending (open as of filing date).

Source: team-lead session 22 wrap; co-authored stage-0 drafts by Brunel.

## Confidence

Medium — n=1 deliberate adoption, but the pattern is substrate-relevant for any future standard-publishing where the author lacks create-permission in the target space. Substrate-relevance lifts confidence above pure speculative because the constraints are structural (permission topology, ownership boundaries) rather than situational (this-team's-context).

(*FR:Callimachus*)
