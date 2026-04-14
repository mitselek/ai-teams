---
source-agents:
  - team-lead
discovered: 2026-04-14
filed-by: librarian
last-verified: 2026-04-14
status: active
scope: team-wide
source-files:
  - .claude/teams/framework-research/docs/persist-coverage-design-v0.3.md
source-commits: []
source-issues: []
---

# persist-project-state.sh leaks per-user auto-memory into shared team repos

`persist-project-state.sh` (WIP, Volta, v0.3 design) mirrors each agent's local `~/.claude/projects/<slug>/memory/*.md` into a repo-relative `project-memory/` directory on agent shutdown. The mirror semantics are correct for **container-scoped team repos** (where the "project" is the team container and every operator writes the same project memory) and wrong for **multi-workstation shared team repos** (where each operator has distinct personal auto-memory and the repo is shared).

When the script runs on a workstation against a shared team repo, every shutdown cycle commits the operator's personal `MEMORY.md`, `feedback_*`, `project_*`, `reference_*` files (plus any other `*.md` in the local projects memory dir) into `.claude/teams/<team>/project-memory/`. Next operator pulls and sees another operator's state.

## Observed incident — 2026-04-14

During session 8 (delivery-window freeze), 36 files totalling ~175KB were found untracked in the `mitselek/ai-teams` repo under `.claude/teams/framework-research/project-memory/`. These were the active session operator's personal auto-memory (per-user, machine-specific, not intended for the shared repo). Team-lead deleted all 36 files and the `.project-dir-name` marker (machine-specific slug, also inappropriate for the shared repo) before committing anything.

The script itself had not been run this session — the files were staged by a prior run from a local draft or test invocation. The scope of the leak was caught before commit, but the class of defect is latent for the next operator who drafts or runs the script on a workstation against the same shared repo.

## Root cause

`persist-project-state.sh` assumes its substrate is a single-operator container where the team repo and the project memory are **co-scoped**. On that substrate, the mirror is invariant: every agent in the container is operating on the same team, and the project memory dir holds state that genuinely belongs to the team.

On a multi-workstation shared team repo substrate, the assumption breaks in two directions at once:

1. **Repo scope is team-wide, not operator-wide.** Writing per-operator state into the repo crosses a blast-radius boundary.
2. **Project memory scope is operator-wide, not team-wide.** The local `~/.claude/projects/<slug>/memory/` dir holds the operator's personal auto-memory index and topic files, not team-owned artifacts.

Same code, two substrates, opposite invariants.

## Scope

Any team whose `.claude/teams/<team>/` directory lives in a shared repo AND whose team members run agents on workstations (as opposed to a single dedicated container). The framework-research team is one such team. Other teams using the repo-relative project layout with human operators on workstations are at the same risk.

Teams operating entirely inside a single container (e.g., cloudflare-builders running in its RC container, uikit-dev running in its deployment container) are not affected — the mirror semantics match their substrate by construction.

## Mitigations (for reference — Volta owns the fix)

Three non-exclusive approaches, each with different strengths. Volta will pick, justify, and implement; this entry exists to cite them, not prescribe them.

1. **Container-only runtime guard.** Script detects whether it is running in a container (e.g., presence of `/.dockerenv`, or a marker file planted by the container entrypoint) and refuses to run on bare workstations. Strongest guarantee — the substrate mismatch is detected before any file is touched. Cost: needs a reliable container-detection primitive, and workstation operators occasionally want legitimate dry-run invocations.
2. **`.gitignore` entry covering `project-memory/` AND `.project-dir-name`.** Even if the script mirrors files into the repo-relative path, git never sees them. Both artifacts leaked in the session 8 incident, so both belong in the ignore list — the directory holds the per-user auto-memory, the marker file holds the machine-specific project-dir slug (`C--Users-mihkel-putrinsh-Documents-github` in the incident). Cheap and catches the leak at the git layer rather than the script layer. Weakness: the files still exist on disk and are visible to anyone running `git status`, creating confusion. Does not prevent operators from adding them explicitly with `git add -f`.
3. **Target-dir refusal if it resolves to a git-tracked path.** Script resolves its target directory, walks up to find the nearest `.git`, and aborts with a clear error if the target path is tracked (or trackable) by that repo. Substrate-aware without needing a container-detection primitive. Middle cost.

Layered defense is viable: use `.gitignore` as the cheap backstop AND add a container-only or git-tracked-path guard in the script as the primary. One catches the leak; the other prevents operators from being surprised by the `.gitignore` decision.

## Cross-references

- Design context: `.claude/teams/framework-research/docs/persist-coverage-design-v0.3.md` (Volta, 2026-04-14) — the WIP script specification that exhibits this defect.
- Related gotcha: [`dual-team-dir-ambiguity.md`](dual-team-dir-ambiguity.md) — same class of defect at the team-dir layer. Bare path `.claude/teams/<team>/` resolves to two distinct directories (repo vs runtime) with different invariants; wrong-root writes vanish silently on container rebuild. This entry is the mirror case: wrong-substrate writes go to the right directory but leak per-user state into a shared artifact.

## Why this section exists

Team-lead caught the leak during a session 8 shutdown sweep and filed the gotcha before any workflow could be built around the broken assumption. The fix is not yet implemented — this entry exists so future operators and the fix-implementer (Volta) have a single citable provenance trail, and so any agent drafting or reviewing the script checks this entry before approving the design.

(*FR:Callimachus*)
