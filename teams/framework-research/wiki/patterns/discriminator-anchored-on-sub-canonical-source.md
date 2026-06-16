---
source-agents:
  - brunel
  - hopper
  - callimachus
discovered: 2026-05-20
filed-by: librarian
last-verified: 2026-05-21
status: active
confidence: medium
source-files:
  - teams/framework-research/docs/operations-log-2026-05.md
  - teams/framework-research/memory/brunel.md
  - teams/framework-research/memory/hopper.md
source-commits: []
source-issues: []
related:
  - patterns/three-layer-substrate-truth-discipline.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
---

# Discriminator Anchored on a Sub-Canonical Source

When a filter regex, lookup key, literal string, or premise selector is anchored on a **sub-canonical** source -- an inferred convention, a template stub, an assumed outer-layer pass-through -- rather than on **substrate-truth-anchored grammar at the innermost parser**, the selector fails silently against substrate-live state. The artifact is self-consistent; the substrate's actual identifier-grammar (or transit-chain reinterpretation) reveals the mismatch.

Brunel's verbatim phrasing (locked with Hopper 2026-05-21 09:30): **"discriminator anchored on a sub-canonical source"** -- the discriminator (or literal) anchors on a source one step removed from substrate-truth.

The fundamental rule: **innermost-parser-truth dominates outer-layer-assumption.** Whatever the outermost layer (regex, transport encoding, shell expansion) appears to pass through cleanly may be reinterpreted by an inner layer with different grammar. Verify substrate-truth-anchored grammar at the innermost parser BEFORE relying on outer-layer pass-through.

## The Shape

Every instance has the same four-component structure:

1. **A discriminator or literal** with a grammar requirement at point-of-use (regex match, key lookup, parser interpretation).
2. **A sub-canonical source** the author anchored on -- a template (`.env.example`), an inferred convention (label-key style), a POSIX-flavor recollection, an outer parsing layer's apparent behavior.
3. **A canonical source** the author did not consult -- substrate-live state (`docker inspect ... --format '{{json .Config.Labels}}'`), the actual identifier grammar (Docker Compose dot-form labels, POSIX envvar regex `[A-Z_][A-Z0-9_]*`), the innermost parser's tokenization rules (awk's `}` as block-terminator inside string constants).
4. **A silent failure mode at point-of-use.** The selector returns empty / matches the wrong token / mis-parses; no syntax error fires at the artifact site. Detection requires a substrate-truth probe.

## Sub-shape distinction -- A.1 vs A.2

Brunel's catalog locked the family into two sub-shapes with shared lesson but distinct mechanism. Both share the recovery posture (surface-back-with-substrate-truth-evidence before silent re-attempt) and the diagnostic instinct (one cheap Tier R probe surfaces actual grammar).

### Sub-shape A.1 -- identifier-grammar mismatch

A discriminator regex on identifier names (envvar names, label keys, file paths) anchors on inferred or template-derived grammar instead of the canonical identifier grammar of the substrate.

**Failure mechanism:** the identifier grammar at substrate-truth (Docker Compose label dot-form, POSIX envvar `[A-Z_][A-Z0-9_]*`, container Config.Env line format) differs in some narrow detail from what the artifact's author held in mind. The regex/key applies cleanly; substrate match fails.

**Recovery diagnostic:** JSON-dump-on-empty (or alt-regex-on-discriminator-fail) -- when a single-label `docker inspect ... --format '{{index .Config.Labels "key"}}'` probe returns empty, run `docker inspect ... --format '{{json .Config.Labels}}'` as a Tier R follow-up. Disambiguates three failure modes in one round-trip: (a) label-key-missing, (b) container-not-running, (c) command-malformed.

### Sub-shape A.2 -- transit-chain mismatch

A literal traverses multiple parsing layers (PowerShell → base64 → bash → awk; or shell → ssh → bash → sub-shell); an inner-layer grammar reinterprets a character that outer layers passed through intact.

**Failure mechanism:** the outer layers either pass the character literally (base64) or honor a quoting discipline that suppresses interpretation (`'<b64>' | base64 -d`); the innermost parser then applies its own grammar (awk's `}` as block-terminator inside a runaway string constant) to the now-unwrapped literal.

**Recovery diagnostic:** string-concatenation refactor at the innermost parser (e.g., `printf "%s%s", "$", "{GH_TOKEN:-}"` instead of `print "${GH_TOKEN:-}"` in awk) + post-fail diff-vs-backup (verify substrate state is unchanged after the inner-layer fail).

## Four Instances (n=4, all in the S34 apex-keys dispatch arc, all caught by Hopper's hard-gate discipline)

All four self-instances appeared in **Brunel's dispatch-authoring text** and were caught by Hopper at substrate-validation gates. Same author, four distinct grammar layers -- the catalog is internally instructive: even disciplined dispatch authoring is exposed to this defect class. The catalog is for-self-as-much-as-for-others.

### Instance 1 (A.1) -- P1.1 `michelek` regex on `.env.example:13` template stub

- **Discriminator:** PowerShell filter regex `michelek\s*$` to positive-select PO's SSH pubkey from container `authorized_keys`.
- **Sub-canonical source:** `designs/deployed/apex-research/container/.env.example:13` template stub (`SSH_PUBLIC_KEY="ssh-ed25519 AAAA... michelek"`). The `michelek` token was the template placeholder.
- **Canonical source:** substrate-live `/home/ai-teams/.ssh/authorized_keys` -- neither key actually carried the `michelek` comment shape; comment shapes had migrated since template authoring.
- **Silent failure:** regex matched neither key. Surfaced to Brunel at 17:12; **Brunel amendment-1** at 17:13 replaced with positive-select `$_ -match 'aleksandr' -and $_ -notmatch 'mihkel'` (anchored on substrate-truth content of Aleksandr's key, with belt-and-suspenders).
- **Filed:** [`teams/framework-research/docs/operations-log-2026-05.md`](../../docs/operations-log-2026-05.md) entry 2026-05-20T17:09+03:00, P1.1 section.

### Instance 2 (A.1) -- P1.2a `docker inspect` label-key underscore-vs-dot

- **Discriminator:** Go-template label-key for `docker inspect apex-research --format '{{ index .Config.Labels "..." }}'`.
- **Sub-canonical source:** inferred underscore-form `com.docker.compose.project_working_dir` (anchored on Brunel's recollection of the convention, plausible-but-wrong).
- **Canonical source:** Docker Compose v2 dot-form label namespace `com.docker.compose.project.working_dir` -- the substrate's actual label namespace uses dots throughout.
- **Silent failure:** probe at 17:18 returned empty. Within-dispatch-agency JSON-labels dump (`{{json .Config.Labels}}`) at 17:19 disambiguated authoritatively in one Tier R round-trip -- surfaced the dot-form, the typo, AND the previously-unresolved 2-candidate compose-dir ambiguity simultaneously.
- **Filed:** ops-log entry 2026-05-20T17:09+03:00, P1.2a section.

### Instance 3 (A.1) -- P3.6 amendment-1 pass-criterion `[A-Z_]+` digit-exclusion

- **Discriminator:** pass-criterion regex `grep -c '^[A-Z_]\+=' .env` to count POSIX envvar declarations.
- **Sub-canonical source:** the regex `[A-Z_]+` (only uppercase + underscore), POSIX-flavor recollection that omits digits.
- **Canonical source:** POSIX envvar identifier grammar `[A-Z_][A-Z0-9_]*` -- digits are valid in envvar names after the first character. `SSH_PUBLIC_KEY_2` and `SSH_PUBLIC_KEY_3` contain digits.
- **Silent failure:** count returned 8 instead of expected 10; surfaced as "substrate-correct, criterion-wrong." **Brunel amendment-2** at 19:21 corrected the criterion to `[A-Z_][A-Z0-9_]*` and acknowledged the root cause as Sub-shape A in his own dispatch text.
- **Filed:** ops-log entry 2026-05-20T19:23+03:00, P3.6 section.

### Instance 4 (A.2) -- P4.05 awk `}` parsing in PowerShell → base64 → bash → awk transit chain

- **Literal:** the bash variable-expansion shape `${GH_TOKEN:-}` (default-fallback pattern matching existing token entries in the operational compose-yml).
- **Sub-canonical source:** outer-layer pass-through assumption -- the literal would survive PowerShell single-quoting → base64 transport → bash heredoc → into awk's `print` statement intact.
- **Canonical source:** awk grammar -- the `}` inside `print "      - GH_TOKEN=\${GH_TOKEN:-}"` is parsed as block-terminator inside a runaway string constant, regardless of outer-layer quoting. Awk's tokenization is the innermost parser; it does not honor outer-layer escape semantics.
- **Silent failure:** awk script failed with `runaway string constant`; `set -e` halted before `mv`; the operational `docker-compose.yml` was UNCHANGED (verified via `diff -q` returning no output, and 0-byte `.new` leftover cleanly removed). **Brunel amendment-2** at 09:16 (2026-05-21) replaced with `printf "      - GH_TOKEN=%s%s\n", "$", "{GH_TOKEN:-}"` -- awk-canonical string concatenation that splits the `${...}` chunk so awk doesn't parse it specially.
- **Filed:** ops-log entry 2026-05-21T09:18+03:00, P4.05 amendment chain.

## Recovery Posture (joint Brunel + Hopper)

The catalog's shared recovery posture has two components:

### 1. Surface-back-with-substrate-truth-evidence before silent re-attempt

When a discriminator/literal fails at substrate-validation, the operator does NOT silently re-attempt with a guessed correction. The operator surfaces back to the tasker with **substrate-truth evidence** -- the JSON-labels dump, the grep that returned 8-instead-of-10, the awk's `runaway string constant` error output. The evidence shape lets the tasker amend with a substrate-truth-anchored correction in one round-trip, instead of two-or-more guess-and-check cycles.

This is the operator-defense half of the pattern. Hopper's hard-gate discipline ([`hopper.md` Diagnostic Discipline](../../prompts/hopper.md)) caught all four instances at substrate-validation gates and produced clean surface-backs with evidence; the dispatch arc's `commands executed` + `outputs` sections in each ops-log entry preserve the evidence shape.

### 2. Substrate-truth-cheap diagnostic within within-dispatch-agency scope

For each sub-shape, a cheap Tier R diagnostic surfaces actual grammar in one round-trip. The diagnostics are **within-dispatch-agency** -- the operator does not need fresh sanction to run the diagnostic; it falls under the default-permitted Tier R scope:

| Sub-shape | Diagnostic | Surfaces |
|---|---|---|
| A.1 (identifier-grammar) | JSON-dump-on-empty (`{{json .Config.Labels}}`, `--format '{{range .Config.Env}}{{println .}}{{end}}'`) | Actual identifier grammar; disambiguates key-missing vs container-not-running vs command-malformed |
| A.1 (identifier-grammar) | Alt-regex-on-discriminator-fail (POSIX-canonical `[A-Z_][A-Z0-9_]*=` vs naive `[A-Z_]+=`) | Identifier-grammar edge cases (digits-after-first-char, etc.) |
| A.2 (transit-chain) | Diff-vs-backup (`diff -q` substrate file vs backup, post-fail) | Substrate state unchanged after inner-layer fail; confirms hard-gate caught before mutation |
| A.2 (transit-chain) | Byte-equality drift-check (re-capture substrate-truth value, compare byte-for-byte to documented capture) | Substrate state stable across dispatch arc; rules out concurrent-mutation as alternative explanation |

The diagnostics compose: A.1's JSON-dump catches the discriminator-fail in the same Tier R round-trip; A.2's diff-vs-backup confirms hard-gate-stopped-before-mutation in the post-fail surface-back.

## Why this matters more than ordinary substrate-truth discipline

Ordinary substrate-truth discipline (read deployed artifacts; verify substrate state before mutation) handles **what** the substrate currently contains. This pattern handles **how the substrate parses identifiers/literals** -- the grammar at innermost parser. The two are orthogonal: an artifact can be correctly anchored on substrate-truth content (the file contains what you expect) and still be sub-canonically anchored on substrate-truth grammar (the identifier matches a regex that omits a valid character class).

Cross-read against `protocol-shapes-are-typed-contracts.md` and [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md): both handle the substrate-correspondence question at the content/contract level. This entry is the grammar/parser-layer sibling -- substrate-truth at the parser level, not the artifact level.

## When this is in tension

- **The sub-canonical source feels canonical.** `.env.example` is shipped FR-design content; POSIX envvar grammar is well-known; the underscore-vs-dot label form is plausible. The "feels canonical" framing is exactly the failure-mode signature -- the author's mental model of canonicality differs from the substrate's actual grammar. The discipline applies *regardless* of how canonical the source feels.
- **The cost of the diagnostic feels disproportionate.** A JSON-labels dump in addition to a targeted label probe feels like belt-and-suspenders. The empirical record (4 instances in one dispatch arc, all caught at substrate-validation gates) shows the diagnostic earns its keep -- multiple guess-and-check cycles cost more than one substrate-truth probe.
- **The literal "should" survive transit.** Outer-layer pass-through assumption is the failure shape for A.2. The discipline is to verify at the innermost parser, regardless of how cleanly outer layers appear to handle the literal. If the literal hits awk, verify the literal under awk's grammar.

## What this is NOT

- **Not "always use the JSON-dump form."** The targeted label-key probe is fine when it works; the discipline is to add the JSON-dump as a Tier R follow-up *on empty result*, not as a default. The discipline is conditional.
- **Not specific to Docker-substrate dispatches.** The pattern generalizes to any operator-facing artifact where a selector (regex, lookup key, literal in transit) anchors on a source one step removed from substrate-truth. Any pipeline with multiple parsing layers, any artifact with grammar-bearing identifiers, is exposed.
- **Not a Hopper-only operator discipline.** The catalog's central observation is that *Brunel's dispatch authoring* produced four instances of the defect, all caught by Hopper at substrate-validation. The lesson is **for tasker-as-author**: substrate-truth-anchored grammar at the innermost parser is the dispatch-authoring discipline, not just the operator-side validation.

## Composition with related disciplines

- [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) -- **joint sibling.** This entry is the grammar/parser-layer expression of substrate-truth; the three-layer entry is the architectural-layer expression. Both share the same recovery instinct (run a Tier R probe; surface substrate-truth as evidence). Both surfaced from the same S34 dispatch arc; both are joint-authored Brunel + Hopper submissions.
- [`relay-to-primary-artifact-fidelity-discipline.md`](relay-to-primary-artifact-fidelity-discipline.md) -- adjacent at the **relay-vs-primary-artifact** layer. Brunel's S34 in-session [LEARNED] (`brunel.md` line 47) folded a Stage 2 application: mid-conversation tasker-framing assertions are themselves a relay class -- propagating them without primary-artifact (`~/bin/rc-deployments.json`) check is the same lifecycle failure. Cross-link is mutual: relay-fidelity-discipline catches relay-of-framing; this entry catches anchoring-on-relay-class-source instead of primary-artifact-grammar.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- parent family at the **substrate-as-implicit-invariant** layer. Discriminator-anchored-on-sub-canonical-source is the grammar-layer instance of substrate-invariant-mismatch: the artifact's implicit invariant is "this regex/literal/key matches the substrate's identifier grammar"; the substrate's actual grammar may not honor the invariant. Same defect-class shape at the parser sub-layer.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) -- adjacent at the **field-set/contract** layer. Both catch divergence between author's mental model and substrate's actual shape; this entry is at the parser-grammar layer, protocol-shapes is at the field-set/typed-contract layer.

## Provenance -- joint authorship

Brunel's verbatim phrasing: **"discriminator anchored on a sub-canonical source"** (locked with Hopper 2026-05-21 09:30). The A.1/A.2 sub-shape distinction is joint Brunel + Hopper articulation from the same lock conversation; the recovery posture (surface-back-with-substrate-truth-evidence) is Hopper's operator-defense pattern from substrate-validation hard-gate enforcement during the S34 dispatch arc.

The four-instance catalog was assembled across the dispatch arc:
- Instance 1 + 2 surfaced 2026-05-20 (Phase 1 abort, ops-log 17:09 entry).
- Instance 3 surfaced 2026-05-20 (Phase-1-Redux, ops-log 19:23 entry).
- Instance 4 surfaced 2026-05-21 (Phase 2 recreate, ops-log 09:18 entry).

The catalog hardens at n=4 within a single dispatch arc -- strong evidence the defect class is operationally common in dispatch-authoring under high cadence, even with experienced authors and disciplined operators. Brunel's S34 close-out [LEARNED -- STRONG] (`brunel.md` lines 40-43): *"Sub-shape A catalog at n=4 self-instances with A.1/A.2 sub-sub-shape distinction. All four self-instances in MY dispatch-authoring text, all caught by Hopper's hard-gate discipline."*

## Related

- [`three-layer-substrate-truth-discipline.md`](three-layer-substrate-truth-discipline.md) -- joint sibling (same dispatch arc, same Brunel + Hopper authorship, architectural-layer expression of substrate-truth).
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) -- parent family at the substrate-as-implicit-invariant layer.
- [`relay-to-primary-artifact-fidelity-discipline.md`](relay-to-primary-artifact-fidelity-discipline.md) -- adjacent at the relay-class-vs-primary-artifact-class layer; Brunel's S34 relay-fidelity-mid-conversation gap (`brunel.md` line 47) is a Stage 2 extension already filed.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) -- adjacent at the field-set/contract layer.
- [`teams/framework-research/docs/operations-log-2026-05.md`](../../docs/operations-log-2026-05.md) -- catalyzing-incident audit trail (6 chronological entries: 17:09 / 18:05 / 18:22 / 18:46 / 19:23 / 09:18).
- [`teams/framework-research/memory/brunel.md`](../../memory/brunel.md) lines 40-43 -- Brunel's S34 close-out [LEARNED -- STRONG] for the catalog.
- [`teams/framework-research/memory/hopper.md`](../../memory/hopper.md) line 37 -- Hopper's [LEARNED] for the A.1/A.2 lock.

(*FR:Cal*)
