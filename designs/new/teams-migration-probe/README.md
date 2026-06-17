# teams-migration-probe -- throwaway 2.1.178+ implicit-teams probe

(*FR:Brunel*) -- Phase-2 build artifacts for the teams-migration spike. Disposable container to empirically run probes **P6 + P1-P5** against Claude Code **2.1.179** (post-2.1.178 implicit-teams model). Full scope + probe definitions: [`teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md`](../../../teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md).

## Files
- `Dockerfile.probe` -- ubuntu:24.04 + Node 22 + `@anthropic-ai/claude-code@2.1.179` + tmux + sshd + `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. Bakes NO credentials.
- `docker-compose.probe.yml` -- throwaway service, own volume, SSH on host port **2229** (avoids live 2222-2228).
- `entrypoint-probe.sh` -- volume ownership + operator SSH key + sshd; auth applied separately.

## ⚠ AUTH -- empirically corrected, PO decision required

**Phase-1 assumed `ANTHROPIC_API_KEY`. That was wrong (verified against the live apex container 2026-06-17):** apex has NO `ANTHROPIC_API_KEY` in its env; it authenticates via an **OAuth credentials file** `~/.claude/.credentials.json` (471 bytes) on its persistent volume. So "reuse apex's API key from host env" has no key to reuse. Pick one:

| Option | How | Trade-off |
|---|---|---|
| **(a) Reuse apex OAuth token** | After `up`: `docker cp` apex's `~/.claude/.credentials.json` into the probe volume, `chown 1000:1000`. | Shares one OAuth seat between two CLIs -- possible refresh/contention races; ties throwaway to apex's seat. |
| **(b) API key** *(recommended if available)* | PO exports `ANTHROPIC_API_KEY` in rc-host env before `up` (flows in via compose). | Clean isolation; needs a key PO provides. |
| **(c) Interactive login** | `docker exec -it teams-migration-probe gosu ai-teams claude login` once. | Fully isolated; NOT scriptable (device-code/OAuth). |

**Key hygiene:** never write the key into any file in this dir or print it to logs/chat. Env/`docker cp`/interactive only.

## Build + run + verify (rc host, where docker lives -- operator/Hopper)

```bash
# 1. set operator SSH pubkey (so you can ssh in to drive tmux) + (option b) the key:
export PROBE_SSH_PUBLIC_KEY="$(cat ~/.ssh/<operator>.pub)"
# export ANTHROPIC_API_KEY=...   # option (b) only, from a secure source -- not from a file here
# export PROBE_NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem   # WARP-host variant only

# 2. build + up
DOCKER_BUILDKIT=1 docker compose -f docker-compose.probe.yml build
docker compose -f docker-compose.probe.yml up -d

# 3. apply auth (option a/c) if not using (b), then VERIFY version + auth:
docker compose -f docker-compose.probe.yml exec teams-migration-probe gosu ai-teams claude --version   # expect 2.1.179
docker compose -f docker-compose.probe.yml exec teams-migration-probe gosu ai-teams claude -p 'reply OK' # expect OK, no auth error
```

## Drive the probes (tmux over SSH -- Hopper)

`<conn>` = `ssh -p 2229 ai-teams@<rc-host>`. Start the session, then run **P6 first** (bare-session, no spawn), then baseline + P1-P5. Exact per-probe send-keys/capture-pane sequences are in the scope doc, section 3. Snapshot before/after with `docker cp teams-migration-probe:/home/ai-teams/.claude/teams /tmp/probe-snapshot`, then **`docker compose -f docker-compose.probe.yml down -v`** to destroy the throwaway.

## Isolation guarantees
- Own image tag, own container name, own volume, own SSH port. No bind mounts of live data. `restart: "no"`. No live-team container touched. `down -v` leaves nothing behind.
