# Ghost-Bridge v3 — "Stationmaster" — SPEC (skeleton)

(*FR:Aen*)

**Status:** SKELETON — design concerns D1–D10 are resolved one at a time with PO; each carries a status marker.

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

### D2 — Crash safety: spool + synthesized message IDs — ⬜ UNDECIDED

**Problem:** crash between forward and delete → duplicate; delete before confirmed remote write → loss. Harness messages carry no IDs.
**Constraint:** at-least-once forwarding + dedup. ID synthesized from content (e.g., hash of `from+timestamp+text`).
**To decide:** spool location/format, two-phase order (outbox→spool→remote→clear?), dedup window, replay-on-start procedure.
**Decision:** *pending*

### D3 — Endpoint addressing: (host, team, mailbox) triples — ⬜ UNDECIDED

**Problem:** mailbox name alone breaks when any host runs multiple teams; remote paths additionally depend on user/home.
**To decide:** path resolution rule per host (explicit base path vs derived from `$HOME`), validation at config load.
**Decision:** *pending*

### D4 — Loop prevention — ⬜ UNDECIDED

**Problem:** nothing in the substrate stops a forwarded message from being re-forwarded (C4 passes anything through); a config cycle = infinite ping-pong.
**Constraint:** config validation — no mailbox the daemon delivers into may be (transitively) a mailbox it watches.
**To decide:** validation-only, or also runtime guard (hop-count/trace metadata in injected entries)?
**Decision:** *pending*

### D5 — Tunnel failure policy — ⬜ UNDECIDED

**Problem:** ssh tunnels are the flakiest component (47 restarts/24h observed on apex tunnels, 2026-06-10).
**Lever:** the watched outbox accumulates for free while a route is down (C1) — durability lives in the mailbox, not daemon memory.
**To decide:** backoff curve, circuit-breaker thresholds, max-age/TTL for stale undelivered messages, what "route down" reports look like (→ D7).
**Decision:** *pending*

### D6 — Hot-reload semantics — ⬜ UNDECIDED

**Problem:** a watched config is also a single point of self-inflicted outage.
**Constraint:** parse/validation error → keep last-good config, log loudly, never drop routes on a bad edit.
**To decide:** route-removal drain policy (drain spool first vs orphan explicitly), in-flight handling on route edit, reload debounce.
**Decision:** *pending*

### D7 — Self-reporting via inbox injection — ⬜ UNDECIDED

**Lever:** C3 lets the daemon report its own state (tunnel down, verify failure, probe failure) by direct-writing a message into the local team-lead's inbox — delivered + wakes, no log-watching.
**To decide:** what events warrant a message (threshold — avoid spamming the lead), `from` name for daemon self-reports (e.g., `stationmaster`), heartbeat yes/no.
**Decision:** *pending*

### D8 — Startup substrate self-probe — ⬜ UNDECIDED

**Problem:** substrate semantics changed unannounced between adjacent CLI versions (I-1). The contract (§2) is version-stamped, not eternal.
**Constraint:** on launch — record `claude --version`; send-to-scratch-ghost and verify persistence (C1) before serving routes; refuse to bridge on probe failure.
**To decide:** probe scope (C1 only, or also C3 round-trip?), behavior on version change with passing probe (warn vs proceed).
**Decision:** *pending*

### D9 — Attribution rule — 🟨 PARTIALLY DECIDED

**Problem:** C4 passes any `from` through verbatim, including lies. Attribution must be policy, not accident.
**Decided (PO, 2026-06-10, via §3):** attribution is DERIVED from the route's four mailbox names — injected `from` = the receiving side's ghost name for the sending team. No configurable `from` field. [CONV: `*-ghost` suffix signals bridged provenance.]
**Still to decide:** preserve original sender (e.g., which agent on the sending team wrote it) inside the message body/metadata? Multi-sender teams currently collapse into one ghost identity per route — acceptable?
**Decision:** *derivation settled; sender-preservation pending*

### D10 — Daemon lifecycle — ⬜ UNDECIDED

**Problem:** two daemon instances = double-delivery (no substrate protection); "always-on" needs a supervisor.
**Constraint:** single-instance lock (pidfile). Deploy target is Ubuntu/systemd (per workspace deployment policy); Windows = dev-only, best-effort.
**To decide:** systemd unit details, Windows dev story (manual / Task Scheduler), log location/rotation.
**Decision:** *pending*

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
