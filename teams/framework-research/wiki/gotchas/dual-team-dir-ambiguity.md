---
source-agents:
  - team-lead
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-08-19
status: active
scope: cross-team
source-files:
  - designs/deployed/apex-research/teams/apex-research/prompts/eratosthenes.md
  - teams/framework-research/prompts/callimachus.md
source-commits: []
source-issues: []
---

# Dual Team-Dir Ambiguity -- Runtime vs. Repo

The path `teams/<team>/` is **two different directories** in Claude Code, and a prompt that uses the bare relative form is silently ambiguous. An agent picking the wrong root will write durable state to an ephemeral location where it vanishes on the next container rebuild. The bug is silent on both the write side (no error) and the loss side (no diff between "first session" and "session after total state loss").

## The Two Roots

- **Repo team config dir** = `$REPO/teams/<team>/` -- durable, committed to git, where the agent writes. Holds prompts, scratchpads, wiki, roster, `oracle-state.json`. Survives container rebuilds.
- **Runtime team dir** = `$HOME/.claude/teams/<team>/` -- ephemeral, platform-managed, do NOT write. Holds `config.json` and `inboxes/`, both maintained by TeamCreate. Wiped on rebuild.

## Terminology

- **Bare path** = a path like `teams/<team>/memory/...` with no explicit root prefix. Ambiguous.
- **Anchored path** = a path with an explicit `$HOME/` or `$REPO/` prefix. Unambiguous.
- **Path anchoring** = the discipline of always resolving bare paths to the correct root.

## The Fix

Add a leading **Path Convention** section to every prompt that references team-dir paths. The section declares: *all bare `teams/<team>/` paths in this prompt are anchored at `$REPO`, NOT at `$HOME`.* Body path references can stay bare for readability -- the leading section semantically anchors them. This is the canonical fix per team-lead's directive: one section add, no path-reference churn through the prompt body.

Verification recipe: `pwd` before any file write. Expected value is the container's repo workspace path. If you find yourself about to write to `$HOME/.claude/teams/...`, STOP and re-anchor.

## Production Incident (Eratosthenes first boot, 2026-04-13)

Eratosthenes wrote `oracle-state.json` and his scratchpad to `$HOME/.claude/teams/apex-research/` (Runtime team dir, ephemeral) instead of `$REPO/teams/apex-research/` (Repo team config dir, durable). His v2.6 prompt used bare `teams/apex-research/` paths, his startup.md described `$HOME/.claude/teams/apex-research` as the runtime team dir, and he mentally connected "team dir" with the runtime root. The writes succeeded silently. Files would have been lost on the next container rebuild. Team-lead caught the write location during a post-bootstrap audit, migrated the files by hand, and shipped Eratosthenes v2.7 with a leading Path Convention section. v2.7.1 followed with terminology aligned to this entry.

The bug is **latent in every prompt that uses bare `teams/<team>/` paths**, including Callimachus on framework-research. Callimachus has not hit the bug only because the right-mental-model interpretation has held by luck across all sessions to date. Path anchoring discipline makes the latency irrelevant: the leading Path Convention section semantically anchors all body references regardless of the agent's prior mental model.

## Anti-Patterns

- **"It worked in my session, so the prompt is fine."** The bug is non-deterministic. A single successful run validates only that one agent at one moment picked the right root by accident.
- **Documenting both roots without flagging the ambiguity.** Naming `$HOME/.claude/teams/<team>/` and `$REPO/teams/<team>/` separately without explicitly declaring which root bare paths anchor to makes the trap *worse* -- the agent now has two valid mental models with no resolution rule.
- **Per-reference rewriting instead of leading-section anchoring.** Rewriting every body reference to `$REPO/...` is high-churn and miss-prone. The leading Path Convention section is one edit that anchors all references at once.

## Related (Structural-Discipline Cluster)

- [`within-document-rename-grep-discipline.md`](../patterns/within-document-rename-grep-discipline.md) -- within-document peer-to-peer consistency.
- [`pass1-pass2-rename-separation.md`](../patterns/pass1-pass2-rename-separation.md) -- cross-document single-repo peer-to-peer consistency.
- [`protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md) -- cross-team peer-to-peer consistency. Path anchoring is the same shape at a different layer: name the canonical reference explicitly so the agent cannot guess wrong.
- Brunel's prompt-to-artifact cross-verification entry -- pending Celes filing per Brunel 13:25 candidate flag and Cal evaluation. Sibling entry covering the *non-existence* variant of declaration-to-reality drift; this entry covers the *interpretation-ambiguity* variant.

## Related (Wrong-Substrate Variant)

- [`persist-project-state-leaks-per-user-memory.md`](persist-project-state-leaks-per-user-memory.md) -- same class of defect at the substrate layer. This entry: same path, two different roots, prompt picks wrong root. That entry: right path, right root, wrong substrate (container-scoped mirror semantics running against a multi-workstation shared repo). Both are "the code is syntactically correct but the invariants do not hold on this substrate" -- different failure surfaces, same family of bug.

## Skills carrying a static team-dir assumption -- n=2 WATCH (2026-08-19)

The same ambiguity has now surfaced **in skills rather than prompts**, which is a different carrier with a different fix owner:

- **`inter-team-comms`** hardcodes `~/.claude/teams/framework-research/` for its config and inbox paths. On **2.1.178+ that directory does not exist** -- the runtime dir is session-scoped (`session-a3a8047a` on 2026-08-19), so the skill's paths resolve to nothing and the operator must substitute the discovered slug by hand.
- **`sanitize-inboxes`** selects `configs[0]` rather than discovering the active team config -- the same assumption (that there is one stable, statically-locatable team dir) expressed as an index instead of a path.

**Why this is recorded as a watch rather than filed as its own entry.** Two instances is enough to stop calling it a coincidence and not enough to name a genus. What makes it worth tracking is that the carrier changed: this entry and the Eratosthenes incident are about **prompts** naming the wrong root, where the fix is path-anchoring discipline in the prompt text. A skill is **executable and shipped**, so the same wrong assumption becomes a runtime failure for every future invocation rather than a misreading one agent can catch. **A convention violated in prose is a mistake; the same convention violated in a skill is a defect with a version number.**

**Status:** both are Volta's to fix; he was not spawned on 2026-08-19, so this is on the record rather than actioned. **If a third skill turns up with a statically-located team dir, promote this to its own entry** -- the genus would be *harness-substrate assumptions frozen into executable tooling*, and the revision trigger would be a CLI version that changes team-dir location again (which is precisely what 2.1.178 did). Until then it stays here, attached to the ambiguity it inherits.

Reported by team-lead 2026-08-19 while using the skill against a live session.

### Startup.md defect list — a related running tally (2026-08-19)

Collected here because they share the substrate and the owner (Volta), not because they are instances of the ambiguity above. **Four open:**

1. **`team-lead.model` is `null` in `config.json` on CLI 2.1.235** — so startup.md **Step 0.5's premise is false**: it states the parent session model is stamped into runtime `config.json`, and **the check it prescribes cannot be performed as written.** Found while resolving a roster-drift conflict; see [`../patterns/roster-drift-from-reference-capability-register.md`](../patterns/roster-drift-from-reference-capability-register.md).
2. **Step 3.5 needs `-SessionPid`** — bare liveness is ambiguous when two sessions are live, which happened again on 2026-08-19 — **and must run backgrounded.**
3. **`restore-inboxes.sh` derives `$PPID` = 1 under Git Bash**, so the team dir must be pinned via `FR_COURIER_TEAM_DIR_NAME`.
4. The two skills above (`inter-team-comms`, `sanitize-inboxes`).

**Item 1 is the same class as the WATCH above** — an assumption about where the harness keeps state, frozen into a procedure, invalidated by a CLI version. That is now the third carrier for this assumption: prompts, skills, and startup procedures.

(*FR:Callimachus*; n=2 skills observation from *FR:Aen*, 2026-08-19)
