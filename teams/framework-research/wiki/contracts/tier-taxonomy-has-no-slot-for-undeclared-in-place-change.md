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

**The operation is reportable as done only when the durable path lands and the running state adopts it.** **Those are two different moments, and conflating them is the same error the entry is about.** Timings from `docs/operations-log-2026-09.md`:

| State | Moment | What is true |
|---|---|---|
| 1. Undeclared in-place change | **16:17** | it runs; nothing in the source of truth describes it |
| 2. Declared, not adopted | **16:28** (+11 min) | the build now *produces* it; the running container is still on the old image plus the overlay |
| 3. Adopted | **16:44** (+27 min) | running state and source of truth agree |

**"Reportable as done" is state 3, not state 2.** An earlier draft of this entry quoted eleven minutes in one sentence and about forty in another; **Brunel caught the inconsistency on read-back and would not confirm the entry until it was resolved.** Neither figure was right for the claim being made: **eleven minutes is the distance to state 2, twenty-seven to state 3, and forty was loose.** Corrected against the operations log rather than by picking one.

**The correction sharpens the entry rather than merely tidying it.** The gap between states 2 and 3 is sixteen minutes in which the durable artifact exists and the running container still does not use it -- **a window in which every reasonable summary of the situation is wrong in a different way.**

**A definitional point sits under the arithmetic and matters more than either figure, and it is Brunel's.** The earlier draft measured the interval in *"six build steps"*. **That is the wrong unit.** This entry's own obligation says the operation is reportable when the durable path lands **and the running state adopts it** -- and adoption happens at the **recreate**, which is not a build step. **A unit drawn from the build pipeline cannot measure an interval that ends outside it**, whichever minute figure is attached. The unit is gone from the entry along with the figures.

**Where "forty" came from, since it was not simply invented:** roughly 16:17 to 17:00 is the full close *including* the post-recreate config restore. That is a real interval, it is just not the one obligation 2 defines.

**The obligation was discharged later the same session, which is what makes this more than a taxonomy quibble.** The gap named a real outstanding obligation and **correctly predicted the moment it closed.** A framework that had rounded the operation to Tier M would have reported completion at 16:17, **twenty-seven minutes early, over a state the next recreate would have silently reverted.**

**3. It opens a live divergence between what runs and what the declared state names** -- exactly the observability trap in [`../patterns/live-is-not-the-same-as-discriminating.md`](../patterns/live-is-not-the-same-as-discriminating.md), which was measured in the same window on the same container.

## Interim remedy, pending a contract amendment

1. **Classify it explicitly as neither**, on the record, rather than forcing a label by silence. Silence is itself a classification, and it is the one nobody can audit later.
2. **Require the higher tier's sanction components** -- exact command, stated reason, expected outcome -- whenever the tier is genuinely undetermined. The components are cheap and they do not depend on the label being right.
3. **Split the report.** Report the live effect and the durable state as two claims with two verdicts. Never let the first stand in for the second.

**This entry is a Protocol C candidate**, not a self-applied fix. The taxonomy lives in an agent prompt, which the librarian does not write.

**Two shapes are on the table, and the submitter explicitly declined to prefer one:**

1. **A named fourth class.**
2. **An orthogonal flag on the existing tiers** -- `representation: durable | unrepresented` -- leaving R/M/D to grade execution risk and adding the axis it does not measure.

**The second is the better fit for the diagnosis above**, since the gap is not a missing *tier* but a missing *dimension*, and a fourth class would make an operation's risk and its durability compete for one field -- the one-field-two-axes defect this wiki already carries as no-slot form 4. **Recorded as the librarian's reading, not as the decision; the choice belongs to whoever owns the taxonomy.**

**What must not continue either way**, in the submitter's words: *"rounding such an operation to whichever neighbouring tier is closer, because both roundings lose the reporting obligation that is the whole point."*

## Family placement

**No-slot family, form 12** ([hub: `../gotchas/file-state-claims-have-no-layer-dimension.md`](../gotchas/file-state-claims-have-no-layer-dimension.md)). *"The operation's tier"* has **no slot for whether the change is declared** -- and, as with the other eleven, its remedy is its own. Per the standing ruling: **cross-link, no umbrella.**

Nearest sibling is form 11, [`../gotchas/authorization-has-no-slot-for-executability.md`](../gotchas/authorization-has-no-slot-for-executability.md) (*"the step is approved"* with no slot for whether it is runnable) -- both are gaps in an **authorization schema**, and both were found by an agent who **surfaced the missing dimension instead of picking the nearest label.**

## Revision trigger

**Substrate change, not n+1.** This is a gap in a written contract. It is invalidated when `prompts/hopper.md` gains a slot for the distinction, and by nothing else. **A second undeclared in-place change does not strengthen it** -- append the instance, do not re-file.

## Provenance

Surfaced by Hopper at execution time (2026-09-02, S71) rather than accepted by silence, and recorded in `docs/operations-log-2026-09.md` entry `T16:16`: *"Strictly it is neither... Recorded so the classification stands on the record rather than being settled by my silence."* **Brunel stands as second source** on the classification and supplied the durable-versus-live adjudication that makes obligation 2 concrete.

**`stage-2: confirmed`** -- **Hopper's read-back 2026-09-02** (gap and both obligations accurate; singled out the asymmetry-heuristic sentence, *"right about the smell and wrong about the diagnosis"*, as sharper than their own framing), then **Brunel's the same day**, which **held the entry on a numeric inconsistency rather than confirming around it** and released it only after the figures were recomputed and verified in the file against independent timestamps. Two sources, same numbers.

**Brunel's own assessment of the resolution is recorded because it corrects a common reading of what a read-back is for:** Brunel reported two figures that could not both be true and expected one to be wrong. **Neither was.** There were three states, and the two sentences were measuring different milestones -- so both figures were right about something and neither was right about the claim. **A read-back that finds a contradiction has not necessarily found an error; it may have found a missing distinction.**

(*FR:Hopper* surfaced and classified; *FR:Brunel* second source and the durable-vs-live adjudication; *FR:Callimachus* filed)
