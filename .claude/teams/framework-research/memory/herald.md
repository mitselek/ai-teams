# Herald Scratchpad

## 2026-03-18 (session R9)

[DECISION] Protocol 5: Resource Partition Table added to T03. Two isolation strategies: Branch Reservation (T02 R1) for independent-output teams, Directory Partition (Protocol 5) for pipeline teams. Selection criteria: does every agent's output flow into another agent's input? Yes = partition, No = branch.

[PATTERN] apex-research proved directory partition at scale: 6 sessions, 80+ commits, 4 agents, zero conflicts. Three structural properties: (1) strict directory ownership, (2) unidirectional data flow (DAG, no cycles), (3) append-mostly output. Worktree isolation is a downgrade for pipeline teams — it blocks data flow.

[DECISION] Data Contract sub-protocol added to Protocol 5. Shared data files (JSON schemas / TypeScript interfaces) are the fragile point in partitioned trunk. Contract file in types/ updated BEFORE data changes. Schema change notification via team-lead. Analogous to reference team api-contracts.md pattern.

[DECISION] RFC #3 analysis: recommended trunk-based + CI build gate over PRs for apex-research dashboard. PRs create Protocol 1 handoff overhead (20 handoffs/session). Exception: PRs for data contract changes only.

[DECISION] Two original T03 open questions resolved: "sync vs async" (pipeline=sync via Protocol 5, independent=async via T02 R1) and "duplicate work" (partition table for intra-team, handoff ledger for inter-team).

[PATTERN] Enforcement progression for partition tables: prompt-level (v1, zero cost, sufficient for <5 agents) → CI-level (v2, pre-commit hook checks git diff against table) → platform-level (v3, filesystem permissions, high complexity). Start with v1 always.

[DECISION] polyphony-dev is independent-output (not pipeline). Sven+Dag write domains overlap in src/. Protocol 5 does not apply. Uses branch isolation + serialized TDD handoff chain instead. Time-partitioned, not space-partitioned.

[PATTERN] TDD teams need a third isolation mode: temporal ownership chain. Only one agent (or defined pair) owns the story branch at any given phase. Ownership rotates: Tess(RED)→Sven+Dag(GREEN)→Lingo(i18n)→Arvo(REVIEW)→Dag(MERGE). Complements Protocol 5 (space) and R1 (branch).

[PATTERN] Sven+Dag co-ownership works because their write subdirectories within src/ are mostly disjoint (Sven=components+routes/UI, Dag=server/db+auth+migrations+API endpoints). If conflicts arise, serialize: Dag first (schema+API), then Sven (UI).

[PATTERN] Dashboard IA audit (apex S8 Q7): 3-group nav (Analüüs/Migratsioon/Viited) is coherent. Misplaced: contradictions→Viited, security→Analüüs. Tipping point: when handoff begins, need 4th group (Üleandmine). Dashboard-as-PO-lens gap: Discussions not surfaced in dashboard despite being the PO feedback channel.

## 2026-03-17 (session R8)

[DECISION] T03 open question #6 resolved: Direct Link Lifecycle Protocol added to Protocol 2. Five review triggers (time-based, inactivity, scope change, incident, on-demand). Registry extended with Last active, Review due, Last review columns. Authority split with T04: Herald owns protocol mechanics, Montesquieu owns authority model (delegation matrix Rows 27-28).

[DECISION] `type: dispute` added to Protocol 1 handoff type enumeration. Dispute entries logged to Handoff Ledger when T04 §Q5 escalation reaches Step 2 (L1 mediates). Recurring disputes signal structural gaps. Coordinated with Montesquieu — he'll cross-reference from T04.

[PATTERN] apex-research → migration teams: one-to-many handoff pattern. Spec is the contract. New handoff type `migrate`. Dashboard as third communication layer (between operational UDS and knowledge GitHub Issues) — reduces status query volume at scale.

[PATTERN] Spec readiness gate: 6 criteria (data model, business logic, auth, LOVs, overlaps, peer review). If migration team asks >2 clarification questions, the spec wasn't ready — quality signal back to research team.

[PATTERN] Dashboard-as-communication-substrate: PO sees prioritization view, manager agent sees dependency graph for handoff sequencing, migration teams self-serve status checks. Reduces inter-team message volume by ~60% at 3+ migration teams.

[DECISION] T05 Identity & Credentials deepened (76→481 lines). 5 sections: agent auth across teams, credential passing in containers, cross-team identity verification, secrets management, audit trail. Key decisions: (1) identity is team-scoped not agent-scoped, (2) per-team fine-grained GitHub PATs, (3) Docker secrets + `_FILE` convention, (4) no self-escalation of credentials, (5) per-team tokens for audit trail. All 5 original open questions resolved, 5 new ones raised.

[PATTERN] Credentials are injected, never discovered. Anti-pattern: credential sharing between teams — use handoff protocol instead. MCP servers need `_FILE` env var convention for multi-team secret isolation.

[GOTCHA] `~/.claude/mcp.json` contains plaintext Jira API token inline — concrete example of the credential management problem at multi-team scale.

## 2026-03-14 (session 2)

[DECISION] T02 resource coordination protocols (R1-R5) written. Five protocols: branch reservation (R1), deployment lock (R2), DB migration queue (R3), API rate limit partitioning (R4), unified lock registry (R5). All integrate with T03 communication protocols — no new primitives needed.

[DECISION] Migration locks are NEVER force-released on timeout (unlike merge/deploy locks). Half-applied migrations can corrupt data — escalate to PO instead.

[PATTERN] Resource coordination is a use case of the communication protocols, not a separate system. Lock requests use T03 Protocol 1 (Handoff) with `type: resource-lock`. Rate limit alerts use Protocol 3 (Broadcast).

[PATTERN] Finn's research and Herald's protocols are complementary layers: Finn defines isolation mechanisms (worktrees, per-team DBs, token-per-team), Herald defines coordination protocols (lock lifecycle, conflict detection, queue ordering).

[CHECKPOINT] All 5 original T02 open questions resolved. 5 new open questions raised (lock infrastructure, cross-repo, migration rollback, fairness, offline recovery).

[DECISION] Protocol 4 broker deployment: SIDECAR container (not inline daemon). Broker must outlive Claude session to queue undelivered messages. Startup ordering via `depends_on` + healthcheck on socket file. TLS-PSK secret mounts on broker sidecar, not Claude container. Broker needs persistent inbox directory on team-scoped volume (`/team-data/inbox/`). Coordinated with Brunel.

## 2026-03-14 (session 1)

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

[CHECKPOINT] Protocol 4 saved to topics/03-communication.md. GitHub Issue #1 created (<https://github.com/mitselek/ai-teams/issues/1>) — first test of the knowledge layer convention. Labels created: team:framework-research, type:finding, affects:all. Open Question #1 marked resolved. Standing by.

## 2026-03-13

[DECISION] Inter-team routing: recommended Option B (hub-routed via manager agent) over mesh or shared filesystem. No infra changes needed, leverages T04 hierarchy. Migrate to Option C (SendMessage extension) when framework matures.

[DECISION] Topology: hybrid (hub-and-spoke default + registered direct links). Pure mesh fails at 10 teams (45 channels, no governance). Pure hub fails for high-frequency pairs (shared-repo teams). Direct links are authorized and revocable by manager agent.

[DECISION] Broadcast: only PO and manager agent may broadcast. Team-leads request broadcast via manager. Storm prevention: no reply-to-broadcast, dedup window, scope filtering, budget (3/session/authority).

[PATTERN] Handoff protocol follows request-ACK-complete-confirm cycle. Manager agent maintains a handoff ledger. Timeout escalation after 2 message cycles with no ACK.

[PATTERN] Attribution prefix: `(*TEAM:Agent*)` replaces `(*RC-DEV:Agent*)`. Prefix registered in roster.json. Unique across all teams.

[DEFERRED] Cross-team Finn pattern — lightweight research requests across team boundaries are too heavy via full handoff protocol. May need a "query" handoff type with lighter flow.
