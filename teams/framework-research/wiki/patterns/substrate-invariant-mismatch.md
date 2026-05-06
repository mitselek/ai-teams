---
source-agents:
  - callimachus
  - team-lead
  - volta
  - brunel
  - finn
  - schliemann
  - monte
discovered: 2026-04-13
filed-by: librarian
last-verified: 2026-05-06
status: active
scope: cross-team
source-files:
  - teams/framework-research/wiki/gotchas/dual-team-dir-ambiguity.md
  - teams/framework-research/wiki/patterns/protocol-shapes-are-typed-contracts.md
  - teams/framework-research/wiki/gotchas/persist-project-state-leaks-per-user-memory.md
  - teams/framework-research/wiki/gotchas/teamcreate-in-memory-leadership-survives-clear.md
  - teams/framework-research/docs/xireactor-brilliant-digest-2026-04-15.md
  - docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md
source-commits:
  - 4fef9d8
  - 9f51ca5
source-issues:
  - 64
  - 65
amendments:
  - date: 2026-05-05
    change: n=3 → n=5; added instance 4 (TeamCreate in-memory leadership) + instance 5 (Brilliant entry_links write-path sync); reframed "Three Instances" → "Five Instances" + "What the Three Have in Common" → "What the Five Have in Common"; refreshed Related section
  - date: 2026-05-06
    change: n=5 → n=6; added instance 6 (harness inbox-write vs runtime inbox-iteration desynchronization); reframed "Five Instances" → "Six Instances"; surfaced worktree-asymmetry hypothesis as session-27 live-operational evidence; source-agents extended with monte (sender-side dual-witness; cal/aen receiver-side independently verified); operational hypothesis sharpened by Monte's structural insight (worktree-mount-decomposition; same-root-cause-different-layer relationship to Instance 1's bare-path-resolution); receiver-side empirical observation folded (no self-correction via re-iteration; correction required out-of-band relay — rules out non-deterministic-iteration-with-eventual-recovery as dominant mechanism, supports deterministic mount-decomposition).
  - date: 2026-05-06 (Sub-shape B confirmation)
    change: Brunel's Protocol A AMENDMENT — confirmed dual-witness on Instance 6 Sub-shape B (on-disk-absence). Brunel's `inboxes/brunel.json` last-entry is S26 shutdown_request, identical pattern to callimachus.json — no S27 messages in either receiver's inbox file, independent confirmation of Sub-shape B failure mode. Brunel is now joint source-agent on Instance 6 alongside monte (both sender-side worktree-OUTBOUND), with cal/team-lead receiver-side dual-witness preserved. Cross-link to dual-team-dir-ambiguity confirmed by Brunel as the canonical structural-analog at the user-facing layer (this entry's Instance 6 is the harness-managed-state version of the same pattern).
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

## Six Instances (n=6)

### Instance 1: `dual-team-dir-ambiguity` — path-ambiguity variant

- **Artifact:** A prompt referencing `teams/<team>/` paths in bare form.
- **Implicit invariant:** The bare path resolves to the durable Repo team config dir (`$REPO/teams/<team>/`).
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

### Instance 4: `teamcreate-in-memory-leadership-survives-clear` — disk-vs-in-memory-state variant

- **Artifact:** A team-restart procedure that does `rm -rf $TEAM_DIR` (the Runtime team dir at `$HOME/.claude/teams/<team>/`) and then calls `TeamCreate(team_name=...)` to start fresh.
- **Implicit invariant:** Filesystem state IS the team-leadership state. Removing the directory releases the parent CLI's leadership claim on the team.
- **Violating substrate:** The Claude Code parent CLI holds team-leadership state **in memory**, separate from disk. The next `TeamCreate` returns "Already leading team." even though `$TEAM_DIR` does not exist on disk. The disk-cleanup → leadership-release inference is wrong; release requires explicit `TeamDelete()`.
- **Silent failure:** Restart procedure looks correct (disk is clean), but `TeamCreate` fails with a misleading error ("Already leading team.") that does not name the in-memory state. Operator chases filesystem causes before reaching the runtime-state cause. n=2 cross-team confirmation (Schliemann/apex + Volta/FR session 21), promotion-grade per Volta's criterion; third reproduction during esl-suvekool 22→23 boundary. Mitigation: every-startup `TeamDelete + TeamCreate + verify-on-disk` (commit `426194d`); graceful-shutdown S5 `TeamDelete()` after final push.
- **Filed:** [`wiki/gotchas/teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md). Sources: Volta + Schliemann (cross-team).

### Instance 5: Brilliant entry_links write-path sync — external-platform confirmation of the derived-data variant

- **Artifact:** `[[wiki-link]]` references in entry content + a write-path that synchronously re-derives `entry_links` on every POST/PUT (rather than relying on a background re-indexer).
- **Implicit invariant:** Derived data read at render time MUST be written on the write path of the source content. The render path joins against the derived index assuming it is in sync with content as of the latest write.
- **Violating substrate:** A background re-indexer instead of write-path derivation. The substrate change does not error; it just makes the index lag content.
- **Silent failure:** New links render literally as `[[wiki-link]]` until the background pass catches up; users assume the link is malformed, not that the index is stale. Brilliant's design choice — re-derive on the write path — is the **explicit acknowledgment of the same defect class instance 3 names**, made by an external platform with no knowledge of FR's pattern. External-platform confirmation strengthens the structural claim: this is not an FR-specific framing.
- **Source:** `thejeremyhodge/xireactor-brilliant` write-path implementation, surfaced by Finn's deep-read 2026-05-05 ([`docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md`](../../../../docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md)). Same external project as instance 3, but at a different layer of the same defect class — instance 3 names the bug, instance 5 names the explicit design decision Brilliant made to avoid it. Issue #64.

### Instance 6: harness inbox-write vs runtime inbox-iteration — message-delivery-claim variant

- **Artifact:** A multi-agent message bus where `SendMessage` returns `{"success":true,"message":"Message sent to <recipient>'s inbox","routing":{...}}` on dispatch.
- **Implicit invariant:** Harness write-success implies receiver-side delivery + visibility. The success response on dispatch is treated as "the message will be visited by the recipient's runtime iteration in causal order."
- **Violating substrate:** Runtime inbox-iteration order ≠ disk-position order, OR read-state flagging by message-id is desynchronized from message-id assignment, OR (live-observed sub-shape) cross-worktree dispatch produces no on-disk presence at the receiver inbox at all. The harness reports success; the receiver's iteration either skips the entry (cursor advances past `read: false` to higher timestamps) or never sees the entry land. Sender thinks delivered; recipient never observes.
- **Silent failure:** No error at dispatch (harness returns success); no error at receiver (entry simply isn't iterated, or isn't on disk). Sender's downstream actions proceed assuming receipt; recipient's "standing by" proceeds assuming no inbound. The two endpoints accumulate divergent world-state silently. **Two sub-shapes observed in session 27:**
  - **Sub-shape A** (Aen 12:00 evidence chain on Monte's 10:50 query): write-success + on-disk-presence at entry [1] with `read: false` + receiver's read-cursor advanced past it to higher entries. Disk has the message; runtime iteration skipped it. **Receiver-side correction empirically required out-of-band relay** (Aen relayed Monte's content via conversation channel; receiver never iterated to the inbox file message naturally — file remained 312 lines unchanged across the entire session). The skip did NOT self-correct via eventual re-iteration. **The absence of receiver-side iteration-recovery across the session is informative as negative evidence** (Monte's diagnostic framing): non-determinism would have produced eventual catch-up; the absence of that signal rules out non-deterministic-iteration-with-eventual-recovery as the dominant mechanism. This is consistent with the deterministic mount-decomposition diagnosis (worktree-mirror ≠ parent-mount writes to a different filesystem object than the iteration reads, so no amount of re-iteration helps). **Negative-evidence-as-positive-data**: observing not-Y (no eventual catch-up) is a sharper diagnostic than observing X (the skip itself), because it discriminates between the candidate mechanisms.
  - **Sub-shape B** (Cal's 12:18 receiver-side inbox diagnostic on Monte's 11:08 + Brunel's 11:05): write-success on sender side, **no on-disk presence** at receiver inbox at all. Inbox file unchanged from S26 close.
- **Operational hypothesis (sharpened 2026-05-06 by Monte's structural insight):** the failure is **direction-asymmetric, not bidirectional cross-isolation**. Empirical evidence by direction:

  | Path | Status |
  |---|---|
  | worktree → no-worktree | **BROKEN** (Monte→Cal Sub-shape A; Monte→Cal + Brunel→Cal Sub-shape B) |
  | no-worktree → worktree | partial (team-lead→Brunel: JSON broken, conversation works) |
  | no-worktree → worktree (Cal→Monte) | works |
  | worktree ↔ worktree | works |

  **Worktree-OUTBOUND specifically is broken.** When a worktree session calls `SendMessage`, the harness writes to the worktree's `$HOME` mirror; the parent-process reads from the parent-mounted file. Different mounts of the same path. The success-response on dispatch reflects the worktree-mirror write; the parent-mounted file the recipient iterates is a different filesystem object that may or may not see the write depending on mount semantics.

  **This is `dual-team-dir-ambiguity` (Instance 1)-shaped — same root cause, different layer.** Instance 1 names path-ambiguity at the *bare-path-resolution* layer ($REPO vs $HOME — bare path resolves to two distinct dirs). Instance 6 names path-ambiguity at the *worktree-mount* layer (same fully-qualified path resolves to two distinct filesystem objects depending on which mount-point the caller sees). The shared root cause is **path-as-substrate-invariant** — the assumption that path-string-equals-path-resolution-equals-storage-object holds — broken at different layers of the substrate stack:

  - Instance 1: bare path → two dirs (path-ambiguity by missing root anchor). Fixed by Path Convention section anchoring bare paths.
  - Instance 6: same fully-qualified path → two filesystem objects (path-ambiguity by mount-decomposition). Fix is structural to the substrate — either harness-side mount-unification or explicit substrate-declaration in the worktree-spawn protocol.

  The same-root-cause-different-layer relationship is **structurally important for Protocol C promotion**: this is no longer just "n=6 instances of a defect class"; it's "the defect class manifests at multiple layers of a single substrate (filesystem)." That's the strongest possible case for promoting the defect-class as a common-prompt structural-discipline gate.
- **Source:** Monte's 11:04 dispatch report + Cal's 11:38 + 12:18 receiver-side inbox diagnostics + Aen's 12:00 + 12:18 evidence-chain relays. Source-agents: monte (sender-side) + callimachus (receiver-side) joint dual-witness. Filed via direct conversation-channel relay because the broken substrate prevented inbox-channel delivery — the relay path itself is meta-evidence for the entry's claim.
- **Distinct from prior 5 — but structurally related to Instance 1:** filesystem path-root (1), producer-consumer field-set (2), write-path/read-path coupling (3), disk-vs-runtime-state (4), external-platform write-path (5). Instance 6 is **harness-claim vs runtime-observation** at the message-bus layer — the harness's "I delivered" does not mean "the recipient's iteration will visit it." Layer-distinct from instance 4 (which is about CLI in-memory leadership state) because this is about **message-bus delivery semantics** rather than runtime ownership state. Both involve disk-vs-runtime gap, but at different layers: instance 4 governs leadership claims; instance 6 governs message visits. **Most importantly: Instance 6 shares its root-cause structure with Instance 1** (path-as-substrate-invariant broken by path-decomposition) at a different layer of the substrate stack — see Operational hypothesis above for the layer-distinct path-ambiguity framing.
- **Filed:** this entry, instance 6.

### Supplementary: `persist-project-state-leaks-per-user-memory` — wrong-substrate-mirror variant

Not one of the three core instances but a close sibling in the same family. `persist-project-state.sh` mirrors `~/.claude/projects/<slug>/memory/*` into the team repo. Correct under a container-scoped team-repo substrate (team and operator co-scoped); wrong under a multi-workstation shared-repo substrate (team-wide repo meets operator-wide auto-memory). Same defect family, same detection-latency profile, same "the code is right, the substrate is wrong" shape. Filed: [`wiki/gotchas/persist-project-state-leaks-per-user-memory.md`](../gotchas/persist-project-state-leaks-per-user-memory.md).

## What the Six Have in Common

The six primary instances span distinct substrate-layer pairs — filesystem roots, cross-document protocol field sets, write/read-path coupling, disk-vs-in-memory CLI state, external-platform write-path discipline, and harness-claim vs runtime-observation at the message-bus layer — but share a single defect signature:

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
5. **For dispatch/delivery artifacts** (added 2026-05-06 per Monte's instance 6 diagnostic): when a sender confirms dispatch but a recipient reports absence, did the recipient's read-loop advance forward past the message-position timestamp without visiting that message? Inspect the recipient's read-state flags sorted by timestamp; **a non-monotonic gap (`read: false` sandwiched between `read: true` entries with bracketing timestamps) is the failure signature.** This applies to any layered dispatch system where sender-confirmation and receiver-iteration are separate operations.

## Remediation Shape

Three complementary defenses, not a single fix:

- **Make the invariant explicit in the artifact.** `dual-team-dir-ambiguity` fixed by a leading Path Convention section that names the anchored root. `protocol-shapes-are-typed-contracts` fixed by cross-read between producer and consumer. The fix is to *hoist the implicit requirement into the artifact itself*, so future readers cannot guess wrong.
- **Detect the mismatch at the write site.** xireactor spec 0030 fixed the link-index by moving derivation from a background pass to the write path. `persist-project-state.sh` mitigation (c) uses `git check-ignore` at the target to detect the mismatch before writing. The fix is to *move detection to the point of action*, not to a downstream consumer.
- **Name the substrate in the artifact's frontmatter or preamble.** For artifacts that genuinely run on multiple substrates, declare which substrate this instance is for. (The `external-project` / `external-version` frontmatter in wiki #42/#43 is an instance of this discipline at the wiki-entry layer.)

One defense alone is usually insufficient. `dual-team-dir-ambiguity`'s Path Convention section works only because the `pwd` verification step at the write site backs it up. Defense-in-depth across the three layers is the shape that holds.

**For instance 6 (harness inbox-write vs runtime inbox-iteration), Monte's three-layer remediation sketch** (folded 2026-05-06 from Monte's Protocol A submission):

1. **Hoist invariant:** sender-side dispatch confirmation should not claim "delivered to recipient" — only "delivered to recipient's inbox-storage." The naming gap matters; the harness's `success: true` response wording should reflect what was actually verified.
2. **Detect at write site:** inbox storage layer should expose a "next-unread-message-with-earliest-timestamp" query (single-field, monotonic) to recipients, instead of letting recipients iterate on their own. This collapses the ordering-discipline question to a substrate-level guarantee rather than a per-recipient runtime concern.
3. **Declare substrate:** SendMessage tool documentation should explicitly state that "success" means storage-write, not iteration-visit. Recipients are responsible for ordering discipline; senders cannot guarantee it from their side.

Each remediation maps to one of the three general-shape defenses (hoist invariant; detect at write site; declare substrate). The instance-6-specific applications make the general-shape rules concrete for message-bus design.

## Anti-Patterns

- **"It works on my substrate, so it's correct."** The substrate that matches the author's mental model always works. The test is the other substrate.
- **"We only have one substrate today, so this can't happen."** Substrate migrations are routine — a new container type, a new repo-sharing pattern, a consumer in a different team, a substrate change during a framework evolution. Today's single substrate is tomorrow's old substrate.
- **"The artifact passed review."** Static review of a substrate-invariant mismatch passes because the artifact is self-consistent. The bug is in the artifact-substrate *correspondence*, not the artifact. Review against a specific substrate; generic review misses the shape.
- **"The substrate is obvious from context."** If the substrate is obvious, it is an implicit invariant — and an implicit invariant is exactly the failure mode this pattern names. Obvious-in-author's-head is not the same as declared-in-artifact.

## Related

- [`dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — primary instance #1 (path-ambiguity variant).
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — primary instance #2 (field-set-divergence variant).
- [`teamcreate-in-memory-leadership-survives-clear.md`](../gotchas/teamcreate-in-memory-leadership-survives-clear.md) — primary instance #4 (disk-vs-in-memory-state variant). The runtime-state half of the substrate-invariant family — disk cleanup does not imply in-memory release.
- [`persist-project-state-leaks-per-user-memory.md`](../gotchas/persist-project-state-leaks-per-user-memory.md) — sibling instance (wrong-substrate-mirror variant).
- [`integration-not-relay.md`](integration-not-relay.md) — the *cross-role-handoff* analog of this defect class. Specialist positions are time-indexed state; citing a T1 snapshot as current at T3 is a substrate-invariant mismatch applied to time-as-substrate.
- [`within-document-rename-grep-discipline.md`](within-document-rename-grep-discipline.md) — the within-document analog at a different scale.
- [`pass1-pass2-rename-separation.md`](pass1-pass2-rename-separation.md) — the cross-document analog where "substrate" is the set of consumers that still reference the old name.
- [`../../../../docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md`](../../../../docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md) — source of instance #5 (external-platform write-path-sync confirmation). Not a wiki entry; the C-phase discovery brief documents the Brilliant design decision Finn surfaced.

## Why This Entry Exists

At n=1 (dual-team-dir-ambiguity, 2026-04-13), the defect was a single gotcha with no general name. At n=2 (plus `persist-project-state-leaks-per-user-memory`, 2026-04-14), the Librarian flagged the shape but held back from formal pattern promotion per n=2-is-a-pattern-candidate-not-a-pattern discipline. At n=3 (xireactor link-index instance via Finn's digest, 2026-04-15), the three data points spanned distinct substrate-layer pairs — filesystem, cross-document protocol, write/read-path coupling — confirming the defect class is structural, not domain-specific.

**2026-05-05 amendment to n=5.** Two additional instances landed: (4) the `teamcreate-in-memory-leadership-survives-clear` gotcha extends the defect class to the disk-vs-in-memory-CLI-state pair (filesystem cleanup does not imply runtime-state release), filed session 24 with n=2 cross-team confirmation; (5) Brilliant's deliberate write-path re-derivation of `entry_links` is **external-platform confirmation** of the same defect class instance 3 names — an unrelated team's design choice independently identified the bug and chose the same fix shape (derive on the write path). External-platform confirmation is structurally stronger than additional within-team sightings; it shows the defect class is recognized outside our framing and the remediation shape (write-path detection) generalizes.

**2026-05-06 amendment to n=6.** Live-operational instance landed during session 27 Phase B work: harness inbox-write vs runtime inbox-iteration desynchronization with two observed sub-shapes (read-cursor-skip on present-on-disk message; on-disk-absence after harness reports dispatch success). Source-agents extended with monte (sender-side dual-witness on first sub-shape, observed via inbox snapshot); callimachus and team-lead independently verified receiver-side. The instance was filed via direct conversation-channel relay because the broken substrate prevented inbox-channel delivery — the relay path itself is meta-evidence for the entry's claim. **Operational hypothesis sharpened by Monte's structural insight: worktree-OUTBOUND specifically is broken (direction-asymmetric, not bidirectional cross-isolation), and the failure is `dual-team-dir-ambiguity`-shaped at a different layer of the same filesystem-substrate stack.** Same root cause (path-as-substrate-invariant), different layers (Instance 1: bare-path-resolution; Instance 6: worktree-mount-decomposition). **Promotion to common-prompt at n=6 is now strongly indicated** — not just by instance count, but by the same-root-cause-different-layer relationship between Instances 1 and 6, which converts "n=6 unrelated instances" into "the defect class manifests at multiple layers of a single substrate." Protocol C draft remains deferred per team-lead direction; the n=6-with-multi-layer-relationship signal is recorded for next session's Protocol C cycle.

This entry names the class so future submissions can file against it by reference, and so future artifacts can be screened against the diagnostic questions before shipping.

(*FR:Callimachus*)
