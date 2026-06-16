# Apex Keys -- Phase 2 Recreate Dispatch (DRAFT -- Tier D sanction needed)

**Status:** DRAFT -- staged for execution as the companion to Phase-1-Redux. Do NOT dispatch to Hopper until preconditions are met AND the Tier D sanction package below is approved by PO.
**Composed:** 2026-05-20 (post Phase-1-Redux composition)
**Predecessor:** Phase-1-Redux dispatch at `designs/new/apex-keys-phase1-redux-dispatch.md` (Tier R + Tier M `.env` write)
**Catalyzing context:** PO 2026-05-20 confirmation that apex team's down-state IS the maintenance window for this work

(*FR:Aen*)

---

## Preconditions (must all hold before this dispatch fires)

1. **Apex team is down by design.** Same as Phase-1-Redux precondition #1. They are offline to enable this recreate.
2. **Phase-1-Redux P3.6 completed successfully.** `$COMPOSE_DIR/.env` exists on host with all three SSH_PUBLIC_KEY slots populated + all tokens resolved + GH_TOKEN included. Verified by P3.7 `docker compose config` parse-OK.
3. **PO has explicitly sanctioned this dispatch text** with the Tier D sanction package below, quoted verbatim per Hopper's role discipline.
4. **No competing operations in flight against apex-research.**
5. **Backup paths in place:** `$BACKUP_DIR/.env` exists at sibling dir; named volumes `apex-research_apex-claude-home`, `apex-research_apex-research-repo`, `apex-research_apex-source-data` all present (verified by `docker volume ls`).

If any precondition fails, hard-gate stop. Do not proceed.

---

## Background

Phase-1-Redux wrote a new `.env` at `$COMPOSE_DIR`. The running apex container is still serving on its pre-2026-04-29 baked-in Config.Env (`.env` was missing during the entire post-fresh-clone era; the running container has never seen the new file). To activate the new `.env`, the container must be recreated -- that's the canonical lifecycle event where compose reads `.env` and entrypoint Step 7 re-runs to write `authorized_keys`.

This is Tier D: `--force-recreate` destroys the running container and creates a new one. Any live SSH sessions to apex drop. Apex team is offline precisely so this drop has no operational impact on their work.

---

## TIER D SANCTION PACKAGE (PO MUST APPROVE VERBATIM)

Per Hopper's prompt: "The dispatch MUST contain all three components, quoted in the dispatch package verbatim: (a) the exact command, (b) the stated reason, (c) the expected outcome."

**Draft sanction text below. PO: approve as-is, amend, or rewrite. The text PO finally approves goes into the dispatch verbatim.**

### (a) Exact command

```
ssh -T dev@100.96.54.170 "cd '/home/dev/github/apex-migration-research' && docker compose up -d --force-recreate apex-research"
```

### (b) Stated reason

Apply the new `.env` (created by Phase-1-Redux P3.6 in this same maintenance window) so that the entrypoint Step 7 installs SSH keys for SLOT 1 = PO, SLOT 2 = Aleksandr, SLOT 3 = rc-connect on the next container start. The current container's Config.Env is stale (pre-2026-04-29 fresh-clone): SLOT 1 empty, SLOT 2 = PO, SLOT 3 absent, no GH_TOKEN. Without recreate, the new `.env` is dormant and the substrate keeps serving on the stale baked-in env. Recreate is the canonical lifecycle event the substrate is designed for, but `--force-recreate` is Tier D because (i) it destroys the running container and all in-process state, and (ii) live SSH sessions drop. Apex team is offline by design to make this drop harmless; that's the precondition that elevates this from "impossible without coordination" to "safe-in-the-window."

The alternative -- leave `.env` written but never recreate -- would mean Aleksandr's key persistence remains unaddressed (the original ask) and the substrate stays in fragile state (any unplanned restart still causes the credential cascade). Doing the recreate now, within the sanctioned window, is the only way to actually achieve the task.

### (c) Expected outcome

**Within ~15 seconds of the command:**
- Container `apex-research` stops (docker logs report exit)
- New container created with the same name from compose-yml + new `.env`
- New container starts; entrypoint runs
- Entrypoint Step 7 enumerates `SSH_PUBLIC_KEY*` env vars (now three: SLOT 1, 2, 3) and writes `authorized_keys` for both `michelek` and `ai-teams` users with KEY_COUNT=3 (visible in entrypoint logs)
- Named volumes (`apex-claude-home`, `apex-research-repo`, `apex-source-data`) persist across the recreate (volume integrity check: `docker volume ls | grep apex` shows same three volumes pre and post)

**Tier R verification commands (run as separate steps after the recreate completes):**
- `ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(SSH_PUBLIC_KEY|GITHUB_TOKEN|GH_TOKEN|ATLASSIAN|TUNNEL|ANTHROPIC)'"` → all three SSH_PUBLIC_KEY slots populated, all tokens present
- `ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 "cat /home/ai-teams/.ssh/authorized_keys"` → three lines, one each for PO + Aleksandr + rc-connect
- `ssh -T dev@100.96.54.170 "docker logs apex-research --tail 50"` → no entrypoint errors; KEY_COUNT=3 line present
- Optional manual verification (PO's call): test SSH login as each key from a workstation

**Failure mode to watch for:** if entrypoint fails (e.g., malformed `.env` token, missing required var), the new container restarts repeatedly or exits. Detection: `docker ps -a | grep apex` shows status `Restarting` or `Exited`. Recovery: rollback `.env` (`ssh -T dev@... "cp $BACKUP_DIR/.env $COMPOSE_DIR/.env"`) and re-recreate to restore pre-Phase-1-Redux state (PO key as SLOT 2 only -- substrate still in fragile state but at least running). Surface to Brunel + PO immediately on this failure mode.

---

## Steps (sequential, hard-gate between each)

### P4.1 [Tier R, host-user SSH] Pre-recreate state capture

Capture current state for diff/recovery:

```
ssh -T dev@100.96.54.170 "docker ps --filter name=apex-research --format '{{.Names}} {{.Status}} {{.Image}}'; echo '---'; docker volume ls | grep apex-research; echo '---'; ls -la '/home/dev/github/apex-migration-research/.env' '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env'"
```

Capture verbatim. Pass criterion: container is running; three apex volumes listed; `.env` exists (from Phase-1-Redux); backup `.env` exists.

### P4.2 [Tier D -- PO sanction quoted verbatim above] Execute recreate

Run the exact command from sanction (a):

```
ssh -T dev@100.96.54.170 "cd '/home/dev/github/apex-migration-research' && docker compose up -d --force-recreate apex-research"
```

Pass criterion: ssh exit 0; output mentions container recreated.

**Hard gate immediately after:** wait 10 seconds, then check container is running.

### P4.3 [Tier R, host-user SSH] Confirm container is running and not crash-looping

```
ssh -T dev@100.96.54.170 "sleep 10 && docker ps --filter name=apex-research --format '{{.Names}} {{.Status}}'"
```

Pass criterion: status is `Up <seconds>`, not `Restarting` or `Exited`.

**Failure mode & rollback:** if `Restarting` or `Exited`, the entrypoint failed. Capture logs (`docker logs apex-research --tail 100`) then roll back: `ssh -T dev@... "cp '$BACKUP_DIR/.env' '$COMPOSE_DIR/.env' && docker compose up -d --force-recreate apex-research"`. This recreates from backup `.env` (returns to pre-Phase-1-Redux state -- PO in SLOT 2 only). Surface to Brunel + PO.

### P4.4 [Tier R, host-user SSH] Verify Config.Env

```
ssh -T dev@100.96.54.170 "docker inspect apex-research --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -E '^(SSH_PUBLIC_KEY|GITHUB_TOKEN|GH_TOKEN|ATLASSIAN|TUNNEL|ANTHROPIC)'"
```

Pass criterion: 
- `SSH_PUBLIC_KEY=` (with PO's value)
- `SSH_PUBLIC_KEY_2=` (with Aleksandr's value)
- `SSH_PUBLIC_KEY_3=` (with rc-connect's value)
- All tokens populated (GITHUB_TOKEN, ATLASSIAN_*, GH_TOKEN, TUNNEL_TOKEN)
- ANTHROPIC_API_KEY present but empty (matches backup design)

### P4.5 [Tier R, container-user SSH] Verify authorized_keys

```
ssh -i ~/.ssh/id_ed25519_apex -p 2222 ai-teams@100.96.54.170 "cat /home/ai-teams/.ssh/authorized_keys"
```

Pass criterion: three lines -- one each for PO (`mihkel.putrinsh@evr.ee apex-research`), Aleksandr (`ghost-bridge@aleksandr-2026-05-15`), rc-connect (`rc-connect`).

### P4.6 [Tier R, host-user SSH] Verify entrypoint logs

```
ssh -T dev@100.96.54.170 "docker logs apex-research --tail 100 | grep -E 'SSH public key|entrypoint|ERROR'"
```

Pass criterion: log line includes `KEY_COUNT=3` (or substrate's equivalent message indicating three keys installed). No `ERROR` lines.

### P4.7 [Tier R, host-user SSH] Verify volume integrity

```
ssh -T dev@100.96.54.170 "docker volume ls | grep apex-research"
```

Pass criterion: same three volumes (`apex-research_apex-claude-home`, `apex-research_apex-research-repo`, `apex-research_apex-source-data`) as captured in P4.1. None lost.

### P4.8 [Tier R + log + report] Close Phase 2

Operations-log entry (5th entry in append-only chain, after the 4 prior P-entries):
- Tasker: Aen (with PO Tier D sanction text quoted verbatim -- full sanction package above is the "sanction status" field)
- Dispatch summary: "apex-research Phase 2 recreate -- applied new .env from Phase-1-Redux P3.6; container recreated; entrypoint installed three SSH keys; tokens restored; volumes preserved"
- Outcome: success (or partial/failed per actual)

Report to Brunel + CC Aen + (informally) to PO. Phase 2 close = the original task ("make Aleksandr's key persist apex rebuilds") is now ACHIEVED.

Scratchpad updates:
- Hopper `[LEARNED]` -- Phase-2 recreate executed successfully. Three keys + all tokens now baked into container's Config.Env. Substrate is recreate-safe; next maintenance recreate will install the same keys.
- Remove/supersede the `[GOTCHA]` about "any recreate = lockout" -- no longer true.

---

## Scope boundary (hard NO during P4)

- No modifications to apex-research substrate beyond the recreate command itself
- No touching other FR-shipped substrates
- No `docker volume rm` or `docker compose down -v` (those would destroy named volumes -- explicitly NOT in scope)
- Do not proceed past any [SURFACE-BACK] gate without explicit tasker response

---

## Sanction summary

- P4.1 -- Tier R, default-permitted
- **P4.2 -- Tier D, PO sanction package quoted verbatim above**
- P4.3-P4.7 -- Tier R, default-permitted
- P4.8 -- Tier R + log + scratchpad write to MAY-WRITE paths

---

## Rollback

If P4.2 succeeds but P4.3-P4.7 fail (container running but state is wrong):

```
ssh -T dev@100.96.54.170 "cp '/home/dev/github/apex-migration-research.pre-fresh-clone-2026-04-29/.env' '/home/dev/github/apex-migration-research/.env' && docker compose up -d --force-recreate apex-research"
```

Returns substrate to pre-Phase-1-Redux state with PO in SLOT 2 only -- recreate-safe-enough for apex team to come back online and resume their work. Aleksandr's key persistence remains unaddressed (the original ask); diagnose offline before re-attempting.

If P4.2 itself fails (compose error before recreate triggers), `.env` is still the new file from Phase-1-Redux but no destruction has happened. Substrate is in pre-P4 state. Surface to Brunel.

---

## To dispatch this

1. **PO sanctions the Tier D package** (the three components in the dedicated section above). Either approves as-drafted with a "approved verbatim" signal, or provides amended text.
2. Aen relays the approved dispatch (this file with PO's verbatim sanction text in place) to Brunel.
3. Brunel reviews + dispatches to Hopper with PO on CC.
4. Hopper executes P4.1-P4.8 sequentially with hard-gates.
5. Reports to Brunel + CCs Aen + (informally) PO.
6. Aen commits the resulting artifacts (ops-log entry + scratchpad updates).
7. PO confirms apex team can come back online.

---

**End of dispatch design.** (*FR:Aen*)
