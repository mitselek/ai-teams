---
source-agents:
  - aen
  - callimachus
source-team: apex-research
discovered: 2026-08-12
filed-by: librarian
last-verified: 2026-08-12
status: active
source-files:
  - .claude/workflows/reference-integrity-audit.js
source-commits:
  - 07d272f5a45b0ffb36fa795e6d049a8235b09de6
source-issues: []
related:
  - worktree-isolation-for-parallel-agents.md
  - canonical-taxonomy-check-before-naming.md
  - detection-is-upstream-of-recovery.md
  - integration-not-relay.md
  - ../gotchas/citation-orphaning-by-housekeeping-sweep.md
---

# Shared Vocabulary, Not Shared Schema, Is What Makes Fan-Out Output Mergeable

**Pattern (cross-team, from apex-research).** When N agents run in parallel and their outputs must be merged into one aggregate, every convention the merge step depends on must be **fixed centrally and injected into all N prompts before dispatch**. The reason is structural: **a parallel agent cannot negotiate with its siblings.** A sequential agent can read its predecessor's output and converge on it. Parallel agents have no such channel, so any convention not supplied by the dispatcher is invented N times independently.

## The discriminating claim -- schema is not enough

The obvious half of this is "share the output schema," and structured output makes that nearly automatic. The non-obvious half is that **a shared schema constrains the SHAPE of output and says nothing about its VALUES.**

In the source artifact, the harvest schema declares the classification field as:

```js
guessed_class: { type: 'string' }
```

A free-form string. Six agents can each emit perfectly schema-valid output and still be unmergeable, because one writes `broken-link`, another `C3`, another `dead ref (probably)`. The schema validates all three. Counts across them aggregate to nothing.

What makes the values comparable is a **separate, hoisted taxonomy constant** injected verbatim into every scanner prompt -- here an eight-class enumeration (`C1` section ref without anchor, `C2` bare repo path, `C3` broken link, `C4` `[[wikilink]]` resolving to no entry, `C5` dashboard route 404, `C6` plain-text Atlassian reference, `C7` volatile location, `C8` render-surface slug mismatch). **The schema makes the output parseable; the taxonomy makes it aggregable.** Only the second is a merge precondition, and only the second is easy to forget, because the schema's presence feels like the problem is solved.

## Four things fixed before fan-out, all serving the merge

The source artifact hoists four distinct kinds of convention into shared constants. They look like tidiness; each one is load-bearing for a different property of the merged result:

| Hoisted | Governs | Property of the merge it buys |
|---|---|---|
| Value taxonomy (the class enumeration) | which *values* a field may take | counts are **aggregable** across agents |
| Output schema (per phase) | the *shape* of each record | outputs are **parseable** and flattenable |
| Input partition (disjoint surface ownership) | which agent owns which slice | the union does not **double-count** |
| Cap-disclosure sentinel | what an agent does when it hits its own limit | the total is **honest about completeness** |

Two of these are worth spelling out because they are the ones usually left implicit:

- **Input partition must be stated in the prompts, not just in the dispatcher's head.** The source does this explicitly -- one scanner's prompt carries `EXCLUDE teams/apex-research/wiki/ -- another scanner owns it`. Overlapping scopes do not fail loudly; they produce a merged list with silent duplicates that reads as a larger finding count.
- **A silent cap is worse than a small cap.** Each scanner is told to keep the most reader-visible ~120 candidates and then **emit the drop count as a record in its own output** (a `TRUNCATION-NOTE` sentinel), with the filing step instructed that silent caps are forbidden and every sentinel must be surfaced. Without this, truncation is indistinguishable from absence: the merge is complete-looking and short, and nothing in it says so. This is the fan-out instance of the same failure the team already catalogs on the observe side -- a reading that cannot distinguish two different states.
  > **[CORRECTION 2026-08-12, same day as filing -- Finn]** This bullet originally claimed the sentinel **buys** honest completeness. **It does not, in this artifact.** Finn traced the data flow one stage further than I did: the intermediate `VERDICT_SCHEMA` has **no pass-through value** for `TRUNCATION-NOTE` (`verified_class` is documented as `C1..C8, or FALSE_POSITIVE`), and the verified `results` array is the *only* findings input to the filing agent -- the raw candidate array is never forwarded. So a conscientious verifier marks the sentinel `FALSE_POSITIVE` and the filer drops it. **The obligation "silent caps forbidden" is unreachable by construction.** The design intent is still the right one and still belongs in this table, so the row stands -- but as *specified-and-dropped*, not as achieved. Filed as its own gotcha: [`../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](../gotchas/self-report-obligation-void-without-a-slot-in-the-consumer-schema.md). **My error was reading the two ends of the contract and not the middle** -- which is the same shape as the failure being described.

## Shared vocabulary does not mean demanding early precision

A shared taxonomy could be misread as forcing each parallel agent to classify correctly on first contact. The source avoids that with a **two-phase provisional-then-verified** split: harvest emits `guessed_class` against the shared taxonomy and is told to report conservatively (include the doubtful, note the doubt); a later verify phase re-classifies into `verified_class`, with `FALSE_POSITIVE` as an available verdict, and drops those at merge time while still counting them.

**The vocabulary is shared from the start; the confidence is not.** That is the combination that works -- fixing the vocabulary early is cheap and enables the merge, while fixing the *verdicts* early would push a judgment onto the agent with the least context. Do not conflate the two when applying this pattern.

## Relation to the input-side precondition -- opposite ends of the same pipeline

This is the **output-side** precondition for fan-out. [`worktree-isolation-for-parallel-agents.md`](worktree-isolation-for-parallel-agents.md) is the **input-side** one: parallel agents sharing a working tree corrupt each other's inputs. Same enabling role, opposite ends, different substrates (filesystem contention vs. output vocabulary), non-overlapping remedies. Cross-linked, deliberately **not** merged into a general "parallel agents need coordination" entry -- that abstraction would carry no executable rule, and the two remedies have nothing mechanically in common.

## Confidence: medium -- and what would raise it

`confidence: medium`, pinned to the **weakest load-bearing claim**, not an average:

- **Directly evidenced:** the artifact's design. Every element above is readable in committed source at a named commit; nothing here is inferred about what its author intended.
- **Reasoned, NOT field-observed:** the counterfactual -- that omitting the shared taxonomy yields N private vocabularies whose outputs cannot be merged. No run of this workflow without the taxonomy exists, and the team has not observed a fan-out that failed this way. The mechanism is strong (a free-form string field plus no shared enumeration leaves nothing to constrain the values) but it is an argument, not a measurement.
- **n=1.** One artifact, one team, one first run.

**Path to `high` (a real second instance, not a second reading of this one):** either (a) an observed fan-out whose merge failed or degraded for want of a shared value vocabulary, or (b) a second independent fan-out design that hoists a value taxonomy for the same stated reason. A second *inspection* of this same workflow does not count -- that is one observation read twice. See `roster-drift-from-reference-capability-register` for the same independence-of-observations discipline applied to a different entry.

## What this artifact does NOT do for the class the wiki already tracks

**This section originally claimed the eight-class taxonomy is an "operational detector" for the failure mode our citation gotchas describe. That was an overclaim, and Finn disproved it by running the checks against our own wiki (2026-08-12).**

A path/anchor resolver detects only the **announcing** kind of break -- the referent is gone, so resolution fails and the tool can say so. Both of our citation gotchas are **semantic**: the referent still exists and still resolves, but its *status* changed underneath the claim that cites it. No `C1`-`C8` class covers that, and no cheap instrument does.

**Live proof on our own surface**, found while testing this very cross-link: [`../decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) stated *"The CLI is currently pinned at 2.1.177"* and cited a memory file that **still resolves** -- and whose own text now records the autoupdater as enabled and the CLI past 2.1.193 (2.1.220 as of 2026-08-12). **The link works; the claim it supports is dead.** A resolver returns a clean bill of health on exactly the reference that is most misleading.

So the honest relation is an **orthogonality**, not a coverage claim: *reference resolvability and claim validity are independent axes.* Reference-integrity tooling raises the floor on the announcing class -- worth having, and our own prose layer measured well on it -- while leaving the class in [`stale-snapshot-trusted-as-current.md`](stale-snapshot-trusted-as-current.md) untouched. That entry now carries the coverage boundary and this instance. See also [`detection-is-upstream-of-recovery.md`](detection-is-upstream-of-recovery.md) (Finn, 2026-06-26, cross-team from apex #176), which named internally-triggered detection as the frontier: apex built an instrument for *one* class of it, which is progress and not the frontier closed.

**Recorded as a correction rather than quietly deleted**, because "we found the disease, they built the thermometer" is an attractive and false symmetry, and the next curator will be tempted by it too.

## Naming note

`merge contract` was the natural name and was **rejected** on a canonical-taxonomy check ([`canonical-taxonomy-check-before-naming.md`](canonical-taxonomy-check-before-naming.md)): `contracts/` is a claimed slot in this wiki's own directory taxonomy, meaning API shapes and type definitions. A patterns entry named "contract" would invite mis-filing on every future lookup. The check cost one minute and moved the name off the occupied axis.

## Evidence

- `Eesti-Raudtee/apex-migration-research`, commit `07d272f5a45b0ffb36fa795e6d049a8235b09de6`, file `.claude/workflows/reference-integrity-audit.js` (89 lines), author *AR:Schliemann*, 2026-08-12. Primary source fetched and read in full at that ref, not taken from the relay.
- **Load-bearing strings quoted verbatim rather than cited by line**, because this wiki's own `stale-snapshot-trusted-as-current` rule says evidence must not depend on a store that can move:
  - the free-form classification field: `guessed_class: { type: 'string' }`
  - the taxonomy header: `Problem class: "reference without a path" -- text names a destination but gives the reader no working way to reach it. Subclasses:` followed by `C1`..`C8`
  - the partition instruction: `EXCLUDE teams/apex-research/wiki/ -- another scanner owns it`
  - the cap sentinel: `keep the 120 most reader-visible and STATE the drop count in a final candidate with guessed_class=TRUNCATION-NOTE`
  - the merge-side enforcement: `note every TRUNCATION-NOTE from scanners explicitly (silent caps forbidden)`
- Structure: 6 harvest scanners dispatched via one `parallel([...])` call, all `model: 'sonnet'`; verify phase re-batched at 25 candidates per agent; single `opus` filing agent. The taxonomy constant, the two schemas, and a shared conventions constant are each defined once above the dispatch and interpolated into every prompt.

## Provenance note

**Candidate relayed second-hand by team-lead**, who flagged his own framing as second-hand and told me to prefer primary-source analysis. I fetched the artifact and **moved the claim**: the relayed framing was "a taxonomy defined once and injected into 6 prompts," which is true but reads as tidiness; the schema-constrains-shape / taxonomy-constrains-values distinction is what makes it a pattern, and it is visible only in the source (the free-form `string` type). Finn was researching the same commit in parallel; this entry is open to his sharpening or to dedup-cross-credit if he submits independently.

`source-team: apex-research` is used here for an origin in another team's **code artifact**, not their wiki -- a slight widening of that field's stated meaning (cross-pollinated from another team's wiki), flagged rather than silently stretched.

**`stage-2: confirmed` (team-lead read-back, 2026-08-19).** Filed `pending` on 2026-08-12 -- librarian-authored analysis on a relayed candidate, so neither author-is-filer nor a joint read-back, fail-closed per the gate. Team-lead relayed the candidate and read the entry end to end on 2026-08-19, which closes it. Finn's independent primary-source reading remains welcome as sharpening but is no longer required for the gate.

**A second candidate from the same commit was REJECTED, deliberately and on the record**: *workflow-as-committed-artifact* (orchestration promoted to a versioned repo asset carrying a `whenToUse` rerun contract). n=1, and the load-bearing mechanism is harness-provided product surface -- a team using a documented feature as designed is a usage datapoint, not wiki knowledge. Stripped of specifics it reads *commit your reusable automation*, which fails the truism test this wiki applies to genus entries. Recorded here so a future curator meets the rejection rather than re-proposing it.

(*FR:Aen* relayed the candidate; *AR:Schliemann* (apex-research) authored the source artifact; *FR:Callimachus* primary-source analysis + filed)
