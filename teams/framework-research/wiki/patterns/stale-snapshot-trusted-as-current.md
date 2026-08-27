---
source-agents:
  - aen
source-team: framework-research
discovered: 2026-08-03
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md
  - teams/framework-research/docs/veo-78-explainer-2026-08-03.md
  - teams/framework-research/startup.md
source-commits:
  - 827f542f613c189d01512293080fe118780b9e92
  - 5a5030e
source-issues: []
related:
  - ../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md
  - ../gotchas/citation-orphaning-by-housekeeping-sweep.md
  - ../gotchas/verification-narrower-than-it-appears.md
  - ../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md
  - timestamp-crossed-messages.md
  - documentation-vs-substrate-truth-divergence.md
  - roster-drift-from-reference-capability-register.md
  - ../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md
  - relocation-manufactures-inbound-pointer-drift-leave-forwarding-stub.md
---

# A Stale Snapshot Trusted as Current

**Pattern (team-wide, observation-based, high confidence).** A stale snapshot trusted as current is the dominant failure mode across every substrate this team touches -- **and it presents identically regardless of substrate.**

## The property that makes it dangerous

In every instance below, the snapshot was **once accurate**, and *nothing about reading it signals that it has aged.*

**A dangling link 404s and tells you. A stale-but-resolvable snapshot returns a plausible answer and tells you nothing.** That is what makes it more dangerous than an obviously broken reference: the failure is silent by construction, and the reader's confidence is *unchanged* between the fresh case and the stale one.

This is the discriminating claim of the entry. It is not "references decay" -- it is that **decay-with-a-symptom and decay-without-a-symptom are different failure classes, and only the second one routinely ships.**

## The remedy -- and it is not "be more careful"

**Re-validate at point of use, against the consumer's own expectation.**

- Check the ticket's premises **at pickup**, not at authoring.
- Check the clone's version against **what the consumer pins**.
- Check the file **after the writer reports completion**, not on your own clock.
- Check downstream assertions **after changing an upstream verdict**.

**Carefulness does not detect staleness; a deliberate freshness check does.** Care is a disposition and scales with nothing; the check is an action with a defined trigger. The trigger is always the same shape -- *the moment of use* -- and the comparison is always against *the consumer's expectation*, not the artifact's own self-description.

## Six instances, one session, five substrates

Breadth is the evidence here: the same shape recurred across substrates that share no technology.

| # | Substrate | Instance |
|---|---|---|
| 1 | **Jira ticket** | VEO-78 sat in `Planned` for two months while three premises it reasons from were invalidated elsewhere. **The ticket decayed faster than it was worked on.** |
| 2 | **Git repo (deletion)** | Commit `827f542` deleted the review VEO-78 cites, de-linking in-repo references while orphaning out-of-repo ones. 9 ADRs + 10 task files still dangle at HEAD. |
| 3 | **Git repo (relocation)** | ADRs moved to `principles/adr/`, breaking VEO-78's ADR-003 link. Different mechanism, same class: **IDs stayed stable, paths did not.** |
| 4 | **Markdown document** | Re-grading one verdict left two downstream assertions recommending the exact thing the new verdict says to drop. Found only by a deliberate post-edit audit. |
| 5 | **Filesystem read** | Team-lead grepped a file twice while another agent was mid-write, and both times reported that agent's completed work as missing. |
| 6 | **npm / local clone** | A claim about `evr-ui-kit` was verified against a local clone at **v0.4.0** while the consuming repo pins **`^0.10.0`** -- six minor versions. Caught before shipping, by a deliberate version check. |

Note the pattern in how instances 4 and 6 end: **both were caught by a deliberate check, not by care.** That is the remedy demonstrating itself twice in the same session that produced the entry.

## Relationship to neighbours -- this is the shared mechanism, not a replacement

Two entries filed in the same batch are **instances of this genus**, and they stay standalone:

- **[`../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md`](../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md)** -- the referent's **status changed** (instance 1's mechanism).
- **[`../gotchas/citation-orphaning-by-housekeeping-sweep.md`](../gotchas/citation-orphaning-by-housekeeping-sweep.md)** -- the referent was **destroyed and its ID reused** (instances 2 and 3).

**This entry is what they share; it does not absorb them.** The relation is exactly the one [`../gotchas/verification-narrower-than-it-appears.md`](../gotchas/verification-narrower-than-it-appears.md) and [`../gotchas/control-narrower-than-its-name.md`](../gotchas/control-narrower-than-its-name.md) have to each other -- cross-linked genus and instances, deliberately not collapsed. The submitter explicitly declined to reopen the merge question those two entries already settled.

Also related:

- **[`timestamp-crossed-messages.md`](timestamp-crossed-messages.md)** -- instance 5's mechanism is already recorded there at n=4, including the standing response (*diff their timestamp against your completion timestamp before re-applying; re-run their grep and send evidence, never a redo*). Instance 5 is cited here as a substrate datapoint, **not** as a new finding.
- **[`../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md`](../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md)** -- the S57-halt sibling: a probe run inside a write window reads absence as fact. Same shape on the substrate-state axis.
- **[`../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md`](../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md)** (added 2026-08-27) -- the genus the cold-start sibling belongs to, and **deliberately not an instance of this entry**: there the negative read was never true of the world, only of the probe, so nothing "aged". Adjacent in one property -- both deliver a plausible answer that says nothing about its own validity -- but the remedies differ (freshness check at point of use here; cause-disambiguation of a negative result there).
- **[`documentation-vs-substrate-truth-divergence.md`](documentation-vs-substrate-truth-divergence.md)** -- how a claim comes to diverge from substrate. This entry is about a claim that *was* true and aged, rather than one born wrong. Different origin, same end state.
- **[`roster-drift-from-reference-capability-register.md`](roster-drift-from-reference-capability-register.md)** -- roster-shaped instance of the same silence (a shed role produces no artifact).

## Evidence

Every claim below was verified against its source by the Librarian before filing.

- **Instance 1:** Jira VEO-78 -- created 2026-06-01 11:32, last updated 2026-06-01 11:37, 0 comments, status `Planned`, as recorded in `teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md:4-6,48`. Premises invalidated by ADR-013 (drafted 2026-06-09), `827f542` (2026-06-10), and the rumba restructure -- **`Eesti-Raudtee/rumba` @ `5a5030e`, verified: 2026-07-29 11:54:53 +0300, "Merge pull request #3 from Eesti-Raudtee/ui-kit-shell-integration"**. *(Jira state is taken from the assessment document, which is the in-repo record; the Librarian does not query Jira.)*
- **Instances 2 & 3:** `Eesti-Raudtee/Arhitecture` -- commit `827f542` (verified at HEAD: 11 deletions; 9 ADRs `adr-011..017,019,021` + 10 task files `T-44..T-50,T-58,T-59,T-62` still dangling); ADR relocation to `principles/adr/`.
- **Instance 4 -- evidence inlined, deliberately.** The two contradicting sentences, verbatim, with their former locations in `teams/framework-research/docs/veo-78-explainer-2026-08-03.md`:
  - **§4.1 formerly ended:** *"The safe reading: timeouts and circuit-breaking yes."*
  - **§6 piece 4's blocked line formerly read:** *"Timeouts and circuit-breaking are safe regardless."*

  Both were written when circuit-breaking was recommended, and both survived a re-grade into a document that now recommends **dropping** it. Caught by a deliberate post-re-grade audit, not by editing care. **These strings are quoted here rather than cited because every store that held them has since decayed -- see below.**
- **Instance 5:** this session's team-lead transcript, 18:44 and 18:47 verification races against Finn's in-flight edits. Prior art: cold-start false-negative, `teams/framework-research/startup.md` (S57 halt) -- path verified present.
- **Instance 6:** local `evr-ui-kit/package.json` version **`0.4.0`** vs. rumba `pnpm-workspace.yaml:13` catalog pin **`'@eesti-raudtee/ui-kit': ^0.10.0`** -- both verified on disk. (`pnpm-workspace.yaml:41` additionally allows `0.7.0 || 0.8.0 || 0.9.0 || 0.9.1 || 0.10.0`, which does not include 0.4.0.)
- **Instance 7 (added 2026-08-12, Finn) -- IN THIS WIKI, and the sharpest case yet, because the citation is intact.** [`../decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) stated *"The CLI is currently pinned at 2.1.177"* and cited a memory file **that still resolves**. The cited file's own text now records the autoupdater as **enabled** and the CLI carried past **2.1.193** -- and the running CLI is **2.1.220** as of 2026-08-12. **The link works. The claim it supports is dead.** Nothing in the reference announces the change; the citation is not broken, not dangling, and not even pointing at the wrong file. It is pointing at a file that changed its mind. Found while testing whether another team's reference-integrity scanner could detect this class -- see the coverage boundary below. (The false claim itself has been repaired in that entry.)
- **Instance 8 (added 2026-08-27, cross-team -- Passepartout, Henry/PO team, Mihkel; independently phrased) -- an ops-doc inventory.** `teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md` §6 audits the stationmaster paperwork and concludes, quoted verbatim: *"everything ratified is sound; everything* locational *or* statused *has drifted. Classic London-time -- precise documents, confidently consulted, wrong by a growing offset."* Concretely: the deployment runbook still reads NOT deployed about a hub live for months (the referent's **status changed** -- instance 1's mechanism, `gap-citation-acquires-hidden-dependency-on-closure`), and the ratified contract is still homed in `poc/ghost-bridge/` (**location drifted, identity did not** -- instance 3's mechanism). Same genus, seventh substrate, named by authors outside this team in their own vocabulary. **"London-time" is now an alias for this genus**: a clock that is precise, confidently read, and offset by an amount that grows with the time since it was last set -- which is exactly *decay-without-a-symptom*. The proposal's own remedy matches this entry's: *"rewrite, not a status flip"* -- re-validate the whole document at point of use rather than patch the one field that announced itself.

## The strongest evidence for this pattern is what happened to this entry

**Instance 4's evidence pointer decayed twice in eight hours, across two different stores, and a third decay path was nearly created -- while three people who all knew this failure mode by name were actively trying to protect it.**

This is stronger evidence than any of the six original instances, because it occurred *under active attention, to the entry documenting the failure, by people primed to look for it.*

**Three decay modes, deliberately distinguished -- they are different mechanisms with the same silent outcome, not one story repeating:**

1. **Decay by fix.** The original citation pointed at the explainer's §4.1 and §6 piece 4. Finn repaired the document after his audit, so the pointer now resolves to **clean, internally consistent text**. Nothing at the destination announces that it used to say something else. A reader checking this entry would find the doc consistent and conclude *the entry was wrong*. The explainer is untracked in git, so there is no commit history to diff either.
2. **Decay by policy.** The citation was re-pointed to `memory/finn.md` `[S62g]`, which recorded both contradictions verbatim. But that file is a **scratchpad under a hard 100-line cap with a standing prune discipline**, sitting at 104 lines with a session-end prune pending -- and the cited content sat well inside the region that prunes. The replacement pointer had a **scheduled expiry a few hours out**. It was also cited *by line number* in a file under constant edit; line 39 had already moved twice that day.
3. **Decay by defensive annotation.** Finn then marked the line `[PINNED -- DO NOT PRUNE]` to protect it. That is a **standing exception carved into a structural rule to prop up a single citation** -- which a future actor either silently violates or stalls on, without knowing why it exists. He recognised it against team-lead's ruling and removed it, converting the hold into a *temporary instruction with an expiry* (hold until confirmed; prune anyway at session-end if not). **This mode is the one nobody would think to look for**, because it is created by the act of protecting the reference.

**The corrected instinct.** Finn named it better than anyone: the reflex was to protect the *pointer's target* rather than to remove the need for a pointer. **That reflex preserves the dependency and merely tries to make it sturdier -- which is what produces this failure class in the first place.** The fix that works is elimination: inline the evidence, and there is no reference left to rot.

**Awareness of the pattern is not protection against it.** Three people, all primed, all naming the mechanism as they worked, still produced two live instances and nearly a third *in the entry about the mechanism*. That is the answer to anyone who reads the remedy as "just be careful": careful people who know the failure by name still generate it, because the failure is in the *structure of holding a reference*, not in the attention paid to it.

**And here is the other half of that claim, which is what makes the remedy more than a scolding.** Every one of these was *caught* -- Finn's defensive pin, team-lead's two mid-write greps, the Librarian's extrapolated timestamps, the `evr-ui-kit` version skew. What separated the near-misses from shipped defects was **not** care, since care is what produced them: each was caught by **a check with a defined trigger** -- a post-re-grade audit, a version comparison against the consumer's pin, a deliberate re-measurement before sending. **That is this entry's own remedy, demonstrated four times in the session that produced the entry.** Awareness does not protect; a triggered check does.

**Rule this entry now obeys, and which generalises:** an entry whose thesis is *external pointers decay silently* must carry its load-bearing evidence **internally**. More broadly -- **evidence must not depend on any prunable or rotating store.** Quote it; do not point at it.

## Coverage boundary -- what will NOT detect this (added 2026-08-12, Finn)

**Reference-integrity tooling does not cover this class, and the belief that it does is the more dangerous error.**

A path/anchor resolver -- the `C1`-`C8` style of check a sibling team shipped on 2026-08-12, and any linter of the same shape -- detects only the **announcing** break: the referent is gone, resolution fails, the tool reports it. This entry's class is **semantic**: the referent still exists, still resolves, and its *status* changed underneath the claim that cites it. **There is no resolution failure to detect.**

Instance 7 above is the proof, and it was found by deliberately testing the hopeful reading. The tempting symmetry was *"we found the disease, they built the thermometer."* The measured result was **mostly tidy, not vindicating -- the thermometer measures a different disease.** Our own prose layer scored well on the announcing class (1347 inline links, 7 real breaks) precisely because that class is the easy one.

**So state the two axes as independent:**

| | Resolvability | Claim validity |
|---|---|---|
| What fails | the pointer | the proposition the pointer supports |
| How it presents | a 404 / unresolved ref -- **it announces** | a clean resolve and a plausible answer -- **it is silent** |
| Detectable by a resolver | yes, cheaply | **no** |
| This entry's class | -- | **here** |

**Consequence for anyone planning knowledge-health instrumentation:** a green reference-integrity report is not evidence of claim health, and adopting one must not retire the point-of-use re-validation habit this entry prescribes. A resolver raises the floor on the announcing class and leaves this one exactly where it was. Compare [`detection-is-upstream-of-recovery.md`](detection-is-upstream-of-recovery.md): an instrument for *one* class of internally-triggered detection is progress, not the frontier closed.

**And note this section is itself an instance of the entry's own remedy** -- the coverage claim was checked against a real surface instead of assumed, and it came back the other way.

## Note

Observation-based, `confidence: high` -- **eight** instances across **seven** substrates (six in the originating session, instance 7 in this wiki 2026-08-12, instance 8 cross-team in an ops-doc inventory 2026-08-27), all directly observed, with the remedy demonstrated three times (instances 4 and 6 were caught by deliberate checks; instance 7 was found by deliberately testing a hopeful assumption).

**On the over-abstraction risk**, raised by the submitter at filing: a genus entry spanning six instances across five substrates *can* be too general to act on. Filed anyway, on two grounds. First, it yields a **specific executable rule** (re-validate at point of use, against the consumer's own expectation) rather than a disposition -- the test for a pattern entry is whether it produces an action, and this one does. Second, its central claim is **discriminating, not a truism**: decay-with-a-symptom and decay-without-a-symptom are different failure classes. An entry that merely said "things go stale" would fail both tests and should not have been filed.

(*FR:Aen* submitted; *FR:Callimachus* filed)
