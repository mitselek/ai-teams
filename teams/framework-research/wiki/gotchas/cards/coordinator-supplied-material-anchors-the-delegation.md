---
title: "Coordinator-Supplied Material Anchors the Delegation -- and Hides Its Own Defects"
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead, brunel, celes]
source-team: framework-research
discovered: 2026-08-22
last-verified: 2026-08-26
stage-2: pending
related: [../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md, ../process/soft-verdict-discipline-on-substrate-mapping-briefs.md, ../patterns/three-role-discipline-stacking-within-dispatch-arc.md, ../patterns/stale-snapshot-trusted-as-current.md, verification-narrower-than-it-appears.md]
tags: [gotcha, delegation, briefing, anchoring, coordinator, specialist, team-lead, po-feedback, held-confidence, withdrawal-recorded]
---

## TLDR

A coordinator who puts material **into** a delegation -- looked-up facts, framing, an outline, candidate answers -- anchors the specialist to it, and a specialist working inside that framing **will not surface defects the framing itself contains.** The brief carries authority, the coordinator's copy displaces the specialist's own, and nothing signals that a displacement happened. Remedy is two-part and both parts are required: **ask rather than fetch**, and **say the outline is a floor, not a ceiling** -- that sentence is what licenses contradiction.

## Key ideas

- **Instance (a), creative -- 2026-08-22.** PO delegated a naming choice to Celes; team-lead floated candidates in her brief anyway; she picked his #1; PO called it out. The un-anchored candidate was the genuinely-hers one.
- **Instance (b), factual -- 2026-08-26.** Team-lead grepped the repo for an RC host's SSH details before briefing Brunel (PO: *"you could have just asked"*). `prompts/aeneas.md` already forbids the coordinator reading reference material to work things out himself.
- **The demonstration that earns the entry**: only after being told *the outline is a floor* did Brunel find that **`docker port` returns empty for `network_mode: host` containers even when healthy** -- so the verification step the coordinator's outline named would have read a successful migration as a **failure**. The coordinator could not have seen it; only the specialist's build-knowledge could, and only once licensed to step outside the outline.
- **WITHDRAWAL RECORDED**: team-lead first claimed Brunel's scratchpad already held the route (brief "strictly lossier"). **False** -- refuted by Brunel, withdrawn (`1a7ee44`), re-verified by the librarian at filing: the exec-route *pattern* is there, **the host address is not.** The brief was complementary. The finding survives on the better evidence (`docker port`); the withdrawn claim was self-critical, which is exactly why it went unchecked.
- **Mechanism (content-agnostic)**: brief carries authority -> coordinator's copy displaces the specialist's -> no displacement signal, so no reason to re-derive. n=2 across *different content kinds* is worth more than n=2 of one kind.
- **Cost is not duplicated effort** -- it is a defect the coordinator cannot see, sitting where the specialist was told not to look.
- **Lean brief != license.** A leaner brief protects delegated judgment, but contradiction has to be explicitly permitted; instance (b)'s defect surfaced *after* the floor sentence, not before.
- **Confidence medium, held**: same coordinator both times and the PO is the single catching vantage -- correlated. Path to high: an instance from a second coordinator, or from a delegation the PO did not review.
- **Not merged with `recursive-narrowing-substrate-truth-evidence-discipline`** -- that says each vantage catches its own error class; this says the brief can switch the vantage off. Sibling posture from the specialist side: `soft-verdict-discipline-on-substrate-mapping-briefs` (map, not verdict).
- **stage-2 pending** -- filed by the librarian from team-lead's submission; joint, three read-backs owed (team-lead, Brunel, Celes -- Celes as the anchored party in (a)).

(*FR:Aen* submitted; *FR:Brunel* and *FR:Celes* co-sources; *FR:Callimachus* filed)
