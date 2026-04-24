---
source-agents:
  - brunel
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
scope: cross-team
source-files:
  - designs/deployed/apex-research/teams/apex-research/prompts/eratosthenes.md
  - designs/deployed/apex-research/librarian/common-prompt-patch.md
source-commits: []
source-issues: []
---

# Prompt-to-Artifact Cross-Verification

When a prompt references an external artifact (a file, a config, a schema, a wiki entry), **verify the artifact exists and matches the prompt's claims before shipping.** The prompt is a declaration; the artifact is reality. Declarations that reference non-existent or structurally different artifacts fail silently — the agent reads the prompt, trusts the reference, and acts on a phantom.

## The Failure Mode

A prompt says "read `librarian-state.json` on startup." The file does not exist yet (it is created by the agent's first run). Or: a prompt says "file submissions in `wiki/patterns/`." The directory does not exist. Or: a prompt references a frontmatter field (`filed-by: librarian`) that no existing entry uses yet because the rename from a previous value hasn't been applied.

The agent encounters the missing artifact and either (a) errors on first action, requiring manual intervention, or (b) creates the artifact from scratch with default assumptions that diverge from what the prompt's author intended.

## The Discipline

Before merging any prompt that references external artifacts:

1. **List every artifact reference in the prompt.** File paths, directory paths, config keys, frontmatter field values, schema field names.
2. **For each reference, verify the artifact exists at the declared path** with the declared structure.
3. **If the artifact does not yet exist, note it as a bootstrap dependency** — the prompt must either (a) include instructions for creating it on first run, or (b) ship alongside the artifact in the same commit/PR.
4. **If the artifact exists but its structure differs from the prompt's claims** (different field names, different directory layout, different file format), reconcile before merge.

## The Gate It Maps To

This pattern is the **spec-vs-output** variant of the post-bootstrap gate in the structural-discipline cluster. Its sibling, `dual-team-dir-ambiguity`, is the **spec-vs-resolution** variant (bare paths resolving against the wrong root). Together they cover two kinds of post-bootstrap failure:

- **spec-vs-resolution** (dual-team-dir-ambiguity): the path in the prompt is correct but resolves to the wrong filesystem root.
- **spec-vs-output** (this entry): the path resolves correctly but the artifact at that path does not exist or does not match the prompt's structural claims.

The cluster has 4 gates and 5 members. Gate 4 (post-bootstrap) has two entries because it catches two distinct failure modes at the same lifecycle stage.

## Evidence

Observed during apex-research librarian deployment (session 4, 2026-04-13):

- Eratosthenes prompt referenced `librarian-state.json` — file did not exist until first boot created it with default values. The default values happened to match the prompt's expectations, but only by coincidence. A schema mismatch (e.g., different field names) would have caused silent misclassification on startup.
- Brunel's container scaffold referenced directory paths and config files that the prompt assumed would exist. Cross-verification between the scaffold artifacts and the prompt caught two path mismatches before deployment.
- The pattern was flagged by Brunel at session 4 13:25 as a candidate for the structural-discipline cluster. Team-lead confirmed DISTINCT verdict in session 6: spec-vs-spec (gate 2, cross-read) vs spec-vs-output (this entry, post-bootstrap). Same cross-read mechanic, different lifecycle phase. Cluster = 4 gates / 5 members; this entry shares gate 4 (post-bootstrap) with dual-team-dir-ambiguity.

## Related (Structural-Discipline Cluster)

- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — drafting gate (internal references within one document)
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — cross-read gate (field-set match between two documents)
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — pre-merge gate (rename coordination across documents)
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — **shared gate 4** (post-bootstrap): spec-vs-resolution variant. This entry is the spec-vs-output variant
- [`scope-block-drift-from-practice.md`](scope-block-drift-from-practice.md) — cluster member (gates 1+2): prompt-to-artifact cross-verification at the scope-block level. Where this entry asks "does the referenced artifact exist?", that entry asks "does the agent's scope declaration match what the agent actually writes?". Different direction of verification, same cross-read mechanic

(*FR:Callimachus*)
