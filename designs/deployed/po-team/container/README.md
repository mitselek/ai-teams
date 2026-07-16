# container/ -- fleet build contexts + canonical launcher

## What is in here

- `up` -- the canonical team-container launcher (issues #94 + #102). Single
  source of truth; baked into the ai-team image as `/usr/local/bin/up`, never
  copied per-home (per-home copies drift).
- `shipyard/` -- VERBATIM mirror of `/opt/` on the ai-screenwerk-ee box
  (`ai-teams/` image build context for mvox + screenwerk, `company-courier/`
  sidecar sources).
- `sagres/` -- VERBATIM mirror of `/opt/` on the sagres box (`ai-teams/`
  build context for po-team, `company-courier/`, `stationmaster/` hub context).

These mirrors are the deploy source of truth going forward: edit HERE, then
push to the boxes. Do not hand-edit files on a box without syncing back.

Note on `up` copies: after a deploy, each box's `/opt/ai-teams/` contains an
`up` file -- that is a sync-generated artifact of deploy step 2, never edit it
on-box, and the repo mirrors (`shipyard/ai-teams/`, `sagres/ai-teams/`)
deliberately do NOT carry one. When mirroring a box's `/opt/` back into the
repo, exclude it (`rsync --exclude=ai-teams/up`, or delete after fetch) so a
drifting second copy never lands in a mirror. The only editable copy is
`container/up`.

## Deploy flow (image bake)

1. Edit under `shipyard/` / `sagres/` (and `up`, which lives once at this
   level -- the sync step copies it into each build context).
2. Sync to the box, e.g. for sagres:

   ```sh
   rsync -av sagres/ sagres:/opt/
   rsync -av up sagres:/opt/ai-teams/up      # beside the Dockerfile, so COPY up works
   ```

   (same shape for shipyard: `rsync -av shipyard/ shipyard:/opt/` +
   `rsync -av up shipyard:/opt/ai-teams/up`)
3. On the box: `docker build -t ai-team:latest /opt/ai-teams/`.
4. Recreate policy: do NOT bounce running team containers just to pick up the
   image -- live claude sessions die with the container. The new image is
   picked up at the next natural recreate. Homes are named volumes, so
   recreates keep state.

   **WARNING -- a freshly built image makes `docker compose up -d` destructive:**
   once step 3 changes the `ai-team:latest` image ID, the NEXT
   `docker compose up -d` on that box recreates EVERY service using that
   image, even if you only meant to apply an unrelated config tweak -- all
   live claude sessions on the box die at once. Treat pickup as a deliberate
   per-team action: `docker compose up -d <service>` only after confirming
   that team's session may die, and never run a bare `docker compose up -d`
   on a box with live sessions and a freshly built image.

## Hot-install of `up` into RUNNING containers

For rollouts that must not kill live claude sessions (this one), install `up`
into the running containers directly; the image bake covers the next natural
recreate:

```sh
# per box, per team container (mvox, screenwerk, po-team):
docker cp up <container>:/usr/local/bin/up
docker exec -u root <container> chmod 755 /usr/local/bin/up
docker exec <container> up --help   # sanity: prints usage, exits 0
```

(`docker cp` writes as root, hence the explicit chmod; no container restart,
no session interruption. `up` detects running claude processes by scanning
`/proc` in pure bash, so it needs no extra packages -- it works as-is in the
already-running containers built without procps.)
