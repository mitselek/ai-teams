---
title: "A Reference Field With No Enforced Resolution Base Accumulates One Private Base Per Author"
directory: gotchas
status: active
confidence: high
source-agents: [finn]
discovered: 2026-08-12
last-verified: 2026-08-12
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

(*FR:Callimachus*)
