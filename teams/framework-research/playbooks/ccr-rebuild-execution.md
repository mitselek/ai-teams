# CCR Rebuild-Execution Playbook

Companion to topics/11-deployment-lifecycle.md (CCR protocol), Component 4.

The operator's runbook for the **executive** step of CCR: what FR (Hopper, operator)
does AFTER a CCR PR is approved and merged to take the change live. The review
checklist (`ccr-review-checklist.md`, Component 3) has already passed and has
recorded a **risk tier** on the PR -- that tier is the single input that sets how
heavy the gates below are. Work this playbook top-to-bottom.

The reviewable unit was the PR diff; the unit here is the running container. The
hub `rebuild-request` message was coordination only -- the merged PR is the
contract being deployed.

---

## 1. Risk tier -> gate weight

The review checklist assigned the tier from the MANIFEST `persistent_paths` diff
(plus any secret/volume wiring). Touching a stateful path, a volume, or a secret
forces high-risk. Apply the matching gate -- these MUST match the review
checklist's discriminator exactly.

### Low-risk -- light gate

Trigger: adds/edits a **supervised startup unit** only; **no** volume,
persistence-path, or secret change.

Gates before executing:
- **FR review approval** -- the PR is approved with the low-risk tier recorded.
- **Brief agreed window** -- a short window agreed with the team's
  `maintenance_contact`.
- **Quiescence** -- the container is idle (no in-flight work that the restart would
  truncate). Quiescence is required even at low risk.

### High-risk -- full gates

Trigger: any change touching a **volume**, a **persistence path** (especially a
`stateful` one), or a **secret**.

Gates before executing -- all four:
- **Route confirmed** -- the comms route to the team/PO is proven (round-trip
  verified) so the REBUILD-REPORT and any rollback can be coordinated live.
- **FR PO go** -- explicit go from the FR PO, not just review approval.
- **Window agreed** -- a rebuild window agreed with the team's
  `maintenance_contact`.
- **Quiescence** -- the container is idle before the rebuild.

Do not proceed until every gate for the assigned tier is satisfied.

## 2. Tag before rebuild (always create a rollback target)

Teams commonly build `:latest` with no prior tag, so a rollback target is not
guaranteed to exist. Before touching the running image, **always** tag the current
image so step 5 has something to roll back to:

```bash
docker tag <img>:latest <img>:pre-<YYYYMMDD-HHMM>
```

Record the `pre-<...>` tag you created -- it is the exact rollback target for this
rebuild. This step is unconditional; run it even for a low-risk rebuild.

## 3. Execute the rebuild

With the gates passed (step 1) and the rollback tag created (step 2), perform the
rebuild and bring the container back up, e.g.:

```bash
docker compose build <service>      # or: docker build -t <img>:latest .
docker compose up -d <service>      # or: docker stop / docker run ...
```

The startup payload runs on bring-up. Because it is idempotent and safe to run on
every (re)start, a plain restart and a full rebuild follow the same bring-up path
-- both emit a REBUILD-REPORT (step 4).

## 4. Verify via the manifest-derived REBUILD-REPORT

On **every container start** (rebuild, plain restart, or session-start), the
startup payload emits a structured `RebuildReport`. The report is generated **FROM
the MANIFEST** so it cannot drift from the contract: it walks the manifest's
declarations and produces one check per declared item.

**This report MUST be deterministic** -- pure shell/python, independent of any
LLM/Claude session. Health checks are mechanical; an LLM in the report path is
fragile (adjacent to the dead-pty failure class). Keep the report generator
separate from any attachable Claude session (step 6) -- the report must not depend
on an LLM session coming up.

Report shape is the `RebuildReport` interface in `types/t10-ccr-contracts.ts`.
Generate it as follows:

- **`unit_checks[]`** -- one `UnitCheck` per `startup_units` entry in the manifest.
  Verify the unit is up; set `result` to `pass | warn | fail` (`detail` optional).
- **`path_checks[]`** -- one `PathCheck` per `persistent_paths` entry. Set
  `survived` (did the path persist across the rebuild) and `kind` (carried from the
  manifest). **`kind: stateful` paths are the critical ones.**
- **`identity_stable`** (bool) -- container identity unchanged, e.g. SSH host key
  unchanged across the rebuild.
- **`e2e_ok`** (bool, optional) -- a real end-to-end check where possible, e.g. a
  courier round-trip.
- **Audit metadata** -- `team`, `timestamp` (ISO 8601), `trigger`, `image`
  (tag@digest), `deploy_commit` (git SHA of the deploy surface), `pr` (merged PR#,
  optional), `schema_version` (the `manifest.ts` contract version).

The **`trigger`** enum is `rebuild | restart | session-start | unknown` (the
`RebuildTrigger` type). Set it to what caused this start -- an FR-driven rebuild is
`rebuild`; a plain container restart is `restart`; a Claude session-start beacon is
`session-start`; fall back to `unknown` when the cause cannot be determined.

**`status`** (the `RebuildStatus`: `OPERATIONAL | DEGRADED | FAILED`) is derived
deterministically from the checks:
- Any `path_check` with `kind: stateful` and `survived = false` => **FAILED**
  (triggers rollback, step 5).
- Otherwise, any warn-only result (a `warn` check, no critical failure) =>
  **DEGRADED**.
- Otherwise => **OPERATIONAL**.

The startup payload sends the REBUILD-REPORT to FR over the hub. FR checks it
against the manifest and notifies the team + PO. Because it fires on every restart
(not just FR-driven rebuilds), it doubles as ongoing deployment health.

## 5. Rollback (on FAILED)

If the REBUILD-REPORT comes back **FAILED** (any stateful `path_check.survived =
false`), roll back to the image tagged in step 2 and restart:

```bash
docker tag <img>:pre-<YYYYMMDD-HHMM> <img>:latest
docker compose up -d <service>      # or: docker stop / docker run ...
```

Then **confirm recovery via a fresh REBUILD-REPORT** -- the rollback restart emits
its own report; verify its `status` is `OPERATIONAL` (or at least no FAILED
stateful path) before declaring the container recovered. Notify the team + PO of
the rollback and the failing check.

## 6. Agent-session launch (PO attach), if the deploy bakes one

Some deploys bake an attachable Claude session so the PO can attach to the
container and work interactively. This is a **separate concern** from the
deterministic REBUILD-REPORT (step 4): the report must not depend on this session
coming up. Use these EMPIRICALLY VERIFIED Claude-CLI facts (do NOT contradict them
with documentation):

- `--prompt` is INVALID; `-p`/`--print` is headless (prints then EXITS) -- not for
  standby.
- `claude "<prompt>"` (POSITIONAL arg) starts INTERACTIVE, pre-seeded with that
  prompt, and STAYS interactive -- this is how to launch a PO-attachable pre-seeded
  session.
- Unattended tool execution: `--permission-mode dontAsk --allowedTools
  "Agent,Bash,Read,Edit,Write,..."` runs tools without hanging on prompts.
  (`bypassPermissions` exists but refuses to run as root and is less safe; prefer
  dontAsk.)
- Fresh session is the DEFAULT -- do NOT pass `--continue`/`--resume` in the
  entrypoint, or a restart resumes the old conversation.
- TTY via tmux; trap SIGTERM + `wait` in the entrypoint (else `docker stop`
  hard-kills at 30s); route stdout to a file/journal, never a bare pty.
- Recommended for attach-only: the hr-devs lazy-SSH pattern -- the entrypoint
  injects a `.bashrc` block gated on `$SSH_CONNECTION` that create-or-attaches a
  tmux session and `tmux send-keys "claude"` on the PO's SSH login (Claude starts
  only when a human is present, so permission prompts are never an issue).
  Reference: designs/new/hr-devs/container/entrypoint-hr-devs.sh.

**Architectural note:** keep the deterministic REBUILD-REPORT (step 4) SEPARATE
from any attachable Claude session -- the report must not depend on an LLM session
coming up.

(*FR:Hopper*)
