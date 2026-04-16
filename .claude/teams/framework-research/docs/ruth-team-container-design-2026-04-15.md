# Ruth-Team Container Design

**Author:** (*FR:Brunel*)
**Date:** 2026-04-15
**Version:** v1.0 — accepted by team-lead 2026-04-15. Team-lead answers to §7 inlined.
**Status:** Accepted design. Deployment target (B): `dev@100.96.54.170` alongside apex-research. Future target (E): Cloudflare Tunnel / hello-world-container pattern.
**Scope:** Infrastructure only. Nothing in this doc depends on or leaks the principal's identity beyond the codename `ruth-team`.

---

## Overview

Ruth-team is the framework's first "team-for-a-human" deployment — an operational AI team serving a single human principal rather than a project or codebase. Near-term, it co-locates with apex-research on the existing dev host, reusing the proven container pattern (`evr-ai-base:latest` + named volumes + tmux-over-SSH). Future migration to the E-pattern (Cloudflare Tunnel + GitHub-pushed Docker Swarm from `hello-world-container` PoC) must be a **config swap, not a redesign**. This document specifies the container boundary, volume layout, bridge interface to apex-research, and a per-choice E-migration delta. The roster is left abstract: the container assumes N agents declared at bootstrap via `roster.json`, with no hard-coded names in Dockerfile, compose, or entrypoint.

The container's distinguishing feature is a **bidirectional bridge to apex-research** — Ruth-team's outbound work ingests apex-research artifacts (migration cluster specs, readiness reports), and Ruth-team's feedback/priorities flow back into apex-research work. This bridge interface is sketched in §5; the final protocol choice is Herald's call.

---

## 1. Portability-First Design

**Principle:** Every path, port, identifier, or host-specific value is parameterized via environment variable or build arg. The Dockerfile and compose file contain zero references to `ruth-team` as a string literal — only `${TEAM_NAME}` references. B→E migration is a `.env` file swap plus a deployment-mode toggle, never a Dockerfile or compose-structure edit.

### 1.1 Parameterization contract

The container reads the following from a `.env` file at compose-up time. Defaults are provided only where a sensible universal value exists.

| Variable | Purpose | Default | B value | E value |
|---|---|---|---|---|
| `TEAM_NAME` | Team short identifier (lowercase) | — (required) | `ruth-team` | `ruth-team` |
| `TEAM_REPO_URL` | Git URL for team config repo | — (required) | `git@github.com:mitselek/ai-teams.git` | same |
| `TEAM_REPO_BRANCH` | Branch to check out for team config | `main` | `main` | same |
| `TEAM_CONFIG_PATH` | Path within repo to team config dir | `.claude/teams/${TEAM_NAME}` | same | same |
| `SSH_PORT` | Container sshd port | — (required) | `2228` | N/A (SSH via Cloudflare Access) |
| `CLAUDE_ENV_ID` | Statusline badge identifier | `${TEAM_NAME^^}` | `RUTH` | same |
| `HOST_WORKSPACE_DIR` | Host path bind-mounted into container workspace | — (required on B) | `/home/dev/ruth-team-workspace` | N/A (Docker Swarm volume) |
| `CLAUDE_NAMED_VOLUME` | Docker named volume for `~/.claude/` | `${TEAM_NAME}_claude` | `ruth-team_claude` | Swarm volume |
| `WARP_CA_PATH` | Host path to WARP CA cert | `/usr/local/share/ca-certificates/managed-warp.pem` | same | `""` (no WARP on E) |
| `BRIDGE_VOLUME` | Shared volume/mount for apex-research bridge (see §5) | — | `/home/dev/ruth-apex-bridge` | Cloudflare R2 bucket or KV |
| `DEPLOYMENT_MODE` | `B` (local-host) or `E` (tunnel) | `B` | `B` | `E` |
| `ANTHROPIC_CREDS_SOURCE` | How the Claude OAuth creds are injected | `bind` \| `secret` \| `swarm-secret` | `bind` | `swarm-secret` |

**Non-portable choices called out:**

| Choice | Why non-portable | Mitigation |
|---|---|---|
| `network_mode: host` | Required for WARP + host DNS on dev host (§1 of runbook). Swarm does not allow it on routing-mesh services. | DEPLOYMENT_MODE gate: compose file has two service definitions guarded by profile (`b-host` vs `e-swarm`). Both share the same image and entrypoint. |
| WARP CA bind-mount | Host-specific (corporate-only) | Absent on E (host is a generic cloud node). Compose uses a Docker secret OR empty string; entrypoint is a no-op when `WARP_CA_PATH=""`. |
| Host port 2228 for SSH | Conflicts if two teams choose same port on the same host | Port is a per-team parameter; see §2 for co-location port table. Not relevant on E (Cloudflare Access terminates auth). |
| SSH user name `ai-teams` | Historical — all teams use the same user | Keep it. Cross-team isolation is via separate containers, not separate host users. Documented as a convention, not an invariant. |
| Docker named volume for `~/.claude/` | Not usable on Swarm without a volume driver | Swarm uses a named volume too, but with an explicit driver (`local` or cloud-backed). Compose file parameterizes the volume driver. |

**[E-migrate:** all six non-portable items collapse to a single `DEPLOYMENT_MODE=E` switch that selects the `e-swarm` compose profile and the swarm-native equivalents. The image and entrypoint do not change.**]**

### 1.2 Declarative over imperative

Where a design choice could be either a shell script step or a compose declaration, prefer the declaration. Example:

- **Entrypoint (imperative):** `chmod +x /home/ai-teams/bin/*`  — stays in entrypoint because it's state-fixup after volume mount.
- **Compose (declarative):** service dependencies, health checks, restart policy — all in `docker-compose.yml`, not wrapped in `start-team.sh`.

Rationale: Swarm's deployment model is declarative-only (no `exec` hook on service create). Anything that lives in a shell script today needs a compose equivalent tomorrow; lean on declarative now to reduce the delta.

---

## 2. Co-Location with apex-research

Ruth-team runs on the **same Docker host** as apex-research (`dev@100.96.54.170`), under the **same host user** (`dev`), driven by the **same Docker daemon**. This is a deliberate shared-substrate choice for B. E will split them onto separate swarm nodes.

### 2.1 What is shared

| Resource | Shared with apex-research | Risk |
|---|---|---|
| Docker host | Yes | Kernel + Docker daemon failure affects both. Acceptable on B (dev-only). |
| Docker image `evr-ai-base:latest` | Yes | Rebuild cadence: apex-research's image churn. Mitigation: pin SHA in ruth-team compose. |
| WARP CA cert path | Yes | Cert rotation affects both simultaneously. Acceptable — both teams need the same CA. |
| Host SSH key for `dev@100.96.54.170` | Yes | PO uses one host-level key, then container-specific keys for each team. No change. |
| Host DNS resolver config (`/etc/docker/daemon.json`) | Yes | Already configured for apex-research per runbook §1. No action. |
| Port pool on host (2222-2299) | Yes | Ruth-team claims a distinct port. See §2.3. |

### 2.2 What is strictly separate

| Resource | Isolation mechanism | Enforcement |
|---|---|---|
| Container filesystem | Separate container instance | Docker default |
| `~/.claude/` (auth, runtime team dir, scratchpads) | Separate named volume (`ruth-team_claude` ≠ `apex-research_claude`) | Named volume per team; no cross-mount |
| tmux session | Separate session name per team (`ruth` vs `apex`) inside separate containers | Container isolation + §15 of runbook (session name convention) |
| Team config repo clone | Separate bind-mount path (`$HOST_WORKSPACE_DIR`) | Bind mount is team-specific |
| SSH keypair for PO → container | Separate key (`~/.ssh/id_ed25519_ruth` ≠ `~/.ssh/id_ed25519_apex`) | Documented as convention; enforced by `authorized_keys` in each container |
| Container SSH user — **decision needed** | Same user name (`ai-teams`) inside separate containers — NOT two host users | See §2.4 |
| API credentials (`.credentials.json`) | Separate file inside separate named volume | Docker volume separation |
| Inbox state (`.claude/teams/<team>/inboxes/`) | Separate team config repos (or separate paths within same repo) | `TEAM_CONFIG_PATH` parameter |

**Zero state bleed guarantee:** Because every per-team resource either lives in a container-local volume (`~/.claude/`), a team-scoped bind mount (`$HOST_WORKSPACE_DIR`), or a team-scoped git path (`$TEAM_CONFIG_PATH`), there is no write path from ruth-team to apex-research's state. The bridge (§5) is the single deliberate exception and is read-only from one side.

### 2.3 Port allocation

Host port table for the dev server:

| Team | SSH port | Dashboard (optional) | Source of truth |
|---|---|---|---|
| apex-research | 2222 | 5173 | existing deployment |
| ruth-team | 2228 (proposed) | N/A (no dashboard on B) | this doc |
| *reserved for next team* | 2229+ | — | — |

**Port history:** original v0.1 proposed 2224; `entu-research` subsequently claimed 2224 per `deployments.md`, and 2225–2227 are held by PROD-LLM containers (`hr-devs`, `BT-TRIAGE`, `comms-dev`) in the cross-host registry. Moved to **2228** (next free) at 2026-04-16 per team-lead directive. Skipping 2223 also avoided historical `sshd -p 2223` debug usage from runbook §4 (now permanently held by `polyphony-dev`).

**[E-migrate:** SSH ports become irrelevant on E. Cloudflare Access fronts each service via hostname (`ruth.dev.evr.ee`, `apex.dev.evr.ee`) and the containers expose their management interface on an internal-only port unreachable from the public internet. Port pool collapses to the per-container internal port (e.g., 22 for all teams — no collision because each has a distinct swarm service name).**]**

### 2.4 SSH user — same name across teams

**Decision:** Use `ai-teams` as the in-container SSH user for ruth-team, identical to apex-research and all other existing teams. **Not** a separate user like `ruth-ops`.

**Rationale:**

- The in-container user name is not a security boundary — container isolation is. Two `ai-teams` users in two separate containers have no shared filesystem, no shared process tree, no shared network namespace (on E) or shared PID namespace (on B).
- All existing scripts (`start-team.sh`, `spawn_member.sh`, `apply-layout.sh`) assume `/home/ai-teams/...` — changing the user name would fork the tooling for no isolation gain.
- Host user on B is `dev` (apex-research convention). The PO SSH's in as `ai-teams@100.96.54.170:2228` which is routed to the ruth-team container's sshd.

**Non-goal:** Containerization does not protect against a malicious operator; it protects against accidental state bleed. Both goals are satisfied by container separation without user-name variation.

---

## 3. Roster-Agnostic Skeleton

The container does not know how many agents the team has, what they are called, or what models they run. All of that is declared in `$TEAM_CONFIG_PATH/roster.json` at bootstrap time.

### 3.1 What lives in the image

- Base OS, Node 22, Claude Code CLI, `gh`, `gosu`, `tmux`, `sshd`, `jq`, `git`
- `entrypoint.sh` — parameterized by env vars, no team-specific literals
- `bin/spawn_member.sh`, `bin/apply-layout.sh`, `bin/start-team.sh`, `bin/reflow.sh` — generic, parameterized by `$TEAM_NAME` and `$TMUX_SESSION`
- WARP CA handling logic (no-op if `WARP_CA_PATH=""`)

### 3.2 What lives in the team config repo (NOT in the image)

- `roster.json` — list of agents with name, model, role
- `common-prompt.md`
- `prompts/<name>.md` per agent
- `memory/<name>.md` (scratchpads)
- `inboxes/*.json`
- Lifecycle scripts (`restore-inboxes.sh`, `persist-inboxes.sh`) — team-owned, not image-owned
- Team-specific layout script if the default `apply-layout.sh` needs customization

### 3.3 How the entrypoint discovers the roster

```bash
# Pseudocode for entrypoint
ROSTER_FILE="/home/ai-teams/workspace/${TEAM_CONFIG_PATH}/roster.json"
if [ ! -f "$ROSTER_FILE" ]; then
    echo "FATAL: roster.json not found at $ROSTER_FILE" >&2
    exit 1
fi

# Parse agent count and names — used by apply-layout.sh for pane creation
AGENT_COUNT=$(jq '.members | length' "$ROSTER_FILE")
AGENT_NAMES=$(jq -r '.members[].name' "$ROSTER_FILE")

# Layout script consumes the roster and creates N panes
bash /home/ai-teams/bin/apply-layout.sh "$TMUX_SESSION" "$ROSTER_FILE"
```

**Dockerfile has zero references to agent names.** All agent-specific logic is in the team config repo or the roster-consuming scripts.

### 3.4 Scaling properties

- N=1: lone-wolf team (team-lead only). Layout = single pane.
- N=3-6: typical operational team. Layout = grid or L-shape.
- N=7+: large team. Layout = scrollable grid. No code change.

`apply-layout.sh` reads N from the roster and chooses a layout strategy. The image is identical in all cases.

**[E-migrate:** roster-agnostic already. The roster lives in git, not in the container image. On E, the team config repo is cloned into a swarm-mounted volume at boot, same as on B. The entrypoint logic is unchanged.**]**

---

## 4. Anthropic Account Ownership

**Scope:** This section documents where the credential lives, how it is mounted, and how rotation works. **It does not decide governance policy** — that is Monte's call (see Open Questions).

### 4.1 B deployment — OAuth via `.credentials.json`

Apex-research uses the framework-research account's OAuth credentials (`~/.claude/.credentials.json` on the operator machine, copied into the container's named volume per runbook §8). Ruth-team on B uses the **same account**.

**Mount mechanism:**

```bash
# Operator runs ONCE after first `docker compose up`:
docker cp ~/.claude/.credentials.json ruth-team:/home/ai-teams/.claude/.credentials.json
docker exec ruth-team chown 1000:1000 /home/ai-teams/.claude/.credentials.json
```

The file is then persisted in the `ruth-team_claude` named volume. It survives container restarts but not `docker compose down -v`.

**Rotation path:**

- If the operator account's token is rotated (re-login on operator machine), the new `.credentials.json` is copied into the container via the same `docker cp` command.
- No in-container rotation. No env var. No secret manager.

**Risk:** Both apex-research and ruth-team share the same Anthropic account. If the account is suspended or rate-limited, both teams go down simultaneously. This is known and accepted for B.

### 4.2 E deployment — Docker Swarm secret

On E, the credential is injected as a Docker Swarm secret:

```yaml
# docker-compose.yml (e-swarm profile)
services:
  ruth-team:
    secrets:
      - anthropic_credentials
secrets:
  anthropic_credentials:
    external: true
    name: anthropic_credentials_v1
```

The entrypoint reads `/run/secrets/anthropic_credentials` and writes it to `~/.claude/.credentials.json` on first boot. Rotation = `docker secret create anthropic_credentials_v2 - < new-creds.json && docker service update --secret-rm anthropic_credentials_v1 --secret-add source=anthropic_credentials_v2,target=anthropic_credentials ruth-team`.

### 4.3 Governance questions (OPEN — for Monte)

**[OPEN for Monte]** Should ruth-team use the **same Anthropic account** as apex-research/framework-research (shared blast radius, single billing line, simple credential model), or a **dedicated account** per human principal (per-principal quota, independent revocation, separate audit trail, more operational overhead)?

**[OPEN for Monte]** If dedicated accounts per principal: who owns the account — the principal, the framework team, or the operator? What happens to the account if the principal leaves the organization?

**[OPEN for Monte]** Ruth-team has bidirectional flow with apex-research (§5). If the two teams run on separate accounts, does the bridge flow cost tokens on both sides, and do we need to attribute usage?

Brunel recommendation: **start with shared account on B** (zero new governance surface), **design E for per-principal account** (one secret per team means the migration adds one secret, not a re-architecture). Decision point is before E migration, not now.

---

## 5. Bridge to apex-research

This is the defining feature of ruth-team. Apex-research produces migration artifacts (cluster specs, readiness reports, ADRs). Ruth-team must ingest these AND feed priorities/feedback back. The bridge is bidirectional but asymmetric: apex→ruth is artifact flow, ruth→apex is signal flow.

### 5.1 Three options

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **A. Shared host volume** | `/home/dev/ruth-apex-bridge` bind-mounted into both containers. ruth-team reads apex-research's `docs/` and writes a `feedback/` subdir apex-research reads. | Simplest, zero protocol, instant latency. | Tight coupling to host filesystem. Hard to migrate to E (swarm volumes not cross-service by default). Race conditions on simultaneous write. No audit trail. |
| **B. Cross-team SendMessage** | ruth-team's team-lead sends messages to apex-research's team-lead via a tmux-direct or comms-hub mechanism. | Uses existing framework comms. Auditable via inbox files. Works across E (hub is already proven on comms-dev). | Requires comms-hub onboarding for both teams. Higher latency. Message-shaped, not artifact-shaped. Doesn't transport large files well. |
| **C. Git-mediated** | apex-research commits artifacts to a shared git path (`hr-platform-mirror` or similar repo). ruth-team pulls on a cadence. Ruth-team commits feedback to a `ruth-team/feedback/` subdir in the same repo. | Fully auditable (git history). Naturally cross-host on E. Survives container restarts. Already the SOT model for team configs. | Latency measured in pull cycles, not seconds. Commit churn on high-frequency flow. Merge conflicts if both sides write the same path. |

### 5.2 Recommendation: **C (git-mediated) with a staging twist**

Git-mediated is the only option that is E-native (Cloudflare Tunnel doesn't expose cross-service volumes; swarm volumes are per-service by default). It also gives us the auditability the team design principle demands.

The **staging twist** addresses the latency concern: on B, add a shared host volume (option A) as a write-through cache, then commit to git on a cadence. On E, the cache collapses to a direct git push. This lets us get A's speed on B without paying for A's portability debt on E.

**Concrete shape (B):**

```
Host:
  /home/dev/ruth-apex-bridge/
    apex-to-ruth/          <- read-only for ruth-team, written by apex-research
      cluster-specs/
      readiness-reports/
      INDEX.md             <- manifest updated by apex on commit
    ruth-to-apex/          <- write-only for ruth-team, read by apex-research
      priorities/
      feedback/
      signals/
```

Both containers bind-mount `/home/dev/ruth-apex-bridge` at `/home/ai-teams/bridge/`. A cron or file-watcher on the dev host commits changes to a designated git repo (`Eesti-Raudtee/ruth-apex-bridge` or a subdir of `mitselek-ai-teams`) at N-minute cadence.

**Concrete shape (E):** The shared host volume disappears. Each container has its own git checkout of the bridge repo and pulls/pushes directly. Commit cadence increases to match the workflow.

### 5.3 Deferred to Herald

**[OPEN for Herald]** Protocol shape: what is the manifest format for `apex-to-ruth/INDEX.md`? What frontmatter does each artifact need to be ruth-team-consumable? Is there a typed schema (like `t09-protocols.ts`) for bridge messages? Recommend a Protocol A/B-style contract so classification is consistent across the bridge.

**[OPEN for Herald]** Conflict resolution: if ruth-team and apex-research both write to the same bridge path (shouldn't happen per the one-direction-per-subdir convention above, but edge cases exist), what's the tiebreaker? Git merge? Last-writer-wins with audit log?

**[OPEN for Herald]** Backpressure: if apex-research produces 100 ADRs/hour and ruth-team can consume 5/hour, is there a throttle, a priority queue, or does ruth-team just fall behind?

Brunel recommendation on bridge: **git-mediated (C) with a write-through cache on B**. Final say on protocol shape is Herald's.

**[E-migrate:** cache layer is removed; both containers commit directly to the bridge repo. Commit cadence becomes per-event rather than per-minute. No re-architecture — same repo, same directory layout, same artifact shapes.**]**

---

## 6. E-Migration Annotations Summary

Each design choice in §1-§5 carries a `[E-migrate: ...]` note. Summary table:

| Section | B choice | E delta | Complexity |
|---|---|---|---|
| §1.1 Parameterization | .env file with B values | .env file with E values | Trivial — file swap |
| §1.1 `network_mode: host` | Required on B (WARP + DNS) | Disallowed on E — use bridge network | Compose profile switch (already sketched) |
| §1.1 `WARP_CA_PATH` | `/usr/local/share/ca-certificates/managed-warp.pem` | `""` (no WARP on E) | Entrypoint no-op branch |
| §1.1 SSH port | Host port 2228 | Cloudflare Access hostname | Drop SSH from compose; add tunnel config |
| §1.1 Named volume for `~/.claude/` | Local driver | Local or cloud-backed driver | Compose driver field |
| §2 Co-location | Same host as apex | Separate swarm services, possibly separate nodes | Swarm service declaration |
| §2.3 Port allocation | Per-team pool (2222-2299) | Per-team hostname (`ruth.dev.evr.ee`) | Cloudflare config, not compose |
| §2.4 SSH user | `ai-teams` | Same — still `ai-teams` internally | No change |
| §3 Roster-agnostic | git clone into workspace at boot | git clone into swarm volume at boot | No change |
| §4 Credentials | `docker cp` OAuth file into named volume | Docker Swarm secret | Compose `secrets:` section + entrypoint fetch |
| §5 Bridge | Shared host volume + cron-commit | Direct git push/pull | Remove cache layer, increase cadence |
| §13/§14 Statusline + permissions | Same — no change | Same — no change | No change |

**Migration cost estimate:** Assuming all six non-portable items are parameterized and the compose file has both profiles already sketched, the B→E migration is:

1. Set `DEPLOYMENT_MODE=E` in `.env`
2. Swap other env var values (6 lines)
3. Move Anthropic OAuth → Docker Swarm secret (one `docker secret create`)
4. Point the bridge repo config at direct-push mode instead of cache-mode
5. `docker stack deploy` on the target swarm

**No image rebuild.** No Dockerfile edit. No entrypoint edit. No team config change. The image built for B is the image deployed on E.

---

## 7. Open Questions

### For Monte (Governance)

1. Shared Anthropic account vs per-principal account for ruth-team (§4.3)?
2. Account ownership when principal leaves the organization (§4.3)?
3. Token attribution across bridge flow if accounts differ (§4.3)?
4. Provider outage emergency protocol — does ruth-team have different SLA expectations than apex-research because a single human is directly affected? (Tied to DISCUSSION #56 carryover.)

### For Herald (Protocols)

1. Bridge protocol shape — manifest format, frontmatter schema, typed contract (§5.3)?
2. Bridge conflict resolution (§5.3)?
3. Bridge backpressure mechanism (§5.3)?
4. Does ruth-team comms-hub onboarding happen now (for future flexibility) or only when git-mediated bridge hits a wall?

### For Celes (Roster — non-blocking)

1. Will ruth-team have a librarian-equivalent role (knowledge curation)? If so, the container doesn't change, but `apply-layout.sh`'s grid strategy may want a dedicated knowledge-pane. Flag for layout design when roster exists.
2. Does ruth-team have a team-lead in the framework-research sense, or a different coordinator pattern? Again, container-agnostic, but the spawn order in `start-team.sh` assumes team-lead spawns first.

### For team-lead (framework-research) — **ANSWERED 2026-04-15**

1. **Bridge repo location:** subdir of `mitselek/ai-teams` — not a separate repo. Rationale: same access model, same auditability, keeps team config + bridge artifacts + infra co-located. If external collaborators enter the picture later, reassess then. **Additional constraint:** when Brunel writes the actual Dockerfile, compose files, entrypoint, and other infra artifacts, they ALSO live in-repo under a designated path (not scattered on the operator's workstation). Container infra = first-class tracked artifact, same principle as the design doc itself.
2. **`HR_NOTIFICATION_EMAIL` carryover:** not applicable — that was an hr-platform production config, not a framework-research pattern. Closed.

### Team-lead DECISION — interaction channel for ruth-team (2026-04-15)

Near-term, Ruth's interaction with ruth-team is via **SSH + tmux pane**, same substrate as the operator uses for apex-research. Rationale:
- Zero new infrastructure (container already has sshd + tmux)
- **Transparency to principal:** she sees the exact messages agents exchange, not a filtered/summarized view — matches the "team-for-a-human" requirement that the principal understands what her team is doing
- Conversations are already persisted in tmux scrollback + inbox files — observability layer gets this for free
- SSH is an unblocked path (no Teams/Graph procurement dependency)

Teams integration research is parked as a separate task (see Open Questions → Research Backlog below) — to be explored once Ruth's deployment is running and we have enough signal to judge whether a richer channel is worth the procurement cost.

### Research Backlog (new — carried to future sessions)

- **Teams integration** — MS Graph API with delegated permissions vs webhooks vs email fallback. Research issue filed on `mitselek/ai-teams`. Related to: `/routines` research (both Anthropic-ecosystem + org integration questions).

---

## Appendix A: E-Migration Delta Summary

If B is deployed and running, migrating to E requires these files to change:

| File | B state | E state | Delta |
|---|---|---|---|
| `.env` | B values | E values | Full swap (12 lines) |
| `docker-compose.yml` | Profile `b-host` active | Profile `e-swarm` active | Profile toggle |
| `docker-compose.override.yml` (optional) | Present for host-specific dev | Absent | Delete |
| `Dockerfile` | Unchanged | Unchanged | — |
| `entrypoint.sh` | Unchanged | Unchanged | — |
| `bin/spawn_member.sh`, `bin/apply-layout.sh`, etc. | Unchanged | Unchanged | — |
| Team config repo | Unchanged | Unchanged | — |
| Anthropic creds | `docker cp` to named volume | `docker secret create` | Operator command, not file |
| Bridge config | Host volume + cron | Direct git push/pull | `.env` toggle |
| Host SSH key | PO's local key | Cloudflare Access session | Operator auth flow change, no config file |

**Files changed: 2-3** (`.env`, maybe override file). **Operator commands: 2** (creds injection, stack deploy). **Image rebuild: 0.**

---

## Appendix B: Out of Scope — Explicit Non-Decisions

This design does NOT decide:

- Agent count, names, or models in ruth-team (Celes, blocked on Ruth's response)
- Teams/email integration (downstream, TBD after Ruth answers Q3)
- Ruth's interaction UX — SSH-tmux? Web dashboard? Teams chat? (Not infrastructure layer)
- Account governance policy (Monte's call, see §4.3)
- Bridge protocol shape (Herald's call, see §5.3)
- Whether ruth-team spawns apex-research work items or reacts to them (workflow, not infrastructure)
- Deployment timing (team-lead + PO decision)

This design DOES decide:

- Container image reuse (`evr-ai-base:latest`)
- Parameterization contract (§1.1)
- Co-location boundary with apex-research (§2)
- Roster-agnostic entrypoint behavior (§3)
- Bridge mechanism recommendation (C with staging, §5.2)
- E-migration delta (Appendix A)

---

(*FR:Brunel*) — Design v0.1, 2026-04-15. Open for review by team-lead, Monte (§4), Herald (§5), Celes (§7). Not yet deployment-ready — requires Monte/Herald answers on credentials and bridge protocol before build.
