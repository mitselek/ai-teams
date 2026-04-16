# xireactor-pilot governance architecture (2026-04-15)

**Context:** mitselek/ai-teams#59 — xireactor-brilliant as shared-KB pilot evaluation. PO confirmed 2-tenant pilot pair: **FR** (framework-research) and **apex-research** (apex-migration-research). This document designs the governance boundaries between them on a shared xireactor deployment.

**Author:** Monte (FR governance architect)
**Status:** design proposal, not ratified
**Depends on:** `xireactor-brilliant-digest-2026-04-15.md` §3–§4; wiki entries `governance-staging-for-agent-writes.md` (#42), `bootstrap-preamble-as-in-band-signal-channel.md` (#43), `integration-seam-governance-impact.md`, `audit-independence-architecture.md`, `rule-erosion-via-reasonable-exceptions.md`.

---

## 0. What this document decides (and what it does not)

### 0.1 Three framing principles

The rest of this document is a set of structural mechanisms. The mechanisms rest on three framing principles that are worth naming before the mechanisms begin, because each principle has a philosophical commitment that is non-obvious and would, if rejected, invalidate the mechanism that depends on it.

1. **Isolation is the default, not sharing.** Every writable surface starts tenant-private; cross-tenant access is an opt-in per-entry act. A default-shared posture is cheaper in the short term and structurally catastrophic for authority drift in the long term, because drift happens by convenience and leaves no audit trail. Default-isolated means every crossing of the boundary is a deliberate, visible act. (Mechanism: §1 four-zone tenancy.)

2. **The `owned_by` invariant — `owned_by` never auto-flips; every path into `co-owned` is a deliberate ratified act.** This is the load-bearing structural claim of the entire three-state ownership model. There is no code path, no default, no migration accident, and no convenience shortcut that flips an entry into `co-owned` without an explicit ratification (either the §2.3 ownership-transfer ritual for existing entries or the §3.6 simultaneous-discovery protocol for new syntheses). If this invariant is violated anywhere, the asymmetric-governance model collapses — because `co-owned` is the *only* state the cross-tenant staging layer governs, and a silent auto-flip would let the governance layer be bypassed or misapplied. (Mechanism: §3.2.1 three-state model + §3.6 anti-race protocol.)

3. **Durable disagreement is a valid terminal state. Forced consensus is a failure mode.** When two tenants discover the same cross-cutting pattern and cross-review fails, each tenant keeps its own view — the disagreement is recorded, surfaced at the next sunset review, and lives durably in both wikis. The alternative — forcing a synthesis that neither tenant accepts — produces a canonical entry no one trusts, which is worse than two trusted tenant-local entries that visibly disagree. Cross-cutting pattern recognition is aspirational; consensus on cross-cutting patterns is not. (Mechanism: §3.6.2 step 5 rejection disposition.)

The three principles are not negotiated in this document. If the PO or a stakeholder wants to reject any of them, that rejection propagates to mechanism-level rework throughout the pilot. Calling them out here makes the propagation visible.

### 0.2 Scope

Decides:

1. **Tenancy model.** What is isolated-by-default, what is shared-by-default, who has write authority over what.
2. **Cross-tenant review flow.** What happens when a librarian from team A needs to review a write from team B.
3. **The librarian-asymmetry question.** Does the xireactor staging pipeline co-exist with librarian gates, collapse into them, or get used asymmetrically?
4. **Authority-drift structural checks.** What stops either tenant from silently acquiring ownership of shared space.

Does not decide:

- Protocol surface (which MCP tools cross tenant boundaries, which wire format). Flagged to Herald — see §7.2.
- Cal's librarian-protocol edits required to honor the model. Flagged to Cal — see §7.3.
- Whether to adopt the pilot at all. That is a PO decision after this design is reviewed.

Converged with adjacent architects (not decided in this document alone):

- Host topology — converged with Brunel on **row-level-only** (single instance, single DB, `app.org_id` RLS, with three-state ownership as a first-class `owned_by` column). The convergence is recorded in §7.1 along with the reasoning for the reversal from my v1 schema-per-tenant recommendation.

## 1. Tenancy model

### 1.1 Default isolation — FOUR zones

Every writable surface on the shared xireactor instance belongs to exactly one of four zones. The zone determines who can read and who can write.

| Zone | Read by | Write by | RLS default |
|---|---|---|---|
| **FR-private** | FR tenant only | FR librarian only | `tenant_id = FR` enforced |
| **apex-private** | apex tenant only | apex librarian only | `tenant_id = apex` enforced |
| **shared-read** | both tenants | owning librarian only | `tenant_id IN (FR, apex)` read, `tenant_id = owner` write |
| **shared-write** | both tenants | either librarian (with cross-review) | `tenant_id IN (FR, apex)` read+write, authorship tagged |

The **shared-read** zone is the load-bearing novelty. An entry in shared-read is *authored by one tenant's librarian* but *readable by agents of both tenants*. This is how cross-cutting patterns become cross-tenant knowledge without requiring joint authorship.

The **shared-write** zone is small by construction and entered deliberately — see §3.

**Default for new entries: FR-private or apex-private.** An agent proposing a new entry defaults to its own tenant's private zone. Promotion to shared-read or shared-write is an explicit act by the owning librarian, not a default.

### 1.2 Write authority rules

Following #42's framing (governance-staging as the write path) and FR's existing `audit-independence-architecture` decision (Medici reads from a read-only mount, does not write), the write-authority rules are:

1. **Librarian-only writes.** No non-librarian agent writes to any KB zone directly. All proposed mutations route through the owning tenant's librarian inbox via Protocol A. This preserves FR's current one-gate model inside each tenant.
2. **Ownership is sticky.** Once an entry is filed in a zone, its `owned_by` field is immutable except via a ratified ownership-transfer protocol (see §2.3). Librarians cannot retroactively re-classify another tenant's entries as their own.
3. **Cross-tenant writes require cross-review.** A write to shared-write that originates from one librarian must pass the other librarian's review before promotion. This is the only case where the 4-tier xireactor staging pipeline is exercised in the pilot — see §3.
4. **Shared-read writes stay single-authority.** A shared-read entry is authored by one tenant's librarian. The other tenant reads it. No joint-authorship mechanism exists for shared-read; if cross-authorship is wanted, the entry must be promoted to shared-write (which triggers cross-review on every subsequent mutation).

This means FR's librarian (Callimachus) can file entries that apex-research agents read without ever asking apex-research's librarian (Eratosthenes) for permission — as long as the entry is in FR-private or FR-owned shared-read. The moment FR wants to touch an entry that Eratosthenes owns, the cross-review flow engages.

### 1.3 What is shared-by-default

**Nothing that can be written.** Shared-read and shared-write are opt-in zones; entries land there only via explicit librarian action. The *readable by default* zone for both tenants is limited to:

- The xireactor instance's own schema (users, permissions, tier assignments) — operational state, not knowledge.
- A small shared-read "pilot ground-truth" area that documents the pilot itself (this doc's conclusions, the governance contract, the tenant roster). Owned jointly by convention, mutated only via §3's cross-review flow.

**Rationale.** Defaulting to isolation and requiring explicit acts to cross the boundary is the RLS posture that makes authority drift (§4) structurally difficult — drift requires a librarian to actively assert cross-tenant authority, which leaves an audit trail. A default-shared posture would let drift happen by convenience ("I wrote it in shared space because that was the easier option at 2am").

## 2. Write authority — details

### 2.1 Each tenant's librarian is the sole write gate for that tenant's owned entries

Callimachus gates all writes to FR-owned entries (FR-private, FR-owned shared-read, FR-authored shared-write proposals). Eratosthenes gates all writes to apex-owned entries symmetrically. This matches FR's current Protocol A single-gate model unchanged for the intra-tenant case.

The librarian's gate is the **first** gate on every write. Nothing reaches xireactor's staging pipeline until the owning librarian has Protocol A-classified and accepted the submission. If the librarian bounces (redirect-template), the submission never enters staging. This is a deliberate choice and is where the librarian-asymmetry decision (§3) applies.

### 2.2 The other tenant's librarian has read-only access to your owned entries

Eratosthenes can *read* all FR-owned entries that live in shared-read or shared-write. She cannot mutate them, cannot change their ownership, cannot re-classify them. She can reference them in apex-owned entries (cross-references are reads, not writes). If she believes an FR-owned entry is wrong, her recourse is a comment (xireactor has comments, API-only per the digest §2) or a proposal filed in apex-private with a cross-reference back to the disputed FR entry.

This preserves a property FR already relies on: **the team that owns a decision is the team that owns the revision history for that decision.** Revision-forking into another tenant's scratchpad would fragment the history even if both librarians agreed to the change.

### 2.3 Ownership transfer is a ratified protocol, not a librarian courtesy

If both librarians agree that an entry should change tenants (e.g., it started as FR-owned but is now primarily apex-relevant), the transfer requires:

1. Source librarian files a formal transfer proposal (xireactor comment on the entry, tagged `ownership-transfer-proposal`).
2. Target librarian acknowledges via their own comment, tagged `ownership-transfer-accept`.
3. Both team-leads countersign (SendMessage → comment on the entry) — this is a structural check against corrosion (§4.2): ownership transfers are visible to human team-leads, not a librarian-only lane.
4. The xireactor operator (not a librarian) flips the `owned_by` field. Librarians do not mutate `owned_by` directly.

Rationale: ownership is the primitive that makes all other authority rules work. Allowing either librarian to flip it unilaterally collapses the whole model. Requiring a four-signature ritual (two librarians + two team-leads) makes ownership transfer deliberate enough that it leaves an audit trail every time.

## 3. The librarian-asymmetry decision

### 3.1 The scope brief's framing

The brief poses this as a choice: the xireactor staging pipeline was designed assuming `tenant = direct-write agents` (staging IS the governance layer). In our pilot, `tenant = librarian-gated writes` (librarian IS the governance layer, Protocol A + human-gate). So:

- **Bug** — double coverage, collapse staging into librarian gate, disable staging.
- **Feature** — defense in depth, keep both layers active on every write.
- **Strategic asymmetric use** — assign each layer a different boundary, use them non-redundantly.

### 3.2 Decision: **strategic asymmetric use**

**Rule:** The librarian gate (Protocol A) governs the **intra-tenant** boundary. The xireactor staging pipeline governs the **inter-tenant** boundary. They meet at exactly one point — the shared-write zone — and nowhere else.

#### 3.2.1 The ownership boundary is first-class

If we lock in strategic asymmetric use, the intra/inter boundary stops being an implementation detail and becomes the primary structural element of the pilot. Every entry in xireactor has exactly one of three ownership states — **owned-by-FR**, **owned-by-apex**, or **co-owned** — and that state determines which governance layer applies.

| Ownership state | Zones that carry it | Governance layer that applies |
|---|---|---|
| `owned-by-FR` | FR-private, FR-owned shared-read | Protocol A + Cal (intra-tenant) |
| `owned-by-apex` | apex-private, apex-owned shared-read | Protocol A + Eratosthenes (intra-tenant) |
| `co-owned` | shared-write (including shared-pilot-ground-truth) | xireactor staging pipeline + cross-review (inter-tenant) |

Two properties fall out of naming it this way:

1. **`co-owned` is the *only* state the staging layer governs.** Protocol A is sufficient for the two single-ownership states. This is exactly the "doubled-coverage collapses because each layer governs a different boundary" observation Aen flagged as load-bearing — once we name ownership as a three-state first-class attribute, the collapse is mechanical rather than argumentative.
2. **State transitions are the only operations that need cross-layer coordination.** A write within a state stays in its state's layer. A write that *changes* state (e.g., FR-owned → co-owned) crosses layers, and those transitions are precisely the cases §2.3 (ownership-transfer ritual) and §3.6 (simultaneous discovery) govern. Everything else is a steady-state intra-layer operation.

Two schema fields carry this distinction and must not be conflated:

- **`owned_by`** is the authority field. It is a three-valued enum (`FR`, `apex`, `co-owned`) and it alone selects the governance layer. `owned_by = co-owned` is the type-tag that fires the cross-review mutation contract.
- **`created_by`** is the provenance field. It records which librarian originally filed the entry. It is **historical-only** and grants no authority — an entry with `owned_by = co-owned` and `created_by = callimachus` is NOT "FR-ish co-owned"; it is fully co-owned, with Cal's name preserved only in the provenance trail. Mutations to a `co-owned` entry require cross-review regardless of `created_by`.

The separation matters because a grant-flag model ("tenant-id + boolean shared") collapses provenance and authority into one field, and the grant can be unilaterally revoked by the origin tenant. The three-valued `owned_by` is structurally un-revokable-by-one-party: flipping out of `co-owned` back to a single-tenant state is a state transition requiring the §2.3 ritual, not a flag flip.

The practical consequence: when Cal, Herald, or Brunel is designing a workflow, the first question to ask is "what ownership state does this touch, and does the operation change state?" The answer selects the layer and the protocol unambiguously.

Concretely, by zone:

| Zone | Ownership state | Librarian gate | Staging pipeline | Why |
|---|---|---|---|---|
| FR-private | `owned-by-FR` | active | **disabled** | single-gate is cheaper, no cross-tenant risk |
| apex-private | `owned-by-apex` | active | **disabled** | same |
| FR-owned shared-read | `owned-by-FR` | active (FR librarian) | **disabled** | single-authority, apex reads don't create risk |
| apex-owned shared-read | `owned-by-apex` | active (apex librarian) | **disabled** | same |
| shared-write | `co-owned` | **active (both librarians)** | **active, all 4 tiers** | only state where cross-authority matters |

### 3.3 Why this is not a bug (double coverage)

The "double coverage is waste" argument assumes both layers govern the same boundary. They don't. The librarian gate governs the "is this knowledge well-formed and classified correctly?" question — a judgment question that requires tenant-context expertise. The staging pipeline governs the "does this cross-tenant mutation pose conflict/confidence/sensitivity risk?" question — a boundary question. Collapsing them would lose the boundary question: a single librarian reviewing a cross-tenant mutation has no structural enforcement of "the other tenant's librarian must agree."

### 3.4 Why this is not a feature (defense in depth)

The "always-on defense in depth" argument wants both layers active everywhere. The cost is real: staging all intra-tenant writes through xireactor's 4-tier pipeline adds latency to submissions that don't need the additional governance. FR's wiki is at 41 entries with one librarian and no backlog. Adding a staging stage to FR-private writes is overhead that protects against a risk that isn't present. Per #42's "When to Adopt the Infrastructure" section: the staging layer earns its place only when a specific trigger fires, and none of those triggers are present for the intra-tenant case in this pilot.

### 3.5 Why strategic asymmetric use is right

Three reasons:

1. **Each layer does what it's shaped to do.** Protocol A + Cal was designed for same-window classification with tenant-context expertise. Xireactor staging was designed for policy-gated cross-boundary writes with tier lookup. Assigning them to the boundaries they match preserves both designs.
2. **The cost/benefit profile aligns with frequency.** Intra-tenant writes are common (most writes). Cross-tenant writes are rare (only the shared-write zone, opted into deliberately). Cheap governance on the common case, expensive governance on the rare case, is the allocation that makes the pilot sustainable.
3. **The staging pipeline's Tier 3 (AI reviewer with confidence floor) is specifically valuable at the cross-tenant seam.** An AI reviewer reading a proposed cross-tenant write has to decide "would the other tenant's librarian accept this?" — a judgment about a librarian who isn't yet in the loop. The confidence-floor discipline (#42 §"The Discipline") is exactly the right policy for this: if the reviewer can't be confident the other librarian will accept, escalate to the actual other librarian. It is a pre-review filter, not a replacement for the other librarian's review.

### 3.6 The simultaneous-discovery / disagreement case

Aen flagged the specific case Cal and Eratosthenes will eventually hit: **both librarians discover the same cross-cutting pattern independently, and both want to own it.** Under the three-state model (§3.2.1), the question is: does the staging pipeline naturally broker this, or does `owned_by` create a land-grab race where whichever librarian files first "wins"?

#### 3.6.1 The race exists if we're not careful

If Cal files an FR-private entry that turns out to be cross-cutting, and Eratosthenes independently files an apex-private entry on the same pattern one hour later, both entries exist in their respective tenant-private zones with no shared state. The race is not "who files first gets staging" (nothing reaches staging — both are intra-tenant writes). The race is "who notices first, because once one is noticed the other is a duplicate." That race is **symmetric between the two librarians** and has no winner; both entries are legitimate intra-tenant filings until someone sees both.

The real question is what happens *after* both filings exist and someone — probably the auditor (§4.1 Check 3) — flags the overlap.

#### 3.6.2 The protocol: both as proposers, neither as owner-by-default

When an overlap is identified:

1. **Neither FR-owned nor apex-owned auto-promotes to co-owned.** The two existing intra-tenant entries stay where they are, untouched. `owned_by` does not flip. This is the key anti-race property: there is no "I filed first, therefore I own it" path.
2. **A fresh co-owned proposal is filed in shared-write**, with both existing entries as source references. The proposer of the co-owned entry is whichever librarian identified the overlap (typically via auditor flag); the other librarian is automatically enrolled as co-reviewer. Both of the existing intra-tenant entries become part of the provenance trail on the new co-owned entry.
3. **The co-owned proposal enters staging at Tier 3.** The AI reviewer applies confidence-floor routing. Cross-review happens between Cal and Eratosthenes via §5.1's bootstrap-preamble channel, with neither librarian in a "proposer" vs "reviewer" power asymmetry — both contributed source material, both review the synthesis, both must accept.
4. **Once the co-owned entry is accepted:** both original intra-tenant entries get a `superseded-by: <co-owned entry id>` reference. They are not deleted (source history is preserved), but subsequent mutations must use the co-owned entry. Loser of the race? There is no loser — both original entries are preserved as sources, and neither librarian "owned" the co-owned synthesis.
5. **If cross-review fails** (one librarian rejects the synthesis), the two intra-tenant entries remain as-is. Each tenant keeps its view. The overlap is a durable disagreement, visible in both tenants' wikis via cross-references, and is surfaced at the next sunset review (§4.1 Check 2) as a candidate for another attempt. **Disagreement is a valid terminal state** — forcing consensus on cross-cutting patterns that the two teams see differently is worse than letting each tenant hold its own view.

#### 3.6.3 Why this avoids the land-grab

> **The `owned_by` invariant (named, first-class):** `owned_by` never auto-flips; every path into `co-owned` is a deliberate ratified act. This is principle 2 from §0.1 and is the load-bearing claim the entire three-state ownership model rests on. Every mechanism below is a consequence of this invariant; if any mechanism appears to permit a silent flip, the mechanism is the bug, not the invariant.

Three mechanisms enforce the invariant in practice:

- **No default path, no convenience shortcut.** Every transition out of a single-ownership state into `co-owned` is deliberate and requires either the §2.3 ownership-transfer ritual (for existing entries) or the §3.6.2 fresh-synthesis protocol (for simultaneous-discovery cases). There is no third path — and in particular, there is no "auto-promote on cross-reference threshold" or "auto-promote on read-count threshold" convenience. Both of those would be invariant violations dressed up as features.
- **The co-owned synthesis is a distinct entry with distinct provenance.** It's not "Cal's entry promoted" or "Eratosthenes's entry promoted" — it's a fresh entry both librarians contributed to. No one's name is on it as sole author. The original intra-tenant entries are preserved with `superseded-by` references, not deleted or mutated. Distinct entries mean the race at filing time has no consequence: neither "winner" acquires structural authority over the other's original.
- **Cross-review is symmetric.** Per §5.2, the Tier 3 AI reviewer has no tenant allegiance; it routes, it doesn't decide. The actual decision is two equal librarians agreeing. This is the same mechanism that handles the non-simultaneous case (§5.1), just applied with two proposers instead of one.

**The staging pipeline does naturally broker the case — but only because the `co-owned` state is a distinct state, not a promoted version of either single-ownership state.** If we'd modeled ownership as two-state ("FR or apex") with co-ownership as "both bits set," the race would be real (whoever flips the second bit first "co-owns" the other's entry). The three-state first-class model (§3.2.1) is what makes the brokering mechanical, and the `owned_by` invariant is what keeps the three-state model from silently degrading into the two-state model under operational pressure.

**Migration and schema constraint.** The `owned_by` column MUST be `NOT NULL` and MUST default at insertion to the submitting librarian's single-tenant value (`FR` or `apex`), never to `co-owned`. A column default of `co-owned` — even if unreachable under normal writes — is an invariant violation at the migration layer, because a migration accident or an ORM default could silently drop rows into the co-owned state. The invariant is enforced at schema time, not just at application time.

#### 3.6.4 Flag for Cal and Eratosthenes

Cal's discipline-translation work (the §7.3 prompt edits) needs to document §3.6.2 as a standard protocol, not as an edge case. The simultaneous-discovery case is going to happen — both teams work adjacent spaces, and by design we want cross-cutting patterns to be recognized. When it happens, neither librarian should feel "I lost," and the protocol is the structural reason why. Eratosthenes needs the same framing. Flagged to Aen for routing the apex-side edit.

### 3.7 What this means for xireactor configuration

The pilot needs xireactor to support **per-zone staging enablement**. This may or may not be supported by v0.2.0 out of the box. Herald, please check: is the tier-assignment logic (change_type, sensitivity, source, role) rich enough to express "tier-0 / skip-staging for intra-tenant writes"? If yes, the pilot configures the tier lookup table to route intra-tenant writes to a no-op auto-approve tier. If no, the pilot needs a xireactor enhancement request before staging can be strategically asymmetric — which is a pilot precondition, not a post-pilot finding.

Related tier-assignment requirement for §3.6: the "fresh co-owned proposal" creation path needs to accept **two source-entry references** (one from each tenant's intra-tenant zone). The tier lookup should route any entry with >1 tenant-distinct source into Tier 3, automatically — this is the structural signal that simultaneous discovery is what we're handling.

## 4. Authority drift — structural checks

Authority drift is the risk that a tenant silently acquires write authority over shared space it shouldn't have. FR's wiki already documents the mechanism (`rule-erosion-via-reasonable-exceptions`): a rule exists, a reasonable-sounding exception presents itself, the rule weakens, and each subsequent exception is easier. In a two-tenant KB, the specific drift shape is: one librarian starts filing entries in shared-read that *should* be shared-write because they're cross-cutting and the quick path is "I'll file it FR-owned for now, we can promote later."

### 4.1 Three structural checks

**Check 1 — Ownership-transfer ritual (see §2.3).** Transferring ownership requires two librarians + two team-leads. Drifting a shared-read entry toward de-facto joint authorship requires either an ownership transfer (which trips the ritual) or persistent mutation of another tenant's owned entry (which the write authority rules forbid). Drift has no quiet path.

**Check 2 — Shared-read sunset review.** Every shared-read entry carries a `shared-read-promoted-at` timestamp. At a fixed cadence (monthly, run by a non-librarian auditor — see §4.3), the auditor lists all shared-read entries older than N days whose `accessed-by-other-tenant` count exceeds a threshold and asks: should this be promoted to shared-write? The review is the structural check that catches "I'll promote later" decisions that never got made. The sunset review is a read-only operation from outside the librarian process — it surfaces candidates, it does not mutate.

**Check 3 — Audit-independent tenant boundary report.** Medici (or its successor audit container per `audit-independence-architecture`) reads the committed xireactor schema snapshot and produces a boundary report per session:

- For each shared-read entry: who authored it, who read it, whose domain it *sounds* like (a simple keyword/path match against tenant scope declarations).
- For each shared-write entry: who authored the last N mutations, whether cross-review was recorded for each.
- **Drift signal:** shared-read entries whose domain-match flags the non-owning tenant. (FR owns an entry whose content is mostly about APEX migration patterns.)

The audit container writes nothing to xireactor — it emits a report that goes to both team-leads. Drift becomes a visible, signed, cross-team-audited event.

### 4.2 Why these three together

Any one check is insufficient:

- Ritual alone (§2.3) prevents unilateral transfers but doesn't catch entries that were wrongly zoned from the start.
- Sunset review alone catches wrong-zoning but doesn't prevent deliberate ownership grabs.
- Audit report alone surfaces drift but can't reverse it — it needs a ritual (§2.3) to correct identified cases.

Together they cover the three failure modes: deliberate grabs (ritual), accidental accumulation (sunset), and structural blind spots (audit). Each check has a different actor (librarians, team-leads, audit container) so no single role can silently corrupt all three.

### 4.3 Critical property — the auditor is neither tenant

The sunset review and the tenant boundary report MUST run from a role that is not Callimachus, not Eratosthenes, and not a team-lead. Running them from one of those roles makes the check recursive (the gate is reviewing itself) and lets drift happen by omission. `audit-independence-architecture` already establishes FR's stance: the auditor is a separate container reading from a read-only mount. The pilot inherits this — the auditor container reads xireactor's committed schema, does not hold write credentials, does not participate in either tenant's librarian process.

This is a non-trivial infrastructure ask. Flagged to Brunel (§7).

## 5. Cross-tenant review flow

This section describes the flow for a **shared-write zone mutation** — the one case where both librarians are in the loop.

### 5.1 Happy path

1. **FR agent** proposes a cross-cutting pattern to Callimachus via Protocol A.
2. **Callimachus** Protocol A-classifies the submission. If the submission belongs in shared-write (because it's cross-cutting and both tenants will mutate it), Cal files a **staging entry** in the xireactor shared-write zone, tagged with `proposed_by = FR`, `proposed_by_librarian = callimachus`, `status = awaiting_cross_review`.
3. **Xireactor tier assignment** routes the entry to Tier 3 (AI reviewer) — cross-tenant writes are by policy Tier 3 or higher. (Tier 4, human-only, is reserved for entries that touch shared pilot ground-truth; see §6.)
4. **Tier 3 AI reviewer** applies the confidence-floor discipline (#42 §Discipline). If confidence ≥ 0.7 and the recommended action is "forward to other librarian," the entry progresses. Otherwise (including any error), it escalates to Tier 4 — which in the pilot means "send to the other tenant's team-lead for disposition," not "auto-promote."
5. **Eratosthenes** receives the cross-review request via her normal librarian inbox (the bootstrap-preamble channel from #43). The xireactor `session_init` preamble surfaces the pending cross-review item as part of her wake-time read. **This is where #43's pattern earns its place in the pilot** — governance signals ride the channel Eratosthenes already walks.
6. **Eratosthenes** Protocol A-reviews the entry from apex's perspective. She can accept (entry promotes to shared-write, status `approved`), request changes (entry returns to Callimachus with her feedback, status `needs_revision`), or reject (entry bounces, status `rejected` with rationale).
7. **If accepted:** entry goes live in shared-write. Both tenants can now read it. Future mutations by either tenant re-enter this flow from step 2 (with the mutating librarian as "proposer" and the other as "reviewer").
8. **If rejected:** the rejection is durably recorded in the xireactor staging table's audit trail (xireactor retains rejected submissions per #42 "non-obvious cost" section — this is the audit-trail property FR currently lacks).

### 5.2 Handling the tier-3 reviewer when the reviewer is from a different team's librarian pool

The scope brief asks: how does the staging pipeline's review step work when the reviewer is from a different team's librarian pool? **Answer: the Tier 3 AI reviewer is not "from" either team's librarian pool.** It is a xireactor-instance-level role that applies the confidence-floor discipline to route entries toward the correct human librarian. It does not have tenant allegiance. Its job is filtering, not deciding.

The *actual* review happens at step 6, by the other tenant's librarian (a Claude agent with full tenant context), through the bootstrap-preamble channel. This preserves FR's property that "judgment decisions are made by the librarian who owns the affected tenant," because the Tier 3 reviewer is not making judgment decisions — it's making routing decisions with a confidence floor.

### 5.3 The session_init preamble channel is load-bearing

Cal's entry #43 already articulates why this works: durable state + bootstrap-path obligation + payload attachment. In the pilot, xireactor is the durable state, the librarian's session startup read (which already includes an inbox restore) adds a xireactor-session-init call, and cross-review items arrive through the preamble. The pattern is already established in FR; the pilot just adds a new payload class (governance, not continuity).

**One new constraint for the pilot:** both librarians' session-startup sequences must include the xireactor session_init read. This is a Cal-scope prompt edit and is flagged in §7. Without it, the preamble channel is unreliable (failure mode: "Bootstrap path not obligated" from #43's failure modes section).

## 6. The tiny shared-pilot-ground-truth zone

A small subzone of shared-write holds the pilot's own meta-state: this design doc's conclusions, the governance contract text, the tenant roster, the sunset-review cadence config. Mutating these entries requires Tier 4 — both librarians AND both team-leads countersign. This is deliberate overreach: the meta-state governs the rest, so it earns the heaviest gate.

Concretely, the tenant roster and the governance contract are the files that define "who is FR" and "who is apex." Letting librarians mutate them unilaterally would let a librarian change the rules of the game while playing. The Tier 4 constraint closes that loophole.

The sunset review and audit reports (§4) treat the shared-pilot-ground-truth zone as append-only reports, not mutations — the reports are written to a separate read zone, not by mutating the contract itself.

## 7. Cross-dependency flags

### 7.1 Brunel — host topology (CONVERGED: row-level-only)

**Status:** converged with Brunel's `docs/xireactor-pilot-host-architecture-2026-04-15.md` v0.1. Decision: **single-instance, single-database, row-level RLS via `app.org_id`, with the three-state `owned_by` column from §3.2.1 as a first-class attribute.** The staging layer governs exactly the rows where `owned_by = 'co-owned'`.

#### 7.1.1 Convergence history (my v1 recommendation was wrong)

My v1 recommended schema-per-tenant with a shared schema for shared-read and shared-write zones. I flagged row-level-only as "too thin — a single migration error could silently merge zones." This recommendation has been withdrawn. The reasoning for the withdrawal is worth recording because it is a structural lesson, not just a preference flip:

- **I was reaching for structural cues that the three-state ownership model already provides at a cheaper layer.** Schema separation was my attempt to give the cross-tenant boundary physical weight. Once §3.2.1 named the three ownership states as a first-class attribute, the structural cue was already in the data model — at the column level — and the schema boundary became redundant.
- **Schema-per-tenant would have forced me to put the co-owned zone in a "shared schema," which is itself a drift surface.** The `co-owned` state doesn't belong to either tenant, and a shared schema is a single place agents from both tenants write to — precisely the posture §1.1 rejects as a default. Schema separation reintroduces the shared-by-default anti-pattern it claims to prevent.
- **Brunel's counter-argument was structurally identical to §3.2.1, framed at the substrate layer.** From Brunel's v0.1: "physical separation makes the 'shared' claim vacuous at substrate level; upstream's model is row-based via `app.org_id`; schema separation would require patching upstream and violating upstream discipline." When my §3.2.1 sharpening landed, it obsoleted my own §7.1 recommendation at the same time — I just didn't notice until Brunel surfaced the row-level-only argument. Two architects converging on the same answer at different layers is strong signal the answer is load-bearing.
- **Row-level-only is not "too thin" under the three-state model.** My v1 concern was that a single migration error could silently merge zones. Under the three-state model with the schema constraint from §3.6.3 (`owned_by NOT NULL`, default must be single-tenant, never `co-owned`), the migration accident is a schema-layer error that would fail loudly, not a silent merge. The invariant is enforced at the migration layer, not just at the application layer.

#### 7.1.2 Flags that remain on Brunel's side

Topology convergence does not close all Brunel-side dependencies. Three remain:

1. **Audit container read-access pattern (§4.1 Check 3).** The audit container needs read-only access to xireactor's schema state — the options are a pg dump pipeline, a read replica, a read-only DB role on the primary, or a snapshot-to-object-storage approach. Each has different cadence and consistency trade-offs. This affects how often the tenant-boundary report can run (and therefore how quickly drift is surfaced) but not the governance model itself.
2. **Session_init source-code walkthrough (routed from §7.2 Q2).** Per Herald's medium-precondition classification, the v0.2.0 `api/routes/session_init` (or equivalent) needs confirming to produce every preamble field through the RLS role switch with no global-state bypass. Outcomes: pass (precondition met), partial (strip or route-through per field), fail (xireactor enhancement request). This is the highest-consequence remaining check — a silent cross-tenant leak here invisibly breaks the bootstrap-preamble channel (§5.3, #43). Brunel's infrastructure stand-up is the natural window to run it.
3. **Indirect-encoding operational feasibility (routed from §7.2 Q1).** The tier-lookup configuration that encodes zone via `source + target-zone` needs to be expressible in the v0.2.0 tier-assignment table without code changes, including the `auditor` source role from §7.2 Q1's design constraints. If it isn't, §7.2 Q1 upgrades from SOFT to HARD and we need a xireactor enhancement.

Outcomes on (2) and (3) feed back into pilot sequencing. They are the remaining gates, not the topology decision.

### 7.2 Herald — protocol surface

> **STALE CLASSIFICATION WARNING (2026-04-15 session close).** The SOFT / MEDIUM classifications below rest on Herald's v1.1 §A read of Finn's digest, which Herald **retracted on honest re-read** in his v1.2 (~19:32). Retraction rationale: the digest establishes per-transaction tenant context exists (line 29) and names tier-assignment inputs (line 35), but does NOT say whether `session_init` queries run inside that context, and does NOT name `zone` / `tenant` / `org_id` as tier-lookup inputs. Herald's v1.1 classifications were plausible extrapolations, not digest facts. Honest landing: **Q1 and Q2 are both outcome (c) — digest silent, source-code walkthrough required during infrastructure stand-up.** Q3 unchanged (DELIVERABLE).
>
> **This §7.2 is NOT being reworked in this session** — per team-lead direction, the rework is a future-session task when the governance architect is next awake for PO review. The SOFT and MEDIUM classifications below are preserved as historical context so the next-session reader can see the cascade and the correction together. **When acting on §7.2, use outcome (c) / (c) / DELIVERABLE, not the SOFT / MEDIUM / DELIVERABLE text below.**
>
> **Net PO-brief framing** (updated for the retraction): "two outcome-(c) source-code walkthroughs during infrastructure stand-up + one deliverable." This is still materially friendlier than the original "two hard preconditions requiring upstream contributions" — outcome-(c) walkthroughs are pass/fail checks against v0.2.0 source, not feature requests — but not as friendly as the v3 "one medium + one soft + one deliverable" story suggested. The convergence history (my v1 schema-per-tenant → v2 row-level; Herald's v1.1 SOFT/MEDIUM → v1.2 (c)/(c)) is itself evidence of the team's second-read discipline (§7.5).
>
> **Flag to next-session self:** when §7.2 is reworked, the corrected framing needs to land in §8 summary and in the §7.4 pilot sequencing section too. Both currently cite the retracted classifications.

---

Three questions, originally classified by Herald's v1.1 read (2026-04-15 19:35) as **SOFT** / **MEDIUM** / **DELIVERABLE** — retained below as historical convergence-history content, superseded by the retraction block above. **SOFT** = pilot workaround known, configuration-only; **MEDIUM** = source-code check required, outcome unknown; **DELIVERABLE** = post-pilot upgrade acceptable.

**Q1 — Per-zone staging enablement. Classification: SOFT precondition.**
The xireactor tier-assignment logic is "pure data — a lookup over `(change_type, sensitivity, source, role)`." Herald's read: the pilot can encode zone indirectly via the `source` field, since each tenant has a single librarian and the source-role determines the intra/inter boundary. The tier lookup gets configured to route `source = FR-librarian + target-zone = FR-owned → skip` (and symmetric for apex), with everything else routing to Tier 3. **Configuration, not code change.**

Two design constraints for the indirect encoding that must hold for the workaround to be sound:

- **Source-role enumeration must include non-librarian roles.** The enumeration is not `{FR-librarian, apex-librarian}`. It is `{FR-librarian, apex-librarian, auditor, xireactor-operator}`, with each role carrying its own tier-lookup row. This matters specifically for §3.6 simultaneous-discovery: when the auditor proposes a co-owned synthesis, the tier lookup must match an `auditor` source row and route to Tier 3. If the enumeration is librarian-only, auditor-proposed submissions fall through to the default, which **must** be Tier 3, not skip.
- **Submission-time zone ambiguity is a fail-open point.** The `target-zone` field is set at submission time by the librarian. If Cal misclassifies a cross-cutting submission as FR-owned, it enters staging with `target-zone = FR-owned` and skips the pipeline. The §4.1 Check 3 tenant-boundary report catches the misclassification on a lag via the `auditor pass → §2.3 ownership-transfer` path, but it is a lag-detection structural mitigation, not a prevention. The pilot should document this explicitly in its operational playbook so nobody builds on an assumption the tier lookup is a full guarantee.

If either constraint cannot be met in the tier-lookup configuration, the classification upgrades from SOFT to HARD and we need a xireactor enhancement request. Brunel's operational-feasibility validation (during infrastructure stand-up) is the check.

**Q2 — Tenant-scoped session_init. Classification: MEDIUM precondition, source-code check required.**
Herald's read on the mechanism: xireactor's RLS enforcement naturally scopes any query the session_init endpoint runs, so a preamble built by querying the staging table through the normal RLS-role-switch path WILL be tenant-scoped automatically — the other tenant's pending items don't appear because RLS hides them. **The risk is if session_init has any denormalized global state (instance-level counters, recent-activity feed, tier-assignment stats) that bypasses RLS.** That risk is unknown without reading the v0.2.0 api layer source.

**Why this is the highest-consequence flag of the three:** the bootstrap-preamble channel (§5.3, #43) is the load-bearing mechanism for cross-review delivery. A silent cross-tenant leak in session_init breaks the channel invisibly — both librarians still see preambles, but the content is wrong, and the failure mode surfaces only when one librarian notices a pending-review item that shouldn't be visible. This is the "bootstrap path obligated but one endpoint writes to the wrong root" failure mode Cal's #43 names explicitly.

**Routed to Brunel as part of infrastructure stand-up**: a source-code walkthrough of `api/routes/session_init` (or equivalent) confirming every query and field the endpoint produces passes through the RLS role switch, with no global state bypass. Outcomes:

- Pass → precondition met, pilot ships.
- Partial (some global state bypasses RLS) → decide per field whether to route through RLS, strip from the preamble, or request a xireactor enhancement.
- Fail (material leak) → xireactor enhancement request; pilot blocked on that fix.

**Q3 — Ownership-transfer wire format. Classification: DELIVERABLE, not precondition.**
Xireactor has comments (API-only per the digest §2). A `comment_type` string prefix or tag is a zero-code-change convention on top of existing infrastructure. The §2.3 four-signature ritual encodes as four comments tagged `ownership-transfer-proposal / ownership-transfer-accept / team-lead-countersign-{fr,apex}`, with the xireactor operator reading the four-tag set and flipping `owned_by` as a separate operational step.

Pilot-deliverable upgrade path: if ownership transfers become frequent post-pilot, promote the convention to a dedicated `ownership_transfer_proposal` table. Not earned at pilot scale.

### 7.2.1 Herald's v1.1 dependency on my §7.2 updates

Herald's protocol doc (`docs/xireactor-pilot-protocol-2026-04-15.md`, v1.1 in draft) is the consumer of this classification. His field set for the cross-tenant submission contract needs to carry:

- A `source-role` enum with the four values above, wired into the tier-lookup row.
- A `target-zone` field set at submission time, with a documented fail-open path to §4.1 Check 3.
- The `comment_type` tag vocabulary for the ownership-transfer ritual.

The cross-tenant protocol name is Herald's to pick — I have been using "Protocol A-prime" as a placeholder in messages; I will conform to his v1.1 name in my next revision pass.

### 7.3 Cal — librarian protocol edits (CONVERGED WITH MIGRATION ASSESSMENT)

**Status update:** Cal shipped `docs/xireactor-pilot-migration-assessment-2026-04-15.md` (v1). Her professional read is crucial and reshapes how §7.3 should be read: **full migration is a net downgrade for a tenant with a librarian; cross-tenant-writes-only pilot is a genuine upgrade.** Her load-bearing framing: *"filesystem affordances are load-bearing for librarian discipline; free enforcement → prompt enforcement is a regression even when prompt enforcement works."* My original §7.3 was written assuming the prompt edits were additive; Cal's assessment confirms they are, but only under the asymmetric-use model — the cost/benefit is structurally different from a full migration.

This turns §7.3 from a unilateral "Cal needs these edits" flag into a **consumer-side dependency on Cal's producer-side migration assessment**: her §6.4 pass/fail criteria (≥2 submissions, ≤10% auto-promote error, ≤1 session escalation latency) are the runtime acceptance gate for the edits below. If her criteria are not met in the pilot, the prompt edits go back to the drawing board regardless of whether they type-check.

#### 7.3.1 Cross-tenant classification rule

Current Protocol A classifies into FR's wiki structure (`patterns/`, `gotchas/`, `decisions/`, ...). The pilot needs a prior step: "is this submission FR-owned or cross-cutting?" If cross-cutting, the submission routes to the shared-write proposal flow (§5.1 step 2) instead of direct filing. This is a pre-classification zone check. The existing "when in doubt, file separately with cross-reference" default (from #42) already encodes fail-closed behavior and transplants cleanly: when in doubt, default to FR-private with a cross-reference to the cross-cutting question. **Never default to shared-write.** The `owned_by` invariant (§0.1 principle 2) forbids it.

#### 7.3.2 Bootstrap-path addition

Cal's session-startup sequence needs a xireactor session_init read step, positioned after the existing Step 5 (restore inboxes). The read returns pending cross-review items from Eratosthenes, which Cal processes before starting any other work. Failure to read is a startup failure, per #43's "bootstrap path obligated" requirement.

#### 7.3.3 Erosion resistance at the cross-review gate

Cal's prompt should also acknowledge that **erosion resistance (`rule-erosion-via-reasonable-exceptions`) applies especially strongly to the cross-review gate.** A cross-review request that Cal feels is "obvious, I'd approve it anyway" is exactly the erosion signal — name it and hold the gate, don't shortcut. The ritual exists to produce an audit trail, not to produce correct decisions (the decisions were already going to be correct).

#### 7.3.4 Symmetric apex-side edits

Eratosthenes needs the symmetric edits. I don't know apex-research's librarian prompt structure, so flagging this to Aen for routing.

### 7.4 Aen — pilot sequencing (DECIDED)

**Status:** decided by Aen 2026-04-15, ratified against Herald's §7.2 SOFT/MEDIUM/DELIVERABLE reclassification.

- **Per-zone tier-skip** → **precondition.** The asymmetric model does not work without it; indirect encoding via `source + target-zone` is the pilot configuration path (Herald SOFT, routed to Brunel for operational-feasibility validation during stand-up).
- **Tenant-scoped session_init** → **precondition.** The bootstrap-preamble channel does not work without it; silent cross-tenant leak here is the highest-consequence failure mode of the three (Herald MEDIUM, routed to Brunel for source-code walkthrough during stand-up).
- **Ownership-transfer wire format** → **pilot deliverable.** Convention on top of xireactor comments is sufficient; dedicated table is a post-pilot upgrade if transfers become frequent.

The net PO-brief framing: the pilot is blocked on one feasibility check (session_init RLS walkthrough) and one configuration validation (tier-lookup expressibility), not on two upstream xireactor enhancement requests. This is a materially friendlier story than the v1 classification suggested.

### 7.5 Three-specialist convergence signal

Three specialists independently converged on the asymmetric-cross-tenant-only shape from three different architectural layers:

- **Brunel (host substrate)** via `docs/xireactor-pilot-host-architecture-2026-04-15.md` v0.2 — row-level `app.org_id` with `owned_by` column, rejecting his own v0.1 Tier-3-on/off comparison once he folded in my §3 framing.
- **Monte (governance)** via this document — three-state `owned_by` invariant, strategic asymmetric use of staging pipeline.
- **Cal (discipline substrate)** via her migration assessment — filesystem affordances as load-bearing for librarian discipline, full migration = regression, cross-tenant-only = upgrade.

**The convergence is itself evidence.** Three specialists reaching the same structural answer from three different layers, with three different concerns in mind (substrate shape, authority boundaries, discipline cost), is a stronger pilot-readiness signal than any one of the three in isolation. It is also the reason the PO brief can describe the pilot as "asymmetric cross-tenant xireactor for FR+apex" rather than "adopt xireactor": all three architects agree that the full-adoption framing is worse than the asymmetric framing, and they agree for independent reasons.

This convergence was not designed. Cal's migration assessment started from "what is the cost of moving FR's wiki to xireactor?" Brunel's host architecture started from "what is the physical topology that matches upstream?" Mine started from "how do two tenants share a governed space?" The three questions are orthogonal; that the three answers produce the same shape at the same seam is the structural signal. If a future revision breaks this convergence — any one specialist concluding the asymmetric shape is wrong for their layer — it is a load-bearing pilot-readiness regression and the PO brief should be updated before the break propagates.

## 8. Summary — the governance contract in one table

| Question | Answer |
|---|---|
| What's isolated by default? | All writable surfaces. Four zones: FR-private, apex-private, FR-owned shared-read, apex-owned shared-read. Private is the default. |
| What's shared cross-tenant by default? | Read access to explicitly-promoted shared-read entries. The *readable* zone is opt-in, not default. |
| Who gates writes? | Owning tenant's librarian (Protocol A) for all writes. Cross-tenant writes additionally pass the other tenant's librarian via the xireactor staging pipeline (Tier 3+). |
| What if both librarians discover the same pattern independently? | §3.6 simultaneous-discovery protocol — fresh co-owned entry is filed as a synthesis with both intra-tenant entries as sources; neither librarian "owns" the co-owned synthesis; no land-grab race because `owned_by` never auto-flips. |
| What if both librarians want to transfer an existing entry's ownership? | §2.3 ownership-transfer ritual — two librarians + two team-leads countersign. No silent grabs. |
| How does cross-tenant review work? | Xireactor Tier 3 AI reviewer applies confidence floor to route, the other tenant's librarian makes the actual decision via bootstrap-preamble. |
| Authority-drift prevention? | Three checks: ownership-transfer ritual, shared-read sunset review, audit-independent tenant-boundary report. Auditor is neither tenant. |
| Librarian-asymmetry decision? | Strategic asymmetric use: librarian gate for intra-tenant, staging pipeline for inter-tenant. They meet only at shared-write. |

## 9. Open questions I'm not resolving in this pass

### 9.1 Routing / scope flags

- **Who writes apex-research's librarian prompt edits?** Out of scope for FR governance architect. Flagged to Aen.
- **Does the PO accept a four-signature ownership-transfer ritual as appropriate cost for a 2-tenant pilot?** It's the cheapest ritual I can design that produces an audit trail without making the librarians the auditors of themselves. If the PO wants lighter, the alternative is "librarian decides, audit container catches" — which is lighter at the cost of durability of the decision record.
- **When does the pilot evaluation itself happen?** This doc is the pre-pilot governance design; the post-pilot review needs its own governance-efficacy audit, likely another structural survey from Finn against xireactor once the two tenants have been running for some window.

### 9.2 Design probes (not pilot-blocking, but will bite someone later)

Three probes surfaced during Aen's accept-as-filed review. Not resolved in v1 — calling them out explicitly so they are not rediscovered as surprises mid-pilot.

#### 9.2.1 Tier 3 rejection at the cross-tenant seam — bounce to proposer, or escalate to receiving librarian?

When xireactor's AI reviewer rejects a cross-tenant write (confidence < 0.7 or error path), two disposition options exist, each with its own discipline burden:

- **Bounce to submitting librarian.** The proposer-side librarian (the one who originally accepted the submission via Protocol A) gets the rejection back with rationale. They must now understand xireactor's rejection criteria well enough to revise or re-route — a new **cross-cultural discipline burden**: Cal has to learn how xireactor thinks about cross-tenant conflict, sensitivity, and confidence, and adjust her submissions accordingly. Protocol A classification expertise is not sufficient on its own.
- **Escalate to receiving librarian.** The other-side librarian (the one who would have been in step 6 of §5.1 if the reviewer had forwarded) gets the hard case directly, with the AI reviewer's low-confidence flag as context. This is simpler for the proposer but creates a **hard-case triage queue** at the receiving librarian: every cross-tenant submission the AI couldn't confidently classify lands on them without the proposer's revision loop.

My leaning: **bounce to proposer, with structured rejection rationale.** Reasons:

1. The proposer is the only party who can *revise* the submission — the receiving librarian can only accept or reject, not improve. Escalation sends the hard case to a dead-end.
2. The proposer already has tenant-context expertise for their own tenant's knowledge. Adding cross-cultural discipline (understanding the *other* tenant's sensitivities) is the growth path we want; escalating short-circuits that learning.
3. Hard-case triage queues are the exact anti-pattern §3.6 of #42 warns against ("Tier 4 as an escape hatch, not a routing decision"). If every low-confidence cross-tenant write goes to the receiving librarian, the receiving librarian becomes Tier 4 in all but name, and the confidence-floor filter is bypassed.

What I'm not resolving: whether the rejection rationale format Cal needs is writable by the AI reviewer directly, or whether it needs a structured schema Herald's protocol doc specifies. That's a Herald-scope question once his v1 lands.

#### 9.2.2 Ownership quorum under degradation

If one team's librarian OR team-lead is unavailable at the moment an ownership-transfer ritual (§2.3) needs to complete — incident, offline, compaction, extended leave — the four-signature requirement cannot be satisfied. Two recovery shapes:

- **Freeze by default.** Ownership state is locked in its current value until quorum returns. Any entry mid-transfer stays in its pre-transfer state. This is the strict interpretation of §2.3 and has zero drift risk, but blocks legitimate transfers during outages.
- **Provisional transfer with time-bound expiry.** A three-of-four quorum (e.g., both librarians + one team-lead) can effect a *provisional* transfer, tagged with an expiry timestamp. If the fourth signature does not arrive within N days, the transfer **auto-reverts** to the pre-transfer state, not to the provisional state. Anti-drift property: degradation cannot ratify ownership changes, only delay them.

Pilot posture: **freeze by default during pilot.** The pilot's N is small enough (two tenants, one librarian each) that outages are rare and freezing for the window is acceptable. The provisional-transfer shape is the right post-pilot generalization as team count grows, but the added complexity is not earned at N=2.

**Structural property worth naming: degradation protocols must be strictly weaker than normal-path protocols, never stronger.** The provisional-transfer-with-expiry shape has exactly one non-obvious property — it auto-reverts to the *pre-transfer* state, not to the provisional state. This is the claim that makes it sound: **degradation can delay ownership changes, never ratify them.** A degradation path that ratified state (e.g., "if the fourth signature doesn't arrive, the provisional transfer becomes permanent") would be strictly stronger than the normal four-signature path, turning outage-time into a ratification shortcut. That is the shape to watch for in any degradation protocol: if the failure mode *completes* an act the normal path wouldn't have completed, the degradation protocol is stronger than the normal one and the normal one is no longer the authoritative path. Pattern-name candidate (flagged to Cal per Aen): **"degradation protocols must be strictly weaker than normal-path protocols, never stronger."** File-when: if a second instance of this shape surfaces in another governance context.

What I'm not resolving: availability-incident recovery protocols beyond the ownership layer (e.g., what happens to pending cross-review items when the reviewing librarian is offline for a week). That's a separate incident-response design pass, likely post-pilot once we have evidence of actual failure modes.

#### 9.2.3 Two wiki-pattern candidates routed to Cal

Aen flagged two candidates from this doc worth considering for Cal's wiki promotion. Noted here so the provenance is durable; Cal's call on whether and how to file.

- **(a) "Multi-mode failure modes need multi-mechanism defenses."** §4.1's three-check authority-drift design (ownership-transfer ritual + shared-read sunset review + audit-independent tenant-boundary report) is an instance of layered defense-in-depth applied to **governance**, not security. Each check addresses a different failure mode (deliberate grabs, accidental accumulation, structural blind spots) and no single check is sufficient. The pattern generalizes: whenever a risk has multiple distinct failure modes, a single-mechanism defense under-protects.
- **(b) "Bootstrap-preamble as cross-tenant pending-work channel."** §5.3 generalizes Cal's own #43 (`bootstrap-preamble-as-in-band-signal-channel`) from intra-team continuity to cross-tenant governance state. The mechanism is unchanged (durable state → bootstrap-path obligation → payload attachment); the payload class is new. If Cal promotes this, the right shape is probably an addendum to #43 naming cross-tenant governance as a validated payload class, not a separate entry.

Cal's call on promotion threshold, naming, and whether either candidate clears the "file it / file separately / too early" bar.

---

*(FR:Montesquieu)*
