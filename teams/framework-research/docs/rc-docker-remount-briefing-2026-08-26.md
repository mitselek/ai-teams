# RC Server: Move `/var/lib/docker` (and `/var/lib/containerd`) off Root onto `/home`

**Host:** `dev@100.96.54.170` (hostname `paarisprogemis-fyysiline`, Debian 13 "trixie", Docker 29.3.0)
**Survey conducted:** 2026-08-26, Tier R (read-only, nothing on the host was changed)
**Runbook is for:** the PO, executing manually at the keyboard with `sudo`/root — not a dispatch package for an operator
**Author:** (*FR:Brunel*)

---

## 1. Current situation (measured, not assumed)

### 1.1 Disk layout

Single NVMe disk, LVM on top. Two relevant logical volumes, both `ext4`:

| Mount | LV | Size | Used | Avail | Use% |
|---|---|---|---|---|---|
| `/` | `paarisprogemis--fyysiline--vg-root` | 58G | 52G | **3.9G** | **93%** |
| `/home` | `paarisprogemis--fyysiline--vg-home` | 393G | 79G | **295G** | 21% |

`/boot` and `/boot/efi` are separate small partitions, irrelevant here. Root is confirmed the problem: 93% full, under 4G headroom. Home has ample room.

`/etc/fstab` has static entries for both LVs (UUID-free, `/dev/mapper/...` paths) — no existing bind-mount or trickery for `/var/lib/docker`. `findmnt` confirms only two real mount points (`/` and `/home`); `/var/lib/docker` is **not** a separate mount and **not** a symlink — it's a plain directory living directly on the root LV (`stat`: `drwx--x--- root:root`, no separate device).

### 1.2 Docker configuration

- **Version:** Docker Engine 29.3.0 (Community), containerd 2.2.2, runc 1.3.4
- **Storage Driver:** `overlayfs` (containerd snapshotter, `io.containerd.snapshotter.v1`) — the modern default, not classic `overlay2` graphdriver, but same on-disk shape (layers + hardlinks + overlay whiteout xattrs)
- **Docker Root Dir:** `/var/lib/docker` (default — **no `--data-root` override currently set**)
- **`/etc/docker/daemon.json`:** does not exist
- **`/etc/systemd/system/docker.service.d/`:** does not exist — no drop-in overrides on `docker.service`
- **Live Restore:** disabled (`Live Restore Enabled: false`) — **stopping `docker.service` stops all running containers**, they are not left running detached from a dead daemon
- **Docker context:** `default`, standard unix socket, not rootless

**Conclusion: this is a clean, unmodified default install.** No prior attempt at relocating storage, no leftover symlink games — **but see §1.2b: a `data-root` change alone is not sufficient on this host.**

### 1.2b containerd is a SEPARATE daemon with its OWN root — confirmed structurally

The `driver-type: io.containerd.snapshotter.v1` in §1.2 is not cosmetic. On this host, containerd is **not** Docker's private bundled subprocess — it is the system-wide `containerd.io` package, running as its own independent systemd unit, and `dockerd` merely connects to it as a client over a socket:

- `docker.service`'s `ExecStart` passes `--containerd=/run/containerd/containerd.sock` — that socket path (`/run/containerd/`, not `/run/docker/containerd/`) is the shared system containerd, confirmed via `dpkg -S /usr/bin/containerd` → owned by the `containerd.io` package.
- `systemctl status containerd.service` shows it as its own long-running unit (PID 1367, up 3 weeks — matching the containers' own uptime), independently `enabled`, with its own `containerd-shim-runc-v2` processes for every running container.
- `docker.service`'s dependency graph is `Wants=`/`After=containerd.service` — docker depends on containerd, not the reverse. containerd is not a child of dockerd and is not managed via `--data-root`.
- `/etc/containerd/config.toml` exists but has `root`/`state` **commented out** — meaning containerd runs on its **built-in defaults**, which are `root = "/var/lib/containerd"` and `state = "/run/containerd"`.
- `/var/lib/containerd` **exists** (`stat`-confirmed: root:root, 0700, same access pattern as `/var/lib/docker`), with a `Change` timestamp matching the same service-restart epoch as the running containers (2026-08-03 09:39) — consistent with it being the live, in-use content store.

**What this means concretely:** with the `io.containerd.snapshotter.v1` driver, containerd — not Docker — owns the actual image-layer and container-writable-layer content on disk (this is the whole point of the containerd-snapshotter integration: Docker becomes a client of containerd's content/snapshot store rather than managing `overlay2/` directories itself). That content lives under **containerd's own root** (`/var/lib/containerd/io.containerd.snapshotter.v1.overlayfs/...`), which is governed by `config.toml`, not `daemon.json`. **Setting `data-root` in `daemon.json` relocates Docker's own state (volumes, network config, buildkit metadata, container JSON descriptors) but does NOT touch containerd's root** — the two are independently-configured daemons with independently-configured storage locations that happen to both currently point at directories under `/var/lib/`.

**Update, 2026-08-26 — measured, not estimated:** `/var/lib/containerd` is **21G**, `/var/lib/docker` is **22G** — roughly an even split, not the ~72%-in-containerd estimate this paragraph originally inferred from `docker system df`'s category model (Images/Containers rows don't map cleanly onto `/var/lib/docker`'s real on-disk contents — see §1.3's updated footprint table for why). **The structural conclusion is unchanged: containerd's root is real, separate, and would be entirely untouched by a `data-root`-only change** — only the *size* estimate was off, and only measurement (not the `docker system df` proxy) resolved which way. Local Volumes (7.77GB, per `docker system df`) are unaffected regardless — volumes are always Docker-managed regardless of which snapshotter/graphdriver handles image layers.

### 1.3 Measured footprint (real numbers, 2026-08-26 — superseding the earlier proxy)

**`du -sh /var/lib/docker` was not available during the initial survey** — `dev` is in the `sudo` group but sudo demands an interactive password/TTY, which the mandated `-T` connection could not supply. This was **not worked around** at the time (no askpass, no retry) per the Tier-R read-only constraint. The PO subsequently installed a minimal, scoped NOPASSWD sudoers grant (`du` on these two paths, plus `vgs`/`lvs`/`pvs`) — proposed by me, added by him — closing the gap. Real measurement, run under that grant:

| Directory | Measured size |
|---|---|
| `/var/lib/docker` | **22G** |
| `/var/lib/containerd` | **21G** |
| **Sum** | **43G** |

This is real `du`-measured, root-run bytes-on-disk — no permission gaps, no double-counting (GNU `du` tracks inodes it has already counted within one traversal, so overlay2's shared hardlinked layers aren't counted twice the way `docker system df`'s per-image accounting does). It **supersedes** the `docker system df` proxy below for planning purposes.

**Per-subdirectory breakdown is not available — a gotcha, not a permission denial.** `sudo -n du -sh /var/lib/docker/*` failed with "No such file or directory" for a path literally containing an asterisk character. Mechanism: `/var/lib/docker` is `0710` (no read bit for non-owner), so the *calling shell* (unprivileged `dev`) can't read the directory to expand the glob before sudo ever runs — bash's default behavior when a glob matches nothing is to pass the literal, unexpanded string through as a single argument. Sudo then escalates that literal string to root and asks `du` to open a file named `*`, which doesn't exist. **Sudo elevates the final command, not the shell expansion that precedes it — so an argument-exact NOPASSWD grant against a glob on a directory the grantee's own shell cannot read is syntactically valid and semantically unreachable. It matches, and can never fire.** (Two of the seven lines in the newly-installed grant are dead on arrival for exactly this reason — the same class of defect as the pre-existing, four-month-old `mkdir /home/docker-data` line, now dead because the directory already exists, and the `/usr/sbin/ss *` line, dead because the real binary is at `/usr/bin/ss`. Three instances of "syntactically valid, semantically unreachable" sudoers rules on one host, and nothing had detected any of them until this survey went looking.)

**Consequence: BuildKit's cache location remains unconfirmed**, and so does the precise reason `/var/lib/docker` (22G) runs roughly double what "volumes (7.77G) + build cache (3.62G)" alone would predict if images/container-layers fully live under containerd. **Plausible, unconfirmed explanation:** container JSON-file logs (`/var/lib/docker/containers/<id>/*.log`) aren't counted by any of `docker system df`'s four categories at all — 8 containers up 3+ weeks, several running verbose Claude Code sessions, could plausibly account for the gap. Confirming this needs the subdirectory breakdown above, which needs a differently-shaped grant (root-side shell expansion, broader surface than a bare `du`) — flagged for a future decision, not resolved here.

**Original proxy, kept for reference (`docker system df -v`, no root needed):**

| Category | Total | Reclaimable |
|---|---|---|
| Images (15) | 21.87GB | 20.24GB (92%) |
| Containers (9, writable layers) | 7.443GB | 20.48kB |
| Local Volumes (15) | 7.773GB | 184.6kB |
| Build Cache (48 entries) | 3.62GB | 688.7MB |
| **Sum** | **≈ 40.7GB** | |

The proxy turned out to be wrong in two directions at once, which is why only measurement — not more careful reasoning about the proxy — could resolve it: the Images "SIZE" column double-counts shared layers across repositories (inflates the estimate), while container JSON logs aren't in any category at all (deflates it). The second effect dominated — the real total (43G) came in *above* the proxy (40.7G), not below it, which is the opposite of what "40.7G is an upper bound" alone would have predicted. Notably large in the proxy's own breakdown: **container writable layers total 7.4GB**, dominated by `uikit-dev` (2.38GB), `entu-research` (1.22GB), `backlog-triage` (1.02GB), `apex-research` (1.03GB).

### 1.4 Running containers, volumes, bind mounts

9 containers, 8 running, 1 stopped (`cortex-db`, exited 3 weeks ago — pre-existing, unrelated to this task).

15 named local volumes, **all** backed by `/var/lib/docker/volumes/<name>/_data` — these move automatically and transparently with the data-root, since containers reference them **by name**, never by host path.

Bind mounts (the only mounts that reference host paths directly) all point at paths **outside** `/var/lib/docker`:
- `/home/dev/allerk-jetbrains`, `/home/dev/allerk/authorized_keys` (allerk container)
- `/usr/local/share/ca-certificates/managed-warp.pem` → `/opt/warp-ca.pem` (WARP CA cert, read-only, on every Claude-team container: apex-research, uikit-dev, backlog-triage, entu-research, polyphony-dev)
- `/home/dev/xireactor-brilliant/{mcp,api,db/migrations}` (cortex-mcp / cortex-api / cortex-db)
- `/home/docker-data/xireactor/pgdata` → cortex-db's Postgres data directory — **already living on the `/home` LV, outside Docker's data root**, a working precedent for storing docker-adjacent state on `/home`.

**No bind mount anywhere references `/var/lib/docker` or `/var/lib/containerd` by path.** This means moving the data roots is invisible to every container's own mount table — nothing needs reconfiguring on the container side.

**The three named container teams** (apex-research, polyphony-dev, entu-research) all run `network_mode: host` (confirmed: `docker port` returns nothing for any of them — they don't use Docker's published-port mechanism at all, ports 2222/2223/2224 are bound directly by each container's own sshd on the host network namespace). Compose working directories:
- apex-research → `/home/dev/github/apex-migration-research`
- polyphony-dev → `/home/dev/polyphony-deploy`
- entu-research → `/home/dev/entu-research`

apex-research runs no cloudflared/reverse-proxy sidecar (confirmed from my own prior work on its entrypoint — see §3.5's recovery note for why this matters for triage, not for the current-situation picture).

### 1.5 What I could not determine (Tier R boundary — the runbook's Step 0 is designed to close these)

- **Resolved 2026-08-26 — exact byte sizes:** `/var/lib/docker` = 22G, `/var/lib/containerd` = 21G (§1.3). Still open: the **internal subdirectory breakdown** of either — the argument-exact NOPASSWD grant can't expand a glob against a `0710`/`0700` directory from an unprivileged shell (§1.3's gotcha). This also leaves **BuildKit's cache location unconfirmed** (containerd-managed vs. docker-managed) — at 3.62GB either way it doesn't change the free-space verdict, but it's genuinely unknown.
- **Resolved 2026-08-26 — LVM free-extent state:** `vgs` shows `VFree 0` — the volume group (475.03G) is fully allocated across `home` (400G), `root` (<59.03G), and `swap` (16G). No headroom anywhere in the VG. This confirms "just grow root" was never available regardless of this migration — it would require *shrinking* another LV first (home, given its usage), strictly more invasive than the data-root move. Doesn't change the recommendation; the plan only ever depended on `/home`'s filesystem headroom, not VG free space.
- **Container restart policies** — determines whether containers auto-restart after the daemons come back up, or need a manual `docker start`. §3.0 Step 4 has you pull this directly pre-flight (still unmeasured — needs a live container inspection, not a Tier-R-safe pre-check).

---

## 2. Desired outcome ("done" looks like)

1. **Both** Docker's data root (`/var/lib/docker` — volumes, network config, buildkit metadata) **and** containerd's root (`/var/lib/containerd` — the actual image layers and container writable layers, per §1.2b) physically reside on the `vg-home` LV, not `vg-root`. Moving only one of the two is an incomplete migration, not a smaller version of a complete one — see §1.2b.
2. `docker info` reports the new path as `Docker Root Dir`, **and** `/etc/containerd/config.toml` reports the new `root` — but neither of these alone proves the outcome; §3.5's `df -hT /` delta is what actually proves it.
3. All 15 images, 9 containers (with identical IDs), and 15 volumes are present and functional post-move — nothing is re-pulled, re-cloned, or re-created.
4. The three named container teams (apex-research :2222, polyphony-dev :2223, entu-research :2224) and the other running containers (allerk, cortex-mcp, cortex-api, uikit-dev, backlog-triage) are reachable and functioning exactly as before, after one planned restart.
5. **`/` filesystem usage drops to roughly 15% (14-17% range)** — real arithmetic, using measured sizes (§1.3): 52G used − 43G (real, `du`-measured) ≈ 9G left, on 58G ≈ 15.5%. Range accounts for `du -sh`'s whole-GB rounding. **This replaces an earlier "~19-20% at best" estimate that was based on the `docker system df` proxy** — the correction goes the *favorable* direction even though the real total (43G) came in higher than the proxy (40.7G): the proxy was wrong in two directions at once (shared-layer double-counting inflated it; container logs, uncounted by any of its four categories, deflated it), and the second effect dominated. A bigger real total moved means a better real outcome, not a worse one — only measurement could have told which direction won. §3.5's `df -hT /` delta at execution time is still the authoritative number; this is the best pre-execution estimate available.
6. The **old** `/var/lib/docker` and `/var/lib/containerd` on root are not deleted until success is independently verified (§3.6's dated gate) — until then they are a live rollback path, not scratch space.
7. No change to any container's own configuration, compose file, or bind-mount paths is required — the move is transparent at the container level (per §1.4, nothing references either directory by path from inside a container).

---

## 3. Runbook — manual execution, at the keyboard, with root

This is written as a literal sequence for you to type, in order. Each step says what you should see; where a wrong result means stop, that's marked explicitly. Nobody is standing beside you while you run this, so the expected-output and stop-condition lines are load-bearing, not decoration.

### 3.0 Pre-flight — measure everything, schedule the window, before touching anything

**Step 1 — exact sizes (closes the biggest gap in this survey).**
```bash
sudo du -sh /var/lib/docker
sudo du -sh /var/lib/docker/*
sudo du -sh /var/lib/containerd
sudo du -sh /var/lib/containerd/*
```
*Expected:* real numbers, not estimates. Write down the two top-level totals and compare their sum against the ~40.7GB proxy in §1.3 — they should be in the same ballpark (likely somewhat lower, since 40.7GB was an upper bound). *Stop condition:* if the combined total is dramatically larger than 80GB (nothing in this survey suggests it will be), re-check the free-space math in Step 3 below before continuing — otherwise proceed.

**Step 2 — LVM state (informational).**
```bash
sudo vgs
sudo lvs
sudo pvs
```
*Expected:* confirms the two LVs (`vg-root`, `vg-home`) and free extents in the volume group. **Already measured, 2026-08-26: `VFree 0`** — the volume group is fully allocated (home 400G + root <59.03G + swap 16G), no headroom anywhere. No action needed — you're using `/home`'s existing filesystem space, not resizing any LV; this just confirms "grow root instead" was never a free alternative regardless.

**Step 3 — free-space baseline.**
```bash
df -hT /
df -hT /home
```
*Expected:* matches §1.1 (`/` ~93% used, `/home` ~21% used) or close to it if time has passed. **Write down the exact `Used` and `Avail` figures for both** — you will diff against these after the migration. **Verdict: GO** — `/home`'s 295GB free clears the real measured 43GB footprint (§1.3) by ~6.9x, several times the 2x rule-of-thumb safety margin for a copy-verify-delete migration.

**Step 4 — restart policies (tells you what happens automatically after the restart, and what needs a manual `docker start`).**
```bash
docker inspect --format '{{.Name}} {{.HostConfig.RestartPolicy.Name}}' $(docker ps -aq)
```
*Expected:* 9 lines, one per container. `always` or `unless-stopped` → that container comes back on its own once the daemon restarts. `no`, `on-failure`, or blank → **write its name down**, you'll need to `docker start <name>` for it manually in §3.5.

**Step 5 — snapshot current state, for identity comparison later.** Narrowed to ID + name (not the raw `docker ps -a` table) — STATUS/uptime changes on every line after a restart, so a raw diff would show all 9 lines "changed" and the check would be useless.
```bash
docker ps -a --format '{{.ID}} {{.Names}}' | sort > ~/pre-migration-docker-ps.txt
docker images --format '{{.ID}} {{.Repository}}:{{.Tag}}' | sort > ~/pre-migration-docker-images.txt
docker volume ls --format '{{.Name}}' | sort > ~/pre-migration-docker-volumes.txt
cat ~/pre-migration-docker-ps.txt
```
*Expected:* 9 lines of `ID name` pairs matching the appendix table below. Keep these three files — §3.5 diffs against them.

**Pre-flight checklist — do not proceed past this line until every box is checked:**
- [ ] Steps 1-5 above run and their output noted down (especially Step 1's real sizes and Step 4's restart-policy list)
- [ ] Downtime window chosen and **all three named teams notified before you start** — apex-research, polyphony-dev, entu-research will lose SSH access on 2222/2223/2224 for the duration; also tell whoever depends on allerk, cortex-mcp (8011), cortex-api (8010)
- [ ] Decided how long you'll hold the old copies before deleting them (§3.6) — default recommendation is **24-48h of normal operation** as a live rollback window; write down the date you'll revisit this, or decide now to require an explicit second look before deleting

### 3.1 Why two limbs, not one (read once, then proceed to 3.2)

Per §1.2b, Docker and containerd are separate daemons with separate, independently-configured storage roots. Relocating only Docker's `data-root` moves the *whole* `/var/lib/docker` tree (22G, measured) but leaves `/var/lib/containerd` (21G, measured) sitting on root untouched. Concretely: **`/` would go from 93% used to roughly 52% used (52G − 22G ≈ 30G left, on 58G) — not the ~15% the two-limb move actually achieves** (§2 outcome 5). That would be a **silent partial success**: every Docker-level check would report success (`docker info` shows the new path, `docker ps`/`docker images` all work fine, containers restart cleanly) while `df -hT /` would still show root roughly half full, not nearly empty, because containerd's root was never touched. Docker-level checks cannot detect this by construction — they ask a daemon to report its own configuration, which will always match what you told it, regardless of whether the *other* daemon was also reconfigured. This is why `df -hT /` is the primary pass/fail signal in §3.5, not a footnote.

**Mechanism for both, same reasoning:** a config-file root relocation (Docker's `data-root` in `daemon.json`, containerd's `root` in `config.toml`) over a bind-mount/fstab trick. Both this host's daemons have zero existing systemd customization to fight, and the bind-mount failure mode (a daemon racing an unmounted directory at boot, silently repopulating an empty directory with no error) is exactly the silent-state-divergence class this team already treats docker storage with caution over. Config-file relocation has no such race for either daemon.

### 3.2 Copy primitive — not `cp`

Overlay2/containerd-snapshotter storage depends on **hardlinks** (shared layers between images/containers/snapshots) and **extended attributes** (overlayfs whiteout markers for deleted files, security labels). A naive `cp -r` breaks hardlinks (bloats disk usage, corrupts shared-layer bookkeeping) and drops xattrs (whiteout files lose their meaning — containers can *look* copied correctly while being silently corrupted). Use `rsync -aHAX` instead — `-a` (archive), `-H` (hardlinks — the load-bearing flag), `-A` (ACLs), `-X` (xattrs), `--numeric-ids` (preserve raw uid/gid 0:0).

### 3.3 The migration — literal commands, in order

**Phase 1 — live copy, no downtime yet.** Both daemons keep running; this moves the bulk of the data while everything keeps serving.
```bash
sudo mkdir -p /home/docker-data/lib-docker /home/docker-data/lib-containerd
sudo rsync -aHAX --numeric-ids /var/lib/docker/     /home/docker-data/lib-docker/
sudo rsync -aHAX --numeric-ids /var/lib/containerd/ /home/docker-data/lib-containerd/
```
*Expected:* both complete with no error output. This can take a while depending on the real size from §3.0 Step 1 — that's fine, nothing is down yet. *Stop condition:* if either rsync reports errors, **do not proceed to stopping services** — re-run the failing rsync (it's safe to re-run/resume) until it completes clean.

**Downtime window starts here.** Stop in dependency order (containerd is what docker depends on, so it comes down last and comes back first):
```bash
sudo systemctl stop docker.socket
sudo systemctl stop docker.service
```
*Expected:* this stops all 8 running containers (Live Restore is disabled, §1.2). Confirm before continuing:
```bash
systemctl status containerd.service
```
*Expected:* the `containerd-shim-runc-v2` process lines for your containers should be gone or going. *Stop condition:* if shim processes are still listed after ~30 seconds, **do not stop containerd yet** — investigate why a container didn't fully stop first; stopping containerd out from under a still-running shim is the kind of thing that turns a clean migration into a mess.

```bash
sudo systemctl stop containerd.service
```
*Expected:* `systemctl status containerd.service` shows `inactive (dead)`.

**Phase 2 — delta copy, catches drift since Phase 1. This is the actual downtime window, and it should be short.**
```bash
sudo rsync -aHAX --delete --numeric-ids /var/lib/docker/     /home/docker-data/lib-docker/
sudo rsync -aHAX --delete --numeric-ids /var/lib/containerd/ /home/docker-data/lib-containerd/
```
*Expected:* fast — seconds to low minutes, since only the drift copies.

**Reconfigure both daemons:**
```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "data-root": "/home/docker-data/lib-docker"
}
EOF
```
```bash
sudo sed -i 's|^#root = "/var/lib/containerd"|root = "/home/docker-data/lib-containerd"|' /etc/containerd/config.toml
grep '^root' /etc/containerd/config.toml
```
*Expected of the `grep`:* `root = "/home/docker-data/lib-containerd"`. *Stop condition:* if that line doesn't show up (the `sed` pattern didn't match — e.g. whitespace differs from what I observed), **do not guess** — open the file with `sudo nano /etc/containerd/config.toml` and set the `root` line by hand instead of proceeding on an unconfirmed edit.

**Start back up, forward dependency order (containerd first — docker needs it available to connect to):**
```bash
sudo systemctl start containerd.service
sleep 2
sudo systemctl start docker.socket
sudo systemctl start docker.service
```
*Expected:* no errors; `systemctl status containerd.service` and `systemctl status docker.service` both show `active (running)`.

### 3.4 Restart-policy cleanup

For any container you flagged in §3.0 Step 4 as **not** `always`/`unless-stopped`:
```bash
docker start <name>
```

### 3.5 Verification — before touching the old copy

**Primary check, run first — this is what actually proves the outcome, not a daemon's self-report:**
```bash
df -hT /
df -hT /home
```
Compare against your §3.0 Step 3 baseline. *Expected:* `/` usage dropped by roughly the amount you measured in §3.0 Step 1; `/home` usage grew by roughly the same. **Stop condition — this is the one that matters most:** if `/` did not drop meaningfully (say, less than half of what Step 1 measured), the migration did **not** actually relocate the data — most likely containerd's root did not take effect. **Do not proceed past this point, do not touch the delete gate, treat this as a failed migration and go to §3.7 Rollback.** A migration that passes every check below but fails this one is the silent-partial-success failure mode this whole two-limb plan exists to catch.

**Daemon-level checks (necessary, but on their own not sufficient — see above):**
```bash
docker info | grep "Docker Root Dir"
```
*Expected:* `/home/docker-data/lib-docker`
```bash
grep '^root' /etc/containerd/config.toml
```
*Expected:* `root = "/home/docker-data/lib-containerd"` (confirms config; the real proof is the `df` delta above and images/containers loading correctly below — if containerd's root pointed at an empty/wrong location, `docker images` would show 0 images and containers would fail outright, not run degraded)
```bash
docker ps -a --format '{{.ID}} {{.Names}}' | sort | diff - ~/pre-migration-docker-ps.txt && echo "identical"
docker images --format '{{.ID}} {{.Repository}}:{{.Tag}}' | sort | diff - ~/pre-migration-docker-images.txt && echo "identical"
docker volume ls --format '{{.Name}}' | sort | diff - ~/pre-migration-docker-volumes.txt && echo "identical"
```
*Expected:* `identical` printed three times — the ID+name diff is what's compared, not the raw table, since STATUS/uptime differ on every line after a restart and would make a raw diff useless.

**Functional check on the three named teams — do NOT use `docker port`.** It returns nothing for these three even when perfectly healthy, because they run `network_mode: host` (§3.9 explains the mechanism) — an empty result here is expected, not a failure signal.
```bash
ss -tlnp | grep -E ':(2222|2223|2224)\b'
```
*Expected:* three listening entries. Then a real connection probe on each port (fill in the SSH user/key you'd normally use for these containers — I did not need to log into them for this survey and don't want to hand you invented credentials):
```bash
ssh -T -p 2222 <user>@localhost true   # apex-research
ssh -T -p 2223 <user>@localhost true   # polyphony-dev
ssh -T -p 2224 <user>@localhost true   # entu-research
```

**If apex-research specifically doesn't come back — read this before deciding to roll back:**
```bash
docker inspect apex-research --format 'RestartCount={{.RestartCount}}'
docker logs apex-research
```
`apex-research`'s entrypoint (`/entrypoint-apex.sh`) is a Brunel-authored artifact with a **known, pre-existing** crash-loop bug (a `git clone` step before the sshd-bind step, under `set -e`, that aborts the entrypoint on a network/auth failure — diagnosed and patched in PRs #182/#183 against `apex-migration-research`). **This bug is not caused by this migration, and it fires only when the persistent volume is empty/fresh — this migration does not touch or recreate `apex-research`'s volumes, so it should take the safe, already-populated code path.** A climbing `RestartCount` on `apex-research` after a failed restart matches this known bug's signature specifically, not a docker-data-root problem. If you see it: investigate via the logs above rather than rolling back the migration — rolling back would not fix a pre-existing entrypoint bug, and would undo a migration that otherwise worked.

**Functional check on the others:** allerk reachable; `cortex-api` (8010) / `cortex-mcp` (8011) responding.

### 3.6 Do-not-delete gate — separate step, come back to this later, do not fold it into the migration run

**Do not run this until every check in §3.5 has passed — the `df -hT /` delta specifically — and your chosen hold period (§3.0's pre-flight checklist) has elapsed.** `/home` has room to hold both old and new copies of both directories simultaneously (the same ~7x headroom that made the free-space check a clean GO), so there is no space pressure forcing an early deletion. Recommended default: **24-48 hours of normal operation** as a live rollback window before running this — you set your own number in the pre-flight checklist; this is where you act on it.

```bash
sudo rm -rf /var/lib/docker
sudo rm -rf /var/lib/containerd
```

This is the one irreversible step in the whole runbook. Once it's run, §3.7's rollback no longer applies.

### 3.7 Rollback — if verification fails, run this instead of the delete gate

Because the old `/var/lib/docker` and `/var/lib/containerd` are never touched until §3.6, rollback is close to instant:

```bash
sudo systemctl stop docker.service
sudo systemctl stop docker.socket
sudo systemctl stop containerd.service

sudo rm /etc/docker/daemon.json
sudo sed -i 's|^root = "/home/docker-data/lib-containerd"|#root = "/var/lib/containerd"|' /etc/containerd/config.toml

sudo systemctl start containerd.service
sleep 2
sudo systemctl start docker.socket
sudo systemctl start docker.service

docker ps -a
```
*Expected:* back to the original 9 containers, original IDs, running on the untouched original `/var/lib/docker` + `/var/lib/containerd` (never deleted, never modified). **Roll back both configs together even if only one daemon looked like the problem** — a docker-only rollback while containerd still points at the new (possibly incompletely-copied) location is a new, untested configuration, not a return to the known-good state.

If Phase 1/2 rsync itself failed partway (before you touched either config): nothing to roll back — the originals are still authoritative; just fix and re-run the rsync command that failed.

### 3.8 Container-team impact

- **Downtime:** bounded by the Phase-2 delta-rsync time + both daemons restarting + container restart. Since the bulk of the data moves live in Phase 1, only drift-since-Phase-1 is copied during the actual downtime — likely well under 15 minutes, but time your own Phase-1 run before promising a number to the teams.
- Nothing on the container-team side needs reconfiguring — no compose file edits, no path changes (per §1.4, nothing bind-mounts either directory by path).

### 3.9 `network_mode: host` — why the obvious verification command is wrong here

Worth being explicit about since it cuts **both ways** compared to a bridge-networked setup:

- **It simplifies the restart.** A bridge-networked container's docker-managed network (virtual bridge, veth pairs, iptables DNAT rules for published ports) all get torn down when `docker.service` stops and have to be reconstructed on start — one more subsystem that has to come back correctly. `apex-research`/`polyphony-dev`/`entu-research` have none of that: with `network_mode: host` there's no virtual network, no veth, no docker-proxy, no NAT rule to rebuild. Their sshd just binds directly to the host NIC the moment the container process starts.
- **But it invalidates `docker port` as a check.** For these three containers it returns nothing even when everything is working correctly, because there's no publish mapping to report, by design (confirmed in this survey — see appendix). §3.5 verifies via `ss -tlnp` plus a real connection probe instead.
- **No sidecar dependency to sequence** — none of the three run a cloudflared/reverse-proxy sidecar, so a clean connection probe on the bound port is a complete functional check by itself.

---

## Appendix: raw measured output (trimmed)

### `lsblk -f`
```
NAME                                     FSTYPE      FSVER    LABEL UUID                                   FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1
├─nvme0n1p1                              vfat        FAT32          1542-0232                               939.5M     4% /boot/efi
├─nvme0n1p2                              ext4        1.0            8b4603b2-3874-4777-b2e2-369c14740c70    491.6M    41% /boot
└─nvme0n1p3                              LVM2_member LVM2 001       LB32p0-z67k-cKpG-PRAR-kq0O-UJ21-xcyTdP
  ├─paarisprogemis--fyysiline--vg-root   ext4        1.0            00668a4e-b97f-4bc3-8661-7613d0e75316      3.9G    89% /
  ├─paarisprogemis--fyysiline--vg-swap_1 swap        1              ac81177c-82a7-43b5-a35c-be41c175fe91                  [SWAP]
  └─paarisprogemis--fyysiline--vg-home   ext4        1.0            356992c8-4e54-48a1-b7a9-f2b81acd933c    294.6G    20% /home
```

### `df -hT` (relevant rows)
```
Filesystem                                     Type      Size  Used Avail Use% Mounted on
/dev/mapper/paarisprogemis--fyysiline--vg-root ext4       58G   52G  3.9G  93% /
/dev/mapper/paarisprogemis--fyysiline--vg-home ext4      393G   79G  295G  21% /home
```

### `docker info` (key fields)
```
Server Version: 29.3.0
Storage Driver: overlayfs
 driver-type: io.containerd.snapshotter.v1
Docker Root Dir: /var/lib/docker
Live Restore Enabled: false
Kernel Version: 6.12.74+deb13+1-amd64
Operating System: Debian GNU/Linux 13 (trixie)
```

### `/etc/docker/daemon.json`
```
(file does not exist)
```

### `stat /var/lib/docker`
```
  File: /var/lib/docker
  Size: 4096      	Blocks: 8          IO Block: 4096   directory
Device: 254,0	Inode: 2094282     Links: 12
Access: (0710/drwx--x---)  Uid: (    0/    root)   Gid: (    0/    root)
```
Type per `stat -f`: `ext2/ext3` (i.e. ext4 family — overlay2-compatible backing fs), Total blocks 15184870 (~58G), Free 1724634 (~6.6G), Available 1021738 (~3.9G) — matches `df` within rounding.

### `docker system df` (totals)
```
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          15        9         21.87GB   20.24GB (92%)
Containers      9         8         7.443GB   20.48kB (0%)
Local Volumes   15        14        7.773GB   184.6kB (0%)
Build Cache     48        0         3.62GB    688.7MB
```

### `docker ps -a`
```
CONTAINER ID   IMAGE                          NAMES            STATUS
24e0a0ccece3   allerk:latest                  allerk           Up About an hour
5b9bd74055e4   apex-research-claude:latest    apex-research    Up 3 weeks
a79f1000f23d   xireactor-brilliant-mcp        cortex-mcp       Up 3 weeks
ad42e52fd338   xireactor-brilliant-api        cortex-api       Up 3 weeks
68212c507f08   pgvector/pgvector:pg16         cortex-db        Exited (255) 3 weeks ago
90c6807845ca   uikit-dev-claude:latest        uikit-dev        Up 3 weeks
4ae288844be6   backlog-triage-claude:latest   backlog-triage   Up 3 weeks
7fa2f2dd64d7   entu-research-claude:latest    entu-research    Up 3 weeks
ab49daa71ceb   polyphony-dev-claude:latest    polyphony-dev    Up 3 weeks
```

### Mounts (per container, trimmed to non-obvious ones)
```
apex-research: volume .../apex-research-repo -> /home/ai-teams/workspace
               volume .../apex-claude-home -> /home/ai-teams/.claude
               volume .../apex-source-data -> /home/ai-teams/source-data
               bind /usr/local/share/ca-certificates/managed-warp.pem -> /opt/warp-ca.pem (RO)
polyphony-dev: volume .../polyphony-claude-home -> /home/ai-teams/.claude
               volume .../polyphony-repo -> /home/ai-teams/workspace
               bind managed-warp.pem -> /opt/warp-ca.pem (RO)
entu-research: volume .../entu-claude-home -> /home/ai-teams/.claude
               volume .../entu-repo -> /home/ai-teams/workspace
               bind managed-warp.pem -> /opt/warp-ca.pem (RO)
cortex-db:     bind /home/docker-data/xireactor/pgdata -> /var/lib/postgresql/data
```
(Full per-container mount dump collected but omitted here for brevity — none reference `/var/lib/docker` or `/var/lib/containerd` by host path.)

### Compose working directories (labels)
```
apex-research  -> /home/dev/github/apex-migration-research
polyphony-dev  -> /home/dev/polyphony-deploy
entu-research  -> /home/dev/entu-research
```

### `docker port` for the three named teams
```
apex-research: (empty)
polyphony-dev: (empty)
entu-research: (empty)
```
(confirms `network_mode: host` — SSH ports 2222/2223/2224 are bound directly by each container's sshd, not via Docker's port-publish mechanism.)

### containerd findings (§1.2b) — raw output

`stat /var/lib/containerd`:
```
  File: /var/lib/containerd
  Size: 4096      	Blocks: 8          IO Block: 4096   directory
Device: 254,0	Inode: 2093109     Links: 13
Access: (0700/drwx------)  Uid: (    0/    root)   Gid: (    0/    root)
Change: 2026-08-03 09:39:27.120000222 +0300
```

`/etc/containerd/config.toml` (root/state commented out — running on built-in defaults):
```
disabled_plugins = ["cri"]

#root = "/var/lib/containerd"
#state = "/run/containerd"
#subreaper = true
#oom_score = 0
```

`systemctl status containerd.service` (trimmed — separate long-running unit, own shim processes per container):
```
● containerd.service - containerd container runtime
     Loaded: loaded (/usr/lib/systemd/system/containerd.service; enabled; preset: enabled)
     Active: active (running) since Mon 2026-08-03 09:39:27 EEST; 3 weeks 2 days ago
   Main PID: 1367 (containerd)
     CGroup: /system.slice/containerd.service
             ├─   1367 /usr/bin/containerd
             ├─   2513 /usr/bin/containerd-shim-runc-v2 -namespace moby -id 90c6807845ca... -address /run/containerd/containerd.sock
             ├─   2514 ...ab49daa71ceb...  (polyphony-dev)
             ├─   2515 ...4ae288844be6...  (backlog-triage)
             ├─   2516 ...7fa2f2dd64d7...  (entu-research)
             ├─   2517 ...5b9bd74055e4...  (apex-research)
             ├─   2520 ...a79f1000f23d...  (cortex-mcp)
             ├─   2524 ...ad42e52fd338...  (cortex-api)
             └─3231145 ...24e0a0ccece3...  (allerk)
```

`docker.service` dependency graph on containerd:
```
Requires=sysinit.target system.slice docker.socket
Wants=network-online.target containerd.service
After=... containerd.service ...
```

Package ownership:
```
$ dpkg -S /usr/bin/containerd
containerd.io: /usr/bin/containerd

$ ls -la /run/containerd/containerd.sock
srw-rw---- 1 root root 0 Aug  3 09:39 /run/containerd/containerd.sock
```

### Real measurements, 2026-08-26 (post sudoers grant) — raw output

```
$ sudo -n du -sh /var/lib/docker
22G	/var/lib/docker

$ sudo -n du -sh /var/lib/docker/*
du: cannot access '/var/lib/docker/*': No such file or directory

$ sudo -n du -sh /var/lib/containerd
21G	/var/lib/containerd

$ sudo -n du -sh /var/lib/containerd/*
du: cannot access '/var/lib/containerd/*': No such file or directory

$ sudo -n vgs
  VG                          #PV #LV #SN Attr   VSize    VFree
  paarisprogemis-fyysiline-vg   1   3   0 wz--n- <475.03g    0

$ sudo -n lvs
  LV     VG                          Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
  home   paarisprogemis-fyysiline-vg -wi-ao---- 400.00g
  root   paarisprogemis-fyysiline-vg -wi-ao---- <59.03g
  swap_1 paarisprogemis-fyysiline-vg -wi-ao----  16.00g

$ sudo -n pvs
  PV             VG                          Fmt  Attr PSize    PFree
  /dev/nvme0n1p3 paarisprogemis-fyysiline-vg lvm2 a--  <475.03g    0

$ df -hT / /home   (fresh reading, matches original baseline — unchanged)
/dev/mapper/paarisprogemis--fyysiline--vg-root ext4   58G  52G  3.9G  93% /
/dev/mapper/paarisprogemis--fyysiline--vg-home ext4  393G  79G  295G  21% /home
```

### The pre-flight sudoers grant, and the dead-rule pattern it revealed

PO installed, exactly as proposed, as `/etc/sudoers.d/dev-migration-preflight` (`visudo -cf` → parsed OK):
```
dev ALL=(ALL) NOPASSWD: /usr/bin/du -sh /var/lib/docker, /usr/bin/du -sh /var/lib/docker/*, /usr/bin/du -sh /var/lib/containerd, /usr/bin/du -sh /var/lib/containerd/*, /usr/sbin/vgs, /usr/sbin/lvs, /usr/sbin/pvs
```
5 of 7 lines fire correctly (both top-level `du`s, `vgs`, `lvs`, `pvs`, all live-verified above). **2 of 7 are dead on arrival** — the `/var/lib/docker/*` and `/var/lib/containerd/*` lines, for the reason in §1.3: an argument-exact NOPASSWD grant against a shell glob on a directory the grantee's own shell cannot read (`0710`/`0700`) is syntactically valid and semantically unreachable, because sudo elevates the final command, not the shell expansion that has to happen before it. This is the same class of defect as two pre-existing rules found on this host, both from `/etc/sudoers.d/dev-migration` and `/etc/sudoers.d/dev-iptables-readonly` (dated 2026-04-16, four months before this survey):

```
$ sudo -ln   (this listing itself required no password — worth noting)
...
    (ALL) NOPASSWD: /usr/sbin/iptables -L *, /usr/sbin/iptables -t * -L *, /usr/sbin/ip6tables -L *, /usr/sbin/ss *
    (ALL) NOPASSWD: /bin/systemctl stop docker, ... /bin/mkdir /home/docker-data, /bin/chown * /home/docker-data, ...

$ which ss
/usr/bin/ss
$ sudo -n /usr/bin/ss -tlnp
sudo: a password is required
```
`/usr/sbin/ss *` matches nothing because the real binary is `/usr/bin/ss`, not `/usr/sbin/ss` — confirmed live, the real path still demands a password. `mkdir /home/docker-data` is dead too: that directory already exists (created the same day as the sudoers file), and plain `mkdir` errors on an existing target. **Three instances of "syntactically valid, semantically unreachable" sudoers rules on this one host, and nothing had detected any of them until this survey went looking** — `sudo -l` reports what a rule *would* match, not whether it *can ever fire* in practice.

### Permission-blocked attempts (Tier R, not worked around)
```
$ sudo du -sh /var/lib/docker
sudo: a terminal is required to read the password; either use the -S option to read from standard input or configure an askpass helper
sudo: a password is required

$ sudo -n true
sudo: a password is required
NO passwordless sudo

$ vgs / lvs / pvs
WARNING: Running as a non-root user. Functionality may be unavailable.
/run/lock/lvm/P_global:aux: open failed: Permission denied
```

(*FR:Brunel*)
