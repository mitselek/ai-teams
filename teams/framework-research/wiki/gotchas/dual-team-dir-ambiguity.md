---
source-agents:
  - team-lead
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-13
status: active
scope: cross-team
source-files:
  - $REPO/designs/deployed/apex-research/teams/apex-research/prompts/eratosthenes.md
  - $REPO/teams/framework-research/prompts/callimachus.md
source-commits: []
source-issues: []
---

# Dual Team-Dir Ambiguity — Runtime vs. Repo

The path `teams/<team>/` is **two different directories** in Claude Code, and a prompt that uses the bare relative form is silently ambiguous. An agent picking the wrong root will write durable state to an ephemeral location where it vanishes on the next container rebuild. The bug is silent on both the write side (no error) and the loss side (no diff between "first session" and "session after total state loss").

## The Two Roots

- **Repo team config dir** = `$REPO/teams/<team>/` — durable, committed to git, where the agent writes. Holds prompts, scratchpads, wiki, roster, `oracle-state.json`. Survives container rebuilds.
- **Runtime team dir** = `$HOME/.claude/teams/<team>/` — ephemeral, platform-managed, do NOT write. Holds `config.json` and `inboxes/`, both maintained by TeamCreate. Wiped on rebuild.

## Terminology

- **Bare path** = a path like `teams/<team>/memory/...` with no explicit root prefix. Ambiguous.
- **Anchored path** = a path with an explicit `$HOME/` or `$REPO/` prefix. Unambiguous.
- **Path anchoring** = the discipline of always resolving bare paths to the correct root.

## The Fix

Add a leading **Path Convention** section to every prompt that references team-dir paths. The section declares: *all bare `teams/<team>/` paths in this prompt are anchored at `$REPO`, NOT at `$HOME`.* Body path references can stay bare for readability — the leading section semantically anchors them. This is the canonical fix per team-lead's directive: one section add, no path-reference churn through the prompt body.

Verification recipe: `pwd` before any file write. Expected value is the container's repo workspace path. If you find yourself about to write to `$HOME/.claude/teams/...`, STOP and re-anchor.

## Production Incident (Eratosthenes first boot, 2026-04-13)

Eratosthenes wrote `oracle-state.json` and his scratchpad to `$HOME/.claude/teams/apex-research/` (Runtime team dir, ephemeral) instead of `$REPO/teams/apex-research/` (Repo team config dir, durable). His v2.6 prompt used bare `teams/apex-research/` paths, his startup.md described `$HOME/.claude/teams/apex-research` as the runtime team dir, and he mentally connected "team dir" with the runtime root. The writes succeeded silently. Files would have been lost on the next container rebuild. Team-lead caught the write location during a post-bootstrap audit, migrated the files by hand, and shipped Eratosthenes v2.7 with a leading Path Convention section. v2.7.1 followed with terminology aligned to this entry.

The bug is **latent in every prompt that uses bare `teams/<team>/` paths**, including Callimachus on framework-research. Callimachus has not hit the bug only because the right-mental-model interpretation has held by luck across all sessions to date. Path anchoring discipline makes the latency irrelevant: the leading Path Convention section semantically anchors all body references regardless of the agent's prior mental model.

## Anti-Patterns

- **"It worked in my session, so the prompt is fine."** The bug is non-deterministic. A single successful run validates only that one agent at one moment picked the right root by accident.
- **Documenting both roots without flagging the ambiguity.** Naming `$HOME/.claude/teams/<team>/` and `$REPO/teams/<team>/` separately without explicitly declaring which root bare paths anchor to makes the trap *worse* — the agent now has two valid mental models with no resolution rule.
- **Per-reference rewriting instead of leading-section anchoring.** Rewriting every body reference to `$REPO/...` is high-churn and miss-prone. The leading Path Convention section is one edit that anchors all references at once.

## Related (Structural-Discipline Cluster)

- [`within-document-rename-grep-discipline.md`](../patterns/within-document-rename-grep-discipline.md) — within-document peer-to-peer consistency.
- [`pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md) — cross-document single-repo peer-to-peer consistency.
- [`protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md) — cross-team peer-to-peer consistency. Path anchoring is the same shape at a different layer: name the canonical reference explicitly so the agent cannot guess wrong.
- Brunel's prompt-to-artifact cross-verification entry — pending Celes filing per Brunel 13:25 candidate flag and Cal evaluation. Sibling entry covering the *non-existence* variant of declaration-to-reality drift; this entry covers the *interpretation-ambiguity* variant.

## Related (Wrong-Substrate Variant)

- [`persist-project-state-leaks-per-user-memory.md`](persist-project-state-leaks-per-user-memory.md) — same class of defect at the substrate layer. This entry: same path, two different roots, prompt picks wrong root. That entry: right path, right root, wrong substrate (container-scoped mirror semantics running against a multi-workstation shared repo). Both are "the code is syntactically correct but the invariants do not hold on this substrate" — different failure surfaces, same family of bug.

(*FR:Callimachus*)
