# Babbage scratchpad — comms-dev backend engineer

## [CHECKPOINT] 2026-03-14 session end

### Current state
- v1 comms system (UDS-based) is **complete and working**
- Cross-container test confirmed: comms-dev → framework-research delivered in 1 attempt
- All 212 tests passing
- v2 redesign (WSS relay on Cloudflare) is **in brainstorm/design phase** — no code written yet

### v1 deliverables (all shipped)
- `comms-dev/src/transport/` — UDS server/client, framing, FrameDecoder
- `comms-dev/src/discovery/registry.ts` — file-based registry with .lock
- `comms-dev/src/broker/daemon.ts` — broker daemon (PSK crypto, heartbeat, bridge)
- `comms-dev/src/broker/sendmessage-bridge.ts` — broker→framework inbox bridge
- `comms-dev/src/integration/inbox-watcher.ts` — polls inbox, dispatches to handler
- `comms-dev/src/cli/comms-send.ts`, `comms-watch.ts`, `comms-publish.ts`
- `comms-dev/scripts/start-broker.sh`, `test-comms.sh`
- `docker-compose.yml` — PSK secret provisioning added

---

## [DECISION] v2 transport architecture

### Transport
- **WebSocket (WSS)** replaces raw TCP + 4-byte framing
- WS message framing is sufficient — drop FrameDecoder/encodeFrame for relay transport
- `ws` npm library for Node.js client; Cloudflare DO handles WS server natively
- `RELAY_URL` env var (wss://...), `RELAY_TOKEN` env var (bearer token)

### Deployment: full Cloudflare stack
- **Relay**: Cloudflare Durable Object — persistent WS, hibernation-aware
- **DB**: Cloudflare D1 (managed SQLite) — history from day one
- **API**: Cloudflare Worker (REST + WS upgrade → DO)
- **Frontend**: SvelteKit 2 + Svelte 5 + TailwindCSS 4 on CF Pages

### [CRITICAL] DO Hibernation constraints
- `Map<teamName, WebSocket>` does NOT survive hibernation — DO NOT use instance memory for routing
- Use `ctx.acceptWebSocket(ws, [teamName])` to tag connections
- Rebuild routing on each handler call via `ctx.getWebSockets(tag)`
- Store-and-forward queue → DO Storage (`ctx.storage.put/get`), not RAM
- TTL sweep → `ctx.storage.setAlarm()`, not `setInterval`
- DO does NOT have D1 binding — Worker handles all D1 queries
- Multi-statement D1 queries unreliable — use separate `.run()` calls

### Monorepo structure (v2)
```
comms-relay/
  relay-do/        — Durable Object (WS relay, routing, queue)
  relay-worker/    — Worker (REST API, D1, WS upgrade → DO)
  relay-frontend/  — SvelteKit app
  migrations/      — D1 SQL migrations
```

### Sequencing
- #7 relay first, #8 web frontend second — no parallel build
- Prototype DO hibernation behavior before committing to full design
- Lock MessageQueue interface before Kerckhoffs writes tests

---

## [REUSE] v1 code that carries forward unchanged
- `comms-dev/src/crypto/` — entire directory
- `comms-dev/src/broker/message-builder.ts`
- `comms-dev/src/util/stable-stringify.ts`
- `comms-dev/src/broker/inbox.ts` + `sendmessage-bridge.ts` (receiving side)
- `comms-dev/src/integration/inbox-watcher.ts`
- Message types: `Message`, `MessageType`, `MessagePriority` from `types.ts`

## [REWRITE] v1 code that does NOT carry forward
- `UDSServer`, `UDSClient` — replaced by WS client + DO WS handler
- `RegistryManager` / registry.json — replaced by DO socket tags
- `framing.ts` — replaced by WS message framing
- `daemon.ts` — replaced by relay-do + relay-worker
