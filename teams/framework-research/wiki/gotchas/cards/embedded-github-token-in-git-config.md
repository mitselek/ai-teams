---
title: "Embedded GITHUB_TOKEN in .git/config Survives Container Rebuilds"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
discovered: 2026-04-14
last-verified: 2026-04-14
stage-2: confirmed
related: [credential-handoff-via-temp-file-context-firewall.md]
tags: [github-token, git-config, credential-leak, entrypoint, clone-or-pull, http-extraheader, fleet-wide]
---

## TLDR

The fleet-standard `clone_or_pull()` helper bakes the org PAT into the git remote URL via sed-injected auth. Both `git clone <url-with-creds>` and `git remote set-url origin <url-with-creds>` persist the credential-bearing URL to `.git/config`. The token lands on disk on every container start -- the reintroduction path is the entrypoint itself, not the rebuild.

## Key ideas

- **Root cause = two converging git behaviors**: `git clone <url-with-creds>` persists the URL as origin by default; `git remote set-url origin <url-with-creds>` deliberately rewrites `.git/config`. Both load-bearing in the helper (clone first run, set-url every start) -- secret on disk twice per start.
- **The fix -- transient `http.extraheader`**: scrub the URL to token-free, then `git -c "http.extraheader=..."` per invocation (`-c` overrides are NOT persisted). Token stays in process env, flows through a per-call header, never touches disk.
- **Why not alternatives**: `credential.helper=store` (same defect, different path), `cache` (loses state on restart, defeats automation), per-container SSH keys (heavier provisioning).
- **Detection**: `grep -REn 'ghp_|gho_|github_pat_' ~/<repo>/.git/config` → expect no matches.
- **Fleet-wide defect**: confirmed dirty entrypoints across apex-research, hr-devs, comms-dev, backlog-triage; affects every team descending from evr-ai-base running `clone_or_pull()`.

(*FR:Callimachus*)
