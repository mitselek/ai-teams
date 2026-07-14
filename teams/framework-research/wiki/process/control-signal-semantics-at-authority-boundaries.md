---
source-agents:
  - aen
  - herald
source-team: framework-research
discovered: 2026-07-14
filed-by: librarian
last-verified: 2026-07-14
status: active
confidence: high
source-files:
  - designs/new/po-team/protocols.md
source-commits: []
source-issues: []
related:
  - patterns/coordination-loop-self-correction.md
  - patterns/timestamp-crossed-messages.md
  - process/standby-agent-fix-then-flag-discipline.md
  - patterns/rule-erosion-via-reasonable-exceptions.md
stage-2: pending
amendments: []
---

# Control Signals Have Literal, Eager Semantics -- Read and Write Them Narrowly at Authority Boundaries

An agent (or a coordinator acting on a principal's words) executes control language **literally and eagerly**: when the language is imprecise, the executing side resolves the ambiguity toward *more* action, *sooner*, and *more destructively* than the sender intended. The discipline is to make control language narrow -- narrow when **reading** a principal's input (don't inflate it into a command that wasn't given), and narrow when **writing** a control message (don't let "stop" become "destroy," and don't let it reach into work already in flight).

This is one mechanism with three loci. The three sub-lessons below were formulated verbatim by the PO (Mihkel) after a single S60 session in which all three fired in sequence and cost an expensive multi-round retraction cycle. They are filed together because they are the same failure -- over-resolution of imprecise control language -- caught at three different boundaries.

## The shared mechanism

The executing side is biased toward action. A coordinator who hears a maybe wants to be responsive, so a musing becomes a task. An agent who is told to stop wants to leave a clean state, so "stop" becomes "revert." An agent under a slow-down instruction is still optimizing for throughput, so "slow down" becomes another thing to do at maximum speed. In every case the ambiguity resolves the wrong way *because eagerness is the default*. The fix is not "be less eager" in general -- it is to give control language **narrow, literal semantics** so eagerness has nothing loose to grab.

## Sub-lesson 1 -- Musing is not commission (reading a principal's input)

"We could / we should maybe / I want to think about / it might be nice if" from the principal (PO, team-lead, any authority) is **thinking-out-loud**. The correct response is to discuss it or record it -- never to spawn an agent or open a work lane off it. **Only explicit direction starts a lane.**

The boundary is at the *reading* side: the coordinator must classify the input before acting on it. A musing that gets converted into a task manufactures work the principal never asked for and commits people and attention to it. If unsure whether an utterance is a musing or a direction, treat it as a musing and ask -- the cost of asking is one message; the cost of a wrongly-spawned lane is a spawn, its work, and its retraction.

**Failure instance (S60):** during the po-team design session the PO mused "we could use stationmaster with a dedicated station" for comms. The coordinator (Aen) immediately tasked Herald with a design lane off that musing. It was thinking-out-loud, not a commission.

## Sub-lesson 2 -- Stop is not revert (writing a stop's content)

A stop order means **cease**. It never means **destroy**. Never bundle `git checkout` / cleanup / undo / "revert what you did" into a stop instruction.

The two end-states are not equivalent, and the asymmetry is the whole point:

- **An untouched, uncommitted tree is a decision deferred.** The work is parked, intact, resumable the instant the principal says "go." Nothing is lost.
- **A reverted tree is work lost.** Recreating it costs another full cycle, and the retraction itself is work.

When you must halt an agent, say "cease" and stop there. Let the uncommitted state sit. Deferral is cheap and reversible; destruction is neither. Wording carries semantics: "checkpoint and stop -- the doc stays parked" reads to an eager agent as an instruction to *put the doc back to a parked state*, i.e. to undo. "Cease; leave everything as-is" does not.

**Failure instance (S60):** a HOLD sent to Herald was worded "checkpoint and stop... doc stays parked." Herald read it as an instruction to restore a parked state and **reverted a finished `protocols.md` §7 edit**, then rewrote the doc with banners -- an expensive multi-round retraction. A plain "cease" would have preserved the completed edit untouched.

## Sub-lesson 3 -- Control messages act at boundaries, not mid-flight (timing a stop)

"Stop" means **"don't start the next thing."** It does not mean "reach into the thing already running and redirect or unwind it." Let in-flight work reach its natural end, and reroute at the seam between units of work.

Two companions to this sub-lesson:

- **Racing a control message to a working agent is how work dies.** A stop/redirect fired at an agent who is mid-delivery collides with the delivery -- the two cross, and the agent is left reconciling a completed artifact against an instruction that assumed the artifact didn't exist yet. Prefer letting an agent finish over mid-flight redirection. (This is the control-message case of `timestamp-crossed-messages`: the control message and the agent's delivery are composed in parallel and cross in transit.)
- **A slow-down instruction changes HOW you operate, not WHAT you execute.** "Please don't rush" is a directive about *pace and care*, not a new task to complete at maximum speed. An agent that treats "slow down" as another item on the queue -- to be dispatched fast -- has inverted its meaning.

**Failure instance (S60):** the PO said "please don't rush"; Aen *immediately* fired a HOLD at Herald -- which raced Herald's already-completed work. The slow-down became a fast control action, and the control action reached into in-flight (in fact, already-finished) work rather than waiting for the seam. The right move was to let Herald's unit finish and reroute at the boundary.

## What this is NOT

- **Not a ban on stopping work.** Stopping is often correct. The discipline governs *how* a stop is phrased and *when* it acts -- cease (not destroy), at the boundary (not mid-flight) -- not whether stops are allowed.
- **Not "ignore the principal's musings."** Musings are valuable signal; record and discuss them. The discipline is only against silently converting a musing into a committed lane.
- **Not in tension with fast coordination.** Letting a unit finish before rerouting is usually *faster* end-to-end than racing a redirect, because it avoids the retraction cycle. Speed comes from clean seams, not from interrupting.

## Promotion posture

**PO-directed norm, high confidence, n=1 empirical instance per sub-lesson (single S60 session, all three in sequence).** Confidence is high not because the failure count is high but because the lessons are a PO directive, not a hypothesis under test. The PO explicitly directed these be filed and **promoted into the po-team design** (`designs/new/po-team/`); Herald and Celes are carrying that promotion separately. This entry is the wiki record and the citable source for that promotion. A common-prompt promotion (Protocol C) is a natural follow-on once the po-team design lands the three sub-lessons as coordinator rules.

## Related

- [`coordination-loop-self-correction.md`](../patterns/coordination-loop-self-correction.md) -- adjacent coordination-loop discipline. That entry is about a coordination loop *self-correcting* at coordination-tempo; this one is about control messages *destroying* work when their semantics are loose. The healthy case and the failure case of acting inside a live loop.
- [`timestamp-crossed-messages.md`](../patterns/timestamp-crossed-messages.md) -- the substrate mechanism behind sub-lesson 3's "racing a control message": a stop and a delivery composed in parallel cross in transit. Racing control messages is the control-message instance of the crossed-messages failure.
- [`standby-agent-fix-then-flag-discipline.md`](standby-agent-fix-then-flag-discipline.md) -- sibling coordination discipline on the same axis: what an agent may *touch* on behalf of owned work. This entry governs what a coordinator may *say* (control content and timing); together they bound acting-on-behalf from both the toucher's and the director's sides.
- [`rule-erosion-via-reasonable-exceptions.md`](../patterns/rule-erosion-via-reasonable-exceptions.md) -- adjacent: eager over-resolution of control language is a corrosion vector of the same family; "a prudent pause beats a permission grant" is sub-lesson 1's posture applied to the reader.

## Provenance note

Originated by the PO (Mihkel), verbatim feedback, S60 (2026-07-14); submitted to the wiki via Protocol A by team-lead (Aen). Co-authors of the failure instance: Aen (issued the musing-as-task and the racing HOLD) and Herald (executed the revert). `stage-2: pending` -- filed-on-behalf; awaits read-back from Aen and/or Herald to confirm the rendering of the failure instances. The PO's formulation is the authoritative source for the three sub-lessons themselves.

(*FR:Callimachus* filed; PO-originated, *FR:Aen* submitted)
</content>
</invoke>
