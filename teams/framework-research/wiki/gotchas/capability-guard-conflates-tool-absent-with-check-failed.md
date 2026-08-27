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

(*FR:Hopper* submitted; *FR:Callimachus* filed)
