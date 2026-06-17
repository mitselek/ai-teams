---
name: ubuntu2404-stock-ubuntu-user-uid-1000-collision
description: ubuntu:24.04 ships a stock `ubuntu` user already at uid 1000, so a container Dockerfile that creates the agent runtime user with `--uid 1000` collides; delete/renumber the stock user first or pick a different uid
type: gotcha
source-agents:
  - brunel
  - hopper
discovered: 2026-06-17
filed-by: librarian
last-verified: 2026-06-17
status: active
confidence: high
source-files:
  - teams/framework-research/docs/teams-migration-probe-container-scope-2026-06-17.md
source-commits:
  - b37b938
related:
  - gotchas/ai-teams-user-no-sudo-use-docker-exec-root.md
  - patterns/live-inject-plus-dockerfile-bake-dual-track.md
---

# `ubuntu:24.04` ships a stock `ubuntu` user already at uid 1000

## Symptom

A container Dockerfile that creates the agent runtime user with an explicit `--uid 1000` (the conventional first-non-root uid) **fails or collides** when the base image is `ubuntu:24.04` -- because the stock image **already ships a user named `ubuntu` at uid 1000**. `useradd --uid 1000 <agent-user>` errors (`UID 1000 is not unique`), or `groupadd`/ownership steps land on the wrong account.

## Cause

`ubuntu:24.04` (Noble) introduced a **default `ubuntu` user pre-created at uid/gid 1000** in the base image -- a change from earlier Ubuntu base images that left 1000 free. Dockerfiles written against older Ubuntu bases assumed uid 1000 was unclaimed.

This is **architectural-fact** about the base image, not an FR-code bug.

## Fix

Pick one, before creating the agent runtime user:

1. **Delete the stock user** first: `userdel -r ubuntu` (then create the agent user at 1000), OR
2. **Renumber the stock user** off 1000, OR
3. **Pick a different uid** for the agent user (e.g. 1001) -- but then keep volume-mount ownership and any host-side `docker exec -u <uid>` consistent with the chosen uid.

Surfaced on the throwaway teams-migration-probe container build (Brunel/Hopper, 2026-06-17).

### Revision trigger (architectural-fact gotcha)

Architectural fact about the **base image**, not an observation whose intentionality is uncertain. **It does not gain confidence from n+1 sightings.** The trigger to revise is a **base-image change** -- if a future Ubuntu base stops pre-creating `ubuntu`@1000, or the fleet moves to a different base, update the entry then. Until then, additional "I hit the uid-1000 collision on 24.04 too" reports do not move confidence.

## Related

- [`gotchas/ai-teams-user-no-sudo-use-docker-exec-root.md`](ai-teams-user-no-sudo-use-docker-exec-root.md) -- the other agent-runtime-user container gotcha (sandboxing/sudoers). Same genre: the agent runtime user's setup in the team-container Dockerfile. This entry is the user-creation/uid layer; that entry is the privilege layer.
- [`patterns/live-inject-plus-dockerfile-bake-dual-track.md`](../patterns/live-inject-plus-dockerfile-bake-dual-track.md) -- when fixing this in a live container vs. baking the fix into the Dockerfile, ship both halves.

(*FR:Callimachus*)
