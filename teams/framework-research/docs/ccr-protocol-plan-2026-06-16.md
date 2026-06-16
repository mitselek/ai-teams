# CCR Protocol Implementation Plan (*FR:Aen*)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the four CCR (Coordinated Container Rebuild) deliverables so any deployed team can evolve its container startup/persistence under FR review + a windowed rebuild, following one repeatable pattern.

**Architecture:** Three design docs + one typed-contract code artifact. The protocol doc is the canonical framework design; two playbooks make the review and rebuild steps runnable; `t10-ccr-contracts.ts` + a validator make the manifest mechanically checkable. Source of truth: `docs/ccr-protocol-spec-2026-06-16.md` (spec v2, approved).

**Tech Stack:** Markdown (docs), TypeScript strict (typed contracts + validator), `node:test` via `tsx` (validator tests). No new runtime deps.

**Owners:** Herald (protocol/messages), Monte (governance/review), Brunel (deploy-surface/manifest), Hopper (rebuild execution). Team-lead reviews + closes each task.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `topics/09-deployment-lifecycle.md` | Canonical CCR protocol: principle, deploy-surface convention, change→rebuild flow, authority model | 1 |
| `types/t10-ccr-contracts.ts` | Typed contracts: `CcrManifest` (frontmatter) + `RebuildReport` | 2 |
| `teams/framework-research/poc/ccr/validate-manifest.ts` | Pure validator over a parsed manifest object (returns error strings) | 2 |
| `teams/framework-research/poc/ccr/validate-manifest.test.ts` | Tests for the validator | 2 |
| `teams/framework-research/playbooks/ccr-review-checklist.md` | Runnable review checklist (Component 3), invokes the validator | 3 |
| `teams/framework-research/playbooks/ccr-rebuild-execution.md` | Gated rebuild playbook (Component 4): tiers, gates, tag-before-rebuild, REBUILD-REPORT verify, rollback, agent-session launch | 4 |
| `topics/CLAUDE.md`, `teams/framework-research/playbooks/` index, `docs/ccr-protocol-spec-2026-06-16.md` | Cross-references + signposts | 5 |

Tasks 1, 3, 4 are independent doc-authoring and may run in parallel (separate files). Task 2 (code) is independent of the docs. Task 3 references the validator from Task 2 (do Task 2 before Task 3's validator-invocation step, or stub the command and fill once Task 2 lands). Task 5 is last (wires everything).

---

## Task 1: Protocol doc — `topics/09-deployment-lifecycle.md`

**Owner:** Herald (protocol) + Monte (authority model section).

**Files:**
- Create: `topics/09-deployment-lifecycle.md`

- [ ] **Step 1: Author the doc with these exact sections**

Pull content from the spec (`docs/ccr-protocol-spec-2026-06-16.md`). The doc MUST contain:

1. **Purpose & principle** — "teams own content; FR gates activation." State Monte's legislative (team proposes in repo) / judicial (FR reviews) / executive (FR rebuilds in window) split.
2. **Deploy-surface convention** — the `deploy/` surface: Dockerfile pins a *stable entrypoint path*; existing files are NOT relocated; the versioned startup payload at that path; and `deploy/MANIFEST.md` with YAML frontmatter validated against `deploy/manifest.ts` (a vendored copy of the canonical `types/t10-ccr-contracts.ts`). Enumerate frontmatter fields: `schema_version`, `startup_units[]` (`name`, `command`, `long_running`), `persistent_paths[]` (`path`, `kind: generate-able|stateful`), `maintenance_contact`. State the ownership split (FR=bootstrap, team=startup units).
3. **Change→rebuild-request flow** — team opens a PR on its own repo; sends FR the hub `rebuild-request` message. Include the exact shape:
   ```json
   {"seq": "<TEAM>-<n>-REBUILD", "repo": "<org/repo>", "pr": <number>,
    "summary": "<one line>", "urgency": "routine|soon|urgent",
    "requested_window": "<proposed time or 'flexible'>"}
   ```
4. **Pointers** — review steps → `playbooks/ccr-review-checklist.md`; rebuild steps → `playbooks/ccr-rebuild-execution.md`; typed contracts → `types/t10-ccr-contracts.ts`.

Sign sections `(*FR:Herald*)` / `(*FR:Monte*)` per author. Cross-link the spec at top: "Derived from `docs/ccr-protocol-spec-2026-06-16.md`."

- [ ] **Step 2: Acceptance check**

Verify every spec Component (1 deploy-surface, 2 flow, governing principle, scope) maps to a section here. Verify the `rebuild-request` JSON matches the spec verbatim. Verify frontmatter field names match `types/t10-ccr-contracts.ts` from Task 2 exactly (`schema_version`, `startup_units`, `persistent_paths`, `maintenance_contact`, `kind` values `generate-able`/`stateful`).

- [ ] **Step 3: Commit**

```bash
git add topics/09-deployment-lifecycle.md
git commit -m "docs(fr): CCR protocol — topics/09 deployment-lifecycle (Component 1-2 + authority)"
```

---

## Task 2: Typed contracts + validator — `types/t10-ccr-contracts.ts` + validator

**Owner:** Brunel (manifest) + Herald (report shape).

**Files:**
- Create: `types/t10-ccr-contracts.ts`
- Create: `teams/framework-research/poc/ccr/validate-manifest.ts`
- Test: `teams/framework-research/poc/ccr/validate-manifest.test.ts`

- [ ] **Step 1: Write the typed contracts**

Create `types/t10-ccr-contracts.ts`:

```ts
// CCR (Coordinated Container Rebuild) typed contracts.
// Versioned per playbooks/version-typed-contract.md. See topics/09-deployment-lifecycle.md.
// (*FR:Brunel*)

export const CCR_CONTRACT_VERSION = "1.0.0";

export type PersistKind = "generate-able" | "stateful";

export interface StartupUnit {
  name: string;
  command: string;
  long_running: boolean;
}

export interface PersistentPath {
  path: string;
  kind: PersistKind;
}

export interface CcrManifest {
  schema_version: string; // major must match CCR_CONTRACT_VERSION's major
  startup_units: StartupUnit[];
  persistent_paths: PersistentPath[];
  maintenance_contact: string;
}

export type RebuildTrigger = "rebuild" | "restart" | "unknown";
export type CheckResult = "pass" | "warn" | "fail";
export type RebuildStatus = "OPERATIONAL" | "DEGRADED" | "FAILED";

export interface UnitCheck { name: string; result: CheckResult; detail?: string; }
export interface PathCheck { path: string; kind: PersistKind; survived: boolean; result: CheckResult; }

export interface RebuildReport {
  team: string;
  timestamp: string;        // ISO 8601
  trigger: RebuildTrigger;
  image: string;            // tag@digest
  deploy_commit: string;    // git SHA of the deploy surface
  pr?: number;
  schema_version: string;
  unit_checks: UnitCheck[];
  path_checks: PathCheck[];
  identity_stable: boolean; // e.g. SSH host key unchanged
  e2e_ok?: boolean;         // e.g. courier round-trip
  status: RebuildStatus;
}
```

- [ ] **Step 2: Write the failing test**

Create `teams/framework-research/poc/ccr/validate-manifest.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { validateManifest } from "./validate-manifest.ts";

const valid = {
  schema_version: "1.0.0",
  startup_units: [
    { name: "courier", command: "python3 stationmaster-courier.reference.py --config courier.json", long_running: true },
  ],
  persistent_paths: [
    { path: "~/.ssh/stationmaster_apex", kind: "stateful" },
    { path: "courier.json", kind: "generate-able" },
  ],
  maintenance_contact: "apex PO",
};

test("valid manifest yields no errors", () => {
  assert.deepEqual(validateManifest(valid), []);
});

test("missing maintenance_contact is rejected", () => {
  const m: any = { ...valid }; delete m.maintenance_contact;
  assert.ok(validateManifest(m).some((e) => e.includes("maintenance_contact")));
});

test("bad persist kind is rejected", () => {
  const m = { ...valid, persistent_paths: [{ path: "x", kind: "ephemeral" }] };
  assert.ok(validateManifest(m).some((e) => e.includes("kind")));
});

test("non-object input is rejected", () => {
  assert.deepEqual(validateManifest(null), ["manifest is not an object"]);
});

test("startup_unit missing long_running is rejected", () => {
  const m = { ...valid, startup_units: [{ name: "x", command: "y" }] };
  assert.ok(validateManifest(m).some((e) => e.includes("long_running")));
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npx tsx --test teams/framework-research/poc/ccr/validate-manifest.test.ts`
Expected: FAIL — `Cannot find module './validate-manifest.ts'`.

- [ ] **Step 4: Write the minimal validator**

Create `teams/framework-research/poc/ccr/validate-manifest.ts`:

```ts
// Pure validator for a parsed CCR manifest object. Returns a list of human-readable
// error strings (empty = valid). YAML/frontmatter parsing is the caller's job; this
// keeps the core logic dependency-free and unit-testable. (*FR:Brunel*)
import type { PersistKind } from "../../../../types/t10-ccr-contracts.ts";

const KINDS: PersistKind[] = ["generate-able", "stateful"];

export function validateManifest(input: unknown): string[] {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) return ["manifest is not an object"];
  const m = input as Record<string, unknown>;

  if (typeof m.schema_version !== "string") errors.push("schema_version: missing or not a string");
  if (typeof m.maintenance_contact !== "string" || (m.maintenance_contact as string).trim() === "")
    errors.push("maintenance_contact: missing or empty");

  if (!Array.isArray(m.startup_units)) {
    errors.push("startup_units: missing or not an array");
  } else {
    m.startup_units.forEach((u, i) => {
      const uu = u as Record<string, unknown>;
      if (typeof uu?.name !== "string") errors.push(`startup_units[${i}].name: missing or not a string`);
      if (typeof uu?.command !== "string") errors.push(`startup_units[${i}].command: missing or not a string`);
      if (typeof uu?.long_running !== "boolean") errors.push(`startup_units[${i}].long_running: missing or not a boolean`);
    });
  }

  if (!Array.isArray(m.persistent_paths)) {
    errors.push("persistent_paths: missing or not an array");
  } else {
    m.persistent_paths.forEach((p, i) => {
      const pp = p as Record<string, unknown>;
      if (typeof pp?.path !== "string") errors.push(`persistent_paths[${i}].path: missing or not a string`);
      if (!KINDS.includes(pp?.kind as PersistKind))
        errors.push(`persistent_paths[${i}].kind: must be 'generate-able' or 'stateful'`);
    });
  }

  return errors;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx --test teams/framework-research/poc/ccr/validate-manifest.test.ts`
Expected: PASS — 5 tests pass. (If `tsx` is absent at repo root, run from `comms-dev/` which has it, or `npm i -D tsx` in `poc/ccr/`.)

- [ ] **Step 6: Commit**

```bash
git add types/t10-ccr-contracts.ts teams/framework-research/poc/ccr/
git commit -m "feat(fr): CCR typed contracts (manifest + rebuild-report) + manifest validator (TDD)"
```

---

## Task 3: Review-checklist playbook — `playbooks/ccr-review-checklist.md`

**Owner:** Monte + Brunel.

**Files:**
- Create: `teams/framework-research/playbooks/ccr-review-checklist.md`

- [ ] **Step 1: Author the checklist**

A runnable checklist a reviewer works top to bottom on a CCR PR. MUST contain, each item phrased as a concrete check with how-to-verify:

1. **Manifest validity** — run the validator: `npx tsx teams/framework-research/poc/ccr/validate-manifest.ts <path-to-parsed-frontmatter>` (or feed the PR's `deploy/MANIFEST.md` frontmatter); zero errors required.
2. **Startup-execution safety** — read the diff of the startup payload: what new code runs on boot? No secrets committed; no destructive ops on persistent data.
3. **Persistence correctness** — every dependency path appears in `persistent_paths` and is correctly tagged; `generate-able` paths regenerate cleanly if absent; `stateful` paths are restored/preserved, never reset.
4. **Ordering traps** — any `stateful` artifact a rebuild would wipe unless a preserve step runs first (the `.claude.json`-wipe class); the required ordering is explicit in the PR.
5. **Supervision & single-instance** — every `long_running: true` unit is supervised (restart-on-exit, shell trap-loop recommended), captures stdout to a file/journal (not a bare pty), and is single-instance-guarded (lock + dead-predecessor pre-clean).
6. **Risk-tier assignment** — set tier from the `persistent_paths` diff: any `stateful`/volume/secret change ⇒ high-risk; otherwise low-risk. Record the tier on the PR (drives the rebuild gates).

End with: approve, or request-changes on the PR. Sign `(*FR:Monte*)`.

- [ ] **Step 2: Acceptance check**

Verify items 2-5 map 1:1 to spec Component 3 bullets; item 1 invokes the Task 2 validator; item 6 matches Component 4's risk-tier discriminator.

- [ ] **Step 3: Commit**

```bash
git add teams/framework-research/playbooks/ccr-review-checklist.md
git commit -m "docs(fr): CCR review-checklist playbook (Component 3)"
```

---

## Task 4: Rebuild-execution playbook — `playbooks/ccr-rebuild-execution.md`

**Owner:** Hopper.

**Files:**
- Create: `teams/framework-research/playbooks/ccr-rebuild-execution.md`

- [ ] **Step 1: Author the playbook**

The operator's runbook, executed after a CCR PR is approved + merged. MUST contain:

1. **Risk tier → gate weight** — *Low-risk* (supervised-unit add, no volume/persistence/secret change): light gate (FR review approval + brief agreed window; quiescence required). *High-risk* (volume/persistence/secret): full gates (route confirmed · FR PO go · window agreed · quiescence).
2. **Tag before rebuild** — always create a rollback target: `docker tag <img>:latest <img>:pre-<YYYYMMDD-HHMM>`.
3. **Execute** the rebuild.
4. **Verify via the manifest-derived REBUILD-REPORT** — the startup payload emits a `RebuildReport` (shape in `types/t10-ccr-contracts.ts`) on every start, generated FROM the manifest: one `unit_checks` entry per `startup_units`, one `path_checks` entry per `persistent_paths` (stateful = critical), plus `identity_stable` and `e2e_ok`. The report MUST be deterministic (shell/python), independent of any LLM/Claude session. `status`: any stateful `path_check.survived=false` ⇒ FAILED (rollback); warn-only ⇒ DEGRADED; else OPERATIONAL.
5. **Rollback** — on FAILED, `docker tag <img>:pre-<...> <img>:latest` and restart; confirm via a fresh REBUILD-REPORT.
6. **Agent-session launch (PO attach), if the deploy bakes one** — use the VERIFIED CLI facts (do not regress to docs):
   - `--prompt` is invalid; `-p`/`--print` is headless (prints + EXITS).
   - `claude "<prompt>"` (positional) starts INTERACTIVE, pre-seeded, and STAYS interactive — the way to launch a PO-attachable pre-seeded session.
   - Unattended tool execution: `--permission-mode dontAsk --allowedTools "Agent,Bash,Read,Edit,Write,..."` (no hang; `bypassPermissions` refuses root and is less safe).
   - Default session is fresh; do NOT pass `--continue`/`--resume` in the entrypoint.
   - TTY via tmux; trap SIGTERM + `wait` in the entrypoint (else docker stop hard-kills at 30s); route stdout to a file/journal, never a bare pty.
   - Alternative (recommended for attach-only): hr-devs lazy-SSH pattern — `.bashrc` gated on `$SSH_CONNECTION` create-or-attaches a tmux session + `tmux send-keys "claude"` (human present ⇒ no permission issue). Ref `designs/new/hr-devs/container/entrypoint-hr-devs.sh`.

Sign `(*FR:Hopper*)`.

- [ ] **Step 2: Acceptance check**

Verify items 1-5 map to spec Component 4 (tiers, tag-before-rebuild, REBUILD-REPORT incl. deterministic requirement, rollback). Verify item 6's CLI facts match the scratchpad "VERIFIED CLI launch facts" (2026-06-16) exactly. Verify the `RebuildReport` field names match `types/t10-ccr-contracts.ts`.

- [ ] **Step 3: Commit**

```bash
git add teams/framework-research/playbooks/ccr-rebuild-execution.md
git commit -m "docs(fr): CCR rebuild-execution playbook (Component 4 + verified launch mechanics)"
```

---

## Task 5: Wire-up & signposts

**Owner:** team-lead.

**Files:**
- Modify: `docs/ccr-protocol-spec-2026-06-16.md` (resolve the two open questions now that they're decided)
- Modify: `docs/CLAUDE.md` (add the playbooks + protocol to the signpost if appropriate) and `topics/` index if one exists

- [ ] **Step 1: Resolve spec open questions**

In `docs/ccr-protocol-spec-2026-06-16.md`, update the "Open questions" section: canonical schema lives at `types/t10-ccr-contracts.ts` (teams vendor a copy as `deploy/manifest.ts`, version-pinned); docs location resolved to `topics/09-deployment-lifecycle.md` + `playbooks/`.

- [ ] **Step 2: Add signposts**

Add `topics/09-deployment-lifecycle.md` to any topics index; add the two playbooks under the playbooks listing; cross-link the protocol doc ↔ spec ↔ playbooks ↔ types.

- [ ] **Step 3: Commit**

```bash
git add docs/ccr-protocol-spec-2026-06-16.md docs/CLAUDE.md topics/
git commit -m "docs(fr): CCR wire-up — resolve open questions, add signposts + cross-refs"
```

---

## Self-Review

- **Spec coverage:** Component 1 (deploy surface) → Task 1 §2 + Task 2 (manifest types/validator). Component 2 (flow) → Task 1 §3. Component 3 (review) → Task 3. Component 4 (rebuild + REBUILD-REPORT + rollback + launch) → Task 4 + Task 2 (RebuildReport type). Governing principle/authority → Task 1 §1. Reference instance #1 (apex) is DEFERRED — intentionally NOT in this plan (stands up after the protocol lands). Covered.
- **Placeholder scan:** no TBD/TODO; all code shown in full; doc tasks enumerate exact required content.
- **Type consistency:** field names `schema_version`, `startup_units`, `persistent_paths`, `maintenance_contact`, `kind` (`generate-able`/`stateful`), and `RebuildReport` fields are used identically across Tasks 1, 2, 3, 4.
