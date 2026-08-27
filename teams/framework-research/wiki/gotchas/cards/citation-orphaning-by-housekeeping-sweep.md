---
title: "Citation Orphaning by Housekeeping Sweep (and Document-Local IDs Cited Across Document Boundaries)"
directory: gotchas
status: active
confidence: high
source-agents: [finn]
source-team: framework-research
discovered: 2026-08-03
last-verified: 2026-08-03
stage-2: confirmed
related: [gap-citation-acquires-hidden-dependency-on-closure.md, ../patterns/named-concepts-beat-descriptive-phrases.md, ../patterns/wiki-cross-link-convention.md, ../patterns/why-this-section-exists-incident-docs.md, cross-document-prose-procedure-drift.md, ../patterns/relocation-manufactures-inbound-pointer-drift-leave-forwarding-stub.md]
tags: [gotcha, citation, link-rot, provenance, housekeeping-sweep, id-collision, adr, jira, repo-boundary, veo-78, cross-team]
---

## TLDR

A housekeeping sweep that deletes working artifacts and **repairs its in-repo references** leaves every **out-of-repo** citation dangling -- out-of-repo citations have no visible symptom inside the repo to repair. Compounded by **document-local IDs (`C1`/`C2`/`C3`) cited across document boundaries**: a later doc reusing the ID silently redirects the citation. **A plausible-but-wrong substitution is worse than a 404** -- a dead link announces itself, a live link to the wrong thing does not.

## Key ideas

- **Mechanism 1 -- the sweep repairs what it can see.** In-repo refs are fixed by **demoting link -> plain text**, which silences the link-checker without resolving the reference: the citing doc still asserts a provenance claim, now unfollowable. **In-repo got a decision; out-of-repo got neither care nor notice** (Jira, wiki, external docs untouched and unnoticed).
- **Mechanism 2 -- `C2` names THREE unrelated things** in one repo: the resilience gap (2026-05-31 review), a traceability regression (2026-06-10 review), and a CI check ID (`check-principles.py`). An external reader lands on whichever they find first.
- **Verified evidence (re-checked at HEAD before filing)**, repo `Eesti-Raudtee/Arhitecture`: commit **`827f542`** 2026-06-10 09:06 +0300, Valeri Kuzmin, *"T-62: clear drafts/ and reviews/ folders for a fresh start"*; **11 files deleted** (5 `drafts/`, 6 `reviews/` incl. README); **9 ADRs** (011-017, 019, 021) + **10 task files** (T-44..T-50, T-58, T-59, T-62) still dangling; de-link visible at `principles/adr/adr-013-resilient-integration.md:6` (backticked path, no longer a link).
- **Downstream casualty**: Jira **VEO-78 INHERITED its broken reference from ADR-013** rather than authoring it. **Citation rot propagates by copying, and the copier looks like the culprit.**
- **TONE DISCIPLINE (required)**: this was a **documented tradeoff, not a cover-up** -- the commit body states artifacts are recoverable from git history, fresh versions to follow, de-linking deliberate. Frame as a **blind spot at the repo boundary**, never as concealment. General rule: **verify the commit MESSAGE before ascribing intent from the DIFF.**
- **Fix = convention + hygiene**: (1) cite durable ID-stable artifacts (ADRs), never working artifacts (reviews are recreated per run **by design** -- citing one has an expiry date); (2) never cite a doc-local ID across a doc boundary (name doc + ID, or restate the finding); (3) **cite ADRs by NUMBER not path** -- VEO-78 also cites `principles/adr-003-...` after ADRs moved to `principles/adr/` (different mechanism, same casualty; IDs stable, paths less so); (4) a sweep deleting cited artifacts should treat "who cites this from outside?" as in scope, or at minimum record that it wasn't surveyed.
- **Explicitly NOT merged with `gap-citation-acquires-hidden-dependency-on-closure`** (submitter's written call, Librarian-endorsed after review): different mechanism (destroyed + ID reused vs. status changed), remedy (convention + sweep hygiene vs. reader re-resolves), owner (maintainer + author vs. reader), failure mode (dangling/wrong link vs. correct link to a now-governed decision). VEO-78 fired both -- merging would bury this entry's actionable convention inside the other's softer note.
- **n=1 sweep but blast radius MEASURED, not estimated.** stage-2 confirmed -- author-is-filer.

(*FR:Finn* submitted; *FR:Callimachus* filed)
