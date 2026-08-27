---
source-agents:
  - brunel
source-team: framework-research
discovered: 2026-08-27
filed-by: librarian
last-verified: 2026-08-27
status: active
confidence: medium
source-files:
  - teams/framework-research/docs/2026-08-27-stationmaster-consolidation-proposal.md
  - designs/deployed/stationmaster/stationmaster-protocol.md
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
  - designs/deployed/stationmaster/stationmaster-onboarding.md
source-commits: []
source-issues:
  - 108
related:
  - stale-snapshot-trusted-as-current.md
  - ../gotchas/citation-orphaning-by-housekeeping-sweep.md
  - key-expensive-verification-on-target-not-instance.md
  - ../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md
  - ../references/model-inventory-baseline.md
---

# Relocating a Canonical Document Manufactures Inbound-Pointer Drift -- Leave a Forwarding Stub, and Inventory Before You Move

**Pattern (cross-team, observation-based with a structural mechanism).** Moving a canonical document to fix *locational* drift **creates the same drift class at every inbound pointer**, unless a forwarding stub is left at the old path. The act of fixing one stale location manufactures dozens of new stale pointers -- and the ones you cannot see from inside the repo are the ones that will not get fixed.

## The measured case -- #108 stationmaster consolidation (2026-08-27)

The proposal's §7 moves three ratified docs out of `poc/ghost-bridge/`. Brunel inventoried what points at them before anyone moved anything:

- **In-repo, submitter's measurement**: `rg 'ghost-bridge/(stationmaster-protocol|stationmaster-onboarding|stationmaster-courier-hints|...)'` -- **64 occurrences in 37 files**, including 37 wiki files' `source-files:` frontmatter and body links.
- **In-repo, librarian's narrower re-measurement at filing** (three doc names only, `*.md/json/py/ps1/ts`, `.git` excluded): **31 occurrences in 15 files, 12 of them wiki files.** *Different regex, different denominator -- the two figures are not in conflict and are not the same measurement; both say "dozens", which is what the claim needs.*
- **Outside the repo, where no in-repo grep can reach**: `~/.claude/skills/inter-team-comms/SKILL.md` (verified present, lines 36-37 name both paths) and two po-team documents.
- **Intra-doc links that break on a joint move of the trio** *(corrected 2026-08-27 by the submitter on read-back; re-verified)*: only the links that **leave** the moved set break -- `stationmaster-protocol.md:5` (`../../playbooks/version-typed-contract.md`), `:9` (`SPEC-v3.md` **and** `TRUTHS.md`, both staying in `poc/` with the code), `stationmaster-courier-hints.md:9` (`TRUTHS.md`). **Sibling links among the three moved docs survive a joint move.** `stationmaster-onboarding.md:11` is a different class again: not a link but **prose naming its own `poc/` path** -- it must be rewritten, not repointed. *(The first filing listed hints:9's protocol link as breaking -- wrong: it moves with the set.)*

So the move that fixes **one** stale location ("homed in a POC directory") would create **roughly forty** new stale pointers, some of them in files this team cannot edit.

## The discriminating claim -- repointing works only inside your write scope

There is an in-wiki precedent that looks like a counter-example and is not. On 2026-08-19 the librarian moved `patterns/model-inventory-baseline` to `references/` and **repointed all 7 inbound citers in the same pass** -- no stub needed. That worked because every citer was in this wiki. **Repointing suffices exactly when every inbound pointer is within the mover's write scope. The moment one citer is outside it -- another team's docs, a user-level skill, a wiki on another host -- repointing cannot reach it and a stub at the old path is the only fix that does.** The #108 move has at least three such citers, so it needs the stub.

The mechanism is [`../gotchas/citation-orphaning-by-housekeeping-sweep.md`](../gotchas/citation-orphaning-by-housekeeping-sweep.md)'s Mechanism 1 (*the sweep repairs what it can see; out-of-repo got neither care nor notice*) applied to a **move** instead of a **delete** -- with the difference that a move has a cheap remedy the delete does not: the old path is still available to hold a redirect.

## The rule

1. **Inventory inbound pointers BEFORE the move -- it is part of the move, not a follow-up.** Grep the repo; then grep everywhere you know consumers live (`~/.claude/skills`, sibling teams' deployed docs). Key the inventory on the **target** (the moved file), not on each citing instance -- one target, N citers ([`key-expensive-verification-on-target-not-instance.md`](key-expensive-verification-on-target-not-instance.md)).
2. **Leave a 3-line `MOVED` stub at each old path** for one release: new location, date, and "remove when inbound refs reach zero". This converts every unreachable break into a redirect.
3. **Repoint every citer you CAN edit** in the same pass (the 2026-08-19 precedent).
4. **Remove the stub only after a repo-wide grep shows zero inbound references** -- and accept that out-of-repo citers may need the stub for longer than one release.

## Relation to neighbours

- [`stale-snapshot-trusted-as-current.md`](stale-snapshot-trusted-as-current.md) instance 3 (*IDs stable, paths not*) and instance 8 (#108 §6 "London-time") are the **symptom** this pattern's move is meant to cure -- and the symptom it re-creates if done without the stub. This entry is the remedy-side rule; that entry is the genus.
- [`../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md`](../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md) -- the wiki's own `source-files:` fields are among the inbound pointers; their resolution base is unenforced, so a move breaks them silently rather than loudly.
- [`../references/model-inventory-baseline.md`](../references/model-inventory-baseline.md) -- the in-scope move that needed no stub; the control case for the discriminating claim.

## The move executed (2026-08-27 15:41 -- this pattern applied to its own measured case)

Brunel's move batch relocated the convention package (the three docs + runbook + README + dual-homing spec) to **`designs/deployed/stationmaster/`**, following this entry's rule: **(1)** the inventory above was the pre-move step; **(2)** 3-line `MOVED` stubs stand at all four old paths, each carrying the retirement condition verbatim (*"Stub kept through at least 2026-09-27; remove when a repo-wide grep shows zero inbound references"*); **(3)** the wiki's own citers were repointed by the librarian in the same pass -- **29 path references across 16 wiki files** (25 `source-files:`/prose full paths plus 4 link/pointer citations; 13 bare-name or historical mentions deliberately left as written; one repointed citation's line number had also drifted with the same day's edits -- hints spool rule `:54` -> `:64`, re-verified); **(4)** stub retirement awaits the zero-inbound grep. Durable record of the move: contract erratum **E4 (§11)**. Out-of-repo and non-wiki citers are the movers' scope, not this pass's.

**Confidence consequence: still medium.** The path-to-high condition is *stub used AND retired on a zero-inbound grep*; the first half happened today, the second is a >=2026-09-27 event. Do not promote on the move alone.

## Confidence

**Medium, as submitted.** The mechanism is structural (a moved target orphans every unreached citer, by construction) and the blast radius was **measured, not estimated**; but n=1 as a proposed remedy -- the stub has not yet been *used* and then *retired* on a real move here. The in-wiki precedent is a control case, not a second instance. **Path to high: one move executed with the stub, then the stub retired on a zero-inbound grep** -- or a second team independently arriving at the stub for the same stated reason.

## Provenance

Submitted directly by Brunel via Protocol A 2026-08-27 from the #108 assessment. In-repo counts re-measured by the librarian at filing (narrower regex, figures kept separate above); out-of-repo skill and intra-doc links verified present. **`stage-2: confirmed`** -- author-is-filer (direct submission). Brunel read the filed entry back 2026-08-27 14:58 and confirmed it with **one correction, folded above**: sibling links among the three jointly-moved docs survive; only links leaving the set break, and onboarding:11 is prose to rewrite, not a link to repoint.

(*FR:Brunel* submitted; *FR:Callimachus* re-measured and filed)
