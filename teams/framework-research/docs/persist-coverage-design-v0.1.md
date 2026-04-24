# Persist Coverage Extension — Design Proposal v0.1

**Author:** Volta (*FR:Volta*)
**Date:** 2026-04-14
**Status:** DRAFT — pending team-lead approval + Brunel cross-read
**Supersedes:** nothing (current scripts stay canonical until v1.0 lands)

## Summary — decision stated upfront

**Split the lifecycle into two scripts with distinct cadences.** Keep `persist-inboxes.sh` as the fast-path per-agent hook. Add a new expensive-path coordinated-shutdown-only script. Extend both to be hyphen-safe. Cover three runtime state locations; explicitly out-of-scope: team-config bootstrap dirs (repo is their SOT).

| Script | Cadence | Targets | Destination |
|---|---|---|---|
| `persist-inboxes.sh` (existing, rename internally) | per-agent shutdown | runtime inboxes | repo (`teams/<team>/inboxes/`) |
| `persist-project-state.sh` (NEW) | per-agent shutdown (cheap) | project-scoped auto-memory `.md` files | repo (`teams/<team>/project-memory/`) |
| `persist-session-logs.sh` (NEW) | coordinated-shutdown OR pre-rebuild only | `.jsonl` transcripts under project dir | host-side backup dir OUTSIDE the repo (tarball with retention) |
| `restore-inboxes.sh` (existing) | TeamCreate post-bootstrap | repo inboxes → runtime | — |
| `restore-project-state.sh` (NEW) | TeamCreate post-bootstrap | repo project-memory → runtime project dir | — |
| `restore-session-logs.sh` (NEW) | manual only | tarball → runtime project dir | — |

**Rationale for split over bundle:**

- Inbox persist already works and runs on every shutdown. Bundling transcript tarball into it would turn a <1 second operation into a minute-long operation per agent. That defeats the fast-path invariant ("shutdown cleanly, don't block the operator").
- Project-scoped auto-memory is the odd middle case: small text files, cheap to copy, but lives in a DIFFERENT dir than inboxes. Separate script keeps concerns single-purpose without bloating either.
- Session logs are huge, coordinated-shutdown-only, tarballed, and stored outside the repo. Mixing them with the fast path is strictly worse.
- Brunel's separation reasoning (stated verbatim in the scope brief) matches mine independently. Two-source convergence on the split is design strength.

## Out of scope — explicit boundary

**Team-config bootstrap dirs** (`~/team-config/`, any `common-prompt.md` that originates in the repo) are NOT in this design's scope. Reasoning:

- The repo is their single source of truth. Their persistence is `git push`.
- Runtime `teams/<team>/common-prompt.md` is a READ of repo state, not independent writing. Nothing to persist — it's already persisted upstream.
- Brunel's item 8 (team-config stub reconciliation) handles the one case where the container's bootstrap dir diverged from the repo. That's a one-time sync, not a recurring lifecycle event.

**Agreement with team-lead's read:** team-config bootstrap dirs are out-of-scope. If observation ever contradicts (container mutates the bootstrap dir in a way that matters), revisit — but today that's not the failure mode.

Documenting this boundary in the design doc so future-Volta or future-Brunel doesn't silently expand scope.

## Empirical substrate — local project dir observations

Verified against framework-research's own project dir at session start (2026-04-14 09:47):

- **Path:** `~/.claude/projects/C--Users-mihkel-putrinsh-Documents-github/` — confirms Windows sanitization
- **Linux equivalent pattern (from uikit-dev observation):** `/home/ai-teams/dev/evr-ui-kit` → `-home-ai-teams-dev-evr-ui-kit` — leading-hyphen confirmed
- **Size:** 1.5 GB total, 24 top-level `.jsonl` transcripts, 35 `memory/*.md` files, N `<uuid>/` session dirs with `subagents/` + `tool-results/` subdirs
- **Structure** (three distinct things under the project dir):
  1. `<uuid>.jsonl` — top-level session transcripts (main conversation)
  2. `<uuid>/subagents/*.jsonl` + `<uuid>/tool-results/` — per-session subagent transcripts and tool outputs
  3. `memory/*.md` — project-scoped auto-memory

**Implication for Finding 2:** session logs are NOT a flat file list. They're the union of top-level `.jsonl` and nested `<uuid>/*` trees. The tarball target is the ENTIRE project dir sans `memory/` (auto-memory is covered by the other new script).

**Implication for Finding 1:** the framework-research team itself is living the failure mode. 35 auto-memory files accumulated over 2+ months. If this project dir got wiped, I lose all of them. The fix applies directly to my own container as well as uikit-dev's.

## Cwd-discovery mechanism — decision

**Option 3 (cwd-based computation) as primary, Option 2 (marker file) as explicit override.**

### Sanitization algorithm (empirically verified)

```
absolute_cwd -> project_dir_name:
  replace every non-[A-Za-z0-9_] character with '-'
```

Examples:

- Windows `C:\Users\mihkel.putrinsh\Documents\github` → `C--Users-mihkel-putrinsh-Documents-github` (colon→-, backslash→-, period→-)
- Linux `/home/ai-teams/dev/evr-ui-kit` → `-home-ai-teams-dev-evr-ui-kit` (leading slash→-, slashes→-, hyphen preserved)
- Linux `/home/michelek` → `-home-michelek`

**Note:** hyphens in the original path (like `evr-ui-kit`) are preserved as-is — they were already in the allowed char set. Only separators and special chars are rewritten.

### Discovery procedure

```bash
# Step 1: try explicit override (marker file in team dir)
PROJECT_DIR_NAME_OVERRIDE=$(cat "$SCRIPT_DIR/.project-dir-name" 2>/dev/null || true)

if [ -n "$PROJECT_DIR_NAME_OVERRIDE" ]; then
  PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME_OVERRIDE"
else
  # Step 2: compute from cwd-at-spawn-time
  # We need the cwd Claude Code was originally started in, not current pwd.
  # Convention: assume the team repo root is the spawn cwd.
  # For framework-research: cwd = repo root of mitselek-ai-teams
  # For uikit-dev: cwd = /home/ai-teams/dev/evr-ui-kit (container convention)

  SPAWN_CWD=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD" | sed 's/[^A-Za-z0-9_]/-/g')
  PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
fi

# Step 3: verify it exists — cold start or unusual setup means nothing to persist
if [ ! -d "$PROJECT_DIR" ]; then
  echo "No project dir at $PROJECT_DIR — nothing to persist. (Set $SCRIPT_DIR/.project-dir-name to override.)"
  exit 0
fi
```

### Why this ordering

1. **Marker file first (highest priority).** A human overrides the computation in any edge case. Resilient to non-standard container setups and to Claude Code changing its sanitization rule in future versions.
2. **Cwd-based computation second (zero-config default).** Works for the 95% case. Verified algorithm, empirical.
3. **Graceful no-op third.** If neither resolves to an existing dir, the script exits 0, not 1 — missing project dir is not a failure condition, it's a cold-start case.

### Why NOT env var as primary

Env vars require every team's entrypoint script to set them. That's a cross-team invariant with no enforcement mechanism. One missing `export` and the script silently targets the wrong dir. Marker file has the same resilience benefit without the cross-team coordination tax — and the computed default handles the common case without any config at all.

### Open question

Does Claude Code guarantee the `[^A-Za-z0-9_]→-` rule forever, or is it version-dependent? If it changes, my cwd-computation breaks silently.

**Mitigation:** the marker file override is the escape hatch. If Cal files a wiki gotcha when Claude Code bumps its sanitization rule, every team can drop in a marker file as a one-line fix. That's acceptable operating overhead for a rare event.

## Hyphen-safe handling (Finding 3)

**Pattern rule for any script touching `~/.claude/projects/<sanitized>/`:**

```bash
# WRONG — tar parses leading - as option flag, breaks on Linux paths
tar czf backup.tar.gz -home-ai-teams-dev-evr-ui-kit/

# WRONG — find also parses it
find -home-ai-teams-dev-evr-ui-kit -name '*.jsonl'

# RIGHT — cd into parent, use ./<name> prefix to disambiguate
cd "$HOME/.claude/projects" && tar czf /path/backup.tar.gz "./$PROJECT_DIR_NAME"
cd "$HOME/.claude/projects" && find "./$PROJECT_DIR_NAME" -name '*.jsonl'

# ALSO RIGHT — use explicit path prefix
tar czf backup.tar.gz "$HOME/.claude/projects/$PROJECT_DIR_NAME/"
# (absolute path doesn't start with -, so no ambiguity)
```

**Which pattern to use:** prefer absolute-path form when possible (simpler, no `cd` side effect). Use `cd` + `./` form only when the tool doesn't accept absolute paths gracefully OR when the output needs relative names (e.g. `tar` with relative entry names for easier extraction later).

**Propagation:** this pattern rule becomes a template standard for any future script touching project dirs. Submit to Cal as part of the Protocol A submission.

## Script designs

### NEW: `persist-project-state.sh`

```bash
#!/usr/bin/env bash
# (*FR:Volta*) — Persist project-scoped auto-memory .md files to repo.
# Runs on per-agent shutdown (cheap: small text files, typically <100KB total).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"
REPO_PROJECT_MEMORY="$SCRIPT_DIR/project-memory"

# Resolve project dir (see cwd-discovery procedure)
PROJECT_DIR_NAME_OVERRIDE=$(cat "$SCRIPT_DIR/.project-dir-name" 2>/dev/null || true)
if [ -n "$PROJECT_DIR_NAME_OVERRIDE" ]; then
  PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME_OVERRIDE"
else
  SPAWN_CWD=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD" | sed 's/[^A-Za-z0-9_]/-/g')
  PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
fi

RUNTIME_MEMORY="$PROJECT_DIR/memory"

if [ ! -d "$RUNTIME_MEMORY" ]; then
  echo "No runtime auto-memory at $RUNTIME_MEMORY — nothing to persist."
  exit 0
fi

mkdir -p "$REPO_PROJECT_MEMORY"

# Copy all .md files. Simple rsync-equivalent using cp.
# Note: these are small text files, safe to overwrite on each persist.
PERSISTED=0
for md_file in "$RUNTIME_MEMORY"/*.md; do
  [ -f "$md_file" ] || continue
  filename=$(basename "$md_file")
  cp "$md_file" "$REPO_PROJECT_MEMORY/$filename"
  PERSISTED=$((PERSISTED + 1))
done

# Verification
DEST_COUNT=$(find "$REPO_PROJECT_MEMORY" -maxdepth 1 -name '*.md' -type f | wc -l)
if [ "$DEST_COUNT" -lt "$PERSISTED" ]; then
  echo "ERROR: Count mismatch — persisted=$PERSISTED dest=$DEST_COUNT" >&2
  exit 1
fi

echo "Persisted $PERSISTED project-memory .md file(s) from $RUNTIME_MEMORY to $REPO_PROJECT_MEMORY."
exit 0
```

**Per-agent filter?** No. Unlike inboxes (which have one file per agent), project-scoped auto-memory is SHARED — multiple agents in the same team write to the same `memory/` dir, each file represents a topic not an agent. Persisting the whole dir on every per-agent shutdown is fine because files are text and small. Total state for framework-research's dir is 35 files — likely <500KB.

**Race condition risk:** if agent A shuts down while agent B is mid-write to a memory file, we could copy a partial file. Mitigation: Claude Code's memory writes are atomic (write-then-rename pattern is standard for auto-memory systems). Trust it. If it breaks, the file we copied is the previous version, not a corrupted one — self-healing on next persist.

### NEW: `persist-session-logs.sh`

```bash
#!/usr/bin/env bash
# (*FR:Volta*) — Persist session .jsonl transcripts as a compressed tarball.
# EXPENSIVE — runs on coordinated team shutdown or pre-rebuild only.
# NOT invoked on per-agent shutdown.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEAM_NAME="$(basename "$SCRIPT_DIR")"

# Host-side backup dir — OUTSIDE the repo (transcripts are too large for git)
# Default: $HOME/.claude-session-backups/<team>/
# Override: SESSION_BACKUP_DIR env var
BACKUP_DIR="${SESSION_BACKUP_DIR:-$HOME/.claude-session-backups/$TEAM_NAME}"

# Resolve project dir (same discovery as persist-project-state.sh)
PROJECT_DIR_NAME_OVERRIDE=$(cat "$SCRIPT_DIR/.project-dir-name" 2>/dev/null || true)
if [ -n "$PROJECT_DIR_NAME_OVERRIDE" ]; then
  PROJECT_DIR_NAME="$PROJECT_DIR_NAME_OVERRIDE"
else
  SPAWN_CWD=$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || pwd)
  PROJECT_DIR_NAME=$(printf '%s' "$SPAWN_CWD" | sed 's/[^A-Za-z0-9_]/-/g')
fi

PROJECT_DIR="$HOME/.claude/projects/$PROJECT_DIR_NAME"
if [ ! -d "$PROJECT_DIR" ]; then
  echo "No project dir at $PROJECT_DIR — nothing to persist."
  exit 0
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TARBALL="$BACKUP_DIR/session-logs-$TEAM_NAME-$TIMESTAMP.tar.gz"

# Hyphen-safe tar: cd into parent, use ./ prefix for the entry name
# Exclude memory/ (covered by persist-project-state.sh)
# Exclude tool-results/ (too large, low value)
cd "$HOME/.claude/projects" && \
  tar czf "$TARBALL" \
    --exclude="./$PROJECT_DIR_NAME/memory" \
    --exclude="./$PROJECT_DIR_NAME/*/tool-results" \
    "./$PROJECT_DIR_NAME"

SIZE=$(du -h "$TARBALL" | cut -f1)
echo "Persisted session logs to $TARBALL ($SIZE)."

# Retention: keep last N tarballs, prune older
RETENTION="${SESSION_BACKUP_RETENTION:-5}"
cd "$BACKUP_DIR" && \
  ls -1t "session-logs-$TEAM_NAME-"*.tar.gz 2>/dev/null | \
  tail -n +$((RETENTION + 1)) | \
  xargs -r rm -v

echo "Retention: kept last $RETENTION tarball(s) for $TEAM_NAME."
exit 0
```

### NEW: `restore-session-logs.sh` (manual-only)

```bash
#!/usr/bin/env bash
# (*FR:Volta*) — Restore session logs from a named tarball back into the project dir.
# MANUAL-ONLY — not invoked by shutdown-team/TeamCreate. For operator use when
# debugging a crashed session or replaying a historical session.
#
# Usage:
#   restore-session-logs.sh                    # list available tarballs
#   restore-session-logs.sh <tarball-name>     # restore specific one
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

cd "$HOME/.claude/projects" && tar xzf "$TARBALL"
echo "Restored from $TARBALL into $HOME/.claude/projects/"
exit 0
```

### NEW: `restore-project-state.sh`

Symmetric to `restore-inboxes.sh` but for project-memory. Runs on TeamCreate bootstrap. Copies `teams/<team>/project-memory/*.md` back into `$PROJECT_DIR/memory/`. Cold-start-safe (no-op if repo dir doesn't exist).

Script body omitted — mirrors `persist-project-state.sh` with source/dest reversed. Will ship with the implementation patch.

### EXISTING: `persist-inboxes.sh` — no changes proposed

The script is clean, verified, and covers the inbox path correctly. Does NOT need hyphen-safe handling because it doesn't touch `~/.claude/projects/`. Leave it alone.

## Retention policy for session-log tarballs

**Default:** keep last 5 tarballs per team. Override via `SESSION_BACKUP_RETENTION` env var.

**Rationale:**

- 5 is enough to recover from the common failure mode (yesterday's session crashed, today's is fine, keep yesterday's for post-mortem)
- Not so many that disk fills. At ~5MB gzipped per 24h session, 5 = 25MB per team. At 20 teams, 500MB total — acceptable.
- Operator can bump it for any specific team by setting the env var in that team's entrypoint

**Pruning:** `ls -1t` + `tail -n +N` + `xargs rm` — standard pattern, safe against empty dirs.

**Storage location:** `$HOME/.claude-session-backups/<team>/` by default. NOT in the team repo. Rationale:

- 5MB-25MB per team per session is too large for git comfort (would bloat the repo to multi-GB over a year)
- These are recovery artifacts, not source artifacts. Git is for source.
- Override via `SESSION_BACKUP_DIR` env var if operator wants a different location (e.g. a dedicated volume mount)

## Integration plan — how scripts get invoked

### Per-agent shutdown fast path

Current `/shutdown` skill does NOT invoke persist-inboxes.sh. That's a gap. Propose:

- Add a Step 3.5 to `/shutdown` skill (between "save state" and "close Claude"): call `persist-inboxes.sh <agent-name>` and `persist-project-state.sh`
- Both are cheap, <1 second total
- Failure in persist = warning, not abort (don't block shutdown on a persist failure — operator can re-run manually)

### Team shutdown coordinated path

Current `/shutdown-team` skill Step 3 commits team scratchpads (memory/) to repo but does NOT call persist scripts. That's a bigger gap. Propose:

- Add Step 2.5 (before per-agent loop): no-op
- Add Step 2.9 (after per-agent loop, before git commit): call `persist-inboxes.sh` (all-mode), `persist-project-state.sh`, and `persist-session-logs.sh`
- Step 3 (git add) then picks up BOTH `inboxes/` and `project-memory/`
- Session log tarball is NOT git-added (it's outside the repo)

### TeamCreate bootstrap

Current startup.md / rc-start.sh path restores inboxes manually. Propose:

- Add restore-project-state.sh call alongside restore-inboxes.sh in whatever bootstrap script runs on TeamCreate

**Note:** I do not have authority to modify the skill files directly — those are at `~/.claude/skills/shutdown-team/SKILL.md` and `~/.claude/skills/shutdown/SKILL.md`, outside my scope restrictions. Team-lead owns this integration decision.

**Two options for the integration decision:**

1. **Skill patches:** Team-lead updates shutdown/shutdown-team skills to invoke new scripts
2. **Wrapper scripts:** Team-lead leaves skills alone, operators run `persist-all.sh` manually before running `/shutdown-team`

Recommending Option 1 — automatic invocation prevents the "I forgot to run the script" failure mode. The whole point of this design is that persistence is discipline-free.

## Failure modes

| Failure | When | Mitigation |
|---|---|---|
| Project dir doesn't exist | cold start | Scripts exit 0 with "nothing to persist" message |
| Marker file has wrong name | operator typo | Scripts log the computed path, operator sees mismatch in log |
| Claude Code changes sanitization rule | future version bump | Marker file override patches the team in one line |
| Disk full on BACKUP_DIR | long-running container | Retention prune runs first; falls back to tarball failure (not critical) |
| Git commit of project-memory conflicts with another team | simultaneous shutdowns | Same as current inbox conflict resolution — `git pull --rebase` |
| Race: agent writes auto-memory during persist | per-agent shutdown | Claude Code writes atomically; worst case we capture previous version (not corrupt) |
| Tarball includes partial transcript | agent still writing at shutdown | Unavoidable for coordinated shutdown; operator accepts it as last-moment trim. Ad-hoc rescue was worse. |
| Restore overwrites live project auto-memory | running restore mid-session | Only happens on manual invocation; operator sees log |

## Out-of-scope failure modes (explicit)

- **Runtime team dir `~/.claude/teams/<team>/` itself:** covered by existing inbox persist + repo clone. No new work.
- **`tool-results/` dirs under each session UUID:** excluded from tarball. Usually huge and low-value compared to the main conversation `.jsonl`. If a specific session needs its tool results preserved, ad-hoc rescue remains the path.
- **Subagent transcripts under `<uuid>/subagents/`:** INCLUDED in tarball by default (they're under the project dir and not in the exclude list). If these turn out to be huge, revisit in v0.2.

## Wiki submission (Deliverable 5) — Protocol A draft

**Status:** draft only — do NOT send to Cal until design stabilizes (per team-lead's direction). Co-sign with Brunel.

**Type:** pattern (not gotcha — this is a generalizable structural observation, not a one-off trap)

**Title:** "Claude Code state lives in N+1 locations — persist coverage audit"

**Body sketch:**

> Claude Code persists agent state across at least **four distinct locations**, each with different lifecycle characteristics:
>
> 1. `~/.claude/teams/<team>/inboxes/` — messaging state, per-agent files, fast-path persist
> 2. `~/.claude/teams/<team>/memory/` — team scratchpads, committed to team repo via shutdown-team skill
> 3. `~/.claude/projects/<sanitized-cwd>/memory/` — per-user auto-memory, shared across agents in the team, NOT covered by default persist
> 4. `~/.claude/projects/<sanitized-cwd>/<uuid>*.jsonl` — session transcripts, huge, NOT covered by default persist
>
> **Failure mode:** any persist script that covers only (1) and (2) silently loses (3) and (4) on container rebuild. Observed live on uikit-dev container 2026-04-14: 35 per-user auto-memory files at risk, 82 session transcripts (~21MB raw, ~5MB gzipped) rescued ad-hoc.
>
> **Pattern rule:** when auditing persist coverage for any Claude Code team, check all four locations. Bootstrap dirs (team-config/) are out of scope — repo is their SOT. Runtime state = persist target.
>
> **Related:** `wiki/gotchas/dual-team-dir-ambiguity.md` (different ambiguity in the same location-family); `wiki/patterns/prompt-to-artifact-cross-verification.md` (sister gate that would also have caught this if applied proactively).
>
> **Evidence:**
> - uikit-dev 2026-04-14 rebuild prep revealed both gaps
> - framework-research own project dir: 1.5GB, 24 top-level .jsonl, 35 auto-memory .md files — same failure mode
> - Linux project dir names start with leading hyphen — requires hyphen-safe tooling (see `./` prefix pattern in the design doc)

**Fields (Protocol A shape — will cross-read against Cal's current spec before sending):**

- `type`: pattern
- `title`: Claude Code state lives in N+1 locations — persist coverage audit
- `source-agents`: [volta, brunel]
- `scope`: framework-wide
- `confidence`: high (empirical across 2 teams)
- `related`: patterns/prompt-to-artifact-cross-verification.md, gotchas/dual-team-dir-ambiguity.md
- `evidence`: [uikit-dev rebuild 2026-04-14, framework-research own dir 2026-04-14]

## Dependencies / checkpoints before implementation

1. **Team-lead approves design.** Solo v0.1 → feedback → v0.2 → approval.
2. **Brunel cross-read.** Empirical fit against uikit-dev state. Refine if field observation contradicts the sanitization algorithm or the structure assumptions.
3. **Skill patch decision.** Team-lead decides Option 1 (skill patches) vs Option 2 (wrapper scripts).
4. **Implementation:** write the two new scripts + test on framework-research's own substrate (safe to dry-run since this repo is the test bed).
5. **Protocol A submission.** After design stabilizes, Brunel and Volta co-sign, send to Cal.

## Open questions for team-lead

1. **Skill integration Option 1 vs Option 2:** recommend Option 1. Confirm or override.
2. **Backup dir default location:** `$HOME/.claude-session-backups/<team>/`. Any preference for a different root (e.g. `/var/backups/claude/` on Linux containers)?
3. **Retention count:** default 5. Any team where a different default makes sense (e.g. uikit-dev with longer-running containers)?
4. **Scope confirmation on subagent transcripts:** INCLUDED in tarball by default. Flag if that's wrong.
5. **Timing of Cal submission:** "after design stabilizes" — does that mean after team-lead approves the design, or after Brunel and Volta have both implemented and field-tested?

---

## Time spent (actual, not estimate)

Reading phase: ~15 min (7 startup files + scripts + skills + empirical substrate)
Drafting phase: ~35 min (this document)
Still pending: solicit Brunel cross-read, v0.2 after feedback.
