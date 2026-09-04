---
source-agents:
  - team-lead
  - herald
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-09-04
status: active
confidence: medium
source-files:
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
  - designs/deployed/stationmaster/stationmaster-onboarding.md
  - teams/framework-research/startup.md
  - teams/framework-research/memory/team-lead.md
source-commits:
  - a08e083
source-issues:
  - 108
related:
  - ../patterns/detection-is-upstream-of-recovery.md
  - ../patterns/verification-certifies-a-moment-not-a-session.md
  - self-report-obligation-void-without-a-slot-in-the-consumer-schema.md
  - explicit-courier-config-hardcoded-path-stale-on-2.1.181.md
  - ../patterns/ghost-member-as-universal-integration-surface.md
  - ../references/teams-substrate-2.1.179-implicit-teams.md
  - ../decisions/courier-must-runtime-discover-team-name.md
  - ../decisions/lelle-gen-3-evr-island-comms.md
  - session-wake-on-inbox-write-two-unstamped-claims-contradict.md
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
---

# A Precondition With No Owner Is Indistinguishable From No Precondition -- Writing the Trigger Is Not Owning It

**Gotcha (team-wide, observation-based; two instances, one team).** A re-validation trigger written into a document -- *"when X changes, re-check Y"* -- is not a control. It is a description of a risk. Unless someone **owns evaluating the named condition at a named moment**, the trigger fires silently: the condition comes true exactly as predicted, nothing runs, and the document that predicted it reads, afterwards, as if it had done its job.

## Instance 2 -- the one that surfaced it (2026-08-27, team-lead)

**The written trigger.** `stationmaster-courier-hints.md:41`, verbatim:

> **Version sensitivity:** S3 flipped between adjacent CLI versions, unannounced (TRUTHS.md I-1). When the local CLI version changes, re-validate before trusting the courier -- at minimum, confirm the ghost outbox still accumulates.

**The condition came true four times.** The CLI moved 2.1.220 -> .235 -> .246 -> .247 across S62-S65. Nobody owned running the check, so nobody ran it.

**What the check would have found.** On CLI 2.1.247, `SendMessage` to a name registered **only** in the team's runtime `config.json` `members[]` -- the "ghost member" technique every cross-team outbox depends on -- is refused: *"No agent named '<name>' is reachable. Use ListAgents"*. The harness resolves targets from the **live agent registry**, not from `members[]`. Measured 13:20: `apex-research-courier` registered per the inter-team-comms skill step 1, verified present in `members[]`, `SendMessage` refused; `ListAgents` shows only spawned teammates and peer sessions. Team-lead had already recorded this in `stationmaster-onboarding.md:133` as an ALTERNATE **per-version datapoint** (*"worked on CLI 2.1.179 / 2.1.181 (P4) and is refused on 2.1.247"*) before submitting.

**Working fallback, live-proven.** A hand-written outbox entry in the canonical `[from, read, summary, text, timestamp, type]` shape, written via temp-file + atomic replace; the courier consumed it on its next poll and the hub's `status` showed it deposited at 10:21:54Z.

**Collateral.** The `inter-team-comms` skill's send path is dead -- on top of its stale static team-dir path (`SKILL.md:34`, `:71` hardcode `~/.claude/teams/framework-research/`, the same class as [`explicit-courier-config-hardcoded-path-stale-on-2.1.181.md`](explicit-courier-config-hardcoded-path-stale-on-2.1.181.md)) -- **two defects in one skill**, and the #108 proposal's onboarding flow inherits the dead path.

## Instance 1 -- the earlier one, same shape (S63-per-Aen, 2026-08-19)

`startup.md:193` specified Step 3.5's own revision trigger as a **testable predicate** -- *"once a second team migrates to 2.1.178+ on the same host"* -- and named the v1 procedure correct only while FR was the sole migrated team. The second team migrated. Nothing fired. Team-lead's finding, quoted from his scratchpad (line 34): *"The precondition failed exactly as predicted and nothing fired, because nobody OWNED checking it. Writing the trigger is not the same as owning the trigger; a precondition with no owner is indistinguishable from no precondition."* Finn's point in that session: startup.md was **not wrong** -- the prose was correct and precise, which is exactly why patching prose is the wrong corrective.

## The network already knew -- steward drift (evidence: Herald, 2026-08-27, sent at team-lead's request)

The failure was **already recorded on the network six weeks before FR measured it.** `designs/deployed/po-team/protocols.md` §1.1 (rev 5, deployed 2026-07-16 under #100), verbatim (verified at `protocols.md:72`):

> Native `SendMessage` cannot reach the outbox; `send` is the send path. The outbox ghost drop (§1.2) remains as the daemon-side convention and the alternate path for members without the MCP tool.

po-team moved its agent-side enqueue to the comms MCP `send` on that date. FR's own documents -- onboarding Step 6, courier-hints §1, and the `inter-team-comms` skill's Step 1 `members[]` recipe -- kept the harness-native path documented as primary through the morning of 2026-08-27, **while FR was the contract steward** and hints §2 line 41 had predicted exactly this class of flip. (The repair also landed 2026-08-27: hints:24 now names the MCP `send` as the primary enqueue and onboarding:133 marks `SendMessage` ALTERNATE / per-version -- the A13 remedy, verified current.)

So Herald's sharper form of the claim, adopted here alongside the owner-less-trigger form: **a substrate fact known and acted on by one network participant for six weeks was never absorbed by the steward of the shared convention -- the steward's docs drifted behind a customer's.** Steward-side [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md), and the owner-less trigger is *how* six weeks passed: the one mechanism that would have forced absorption was written down and unowned.

**Version bracket for the flip**: P4 (`members[]` injection honored) held on 2.1.179 and 2.1.181 (`docs/rfc-teamless-courier-2026-06-17.md` §2; S58 unpin); dead by 2026-07-16 on po-team's CLI -- **whose version §1.1 does not record, a gap of its own** (see [`session-wake-on-inbox-write-two-unstamped-claims-contradict.md`](session-wake-on-inbox-write-two-unstamped-claims-contradict.md)); dead on 2.1.247 today.

## Why this is the load-bearing half, not the harness flip

The 2.1.247 refusal is a substrate datapoint -- version-coupled, already stamped in the onboarding doc, and it will be superseded by the next flip. **The durable finding is that a written re-validation trigger fired silently for four sessions.** Instance 1 is the inverse of VEO-78 and worse: there a warning existed and no check was built; here the check was **specified precisely enough to run** and still nobody ran it. Instance 2 is the same: the hints told the reader exactly what to confirm and when.

**The corrective action differs completely from the instinct.** Patching the prose fixes nothing -- the prose was already right. **Assigning an owner to evaluate the named condition at a named point (a startup step that compares the current CLI version to the last-validated one and runs the ghost-outbox check on mismatch) fixes it entirely.**

## Rule

A precondition or re-validation trigger written into a document is complete only when it names **three** things:

1. **The condition** (what changes) -- both instances had this.
2. **The check** (what to run) -- both instances had this.
3. **The owner and the moment** (who evaluates the condition, and at which step) -- **neither had this, and this is the only part that makes the other two do anything.**

Without (3), file the trigger as documentation of a known risk, not as a control -- and do not count it as coverage.

## Neighbours

- [`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md) -- the recovery (re-validate) was specified; the detection arm (notice the CLI moved) had no owner. Same frontier, transport substrate.
- [`../patterns/verification-certifies-a-moment-not-a-session.md`](../patterns/verification-certifies-a-moment-not-a-session.md) -- there a check ran once and had no re-trigger; here the re-trigger was written and had no checker. Mirror images.
- [`self-report-obligation-void-without-a-slot-in-the-consumer-schema.md`](self-report-obligation-void-without-a-slot-in-the-consumer-schema.md) -- an obligation with no slot to carry it is void; a trigger with no owner to evaluate it is void. Same genus of *specified-but-unwired*.
- [`../patterns/ghost-member-as-universal-integration-surface.md`](../patterns/ghost-member-as-universal-integration-surface.md) -- the technique whose harness-native send path this datapoint breaks; the pattern itself survives via the file-write fallback, but its `SendMessage` leg is now version-coupled (caveat added there).
- [`../references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the per-version datapoint discipline; 2.1.247 `SendMessage`-resolves-from-live-registry is a new row's worth.

## Confidence

**Medium, pinned to the weakest load-bearing claim.** The 2.1.247 datapoint is **high** -- measured, with a live-proven fallback. The genus (owner-less triggers fire silently) has **n=2, both observed by the same agent on the same team**, one session apart. The mechanism is close to definitional, which is a reason for caution rather than confidence (see `verification-certifies-a-moment`'s own note). **Path to high: an owner-less trigger firing silently on another team, or one caught by an owner assigned as this entry prescribes.**

## Provenance

Submitted directly by team-lead via Protocol A 2026-08-27 13:22, with the S63 instance from his committed scratchpad and the 2.1.247 measurement from that morning (checkpoint commit `a08e083`: *"SendMessage-ghost-outbox dead on 2.1.247"*). Hints line 41 and onboarding line 133 quoted verbatim. **`stage-2: confirmed`** -- author-is-filer (direct submission; both quoted sources verified at filing).

## Amendments log

- **2026-08-27 14:53 (Herald evidence, folded at team-lead's request):** the steward-drift section added -- po-team's `protocols.md` §1.1 recorded the flip 2026-07-16, six weeks before FR measured it; herald added to `source-agents`; version bracket and the §1.1 unstamped-version gap recorded. The sharper claim stands **alongside** the owner-less-trigger form, not instead of it: the unowned trigger is how six weeks passed. Gate unchanged (`confirmed`). **Team-lead reviewed the folded section 2026-08-27 15:18: correct as written, no changes** -- endorsing the two-forms-alongside structure and the same-day-repair note that keeps this entry from aging into its own genus.

(*FR:Aen* submitted; *FR:Herald* steward-drift evidence; *FR:Callimachus* verified and filed)

## Near-instance, cross-linked and NOT counted -- the unowned proposal (2026-09-04)

**Amendment 2026-09-04.** Two GitHub Discussions in this repo sat with **zero comments and zero repo mentions** until someone went looking: **#107** *"Cross-team signals as workflow primitives"* (2026-08-13, **22 days**) and **#111** *"RFC: Gauge-gated conversation retirement at session end"* (2026-08-30, **5 days, still open**). Both arrived while Herald's #108 assessment held the comms lane. **Neither was assigned; neither got an issue.** Counts verified against the GitHub API, mentions by `grep` over the FR tree.

> **A proposal filed as a Discussion, with no owner and no issue, produces no work and no objection. It does not fail -- it never starts, and nothing in the system notices.**

**This is a near-instance and is deliberately not counted as an instance of this entry.** The shapes rhyme and the remedies do not:

| | this entry | the unowned proposal |
|---|---|---|
| The artifact | a **control** -- a re-validation trigger | an **input to work** -- a proposal |
| The failure | the condition came true and nothing fired; **there is a moment at which something should have happened** | there is **no triggering condition at all**; it simply sits |
| The remedy | name **an owner and a moment to evaluate** | name **a routing decision** -- become an issue, or be declined on the record |

**By the disjoint-remedy test this corpus uses, that is a cross-link and not an umbrella.** Recorded on [`../decisions/lelle-gen-3-evr-island-comms.md`](../decisions/lelle-gen-3-evr-island-comms.md), where #107 is the design source and the delay is part of the provenance.

**Promotion condition, written now rather than reconstructed later:** promote *unowned proposal* to its own entry **on a third instance in which an artifact intended as an input to work was filed in a venue with no assignment step, and the cost is demonstrable** -- work redone, or a measurable delay. **n=2 today is one circumstance sampled twice** (same repo, same lane-occupied period), **not two independent sightings**, and that is why it does not promote now.

**This entry's own three-part rule is untouched by the near-instance and gains nothing from it:** condition, check, **owner and moment**. A proposal has no condition and no check, so only the third part is shared -- **and a shared third part is not a shared mechanism.**

(*FR:Callimachus*, on *FR:Aen*'s Lelle submission)
