# teams-migration-probe -- throwaway 2.1.178+ implicit-teams probe

(*FR:Brunel*) -- Phase-2 build artifacts for the teams-migration spike. Disposable container to empirically run probes **P6 + P1-P5** against Claude Code **2.1.179** (post-2.1.178 implicit-teams model). Full scope + probe definitions: [`teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md`](../../../teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md).

## Files
- `Dockerfile.probe` -- ubuntu:24.04 + Node 22 + `@anthropic-ai/claude-code@2.1.179` + tmux + sshd + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Bakes NO credentials.
- `docker-compose.probe.yml` -- throwaway service, own volume, SSH on host port **2229** (avoids live 2222-2228).
- `entrypoint-probe.sh` -- volume ownership + operator SSH key + sshd; auth applied separately.

## AUTH -- option (c): fresh `claude login` over tmux (PO decision 2026-06-17)

Background: Phase-1 assumed `ANTHROPIC_API_KEY`; that was empirically wrong (apex has no such key, it uses an OAuth `~/.claude/.credentials.json`). **PO chose option (c): a fresh `claude login` INSIDE the probe, driven interactively over the tmux channel at runtime.** NOT an API key, NOT a copy of apex's creds -- this keeps apex's live OAuth seat untouched and gives the probe its OWN isolated token.

- The probe's `~/.claude` starts **EMPTY**; the login writes its own `.credentials.json` there.
- No credential env var, no creds-file mount/copy. (The compose has NO `ANTHROPIC_API_KEY`.)
- The OAuth **device-code flow** needs egress to **`console.anthropic.com` / `claude.ai`** (not only `api.anthropic.com`). On the WARP rc host, use the `network_mode: host` + WARP-CA variant so those hosts are reachable + TLS-trusted.

**Login step (Hopper, over tmux):**
```bash
# in the probe's tmux pane (started by you):
tmux send-keys -t probe:0.0 'claude login' Enter
tmux capture-pane -t probe:0.0 -p | tail -20      # read the device-code URL/code
# complete the device-code flow in a browser (PO/operator), then:
tmux capture-pane -t probe:0.0 -p | tail -20      # confirm "logged in"
```

**Hygiene:** never print a token; the login handles its own secret. `~/.claude/.credentials.json` is the probe's own throwaway token, destroyed by `down -v`.

## Build + run + verify (rc host, where docker lives -- operator/Hopper)

```bash
# 1. set operator SSH pubkey (so you can ssh in to drive tmux). NO API key (option c).
export PROBE_SSH_PUBLIC_KEY="$(cat ~/.ssh/<operator>.pub)"
# export PROBE_NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem   # WARP-host variant (also uncomment the
#   network_mode:host + CA-mount block in compose so the OAuth flow can reach console.anthropic.com)

# 2. build + up
DOCKER_BUILDKIT=1 docker compose -f docker-compose.probe.yml build
docker compose -f docker-compose.probe.yml up -d

# 3. VERIFY VERSION ONLY (auth is established later, by the tmux `claude login`):
docker compose -f docker-compose.probe.yml exec teams-migration-probe gosu ai-teams claude --version   # expect 2.1.179
#   Do NOT run `claude -p` here -- there is no auth yet; ~/.claude is empty by design.

# 4. AUTH: open the tmux session + run `claude login` (see AUTH section above), complete
#   the device-code flow in a browser, confirm "logged in" via capture-pane.
```

## Drive the probes (tmux over SSH -- Hopper)

`<conn>` = `ssh -p 2229 ai-teams@<rc-host>`. Start the session, then run **P6 first** (bare-session, no spawn), then baseline + P1-P5. Exact per-probe send-keys/capture-pane sequences are in the scope doc, section 3. Snapshot before/after with `docker cp teams-migration-probe:/home/ai-teams/.claude/teams /tmp/probe-snapshot`, then **`docker compose -f docker-compose.probe.yml down -v`** to destroy the throwaway.

## Isolation guarantees
- Own image tag, own container name, own volume, own SSH port. No bind mounts of live data. `restart: "no"`. No live-team container touched. `down -v` leaves nothing behind.
