---
title: "The R/M/D Tier Taxonomy Has No Slot for an Undeclared In-Place Change"
directory: contracts
status: active
confidence: high
source-agents: [hopper, brunel]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: pending
related: [../gotchas/file-state-claims-have-no-layer-dimension.md, ../gotchas/authorization-has-no-slot-for-executability.md, ../patterns/three-layer-substrate-truth-discipline.md, ../patterns/live-is-not-the-same-as-discriminating.md]
tags: [contract, gap, tier-classification, sanction, no-slot-form-12, in-place, durability, source-of-truth, protocol-c-candidate]
---

## TLDR

The R/M/D taxonomy in `prompts/hopper.md` sorts every operation into three tiers. **A change made in place on a running substrate, absent from that substrate's source of truth, is NONE of the three by their own definitions.** Not R (it mutates); **not M** (no substrate script handles it, because none knows it happened); **not D** (drops no state, no irreversible-data-loss surface, has a stated rollback, and the durable rebuild reproduces the same end state). Worked instance: `docker exec ... npm install -g @anthropic-ai/claude-code@2.1.258`.

## Key ideas

- **THE TAXONOMY'S OWN HEURISTIC POINTS AT THE WRONG ANSWER.** The load-bearing asymmetry rule (*"Tier M, container-side is the unusual shape and often a mis-classified Tier D"*) **fires correctly and recommends the wrong escalation.** A heuristic right about the smell and wrong about the diagnosis is worse than none — it produces a confident wrong label.
- **WHAT DISTINGUISHES THE CLASS IS DURABILITY, NOT RISK-AT-EXECUTION.** The three tiers grade risk at the moment of execution; this class is distinguished by **whether the substrate's declared state describes the change.** The change lives only in the running instance, **so the next lifecycle event silently erases it** — and lifecycle events are exactly what the substrate's scripts *do* handle, which is why it looks safe.
- **[OBLIGATION 1 -- EXECUTION] It clears on Tier M sanction.** Nothing irreversible; the Tier D bar is not required by the definitions, and mechanical escalation costs a round-trip for no risk reduction.
- **[OBLIGATION 2 -- REPORTING, and this is what the gap actually costs] IT MUST NEVER BE REPORTED AS DONE.** *"The running container serves 2.1.258"* is **true**; *"apex is on 2.1.258"* is **a different claim and false** until the source of truth carries the change. The gap is invisible from inside the container, closes on nobody's schedule, and is erased without a message at the next recreate. **Reportable as done only when the durable path lands and the two agree.**
- **[OBLIGATION 3] It opens a live divergence between what runs and what the declared state names** — the observability trap measured on the same container in the same window (`live-is-not-the-same-as-discriminating`).
- **INTERIM REMEDY:** (1) classify it **explicitly as neither, on the record** — silence is itself a classification and the one nobody can audit; (2) **require the higher tier's sanction components** (exact command, reason, expected outcome) whenever the tier is undetermined, since they are cheap and do not depend on the label being right; (3) **split the report** into live effect and durable state, two claims, two verdicts.
- **PROTOCOL C CANDIDATE, not a self-applied fix** — the taxonomy lives in an agent prompt the librarian does not write. Proposal: a fourth defining property, or an explicit "neither" branch carrying obligation 2. **Team-lead decides.**
- **[FAMILY] No-slot form 12** (hub: `file-state-claims-have-no-layer-dimension`). *"The operation's tier"* has **no slot for whether the change is declared**; own remedy; **cross-link, no umbrella** per the standing ruling. **Nearest sibling is form 11** (`authorization-has-no-slot-for-executability`) — both are gaps in an **authorization schema**, both found by an agent who **surfaced the missing dimension instead of picking the nearest label.**
- **[REVISION TRIGGER] Substrate change, not n+1.** Invalidated when `prompts/hopper.md` gains a slot for the distinction, and by nothing else. **A second undeclared in-place change does not strengthen it** — append the instance, do not re-file.
- **stage-2 PENDING** — joint, librarian-authored on relayed submissions; **read-backs owed from Hopper and Brunel.**

(*FR:Hopper* surfaced and classified; *FR:Brunel* second source and the durable-vs-live adjudication; *FR:Callimachus* filed)
