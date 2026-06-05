# FR Roster Competency-Gap Audit — Medici second lens (#74)

**Date:** 2026-06-05 (S43)
**Auditor:** Medici (Knowledge Health Checker)
**Role:** Second lens. This is EVIDENCE input to Celes's #74 design doc — she owns the design decisions (artifact architecture, synergy map, policy). I own the per-prompt claim→backing sweep.
**Scope:** 10 FR roster prompts — aeneas, finn, medici, celes, volta, herald, brunel, hopper, montesquieu (monte), callimachus.
**Lens:** my two audit categories `[GAP]` (claimed competency without backing artifact; asked-but-not-equipped) and `[COHERENCE]` (prompt internally consistent and consistent with the artifacts it relies on).

(*FR:Medici*)

---

## Reconciliation note (added 2026-06-05 after reading Celes's design doc)

Celes's design doc (`docs/2026-06-05-competency-gap-analysis.md`) buckets the roster **5 claim-heavy / 5 process** using a broader axis than my H1 below: "does the role cite **OR derive from** an authority external to FR's own design work?" My H1 used the narrower "cites an external **citation/URL**" axis and concluded "0 external-claim roles." **Celes's cut supersedes mine** — monte (derives governance from separation-of-powers), herald (typed-contract claims), celes (gold-standards), and medici (the instrument itself) all *derive from* a body of authority even though they don't fetch a URL, so they're correctly claim-heavy. Read H1 below as "0 external-**citation/URL** roles" (still true; still the reason fabrication-risk is low), not "0 claim-heavy roles." The genuinely-external surfaces are finn's literal doc-fetch plus the derive-from-authority claims Celes identified.

**The one genuinely-new audit piece (answer to Celes's sharp Q2):** my standard coherence audit is artifact-VS-artifact (needs two things to compare). A claim whose backing is an *external body of knowledge with no FR-side artifact at all* has nothing to be inconsistent with, so it is **invisible to my normal pass**. Catching it needs an additive **orphan-claim scan**: "for each prompt claim naming an external source, verify it has a backend OR a `[GAP]`-on-absence caution." This is the ~10% of competency-gap detection NOT already in my checklist; the BACKED/STALE axis (~90%) is. D1 should reflect this 90%-existing / 10%-new honestly.

---

## Headline findings (read these first)

**H1 — FR's roster carries structurally LOW Anderson-fabrication risk.** The Anderson failure (S40: correct analysis, fabricated *external* citations — URLs to standards) is the cautionary case in #74 Q1. But **no FR role cites external authority the way the Arhitecture review personas do.** FR "competency claims" are *role-definition assertions* ("I design lifecycle protocols", "I design governance", "I curate knowledge"), and their backing is **internal** to this repo (wiki entries, topic files, reference snapshots, playbooks). The fabrication *failure-mode* transfers; the fabrication *surface* does not. An FR agent cannot fabricate a citation to "EN 50716 clause 7.4.2" because no FR role's job is to cite EN 50716. This is the single most important input to Q3 (proactive-vs-YAGNI): the claim-heavy/process-role split that #74 proposes as the middle path maps onto the FR roster as **0 external-claim-heavy roles, 10 process/internal-claim roles.** The middle path collapses toward YAGNI for FR specifically.

**H2 — The real transferable risk is a different one: ASKED-vs-EQUIPPED gaps, not fabricated-citation gaps.** Several prompts ask an agent to do something the prompt does not equip them to do, or claim a competency whose backing artifact has drifted/been superseded. These are genuine `[GAP]`s but they are *coherence* gaps, not *fabrication* gaps. They are caught by audit (proactive), not by a runtime gap-reaction flag (the Anderson mechanism). This argues that the FR-native evaluation instrument (Q1) is **the audit itself** (what I'm doing now), not a prompt-encoded `[GAP]`-flag-and-file loop bolted onto every standing role.

**H3 — Only 1 of 10 prompts encodes a gap-reaction; that is correct, not a defect.** Only Hopper encodes anything resembling the dual-action gap protocol (his `[SANCTION-INCOMPLETE]` refusal + surface-back is a structural analogue: detect missing backing → refuse → route back). No other FR prompt has an Action-1 (flag) / Action-2 (file issue) pair. For external-citing review personas that's a defect (Arhitecture #9). For FR standing roles it is mostly appropriate — see H1. The exception worth considering is the two roles that DO consume external/cross-team substrate at runtime (Hopper, Brunel); they already have it.

---

## 1. [GAP] Per-agent claim → backing map

Legend: **Backing** = where the competency's substance actually lives. **B** backed (artifact exists and is current). **B-drift** backed but the backing artifact has drifted/superseded. **Internal-assert** competency asserted from role definition + training, no external citation surface (low fabrication risk by H1). **Equip-gap** prompt asks for X but does not equip for X.

| Agent | Core claimed competency | Backing artifact(s) | Verdict |
|---|---|---|---|
| **aeneas** (team-lead) | Coordination, decision-brokering, session continuity | `common-prompt.md`, `startup.md`, own scratchpad, MEMORY-style continuity | **B / Internal-assert** — coordinator role; no external claim surface. Low risk. |
| **finn** (research) | Pattern extraction, comparative study of reference teams | `reference/rc-team/`, `reference/hr-devs/`, `topics/*` | **B** — backing is the reference snapshots, which exist on disk and are read directly. Closest FR role to "cites a source," but the source is in-repo, not external. |
| **medici** (me) | Knowledge-health audit, coherence/gap/contradiction detection | own checklist (prompt §Audit Checklist), `topics/*`, `wiki/`, prior health-reports | **B / Internal-assert** — methodology is self-contained; no external authority cited. |
| **celes** (ARM) | Role sculpting, prompt engineering, model-tier calibration | `wiki/patterns/model-tiering-by-consequence.md`, `correlated-failure-single-provider.md`, `scope-block-drift-from-practice.md`, reference prompts | **B** — unusually well-backed; her craft has accumulated wiki patterns. |
| **volta** (lifecycle) | Startup/shutdown protocol design, duplicate prevention, handover | `topics/06-lifecycle.md` (his sections), `playbooks/shutdown-agent.md`, reference scripts | **B** — backed by the topic file he authors + reference scripts. |
| **herald** (protocol) | Inter-team handoff protocols, message schema, escalation routing | `topics/03-communication.md`, `types/t09-protocols.ts`, `wiki/patterns/protocol-shapes-are-typed-contracts.md` | **B** — protocol claims map to typed contracts + topic file. |
| **brunel** (container) | Container architecture, volume/auth/MCP, dispatch-package authoring | `topics/06-lifecycle.md` (container sections), `designs/deployed/<team>/container/*`, `docs/container-*`, `wiki/patterns/three-layer-substrate-truth-discipline.md` | **B** — strong; backing is the artifacts he himself ships. RUNTIME external substrate consumer (see H3). |
| **hopper** (operator) | Operational execution against deployed substrates, tier discrimination | `designs/deployed/<team>/`, `~/bin/rc-deployments.json`, `docs/operations-log-*`, three-layer-substrate-truth wiki | **B** — heavily backed; the ONLY role with an encoded gap-reaction analogue (sanction-incomplete refusal). RUNTIME external substrate consumer. |
| **monte** (governance) | Authority delegation, manager-agent design, conflict resolution | `topics/04-hierarchy-governance.md`, workspace `MEMORY.md`, reference common-prompts | **B / Internal-assert** — de-facto-governance evidence is in-repo; no external authority. |
| **callimachus** (librarian) | Knowledge curation, classification, dedup, provenance | `wiki/` itself, `types/t09-protocols.ts`, `wiki/process/stage-2-confirms-filing-gate.md` | **B** — the wiki IS his backing; richly instrumented. |

**Result: 10/10 backed. 0 fabricated-citation-risk roles.** Three roles lean "Internal-assert" (aeneas, medici, monte) — competency is a role posture, not a citation. Two roles (brunel, hopper) consume genuinely-external substrate at runtime and are the only places an Anderson-style "I'll just assert what the substrate does" risk could bite — and BOTH already encode substrate-truth-reading discipline (Brunel's Diagnostic Discipline; Hopper's three-layer read) that is the FR-native equivalent of a competency gate. **The gate pattern already exists where it's needed.**

---

## 2. [GAP] Asked-but-not-equipped — the real transferable findings

These are the genuine gaps. None is a fabrication risk; all are coherence gaps catchable only by audit.

- **G1 — Hopper has a gap-reaction; the other runtime-substrate role (Brunel) routes but does not flag-and-file.** Brunel's Diagnostic Discipline says "read your own deployed artifacts before diagnosing," but if a deployed artifact is *absent* (Layer 1 gap), only Hopper's prompt encodes the surface-back-on-absence posture (Graceful Degradation cases 1-3). Brunel's prompt assumes the artifacts exist. **Asked** (diagnose against substrate) vs **equipped** (handle missing substrate-truth): minor gap. Celes may weigh whether Brunel needs a one-line "if your own shipped artifact is missing, surface — do not infer" mirror of Hopper's case-1. LOW.

- **G2 — medici (my own prompt) claims `[CONTRADICTION]` and `[EXTRACTION]` audit categories but the prompt gives no instrument for them beyond "read everything and cross-reference."** Asked (detect contradictions across 8+ topic files) vs equipped (no diff tooling, no checklist beyond prose). In practice this works because the auditor is opus with full context — but it's an Internal-assert competency, exactly the kind #74 Q1 asks about. Honest disclosure: my own role is the clearest example of "competency = posture + model capability, not a backed instrument." LOW, and it is self-referential evidence for the YAGNI lean.

- **G3 — celes claims model-tier calibration ("opus for judgment-heavy, sonnet for volume, haiku for parallel")** but the roster `_substrate_note` documents that the Agent-tool substrate IGNORES the per-member model field. Asked (calibrate model tier) vs equipped (substrate honors only family-level overrides, and TeamCreate stamps the parent session model). This is a real claim→substrate-reality gap — but it's documented in the roster note, so it's a known coherence seam, not a latent fabrication. Celes already knows this (her scratchpad). LOW-but-worth-naming.

- **G4 — Several prompts reference `reference/` as primary source material (finn, volta, herald, monte, brunel, celes) but the reference snapshots are frozen** (rc-team + hr-devs). A competency "extract patterns from reference teams" is backed only as well as the snapshots are current. No staleness marker on the reference dir. This is the FR-native analogue of "the backing doc drifted" — the closest thing FR has to the external-doc-staleness problem topic 10 raises. Recommend Celes note in the design that the competency-backend-staleness question (topic 10 open question) applies to FR via the `reference/` snapshots, not via external standards. LOW but it's the cleanest we-as-researchers data point.

---

## 3. [COHERENCE] Cross-prompt consistency

- **C1 — GREEN: Coordination pairings ARE prompt-encoded for the substrate-execution dyad.** #74 Q3 worried synergy "lives only in common-prompt and session practice." Counter-evidence: Volta⟷Brunel (section-ownership table, both prompts), Brunel⟷Hopper (dispatch-package shape, both prompts), Monte⟷Herald (boundary table, both prompts). These three dyads are wired bilaterally — exactly the gold-standard Celes identified at Arhitecture. **FR is AHEAD of the Arhitecture roster here** (where only Anderson was wired). The S41 headline finding ("synergy must be prompt-encoded") was already substantially applied to FR's adjacency-heavy roles.

- **C2 — GAP: The knowledge-hub pairing (Callimachus⟷everyone) is encoded one-directionally well, but the WORK-hub pairing (aeneas⟷everyone) is thinner.** Cal's Protocol A/B is in every specialist prompt (Oracle Routing section) AND in Cal's prompt — bilateral. But aeneas's prompt (the work hub) does NOT enumerate who reports to him or the shape of those reports; it only lists his delegation workflow at a high level. Specialists know to report to team-lead (common-prompt), but team-lead's own prompt doesn't mirror the relationship. Asymmetry: the knowledge hub is bilaterally wired; the work hub is wired only from the spoke side. LOW — works in practice, but it's the one place the "synergy must be bilateral" rule is half-applied.

- **C3 — GREEN: Author-attribution coherence is clean.** 9 of 10 prompts carry `(*FR:Celes*)` (she authored them); medici and finn predate the trailer convention. Per CLAUDE.md L35 the original-author trailer is policy, not drift (I over-flagged this exact pattern on mvox-dev — learned). No action.

- **C4 — Medici/Callimachus boundary is coherent and bilaterally documented** (my prompt §Oracle Routing boundary; Cal's prompt §Medici Boundary). L0/L1 (framework design, me) vs L2/L3 (operational knowledge, Cal). No overlap drift. GREEN.

---

## 4. Direct answers to the PO's three framing questions (my lens only — Celes decides)

**Q1 — HOW to evaluate competence gaps; does claim→backing-doc mapping transfer?**
*Partially.* The claim→backing *table* transfers fine (Section 1 above is exactly that table, and it was cheap to produce). What does NOT transfer is the *runtime gap-reaction flag* — because FR roles don't cite external authority, there's nothing to flag at runtime. **The FR-native evaluation instrument is the periodic audit (this report), not a per-role embedded gate.** The audit is the gate. That's a clean role for Medici and it's already in my charter (`[GAP]` category) — no new machinery needed.

**Q2 — WHERE do competences live (per-agent COMPETENCIES.md / tree / wiki cards / frontmatter)?**
*My lens favors: do NOT create a new artifact class.* The backing already lives in the wiki + topics + reference + playbooks, and the claim→backing *mapping* is an audit output, not a standing file each agent maintains. A per-agent `COMPETENCIES.md` would (a) duplicate what the prompt already asserts, (b) drift from the prompt (two-source problem Cal warns about), and (c) violate `mega biblion mega kakon`. If anything is needed, it's a *single* audit-maintained mapping table (like Section 1) refreshed when the roster changes — owned by Medici, not 10 files owned by 10 agents. Frontmatter-on-prompts is the lightest option if a machine-readable form is wanted, but I'd only add it if a real consumer exists (none does yet → YAGNI). **Celes owns this call; this is my recommendation, not a decision.**

**Q3 — Proactive or YAGNI?**
*Strong YAGNI lean for FR specifically,* per H1: 0 external-claim-heavy roles. The proactive arm of the middle path is meant for citation-bearing roles; FR has none. The one proactive thing worth doing IS this one-time audit (done — Section 1), which doubles as the baseline. After that: YAGNI — map a gap only when a role's output actually depends on an unbacked claim, exactly as the Anderson failure was found in production. The two runtime-substrate roles (Brunel, Hopper) already carry the proactive gate where it matters. **Net: proactive once (this report), YAGNI thereafter.**

---

## 5. We-as-researchers (framework finding, dual-perspective discipline)

**Does the guild-specialist competency methodology generalize from dispatch-time review personas to long-lived team agents? — Partially, and the boundary is instructive for topic 10.**

The methodology has two separable halves:
1. **Claim→backing mapping** (the audit table). **Generalizes fully.** Works for standing roles, cheap, produces the Section-1 table.
2. **Runtime gap-reaction loop** (`[GAP]` flag + Action-2 file-issue). **Does NOT generalize to roles that don't cite external authority.** It is a feature of *citation-bearing review work*, not of *standing coordination/design work*.

This is a genuine framework finding for topic 10's open questions ("retainer quality assurance", "competency backend ownership"): **the competency-gate is two mechanisms wearing one name.** Dispatch-time review personas need both halves. Long-lived team roles need only the audit half, applied periodically by a health-checker, UNLESS the role consumes external/cross-team substrate at runtime (Brunel/Hopper class) — in which case it needs a substrate-truth-reading discipline, which is the gap-reaction loop re-shaped for substrate rather than citations (and FR already built exactly that, independently, in the three-layer-substrate-truth pattern). The convergence is itself evidence: FR re-derived the gap-reaction mechanism for its own runtime-substrate roles without calling it a "competency gate." Same mechanism, different surface.

**Suggested topic-10 absorption (Celes/Aen decide):** add a subsection distinguishing *citation-backed competency* (needs runtime gate) from *substrate-backed competency* (needs substrate-truth read) from *posture competency* (needs only periodic audit). The three map to: review personas / operator-architect roles / coordinator-design roles.

---

## Recommendations (for Celes's design doc; I recommend, lead decides)

| Tag | Recommendation | Rationale |
|---|---|---|
| [GAP] | Treat Section-1 table as the baseline competency map; do NOT spawn per-agent COMPETENCIES.md files | Avoids two-source drift; backing already in wiki/topics/reference |
| [GAP] | Adopt YAGNI-after-baseline policy for FR (Q3) | 0 external-claim roles; proactive arm has no target |
| [COHERENCE] | Consider a one-line "surface on missing artifact" mirror in brunel.md (G1) | Only runtime-substrate role lacking Hopper's absence-handling |
| [COHERENCE] | Consider wiring the work-hub relationship bilaterally in aeneas.md (C2) | Knowledge hub is bilateral; work hub is spoke-side-only |
| we-as-researchers | Feed Section-5 "two mechanisms, one name" finding into topic 10 open questions | Distinguishes citation-gate from substrate-read from posture-audit |
| [GAP] | Note `reference/` snapshot staleness as FR's competency-backend-staleness instance (G4) | Cleanest we-as-target↔researcher bridge for topic 10 |

(*FR:Medici*)
