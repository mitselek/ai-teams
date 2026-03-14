# Team Lead Scratchpad

## [CHECKPOINT] 2026-03-14 17:34

### Session Summary
- Built v1 comms system: broker, crypto, transport, inbox, bridge, CLI tools
- 212 tests passing, 27 tasks completed
- Cross-container UDS test: CD↔FR messages partially worked (FR→CD unreliable)
- Root cause: UDS sockets don't work reliably across Docker container namespaces
- Pivoted to centralized relay architecture

### Architecture Decision: Cloudflare Stack (Issue #7 + #8)
- **Relay:** Cloudflare Durable Object (WS hibernation API, socket tags)
- **DB:** Cloudflare D1 (managed SQLite, persistent history from day one)
- **API:** Cloudflare Worker (REST + WS upgrade → DO dispatch)
- **Frontend:** SvelteKit 2 + Svelte 5 + TailwindCSS 4 on CF Pages
- **Auth:** RELAY_TOKEN (agents) + WebAuthn/passkeys (browsers)
- **Crypto:** COMMS_PSK for agent E2E, transport-only TLS for web users v1
- **Deploy:** `wrangler` CLI, no Docker/Caddy

### Key Design Constraints (from FR)
- DO hibernation kills in-memory state — use socket tags + `ctx.getWebSockets(tag)`
- Store-and-forward → DO Storage (not RAM)
- TTL sweep → DO Alarm (not setInterval)
- D1: no multi-statement queries, PRAGMA foreign_keys no-op in migrations
- DO does NOT need D1 bindings — Worker handles all D1

### Blocking Prerequisites
- [ ] Domain from PO (for WebAuthn rpId)
- [ ] Cloudflare paid plan ($5/mo for DO)

### Build Sequence
1. comms-relay/ — DO + Worker + D1 schema (#7)
2. Web frontend — SvelteKit + WebAuthn + Playwright (#8)

### [DEFERRED] New team member "Lovelace" (frontend specialist, Sonnet)
- FR proposed, comms-dev accepted
- Hire when #8 starts

### [DEFERRED] v2 browser E2E (per-session X25519 via Web Crypto API)

### Issues
- #1 — Protocol spec (open, testing instructions posted)
- #2 — Checksum bypass (closed, fixed)
- #7 — RFC: Central relay (open, all decisions resolved)
- #8 — RFC: Web frontend (open, FR reviewed)

### Agent Status
- vigenere: standing by, crypto module is transport-agnostic (100% reuse)
- babbage: standing by, needs to adapt design for DO hibernation
- kerckhoffs: standing by, Playwright required for web frontend testing

### v1 Code Reuse for v2
- 100%: crypto/*, message-store, inbox, sendmessage-bridge, stable-stringify
- 80-90%: types.ts (add conversation_id), message-builder (add conversation_id to AAD)
- 0%: transport/*, discovery/* (UDS-specific, replaced)
