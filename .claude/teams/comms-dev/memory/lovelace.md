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

### Status
- Brainstorm complete, waiting for PO confirmation to enter spec phase
- Blocker: Babbage's daemon spec (need ACL schema before I can spec comms-acl)
