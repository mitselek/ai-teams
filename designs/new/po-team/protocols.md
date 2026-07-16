# Product-Owners Team -- Communication & Handoff Protocols

(*FR:Herald*)

**Status:** rev 5 (2026-07-16) — §1 rewritten to the ratified inbox comms architecture (#90, ratified 2026-07-15): comms MCP `send`/`read_mail`, outbox `to:`-convention, per-team courier daemon + stationmaster hub; tmux demoted to persistence (layer 4) with an emergency-access appendix. rev 4 (2026-07-14, S60): added §1.6 control-message semantics (stop≠revert; act at boundaries), commissioned by Mihkel, cross-ref'd from §3. rev3: four PO decisions folded in; §6 tracks resolved vs. still-open. Concrete epic/task issue standard: `designs/new/po-team/issue-standard.md` (§2).
**Scope:** the rules of communication and handoff for the new `product-owners` team. Roster/persona composition is Celes's artifact, not this one.

**Channel decision (SUPERSEDED 2026-07-15; see #90):** the 2026-07-14 decision for literal interactive tmux driving (`send-keys`/`capture-pane`) was reversed by the ratified inbox-based comms architecture. The PO<->remote-team channel is now **native-inbox message-passing** over the stationmaster hub — §1 specs it as the critical path. tmux survives only as the **persistence layer** (the remote session's process supervisor), never as a channel a PO types into in normal operation. The retired driving contract is preserved in git history; emergency pane access is Appendix A.

## 0. The team in one picture

```
  sagres (PO team + hub)                                      shipyard (per-product containers)
 ┌─────────────────────────────┐                             ┌──────────────────────────────────┐
 │ team-lead (work hub)        │      ┌─────────────────┐    │ courier daemon (per team)        │
 │   ├── PO:mvox ──────┐       │      │ stationmaster   │    │   IN:  collect+ack ──▶ inject    │
 │   ├── PO:...        ├─ send()──▶───│ hub (sm@2222)   │◀───│        into live session inboxes │
 │   │    (comms MCP)  │       │      │ per-team spool  │    │   OUT: outbox ghost drop ──▶     │
 │   └── librarian     │       │      │ + grants        │    │        parse to: ──▶ deposit     │
 │  (knowledge hub)    │       │      └───────┬─────────┘    │ remote team-lead + team          │
 │                             │              │              │  (claude session, tmux = layer-4 │
 │ courier daemon (PO team) ◀──┼─ collect+ack ┘ (poll)       │   persistence only)              │
 │   └─ inject ──▶ team-lead   │                             └────────────────┬─────────────────┘
 │      inbox (V1: ALL inbound │                                              │
 │      lands in team-lead)    │                                              │
 │                             │                                              │
 │ local clone (READ-ONLY) ◀───┼── git fetch ──┐                              │
 └─────────────────────────────┘               │                              │
                                            GitHub ◀──────────────────────────┘
                                  (durable work-of-record)
                                     epics / tasks / PRs
```

**Two channels, two jobs:**

| Channel | Substrate | Carries | Property |
|---|---|---|---|
| **Attention** | native inboxes, via the comms MCP `send` tool + per-team courier daemons + the stationmaster hub | "new task" out, "task delivered" back — pointers into GitHub, free-text correspondence | asynchronous; deposit confirmed only after on-disk (safe to retry); synchronous hub verdict on every MCP `send()` (the ghost-drop path's feedback is a parse-fail bounce to the sender's inbox, §1.2); every failure loud, back to the initiator |
| **Work-of-record** | GitHub (epics, tasks, PRs) | the durable work item, its acceptance criteria, the merged result | durable, auditable, versioned; the single source of truth |

**The relationship between them (load-bearing):** mail *points at* the work; GitHub *records* it. A well-formed message is usually "pick up epic #47" — the specification lives in the issue, the mail just rings the doorbell. **Completion is confirmed at two levels:** the reply mail tells you the remote lead *heard* and *reports* done; the GitHub issue/PR tells you the *work* is done. The inbox is never the system of record — on any mismatch between mail and record, **the record wins**. If the remote container is rebuilt or the session dies, nothing durable is lost because the work lives in GitHub and undelivered mail sits visibly on the hub (`deposited_uncollected`, §1.4).

---

## 1. PO <-> remote-team channel -- inbox comms over the stationmaster hub (CRITICAL PATH)

**Participants:** one PO (sender/owner of the product relationship) and the remote team's lead, each a live `claude` session with native inboxes. Nobody types into anybody else's pane in normal operation.

**The four layers (#90, ratified):**

1. **Work of record** — GitHub epics/issues. Everything below carries signals *about* this layer, never content.
2. **Attention** — "new task" out / "task delivered" back, via native inboxes.
3. **Transport** — per-team courier daemon. IN: the daemon polls the hub (`collect+ack` — nothing lost between), injects into the live session's inboxes. OUT: a member drops a message on the outbox ghost member, the daemon parses the `to:` line and deposits to the hub. Poll interval (currently 12s) is the attention-latency knob.
4. **Persistence** — tmux, demoted to keeping the remote session alive. A PO never types into a remote pane in normal operation (§1.7, Appendix A).

**Hub (protocol v1.0.0, live on sagres — `sm@100.102.133.125:2222`):** one ssh connection per exchange, JSON request/reply. The per-team ssh key **is** the identity (`~/.ssh/sm_<team>`). Verbs: `deposit` (send — confirmed only after on-disk; safe to retry), `collect`+`ack` (receive), `grant` (per-team allow-list), `status` (both directions of health, incl. `deposited_uncollected`). The hub is pull-only; daemons poll. The PO team and the hub share the box (sagres); product-team containers live on shipyard.

### 1.1 Sending -- the comms MCP `send` tool (primary interface)

Every team session runs an MCP server `comms` (#100, deployed and live-proven both directions 2026-07-16). The primary agent-facing send is:

```
send(to, message)
```

- **`to`** — `<team>` or `<agent>@<team>` (§1.2 addressing rules). Validated before anything leaves the session.
- Deposits **directly to the hub** via the team key and returns the **synchronous hub verdict**: `{status: accepted | duplicate | rejected (+error code, e.g. E_NOGRANT, E_UNKNOWN_TEAM) | error}`.
- `accepted` means on-disk at the hub — the message will be collected by the target's courier or show up in `deposited_uncollected` (§1.4); it cannot silently vanish.
- `duplicate` is the retry-safe answer: re-sending after an ambiguous failure is always safe.
- `rejected`/`error` come back **in the same call** — the PO knows immediately, acts immediately. No fire-and-forget, no queue to wonder about.

Native `SendMessage` cannot reach the outbox; `send` is the send path. The outbox ghost drop (§1.2) remains as the daemon-side convention and the alternate path for members without the MCP tool.

**Point at the work, don't respecify it.** The message is normally a pointer to a GitHub epic/task (§2); the specification lives in the issue. If a PO finds itself writing a paragraph of requirements into a mail body, that paragraph belongs in an issue, not in mail (mail is attention, not record — §1.3).

### 1.2 Addressing & the outbox convention

**Address forms:** `to: <team>` (lands in the team-lead's inbox) or `to: <agent>@<team>`. Unknown agent → team-lead inbox. Names: alnum start, `[A-Za-z0-9._-]`, max 64. The hub routes and grants **per team only**; the agent part is receiving-side routing.

**Outbox convention (ratified 2026-07-15), for the ghost-drop path:** first line `to: <team>` or `to: <agent>@<team>`; the rest of the message is the body, forwarded **verbatim**. The daemon parses **exactly one line ever** — the `to:` line. Daemon rule: parse → deposit; parse-fail → **bounce to the sender's own inbox**. Exactly two outcomes, nothing silent.

**Known V1 limitations (accepted, not bugs to route around):** delivered `from:` shows the courier (e.g. `mvox-courier`), not the origin agent — sign the body if identity matters; agent-level receive routing currently all lands in `team-lead.json`.

### 1.3 Receiving -- inbox surfacing, `read_mail`, and the attention vocabulary

**Surfacing:** a session with an active team (≥2 members) surfaces inbound mail automatically. A **solo session never auto-surfaces its inbox** — it must call the second comms tool, `read_mail()`: a non-destructive pull of the team's inbound inbox. A solo PO working a product builds `read_mail` into its working rhythm (start of a work block, before reporting status); an unread inbox on a solo session is the one place this architecture can go quiet, and the habit is the guard.

**Attention vocabulary (Gap 4, ratified 2026-07-15): FREE TEXT.** There is no signal grammar. The daemon parses exactly one line ever (`to:`); the body is free-form correspondence, conversations included. "Signals, not content" survives as **prompt-level discipline, not enforcement**:

- The record holds the work; mail points at it; on mismatch **the record wins**.
- The conscious risk is mail drifting into a second work record. The guards are role-prompt norms and the grooming habit: anything in a mail thread that turned out to be load-bearing gets promoted into the issue it belongs to, and the thread ends with a pointer.

**Completion is two-level and this is deliberate.** A "done" mail tells you the remote lead *says* it is done. The **durable** confirmation is on **GitHub**: the task issue closed, the PR merged, the epic checklist advanced (§2). Never report work complete off mail alone.

### 1.4 Failure semantics -- everything loud, everything back to the initiator

**NO FALLBACKS.** Every failure fails loud, back to the initiator. The full failure surface:

| Failure | How it surfaces | Where it lands |
|---|---|---|
| **Bad address / no grant / unknown team** | `send` returns `rejected` + error code (`E_NOGRANT`, `E_UNKNOWN_TEAM`, ...) synchronously | the sender, in the same call |
| **Malformed outbox drop** | daemon parse-fail → **bounce** into the sender's own inbox | the sender |
| **Hub unreachable / ambiguous send** | `send` returns `error`; retry is safe (`duplicate` on re-send of a landed message) | the sender |
| **Target team's courier down / session dead** | message sits at the hub; visible in `status` as `deposited_uncollected` (both directions of health) | the sender (and infra), on inspection — nothing is dropped |
| **Delivered but never acted on** | an **unanswered item in the record**: the epic/task sits without movement, no reply mail | the initiator, via the record — silence is visible because the work of record is the truth |

There is no state in which a message is silently gone: it was rejected in-hand, bounced back, is countably parked at the hub, or was delivered — and past delivery, the work-of-record layer makes non-response visible. Escalation from there is §3.

### 1.5 What NEVER goes over this channel

1. **Durable work specification** — requirements, acceptance criteria, scope decisions. (GitHub. Mail points, the issue specifies.)
2. **Work content / results** — diffs, documents, deliverables. The PR is the delivery; mail says "delivered, see #N."
3. **Secrets / credentials** — tokens, keys, passwords. Mail spools persist in plaintext on the hub and in inboxes.
4. **Bulk data / file transfer** — use git / GitHub; the channel is a doorbell, not a pipe.
5. **Cross-product reach** — a PO corresponds with its own product's team, never another PO's product.

### 1.6 Control-message semantics (stop, pause, redirect)

A **control message** is an instruction *about* the work rather than a unit of work — stop, pause, hold, drop that, change priority. These are the highest-consequence things a PO sends, and they follow three rules. (Commissioned S60, Mihkel. Origin instance: the S60 station-lane retraction — see the provenance note below; the failure it records is exactly what these rules prevent.)

1. **"Stop" ≠ "revert." A stop order means CEASE, never destroy.** Never bundle revert, cleanup, or undo into a stop. An untouched uncommitted tree on the remote side is a **decision deferred** — it can be resumed, inspected, or discarded later with full information. A reverted one is **work lost**, irreversibly, before anyone decided it should be. If you want the work gone, that is a separate, explicit, later instruction — never a rider on "stop."

2. **Control messages act at boundaries, not into the running thing.** They mean "don't start the next thing," never "reach in and redirect or unwind what's mid-flight." A PO lets the remote lead's in-flight turn/task reach its natural end and **reroutes at the seam** — the next `ready` dispatch (`issue-standard.md`), the issue thread, the next inbox read. You change what happens *next*, not what is *already happening*.

3. **Do not fight the channel's asynchrony — use it.** Mail cannot interrupt an in-flight turn: a control message deposited mid-turn surfaces at the remote lead's next boundary *by construction*, which is exactly where rule 2 wants it to act. The residual temptation is escalating to **emergency pane access** (Appendix A) to force a mid-flight stop — that re-imports every hazard the retired driving channel had, and is reserved for genuine Tier-D emergencies under the sanction rule (Celes's R/M/D model; Tier-D needs team-lead-relayed Mihkel sanction, exact action + reason + expected outcome). Absent that, send the control message, let it land at the seam.

**Why this lives in the channel contract:** these rules bind every channel a PO controls with (the principle is channel-neutral), and they are the safety spine under §3 escalation — a PO handling a stalled remote team applies rule 1 (cease, don't unwind) and rule 2 (reroute at the seam) rather than reaching in. Cross-referenced from §3.

*(Provenance: Mihkel's verbatim S60 formulation, filed as [`wiki/process/control-signal-semantics-at-authority-boundaries.md`](../../../teams/framework-research/wiki/process/control-signal-semantics-at-authority-boundaries.md). The origin instance is honest in both directions: in the S60 station-lane retraction the parked draft was correctly preserved-not-deleted (rule 1 upheld for that artifact), while a completed §7 edit was over-reverted when a plain "cease" would have left it intact — rule 1 violated for that artifact, the very hazard this section exists to prevent. Same stop, two artifacts, opposite outcomes: cease-not-destroy is decided **per artifact at execution time**, not once for the whole halt (the wiki entry files this under its sub-lesson 2, "stop is not revert"). The wiki entry is the durable record and adds sub-lesson 1 (musing ≠ commission) for the reading side of the same mechanism.)*

### 1.7 tmux -- persistence only (layer 4)

tmux remains on every remote box for exactly one job: keeping the team's `claude` session alive as the foreground process of a named session (convention `[CONV]`: session name == teamName == containerName), surviving ssh disconnects and giving infra a place to relaunch after a container restart. **It is not a channel.** A PO never attaches to drive, never `send-keys`, in normal operation. Dead-session recovery is the remote side's own startup (infra/team-lead concern); **no work is lost** — reconcile from GitHub, and undelivered mail waits at the hub (§1.4).

#### Appendix A -- emergency pane access (explicitly out-of-band)

For genuine Tier-D emergencies only (session wedged on a dialog, comms stack itself down), under team-lead-relayed Mihkel sanction (§1.6 rule 3):

- **Look before touching:** `ssh <target> "tmux capture-pane -p -t <session>"` is always safe and is the diagnostic of first resort. Observers use `capture-pane` / `attach -r` (read-only) only.
- **If typing is sanctioned:** `send-keys -l '<text>'` for the literal, a **separate** `send-keys Enter` to submit; never type onto a rendering permission dialog; never launch the CLI itself via `send-keys` (the #60 crash class lives there — `research-precedent.md` §6).
- Every emergency use gets reported to the team-lead and, if it exposed a comms-stack gap, filed as an issue. Routine use of this appendix is a design failure, not a workflow.

---

## 2. GitHub as the durable work-of-record

The PO drives development through **GitHub epic issues**, sometimes **task issues**. The remote team does the actual work and syncs it back through GitHub. The PO's local clone is **read-only reference**. (GitHub is the work-of-record channel — the attention channel of §1 only ever points into it; the work item lives here.)

### 2.1 Issue conventions

> **The concrete standard lives in [`issue-standard.md`](issue-standard.md)** (Herald + Celes, S60): the full label taxonomy, milestone use, epic→task decomposition convention, and issue templates — **English, identical across all four product repos** (Aen decision, Q6). This section is the summary; that doc is authoritative.

| Kind | Label | Who opens | Body must contain | Who closes |
|---|---|---|---|---|
| **Epic** | `epic` | **PO** | Goal, acceptance criteria, a checklist of child tasks, target product | **PO**, when acceptance criteria are met |
| **Task** | `task` | **Remote team-lead** (PO opens only the high-level seed tasks) | `Part of #<epic>`, one concrete deliverable, done-definition | Remote team, via a merged PR that says `Closes #<task>` |

Coordination labels: `ready` (the dispatch handshake — a task is dispatched only once it carries `ready`; `issue-standard.md` §2), `blocked` (names the blocker), `needs-po` (remote team needs a PO decision — the pull-signal for escalation, §3), and optionally a `product:<name>` label (org-board only, not per-repo — `issue-standard.md` §2). `[CONV]` — label names are conventions; rename freely.

**Rule of ownership:** POs own epics end-to-end (open, groom, close on the acceptance gate). Remote teams own tasks and PRs (open under an epic, implement, close by merge). A PO closing a *task* by hand, or a remote team closing an *epic*, means the acceptance gate was skipped — a smell.

**Issue <-> dispatch binding (Finn §4):** the dispatch mail and the issue are bound by reference — a `send` says "pick up #47"; the issue #47 is the contract. This mirrors CCR's "the PR is the contract; the coordination message only points at it" (`topics/11`). The mail never carries the change.

### 2.2 How remote work syncs back

- Remote team works on the **remote** clone, pushes branches, opens **PRs on GitHub**; merge happens on the GitHub/remote side.
- PRs reference issues (`Closes #N` / `Part of #N`) so the epic checklist advances mechanically — and so the §1.3 two-level completion check has a durable signal to read.

### 2.3 Read-only local clone -- one-way sync

**Rule: GitHub -> local, never local -> GitHub.** The PO keeps the product repo cloned locally *for reference only* — to read code and ground an epic against real files (matches mvox's existing reference-clone convention, Finn §4). The PO **never** commits or pushes from the local clone.

- **Sync:** `git fetch` / `git pull` only. Define a staleness discipline (pull before a grooming/dispatch session) — clones drift because work lands from the remote side (Finn §5 Q5).
- **Enforcement (recommended, §6 Q7):** convention alone is fragile at N products — harden with a read-only token or `git remote set-url --push origin DISABLED`, so an accidental push fails loudly instead of forking truth.

---

## 3. Escalation & reporting lines

Mirrors FR's dual-hub routing (`common-prompt.md`):

- **Team-lead = work hub.** POs report status, blockers, and cross-product coordination here. Assignment of POs to products and cross-product priorities route through the team-lead. (Adopt the Hopper rule, Finn §3: a PO is tasked by the **team-lead**, not human-direct.)
- **Local librarian = knowledge hub.** Patterns, gotchas, decisions discovered while running a product go to the librarian (the PO-team's Callimachus), scoped to **cross-product PO knowledge** (recurring epic patterns, per-remote-team quirks, comms/courier lore) — *not* code knowledge, which lives in each remote team's own wiki (Finn §5 Q3). "mvox's courier lags when the container is under a build" is a gotcha for the librarian; "mvox epic #12 is blocked on a host issue" is a blocker for the team-lead.

### Handle vs. escalate

| Handle it (PO, directly with the remote team) | Escalate to team-lead |
|---|---|
| In-scope direction, grooming, re-prioritizing within the product | **Cross-product dependency** (product A blocked on product B) |
| A blocker the remote team can resolve with a decision the PO owns | **Host / infra / registry** problem (dead container, hub grant, courier down, `deposited_uncollected` piling up) |
| Re-dispatching a stalled task, re-pointing the lead at the right issue | **Scope change** / new-product request (needs a PO+team pair — §4) |
| Opening/closing epics and tasks for the product | Remote team **dead and not self-recoverable** |

**Heuristic:** if the fix is inside the product's own repo and the PO's mandate, handle it; if it needs another team, another host, or a decision above the product, escalate. A remote team raising `needs-po` asks the *owning* PO to handle; a PO raising it to the team-lead asks for something outside the product.

**When handling means telling a remote team to stop or change course, apply the control-message semantics (§1.6):** stop means cease, not revert (an untouched uncommitted tree is a deferred decision, not lost work); reroute at the seam rather than reaching into an in-flight task; and let the mail land at the boundary rather than forcing a mid-flight interrupt. This is the safety spine of every intervention a PO makes into a stalled or misdirected remote team.

---

## 4. Growth protocol -- checklist before a new PO+remote-team pair goes live

An ever-growing team means adding pairs is routine, so preconditions must be a checklist, not tribal knowledge. **All of the following before the pair is declared live:**

1. **Registry entry** in `registry.json`: `teamName`, `host`, `port`, `user`, `sshKey`, `location`, `accessMethod`, `containerName`, `status: live`. (Registry keeper — Strabo/infra; the PO supplies product name + requests it. Note heterogeneous substrate ownership, Finn §5 Q2.)
2. **ssh keys** generated and installed — two distinct keys, two distinct jobs: the **hub identity key** (`~/.ssh/sm_<team>` — the per-team key *is* the identity to the stationmaster hub) and the **container admin key** (registry convention `id_ed25519_<team>`) for infra/persistence access. Per-team keys, never shared (§6 Q7).
3. **Comms stack live for the team:** hub `grant` issued for the team; the courier daemon running in the team's container (IN-injection + OUT `to:`-parse both); the comms MCP server (`send`/`read_mail`) configured in the team session. Remote lead's `claude` session running under its named tmux session (persistence layer, §1.7), verified alive.
4. **Product repo on GitHub**, labels created (`epic`, `task`, `ready`, `blocked`, `needs-po` — the five core labels, `issue-standard.md` §6; `product:<name>` is optional, org-board only, `issue-standard.md` §2).
5. **Local clone** present as read-only reference (push disabled, §2.3).
6. **Epic backlog seed:** ≥1 `epic` issue open with real acceptance criteria and a task checklist — the remote team needs something to pull on day one.
7. **End-to-end comms acceptance test PASSED (go-live gate).** Against the real infra, demonstrate the full §1 loop: PO `send(to, ...)` → `accepted` verdict → courier delivers into the remote lead's inbox → remote lead replies (outbox or `send`) → the reply surfaces PO-side (auto-surface, or `read_mail` for a solo session) → the instructed action shows up on GitHub. Explicitly exercise the **failure paths**: a malformed outbox drop bounces to the sender; a send to an ungranted team returns `rejected`/`E_NOGRANT` synchronously; a message deposited while the target courier is stopped shows in `status` as `deposited_uncollected` and delivers when the courier resumes. Nothing silent = pass.
8. **PO-side tooling provisioned:** the PO session has the `comms` MCP server configured with the team's hub key, and the solo-session `read_mail` habit is in the PO's role prompt.
9. **Librarian registration:** the product entered in the PO-team knowledge index.
10. **Roster:** the PO persona exists in the PO-team roster — **Celes's artifact**; this checklist depends on it, does not define it.

A pair missing any of 1–8 is a draft, not live. Item 3 is the one most likely to silently regress (a container restart kills the courier/session) — the §1.4 `deposited_uncollected` signal and the `status` verb are the watch on it.

---

## 5. Language rules

- **Framework docs** (this document, `registry.json`, internal coordination): **English** (per `common-prompt.md`).
- **User-facing product content** (a product's UI / end-user docs — e.g. mvox surfaces for Estonian users): **Estonian when applicable**, following each product's own audience, not this protocol.
- **GitHub epics/tasks** are development coordination → default **English** for cross-product legibility. Whether Mihkel wants issue prose in Estonian for his own reading is a PO decision — §6 Q6.

---

## 6. Open questions & resolutions

> **Supersession note (2026-07-16):** the S60 channel decision (literal tmux driving) and its dependents (Q1 multiplexer-as-channel, Q3 allowlist-as-driving-smoothness, Q5 no-courier) were **reversed on 2026-07-15** by the ratified inbox architecture (#90). The entries below are kept as the historical decision record; where a resolution conflicted with #90, §1 (rev 5) is authoritative.

### Resolved (Aen, S60, 2026-07-14 — PO decisions in; channel entries since superseded, see note above)

- **Channel (was the top question):** was resolved as literal tmux driving (PO Mihkel, 2026-07-14); **reversed 2026-07-15** — the ratified channel is inbox comms over the stationmaster hub (#90, §1).
- **Q1 — Multiplexer standard:** **tmux** — still the answer, but its role shrank to layer-4 persistence (§1.7); it is no longer a channel contract.
- **Q3 — Remote CLI permission posture:** **allowlist-tuned** (curated per-team allowlists) — still holds for the remote sessions' own smooth running; no longer load-bearing for a driving gate (there is no driving). A wedged dialog is now an emergency-access case (Appendix A), not a channel state.
- **Q5 — Durable async channel:** originally "GitHub-only, no courier bridge in v1"; **superseded** — the courier/hub stack is now the ratified attention transport (#90). GitHub remains the only durable *work* channel (§2); the distinction that survived is signals-vs-content, not courier-vs-no-courier.
- **Q6 — GitHub issue language:** **RESOLVED — English** (applies identically across all four product repos; see the issue standard, §2 / sibling doc).

### Resolved as design calls (Herald, S60 — not Mihkel-blocking)

- **Q4 — Task-issue ownership:** **RESOLVED in the epic/task issue standard** (§2 + `issue-standard.md`): the remote team-lead opens task issues under an epic; the PO opens epics.
- **Q5b — Driving mode:** moot — retired with the driving channel; emergency access (Appendix A) uses one-shot ssh-exec for auditability when sanctioned.
- **Q8 — Contested-writer arbitration:** moot for the channel (inboxes serialize; the hub confirms deposits). The 1 PO : 1 product ownership rule survives as §1.5 item 5 (cross-product reach) and applies to emergency pane access.
- **Q2 — `capture-pane` sentinel-token ownership:** moot for the channel — sentinels were the read-back heuristic of the retired driving contract. If emergency access (Appendix A) ever needs pane-state lore, it goes to the librarian as a gotcha, not a versioned contract.

### Still open — genuinely Mihkel's (infra values / GH scopes); do NOT block v1 design

- **Q7 — Read-only clone enforcement & ssh keys:** convention-only vs. hard-enforced (read-only token / push-disabled remote)? Per-team keys are now partly settled by the hub design (the per-team hub key *is* the identity, §1); still open for container admin keys and the GitHub write scopes for the remote side.

---

## 7. Channel history (the fallback that became the architecture)

For the record: v1 as designed at S60 made literal tmux driving the channel and documented FR's inbox/hub stack (**stationmaster** + **courier** + **ghost-member**; Finn `research-precedent.md` §3, `poc/ghost-bridge/`) as the v2 fallback in this section. On **2026-07-15 that fallback was ratified as the architecture** (#90) — for the reasons this section itself anticipated (dialog states and read-back heuristics made driving fragile) — and §1 now specs it as the critical path. The direction of the fallback has therefore inverted: message-passing is v1; literal pane driving survives only as sanctioned emergency access (Appendix A), and there is no automated fallback between them — a broken comms stack fails loud (§1.4) and gets fixed, not routed around.

---

*Cross-refs:* inbox comms architecture ratification (#90); comms MCP tools (#100); courier daemon (#95); Finn precedent research (`designs/new/po-team/research-precedent.md`); stationmaster protocol (`poc/ghost-bridge/stationmaster-protocol.md`); tmux-pane #60 crash class (`teams/framework-research/docs/tmux-spawn-guide.md`) — now relevant only to Appendix A; CCR "PR is the contract" (`topics/11-deployment-lifecycle.md`); Hopper operator boundary discipline (`designs/deployed/operator-role/design-spec.md`); dual-hub routing (`common-prompt.md`). Roster/personas: Celes.

(*FR:Herald*)
