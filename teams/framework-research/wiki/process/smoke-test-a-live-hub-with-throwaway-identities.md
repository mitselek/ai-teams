---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-28
status: active
confidence: medium
source-files:
  - teams/framework-research/docs/evr-island-hub-formation-spec-2026-08-27.md
  - designs/deployed/stationmaster/stationmaster-hub-deployment-runbook.md
source-commits: []
source-issues: []
related:
  - ../gotchas/hub-without-fail-loud-fsync-can-false-accept.md
  - ../decisions/stationmaster-post-office-model.md
  - ../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
  - ../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md
---

# Smoke-Test a Live Hub With Throwaway Identities, and Revoke Them Only After the Test Passes

**Process pattern (cross-team, medium confidence -- an operational recommendation, not a substrate fact).**

When smoke-testing a service instance that **already carries live registrations**:

1. **Register throwaway identities.**
2. **Exercise the full path with those** -- deposit, collect, ack.
3. **Revoke them only after the test passes.**

**Do not test with the real teams' identities.** The obvious shortcut -- *"apex is already registered, deposit to apex"* -- puts a production customer's registration inside the blast radius of a test whose whole purpose is to discover whether the instance works.

## The invariant that protects existing customers is fingerprint-based

This is why the discipline is cheap rather than merely cautious. A registration is **bound to a key fingerprint** -- apex-research's is bound to `SHA256:CNcF...13U`. **A smoke test that never touches that binding cannot disturb it**, no matter what else it does wrong.

So the rule is not *"be careful near production"*, which is unactionable. It is: **identify the binding that carries existing customers, and design the test so it never appears in the test's write set.** The throwaway identity is the mechanism for that; the fingerprint binding is the reason it works.

## Revoke-after, not revoke-before

The ordering is load-bearing and easy to get backwards. Revoking the throwaway identity *before* confirming the test passed leaves you unable to distinguish **"the test failed"** from **"the identity was already gone"** -- a negative result underdetermined between two causes, per [`../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md`](../gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md). Keep the identity until the pass is in hand, then revoke as a separate step with its own confirmation.

## Scope and confidence

**Medium, held deliberately.** This is one operator's recommendation from one hub formation (the EVR island, 2026-08-27), not a measured finding. The fingerprint-binding argument is verifiable and strong; the ordering discipline is judgment. **Path to `high`:** a second hub formation that follows it, or one incident where testing with a live identity disturbed a real registration.

**Say which hub.** There are two stationmaster instances and they are separate islands -- see [`../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md`](../gotchas/singular-convention-plural-instances-enumerate-from-the-registry.md) and [`../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md`](../decisions/two-islands-by-design-hub-topology-follows-network-boundary.md).

## Filing note

Split from [`../gotchas/hub-without-fail-loud-fsync-can-false-accept.md`](../gotchas/hub-without-fail-loud-fsync-can-false-accept.md) at the submitter's own offer. That half is a substrate defect with a substrate revision trigger and is urgent; this half is a process pattern whose trigger is a change in how registrations are bound, and is not. Two entries rather than one, cross-linked.

The runbook (`designs/deployed/stationmaster/stationmaster-hub-deployment-runbook.md`) was rewritten in place around the deployed reality of **both** instances, with a closed-questions ledger.

(*FR:Brunel* submitted; *FR:Callimachus* filed)
