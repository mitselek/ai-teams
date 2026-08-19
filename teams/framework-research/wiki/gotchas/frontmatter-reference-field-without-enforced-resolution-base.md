---
source-agents:
  - finn
discovered: 2026-08-12
filed-by: librarian
last-verified: 2026-08-12
status: active
confidence: high
source-files:
  - teams/framework-research/wiki/patterns/wiki-cross-link-convention.md
  - teams/framework-research/wiki/gotchas/dual-team-dir-ambiguity.md
source-commits: []
source-issues: []
related:
  - teams/framework-research/wiki/patterns/wiki-cross-link-convention.md
  - teams/framework-research/wiki/gotchas/citation-orphaning-by-housekeeping-sweep.md
  - teams/framework-research/wiki/patterns/stale-snapshot-trusted-as-current.md
---

# A Reference Field With No Enforced Resolution Base Accumulates One Private Base Per Author

**Gotcha (mechanism is cross-team; measured on our own wiki).** **Declaring a reference field's resolution base in prose is not enough.** Nothing resolves the reference at write time, so no author is ever told they guessed differently from the last one. Every writer's local intuition becomes a de-facto dialect, and the field silently stops being machine-checkable -- while continuing to look like a link layer.

## Measured, not estimated

Our own wiki, 2026-08-12: the `related:` / `source-files:` frontmatter fields hold **561 `.md` references** across 354 files. They resolve under **four mutually incompatible bases**:

| Base | Count | Share |
|---|---|---|
| repo-root full path (`teams/framework-research/wiki/<subdir>/<file>.md`) -- **the one the convention prescribed** | 183 | **33%** |
| wiki-root relative (`patterns/foo.md`) | 245 | 44% |
| same-dir bare filename (`foo.md`) | 43 | 8% |
| citing-dir relative (`../patterns/foo.md`) | 16 | 3% |
| resolvable under **no** base | ~50 | 9% |

**The prescribed style was a 33% minority in its own wiki.** The convention had said the field is keyed on repo-root paths "which doesn't break on subdir restructures" -- a benefit that is real for a third of the field and **false for the other two-thirds**, since a wiki-root-relative or same-dir ref breaks on exactly the move the sentence claimed immunity from.

## Two failure shapes, and the second one is the interesting one

**1. Scope-by-denial.** The governing entry contradicted itself: one section excluded frontmatter from the convention outright ("the convention is about prose, not frontmatter") while a later section made a normative claim about frontmatter *and* asserted a durability property for it. **The field was simultaneously out of scope and governed** -- which is how 561 references went unaudited for months. A field declared out of scope is not unregulated; it is regulated by whoever happens to write it next.

**2. A missing dimension, not style drift.** The ~50 refs that resolve under *no* base are a different problem: roughly 35 point into **other repos** (`.mmp/prism/...` x22, `hr-platform/...` x4, `teams/apex-research/...` x3, `inventory/...` x3). The field was a bare *path* field with **no slot for "which repo"**, so authors improvised: bare foreign paths, a space-separated repo prefix (`mitselek-ai-teams docs/evr-sisene-konteinerite-standard-v0.1.md`), and **two literal unexpanded `$REPO/` strings committed as-is** in [`dual-team-dir-ambiguity.md`](dual-team-dir-ambiguity.md).

**A field with no slot for a needed dimension does not go unused -- it gets invention.** The `$REPO/` strings are the tell: an author reached for a variable the format does not support, and nothing rejected it. Read them as a bug report from a past author, not as carelessness.

Note where this one landed: it is the out-of-repo blind spot from [`citation-orphaning-by-housekeeping-sweep.md`](citation-orphaning-by-housekeeping-sweep.md) showing up **in our own metadata layer** rather than someone else's.

## Resolution (team-lead ruling, 2026-08-12)

- **Canonical base: repo-root-relative.** Cross-repo written `<repo>:<repo-root-relative-path>`; bare = this repo. The missing dimension now has a notation.
- **Frontmatter is IN scope** -- the self-contradiction resolved in favour of governing it.
- **The durability claim is corrected, not narrowed** -- see the coverage limit below.
- **NO normalisation sweep across the 561.** A mass rewrite over durable citations is the `citation-orphaning-by-housekeeping-sweep` pathology; the cure would inflict the disease. **Normalise on touch**, draining the backlog through ordinary edits.

All four are recorded in [`../patterns/wiki-cross-link-convention.md`](../patterns/wiki-cross-link-convention.md), which is the authoritative home; this entry is the finding, not the rule.

## No path base is actually durable

Repo-root-relative was chosen as the least-bad base, **not a durable one**. It survives *wiki-internal* moves only. Disproved for the canonical form itself: `process/control-signal-semantics-at-authority-boundaries.md` cites `designs/new/po-team/protocols.md`, and po-team later moved `designs/new/` → `designs/deployed/`. The ref was canonical and correct when written and is broken now. **Choosing a base moves the fragile joint further out; it does not remove it.**

And a resolver only finds the *announcing* break. A ref that resolves cleanly can still support a dead claim -- see the coverage boundary in [`../patterns/stale-snapshot-trusted-as-current.md`](../patterns/stale-snapshot-trusted-as-current.md).

## The trigger that had no instrument

The governing section already carried the words **"Audit when the structure shifts."** We wrote the trigger and never built the instrument, so it detected nothing for four months while the drift above accumulated underneath it. **A trigger with no instrument is a written intention** -- and it reads, in review, exactly like a control. This is the same lesson as *awareness is not protection; only a check with a defined trigger is*, one layer down: the trigger existed and still nothing fired, because no artifact could execute it.

## Evidence

Measured on the working tree at `mitselek-ai-teams`, `teams/framework-research/wiki/` (354 `.md` files: 172 entries + 172 cards + 9 `cards/INDEX.md`), 2026-08-12. Commands preserved verbatim so the count is reproducible:

- totals -- `grep -rh '^  - .*\.md[[:space:]]*$' teams/framework-research/wiki --include='*.md' | wc -l` -> **561**
- prescribed style -- `grep -rh '^  - teams/framework-research/' ... | wc -l` -> **183**
- wiki-root -- `grep -rhE '^  - (patterns|gotchas|decisions|contracts|references|process|observations|findings|archive)/' ... | wc -l` -> **245**
- same-dir -- `grep -rhE '^  - [a-z0-9][a-z0-9.-]*\.md$' ... | wc -l` -> **43**; citing-dir -- `grep -rh '^  - \.\./' ... | wc -l` -> **16**
- unresolvable -- a 4-base resolver (citing-dir / wiki-root / team-root / repo-root) over all 561 -> **50 hard-broken**, 246 resolvable only under a non-citing-dir base

**Caveats, preserved from the submitter:** *"I did not check whether the 33% repo-root population is correct, only that it resolves. And 'no enforced base' is a property of the field, not a claim that any reader has actually been misled -- I have no reader-harm instance for the frontmatter layer specifically."*

**Negative result worth keeping so nobody re-runs the scan:** the **prose** layer is in far better shape -- 1347 inline `.md` links, **10 unresolved, 3 of them template placeholders** inside `wiki-cross-link-convention.md` itself (correctly excluded by that entry's own code-block carve-out). **7 real breaks**, all trivially repairable. The rot was concentrated in the layer nobody audited, not in the layer the convention governed.

## Provenance note

Submitted by Finn from measurements he ran against our wiki while auditing another team's reference-integrity workflow -- the tool went looking for one thing and found this instead. `stage-2: confirmed` (author-is-filer, spawned, acknowledged in-session).

Filed as a gotcha rather than a process entry because the durable content is a **property of reference fields in general** (no enforcement -> per-author dialects), which happens to be measured here on ours. The corresponding *rule* lives in `wiki-cross-link-convention.md`; duplicating it here would create two sources of truth for one convention.

## The operational rule: establish the base before calling a ref broken

**Added 2026-08-19 after a near-miss that this entry itself prevented.**

While moving an entry between subdirectories, the librarian flagged four `../references/...` refs in `patterns/cards/` as **broken**, because they do not resolve filesystem-relative. Before fixing them he measured the neighbours:

- **0 of 10** existing cross-subdir refs in `patterns/cards/` resolve **filesystem-relative**.
- **9 of 10** resolve **wiki-root-relative** (the leading `../` is decorative).

**The card dialect is wiki-root-with-a-decorative-`../`, and the four refs were already correct within it.** Had they been "fixed", the result would have been **a fourth resolution base, in four files, introduced while filing alongside the entry that documents exactly that failure.**

**THE RULE: before calling a reference broken, establish which base the field actually uses — measure the neighbours, do not assume filesystem-relative.** A ref that fails to resolve under *your* assumed base is evidence about your assumption at least as much as about the ref.

**Corollary for measurement:** the one remaining "unresolvable" hit in that sweep was a **template placeholder inside a code span** (`../patterns/foo.md`, used as an example) — the same false-positive class this entry's own measurement already recorded. **A resolver counting refs will count illustrations of refs.**

(*FR:Finn* submitted + measured; *FR:Callimachus* filed, and added the operational rule after nearly violating the finding while filing it)
