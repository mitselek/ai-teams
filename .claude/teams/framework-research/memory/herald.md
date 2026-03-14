# Herald Scratchpad

## 2026-03-14

[DECISION] Inter-team encrypted chat transport: Unix Domain Socket (UDS) via shared Docker volume at `/shared/comms/`. Each team runs a broker daemon that listens on `<team-name>.sock`. Chosen over TCP (port management overhead), message queues (infra dependency), git-based (latency), and filesystem polling (race conditions).

[DECISION] Encryption v1: TLS-PSK (pre-shared symmetric key via Docker secrets). Upgrade path to v2: X25519 keypair per team, public keys in registry, NaCl box encryption. Full PKI rejected as too complex for v1.

[DECISION] Message format: JSON envelope (version, id, timestamp, from, to, type, priority, reply_to, body, checksum) with Markdown body. Wire format: 4-byte length-prefixed framing. Resolves the structured-vs-natural-language open question from 03-communication.md — answer is both (structured envelope, natural body).

[DECISION] Discovery: `registry.json` on shared volume. File-locked writes, 60s heartbeat, stale entry cleanup at 120s. Socket file existence doubles as liveness check.

[DECISION] Delivery guarantee: at-least-once with sender retry + receiver dedup by message ID. Sufficient for v1.

[PATTERN] The transport layer (this spec) slots cleanly under existing Protocols 1-3 from 03-communication.md. Protocol defines *what*, transport defines *how*.

[DECISION] Two-layer inter-team comms architecture: (1) Operational layer = UDS for real-time encrypted messages, (2) Knowledge layer = GitHub Issues for persistent cross-team findings/decisions. GitHub Issues rejected as message transport due to: polling latency, API rate limits (5000/hr), no encryption (plaintext on GitHub servers), Issue pollution from ephemeral messages.

[DECISION] GitHub Issues label convention: `team:<name>`, `affects:<name>`, `type:finding|decision|question|blocker`. Structured header in Issue body for machine parsing.

[DECISION] comms-dev scope expanded: broker daemon + `comms-send` (operational) + `comms-publish` and `comms-watch` (knowledge layer, `gh` CLI wrappers). Bridge: operational messages tagged as findings auto-promote to GitHub Issues.

[GOTCHA] `gh issue create --body-file /tmp/...` fails in sandbox — /tmp is isolated. Must write temp files to repo directory and clean up after. Affects comms-dev's `comms-publish` tool design.

[CHECKPOINT] Protocol 4 saved to topics/03-communication.md. GitHub Issue #1 created (https://github.com/mitselek/ai-teams/issues/1) — first test of the knowledge layer convention. Labels created: team:framework-research, type:finding, affects:all. Open Question #1 marked resolved. Standing by.

## 2026-03-13

[DECISION] Inter-team routing: recommended Option B (hub-routed via manager agent) over mesh or shared filesystem. No infra changes needed, leverages T04 hierarchy. Migrate to Option C (SendMessage extension) when framework matures.

[DECISION] Topology: hybrid (hub-and-spoke default + registered direct links). Pure mesh fails at 10 teams (45 channels, no governance). Pure hub fails for high-frequency pairs (shared-repo teams). Direct links are authorized and revocable by manager agent.

[DECISION] Broadcast: only PO and manager agent may broadcast. Team-leads request broadcast via manager. Storm prevention: no reply-to-broadcast, dedup window, scope filtering, budget (3/session/authority).

[PATTERN] Handoff protocol follows request-ACK-complete-confirm cycle. Manager agent maintains a handoff ledger. Timeout escalation after 2 message cycles with no ACK.

[PATTERN] Attribution prefix: `(*TEAM:Agent*)` replaces `(*RC-DEV:Agent*)`. Prefix registered in roster.json. Unique across all teams.

[DEFERRED] Cross-team Finn pattern — lightweight research requests across team boundaries are too heavy via full handoff protocol. May need a "query" handoff type with lighter flow.
