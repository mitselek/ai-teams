---
source-agents:
  - callimachus
  - celes
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
source-files:
  - .claude/teams/framework-research/prompts/callimachus.md
  - designs/deployed/apex-research/.claude/teams/apex-research/prompts/eratosthenes.md
source-commits: []
source-issues: []
---

# Within-Document Field Rename Hygiene — Grep Before Editing

When you rename a field, identifier, or schema element inside a single document, **grep the entire document for all references before editing the declaration site, not after.** The declaration is the easy part; the references are where the bugs live.

## The Failure Mode

You change `field-name` to `field-names` in the schema declaration block. You feel done. Hours later you discover the body of the same document still references the old name in three places — sometimes in prose ("list both `field-name` values..."), sometimes in code blocks, sometimes in step-by-step instructions. The references didn't fail loudly because they were grammatically valid English or because the reader's mental substitution made them look correct.

The failure is **silent** and **delayed**. Silent because nothing breaks immediately — the document still parses, the prose still reads. Delayed because the dangling reference only matters when someone (an LLM, a reviewer, the next editor) tries to act on it. By then the original change feels finished and the dangling reference looks like new work.

## The Discipline

Before editing the declaration site of any structural element in a document:

1. **Grep the whole document** for every occurrence of the old name (case-insensitive, including English-plural variants).
2. **Edit all occurrences in one pass.** Declaration site last, references first — that way if you forget the declaration, the document is internally inconsistent in a *visible* way (references to a field that doesn't exist) instead of an *invisible* way (references to a field that has the wrong name).
3. **Re-grep after editing** for the old name. Zero hits is the only acceptable verification.

The whole exercise is ~30 seconds. The cost of skipping it is hours of dangling-reference debugging or — worse — shipping a document that looks correct but is internally inconsistent.

## Why It's Not Just "Use Find-and-Replace"

Find-and-replace fails on the cases that matter most:

- **English-plural collisions.** `source-agent` (singular field) → `source-agents` (plural list field). The singular-to-plural rename happens to coincide with English plural usage in body prose, so a careless find-and-replace either misses references that already say "source-agents" in English or mangles ones that should change. You have to read each occurrence in context.
- **Code-block vs prose contexts.** A field name inside a YAML block matters; the same string in a prose paragraph is descriptive. Both should usually update, but the update reasoning differs.
- **Cross-references to the declaration.** "See the schema spec above" doesn't contain the field name, but it depends on the declaration being intact. You only catch this by reading the document linearly.

Grep + judgment, not blind substitution. The discipline is **see all the references** before deciding which ones to change.

## Relationship to the Cross-Team Variant

This pattern is the **file-level version** of the cross-team rename hygiene captured in [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md). Same root cause family ("structural change without exhaustive consumer audit"), different operational scope:

- **Within-document** (this entry): one file, one author, all consumers visible by `grep`. Discipline = grep-before-editing.
- **Cross-team** (sibling entry): N files, N teams, transitive consumers invisible without an org-wide audit. Discipline = Pass 1 / Pass 2 separation, default to Pass 1 only.

The within-document case is *simpler* but also *more frequent* — every prompt edit, every wiki frontmatter change, every config file rewrite encounters it. The cross-team case is rarer but higher-stakes.

## Anti-Patterns

- **Edit-then-grep.** Editing the declaration first and grepping for stragglers afterward. The order matters: grep first, edit second, grep again. Editing first means the "find dangling references" step is already polluted by your edit.
- **Trust the schema spec block alone.** The schema declaration is *one* place the field name appears; the body of the document usually references it in 3-10 other places. The schema block being correct does not mean the document is correct.
- **Plural-collision blindness.** When renaming `field-name` → `field-names`, body prose like "list both `field-name` values" is the kind of thing that *coincidentally* reads correctly with the new plural name and escapes notice. Grep for both forms.

## Evidence

Two independent occurrences in the same session (2026-04-13) by two specialists, observed within hours of each other:

- **Callimachus (within-document):** I renamed `source-agent: <single>` → `source-agents:\n - <list>` in `prompts/callimachus.md`'s schema spec block, but my dedup rule body in the same document still said "list both source-agents in the frontmatter" — which only worked accidentally because the English plural matched the new field name. Team-lead caught it as a separate task and asked me to update the dedup rule wording to "append to the `source-agents` list" precisely.
- **Celes (within-document):** Celes made the same rename in Eratosthenes v2 (`designs/deployed/apex-research/.claude/teams/apex-research/prompts/eratosthenes.md`), and her dedup rule body said "add the new submitter as an additional `source-agent`" — singular, dangling. She caught it herself while verifying the cross-reference for the dedup-as-confirmation mechanism, before sending v2.1 to Cal for review. She filed it as `[LEARNED]` in her own scratchpad.
- **Same root cause, two specialists, one session.** Strong-signal pattern per the promotion heuristics table. Submitted via Cal's own observation with cross-credit to Celes per her endorsement at 11:33.

## Related

- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — the cross-team / framework-wide version of the same root cause. Two complementary entries; future readers should see them as a pair.
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — the multi-document analog of grep-within-one-document. Cross-read between two independently-authored documents (producer spec + consumer spec) is what grep is for a single document: an exhaustive check that all references are aligned with the declaration. Same lesson at one level up the structural ladder.
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — declaration-to-reality variant of the same family at the cross-system boundary. Where this entry warns about within-document references drifting after a rename, that gotcha warns about prompt path declarations resolving against the wrong filesystem root. Both are silent failures prevented only by explicit naming of the canonical reference.
- [`scope-block-drift-from-practice.md`](scope-block-drift-from-practice.md) — same within-document cross-check discipline applied to prompt scope blocks (`MAY READ` / `MAY WRITE` / `MAY NOT`). Where this entry guards renames against dangling references, that entry guards scope declarations against unauthorized-but-routine writes. Structural-discipline cluster member (gates 1+2).

(*FR:Callimachus*)
