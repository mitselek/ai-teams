# aliases.sh — Post-#60 Rewrite Draft

> **Scope:** Issue #60 "retire tmux-pane spawn; adopt Agent-tool persistent spawn."
> Source file lives in `apex-migration-research/teams/apex-research/aliases.sh`
> — owned by Schliemann (apex-research team). This doc is the rewrite proposal;
> the actual patch must be applied in the apex-migration-research repo.
>
> (*FR:Brunel*)

## Before (tmux-based respawn)

```bash
#!/usr/bin/env bash
# apex-research shell aliases — sourced by startup procedure
# (*AR:Schliemann*)

alias l='ls -latr'

TEAM_CONFIG="$HOME/.claude/teams/apex-research/config.json"

# Remove an agent from config.json (required before respawn)
# Usage: ar-remove-member <agent-name>
ar-remove-member() {
  local name="${1:?Usage: ar-remove-member <agent-name>}"
  if ! jq -e ".members[] | select(.name == \"$name\")" "$TEAM_CONFIG" >/dev/null 2>&1; then
    echo "$name not found in config.json"
    return 1
  fi
  jq "del(.members[] | select(.name == \"$name\"))" "$TEAM_CONFIG" > "${TEAM_CONFIG}.tmp"
  mv "${TEAM_CONFIG}.tmp" "$TEAM_CONFIG"
  echo "Removed $name from config.json"
}

# Respawn an agent: save state, /exit, remove, spawn
# Usage: ar-respawn <agent-name> <pane-id>
ar-respawn() {
  local name="${1:?Usage: ar-respawn <agent-name> <pane-id>}"
  local pane="${2:?Usage: ar-respawn <agent-name> <pane-id>}"
  ar-remove-member "$name" || return 1
  bash ~/workspace/.claude/spawn_member.sh --target-pane "$pane" "$name"
}
```

## After (Agent-tool-based; no tmux)

```bash
#!/usr/bin/env bash
# apex-research shell aliases — sourced by startup procedure
# (*AR:Schliemann*)

alias l='ls -latr'

TEAM_CONFIG="$HOME/.claude/teams/apex-research/config.json"

# Remove an agent from config.json (required before respawn).
# Usage: ar-remove-member <agent-name>
#
# Post-#60 respawn procedure:
#   1. Send the agent a message asking it to save its scratchpad (wait for ack)
#   2. Call `ar-remove-member <agent>` from a host shell to clear config.json
#   3. From the team-lead Claude Code session, re-spawn via the Agent tool:
#        Agent(team_name="apex-research",
#              name="<agent>",
#              subagent_type="general-purpose",
#              prompt="You are <persona>. Read teams/apex-research/prompts/<agent>.md,
#                      common-prompt.md, your scratchpad. Send team-lead an intro.",
#              run_in_background=True)
#
# No tmux pane dance, no `/exit` step required. The Agent-tool spawn does not
# inherit a pane lifetime — restart is a clean recreate.
ar-remove-member() {
  local name="${1:?Usage: ar-remove-member <agent-name>}"
  if ! jq -e ".members[] | select(.name == \"$name\")" "$TEAM_CONFIG" >/dev/null 2>&1; then
    echo "$name not found in config.json"
    return 1
  fi
  jq "del(.members[] | select(.name == \"$name\"))" "$TEAM_CONFIG" > "${TEAM_CONFIG}.tmp"
  mv "${TEAM_CONFIG}.tmp" "$TEAM_CONFIG"
  echo "Removed $name from config.json. Re-spawn via Agent() in the team-lead session."
}

# ar-respawn — REMOVED (#60).
# The old tmux-pane-based respawn is no longer applicable; the new path is a
# shell-side `ar-remove-member <agent>` followed by an Agent() call from the
# team-lead Claude Code session. The Agent() call is not a host shell command,
# so there is no meaningful shell-alias replacement for `ar-respawn`.
```

## Notes on why there is no `ar-respawn` replacement

- The new spawn path is `Agent(team_name=..., name=..., subagent_type=..., prompt=..., run_in_background=True)`.
- `Agent()` is a Claude Code tool call, not a host shell command — it runs
  inside the team-lead Claude Code session, not from the SSH shell.
- A shell alias can clean config.json (`ar-remove-member`) but cannot invoke
  the Agent tool. So the respawn flow is now: shell-side cleanup + team-lead
  session re-spawn.
- If operator convenience matters, a prompt-side snippet in the team-lead's
  scratchpad (a pre-written `Agent(...)` call template per agent name) is the
  right shape — not a shell alias.

## Apply path

- **Target repo:** `Eesti-Raudtee/apex-migration-research`
- **Target path:** `teams/apex-research/aliases.sh`
- **Owner:** Schliemann (apex-research team)
- **Reviewer:** Eratosthenes (wiki curator — this change creates a
  "pattern" candidate: "post-#60 respawn has no shell-alias equivalent")

Team-lead (framework-research) to coordinate handoff to apex-research.
