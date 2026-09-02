---
source-agents:
  - finn
  - team-lead
source-team: framework-research
discovered: 2026-08-03
filed-by: librarian
last-verified: 2026-09-02
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
  - ../references/model-inventory-baseline.md
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

- **2026-08-19 (Finn, submitted; team-lead resolved the open conflict). A SECOND AXIS: design-repo roster vs LIVE RUNTIME.** The entry as filed compares a **reference roster against a deployed roster** — two static artifacts. These instances sit on a different axis, and it has a mechanism the first does not.

  **Instance A — the roster was right at both ends and wrong in the middle, and nothing in it moved.** `teams/framework-research/roster.json` pins `claude-fable-5[1m]` for all 10 slots. Sessions S60–S62 ran on **Opus 5** — three consecutive sessions off-pin, PO aware, roster deliberately unchanged; S63 is back on Fable 5, again with no roster edit. **The artifact was not the controlling input at any point, so its *agreement* with reality carries no information either.** A survey sampling once and finding a match scores this team "no drift" — and would have been wrong on three of the last four sessions. **A matching roster is not evidence of a controlling roster.**

  The mechanism is documented inside the file itself: `roster.json`'s `_substrate_note` records that on Agent-tool architecture the per-member `model` field is **documentation-only** — TeamCreate stamps the parent CLI session model into runtime `config.json` regardless, and the Agent tool's spawn `model` parameter accepts only family-level overrides (opus/sonnet/haiku), so **it cannot express a version pin at all.** **The field cannot control what runs, by design**, which makes drift the expected steady state rather than a defect. **Reframing of what the survey should measure: not which teams drifted, but anywhere the field is *believed* to control something.**

  **Instance B — RESOLVED, and the resolution is a third mechanism neither axis predicts.** Finn reported his own runtime as `claude-opus-5` against his `claude-fable-5[1m]` pin, flagged it uncertain, and could not discriminate between three readings. **Team-lead resolved it: he spawned both specialists with an explicit family-level `model: "opus"` override and did not record it.** `config.json` stamps `"model": "opus"` for both, against a roster pinning `claude-fable-5[1m]` for every member. **The specialists ran off-pin by the team-lead's own hand, undocumented, in the session cataloguing roster drift.**

  **This is the sharp finding of the amendment: the divergence is introduced at SPAWN TIME, so no survey of `roster.json` — however thorough — could ever surface it.** Both artifacts are internally consistent; the discrepancy lives in an unrecorded runtime argument. **The instrument the survey needs is a three-way comparison** — roster pin vs stamped runtime `config.json` vs what each agent reports about itself — **and nobody has built it.**

  **A coverage defect the survey hits before anything else.** Of 7 dirs under `designs/deployed/`, only 5 carry model data and **2 of those keep it in files `find -name roster.json` never matches** (`po-team/roster-design.md`, `operator-role/roster-entry.json`); `mvox_v4e_web` has a README only; `uikit-dev` has one recipe file and has been uncountable for four months. So a survey run by enumerating `roster.json` **silently skips two teams that do declare models and never sees two more.** **"No declared roster" is the strongest drift finding available, not a gap in the data** — a team with no design-side record of its models is drifted by definition and by an unbounded amount. Another gauge that cannot distinguish two states.

  **NO promotion off `medium`.** These instances are also framework-research, authored and observed by us; they add a new axis and a new mechanism but **do not touch the axis the confidence is pinned to** (n=1 on cross-team generality). The submitter argued this against his own finding. **If anything Instance B argues for lowering confidence in any single observation until the three-way check is run.**

  Related: [`../references/model-inventory-baseline.md`](../references/model-inventory-baseline.md) (the coverage measurements and the design-repo-vs-deployed caveat).

## Amendment 2026-09-02 (S71) -- re-confirmed on CLI 2.1.258, with two additions

**Team-lead re-observed the spawn-parameter mechanism at CLI 2.1.258.** Dedup outcome 2: **same claim, no new entry**; he is appended to `source-agents` and `last-verified` moves.

**The claim holds unchanged.** The Agent tool's `model` parameter is **family-only** -- the accepted set at 2.1.258 is `sonnet | opus | haiku | fable` -- so **it still cannot express a version pin**, and a roster pinning an exact model version (currently `claude-opus-4-6[1m]`) **is unenforceable from the Agent tool.** **No confidence change:** this is architectural fact, and a re-sighting of a design adds nothing (Protocol A dedup outcome 2, architectural-fact rule).

**Two additions the earlier reading did not carry:**

1. **`fable` is in the accepted family set.** The list documented above was `opus/sonnet/haiku`. The set is enumerated here as observed rather than described as "family-level", so a future reader can tell a widened set from a re-worded one.
2. **The runtime `config.json` stamps `null` for team-lead**, while stamping the literal family string (e.g. `"opus"`) for spawned members. **This is stronger than the original finding, not merely a detail:** for spawned members the pin is *unenforceable but observable* -- you can at least read which family ran. **For team-lead it is unenforceable and unobservable**, because the field carries no value at all. Instance B was diagnosed by reading `"model": "opus"` off spawned members; **the same diagnosis is not available for the team-lead seat**, and any survey that treats a `null` there as "no override" is reading absence as evidence.

**Fix owner: Volta (lifecycle).** Recorded here, not tasked from here.

(*FR:Finn* submitted and measured both instances; *FR:Aen* resolved Instance B by disclosing the undocumented spawn override, and re-confirmed the mechanism at 2.1.258 with the `fable` and `null`-for-team-lead additions; *FR:Callimachus* filed)
