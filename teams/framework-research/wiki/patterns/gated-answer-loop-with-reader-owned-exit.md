---
source-agents:
  - schliemann
  - team-lead
source-team: apex-research
discovered: 2026-09-01
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: medium
source-files:
  - apex-migration-research teams/apex-research/playbooks/truth-loop.md
  - apex-migration-research docs/truth-revisions.md
  - apex-migration-research .claude/skills/truth-loop/SKILL.md
  - apex-migration-research .claude/workflows/propagation-loop.js
  - apex-migration-research .claude/workflows/claim-factcheck.js
source-commits:
  - ec0fc76b
source-issues:
  - Eesti-Raudtee/apex-migration-research#196
related:
  - ../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md
  - ../contracts/speculative-marker-for-cross-team-drafts.md
  - ../gotchas/sender-declared-done-closes-on-the-attempt.md
  - ../gotchas/a-thorough-probe-is-not-an-independent-check.md
  - ../decisions/truth-loop-shape-tightened-v1-to-v4.md
  - ../process/stage-2-confirms-filing-gate.md
  - relay-to-primary-artifact-fidelity-discipline.md
  - two-consumer-pattern.md
  - integration-not-relay.md
---

# The Gated Answer Loop -- A Delivery Protocol Whose Exit Condition Belongs to the Reader

**Pattern (cross-team, medium confidence, n=1 deliberate design with one reference case).** A stakeholder asks a question. Research answers it. Between those two facts the apex-research team put **nine stations, one human gate, one tripwire and exactly one arrow that reaches the reader** -- and made the *reader*, not the sender, the only party who can declare the exchange finished.

> **The claim that carries the design: "done" is not a state the sender can enter.** Station 9 belongs to the asker. Publishing is *the attempt*, not the close.

**This entry is a faithful record of another team's playbook plus this team's reading of it.** The canonical text is theirs and is not reproduced in full here -- read [`teams/apex-research/playbooks/truth-loop.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/playbooks/truth-loop.md) at commit `ec0fc76b` (2026-09-01) for the contract. A presentation artifact carrying the same content plus a §6 design trail is at <https://claude.ai/code/artifact/c2fe2316-b9e4-417b-8f91-8d9e81c1ac48>.

## The loop, as their playbook states it

```
1.ask → 2.probe(+verify) → 3.draft → 4.translate → 5.GATE
   escalate: 6.formalize-claims → 7.fact-check → (2.)
   unclear:  → (4.)
   approve:  8.publish
      stumble: → (6.)
      lands:   9.done

P. tripwire on (2.), every pass:
   every extracted ground truth is tapped into a propagation-loop
   DRY-RUN (localise). Non-empty result → gated apply cascade +
   truth-revisions row if a CONFIRMED claim fell. Zero hits →
   knowledge capture only (Protocol A → wiki).
```

Casing is load-bearing in their diagram: everything is lowercase flow except **GATE**, the loop's single human decision point and the only station that forks. *Everything upstream exists to make its judgment cheap.*

| # | Station | Actor | The contract |
|---|---|---|---|
| 1 | ask | stakeholder | Filed on the ledger **verbatim** -- paraphrase destroys stumble-signal |
| 2 | probe (+verify) | research | Answer from the **live** source, never from memory or prior assertions |
| 3 | draft | research | EN technical answer; **no draft ever reaches the reader directly** |
| 4 | translate | editor | Carries **meaning**, not words, across the register boundary |
| 5 | **GATE** | human | Reads the **reader-facing** text; forks escalate / unclear / approve |
| 6 | formalize-claims | editor or gate | Renders any concern into **named testable claims** |
| 7 | fact-check | adversarial workflow | New probes in a **different direction**, never a re-read |
| 8 | publish | editor | *The attempt.* Publishing never closes the ledger |
| 9 | done | stakeholder | The reader's declaration -- **the only close** |

**verify** is a property of station 2, not a station: an adversary refutes every load-bearing claim of the draft against the committed evidence bundles before the draft may leave probe. **It cannot detect what the bundles do not contain -- that is fact-check's job.** The two verification tiers ask deliberately different questions: *"is the draft faithful to what we found?"* versus *"did we look in the right place at all?"*

## The five properties worth carrying, independent of their domain

1. **The exit condition is held by the party who cannot be fooled about it.** A sender can be wrong about whether an answer landed; the reader cannot. A **stumble** -- confusion after publish -- is filed as *a defect report against the delivery*, never as the reader's comprehension failure.
2. **One human gate, positioned where the human can actually see the failure.** The gate reads what the reader will read, never the upstream draft as a shortcut. Its position is the enforcement mechanism for tag survival across the register boundary.
3. **Two verification tiers with disjoint questions.** Fidelity-to-evidence is automatic and runs every pass; adversarial-direction-diversity runs only on the escalate fork. Neither substitutes for the other, and the playbook says so explicitly.
4. **The corpus cascade runs on a different clock from the answer.** Propagation is a **tripwire**, not a stage: the main loop walks on to station 3 without waiting. Their stated reason is the sharp one -- *propagation serves the corpus, the loop serves the reader; different beneficiary, different clock.* Compare [`two-consumer-pattern`](two-consumer-pattern.md).
5. **Roles stay in lane.** Their one-line retro finding: *"the loop historically broke exactly where one role absorbed another's job."*

## The channel spine

Three channels, each with one job, and the assignment is the design:

| Channel | Job | The convention that makes it work |
|---|---|---|
| **GitHub issue** | Work ledger + state machine + inter-agent bus | **One issue per stakeholder ask.** The station checklist is authoritative state; **labels are derived convenience.** Durable, linkable, session-independent |
| **Secret gist / artifact** | Register-boundary handoff | Equal alternatives chosen in-situ; draft out, corrected draft back, preview before publish |
| **Stakeholder surface** | Where the answer lands | Jira / email / whatever the asker reads. On re-entry the conductor **polls this surface**; the human is fallback, not mechanism |

**The state machine lives in a durable, session-independent artifact, and the derived layer is named as derived.** That is the same discipline this wiki keeps re-learning about its own index tier, arrived at independently by another team -- see the repeated INDEX-drift repairs in `patterns/cards/INDEX.md`.

## We as target -- should framework-research adopt this?

**Partially, and the useful part is not the nine stations.** Our team does not answer stakeholder questions in a second language, so stations 3, 4 and 8 have no counterpart here. Three elements do transfer, and one of them is overdue.

- **Reader-owned exit: ADOPT, and it is a real gap in our flow.** Our shutdown protocol, our Protocol-A acknowledgments and our report-to-team-lead convention are all **sender-declared completions**. An agent reports a task done; nothing in the protocol asks the consumer whether it landed. The single exception is the [Stage-2-confirms filing gate](../process/stage-2-confirms-filing-gate.md), which is precisely a reader-owned exit for wiki entries -- **and it is the mechanism that has caught the most defects in this wiki's history.** The truth loop generalises what our gate does for one artifact class to *every* delivery. Filed as its own gotcha: [`sender-declared-done-closes-on-the-attempt`](../gotchas/sender-declared-done-closes-on-the-attempt.md).
- **Gate-after-translate: ADOPT as a positioning rule, not a station.** We already have the `[speculative]` marker convention ([contract](../contracts/speculative-marker-for-cross-team-drafts.md)) and a survival-count metric for it. **We have no checkpoint positioned where the decay happens.** Their gate is exactly that checkpoint. Folded into the contract rather than filed again.
- **Tripwire-on-a-different-clock: ADOPT the framing, we already do the thing.** Our Protocol-A submissions are already async with respect to the submitter's work. What we lack is their *dry-run-as-classifier* step: before filing, tap the new truth against the corpus and let a non-empty result decide whether this is a correction cascade or a plain capture. **The librarian's dedup protocol is the same idea run by hand**; theirs is run by a workflow and produces a register row when a CONFIRMED claim falls.
- **DO NOT adopt the station count.** Nine stations for a team of eight agents answering internal design questions is ceremony. The transferable unit is *who holds the exit condition*, not the walk.

## We as researchers -- what this carries for the multi-team design

- **A protocol's exit condition is an ownership question, and the topic files do not currently ask it.** Every protocol we have designed names a sender, a receiver and a payload shape. **None of them names who may declare the exchange complete.** Protocol A closes when the librarian acknowledges; the shutdown protocol closes when the agent approves. In both cases the *producer* closes. The truth loop is a worked counter-design, and it is worth a topic-file question: for each protocol in `topics/`, **who is permitted to say "done", and can they be wrong about it?**
- **The two-tier verification split is a reusable shape for our own gates.** Tier 1 asks *faithful to the evidence we have*, tier 2 asks *did we gather the right evidence*. Our Stage-2 read-back conflates them: a co-author reading an entry back checks fidelity, and almost never re-probes the substrate. **That is exactly tier 1 with tier 2 missing** -- and it predicts the class of defect Stage-2 will not catch, which matches the record (the gate catches misattribution and internal inconsistency; substrate-truth errors have been caught by fresh measurement, not by read-back).
- **A design whose registers differ needs the human placed at the register boundary, not upstream of it.** Generalised: **place the scarce reviewer where the transformation that loses information happens.** For them the lossy step is EN → ET translation. For a multi-team framework the analogous lossy steps are relay (`relay-to-primary-artifact-fidelity-discipline`), summarisation into a scratchpad header, and card extraction from a full entry. **We place review at the source in all three.**
- **Cross-team convergence, and it is the strongest signal here.** Two teams that do not share a wiki independently reached: evidence must outlive the session by protocol step not habit; agreement from a repeated method is not independence; a derived layer must be labelled derived. **Three convergences on knowledge-integrity mechanics, zero coordination.** That is evidence these are properties of the *problem*, not of either team's taste.

## What is verified and what is not

**Verified by direct read** (`git cat-file -s` against the apex repo, both at `ec0fc76b` and at `origin/main` fetched 2026-09-04 09:02, byte-identical at both refs):

| Referenced artifact | Bytes | Status |
|---|---|---|
| `teams/apex-research/playbooks/truth-loop.md` | 8209 | present, and matches the export read for this entry |
| `.claude/skills/truth-loop/SKILL.md` | 6373 | **present** |
| `.claude/workflows/propagation-loop.js` | 12222 | **present** |
| `.claude/workflows/claim-factcheck.js` | 5090 | **present** |
| `docs/truth-revisions.md` | 10134 | present |
| `teams/apex-research/wiki/patterns/confirmation-method-diversity-over-repetition.md` | present | **their wiki, not ours** |
| `teams/apex-research/wiki/gotchas/multi-file-correction-residual-untouched-file.md` | present | **their wiki, not ours** |

> **[CORRECTION TO THE FILING BRIEF]** The brief instructed that the three `.claude/` engine files be recorded as *referenced-but-unverified*, on the ground that they are not on `origin/main`. **They are, and were at the cited commit.** The likely cause of the false negative is [`gotchas/cross-msys-argv-mangling`](../gotchas/cross-msys-argv-mangling.md): on this Windows shell `git cat-file -s origin/main:.claude/...` fails with *"Not a valid object name"* because the argument is path-converted before git sees it. **The librarian reproduced that exact failure while checking, then re-ran with `MSYS_NO_PATHCONV=1` and got sizes.** A tooling false negative read as an absence is [`negative-probe-result-underdetermined-absence-read-as-permanent`](../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md), and it would have entered this wiki as a provenance fact. **The engines exist; only their *content* is unread, which is a different and much weaker caveat.**

> **[CORROBORATED 2026-09-04, independently] §5 of the presentation artifact lists the three engine files as links to the apex repo at `main`** -- read by team-lead in the full HTML. **A third source, of a different kind (the source team's own presentation rather than their git tree), agreeing with the `git cat-file` sizes.** Team-lead has accepted the correction and recorded the MSYS argv path-conversion as the cause of their false negative.

**Not verified:** the contents and behaviour of the three engines, the reference case's numbers (11 verified truths, 25 findings across 13 files), and every claim about how the loop performs in practice. **All of that is the source team's report, recorded as their report.** `confidence: medium` rests on the design being directly inspectable in a committed artifact; it is **not** a claim that the loop works, which this team has no vantage on.

## Confidence and revision trigger

**Medium.** n=1 deliberate design, one team, one reference case, distilled by its own participants in a retro -- the weakest evidentiary shape for an effectiveness claim and a strong one for a design claim. **Observation-based, so n+1 informs the domain claim**: a second team independently placing the exit condition with the reader would raise this materially. The counter-case that would sharpen it most is **a delivery where reader-owned exit is wrong** -- an asker who never responds, leaving the ledger open forever. Their playbook makes the conductor poll the surface, which manages the symptom without answering the question.

## Provenance

Designed by **(*AR:Schliemann*)** with Mihkel (PO) in apex-research session S78, 2026-08-31..2026-09-01, distilled from the VEO-183 / [#196](https://github.com/Eesti-Raudtee/apex-migration-research/issues/196) case via a two-player retro and tightened through three design challenges. Routed to this wiki at the PO's direction; sources exported by team-lead (Aen). **Filed here by the librarian, who wrote the dual-perspective reading and the verification table; none of that analysis is the source team's and it is not attributed to them.**

**`stage-2: pending`** -- librarian-authored on cross-team material, so neither author-is-filer nor a documented joint read-back. Fail-closed per the gate. Advances on a read-back by any FR agent who did not file it; **a read-back by Schliemann would confirm the faithfulness half only, not the adoption reading.**

## Amendments

- **2026-09-04 (filing).** Created. Verification table added at filing time; the brief's *referenced-but-unverified* instruction was checked rather than transcribed and is corrected above.

(*AR:Schliemann* -- the loop, the playbook and every claim about the reference case; *FR:Callimachus* -- filing, verification table, dual-perspective reading and cross-links)
