#!/bin/bash
input=$(cat)

# ── ENV_ID check ──────────────────────────────────────────
# Required: set CLAUDE_ENV_ID in your environment (2-10 chars, A-Z0-9)
# e.g. in ~/.bashrc or ~/.claude/.env:
#   export CLAUDE_ENV_ID="MP"
ENV_ID="${CLAUDE_ENV_ID:-}"

if [ -z "$ENV_ID" ] || ! echo "$ENV_ID" | grep -qE '^[0-9A-Z-]{2,10}$'; then
  printf "\033[33mSet CLAUDE_ENV_ID (2-10 chars, A-Z0-9-) in your shell env. Example: export CLAUDE_ENV_ID=\"MP\"\033[0m\n"
  exit 0
fi

# ── Parse input ───────────────────────────────────────────
MODEL=$(echo "$input" | jq -r '.model.display_name')
DIR=$(echo "$input" | jq -r '.workspace.current_dir')
LEFT=$(echo "$input" | jq -r '.context_window.remaining_percentage // 100' | cut -d. -f1)
COST=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
SESSION_ID=$(echo "$input" | jq -r '.session_id // "default"')

# Shorten model name: strip leading "Claude " prefix
MODEL="${MODEL#Claude }"

# Shorten home directory, then keep only last path component
HOME_DIR=$(eval echo "~")
DIR="${DIR/#$HOME_DIR/~}"
DIR="${DIR##*[/\\]}"
[ -z "$DIR" ] && DIR="~"

CYAN='\033[38;5;81m'
GRAY='\033[38;5;245m'
DIM='\033[2m'
YELLOW='\033[33m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'
GOLD='\033[38;5;179m'
WHITE_BOLD='\033[1;37m'
BG_BLUE='\033[44m'
BG_MAGENTA='\033[45m'
BG_CYAN='\033[46m'
BG_GREEN_DARK='\033[42m'

# Git branch
BRANCH=""
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git --no-optional-locks branch --show-current 2>/dev/null)
fi

# ── Compact baseline tracking ────────────────────────────
# Detect compaction by a jump in remaining_percentage, then use the
# post-compact value as the new 100% baseline for the countdown bar.
STATE_FILE="/tmp/statusline-compact-${SESSION_ID}.txt"
PREV_LEFT=0
BASELINE=100

if [ -f "$STATE_FILE" ]; then
  PREV_LEFT=$(cut -d: -f1 "$STATE_FILE")
  BASELINE=$(cut -d: -f2 "$STATE_FILE")
fi

# Detect compaction: remaining jumped up by >20 points
if [ "$LEFT" -gt $((PREV_LEFT + 20)) ] && [ "$PREV_LEFT" -gt 0 ]; then
  BASELINE=$LEFT
fi

# First run: use current value as baseline
if [ "$PREV_LEFT" -eq 0 ]; then
  BASELINE=$LEFT
fi

# Persist state (atomic write)
echo "${LEFT}:${BASELINE}" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE"

# Context bar (compact, 8 chars) — shows remaining usable context
# Auto-compact triggers at ~16% remaining, so 16% = empty, 100% = full
# Baseline adapts after each compaction instead of assuming 100%
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

COST_FMT=$(printf '$%.2f' "$COST")

# Model badge: single letter with colored background
case "$MODEL" in
  Opus*)    MODEL_BADGE="${BG_MAGENTA}${WHITE_BOLD} O ${RESET}" ;;
  Sonnet*)  MODEL_BADGE="${BG_CYAN}${WHITE_BOLD} S ${RESET}" ;;
  Haiku*)   MODEL_BADGE="${BG_GREEN_DARK}${WHITE_BOLD} H ${RESET}" ;;
  *)        MODEL_BADGE="${CYAN}${MODEL}${RESET}" ;;
esac

# ── Build output ──────────────────────────────────────────
OUT="${BG_BLUE}${WHITE_BOLD} ${ENV_ID} ${RESET}${MODEL_BADGE} ${CTX_COLOR}${BAR}${RESET} ${GRAY}${USABLE}%${RESET} ${DIM}·${RESET} ${GOLD}${DIR}${RESET}"
if [ -n "$BRANCH" ]; then
  OUT="${OUT} ${GRAY}(${BRANCH})${RESET}"
fi
OUT="${OUT} ${DIM}·${RESET} ${GRAY}${COST_FMT}${RESET}"

printf "%b\n" "$OUT"
