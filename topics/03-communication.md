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
- **Type:** review | deploy | build | test | consult | migrate
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
```

This ledger lives in the manager agent's memory directory, not in any team's workspace.

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
| Team A | Team B | Reason | Authorized | Revoke condition |
|---|---|---|---|---|
| hr-devs | qa-team | PR review handoff | 2026-03-01 | When QA team is dissolved |
| hr-devs | platform | Shared D1 database | 2026-03-01 | When DB isolation is implemented |
```

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

### Open Questions (*FR:Herald*)

#### Resolved by this design

- ~~How does a project team request a review from the QA team?~~ --> Handoff Protocol (Protocol 1), type: `review`
- ~~How does a human PO broadcast a priority change to all teams?~~ --> Broadcast Governance (Protocol 3), category: `freeze` or `incident`
- ~~Message format — structured (JSON) or natural language?~~ --> Hybrid: natural language body with structured metadata header (markdown fields, not JSON)

#### Still open

1. ~~**Cross-team message delivery mechanism**~~ --> Resolved by Protocol 4: UDS transport via shared Docker volume for operational messages, GitHub Issues for knowledge persistence.

2. **Manager agent context budget** — The manager agent must hold context on all teams' capabilities, active handoffs, and direct link registry. At 10+ teams, this may exceed a single agent's context window. Mitigation: manager agent has its own Finn-equivalent for research, and the handoff ledger is persisted to disk.

3. **Handoff timeout values** — Protocol 1 says "escalate after 2 message cycles with no ACK" but doesn't define what a message cycle is in wall-clock time. For RC teams (always-on), this might be minutes. For local teams (session-based), it might span sessions.

4. **Cross-team Finn** — Can Team A's Finn research something in Team B's codebase? Currently no — Finn is scoped to its own team's workspace. A cross-team research request would go through the handoff protocol, which is heavy for a simple "what's the schema for table X?" question.

5. **Broadcast delivery confirmation** — Protocol 3 says "no reply-to-broadcast" but the sender has no way to know if a team-lead actually processed the message (vs. it sitting unread in their inbox). Should broadcasts require a lightweight ACK?

6. **Direct link lifecycle** — How are direct links established, tested, and revoked in practice? Does the manager agent periodically audit direct links for ones that are no longer needed?
