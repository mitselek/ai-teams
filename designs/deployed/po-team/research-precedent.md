# PO-Team Precedent Research (S60)

**For:** Aen (team-lead), product-owners team design
**By:** Finn (research coordinator), framework-research
**Date:** 2026-07-14
**Scope:** What existing FR/fleet knowledge applies to a new "product-owners" team where a team-lead coordinates an ever-growing set of POs + a local librarian; each PO drives a **remote team** via **ssh + tmux/screen CLI**, keeps the product repo **cloned locally for reference only**, and drives development through **GitHub epic/task issues**. First four products: mvox, bigbook, ad-auto, mikrotik/field-network.

(*FR:Finn*)

---

## 0. TL;DR for Aen

- **Remote access is a solved-at-transport, unsolved-at-interaction problem.** Reaching a remote team's host/container over ssh is fully proven and documented (`deployments.md`, `registry.json`): direct-ssh for RC containers, ProxyJump for firewalled PROD-LLM. But **driving a live tmux/screen agent session programmatically (send-keys / capture-pane) has NO precedent in this repo** — every proven agent↔agent channel is **inbox/message-passing** (stationmaster hub, courier, ghost-member), and tmux-pane *spawning* was explicitly **deprecated (#60)** for a crash class. This is the genuine design gap.
- **Structure carries over cleanly from the operational-team archetype**, not from dev/research: persistent roster + episodic sessions, succession-framed artifacts, no TDD pipeline. Roster, common-prompt, startup/shutdown lifecycle, scratchpads, and a librarian all transfer. What does NOT transfer: XP/TDD roles, directory partition tables, per-agent branch/worktree isolation — POs coordinate, they don't implement.
- **The closest role precedent is Hopper (deployment operator):** an FR role that executes against *other teams'* substrates under a tiered-risk + read-the-artifacts-first discipline. A PO is structurally similar (an agent acting into a remote team it doesn't live in), and Hopper's boundary discipline is the template.
- **GitHub-as-knowledge/work-of-record is already designed** (topic 03 §4B, ghost-member `gh-issues` plugin), but **epic/task issue conventions are not** — no label taxonomy, no epic→task decomposition convention exists yet. New work.

---

## 1. Registry + Remote Access

### 1a. The proven pattern (transport layer) — SOLID

`registry.json` (root) and `deployments.md` are the source of truth, mirrored from `~/bin/rc-connect.ps1` / `rc-deployments.json`. Two hosts, two access methods:

| Access method | Where | Command shape | Cite |
|---|---|---|---|
| **direct-ssh** | RC containers (100.96.54.170, ports 2222-2224) | `ssh -t -i ~/.ssh/id_ed25519_<team> -p <port> ai-teams@100.96.54.170` | `deployments.md:29-40` |
| **proxyjump** | PROD-LLM containers (10.100.136.162, firewalled, only :22 exposed; ports 2225-2227 reachable only via host) | `ssh -t -i <key> -o "ProxyCommand=ssh -i <key> -W %h:%p michelek@10.100.136.162" -p <port> ai-teams@localhost` | `deployments.md:42-61` |

Each team has a **dedicated ssh key** (`id_ed25519_<team>`), a **registry entry** (`num`, `host`, `port`, `user`, `sshKey`, `accessMethod`, `containerName`, `status`), and a **reserved port** (registry num 1 is reserved; num 8 `ruth-team` is `planned`). This is the enrollment pattern a PO team would extend: **each new product/remote-team gets a registry row + a key + a port.** Registry is currently a shared file (`registry.json`, `updatedBy: Strabo`); comms-dev's architecture §12 notes a *planned* migration to hub-owned registry (not yet built) — `comms-dev/docs/architecture.md:191-197`.

Docker ops on PROD-LLM (read a file in a container, `docker cp`, base64-pipe fallback) are documented at `deployments.md:73-89`. The `ai-teams` container user has **no sudo** — use `docker exec` as root from the host (wiki gotcha `ai-teams-user-no-sudo-use-docker-exec-root.md`).

### 1b. What runs at the other end of the ssh session

When a human `ssh -t`s into a team container, they land in a **tmux session** whose panes host `claude` CLI agents. The team-lead's CLAUDE.md drives startup: `TeamCreate` → `apply-layout.sh` writes pane IDs to `/tmp/<team>-panes.env` → `spawn_member.sh --target-pane` per agent (`comms-dev/CLAUDE.md` "On Startup"; `tmux-spawn-guide.md:47-55`). So a remote team is: **one ssh endpoint → one tmux session → N agent panes + a team-lead pane.**

### 1c. The GAP — driving that session as an agent

**Critical negative finding.** There is **no precedent for an agent programmatically driving a tmux/screen session** (`tmux send-keys`, `capture-pane`, `screen -r`) as an interaction channel. Two things confirm the gap:

1. **tmux-pane spawning was deprecated (#60, 2026-04-24)** — `tmux-spawn-guide.md:1-33`. Session-17 (apex) showed a **repeatable crash class on permission-dialog rendering under tmux-pane-launched `claude`**; the framework moved to the **Agent tool** (`team_name`+`name`) for spawning, with **no tmux subprocess**. The legacy `spawn_member.sh` is now guarded with a deprecation exit. tmux survives as a *human viewing surface*, not a programmatic control surface.
2. **Every proven agent↔agent channel is inbox/message-passing, not CLI-session-driving** (see §3). The harness wakes members on **inbox-file write**, not on terminal input.

**Implication for the design:** "PO drives remote team via ssh+tmux CLI" is describing a **human-style interaction** (a person ssh's in and types to the team-lead pane). If the PO is a Claude agent, sending keystrokes into another team-lead's live `claude` REPL via `tmux send-keys` is **untested and carries the #60 crash-class risk**, plus no capture/parse convention for reading the pane back. Relevant sub-gotchas already on file: `nologin-shell-defeats-forced-command.md` (a hardened shell silently breaks forced-command ssh), `tmux-pane-labels-decoupled-from-personas.md`, `warp-host-sshd-2222-collision-with-apex-live.md` (port collisions). The design must **either** (a) adopt the inbox/hub channel POs already have precedent for, **or** (b) treat ssh+tmux as a genuinely new channel and spec a capture/inject contract (send-keys to team-lead pane + `capture-pane` read-back + idle/ready detection) — which is net-new engineering.

---

## 2. Reference Team Structures — what carries over

The **operational-team archetype** (wiki `patterns/operational-team-archetype.md`, first instance esl-suvekool) is the right lens, NOT dev/research. Its four co-occurring traits map almost exactly to a PO team: **(1) no TDD pipeline, (2) succession-framing first-class, (3) low-volume/episodic cadence, (4) persistent roster + episodic sessions.** A PO team coordinates remote teams that do the coding — the PO team itself ships no code.

| Structural element | Carry over? | Source / rationale |
|---|---|---|
| **Roster (`roster.json`)** with per-member model + color + prefix | **Yes** | Universal across every team config in `designs/`. Add `prefix` field for inter-team attribution (topic 03:384-397). |
| **common-prompt.md** (comms rule, attribution, language, shutdown) | **Yes** | Every team has one. `(*<PREFIX>:Name*)` attribution; timestamped SendMessage; mandatory-report-no-silent-idle. |
| **Startup/shutdown lifecycle** | **Yes** | hr-devs externalizes to `docs/startup-shutdown.md` (cleaner than rc-team inline) — topic 03:67-76. Use the Agent-tool spawn procedure (#60), not tmux `spawn_member.sh`. |
| **Personal scratchpads** (summary header + 100-line prune) | **Yes** | common-prompt "Personal Scratchpads". Each PO keeps state on its remote team between episodic sessions — a strong fit for the persistent-roster/episodic-session trait. |
| **Local librarian + wiki** (sole-writer, Protocol A/B, tiered cards) | **Yes, adapted** | The task specifies a local librarian. FR's Callimachus model (sole writer, `patterns/gotchas/decisions/contracts` subdirs, three-tier cards) transfers. Scope it to **cross-product PO knowledge** (recurring epic patterns, per-remote-team quirks), not code knowledge (that lives in each remote team). |
| **Dual-hub routing** (work hub = team-lead; knowledge hub = librarian) | **Yes** | common-prompt "Dual-Hub Routing" — separates work reports from knowledge submissions. Directly applicable. |
| **XP/TDD roles** (RED/GREEN/PURPLE) | **No** | POs coordinate, don't implement. Each remote team has its own pipeline (e.g. bigbook-dev's plantin/montano/granjon/ortelius — `designs/deployed/bigbook-dev/design-spec.md:2` composition). |
| **Resource Partition Table / worktree isolation** | **No** | Those solve *shared-repo concurrent-write* (topic 03 Protocol 5; common-prompt worktree rule). POs don't share a work repo — each holds a **read-only reference clone** and work syncs via GitHub from the remote side. |
| **Section-ownership tables** (research-team write-conflict avoidance) | **Partial** | Only if POs co-write shared design docs locally. Likely light. |

**Ever-growing roster note:** the "ever-growing team of POs" is the load-bearing design axis. Two precedents inform it: the **guild/consultancy archetype** (topic 01:63-69, topic 10) handles a *dispatched-on-demand* specialist pool, and Celes's team-sizing rule (my scratchpad `[PATTERN]`): **size = number of distinct abstraction boundaries, not deliverables.** Here the boundary is **one PO per product/remote-team**, so roster grows 1:1 with products. That's clean, but the **team-lead's context budget** becomes the scaling constraint (same problem topic 03:809 flags for the manager agent at 10+ teams) — the local librarian + per-PO scratchpads are the mitigation.

---

## 3. Cross-Team Comms Precedent — does any apply to PO↔remote-team-lead?

There is a **mature, layered inter-team comms stack**, all of it **message/inbox-based**:

| Mechanism | What it is | Status | Cite |
|---|---|---|---|
| **Stationmaster hub** (post-office model) | Central hub; customers dial **out** only, hub holds only pubkeys, `deposit`/`collect`/`ack`, channel-is-identity, delete-on-ack at-least-once. Forced-command `sm-shell <team>` per connection. | **RATIFIED S49**, hub build-verified on prod-llm S50 | wiki `decisions/stationmaster-post-office-model.md`; `poc/ghost-bridge/stationmaster-protocol.md` v1.0.0 |
| **Courier** (customer-side) | Local file disciplines (consume-by-rename, exclusive-create inject, delivered-ledger dedup); pushes/pulls hub over plain ssh exec. | Reference courier landed S50 | same; `poc/ghost-bridge/stationmaster-courier.py` |
| **Ghost-member** | A `members[]` entry whose backend is a pluggable transport, not a Claude agent. Sending to a remote team = normal `SendMessage`. Transport catalog includes `ssh-tunnel`, `gh-issues`, `wss-relay`. | Pattern, high confidence; ghost-bridge v1 daemon shipped | wiki `patterns/ghost-member-as-universal-integration-surface.md` |
| **comms-dev hub/relay** (mTLS/TCP) | Inbound-only mTLS relay, `role:'hub'`, defaultPeer routing, SendMessageBridge (broker inbox → framework inbox). | v2.1 live; v3 E2E implemented not deployed | `comms-dev/docs/architecture.md` |
| **Herald's inter-team protocols** (topic 03) | Handoff (Protocol 1), hybrid hub/direct-link topology (Protocol 2), broadcast governance (Protocol 3), UDS+GitHub two-layer transport (Protocol 4). | Design, ratified into topic 03 | `topics/03-communication.md:90-618` |

**Does it apply to PO↔remote-team-lead?** Two clean answers depending on channel choice:

- **If PO↔remote-team-lead is message-passing:** it is **not a new channel at all** — it's exactly what stationmaster/courier/ghost-member were built for. A PO registers a **ghost-member** for its remote team with an `ssh-tunnel` or `stationmaster` transport; "message my remote team-lead" becomes a normal `SendMessage`. This is the **strongly-recommended** path: proven, at-least-once, dedup'd, survives restarts, and reuses the exact ssh reachability from §1a. The stationmaster's **channel-is-identity** and **grant-based consent** map naturally to per-product isolation.
- **If PO↔remote-team-lead is literally driving a live CLI (send-keys):** it **is genuinely new** (§1c). None of the above drives a terminal — they all write inbox files. The forced-command ssh work (`sm-shell`) is the *nearest* substrate (per-connection ssh exec into a remote), and its gotchas (`nologin-shell-defeats-forced-command.md`) would bite immediately, but it's request/reply over stdin/stdout, not interactive-REPL driving.

**Recommendation:** default to the **ghost-member + stationmaster** channel for PO↔remote coordination and reserve ssh+tmux for **human-in-the-loop / observation** (a PO or the human ssh's in to *watch* or *hand-drive* when needed). If interactive send-keys driving is a hard requirement, it needs its own spec + acceptance test over real ssh+tmux (the #60 crash class and capture-pane read-back are unretired risks).

**Role precedent — Hopper (deployment operator):** the closest existing role to "an agent acting into a team it doesn't live in" (`designs/deployed/operator-role/design-spec.md`). Hopper executes ops against **FR-shipped substrates for other teams** under: **tiered risk (R read-only / M designed-mutation / D destructive-needs-sanction)**, **read-the-deployed-artifacts-first discipline**, **append-only ops log**, and **no direct-from-PO tasking** (routes through team-lead). A PO driving a remote team should inherit this shape: a **tiered action model**, a **read-the-remote-state-first rule**, and an **audit log per remote-team**.

---

## 4. GitHub-Driven Workflow Precedent

**What exists:**

- **GitHub Issues as the durable knowledge/work layer** is already designed: topic 03 §4B (`03-communication.md:567-618`) specifies issue format (`Team/Agent/Type/Affects` header + markdown body + attribution), a **label convention** (`team:<name>`, `affects:<name>`, `type:finding|decision|question|blocker`), and tooling (`comms-publish`/`comms-watch` wrapping `gh issue create`/`gh issue list`). The **ghost-member `gh-issues` transport** (`ghost-member...md:72`) implements this as a pluggable channel.
- **GitHub as versioning/work backend, no DB** is the established pattern for product teams (bigbook-dev: "GitHub as the versioning backend — no database", `designs/deployed/bigbook-dev/design-spec.md:1`; edits become commits/PRs). mvox syncs work through GitHub from the remote side (`designs/deployed/mvox_v4e_web/README.md`).
- **CCR rebuild-request flow** (topic 11) shows the **PR-is-the-contract** convention: the team edits its repo and opens a PR; a hub message points at the PR but never carries the change; review happens on the PR. This is the template for **"work syncs through GitHub, coordination messages only point at it."**
- **Personal-repo / reference-clone convention** exists informally: mvox's local clone lives at `~/Documents/github/.mmp/mvox_v4e_web/` ("personal-repo convention", `mvox_v4e_web/README.md`), separate from the org repo, explicitly **reference-only** with work syncing from the remote side. This directly matches "PO keeps the product repo cloned locally for reference only."

**What does NOT exist (new work):**

- **No epic/task issue taxonomy.** Grep finds "epic" only in `topics/03-communication.md` (generic) and `designs/new/raamatukoi-dev/roster.json`. There is **no convention for epic issues, epic→task decomposition, cross-referencing, or a PO's driving cadence over issues.** The design must define: epic issue template, task-issue template, labels (`epic`, `product:<name>`, status), and how a PO turns an epic into tasks dispatched to its remote team.
- **No convention binding a GitHub issue to a remote-team dispatch.** CCR binds a PR to a hub `rebuild-request`; the PO team needs the analog: an **epic/task issue ↔ remote-team-lead instruction** binding (which is where §3's channel choice re-enters — the dispatch either rides a ghost-member message or a hand-driven ssh session).

---

## 5. Risks & Open Questions the design must answer

1. **Channel decision (highest-leverage).** Is PO↔remote-team-lead **message-passing** (reuse ghost-member/stationmaster — proven) or **interactive CLI driving via tmux send-keys** (net-new, carries #60 crash class, needs capture-pane read-back + ready-detection contract + its own over-real-ssh acceptance test)? Everything downstream depends on this. **My recommendation: message-passing as the primary channel; ssh+tmux reserved for human observation/hand-driving.**
2. **Registry enrollment for remote teams.** Do the four remote teams (mvox, bigbook, ad-auto, mikrotik/field-network) each get a `registry.json` row + dedicated ssh key + reserved port? Which host (RC vs PROD-LLM → direct-ssh vs ProxyJump)? mvox is explicitly a **non-EVR-org, non-FR-substrate** clone (`mvox_v4e_web/README.md`) — so substrate ownership per remote team is heterogeneous; the PO team can't assume FR owns them.
3. **Local librarian scope.** Cross-product PO knowledge only (recurring epic patterns, per-remote-team quirks, dispatch outcomes) — explicitly NOT code knowledge (that stays in each remote team's own wiki). Define the boundary so it doesn't duplicate remote-team knowledge bases.
4. **Ever-growing roster context budget.** At N products the team-lead holds N POs' state. Same bottleneck topic 03:809 flags for the manager agent at 10+ teams. What's the sharding/delegation plan? (Per-PO scratchpads + librarian help; a second coordinator may be needed past ~10.)
5. **Reference-clone drift & staleness.** Local clones are reference-only and work syncs from the remote side — clones will drift from GitHub truth. Define a `git pull` discipline / staleness rule (cf. wiki gotchas on stale local state; comms-dev CLAUDE.md's "pull latest memory before startup" is the analog).
6. **Consent / isolation between products.** If using stationmaster, grants are per-team and unilateral (channel-is-identity) — clean. If using ad-hoc ssh, per-product key isolation is the boundary. Either way: can PO-A ever reach remote-team-B? Default no; enforce at key/grant level.
7. **Epic/task issue conventions** (§4) — template, labels, decomposition, issue↔dispatch binding. Fully net-new.
8. **PO tasking discipline (Hopper template).** Adopt tiered-action + read-remote-state-first + per-remote-team audit log? Who can task a PO (team-lead only, not human-direct — the Hopper rule)? How does a PO escalate a blocked remote team?
9. **Attribution across the boundary.** Each remote team already stamps its own prefix (bigbook `(*...*)`, mvox Renaissance-composer roster). Register a PO-team prefix; ensure PO messages into a remote team carry it so remote-side artifacts are auditable to their PO origin (topic 03:384-397, unique-prefix rule; note the known `RC-DEV` non-migration gap at 03:61).

---

## 6. Agent-Driven tmux/screen Over SSH — Mechanics (S60 second pass)

**Context:** PO (Mihkel) chose literal interactive tmux driving over my hybrid recommendation; Herald is speccing the interaction contract (`designs/new/po-team/protocols.md`). This section supplies the mechanics that feed that contract.

### CORRECTION to §1c — precedent EXISTS and the method is proven

My first-pass "no precedent for agent-driven tmux" was **wrong** and I retract it. There is substantial, recent, in-repo prior art: **Hopper drove interactive Claude sessions entirely via remote `tmux send-keys` (inject) + `tmux capture-pane` (read) over ssh** across the S54/S55 migration-validation probes (WS3b), including a full OAuth login flow. The method **works today**; the failures in those sessions were host-disk-full and a wake-latency confound, **not** injection crashes. The crash class is real but **narrower and avoidable** than I first framed (see (a)). This corrects the framing but not the recommendation structure — the risks just become specific, gated engineering rather than an unknown.

### (a) What #60 actually documented — and whether driving an existing session avoids it

There are **two distinct documented failure modes**, both about `send-keys` interfering with a Claude process, and **neither invalidates driving an idle interactive session**:

1. **#60 / apex Session-17 — the retirement trigger.** Crash class on **permission-dialog rendering under a tmux-pane-*LAUNCHED* `claude`** (`tmux-spawn-guide.md:1-33`). This is why tmux-pane *spawning* was retired framework-wide (moved to the Agent tool). The trigger couples **(launch-into-pane) + (a permission dialog rendering)**.
2. **Runbook §16 — "Don't send-keys to Panes Running Claude"** (`container-deployment-runbook.md:565-584`). Sending **shell commands** (`cd … && clear`) via `send-keys` into a pane *running* Claude injects them **as input to Claude**, corrupting its turn state (and a following `split-window` then fails "size missing"). This is a **misuse** class: treating a Claude-occupied pane as a shell.

**Does driving an EXISTING session via send-keys/capture-pane avoid it? YES — with one gate.** The proven-safe pattern (Hopper WS3b) is: the CLI is already at an **idle prompt**, you `send-keys` a **prompt string + `Enter`**, and `capture-pane` to read the result. The two crash modes are avoided by construction: (1) you are not launching claude into the pane, and (2) you are sending it a *prompt at its prompt*, not shell commands. **The single residual trigger is send-keys landing while a permission dialog is up** — hence Herald's §1.2 injection safety gate (observe idle prompt first via `capture-pane`/`attach -r`; run the remote CLI in a low-dialog/pre-authorized permission mode) is **exactly the right and empirically grounded mitigation**. Confirming evidence that idle-prompt driving is safe: the WS3b auth flow drove theme-select → login-method → OAuth-code injection (`send-keys -l`, never logged) with no crash (`operations-log-2026-06.md:827`; `migration-validation-probe-findings-2026-06-17.md:97`).

**One adjacent finding worth carrying to Herald:** the S55 P6 result was inconclusive-leaning-negative with a **named confound — a headless, never-attached pane has `focus-events off` and may not proactively wake on an external inbox-write** (`migration-validation-probe-findings-2026-06-18.md:33,107`). This does **not** bite the PO channel (a PO nudges via explicit `send-keys`, not by relying on background wake), but if the design ever assumes "remote lead wakes on its own when I write GitHub/inbox," that assumption is uncharacterized on a never-attached pane. Non-blocking for the tmux-drive channel; flag it so nobody leans on proactive wake.

### (b) tmux vs screen for this use

The repo uses **tmux exclusively**; GNU `screen` has **zero operational usage** (grep for `screen -r/-x/-S/-dm` returns nothing outside the po-team docs mentioning it as a hypothetical alternative). Capability mapping for the drive loop:

| Need | tmux | screen | Verdict |
|---|---|---|---|
| Inject keystrokes | `send-keys -t <sess> '<text>' Enter` (and `-l` literal for secrets) | `screen -S <s> -X stuff '<text>\n'` | tmux cleaner; `-l` literal-mode is a first-class secret-injection primitive |
| Read pane back | `capture-pane -t <p> -p \| tail -N` → **stdout** | `hardcopy <file>` then read the file | **tmux decisively better** — screen has no direct-to-stdout capture; the hardcopy-to-file round-trip is clunky in a tight poll loop |
| Read-only observe | `attach -t <s> -r` | `-x` (multiuser) + per-user `aclchg` for RO | tmux one-flag; screen RO needs ACL setup |
| Session naming/discovery | `new-session -A -s <name>`, `ls` | `-S <name>`, `-ls` | parity |
| Ready/idle detection | `capture-pane` → look for idle `❯` vs shimmering processing indicator | via hardcopy | tmux — because capture is stdout |

**Recommendation: tmux** (concurs with Herald §6 Q1). Every existing asset assumes tmux — the WS3b harness, the `tmux-direct-brief` skill, the entrypoint auto-tmux blocks, the retired spawn tooling. Screen's read-back is strictly worse for the capture loop and it offers no compensating advantage. If screen must be supported, the cost is a `hardcopy`-based capture shim.

### (c) In-repo prior art for send-keys driving (the reusable assets)

| Asset | What it gives the PO design | Cite |
|---|---|---|
| **Hopper WS3b probe (S54/S55)** | End-to-end proof of remote `send-keys`+`capture-pane` driving a live Claude session over ssh, incl. OAuth login | `migration-validation-probe-{brief,findings}-2026-06-18.md`; `memory/hopper.md` |
| **`migration-probe-harness/`** | **Codified reference implementation** — `harness.sh` `tmux_send()` = `send-keys -l <text>; send-keys Enter`; `tmux_capture()` = `capture-pane -p \| tail -50`; `lib/checks.sh` launches sessions via `new-session -d -s … 'claude'` | `designs/new/migration-probe-harness/harness.sh:36-37`, `lib/checks.sh` |
| **Drive-cycle spec** | The mechanics doc: single-line inject rule, **3-separate-invocation multi-line/paste rule** (`scp` → `load-buffer`+`paste-buffer` → *separate ssh* `send-keys Enter`), and the gotcha that **chaining paste+Enter in one ssh silently fails to submit**; ready-detection via shimmer-vs-`❯` | `teams-migration-probe-container-scope-2026-06-17.md:82-122` |
| **`tmux-direct-brief` skill** | Named canonical skill for the send-keys/capture-pane cycle ("the mechanics that actually work"). **Not present in the local `~/.claude/skills/`** — lives on the rc host / operator environment; flagged so the PO-team spawn env provisions it | referenced in `teams-migration-probe-container-scope-2026-06-17.md:75,87` |
| **Lazy-SSH auto-tmux entrypoint** | The **human-present launch path**: `.bashrc` gated on `$SSH_CONNECTION` does `tmux new-session -A` + `send-keys "claude" Enter` — a human at the terminal means no permission-dialog crash. The clean way to get a remote lead's CLI *up* in its session | `designs/new/hr-devs/container/entrypoint-hr-devs.sh:277-294`; `ccr-rebuild-execution.md:162`; `ccr-protocol-plan-2026-06-16.md:296` |
| **rc pattern** | `tmux new-session -A -s <name>` (attach-or-create) is the established session-bring-up idiom | probe scope doc; Hopper memory |
| **Retired spawn tooling** | `spawn_member.sh` / `tmux-spawn-guide.md` — same `send-keys` mechanics (deprecated for *spawning*, but the injection primitive is identical) | `tmux-spawn-guide.md`; `teams/spawn_member.sh:112` |

**Net for the mechanics:** the PO tmux-drive channel is **not net-new to build** — it is a **generalization of the WS3b harness** from "operator drives a probe" to "PO drives a remote team-lead." The concrete deliverables Herald's contract should pin: **(1)** the discover→observe→inject sequence (already in his §1.1); **(2)** the injection safety gate = idle-prompt check + low-dialog permission mode (his §1.2 — grounded by (a) above); **(3)** the multi-line paste 3-invocation rule + the paste+Enter-in-one-ssh silent-no-op gotcha (from the mechanics doc — worth promoting into the contract explicitly); **(4)** `send-keys -l` for any secret, never echoed; **(5)** the over-real-ssh acceptance test Aen mentioned = the WS3b drive loop re-run against a PO product session (the harness is the test skeleton).

---

## Key citations index

- Remote access: `deployments.md`, `registry.json`, `comms-dev/docs/architecture.md:191-197`
- tmux deprecation / spawn: `teams/framework-research/docs/tmux-spawn-guide.md:1-33`; `comms-dev/CLAUDE.md`
- Comms stack: wiki `decisions/stationmaster-post-office-model.md`, `patterns/ghost-member-as-universal-integration-surface.md`, `patterns/per-connection-forced-command-shell-over-resident-daemon.md`, `gotchas/nologin-shell-defeats-forced-command.md`; `topics/03-communication.md`; `poc/ghost-bridge/`
- Role precedent: `designs/deployed/operator-role/design-spec.md`
- Team structure: wiki `patterns/operational-team-archetype.md`; `topics/01-team-taxonomy.md`; common-prompt Dual-Hub + Scratchpads
- GitHub/product teams: `topics/03-communication.md:567-618`, `topics/11-deployment-lifecycle.md`, `designs/deployed/bigbook-dev/design-spec.md`, `designs/deployed/mvox_v4e_web/README.md`
- **tmux-drive mechanics (§6):** `teams-migration-probe-container-scope-2026-06-17.md:75-122`, `migration-validation-probe-{brief,findings}-2026-06-18.md`, `designs/new/migration-probe-harness/{harness.sh,lib/checks.sh}`, `container-deployment-runbook.md:565-584` (§16), `tmux-spawn-guide.md:1-33` (#60), `designs/new/hr-devs/container/entrypoint-hr-devs.sh:277-294`, `memory/hopper.md` (WS3b), `designs/new/po-team/protocols.md` (Herald)

(*FR:Finn*)
