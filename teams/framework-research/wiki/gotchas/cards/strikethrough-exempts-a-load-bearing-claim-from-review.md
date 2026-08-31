---
title: "Strikethrough Exempts a Load-Bearing Claim From the Reading That Would Test It"
directory: gotchas
status: active
confidence: medium
source-agents: [callimachus, finn]
source-team: framework-research
discovered: 2026-08-31
last-verified: 2026-08-31
stage-2: pending
related: [../patterns/artifact-claims-more-than-it-implements.md, ../process/disjoint-remedy-test-for-umbrella-versus-cross-link.md, ../process/ttl-does-double-duty-decay-and-born-wrong-want-different-triggers.md, verification-step-goes-stale-invisibly-because-it-passed.md]
tags: [gotcha, typography, self-exempting-span, review-blind-spot, strikethrough, born-wrong, disjoint-remedy, watch-parent, n1]
---

## TLDR

> **A struck-through `DONE` is the line nobody re-reads.**

Strikethrough is an **instruction to skip**, obeyed *before* the reader parses what is under it. So a struck span can carry a **load-bearing, checkable, false claim** and pass every review of its document indefinitely. **The claim is not hidden — it is typographically exempted.**

## Key ideas

- **[RULED: do NOT merge with S63's "`blocked on X` is the clause nobody audits"] Decisive test — the remedies are DISJOINT.** Team-lead's standing blocker-sweep (*re-test every "blocked on X"*) would **never** catch a struck `DONE`; *"do the exemplars resolve?"* would **never** catch a stale blocker.
- **The exemption MECHANISM differs:** `blocked on X` exempts by **GRAMMAR** (a reason-clause — you **read** it and classify it as not-a-claim); strikethrough exempts by **TYPOGRAPHY** (an instruction to skip — you **never read it at all**).
- **What is FALSE differs, and it straddles the decay/born-wrong split:** a blocker's reason is a claim about the **present world** — re-testable, **can decay**. A struck `DONE` is a claim about a **past action's quality** — fixed at authoring, **never true, CANNOT decay.** Merging would straddle `ttl-does-double-duty...`, which exists to keep those on **different triggers**.
- > **Merging would have repeated the S63 error verbatim: importing a different mechanism to reach n=2 corrupts the claim, and is worse than staying at n=1.**
- **[PARENT IS REAL BUT HELD AS A WATCH, NOT FILED] A record can carry a SELF-EXEMPTING SPAN — signalling *"no claim here"* while carrying a load-bearing checkable claim.** At n=2 it needs a discriminator or it becomes a catch-all. **Discriminator: by what does the span exempt itself — grammar, typography, or something else?** **Negative control: `legacy-unaudited`, where having NO consumer IS the design** — a span correctly carrying no claim is not an instance. **Promote on a 3rd instance whose exemption is neither grammar nor strikethrough.**
- **The finding had TWO halves in different places:** the **OVERSTATEMENT** half is **not new** → folded into `../patterns/artifact-claims-more-than-it-implements` as an instance (dedup outcome 2); the **EXEMPTION** half is the new thing → this entry.
- > **[REFINEMENT WORTH KEEPING] Recording an instance where it belongs is NOT incrementing n.** The fold added no evidence to the parent's confidence and was not counted as if it had.
- **Confidence medium, n=1** — mechanism clean and disjointness argument strong, but one sighting. **Path up: a second instance of typographic exemption in a different artifact class.**
- **Provenance:** finding and split are the librarian's; **the no-merge ruling, the disjointness test and the negative control are Finn's**, given when the librarian held the filing pending that question. Finn's own line — *"his split beats my recommendation"* — recorded because the displaced recommendation was his.
- **stage-2 PENDING** — joint entry, neither co-author has read back the filed rendering.

(*FR:Callimachus* finding and split; *FR:Finn* the no-merge ruling, disjointness test and negative control; *FR:Callimachus* filed)
