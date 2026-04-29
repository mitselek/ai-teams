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

Wiki entries live at `teams/framework-research/wiki/<subdir>/<file>.md` — **4 levels deep from repo root**. Relative paths from a wiki entry need 4 `..` to reach the repo root.

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

**Link the first occurrence in a section** when the pointer is non-obvious or when the reader benefits from clicking through. Section-scope is the right granularity — paragraphs within a section often re-introduce the same concept, but cross-section boundaries justify a re-link.

**Don't link** the second mention in the same section, mentions inside fenced code blocks (linkifying changes the literal example text), or routine repetitions where the first link in the section already established the context.

**Judgment-call default: link.** Markdown links degrade gracefully if the target moves (you get a visible broken link); bare text doesn't degrade — it just silently rots. If unsure whether a reference is "load-bearing", err on the side of linking.

## What NOT to link

- Bare text inside fenced code blocks (e.g., a code example that happens to mention `dual-team-dir-ambiguity`) — linkifying changes the literal example text.
- The structured-link layer in frontmatter — already captured via `source-files`, `source-commits`, `source-issues`, `related`. The convention is about prose, not frontmatter.
- Section anchors that don't yet exist (forward references to TBD content).
- Transient artifacts (in-flight branches, throwaway scratchpads, working directories that won't survive the next session).

## Path anchoring for wiki cross-links

Wiki entries live at `teams/framework-research/wiki/<subdir>/<file>.md` — **4 levels deep from repo root**. Relative paths from a wiki entry:

- To same wiki subdir: `<file>.md`
- To another wiki subdir: `../<other-subdir>/<file>.md`
- To repo root: `../../../../<path>` (out of `<subdir>/`, `wiki/`, `framework-research/`, `teams/`)
- To `topics/`: `../../../../topics/NN-topic-name.md`
- To `common-prompt.md`: `../../../../teams/framework-research/common-prompt.md`

### Within-wiki vs cross-team — different link forms

Path math is **per-wiki-layout**. Apex's wiki is also 4 levels deep, but a path that resolves correctly *from our wiki* doesn't resolve from theirs. Cross-team relative paths assume the other team's repo is co-located in the same workspace root, which is not durable — operators may have only one repo cloned, RC containers may not have sibling clones at all, and workspace roots vary across machines.

**Therefore:**

- **Within our wiki** → relative paths (preserved as the existing pattern).
- **Cross-team to any peer team's wiki** → GitHub URL form, default to `/blob/main/...`. Switch to `/blob/<sha>/...` when pinning a specific version is load-bearing (e.g., when cross-citing an entry at the moment we read it, before the peer team may have amended it).

Recorded as a team-lead policy decision 2026-04-29 in response to the (a)-vs-(b) question raised when this entry was filed.

## Re-verification

If `wiki/` directory structure changes — new subdir added, files moved, anything that affects relative paths — the link convention's path anchoring needs to update. The `related` frontmatter field is keyed on bare paths from repo root (`teams/framework-research/wiki/<subdir>/<file>.md`), which doesn't break on subdir restructures; the markdown-prose links DO break. Audit when the structure shifts.

The same caution applies after any team-name rename or workspace move — the 4-level depth is invariant for our current layout but could change.

## Compliance status

This entry is **filed without a retroactive audit pass**. The wiki at filing time (49 entries, sessions 1-15) was written bare-text-by-default, with markdown-link adoption inconsistent. A retrofit pass over existing entries to apply the convention is a separate decision team-lead scopes — typical librarian curation does not include retrofit work, since prior entries' provenance was honest about what conventions existed when they were filed.

Going forward (entry #50 onward), the librarian applies this convention on filing.

## Provenance — first cross-pollination filing

This is **the wiki's first cross-team-sourced pattern.** Origin: apex-research's [`wiki/patterns/wiki-cross-link-convention.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/wiki-cross-link-convention.md), filed 2026-04-29 by Eratosthenes (apex-research librarian) on a discovery by Schliemann. Surfaced to framework-research via Finn's comparative analysis at [`docs/apex-research-comparison-2026-04-29.md`](../../docs/apex-research-comparison-2026-04-29.md), classified as the highest-ROI cross-pollination candidate of three.

We did not mirror the apex entry verbatim. The content is portable, but the apex entry's retroactive audit list (9 specific apex wiki entries it was applied against) is theirs, not ours; copying it would make our entry misrepresent its own history. The body above is rewritten in framework-research's voice with our repo's path-anchoring (`topics/` not `shared/`, no `decisions/` ADR directory at present), and our compliance status section is honest about our pre-filing state.

### Frontmatter shape — `source-team` field

This entry introduces a new frontmatter field, `source-team: apex-research`, to distinguish cross-pollination origin from in-team origin. `source-agents` already lists individual contributors; `source-team` answers a different question — *which team's wiki did this idea originate in*. Single-entry experiment; if cross-pollination becomes recurring, hoist to the standard frontmatter schema in the librarian's prompt under "Wiki Provenance". If it stays one-off, keep ad hoc.

## Related

- Apex's entry: [`wiki-cross-link-convention.md`](https://github.com/Eesti-Raudtee/apex-migration-research/blob/main/teams/apex-research/wiki/patterns/wiki-cross-link-convention.md) (cross-repo cite). Their entry will not auto-update on changes to ours, and vice versa — the cross-team relationship is "co-discovered convention", not "synchronized fork".

(*FR:Callimachus*)
