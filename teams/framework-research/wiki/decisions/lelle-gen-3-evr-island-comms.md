---
source-agents:
  - team-lead
source-team: framework-research
discovered: 2026-09-04
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: high
source-files:
  - designs/new/lelle/spec.md
source-commits:
  - ab622c7
source-issues:
  - 116
  - 107
  - 111
related:
  - two-islands-by-design-hub-topology-follows-network-boundary.md
  - stationmaster-post-office-model.md
  - ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md
  - ../gotchas/precondition-without-an-owner-is-no-precondition.md
  - ../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md
  - ../patterns/named-concepts-beat-descriptive-phrases.md
  - ../patterns/ghost-member-as-universal-integration-surface.md
---

# Codename "Lelle" -- the Gen-3 Inter-Team Comms Method for the EVR Island

**Decision (team-wide, high confidence). PO ruling, 2026-09-04 (S73).** The gen-3 inter-team communications method for the **EVR island** -- and its hub instance -- is named **Lelle**. Chosen over **Tapa** and **Koidula**.

> **From now on, docs and messages say *Lelle* when the gen-3 method or its instance is meant.**

**Rejected alternatives:** Tapa, Koidula. **The rationale is disambiguation, not aesthetics.** "The hub" currently resolves to at least three different things -- the stationmaster software, the prod-llm instance, or the sagres instance -- and this wiki already carries the resulting defect twice, in [`two-islands-by-design`](two-islands-by-design-hub-topology-follows-network-boundary.md) and [`singular-convention-plural-instances`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md). A codename gives the gen-3 thing a name that cannot be confused with the generic noun. Compare [`named-concepts-beat-descriptive-phrases`](../patterns/named-concepts-beat-descriptive-phrases.md).

## Lineage

| Gen | What | Status |
|---|---|---|
| **1** | ghost-bridge (v1 / v2 daemons) | **retired** -- its flag-flip-without-delete redelivery defect is [the one the hub was built against](../gotchas/v2-ghost-bridge-restart-redelivery-dupe-motivates-hub-ledger.md) |
| **2** | stationmaster post-office contract **v1.0.0**; EVR instance `prod-llm`, `sm@10.100.136.162:2222` | current |
| **3** | **Lelle** | named 2026-09-04; spec in progress |

**The sagres instance (`sm@100.102.133.125:2222`) is the personal island and is out of scope.** That split is consistent with what this wiki already records: `singular-convention-plural-instances` documents both instances and that cross-hub addressing returns `E_UNKNOWN_TEAM`. **Lelle is scoped to one of the two mail networks, not to both.**

**Island membership named in the ruling:** framework-research, apex-research, Pepys, Paunvere, and others.

## The design source -- Discussion #107

[Discussion #107, *"Cross-team signals as workflow primitives"*](https://github.com/mitselek/ai-teams/discussions/107) (2026-08-13, author `mitselek`, seeded from a PO-team / mvox-dev session). **Read in full at filing time; the submission's summary of it is faithful.**

It proposes a workflow-level `hubSignal()` primitive that would send through the stationmaster hub, **park the workflow rather than the session** until a response arrives, resume with the payload, and **fire the peer-escalation disclaimer once at the signal boundary instead of on every hop.** Its stated payoff is that the relay chain *workflow → agent → session → hub → courier → session → hub → courier → session → new workflow* collapses to *workflow → hub → workflow*, with the workflow holding state across the gate instead of reconstructing it.

**Its four open questions, verbatim, because they are the spec's inherited agenda:**

1. Should the parked workflow hold a slot, or release it and resume on signal?
2. Timeout semantics -- what happens if the authorization never comes?
3. Can a workflow send to multiple teams and await any/all?
4. Security: the hub grant model already scopes who can send to whom. Does `hubSignal()` need additional constraints?

## The finding on the record: the design source sat unowned for 22 days

**Submitted by team-lead and independently verified by the librarian at filing time.**

| Discussion | Created | Comments | Repo mentions before 2026-09-04 |
|---|---|---|---|
| **#107** Cross-team signals as workflow primitives | 2026-08-13 | **0** | **none** |
| **#111** RFC: Gauge-gated conversation retirement at session end | 2026-08-30 | **0** | **none** |

**Verification method, stated because it is the point:** `gh api repos/mitselek/ai-teams/discussions` for the counts, and `grep -rniE "hubsignal|lelle|koidula"` over `teams/framework-research/`, `topics/` and `docs/` for the mentions. **#107's zero-comment window ran 22 days; #111's ran 5 and is still open.** Both arrived while Herald's #108 assessment held the comms lane. **Neither was assigned and neither got an issue.**

> **A proposal filed as a Discussion, with no owner and no issue, produces no work and no objection. It does not fail -- it simply never starts, and nothing in the system notices.**

**A measurement caught changing under the measurer.** The librarian read #107's comment count as **0** early in the session and as **1** twenty minutes later -- team-lead's pointer comment landed in between. **The claim "zero comments" is therefore true only of a window with two ends, and both ends are stated above rather than left implicit.** This is [`verification-certifies-a-moment-not-a-session`](../patterns/verification-certifies-a-moment-not-a-session.md) observed live, on the very claim being filed.

**Relation to [`precondition-without-an-owner-is-no-precondition`](../gotchas/precondition-without-an-owner-is-no-precondition.md): near-instance, cross-linked, deliberately NOT counted as an instance.** Both are ownership failures and the remedies rhyme, but they are not the same shape. **A precondition is a control that fails to fire when its condition comes true -- there is a moment at which something should have happened.** A proposal has no triggering condition at all; it simply sits. The precondition remedy names *an owner and a moment to evaluate*; the proposal remedy would name *a routing decision -- become an issue, or be declined on the record*. **Cross-link, no umbrella, per the standing ruling.**

> **Promotion condition, written now while the reasoning is in hand:** promote *unowned proposal* to its own entry **on a third instance in which an artifact intended as an input to work was filed in a venue with no assignment step, and the cost is demonstrable** -- that is, where the work later had to be redone or the delay is measurable. **n=2 today, both from the same repo and the same lane-occupied period, which is one circumstance sampled twice rather than two sightings.**

## The thing this decision does not settle, raised for the record

**The ruling assigns one token to two things: the *method* and its *instance*.** That is the same shape as the ambiguity it is fixing -- "the hub" means both the software and an instance, which is exactly what `singular-convention-plural-instances` filed as a defect.

**This is not an objection to the ruling and is not a dispute.** The PO chose the name and the scope, and one island with one instance makes the two readings coincide today. **It is recorded because the coincidence is contingent:** if the EVR island ever runs a second gen-3 instance, *Lelle* will need the same *which one?* slot the generic noun needed, and this entry is where a future reader should look first. **The cheap pre-emption -- deciding now whether the instance gets its own qualifier -- costs one sentence in Herald's spec and is offered as a spec question, not a wiki ruling.**

## Ownership and ledger

| Role | Who |
|---|---|
| Programme ledger | [**#116**](https://github.com/mitselek/ai-teams/issues/116) *"Lelle: gen-3 EVR-island comms -- workflow-level hub signals (from #107)"*, opened 2026-09-04 07:40Z, **OPEN** |
| Spec | **Herald** -- `designs/new/lelle/spec.md`, v0.1 in progress |
| Implementation | **Brunel / Hopper / Volta** |
| Gates | **PO** |

**This entry is authoritative for the naming decision and its rationale only.** The contract, the mechanism and the four open questions belong to the spec and to #116; **this is a pointer to them, not a copy**, per the Decisions Boundary. If the spec answers #107's questions, the answers go there and this entry gains a link, not a summary.

## Name origin

**Lelle** is a historic Estonian railway junction where the Pärnu and Viljandi lines split; the station is closed, and the PO chose it knowing that. **Recorded as the PO's stated rationale, not as independently verified railway history.**

**One collision fact the submission did not carry, found at filing time and offered without inference.** *Koidula*, one of the two rejected alternatives, **is already in use as an agent persona name** in this repo -- 11 files across `designs/deployed/esl-legal/` and `designs/new/esl-suvekool/`, including a prompt file, a roster entry and common-prompt references. **Whether the PO knew this is not established and is not guessed at here.** The relevance is narrow and worth one line: **the purpose of this codename is to remove an ambiguity, and that alternative was already bound to something else in the same repository.** *Tapa* and *Lelle* appear nowhere in the repo except today's records.

## Confidence

**High on the decision itself** -- a PO ruling relayed by an agent who was present, with the ledger issue independently confirmed to exist, be open, and carry a title naming both Lelle and #107. **The lineage rows are corroborated against this wiki's own entries** (contract v1.0.0 and the ghost-bridge retirement from `stationmaster-post-office-model`; both instance addresses from `singular-convention-plural-instances`). **The #107/#111 finding is separately verified by the librarian against the GitHub API and the repo tree, not accepted on relay.**

**Not verified:** the railway history, and anything about what Lelle will actually specify -- the spec did not exist at filing time.

## Provenance

**PO ruling, 2026-09-04 (S73), relayed by team-lead (Aen), who was present.** The lineage, island membership, ownership table and the #107/#111 finding are the submission's. **The independent verification of the discussion counts and repo mentions, the ledger-issue confirmation, the near-instance ruling against the precondition gotcha with its promotion condition, the one-token-two-things observation and the Koidula collision are the librarian's.**

**`stage-2: confirmed`** (advanced 2026-09-04 10:53 on team-lead's read-back; **filed `pending` at 10:0x**).

**Why it was filed `pending` against the submission's own label, kept here because the reasoning is the durable part.** The submission was sent as *author-is-filer*, but **the author of the decision is the PO and the filer is the librarian; team-lead is a witness relaying it** -- filed-on-behalf, fail-closed by the three-bucket rule. **Team-lead reviewed that call and accepted it**, then read the entry back: *"faithful, no corrections."* Team-lead is the sole `source-agent`, so their read-back is the last one owed and the gate closes.

> **Referent, stated so the confirmation cannot be silently inherited by a later version.** The confirmed text is the entry as committed at **`ab622c7`** -- md5 `c58e6fe2da70f9fc4a1878ab5b5c11ce`, 11341 bytes (card: `06f478e47f747498c6a0c249d1a97403`, 5632 bytes), verified against the commit rather than against a working-tree hash. **Anything added after `ab622c7` is outside what was confirmed.** This is the axis-2 remedy from `../process/stage-2-confirms-filing-gate.md`: the `stage-2` field carries no version, so an amendment inherits a confirmation it never received unless the referent is written down.

**Two things the gate does NOT close, and it is worth being exact about the difference.** The gate measures whether a second agent read the entry back, **not whether every question it raises is settled.** Still open, both with the PO as of 2026-09-04: **the Koidula collision** and **the one-token-two-things scope point** (the latter also with Herald as a spec question, sent 10:50). **A PO confirmation is expected and would settle them; it is not required for the gate and does not reopen it.** If the PO's answer changes the decision's scope, that is an amendment against the referent above, not a re-run of this read-back.

## Amendments

- **2026-09-04 10:0x (filing).** Created, `stage-2: pending`, against the submission's author-is-filer label.
- **2026-09-04 10:53 (gate).** Advanced to `confirmed` on team-lead's read-back -- faithful, no corrections, gate call accepted. **Referent recorded as commit `ab622c7` with md5 and byte count for both files.** No content changed; the two PO items remain open and are named above.

(*FR:Aen* relayed the ruling, supplied the lineage, ownership and the unowned-proposal finding, and read the entry back; *FR:Callimachus* filed, verified the discussions and the ledger issue, ruled on the genus question and wrote its promotion condition, added the scope and collision observations, and recorded the gate referent)
