# Product-Owners Team -- Communication & Handoff Protocols

(*FR:Herald*)

**Status:** rev 4 (2026-07-14, S60) — added §1.6 control-message semantics (stop≠revert; act at boundaries; never race a stop into BUSY), commissioned by Mihkel, cross-ref'd from §3. rev3: four PO decisions folded in (Q1 tmux, Q3 allowlist-tuned permission mode, Q5 GitHub-only/no-courier, Q6 English issues); §6 tracks resolved vs. still-open. Two-substrate split (tmux driving + GitHub work-of-record) RATIFIED by Aen. Concrete epic/task issue standard: `designs/new/po-team/issue-standard.md` (§2).
**Scope:** the rules of communication and handoff for the new `product-owners` team. Roster/persona composition is Celes's artifact, not this one.

**Channel decision (DECIDED by PO Mihkel, via Aen, 2026-07-14):** the PO<->remote-team-lead channel is **literal interactive tmux/screen CLI driving** (`send-keys` to issue direction, `capture-pane` to read back), NOT message-passing. Finn recommended a ghost-member/stationmaster hub; the PO explicitly chose literal tmux driving. This document specs that channel as the critical path (§1). Message-passing is **out of scope for v1** and appears only as a documented fallback (§7).

## 0. The team in one picture

```
                 LOCAL (product-owners team)                    REMOTE (per product)
    ┌───────────────────────────────────────────┐
    │  team-lead (work hub)                       │
    │     ├── PO:mvox ───────────┐                │  ssh exec:      ┌────────────────────┐
    │     ├── PO:bigbook ────────┼── DRIVE ───────┼── send-keys ───▶│ remote team-lead   │
    │     ├── PO:ad-auto ────────┤   (direction)  │  capture-pane ◀─┤  claude CLI, running
    │     ├── PO:field-network ──┘   + READ-BACK  │  (read-back)    │  as the foreground │
    │     │                                       │                 │  process of a named│
    │     └── librarian (knowledge hub)           │                 │  tmux session      │
    │                                             │                 │   + remote team    │
    │  local clone (READ-ONLY reference) ◀────────┼──── git fetch ──┴─────────┬──────────┘
    └───────────────────────────────────────────┘         GitHub             │
                                                    (durable work-of-record) ◀┘
                                                     epics / tasks / PRs
```

**Two channels, two jobs:**

| Channel | Substrate | Carries | Property |
|---|---|---|---|
| **Direction + read-back** | ssh + tmux/screen: `send-keys` / `capture-pane` into the remote CLI | instructions to the remote lead; read-back of accept/busy/done state | interactive, no structured ack, **heuristic** completion — see §1.3 |
| **Work-of-record** | GitHub (epics, tasks, PRs) | the durable work item, its acceptance criteria, the merged result | durable, auditable, versioned; the single source of truth |

**The relationship between them (load-bearing):** the tmux channel *drives* the remote lead; GitHub *records* the work. A well-formed instruction over tmux is usually "pick up epic #47" — the specification lives in the issue, the keystrokes just point the remote lead at it and confirm it started. **Completion is confirmed at two levels:** the pane read-back tells you the remote lead's *turn* finished (§1.3); the GitHub issue/PR tells you the *work* is done. The pane is never the system of record — if the remote container is rebuilt or the tmux server dies, nothing durable is lost because the work lives in GitHub.

---

## 1. PO <-> remote-team-lead channel -- literal tmux/screen driving (CRITICAL PATH)

**This is net-new engineering.** Finn's precedent research (`research-precedent.md` §1c) confirms: no agent in this repo has ever driven a live `claude` REPL via `send-keys`/`capture-pane`. Every proven agent<->agent channel to date is inbox message-passing. This section therefore specifies the contract from scratch and §4 gates it behind an over-real-ssh acceptance test.

**Participants:** one PO (the driver/writer) and one remote team-lead's live `claude` CLI (the driven session), running as the foreground process of a named tmux/screen session on the remote host. Other POs and the team-lead may read the pane (`capture-pane`) but must not `send-keys` to a session they don't own (§1.4, contested input).

**Substrate reality (`registry.json` + Finn `research-precedent.md` §1a):** remote teams live in containers on two hosts. Command shapes:
- **direct-ssh (RC, 100.96.54.170, ports 2222+):** `ssh -t -i ~/.ssh/id_ed25519_<team> -p <port> ai-teams@100.96.54.170`
- **proxyjump (PROD-LLM, 10.100.136.162, firewalled):** `ssh -t -i <key> -o "ProxyCommand=ssh -i <key> -W %h:%p michelek@10.100.136.162" -p <port> ai-teams@localhost`

The four PO products (`mvox`, `bigbook`, `ad-auto`, `field-network`) are **not yet in the registry**; adding them is step 1 of the growth protocol (§4). Note (Finn §5 Q2): substrate ownership is heterogeneous — mvox is a non-FR substrate — so a PO cannot assume FR owns the remote host.

### 1.0 Launch vs. drive -- the rule that sidesteps the #60 crash class

The crash class has **two documented modes** (Finn `research-precedent.md` §6), and both are avoided by driving an already-running IDLE session with *prompts*:
- **Mode (i) -- launch+dialog coupling (#60 / apex Session-17):** a repeatable crash when a permission dialog renders in a `claude` CLI that was **launched by `tmux send-keys`** into a pane.
- **Mode (ii) -- shell-into-Claude turn corruption (runbook §16):** `send-keys` of **shell commands** into a live Claude pane corrupts its turn-state.

Neither fires when you `send-keys` a **prompt** at an **idle prompt**. **Existence proof this method is safe:** Hopper's WS3b probe (S54/S55) drove live Claude sessions via remote `send-keys` + `capture-pane` — including a full OAuth login — with no crash. So driving is proven; the design's job is to stay inside the safe envelope. Two rules do that:

1. **The PO never launches the remote CLI.** The remote team-lead's `claude` process is started by the remote side's own startup (a human `ssh -t` + `claude`, or the team's startup script) as the **foreground process of its tmux session** — not by the PO `send-keys`-ing a `claude ...` command into a bare shell pane. The PO attaches to / drives an **already-running** session only. "Launched normally, then observed/driven" — never "launched under tmux driving."
2. **The PO never `send-keys` onto a permission dialog.** Because the CLI still runs inside tmux, dialogs still render there. The read-back gate (§1.3) requires a `capture-pane` check *before every* `send-keys`: if the pane shows a permission/confirmation dialog, that is an exceptional state — **stop, do not type, escalate/observe** (§1.4).

   **Permission posture (DECIDED, §6 Q3): allowlist-tuned.** Remote CLIs run with **curated per-team allowlists** that suppress the *common* dialogs, so the pane is usually IDLE and safe to drive. This does **not** eliminate the DIALOG state — a command outside the allowlist still raises a prompt. The allowlist lowers the *frequency* of the risk, not its *existence*. Therefore the observe-before-inject gate is **MANDATORY on every send, not best-effort** — the design must never assume "the allowlist means no dialogs." The residual-dialog case is a first-class path, not an edge case (§1.3 DIALOG row, §1.4 DIALOG recovery).

### 1.1 Session discovery & attach discipline

Never blind-drive. The sequence is **discover -> read -> (maybe) drive**.

1. **Connect** with the registry row's exact command shape (above). Read values from `registry.json`; never hard-code.
2. **Discover before driving.** `ssh <target> tmux ls` (or `screen -ls`). Convention `[CONV]`: **session name == teamName == containerName**. Empty/errored `tmux ls` = dead session → §1.4, do **not** start typing into a fresh shell.
3. **Read the pane first.** `ssh <target> "tmux capture-pane -p -t <session>"` snapshots the current screen. Classify its state (§1.3) — IDLE / BUSY / DIALOG — before deciding whether to drive.
4. **Two ways to drive** (both are legitimate; pick per §1.2):
   - **One-shot ssh exec (primary for an agent):** `ssh <target> "tmux send-keys -t <session> ..."` and `ssh <target> "tmux capture-pane -p -t <session>"` as discrete commands. No interactive attach; cleanest for programmatic driving; each call is auditable.
   - **Interactive attach (human-in-the-loop):** `tmux attach -t <session>` (read-only `-r` for observers). For a human PO or hand-driving; not the agent's default.

### 1.2 Issuing direction (`send-keys` contract)

```
# 1. read-back gate: confirm IDLE (see §1.3) — MANDATORY before every send
ssh <target> "tmux capture-pane -p -t <session>"      # must classify IDLE, not BUSY/DIALOG
# 2. type the instruction literally (-l prevents key-name interpretation of the text)
ssh <target> "tmux send-keys -t <session> -l 'pick up epic #47, acceptance criteria are in the issue'"
# 3. submit as a SEPARATE call (a bare Enter key, not part of the -l literal)
ssh <target> "tmux send-keys -t <session> Enter"
# 4. confirm acceptance: re-capture, expect IDLE -> BUSY transition (§1.3)
ssh <target> "tmux capture-pane -p -t <session>"
```

**Discipline:**
- **`-l` (literal) for the text, separate `Enter` for submit.** A prompt injected without a submit key just sits in the buffer and the next reader mistakes it for the lead's own draft. Never fold the newline into the literal. (This exact shape is already codified in `designs/new/migration-probe-harness/harness.sh`: `tmux_send() { send-keys -t <pane> -l "<text>"; send-keys -t <pane> Enter; }` — reuse it, §4.)
- **Single-line vs. multi-line submit differ — a silent footgun (Finn §6).** Single-line is safe as above. For **multi-line** input, chaining `paste-buffer` + `Enter` in **one** ssh invocation **silently fails to submit** — the newline is swallowed. Multi-line therefore needs the **three-separate-invocation rule:** (1) `scp` the text over → (2) `tmux load-buffer` + `paste-buffer` into the pane → (3) a **separate** ssh call issuing `send-keys Enter`. Prefer single-line instructions (a pointer to an issue is naturally one line); reach for the multi-line dance only when unavoidable.
- **`-l` is also the safe primitive for a literal that must not be key-interpreted** (Finn §6). The channel carries no secrets (§1.5) — but if an interactive login/OAuth step on the remote is ever unavoidable, `send-keys -l '<literal>'` is the documented way to send it without echo or key-name interpretation.
- **Point at the work, don't respecify it.** The instruction is normally a pointer to a GitHub epic/task (§2); the specification lives in the issue. If a PO finds itself typing a paragraph of requirements into the pane, that paragraph belongs in an issue, not in keystrokes (keystrokes are unauditable and lost on session death).
- **One instruction per idle turn.** Do not queue multiple `send-keys` while the lead is BUSY; the REPL has no input queue you can trust, and stacked input races the lead's own output.

### 1.3 Reading back (`capture-pane` contract) -- how a PO knows an instruction landed

A REPL emits **no structured ack**. Read-back is therefore a **poll over `capture-pane` snapshots**, classifying the pane into states by sentinel tokens. This is the core net-new contract and it is **heuristic by nature** — flagged as such.

Provisional sentinels below come from the WS3b probe (`teams-migration-probe-container-scope-2026-06-17.md:89`, Finn `research-precedent.md` §6); IDLE/BUSY are usable now, but all three MUST be re-pinned live on the target CLI version during the §4 acceptance test — they are version-fragile (§6 Q2).

| State | Sentinel in the captured pane (`capture-pane -p \| tail -N`) | Meaning | PO action |
|---|---|---|---|
| **IDLE / READY** | the prompt glyph **`❯`** at the bottom, no activity indicator *(provisional — WS3b)* | ready / turn done | safe to `send-keys` |
| **BUSY / RUNNING** | a **"shimmering" activity indicator** rendering; streaming output *(provisional — WS3b)* | a turn is in progress | wait; poll again |
| **DIALOG** | a permission/confirmation prompt ("Do you want to proceed?", numbered options) — **NO stable sentinel captured yet** | blocked on a dialog | **do NOT send-keys** (§1.0 rule 2); escalate/observe |
| **DEAD** | shell prompt, no CLI TUI at all / `tmux ls` gone | session/process gone | §1.4 recovery |

**The DIALOG sentinel is the open, load-bearing one.** No probe has captured a stable DIALOG token, and it is exactly the state the §1.2 injection gate keys on. It is also dialog-type-dependent (permission vs. trust vs. login/theme prompts render differently), so it **must** be captured live during the §4 acceptance test — the gate cannot be considered proven until it is. Until then, the safe fallback holds: if the pane is not confidently classifiable as IDLE (the `❯` glyph clean, no shimmer), treat it as not-safe-to-drive and do not `send-keys`.

**The three-phase confirmation of an instruction:**
1. **Pre-send:** capture → must be IDLE.
2. **Accepted:** after submit, capture → IDLE→BUSY transition (or fresh echoed input) = the lead took the turn.
3. **Turn done:** poll capture until BUSY→IDLE with new output present = the lead's *turn* completed.

**Completion is two-level and this is deliberate.** The pane read-back only tells you the **turn** finished — it cannot tell you the **work** succeeded (a REPL returning to idle looks identical whether the lead did the task, misunderstood it, or errored). The **durable** confirmation that the work is done is on **GitHub**: the task issue closed, the PR opened/merged, the epic checklist advanced (§2). A PO treats the pane as "did the lead hear me and finish thinking," and GitHub as "did the work actually happen." Never report work complete off the pane alone.

### 1.4 Failure modes & recovery

| Failure | Symptom | Recovery |
|---|---|---|
| **Dead session** | `tmux ls` empty / `connection refused` / container restarted | Remote side re-launches the CLI in its named session (remote startup — §1.0 rule 1; infra/team-lead concern, never the PO `send-keys`-ing a launch). **No work lost** — reconcile from GitHub. |
| **Detached / orphaned pane** | Session exists but no `claude` process (`pgrep -f claude` empty) | Remote side relaunches the CLI as the session's foreground process; agent state restores per the remote team's own startup. |
| **Permission DIALOG** | `capture-pane` shows a dialog | Never `send-keys` onto it (§1.0 rule 2). Escalate to a human/observer, or wait for the remote side's own auto-handling if the permission posture provides it (§6 Q3). Treat a wedged dialog as a dead session after a timeout. |
| **Contested input** | Two writers `send-keys` to one session; keystrokes interleave and garble the prompt | tmux is **last-writer-wins on input — no lock**. **Single-writer discipline:** one PO owns each session (1 PO : 1 product). Observers use `capture-pane` / `attach -r` only. When >1 PO could reach a session, the writer seat is coordinated through the team-lead (§6 Q8). |
| **Silent no-op** | Text typed but never submitted (missing `Enter`), or sent to the wrong session/pane target | Always re-`capture-pane` after every send (§1.3 phase 2). Never fire-and-forget; a send with no observed IDLE→BUSY transition did not land. |
| **Read-back false-negative** | Pane looks IDLE but the lead is briefly between render frames | Poll ≥2 samples spaced by a short interval before concluding IDLE; one snapshot is not a state. |

### 1.5 What NEVER goes over this channel

1. **Durable work specification** — requirements, acceptance criteria, scope decisions. (GitHub.) Keystrokes are unauditable and die with the session.
2. **Secrets / credentials** — tokens, keys, passwords. tmux scrollback (and any pane logging) persists them in plaintext.
3. **`send-keys` onto a permission dialog** (§1.0 rule 2).
4. **A CLI-launch command** — the PO never launches the remote CLI via send-keys (§1.0 rule 1).
5. **Bulk data / file transfer** — use git / GitHub; the channel is a keyboard, not a pipe.
6. **Cross-product reach** — a PO drives only its own product's session, never another product's.

### 1.6 Control-message semantics (stop, pause, redirect)

A **control message** is an instruction *about* the work rather than a unit of work — stop, pause, hold, drop that, change priority. These are the highest-consequence things a PO sends over the driving channel, and they follow three rules. (Commissioned S60, Mihkel. Origin instance: the S60 station-lane retraction — see the provenance note below; the failure it records is exactly what these rules prevent.)

1. **"Stop" ≠ "revert." A stop order means CEASE, never destroy.** Never bundle revert, cleanup, or undo into a stop. An untouched uncommitted tree on the remote side is a **decision deferred** — it can be resumed, inspected, or discarded later with full information. A reverted one is **work lost**, irreversibly, before anyone decided it should be. If you want the work gone, that is a separate, explicit, later instruction — never a rider on "stop."

2. **Control messages act at boundaries, not into the running thing.** They mean "don't start the next thing," never "reach in and redirect or unwind what's mid-flight." A PO lets the remote lead's in-flight turn/task reach its natural end and **reroutes at the seam** — the next `ready` dispatch (`issue-standard.md`), the issue thread, the next idle prompt. You change what happens *next*, not what is *already happening*.

3. **Never race a control message to a working session.** Prefer letting the remote lead finish over mid-flight redirection. This composes directly with the §1.3 **BUSY** state: a BUSY pane gets **no** sends at all — *including stops* — except a genuine Tier-D emergency under the sanction rule (Celes's R/M/D model; Tier-D needs team-lead-relayed Mihkel sanction, exact keystrokes + reason). A "stop" fired into a BUSY pane races the lead's own output, garbles the buffer (§1.4 contested/silent-no-op), and often lands as neither a clean stop nor a clean turn. Wait for IDLE, then issue the control message cleanly.

**Why this lives in the driving contract:** these rules bind every channel a PO controls with (tmux most acutely, but the principle is channel-neutral), and they are the safety spine under §3 escalation — a PO handling a stalled remote team applies rule 1 (cease, don't unwind) and rule 2 (reroute at the seam) rather than reaching in. Cross-referenced from §3.

*(Provenance: Mihkel's verbatim S60 formulation, filed as [`wiki/process/control-signal-semantics-at-authority-boundaries.md`](../../../teams/framework-research/wiki/process/control-signal-semantics-at-authority-boundaries.md). The origin instance is honest in both directions: in the S60 station-lane retraction the parked draft was correctly preserved-not-deleted (rule 1 upheld for that artifact), while a completed §7 edit was over-reverted when a plain "cease" would have left it intact — rule 1 violated for that artifact, the very hazard this section exists to prevent. Same stop, two artifacts, opposite outcomes: cease-not-destroy is decided **per artifact at execution time**, not once for the whole halt (the wiki entry files this under its sub-lesson 2, "stop is not revert"). The wiki entry is the durable record and adds sub-lesson 1 (musing ≠ commission) for the reading side of the same mechanism.)*

---

## 2. GitHub as the durable work-of-record

The PO drives development through **GitHub epic issues**, sometimes **task issues**. The remote team does the actual work and syncs it back through GitHub. The PO's local clone is **read-only reference**. (GitHub is the work-of-record channel — this is not the message-passing/hub that §7 rules out; it is where the work item lives.)

### 2.1 Issue conventions

> **The concrete standard lives in [`issue-standard.md`](issue-standard.md)** (Herald + Celes, S60): the full label taxonomy, milestone use, epic→task decomposition convention, and issue templates — **English, identical across all four product repos** (Aen decision, Q6). This section is the summary; that doc is authoritative.

| Kind | Label | Who opens | Body must contain | Who closes |
|---|---|---|---|---|
| **Epic** | `epic` | **PO** | Goal, acceptance criteria, a checklist of child tasks, target product | **PO**, when acceptance criteria are met |
| **Task** | `task` | **Remote team-lead** (PO opens only the high-level seed tasks) | `Part of #<epic>`, one concrete deliverable, done-definition | Remote team, via a merged PR that says `Closes #<task>` |

Coordination labels: `blocked` (names the blocker), `needs-po` (remote team needs a PO decision — the pull-signal for escalation, §3), and a `product:<name>` label per repo. `[CONV]` — label names are conventions; rename freely.

**Rule of ownership:** POs own epics end-to-end (open, groom, close on the acceptance gate). Remote teams own tasks and PRs (open under an epic, implement, close by merge). A PO closing a *task* by hand, or a remote team closing an *epic*, means the acceptance gate was skipped — a smell.

**Issue <-> dispatch binding (Finn §4, net-new):** the tmux instruction and the issue are bound by reference — a `send-keys` says "pick up #47"; the issue #47 is the contract. This mirrors CCR's "the PR is the contract; the coordination message only points at it" (`topics/11`). The keystrokes never carry the change.

### 2.2 How remote work syncs back

- Remote team works on the **remote** clone, pushes branches, opens **PRs on GitHub**; merge happens on the GitHub/remote side.
- PRs reference issues (`Closes #N` / `Part of #N`) so the epic checklist advances mechanically — and so the §1.3 two-level completion check has a durable signal to read.

### 2.3 Read-only local clone -- one-way sync

**Rule: GitHub -> local, never local -> GitHub.** The PO keeps the product repo cloned locally *for reference only* — to read code and ground an epic against real files (matches mvox's existing reference-clone convention, Finn §4). The PO **never** commits or pushes from the local clone.

- **Sync:** `git fetch` / `git pull` only. Define a staleness discipline (pull before a driving session) — clones drift because work lands from the remote side (Finn §5 Q5).
- **Enforcement (recommended, §6 Q7):** convention alone is fragile at N products — harden with a read-only token or `git remote set-url --push origin DISABLED`, so an accidental push fails loudly instead of forking truth.

---

## 3. Escalation & reporting lines

Mirrors FR's dual-hub routing (`common-prompt.md`):

- **Team-lead = work hub.** POs report status, blockers, and cross-product coordination here. Assignment of POs to products and cross-product priorities route through the team-lead. (Adopt the Hopper rule, Finn §3: a PO is tasked by the **team-lead**, not human-direct.)
- **Local librarian = knowledge hub.** Patterns, gotchas, decisions discovered while driving a product go to the librarian (the PO-team's Callimachus), scoped to **cross-product PO knowledge** (recurring epic patterns, per-remote-team quirks, `capture-pane` sentinel lore) — *not* code knowledge, which lives in each remote team's own wiki (Finn §5 Q3). "mvox's remote CLI wedges on a dialog if you drive during a build" is a gotcha for the librarian; "mvox epic #12 is blocked on a host issue" is a blocker for the team-lead.

### Handle vs. escalate

| Handle it (PO, directly with the remote team) | Escalate to team-lead |
|---|---|
| In-scope direction, grooming, re-prioritizing within the product | **Cross-product dependency** (product A blocked on product B) |
| A blocker the remote team can resolve with a decision the PO owns | **Host / infra / registry** problem (dead container, ssh key, port, wedged dialog needing infra) |
| Restarting a stalled turn, re-pointing the lead at the right issue | **Scope change** / new-product request (needs a PO+team pair — §4) |
| Opening/closing epics and tasks for the product | Remote team **dead and not self-recoverable** |

**Heuristic:** if the fix is inside the product's own repo and the PO's mandate, handle it; if it needs another team, another host, or a decision above the product, escalate. A remote team raising `needs-po` asks the *owning* PO to handle; a PO raising it to the team-lead asks for something outside the product.

**When handling means telling a remote team to stop or change course, apply the control-message semantics (§1.6):** stop means cease, not revert (an untouched uncommitted tree is a deferred decision, not lost work); reroute at the seam rather than reaching into an in-flight task; and never race a stop into a BUSY pane. This is the safety spine of every intervention a PO makes into a stalled or misdirected remote team.

---

## 4. Growth protocol -- checklist before a new PO+remote-team pair goes live

An ever-growing team means adding pairs is routine, so preconditions must be a checklist, not tribal knowledge. **All of the following before the pair is declared live:**

1. **Registry entry** in `registry.json`: `teamName`, `host`, `port`, `user`, `sshKey`, `location`, `accessMethod` (+ ProxyJump host if PROD-LLM), `containerName`, `status: live`. (Registry keeper — Strabo/infra; the PO supplies product name + requests it. Note heterogeneous substrate ownership, Finn §5 Q2.)
2. **ssh key** generated and installed: private key local/PO side, public key in the remote's `authorized_keys`. **Per-team key** (registry convention `id_ed25519_<team>`), not a shared key (§6 Q7).
3. **Remote CLI session** up: the remote team-lead's `claude` running as the **foreground process** of a tmux/screen session named `== teamName` (§1.0), verified by `ssh <target> tmux ls`.
4. **Product repo on GitHub**, labels created (`epic`, `task`, `blocked`, `needs-po`, `product:<name>`).
5. **Local clone** present as read-only reference (push disabled, §2.3).
6. **Epic backlog seed:** ≥1 `epic` issue open with real acceptance criteria and a task checklist — the remote team needs something to pull on day one.
7. **Over-real-ssh acceptance test PASSED (go-live gate).** Against the actual remote session, demonstrate the full §1 loop end-to-end: `tmux ls` discovery → `capture-pane` classifies IDLE → `send-keys -l` an instruction + separate `Enter` → `capture-pane` confirms IDLE→BUSY→IDLE → the instructed action shows up on GitHub. Explicitly exercise the **DIALOG** path (confirm the read-back detects a permission dialog and the driver refuses to type). This gate retires the #60 crash-class risk *for this pair on its real substrate* — it is not assumed away by the design. **Pin the exact `capture-pane` sentinel tokens here, and the librarian (Nunes) records them in a versioned card keyed by CLI version** (Aen decision Q2) — capturing all three states, especially the live **DIALOG** dump (§1.3). Nunes re-pins the card at every acceptance-test run and on any remote CLI upgrade. Reuse `designs/new/migration-probe-harness/harness.sh` (`tmux_send`/`tmux_capture`) as the drive-loop primitive — the PO channel is a generalization of it, so the test should not reinvent the mechanics.
8. **PO-side drive tooling provisioned:** the driving PO actually has the send-keys/capture-pane mechanics available — the `tmux-direct-brief` skill (canonical mechanics doc) and/or the `harness.sh` primitives. Note (Finn §6): `tmux-direct-brief` lives in the rc-host/operator env and is **NOT** in the local `~/.claude/skills`, so a new PO does not get it for free — provisioning it is a real step, not an assumption.
9. **Librarian registration:** the product entered in the PO-team knowledge index.
10. **Roster:** the PO persona exists in the PO-team roster — **Celes's artifact**; this checklist depends on it, does not define it.

A pair missing any of 1–8 is a draft, not live. Item 3 is the one most likely to silently regress (a container restart kills the session) — see §1.4 dead-session.

---

## 5. Language rules

- **Framework docs** (this document, `registry.json`, internal coordination): **English** (per `common-prompt.md`).
- **User-facing product content** (a product's UI / end-user docs — e.g. mvox surfaces for Estonian users): **Estonian when applicable**, following each product's own audience, not this protocol.
- **GitHub epics/tasks** are development coordination → default **English** for cross-product legibility. Whether Mihkel wants issue prose in Estonian for his own reading is a PO decision — §6 Q6.

---

## 6. Open questions & resolutions

### Resolved (Aen, S60, 2026-07-14 — PO decisions in)

- **Channel (was the top question):** **RESOLVED — literal tmux/screen driving**, not message-passing (PO Mihkel). Whole doc built on it; §7 keeps message-passing as a v2 fallback only.
- **Q1 — Multiplexer standard:** **RESOLVED — tmux.** `send-keys`, `capture-pane`, `-r` read-only attach, and one-shot ssh-exec driving are all first-class; `screen` read-back is clumsier. The §1 contract assumes tmux.
- **Q3 — Remote CLI permission posture:** **RESOLVED — allowlist-tuned** (curated per-team allowlists). Suppresses common dialogs so the pane is usually IDLE; does **not** remove the DIALOG state, so the observe-before-inject gate stays **mandatory** (§1.0 rule 2). This is the biggest determinant of how smoothly driving runs.
- **Q5 — Durable async channel:** **RESOLVED — GitHub-only, no courier bridge in v1** (Aen ratifying the recommendation). Message-passing substrate stays documented in §7 as a v2 fallback.
- **Q6 — GitHub issue language:** **RESOLVED — English** (applies identically across all four product repos; see the issue standard, §2 / sibling doc).

### Resolved as design calls (Herald, S60 — not Mihkel-blocking)

- **Q4 — Task-issue ownership:** **RESOLVED in the epic/task issue standard** (§2 + `issue-standard.md`): the remote team-lead opens task issues under an epic; the PO opens epics.
- **Q5b — Driving mode:** **RESOLVED (Aen) — one-shot ssh-exec is the agent default** (§1.1 step 4): auditable, no attach-session state. Interactive attach is reserved for humans and debugging.
- **Q8 — Contested-writer arbitration:** **RESOLVED for v1 — single-writer-by-convention** (1 PO : 1 product, §1.4). An explicit attach-lock is deferred to v2, needed only once >1 PO can reach the same session.
- **Q2 — `capture-pane` sentinel-token ownership:** **RESOLVED (Aen) — the librarian (Nunes) owns the sentinel-token card**, versioned per CLI version, re-pinned at every §4-item-7 acceptance-test run and on any remote CLI upgrade. The *empirical* pin (esp. the live DIALOG dump) remains an acceptance-test deliverable — an accepted honest boundary of the design, not a gap.

### Still open — genuinely Mihkel's (infra values / GH scopes); do NOT block v1 design

- **Q7 — Read-only clone enforcement & ssh keys:** convention-only vs. hard-enforced (read-only token / push-disabled remote)? Per-team ssh keys (recommended) vs. a shared key (registry currently reuses `id_ed25519_apex` across several PROD-LLM teams)? Plus the concrete registry infra values per product (host, port, key path) and GitHub write scopes for the remote side.

---

## 7. Documented fallback (NOT part of v1 — ratified by Aen, S60)

Per the PO decision (Q5), message-passing is **not** built into v1 — GitHub is the only durable async channel. Recorded only so the alternative is not lost: FR has a mature, proven inbox/hub stack (**stationmaster** post-office hub + **courier** + **ghost-member** transports; Finn `research-precedent.md` §3, `poc/ghost-bridge/`). If literal tmux driving proves too fragile in practice — e.g. the DIALOG state or read-back heuristics cause repeated missed instructions — the fallback is to register each remote team as a **ghost-member** with an `ssh-tunnel`/`stationmaster` transport, turning "drive my remote lead" into a durable, at-least-once `SendMessage`. That is a v2 pivot requiring its own design; it is deliberately out of scope here.

---

*Cross-refs:* Finn precedent research (`designs/new/po-team/research-precedent.md`); tmux-pane #60 crash class (`teams/framework-research/docs/tmux-spawn-guide.md`); CCR "PR is the contract" (`topics/11-deployment-lifecycle.md`); Hopper operator boundary discipline (`designs/deployed/operator-role/design-spec.md`); dual-hub routing (`common-prompt.md`); message-passing fallback substrate (`poc/ghost-bridge/stationmaster-protocol.md`). Roster/personas: Celes.

(*FR:Herald*)
