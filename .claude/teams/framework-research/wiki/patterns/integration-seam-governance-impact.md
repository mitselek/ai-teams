---
source-agent: montesquieu
discovered: 2026-04-10
filed-by: oracle
last-verified: 2026-04-10
status: active
source-files:
  - topics/04-hierarchy-governance.md
  - topics/06-lifecycle.md
  - topics/07-safety-guardrails.md
source-commits: []
source-issues: []
---

# Integration Seam Determines Governance Impact

When evaluating multi-provider adoption, the integration seam — not the model capability — determines governance complexity. Classify any proposal as "sidecar" or "peer" before governance analysis begins.

## Two Governance Profiles

### Sidecar Integration (Eilama Pattern)

Non-Claude model runs as a daemon/service outside the agent container, connected via inbox polling or HTTP. Sits **below** the governance layer.

- No authority level in delegation matrix
- No delegation matrix entry
- No enforcement layer (E0-E4) participation
- No peer enforcement role

**Governance cost:** Minimal — only credential isolation (T05) and PO authorization per delegation matrix Row 8 (technology stack choice is L0/PO decision).

### Peer Agent Integration

Non-Claude model runs as a first-class team member with TeamCreate, SendMessage, shutdown protocol participation. Sits **inside** the governance layer.

- Must be accounted for in every authority decision
- Must participate in peer enforcement (E1)
- Must be covered by audit baselines (E4)
- Must have a delegation matrix trust level

**Governance cost:** Non-linear — 7 new governance requirements (enumerated in `correlated-failure-single-provider.md`).

## Decision Rule

Any multi-provider adoption proposal should be classified as "sidecar" or "peer" before governance analysis begins. The two patterns have fundamentally different governance costs. Analyzing them together conflates a minimal-governance change with a governance re-validation project.

## Precedent Status

| Seam | Precedent | Governance validated? |
|---|---|---|
| Sidecar (Eilama) | Deployed (hr-devs) | Yes — minimal governance impact confirmed |
| Peer (non-Claude) | None | No — would require re-validation across T01, T04, T05, T07, T08 |

## Provenance

- Discussion #56, Round 1: Brunel (container architecture), Finn (Eilama precedent), Monte (governance layers), Herald (protocol compliance)
- Discussion #56, Round 2: Gemini synthesis correctly identified this as the "Service vs. Peer" distinction
- T04 delegation matrix Row 8: technology stack choice is L0/PO decision
- T06 lifecycle: Eilama documented as backendType: daemon

## Related

- [`multi-provider-integration-seams.md`](multi-provider-integration-seams.md) — documents the same seams from an infrastructure/container perspective; this entry adds the governance dimension
- [`correlated-failure-single-provider.md`](correlated-failure-single-provider.md) — the 7 governance prerequisites apply specifically to the peer integration seam
- [`contract-enforcement-gap-non-claude.md`](../gotchas/contract-enforcement-gap-non-claude.md) — the contract gap is specific to sidecar-and-above; peer integration has additional governance gaps beyond contracts

(*FR:Callimachus*)
