# Hopper First-Spawn Protocol

**Audience:** Aen (team-lead), Hopper-first-spawn, PO at review time
**Spec source:** Acceptance criterion #5 in `teams/framework-research/docs/operator-role-spec-2026-05-19.md` -- *"Operator's first-spawn protocol is documented (whether or not it's a dry-run)."*
**Decision:** **NO dry-run.** Standard FR specialist spawn-up shape.

---

## The decision and its rationale

The spec's Part E asked whether the Operator's first spawn should include a Tier R audit of all FR-deployed substrates before accepting any task. The answer is **no**. Three reasons:

1. **Time cost without value.** A pre-emptive audit of 10+ substrates would take meaningful clock-time and produce information the Operator has no dispatch to validate against. The audit's findings would land in Hopper's scratchpad as context-without-action -- exactly the kind of artifact that decays before it is consulted.
2. **Per-dispatch reading is the load-bearing discipline.** The substrate-respect rule is *read `designs/deployed/<team>/container/*` before executing against `<team>`*, not *read everything before existing*. The reading is dispatch-relevant; pre-emptive reading is anticipatory and de-couples the read from the operation it informs.
3. **Spawn-eager-volunteer anti-pattern.** FR has previously identified the failure mode where a newly-spawned specialist "demonstrates readiness" by volunteering work before dispatch. The dry-run audit recreates that pattern in audit-clothing. Hopper's first action should be the same as every FR specialist's: read context, send intro, declare ready, wait for dispatch.

The discipline is **per-dispatch read** -- Hopper reads the substrate's deployed-artifacts when a dispatch arrives for that substrate, not on spawn-up. This keeps the read coupled to the operation it informs and avoids the spawn-eager pattern.

---

## The first-spawn protocol (what actually happens)

When Hopper is spawned for the first time in a new session:

1. **Read carry-forward scratchpad.** `teams/framework-research/memory/hopper.md` if it exists. On the very first spawn (session-of-deploy), this file does not exist yet; subsequent sessions carry forward prior `[LEARNED]` and `[GOTCHA]` tags.
2. **Read `common-prompt.md` and `startup.md`.** Standard FR specialist reads -- team-wide rules, communication conventions, structural-change discipline.
3. **Read own prompt** (`prompts/hopper.md`). This is what tells Hopper she's the Operator with R/M/D discrimination and naval-rank sanction discipline.
4. **Read `~/bin/rc-deployments.json`** once at spawn to load the deployment registry into context. This is connection-detail awareness (which substrates exist, on which hosts, via which SSH shape) -- NOT a substrate audit. No SSH connections are made; no `docker ps` is run; no commands touch the deployed substrates.
5. **Send intro to Aen** (team-lead). Standard FR specialist intro: confirm spawn, acknowledge any in-flight dispatches if the task substrate shows pending work for Hopper, declare ready.
6. **Wait for dispatch.** Do not originate operational work. The Operator never self-tasks.

When a dispatch arrives (step 7+):

7. **Validate dispatch shape.** Tier classification present? For Tier D, all three sanction components (exact command + reason + expected outcome) present and verbatim? If incomplete, return `[SANCTION-INCOMPLETE]` template and wait for completion.
8. **Read the substrate's deployed-artifacts.** This is the per-dispatch discipline. `designs/deployed/<team>/container/*` for the substrate-target. If absent on disk, surface the gap to the tasker; do not refuse.
9. **Validate tier classification** against the deployed-artifacts read. If disagrees, surface back; do not silently re-classify.
10. **Execute** per the Within-Dispatch Agency rules in `prompts/hopper.md`.
11. **Log verbatim** in the operations log at `teams/framework-research/docs/operations-log-<YYYY-MM>.md`.
12. **Report** to the tasker (and CC per the Pairing section in the prompt).

The transition from spawn-up (steps 1-6) to dispatch-handling (steps 7-12) is event-driven -- Hopper waits for the dispatch and reads the deployed-artifacts when the dispatch arrives, not pre-emptively.

---

## What the first-spawn protocol explicitly does NOT include

- **No substrate audit.** No `docker ps` across all hosts, no listing of running containers, no inventory check.
- **No SSH connections at spawn-up.** Connection details are loaded as context; the connections themselves are made when a dispatch requires them.
- **No deployed-artifacts pre-read.** `designs/deployed/<team>/container/*` is read per-dispatch when `<team>` is the substrate-target, not pre-emptively for all teams.
- **No "readiness demonstration."** The intro to Aen says "ready," not "here's an audit of every substrate I'm prepared to operate on." The readiness is in the prompt and the role definition; demonstrating it is the spawn-eager-volunteer anti-pattern.

---

## When this protocol changes

If post-deployment Hopper encounters a class of dispatch where pre-read of *adjacent* substrates is load-bearing (e.g., a multi-substrate operation requires coordinated knowledge of two or three substrates' artifacts before any one operation is safe to dispatch), then a per-class pre-read may be warranted. That is **post-deployment learning**, not a first-spawn protocol change. The current discipline is per-dispatch per-substrate; future-Hopper can propose extensions if the operational reality requires them.

(*FR:Celes*)
