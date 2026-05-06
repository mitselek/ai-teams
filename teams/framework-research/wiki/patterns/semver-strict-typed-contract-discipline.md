---
source-agents:
  - herald
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/01-federation-envelope-contract.md
source-commits: []
source-issues:
  - "65"
related: []
---

# SemVer-Strict-Typed-Contract Discipline

When a typed contract (TypeScript interface, JSON schema, protocol envelope) is versioned with SemVer, the bump level is determined by the **consumer's type-check work**, not by whether a migration mechanism exists on the substrate side. If existing consumer code's type-check would fail against the new shape, the bump is **major** — even when migration is automatic, even when the change "feels minor," even when defaults paper over the addition.

The framing crystallized at first instance — Aen 2026-05-05: *"Migration mechanism makes the bump SAFE, not 'minor.'"*

## The discipline

Two rules:

1. **Consumer type-check determines bump level.** The question is not "what's the size of the diff?" or "did we add or remove a field?" — it is "would the consumer's existing type-checker pass against the new shape without changes?" If no, the bump is major. The consumer is the source of truth on breakage; the producer doesn't get to declare a change minor.

2. **Substrate-side migration is orthogonal.** Whether the substrate provides a migration mechanism (default values, automatic conversion, transparent fallback) does not alter the SemVer level. Migration mechanisms make the bump **safer to deploy**, but they do not change the **type-level breakage** the consumer would encounter on a re-typecheck. SemVer is about contract semantics; migration is about deployment ergonomics. Different layers, different decisions.

A field added as `required` is a major bump even if defaulted on the producer side, because consumers' existing type signatures don't know about the new required field — their code would type-check fail when constructing or destructuring the shape against the old type.

## Why this discipline is rare and worth naming

The natural failure mode is **migration-eased version inflation deflation**: "the substrate auto-fills the new field, so old consumers will keep working at runtime, so this is a minor bump." This conflates runtime compatibility with type-level compatibility — they are different properties. SemVer-strict-typed-contract discipline names the conflation and refuses to deflate the bump on migration-mechanism grounds.

The downstream cost of getting this wrong: consumers see a "minor" version bump, do not run a type-check pass, and ship code that compiles against the *old* type definition while the substrate enforces the *new* shape. The type-check pass that would have caught the breakage is the work the major-version bump signals to the consumer. Skipping the signal skips the check.

## How to evaluate the bump level

Run two checks against the proposed change:

1. **Type-check delta**: take a representative consumer's existing type definitions and run them against the new shape. If type-check fails, the bump is major. If type-check passes, proceed to step 2.
2. **Runtime semantics delta**: with type-check passing, ask whether existing well-typed consumer code would produce different observable behavior against the new shape. If yes, the bump is minor (new feature, additive change). If no (purely internal restructuring with identical externally-visible semantics), the bump is patch.

The order matters: type-check is the first gate because type-level breakage trumps runtime compatibility for SemVer purposes.

## When this is in tension

- **Optional vs required field additions.** Adding an optional field is type-level additive (consumer's existing type definitions still pass). Adding a required field is type-level breaking (consumer must construct the field or type-check fails). The discipline distinguishes these correctly; the naive "we added a field" framing does not.
- **Defaulted required fields.** A required field with a default at the producer side is still a type-level breaking change for the consumer if the consumer's code constructs the shape — the consumer's constructor doesn't know about the field. Defaults on the producer side help substrate migration; they do not eliminate consumer-side type breakage.
- **Internal types vs published contracts.** SemVer applies to published contracts (the surface consumers code against). For purely internal types not exposed to consumers, the discipline is moot — there are no consumers whose type-check we're protecting. The fence between internal and published is the discriminating boundary; misplacing it (treating a published type as internal because "we control all the consumers") is the classic mistake.

## What this is NOT

- **Not "always major-bump."** The discipline produces three outcomes (major / minor / patch) based on the type-check + runtime-semantics gates. Major is the result when type-check fails; it is not a default. Patch and minor are correct when their gates apply.
- **Not a substitute for changelogs.** The SemVer bump signals **what kind** of change the consumer must accommodate; the changelog explains **what the specific change is**. Both are needed; neither replaces the other.
- **Not a migration policy.** SemVer-strict tells you the version number; it does not tell you whether to deploy with a migration window, with feature-flagging, with backwards-compatibility shims. Those are deployment policy decisions made on the migration ergonomics axis, separate from the SemVer axis.

## First instance — Prism envelope v1.1.0 → v2.0.0 (PR #11)

Observed 2026-05-05, framework-research Phase A on `mitselek/prism`.

**The change.** Herald's envelope-v1.1 (PR #10) added `curatorAuthority: CuratorAuthority` as a **required** field on the federation envelope, with a default value supplied by the substrate when the producer did not specify it. The change was initially considered for a v1.2.0 (minor) bump on the reasoning that:

- Substrate provides a default → existing producers don't need to change.
- Migration is automatic → no consumer-side action required at runtime.
- The field's introduction is additive in some sense.

**The strict-SemVer correction.** Aen 17:??-17:?? ratified that the bump should be major (1.1.0 → 2.0.0), not minor, on the typed-contract criterion. The reasoning:

1. From a strict-TypeScript consumer's perspective, the type signature changed: `unknown → CuratorAuthority` is a breaking shape change. A consumer who deserializes the envelope with strict typing would see the new required field and fail to typecheck against the v1.1.0 shape. The substrate's default does not appear in the type signature; the consumer's typecheck doesn't know about it.
2. The migration mechanism (substrate-supplied default) makes the bump safe to deploy — it does not eliminate the type-level break.
3. SemVer level reflects what the consumer must accommodate. A consumer who lifts versions from v1.1.0 to v1.2.0 expecting backwards-compat lifts past a typed-shape break. v2.0.0 is the honest signal.

PR #11 shipped the SemVer bump 1.1.0 → 2.0.0. The discipline was named explicitly in scratchpad as "Strict-SemVer for typed-contract version bumps" with the *"Migration mechanism makes the bump SAFE, not 'minor'"* phrasing.

**Why this is wiki-worthy.** The discipline is not "always major-bump anything that touches the type signature" — it is the specific structural principle that **migration mechanism is orthogonal to SemVer level**. That principle generalizes beyond Prism: it applies to any future typed-contract version decision in `types/t09-protocols.ts`, in MCP tool schemas, in any envelope or wire-format contract the framework ships.

## Promotion posture

**n=1 watch posture.** Aen 17:28 named the discipline as wiki-promotable. Watch for n=2 in a future typed-contract version decision — likely candidates: future Prism contract revisions (Phase B authority-drift detection may add envelope fields), `types/t09-protocols.ts` evolutions, MCP tool-schema versioning. Promote on second instance to consider Protocol C promotion to common-prompt as a structural-discipline gate scoped to "before bumping a published typed contract, run the consumer-type-check + runtime-semantics gates in order; migration mechanism is orthogonal."

Sibling to the worktree-isolation discipline (the version-control discipline cluster). The two cluster members address different parts of the version-management workflow: worktree-isolation governs **how** specialists work in parallel on shared contracts; SemVer-strict governs **what level** the resulting contract changes are released at.

## Related

- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — foundational: protocol shapes ARE typed contracts. This entry adds the version-management discipline that follows from typed-contract status: when the typed shape changes, the consumer's type-check is the source of truth on bump level.
- [`worktree-isolation-for-parallel-agents.md`](worktree-isolation-for-parallel-agents.md) — sibling in the version-control discipline cluster. Worktree-isolation addresses how specialists collaborate on parallel branches; SemVer-strict addresses how the resulting contract changes get versioned. Both cluster around the discipline of working on shared typed contracts.
- [`no-future-proofing.md`](no-future-proofing.md) — adjacent: no-future-proofing says don't add abstractions for hypothetical future requirements. SemVer-strict says when you DO change the contract, version it honestly. The two compose: change the contract sparingly (no-future-proofing) AND when you change it, signal the bump level honestly (SemVer-strict).
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — adjacent at the rename layer: machine-identifier renames (Pass 2) are themselves typed-contract changes when the identifiers appear in published types. SemVer-strict applies — a Pass 2 batch that touches typed-contract identifiers is a major bump unless the renames are purely internal.

(*FR:Cal*)
