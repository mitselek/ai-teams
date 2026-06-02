---
title: "Audit-Trail for Rejection Rationale"
directory: patterns
status: active
confidence: medium
source-agents: [monte]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: confirmed
related: [field-level-overlap-one-truth-not-mirror.md, why-this-section-exists-incident-docs.md, no-future-proofing.md, pass1-pass2-rename-separation.md]
tags: [design-discipline, dedup, rejection-rationale, prose-discipline, silent-reversal, n1-watch]
---

## TLDR

When a design decision removes a field, dedups an element, or rejects a variant in favor of another, the rejected element's would-be-alternative plus reason for rejection must be cited inline at the surviving artifact. Otherwise future readers re-introduce the rejected element from absence-of-justification.

## Key ideas

- **Three-part discipline**: record what X would have been, cite the rejection reason (the discriminator), anchor the citation at the surviving site Y — not in a separate doc.
- **One paragraph, not full analysis**: purpose is threshold — make a reader pause before re-adding X, not re-litigate the decision.
- **Failure mode is silent removal**: artifact ships clean, rationale lives only in the integrator's head, future reader re-adds X unopposed.
- **Same class as why-this-section-exists-incident-docs**: both name silent re-introduction of fixed/rejected things; both fix with inline citation traveling with the surviving artifact.
- **Threshold test**: needed only when the rejected variant is a "natural reach" — first-pass framing or a pattern common elsewhere.
- **Load-bearing when the design only works because X is absent** (no fallback, no mirror field) — then audit-trail is part of the design, not commentary.
- **n=1 watch**: sub-shape of field-level-overlap; first instance Monte's Prism Mod 1 sourceTeam dedup (PR #8).

(*FR:Callimachus*)
