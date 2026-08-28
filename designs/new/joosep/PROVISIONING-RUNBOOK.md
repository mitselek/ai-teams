# Provisioning runbook -- `joosep` container on RC (*FR:Brunel*)

**Executor:** Hopper (or the PO at the keyboard).
**Host:** RC `100.96.54.170`, as `dev`.
**Tier:** M throughout unless a step says otherwise. **Step 9d is Tier D** (access control on the shared
`dev` account; lockout surface). **No step here is sanctioned by this document** -- sanction comes from
the PO via Aen.

Every step has **EXPECT** (what success looks like) and **STOP** (the condition that halts the run).
When a STOP fires, halt and report; do not improvise past it. Steps are ordered so that everything
reversible happens before anything that touches a file we do not own.

**Before starting, confirm these are true.** All were verified 2026-08-28 but the host is shared:

- `[PO-2]` resolved and this runbook's §0 network line matches the ruling.
- 2231 still free (`ss -lnt | grep 2231` returns nothing).
- `/home` still has room (>10 G; it had 246 G).
- `/usr/local/share/ca-certificates/managed-warp.pem` still exists.

---

## Step 0 -- Confirm the network shape (in the SOURCE checkout)

```bash
cd <mitselek-ai-teams checkout>/designs/new/joosep
grep -n 'network_mode\|^    networks:\|^    ports:\|PENDING' docker-compose.yml
```

> **Path corrected 2026-08-28** (Hopper pre-flight): this previously pointed at
> `/home/dev/joosep/docker-compose.yml`, which **Step 1 has not created yet**. Step 0 is a pre-flight on
> the artifact you are about to copy, so it reads the source. Step 4b re-validates the staged copy after
> Step 1, which is the one that actually gets built.

**EXPECT:** `network_mode: host` present; no `ports:`, no `networks:`, no `PENDING`.

**STOP** on anything else. `[PO-2]` was settled by measurement on 2026-08-28 — a bridged container on
this host could not resolve DNS at all (`curl: (28) Resolving timed out`, `getent` silent), so host
networking is a hard constraint here, not a preference. If someone has switched this file to bridge,
they have information this runbook does not; find out what before building.

## Step 1 -- Stage the directory (Tier M, reversible)

```bash
mkdir -p /home/dev/joosep && cd /home/dev/joosep
# Copy ALL FIVE build-context files from designs/new/joosep/ in the checkout:
#   docker-compose.yml  Dockerfile  entrypoint.sh  FIRST-TASKS.md  .env.example
# plus the launcher:
#   joosep.sh
# THEN take the WARP CA from the host into the build context (7th file):
cp /usr/local/share/ca-certificates/managed-warp.pem ./warp-ca.pem
chmod +x joosep.sh entrypoint.sh
ls -la
```

**EXPECT** all seven present: `docker-compose.yml`, `Dockerfile`, `entrypoint.sh` (executable),
**`FIRST-TASKS.md`**, **`warp-ca.pem`**, `joosep.sh` (executable), `.env.example`. No `.env` yet, no
`authorized_keys` yet.

> **`warp-ca.pem` added 2026-08-28** after the Claude-install layer failed on TLS. The entrypoint
> installs this CA at *runtime*, which is too late for the build — the Claude installer is
> `curl | bash`, and the script it downloads runs its own curl with its own flags, so the outer
> `--insecure` never reaches it. The Dockerfile now installs the CA early so the whole build has a real
> trust store. It is a **public CA certificate, not a secret**; it is taken from the host rather than
> committed to the repo, which is also what `allerk` does.

> **`FIRST-TASKS.md` added to this list 2026-08-28** (Hopper pre-flight caught its omission). It is a
> **build-context file**, not documentation: `Dockerfile` COPYs it to `/opt/FIRST-TASKS.md`, so its
> absence fails the build at that layer. Easy to read as a docs file and leave behind, which is exactly
> what happened.

**STOP** if any of the six is missing — do not start the build and discover it at the COPY layer.

**STOP** if `/home/dev/joosep` already exists with content — something else claimed the name; report
rather than merging into it.

`registry-rows.md`, `PROVISIONING-RUNBOOK.md`, `README.md` and `Connect-Joosep.ps1` are **not** copied:
the first three are for you, and the fourth goes to Joosep's Windows machine.

## Step 2 -- Line endings

```bash
file entrypoint.sh joosep.sh | grep -i crlf && echo "CRLF FOUND" || echo "LF ok"
```

**EXPECT:** `LF ok`.

**STOP / FIX:** if CRLF, run `sed -i 's/\r$//' entrypoint.sh joosep.sh` and re-check. A CRLF entrypoint
fails with a bare `exec format error` or `no such file or directory` that names the interpreter, not the
line endings — this check exists because that message sends people down the wrong path. These files
came from a Windows checkout, so the risk is real.

## Step 3 -- `.env` (Tier M) -- **nothing to fill in**

```bash
cp .env.example .env
chmod 600 .env
ls -l .env
```

**EXPECT:** `-rw------- 1 dev dev`.

**Change nothing in it.** Per the PO decision of 2026-08-28 the container starts deliberately
under-credentialled: **no GitHub token and no Atlassian credentials.** Provisioning those is the first
real work for Joosep's own team (`FIRST-TASKS.md`, seeded into `~/` inside the container), so the
things this team can reach are things *he* granted under *his* name.

`env_file` is marked `required: false`, so even a missing `.env` boots. Copying it is only so the file
exists with the right mode when a token is added later.

**Do NOT** add Cloudflare credentials, any `HES_`/`VJS_`/`PONY_` test-user secret, any `ATLASSIAN_*`
variable, or any Elron/PONY endpoint URL. The `.env.example` comments give the reason for each.

**Adding the PAT later needs no rebuild:** edit `.env`, then `./joosep.sh restart`. That is
`up -d --force-recreate` — **compose re-reads `.env` only on a recreate, never on a plain
`docker restart`**, which is the trap this note exists to prevent. The repos clone automatically on
that boot.

## Step 4 -- Ingress key

```bash
# Joosep sends the .pub line out of band; paste it as one line.
cat > /home/dev/joosep/authorized_keys <<'EOF'
ssh-ed25519 AAAA... joosep@evr
EOF
chmod 644 authorized_keys
ssh-keygen -lf authorized_keys
```

**EXPECT:** `ssh-keygen -lf` prints one fingerprint per line and exits 0.

**STOP** if `ssh-keygen -lf` errors — the file is malformed (a wrapped line is the usual cause) and
sshd will silently refuse the key rather than tell you it is broken.

**Read back the fingerprint to Joosep out of band and have him confirm it against
`ssh-keygen -lf ~/.ssh/id_ed25519_joosep.pub` on his machine.** Key comments on this host are
documented-unreliable — `allerk`'s README records that the key commented `hr-platform` in `dev`'s
authorized_keys is in fact the PO's own Windows client key. **Match by fingerprint, never by comment.**

## Step 4b -- Validate the compose file BEFORE building (Tier R)

```bash
cd /home/dev/joosep && docker compose config --quiet && echo "COMPOSE OK"
```

**EXPECT:** `COMPOSE OK`, no output above it.

**This step exists because I could not run it.** Docker is not available on the authoring machine, so
`docker-compose.yml` shipped **syntax-unvalidated** — the YAML was written by hand and reviewed by eye,
nothing more. This is a read, it costs a second, and it catches an indentation slip before you spend
5-10 minutes on a build that would fail at parse time anyway.

**This step earned its place on first use, 2026-08-28.** It caught a real parse failure — see below —
5-10 minutes before a build that could not have worked. Two findings from that run:

- **Compose on RC is v5.1.0.** The long-form `env_file:` entry parses fine; the v2.24 concern this note
  previously carried does not apply. Recorded so nobody re-derives it.
- **`pids_limit` and `deploy.resources.limits.pids` are the SAME setting** and Compose refuses the
  project if both are present with distinct values:
  `can't set distinct values on 'pids_limit' and 'deploy.resources.limits.pids'`. **Fixed** — the pid
  ceiling now lives inside `deploy.resources.limits` as `pids: 512`, with no top-level `pids_limit`.
  If you see this error, the top-level key has been reintroduced.

**STOP** on any parse error and report it — **do not hand-patch the compose file past a validation
failure.** Send the error to Brunel and apply the exact replacement text he returns. A parse error is
usually a design defect wearing a syntax costume, and patching it locally hides which.

## Step 5 -- Build (Tier M, ~5-10 min)

```bash
cd /home/dev/joosep && ./joosep.sh build 2>&1 | tail -30
```

**EXPECT:** ends with `naming to docker.io/library/joosep:latest` or similar success; no `ERROR`.

**EXPECT** these three build-time assertions in the output — they are the point of this step:
`[build] WARP CA installed into the build trust store.`, `[build] claude installed and executable.`,
and a `pnpm --version`.

**STOP** on any of:
- **A TLS/certificate error at any layer** → the CA layer did not do its job. Check that
  `warp-ca.pem` is present in the build context (Step 1) and that `update-ca-certificates` ran.
- **`test -x /home/joosep/.local/bin/claude` fails** → the install did not produce a binary. This
  assertion exists *because the layer previously reported success while installing nothing.*
- **apt hangs then times out** → the build is not getting egress. Confirm `network: host` is present
  under `build:` in the compose file.

> **Corrected 2026-08-28.** This STOP previously said *"exit 60 from curl … if it still fails the WARP
> posture changed, and that is a host question, not a Dockerfile one."* **Both halves were wrong.** The
> trigger could never fire — `| tail` made the layer exit 0 regardless — and the cause was a Dockerfile
> fault, not a host one: `--insecure` on a `curl | bash` does not reach the curl *inside* the
> downloaded script. WARP was fine throughout (apt pulled at 12.5 MB/s). **A STOP whose trigger cannot
> fire is worse than no STOP**, because it advertises coverage it does not have.

## Step 6 -- First start (Tier M)

```bash
./joosep.sh up && sleep 15 && docker logs joosep 2>&1 | tail -40
```

**EXPECT**, in the log tail:
- `[entrypoint] WARP CA added to system CA store.`
- `[entrypoint] generated persistent sshd ed25519 host key (first boot).`
- `[entrypoint] sshd started on port 2231.`
- `OK: Node.js v22`
- `OK: claude resolves on the sshd remote-command PATH (-Session will work)`
- `[entrypoint] Ready.`

Also **EXPECT** these three, which are the correct first-boot state and **not** faults:
- `[entrypoint] No GITHUB_TOKEN yet -- skipping clones. This is expected on first boot.`
- `PENDING: repos not cloned (no PAT yet -- task 1 in ~/FIRST-TASKS.md)`
- `[entrypoint] seeded ~/FIRST-TASKS.md (first boot).`

**STOP** if you instead see `WARN: ... absent despite a token` — that wording only appears when a token
*is* present, and means its scope is narrower than the two repos.

**STOP** on:
- `FAIL: Node.js < 20 -- aborting` (the container will restart-loop).
- `WARNING: /opt/authorized_keys empty or missing -- SSH access DISABLED` → Step 4 did not land.
- `WARN: claude does NOT resolve on the remote-command PATH` → the `SetEnv PATH` line in
  `sshd_config` did not take. `-Session` will fail while a bare login still works, which is the
  hardest split in this design to diagnose after the fact. Fix before proceeding.

## Step 6b -- Are the resource ceilings actually ENFORCED? (Tier R)

```bash
docker inspect joosep --format '{{.HostConfig.NanoCpus}} {{.HostConfig.Memory}} {{.HostConfig.PidsLimit}}'
```

**EXPECT:** `12000000000 42949672960 512` — 12 CPUs in nanocpus, 40 GiB in bytes, 512 pids.

> ## ANSWERED 2026-08-28 17:04 — the ceilings ARE enforced
>
> `joosep: 12000000000 42949672960 512` — exact match. So `deploy.resources.limits` is applied by the
> daemon under a plain `up` on this Compose; it is **not** Swarm-decorative here. The
> "reconciliation is not enforcement" caution resolves in favour of enforcement, **measured rather
> than inferred**.
>
> **And the fleet fact is not the one I expected.** `allerk` reads
> `12000000000 42949672960 <no value>` — its CPU and memory ceilings **are** enforced, so it is not
> unbounded as I had warned. But **`PidsLimit` is unset: it has no pid ceiling at all.** That is
> exactly the gap `pids: 512` was added here to close, which makes that addition a live finding
> rather than a precaution — **a fork-bomb hits a pid ceiling long before a 40 GB memory ceiling
> notices, and allerk has none to hit.**
>
> One line in Lerko's compose, and **his to add** — routed to Aen, not touched here.

**Why this step exists, and it is an open question rather than a formality** (Hopper raised it,
2026-08-28): `deploy:` has Swarm-era semantics, and **neither of us has verified that
`deploy.resources.limits` is enforced by this Compose under a plain `up`.** Compose *reconciling*
`pids_limit` against `deploy.resources.limits.pids` — the parse error in Step 4b — is strong evidence
that both feed the same runtime setting, but it proves reconciliation, not enforcement. This inspect
settles it empirically in one command instead.

**STOP if any value reads `0`.** That means `deploy.resources.limits` is decorative here and the
container has **no ceilings at all**, which matters most for `PidsLimit`: the pid ceiling is the guard
against an agent-driven fork-bomb, and silent non-enforcement of a safety ceiling is the bad outcome.
The fix would be to express all three as top-level keys instead (`cpus`, `mem_limit`, `pids_limit`) and
rebuild.

**Report the result either way — it is a fleet fact, not a joosep fact.** `allerk` uses the same
`deploy.resources.limits` block, so if it is decorative here it is decorative there too, and Lerko's
container has been running unbounded on a shared host since 2026-08-18.

## Step 7 -- Port bound

```bash
ss -lnt | grep 2231
```

**EXPECT:** a LISTEN line on 2231.

**STOP** if empty. Under host mode `docker port` returns empty even when healthy — that is expected and
is not evidence of a problem; `ss` is the authority here.

## Step 8 -- Record the host key fingerprint (Tier R)

```bash
docker exec joosep ssh-keygen -lf /etc/ssh/keys/ssh_host_ed25519_key.pub
```

**EXPECT:** one SHA256 fingerprint. **Record it and send it to Joosep out of band before his first
connection**, so his first-connect prompt is verified rather than blindly accepted.

> **RECORDED 2026-08-28 17:04 — this is the value, and it must never change again:**
>
> ```
> SHA256:C8qVyjSQuyiSXPzEBcIOh2tfUwlk9EJtU2WxhAEbO3U   (ED25519)
> ```
>
> It lives on the `joosep_sshd` volume, so it survives image rebuilds — verified at Step 10. **Send
> this string to Joosep out of band** (not in the same channel as anything else he is given) and have
> him compare it at his first connect. If it ever differs afterwards, that is a signal, not noise:
> nobody should clear `known_hosts` to make a warning go away.

This is the value that must never change again. It lives on the `joosep_sshd` volume, so it survives
rebuilds — if it ever changes without a deliberate volume wipe, that is a signal.

## Step 9 -- Both modes, from a WARP-enrolled machine (Tier R)

```bash
# 9a -- bare mode must land in a SHELL
ssh -i ~/.ssh/id_ed25519_joosep -p 2231 joosep@100.96.54.170 'tmux ls; echo "shell-ok"'
```

**EXPECT:** `no server running on ...` (or no session named joosep) followed by `shell-ok`.

**STOP** if this drops you into tmux. That means an auto-tmux hook got into `.bashrc` and the bare mode
is dead — the single failure this design is shaped to prevent. The entrypoint does not install one;
if it appears, something else did.

```bash
# 9b -- the -Session path, exactly as the PowerShell switch invokes it
ssh -t -i ~/.ssh/id_ed25519_joosep -p 2231 joosep@100.96.54.170 joosep-session
```

**EXPECT:** a tmux session named `joosep` with Claude starting in it. Detach with `Ctrl-b d`.

**STOP** on `claude: command not found` → the Step 6 remote-command PATH check was passed over. This is
the exact symptom that check exists to catch early.

```bash
# 9c -- persistence: reattach and confirm it is the SAME session
ssh -t -i ~/.ssh/id_ed25519_joosep -p 2231 joosep@100.96.54.170 joosep-session
```

**EXPECT:** attaches to the existing session; **no** `No session 'joosep' -- creating one` line.

## Step 9d -- Revoke Joosep's key from the host `dev` account (**Tier D**) `[PO-12]`

> **Retiered M -> D, 2026-08-28 (Aen), and I agree without reservation.** I originally classified this
> Tier M because the edit is one line with a backup beside it. That reasoning weighed the *command*
> and not the *surface*: this is a non-designed mutation of **access control on the shared account
> through which the entire RC fleet is administered**, and its failure mode is locking `dev` out of
> the host. Recoverability via backup is irrelevant to the tier when the plausible error removes the
> path you would use to restore it. Tier D is correct.
>
> Tier D requires exact command + reason + expected outcome, verbatim. All three are below and were
> already written that way; only the label was wrong.

**PO decision 2026-08-28 15:27.** He will not manage containers, so he needs no host access. Until this
runs, `dev` + the `docker` group gives him root-equivalent access to the whole host, and the container's
scoping is decorative.

**Ordering is deliberate and must not be moved earlier.** This comes *after* Step 9, so his container
access is proven working before his host access is removed. Hopper byte-matched the supplied key to
`dev`'s `authorized_keys` **line 3** — it is the *same key*, so it keeps opening his container and no
re-key is needed. Revoke before Step 9 passes and you have taken away one path without confirming the
other.

**Target fingerprint:** `SHA256:g9kExnzOJyjyMGgqfGbecWDwZpGR2g/e5DoR49jKY70`
**Match by fingerprint, never by comment.** Comments on this host are documented-unreliable — the key
commented `hr-platform` in this very file is the PO's own Windows client key.

### 9d.0 — Open a second `dev` session and leave it open

```bash
# In a SEPARATE terminal, and DO NOT CLOSE IT until 9d.4 passes:
ssh dev@100.96.54.170
```

This is the whole safety net. Editing `authorized_keys` on a shared account is the classic way to lock
everyone out, and the held session is what makes a mistake recoverable rather than terminal.

### 9d.1 — Pre-checks

```bash
ls -l --time-style=full-iso ~/.ssh/authorized_keys
cp -a ~/.ssh/authorized_keys ~/.ssh/authorized_keys.bak.$(date +%Y%m%d-%H%M%S)
awk 'NF' ~/.ssh/authorized_keys | wc -l
while IFS= read -r l; do [ -n "$l" ] && printf '%s\n' "$l" | ssh-keygen -lf - 2>/dev/null; done < ~/.ssh/authorized_keys
```

**EXPECT:** mtime **2026-08-27 15:17**; **4** non-empty lines; four fingerprints, one of which is the
target.

**STOP if the mtime differs from 2026-08-27 15:17** — someone edited the file since Hopper read it, the
line-3 assumption is stale, and you must re-establish which line is which before touching anything.

### 9d.2 — Locate by fingerprint and confirm exactly one match

```bash
n=0; match=0; line=0
while IFS= read -r l; do
  n=$((n+1))
  [ -z "$l" ] && continue
  fp=$(printf '%s\n' "$l" | ssh-keygen -lf - 2>/dev/null | awk '{print $2}')
  if [ "$fp" = "SHA256:g9kExnzOJyjyMGgqfGbecWDwZpGR2g/e5DoR49jKY70" ]; then
    match=$((match+1)); line=$n
  fi
done < ~/.ssh/authorized_keys
echo "matches=$match line=$line"
```

**EXPECT:** `matches=1 line=3`.

**STOP if `matches` is not exactly 1.** Zero means the key is already gone or the fingerprint is wrong —
either way, changing nothing is correct. More than one means the same key is installed twice and the
situation needs understanding, not a delete. **Do not proceed on a guess about which line.**

### 9d.3 — Remove that one line

```bash
sed -i "${line}d" ~/.ssh/authorized_keys
awk 'NF' ~/.ssh/authorized_keys | wc -l
while IFS= read -r l; do [ -n "$l" ] && printf '%s\n' "$l" | ssh-keygen -lf - 2>/dev/null; done < ~/.ssh/authorized_keys
```

**EXPECT:** **3** non-empty lines; the target fingerprint **absent**; **the PO's own key still present**.

**STOP and restore from the 9d.1 backup** if the count is not 3, or if the PO's key is missing:

```bash
cp -a ~/.ssh/authorized_keys.bak.<timestamp> ~/.ssh/authorized_keys
```

### 9d.4 — Prove the PO can still get in, from a NEW connection

```bash
# From the PO's own machine, a FRESH session -- not the held-open one:
ssh dev@100.96.54.170 'echo dev-access-ok'
```

**EXPECT:** `dev-access-ok`.

**Only now close the 9d.0 session.** A held session survives an `authorized_keys` mistake; a new one
does not, which is exactly why this check must use a new connection.

### 9d.5 — Confirm Joosep still reaches his container

```bash
ssh -i ~/.ssh/id_ed25519_joosep -p 2231 joosep@100.96.54.170 'echo container-ok'
```

**EXPECT:** `container-ok` — the same key, still working, on the path he is meant to use.

**STOP** if this fails: he now has no access at all. Restore from the backup and report.

> **Consequence to state plainly at hand-over:** after this step Joosep has **no host shell**. Every
> image change, credential rotation, restart and recovery becomes a PO action. That is the intended
> posture — but it is a real support-load transfer, not just a security tightening, and he should know
> that "ask Mihkel" is now the only route when the container itself is unreachable.

## Step 10 -- Rebuild-survival (Tier M) — the check people skip

```bash
docker exec joosep ssh-keygen -lf /etc/ssh/keys/ssh_host_ed25519_key.pub   # note it
./joosep.sh build && ./joosep.sh restart && sleep 15
docker exec joosep ssh-keygen -lf /etc/ssh/keys/ssh_host_ed25519_key.pub   # compare
ssh -i ~/.ssh/id_ed25519_joosep -p 2231 joosep@100.96.54.170 'echo still-ok'
```

**EXPECT:** identical fingerprints before and after, and `still-ok` with **no** host-key warning.

**STOP** if the fingerprint changed — the `joosep_sshd` volume is not doing its job, and every future
rebuild will train Joosep to clear `known_hosts`. That habit is what makes host-key pinning worthless,
so this is worth fixing before he ever connects.

## Step 11 -- Posture spot-checks (Tier R)

```bash
docker exec --user joosep joosep bash -lc '
  ls /var/run/docker.sock 2>&1 | head -1
  ls ~/.ssh/ 2>/dev/null
  type -a claude
'
```

**EXPECT:** docker.sock **absent**; `~/.ssh` contains no `id_ed25519_apex`/`_polyphony`/`_entu`/
`_uikit`/`_tailnet`; `type -a claude` shows **exactly one** path, under `~/.local/bin`.

**STOP** if `type -a claude` shows two — the npm/native collision is present, and which version you get
will depend on how you logged in, presenting later as a version discrepancy rather than a PATH bug.

## Step 12 -- Registry rows

Apply per `registry-rows.md`. Items 2-4 are the PO's and Aen's files.

**Item 1 edits `/home/dev/allerk/docker-compose.yml`, which is Lerko's file** — a comment-only change,
but still a mutation of an artifact we do not own. **Route separately; skip it here if unsanctioned.**
Nothing breaks if it is skipped; the host's only accurate port record just stays incomplete.

## Step 13 -- Hand over

Send Joosep: the host-key fingerprint (Step 8), `Connect-Joosep.ps1`, and the README's first-run
section. Point him at **`~/FIRST-TASKS.md` inside the container** — that is his onboarding backlog, not
this runbook.

His first `claude` run does the OAuth device flow in his own browser; credentials land in `joosep_home`
and survive restarts and rebuilds.

**`[PO-18]` RESOLVED 2026-08-28 15:52 — nothing is owed by the PO here.** An earlier draft of this step
said the connector's exact install command was owed to Joosep at hand-over. **It is not: there is no
provisioning-side install step.** Enabling the EVR Atlassian connector is his team's **second
assignment** — his agents steer him through it interactively, which is what `FIRST-TASKS.md` task 2 is
already shaped for. Nothing to supply; just point him at the file.

The three verifications in that task remain the acceptance criteria: `atlassianUserInfo` returns his
own account, `getVisibleJiraProjects` includes the six project keys (**by key** — `VEO` displays as
"VJS2"), and `getConfluenceSpaces` includes `VJS2`, that last being the one that proves the connector
did something a Jira-only setup could not.

**Expect to do one round trip after he finishes task 1:** he produces the PAT, sends it to you over a
password-grade channel, you add `GITHUB_TOKEN=` to `.env` and run `./joosep.sh restart`. The repos
clone on that boot. No rebuild.

---

## Rollback

Fully reversible up to Step 11. Nothing here modifies another container, another volume, or any host
service.

```bash
cd /home/dev/joosep
./joosep.sh down                    # stop, keep volumes
docker rmi joosep:latest            # drop the image
```

**To remove state as well — read this first:**

```bash
docker volume rm joosep_home joosep_work joosep_sshd
```

`joosep_home` holds the OAuth credentials and every agent scratchpad; `joosep_sshd` holds the host
keys, so removing it means Joosep gets a changed-host-key warning on his next connection. Only run this
if the intent is a genuine clean slate. `joosep.sh down` refuses `-v` for this reason.

**Do not** `docker rmi` anything else while cleaning up. Image removal can cascade through parent
layers shared with other containers on this host, and that has cost a real incident here before.

(*FR:Brunel*)
