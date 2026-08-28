# Provisioning runbook -- `joosep` container on RC (*FR:Brunel*)

**Executor:** Hopper (or the PO at the keyboard).
**Host:** RC `100.96.54.170`, as `dev`.
**Tier:** M throughout unless a step says otherwise. **No step here is sanctioned by this document** --
sanction comes from the PO via Aen.

Every step has **EXPECT** (what success looks like) and **STOP** (the condition that halts the run).
When a STOP fires, halt and report; do not improvise past it. Steps are ordered so that everything
reversible happens before anything that touches a file we do not own.

**Before starting, confirm these are true.** All were verified 2026-08-28 but the host is shared:

- `[PO-2]` resolved and this runbook's §0 network line matches the ruling.
- 2231 still free (`ss -lnt | grep 2231` returns nothing).
- `/home` still has room (>10 G; it had 246 G).
- `/usr/local/share/ca-certificates/managed-warp.pem` still exists.

---

## Step 0 -- Confirm the network shape

```bash
grep -n 'network_mode\|^    networks:\|^    ports:\|PENDING' /home/dev/joosep/docker-compose.yml
```

**EXPECT:** `network_mode: host` present; no `ports:`, no `networks:`, no `PENDING`.

**STOP** on anything else. `[PO-2]` was settled by measurement on 2026-08-28 — a bridged container on
this host could not resolve DNS at all (`curl: (28) Resolving timed out`, `getent` silent), so host
networking is a hard constraint here, not a preference. If someone has switched this file to bridge,
they have information this runbook does not; find out what before building.

## Step 1 -- Stage the directory (Tier M, reversible)

```bash
mkdir -p /home/dev/joosep && cd /home/dev/joosep
# copy docker-compose.yml, Dockerfile, entrypoint.sh, joosep.sh, .env.example
# from designs/new/joosep/ in the mitselek-ai-teams checkout
chmod +x joosep.sh entrypoint.sh
ls -la
```

**EXPECT:** `docker-compose.yml`, `Dockerfile`, `entrypoint.sh` (executable), `joosep.sh` (executable),
`.env.example`. No `.env` yet, no `authorized_keys` yet.

**STOP** if `/home/dev/joosep` already exists with content — something else claimed the name; report
rather than merging into it.

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

**STOP** on `services.joosep.env_file must be a ...` or similar → the long-form `env_file:` entry
(`{path: .env, required: false}`) needs **Compose v2.24+**. `allerk` uses the same form on this host so
the version should be fine, but if it is not, replace those three lines with the short form
`env_file: [.env]` and create an empty `.env` if absent.

**STOP** on any other parse error and report it — do not hand-patch the file past a validation failure
without saying which line changed.

## Step 5 -- Build (Tier M, ~5-10 min)

```bash
cd /home/dev/joosep && ./joosep.sh build 2>&1 | tail -30
```

**EXPECT:** ends with `naming to docker.io/library/joosep:latest` or similar success; no `ERROR`.

**STOP** on any of:
- **exit 60 from curl** at the Node or Claude layer → WARP CA problem at build time. The Dockerfile
  already uses `--insecure` at those two points; if it still fails, the WARP posture changed and that
  is a host question, not a Dockerfile one.
- **apt hangs then times out** → the build is not getting egress. Confirm `network: host` is present
  under `build:` in the compose file.

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

**One thing you owe him that this package cannot supply.** `FIRST-TASKS.md` task 2 is authenticating
the EVR Atlassian connector, and **the exact install/enable step is marked as unverified in that file**
— I have not confirmed how the EVR connector is distributed or enabled from inside a container, and I
declined to guess, because a wrong guess leaves a half-configured MCP entry that fails confusingly.
Supply the precise step, or tell him who to ask. The *verification* in that task is sound regardless:
`atlassianUserInfo` returns his own account, `getVisibleJiraProjects` includes the six project keys,
and `getConfluenceSpaces` includes `VJS2` — that last one being the check that proves the connector did
something a Jira-only setup could not.

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
