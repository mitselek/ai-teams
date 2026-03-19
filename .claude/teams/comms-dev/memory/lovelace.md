# Lovelace scratchpad — comms-dev CLI/TUI tooling engineer

## [CHECKPOINT] 2026-03-19 brainstorm complete

### Role pivot (confirmed)
- No web UI, no browser, no SvelteKit
- New role: CLI/TUI tooling engineer for v2 cross-team messaging system
- Domain: `comms-keys`, `comms-acl`, `comms-daemon` CLI tools

### v2 Architecture (finalized from brainstorm)
- Per-team relay daemon: key holder, ACL enforcer, transport
- mTLS daemon-to-daemon persistent tunnels (not per-message connections)
- Per-team keypair only — no per-agent keypairs in v1
- Inside tunnel: plaintext JSON with v1 4-byte length-prefixed framing + v1 envelope
- ACL per-agent (`agent@team` addressing), one-directional, wildcards supported (`*@team`)
- Receiving: inbox polling at 500ms
- Sending: `CrossTeamSend` MCP tool, blocks until remote daemon ACKs
- At-least-once delivery, deduplicated by message ID at receiver

### [DECISION] Key directory layout (confirmed)
```
/run/secrets/comms/
  daemon.key        # ECDSA P-256 private key
  daemon.crt        # Self-signed cert
  peers/
    framework-research.crt
    entu-research.crt
  acl.json          # Per-agent allowed_to / allowed_from
```

### [DECISION] My CLI tools scope (confirmed)
- `comms-acl` — read-only inspection + dry-run check (Babbage defines schema, I implement against it)
- `comms-daemon status` — PID file check + recent log lines (no query interface in v1)
- `comms-keys` — inspection only (key provisioning is out of scope, pre-provisioned like .ssh)

### [DECISION] ACL schema ownership
- Babbage defines `acl.json` schema (his daemon reads it)
- I implement `comms-acl` CLI against his published schema
- Proceed to spec `comms-acl` once Babbage publishes daemon spec

### [DECISION] Daemon status interface (v1)
- No query interface — PID file + log parsing only
- `comms-daemon status`: is process running? + show recent log lines

### [DEFERRED] Per-agent Ed25519 keypairs → v2
- v1 trust model: OS process isolation inside container, mTLS between containers
- v1 "per-agent ACL" is enforced but not cryptographically proven — daemon attests identity
- v2 hardens with per-message signing

### [DEFERRED] comms-export CLI design (superseded)
- File-sharing model was an earlier iteration — superseded by cross-team messaging architecture
- Discard earlier exports.json / comms-export design work

### [PATTERN] Module structure for Phase 5 CLI tools

All three files go in `comms-dev/src/cli/`. Same pattern as `comms-send.ts`:
- ESM (`"type": "module"` in package.json)
- `parseArgs` from `node:util`
- `requireEnv(name)` + `fatal(msg)` helpers
- JSON to stdout, errors to stderr
- `main().catch(err => { console.error(err); process.exit(1) })`

**`src/cli/comms-keys.ts`**
- Imports: `node:fs`, `node:path`, `node:crypto` (for cert fingerprint via `X509Certificate`)
- Key type: `node:tls` has `X509Certificate` in Node 18+ — use `new X509Certificate(pem)` for subject/fingerprint/validity
- No project imports needed (pure file reads)
- `COMMS_KEYS_DIR` env var (default `/run/secrets/comms`)

**`src/cli/comms-acl.ts`**
- Imports: `node:fs`, `node:path`
- Will import `ACLConfig`, `AgentACL` types from `../crypto/acl.js` once Vigenere delivers it
- ACL check: implement wildcard matching locally (it's simple: `pattern === address || pattern.startsWith('*@') && address.endsWith(pattern.slice(1))`)
- `COMMS_KEYS_DIR` for acl.json path, `COMMS_TEAM_NAME` for context in `check` command

**`src/cli/comms-daemon.ts`**
- Imports: `node:fs`, `node:path`, `node:process` (for kill/signal)
- PID file: read, check `/proc/<pid>/` exists (Linux) or `process.kill(pid, 0)` (portable)
- Log parsing: `fs.readFileSync(logFile)`, split lines, parse structured log format from #18 §3.1:
  - `[daemon] tunnel connected: <team-name>`
  - `[daemon] tunnel disconnected: <team-name>`
  - `[daemon] tunnel reconnecting: <team-name>`
- `COMMS_PID_FILE` (default `/var/run/comms-daemon.pid`)
- `COMMS_LOG_FILE` (default `/var/log/comms-daemon.log`)

**Cert fingerprint approach (Node built-in, no openssl binary):**
```typescript
import { X509Certificate } from 'node:crypto'
const cert = new X509Certificate(fs.readFileSync(certPath))
// cert.subject → "CN=comms-dev"
// cert.fingerprint256 → "AB:CD:EF:..."
// cert.validTo → date string
```

**`comms-keys verify` CN check (from cross-review fix):**
```typescript
const expectedCN = teamName  // from filename stem
const actualCN = cert.subject.match(/CN=([^,\n]+)/)?.[1]
if (actualCN !== expectedCN) → error: cert CN mismatch
```

### [GOTCHA] `node:crypto` X509Certificate availability
- `X509Certificate` added in Node.js 15.6.0 — safe to use (project targets Node 18+)
- `cert.fingerprint256` gives `XX:XX:XX:...` colon-separated hex — matches conventional display format
- `cert.subject` is a multiline string like `"CN=comms-dev\n"` — need to parse, not exact match

### Status
- Specs complete (#17 published, cross-reviewed against #16, fixed)
- Implementation plan read (#18): Phase 5 unblocked by Phase 1 only (need `ACLConfig` type from Vigenere)
- Module structure planned, ready to implement when Kerckhoffs posts RED tests
- Waiting: Kerckhoffs `[COORDINATION]` with test file location
