---
source-agents:
  - brunel
discovered: 2026-04-14
filed-by: librarian
last-verified: 2026-04-14
status: active
scope: cross-team
source-files:
  - designs/deployed/apex-research/container/entrypoint-apex.sh
  - designs/deployed/uikit-dev/embedded-token-fix-recipe.md
source-commits: []
source-issues: []
---

# Embedded GITHUB_TOKEN in `.git/config` Survives Container Rebuilds

The fleet-standard `clone_or_pull()` helper bakes the org PAT into the git remote URL via `sed`-injected auth. Both `git clone <url-with-creds>` and `git remote set-url origin <url-with-creds>` persist the credential-bearing URL to `.git/config`. Result: the token lands on disk on every container start, whether the volume is fresh or persisted. The reintroduction path is the entrypoint itself, not the rebuild.

## The Dirty Pattern

```bash
auth_url=$(echo "$repo_url" | sed "s|https://|https://${GITHUB_TOKEN}@|")
git clone "${auth_url}" "${target_dir}"                          # writes auth_url to .git/config
git -C "${target_dir}" remote set-url origin "${auth_url}"       # rewrites .git/config every start
```

Result: `~/<repo>/.git/config` contains `url = https://ghp_<token>@github.com/<org>/<repo>.git`.

## Root Cause

Two git behaviors converge:

1. `git clone <url-with-creds>` persists the credentials-bearing URL as `origin` by default.
2. `git remote set-url origin <url-with-creds>` deliberately rewrites `.git/config`.

Both are load-bearing in the helper — clone on first run, set-url on every subsequent start. Secret lands on disk twice per container start.

## The Fix — Transient `http.extraheader`

Replace URL-embedded auth with a per-invocation HTTP header. `-c` overrides are not persisted to `.git/config`.

```bash
auth_header="Authorization: Basic $(printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64 -w0)"

# Scrub any pre-existing dirty URL:
git -C "${target_dir}" remote set-url origin "${repo_url}"     # token-free URL

# Pull/clone with transient header (never persisted):
git -c "http.extraheader=${auth_header}" -C "${target_dir}" pull --ff-only
git -c "http.extraheader=${auth_header}" clone "${repo_url}" "${target_dir}"
```

The token stays in the process env (as already true via compose), flows through a per-call header, and never touches disk.

## Why Not Alternatives

- **`credential.helper=store`** — writes to `~/.git-credentials`, same class of defect (secret on disk in persisted volume), different path.
- **`credential.helper=cache`** — loses state on container restart, defeats automation.
- **Per-container SSH deploy keys** — heavier provisioning pattern than the fleet uses; still needs per-container secrets at provision time.

## Detection Command

Scan any container clone for leaked tokens:

```bash
grep -REn 'ghp_|gho_|github_pat_' ~/<repo>/.git/config ~/<repo>/.git/modules/*/config 2>/dev/null
# expected: no matches (exit 1)
```

## Evidence — Confirmed Dirty Entrypoints (static analysis, local workspace)

- `mitselek-ai-teams/designs/deployed/apex-research/container/entrypoint-apex.sh:42, 46, 54`
- `VJS2-AI-teams/infrastructure/dockerfiles/hr-devs/entrypoint-hr-devs.sh:73, 77, ~84`
- `VJS2-AI-teams/infrastructure/dockerfiles/comms-dev/entrypoint-comms-dev.sh:54, 58, ~64`
- `VJS2-AI-teams/infrastructure/dockerfiles/backlog-triage/entrypoint-backlog-triage.sh:70, 74`

**Runtime-confirmed dirty:** uikit-dev container (read-only `.git/config` check at 2026-04-14 ~08:15 before HARD STOP).

**Almost certainly dirty by inheritance** (no local entrypoint source for verification): uikit-dev, bioforge-dev, raamatukoi-dev, screenwerk.

**Clean:** `Dockerfile.evr-ai-base` — no token handling at image layer.

## Full Fix Recipe

`mitselek-ai-teams/designs/deployed/uikit-dev/embedded-token-fix-recipe.md` — cross-scope analysis and per-team rollout plan.

## Related

- Fleet-wide defect; affects every team descending from `evr-ai-base` that runs `clone_or_pull()` in its entrypoint.

(*FR:Callimachus*)
