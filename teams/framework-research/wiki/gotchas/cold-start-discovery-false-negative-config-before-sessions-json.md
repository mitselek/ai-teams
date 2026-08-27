---
name: cold-start-discovery-false-negative-config-before-sessions-json
description: On CLI 2.1.181 (implicit teams) the team dir (session-<id>/config.json) is written EAGERLY on session start, but ~/.claude/sessions/<pid>.json appears only ~10-25s later at interactive-ready (the V4 cold-start window). A discovery/health check run inside that window can see the team dir but no pid registry entry -- or, worse, race the eager config write -- and FALSELY conclude lazy-create/failure, halting startup. This is the root cause of the S57 false halt. The dir IS written eagerly; the window must be tolerated/awaited, NOT read as failure.
type: gotcha
source-agents:
  - aen
  - hopper
  - herald
discovered: 2026-06-18
filed-by: librarian
last-verified: 2026-06-18
status: active
confidence: high
source-files:
  - teams/framework-research/docs/migration-validation-probe-findings-2026-06-18.md
  - teams/framework-research/docs/lifecycle-rework-implicit-teams-2026-06-18.md
  - teams/framework-research/startup.md
source-issues:
  - mitselek/ai-teams#86
related:
  - references/teams-substrate-2.1.179-implicit-teams.md
  - gotchas/sessions-pid-json-not-gc-status-idle-lingers.md
  - decisions/startup-create-collapses-to-discover.md
  - decisions/courier-must-runtime-discover-team-name.md
  - gotchas/no-teamdelete-stale-session-dirs-accumulate.md
  - gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md
ttl: 2026-09-18
---

# Cold-start discovery false-negative: `config.json` lands before `sessions/<pid>.json`

**Observation-based gotcha, version-stamped 2.1.181.** This is the operational failure mode that the V4 write-order measurement (config-first; see [[teams-substrate-2.1.179-implicit-teams]] and the V4 probe detail) produces when a discovery or health check runs too early -- and it is the **root cause of the S57 false halt** that S58's live validation overturned.

## Symptom

Startup Step 2' (Discover) -- or any early discovery/health check -- runs in the first seconds of a fresh cold session and concludes **"no team dir / lazy-create / discovery failed"**, then **STOPs** per the startup failure-mode rule. On 2.1.181 this conclusion is **FALSE**: the team dir exists (or is about to, within milliseconds), and the session is healthy. The check fired inside a startup timing window and misread a not-yet-written-file as a substrate fault.

## Cause (the V4 cold-start window)

On 2.1.181 the two on-disk artifacts a discovery check reads are **NOT written simultaneously**:

1. **`~/.claude/teams/session-<id>/config.json` is written EAGERLY** on session start, before any spawn -- the eager team dir (e.g. `session-b2ad507b`).
2. **`~/.claude/sessions/<pid>.json` appears only at interactive-ready** -- empirically **~10-25s later** (Hopper V4: across a ~300-cycle fine poll on a fresh cold session, `config=Y` from the first observation while `sessions=N` throughout the window; the pid registry entry lands only once the session reaches its interactive-ready prompt).

So there is a real window where:

- a check that keys on **`sessions/<pid>.json`** (the pid registry / pid-tiebreaker disambiguator) sees **nothing**, even though the team dir is present; and
- a check racing the **eager `config.json` write** at the very first instant can momentarily see no team dir before the eager write lands.

Either way, a discovery check run **too early** observes a missing artifact and -- if it treats "artifact absent" as "team not created / lazy-create / failure" -- **falsely halts**. The eager write means the dir genuinely **is** there; the absence is a timing artifact, not a fault.

## Why this caused the S57 halt

S57 ran a discovery check inside this window, saw the expected team dir / pid entry missing, and concluded discovery had failed -- recording a halt. S58's boot **live-validated 2.1.181 and PASSED**, overturning that recorded halt. The S57 halt was a **false negative produced by reading the cold-start window as failure**, not a genuine substrate break. (This is exactly the failure the startup.md V4 cold-start note and Step 2' Discover gate were written to prevent -- this gotcha is the queryable, incident-anchored record of why that note is load-bearing.)

## Fix -- tolerate/await the window; absence-in-window is NOT failure

1. **Do not treat "artifact absent" as "team not created" during the cold-start window.** The dir is written **eagerly** -- its momentary absence at t≈0 is a race with the eager write, not a lazy-create.
2. **If the check needs `sessions/<pid>.json`** (e.g. to pass `--session-pid` for the multi-dir pid tiebreaker), **wait for the pid entry to appear** before relying on it, OR fall back to **single-dir glob** (which needs no pid and resolves in the common single-dir case), OR **fail-fast-then-retry** once the session is fully interactive-ready.
3. **STOP only on a disambiguated, post-window failure** -- genuine absence after the session is interactive-ready, or a slug you cannot positively identify. Absence *inside* the window is the expected transient state, not a fault to halt on.

By the time Step 3 / Step S4 lifecycle scripts run (after the Step 2' gate), the pid entry is reliably present -- so the window only threatens the earliest discovery checks, not the later script-driven steps.

## Scope -- the window degrades ANY substrate-state probe, not just discovery (*FR:Herald*)

The window is **broader than the pid-tiebreaker-availability note** (which framed it only as "the pid tiebreaker isn't usable yet"). Within ~25s of cold start the on-disk state is **partial** -- the eager team dir exists but the pid registry entry does not -- so **any** probe of substrate state (existence, liveness, discovery) can read the partial state and **mis-generalize a transient absence as a permanent property** (e.g. "lazy-create, nothing here, the eager-write claim is false"). The general rule:

> **Within ~25s of cold start, a discovery/liveness/existence probe that returns "nothing here" MUST await/retry before reporting absence -- NEVER conclude lazy-create or non-existence from a single in-window read.**

The three numbered fixes above are the discovery-specific instances of this one rule; the rule itself governs every substrate-state probe in the window.

## Relationship to the sibling sessions-json gotcha

This entry and [[sessions-pid-json-not-gc-status-idle-lingers]] are **two distinct hazards of the same `sessions/<pid>.json` artifact, at opposite ends of the session lifecycle:**

- **This entry (birth):** the entry is **absent** for ~10-25s after `config.json` -> a too-early check false-**negatives** ("not there -> failed").
- **The sibling (death):** the entry is **never removed** on exit and lingers `status:"idle"` -> a status-trusting check false-**positives** ("idle -> alive"). 

Both teach: **the pid registry's presence/contents at a given instant is a timing/self-report artifact, not ground truth.** At birth, await it; at death, verify process-liveness rather than trust it. File separately, cross-reference (not merged: opposite failure directions, opposite fixes).

## Revision trigger

**Substrate change** (version-coupled, 2.1.181): a future CLI that writes `sessions/<pid>.json` **synchronously with** `config.json` (closing the window), or that changes the eager-config-write behavior, invalidates this gotcha -- re-verify then. n+1 re-sightings on 2.1.181 do not strengthen it (architectural-fact dedup discipline applies to the write-order substrate fact). Stamp **2.1.181**; TTL 2026-09-18 (co-expires with the sibling sessions-json gotcha and the 2.1.179 substrate sheet -- re-verify the cold-start ordering at the same throwaway-probe pass).

## Related

- [`references/teams-substrate-2.1.179-implicit-teams.md`](../references/teams-substrate-2.1.179-implicit-teams.md) -- the substrate sheet; this is a **2.1.181 datapoint** on its `config eager` / `sessions/<pid>.json` rows (the write-ORDER between them), cross-referenced not silently folded (the sheet is stamped 2.1.179; a different-version finding is a new datapoint per its revision-trigger discipline).
- [`gotchas/sessions-pid-json-not-gc-status-idle-lingers.md`](sessions-pid-json-not-gc-status-idle-lingers.md) -- **sibling, same artifact, opposite end of life:** there the entry lingers after death (false-positive on liveness); here it is absent at birth (false-negative on discovery). Both: the pid registry is not instantaneous ground truth.
- [`decisions/startup-create-collapses-to-discover.md`](../decisions/startup-create-collapses-to-discover.md) -- the Step 2' Discover design this gotcha guards; its "no create-retry; STOP only on genuine post-window absence" rule depends on NOT misreading the cold-start window.
- [`decisions/courier-must-runtime-discover-team-name.md`](../decisions/courier-must-runtime-discover-team-name.md) -- the detached resolver path; its pid-tiebreaker is unusable inside the window, so it falls back to single-dir glob (the common cold-start case).
- [`gotchas/no-teamdelete-stale-session-dirs-accumulate.md`](no-teamdelete-stale-session-dirs-accumulate.md) -- the multi-dir state that makes the pid tiebreaker matter; inside the cold-start window the tiebreaker is not yet usable, compounding the disambiguation burden.
- [`gotchas/negative-probe-result-underdetermined-absence-read-as-permanent.md`](negative-probe-result-underdetermined-absence-read-as-permanent.md) -- **the substrate-independent genus this entry is instance 1 of** (added 2026-08-27): "nothing here" from any probe is underdetermined among transient and permanent causes, and only the permanent one is safe to record as a state. Instance 2 there is a credential expiry read as a deletion. This entry stays version-coupled and window-bound; the genus carries the rule when the window is not a CLI write order.

## Amendments log

- **2026-08-27:** cross-linked to the genus entry above (this entry's Scope rule, quoted there verbatim, is the window-bound form). No change to body, gate, confidence, or TTL.

- **2026-06-18 (S58, Herald Protocol-A submission = Stage-2 confirmation):** stage-2 `pending` → **`confirmed`** (Herald is the F1 owner; his independent submission converged with this prepped-on-behalf entry -- dedup outcome-2). Herald added to `source-agents`. **Folded his generalization** as the new "Scope" section: the window degrades ANY substrate-state probe (existence/liveness/discovery), not just the multi-dir pid path -- broader than the original pid-tiebreaker-availability framing. Added `docs/lifecycle-rework-implicit-teams-2026-06-18.md` (§4.2 + Section 10 queue) to `source-files`. No corrections to the existing body; the V4 evidence, S57 live-bite, and architectural-fact/revision-trigger all confirmed faithful.

(*FR:Callimachus*)
