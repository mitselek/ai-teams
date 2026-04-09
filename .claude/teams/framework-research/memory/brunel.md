# Brunel scratchpad

## KEY GOTCHAS (carry forward — all containers)

[GOTCHA] WARP TLS interception: network_mode:host + NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem + system CA (update-ca-certificates). Mount WARP CA at /opt/warp-ca.pem (not /etc/ssl/certs/).
[GOTCHA] Named volumes created as root → chown 1000:1000 in entrypoint. Also: ~/.npm, ~/.config/.wrangler/logs need explicit mkdir+chown.
[GOTCHA] SSH: useradd creates locked account. Fix: usermod -p '*' for pubkey auth. Alpine uses `passwd -u` instead.
[GOTCHA] entrypoint SSH key install: writes authorized_keys from env vars on EVERY start. .ssh/ NOT in named volume.
[GOTCHA] Container rebuild regenerates SSH host keys — clients get REMOTE HOST IDENTIFICATION HAS CHANGED. Need `ssh-keygen -R "[host]:port"` after every rebuild.
[GOTCHA] tmux inherits locale from the process that starts the server. Non-interactive SSH has empty LANG → all panes get POSIX locale. Always use `tmux -u` or ensure starting shell has locale set.
[GOTCHA] .bashrc non-interactive guard: tokens/locale only available in interactive shells. Non-interactive SSH commands won't see them. Use `bash -ic` or ensure ENV directives in Dockerfile.
[GOTCHA] CRLF from Windows git autocrlf: `#!/usr/bin/env bash\r` breaks entrypoints. Fix: `sed -i 's/\r$//'` on host, then rebuild image.
[GOTCHA] Root-owned /tmp files block ai-teams writes — always create tmux sessions as the target user, not via docker exec as root.

## DEPLOYMENT — see `deployments.md`

evr-ai-base:latest = Debian bookworm-slim + Node 22 + Claude Code + gh + gosu + tmux + SSH.
VJS2-AI-teams repo: `C:/Users/mihkel.putrinsh/Documents/github/VJS2-AI-teams/`
Designs repo: `mitselek-ai-teams/designs/deployed/<team>/container/`

## COMMS HUB (2026-03-31)

[CHECKPOINT] Hub on PROD-LLM, 4 teams connected (comms-dev, bt-triage, framework-research, entu-research).
[CHECKPOINT] SendMessageBridge proven end-to-end — hub messages appear natively in Claude sessions.
[CHECKPOINT] Bidirectional messaging proven: comms-dev <-> framework-research, comms-dev -> entu-research.
[GOTCHA] Bridge `setInterval.unref()` kills standalone process — wrapper needs keep-alive: `setInterval(() => {}, 60_000)`.
[GOTCHA] Claude Code sandbox kills background processes — use `docker exec -d` for daemons, not tmux or Claude bg.
[GOTCHA] Don't run comms-watch --consume alongside bridge on same directory — mutual exclusion.

## SESSION CHECKPOINT (2026-04-02)

[CHECKPOINT] hello-world-container feat/ssh-access: Added openssh-server, entrypoint.sh (SSH_PUBLIC_KEY env var), sshd pubkey-only config. Changes ready for review, not committed.
[CHECKPOINT] apex-research container recovered from CRLF crash loop: entrypoint-apex.sh fixed, image rebuilt, locale/TERM baked into Dockerfile (ENV LANG/LC_ALL/TERM) + entrypoint SHELL_VARS.
[CHECKPOINT] apex-research tmux sessions: created 4 times today (root ownership fix, container restart for WARP, locale/TERM fix, tmux -u for UTF-8). Final working pattern: SSH as ai-teams + `tmux -u new-session` + default shells (not --norc).
[CHECKPOINT] spawn_member.sh deployed to apex-research at ~/workspace/.claude/spawn_member.sh — adapted from polyphony-dev pattern.
[CHECKPOINT] tmux-spawn-guide.md generalized and deployed: dev-toolkit/tools/ (committed `26a657e`) + mitselek-ai-teams framework-research docs/.
[CHECKPOINT] rc-connect.ps1 updated: tmux -u auto-attach for all container deployments (both direct RC and ProxyJump).
[CHECKPOINT] dev-toolkit: 2 commits pushed (dashboard zoom `3979617`, remote-tmux-setup docs `2f44175`).
[CHECKPOINT] apex-migration-research local repo: reset to origin/main (`521745b`), then pulled to `54ee208`. 13 stale local commits safely discarded.
[CHECKPOINT] polyphony-dev tailscale: already installed and connected at 100.100.83.24. iptables errors (no CAP_NET_ADMIN) but userspace networking works.
[CHECKPOINT] Self-hosted runner for hello-world-container: on dedicated on-prem Swarm host (not RC server). Docs in ISO-50716/evr_application_architecture.md.

## CLOUDFLARED SIDECAR (2026-04-01) — WIP

Compose at: `mitselek-ai-teams/designs/deployed/apex-research/container/docker-compose.yml`
Deployed to: `/home/dev/github/apex-migration-research/docker-compose.yml` on RC (100.96.54.170)
Tunnel ID: 526a23d1-1f7f-472f-8df1-a9239bbe3fe4
Ingress: `apex-research.dev.evr.ee` -> `http://apex-research:5173`
QUIC blocked → needs `--protocol http2` flag (not yet in deployed compose).

## DEFERRED

[DEFERRED] OAuth on hr-devs PROD-LLM container — PO manual step.
[DEFERRED] Hub container as standalone Docker image — currently runs inside comms-dev container.
[DEFERRED] Hub startup on container restart — daemons are manual processes, not in entrypoints.
[DEFERRED] Cloudflared sidecar on bridge network — QUIC blocked, needs --protocol http2.

## RFC #46/#47 — XP Pipeline + Oracle (rounds 3-4, then round 5)

[DECISION] Posted round 3 on #47 (containerization angle): wiki/ lives in git repo same as scratchpads/inboxes, no new Docker volumes, git is the durable store.
[DECISION] Posted round 4 on #47: shared PURPLE (cost/RAM argument), framework patterns vs operational knowledge split, MEMORY.md deliberately separate.
[LEARNED] I was the only voice in round 4 arguing for shared PURPLE on pragmatic grounds. Celes resolved it: "shared for Standard tier, separate for Cathedral, decided by domain distance." That preserves my concern for most deployments — Cathedral is the exception, not the default.
[LEARNED] Celes's synthesis at `topics/09-development-methodology.md` is well-structured. Three bootstrap tiers (Greenfield/Established/Archaeological) resolve topic #8 cleanly. My git-diff staleness idea is present as one of three layers (git hash + anchor, PURPLE semantic check, TTL for external).

## Round 5 positions (for posting)

### On #46 — PURPLE tier resolution

[DECISION] Celes's resolution preserves my concern. At Standard tier (where most deployed teams sit — apex-research, entu-research, polyphony-dev, comms-dev, screenwerk-dev), shared PURPLE is the default. Cathedral tier is the exception where domain distance justifies the cost.

BUT — one edge case the resolution does not address: **resource-constrained hosts**. The screenwerk VPS is a 4-8GB Hostinger box. Even at Cathedral tier, adding 2-3 extra opus agents for separate PURPLEs may exceed the host's capacity. The tier should be a recommendation, not a mandate. A container team lead should be able to say "we are a Cathedral codebase but our host cannot sustain Cathedral agent count — we ship shared PURPLE with known risk" and document the tradeoff.

Proposal: add a **deployment constraint** row to the tier table. Cathedral is only available when the host can sustain it. Otherwise fall back to Standard with an explicit acknowledgment of structural risk.

### On #47 — Oracle bootstrap for established teams with existing docs/

[DECISION] The Archaeological bootstrap (scoped extraction, 20-page cap, no commit mining) is the right approach for apex-research (300+ commits, extensive docs/, specs/, inventories). But Celes's synthesis treats `docs/architecture-decisions.md` as "don't duplicate, maintain pointers" — that is correct but incomplete.

The missing piece: **what happens when the existing docs/ contains knowledge that should be in the wiki but is disorganized or partially stale?** apex-research has `docs/specs/` (current), `docs/temp/` (data dumps), `shared/` (extraction output), `inventory/` (JSON inventories), `specs/clusters/` (per-cluster analysis). None of these are structured as a knowledge base — they are build artifacts and deliverables.

My proposal: the Archaeological bootstrap should produce a **wiki index of existing artifacts**, not a wiki of extracted content. The 20-page cap applies to the index itself — 20 pages of "where to find X" pointers, not 20 pages of extracted knowledge. The knowledge stays where it is; the Oracle learns where to point queries.

Example wiki entry:
```markdown
## F301 cluster analysis
source: specs/clusters/f301.md
discovered: 2026-03-05 by Champollion
last-verified: 2026-03-20
scope: domain
```

No content, just the pointer. When an agent queries "what do we know about F301", the Oracle returns the file path. The agent reads the file directly. The wiki stays thin; the docs/ stays canonical.

### On Oracle SPOF

[DECISION] "Team-lead respawns" is the right answer for most teams, but it has a subtle gotcha from container operations: **respawn requires the team lead to hold the Oracle's prompt and spawn command**. On the deployed teams today, spawn commands live in `spawn_member.sh` scripts. If the Oracle crashes and the team lead has never respawned an Oracle before, the team lead needs to know:
1. Which spawn script to invoke
2. Which pane to target (if the pane is gone, create a new one)
3. That Oracle bootstrap will be idempotent (Oracle must not re-run intake interview on respawn within the same session)

Proposal: add an **Oracle respawn marker** file (`~/.claude/teams/<team>/oracle-bootstrapped`) that persists across respawns within a session. If the marker exists, Oracle skips intake interview on respawn. This is cheap and prevents the "Oracle asks every agent the same 4 questions twice" failure mode.
