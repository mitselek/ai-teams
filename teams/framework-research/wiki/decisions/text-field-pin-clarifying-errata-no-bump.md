---
source-agents:
  - herald
source-team: framework-research
discovered: 2026-06-15
filed-by: librarian
last-verified: 2026-06-15
status: active
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster-protocol.md
---

# Pin the renderable-body field to `text` at protocol §4 — clarifying errata, NO version bump

**PO-ratified 2026-06-15 (via team-lead; team-lead approved the §4 errata wording as-written).** The stationmaster protocol pins the consignment renderable-body field to **`text`** at the **§4 CONTRACT level**, as **clarifying errata** — **no major version bump.** The §4 errata names `text` as the renderable-body field and **binds the SENDER** (couriers MUST NOT remap, preserving verbatim-forward).

This is the **contract-level resolution** of the CR-7 finding — see [`contracts/consignment-body-in-text-field-not-content.md`](../contracts/consignment-body-in-text-field-not-content.md). The contract entry records *what the rule is*; this decision records *how it was ratified and why no version bump*.

## Rejected alternatives (why errata-at-§4, not another)

- **Leave it as onboarding-convention-only** — rejected: the failure (body in `content` → renders `undefined`) is a **contract-level** hazard about the wire entry's shape, not an onboarding nicety. Documenting it only in onboarding would leave the protocol §4 silent on a field every consumer depends on; the next implementer reading only the protocol would reproduce the bug.
- **Major version bump** — rejected: a major bump signals a **breaking change**, and this is not one. SendMessage-origin entries **already comply** (they write `text`), so **no consumer breaks**. Bumping would impose migration cost on a no-op-for-conformant-senders clarification.
- **Pin at §4 as clarifying errata (CHOSEN)** — puts the rule at the contract level where it belongs, without falsely signaling a breaking change. Same posture as the existing **§5.5 errata** (precedent for clarifying-errata-without-bump in this protocol).

## Why no-bump is correct here

The renderable-body field was **always** `text` in practice — the harness has always rendered from `text`, and the native sender path always wrote it there. The errata **documents an invariant that already held**, it does not change behavior. A version bump communicates "your existing conformant client may break"; nothing conformant breaks. The only thing the errata changes is what a **hand-crafting sender** must know — and that is a documentation gap, not a contract change. This is the canonical shape of a clarifying-errata-no-bump call.

## Evidence

- PO ratified via team-lead 2026-06-15; team-lead approved the §4 errata wording as-written.
- Filed in `stationmaster-protocol.md` §4 (new bullet under the entry-verbatim bullet).
- Precedent: the §5.5 errata (same clarifying-errata-without-bump posture).
- Confidence: high (ratified decision with explicit no-bump rationale).

## Related

- [`contracts/consignment-body-in-text-field-not-content.md`](../contracts/consignment-body-in-text-field-not-content.md) — the CR-7 contract this decision ratifies. Contract = the rule; this = the ratification + versioning call. Two entries, different claim-types (filed separately per Herald 2026-06-15).
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the protocol whose §4 this errata amends; entry-verbatim is why the binding falls on the sender.
- [`playbooks/version-typed-contract.md`](../../playbooks/version-typed-contract.md) — the SemVer discipline this no-bump call applies (clarifying errata that documents an already-held invariant is not a breaking change).

(*FR:Herald* — submitted; *FR:Callimachus* — filed)
