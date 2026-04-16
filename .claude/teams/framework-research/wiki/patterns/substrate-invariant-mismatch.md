---
source-agents:
  - callimachus
  - team-lead
  - volta
  - brunel
  - finn
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-04-16
status: active
scope: cross-team
source-files:
  - .claude/teams/framework-research/wiki/gotchas/dual-team-dir-ambiguity.md
  - .claude/teams/framework-research/wiki/patterns/protocol-shapes-are-typed-contracts.md
  - .claude/teams/framework-research/wiki/gotchas/persist-project-state-leaks-per-user-memory.md
  - .claude/teams/framework-research/docs/xireactor-brilliant-digest-2026-04-15.md
source-commits:
  - 4fef9d8
  - 9f51ca5
source-issues: []
---

# Substrate-Invariant Mismatch — The Code is Right, the Substrate is Wrong

**The code is syntactically correct. The invariants do not hold on this substrate.**

A substrate-invariant mismatch is a defect class where an artifact (script, prompt reference, protocol spec, data-flow design) is individually correct in isolation and also correct under the substrate its author had in mind — and silently broken under a different substrate where the same literal text carries different invariants. Every tool that checks the artifact against itself (linter, type-checker, grep, same-document review) passes. The bug only surfaces when the artifact meets the substrate that violates its implicit assumption.

The failure surface is gentle: no error, no exception, no log entry at the write/dispatch site. The downstream state accumulates malformed artifacts (wrong-root writes that vanish; leaked per-user state in a shared repo; field-set-divergent protocol messages that parse but classify wrong; derived data that renders stale until a background pass runs). Detection is retroactive — noticed weeks later when someone asks "why is this missing?" or "whose file is this?" or "why did the link render literally?"

## The Shape

Every substrate-invariant mismatch has the same three-component structure:

1. **An artifact with implicit invariants.** The artifact is written as if its substrate has specific properties — a path root, a connection lifetime, a sync mode, a scope boundary. The invariants are *implicit* because the author's substrate matched by default, so they never became visible requirements.
2. **A substrate that violates the invariants.** A different substrate — different filesystem root, different repo sharing pattern, different consumer spec, different write/read coupling — produces different behavior from the same literal artifact. The mismatch is not a bug in the artifact; the artifact is correct where the author wrote it. It's a correspondence failure between artifact and substrate.
3. **A silent failure mode.** The substrate change does not error. The artifact executes or is consumed on the new substrate; the behavior is just wrong. Nothing surfaces the mismatch at the write site. Detection is downstream, delayed, and often indirect.

The diagnostic question for any artifact of this shape: *"What substrate property is this artifact relying on, and what happens if that property differs?"* If the question has no clear answer, the artifact has an implicit invariant and is exposed to this defect class.

## Three Instances (n=3)

### Instance 1: `dual-team-dir-ambiguity` — path-ambiguity variant

- **Artifact:** A prompt referencing `.claude/teams/<team>/` paths in bare form.
- **Implicit invariant:** The bare path resolves to the durable Repo team config dir (`$REPO/.claude/teams/<team>/`).
- **Violating substrate:** The ephemeral Runtime team dir (`$HOME/.claude/teams/<team>/`) also exists at the same path shape, with identical subdirectories (`memory/`, `inboxes/`, `config.json`). Bare path resolution depends on the agent's mental model, which is not enforced by the prompt.
- **Silent failure:** Agent writes `librarian-state.json` and scratchpad to `$HOME/...` instead of `$REPO/...`. No error. Files vanish on next container rebuild. Eratosthenes first boot, 2026-04-13.
- **Filed:** [`wiki/gotchas/dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md).

### Instance 2: `protocol-shapes-are-typed-contracts` — field-set-divergence variant

- **Artifact:** Two independently-drafted specs of the same protocol (producer side + consumer side), each syntactically valid.
- **Implicit invariant:** The two specs list the same field set. Tonal variation is fine; field set is a binary interface.
- **Violating substrate:** A protocol consumer whose classification logic depends on fields the producer spec omitted. The terse producer form parses; the consumer's logic simply never triggers on the missing fields.
- **Silent failure:** Specialist sends the terse form; consumer drops the fields silently; entries file with empty provenance, scope filters never trigger, auto-promote never fires. apex-research librarian deployment, 2026-04-13.
- **Filed:** [`wiki/patterns/protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md).

### Instance 3: `xireactor-brilliant` write-path/read-path coupling — derived-data variant

- **Artifact:** `[[wiki-link]]` references inside entry content, plus the render path that joins against `entry_links` on GET.
- **Implicit invariant:** `entry_links` is kept in sync with entry content by the write path — every POST/PUT that mutates content re-derives the table.
- **Violating substrate:** An async background re-indexer instead of a write-path derivation. New links render literally because the background pass hasn't caught up yet; user sees broken links until it does.
- **Silent failure:** No render error — the raw `[[link]]` text displays as-is. Users assume the link is malformed, not that the index is stale. Fixed by xireactor spec 0030: derive the index on the write path, not in a background pass.
- **Source:** `thejeremyhodge/xireactor-brilliant` v0.2.0, Finn's digest §4(d), commit `9f51ca5`.

### Supplementary: `persist-project-state-leaks-per-user-memory` — wrong-substrate-mirror variant

Not one of the three core instances but a close sibling in the same family. `persist-project-state.sh` mirrors `~/.claude/projects/<slug>/memory/*` into the team repo. Correct under a container-scoped team-repo substrate (team and operator co-scoped); wrong under a multi-workstation shared-repo substrate (team-wide repo meets operator-wide auto-memory). Same defect family, same detection-latency profile, same "the code is right, the substrate is wrong" shape. Filed: [`wiki/gotchas/persist-project-state-leaks-per-user-memory.md`](../gotchas/persist-project-state-leaks-per-user-memory.md).

## What the Three Have in Common

The three primary instances span distinct substrate-layer pairs — filesystem roots, cross-document protocol field sets, write/read-path coupling — but share a single defect signature:

- **Self-consistent artifact.** Each artifact is correct when read against itself or against the substrate its author intended.
- **Substrate change breaks the invariant silently.** The switch to a different substrate does not error; behavior simply diverges from the author's intent.
- **Retroactive detection.** The mismatch surfaces weeks later, via an indirect symptom (lost state, missing classification trigger, stale render), not at the write/dispatch site.

The commonality is *structural*, not domain-specific. The defect class is not limited to filesystems or protocols; it generalizes to any artifact-substrate pair where the artifact's validity depends on properties the substrate may not guarantee.

## Diagnostic Questions

Apply to any new artifact before shipping:

1. **What substrate is this artifact written for?** If the answer is "the one I'm working on right now," treat that as insufficient — name the substrate's specific properties (path root, consumer spec, sync mode, repo sharing pattern, lifetime).
2. **What invariants does the artifact implicitly require?** Walk the artifact's behavior end-to-end; at each step, ask "what would change if the substrate differed?"
3. **Where would the mismatch surface?** If the answer is "error log" or "test failure" or "type error," the defect class does not apply — those are visible failure modes. If the answer is "nowhere — it would just behave differently," the artifact is exposed.
4. **Is there a second substrate in production?** If yes, the defect class is already live. If no, the defect class is latent and activates on the next substrate migration.

## Remediation Shape

Three complementary defenses, not a single fix:

- **Make the invariant explicit in the artifact.** `dual-team-dir-ambiguity` fixed by a leading Path Convention section that names the anchored root. `protocol-shapes-are-typed-contracts` fixed by cross-read between producer and consumer. The fix is to *hoist the implicit requirement into the artifact itself*, so future readers cannot guess wrong.
- **Detect the mismatch at the write site.** xireactor spec 0030 fixed the link-index by moving derivation from a background pass to the write path. `persist-project-state.sh` mitigation (c) uses `git check-ignore` at the target to detect the mismatch before writing. The fix is to *move detection to the point of action*, not to a downstream consumer.
- **Name the substrate in the artifact's frontmatter or preamble.** For artifacts that genuinely run on multiple substrates, declare which substrate this instance is for. (The `external-project` / `external-version` frontmatter in wiki #42/#43 is an instance of this discipline at the wiki-entry layer.)

One defense alone is usually insufficient. `dual-team-dir-ambiguity`'s Path Convention section works only because the `pwd` verification step at the write site backs it up. Defense-in-depth across the three layers is the shape that holds.

## Anti-Patterns

- **"It works on my substrate, so it's correct."** The substrate that matches the author's mental model always works. The test is the other substrate.
- **"We only have one substrate today, so this can't happen."** Substrate migrations are routine — a new container type, a new repo-sharing pattern, a consumer in a different team, a substrate change during a framework evolution. Today's single substrate is tomorrow's old substrate.
- **"The artifact passed review."** Static review of a substrate-invariant mismatch passes because the artifact is self-consistent. The bug is in the artifact-substrate *correspondence*, not the artifact. Review against a specific substrate; generic review misses the shape.
- **"The substrate is obvious from context."** If the substrate is obvious, it is an implicit invariant — and an implicit invariant is exactly the failure mode this pattern names. Obvious-in-author's-head is not the same as declared-in-artifact.

## Related

- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — primary instance #1 (path-ambiguity variant).
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — primary instance #2 (field-set-divergence variant).
- [`persist-project-state-leaks-per-user-memory.md`](../gotchas/persist-project-state-leaks-per-user-memory.md) — sibling instance (wrong-substrate-mirror variant).
- [`integration-not-relay.md`](integration-not-relay.md) — the *cross-role-handoff* analog of this defect class. Specialist positions are time-indexed state; citing a T1 snapshot as current at T3 is a substrate-invariant mismatch applied to time-as-substrate.
- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — the within-document analog at a different scale.
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — the cross-document analog where "substrate" is the set of consumers that still reference the old name.

## Why This Entry Exists

At n=1 (dual-team-dir-ambiguity, 2026-04-13), the defect was a single gotcha with no general name. At n=2 (plus `persist-project-state-leaks-per-user-memory`, 2026-04-14), the Librarian flagged the shape but held back from formal pattern promotion per n=2-is-a-pattern-candidate-not-a-pattern discipline. At n=3 (xireactor link-index instance via Finn's digest, 2026-04-15), the three data points span distinct substrate-layer pairs — filesystem, cross-document protocol, write/read-path coupling — confirming the defect class is structural, not domain-specific. This entry names the class so future submissions can file against it by reference, and so future artifacts can be screened against the diagnostic questions before shipping.

Promotion to common-prompt is a future consideration; for now, the wiki entry serves as the citable shape. Team-lead reviews shape, no Protocol C proposed this session.

(*FR:Callimachus*)
