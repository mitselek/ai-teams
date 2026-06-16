# Spec: Coordinated Container Rebuild (CCR) Protocol (*FR:Aen*)

**Date:** 2026-06-16 · **Status:** design approved (PO), pre-implementation

## Problem

Deployed teams run in containers whose startup behaviour (what executes on
rebuild) and persistent state must evolve over time — add a supervised courier,
persist a key, change a config. Today each change is hand-engineered per team and
per substrate (FR shipped a Windows Scheduled Task courier; apex now wants the
container analog; hr-devs is a third). This does not scale: every deployment is a
bespoke maintenance burden on FR, and "what runs in this container" lives as tribal
knowledge rather than a reviewable, version-controlled decision.

The mechanism to fix this **already exists**: each deployed team versions its own
container setup in its own repo. What is missing is a **formalized, repeatable
procedure** so every team evolves its deployment in the *same thin pattern* — keeping
FR's review/maintenance cost flat as the team count grows.

This is a research-team deliverable: a protocol + playbooks, not a product.

## Governing principle

**Teams own content; FR gates activation.** A team has full control over *what* its
container does — it edits its own repo freely. But the change only goes live through
an FR-reviewed, FR-executed rebuild. Control is real but never unilateral.

In Montesquieu's terms (Monte): the team is **legislative** (proposes the change in
its repo), FR is **judicial** (reviews against a standing checklist) and **executive**
(performs the rebuild in an agreed window). No branch acts alone.

## Scope / non-goals

**In scope:** the repo convention ("deploy surface"), the change→rebuild request/
response flow, the review checklist, the coordinated-rebuild execution playbook, and
the authority model. Apex's courier-bake is implemented as reference instance #1.

**Out of scope:** a framework-run supervisor or a mandated manifest/agent runtime
(rejected for excess specificity — the convention stays thin); changes to the
stationmaster hub/courier protocol itself; non-container deployments (the same
principle may later extend to them, but this spec targets containers).

## Component 1 — The deploy surface (repo convention)

Each deployed team keeps a thin, *predictable* surface at a standard location in its
own repo: `deploy/`.

- **Dockerfile** pins a **stable entrypoint path** (e.g. `deploy/startup`). The path
  is constant; the Dockerfile rarely changes.
- **Startup payload** at that stable path — the versioned, mutable "what runs on
  container start." This is what teams edit. Its internal form is the team's business
  (a script that launches their processes); the framework only requires it be
  idempotent and safe to run on every (re)start.
- **`deploy/MANIFEST.md`** — one page, the only structured artifact the framework
  mandates. It declares:
  1. **Startup units** — what runs on start (human-readable list; long-running units
     noted, since each needs supervision + single-instance discipline).
  2. **Persistent paths** — every path the deployment depends on surviving a rebuild,
     each tagged **generate-able** (regenerate-if-absent on a persistent volume) or
     **stateful** (restore/preserve, *never* reset). This is the S52 ephemeral-home
     discipline baked into the convention — it is the single highest-leverage field,
     because mis-tagging a stateful path as generate-able is how a rebuild silently
     wipes config (the `.claude.json` class of bug).
  3. **Maintenance contact** — the team PO / who to coordinate the window with.

"Minimal specificity" means exactly this: stable path + versioned payload + one-page
manifest. Everything else is the team's own concern.

## Component 2 — Change → rebuild-request flow

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

## Component 3 — Review (standing checklist)

FR reviews the PR diff against a fixed checklist, approving or requesting changes *on
the PR* (normal review loop):

- **Startup-execution safety** — what new code runs on boot; no secrets committed to
  the repo; no destructive operations against persistent data.
- **Persistence correctness** — every dependency path is declared in MANIFEST.md and
  correctly tagged generate-able vs stateful; generate-able paths regenerate cleanly
  if absent; stateful paths are restored/preserved, never reset.
- **Ordering traps** — any stateful artifact that a rebuild would wipe unless a
  preservation step runs first (the `.claude.json`-wipe class). The required ordering
  is explicit in the PR.
- **Supervision & single-instance** — every long-running unit is supervised
  (restart-on-exit), captures stdout/stderr reliably (not to a dead pty), and is
  guarded against duplicate instances (lock + pre-clean of a dead predecessor).

## Component 4 — Coordinated rebuild (gated playbook)

After the PR is approved and merged, FR (Hopper, operator) executes the rebuild. The
gates generalize the S52 apex-hardening discipline:

1. **Gates (all must hold):** route to the container confirmed · FR PO go · window
   agreed with the team · target quiescent (team idle, no in-flight work).
2. **Execute** the rebuild.
3. **Verify** — declared startup units are up; every persistent path survived (spot-
   check stateful paths especially); container identity stable (e.g. SSH host key
   unchanged); a real end-to-end check where possible (e.g. courier round-trip).
4. **Report** outcome to the team and PO.
5. **Rollback** — if verification fails, the previous image/tag is the rollback target;
   define it before executing.

## Reference instance #1 — apex courier-bake

Validates the protocol end to end. apex (Eesti-Raudtee/apex-migration-research)
already supplied its courier runtime expectations, which map directly onto the
manifest:

- **Startup unit:** `python3 stationmaster-courier.reference.py --config courier.json`
  (long-running, supervised, restart-on-exit; `--ping` usable for health checks).
- **Persistent paths:** SSH key `~/.ssh/stationmaster_apex` (stateful — provision at
  build / preserve), known-hosts file (stateful), `courier.json` (generate-able from
  repo — static config), `{state_dir}/courier.lock` (generate-able; pre-clean dead
  predecessor on restart).
- **Ordering trap:** `.claude.json` persist fix must precede the rebuild.
- **Sequence:** PR #165 (existing hardening) merges first → PR #166 (courier-bake,
  authored under this protocol) → rebuild. All after the `.claude.json` persist fix.

## Deliverables

1. **CCR protocol doc** — the procedure, the `deploy/` convention, and the hub
   `rebuild-request` message shape (Components 1–2). Owner: Herald (protocol) with
   Monte (authority model).
2. **Review-checklist playbook** — Component 3 as a runnable checklist. Owner: Brunel
   (container/persistence) + Monte.
3. **Rebuild-execution playbook** — Component 4 with the gates. Owner: Hopper.
4. **apex reference instance** — PR #166 against apex's repo, produced by following
   the protocol. Owner: Brunel (authoring) + Hopper (rebuild), PO-gated.

## Open questions

- Where the canonical CCR docs live (a new `topics/NN-deployment-lifecycle.md` vs the
  `playbooks/` dir). Resolve at planning time.
- Whether `MANIFEST.md` should later harden into a typed/parseable form once several
  teams have adopted it (deferred — keep it human-readable until reuse proves the
  shape, per "minimal specificity").
