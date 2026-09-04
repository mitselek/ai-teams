---
name: lelle
description: Gen-3 inter-team comms method for the EVR island -- a workflow-level signal primitive (hubSignal/hubNotify) that parks a workflow on a cross-team reply. Extension of the stationmaster post-office, not a replacement.
type: protocol-spec
version: 0.1
status: draft -- PO gate pending (see §12)
author: herald
discovered: 2026-09-04
work-ledger: mitselek/ai-teams#116
design-seed: mitselek/ai-teams discussion #107 (2026-08-13, zero prior comments)
island: EVR (prod-llm) only -- personal island out of scope by the #108 ruling
extends:
  - designs/deployed/stationmaster/stationmaster-protocol.md (contract v1.0.0)
  - designs/deployed/stationmaster/stationmaster-courier-hints.md
  - designs/deployed/stationmaster/fr-dual-homing-spec.md
source-files:
  - teams/framework-research/wiki/decisions/two-islands-by-design-hub-topology-follows-network-boundary.md
  - teams/framework-research/wiki/patterns/island-local-everything-only-the-repo-crosses.md
  - teams/framework-research/wiki/patterns/gated-answer-loop-with-reader-owned-exit.md
  - teams/framework-research/playbooks/version-typed-contract.md
  - teams/framework-research/poc/ghost-bridge/company-courier.py
  - teams/framework-research/poc/ghost-bridge/fr-courier-daemon.py
  - teams/framework-research/poc/ghost-bridge/comms-mcp.py
---

# Lelle -- Gen-3 EVR-Island Comms: Workflow-Level Hub Signals

(*FR:Herald*, S73 2026-09-04)

**Lelle** is the gen-3 inter-team comms method for the **EVR island** (the `prod-llm` hub instance,
`sm@10.100.136.162:2222`). It adds one capability to the gen-2 stationmaster post-office: a **workflow
script can send a message and park on the reply**, resuming with the reply payload in hand, instead of
ending the workflow and reconstructing state in a later session.

Lineage: gen 1 ghost-bridge → gen 2 stationmaster contract v1.0.0 → **gen 3 Lelle**. Lelle is an
**extension of the post-office, not a replacement.** Everything below is designed so that the sentence
"the hub is untouched" stays literally true.

> **The headline answer to the brief's first question -- how a parked workflow is represented on the
> hub: it is not.** The hub holds an ordinary deposited consignment. The parked state lives entirely
> on the customer side, in the courier's pending table and a signal file. No new verb, no new envelope
> field, no `collect` filter. **Lelle v1 changes the contract's wire shape by exactly nothing.**

---

## 1. Scope and parties

| Party | Role in Lelle | Changes needed |
|---|---|---|
| **Hub** (`prod-llm`) | Carries the signal and the reply as ordinary mail. Knows nothing about signals. | **None.** |
| **Sending courier** | Unchanged outbound path. | None on the send leg. |
| **Receiving courier** | Recognises a reply header and dual-writes a signal file beside the normal inject. | One additive rule (§6). |
| **Workflow runtime** | Runs the script. | **None.** Lelle is a script-side library, not a new runtime primitive (§4). |
| **Workflow script** | Calls `hubSignal()` / `hubNotify()`. | New helper library. |
| **Answering agent/team** | Replies with a Lelle reply header. | One convention to follow (§5.2). |

**Assumed capability, unchanged from contract §1:** outbound `ssh` only. Lelle adds no transport
requirement.

**Island scope.** Lelle is EVR-island only. It inherits the `island-local-everything` discipline
verbatim: the signal machinery is island-local, and the only artifact that crosses islands is the git
repo. §9 states what happens when a signal names a team on the other island.

---

## 2. What #107 asked for, and what is actually deliverable

#107 proposed `hubSignal()` and claimed three benefits. Assessed against the substrate:

| #107 claim | Verdict |
|---|---|
| Collapse the relay chain (workflow → agent → session → hub → courier → session → new workflow) to (workflow → hub → workflow) | **Deliverable.** This is the whole of Lelle. |
| State continuity -- the workflow holds state across the gate instead of reconstructing it | **Deliverable**, and it is the stronger of the two benefits. The script's local variables survive the gate because the script never ends. |
| The peer-escalation disclaimer fires once at the boundary rather than on every hop | **`[speculative]` -- not a Lelle promise.** The disclaimer is injected by the harness, not by the hub, the courier, or any code in this design. Lelle reduces the number of *hub hops* per gate; whether that reduces disclaimer instances depends on whether the disclaimer is per-hop, which this spec has not verified and cannot control. Stated as a possible side effect, never as a design goal. |

The third claim was #107's framing motivation (the "~8,000 words of repeated disclaimers" observation
in its footer). It must not become an acceptance criterion for Lelle, because Lelle cannot be held
responsible for it.

---

## 3. The primitive's contract

### 3.1 Two verbs, and the reason there are two

```js
// park until the peer answers
const gate = await hubSignal({ to, subject, body, deadline_s, replyTo })

// fire and forget -- deposit, do not wait
await hubNotify({ to, subject, body })
```

`hubNotify()` exists so that authors have a cheap way to say "this needs no answer". Without it, every
cross-team message in a workflow becomes a parked signal, and parked signals are the scarce resource
(§7.1). The apex truth loop's station-P tripwire is the canonical `hubNotify()` shape: *"propagation
serves the corpus, the loop serves the reader; different beneficiary, different clock"*
([`gated-answer-loop-with-reader-owned-exit`](../../../teams/framework-research/wiki/patterns/gated-answer-loop-with-reader-owned-exit.md)).
A different clock means **do not park on it**.

### 3.2 `hubSignal()` arguments

| Field | Required | Shape | Notes |
|---|---|---|---|
| `to` | yes | `<team>` or `<agent>@<team>` | Same grammar as the deployed comms MCP `send` and the reference courier's `entry.to` routing (#106). Name regex `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` per contract §2.4. |
| `subject` | yes | string ≤ 120 chars | Becomes the entry `summary`. It is the only thing a human sees in the preview chip. |
| `body` | yes | string | Becomes the human-readable part of the entry `text`. |
| `deadline_s` | **yes -- no default** | integer seconds | See §8.2. A signal with no deadline is a program that can hang forever. |
| `replyTo` | no | `<agent>@<team>` | Where the reply should be addressed. Defaults to the sending team's `default_inbox`. |
| `correlation` | no | string | Overrides the derived correlation id. Use only when resuming an exchange started elsewhere. |

### 3.3 Return value -- always a value, never an exception

`hubSignal()` **returns** for every protocol-level outcome and **throws only on programmer error**
(missing required argument, malformed `to`). This is not stylistic. The Workflow runtime documents
that a stage which throws inside `pipeline()` *"drops that item to `null` and skips its remaining
stages"*, and that a `parallel()` thunk which throws *"resolves to `null` -- the call itself never
rejects"*. **In this runtime, throwing is how a failure becomes silent.** The contract's standing rule
(§3, "no envelope = transport failure; nothing is assumed to have happened") generalises here as:
*nothing silent, ever* -- so Lelle returns a status the author is forced to branch on.

```js
{
  status: 'answered' | 'declined' | 'expired' | 'rejected' | 'unsent' | 'abandoned',
  correlation: 'framework-research.s73.g1',
  to: 'apex-research',
  payload: { verdict: 'approve', text: '...' } | null,   // present iff answered | declined
  error:   { code: 'E_...', detail: '...' }   | null,    // present iff rejected | unsent
  sent_at: '2026-09-04T10:47:00Z',
  answered_at: '2026-09-04T10:51:12Z' | null
}
```

### 3.4 States

```text
                        ┌─────────────┐
   hubSignal() ────────▶│   pending   │
        │               └──────┬──────┘
        │ deposit rejected     │ reply collected + authenticated (§6.3)
        │ in-hand              ├──────────────▶ answered   (peer said yes / gave data)
        ▼                      ├──────────────▶ declined   (peer said no, explicitly)
     rejected                  │ deadline passed
        │                      └──────────────▶ expired
        │ no response envelope
        └──────────────▶ unsent          any/first-wins race (§8.3) ──▶ abandoned
```

| State | Meaning | Terminal | The signal at the hub |
|---|---|---|---|
| `pending` | Deposited and accepted; no reply yet. | no | consignment delivered or waiting |
| `answered` | Reply collected, authenticated, and it carries a verdict other than a refusal. | yes | done |
| `declined` | Reply collected and authenticated; the peer explicitly refused. **A distinct state, not an error** -- a refused authorization is a successful exchange. | yes | done |
| `expired` | `deadline_s` elapsed with no authenticated reply. | yes | **still live.** Not cancelled (§8.2). |
| `rejected` | The hub refused the deposit **in-hand**, in the response envelope: `E_NOGRANT`, `E_UNKNOWN_TEAM`, `E_TOOBIG`, `E_MALFORMED`. | yes | never deposited |
| `unsent` | No response envelope after the courier's retry budget, or no island determined (§9). Per contract §3, nothing is assumed to have happened. | yes | unknown; retry is safe |
| `abandoned` | `hubSignalAny()` resolved on a sibling first. | yes | **still live.** Not cancelled (§8.3). |

**Three of the seven states leave a live consignment at the hub** (`expired`, `abandoned`, and
`unsent`-where-it-actually-landed). That is deliberate and it is the point of §8.2: Lelle has **no
cancel**. A late reply to an expired signal arrives as ordinary mail in the normal inbox, is visible
to a human, and is never discarded.

### 3.5 Idempotency and retry-safety

Three properties, each inherited rather than invented:

1. **Correlation ids are caller-derived and deterministic.** `correlation = <team>.<scope>.<seq>`,
   where `scope` identifies the workflow run and `seq` is the script's own signal counter. Workflow
   scripts cannot call `Date.now()` or `Math.random()` (both throw -- they would break resume), so a
   *deterministic* id is the only kind a script can produce, and the runtime constraint hands us the
   property we wanted anyway.
2. **A retried deposit dedups at the hub for free.** Contract §5.2: same `id` within the retention
   window returns `duplicate`, which *"is success, not error"*. The `id` is SHA-256 over the entry's
   canonical JSON, so retry-safety requires the entry bytes to be **stable across retries**. See the
   discipline in §5.3 -- this is the one place a naive implementation would break it.
3. **Re-entering a resolved signal is a no-op.** The signal file is keyed by correlation and written
   exclusive-create; a re-collected duplicate entry (the accepted at-least-once cost, courier-hints §6)
   re-writes the same content and is tolerated.

**Retention caveat.** Hub-side dedup is 7 days or 10k ids per directed pair (contract §6). A signal
re-sent with the same correlation *after* that window re-delivers rather than dedups. Deadlines longer
than 7 days are therefore out of Lelle's safe envelope; the spec does not forbid them, it flags them.

---

## 4. Where the primitive lives -- and why it is not a runtime change

**Finding, and it is the load-bearing one for scheduling: `hubSignal()` cannot be a new Workflow
runtime primitive shipped by this team, and it does not need to be.**

The Workflow script API is `agent()`, `parallel()`, `pipeline()`, `phase()`, `log()`, `workflow()`,
plus the `args` and `budget` globals. Adding a sibling to that list means changing the Claude Code
harness, which FR does not own. But the same API also states that scripts have **"No filesystem or
Node.js API access"** — so the script itself cannot read an inbox, write a spool, or open a socket.

The only thing in a workflow script that can touch the world is a subagent. Therefore:

> **`hubSignal()` is a plain JavaScript helper inside the script (or a saved sub-workflow invoked via
> `workflow()`), whose body is one `agent()` call to a courier-aware subagent that does the hub I/O and
> the waiting.** The park is the subagent's blocking poll.

```js
// The whole of hubSignal(), conceptually. No new runtime hook.
async function hubSignal({ to, subject, body, deadline_s, replyTo, correlation }) {
  return await agent(LELLE_SEND_AND_WAIT_PROMPT({ to, subject, body, deadline_s, replyTo, correlation }),
                     { label: `lelle→${to}`, schema: LELLE_RESULT_SCHEMA })
}
```

Consequences, all of them good for the programme:

- **Lelle v1 ships with zero harness changes and zero hub changes.** It is a library plus a courier
  rule. Rollout is a doc, a JS file, and a courier bump.
- **The `schema` option does the validation.** The runtime forces the subagent to call
  `StructuredOutput` and returns a validated object, so `hubSignal()`'s return shape (§3.3) is
  enforced by the tool layer, not by hand-parsing.
- **`agent()` returns `null` if the subagent dies on a terminal API error after retries.** The helper
  MUST convert that `null` into `{status:'unsent', error:{code:'E_AGENT_DIED'}}` before returning.
  A bare `null` reaching the author is the silent failure this design forbids.
- **The park costs one concurrency slot.** That is §7.1, and it is the single most important
  operational constraint in this spec.

**Rejected alternative -- park via the resume journal.** The runtime does offer a genuine
release-the-slot park: return the `runId`, let the workflow exit, and later relaunch with
`{scriptPath, resumeFromRunId}`, where *"the longest unchanged prefix of `agent()` calls returns cached
results instantly"*. Rejected for v1 for two reasons. First, it requires the **session** to know it
must come back and relaunch, which reintroduces exactly the session round-trip #107 set out to remove.
Second, correctness rests on a prefix cache: a resumed script whose earlier `agent()` prompts
interpolate any value that changed between the park and the resume invalidates the prefix and silently
re-runs the expensive upstream work. Carried as the v2 candidate in §12 gate 7, because it is the only
path to a signal that can park for days.

---

## 5. Wire format -- the Lelle header block

### 5.1 Where the header goes, and the collision that decides it

The correlation id rides **inside the entry's `text` field**, as a single machine-readable line.
Three facts force this and no other placement:

1. **Contract §4: `entry` is forwarded verbatim** (SPEC-v3 D9). Anything inside the entry crosses the
   hub untouched, with no hub change.
2. **Contract §4 erratum E1: the renderable body field is `text`,** and the canonical harness entry
   shape is `{from, read, summary, text, timestamp, type}`. Whether the harness *preserves* an unknown
   top-level key across its own read/write cycle is **`[speculative]` -- not verified.** A new
   top-level entry field is therefore the risky placement, not the clean one.
3. **The first line of `text` is already taken on the ghost-outbox path.** `company-courier.py`'s
   `parse_to_line()` (verified by direct read) parses *only* the first line and bounces the message if
   it is not `to: <team>` or `to: <agent>@<team>`. A Lelle header on line 1 would be bounced.

Hence the rule:

> **The Lelle header is the first line of `text` matching `^lelle/1 ` within the first five lines.**
> Bounded search, so it cannot be confused with prose, and it coexists with the mandatory `to:` line
> on the outbox path while remaining findable on the comms-MCP `send` path (which carries `to` as a
> tool argument and so has no `to:` line at all).

### 5.2 The two header forms

**Signal** (outbox path shown; on the comms-MCP path drop the `to:` line):

```text
to: schliemann@apex-research
lelle/1 signal cor=framework-research.s73.g1 reply-to=herald@framework-research deadline=2026-09-04T11:47:00Z

Authorization needed: the audit found 26 mutations, 3 of them destructive.
Reply `approve` or `decline`, or ask for anything you need.
```

**Reply:**

```text
to: herald@framework-research
lelle/1 reply cor=framework-research.s73.g1 verdict=approve

Approved for the 23 non-destructive mutations. Hold the 3 destructive ones.
```

| Token | Signal | Reply | Meaning |
|---|---|---|---|
| `cor=` | required | required | the correlation id; the only field the courier matches on |
| `reply-to=` | required | — | `<agent>@<team>` the reply should be addressed to |
| `deadline=` | required | — | absolute RFC3339 UTC; advisory to the peer, authoritative only locally |
| `verdict=` | — | required | `approve` → `answered`; `decline` → `declined`; any other token → `answered` with the token in `payload.verdict` |

`deadline=` is **advisory to the peer and authoritative only to the sender.** The hub does not read it
and the peer is not bound by it. It exists so that a human reading the message knows how long they
have, which is the only thing that actually makes a deadline useful.

### 5.3 The discipline that keeps retry-safety true

`deadline=` is an absolute timestamp, and workflow scripts cannot produce timestamps. The *sending
subagent* stamps it (it has Bash and `date`). A naive implementation would re-stamp on every retry,
changing the entry bytes, changing the SHA-256 `id`, and turning hub dedup into duplicate delivery.

> **Rule: the sending subagent composes and persists the fully-stamped entry to the local spool BEFORE
> the first deposit, and every retry re-sends those exact bytes.** This is not a new discipline -- it
> is the existing outbound path (courier-hints §3: outbox → rename → spool → deposit, delete on
> `accepted` or `duplicate`). Lelle reuses it unchanged; this note exists only because the deadline
> stamp is the one field that tempts an implementer to break it.

---

## 6. Courier-side additions

All three are additive, island-local, and none touches the hub.

### 6.1 The pending table

The sending courier keeps `<state_dir>/lelle/pending.json`: `{correlation → {to_team, sent_at,
deadline, reply_to}}`. Written when the signal is deposited `accepted`, entry removed when the signal
reaches a terminal state. This is the *only* place a parked signal is represented anywhere in the
system, and it lives on the customer side by design.

### 6.2 The signal-file dual-write, and its ordering

On the inbound leg, when a collected entry carries a `lelle/1 reply` header whose correlation is in
the pending table:

```text
inject (D11, unchanged)  →  signal-write  →  ledger-append  →  ack
```

**The signal-write sits before the ledger-append, and the order is load-bearing.** Courier-hints §6
establishes `inject → ledger` and explains why reversing it converts a rare duplicate into a rare
silent loss. The same argument places the signal-write on the inject side: if the signal-write came
*after* the ledger-append and the courier crashed between them, the re-collected entry would be found
in the ledger, **skipped**, and the signal file would never be written — the workflow would sit until
its deadline with the answer already delivered and discarded. That is a silent loss, and it is exactly
the failure class the whole system is built to refuse.

The signal-write is exclusive-create keyed by correlation and tolerates `EEXIST` (the duplicate
re-inject case). If the signal-write fails, the ledger is **not** appended — refuse-and-retain,
courier-hints §4.5, unchanged.

**The normal injection still happens.** A Lelle reply is also ordinary mail landing in a real inbox
where a human can see it. Lelle adds a machine-readable copy; it never replaces the human-visible
trail.

### 6.3 Reply authentication -- the one real gap the grant model does not close

The correlation id lives in the entry body, and the entry body carries no authentication beyond the
hub's `from_team` stamp. A granted peer could therefore reply to a correlation it was never sent.

> **Rule: a `lelle/1 reply` is accepted into a signal file only if (a) its correlation is in the local
> pending table AND (b) the hub-stamped `from_team` equals the team the signal was sent to.**

Both facts are known locally; neither needs the hub. Contract §4 already guarantees (b) is
unspoofable: *"`from_team` -- stamped by the hub from the authenticated channel, never from message
content... The receiving courier MUST derive local attribution from `from_team` and MUST NOT trust any
team claim inside `entry`."* An unmatched reply injects as normal mail and logs **WARN** — visible,
never silently dropped.

### 6.4 Age alarm

The stale-inbound WARN (courier-hints §6a, threshold 1 h [CONV]) applies to Lelle traffic unchanged.
Lelle adds a second, sender-side alarm: **WARN once per cycle for any pending correlation past its
deadline.** This is the receiving half of the same lesson that
[`at-least-once-without-age-alarm-hides-unbounded-latency`](../../../teams/framework-research/wiki/gotchas/at-least-once-without-age-alarm-hides-unbounded-latency.md)
recorded at n=6 with a ten-week observed latency.

---

## 7. Answering #107's four open questions

### 7.1 Q1 -- should the parked workflow hold a slot, or release it and resume on signal?

**Recommendation: hold the slot in v1. The waiting subagent *is* the park.**

Mechanism, not preference: §4 shows the only thing a workflow script can block on is an `agent()`
call, so a parked signal necessarily occupies one agent slot. Concurrent `agent()` calls are capped at
`min(16, cpus - 2)` per workflow.

**Rejected:** release-and-resume via the resume journal. Reasons in §4 — it reintroduces the session
round-trip, and its correctness rests on a prefix cache that silently re-runs upstream work when an
interpolated value changes. Carried as the v2 candidate (§12 gate 7).

**The rule that makes holding a slot safe, and it names a real deadlock:**

> **A workflow MUST NOT hold more parked signals than half its concurrency cap, and by default holds
> at most one.**

A `parallel()` of twelve signals against a ten-slot cap does not degrade — it **deadlocks**, because
every slot is blocked waiting and no slot is left for the `agent()` calls that would produce the
answers on this side. The helper library enforces the cap and `log()`s when it queues, per the runtime's
own *"no silent caps"* discipline.

**PO decision needed?** No. This is an engineering call and it is made here.

### 7.2 Q2 -- timeout semantics: what happens if the authorization never comes?

**Recommendation, in three parts:**

1. **`deadline_s` is required, with no default.** A default would let an author ship a workflow that
   can hang forever, and this system already has the scar: n=6 consignments sat for up to ten weeks
   with nothing alarming, because at-least-once delivery without an age alarm has no upper bound.
   Requiring the argument makes the author think about the number once.
2. **Expiry returns `{status:'expired'}`. It does not throw, and it does not cancel.** The deposit
   already happened; the peer may still answer; a late reply lands in the normal inbox as ordinary
   mail. The pending-table entry is retained for one further poll cycle and logged, so a late arrival
   is attributable rather than mysterious.
3. **There is no `cancel` verb, at the hub or in Lelle.**

**Rejected: a hub-side TTL on signals.** Contract §6 is unambiguous — *"No TTL, no drops... uncollected
mail is held indefinitely in v1... Staleness is a visibility problem (`status`), not a deletion
policy."* A Lelle TTL would be the first drop policy in the system and would contradict a ratified
invariant to solve a problem that a return value already solves.

**PO decision needed? Partly.** The *house default deadline for human-gated signals* is a policy about
how long a human may reasonably take to answer, which is the PO's to set. **Recommendation: 3600 s**
as the documented starting point for gate-shaped signals, with the author free to override per call.

### 7.3 Q3 -- can a workflow send to multiple teams and await any/all?

**Recommendation: yes, as workflow-side helpers over N single signals. No hub change, no multicast
verb.**

```js
const all = await hubSignalAll({ to: ['apex-research', 'paunvere'], ... })  // every team, or deadline
const any = await hubSignalAny({ to: ['apex-research', 'paunvere'], ... })  // first authenticated reply
```

- **The fan-out send is already one hub round-trip.** Contract §5.2 allows up to 100 consignments per
  `deposit` conversation, and each consignment carries its own `to` (§4). Multicast send exists today
  and needs nothing new.
- **`hubSignalAll` returns partial results, never a bare failure.** An array of per-team result objects
  (§3.3), each with its own status. One team's `expired` never masks another's `answered`.
- **`hubSignalAny` resolves on the first authenticated reply and marks the siblings `abandoned`.**
  Abandoned signals are *not* cancelled (§3.4); their late replies land as ordinary mail.
- **§7.1's slot budget binds.** N parked signals need N slots; the helper enforces the same half-cap
  rule and logs what it queued.

**Rejected: a hub-side fan-out or quorum verb.** It would require the hub to understand what a
conversation *means*, which is precisely what the post-office model refuses — the hub carries mail and
performs consent checks, and knows nothing else about the traffic.

**PO decision needed?** No.

### 7.4 Q4 -- does `hubSignal()` need additional constraints on the grant model?

**Recommendation: no new hub constraints. One new courier-side rule, and one honest limitation the PO
must accept explicitly.**

The existing model already carries most of the weight:

- Consent is enforced at **deposit** time (§5.2), so an ungranted signal is refused **in-hand** as
  `rejected/E_NOGRANT` rather than silently queued.
- `from_team` is stamped by the hub from the authenticated channel and cannot be spoofed (§4).
- A reply is ordinary mail, so it needs the reciprocal grant that any two-way route already requires.
  A Lelle exchange is therefore exactly as constrained as any conversation: **two grants.**

**The one new rule is §6.3** (correlation must be pending AND `from_team` must match the target),
which closes the reply-injection gap without touching the hub.

**The honest limitation: Lelle authorization binds at team granularity, not agent granularity.**
Agent-level grants are explicitly deferred (contract §9), and the `@` in `<agent>@<team>` is a courier
routing convenience (#106) that never reaches the wire. So **any agent inside a granted peer team can
answer any of that team's signals.** For a gate that carries real authority this is a property the PO
should know about, not a footnote. **Recommendation: accept for v1** — the peer *team* is already the
trust unit for every existing gate in this system, and Lelle does not make it weaker. Recorded as
§12 gate 5.

---

## 8. Change classification

Per [`playbooks/version-typed-contract.md`](../../../teams/framework-research/playbooks/version-typed-contract.md):
the bump level is set by the **consumer's type-check work**, never by the migration mechanism.

Applying the type-check delta gate to Lelle: take a conformant courier's existing view of the
consignment and envelope shapes and run it against Lelle traffic. **It type-checks unchanged.** A
Lelle signal is a consignment whose `entry.text` happens to contain a line. Nothing in the envelope,
the consignment wrapper, the verb set, or the response shapes moves.

| Change | Class | File | Version effect |
|---|---|---|---|
| `lelle/1` header block convention | Courier-side convention `[CONV]` | `designs/deployed/stationmaster/stationmaster-courier-hints.md` — new §10 | none |
| Pending table (§6.1) | Courier-side addition | courier implementations | none |
| Signal-file dual-write + ordering (§6.2) | Courier-side addition | courier implementations + courier-hints §6 cycle diagram | none |
| Reply authentication rule (§6.3) | Courier-side addition | courier-hints §10 | none |
| Deadline-passed WARN (§6.4) | Courier-side addition | courier-hints §6a | none |
| `hubSignal` / `hubNotify` / `hubSignalAll` / `hubSignalAny` | **Workflow-side library** | new, under `designs/new/lelle/` | none |
| Reserving the `lelle/1` first-five-lines namespace inside `entry.text` | **Erratum E5** | `designs/deployed/stationmaster/stationmaster-protocol.md` §4 + §11 table | **no bump** |
| **Hub / wire shape** | **NO CHANGE** | — | — |

### 8.1 The one contract edit, and why it is an erratum

**E5 (proposed):** §4 gains a sentence reserving `^lelle/1 ` within the first five lines of `entry.text`
as a courier-convention namespace, and noting that the hub forwards it verbatim like any other body
content. §11 gains the corresponding row.

**Why erratum and not minor.** Both gates from the playbook:

- *Type-check delta gate.* A consumer's type definitions for the envelope, consignment and response
  shapes are untouched. Type-check passes → not major.
- *Runtime semantics delta gate.* Existing well-typed consumer code produces **identical** observable
  behaviour: a courier that has never heard of Lelle forwards, injects and acks a Lelle message exactly
  as it does any other message, and the human recipient reads it with one extra line at the top. No
  behaviour change → **erratum, not minor.**

This is a namespace reservation, not a feature. It exists so that a future convention does not claim
the same lines, and so the backlog is enumerable without re-reading the contract (§11's stated purpose).

### 8.2 Contract items Lelle does not change but does re-prioritise

- **`waiting_for_me[*].oldest` — candidate minor `1.1.0`, already in the §11 erratum backlog.**
  Lelle raises its value: a parked workflow's own team is the receiving side, and the receiving side
  currently cannot compute oldest-unacked age from `status` at all. Still not *required* for Lelle
  (§6.4's alarm is courier-local, and the courier holds `deposited_at` from `collect`). Recommend it
  ride the first Lelle release rather than being pulled forward on its own.
- **§9's agent-addressing wording** — already in the backlog as describing-as-future what is deployed.
  Lelle's `reply-to=<agent>@<team>` depends on that deployed behaviour, so the wording fix should land
  before Lelle's docs cite it.

---

## 9. Island behaviour -- what happens when a signal targets the other island

**Verified, not reasoned.** The `prod-llm` registry read at 2026-09-04 07:43 UTC holds five names, and
`po-team`, `mvox` and `passepartout` are not among them (§10). A signal from the EVR island to a
personal-island team therefore fails at deposit with:

```json
{"id":"...","to":"po-team","status":"rejected","error":{"code":"E_UNKNOWN_TEAM"}}
```

`hubSignal()` returns `{status:'rejected', error:{code:'E_UNKNOWN_TEAM'}}` — **in-hand, in the response
envelope, immediately, never as a timeout.** This is the brief's `E_NOGRANT`-class outcome, and the
precise code matters diagnostically:

| Code | Means |
|---|---|
| `E_NOGRANT` | registered on this island, but has not granted you |
| `E_UNKNOWN_TEAM` | **not on this island at all** — the island signal |

### 9.1 The three normative rules

1. **Lelle never retries a signal against another hub.** Cross-island fallback would violate the
   partition invisibly — *"mail would appear to work while quietly crossing a boundary the design says
   nothing crosses"*
   ([`island-local-everything-only-the-repo-crosses`](../../../teams/framework-research/wiki/patterns/island-local-everything-only-the-repo-crosses.md)).
   A failed signal is **reported**, never failed over.
2. **The hub is resolved from the startup host-check table, never from reachability.** Per the
   dual-homing spec §5: determination is explicit (hostname/OS), fail-closed on the third row. A
   `hubSignal()` on an undetermined host returns `{status:'unsent', error:{code:'E_NOISLAND'}}` —
   a **Lelle-local code**, deliberately outside the contract's `E_` namespace, because it never
   reaches the wire.
3. **Nothing that must cross islands is a signal.** It is a git commit (state) or a human (decision).
   Lelle changes nothing about that ruling and adds no exception to it.

### 9.2 The consequence worth stating plainly

Because `po-team` is on the other island, **the coordination shape that motivated #107 — a dev-side
workflow parking on a po-team authorization — is not expressible on the EVR island today.** #107 was
written on 2026-08-13 against the po-team/mvox pattern, two weeks before the two-islands ruling
(2026-08-27) partitioned exactly those parties away from FR's hub. Lelle inherits the ruling; the
prior-art pair it was designed from is out of scope by construction. What remains on the EVR island is
`framework-research ↔ apex-research`, which is a real and fully-granted pair (§10) but a different
relationship: peer research teams, not a dev team and its product owner.

---

## 10. Fleet inventory -- the EVR island as it actually is

### 10.1 The registry, read live

Command, run from the FR courier key on the EVR Windows box at 2026-09-04 07:43 UTC:

```sh
SM="ssh -T -i ~/.ssh/sm_framework-research -p 2222 -o BatchMode=yes -o ConnectTimeout=15 sm@10.100.136.162"
printf '%s\n' '{"v":1,"cmd":"registry"}' | $SM
```

Output, verbatim:

```json
{"v":1,"ok":true,"cmd":"registry","ts":"2026-09-04T07:43:47Z"}
{"teams":[{"name":"alpha","registered":"2026-06-12T14:23:06Z","last_seen":"2026-06-12T14:23:09Z"},{"name":"apex-research","registered":"2026-06-12T14:46:51Z","last_seen":"2026-09-04T07:43:22Z"},{"name":"beta","registered":"2026-06-12T14:23:07Z","last_seen":"2026-06-12T14:23:08Z"},{"name":"fr-test","registered":"2026-06-12T14:42:34Z","last_seen":"2026-06-12T14:47:00Z"},{"name":"framework-research","registered":"2026-06-12T14:28:46Z","last_seen":"2026-09-04T07:43:47Z"}]}
```

`status` and `ping` from the same key, same minute:

```json
{"team":"framework-research","grants_in":[{"from":"fr-test","since":"2026-06-12T14:43:23Z"},{"from":"apex-research","since":"2026-06-15T06:48:26Z"}],"grants_out":[{"to":"apex-research","since":"2026-06-12T14:47:00Z"},{"to":"fr-test","since":"2026-06-12T14:43:22Z"}],"waiting_for_me":{},"deposited_uncollected":{},"hub":{"uptime_s":7233674,"protocol":1}}
{"team":"framework-research","fingerprint":"SHA256:nkmhWNccqwpk5t4tQmLbrPOJoIcQZAr2jPomCegDpyQ","protocol":1}
```

Hub uptime 7,233,674 s ≈ **83.7 days**, consistent with the 2026-06-12 deploy recorded in the runbook.
Backlog is clean in both directions: `waiting_for_me` and `deposited_uncollected` are both empty.

### 10.2 Who is on the island

| Team | Registered | Last seen | Class | Courier | Currency | Lelle-ready? |
|---|---|---|---|---|---|---|
| `framework-research` | 2026-06-12 | **2026-09-04 07:43** | Solo/host session, script-pair courier | `fr-courier-daemon.py` on the EVR Windows box, launched by `start-fr-courier.ps1` / `restart-fr-courier-with-pid.ps1` | **At or ahead of #106 on inbound** — `resolve_target_inbox()` routes on `entry["to"]` with three guards, team-lead-ratified 2026-06-15. Wraps the reference courier's `inject_batch` (D11) verbatim. | Yes, after the §6 courier additions |
| `apex-research` | 2026-06-12 | **2026-09-04 07:43** | Team container, **entrypoint-supervised** courier | `stationmaster-courier.reference.py` supervised at `entrypoint-apex.sh` Step 9e, config `courier.json`, both inside the apex repo | **`[speculative]` — not verified.** The file lives in the apex repo, which this spec did not read. Its #106 currency and its inbound-routing behaviour are unknown here. | Yes in principle; **currency must be measured before scheduling** |
| `alpha` | 2026-06-12 | 2026-06-12 | Scratch name, S49 survey | none | — | No. Slated for revocation by the EVR formation spec §7 |
| `beta` | 2026-06-12 | 2026-06-12 | Scratch name, S49 survey | none | — | No. Same |
| `fr-test` | 2026-06-12 | 2026-06-12 | Scratch name, S49 survey | none | — | No. Same, **and it holds live reciprocal grants with FR** (see 10.4) |

**The only live, fully-granted, Lelle-capable pair on the EVR island is `framework-research ↔
apex-research`.** Both grant directions are present and both couriers were seen at the hub within the
same minute.

### 10.3 Who is *not* on the island, and both answers were checked rather than assumed

- **Pepys — NOT a hub registrant.** No such name in the registry. Pepys is an agent name in the
  apex-research truth-loop playbook. If Pepys is reachable at all it is as `pepys@apex-research`,
  which is **courier-side agent routing (#106), not a hub registration** — the agent part never reaches
  the wire (contract §9). Any Lelle signal naming `pepys@apex-research` deposits to team
  `apex-research` and depends entirely on apex's courier honouring `entry.to`, which is the
  unverified cell in 10.2.
- **Paunvere — NOT a hub registrant, and has no courier at all.** Not in the registry, and a grep of
  the entire `designs/deployed/joosep/` package (the container, entrypoint, compose, runbook and the
  `teams/paunvere/` config) returns **zero** occurrences of `courier` or `stationmaster`. The Paunvere
  deployment is a personal workbench container on RC `100.96.54.170:2231`, live since 2026-08-31, with
  no mail wiring of any kind. **The brief's "Paunvere-class deployment with entrypoint-supervised
  courier" describes apex-research, not Paunvere.** For Paunvere, "adopt Lelle" is not a courier bump —
  it is stationmaster onboarding Steps 1 through 6 from nothing, plus a registration, plus a grant
  round, and only then the §6 additions. That is a materially larger piece of work and it should be
  scheduled as its own item.
- **`po-team`, `mvox`, `passepartout`** — personal island, out of scope by the #108 ruling (§9).

### 10.4 Two hygiene findings surfaced by the read

1. **`fr-test` holds live reciprocal grants with `framework-research`** (`grants_in` since
   2026-06-12T14:43:23Z, `grants_out` since 14:43:22Z) and has not been seen since 2026-06-12. It is a
   survey-era scratch key with a standing two-way route into FR's inbox. The EVR formation spec §7
   already schedules its revocation; this is an independent reason to run that spec **before** Lelle
   ships, because §6.3's reply authentication trusts the grant list.
2. **The running hub image is still the pre-#97 build** (runbook Part 1.1: built at reference `f022fed`,
   2026-06-12; uptime confirms the container has not been recreated since). The formation upgrade is
   PENDING. Lelle needs no hub change, so it is not blocked on this — but shipping a gen-3 method onto
   an unupgraded gen-2 hub should be a conscious choice, not an oversight.

### 10.5 What each participant class must change

| Class | Example | To adopt Lelle |
|---|---|---|
| **Solo / host session, script-pair courier** | `framework-research` | Courier: §6.1–6.4. Restart via `restart-fr-courier-with-pid.ps1` (the live courier is launched by the script pair, not the dormant Scheduled Task). Config gains `lelle_dir`; config stays **gitignored** per `island-local-everything`. Workflow library added to the repo. |
| **Team container, entrypoint-supervised courier** | `apex-research` | Same courier additions in their vendored copy, then a **container recreate** to pick it up (`up -d --force-recreate` — plain `up -d` does not adopt a rebuilt image, S52 gotcha). Their pre-created inboxes dir and boot-time stale-lock clean (Step 9e) already cover the boot-order hazards a new state dir would otherwise reintroduce. `lelle_dir` must sit on the **persistent** volume, not the ephemeral `~/.ssh`-style paths. |
| **Paunvere-class deployment (no courier)** | `paunvere` / joosep | Onboarding Steps 1–6 first: key, registration (operator, human step), fingerprint pin, grants, hand first message, then a courier — and only then §6. Treat as a new-customer onboarding, not a Lelle rollout. |
| **Scratch registrations** | `alpha`, `beta`, `fr-test` | Nothing. Revoke per the formation spec. |

---

## 11. Consumer check -- expressing the apex truth loop's gates in Lelle

The primary consumer shape is a gate inside a workflow. Tested against
[`gated-answer-loop-with-reader-owned-exit`](../../../teams/framework-research/wiki/patterns/gated-answer-loop-with-reader-owned-exit.md).

### 11.1 Station 5 — the GATE — expressible in shape, with no counterparty today

Station 5 is the loop's single human decision point, forking `escalate` / `unclear` / `approve`, and
it reads the **reader-facing** text. In Lelle:

```js
phase('Gate')
const gate = await hubSignal({
  to: 'schliemann@apex-research',
  subject: `GATE VEO-183: ${draft.title}`,
  body: `${translated}\n\nFork: approve | unclear | escalate`,
  deadline_s: 3600,
  replyTo: 'herald@framework-research',
})

switch (gate.status) {
  case 'answered':
    if (gate.payload.verdict === 'approve')  { phase('Publish'); await agent(publishPrompt(translated)) }
    if (gate.payload.verdict === 'unclear')  { /* → station 4, translate again */ }
    if (gate.payload.verdict === 'escalate') { /* → station 6, formalize claims */ }
    break
  case 'declined': /* an explicit refusal is a fork, not an error */ break
  case 'expired':  log('gate unanswered within 1h — the human is the fallback'); break
  case 'rejected': log(`gate unreachable: ${gate.error.code}`); break   // island signal, §9
  case 'unsent':   log('nothing assumed to have happened; safe to retry'); break
}
```

The three-way fork maps cleanly onto `verdict=`, and the `switch` is exhaustive over §3.4 — which is
the whole reason `hubSignal()` returns instead of throwing.

**But the gate's actor is a *human*, and the hub has no humans.** Lelle can express station 5 only if
a registered *team* stands in for the human, receiving the signal and relaying the ruling. On the EVR
island there is no such team registered today: the registry holds two working teams and three dead
scratch names, and the product-owner team is on the other island (§9.2). **So station 5 is expressible
in shape and has no counterparty in the current fleet.** This is a finding, not a defect in the
primitive, and it is §12 gate 3.

### 11.2 Station 9 — the done-poll — NOT expressible, and this is the finding

Station 9 is the reader's declaration that the answer landed. Their playbook makes the conductor
**poll the stakeholder surface** (Jira, email) on re-entry, with the human as fallback rather than
mechanism.

**Lelle cannot express this, and the reason is structural rather than incidental.**

> `hubSignal()` waits for **a reply to a message it sent**. Station 9 waits for **an unsolicited state
> change on a third-party surface**. There is no correlation id, because nobody was asked. There is no
> `from_team`, because the event does not arrive through the hub at all.

Generalised: **Lelle expresses solicited replies, not observations.** Anything that would express
station 9 is a *watch* primitive over a non-hub surface — a different thing, with a different failure
model (polling, no custody chain, no at-least-once guarantee), and it is out of Lelle's scope. Named
here so it is not later discovered as a gap.

The observation sharpens the wiki entry's own point. That entry's strongest cross-team finding is that
**every FR protocol closes on the producer** — *"None of them names who may declare the exchange
complete."* Lelle, honestly assessed, does not fix that: a Lelle exchange closes when the *sender's*
deadline expires or the *sender's* courier authenticates a reply. The one station in the truth loop
that is genuinely reader-owned is precisely the one Lelle cannot express. **That is not a coincidence,
and it is worth carrying to the topic files:** a primitive built on solicited replies can only ever
close on the soliciting party.

### 11.3 Station P — the tripwire — expressible, and it is `hubNotify()`

The propagation tripwire runs on a different clock from the answer, and the loop *"walks on to station
3 without waiting"*. That is `hubNotify()` exactly (§3.1): deposit, do not park, do not consume a slot.
The existence of the second verb is what stops an author from parking on it out of habit.

---

## 12. PO gate list

Each item is one sentence, with a recommendation. Items 1–5 gate v0.1 → v1.0; 6–8 are scheduling.

1. **Adopt Lelle as an extension of the stationmaster post-office with no hub or wire change, shipping
   as a courier rule plus a workflow-side library?** — *Recommend YES; the whole spec is built so this
   answer costs nothing at the hub.*
2. **Accept erratum E5 on contract v1.0.0** (reserving `^lelle/1 ` within the first five lines of
   `entry.text`), with **no version bump**, per both gates of the version playbook? — *Recommend YES;
   it is a namespace reservation with zero type-check delta and zero behaviour delta.*
3. **Given that the product-owner team is on the personal island and no gatekeeper team is registered
   on the EVR island, which team is the counterparty for a gate-shaped signal?** — *Recommend naming
   `apex-research` as the v1 counterparty and shipping FR↔apex first, treating human-gated signals as
   a later capability that needs a registered gatekeeper.*
4. **Set the house default deadline for human-gated signals** (the one policy number in this spec, and
   a judgment about how long a human may take)? — *Recommend 3600 s, documented as a starting point,
   with `deadline_s` remaining a required argument so no author inherits it silently.*
5. **Accept that Lelle authorization binds at team granularity — any agent in a granted peer team can
   answer any of that team's signals** — since agent-level grants are deferred at contract §9? —
   *Recommend YES for v1; the peer team is already the trust unit for every existing gate, and Lelle
   does not weaken it.*
6. **Run the EVR formation spec before Lelle ships**, revoking `alpha`, `beta` and `fr-test` — the last
   of which holds live reciprocal grants with FR and has not been seen since 2026-06-12? — *Recommend
   YES and treat it as a prerequisite, because §6.3's reply authentication trusts the grant list.*
7. **Fund the v2 release-the-slot park** (return `runId`, resume via `resumeFromRunId`), which is the
   only path to a signal that can park for days rather than minutes? — *Recommend DEFER until v1 has
   produced a real signal that needed it; the prefix-cache correctness risk in §4 is not worth taking
   speculatively.*
8. **Schedule Paunvere separately from the Lelle rollout**, since it is not registered on the hub and
   runs no courier at all? — *Recommend YES; for Paunvere this is stationmaster onboarding from
   nothing, not a courier bump, and bundling it would hide the real cost.*

---

## 13. What is verified and what is not

**Verified by direct read or live call:**

| Claim | Evidence |
|---|---|
| EVR registry membership, grants, hub uptime, fingerprint | Live `registry` / `status` / `ping`, 2026-09-04 07:43 UTC, transcribed verbatim in §10.1 |
| Pepys and Paunvere are not hub registrants | Same registry read; plus zero `courier`/`stationmaster` hits across `designs/deployed/joosep/` |
| The first line of `text` is already claimed on the outbox path | `company-courier.py` `parse_to_line()`, read directly |
| FR's courier does #106-style `entry.to` routing | `fr-courier-daemon.py` `resolve_target_inbox()`, read directly |
| apex's courier is entrypoint-supervised at Step 9e | `entrypoint-apex.sh` lines 557–606, read directly |
| Workflow script API surface, `throw`-becomes-`null`, no filesystem, no `Date.now()`, resume-by-prefix | `workflow-authoring` skill, loaded this session |
| Contract semantics cited throughout | `stationmaster-protocol.md` v1.0.0, read in full |

**`[speculative]` — explicitly not verified:**

- **apex-research's courier currency and its #106 status.** The file lives in the apex repo, which this
  spec did not read. §10.2's cell says so; it must be measured before apex is scheduled.
- **Whether the harness preserves unknown top-level keys on an inbox entry across its own read/write
  cycle.** This is *why* §5.1 puts the header inside `text` rather than testing the assumption — the
  design routes around the unverified fact instead of depending on it.
- **The disclaimer benefit from #107.** §2 states plainly that Lelle neither controls nor promises it.
- **Every performance claim about the truth loop's reference case.** Inherited as the source team's
  report via the wiki entry, which itself records them as unverified.

---

*Design seed: mitselek/ai-teams discussion #107 (2026-08-13, mitselek), worked here for the first
time. Work ledger: issue #116. Contract authority: `designs/deployed/stationmaster/stationmaster-protocol.md`
v1.0.0 — where this spec and the contract disagree, the contract wins.*

(*FR:Herald*)
