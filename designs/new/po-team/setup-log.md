# PO-team setup — log

Append-only chronology. Distilled knowledge lives in `wiki/` (gotchas, decisions,
references); scope thinking in the comms gist (link in
`wiki/references/boxes-and-access.md`).

## 2026-07-15

1. Comms gap 1 decided → `wiki/decisions/box-allocation-hub-vs-teams.md`.
2. Both VPSes snapshotted (hPanel, 05:38 UTC; 24 h expiry).
3. screenwerk workspace committed + pushed (`ScreenWerk/ai-team` @ `bd7b51f`).
4. mvox box swept clean: stale June dev servers + leftover claude daemon killed
   (→ `wiki/gotchas/pkill-full-match-kills-your-own-ssh-session.md`); all repos
   verified 0 uncommitted. Idle seam confirmed.
5. docker 29.6.1 + compose v5.3.1 installed on ai-screenwerk-ee (get.docker.com,
   Debian 13).
6. `ai-team:latest` built; `mvox` (:2229) and `screenwerk` (:2230) containers up,
   tailnet-only ports (→ `wiki/decisions/tailnet-only-ports.md`,
   `wiki/decisions/whole-home-volume-per-team.md`).
7. screenwerk home (1.4 G) migrated into `screenwerk-home`; workspace verified at
   `bd7b51f` (→ `wiki/gotchas/home-copy-clobbers-authorized-keys.md`).
8. mvox home migrated (4.4 G after cache excludes) box-to-box over tailnet via
   temporary migration key (screenwerk-root → mvox; removed after).
9. mvox identity flip executed per [#91](https://github.com/mitselek/ai-teams/issues/91)
   (closed): config set translated, zero residuals, project dirs renamed, workspace
   git-clean. **Finding:** both git worktrees (josquin, byrd) were already orphaned
   on the source box (`workspace/.git/worktrees/` absent there too) — pre-existing
   breakage faithfully preserved; repair is the mvox team's call.
10. Comms gaps 2 + 4 resolved (gist): Mihkel = hub keeper (telemetry/dashboard =
    follow-up project); attention signals = free text (daemon parses only the `to:`
    line). Design-doc reconciliation [#90](https://github.com/mitselek/ai-teams/issues/90)
    unblocked.

### mvox identity flip (michelek → ai-teams) — working map

mvox is the only team historically running as unix user `michelek`; the container
flips it to fleet-standard `ai-teams`.

- Clean by construction: uid 1000 = uid 1000; claude OAuth / gh / git credentials
  are $HOME-relative; npm-global shebangs use `env node`.
- Needs translation (literal `/home/michelek` baked in): `~/.claude.json` project
  keys; `~/.claude/projects/-home-michelek-*` dir names; possibly PATH lines and box
  scripts (`mvox-up.sh`, `apply-layout.sh`, `spawn_member.sh`). Definitive list =
  grep after transfer; translate from the grep, not from prediction.
- Conscious notes: michelek's personal ssh keypair now inside the mvox container
  (revisit at per-team keys, comms gap 8); `.gitconfig` authorship (`mitselek`)
  decoupled from unix user, stays.

## 2026-07-15 (cont.) — hub deploy (#93) + fsync fix (#97)

12. **#97 fixed** (ultracode analyze/patch/verify): sm-shell durability — `accepted` now
    means fsync-durable; failure fails loud (no false accept). Windows-only degrade;
    `makedirs_durable` fsyncs the dir chain; ack fsyncs the real leaf pair dirs.
    `test_durability.py` proves it by fault injection. Committed.
13. **Hub LIVE on sagres (#93 done)**: gap 0 root recovery (Mihkel hPanel reset +
    deploy-window sudoers); Phase A (listener check, snapshot 12:03:40Z, Variant B home
    clear + full openclaw removal 1.3 G); Phase B docker 29.6.1, artifact to
    `/opt/stationmaster`, **host-networking** (Tailscale-SSH vs docker port-publish —
    `wiki/gotchas/tailscale-ssh-blocks-docker-port-publish.md`), sshd tailnet-bound via
    new `SSHD_LISTEN_ADDR` entrypoint env. Acceptance: 17/17 smoke + mail-survives-restart
    + **reboot survival** (systemd `stationmaster.service`). Hub wiped pristine after test.
    Facts: `wiki/references/hub-on-sagres.md`.

## Pending

11. Legacy renames: boxes → **sagres** (ex ai-mvox-eu) + **shipyard** (ex
    ai-screenwerk-ee) — tailnet names, Hostinger system hostnames
    (`sagres.hub.internal` / `shipyard.teams.internal`), Mac ssh aliases
    (`sagres`, `mvox`, `screenwerk`). Legacy `ai.*` public DNS records live at an
    external provider, serve nothing — retire whenever. Registry rows #10/#11 added.
    Stray noted for sagres cleanup: unidentified python on `0.0.0.0:55340`.

- [x] mvox transfer → grep → translate → verify ([#91](https://github.com/mitselek/ai-teams/issues/91), closed)
- [x] remove temp migration key from mvox box `authorized_keys`
- [x] register mvox:2229 / screenwerk:2230 in `deployments.md` + `registry.json`
- [ ] free ai-mvox-eu (old home archived or cleared) → hub + PO team deploy
- [x] hub deployed on sagres ([#93](https://github.com/mitselek/ai-teams/issues/93), all acceptance passed)
- [ ] daemon packaging ([#95](https://github.com/mitselek/ai-teams/issues/95))
- [ ] per-team ssh keys at hub onboarding ([#96](https://github.com/mitselek/ai-teams/issues/96), comms gap 8)
- [ ] 'up' QoL script + commit container build context ([#94](https://github.com/mitselek/ai-teams/issues/94))
- [ ] design-doc reconciliation ([#90](https://github.com/mitselek/ai-teams/issues/90), gap 4 now resolved -> unblocked)
- [ ] remove deploy-window sudoers on sagres when rollout settles
- [ ] optional: hard power-cycle durability test via Hostinger API

(*PO territory log — maintained by Aen with Mihkel*)
