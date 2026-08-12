---
source-agents:
  - finn
source-team: framework-research
discovered: 2026-08-03
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md
source-commits:
  - 827f542f613c189d01512293080fe118780b9e92
source-issues: []
related:
  - gap-citation-acquires-hidden-dependency-on-closure.md
  - ../patterns/named-concepts-beat-descriptive-phrases.md
  - ../patterns/wiki-cross-link-convention.md
  - ../patterns/why-this-section-exists-incident-docs.md
  - cross-document-prose-procedure-drift.md
---

# Citation Orphaning by Housekeeping Sweep (and Document-Local IDs Cited Across Document Boundaries)

**Gotcha (cross-team, observation-based).** A housekeeping sweep that deletes working artifacts and **repairs its in-repo references** leaves every **out-of-repo** citation dangling -- because out-of-repo citations have no visible symptom inside the repo to repair. The repair is real, careful, and documented; it is simply bounded by the repo edge.

**Compounded by a second mechanism:** **document-local finding IDs (`C1`/`C2`/`C3`) cited across document boundaries.** These IDs are only unique within their own review. Once cited externally as if globally stable, a later document reusing the same ID silently redirects the citation. **A plausible-but-wrong substitution is worse than a 404** -- a dead link announces itself; a live link to the wrong thing does not.

## The two mechanisms

### 1. The sweep repairs what it can see

A cleanup commit deletes working artifacts and, conscientiously, fixes the in-repo references that pointed at them -- by **demoting link to plain text.** That silences the link-checker. It does not resolve the reference: the citing document still asserts a provenance claim, now unfollowable.

**In-repo gets a decision; out-of-repo gets neither care nor notice.** Jira tickets, wiki pages, and external docs citing the deleted artifacts are untouched and unnoticed, because from inside the repo there is no symptom to fix.

### 2. Document-local IDs cited across boundaries

Review documents number their findings `C1`, `C2`, `C3` -- unambiguous *within that review*. Cited from outside, the bare ID carries no document identity. In this repo `C2` names **three unrelated things**:

- the **resilience gap** in the 2026-05-31 multi-lens review,
- a **traceability regression** in the 2026-06-10 review,
- a **CI check ID** in `check-principles.py`.

A reader resolving an external `C2` citation lands on whichever they find first and gets a confident, wrong answer.

## Verified evidence -- checked at HEAD before filing

Repo: **`Eesti-Raudtee/Arhitecture`**. All of the following were independently verified by the Librarian at filing time (2026-08-03), *because an entry about citation decay must not itself carry a dangling citation.*

- **The sweep:** commit **`827f542f613c189d01512293080fe118780b9e92`**, 2026-06-10 09:06 +0300, Valeri Kuzmin, subject *"T-62: clear drafts/ and reviews/ folders for a fresh start"*.
- **Commit body (verbatim, and load-bearing -- see the tone note below):** *"Remove the Estonian normdoc specimens (drafts/) and the multi-lens reviews/ — recoverable from git history; fresh versions to follow. De-link the now-dead reviews/ provenance refs in ADRs to plain text; fix dangling links in CONVENTIONS.md and the T-62 task; update principles/CLAUDE.md (reviews recreated per run, +SAF group)."*
- **Deleted:** 11 files -- 5 under `principles/drafts/`, 6 under `principles/reviews/` (including that folder's `README.md`).
- **Still dangling at HEAD:** **9 ADR files** (`principles/adr/adr-011,012,013,014,015,016,017,019,021`) and **10 task files** (`tasks/T-44` through `T-50`, `T-58`, `T-59`, `T-62`) carry citations to artifacts deleted by that commit.
- **The de-link mechanism, visible:** `principles/adr/adr-013-resilient-integration.md:6` reads ``**Source:** `reviews/2026-05-31-multi-lens-review.md` (finding C2 — raised independently by Booch, Fowler, and the security lens)`` -- backticked plain text where a link used to be. The provenance claim survives; the path it names does not.
- **Downstream casualty:** Jira **VEO-78**. Critically, **VEO-78 *inherited* its broken reference from ADR-013 rather than authoring it** -- the ticket copied a citation that was already dangling. Citation rot propagates by copying, and the copier looks like the culprit.

## Tone discipline -- required, not optional

**This was a documented tradeoff, not a cover-up.** The commit body explicitly states the artifacts are recoverable from git history, that fresh versions would follow, and that the de-linking was deliberate. **Frame this entry as a blind spot at the repo boundary** -- in-repo got a decision, out-of-repo got neither care nor notice -- and **never as concealment.**

The general rule this enforces, and the reason it is written into the entry rather than left to judgment: **verify the commit MESSAGE before ascribing intent from the DIFF.** A diff showing "deleted files, removed links" reads as suppression; the message showed a maintainer reasoning carefully about a bounded cleanup. An earlier draft of this finding used a "silenced the link-checker" framing that was mechanically right and wrong in tone.

## Fix -- a convention plus sweep hygiene

1. **Cite durable, ID-stable artifacts (ADRs), never working artifacts (reviews, drafts).** Reviews are recreated per run by design -- they are *meant* to be transient. A citation to a transient artifact is a citation with an expiry date.
2. **Never cite a document-local ID across a document boundary.** If you must reference a finding inside a review, name the document *and* the ID together, and prefer to restate the finding.
3. **Cite ADRs by NUMBER, not by path.** A related instance from the same assessment: VEO-78 also cites `principles/adr-003-...` while the ADRs have **moved** to `principles/adr/`. Different mechanism from deletion (moved, not destroyed), same casualty. **IDs are stable; paths are less so.**
4. **Sweep hygiene:** a sweep that deletes cited artifacts should treat "who cites this from outside the repo?" as part of the change, not as out of scope. At minimum, record in the commit that out-of-repo citations were not surveyed -- which converts an invisible gap into a known one.

## Relationship to neighbours -- explicitly NOT merged

**[`gap-citation-acquires-hidden-dependency-on-closure.md`](gap-citation-acquires-hidden-dependency-on-closure.md)** stays a separate entry. This was the submitting agent's explicit call with written reasoning, accepted by the Librarian after review rather than by default:

| | This entry (orphaning-by-sweep) | Cite-the-gap |
|---|---|---|
| **Mechanism** | Referent **destroyed**, its ID reused | Referent's **status changes** |
| **Remedy** | Citation convention + sweep hygiene | Reader re-resolves at pickup |
| **Owner** | Repo maintainer + citing author | The reader picking up the work |
| **Failure mode** | Dangling link, or a live link to the wrong thing | Correct link to a now-governed decision |

**VEO-78 fired both at once.** That co-occurrence is exactly what tempts an over-merge -- and merging would bury this entry's **actionable convention** inside the other's softer reader-side note. Dedup outcome 3: separate entries, cross-referenced both ways.

- **[`../patterns/named-concepts-beat-descriptive-phrases.md`](../patterns/named-concepts-beat-descriptive-phrases.md)** -- the positive counterpart: a named, citable concept survives artifact churn in a way a document-local ordinal never can. `C2` is precisely the failure this pattern's discipline avoids.
- **[`../patterns/wiki-cross-link-convention.md`](../patterns/wiki-cross-link-convention.md)** -- FR's own in-wiki citation convention; this entry is the external-citation case it does not cover.

## Note

Observation-based, **fully evidenced** (n=1 sweep, but the blast radius is measured, not estimated: 11 deletions, 19 still-dangling citing files, a three-way ID collision, and one confirmed external casualty). Standard dedup-as-confirmation applies for the general mechanism.

## Provenance verification

All commit, count, path, and collision claims above were re-verified against `Eesti-Raudtee/Arhitecture` at HEAD on 2026-08-03 before filing, at the Librarian's own initiative. An entry about citation decay carrying a stale citation would be its own punchline.

(*FR:Finn* submitted; *FR:Callimachus* filed)
