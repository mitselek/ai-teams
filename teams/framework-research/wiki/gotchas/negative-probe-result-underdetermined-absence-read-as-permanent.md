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
  - teams/framework-research/memory/team-lead.md
  - teams/framework-research/startup.md
  - teams/framework-research/wiki/patterns/cards/daemon-self-report-confirms-config-not-outcome.md
source-commits:
  - 1bd0b13
source-issues: []
related:
  - cold-start-discovery-false-negative-config-before-sessions-json.md
  - verification-narrower-than-it-appears.md
  - capability-guard-conflates-tool-absent-with-check-failed.md
  - ../patterns/stale-snapshot-trusted-as-current.md
  - ../patterns/daemon-self-report-confirms-config-not-outcome.md
  - ../patterns/detection-is-upstream-of-recovery.md
  - log-file-empty-by-construction-when-launcher-splits-streams.md
  - singular-convention-plural-instances-enumerate-from-the-registry.md
---

# A Negative Probe Result Is Underdetermined -- "Nothing Here" Is Not "Gone"

**Gotcha (team-wide, observation-based, with a structural mechanism).** A probe that returns "nothing here" reports on **the probe's view**, not on the world. Absence has at least four causes -- *not yet written* / *not visible to this credential* / *wrong path or scope* / *really gone* -- and **only the last is permanent**. The reader takes one negative read, picks the permanent cause, and records a **state** ("lazy-create", "deleted") that then travels as fact.

## The asymmetry -- the discriminating claim

**Presence is self-certifying; absence is not.** If the probe saw the thing, the thing is there. If the probe did not see it, that certifies only that *this probe, from this position, at this instant* did not -- nothing about the thing. Positive and negative results carry **different evidential weight by construction**, and the ordinary reading habit treats them as symmetric.

Worse, the permanent reading is the **cheapest to hold**: choosing "gone" ends the inquiry, while every transient cause obliges a retry. So the reading that costs nothing now is the one that is most expensive to be wrong about later. This is not "checks can be wrong" -- it is that one *sign* of result needs cause-disambiguation before it may be recorded, and the other does not.

## Two reader-side instances, same reader, two substrates

1. **S57-per-Aen cold-start halt (mid-June 2026; filed 2026-06-18).** A discovery probe run inside the ~25 s CLI 2.1.181 write window found no `sessions/<pid>.json` and concluded *lazy-create / discovery failed* -- a permanent property -- then **halted startup**. Cause: write-order timing; the dir was written eagerly and the probe was early. S58 live-validated and overturned the halt. Herald's rule from that entry, quoted verbatim: *"a discovery/liveness/existence probe that returns 'nothing here' MUST await/retry before reporting absence -- NEVER conclude lazy-create or non-existence from a single in-window read."* Substrate: CLI filesystem. Recorded in full at [`cold-start-discovery-false-negative-config-before-sessions-json.md`](cold-start-discovery-false-negative-config-before-sessions-json.md).

2. **S64-per-Aen artifact watch (2026-08-26; corrected 2026-08-27).** An artifact watch ended with *"artifact not found"*. Team-lead recorded, in his own words (scratchpad, since corrected): *"I recorded 'PO deleted the artifact' -- FALSE. The watch ended with 'artifact not found' because my auth token had expired (`/login` the next morning restored it); the artifact is LIVE, org-shared, current. I generalised a transient auth failure into a deliberate act by the PO and propagated it to Cal."* Cause: the **observer's** credential had lapsed. Substrate: a claude.ai artifact read through a session credential. Two aggravations make this the sharper instance:
   - **The failure was in the observer and was attributed to the observed -- as a deliberate act by a named person.** An attribution of agency ("the PO deleted / parked it") needs positive evidence of the act; absence of the object is not that.
   - **The false event was then used as evidence for a true rule.** The librarian wrote it onto [`../patterns/cards/daemon-self-report-confirms-config-not-outcome.md`](../patterns/cards/daemon-self-report-confirms-config-not-outcome.md) as *"confirmed the quote-not-cite call the hard way"*. The rule (a session-scratchpad artifact is a prunable store as a class -- quote, do not cite) stands on its own ground and never needed the event. Its provenance was contaminated anyway. Amended 2026-08-27, struck not erased.

   The correction reached the wiki because the source re-checked himself the next morning -- **not because any check fired**. Nothing in the filing path asked "was the absence disambiguated?" (see [`../patterns/detection-is-upstream-of-recovery.md`](../patterns/detection-is-upstream-of-recovery.md)).

**Designed-signal sibling, different agent and team:** [`capability-guard-conflates-tool-absent-with-check-failed.md`](capability-guard-conflates-tool-absent-with-check-failed.md) is the same conflation **hard-wired into a check's branch structure** -- `command -v nc && nc -z ...` lands both *tool absent* and *tunnel down* in `else`, and `else` blames the tunnel, permanently. There the permanent reading is chosen by the code; here it is chosen by the reader. Cross-linked, not merged: the fix there is a three-state branch, here a reading discipline.

*Datapoint, not a new finding:* `stale-snapshot-trusted-as-current` instance 5 (a grep during another agent's write reported completed work as missing) is the same sign-error on the filesystem; it is owned by `../patterns/timestamp-crossed-messages.md`.

*Second datapoint, same reader (S64/S65, 2026-08-26/27):* the 0-byte `fr-courier.log` read as a possible courier fault two sessions running -- the file is empty **by construction** (launcher splits streams, courier logs to stderr), filed as [`log-file-empty-by-construction-when-launcher-splits-streams.md`](log-file-empty-by-construction-when-launcher-splits-streams.md). The same file had earlier been read the *other* way (VNTIA instance 3, as healthy). Recorded, not counted: the reader is the same, so it does not move confidence.

## Rule

Before recording an absence as a **state**:

1. **Name the cause you are asserting** -- deleted / not yet written / not visible to this credential / wrong path. "Not found" is a symptom, not a cause.
2. **Rule out the transient causes from a position that can**: re-probe after the window closes, after re-authenticating, from a second credential or path. The next morning's `/login` was exactly this step, taken a day late.
3. **If you cannot disambiguate, record the observation, not the state**: *"not seen by `<probe>` at `<time>`"* -- never *"gone"*, and never *"`<person>` removed it"*.

The rule is executable and asymmetric on purpose: it fires only on negative results. A positive result needs none of it.

## Neighbours -- and why this is a new entry

- **Mirror of [`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md).** That genus is a *green* reading misread as function -- its spine is *"absence of error is not evidence of function."* This entry is a *red/absent* reading misread as non-existence -- **absence of the thing is not evidence of its absence.** Same root (a probe read as measuring more than it does), opposite sign; all six of its instances run the other way, and the remedies differ (outcome-level probe vs cause-disambiguation + retry). Cross-linked, not merged -- the observe/act pairing precedent applies to sign as well.
- **Not folded into the cold-start entry.** That one is version-coupled to 2.1.181 with a TTL and a revision trigger of *a CLI that writes the two files synchronously* -- which has nothing to say about a credential expiring. It already carries Herald's generalisation, but window-bound (*"within ~25 s of cold start"*). This entry is what remains when the window is any transient -- write order, credential lifetime, poll interval, propagation delay.
- **Not an instance of [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md).** That genus requires a snapshot that was **once true and aged silently**. "Artifact not found" was never true of the world; it was true only of the probe. Different origin, different remedy (freshness check at point of use vs cause-disambiguation of a negative). Adjacent in one property: both deliver a plausible answer that says nothing about its own validity.

## Confidence

**Medium, pinned to the weakest load-bearing claim.** The mechanism (the presence/absence asymmetry) is structural and checkable by inspection. The instance base is n=2 reader-side, **both from the same reader** -- the same independence axis that has held other entries at medium -- across two substrates, plus one designed-signal sibling from a different agent and team that already has its own entry. **Path to high: one reader-side instance from a different reader.** Correlation flagged, not counted away.

## Provenance note

Both instances self-reported by team-lead: instance 1 in `startup.md` and the cold-start entry (2026-06-18); instance 2 in his scratchpad correction of 2026-08-27, committed in `1bd0b13` (*"'artifact deleted' claim withdrawn (auth expiry, not deletion)"*) and relayed to the librarian in the S65 spawn brief with the instruction to check for an existing home before filing. Load-bearing lines are quoted above rather than cited by line -- the scratchpad is a prunable store. **Librarian-authored on a relayed account: filed `stage-2: pending`, fail-closed.** **Team-lead read the full entry back 2026-08-27 13:33 and CONFIRMED** -- both instances accurately rendered, quote verbatim, asymmetry claim and rule endorsed, medium-on-same-reader agreed -- with one frontmatter correction folded: `source-agents` label `aen` -> **`team-lead`** per the S63 ruling that the canonical agent label is the `roster.json` `name`. Gate **`confirmed`** (single source, read back).

## Amendments log

- **2026-08-27 13:33 (team-lead read-back):** `stage-2` pending -> confirmed; `source-agents` label corrected `aen` -> `team-lead` on entry, card, and index row. No content corrections.
- **2026-08-27 (afternoon):** second same-reader datapoint added (0-byte log read as fault; mechanism filed separately); cross-linked.

(*FR:Aen* source of both instances; *FR:Callimachus* filed)
