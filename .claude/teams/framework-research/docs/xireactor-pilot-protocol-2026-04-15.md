---
author: herald
team: framework-research
discovered: 2026-04-15
topic: xireactor-as-shared-KB pilot — cross-tenant protocol design
issue: mitselek/ai-teams#59
pilot-tenants:
  - framework-research
  - apex-research
version: v1.2
v1.1-basis: Monte's governance doc (xireactor-pilot-governance-2026-04-15.md) adopted as the producer-side spec
v1.2-basis: Aen flagged that v1.1 §A was more confident than Finn's digest warranted. v1.2 re-lands both xireactor preconditions (per-zone staging skip; tenant-scoped session_init) as outcome (c) — "digest silent or ambiguous, deeper investigation needed" — not (a) "probably yes". Moves the preconditions out of the appendix into a top-level §6.5 gating section, re-sequences §7 so typed contracts land AFTER precondition evaluation, and adds a contingency warning to §2 that Flow B's design collapses if precondition-1 resolves unfavorably.
v1.2-additions: (1) Monte's §3.6.2 step 5 durable-disagreement surface — added `QualifiedSource.disagreementPeer` field to let query results surface the peer tenant's view when disagreement is durable; (2) Brunel's pilot-instrumented asymmetric Tier 3 experiment (FR off, apex on) folded into §7.1 as a pilot-window configuration deviation from the symmetric typed contracts; (3) Monte confirmed Q1 (intra/cross split locked) and Q2 (co-ownership is first-class third state, not a grant flag) — §2.2 sharpened with explicit ordering (librarian gates FIRST, staging SECOND) and the full chain diagram; (4) Monte's anti-pattern callout folded into new §2.5 — "audit-trail-as-purpose vs audit-trail-as-side-effect" names v1's rejected "staging for intra-tenant gets audit trail free" framing as a generalizable anti-pattern, candidate wiki entry; (5) Cal's MCP-unavailable question (§7.3) answered in new §4.5 — fail-closed with `CrossTenantSubmissionError` type, same structural shape as §6.1's URGENT-KNOWLEDGE conservative default, endorsed by Aen; (6) §6.1 URGENT-KNOWLEDGE explicitly reframed as OPEN for a future authority-model doc (Aen's framing), conservative default endorsed. All additions gate-2 cross-read against Monte's governance doc — no field-set divergence.
source-docs:
  - .claude/teams/framework-research/docs/xireactor-brilliant-digest-2026-04-15.md
  - .claude/teams/framework-research/docs/xireactor-pilot-governance-2026-04-15.md
  - .claude/teams/framework-research/wiki/patterns/bootstrap-preamble-as-in-band-signal-channel.md
  - .claude/teams/framework-research/wiki/patterns/governance-staging-for-agent-writes.md
  - .claude/teams/framework-research/prompts/callimachus.md
  - types/t09-protocols.ts
status: design-draft-v1.2-preconditions-gating
---

# Xireactor Pilot — Cross-Tenant Protocol Design (v1.2)

Scope: the **protocol-shape** (field sets, wire formats, typed contracts) for query/write/preamble/discovery on a shared xireactor-brilliant instance hosting two tenants — `framework-research` (FR, Callimachus) and `apex-research` (apex, Eratosthenes).

**v1.1 notes.** v1 modeled cross-tenant writes as a W1/W2 binary and assumed Protocol A routes through xireactor staging on the shared substrate. Monte's governance doc (same-day, same-session) establishes a richer model: **four zones** with three ownership states, and a **strategic asymmetric** use of the staging pipeline (intra-tenant: Protocol A + librarian gate, staging **disabled**; inter-tenant shared-write only: staging **active, all 4 tiers**). v1.1 adopted Monte's governance as the producer-side spec for this protocol doc and reshaped §2 and §5 accordingly. §1 (query), §3 (preamble), §4 (MCP rollout) held from v1 with minor sharpenings. A new §A answered Monte's three §7.2 questions aimed directly at me.

**v1.2 notes — the critical correction.** Aen flagged that §A's answers on the two xireactor preconditions (per-zone staging skip; tenant-scoped session_init) were more confident than Finn's digest warranted. Re-combing the digest: only three lines speak to either question, and none of them *name* the capabilities directly. v1.1 extrapolated from plausible inferences ("indirect encoding via (source, role)", "tenant-scoped by construction via RLS") — those are plausible reads, not digest facts. **Both preconditions land in v1.2 as Aen's outcome (c): digest silent or ambiguous, deeper xireactor investigation needed before pilot sequencing.** A new top-level §6.5 "Preconditions status — gating" promotes this from an appendix answer to a blocker. §7 (rollout sequence) is re-sequenced so typed contracts land AFTER precondition evaluation, not before. §2's Flow B design now carries a contingency warning: **if precondition-1 resolves unfavorably, Monte's asymmetric model collapses into doubled-coverage and §2 needs another reshape** — do not lock the typed contracts until precondition-1 is known.

**The §A appendix is preserved but subordinate to §6.5.** Read §6.5 for the landing; read §A for the full reasoning and digest-citation detail.

Structural Change Discipline gate 2 applies throughout: the governance doc is the producer-side spec, this doc is the consumer-side spec for typed contracts in `types/t09-protocols.ts`. Every shape change is labeled *preserved*, *reshaped*, or *new field*.

## 0. Governance facts inherited from Monte's doc

The protocol shapes in §1–§5 rest on these facts, all from `xireactor-pilot-governance-2026-04-15.md`. This section is a pointer, not a rewrite — read Monte's doc for rationale.

- **Four zones** (§1.1): FR-private, apex-private, FR-owned shared-read, apex-owned shared-read, shared-write. Private is the default; shared-read and shared-write are opt-in.
- **Three ownership states** (§3.2.1): `owned-by-FR`, `owned-by-apex`, `co-owned`. State selects the governance layer.
- **Strategic asymmetric governance** (§3.2): librarian gate (Protocol A) governs intra-tenant; xireactor staging governs inter-tenant (shared-write only). They meet at exactly one zone.
- **Cross-tenant review rides the bootstrap preamble** (§5.3): xireactor `session_init` surfaces pending cross-review items to the reviewing librarian at wake-time. Cites FR wiki entry `bootstrap-preamble-as-in-band-signal-channel.md`.
- **Ownership transitions are ritualized** (§2.3): transfers require two librarians + two team-leads. `owned_by` never auto-flips.
- **Land-grab prevention via fresh synthesis** (§3.6.2): simultaneous-discovery collapses to a fresh co-owned entry in shared-write, with both original entries preserved as sources. Neither is promoted.
- **Audit-independent drift detection** (§4.1 Check 3): a separate audit container reads xireactor's schema and emits drift reports. Neither tenant writes the report.

The protocol shapes below are the wire-format consequences of these governance facts.

## 1. Query path — what a specialist sees when querying the wiki

### 1.1 The question

When Finn (FR specialist) sends Protocol B to Callimachus, and the substrate is a shared xireactor DB, the specialist's query can potentially touch four zones: FR-private, FR-owned shared-read, apex-owned shared-read, and shared-write (if `co-owned` entries exist). Does Finn see cross-tenant content? How does it show up in the result metadata? What does the wire format look like?

### 1.2 The answer: zone-scoped default, explicit narrowing (not widening)

**Default read scope: everything the querying agent is permitted to see.** When Finn queries, the default result set contains FR-private entries, FR-owned shared-read entries, apex-owned shared-read entries (readable to FR by zone definition), and any `co-owned` entries in shared-write. apex-private is never visible to FR under any circumstance. This matches Monte's §1.1: shared-read is "readable by both tenants" by construction — no opt-in required at query time, the opt-in already happened when the owning librarian promoted the entry to shared-read.

**Explicit narrowing is supported; explicit widening is not needed.** The default result set is already the full permitted view. A specialist who wants to narrow can pass a zone filter; a specialist who wants to widen has nothing to widen to, because RLS already shows them everything they're permitted to see.

This is the key v1→v1.1 simplification. v1's `includeTenants?: string[]` was the wrong field — under Monte's four-zone model, the reader doesn't opt in to "see apex-research content," because if apex-research has chosen to put content in apex-owned shared-read, FR agents see it by default. The opt-in was made by apex's librarian, not by FR's querier.

### 1.3 Shape on the wire — KnowledgeQuery (reshaped)

**Preserved fields** (no change from `KnowledgeQuery` in `t09-protocols.ts`): `from`, `question`, `context`, `urgency`.

**New optional field** (narrowing, not widening):

```ts
zoneFilter?: ZoneFilter;

interface ZoneFilter {
  /**
   * Restrict result set to these zones. Absent = default = all zones
   * the querying agent is permitted to see (own-private, both
   * shared-reads, shared-write).
   *
   * Typical uses:
   *   ["fr-private"] — "give me only my own team's knowledge"
   *   ["shared-write"] — "show me co-owned entries I'm party to"
   */
  includeZones: Zone[];
}

type Zone =
  | "fr-private"
  | "apex-private"  // never visible to FR; apex's querier equivalent
  | "fr-owned-shared-read"
  | "apex-owned-shared-read"
  | "shared-write";
```

**Deleted from v1:** `includeTenants?: string[]`. Wrong granularity. Zone is the right axis.

### 1.4 Shape on the wire — KnowledgeResponse (reshaped)

**Preserved fields**: `to`, `status`, `answer`, `gapNoted`.

**Reshaped field** — `sources` and `relatedEntries` become `QualifiedSource[]`:

```ts
interface QualifiedSource {
  entryId: string;         // xireactor entry ID (stable)
  path: string;            // human-readable path, e.g., "patterns/governance-staging-for-agent-writes"
  zone: Zone;              // structural zone tag
  ownership: OwnershipState;
  originatingTenant: string;  // "framework-research" | "apex-research"
  /**
   * True iff the ownership state is co-owned OR the zone is the
   * other tenant's shared-read. False for own-tenant-origin entries
   * in own-tenant-exclusive zones.
   */
  crossTenantVisible: boolean;
  /**
   * Durable-disagreement peer (v1.2 addition, per Aen's §3.6.2-step-5
   * fold-in). Populated when a cross-review landed as
   * `CrossReviewReject` with `suggestDurableDisagreement = true` —
   * i.e., both tenants hold incompatible views on the same pattern,
   * both views are preserved, and a query result for either side
   * should surface the other view's pointer so the reader can see
   * both takes rather than silently reading only one.
   *
   * Null in the normal case (no disagreement). Points at the other
   * tenant's entry when disagreement is durable. The referenced entry
   * does NOT point back (the back-pointer lives on the disagreement
   * record, not on the peer — one-way references stay simple).
   */
  disagreementPeer: QualifiedSource | null;
}

type OwnershipState = "owned-by-fr" | "owned-by-apex" | "co-owned";
```

The `zone` and `ownership` fields are **structural answers** to "does the querier know an entry's provenance?" — yes, and it's in the type. `structural-match-beats-free-string-for-protocol-filters.md` (wiki) applies: a reader filters by `src.zone === "fr-private"` or `src.ownership === "co-owned"`, not by substring-matching a path.

**Why reshape rather than add a sibling field** (unchanged from v1): single-team codebase, both producer (Cal) and consumer (specialist) update in the same commit, no back-compat shim needed. Gate 2 cross-read is cheap and explicit.

### 1.5 Ranking across zones

**Tenant-neutral scoring.** Xireactor's full-text + semantic search runs across the permitted zone set with no origin boost. Rationale unchanged from v1: the right answer is the right answer regardless of which tenant authored it.

**Tiebreaker: prefer own-private.** On relevance ties, entries in the querier's own private zone rank above shared-read, which ranks above shared-write. Rationale: the querier is most likely to have tacit context for their own-private content; unfamiliar content should earn its place on relevance, not just on being visible.

### 1.6 Dedup across duplicate discoveries (§3.6.2 interaction)

Monte's §3.6.2 preserves *both* original intra-tenant entries when a synthesis into `co-owned` happens: both stay in their respective private zones with a `superseded-by: <co-owned-id>` reference. The query path must handle the resulting triple gracefully — if Finn queries for pattern X and there are three matching entries (FR-private original, apex-private original, co-owned synthesis), which does he see?

**Rule: superseded entries are filtered from query results unless explicitly requested.** The `superseded-by` reference hides the superseded entries from default query results. The synthesis (co-owned) is the live answer. History-seekers can pass `includeSuperseded: true` in the query to see the originals.

```ts
// Addition to KnowledgeQuery
includeSuperseded?: boolean;  // default false
```

This is the minimum field set to honor Monte's "source history is preserved, but subsequent mutations use the co-owned entry" rule. It makes the default query result clean without deleting provenance.

### 1.7 Summary of Protocol B shape changes

| Field | v0 (current) | v1.2 | Status |
|---|---|---|---|
| `from`, `question`, `context`, `urgency` | string/string/string/enum | unchanged | preserved |
| `zoneFilter` | absent | optional `ZoneFilter` | new (optional) |
| `includeSuperseded` | absent | optional `boolean` | new (optional) |
| `sources` | `string[]` | `QualifiedSource[]` (includes `disagreementPeer` field) | **reshaped** (gate 2) |
| `relatedEntries` | `string[]` | `QualifiedSource[]` (includes `disagreementPeer` field) | **reshaped** (gate 2) |
| `gapNoted` | optional object | unchanged | preserved |

Two new optional fields on the request, one typed-contract reshape on the response. One typed-contract break (the `sources` / `relatedEntries` reshape), cross-read with Cal at code-land time. **v1.2 addition**: `QualifiedSource.disagreementPeer` surfaces the other tenant's view when a durable disagreement exists (Monte §3.6.2 step 5, folded in per Aen's direction). Reader filters "show me both sides of any disagreement" with `src.disagreementPeer !== null`. Structural match beats free-string.

## 2. Write path — three distinct flows for three ownership states

> **Contingency warning (v1.2).** The three-flow design below assumes xireactor can be configured to **skip its staging pipeline for intra-tenant writes** (Flow A) while engaging all four tiers for shared-write (Flow B). That capability is **precondition-1** in §6.5 and is currently at outcome (c) — digest silent/ambiguous, deeper investigation required. **If precondition-1 resolves unfavorably** (xireactor has a hardcoded tier floor or a global staging invocation that cannot be per-zone bypassed), then Monte's strategic asymmetric governance collapses into doubled-coverage: every intra-tenant write becomes a staging cycle, Protocol A and xireactor staging start governing the same boundary, and the pilot thesis breaks. **Do not land the typed contracts in §2.2 until precondition-1 is confirmed** — a reshape is much cheaper at the spec stage than at the type-level.

v1 tried to unify the write path. That was wrong. Under Monte's model, writes split into three structurally distinct flows based on the target ownership state. Each flow has its own protocol shape.

### 2.1 Flow A — Intra-tenant writes (the 90% case)

**Target states:** `owned-by-FR` (destinations: FR-private, FR-owned shared-read) or `owned-by-apex` (apex-private, apex-owned shared-read).

**Governance layer:** Protocol A + owning-tenant librarian gate. **Staging pipeline DISABLED.** This is Monte's §3.2 decision.

**Wire format:** `KnowledgeSubmission` from `t09-protocols.ts` — **completely unchanged.**

Agents send Protocol A to their own tenant's librarian exactly as today. The librarian classifies, dedups, files, and acks in the same message window. The xireactor substrate stores the result in the target zone, but **the producer-side wire format is identical to the current single-tenant form**. No new fields, no reshape, no migration.

This is the "Protocol A is preserved" result Aen promised: the 90% write case is completely untouched by the pilot. Specialists don't learn new submission formats; librarians don't learn new classification protocols (for the intra-tenant case).

**The one addition** — the librarian's decision of *which zone* (private vs owned-shared-read) is a pre-classification Cal/Eratosthenes prompt edit (Monte §7.3, §3.2.1). This is a librarian-side workflow addition, not a Protocol A shape change. The producer (agent) doesn't see it.

**Typed contract status: preserved.** `KnowledgeSubmission` in `t09-protocols.ts` needs zero changes for Flow A.

### 2.2 Flow B — Cross-tenant write via shared-write (the 10% case)

**Target state:** `co-owned` (destination: shared-write zone).

**Governance layer:** Protocol A + owning-tenant librarian gate (at submission) AND xireactor staging pipeline all 4 tiers AND cross-review by the other tenant's librarian. This is the ONE case the staging pipeline exercises.

**Ordering is load-bearing** (Monte, confirming v1.2): librarian gates **FIRST**, staging pipeline **SECOND**. Nothing reaches xireactor staging without passing the owning librarian's Protocol A classification; bounced submissions never enter staging. The full chain is:

> agent → own-tenant librarian → (if classified as cross-cutting) staging Tier 3 → other-tenant librarian via session_init preamble → verdict

The sequence is strict. A cross-tenant submission that Cal bounces with the standard redirect template never reaches xireactor at all — the staging table has no record of it. (This is the one known cost of the pilot's scope trim: intra-tenant bounces, and own-tenant pre-staging bounces on cross-cutting proposals, stay in inbox redirect-templates and do not produce structured audit trails. See §2.5 below on audit-trail-as-purpose vs audit-trail-as-side-effect.)

If this diagram had been "agent → staging → librarian" (staging-first, librarian-second), the model would invert: a submission would be persistently recorded before classification, Cal's bounce would leave a structured reject in staging rather than a greppable inbox note, and the librarian gate would be a *second* filter on an already-persisted write. That inversion is plausible for teams that want audit-trail as a side-effect of the write path — but it's not Monte's model, and it's not what the pilot is evaluating.

**Trigger:** A librarian (say, Cal) receives a Protocol A submission and determines (per Monte §7.3 pre-classification rule) that the knowledge is cross-cutting and belongs in shared-write. Cal does NOT file it in FR-private; Cal initiates Flow B.

**Wire format layer 1 — the agent's submission:** unchanged `KnowledgeSubmission`. The specialist still just submits Protocol A; they don't need to know the target ownership state. Classification is the librarian's job (Monte §7.3). This is an important property — it keeps cross-tenant knowledge flow backwards-compatible for specialists.

**Wire format layer 2 — the librarian's cross-review proposal:** this is **new**. A typed contract for the proposal a librarian sends when moving an accepted Protocol A submission into the shared-write flow:

```ts
/**
 * CrossReviewProposal (Librarian → xireactor staging → other tenant's Librarian).
 *
 * Originates from a Protocol A submission that the receiving librarian
 * classified as belonging in shared-write. The proposing librarian is NOT
 * yet the author of record — authorship is determined by the cross-review
 * outcome (accept → entry lands in shared-write with both librarians on
 * the provenance trail, reject → no entry).
 *
 * Enters xireactor staging at Tier 3 (per governance §3.7). Tier 3 AI
 * reviewer applies confidence-floor routing; routed items surface in the
 * other tenant's librarian bootstrap preamble.
 */
interface CrossReviewProposal {
  proposalId: string;
  /** Proposing librarian — "callimachus" or "eratosthenes". */
  proposingLibrarian: string;
  /** Proposing tenant. */
  proposingTenant: string;
  /** Target tenant (always the other one in 2-tenant pilot). */
  targetTenant: string;
  /**
   * The original Protocol A submission that triggered this flow, preserved
   * verbatim. The cross-reviewer needs to see the source of the proposal.
   */
  originatingSubmission: KnowledgeSubmission;
  /**
   * Librarian's rationale for why this is cross-tenant, not intra.
   * This is the pre-classification rationale (Monte §7.3).
   * Feeds the Tier 3 AI reviewer's confidence judgment.
   */
  crossTenantRationale: string;
  /**
   * Draft wiki entry content, shaped as the proposing librarian would file it.
   * The cross-reviewer can suggest changes or accept as-is.
   */
  draftEntry: {
    title: string;
    content: string;
    frontmatter: WikiProvenance;
  };
  /**
   * Cross-references to existing entries in either tenant that relate.
   * Required if the proposal is resolving a simultaneous-discovery case
   * per §3.6.2 — the two existing intra-tenant entries go here.
   */
  crossReferences: QualifiedSource[];
  /**
   * True iff this proposal is the fresh-synthesis case from §3.6.2
   * (both librarians independently filed similar patterns, now synthesizing).
   * When true, crossReferences MUST contain both original intra-tenant entries.
   */
  isSimultaneousDiscoverySynthesis: boolean;
}
```

**Wire format layer 3 — the cross-reviewer's verdict:**

```ts
/**
 * CrossReviewVerdict (other Librarian → xireactor staging → proposing Librarian).
 *
 * The other tenant's librarian's decision after reviewing a CrossReviewProposal
 * via the session_init bootstrap preamble.
 */
type CrossReviewVerdict =
  | CrossReviewAccept
  | CrossReviewNeedsRevision
  | CrossReviewReject;

interface CrossReviewAccept {
  verdict: "ACCEPT";
  proposalId: string;
  reviewingLibrarian: string;
  /** Optional rationale — "matches our team's pattern" etc. */
  acceptanceNote?: string;
}

interface CrossReviewNeedsRevision {
  verdict: "NEEDS_REVISION";
  proposalId: string;
  reviewingLibrarian: string;
  /** Specific changes the reviewer wants before accepting. */
  requestedChanges: string;
  /** Optional draft of the reviewer's proposed revision. */
  counterDraft?: {
    title: string;
    content: string;
  };
}

interface CrossReviewReject {
  verdict: "REJECT";
  proposalId: string;
  reviewingLibrarian: string;
  /** Why the reviewer cannot accept even with revision. */
  rejectionReason: string;
  /**
   * Per §3.6.2 step 5: rejection is a valid terminal state. Both tenants
   * keep their view, the disagreement is recorded, and the entries are
   * candidates for another synthesis attempt at the next sunset review.
   */
  suggestDurableDisagreement: boolean;
}
```

The Accept/NeedsRevision/Reject tri-state mirrors Monte's §5.1 step 6 exactly, and Reject's `suggestDurableDisagreement` flag encodes the §3.6.2 step 5 "durable disagreement is a valid terminal state" rule.

**Typed contract status: new.** Three new interfaces (`CrossReviewProposal`, `CrossReviewVerdict` with three variants). None of them modify existing interfaces — they're additive. Cal's existing `KnowledgeSubmission` handling is untouched; `CrossReviewProposal` is what Cal *produces* when routing a submission into Flow B.

**Structural dispatch note (v1.2, preserved per Aen's framing request).** The mutation contract for an entry is dispatched by the **value of `owned_by`**, not by a flag sitting alongside it. An entry with `owned_by = owned-by-fr` carries the Protocol A single-librarian contract (Flow A semantics); an entry with `owned_by = owned-by-apex` carries the symmetric contract on apex's side; an entry with `owned_by = co-owned` carries the joint-authority mutation contract (Flow B semantics — cross-review required on every mutation regardless of proposer). Two distinct typed contracts, dispatched on one enum value. This is why `OwnershipState` has three values and NOT two values plus a boolean: a boolean flag on top of a two-state model would let "FR with an apex-grant" silently behave like "co-owned" in some code paths and like "FR-owned with a courtesy read" in others, and the two behaviors would drift. The three-valued enum makes the dispatch **structurally unambiguous** — a reader of an entry knows which contract it's under by reading one field, and the type checker will flag any code path that handles `co-owned` with the same helper as `owned-by-fr`. Structural-match-beats-free-string at the contract-dispatch layer: the contract is in the type, not in a convention around it.

### 2.3 Flow C — Ownership transfer ritual (the <1% case)

**Target: flip `owned_by` on an existing entry.** Monte §2.3: requires two librarians + two team-leads, implemented via xireactor comments (Monte's §7.2 ruling is that comments are enough for pilot).

**Wire format:** uses existing xireactor comments with a structured `comment_type` convention. Four typed interfaces for the four signatures:

```ts
/**
 * OwnershipTransferProposal — first signature (source librarian).
 * Posted as a xireactor comment with comment_type = "ownership-transfer-proposal".
 */
interface OwnershipTransferProposal {
  commentType: "ownership-transfer-proposal";
  entryId: string;
  fromOwner: OwnershipState;
  toOwner: OwnershipState;
  proposingLibrarian: string;
  rationale: string;
  proposedAt: string;  // ISO date
}

/**
 * Second signature — target librarian accepts.
 * comment_type = "ownership-transfer-accept".
 */
interface OwnershipTransferAccept {
  commentType: "ownership-transfer-accept";
  entryId: string;
  proposalId: string;  // reference to the first comment
  acceptingLibrarian: string;
  acceptedAt: string;
}

/**
 * Third & fourth signatures — team-leads countersign.
 * comment_type = "ownership-transfer-countersign".
 * The ritual needs exactly two of these, one per team-lead.
 */
interface OwnershipTransferCountersign {
  commentType: "ownership-transfer-countersign";
  entryId: string;
  proposalId: string;
  teamLead: string;
  team: string;
  countersignedAt: string;
}
```

Only once a proposal has one accept from the target librarian AND two countersigns (one per team-lead, Monte's §2.3 "two team-leads") does the xireactor operator flip `owned_by`. The operator is a human, not a librarian — Monte §2.3 step 4.

**Typed contract status: new (convention on existing substrate).** The comment table already exists; these four interfaces are the convention layer. Zero xireactor schema change. Matches Monte's §7.2 ruling that ownership-transfer wire format is "deliverable, not precondition."

### 2.4 Flow summary table

| Flow | Trigger | Input shape | Staging layer | Output | Typed-contract status |
|---|---|---|---|---|---|
| **A — Intra-tenant** | Agent files Protocol A | `KnowledgeSubmission` (unchanged) | **disabled** | entry in own-private or own-owned-shared-read | **preserved** |
| **B — Cross-tenant (shared-write)** | Librarian classifies as cross-cutting | `CrossReviewProposal` wrapping the original `KnowledgeSubmission` | **active, Tier 3+ always** | `co-owned` entry in shared-write, OR durable disagreement | **new** (3 interfaces) |
| **C — Ownership transfer** | Two librarians agree an entry should move | Four-comment ritual | **n/a** (metadata-only operation) | `owned_by` flip by xireactor operator | **new** (4 interfaces on existing comments) |

**The net shape of Cal's daily work**: for every incoming submission, Cal does a pre-classification (intra vs cross-cutting — Monte §7.3). Intra goes through current Protocol A exactly as today (Flow A). Cross-cutting triggers Flow B, where Cal wraps the submission in a `CrossReviewProposal` and releases it into staging for Eratosthenes. Flow C is triggered only on explicit ownership-change decisions, which are rare by design.

**The 90% case is backwards-compatible for all parties.** The 10% case is net-new but additive — no existing protocol is broken.

### 2.5 Anti-pattern — audit-trail-as-purpose vs audit-trail-as-side-effect

> *v1.2 addition (Monte cross-referenced this into his governance doc's next revision pass.)*

v1 of this doc proposed routing intra-tenant writes through xireactor staging "to get the audit trail for free" — meaning the rejected/bounced submissions would be persistently recorded in the staging table as a structural by-product of the write path. Monte rejected that framing in his governance doc §3.4, and it's worth naming the anti-pattern explicitly so future revisions don't re-introduce it:

- **Audit-trail-as-side-effect** is the v1 framing: write path routes through a staging layer whose *primary purpose* is governance, and the audit trail emerges as a side-effect of the write-path persistence. The seductive property is that no new infrastructure is needed — the audit trail comes "free" with the staging layer. The hidden cost is that the write path pays the full staging latency for every submission regardless of whether the submission needed governance. Per Monte §3.4: "adding a staging stage to FR-private writes is overhead that protects against a risk that isn't present."

- **Audit-trail-as-purpose** is the corrected framing: if the team wants a structured audit trail of rejected/bounced intra-tenant submissions, add structured bounce-logging to Protocol A directly. The Librarian's existing `[SUBMITTED → REDIRECTED]` redirect template is already greppable; upgrading it to emit a structured JSON append to a bounce log is a small Cal prompt edit, not a substrate change. Cheap, targeted, does not inflate the write path.

**The anti-pattern's shape**: reaching for a heavy-governance infrastructure (staging, pipeline, tier assignment) because a *side-effect* of that infrastructure happens to supply a property the team wanted for another reason. The governance infrastructure earns its place when the governance *is* the purpose. Piggybacking on infrastructure for its side-effects produces unjustified latency and couples the team to an infrastructure they didn't actually need.

**This anti-pattern generalizes.** It's a sibling of `rule-erosion-via-reasonable-exceptions` (`wiki/patterns/rule-erosion-via-reasonable-exceptions.md`) at the infrastructure-selection scale rather than the rule-application scale: "we kept this heavy path because it gives us a nice side-effect" is an erosion vector that protects dead-weight infrastructure from pruning. FR has already named the rule-scale version; this is the infrastructure-scale version worth a wiki entry in its own right.

**Monte's consequence in the pilot**: the intra-tenant bounce audit trail is a **deliberate scope trim**. The pilot does not try to retrofit structured bounce-logging for intra-tenant Protocol A; Cal's greppable inbox remains the audit mechanism. If the team later wants structured bounce-logging, it ships as a Cal prompt edit (audit-trail-as-purpose), not as a staging-for-intra-tenant-writes reshape (audit-trail-as-side-effect).

**Filing note to Callimachus**: this entry is a candidate for `wiki/patterns/` as a new pattern — "audit-trail-as-purpose vs audit-trail-as-side-effect." Herald does not write to the wiki (scope restriction); Cal or whoever runs Cal's next dedup pass should decide whether it earns its own entry or merges into `rule-erosion-via-reasonable-exceptions` as a scale-variant sibling.

## 3. session_init preamble — the cross-review channel

### 3.1 The design (from Monte §5.3, sharpened here)

Monte §5.3 establishes that xireactor's `session_init` preamble is the delivery channel for cross-review requests. FR's wiki entry `bootstrap-preamble-as-in-band-signal-channel.md` already articulates the pattern: durable state + bootstrap-path obligation + payload attachment.

The pilot adds a new payload class to FR/apex librarians' session startup: **pending cross-review items** land in the preamble the librarian already walks at wake. This doc's job is to type the payload.

### 3.2 Shape on the wire — SessionInitPreamble

```ts
/**
 * The xireactor-delivered preamble that both librarians read at session start.
 * Surfaces pending cross-review items the reading librarian is the assigned
 * reviewer for. Scoped per-tenant by RLS — the other tenant's pending items
 * do NOT appear in this preamble (see §A.2 on session_init tenant scoping).
 */
interface SessionInitPreamble {
  /**
   * Pending CrossReviewProposals where the reading librarian is the target
   * (i.e., proposals from the other tenant awaiting their verdict).
   * Empty array if none pending. Always a list, never a count.
   */
  pendingCrossReviews: CrossReviewProposal[];
  /**
   * Pending OwnershipTransferProposals where the reading librarian or
   * their team-lead is the next signature. Scoped to rituals in progress.
   */
  pendingOwnershipRituals: OwnershipTransferState[];
  /**
   * Tier 4 escalations — proposals that failed Tier 3 AI review with
   * confidence < 0.7 and are now awaiting human-only disposition.
   * This is xireactor's native Tier 4 payload, tenant-scoped.
   */
  pendingTier4: StagingItem[];
}

interface OwnershipTransferState {
  proposalId: string;
  entryId: string;
  currentSignatures: {
    proposingLibrarian: string;
    acceptingLibrarian?: string;
    countersignFromFrLead?: string;
    countersignFromApexLead?: string;
  };
  nextSignatureNeededFrom: string;
}
```

### 3.3 What the preamble does NOT carry

Monte's anti-pattern guidance (via `bootstrap-preamble-as-in-band-signal-channel.md` §Anti-Patterns) applies:

- **Cross-tenant activity summary** — "apex-research filed 4 patterns today" is noise, not signal. Not surfaced.
- **Shared-read entries authored by the other tenant** — specialists query for those; no wake-time push.
- **Full content of pending cross-reviews** — only the `CrossReviewProposal` metadata plus draft title. Cal/Eratosthenes opens the proposal to see the full content (lazy pull, not eager push).
- **Tier 1 / Tier 2 cross-tenant activity** — already auto-resolved or auto-merged. Not my problem, not in my preamble.
- **History of prior reviews the same librarian already decided** — those are past work, not pending work.

### 3.4 Who sees what in the preamble

The preamble is **tenant-scoped by RLS** (§A.2 below). This means:

| Reader | `pendingCrossReviews` contents |
|---|---|
| Callimachus (FR librarian) | Proposals from Eratosthenes awaiting Cal's verdict |
| Eratosthenes (apex librarian) | Proposals from Cal awaiting Eratosthenes's verdict |
| Finn (FR specialist) | **Empty array** — specialists don't review. Structurally empty. |
| Cal's team-lead (Aen) | OwnershipTransferStates where Aen's signature is next; empty `pendingCrossReviews` |

The "structurally empty for non-reviewers" property comes for free from the RLS role-switching (`SET LOCAL ROLE kb_viewer` vs `kb_editor` vs `kb_agent`). A `kb_viewer` simply cannot query the cross-review queue. The preamble builder respects the role, so it returns `[]` for non-reviewers.

This is the **provenance discipline** from the wiki entry: payload without a responsible reader is preamble bloat. Structurally closing the preamble to specialists is cheaper than teaching the builder to filter.

## 4. MCP rollout and tenant discovery

### 4.1 The question

How does each tenant's MCP client know the xireactor instance is hosting the other tenant? How is trust configured? Do we need a discovery registry?

### 4.2 The answer: explicit config, stdio-first

For a 2-tenant pilot: **explicit MCP client configuration**, one stanza per tenant, no registry. Each tenant's MCP client config lists the xireactor endpoint plus the tenant credential. Cross-tenant visibility is not a client-side configuration question — it's a RLS grant question that lives on the server side. The client just authenticates; the server decides what the client can see.

**Transport: stdio-first for the pilot.** `server.py` (stdio) is the cheaper path for single-developer-per-tenant usage. The HTTP+OAuth transport (`remote_server.py`) is available if the pilot later grows to multi-human teams per tenant; tenancy lands at the REST layer (Monte §1.1 + digest §3), so switching transports doesn't reconfigure tenancy.

**Discovery: no registry.** In a 2-tenant pilot there is nothing to discover. Each tenant knows the other exists because it's part of the pilot. Scaling past 2 tenants is when a discovery mechanism earns its place; the pilot's job is to produce evidence about whether scaling is worth doing at all.

**Trust boundary: RLS is the gate.** Even with both tenants' MCP clients pointed at the same instance, the server enforces what each client sees via the role/org_id it sets on every transaction (digest §3). A misconfigured client can't accidentally see the other tenant's data because the server doesn't trust the client to name its own tenant — the server issues the credential and binds it to an org_id.

### 4.3 Dual-transport consequences

Because tenancy is enforced at the REST layer (below both MCP transports), a tenant can mix stdio and HTTP+OAuth clients in the same deployment without affecting governance. Cal using Claude Code (stdio) and a hypothetical human using Claude Co-work (HTTP+OAuth) both resolve to the same `org_id = 'FR'` via their respective credentials. This is a substrate property, not a protocol shape.

### 4.4 Pilot MCP config shape (suggested)

Every MCP client config already has `mcpServers[]` or equivalent. The xireactor entry is one object per tenant credential:

```jsonc
{
  "mcpServers": {
    "xireactor-fr": {
      "command": "xireactor-mcp",
      "args": ["--transport", "stdio"],
      "env": {
        "XIREACTOR_ENDPOINT": "http://xireactor-host:8010",
        "XIREACTOR_BEARER_TOKEN": "$XIREACTOR_FR_TOKEN"
      }
    }
  }
}
```

FR agents carry the FR token; apex agents carry the apex token. The tokens are bound to org_ids server-side. Config is simple, tenant-unaware from the client's perspective, and each tenant's config is independent.

### 4.5 Failure mode — MCP tool unavailable at submission time

> *v1.2 addition (Cal raised the question in her §7.3 pass; Aen's instinct endorsed fail-closed as the pilot default.)*

**Question:** What happens if a specialist tries to submit a cross-tenant pattern (Flow B) but the MCP tool that would release the proposal into xireactor staging is unavailable — xireactor instance down, MCP client misconfigured, bearer token expired, transport disconnected?

**Two options, both plausible:**

- **Option A — fail closed.** The submission fails with a clear error ("staging unavailable, cannot file cross-tenant proposal"). The specialist keeps the submission in their scratchpad or re-raises when the MCP tool recovers. No state is written anywhere.
- **Option B — fail open with degradation.** The submission is silently converted to an intra-tenant write in the authoring tenant's own-private zone, on the theory that "some governance is better than losing the knowledge." The cross-tenant intent is dropped; the entry lands as if it had been classified intra-tenant.

**Pilot v1.2 default: fail closed.** This is the same structural shape as the URGENT-KNOWLEDGE conservative default in §6.1 — when the cross-tenant path is unreliable, do not silently convert cross-tenant intent into intra-tenant fact. Fail-open (Option B) has a hidden cost that is serious: the specialist submitted a cross-tenant pattern, Cal classified it as cross-cutting, and the MCP failure silently down-grades it to FR-private. From then on, apex-research never sees the entry, and neither Cal nor the specialist can tell that a cross-tenant intent was dropped — the audit trail shows only the successful FR-private write. This is the **audit-trail-as-side-effect anti-pattern** (§2.5) in a different coat: "we didn't lose the knowledge, it's just in the wrong zone" is the seductive property, and the hidden cost is that the team can no longer distinguish "intentionally FR-private" from "cross-tenant intent dropped on the floor."

**Fail-closed wire format**: the error response is structured so Cal can surface it to the submitting specialist in the same message window. A minimal type:

```ts
interface CrossTenantSubmissionError {
  kind: "cross-tenant-mcp-unavailable"
      | "cross-tenant-staging-rejected"
      | "cross-tenant-timeout";
  submissionId: string;      // the submission Cal was trying to route
  retryable: boolean;        // true for transient transport failures
  detail: string;            // human-readable for the specialist
}
```

**Not in the error shape**: no partial-success, no "filed as intra-tenant instead" fallback, no silent conversion. The error is a clean fail.

**Consequence for Cal's prompt edits (Monte §7.3)**: Cal's cross-cutting classification step must handle the `CrossTenantSubmissionError` case explicitly — when the MCP tool fails, Cal's same-window ack to the specialist says "I classified this as cross-cutting but the staging layer is unavailable; please hold the submission and re-file when I signal recovery" rather than filing it anywhere. The submission sits in the specialist's scratchpad (or Cal's inbox) as a pending retry, and the audit trail of "attempted cross-cutting filings that failed" is greppable in inbox artifacts (not structured, which is consistent with §2.5's scope trim on intra-tenant audit trails).

**Open question (v1.2 punt)**: how does Cal know when to signal recovery? The pilot's answer is manual — Cal's own next session_init preamble will reveal whether the MCP tool is reachable, and Cal manually re-processes any held submissions. Automated retry queues are out of scope for the pilot; if the failure mode is common enough to need automation, that's post-pilot signal. For now, fail-closed plus manual recovery.

**Symmetric default for apex-research**: Eratosthenes applies the same fail-closed default. Mirrored prompt edit, routed through Aen.

## 5. Protocol A/B mapping — clean split by ownership state

This section is the compare-and-contrast the brief asked for. v1 had a 12-row preserved/reshaped/new table with the intra/inter boundary folded into the substrate change. Under Monte's governance, the mapping is much cleaner — a 2-column split by ownership state.

### 5.1 The intra-tenant column (Flow A, §2.1)

| Element | Current FR (single-tenant, markdown FS) | Shared-substrate intra-tenant (xireactor DB, owned-by-FR / owned-by-apex) | Status |
|---|---|---|---|
| Protocol A submission format | `KnowledgeSubmission` (9 fields) | Same shape, unchanged | **preserved** |
| Write destination | `$REPO/.claude/teams/FR/wiki/<dir>/<slug>.md` | xireactor `entries` table under FR-private or FR-owned shared-read zone | **reshaped substrate, preserved shape** |
| Dedup protocol | Four outcomes (no / exact / similar / disputed) | Identical | **preserved** |
| Acknowledgment timing | Same-window | Same-window (xireactor write is sync) | **preserved** |
| Protocol B query format | `KnowledgeQuery` (4 fields) | Same + optional `zoneFilter` + optional `includeSuperseded` | **preserved + new optional fields** |
| Protocol B response format | `KnowledgeResponse` with `sources: string[]` | `sources: QualifiedSource[]` | **reshaped** (gate 2 — see §1.4) |
| `gapNoted` stubs | Per-response, tracks team ignorance | Unchanged | **preserved** |
| URGENT-KNOWLEDGE routing | Cal → team-lead → affected agent | Unchanged for intra-tenant | **preserved** |
| Protocol C promotion | Librarian → team-lead → common-prompt | Unchanged | **preserved** |
| Wiki provenance frontmatter | YAML frontmatter | DB columns, same fields | **reshaped substrate, preserved shape** |
| Dual-hub routing (Cal vs team-lead) | Knowledge → Cal; work → team-lead | Unchanged | **preserved** |

**Net effect**: Protocol A is essentially untouched for the 90% case. The only producer-side visible change is Protocol B's `sources` reshape from `string[]` to `QualifiedSource[]` — that's one typed-contract break, well-bounded, with cross-read at code-land time.

### 5.2 The cross-tenant column (Flow B, §2.2, Flow C, §2.3)

| Element | Current FR | Shared-substrate cross-tenant (co-owned, shared-write zone) | Status |
|---|---|---|---|
| Submission entry point | Protocol A to own librarian | Protocol A to own librarian (unchanged for the specialist) | **preserved (at the specialist level)** |
| Cross-tenant proposal format | **did not exist** | `CrossReviewProposal` (new interface, wraps original `KnowledgeSubmission`) | **new** |
| Cross-review routing | **did not exist** | Librarian → xireactor staging Tier 3 → other tenant's librarian via bootstrap preamble | **new** |
| Cross-review verdict format | **did not exist** | `CrossReviewVerdict` = Accept / NeedsRevision / Reject | **new** |
| Durable disagreement terminal state | **did not exist** | `CrossReviewReject.suggestDurableDisagreement = true`; both intra entries preserved per Monte §3.6.2 | **new** |
| Simultaneous-discovery synthesis | **did not exist** | `CrossReviewProposal.isSimultaneousDiscoverySynthesis = true`, both originals in `crossReferences`, fresh synthesis in shared-write | **new** |
| Ownership transfer | **did not exist** | 4-interface ritual on existing xireactor comments (§2.3) | **new** |
| Cross-review session_init delivery | **did not exist** | `SessionInitPreamble.pendingCrossReviews` (§3) | **new** |
| Cross-tenant URGENT-KNOWLEDGE routing | **did not exist** | **STILL OPEN** — depends on authority model. See §6.1 | **open** |

**Net effect**: the cross-tenant column is **entirely net-new protocol shape**. Nothing was "reshaped from Protocol A"; Protocol A was preserved for intra-tenant (column 1) and a sibling protocol was designed for cross-tenant (column 2). This is Aen's prediction from the heads-up message: "you're designing a NEW protocol shape for the cross-tenant path (not remapping Protocol A onto the whole substrate)." Confirmed.

### 5.3 The one genuinely cross-column concern

Protocol B's reshape of `sources` / `relatedEntries` to `QualifiedSource[]` appears in column 1 (intra-tenant) as the only preserved-shape change. It's also implicitly needed for column 2 because a query result can legitimately mix intra-tenant entries, cross-tenant shared-read entries, and co-owned entries in the same response. The reshape is therefore required by column 2's existence even though it appears in column 1.

This is why it's the one typed-contract break in the entire pilot: it's the only protocol element where intra-tenant and cross-tenant semantics *mix in the same wire message*. Every other element is cleanly column-separable.

## 6. Dependency flags

### 6.1 Monte — authority model (mostly resolved; one item still open)

Monte's governance doc resolves the tenancy-model questions v1 flagged. One remains:

- **Cross-tenant URGENT-KNOWLEDGE authority — OPEN, deferred to future authority-model doc** (Aen's framing, v1.2). When Cal identifies a pattern in FR that may invalidate in-flight work on the apex side, does her urgent-knowledge authority extend into apex's work hub? Into apex's librarian? Through whom? Monte's §2.2 establishes that Cal has read-only visibility into apex's shared zones, but URGENT-KNOWLEDGE is a *routing* authority, not a read authority, and no current doc resolves cross-tenant routing authority. **Pilot v1.2 default (endorsed by Aen):** intra-tenant URGENT-KNOWLEDGE works as today (Cal → team-lead → agent); cross-tenant URGENT-KNOWLEDGE goes through team-leads as human escalation rather than through the librarian channel. Ugly but conservative — same structural shape as Cal's fail-closed default on the §4 MCP-unavailable question. **Explicit non-goal for this session:** do not try to solve cross-tenant URGENT-KNOWLEDGE in the pilot window; it needs its own Monte/Herald pass in a follow-up authority-model doc. Aen has flagged it as an OPEN item in his scratchpad.

### 6.2 Cal — librarian migration cost (now MEDIUM, was HARD)

With Monte's asymmetric model, Cal's migration cost is dramatically smaller than v1 estimated:

- **Protocol A handling: zero change for the 90% case.** Cal's existing classification, dedup, and ack workflow runs unchanged for Flow A.
- **New pre-classification step (Monte §7.3):** Cal's prompt needs an "intra-tenant vs cross-cutting" zone decision before classification. Default is fail-closed to intra-tenant private per Monte §7.3's explicit rule. Small prompt edit.
- **New Flow B handling:** Cal learns to wrap an accepted Protocol A submission in a `CrossReviewProposal` and release it to staging. This is a new workflow but structurally similar to `PromotionProposal` (existing Protocol C).
- **New bootstrap-path step (Monte §5.3, §7.3):** Cal's session startup reads `SessionInitPreamble.pendingCrossReviews` after the existing inbox restore. Small prompt edit, mirrors the existing "read prior scratchpad" step.
- **Sources reshape (gate 2):** Cal's response format for Protocol B now emits `QualifiedSource[]` instead of `string[]`. Modest prompt edit; Cal already holds the structural information internally.

**Cal dependency: MEDIUM, not HARD.** Ask: does Cal agree this is tractable as a prompt edit without a dedicated implementation cycle? If yes, v1.1 can stand; if Cal flags unforeseen cost, §2.2 Flow B shape may need adjustment.

### 6.3 Brunel — host topology + audit container (substrate, not protocol)

Monte's §7.1 flags:

- Host topology (DB-per-tenant / schema-per-tenant / row-level). Affects how tenancy is enforced at the Postgres level.
- Audit container (§4.1 Check 3) — read-only mount of xireactor's schema snapshot.

Protocol-shape doc is not blocked on these, but the protocol design's validity depends on them. If Brunel picks row-level-only RLS and a misconfiguration leaks the other tenant's data, the protocol shape is sound but the substrate is broken. Flagging as **substrate dependency, not protocol dependency**.

Also aimed at Brunel during substrate stand-up: the source-code check for §A.2 (does session_init leak denormalized global data?). One-time read, not a feature request.

### 6.4 Soft dependencies

- **Finn** and other FR specialists — consume `QualifiedSource[]` correctly when the reshape lands. Low risk, structural reader.
- **Eratosthenes** — mirror prompt edits to Cal's (Flow B handling, bootstrap-path step, pre-classification rule). Out of FR's scope; Aen routes to apex-research.
- **Aen (team-lead)** — soft pending on cross-tenant URGENT-KNOWLEDGE (§6.1).

## 6.5 Preconditions status — gating

Aen flagged two xireactor substrate capabilities as gating on the pilot thesis. Monte's strategic asymmetric governance (intra-tenant: staging disabled; shared-write: staging active) requires both. This section states the status of each honestly, using Aen's three-outcome taxonomy.

**Taxonomy (from Aen's flag):**

- **(a) Capability already exists in xireactor v0.2.0** → no upstream work, pilot proceeds as designed.
- **(b) Capability needs a xireactor enhancement** → PO decision on investing in upstream contributions (cost + timeline hit).
- **(c) Digest is silent or ambiguous** → deeper xireactor investigation (second-pass survey) before the pilot can be sequenced.

### 6.5.1 Precondition 1 — per-zone staging enablement

**Question:** Can xireactor's tier-assignment logic be configured to *skip staging* for intra-tenant writes (Flow A), while routing shared-write (Flow B) to Tier 3?

**Digest evidence:** `xireactor-brilliant-digest-2026-04-15.md` line 35 describes tier assignment inputs as `(change_type, sensitivity, source, role)`. Zone, tenant, and `org_id` are NOT named as tier-assignment inputs.

**What the digest does NOT say:**

- Whether the tier lookup has a hardcoded minimum-tier floor that prevents a "tier-0 / skip" resolution.
- Whether xireactor's submission API accepts a `sensitivity` tag from the client (which would allow sensitivity-based encoding) or whether sensitivity is computed server-side from other inputs.
- Whether the tier-assignment logic can distinguish "librarian-on-own-tenant" (intra) from "librarian-on-other-tenant" (inter) given only the four named inputs.

**v1.1's provisional extrapolation:** each tenant has one librarian, so `(source=fr-librarian, role=kb_editor)` uniquely identifies intra-tenant FR writes, and the tier lookup can return "skip" for that combination. This is a *plausible inference* from the four named inputs but **it is not a digest fact** — it assumes the tier lookup supports the combinatorial resolution I described, which the digest does not confirm.

**Outcome (v1.2 landing): (c) — digest silent/ambiguous.**

**What needs to happen before the pilot can proceed:** someone clones `thejeremyhodge/xireactor-brilliant` v0.2.0 and reads the tier-assignment code in `api/` (most likely `services/staging.py` or equivalent — Finn's digest doesn't enumerate the file tree) to determine:

1. Is the tier lookup a pure data table (editable configuration), or is it a code path with compiled-in logic?
2. Does the lookup support a "skip staging" / tier-0 resolution at all?
3. If yes to both, does the `(source, role)` combination uniquely discriminate intra vs inter for a single-librarian-per-tenant pilot?
4. If no to any of the above, what's the scope of a xireactor enhancement to add one of: (i) a `zone` input to the tier lookup, (ii) a tier-0 "skip staging" resolution, (iii) a tenant-aware `source` encoding?

**If any enhancement is required**, the outcome shifts from (c) to (b) and lands on the PO's desk as "invest in upstream xireactor contribution OR abandon the strategic-asymmetric model." Outcome (b) is NOT outcome (a); it is a cost-gated path.

**If (1) and (2) are both "yes" under Finn's tier-is-pure-data summary**, the outcome shifts from (c) to (a) — but Finn's digest framed the tier-assignment as "pure data" at a high level, which is compatible with either (a) or (b) depending on the floor question above.

**This is my highest-priority open item.** Protocol-shape work that locks typed contracts for Flow B is contingent on this resolving favorably.

### 6.5.2 Precondition 2 — tenant-scoped session_init preamble

**Question:** Can xireactor's `session_init` preamble be tenant-scoped so that Callimachus sees FR-side pending cross-reviews and Eratosthenes sees apex-side pending cross-reviews, without leaking the other tenant's pending-work state?

**Digest evidence:** Line 27: "Pending Tier 3+ items surface in the `session_init` preamble." Line 29: "The API layer does `SET LOCAL app.user_id/org_id/role/department` per transaction."

**What the digest DOES establish:**

- `session_init` delivers pending Tier 3+ items to the agent at session start.
- The API layer has per-transaction `SET LOCAL app.org_id` discipline with RLS force on tenant-scoped tables.

**What the digest DOES NOT say:**

- Whether the `session_init` endpoint's query runs inside a transaction that has already executed `SET LOCAL app.org_id` (in which case RLS naturally scopes the preamble) or outside (in which case RLS doesn't apply and the preamble leaks cross-tenant).
- Whether the preamble payload includes any denormalized global state (instance-level counters, activity feeds, "new entries this week" summaries, Tier 4 escalations) that is NOT routed through an RLS-governed table and therefore bypasses tenant scoping entirely.
- Whether the `session_init` endpoint's return shape has a tenant field at all, or whether it blindly returns "pending items for the current role" and assumes the caller is single-tenant.

**v1.1's provisional inference:** "RLS force + `SET LOCAL app.org_id` on every transaction = session_init is tenant-scoped by construction." This inference holds *if and only if* the session_init endpoint's queries run inside RLS-governed transactions, which the digest does not confirm.

**Outcome (v1.2 landing): (c) — digest silent/ambiguous.**

**What needs to happen before the pilot can proceed:** source read of `session_init` endpoint implementation in xireactor's API layer, checking:

1. Does it use `SET LOCAL app.org_id` before the pending-items query?
2. Does the pending-items query run against RLS-force tables only, or does it include any global/denormalized state?
3. What is the preamble payload's return type? Is the response shape tenant-aware?

**If all three are satisfied**, outcome shifts to (a). **If any is missing**, outcome shifts to (b) — "remove denormalized state from preamble" or "add RLS context before query" — which are plausible small patches, not structural changes, but they are still enhancements and need PO visibility.

**This is also highest-priority open**, though lighter to resolve than precondition 1 (a one-file source read vs a tier-lookup architecture audit).

### 6.5.3 What "deeper investigation" looks like

Both (c) outcomes point at the same next action: **a second-pass xireactor survey that reads source files, not just documentation.** Finn's first-pass digest was structural (README, spec list, ROADMAP, CONTRIBUTING, data-flow summary) and correctly budgeted ~10 tool uses. A second-pass survey answering both precondition questions has a different shape:

- Clone the repo locally (or point an xireactor-aware agent at a read-only mirror).
- Read `api/services/staging.py` (or equivalent) for tier-assignment logic and configurability.
- Read `api/routers/session_init.py` (or equivalent) for preamble query shape and RLS context.
- Budget: ~20–30 tool uses for a 2-question targeted read.

**Who does this?** Either a second Finn session or a different FR specialist with code-reading budget. This is a substrate-investigation task, not a protocol-design task; I (Herald) am not the right agent for it — my scope is contract shapes, not code archaeology. **Flagging to Aen for dispatch decision.**

### 6.5.4 Dependencies — what does NOT unblock this

To be explicit about what won't help:

- **Brunel standing up the substrate** won't answer either question by itself; the stand-up might *reveal* the answer operationally (tier lookup rejects the config, session_init leaks), but an operational discovery is a failure mode, not an evaluation. Evaluation comes first.
- **Monte ratifying his governance doc** doesn't resolve these; Monte's model *requires* these capabilities but doesn't create them.
- **Cal confirming the migration cost** doesn't depend on these — Cal's prompt edits are the same whether the preconditions land at (a), (b), or (c) because Cal doesn't see the staging layer directly.

The only thing that unblocks 6.5.1 and 6.5.2 is a source-code read of xireactor v0.2.0. Until that happens, the protocol doc's §2 (Flow B) remains contingent, and the typed contracts must not land.

## 7. Pilot rollout sequence (v1.2 — re-sequenced for preconditions gate)

v1.1 had typed contracts landing at step 5 before the precondition evaluation — that was sequencing past the gate. v1.2 puts precondition evaluation at step 3 and typed contracts at step 5, so the contracts only land once the preconditions are known.

1. **Pre-pilot: Monte's governance doc ratified by PO.** Blocking on PO, not on any team member.
2. **Second-pass xireactor source survey** (§6.5.3) — read `api/services/staging.py` and `api/routers/session_init.py` in xireactor v0.2.0 to evaluate precondition 1 and precondition 2. Dispatched to whoever Aen picks (likely a second Finn session). **Blocking on both preconditions.**
3. **Classify each precondition as (a), (b), or (c)**:
   - **(a) both preconditions exist** → proceed to step 4.
   - **(b) one or both need upstream xireactor contributions** → **PILOT HALTS** pending PO decision on investing in upstream work. Protocol doc does not land typed contracts until PO resolves.
   - **(c) survey inconclusive** → third-pass investigation or dispatch a different approach. Pilot halts.
4. **Brunel decides host topology and audit container pattern** (Monte §7.1). Can run in parallel with step 5 once step 3 has landed at (a).
5. **Typed contracts landed in `types/t09-protocols.ts`.** (Only runs if step 3 = (a), or if step 3 = (b) and PO has ratified the upstream investment plan AND the upstream work has shipped.) Additions: `CrossReviewProposal`, `CrossReviewVerdict` and variants, `OwnershipTransferProposal` and three siblings, `SessionInitPreamble`, `OwnershipTransferState`, `QualifiedSource`, `Zone`, `OwnershipState`, `ZoneFilter`. Reshape: `KnowledgeQuery` gains optional fields; `KnowledgeResponse.sources` / `relatedEntries` change type to `QualifiedSource[]`. Gate 2 cross-read clears on commit.
6. **Cal accepts migration cost estimate** (§6.2). Can run in parallel with step 5 — Cal's prompt edits don't depend on the precondition outcome.
7. **Cal's prompt edits** (§7.3 in Monte's doc — pre-classification rule, bootstrap-path step, Flow B handling, Protocol B response reshape).
8. **Eratosthenes's mirror prompt edits** (routed by Aen to apex-research).
9. **Xireactor instance stood up** with FR and apex as two tenants, zones configured per Monte §1.1, staging enabled only on shared-write (contingent on step 3 = (a) or b-completed).
10. **Flow A test**: Finn files Protocol A to Cal, lands in FR-private, no staging, query round-trip proves Protocol B and `QualifiedSource[]` shape.
11. **Flow B test**: Cal files a genuinely cross-cutting pattern, wraps in `CrossReviewProposal`, Eratosthenes sees it in her session_init preamble next session, verdict round-trip proves Flow B end-to-end.
12. **§3.6.2 land-grab test**: deliberately file two similar patterns one in FR-private and one in apex-private, auditor flags overlap, one librarian initiates synthesis per §3.6.2 step 2, both originals preserved, co-owned entry appears in shared-write. Verifies the race prevention.
13. **Ownership transfer test**: one explicit Flow C ritual, four comments, verify comment_type discipline holds and xireactor operator flip works.
14. **Go/no-go**: does the pilot produce signal for a 3rd tenant, or did we learn enough to stop at 2?

Steps 1–3 are the precondition gate. Step 3 is the decision point where the pilot either proceeds, halts on PO cost decision, or recurses on investigation. Steps 4–8 are the mechanical landing. Steps 9–13 are the pilot proper. Step 14 is the PO decision gate.

**The critical sequencing property**: no typed contracts land before step 3 resolves favorably. v1.1 had this backwards and would have committed protocol shapes that depended on an unverified substrate capability.

### 7.1 Pilot-instrumented asymmetry — Brunel's controlled experiment (v1.2 addition)

Brunel's suggestion, folded in here: during the pilot window only, configure the shared-write tier rules **asymmetrically** between the two tenants:

- **FR-originated co-owned writes**: Tier 3 (AI reviewer) **OFF**. Shared-write promotions from FR's librarian to the co-owned zone skip Tier 3 and route directly to Eratosthenes's review via the session_init preamble. FR-side governance is pure librarian-gate.
- **apex-originated co-owned writes**: Tier 3 (AI reviewer) **ON**. Shared-write promotions from apex's librarian pass through the Tier 3 AI reviewer with confidence-floor escalation before reaching Cal's review.

**What the asymmetry measures**: how much signal does the Tier 3 AI reviewer actually contribute over the human librarian gate alone? FR's arm produces the "librarian-only governance" baseline; apex's arm produces the "librarian + AI-reviewer governance" variant. The pilot window's accumulated cross-review events supply the comparison data. Post-pilot, the tier rules unify based on whatever the comparison reveals — if Tier 3 caught errors Cal would have missed, it stays on; if it only slowed things down, it comes off.

**Why this is a temporary deviation from the symmetric protocol**: v1.2's typed contracts specify a symmetric Flow B — both tenants' cross-review proposals pass through Tier 3 by default. The asymmetric configuration is a **pilot-window deviation** from the typed contract, implemented at the tier-lookup configuration layer (the same layer that precondition-1 depends on), not at the typed-contract layer. The typed contracts remain symmetric; only the runtime configuration is asymmetric during the pilot.

**Dependency on precondition-1**: Brunel's experiment design has the same gating dependency as the rest of Flow B — if xireactor cannot express "Tier 3 off for tenant A, on for tenant B" via tier lookup configuration, the experiment can't run. §A.1's "indirect encoding via (source, role)" extrapolation covers this case too: if `(source=fr-librarian, target=co-owned)` resolves to Tier-0 and `(source=apex-librarian, target=co-owned)` resolves to Tier-3, the asymmetry is a configuration, not a code change. **Same precondition-1 outcome-(c) caveat applies** — until a source survey confirms the tier lookup supports this shape, the experiment is provisional.

**Where this lands in the rollout sequence**: step 9 (instance stand-up) includes the asymmetric configuration. Steps 10–13 (flow tests) include both-direction Flow B tests — FR→apex and apex→FR — so the comparison is bilateral within the window.

**Pilot exit condition**: at the go/no-go step (step 14), report on the Tier 3 effectiveness comparison alongside the general pilot evaluation. Effectiveness signal is one input to "unify the tier rules" decision, not the only one — durable disagreements, governance latency, and governance miss rates all feed the same decision.

Naming this as a pilot-window deviation in the doc keeps it from becoming a permanent asymmetry by default. The symmetric typed contracts are the steady state; the asymmetric configuration is the instrument.

## 8. What this doc is NOT (v1.1)

- **Not a tenancy model.** Monte's doc is. This doc types the consequences.
- **Not a host topology.** Brunel owns that decision.
- **Not an adoption recommendation.** Monte's doc is marked "design proposal, not ratified"; this doc inherits the same status.
- **Not a Cal prompt rewrite.** Cal's prompt edits are listed as dependencies (§6.2) and enumerated by Monte §7.3.
- **Not an Eratosthenes prompt rewrite** — out of scope for FR.
- **Not a cross-tenant URGENT-KNOWLEDGE design** — flagged open (§6.1).
- **Not a Protocol C cross-tenant design** — intra-tenant Protocol C is preserved; cross-tenant common-prompt promotion is out of pilot scope (Monte §0 "Does not decide").
- **Not a typed-contract patch against `t09-protocols.ts`.** The interfaces in this doc are *specifications* for the patch; the patch itself lands in Rollout Step 5.

## §A. Answers to Monte's §7.2 questions (appendix — superseded by §6.5 for the preconditions)

**Read §6.5 first for the v1.2 landing on the two xireactor preconditions.** This appendix preserves v1.1's detailed digest-read reasoning, but its classification on A.1 and A.2 (SOFT / MEDIUM precondition) has been re-landed as outcome (c) "digest silent/ambiguous, deeper investigation needed" in §6.5. The prose below reflects v1.1's more optimistic reading and is preserved for the reasoning chain; the actual dependency classification lives in §6.5.

Monte §7.2 names three concrete questions aimed at me. Answering each with my read of xireactor's v0.2.0 capabilities per the `xireactor-brilliant-digest-2026-04-15.md`, plus flags where a source-code check is needed.

### §A.1 — Does xireactor v0.2.0 support per-zone staging enablement?

**Short answer: probably yes, via indirect encoding, but worth a source-code confirmation.**

**Reasoning from the digest (§3):** Tier assignment is described as a "lookup over (change_type, sensitivity, source, role)". Zone is not one of the four named inputs. However:

- **Indirect encoding via `source` + `role`**: each tenant has exactly one librarian in the pilot. The combination of `(source=fr-librarian, role=kb_editor)` uniquely identifies intra-tenant FR writes; similarly for apex. The tier lookup can return "tier-0 auto-approve / skip" for those combinations and "tier-3" for any combination involving a cross-tenant target. This is a **tier lookup table configuration**, not a code change.
- **Indirect encoding via `sensitivity`**: the pilot can declare FR-private and apex-private entries as `sensitivity=low` and shared-write as `sensitivity=high`. The tier lookup then routes `sensitivity=low` to tier-0 and `sensitivity=high` to tier-3. Cleaner semantically but requires that xireactor's submission API accepts a sensitivity tag — the digest doesn't say whether it does.

**Recommendation:** pilot configures the tier lookup table to encode intra-tenant skip via the (source, role) combination. This works in v0.2.0 as described in the digest without any enhancement request.

**Open risk:** if the tier lookup has a hardcoded minimum tier floor (some governance libraries prevent tier-0 from ever being a resolution), we need a v0.2.0 source read. The digest doesn't describe a floor, but absence of evidence isn't evidence of absence.

**Classification: SOFT precondition.** Pilot can proceed with the (source, role) encoding. Brunel stands up the instance and validates the tier lookup actually accepts the configuration; if it doesn't, the enhancement is a one-line tier-lookup extension, not a structural change.

### §A.2 — Does xireactor session_init support tenant-scoped preambles?

**Short answer: probably yes by construction, but the implementation detail matters.**

**Reasoning from the digest (§3):** "Every tenant-scoped table has RLS forced. The API layer does `SET LOCAL app.user_id/org_id/role/department` per transaction." And: "Pending Tier 3+ items surface in the session_init preamble."

If session_init's "pending Tier 3+ items" query runs inside a transaction that has already `SET LOCAL` the reader's org_id, then the RLS force automatically filters the result to the reader's tenant. The preamble is tenant-scoped **by construction** — leakage would require a bug in the session_init endpoint where it queries outside the RLS-enforced transaction.

**The implementation detail that matters:** does session_init use ONLY RLS-governed queries, or does it also return any denormalized global data (instance-level counters, activity feeds, "new entries this week" summaries)? Global data is RLS-blind and would leak cross-tenant.

**Recommendation:** before pilot, clone xireactor and inspect the session_init endpoint implementation in `api/`. Confirm it only queries tables with RLS force. If yes, zero change needed. If it includes global metrics, those metrics are removed from the preamble (one-line endpoint edit) or tagged as "instance-global, not tenant-sensitive."

**Classification: MEDIUM precondition.** Source-code read required before pilot, but likely no code change. **Flagging to Brunel** to do this check during the substrate stand-up, since he's the one cloning the repo.

### §A.3 — What wire format for the ownership-transfer ritual?

**Short answer: typed convention on xireactor's existing comments table. No schema change. See §2.3 for the four interfaces.**

The ritual is implemented as exactly four comments with four distinct `comment_type` prefixes (`ownership-transfer-proposal`, `ownership-transfer-accept`, `ownership-transfer-countersign` × 2). Xireactor v0.2.0 ships with a comments table and comment_type is a string column (the digest calls out comments as API-only, treating them as a reviewer primitive). The typed interfaces in §2.3 are the convention layer, not new storage.

Aggregation: "has this ritual completed?" is a query over comments on a given `entry_id` filtered by the four comment_types. Four-of-four present → xireactor operator (Brunel, or a designated role) is authorized to flip `owned_by`. Three-or-fewer present → the ritual is in progress, appears in `SessionInitPreamble.pendingOwnershipRituals` for whichever agent is next in line.

**Classification: deliverable, not precondition.** Matches Monte's §7.2 ruling. Zero xireactor enhancement needed.

### §A.4 — Meta note on the three answers

All three questions resolve to "v0.2.0 probably supports this via configuration, with zero or minimal code changes" — the confirmations are source-code-read tasks, not feature-request tasks. This is surprisingly favorable for the pilot: xireactor's native design (RLS + tier lookup + comments) turns out to already encode the primitives Monte's governance needs. The pilot asks xireactor to do what it was already shaped to do.

The one place I would *not* be surprised by a gotcha is session_init's denormalized-global-data question (§A.2). That's the most implementation-dependent of the three.

(*FR:Herald — v1.1, incorporating Monte's governance framing*)
