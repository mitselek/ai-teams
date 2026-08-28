---
title: "A Negative Probe Result Is Underdetermined -- \"Nothing Here\" Is Not \"Gone\""
directory: gotchas
status: active
confidence: medium
source-agents: [team-lead]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [cold-start-discovery-false-negative-config-before-sessions-json.md, verification-narrower-than-it-appears.md, capability-guard-conflates-tool-absent-with-check-failed.md, ../patterns/stale-snapshot-trusted-as-current.md, ../patterns/daemon-self-report-confirms-config-not-outcome.md, ../patterns/detection-is-upstream-of-recovery.md, log-file-empty-by-construction-when-launcher-splits-streams.md, singular-convention-plural-instances-enumerate-from-the-registry.md, ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md]
tags: [gotcha, probe, false-negative, absence, auth-expiry, cold-start, artifact, attribution, evidence-hygiene, genus, mirror-of-vntia]
---

## TLDR

A probe that returns "nothing here" reports on **the probe's view, not the world**. Absence has at least four causes -- not yet written / not visible to this credential / wrong path / really gone -- and **only the last is permanent**; the reader takes one negative read, picks the permanent cause, and records a *state* ("lazy-create", "deleted") that travels as fact. **Presence is self-certifying; absence is not** -- the two signs carry different evidential weight by construction, and the permanent reading is the cheapest to hold because it ends the inquiry.

## Key ideas

- **Instance 1 (S57-per-Aen, filed 2026-06-18)**: discovery probe inside the ~25 s 2.1.181 write window found no `sessions/<pid>.json` -> "lazy-create / failed" -> **startup halted**. Cause: write-order timing. Overturned by S58 live validation. Full record: `cold-start-discovery-false-negative...`.
- **Instance 2 (S64-per-Aen, 2026-08-26; corrected 2026-08-27)**: artifact watch ended "artifact not found" -> recorded as *"the PO deleted (parked) the artifact"* -> relayed to the librarian -> **written onto the daemon-self-report card as evidence the quote-not-cite rule was "confirmed the hard way"**. Cause: **team-lead's own auth token had expired**; `/login` next morning restored it; artifact live, org-shared, current, third party planning to apply it. Two aggravations: **the failure was in the observer and attributed to the observed as a deliberate act by a named person**; and **a false event was used as evidence for a true rule** -- the rule stands, its provenance was contaminated. Amended struck-not-erased. Correction came from the source re-checking himself, **not from any check firing**.
- **Designed-signal sibling (Hopper, apex)**: `capability-guard-conflates-tool-absent-with-check-failed` -- same conflation hard-wired into a branch (`else` blames the tunnel whether `nc` is missing or the tunnel is down). There the code picks the permanent reading; here the reader does. Fix differs (three-state branch vs reading discipline) -> separate entries.
- **Rule (fires on negative results only)**: (1) **name the cause you assert** -- "not found" is a symptom; (2) **rule out transient causes from a position that can** -- re-probe after the window / after re-auth / from a second credential or path; (3) **if you cannot disambiguate, record the observation not the state** -- *"not seen by `<probe>` at `<time>`"*, never *"gone"*, never *"`<person>` removed it"*. An attribution of agency needs positive evidence of the act.
- **Mirror of `verification-narrower-than-it-appears`**: that is a *green* misread as function (*absence of error is not evidence of function*); this is a *red* misread as non-existence (**absence of the thing is not evidence of its absence**). Same root, opposite sign, all six VNTIA instances run the other way, remedies differ -> cross-linked, not merged.
- **Not folded into cold-start** (version-coupled 2.1.181, TTL, revision trigger = CLI write-order change, which says nothing about auth expiry; its Herald generalisation is window-bound). **Not an instance of stale-snapshot** (that needs a once-true snapshot that aged; "not found" was never true of the world, only of the probe).
- **Confidence medium, pinned to the weakest claim**: mechanism structural, but n=2 reader-side **from the same reader** (the independence axis), two substrates, plus one designed-signal sibling already filed. **Path to high: a reader-side instance from a different reader.**
- **Second same-reader datapoint (S64/S65)**: 0-byte `fr-courier.log` read as a fault -- empty by construction (`log-file-empty-by-construction-when-launcher-splits-streams`); same file read the other way in VNTIA instance 3. Recorded, not counted.
- **APPLICATION NOTE (15:53, same day, same reader -- the rule fired BEFORE the error)**: a watch on a different artifact returned the byte-identical "artifact not found"; team-lead re-probed via the artifact list instead of recording "deleted" -- the gallery had flipped to a **completely different 7-artifact set, both sets labeled "mine"** (credential context switched between the PO's two accounts). Recorded as *"not seen by this credential at 15:53."* **Remedy-effectiveness evidence, NOT independence** (same reader; n and confidence unmoved). New named transient cause, folded into the Rule: **visible to a different credential of the same person** -- nothing marks the flip. Rhymes with the two-islands decision: the artifact gallery is also two islands.
- **stage-2 CONFIRMED** -- librarian-authored on team-lead's relayed correction (scratchpad, commit `1bd0b13`), filed pending fail-closed; **team-lead read back the full entry 2026-08-27 13:33, CONFIRMED** (one frontmatter fix folded: label `aen` -> `team-lead` per the S63 roster-name ruling).

(*FR:Aen* source of both instances; *FR:Callimachus* filed)
