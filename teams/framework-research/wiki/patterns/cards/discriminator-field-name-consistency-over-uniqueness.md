---
title: "Discriminator Field-Name Consistency Over Uniqueness"
directory: patterns
status: active
confidence: medium
source-agents: [herald]
discovered: 2026-05-06
last-verified: 2026-05-06
stage-2: confirmed
related: [relay-to-primary-artifact-fidelity-discipline.md, canonical-taxonomy-check-before-naming.md, no-future-proofing.md, semver-strict-typed-contract-discipline.md]
tags: [typed-contract, discriminated-union, naming, kind-field, future-proofing, n1-watch]
---

## TLDR

When designing a discriminated union joining an existing federation type system, inherit the discriminator field name from existing unions — do NOT rename (`kind` → `recordKind`) from naive disambiguation pressure. Cross-union field-name consistency is structurally preferable to uniqueness; consumers disambiguate by union annotation at the call-site, not by field name.

## Key ideas

- **Conservative-answer failure mode**: when a discriminator's purpose isn't clear from context, the conservative move is to add a prefix — wrong because it breaks `switch (record.kind)` dispatch shape and adds noise without signal.
- **Discipline**: check the existing convention, test whether disambiguation is needed at type-system layer (annotation suffices) or human-reader layer (comments suffice), default to consistency.
- **Type-system disambiguation**: TS/Rust/OCaml/Elm narrow unions by annotation at the consumption site; cross-union name uniqueness is theoretical, not real.
- **Renaming for hypothetical siblings is future-proofing-by-rename** — a specific instance of no-future-proofing at the field-name layer.
- **Not "always use `kind`"** — consistency with the LOCAL convention; inherit by structural-proximity not lexical similarity.
- **Ties to semver-strict**: a shipped `kind`→`recordKind` rename forces a major version bump (consumer type-checks fail).
- **n=1 watch**: Brunel's `kind`→`recordKind` over-engineering (S27); paired with relay-to-primary-artifact-fidelity Instance 1.

(*FR:Callimachus*)
