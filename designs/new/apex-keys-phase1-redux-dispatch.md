# Apex Keys -- Phase-1-Redux Dispatch (DRAFT)

**Status:** DRAFT -- staged for execution. Do NOT dispatch to Hopper until preconditions are met.
**Composed:** 2026-05-20 (after S34 dispatch arc + PO design parameters captured)
**Supersedes:** the rescinded Phase-1 dispatch r3 (referenced by `teams/framework-research/docs/operations-log-2026-05.md` 17:09 entry)
**Catalyzing context:** `teams/framework-research/docs/apex-keys-dispatch-2026-05-20-findings.md` + `apex-keys-diff-2026-05-20.md`

(*FR:Aen*)

---

## Preconditions (must all hold before this dispatch fires)

1. **Apex team is DOWN by design to enable this work.** PO confirmed at 2026-05-20 (in-session): apex team voluntarily took their AI agents offline specifically to enable the recreate (Phase 2) without disrupting their sessions. The down-state IS the maintenance window. **Execute now, not later.** Do NOT wait for them to be back; they will return after Phase 2 verifies.
2. **PO has explicitly sanctioned this dispatch text** with a "proceed to Hopper" or equivalent one-line confirmation. (Phase-1-Redux is Tier R + one Tier M with inline Brunel ack; the larger PO sanction belongs to the companion Phase 2 Tier D recreate.)
3. **Substrate-state-unchanged check:** before composing the new `.env`, Hopper confirms via a Tier R probe that the running container's `Config.Env` `SSH_PUBLIC_KEY_2` still equals the PO pubkey captured at 2026-05-20 P1.1 (byte-equal). If substrate state has drifted since the dispatch arc closed, hard-gate stop and surface back.
4. **No competing operations in flight:** confirm no other dispatch is mid-execution against apex-research.
5. **Phase 2 sanction package is composed and sanctioned.** Phase-1-Redux + Phase 2 fire as a sequence in the same maintenance window; if Phase 2 hasn't been sanctioned yet, do not execute Phase-1-Redux (it would leave `.env` written but un-activated, with apex team still offline waiting).

If any precondition fails, hard-gate stop. Do not proceed.

---

## Background

This dispatch is the redux of the 2026-05-20 17:09 Phase 1 dispatch (aborted mid-execution after substrate-truth probes revealed a degraded substrate state). The substrate findings stand: no `.env` at `$COMPOSE_DIR`; running container's env is baked-in from pre-2026-04-29-fresh-clone; recreate-today (without `.env`) = full SSH-lockout + credential-loss cascade.

PO directed (post-dispatch) the design parameters captured in the diff artifact (`teams/framework-research/docs/apex-keys-diff-2026-05-20.md`) and findings memo:

- Slot assignment: SLOT 1 = PO pubkey, SLOT 2 = Aleksandr, SLOT 3 = rc-connect
- Compose method: fresh from scratch on host (source backup `.env` for tokens, explicit `printf`/`cat <<EOF` for everything; never carry plaintext tokens through local artifacts)
- GH_TOKEN: include from current Config.Env (was added post-2026-04-29; preserve)
- All other tokens: from backup `.env` (confirmed byte-identical to current Config.Env via P2 diff)

This dispatch stages `.env` reconstruction ONLY. Tier D recreate is a SEPARATE FUTURE dispatch.

---

## Read these deployed-artifacts before executing (audit declaration)

- `designs/deployed/apex-research/container/entrypoint-apex.sh:166-196` -- Step 7 multi-key SSH_PUBLIC_KEY* enumeration
- `designs/deployed/apex-research/container/docker-compose.yml` -- `environment:` block (note operational compose-yml on host has SLOT 3 not in FR design)
- `teams/framework-research/docs/operations-log-2026-05.md` -- full audit trail of S34 dispatch arc + diff probe results
- `teams/framework-research/docs/apex-keys-diff-2026-05-20.md` -- substrate-state diff between backup and Config.Env
- Hopper scratchpad `teams/framework-research/memory/hopper.md` -- apex-research substrate facts already captured

---

## Substrate-access shapes

- **Container-user SSH (Tier R only):** `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 '<cmd>'`
- **Host-user SSH:** `ssh -T dev@100.96.54.170 '<cmd>'` (default key, port 22, `-T` mandatory)

`$COMPOSE_DIR = /home/dev/github/apex-migration-research` (substrate-truth-confirmed via docker label).
`$BACKUP_DIR = /home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29`.

---

## Steps (sequential, hard-gate between each)

### P3.1 [Tier R, host-user SSH] Substrate-state-unchanged check

Confirm running container's Config.Env still matches the dispatch's assumptions before composing.

```
ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY_2='"
```

Capture the returned line. Compare to the PO pubkey value documented in the 2026-05-20T18:46 ops-log P2 entry's diff artifact.

**Pass criterion:** byte-equal. **Fail:** hard-gate stop; surface back to tasker. Substrate has drifted; dispatch may be stale.

### P3.2 [Tier R, container-user SSH port 2222] Re-extract Aleksandr's pubkey

The original P1.1 capture was in-session memory; not durably written. Re-extract with the amendment-1 corrected regex.

```powershell
$allKeys = ssh -i $env:USERPROFILE\.ssh\id_ed25519_apex -p 2222 ai-teams@100.96.54.170 'cat /home/ai-teams/.ssh/authorized_keys'
$alekLines = @($allKeys | Where-Object { $_ -match 'aleksandr' -and $_ -notmatch 'mihkel' })
if ($alekLines.Count -ne 1) {
    Write-Host "[SURFACE-BACK] Expected exactly 1 Aleksandr key, found $($alekLines.Count). Halting."
    # halt
}
$alekKey = $alekLines[0].TrimEnd("`r","`n"," ","`t")
```

**Pass criterion:** `$alekKey` is set; `$alekLines.Count -eq 1`.

### P3.3 [Tier R, host-user SSH] Extract PO pubkey from container Config.Env

```
ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^SSH_PUBLIC_KEY_2=' | cut -d= -f2-"
```

Capture as `$poKey` (PowerShell). Strip surrounding quotes if any (Config.Env values are typically unquoted; cross-check).

**Pass criterion:** `$poKey` is a non-empty ssh-ed25519 line.

### P3.4 [Tier R, host-user SSH] Extract rc-connect pubkey from backup `.env`

```
ssh -T dev@100.96.54.170 "grep '^SSH_PUBLIC_KEY_3=' '$BACKUP_DIR/.env' | cut -d= -f2- | tr -d '\"'"
```

Capture as `$rcKey`.

**Pass criterion:** `$rcKey` is a non-empty ssh-ed25519 line.

### P3.5 [Tier R, host-user SSH] Extract GH_TOKEN from container Config.Env

```
ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep '^GH_TOKEN=' | cut -d= -f2-"
```

Capture as `$ghToken`. Do NOT log or persist this value to any local artifact -- kept in-session memory only for the P3.6 write.

**Pass criterion:** `$ghToken` is a non-empty string starting `gho_`.

### P3.6 [Tier M -- Brunel single-line ack] Compose new `.env` on host

**Tasker ack (Brunel):** "I sanction this Tier M op. The substrate's docker-compose.yml is designed for `.env` at `$COMPOSE_DIR/.env`; writing this file is the canonical lifecycle path. Backup `.env` at `$BACKUP_DIR/.env` remains untouched as rollback. Operation is reversible by `rm $COMPOSE_DIR/.env` (returns substrate to pre-write state). -- Brunel"

**Composition logic (run on the host via a single ssh):**

The script sources backup `.env` to load token vars into the shell, then composes the new `.env` with explicit slot assignment + sourced tokens + the captured GH_TOKEN. PowerShell-side variables `$poKey`, `$alekKey`, `$rcKey`, `$ghToken` are interpolated into the remote command via the base64-transit pattern from r3 (proven during the original dispatch) to avoid line-ending hazards.

```powershell
# Build the remote script as a single string, with PowerShell variables interpolated as base64-encoded tokens
$poKeyB64    = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($poKey))
$alekKeyB64  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($alekKey))
$rcKeyB64    = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($rcKey))
$ghTokenB64  = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($ghToken))

$remoteScript = @"
set -euo pipefail
cd '/home/dev/github/apex-migration-research'

# Decode pubkeys + GH_TOKEN from base64
PO_KEY="`$(echo '$poKeyB64' | base64 -d)"
ALEK_KEY="`$(echo '$alekKeyB64' | base64 -d)"
RC_KEY="`$(echo '$rcKeyB64' | base64 -d)"
GH_TOKEN_VAL="`$(echo '$ghTokenB64' | base64 -d)"

# Source backup .env to load token vars (server-side only; never leaves host)
set -a
source '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env'
set +a

# Write new .env with explicit slot assignment + sourced tokens + new GH_TOKEN
cat > .env <<EOF
# Generated by apex-keys-phase1-redux-dispatch on `$(date -Iseconds)
# Slot assignment per PO direction 2026-05-20:
#   SLOT 1 = PO (mihkel.putrinsh@evr.ee)
#   SLOT 2 = Aleksandr (ghost-bridge@aleksandr-2026-05-15)
#   SLOT 3 = rc-connect

SSH_PUBLIC_KEY="`$PO_KEY"
SSH_PUBLIC_KEY_2="`$ALEK_KEY"
SSH_PUBLIC_KEY_3="`$RC_KEY"

GITHUB_TOKEN="`$GITHUB_TOKEN"
GH_TOKEN="`$GH_TOKEN_VAL"
ATLASSIAN_EMAIL="`$ATLASSIAN_EMAIL"
ATLASSIAN_API_TOKEN="`$ATLASSIAN_API_TOKEN"
ATLASSIAN_BASE_URL="`$ATLASSIAN_BASE_URL"
TUNNEL_TOKEN="`$TUNNEL_TOKEN"
ANTHROPIC_API_KEY="`$ANTHROPIC_API_KEY"
EOF

# Quick local sanity check (no docker calls; just file existence + line count)
ls -la .env
echo "---"
grep -c '^SSH_PUBLIC_KEY' .env
"@

# Send via base64-transit (same pattern as r3 P1.4)
$remoteScriptB64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($remoteScript))
ssh -T dev@100.96.54.170 "echo '$remoteScriptB64' | base64 -d | bash"
```

**Pass criterion:** ssh exit 0; output shows `.env` exists with sensible size; `grep -c '^SSH_PUBLIC_KEY' .env` returns `3`.

**Failure modes & surface-back:**
- Non-zero exit → restore from backup (`cp $BACKUP_DIR/.env $COMPOSE_DIR/.env`) is NOT the right move here because `.env` did not exist pre-dispatch; just delete the partial write: `ssh -T dev@... "rm -f $COMPOSE_DIR/.env"`. Surface to Brunel.
- Line count != 3 → indicates compose failure or missing pubkey expansion; `rm` and surface.

### P3.7 [Tier R, host-user SSH] Verify `.env` parses cleanly under docker compose

```
ssh -T dev@100.96.54.170 "cd '/home/dev/github/apex-migration-research' && docker compose config 2>&1 | grep -E '^(\s+)?(SSH_PUBLIC_KEY|GITHUB_TOKEN|GH_TOKEN|ATLASSIAN|TUNNEL|ANTHROPIC)'"
```

`docker compose config` is read-only; renders the compose file with `.env` substituted but does NOT touch the running container.

**Pass criterion:** output shows all SSH_PUBLIC_KEY* slots populated, all tokens resolved (visible as non-empty strings in the rendered output), no stderr errors. The running container remains on its previously-baked Config.Env (unaffected; only future compose-up reads the new `.env`).

**Failure mode & rollback:**
- If `docker compose config` errors: `.env` is malformed. Rollback: `ssh -T dev@... "rm $COMPOSE_DIR/.env"` (since `.env` did not pre-exist, removing returns substrate to pre-dispatch state). Surface to Brunel with the exact parse error.

### P3.8 [Tier R + log + report] Close P3

**Operations-log entry:**
- Fields per Hopper's role-of-record discipline. Outcome: `success` (or `partial`/`failed` per actual result).
- Tasker: Brunel for the Tier M ack; Aen for overall dispatch.
- Pubkey values: SHA-256 fingerprints of the three pubkeys (not full plaintext -- those are in the substrate's `.env` now and we don't need to duplicate them in the audit log).
- Token values: redacted to first-4-chars + length per Hopper's secret-discipline.

**Report:** to Brunel (close diagnosis loop) + CC Aen.

**Scratchpad update:**
- `[LEARNED -- substrate, apex-research]` Phase-1-redux executed; `.env` reconstructed with slot 1=PO, slot 2=Aleksandr, slot 3=rc-connect. Tokens preserved from 2026-04-29 backup; GH_TOKEN added from current Config.Env. Substrate is now "fix staged"; next compose-recreate would install all three SSH keys + restore all credentials.
- `[GOTCHA]` remove or supersede the "any recreate = multi-system credential loss" entry -- that's no longer true post-P3 (assuming P3 succeeds).

---

## Phase 2 deferred

After P3 completes successfully, the substrate is fix-staged. The next step (Tier D `docker compose up --force-recreate apex-research`) is a SEPARATE FUTURE DISPATCH that requires:

1. Explicit PO sanction with full Tier D sanction discipline: exact command + reason + expected outcome, quoted verbatim
2. Apex team coordination for the maintenance window (recreate kills live SSH sessions)
3. Notification to Aleksandr that his session may drop briefly during recreate
4. Verification post-recreate that all three keys are in `authorized_keys` + sshd accepts logins from all three + tokens are in container env

Phase 2 dispatch will reference this P3 dispatch's ops-log entry timestamp as the prerequisite.

---

## Scope boundary (hard NO during P3)

- No `docker compose` operations beyond `inspect` (Tier R) and `config` (Tier R) -- NO `up`, `restart`, `down`, `recreate`, `start`, `stop`, `pull`.
- No `docker exec` into apex container.
- No modifications to any FR-shipped substrate other than the `.env` write at `$COMPOSE_DIR/.env`.
- No modifications to the backup `.env` at `$BACKUP_DIR/.env` (stays as rollback artifact).
- No proceeding past any [SURFACE-BACK] gate without explicit tasker response.

---

## Sanction summary

- P3.1 -- Tier R (substrate-state-unchanged check), default-permitted
- P3.2-P3.5 -- Tier R (probe extractions), default-permitted
- **P3.6 -- Tier M (`.env` write), tasker single-line ack quoted in P3.6 body**
- P3.7 -- Tier R (compose config verify), default-permitted
- P3.8 -- Tier R + log + scratchpad write to MAY-WRITE paths

No Tier D in P3.

---

## Rollback

If anything fails between P3.6 (write) and P3.7 (verify):

```
ssh -T dev@100.96.54.170 "rm -f /home/dev/github/apex-migration-research/.env"
```

Removes the partial write. Substrate returns to pre-P3 state (no `.env`, container running on baked-in Config.Env). Backup `.env` at sibling dir is untouched and remains as further rollback option.

After P3.7 (success), rollback is still possible by removing the `.env` (returns to no-`.env` state) or by `cp`'ing the backup over it (returns to 2026-04-29 backup state). But neither is required if P3 succeeded.

---

## To dispatch this

When preconditions are met and PO sanctions:

1. Aen relays this dispatch text to Brunel (or composes a fresh equivalent referencing this design)
2. Brunel reviews + dispatches to Hopper with you on CC
3. Hopper executes P3.1-P3.8 sequentially with hard-gates
4. Reports to Brunel + CCs Aen
5. Aen commits the resulting artifacts (`.env` write is on the host substrate; ops-log entry is in repo)

---

**End of dispatch design.** (*FR:Aen*)
