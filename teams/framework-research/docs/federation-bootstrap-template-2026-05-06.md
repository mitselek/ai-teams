---
author: brunel
team: framework-research
project: Phase B — federation bootstrap
date: 2026-05-06
phase: B.1
type: design (generic onboarding template — parameterized runbook)
status: draft v0.7 — folds Monte 11:14 D5 reconciliation per protocol-shapes-are-typed-contracts.md (consumer-side typed contract: detector consumes typed SovereigntyClaim union, not raw logicalPath.team fields); pending Cal §0 cross-read pushbacks via Aen relay
inputs:
  - designs/brunel/brilliant-mcp-fr-setup-2026-05-05.md (Phase A.1 first instance, n=1)
  - wiki/patterns/path-namespace-as-federation-primitive.md (Cal, source pattern)
  - wiki/patterns/poll-only-substrate-sidecar-derivation.md (Cal, sync mechanism)
  - wiki/patterns/protocol-shapes-are-typed-contracts.md (typed-contract discipline for §0)
  - wiki/patterns/no-future-proofing.md (rationale for disallowing effectiveAt)
  - Aen Phase B brief 2026-05-06 10:40
  - Aen 11:02 conditional ratification + 4 revisions
  - Monte [COORDINATION] open 2026-05-06 10:52 + Brunel close 10:54 (registry-shared composition)
  - Aen 11:36 greenlight (combined v0.2 fold) + §6 default-recipient framing
  - Aen 11:56 Herald slot decision + 3 directives (RELAY — folded into v0.3 before 04 spec was on disk; relay loop closed in v0.6 via direct citation)
  - Aen 12:08 v0.2 review naming Herald Q1 (typed namespace: LogicalPath) + Q2 (typed ratifiedBy: { team, agent }) v0.3-fold candidates (folded as v0.4 in-place)
  - Aen 12:21 corrections — direct quote from Herald 11:02 ratification spec showing kind: "RegistrationAuthority" discriminator (not recordKind); v0.3 over-engineered the rename. v0.5 reverts.
  - Aen 12:30 filename correction (03- → 04- per Herald gate-4 collision rename) + direct-citation directive (replace relay-source provenance with on-disk spec). v0.6 implements both.
  - Herald 04 spec v0.1.1 — verbatim source: `prism/designs/herald/04-federation-authority-record-contract.md` on branch `origin/herald/03-federation-authority-record` (branch-name from pre-rename, file-name post-rename), commit `2fa0618` (§2.3 discriminator field `kind` locked v0.1.1 amendment)
  - Monte 2026-05-06 11:14 D5 framing reconciliation — typed-contract consumer-side discipline (detector consumes typed SovereigntyClaim, not raw fields). Folded into §6.5 D5 line at v0.7.
  - Monte 2026-05-06 10:55 D8 catalog addition (admission-velocity anomaly) — detector reads `ratifiedAt` + `conventionRetestCount` for velocity computation. Folded into §6.5 cross-link at v0.7.
  - Cal 2026-05-06 12:54 Protocol B response on v0.5 (relayed via team-lead 13:38 path-b due to substrate-mount-asymmetry) — three pushbacks: #1 conventionRetestCount substrate-derivation (already absorbed via Herald 04 §2 verbatim wording); #2 recordId audit-trail inline at field declaration (folded v0.7 §0.5); #3 D6 §6.5 advisory-emit pointer (folded v0.7).
  - wiki/patterns/audit-trail-for-rejection-rationale.md (Cal 2026-05-06 — Pushback #2 framework)
  - topics/04-hierarchy-governance.md §Recipient-and-authority-chain (Cal 12:24 Protocol B answer; D6 corrective routing)
revisions:
  - "2026-05-06 v0.1 → v0.2: Rev 1 namespace = Projects/<team>/ derived (no longer separate parameter); Rev 2 Curator-roster-cite required field on Step 0 request; Rev 3 Step 5 pre-condition on Step 4 PASS; Rev 4 required/optional allocation split; Monte registry composition — Step 0 produces typed RegistrationAuthority envelope alongside .mcp.json; effectiveAt disallowed per no-future-proofing"
  - "2026-05-06 v0.2 → v0.3: Herald slot decision (RegistrationAuthority moves to new top-level FederationAuthorityRecord union, sibling to PrismEnvelope + WriteRejection; discriminator field renamed kind → recordKind, flagged for Herald 03 confirmation); Directive A (conventionRetestCount = bootstrap-time-only scalar, cumulative derives on Monte side); Directive B (recordId = producer-side, idempotency-token, Cal generates as registrar; cascades to Step 0 response field rename EnvelopeId → recordId); Directive C (invalid-supersedes = R9-rule under EnvelopeInvalidRecovery, NOT 6th WriteRejection.errorClass); §6.5 cross-link adds load-bearing R2-ratified-cross-team.ratifiedBy → recordId pointer for D5 SovereigntyClaim accessor; D7 BaselineDeviation continuous-magnitude composability noted (rate facet IS continuous, no categorical variant needed)"
  - "2026-05-06 v0.3 → v0.4: Herald Q1 (typed namespace: LogicalPath reuse from prism/designs/herald/01-federation-envelope-contract.md §1) — namespace field re-typed from string-literal to LogicalPath shape; one namespace primitive across content envelopes + RegistrationAuthority records. Herald Q2 (typed ratifiedBy: { team: TeamId; agent: string } reuse from CuratorAuthority v2.0) — ratifiedBy field re-typed from bare cal literal to canonical curator-identity shape; one curator-identity primitive across CuratorAuthority + RegistrationAuthority. Both folds per Aen 12:08 v0.2-review (which crossed v0.3 11:11 ship; Aen named these as v0.3-fold candidates without seeing v0.3 content; folded as v0.4 in-place). RELAY-source provenance: Aen-cited Herald 11:18 ratification cross-read (Herald artifact still not on disk per substrate-invariant-mismatch n=7)."
  - "2026-05-06 v0.4 → v0.5: CORRECTION pass per Aen 12:21 direct quote from Herald 11:02. Reverts v0.3 over-engineering: discriminator field name is `kind` (not `recordKind`) — discriminator scope is per-union, no actual cross-union collision; renaming was speculation, not ratified design. supersedes typed as `?: string` (optional reference to prior recordId in same chain) per Herald spec actual. Production-rule lesson: when relaying-relayed material, fold ONLY what's verbatim in the relay; flag-then-implement-as-confirmed is a discipline failure I'll avoid in future revs."
  - "2026-05-06 v0.5 → v0.6: DIRECT CITATION pass — fetched Herald 04 spec from Prism repo (`origin/herald/03-federation-authority-record:designs/herald/04-federation-authority-record-contract.md` v0.1.1, commit 2fa0618). Three corrections from primary artifact: (a) `team: TeamId` typed primitive (was `<team>` placeholder); (b) `ratifiedAt: ISOInstant` (was `ISO8601Timestamp` — Herald uses ISOInstant from 02 §4.2); (c) `supersedes: string | null` nullable, NOT optional `?: string` (Aen 12:21 relay was approximate; primary artifact line 220 has `string | null`). Filename input correction `03-` → `04-` (Herald gate-4 collision rename). Frontmatter `inputs:` updated to cite primary artifact directly; relay-source provenance closed per Aen 12:30 directive. Production-rule applied: primary artifact > relay-quote when both available."
  - "2026-05-06 v0.6 → v0.7: Combined fold pass — (1) §6.5 D5 line reframed per Monte 11:14 reconciliation: 'detector consumes typed SovereigntyClaim 3-state union from observer surface' (typed-shape consumer-side contract per `protocol-shapes-are-typed-contracts.md`); (2) §0.5 `recordId` field declaration adds inline rationale comment per Cal Pushback #2 — naming the EnvelopeId→recordId rename rationale (Herald Directive B; single-id-serves-both-roles) so future readers don't re-introduce substrate-assigned variant from absence-of-justification (per `wiki/patterns/audit-trail-for-rejection-rationale.md`); (3) §6.5 D6 line adds explicit advisory-emit pointer per Cal Pushback #3 — 'Detection is advisory-emit only; corrective routing flows L1 → team-lead-of-accused-team per Topic 04 §Recipient-and-authority-chain + Cal 12:24 Protocol B answer'; (4) §6.5 adds D8 cross-link per Monte 10:55 catalog addition — admission-velocity anomaly detector reads `ratifiedAt` + `conventionRetestCount` for velocity computation. Pushback #1 (substrate-derived `conventionRetestCount`) — already implicitly absorbed via Herald 04 §2 verbatim citation in v0.6 §0.5 (Herald spec mandates 'this team is the n-th admission AT MOMENT OF RATIFICATION' = substrate-grounded snapshot, not Cal-running-count). No structural changes; four sharpening edits."
---

# Federation Bootstrap Protocol — Generic Onboarding Template

(*FR:Brunel*)

## Scope memo

This template generalizes the Phase A.1 FR-setup runbook (`designs/brunel/brilliant-mcp-fr-setup-2026-05-05.md`) into a deployable onboarding contract for any new team joining the shared-substrate federation. It is parameterized over three values — team slug, curator, and credential source — and produces TWO artifacts on successful invocation: a typed `RegistrationAuthority` envelope on the substrate (read by Monte's drift detector at #2) and a `.mcp.json` entry on the joining team's Claude Code config.

**What it is.** An execution-ready runbook. A team-lead receives this template, instantiates the three parameters via a Cal-coordination protocol, and runs steps 1–5. The output is a configured spoke that can read its own and other teams' shards on the shared Brilliant substrate, with namespace sovereignty preserved AND a substrate-typed authority record emitted to the federation envelope log.

**What it is not.** A federation-layer architecture spec, a substrate provisioning runbook, or a curator-authority design. Substrate readiness is Tier-0 inherited from EVR Konteinerite Standard v0.1; curator-authority shape is Monte's domain (Surface 1). This template assumes both are in place and produces ONLY the two artifacts named above.

**Why parameterize over three (not four).** v0.1 had four parameters; v0.2 collapses `<namespace>` into a derived value (`Projects/<team>/`) per Aen Rev 1 + Cal's `path-namespace-as-federation-primitive.md`. Single-token `<team>` is canonical key for both the namespace path and the `BRILLIANT_TEAM` env var. Divergent namespace would create two cross-doc consistency surfaces; single-token = single source of truth.

**Reversibility.** Spoke-side: removal = delete the `.mcp.json` entry. Substrate-side: emit a superseding `RegistrationAuthority` record (kind = `"RegistrationAuthority"` per Herald slot decision) with an explicit deactivation marker; drift detector reads latest non-superseded record. Both reversible without rewriting history; the substrate side preserves the audit trail.

**Cadence.** Phase A pattern — tight scope (this section, ~400w) + expansive shipped design (below, ~1300w). Carrying forward per Aen-named cadence discipline.

## Parameter contract

The template requires exactly three parameters, supplied by the joining team-lead and ratified by Cal before steps 1–5 execute:

| Parameter | Notation | Source | Example (FR, n=1) | Example (apex-research, projected n=2) |
|---|---|---|---|---|
| Team slug | `<team>` | Joining team | `fr` | `apex` (proposed) |
| Curator agent | `<curator>` | Joining team's roster | Cal (Callimachus) | apex-research's librarian-role (TBD) |
| Credential source | `<credentials-source>` | PO (out-of-repo) | `~/.claude/.env` entry | same convention |

**Namespace is derived, not supplied.** `<namespace>` = `Projects/<team>/`. Per Aen Rev 1: divergent namespace creates two cross-doc consistency surfaces (Step 3 `BRILLIANT_TEAM` AND namespace path); single-token = single source of truth. This locks the substrate primitive in `path-namespace-as-federation-primitive.md` ("every team owns its `<team>` shard at the path-namespace level") at the template surface.

The parameter set is a typed contract per `wiki/patterns/protocol-shapes-are-typed-contracts.md` — producer (joining team) and consumer (Cal, Brunel-template, Monte's drift detector) must agree on field set before execution. A missing or extra parameter is a bug, not a degradation.

## Step 0 — Cal-coordination protocol (ratification)

Before steps 1–5, the joining team's team-lead initiates Protocol B (Knowledge Query) to Cal with the three parameters. Cal responds via Protocol A-equivalent ratification (or pushback) and emits a typed `RegistrationAuthority` envelope to the substrate.

### Request shape (joining team → Cal)

```
[FEDERATION BOOTSTRAP — registration request]
Team: <team>
Curator: <curator>
Curator-roster-cite: <path or commit-link to joining team's roster.json line>   # Aen Rev 2
Credential source: <credentials-source>
Justification: <why this slug; cite precedent if any>
```

**`Curator-roster-cite` is required.** Per Aen Rev 2: Cal has no documented mechanism to verify a curator exists in another team's roster. Path (a) — joining-team attestation — is the chosen resolution. Aligns with `source-team:` frontmatter convention (attestation, not verification). The cite must be specific enough to verify by inspection (a path + commit hash, or a permalink); a vague reference is a bug.

### Response shape (Cal → joining team, via team-lead routing)

```
[FEDERATION BOOTSTRAP — ratification]
Team: <team>
Slug: RATIFIED <team> | MODIFIED <team'> with reason | REJECTED with reason
Curator: ACK <curator> | FLAG <curator-conflict>
Conflicts: <list of clashing existing slugs, if any>
Convention status: <n=k where k is the count of teams under this convention at moment of ratification>
recordId: <Cal-generated idempotency token, producer-side per Herald Directive B>
```

The slug-only ratification reflects v0.2's collapsed parameter set: namespace is derived, so Cal ratifies the slug and the namespace follows. The `recordId` is **producer-side generated** per Herald Directive B (relayed by Aen 11:56) — Cal acts as the registrar and emits the idempotency token alongside the ratification. v0.2's "substrate-assigned EnvelopeId" assumption is reversed: the substrate stores, the producer (Cal-as-registrar) generates.

### §0.5 — Step 0 outputs (TWO artifacts)

On successful ratification, Step 0 produces two artifacts:

**Artifact A — `RegistrationAuthority` record (in `FederationAuthorityRecord` union).** Cal emits the record to the federation envelope log; Monte's drift detector reads it on poll cycles. Per Herald slot decision (relayed by Aen 11:56 + 12:21 with direct quote from Herald 11:02 spec): `RegistrationAuthority` is NOT in any existing union with the wire-event family. It slots as a new top-level discriminated-union member in a sibling `FederationAuthorityRecord` union (alongside `PrismEnvelope` + `WriteRejection` family). Reasoning: metadata-about-substrate ≠ wire-event; append-only-additive chain lifecycle ≠ transactional accept/reject lifecycle. **Discriminator field name is `kind`** (per Herald spec direct-quote): discriminator scope is per-union, so `kind` distinguishes within `FederationAuthorityRecord` while `kind` separately distinguishes within `PrismEnvelope`. No cross-union collision at the type-system level; Herald comment in source is "discriminator preserved for future siblings."

Shape (verbatim from Herald 04 spec v0.1.1 `§2 RegistrationAuthority interface`, primary-artifact citation):

```typescript
interface RegistrationAuthority {
  kind: "RegistrationAuthority";               // discriminator preserved for future siblings under FederationAuthorityRecord (Herald 04 §2.3)
  recordId: string;                            // producer-generated idempotency token; Cal generates as registrar (Herald 04 §2.1). Single-id-serves-both-roles per Aen Q-B (idempotency-on-write AND addressable-id-on-read collapse onto one token). Renamed from substrate-assigned `EnvelopeId` in v0.3 per Herald Directive B — DO NOT re-introduce a separate substrate-assigned id (per `wiki/patterns/audit-trail-for-rejection-rationale.md`; Cal Pushback #2).
  team: TeamId;                                // typed primitive reused from Herald 01 §1
  namespace: LogicalPath;                      // typed shape from Herald 01 §1; for first-instance = { contentCategory: "Projects", team, documentTail: "" } (Herald 04 §2 namespace doc-comment)
  curator: { team: TeamId; agent: string };    // typed shape reused from Monte §3.5 CuratorAuthority
  ratifiedBy: { team: TeamId; agent: string }; // SAME shape as curator for cross-team-ratification flexibility (Herald 04 §2 ratifiedBy doc-comment)
  ratifiedAt: ISOInstant;                      // typed primitive reused from Herald 02 §4.2
  justification: {
    curatorRosterCite: string;                 // specific path + commit hash to joining team's roster.json line; vague references rejected (Herald 04 §2)
    justificationProse: string;                // free-text rationale from bootstrap request
  };
  conventionRetestCount: number;               // bootstrap-time-only typed scalar; Aen Q-A snapshot semantics; cumulative count derives via supersedes-chain traversal on consumer side (Herald 04 §2.2)
  supersedes: string | null;                   // prior recordId in same (team, namespace) chain; null at first registration (Herald 04 §2 supersedes doc-comment); R9 validates non-null references resolve in chain
}
```

**Append-only-additive.** Amendments (curator change, slug retirement, deactivation) emit NEW records with `supersedes: <prior recordId>`; no in-place mutation. Drift reads latest non-superseded record per team. This matches Phase A typed-contract discipline (envelope v2.0, no in-place mutation).

**Invalid `supersedes` reference handling per Directive C.** A record whose `supersedes` references a non-existent or non-deserializable prior `recordId` is rejected as **R9-rule under `EnvelopeInvalidRecovery`**, NOT as a 6th class on `WriteRejection.errorClass`. This preserves the 5-class enum stability per SemVer-strict discipline. Failure mode named in §Failure modes.

**`effectiveAt` disallowed.** Per Aen 11:36 + `wiki/patterns/no-future-proofing.md`: future-effective ratification adds a temporal distinction the convention re-test counter doesn't yet need. `ratifiedAt` is the only temporal field; the record is in effect from the moment the substrate receives it. Revisit if a real future-effective use case surfaces (e.g., scheduled team-lead handoff during a handover window). Document as deferred surface, not as a structural omission.

**Artifact B — joining-team-side `.mcp.json` entry.** Spoke-side config (Step 3 below). Together with Artifact A, the spoke is admission-controlled and registry-recorded.

### Why named ratification, not silent landing

Per `wiki/patterns/governance-staging-for-agent-writes.md` (the staging principle generalized): namespace allocation IS a write to a shared resource (the federation namespace tree). Even if the substrate doesn't enforce the staging contract for this kind of write, the federation contract does — Cal sole-writer for namespace allocation is the org-invariant. The substrate envelope is the typed-contract realization of that invariant.

### n=k tracking

Each ratification advances the convention re-test counter. n=1 is locked-as-precedent (FR per Phase A); n=2 is convention re-test (apex per Aen brief); n≥3 is "convention is the federation" — at this point, the template stops being a research artifact and becomes infrastructure. Counter surfaces in the substrate envelope (`conventionRetestCount`) so Monte's drift detector can observe federation-health velocity (his D7 surface at #2).

## Steps 1–5 — Spoke configuration

Identical to Phase A.1 runbook with parameters substituted. Reproduced here for self-containment of the template.

### Step 1 — Read the reference

```sh
cat ~/Documents/github/.mmp/<reference-team-clone>/.mcp.json.example
```

The reference is whichever team has a sanitized `.mcp.json.example` committed. Phase A.1 used Haapsalu-Suvekool (esl-suvekool); future invocations may use FR's own once committed. The shape is what's copied; values are substituted per the parameter contract.

### Step 2 — Acquire connection credentials

Owner: PO (Mihkel) for the EVR-org instance; whoever operates Brilliant for other-org instances. Credentials live at `<credentials-source>` per the parameter contract — typically `~/.claude/.env`, naming convention coordinated with Cal.

NOT in this template: credential rotation, multi-user splitting, or substrate-side DB role provisioning. Tier 0 obligations on the substrate are inherited from EVR Konteinerite Standard v0.1.

### Step 3 — Add the joining team's `.mcp.json` entry

Target file: the joining team's per-session `.mcp.json` (location depends on how the team's Claude Code session is launched — `~/.claude/mcp.json` for global, `.mcp.json` at the team's repo root for per-project).

Shape:

```json
{
  "mcpServers": {
    "brilliant": {
      "command": "...",
      "args": [...],
      "env": {
        "BRILLIANT_DB_URL": "${BRILLIANT_DB_URL}",
        "BRILLIANT_TEAM": "<team>"
      }
    }
  }
}
```

The `BRILLIANT_TEAM` value MUST match the slug Cal ratified at Step 0. Per Rev 1 collapse, this is the SINGLE source of truth: namespace is derived, env var is single-source. Drift between this value and the registry envelope's `team` field is a contract violation, not a degradation; Monte's D6 detector observes it.

### Step 4 — Verify

Restart the joining team's Claude Code session. Verify `mcp__brilliant__search_entries` and `mcp__brilliant__update_entry` tools surface in the tool list. Clean-positive surface = config landed; absent surface = config did not parse, error visible in Claude Code's MCP startup log.

### Step 5 — Smoke test

**Pre-condition: Step 4 PASS** (per Aen Rev 3). If Step 4 did not surface the tools, Step 5's zero-result outcome is ambiguous — config-failure is indistinguishable from first-invocation. Re-running Step 5 with broken config will silently look correct.

Run `mcp__brilliant__search_entries` over `Projects/<team>/` with no other filters. Expected result: zero results (joining team has not populated yet). Anything other than zero results = either config wrong or namespace already populated by mistake — investigate before any write.

## §3 — Namespace allocation (parameterized)

Identical structure to Phase A.1 §3, with values supplied by Step 0 ratification. The four sub-questions Q1–Q4 receive the same treatment:

- **Q1 — Top-level prefix:** `Projects/<team>/` per Step 0 ratification (derived from slug). Re-test counter advances per Cal's response.
- **Q2 — Wiki placement:** `Projects/<team>/wiki/*` (mirroring FR's allocation). Curator sole-writer = `<curator>` per the parameter contract.
- **Q3 — Shared-namespace conflict resolution:** Q2 makes Q3 moot for wiki content. Substrate-level org-wide content (cross-team standards belonging to no one team) is deferred per no-future-proofing posture.
- **Q4 — Pointer to upstream allocation doc:** this template IS the doc, with Step 0's `RegistrationAuthority` envelope constituting the per-instance allocation record. Cal's `path-namespace-as-federation-primitive.md` covers the substrate primitive.

### Concrete allocation (per Aen Rev 4 — required + optional split)

```
Allocated namespaces for <team>:
  Projects/<team>/                   — primary shard (REQUIRED ROOT)

  Required at first invocation:
    wiki/                            — curator-curated knowledge
      patterns/
      gotchas/
      decisions/
      contracts/
      references/
      process/
      observations/
      findings/

  Optional (per joining-team needs, add when used):
    meetings/                        — if the team runs scheduled meetings
    context/                         — cross-session durable context
    resources/                       — team-specific reference material
```

Per Aen Rev 4: only `wiki/*` is required at first invocation. The other three subtrees are added by the joining team when first used. This avoids creating empty namespaces that drift detector might surface as "team registered but inactive" false signals.

Sole-writer: `<curator>` (via joining team's write-authority). Read-access: org-wide.

## Watch items (carry-forward from Phase A.1)

- **Convention re-test at n=2.** First invocation of this template = first re-test. If the joining team cannot unambiguously fit a slug, the convention itself needs revisit — escalate to Aen + Cal, do NOT pick a workaround. Load-bearing test: distinguishes "FR's local convention" from "federation primitive."
- **Curator-authority dependency.** `<curator>` allocation depends on Monte's Surface 1 (curator-authority shape, A.2 ratified) and any A.3 amendment. If Monte's design redesigns sole-writer (multi-curator, rotation, teamlet), the `<curator>` parameter needs a richer contract than a single agent name.
- **Credential rotation.** Out-of-scope for this template. `<credentials-source>` parameter is the surface where rotation will eventually attach. When rotation becomes a real workflow (n≥3 likely surfaces it), extend the parameter contract; do not bake rotation into this template prematurely.
- **`effectiveAt` deferred.** Disallowed at v0.2 per no-future-proofing. Watch for real future-effective use cases (scheduled handover windows); revisit on observation, not anticipation.

## Failure modes

| Mode | Symptom | Recovery |
|---|---|---|
| Step 0 not ratified before steps 1–5 | Namespace conflict; Monte's D6 detector flags missing `RegistrationAuthority` record | Halt, re-run Step 0; rollback per Reversibility |
| `BRILLIANT_TEAM` ≠ ratified slug | Cal flags during pulse review; Monte's D6 detector flags slug mismatch | Edit `.mcp.json`, restart session; slug is single-source from Step 0 |
| Curator-roster-cite vague or absent | Cal rejects request (Rev 2 contract) | Joining team supplies specific cite; re-submit |
| Wrong credentials | MCP startup error in Claude Code log | Re-fetch from PO; do NOT commit credentials to repo |
| Namespace conflict (template-output writes into another team's shard) | Cal flags during pulse review; Monte's D5 detector flags R2 violation | Move entry; §0 ratification should have prevented this — investigate Step 0 trace |
| Step 5 false-pass (zero results from broken config) | Step 4 was skipped or false-positive; Step 5 zero-results misread as first-invocation | Re-run Step 4 explicitly; do NOT proceed without clean tool surface |
| Invalid `supersedes` reference (per Herald Directive C) | Submitted `RegistrationAuthority` record cites a non-existent or non-deserializable prior `recordId` | Rejected via R9-rule under `EnvelopeInvalidRecovery` (NOT as 6th `WriteRejection.errorClass` — preserves enum stability). Cal regenerates with valid supersedes pointer; do not retry blindly |
| Brilliant substrate down | All `mcp__brilliant__*` tools fail | Tier 0 SLA from EVR Konteinerite Standard applies; not federation-bootstrap's responsibility |
| `.mcp.json` syntax error | Claude Code startup fails outright | Revert to last good state; pre-add backup `cp .mcp.json .mcp.json.bak` is the discipline |

## What this template does NOT cover

- Brilliant operational rituals (`pulse` cadence, write-quality floor) — adopted by joining team on first use, not at setup.
- Cross-team namespace coordination beyond ratification — Cal's domain (Surface 1, Monte's A.2/A.3).
- Postgres-level access (DB roles, RLS, schema) — substrate-side.
- Backup/disaster recovery — Tier 0 inherited.
- **Authority-drift detection at federation scale** — joint Brunel/Monte Phase B #2 workstream. This template ships the registry envelope as input to that detector; the detector itself ships separately. Cross-link in §6.5.

## §6 — Default escalation framing (Aen 11:36 locked)

**Admission needs to commit, observation needs to caution.** The asymmetry is structural:

- **Admission (this template, Step 0):** binding ratification by Cal. The `RegistrationAuthority` envelope IS the admission floor; it is the typed contract every subsequent write is checked against.
- **Drift observation (Monte's #2 design):** advisory escalation per T04 cross-team-audit precedent → L1 router → audited team-lead. Drift detector observes deviation from the admission floor and emits advisory signals; corrective authority is downstream.

This asymmetry locks regardless of whether Cal returns a different per-namespace-curator-as-recipient resolution to Monte's Protocol B query — only severity ceilings would shift, the asymmetry framing holds.

### §6.5 — Cross-link to #2 drift detection

This template ships the `RegistrationAuthority` record at admission. Monte's #2 substrate-side observer reads the record on poll cycles to validate post-admission writes:

- **D6 (Authority-floor regression):** drift detector cross-checks `WriteAccept.curator` for namespace `Projects/<team>/*` against the latest non-superseded `RegistrationAuthority` record for `<team>`. Cheap derivation — supersedes-chain read, not envelope-log scan. **Detection is advisory-emit only; corrective routing flows L1 → team-lead-of-accused-team per `topics/04-hierarchy-governance.md` §Recipient-and-authority-chain + Monte design v1 §6 + Cal 12:24 Protocol B answer (per-namespace curator = write-authority only, NOT corrective-authority recipient). The detector observes; the team-lead acts. Cal Pushback #3.**
- **D5 (R2 sovereignty boundary crossing):** **detector consumes typed `SovereigntyClaim` 3-state union from observer surface, derived from substrate's `logicalPath.team` decoding alongside R2-class `WriteRejection` envelopes.** Per Herald 04 §3.1 `PathSovereigntyAccessor` typed accessor: `(logicalPath: LogicalPath) => SovereigntyClaim`, where `SovereigntyClaim` is the 3-state union (`R2-self` / `R2-ratified-cross-team` / `R2-violated`). The substrate decodes `logicalPath.team` AND the observer classifies `SovereigntyClaim`; D5 detector consumes the typed union, NOT raw `logicalPath.team` fields (typed-shape consumer-side contract per `wiki/patterns/protocol-shapes-are-typed-contracts.md`; underlying derivation method is observer's implementation freedom). The `R2-ratified-cross-team.ratifiedBy: <recordId>` pointer is **structurally load-bearing** — it points back to the `RegistrationAuthority.recordId` this template emits. Drift detector reads the pointer to verify ratification. Cross-link contract: this template MUST emit `recordId` as a value the `SovereigntyClaim.ratifiedBy` field can dereference; the pointer's referent is what the registry produces.
- **D7 (rejection-rate anomaly):** detector observes `conventionRetestCount` velocity from `RegistrationAuthority` records (cumulative derives via supersedes-chain traversal per Directive A) plus per-spoke per-class rejection rates; federation-baseline state composes with #2 §3.3 output substrate gate. Continuous-magnitude (rate facet is count-per-unit-time over (spoke, class, window)) composes with Herald's continuous-magnitude `BaselineDeviation` 4-state union; no categorical-magnitude variant needed.
- **D8 (admission-velocity anomaly, per Monte 10:55 catalog addition):** detector observes `RegistrationAuthority.ratifiedAt` + `conventionRetestCount` time-axis to compute admission-rate velocity; severity `warning` baseline, `breach` if velocity coupled with `justification.curatorRosterCite` chain failures (uncoordinated identity claims AND high velocity = federation-stress signal). Observe-only; no action on velocity-only signals. Same registry-record fields as D6/D7; cheap derivation.

Bootstrap = admission control; drift = post-admission monitoring. Orthogonal cuts, composable through the registry record as shared substrate primitive. Seam ratified in [COORDINATION] handshake 2026-05-06 10:54; type-system shape ratified by Herald 11:56 (relayed).

## Acceptance check

This template is **draft v0.7 — all async ratifications CLOSED.**

**Closed ratifications:**

1. ✓ **Herald 04 spec** — closed in v0.6 via direct citation to `prism/designs/herald/04-federation-authority-record-contract.md` v0.1.1 commit `2fa0618`. Relay-source provenance loop closed; field-set verbatim per primary artifact. Reciprocal close via Herald 13:24.
2. ✓ **Monte cite-and-fold pass** — closed via Monte 11:14 (envelope shape verified consumable for D5/D6/D7/D8/D2; one D5 framing reconciliation surfaced) + Monte 11:40 (reciprocal close confirming v0.6 corrections folded; v0.7 D8 cross-link offer accepted; field-name alignment verified end-to-end). D5 reconciliation + D8 cross-link folded in v0.7 §6.5.
3. ✓ **Cal §0 cross-read** — closed via Cal 12:54 Protocol B response (relayed by Aen 13:38 path-b due to worktree-mount substrate-asymmetry). Field-set composability VERIFIED across §0 request (5 fields), §0 response (6 fields), §0.5 envelope (10 fields). Three pushbacks surfaced: #1 substrate-derived `conventionRetestCount` (already absorbed via Herald 04 §2 wording — verified in v0.7); #2 `recordId` audit-trail inline citation (folded v0.7 §0.5); #3 D6 advisory-emit pointer (folded v0.7 §6.5). Eight wiki entries cited as load-bearing in Cal's response.

**Execution-ready for n=2 (apex-research).** Pre-flight check before any execution: verify the three parameters are mutually consistent across consumers (Step 3 `BRILLIANT_TEAM`, registry record `team`, Herald 04 envelope contract `team: TeamId` field; namespace `LogicalPath` parses identically across content envelopes + registry records). Cross-doc consistency is the recurring concern — Aen's Phase A.3 alignment carried forward.

Once both remaining ratifications land → execution-ready for n=2 (apex-research). Pre-flight check before any execution: verify the three parameters are mutually consistent across consumers (Step 3 `BRILLIANT_TEAM`, registry record `team`, Herald 04 envelope contract `team: TeamId` field; namespace `LogicalPath` parses identically across content envelopes + registry records). Cross-doc consistency is the recurring concern — Aen's Phase A.3 alignment carried forward.

## Phase B #2 cross-link (closing)

See §6.5. Bootstrap (this template) writes the registry; drift (#2) reads it. Composable through the typed envelope shape. The seam framing — admission binding, drift advisory — is the load-bearing decomposition.

(*FR:Brunel*)
