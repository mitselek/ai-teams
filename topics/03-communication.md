# Communication

How teams communicate with each other and with humans.

## Open Questions

- How does a project team request a review from the QA team?
- How does a human PO broadcast a priority change to all teams?
- Sync vs async communication — when is each appropriate?
- How do teams avoid duplicate work?
- Message format — structured (JSON) or natural language?

## Communication Patterns

### Human → Team

- Direct task assignment
- Priority changes, blockers
- Feedback and corrections

### Team → Human

- Status updates
- Decisions needing approval
- Blockers and escalations

### Team → Team

- Work handoff (e.g., dev team → QA team)
- Resource coordination (e.g., "I'm deploying, hold off")
- Knowledge sharing (e.g., "found a pattern you should know about")

### Broadcast

- Merge freezes
- Incident response
- Architecture decisions

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Message format: timestamped natural language

Every SendMessage is prefixed with `[YYYY-MM-DD HH:MM]`. Agents run `date '+%Y-%m-%d %H:%M'` before sending. No structured JSON envelopes — plain markdown prose with timestamps for ordering.

### Mandatory reporting: no silent idle

Common-prompt rule (both teams): after every completed task, send a report to team-lead. Idle without reporting is forbidden. Report format: what was done, test/CI result, what's pending. This creates a reliable activity log in the team-lead's inbox.

### Research broker pattern (Finn)

Finn is the designated research coordinator. Before any specialist burns their own tokens on exploration, they message Finn. Finn decomposes requests into parallel subtasks, spawns haiku subagents, consolidates results, and delivers a markdown report. This reduces token waste across all agents.

**Key principle:** Finn acts immediately — no task lists, no "I'll do this later." Same-turn execution.

### Attribution on persistent output

All persistent text (md files, GitHub issues/PRs, Jira descriptions, commit messages) carries `(*RC-DEV:AgentName*)`. SendMessage between agents does not need attribution — timestamps are sufficient. Attribution enables post-hoc audit of which agent produced which artifact.

**Known gap:** hr-devs still uses the `RC-DEV` prefix (not updated to `HR-DEV`) — shows that inter-team prefix conventions aren't being enforced.

### Dashboard for human-readable reports

Both teams have a dashboard mechanism: `add-doc-to-dashboard.sh <file> [title]`. Any agent can push a markdown report as a dashboard tab for the PO. This is the async human → read path. Used for: research reports, code review summaries, architecture docs, test coverage.

### Shutdown protocol: ordered, confirmed

Communication at shutdown follows a strict sequence:

1. Team-lead stops all new work
2. Sends shutdown to all agents (broadcast or one-by-one)
3. Waits for confirmation from each
4. Each agent: write WIP to scratchpad → send closing message (LEARNED / DEFERRED / WARNING) → approve

**rc-team:** all steps inline in common-prompt. **hr-devs:** externalised to `docs/startup-shutdown.md` — cleaner separation of concerns.

### Language protocol: Estonian for users, English for devs

- User-facing content (UI, stories, Jira descriptions, AC): Estonian
- Dev-facing content (code, PRs, tech docs, reviews, dashboards): English
- Arvo writes issue descriptions in Estonian; Marcus reviews in English

### Contextual guidance for delegation messages

Every task delegation message must include: current state (what's merged), starting point (files to read), dependencies, branch name. Standardized context packaging reduces back-and-forth.

---

## Inter-Team Communication Protocols (*FR:Herald*)

The patterns above describe **intra-team** communication — how agents within a single team coordinate. This section designs the **inter-team** layer: what happens when we scale from 1 team to 10+.

### Design Constraints

These protocols are designed within the constraints of the existing infrastructure:

1. **SendMessage is the only messaging primitive** — no new transport layer. Inter-team messages must use the same `SendMessage` tool that intra-team messages use.
2. **Teams are isolated by design** — each team has its own `config.json`, inboxes directory, and memory. An agent in Team A cannot directly `SendMessage` to an agent in Team B (they are in different team contexts).
3. **Team-leads are the boundary** — the only agents with authority to communicate outside their team. Specialists never cross team boundaries directly.
4. **Human (PO/manager-agent) sits above teams** — can message any team-lead.

### Implication of Constraint #2: The Routing Problem

Today, `SendMessage` routes by agent name within a single team context. Agent "sven" in Team A and agent "sven" in Team B are in different inbox directories. There is no mechanism for cross-team message delivery.

**Three possible solutions (ordered by implementation cost):**

| Option | Mechanism | Cost | Scaling |
|---|---|---|---|
| A: Shared filesystem convention | Teams write to a shared `inter-team-inbox/` directory, keyed by `<team>/<agent>` | Low | Fragile at scale — polling, race conditions |
| B: Hub-routed via manager agent | All cross-team messages go through a manager agent who has `SendMessage` access to all team-leads | Medium | Natural bottleneck, but manageable with queue |
| C: Infrastructure-level cross-team routing | Extend `SendMessage` to accept `team:agent` addressing | High | Clean, scales well |

**Recommendation:** Start with **Option B** (hub-routed). It requires no infrastructure changes, leverages the existing hierarchy (T04), and naturally limits cross-team message volume. Migrate to Option C when the framework matures.

---

### Protocol 1: Inter-Team Work Handoff (*FR:Herald*)

#### Purpose

Team A has completed work that Team B must now act on (e.g., dev team hands off to QA team, or project team requests infrastructure change from platform team).

#### Participants

| Role | Agent | Responsibility |
|---|---|---|
| Requester | Team A lead | Packages the handoff request |
| Router | Manager agent (or PO) | Delivers to correct team, tracks status |
| Receiver | Team B lead | Accepts or rejects, delegates internally |

#### Message Format: Handoff Request

```markdown
## Handoff Request

- **From:** <team-name-A>
- **To:** <team-name-B>
- **Type:** review | deploy | build | test | consult | migrate | dispute
- **Priority:** blocking | high | normal | low
- **Subject:** <one-line summary>

### Context
<What was done. Branch name, PR number, relevant files. Enough for Team B to start without asking Team A for clarification.>

### Requested Action
<Specific deliverable expected from Team B.>

### Deadline
<Absolute date/time, or "no deadline". Never relative ("by Friday").>

### Callback
<How Team B should report back: "message to <team-name-A> lead" or "comment on PR #N" or "update Jira VL-N".>
```

#### Flow

```
1. Team A lead identifies work that requires another team
2. Team A lead sends Handoff Request to manager agent (or PO)
   ├─ If blocking priority: mark own task as BLOCKED, include blocker reason
   └─ If normal/low: continue other work
3. Manager agent validates the request:
   ├─ Is Team B the right recipient? (check team roster/capabilities)
   ├─ Is Team B available? (check if team is active/spawned)
   └─ Is priority justified? (blocking requests get scrutiny)
4. Manager agent delivers to Team B lead
5. Team B lead sends ACK within 1 message cycle:
   ├─ ACCEPTED — will begin work, estimated completion: <time>
   ├─ REJECTED — reason: <out of scope | overloaded | wrong team>
   └─ CLARIFICATION_NEEDED — specific questions listed
6. Manager agent relays ACK back to Team A lead
7. Team B completes work, reports via the specified callback
8. Manager agent confirms completion to Team A lead
```

#### Failure Modes

| Failure | Detection | Recovery |
|---|---|---|
| Team B not spawned | Manager agent checks team directory exists | Manager agent spawns Team B or queues request |
| No ACK within timeout | Manager agent tracks pending requests | Escalate to PO after 2 message cycles with no response |
| Team B rejects | Manager agent receives REJECTED | Re-route to correct team or escalate to PO for resolution |
| Work completed but callback missed | Team A still BLOCKED after Team B reports done | Manager agent reconciles — checks PR/Jira state |
| Manager agent goes down mid-handoff | Handoff state lost | Handoff requests must be persisted (see Handoff Ledger below) |

#### Handoff Ledger

The manager agent maintains a simple ledger of active handoffs:

```markdown
| ID | From | To | Type | Priority | Status | Requested | Updated |
|---|---|---|---|---|---|---|---|
| H-001 | hr-devs | qa-team | review | high | ACCEPTED | 2026-03-13 | 2026-03-13 |
| H-002 | platform | hr-devs | deploy | blocking | COMPLETED | 2026-03-12 | 2026-03-13 |
| H-003 | hr-devs | platform | dispute | blocking | RESOLVED | 2026-03-14 | 2026-03-14 |
```

This ledger lives in the manager agent's memory directory, not in any team's workspace.

**Dispute entries:** When the T04 escalation ladder (§Q5) reaches Step 2 (L1 mediates), L1 logs the dispute to this ledger with `type: dispute`. The resolution and reasoning are recorded in the `Updated` column timestamp and a linked decision record. Recurring disputes between the same teams signal a structural gap — consider granting a direct link or establishing shared ownership rules.

---

### Protocol 2: Communication Topology (*FR:Herald*)

#### Analysis: Three Topologies

```
Hub-and-Spoke              Mesh                    Hybrid

    ┌─T1                T1───T2               ┌─T1
    │                   │ ╲ ╱ │               │
PO──┼─T2               │  ╳  │          Mgr──┼─T2
    │                   │ ╱ ╲ │               │
    └─T3                T3───T4               └─T3
                                               │
All messages             Every team             T1↔T2 direct
go through PO           talks to every          (same repo),
                        other team              rest via Mgr
```

#### Evaluation

| Criterion | Hub-and-Spoke | Mesh | Hybrid |
|---|---|---|---|
| Message volume at N teams | O(N) through hub | O(N^2) potential | O(N) hub + O(k) direct |
| Single point of failure | Hub is SPOF | No SPOF | Hub is partial SPOF |
| Latency per handoff | 2 hops (A→hub→B) | 1 hop (A→B) | 1-2 hops |
| Coordination overhead | Low for teams | High — every team must know every team | Moderate |
| Context cost | Hub needs context on all teams | Each team needs context on all others | Hub needs broad context; direct pairs need narrow |
| Scales to 10 teams | Yes — hub is bottleneck but manageable | No — 45 potential channels, no governance | Yes |
| Scales to 50 teams | No — hub drowns | No — 1225 channels | Conditionally — depends on direct-link count |

#### Decision: Hybrid Topology

**Default:** Hub-and-spoke via manager agent. All inter-team communication goes through the manager agent (or PO for teams without a manager agent).

**Exception: Direct links** between two team-leads when:

1. They share the same repository (resource conflict is frequent)
2. They have a standing handoff pattern (e.g., dev→QA on every PR)
3. The manager agent has explicitly authorized the direct link

Direct links are **registered** — the manager agent knows they exist and can revoke them. Unregistered direct communication between teams is forbidden.

#### Direct Link Registry

Maintained by the manager agent:

```markdown
| Team A | Team B | Reason | Authorized | Last active | Review due | Last review |
|---|---|---|---|---|---|---|
| hr-devs | qa-team | PR review handoff | 2026-03-01 | 2026-03-13 | 2026-04-01 | — |
| hr-devs | platform | Shared D1 database | 2026-03-01 | 2026-03-14 | 2026-04-01 | — |
```

**Note:** `Last active` is updated on each message sent via the direct link. `Review due` is computed from trigger thresholds (see Lifecycle Protocol below). `Last review` records the most recent review date.

#### Direct Link Lifecycle Protocol (*FR:Herald*)

Direct links are not permanent — they require periodic review to prevent stale connections that consume registry space and create the illusion of active coordination paths. Authority to grant/revoke: L1 manager agent (T04 delegation matrix Rows 27-28). This protocol defines the lifecycle mechanics.

##### Review Triggers

| Trigger | Detection | Who initiates |
|---|---|---|
| **Time-based** | Link age > 30 sessions (or PO-configured threshold) | L1 manager agent (automated sweep) |
| **Inactivity** | No messages on direct link for 10 consecutive sessions | L1 manager agent (from message log) |
| **Scope change** | One of the linked teams changes its mission or dissolves | L1 manager agent (triggered by team lifecycle event) |
| **Incident** | A direct link was involved in a coordination failure or resource conflict | Team-lead or L1 (post-incident review) |
| **On-demand** | PO or L1 requests a review | PO or L1 |

##### Review Process

```
1. L1 identifies link for review (via trigger above)
2. L1 sends review request to both team-leads:
   "Direct link [Team-A ↔ Team-B] is under review.
    Reason: <trigger>.
    Respond with: RETAIN (justify) | REVOKE (agree) | MODIFY (explain)"
3. Both team-leads respond within 1 message cycle
4. Decision matrix:
   ├─ Both say REVOKE → L1 revokes (T04 Row 28)
   ├─ Both say RETAIN → L1 retains, resets review timer
   ├─ Disagreement → L1 applies judgment (T04 Row 28 authority)
   └─ No response within timeout → L1 treats as REVOKE (stale = unused)
5. L1 updates Direct Link Registry with decision + timestamp
6. L1 informs PO (T04 Row 28: I column)
```

##### Scaling Notes

At 10 teams with 5 direct links, the review overhead is manageable (max 5 reviews per audit sweep). At 20+ teams, consider batching reviews by domain and delegating the sweep to a scheduled task rather than manual L1 initiative.

#### Why Not Pure Mesh

At 10 teams, mesh produces 45 potential communication channels. Each team-lead would need context on 9 other teams. This has three costs:

1. **Token cost** — every team-lead's prompt grows with the number of teams it can contact
2. **Governance cost** — no single point can answer "who asked whom for what?"
3. **Collision cost** — without a coordinator, two teams may independently request conflicting work from a third team

#### Why Not Pure Hub-and-Spoke

The hub (manager agent) becomes a bottleneck when:

- Two teams sharing a repo need to coordinate branch operations in real-time
- A handoff is urgent (blocking) and the hub adds latency
- The hub's context window fills up from tracking all inter-team state

Direct links relieve these pressure points for known, stable, high-frequency interactions.

---

### Protocol 3: Broadcast Governance (*FR:Herald*)

#### The Problem

Broadcast sends a message to every team. At 10 teams, one broadcast = 10 message deliveries. Each delivery costs tokens (the receiving team-lead must read and process the message). Uncontrolled broadcasting leads to:

- **Storm risk** — a broadcast triggers responses, which trigger more broadcasts
- **Attention cost** — team-leads must context-switch to process irrelevant broadcasts
- **Token waste** — N teams *M broadcasts* processing cost per message

#### Who May Broadcast

| Authority Level | May broadcast? | Scope | Example |
|---|---|---|---|
| PO (human) | Yes — unrestricted | All teams | Priority change, merge freeze, incident |
| Manager agent | Yes — with reason | All teams under their supervision | Architecture decision, resource constraint |
| Team-lead | No — request via manager agent | N/A | Team-lead asks manager to broadcast on their behalf |
| Specialist agent | No | N/A | Never |

**Rule:** Team-leads cannot broadcast to other teams directly. A team-lead who discovers something broadcast-worthy (e.g., "the staging DB is corrupted") sends it to the manager agent, who decides whether it warrants a broadcast or targeted messages to affected teams only.

#### Broadcast Categories

| Category | Urgency | Who initiates | Example |
|---|---|---|---|
| **Incident** | Immediate | PO or manager agent | "Production is down — all teams halt deployment" |
| **Freeze** | Scheduled | PO | "Merge freeze begins 2026-03-15 for release cut" |
| **Architecture** | Advisory | Manager agent | "All teams: D1 migration format changed, see docs" |
| **Knowledge** | Informational | Manager agent (on behalf of team) | "hr-devs discovered: overflow-x breaks position:sticky" |

#### Storm Prevention Rules

1. **No reply-to-broadcast:** Receiving a broadcast does not create a reply obligation. If a team needs to act, they message the manager agent directly — not via broadcast.

2. **Dedup window:** The manager agent will not relay two broadcasts with the same subject within a 10-minute window. The second is queued or merged.

3. **Scope filtering:** Before broadcasting, the manager agent checks which teams are actually affected. "D1 migration format changed" only goes to teams using D1 — not to the QA team that tests via HTTP.

4. **Budget:** Maximum 3 broadcasts per session per authority level. Beyond that, the manager agent must batch remaining announcements into a single digest.

#### Broadcast Message Format

```markdown
## Broadcast

- **From:** <authority> (PO | manager-agent)
- **Category:** incident | freeze | architecture | knowledge
- **Affects:** all | <team-list>
- **Action required:** yes (describe) | no (informational)

<Content — kept under 200 words. Link to details rather than inline.>
```

---

### Attribution in Inter-Team Context (*FR:Herald*)

The existing attribution format `(*RC-DEV:AgentName*)` was designed for a single-team context. With multiple teams, the team prefix becomes semantically necessary.

#### Recommended Format

```
(*<TEAM-PREFIX>:<AgentName>*)
```

Where `<TEAM-PREFIX>` is derived from the team name:

| Team name | Prefix | Example |
|---|---|---|
| cloudflare-builders | CB | `(*CB:Sven*)` |
| hr-devs | HR | `(*HR:Marcus*)` |
| qa-team | QA | `(*QA:Tess*)` |
| framework-research | FR | `(*FR:Herald*)` |

**Rules:**

- Each team registers its prefix in roster.json (new field: `"prefix": "HR"`)
- Prefixes must be unique across all teams
- Manager agent attribution: `(*MGR:name*)`
- PO attribution: `(*PO*)` (no agent name — human)
- The old `RC-DEV` prefix is deprecated — migrate to team-specific prefixes

---

### Protocol 4: Inter-Team Transport Specification v1 (*FR:Herald*)

#### Purpose

Define how messages physically travel between teams running in separate Docker containers. Protocols 1–3 define *what* to communicate; this protocol defines *how* the bytes travel.

#### Architecture: Two Communication Layers

```
┌─────────────────────────────────────────────────┐
│              Inter-Team Communication            │
├─────────────────────┬───────────────────────────┤
│  Operational Layer  │    Knowledge Layer        │
│  (UDS transport)    │    (GitHub Issues)        │
├─────────────────────┼───────────────────────────┤
│  Handoff requests   │  Findings & discoveries   │
│  ACKs & responses   │  Design decisions         │
│  Heartbeats         │  Questions for other teams│
│  Blocking alerts    │  Architecture insights    │
│  Real-time coord    │  Session summaries        │
├─────────────────────┼───────────────────────────┤
│  Encrypted, fast    │  Plaintext, persistent    │
│  Ephemeral          │  Auditable                │
│  Container-scoped   │  Survives restarts        │
│  Machine-to-machine │  Human-readable           │
└─────────────────────┴───────────────────────────┘
```

**Bridge:** Operational messages tagged as `finding` or `decision` are auto-promoted to GitHub Issues by the broker.

#### 4A: Operational Layer — Unix Domain Sockets

##### Transport

Each team runs a message broker daemon that listens on a Unix domain socket on a shared Docker volume:

```
/shared/comms/
├── registry.json            # Team directory
├── framework-research.sock  # Team A's listener
└── comms-dev.sock           # Team B's listener
```

Docker compose configuration:

```yaml
volumes:
  comms-channel:

services:
  team-a:
    volumes:
      - comms-channel:/shared/comms
  team-b:
    volumes:
      - comms-channel:/shared/comms
```

**Why UDS over alternatives:**

| Alternative | Rejection reason |
|---|---|
| TCP sockets | Port management, firewall config, service discovery overhead |
| Message queue (Redis/NATS) | External infrastructure dependency |
| Git-based | Commit-push-pull latency (seconds, not milliseconds) |
| Filesystem polling | Race conditions, no delivery guarantee, no ordering |
| GitHub Issues as transport | API rate limits (5000/hr), polling latency, no encryption, Issue pollution |

##### Encryption

**v1:** TLS-PSK (pre-shared symmetric key). Distributed via Docker secrets at container startup.

```yaml
services:
  team-a:
    environment:
      - COMMS_PSK_FILE=/run/secrets/comms-psk
    secrets:
      - comms-psk

secrets:
  comms-psk:
    file: ./secrets/comms-psk.key  # 256-bit random key
```

**v2 upgrade path:** X25519 keypair per team, public keys in registry, NaCl box encryption (E2E without central CA).

##### Message Format

JSON envelope with Markdown body. Wire format: 4-byte big-endian length prefix + JSON bytes.

```json
{
  "version": "1",
  "id": "msg-<uuid>",
  "timestamp": "2026-03-14T12:03:00Z",
  "from": {
    "team": "framework-research",
    "agent": "team-lead",
    "prefix": "FR"
  },
  "to": {
    "team": "comms-dev",
    "agent": "team-lead"
  },
  "type": "handoff | query | response | broadcast | ack | heartbeat",
  "priority": "blocking | high | normal | low",
  "reply_to": "msg-<uuid> | null",
  "body": "Markdown-formatted message content",
  "checksum": "sha256:<hex>"
}
```

##### Discovery

`registry.json` on shared volume, maintained by each broker via file locking:

```json
{
  "teams": {
    "framework-research": {
      "socket": "/shared/comms/framework-research.sock",
      "prefix": "FR",
      "capabilities": ["research", "protocol-design"],
      "registered_at": "2026-03-14T12:00:00Z",
      "heartbeat": "2026-03-14T12:03:00Z"
    }
  }
}
```

**Registration flow:** Container starts → broker creates socket → acquires file lock on registry → adds entry → releases lock. Heartbeat updated every 60s. Stale entries (heartbeat > 120s) treated as offline and cleaned up.

##### Delivery Guarantee

At-least-once. Sender retries until ACK received. Receiver deduplicates by `msg.id`.

##### Failure Modes

| Failure | Detection | Recovery |
|---|---|---|
| Target container down | Socket file missing or connection refused | Queue locally, retry with exponential backoff (1s–30s). After 5 min: UNREACHABLE. |
| Broker crash (container up) | No ACK within 5s | Close, retry once. If still no ACK, treat as down. |
| Shared volume unmounted | Socket directory inaccessible | Fatal — broker exits. Container restart policy handles recovery. |
| Message too large | Length prefix > 1MB | Reject at sender, log warning. |
| Registry corrupted | JSON parse failure | Use cached copy, re-read after 5s. |
| Stale registry entry | Heartbeat > 120s old | Treat as offline, remove on next write. |
| PSK mismatch | TLS handshake failure | Log error, do not retry (config error). |

##### Integration with Protocols 1–3

| Protocol | Implementation |
|---|---|
| Protocol 1 (Handoff) | `type: "handoff"` message with same metadata fields |
| Protocol 2 (Topology) | Hub-routed: team-leads → manager socket → target socket. Direct links: authorized socket-to-socket. |
| Protocol 3 (Broadcast) | Manager sends to all registered sockets, filtered by `capabilities`. |

##### Scale

| Teams | Practical? | Notes |
|---|---|---|
| 2–5 | Yes | Single volume, single registry |
| 10 | Yes | Hub-routed limits channels to O(N) |
| 20 | Yes with care | Consider sharding volumes by domain |
| 50+ | No | Need real message infrastructure (NATS/Redis Streams) |

#### 4B: Knowledge Layer — GitHub Issues

##### Purpose

Persist cross-team findings, decisions, and insights as GitHub Issues in the shared repository. Provides human visibility, audit trail, and session-spanning persistence that the ephemeral UDS transport does not.

##### When to Use

| Use GitHub Issues | Use UDS |
|---|---|
| Findings and discoveries | Handoff requests and ACKs |
| Design decisions affecting other teams | Real-time coordination |
| Questions for other teams | Heartbeats |
| Architecture insights | Blocking alerts |

##### Issue Format

```markdown
**Team:** <team-name>
**Agent:** <agent-name>
**Type:** finding | decision | question | blocker
**Affects:** <team-name> | all

---

<Content in markdown>

(*<PREFIX>:<AgentName>*)
```

##### Label Convention

- `team:<team-name>` — originating team
- `affects:<team-name>` — target teams (one label per affected team, or `affects:all`)
- `type:finding`, `type:decision`, `type:question`, `type:blocker`

##### Tooling (built by comms-dev)

- **`comms-publish`** — creates a GitHub Issue from a structured message, applies labels, handles attribution. Wraps `gh issue create`.
- **`comms-watch`** — polls Issues with relevant `affects:` labels, delivers new findings to team-lead inbox. Wraps `gh issue list`.

#### Implementation Scope for comms-dev Team

The comms-dev team builds:

1. **Message broker daemon** (Python or Node) — UDS listener, TLS-PSK, JSON envelope parsing, inbox delivery
2. **`comms-send` CLI** — send operational messages without knowing transport details
3. **`comms-publish` CLI** — create GitHub Issues with correct format and labels
4. **`comms-watch` CLI** — poll and deliver relevant GitHub Issues
5. **SendMessage integration glue** — bridge broker inbox with Claude Code's SendMessage system

The comms-dev team does **not** build: the protocols themselves (defined here), a UI, or authentication beyond PSK.

---

### Protocol 5: Resource Partition Table (*FR:Herald*)

#### Purpose

Define how agents within a single team can share a trunk (main branch) with zero coordination overhead by partitioning the repository into non-overlapping write domains. This protocol is the **pipeline team** counterpart to Branch Reservation (T02, Protocol R1), which serves **independent-output teams**.

#### The Two Isolation Strategies

Teams that share a repository face a fundamental choice: how do agents avoid conflicting writes? The answer depends on the team's data flow architecture.

```
Independent-Output Team          Pipeline Team

  Agent A ──→ feature/A            Agent A ──→ inventory/
  Agent B ──→ feature/B                ↓
  Agent C ──→ feature/C            Agent B ──→ shared/
                                       ↓
  Each agent's output is           Agent C ──→ dashboard/
  independent. No agent reads
  another agent's work-in-         Each agent reads the previous
  progress. Isolation by           agent's output. Isolation by
  BRANCH (worktree).               DIRECTORY (partition table).
```

| Strategy | Mechanism | Best for | Conflict prevention | Visibility cost |
|---|---|---|---|---|
| **Branch isolation** (T02 R1) | Each agent works on a separate branch in a worktree | Independent-output teams (two devs building separate features) | Structural — branches cannot conflict | High — agents cannot see each other's output until merge |
| **Directory partition** (this protocol) | All agents share trunk, each writes to exclusive directories | Pipeline teams (sequential data flow, each agent consumes prior agent's output) | Convention-enforced — partition table in prompt | Zero — agents see all changes immediately via `git pull` / shared checkout |

**Critical insight from apex-research (RFC #3):** Worktree isolation is an upgrade for independent-output teams and a **downgrade for pipeline teams**. When Agent B's input is Agent A's output, isolating them on separate branches means Agent B cannot see Agent A's latest work without a merge step. The isolation that prevents conflicts also prevents data flow.

#### When to Use Each Strategy

```
Does every agent's output flow into another agent's input?
  │
  ├─ YES (pipeline) ──→ Directory Partition (this protocol)
  │                      Trunk-based development. CI build gate.
  │
  └─ NO (independent) ──→ Branch Reservation (T02 R1)
                           Worktree isolation. PR merge cycle.
```

Mixed teams (some agents pipeline, some independent) use a hybrid: pipeline agents share trunk with a partition table; independent agents get worktrees. The partition table defines who is on trunk and who is on a branch.

#### The Resource Partition Table

The partition table is the protocol artifact. It is a mandatory section in the team's common-prompt (or equivalent team config) that declares, for each agent, which directories they may write to and which they read from.

##### Format

```markdown
| Agent | Writes to | Reads from | Notes |
|-------|-----------|------------|-------|
| <name> | <dir1>, <dir2> | <dir1>, <dir2> | <constraints> |
```

##### Rules

1. **No write overlap.** No two agents may have the same directory in their "Writes to" column. This is the invariant that prevents conflicts.
2. **Read is unrestricted.** Any agent may read any directory. The "Reads from" column documents data dependencies, not access control.
3. **Shared files have a single writer.** If a JSON file (e.g., `shared/clusters.json`) is read by multiple agents, exactly one agent owns writes to it. Other agents may read it but never modify it.
4. **Team-lead writes only to memory.** Consistent with the reference team pattern (team-lead is read-only during implementation). Team-lead's write scope is `memory/` and team config files.
5. **New directories require table update.** When an agent needs to create a new output directory, the team-lead updates the partition table before work begins.

##### Example: apex-research

```markdown
| Agent | Writes to | Reads from | Notes |
|-------|-----------|------------|-------|
| Champollion | inventory/, scripts/ | source-data (read-only) | Raw extraction from APEX SQL |
| Nightingale | shared/ | inventory/ | Analysis, overlap, clustering |
| Berners-Lee | dashboard/ | shared/, inventory/, specs/ | SvelteKit dashboard |
| Hammurabi | specs/, decisions/ | shared/, inventory/ | Cluster migration specs |
| Schliemann | memory/, dashboard/data/agents.json | specs/ (review only) | Coordination, agent status |
```

Evidence: 6 sessions, 80+ commits, 4 agents interleaving on main with zero conflicts. The partition held without structural enforcement.

##### Example: hr-devs (contrast — branch isolation team)

hr-devs agents build separate features for the same SvelteKit app. Sven and Dag both write to `src/` — their output is independent, not pipelined. Directory partition would not work because their write domains overlap. They use branch isolation (worktrees) and merge locks (T02 R1) instead.

#### Why This Works: Three Structural Properties

The partition table alone is necessary but not sufficient. Zero-conflict trunk development also requires:

**1. Unidirectional data flow (no circular dependencies)**

```
A → B → C    (pipeline — safe)
A ↔ B        (bidirectional — unsafe, agents may overwrite each other's input)
```

If Agent B writes to a directory that Agent A reads *and* Agent A writes to a directory that Agent B reads, you have a cycle. Cycles on trunk create ordering hazards — the order of commits matters, which means agents need real-time coordination. Pipeline teams must have a DAG (directed acyclic graph) of data dependencies, not a cycle.

**2. Append-mostly output pattern**

Agents that create new files (e.g., `inventory/f101/overview.md`) rarely conflict even within the same directory. Agents that frequently update existing shared files (e.g., two agents appending to `CHANGELOG.md`) will conflict. The partition table handles the write-domain separation, but append-mostly behavior provides a second layer of safety within a single agent's domain.

**3. Small, frequent commits**

Trunk-based development with multiple agents requires frequent commits and pulls. An agent that accumulates 500 lines of uncommitted changes before committing creates a larger conflict surface than one that commits after each logical unit. The commit cadence is: **commit after each completed task, not at the end of the session.**

#### Enforcement: Prompt-Level vs Platform-Level

| Enforcement | Mechanism | Strength | Cost |
|---|---|---|---|
| **Prompt-level** (v1) | Partition table in common-prompt. Agents honor it by instruction. | Sufficient for teams with consistent agent behavior. | Zero infrastructure. |
| **CI-level** (v2) | Pre-commit or push hook that checks `git diff --name-only` against the partition table for the committing agent. | Catches violations before they reach trunk. | Requires knowing which agent is committing (agent identity in commit metadata). |
| **Platform-level** (v3) | File system permissions or container volume mounts that physically restrict write access per agent. | Structural — cannot be violated. | High complexity. Requires per-agent containers or user accounts. |

**Recommendation:** Start with prompt-level enforcement. The apex-research evidence (6 sessions, zero violations) shows that well-prompted agents respect directory boundaries. Add CI-level enforcement when the team exceeds 5 agents or when a violation occurs.

#### Failure Modes

| Failure | Detection | Recovery |
|---|---|---|
| Agent writes to another agent's directory | `git log --name-only` audit shows cross-boundary writes | Team-lead identifies violation, reverts or reassigns the file. Update partition table if the boundary was wrong. |
| Two agents update the same shared JSON file | Merge conflict on commit | Assign single-writer ownership for that file. Add to partition table Notes column. |
| Circular data dependency emerges | Agent A blocks on Agent B's output while Agent B blocks on Agent A's | Refactor data flow to break the cycle. Introduce an intermediate shared file with a single writer. |
| Agent needs a new output directory not in the table | Agent creates directory without updating table | Team-lead updates table. Low risk — new directories don't conflict with existing ones. |
| Partition table becomes stale (agents' actual write patterns drift from table) | Periodic audit: `git log --name-only --author=<agent>` vs table | Team-lead reconciles table with reality. This is a health audit item (Medici's domain). |

#### Scaling Analysis

| Teams | Agents on trunk | Viable? | Notes |
|---|---|---|---|
| 1 team, 4 agents | 4 | Yes — proven by apex-research | Single partition table in common-prompt |
| 1 team, 8 agents | 8 | Yes with care | More directories = more partitions. Risk: finer-grained partitions make the table harder to maintain. |
| 2 teams, same repo | 8-16 | Hybrid recommended | Pipeline agents within each team share trunk via partition; inter-team isolation via branch/worktree (T02 R1). Each team's partition table covers its own agents. |
| 10+ teams, same repo | Not recommended | — | At this scale, repo splitting (T02 Option C) or per-team repos with API contracts is more appropriate. |

#### Integration with Other Protocols

| Protocol | Integration |
|---|---|
| T02 R1 (Branch Reservation) | Complementary — R1 for independent-output teams, Protocol 5 for pipeline teams. Mixed teams use both: partitioned trunk for pipeline agents, worktrees for independent agents. |
| T02 R3 (Migration Queue) | Partition table does not cover database migrations. If pipeline agents need schema changes, they still use the migration queue. |
| T03 Protocol 1 (Handoff) | Partition-based teams rarely need inter-agent handoffs within the team — the data flow IS the handoff. When Agent A commits to `inventory/`, Agent B sees it on next pull. No explicit handoff message needed. |
| T03 Protocol 3 (Broadcast) | Schema changes to shared data files (the fragile point) should be announced via team-internal broadcast or direct message. See Data Contract Protocol below. |
| T06 (Lifecycle) | Volta should reference this protocol when writing isolation strategy selection: team archetype (pipeline vs independent) determines isolation mechanism (partition vs worktree). |

#### Data Contract Protocol (sub-protocol) (*FR:Herald*)

The fragile point in a partitioned trunk is **shared data files** — JSON or TypeScript interfaces that one agent writes and multiple agents read. When the writer changes the schema, readers break silently.

##### Contract Location

A `types/` or `contracts/` directory at the repo root. Contains TypeScript interfaces (or JSON schemas) that define the shape of shared data files. This directory has **shared read, coordinated write** — any change to it requires team-lead awareness.

##### Schema Change Flow

```
1. Writer agent (e.g., Nightingale) needs to change shared data schema
2. Writer updates the contract file in types/ (interface change)
3. Writer messages team-lead: "Schema change: <field> added/removed/modified in <Interface>"
4. Team-lead evaluates impact on reader agents
5. If readers are affected:
   ├─ Team-lead notifies affected agents with the schema diff
   └─ Affected agents update their code to match the new contract
6. Writer commits the data in the new format
7. Reader agents commit their updated code
```

**Ordering matters:** The contract file is updated *before* the data changes. This ensures readers can detect the mismatch (runtime validation against the contract) rather than silently consuming malformed data.

##### Contrast with api-contracts.md Pattern

The reference teams (rc-team, hr-devs) use a shared `api-contracts.md` file where Sven (frontend) and Dag (backend) document agreed API shapes. The data contract protocol is the same principle applied to data pipeline teams: the contract defines the interface between pipeline stages, not between frontend and backend.

---

### Open Questions (*FR:Herald*)

#### Resolved by this design

- ~~How does a project team request a review from the QA team?~~ --> Handoff Protocol (Protocol 1), type: `review`
- ~~How does a human PO broadcast a priority change to all teams?~~ --> Broadcast Governance (Protocol 3), category: `freeze` or `incident`
- ~~Message format — structured (JSON) or natural language?~~ --> Hybrid: natural language body with structured metadata header (markdown fields, not JSON)
- ~~Sync vs async communication — when is each appropriate?~~ --> Pipeline teams use sync (shared trunk, immediate visibility via Protocol 5). Independent-output teams use async (branch isolation, PR/merge cycle via T02 R1). Team archetype determines the communication mode.
- ~~How do teams avoid duplicate work?~~ --> Resource Partition Table (Protocol 5) for intra-team: explicit directory ownership prevents overlap. Handoff Protocol (Protocol 1) for inter-team: manager agent tracks active work via handoff ledger.

#### Still open

1. ~~**Cross-team message delivery mechanism**~~ --> Resolved by Protocol 4: UDS transport via shared Docker volume for operational messages, GitHub Issues for knowledge persistence.

2. **Manager agent context budget** — The manager agent must hold context on all teams' capabilities, active handoffs, and direct link registry. At 10+ teams, this may exceed a single agent's context window. Mitigation: manager agent has its own Finn-equivalent for research, and the handoff ledger is persisted to disk.

3. **Handoff timeout values** — Protocol 1 says "escalate after 2 message cycles with no ACK" but doesn't define what a message cycle is in wall-clock time. For RC teams (always-on), this might be minutes. For local teams (session-based), it might span sessions.

4. **Cross-team Finn** — Can Team A's Finn research something in Team B's codebase? Currently no — Finn is scoped to its own team's workspace. A cross-team research request would go through the handoff protocol, which is heavy for a simple "what's the schema for table X?" question.

5. **Broadcast delivery confirmation** — Protocol 3 says "no reply-to-broadcast" but the sender has no way to know if a team-lead actually processed the message (vs. it sitting unread in their inbox). Should broadcasts require a lightweight ACK?

6. ~~**Direct link lifecycle**~~ --> Resolved by Direct Link Lifecycle Protocol (Protocol 2 §Lifecycle). Review triggers (time-based, inactivity, scope change, incident, on-demand), structured review process, authority split with T04 delegation matrix Rows 27-28.
