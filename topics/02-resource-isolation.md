# Resource Isolation

How teams avoid stepping on each other's work.

## Open Questions

- Can two teams work on the same repo simultaneously?
- Who owns the `develop` branch? Can teams push directly or only via PR?
- How do we prevent D1 migration conflicts?
- Shared Cloudflare account — how to scope deployments?
- Rate limits — Cloudflare API, GitHub API, Jira API — how to partition?

## Resources to Isolate

### Git

- Branch naming conventions per team?
- Worktree isolation (already used for parallel agents)
- PR ownership — which team owns which PR?

### Database (D1)

- Migrations — serialized? per-team dev databases?
- Seed data — team-specific or shared?
- Remote dev DB — single shared instance, conflict risk

### Deployments

- One Cloudflare project, multiple teams deploying — queue? locks?
- Environment separation (dev, staging, production)

### External APIs

- GitHub API rate limits (5000/hr per token)
- Jira API limits
- Dynamics 365 API limits

## Notes

## Patterns from Reference Teams (*FR:Finn*)

### Git isolation — single shared workspace, serialized ownership

Both teams share **one git working directory**. Isolation is behavioral, not structural:

- Only one agent owns git operations at a time (the agent creating the PR)
- Team-lead is read-only during implementation — delegates, never touches files
- Agents coordinate before `git checkout` by messaging team-lead, who alerts others
- Force-push/reset requires team-lead approval
- Branch naming convention: `story/<issue-number>-short-description` or `fix/<issue-number>-short-description`

**Evolution:** hr-devs team-lead prompt is even more restrictive — explicitly forbidden from running `git add/commit/push`.

### Worktree isolation for parallel agents

The MEMORY.md for the workspace (`dev-toolkit`) notes: use `isolation: "worktree"` when spawning parallel agents that work in the same git repo — shared workspace causes branch conflicts and lost work. Worktrees are the recommended mechanism when two agents need different branches simultaneously.

### Branch strategy: develop not main

- All branches branch from `develop`, never `main`
- PRs always target `develop`
- `main` is protected — no direct pushes from agents

### DB isolation: naming convention

D1 database names are environment-scoped:

- dev: `conversations-dev`
- production: `conversations`

No per-team databases in current practice — single dev DB shared. Migration conflicts are a known risk (open question, unresolved).

### Rate limits: known but unmanaged

Current state: all agents share:

- Single `CLOUDFLARE_API_TOKEN` (same on local and RC)
- Single GitHub token (PAT or OAuth)
- Jira credentials in `~/.claude/.env`
- Figma PAT (critically rate-limited: 6 Tier 1 requests/month)

Figma rate limit produced a concrete protocol: prefer local screenshots, batch node IDs, cache JSON responses, max 2 Tier 1 calls per research task. This is the clearest example of a rate limit driving workflow design.

### Deployment scoping: per-environment commands

Wrangler commands use `--env dev` / `--env production`. No per-team deployment queuing mechanism exists yet.

## Deep Research: Multi-Team Isolation Design (*FR:Finn*)

### 1. Git Isolation — Worktrees vs Forks vs Separate Repos

#### Current state (single-team)

Both reference teams use a **shared working directory** with behavioral isolation: one agent owns git at a time, team-lead coordinates branch switches via messaging. This works for a single team but breaks down with multiple concurrent teams.

#### Option A: Git Worktrees (recommended for same-repo teams)

**How it works:** Each team gets its own worktree from the same repository. All worktrees share the `.git` directory (object store, refs) but have independent working trees and `HEAD` pointers.

```bash
# Team alpha works in the main checkout
cd ~/github/hr-platform

# Team beta gets a worktree
git worktree add ~/github/hr-platform--beta develop
```

**Strengths:**
- Already proven: the MEMORY.md pattern from dev-toolkit recommends `isolation: "worktree"` for parallel agents
- Shared object store — no fetch duplication, instant branch visibility
- Each team can checkout different branches simultaneously without coordination
- Low disk overhead (only working tree files duplicated, not `.git`)

**Weaknesses:**
- Cannot checkout the same branch in two worktrees simultaneously (git limitation)
- Shared refs mean a force-push from one team affects all worktrees
- Worktree lifecycle management needed (create on team spawn, prune on shutdown)
- Lock files in `.git/worktrees/` can become stale if a team crashes

**Multi-team convention needed:**
- Branch prefix per team: `alpha/story/123-feature`, `beta/fix/456-bug`
- Each team's worktree path: `~/github/<repo>--<team-name>`
- Team-lead responsible for worktree creation during startup and pruning during shutdown

#### Option B: Forks (recommended for cross-org or low-trust teams)

**How it works:** Each team forks the upstream repo. PRs flow from fork to upstream.

**Strengths:**
- Complete isolation — no shared refs, no shared working directory
- GitHub permission model applies naturally (fork can have different collaborators)
- Already standard in open-source workflows

**Weaknesses:**
- Fork sync overhead: must regularly `git fetch upstream && git merge upstream/develop`
- CI must be configured per-fork (GitHub Actions don't auto-run on forks for security)
- D1 database bindings in `wrangler.jsonc` would need fork-specific overrides
- Overkill for internal teams sharing the same infrastructure

**Best for:** External contributors, vendor teams, teams with different security clearances.

#### Option C: Separate Repos (for genuinely independent services)

**When to use:** When teams own different services that communicate via API, not shared code. Not applicable to teams working on the same SvelteKit app.

#### Recommendation

**Worktrees for same-project teams** (most common case). Forks only when organizational boundary requires it. The framework should support both via a `gitIsolation` field in team config:

```json
{
  "gitIsolation": "worktree",      // or "fork" or "shared"
  "worktreePath": "~/github/hr-platform--{team-name}",
  "branchPrefix": "{team-name}/"
}
```

### 2. Database Migration Serialization

#### The problem

D1 migrations are numbered sequentially (`0001_`, `0002_`, ...). Two teams creating migrations concurrently will collide on the sequence number. Worse: `wrangler d1 migrations apply` runs all unapplied migrations in order — interleaved migrations from different teams could create schema dependencies that neither team intended.

#### Current state

Both reference teams use a single dev DB (`conversations-dev`) with sequential numbered migrations. Dag's scratchpad documents extensive migration work (0039-0041) with table rebuild patterns and PRAGMA workarounds. No multi-team coordination exists.

#### Option A: Migration lock with sequence reservation

A central registry (file or lightweight service) that teams must claim before creating a migration:

```
# .migrations/registry.json
{
  "nextSequence": 42,
  "reservations": [
    {"team": "alpha", "range": [42, 44], "expires": "2026-03-15T00:00:00Z"},
    {"team": "beta", "range": [45, 45], "expires": "2026-03-14T18:00:00Z"}
  ]
}
```

**Pros:** Simple, compatible with current D1 tooling. **Cons:** Requires coordination before migration creation; stale reservations need cleanup.

#### Option B: Per-team dev databases

Each team gets its own D1 dev database:

- `conversations-dev-alpha`
- `conversations-dev-beta`
- Shared `conversations-staging` for integration testing
- Shared `conversations` for production

**Pros:** Full isolation during development. **Cons:** Schema drift between team databases; need a merge step before staging.

#### Option C: Timestamp-based migration naming

Replace sequential numbers with timestamps: `20260314_143000_add_column.sql`. Eliminates sequence conflicts.

**Pros:** No coordination needed. **Cons:** D1's `migrations apply` uses alphabetical order — timestamps sort correctly but break the numbered convention already established.

#### Recommendation

**Option A (migration lock) for same-project teams** — it preserves the existing numbered convention and forces teams to coordinate. For the framework: expose a `claimMigrationRange(team, count)` utility that writes to the registry and returns assigned numbers.

**Option B (per-team databases)** as an escape hatch for long-running parallel feature branches where schema divergence is expected.

### 3. Deployment Queue Design

#### The problem

Multiple teams deploying to the same Cloudflare Pages project simultaneously can cause:
- Race conditions in `wrangler pages deploy` (last deploy wins)
- Inconsistent state if deploy A rolls back while deploy B is in progress
- Confusion about which team's code is live

#### Current state

Piper (CI/CD agent in rc-team) manages deployments per-environment (`--env dev`, `--env production`). No queuing. Cloudflare Pages Git integration handles production deploys on merge to `main`. CI runs quality gates but deployment is implicit.

#### Proposed: Deploy queue with team-scoped locks

```
Deploy Queue Lifecycle:
1. Team requests deploy slot: POST /deploy-queue {team, environment, commitHash}
2. Queue grants slot if environment is free (returns lock token)
3. Team deploys using wrangler with lock token
4. Team releases slot: POST /deploy-queue/release {lockToken}
5. Queue grants next waiting team

Timeout: lock auto-releases after 10 minutes (deploy should complete faster)
```

**Implementation options:**

| Approach | Complexity | Durability |
|----------|-----------|------------|
| File-based lock (`/tmp/deploy-lock-{env}`) | Low | Lost on reboot |
| Cloudflare KV lock | Medium | Persistent, accessible from Workers |
| SQLite/D1 queue table | Medium | Persistent, queryable |
| Durable Object (single-instance mutex) | High | Strongest guarantee, built for this |

**Recommendation:** Start with file-based lock for dev deploys. Use Durable Object lock for staging/production when multiple teams are active. The framework should abstract this behind a `deploy(team, environment)` command.

#### Environment allocation at scale

With tens of teams, environment scoping needs structure:

| Environment | Purpose | Access |
|-------------|---------|--------|
| `dev-{team}` | Team-specific dev | Team only |
| `staging` | Integration testing | Deploy queue |
| `production` | Live | Deploy queue + approval |

Each `dev-{team}` environment has its own D1 binding, Cloudflare Pages preview URL, and secrets. Teams deploy freely to their own dev environment. Staging and production require queued deploys.

### 4. API Rate Limit Partitioning

#### Current state

All agents across all teams share single tokens:
- **GitHub PAT**: 5000 requests/hour (all agents combined)
- **Jira API**: credentials in `~/.claude/.env` (all agents)
- **Cloudflare API**: single `CLOUDFLARE_API_TOKEN`
- **Figma PAT**: 6 Tier 1 requests/month (most restrictive)
- **Dynamics 365**: via sync service (scheduled, not agent-invoked)

The Figma rate limit already drove protocol design: prefer local screenshots, batch node IDs, cache JSON, max 2 Tier 1 calls per research task. This is a proven pattern for rate-limit-driven workflow constraints.

#### Partitioning strategies

**Strategy 1: Token-per-team**

Issue separate tokens per team where the API supports it:
- GitHub: create per-team GitHub Apps or fine-grained PATs scoped to specific repos
- Jira: create per-team API tokens (different Atlassian accounts or OAuth clients)
- Cloudflare: create per-team API tokens with scoped permissions (read-only for research teams, deploy for dev teams)

**Pros:** Hard isolation, independent rate limits. **Cons:** Token management overhead; not all APIs support multiple tokens easily.

**Strategy 2: Quota budgeting (soft limits)**

Keep shared tokens but allocate budgets per team:

```json
{
  "rateLimits": {
    "github": {
      "hourlyBudget": 5000,
      "teamAllocations": {
        "alpha": 2000,
        "beta": 2000,
        "research": 500,
        "reserve": 500
      }
    }
  }
}
```

A lightweight middleware tracks usage per team and warns/blocks when budget is exhausted.

**Pros:** Works with any API; no token multiplication. **Cons:** Soft enforcement (agent must honor the budget); requires usage tracking.

**Strategy 3: Request proxy with rate limiting**

All API calls go through a local proxy that enforces per-team rate limits:

```
Agent → localhost:8080/github/repos/... → proxy tracks team budget → GitHub API
```

**Pros:** Hard enforcement; centralized logging; can add caching. **Cons:** Proxy is a single point of failure; adds latency; significant infrastructure.

#### Recommendation

**Phase 1 (near-term):** Token-per-team for GitHub (fine-grained PATs are free and scoped). Quota budgeting for Jira and Cloudflare (shared tokens with soft limits in team config).

**Phase 2 (scale):** Request proxy for APIs with strict rate limits. Priority: Figma (already causing workflow constraints), then GitHub if team count exceeds ~3.

**Framework support:** Team config should declare API dependencies and their budget:

```json
{
  "apiAccess": [
    {"api": "github", "token": "env:GITHUB_TOKEN_ALPHA", "budget": 2000},
    {"api": "jira", "token": "env:ATLASSIAN_API_TOKEN", "budget": "shared"},
    {"api": "figma", "token": "env:FIGMA_PAT", "budget": 2, "budgetUnit": "tier1/month"}
  ]
}
```

### 5. Cross-Cutting Observations

#### Behavioral vs structural isolation

The reference teams rely almost entirely on **behavioral isolation** — protocols, conventions, and trust. This works for 1 team but does not scale. The framework needs to introduce **structural isolation** incrementally:

| Resource | Current (behavioral) | Target (structural) |
|----------|---------------------|---------------------|
| Git workspace | "Only one agent at a time" | Worktrees per team |
| Branches | Naming convention | Prefix + CI enforcement |
| Database | Shared dev DB | Per-team dev DB + shared staging |
| Deploys | One team deploys at a time | Queue with locks |
| API tokens | Shared single token | Per-team tokens where possible |
| Secrets | Shared `~/.claude/.env` | Per-team env files or vault |

#### Secret isolation

Currently all teams would share `~/.claude/.env`. At scale this is a security risk — a compromised agent in one team could access another team's credentials. The framework should support per-team secret scoping:

- `~/.claude/teams/{team-name}/.env` for team-specific secrets
- Global secrets (like the Anthropic API key) remain in `~/.claude/.env`
- Agent prompts should reference `$TEAM_ENV` not a hardcoded path

#### File system isolation

Beyond git, agents can read/write arbitrary files. The framework should define a team's writable paths:

```json
{
  "writablePaths": [
    "{worktree}/",
    "teams/{team-name}/memory/",
    "teams/{team-name}/docs/",
    "/tmp/{team-name}/"
  ],
  "readOnlyPaths": [
    "teams/{team-name}/common-prompt.md",
    "teams/{team-name}/roster.json"
  ]
}
```

This maps to the existing pattern where team-lead is forbidden from editing source code, and agents own their scratchpads.

---

## Inter-Team Resource Coordination Protocols (*FR:Herald*)

The patterns above describe **intra-team** resource isolation (Finn's research) and the scaling paths for structural isolation. This section designs the **inter-team coordination protocols**: the message flows, lock lifecycles, and failure modes that govern how teams request, hold, and release shared resources.

These protocols complement the communication protocols in T03. Resource coordination messages use the existing communication infrastructure — no new primitives are needed.

### Design Principles

1. **Locks are leased, never permanent.** Every lock has a TTL. No team can hold a resource indefinitely.
2. **Manager agent is the lock authority.** Teams request locks through the manager agent (consistent with T03 Protocol 2 — hybrid topology). Direct-linked teams may fast-path for pre-authorized resource types.
3. **Behavioral enforcement first, infrastructure later.** Like the reference teams, v1 enforces coordination via protocol and prompt instructions. Infrastructure enforcement (file locks, CI gates) is the v2 path.
4. **Conflicts are detected, not just prevented.** Even with perfect protocol adherence, concurrent systems can conflict. Detection and resolution matter as much as prevention.

---

### Protocol R1: Branch Reservation (*FR:Herald*)

#### The Problem

When two teams share a repository, they may:
- Create branches with colliding names
- Both attempt to merge to `develop` simultaneously, causing merge conflicts
- Rebase over each other's in-flight work

The single-team pattern (one agent owns git at a time) doesn't scale — it would serialize all work across all teams.

#### Branch Namespace Partitioning

Each team gets an exclusive branch prefix registered in roster.json (extends Finn's recommendation in "Git Isolation — Worktrees"):

```json
{
  "team_name": "hr-devs",
  "prefix": "HR",
  "branch_prefix": "hr/"
}
```

| Team | Branch prefix | Example |
|---|---|---|
| hr-devs | `hr/` | `hr/story/42-user-profile` |
| qa-team | `qa/` | `qa/fix/88-flaky-test` |
| platform | `plat/` | `plat/feat/d1-migration-v3` |

**Rules:**
- A team may only create branches under its own prefix
- The existing `story/` and `fix/` conventions become suffixes: `<team-prefix>/story/<issue>-<desc>`
- `develop` and `main` are shared — no team owns them
- Branch prefixes are registered in roster.json, validated by the manager agent, and must be unique

#### Merge Coordination

Merging to `develop` is the critical contention point. Two teams merging simultaneously can produce broken state.

##### Merge Lock

```
┌──────────────┐    request     ┌──────────────┐    grant      ┌──────────────┐
│   Team A     │───────────────>│   Manager    │──────────────>│   Team A     │
│   lead       │                │   Agent      │               │   (merging)  │
└──────────────┘                └──────┬───────┘               └──────┬───────┘
                                       │                              │
                                       │  queued                      │ done
                                       │                              │
┌──────────────┐    request     ┌──────┴───────┐    grant      ┌─────▼────────┐
│   Team B     │───────────────>│   Manager    │──────────────>│   Team B     │
│   lead       │                │   Agent      │               │   (merging)  │
└──────────────┘                └──────────────┘               └──────────────┘
```

**Merge Lock Request:**

```markdown
## Resource Lock Request

- **From:** <team-name>
- **Resource:** merge:<repo-name>:develop
- **Reason:** PR #<N> — <one-line summary>
- **Estimated duration:** <minutes>
- **Priority:** normal | urgent
- **Files changed:** <output of git diff develop...<branch> --name-only>
```

**Rules:**
1. Only one team may hold the merge lock for a given branch at a time
2. Lock TTL: 15 minutes (default). Renewable once for another 15 min.
3. If lock expires without release, manager agent force-releases and notifies the holding team
4. Urgent priority: manager agent may preempt a queued normal request (but never revoke a held lock)
5. Lock holder must: pull latest `develop`, merge/rebase, run quality gates, push, then release lock

**Lock Lifecycle:**

```
AVAILABLE ──request──> HELD(team, expiry) ──release──> AVAILABLE
                              │
                         TTL expires
                              │
                              ▼
                       FORCE_RELEASED ──notify──> team
```

#### Conflict Detection

Even with merge locks, content conflicts can arise (two teams edited the same file on different branches). Detection:

1. **Pre-merge check:** Before requesting the merge lock, the team includes changed files in the lock request
2. **Manager agent cross-references:** If another team has an open PR touching the same files, manager agent flags it as a potential conflict and notifies both teams
3. **Resolution:** The later team rebases onto the earlier team's merged changes. If the conflict is non-trivial, manager agent mediates via the handoff protocol (T03 Protocol 1)

---

### Protocol R2: Deployment Lock (*FR:Herald*)

#### The Problem

Multiple teams deploying to the same Cloudflare project simultaneously can produce:
- Partial deployments (one overwrites the other mid-deploy)
- Inconsistent state between Workers and D1
- Failed rollbacks (which version to roll back to?)

#### Deployment Environments

| Environment | Lock authority | Concurrency |
|---|---|---|
| `dev-{team}` | Team-lead (no lock needed — exclusive) | Unlimited |
| `dev` (shared) | Manager agent | One team at a time |
| staging | Manager agent | One team at a time |
| production | PO (human) + manager agent | One team at a time, human-gated |

Note: Per-team dev environments (`dev-{team}`) as recommended by Finn's research eliminate the need for locking at the dev tier entirely. The lock protocol applies to shared environments.

#### Deployment Lock Protocol

```markdown
## Deployment Lock Request

- **From:** <team-name>
- **Target:** <project>:<environment> (e.g., hr-platform:staging)
- **Includes:** code-only | code+migration | migration-only
- **Branch/commit:** <ref>
- **Estimated duration:** <minutes>
- **Rollback plan:** <revert commit | previous version tag>
```

**Flow:**

```
1. Team-lead sends Deployment Lock Request to manager agent
2. Manager agent checks:
   ├─ Is the environment lock available?
   ├─ Is there a merge freeze in effect? (T03 Protocol 3 broadcast)
   ├─ Does the deployment include a migration? (if yes, see Protocol R3)
   └─ Are quality gates passed? (team attests: tests green, lint clean)
3. Manager agent grants lock with TTL:
   ├─ shared dev: 30 min TTL
   ├─ staging: 30 min TTL
   └─ production: 60 min TTL (human must also approve)
4. Team deploys
5. Team verifies (smoke test, health check)
6. Team releases lock with status: SUCCESS | ROLLED_BACK | PARTIAL_FAILURE
7. Manager agent logs the deployment and notifies relevant teams
```

**Failure Modes:**

| Failure | Detection | Recovery |
|---|---|---|
| Deploy fails mid-way | Team reports PARTIAL_FAILURE | Rollback to previous version, release lock, notify manager |
| Lock holder goes silent | TTL expires | Manager force-releases, marks environment as UNCERTAIN, notify PO |
| Two teams request same env | Second request queued | Manager agent queues with FIFO ordering; urgent flag available |
| Deploy succeeds but breaks other team | Other team's tests fail | Report to manager, manager coordinates hotfix via T03 handoff protocol |

#### Deployment Log

Manager agent maintains a deployment log:

```markdown
| ID | Team | Target | Type | Status | Started | Completed | Rollback? |
|---|---|---|---|---|---|---|---|
| D-001 | hr-devs | hr-platform:staging | code+migration | SUCCESS | 2026-03-14 10:00 | 2026-03-14 10:12 | No |
| D-002 | platform | hr-platform:staging | code-only | ROLLED_BACK | 2026-03-14 11:00 | 2026-03-14 11:08 | Yes |
```

---

### Protocol R3: Database Migration Queue (*FR:Herald*)

#### The Problem

D1 migrations are globally ordered and non-reversible in practice. Two teams creating migrations simultaneously can produce:
- Conflicting migration sequence numbers
- Schema changes that break each other's assumptions
- A migration that passes on dev but fails on staging because another team's migration ran between them

This is the **highest-risk** resource coordination problem because migration conflicts can corrupt data.

#### Migration Sequence Authority

The manager agent owns the migration sequence for each shared database. No team may create or apply a migration to a shared database without coordination. (Per-team dev databases, as recommended by Finn's research, are exempt — teams own their own sequence.)

#### Migration Protocol

```
1. Team identifies need for schema change
2. Team-lead sends Migration Intent to manager agent:

   ## Migration Intent
   - **From:** <team-name>
   - **Database:** <db-name> (e.g., conversations-staging)
   - **Type:** additive (new table/column) | destructive (drop/rename) | modify (alter constraint/index)
   - **Description:** <what changes and why>
   - **Affected tables:** <list>
   - **Reversibility:** reversible (has down migration) | irreversible

3. Manager agent checks:
   ├─ Any pending migrations from other teams? (conflict check)
   ├─ Do affected tables overlap with another team's pending migration?
   ├─ Is the migration type compatible with concurrent work?
   │   (see compatibility matrix below)
   └─ Assign sequence number from Finn's registry model

4. Manager agent responds:
   ├─ APPROVED — sequence number <N>, proceed
   ├─ QUEUED — another migration in progress, estimated wait: <time>
   ├─ CONFLICT — overlaps with <team>'s migration on <table>, coordinate first
   └─ REJECTED — reason (e.g., destructive migration during freeze)

5. Team creates migration file with assigned sequence number
6. Team applies migration to target database, verifies
7. Team reports result to manager agent
8. Manager agent updates migration ledger
```

#### Migration Compatibility Matrix

| Migration A \ Migration B | Additive (different table) | Additive (same table) | Modify | Destructive |
|---|---|---|---|---|
| **Additive (different table)** | PARALLEL | SERIALIZE | SERIALIZE | WAIT |
| **Additive (same table)** | SERIALIZE | SERIALIZE | SERIALIZE | WAIT |
| **Modify** | SERIALIZE | SERIALIZE | SERIALIZE | WAIT |
| **Destructive** | WAIT | WAIT | WAIT | WAIT |

- **PARALLEL:** Both can proceed independently (assigned consecutive sequence numbers)
- **SERIALIZE:** One completes before the other starts (FIFO)
- **WAIT:** Destructive migration gets exclusive access — all others wait

#### Migration Ledger

```markdown
| Seq | Team | Database | Type | Tables | Status | Applied |
|---|---|---|---|---|---|---|
| 042 | hr-devs | conversations-staging | additive | messages | APPLIED | 2026-03-14 |
| 043 | platform | conversations-staging | modify | users | IN_PROGRESS | — |
| 044 | hr-devs | conversations-staging | additive | attachments | QUEUED (behind 043) | — |
```

#### Integration with Finn's Scaling Recommendations

Finn's research proposes per-team dev databases at 5+ teams. The migration queue protocol adapts:

| Teams | Dev databases | Staging/Prod | Migration coordination |
|---|---|---|---|
| 1–3 | Shared dev DB | Shared | Full migration queue for all environments |
| 4–7 | Per-team dev DBs | Shared staging + prod | Queue only for staging and production |
| 8+ | Per-team dev DBs | Staging replica + prod | Dry-run validation on replica, queue for prod |

Per-team dev databases eliminate queuing friction during development. The migration queue remains essential for shared environments where ordering matters.

---

### Protocol R4: API Rate Limit Partitioning (*FR:Herald*)

#### The Problem

All teams share API credentials with global rate limits. With 10 teams, uncoordinated API usage can exhaust shared quotas, blocking all teams.

#### Partitioning Strategy

Building on Finn's three strategies (token-per-team, quota budgeting, request proxy), Herald defines the coordination protocol layer:

##### Tier 1: Scarce APIs (Figma, heavily rate-limited endpoints)

**Centralized allocation.** Manager agent owns a budget and allocates on request.

```markdown
## API Budget Request

- **From:** <team-name>
- **API:** Figma
- **Requests needed:** <count>
- **Tier:** 1 (monthly limit)
- **Purpose:** <why>
```

Manager agent tracks usage against monthly budget. Denies requests that would exhaust the shared budget. This extends the existing Figma protocol (max 2 Tier 1 calls per research task) to a cross-team budget.

##### Tier 2: Moderate APIs (GitHub, Jira, Cloudflare)

**Per-team soft quotas.** Total budget divided evenly across active teams, with a shared reserve.

| API | Total budget | Per-team quota (10 teams) | Shared reserve |
|---|---|---|---|
| GitHub | 5000/hr | 400/hr | 1000/hr |
| Jira | ~100/min | 8/min | 20/min |
| Cloudflare | ~1200/5min | 100/5min | 200/5min |

**Rules:**
1. Teams self-enforce their quota (behavioral, v1)
2. Teams report to manager agent if they anticipate exceeding their quota
3. Manager agent can temporarily reallocate from the shared reserve
4. If a team consistently exceeds quota, manager agent requests they optimize (cache, batch, use Finn pattern)

##### Tier 3: Per-team tokens (scaling path)

At 5+ teams, the organization provisions per-team API tokens (as recommended by Finn's Phase 1). This eliminates the shared-quota problem entirely but requires infrastructure investment (T05 Identity & Credentials).

#### Rate Limit Incident Protocol

When a rate limit is hit:

```
1. Team detects 429 response or rate limit header warning
2. Team-lead immediately notifies manager agent:

   ## Rate Limit Alert
   - **From:** <team-name>
   - **API:** <api-name>
   - **Status:** approaching limit | limit hit | blocked
   - **Reset time:** <when quota resets>
   - **Impact:** <what work is blocked>

3. Manager agent broadcasts to affected teams (T03 Protocol 3, category: incident)
4. All teams reduce non-essential API calls until reset
5. Manager agent reviews quotas and adjusts allocations if needed
```

---

### Protocol R5: Unified Resource Lock Registry (*FR:Herald*)

#### Purpose

All resource locks (merge, deployment, migration) follow the same lifecycle and are tracked in a single registry maintained by the manager agent. This provides a single view of all resource contention across all teams.

#### Lock Registry

```markdown
| Lock ID | Resource | Held by | Granted | TTL | Expires | Status |
|---|---|---|---|---|---|---|
| L-001 | merge:hr-platform:develop | hr-devs | 2026-03-14 10:00 | 15min | 2026-03-14 10:15 | HELD |
| L-002 | deploy:hr-platform:staging | platform | 2026-03-14 10:05 | 30min | 2026-03-14 10:35 | HELD |
| L-003 | migration:conversations-staging | hr-devs | 2026-03-14 09:50 | 60min | 2026-03-14 10:50 | HELD |
| L-004 | merge:hr-platform:develop | qa-team | 2026-03-14 10:10 | — | — | QUEUED |
```

#### Lock Types and TTLs

| Resource type | TTL (default) | Max renewals | Escalation on timeout |
|---|---|---|---|
| `merge:<repo>:<branch>` | 15 min | 1 | Force-release, notify team |
| `deploy:<project>:<env>` | 30 min (shared dev/staging), 60 min (prod) | 1 | Force-release, mark env UNCERTAIN, notify PO |
| `migration:<db>` | 60 min | 2 | Escalate to PO (data risk — never force-release) |
| `api-reserve:<api>` | 30 min | 3 | Auto-release, redistribute budget |

Note on migration locks: Unlike merge and deploy locks, migration locks are **never force-released** on timeout. A half-applied migration can corrupt data. Instead, the manager agent escalates to PO for manual intervention.

#### Lock Contention Metrics

The manager agent tracks contention to identify scaling triggers:

- **Average wait time** per resource type — if merge lock wait exceeds 10 min average, recommend repo splitting or worktree isolation
- **Lock hold duration** vs TTL — if teams consistently use >80% of TTL, increase default
- **Queue depth** — if any resource regularly has 3+ teams waiting, escalate to PO for structural solution (per Finn's scaling recommendations)

---

### Integration with T03 Communication Protocols (*FR:Herald*)

Resource coordination messages use the existing communication infrastructure:

| Resource protocol | T03 integration |
|---|---|
| Lock requests | Sent via Protocol 1 (Handoff), `type: resource-lock` |
| Lock grants/denials | Manager agent response via Protocol 1 ACK |
| Rate limit alerts | Protocol 3 (Broadcast), category: `incident` |
| Migration conflicts | Protocol 1 (Handoff), `type: consult` between affected teams |
| Contention metrics | Protocol 4B (Knowledge Layer — GitHub Issues), `type: finding` |

No new communication primitives are needed. Resource coordination is a **use case** of the communication protocols, not a separate system.

---

### Open Questions — Resource Coordination (*FR:Herald*)

#### Resolved by this design

- ~~Can two teams work on the same repo simultaneously?~~ --> Yes, with branch namespace partitioning (R1) and merge locks. Worktrees (Finn's recommendation) provide structural isolation; merge locks provide coordination at the integration point.
- ~~Who owns the `develop` branch?~~ --> No team owns it. Merge access is governed by the merge lock (R1). Manager agent is the lock authority.
- ~~How do we prevent D1 migration conflicts?~~ --> Migration queue with sequence authority at manager agent (R3), compatible with Finn's migration lock registry model.
- ~~Shared Cloudflare account — how to scope deployments?~~ --> Deployment locks (R2) for shared environments. Per-team dev environments (Finn's recommendation) eliminate locking at dev tier.
- ~~Rate limits — Cloudflare API, GitHub API, Jira API — how to partition?~~ --> Tiered partitioning (R4): centralized for scarce, soft quotas for moderate, per-team tokens for scaling.

#### Still open

1. **Lock infrastructure implementation** — v1 is behavioral (manager agent tracks locks in memory/file). When does it need real infrastructure (Redis, Durable Objects, file locks on shared volume)? Likely when lock request latency matters (>5 teams contending). This intersects with Finn's deployment queue implementation options.

2. **Cross-repo lock scoping** — Protocols assume teams share a single repo. Some teams may span multiple repos (e.g., a platform team managing infra across repos). Lock resource identifiers include repo name but the manager agent's registry would need multi-repo awareness.

3. **Migration rollback** — Protocol R3 treats migrations as irreversible (consistent with D1 practice). Should the framework require down-migrations for additive changes? Trade-off: safety vs development speed. Finn's research did not resolve this.

4. **Lock fairness** — Current FIFO queuing can starve low-priority teams when high-priority teams repeatedly request locks. Should the manager agent implement priority aging (queued requests gain priority over time)?

5. **Offline team recovery** — If a team holds a lock and goes offline (container crash, session end), the TTL handles eventual release. But the team's in-progress work (uncommitted changes, partial migration) may leave the resource in an inconsistent state. Recovery protocol needed beyond "force-release." This connects to T06 lifecycle — shutdown protocol should include lock release as a mandatory step.
