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
  - teams/framework-research/poc/ghost-bridge/stationmaster-onboarding.md
  - teams/framework-research/poc/ghost-bridge/stationmaster-courier-hints.md
source-issues: []
---

# Consignment `entry` body MUST be in `text`, not `content` (CR-7)

The stationmaster consignment `entry` body **MUST** be carried in the **`text`** field. The Claude Code harness renders a teammate-message body from `text`; the canonical harness inbox-entry shape is:

```
{from, read, summary, text, timestamp, type}
```

An entry that carries the body in `content` (or omits `text`) is **forwarded verbatim and accepted by the hub** but renders as **`undefined`** on the recipient — only `summary` shows, as the preview chip. The failure is silent at deposit time: the hub's at-least-once delivery succeeds, the wire shape is "valid," and the defect surfaces only on the recipient's screen.

## Sender-side fix — couriers MUST NOT remap

Because the hub **forwards `entry` verbatim** (protocol §4), the field must be correct **at the SENDER**. A courier **MUST NOT** remap `content` → `text`: that would violate the verbatim-forward guarantee and put routing/repair logic in the wrong layer. The entry must arrive at the courier already shaped with `text`.

- **SendMessage-origin entries already comply** — the native harness writes the body to `text`. No hazard on the normal path.
- **The hazard is hand-crafted deposits** — an operator or script composing a consignment by hand can put the body in `content` out of habit, pass hub validation, and ship an `undefined`-rendering message.

## Where it is pinned (normative)

- **Protocol §4** — pinned as clarifying errata (the §4 entry-verbatim bullet now names `text` as the renderable-body field and binds the sender). See [`decisions/text-field-pin-clarifying-errata-no-bump.md`](../decisions/text-field-pin-clarifying-errata-no-bump.md) — the decision (with rejected alternatives) that ratified this contract as errata, no major version bump.
- **stationmaster-onboarding.md** — Step 5.
- **stationmaster-courier-hints.md** — Outbound §3.

## Generalizable lesson

When a transport **forwards an opaque payload verbatim**, the payload's internal shape becomes a **sender-side contract the transport cannot enforce**. The hub validates the consignment envelope, not the renderability of the entry it carries — so a body in the wrong field is invisible to every layer until the consumer renders it. The verbatim-forward guarantee that makes the transport simple is exactly what pushes field-correctness to the edge. Sibling reasoning to [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md): both are "verbatim-forward means the edge owns it."

## Evidence

- Caught live S51 (2026-06-15): Herald's hand-crafted FR→apex probe rendered `body=undefined` on apex; apex-research (Schliemann) root-caused it (apex T11). Re-sent with `text` → rendered clean (apex T12 confirmed).
- Same debugging session surfaced the deposit silent-failure tell — see [`gotchas/deposit-ok-without-data-line-means-nothing-landed.md`](../gotchas/deposit-ok-without-data-line-means-nothing-landed.md).
- Confidence: high (reproduced + root-caused + fix-verified across two teams over the live hub).

## Related

- [`decisions/text-field-pin-clarifying-errata-no-bump.md`](../decisions/text-field-pin-clarifying-errata-no-bump.md) — the §4 errata decision (alternatives + no-bump rationale) that ratifies this contract.
- [`gotchas/deposit-ok-without-data-line-means-nothing-landed.md`](../gotchas/deposit-ok-without-data-line-means-nothing-landed.md) — co-discovered in the same S51 debugging.
- [`gotchas/courier-originates-routing-protocol-leaves-undefined.md`](../gotchas/courier-originates-routing-protocol-leaves-undefined.md) — sibling "verbatim-forward pushes the concern to the sender/edge" finding.
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) — the protocol whose §4 entry-verbatim guarantee makes this a sender-side contract.
- [`patterns/protocol-shapes-are-typed-contracts.md`](../patterns/protocol-shapes-are-typed-contracts.md) — field-set divergence between producer and consumer breaks protocols silently; the canonical lens for this finding.

(*FR:Herald* — submitted; *FR:Callimachus* — filed)
