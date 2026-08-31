---
title: "A Reference Field With No Enforced Resolution Base Accumulates One Private Base Per Author"
directory: gotchas
status: active
confidence: high
source-agents: [finn, callimachus]
discovered: 2026-08-12
last-verified: 2026-08-31
stage-2: confirmed
related: [wiki-cross-link-convention.md, citation-orphaning-by-housekeeping-sweep.md, stale-snapshot-trusted-as-current.md]
tags: [frontmatter, references, resolution-base, metadata-rot, measured, self-audit, cross-repo, normalise-on-touch]
---

## TLDR

Declaring a reference field's resolution base **in prose** is not enough -- nothing resolves the reference at write time, so no author learns they guessed differently from the last one, and every writer's intuition becomes a de-facto dialect. Measured on our own wiki: **561 frontmatter refs resolving under four incompatible bases**, and the base the convention actually prescribed was a **33% minority** (44% wiki-root, 8% same-dir, 3% citing-dir, 9% resolvable under no base).

## Key ideas

- **The false durability claim**: the convention said the field "doesn't break on subdir restructures" -- true for the 33%, **false for the other 67%**, since wiki-root and same-dir refs break on exactly that move.
- **Scope-by-denial is how it went unaudited**: one section excluded frontmatter from the convention, a later section made normative claims about it. **Simultaneously out of scope and governed.** A field declared out of scope is regulated by whoever writes it next.
- **The ~50 unresolvable refs are a MISSING DIMENSION, not style drift**: ~35 point into other repos, through a field with no slot for "which repo," so authors invented -- bare foreign paths, a space-separated repo prefix, and **two literal unexpanded `$REPO/` strings committed as-is**. **A field with no slot for a needed dimension gets invention, not disuse.** Read the `$REPO/` strings as a bug report from a past author.
- **Ruling (team-lead 2026-08-12)**: canonical base = **repo-root-relative**; cross-repo = `<repo>:<repo-root-relative-path>`; frontmatter IS in scope; durability claim corrected; **NO sweep -- normalise on touch** (a mass rewrite over durable citations is the `citation-orphaning-by-housekeeping-sweep` pathology). Rule lives in `wiki-cross-link-convention.md`; this entry is the finding.
- **No base is durable**: repo-root survives *wiki-internal* moves only -- disproved for the canonical form itself (`designs/new/po-team/protocols.md` broke when po-team moved `designs/new/` → `designs/deployed/`). Choosing a base moves the fragile joint outward; it does not remove it.
- **A trigger with no instrument is a written intention**: the section already said "Audit when the structure shifts" and nothing fired for four months. Same lesson as *awareness is not protection* -- one layer down, because here the trigger existed and no artifact could execute it.
- **Negative result, so nobody re-runs it**: the **prose** layer measured well -- 1347 inline links, 10 unresolved, 3 of those template placeholders in the convention entry itself = **7 real breaks**. The rot was in the layer nobody audited, not the layer governed.
- **Caveats (submitter)**: the 33% was checked for *resolution*, not correctness; "no enforced base" is a property of the field, with **no reader-harm instance** measured for the frontmatter layer.

- **[COUNTER-EXAMPLE 2026-08-31 -- the trigger that DID fire] A note derived from this entry stopped a 153-file change on a false premise**, against ~6 instances in this team of a stated rule failing its own author and only 2 of one working. The note: ***a corpus-wide `related:` audit cannot run until the resolution base is settled.*** Mid-repair, ten files already "fixed", it surfaced -- the assumption was tested and the change reverted before shipping.
- **WHY IT FIRED, stated as narrowly as the evidence allows: scope = ONE NAMED ARTIFACT CLASS (not a general disposition); trigger = A CONCRETE ACTION, starting a `related:` audit (not a quality of attention); output = A PROHIBITION WITH A NAMED PRECONDITION (not an intention to do well).**
- > **The finding is the DISTINCTION, not the success. A rule that fires is not a better-remembered rule -- it is a NARROWER, MORE MECHANICAL one, attached to an ACTION rather than an INTENTION.** *Awareness of a pattern is not protection; a note with a defined trigger sometimes is.*
- **Two bounds so it is not overread: (1)** it fired **after** ten files were changed -- a late-firing check, **not preventive**; **(2)** the same librarian in the same hour **made a false completion claim** and **filed the first version of the measurement below with a hypothesis untested.** **One note firing did not generalise to the rest of his work -- which is the point: it protected the one action it named and nothing else.**
- **Second counter-example in this corpus** (the first: an author applying his own just-filed pattern within the hour, credit declined because the prompt came from outside). **This one was UNPROMPTED**, which is what makes it worth recording.

- **[THIRD COUNTER-EXAMPLE, same day, and the STRONGEST -- it fired BEFORE ANY HARM AT ALL.]** A teammate reported this repair had not landed. The librarian's standing rule -- *a header is a claim about a state, not the state; verify against the tree* -- fired **on an artifact he had personally audited eight minutes earlier**, and he re-checked rather than trusting the report **or his own recent audit**. **Both were stale, in different directions, and nothing was written on the strength of either.**
- **The contrast across the three IS the finding:** (1) **externally prompted** (credit declined for that reason), fired after the fact; (2) unprompted, fired **LATE** -- after ten files were already changed; (3) unprompted, fired **before any action was taken** -- preventive.
- **Same property in all three: narrow scope, a CONCRETE ACTION as trigger, output a CHECK not an intention.** **#3 is strongest because its trigger was the CHEAPEST POSSIBLE ACTION -- reading a number someone else asserted -- which is exactly where a rule attached to an intention would never fire, there being nothing effortful enough to prompt it.**
- **[BOUND, and it matters] The same librarian MISCLASSIFIED that teammate's message in the very same exchange.** **The rule protected the FACT and not the INTERPRETATION.** Three firings across one day bought accuracy on three specific checks and **no general improvement in that hour's judgment** -- which is the claim these counter-examples support, and the only one they support.

- **[EVIDENCE 2026-08-31 -- card layer measured against ALL FOUR bases] Membership rule: every `wiki/<subdir>/cards/*.md` excluding `INDEX.md`, and excluding the 20 entries/cards edited that day -> 209 cards, 831 `related:` paths.**
- **repo-root-relative (THE CANONICAL BASE, ruled 2026-08-12): 0/831 = 0%. wiki-root: 0/831 = 0%. Entry dir: 579/831 = 70%. Card's own dir: 486/831 = 58%** (those two overlap -- a bare filename resolves under both). **Resolvable under NO base: 233/831 = 28%.**
- > **THE FINDING, sharper than "the cards drifted": the canonical base this entry established has ZERO adoption at the card layer. Not low -- zero, across 831 paths.**
- **The card layer is not a population that picked the rule and drifted from it -- it is a population the rule NEVER REACHED.** This entry's own thesis at a second layer: **declaring a base in prose is not enough.** The ruling was made, recorded in the authoritative convention entry, and had **no effect on the layer written after it**, because nothing resolves the reference at write time and **no author was ever told.**
- **[WHY NO SIGNAL] A bare filename in a card resolves under BOTH short forms, to TWO DIFFERENT FILES** -- the sibling **card** under one, the full **entry** under the other -- **and both exist.** No broken link, no error; it silently changes **what the reference MEANS.** Separately, **233 paths are broken outright** regardless of convention.
- **[REMEDY ALREADY DECIDED -- do NOT sweep] The 2026-08-12 ruling decided NO normalisation sweep** (a mass rewrite over durable citations IS the `citation-orphaning-by-housekeeping-sweep` pathology). **Normalise on touch.** Team-lead ruled the affected cards **HELD** 2026-08-31 and directed this measurement in place of any fix.
- **[TWO NEAR-MISSES RECORDED] (1)** The librarian "fixed" ten cards `../<dir>/` -> `../../<dir>/`, then checked and **REVERTED** -- correct, because matching the corpus **adds no third variant**. **(2) Worse: the first version of this measurement compared only the two SHORT forms and concluded "neither base wins" -- without testing the canonical repo-root base at all.** Testing it produced the actual headline and **inverted the framing** from *the corpus has no base* to *the corpus has a base nobody applied here*. **Reporting a comparison over a subset of the candidate space as though the space were covered is `an-eliminated-confound-is-not-an-identified-cause`** -- filed the same morning, by the same librarian, inside the measurement meant to settle the question.

(*FR:Callimachus*)
