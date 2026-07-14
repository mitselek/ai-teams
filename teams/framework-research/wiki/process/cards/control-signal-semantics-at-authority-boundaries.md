---
title: "Control Signals Have Literal, Eager Semantics -- Read/Write Them Narrowly at Authority Boundaries"
directory: process
status: active
confidence: high
source-agents: [aen, herald]
source-team: framework-research
discovered: 2026-07-14
last-verified: 2026-07-14
stage-2: pending
related: [coordination-loop-self-correction.md, timestamp-crossed-messages.md, standby-agent-fix-then-flag-discipline.md, rule-erosion-via-reasonable-exceptions.md]
tags: [process, discipline, control-message, coordination, stop-semantics, musing-vs-direction, mid-flight-redirect, po-team, protocol-c-candidate]
---

## TLDR

An agent (or a coordinator relaying a principal's words) executes control language **literally and eagerly** -- imprecise control language resolves toward *more* action, *sooner*, and *more destructively* than intended. Make control language narrow: narrow when reading a principal's input, narrow when writing a stop. One mechanism, three loci. PO-formulated (Mihkel, S60); promotion-bound to the po-team design.

## Key ideas

- **Shared mechanism**: eagerness is the executing side's default; ambiguity in control language resolves the wrong way *because* the side is biased toward action. Fix = narrow literal semantics, not "be less eager."
- **Sub-lesson 1 -- Musing is not commission (reading input)**: "we could / maybe / I want to think about" from the principal is thinking-out-loud -> discuss or record, **never spawn/task**. Only explicit direction starts a lane. Unsure -> treat as musing and ask (one message vs a wrongly-spawned lane). *Instance S60*: PO mused "we could use stationmaster with a dedicated station"; Aen tasked Herald a design lane off it.
- **Sub-lesson 2 -- Stop is not revert (writing a stop's content)**: a stop means **cease**, never **destroy**. Never bundle `git checkout`/cleanup/undo into a stop. Untouched uncommitted tree = decision *deferred* (cheap, reversible); reverted tree = work *lost*. Say "cease; leave as-is." *Instance S60*: HOLD worded "checkpoint and stop... doc stays parked" -> Herald **reverted a finished protocols.md §7 edit** + rewrote with banners = expensive multi-round retraction; plain "cease" would have preserved it.
- **Sub-lesson 3 -- Control acts at boundaries, not mid-flight (timing a stop)**: "stop" = "don't start the next thing," never "reach into the running thing." Let in-flight work reach its natural end; reroute at the seam. *Companions*: (a) racing a control message to a working agent is how work dies -- prefer letting an agent finish over mid-flight redirection (control-message case of `timestamp-crossed-messages`); (b) a slow-down changes HOW you operate, not another thing to execute at max speed. *Instance S60*: PO said "please don't rush"; Aen *immediately* fired a HOLD that raced Herald's already-completed work.
- **Not**: not a ban on stopping; not "ignore musings"; not in tension with fast coordination (clean seams beat racing redirects end-to-end).
- **Provenance**: PO-originated (Mihkel, verbatim, S60 2026-07-14), Aen-submitted (Protocol A); failure-instance co-authors Aen + Herald. `stage-2: pending` (filed-on-behalf; awaits Aen/Herald read-back). Promotion into `designs/new/po-team/` carried separately by Herald + Celes; Protocol C common-prompt promotion is the follow-on.

(*FR:Callimachus* filed; PO-originated, *FR:Aen* submitted)
</content>
