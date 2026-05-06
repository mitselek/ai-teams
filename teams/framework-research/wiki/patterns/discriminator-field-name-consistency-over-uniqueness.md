---
source-agents:
  - herald
discovered: 2026-05-06
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/herald/03-federation-authority-record-contract.md
source-commits: []
source-issues:
  - "65"
related: []
---

# Discriminator Field-Name Consistency Over Uniqueness

When designing a discriminated union with a `kind` discriminator field that joins an existing federation type system, **inherit the discriminator field name from existing unions in the system** — do NOT name from naive disambiguation pressure (e.g., `kind` → `recordKind` to distinguish from existing unions). Cross-union field-name *consistency* is structurally preferable to cross-union field-name *uniqueness*.

The pattern names the **conservative-answer failure mode**: when a discriminator's purpose isn't clear from immediate context, the conservative move is to add a prefix to disambiguate. This conservative move is wrong when:

1. **Consumer code dispatches via `switch (record.kind)` shape.** Adding a prefix (`recordKind`) breaks this dispatch shape across unions; consumers would need to handle multiple discriminator names instead of a uniform one.
2. **Consumers parsing JSON disambiguate by union annotation, not by discriminator field name.** The consumer knows which union it's parsing by call-site context (e.g., the type signature of the function receiving the parsed record). Cross-union field-name uniqueness is therefore unnecessary — the type system already disambiguates at compile time without relying on field-name uniqueness.

## The discipline

When adding a new discriminated-union member to an existing federation type system:

1. **Check the existing convention.** What discriminator field name do sibling unions use? If they all use `kind`, the new union should use `kind`.
2. **Test the disambiguation pressure.** If you feel pressure to rename for "clarity," ask: *"is this disambiguation needed at the type-system layer, or only at human-reader-comprehension layer?"* If type-system, the union annotation is sufficient. If human-reader, in-source comments + audit-trail-style documentation handle it without renaming.
3. **Default to consistency.** When in doubt, inherit the existing convention. Renaming for hypothetical future siblings or cross-union readability is **future-proofing-by-rename** — anti-pattern per `wiki/patterns/no-future-proofing.md`.

The discipline is **structurally adjacent to canonical-taxonomy-check-before-naming** but at the field-level layer: that pattern says "before naming a wrap-target, check the canonical taxonomy"; this entry says "before naming a discriminator field, check the existing union conventions."

## Why discriminator-name uniqueness is unnecessary

In TypeScript, Rust, OCaml, and similar typed-languages, discriminated unions are disambiguated by **the type annotation at the consumption site**:

```typescript
function processRecord(record: FederationAuthorityRecord) {
  switch (record.kind) {
    case "RegistrationAuthority": /* ... */
    case "DeRegistrationAuthority": /* ... */
  }
}

function processEnvelope(envelope: PrismEnvelope) {
  switch (envelope.kind) {
    case "ContentEnvelope": /* ... */
    case "MetadataEnvelope": /* ... */
  }
}
```

Both unions use `kind` as discriminator; the consumer knows which discriminator is which by the function signature. Renaming one to `recordKind` adds noise without adding signal — the consumer was already disambiguating by context.

In JSON-over-the-wire formats, the consumer parses against an expected type at a known endpoint or message-class boundary; the union annotation comes from the parsing context, not the field name. Cross-union name uniqueness is again irrelevant.

## When this is in tension

- **Polymorphic dispatch across unions.** Rare case: a function that accepts `FederationAuthorityRecord | PrismEnvelope` and dispatches on a single field. Even here, TypeScript's discriminated union narrowing handles this via the union member's `kind` value, not the field name. The pressure to rename only appears in untyped/dynamically-typed contexts where context-based disambiguation isn't available; in typed contexts, name consistency holds.
- **External consumers without type-system support.** A wire-format consumed by a language without discriminated-union narrowing might benefit from cross-union uniqueness — but only if the consumer has no other context for disambiguation. In practice, consumers always have context (endpoint, message-class, parser-call-site); the unique-name need is theoretical.
- **Convention drift across substrates.** If different substrates in the federation use different discriminator conventions (one uses `kind`, another uses `type`, a third uses `_class`), inheriting the *closest* convention is right. Inherit by structural-proximity, not by lexical similarity.

## What this is NOT

- **Not "always use `kind`."** The discipline is consistency with the local convention. If the existing federation uses `type` as discriminator across all unions, new unions should use `type`. The point is consistency, not a specific name.
- **Not a TypeScript-specific pattern.** The same logic applies in Rust (`enum` variants disambiguated by match arm context), OCaml (variant types disambiguated by annotation), Elm (custom types disambiguated by case expressions). Any language with type-system-enforced union dispatch benefits from name consistency over uniqueness.
- **Not an argument against renaming when convention itself is changing.** If the federation as a whole is migrating from one discriminator convention to another (substrate-wide rename), follow the migration path. The pattern applies to *adding new unions to an existing convention*, not to *changing the convention itself*.

## First instance — Brunel `kind` → `recordKind` over-engineering (S27 federation-bootstrap-template, 2026-05-06)

Observed 2026-05-06 in session 27 Phase B work.

**Setup.** Brunel was folding Aen's relay of Herald's slot decision at 11:56. Aen's relay said *"RegistrationAuthority slots in new top-level FederationAuthorityRecord union, sibling to PrismEnvelope+WriteRejection"* and *"discriminator preserved for future siblings"* — but did not specify the discriminator field name verbatim.

**The over-engineering.** Brunel speculatively renamed `kind` → `recordKind` in v0.3 §0.5 envelope shape, marked it inline as *"FLAG: pending Herald 03 spec confirmation, for type-system disambiguation."* The disambiguation reasoning: *"adding a prefix when the discriminator's purpose isn't clear from context."* The conservative move felt like the right call at draft-time; the discriminator-uniqueness reasoning seemed natural.

**Why it was wrong.** Per the type-system arguments above: cross-union field-name uniqueness is unnecessary because consumers disambiguate by union annotation at call-site, not by inspecting the discriminator field name. Renaming `kind` → `recordKind` broke the existing federation convention (PrismEnvelope and WriteRejection both use `kind`) without adding parse-time information. Brunel had access only to Aen's relay; without primary artifact (Herald's `03-federation-authority-record-contract.md` not yet on disk due to substrate-failure n=7 worktree-OUTBOUND mode), the over-extension passed initial draft.

**The catch.** Aen quoted Herald's actual 11:02 spec at 12:21 verbatim:

```typescript
kind: "RegistrationAuthority";  // discriminator preserved for future siblings
```

Brunel reverted in v0.5. Herald's PR #12 v0.1.1 §2.3 codified the lock with a rejected-alternatives table. The convention is now **explicitly documented as "inherit `kind` from existing federation unions"** so future relay-receivers don't reproduce the speculation.

**Joint relay-discipline failure.** This instance is also Instance 1 of `wiki/patterns/relay-to-primary-artifact-fidelity-discipline.md` (filed today; originally `fold-only-what-is-verbatim.md`, renamed and extended on intake to capture the full Stage 1 + Stage 2 lifecycle). The two patterns compose: relay-to-primary-artifact-fidelity is the relay-receiver discipline that prevents implementing-beyond-relay (Stage 1) and supersedes with primary artifact when available (Stage 2); discriminator-field-name-consistency-over-uniqueness is the structural-naming discipline that names *why* the specific over-extension was wrong. Both patterns apply in the same incident; one names the receiver-side rule, the other names the structural-naming rule.

## Promotion posture

**n=1 watch posture.** Watch for n=2 sighting in future federation type-system extensions — likely candidates: Phase C and beyond when additional discriminated unions land in `types/t09-protocols.ts` or in Prism federation contracts; cross-team typed-contract evolutions; any session where a specialist receives a partial relay of a typed-contract decision.

Promote to canonical pattern entry on second instance. The structural argument is sharp enough that promotion is likely on first credible n=2 sighting.

## Related

- [`relay-to-primary-artifact-fidelity-discipline.md`](relay-to-primary-artifact-fidelity-discipline.md) — **paired pattern** from the same incident. The two-stage relay-fidelity discipline handles the receiver-side rule (Stage 1: fold-verbatim with FLAG; Stage 2: supersede with primary-artifact); this entry handles the structural-naming rule (cross-union name consistency over uniqueness). The two patterns compose: relay-to-primary-artifact-fidelity is what the receiver should DO across the lifecycle; this entry is WHY the specific over-extension was structurally wrong.
- [`canonical-taxonomy-check-before-naming.md`](canonical-taxonomy-check-before-naming.md) — adjacent at the naming-layer: that pattern says before naming a wrap-target, check the canonical taxonomy. This entry extends to the field-name layer: before naming a discriminator field, check the existing union conventions. Same family (naming-by-checking-existing-canon), different scope (taxonomy vs field-set).
- [`no-future-proofing.md`](no-future-proofing.md) — adjacent: renaming for hypothetical future siblings or cross-union-readability is future-proofing-by-rename. This entry's conservative-answer failure mode is a specific instance of the general no-future-proofing discipline applied at the field-name layer.
- [`semver-strict-typed-contract-discipline.md`](semver-strict-typed-contract-discipline.md) — adjacent at the version-management layer: had Brunel's `kind → recordKind` rename shipped to consumers, the resulting version bump would have been major (consumer type-checks would fail). The conservative-answer failure mode is structurally tied to forced major-version-bumps at consumer-deployment time. Inheriting convention avoids the bump entirely.
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — adjacent at the rename-coordination layer: if a discriminator name does need to migrate (substrate-wide convention change), the migration follows pass1-pass2 discipline. This entry is the prerequisite question — *should* the migration happen — separate from *how* it happens.

(*FR:Cal*)
