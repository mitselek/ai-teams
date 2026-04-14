---
status: draft
title: Embedded GITHUB_TOKEN in .git/config — fix recipe
doc_id: uikit-dev-embedded-token-fix-2026-04-14
author: Brunel (*FR:Brunel*)
version: 1.0.0
---

# Embedded GITHUB_TOKEN in .git/config — fix recipe (uikit-dev)

## Status

**Draft — NOT YET DELIVERED.** uikit-dev is a live team with in-flight sessions. This recipe must be applied by the uikit-dev team lead at their next shutdown or session boundary, coordinated by framework-research team-lead (Aen). Do not SSH into the container or intervene live.

## Problem

The uikit-dev container stores the organization PAT in plaintext inside the `evr-ui-kit` clone's `.git/config`:

```
[remote "origin"]
    url = https://ghp_<redacted>@github.com/Eesti-Raudtee/evr-ui-kit.git
```

The token is not publicly leaked (dev server with controlled SSH), so PO has explicitly said **rotation is NOT required**. The defect is the **fragile pattern**: a secret lives in plaintext on-disk, and it is reintroduced on every container start.

## Root cause

Every team container I built for the evr-ai-base fleet uses the same `clone_or_pull` helper in its entrypoint. Reference implementation (`mitselek-ai-teams/designs/deployed/apex-research/container/entrypoint-apex.sh:37-56`):

```bash
clone_or_pull() {
    local repo_url="$1"
    local target_dir="$2"
    local auth_url

    auth_url=$(echo "$repo_url" | sed "s|https://|https://${GITHUB_TOKEN}@|")

    if [ -d "${target_dir}/.git" ]; then
        echo "[entrypoint] ${target_dir} exists — running git pull..."
        gosu "${CONTAINER_USER}" git -C "${target_dir}" remote set-url origin "${auth_url}"
        gosu "${CONTAINER_USER}" git -C "${target_dir}" pull --ff-only || { ... }
    else
        echo "[entrypoint] First run — cloning ${repo_url} to ${target_dir}..."
        mkdir -p "${target_dir}"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "${target_dir}"
        gosu "${CONTAINER_USER}" git clone "${auth_url}" "${target_dir}"
    fi
}
```

Two reintroduction paths:

1. **First-run path** (line 54, `git clone "${auth_url}"`): git persists the clone URL as `origin` in `.git/config`. Embedded token lands on disk immediately.
2. **Existing-repo path** (line 46, `git remote set-url origin "${auth_url}"`): **every** container start rewrites `origin` to the embedded-token form, even if a prior cleanup wiped it. This is why "survives rebuilds" — the repo is in a named volume (`*-repo`), and on every `docker compose up` the entrypoint re-asserts the dirty URL.

The evr-ai-base image itself is clean. The bug is entirely in the team-specific entrypoint.

## Fix recipe

### Part A: Source patch (prevents reintroduction on next rebuild)

Refactor `clone_or_pull` so that the token is passed transiently via `git -c http.extraheader`, never written to `.git/config`.

**Patch target (conceptual — uikit-dev's entrypoint lives on the host that built it; the same shape must be applied wherever that file is canonically stored):**

```bash
clone_or_pull() {
    local repo_url="$1"
    local target_dir="$2"

    # Token flows through a transient HTTP header, not the URL.
    # Header is scoped to the single git invocation and never persisted.
    local auth_header="Authorization: Basic $(printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64 -w0)"

    if [ -d "${target_dir}/.git" ]; then
        echo "[entrypoint] ${target_dir} exists — running git pull..."
        # Ensure origin is token-free (fix any pre-existing dirty config)
        gosu "${CONTAINER_USER}" git -C "${target_dir}" remote set-url origin "${repo_url}"
        gosu "${CONTAINER_USER}" git -C "${target_dir}" \
            -c "http.extraheader=${auth_header}" \
            pull --ff-only || {
            echo "[entrypoint] WARNING: git pull failed. Using existing state."
        }
    else
        echo "[entrypoint] First run — cloning ${repo_url} to ${target_dir}..."
        mkdir -p "${target_dir}"
        chown "${CONTAINER_UID}:${CONTAINER_GID}" "${target_dir}"
        gosu "${CONTAINER_USER}" git \
            -c "http.extraheader=${auth_header}" \
            clone "${repo_url}" "${target_dir}"
    fi
}
```

**Why `http.extraheader` and not a credential helper or SSH deploy key:**

- **Credential helper (`store`/`cache`)** writes the token to a file under `~/.git-credentials` — same class of defect, different path. Doesn't solve "secret on disk in a persisted volume".
- **SSH deploy key** means generating a per-container keypair and registering it with the org — extra provisioning surface, and per-container keys are not the current fleet pattern.
- **`http.extraheader`** uses a process-local `-c` override that git does not persist to `.git/config`. The token is in the process environment (already true via compose) and flows through a per-invocation header. Zero on-disk footprint.
- For push operations that the team performs via `gh` CLI, `gh auth login --with-token` (stdin-fed from `$GITHUB_TOKEN`) can be added as a separate hardening step, but is out of scope for this recipe — the immediate defect is the clone URL.

The `git remote set-url origin "${repo_url}"` in the existing-repo branch is load-bearing: it **scrubs** any leftover embedded-token URL from prior container generations. Keep this line even after the patch ships so that old volumes get cleaned on first post-patch start.

### Part B: One-shot in-container rewrite (cleans current live state)

**To be executed by the uikit-dev team lead at next shutdown or session boundary**, not by framework-research and not live-session. This only scrubs existing `.git/config` — the Part A source patch is still required to prevent re-embedding on the next rebuild.

```bash
# 1. Confirm the dirty state (expect: URL contains 'ghp_' or 'gho_')
cd ~/dev/evr-ui-kit
git remote -v

# 2. Rewrite origin to the token-free HTTPS URL (same scheme, no user:token@)
git remote set-url origin https://github.com/Eesti-Raudtee/evr-ui-kit.git

# 3. Verify the rewrite
git remote -v
grep -E '^\s*url\s*=' .git/config
# Expected: url = https://github.com/Eesti-Raudtee/evr-ui-kit.git   (no ghp_/gho_)

# 4. Smoke-test fetch using process-env token via http.extraheader
AUTH_HEADER="Authorization: Basic $(printf 'x-access-token:%s' "${GITHUB_TOKEN}" | base64 -w0)"
git -c "http.extraheader=${AUTH_HEADER}" fetch --dry-run origin

# 5. Optional — test a push (use an existing temp branch, do NOT touch main/develop)
#    Only if the team has a throwaway branch to push against:
# git -c "http.extraheader=${AUTH_HEADER}" push origin <temp-branch>
```

Step 1 is idempotent and safe. Step 2 overwrites `origin` in `.git/config`; git handles this atomically. Step 4 confirms the token still works via the transient header path. Step 5 is optional and should only be run against a throwaway branch — do NOT test against `main` or `develop`.

### Part C: Verification (after next container rebuild ships Part A)

```bash
# After the patched entrypoint has been deployed and the container restarted:
grep -E 'ghp_|gho_|github_pat_' ~/dev/evr-ui-kit/.git/config
# Expected: no matches (exit 1)

# Confirm clean URL
git -C ~/dev/evr-ui-kit remote -v
# Expected: origin  https://github.com/Eesti-Raudtee/evr-ui-kit.git (fetch/push)

# Confirm pull still works via process env + http.extraheader
git -C ~/dev/evr-ui-kit pull --ff-only
# Expected: "Already up to date." or fast-forward merge; no auth prompt
```

## Scope — other containers with the same pattern

Static analysis of local build artifacts confirms the **identical bug** in these 4 entrypoints:

| Team | Entrypoint path | Status |
|---|---|---|
| apex-research | `mitselek-ai-teams/designs/deployed/apex-research/container/entrypoint-apex.sh:42, 46, 54` | **DIRTY** (confirmed in source) |
| hr-devs (containerized) | `VJS2-AI-teams/infrastructure/dockerfiles/hr-devs/entrypoint-hr-devs.sh:73, 77` | **DIRTY** (confirmed in source) |
| comms-dev | `VJS2-AI-teams/infrastructure/dockerfiles/comms-dev/entrypoint-comms-dev.sh:54, 58` | **DIRTY** (confirmed in source) |
| backlog-triage | `VJS2-AI-teams/infrastructure/dockerfiles/backlog-triage/entrypoint-backlog-triage.sh:70, 74` | **DIRTY** (confirmed in source) |

**No local source found for uikit-dev, bioforge-dev, raamatukoi-dev, screenwerk.** These were deployed directly from ad-hoc scripts without a local artifact check-in. Given all four descend from `evr-ai-base` and I built them adapting the same template, they are almost certainly **DIRTY by inheritance**. Definitive confirmation requires either (a) reading the entrypoint file inside each container (blocked by the live-team guardrail for uikit-dev; safe for others at PO discretion), or (b) finding where those scripts are stored.

**Base image `Dockerfile.evr-ai-base` is CLEAN** — no token handling at layer time.

**The apex-research cross-check is the most actionable**: apex-research has full source in `designs/deployed/apex-research/container/`, and apex-research is also live. Same Part A patch + Part B one-shot applies, using `~/workspace` as the target dir instead of `~/dev/evr-ui-kit`.

## Failure modes & caveats

- **If `GITHUB_TOKEN` becomes unset**, the patched code path fails louder than the current code (no URL rewrite means git asks for credentials and blocks). The `[ -z "${GITHUB_TOKEN:-}" ]` validation earlier in the entrypoint already guards this, so this is not a regression.
- **If a user has their own clone elsewhere in the container** (e.g., `~/.cache/...` or another dev dir), this recipe only cleans `~/dev/evr-ui-kit`. Additional clones must be located and rewritten the same way. A `grep -r 'ghp_\|gho_\|github_pat_' ~/ 2>/dev/null` is a cheap final check.
- **Git sub-modules** in `evr-ui-kit` (if any) also carry `.git/config` — check `.git/modules/*/config` too.
- **The `remote set-url ... "${repo_url}"` scrub line** in Part A must be kept even after the fleet is clean. It is the defense against a regression where someone manually re-embeds a token.

## Open questions

- Where is the uikit-dev entrypoint source canonically stored? If it's only on the build host and not in version control, that is a **separate bootstrap gap** that should be tracked independently. Same question applies to bioforge-dev, raamatukoi-dev, screenwerk.
- Should the `http.extraheader` pattern be promoted to `Dockerfile.evr-ai-base` as a shared `clone_or_pull` library function, so new team containers inherit the clean pattern by default? I recommend yes, but that is a follow-up.

## Delivery plan (not for Brunel to execute)

1. Framework-research team-lead (Aen) reviews this recipe.
2. Aen coordinates with uikit-dev team lead to pick a session boundary.
3. At that boundary: uikit-dev team lead applies Part B one-shot inside the container.
4. Source patch (Part A) ships as a separate commit to whatever repo owns the uikit-dev entrypoint, and is applied to all dirty teams in a coordinated pass.
5. Part C verification runs after each team rebuilds.

(*FR:Brunel*)
