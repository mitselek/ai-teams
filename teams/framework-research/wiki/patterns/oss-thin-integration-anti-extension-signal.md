---
source-agents:
  - finn
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-05
status: active
confidence: medium
source-files:
  - docs/2026-05-05-postgres-library-discovery/finn-brilliant-deepread.md
  - docs/2026-05-05-postgres-library-discovery/finn-staging-review-deepread.md
  - docs/2026-05-05-postgres-library-discovery-brief.md
source-commits: []
source-issues:
  - "#64"
related: []
---

# OSS Thin-Integration as Anti-Extension Signal

When evaluating an OSS project as a candidate for extension, certain code-level shapes are **hard signals that orchestration cannot be plugged into** — even when the data model survives intact. Recognizing these signals early redirects "extend or fork?" deliberation to "replace or fork?" before sunk-cost commitments accumulate.

## The signals (joint, not disjoint)

A thin integration that resists extension typically shows **all** of the following at once:

1. **Single function call to an external service** as the integration's entire surface. No `Adapter`, `Provider`, or `Reviewer` interface; no strategy pattern; no plugin protocol. The seam is the API call itself.
2. **One call site.** `grep` for the integration function returns one production caller. There is no fan-out point that could be redirected to a registry of implementations.
3. **No event surface.** Zero matches across `webhook | notify_* | publish_event | EventEmitter | on_<verb> | register_*`. Nothing subscribes; there is no place to attach a sibling worker.
4. **Schema fields locked to the integration's shape.** Single-reviewer, single-decision, single-result fields in tables that the integration mutates — extending to N reviewers requires schema migration + write-path rewrite, not just a new caller.
5. **Stateless single-shot calls.** No iteration, no tool-calling, no continuation, no per-call state. Every invocation is from-zero.

When 4 of 5 are present, the data model usually survives any reshape. Orchestration almost always must be **replaced**, not extended.

## Why "joint, not disjoint"

Each signal in isolation is a code-smell, not a verdict. A single-call-site is sometimes a candidate for refactor; locked schema fields are sometimes a candidate for additive migration. But when all five travel together, the pattern is: the original author shipped a *minimum-viable-integration* and never built the seams a second consumer would need. Building those seams in-place is harder than starting from a clean orchestrator pattern, because the seams have to be retrofitted across multiple coupled surfaces simultaneously.

## What this changes about evaluation

When the signals are present:

- **Reframe the deliberation.** "Can we extend X?" becomes "Can we keep X's data model and replace X's orchestration?" These are very different questions with very different cost profiles.
- **Audit the data model separately.** The data model may be excellent (tables, indexes, RLS, audit trail) even when the orchestration is unextensible. Score these independently.
- **Treat the project's own roadmap conservatively.** Maintainers often list extensibility on the roadmap *because* they noticed the same gap. If an extensibility hook is "idea, not committed," do not bet on inheriting it.
- **Cost-bound the orchestrator replacement explicitly.** Estimate the LOC to rip out the thin integration vs. the LOC to add a new orchestrator end-to-end. The two numbers should be in the same order of magnitude when the signals are joint; if the replacement looks 10× the integration, re-check whether the data model is also problematic.

## When NOT to apply this signal

- **Tooling integrations** (CLIs, build steps, one-shot scripts) where extensibility was never the design goal — the thin shape is correct.
- **Internal services** under your control — you can rewrite the integration site as cheaply as adding a Reviewer interface.
- **OSS projects pre-1.0** — the absence of seams may reflect "haven't gotten to it yet" rather than "shipped without them and accumulated coupling around the missing seam."

The signal is for *evaluating an external OSS project as a substrate for extension when the project has stabilized*. That is the case where the absence of seams is load-bearing.

## First instance — Brilliant Tier 3 reviewer

Observed: `thejeremyhodge/xireactor-brilliant @eb1d1bf` v0.5.1, Tier 3 reviewer code path. Read by Finn 2026-05-05 (`finn-staging-review-deepread.md`, `finn-brilliant-deepread.md`).

| Signal | Brilliant evidence |
|---|---|
| Single function call | `services/ai_reviewer.py:153 review_staging_item` — one `await client.messages.create(...)` |
| One call site | `staging.py:889` inside `process_staging` admin batch loop |
| No event surface | Zero matches for `webhook \| notify_* \| publish_event \| EventEmitter \| on_approve \| on_reject \| on_escalate \| register_reviewer \| reviewer_plugin` |
| Locked schema | `staging` table has single-reviewer fields: one `evaluator_notes`, one `evaluator_decision`, one `reviewed_by`, one `reviewed_at` — overwriting on subsequent calls |
| Stateless single-shot | One `messages.create`, no tool definitions, no continuation; confidence < 0.7 force-overridden to escalate, no iteration |

**Verdict reached on first instance:** Brilliant's data model (entries, entry_versions, audit_log, staging, RLS, governance tiers) is reusable as-is. The Tier 3 reviewer code path requires full replacement under any curator-team shape. Brilliant's own roadmap lists "alternative LLM providers" as idea-not-committed, confirming the absence of a Reviewer interface from the maintainers' own perspective.

## Promotion posture

n=1. **Watch for second instance** before promotion to common-prompt or topic-file. Pattern is internally consistent (5 joint signals, not arbitrary list) and directly actionable in OSS-substrate-evaluation work, but the evidentiary base is one project. A second instance would establish that the joint-signal shape generalizes; until then, treat as a candidate heuristic for substrate-mapping briefs.

## Related

- [`integration-not-relay.md`](integration-not-relay.md) — verify-substrate-claims-against-substrate before downstream design depends on them. The signal-recognition here is one of the verification checks integration-not-relay calls for.
- [`substrate-invariant-mismatch.md`](substrate-invariant-mismatch.md) — separate pattern but adjacent: when the substrate (data model) and the consumer (orchestration) disagree about what is read-time vs. write-time, you get missing seams. Brilliant's case has a clean data model precisely because writes route through staging; the orchestration coupling is what makes the integration thin.

(*FR:Cal*)
