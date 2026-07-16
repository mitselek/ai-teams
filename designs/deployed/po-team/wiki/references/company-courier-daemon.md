# Company courier daemon (#95)

Container-side courier for the comms stack. Reuses the reference courier
(`teams/framework-research/poc/ghost-bridge/stationmaster-courier.py`) by importlib
for wire/dedup/lock/INBOUND; rewrites only the OUTBOUND path for the ratified
`to:`-line outbox convention. Built + adversarially verified via ultracode (#95),
fixes applied for the review's blocker + majors, unit-tested.

Files: `teams/framework-research/poc/ghost-bridge/company-courier.py` (+ reference,
side-by-side) and `test-company-courier-outbound.py` (fault/mock unit test).

## Design

- **Inbound** (reference, verbatim): collect from hub -> inject into the live
  `session-<id>/inboxes/<agent>.json` (3 guards) -> ack. Ledger-dedup, at-least-once.
- **Outbound** (rewritten): consume ONE `outbox` ghost -> parse ONLY the first line
  (`to: <team>` / `to: <agent>@<team>`) -> deposit verbatim, OR bounce to sender.
  Exactly two outcomes. Hub-rejection also bounces (no silent retain-forever).
- **Lock**: `flock` (kernel-released on death) -- NOT the reference's persisted-PID
  lock (which would strand a stale lock on a persistent volume after SIGKILL).
- **Lifecycle**: continuous poll; re-resolves the session dir each cycle (rotates);
  no live session -> skip cycle + loud log (no fallback).

## Deploy (sidecar per team)

Reuses `ai-team:latest` (has python 3.12 + ssh). One sidecar per team, co-mounts the
team's home volume (sees the live inboxes + the per-team hub key), no ports (dials the
hub outbound). Config bind-mounted. Compose: `<box>:/opt/ai-teams/*-courier-compose.yml`;
files at `<box>:/opt/company-courier/`.

Live: `mvox-courier` (shipyard), `po-team-courier` (sagres) -- both running.

## Proven (2026-07-15)

- Onboarding: mvox + po-team registered on the hub, reciprocal grants; cross-box
  reachability (shipyard->sagres tailnet) via `ping`.
- **Full automated outbound**: a `to: mvox` message in po-team's outbox was consumed,
  parsed, and deposited to the hub by po-team-courier with no manual step.
- **Inbound delivery**: the mvox-courier collected + injected + acked a real PO->mvox
  message into `mvox .../inboxes/team-lead.json`.
- Unit test: good->deposit, parse-fail->bounce, hub-reject->bounce (batched per
  target), spool cleaned, flock refuses a 2nd instance.

## Open last mile

`inject_batch` refuses a CONTESTED (undrained) inbox -- correct: it needs a LIVE claude
session draining `team-lead.json`. A lone interactive session (and a Task-subagent
session) on CLI 2.1.210 does NOT materialize `teams/<slug>/config.json` + `inboxes/`;
the working mvox dir came from a migrated real-team session. Standing up live
team-lead sessions that own a draining inbox is the remaining "run the teams" step
(how 2.1.210 creates a team inbox needs a short investigation) -- separable from the
messaging pipe, which is proven.

V1 daemon limitations (documented in the daemon header): agent-level RECEIVING routing
-> team-lead; positional deposit-result match; outbound deposit needs a resolvable
session.
