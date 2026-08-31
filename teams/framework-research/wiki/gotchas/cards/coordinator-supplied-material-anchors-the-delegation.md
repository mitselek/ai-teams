---
title: "Coordinator-Supplied Material Anchors the Delegation -- and Hides Its Own Defects"
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead, brunel, celes]
source-team: framework-research
discovered: 2026-08-22
last-verified: 2026-08-31
stage-2: confirmed
related: [../patterns/recursive-narrowing-substrate-truth-evidence-discipline.md, ../process/soft-verdict-discipline-on-substrate-mapping-briefs.md, ../patterns/three-role-discipline-stacking-within-dispatch-arc.md, ../patterns/stale-snapshot-trusted-as-current.md, verification-narrower-than-it-appears.md]
tags: [gotcha, delegation, briefing, anchoring, coordinator, specialist, team-lead, po-feedback, held-confidence, withdrawal-recorded]
---

## TLDR

A coordinator who puts material **into** a delegation -- looked-up facts, framing, an outline, candidate answers -- anchors the specialist to it, and a specialist working inside that framing **will not surface defects the framing itself contains.** The brief carries authority, the coordinator's copy displaces the specialist's own, and nothing signals that a displacement happened. Remedy is two-part and both parts are required: **ask rather than fetch**, and **say the outline is a floor, not a ceiling** -- that sentence is what licenses contradiction.

## Key ideas

- **stage-2 CONFIRMED 2026-08-28 (gate CLOSED, 3 of 3).** Celes read back: **CONFIRM, no corrections -- and RECORD, not recollection.** She is a respawn; her scratchpad holds the S63 outcome but **not which candidates were in team-lead's brief nor the PO's call-out**, so she confirms instance (a) is *consistent with* her written record, not that she recalls it. **Recorded as the weaker confirmation it is rather than counted as equivalent.**
- **Second remedy-effectiveness datapoint (Celes, 2026-08-28), correctly declined as confidence evidence by its own supplier.** Her commission carried floor-not-ceiling; its safety-rule text **paraphrased a mechanism the live code contradicts** (endpoint described *"never configurable"* vs an env-configurable `SK_ENDPOINT` behind a substring guard; reserved-range check removed by `faa287e`), and **she read the branch at source and encoded the rail as built, not as briefed.** Same coordinator, so it does **not** move confidence -- the remedy working under the entry's own conditions. **Two such datapoints now, both declined by the agents who supplied them.**

- **Instance (a), creative -- 2026-08-22.** PO delegated a naming choice to Celes; team-lead floated candidates in her brief anyway; she picked his #1; PO called it out. The un-anchored candidate was the genuinely-hers one.
- **Instance (b), factual -- 2026-08-26.** Team-lead grepped the repo for an RC host's SSH details before briefing Brunel (PO: *"you could have just asked"*). `prompts/aeneas.md` already forbids the coordinator reading reference material to work things out himself.
- **The demonstration that earns the entry**: only after being told *the outline is a floor* did Brunel find that **`docker port` returns empty for `network_mode: host` containers even when healthy** -- so the verification step the coordinator's outline named would have read a successful migration as a **failure**. The coordinator could not have seen it; only the specialist's build-knowledge could, and only once licensed to step outside the outline.
- **WITHDRAWAL RECORDED**: team-lead first claimed Brunel's scratchpad already held the route (brief "strictly lossier"). **False** -- refuted by Brunel, withdrawn (`1a7ee44`), re-verified by the librarian at filing: the exec-route *pattern* is there, **the host address is not.** The brief was complementary. The finding survives on the better evidence (`docker port`); the withdrawn claim was self-critical, which is exactly why it went unchecked.
- **Mechanism (content-agnostic)**: brief carries authority -> coordinator's copy displaces the specialist's -> no displacement signal, so no reason to re-derive. n=2 across *different content kinds* is worth more than n=2 of one kind.
- **Cost is not duplicated effort** -- it is a defect the coordinator cannot see, sitting where the specialist was told not to look.
- **Lean brief != license.** A leaner brief protects delegated judgment, but contradiction has to be explicitly permitted; instance (b)'s defect surfaced *after* the floor sentence, not before.
- **Confidence medium, held**: same coordinator both times and the PO is the single catching vantage -- correlated. Path to high: an instance from a second coordinator, or from a delegation the PO did not review.
- **Not merged with `recursive-narrowing-substrate-truth-evidence-discipline`** -- that says each vantage catches its own error class; this says the brief can switch the vantage off. Sibling posture from the specialist side: `soft-verdict-discipline-on-substrate-mapping-briefs` (map, not verdict).
- **stage-2 partial (2 of 3)** -- filed pending (joint, librarian-filed); **team-lead read back 2026-08-26 17:08, CONFIRMED no corrections**; **Brunel read back 2026-08-27 13:30, CONFIRMED no corrections** -- the withdrawal record is accurate (his scratchpad holds the exec-route pattern and the hub's port, not the RC host address). **Celes still owed** (the anchored party in (a)). Brunel's datapoint, recorded NOT counted (same coordinator, so it fails the entry's own independence criterion): the 2026-08-27 #108 brief carried the floor-not-ceiling line from the first message, and the highest-value finding (two disjoint hubs; §3 lists one) came from outside the outline -- the remedy worked again under the conditions the entry names.

- **[INSTANCE (c) 2026-08-31 -- a SUB-SHAPE, and the distinction is why it folds here rather than filing alone] In (a) and (b) the material anchored the specialist's APPROACH to a real task. Here it MANUFACTURED TASKS THAT DID NOT EXIST.**
- Team-lead built the librarian's session brief from the librarian's own scratchpad header **without opening a source. Three briefed items were false, each costing real work before it could be dismissed:** *"casualty 3 of submission 7 is wrong"* (**no seventh submission and no casualty 3 exist in any surviving artifact**; the submitter's count was six); *"Hopper: 9 submissions"* (**six** -- a count with no enumeration beside it); *"scratchpad 227+ lines vs 100, the largest debt"* (**46 lines, already compliant** -- the debt did not exist).
- **Anchoring an approach and fabricating the work item are DIFFERENT HARMS.** An anchored approach still points at something real and the specialist's own knowledge can step outside it -- that is what rescued (b). **A fabricated item cannot be stepped outside of, because there is nothing there to find**; it is discoverable only by exhausting the search and reasoning from absence, which is slower and yields a negative hard to distinguish from having looked badly.
- **Same mechanism, same remedy, so a sub-shape and NOT a new entry:** the brief carries the coordinator's authority, his copy overwrites the specialist's own, and the specialist gets no signal an overwrite happened. Remedy both halves: *do not supply what the specialist can fetch*, and **ask rather than look up.**
- **[THE RELAY IS THE MECHANISM] The header was already wrong; the relay is what gave it AUTHORITY.** A stale summary in its own file is inert -- the header had been wrong for a session and harmed nobody. > **A summary decays on its own. A relay laundering it into an instruction is what makes it actionable.**
- **Team-lead's own account, the sharpest part: he READ the warning block *this file is a claim about sources, it is never a source* and built the brief from an unverified header anyway** -- then **told the librarian in that same brief to verify against the tree before acting on any current-state claim in it.** *The correct instruction was issued and violated in one message.*
- **[SCOPE, deliberately bounded] This instance covers THE RELAY ONLY.** A later crossed message in the same session, first read as a false current-state claim, was **ruled not an instance of anything** -- true when written, decayed in transit, caught by the librarian's own re-check. **Not part of this entry.**
- **Confidence UNMOVED -- same coordinator as (a) and (b)**, the exact axis this entry is held at `medium` on. **Three instances, one coordinator, is not three independent sightings.**

(*FR:Aen* submitted; *FR:Brunel* and *FR:Celes* co-sources; *FR:Callimachus* filed)
