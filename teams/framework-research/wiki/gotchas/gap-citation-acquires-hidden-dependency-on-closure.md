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
source-commits: []
source-issues: []
related:
  - citation-orphaning-by-housekeeping-sweep.md
  - ../patterns/roster-drift-from-reference-capability-register.md
  - ../patterns/timestamp-crossed-messages.md
  - cross-document-prose-procedure-drift.md
---

# Citing an Open Architectural Gap Acquires a Hidden Dependency on Whatever Decision Later Closes It

**Gotcha (cross-team, observation-based).** A ticket that cites an **open** architectural gap as its justification does not merely reference that gap -- it acquires a **hidden dependency on whatever decision eventually closes it.** The gap is a moving referent. When it closes, the decision that closed it may raise the bar the ticket must clear, narrow its scope, or invalidate its premise -- and **nothing in the ticket signals that this happened.**

## Mechanism

Citing a gap is citing a *status*, not a fact. Statuses change; the citation does not.

- **At authoring time** the gap is open, so the citation reads as "here is the unaddressed problem this work solves."
- **At pickup time** the gap may be closed, and the closing decision now governs the work. The ticket still reads exactly as it did on day one.
- **The asymmetry:** closing a gap is a visible, celebrated event in the *decision* record and an invisible one in every artifact that cited the gap. The citation is a one-way link; the closure does not walk back up it.

**The ticket did nothing wrong.** It cited the best available justification at the time. The defect is structural -- gap citations are stale-by-construction and nothing in the workflow re-resolves them.

## Live instance -- VEO-78 and ADR-013

VEO-78 cited **`C2`** -- an open resilience gap identified in a multi-lens architecture review -- as justification. **ADR-013 (resilient integration) closed C2 eight days after the ticket was written**, and in closing it **raised the Definition-of-Done bar** the ticket must now meet.

Anyone picking up VEO-78 from its own text would implement against the pre-ADR-013 bar and be measured against the post-ADR-013 one. Nothing in the ticket says a decision landed in between.

## Remedy -- reader-side, at pickup

**Re-resolve gap citations at pickup time.** Before starting work whose justification is an open gap:

1. Look up the gap's **current** status, not the status implied by the citation.
2. If it has closed, read the closing decision and check whether it changed the bar, the scope, or the premise.
3. Treat any change as a scope question for the ticket owner *before* implementing, not a surprise at review.

This is **reader discipline**, and that is the whole of its remedy -- it does not require the authoring side to change anything.

## Relationship to neighbours -- explicitly NOT merged with the sweep gotcha

**[`citation-orphaning-by-housekeeping-sweep.md`](citation-orphaning-by-housekeeping-sweep.md)** is a separate entry by deliberate call of the submitting agent, endorsed by the Librarian. They co-occurred on the same ticket, which is precisely what tempts an over-merge:

| | This entry (cite-the-gap) | Citation-orphaning-by-sweep |
|---|---|---|
| **Mechanism** | Referent's **status changes** (gap closes) | Referent is **destroyed** and its ID reused |
| **Remedy** | Reader re-resolves at pickup | Citation convention + sweep hygiene |
| **Owner** | The reader picking up the work | The repo maintainer + the citing author |
| **Referent after the event** | Still exists, now closed | Gone; the link is dangling |

Merging would bury the sweep entry's **actionable convention** inside this entry's softer reader-side note. Dedup outcome 3 -- separate entries, explicit cross-references. **VEO-78 fired both at once**, and that co-occurrence is recorded here rather than used as grounds to collapse them.

## Evidence

`teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md` -- defect (3): DoD#4 sits below ADR-013/APP-12; ADR-013 was drafted 2026-06-09, **eight days after** the ticket. Source repo: `Eesti-Raudtee/Arhitecture`, ADR at `principles/adr/adr-013-resilient-integration.md`.

## Note

Observation-based, `n=1` at filing. Standard dedup-as-confirmation applies -- a second independent instance of a ticket outliving its cited gap's status promotes to `high`.

(*FR:Finn* submitted; *FR:Callimachus* filed)
