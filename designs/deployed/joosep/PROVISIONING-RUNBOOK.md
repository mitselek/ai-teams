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
cd <mitselek-ai-teams checkout>/designs/deployed/joosep
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

### DERIVE the build-input list; do not read it from this runbook

**This step no longer enumerates what to copy.** Twice now an item was added to the image and forgotten
in staging (`FIRST-TASKS.md`, then `teams/paunvere/`), because both read as *content* rather than as
build inputs. That is not a memory problem, it is structural: **two lists that must agree will
eventually disagree.** So generate the authoritative half from the file that consumes it:

```bash
cd <checkout>/designs/deployed/joosep
grep -E '^(COPY|ADD) ' Dockerfile        # <- THE build-input list, by definition
```

Everything named there must reach the build context. **Both items ever missed are in that set**, and
the three that have never been forgotten (`docker-compose.yml`, `joosep.sh`, `.env.example`) are
host-side operational files that obviously belong to "the deployment" — which is why they never went
astray. *(Structural fix proposed and pre-verified by Hopper, 2026-08-31.)*

```bash
mkdir -p /home/dev/joosep && cd /home/dev/joosep
# 1. Build inputs, per the grep above -- currently:
#      entrypoint.sh   FIRST-TASKS.md   teams/paunvere/   warp-ca.pem
#    (warp-ca.pem is NOT in the repo -- see the note below)
# 2. Host-side operational files, not COPYed into the image:
#      docker-compose.yml   joosep.sh   .env.example
# 3. The CA, sourced from the HOST:
cp /usr/local/share/ca-certificates/managed-warp.pem ./warp-ca.pem
chmod +x joosep.sh entrypoint.sh
ls -la; ls -R teams/paunvere/
```

**EXPECT** every path from the grep present, plus the three operational files. No `.env` yet, no
`authorized_keys` yet.

**STOP** if any grep-named path is missing — do not start the build and discover it at that layer.

> **`warp-ca.pem` is NOT in the repo.** It exists only on the host, created from
> `/usr/local/share/ca-certificates/managed-warp.pem`. That is correct by design and matches `allerk`,
> but it means **a fresh checkout yields one fewer file than the manifest lists**, and anyone comparing
> counts will be briefly convinced something is missing. Host md5 `7b4474e7dfcd55681a216ab64f5bbd33`;
> verified 2026-08-28 as byte-identical to the host source and a genuine CA
> (`CN=Gateway CA - Cloudflare Managed G1…`, valid to 2029).

> **Verifying the team package needs a per-file MANIFEST. Do NOT use a two-level digest across hosts.**
> `teams/paunvere/` is **10 files across two levels**, and a single `scp -r` can land nine of ten with
> nothing reporting it — so the tree does need a check the single-file md5s cannot give. **The manifest
> is that check:**
>
> ```bash
> find teams/paunvere -type f | sort | xargs md5sum            # THE GATE -- names the offender
> ```
>
> Recompute at freeze time rather than trusting any value written here — this tree moved four times on
> 2026-08-31 alone.
>
> ### The digest was here until 2026-08-31 and it cost a live STOP. Do not reinstate it.
>
> An earlier version of this note also exchanged `… | xargs md5sum | md5sum` as a single-value digest.
> **That value is not portable, and the mismatch it produces is indistinguishable from real drift.**
> On 2026-08-31 it halted the Step 14 rebuild with Joosep held: attested `e78b95ab…` on the Windows
> checkout, `f7bd4961…` on RC, **all ten files byte-identical on both sides.**
>
> **The md5 of a FILE is portable. The md5 of `md5sum`'s OUTPUT is not.** The digest hashes the tool's
> *presentation* of the content, which carries two platform dependencies, neither visible in the hex:
>
> 1. **Separator.** Windows/MSYS `md5sum` prints `<hash> *<path>` (one space, binary-mode asterisk);
>    Linux prints `<hash>  <path>` (two spaces, no asterisk).
> 2. **Sort collation.** `sort` is locale-dependent — `README.md` sorts eighth under a UTF-8 locale and
>    **first** under `LC_ALL=C`. One identical tree, three digests: `e78b95ab…` / `f7bd4961…`
>    (separator normalised) / `c6612097…` (separator + `LC_ALL=C`).
>
> **The manifest strictly dominates it.** It catches everything the digest catches — a file that fails
> to land shows as a missing line — *and* it names which one. The individual hashes are genuinely
> portable because they hash content, not a tool's rendering of it. The digest bought one short value
> to compare and cost a hard stop on a live chain. *(Diagnosed by Hopper from the manifest this note
> requires; the manifest is why it took ten minutes instead of being an undiagnosable hex mismatch.)*
>
> **Do NOT "harmonise" the entrypoint's `dir_digest` (Step 9c) with this ruling — it is correct as it
> stands.** It compares a seeded directory against a shipped one, both hashed by the same code on the
> same box, so neither dependency can reach it. **The question is never *"is this a digest?"* but
> *"do the two operands of this comparison cross a platform boundary?"*** Same function, opposite
> verdicts, and the reflex to fix every digest after reading this would break the one that works.
>
> **One more trap, worth knowing whatever you compare** (Hopper, same run): run any of these from the
> wrong directory — `teams/paunvere` does not exist at the repo root, it lives under
> `designs/deployed/joosep/` — and `find` fails, `md5sum` hashes an empty stream, and you get
> `d41d8cd98f00b204e9800998ecf8427e`. **Valid-looking hex on total absence**, not an error.
>
> ### The standard this set for clearing a STOP
>
> A STOP is cleared by **reproducing the cause, not by finding a story that fits it.** Here the fix was
> confirmed by applying the proposed normalisation on the *Windows* box and getting RC's exact value
> back — which isolates the cause to a single transformation instead of leaving it a plausible account
> of asterisks. **Then check the fix itself before adopting it:** the proposed normalisation handled
> the separator and left the sort-collation dependency untouched, and it worked only because both
> boxes happened to share a collation. A fix that passes today for a reason nobody has stated is the
> next false STOP. Reproduce, then re-derive the fix's own assumptions.

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
`ssh-keygen -lf <his own pubkey>` on his machine.** Key comments on this host are
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

> **No `-i` flag, and that is a correction, not an omission (2026-08-31).** These commands previously
> named `~/.ssh/id_ed25519_joosep`. **The user's key was at the default identity path**, so the
> suffixed file never existed on his machine — his 9d.5 check succeeded only because he ran raw `ssh`
> and its own default lookup found the key.
>
> **Where a key file lives is the user's business, not ours to assume**, and every place we asserted a
> filename was a place we could be wrong about a machine we cannot see. `ssh` already solves this. Pass
> `-i` only when you have a reason to override, and if you do, pass `-o IdentitiesOnly=yes` with it.
>
> `Connect-Joosep.ps1` carried the same assumption in a worse form and has been fixed — see Step 13.

```bash
# 9a -- bare mode must land in a SHELL
ssh -p 2231 joosep@100.96.54.170 'tmux ls; echo "shell-ok"'
```

**EXPECT:** `no server running on ...` (or no session named joosep) followed by `shell-ok`.

**STOP** if this drops you into tmux. That means an auto-tmux hook got into `.bashrc` and the bare mode
is dead — the single failure this design is shaped to prevent. The entrypoint does not install one;
if it appears, something else did.

```bash
# 9b -- the -Session path, exactly as the PowerShell switch invokes it
ssh -t -p 2231 joosep@100.96.54.170 joosep-session
```

**EXPECT:** a tmux session named `joosep` with Claude starting in it. Detach with `Ctrl-b d`.

**STOP** on `claude: command not found` → the Step 6 remote-command PATH check was passed over. This is
the exact symptom that check exists to catch early.

```bash
# 9c -- persistence: reattach and confirm it is the SAME session
ssh -t -p 2231 joosep@100.96.54.170 joosep-session
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
ssh -p 2231 joosep@100.96.54.170 'echo container-ok'
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
ssh -p 2231 joosep@100.96.54.170 'echo still-ok'
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

**Tell him his file was not touched, and that the English copy is still there.** The Step 14 rebuild
replaced `~/FIRST-TASKS.md` with the Estonian version, and he should hear *why* that was safe rather
than discover a changed file: the gate at 14.1 compared his copy against `/opt/FIRST-TASKS.md`, the
image's own baked seed, and they were **byte-identical** — so nothing of his was overwritten, because
there was nothing of his in it. The superseded English copy was **displaced, not deleted**, and sits
beside the new one as `~/FIRST-TASKS.md.superseded-<timestamp>` if he wants to diff the two. Say this
unprompted. A file that changed under you is unsettling in a way that a file that changed *and was
explained* is not, and this is his first week in a container he cannot administer.

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

## Step 14 -- PENDING REBUILD: Estonian FIRST-TASKS + team rename to `paunvere` (Tier M)

**Not part of initial provisioning. HELD until Joosep's Step 9a-9c auth test passes** — do not move the
target under him mid-test. One operation delivers both changes.

### 14.1 -- Re-seed check, and the reason it is not just a `cp`

```bash
docker exec --user joosep joosep sh -c \
  'md5sum ~/FIRST-TASKS.md /opt/FIRST-TASKS.md; ls -l --time-style=full-iso ~/FIRST-TASKS.md'
```

**EXPECT:** the two md5s are **EQUAL**, and an mtime at the container's first boot (2026-08-28 ~17:04).

`/opt/FIRST-TASKS.md` is the image's own baked seed and the file `~/FIRST-TASKS.md` was installed from.
**Equality therefore proves nobody has edited it** — which is exactly the question, and it stays true
however much time has passed. The mtime is a corroborating second signal, not the gate.

**This check MUST run before the rebuild.** The rebuild replaces `/opt/FIRST-TASKS.md` with the Estonian
version and destroys the comparison.

**STOP if the md5s DIFFER**, even if the mtime looks untouched. That means Joosep has started working in
the file. Do not displace it; tell Brunel and the update becomes a side-by-side (`/opt/FIRST-TASKS.md`
stays available for him to diff).

> ## Do NOT gate this on a value recorded somewhere else. Corrected 2026-08-31, before it fired.
>
> This step originally gated on **mtime alone**. When the rebuild finally ran, 3 days after the freeze,
> the instruction issued to the operator was to compare the container's copy against **Brunel's attested
> md5** — sound-sounding, and **wrong: `530329c2…` is the ESTONIAN file being shipped**, while the
> container holds the **English** seed. They differ by design. That check would have **STOPped a
> perfectly healthy container mid-chain with a user held**, and the mismatch would have been read as
> evidence that Joosep had edited the file.
>
> **The rule, which generalises past this step: derive the comparison from the artifact pair, never from
> a value written down beside it.** Both operands were inside the container the whole time. A recorded
> value cannot tell you the world moved under it; two live artifacts cannot be stale relative to each
> other. A recorded value is legitimate to *carry a fact across a boundary* where the artifact is not
> reachable — that is what the Step 1 manifest does — and wrong as a *substitute* for a comparison whose
> operands are both present.
>
> **Note the failure direction, which is why this is hard to catch: it fails CLOSED.** A stale recorded
> value does not wave anything through; it raises a STOP on a healthy system. And a STOP looks like the
> check working. On a live operation with people waiting, nobody investigates a halt that reads as
> diligence — they attribute it to the system under test.
>
> **RAN 2026-08-31 10:55 (Hopper), and it passed:** both copies `f61664b4526fc69d6a3652c392d5a7a9`,
> mtime `2026-08-28 17:02:30 +0300`. Displaced to `FIRST-TASKS.md.superseded-20260831-105548`, 11269 B,
> mtime preserved.

If untouched — **displace it, do not delete it** (Hopper's substitution, 2026-08-31):

```bash
docker exec --user joosep joosep sh -c \
  'md5sum ~/FIRST-TASKS.md; mv ~/FIRST-TASKS.md ~/FIRST-TASKS.md.superseded-$(date +%Y%m%d-%H%M%S)'
```

> **Why `mv` and not `rm`.** Identical effect on the seed guard — the file is no longer at the guarded
> path, so the fixed guard takes the install branch — but **reversible**, it leaves evidence of exactly
> what was displaced, and it captures the md5 *before* the move rather than losing it with the file.
>
> An `rm` here would be an irreversible delete **on a persistent volume**, gated on a check about
> someone else's possible work. The asymmetry is bad in one direction only: if the mtime gate is right,
> `mv` costs one stale file that anyone can remove later; if the gate is somehow wrong — a path nobody
> thought of, clock skew, an edit that did not move mtime — `rm` destroys work with no record and `mv`
> costs nothing. **When a reversible form of an operation has the same effect, the irreversible one
> needs a reason, and there is not one here.**
>
> This also lowers the operation's tier: a delete on a persistent volume argues for Tier D; a rename
> that retains the file is plainly Tier M.

**Why this step exists.** The entrypoint's seed guard deliberately never overwrites the user's copy, so
his edits survive a rebuild. But the copy in place was created by **our own smoke test**, not by him —
the guard cannot tell those apart from the file's existence alone. Left as is, the rebuild would ship
the Estonian version to `/opt`, refuse to install it, and Joosep would read the superseded English file
indefinitely with nothing reporting a fault. (The entrypoint now records a seed-md5 stamp so future
versions self-resolve; this container predates the stamp, which is why it needs the one manual removal.)

### 14.2 -- Rebuild and recreate

```bash
cd /home/dev/joosep
# 1. Re-stage EVERY build input -- derive the list, per Step 1. Do NOT abbreviate (see below).
#    Do NOT touch warp-ca.pem (host-sourced, already correct) and do NOT delete .env or
#    authorized_keys -- neither is in the checkout, both are live host state. No rsync --delete.
chmod +x joosep.sh entrypoint.sh          # <-- the exec bit is NOT in the checkout. See below.
# 2. Verify the staged copy: 6 single-file md5s + the teams/paunvere per-file MANIFEST (Step 1).
# 3. READ the .env line before changing it, then REPLACE it -- never append:
grep -n 'TEAM_NAME' .env                  # report what was actually there
./joosep.sh build
./joosep.sh restart
```

> **`chmod +x` is not optional. The exec bit is missing from the REPO, and that is fixable once.**
> The checkout carries `joosep.sh` and `entrypoint.sh` as `-rw-rw-r--`, so **any** staging method that
> preserves source mode — `cp -p`, a `git pull` into the deploy dir, `scp -p` — yields a non-executable
> launcher and the build dies at `./joosep.sh: Permission denied`. `entrypoint.sh` is harmless (the
> Dockerfile chmods it inside the image); **only the host launcher matters.** Cost one failed build on
> 2026-08-31.
>
> **Corrected 2026-08-31, same day I wrote the line above wrong.** My first version of this note said
> the exec bit *"is not in git"*. **That is false — git records it**, as mode `100755` against `100644`
> in the index, and these files are simply committed as `100644`. The difference is not pedantic: if the
> bit were untrackable, a `chmod` after every staging would be the only possible fix; because it is
> trackable, **the real fix is one command in the repo and then nobody ever thinks about it again**:
>
> ```bash
> git update-index --chmod=+x designs/deployed/joosep/joosep.sh   # team-lead's to run; Brunel does not touch git
> ```
>
> **Remove the dependency instead of checking it** — the same remedy this runbook applies to the digest
> and the build-input list. Keep the `chmod +x` in the staging block as belt-and-braces for anyone
> deploying from a tarball or an older checkout, but it should stop being load-bearing.
>
> **This is not scattered inconsistency — the correct practice exists here and did not propagate.**
> Measured over *every path under `designs/` tracked by git whose name ends `.sh`, mode read from the
> git index*: **24 at `100644`, 6 at `100755`.** And the six are not scattered — they are **two
> directory clusters**, `esl-legal/` (2 files) and `po-team/operator/` (4). So somebody knew, twice, in
> two places, and it stopped there. *(Full survey: Callimachus, 2026-08-31; membership rule stated
> because a count is only as good as the set it was taken over.)*
>
> **That reading makes the trap worse, not better.** Scattered accidents look like accidents; two
> deliberate clusters make the remaining 24 look like a considered choice rather than an omission —
> **the working examples make the broken ones look deliberate.**
>
> **One of the 24 is armed right now.** `po-team/container/sagres/stationmaster/smoke-test.sh` is
> `100644` and is invoked as `./smoke-test.sh` by the EVR-island hub-formation spec §7 — **the identical
> trap in a second runbook**, caught there only because §4 happens to `chmod +x` the whole staged set
> first. That is an accident, not a guard: remove §4's blanket chmod as redundant and §7 breaks.
>
> **Why it was missing here when Step 1 has it: this block is an ABBREVIATED Step 1.** It said
> *"re-stage entrypoint.sh + FIRST-TASKS.md, verify md5s first"* — a summary of a procedure written out
> in full 500 lines above, and what the summary dropped was the one line that is invisible in a checkout
> and fatal at execution. **An abbreviated repeat of a procedure silently drops the steps it does not
> restate**, and the dropped step is disproportionately the one that looked like housekeeping. Same
> family as the two-lists problem in Step 1: the fix is to point at the full procedure rather than to
> restate a shortened copy of it.

> **`TEAM_NAME`: read it before you write it. The line already there may be STALE, and stale is worse
> than absent.** Compose reads `TEAM_NAME=${TEAM_NAME:-paunvere}`, so a missing line is *correct* and a
> wrong line silently overrides the right default while everything looks healthy.
>
> **FOUND 2026-08-31: `TEAM_NAME=joosep`** — not the expected stale `vedur` but something older still,
> the pre-rename *container* name, in place since the `.env` was copied from `.env.example` on 08-28.
> Replaced (`diff` against the backup showed solely `63c63`; exactly one `TEAM_NAME=` line; mode 0600
> preserved). **An instruction to "add `TEAM_NAME=paunvere`" would have appended a second line beside a
> silent override.** Report the value you find either way — it is the evidence, not a formality.

`TEAM_NAME` needs **no rebuild** on its own — it is a compose default overridden by `.env` — but
compose re-reads `.env` only on a **recreate**, which `./joosep.sh restart` performs and a plain
`docker restart` does not. It rides along here to keep it to one operation.

> **Expect the three build-time assertions NOT to re-run, and do not force them.** The WARP-CA,
> `claude`-executable and `pnpm` assertions sit in layers *above* the changed `COPY` lines, so a rebuild
> that changes only the copied content reuses them from cache. **Report that honestly — "cached, did not
> re-run" is not the same claim as "passed"** (Hopper, 2026-08-31, who caught himself about to report
> the stronger one).
>
> **But `--no-cache` is the wrong remedy.** A cached layer is byte-identical to the one whose assertions
> did pass; `--no-cache` re-fetches the Claude installer, apt and pnpm **as they are today**, trading a
> layer verified identical to the running image for an unverified new one and landing any upstream drift
> in Joosep's container as a side effect of a verification step. **A verification that mutates its
> subject is not a verification.** Those assertions exist to catch a *changed* build; if the layer did
> not change, they have nothing to say.

### 14.3 -- Verify

```bash
docker logs joosep 2>&1 | grep -iE 'first-tasks|paunvere|CLAUDE.md|host key'
docker exec --user joosep joosep head -3 ~/FIRST-TASKS.md
docker exec --user joosep joosep bash -lc 'echo $TEAM_NAME; ls ~/work/'
docker exec joosep ssh-keygen -lf /etc/ssh/keys/ssh_host_ed25519_key.pub
```

**EXPECT** — derived from the entrypoint source, not inherited from this runbook's earlier drafts:

- `[entrypoint] seeded ~/FIRST-TASKS.md (first boot).`
- `[entrypoint] seeded /home/joosep/work/paunvere (first boot).`
- `[entrypoint] initialised local git in /home/joosep/work/paunvere (no remote).`
- `[entrypoint] created /home/joosep/work/CLAUDE.md.`
- `~/FIRST-TASKS.md` opens in Estonian, heading `# Esimesed ülesanded`. It is **14181 bytes** against the
  English 11269, so the size alone is a second, independent confirmation of the swap.
- `$TEAM_NAME` = `paunvere`
- host key **unchanged**: `SHA256:C8qVyjSQuyiSXPzEBcIOh2tfUwlk9EJtU2WxhAEbO3U`

**STOP** on any of:

- `NOTE: ~/FIRST-TASKS.md differs...` → 14.1 did not run, and the English copy is still in place.
- `ERROR: /opt/teams/<name> is MISSING from the image` → `TEAM_NAME` in `.env` names no directory
  shipped in the image. This is the **loud** failure of a wrong `TEAM_NAME`, and it is why 14.2 insists
  on reading that line first: the *quiet* failure is a valid-but-wrong name, which this never catches.
- `generated persistent sshd ed25519 host key (first boot).`, or a host key differing from the value
  above → the `joosep_sshd` volume was lost. **Report it; do not tell Joosep to clear `known_hosts`** —
  that habit is what makes host-key pinning worthless, and the fingerprint was sent to him out of band
  precisely so that he would never need to.

> **The three seeding lines are new to this step, and their absence was a real hole.** 14.3 originally
> verified only FIRST-TASKS and `TEAM_NAME`, because it was written before the team package and the
> generated `~/work/CLAUDE.md` were added to the image. **It therefore verified less than the rebuild
> had come to ship** — and would have reported a clean pass on a container missing the entire team
> package. **A verification step does not notice that its subject has grown**; someone has to re-derive
> it from the thing being verified, which is why these lines come from reading the entrypoint rather
> than from editing the previous EXPECT.

> ## RAN 2026-08-31 11:15 (Hopper) — all EXPECTs pass, neither STOP fired
>
> All four entrypoint lines verbatim; **host key `SHA256:C8qVyjSQuyiSXPzEBcIOh2tfUwlk9EJtU2WxhAEbO3U`
> unchanged** (the `joosep_sshd` volume survived the recreate); `~/FIRST-TASKS.md` =
> `530329c2a04adf1dd0c4411e2439b06d`, equal to `/opt/FIRST-TASKS.md`, opening `# Esimesed ülesanded`;
> all 10 `paunvere` files in `~/work/paunvere/` matching the staged manifest; `TEAM_NAME=paunvere` live;
> running image `sha256:95191f2ee20f`.
>
> **Both seed stamps written** — `.first-tasks.seeded.md5` and `.team-package.seeded.md5`. That is the
> point of the whole step: **the hand-displacement in 14.1 was genuinely the last one anybody performs.**
> Every future version now self-resolves through the entrypoint's own discriminator.
>
> **Note the ordering, because it is the honest record.** The fuller check-set above was written into
> this step *after* the live run — but it was not absent from the run: it was carried in the dispatch to
> the operator, who executed it and traced content end-to-end from the attestation through the checkout,
> staging, image and seeded home. **What this text does is stop that fuller check-set living only in one
> operator's message.** A verification that exists only in a dispatch is not part of the runbook, and the
> next person to run Step 14 would have inherited the thinner version.

**Unchanged by the rename, deliberately:** the container dir, the container name, **and the tmux session
name** — all stay `joosep`. So `Connect-Joosep`, `Connect-Joosep -Session` and the registry `tmux` field
do not move. The team name lives only inside the container.

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
