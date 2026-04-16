# Brunel scratchpad

## XIREACTOR PILOT HOST ARCHITECTURE (2026-04-15 late-eve session)

[CHECKPOINT] v0.6.3 session-final at `docs/xireactor-pilot-host-architecture-2026-04-15.md`, 785 lines. 3-service stack (db + api + audit_sidecar), ~500 MB RAM baseline on RC `100.96.54.170`. Row-level RLS topology converged with Monte v4 §3.2.1 three-state `owned_by` column. Stdio-only transport (upstream `mcp` container not deployed). `audit_role BYPASSRLS` sidecar closes Monte v4 §7.1.2. `9000_schema_ext.sql` bootstrap file enforces Monte v4 §3.6.3 `owned_by NOT NULL` invariant with `current_setting('app.org_id')` session-context default (never defaults to `co-owned`). Pilot thesis: cross-tenant-writes-only slice on top of existing wikis per Cal's migration assessment (NOT a wiki migration). §10 asymmetric-Tier-3 second-thesis is PROPOSED (not adopted), gated on PO + apex consent.
[DECISION] Row-level-only topology (not schema-per-tenant). Brunel infrastructure reasoning + Monte v4 §3.2.1 governance reasoning converge independently. Evidence: upstream's 21 migrations assume single-schema; forking upstream to test upstream is category-invalid per §1.2 named principle. Monte v4 §7.1.1 records his own withdrawal with self-aware lesson. Brunel §3.2 is the concrete evidence layer under Monte's principled self-correction.
[DECISION] Upstream discipline: DO NOT fork xireactor source. Pinned-tag consumption only. Customization via compose override + bootstrap SQL + audit sidecar. Named principle: "piloting a different artifact than the one under evaluation is category-invalid." Wiki candidate at n=1 (routed to Cal).
[DECISION] Two-layer regression defense: Layer 1 = upstream pinning (protects from drift); Layer 2 = CI lint `9999_rls_lint.sql` (protects from silent upstream regression at tag-bump time). Layer 2 is what makes Layer 1 cheap.
[DECISION] Stdio-only MCP transport. Upstream `mcp` HTTP+OAuth container not deployed. Consumers launch upstream `server.py` as stdio subprocess. API host-bound to Tailscale interface only (`100.96.54.170:8010`, NEVER `0.0.0.0`). Path back to HTTP+OAuth documented at §3.4 (~1-2 hours operator work to re-enable).
[DECISION] File placement: `containers/xireactor-pilot/` at repo root (not under `.claude/teams/framework-research/`). Signals shared cross-team substrate. Ruth-team reconciliation is team-lead's [NEXT-SESSION-CHORE].
[DECISION] Audit container: `BYPASSRLS` read-only role on primary (not pg_dump pipeline, not read replica). One-line SQL + read-only session default. Closes Monte v4 §7.1.2 Brunel-side flag.
[FINDING] xireactor-pilot is the SIMPLER B→E migration case than ruth-team along 3 independent axes: no WARP/corporate-TLS, no team-config-repo surface, no sshd/tmux substrate. If xireactor-pilot can't B→E cleanly, no other team will. Cheapest falsifier of E-pattern portability claims. Promoted to PO brief as "unexpected win."
[WARNING] §10 oscillation (7 revisions: phantom → self-rejection → novel → overbroad-withdrawal → PROPOSED → over-withdrawal → re-restored) was substrate-speculation dressed as reasoning. Neither Brunel nor team-lead read xireactor's actual source code. §10's "option (c) is §1.2-compliant" is best-current-guess, not authoritative. Resolves only via §8.1 source-code walkthrough at stand-up — same class as Herald's Q1/Q2 (c)/(c) digest-silent preconditions. Do NOT treat v0.6.3 §10 as settled fact.
[LEARNED] Team-lead guidance is input to my integration check, not a substitute for it. Folds derived from integrated reasoning (v0.3 upstream-discipline, v0.5 pilot-thesis reshape) survived multi-round iteration. Single-source folds (v0.4 §10 revival on team-lead 19:19, v0.5 SOFT/MEDIUM labels on Monte v3 §7.2) both needed reversal. Pre-fold consistency check: before folding an endorsement or classification I didn't originate, re-check whether it's consistent with the latest integrated doc state, not just whether the endorsement makes sense on its own.
[LEARNED] Retraction-scope cross-wires: a narrow retraction ("I'm wrong about v0.1's phantom flag-flip") can be misread as broad guidance ("asymmetric experiments are wrong in general") if the scope isn't named explicitly. Sender discipline: name the scope of every retraction. Receiver discipline: state the scope assumption before folding, flag if ambiguous. Co-developed pattern with team-lead — both sides of the relay need the same discipline.
[WIP] §8.1 combined Q1+Q2 source-code walkthrough at infrastructure stand-up. One reading-the-source pass, two questions: (Q1) does tier-assignment route on `owned_by` or equivalent, (Q2) does session_init respect RLS via `SET LOCAL`. 3x3 outcome matrix (PASS/PARTIAL/FAIL per question). Also resolves §10 §1.2-compliance question (does option (c) actually work without touching upstream). HIGHEST-consequence item per team-lead (wiki #43 names the invisible-cross-tenant-leak failure mode).

## NEXT-SESSION-CHORE

[CHORE] Stale port 2224 in ruth-team doc `docs/ruth-team-container-design-2026-04-15.md` — entu-research now occupies 2224 per `deployments.md`. Trivial edit, won't get lost.
[CHORE] §8 header labels (SOFT/MEDIUM) may still carry stale Monte v3 §7.2 classifications — verify they align with Herald v1.2 (c)/(c) landing and §8.1 content. If stale, update to honest "digest-silent, resolves via walkthrough" framing.

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
[REQUIREMENT] Infra files (Dockerfile, compose, entrypoint, helper scripts) must be commit-tracked in-repo under a designated path. NOT on operator workstation. Suggested: `.claude/teams/ruth-team/infra/` or `containers/ruth-team/` at repo root — my call on layout. Applies to next build step.
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

## DEPLOYMENT

evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
VJS2-AI-teams repo: `C:/Users/mihkel.putrinsh/Documents/github/VJS2-AI-teams/`
Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`

## APEX-RESEARCH LIBRARIAN DEPLOYMENT (2026-04-13)

[CHECKPOINT] SHIPPED. PR #57 merged to `Eesti-Raudtee/apex-migration-research` (`feat/librarian-eratosthenes`, 12 files, 752 insertions). Schliemann spawns Eratosthenes into pre-created pane %5. Three-way cross-read caught Protocol A/B field-set bug + wiki/index.md + intake_complete dangling refs before merge.
[DECISION] Structural-discipline cluster SHIPPED as L1 team law (commit 589fda9). 5 members across 5 gates: drafting → cross-read → pre-merge → pre-deployment → post-bootstrap. My gate-inventory framing was the load-bearing argument. "Prompt-to-artifact cross-verification" filed at `wiki/patterns/prompt-to-artifact-cross-verification.md`.
[PATTERN] apex-research attribution `(*AR:<Name>*)` differs from our `(*FR:<Name>*)`. Config SOT in `~/workspace/.claude/teams/apex-research/` (repo); runtime `~/.claude/teams/...` ephemeral per startup.md.
[DECISION] Pass1/Pass2 separation: prose renamed Oracle→Librarian, but machine identifiers (`agentType: "oracle"`, `oracle-state.json`, `filed-by: oracle`) ALL stay as "oracle" until Pass2 atomic flip. Cross-team consistency with Cal's Callimachus state. Reviewers must NOT normalize.
[DECISION] Wiki subdirs universal set only: patterns/ gotchas/ decisions/ contracts/ archive/. No observations/process/findings — apex-research proposes domain-specific post-first-use.
[DECISION] Delivery via git PR (repo is SOT). Phase A patches drafted. Phase B: team-lead PR to Eesti-Raudtee/apex-migration-research. Phase C: Schliemann git pull + tmux split + spawn_member.sh in live session.
[GOTCHA] Inbox files created at agent registration time. If a specialist sends to a not-yet-registered agent, message is LOST — no retry. Verified live in container. Spawn order must put service-role agents (librarian) BEFORE message senders.
[PATTERN] Dual-sourced docs (same content in common-prompt + role-specific prompt) must be defended with a forward statement in BOTH copies, not a footnote — footnotes get pruned by DRY pressure, forward statements get inherited.
[LEARNED] [SUBMITTED] Protocol shapes are FIELD-SET CONTRACTS, not prose. When two agents share a protocol, field set must match exactly — Scope/Confidence/Related/Evidence are load-bearing for downstream logic. Drafting from "what I think a submission should look like" produces silent classification breakage. ALWAYS read receiver's full prompt before drafting any protocol the sender uses. Tonal variation OK; field divergence breaks the interface. Filed at `wiki/patterns/protocol-shapes-are-typed-contracts.md` (Cal, 2026-04-13).
[LEARNED] Cross-read should happen at handoff time, not as final sanity check. When a collaborator pings with v2.5/integration announcement, read their FULL artifact then, not just the section they explicitly asked about.
[PATTERN] Submission format calibration from Cal: cite related entries by file path (`patterns/foo.md`), not natural-language descriptor — speeds librarian dedup scan. Apply on next Protocol A submission.
[CHECKPOINT] Meta-pattern SHIPPED: "Structural Change Discipline" promoted to common-prompt L1 team law via Protocol C (commit 589fda9, 2026-04-13). 5 verification gates, 5 cluster members, 29 wiki entries total.

## UIKIT-DEV (2026-04-13 migration sealed)

[CHECKPOINT] Full A+B+C migration SHIPPED. First non-framework-research team using Structural Change Discipline as active guardrail. SSH key `id_ed25519_uikit` → port 2228, team config durable in `Eesti-Raudtee/evr-ui-kit:develop` at `.claude/teams/uikit-dev/`, rc-connect key `8` via `Eesti-Raudtee/dev-toolkit:master f278a93`.
[CHECKPOINT] Lifecycle scripts match framework-research/Volta pattern: persist prunes to 100, restore strips shutdown/idle via external `restore-filter.jq`. Do NOT mark-read — Volta doesn't, and neither should we.
[LEARNED] Dry-run is the cheapest bug-catching gate. Reading the script passed; running it found a mangled jq regex (`""type""` vs `\"type\"`) that would have shipped broken. Commit `1deb90e` fixed via external filter file.
[LEARNED] Base64-encode-via-SSH strips shell-escape backslashes. For scripts with `\"` or `\s`, write via heredoc with single-quote delimiter or `cat > file << 'EOF'` — never via echo/base64 pipelines.
[LEARNED] Task assignments ≠ checkpoint approvals. When PO says "report after each phase", wait for the approval reply before moving on — even if a queued task for the next phase is already visible. Checkpoint violation noted but outcomes accepted this time.
[GOTCHA] evr-ui-kit `.git/config` has `GITHUB_TOKEN` embedded in push URL — stored in the container. Survives rebuilds. Flagged for separate rotation task.
[GOTCHA] **3rd team-config dir found post-migration** (Aalto surfaced 2026-04-13 18:28): `/home/ai-teams/team-config/` is the pre-session bootstrap source with the ORIGINAL 6447-byte `common-prompt.md` (Apr 9 timestamps — comprehensive: Component Conventions, TDD Mandate, Directory Ownership, Git Workflow, Directory Ownership tables). My Phase B migration committed a STUB drafted from the agent prompts alone. `roster.json` + all 5 `prompts/*.md` are byte-identical across team-config/ and repo (zero diff) — only common-prompt.md diverges. team-config/ timestamps predate Aalto's tmux boot (09:58 Apr 13) — confirms it's the bootstrap source. Investigation paused 2026-04-14 08:16 pending PO scope decision. DO NOT proceed on task #12 without re-acknowledgment.
[LEARNED] **Recon pattern was too narrow.** Assumed team config lives at `.claude/teams/<team>/`. Reality: container has N locations (`team-config/`, `.claude/teams/<team>/`, repo-side). Next team migration — scan whole `$HOME` for team-related dirs, don't pre-assume the path. Write Protocol A after PO decision.

## RAAMATUKOI-DEV (2026-04-09)

[CHECKPOINT] Deployed to `Raamatukoi/tugigrupp` — 14 commits, full config.
[LEARNED] GitHub markdown gotcha hit 3 times — now in KEY GOTCHAS above.

## COMMS HUB (2026-03-31)

[CHECKPOINT] Hub on PROD-LLM, 4 teams connected. Bridge proven end-to-end.
[GOTCHA] Bridge `setInterval.unref()` kills standalone process — needs keep-alive.
[GOTCHA] Claude Code sandbox kills background processes — use `docker exec -d`.

## CLOUDFLARED SIDECAR

Tunnel ID: 526a23d1-1f7f-472f-8df1-a9239bbe3fe4
Ingress: `apex-research.dev.evr.ee` → `http://apex-research:5173`
[DEFERRED] QUIC blocked → needs `--protocol http2` flag.

## DISCUSSION #56: SINGLE-PROVIDER MODEL STRATEGY (2026-04-10)

[DECISION] Single-provider is correct default for agent runtime. Multi-provider = sidecar, not peer.
[PATTERN] Three integration seams: peer (Claude-only), sidecar/daemon (Eilama), MCP server (visual QA).
[PATTERN] Audit independence ≠ different-provider Medici. Correct pattern: external audit container reading committed git artifacts.
[PATTERN] Visual QA sidecar ≠ Eilama pattern. Needs headless browser, multimodal API, image volumes, HTTP API — closer to MCP server.
[WIP] Document provider outage behavior inside containers (what does claude process do on API failure?).
[WIP] Spec external audit container architecture if team pursues audit independence.

## DEFERRED

[DEFERRED] OAuth on hr-devs PROD-LLM container — PO manual step.
[DEFERRED] Hub container as standalone Docker image.
[DEFERRED] raamatukoi-dev VPS container deployment — design on GitHub, container TBD.
[DEFERRED] MCP server pattern for visual QA service — scope if uikit-dev needs it.
