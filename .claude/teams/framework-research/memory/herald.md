# Herald Scratchpad

## 2026-04-08 (session R11)

[DECISION] Librarian introduces dual-hub intra-team topology (team-lead for work, Librarian for knowledge). First protocol where routing target is NOT team-lead.

[DECISION] Three Librarian protocols: (A) Knowledge Submission (agent→Librarian, push-based, structured message), (B) Knowledge Query (agent→Librarian→agent, request/response with urgency), (C) Knowledge Promotion (Librarian→team-lead, wiki→common-prompt lifecycle gate).

[DECISION] Knowledge submission to wiki is explicit (Protocol A). Scratchpad READING is unrestricted (PO correction #5, R3). No Medici safety net in deployed teams (PO correction #6, R3).

[DECISION] Librarian is standalone, not Medici evolution. Different communication modes: Medici=pull/periodic, Librarian=push/real-time. Merging creates scheduling conflicts.

[DECISION] No global cross-team wiki yet. Cross-team knowledge flows via existing Protocol 1 handoff with type:knowledge. Global wiki only when L1 manager agent exists AND 3+ teams share a domain.

[DECISION] Knowledge lifecycle: Discovery (scratchpad) → Curation (wiki) → Codification (common-prompt). Each transition has a gate. No two-level jumps.

Posted to: https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16487536

[DECISION] PO: Librarian is full gateway (reads AND writes). Exception: RED/GREEN/PURPLE may direct-read mid-cycle with [WIKI-READ] log (PO refinement #2, R3). SPOF: team lead respawns, no circuit breakers (PO correction #7, R3 — my R2 circuit breaker withdrawn).

[DECISION] Shutdown-only promotion sufficient for Standard tier. Cathedral tier needs mid-session via Protocol A. Common-prompt promotion always at shutdown (broadcast cost of mid-session update too high).

[DECISION] Librarian context management: re-read wiki pages on demand (retrieval-augmented), keep only index + access tracking + cross-ref graph in context. Prevents context exhaustion as wiki grows.

[PATTERN] Provenance frontmatter extended with read-count, last-read-by, queried-by fields — only possible because of gateway model. Transforms provenance from supply-side ("who wrote") to supply+demand ("who wrote AND who depends on it").

Posted round 2: https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16492026

[DECISION] Wiki bootstrapping: 3-phase protocol (Extract → Triage → Populate). Librarian reads knowledge artifacts (scratchpads, docs, specs, decisions), NOT raw code. Team lead triages proposed structure before population. Bootstrap entries get `bootstrap: true` flag (lower confidence).

[DECISION] Source linking: wiki entries link to source files via anchor patterns (not line numbers). Staleness via `git diff <linked-at>..HEAD` + anchor grep. Three risk levels: CRITICAL (file deleted), HIGH (anchor missing), LOW (file changed, anchor present).

[DECISION] Librarian as health sensor: secondary function, not primary. Produces Health Digest at shutdown (always) and mid-session (only for critical signals like 3+ agents querying same gap). Digest reports redundant discoveries, persistent gaps, low-submission agents, promotion candidates, source-link drift. All diagnostics go through team lead — Librarian is sensor, not controller.

[PATTERN] Topics 9 (source linking) and 10 (health sensing) compose — source-link drift feeds into the Health Digest. One output format, one reader, one decision point.

[DECISION] Librarian recommends through team lead, never interrupts agents directly (PO refinement #3, R3). Withdraws Medici's proposed Protocol D (direct notifications).

Posted round 3: https://github.com/mitselek/ai-teams/discussions/47#discussioncomment-16498612

[DECISION] XP pipeline is a state machine, not a DAG. PURPLE→GREEN rejection creates a cycle. Protocol 5 (directory partition) does not apply — temporal ownership chain is the correct isolation model.

[DECISION] Four message types for XP cycle: TEST_SPEC (ARCHITECT→RED), GREEN_HANDOFF (GREEN→PURPLE), PURPLE_VERDICT (PURPLE→GREEN/ARCHITECT), CYCLE_COMPLETE (PURPLE→ARCHITECT). Key innovation: GREEN_HANDOFF requires "implementation notes" field where GREEN self-reports shortcuts.

[DECISION] PURPLE veto with three-strike escalation: 1=normal reject, 2=pattern warning, 3=escalate to ARCHITECT for re-evaluation.

[DECISION] ARCHITECT and PURPLE should be different agents (conflict of interest if same). Reviewer (Marcus/Penrose) still needed alongside PURPLE — different scope: PURPLE=intra-story structure, Reviewer=cross-story consistency.

[PATTERN] Lookahead optimization: RED writes test T(N+1) while GREEN implements T(N). Doubles throughput. Cancels on PURPLE rejection.

[DECISION] Proposed T09: Development Methodology as home for XP pipeline pattern.

Posted to: https://github.com/mitselek/ai-teams/discussions/46#discussioncomment-16487317

## 2026-03-19 (session R10)

[PATTERN] Entu API integration for SvelteKit: two-phase auth (OAuth/passkey → temporary key → JWT 48h). Webapp does ALL API calls client-side with Bearer token in localStorage. SvelteKit should use BFF pattern instead — JWT in httpOnly cookie, API calls proxied through server routes.

[PATTERN] Entu entity-property model: entities are containers, properties are typed KV pairs (string/number/boolean/date/datetime/reference). Properties are always arrays (multi-value). CRUD via single `apiRequest()` function that builds URL as `{apiUrl}/{accountId}/{pathname}`. Create/update are the same endpoint (POST), distinguished by presence of entityId in path.

[PATTERN] Entu query filter syntax uses dot-notation: `{property}.{type}.{operator}` (e.g., `name.string.regex=/^john/i`, `age.number.gte=18`). Supports regex, range, exists, in. Pagination: limit/skip (max 100). Full-text via `q` param.

[PATTERN] Entu file handling: S3 pre-signed URLs with 60s TTL. Upload flow: POST file metadata → get signed URL back → client XHR PUT directly to S3. Download: GET property → redirect to signed download URL. Webapp uses XMLHttpRequest (not fetch) for upload progress tracking.

[DECISION] Key SvelteKit adaptations from Nuxt webapp: localStorage→httpOnly cookie, client fetch→server load functions, navigateTo→throw redirect, Pinia store→$state runes, auth.global.js→hooks.server.ts.

## 2026-03-18 (session R9)

[DECISION] Protocol 5: Resource Partition Table. Two isolation strategies: Branch Reservation (independent-output) vs Directory Partition (pipeline teams). Selection: does every agent's output flow into another's input? Yes=partition, No=branch.

[PATTERN] apex-research proved directory partition at scale: 80+ commits, 4 agents, zero conflicts. Three properties: strict directory ownership, unidirectional data flow (DAG), append-mostly output.

[DECISION] Data Contract sub-protocol for Protocol 5. Contract file in types/ updated BEFORE data changes.

[DECISION] polyphony-dev uses temporal ownership chain (TDD rotation), not space partition. Third isolation mode alongside space (Protocol 5) and branch (R1).

[PATTERN] Dashboard IA audit: 3-group nav coherent, need 4th group (Üleandmine) when handoff begins. Discussions not surfaced despite being PO feedback channel.

## 2026-03-17 (session R8)

[DECISION] Direct Link Lifecycle Protocol added to Protocol 2. Five review triggers. Authority split: Herald owns protocol, Montesquieu owns authority model.

[DECISION] T05 Identity & Credentials deepened to 481 lines. Key: identity is team-scoped, per-team PATs, Docker secrets + `_FILE` convention, no self-escalation.

[PATTERN] Credentials are injected, never discovered. MCP servers need `_FILE` env var convention for multi-team secret isolation.

## Earlier sessions (R1-R7) — key decisions only

[DECISION] Inter-team transport: UDS via shared Docker volume, TLS-PSK encryption, JSON envelope + Markdown body, at-least-once delivery.

[DECISION] Two-layer comms: operational (UDS real-time) + knowledge (GitHub Issues persistent). Bridge: findings auto-promote.

[DECISION] Topology: hybrid hub-and-spoke + registered direct links. Broadcast: PO/manager only, budget 3/session.

[DECISION] T02 resource coordination (R1-R5): branch reservation, deployment lock, DB migration queue, rate limit partitioning, unified lock registry.

[DECISION] Migration locks NEVER force-released on timeout — escalate to PO.

[DEFERRED] Cross-team Finn pattern — lightweight research queries across team boundaries need a "query" handoff type.
