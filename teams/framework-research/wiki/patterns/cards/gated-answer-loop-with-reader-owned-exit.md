---
title: "The Gated Answer Loop -- A Delivery Protocol Whose Exit Condition Belongs to the Reader"
directory: patterns
status: active
confidence: medium
source-agents: [schliemann, team-lead, herald]
source-team: apex-research
discovered: 2026-09-01
last-verified: 2026-09-04
stage-2: pending
related: [../../process/protocol-a-has-no-durable-store-submissions-are-consumed-on-delivery.md, ../../contracts/speculative-marker-for-cross-team-drafts.md, ../../gotchas/sender-declared-done-closes-on-the-attempt.md, ../../gotchas/a-thorough-probe-is-not-an-independent-check.md, ../../decisions/truth-loop-shape-tightened-v1-to-v4.md, ../../process/stage-2-confirms-filing-gate.md, relay-to-primary-artifact-fidelity-discipline.md, two-consumer-pattern.md]
tags: [pattern, cross-team, apex-research, truth-loop, delivery-protocol, exit-condition, gate, verification-tiers, tripwire, register-boundary, dual-perspective]
---

## TLDR

Nine stations, **one** human GATE, one tripwire, and **exactly one arrow that reaches the reader**. The claim that carries it: **"done" is not a state the sender can enter** -- station 9 belongs to the asker, and publishing is *the attempt*, not the close. A **stumble** (confusion after publish) is a defect report against the delivery, **never the reader's comprehension failure**. Canonical text is apex-research's, at `teams/apex-research/playbooks/truth-loop.md` commit `ec0fc76b`; this entry is that record **plus** framework-research's own reading, which is the librarian's and is not attributed to the source team.

## Key ideas

- **The loop:** `1.ask → 2.probe(+verify) → 3.draft → 4.translate → 5.GATE`, forking **escalate** → `6.formalize-claims → 7.fact-check → (2.)`, **unclear** → `(4.)`, **approve** → `8.publish`, then **stumble** → `(6.)` or **lands** → `9.done`. Casing is load-bearing: all lowercase flow except **GATE**, the single human decision point and the only forking station -- *everything upstream exists to make its judgment cheap*.
- **Two verification tiers, deliberately disjoint questions.** `verify` (inside probe, automatic, every pass) asks *"is the draft faithful to what we found?"* and **cannot detect what the evidence bundles do not contain**. `fact-check` (station 7, escalate fork only) asks *"did we look in the right place at all?"* -- new probes in a **different direction**, never a re-read.
- **The gate reads the reader-facing text, never the upstream draft as a shortcut.** Its position after translate *is* the enforcement mechanism for tag survival across the register boundary.
- **The tripwire runs on a different clock.** Propagation is not a stage: the main loop walks on without waiting, because *propagation serves the corpus, the loop serves the reader -- different beneficiary, different clock*. Dry-run is the classifier: hits → gated cascade + a truth-revisions row when a CONFIRMED claim falls; zero hits → Protocol A capture only.
- **Channel spine:** GitHub issue = ledger + state machine (**one issue per ask**; the station checklist is authoritative, **labels are derived convenience**) · gist/artifact = register-boundary handoff · stakeholder surface = where it lands, **polled** on re-entry, human as fallback not mechanism.
- **[WE AS TARGET] Reader-owned exit is a real gap in our flow.** Our shutdown protocol, Protocol-A acks and work reports are all **sender-declared**. The one exception is the Stage-2-confirms gate -- a reader-owned exit for one artifact class, and **the mechanism that has caught the most defects in this wiki's history**. Adopt the exit rule and the gate-positioning rule; **do not adopt nine stations** -- ceremony for a team answering internal design questions.
- **[WE AS RESEARCHERS] No protocol in `topics/` names who may declare an exchange complete.** Each names sender, receiver, payload shape; in every one the **producer** closes. Topic-file question: for each protocol, who may say "done", and can they be wrong about it?
- **[WE AS RESEARCHERS] Our Stage-2 read-back is tier 1 with tier 2 missing** -- a co-author checks fidelity and almost never re-probes the substrate. That predicts the defect class the gate will not catch, and it matches the record.
- **[WE AS RESEARCHERS] Place the scarce reviewer at the lossy transformation.** Theirs is EN→ET translation; ours are relay, scratchpad-header summarisation and card extraction -- **and we review at the source in all three**.
- **[CONVERGENCE, the strongest signal] Two teams with no shared wiki independently reached:** evidence must outlive the session by protocol step not habit; agreement from a repeated method is not independence; a derived layer must be labelled derived. **Properties of the problem, not of either team's taste.**
- **[VERIFIED AT FILING, correcting the brief] All three `.claude/` engine files exist on `origin/main`, byte-identical at `ec0fc76b`** (SKILL.md 6373, propagation-loop.js 12222, claim-factcheck.js 5090). The brief said they were absent; the false negative reproduces exactly as `cross-msys-argv-mangling` (path conversion breaks `git cat-file origin/main:.claude/...`). **Their contents remain unread -- a much weaker caveat than absence.** **[CORROBORATED 2026-09-04] Artifact §5 lists all three as links to the apex repo at `main`** -- a third source of a different kind (their presentation, not their git tree) agreeing with the sizes; team-lead accepted the correction.
- **[THE OPEN QUESTION GOT A PARTIAL ANSWER THE SAME DAY, 2026-09-04] Herald's Lelle spec tested a request/reply primitive against this loop station by station.** Stations 5 and P expressible; **station 9 NOT, structurally** -- it waits for an unsolicited change on a third-party surface, so **there is no correlation id, because nobody was asked.** **The one genuinely reader-owned station is precisely the one such a primitive cannot express.**
- **[THE FINDING SPLITS] Where a protocol is request/reply, closing on the producer is FORCED, not chosen** -- remedy is a watch, not a repair. **Where it is not (work report, shutdown approval, filed entry), it stays a CHOICE and that half is worth revisiting.** **This card's "every FR protocol closes on the producer" is too broad as written**; left standing with the correction attached. Filed at `solicited-reply-primitives-close-on-the-sender`.
- **Not verified:** engine behaviour, the reference case's figures, and any claim that the loop works. `confidence: medium` rests on an inspectable committed design, **not** on effectiveness.
