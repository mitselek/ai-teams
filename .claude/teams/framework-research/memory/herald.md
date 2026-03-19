# Herald Scratchpad

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
