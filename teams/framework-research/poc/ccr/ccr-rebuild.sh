#!/usr/bin/env bash
# ccr-rebuild.sh -- operator tooling that mechanizes the CCR rebuild-execution
# playbook (teams/framework-research/playbooks/ccr-rebuild-execution.md, Component 4).
#
# Runs the exact gated sequence proven on the apex-research reference instance #1
# (2026-06-16): build-source gate -> tag-before-rebuild -> build -> up
# --force-recreate -> deterministic REBUILD-REPORT -> rollback one-liner.
#
# Usage:
#   ccr-rebuild.sh <repo-dir> <compose-service> <image>
#
#   <repo-dir>         absolute path to the build-source repo on this (build) host
#   <compose-service>  docker compose service name to recreate (e.g. apex-research)
#   <image>            image ref the service builds to (e.g. apex-research-claude:latest)
#                      -- the ":latest" tag is the rebuild target and rollback source.
#
# HARD GUARDS (non-negotiable -- this is destructive-adjacent operator tooling):
#   - NEVER `docker compose down -v`  (would wipe named volumes = stateful loss).
#   - NEVER `git clean` / `git clean -x`  (would delete gitignored build secrets,
#     e.g. the courier private key the BuildKit secret mount needs).
#   - ABORT if the build-source working tree has any dirty TRACKED file.
#   - ABORT if <image>:latest does not exist (nothing to tag => no rollback target).
#   - ABORT if the deploy/ surface is absent after the ff-only checkout.
# Tracked-dirty / missing-image / missing-deploy are STOP conditions: the operator
# resolves them (per playbook, git ref selection is the tasker's call), not this script.
#
# This script does NOT register hub keys and does NOT launch a Claude session --
# those are separate concerns (see the playbook). It surfaces the deterministic
# report and the rollback command; the operator decides on rollback.
#
# (*FR:Hopper*)

set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────────
if [ "$#" -ne 3 ]; then
    echo "usage: $0 <repo-dir> <compose-service> <image>" >&2
    echo "  e.g. $0 /home/dev/github/apex-migration-research apex-research apex-research-claude:latest" >&2
    exit 2
fi

REPO_DIR="$1"
SERVICE="$2"
IMAGE="$3"                                  # expected form repo:tag, tag usually :latest
IMAGE_REPO="${IMAGE%:*}"                    # strip :tag
IMAGE_TAG="${IMAGE##*:}"                    # the tag (latest)
if [ "$IMAGE_REPO" = "$IMAGE" ]; then       # no ':' in arg => default to :latest
    IMAGE_REPO="$IMAGE"
    IMAGE_TAG="latest"
    IMAGE="${IMAGE_REPO}:latest"
fi
TS="$(date -u +%Y%m%d-%H%M)"
PRE_TAG="${IMAGE_REPO}:pre-${TS}"           # rollback target

say()  { echo "[ccr-rebuild] $*"; }
die()  { echo "[ccr-rebuild] ABORT: $*" >&2; exit 1; }

# ── Pre-flight: tooling + repo ──────────────────────────────────────────────────
command -v docker  >/dev/null 2>&1 || die "docker not found on this host"
command -v git     >/dev/null 2>&1 || die "git not found on this host"
[ -d "$REPO_DIR/.git" ] || die "no git repo at $REPO_DIR"
cd "$REPO_DIR"

# ── (a) Build-source gate: on origin/main via ff-only, clean tree, deploy/ present ──
say "build-source gate in $REPO_DIR"
git fetch origin --quiet || die "git fetch failed"

# Dirty TRACKED files => STOP (untracked files such as a .bak or a gitignored key
# are fine and are intentionally NOT cleaned).
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "----- dirty tracked files -----" >&2
    git status --porcelain --untracked-files=no >&2
    die "build-source working tree has dirty tracked files; resolve manually (do NOT stash/discard here)"
fi

CUR_BRANCH="$(git branch --show-current || true)"
if [ "$CUR_BRANCH" != "main" ]; then
    say "on branch '${CUR_BRANCH:-<detached>}' -- checking out main"
    git checkout main || die "git checkout main failed"
fi
git pull --ff-only || die "git pull --ff-only failed (build source has diverged from origin/main; resolve manually)"

HEAD_SHA="$(git rev-parse HEAD)"
ORIGIN_SHA="$(git rev-parse origin/main)"
[ "$HEAD_SHA" = "$ORIGIN_SHA" ] || die "HEAD ($HEAD_SHA) != origin/main ($ORIGIN_SHA) after ff-only"
say "build source on origin/main @ $(git rev-parse --short HEAD)"

# deploy/ surface present (the CCR contract -- without it there is no manifest/report)
[ -d deploy ] || die "deploy/ surface absent on build source -- not a CCR deploy repo or wrong ref"
for f in deploy/MANIFEST.md deploy/startup deploy/health-report.sh; do
    [ -f "$f" ] || die "required deploy-surface file missing: $f"
done
say "deploy/ surface present (MANIFEST.md, startup, health-report.sh)"

# ── (b) Require :latest exists, then tag the rollback target ────────────────────
if [ -z "$(docker images -q "$IMAGE" 2>/dev/null)" ]; then
    die "$IMAGE does not exist -- nothing to tag => no rollback target. Build once manually first, then re-run."
fi
say "tagging rollback target: $IMAGE -> $PRE_TAG"
docker tag "$IMAGE" "$PRE_TAG"
PRE_ID="$(docker images -q "$PRE_TAG")"
LATEST_ID="$(docker images -q "$IMAGE")"
[ -n "$PRE_ID" ] && [ "$PRE_ID" = "$LATEST_ID" ] || die "rollback tag verification failed (pre=$PRE_ID latest=$LATEST_ID)"
say "rollback target confirmed: $PRE_TAG -> $PRE_ID"

ROLLBACK_CMD="cd '$REPO_DIR' && docker tag '$PRE_TAG' '$IMAGE' && docker compose up -d --force-recreate '$SERVICE'"

# ── (c) Build (BuildKit for secret mounts) ──────────────────────────────────────
say "building (DOCKER_BUILDKIT=1 docker compose build)"
DOCKER_BUILDKIT=1 docker compose build || {
    echo "[ccr-rebuild] build FAILED -- container NOT recreated; live container untouched." >&2
    echo "[ccr-rebuild] rollback target $PRE_TAG remains; no rollback needed (no recreate happened)." >&2
    exit 1
}
NEW_ID="$(docker images -q "$IMAGE")"
say "built new image $NEW_ID"

# ── (d) Bring up: force-recreate (NEVER down -v; named volumes preserved) ───────
say "recreating service '$SERVICE' (docker compose up -d --force-recreate)"
docker compose up -d --force-recreate "$SERVICE" || die "compose up failed (rollback: $ROLLBACK_CMD)"

# ── (e) Deterministic REBUILD-REPORT ────────────────────────────────────────────
# The entrypoint does NOT auto-emit the report on a headless `up` (it fires only on
# an interactive/SSH session launch). So run the deterministic report explicitly --
# it is pure shell/python, no LLM, safe on every start. Run as the service user
# inside the container. (Report concern #3 from the apex reference instance.)
say "generating deterministic REBUILD-REPORT (deploy/health-report.sh --send)"
REPORT_USER="${CCR_REPORT_USER:-ai-teams}"
REPORT_WORKDIR="${CCR_REPORT_WORKDIR:-/home/${REPORT_USER}/workspace}"
docker exec -u "$REPORT_USER" "$SERVICE" bash -lc \
    "cd '$REPORT_WORKDIR' && bash deploy/health-report.sh --send" || \
    say "WARNING: health-report invocation returned non-zero -- inspect the report below"

echo ""
say "===== REBUILD-REPORT (.last-report.json) ====="
docker exec -u "$REPORT_USER" "$SERVICE" bash -lc \
    "cat '$REPORT_WORKDIR/deploy/.last-report.json'" 2>/dev/null || \
    say "WARNING: could not read .last-report.json"
echo ""

# Surface the status line for the operator. Status derivation lives in
# health-report.sh / the typed contract; this script does NOT auto-rollback --
# the operator reads the report and decides (any stateful path_check survived=false
# => FAILED => roll back).
STATUS="$(docker exec -u "$REPORT_USER" "$SERVICE" bash -lc \
    "grep -o '\"status\": *\"[A-Z]*\"' '$REPORT_WORKDIR/deploy/.last-report.json' | head -1" 2>/dev/null || true)"
say "report status: ${STATUS:-<unreadable>}"

# ── (f) Rollback one-liner (operator runs this iff the report is FAILED) ─────────
echo ""
say "If the report status is FAILED (any stateful path_check survived=false), ROLL BACK with:"
echo "    $ROLLBACK_CMD"
say "Then re-run this script's report step (or restart) to confirm recovery via a fresh report."
say "done. (No rollback performed automatically -- operator's call per the playbook.)"
