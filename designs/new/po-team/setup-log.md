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

## Pending

- [x] mvox transfer → grep → translate → verify ([#91](https://github.com/mitselek/ai-teams/issues/91), closed)
- [x] remove temp migration key from mvox box `authorized_keys`
- [ ] register mvox:2229 / screenwerk:2230 in `deployments.md` + `registry.json`
- [ ] free ai-mvox-eu (old home archived or cleared) → hub + PO team deploy
- [ ] per-team ssh keys at hub onboarding (comms gap 8)
- [ ] design-doc reconciliation with inbox-based comms — parked as
      [#90](https://github.com/mitselek/ai-teams/issues/90); gated on gap 4
      (attention vocabulary)

(*PO territory log — maintained by Aen with Mihkel*)
