# CCR Review-Checklist Playbook

Companion to topics/11-deployment-lifecycle.md (CCR protocol), Component 3.

A runnable checklist FR works top-to-bottom on a CCR `rebuild-request` PR. Each item
is a concrete check with a how-to-verify. Work them in order; the result of item 6
(risk tier) feeds the rebuild-execution playbook's gates. When every item passes,
take the reviewer's action at the end: approve, or request-changes on the PR.

The reviewable unit is the PR diff. The hub `rebuild-request` message is coordination
only -- review the repo, not the message.

---

## 1. Manifest validity

**Check:** the PR's `deploy/MANIFEST.md` YAML frontmatter parses and passes the typed
validator with zero errors.

**How to verify:** parse the frontmatter to an object and run it through
`validateManifest` from `teams/framework-research/poc/ccr/validate-manifest.ts`. A
zero-length errors array is required to proceed. One-off invocation (run from repo
root; replace the inline object with the PR's parsed frontmatter, or read+parse the
file). Use a TEMP FILE, not `npx tsx -e '<inline>'` -- the inline-eval form silently
swallows relative-import errors on the Windows/tsx setup and exits 0 with no output,
which a reviewer can misread as a PASS (a dangerous false-green). A temp file surfaces
import failures and returns a real exit code:

```bash
cat > check-manifest.ts <<'TS'
import { validateManifest } from "./teams/framework-research/poc/ccr/validate-manifest.ts";
// Replace with the PR's parsed MANIFEST.md frontmatter:
const manifest = {
  schema_version: "1.0.0",
  startup_units: [
    { name: "courier", command: "python3 deploy/courier.py --config courier.json", long_running: true },
  ],
  persistent_paths: [
    { path: "~/.ssh/stationmaster_apex", kind: "stateful" },
    { path: "courier.json", kind: "generate-able" },
  ],
  maintenance_contact: "team PO",
};
const errors = validateManifest(manifest);
console.log(errors.length === 0 ? "VALID (0 errors)" : errors);
process.exit(errors.length === 0 ? 0 : 1);
TS
npx tsx check-manifest.ts && rm check-manifest.ts
```

To parse straight from the checked-out PR instead of pasting, read
`deploy/MANIFEST.md`, split off the `---`-fenced frontmatter, parse it with a YAML
library (e.g. `yaml`), and pass the result to `validateManifest`. Non-zero errors =>
request-changes; do not continue the checklist until the manifest is valid.

## 2. Startup-execution safety

**Check:** the new code that runs on boot is safe -- no secrets committed to the repo,
no destructive operations against persistent data.

**How to verify:** read the diff of the startup payload (the file at the Dockerfile's
stable entrypoint path, e.g. `deploy/startup`) and any unit `command` in the manifest.
For each new/changed unit, ask: what does it execute on every (re)start?
- Grep the diff for committed secrets (keys, tokens, passwords, `.env` bodies). Secrets
  belong in provisioned files / volume, never in the repo.
- Confirm no destructive op runs against persistent data on boot: no `rm -rf` of a
  stateful path, no DB drop/reset, no unconditional overwrite of restored state. The
  payload must be idempotent and safe to run on every restart.

## 3. Persistence correctness

**Check:** every dependency path the container needs is declared in `persistent_paths`
and correctly tagged; generate-able paths regenerate cleanly if absent; stateful paths
are restored/preserved and never reset.

**How to verify:** cross-read the startup payload diff against the manifest's
`persistent_paths`:
- Every path the payload reads/writes-and-must-survive appears in `persistent_paths`.
  A dependency path missing from the manifest is the failure mode this item catches.
- `kind: generate-able` => the path can be recreated from the repo/config if absent on
  the volume (e.g. a config rendered from committed source, a lock file). Verify the
  payload actually regenerates it rather than assuming it exists.
- `kind: stateful` => the path must be restored/preserved across rebuild and **never**
  reset (e.g. an SSH key, known-hosts, accumulated state). Verify the payload never
  truncates, recreates, or clears it. Mis-tagging a stateful path as generate-able is
  the `.claude.json`-class silent wipe -- treat any ambiguous tag as a request-changes.

## 4. Ordering traps

**Check:** any stateful artifact that a rebuild would wipe unless a preservation step
runs first (the `.claude.json`-wipe class) has its required ordering made explicit in
the PR.

**How to verify:** for each `stateful` path, ask: does the rebuild sequence touch this
before it is preserved/restored? If a preserve-then-rebuild ordering is required (e.g.
the `.claude.json` persist fix must land/run before the container is rebuilt), that
ordering must be stated explicitly in the PR -- in the MANIFEST body, the payload, or
the PR description -- not left implicit. An undocumented ordering dependency on a
stateful path => request-changes until the order is spelled out.

## 5. Supervision & single-instance

**Check:** every `startup_units` entry with `long_running: true` is supervised, captures
its output durably, and is single-instance-guarded.

**How to verify:** for each long-running unit, read its launch code in the payload diff:
- **Supervised / restart-on-exit:** it is wrapped so it restarts when it exits. The
  recommended pattern is the shell trap-loop proven in FR's courier and apex's
  entrypoint: `while true; do <unit>; sleep <backoff>; done`. s6/runit/supervisord are
  acceptable only if the PR justifies the added dependency.
- **Durable output:** stdout/stderr is captured to a file or journal, not left on a
  bare pty (the dead-pty failure class). Verify a redirect/log target exists.
- **Single-instance:** a lock guards against duplicate instances, and a dead predecessor
  is pre-cleaned on restart (clear a stale lock + reap the old process before relaunch).

Any long-running unit missing supervision, durable output, or the lock+pre-clean guard
=> request-changes.

## 6. Risk-tier assignment

**Check:** the PR is tagged with a risk tier derived from the `persistent_paths` diff,
matching the rebuild-execution playbook's discriminator.

**How to verify:** inspect the diff of `persistent_paths` (and any secret/volume wiring):
- Any change touching a **stateful** path, a volume, or a secret => **high-risk**
  (full gates in the rebuild playbook: route confirmed, FR PO go, window agreed,
  quiescence).
- Otherwise (adds/edits a supervised startup unit only, no volume/persistence/secret
  change) => **low-risk** (light gate: FR approval + a brief agreed window; quiescence
  still required).

Record the assigned tier on the PR (label or review comment). This is the same
discriminator the rebuild-execution playbook reads to set gate weight -- touching a
stateful path forces high-risk.

---

## Reviewer's action

When all six items pass, **approve** the PR (with the risk tier recorded) so the
rebuild-execution playbook can run its tier-appropriate gates. If any item fails,
**request-changes** on the PR, citing the failing item, and re-run the checklist after
the team pushes fixes.

(*FR:Monte*)
