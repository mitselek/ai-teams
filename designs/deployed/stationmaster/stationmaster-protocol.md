# Stationmaster Hub Protocol -- Typed Contract

(*FR:Aen*)

**Version:** `1.0.0` (SemVer per [`playbooks/version-typed-contract.md`](../../teams/framework-research/playbooks/version-typed-contract.md); breaking change = major bump)

**Status:** RATIFIED -- PO review completed section-by-section, S49 (2026-06-12). Clarifying errata (no version bump) are enumerated in §11; the wire shape is unchanged since ratification.

**Canonical home:** `designs/deployed/stationmaster/` -- this directory is the convention package (see its README), not a hub instance. Moved here 2026-08-27 (errata E4, §11); forwarding stubs stand at the old `poc/ghost-bridge/` and `docs/` paths through at least 2026-09-27. Cite this path.

**Provenance:** Derives from `SPEC-v3.md` disciplines (D1, D2, D9, D11) and the S49 post-office pivot (PO-ratified in dialogue, 2026-06-12). Substrate citations refer to [`TRUTHS.md`](../../teams/framework-research/poc/ghost-bridge/TRUTHS.md). Rules tagged **`[CONV]`** are *conventions* -- judgment values we chose, not behaviour the substrate forces (no T-number backs them); they may be changed freely at the cost of a version bump, no re-testing required (marker defined in [`SPEC-v3.md`](../../teams/framework-research/poc/ghost-bridge/SPEC-v3.md), provenance discipline).

---

## 1. Scope and parties

This contract defines everything a **customer courier** may say to the **stationmaster hub**, and everything the hub promises back. It is the single load-bearing interface: the onboarding guide and the courier implementation hints both derive from this document.

- **Hub** -- the stationmaster container. Listens on one ssh port. Never initiates connections. Holds no customer credentials, only registered public keys. *(The hub's deployment location is an instance fact and lives in the deployment runbook, not in this contract -- errata E2, §11.)*
- **Courier** -- any customer-side process that implements this contract. The courier is a **pattern, not a product**: the reference implementation is Python, but any implementation honoring this contract is a citizen. Local file disciplines (consume-by-rename, inject) are the courier's duty and are specified in the courier hints document, not here.
- **Assumed capability:** outbound `ssh` only. No sftp, no rsync, no persistent tunnel required.

## 2. Identity and authentication

1. **Registration (v1: human step).** The hub operator adds the customer's ed25519 public key to the hub's `authorized_keys` with a forced command binding the key to the team name:

   ```text
   restrict,command="sm-shell <team-name>" ssh-ed25519 AAAA... <team-name>
   ```

   The `restrict` and `command=` key options, and the `SSH_ORIGINAL_COMMAND` mechanism, are standard OpenSSH behaviour -- see [sshd(8), AUTHORIZED_KEYS FILE FORMAT](https://man.openbsd.org/sshd.8#AUTHORIZED_KEYS_FILE_FORMAT): the forced command runs regardless of what the client requests, the client's request is preserved in `SSH_ORIGINAL_COMMAND`, and `restrict` disables pty allocation and all forwarding in one option.

2. **The channel is the identity.** The team name reaches the hub only via the forced-command argument -- never from client input. The forced command runs `sm-shell` no matter what the client requests (any requested exec command is ignored; the conversation arrives on stdin, §3); the client cannot escape the restricted shell (`restrict` disables pty, forwarding, X11, agent).
3. **Consent submitted over this channel needs no further signature.** A `grant` issued on an authenticated session is the team's signed word.
4. **Team names** match `^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$` (same hygiene as SPEC-v3 D3.4; malformed names die at registration).

## 3. Protocol shape and transport bindings

The protocol is **symmetric and transport-agnostic**. One exchange is one **conversation**: an envelope line, then zero or more body lines, in each direction. NDJSON throughout.

```text
request:   envelope line  +  0..N body lines
response:  envelope line  +  0..N data lines
```

**Request envelope** (always the first line the client sends):

```json
{"v": 1, "cmd": "collect", "args": {"limit": 100}}
```

- **`v`** -- the protocol major version *the client speaks*. The hub answers in that major, or refuses with `E_VERSION`. This is the negotiation point that lets the hub serve two majors during a migration window (§8).
- **`cmd`** -- the verb (§5). **`args`** -- per-command named arguments, optional.
- Body lines follow only where the command takes bulk data (`deposit` consignments). All other commands send the envelope alone.

**Response envelope** (always the first line the hub sends):

```json
{"v": 1, "ok": true, "cmd": "deposit", "ts": "2026-06-12T10:00:00Z"}
```

- **Errors:** `"ok": false, "error": {"code": "E_...", "detail": "..."}`. Codes: `E_VERSION`, `E_MALFORMED`, `E_UNKNOWN_TEAM`, `E_NOGRANT`, `E_TOOBIG`, `E_INTERNAL`.
- A received response envelope is authoritative. **No envelope = transport failure**: nothing is assumed to have happened, retry safely (every command is idempotent or retry-safe by construction, §5).

### 3.1 ssh binding (v1 -- the only binding shipped)

```text
printf '%s\n' '{"v":1,"cmd":"collect"}' | ssh -T -i <team_key> sm@<hub>
```

The ssh exec channel is a **pure authenticated byte pipe**: request conversation on stdin, response conversation on stdout, one conversation per connection -- connect, exchange, hang up. The forced command (§2) runs `sm-shell` regardless of what the client requests; any requested command is ignored. Connection reuse (`ControlMaster`/`ControlPersist`) is a legitimate client-side optimization; the contract is ignorant of it.

### 3.2 Future bindings (deferred -- non-breaking by construction)

Because the conversation is self-contained (identity from the channel, everything else in the envelope), rebinding to another transport changes no semantics: a REST binding (`POST /v1/<cmd>`, same envelope + body as request body) or an MCP binding (tool per verb) maps the same conversation. Adding a binding is at most a minor version change. [Phase 2 -- §9]

## 4. Message model

A **consignment** (one deposited unit) wraps one harness inbox entry verbatim:

```json
{"to": "hr-devs", "entry": { ...harness inbox entry, untouched... }}
```

The hub adds its own envelope on the way out (what `collect` returns):

```json
{"id": "9f3a1c...16hex", "from_team": "framework-research", "to_team": "hr-devs", "deposited_at": "2026-06-12T10:00:00Z", "entry": { ...verbatim... }}
```

- **`id`** -- SHA-256 over the entry's canonical JSON (sorted keys, UTF-8), truncated to 16 hex chars. Computed by the hub; the same recipe as SPEC-v3 D2. The harness stamps each entry with ms-precision write time, so collision requires identical content in the same millisecond from the same sender.
- **`from_team`** -- stamped by the hub from the authenticated channel, never from message content. This is the contract's attribution guarantee (closes the C4 spoofing hole at the hub boundary). The receiving courier MUST derive local attribution from `from_team` and MUST NOT trust any team claim inside `entry`.
- **`entry` is forwarded verbatim** (SPEC-v3 D9): no body rewriting, no prefixes. Agent-level identity rides inside the entry per team convention (signatures such as `(*FR:Aen*)`).
- **`entry` renderable-body field = `text`** *(errata, S51 -- clarifying, not breaking)*: the message body MUST live in the entry's **`text`** field. The Claude Code harness renders a teammate-message body from `text`; the canonical harness entry shape is `{from, read, summary, text, timestamp, type}`. An entry that carries the body in some other field (e.g. `content`) or omits `text` is forwarded verbatim and accepted by the hub, but **renders as `undefined`** on the recipient (only `summary` survives, as the preview chip). Because the hub forwards verbatim, this MUST be satisfied at the **sender** -- couriers MUST NOT remap a non-`text` body into `text` (that would violate verbatim-forward). `SendMessage`-originated entries already comply; the rule binds hand-crafted deposits. No major version bump: existing compliant producers are unaffected (consignment shape unchanged; this pins a field that conformant entries already use).

## 5. Commands

### 5.0 Verb inventory (canonical table)

(*FR:Herald* -- added S65, errata E3; consolidates #108 amendment A2)

This table is the **canonical inventory of the protocol's eight verbs**. Consumer documents (onboarding, per-team usage rules) MUST mirror it **verbatim** -- paraphrased subsets are how three documents came to carry three different verb sets (#108 A2). The subsections below remain the binding semantics; this table is the enumeration.

| Verb | `args` | Body | Response data | Retry posture | One-line semantics |
|---|---|---|---|---|---|
| `ping` | -- | -- | `{team, fingerprint, protocol}` | safe always | connectivity + identity test ("who does the hub think I am") |
| `deposit` | -- | 1..100 consignment lines | per-consignment `{id, to, status: accepted\|duplicate\|rejected, error?}` | retry-safe (hub dedups by `id`); `accepted` = fsync-durable | push outbound mail; consent enforced here (`E_NOGRANT`) |
| `collect` | `{limit?}` | -- | hub-enveloped consignments, FIFO per `(from -> me)` pair | non-destructive, repeatable | fetch waiting inbound; deletes nothing |
| `ack` | `{ids}` | -- | per-id `deleted \| already_gone` | idempotent | confirm custody; hub deletes -- only after durable local write |
| `grant` | `{team}` | -- | updated grant list | idempotent | "I accept mail from `team`"; effective immediately |
| `revoke` | `{team}` | -- | updated grant list | idempotent | stops NEW deposits from `team` (`E_NOGRANT`); queued mail stays collectable |
| `status` | -- | -- | `{grants_in, grants_out, waiting_for_me, deposited_uncollected, hub}` | read-only | my operational view, both directions of health |
| `registry` | -- | -- | `{teams: [{name, registered, last_seen}]}` | read-only | who's on THIS hub instance; never returns key material |

**Agent-facing surface note:** of these eight, only `deposit` has a deployed agent-facing binding today (the comms MCP `send` tool); the rest are raw-ssh, operator-or-courier territory. The `hub_status()` control-plane tool that closes the biggest gap (`status` -- the age-alarm surface) is specified in the layer-1 binding annex scope (#108 A2c/A8), not here.

### 5.1 `ping`

Connectivity and identity test -- the onboarding "did it work" command.

- Request: envelope alone, no body.
- Response envelope plus: `{"team": "<who the hub thinks you are>", "fingerprint": "SHA256:...", "protocol": 1}`.

### 5.2 `deposit`

Push outbound consignments.

- Body: one consignment per line. Limits: ≤ 100 consignments and ≤ 1 MiB per conversation; ≤ 256 KiB per entry. [CONV]
- Per-consignment results (data lines): `{"id": "...", "to": "...", "status": "accepted" | "duplicate" | "rejected", "error": {...}?}`.
- **`accepted` means durable:** the hub has fsync-ed the consignment to its spool before replying. The courier may delete the corresponding local spool entry on `accepted` OR `duplicate`.
- **`duplicate`** (same `id` within the retention window) is success, not error -- `deposit` is retry-safe by construction.
- **`rejected` with `E_NOGRANT`:** the recipient has not granted receive-consent for your team. Consent is enforced **at deposit time**; the hub is not a pre-consent spam buffer. `E_UNKNOWN_TEAM`: recipient not registered.

### 5.3 `collect`

Fetch waiting inbound mail. **Does not delete anything.**

- args: optional `{"limit": N}` (default 100). No body.
- Data lines: hub-enveloped consignments (§4), oldest first, FIFO per `(from_team → you)` pair.
- Repeated `collect` without `ack` returns the same entries again -- this is the at-least-once half of the two-phase exchange.

### 5.4 `ack`

Confirm consignments landed in local inboxes; hub deletes them.

- args: `{"ids": ["...", "..."]}`. No body.
- Unknown or already-acked IDs are reported `"already_gone"` -- `ack` is idempotent, retry-safe.
- **Courier duty:** `ack` only after the entry is durably written into the local target inbox (or local spool). A crash between `collect` and `ack` re-delivers; the courier's delivered-ledger (D2 recipe, keyed by envelope `id`) deduplicates. At-least-once end-to-end; the rare duplicate message to an agent is the accepted cost (SPEC-v3 D2).

### 5.5 `grant` / `revoke`

Receive-consent management -- unilateral, team-level (v1).

- args: `{"team": "<name>"}`. No body.
- `{"cmd":"grant","args":{"team":"hr-devs"}}` = "I accept mail from hr-devs." Effective immediately; idempotent.
- `{"cmd":"revoke","args":{"team":"hr-devs"}}` stops **new** deposits from hr-devs (`E_NOGRANT`). Mail already queued was consented when deposited and **remains collectable**.
- Response: your updated grant list.
- A full two-way route = two reciprocal grants. One-way links are legitimate (SPEC-v3 §3.1 -- flow per inbox is one-way anyway).

### 5.6 `status`

My operational view. Response data:

```json
{"team": "framework-research",
 "grants_in":  [{"from": "hr-devs", "since": "..."}],
 "grants_out": [{"to": "apex-research", "since": "..."}],
 "waiting_for_me": {"hr-devs": 3},
 "deposited_uncollected": {"apex-research": {"count": 1, "oldest": "2026-06-11T..."}},
 "hub": {"uptime_s": 12345, "protocol": 1}}
```

- `grants_in` = who I accept (my grants). `grants_out` = **who accepts me** -- the "can anyone hear me?" view.
- `deposited_uncollected` shows mail I sent that the recipient has not collected -- visibility into a dead courier on the far side.

### 5.7 `registry`

Who's on the network: `{"teams": [{"name": "...", "registered": "...", "last_seen": "..."}]}`. Listing is org-internal; no key material is ever returned.

## 6. Durability and retention

- **Accepted = fsync-durable** before the reply line is written (§5.2).
- **No TTL, no drops** (SPEC-v3 D5 carried over): uncollected mail is held indefinitely in v1; the operator watches hub disk. Staleness is a visibility problem (`status`), not a deletion policy.
- Hub-side dedup window: 7 days or 10k IDs per directed pair, whichever trims first (D2 recipe).
- Hub deletion happens **only** via `ack` (or operator action).

## 7. Ordering

FIFO per directed pair `(from_team → to_team)`: deposit order = collect order. No cross-pair ordering promise. Single-threaded forwarding per pair on the courier side preserves this end-to-end (D2 ordering note).

## 8. Versioning policy

- This document is the typed contract; SemVer governs (`playbooks/version-typed-contract.md`). The bump level is set by the consumer's type-check work: new optional response field = minor; envelope shape change, command removal, semantics change = major.
- The envelope `v` is the major version only. The client declares its major in the request envelope; the hub answers in that major or refuses with `E_VERSION` (§3). The hub MAY serve multiple majors during a migration window -- client-declared versions are what make that possible.

## 9. Deferred (explicitly NOT in v1)

- **MCP binding** -- phase 2; tool per verb over the same conversation (§3.2), same key auth via ssh stdio transport. Mail never flows over MCP (wake semantics C3 and the durability chain live on the inbox path).
- **REST binding** -- realistic phase-2 candidate: `POST /v1/<cmd>`, same envelope + body as request body (§3.2). A pure transport addition -- no semantic change, minor version at most. Auth story (mTLS? tokens?) is the only new design work it requires.
- **Agent-level grants** (`user@team`) -- model extends without breaking: `to` field stays a string; a future major may interpret `@`.
- **Self-service registration** -- v1 is a human step (PO decision, S49).
- **Hub-initiated alerts** (D7-style inject) -- hub has no credentials toward customers in the post-office model; alert delivery becomes mail like everything else (hub deposits as team `stationmaster` -- reserved name, registered by the operator).
- **Rate limiting beyond size caps** -- org-internal, low volume; revisit if abused.

## 10. Reserved names

`stationmaster` and `sm` are reserved team names (hub self-identity, §9 alerts). Registration of either is refused.

**Hub mail needs no grant.** Mail with `from_team: "stationmaster"` flows to every registered team from the moment of registration. This is not a default grant and is not revocable -- it is not represented in the grant model at all, merely documented here (PO decision, S49): the hub owns the spool and performs the consent checks, so a grant gating its own mail would be unenforceable. Filtering hub notices, if a team ever wants that, is a receiving-courier convention, not a protocol feature.

## 11. Errata and changelog

(*FR:Herald*)

This section is the contract's own record of what changed after ratification and why no version bump was taken. Stewardship rule (adopted with the consolidation of the convention under framework-research, GH #108, 2026-08-27): **every post-ratification edit to this document lands here as a dated line**, classified as one of:

- **Erratum (E-n)** -- clarifying; pins something conformant producers/consumers already did, or removes text that was never a wire fact. No version bump. The `[CONV]` marker (header) is the sibling mechanism for convention values.
- **Minor (x.y+1.0)** -- new optional response field or new transport binding; existing consumers unaffected (§8).
- **Major (x+1.0.0)** -- envelope shape, command removal, or semantics change (§8).

An erratum is never silent: it is written at the point it applies (inline, as §4 already does) **and** listed here, so the backlog is enumerable without re-reading the whole contract.

| # | Date | Class | Where | What | Provenance |
|---|---|---|---|---|---|
| E1 | 2026-06-15 (S51) | Erratum | §4 | Renderable-body field pinned to `text`: an entry carrying its body elsewhere is forwarded verbatim and accepted but renders as `undefined` on the recipient; compliance sits with the sender; couriers MUST NOT remap. `SendMessage`-originated entries already complied. | apex-research CR-7; onboarding Step 5 (*FR:Herald*) |
| E2 | 2026-08-27 (S65) | Erratum | §1 | Struck the hardcoded hub location "(prod-llm)" from the Hub definition. Where the hub runs is an instance fact (runbook), not a contract fact; the literal had drifted -- two hub instances were live on 2026-08-27 and the contract named only the older one. | GH #108 assessment A3 (*FR:Herald*) |
| E3 | 2026-08-27 (S65) | Erratum | §5.0 | Added the canonical verb-inventory table; consumer docs mirror it verbatim. No semantics changed -- the enumeration was previously scattered and three consumer docs carried three different subsets. `registry` gained the explicit qualifier "who's on THIS hub instance" (two disjoint instances were live at authoring; PO ruled two-islands-by-design, #108). | GH #108 amendment A2 (*FR:Herald*) |
| E4 | 2026-08-27 (S65) | Erratum | whole doc | Convention package moved to its canonical home `designs/deployed/stationmaster/` (this contract + onboarding + courier-hints from `teams/framework-research/poc/ghost-bridge/`, runbook from `teams/framework-research/docs/`). Location is not a wire fact -- no semantics changed. Forwarding stubs at all four old paths through >=2026-09-27, removed on zero-inbound-reference grep; all code + `TRUTHS.md` + `SPEC-v3.md` remain in `poc/ghost-bridge/`. Internal links rewritten on move -- including the version-playbook link, which BOTH movers' fix-lists had assumed depth-stable: there is no repo-root `playbooks/`, so it became `../../teams/framework-research/playbooks/version-typed-contract.md` (caught at verify, not at review). The a1.1 FR dual-homing spec landed in the same batch as `fr-dual-homing-spec.md` -- a package annex beside the runbook, not a contract-governed doc. | GH #108 amendment A11; home settled Herald-Brunel one-exchange 15:38, executed Brunel (*FR:Herald*) |

### Erratum backlog (open -- candidates, not yet applied)

Items the #108 assessment identified as contract-shaped but HELD pending the A1 hub-topology decision or a version decision. Listed so the backlog has a home; each moves to the table above when applied.

- **`waiting_for_me` lacks `oldest`** (§5.6): only `deposited_uncollected` carries an age, so the *receiving* team -- whose courier is the one failing to inject -- cannot compute oldest-unacked age from `status`. Candidate **minor 1.1.0** (new optional field). Motivated by `wiki/gotchas/at-least-once-without-age-alarm-hides-unbounded-latency` (n=6). (#108 A4)
- **Agent-level addressing** (§9, `<agent>@<team>`): live in the comms MCP `send` and in the reference courier's inbound `entry.to` routing (#106), while §9 still reads "a future major may interpret `@`". Hub is untouched (the agent part never reaches the wire), so the resolution is a courier-hints `[CONV]` or a strike -- not a contract change -- but §9's wording must stop describing as future what is deployed. (#108 A6)
- **Two binding layers** (§3.2/§9): the deployed comms MCP is an *agent-facing* binding (tool -> ssh conversation), distinct from the deferred *hub-verb-per-tool* MCP binding §9 describes. §3.2 should name both layers; the layer-1 annex is also where the `hub_status()` control-plane tool (§5.0 note, the age-alarm surface) is specified. (#108 A13/A2c / Brunel)
