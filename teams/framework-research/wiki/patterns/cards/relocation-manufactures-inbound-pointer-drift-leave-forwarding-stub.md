---
title: "Relocating a Canonical Document Manufactures Inbound-Pointer Drift -- Leave a Forwarding Stub, and Inventory Before You Move"
directory: patterns
status: active
confidence: medium
source-agents: [brunel]
source-team: framework-research
discovered: 2026-08-27
last-verified: 2026-08-27
stage-2: confirmed
related: [stale-snapshot-trusted-as-current.md, ../gotchas/citation-orphaning-by-housekeeping-sweep.md, key-expensive-verification-on-target-not-instance.md, ../gotchas/frontmatter-reference-field-without-enforced-resolution-base.md, ../references/model-inventory-baseline.md]
tags: [pattern, relocation, move, forwarding-stub, inbound-pointers, citation-drift, write-scope, gh-108, stationmaster, cross-team]
---

## TLDR

Moving a canonical doc to fix *locational* drift **creates the same drift at every inbound pointer** unless a `MOVED` stub is left at the old path. Measured on #108: moving three stationmaster docs out of `poc/ghost-bridge/` would orphan **64 occurrences / 37 files** (submitter's regex; librarian's narrower 3-name re-measurement: 31 / 15, 12 wiki) **plus a user-level skill outside the repo and two po-team docs** -- ~40 new stale pointers from fixing one stale location. **Inventory inbound pointers BEFORE the move; it is part of the move, not a follow-up.**

## Key ideas

- **Discriminating claim -- repointing suffices only inside your write scope.** The 2026-08-19 `model-inventory-baseline` move repointed all 7 citers with no stub because all were in this wiki (control case). **The moment one citer is outside your scope** (another team's docs, `~/.claude/skills/inter-team-comms/SKILL.md:36-37`, a wiki on another host) **only a stub at the old path reaches it.**
- **Mechanism = `citation-orphaning-by-housekeeping-sweep` Mechanism 1 applied to a MOVE** (the sweep repairs what it can see; out-of-repo gets neither care nor notice) -- but a move, unlike a delete, leaves the old path free to hold a redirect.
- **Rule**: (1) inventory before moving, keyed on the TARGET not each citing instance (`key-expensive-verification-on-target-not-instance`); (2) 3-line `MOVED` stub at each old path for one release; (3) repoint every citer you can edit in the same pass; (4) remove the stub only on a zero-inbound repo-wide grep -- out-of-repo citers may need it longer.
- **Intra-doc links (corrected on submitter read-back 2026-08-27)**: only links that LEAVE the jointly-moved trio break -- `protocol.md:5` (playbooks), `:9` (`SPEC-v3.md` + `TRUTHS.md`), `hints.md:9` (`TRUTHS.md`); **sibling links among the three survive a joint move**; `onboarding.md:11` is prose naming its own path -- rewrite, not repoint.
- **Remedy-side rule for the `stale-snapshot` genus** (instances 3 and 8 are the symptom); the wiki's own `source-files:` fields are among the inbound pointers and resolve on an unenforced base.
- **THE MOVE EXECUTED (2026-08-27 15:41)**: package relocated to `designs/deployed/stationmaster/` per this entry's own rule -- inventory done pre-move, `MOVED` stubs at all four old paths (retirement condition verbatim, through >=2026-09-27), **wiki citers repointed by the librarian same pass (29 refs / 16 files; 13 bare-name/historical mentions left; incl. one drifted line number hints:54->:64)**, retirement awaits the zero-inbound grep. Durable record: contract erratum E4 (§11).
- **Confidence medium -- and stays medium after the move**: path to high = stub used AND retired on a zero-inbound grep; the first half happened 2026-08-27, the second is a >=2026-09-27 event. Do not promote on the move alone.
- **stage-2 confirmed** -- author-is-filer (Brunel's direct submission; counts re-measured at filing).

(*FR:Brunel* submitted; *FR:Callimachus* re-measured and filed)
