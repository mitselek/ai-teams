# migration-probe-harness -- repeatable CLI-migration validation probe

(*FR:Brunel*) -- S55, 2026-06-18. WS3a+ of issue #86. A scripted, version-parameterized
re-run of the teams-migration validation probe (V1-V5), so each future CLI pin/unpin cycle
re-runs the SAME harness against a new version instead of re-deriving the drive mechanics.

Evolved from the one-off S54 artifacts in `../teams-migration-probe/` (Dockerfile + compose +
entrypoint). The harness adds three things S54 left ad-hoc or hardcoded:
1. **Version-parameterization** -- `CLAUDE_VERSION` build-arg (was a hardcoded `2.1.179`).
2. **Scripted drive** -- the V1-V5 checks as deterministic bash (S54 drove them by hand over `docker exec`).
3. **Scripted teardown** -- snapshot -> `down -v` -> `rmi`, the S54 isolation discipline, codified.

## What it validates (the design behind it)

See the brief: `teams/framework-research/docs/migration-validation-probe-brief-2026-06-18.md`.
Five checks, **run order V3 -> V4 -> V1 -> V5 -> V2** (the order is load-bearing -- V3's GC finding
determines how V2's liveness path reads):

| Check | What | Verdict type |
|---|---|---|
| **V3** | `sessions/<pid>.json` GC-on-exit (graceful + kill -9). **Records the EXACT post-exit `status` string + full dead-entry body.** | PASS + load-bearing capture |
| **V4** | `sessions/<pid>.json` write-order vs `config.json` on cold start | MEASURE-only |
| **V1** | resolver config-glob path (courier vantage, no pid) + `inboxes_dir:"auto"` resolution | PASS/FAIL |
| **V5** | P4 members[]-injection + P6 external-write-wake regression on the target version | PASS/FAIL |
| **V2** | resolver pid-keyed path (lifecycle vantage) + planted stale dir + single-dir self-confirm | PASS/FAIL |

## Files

```
Dockerfile.probe          # ubuntu:24.04 + Node22 + claude@${CLAUDE_VERSION} (build-arg, asserted)
docker-compose.probe.yml  # version threaded into build-arg + image tag + volume name
entrypoint-probe.sh       # verbatim from S54 (version-agnostic)
harness.sh                # orchestrator: build -> up+stage -> AUTH PAUSE -> drive -> teardown
lib/checks.sh             # V1-V5 as deterministic bash functions (docker-exec drive, no ssh)
staging/
  resolve_team_dir.py     # WS1 §5 resolver (standalone reference, decision (b))
  config_resolve_check.py # reproduces the WS1 Config.__init__ inboxes_dir:"auto" branch for V1
  fr-courier.config.json  # probe courier config (inboxes_dir:"auto", dummy hub)
```

## Re-run instructions (the whole point of the harness)

On the **rc host** (Linux/bash -- deliberately NOT Windows; no PowerShell quoting traps):

```bash
# 1. Pin the version = the unpin-target (latest stable 2.1.178+ at the time you re-run).
export CLAUDE_VERSION=2.1.181          # S55 unpin-target (PO-decided 2026-06-18); change to the new target next cycle
export PROBE_SSH_PUBLIC_KEY="$(cat ~/.ssh/probe.pub)"   # optional; docker-exec drive works without it
# WARP host only:
#   export PROBE_NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem
#   and uncomment the WARP block in docker-compose.probe.yml

# 2. Run end-to-end (build -> up -> AUTH PAUSE -> drive V1-V5 -> teardown).
./harness.sh all
```

When the harness hits **AUTH PAUSE** it prints instructions and waits on `read`. The PO does the
OAuth login (this step CANNOT be scripted -- the device code is entered interactively and is never
logged), then presses ENTER to resume:

```bash
# in another shell, when prompted:
docker exec -it -u ai-teams teams-migration-probe tmux attach -t auth
#   run /login in the pane, complete the browser device-code flow, then Ctrl-b d to detach
# back in the harness shell: press ENTER
```

### Phase-by-phase (debugging / partial re-run)

```bash
CLAUDE_VERSION=2.1.181 ./harness.sh build      # just build the tagged image
CLAUDE_VERSION=2.1.181 ./harness.sh up         # up + stage probe files
CLAUDE_VERSION=2.1.181 ./harness.sh auth       # interactive auth pause only
CLAUDE_VERSION=2.1.181 ./harness.sh drive      # run V3->V4->V1->V5->V2 (needs an authed session)
CLAUDE_VERSION=2.1.181 ./harness.sh teardown   # snapshot + down -v + rmi
```

Results land in `results-<version>-<stamp>.log` (every `RESULT <check> <verdict> <detail>` line +
the V3/V4 raw captures). Snapshot of `~/.claude` lands in `/tmp/migration-probe-snapshot-<version>-<stamp>/`.

## The one human step (load-bearing)

The OAuth `claude login` is the ONLY non-scripted step. Everything around it is automated. The
harness pauses cleanly, the PO authenticates, the harness resumes and verifies
`~/.claude/.credentials.json` exists before driving. Rationale: the device code must never be
captured into any log -- so the harness scripts *around* the human, not the human.

## Isolation / safety (Tier R/M)

Throwaway image + named volume **per version** (no collision across concurrent version probes).
`teardown` does `down -v` (deletes the volume) + `rmi` (deletes the tagged image), after snapshotting
`~/.claude` to `/tmp/` for the record. No live-team container is touched; no host change beyond the
throwaway; no pinned binary touched. The same isolation envelope S54 proved on the WARP rc host.

## Known scoping (read before interpreting V1)

- **V1 validates PATH RESOLUTION, not a full hub round-trip.** The throwaway has no stationmaster
  hub (no SSH egress to one), so `config_resolve_check.py` proves `inboxes_dir:"auto"` resolves to
  the live `session-<id>/inboxes` (and not the hardcoded `framework-research` path). A live
  courier `--once` round-trip against the real hub belongs to the post-unpin integration test.
- **The `status` dead-string allowlist in `resolve_team_dir.py` (`dead`/`exited`/`stopped`) is a
  GUESS.** V3 records the ACTUAL post-exit status string; the real WS1 integration into
  `stationmaster-courier.py` keys on whatever V3 reveals, not the guess. This is why V3 runs first.
- **Decision (b):** the harness stages the standalone reference resolver, NOT a patch into
  `stationmaster-courier.py`. The real patch is a separate post-probe integration step.

(*FR:Brunel*)
