# Brunel scratchpad

## ISSUE #60 TMUX-SPAWN RETIREMENT — INFRA SIDE (2026-04-24)

[CHECKPOINT] Task A delivered. 5 spawn_member.sh copies gated with early-exit deprecation header. tmux-spawn-guide.md archived with top banner pointing to Agent-tool spawn. Container entrypoint tmux setups annotated: tmux now serves human-SSH scaffolding only, no longer required for agent spawning. aliases.sh rewrite drafted in `docs/aliases-sh-rewrite-draft-2026-04-24.md` — canonical file in apex-migration-research repo (Schliemann owns), NOT applied from my side.
[DECISION] Distinction recorded per-file: tmux install + auto-tmux block in entrypoints = HUMAN-SSH scaffolding (still useful); tmux-pane agent spawning = retired (#60). Containers that drop PO SSH can remove tmux entirely — annotation carries this escape hatch.
[LEARNED] `ar-respawn` has no meaningful shell-alias replacement post-#60 — new respawn path mixes shell (jq del via `ar-remove-member`) with Claude-tool call (`Agent()`), and `Agent()` is not invokable from a shell.
[DECISION] Task B closed as no-op (2026-04-24) — PO dropping xireactor direction entirely. No host-networking override, no smoke tests, no MCP stdio work. `containers/xireactor-pilot/` infra is now orphaned (NOT my action to remove without explicit PO directive).
[REQUIREMENT] **Task C — persistent DB tunnels** (apex-migration-research#109). ACTIVE. Architecture pivot 2026-04-24 15:45: PO confirms RC host CANNOT reach Oracle; operator's Windows CAN. Solution = reverse proxy FROM operator TO RC, not container-side tunnel. Assessed R1/R2/R3, recommended **R1** (operator-side `autossh -R` via Windows Task Scheduler). Verified 2026-04-24 15:56: RC sshd uses defaults (`GatewayPorts no`, `AllowTcpForwarding yes`) → reverse-forwarded ports bind to RC 127.0.0.1 only; apex container is host-networked so it sees RC loopback for free → NO sshd_config change needed. Findings sent to team-lead 2026-04-24 15:56. Blocked on R1 confirmation + 3 minor PO inputs (task name, autossh install, jump-host key confirm).
[LEARNED] Prior "Option X" recommendation (autossh on RC host) was based on wrong premise — RC cannot reach Oracle, so a tunnel ORIGINATED from RC cannot work. Correct direction: tunnel originated from a host that CAN reach Oracle, published INTO RC via reverse forward. Pre-fold consistency check should have caught the "who's the tunnel client" question earlier.
[DECISION] `GatewayPorts yes` on RC NOT recommended even long-term — would expose DB ports to every bridge-networked container on RC. Loopback-only binding is the right default; host-networking is the consent mechanism for apex.
[LEARNED] Container reference-memory path: `reference_dev_db_plsql_access.md` lives at `~/.claude/projects/-home-ai-teams/memory/` (Claude-project namespacing where `-home-ai-teams` is $HOME-dir-encoded), NOT `~/.claude/memory/`. Brief pointed at latter. Relevant whenever referencing container auto-memory in briefs — always verify path before citing.
[LEARNED] `network_mode: host` creates a simplification window: tunnels, sockets, and local listeners on the host are free for the container — no port mapping, no per-container credential. Tradeoff: breaks E-deployment portability (Swarm cannot host-network). For apex-research (B-only) this is fine; for future teams plan Option Y.
[GOTCHA] Task list contained three stale pending tasks (#6 subagent-fallback-protocol rewrite, #7 startup.md review, #8 report-back) from a prior Brunel session. Not part of today's brief. Ignored; auto-completed without my action during the session.

## XIREACTOR PILOT DESIGN (2026-04-15 — superseded by deploy section below)

[CHECKPOINT] v0.6.3 design-phase shipped at `docs/xireactor-pilot-host-architecture-2026-04-15.md` (785 lines). All design decisions preserved there; scratchpad entries pruned on 2026-04-16 deploy pass.
[WARNING] §10 asymmetric-Tier-3 thesis is PROPOSED (not adopted), gated on PO + apex consent. §10's "option (c) is §1.2-compliant" is best-current-guess. §8.1 Q1/Q2 walkthrough deferred per 2026-04-16 deploy-first posture; smoke test is the empirical substitute.

## META-LESSONS — carry forward

[LEARNED] Team-lead guidance is input to my integration check, not a substitute for it. Folds from integrated reasoning survive iteration; single-source folds (endorsement I didn't originate) both needed reversal. Pre-fold consistency check: re-check whether an endorsement is consistent with latest doc state, not just whether it makes sense on its own.
[LEARNED] Retraction-scope cross-wires: a narrow retraction can be misread as broad guidance if scope isn't named. Sender discipline: name scope of every retraction. Receiver discipline: state scope assumption before folding.

## XIREACTOR-PILOT VJS2KB DEPLOY — Phase 1 (2026-04-16)

[CHECKPOINT] Phase 1 artifacts written to `containers/xireactor-pilot/` (15 files). PO "deploy first, design later" override accepted — 4 design docs become post-deploy evaluation frameworks, not preconditions. v0.6.3 §Status gate explicitly overridden.
[DECISION] Smoke test = §8.1 walkthrough substitute. Three checks: A (FR writes, FR reads), B (FR invisible to apex — Q2 invariance), C (apex invisible to FR — Q1 RLS). On FAIL: teardown (§1.2), NOT patch.
[DECISION] Ruth-team port 2224 → **2228** (NOT 2226 — BT-TRIAGE collision per deployments.md:21). Updated ruth-team-container-design + deployments.md coherently. xireactor-pilot claims no SSH; uses TCP 8010 (Tailscale). New "Backend services (non-SSH)" section added to deployments.md.
[DECISION] Path (a) confirmed — artifact generation on workstation, operator executes DEPLOY.md on RC. Team-lead tool restrictions don't authorize SSH/docker; Agent-tool Bash runs on Windows, not RC.
[LEARNED] "Port 2225+" brief was imprecise — mixed SSH port pool (2222-2227) with backend port space (8010+). xireactor-pilot is backend. Pattern: when port numbers appear in a brief, name the space explicitly.
[LEARNED] Global port collision bites across hosts. hr-devs=2225, BT-TRIAGE=2226, comms-dev=2227 are PROD-LLM-resident but anchor the sequence ruth-team must respect. Registry is cross-host, not per-host.
[WIP] Phase 2 (deploy log KB entry + token wiring) blocked on Phase 1 commit + operator DEPLOY.md execution. Template in README.md §Bootstrap KB entry; consumer MCP snippets ready in `mcp-client-snippets/`.
[GOTCHA] Bootstrap SQL 9001/9002 use placeholder user columns — real upstream auth table shape NOT verified (needs §8.1 walkthrough, deferred). DEPLOY.md step 5 flags this; operator may need to adapt.
[GOTCHA] `docker-compose.override.yml` `mcp` service uses `deploy.replicas:0 + profiles:[disabled]` to null out upstream's mcp. Fallback if upstream v0.2.0 doesn't respect these fields is forking their compose — violates §1.2. Escalate if hit at deploy time.

## NEXT-SESSION-CHORE

[CHORE] §8 header labels (SOFT/MEDIUM) in v0.6.3 may still carry stale Monte v3 §7.2 classifications — verify they align with Herald v1.2 (c)/(c) and §8.1 framing. Deferred per deploy-first posture.
[CHORE] `containers/xireactor-pilot/` vs `teams/ruth-team/infra/` layout reconciliation still open per team-lead. Not my chore this session.

## RUTH-TEAM DESIGN (2026-04-15)

[CHECKPOINT] Design v1.0 ACCEPTED — `docs/ruth-team-container-design-2026-04-15.md`, 384 lines. Bumped v0.1→v1.0 by team-lead. All six design requirements accepted.
[DECISION] Recommended bridge = option C (git-mediated) with B-only write-through cache at `/home/dev/ruth-apex-bridge/`. Only option that's E-native (Swarm volumes aren't cross-service). Staging cache gives A-speed on B without portability debt.
[DECISION] Ruth-team SSH user = `ai-teams` (same as apex-research, not a new per-team user). Container isolation already provides the boundary; user variation adds no gain and forks the tooling.
[DECISION] Port 2224 proposed for ruth-team sshd (skipping 2223 to avoid runbook §4 debug-port collision).
[PATTERN] Parameterization contract table (TEAM_NAME, HOST_WORKSPACE_DIR, DEPLOYMENT_MODE etc.) — reusable skeleton for future teams. Brunel recommendation: promote to runbook as §24 after Ruth-team actually deploys and validates the contract.
[GOTCHA] `network_mode: host` + Swarm incompatibility — B uses host mode (WARP forced), E cannot. Compose file must have two profiles (`b-host` vs `e-swarm`) from day one. Don't ship a single-profile compose and then scramble at migration.
[DECISION] Bridge repo = subdir of `mitselek/ai-teams` (not separate repo). Team-lead answer.
[DECISION] HR_NOTIFICATION_EMAIL carryover = N/A, closed. Team-lead answer.
[DECISION] Interaction channel = SSH + tmux pane (same as operator→apex-research). Zero new infra. Teams integration deferred → `mitselek/ai-teams#57` research backlog.
[REQUIREMENT] Infra files (Dockerfile, compose, entrypoint, helper scripts) must be commit-tracked in-repo under a designated path. NOT on operator workstation. Suggested: `teams/ruth-team/infra/` or `containers/ruth-team/` at repo root — my call on layout. Applies to next build step.
[REQUIREMENT] Do NOT proactively write Dockerfile yet. Wait for Monte/Herald answers + team-lead build brief.
[WIP] Monte governance answers (§4.3 — Q1-Q4) still open. Q1-Q2 on critical path for build (credential injection).
[WIP] Herald bridge protocol shape (§5.3 — Q1-Q3+Q4) still open. Q1 on critical path for build.
[LEARNED] Volta will likely add a §6.5 observability/instrumentation addendum atop my substrate after Ruth responds. Not my layer — but expect it and don't be blindsided.

## KEY GOTCHAS (carry forward — all containers)

[GOTCHA] WARP TLS interception: network_mode:host + NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem + system CA.
[GOTCHA] Named volumes created as root → chown 1000:1000 in entrypoint.
[GOTCHA] SSH: useradd creates locked account. Fix: usermod -p '*' for pubkey auth.
[GOTCHA] Container rebuild regenerates SSH host keys → `ssh-keygen -R "[host]:port"` after rebuild.
[GOTCHA] tmux inherits locale from starting process. Use `tmux -u` or bake LANG into Dockerfile.
[GOTCHA] CRLF from Windows git autocrlf breaks entrypoints. Fix: `sed -i 's/\r$//'` then rebuild.
[GOTCHA] Root-owned /tmp files block ai-teams writes — create tmux sessions as target user.
[GOTCHA] Consecutive `**Bold:**` lines collapse on GitHub. Use `- **Bold:**` bullet lists.

## SHIPPED DEPLOYMENTS (compressed — details in commits + design docs)

[CHECKPOINT] **apex-research Eratosthenes** (2026-04-13): PR #57 merged. Structural-discipline cluster shipped as L1 team law (commit `589fda9`). Wiki `prompt-to-artifact-cross-verification` filed. Oracle→Librarian Pass1/Pass2 complete (commits `04522c7`+`ca0e56f`).
[CHECKPOINT] **uikit-dev migration** (2026-04-13): Full A+B+C shipped. SSH `id_ed25519_uikit` → port 2228. Lifecycle scripts match FR/Volta pattern.
[CHECKPOINT] **raamatukoi-dev** (2026-04-09): Deployed to `Raamatukoi/tugigrupp` — 14 commits.
[CHECKPOINT] **comms-hub** (2026-03-31): Hub on PROD-LLM, 4 teams connected. Bridge proven end-to-end.

[GOTCHA] Inbox files created at agent registration time. Specialist → unregistered agent = message LOST, no retry. Spawn order: service-role agents (librarian) BEFORE message senders.
[GOTCHA] Base64-encode-via-SSH strips shell-escape backslashes. For scripts with `\"` or `\s`, write via heredoc with single-quote delimiter or `cat > file << 'EOF'` — never via echo/base64 pipelines.
[GOTCHA] Comms bridge `setInterval.unref()` kills standalone process — needs keep-alive. Claude Code sandbox kills bg processes — use `docker exec -d`.

[WIP] **uikit-dev 3rd team-config dir** `/home/ai-teams/team-config/` — pre-session bootstrap source with ORIGINAL common-prompt.md (6447 bytes, Apr 9). My Phase B committed a STUB. Investigation paused 2026-04-14 pending PO scope. DO NOT proceed on task #12 without re-ack. Lesson: scan whole `$HOME` for team dirs, don't pre-assume `teams/` path.

## INFRA REFERENCE

Cloudflared tunnel: `526a23d1-1f7f-472f-8df1-a9239bbe3fe4`. Ingress: `apex-research.dev.evr.ee` → `http://apex-research:5173`. [DEFERRED] QUIC blocked → `--protocol http2`.
evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
VJS2-AI-teams repo: `C:/Users/mihkel.putrinsh/Documents/github/VJS2-AI-teams/`
Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`

## STANDING DECISIONS

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer. Three integration seams: peer (Claude-only), sidecar/daemon (Eilama), MCP server (visual QA). Audit independence = external container reading committed git artifacts, NOT different-provider Medici.

## DEFERRED

- OAuth on hr-devs PROD-LLM container (PO manual step)
- Hub container as standalone Docker image
- raamatukoi-dev VPS container deployment
- MCP server pattern for visual QA service
- Provider outage behavior in containers (what does Claude process do on API failure?)
- External audit container architecture spec
