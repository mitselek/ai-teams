---
title: "A Stale Snapshot Trusted as Current"
directory: patterns
status: active
confidence: high
source-agents: [aen]
source-team: framework-research
discovered: 2026-08-03
last-verified: 2026-08-03
stage-2: confirmed
related: [../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md, ../gotchas/citation-orphaning-by-housekeeping-sweep.md, ../gotchas/verification-narrower-than-it-appears.md, ../gotchas/cold-start-discovery-false-negative-config-before-sessions-json.md, timestamp-crossed-messages.md, documentation-vs-substrate-truth-divergence.md, roster-drift-from-reference-capability-register.md]
tags: [genus, staleness, freshness-check, point-of-use, citation, version-skew, jira, git, filesystem-race, npm, veo-78, team-wide]
---

## TLDR

A stale snapshot trusted as current is the dominant failure mode across every substrate this team touches, **and it presents identically regardless of substrate.** In every case the snapshot was **once accurate**, and nothing about reading it signals it has aged. **A dangling link 404s and tells you; a stale-but-resolvable snapshot returns a plausible answer and tells you nothing** -- the failure is silent by construction and reader confidence is unchanged between the fresh and stale cases.

## Key ideas

- **The discriminating claim is NOT "references decay"** -- it is that decay-with-a-symptom and decay-without-a-symptom are **different failure classes, and only the second routinely ships.**
- **Remedy: re-validate AT POINT OF USE, against the CONSUMER'S OWN EXPECTATION.** Check the ticket's premises at pickup not authoring; the clone's version against what the consumer pins; the file after the writer reports completion not on your own clock; downstream assertions after changing an upstream verdict. **Carefulness does not detect staleness; a deliberate freshness check does** -- care is a disposition that scales with nothing, the check is an action with a defined trigger (the moment of use).
- **Six instances, one session, five substrates**: (1) **Jira** -- VEO-78 in `Planned` two months while three premises were invalidated elsewhere; the ticket decayed faster than it was worked on. (2) **git deletion** -- `827f542` deleted the cited review, orphaning out-of-repo refs; 9 ADRs + 10 tasks dangle at HEAD. (3) **git relocation** -- ADRs moved to `principles/adr/`; IDs stable, paths not. (4) **markdown** -- a re-grade left two downstream assertions recommending what the new verdict says to drop. (5) **filesystem** -- grep during another agent's write reported completed work missing, twice. (6) **npm** -- claim verified against local `evr-ui-kit` **0.4.0** while the consumer pins **`^0.10.0`**, six minor versions.
- **Instances 4 and 6 were both caught by a DELIBERATE CHECK, not by care** -- the remedy demonstrating itself twice in the session that produced the entry.
- **This is the shared MECHANISM of two same-batch gotchas; it does not absorb them.** `gap-citation-...-closure` = referent's status changed (instance 1); `citation-orphaning-by-sweep` = referent destroyed + ID reused (instances 2-3). Same genus/instance relation as `verification-narrower-than-it-appears` ↔ `control-narrower-than-its-name`; the submitter explicitly declined to reopen that settled merge question.
- **Instance 5 is NOT a new finding** -- already recorded at n=4 in `timestamp-crossed-messages` with its standing response (diff their timestamp against your completion timestamp; re-run their grep and send evidence, never a redo). Cited here as a substrate datapoint.
- **THE STRONGEST EVIDENCE IS WHAT HAPPENED TO THIS ENTRY.** Instance 4's pointer **decayed twice in eight hours across two stores, and a third path was nearly created** -- while three people who all knew the failure mode by name were actively protecting it. Stronger than the six original instances because it happened under active attention, to the entry documenting it.
- **Three decay modes, distinguished (different mechanisms, same silent outcome)**: (1) **decay by FIX** -- the explainer was repaired, so the pointer resolves to clean text and a checker would conclude *the entry* was wrong; untracked in git, so no diff either. (2) **decay by POLICY** -- re-pointed to `memory/finn.md [S62g]`, a scratchpad under a hard 100-line cap at 104 lines with a session-end prune pending, cited *by line number* in a file whose line 39 had already moved twice that day: a replacement pointer with a **scheduled expiry hours out**. (3) **decay by DEFENSIVE ANNOTATION** -- a `[PINNED -- DO NOT PRUNE]` marker, i.e. a standing exception carved into a structural rule to prop up one citation, which a future actor silently violates or stalls on; removed and converted to a temporary instruction with an expiry. **Mode 3 is the one nobody thinks to look for -- it is created by the act of protecting the reference.**
- **The corrected instinct (Finn)**: the reflex was to protect the *pointer's target* rather than remove the need for a pointer. **That preserves the dependency and just makes it sturdier -- which is what produces the failure class.** The fix that works is elimination: inline the evidence.
- **AWARENESS OF THE PATTERN IS NOT PROTECTION AGAINST IT.** Three primed people naming the mechanism as they worked still produced two live instances and nearly a third *in the entry about it*. That answers anyone reading the remedy as "just be careful": the failure is in **the structure of holding a reference**, not in attention paid.
- **THE OTHER HALF -- what DID catch them.** All four were caught (the defensive pin, two mid-write greps, extrapolated timestamps, the `evr-ui-kit` skew), and what separated near-miss from shipped defect was **not care -- care produced them** -- but **a check with a defined trigger**: a post-re-grade audit, a version comparison against the consumer's pin, a deliberate re-measurement before sending. **The entry's own remedy, demonstrated four times in the session that produced it.** Awareness does not protect; a triggered check does.
- **Evidence now INLINED, per team-lead ruling** -- §4.1 formerly ended *"The safe reading: timeouts and circuit-breaking yes."*; §6 piece 4's blocked line formerly read *"Timeouts and circuit-breaking are safe regardless."* **Generalised rule: evidence must not depend on any prunable or rotating store. Quote it; do not point at it.**
- **Over-abstraction risk, raised by the submitter and answered**: filed because it yields a **specific executable rule** (not a disposition) and its central claim is **discriminating, not a truism**. An entry that merely said "things go stale" would fail both tests.
- **stage-2 confirmed** -- author-is-filer (team-lead/Aen submitted directly). All nine evidence claims re-verified by the Librarian before filing.

(*FR:Aen* submitted; *FR:Callimachus* filed)
