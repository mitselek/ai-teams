# Apex Container Hardening -- Design Plan (Task #5)

**Status:** PLAN ONLY -- design-only deliverable. **EXECUTES NOTHING.** Every step that touches apex's container is HARD-GATED (see §1). Brunel designs; Hopper executes via docker-exec; FR registers the pubkey hub-side. Checkpoint to team-lead before any execution.

**Author:** (*FR:Brunel*) -- 2026-06-15 (S51)

**Scope:** apex-research container (FR owns this maintenance per PO ruling). Two asks:
- **ASK 1 -- service supervisor:** keep the dashboard (`vite :5173`) + courier (`stationmaster-courier.reference.py`) alive on process-exit AND across a container restart.
- **ASK 2 -- build-time courier key (approach b ONLY):** provision + hub-register the apex courier SSH key at container-build time so it survives a full rebuild without manual re-registration and without silent churn. (Interim relocate-to-`.claude` = approach c = DECLINED by PO.)

**Provenance of facts:** Layer-1 = FR-shipped design (`designs/deployed/apex-research/container/*`, my own artifacts). Layer-3 = apex's live in-container introspection (their T8 + T12, relayed by Herald 2026-06-15, st_dev-confirmed). Where the two disagree, Layer-3 wins and the disagreement is called out.

---

## 1. HARD PRECONDITION BLOCK -- execution gates (ALL must hold before a single change lands on apex's box)

**GATE STATUS -- UPDATED 2026-06-15 (S52), PO direction folded in.** The original three-gate block is now mostly satisfied; one gate (apex-online) has been STRUCK.

- **(a) PO explicit green light -- GIVEN (Gate (b)=GO).** PO authorizes execution once the diff is final + window set; the final pre-bake confirm is the last manual gate.
- **(b) CONFIRMED FR→apex docker-exec route -- SATISFIED.** Resolved via path (ii): SSH to the `rc` HOST (`dev@`) then `docker exec apex-research` locally on that host as root -- tailnet-independent, Hopper-confirmed. The stale-CGNAT / tailscale-logged-out concern is moot for this route. (The tailnet path (i) is no longer needed.)
- **(c) apex ONLINE -- STRUCK.** Rebuild runs during apex's CURRENT QUIESCENCE (session stays DOWN). The round-trip is verifiable WITHOUT the apex agent online: the supervised courier collects to the persistent `~/.claude` inbox dir regardless of the agent session, and Hopper read-only-verifies the collect. apex re-verifies their side on their next session (deferred, non-blocking). The one cross-team item that DOES need apex: the single-owner startup.md cutover, which is QUEUED to apex (applied before their next session), not coordinated live.

**Post-change verification (at window, all by Hopper via docker-exec during quiescence):** dashboard `:5173` answers (host-net, `curl` from rc host), courier process alive AND survives a deliberate kill (supervisor relaunch test), FR↔apex hub round-trip green (deposit test FR→apex → supervised courier collects to `~/.claude` inbox → Hopper verifies). No apex agent required. See rebuild-steps §3.

---

## 2. Substrate facts (the design rests on these)

| # | Fact | Layer / source |
|---|---|---|
| F1 | PID 1 in the apex container is **plain bash** (entrypoint ends `exec gosu ai-teams "$@"`, CMD `["bash"]`). No systemd, no cron, no sudo for the agent (uid 1000). | L1 entrypoint Step 10 + L3 process tree |
| F2 | The dashboard + courier are NOT started by the entrypoint today -- they're launched by apex's **startup.md Step 4e (courier) + Step 5 (dashboard)** at session-start, reparent to PID 1, survive a session cycle but NOT a container restart. | L3 |
| F3 | The entrypoint ALREADY background-starts a service: `/usr/sbin/sshd -p 2222` (Step 7). This is the in-house precedent for "entrypoint launches a long-lived background process." | L1 entrypoint Step 7 |
| F4 | `/entrypoint-apex.sh` is root:root 0775 at FS root; apex (uid 1000, no sudo) CANNOT edit it. Changes are baked into the image (rebuild) or applied by root via docker-exec. | L3 + L1 |
| F5 | **Persistent** (LVM ext4, st_dev 65024): `/home/ai-teams/.claude`, `/home/ai-teams/workspace`, `/home/ai-teams/source-data`. **Ephemeral** (containerd overlay, st_dev 78): `/`, `/tmp`, **and `/home/ai-teams/.ssh`**. | L3 st_dev-confirmed |
| F6 | A key written to `~/.ssh` does NOT survive a rebuild (it's on the ephemeral overlay). This is why build-time provisioning (b) is correct and why the interim relocate-to-`.claude` (c) was a workaround. | L3 (F5) |
| F7 | Dashboard launch: `cd /home/ai-teams/workspace/dashboard && npx vite --host 0.0.0.0 --port 5173` (node_modules on the persistent workspace; `--host 0.0.0.0` required for tailnet reach). | L3 |
| F8 | Courier launch: `python3 /home/ai-teams/workspace/teams/apex-research/stationmaster/stationmaster-courier.reference.py --config <courier.json>`. Has a built-in single-instance lock; relaunch-safe / idempotent. | L3 |
| F9 | Courier image baked claude 2.1.162; runtime CLI reports 2.1.173 (version skew -- note for any CLI-coupled assumption). | L3 |
| F10 | **GAP -- network mode NOT reported.** apex gave addressing only (hostname `apex-research`, IP `10.200.13.114`, IPv6 `2a02:88:15:c80c::/64`, cgroup flat `0::/`, tailscale installed-but-logged-out). The FR-shipped compose says bridge networking with a cloudflared sidecar in front; whether the live runtime matches (bridge vs host-network override; is cloudflared still up) is UNCONFIRMED. Herald is queuing this question to apex for their next session. | GAP |

---

## 3. ASK 1 -- Service Supervisor Design

**Goal:** dashboard + courier restart on process-exit AND are present after a container restart, with no systemd/cron/sudo dependency (F1).

**Design -- a pure-bash supervisor baked into the entrypoint.** Because PID 1 is bash and the entrypoint already backgrounds sshd (F3), the cleanest shape is:

- Add a **supervisor function** to `/entrypoint-apex.sh` that, for each managed service, runs a `while true` restart loop in the background (as the `ai-teams` user via `gosu`), with a short backoff between restarts to avoid a hot crash-loop:

```bash
# supervise <name> <command...>  -- relaunch the service whenever it exits.
supervise() {
    local name="$1"; shift
    (
        while true; do
            echo "[supervisor] starting ${name}..."
            gosu "${CONTAINER_USER}" bash -lc "$*"
            rc=$?
            echo "[supervisor] ${name} exited (rc=${rc}); restarting in 5s"
            sleep 5
        done
    ) &
    echo "[supervisor] ${name} supervised (loop pid $!)"
}
```

- Call it for both services, BEFORE the final `exec`:

```bash
supervise dashboard 'cd /home/ai-teams/workspace/dashboard && npx vite --host 0.0.0.0 --port 5173'
supervise courier   'python3 /home/ai-teams/workspace/teams/apex-research/stationmaster/stationmaster-courier.reference.py --config /home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json'
```
*(exact `--config` path TBD against apex's live courier.json location -- F8 gave the script path, not the config path; confirm with apex.)*

**Why this shape:**
- **Restart-on-exit:** the `while true` loop relaunches a crashed/exited service. The courier is already relaunch-safe (F8, single-instance lock), so a relaunch can never double-run it. The dashboard is idempotent on a fixed port (a second `vite` on `:5173` would fail to bind and the loop would retry -- acceptable; see open question OQ-2).
- **Restart-on-container-boot:** the entrypoint runs on every container start (it's the ENTRYPOINT), so the supervised loops come up automatically after `docker restart` / host reboot / `compose up`. This is the gap F2 leaves open today.
- **PID-1 tension resolved:** the supervisor loops are BACKGROUNDED (`&`), so the entrypoint still reaches its final `exec gosu ai-teams "$@"` -- bash remains PID 1 and reaps the backgrounded children. We do NOT need to restructure PID 1 or add an init system. This mirrors the sshd precedent (F3) exactly, just with a restart loop instead of a one-shot launch.

**Single-owner coordination (F2):** apex OFFERED to drop their session-side launches (startup.md Step 4e + Step 5) once the supervisor owns the lifecycle, to avoid two owners starting the same services. **Recommendation: ACCEPT** -- once the supervisor is the owner, the session-side launches are redundant and a second dashboard launch would hit the port-bind conflict. This is an apex-side startup.md edit they make; coordinate the cutover so there's never a window with both owners racing (same discipline as the courier-daemon cutover we just did on the FR side).

**Delivery mechanism (gated):** the supervisor is an edit to `/entrypoint-apex.sh` (F4, root-owned). Two paths:
- **Bake into the image (preferred, durable):** edit the repo's `entrypoint-apex.sh` (in `apex-migration-research`, where F at §2 / Herald says `Dockerfile.apex` lives), rebuild the image. Survives everything. Requires a rebuild = a restart = the full gate.
- **docker-exec hot-patch (faster, less durable):** root-writes the supervisor into the running `/entrypoint-apex.sh` + manually starts the loops, no rebuild. BUT a hot-patched entrypoint is overwritten on the next image rebuild (the file is COPY'd in from the repo) -- so this is a stopgap, not the fix. **Recommendation: bake into the image** so it's durable; the hot-patch is only worth it if a rebuild is off the table for the window.

---

## 4. ASK 2 -- Build-Time Courier Key Provisioning (approach b)

**Goal:** the apex courier's OUTBOUND SSH key (to OUR hub) is provisioned at build time, survives a full rebuild, is auto-registered hub-side, and does NOT silently churn on rebuild.

**The core constraint (F5/F6):** `~/.ssh` is on the ephemeral overlay, so a key generated/stored there dies on rebuild. And a naive `ssh-keygen` in the Dockerfile regenerates a DIFFERENT key on every `docker build` → the hub registration goes stale every rebuild = "silent churn." We must avoid both.

**Design -- build-secret-injected key, seeded to the image FS, copied to ephemeral `~/.ssh` at start, registered hub-side from the same provenance.**

**Key name (decision A, S52):** the key filename is `stationmaster_apex` -- matching the name the LIVE `courier.json` already dials (`~/.ssh/stationmaster_apex`). This means ZERO courier.json edit (the consumer is unchanged). NOT the FR `sm_<team>` convention -- that names FR's OWN hub keys; this is apex's courier key, and the hub registers by pubkey content, not filename. Build-secret id = `courier_key` (generic build-time handle).

1. **Key generated ONCE, outside the image build, by FR (we are the hub operator).** Generate the apex courier keypair on a controlled host:
   `ssh-keygen -t ed25519 -f stationmaster_apex -N "" -C "apex-research"`.
   The PRIVATE key is the build secret; the PUBLIC key is what we register hub-side. Generating once (not per-build) is what kills the churn -- the key's identity is fixed.

2. **Inject the private key at build time as a Docker BUILD SECRET (not a layer, not an ARG baked into history).** Use BuildKit `--secret`:
   ```dockerfile
   # syntax=docker/dockerfile:1.4
   RUN --mount=type=secret,id=courier_key \
       install -d -m 700 -o ai-teams -g ai-teams /home/ai-teams/.ssh-seed \
       && install -m 600 -o ai-teams -g ai-teams /run/secrets/courier_key \
            /home/ai-teams/.ssh-seed/stationmaster_apex
   ```
   The key lands at a build-baked seed path (`/home/ai-teams/.ssh-seed/`, on the image filesystem -- NOT `~/.ssh` which is the ephemeral mount). A build secret does NOT persist in the image history/layers, so the private key isn't leaked into the image metadata.

3. **Entrypoint copies the seed key into `~/.ssh` at every start** (because `~/.ssh` is ephemeral -- F5 -- it's empty after a rebuild; the seed on the image filesystem is the durable source):
   ```bash
   if [ -f /home/ai-teams/.ssh-seed/stationmaster_apex ] && [ ! -f /home/ai-teams/.ssh/stationmaster_apex ]; then
       install -d -m 700 -o ai-teams -g ai-teams /home/ai-teams/.ssh
       install -m 600 -o ai-teams -g ai-teams /home/ai-teams/.ssh-seed/stationmaster_apex \
            /home/ai-teams/.ssh/stationmaster_apex
   fi
   ```
   This makes the key **survive a full rebuild** (the seed is in the image) AND **non-churning** (same key every build, because step 1 generated it once and step 2 injects that same file).

4. **Hub-side registration (FR, same flow):** because we generated the key (step 1), we register its PUBLIC key on the stationmaster hub via `sm-register apex-research "$(cat stationmaster_apex.pub)"`. `sm-register` is idempotent (re-registering replaces the line), so this is safe to re-run and does not churn. The courier's `courier.json` ALREADY points its `ssh_key` at `~/.ssh/stationmaster_apex` (decision A -- no edit needed). **Net: rebuild → seed copied to ~/.ssh → same key the courier already dials → hub still recognizes it → zero manual re-registration, zero courier.json edit.**

**Alternative considered + rejected:** persisting the key on the `apex-claude-home` (`~/.claude`) persistent volume (a relative of the DECLINED approach c). Rejected because (i) PO declined the relocate, and (ii) a volume-persisted key does NOT survive `docker compose down -v` (volume wipe), whereas the build-time seed does -- build-time provenance is strictly more durable. The seed-on-image + copy-to-ephemeral-~/.ssh pattern gives rebuild-durability without relying on volume persistence.

**Key rotation (future):** to rotate, regenerate in step 1, rebuild, re-run `sm-register` (idempotent replace). No churn because rotation is deliberate, not a build side-effect.

---

## 5. Network mode (F10) -- RESOLVED: host networking (*FR:Brunel*, S52 update)

**RESOLVED 2026-06-15 (S52), empirically.** Hopper's live `docker inspect` of the running container shows **`NetworkMode=host`** -- no per-container bridge IP; the "`10.200.13.114`" seen earlier is host-stack addressing, not a bridge address. I independently confirmed the **build source** is self-consistent with this: `apex-migration-research/docker-compose.yml` declares `network_mode: host` (line 35, "required on WARP-protected hosts where Docker bridge traffic is not routed through the WARP tunnel"), and `entrypoint-apex.sh` Step 0 already assumes host-net. **The bridge + cloudflared-sidecar description was the STALE FR-shipped copy only** -- now re-synced to match the host-net build source. Both Brunel and Hopper surfaced host-net independently; they converge.

Implication for the hardening (host-net, not bridge):
- The supervised dashboard binds `--host 0.0.0.0:5173` directly on the host network stack -- reachable on the host's `:5173` (no port mapping, no bridge translation). Whether an external tunnel still fronts it is a separate, non-blocking question (the apex service has no cloudflared sidecar in the host-net compose).
- The courier's hub egress (`sm@10.100.136.162:2222`) goes through the host's network stack + WARP routing -- host-net is exactly why WARP DNS/routing works (the documented reason for choosing it). No bridge-vs-host egress ambiguity remains.
- The Gate-(a) docker-exec route (`dev@` host → `docker exec apex-research`) is host-side and tailnet-independent -- confirmed by Hopper. Host networking does not affect this control-plane path.

**Remaining Layer-3 item (non-blocking for network mode):** whether any external tunnel still fronts `:5173` for browser access. Not required for the supervisor/seed hardening; note for apex at the window.

---

## 6. Open questions (resolve before/at the window)

- **OQ-1:** Exact path of apex's live `courier.json` (F8 gave the script path, not the config path). Confirm with apex for the supervisor's `--config` arg.
- **OQ-2:** Dashboard relaunch-on-a-still-bound-port behavior -- if a stale `vite` holds `:5173`, the supervisor's relaunch will fail to bind and retry every 5s. Acceptable as a self-healing loop, but confirm vite exits cleanly on the supervised path (vs lingering). Minor; observe at the window.
- **OQ-3:** Does apex want the supervisor to ALSO own any third service (e.g., the Jira MCP server)? Scope is dashboard + courier per the ask; confirm no others.
- **OQ-4:** Rebuild vs hot-patch decision for delivery (§3) -- depends on whether the window permits a full image rebuild. Rebuild is the durable answer; PO/apex call.
- **OQ-5 (network):** §5 -- runtime network mode + cloudflared status (Herald queuing to apex).

---

## 7. Execution sequence (ONLY after §1 gates clear -- for reference, executes nothing now)

1. Confirm §1 (a)(b)(c) + close OQ-1/OQ-5. Hopper confirms the docker-exec route (desk-reconcile now; live probe at scheduling).
2. FR generates the apex courier keypair (§4 step 1), registers the pubkey hub-side (§4 step 4).
3. Apply ASK 1 + ASK 2 to the repo's `Dockerfile.apex` + `entrypoint-apex.sh`; rebuild the image (§3 bake path + §4 steps 2-3).
4. Coordinate the restart window with apex (channel + dashboard drop briefly). Apex drops their session-side launches (§3 single-owner) as part of the cutover.
5. Hopper executes the restart via the confirmed docker-exec route (Tier classification on the exact commands at dispatch time; a rebuild+recreate is Tier M/D-adjacent -- full sanction package required).
6. Post-verify (§1): dashboard up, courier alive + survives a kill (supervisor test), FR↔apex round-trip green. Apex re-verifies their side.

---

**This document executes nothing.** It is the design + the gate. Next step: team-lead checkpoint.
