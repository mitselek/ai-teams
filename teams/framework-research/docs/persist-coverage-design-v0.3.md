# Persist Coverage Extension — Design Proposal v0.3

**Author:** Volta (*FR:Volta*)
**Date:** 2026-04-14
**Status:** DRAFT — v0.3, integrates team-lead's 5 answers + 3 refinements (2026-04-14 09:59)
**Supersedes:** v0.2 (frozen as reference at `persist-coverage-design-v0.2.md`)
**Co-authors:** Brunel (cross-read, cwd-discovery fix); team-lead (skill-patch specification, retention-age floor, MANIFEST, failure-mode abort)

## Changelog from v0.2

1. **Team-lead's 5 answers locked in as decisions** (Q1–Q5). No longer open. Two new open questions (Q6 Phase 4, Q7 repo inbox origin) remain because team-lead's reply crossed my v0.2 report in flight.
2. **Retention policy gets an age floor.** 5-tarball count limit + "never prune younger than 7 days" secondary floor. Protects against burst-shutdown churn.
3. **MANIFEST file inside each tarball.** Documents the exclusion policy so operators restoring a tarball know what's NOT there. Prevents "is this tarball corrupt?" confusion.
4. **Skill-patch exact text specified.** Section "Skill integration — proposed patch text" added. Volta specs; someone else applies. Includes abort-on-error behavior for `/shutdown-team` per team-lead's directive.
5. **Failure-mode: `/shutdown-team` aborts loud on any persist failure.** Partial persistence creates false sense of safety — worse than no persistence. Aligns with team-lead's explicit ruling.
6. **Protocol A submission timing moved to post-field-test.** Was "after v0.2 approval or after field-test". Team-lead picked post-field-test, submission carries empirical data from first uikit-dev shutdown cycle. Sequence documented.

## Summary (UNCHANGED from v0.2)

Split persistence into three scripts by cadence. `persist-inboxes.sh` (existing) stays. `persist-project-state.sh` (new, cheap, per-agent) handles per-user auto-memory. `persist-session-logs.sh` (new, expensive, coordinated-shutdown-only) handles session transcripts as host-side tarballs. All three hyphen-safe. Team-config out-of-scope.

## Cwd-discovery — UNCHANGED from v0.2

Marker file `.project-dir-name` primary. Computed git-toplevel fallback with warning. Framework-research marker content: `C--Users-mihkel-putrinsh-Documents-github` (verified from live project dir enumeration).

See v0.2 for full reasoning and bootstrap procedure.

## Hyphen-safe handling — UNCHANGED

Absolute-path form preferred; `cd parent && ./<name>` when relative names needed (tar entry names). See v0.1.

## Script designs — v0.3 REVISIONS

### NEW: `persist-project-state.sh` — UNCHANGED from v0.2

Mirror semantics, marker-primary discovery, POSIX wipe-then-copy. See v0.2 for full script.

### NEW: `persist-session-logs.sh` — v0.3 adds MANIFEST + age-floor retention

```bash
#!/usr/bin/env bash
# (*FR:Volta*) — Persist session .jsonl transcripts as a compressed tarball.
# EXPENSIVE — runs on coordinated team shutdown or pre-rebuild only.
# Requires GNU tar for --exclude **/pattern support.
set -euo pipefail

# --- argument parsing ---
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
MARKER_FILE="$SCRIPT_DIR/.project-dir-name"
BACKUP_DIR="${SESSION_BACKUP_DIR:-$HOME/.claude-session-backups/$TEAM_NAME}"

# --- cwd-discovery (marker primary) ---
if [ -f "$MARKER_FILE" ]; then
  PROJECT_DIR_NAME=$(cat "$MARKER_FILE" | tr -d '[:space:]')
  DISCOVERY_METHOD="marker"
else
  SPAWN_CWD_GUESS=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD_GUESS" | sed 's/[^A-Za-z0-9_]/-/g')
  DISCOVERY_METHOD="computed-fallback"
  echo "WARNING: No marker file at $MARKER_FILE, using computed fallback: $PROJECT_DIR_NAME" >&2
fi

PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "No project dir at $PROJECT_DIR — nothing to persist." >&2
  exit 0
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TARBALL="$BACKUP_DIR/session-logs-$TEAM_NAME-$TIMESTAMP.tar.gz"
MANIFEST_TMP=$(mktemp)

# --- build MANIFEST file documenting what's in the tarball ---
cat > "$MANIFEST_TMP" <<MANIFEST_EOF
# Session Logs Tarball — MANIFEST
team: $TEAM_NAME
created_utc: $TIMESTAMP
source_project_dir: $PROJECT_DIR
discovery_method: $DISCOVERY_METHOD
hostname: $(hostname)
creator_script: persist-session-logs.sh (v0.3)

## Included
- Top-level session transcripts: <uuid>.jsonl
- Subagent transcripts: <uuid>/subagents/*.jsonl

## EXCLUDED (by design, not corruption)
- memory/ — per-user auto-memory, covered by persist-project-state.sh, persisted to repo separately
- **/tool-results/ — redundant with parent agent conversations, excluded to reduce size

## To restore
cd \$HOME/.claude/projects && tar xzf <this-tarball>
# Then verify:
ls -la ./$PROJECT_DIR_NAME
MANIFEST_EOF

if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] Would create: $TARBALL"
  echo "[DRY-RUN] Source: $PROJECT_DIR"
  echo "[DRY-RUN] Exclude: memory/, **/tool-results, /tool-results"
  echo "[DRY-RUN] Tarball would contain approximately:"
  cd "$HOME/.claude/projects" && \
    find "./$PROJECT_DIR_NAME" \
      -not -path "*/memory/*" \
      -not -path "*/tool-results/*" \
      -type f 2>/dev/null | wc -l
  echo "[DRY-RUN] (above: file count that would be included)"
  echo "[DRY-RUN] MANIFEST content:"
  cat "$MANIFEST_TMP"
  rm -f "$MANIFEST_TMP"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

# --- hyphen-safe tar ---
# Copy MANIFEST into a staged location so it lands inside the tarball root
STAGE_DIR=$(mktemp -d)
cp "$MANIFEST_TMP" "$STAGE_DIR/MANIFEST.md"

cd "$HOME/.claude/projects" && \
  tar czf "$TARBALL" \
    --exclude="./$PROJECT_DIR_NAME/memory" \
    --exclude="./$PROJECT_DIR_NAME/**/tool-results" \
    --exclude="./$PROJECT_DIR_NAME/tool-results" \
    "./$PROJECT_DIR_NAME" \
    -C "$STAGE_DIR" "MANIFEST.md"

rm -rf "$STAGE_DIR" "$MANIFEST_TMP"

SIZE=$(du -h "$TARBALL" | cut -f1)
echo "Persisted session logs to $TARBALL ($SIZE)."

# --- retention: count + age floor ---
# Never prune tarballs younger than RETENTION_AGE_DAYS (default 7)
# Within older set, keep last N (default 5)
RETENTION_COUNT="${SESSION_BACKUP_RETENTION:-5}"
RETENTION_AGE_DAYS="${SESSION_BACKUP_RETENTION_AGE_DAYS:-7}"

cd "$BACKUP_DIR" || exit 0

# Find tarballs strictly older than age floor
OLD_TARBALLS=$(find . -maxdepth 1 -name "session-logs-$TEAM_NAME-*.tar.gz" \
                 -type f -mtime "+$RETENTION_AGE_DAYS" \
                 -printf '%T@ %p\n' 2>/dev/null | \
               sort -rn | awk '{print $2}')

# Within that older set, keep newest RETENTION_COUNT, prune the rest
PRUNE_COUNT=0
if [ -n "$OLD_TARBALLS" ]; then
  echo "$OLD_TARBALLS" | tail -n +$((RETENTION_COUNT + 1)) | \
    while IFS= read -r victim; do
      [ -n "$victim" ] || continue
      rm -v "$victim"
      PRUNE_COUNT=$((PRUNE_COUNT + 1))
    done
fi

TOTAL_KEPT=$(find . -maxdepth 1 -name "session-logs-$TEAM_NAME-*.tar.gz" -type f | wc -l)
echo "Retention: kept $TOTAL_KEPT tarball(s) for $TEAM_NAME (count=$RETENTION_COUNT, age_floor=${RETENTION_AGE_DAYS}d)."
exit 0
```

**Key v0.3 additions:**

1. **`--dry-run` flag** (response to Q6 Option D): argument parser at the top, dry-run branch prints intended paths + file count + MANIFEST, exits before any filesystem write. Safe to run in live uikit-dev container during maintenance window.
2. **MANIFEST.md inside tarball** (response to team-lead refinement): documents team, timestamp, source, discovery method, hostname, what's included, what's excluded, and restore instructions. Operator extracting a tarball can `head MANIFEST.md` and see exactly what they're looking at.
3. **Retention with age floor** (response to team-lead refinement): `find -mtime +7` selects only tarballs older than 7 days; the count limit applies WITHIN that old set. Result: younger tarballs never get pruned regardless of count. Burst-shutdown protection.

### NEW: `restore-session-logs.sh` — v0.3 MANIFEST-aware

```bash
#!/usr/bin/env bash
# (*FR:Volta*) — Restore session logs from tarball. MANUAL-ONLY.
# Prints MANIFEST content before extraction so operator knows what's in the tarball.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
BACKUP_DIR="${SESSION_BACKUP_DIR:-$HOME/.claude-session-backups/$TEAM_NAME}"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "No backup dir at $BACKUP_DIR — nothing to restore." >&2
  exit 1
fi

if [ -z "${1:-}" ]; then
  echo "Available tarballs in $BACKUP_DIR:"
  ls -1t "$BACKUP_DIR"/session-logs-*.tar.gz 2>/dev/null || echo "(none)"
  echo ""
  echo "Usage: restore-session-logs.sh <tarball-filename>"
  exit 0
fi

TARBALL="$BACKUP_DIR/$1"
if [ ! -f "$TARBALL" ]; then
  echo "Tarball not found: $TARBALL" >&2
  exit 1
fi

# Show MANIFEST before extracting, so operator sees scope before action
echo "=== MANIFEST ==="
tar xzOf "$TARBALL" MANIFEST.md 2>/dev/null || echo "(no MANIFEST found — older tarball format)"
echo "=== end MANIFEST ==="
echo ""

read -p "Proceed with extraction? (y/N) " CONFIRM
[ "$CONFIRM" = "y" ] || { echo "Aborted."; exit 0; }

cd "$HOME/.claude/projects" && tar xzf "$TARBALL"
echo "Restored from $TARBALL into $HOME/.claude/projects/"
exit 0
```

**New:** MANIFEST display before extraction + confirmation prompt. Operator sees exactly what's in the tarball before committing to the restore.

### `persist-project-state.sh` — v0.3 adds `--dry-run`

Same body as v0.2 plus arg parser and dry-run branch. Sketch:

```bash
# --- argument parsing (add at top) ---
DRY_RUN=0
for arg in "$@"; do case "$arg" in --dry-run) DRY_RUN=1 ;; esac; done

# --- before wipe/copy loop ---
if [ "$DRY_RUN" = "1" ]; then
  echo "[DRY-RUN] Source: $RUNTIME_MEMORY"
  echo "[DRY-RUN] Dest: $REPO_PROJECT_MEMORY"
  echo "[DRY-RUN] Files that would be mirrored:"
  find "$RUNTIME_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '  %f\n'
  echo "[DRY-RUN] Files currently in dest that would be wiped:"
  find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f -printf '  %f\n' 2>/dev/null
  exit 0
fi
```

## Skill integration — v0.3 proposed patch text (NEW SECTION)

Team-lead directive: Volta specs; someone else applies. The following are the **exact changes** to propose for the two skill files.

### Patch 1 — `~/.claude/skills/shutdown/SKILL.md`

Add a new **Step 3.5** between Step 3 (Ask agent to save state) and Step 4 (Close Claude via /exit):

```markdown
### Step 3.5: Persist per-agent state

Before closing Claude, run the per-agent persist scripts. These are cheap (<1s total) and invariant-preserving.

```bash
bash "$TEAM_DIR/persist-inboxes.sh" "<agent-name>"
bash "$TEAM_DIR/persist-project-state.sh"
```

`persist-inboxes.sh <name>` persists only the named agent's inbox. `persist-project-state.sh` is shared-state and runs in full-team mode (no per-agent subset).

**Failure mode:** if either script exits non-zero, halt the shutdown sequence and surface the error to the operator. Do NOT proceed to Step 4 — partial persistence followed by clean shutdown creates a false sense of recovery safety.
```

### Patch 2 — `~/.claude/skills/shutdown-team/SKILL.md`

Add a new **Step 2.9** between the per-agent loop (Step 2) and the git commit (Step 3):

```markdown
### Step 2.9: Persist team-wide state (session logs + per-user auto-memory)

After all per-agent shutdowns complete, run the coordinated-shutdown-only scripts:

```bash
bash "$TEAM_DIR/persist-inboxes.sh"              # all-inboxes mode
bash "$TEAM_DIR/persist-project-state.sh"
bash "$TEAM_DIR/persist-session-logs.sh"
```

**Failure mode (CRITICAL):** if any of the three scripts exits non-zero, abort the shutdown sequence, surface the error, and do NOT proceed to Step 3 (git commit). Partial persistence followed by clean shutdown and git push is strictly worse than no persistence — the repo looks up-to-date when it isn't.

If `persist-session-logs.sh` specifically fails (e.g., disk full on `$SESSION_BACKUP_DIR`), the operator should fix the backup destination and re-run `/shutdown-team` from the beginning. Session-log persist is coordinated-shutdown-only, so there's no cheaper recovery path.

**Success path:** all three scripts exit 0 → proceed to Step 3 (git add / commit / push).
```

Also update Step 3 (commit team scratchpads) to include `project-memory/` in the git add path:

```bash
cd "$MEMORY_REPO" && \
  git pull --rebase && \
  git add "$MEMORY_PATH" "teams/$TEAM_NAME/project-memory/" "teams/$TEAM_NAME/inboxes/" && \
  git commit -m "$COMMIT_MSG" && \
  git push
```

(Note: inboxes/ should already be in the repo. project-memory/ is new. Both explicitly listed rather than using `git add .` to keep the commit scope bounded.)

### Application process (team-lead directive)

1. v0.3 approved by team-lead
2. Team-lead decides: hand patches to PO for application, OR apply himself under coordinator-exception rationale
3. Skill files updated at `~/.claude/skills/shutdown/SKILL.md` and `~/.claude/skills/shutdown-team/SKILL.md`
4. Volta field-tests new invocation path on framework-research substrate (dry-run and real)

Volta does NOT edit skill files directly — scope boundary holds.

## Retention policy — v0.3 WITH AGE FLOOR

**Pruning rule:**

1. Compute set of tarballs older than `RETENTION_AGE_DAYS` (default 7)
2. Within that old set, keep newest `RETENTION_COUNT` (default 5)
3. Prune everything else in the old set
4. Tarballs younger than the age floor are **never pruned**, regardless of count

**Example:** team churns through 12 shutdown cycles in one afternoon (burst). All 12 tarballs are < 1 day old. Age floor = 7 days → 0 tarballs eligible for pruning. All 12 are kept. Next day, team runs normally. Days 1-7 accumulate normally. On day 8, the first burst tarball crosses the age floor → pruning resumes normal count-limit behavior.

**Environment variables:**

- `SESSION_BACKUP_DIR` — override backup root (default `$HOME/.claude-session-backups/<team>/`)
- `SESSION_BACKUP_RETENTION` — count limit within old set (default 5)
- `SESSION_BACKUP_RETENTION_AGE_DAYS` — age floor in days (default 7, NEW in v0.3)

**Trade-off:** age floor means disk usage can spike during high-churn periods. At worst case, 12 shutdowns/day × 7 days × 5MB avg = 420MB for one team during a week-long incident response. Acceptable ceiling. If a team regularly blows past this, set `SESSION_BACKUP_RETENTION_AGE_DAYS=1` in their entrypoint.

## Protocol A submission — v0.3 TIMING SEQUENCE

Per team-lead directive: submit **AFTER field-test**, not after v0.3 approval.

**Sequence:**

1. Volta finalizes v0.3
2. Team-lead approves v0.3
3. Volta implements v0.3 on framework-research substrate (safe dry-run + real run)
4. Volta coordinates with Brunel to port scripts into uikit-dev (same relay discipline as Phase 1/2/3/3.5)
5. Brunel ships, Aalto runs a shutdown-restore cycle against uikit-dev, verifies correctness
6. **Only then:** Volta + Brunel co-sign Protocol A submission to Cal

**Submission frame:** "validated pattern, first field test in uikit-dev on YYYY-MM-DD" with empirical data:

- Retention counts observed
- Tarball sizes (raw + gzipped)
- Discovery method used per team (marker vs computed-fallback)
- Any gotchas discovered during first use

Gives Cal concrete provenance and keeps the wiki entry grounded in observed reality.

**Volta still owes a Cal-prompt cross-read** before sending, per the pre-submission gate noted in v0.2. Will do it between v0.3 approval and the first field test, during the wait.

## Failure modes — v0.3 additions

| Failure | When | Mitigation |
|---|---|---|
| Age floor + count limit contradiction | never — age floor ALWAYS takes precedence | Documented; test at dry-run |
| MANIFEST file malformed | script bug | MANIFEST generated from variables; no user input — safe |
| MANIFEST missing from old tarball | pre-v0.3 tarball format | restore-session-logs.sh handles it: "(no MANIFEST found — older tarball format)" |
| `/shutdown-team` aborts mid-persist, leaving partial state | any script exit-1 | Team-lead directive: abort loud, don't push commit. Partial > no persist = wrong; no persist > partial = right. |
| dry-run flag ignored by stale caller | operator confusion | Script documents the flag in arg parser; non-zero exit on unknown args |

All v0.2 failure modes remain.

## Open questions — v0.3 state

### RESOLVED by team-lead 2026-04-14 09:59

- **Q1 — Skill integration:** Option 1 (auto-invoke). Exact patch text in v0.3 Section "Skill integration".
- **Q2 — Backup dir root:** `$HOME/.claude-session-backups/<team>/`. Picked; env var override preserved.
- **Q3 — Retention count:** 5 default. Plus NEW age floor of 7 days.
- **Q4 — Subagents included / tool-results excluded:** Confirmed. MANIFEST documents the exclusion.
- **Q5 — Cal submission timing:** After field-test. Sequence documented.

### STILL OPEN (v0.2 additions, team-lead's reply crossed v0.2 in flight)

- **Q6 — Phase 4 field-testability:** Option A / B / C / D. Volta recommends D (dry-run flag) + A (framework-research substrate). **v0.3 implements `--dry-run` flag anyway** because team-lead's answers are consistent with it (discipline-free persistence + no in-container writes during maintenance window = dry-run flag is the safe path). If team-lead prefers a different option, the flag remains useful and costs nothing.
- **Q7 — How do repo inboxes get populated today?** Neither Volta nor Brunel knows. Answer affects whether the integration plan is "add new invocation" or "fix silently-broken existing path". Flagged in v0.2, still open.

### NEW open question in v0.3

- **Q8 — Coordinator-exception vs PO-application for skill patches:** team-lead offered two paths for applying the skill patches: (a) hand to PO for application, or (b) apply himself under coordinator-exception rationale. This is a process decision for team-lead, not a design decision. Volta flags but has no preference — both produce the same end state.

## Checkpoint plan — v0.3 state

**Next checkpoint to team-lead:** this document (v0.3). Team-lead promised 5-minute review after receipt. Upon approval:

1. Team-lead answers Q6 (Phase 4 strategy) and Q7 (inbox origin)
2. Volta creates framework-research marker file `.project-dir-name`
3. Volta writes the three new scripts (`persist-project-state.sh`, `persist-session-logs.sh`, `restore-session-logs.sh`, `restore-project-state.sh`) — four files total
4. Volta dry-runs all four on framework-research substrate
5. Volta reports implementation + dry-run results to team-lead
6. Coordination with Brunel for uikit-dev rollout (Phase 4 of his window)
7. Field test in uikit-dev (Brunel ships, Aalto runs)
8. Volta cross-reads Cal's prompt for Protocol A field spec
9. Joint Protocol A submission with field-test data

**Do NOT implement between v0.2 and v0.3 approval.** Plan-before-execute holds.

---

## Time spent

- v0.1 drafting: ~35 min
- v0.2 Brunel integration: ~25 min
- v0.3 team-lead integration: ~20 min
- **Total design phase: ~80 min** — still under 100-min estimate
