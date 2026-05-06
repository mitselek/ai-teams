---
source-agents:
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Audit-Trail for Rejection Rationale

When a design decision **removes** a field, dedups a redundant element, or rejects a candidate variant in favor of another, the removed/rejected element's would-be-alternative + reason for rejection must be **cited inline** in the surviving artifact so future readers do not re-introduce the rejected element from absence-of-justification.

The discipline is the structural complement to "remove the redundant thing." Removing without recording the rejection rationale leaves a hole that future readers can fill from intuition, custom, or shared blind spot — and re-introduce the rejected element on the same reasoning that originally suggested it. The audit-trail paragraph closes the hole by leaving the rejection's reasoning attached to the place the rejected element used to live.

## The discipline

When removing or rejecting an element X in favor of Y:

1. **Record what X would have been.** Briefly describe the rejected variant — enough that a future reader can recognize it if they reach for it again.
2. **Cite the rejection reason.** What structural / contractual / semantic property made Y better than X? The reason is the discriminator that should reproduce the same decision when a future reader runs into the same fork.
3. **Anchor the citation at the surviving site.** Place the audit trail in or adjacent to Y, not in a separate document. The citation must travel with Y so future readers encounter it before deciding whether to add X back.

The audit trail is one paragraph, not a full alternative analysis. Its purpose is *threshold*: enough to make a future reader pause before re-introducing X, not enough to re-litigate the original decision. If extensive rationale is needed, link to the decision record from the audit-trail paragraph rather than inlining all of it.

## Why absence-of-justification is the failure mode

The natural failure mode is **silent removal**. The integrator removes X in favor of Y, the artifact ships clean (no X), and the rationale lives only in the integrator's head + the discussion thread that produced the decision. Six months later, a future reader looking at Y notices an "obvious" simplification or extension that *would* be X, and adds it. The reasoning that originally rejected X is no longer attached to Y; the reader's reasoning that suggested X is unopposed.

This is structurally the same shape as `why-this-section-exists-incident-docs.md` — the prompt-section-after-incident pattern says incidents must be named inline so the fix isn't deleted as redundant. The audit-trail-for-rejection pattern says rejection reasons must be named inline so the rejection isn't undone as oversight. Both name the same class of failure (silent re-introduction of fixed/rejected things) and apply the same fix (inline citation that travels with the surviving artifact).

## When this is in tension

- **Audit-trail bloat.** Citing every rejection adds prose. The threshold is "would a future reader plausibly reach for X?" If the rejected variant is not a natural reach (no one would suggest it without extensive context), the audit trail is overhead. If the variant is a natural reach (it was the first-pass framing, or it matches a common pattern elsewhere), the audit trail is load-bearing.
- **Decision records as alternative venue.** A separate decision-records artifact (ADR, decision log, design-decisions doc) can hold rejection rationale. The pattern still applies — the citation must be reachable from Y, even if by link rather than inline. A decision record without a from-Y-pointer is invisible to the reader looking at Y.
- **Architectural-fact entries.** Per `architectural-fact convention` (folded into Cal's prompt 2026-05-05): some entries record substrate that exists by design, where the rejection was external (the OS/framework/vendor chose, not the team). For these, audit-trail names *what would have been chosen if the team controlled it* + why the actual choice is fine — the audit-trail prevents future-team-takes-over-control reasoning from re-litigating moot decisions.

## What this is NOT

- **Not "preserve every alternative considered."** The discipline is about **rejection rationale**, not about exhaustive comparison. Most alternatives die in early discussion and never need audit-trail; only those that are *natural reaches* — variants future readers will plausibly suggest — need the trail.
- **Not a substitute for design records.** ADRs and decision logs serve the long-form rationale capture; audit-trail-for-rejection-rationale is the *threshold* citation at the surviving artifact. The two compose: short citation in the artifact, link to the long form for readers who want the full reasoning.
- **Not optional when the rejected element is structurally salient.** Some rejections are load-bearing — the design only works because X is *not* there (e.g., no fallback chain, no mirror field, no peer class for twin sub-cases). For these, the audit-trail is part of the design, not commentary on it. Removing the audit-trail rots the design's structural integrity.

## First instance — Prism Mod 1 sourceTeam dedup audit-trail (Monte, PR #8)

Observed 2026-05-05 in Prism Phase A on `mitselek/prism`. Monte's PR #8 Mod 1 ratified `sourceTeam` dedup at envelope-top-level (single-source-of-truth, removing the inner-level mirror field — see `field-level-overlap-one-truth-not-mirror.md`). Crucially, the Mod 1 prose included an audit-trail paragraph naming:

- **What the rejected alternative was.** The inner-level `entry.sourceTeam` field with documented mirror invariant.
- **Why it was rejected.** Mirror-invariant rot risk + one-truth structural cleanliness; specifically, the inner-level field was a natural reach for any future reader treating per-entry citation source as separately addressable from envelope-level origin.
- **Where the trail lives.** Inline at the §3 sourceTeam declaration in the surviving envelope-level field, attached to the canonical site that future readers will look at when contemplating "should there also be an inner-level sourceTeam?"

Monte recorded the decision in scratchpad: *"single-source-of-truth at envelope-top-level + audit-trail-paragraph for rejection rationale."* The audit-trail paragraph is what prevents a future reader from re-introducing the inner-level mirror — they encounter the rejection reasoning at the place they would have reached for the addition.

## Promotion posture

**n=1 watch posture, sub-shape candidate of `field-level-overlap-one-truth-not-mirror.md`.** The audit-trail discipline pairs with field-level-overlap removal as a unit: when removing a mirror, anchor the rejection rationale inline at the canonical site. Monte recorded it as "sub-shape candidate of Herald's #6b field-overlap pattern" — the parent (field-level-overlap) names the structural fix; this entry names the *load-bearing prose discipline* that protects the fix from silent reversal.

Watch for n=2 in future dedup or rejection decisions — likely candidates: future Prism contract revisions where dedup or rejection decisions land, `types/t09-protocols.ts` evolutions, governance design where rejected variants are natural reaches. Promote on second instance to consider Protocol C promotion to common-prompt as a structural-discipline gate.

The pattern is structurally distinct from `field-level-overlap` (which addresses where the value lives) — this entry addresses *what prose accompanies the removal*. Filed as a sibling rather than folded because the audit-trail discipline applies beyond field-overlap (any rejection in a typed-contract or design-doc benefits from it), even though the first instance is field-overlap-specific.

## Related

- [`field-level-overlap-one-truth-not-mirror.md`](field-level-overlap-one-truth-not-mirror.md) — paired pattern: field-level-overlap names the structural fix (remove the mirror); this entry names the prose discipline (cite the rejection rationale inline at the surviving site). The two compose as a unit on every dedup decision.
- [`why-this-section-exists-incident-docs.md`](why-this-section-exists-incident-docs.md) — same-class pattern at the incident-doc layer. Both name the failure mode of silent re-introduction (fixes deleted as redundant; rejections undone as oversight) and apply the same fix (inline citation that travels with the surviving artifact). Different domains; same structural discipline.
- [`no-future-proofing.md`](no-future-proofing.md) — adjacent: no-future-proofing says don't add abstractions for hypothetical needs. Audit-trail-for-rejection says when you DON'T add something for a hypothetical need (or when you remove something that was added speculatively), record why so future readers don't re-add it. The two compose: don't pre-allocate AND record-why-you-didn't.
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — adjacent: pass1-pass2 says some renames defer until consumers are inventoried. Audit-trail applies to the deferred-Pass-2 case — record why Pass 2 was deferred at the Pass-1 site so a future reader doesn't run an ad-hoc Pass 2.

(*FR:Cal*)
