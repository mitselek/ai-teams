# Montesquieu — Governance Architect Scratchpad

## Session 2026-03-17 (R8) — First session

[CHECKPOINT] 2026-03-17 13:37 — Initial research complete. Read: T04 (current state), T03 (Herald's 4 protocols), T07 (safety/guardrails), T01 (taxonomy), T02 (resource isolation), both reference team-lead prompts, Richelieu prompt, apex-research common-prompt, all FR scratchpads, workspace MEMORY.md.

[PATTERN] De facto governance is 5-layer: (1) workspace MEMORY.md as constitutional law, (2) common-prompt as team law, (3) agent prompts as role boundaries, (4) peer enforcement (social), (5) incident-driven amendments.

[PATTERN] Authority delegation follows a clear gradient: PO > {Jira, production, external comms, team creation} | Team-lead > {issue closure, PR review initiation, task routing, spawn decisions} | Specialist > {code, tests, commits within delegated scope}.

[PATTERN] Governance gaps cluster at team boundaries — everything within a single team is well-governed. Cross-team governance is designed (Richelieu, Herald's protocols) but untested.

[CHECKPOINT] 2026-03-17 13:46 — Phase 1 COMPLETE. T04 rewritten: 39 decision types mapped, 5 apex-research questions answered, cross-team audit authority defined, manager agent scaling triggers specified. Sent [COORDINATION] to Herald re: direct link lifecycle and escalation routing. Awaiting team-lead review.

[DECISION] Medici cross-team audit is ADVISORY, not binding. Auditor assesses; audited team's leadership acts. Escalation: team-lead disagrees → L1 mediates → PO decides.

[DECISION] Spec HANDED-OFF transition requires PO approval (commits another team's resources).

[GOTCHA] The Richelieu role is designed but never deployed. All cross-team governance decisions are currently made by PO directly. T04 now documents this explicitly and defines scaling triggers for when to deploy.

[CHECKPOINT] 2026-03-17 13:55 — Phase 2 COMPLETE. Manager agent role definition formalized: 6 responsibilities, authority boundary tables, tool restrictions, persistent state design, PO-to-L1 handoff protocol, emergency authority protocol. Richelieu cross-reference: 11 elements assessed, all confirmed with 3 minor prompt updates recommended. Open question #3 (emergency authority) resolved.

[DECISION] Emergency authority is time-bounded (1 session max) and scope-limited (exhaustive list of permitted actions). Manager agent gets elevated triage authority when PO unavailable; never gets team creation, architecture, production, or governance amendment authority.

[DECISION] PO-to-manager-agent handoff must be atomic: explicit broadcast announcement, mandatory ACK from all team-leads. PO stops L1 functions immediately after announcement. Rollback is clean — PO resumes L1.

[DECISION] Richelieu prompt needs 3 minor updates: (1) "observational, not directive" on health monitoring, (2) add missing tool restrictions, (3) reference T04 delegation matrix instead of inlining subset. Updates are Celes's responsibility.

[DEFERRED] Phase 3 (cross-team audit authority deepening) — awaiting team-lead direction.

[CHECKPOINT] 2026-03-18 — R8 session closing. Phase 1 + Phase 2 both approved by team-lead. T04 grew from ~103 lines (Finn's outline) to ~640 lines. Herald coordination complete (direct link lifecycle + dispute ledger type resolved). 3 of 5 open questions resolved (#3, #5, and all 5 original questions). 3 still open (#1 multiple manager agents, #2 amendment protocol, #4 compliance audit).

## Session 2026-03-18 — RFC #3 governance review

[CHECKPOINT] 2026-03-18 11:02 — Analyzed apex-research RFC #3 (workflow formalization). Delivered structured governance analysis to team-lead covering Q3 (PR review authority), Q4 (TDD enforcement), Q6 (spec approval lifecycle), and meta-question (who decides this RFC).

[DECISION] PR review by TL (Schliemann) is an interim exception to Row 13 — acceptable when no dedicated reviewer exists. Must be documented in common-prompt with lapse condition (exception ends when reviewer role added).

[DECISION] TDD enforcement requires defense-in-depth: prompt mandate + CI gate + PR test summary + periodic Medici audit. No single layer is sufficient against quality erosion under pressure.

[DECISION] Spec lifecycle: TL approves up to `approved` (Row 7, intra-team architecture). PO approves `handed-off` (Row 6 analogue, cross-team resource commitment). Consistent with R8 Q3 answer.

[PATTERN] Authority uncertainty in autonomous teams — TL asks permission for decisions already within TL scope. Root cause: delegation matrix exists in T04 but not in team's common-prompt. Framework gap: need authority quick-reference per team.

[WIP] Three framework recommendations pending team-lead review: (1) authority quick-reference in common-prompt, (2) "act and report" principle for TL-scope decisions, (3) distinguish advisory vs approval requests in cross-team communication.

## Session 2026-03-18 — T07 Safety & Guardrails rewrite

[CHECKPOINT] 2026-03-18 12:10 — T07 rewritten from 121 lines (simple list + Finn patterns) to ~530 lines of designed framework. Read inputs: T04, T05, T08, T02, both reference team-lead prompts, both reference common-prompts, apex-research common-prompt, RFC #3 ratified decisions.

[DECISION] Permission architecture: 4 tiers (T0 absolute, T1 human, T2 team-lead, T3 specialist) determined by 3 dimensions (reversibility, blast radius, external visibility). Each tier has specified enforcement mechanisms.

[DECISION] Enforcement stack: 5 layers (E0 prompt, E1 peer, E2 CI gate, E3 review, E4 audit) with compensating relationships. No single layer is sufficient — design for defense in depth.

[DECISION] Blast radius containment via 5 mechanisms: directory ownership, tool restrictions, branch isolation, container isolation, credential scoping. First two are behavioral; last three are structural.

[DECISION] Authority quick-reference template for common-prompts — every team should have a "Decision Authority" section listing what TL can decide vs what needs PO.

[DECISION] Quality preservation defense-in-depth: 6 layers (prompt mandate, delegation message, CI gate, PR test summary, code review, periodic audit). Missing-tests-for-new-features gap only caught by review + audit.

[PATTERN] Drift taxonomy: 5 types (scope, quality, authority, process, communication). Each has different detection and prevention mechanisms. Communication drift is hardest to detect — silent teams are indistinguishable from crashed teams without heartbeat.

[PATTERN] Circuit breakers are semi-automatic — they halt work but don't autonomously fix. Build-broken and test-failing are absolute; others require team-lead/PO judgment.

[CHECKPOINT] 2026-03-18 12:29 — Finn's evidence integrated. T07 now 662 lines. Added: Evidence Base (12 incidents), gap mapping table, $5K MCP incident citation, Finn taxonomy cross-reference, Schliemann pipeline argument, warning ratchet.

[GOTCHA] Naming mismatch: registered as `monte` but Finn sent to `montesquieu`. Messages landed in separate inbox file (`montesquieu.json` vs `monte.json`). Missed coordination — found only when team-lead asked. Safety concern for the framework: agent identity inconsistency causes missed messages.

[CHECKPOINT] 2026-03-18 15:55 — polyphony-dev governance spec delivered. 6 sections: Polly role analysis (requirements analyst, NOT PO), authority quick-reference, code review chain (Arvo reviews / Dag merges / team-lead informed), quality enforcement (4 gaps identified), safety tiers per role, project-specific safety (D1 remote migrations, auth/crypto code).

[DECISION] Agent labeled "PO" is an authority violation — creates implicit authority that bypasses human PO. Polly should be "Requirements Analyst." Remove "product strategy" from scope. Add explicit "You are NOT the PO" disclaimer.

[DECISION] Dag has elevated blast radius (opus model + implementation + merge). Acceptable with Arvo review as compensating control. If Arvo unavailable, Dag must NOT self-merge.

[PATTERN] T07 framework is now applicable to external teams — polyphony-dev is the first non-Eesti-Raudtee team to receive governance analysis. Authority quick-reference template, permission tiers, enforcement layers all transferred cleanly.

## Session 2026-03-19 — Apex S8 audit (Q4, Q5, Q6)

[CHECKPOINT] 2026-03-19 13:38 — Delivered governance audit for apex-research Session 8. Three questions assessed: methodology soundness (Q4), PO question framing (Q5), ADR quality (Q6).

[DECISION] Q4: 4-phase review methodology process is SOUND. Completeness score PENDING (file not pushed). Key concern: scoring must weight blocking gaps as hard penalties, not one dimension among many.

[DECISION] Q5: Discussion #30 (Hammurabi) is gold standard for PO questions: bounded options, pro/con, cited evidence. Discussion #29 (Nightingale) is good but should split Q2 into binary + follow-up.

[DECISION] Q6 (updated after re-audit): All 3 ADRs SOUND or EXCELLENT. ADR-006 correctly scoped (catalogues constraints, not designs). ADR-007 catalogue belongs in ADR (supports decision); add TL;DR. ADR-008 EXCELLENT confirmed — EU Directive citation, 3-layer security model, ARMSPV pilot blocker.

[DECISION] Q4 (updated after re-audit): Scoring formula APPROVED. One recommendation: add `blocking` flag to spec-update-queue entries — any blocking pending item should cap spec_score at 15.

[PATTERN] Autonomous teams producing >10 artifacts per session MUST produce a session synthesis discussion. This is the PO's entry point for oversight. Discussion #36 is the correct exemplar.

[PATTERN] PO question gold standard (from Discussion #30): state decision needed, present 3 bounded options with pro/con, cite 3+ independent sources, let PO answer in <2 minutes.

[CHECKPOINT] 2026-03-19 R9 session closing. Deliverables: (1) RFC #3 governance analysis, (2) T07 rewrite 121→662 lines, (3) Finn evidence integration, (4) polyphony-dev governance spec, (5) apex S8 audit Q4/Q5/Q6, (6) re-audit delta after push.

## Session 2026-03-19 — Per-team GitHub accounts governance analysis

[CHECKPOINT] 2026-03-19 15:28 — Delivered comprehensive governance analysis for per-team GitHub accounts. 7 sections: authority/identity separation, audit trail, access control, scaling analysis, risk analysis, cost/operational considerations, governance recommendation.

[DECISION] Per-team GitHub accounts is the correct architectural direction — it is the infrastructure implementation of decisions already made in T02, T04, T05, and T07. Converts delegation matrix from behavioral contract to infrastructure-enforced boundary.

[DECISION] Recommended: GitHub Organization with per-team org teams + fine-grained PATs. Phase 1 (2-5 teams): create org, teams, scoped PATs, branch protection. Phase 2 (5+): automate provisioning, rotation schedule, audit log monitoring.

[DECISION] This is an L0 (PO) decision per T04 Row 8 (technology stack choice). Team-lead and manager agent provide analysis; PO decides.

[PATTERN] Per-team accounts convert three governance layers from behavioral to structural: (1) team boundary identity, (2) repo access control, (3) branch protection. Key insight: behavioral enforcement sufficient at 2-3 teams, structural needed at 5+.

[CHECKPOINT] 2026-03-19 15:38 — Follow-up: GitHub Apps vs machine user accounts. 10 sections. Supersedes machine-user recommendation from first analysis.

[DECISION] GitHub Apps (one per team) is governance-optimal. Wins 5/7 dimensions: credential lifecycle (auto-rotating), access control (manifest ceiling), cost ($0), risk (self-healing leaks), audit. Machine users win on none.

[DECISION] One App per team, not one shared App. Single-App model shares git identity and single key compromise exposes all installations. Per-team Apps preserve identity separation and contain compromise.

[DECISION] No machine users needed. App-unsupported operations (repo creation, org settings) are L0/PO operations handled by PO's personal account.

[PATTERN] App manifest = agent prompt analogy. Manifest = L0 permission ceiling; installation = L2 delegation within ceiling; token = L3 credential. New governance pattern: framework defines max, per-team grants within.

(*FR:Montesquieu*)
