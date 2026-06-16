# Apex Container Hardening -- Exact Rebuild Steps (S52)

**Status:** DIFF FINAL on the build-source working tree (NOT committed -- git is team-lead's). Image is NOT rebuilt. **NOTHING HAS BAKED ONTO APEX** -- the changes are inert source edits. The ONLY remaining gate is the PO's final pre-bake confirm (Gate (b) = GO already given; window = current quiescence). Brunel authors; Hopper executes via docker-exec during quiescence; FR generates + registers the pubkey hub-side.

**S52 gate status (FINAL):** Gate (a) docker-exec route = SATISFIED (`dev@`→`docker exec apex-research` as root, host-side, tailnet-independent -- Hopper). Gate (b) = GO (PO authorizes once diff final + window set). Gate (c) = rebuild during CURRENT QUIESCENCE; **apex-online STRUCK as a gate** (round-trip verifiable without the apex agent -- see §3). Network mode = RESOLVED (host -- §0). OQ-1 = CLOSED (path baked). Key-name = CLOSED (decision A, `stationmaster_apex` -- applied across the whole chain). All design/diff blockers closed. **Remaining: PO's final pre-bake confirm only.** One cross-team item rides along: single-owner cutover QUEUED to apex (§1).

**Applied edits (build source `~/Documents/github/apex-migration-research/`, additions-only, bash -n clean):**
- `entrypoint-apex.sh`: `supervise()` helper (after `clone_or_pull`); Step-7b courier-key seed-copy `stationmaster_apex` (after SSH block); Step-9e supervised dashboard + courier with baked-default config path + graceful guard (before final `exec`).
- `Dockerfile.apex`: `# syntax=docker/dockerfile:1.4` line 1; build-secret RUN (`id=courier_key`) seeding `/home/ai-teams/.ssh-seed/stationmaster_apex` (after ai-teams user setup).
- `docker-compose.yml`: `build.secrets: [courier_key]` + top-level `secrets.courier_key.file: ./stationmaster_apex`.
- `.dockerignore` + `.gitignore`: exclude `stationmaster_apex{,.pub}` (key never enters a layer or a commit).
- FR-shipped copy in `designs/deployed/apex-research/container/` re-synced to match all three (was behind on Dockerfile/entrypoint + WRONG on network mode -- declared bridge + cloudflared sidecar; live + build-source are host-net, no sidecar).
- **Courier config (OQ-1 CLOSED):** baked default `/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json` (Hopper find-sweep), overridable via `COURIER_CONFIG`; guard skips with loud warn (no crash-loop) if script/config missing.
- **Key name (decision A):** `stationmaster_apex` to match live courier.json → zero courier.json edit; hub registers by pubkey content not filename.

**Author:** (*FR:Brunel*) -- 2026-06-15 (S52)

**Rebuild mechanism (my call as sole decider):** bake into the image (durable), NOT docker-exec hot-patch. Hot-patch is overwritten on the next rebuild because the entrypoint is `COPY`'d in.

---

## 0. CRITICAL -- target the BUILD SOURCE, not the FR-shipped copy

The image is built from **`~/Documents/github/apex-migration-research/`** (repo ROOT):
- `apex-migration-research/Dockerfile.apex`
- `apex-migration-research/entrypoint-apex.sh`

The FR-shipped copy at `mitselek-ai-teams/designs/deployed/apex-research/container/` had **DRIFTED** and was BEHIND the build source. Do NOT edit or build from the FR copy. Deltas it lacked (build source has):
- **Dockerfile:** an extra Chromium/Playwright runtime-deps layer (`libglib2.0-0t64 … libpango-1.0-0`).
- **entrypoint:** Oracle DB-tunnel soft-check (Step 8, `nc 127.0.0.1:11521`); `TERM` + `CLAUDE_CODE_NO_FLICKER` shell vars; Step 9a1 sourcing `~/workspace/teams/apex-research/aliases.sh`.
- **compose (load-bearing):** FR copy declared `network_mode: bridge` + a `cloudflared` sidecar. The build source declares `network_mode: host` (line 35) with NO sidecar, and Hopper's live `docker inspect apex-research` returns `NetworkMode=host`. The FR copy was actively WRONG on the network mode.

**Re-sync DONE (S52):** the FR-shipped copy (Dockerfile + entrypoint + compose) is now byte-identical to the build source -- verified. `designs/deployed/` no longer lies. The bake changes below were applied to the build source FIRST, then the copy re-synced.

**Network mode = host (RESOLVED, empirical).** Per the S51 probe-beats-artifact-inference learning, Hopper's live `docker inspect` (`NetworkMode=host`) supersedes any compose-comment inference. All three sources now agree: live inspect, build-source compose (line 35, "host mode required on WARP-protected hosts"), and entrypoint Step-0. There is NO bridge and NO per-container cloudflared sidecar for the apex service. The hardening must NOT be built on a bridge assumption.

---

## 1. ASK 1 -- Service supervisor (entrypoint-apex.sh)

**Insertion A -- `supervise()` helper.** Add to the Helpers block (after `clone_or_pull()`, ~line 56 of build source):

```bash
# supervise <name> <command...>  -- relaunch the service whenever it exits.
# Mirrors the sshd background-launch precedent (Step 7) but with a restart loop.
# Runs as the ai-teams user via gosu; backgrounded so PID 1 stays bash and reaps it.
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

**Insertion B -- supervised launches.** Add immediately BEFORE the final `exec gosu "${CONTAINER_USER}" "$@"` (last line of build source, ~line 384):

```bash
# ── Step 10a: Supervise long-lived services (dashboard + courier) ────────────
# These were previously launched session-side (startup.md 4e/5) and did NOT
# survive a container restart. Supervised here so they come up on every boot
# and relaunch on exit. Backgrounded -- PID 1 stays bash (mirrors sshd Step 7).
supervise dashboard 'cd /home/ai-teams/workspace/dashboard && npx vite --host 0.0.0.0 --port 5173'
# Courier config path = in-container-confirmed (Hopper find-sweep, S52); overridable via COURIER_CONFIG.
# Guarded so a missing script/config = loud warn, not a crash-loop.
COURIER_SCRIPT="/home/ai-teams/workspace/teams/apex-research/stationmaster/stationmaster-courier.reference.py"
COURIER_CONFIG="${COURIER_CONFIG:-/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json}"
if [ -f "${COURIER_SCRIPT}" ] && [ -f "${COURIER_CONFIG}" ]; then
    supervise courier "python3 ${COURIER_SCRIPT} --config ${COURIER_CONFIG}"
else
    echo "[entrypoint] WARNING: courier NOT supervised -- script or config missing."
fi
```

**OQ-1 CLOSED (S52):** courier config path = `/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json` (Hopper in-container find-sweep -- single file, no alternates). Baked as the default; the guard still degrades gracefully if it ever goes missing.

**Single-owner cutover (apex-side) -- QUEUED TO APEX, not done-at-window.** apex drops their startup.md Step 4e (courier) + Step 5 (dashboard) launches so the supervisor is the sole owner -- otherwise a second `vite` would race the supervised one on `:5173`. **Because apex stays DOWN during this window (quiescence rebuild), the cutover cannot be coordinated live.** It must be QUEUED to apex (message in their inbox) so they apply the startup.md edit BEFORE their next session starts -- otherwise that next session's startup will double-launch `:5173` against the now-supervised dashboard. The courier is relaunch-safe (single-instance lock) so a courier double-start can't double-run; the dashboard is the one that needs the queued edit. This is the one cross-team item outstanding after the bake -- flag it to apex via the hub.

---

## 2. ASK 2 -- Build-time courier key (approach b)

**KEY-NAME DECISION (S52, mechanism call -- Brunel):** the seed/copy key filename is **`stationmaster_apex`**, NOT the FR `sm_<team>` convention. The live `courier.json` already dials `~/.ssh/stationmaster_apex`; ASK-2's goal is to make the key the courier ALREADY uses survive a rebuild, not to rename it. Path (A) -- match the existing name -- means **zero courier.json edit** (no second coordinated edit, no Layer-3 touch on apex's live config, no new artifact-vs-runtime divergence). The hub registers by **pubkey content**, not filename (`sm-register apex-research <pubkey>`), so the local filename is free to match the consumer. The `sm_<team>` convention is FR's naming for FR's OWN hub keys; this is apex's courier key. Team-lead's lean was (A); I concur on substance, not just surface. **APPLIED.**

**Step 1 (FR, once, off-build):** `ssh-keygen -t ed25519 -f stationmaster_apex -N "" -C "apex-research"`. Private key = build secret; public key = registered hub-side. Generating ONCE (not per-build) is what kills the churn.

**Step 2 -- Dockerfile (build source `Dockerfile.apex`) -- APPLIED.** `# syntax=docker/dockerfile:1.4` is line 1; this RUN added after the ai-teams user setup:

```dockerfile
# ── Build-time courier key seed (*FR:Brunel*) ───────────────────────────────
# Private key injected as a BuildKit secret (NOT an ARG/layer -- no leak into
# image history). Lands on the IMAGE filesystem at a seed path; the entrypoint
# copies it into the ephemeral ~/.ssh on every start (~/.ssh does not survive
# rebuild -- it's the containerd overlay, st_dev 78).
RUN --mount=type=secret,id=courier_key \
    install -d -m 700 -o ai-teams -g ai-teams /home/ai-teams/.ssh-seed \
    && install -m 600 -o ai-teams -g ai-teams /run/secrets/courier_key \
         /home/ai-teams/.ssh-seed/stationmaster_apex
```

Build invocation: `DOCKER_BUILDKIT=1 docker compose build` (compose wires the secret), or directly
`docker build --secret id=courier_key,src=./stationmaster_apex -f Dockerfile.apex .`

**Step 3 -- entrypoint seed-copy -- APPLIED** (right AFTER the Step-7 SSH block, before Step 8):

```bash
# ── Step 7b: Seed courier key into ephemeral ~/.ssh (*FR:Brunel*) ────────────
# ~/.ssh is on the ephemeral overlay (does not survive rebuild). The durable
# source is the build-baked seed on the image FS. Copy once per start; same key
# every build (seed generated once, step 1) => no hub-side churn.
# Filename matches the name the live courier.json already dials -- no courier.json edit.
if [ -f /home/ai-teams/.ssh-seed/stationmaster_apex ] && [ ! -f /home/ai-teams/.ssh/stationmaster_apex ]; then
    install -d -m 700 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" /home/ai-teams/.ssh
    install -m 600 -o "${CONTAINER_UID}" -g "${CONTAINER_GID}" /home/ai-teams/.ssh-seed/stationmaster_apex \
         /home/ai-teams/.ssh/stationmaster_apex
    echo "[entrypoint] courier key seeded into ~/.ssh."
fi
```

**Step 4 -- hub registration (FR):** `sm-register apex-research "$(cat stationmaster_apex.pub)"` (idempotent replace -- no churn). Live `courier.json` `ssh_key` ALREADY = `~/.ssh/stationmaster_apex` -- no edit needed (the point of decision A).

**Compose secrets (APPLIED):** `build.secrets: [courier_key]` + top-level `secrets.courier_key.file: ./stationmaster_apex`. `.dockerignore` + `.gitignore` exclude `stationmaster_apex{,.pub}`.

---

## 3. Verification at window (post-restart) -- done DURING apex quiescence, no apex agent online

All checks below are performed by Hopper read-only over the confirmed `dev@`→`docker exec` route while apex's agent session stays DOWN. The hardening is verifiable without apex online because the supervised services (dashboard + courier) run at the entrypoint/container level, independent of any Claude agent session.

1. Dashboard answers on the HOST's `:5173` directly (host networking -- no port-map, no bridge translation). Confirm from the rc host: `curl -sf http://127.0.0.1:5173` (or the host's address). The external-front question (is any tunnel still in front of `:5173`?) is OQ-5, evaluated against a HOST-NET topology -- NOT a per-container cloudflared sidecar (there is none for the apex service). Non-blocking for the supervisor/seed hardening.
2. Courier process alive AND survives a deliberate kill → supervisor relaunches it (the ASK-1 acceptance test). Verifiable via `docker exec` process inspection -- no agent session needed.
3. `~/.ssh/stationmaster_apex` present after restart (seed-copy fired) AND FR↔apex hub round-trip green: deposit a test FR→apex consignment; the supervised courier collects it to the **persistent `~/.claude` inbox dir** regardless of whether the apex agent is running; Hopper read-only-verifies the collect landed. The agent reading the inbox is NOT required for the round-trip to be proven.
4. Apex re-verifies their side on their NEXT session (deferred -- not a window gate, since they're quiescent now).

---

## 4. Status before window

- **OQ-1:** CLOSED -- courier config path = `/home/ai-teams/workspace/teams/apex-research/stationmaster/courier.json` (Hopper find-sweep). Baked as default in Step-9e.
- **Key-name reconcile:** CLOSED -- decision (A), bake to `stationmaster_apex` to match live courier.json; zero courier.json edit (see §2).
- **OQ-5:** network mode = RESOLVED (host -- see §0). Residual half: is any external tunnel still in front of host `:5173`? Non-blocking for the supervisor/seed hardening.
- **Gate (a):** docker-exec route = SATISFIED (`dev@` host → `docker exec apex-research` as root, host-side, tailnet-independent -- Hopper-confirmed).
- **Gate (b) = GO (PO, 2026-06-15).** PO authorizes execution once the diff is final + window set. Final pre-bake confirm is the last manual gate.
- **Gate (c) = rebuild during CURRENT QUIESCENCE.** apex's session stays DOWN; the rebuild runs via the confirmed root docker-exec route. **"apex-online" is NO LONGER a gate** -- round-trip is verifiable without the apex agent (see §3). apex re-verifies their side on their next session (deferred, non-blocking).
- Compose `secrets:` wiring = DONE in build source (`build.secrets: [courier_key]` + top-level `secrets.courier_key.file: ./stationmaster_apex`). At window: drop the FR-generated `stationmaster_apex` keypair into the build context.

**Gates:** ALL SATISFIED. PO green-lit Hopper + WAIVED the pre-bake confirm (2026-06-15 12:25). DISPATCHED to Hopper 12:33 (Tier D, full sanction), corrected 12:35 (force-recreate) + 12:38 (idempotent keygen).

## 5b. Execution sequence as DISPATCHED to Hopper (Tier D)

Run on the rc host (build host) in the `apex-migration-research` dir, via Hopper's `dev@`→docker-exec route, during apex quiescence:

1. `[ -f ./stationmaster_apex ] || ssh-keygen -t ed25519 -f ./stationmaster_apex -N "" -C "apex-research"` -- **generate-IF-ABSENT** (idempotent). Keypair generated ON the build host (private key never crosses the network; gitignored + dockerignored). Unconditional keygen would regenerate a different key every rebuild → pubkey churn → forced re-register = the exact failure ASK-2 kills. Generate-if-absent → first rebuild creates it, key persists in the gitignored build context on the rc host, subsequent rebuilds REUSE it → same pubkey → zero churn. **Durability precondition:** the rebuild flow must NOT `git clean -x` (would delete the gitignored key); Hopper confirms before step 1.
2. `DOCKER_BUILDKIT=1 docker compose build` -- BuildKit secret `courier_key` seeds the key to the image FS.
3. `docker compose up -d --force-recreate` -- **`--force-recreate` REQUIRED**: a rebuilt image with unchanged compose config is NOT adopted by plain `up -d`. NOT `down -v` (named volumes preserved; only the container is replaced).
4. `cat ./stationmaster_apex.pub` + report generated-new vs reused → Hopper relays the line; **FR (Brunel) runs `sm-register apex-research "<line>"` hub-side ONLY when a NEW key was generated** (reuse = hub already has it; re-register is the churn-equivalent we skip). First rebuild = generated-new → register.

Keygen host = build host (rc), NOT the FR Windows dev box (no Docker there; the build context is the rc-host repo). FR owns registration of the public key only.

**ORDERING CONSTRAINT (Hopper Tier-R probe, 12:39) -- the `.gitignore` edit MUST land in the transit BEFORE step-1 keygen.** The rc-host `.gitignore` does NOT yet exclude `stationmaster_apex` (the `.gitignore` edit is one of the 5 untransited files). If keygen ran before the `.gitignore` edit is on the rc host, a stray `git add -A` could STAGE THE PRIVATE KEY. The transit must carry all 5 edits -- INCLUDING `.gitignore` -- onto the rc-host source before keygen. With the dispatch sequence this is naturally safe (keygen is step 1, after the transit lands all 5), but the transit method must not split `.gitignore` out or land it last. Durability re-confirmed: build context is ext4 (durable), no `git clean -x`, no build-wrapper scripts -- the gitignored key persists between rebuilds.

**BLOCKED -- TRANSIT GAP (Hopper hard-gate abort 12:35, re-confirmed 12:39).** The 5 edits are NOT on the rc-host build source (`/home/dev/github/apex-migration-research`, HEAD d9074bb) -- only uncommitted ` M` in the FR Windows checkout (HEAD b5eebb6b; histories diverged). Building now = OLD image, zero hardening. Hopper's pre-flight 5-marker grep gate (must all be present on the rc host before build): `^supervise()` in entrypoint, `ssh-seed/stationmaster_apex` in entrypoint, `# syntax=...:1.4` Dockerfile header, `id=courier_key` in Dockerfile, `courier_key` in compose. UNBLOCK = team-lead git transit (commit+push+rc-pull) + PO call (apex's repo). Then re-confirm → Hopper re-runs grep gate → build.

## 6. BAKE RESULT (Hopper executed 12:58) + boot-order follow-up fix

**Rebuild ran via PR #165 branch (tip 30749c85) on the rc host during apex quiescence. Mostly GREEN:**
- ASK-2 (build-time courier key) END-TO-END GREEN: BuildKit secret seeded `/home/ai-teams/.ssh-seed/stationmaster_apex` (no key in docker history); entrypoint Step-7b seed-copy FIRED → `~/.ssh/stationmaster_apex` present, fingerprint matches the seed (SHA256:NBq5a/...QsaE).
- ASK-1 dashboard GREEN: supervisor running both loops; dashboard HTTP 200 on `:5173`.
- GH_TOKEN preserved (commit 30749c85): non-empty in recreated container via compose-dir `.env`.

**OPEN ITEM -- courier startup boot-ordering (FIX APPLIED, needs 3rd transit + rebuild):**
- Symptom: `RuntimeError: inboxes_dir does not exist: /home/ai-teams/.claude/teams/apex-research/inboxes` (courier `validate_startup`). NOT a volume/recreate problem -- `~/.claude` intact, courier's own state_dir/spool survived; only the `inboxes` subdir absent.
- Root cause: the `inboxes` dir was created by apex's AGENT SESSION at session-start (old session-side launch, startup.md 4e ran AFTER the session made the dir). The supervised courier now launches at container BOOT, BEFORE any session → dir missing → `validate_startup` hard-fails (it requires inboxes_dir to EXIST; files auto-create inside, but the DIR must be present; courier line 916/921). The always-on supervisor moved courier-start earlier than inbox-dir-creation.
- FIX = (a), chosen: entrypoint pre-creates the dir before the supervised courier launch. `install -d -m 755 -o ai-teams -g ai-teams /home/ai-teams/.claude/teams/apex-research/inboxes`. Satisfies both validate_startup invariants: dir-exists + same-volume-as-state_dir (both under persistent `~/.claude`). Idempotent (session would make the same dir); makes the courier boot-order-INDEPENDENT, which is the whole point of supervising it. Entrypoint-local, NO apex-courier.py touch (rejected (b) = bigger blast radius on Herald's reference script; rejected (c) courier-down-until-session = defeats the boot-order-independence ASK-1 wants). APPLIED to build source + FR copy, bash -n clean.
- NEEDS: 3rd commit onto branch `fr/apex-container-hardening-s52` (team-lead git) → Hopper re-runs grep gate (now 7 markers, + the inboxes mkdir) → rebuild + up -d --force-recreate (apex still quiescent, cheap). NOT a docker-exec stopgap -- bake for durability.

**REGISTRATION (parallel, BLOCKED on protocol shape):** pubkey `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINyQQocUhNh5S3QHREtoASiSnWz8e8MTUDaoLCcRNiHC apex-research` (fp SHA256:NBq5a/...QsaE) generated-NEW → FR registers. `sm-register` is NOT a shell cmd: hub `sm@10.100.136.162:2222` is a restricted forced-command protocol endpoint (returns JSON; `E_MALFORMED` to shell-style). Asked Herald (protocol owner) for the register-request shape + add-vs-replace. Round-trip verify (§3 step 3) only goes green AFTER registration.

**This document executes nothing itself.** Bake ran; ASK-1 dashboard + ASK-2 GREEN; courier boot-order fix applied + awaiting 3rd transit/rebuild; registration awaiting Herald protocol shape.
