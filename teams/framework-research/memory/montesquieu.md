# Montesquieu — Governance Architect Scratchpad

## Cumulative Decisions & Patterns (R8–R10)

[DECISION] T04: 39 decision types mapped across 4 authority levels (L0 PO, L1 manager, L2 TL, L3 specialist). Cross-team audit is ADVISORY. Spec HANDED-OFF requires PO. Emergency authority is time-bounded + scope-limited.
[DECISION] T07: 4 permission tiers (T0–T3), 5 enforcement layers (E0–E4), 5 blast-radius containment mechanisms. Defense in depth — no single layer sufficient.
[DECISION] Manager agent: 6 responsibilities, PO-to-L1 handoff is atomic (broadcast + ACK). Richelieu prompt needs 3 updates (Celes's responsibility).
[DECISION] GitHub Apps (one per team) is governance-optimal for identity/access. L0 decision. Supersedes machine-user approach.
[PATTERN] De facto governance is 5-layer: MEMORY.md (constitutional) → common-prompt (team law) → agent prompt (role) → peer enforcement → incident amendments.
[PATTERN] Governance gaps cluster at team boundaries. Cross-team governance designed but untested.
[PATTERN] Authority uncertainty in autonomous teams — TL asks permission for TL-scope decisions. Fix: authority quick-reference in common-prompt.
[PATTERN] App manifest = agent prompt analogy. Manifest = L0 ceiling; installation = L2 delegation; token = L3 credential.

## Open Questions (carried forward)

#1 Multiple manager agents — when/how to split L1 authority across multiple managers
#2 Amendment protocol — how governance rules themselves get changed
#4 Compliance audit — periodic governance compliance checks

## Session 2026-04-10 — Discussion #56 (Single-Provider Model Strategy)

[DECISION] Single-provider is governance-optimal at 2-5 teams. Provider choice is Row 8 (technology stack) — L0/PO decision.
[PATTERN] Correlated failure: all 5 enforcement layers (E0-E4) depend on same provider. Provider outage collapses entire safety stack simultaneously. Gap in Emergency Authority Protocol — covers PO unavailability but not provider unavailability.
[PATTERN] Governance complexity scales non-linearly with provider count: 7 new governance requirements identified for even limited multi-provider adoption.
[PATTERN] Audit-provider separation is the one multi-provider pattern that reduces governance complexity (genuine audit independence). BUT requires audit calibration protocol — auditor on different provider cannot distinguish provider-specific idioms from governance violations without calibration.
[PATTERN] Sidecar integration (Eilama pattern) sits below governance layer — no authority level, no delegation matrix entry. Peer agent integration sits inside governance layer — must be accounted for in every authority decision. Integration seam determines governance impact.
[GOTCHA] Multi-provider even as sidecar-only still requires: credential isolation (T05), incident response protocol changes, PO authorization per Row 8. Team-leads may NOT experiment with alternative providers without L0 approval.
[LEARNED] Callimachus's Oracle classification concern strengthens E4 audit argument: knowledge quality degradation from provider heterogeneity weakens the audit enforcement layer, not just the knowledge layer.
[LEARNED] Celes's 53 agent prompts are governance assets encoding behavioral assumptions — porting is governance re-validation, not just prompt engineering.
[LEARNED] Herald's protocol interpretation variance adds third failure mode to audit: governance violation vs protocol bug vs provider mismatch. Ambiguity tax compounds with team count.
[DEFERRED] Provider outage emergency protocol — actionable consensus item from all 6 participants. Awaiting task assignment to draft T04 amendment.

(*FR:Montesquieu*)
