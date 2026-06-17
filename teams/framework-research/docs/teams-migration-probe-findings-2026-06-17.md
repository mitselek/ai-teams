# 2.1.178+ Teams-Migration Probe -- Findings

(*FR:Hopper*) -- 2026-06-17, Task #4 (Phase 2). Empirical results from a throwaway container running Claude Code **2.1.179** (the post-2.1.178 implicit-teams model, after `TeamCreate`/`TeamDelete` were stripped). Scope + probe definitions: [`teams-migration-probe-container-scope-2026-06-17.md`](teams-migration-probe-container-scope-2026-06-17.md). Build artifacts: [`designs/new/teams-migration-probe/`](../../../designs/new/teams-migration-probe/).

## Environment

| Field | Value |
|---|---|
| CLI version | `2.1.179 (Claude Code)` (verified `claude --version`) |
| Host | rc `100.96.54.170` (WARP), `network_mode: host` + WARP CA mount `/etc/ssl/certs/managed-warp.pem -> /opt/warp-ca.pem` |
| Auth | option (c) fresh `claude login` (OAuth, PO seat `mihkel.putrinsh@evr.ee` / Claude Team eestiraudtee); `~/.claude/.credentials.json` 471B mode 600 |
| Drive | tmux session `probe` driven via `docker exec` (no SSH-in; entrypoint sshd skipped to avoid colliding with apex live :2222) |
| Session | pid 121, sessionId `d0cf4760-8f54-4d32-9e1b-504b89b22b49`, `peerProtocol:1`, model Opus 4.8 |
| Flag | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (survives 2.1.178+, baked in image) |
| Teardown | `docker compose -f docker-compose.probe.yml down -v` (throwaway image + volume) |

## Substrate map (`~/.claude` on 2.1.179)

- `teams/<name>/config.json` -- team roster (eagerly written on session start).
- `teams/<name>/inboxes/<member>.json` -- per-member message queue (JSON array). Created lazily (first activity / first message).
- `sessions/<pid>.json` -- live session registry: `{pid, sessionId, cwd, version, peerProtocol, kind, entrypoint, status}`. This is the pid->sessionId->status map the harness uses to track running sessions.
- `tasks/<name>/` -- per-team task dir (was empty throughout this probe).
- `projects/<cwd-slug>/<uuid>.jsonl` -- session transcript.

### Inbox message shape (2.1.179)

```json
[
  {
    "from": "team-lead",
    "text": "GHOST-PING",
    "summary": "Ping ghost-courier",
    "timestamp": "2026-06-17T15:48:05.012Z",
    "type": "message",
    "read": false
  }
]
```

NB: 2.1.179 adds a `"type"` field (e.g. `"message"`) vs the 2.1.177-era FR inbox shape (`{from,text,summary,timestamp,read}`). The courier's JSON writer/reader should tolerate/emit `type`.

## Per-probe results

### P1 (LOAD-BEARING) -- team-name determinism: **FAIL (name NOT controllable)**

Spawned a teammate via the Agent tool passing `team_name="framework-research"`.

- **On disk: NO `framework-research` directory was created.** Only `session-d0cf4760` exists under `~/.claude/teams/`.
- The spawned member's `agentId` = `probemate@session-d0cf4760` (suffix is the session-id team, NOT `framework-research`).
- `config.json` `.name` remained `"session-d0cf4760"`.
- The agent's chat narration *claimed* "team: framework-research", but the filesystem is authoritative: the on-disk team name is the session-derived id and the `team_name` parameter is **ignored on disk** (cosmetic label only).

**Consequence:** FR's courier hardcoded path `~/.claude/teams/framework-research/inboxes/` **CANNOT survive on 2.1.179.** The team dir is `session-<id>`, random per session, uncontrollable. The courier must **discover the team name at runtime** -- e.g. read the single dir under `~/.claude/teams/` (or its `config.json` `.name`), or derive it from `sessions/<pid>.json` `sessionId` (first 8 hex = the `session-<id>` slug). This is the primary migration cost.

### P2 -- SendMessage existence + delivery: **PASS**

`SendMessage` exists in 2.1.179. The spawned teammate (`probemate`) sent `PROBEMATE-UP` to `team-lead` and it was delivered into the lead session (rendered in-pane). Bidirectional delivery confirmed.

### P3 -- team dir + inbox creation + naming: **PASS (with the P1 caveat)**

- `config.json` is created **eagerly** on session start (before any spawn): a lone session is already a 1-member team with itself as `team-lead` (`backendType:"in-process"`, `tmuxPaneId:"leader"`).
- `inboxes/` is created **lazily** -- absent on a fresh bare session; appears once the first message is routed / inbox file is created.
- Naming: `<name>` = `session-<id>` per P1. Member `agentId` = `<name>@session-<id>`.

### P4 -- config.json members[] injection: **PASS**

Externally appended a ghost member `ghost-courier` to `config.json` `members[]` (out-of-band, via `docker exec` python -- not via any Claude tool). The lead's `SendMessage` to `ghost-courier` returned **success** (no unknown-recipient error) and the harness **routed it** -- writing `inboxes/ghost-courier.json` with the message. **The members[]-injection trick our ghost-outbox courier registration depends on still works on 2.1.179.**

### P5 -- inbox-file write -> wake/deliver: **PASS**

Two-part evidence:

1. A real `SendMessage` writes to `inboxes/<member>.json` (confirmed in P4: `ghost-courier.json` received the deposited entry). So the courier's outbound-collection path (read `inboxes/<member>.json`) is valid.
2. An **external** process writing JSON into `inboxes/team-lead.json` **wakes the idle session and delivers** the message (see P6 -- the clean re-test proactively woke an idle session with no nudge). The harness then drains the inbox back to `[]`.

### P6 (LOAD-BEARING) -- bare-session reachability: **PASS (corrected)** -- external inbox-write DOES wake/deliver

This is the PO's ideal-outcome question and the result reversed mid-probe; the sequence matters:

- **(a) Bare session inbox on disk?** On a truly fresh authenticated bare session (no spawn, no member), the team dir contains **only `config.json`** -- there is NO `inboxes/` dir and NO `team-lead.json`. The team-lead exists as a config *member* but has no inbox *file* yet.
- **(b) Does an external inbox-write wake/deliver?** **YES.**
  - First external write (before `inboxes/` existed) created the file and *appeared* inert (no real-time wake; `read` stayed false for ~12s and the file was untouched). But it was **not lost**: when the session next went active (the spawn turn), the harness **delivered it** ("I received a message from another session (probe-external)... the fact you're seeing this confirms the external inbox write woke this session") and reset the file to `[]`.
  - **Clean re-test (machinery now armed):** wrote a 2nd external message to `inboxes/team-lead.json` and did **NOT** nudge the session. ~15s later the **idle session proactively woke on its own** and rendered the message ("Another peer wake-test arrived... probe-external-2... the fact that it woke this session is the only signal it's testing"). Inbox drained to `[]`, session returned to `idle`.

**Conclusion:** an external process writing a well-formed JSON message into `~/.claude/teams/<session-id>/inboxes/team-lead.json` **wakes and delivers to the lone session** on 2.1.179. The PO's "drop a file in the inbox to reach a bare session" model **works.** Caveat: the `inboxes/` dir + `team-lead.json` must exist; on a brand-fresh bare session the courier must **create** `inboxes/team-lead.json` itself (the first write does double duty: it creates the file AND, on the next session activity cycle, is delivered). Once the file exists, subsequent external writes proactively wake the idle session in real time.

## Bottom lines

- **P1 (name controllable/discoverable?):** NOT controllable. On-disk team name = `session-<id>` (random per session); the Agent tool's `team_name` is ignored on disk. **Discoverable at runtime** via `~/.claude/teams/*/config.json` `.name` or `sessions/<pid>.json` `sessionId`. => Courier must drop its hardcoded `framework-research` path for runtime name-discovery. This is the real migration cost.
- **P6 (bare reachable?):** YES. External inbox-file write into `teams/<session-id>/inboxes/team-lead.json` wakes + delivers to a bare lone session (proactively, once the file exists). The PO's ideal outcome is achievable on 2.1.178+.
- **Net migration verdict:** the two substrate primitives the courier relies on -- members[] injection (P4) and inbox-file-write delivery (P5/P6) -- BOTH survive 2.1.178+. The ONLY thing that breaks is the **hardcoded team-name path** (P1); replace it with runtime name-discovery and the cross-team comms layer migrates cleanly. No redesign of the injection/delivery mechanism is needed.

## Isolation / safety record

- Throwaway container `teams-migration-probe`, own image `teams-migration-probe:2.1.179`, own named volume `teams-migration-probe_claude-home`, `network_mode: host` with **no sshd** (no published ports; apex live :2222 never touched).
- No live-team container touched; no host changes beyond the throwaway container + volume + one transient `curlimages/curl` image used for the egress pre-check (removed after each use).
- ANTHROPIC_API_KEY never used (option-(c) login); OAuth code never printed to logs/chat/this doc (injected via `tmux send-keys -l` from an env var).
- Snapshot taken to `/tmp/probe-snapshot-teams` on the rc host for the record before teardown.
