# EVR-Island Hub Formation — prod-llm Upgrade & Formalization Spec

(*FR:Brunel*)

**Date:** 2026-08-27 (S65, Stage 2 item 1)
**Status:** SPEC — ready for operator execution. FR specifies; the PO executes every host-side step at the keyboard. No FR agent runs anything against prod-llm.
**Authority:** #108 A1 ruling (issuecomment-5439161208): **two islands by design.** prod-llm (`sm@10.100.136.162:2222`) is formalized as the **EVR island** hub (framework-research + apex-research); sagres stays the personal island; no federation; git is the bridge.
**Companion:** the rewritten deployment runbook ([`designs/deployed/stationmaster/stationmaster-hub-deployment-runbook.md`](../../../designs/deployed/stationmaster/stationmaster-hub-deployment-runbook.md), Stage 2 item 2) carries the recurring procedures; this spec is the **one-shot formation operation**: upgrade the deployed hub to the current reference, revoke scratch registrations, and establish backup + disk-watch ownership.

---

## 1. Why the upgrade is REQUIRED, not cosmetic

Facts on the repo record (ops-log-2026-06 Layer-2 verification; Herald's live `status` probe 2026-08-27):

- The prod-llm hub was deployed **2026-06-12 at reference HEAD `f022fed`** (entrypoint sha256 `2c4afe11`, sm-shell `d5b2fe40`, per the re-transfer log entry). The container has run ever since — `status.hub.uptime_s` = 6,552,057 s at 2026-08-27 ≈ start 2026-06-12 ~17:30. **No recreate since deploy.**
- Everything committed to the reference after `f022fed` is therefore **not in the running image.** The one that matters:

  > **`5c05b61` 2026-07-15 — fix(stationmaster): sm-shell durability — fail loud on fsync error, not false 'accepted' (#97)**

  On the running EVR hub, a deposit that fails at fsync can still answer `accepted`. Contract §5.2's core promise — *accepted = fsync-durable* — is **not currently honored under fault** on this island. The sagres image has the fix (deployed 2026-07-15); the EVR island does not.
- Also missing (lower stakes): `909bbe9` (sm user shell `nologin`→`/bin/sh` in the Dockerfile), `0667dd1`/`af722a8` (smoke-test hardening), `c65a70a` (optional `SSHD_LISTEN_ADDR` env in the entrypoint — sagres' tailnet bind; **unset it stays 0.0.0.0**, correct for prod-llm's bridge + `2222:2222` publish, so this change is a no-op here).
- Reference vs sagres-deployed hub files: **0 real drift** across all seven files (`diff --strip-trailing-cr`, verified 2026-08-27). One codebase, two instances — exactly the §7 split. The upgrade brings the EVR instance onto the same code.

**Upgrade content = rebuild the image from the current reference and recreate the container. All durable state survives on the `sm-state` volume** (registrations, grants, spool, dedup, and — critically — the SSH host keys, so the hub fingerprint `SHA256:CNcFjOxr8vREOueOS8nxJN8W3LaQHet62du+PHyK13U` does not change and neither FR's known_hosts nor the key baked into `entrypoint-apex.sh:314` needs touching).

## 2. What survives / what changes (state map)

| Item | Where | Across this upgrade |
|---|---|---|
| Registrations (`authorized_keys`), grants, spool, dedup, `registry.json` | `sm-state` volume | **SURVIVES** — untouched |
| SSH host keys → hub fingerprint | `sm-state` volume | **SURVIVES** — fingerprint MUST be identical after (verified §6 step 8) |
| Hub image + `sm-shell`/`entrypoint` behaviour | image | **REPLACED** — gains #97 fail-loud durability |
| `status.hub.uptime_s` | runtime | resets to ~0 (expected; this is how you know the recreate happened) |
| In-flight conversations | runtime | lost; couriers see no envelope → retry safely (contract §3). FR/apex couriers log ONE transport-failure line per lost poll — expected, not an incident (hints §8) |
| Scratch registrations alpha / beta / fr-test | `sm-state` volume | **REMOVED in §7, after** the smoke test uses them |

## 3. Operator pre-flight (Tier R reads, prod-llm keyboard)

```sh
# 3.1  Deploy dir exists and is the June artifact:
ls -la ~/stationmaster/
# EXPECT: Dockerfile, docker-compose.yml, entrypoint.sh, sm-shell, sm-register,
#         sshd_config.stationmaster, smoke-test.sh   (test_durability.py absent = pre-#97, consistent)

# 3.2  Container running, single instance, image age:
docker ps --filter name=stationmaster --format '{{.Names}} {{.Status}} {{.Image}}'
docker inspect stationmaster --format 'image={{.Image}} created={{.Created}} started={{.State.StartedAt}}'
# EXPECT: StartedAt ≈ 2026-06-12. STOP CONDITION: if StartedAt is RECENT (container restarted
#         since June), the uptime premise is wrong — report back before proceeding; something
#         else redeployed this hub and §4's drift check matters even more.

# 3.3  Volume present:
docker volume inspect stationmaster_sm-state --format '{{.Mountpoint}}'
```

## 4. Currency check — detect host-local drift BEFORE overwriting

Purpose: `~/stationmaster` may hold patches applied on-host in June that the reference lacks (the reverse drift). **Nothing is overwritten until this is answered.**

```sh
# On the EVR dev box (repo checkout), stage the current reference for transfer:
cd ~/Documents/github/mitselek-ai-teams/teams/framework-research/poc/ghost-bridge/stationmaster
scp -r ./ michelek@10.100.136.162:~/stationmaster-new/

# On prod-llm — normalize line endings FIRST (the transfer came from a Windows checkout;
# CRLF in entrypoint/sm-shell breaks execution — known gotcha):
cd ~ && sed -i 's/\r$//' stationmaster-new/* && chmod +x stationmaster-new/{entrypoint.sh,sm-shell,sm-register,smoke-test.sh,test_durability.py}
grep -rlc $'\r' stationmaster-new/ ; echo "expect: no output (zero CRLF files)"

# The check itself — old deployed vs new reference:
for f in Dockerfile docker-compose.yml entrypoint.sh sm-shell sm-register sshd_config.stationmaster smoke-test.sh; do
  echo "== $f"; diff --strip-trailing-cr ~/stationmaster/$f ~/stationmaster-new/$f | head -5
done
```

**READ THE RESULT, do not just run it:** expected diffs = exactly the post-`f022fed` reference commits (#97 fail-loud block in `sm-shell`; `SSHD_LISTEN_ADDR` block in `entrypoint.sh`; `/bin/sh` shell line in `Dockerfile`; smoke-test additions). **STOP CONDITION: any diff hunk that is NOT explainable by a reference commit** (i.e. content present on the host that the new reference lacks) = host-local patch discovered → report it back to FR before overwriting; it must be folded into the reference first, or consciously discarded on record. *(This is the `daemon-self-report-confirms-config-not-outcome` discipline applied to files: the check is against the artifact, not against anyone's memory of it.)*

## 5. Backup — pre-upgrade snapshot, then a standing cadence

```sh
# 5.1  Pre-upgrade snapshot (FIRST backup of this volume ever, per the record):
mkdir -p ~/backups
docker run --rm -v stationmaster_sm-state:/state:ro -v ~/backups:/out debian:bookworm-slim \
  tar czf /out/sm-state-$(date +%Y%m%d-%H%M).tar.gz -C / state
ls -lh ~/backups/   # EXPECT: one archive, small (KB–MB range; spool is usually near-empty)
```

**Standing cadence (ownership: the OPERATOR — Mihkel; FR specs, does not run):** weekly, same command via cron on prod-llm, retain last 4. Rationale: the irreplaceable state is `authorized_keys` + `registry.json` + **host keys** (fingerprint stability); the spool is transient by design. Suggested crontab line:

```cron
20 4 * * 1  docker run --rm -v stationmaster_sm-state:/state:ro -v $HOME/backups:/out debian:bookworm-slim tar czf /out/sm-state-$(date +\%Y\%m\%d).tar.gz -C / state && ls -t $HOME/backups/sm-state-*.tar.gz | tail -n +5 | xargs -r rm
```

**Disk watch (ownership: the OPERATOR):** the hub has no TTL — uncollected mail accumulates by design (contract §6). Two instruments, monthly or when suspicious: `df -h /var/lib/docker` (host view) and, from any registered courier key, `status` → `deposited_uncollected` per team (protocol view). The courier-side stale-age WARN (hints §6a) is the automatic complement on the receiving side.

## 6. Upgrade execution (order matters; stop on any unmet EXPECT)

```sh
# 1. Adopt the verified new artifact (old kept aside until §8):
mv ~/stationmaster ~/stationmaster-old-f022fed && mv ~/stationmaster-new ~/stationmaster
cd ~/stationmaster

# 2. Build:
docker compose build
# EXPECT: image builds clean. STOP on any Dockerfile error.

# 3. Recreate — plain 'up -d' will NOT adopt a rebuilt image (known gotcha S52):
docker compose up -d --force-recreate

# 4. Health:
docker compose ps          # EXPECT: healthy within ~10 s
docker compose logs --tail=5
# EXPECT: "stationmaster hub up: sshd 0.0.0.0:2222 ..."  — 0.0.0.0 is correct here
#         (SSHD_LISTEN_ADDR unset; prod-llm publishes 2222:2222; the tailnet bind is sagres-only).

# 5–8. Identity + state survival, from the EVR dev box (FR key):
printf '%s\n' '{"v":1,"cmd":"ping"}' | ssh -T -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162
# EXPECT: {"team":"framework-research", "fingerprint":"SHA256:...", "protocol":1}
# STOP CONDITION: ssh host-key MISMATCH warning = host keys did NOT survive → restore from
# the §5 snapshot before anything else; a changed fingerprint strands apex (baked key).
printf '%s\n' '{"v":1,"cmd":"status"}' | ssh -T -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162
# EXPECT: uptime_s SMALL (proof the recreate happened — the outcome check, not the self-report);
#         grants_in/out and any deposited_uncollected unchanged from before.

# 9. Durability proof (the reason for this upgrade), on prod-llm:
cd ~/stationmaster && python3 test_durability.py
# EXPECT: pass — fsync fault injection now fails LOUD, no false 'accepted'.
# (If python3 is absent on the host: run inside the container:
#  docker compose exec stationmaster python3 /usr/local/lib/stationmaster/test_durability.py
#  — adjust to the image's install path; or SKIP with a note, the #97 code is hash-verified by §4.)
```

## 7. Smoke test THEN scratch-key revocation (this order, deliberately)

The full-surface acceptance (`smoke-test.sh`) needs **two registered scratch teams** — and alpha/beta are still registered (Herald's registry probe). Use them one last time, then remove all three:

```sh
# On the box that holds the scratch keys (they were ~/.ssh/sm_alpha, sm_beta at S50-deploy;
# if lost, regenerate + re-register first — sm-register is idempotent):
./smoke-test.sh 10.100.136.162 2222 ~/.ssh/sm_alpha alpha ~/.ssh/sm_beta beta
# EXPECT: all checks pass (17/17-class run, as on sagres #93).

# Revocation, on prod-llm:
docker compose exec stationmaster sm-register --revoke alpha
docker compose exec stationmaster sm-register --revoke beta
docker compose exec stationmaster sm-register --revoke fr-test

# Verify — registry via the protocol (outcome, not memory):
printf '%s\n' '{"v":1,"cmd":"registry"}' | ssh -T -i ~/.ssh/sm_framework-research -p 2222 sm@10.100.136.162
# EXPECT: exactly framework-research and apex-research. STOP CONDITION: anything else listed.
```

## 8. Rollback & cleanup

- **Rollback (any failed EXPECT after step 6.3):** `cd ~/stationmaster-old-f022fed && docker compose up -d --force-recreate` — the June image rebuilds from the kept artifact; state volume was never touched; the §5 snapshot covers the volume itself.
- **Cleanup (only after §7 passes):** keep `~/stationmaster-old-f022fed/` for one week, then remove; keep the pre-upgrade snapshot permanently (it is backup #1).

## 9. A2 / A3-ii deploy path (how contract work reaches this island from now on)

- **A2 — reference-implementation ownership:** hub changes land in the reference (`teams/framework-research/poc/ghost-bridge/stationmaster/`) FIRST, via FR's normal review; the EVR island redeploys by re-running §4→§6 of this spec (which becomes the runbook's build-redeploy section); the sagres island pulls the same reference on po-team's cadence. Drift check between any deployed copy and the reference is always `diff --strip-trailing-cr` per file — **never md5 across Windows/Linux checkouts** (CRLF false-drift, measured 2026-08-27).
- **A3-ii — contract minor 1.1.0 (`waiting_for_me[*].oldest`):** path = Herald ratifies the contract text → reference `sm-shell` implements (mirror of the existing outbound `oldest` at `spool_counts` — additive field, no `v` change needed beyond the minor) → both islands redeploy on their own cadence → couriers may consume the field. Until both hubs carry it, couriers MUST treat the field as optional — which the courier-side age alarm (hints §6a) already does by not depending on it.

## 10. Open questions (carried into the runbook's closed-questions ledger)

1. **EVR firewall posture for 2222** — inherited open item (old runbook §8.3); org-network decision, PO's. The formation does not change reachability.
2. **Whether `~/.ssh/sm_alpha` / `sm_beta` scratch keys still exist** — resolved at §7 execution time (regenerate path given).
3. **`test_durability.py` runnability on the host** — resolved at §6.9 (in-container fallback or hash-verified skip).

---

*Sources: `docs/operations-log-2026-06.md` (deploy record, Layer-2 hashes); `git log -- poc/ghost-bridge/stationmaster/` (reference history; `5c05b61` #97); Herald's 2026-08-27 registry/uptime probe; `designs/deployed/po-team/wiki/references/hub-on-sagres.md` (sibling-island facts); #108 A1 ruling. Discipline references: `wiki/patterns/daemon-self-report-confirms-config-not-outcome.md` (outcome checks primary), S52 rebuild/force-recreate + CRLF gotchas (Brunel scratchpad, carried).*
