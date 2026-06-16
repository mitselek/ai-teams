# Spec: Coordinated Container Rebuild (CCR) Protocol (*FR:Aen*)

**Date:** 2026-06-16 · **Status:** design approved (PO) + apex review incorporated; reference instance **DEFERRED** (PO: finish protocol design first)

## Problem

Deployed teams run in containers whose startup behaviour (what executes on
rebuild) and persistent state must evolve over time -- add a supervised courier,
persist a key, change a config. Today each change is hand-engineered per team and
per substrate (FR shipped a Windows Scheduled Task courier; apex now wants the
container analog; hr-devs is a third). This does not scale: every deployment is a
bespoke maintenance burden on FR, and "what runs in this container" lives as tribal
knowledge rather than a reviewable, version-controlled decision.

The mechanism to fix this **already exists**: each deployed team versions its own
container setup in its own repo. What is missing is a **formalized, repeatable
procedure** so every team evolves its deployment in the *same thin pattern* -- keeping
FR's review/maintenance cost flat as the team count grows.

This is a research-team deliverable: a protocol + playbooks, not a product.

## Governing principle

**Teams own content; FR gates activation.** A team has full control over *what* its
container does -- it edits its own repo freely. But the change only goes live through
an FR-reviewed, FR-executed rebuild. Control is real but never unilateral.

In Montesquieu's terms (Monte): the team is **legislative** (proposes the change in
its repo), FR is **judicial** (reviews against a standing checklist) and **executive**
(performs the rebuild in an agreed window). No branch acts alone.

## Scope / non-goals

**In scope:** the repo convention ("deploy surface"), the change→rebuild request/
response flow, the review checklist, the coordinated-rebuild execution playbook, and
the authority model. Apex's courier-bake is implemented as reference instance #1.

**Out of scope:** a framework-run supervisor or a mandated manifest/agent runtime
(rejected for excess specificity -- the convention stays thin); changes to the
stationmaster hub/courier protocol itself; non-container deployments (the same
principle may later extend to them, but this spec targets containers).

## Component 1 -- The deploy surface (repo convention)

Each deployed team keeps a thin, *predictable* surface at a standard location in its
own repo: `deploy/`.

- **Dockerfile** pins a **stable entrypoint path** (e.g. `deploy/startup`). The path
  is constant; the Dockerfile rarely changes. Existing files are **not relocated** -- the
  Dockerfile stays where it already lives (e.g. `Dockerfile.apex` at repo root); the
  convention only *adds* the stable-path payload + `MANIFEST.md`, so the first PR does
  not bikeshed on file placement (apex review pt 1).
- **Startup payload** at that stable path -- the versioned, mutable "what runs on
  container start." This is what teams edit. Its internal form is the team's business
  (a script that launches their processes); the framework only requires it be
  idempotent and safe to run on every (re)start.
- **`deploy/MANIFEST.md`** -- the one structured artifact the framework mandates. It
  carries **YAML frontmatter** (the typed, machine-parseable declaration) above a
  human-readable body (rationale, notes). The frontmatter is validated against a
  committed **`deploy/manifest.ts`** schema companion -- the typed contract for the
  manifest shape, versioned per `playbooks/version-typed-contract.md`. This keeps the
  manifest both human-readable *and* mechanically checkable. Frontmatter fields:
  1. **`startup_units`** -- what runs on start: `name`, `command`, `long_running: bool`.
     Long-running units require supervision + single-instance discipline (Component 3).
  2. **`persistent_paths`** -- every path that must survive a rebuild, each with `path`
     and `kind: generate-able | stateful`. **generate-able** = regenerate-if-absent on a
     persistent volume; **stateful** = restore/preserve, *never* reset. This is the S52
     ephemeral-home discipline baked into the convention -- the single highest-leverage
     field, because mis-tagging a stateful path as generate-able is how a rebuild
     silently wipes config (the `.claude.json` class of bug).
  3. **`maintenance_contact`** -- the team PO / who to coordinate the window with.

  The typed frontmatter lets the review (Component 3) validate the manifest against
  `manifest.ts` programmatically rather than eyeballing prose, and lets the rebuild
  playbook read `persistent_paths` to drive its preserve/verify steps.

"Minimal specificity" means exactly this: stable path + versioned payload + one-page
manifest. Everything else is the team's own concern.

**Ownership split (apex review pt 2):** FR owns the container *bootstrap* (Dockerfile,
base image, volume wiring); the team owns the *startup units* (the payload -- what runs).
Where a team's entrypoint was originally FR-authored, FR factors it once into
bootstrap + team-owned units while standing up that team's first instance, then the
team owns the units thereafter.

## Component 2 -- Change → rebuild-request flow

1. Team edits its deploy surface and opens a **PR on its own repo**.
2. Team sends FR a standard **`rebuild-request`** over the comms hub:

   ```json
   {"seq": "<TEAM>-<n>-REBUILD", "repo": "<org/repo>", "pr": <number>,
    "summary": "<one line>", "urgency": "routine|soon|urgent",
    "requested_window": "<proposed time or 'flexible'>"}
   ```

3. FR acks, then reviews (Component 3).

The PR is the contract: the diff is the reviewable unit, fully version-controlled and
auditable. The hub message is coordination only.

## Component 3 -- Review (standing checklist)

FR reviews the PR diff against a fixed checklist, approving or requesting changes *on
the PR* (normal review loop):

- **Startup-execution safety** -- what new code runs on boot; no secrets committed to
  the repo; no destructive operations against persistent data.
- **Persistence correctness** -- every dependency path is declared in MANIFEST.md and
  correctly tagged generate-able vs stateful; generate-able paths regenerate cleanly
  if absent; stateful paths are restored/preserved, never reset.
- **Ordering traps** -- any stateful artifact that a rebuild would wipe unless a
  preservation step runs first (the `.claude.json`-wipe class). The required ordering
  is explicit in the PR.
- **Supervision & single-instance** -- every long-running unit is supervised
  (restart-on-exit), captures stdout/stderr reliably (not to a dead pty), and is
  guarded against duplicate instances (lock + pre-clean of a dead predecessor). The
  **recommended supervisor is the shell trap-loop** proven in FR's courier and apex's
  own entrypoint (`while true; do <unit>; sleep <backoff>; done`, with pre-clean of a
  dead predecessor); s6/runit/supervisord are allowed if the PR justifies the added
  dependency. Defaulting to the shared pattern keeps review consistent across teams
  (apex review pt 3).

## Component 4 -- Coordinated rebuild (gated playbook)

After the PR is approved and merged, FR (Hopper, operator) executes the rebuild. The
gates generalize the S52 apex-hardening discipline:

1. **Risk tier sets gate weight (apex review pt 6):**
   - *Low-risk* -- adds/edits a supervised startup unit, no volume/persistence/secret
     change: light gate (FR review approval + a brief agreed window; quiescence still
     required).
   - *High-risk* -- volume, persistence-path, or secret changes: full gates (route
     confirmed · FR PO go · window agreed · quiescence).
   The review (Component 3) assigns the tier; the MANIFEST persistent-paths diff is the
   discriminator -- touching a stateful path forces high-risk.
2. **Execute** the rebuild.
3. **Verify via a manifest-derived REBUILD-REPORT.** The startup payload emits a
   structured report (machine-readable + human rendering) on **every container start**
   (rebuild *or* plain restart), generated *from* the MANIFEST so it cannot drift from
   the contract: one check per `startup_units` entry ("up"), one per `persistent_paths`
   entry ("survived" -- stateful paths are the critical ones), plus container identity
   (e.g. SSH host key unchanged) and a real end-to-end check where possible (courier
   round-trip). Audit metadata: trigger (`rebuild|restart|session-start|unknown` -- `session-start`
   per apex's first live report, where the beacon fires on a Claude session-start),
   image tag/digest,
   the deploy-surface commit SHA + merged PR#, and `manifest.ts` schema version.
   `Status: OPERATIONAL | DEGRADED | FAILED` -- any stateful-path-survived failure ⇒
   FAILED (triggers rollback); WARN-only ⇒ DEGRADED. The report MUST be
   **deterministic** (shell/python), independent of any LLM/Claude session -- health
   checks are mechanical, and an LLM in the report path is fragile (adjacent to the
   dead-pty failure class). Any attachable agent session (for PO access) is a *separate*
   concern from the report; its launch mechanics live in the rebuild-execution playbook.
4. **Report** -- the startup payload sends the REBUILD-REPORT to FR over the hub; FR
   checks it against the manifest and notifies the team + PO. Because it fires on every
   restart (not just FR-driven rebuilds), it doubles as ongoing deployment health.
5. **Rollback** -- if verification fails, roll back to the previously-tagged image.
   Since teams commonly build `:latest` with no prior tag, the playbook **tags the
   current image before rebuilding** (`docker tag <img>:latest <img>:pre-<date>`) so a
   rollback target always exists (apex review pt 5).

## Reference instance #1 -- apex courier-bake

**Status: DEFERRED** (PO, 2026-06-16) -- finish the full protocol design (all
deliverables) before standing up the first instance; apex's courier-bake waits. apex's
review fed the design; execution does not start yet.

Validates the protocol end to end. apex (Eesti-Raudtee/apex-migration-research)
already supplied its courier runtime expectations, which map directly onto the
manifest:

- **Startup unit:** `python3 stationmaster-courier.reference.py --config courier.json`
  (long-running, supervised, restart-on-exit; `--ping` usable for health checks).
- **Persistent paths:** SSH key `~/.ssh/stationmaster_apex` (stateful -- provision at
  build / preserve), known-hosts file (stateful), `courier.json` (generate-able from
  repo -- static config), `{state_dir}/courier.lock` (generate-able; pre-clean dead
  predecessor on restart).
- **Ordering trap:** `.claude.json` persist fix must precede the rebuild.
- **Sequence:** PR #165 (existing hardening) merges first → PR #166 (courier-bake,
  authored under this protocol) → rebuild. All after the `.claude.json` persist fix.

## Deliverables

1. **CCR protocol doc** -- the procedure, the `deploy/` convention, and the hub
   `rebuild-request` message shape (Components 1–2). Owner: Herald (protocol) with
   Monte (authority model).
2. **Review-checklist playbook** -- Component 3 as a runnable checklist. Owner: Brunel
   (container/persistence) + Monte.
3. **Rebuild-execution playbook** -- Component 4 with the gates. Owner: Hopper.
4. **apex reference instance** -- PR #166 against apex's repo, produced by following
   the protocol. Owner: Brunel (authoring) + Hopper (rebuild), PO-gated.

## Open questions

- Where the canonical CCR docs live (a new `topics/NN-deployment-lifecycle.md` vs the
  `playbooks/` dir). Resolve at planning time.
- `manifest.ts` ownership: a per-team copy vs a single FR-published schema each team
  imports. Leaning FR-published (one canonical typed contract, version-bumped per
  `playbooks/version-typed-contract.md`) so the shape can't drift per team; resolve at
  planning. (Decided 2026-06-16: type the manifest now via YAML frontmatter + a
  `manifest.ts` schema, rather than deferring -- aligns with the org's typed-contract
  discipline.)
