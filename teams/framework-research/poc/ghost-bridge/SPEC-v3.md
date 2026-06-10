# Ghost-Bridge v3 — "Stationmaster" — SPEC (skeleton)

(*FR:Aen*)

**Status:** DESIGN COMPLETE (2026-06-10) — all design concerns D1–D11 ⬛ DECIDED (D1/D11 substrate-verified by Tests #5/#6; rest PO-ratified). Owed before production: T6.a race-harness re-run on Ubuntu (D10 substrate). Next: implementation plan.

**Provenance discipline:** This spec derives ONLY from `TRUTHS.md` (empirical, version-stamped) and PO design direction. SPEC.md (v1/v2) is NOT an input — its assumptions are untrusted per the 2026-06-10 redesign decision. Every load-bearing design rule cites its T-number. A rule with no T-number citation is a convention, marked `[CONV]`.

**Substrate baseline:** Claude Code CLI `2.1.170`, Windows dev / Ubuntu deploy. Re-validate the substrate contract (below) when the CLI version changes — semantics have flipped between adjacent versions before (see `TRUTHS.md` I-1).

---

## 1. Concept (PO, 2026-06-10)

One **always-on daemon** (`stationmaster`) bridges agent-team mailboxes across hosts.

- Single process, single config file: **`timetable.json`** — the route table.
- `timetable.json` is itself **watched by the daemon**; route changes apply in near-realtime without restart (semantics: D6).
- A **route** = tunnel properties + four team-scoped endpoint mailboxes (model: §3).

## 2. Substrate contract (what the design is allowed to rely on)

| # | Property | Truth |
|---|---|---|
| C1 | A message sent to a session-less name persists in its inbox file, undrained, indefinitely (≥10 min verified) | T3.a |
| C2 | Inbox files are auto-created on first dispatch; `inboxes/` dir may not exist until then | T3.b, T2.c, T4.c |
| C3 | A direct file write into a live member's inbox is picked up ≲0.5s, delivered as a teammate message, and WAKES an idle session | T4.a |
| C4 | Arbitrary, unregistered `from` names pass through verbatim to presentation | T4.b |
| C5 | Live-session inboxes are pending-only queues — delivered messages are REMOVED, not flagged | T1.b, I-1 |
| C6 | SendMessage success ≠ file written; sender-side enqueue lag VARIABLE ~0.5–9s, no fixed cadence | T2.a |
| C7 | mtime is unreliable for change detection; poll content | T2.b |
| C8 | Harness drain rewrites are not lock-protected against concurrent writers (clobber window untested) | T4.e, OPEN |

## 3. Route model — bidirectional, four inboxes (PO, 2026-06-10)

A **route** is a two-way bridge between a local and a remote team. Four inboxes are involved — two per side, each side holding one **ghost outbox** (watched) and one **delivery target** (injected into):

| # | Side | Mailbox | Role | Substrate |
|---|---|---|---|---|
| 1 | local | `apex-lead-ghost` | ghost outbox — local agents `SendMessage` here; daemon watches | C1, C2 |
| 2 | local | `team-lead` | delivery target — daemon injects inbound messages | C3 |
| 3 | remote | `fr-lead-ghost` | ghost outbox — remote agents `SendMessage` here; daemon watches via tunnel | C1, C2 |
| 4 | remote | `team-lead` | delivery target — daemon injects outbound messages | C3 |

**Attribution is derived, not configured:** the ghost name does dual duty — it is the address a team *sends to* AND the identity bridged messages *arrive from*. A message flowing local→remote is injected into #4 with `from` = #3's name (`fr-lead-ghost`); remote→local is injected into #2 with `from` = #1's name (`apex-lead-ghost`). The four names fully determine both attribution identities — no separate `from` field exists to misconfigure. (Settles part of D9.)

```jsonc
// timetable.json (shape sketch — field names settle with D-decisions)
{
  "tunnels": {
    "apex": { /* ssh host, port, user, key/keyless, ... (D5 owns health policy) */ }
  },
  "routes": [
    {
      "id": "fr-apex",
      "tunnel": "apex",
      "local":  { "team": "framework-research", "ghost": "apex-lead-ghost", "target": "team-lead" },
      "remote": { "team": "apex-research",      "ghost": "fr-lead-ghost",   "target": "team-lead" }
    }
  ]
}
```

- **ghost outbox** — session-less name whose inbox accumulates (C1); reachable via plain `SendMessage`, no registration (C2).
- **delivery target** — a live member's inbox; daemon injects by direct file write (C3).
- Each mailbox resolves to a path from `(side, team, name)` — resolution rules are D3's to settle.
- One direction of a route can be idle (a monitor-only bridge just never gets traffic into one ghost) — no asymmetric route type needed. [CONV]

### 3.1 Design axiom — one-way flow per inbox (PO, 2026-06-10)

Every inbox file has exactly **one consumer** (the owning session's harness; for ghost outboxes, the daemon). Producers may be many, but message flow through any inbox is **unidirectional: toward its owner**. The bridge is then a one-way propagation per file — no two-way merge, no conflict resolution, no file ever contested between two consumers.

- Self-send (T1.b/T1.c) is the degenerate case: producer and consumer co-located; the message never crosses the wire; the axiom holds at zero hops.
- The "mirror" and "relay" framings converge under this axiom: a one-way mirror with source-side cleanup IS store-and-forward. The remaining choice — delete-after-forward vs high-water-mark pruning — is D1/D2's to settle; both end in source deletion (ghost files have no other consumer and would grow unboundedly, C1).
- **D4's loop validation is the enforcement of this axiom:** a routing cycle is exactly a violation of one-way flow. Validation rule: the directed graph of (producers → inbox → consumer) edges across all routes must be acyclic per message path.

### 3.2 Rejected design: true file mirroring — and the rule it produced (PO self-callout, 2026-06-10)

A TRUE mirror replicates file state both ways: content toward the owner, and the owner's drain (`[]` rewrite) BACK toward the source. Examined and rejected:

- **Drain-back wipe race:** a new message landing in the source outbox between the last forward-sync and the drain-back gets overwritten by the replicated `[]` — silent loss as designed-in behavior on every consume cycle, with the window widened to seconds by tunnel latency. (C8's clobber hazard promoted to architecture.)
- **Contested-target ambiguity:** delivery targets also receive native traffic (the remote team's own agents). File-state sync cannot distinguish "absent because consumed" from "present because natively added" — it would replicate the remote team's internal messages back into our ghost outbox.

**Rule extracted (binding on D1/D2):** the unit of replication is the **message entry, never the file state**. Inbox files are queues whose contents move, not state to be synchronized. Whole-file operations (mirror, truncate, rsync-style sync) are wrong by construction; only per-entry operations — append exactly this, remove exactly these — are admissible.

## 4. Design concerns — resolved one at a time

### D1 — Outbox consumption — ⬛ DECIDED: consume-by-atomic-rename (2026-06-10, verified by Test #5)

**Problem:** new messages can land in a watched outbox anytime within ~0.5–9s of their send (C6), including between a daemon read and write-back; in-place modification therefore risks lost updates, and no locking primitive binds the harness (C8; advisory locks don't constrain non-participants, mandatory locks removed in Linux 5.15).

**Decision — the daemon NEVER writes the watched path:**

1. In-place modification of a watched outbox is **banned by design**.
2. Consume = atomic `rename()` of the whole outbox file into the spool (`spool/<route>/<timestamp>.json`), same filesystem as the inboxes dir.
3. The harness recreates the path on the next enqueue — **verified: T5.a** (recreate-fresh, no error, no resurrection).
4. Forward from the spool, then clear the spool entry (two-phase; spool file = crash journal → D2).
5. Parse before rename; skip cycle on parse failure (mid-write catch). Rename failure (Windows sharing violation) = safe no-op, retry next poll. Post-rename corruption = quarantine + D7 alert.

**Why it holds:** rename converts the unfixable loss race into a duplication race (harness read-modify-write straddling the rename could resurrect consumed entries), and duplication is neutralized by D2's seen-set dedup. Three deliberate timing attacks failed to produce loss or duplication (T5.c); harness enqueues append and preserve foreign entries (T5.b). Read-point (snapshot-at-send vs read-at-write) remains undiscriminated — dedup is the standing backstop for that unprovable negative.

### D2 — Crash safety: spool + synthesized message IDs — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** crash between forward and delete → duplicate; delete before confirmed remote write → loss. Harness messages carry no IDs.

**Decision — at-least-once, spool-as-journal:**

**Lifecycle (two-phase):**

```text
capture:  outbox --rename--> spool/<route>/<utc-ts>-<seq>.json   (atomic, D1)
forward:  per entry, oldest file first: remote inject (D11 discipline, via tunnel)
confirm:  remote script exit 0 (+ exclusive-create succeeded remotely)
record:   append entry ID to the route's delivered-ledger
shrink:   rewrite spool file minus the entry (spool is daemon-private —
          the in-place-write ban applies only to harness-contested files)
clear:    empty spool file deleted
```

- **Replay-on-start:** after the D8 probe, walk spool files in timestamp order; skip IDs present in the ledger; forward the rest.
- **Semantics: at-least-once, explicitly.** The only duplication window is a crash between remote-confirm and ledger-append (ms). Cost: a rare repeated message to an agent — accepted. Exactly-once is not pursued.
- **ID recipe:** SHA-256 over the entry's canonical JSON (sorted keys), truncated to 16 hex chars. Covers `from+timestamp+text+summary`; harness stamps each entry with its own ms-precision write time (T2.a), so collision requires identical content in the same millisecond from the same sender. Serves both dedup duties: consume-side resurrection backstop (D1/T5.c) and replay-side ledger.
- **Ledger:** append-only JSONL per route (`id`, `state`, `ts`); compacted at startup; retention 7 days or 10k IDs, whichever trims first. (Resurrection reaches back seconds; replay reaches back to the oldest spool file — both far inside the window.)
- **Placement:** `~/.claude/stationmaster/{spool,ledger}/<route>/`. **Startup validation:** spool and each watched inboxes dir must share a filesystem (rename atomicity is per-volume) — refuse the route otherwise, report via D7.
- **Ordering:** timestamped spool filenames + array order within files + single-threaded forwarding per route → send order survives crashes end-to-end.

### D3 — Endpoint addressing & path resolution — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** mailbox name alone breaks when any host runs multiple teams; remote paths additionally depend on user/home.

**Decision — semantic config, resolved runtime, per-endpoint executors:**

1. **Path template:** `<claudeHome>/teams/<team>/inboxes/<mailbox>.json`. `claudeHome` defaults to `~/.claude`, resolved at the executing end — daemon-local via `Path.home()` (NOT `$HOME`; Git Bash hands it back empty — startup.md gotcha #2), remote via login-shell `~` expansion. Per-endpoint `claudeHome` override for containers/odd homes.
2. **Config stays semantic** (`team` + `mailbox` triples), because three consumers need the semantics: attribution derivation (§3 uses ghost *names*), validation (name hygiene, team-exists), and remote portability (a literal path hardcodes the remote home; the template survives container rebuilds). **Escape hatch:** an endpoint may give explicit absolute `path` instead — rare, validated, and that route then requires explicit `from` (no name to derive).
3. **Resolve once, persist the result:** at config (re)load all endpoints resolve to canonical absolute paths; daemon writes `timetable.resolved.json` beside its state and logs resolved paths everywhere. Operator transparency without config verbosity. **D4 cycle validation compares resolved paths, not names** (names can alias one file).
4. **Name hygiene at load:** `team`/`mailbox` match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$`, no separators, no control chars. Precedent: S47's corrupt `apex-lead-ghost\r.json` killed persist-inboxes.sh; a hot-reloaded timetable is an injection surface — malformed names die at validation, never become paths.
5. **Existence policy matches verified substrate:** team must be real (`config.json` present, else refuse route + D7 report); `inboxes/` and mailbox files MAY be absent — normal (T2.c lazy creation; T4.c harness adopts hand-made dirs). Daemon `mkdir -p inboxes/`; absent ghost = empty outbox.
6. **Per-endpoint executors — hub topology:** executor = `local` | `ssh:<tunnel>`, a property of the ENDPOINT, not the route. local↔local (same-host bridging), local↔remote, and **remote↔remote** all run the identical pipeline. The daemon need not live where any team lives — deployment vision: stationmaster as a hub on the always-on Ubuntu box servicing all org teams, one timetable.
7. **Remote consume staging:** rename-aside must be atomic on the REMOTE filesystem — capture over ssh = remote-rename into `.stationmaster-staging/` (same remote volume) → stream to local spool → delete staging after local spool write lands. Two-phase preserved per hop. Same-volume validation applies per host (staging↔remote inboxes; spool↔local inboxes when watching locally).
8. **Hub operational notes:** remote↔remote route health = AND of both executors (D5/D7); ssh polling batches per host — one ssh exec per cycle checks all watched files on that host.

### D4 — Loop prevention — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** nothing in the substrate stops a forwarded message from being re-forwarded (C4 passes anything through); a config cycle = infinite ping-pong.

**Decision — two layers:**

- **Load-time:** cycle validation on **resolved paths** (D3.3) — reject any timetable where a deliver endpoint feeds, transitively, a watched endpoint (enforces §3.1's one-way-flow axiom).
- **Runtime:** stamp injected entries with `x-sm: {route, hops}`; increment per daemon forward; **drop + D7 alert at hops > 4**.
- **Scope honesty:** the trace field catches *daemon-chain* loops — including two independent stationmasters forwarding to each other, which no single config validation can see. It cannot catch *agent-mediated* loops (an agent re-sending a received message creates a fresh harness entry with no fields) — a behavior problem, not a file problem; out of scope.

### D5 — Tunnel failure policy — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** ssh tunnels are the flakiest component (47 restarts/24h observed on apex tunnels, 2026-06-10).

**Decision:**

- **Backoff per host** (not per route): 5s doubling to 5min cap; circuit opens after 3 consecutive failures; half-open probe each backoff tick.
- **Durability is the outbox (C1)** — no daemon-memory buffering, ever.
- **No TTL, no drops:** low-volume research-org messages are worth more late than lost. Staleness is handled by alerting: route down >15min → alert; backlog >50 entries → alert; repeat-alert suppression 6h per key (→ D7).

### D6 — Hot-reload semantics — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** a watched config is also a single point of self-inflicted outage.

**Decision:**

- **Content-polling** watch on `timetable.json` (C7: mtime lies), 2s debounce.
- Parse/validation failure → **keep last-good config**, alert once per bad generation (D7), never drop routes on a bad edit.
- Route removed → stop watching immediately; its spool **drains to completion** before the route retires (no stranded messages).
- Route edited = retire-old + add-new under the same id; entries already captured forward under the new generation's deliver endpoint (documented, acceptable).
- Reload never interrupts the atomic unit: one entry's forward.

### D7 — Self-reporting via inbox injection — ⬛ DECIDED (PO-ratified 2026-06-10)

**Lever:** C3 — the daemon reports its own state by direct-writing into an agent inbox: delivered + wakes, no log-watching.

**Decision:**

- **Identity:** `from: "stationmaster"`.
- **Alert events:** route refused at validation; circuit opened (once per outage, not per retry); down/backlog thresholds (D5); spool quarantine (D1); probe failure (D8); config rejected (D6).
- **Destination:** timetable-level `alerts` endpoint (team + mailbox), per-route overridable; unset = log-only.
- **No inbox heartbeat** (spam). Pulse lives in `~/.claude/stationmaster/status.json`, rewritten each cycle: PID, uptime, per-route lastSuccess / backlog / circuit-state. Poll the file for liveness; agents get *messages* only when something needs a decision.
- Rate limit: same alert key max once per 6h.

### D8 — Startup substrate self-probe — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** substrate semantics changed unannounced between adjacent CLI versions (I-1). The contract (§2) is version-stamped, not eternal.

**Decision:**

- **Per host, at startup + on detected CLI version change** (version re-checked each config reload): write a clearly-named probe entry into a scratch ghost (`stationmaster-probe-ghost.json`) in a watched team's inboxes dir; verify it **persists 30s undrained** (C1's core); delete it.
- Pass → serve. Fail → refuse all routes on that host + alert (D7).
- Version changed but probe passes → proceed with a warning alert; TRUTHS.md gets a re-verification TODO (one probe can't see every semantic shift).
- C3 (wake-on-inject) is NOT probed at startup — it would message real agents; it stays empirically re-verified per version instead.

### D9 — Attribution rule — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** C4 passes any `from` through verbatim, including lies. Attribution must be policy, not accident.

**Decision:**

- **Derivation (via §3):** injected `from` = the receiving side's ghost name for the sending team. No configurable `from` field (exception: explicit-`path` endpoints, D3.2, which must declare one). [CONV: `*-ghost` suffix signals bridged provenance.]
- **Sender preservation:** the daemon forwards **verbatim** — no body prefixes, no metadata beyond D4's trace field. Per-agent identity inside a team's traffic is carried by team convention (common-prompt mandates `(*FR:<Agent>*)` signatures + timestamps in message text). The ghost identity represents the *team*; the signature represents the *agent*. Multi-sender collapse accepted; daemon stays dumb.

### D10 — Daemon lifecycle — ⬛ DECIDED (PO-ratified 2026-06-10)

**Problem:** two daemon instances = double-delivery (no substrate protection); "always-on" needs a supervisor.

**Decision:**

- **Production = Ubuntu + systemd** (`Restart=always`, `RestartSec=10`), per standing deployment policy. Hub topology (D3.6): one supervised daemon services all org teams.
- **Single instance:** lock file via our own verified primitive — exclusive-create with PID + staleness check (T6.a). Identical on both platforms; no flock dependency (and flock binds only cooperating processes — here both contenders are ours, but T6.a is already proven).
- **Logs:** `~/.claude/stationmaster/log/`, rotating 10MB × 5.
- **Windows = dev-only:** foreground run, no supervision pretense. Not a deployment target.

### D11 — Inject discipline (delivery-side writes) — ⬛ DECIDED: verify-empty → rename-aside → exclusive-create (2026-06-10, verified by Test #6)

**Problem:** the delivery target is a live, contested inbox: blind overwrite can erase native entries; read-modify-write can resurrect drained ones (duplicate delivery of the team's own messages) or lose a concurrent native enqueue.

**Decision — same grammar as D1; blind writes banned:**

1. Poll until the path is absent or `[]` (steady state of a live inbox — C5: drains <0.8s).
2. If an empty file exists: **rename it aside** before writing — if it gained native entries in the race window, the rename captures them losslessly; prepend them to the inject batch (ride-along delivery, verified: T6.b).
3. **Exclusive-create** (`O_EXCL`) the path with the batch — atomic, cannot overwrite a file the harness recreated in the gap (verified: T6.a, 50/50 race rounds clean). On failure: harness got there first → loop to 1 and merge.
4. Loop terminates fast: per-file harness writes are seconds-apart events; our window is sub-second.

**Verified behavior (T6.b):** a multi-entry batch delivers as separate messages, in batch order, with verbatim sender identities; the rename→create gap fails safe (exclusive-create rejects, retry). **Owed:** re-run T6.a's race harness on Ubuntu before production deploy (D10).

## 5. Non-goals (v3)

- No message transformation/filtering — forward verbatim, attribution aside (D9).
- No delivery into *remote* live sessions beyond the single deliver-endpoint write — fan-out is the receiving team's business.
- No encryption beyond the ssh tunnel itself.
- No Windows production deployment.

## 6. Open substrate items affecting this spec

- **Clobber window (C8):** untested sub-second race between harness drain rewrite and external append. D1/D7 design around it defensively; a deliberate race probe remains optional.
- **Live-session-only drains:** "harness drains only its own inbox" is the working model; settled fact covers only the cells tested (TRUTHS.md T3.a scope note).
- **Version axis:** retention-flip bracket is 2.1.16x–2.1.170, not pinned; upstream undocumented (GitHub issue pending PO go).
