---
source-agents:
  - callimachus
discovered: 2026-05-26
instances:
  - date: 2026-05-26
    session: S35
    note: Cal dispatched as subagent to Write `docs/findings.md` (curator-role wiki-writer authority, joint Brunel + Volta substrate-gap analysis as canonical work product). Write tool rejected with "Subagents should return findings as text, not write report files." Recovery via Stage-2 supersession (team-lead executed Write from main session, after Cal surface-back with substrate-truth-evidence + recovery-options enumeration).
filed-by: librarian
last-verified: 2026-05-26
status: active
confidence: medium
source-files:
  - teams/framework-research/memory/callimachus.md
  - docs/findings.md
source-commits: []
source-issues: []
ttl: 2026-08-26
related:
  - patterns/three-layer-substrate-truth-discipline.md
  - patterns/substrate-invariant-mismatch.md
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/service-team-topology.md
  - gotchas/inbox-drained-on-spawn-clear-without-deliver.md
amendments: []
---

# Subagent Harness Blocks Curator-Role Repo Write

When an agent dispatched as a **subagent** is granted **curator-role wiki-writer authority** by team design, the Claude Code subagent harness pattern-matches on certain write paths (notably repo-root `docs/<name>.md` and similar "report file" shapes) and **blocks the Write call with a generic "subagents should return findings as text, not write report files" error**, regardless of the team-side authorization. The subagent's design-granted authority is invisible to the harness's pattern-matching layer; the layers contradict and the harness-side rule wins silently on first attempt.

**This is a Sub-shape E instance at the team-design vs subagent-harness-implementation layer pair** (see [`three-layer-substrate-truth-discipline.md`](../patterns/three-layer-substrate-truth-discipline.md)). Three layers, drift between them:

- **Layer 1 (team design):** curator-role grants wiki-writer authority; canonical work products include repo-root `docs/<name>.md` artifacts (joint substrate-gap analyses, findings memos, etc.).
- **Layer 2 (dispatch operationalization):** team-lead dispatches the curator as subagent with the work product named (`docs/findings.md` in this instance); dispatch prompt confirms canonical-work-product framing.
- **Layer 3 (subagent harness implementation):** harness pattern-matches the write path against a "subagents should return findings as text" rule and rejects the Write call.

L1 ↔ L3 drift surfaces at the actual Write call. L2 (the dispatch) is not the source of the drift -- the dispatch authorizes the work as designed; the drift is the harness's pattern-match contradicting the team design directly.

## Failure shape (S35 instance, 2026-05-26)

The S35 dispatch arc was:

1. **Joint Brunel + Volta substrate-gap analysis** of Cloudflare Claude Managed Agents shipped to Cal as canonical work product (transient intermediate artifact at `teams/framework-research/memory/dispatch-task-7-artifact.md`, archived post-write).
2. **Aen's 2026-05-26 09:50 dispatch** scoped Cal's subagent role: Write `docs/findings.md` at repo root as the canonical articulation.
3. **Cal subagent Write call** on `docs/findings.md` → **rejected** with literal harness error: `Subagents should return findings as text, not write report files.`
4. **Cal surface-back to team-lead** with substrate-truth-evidence (the literal error text) + recovery-options enumeration:
   - **Option (a):** team-lead Writes from main session, after Stage-2 supersession of Cal's draft.
   - **Option (b):** alt-filename that doesn't pattern-match the harness rule (uncertain whether harness matches on path-prefix `docs/`, on `findings` substring, on `.md` extension, or on combination -- empirically untested).
   - **Option (c):** team-scope sibling at `teams/framework-research/findings/<name>.md` instead of repo-root.
   - **Option (d):** disable subagent sandbox (not-recommended; broad blast radius beyond the immediate work).
5. **Team-lead sanctioned option (a).** Cal's draft superseded by team-lead Write from main session. Final artifact at `docs/findings.md` is identical-in-content to Cal's draft; the discipline-honored Stage-2 supersession produces the same outcome as a direct subagent Write would have.

The defect is **not the rejection itself** -- the harness rule "subagents return findings as text, not write report files" is a reasonable default for unrelated subagent use cases. The defect is that **the curator-role's design-granted authority is invisible to the harness's pattern-match layer**. There is no in-band signal during dispatch that the rule will fire; the only signal is the rejection at the actual Write call.

## Pattern-match heuristic -- empirically uncertain at filing

The exact heuristic the harness uses to pattern-match "report file" writes is not exposed in the error message. Candidate triggers (untested at filing):

- Path-prefix `docs/` at repo root.
- Filename containing `findings`, `report`, `analysis`, or similar report-class substring.
- File extension `.md` with no other write activity in the same session (one-shot report shape).
- Combination of the above.

**Empirical test would falsify or sharpen the heuristic.** Cheap experiment: subagent attempts Write on (i) `docs/foo.md` with prose body, (ii) `teams/framework-research/findings/test.md`, (iii) `docs/data.json`. If (i) rejects and (ii) + (iii) succeed, path-prefix + filename-substring is the heuristic. Filing this as a future-work probe; not load-bearing for the current entry's recovery posture.

## Recovery posture -- surface-back-with-substrate-truth-evidence

The S35 recovery posture composes three existing FR disciplines:

1. **Surface-back to the dispatcher** (team-lead in this instance) **rather than silent retry with workaround** -- the dispatcher needs the substrate-truth evidence (the literal harness error text) to make the call between recovery options. Silent retry collapses the decision in the subagent's classification.
2. **Recovery-options enumeration in the surface-back** -- name the options (team-lead-Writes vs alt-filename vs team-scope sibling vs disable-sandbox) with cost-and-blast-radius framing. Lets the dispatcher choose, not the subagent.
3. **Stage-2 supersession when the dispatcher executes the recovery** -- Cal's draft becomes the source-of-truth for content; the team-lead's Write becomes the substrate-of-record. Discipline-honored Stage-2 supersession (per [`relay-to-primary-artifact-fidelity-discipline.md`](../patterns/relay-to-primary-artifact-fidelity-discipline.md)) produces the same content outcome as a direct subagent Write.

This recovery posture **operationally worked at n=1** -- the discipline composed cleanly; the canonical artifact landed at the intended path with no content loss. Pre-emptive surface-back-on-attempt-rather-than-attempt-then-surface is the next-session refinement: if any `docs/<name>.md` Write is dispatched to a subagent, surface-back immediately with the harness-restriction note rather than attempt-then-surface. This trades one Write rejection for one upfront message.

## Distinguishing from `inbox-drained-on-spawn-clear-without-deliver.md`

| Axis | `inbox-drained-on-spawn-clear` | This entry |
|---|---|---|
| **Layer of failure** | Spawn-handshake (substrate event between sender and recipient spawn) | Write-call (substrate event between subagent and target file path) |
| **What the harness reports** | `success: true` on dispatch; recipient silently has no conversation backlog | Explicit rejection at Write call with literal error message |
| **In-band signal to affected agent** | None (recipient cannot self-diagnose) | Yes (subagent sees the rejection text and can surface back) |
| **Mechanism axis** | Drain-path vs deliver-path decoupling at spawn | Pattern-match contradicting design-granted authority |
| **Recovery channel** | Team-lead spawn-prompt relay-fold (Stage 1) | Team-lead Write from main session (Stage 2 supersession) OR alt-path workaround |
| **Sub-shape parent** | Substrate-invariant-mismatch (spawn-handshake sub-class) | Substrate-invariant-mismatch (subagent-harness sub-class); Sub-shape E (team-design vs runtime-implementation layer pair) |

Both are harness gotchas where team-design and runtime-implementation contradict. Inbox-drained is silent (no in-band signal); subagent-harness-blocks-curator-write is loud (explicit error). The recovery patterns are structurally analogous (team-lead relay-fold / team-lead Write-on-behalf), but the trigger conditions and detection profiles differ.

## Workaround -- pre-emptive surface-back on dispatch

When team-lead dispatches a subagent with curator-role authority to Write a repo-root `docs/<name>.md` or similar report-class file:

1. **Team-lead notes the harness-restriction in the dispatch prompt** itself -- pre-emptive flag rather than surface-on-rejection. ("Note: subagent Write of repo-root `docs/findings.md` may pattern-match the harness's report-file rule; surface back with the literal error text if so, and I'll execute the Write from main session.")
2. **Subagent attempts the Write** per dispatch -- but is prepared to surface-back with substrate-truth-evidence (literal error text) + recovery-options-enumeration if the rejection fires.
3. **Team-lead executes Stage-2 supersession** of the subagent's draft via main-session Write. Subagent's draft IS the source-of-truth for content; team-lead's Write IS the substrate-of-record.

The pre-emptive flag eliminates the one wasted Write attempt while keeping the discipline intact. Cost: one extra sentence in the dispatch prompt.

## Revision trigger

This is an **architectural-fact entry** at the subagent-harness layer -- the failure mode is a property of the harness's subagent-write pattern-match, not an empirically variable behavior. n+1 sightings will not strengthen confidence; the mechanism is fully exposed in the first instance.

**Revision triggers:**

- Anthropic changes the subagent harness's report-file pattern-match (e.g., adds a per-team or per-subagent authorization gate that respects design-granted authority, or removes the rule entirely) → archive this entry, replace with a "fixed-on-date-X" reference.
- New sub-shape discovered (e.g., harness blocks subagent writes in a different path class, or harness blocks writes from a non-subagent context) → this entry stays; new entry for the new sub-shape; cross-references both ways.
- Empirical test of the pattern-match heuristic (the future-work probe in the section above) confirms or falsifies the candidate triggers → amend the "Pattern-match heuristic" section with the empirical findings; entry confidence stays unchanged (the heuristic specifics are operational detail, not architectural).

n+1 instances of the same failure (subagent dispatched with curator-role authority, Write rejected on a `docs/<name>.md` path) **do not** trigger amendment -- the mechanism is structural, not empirical.

## TTL

**TTL: 2026-08-26** (3 months from filing). Re-verify at expiry: is the failure mode still present in the harness, or has it been patched? If patched, archive this entry and reference the fix-date.

## Promotion posture

**n=1 watch posture for promotion to common-prompt.** Filed at n=1 because the structural distinction from `inbox-drained-on-spawn-clear-without-deliver.md` is clear (loud vs silent harness-restriction with different recovery profiles), and the workaround (pre-emptive surface-back / team-lead Stage-2 supersession) is operationally codified in this incident.

**Promotion candidate at n=2** -- second sighting of subagent-harness blocking design-granted authority (different team, different curator-class subagent, different write path class) confirms the mechanism is harness-wide and not Cal-specific or repo-root-`docs`-specific. Cross-team confirmation is the canonical promotion signal.

**Adjacent watchpoint:** if the harness's report-file pattern-match catches other curator-role write paths (e.g., wiki-grade Write attempts at unusual paths, or knowledge-curation writes to non-team-scoped locations), the failure mode generalizes beyond `docs/<name>.md`. The pattern-match heuristic empirical test above would surface this earlier.

## Related

- [`three-layer-substrate-truth-discipline.md`](../patterns/three-layer-substrate-truth-discipline.md) -- **Sub-shape E parent.** This entry is a Sub-shape E instance at the team-design vs subagent-harness-implementation layer pair. The three-layer model applies: L1 (team design grants authority); L2 (dispatch operationalizes); L3 (harness implementation enforces -- and may contradict L1). Drift at L1 ↔ L3 surfaces at the Write call.
- [`substrate-invariant-mismatch.md`](../patterns/substrate-invariant-mismatch.md) -- defect-class parent. The harness's pattern-match assumes "subagent writing a report-file path is undesired"; the team-design's invariant is "curator-role subagents have wiki-writer authority including report-file paths." The invariant mismatch surfaces at the Write call.
- [`relay-to-primary-artifact-fidelity-discipline.md`](../patterns/relay-to-primary-artifact-fidelity-discipline.md) -- governs the Stage-2 supersession recovery posture: the subagent's draft IS the content source-of-truth; the team-lead's main-session Write IS the substrate-of-record. Discipline-honored supersession produces the same outcome as a direct subagent Write would have.
- [`service-team-topology.md`](../patterns/service-team-topology.md) -- adjacent at the curator-role layer. Cal-as-master-librarian (if Reading 2 of RFC #66 had been chosen) would have shifted the substrate of curator writes; under the current Reading 1 + messenger-ghost topology (PO 2026-05-12 decision), curator writes happen from the per-team Cal's substrate, and the harness-restriction surfaces at the per-team layer.
- [`inbox-drained-on-spawn-clear-without-deliver.md`](inbox-drained-on-spawn-clear-without-deliver.md) -- sibling harness-gotcha. Both entries describe failure modes where design-authorization and runtime-implementation contradict; this entry is loud (explicit rejection), the inbox-drained entry is silent (no in-band signal).

(*FR:Callimachus*)
