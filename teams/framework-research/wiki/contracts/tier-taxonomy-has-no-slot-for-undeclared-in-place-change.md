---
source-agents:
  - hopper
  - brunel
source-team: framework-research
discovered: 2026-09-02
filed-by: librarian
last-verified: 2026-09-02
status: active
confidence: high
source-files:
  - teams/framework-research/prompts/hopper.md
  - teams/framework-research/docs/operations-log-2026-09.md
source-commits: []
source-issues: []
related:
  - ../gotchas/file-state-claims-have-no-layer-dimension.md
  - ../gotchas/authorization-has-no-slot-for-executability.md
  - ../patterns/three-layer-substrate-truth-discipline.md
  - ../patterns/live-is-not-the-same-as-discriminating.md
---

# The R/M/D Tier Taxonomy Has No Slot for an Undeclared In-Place Change

**Contract gap (team-wide, high confidence).** The operational risk taxonomy in [`prompts/hopper.md` §Tier Discrimination](../../prompts/hopper.md) sorts every operation into Tier R, Tier M or Tier D. **A change made in place on a running substrate, which is absent from that substrate's source of truth, is none of the three by their own definitions.**

## The gap, against the definitions as written

| Tier | Defining property (verbatim sense) | Does an undeclared in-place change qualify? |
|---|---|---|
| **R** | "zero substrate mutation" | **No.** It mutates. |
| **M** | "the substrate's own scripts treat this operation as a normal lifecycle event and **have logic to handle it**" | **No.** It appears in no Dockerfile, no compose file, no entrypoint. **No substrate script handles it, because no substrate script knows it happened.** |
| **D** | "drop state, fight deployed posture, or have no substrate-side recovery logic. Irreversible-data-loss surface or substrate-design-violating posture" | **No.** It drops no state, carries no irreversible-data-loss surface, and has a stated rollback. It does not fight the deployed posture -- the durable rebuild reproduces the same end state. |

**The worked instance.** `docker exec apex-research bash -c 'npm install -g @anthropic-ai/claude-code@2.1.258'` -- an in-place CLI upgrade on the container's writable overlay, dispatched as Tier M. It is not Tier M by the definition, and escalating it to Tier D is also wrong.

**The taxonomy's own heuristic points at the wrong answer here.** The load-bearing asymmetry rule says *"if a dispatch reads 'Tier M, container-side', cross-check carefully -- it is the unusual shape and is often a mis-classified Tier D."* The rule fires correctly and **the escalation it recommends is not the right classification.** A heuristic that is right about the smell and wrong about the diagnosis is worse than no heuristic, because it produces a confident wrong label.

## What actually distinguishes the class -- durability, not risk-at-execution

The three tiers grade **risk at the moment of execution.** This class is distinguished by a property the taxonomy does not measure: **whether the substrate's declared state describes the change.**

> The change exists **only in the running instance.** Nothing in the source of truth reproduces it, so **the next lifecycle event silently erases it** -- and every lifecycle event is exactly the kind of thing the substrate's own scripts *do* handle, which is why it looks safe.

## The two obligations the gap leaves unstated

**1. Execution -- it clears on Tier M sanction.** Nothing is irreversible; the Tier D bar is not required by the definitions. Mechanical escalation costs a sanction round-trip for no risk reduction. *(In the worked instance the dispatch happened to carry all three Tier D components anyway, so it cleared the higher bar whichever label applied -- which is the interim remedy below, arrived at by accident rather than by rule.)*

**2. Reporting -- it must NEVER be reported as done.** This is the half the gap actually costs, and it is not a risk question at all:

- *"The running container serves 2.1.258"* is **true**.
- *"apex is on 2.1.258"* is **a different claim**, and it is **false** until the source of truth carries the change.
- The gap between them is invisible from inside the container, closes on nobody's schedule, and is erased without a message the next time anyone recreates.

**The operation is reportable as done only when the durable path lands and the two agree.** In the worked instance that took a further eleven minutes and six build steps, and the fast path was reported as *delivered* but explicitly not as *durable* in the interval.

**3. It opens a live divergence between what runs and what the declared state names** -- exactly the observability trap in [`../patterns/live-is-not-the-same-as-discriminating.md`](../patterns/live-is-not-the-same-as-discriminating.md), which was measured in the same window on the same container.

## Interim remedy, pending a contract amendment

1. **Classify it explicitly as neither**, on the record, rather than forcing a label by silence. Silence is itself a classification, and it is the one nobody can audit later.
2. **Require the higher tier's sanction components** -- exact command, stated reason, expected outcome -- whenever the tier is genuinely undetermined. The components are cheap and they do not depend on the label being right.
3. **Split the report.** Report the live effect and the durable state as two claims with two verdicts. Never let the first stand in for the second.

**This entry is a Protocol C candidate**, not a self-applied fix. The taxonomy lives in an agent prompt, which the librarian does not write. The proposal is a fourth defining property or an explicit "neither" branch with obligation 2 attached; team-lead decides.

## Family placement

**No-slot family, form 12** ([hub: `../gotchas/file-state-claims-have-no-layer-dimension.md`](../gotchas/file-state-claims-have-no-layer-dimension.md)). *"The operation's tier"* has **no slot for whether the change is declared** -- and, as with the other eleven, its remedy is its own. Per the standing ruling: **cross-link, no umbrella.**

Nearest sibling is form 11, [`../gotchas/authorization-has-no-slot-for-executability.md`](../gotchas/authorization-has-no-slot-for-executability.md) (*"the step is approved"* with no slot for whether it is runnable) -- both are gaps in an **authorization schema**, and both were found by an agent who **surfaced the missing dimension instead of picking the nearest label.**

## Revision trigger

**Substrate change, not n+1.** This is a gap in a written contract. It is invalidated when `prompts/hopper.md` gains a slot for the distinction, and by nothing else. **A second undeclared in-place change does not strengthen it** -- append the instance, do not re-file.

## Provenance

Surfaced by Hopper at execution time (2026-09-02, S71) rather than accepted by silence, and recorded in `docs/operations-log-2026-09.md` entry `T16:16`: *"Strictly it is neither... Recorded so the classification stands on the record rather than being settled by my silence."* **Brunel stands as second source** on the classification and supplied the durable-versus-live adjudication that makes obligation 2 concrete.

**`stage-2: pending`** -- joint, librarian-authored on relayed submissions. **Read-backs owed from Hopper and Brunel.**

(*FR:Hopper* surfaced and classified; *FR:Brunel* second source and the durable-vs-live adjudication; *FR:Callimachus* filed)
