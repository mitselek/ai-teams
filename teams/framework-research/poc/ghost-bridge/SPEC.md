# ghost-bridge — Cross-Host Inter-Team Comms (v3.1 spec)

**Status:** Draft v3.1. Tactical MVP. Supersedes v1 (2026-05-13), the v2 multi-pair code shape, and the v3 draft (same day). Absorbs S48 (2026-06-09/10) empirical findings — including the **late S48 correction** that re-diagnosed the duplication bug.

**Date:** 2026-06-10 (session 48)

**v3 → v3.1 in one line:** the 4x–8x duplication was caused by **11 zombie daemon instances each forwarding independently**, NOT by the harness clobbering inbox-file `read` flags. v3's "Constraint 1" (harness owns/rewrites tracked files) was **withdrawn** — the *observations* were real, but the *mechanism* was inferred and wrong. The fix is single-instance lifecycle discipline, not a dedup ledger.

**Claim discipline (sharpened in v3.1):** Every claim is tagged **[TESTED-OBS]** (an observation empirically seen), **[TESTED-MECH]** (a mechanism empirically confirmed to *cause* the observation), or **[INFERRED]** (reasoning not yet confirmed). The day's biggest lesson, now twice over: v1 built `members[]`-registration on an untested inference; v3 built a dedup ledger on a *tested observation* (the duplicates were real) coupled to an *untested mechanism* (that the harness caused them). **Tag mechanisms separately from observations** — a real observation does not validate the mechanism you guessed produced it.

---

## What changed across versions (read this first)

| assumption | status | grade |
|---|---|---|
| Ghost members in `roster.json` are how a name becomes addressable | **WRONG.** `members[]` was never on the dispatch path. Ghost members RETIRED. | [TESTED-MECH] |
| `restore-ghost-members.sh` re-registers ghosts each session | **RETIRED.** Not needed; apex confirmed same. | [TESTED-MECH] |
| Harness rewrites tracked-name inbox files, clobbering `read` flags (v3 "Constraint 1") | **WITHDRAWN.** Never proven. Duplicates fully explained by zombie instances. | observation real; mechanism [INFERRED] and disconfirmed |
| The duplication needs a dedup ledger to fix (v3 "Mechanism A") | **DROPPED.** With one instance, the `read`-flag bookkeeping worked correctly all along. | — |
| `from` is unverifiable; trust is filesystem-level | **HOLDS.** (Cal flagged a clean-session re-verify; see Constraint 2.) | [TESTED-OBS] |
| SSH ships scripts as command-line args | **WRONG on Windows.** ~8KB argv truncation; ship via stdin. | [TESTED-MECH] |
| Daemons launched from harness tool calls die | **WRONG — INVERTED.** They *survive* and accumulate; Git-Bash liveness checks can't see Windows-native processes, so they look dead while running. | [TESTED-MECH] |

Retained design: **daemon-transports-between-inbox-files**, **sender-`from`-rewrite** (display-only), **SSH-outbound-only-from-FR**, and the **`read`-flag as forwarded-marker** (now confirmed correct under single-instance operation).

---

## Goal

Enable an agent on one team to message an agent on another team using their native `SendMessage` tool, and receive replies in their native inbox, with no user-CLI relay.

**Concrete first case:** FR team-lead ↔ apex-research team-lead (Aen ↔ Schliemann).

**Out of scope for v3.1:** member-to-member fan-out, central hub, app-layer auth, encryption beyond SSH.

---

## Substrate model (the empirical foundation)

One tested fact, two surviving constraints, and one promoted lifecycle constraint.

### Core fact — dispatch is plain file I/O

**[TESTED-MECH]** `SendMessage(to="<name>")` writes the message into `~/.claude/teams/<team>/inboxes/<name>.json`, creating the file if absent, with `read: false`. `members[]` is **not** consulted on the dispatch path — no gating, no validation, no role check.

- Verified on FR (Opus 4.6): `SendMessage(to="test-probe")`, name absent from `members[]`, no pre-existing inbox file → success; harness created the file and delivered (Cell 1, the "Jane Doe" probe — **daemon-independent**, so unaffected by the zombie-instance correction).
- Verified on apex (Linux, Opus 4.7) by Schliemann as trusted oracle: same behavior.
- Canonical: `wiki/references/sendmessage-dispatch-is-inbox-file-write.md` (pending Cal filing per Medici S48 Protocol-A draft).

**Consequence for the bridge:** a "ghost" addressable name needs **nothing** pre-created — no roster entry, no `members[]` entry, no seeded inbox file. The first `SendMessage` to it creates the outbox file. This is why ghost members are retired.

### Constraint 1 (v3.1) — exactly one daemon instance; liveness via OS-native tools

**[TESTED-MECH]** Background daemon processes launched on the FR (Windows) host **survive** beyond the launching context and **accumulate**. S48 found **11 live instances simultaneously** via Windows `tasklist`. Our Git-Bash `kill -0` / `ps` liveness checks are **blind to Windows-native processes** — they reported the instances dead while every one was running.

- **This is the true cause of the 4x–8x duplication:** N living instances each independently read the same outbox, each forwards every unread message, each flips `read`. Receiver sees N copies. The fresh-name test looked clean only because just the newest instance had that pair in its config.
- **Disconfirms v3 "Constraint 1":** no harness flag-flipping was ever observed in isolation; the read-flag bookkeeping is correct under a single instance.

**Requirement (the central lifecycle rule for v3.1):**

1. **Exactly ONE instance** runs at a time. Enforced by a PID-file check that **actually works on the host OS** — on Windows, the check must consult `tasklist` (or equivalent), not a Git-Bash `kill -0` that silently can't see the process.
2. **Started by the human in a visible terminal**, so the operator can see it, signal it, and kill it. Not launched from a harness tool call (where it becomes invisible to the operator's Git-Bash tooling and accumulates unnoticed).
3. **Liveness-checked via OS-native tools** — `tasklist` on Windows, `ps`/`pgrep` on Linux. Never trust a cross-runtime liveness probe (Git-Bash `kill -0` against a Windows PID is the trap that produced this incident).

### Constraint 2 — trust is filesystem-level

**[TESTED-OBS]** `from` is unverifiable; no message signatures exist; `members[]` cannot serve as a trust list (not on the dispatch path). **Any message present in an inbox file is authentic by definition** — the only trust boundary is who can write the file.

**Consequence:** the security perimeter is **SSH keys + filesystem permissions**, not application logic. The bridge MUST NOT implement app-layer auth, sender allow-lists, or signature checks — security theater on this substrate. The `from`-rewrite is a *display/routing* convenience, explicitly NOT a trust mechanism.

**[FLAG — re-verify]** Per Cal's correction: the trust-model observations were taken during a session with zombie instances live. Nothing about the zombie bug touches the *trust* properties (those are about who-can-write-the-file, not about daemon count), but re-confirm on a clean single-instance session as hygiene before filing the trust property as settled.

### Constraint 3 — transport ships scripts via stdin

**[TESTED-MECH]** Windows SSH truncates command-line arguments at ~8KB. Remote scripts MUST ship via stdin: `ssh <host> bash` with the script piped to stdin, never as an argv element. Already implemented in `ghost-bridge.py` `ssh_exec` (`input=remote_script.encode(...)`); v3.1 ratifies it as a hard requirement.

---

## Architecture

```
  FR side (local dev; daemon human-started in visible terminal)   apex side (Linux container)
  ─────────────────────────────────────────────────────────     ───────────────────────────

  Aen ──SendMessage──> apex-lead-ghost  (FR-local outbox file)  Schliemann ──SendMessage──> fr-lead-ghost
                              │                                              │  (apex-local outbox file)
                              │ <──────── ghost-bridge daemon ───────>       │
                              │           (EXACTLY ONE instance,             │
                              │            both directions)                  │
                              ▼                                              ▼
                       ssh-WRITE remote inbox                          ssh-READ remote outbox
                              │                                              │
                              ▼                                              │
                       apex's team-lead.json   ◄──── local-WRITE  ◄──────────┘
                              │                       FR's team-lead.json
                              ▼                              ▲
                       harness wakes Schliemann               │
                                                       harness wakes Aen
```

- **Outbox files** (`apex-lead-ghost.json` on FR; `fr-lead-ghost.json` on apex) are written by the local agent via `SendMessage`, read by the daemon. **[TESTED-MECH]** No pre-creation needed.
- **Inbox targets** (`team-lead.json` each side) are written by the daemon, read/woken by the harness.
- **[TESTED-OBS]** Harness wakes the recipient on inbox-file change (validated cross-host S31 RFC #66; canonical `wiki/references/inbox-file-write-as-wake-mechanism.md`).
- **[INFERRED]** SSH outbound-only from FR; FR needs no SSH server. (Topology unchanged from v1; not re-tested this session.)

---

## Sender-identity rewrite (display/routing only — NOT trust)

**Rule:** every cross-host forward overwrites the `from` field with the configured `rewrite_from_to` value.

| Direction | Becomes | Receiver sees |
|---|---|---|
| FR → apex | `fr-lead-ghost` | apex's local label for FR |
| apex → FR | `apex-lead-ghost` | FR's local label for apex |

**[TESTED-OBS]** `from` is unverifiable (Constraint 2), so this is purely cosmetic/routing — zero trust weight. v1 framed it as identity-preservation (right mechanic, wrong reason); v3.1 keeps the mechanic, drops the trust connotation.

Information loss accepted: receiver always sees the ghost label, never the original sender. Fine for team-lead-to-team-lead. Future member-to-member routing would embed the original sender in body or a `via` field.

---

## Dedup: solved by single-instance lifecycle, not bookkeeping

**[TESTED-MECH]** Under exactly one daemon instance, the `read`-flag forwarded-marker works correctly: the daemon forwards each unread message once, flips `read: true`, and never re-sees it. No ledger, no content-hash, no extra state file. The v3 "Mechanism A" dedup ledger is **dropped** — it was solving a non-problem (the duplicates were N instances, not flag clobbering).

**The dedup requirement reduces entirely to Constraint 1:** enforce exactly-one-instance and the existing bookkeeping is sufficient. This is the simpler design PO leaned toward — it removes a state file and a hashing decision, and replaces them with one liveness rule.

### Persist/restore of bridge outboxes — optional hygiene, NOT load-bearing

**[TESTED-OBS — by reading the scripts]** `persist-inboxes.sh` (all-mode) globs `runtime/inboxes/*.json`, so bridge outboxes are persisted; `restore-inboxes.sh` copies them back (filtering only shutdown/idle).

With the dedup confound dissolved, restore-from-repo is **no longer a duplication risk** — a single instance reading a restored outbox will see already-`read: true` entries and skip them. So excluding bridge outboxes from persist/restore is now **optional hygiene**, not a dedup mechanism:

- **Argument for excluding:** bridge outbox content is transient transport state, not durable team memory; carrying it across sessions is clutter.
- **Argument against bothering:** it's harmless under single-instance operation, and excluding it is a change to Volta's scripts for marginal benefit.

**Recommendation: defer the exclusion as low-priority hygiene.** If we do it, it's a small `[COORDINATION → Volta]` ask, no longer urgent. (Was load-bearing in v3; demoted in v3.1.)

---

## Daemon lifecycle (v3.1 — the central requirement, inverted from v3)

**The problem is NOT "daemons die."** It is: **daemons launched from harness tool calls are invisible and unkillable from Git Bash, and they accumulate.** A harness-launched daemon keeps running, our liveness check can't see it, so we launch "another" — eleven times over.

**v3.1 requirement:**

1. **Human-started, visible terminal.** The operator (PO) launches the single daemon in a real terminal they can see and Ctrl-C / kill. NOT from a harness tool call.
2. **Single-instance enforced, OS-correctly.** Before starting, the start path checks for a live instance using an **OS-native** probe:
   - Windows: `tasklist` (filter on the PID from the PID file, or on the python/script image name).
   - Linux: `ps -p <pid>` / `pgrep -f ghost-bridge`.
   - If a live instance is found, **refuse to start a second** (or offer to kill the existing one first). The PID file alone is insufficient — it must be validated against an OS-native liveness check, because a stale PID file plus a blind Git-Bash check is exactly how the 11 zombies slipped through.
3. **Stop is OS-correct too.** The stop path kills by the OS-native mechanism, then confirms the process is gone via `tasklist`/`ps` — not via Git-Bash `kill -0`.

**Cleanup of the existing zombies is an operational task, not a SPEC item** — route to Hopper if execution against the host is needed (Brunel diagnoses/designs; Hopper executes). The SPEC's job is to specify the lifecycle that prevents recurrence.

**[COORDINATION → Volta]** daemon start/stop touches lifecycle. Proposed change: the start/stop scripts use OS-native liveness probes and single-instance enforcement; launch is human-in-terminal, not harness-tool-call. Route per the section-ownership handshake.

---

## Verification protocol (the bridge's acceptance test)

**Formalized rule: the receiving end is the trusted oracle.** A message is "delivered correctly" iff it appears **exactly once**, with the correct rewritten `from`, in the *receiver's* inbox — confirmed by the receiving side, not inferred from the sender's logs. **This protocol is exactly what caught the zombie bug** (the receiver's count was N×, not 1×) — it survives v3.1 unchanged, plus one new precondition.

**Acceptance test for "v3.1 ships":**

0. **PRECONDITION — instance count == 1.** Before any count test, verify via OS-native tooling (`tasklist` on Windows, `pgrep`/`ps` on Linux) that **exactly one** ghost-bridge instance is running. A count test run with N>1 instances measures the bug, not the design. This step is non-negotiable and goes first.
1. **Exactly-once outbound.** Aen sends N distinct messages via `SendMessage(to="apex-lead-ghost")`. Schliemann (trusted oracle) confirms **exactly N** arrived, each once, each `from: fr-lead-ghost`.
2. **Exactly-once inbound.** Schliemann sends M distinct messages via `SendMessage(to="fr-lead-ghost")`. Aen's FR inbox shows **exactly M**, each once, each `from: apex-lead-ghost`.
3. **Persist/restore survival.** Persist, simulate a session restart, restore, send again; confirm no resurrection of already-delivered messages as new (single-instance read-flag bookkeeping held across the cycle).
4. **Single-instance discipline holds.** Attempt to start a second instance; confirm the start path refuses (OS-native liveness check works). Confirm stop actually kills (verified via `tasklist`/`ps`, not Git-Bash `kill -0`).

The count-at-the-receiver is the single load-bearing assertion. Sender-side logs corroborate, never suffice.

---

## Substrate invariants (declared per FR discipline)

| # | Invariant | Status | Break behavior |
|---|---|---|---|
| 1 | SSH outbound FR→apex works without server-side FR reachability | [INFERRED] | outbound fails; daemon logs + retries |
| 2 | `~/bin/rc-deployments.json` has the `apex-research` entry | [TESTED-OBS, PoC] | daemon fails at startup with explicit error |
| 3 | `python3.7+` + `fcntl` on apex (remote primitives) | [TESTED-OBS, S31] | SSH-script execution fails; daemon logs |
| 4 | Local fs write to FR's `team-lead.json` works | [INFERRED] | inbound message dropped (apex flag already flipped — see code note) |
| 5 | Harness wakes recipient on inbox-file change | [TESTED-OBS, S31] | harness-side; out of daemon control |
| 6 | SSH key + auth pre-configured | [TESTED-OBS, PoC] | all SSH ops fail; daemon logs |
| 7 | Dispatch is file-I/O; no `members[]` gate | [TESTED-MECH, S48] | (enabling fact, not a fragile dependency) |
| 8 | Scripts ship via stdin (no argv-size limit hit) | [TESTED-MECH, S48] | Windows arg truncation corrupts remote script |
| 9 | **Exactly one daemon instance, liveness via OS-native tools** | [TESTED-MECH, S48] | **N instances → N× duplication (the actual S48 bug)** |
| 10 | `read`-flag forwarded-marker is correct under single instance | [TESTED-MECH, S48] | (was wrongly doubted in v3; confirmed correct in v3.1) |

Invariant #4's break has a known code asymmetry: on inbound, the apex-side `read` flag is flipped *before* the local write; if the local write fails, the message is lost (apex won't re-send). Not a dedup issue; logged as a known limitation.

---

## Known limitations (v3.1)

1. **Single-instance enforcement must be OS-correct.** The whole incident was a cross-runtime liveness blind spot (Git-Bash `kill -0` vs Windows process). The start/stop scripts MUST use OS-native probes; a naive PID-file check is insufficient. Highest-priority correctness item for the rebuild.
2. **Existing zombie instances** (the 11 found) need a one-time operational cleanup before the bridge is trusted — operational, route to Hopper.
3. **Inbound write-failure loses the message.** Invariant #4 asymmetry. Rare; logged; not addressed.
4. **Polling latency.** ~2s reply latency. Fine for human-pace comms.
5. **No supervisor / restart-on-crash.** Daemon death → comms stop until the human restarts it (acceptable given human-in-terminal model).
6. **Single pair targeted.** Code supports `pairs[]` (v2); v3.1 validates only FR↔apex.

---

## Coordination (section ownership)

- **[COORDINATION → Volta]** daemon start/stop scripts: OS-native liveness probes + single-instance enforcement + human-in-terminal launch (not harness-tool-call). Lifecycle-domain. Route via SendMessage per handshake.
- **[COORDINATION → Volta, LOW PRIORITY]** optional persist/restore exclusion of bridge outboxes as hygiene (no longer load-bearing for dedup). Defer unless Volta wants the cleanliness.
- **[→ Hopper, operational]** one-time cleanup of the 11 zombie daemon instances on the FR host (diagnosis here; execution is Hopper's per role-split).
- **Brunel owns:** the daemon process model, single-instance lifecycle design, the SSH/transport contract, and this SPEC.

---

## Open questions for PO

1. **Daemon placement.** Human-in-visible-terminal is the v3.1 requirement. Confirm: a terminal the PO keeps open per session (simplest), vs a detached `nohup`/tmux session the PO starts and the start-script single-instance-guards, vs an OS service (systemd-user / Windows scheduled task) with the liveness guard built in. v3.1 leans toward the middle option (detached but guarded) so a closed terminal doesn't kill comms, while the guard prevents accumulation.
2. **Bridge-outbox naming convention.** Still relevant if we ever do the optional persist/restore exclusion (a `bridge-*` prefix makes it a clean glob). Cheap to standardize now; low urgency.
3. **Zombie cleanup timing.** Clean the 11 existing instances before or as part of the rebuild? (Recommend: before any acceptance-test count, per acceptance-test step 0.)

---

## Rebuild scope (after this SPEC is ratified — code not touched yet per PO direction)

Against v3.1, the code rebuild will:

1. **Remove** all ghost-member / roster-registration assumptions and any `restore-ghost-members.sh` coupling.
2. **Fix the lifecycle** — this is now the primary code change: single-instance enforcement with **OS-native liveness probes** (`tasklist` on Windows, `ps`/`pgrep` on Linux) in the start/stop scripts; refuse-to-start-if-live; verify-killed-on-stop. Launch is human-in-terminal.
3. **Keep** the `read`-flag forwarded-marker (confirmed correct under single instance), the stdin SSH transport (already correct), the `from`-rewrite, the multi-pair config shape.
4. **Do NOT add** a dedup ledger (v3 Mechanism A dropped).
5. **Optionally coordinate** the low-priority persist/restore hygiene exclusion with Volta.

The current `ghost-bridge.py` already has the stdin fix and per-message flush; its **main v3.1 gap is the lifecycle / liveness-check layer** (the start/stop scripts and any PID handling), not the forwarding core. The forwarding logic was correct; it was run 11 times in parallel.

(*FR:Brunel*)
