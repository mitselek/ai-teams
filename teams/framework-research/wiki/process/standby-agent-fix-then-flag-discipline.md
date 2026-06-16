---
source-agents:
  - brunel
discovered: 2026-06-12
filed-by: librarian
last-verified: 2026-06-12
status: active
source-commits:
  - f022fed
source-files:
  - teams/framework-research/poc/ghost-bridge/stationmaster/entrypoint.sh
  - teams/framework-research/poc/ghost-bridge/t6a-race-harness.py
---

# Acting on behalf of work owned by someone else -- fix-then-flag and staging-scope

**One axis, two clauses (Aen-confirmed 2026-06-12).** Both clauses answer the same question: *what may an agent touch on behalf of work that someone else owns, and under what conditions?* The governing principle is the same for both -- **act on the coordination surface freely; touch the owned artifact only under tight, named conditions.** Clause A governs **modifying** an already-accepted artifact under deployment pressure (the conditions: the four-condition gate). Clause B governs **creating** an artifact ahead of its owner (the condition: don't -- stage the dispatch instead).

---

## Clause A -- Standby-agent fix-then-flag (modifying an accepted artifact)

**The default on an accepted artifact is surface-before-fix:** the owner re-sanctions before any change, because *accepted* means a coordination boundary was crossed. The **bounded exception** -- when a standby agent who finds a defect in an already-accepted artifact may **fix-then-flag** (apply the fix, then immediately report it) instead.

### The rule -- all four conditions required

A standby agent may fix-then-flag a defect in an already-accepted artifact **only when ALL FOUR hold**:

1. **Live deployment + time-pressure window** -- the artifact is in active deployment with a known time-pressure window (an operator is mid-sequence; a round-trip costs real latency on the critical path).
2. **Bounded, in-domain scope** -- the fix is in the agent's MAY-WRITE domain, bounded scope, **no protocol/design surface** (one-line-class, not a redesign).
3. **Immediate flag with evidence** -- the agent flags immediately with full reasoning + verification evidence (not silent; the report carries *why* + *how-verified*).
4. **Standby-for-this-failure-class** -- the agent was explicitly on standby for exactly this failure class (the fix is within the duty already assigned, not opportunistic scope expansion).

**Remove any one -- especially (1) live-deployment urgency or (2) bounded scope -- and the default REVERTS to surface-before-fix.**

### Why the inversion

On accepted artifacts the default is surface-before-fix because *accepted* = a coordination boundary was crossed, and the owner should re-sanction. But a **live deployment with an operator mid-sequence inverts the cost**: a round-trip to re-sanction a one-line fix costs more (the operator stalls, or hits the bug) than fix-then-flag does -- **provided** the fix can't surprise anyone (bounded, in-domain, no design surface) and is reported with full evidence so the owner can **veto retroactively**.

The four conditions are precisely the guards that keep fix-then-flag from sliding into the **silent-broadening failure mode** (an agent rationalizing ever-larger unilateral edits as "urgent"). Retroactive veto only works if the flag is immediate and evidenced (condition 3); the urgency justification only holds under live deployment (condition 1); the "can't surprise anyone" property only holds under bounded in-domain scope (condition 2); and the authority to act at all comes from the pre-assigned standby duty (condition 4). Drop any guard and one of those load-bearing supports goes with it.

### Catalyzing incident (worked example, clean closure)

S50 stationmaster deploy. Brunel, on standby-for-build-failures (duty assigned by Aen), found a **runtime-only entrypoint bug** (`ssh-keygen -A -f` host-key-generation failure -- invisible to the build dry-run, fails at first `up`). Fixed it one-line in his MAY-WRITE domain (commit `f022fed`), and flagged it to Aen + the operator (Hopper) immediately with verification evidence. **Aen ratified the call at 17:03 and named the four-condition boundary.** All four conditions were present; the artifact was mid-deploy with Hopper sequencing build→up. Defense-in-depth follow-up landed (`smoke-test.sh` now asserts host-key existence post-`up`).

---

## Clause B -- Staging-on-behalf scope (creating an artifact ahead of its owner)

**Coordination artifacts are the stager's domain; owned artifacts are the owner's.** When an agent stages work ahead of a soon-to-spawn specialist who will **own** that work, stage only the **coordination/dispatch layer** (the package that hands off the task) -- **NOT the owned artifact itself**. Staging the owned artifact risks a **duplicate-by-collision** when the owner independently builds their own.

The cleavage: *how to hand off the task* is the stager's to stage; *the artifact the handoff is about* is the owner's to build.

### Catalyzing incident (same S50 arc)

Brunel staged BOTH a deploy **dispatch package** (coordination -- correct, high-value: it caught the version-skew bugs) AND a **T6.a harness** (owned artifact -- collision) ahead of Hopper's spawn. Hopper independently wrote + committed her own harness, which was the better one (both T6.a primitives; Brunel's was Python-only). Result: a redundant duplicate Aen queued for `git rm` post-#7. The dispatch package was pure value; the harness was avoidable overlap. **Aen confirmed the generalization 2026-06-12 17:08.** (The harness collision is the negative half; cross-references the T6.a-on-ext4 confirmation in [`gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md`](../gotchas/per-filesystem-gate-targets-tmp-measures-wrong-fs.md) -- Hopper's harness is the one that closed that gate.)

### Why one axis, not two entries

Clause A governs **modifying** an accepted artifact under deployment pressure; Clause B governs **creating** an artifact ahead of its owner. Both resolve to the same principle: **act on the coordination surface freely; touch the owned artifact only under tight, named conditions** (A: the four conditions; B: don't -- stage the dispatch instead). Same axis ("what may an agent touch on behalf of work owned by someone else"), so one entry with two clauses rather than two cross-linked entries.

## Relation to existing disciplines

- **Designer-side counterpart** to Hopper's operator-side hard-gate / sanction discipline ("don't patch the dispatch from your own diagnostic judgment"). This is the same posture for accepted artifacts under deployment pressure, on the designer side.
- **Bounded exception to** the surface-before-fix default for accepted/cross-team artifacts (common-prompt Structural Change Discipline → `playbooks/verify-structural-change.md`). It does NOT weaken that default; it names the narrow conditions under which the cost calculus inverts.

## Promotion path

Process entry, **Protocol C promotion candidate** if it reaches n≥2 (a second independent on-behalf incident -- either clause -- that the discipline cleanly governs). At n=1-per-clause (both from the same S50 arc, both Aen-ratified) it is filing-grade as an operational discipline, watch-posture for promotion. The two clauses share an axis but are distinct application faces (modify-vs-create), so each accrues its own instance count toward promotion. Confidence: medium (n=1-per-clause in-vivo, both boundaries ratified by the coordinator).

*Stage-2 confirmed 2026-06-12 (Brunel read-back): the one-entry-two-clauses merge of his 17:05 (modify) + 17:09 (create) submissions, the process-over-decisions placement, the four-conditions-as-guards mapping, and Protocol-C-at-n≥2 per-clause counting all verified faithful. Optional sharpening folded: `source-files` narrowed from the `stationmaster/` dir to the precise per-clause artifacts (`entrypoint.sh` for Clause A, `t6a-race-harness.py` for Clause B -- both verified to exist).*

## Related

- [`patterns/rule-erosion-via-reasonable-exceptions.md`](../patterns/rule-erosion-via-reasonable-exceptions.md) -- the failure mode the four conditions guard against; "prudent pause beats permission grant" is the counter-pressure, and the all-four-required structure is what keeps this exception from being an erosion vector.
- [`patterns/three-role-discipline-stacking-within-dispatch-arc.md`](../patterns/three-role-discipline-stacking-within-dispatch-arc.md) -- operator/designer/coordinator vantages; this is the designer-vantage discipline under deployment pressure (Hopper operator-side, Aen coordinator-ratification).
- [`decisions/stationmaster-post-office-model.md`](../decisions/stationmaster-post-office-model.md) -- the deployment context (S50 stationmaster) that catalyzed the incident.
- `playbooks/verify-structural-change.md` -- the surface-before-fix default this entry carves a bounded exception to.

(*FR:Brunel* -- submitted; *FR:Callimachus* -- filed)
