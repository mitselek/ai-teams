---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-28
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: high
source-files:
  - designs/deployed/apex-research/container/entrypoint-apex.sh
  - designs/new/backlog-triage/container/entrypoint-backlog-triage.sh
source-commits: []
source-issues: []
related:
  - embedded-github-token-in-git-config.md
  - network-mode-host-gives-zero-isolation-from-sibling-containers.md
  - authorized-keys-comment-is-not-evidence-of-ownership.md
  - ../patterns/credential-handoff-via-temp-file-context-firewall.md
  - auto-tmux-bashrc-hook-makes-bare-shell-unreachable.md
---

# The Standard Entrypoint Writes Credentials Cleartext into the Login User's `.bashrc`

**Gotcha (team-wide, high confidence, structural).** The standard FR entrypoint persists compose env vars into the container user's `.bashrc` in cleartext, **tokens included.**

**It exists for a real reason.** Compose `environment:` does not reach SSH shells or `sudo su` shells, and agents need the variables in *every* shell. The step is not sloppiness; it is solving a genuine problem.

**The latent assumption is that whoever can log in as the container user is the person the credentials belong to.** That has been true of every FR container to date, because the only human logging in was the credential owner.

**It breaks the moment a container is operated by someone else.** `cat ~/.bashrc` hands them the injected tokens, **with no privilege boundary to cross** -- the login user *is* the agent user, by design. There is nothing to escalate.

## Remedy -- and the anti-remedy, named explicitly

**Remedy: per-person credentials, not obfuscation.** If the operator is not the credential owner, the credentials in that container must be the operator's own. Every other treatment leaves the same file readable by the same account.

**Anti-remedy, and it is the obvious first move:** do **NOT** "fix" this by removing the vars from `.bashrc`. That breaks the SSH-shell and agent paths the step exists to serve, and the failure will look like an unrelated tooling problem in a later session. **The defect is in the trust assumption, not in the mechanism** -- the mechanism is doing exactly what it was built to do.

## Why the assumption is invisible

Nothing in the entrypoint states the assumption, and nothing tests it. The step is written once, inherited by every subsequent container template, and the condition that makes it safe -- *single operator who owns the credentials* -- is a property of the **deployment**, not of the code. So a copy of a working entrypoint carries a safety condition it does not mention, into a deployment that may not satisfy it.

Compare [`embedded-github-token-in-git-config.md`](embedded-github-token-in-git-config.md): the same shape in a different file, filed separately because the write path, the file, and the remedy surface all differ. Cross-linked, not merged.

## Evidence

- `entrypoint-apex.sh:380-405` -- `SHELL_VARS` carries `GITHUB_TOKEN` and `ATLASSIAN_API_TOKEN`; `sed -i` delete then `echo export`.
- `entrypoint-backlog-triage.sh:229-260` -- mirrored.
- Surfaced while designing a **colleague-operated** container (2026-08-28); the resolution there was to make every credential the operator's own rather than to alter the mechanism.

## Revision trigger

The entrypoint template changing how it persists env vars, or the fleet adopting a credential store that removes the need. **Not a sighting count** -- the mechanism is designed and unchanged; what varies is whether a given deployment satisfies the single-operator condition.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
