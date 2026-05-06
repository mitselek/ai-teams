---
source-agents:
  - monte
discovered: 2026-05-05
filed-by: librarian
last-verified: 2026-05-06
status: active
confidence: medium
source-files:
  - .mmp/prism/designs/monte/monte-governance-design-2026-05-05.md
  - docs/xireactor-pilot-governance-2026-04-15.md
source-commits: []
source-issues:
  - "59"
  - "65"
related: []
---

# Canonical-Taxonomy Check Before Naming Wrap Targets

Before introducing a name for a new design element by reference to an existing protocol or codename — *"Protocol X handles this," "the Y pattern wraps this question"* — check whether the referenced name is **already claimed in a canonical taxonomy** that the team uses elsewhere. If the name is taken, the proposed reference either fills a slot that's already occupied (collision) or re-introduces a discarded enumeration (regression). Either way, the naming decision is made on the wrong axis.

The check is a one-step lookup: grep the canonical taxonomy (`types/t09-protocols.ts`, common-prompt headers, topic-file section headers, prior decision records) for the name. If it matches, follow the trail to the existing claim and reason about whether the new use is the same slot or a different slot.

## The discipline

The pattern names two distinct failure modes that a careless naming decision can produce, and the canonical-taxonomy check distinguishes them:

1. **Filling a taxonomy slot.** If the canonical taxonomy has an empty slot adjacent to existing siblings (Protocol A/B/C/...), and the new design element is the structural sibling that fits there, *use the canonical name* — Protocol D in the first-instance below. The taxonomy already accommodates it; pretending otherwise creates a parallel naming structure for no reason.

2. **Re-introducing a discarded enumeration.** If the canonical taxonomy *previously* contained the name and discarded it (W1, W2, W3 retired in favor of A/B/C/D), reusing the name resurrects the discarded structure. The discard had a reason; the new design must satisfy the same reason or be a different proposal. Resurrected names import the old reason against them.

The wrap-target naming decision is not "what should we call it?" — it is "is there already a slot or a discarded name that applies?"

## Why this check is rare and worth naming

The natural failure mode is **letter-pattern naming**: "we have Protocol C, so the next one should be Protocol D" — without checking whether Protocol D is already a defined slot or whether the taxonomy axis intends a different labeling principle. Letter-patterning treats the taxonomy as alphabetical sequence (each new protocol gets the next letter), when the taxonomy may actually be principled (each letter denotes a structural role and only specific roles slot in).

The canonical-taxonomy check moves the question one axis up: from "next name in sequence" to "next slot in structure." Slots may not exist in alphabetical sequence — Protocol D may already exist as a defined role even when only A, B, C have been written about; W3 may be retired even when C exists. The taxonomy is the source of truth, not the letters.

## How to run the check

When proposing a wrap-target name N for design element X:

1. **Grep the canonical taxonomy artifacts** for N.
   - For protocol names: `types/t09-protocols.ts`, common-prompt headers, topic-file section headers, prior protocol-design records.
   - For codenames: prior session decision records, project READMEs, deployment registries.
2. **Trace the trail.** If N is found, read the existing claim. Three outcomes:
   - **Match (same slot, structural sibling).** N is the right name; use it.
   - **Collision (different slot or different role).** N is taken; pick a different name or refactor the proposal to match the existing role.
   - **Discard (N was retired or rejected).** N has a reason against it from prior; do not reuse without addressing the reason.
3. **If N is not found, the proposal is fresh.** No taxonomy collision; proceed with naming on its own merits.

The check is one round trip through the taxonomy — usually a 30-second grep + 2 minutes of reading. The cost of skipping it is a naming decision made on the wrong axis, which downstream costs hours when peers catch the mismatch and the proposal must be re-named.

## When this is in tension

- **Multiple canonical taxonomies.** If the team has more than one canonical taxonomy (protocol names + codename register + topic-file sections), the check must be run against all of them. The high-cost failure mode is checking only one and missing the collision in another. Default: enumerate the canonical taxonomies in advance (in topic files or common-prompt) so the check is mechanical.
- **Aspirational taxonomy.** A taxonomy that's been proposed but not yet ratified is in flux — names in it may move. Treat it as canonical only after ratification; until then, names there don't lock the slot. Conversely, a canonical taxonomy with empty slots IS canonical — the slots are reserved by the structure even when not yet populated.
- **Cross-team taxonomies.** When the design crosses team boundaries, the canonical taxonomy of the *consumer* team is the one to check, not the producer's. A name that's free in the producer's taxonomy may be taken in the consumer's — the consumer is the one who'll be confused by collision.

## What this is NOT

- **Not "always defer to existing names."** The check produces three outcomes (match / collision / discard), and only "match" tells you to use the existing name. Collision and discard tell you NOT to use it. The check is the diagnostic; the naming decision follows the diagnostic outcome.
- **Not a substitute for the structural analysis.** Even when the canonical name is the right slot, the design element still has to actually fit the structural role the slot represents. The check resolves the naming question; it does not validate that the proposal belongs in the slot. A poor proposal can still match a canonical name and need to be reworked or rejected.
- **Not a pure linguistic check.** The taxonomy lookup is structural — it asks whether the slot is occupied, not whether the string is unused. A name string can be unused yet the slot be occupied under a different label; conversely, a string can be reused if the prior occupant was retired and the new use is structurally distinct.

## First instances

### Instance 1 — session #59, Protocol D vs W3 (Monte)

Observed 2026-04-15 in xireactor-pilot governance design. Herald proposed naming the cross-tenant submission+review protocol "Protocol D" as a sibling to A/B/C in `types/t09-protocols.ts`. Monte's accepting argument was the load-bearing one: **"Protocol D fills a canonical-taxonomy slot that already has three siblings."** This is distinct from the prior W-ladder (W1/W2/W3 retired earlier in the same project), which was a *re-introduction of a discarded enumeration*. Monte's framing in scratchpad: *"the distinction between 'filling a taxonomy slot' and 're-introducing a discarded ladder' is the load-bearing argument."* Cited in `docs/xireactor-pilot-governance-2026-04-15.md` v6 [DECISION] section.

The canonical-taxonomy check distinguished the two cases on structural grounds: A/B/C have empty slot D; D was always there, latent. W3 had been actively retired with reasoning; the W-ladder reintroduction would have imported the prior reason against itself.

### Instance 2 — session 26, Prism codename collision-check (Monte)

Observed 2026-05-05 in Prism Phase A. The codename Prism was newly ratified by PO 2026-05-05 (relayed by Brunel). Monte's discipline applied the same check at the codename layer: before naming the wrap target by reference to an existing protocol codename, check whether the codename is already claimed in canonical taxonomy. The Prism naming sequence — Obsidian → Brilliant → Prism (optical lineage) — had to be checked against existing Prism claims at the cross-team registry layer. No collision found; Prism is fresh as a codename. The check itself was the discipline; the no-collision result is the consequence.

The cumulative observation across the two instances is the **two-axis check**: protocol-name layer (instance 1) AND codename/registry layer (instance 2). The canonical-taxonomy is not single-axis; the check must run on every axis the name will be referenced from.

## Promotion posture

**n=2 cumulative**. Monte recorded the explicit cumulative count in scratchpad: *"#5 canonical-taxonomy-check before naming wrap targets — n=2 cumulative (W3-vs-Protocol-D in #59 + Protocol-D-vs-Prism today)."* Filed at n=2; the discipline is observable, the failure mode (letter-pattern naming) is named, and the check is mechanical. Watch for n=3+ in future protocol or codename naming decisions to consider Protocol C promotion to common-prompt as a structural-discipline gate alongside the existing four (likely scoped to "before introducing a name by reference to an existing taxonomy, run the canonical lookup").

## Related

- [`named-concepts-beat-descriptive-phrases.md`](named-concepts-beat-descriptive-phrases.md) — adjacent at the naming layer: named concepts beat descriptive phrases. This entry sits adjacent — once you know the concept needs a name (per that pattern), the canonical-taxonomy check tells you whether the name you reach for is the right one. The two patterns chain: name-it-don't-describe-it, then check-the-taxonomy-before-locking-the-name.
- [`pass1-pass2-rename-separation.md`](patterns/pass1-pass2-rename-separation.md) — sibling at the rename layer: pass1-pass2 separates prose renames from machine-identifier renames. The canonical-taxonomy check is the *prerequisite* — before you rename anything, check whether the new name collides in the canonical taxonomy. If it does, the rename plan needs to address the collision, not paper over it.
- [`coordination-loop-self-correction.md`](coordination-loop-self-correction.md) — adjacent: when the canonical-taxonomy check is run by one specialist on another's proposal, the catch is a coordination-loop self-correction trigger. Herald's session 26 retraction of Modification 2 (cited in coordination-loop-self-correction) used the canonical-taxonomy-slot argument from Monte — making the canonical-taxonomy check itself a structural argument that recurs across coordination loops.

(*FR:Cal*)
