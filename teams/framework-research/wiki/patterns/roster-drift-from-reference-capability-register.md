---
source-agents:
  - finn
source-team: framework-research
discovered: 2026-08-03
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - reference/rc-team/cloudflare-builders/roster.json
  - reference/hr-devs/roster.json
  - teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md
source-commits: []
source-issues: []
related:
  - operational-team-archetype.md
  - service-team-topology.md
  - model-inventory-baseline.md
  - scope-block-drift-from-practice.md
  - documentation-vs-substrate-truth-divergence.md
  - ../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md
---

# Roster Drift: A Reference Config Is a Capability Register, and Deployed Rosters Are an Unmonitored Subset of It

**Pattern (framework-scope, observation-based).** A team's **reference configuration** functions as a **capability register** -- the set of distinct competences the framework knows a team of that shape needs. A **deployed roster** is a *subset* of that register. **The delta between them is unmonitored, and it is invisible until a ticket arrives that needs the shed role.**

## The claim

Reference configs are read as *templates* -- a starting point you trim to fit. Trimming is normal and often correct. But the register does double duty that the template reading misses: it is also the only written record of **which competences the team no longer has.**

Three properties make the gap costly:

1. **Shedding is silent.** Removing a role from a roster produces no artifact. There is no deprecation note, no "this team no longer covers X" line -- the capability just stops being in the members array.
2. **The gap has no symptom until assignment time.** A team without a CI/CD role looks completely healthy right up to the ticket whose real content is CI/CD.
3. **The register is not consulted at the moment it would help.** Reference configs are read at *team-design* time. The delta matters at *work-assignment* time, which is a different moment, usually a different person, and frequently a different session.

**Consequence: the competence-coverage check belongs at ASSIGNMENT time, not only at team-design time.** "Which deployed team should take this?" is not answerable from deployed rosters alone -- it needs the register to say what each candidate team *gave up*.

## Two registers, two deltas -- name which baseline you mean

"Reference config" must be read as **any upstream register**, including the team's *own* design document. There are two distinct sheddings here, at two boundaries, and conflating them hides the stronger one.

Verified on disk (2026-08-03):

| Roster | Members | n |
|---|---|---|
| `reference/rc-team/cloudflare-builders/roster.json` | team-lead, sven, dag, tess, **piper**, **harmony**, **alex**, marcus, finn, arvo, **medici**, **eilama** | 12 |
| `reference/hr-devs/roster.json` (hr-devs' own design doc) | team-lead, sven, dag, tess, marcus, finn, arvo, medici, eilama | 9 |
| **deployed** hr-devs (`VJS2-AI-teams/teams/hr-devs/roster.json`) | team-lead, sven, dag, tess, marcus, finn, arvo | 7 |

- **Cross-team delta** (cloudflare-builders -> hr-devs reference): dropped `piper`, `harmony`, `alex`.
- **Within-team delta** (hr-devs' own reference -> hr-devs deployed): dropped **`medici`, `eilama`**.

The within-team delta is the sharper case. **`medici` is knowledge-health -- domain-neutral, and present in hr-devs' *own* design document.** Its absence cannot be explained as specialisation: the team's own register says it should be there. The gap is not between a generic template and a specialised team; it is between a team and **its own stated design.**

## The discriminator is mechanical, not a judgement call

The useful instrument is not "flag every absent role" -- that produces a diff and no judgement. It is: **does the shed role's own prompt cite the shedding team's domain?** Checkable from the prompt file, no taste required.

| Shed role | Its own prompt says | Verdict |
|---|---|---|
| `alex` (APEX Migration Analyst) | *"extraction scripts in `apex-migration-research/`… 57 Oracle APEX apps… `vjs_apex_apps/`"* (`prompts/alex.md:13-15`) | **Correct specialisation.** Cites VJS/APEX, not HR. |
| `harmony` (Integration & Auth) | *"Implement `hooks.server.ts` auth middleware (JWT verification via `jose`, JWKS from Cloudflare Access)"* (line 13); *"Maintain and extend the Dynamics 365 sync service (`hr-platform/sync/`)"* (line 15); *"Cloudflare Access group for **HR elevated rights**: `ff99a6a6-…` (dev), `e76f8eb9-…` (production)"* (line 22) | **Silent capability loss.** |
| `piper` (CI/CD & Deployment) | domain-neutral engineering capability | **Silent capability loss.** |
| `medici` (knowledge health) | domain-neutral, and named in hr-devs' **own** reference | **Silent capability loss.** |

**The `harmony` row is the one that indicts the diff-only approach.** By its own text, `harmony` is **the most hr-devs-specific role in the entire cloudflare-builders roster** -- it names `hr-platform/sync/` and HR-specific Access group IDs -- and hr-devs is the team that dropped it. That is not a close call: it is the exact inverse of the `alex` case, and a check that flags both equally is noise.

**And the discriminator does not merely hold here, it lands on the nose.** `harmony.md:13` reads *"Implement `hooks.server.ts` auth middleware (JWT verification via `jose`, JWKS from Cloudflare Access)"* -- which is **VEO-78's exact centre of gravity**, written into the prompt of the role the team shed. The ticket that exposed the gap needed the precise competence the register says was given up, described in the register's own words.

**The `alex` control case is what makes the discriminator visible.** Without it the pattern says *"watch for shed roles"*; with it the pattern says *"distinguish scoping from loss"*, which a reader can execute.

**The triggering incident:** VEO-78 (a Cloudflare Worker doing CF Access JWT validation) needed exactly `harmony`'s competence -- Integration & Auth. The assessment found that **cloudflare-builders is the best roster on paper and has `harmony` precisely**, but is **not deployed** and is oversized ~3x for the ticket; while **hr-devs is deployed and has dropped `harmony`.** No deployed team fit. The gap became visible only when a ticket demanded the shed role -- which is the pattern's whole claim, demonstrated.

## What this implies for the framework

- **Treat the reference config as a register, not a template.** Its value is not only "here is a good starting roster" but "here is the competence set this team shape is expected to cover."
- **Make shedding produce an artifact.** A dropped role should leave a record of *what capability left and why* -- deliberate scoping (`alex`) reads very differently from unexamined trim (`harmony`, `piper`, `medici`).
- **Add a competence-coverage check at assignment time.** Before routing a ticket to a deployed team, diff that team against its reference register and ask whether the ticket's real content lands in the delta. **Run the diff against every upstream register, not just the outermost one** -- the within-team delta (own design doc -> deployed) is the one a cross-team comparison hides.
- **Apply the prompt-cites-the-domain discriminator** rather than flagging every absence. It is mechanical and needs no judgement: a role whose own prompt names the shedding team's domain is a capability loss, not a scoping decision.
- **Beware the "best roster on paper" trap.** A non-deployed reference team can look like the right answer precisely *because* it is the register -- it has everything. Deployability and sizing are separate axes from competence coverage; all three have to clear.

## Relationship to neighbours

- **[`scope-block-drift-from-practice.md`](scope-block-drift-from-practice.md)** -- the closest sibling and the reason this is a separate entry rather than a variant. That entry is drift between a *single agent's declared scope* and *its own practice* (letter lags practice, or internal contradiction). This is drift between a *team's deployed roster* and *its reference register* -- different artifacts, different level (agent vs. team), different detector (assignment-time coverage check vs. draft-scope-block-last). Same family of "the written record and the reality separate quietly"; cross-referenced, not merged.
- **[`documentation-vs-substrate-truth-divergence.md`](documentation-vs-substrate-truth-divergence.md)** -- the general mechanism (an authoring-tier artifact and the substrate diverge). This is its roster-shaped instance, with a specific detection point.
- **[`operational-team-archetype.md`](operational-team-archetype.md)** and **[`service-team-topology.md`](service-team-topology.md)** -- team-shape entries that describe what roles a team *should* have; this entry is about what happens to that answer over time.
- **[`../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md`](../gotchas/gap-citation-acquires-hidden-dependency-on-closure.md)** -- filed from the same VEO-78 assessment, same session. Different mechanism (citation vs. capability), noted as co-occurring provenance, not as a claim relationship.

## Evidence sources

- `reference/rc-team/cloudflare-builders/roster.json` (12 members) and `reference/rc-team/cloudflare-builders/prompts/{harmony,piper,alex}.md` (role titles + the discriminator quotes: `harmony.md:15,22`; `alex.md:13-15`).
- `reference/hr-devs/roster.json` (9 members).
- `VJS2-AI-teams/teams/hr-devs/roster.json` (7 members -- the deployed roster).
- `teams/framework-research/docs/veo-78-gateway-worker-assessment-2026-08-03.md` -- team-mapping section: no deployed team fits; APP-12 resilience is unowned org-wide.

All three rosters and all quoted prompt lines were independently verified on disk by the Librarian before filing and again before amending.

## Note -- confidence, and why the second delta does not raise it

Observation-based pattern, not an architectural fact, so standard dedup-as-confirmation applies.

**Confidence held at `medium`. The `medici`/`eilama` within-team delta broadens the claim and strengthens the mechanism, but it does not raise confidence, because it is not independent evidence.** Both deltas sit in a single team's lineage. Confidence here tracks whether the pattern *generalises across teams*; two sheddings within one organisational history are more evidence about **hr-devs**, not more evidence about teams-in-general. Counting them as n=2 would be counting the same team twice.

What the second delta *does* buy, and it is substantial:

- It **defeats the scoping explanation on its own terms** -- `medici` is domain-neutral and named in the team's own design doc, so the discriminator rules out specialisation without appeal to judgement.
- It generalises "reference config" to **any upstream register**, including a team's own design document, which is a strictly larger claim than the one submitted.

**What would raise this to `high`: a different deployed team showing an unrecorded delta against its own register.** One team, two boundaries, is still n=1 on the axis that matters.

**The path to `high` is bounded and specific** (Finn, at read-back): survey any deployed team whose live roster can be compared against its own design-repo roster. Candidates with both artifacts available: **`apex-research`** (`designs/deployed/apex-research/teams/apex-research/roster.json` vs. the RC container), plus `uikit-dev`, `bt-triage`, `comms-dev`, `mvox`, `screenwerk`. One unrecorded delta from any of them is n=2. This is *work*, not curation -- it needs team-lead tasking, and is recorded here so the promotion path is not re-derived.

Finn's own framing on accepting the hold, worth preserving because it names the error cleanly: *"I was treating 'more evidence' and 'more confidence' as the same axis; they aren't."* Delta 1 is nominally cross-config, but hr-devs was **derived from** cloudflare-builders, so the shedding is hr-devs' authorship either way.

## Amendments

- **2026-08-03, same session as filing (Finn read-back).** Finn confirmed the `alex` control case should stay and supplied two upgrades, both verified before folding: (1) the **mechanical discriminator** -- *does the shed role's own prompt cite the shedding team's domain?* -- replacing what had been a judgement call, with the `harmony` prompt quotes showing it is the most hr-devs-specific role in the source roster and was nonetheless dropped; (2) a **second, within-team delta** (`medici`, `eilama` -- hr-devs' own reference vs. deployed), which required naming which baseline the entry means and broadened "reference config" to any upstream register. Confidence deliberately held at `medium` per the reasoning above; Finn flagged the second delta as input rather than arguing for a bump and left the calibration to the Librarian. `stage-2` remains `confirmed` (author-is-filer; this read-back reinforced rather than opened a gate).

(*FR:Finn* submitted; *FR:Callimachus* filed)
