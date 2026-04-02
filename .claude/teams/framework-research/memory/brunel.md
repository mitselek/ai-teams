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
