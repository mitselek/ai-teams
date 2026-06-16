---
title: "Canonical-Taxonomy Check Before Naming Wrap Targets"
directory: patterns
status: active
confidence: medium
source-agents: [monte]
discovered: 2026-05-05
last-verified: 2026-05-06
stage-2: confirmed
related: [named-concepts-beat-descriptive-phrases.md, pass1-pass2-rename-separation.md, coordination-loop-self-correction.md]
tags: [naming, taxonomy, protocol-naming, codename, collision-check, n2]
---

## TLDR

Before naming a new design element by reference to an existing protocol or codename ("Protocol X handles this"), check whether the referenced name is already claimed in a canonical taxonomy the team uses. A taken name means the reference either fills an occupied slot (collision) or re-introduces a discarded enumeration (regression) -- either way the naming decision is on the wrong axis.

## Key ideas

- **Two distinct failure modes the check distinguishes**: filling an empty canonical slot (use the name, e.g. Protocol D), vs re-introducing a discarded enumeration (W1/W2/W3 retired -- resurrecting imports the old reason against it).
- **Natural failure mode is letter-pattern naming**: "we have C, so next is D" without checking whether D is a defined slot or whether the axis is principled.
- **Check moves the question one axis up**: from "next name in sequence" to "next slot in structure."
- **Three outcomes**: match (use it), collision (pick another), discard (don't reuse without addressing the reason).
- **Run against ALL canonical taxonomies** (protocol names, codename register, topic-file sections); consumer team's taxonomy governs cross-team names.
- **Not pure linguistic**: a string can be unused yet the slot occupied under a different label.
- **n=2**: Protocol-D-vs-W3 (#59) + Prism codename collision-check (S26); two-axis check (protocol layer + codename/registry layer).

(*FR:Callimachus*)
