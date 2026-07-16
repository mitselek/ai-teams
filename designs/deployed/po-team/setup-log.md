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

## 2026-07-15/16 (cont.) — comms stack end-to-end (daemon, onboarding, surfacing, MCP)

14. **Sidecar courier built + deployed** (#95): `company-courier.py` reuses the reference
    wire/dedup/inbound, rewrites outbound for the `to:`-line convention. ultracode-built,
    fixed (flock lock, bounce-on-reject, batched bounces). Deployed as **sidecar containers**
    `mvox-courier` (shipyard) + `po-team-courier` (sagres), reusing `ai-team:latest`,
    co-mounting the team home volume. **Gotcha fixed:** sidecar needs `pid: "container:<team>"`
    so its liveness check can see the team container's claude pid (separate PID namespace
    otherwise → "ambiguous team dir"). See `wiki/references/company-courier-daemon.md`.
15. **Onboarding done for mvox + po-team** (#96 partial): per-team hub keys generated
    in-container (`~/.ssh/sm_<team>`), registered on the hub (`sm-register`), **reciprocal
    grants** set. Cross-box reachability proven (shipyard→sagres tailnet `ping`).
16. **Surfacing fix** (committed): `stationmaster-courier.py` `rewrite_attribution` now
    FORCES `read:false` + normalizes `timestamp` on inbound delivery — the live harness
    only surfaces entries that have both. Benefits FR too.
17. **MCP send/read server built** (#100): `comms-mcp.py` — stdio JSON-RPC, `send(to,message)`
    (deposits directly, synchronous accept/bounce) + `read_mail()` (non-destructive local read).
    ultracode-built + 3-lens verify; fixes applied (stable entry for retry-dedup-safety,
    team-only routing, UTF-8, error detail). Unit + stdio-smoke tested. **Committed, NOT yet
    deployed to the containers.**

### KEY EMPIRICAL FINDINGS (hard-won, tested — do not re-derive)
- **Receiving/surfacing requires an ACTIVE TEAM (≥2 members).** A lone/solo Claude session
  does NOT drain/surface its inbox; a session with ≥1 spawned teammate does. So: no live
  comms in solo sessions (accepted). `read_mail()` exists to pull mail in the solo case.
- **Team dir + inboxes only materialize with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`** set
  before launching claude. Without it, no `teams/session-<id>/config.json`.
- **Native `SendMessage` cannot reach the outbox** — routes only to REGISTERED agents;
  pre-creating the outbox inbox file does NOT help. → pivoted send to the MCP tool (#100).
- **The receive inbox is a plain file drop** — no roster/member validation on delivery
  (surfacing depends on read:false+timestamp + active team, NOT on the sender being a member).

### LIVE INFRA STATE at handoff
- Hub: `stationmaster` container on **sagres**, healthy, systemd + tailnet-bound (`sm@100.102.133.125:2222`).
- Sidecars: `mvox-courier` (shipyard), `po-team-courier` (sagres) — both running, `pid:container:<team>`.
- Team containers: `mvox` (shipyard :2229), `screenwerk` (:2230), `po-team` (sagres, portless — `docker exec`).
- **Live Claude sessions LEFT RUNNING:** `mvox` (tmux `mvox`, has teammate `echo` → active team, surfaces),
  `po-team` (tmux `po-team`, solo). Both authed. Started with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- Registered+granted on hub: `mvox` ↔ `po-team` (reciprocal). Keys: `~/.ssh/sm_<team>` in each container.
- ~~**PROVEN live:** PO→mvox message travels outbox→po-team-courier→hub→mvox-courier→mvox inbox and
  **surfaces to the mvox agent** (verified in the mvox pane).~~ **RETRACTED 2026-07-16 (Mihkel):
  false — we never had a working outbox.** End-to-end send remains UNPROVEN until the MCP
  `send` live-test (#100).

### NEXT SESSION — deploy + live-test the MCP server (#100)
1. Ship `comms-mcp.py` + `stationmaster-courier.py` + `company-courier.py` into each team
   container (e.g. `~/comms/`), plus a per-team config (same shape as `<team>-courier-config.json`:
   team, ssh_target `sm@100.102.133.125`, ssh_key `~/.ssh/sm_<team>`, ssh_opts `-p 2222 ...`,
   inboxes_dir `auto`, target_inbox `team-lead`, state_dir, claude_home).
2. Add `.mcp.json` in the session workdir (`~/`): `{"mcpServers":{"comms":{"command":"python3",
   "args":["/home/ai-teams/comms/comms-mcp.py","--config","/home/ai-teams/comms/config.json"]}}}`.
   Or `claude mcp add comms -- python3 .../comms-mcp.py --config .../config.json`.
3. Reload the session's MCP (restart claude, or `/mcp`).
4. **Live test:** drive the po-team agent to call the `send` tool → to `mvox` → watch it
   surface in the mvox pane (mvox is an active team). Confirm the synchronous verdict.
5. Then reverse (mvox `send` → po-team) — note po-team is solo, so use `read_mail()` there to
   confirm receipt (won't auto-surface).
- Then: reconcile design docs (#90), 'up' script + commit build context (#94), sudoers removal (#98).

## 2026-07-16 — #100 deployed + live-tested: first PROVEN end-to-end send

Epistemic labels from here on: **proven** (directly observed), **unknown**, **speculative** —
mark status inline instead of letting prose imply confidence.

18. **MCP comms server deployed** to both team containers: `~/comms/` (comms-mcp.py +
    both reference couriers, sibling-resolved) + `~/comms/config.json` (sidecar-config
    shape, `reference_courier` repointed to `~/comms/`). Registered user-scope
    (`claude mcp add --scope user comms ...` → `~/.claude.json`; no project `.mcp.json`,
    avoids the trust prompt). Stdio smoke test passed in both. Sessions restarted with
    `claude --continue` (env `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) — resume kept the
    conversations. ~~mvox's teammate `echo` survived the restart (**proven** — it drained
    + surfaced post-restart)~~ **RETRACTED same day: false — the restart rotated the team
    dir and dropped `echo`; the drain/surface I cited happened pre-restart. Post-restart
    mvox is SOLO. Worse: the orphaned old session dir made the courier's team-dir
    resolution ambiguous → mvox-courier skipped every cycle until the stale dir was
    archived (see item 28). Restart lesson: `--continue` keeps the CONVERSATION, not the
    TEAM — teammates must be respawned, and stale `session-*` dirs must be cleaned.**
19. **PROVEN, both directions** (first real end-to-end send — the 07-15 "PROVEN live"
    outbox claim was retracted as false):
    - po-team agent `send(to=mvox)` → hub verdict `{"status":"accepted","id":"30c5b0f157ef43a1"}`
      (synchronous, in the tool result) → mvox-courier `injected+acked` 06:59:17Z →
      **surfaced to the mvox agent** (read + acknowledged in its pane; inbox drained to `[]`).
    - mvox agent `send(to=po-team)` → `{"status":"accepted","id":"737b5f5423a623d4"}` →
      po-team-courier `injected+acked` 07:02:44Z → did NOT auto-surface (solo session,
      as predicted) → `read_mail()` returned the entry (`from: mvox-courier`, `read: false`).
    - First `send` in a session hits a permission prompt; answered "don't ask again"
      in mvox. po-team pre-approved it interactively earlier (**unknown** exactly when).
20. Ops notes: shipyard host reachable as `root@shipyard.tailccff13.ts.net` (tailnet
    key); sagres docker still via `sudo -n` (#98 window). `from:` shows the courier
    (`mvox-courier`), not the origin agent — attribution passthrough is a known V1
    limitation, fine for now (**speculative**: worth fixing when agent-level routing lands).

## 2026-07-16 (cont.) — #90 reconciliation: PO-team docs rewritten to the inbox architecture

21. **Design-doc reconciliation executed** (ultracode: 4 rewriters, 8 adversarial verifiers,
    1 cross-doc judge, 5 fixers). Rewritten in the working tree (**proven** = reviewed, not
    yet committed): `protocols.md` (§1 tmux contract → inbox channel: MCP `send()` +
    verdicts, outbox `to:` convention, free-text gap-4 vocabulary, loud-failure table;
    tmux → §1.7 persistence note + emergency Appendix A; superseded decisions annotated,
    not deleted), `prompts/po-template.md` + `gama.md` (R/M/D reframed off pane-driving:
    R=reads/read_mail, M=send()+gh, D=ANY pane touch; verdict-before-assume gate; gama's
    infra slots filled with live values), `prompts/henry.md` (Tier-D relay → sanctioned
    emergency pane access; add-a-PO now provisions the attention layer), `product-registry.md`
    (live rows; `last-liveness` redefined as hub round-trip, blocker fixed).
22. **Out-of-scope drift found by the cross-doc judge** in the issue's do-not-touch set
    (reported only, not edited): `common-prompt.md` (Mission still says POs drive panes,
    4 spots), `prompts/nunes.md` (sentinel-token card duty serves the retired channel),
    `roster-design.md` (predates #90 throughout), `issue-standard.md` (2 stale channel
    sentences). → Mihkel extended #90 to cover them; rounds 2–3 below.
23. **Rounds 2–3 (same day): the whole package reconciled.** Round 2 (21 agents):
    `common-prompt.md` (team law — Mission/Roles/Spawn Rule now GitHub + hub mail, aligned
    verbatim with henry.md; sentinel examples → comms-era), `nunes.md` (sentinel card →
    supersession note), `roster-design.md` (supersession banner + the deployable roster.json
    description string rechanneled; history preserved annotated), `issue-standard.md`
    (2 sentences; ready-before-dispatch intact) + the 14 round-1 minors swept (half were
    already incidentally fixed) + whole-package judge (5 majors found+fixed, incl. the
    hub-name seam: **hub routing name `po-team`** vs **roster name `product-owners`** — now
    stated explicitly). Round 3 (8 agents): all 18 remaining minors resolved (15 applied,
    3 already fixed). Totals: 47 agents, ~1.45M tokens, 3 rounds converging (blocker+16
    majors → 5 majors → 0). **Proven** = adversarially reviewed twice + judged; uncommitted.
    Untouched as historical record: `research-precedent.md`, `setup-log.md`, `wiki/`.

## 2026-07-16 (cont.) — #101: PO team DEPLOYED and live

24. **Package shipped** to the po-team container (`~/po-team/`: full package + `roster.json`
    extracted from roster-design §5, workDir fixed to `/home/ai-teams`). Session pinned to
    Fable 5 (`/model claude-fable-5[1m]`) before spawning, per the substrate note; permission
    mode → auto (isolated container, matches fleet practice).
25. **Roster spawned** (partial by design): Henry (team-lead), Nunes (librarian, gold),
    Gama (PO mvox, cyan) — service roles first per the standing rule. pacheco/albuquerque/
    magellan deferred: prompt files don't exist and their registry rows are PENDING; they
    arrive via Henry's add-a-PO procedure. Henry logged the deferral as a decision.
26. **Acceptance test passed (proven):** mvox → `send(to=po-team)` → surfaced live to Henry
    (active team ≥2 members — the solo-session gap is closed). Henry matched it to Gama's
    own in-flight hello to mvox, relayed it, and recorded "channel proven end-to-end".
    Unprompted team behavior observed: Gama had already introduced itself to mvox over the
    hub; Nunes audited the wiki (found the 9 FR-era entries); Henry escalated Gama's PENDING
    registry slots (github-repo, local-clone-path) to Mihkel — **that hand-off is now the
    live blocker for Gama's day-1 work.**
27. Package moves `designs/new/` → `designs/deployed/` with this commit (#101 closed).

## 2026-07-16 (cont.) — post-deploy: gh identity + the restart gotcha (#102)

28. **gh identity delivered** to the po-team container (mvox's pattern: OAuth token as
    `mitselek`, `~/.config/gh/hosts.yml`; verified with API + issue list; git identity set).
    `mitselek/mvox` does not exist — Mihkel's call: **Gama asks the mvox team over the hub**
    which repo is the work of record (answer, via Mihkel in the mvox pane:
    `mvox-dev/mvox_v4e_web` — awaiting delivery through the designed channel).
29. **Incident (proven, root-caused):** Gama's hello to mvox stalled. The earlier mvox
    restart had (a) dropped teammate `echo` (solo again), (b) orphaned the old session dir
    → courier ambiguity → every cycle skipped. Archiving the stale dir recovered the
    courier, which then correctly REFUSED to inject into the contested solo inbox (no
    drainer) and left the mail at the hub for redelivery — no-silent-loss held at every
    step. Receive path is down until mvox has ≥2 members again. Filed as
    [#102](https://github.com/mitselek/ai-teams/issues/102) (restart lifecycle: archive
    stale dirs, respawn the standing teammate, wiki gotcha; ties into #94 'up' script).

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
- [ ] remove deploy-window sudoers on sagres when rollout settles ([#98](https://github.com/mitselek/ai-teams/issues/98))
- [ ] optional: hard power-cycle durability test via Hostinger API ([#99](https://github.com/mitselek/ai-teams/issues/99))
- [x] sidecar courier built + deployed ([#95](https://github.com/mitselek/ai-teams/issues/95))
- [x] mvox + po-team onboarded (keys + reciprocal grants) ([#96](https://github.com/mitselek/ai-teams/issues/96) partial)
- [x] surfacing fix (read:false + timestamp on delivery) committed
- [x] **MCP server ([#100](https://github.com/mitselek/ai-teams/issues/100)): deployed to both containers + live-tested both directions 2026-07-16 (closed)**

(*PO territory log — maintained by Aen with Mihkel*)
