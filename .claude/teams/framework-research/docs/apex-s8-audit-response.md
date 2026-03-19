# Framework-Research Team — Session 8 Audit Response (v2, post-push)

Reviewed by: Medici (Q1, Q3, Q8), Celes (Q2), Monte (Q4, Q5, Q6), Herald (Q7), Finn (data gathering). Full team assessment.

**Update:** Our initial audit found 6+ artifacts missing from git. The apex team pushed their uncommitted S8 work, and we re-audited. All findings below reflect the current state of main.

---

## Cross-Cutting Finding: Data Durability — RESOLVED

Our initial audit found 6+ artifacts referenced in the audit request but missing from the repository. **All are now committed.** The urgency is resolved, but the incident validates the RFC #3 recommendation: adopt task snapshots and explicit commit gates before session end.

---

## Q1: Source Extraction Fidelity — GOOD

**64 files, 24,524 lines** across 3 source document directories + 11 standalone source docs. The chapter-by-chapter extraction is now fully committed.

**Fidelity:** Spot-checked 3 chapters. Content is in **original Estonian/Russian** — direct extraction, not LLM-generated summaries. Mixed-language carrier questionnaire responses, specific SMGS bugs, Strangler Pattern implementation phases — all faithful to source material. No hallucination detected.

**Systematic tracking:** Each subdirectory has an INDEX.md with YAML frontmatter containing extraction audit metadata (chapters extracted, line coverage, known gaps, pass number, new findings count). This is auditable and reproducible.

**Verdict: GOOD — faithful extraction with systematic coverage tracking.**

---

## Q2: Spec Update Quality — Builder-ready, 5 gaps (2 partially addressed)

ARMSPV now at **550 lines** (+192 from pre-push), wagon-maintenance at **570 lines** (+183). The additions are substantive — business operations workflows, TAF/TAP integration points, CSZT messages, XSD schemas, security rules, infrastructure prerequisites. Not filler.

**Test: could we design a migration team from the ARMSPV spec alone?** Yes — 5 agents (TL/opus, Frontend/sonnet, Backend/opus, Test/sonnet, Requirements Analyst/sonnet), 3-sprint plan.

**5 gaps:**

| Gap | Status | Detail |
|---|---|---|
| No acceptance criteria format | **OPEN** | Business rules are descriptive, not testable. Migration team needs a requirements analyst for sprint 0. |
| No API contract surface | **PARTIALLY ADDRESSED** | wagon-maintenance now documents external XSD schemas at `portal.evr.ee/xsd/`. Knowing existing contracts helps backend scoping. Still no SvelteKit target API shapes. |
| Key decisions untagged by authority | **PARTIALLY ADDRESSED** | ARMSPV now tags PO blockers: `[AWAITING PO: Discussion #30]`. Wagon-maintenance has infrastructure prerequisites section. Some original decisions still unresolved/untagged. |
| No effort estimation | **OPEN** | Neither spec added sizing. |
| Cross-cluster deps implicit | **PARTIALLY ADDRESSED** | wagon-maintenance has explicit "Infrastructure Prerequisites" section. ARMSPV references ADR-006/007/008. Still no "Prerequisites" checklist at the top. |

**Recommendations:** (1) Add a requirements analyst role to convert business rules → testable AC in sprint 0. (2) Add rough sizing per route group (S/M/L/XL). (3) Add "Prerequisites" section at spec top referencing SHARED-DEPENDENCIES items. (4) Tag all "Key Decisions" by authority level (PO vs tech-lead). (5) Add API contract sketches for top 5 endpoints.

---

## Q3: Data Consistency — GOOD

All artifacts now committed and internally consistent.

- **spec-update-queue.json:** 99 updates across 11 clusters, well-structured with type/description/source/blocking flag
- **cluster-readiness.json:** 11 clusters assessed (1 blocked, 7 needs-update, 3 ready)
- **Cross-artifact consistency:** Queue shows 99 total, readiness shows 64 pending — delta of 35 represents already-applied updates. Consistent behavior. 3 blocking items match exactly between queue and readiness (all in ARMSPV: CIM scope, customs fields, row-level security).
- **source-contradictions.md ↔ specs:** Accurate cross-references, PO-resolved contradictions correctly reflected.
- **Minor version lag:** `clusters.json` shows `specStatus: "reviewed"` while `cluster-readiness.json` shows `"updated"` — readiness was generated after spec updates, clusters.json not yet refreshed.

**Verdict: GOOD — mutually consistent with explainable deltas.**

---

## Q4: Review Methodology — SOUND, scoring APPROVED with one recommendation

**The 4-phase process is rigorous:**

| Phase | Assessment |
|---|---|
| Coverage Audit | SOUND — drove the session's most impactful decision (875→24,524 line re-extraction) |
| Fact Extraction | SOUND — convergence criterion ("done when delta is zero") is rigorous |
| Spec Impact Verification | SOUND — found 92 unspecced messages, 20 unspecced BRs |
| Cross-Source Consistency | SOUND — 25 contradictions tracked with explicit resolution status |

**Scoring formula assessed:** `completeness = coverage (0-25) + extraction (0-25) + spec (0-25) + consistency (0-25)`. Each component has a clear measurement criterion: gap penalties, convergence, proportional completion, and hard penalty for unresolved HIGH contradictions.

**One recommendation:** The `spec_score` formula (`25 * applied / (applied + pending)`) treats all pending items equally. A spec with 100 applied and 2 pending scores 24.5 — but if those 2 are "implement row-level security" and "add 35 TAF/TAP messages," the spec is far from ready. **Add a `blocking` flag to spec-update-queue entries. Any `blocking: true` pending item should cap `spec_score` at 15.** This prevents near-perfect scores masking critical gaps.

**Bonus:** This methodology is a reusable framework asset — not apex-specific. Any research team doing source analysis could adopt it.

---

## Q5: PO Question Framing — Good to Excellent

| Discussion | Author | Verdict | Improvement |
|---|---|---|---|
| **#29** (WIMO scope + f301) | Nightingale | GOOD | Split Q2 into binary yes/no + separate follow-up |
| **#30** (ARMSPV pilot scope) | Hammurabi | EXCELLENT — gold standard | Make recommendation explicit: "We recommend Option C because..." |

Both answerable without a 30-minute briefing. #30 could be answered in under 2 minutes — three bounded options with pro/con. This format should be the template for all future PO questions.

---

## Q6: ADR Quality — All SOUND to EXCELLENT

| ADR | Verdict | Key finding |
|---|---|---|
| **ADR-006** (shared target DBs) | **SOUND** | Correctly scoped — catalogues constraints, doesn't design implementation. Comprehensive cluster impact table (11 clusters × 3 databases). |
| **ADR-007** (TAF/TAP messaging) | **SOUND** | Core decision clean ("domain events → format-specific messages"). Message catalogue appropriately supports the decision. Activity codes in appendix. Add a 5-line TL;DR at the top for readability. |
| **ADR-008** (row-level security) | **EXCELLENT** | Gold standard. Three-layer security model explains why APEX metadata shows "0 auth schemes" in KA2/MESPLAN/SPV — security is real but invisible to metadata. EU Directive 2012/34/EU citation elevates this to regulatory compliance. ARMSPV pilot blocker explicitly flagged. |

**Are they over-engineered?** No. All three record findings a migration team needs. ADR-008 is essential — dropping row-level security is a regulatory violation, not just a data leak.

---

## Q7: Dashboard IA — Coherent, not sprawling

The 3-group navigation (Analüüs / Migratsioon / Viited) maps logically to the research workflow ("What do we have?" / "Where are we going?" / "What did we learn from?"). Home page is an excellent PO executive summary.

**2 recommended nav moves:**

| Item | Current → Recommended | Reason |
|---|---|---|
| Contradictions | Migratsioon → Viited | Cross-source QA, not migration planning |
| Security | Migratsioon → Analüüs | Legacy system property, not migration artifact |

**Missing:** No Discussions view in the dashboard. The PO's primary interface doesn't surface the 3 unanswered PO questions (#26, #29, #30). Add at minimum a count/link on the home page.

**Scaling:** Current IA holds for research phase. When handoff begins, plan a 4th nav group ("Üleandmine"). Don't let it grow organically.

---

## Q8: Discussion Volume — Useful, not noise

22 discussions form a coherent research chain (#20 identified gap → #21 scoped impact → #22-28 cross-references → #31-34 catalogues → #36 synthesis). Titles are scannable, one topic per discussion, attribution present, structured data throughout.

**Two recommendations:**
1. **Pin #36 (session synthesis)** as the PO entry point. A PO facing 22 items needs a starting place.
2. **Convention:** Every high-output session (>10 artifacts) MUST produce a synthesis discussion as the mandatory entry point.

---

## Summary

| Question | Verdict | Strength highlighted |
|---|---|---|
| Q1: Extraction fidelity | **GOOD** | 24,524 lines, original-language, systematic INDEX.md tracking |
| Q2: Spec quality | **GOOD — 3 gaps remain** | Builder-ready, team-designable, +375 substantive lines |
| Q3: Data consistency | **GOOD** | 99-item queue, consistent blocking items, explainable deltas |
| Q4: Methodology | **APPROVED** | Reusable 4-phase process, add blocking flag to scoring |
| Q5: PO questions | **GOOD to EXCELLENT** | #30 is the gold standard for PO question framing |
| Q6: ADR quality | **SOUND to EXCELLENT** | ADR-008 is essential compliance finding |
| Q7: Dashboard IA | **COHERENT** | 2 nav moves, plan for handoff phase |
| Q8: Discussion volume | **USEFUL** | Pin synthesis, adopt entry-point convention |

Session 8 is genuinely impressive — 24,524 lines recovered, 99 spec updates queued, 3 ADRs (one identifying a regulatory compliance requirement), and a reusable review methodology. The data durability issue was the one real problem, and it's now resolved.

(*FR:Aeneas, synthesizing analysis from Medici, Celes, Monte, Herald, Finn*)
