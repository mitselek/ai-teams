# Deployment Lifecycle -- Coordinated Container Rebuild (CCR) Protocol

Derived from teams/framework-research/docs/ccr-protocol-spec-2026-06-16.md

How a deployed team evolves what runs in its container -- the persistent
startup behaviour and state -- through a formalized, repeatable procedure that
keeps FR's review and maintenance cost flat as the team count grows. The
mechanism already exists (each deployed team versions its own container setup in
its own repo); this is the thin pattern every team follows so that "what runs in
this container" is a reviewable, version-controlled decision rather than tribal
knowledge.

## 1. Purpose & principle

**Teams own content; FR gates activation.** A team has full control over *what*
its container does -- it edits its own repo freely. But the change only goes live
through an FR-reviewed, FR-executed rebuild. Control is real but never
unilateral. (*FR:Monte*)

In Montesquieu's terms, this is a separation of powers -- no branch acts alone:

- **Legislative** -- the team proposes the change in its own repo (a PR).
- **Judicial** -- FR reviews the change against a standing checklist.
- **Executive** -- FR performs the rebuild in an agreed window.

The team cannot make a change live by itself, and FR cannot author the team's
content for it. Each power is necessary; none is sufficient alone. (*FR:Monte*)

## 2. The deploy surface (repo convention) (*FR:Herald*)

Each deployed team keeps a thin, predictable surface at a standard location in
its own repo: `deploy/`. "Minimal specificity" means exactly this -- stable path
+ versioned payload + one-page manifest. Everything else is the team's own
concern.

- **Dockerfile -- stable entrypoint path.** The Dockerfile pins a *stable
  entrypoint path* (e.g. `deploy/startup`). The path is constant; the Dockerfile
  rarely changes. Existing files are **not relocated** -- the Dockerfile stays
  where it already lives (e.g. `Dockerfile.apex` at repo root). The convention
  only *adds* the stable-path payload + `MANIFEST.md`, so the first PR does not
  bikeshed on file placement.
- **Startup payload** at that stable path -- the versioned, mutable "what runs on
  container start." This is what teams edit. Its internal form is the team's
  business (a script that launches their processes); the framework only requires
  it be idempotent and safe to run on every (re)start.
- **`deploy/MANIFEST.md`** -- the one structured artifact the framework mandates.
  It carries **YAML frontmatter** (the typed, machine-parseable declaration)
  above a human-readable body (rationale, notes). The frontmatter is validated
  against a vendored **`deploy/manifest.ts`** schema companion -- copied from the
  canonical `types/t10-ccr-contracts.ts` -- so the manifest is both human-readable
  *and* mechanically checkable.

### MANIFEST.md frontmatter fields

- **`schema_version`** (string) -- the `manifest.ts` contract version the
  frontmatter is written against.
- **`startup_units[]`** -- what runs on start. Each unit:
  - `name`
  - `command`
  - `long_running` (bool) -- long-running units require supervision +
    single-instance discipline (see the review checklist).
- **`persistent_paths[]`** -- every path that must survive a rebuild. Each path:
  - `path`
  - `kind: generate-able | stateful`
- **`maintenance_contact`** (string) -- the team PO / who to coordinate the
  rebuild window with.

### generate-able vs stateful -- the highest-leverage field

- **generate-able** -- regenerate-if-absent on a persistent volume. If the path is
  missing after a rebuild, the startup payload recreates it cleanly (e.g. a
  static config rendered from the repo, a lock file).
- **stateful** -- restore/preserve, *never* reset. The path holds real state that
  was not committed to the repo and cannot be regenerated (e.g. a provisioned SSH
  key, accumulated runtime state).

This is the S52 ephemeral-home discipline baked into the convention.
Mis-tagging a stateful path as generate-able is precisely how a rebuild silently
wipes config -- the `.claude.json`-wipe class of bug: the rebuild "regenerates"
something it should have preserved, and irrecoverable state is gone. Tagging is
therefore the single most consequential decision in the manifest, and the review
checklist scrutinizes it directly.

### Ownership split

FR owns the container **bootstrap** -- the Dockerfile, the base image, and the
volume wiring. The team owns the **startup units** -- the payload, i.e. what runs.
Where a team's entrypoint was originally FR-authored, FR factors it once into
bootstrap + team-owned units while standing up that team's first instance; the
team owns the units thereafter. (*FR:Herald*)

## 3. Change -> rebuild-request flow (*FR:Herald*)

1. The team edits its deploy surface and opens a **PR on its own repo**.
2. The team sends FR a standard **`rebuild-request`** over the comms hub:

   ```json
   {"seq": "<TEAM>-<n>-REBUILD", "repo": "<org/repo>", "pr": <number>,
    "summary": "<one line>", "urgency": "routine|soon|urgent",
    "requested_window": "<proposed time or 'flexible'>"}
   ```

3. FR acks, then reviews (see the review checklist).

**The PR is the contract.** The diff is the reviewable unit -- fully
version-controlled and auditable. The hub `rebuild-request` message is
coordination only; it points at the PR but does not carry the change. Review and
approval happen on the PR in the normal review loop.

## 4. Pointers

- **Review steps (Component 3)** -- `teams/framework-research/playbooks/ccr-review-checklist.md`
- **Rebuild steps (Component 4)** -- `teams/framework-research/playbooks/ccr-rebuild-execution.md`
- **Typed contracts (manifest schema)** -- `types/t10-ccr-contracts.ts`, vendored
  into each team's repo as `deploy/manifest.ts`.

(*FR:Herald*)
