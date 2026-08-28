# `joosep` -- personal workbench container (build package)

A per-colleague container on RC `100.96.54.170` for **Joosep Madar** (Eesti Raudtee), giving him a
scoped, disposable workspace to run his own AI agent team.

**Status:** DESIGNED, not built. Nothing in this package has been executed and no host state has been
modified. Provisioning needs PO sanction; the steps are in `PROVISIONING-RUNBOOK.md`.

**Design rationale and the full decision register:**
[`teams/framework-research/docs/joosep-container-design-2026-08-28.md`](../../../teams/framework-research/docs/joosep-container-design-2026-08-28.md)

## Contents

| File | Role |
|---|---|
| `docker-compose.yml` | service definition; carries the host port-allocation table |
| `Dockerfile` | self-contained `debian:bookworm-slim` image |
| `entrypoint.sh` | boot: CA, volumes, env, repos, MCP, sshd, session launcher, validation |
| `.env.example` | credential template — **derived from the compose `environment:` block** |
| `joosep.sh` | host-side launcher (`build`/`up`/`down`/`restart`/`logs`, bare = shell) |
| `Connect-Joosep.ps1` | Joosep's Windows connection script, one file, `-Session` switch |
| `registry-rows.md` | the four registry records to update, and why there are four |
| `PROVISIONING-RUNBOOK.md` | Hopper-executable, EXPECT + STOP per step, with rollback |

`authorized_keys` is **not** in this package — it holds real public keys and is created on the host at
runbook Step 4.

## Shape, in one paragraph

Templated on **`allerk`** (Lerko's workbench at `/home/dev/allerk`, built 2026-08-18), not on
`apex-research`, per the PO ruling of 2026-08-28. allerk is *person*-shaped where apex is *team*-shaped:
whole-`$HOME` volume, a separate `work` volume mounted over it, a bind-mounted `authorized_keys`
re-read on every start, a host-side launcher, and resource ceilings. apex contributes only the
agent-team parts — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `TEAM_NAME`, and the `settings.json` /
`mcp.json` seeding steps.

One consequence worth knowing: **volumes are named for the person** (`joosep_home`, not
`<team>_<team>-claude-home`), so the AI team's name lives only in a directory inside the home volume.
Renaming the team later is a `mv`, not a volume migration.

## The two connection modes

This is the requirement the design is shaped around: **bare lands in a shell, `-Session` lands inside
the running Claude session.**

```powershell
Connect-Joosep            # plain bash shell in the container
Connect-Joosep -Session   # attached to the Claude session; Ctrl-b d detaches, Claude keeps running
```

Two things make that work, and both are easy to break:

1. **No `.bashrc` auto-tmux hook.** The pattern used by `backlog-triage` and `hr-devs` hijacks every
   interactive SSH login and `exec tmux attach`, which makes a bare shell unreachable *by construction*.
   The session is entered by an explicit remote command instead. Adding the hook back would defeat the
   switch **silently** — it produces a successful-looking session, not an error.
2. **`SetEnv PATH` in `sshd_config`.** `-Session` runs its launcher as an ssh *remote command* — a
   non-interactive, non-login shell. Three PATH sources exist (`.bashrc` for interactive shells, image
   `ENV` for `docker exec`, sshd's compiled-in PATH for remote commands), and **Debian's `.bashrc`
   returns early when not interactive**, so neither of the two obvious levers reaches this case. Without
   `SetEnv`, `-Session` fails with `claude: command not found` while a bare login works fine. The
   entrypoint's Step 11 checks for this explicitly.

## First run, for Joosep

1. Ensure **Cloudflare WARP** is connected (`warp-cli status`). RC is reachable only over the WARP
   overlay — not Tailscale; EVR does not use it.
2. `ssh-keygen -t ed25519 -f $HOME\.ssh\id_ed25519_joosep -C "joosep@evr"`, then send the **`.pub`**
   line to Mihkel. The private key never leaves your machine.
3. Mihkel adds it and sends you the container's **host-key fingerprint** out of band.
4. Run `Connect-Joosep`. Accept the host key **only after comparing it** to the fingerprint you were
   sent. You will see this prompt once and never again — if it reappears later, stop and ask rather
   than clearing `known_hosts`.
5. In that shell, run `claude` and complete the OAuth device flow in your browser. Credentials persist
   across restarts and rebuilds.
6. From then on: `Connect-Joosep -Session`.

## What this container is, and is not

> **It is not a security boundary.** allerk's README states the general case, and it applies here:
> membership in the host `docker` group is equivalent to root on the host, so a container
> *"separates configuration, not privilege."* For a real boundary between users the answers are
> rootless Docker or separate Linux accounts — neither is in scope here.

What it does do is scope a workspace: its own credentials, its own state, rebuildable and disposable
without touching anything else. The scoping choices (no Docker socket, no other team's volumes, no
fleet private keys, no Cloudflare credentials, no credential-store access) are real and worth keeping —
they are just conveniences and blast-radius reduction, not containment.

**One exception, and it is a genuine safety control rather than scoping.** The Elron/PONY message
tooling can emit into a **live railway dispatch system**. Commit `39f16a83` (2026-08-26) removed the
`isTest` toggle entirely and the server now always sends `isTest=false`, so any guardrail phrased in
terms of that flag is describing a mechanism that no longer exists. The as-built guardrail is
**TEST-endpoint-only routing**, and it holds only while **the endpoint URL is not configurable from
inside the container**. Do not reference `isTest` in any prompt, roster, or policy file here.

## Validation state of this package

Honest accounting of what has and has not been checked, since none of it has been run:

| Artifact | Checked | How |
|---|---|---|
| `entrypoint.sh`, `joosep.sh` | syntax **PASS** | `bash -n` |
| `Connect-Joosep.ps1` | syntax **PASS** | PowerShell tokenizer, 0 errors |
| `docker-compose.yml` | **NOT VALIDATED** | Docker is not available on the authoring machine. Runbook **Step 4b** runs `docker compose config --quiet` on the host before the build for exactly this reason |
| `Dockerfile` | **NOT BUILT** | first real test is runbook Step 5 |
| Runtime behaviour | **NOT RUN** | runbook Steps 6-11 are the acceptance suite |

Nothing here has touched the host.

## Known gaps

- **Confluence is not covered.** The seeded `mcp.json` uses dev-toolkit's stdio Jira MCP server — the
  proven in-fleet mechanism, driven by the `ATLASSIAN_*` env vars. The research brief also wants
  Confluence read plus write-to-VJS2, which needs the plugin/connector path and is a first-run
  interactive step an entrypoint cannot seed. **Do not assume Confluence works because Jira does.**
- **Team roster not yet defined.** Seven candidate roles are proposed in the brief against a six-role
  reference shape; sizing is `[PO-16]`. The container does not depend on the answer.
- **No backup.** No container on this host has one, and `joosep_home` would hold the OAuth credentials
  and every scratchpad. `docker compose down -v` destroys it — `joosep.sh down` refuses `-v` for that
  reason, but the underlying docker command does not.

(*FR:Brunel*)
