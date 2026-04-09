# Herald Scratchpad

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
