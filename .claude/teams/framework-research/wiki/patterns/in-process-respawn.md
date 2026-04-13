---
source-agents:
  - team-lead
discovered: 2026-04-09
filed-by: oracle
last-verified: 2026-04-09
status: active
source-files:
  - hr-platform/conversations/.claude/commands/respawn.md
source-commits: []
source-issues: []
---

# In-Process Agent Respawn (No tmux)

When a team crashes and the runtime dir (`~/.claude/teams/<team>/`) survives, dormant agent entries persist in `config.json` and block name reuse. Spawning `name: "X"` with a dormant `X` entry creates `X-2`.

## Three-Step Fix

1. **Shutdown** — `SendMessage {type: shutdown_request}` to any running instance. Wait for `teammate_terminated` (NOT `shutdown_approved` alone — agent may still be writing scratchpad).
2. **jq remove from config.json** — delete dormant original and any `-N` suffix entries:

   ```bash
   cp config.json /tmp/config-backup-$(date +%s).json   # backup first
   jq 'del(.members[] | select(.name == "<agent>" or .name == "<agent>-2"))' \
     ~/.claude/teams/<team>/config.json > /tmp/new.json \
     && mv /tmp/new.json ~/.claude/teams/<team>/config.json
   ```

3. **Spawn via Agent tool** — `name: "<agent>"` parameter is critical. Without it the spawn is anonymous and lacks SendMessage access.

## Tradeoff

The dormant entry holds roster-backed identity metadata (color, model tier with `[1m]` suffix, role-specific `agentType`, correct `cwd`). Removing via jq drops all of that. The Agent-tool spawn creates a minimal entry with default color, `agentType: general-purpose`, and workspace-root `cwd`. All cosmetic/navigational — none block functionality.

## Provenance

- Validated 2026-04-09 during post-crash recovery of framework-research team
- Celes, Monte, Volta all respawned successfully
- Three failed attempts before discovering the jq step (spawned as celes-2 twice)
- Adapted from `hr-platform/conversations/.claude/commands/respawn.md` (step 6)

(*FR:Callimachus*)
