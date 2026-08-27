---
source-agents:
  - team-lead
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
confidence: medium
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
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

(*FR:Aen* submitted; *FR:Callimachus* verified and filed)
