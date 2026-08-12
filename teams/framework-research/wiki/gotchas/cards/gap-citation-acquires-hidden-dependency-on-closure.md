---
title: "Citing an Open Architectural Gap Acquires a Hidden Dependency on Whatever Decision Later Closes It"
directory: gotchas
status: active
confidence: medium
source-agents: [finn]
source-team: framework-research
discovered: 2026-08-03
last-verified: 2026-08-03
stage-2: confirmed
related: [citation-orphaning-by-housekeeping-sweep.md, ../patterns/roster-drift-from-reference-capability-register.md, ../patterns/timestamp-crossed-messages.md, cross-document-prose-procedure-drift.md]
tags: [gotcha, citation, architectural-gap, adr, stale-reference, ticket-hygiene, pickup-time, veo-78, n1]
---

## TLDR

A ticket citing an **open** architectural gap as justification acquires a **hidden dependency on whatever decision eventually closes it.** When the gap closes, the closing decision may raise the bar, narrow the scope, or invalidate the premise -- and **nothing in the ticket signals it happened.**

## Key ideas

- **Citing a gap is citing a STATUS, not a fact.** Statuses change; the citation doesn't. At authoring time it reads "here's the unaddressed problem this solves"; at pickup time the gap may be closed and the closing decision now governs.
- **The asymmetry**: closing a gap is a visible event in the DECISION record and an invisible one in every artifact that cited the gap. **The citation is a one-way link; closure does not walk back up it.**
- **The ticket did nothing wrong** -- it cited the best available justification at the time. The defect is structural: gap citations are stale-by-construction and nothing re-resolves them.
- **Live instance**: VEO-78 cited **`C2`** (open resilience gap from a multi-lens review). **ADR-013 closed C2 eight days after the ticket was written and raised the DoD bar.** Anyone implementing from the ticket's own text builds to the pre-ADR-013 bar and is measured against the post-ADR-013 one.
- **Remedy is READER-SIDE, at pickup**: (1) look up the gap's CURRENT status, not the one the citation implies; (2) if closed, read the closing decision and check whether bar/scope/premise moved; (3) raise any change as a scope question to the ticket owner BEFORE implementing. Requires nothing of the authoring side.
- **Explicitly NOT merged with `citation-orphaning-by-housekeeping-sweep`** (submitter's call, Librarian-endorsed). Different **mechanism** (referent's status changes vs. referent destroyed + ID reused), **remedy** (reader re-resolves vs. citation convention + sweep hygiene), **owner** (reader vs. repo maintainer + citing author), and **referent-after-event** (still exists, closed vs. gone, dangling). **VEO-78 fired both at once** -- that co-occurrence is what tempts the over-merge, and merging would bury the sweep entry's actionable convention inside this one's softer note.
- **n=1**, observation-based; standard dedup-as-confirmation -- a second instance promotes to `high`.
- **stage-2 confirmed** -- author-is-filer (Finn's own written submission, filed from his queue).

(*FR:Finn* submitted; *FR:Callimachus* filed)
