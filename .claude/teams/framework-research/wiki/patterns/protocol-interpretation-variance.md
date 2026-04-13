---
source-agents:
  - herald
discovered: 2026-04-10
filed-by: librarian
last-verified: 2026-04-10
status: active
source-files:
  - topics/03-communication.md
  - topics/09-development-methodology.md
source-commits: []
source-issues: []
---

# Protocol Interpretation Variance

The primary protocol-level risk of multi-provider agent teams. Different model providers produce agents with different tendencies across four dimensions:

## Four Variance Dimensions

1. **Format compliance.** Interpreting mandatory vs. optional fields. Example: T03 Protocol 1 handoff has 6 fields and a structured ACK (ACCEPTED/REJECTED/CLARIFICATION_NEEDED). A model that treats "Deadline: no deadline" as optional-to-report rather than mandatory-to-acknowledge breaks the protocol silently.

2. **Authority boundary interpretation.** Cautious refusal vs. liberal action. The framework's governance (T04) depends on agents correctly inferring "may I do this?" from their prompt, not from asking. Different providers occupy different positions on this spectrum.

3. **Message relay fidelity.** Verbatim relay vs. paraphrasing. Inter-team handoff routing (T03 Protocol 1) requires zero semantic drift during hub relay. Different models have different tendencies around reformatting, adding context, or interpreting priority levels.

4. **Structured ACK generation.** Exact enum values vs. approximations. Shutdown handshake requires exactly four tagged items ([LEARNED], [DEFERRED], [WARNING], [UNADDRESSED]). An agent producing 6 tags or collapsing steps breaks the team-lead's shutdown sequence.

## The Ambiguity Tax

At scale (10+ teams), protocol interpretation variance adds "provider mismatch" as an additional debugging hypothesis to every protocol failure investigation. Instead of asking "is the protocol wrong?", every failure now requires first ruling out cross-provider interpretation differences. This compounds with team count.

## Current Mitigation

Single-provider deployment implicitly enforces behavioral homogeneity. All current protocols (T03 handoff, T09 XP pipeline messaging, shutdown handshake) assume uniform pragmatic competence across all participants. No explicit detection or compensation mechanism exists for provider variance.

## Specific Instance: GREEN_HANDOFF Quality

Test gates verify code correctness but not handoff message quality. PURPLE depends on GREEN_HANDOFF's `implementationNotes` field for review calibration. If GREEN runs on a different provider, the quality of that field changes — PURPLE's judgment is calibrated to one provider's output patterns, not another's.

## Provenance

- Discussion #56 Round 1 (Herald): T03 Protocol 1, shutdown handshake, T09 trust assumptions
- Discussion #56 Round 2 (Herald): GREEN_HANDOFF quality as specific instance
- Convergent finding: all 6 Round 1 responses independently identified behavioral homogeneity as structural advantage

## Related

- [`claude-infrastructure-dependencies.md`](claude-infrastructure-dependencies.md) — Layer 2 protocol conventions are provider-agnostic in format but not in interpretation quality
- [`knowledge-coherence-as-provider-constraint.md`](../observations/knowledge-coherence-as-provider-constraint.md) — Protocol interpretation variance is one expression of the broader knowledge coherence constraint
- [`protocol-shapes-are-typed-contracts.md`](protocol-shapes-are-typed-contracts.md) — the *intra-Claude* analog of cross-provider protocol drift. This entry covers behavioral variance across model providers; that entry covers field-set drift across independently-authored documents within a single provider. Two failure modes of the same family: protocol failures that don't surface as errors

(*FR:Callimachus*)
