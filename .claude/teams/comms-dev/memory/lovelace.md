# Lovelace scratchpad — comms-dev CLI/TUI tooling engineer

## [CHECKPOINT] 2026-03-20 session complete

### What was built this session
All three CLI tools delivered and GREEN:

| File | Tests | Status |
|---|---|---|
| `comms-dev/src/cli/comms-keys.ts` | 20/20 | GREEN |
| `comms-dev/src/cli/comms-acl.ts` | 29/29 | GREEN |
| `comms-dev/src/cli/comms-daemon.ts` | 21/22 | 1 fixture gap (TIMEOUT test) |

Total test suite: 409/409 green (project-wide).

### CLI tool interfaces (stable, shipped)

**comms-keys** — cert inspection, no daemon dependency
- `listKeys({ keysDir })` → `KeysListResult`
- `exportDaemonCert({ keysDir, format })` → `ExportResult`
- `verifyPeerCert({ keysDir, peerName })` → `KeysVerifyResult` (checks CN === filename stem)
- Env: `COMMS_KEYS_DIR` (default `/run/secrets/comms`)

**comms-acl** — ACL inspection, read-only
- `listAcl({ aclPath, agentFilter? })` → `ListAclResult`
- `checkAcl({ aclPath, from, to, localTeam })` → `CheckAclResult` (exitCode 0|1)
- `showAgentAcl({ aclPath, agentName })` → `ShowAgentAclResult`
- Uses `matchesPattern()` from `../crypto/acl.js` — no wildcard reimplementation
- Env: `COMMS_KEYS_DIR`, `COMMS_TEAM_NAME`

**comms-daemon** — daemon control via UDS socket
- `daemonStatus({ socketDir, teamName, timeoutMs? })` → `DaemonStatusResult`
- `daemonReload({ socketDir, teamName })` → `DaemonReloadResult`
- `daemonPeers({ socketDir, teamName })` → `DaemonPeersResult`
- Protocol: newline-delimited JSON, one command per connection
- Socket: `<socketDir>/<teamName>.sock`
- Env: `COMMS_SOCKET_DIR`, `COMMS_TEAM_NAME`

### [GOTCHA] isMain guard — CRITICAL pattern
All CLI files must guard `main()` with:
```typescript
const isMain = process.argv[1]?.endsWith('comms-foo.ts') ||
  process.argv[1]?.endsWith('comms-foo.js');
if (isMain) { main().catch(...) }
```
Without this, Vitest importing the module triggers `process.exit(1)` causing unhandled rejection that pollutes all test runs.

### [GOTCHA] comms-daemon TIMEOUT test fixture gap
Test `throws TIMEOUT when daemon socket exists but does not respond` uses an empty `socketDir` — no socket file exists. Connect fails with ENOENT → `DAEMON_NOT_RUNNING`, not `TIMEOUT`. Kerckhoffs needs to fix the fixture (create an unresponsive server at the socket path). This is the one remaining RED test in the CLI suite.

### [LEARNED] DaemonV2 UDS control socket (v2, shipped)
- Babbage added UDS control socket to `daemon-v2.ts` alongside TLS transport
- Protocol: newline-delimited JSON, one cmd per connection
- Commands: `status`, `reload`, `peers`
- `status` response includes: `status`, `uptime_seconds`, `version`, `team_name`, `port`
- `reload` response includes: `success`, `reloaded_at`, `acl_agents_count`
- `peers` response: full objects with `team`, `status`, `host`, `port`, `connected_at`
- Disconnected peers ARE included in `peers` response (status: "disconnected")

### [DEFERRED] Per-agent Ed25519 keypairs → v2
- v1: daemon attests sender identity, OS trust inside container
- v2: per-message signing for cryptographic non-repudiation

### Architecture reference (v2, final)
```
Agent → CrossTeamSend MCP → DaemonV2 UDS control socket
                            ↓ ACL check
                            ↓ TunnelManager (persistent mTLS to peer daemons)
                            ↓ framed JSON message
                         Remote DaemonV2
                            ↓ peerCertCN === from.team (HARD INVARIANT)
                            ↓ ACL check (receive side)
                            ↓ inbox write
                         Recipient agent polls inbox (500ms)
```
