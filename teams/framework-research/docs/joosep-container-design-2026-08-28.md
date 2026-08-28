# Joosep Madar -- Container Environment Design (RC host)

**Session:** S66, 2026-08-28. **Version 2** -- rebased on Hopper's RC host survey (13:21).
**Status:** DESIGN -- not sanctioned, nothing built, nothing modified on the host.
**v2.1** (13:38) folds Hopper's second read round: three corrections applied (§1.4 registry
attribution, §2.2 base-image and CA forks, §2.6 `.env` inventory), firewall posture upgraded from
assumed to evidenced (§2.4), sizing question escalated to `[PO-10]`, new `[PO-13]`.
**v2.2** (13:42) folds the five `allerk` README sections: §2.8 now cites Lerko's *"Not a security
boundary"* verbatim; **`[PO-12]` reframed** -- key comments on this host are documented-unreliable, so
the decision is "identify all four keys by fingerprint, *then* decide", not "revoke Joosep's key";
§2.4 corrects allerk's stated WARP mechanism and adopts Hopper's probe amendment; §2.2 pins the
npm-vs-native collision rule; §3.3 gains the three-PATH-sources finding; new `[PO-14]`.
**v3.3** (14:32) `[PO-3]`/`[PO-4]` **CLOSED -- credentials move to the team.** Container now starts
under-credentialled by design; `.env` requires nothing. New `FIRST-TASKS.md` seeded into the container.
Atlassian is the **EVR connector**, not an API token -- which **closes the Confluence gap** and removes
the `dev-toolkit` clone and every `ATLASSIAN_*` var. New `[PO-18]`: the connector's exact install step
is unknown to me and deliberately not guessed.
**v3.2** (14:18) `[PO-2]` **CLOSED BY MEASUREMENT -- `network_mode: host`.** The probe found a *third*
state neither of my discriminators named: a bridged container cannot resolve DNS at all, so the
routing-vs-MASQUERADE question was never exercised. Verdict obtained; mechanism not. allerk's compose
comment is now wrong on its intermediate observation as well as its mechanism. Two probe defects
recorded, one mine (`rc=$?` after a pipe). New `[PO-17]`, deferred. **Build package finalised at
`designs/new/joosep/`.**
**v3.1** (14:02) `[PO-1]` **CLOSED -- allerk-base**, PO ruling 13:58. Terminology scrubbed to Cloudflare
WARP per the PO standing rule (GH #109): 3 of 4 hits were this document's own v1 mislabel being
corrected and are now stated positively; the 4th is a literal SSH key filename from the registry,
annotated as an artifact name rather than renamed.
**v3** (13:52) **§4 filled from the research brief** -- including `[PO-15]`, a contract-expiry
precondition that outranks every other gate here. **§1.4b RETRACTED**: there was never a 2230
collision (ports are per-host; I carried a shipyard row into an RC question), and the real divergences
are different and worse -- notably that `backlog-triage-claude:latest` resolves to **two different
images** on the two hosts, which is why §2.4's probe is now pinned by digest.
**Author:** (*FR:Brunel*) -- design. Host-side reads by (*FR:Hopper*), Tier R, read-only.
**Requested by:** PO via Aen -- "a similar setup as apex team has", plus one PowerShell connection script with an optional switch (bare = box shell, `-Session` = inside the running Claude session).

> **What changed from v1.** v1 templated off `apex-research` because that is what the request named.
> Hopper's survey found a **closer precedent already on the host**: `allerk`, a per-colleague personal
> workbench built 2026-08-18 for Alexandr Lerko at `/home/dev/allerk`. It is a person-shaped container,
> not a team-shaped one, and it is ten days old against apex's June vintage. **This version templates
> off `allerk` and takes only the team/agent parts from apex.** v1's §0 ordering constraint largely
> dissolves under that base (see §0). v1's isolation claims are corrected in §2.8 -- Joosep already
> holds an SSH key on the host `dev` account, which is in the `docker` group.

> Decisions this design cannot make are marked `[PO-n]` and collected in [§6](#6-po-decision-register).
> `[PO-1]` (base) and `[PO-2]` (network) gate the build.

---

## 0. Base choice -- DECIDED: `allerk`-base `[PO-1] CLOSED`

> **PO ruling 2026-08-28 13:58: allerk-base**, with apex contributing only the agent-team env vars,
> the MCP/settings seeding steps and the config layout. The comparison below is retained as the
> rationale of record, not as an open question.

Both are real, both are on the host, and the request named the wrong one. Costed briefly:

| | **`allerk`-base (recommended)** | **`apex-research`-base** |
|---|---|---|
| What it is | one **person's** workbench: whole-`$HOME` volume, separate `work` volume, `authorized_keys` bind, launcher script, resource ceilings | one **team's** research rig: cloned research repo + read-only source-data volumes, courier key, `TEAM_NAME`, agent-teams env |
| Age / drift | built 2026-08-18, compose touched 2026-08-27 | June vintage; the repo's design copy is a mirror that may lag the live file |
| Fit to "a container for Joosep" | direct -- Joosep is a person | requires stripping the team-research scaffolding, then re-adding person scaffolding apex never had |
| Team-name coupling | **none** -- volumes are `allerk_home` / `allerk_work` / `allerk_sshd`, named for the person | volumes embed the team name (`apex-research_apex-claude-home`); a rename is a volume migration |
| Launcher | `allerk.sh` -- `build\|up\|down\|restart\|logs`, bare = shell inside | none |
| Resource ceilings | yes (`cpus: '12'`, `memory: 40G`) | none |
| Key management | `authorized_keys` bind-mounted `:ro`, re-read every start -- edit file, restart, done | `SSH_PUBLIC_KEY{,_2,_3}` env vars, needs a recreate to change |
| What it lacks for Joosep | the agent-team parts: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`, `TEAM_NAME`, MCP config, team roster/prompts | -- |

**Recommendation: `allerk`-base + the agent-team parts lifted from apex.** Concretely, take from apex only:
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`, `TEAM_NAME`, the `~/.claude/mcp.json` seeding step, the
`~/.claude.json` backup/restore step (§2.3), and the team config layout. Everything structural comes
from allerk.

### 0.1 The v1 ordering constraint, corrected

v1 opened by insisting the AI team's name be settled before the first `docker compose up`, because the
name is baked into the volume names and a later rename costs a volume migration. **That is true under
apex-base and largely false under allerk-base.** allerk names its volumes after the *person*
(`allerk_home`, via explicit `name:` keys), so the team name lives only in a directory *inside* the
home volume (`~/.claude/teams/<team>/`) -- renaming it is a `mv`, not a migration.

So the build **no longer blocks on the research brief.** What remains name-coupled is minor and cheap:
the tmux session name and the `TEAM_NAME` env var. This is a further argument for allerk-base, and it
is the one place where v2 is materially less constrained than v1 rather than more.

---

## 1. Reference survey

### 1.1 `allerk` -- the primary precedent (live, RC, `/home/dev/allerk`)

Not in this repo; it is Lerko's, on the host. Contents per Hopper's read:

| File | Role |
|---|---|
| `docker-compose.yml` | the shape to copy; **also carries the host's authoritative port-allocation table in its header comment** |
| `Dockerfile`, `entrypoint.sh` | image + boot |
| `allerk.sh` | host-side launcher: `build\|up\|down\|restart\|logs`; **bare invocation = shell inside**, starting the container first if it is down |
| `authorized_keys` | bind-mounted `:ro` into the container, re-read every start |
| `.env` (mode `600`), `.env.example` | credentials, uncommitted |
| `README.md` | **18.6 KB, ~40 troubleshooting sections** -- the single most valuable artifact found this session |
| `warp-ca.pem`, `.claude/` | WARP CA, Claude config |

Structural features adopted wholesale (§2), each with its rationale already written down in the file:

- `network_mode: host` **plus** `extra_hosts: ["allerk:127.0.0.1"]`. The second line exists because
  "with host networking Docker writes no entry for the container's own hostname, so sudo and anything
  else resolving it warns on every call" -- a cleaner fix than apex's entrypoint `/etc/hosts` append.
- Four mounts: `<name>_home:/home/<name>` (whole `$HOME` -- shell config, git identity, `~/.claude`
  state, OAuth), `<name>_work:/home/<name>/work` (mounted *over* `$HOME` so projects wipe and back up
  independently), `<name>_sshd:/etc/ssh/keys` (host keys survive rebuilds), `./authorized_keys:/opt/authorized_keys:ro`.
- `deploy.resources.limits: {cpus: '12', memory: 40G}` -- commented "Ceilings, not reservations --
  idle capacity stays available to the host. Exists so a runaway build here cannot take the machine
  away from others."
- sshd: `PermitRootLogin no`, `PasswordAuthentication no`, `KbdInteractiveAuthentication no`,
  `UsePAM no`, `HostKey /etc/ssh/keys/...`, `LogLevel VERBOSE`, and
  **`SetEnv PATH=/home/allerk/.local/bin:...`** (see §3.3 -- this one is load-bearing for `-Session`).
- `env_file: [{path: .env, required: false}]` alongside an explicit `environment:` block.

**Not adopted:** the `/home/dev/allerk-jetbrains:/home/allerk/.cache/JetBrains` bind. Its own comment
marks it redundant post-storage-relocation, kept only to avoid stranding IDE state. Nothing to strand
in a new container.

### 1.2 The apex lineage (contributes the agent-team parts only)

| Artifact | Path |
|---|---|
| Dockerfile / compose / entrypoint | `designs/deployed/apex-research/container/{Dockerfile.apex,docker-compose.yml,entrypoint-apex.sh}` |
| Team config | `designs/deployed/apex-research/teams/apex-research/` |
| Live copy on host | `/home/dev/github/apex-migration-research/docker-compose.yml` (the design copy is a mirror and may lag -- `diff` before editing) |

### 1.3 The backlog-triage lineage (reference for the MCP/settings steps)

`designs/new/backlog-triage/container/` -- `Dockerfile.backlog-triage`, `entrypoint-backlog-triage.sh`,
`apply-layout.sh`, `start-team.sh`, `spawn_member.sh`, `team-config/`. Env-var template:
`designs/new/hr-devs/container/.env.example`.

### 1.4 Launch path -- one menu script, one registry, and two stale registries

There is **no per-team connect script**:

| File | Role |
|---|---|
| `~/bin/rc-connect.ps1` | the live personal copy -- this is what runs |
| `~/Documents/github/dev-toolkit/tools/rc-connect.ps1` | shared reference (lacks the `RC server` and `proxy` branches) |
| `~/bin/rc-deployments.json` | personal registry, 12 rows |
| `~/Documents/github/dev-toolkit/tools/rc-deployments.json` | shared fallback |
| `registry.json` (repo root) | FR's record of the fleet |
| `~/.claude/skills/rc-connect/SKILL.md` | operating knowledge for all of the above |

The direct-SSH branch (`rc-connect.ps1:152-169`) already implements the shell-vs-session distinction the
PO is asking for, as a **registry field**:

```powershell
if ($selected.Tmux) {                                  # present = land in session; absent = land in shell
    $env:TERM = 'xterm-256color'
    $sshArgs += "tmux -u attach -t '$($selected.Tmux)' || tmux -u new -s '$($selected.Tmux)'"
}
```

The PO's `-Session` switch is that field promoted from config to a runtime parameter.

> **Registry drift -- four defects, none mine to fix, filed as `[PO-9]`.**
>
> (a) **`allerk` is on port 2230 on RC and is absent from both registries.**
>
> (b) **RETRACTED -- there is no 2230 collision.** v2 reported 2230 as double-assigned RC-vs-shipyard,
> and v2.1 escalated that to a "three-way divergence." Both were wrong, and the error is mine:
> **TCP ports are a per-host namespace.** The repo registry's `screenwerk` row is on **shipyard**
> (`100.103.189.3:2230`); `allerk` is on **RC**. Both are true simultaneously and contradict nothing. I
> carried a shipyard row into an RC port-allocation question -- a host-scoping slip, not a registry
> disagreement. *(Hopper caught this on re-check and noted his own 13:28 correction had been imprecise
> in the same direction, which is what led me to escalate rather than retract. Neither of us should
> have needed the third pass.)*
>
> (b-real) **What IS divergent, verified on both hosts:**
> - **`screenwerk`'s host** -- repo registry says shipyard `100.103.189.3:2230`; live registry says
>   `srv1559865.hstgr.cloud:22`. Same deployment, two hosts, two ports. A genuine contradiction;
>   neither is verifiable from here.
> - **`backlog-triage` runs on BOTH hosts and no registry records the RC one.** Both registries place
>   it only on PROD-LLM `:2226`. There is a second `backlog-triage` on RC, also `:2226`. Same
>   container name, same tag, two machines. Hopper and I both looked straight at it in the container
>   census without noticing the registry says it lives elsewhere.
> - **`backlog-triage-claude:latest` is two different images.** RC:
>   `sha256:b79a3f5ce894…` built 2026-03-20; PROD-LLM: `sha256:64a28519447…` built 2026-03-23. Same
>   tag, different content, three days apart, each host running its own. **The tag does not identify
>   the image** -- see §2.4, where this changes how the probe must be pinned.
> - The repo registry has **no row for `uikit-dev` (RC:2228) or `allerk` (RC:2230)** and carries a
>   `(reserved)` row for RC:2221. That is *why* allerk's compose header is the only record matching
>   the host.
>
> **And the port-uniqueness premise is withdrawn too.** v2.1 justified 2231 partly because 2225/2227
> were "claimed by prod-llm teams." There is no fleet-wide uniqueness invariant to protect -- prod-llm
> and RC **both already run something on 2226**. 2231 stands on the honest weaker ground: it is the next
> unused number on RC and reads unambiguously to a human. 2229 would also be defensible if the PO
> prefers to keep RC's sequence dense.
>
> (c) **There is a third port record, and it is the authoritative one in practice**: the header comment
> of `/home/dev/allerk/docker-compose.yml` (lines 12-15) maintains the host's port-allocation table --
> *"network_mode: host, so these are the real host ports — check here before claiming a new one"* --
> listing 2222 apex-research, 2223 polyphony-dev, 2224 entu-research, 2226 backlog-triage,
> 2228 uikit-dev, 2230 allerk. It is the only record that matches the host. **A new port must be
> registered in all three places** (that comment, `~/bin/rc-deployments.json`, the dev-toolkit copy) or
> the next person repeats this lookup.
>
> (d) the live registry's apex row says `"tmux": "apex"` while the container's own launcher
> (`/usr/local/bin/tmux-apex`, `entrypoint-apex.sh:428-432`) manages a session named `apex-research` --
> two sessions can coexist and the menu can land in an empty one.

### 1.5 The two attach mechanisms -- they conflict, pick one

| Route | Where | Effect |
|---|---|---|
| **A. `.bashrc` auto-tmux hook** | `entrypoint-backlog-triage.sh:286-299`; hr-devs runbook §18 | guard `[ -z "$TMUX" ] && [ -n "$SSH_CONNECTION" ]` then `exec tmux attach`. Hijacks **every** login. **A bare shell is unreachable by construction.** |
| **B. remote-command launcher** | `entrypoint-apex.sh:428-432` bakes `/usr/local/bin/tmux-apex`; client appends it to the ssh argv | bare `ssh` untouched -> plain shell; `ssh ... <launcher>` -> inside the session |

**Route B is required; Route A must not be copied.** Adding B on top of A does not work -- A fires
first and swallows the login. This is a silent-defeat class: A produces a *successful-looking* session,
not an error, so the dead bare mode is easy to ship without noticing.

### 1.6 Courier / mail arming (reference only -- not proposed for v1)

Onboarding recipe `designs/deployed/stationmaster/stationmaster-onboarding.md`; contract
`stationmaster-protocol.md`; hints `stationmaster-courier-hints.md`; reference implementation
`teams/framework-research/poc/ghost-bridge/stationmaster-courier.py`; agent-facing send tool
`comms-mcp.py`; two-islands rule `fr-dual-homing-spec.md` §4.

apex's arming pattern: BuildKit secret injects the team key (`Dockerfile.apex:108-111`), entrypoint
seeds it into the ephemeral `~/.ssh` each start (`:296-301`), the hub's **host** key is pinned inline
(`:313-321`, `SHA256:CNcFjOxr8vREOueOS8nxJN8W3LaQHet62du+PHyK13U` for `[10.100.136.162]:2222`) rather
than `ssh-keyscan`ed, and the courier is supervised from the entrypoint (`:603-607`) with a boot-time
stale-lock clear (`:600-601`). Topology note: **apex sits on RC and reaches the hub on prod-llm**, so
an RC container joining the EVR island is a consent decision, not a reachability one.

### 1.7 Host facts (Hopper, 13:21, Tier R)

- Host `paarisprogemis-fyysiline`, up 25 days. **20 cores** (Intel Core Ultra 7 265), **62 Gi RAM**
  (39 Gi available), swap 15 Gi barely touched.
- **Storage migration confirmed executed** -- this discharges the check owed since 2026-08-26. Docker
  root `/home/docker-data/lib-docker`, containerd root `/home/docker-data/lib-containerd`,
  `/var/lib/containerd` gone. `/` at **44%** (32 G free), `/home` at 35% with **246 G free**. The
  relocation covered containerd too, not just docker.
- `docker system df`: images 38.15 GB (36.52 GB reclaimable), containers 8.5 GB, volumes 13.44 GB.
- 9 containers up, 1 (`cortex-db`) Exited(255) for 4 weeks -- not crash-looping, someone else's stack.
- Ports in LISTEN: 22, 2222, 2223, 2224, 2226, 2228, 2230, plus 1521/5173/8010/8011 and loopback-only
  11434 (Ollama), 11443/11521/11522 (apex's reverse-SSH forwards, still up).
- **No host firewall, evidenced:** `iptables -L` shows `INPUT (policy ACCEPT)` with **no rules**;
  `FORWARD` policy DROP with only `DOCKER-USER`/`DOCKER-FORWARD`. `ufw`/`nftables`/`firewalld` all
  inactive. Access control is SSH keys + the WARP overlay, nothing else.
- Images on host: `ai-teams-claude:latest` (1.73 GB, 2026-07-22) **is** present;
  `apex-research-claude:latest` (2.37 GB) built off it 2m18s later; `allerk:latest` (773 MB,
  2026-08-25) derives from nothing. Two `apex-research-claude` rollback tags (1.59 GB each) and
  3.62 GB of build cache are the only real reclaimable slack -- the 95%-reclaimable figure in
  `docker system df` is the usual artifact of counting layers not referenced by a *running* container,
  and most of it is the live 15.2 GB Oracle XE image.
- Docker networks exist but are nearly all unused: `docker0` and every `br-*` are **DOWN** except the
  one serving the third-party cortex stack. Note compose creates a `<name>_default` bridge even for a
  `network_mode: host` service (`allerk_default` exists and nothing attaches to it) -- expect a stray
  one for Joosep's too; it is an artifact, not a misconfiguration.
- **Cloudflare WARP.** `warp-cli status` -> Connected, Always-On, MASQUE, exclude-mode split tunnel.
  `CloudflareWARP 100.96.54.170/32` is the address we dial, and `warp-cli status` is the diagnostic.
  Docker bridges `docker0` / `br-*` are **DOWN** except the one serving the cortex stack.
  *(EVR hosts are WARP; the `100.64.0.0/10` CGNAT range is shared with other overlays, which is the
  mislabel trap -- PO standing rule, GH #109.)*
- Host users uid>=1000: `dev` (groups include **sudo, docker**) and `rolandk`. **No per-colleague host
  accounts** -- per-colleague access is a container, not a host user.
- `dev` sudo requires a password except for two NOPASSWD files (`dev-migration`, docker/rsync/daemon.json
  scoped; `dev-iptables-readonly`). A third, `dev-migration-preflight`, is `0440 root:root` and
  unreadable at Tier R.

---

## 2. Delta spec -- Joosep's container

Base: `allerk` (§0). Placeholder name `joosep`; everything not listed is inherited unchanged.

### 2.1 Identity and placement

| Property | Value | Reason |
|---|---|---|
| Host | RC, `100.96.54.170` (WARP address) | PO's instruction; 9 containers already there |
| Compose dir | `/home/dev/joosep/` | mirrors `/home/dev/allerk/` |
| `container_name` / `hostname` / user | `joosep`, uid/gid 1000 | person-named, per allerk |
| SSH port | **2231** (Hopper: nothing bound in 2231-3388) | 2225/2227/2229 are also physically free on RC, but each is claimed in at least one registry (2225 hr-devs, 2227 comms-dev, both prod-llm; 2229 mvox@shipyard in the repo registry). 2231 is unclaimed in **all three** records (§1.4c). Register it in all three. |
| Volumes | `joosep_home`, `joosep_work`, `joosep_sshd` | allerk's bare-name convention via explicit `name:` keys |
| rc-connect menu char | `j` | `0-9`, `a`, `s` taken |
| Headroom check | image ~773 MB + volumes, against 246 G free / 39 Gi RAM available / 20 cores | comfortable on every axis |

### 2.2 Image

Follow allerk's Dockerfile. Where it and the FR lineage differ, notes:

- **Claude install: native** (`~/.local/bin/claude` -> `~/.local/share/claude/versions/<v>`), matching
  allerk (currently 2.1.250) and apex. Self-updates without sudo, which matters when the operator is
  not us. **The collision mode is now known and the rule is firm: do NOT
  `npm install -g @anthropic-ai/claude-code` at all.** allerk hit exactly this -- npm-global put 2.1.235
  in `/usr/local/bin` while the native installer put 2.1.245 in `~/.local/bin`, both on `PATH` in
  different orders, so *which version you got depended on how you had logged in*. It presents as a
  version discrepancy rather than a PATH bug, which is what makes it expensive. Two consequences for
  the Dockerfile: install natively **only**, and make `SetEnv PATH` put `~/.local/bin` **first**
  (§3.3). Diagnostic if it ever recurs: `type -a claude`. allerk's clean end state is
  `~/.local/bin/claude -> ~/.local/share/claude/versions/2.1.250`, nothing in `/usr/local/bin`.
- **Shared base or self-contained -- a real fork, not a workaround.** Hopper confirmed
  `ai-teams-claude:latest` **is** on RC (`a983e663b44b`, built 2026-07-22 18:55, 1.73 GB), with
  `apex-research-claude:latest` built off it 2m18s later -- so the apex lineage has no build-order
  problem on this host. But **`allerk:latest` derives from nothing**: 773 MB, its own self-contained
  6 KB Dockerfile. Choosing allerk's shape *removes* the shared-base dependency rather than working
  around it, and that cuts both ways -- no shared base also means no shared-base upgrades, so a
  toolchain bump has to be made in each image separately. For one colleague container that is the
  right trade (a third of the size, nothing to inherit or undo); if the fleet ever grows several
  person-shaped containers, revisit. Note the existing base is **5 weeks old**, so an apex-lineage
  build wanting current tooling would need `ai-teams-claude` rebuilt first anyway.
- **WARP CA: bind-mount, not copy-in -- also a real fork.** apex bind-mounts the host file
  (`/usr/local/share/ca-certificates/managed-warp.pem:/opt/warp-ca.pem:ro`, confirmed intact by
  Hopper: 1139 B, world-readable, unchanged since 2026-02-13). allerk instead keeps its **own copy** in
  the build context and points `NODE_EXTRA_CA_CERTS` at an in-image path, with no host bind at all.
  **Recommend apex's bind-mount.** Reason: CA rotation is a real event, and a baked copy goes stale
  *silently* -- producing TLS errors that read like network errors and needing an image rebuild to fix.
  The bind-mount's failure mode (host path moves) is louder, surfaces at boot, and the entrypoint
  already warns on it. Trading a silent failure for a loud one is worth the host coupling.
- **Add for the agent-team role** (from apex/backlog-triage, absent from allerk): `gh` CLI, `jq`,
  and the entrypoint steps that seed `~/.claude/settings.json` and `~/.claude/mcp.json` on first run.
- **Do not add:** Python/venv, Playwright/Chromium libs, the apex courier key, a dashboard port. Each
  is apex-specific; carrying them forward only enlarges the surface. `[PO-6]` revisits Python if the
  research brief shows a scripting need.

### 2.3 Volumes and state

| Mount | Contents | Survives stop/start | Survives rebuild | Survives `down -v` |
|---|---|---|---|---|
| `joosep_home:/home/joosep` | shell config, git identity, `~/.claude` (auto-memory, OAuth, settings, mcp.json), team dirs | yes | yes | **no** |
| `joosep_work:/home/joosep/work` | project clones -- mounted *over* `$HOME` so it wipes/backs up alone | yes | yes | **no** |
| `joosep_sshd:/etc/ssh/keys` | sshd host keys | yes | **yes** -- this is the point | no |
| `./authorized_keys:/opt/authorized_keys:ro` | ingress keys, re-read every start | n/a (host file) | n/a | n/a |
| `./warp-ca.pem` (or the host CA path) `:ro` | WARP TLS-interception CA | n/a | n/a | n/a |

**No other bind mounts.** No `/var/run/docker.sock`. No other team's volume. No JetBrains cache.

Two behaviours to carry from apex that allerk does not have:

1. **`~/.claude.json` backup/restore** (`entrypoint-apex.sh:518-555`, *FR:Hopper*). This file sits at
   the **home root**. Under apex's layout that is outside the `.claude` volume, so a recreate wipes it.
   **Under allerk's whole-`$HOME` volume it is already covered** -- so this step is *probably*
   unnecessary here. Worth carrying the backup half anyway: it is cheap, and it protects against a
   corrupt file rather than only a missing one. Flagged as a judgement call, not a requirement.
2. **The named-volume ownership fix** -- Docker creates volumes as root; chown to 1000:1000 on every
   start. allerk's README has a section on exactly this (*"Named volumes start out owned by root"*), so
   its entrypoint already handles it; verify rather than re-add.

The one-way door is `docker compose down -v`: it destroys the OAuth credentials, every scratchpad and
every project clone. Worth saying to Joosep in those words.

### 2.4 Network `[PO-2]` -- probably a hard constraint, worth one probe

All nine containers on RC run `network_mode: host`. allerk's compose states the reason as fact:

> *"Bridge networking has no egress on this host: all traffic is captured by the CloudflareWARP
> interface and the docker subnets are not in its split-tunnel include list, so DNS resolves but
> connections hang. Every container here runs host-networked for the same reason."*

> **That comment has the observation right and the mechanism wrong -- do not copy it forward as
> written.** It says the docker subnets are not in WARP's split-tunnel *include* list. WARP on this
> host runs in **Exclude mode**, not Include mode: `warp-cli settings` reports `Exclude mode` with ~90
> entries, and Hopper grepped the whole list for any `172.16.0.0/12` range -- **no docker subnet
> appears in it**. The correct statement is the inverse: *the docker subnets are not **excluded** from
> the tunnel, so bridge-sourced traffic is handed to WARP rather than kept off it.* Same conclusion,
> opposite mechanism. Fixing the comment in allerk's file is Lerko's to make, not ours.

> ## `[PO-2]` CLOSED BY MEASUREMENT -- host networking is a hard constraint
>
> **Probe executed 2026-08-28, PO-sanctioned Tier M, by digest, post-conditions clean.** Verbatim:
>
> ```
> sh: 1: ip: not found
> * Resolving timed out after 8000 milliseconds
> curl: (28) Resolving timed out after 8000 milliseconds
> ```
> `getent hosts api.anthropic.com` produced **no output at all** (the binary is present -- verified at
> pre-flight -- so this is a silent resolution failure, not a missing tool).
>
> **A bridged container on this host cannot resolve DNS.** Bridge is unusable; `network_mode: host`
> stands, and §2.8's honest posture carries the isolation argument as written.
>
> **The result is a THIRD state and both of my discriminators were wrong.** I predicted PASS = TLS/cert
> error, FAIL = *"DNS resolves but the connection hangs"*. Neither happened. The failure is **upstream
> of any TCP connection**: no name resolved, so no packet was ever sent, so **the routing-rule vs
> MASQUERADE question was never exercised.** We got the verdict we needed and did not measure the thing
> we set out to measure. Those are different outcomes and it is worth not conflating them.
>
> **Consequence for allerk's comment, which is now wrong twice.** It says the docker subnets are absent
> from WARP's split-tunnel *include* list, so *"DNS resolves but connections hang."* WARP is in
> **exclude** mode (mechanism wrong), and **DNS did not resolve** (intermediate observation wrong).
> Only its conclusion survives. v2.1 recorded it as wrong-mechanism/right-conclusion; on this evidence
> it is **wrong-mechanism, wrong-intermediate-observation, right-conclusion.** Anyone copying that
> sentence forward would carry two errors and one truth.

### Two defects in the probe itself, one of them mine

**Mine -- the `rc=$?` lines could never have worked.** I wrote
`curl ... 2>&1 | tail -20; echo rc=$?`, which captures the exit status of **`tail`**, not `curl`. Both
lines duly printed `rc=0` immediately after a `curl: (28)` failure. Hopper spotted this *before*
executing and **ran the command exactly as sanctioned anyway** rather than silently correcting it --
the right call, since amending a sanctioned command on the executor's own judgment is precisely the
broadening this role-split exists to prevent. It cost nothing here because `curl -v` puts the real
signal in the verbose stream, but a reader of the raw log sees `rc=0` twice under a failed probe.
**Correct form if re-run: `curl ...; rc=$?` before any pipe, or `set -o pipefail`.**

**Hopper's -- the pre-flight went stale, and this is the more interesting failure.** `ip: not found`:
the `ip` binary is absent from that image, so **the amendment did not execute** -- and the amendment
was the whole mechanism for separating *"routed into WARP and blackholed"* from *"never got an
address"*. He pre-flighted `getent`/`curl`/`sh`/`nc` against my **original** probe, and when the
amendment introduced a new dependency he did not re-run the check against the changed command.

His framing, which I think is the durable lesson: **a verification step can go stale, and staleness in
a verification step is invisible precisely because the step previously passed.** That is the same
defect class we had been trading all session, committed one level up -- not in the probe, but in the
check that was supposed to guarantee the probe. Cheap fix for a re-run: use `cat /proc/net/route` and
`cat /etc/resolv.conf`, which need no binary at all.

### Why the theory mattered anyway, and what is now deferred rather than closed

Before the probe, Hopper argued both sides from the substrate and declined to pick:

- **For FAIL:** policy rule `32765: not from all fwmark 0x100cf lookup 65743` sends everything unmarked
  to the WARP table *before* `main`. A bridge-sourced packet is unmarked, so it enters the WARP tun
  with source `172.17.x.x` -- an address WARP does not own.
- **For PASS:** nat POSTROUTING carries `MASQUERADE all -- * !docker0 172.17.0.0/16 0.0.0.0/0`, which
  matches out-interface `CloudflareWARP` (it excludes only `docker0`) and rewrites the source to
  `100.96.54.170` -- an address WARP *does* own. POSTROUTING runs after the routing decision, so the
  packet may be SNATed into legitimacy on the way out. `DOCKER-USER` is empty, so nothing drops it
  administratively.

The MASQUERADE rule shows 34 packets / 2040 bytes, but counters distinguish neither success from
attempt nor when, so that is not evidence either way.

**Neither argument was tested**, because nothing got as far as sending a packet. Both remain live.

**Deferred, not open -- one hypothesis worth recording precisely so it is cheap to pick up.** Hopper
offers, explicitly as inference rather than assertion: a bridged container resolves via Docker's
embedded DNS at `127.0.0.11`, which forwards to the host's resolvers -- and this host's resolvers are
WARP's DoH listeners on `127.0.2.2`/`127.0.2.3`. From inside a bridged network namespace those are the
**container's** loopback, not the host's, so the forward has nowhere to go. Coherent, untested.

If that is right, the failure is **resolver scoping, not routing**, and an explicit `dns:` in the
compose might make bridge viable -- which would buy the real network isolation that host mode cannot.
That is a genuine upside, so I am recording the exact test rather than letting it evaporate:

```
docker run --rm --network bridge --entrypoint sh <image-by-digest> -c \
  'cat /etc/resolv.conf; cat /proc/net/route; getent hosts api.anthropic.com'
```

**But I am not requesting it, and `[PO-2]` should close on host mode now.** Three reasons: the verdict
the decision needed is in; a lone bridged container would be a fleet deviation with its own maintenance
story, since all ten others are host-mode; and per §2.8 this container is not a security boundary
anyway, so the isolation it would buy is blast-radius reduction rather than containment. Worth one
cheap probe **only if** someone later wants that isolation for a specific reason. Filed as `[PO-17]`,
deferred.

**Consequence, which is the part that matters for a colleague-operated container.** Host networking
means sharing the host's network namespace. The container reaches `127.0.0.1:<anything>` on RC --
every sibling container's sshd (2222/2223/2224/2226/2228/2230), Ollama on 11434, and apex's
reverse-SSH forwards on 11443/11521/11522, which are still up. It **cannot firewall itself** (no
separate netns).

And the host does not filter either -- this is now **evidenced rather than assumed**. Hopper's
`sudo iptables -L` (a grant that does work) returned `Chain INPUT (policy ACCEPT)` **with no rules**,
and `FORWARD` policy DROP carrying only `DOCKER-USER`/`DOCKER-FORWARD`; `ufw`, `nftables` and
`firewalld` are all inactive. **There is no host-level ingress filtering on RC.** Anything a container
binds on a host port is reachable from anything that can route to the box -- today, the WARP overlay.

The design consequence is worth stating flatly: **port choice is not a security control here.** Picking
2231 is a bookkeeping decision, not a protective one.

I have proposed **one Tier M probe** to Hopper (sent 13:29, unsanctioned, awaiting Aen/PO) to verify
rather than inherit the assertion, because if bridge egress does work, Joosep's container gets real
isolation instead of credential-only controls:

```
docker run --rm --network bridge --entrypoint sh \
  backlog-triage-claude@sha256:b79a3f5ce89496ad0cf18c007fd3ac23f53ed5aff17d83a7714a8c073883b93c -c \
  'ip -4 addr show eth0; ip route; getent hosts api.anthropic.com; \
   curl -v -m 8 -o /dev/null https://api.anthropic.com/ 2>&1 | tail -20; echo rc=$?; \
   curl -kv -m 8 -o /dev/null https://api.anthropic.com/ 2>&1 | tail -5; echo rc_k=$?'
```

**Pinned by digest, not tag -- and the reason is a finding, not fussiness.** Hopper verified that
`backlog-triage-claude:latest` resolves to **two different images** on the two hosts: `b79a3f5c…`
(RC, built 2026-03-20) and `64a28519…` (PROD-LLM, built 2026-03-23). Same tag, different content,
each host running its own. His `curl`/`getent` pre-flight ran against RC's `b79a3f5c…`, which is the
image the probe would actually execute -- so the pre-flight is valid and the probe is sound. But
"the image is already on the host" is only meaningful with the host named, and a reader running the
tag form on prod-llm would get a different binary set with no warning. The digest makes the sanction
name the artifact rather than a label.

**Reading it -- the discriminator is not the obvious one.** A **TLS/certificate error is a PASS**: it
proves packets reached Cloudflare's interception layer and only the CA is missing (the container has no
`/opt/warp-ca.pem`). **DNS resolves but the connection hangs to timeout is the FAIL.**

The `ip addr`/`ip route` prefix and `curl -v` are **Hopper's amendment, accepted.** My first draft used
`curl -sS` and printed only an http code, which collapsed *"routed into WARP and blackholed"* and
*"never got an address / no route at all"* into the same 8-second timeout -- the identical
two-states-in-one-branch defect I had flagged in the CA-vs-network case, one level further out. If it
fails, we now learn *which* failure it was.

**Two probe-design checks Hopper ran before agreeing to it, both worth recording:**

1. **Tool-presence check (passed).** The probe's own discriminator had the shape where *"`curl` is
   missing from the image"* and *"bridge egress is dead"* land in the same branch -- a false FAIL that
   would have confirmed the hypothesis. Verified at Tier R against the *running* `backlog-triage`
   container (same image, so nothing was created): `getent`, `curl` (7.88.1) and `sh` all present;
   `nc` absent but unused.
2. **The method used for that check was itself defective on the first pass.**
   `command -v sh curl getent nc wget` returns only the *first* operand in dash, so it reported only
   `/usr/bin/sh` -- which would have meant reporting `curl` absent and killing the probe on a false
   negative. The corrected method is one binary per call.

   **Recorded the way Hopper asked, because his framing is the more useful one:** he caught it only
   because he had run `curl --version` in the same breath as a belt-and-braces afterthought, not
   because he had reasoned that `command -v` might swallow its arguments. Written the tidy way -- one
   call, parse the output -- it would have produced a clean false negative delivered with complete
   confidence. So the transferable lesson is **the shape, not the alertness: make a tool-presence
   check independently falsifiable**, because the failure mode of the obvious method is silent. He
   asked that this not be filed as good practice on his part, and he is right that it would be the
   wrong lesson to carry.

**Side-effect the sanction must cover** (Hopper's catch, not in my original dispatch): `docker0` is
currently **DOWN / NO-CARRIER**, with a dead route installed (`172.17.0.0/16 dev docker0 ... linkdown`).
Attaching a bridged container brings the carrier up and makes that route live for the container's
lifetime, reverting on exit. Transient and self-reverting, and nothing else rides `docker0` -- but it is
a **host network-interface state transition**, not a purely container-scoped action, and the PO should
sanction it knowing that rather than find it in a diff. It does not push the operation to Tier D.

If the probe is declined, take allerk's *conclusion* as authoritative (not its mechanism -- see the
correction above), write host-net as a hard constraint, and rely on the §2.8 posture. That is an
acceptable outcome; the probe only upgrades an assertion to a measurement.

### 2.5 Resource ceilings -- match allerk

```yaml
    deploy:
      resources:
        limits:
          cpus: '12'
          memory: 40G
    pids_limit: 512
    restart: unless-stopped
```

`cpus`/`memory` match allerk exactly, for peer symmetry between two colleague workbenches on one box.

**But Hopper raised the sizing question and he is right to** -- 12 of 20 cores and 40 of 62 GiB to a
single colleague container is generous, and Joosep's would be the **second** such container, so each
would be promised more than half the box (24 of 20 cores, 80 G of 62 GiB). That overcommit is inherent
to ceilings-rather-than-reservations and is the precedent's deliberate choice: idle capacity stays
available, and a ceiling bounds *one* tenant's runaway rather than the sum. It does mean two
simultaneous runaway builds can still pressure the host.

**This is a policy question for the PO, not a fact either of us can settle -- `[PO-10]`.** Three
coherent answers: (i) match allerk at 12/40 and accept the overcommit, which is what the precedent
already implies; (ii) size the second container lower (say 8/24) and accept the asymmetry between two
colleagues; (iii) convert both to reservations, which actually closes it but is a fleet-wide change and
gives up the idle-capacity property. I recommend **(i)** -- symmetry between peers is worth more than a
speculative contention scenario, and (iii) is the only real fix if contention ever actually bites.

`pids_limit` is my one addition -- allerk does not set it. A fork-bomb hits the pid ceiling long before
a 40 G memory ceiling notices, and an agent-driven container is more likely to spawn pathologically than
a hand-driven one.

### 2.6 Credentials and secrets

Host side: `.env` beside the compose file, mode `600`, owned by `dev`, uncommitted, referenced as
`env_file: [{path: .env, required: false}]` -- allerk's exact arrangement. Joosep never receives the
`.env`; he receives a container whose environment already contains his own credentials.

> **Do not copy apex's `.env.example` forward.** Hopper read the live apex `.env` (variable **names**
> only; no values requested, none transmitted) and it does not match what the container consumes in
> either direction. It carries **`TUNNEL_TOKEN`, which no service in the operational compose ever
> receives** -- a leftover from the retired cloudflared-sidecar era; the sidecar is gone and the
> container is host-networked. Conversely `REPO_URL`, `SOURCE_REPO_URL` and `TEAM_NAME` are **not** in
> `.env` at all -- they ride compose defaults. So apex's `.env` is neither a superset nor a subset of
> its real inputs, and inheriting it would propagate a dead variable while omitting three live ones.
> Build Joosep's `.env.example` from the compose `environment:` block, which is the actual contract.

| Credential | Proposal | Reason |
|---|---|---|
> **SUPERSEDED 2026-08-28 14:24 by PO decision -- see §2.6a.** The table below described credentials
> supplied by the PO in `.env` at provisioning time. The PO has moved both to Joosep's team as its own
> first tasks. Retained as the reasoning of record for *what scope* each credential should have, which
> is unchanged; only *who creates it and when* has changed.

| `ATLASSIAN_EMAIL` / `ATLASSIAN_API_TOKEN` | ~~Joosep's own account and token~~ **-> connector, §2.6a** | actions attributed to him; his own permission scope applies. Corollary from the S65 negative-probe gotcha: his credential sees a *different* Jira/Confluence slice than the PO's -- an empty result from him is not evidence of absence. **This corollary survives the change and is now written into `FIRST-TASKS.md` task 2.** |
| `GITHUB_TOKEN` | fine-grained PAT scoped to **`HES-integration-tests` + `rumba`**, read-only elsewhere `[PO-3]` | scope unchanged; **creator changed** to Joosep's team (§2.6a). The brief narrows this from "his access ceiling" to the two repos he has actually committed to; the whole `hes`-team grant is unexercised. |
| Anthropic auth | **reuse his existing licence** (ITSD-39589/39591); OAuth at first run `[PO-5]` | unchanged |

### 2.6a Credential provisioning -- moved to the team `[PO-3]` / `[PO-4]` CLOSED

**PO decision 2026-08-28 14:24: the container starts under-credentialled and provisions itself.**
Nothing is required in `.env` at first start. `env_file` is `required: false`, so even a missing file
boots.

| Credential | Who, when | Mechanism |
|---|---|---|
| Claude | Joosep, first `claude` run | OAuth device flow |
| GitHub PAT | **Joosep's team, task 1** | he creates it fine-grained at the scope above, hands it to the PO, who adds it to host `.env` + `./joosep.sh restart` -- **no rebuild**, repos clone on that boot |
| Atlassian | **Joosep's team, task 2** | the **EVR connector**, authenticated interactively. **No API token anywhere in the container** |

Three design consequences, all improvements:

1. **The Confluence gap closes rather than persisting.** v3's `mcp.json` seeded a local Jira-only stdio
   server and I flagged that Confluence was *not* covered. The connector covers both. That gap is gone,
   not worked around -- and I would rather record that the PO's route was better than the one I
   specified than quietly delete the flag.
2. **`dev-toolkit` is no longer cloned.** It was pulled in solely as that MCP server's source. Dropping
   it tightens the repo set to exactly the two the brief named.
3. **There is no Atlassian secret in the container at all** -- not on disk, not in `.env`, not in the
   `.bashrc` the container user can read. The §2.6 cleartext-in-`.bashrc` hazard now applies to exactly
   one variable (`GITHUB_TOKEN`), and to a credential its own holder created.

The deeper property: **everything this team can reach is something Joosep granted, under his name, at a
scope he chose.** That is a stronger answer to §2.8's "not a security boundary" than any container
control -- it moves the question from *what can the container reach* to *what did its principal
authorise*, which is the question that actually has a good answer.

**One thing I could not supply and did not invent:** the exact install/enable step for the EVR
connector inside a container. `FIRST-TASKS.md` task 2 says so in those words and gives the shape plus
three verifications instead; the PO supplies the precise step at hand-over. Guessing would leave a
half-configured MCP entry that fails confusingly, which is worse than an honest gap.
| Stationmaster team key | **none in v1** `[PO-7]` | §2.7 |

**One inherited hazard to note.** The FR entrypoints persist compose env vars into the container user's
`.bashrc` in cleartext, tokens included (`entrypoint-apex.sh:380-405`, mirrored at
`entrypoint-backlog-triage.sh:229-260`). It exists for a real reason -- compose env does not reach SSH
or `sudo su` shells, and agents need the vars everywhere. Its latent assumption is that whoever logs in
as the container user *is* the credential owner. Making the credentials Joosep's own (rows above) is
what keeps that assumption true here. The remedy is per-person credentials, **not** stripping the
`.bashrc` step, which would break the paths it exists to serve.

### 2.7 Mail / stationmaster -- not in v1

**Recommendation: no courier, no hub registration, no team key.** Mail is a mutual-consent surface --
joining the EVR island means someone grants Joosep's team and it grants back, which is a PO decision
about who may mail whom, not an infra default. It is cheap to add later (six steps) and the apex arming
pattern is proven from RC. Nothing in the stated requirement needs it.

If the PO wants it (`[PO-7]`): generate `~/.ssh/sm_<team>` **on the persistent volume** (durable-key
posture -- allerk's whole-`$HOME` volume makes this trivial, unlike apex's rotate-on-restart), operator
registers the pubkey on the prod-llm hub, pin the hub host key inline per `entrypoint-apex.sh:313-321`,
supervise the reference courier, grant reciprocally. Per `fr-dual-homing-spec.md` §4, an RC-hosted team
is an **EVR-island** team: prod-llm hub only, never sagres, never failover between them.

### 2.8 What this container is, and is not -- corrected (*FR:Brunel*)

**v1 was wrong about this section and I am replacing rather than amending it.** v1 opened its
must-not-reach list with "no host user account for Joosep, no host SSH, no host sudo." Hopper's read of
`dev`'s `~/.ssh/authorized_keys` shows **four** keys, with comments `mihkel.putrinsh@evr.ee`,
`hr-platform`, `joosep.madar@evr.ee`, `claude-container`.

**`dev` is in the `docker` group, which is root-equivalent on that box** -- a member can
`docker run -v /:/host` and read or write the entire host filesystem, every other container's volume,
and every team's `.env`. Four keys hold that. So most of v1's list was already reachable through
channels that predate this design.

> **Precision correction, and it matters for `[PO-12]`.** v2 said "Joosep already has SSH access."
> That overstates the evidence. allerk's README (§2.8 quote below is a different section) documents
> that **key comments on this host do not identify their owner** -- the key labelled `hr-platform` in
> that same file is in fact the PO's own Windows client key. Hopper raised this against his own earlier
> report. So the defensible statement is: **a key labelled `joosep.madar@evr.ee` is installed on
> `dev`**, and whose key it actually is requires a fingerprint comparison, not a reading of the comment.
> The posture conclusion is unchanged -- four keys have root-equivalent host access either way -- but
> the *decision* must be framed as "identify all four by fingerprint, then decide", not "revoke
> Joosep's key."

Stating the honest posture:

> **This container is a scoped, disposable workspace. It is not a security boundary, and it does not
> become one by being carefully specified.** Its value is operational -- an isolated place to work that
> can be rebuilt or thrown away without touching anything else, with its own credentials and its own
> state. Presenting it as a containment control would be theatre, and worse, would let real questions
> about host access go unasked because a container "handles" them.

**It was already written down, and more bluntly.** allerk's README, verbatim:

> ## Not a security boundary
>
> Membership in the host `docker` group is equivalent to root on the host: anyone in it can mount `/`
> into a container and read any user's files. This container separates *configuration*, not
> *privilege*. For a real boundary between users, use rootless Docker or separate Linux accounts.

Two independent routes reach the same place: Lerko declines the security claim **in principle** (any
`docker`-group member is root-equivalent), and Hopper's host read confirms it **in this instance** (a
fourth key with `dev` access exists). "Separates configuration, not privilege" is the phrase to reuse.
Note the escape hatch it names -- **rootless Docker or separate Linux accounts** -- which is the honest
answer if the PO ever does want a real boundary. Neither is in scope here.

**What the design still does, and why it is worth doing anyway:**

| Control | Enforced by |
|---|---|
| No `/var/run/docker.sock` mount | construction -- mounting it would hand container-root the host |
| No other team's volume mounted | construction -- only `joosep_*` volumes |
| No fleet private key inside (`id_ed25519_apex`/`_polyphony`/`_entu`/`_uikit`/`_tailnet`) -- these are **literal key filenames from the registry**, not network descriptions; the last one is a legacy misnomer for a WARP-reachable host and should be read as an artifact name only | **discipline only** -- this is the one that silently erodes when someone copies another compose file |
| No Oracle client, no DB credentials, no tunnel scripts | construction (apex's forwards on 11443/11521/11522 are reachable at the IP layer under host-net, but reaching a port is not authenticating to it) |
| No Cloudflare/Wrangler credentials | construction |
| GitHub token read-only outside his own repos | `[PO-3]` |
| Not FR's repo (`mitselek/ai-teams`) | construction -- his `REPO_URL` is his own |
| No in-container `sudo` | **deviation from allerk** -- allerk's user is in the `sudo` group. See below. |

**On in-container sudo:** allerk has it; I am proposing Joosep's container does not, by default. The
reasoning is not about trust, it is about who gets called when something breaks -- a container whose
occupant can `apt-get install` diverges from its Dockerfile and stops being reproducible. But this is
weak grounds to break precedent, and if Joosep's work needs a package the image lacks, the friction
lands on the PO. **`[PO-11]`** -- I recommend granting `sudo` to match allerk, and treating
reproducibility as a convention ("if you install something, tell us so it goes in the Dockerfile")
rather than a lock. Given §2.8's honest posture, withholding sudo buys very little.

### 2.9 Key posture `[PO-12]` -- Joosep's existing key on `dev`

Aen asked for a recommendation between (a) leave the `dev` key and add a container key, and (b)
container-only, revoke from `dev`.

**Step 0, before either: identify all four keys on `dev` by fingerprint.** Comments on this host are
documented-unreliable (§2.8), so "the key labelled `joosep.madar@evr.ee`" is a label, not an
attribution. Concretely: `ssh-keygen -lf` each line of `/home/dev/.ssh/authorized_keys`, then compare
against a key each claimed owner attests to. Until that is done, (a) and (b) are decisions about an
unknown. This is Tier R and cheap; it should precede the PO conversation, not follow it.

**Recommendation once identified: (b), conditional.** Reasons:

1. `dev` + `docker` group is root-equivalent on RC. If the intent is that Joosep's working surface is
   his container, a key on `dev` makes every control in §2.8 decorative -- and worse, makes the design
   *look* like it constrains something when it does not.
2. It is cheap and reversible. Re-adding a line to `authorized_keys` is trivial if the revoke turns out
   to be wrong.
3. It removes an ambiguity about which door is the intended one, which matters for a colleague who is
   new to this setup and will reasonably use whichever access works.

**The condition, and I want to be explicit that I cannot check it:** I do not know why that key is
there or when it was added. The key comment `joosep.madar@evr.ee` proves neither. If it is serving an
active purpose -- he may already be doing legitimate host work -- then **revoking it breaks his
existing workflow, and the correct response is not to revoke but to drop §2.8's isolation framing
entirely** and say plainly that this is a convenience workspace for someone who already has host
access. Either answer is fine. Carrying the key *and* the isolation language is the one combination
that is not.

Two operational notes for whoever executes (b): editing `dev`'s `authorized_keys` is a **Tier M** host
mutation needing PO sanction, and it is the kind of edit that locks people out when done hastily --
it should be done with a second session already open on the host.

---

## 3. Connection script spec -- `Connect-Joosep.ps1`

### 3.1 Shape

The fleet tool is a *menu over a registry* (§1.4), which is the wrong thing to hand Joosep: he has one
target, and the menu prints the whole fleet's hosts, ports, users and key names to someone with no
business in eleven of twelve rows. So: **both.**

- **Joosep gets** a standalone `Connect-Joosep.ps1` -- one target, one switch, no registry.
- **The PO also gets** a registry row so it appears in the normal menu:
  `{ "num": "j", "name": "joosep", "hostAlias": "rc", "port": 2231, "user": "joosep",
  "key": "~/.ssh/id_ed25519_joosep", "tmux": "joosep", "status": "live" }` -- added to both
  `~/bin/rc-deployments.json` and the dev-toolkit copy per the rc-connect skill. While there:
  **add the missing `allerk` row too**, and reconcile the three drift defects in §1.4.

The standalone script emits the **same ssh invocation** as rc-connect's direct-SSH branch, so it stays
a degenerate case of the fleet tool rather than a divergent one. It is also the remote analogue of
allerk's host-side `allerk.sh`, whose bare invocation likewise means "shell inside".

### 3.2 Behaviour

| Invocation | Lands in | ssh executed |
|---|---|---|
| `Connect-Joosep` | plain bash login shell in the container | `ssh -i <key> -p 2231 -o IdentitiesOnly=yes joosep@100.96.54.170` |
| `Connect-Joosep -Session` | inside tmux, attached to the running Claude | `ssh -t -i <key> -p 2231 -o IdentitiesOnly=yes joosep@100.96.54.170 "joosep-session"` |

Both modes log in as the **container user that runs Claude** -- tmux sessions are per-user, so
attaching to the session running Claude requires being the user that started it. Under allerk-base
that user is the person-named one (`joosep`), which is tidier than apex's `ai-teams`.

`IdentitiesOnly=yes`: without it a Windows ssh-agent offers every loaded key before the right one and
can trip `MaxAuthTries`. allerk's README has a section titled *"The right SSH key looks like someone
else's key"* which I suspect is exactly this; requested from Hopper to confirm the fix matches.

### 3.3 The container-side half -- `/usr/local/bin/joosep-session`

Installed by the entrypoint via a `cat > /usr/local/bin/...` heredoc (the pattern the rc-connect skill
documents and `entrypoint-apex.sh:428-432` already uses).

```bash
#!/usr/bin/env bash
# joosep-session -- attach to the team session, creating it (with Claude) if absent.
S="joosep"
if tmux has-session -t "$S" 2>/dev/null; then
    exec tmux -u attach -t "$S"
fi
tmux new-session -d -s "$S" -c "$HOME/work"
tmux send-keys -t "$S" "claude" Enter
exec tmux -u attach -t "$S"
```

**Route A (`.bashrc` auto-tmux) is deliberately NOT installed** (§1.5) -- it would hijack the bare mode
and make the switch meaningless.

**`SetEnv PATH=...` in `sshd_config` is required, not optional.** `-Session` runs `joosep-session` as a
**remote command**, i.e. a non-interactive, non-login shell that never sources `.bashrc`. allerk's
sshd_context sets

```
SetEnv PATH=/home/allerk/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
```

Adopt the line with `joosep` substituted, and put `~/.local/bin` **first** in it (§2.2).

**There are three PATH sources in play, not two, and only one of them reaches this case** -- allerk's
README, verbatim:

> An interactive login works and `./allerk.sh claude` works, yet `ssh allerk 'claude --version'` fails.
> Three different `PATH` sources are in play: `.profile` and `.bashrc` for interactive shells, the
> image's `ENV` for `docker exec`, and sshd's own compiled-in `PATH` for a non-interactive remote
> command. **Debian's `.bashrc` returns early when not interactive**, so it does not help there.

So no amount of `.bashrc` or `ENV` editing fixes the `-Session` path -- sshd's compiled-in PATH is what
you are fighting, and `SetEnv` in `sshd_config` is the only one of the three levers that reaches it.
This is the single easiest thing to omit and then spend an hour debugging, and the two obvious fixes
are both the wrong lever.

Two behaviours for the PO:

- **Detach vs exit.** `Ctrl-b d` detaches and leaves Claude running; closing the terminal does the
  same. The session surviving the connection is the desired property.
- **Crashed session.** v1 is attach-or-create: if the session exists but Claude died in it, the attach
  lands on a dead pane and Joosep types `claude`. A liveness check that offers to relaunch is v1.1.

### 3.4 Script skeleton

```powershell
<#
.SYNOPSIS  Connect to the joosep container on the RC host.
.EXAMPLE   Connect-Joosep            # a shell in the container
.EXAMPLE   Connect-Joosep -Session   # attach to the running Claude session
#>
[CmdletBinding()]
param(
    [switch]$Session,
    [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519_joosep"
)

$RemoteHost = '100.96.54.170'      # RC, via the Cloudflare WARP overlay
$Port       = 2231
$User       = 'joosep'
$Launcher   = 'joosep-session'

if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "OpenSSH client not found. Settings > Apps > Optional features > OpenSSH Client" -ForegroundColor Red; return
}
if (-not (Test-Path $KeyPath)) {
    Write-Host "SSH key not found at $KeyPath" -ForegroundColor Red
    Write-Host "  ssh-keygen -t ed25519 -f `"$KeyPath`" -C `"joosep@evr`"   # then send the .pub line to Mihkel" -ForegroundColor Yellow
    return
}

$env:TERM = 'xterm-256color'
$Host.UI.RawUI.WindowTitle = if ($Session) { "joosep (session)" } else { "joosep (shell)" }

$sshArgs = @('-i', $KeyPath, '-p', "$Port", '-o', 'IdentitiesOnly=yes')
if ($Session) { $sshArgs += '-t' }
$sshArgs += "$User@$RemoteHost"
if ($Session) { $sshArgs += $Launcher }

& ssh @sshArgs
$Host.UI.RawUI.WindowTitle = "- $($Host.UI.RawUI.WindowTitle)"
```

Deliberately absent: retry loops, tunnel management, host-key handling in code. First-connect host-key
verification stays a visible human step (§3.5) rather than being auto-accepted.

### 3.5 Prerequisites and first-run onboarding

| # | Item | Notes |
|---|---|---|
| 1 | **Cloudflare WARP, enrolled** `[PO-8]` | `100.96.54.170` is the host's `CloudflareWARP` interface address; diagnostic is `warp-cli status`. The container is reachable only from a WARP-enrolled machine -- same posture as every other container there. Enrolling him is a PO/admin action. *(v1 of this document mislabelled the overlay; corrected per the PO standing rule, GH #109.)* |
| 2 | OpenSSH client | built into Windows 10/11; the script checks and tells him how to add it |
| 3 | An ed25519 keypair | `ssh-keygen -t ed25519 -f $HOME\.ssh\id_ed25519_joosep -C "joosep@evr"`; he sends only the `.pub` line |
| 4 | The container's host-key fingerprint, out of band | so the first connect is verified, not blind-accepted |
| 5 | Windows Terminal | tmux + Claude's TUI need UTF-8 and 256 colours |
| 6 | `Connect-Joosep.ps1` in `%USERPROFILE%\bin\` | plus that dir on `PATH`, or a profile alias |

First run:

1. Joosep generates the key, sends the `.pub` line (safe to paste in chat/email).
2. PO appends it to `/home/dev/joosep/authorized_keys` and restarts the container. Because that file is
   a `:ro` bind re-read every start, this is edit-and-restart -- **no rebuild, no recreate**. The
   3-key pattern to mirror from allerk: PO key + container-internal key + the colleague's workstation key.
3. PO sends the host-key fingerprint out of band.
4. Joosep runs `Connect-Joosep` (bare), gets the host-key prompt once, **compares it to what the PO
   sent** before accepting. Because `joosep_sshd` persists the host keys, this prompt appears once and
   never again -- including across image rebuilds. If it ever reappears, that is a signal, not noise.
5. In the bare shell: run `claude`, follow the OAuth device flow (browser on his own machine, paste the
   code back). Credentials land in `joosep_home` and survive restarts.
6. `exit`, then `Connect-Joosep -Session` -- the normal way in from here on.

Steps 1-3 involve the PO and happen once. Steps 4-6 are Joosep alone, roughly ten minutes.

---

## 4. Team design -- filled from the research brief

Source: `teams/framework-research/docs/joosep-profile-brief-2026-08-28.md` (*FR:Aen*, REVISED second
pass). This section takes only what the container must encode. Roster sizing stays a PO decision.

### 4.1 The engagement question -- CLOSED

> **`[PO-15]` CLOSED 2026-08-28 14:06 (PO): Joosep continues as a permanent (stationary) colleague.**
> This is no longer a mandate-contract question.

The brief's headline #1 read his ITSD record as a *käsundusleping* valid 28.07-31.08.2026 with no
renewal ticket found `[R2]`, and I escalated that to a gate outranking `[PO-1]`/`[PO-2]`. The PO has
answered it directly, which is what the brief itself said was the only way to answer it -- **ask a
person, not Jira.** The `[R2]` null was reading (a) or (b) of the four the brief listed, not (c) or
(d): a permanent employment change would not file as the same *"Töötaja andmed"* contract-event
routing ticket the query was shaped to match.

Two things worth keeping from the episode rather than discarding with it: the brief's counter-signal
(he committed code on 2026-08-28, the day it was written) pointed the right way, and **the query's
shape, not its result, was the weak link** -- a negative from an instrument built for one document
class says nothing about another. Provisioning now carries no undo risk.

### 4.2 What the container must encode

| Input | Value from the brief | Where it lands |
|---|---|---|
| GitHub identity | `JoosepM-565` | key/PAT provisioning |
| Repos actually touched | **`HES-integration-tests`** (53 commits, via team `vjs`) and **`rumba`** (14 commits, team `vjs2`) -- **only these two**. The entire `hes`-team grant is unexercised | `REPO_URL` + `[PO-3]` scope |
| Atlassian MCP | **`plugin_atlassian_atlassian`** -- pin it. The `claude.ai Atlassian` connector returned 404 *"Server not found"* across three independent sessions | `~/.claude/mcp.json` seed |
| Jira projects (read) | `VJS1`, `VEO`, `HES`, `PONY`, `FSM`, `D365`, `ITSD` -- **grant by key, not display name**: `VEO` displays as "VJS2" | MCP scope |
| Confluence | read + write to the `VJS2` space only | MCP scope |
| Anthropic credential | he already holds a licence and group (ITSD-39589/39591) -- **reuse, do not re-request** | answers `[PO-5]` |
| Network reach | `eestiraudtee.atlassian.net`, `github.com` + `api.github.com`, `api.anthropic.com`, hub host if federated | §2.4 |

Two brief findings that belong in the **prompts**, not the compose file, and would be lost if only the
infra track read this:

- **`gh search` indexes default branches only and demonstrably missed 14 of his 67 commits.** Any
  survey tooling must enumerate via `repos/{owner}/{repo}/branches` then
  `commits?sha=<branch>`. The brief says to encode this in the team's prompts; recording it here so it
  survives the handoff.
- **Narrow-then-expand on repo access**, rather than mirroring all 40+ granted repos. His own access
  ceiling is a sensible *ceiling*, not a sensible *starting point*.

### 4.3 The must-NOT list, superseding my §2.8 draft where they overlap

The brief's §6.4 is ranked by consequence and is authoritative over anything I inferred. The first item
is the one that changes the container:

1. **No write path to any VJS/HES/PONY runtime or test environment, and no ability to send messages
   into them.** The Elron/PONY message tooling can emit traffic into a **live railway dispatch
   system**. The reserved train ranges (4020-4029, 4040-4049, 4120-4129, 4140-4149) exist because
   collision with real train numbers is the failure mode.

   > **Do not write `isTest` into any prompt, roster, or policy file.** Commit `39f16a83` (2026-08-26)
   > **removed the `isTest` toggle and hidden field entirely; the server now always sends
   > `isTest=false`.** A team told to rely on that flag would believe itself protected by a mechanism
   > hard-coded to the unsafe value. **The as-built guardrail is TEST-endpoint-only routing** -- the
   > tool can physically reach only the test endpoint, and **the endpoint URL must not be configurable
   > from inside the container.** Range enforcement must be non-bypassable.
   >
   > For the container that means: the endpoint is baked at image build or injected read-only by
   > compose, never read from a file the container user can edit, and never overridable by env var
   > reachable from the agent session. This is the one place in this design where a container-level
   > control is doing real safety work rather than convenience-scoping.

2. **No Cloudflare deploy credentials** -- VJS2 releases via GitFlow with PR review as the gate; the
   team observes the gate, it must not pass through it. *(Confirms my `[PO-3]`: no `CLOUDFLARE_*`.)*
3. **No merge/push rights to `main` on any repo.** `HES-integration-tests` accepts direct-to-`main`
   pushes with no PR history -- **the absence of a guardrail is not permission.** Branch + PR only. He
   is **not** in `vjs-code-reviewers`, so the team cannot approve merges and must not be given a path
   that lets it.
4. **No Jira admin rights** -- he requested them (ITSD-39812) and does not have them. The team must not
   exceed its principal.
5. **No Jira/Confluence write outside VEO-98, his own VJS1 issues, and the VJS2 space.** Hygiene
   findings are **reported, never applied** -- bulk-editing another project's Fix Versions is the most
   plausible way this team causes an incident.
6. **No HR/ITSD/identity systems** -- his ITSD tickets carry employment-record numbers and contract
   dates. Read-only at most, and only against a named need.
7. **No credential store access** -- the shared root `.env` holds live `HES_`/`VJS_`/`PONY_` test-user
   secrets on a shared account. Keep it out of the container.
8. **No `vjs_apex_apps`** -- read-only by workspace policy and outside his remit.

Note how this reads against §2.8: items 2-8 are scoping decisions that a container enforces only by
construction, and §2.8's honest posture applies to them unchanged. **Item 1 is different in kind** --
it is the one control where "the container cannot reach it" is a real safety property rather than a
convenience, and it is worth saying that the two are not the same sort of claim.

### 4.4 Roster -- seven candidates against a six-role reference, sizing deferred

The brief proposes `team-lead`, `release-cartographer`, `hygienist`, `suite-keeper`, `fixture-warden`,
`builder`, `scribe`, and is explicit that **this is a coverage proposal, not an evidence-sized one** --
the original 75/25 split was withdrawn because it came from ticket counts, which measure volume rather
than effort. The apex reference shape is six. The brief's own suggestion for trimming is to merge
`hygienist` into `release-cartographer`.

That is `[PO-16]` and it is not mine. What the infra track needs from it is only: **the final count**,
for the tmux layout geometry and a sanity check on `pids_limit: 512`. Seven agents plus a lead is well
inside that ceiling, so the answer does not gate the build.

Three open questions in the brief bear on the roster and are worth the PO seeing together: whether the
team is for Joosep, for a pair (VEO-98's one analytical artifact was **last edited by Valeri Kuzmin**,
who may be the durable owner of the topic), or for the practice; whether its mandate covers the five
projects he does not own; and what he actually is -- the brief now finds **three** registers of
evidenced work (E2E automation, service build, release reporting), not two.

---

## 5. Failure modes and acceptance checks

| Failure | Symptom | Behaviour |
|---|---|---|
| Not enrolled in WARP | timeout to `100.96.54.170` | indistinguishable from a host outage; check WARP first |
| Wrong/absent SSH key | `Permission denied (publickey)` | script pre-checks the key file and prints the keygen command |
| Container stopped | `Connection refused` on 2231 | `restart: unless-stopped` covers reboots and crashes |
| Host key changed | loud `REMOTE HOST IDENTIFICATION HAS CHANGED` | should never happen after `joosep_sshd`; if it does, **stop and ask** rather than clearing `known_hosts` |
| `claude: command not found` over `-Session` only | remote-command PATH | the `SetEnv PATH` line (§3.3) |
| tmux session gone | `-Session` creates a fresh one and starts Claude | prior conversation lost; scratchpads on the volume are not |
| OAuth expired | Claude prompts to re-login inside the session | re-run the device flow |
| GitHub PAT expired / SSO lapsed | entrypoint's clone/pull warns, container still boots | apex's non-fatal-clone discipline (`entrypoint-apex.sh:144-151`) |
| Disk pressure | git/npm fail mid-run | 246 G free on `/home`; not a near-term risk |
| Operator lands in the container **as root** | files created during that session are root-owned | `docker compose exec` **bypasses the entrypoint**, so its `gosu` drop never runs. Always pass `--user joosep` (allerk's launcher does this on every exec). The damage -- **root-owned files left inside the named volumes** -- outlives the session and is *not* repaired by passing `--user` next time; it has to be chowned. |
| `claude` resolves to an unexpected version | version discrepancy, varies by how you logged in | never `npm install -g` alongside the native install (§2.2); diagnose with `type -a claude` |

Acceptance checks for whoever executes the build (not me):

1. `ss -lnt` shows 2231 bound after `up -d`.
2. `Connect-Joosep` lands in a bash prompt, and `tmux ls` shows **no** session -- proves Route A is absent.
3. `Connect-Joosep -Session` lands inside tmux with Claude running.
4. Detach, reconnect with `-Session` -- same session, conversation intact.
5. `docker compose restart` -> `-Session` still works, **no** host-key prompt.
6. Add a line to `authorized_keys`, restart, confirm the new key works with **no rebuild**.
7. From inside: `ls /var/run/docker.sock` absent; `ls ~/.ssh` contains no fleet private key.
8. Rebuild the image -- no host-key change, OAuth still valid, `claude` still resolves over
   `ssh host <command>`.

---

## 6. PO Decision Register

| # | Decision | Recommendation | Gates |
|---|---|---|---|
| ~~**PO-1**~~ | ~~Base: `allerk` or `apex-research`~~ | **DECIDED 2026-08-28 13:58 (PO): allerk-base**, with apex contributing only the team env vars, MCP/settings seeding and config layout. §0's recommendation adopted as written. | ~~gate~~ **CLOSED** |
| ~~**PO-2**~~ | ~~Network: bridge or host~~ | **CLOSED BY MEASUREMENT 2026-08-28: `network_mode: host`.** A bridged container on this host cannot resolve DNS at all. Hard constraint, not a preference (§2.4) | ~~gate~~ **CLOSED** |
| **PO-17** | *(deferred, not open)* Is bridge networking recoverable via an explicit `dns:` setting? The probe's failure was resolver-scoped, and the routing question was never exercised | **Do not pursue now.** One cheap probe if isolation is ever wanted for a named reason; the exact command is in §2.4 | -- |
| ~~**PO-3**~~ | ~~GitHub token scope~~ | **DECIDED 14:24 (PO): scope as recommended, but CREATED BY Joosep's team as task 1**, not supplied by the PO (§2.6a) | ~~open~~ **CLOSED** |
| ~~**PO-4**~~ | ~~Atlassian credential owner~~ | **DECIDED 14:24 (PO): EVR connector, no API token at all.** Closes the Confluence gap as a side effect (§2.6a) | ~~open~~ **CLOSED** |
| **PO-18** | The EVR connector's exact install/enable step inside a container | **Unknown to me and deliberately not guessed** -- `FIRST-TASKS.md` task 2 says so and gives three verifications instead. PO supplies the step at hand-over | hand-over |
| **PO-5** | Anthropic auth -- whose account funds it | OAuth at first run; confirm the account | first run |
| **PO-6** | Python 3 in the image? | omit in v1; add if the brief shows a need | image |
| **PO-7** | Join the stationmaster mail network? | **no** in v1; add later if a real correspondent exists. EVR island = prod-llm hub only | later |
| **PO-8** | **Cloudflare WARP enrolment for Joosep** | required; nothing works without it. Diagnostic `warp-cli status` | prerequisite |
| **PO-9** | Registry drift (4 defects, §1.4): `allerk` in neither registry; the two registries disagree about `screenwerk`/`mvox`; a **third** and more accurate port record lives in allerk's compose header; apex `tmux` name mismatch | separate ticket -- pre-existing, unrelated to Joosep. Register 2231 in **all three** records | -- |
| **PO-10** | Resource ceilings -- and whether a **second** container promised 12/20 cores + 40/62 GiB is right | match allerk (12 / 40G) and accept the overcommit; add `pids_limit: 512`. Alternatives (lower-and-asymmetric, or fleet-wide reservations) costed in §2.5 | build |
| **PO-13** | WARP CA: bind-mount the host file (apex) or bake a copy into the image (allerk) | **bind-mount** -- a stale baked CA fails silently as fake network errors; a moved host path fails loudly at boot (§2.2) | build |
| **PO-11** | In-container `sudo`? | **grant it**, matching allerk; treat reproducibility as convention, not a lock (§2.8) | build |
| **PO-12** | **Four keys on host `dev`** (docker group = root-equivalent), one labelled `joosep.madar@evr.ee` | **First identify all four by fingerprint** -- comments on this host are documented-unreliable, so the label is not an attribution (§2.8). *Then* revoke/container-only, conditional on the key not serving an active purpose; if it does, keep it and drop the isolation framing instead (§2.9) | posture |
| **PO-14** | Does the PO want a *real* boundary between users? | Out of scope here, but allerk's README names the only two answers that work: **rootless Docker, or separate Linux accounts.** Nothing short of those is a boundary | -- |
| ~~**PO-15**~~ | ~~Is Joosep's contract renewed past 31.08.2026?~~ | **DECIDED 2026-08-28 14:06 (PO): permanent (stationary) colleague.** Not a mandate-contract question. No undo risk on provisioning (§4.1) | ~~gate~~ **CLOSED** |
| **PO-16** | Roster size -- 7 candidate roles against a 6-role reference shape, sizing basis withdrawn | Not mine. Infra needs only the final count, for tmux geometry; does not gate the build (§4.4) | team design |

## 7. Open questions

- **The §2.4 bridge probe** -- Tier M, validated by Hopper, awaiting Aen/PO sanction. He is holding
  correctly and will not run it before relay. The sanction should explicitly cover the transient
  `docker0` carrier-up transition.
- **Fingerprint identification of the four keys on `dev`** -- Tier R, cheap, and it should precede the
  `[PO-12]` conversation rather than follow it (§2.9 Step 0).
- **`allerk`'s README carries ~40 sections; five were read.** The other 35 are unexamined and this is
  the single richest operational artifact on the host. Worth a full read before anyone builds, not
  because a specific gap is known but because five-for-five landed on live decisions.
- **`/etc/sudoers.d/dev-migration-preflight`** -- `0440 root:root`, unreadable at Tier R, created
  2026-08-26. Not needed for this design; noted so nobody assumes the sudoers picture is complete.
- **Backup.** No container on the host has one. `joosep_home` would hold OAuth credentials and every
  scratchpad, and `down -v` destroys it. Out of scope here; worth raising fleet-wide.
- **Who operates it.** If Joosep cannot run `docker compose`, every image change, credential rotation
  and restart is a PO action. A support-load question, not a technical one, and better answered before
  the container becomes someone's daily driver. Note that under `[PO-12]` option (b) he would have no
  host shell, so the answer is "the PO does" by construction.

---

*Designed by (*FR:Brunel*), framework-research, S66 2026-08-28. Host survey by (*FR:Hopper*), Tier R.
Nothing in this document has been executed; no RC-host state was modified in producing it.*
