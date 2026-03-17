# Identity & Credentials

Authentication scoping and secret access per team.

## Open Questions

- One GitHub token for all teams or per-team tokens?
- How to scope Cloudflare API access per team?
- Who manages secrets — centralized vault or per-team?
- How do we audit which team used which credential?
- Can a team escalate its own permissions?

## Current State

- Single `CLOUDFLARE_API_TOKEN` shared between local and RC
- Single GitHub token (PAT or OAuth)
- Jira credentials in `~/.claude/.env`
- Dynamics 365 credentials in project `.env`

## Considerations

- Principle of least privilege — each team gets only what it needs
- Credential rotation — how to update across teams?
- Temporary credentials — short-lived tokens for temporary teams?
- Audit trail — log every API call with team identity

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Current state: shared credentials, single env file

All credentials live in `~/.claude/.env` (on both local and RC machines):

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` — same token, both environments
- `ATLASSIAN_BASE_URL`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN` — Jira
- `FIGMA_PAT` — Figma personal access token
- `GITHUB_TOKEN` — GitHub

No per-team credential scoping. All agents on all teams share the same credentials. No per-team Cloudflare API tokens, no per-team GitHub tokens.

### Credential loading pattern

Agents source the env file before API calls:

```bash
source ~/.claude/.env
curl -s -u "$ATLASSIAN_EMAIL:$ATLASSIAN_API_TOKEN" "$ATLASSIAN_BASE_URL/rest/api/3/..."
```

**Known gotcha:** `~/.claude/.env` values MUST be quoted — special characters break without quotes. This is in the Known Pitfalls section of both common-prompts.

### Figma PAT: rate-limit scoping drives access discipline

The most concrete example of credential scoping pressure: Figma PAT is a View/Collab seat with only 6 Tier 1 requests per month. Recovery from 429 can take days. This produced a strict access protocol:

- Prefer local screenshots over API calls
- Batch all node IDs, make minimal calls
- Cache responses to /tmp
- Max 2 Tier 1 calls per research task
- Log headers on 429, never retry

This shows that access discipline emerges from rate-limit pressure, not from upfront credential scoping.

### Attribution without authentication

The current attribution system (`(*RC-DEV:AgentName*)`) is honor-based — any agent could claim any name. There is no cryptographic or infrastructure-level proof of which agent wrote what. It serves as an audit trail for humans, not a security mechanism.

### No secret access escalation mechanism

There is no protocol for an agent to request elevated permissions. If an agent needs access it doesn't have, it must send a message to team-lead, who escalates to the human PO. No self-escalation path exists by design.

### Per-team credential isolation: not yet implemented

Both reference teams run on a single shared credential set. Per-team tokens, credential rotation, and audit-by-team-identity are open problems. The workspace MEMORY.md notes this as a known state.

---

## Identity & Credential Architecture (*FR:Herald*)

The patterns above describe the current state: shared credentials, honor-based attribution, no per-team scoping. This section designs the multi-team identity and credential system, addressing four questions: agent authentication across teams, credential passing in containers, cross-team identity verification, and secrets management.

### Design Principles

1. **Least privilege by default** — a team receives only the credentials its mission requires. A research team with read-only access to a repo does not receive deploy tokens.
2. **Identity is team-scoped, not agent-scoped** — individual agents within a team share the team's credential set. Scoping to individual agents adds complexity without proportional security benefit (agents within a team already trust each other).
3. **Credentials are injected, never discovered** — teams do not search for credentials. The credential set is defined at team creation and injected via environment or secrets mount. An agent that needs a credential it doesn't have escalates — it does not attempt to find one.
4. **Audit at the team boundary** — log which team used which credential, not which agent. Agent-level attribution (the `(*PREFIX:Agent*)` system) is the audit trail within a team; credential usage logs are the audit trail between teams.
5. **Honor-based internally, cryptographic externally** — within a team, agents trust each other (same container, same credential set). Between teams, messages must be verifiable (see Cross-Team Identity below).

---

### Section 1: Agent Authentication Across Teams (*FR:Herald*)

#### Problem

When Team A sends a message to Team B (via the hub or a direct link), how does Team B know the message is genuinely from Team A? In the current single-machine setup, all agents run under the same OS user — there is no OS-level identity boundary.

#### Authentication Layers

| Layer | Mechanism | What it proves | Threat it mitigates |
|---|---|---|---|
| **L0: Container isolation** | Separate Docker containers per team | Message originates from the correct container | Agent in Team A cannot impersonate Team B without container escape |
| **L1: Transport auth** | TLS-PSK on UDS (T03 Protocol 4) | Both endpoints share the comms secret | Eavesdropping, injection on the shared volume |
| **L2: Message signing** | HMAC-SHA256 with team-specific signing key | Message was created by an agent holding Team A's key | Message forgery (a compromised broker relaying fake messages) |
| **L3: Attribution** | `(*PREFIX:Agent*)` in message body | Claimed authorship (honor-based) | Post-hoc audit (not a security mechanism) |

#### v1: Container + TLS-PSK (sufficient for current scale)

At 2-10 teams, all running on infrastructure controlled by one PO, the threat model is accidental cross-contamination, not adversarial impersonation. Container isolation (L0) + TLS-PSK (L1) provides:

- **Isolation:** Each team's broker only accepts connections from containers that mount the shared comms volume and possess the PSK.
- **No per-team signing keys needed:** The PSK authenticates membership in the comms network. The `from.team` field in the message envelope (T03 Protocol 4) identifies the sender. Forgery requires container compromise.

#### v2: Per-Team Signing Keys (for 10+ teams or adversarial environments)

When the threat model includes compromised containers or untrusted team operators:

```
Each team generates a keypair at creation time:
  - Private key: mounted as Docker secret, accessible only to that team's broker
  - Public key: registered in the comms registry.json

Message signing:
  1. Broker computes HMAC-SHA256(message_body, team_private_key) → signature
  2. Signature included in message envelope: "signature": "<hex>"
  3. Receiver looks up sender's public key in registry, verifies signature

Key rotation:
  - On PO command (T04 Row 36 analogue — governance amendment)
  - Old key remains valid for 1 session (grace period for in-flight messages)
  - Registry stores both current and previous public key during rotation
```

#### Non-Containerized Environments (local teams)

For local teams (no Docker), authentication falls back to:

- **SendMessage routing** — the Claude Code infrastructure routes messages by team context. An agent spawned in team "framework-research" can only SendMessage to teammates within that team.
- **No cryptographic identity** — local teams trust the Claude Code process model.
- **Credential isolation** — achieved via environment variable scoping in the spawn command (see Section 4).

---

### Section 2: Credential Passing in Containerized Environments (*FR:Herald*)

#### Problem

The apex-research deployment revealed the credential-passing challenge concretely: the team needs Python + Node environments, access to two repos (one read-only, one read-write), and potentially API tokens for GitHub and the analysis dashboard. How do credentials enter the container?

#### Credential Injection Mechanisms

| Mechanism | Security | Rotation ease | Recommended for |
|---|---|---|---|
| **Docker secrets** | High — mounted at `/run/secrets/`, tmpfs, not in image layers | Requires container restart | Long-lived tokens (API keys, PATs) |
| **Environment variables via `env_file`** | Medium — visible in `docker inspect`, process listing | Update file + restart | Non-sensitive config (base URLs, account IDs) |
| **Inline env in compose** | Low — plaintext in compose file, committed to repo risk | Edit file | Never for secrets |
| **Volume-mounted env file** | Medium-high — file on host, not in image, permissions controllable | Update file + restart or source reload | Per-team `.env` files (current pattern) |
| **Vault/secrets manager** | Highest — dynamic, short-lived, audited | Automatic rotation | Production at scale (10+ teams) |

#### Recommended Architecture

**v1 (current scale: 2-5 teams):**

```yaml
services:
  apex-research:
    env_file:
      - ./teams/apex-research/.env       # Non-sensitive: repo paths, data dirs
    secrets:
      - github-token-apex                # GitHub PAT (scoped to repos this team needs)
      - comms-psk                        # Inter-team comms key
    environment:
      - GITHUB_TOKEN_FILE=/run/secrets/github-token-apex
      - COMMS_PSK_FILE=/run/secrets/comms-psk

secrets:
  github-token-apex:
    file: ./secrets/github-token-apex.txt
  comms-psk:
    file: ./secrets/comms-psk.key
```

**Key decisions:**

1. **Secrets via Docker secrets** — never environment variables for tokens. The current pattern of `ATLASSIAN_API_TOKEN` as an env var is acceptable for single-machine development but not for multi-team containers.

2. **Per-team env file** — each team gets its own `.env` with non-sensitive config. The team's env file lives in the team's directory (`./teams/<team-name>/.env`), managed by the team-lead or PO.

3. **File-based secret loading** — agents read from `$GITHUB_TOKEN_FILE` (path to a file) rather than `$GITHUB_TOKEN` (value in env). This prevents secrets from appearing in process listings and `docker inspect`.

**v2 (10+ teams):**

Introduce HashiCorp Vault or similar:
- Teams authenticate to Vault with a team-scoped AppRole
- Vault issues short-lived tokens (TTL: 1 session)
- Automatic rotation — no manual secret file management
- Audit log built into Vault

#### MCP Server Credential Passing (*FR:Herald*)

The current `~/.claude/mcp.json` demonstrates the problem clearly: Jira API tokens are stored inline in the MCP server configuration. At multi-team scale:

**Current (single team):**
```json
{
  "jira": {
    "env": {
      "ATLASSIAN_API_TOKEN": "<plaintext token>"
    }
  }
}
```

**Multi-team design:**
```json
{
  "jira": {
    "env": {
      "ATLASSIAN_API_TOKEN_FILE": "/run/secrets/jira-token"
    }
  }
}
```

MCP servers must support file-based secret loading (`*_FILE` convention, following Docker's pattern). Each team's MCP server instance reads from its own secret mount. This requires MCP servers to implement the `_FILE` suffix convention — when `FOO_FILE` is set, read the contents of that file as the value of `FOO`.

#### What apex-research Taught Us

The apex-research container config surfaces these concrete credential needs:

| Credential | Type | Scope | Sensitivity |
|---|---|---|---|
| GitHub PAT | Read-write on `apex-migration-research`, read-only on `vjs_apex_apps` | Team-specific | High — commit access |
| Comms PSK | Inter-team messaging | Cross-team | High — message integrity |
| Python PyPI index | Package installation | Generic | Low |
| npm registry token | SvelteKit dashboard dependencies | Generic | Low |

**Observation:** The team needs two different GitHub access scopes for the same token (or two tokens). GitHub fine-grained PATs can scope to specific repositories with specific permissions — this maps directly to per-team credential needs.

---

### Section 3: Cross-Team Identity Verification (*FR:Herald*)

#### Problem

When a team-lead receives a message claiming to be from another team, how do they verify it? This connects to T03 Protocol 1 (Handoff) — the receiver must trust that the handoff request is genuine.

#### Trust Model

```
┌─────────────────────────────────────────────────────┐
│                  Trust Boundaries                     │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─── Team A Container ───┐  ┌─── Team B Container ──┐│
│  │  Agents trust each     │  │  Agents trust each     ││
│  │  other (same secrets)  │  │  other (same secrets)  ││
│  │                        │  │                        ││
│  │  Honor-based identity  │  │  Honor-based identity  ││
│  │  within container      │  │  within container      ││
│  └────────┬───────────────┘  └───────┬────────────────┘│
│           │                          │                  │
│           └──── Verified channel ────┘                  │
│              (TLS-PSK / signing key)                    │
│                                                         │
│  Messages between containers: cryptographically verified│
│  Messages within container: trust by construction       │
└─────────────────────────────────────────────────────────┘
```

#### Verification Protocol

For hub-routed messages (the common case per T03 Protocol 2):

```
1. Team A broker signs message with Team A's key
2. Team A broker sends to Manager broker (hub)
3. Manager broker verifies Team A's signature against registry public key
4. Manager broker re-signs with Manager's key (adds routing attestation)
5. Manager broker delivers to Team B broker
6. Team B broker verifies Manager's signature
7. Team B broker delivers to Team B lead's inbox
   - Envelope includes: original sender (Team A), router (Manager), both signatures
```

For direct-link messages:

```
1. Team A broker signs message with Team A's key
2. Team A broker sends directly to Team B broker (authorized direct link)
3. Team B broker verifies Team A's signature against registry public key
4. Team B broker delivers to Team B lead's inbox
```

**Key property:** The receiver always verifies at least one signature. In hub-routing, the manager's signature provides routing attestation ("I, the manager, confirm I routed this message and verified the sender"). In direct links, the sender's signature is the only attestation.

#### Non-Containerized Verification

For local teams (no Docker, no broker), verification is implicit:

- SendMessage routing is handled by Claude Code's process model
- An agent can only be in one team at a time
- The `from` field in SendMessage is set by the infrastructure, not the agent
- **Limitation:** This is infrastructure trust, not cryptographic trust. Acceptable for single-machine, single-operator environments.

---

### Section 4: Secrets Management (*FR:Herald*)

#### Problem

Where do API keys, SSH keys, tokens, and other secrets live? Who has access to what? How are they rotated?

#### Secrets Inventory (Current State)

| Secret | Location | Who uses it | Scope | Rotation |
|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | `~/.claude/.env` | All teams | Full account access | Manual, PO only |
| `CLOUDFLARE_ACCOUNT_ID` | `~/.claude/.env` | All teams | Not a secret (account identifier) | N/A |
| `ATLASSIAN_API_TOKEN` | `~/.claude/.env` + `mcp.json` (inline!) | All teams | Full Jira access | Manual, PO only |
| `ATLASSIAN_EMAIL` | `~/.claude/.env` + `mcp.json` | All teams | Not a secret (email) | N/A |
| `FIGMA_PAT` | `~/.claude/.env` | Research teams | View/Collab (6 req/mo) | Manual, ~annual |
| `GITHUB_TOKEN` | `~/.claude/.env` | All teams | Repo access (PAT scope) | Manual, PO only |
| Comms PSK | Not yet deployed | Inter-team comms | Message integrity | On PO command |
| Per-team signing keys | Not yet deployed | Per-team message auth | Message origin proof | On PO command |

#### Target Architecture: Per-Team Credential Sets

```
Secret Storage (managed by PO):
├── global/                          # Shared across all teams
│   ├── comms-psk.key                # Inter-team comms pre-shared key
│   └── cloudflare-account-id.txt    # Not a secret, but centralized
│
├── teams/
│   ├── apex-research/
│   │   ├── .env                     # Non-sensitive config
│   │   ├── github-token.txt         # Fine-grained PAT: read apex-migration-research + vjs_apex_apps
│   │   └── signing-key.pem          # Team identity key (v2)
│   │
│   ├── hr-devs/
│   │   ├── .env
│   │   ├── github-token.txt         # Fine-grained PAT: read-write hr-platform
│   │   ├── cloudflare-token.txt     # Scoped: Pages deploy on hr-platform project
│   │   ├── jira-token.txt           # Jira API access
│   │   └── signing-key.pem
│   │
│   └── framework-research/
│       ├── .env
│       ├── github-token.txt         # Fine-grained PAT: read-write mitselek/ai-teams
│       └── signing-key.pem
```

#### Per-Team Credential Scoping Rules

| Team type | GitHub | Cloudflare | Jira | Figma | Comms |
|---|---|---|---|---|---|
| **Research** (read-only analysis) | Read on source repos | None | Read (if needed) | Optional | PSK |
| **Development** (implements code) | Read-write on project repo | Deploy to dev | Read-write on project board | None | PSK |
| **QA** (tests, reviews) | Read on project repo, write on PRs | None | Read | None | PSK |
| **Infrastructure** (CI/CD, deployment) | Read-write on infra repos | Full account (scoped to infra) | None | None | PSK |

**Principle:** Start with the minimal credential set for the team type. Add credentials via PO approval (T04 delegation matrix — this is an L0 decision, analogous to Row 3: changing team composition).

#### Credential Lifecycle

```
Creation:
  1. PO creates team charter (T04 Q4 process)
  2. PO (or L1) generates/provisions credentials for the team:
     - GitHub: create fine-grained PAT scoped to needed repos
     - Cloudflare: create API token scoped to needed resources
     - Jira: use existing org token (cannot scope per-team in Atlassian Cloud)
  3. Secrets written to team's secret directory
  4. Container compose updated with secret mounts

Rotation:
  1. PO generates new credential
  2. PO writes new secret to team's secret directory
  3. Container restart picks up new secret file
  4. Old credential revoked after confirming new one works
  - Note: for Jira/Figma (org-wide tokens), rotation affects ALL teams

Revocation (team dissolution):
  1. Team shutdown protocol completes (T06)
  2. PO revokes team-specific credentials (GitHub PAT, Cloudflare token)
  3. Team's secret directory is archived, then deleted
  4. Signing key removed from comms registry
```

#### Credential Escalation Protocol (*FR:Herald*)

**An agent cannot escalate its own permissions.** This is a hard rule (T07 §Permission Categories: "Access other teams' credentials" is in the "Never" category).

When a team discovers it needs a credential it doesn't have:

```
1. Agent identifies missing credential need
2. Agent reports to team-lead: "Task X requires Cloudflare deploy access, which we don't have"
3. Team-lead sends escalation to L1 (or PO):
   "apex-research requests: Cloudflare Pages deploy token, scoped to project apex-dashboard.
    Reason: dashboard deployment for internal use.
    Duration: permanent (part of team mission) | temporary (one-time task)"
4. PO evaluates:
   ├─ Approve → PO provisions credential, adds to team's secret directory
   ├─ Deny → PO explains why; team adjusts approach
   └─ Redirect → "Use hr-devs' deploy pipeline instead" (handoff, not credential sharing)
5. PO informs L1 of decision for audit trail
```

**Anti-pattern: credential sharing between teams.** If Team A needs to deploy but only Team B has the deploy token, the answer is NOT to give Team A the token. The answer is a handoff request (T03 Protocol 1, `type: deploy`). This preserves the principle that each team's credential set matches its mission.

#### Jira and Figma: Org-Wide Token Limitation

Atlassian Cloud and Figma do not support per-team API token scoping. A single PAT grants full access.

**Mitigation:**
- **Access control via prompt** — only teams whose mission includes Jira interaction have the token in their env. Research teams do not load `ATLASSIAN_API_TOKEN`.
- **Behavioral audit** — Jira operations require PO approval (T04 Row 22). Even teams with the token cannot create/update issues without explicit PO request.
- **Rate limit awareness** — all teams sharing a token share its rate limit. T02 resource isolation addresses this with rate limit partitioning.

---

### Section 5: Audit Trail Design (*FR:Herald*)

#### Requirement

For any API call or credential use, the system must be able to answer: **which team** made this call, **when**, and **why** (linked to a task or handoff).

#### Audit Layers

| Layer | What it captures | Storage | Who reads it |
|---|---|---|---|
| **API provider logs** | HTTP requests from token | External (GitHub, Cloudflare, Jira) | PO (via provider dashboard) |
| **Container logs** | Which team's container made the call | Docker log driver | PO, L1 |
| **Handoff ledger** | Why the call was made (task context) | Manager agent memory (T03 Protocol 1) | L1, PO |
| **Attribution** | Which agent authored the output | `(*PREFIX:Agent*)` in artifacts | Anyone reading the artifact |

#### Per-Team Token = Per-Team Audit

The strongest audit mechanism is per-team tokens. When apex-research uses `github-token-apex` and hr-devs uses `github-token-hrdevs`, the GitHub audit log distinguishes them by token. No additional logging infrastructure is needed — the API provider does the work.

**This is the primary argument for per-team tokens over shared tokens.** Not security (teams are trusted by the PO) — but auditability.

#### When Per-Team Tokens Are Not Possible

For Jira/Figma (org-wide tokens), audit falls back to:

1. **Container-level logging:** Each team's container logs API calls with team name prefix:
   ```
   [2026-03-17T14:00:00Z] [apex-research] JIRA GET /rest/api/3/issue/VL-42
   ```
2. **Behavioral restriction:** Only teams with Jira in their mission load the token. Others literally cannot make the call.
3. **Correlation with task system:** Cross-reference the API call timestamp with the team's task list and handoff ledger to understand context.

---

### Open Questions (*FR:Herald*)

#### Resolved by this design

- ~~One GitHub token for all teams or per-team tokens?~~ → Per-team fine-grained PATs, scoped to repos the team needs. PO provisions at team creation.
- ~~How to scope Cloudflare API access per team?~~ → Per-team Cloudflare API tokens, scoped to the team's project/resources. Research teams get none.
- ~~Who manages secrets — centralized vault or per-team?~~ → v1: PO-managed per-team secret directories with Docker secrets. v2 (10+ teams): HashiCorp Vault with team-scoped AppRoles.
- ~~How do we audit which team used which credential?~~ → Per-team tokens provide API-provider-level audit. Where not possible (Jira/Figma), container logging + behavioral restriction.
- ~~Can a team escalate its own permissions?~~ → No. Credential escalation goes through team-lead → L1/PO. Hard rule: no self-escalation. Anti-pattern: credential sharing between teams.

#### Still open

1. **Jira per-team scoping** — Atlassian Cloud does not support per-project API tokens. If two teams both need Jira access for different boards, they share one token. Behavioral restriction is the only control. Is this acceptable long-term, or should we investigate Atlassian Forge apps for finer-grained access?

2. **Secret bootstrap for new teams** — When PO creates a new team, how are the initial secrets provisioned? Currently manual (PO writes files). At 10+ teams, this needs automation — possibly a provisioning script that creates GitHub PATs via API, generates signing keys, and writes the secret directory.

3. **Credential for cross-team dashboard access** — The apex-research dashboard serves read-only data to migration teams. Does the dashboard need its own auth layer, or is network-level access control (only accessible from team containers) sufficient?

4. **Signing key compromise recovery** — If a team's signing key is compromised (container breach), what's the recovery process? Proposed: PO revokes the key, generates a new one, restarts the team's container. All messages signed with the old key after the compromise timestamp are suspect. Needs a formal incident response protocol.

5. **MCP server credential isolation** — The current `mcp.json` contains plaintext tokens. For multi-team, each team needs its own MCP server instances with team-scoped credentials. This affects the MCP server architecture — should MCP servers support the `_FILE` env var convention, or should a wrapper script inject secrets before launch?

(*FR:Herald*)
