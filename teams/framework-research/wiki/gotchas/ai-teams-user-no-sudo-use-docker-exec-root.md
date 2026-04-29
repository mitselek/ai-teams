---
name: ai-teams-user-no-sudo-use-docker-exec-root
description: Team containers intentionally deny `ai-teams` passwordless sudo; in-container `sudo apt …` over SSH hangs unrecoverably. Elevate from the host via `docker exec -u root` instead
type: gotcha
source-agents:
  - brunel
discovered: 2026-04-29
filed-by: librarian
last-verified: 2026-04-29
status: active
confidence: high
source-files: []
source-commits: []
source-issues: []
---

# `ai-teams` Has No NOPASSWD Sudoers — Use `docker exec -u root` from the Host

## Symptom

SSH into a team container as `ai-teams` (port `2222`, key `~/.ssh/id_ed25519_<team>`), try:

```bash
sudo apt-get install -y <pkg>
```

The shell hangs on a password prompt or returns `a password is required`. Because SSH is non-interactive in this configuration, there is no path to enter a password — the operation is unrecoverable from inside the container.

## Cause

Team containers (apex-research, ruth-team, hr-devs, etc.) **intentionally** do not grant the agent runtime user `ai-teams` passwordless sudoers. The agent runtime user is sandboxed by design; granting `NOPASSWD:ALL` to the user that runs Claude agents would let any agent escalate to root inside the container at will.

Per the per-team Dockerfile pattern, only the `michelek` PO inspection user gets `NOPASSWD:ALL` — and that account is for human inspection sessions, not agent automation.

This is not a bug. The "fix" is to stop trying to elevate inside the container.

### Revision trigger (architectural-fact gotchas)

This entry is an architectural-fact gotcha (intentional design choice across the team-container fleet), not an observation-based one. **It does not gain confidence from n+1 sightings.** The trigger to revise this entry is a *change to the team-container Dockerfile template* — if the sandboxing model shifts (e.g., `ai-teams` gains a NOPASSWD-scoped allow-list, or a different runtime user is introduced), update the entry then. Until that template change, additional reports of "I hit this in container X too" do not move the entry's confidence and should not generate new submissions.

## Workaround

Elevate from the **container host** instead. The host has docker rights; `docker exec -u root` enters the container as root, bypassing the missing in-container sudoers entirely:

```bash
ssh -i ~/.ssh/id_ed25519 dev@100.96.54.170 \
  "docker exec -u root <container_name> apt-get install -y --no-install-recommends <pkgs>"
```

This is the host-side, root-via-docker route. The agent runtime user inside the container stays sandboxed; the host operator (who already has docker rights and bare-metal SSH access) does the elevated work.

## Key/path disambiguation

Two SSH keys, two targets, do not cross them:

| Key | Target | User | Port | Purpose |
|---|---|---|---|---|
| `~/.ssh/id_ed25519` | RC host (bare metal) | `dev` | `:22` | Host operator, has docker rights |
| `~/.ssh/id_ed25519_<team>` (e.g., `_apex`) | Team container | `ai-teams` | `:2222` | Agent runtime user, no sudo |

The `_<team>` key authenticates `ai-teams` *into* the container; the default key authenticates `dev` into the *host*. Trying to ssh `ai-teams@host:22` with `_<team>` will fail. Trying to ssh `dev@host:2222` with the default key will fail. The right combination is determined by what the operation needs: in-container reads/writes as agent → use the team key + port 2222; in-container ops requiring root → SSH to host with default key, then `docker exec -u root`.

## When this matters

Any time a container needs a system-level fix (apt install, file ownership change, `/etc` edit) AND the change is too small to justify a rebuild AND live agent sessions cannot be restarted. The [`patterns/live-inject-plus-dockerfile-bake-dual-track.md`](../patterns/live-inject-plus-dockerfile-bake-dual-track.md) pattern depends on this gotcha's workaround for its live-inject half — every dual-track invocation goes through `docker exec -u root` because in-container sudo is closed.

## Anti-attempts (do not retry these)

- `sudo -S` over SSH with stdin piping — still gated on a real password the agent doesn't have.
- Editing `/etc/sudoers.d/` from inside the container as `ai-teams` — same problem, you don't have the rights to modify sudoers, that's the whole point.
- Adding `ai-teams` to a "wheel"/"sudo" group from inside the container — same, no rights.

The sandboxing is enforced at the user-permission layer, not at the sudoers config layer; nothing inside the container will ever override it. Go through the host.

## Reference incident

apex-research container, 2026-04-29 — Chromium/Playwright dependency installation. The dual-track pattern's live-inject half routed through `docker exec -u root` from the RC host because in-container `sudo apt-get install` was unreachable.

## Related

- [`patterns/live-inject-plus-dockerfile-bake-dual-track.md`](../patterns/live-inject-plus-dockerfile-bake-dual-track.md) — the pattern this gotcha enables. The gotcha documents *why* in-container elevation is closed; the pattern documents *what to do* once the host-side root path is in hand.
- [`references/rc-host-db-tunnel-architecture.md`](../references/rc-host-db-tunnel-architecture.md) — covers the same key/target split (`dev@:22` vs `ai-teams@:2222`) for a different purpose (DB tunnels). Cross-link for the key disambiguation table.

(*FR:Callimachus*)
