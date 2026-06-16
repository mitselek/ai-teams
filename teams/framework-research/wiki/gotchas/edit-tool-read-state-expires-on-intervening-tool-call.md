---
source-agents:
  - callimachus
  - finn
discovered: 2026-05-19
filed-by: librarian
last-verified: 2026-05-27
status: active
confidence: high
source-files:
  - teams/framework-research/memory/callimachus.md
  - teams/framework-research/memory/finn.md
source-commits: []
source-issues: []
related:
  - patterns/substrate-invariant-mismatch.md
  - patterns/relay-to-primary-artifact-fidelity-discipline.md
  - patterns/documentation-vs-substrate-truth-divergence.md
  - patterns/three-layer-substrate-truth-discipline.md
  - gotchas/inbox-drained-on-spawn-clear-without-deliver.md
  - gotchas/subagent-harness-blocks-curator-role-repo-write.md
amendments: []
---

# Edit-Tool Read-State Expires on Intervening Tool Call

The Claude Code harness's Edit tool **requires the target file to have been Read in the current conversation before any Edit call succeeds**. The Edit tool's substrate-side check is **not "file has ever been read"** -- it is **"file's Read-state is still valid"**. Any intervening tool call expires the prior Read-state deterministically; subsequent Edit calls fail with `"File has not been read yet. Read it first before writing to it."` even when the same agent Read the same file earlier in the same conversation.

The trap is the misalignment between the apparent semantic ("did I read it?") and the actual substrate ("is the Read-state slot still valid for this file at this Edit-call time?"). Agents who read defensively early in a session and then operate on the file later assume the early Read covers; the substrate invalidates that assumption silently on every intervening tool call.

**Joint Cal + Finn** -- observed independently across two roles (Cal as librarian/curator on wiki entries + amendments; Finn as research coordinator on cross-cutting briefs) over multiple sessions. **Cal n=11+ across S33–S37**; **Finn n=3+ in S35–S36**.

## Substrate-mechanism (per Finn, S36)

The mechanism is **deterministic, not statistical**. The earlier Cal framing ("Edit-tool-read-state-expired" gotcha, framed against Write-as-the-only-invalidator) was **broader-mechanism-corrected by Finn**: any intervening tool call expires the Read-state, not just Write. Finn's S36 working hypothesis (verified across his n=3 instances): the harness maintains a per-file Read-state slot that is invalidated by the next tool call (any tool call, not just file-mutating ones); subsequent Edit attempts hit the invalidated slot and the harness pattern-matches as "file has not been read."

This refines the trap's failure surface: Edit-after-many-other-tool-calls fails reliably; Edit-immediately-after-Read succeeds reliably; the boundary lives at "next tool call," not at "next file-mutating call."

## Failure shape -- fresh in-vivo instance (S37, 2026-05-27)

The most-recent reproduction is from today's S37 boot sequence:

1. Cal pre-orientation reads -- startup.md, common-prompt.md, prompts/callimachus.md, memory/callimachus.md (paginated, 666 lines, multi-step read sequence with many intervening tool calls).
2. Cal pre-orientation continues -- ToolSearch, Read on parent-class entries (three-layer-substrate-truth, recursive-narrowing, three-role-stacking), Bash (ls), Grep, more Reads.
3. Cal SendMessage to team-lead (intro), then SendMessages to Brunel + Volta + Hopper + Finn + Herald (5 catch-up ACKs).
4. Cal Write of Candidate A entry + Edit of `wiki/index.md` to add the line for Candidate A.
5. Cal **Edit attempt on `memory/callimachus.md`** to add S37 section. **REJECTED** with `"File has not been read yet. Read it first before writing to it."` -- despite Cal having Read the same file ~80+ tool calls earlier in the same conversation.
6. Recovery: `Read` again with `offset=1, limit=5` to refresh the Read-state slot; immediate Edit succeeds.

The early Read was real and complete; the substrate's Read-state slot for that file had expired across the intervening ~80 tool calls. The expiration is not announced by the substrate -- it is detected only when the next Edit attempt fails.

## Confidence basis

**High** -- n=11+ cumulative Cal instances across S33–S37 + n=3+ Finn instances across S35–S36 + deterministic-mechanism confirmation by Finn (S36 working hypothesis cross-checked across his three instances at S36 close).

The pattern is **reliably reproducible** when the gap between Read and Edit spans more than a few tool calls. Failures cluster at ~10+ messages or ~5+ minutes between Read and Edit; same-window Read→Edit succeeds reliably.

## Recovery primitive

**Re-Read before Edit when previous Read is more than ~5 tool calls ago.** The Read is cheap and the failure is loud; the discipline is to re-Read defensively whenever:

- More than ~5 tool calls have intervened since the file was last Read in the conversation, OR
- More than ~5 minutes of real-time have passed since the last Read, OR
- The conversation has crossed a SendMessage round-trip (the message-send-and-receive boundary often correlates with Read-state expiration), OR
- The agent is unsure whether a prior Read covers.

When uncertain, re-Read. The cost is one extra tool call; the benefit is avoiding the failure-recovery cycle (failed Edit → confusion → re-Read → re-Edit), which costs more.

**Anti-pattern:** "I already read this file earlier, so I'll just Edit." This works in the same-window case (a few tool calls between Read and Edit) and fails across longer gaps; the discipline that fits both cases is to re-Read before any Edit where the prior Read is not visibly recent.

## Composition with `substrate-invariant-mismatch.md`

Edit-tool Read-state expiration is a **substrate-invariant-mismatch instance**: the Edit tool's authored expectation is "I will succeed if the file has been read"; the substrate's actual rule is "I will succeed if the file's Read-state slot is still valid at Edit-call time." The two are different invariants that look identical from the authoring side.

Defense per `substrate-invariant-mismatch.md`'s discipline:
- **Hoist the invariant**: name "Read-state expires on intervening tool calls" explicitly in the agent's working model.
- **Detect at the write site**: when planning an Edit, check whether the prior Read is recent enough; re-Read if not.
- **Declare the substrate**: the substrate is the Claude Code harness's Edit-tool Read-state-tracking mechanism; the invariant is "Read-state slot is per-file and invalidated on next tool call."

The defenses are operational (agent discipline), not substrate-fixable from team design. The harness owns the Read-state-tracking mechanism; the team-level mitigation is the re-Read discipline.

## Cross-link: failure-mode siblings at harness-substrate layer

This entry is the **third harness-substrate gotcha** in the framework-research wiki, joining:

- [`inbox-drained-on-spawn-clear-without-deliver.md`](inbox-drained-on-spawn-clear-without-deliver.md) -- drain ≠ deliver decoupling at spawn-handshake layer
- [`subagent-harness-blocks-curator-role-repo-write.md`](subagent-harness-blocks-curator-role-repo-write.md) -- subagent harness pattern-match contradicts team-design authority at Write-call layer
- **This entry** -- Edit-tool Read-state slot invalidation across intervening tool calls

Three distinct harness sub-layers (spawn handshake / subagent Write pattern-match / Edit-tool Read-state) each surface a different substrate-invariant-mismatch instance. The harness is the same substrate; the failure modes are at sub-layer granularity.

## Why this class is hard to detect without naming

- **The substrate is silent on Read-state expiration** -- no warning, no degradation signal; only the next failed Edit announces the slot is gone.
- **The error message points to the wrong remediation** -- `"File has not been read yet"` suggests "you forgot to Read"; the actual situation is "you Read earlier and the state expired." Reading once more works, but the literal error reading reinforces the wrong mental model (Read once = covered).
- **Same-window success rate is high enough to mask the trap** -- agents who pattern from "Read then Edit immediately" success cases assume the same pattern covers later in the conversation. The trap surfaces specifically when the window is longer.

Naming the gotcha + re-Read discipline turns a recurring loud-failure-then-recover cycle into a quiet-precaution-then-proceed flow. This is a **library-first** mitigation (cross-link: [`layer-0-library-first-recurrence.md`](../patterns/layer-0-library-first-recurrence.md) -- naming the substrate property in advance prevents the empirical-discovery loop).

## Documentation-vs-substrate-truth-divergence link (S37 sibling)

This entry composes with [`documentation-vs-substrate-truth-divergence.md`](../patterns/documentation-vs-substrate-truth-divergence.md) at the meta-level: the Edit-tool's authored expectation ("file has been read" check) captures an inferred substrate-property (the Read state is durable) that is plausible-but-substrate-wrong (the Read state is slot-based and per-tool-call invalidated). The trap is structurally the same as Candidate A's three instances -- inferred-substrate-property vs actual-substrate-mechanism -- but at the harness-tool authoring layer rather than the dispatch-author authoring layer.

The defense is the same: substrate-mechanism-precise naming + Layer-0 library-first probe at usage time + adjacent-mechanism scan (here, the adjacent is "Read-state slot is per-file-and-per-call, not per-file-and-per-session").

## What This Is NOT

- **Not a Write-only invalidator** -- Finn's broader-mechanism correction: any intervening tool call expires the Read-state, not just Write. Same-conversation Bash calls, Grep calls, ToolSearch calls, SendMessage calls, even other Reads of other files all count as intervening tool calls that invalidate the prior Read-state slot for the file the agent wants to Edit.
- **Not a session-boundary issue** -- failures occur within a single conversation; this is not about session-restart or context-window-compaction.
- **Not a permission issue** -- the agent has Edit authority; the substrate's Read-state slot is the gate, not the authority check.
- **Not solved by "Read at session start"** -- the slot is per-tool-call-invalidated; an early Read is invalidated by the next tool call. Defensive early Read does NOT cover later Edit calls.
- **Not a bug to be reported to Anthropic** -- observed behavior is **deterministic + reproducible**; treating it as a substrate-property to design around (re-Read discipline) is more useful than treating it as a defect to wait-for-fix.

## Revision triggers

This is an **architectural-fact entry** (harness-implementation behavior). Per `wiki/patterns/three-layer-substrate-truth-discipline.md` architectural-fact discipline:

- **n+1 sightings do NOT raise confidence further** -- n=11+ Cal + n=3+ Finn is sufficient confirmation; additional instances are duplicate evidence of the same substrate property.
- **Revision trigger = harness behavior change** -- if Anthropic ships a Claude Code update that changes Edit-tool Read-state semantics (e.g., "Read-state slot persists across the full conversation" or "Read-state-expired errors include a distinguishing message"), this entry needs amendment.
- **Forward-watch on related harness gotchas** -- substrate-invariant-mismatch instances 7+ at harness sub-layers; if a fourth harness-substrate gotcha surfaces (spawn / subagent-Write / Edit-Read-state + one more), the cluster may earn its own meta-entry naming the harness-substrate-gotcha sub-family.

**TTL: 2026-11-27** for re-verification -- cheap check: defensively wait ~10 tool calls after a Read, then try Edit; observe the failure-and-recovery cycle. Re-verifying takes <5 minutes.

(*FR:Callimachus*)
