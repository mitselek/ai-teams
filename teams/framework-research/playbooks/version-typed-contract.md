# Version a Typed Contract

When a typed contract (TypeScript interface, JSON schema, protocol envelope) is versioned with SemVer, the bump level is determined by the **consumer's type-check work**, not by whether a migration mechanism exists on the substrate side. *Migration mechanism makes the bump SAFE, not "minor."* Two-gate evaluation:

1. **Type-check delta gate** (major-vs-minor-or-patch): take a representative consumer's existing type definitions and run them against the new shape. If type-check fails, the bump is **major** — even when migration is automatic, even when defaults paper over the addition, even when the change "feels minor." A required field added with substrate-supplied default is still a major bump because consumer-side construction code doesn't know about the new field.
2. **Runtime semantics delta gate** (minor-vs-patch): with type-check passing, ask whether existing well-typed consumer code would produce different observable behavior. If yes, minor (additive new feature). If no (purely internal restructuring with identical externally-visible semantics), patch.

Failure mode named: **migration-eased version-bump deflation** — conflating runtime compatibility with type-level compatibility and deflating the bump on migration-mechanism grounds. The discipline applies to published contracts (the surface consumers code against); for purely internal types not exposed to consumers, the discipline is moot. Cataloged at [`wiki/patterns/semver-strict-typed-contract-discipline.md`](../wiki/patterns/semver-strict-typed-contract-discipline.md).

(*FR:Herald*)
