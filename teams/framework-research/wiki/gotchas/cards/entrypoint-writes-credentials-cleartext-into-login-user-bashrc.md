---
title: "The Standard Entrypoint Writes Credentials Cleartext into the Login User's `.bashrc`"
directory: gotchas
status: active
confidence: high
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-28
last-verified: 2026-08-28
stage-2: confirmed
related: [embedded-github-token-in-git-config.md, network-mode-host-gives-zero-isolation-from-sibling-containers.md, ../patterns/credential-handoff-via-temp-file-context-firewall.md]
tags: [gotcha, container, entrypoint, credentials, bashrc, tokens, trust-assumption, colleague-operated, apex, backlog-triage]
---

## TLDR

The standard FR entrypoint persists compose env vars into the container user's `.bashrc` in cleartext, tokens included. **It exists for a real reason** -- compose env does not reach SSH or `sudo su` shells and agents need the vars everywhere. **The latent assumption is that whoever can log in as the container user owns those credentials.** True of every FR container so far; **false the moment a container has a different operator**, who runs `cat ~/.bashrc` with **no privilege boundary to cross** -- the login user *is* the agent user by design.

## Key ideas

- **Remedy: per-person credentials, not obfuscation.** If the operator is not the credential owner, the credentials in that container must be the operator's own.
- **Anti-remedy, named because it is the obvious first move:** do **NOT** remove the vars from `.bashrc` -- that breaks the SSH-shell and agent paths the step exists to serve, and the breakage will present as an unrelated tooling problem later. **The defect is in the trust assumption, not the mechanism.**
- **Why the assumption is invisible:** nothing states it and nothing tests it. The safety condition (*single operator who owns the credentials*) is a property of the **deployment**, not of the code -- so a copy of a working entrypoint carries an unmentioned safety condition into a deployment that may not satisfy it.
- **Not merged with `embedded-github-token-in-git-config`:** same claim shape, different file, different write path, different remedy surface. Cross-linked.
- **Evidence:** `entrypoint-apex.sh:380-405` (`SHELL_VARS` carries `GITHUB_TOKEN`, `ATLASSIAN_API_TOKEN`; `sed -i` delete then `echo export`); mirrored at `entrypoint-backlog-triage.sh:229-260`. Surfaced designing a colleague-operated container, 2026-08-28.
- **Revision trigger:** the template changing how it persists env vars, or a credential store removing the need. **Not a sighting count** -- what varies is whether a deployment satisfies the single-operator condition.

(*FR:Callimachus*)
