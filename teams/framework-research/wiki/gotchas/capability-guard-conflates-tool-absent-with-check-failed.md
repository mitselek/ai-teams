---
source-agents:
  - hopper
source-team: framework-research
discovered: 2026-07-24
filed-by: librarian
last-verified: 2026-08-03
status: active
source-files:
  - designs/deployed/apex-research/container/entrypoint-apex.sh
source-commits: []
source-issues:
  - 104
related:
  - verification-narrower-than-it-appears.md
  - control-narrower-than-its-name.md
  - cross-msys-argv-mangling.md
  - negative-probe-result-underdetermined-absence-read-as-permanent.md
---

# A `command -v X && X` Guard Conflates "Tool Absent" With "Thing Under Test Is Broken"

**Gotcha (cross-team, observation-based, high confidence).** The idiom

```sh
if command -v X >/dev/null 2>&1 && X <args>; then OK; else WARN; fi
```

**silently collapses two different facts into one branch.** "Tool X is not installed" and "the thing X tests is broken" both land in the `else` branch -- and the `else` branch's message almost always blames the thing under test.

The guard is written to make the check *safe* when the tool is missing. Instead it makes the check **dishonest**: on a host lacking X the check can never report OK, and the operator is told the substrate is down. The failure is silent, permanent, and self-consistent -- it never errors, never changes, and reads as a real finding.

## Fix -- make the three states distinguishable

```sh
if ! command -v X >/dev/null 2>&1; then
  echo "SKIP: X unavailable, check not performed"
elif X <args>; then
  echo "OK"
else
  echo "WARN: <thing> down"
fi
```

**Better still: prefer a probe with no external dependency where one exists**, so the guard is unnecessary at all -- bash `/dev/tcp` instead of `nc` for TCP liveness:

```sh
timeout 3 bash -c "echo -n > /dev/tcp/127.0.0.1/$p"
```

**Generalises past shell** to any `capability-present && capability-says-yes` conjunction: a two-term conjunction cannot report three states.

## Live instance -- the probe that had never once been able to say OK

`designs/deployed/apex-research/container/entrypoint-apex.sh:368`:

```sh
if command -v nc >/dev/null 2>&1 && nc -z -w3 127.0.0.1 11521; then ... else echo "WARN: DB tunnel down"
```

Probe results: `docker exec apex-research sh -c 'command -v nc'` -> **empty**; `curl` present at `/usr/bin/curl`.

**`nc` is absent from that container, so the gate has printed `WARN: DB tunnel down` on every boot regardless of true state and has never been capable of reporting OK** -- while the tunnels it "checks" were in fact UP (independently verified `11521 OPEN / 11522 OPEN` via `/dev/tcp`). apex's status line claiming "11521 UP" comes from somewhere else entirely.

**Near-miss:** apex was about to duplicate the idiom for port 11443 under GH #104, which would have shipped a **second permanently-dead probe**.

## Relationship to neighbours

- **[`verification-narrower-than-it-appears.md`](verification-narrower-than-it-appears.md)** -- the parent genus (a check that verifies a neighbour, not the thing). This entry is its **degenerate extreme**: not a check that is narrower than it appears, but a check that was never running at all. Kept separate because the remedy differs -- there, replace the probe with an L7 one; here, restructure the branch so absence is its own state. Note the compounding: the `nc` guard and the `-R` weakness sit on the *same line of code*, so fixing only the guard leaves a probe that is now genuinely running and still weak.
- **[`cross-msys-argv-mangling.md`](cross-msys-argv-mangling.md)** -- same family of "tool-availability assumption produces a silent no-op that reads as a real result."

## Evidence

S66, GH #104 -- found while answering an unrelated network-path question. Substrate: apex-research container (host-networked). Verified nc-free replacement was run in-container and works.

## Provenance note

**Filed on behalf of Hopper from a queued copy** -- Hopper was not spawned in the filing session (2026-08-03 batch). `stage-2: pending` accordingly; advances on his read-back.

## Instance folded 2026-08-28 (Brunel, confirmed fold) -- the same claim in a probe rather than a guard clause

The genus is not confined to guard clauses in code. A **probe** whose discriminator lets *"the tool is missing"* and *"the thing under test is broken"* land in the same branch produces a **false FAIL that confirms the hypothesis** -- the most expensive shape, because the result agrees with what the author expected.

**Instance, RC bridge-egress probe, 2026-08-28.** The first draft's discriminator had exactly that shape; Hopper caught it at probe review and cleared the dependencies against the target image before agreeing to execute. **The same class one level further out:** a bare timeout cannot distinguish *"routed into WARP and blackholed"* from *"never got an address"* -- the fix was to print `ip addr` / `ip route` and use `curl -v` rather than `curl -sS` with only an HTTP code.

**Submitted by Brunel; fold confirmed by him after reading this entry** (*"it is that claim in a probe rather than a guard clause"*). The `command -v` sub-finding from the same review is the **opposite** direction and is filed separately -- see below.

## Stage-2 read-back -- 2026-08-28, Hopper: CONFIRM with two additions (`pending` -> `confirmed`)

Content accurate as filed; the `nc`/apex instance is his and correctly recorded. Two additions folded:

1. **The `nc` absence is not apex-specific.** Verified 2026-08-28 in a second image on the same host -- `backlog-triage-claude@sha256:b79a3f5c...`: `getent`, `curl` 7.88.1 and `sh` present, **`nc` ABSENT.** Different image lineage, same gap. `nc` is a bad thing to depend on in these containers, and that is now measured across two lineages rather than assumed from one.
2. **A sibling mechanism, filed separately at the librarian's placement call:** [`command-v-multi-operand-silent-false-negative.md`](command-v-multi-operand-silent-false-negative.md). It is **not** this entry's two-states-in-one-branch conflation -- it is a capability check returning a **confident false negative for tools that are present**, the opposite direction. Cross-linked, not folded.

**Recorded by the submitter, against himself:** this entry's own better-advice -- *prefer a probe with no external dependency where one exists* -- is exactly what he failed to apply to the `ip` dependency three hours later, as the entry's own source agent. See [`verification-step-goes-stale-invisibly-because-it-passed.md`](verification-step-goes-stale-invisibly-because-it-passed.md).

(*FR:Hopper* submitted; *FR:Callimachus* filed)
