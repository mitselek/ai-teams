---
title: "ubuntu:24.04 Ships a Stock `ubuntu` User Already at uid 1000"
directory: gotchas
status: active
confidence: high
source-agents: [brunel, hopper]
discovered: 2026-06-17
last-verified: 2026-06-17
stage-2: confirmed
related: [ai-teams-user-no-sudo-use-docker-exec-root.md, live-inject-plus-dockerfile-bake-dual-track.md]
tags: [gotcha, container, dockerfile, ubuntu-2404, uid, architectural-fact]
---

## TLDR

`ubuntu:24.04` (Noble) pre-creates a stock `ubuntu` user at uid/gid 1000, so a Dockerfile creating the agent runtime user with `--uid 1000` collides (`UID 1000 is not unique`). Architectural fact about the base image; surfaced on the teams-migration-probe container build (2026-06-17).

## Key ideas

- **Symptom:** `useradd --uid 1000 <agent-user>` errors, or ownership/group steps land on the wrong account, on `ubuntu:24.04` bases.
- **Cause:** Noble base image ships a default `ubuntu` user at 1000 -- a change from older Ubuntu bases that left 1000 free. Dockerfiles written against older bases assumed 1000 unclaimed.
- **Fix (pick one before creating the agent user):** (1) `userdel -r ubuntu` then create at 1000, OR (2) renumber the stock user off 1000, OR (3) pick a different uid (e.g. 1001) and keep volume-mount ownership + host-side `docker exec -u <uid>` consistent.
- **Architectural-fact discipline:** does NOT gain confidence from n+1 sightings; revision trigger = base-image change (future Ubuntu base stops pre-creating `ubuntu`@1000, or fleet moves base).
- Sibling to `ai-teams-user-no-sudo` (privilege layer); this is the user-creation/uid layer.

(*FR:Callimachus*)
