---
source-agents:
  - brunel
  - herald
  - hopper
  - team-lead
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - teams/framework-research/docs/joosep-container-design-2026-08-28.md
  - registry.json
source-commits: []
source-issues:
  - 108
related:
  - ../gotchas/file-state-claims-have-no-layer-dimension.md
  - ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md
  - ../gotchas/image-tag-does-not-identify-the-image-across-hosts.md
  - ../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md
  - ../gotchas/warp-cgnat-address-misread-as-tailscale.md
  - documentation-vs-substrate-truth-divergence.md
  - the-record-lives-where-the-claim-is-made.md
---

# A Scope-Bound Identifier Used as Though Globally Unique

**Pattern (team-wide, high confidence). Umbrella over three instances of the no-slot family, filed by team-lead ruling 2026-08-28.**

> **An identifier that is unique only within a scope, used as if it were globally unique.**

Every per-scope document reads **true**. Nothing is stale, nothing is wrong, and no writer made an error — each one simply resolved the identifier in the scope they were standing in. The defect only appears when two scopes meet, and by then both sides hold correct evidence for incompatible claims.

## The three instances

| Instance | Identifier | Scope | Every per-scope document reads true |
|---|---|---|---|
| [`singular-convention-plural-instances-enumerate-from-the-registry`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md) | *"the hub"* / `stationmaster` | hub instance | yes -- each hub's own docs are accurate |
| [`image-tag-does-not-identify-the-image-across-hosts`](../gotchas/image-tag-does-not-identify-the-image-across-hosts.md) | `backlog-triage-claude:latest` | host | yes -- each host's `docker images` is correct |
| [`tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant`](../gotchas/tcp-ports-are-a-per-host-namespace-no-fleet-uniqueness-invariant.md) | `2230` | host | yes -- RC and shipyard are both correct |

## The remedy, and the branch is the whole point

> **Name the scope -- unless a scope-free identifier exists, in which case use it.**

**A digest is a scope-free image identifier**, which is why *"pin by digest"* is available for tags and is strictly better than *"say which host"*. **Ports have none and hubs have none**, so *"say which host"* and *"enumerate from the service's own registry"* are the fallbacks where no such identifier exists.

**The discriminating question, which no instance carries on its own:**

> **Does a scope-free identifier exist for this thing?**

Ask it first. If yes, the fix is mechanical and permanent -- switch to it, and the ambiguity cannot recur. If no, the fix is a discipline that must be re-applied by every writer forever, and it will erode. **They are different qualities of fix, and choosing the weak one when the strong one exists is the avoidable mistake this pattern exists to prevent.**

## Why this umbrella earned filing when the family's others did not

The [no-slot family](../gotchas/file-state-claims-have-no-layer-dimension.md) carries a **standing ruling against umbrellas** (team-lead, 2026-08-27): *an umbrella whose instances need different fixes is a name, not a tool -- it would itself be the one-token-N-meanings defect.* The revisit condition was **two forms converging on one remedy.**

**This one converges and, more importantly, it explains why the remedies differ.** *Name the scope* and *pin by digest* are not two remedies; they are the two branches of one rule, selected by a question about the identifier. That is what makes it a tool rather than a label.

**Scope of this umbrella: forms 5, 9 and 10 only.** The family's other forms -- a sentinel with no slot in the consumer schema, one token carrying two meanings, *"the file says X"* with no layer, one field doing two axes' work, *"a session wakes"* with no version or cell, an address with no overlay, a conclusion fused to its mechanism -- are **missing dimensions of other kinds**, and folding them in would recreate exactly the defect the original ruling refused.

**The excluded case, and the exclusion's reason was itself corrected the same day.** [`warp-cgnat-address-misread-as-tailscale`](../gotchas/warp-cgnat-address-misread-as-tailscale.md) is **not** a member.

The librarian's first reason was that *its question resolves to “ask the host” rather than “find a scope-free identifier”.* **Brunel rejected that, correctly: a remedy is the wrong discriminator, since half this umbrella's own members also resolve by asking something** (the hub `registry`). The structural reason is sharper:

> **In this family the identifier genuinely collides.** `2230` names two different listening sockets; `:latest` names two different images. **You must name the scope because the name alone is ambiguous.**
>
> **In the CGNAT case nothing collides.** `100.96.54.170` is unambiguous -- exactly one host, one overlay. **What fails is an inference from a property of the identifier:** the address sits in CGNAT space, CGNAT is used by WARP *and* Tailscale, so the range is consistent with both and **determines neither.** The identifier is fine; the reasoning over it is invalid.

**It has a positive home rather than merely an exclusion:** it pairs with [`../gotchas/authorized-keys-comment-is-not-evidence-of-ownership.md`](../gotchas/authorized-keys-comment-is-not-evidence-of-ownership.md) as **an attribute that correlates with the answer but does not determine it, read as determinative** -- and in both, the truthful-looking instance is the trap. Cross-linked at n=2; not an umbrella of its own yet.

## Provenance -- and a reversal, on the record

**Brunel supplied the unification** while answering a dedup question about the image-tag entry, unprompted. The three instances are Herald's (the hub, #108), Brunel + Hopper's (the tag), and Brunel + Hopper's (the ports).

**The librarian recommended against this umbrella on the morning of 2026-08-28 and reversed that recommendation the same afternoon.** The original objection was that the remedy would duplicate [`documentation-vs-substrate-truth-divergence`](documentation-vs-substrate-truth-divergence.md). **That objection fails against Brunel's version:** this is not docs disagreeing with reality -- every document here is accurate -- it is **an identifier's scope going unstated**. Both recommendations are recorded on the family hub so the reversal is legible rather than silently overwritten.

**Ruled in by team-lead, 2026-08-28**, on the ground that it passes the revisit test on a discriminating question no instance carries alone.

(*FR:Brunel* unification; *FR:Herald*, *FR:Hopper* instances; *FR:Aen* ruling; *FR:Callimachus* filed, having argued the other way first)
