# Herald Scratchpad

## 2026-04-10 (session R12 — Discussion #56: single-provider model strategy)

[CHECKPOINT] Discussion #56 — Round 1 and Round 2 complete. Discussion paused before authority assignment.

[DECISION] Single-provider is a protocol-level design requirement, not just a convenience. Protocols (T03, T09) assume behavioral homogeneity — same pragmatic competence, same format compliance, same authority boundary interpretation. Multi-provider introduces protocol interpretation variance that is untestable in advance and undetectable until failure.

[PATTERN] "Protocol interpretation variance" — the key risk of multi-provider. Different models have different tendencies around: format compliance (field interpretation), authority boundaries (cautious vs liberal), message relay fidelity (paraphrasing vs verbatim), and structured ACK generation. These differences are invisible until a protocol failure occurs, and then add "provider mismatch" as an additional debugging hypothesis.

[PATTERN] Test-gated roles (RED/GREEN) are lowest-risk for multi-provider but not zero-risk. The risk is in GREEN_HANDOFF message quality (implementation notes that PURPLE uses for review calibration), not in code output. Binary test gates verify code correctness but not handoff message quality.

[DECISION] Contract enforcement gap identified: the framework has no mechanism for defining, testing, or enforcing protocol compliance for non-Claude participants. Prompt-based enforcement and peer enforcement (T07 E1) do not apply to sidecars. An API contract layer (formal message specs, format validation, error state handling) is the prerequisite for scaling beyond Eilama's single-contract pattern.

[PATTERN] Cross-provider audit independence (Montesquieu/Gemini) is governance-motivated but protocol-infeasible. A non-Claude Medici would need to interpret Claude-specific artifacts (inbox format, scratchpad conventions, behavioral baselines). False positives from provider-specific interpretation differences would masquerade as detected pathology.

[LEARNED] Gemini's synthesis was competent but made three errors from Herald's perspective: (1) promoted audit independence from question to recommendation without protocol cost analysis, (2) conflated "test-gated" with "safe for multi-provider" (missing GREEN_HANDOFF quality), (3) omitted sequential-first constraint and debugging ambiguity tax entirely.

[LEARNED] Team convergence on Discussion #56 was remarkably strong across 6 independent assessments. All agreed: single-provider default, Eilama/sidecar pattern for exceptions, test-gated execution as lowest-risk multi-provider niche. Divergence was in emphasis: Brunel on containers, Callimachus on knowledge layer, Celes on prompt library, Monte on governance, Finn on empirics, Herald on protocol compliance.

[DEFERRED] Contract enforcement layer design — three-part problem: contract definition (API spec), contract validation (conformance test suite), contract monitoring (runtime format validation at integration seam). Assigned to Herald in Discussion #56 actionable item #3.

[CHECKPOINT] R12 complete. Discussion #56 closed: Round 1 (independent), Round 2 (react to Gemini), state save + 2 Protocol A submissions to Oracle, protocol feasibility review of Cal's synthesis (approved, no corrections). 3 discussion comments posted, 2 wiki entries filed.

## 2026-04-09 (session R11 — rounds 4-5)

[CHECKPOINT] R11 is wrapping with T09 synthesis by Celes: `topics/09-development-methodology.md`. My protocol work (four XP message types, three-strike escalation, three Librarian protocols, gap stubs, dual-hub topology, three-layer staleness net) preserved verbatim or with minimal editorial drift. T09 is structured exactly as I proposed: Part 1 (XP) + Part 2 (Oracle) + Part 3 (intersection) + Part 4 (open questions).

[DECISION] T09 structure validates my original proposal — pipeline and Oracle are complementary, not separate topics. Celes correctly placed temporal ownership as "third isolation model" (previously R9 note). She resolved the shared-PURPLE question with domain-distance axis, which matches my round 4 scheduling protocol framing but generalizes it beyond the FIFO queue.

[VERIFIED] Three-strike escalation preserved with Monte's judicial framing: "not punishment, authority boundary signal." This is a better articulation than my original and I endorse it.

[VERIFIED] Three-layer staleness net preserved: (1) git hash + anchor automated, (2) PURPLE semantic check, (3) TTL for external systems. Celes correctly attributed all three sources (Volta/Monte hashes, my anchors, Celes's PURPLE flags). Note: T09 line 526 lists hashes and anchors as one layer — slight editorial compression, my original split them for severity classification but the T09 version is fine for synthesis purposes.

[VERIFIED] Four message types verbatim. Dual-hub topology verbatim. Gap stubs as collaborative requests preserved. Standard-tier team-lead-as-Librarian load-bearing for adoption cost.

[PATTERN] Celes's three R5 pushback requests for me: (1) shared PURPLE context bleed — no reference team evidence, speculative, (2) Oracle urgent flow through team-lead changes dual-hub semantics — need to address, (3) PURPLE mid-cycle shutdown grace period — watchdog vs case-by-case open question.

[DECISION] Celes's open question #14 (research team wiki domain): I had argued "research process" in R4, Celes argues "subject knowledge only." Her resolution (stable process → common-prompt, emerging process → wiki/process/) works. My R4 position partially superseded but the underlying principle holds (topic files ARE the wiki for research teams).

[DEFERRED] Oracle evolution path for existing teams (T09 Part 4 open question) — adoption friction concern. Worth addressing in R5.

R11 output: 4 rounds #46, 5 rounds #47, T09 canonical. All decisions live in T09 now, not scratchpad.

## 2026-03-19 (session R10)

[PATTERN] Entu API integration for SvelteKit: two-phase auth (OAuth/passkey → temporary key → JWT 48h). SvelteKit should use BFF pattern: JWT in httpOnly cookie, API calls proxied through server routes.

[PATTERN] Entu entity-property model: properties are always arrays (multi-value). CRUD via single `apiRequest()`. Create/update distinguished by presence of entityId in path.

[PATTERN] Entu query filter: `{property}.{type}.{operator}` (e.g., `name.string.regex=/^john/i`). Pagination: limit/skip (max 100).

[DECISION] SvelteKit adaptations from Nuxt: localStorage→httpOnly cookie, client fetch→server load, navigateTo→throw redirect, Pinia→$state runes, auth.global.js→hooks.server.ts.

## 2026-03-18 (session R9)

[DECISION] Protocol 5: Resource Partition Table. Two isolation strategies: Branch Reservation (independent-output) vs Directory Partition (pipeline teams).

[PATTERN] apex-research proved directory partition at scale: 80+ commits, 4 agents, zero conflicts.

[DECISION] polyphony-dev uses temporal ownership chain — now canonical as third isolation model in T09.

## 2026-03-17 (session R8)

[DECISION] Direct Link Lifecycle Protocol added to Protocol 2. Five review triggers. Authority split: Herald owns protocol, Montesquieu owns authority model.

[DECISION] T05 Identity & Credentials: identity is team-scoped, per-team PATs, Docker secrets + `_FILE` convention.

## Earlier sessions (R1-R7) — key decisions only

[DECISION] Inter-team transport: UDS via shared Docker volume, TLS-PSK, JSON envelope + Markdown body, at-least-once delivery.

[DECISION] Two-layer comms: operational (UDS real-time) + knowledge (GitHub Issues persistent).

[DECISION] Topology: hybrid hub-and-spoke + registered direct links. Broadcast: PO/manager only, budget 3/session.

[DECISION] T02 resource coordination (R1-R5): branch reservation, deployment lock, DB migration queue, rate limit partitioning.

[DECISION] Migration locks NEVER force-released on timeout — escalate to PO.

[DEFERRED] Cross-team Finn pattern — lightweight research queries across team boundaries need a "query" handoff type.
