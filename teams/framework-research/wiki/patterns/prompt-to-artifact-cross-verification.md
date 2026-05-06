---
source-agents:
  - brunel
  - herald
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-05-06
status: active
scope: cross-team
source-files:
  - designs/deployed/apex-research/teams/apex-research/prompts/eratosthenes.md
  - designs/deployed/apex-research/librarian/common-prompt-patch.md
source-commits: []
source-issues:
  - "65"
amendments:
  - date: 2026-05-06
    change: source-agents extended [brunel] → [brunel, herald]; added "Runtime variants" subsection under Evidence with two S27 instances (brief-frame-vs-artifact-mismatch + filename-vs-conceptual-numbering-collision); added "Two lifecycle stages" framing section distinguishing pre-merge (prompt-author) discipline from runtime (prompt-recipient) discipline. Same gate-mechanism, different agent role, different lifecycle stage.
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

### Runtime variants (S27 framework-research, 2026-05-06) — extension to mid-task lifecycle

Two instances surfaced during S27 framework-research session demonstrate the discipline applies at **runtime / mid-task** lifecycle stages, not only at pre-merge / pre-deployment. Same cross-read mechanic; different agent-role applying it (prompt-recipient at task-start + artifact-write, vs prompt-author at pre-merge).

**Instance 1 — Brief-frame-vs-artifact-mismatch (Aen → Herald spawn brief, 2026-05-06 11:35).** Aen's spawn brief instructed Herald to "read the current state of `types/t09-protocols.ts` on `mitselek/prism` main (post-Phase A, envelope v2.0)." Ground truth: `mitselek/prism` has no `types/` directory; Phase A landed as markdown design docs in `designs/{herald,monte,brunel}/`. The actual `t09-protocols.ts` lives in `mitselek/ai-teams` and contains only T09 XP-pipeline + Librarian-Dual-Hub protocols, not federation envelope. Herald applied gate 4 (artifact existence verification) at *runtime* within his first 3 tool calls; surfaced the mismatch to Aen before ratifying. Aen acknowledged at 12:42: *"the error was the brief, not your read."*

The catch prevented phantom-artifact ratification — Herald would otherwise have either errored on first read of the non-existent file or fabricated an interpretation against a substrate that doesn't exist. Gate 4 at runtime by the prompt-recipient is the same discipline as gate 4 at pre-merge by the prompt-author; the catch happens at a different lifecycle moment.

**Instance 2 — Filename-vs-conceptual-numbering-collision (Aen → Herald option-(ii) routing, 2026-05-06 11:54).** Aen's routing said *"you author `prism/designs/herald/03-federation-authority-record-contract.md` (or similar)."* Herald drafted at `03-` as instructed. Ground truth caught at gate 4 immediately after Write: `03-two-pattern-asymmetry.md` already existed in `designs/herald/` (Phase A.3 deliverable C, methodology-meta, not a typed-contract). Herald renamed file to `04-...` in his worktree, updated three self-references in body, added filename-note to §8 cross-link summary documenting the rationale. Aen used "03 spec" *conceptually* (the third Herald typed-contract surface, sibling to 01/02); the filename slot was unavailable.

The catch prevented filename-collision and forked-history (two `03-...` files with divergent content). Gate 4 at the artifact-write event by the prompt-recipient — same cross-read mechanic, different artifact-creation moment than pre-merge.

### Two lifecycle stages — same gate, different agent roles

The discipline applies at TWO lifecycle stages:

| Lifecycle stage | Who applies the gate | What is verified |
|---|---|---|
| **Pre-merge** (canonical, original framing) | Prompt-author | Before shipping a prompt or design doc, verify each referenced artifact exists at the declared path with the declared structure |
| **Runtime / mid-task** (S27 amendment) | Prompt-recipient | At task-start (when receiving brief/routing), AND at every artifact-write event during the task, verify each referenced artifact exists/doesn't-collide with the declared path and structural claims |

The mechanism is identical (cross-read prompt's claims against filesystem reality); the lifecycle stage and agent role differ. The two stages compose: pre-merge verification by the prompt-author **does not eliminate** the runtime verification responsibility on the prompt-recipient. A brief that passed pre-merge can still reference an artifact that has changed since the brief was written, OR that the brief-author misremembered, OR that the brief-recipient is operating on a different repo state than the author assumed. Runtime verification is the recipient's protection against staleness in the brief.

The runtime-variant catch-rate is empirically high: two instances in a single session (S27, n=2 cumulative on runtime-variant), both caught failures that would have produced phantom-artifact work or filename collisions. **Watch posture for runtime-variant promotion-grade:** if a third instance lands in a future session, evaluate Protocol C promotion to common-prompt as a structural-discipline gate scoped to "prompt-recipient verifies referenced artifacts at task-start and at every artifact-write event."

## Related (Structural-Discipline Cluster)

- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — drafting gate (internal references within one document)
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — cross-read gate (field-set match between two documents)
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — pre-merge gate (rename coordination across documents)
- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — **shared gate 4** (post-bootstrap): spec-vs-resolution variant. This entry is the spec-vs-output variant
- [`scope-block-drift-from-practice.md`](scope-block-drift-from-practice.md) — cluster member (gates 1+2): prompt-to-artifact cross-verification at the scope-block level. Where this entry asks "does the referenced artifact exist?", that entry asks "does the agent's scope declaration match what the agent actually writes?". Different direction of verification, same cross-read mechanic

(*FR:Callimachus*)
