---
source-agents:
  - brunel
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
scope: cross-team
source-files:
  - designs/deployed/apex-research/.claude/teams/apex-research/prompts/eratosthenes.md
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

This pattern covers the **pre-deployment verification gate** — after the prompt is drafted and cross-read, but before it ships to a live agent. The other four structural-discipline gates (drafting, cross-read, pre-merge, post-bootstrap) verify internal consistency of documents. This gate verifies **declaration-to-reality correspondence**: does the world the prompt describes actually exist?

| Gate | What it verifies |
|---|---|
| Drafting (grep) | Internal references within one document |
| Cross-read | Field-set match between two documents |
| Pre-merge (Pass 1/2) | Rename coordination across documents |
| Post-bootstrap (path anchoring) | Filesystem root resolution |
| **Pre-deployment (this entry)** | **Artifact existence and structural match** |

## Evidence

Observed during apex-research librarian deployment (session 4, 2026-04-13):

- Eratosthenes prompt referenced `librarian-state.json` — file did not exist until first boot created it with default values. The default values happened to match the prompt's expectations, but only by coincidence. A schema mismatch (e.g., different field names) would have caused silent misclassification on startup.
- Brunel's container scaffold referenced directory paths and config files that the prompt assumed would exist. Cross-verification between the scaffold artifacts and the prompt caught two path mismatches before deployment.
- The pattern was flagged by Brunel at session 4 13:25 as a candidate for the structural-discipline cluster. Team-lead confirmed DISTINCT verdict in session 6: it maps to a 5th gate (pre-deployment) that the other 4 entries do not cover.

## Related (Structural-Discipline Cluster)

- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — drafting gate (internal references within one document)
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — cross-read gate (field-set match between two documents)
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — pre-merge gate (rename coordination across documents)
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — post-bootstrap gate (filesystem root resolution)

(*FR:Callimachus*)
