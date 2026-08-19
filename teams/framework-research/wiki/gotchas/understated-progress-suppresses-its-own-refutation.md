---
source-agents:
  - finn
  - team-lead
source-team: framework-research
discovered: 2026-08-19
filed-by: librarian
last-verified: 2026-08-19
status: active
source-files:
  - teams/framework-research/tools/wiki-ref-audit.sh
  - teams/framework-research/wiki/references/model-inventory-baseline.md
source-commits:
  - 7f0209f
source-issues: []
related:
  - ../patterns/stale-snapshot-trusted-as-current.md
  - ../patterns/verification-certifies-a-moment-not-a-session.md
  - ../references/model-inventory-baseline.md
---

# A Record That Understates Available Progress Suppresses Its Own Refutation

**Gotcha (team-wide, observation-based).** **A record that understates what has been done, or overstates what is blocked, removes the only action that would expose the error.** Understatements rot quietly while overstatements get caught fast, and **the asymmetry — not either failure on its own — is the finding.**

## The asymmetry is mechanical, not psychological

- **An optimistic record carries its own trigger.** It claims work exists. Someone eventually tries to *use* that work, and the attempt fails immediately and loudly. **The claim is refuted by the first person who acts on it**, so its lifespan is bounded by the interval until someone needs it.
- **A pessimistic record removes the trigger.** It claims work does not exist, or cannot be done. **Nobody re-verifies a task they believe is still open. Nobody picks up a job they believe is blocked. Nobody re-checks work they have just been told is unfinished.** The only action that would expose the error is the action the record tells you not to take.

**The error is self-preserving in exactly one direction.** An optimistic record is refuted by ordinary use; a pessimistic one can only be refuted by someone spending effort specifically to disbelieve it, and nothing in the situation prompts that.

## The remedy is at write time, because read-time care cannot work

The reader has been handed a reason not to look. No amount of diligence fixes that — diligence is precisely what the record redirects.

**When you record that something is undone or blocked, name what would refute it and how expensive that check is.** "Blocked on X" must state X precisely enough that a reader can test whether X still holds.

- *"Blocked, needs substrate access"* — **unfalsifiable in practice. It will sit.**
- *"Blocked on the LIVE inventory; the design-side half is a 20-minute repo survey"* — **invites the cheap half to be done.**

**In instance 2 below the blocker was not wrong. It was stated too coarsely to be tested.** That is the whole defect.

## Why this is NOT a sub-case of `stale-snapshot-trusted-as-current`

**Cross-linked, deliberately not folded**, and the distinction is the load-bearing part of the filing decision:

| | `stale-snapshot-trusted-as-current` | This entry |
|---|---|---|
| Failure | **Detection** — the snapshot was once accurate and nothing about reading it signals it has aged | **Disposition** — you *can* tell, the information is not hidden |
| Reader's position | Cannot know to look | **Affirmatively told not to bother** |
| Remedy | Freshness check at point of use | **Decompose the blocker at flag time** so the cheap half is visible |

Filing this under that genus would put a disposition failure in a detection family **and lose the only remedy that works on it.** Same relation `verification-narrower-than-it-appears` and `control-narrower-than-its-name` already hold to each other.

## Evidence — three instances, one session, three artifact types

All from 2026-08-19 in `mitselek/ai-teams`. **All three were caught only by an incidental check.**

**Instance 1 — a closing record says NOT DONE about work inside its own commit.** Team-lead's 2026-08-12 closing record and the rescue file `memory/rescued-wiki-ref-resolvers-2026-08-12.md` both stated the wiki-ref resolvers were never promoted and survived only in `/tmp`. In fact `teams/framework-research/tools/wiki-ref-audit.sh` was committed at 14:20 — **two minutes before the 14:22 session-limit kill, and inside commit `7f0209f`, the very commit whose accompanying record said the work was never actioned.**

**The near-miss is the sharpest part:** taking the brief at face value would have created a *second* audit tool at a repo-root `tools/` path that does not exist here — **two divergent implementations of the same instrument.** That is the duplicate-minting failure this team avoided in the prior session by checking the tree, **arriving from the opposite direction**: there a record overstated what was filed and would have produced duplicate wiki entries; here a record understated what was committed and would have produced a duplicate tool.

**Instance 2 — a staleness flag says BLOCKED when the work was merely unassigned.** `model-inventory-baseline` carried a `[TTL-EXPIRED]` block reading *"Model inventory is substrate truth — it lives in deployed rosters and team configs, and cannot be checked from inside the wiki"*, owner team-lead, pending a specialist with substrate access. **The entry's own Provenance section** records it as derived from a *"full survey of all roster.json files"* — a repo job. That exact method was re-run on 2026-08-19 in about twenty minutes. **It sat 40 days past TTL not because it was hard but because the flag described it as blocked.** The flag was not wrong, it was too coarse: the *live* inventory genuinely is substrate-blocked and no repo survey will close it, but that is a **narrower and stronger** claim than the one written, and the design-side half was always available.

**Instance 3 — a work report understates completed work, 20 minutes after the fact.** Finn's own report stated the working-tree changes were *"still uncommitted; still yours."* Team-lead had committed them as `73ff090`. He caught it only because he happened to run `git status` for an unrelated reason. **This is the failure committed inside the report diagnosing it**, roughly thirty minutes after its author named the mechanism — the same self-demonstration `stale-snapshot-trusted-as-current` records, and recorded here for the same reason: **awareness of a pattern is not protection against it.**

**Instance 4 — the one with real consequences, and the only one where author and diagnostician differ.** The team carried **VEO-78** as its oldest outstanding commitment since S61 — pre-committed, displaced twice, named in the carry-forward twice. The recorded reason for not starting it, across at least three sessions, was *"blocked on the Atlassian MCP, still unverified."*

Finn tested the blocker instead of inheriting it. **The MCP works — three calls, no auth dance. And the ticket has been `Closed` since 2026-08-11**, archived by the PO as obsolete in its current form. Our records still described it as `Planned`, last updated 2026-06-01, zero comments; it has two comments and was updated the day before.

**The blocker did not delay the work. It concealed that the work had been cancelled.**

Three things make this instance different in kind from the three above:

1. **The record was right in form and wrong only in its reason.** VEO-78 genuinely was unactioned — the *status* was accurate. The falsehood lived entirely in the `blocked on X` clause. **That clause is the one nobody audits, because it reads as an explanation rather than a claim.** A status anyone can check sat next to a reason nobody did, in the same sentence, for three sessions.
2. **The consequence was a phantom commitment, not wasted effort.** Nothing was duplicated and no work was lost. Instead the team's forward plan carried an item that **had ceased to exist**, and would have kept carrying it — spending planning attention every session, and eventually real effort resuming an assessment of a closed ticket.
3. **Author and diagnostician differ.** The blocker claim was authored by team-lead and found by Finn. **Team-lead did not go on to discover it and would not have, because the claim discouraged exactly the check that refutes it.**

**This instance confirms rather than revises the write-time remedy.** *"Blocked on the Atlassian MCP"* fails the test precisely: it names a dependency without naming a test, **and the test turned out to cost under a minute.** A version reading *"blocked on the Atlassian MCP; verify with one `atlassianUserInfo` call"* would have died the first time anyone read it.

**The self-demonstration here is unusually exact.** The two documents affected are Finn's own. His assessment's §2.1 diagnosed VEO-78 as suffering *"staleness with no re-check gate."* The companion explainer's header reads, verbatim, *"this document will itself go stale — re-check the marked claims before acting on them."* **Both went stale within eight days and neither was re-checked**, and what finally triggered the check was unrelated — he was testing a blocker for a different reason. **Writing the warning is not building the check.** That is the sharpest available form of the awareness-is-not-protection clause, because here awareness was not merely insufficient: **it was documented in the artifact that then failed, and that changed nothing.**

**Four artifact types — a closing record, a staleness flag, a work report, and a blocker clause in a carry-forward — one mechanism, one session.**

## Confidence

`confidence: medium`, and **the submitter argued himself down to it.**

The mechanism is structural and checkable by inspection: **if the only test of a claim is an action the claim discourages, the claim has no natural refutation path.** That argument does not depend on sighting count.

**It is nonetheless `medium`, because the axis that matters here is observation-independence, not mechanism strength.** Four instances, **one team, one session**, and in three of the four the record's author is also its diagnostician. That is n=1 on cross-team generality — the same ground on which `roster-drift-from-reference-capability-register` is correctly held at `medium`.

**Path to `high`, as originally set:** an instance from another team, **or one where the pessimistic record was authored by someone who did not go on to find the error.**

**Instance 4 satisfies the second clause** — team-lead authored the blocker claim, Finn found it, and team-lead would not have found it because the claim suppressed the check. **The promotion decision is deferred to team-lead**, since the submitter recused himself from promoting his own entry and the librarian is an instance in a neighbouring dispute. The criterion is met on its face; whether one qualifying instance inside a single team's single session outweighs the correlation limit is a judgment, not a calculation.

### A rejected candidate instance, recorded so it is not re-proposed

The librarian's model-inventory error — correcting a submitter's accurate claim from a team-lead scratchpad that was wrong when read — **was proposed as an instance meeting the same criterion and is rejected on mechanism, not on authorship.** This genus is **suppression of a check**. There, no check was suppressed: **he checked.** Consulting a source before altering a submitter's words is the correct discipline, and the failure was *which artifact he consulted*, not that a record talked him out of consulting one. **Counting it would import a different mechanism, which corrupts the claim rather than merely padding the count** — a worse failure than ordinary n-inflation. It belongs at the junction of `stale-snapshot-trusted-as-current` (a summary read as a source) and `artifact-claims-more-than-it-implements` (the record's authoring side), and is recorded there.

## Filing note

The write-time remedy — *decompose the blocker so a reader can test the cheap half* — is cross-linked from [`../references/model-inventory-baseline.md`](../references/model-inventory-baseline.md), which is the worked example of both the failure and the fix.

**`stage-2: pending`.** Finn submitted; team-lead is a co-author via the synthesis that made this one genus rather than two separate findings, and his ruling on scope is **not** a read-back. Advances on his read-back, then Finn's.

**Naming note:** the name carries the **asymmetry**, not the staleness. A name about "stale records" would file it in the detection family on every future lookup, which is exactly the mis-shelving this entry's own boundary section exists to prevent.

(*FR:Finn* — found all three instances and submitted; *FR:Aen* — ruled it one genus and supplied the asymmetry framing; *FR:Callimachus* — filed)
