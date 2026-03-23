#!/bin/bash
# backlog-triage statusline (*FR:Brunel*)
#
# Shows: ENV_ID badge | model | context bar | dir | git branch | cost
#
# Installed at: /home/ai-teams/statusline-command.sh
# Referenced in: ~/.claude/settings.json → statusLine.command
#
# No test status section — this team reads code and talks to Jira, no test runner.
#
# Requires: jq (installed in image), git
# Graceful degradation: all project-specific info is optional — never hard-fails (§13).

input=$(cat)

# ── ENV_ID check ──────────────────────────────────────────────────────────────
ENV_ID="${CLAUDE_ENV_ID:-}"
if [ -z "$ENV_ID" ] || ! echo "$ENV_ID" | grep -qE '^[0-9A-Z-]{2,10}$'; then
  printf "\033[33mSet CLAUDE_ENV_ID in ~/.bashrc. Example: export CLAUDE_ENV_ID=\"BT-TRIAGE\"\033[0m\n"
  exit 0
fi

# ── Parse input ───────────────────────────────────────────────────────────────
MODEL=$(echo "$input" | jq -r '.model.display_name // ""')
DIR=$(echo "$input" | jq -r '.workspace.current_dir // ""')
LEFT=$(echo "$input" | jq -r '.context_window.remaining_percentage // 100' | cut -d. -f1)
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
SESSION_ID=$(echo "$input" | jq -r '.session_id // "default"')

# Shorten model name
MODEL="${MODEL#Claude }"

# Shorten dir to last component, ~ for home
HOME_DIR=$(eval echo "~")
DIR="${DIR/#$HOME_DIR/~}"
DIR="${DIR##*[/\\]}"
[ -z "$DIR" ] && DIR="~"

# ── Colors ────────────────────────────────────────────────────────────────────
GRAY='\033[38;5;245m'
DIM='\033[2m'
YELLOW='\033[33m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'
GOLD='\033[38;5;179m'
WHITE_BOLD='\033[1;37m'
BG_MAGENTA='\033[45m'
BG_CYAN='\033[46m'
BG_GREEN_DARK='\033[42m'
BG_RED='\033[41m'

# ── Git branch ────────────────────────────────────────────────────────────────
BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git --no-optional-locks branch --show-current 2>/dev/null)
fi

# ── Compact baseline tracking ─────────────────────────────────────────────────
STATE_FILE="/tmp/statusline-compact-${SESSION_ID}.txt"
PREV_LEFT=0
BASELINE=100

if [ -f "$STATE_FILE" ]; then
  PREV_LEFT=$(cut -d: -f1 "$STATE_FILE")
  BASELINE=$(cut -d: -f2 "$STATE_FILE")
fi

if [ "$LEFT" -gt $((PREV_LEFT + 20)) ] && [ "$PREV_LEFT" -gt 0 ]; then
  BASELINE=$LEFT
fi
if [ "$PREV_LEFT" -eq 0 ]; then
  BASELINE=$LEFT
fi

echo "${LEFT}:${BASELINE}" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# ── Context bar ───────────────────────────────────────────────────────────────
BAR_WIDTH=8
SPAN=$(( BASELINE > 16 ? BASELINE - 16 : 1 ))
USABLE=$(( LEFT > 16 ? (LEFT - 16) * 100 / SPAN : 0 ))
FILLED=$((USABLE * BAR_WIDTH / 100))
EMPTY=$((BAR_WIDTH - FILLED))

if [ "$USABLE" -le 20 ] 2>/dev/null; then
  CTX_COLOR="$RED"
elif [ "$USABLE" -le 50 ] 2>/dev/null; then
  CTX_COLOR="$YELLOW"
else
  CTX_COLOR="$GREEN"
fi

BAR=""
for ((i=0; i<EMPTY; i++)); do BAR="${BAR}\xe2\x96\x91"; done
for ((i=0; i<FILLED; i++)); do BAR="${BAR}\xe2\x96\x88"; done

# ── Cost ──────────────────────────────────────────────────────────────────────
COST_FMT=$(printf '$%.2f' "$COST")

# ── Model badge ───────────────────────────────────────────────────────────────
case "$MODEL" in
  Opus*)    MODEL_BADGE="${BG_MAGENTA}${WHITE_BOLD} O ${RESET}" ;;
  Sonnet*)  MODEL_BADGE="${BG_CYAN}${WHITE_BOLD} S ${RESET}" ;;
  Haiku*)   MODEL_BADGE="${BG_GREEN_DARK}${WHITE_BOLD} H ${RESET}" ;;
  *)        MODEL_BADGE="\033[38;5;81m${MODEL}${RESET}" ;;
esac

# ── ENV_ID badge — red background for visibility (triage team) ────────────────
ENV_BADGE="${BG_RED}${WHITE_BOLD} ${ENV_ID} ${RESET}"

# ── Build output ──────────────────────────────────────────────────────────────
OUT="${ENV_BADGE}${MODEL_BADGE} ${CTX_COLOR}${BAR}${RESET} ${GRAY}${USABLE}%${RESET} ${DIM}·${RESET} ${GOLD}${DIR}${RESET}"
if [ -n "$BRANCH" ]; then
  OUT="${OUT} ${GRAY}(${BRANCH})${RESET}"
fi
OUT="${OUT} ${DIM}·${RESET} ${GRAY}${COST_FMT}${RESET}"

printf "%b\n" "$OUT"
