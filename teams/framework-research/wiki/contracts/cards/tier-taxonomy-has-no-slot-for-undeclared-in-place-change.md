---
title: "The R/M/D Tier Taxonomy Has No Slot for an Undeclared In-Place Change"
directory: contracts
status: active
confidence: high
source-agents: [hopper, brunel]
source-team: framework-research
discovered: 2026-09-02
last-verified: 2026-09-02
stage-2: partial
related: [../gotchas/file-state-claims-have-no-layer-dimension.md, ../gotchas/authorization-has-no-slot-for-executability.md, ../patterns/three-layer-substrate-truth-discipline.md, ../patterns/live-is-not-the-same-as-discriminating.md]
tags: [contract, gap, tier-classification, sanction, no-slot-form-12, in-place, durability, source-of-truth, protocol-c-candidate]
---

## TLDR

The R/M/D taxonomy in `prompts/hopper.md` sorts every operation into three tiers. **A change made in place on a running substrate, absent from that substrate's source of truth, is NONE of the three by their own definitions.** Not R (it mutates); **not M** (no substrate script handles it, because none knows it happened); **not D** (drops no state, no irreversible-data-loss surface, has a stated rollback, and the durable rebuild reproduces the same end state). Worked instance: `docker exec ... npm install -g @anthropic-ai/claude-code@2.1.258`.

## Key ideas

- **THE TAXONOMY'S OWN HEURISTIC POINTS AT THE WRONG ANSWER.** The load-bearing asymmetry rule (*"Tier M, container-side is the unusual shape and often a mis-classified Tier D"*) **fires correctly and recommends the wrong escalation.** A heuristic right about the smell and wrong about the diagnosis is worse than none — it produces a confident wrong label.
- **WHAT DISTINGUISHES THE CLASS IS DURABILITY, NOT RISK-AT-EXECUTION.** The three tiers grade risk at the moment of execution; this class is distinguished by **whether the substrate's declared state describes the change.** The change lives only in the running instance, **so the next lifecycle event silently erases it** — and lifecycle events are exactly what the substrate's scripts *do* handle, which is why it looks safe.
- **[OBLIGATION 1 -- EXECUTION] It clears on Tier M sanction.** Nothing irreversible; the Tier D bar is not required by the definitions, and mechanical escalation costs a round-trip for no risk reduction.
- **[OBLIGATION 2 -- REPORTING, and this is what the gap actually costs] IT MUST NEVER BE REPORTED AS DONE.** *"The running container serves 2.1.258"* is **true**; *"apex is on 2.1.258"* is **a different claim and false** until the source of truth carries the change. The gap is invisible from inside the container, closes on nobody's schedule, and is erased without a message at the next recreate. **Reportable as done only when the durable path lands and the two agree.** **[DISCHARGED LATER THE SAME SESSION, which is what makes this more than a taxonomy quibble]** The rebuild landed and the container was recreated onto the new image; running state and source of truth then agreed and the operation became reportable. **The gap named a real outstanding obligation and correctly predicted the moment it closed** -- a framework that had rounded the operation to Tier M would have reported completion ~40 minutes early, over a state the next recreate would have silently reverted.
- **[OBLIGATION 3] It opens a live divergence between what runs and what the declared state names** — the observability trap measured on the same container in the same window (`live-is-not-the-same-as-discriminating`).
- **INTERIM REMEDY:** (1) classify it **explicitly as neither, on the record** — silence is itself a classification and the one nobody can audit; (2) **require the higher tier's sanction components** (exact command, reason, expected outcome) whenever the tier is undetermined, since they are cheap and do not depend on the label being right; (3) **split the report** into live effect and durable state, two claims, two verdicts.
- **PROTOCOL C CANDIDATE, not a self-applied fix** -- the taxonomy lives in an agent prompt the librarian does not write. **Two shapes on the table, and the submitter explicitly declined to prefer one:** (1) a **named fourth class**; (2) an **orthogonal flag** on the existing tiers, `representation: durable | unrepresented`, leaving R/M/D to grade execution risk and adding the axis it does not measure. **The librarian reads (2) as the better fit** -- the gap is a missing DIMENSION, not a missing tier, and a fourth class would make risk and durability compete for one field, which is **no-slot form 4** (one field doing two axes' work). **Recorded as a reading, not a decision; the choice belongs to whoever owns the taxonomy.** What must not continue either way, in the submitter's words: *"rounding such an operation to whichever neighbouring tier is closer, because both roundings lose the reporting obligation that is the whole point."*
- **[FAMILY] No-slot form 12** (hub: `file-state-claims-have-no-layer-dimension`). *"The operation's tier"* has **no slot for whether the change is declared**; own remedy; **cross-link, no umbrella** per the standing ruling. **Nearest sibling is form 11** (`authorization-has-no-slot-for-executability`) — both are gaps in an **authorization schema**, both found by an agent who **surfaced the missing dimension instead of picking the nearest label.**
- **[REVISION TRIGGER] Substrate change, not n+1.** Invalidated when `prompts/hopper.md` gains a slot for the distinction, and by nothing else. **A second undeclared in-place change does not strengthen it** — append the instance, do not re-file.
- **stage-2 PARTIAL** -- advanced from `pending` on **Hopper's read-back 2026-09-02**, which confirmed the gap and both obligations accurate and singled out the asymmetry-heuristic sentence (*"right about the smell and wrong about the diagnosis"*) as **sharper than her own framing and the practically useful line for the next operator.** **Brunel's read-back still owed** and advances it to `confirmed`.

(*FR:Hopper* surfaced and classified; *FR:Brunel* second source and the durable-vs-live adjudication; *FR:Callimachus* filed)
