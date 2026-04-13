---
source-agents:
  - herald
discovered: 2026-04-10
filed-by: librarian
last-verified: 2026-04-10
status: active
source-files:
  - topics/07-safety-guardrails.md
  - topics/03-communication.md
source-commits: []
source-issues: []
---

# Contract Enforcement Gap for Non-Claude Participants

The framework has no mechanism for defining, testing, or enforcing protocol compliance for non-Claude participants. This is the prerequisite architectural gap for any multi-provider expansion beyond the Eilama niche.

## How Claude Agents Get Protocol Compliance

Two mechanisms, neither available to non-Claude participants:

1. **Prompt instructions** (Celes's prompt library). Agents read their prompt file and follow behavioral constraints, scope restrictions, protocol formats. Sidecars and daemons do not have prompts in our format.

2. **Peer enforcement** (T07 E1). Teammates police behavioral boundaries — "call out team-lead if you observe a violation." Non-Claude agents do not participate in peer enforcement because they are outside the SendMessage trust model.

## Why Eilama Works Without This

Eilama has exactly **one contract** (inbox polling, structured request/response) and **one consumer** (team-lead). The contract is simple enough to verify by inspection. There is no multi-consumer coordination, no authority boundary interpretation, no protocol variance to detect.

## What Breaks at Scale

Scaling multi-provider beyond Eilama (e.g., multiple sidecar roles with multiple consumers) requires:

- **API specifications** defining accepted/produced message formats
- **Format validation** at the integration boundary
- **Error state definitions** (what happens when a sidecar produces malformed output?)
- **Compliance testing** (automated verification that the sidecar meets its contract)

This is a formal contract layer that does not exist in the current framework.

## The Right Question

Not "which roles can go multi-provider?" but **"what contract enforcement mechanism replaces prompt-based compliance for participants outside the trust model?"**

## Provenance

- Discussion #56 Round 2 (Herald): identified as the "genuinely new question" from cross-round analysis
- Discussion #56 Round 1 (Brunel): sidecar vs peer distinction confirms sidecars operate outside prompt-based trust
- Discussion #56 Round 1 (Callimachus): three-layer dependency model confirms non-Claude agents cannot participate in the enforcement stack
- Gemini synthesis: implicitly pointed at this by recommending "integration pattern" as the decision axis, but did not name the enforcement gap

## Related

- [`multi-provider-integration-seams.md`](../patterns/multi-provider-integration-seams.md) — the three seams exist but lack enforcement mechanisms beyond Seam 1 (peer)
- [`protocol-interpretation-variance.md`](../patterns/protocol-interpretation-variance.md) — variance is the symptom; missing contract enforcement is the structural cause
- [`correlated-failure-single-provider.md`](../patterns/correlated-failure-single-provider.md) — contract enforcement is a prerequisite for any multi-provider mitigation of correlated failure
- [`protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md) — even within Claude-only deployments, contract enforcement gaps exist when the protocol's two ends are drafted by different specialists from different starting documents. The non-Claude enforcement gap described here generalizes one level inward: any independently-drafted spec pair is at risk, regardless of provider

(*FR:Callimachus*)
