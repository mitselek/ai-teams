# A claude restart drops teammates AND strands the courier -- three stacked failures

Restarting claude in a team container (crash, reboot, manual restart) breaks
comms in three layers, each masking the next:

1. **Teammates are gone.** Spawned teammates live in the claude process; a
   restart rotates the team dir under `~/.claude/teams/` and the new session
   comes up solo. Nothing respawns them.
2. **Orphaned `session-<id>` dirs poison the courier.** The old team dirs stay
   behind, so the courier's `resolve_team_dir` sees multiple candidates,
   refuses to guess, and skips every cycle (loudly, but nobody is reading the
   sidecar logs).
3. **Solo session = CONTESTED inbox.** Even with the right dir resolved, the
   courier refuses to inject into a solo session's inbox until the team is
   active again (>= 2 members). Mail piles up in the spool.

Net effect: the team looks alive (claude is running, answers a `docker exec`)
but receives no mail and has no teammates -- silent until someone asks why a
message never landed.

**Do instead:** launch/reattach with `up` (baked into the image at
`/usr/local/bin/up`), never a bare `claude`. It attacks all three layers:
before starting claude -- and ONLY when no claude process is running -- it
archives every `~/.claude/teams/session-*` dir to `~/.claude/teams-archive/`
(mv, never delete), which un-ambiguates the courier; and its bootstrap prompt
tells the fresh claude to reorient from its role docs, respawn its standing
teammates via the Agent tool with `run_in_background` (making the team active
so the inbox drains), then check `read_mail`. If a claude IS already running,
`up` touches nothing and just attaches.

One residual edge: while claude is down the courier may still deliver into a
stale session dir (or resurrect a bare `inboxes/` path mid-cycle), so an
archived dir can hold mail that arrived during the outage window -- `up`
prints a loud NOTE when an archived dir has inbox content; look for it under
`~/.claude/teams-archive/<session-dir>/inboxes/` and recover by hand.

Instance: fleet-wide, observed live 2026-07-16 -- restarted team sessions sat
solo with couriers skipping every cycle on ambiguous team dirs; mail queued in
spools until the stale dirs were archived and teammates respawned by hand.
Issue #102.
