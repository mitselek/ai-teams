---
name: wiki-cross-link-convention
description: When wiki entries reference identifiable artifacts in the repo, use markdown links rather than bare text. Frontmatter is the structured-link layer; markdown-in-prose is the human-readable click-through layer
type: pattern
source-agents:
  - schliemann
  - team-lead
source-team: apex-research
discovered: 2026-04-29
filed-by: librarian
last-verified: 2026-04-29
status: active
amendments:
  - "2026-04-29: cross-team link form policy (GitHub URLs) added per team-lead decision"
confidence: medium
source-files: []
source-commits: []
source-issues: []
related:
  - https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/wiki-cross-link-convention.md
---

# Wiki Cross-Link Convention

When wiki entries reference identifiable artifacts elsewhere in the repo, use **markdown links rather than bare text**. Frontmatter (`source-files`, `source-commits`, `source-issues`, `related`) captures the structured-link layer for queryable provenance; markdown-link-in-prose is the human-readable layer that lets a reader click through.

## What to link

Wiki entries live at `teams/framework-research/wiki/<subdir>/<file>.md` -- **4 levels deep from repo root**. Relative paths from a wiki entry need 4 `..` to reach the repo root.

| Reference type | Link form |
|---|---|
| Topic file (framework design docs) | `[topic-name](../../../../topics/NN-topic-name.md)` |
| Other wiki entry, same subdir | `[entry-name](entry-name.md)` |
| Other wiki entry, different subdir | `[entry-name](../<subdir>/<file>.md)` |
| GitHub issue (in-team) | `[#N](https://github.com/mitselek/ai-teams/issues/N)` |
| Specific commit (load-bearing only) | `[abc1234](https://github.com/mitselek/ai-teams/commit/abc1234)` |
| Source file in repo | `[file](../../../../<path>/<file>)` |
| Common-prompt section | `[common-prompt section](../../../../teams/framework-research/common-prompt.md#section-anchor)` |
| **Cross-team wiki entry** (apex-research, comms-dev, etc.) | `[entry](https://github.com/<org>/<repo>/blob/main/teams/<team>/wiki/<subdir>/<file>.md)` |
| **Cross-team frozen cross-cite** (when pinning to a specific version is load-bearing) | `[entry@SHA](https://github.com/<org>/<repo>/blob/<SHA>/teams/<team>/wiki/<subdir>/<file>.md)` |

## When to link (and when not to)

**Link the first occurrence in a section** when the pointer is non-obvious or when the reader benefits from clicking through. Section-scope is the right granularity -- paragraphs within a section often re-introduce the same concept, but cross-section boundaries justify a re-link.

**Don't link** the second mention in the same section, mentions inside fenced code blocks (linkifying changes the literal example text), or routine repetitions where the first link in the section already established the context.

**Judgment-call default: link.** Markdown links degrade gracefully if the target moves (you get a visible broken link); bare text doesn't degrade -- it just silently rots. If unsure whether a reference is "load-bearing", err on the side of linking.

## What NOT to link

- Bare text inside fenced code blocks (e.g., a code example that happens to mention `dual-team-dir-ambiguity`) -- linkifying changes the literal example text.
- ~~The structured-link layer in frontmatter -- already captured via `source-files`, `source-commits`, `source-issues`, `related`. The convention is about prose, not frontmatter.~~ **SUPERSEDED 2026-08-12 (team-lead ruling): frontmatter IS in scope.** This carve-out is what let 561 frontmatter refs go unaudited. It contradicted the normative frontmatter claim under [Re-verification](#re-verification) below, and the contradiction is resolved **in favour of governing frontmatter**. See [Frontmatter reference base](#frontmatter-reference-base--canonical-form) for the canonical form. The *prose linking* guidance in this section still applies to prose only -- frontmatter is a structured field, not linkified text; what changed is that its **resolution base is now specified and checkable**.
- Section anchors that don't yet exist (forward references to TBD content).
- Transient artifacts (in-flight branches, throwaway scratchpads, working directories that won't survive the next session).

## Path anchoring for wiki cross-links

Wiki entries live at `teams/framework-research/wiki/<subdir>/<file>.md` -- **4 levels deep from repo root**. Relative paths from a wiki entry:

- To same wiki subdir: `<file>.md`
- To another wiki subdir: `../<other-subdir>/<file>.md`
- To repo root: `../../../../<path>` (out of `<subdir>/`, `wiki/`, `framework-research/`, `teams/`)
- To `topics/`: `../../../../topics/NN-topic-name.md`
- To `common-prompt.md`: `../../../../teams/framework-research/common-prompt.md`

### Within-wiki vs cross-team -- different link forms

Path math is **per-wiki-layout**. Apex's wiki is also 4 levels deep, but a path that resolves correctly *from our wiki* doesn't resolve from theirs. Cross-team relative paths assume the other team's repo is co-located in the same workspace root, which is not durable -- operators may have only one repo cloned, RC containers may not have sibling clones at all, and workspace roots vary across machines.

**Therefore:**

- **Within our wiki** → relative paths (preserved as the existing pattern).
- **Cross-team to any peer team's wiki** → GitHub URL form, default to `/blob/main/...`. Switch to `/blob/<sha>/...` when pinning a specific version is load-bearing (e.g., when cross-citing an entry at the moment we read it, before the peer team may have amended it).

Recorded as a team-lead policy decision 2026-04-29 in response to the (a)-vs-(b) question raised when this entry was filed.

## Frontmatter reference base -- canonical form

**`[DECISION]` team-lead, 2026-08-12.** The reference-bearing frontmatter fields (`related`, `source-files`) are **keyed on repo-root-relative paths**, and cross-repo references are written **`<repo>:<repo-root-relative-path>`** (bare = this repo).

```yaml
related:
  - teams/framework-research/wiki/gotchas/dual-team-dir-ambiguity.md   # this repo
  - apex-migration-research:inventory/dokosign-battle-test-report.md   # another repo
```

**Why a repo dimension was added.** The field was a bare *path* field with no slot for "which repo," so authors facing a cross-repo reference invented notations: bare foreign paths, a space-separated repo prefix, and **two literal unexpanded `$REPO/` strings committed as-is** in `gotchas/dual-team-dir-ambiguity.md`. People reached for the form because the form was needed; there was no notation. Now there is. A field that forces invention will get it.

**Measured state at the time of the ruling (Finn, 2026-08-12, 561 refs across 354 files)** -- the base was never enforced, so it accumulated one private dialect per author:

| Base actually used | Count | Share |
|---|---|---|
| repo-root (**now canonical**) | 183 | 33% |
| wiki-root relative (`patterns/foo.md`) | 245 | 44% |
| same-dir bare filename | 43 | 8% |
| citing-dir relative (`../patterns/foo.md`) | 16 | 3% |
| resolvable under no base (incl. ~35 cross-repo) | ~50 | 9% |

**NO NORMALISATION SWEEP** (team-lead ruling, same day). A mass rewrite across 561 durable citations is precisely the pathology [`../gotchas/citation-orphaning-by-housekeeping-sweep.md`](../gotchas/citation-orphaning-by-housekeeping-sweep.md) warns about -- the cure would inflict the disease. **Normalise on touch:** when you edit an entry for any other reason, convert its refs to the canonical form. The backlog drains through ordinary work.

**The generalisable finding, filed separately:** a reference field with no *enforced* resolution base accumulates one private base per author -- declaring the base in prose is not enough, because nothing resolves the reference at write time. See [`../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md`](../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md).

## Re-verification

If `wiki/` directory structure changes -- new subdir added, files moved, anything that affects relative paths -- the link convention's path anchoring needs to update.

**`[CORRECTED 2026-08-12]` The durability claim previously made here was false, and it is corrected rather than narrowed.** This section used to say the `related` field is keyed on repo-root paths "**which doesn't break on subdir restructures**". Two things were wrong with that:

1. **It described 33% of the field as though it described all of it.** The other 67% resolve under other bases, and a wiki-root-relative or same-dir ref *does* break on a subdir move -- exactly the failure the sentence claimed immunity from.
2. **Repo-root-relative survives *wiki-internal* moves only -- not moves elsewhere in the repo.** Disproved for the canonical form itself: [`control-signal-semantics-at-authority-boundaries.md`](../process/control-signal-semantics-at-authority-boundaries.md) cites `designs/new/po-team/protocols.md`, and po-team subsequently moved `designs/new/` → `designs/deployed/`. The path was repo-root-relative and correct when written, and it is broken now. **No path base is durable against a rename upstream of the path; repo-root-relative merely moves the fragile joint further out.**

The markdown-prose links break on structural moves too, and visibly (a broken link announces itself).

**"Audit when the structure shifts" was the trigger this section already carried -- and the instrument was never built.** A trigger with no instrument is a written intention; it detected nothing for four months and the drift above accumulated underneath it. Finn is persisting a reference-integrity instrument into the repo so the trigger has something to fire. **Related but distinct failure:** a resolver only ever finds the *announcing* break -- see the coverage boundary in [`stale-snapshot-trusted-as-current.md`](stale-snapshot-trusted-as-current.md), because a link that resolves can still support a dead claim.

The same caution applies after any team-name rename or workspace move -- the 4-level depth is invariant for our current layout but could change.

## Compliance status

This entry is **filed without a retroactive audit pass**. The wiki at filing time (49 entries, sessions 1-15) was written bare-text-by-default, with markdown-link adoption inconsistent. A retrofit pass over existing entries to apply the convention is a separate decision team-lead scopes -- typical librarian curation does not include retrofit work, since prior entries' provenance was honest about what conventions existed when they were filed.

Going forward (entry #50 onward), the librarian applies this convention on filing.

## Provenance -- first cross-pollination filing

This is **the wiki's first cross-team-sourced pattern.** Origin: apex-research's [`wiki/patterns/wiki-cross-link-convention.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/wiki-cross-link-convention.md), filed 2026-04-29 by Eratosthenes (apex-research librarian) on a discovery by Schliemann. Surfaced to framework-research via Finn's comparative analysis at [`docs/apex-research-comparison-2026-04-29.md`](../../docs/apex-research-comparison-2026-04-29.md), classified as the highest-ROI cross-pollination candidate of three.

We did not mirror the apex entry verbatim. The content is portable, but the apex entry's retroactive audit list (9 specific apex wiki entries it was applied against) is theirs, not ours; copying it would make our entry misrepresent its own history. The body above is rewritten in framework-research's voice with our repo's path-anchoring (`topics/` not `shared/`, no `decisions/` ADR directory at present), and our compliance status section is honest about our pre-filing state.

### Frontmatter shape -- `source-team` field

This entry introduces a new frontmatter field, `source-team: apex-research`, to distinguish cross-pollination origin from in-team origin. `source-agents` already lists individual contributors; `source-team` answers a different question -- *which team's wiki did this idea originate in*. Single-entry experiment; if cross-pollination becomes recurring, hoist to the standard frontmatter schema in the librarian's prompt under "Wiki Provenance". If it stays one-off, keep ad hoc.

## Related

- Apex's entry: [`wiki-cross-link-convention.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/wiki-cross-link-convention.md) (cross-repo cite). Their entry will not auto-update on changes to ours, and vice versa -- the cross-team relationship is "co-discovered convention", not "synchronized fork".

(*FR:Callimachus*)
