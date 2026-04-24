# Lovelace scratchpad
# (*CD:Lovelace*)

## [CHECKPOINT] 2026-03-23 — Initial codebase review

### What exists
- `comms-dev/src/` — full backend: broker daemon (v1 UDS, v2 TLS), crypto, discovery, CLI tools
- `comms-dev/tests/` — vitest test suite covering transport, broker, crypto, CLI
- **NO `comms-relay/relay-frontend/`** — frontend does not exist yet. I build it from scratch.

### Message format (critical for frontend rendering)
```typescript
interface Message {
  version: '1';
  id: string;          // "msg-<uuid>"
  timestamp: string;   // ISO 8601
  from: { team: string; agent: string; prefix?: string };
  to:   { team: string; agent: string; prefix?: string };
  type: 'handoff' | 'query' | 'response' | 'broadcast' | 'ack' | 'heartbeat';
  priority: 'blocking' | 'high' | 'normal' | 'low';
  reply_to: string | null;
  body: string;        // Markdown-formatted
  checksum: string;    // "sha256:<hex>" or "hmac-sha256:<hex>"
}
```

### Backend transport (no HTTP yet)
- v1 daemon: UDS sockets at `/shared/comms/<team>.sock` — binary framing (4-byte length prefix)
- v2 daemon (DaemonV2): TLS TCP sockets between daemons + local UDS JSON-newline command socket
- **No HTTP or WebSocket layer exists** — the frontend cannot connect to the backend directly today

### DaemonV2 UDS command protocol (JSON-newline over socket)
```
send: { cmd, from, to ("agent@team"), body, type?, priority?, reply_to? }
status: { cmd: "status" } → { ok, status, uptime_seconds, version, team_name, port }
reload: { cmd: "reload" } → { ok, success, reloaded_at, acl_agents_count }
peers:  { cmd: "peers"  } → { ok, peers: [{team, status, host, port, connected_at}] }
```
Response: `{ ok: boolean, message_id?, delivered_at?, code?, message?, ... }`

### Infrastructure context
- comms-dev gets dedicated IP 10.100.136.163 on PROD-LLM network
- Port 5173 open inbound (HTTP) — this is where the frontend will be served
- Production: Cloudflare Pages or SvelteKit on adapter-node/cloudflare

### [DEFERRED] Coordination needed with Babbage
Frontend cannot connect to backend without an HTTP/WebSocket bridge layer.
Babbage needs to expose:
1. **REST API** — `GET /history/:conversation_id` (message history)
2. **WebSocket** — real-time message stream from inbox
3. **Authentication** — WebAuthn challenge endpoint

Until Babbage builds this HTTP relay layer, I can:
- Build the SvelteKit app scaffold, routes, layout
- Build reactive stores and component structure against a mock API
- Define the API contract I need and send [COORDINATION] to Babbage

### [GOTCHA] comms-watch vs SendMessageBridge
Running both simultaneously causes race condition on inbox files. Frontend must not poll inbox files directly — must go through a proper HTTP/WS bridge.

### [PATTERN] Inbox delivery
Messages land as `<message-id>.json` files in `~/.claude/teams/<team>/inboxes/`.
The HTTP bridge (to be built by Babbage) would watch this dir and push via WebSocket.

### [WIP] Next steps (waiting for task from team-lead)
1. Coordinate with Babbage on HTTP/WebSocket API contract
2. Scaffold `comms-relay/relay-frontend/` SvelteKit project
3. Build message store (Svelte 5 runes), WebSocket client, message rendering components
