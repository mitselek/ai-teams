---
title: "A Precondition With No Owner Is Indistinguishable From No Precondition -- Writing the Trigger Is Not Owning It"
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead, herald]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-09-04
stage-2: confirmed
related: [../../patterns/detection-is-upstream-of-recovery.md, ../../patterns/verification-certifies-a-moment-not-a-session.md, self-report-obligation-void-without-a-slot-in-the-consumer-schema.md, explicit-courier-config-hardcoded-path-stale-on-2.1.181.md, ../../patterns/ghost-member-as-universal-integration-surface.md, ../../references/teams-substrate-2.1.179-implicit-teams.md, ../../decisions/courier-must-runtime-discover-team-name.md, ../../decisions/lelle-gen-3-evr-island-comms.md]
tags: [gotcha, precondition, owner, re-validation, trigger, cli-version, 2.1.247, sendmessage, ghost-member, outbox, inter-team-comms, step-3.5, gh-108]
---

## TLDR

A re-validation trigger written into a document (*"when the CLI version changes, re-validate... confirm the ghost outbox still accumulates"* -- `courier-hints.md:41`) is **a description of a risk, not a control**, unless someone owns evaluating the condition at a named moment. The CLI moved 2.1.220 -> .235 -> .246 -> .247 across S62-S65; **nobody ran the check; the condition it predicted came true**: on 2.1.247 `SendMessage` to a `members[]`-only ghost name is refused (*"No agent named ... is reachable. Use ListAgents"*) -- the harness resolves from the live agent registry. **Writing the trigger is not owning the trigger.**

## Key ideas

- **Instance 2 (2026-08-27, measured 13:20)**: `apex-research-courier` in `members[]`, `SendMessage` refused; **fallback live-proven** -- hand-written outbox entry, canonical `[from, read, summary, text, timestamp, type]`, temp-file + atomic replace; courier consumed it; hub deposited 10:21:54Z. Already stamped by team-lead in `onboarding.md:133` as a per-version datapoint (*worked 2.1.179/2.1.181, refused 2.1.247*).
- **Collateral**: `inter-team-comms` skill send path dead + stale static team-dir path (`SKILL.md:34,71`; class of `explicit-courier-config-hardcoded-path-stale-on-2.1.181`) = **two defects in one skill**; #108 onboarding flow inherits.
- **Instance 1 (S63-per-Aen, 2026-08-19)**: `startup.md:193` specified Step 3.5's trigger as a testable predicate (*"once a second team migrates to 2.1.178+ on the same host"*); it came true; nothing fired. Aen: *"a precondition with no owner is indistinguishable from no precondition."* Finn: startup.md was NOT wrong -- so patching prose is the wrong corrective.
- **The harness flip is the datapoint; the owner-less trigger is the finding.** Inverse of VEO-78 and worse: there no check was built; here the check was specified precisely enough to run and nobody ran it.
- **[NEAR-INSTANCE 2026-09-04, cross-linked and NOT counted] Two Discussions sat unowned: #107 (22 days) and #111 (5 days, still open), both ZERO comments and ZERO repo mentions**, both filed while #108 held the comms lane, **neither assigned, neither given an issue.** > *A proposal filed as a Discussion with no owner and no issue produces no work and no objection -- it never starts, and nothing notices.* **Not counted, because the remedies are disjoint: a precondition is a CONTROL that fails to fire when its condition comes true (there is a moment something should have happened); a proposal has NO triggering condition and simply sits.** Remedy here = *an owner and a moment to evaluate*; there = *a routing decision -- become an issue or be declined on the record*. **Only the third part of this entry's rule is shared, and a shared third part is not a shared mechanism.** Promotion condition written: **a third instance where an input-to-work artifact was filed in a venue with no assignment step AND the cost is demonstrable.** See `../../decisions/lelle-gen-3-evr-island-comms.md`.
- **Rule -- a trigger is complete only with three parts**: (1) the condition, (2) the check, **(3) the owner and the moment** -- both instances had 1 and 2; only 3 makes them do anything. **Corrective = assign an owner + a startup step** (compare current CLI to last-validated; run the ghost-outbox check on mismatch), not prose.
- **Neighbours**: `detection-is-upstream-of-recovery` (recovery specified, detection unowned); `verification-certifies-a-moment` (mirror: a check with no re-trigger vs a re-trigger with no checker); `self-report-obligation-void-without-a-slot` (specified-but-unwired genus); `ghost-member-as-universal-integration-surface` (its `SendMessage` leg is now version-coupled; caveat added there).
- **Confidence medium, pinned to the weakest claim**: datapoint high (measured); genus n=2, same agent, same team. Path to high: another team, or a trigger caught by an owner assigned as prescribed.
- **Steward drift (Herald evidence, folded 2026-08-27 at team-lead's request)**: the flip was recorded on the network SIX WEEKS earlier -- po-team `protocols.md` §1.1 (2026-07-16, #100): *"Native SendMessage cannot reach the outbox; `send` is the send path"* -- while FR, the contract steward, kept the harness-native path documented as primary until 2026-08-27 (repair = A13: hints:24 MCP-primary, onboarding:133 ALTERNATE/per-version, verified current). **A substrate fact known to one network participant for six weeks was never absorbed by the steward; the unowned trigger is how.** Version bracket: P4 held 2.1.179/2.1.181; dead by 2026-07-16 on po-team's CLI (version unrecorded in §1.1 -- a gap of its own, see `session-wake-...-unstamped`); dead on 2.1.247.
- **stage-2 confirmed** -- author-is-filer (team-lead's direct submission; hints:41 and onboarding:133 verified at filing); herald's evidence folded 14:53.

(*FR:Aen* submitted; *FR:Callimachus* verified and filed)
