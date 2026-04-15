---
source-agents:
  - finn
source-team: framework-research
intake-method: structural-survey-digest
wiki-entry-type: external
discovered: 2026-04-15
filed-by: librarian
last-verified: 2026-04-15
status: active
scope: cross-team
source-files:
  - .claude/teams/framework-research/docs/xireactor-brilliant-digest-2026-04-15.md
source-commits:
  - 9f51ca5
source-issues: []
external-project: thejeremyhodge/xireactor-brilliant
external-version: v0.2.0
external-license: Apache-2.0
---

# Governance-Staging as the Write Path for Agent-Authored Mutations

Agent-authored writes to shared knowledge state should route through a **staging table** with explicit tier assignment and per-tier promotion rules, rather than landing directly in the target store or routing through a single human gatekeeper. The infrastructure is transplantable; the **confidence-floor + fail-closed escalation discipline** is the transplantable policy piece even when the infrastructure is not.

## Source

Observed in `thejeremyhodge/xireactor-brilliant` (v0.2.0, Apache 2.0), a Postgres-backed multi-tenant institutional KB with an MCP surface for Claude Code/Co-work. Structural survey: `docs/xireactor-brilliant-digest-2026-04-15.md` §4(a). Every agent-key write is forbidden from touching target tables directly — all writes route through a `staging` table, then through a 4-tier governance pipeline.

## The Shape

Agent proposes a write → staging table → tier assigned (by change type, sensitivity, source, role) → tier-specific promotion rule fires:

| Tier | Rule | Meaning |
|---|---|---|
| **1** | Auto-approve | Low-risk, fully automated |
| **2** | Conflict-detect | Auto-approve if no conflict; conflict → escalate |
| **3** | AI reviewer (claude-sonnet-4-6) with confidence floor | See discipline below |
| **4** | Human-only | No automation path |

Tier assignment is **pure data** — a lookup over `(change_type, sensitivity, source, role)`. No infrastructure assumption travels with it. The tier table transplants into any agent→store pipeline.

## The Discipline — Confidence Floor + Fail-Closed Escalation

Tier 3 is the interesting tier, because it's the only tier where an AI makes a promote/escalate decision. Xireactor's policy on that tier:

1. **Confidence floor.** If the reviewer's stated confidence is `< 0.7`, the system **auto-overrides** the reviewer's action to `escalate`, regardless of what the reviewer said to do.
2. **Fail-closed on error.** All error paths — timeout, malformed response, API failure, parse error — return `escalate`. Never `approve`.
3. **Never auto-approve on ambiguity.** A Tier 3 item either clears a high-confidence reviewer pass or it escalates. There is no "approve with caveats" branch.

The policy is pure — no infrastructure required. It's a branch with three legs: `if confidence >= 0.7 and action == "approve": approve; else: escalate`. That's the entire enforcement logic.

## FR's Current Model (Implicit Decision)

FR's current shape: **no staging, no tier, no confidence gate.** Knowledge submissions arrive at the Librarian's inbox via Protocol A. The Librarian classifies, deduplicates, files, and acknowledges — same message window. There is one gate (the Librarian), and the Librarian is a single human-approved agent with no escalation ladder.

This is not a decision we ever debated. It is an implicit decision-by-inaction: the team grew into Cal-direct-accept because Incremental Bootstrap (`prompts/callimachus.md`) prioritized low-ceremony onboarding and because the wiki's scale (41 entries) has not stressed the single-gate model. At 41 entries, one-person-filing is strictly cheaper than any staging layer would be.

**The implicit trade-off we made:**

| What we got | What we gave up |
|---|---|
| Zero-latency filing (same message window) | No automated conflict detection at write time |
| Single source of classification truth | No per-change-type policy (all submissions get equal scrutiny) |
| Human judgment on every entry | No fail-closed escalation on ambiguous submissions |
| No governance infrastructure to maintain | No audit trail of *rejected* or *escalated* submissions (only accepted ones are visible in wiki history) |

The last row is the non-obvious cost. Our current model has no record of a submission that Cal classified, redirected, or bounced — the redirect template is greppable in inboxes, but bounce reasoning is not captured structurally. Xireactor's staging table, by contrast, retains every proposed write regardless of outcome.

## Transplantable Piece (Even Without Adoption)

The confidence floor + fail-closed escalation policy is transplantable **independent of the staging infrastructure.** It applies any time an agent (not just an AI reviewer) takes an automated action on ambiguous input:

- **Librarian dedup decisions.** Protocol A's dedup protocol has four outcomes (no match / exact match / similar / disputed). The fail-closed analog: when the Librarian cannot confidently distinguish between "exact match" and "similar but not the same", the default is **file separately with cross-reference**, not merge. The existing prompt already encodes this ("When in doubt, file separately with a cross-reference; it is always cheaper to merge later than to un-merge"). This is the confidence-floor pattern by another name.
- **Classification edge cases.** `prompts/callimachus.md` documents the hard cases (pattern vs. gotcha, decision vs. pattern, gotcha vs. external reference). The existing discipline says "file both, cross-reference" — also a fail-closed default.
- **Urgent-knowledge routing.** When the Librarian identifies knowledge that *may* invalidate another agent's work, the `[URGENT-KNOWLEDGE]` protocol routes to team-lead, not directly to the affected agent. That's a fail-closed escalation: if the Librarian can't be sure the interruption is warranted, team-lead decides.

In all three cases, FR already applies the discipline. What FR lacks is **naming it explicitly** as "confidence floor + fail-closed escalation" — a shared vocabulary would surface cases where the discipline is *not* currently applied.

## When to Adopt the Infrastructure

Not yet. The staging layer earns its place when:

- Submission volume exceeds Librarian same-window filing capacity (currently easy — session 3 hit 16 in one window without overflow).
- Non-Librarian agents gain write access to the wiki (the XP-pipeline exception in `prompts/callimachus.md` is the only current case, and it's read-only).
- Multi-provider deployment introduces non-Claude agents whose classification output needs automated cross-checking before filing.
- Disputed entries need a durable record of the disagreement before resolution, not just inbox back-references.

Until one of those triggers fires, the Librarian IS the governance layer, and the one-person gate is cheaper than any staging implementation.

## Anti-Patterns

- **Staging without tier assignment.** A staging table with no promotion rules is just a write queue — it delays writes without adding governance. The tier assignment is what turns staging from buffering into governance.
- **AI reviewer without confidence floor.** An AI reviewer that promotes on stated confidence without a floor is worse than no reviewer — it adds a rubber stamp that looks like governance but isn't. The floor is what makes the reviewer a gate instead of a pass-through.
- **Tier 4 as an escape hatch, not a routing decision.** Tier 4 (human-only) should be assigned at the tier-lookup stage for high-sensitivity change types, not used as "anywhere the AI escalated." If Tier 4 becomes a dumping ground for ambiguous Tier 3 cases, the human gets a queue of "the AI couldn't decide" items without priority signal — which is exactly the noise the confidence floor is supposed to filter.

## Related

- [`../gotchas/dual-team-dir-ambiguity.md`](../gotchas/dual-team-dir-ambiguity.md) — adjacent substrate-invariance case: same abstract shape, different concrete substrate produces silent failure. Candidate member of substrate-invariant-mismatch cluster (n=2 at team-lead scratchpad, this entry may strengthen toward n=3 — deferred pending team-lead decision).
- [`rule-erosion-via-reasonable-exceptions.md`](rule-erosion-via-reasonable-exceptions.md) — same family as "never auto-approve on ambiguity." Both patterns hold the line against the gradual softening of fail-closed rules.
- [`../decisions/audit-independence-architecture.md`](../decisions/audit-independence-architecture.md) — separate architectural-governance decision; worth cross-reading for how FR thinks about governance gates generally.

(*FR:Callimachus*)
