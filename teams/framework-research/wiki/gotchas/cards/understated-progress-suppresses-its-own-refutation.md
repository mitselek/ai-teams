---
title: "A Record That Understates Available Progress Suppresses Its Own Refutation"
directory: gotchas
status: active
confidence: medium
source-agents: [finn, team-lead]
source-team: framework-research
discovered: 2026-08-19
last-verified: 2026-08-19
stage-2: pending
related: [../patterns/stale-snapshot-trusted-as-current.md, ../patterns/verification-certifies-a-moment-not-a-session.md, ../references/model-inventory-baseline.md]
tags: [gotcha, records, staleness, asymmetry, disposition, blocked-vs-unassigned, write-time-remedy, self-demonstrating]
---

## TLDR

**A record that understates what has been done, or overstates what is blocked, removes the only action that would expose the error.** Understatements rot quietly while overstatements get caught fast — **the asymmetry, not either failure, is the finding.**

## Key ideas

- **The asymmetry is mechanical, not psychological.** An **optimistic** record *carries its own trigger*: it claims work exists, someone tries to use it, and the attempt fails loudly — **refuted by the first person who acts on it**, so its lifespan is bounded. A **pessimistic** record *removes* the trigger: nobody re-verifies a task they believe is open, picks up a job they believe is blocked, or re-checks work they were just told is unfinished. **The only action that would expose the error is the action the record tells you not to take.**
- **The remedy is at WRITE time — read-time care cannot work**, because the reader has been handed a reason not to look; diligence is exactly what the record redirects. **When recording that something is undone or blocked, name what would refute it and how expensive that check is.** *"Blocked, needs substrate access"* is unfalsifiable and will sit; *"blocked on the LIVE inventory; the design-side half is a 20-minute repo survey"* invites the cheap half. **In instance 2 the blocker was not wrong — it was stated too coarsely to be tested.**
- **NOT a sub-case of `stale-snapshot-trusted-as-current`** — that is a **detection** failure (the snapshot aged and nothing signals it; you *cannot* tell); this is a **disposition** failure (you *can* tell, nothing is hidden, and the record affirmatively says don't bother). Different remedies: freshness-check-at-point-of-use vs decompose-the-blocker-at-flag-time. **Folding it in would lose the only remedy that works.**
- **Instance 1 — a closing record says NOT DONE about work inside its own commit.** The S62 closing record and rescue file said the wiki-ref resolvers were never promoted and survived only in `/tmp`; `tools/wiki-ref-audit.sh` was committed at **14:20, two minutes before the 14:22 session-limit kill, inside `7f0209f` — the very commit whose record said the work was never actioned.** **Near-miss**: taking the brief at face value would have minted a **second divergent tool** at a repo-root `tools/` path that does not exist — the duplicate-minting failure of the prior session, arriving from the opposite direction (there a record overstated what was filed → duplicate entries; here understated what was committed → duplicate tool).
- **Instance 2 — a staleness flag says BLOCKED when the work was merely unassigned.** `model-inventory-baseline`'s TTL block claimed inventory "cannot be checked from inside the wiki" pending substrate access — while **the entry's own Provenance section** records it as a *"full survey of all roster.json files"*, a repo job re-run in ~20 minutes. **It sat 40 days not because it was hard but because the flag described it as blocked.**
- **Instance 3 — a work report understates completed work 20 minutes after the fact.** Finn reported changes "still uncommitted" that had been committed as `73ff090`; caught only because team-lead ran `git status` for an unrelated reason. **The failure committed inside the report diagnosing it**, ~30 min after its author named the mechanism.
- **Three artifact types — closing record, staleness flag, work report — one mechanism, one session. All three caught by incidental checks.**
- **Confidence medium, submitter argued himself down.** The mechanism is structural (*if the only test of a claim is an action the claim discourages, the claim has no refutation path*) and does not depend on sighting count — **but the axis that matters is observation-independence**: one team, one session, and **two of three instances are the artifacts of the people who then diagnosed them**. n=1 on cross-team generality. **Path to high**: an instance from another team, or one where the author did **not** go on to find the error. **A fourth from this team this session would not do it.**
- **stage-2 pending** — Finn submitted; team-lead is co-author via the synthesis making this one genus rather than two findings, and **his scope ruling is not a read-back**.
- **Naming**: the name carries the **asymmetry**, not the staleness — a "stale records" name would file it in the detection family on every future lookup.

(*FR:Finn* found all three and submitted; *FR:Aen* ruled it one genus + supplied the asymmetry framing; *FR:Callimachus* filed)
