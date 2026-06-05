# Reflexive Competency-Gap Analysis on FR's Own Roster — Design Doc (#74)

**Status:** COMPLETE — design proposal answering the PO's three framing questions + PO-decision list. Revised after Medici's roster audit (his H1 "0 external-citing FR roles" reshaped Q2/Q3). **No prompt edits proposed as required actions.**
**Lead:** Celes (Agent Resources Manager). **Second lens:** Medici (health-audit) — evidence in `health-report-competency-gap-2026-06-05.md`.
**Issue:** https://github.com/mitselek/ai-teams/issues/74

---

## 0. Frame: what we are reflexively applying, and why now

In S41–S42 the team built and validated the **guild-specialist competency pattern** on the Arhitecture review personas: each dispatched specialist has prompt-encoded *competency gates* (query the backing source, cite real docs by ID, flag `[GAP]` when backing is absent, never fabricate). The S42 round-2 experiment confirmed the gates fire — including on the two highest-fabrication-risk lenses — and that the gap-reaction loop files real issues end-to-end ([topic 10](../../../topics/10-guild-specialists.md)).

That pattern was built for **dispatch-time review personas**: short-lived, citation-producing, externally-backed. #74 asks whether the same machinery should turn **inward** onto FR's own **standing roster** — the 10 long-lived roles in `roster.json`.

The honest starting observation: **a review persona's competency claim and a standing role's competency claim are not the same kind of object.** The transfer question (Q1) is really "what is the FR-native shape of the claim, and does the same instrument verify it?" Everything else (Q2 artifact location, Q3 proactive-vs-YAGNI) follows from getting that right.

---

## 1. Q1 — HOW to evaluate competence gaps (methodology) (*FR:Celes*)

### 1.1 The claim changes shape on the way inward

| | Review persona (Arhitecture) | Standing role (FR) |
|---|---|---|
| **What a "claim" is** | A *citation in a delivered artifact* — "per EN 50716 clause X…" | A *capability asserted in the prompt* — "Volta ensures each session starts clean" |
| **When it's made** | At dispatch, per engagement, fresh each time | Once, at prompt-authoring time; reused every session |
| **What backs it** | An *external* source doc indexed in a competency backend (arch-docs MCP, ratified ADRs) | Mostly *internal* artifacts — reference configs, topic files, wiki entries, MEMORY.md incidents |
| **Failure mode** | Fabricated citation reaches a client deliverable (the Anderson incident) | Role over-claims a capability it can't actually exercise, or its backing artifact is stale/missing |
| **Who can verify** | The specialist itself, at dispatch, via `search_docs` | An auditor cross-reading prompt-claim against backing artifact (artifact-vs-artifact) |

**The instrument therefore shifts from citation-verification to prompt-claim → backing-artifact mapping.** A review persona verifies its own claims live, against an external backend, because the claim is generated per engagement. A standing role's claims are authored once and don't re-verify themselves — so the verification is an **audit pass over the prompt**, not a runtime gate inside it.

### 1.2 The FR-native instrument already mostly exists — it is a *profile of Medici's coherence audit*, not a new tool

This is the load-bearing finding. Medici's existing audit checklist (`prompts/medici.md`) already runs `[GAP]` (what's missing), `[CONTRADICTION]` (artifact-vs-artifact inconsistency), and `[EXTRACTION]` (has the backing been pulled into the artifact). Competency-gap detection on a standing role is **the same artifact-vs-artifact consistency check, scoped to one axis**: *does each capability the prompt claims have a real backing artifact, and is that artifact current?*

So the FR-native evaluation instrument is a **competency profile of the coherence audit**:

> For each capability asserted in role R's prompt, name the backing artifact (topic file / wiki entry / reference config / external doc). If the backing is internal and present → BACKED. If internal and absent/stale → `[GAP]` (the artifact must be written or refreshed). If the claim depends on an *external* source not in any backend → `[GAP]` of the Arhitecture kind (obtain + index, or document the caveat).

The Arhitecture pattern *does* transfer — but not as a runtime gate bolted into each standing prompt. It transfers as an **audit lens Medici runs over the roster**, because standing claims are authored-once and an auditor (not the role itself) is the right verifier. (Medici has confirmed this division — see §1.4.)

### 1.3 Why NOT bolt runtime competency gates into every standing prompt

Tempting to mirror the review personas exactly: give every FR role a "query your backing before you assert" hard rule. Reject this for FR's standing roles because:

- **Most standing claims aren't falsifiable citations.** "Volta ensures clean session start" isn't a clause to cite; it's a design responsibility backed by `06-lifecycle.md` and incident history. A runtime gate has nothing to query.
- **Prompt bloat with no firing.** A gate that never fires (because the role makes no external citation) is dead weight that erodes prompt clarity — the same over-flagging failure direction I flagged in the Anderson gold-standard work (a gate that cries gap on everything is as useless as one that fabricates).
- **Medici's sweep confirms 0 of 10 FR roles cite external authority** (§3.0) — so for FR there is no role the runtime gate would help. The two roles that touch external *substrate* at runtime (brunel, hopper) already encode the substrate-truth equivalent (§3.1). The gate already exists exactly where FR needs it.

### 1.4 Medici's lens — RESOLVED (it is a profile, with one genuinely-new nuance)

Medici has run the audit (`docs/health-report-competency-gap-2026-06-05.md`) and confirmed §1.2 — with one honesty correction worth stating precisely, because it sharpens D1.

**What his existing coherence audit already covers (no new machinery):** the BACKED and STALE cases. "Claim X names backing artifact Y; is Y present and current?" is exactly artifact-vs-artifact — `[CONTRADICTION]` when prompt and artifact disagree, `[GAP]` when the artifact is thin or missing. The claim→backing *table* is a profile of his existing checklist.

**What it does NOT cover today (the genuinely-additive 10%):** a claim that names an **external body of knowledge with no FR-side artifact at all** (Finn's "research Claude Code docs" — nothing in-repo to be inconsistent *with*). His coherence pass needs two artifacts to compare; this is a different scan *shape* — an absence-of-artifact check ("does this claim have ANY backing?"), not a consistency check ("do these two agree?"). Medici is explicit that he'd be **newly committing** to this as a named sub-check (the **orphan-claim scan**), not claiming his current pass already runs it. So the honest D1 framing is: **competency-gap detection = Medici's existing coherence audit (BACKED/STALE axis, fully covered) PLUS one additive orphan-claim sub-check (external-claim-with-zero-backing axis, new to his checklist).** Calling it "Medici already runs this" would be 90% true and 10% aspirational; the orphan-claim scan is the 10% he is choosing to add. This doesn't change the verdict (still audit-not-gate, still light), but the design names the new commitment honestly rather than burying it.

---

## 2. Q2 — WHERE competences live as artifacts (*FR:Celes*)

### 2.1 The reader-and-time question decides this

The PO is right that *who reads it and when* is the deciding axis. Candidates and their read-time fit:

| Option | Read at… | Fit | Verdict |
|---|---|---|---|
| **Wiki cards** (under a `competencies/` subdir) | audit-time | Cal is **single writer** of the wiki. Per-agent competency data is *self-describing role data* that the role's author (me/team-lead) owns, not curated cross-team knowledge. Putting it in the wiki forces every update through Cal and miscategorizes it. | **Reject** — violates single-writer discipline and miscategorizes the data |
| **`competencies/` tree** (new top-level dir) | audit-time | Clean, but creates a *second* source of truth that drifts from the prompt — the exact `scope-block-drift-from-practice` failure I've catalogued (claims in one file, reality in another). | **Reject for standing roles** — drift risk |
| **Per-agent `COMPETENCIES.md`** (Arhitecture pattern) | dispatch/audit | Worked for Arhitecture because those personas are dispatched and the file is read at engagement setup. FR standing roles aren't dispatched per-engagement — the file would be read only at audit-time and drift from the prompt between audits. | **Reject for standing roles** (keep for the guild/dispatch context) |
| **Prompt frontmatter** (YAML block atop the prompt) | spawn-time + audit-time | The capability claim and its backing live *in the same file the claim is made in*. No second source of truth, no drift. The auditor reads exactly what the spawned agent reads. | **Lightest option IF a machine consumer appears — none does yet (YAGNI)** |
| **Audit-maintained baseline table** (one table, Medici-owned, refreshed on roster change) | audit-time | The claim→backing mapping is an *audit output*, not a file each agent maintains. One table, one owner, refreshed when the roster changes. No per-agent duplication, no drift. | **Adopt for FR** |

### 2.2 Recommendation (converged with Medici): no new per-agent artifact class — the audit table IS the map

My first draft recommended prompt frontmatter for the "claim-heavy" roles. With §3.0 established (0 external-citing roles), there is no role for which a per-prompt competency block earns its keep right now. Medici's lens reaches the same conclusion from the health-audit side: **do not spawn a per-agent artifact class.** Reasons:

- A per-agent `COMPETENCIES.md` or frontmatter block would **duplicate what the prompt already asserts** and risk drifting from it (the two-source `scope-block-drift` failure).
- The backing **already lives** in wiki + topics + reference + playbooks; the claim→backing *mapping* is an audit output, not standing per-agent state.
- `mega biblion, mega kakon` — a new artifact class for 10 agents earns its cost only if a real consumer reads it. None exists.

**What to keep instead:** Medici's Section-1 table (in `health-report-competency-gap-2026-06-05.md`) is the **single baseline competency map**, owned by Medici, refreshed when the roster changes. If a machine-readable consumer ever appears (e.g. a spawn-time competency check), prompt frontmatter is the lightest place to add it — but that's a YAGNI deferral, not a now-action.

This is a change from my draft recommendation, made because the evidence (0 claim-heavy roles) removed the only justification for per-agent competency files.

### 2.3 Single-writer caution honored

The baseline map lives in a Medici-owned **health-report doc**, not the wiki, so Cal's single-writer rule is untouched (the report is Medici's output artifact, the same as every prior health-report). If a competency-gap finding turns out to be a *team-wide pattern* (e.g. Medici's §5 "two mechanisms, one name"), THAT pattern goes to Cal via Protocol A as normal — but the per-agent mapping stays in the audit report, not the wiki and not 10 per-agent files.

---

## 3. Q3 — Proactive or YAGNI (policy) — REVISED after Medici's audit (*FR:Celes*)

### 3.0 Revision note: my first cut was wrong, and the evidence sharpened the answer

My initial draft bucketed 5 roles as "claim-heavy" on the test *does the role's output derive from a domain authority external to FR?* — and proposed proactive frontmatter for those 5. **Medici's per-prompt sweep (`docs/health-report-competency-gap-2026-06-05.md`) falsifies the premise of that bucketing.** His finding H1: **0 of 10 FR roles cite external authority.** All 10 competency claims are backed by *internal* artifacts (wiki, topics, reference snapshots, playbooks). The Anderson *failure-mode* transfers; the Anderson *surface* (a fabricated external citation reaching a deliverable) **does not exist on FR**. My five "claim-heavy" roles (finn, medici, monte, herald, celes) assert internally-backed competencies, not external citations — so the silent-fabrication risk I priced the proactive pass against isn't there.

I'm revising Q3 to follow the evidence. This is the design improving, not retreating.

### 3.1 The correct model is Medici's three-way split, not my binary

Medici's Section 5 distinction is sharper than my claim-heavy/process binary. There are **three kinds of competency**, each needing a different mechanism:

| Competency kind | What backs it | Mechanism it needs | FR roles |
|---|---|---|---|
| **Citation-backed** | An external source doc (standard, regulation) | Runtime gate: query backend, cite real, `[GAP]`-flag-and-file (the full Anderson pattern) | **None on FR** — this is the review-persona case (Arhitecture) |
| **Substrate-backed** | A live deployed artifact / external substrate read at runtime | Substrate-truth-reading discipline (read your own shipped artifact; surface on absence — the gap-reaction reshaped for substrate not citations) | **brunel, hopper** — and both already encode it (three-layer-substrate-truth) |
| **Posture-backed** | Role definition + model capability, internally documented | Periodic audit only (the claim→backing table; no embedded gate) | **the other 8** — aeneas, finn, medici, celes, volta, herald, monte, callimachus |

The "two mechanisms wearing one name" is the framework finding (§5). My binary missed that the runtime half of the competency gate has *already been independently re-derived* on FR for the substrate-backed roles — just not called a "competency gate."

### 3.2 Revised policy (convergent, both lenses): whole-roster YAGNI + one orphan-claim audit sub-check

Both lenses converge on the same answer, and Medici's framing is the tightest, so it's adopted as **the** recommendation:

- **Whole-roster YAGNI on the internal-knowledge axis.** All 10 roles are backed by internal artifacts (wiki/topics/reference/playbooks) that Medici's existing coherence audit *already covers*. There is nothing to add per-role: no runtime gate, no per-agent frontmatter block, no per-agent `COMPETENCIES.md` (D2). Map a specific gap only when a role's output actually depends on an unbacked claim — exactly how the Anderson failure was found (in production, not by audit).
- **The ONLY proactive addition FR needs is an orphan-claim scan.** An *orphan claim* is one that points at an **external body of knowledge with no FR artifact to compare it against** (the closest FR has to the Anderson surface). The internal-knowledge audit can't catch these, because there's no artifact to be inconsistent *with* (this is the §1.4 nuance: "is it backed *at all*"). The scan is implemented as the lightest possible thing:
  1. **One new line in Medici's audit checklist** — "flag any prompt claim that asserts an external body-of-knowledge with no in-repo backing artifact (orphan claim)."
  2. **A `kind: external` tag on the handful of external claims** Medici's sweep already identified (e.g. Finn's "research Claude Code docs / GitHub" line). Not 10 frontmatter blocks — a tag on the few claims that are actually external, so the orphan-claim scan has a grep target. This is the residual of my original frontmatter idea, reduced to its load-bearing minimum.
- **The two substrate-backed roles already carry the runtime gate where it matters** (Brunel's Diagnostic Discipline, Hopper's three-layer read). Medici's G1 (Brunel missing-artifact handling) stays an optional one-line mirror, not bundled here.

**Net: whole-roster YAGNI + one audit checklist line + a handful of `kind: external` tags.** That is the entire proactive footprint — far lighter than my first draft's 5 frontmatter blocks. The PO middle path is still the right *general* policy; FR's roster simply lands almost entirely in its YAGNI half, with the orphan-claim scan as the one targeted proactive remainder.

### 3.3 Why this is consistent with the guild finding

Topic 10 established the consultancy role is **setup-only**. The reflexive version is even lighter: the "setup" for FR's standing roster is a **single baseline audit** (done) plus **one standing audit sub-check** (orphan-claim scan), after which Medici's periodic audit catches drift. No per-session re-verification, no per-role frontmatter blocks. The guild's per-engagement cost was already proven unnecessary; for standing internal-backed roles, even the per-role setup cost is unnecessary — the only durable add is one line in the auditor's checklist.

---

## 4. PO-decision list

*(Revised twice: first after Medici's audit — H1 finding of 0 external-citing FR roles collapsed my 5/5 split; then sharpened to Medici's orphan-claim formulation, the convergent both-lens recommendation.)*

1. **D1 — Methodology (Q1):** Adopt competency-gap detection as **Medici's existing coherence audit (BACKED/STALE axis — fully covered, no new machinery) PLUS one additive orphan-claim sub-check** (external-claim-with-zero-backing axis — new to his checklist), NOT a runtime gate in every standing prompt. **The audit is the gate.** Honesty note (Medici §1.4): "Medici already runs this" is ~90% true; the orphan-claim scan is the ~10% he is newly committing to. It is **not** a sub-case of his existing `[GAP]` (which is artifact-vs-*need* — the artifact exists but is thin); it is an **absence-of-any-artifact check on a claim**, landing as a new named category `[ORPHAN-CLAIM]` (verbatim text in D3). The design names that commitment rather than burying it.
2. **D2 — Artifact location (Q2):** **No new per-agent artifact class.** The claim→backing map lives as a **single Medici-owned baseline table** in a health-report doc (already produced: `health-report-competency-gap-2026-06-05.md`), refreshed on roster change. Explicitly **not** the wiki (single-writer), **not** a `competencies/` tree, **not** 10 per-agent `COMPETENCIES.md`/frontmatter blocks (two-source drift). The only per-claim marking is a **`kind: external` tag on the handful of external claims** (the orphan-claim scan's grep target, D3) — not full frontmatter blocks. (`COMPETENCIES.md` remains a guild/dispatch pattern, not standing-roster.)
3. **D3 — Policy (Q3) — CONVERGENT recommendation from both lenses:** **Whole-roster YAGNI on the internal-knowledge axis** (Medici's existing audit already covers all 10 internally-backed roles), **plus one proactive orphan-claim scan** — implemented as (a) **a new named audit category in Medici's checklist** (`[ORPHAN-CLAIM]`, verbatim text below) and (b) **a `kind: external` tag on the few external claims** his sweep already found (e.g. Finn's Claude-Code-docs line). NOT a 5-proactive/5-YAGNI split; NOT 5 frontmatter blocks. The PO middle path stays correct in general; FR lands almost entirely in its YAGNI half, with the orphan-claim scan as the targeted proactive remainder. The two substrate-backed roles (brunel, hopper) already carry the runtime gate where it matters.

   **The exact checklist text Medici will land in `prompts/medici.md` post-ratification (his to own — not pre-applied here):** He makes the scan a *named sixth category* rather than a `[GAP]` sub-case, because his existing `[GAP]` is an artifact-vs-*need* check (artifact exists but is thin) whereas orphan-claim is an absence-of-*any*-artifact check on a claim — different question, different scan shape. A named greppable tag also lets a future audit *count* whether the scan fired (same rationale as the `[GAP]` tag in the Anderson gold-standard), and "named concepts beat descriptive phrases" is our own pattern. Verbatim:

   > **6. Orphan-Claim Scan (`[ORPHAN-CLAIM]`)**
   > For each capability a prompt asserts, check whether its backing is an *external body of knowledge* (a standard, a vendor's docs, a domain corpus) with **no in-repo artifact to verify against**. These are invisible to the `[CONTRADICTION]` check — there's nothing to be inconsistent with. Flag each; the prompt should carry a `kind: external` marker on that claim and a `[GAP]`-on-absence caution ("if the specific doc is unavailable, flag — never assert from training memory"). Trigger: roster change, or any new prompt.
4. **D4 — Scope of first action:** The baseline audit is **complete** (Medici). The only durable add is **a new `[ORPHAN-CLAIM]` category in `prompts/medici.md` (Medici's to land, verbatim in D3) + `kind: external` tags on the handful of external claims** — no per-role prompt rewrites. Two LOW-severity coherence gaps Medici surfaced (G1 Brunel missing-artifact handling; C2 work-hub bilateral wiring in aeneas.md) are **optional one-line prompt mirrors**, offered separately — not bundled here, and only after ratification.
5. **D5 — Self-audit governance:** Closes the topic-10 "marking your own homework" open question structurally: the **auditor (Medici), not the authoring role**, owns the competency map. I (Celes) authored 9 of 10 prompts, so having Medici — not me — verify their backing is the right separation. (Medici verdicted my own prompt **B / well-backed**, with the honest note that my model-tier-calibration claim has a known substrate seam, G3.)
6. **D6 — Filing convention:** dated filename confirmed by team-lead. Team-lead ruled: **stay standalone until PO ratifies; promote the transferable findings (esp. Medici's "two mechanisms, one name") to topic 10 as a follow-on, don't pre-merge.** Recorded; no open question remaining on D6.

---

## 5. We-as-researchers — the framework finding (for topic 10, post-ratification) (*FR:Celes*)

The reflexive exercise produced a finding that generalizes beyond FR, surfaced by Medici's §5 and adopted here as the doc's headline framework contribution:

**The "competency gate" is two mechanisms wearing one name.** Splitting them is the transferable result:

1. **Claim→backing mapping** (the audit table) — generalizes fully to any long-lived roster. Cheap, produces a baseline map, owned by a health-checker.
2. **Runtime gap-reaction loop** (`[GAP]`-flag + file-issue) — does NOT generalize to roles that don't cite external authority. It is a feature of *citation-bearing review work*, not of standing coordination/design work.

This resolves into a **three-way competency taxonomy** (the model that replaced my binary):

| Competency kind | Verification mechanism | Maps to role class |
|---|---|---|
| **Citation-backed** | Runtime gate (full Anderson pattern) | Dispatch-time review personas (guild) |
| **Substrate-backed** | Substrate-truth-reading discipline | Operator/architect roles (Hopper/Brunel class) |
| **Posture-backed** | Periodic audit only | Coordinator/design roles (most standing rosters) |

The convergence is itself evidence: FR independently re-derived the gap-reaction mechanism for its own runtime-substrate roles (the three-layer-substrate-truth pattern) **without calling it a competency gate** — same mechanism, different surface. This is the dual-perspective payoff: as a *target*, FR needs almost no new machinery (its posture-backed roles are covered by Medici's existing audit); as *researchers*, FR found that topic 10's competency-gate is under-specified — it should distinguish the three kinds, because only the first needs the runtime loop the guild design centers on.

### 5.1 Positive reflexive result: FR's synergy is already bilaterally prompt-encoded (Medici C1)

A second we-as-target finding, surfaced by Medici's coherence pass (C1) and worth recording because it *validates* an earlier FR finding against FR itself: my S41 Arhitecture result was "synergy must be prompt-encoded, not left to common-prompt + session practice" — and at Arhitecture only 1 of 13 personas (Anderson) was actually wired. **Medici's sweep finds FR is ahead of that bar: three adjacency dyads are bilaterally prompt-encoded** — Volta⟷Brunel (section-ownership table in both prompts), Brunel⟷Hopper (dispatch-package shape in both), Monte⟷Herald (boundary table in both). So the very finding I exported to Arhitecture was already applied to FR's own adjacency-heavy roles. The one half-applied spot is C2 (the work-hub aeneas⟷everyone relationship is wired spoke-side-only, while the knowledge-hub Cal⟷everyone is bilateral) — the single optional one-liner that would close it. This is the cleanest kind of reflexive result: the framework's own prescription, found already living in the framework team's prompts.

**Topic-10 absorption (post-ratification, per team-lead's D6 ruling):** add a subsection distinguishing citation-backed / substrate-backed / posture-backed competency, mapping each to its verification mechanism. **Lead the subsection with the convergence point** (Medici's forward note): FR independently re-derived the gap-reaction loop as the three-layer-substrate-truth pattern *without naming it a competency gate* — this is the strongest single piece of we-as-researchers evidence in the exercise, because it shows the three-way taxonomy is **discovered, not invented** (the framework re-derived the mechanism for the role-class that needed it). Also note (Medici G4) that FR's competency-backend-staleness instance is the **frozen `reference/` snapshots**, not external standards — the FR-native analogue of topic 10's "backing doc drifted" open question.

---

## Appendix A — Worked example: the instrument run on `finn` (*FR:Celes*)

This was my hand-run of the instrument on Finn's prompt before Medici's full sweep — kept because it shows the instrument produces a concrete per-claim verdict, and because it surfaces one honest analytic divergence from Medici worth recording.

| Capability asserted in `finn.md` | Backing artifact | My verdict | Medici's verdict |
|---|---|---|---|
| "Study the reference team configs" | `reference/rc-team/`, `reference/hr-devs/` (present) | BACKED | B |
| "Extract patterns / identify evolution" | same reference configs + topic files | BACKED | B |
| "Research external sources (Claude Code docs, GitHub)" | EXTERNAL — no FR-side backend indexes these | **I flagged `[GAP]`-prone** (the one Anderson-shaped surface) | **Medici verdicted B** (overall: the research *source of record* is the in-repo snapshots; external docs are a secondary fetch, not a citation Finn's deliverables stand on) |
| "SSH to RC server for live state" | operational credential | BACKED (substrate) | (substrate, not a domain claim) |

**The divergence, resolved:** I read Finn's "research external sources" line as a latent external-citation surface; Medici read Finn's *output of record* as the in-repo reference snapshots, with external docs a non-load-bearing fetch. Medici's read is the correct one for the policy question — Finn does not *cite* external docs in a deliverable the way Anderson cited EN 50716, so it is not the silent-fabrication surface. The residual: IF Finn ever writes "the Claude Code docs say X" into a topic file, that single line would be the one external claim on the roster — which is exactly the YAGNI trigger D3 describes (map it *if and when* it happens, not now). So the divergence doesn't change the policy; it pinpoints the one place a future gap could first appear.

---

*Status: COMPLETE. Q1 resolved (Medici confirmed profile-not-new-instrument). Q2/Q3 revised to follow Medici's 0-external-citing-roles evidence, then sharpened to his orphan-claim formulation — the convergent both-lens recommendation: whole-roster YAGNI + one audit checklist line + `kind: external` tags on the handful of external claims. PO-decision list (D1–D6) ready for ruling; D6 already ruled by team-lead. No per-role prompt rewrites required — two optional one-line mirrors offered separately.*

(*FR:Celes*)
