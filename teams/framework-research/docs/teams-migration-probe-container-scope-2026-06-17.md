# 2.1.178+ Implicit-Teams Probe Container -- Phase 1 Scope

(*FR:Brunel*) -- 2026-06-17, Task #3. **SCOPE ONLY. No build, no run.** Build+run gated on team-lead + PO go (auth gate).

## 0. Why this spike exists (grounding)

Claude Code **2.1.178** silently **removed the `TeamCreate` / `TeamDelete` tools** that FR's `startup.md` (Step 2) and shutdown (S5) depend on. Verified by binary string-diff in `~/.local/share/claude/versions/`: 2.1.175 and 2.1.177 each contain `TeamCreate`x8 / `TeamDelete`x9; 2.1.178 contains 0 of each. The `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` flag **survives in all three** (x8) -- only the *named-team* primitives were stripped; the **session-scoped implicit-team substrate (Agent tool + auto `session-<id>`) remains**. (Source: user-memory `project-claude-cli-pinned-2177`; this machine is pinned to 2.1.177 with the auto-updater killed via `DISABLE_AUTOUPDATER=1`.)

**The spike's question:** can FR's named-team lifecycle migrate onto the 2.1.178+ implicit (session-scoped) team model? We answer it empirically in a throwaway container running latest CLI, NOT by touching the pinned host or any live team.

---

## 1. How existing rc containers authenticate Claude Code

**Reference = the proven apex-research container** (`designs/deployed/apex-research/container/`).

> **⚠ CORRECTED 2026-06-17 18:18 (empirical probe overturns Phase-1 inference).** Phase-1 inferred API-key auth from the compose `environment:` line. A read-only check of the LIVE apex container (`ai-teams@rc:2222`, no secret values printed) shows that is WRONG. See corrected table.

| Question | Answer (EMPIRICAL, live apex container) |
|---|---|
| Auth mechanism | **OAuth credentials file** `~/.claude/.credentials.json` (EXISTS, 471 bytes -- the `claude login` token signature), on the persistent `~/.claude` volume. **NOT** `ANTHROPIC_API_KEY`: that var is absent from apex's runtime env (`printenv` shows no `ANTHROPIC*`/`CLAUDE_CODE*` except the teams flag). The compose line `ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}` resolves EMPTY because the rc host doesn't export it -- it's a no-op, not the live auth path. settings.json has no `apiKeyHelper`. |
| Where it lives | On the persistent volume, `~/.claude/.credentials.json`. Survives restart/recreate because the volume persists. |
| Can a SIBLING probe container reuse it? | **Not as an API key (there is none).** Reuse options: (a) copy apex's `.credentials.json` into the probe's `~/.claude` -- works, but shares one OAuth seat (refresh/contention risk); (b) PO supplies a real `ANTHROPIC_API_KEY` (clean isolation); (c) fresh `claude login` in the probe (isolated, not scriptable). |

**PO action for auth (the gate):** decide (a) OAuth-token reuse / (b) PO-supplied API key / (c) fresh login. My recommendation: (b) if a spare/scoped key exists (best isolation for a throwaway); else (a) with the shared-seat caveat. Build artifacts (`designs/new/teams-migration-probe/`) are parameterized for all three. **No build/run until PO picks an option.**

**Lesson (my own doctrine):** empirical-probe beats artifact-inference. The compose `environment:` declaration looked authoritative but was a dead var; only reading the live container revealed the real OAuth-file auth.

---

## 2. Probe container recipe (base + Node + CLI + flag)

Mirror the apex two-layer pattern but **strip everything not needed to test teams** (no Python, no source-data repo, no SSH-for-PO unless we want exec-in, no Jira MCP, no dashboard). Throwaway.

### Base + toolchain
- **Base:** `ubuntu:24.04` (or reuse `ai-teams-claude:latest` if it's already on the build host -- it already has Node + git + gosu + claude, but it bakes 2.1.177-era claude; we override the CLI version anyway, so a clean `ubuntu:24.04` is cleaner for a throwaway).
- **Node.js 22 LTS** -- same as apex (Claude Code needs Node 20+; apex pins v22.14.0 via direct tarball).
- **tmux + openssh-server (REQUIRED for the PO-requested drive method).** The probe is driven via remote `tmux send-keys`/`capture-pane` over SSH, so the container needs sshd-on-2222 + an operator SSH pubkey + tmux + a non-root `ai-teams` (uid 1000) user, mirroring apex's SSH/tmux setup. (This is the one place the "stripped to minimum" goal yields to the drive requirement -- SSH-in is not optional for remote tmux drive.)

### CLI install -- PIN to a specific 2.1.178+ version
`claude install [target]` accepts `stable`, `latest`, or **a specific version** (verified: `claude install --help` -> "Use [target] to specify version (stable, latest, or specific version)"). So we pin exactly, e.g. `2.1.179`, rather than drifting on `latest`.

**Two install methods exist in the repo -- choose by network egress:**
1. **Native installer** (apex, hr-devs): `curl -fsSL https://claude.ai/install.sh | bash` then `claude install <version>`. Native build supports `claude install <ver>` + self-update.
2. **npm global** (backlog-triage): `npm install -g @anthropic-ai/claude-code`. The backlog-triage Dockerfile documents WHY: *"the claude.ai/install.sh native installer uses Node.js fetch() which does NOT support SOCKS5 proxies"* -- on SOCKS-tunneled hosts npm is the only path. **For version-pinning** npm takes `@anthropic-ai/claude-code@<version>`.

**WARP nuance (carry from apex):** on WARP-protected build hosts, `curl --insecure` is needed at build time for the TLS-intercepting CA, and the running container needs `NODE_EXTRA_CA_CERTS=/opt/warp-ca.pem` (bind-mounted CA) so Node trusts HTTPS to api.anthropic.com. If the probe runs on the same rc host as apex, replicate this; if on a non-WARP host, drop it.

### The teams flag
- `ENV CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in the image AND in compose `environment:` (apex sets it both in compose line 67 and in the generated `settings.json` env). The flag survives 2.1.178, so it stays.

### Sketch (NOT for build -- illustrative)
```dockerfile
FROM ubuntu:24.04
RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates git nodejs npm \
    && rm -rf /var/lib/apt/lists/*
# Node 22 (Claude needs 20+); on WARP host use the direct-tarball trick from apex.
# CLI -- PIN the version (throwaway probe, exact 2.1.178+):
RUN npm install -g @anthropic-ai/claude-code@2.1.179 && claude --version
# OR native: curl -fsSL https://claude.ai/install.sh | bash && claude install 2.1.179
ENV CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
# auth: ANTHROPIC_API_KEY supplied at run via compose environment (PO gate)
# user: non-root ai-teams uid 1000 (match apex; Claude refuses --dangerously as root unsafely)
```
- **Volume:** mount a throwaway named volume at `~/.claude` so we can `docker cp` / inspect the filesystem artifacts the probes produce (config.json, inboxes/, session dirs) WITHOUT them vanishing on container stop. This is the probe's observation surface.
- **No host bind mounts of real creds.** Only the API key via env.

---

## 3. How the 5 probes get driven

### Driving mechanism -- tmux-hosted interactive session (PO-requested, 2026-06-17 18:04)

**Primary method = a tmux-hosted INTERACTIVE Claude session on the probe container, driven over SSH with `tmux send-keys` (inject) + `tmux capture-pane` (read).** NOT one-shot `claude -p`. Rationale (PO): we need to spawn the teammate, then inspect the filesystem BETWEEN probe steps and watch output live -- far faster to debug, and it's the established team pattern (rc `tmux new-session -A -s <name>` + the `tmux-direct-brief` skill). `claude -p` headless is retained only as a fallback for a fully-scripted re-run once the sequence is known.

This means the probe container must allow **SSH in** (so the operator can `tmux send-keys`/`capture-pane` remotely) -- so, unlike a pure-throwaway, it keeps the apex-style sshd-on-2222 + an SSH pubkey for the operator. (Adds back the SSH layer I'd stripped; it's required for the remote-drive method.)

**Session setup (in-container, after build, after go):**
```bash
# inside the container (or via docker exec), as the ai-teams user:
tmux new-session -A -d -s probe         # -A = attach-or-create, -d = detached
tmux send-keys -t probe:0.0 'claude' Enter   # launch the interactive Claude TUI in the pane
# wait for the TUI prompt, then drive via the send-keys/capture-pane cycle below.
```

**The send-keys / capture-pane cycle (per the tmux-direct-brief skill -- the mechanics that actually work):**
- **Inject a single-line instruction:** `ssh <conn> "tmux send-keys -t probe:0.0 '<prompt text>' && tmux send-keys -t probe:0.0 Enter"` is fine for a SHORT single-line prompt. For multi-line, use the 3-separate-invocation rule: `scp` a file -> `ssh ... "tmux load-buffer f && tmux paste-buffer -t probe:0.0"` -> (SEPARATE ssh) `ssh ... "tmux send-keys -t probe:0.0 Enter"`. Chaining paste+Enter in one ssh invocation silently fails to submit.
- **Read pane state:** `ssh <conn> "tmux capture-pane -t probe:0.0 -p | tail -40"`. Watch for the shimmering indicator (processing) vs an idle `❯` prompt (turn done).
- **Shell-quoting:** keep loop vars like `$p` inside SINGLE-quoted SSH payloads or the LOCAL shell expands them first.
- **Inspect the FS between steps:** the operator has SSH + a shell, so just run `ls`/`find`/`jq`/`cat` directly over SSH (or `docker exec`) against `~/.claude/teams/` between probe turns -- no need to round-trip through the Claude session for observation. A mounted `~/.claude` volume still lets us `docker cp` a full snapshot out for the record.

### The 6 probes -- CANONICAL (defined by team-lead/Aen, 2026-06-17 18:02 + P6 added 18:07)

These are the authoritative Phase-2 probes (they supersede my earlier proposed set). They are sharper -- P1 is the load-bearing one for the SPAWN path; **P6 is the PO's ideal-case NO-SPAWN test (run it FIRST, before any spawn).** The container + driver scope above is probe-agnostic, so it serves all six unchanged.

**This is the FINAL canonical set (Aen 2026-06-17 18:13).** It supersedes any earlier numbering in this doc. NB: members[]-injection is NOT a standalone probe -- apex already found SendMessage is not members[]-gated; observe it incidentally only.

| # | Probe | Question | Capture / observable |
|---|---|---|---|
| **P6 ⭐ (run FIRST, no spawn)** | Bare-session inbox reachability (PO ideal case) | On a BARE 2.1.178 session -- no TeamCreate, NO teammate spawned, NO member registered -- (a) does a `team-lead` inbox exist out of the box? (b) does an EXTERNAL inbox-write wake/deliver to the session with zero spawns? | (a) After just starting a fresh session: `ls ~/.claude/teams/*/inboxes/team-lead.json` EXISTS? Record exact path+name. (b) External process writes a JSON entry into it -> `capture-pane` shows the session woke + received. BOTH YES = cleanest substrate: a lone session reachable with zero setup. PO's ideal outcome. |
| **P1 ⭐** | Team-name determinism (LOAD-BEARING) | Spawn a teammate via Agent tool passing `team_name="framework-research"`. Does it auto-create a team, and is the on-disk name controllable/stable/discoverable, or random `session-<id>`? | `ls ~/.claude/teams/` + `jq .name ~/.claude/teams/*/config.json`. Pass = a `framework-research` dir whose `.name` == requested. Fail/risk = `session-<id>`/random -> **our courier's hardcoded `~/.claude/teams/framework-research/inboxes` path breaks**. |
| **P2** | Inbox substrate | Do `~/.claude/teams/<name>/inboxes/<member>.json` files appear, and where? | `find ~/.claude/teams/ -name '*.json'` after spawn; record presence + exact path of per-member inbox files. |
| **P3** | SendMessage round-trip | Does `SendMessage` deliver + WAKE between the lead session and the Agent-spawned teammate? | Lead SendMessages the teammate; teammate receives + replies; reply observed in the lead pane. |
| **P4** | Lifecycle (spawn + teardown) | With TeamCreate/TeamDelete gone, what is the spawn + teardown path? Is teardown explicit or implicit-on-session-end? | Document the observed spawn mechanism (Agent tool) and how a teammate/team is torn down (any tool? session-exit? orphaned dirs?). |
| **P5** | Persistence | Does the `session-<id>` (or named) team survive a container restart? Is `config.json` written eagerly or lazily? | Snapshot `~/.claude/teams/` -> restart container -> re-snapshot. Note eager-vs-lazy config.json write timing. |

**Why this set + ordering:** **P6 runs first** -- best case (lone session reachable with zero setup); if P6(a)+P6(b) are YES the courier needs no spawn/registration. P1 is load-bearing for the SPAWN path (decides if our hardcoded team-path survives). P2/P3 confirm the inbox substrate + SendMessage delivery/wake our comms depend on. P4 maps the lifecycle now that TeamCreate/TeamDelete are gone (FR's startup Step-2 / shutdown S5 replacements). P5 tells us whether team state is durable across restart (FR's restore model). members[]-injection: observe incidentally during P3 (apex confirmed SendMessage isn't members[]-gated), not a dedicated probe. P6(b) and the inbox-write mechanism are the courier's inbound-injection primitive -- if P6 or P3 fail, the cross-team comms layer needs redesign before we unpin.

> **Reference-team note:** apex-research is on CLI **2.1.110** (OLDER than our 2.1.177), so they CANNOT report 2.1.178 behavior -- the throwaway probe is the only way to get real post-2.1.178 data. This is why we build rather than ask apex.

### Per-probe drive sequence (tmux send-keys / capture-pane)

`<conn>` = `ssh -i <operator-key> -p 2222 ai-teams@<probe-host>`. Pane = `probe:0.0`. Each step alternates: inject via the session (or write FS directly), then observe via `capture-pane` / direct `ssh` shell commands.

- **P6 ⭐ bare-session reachability (RUN FIRST -- no spawn):**
  - Start the bare session: `tmux send-keys -t probe:0.0 'claude' Enter`, wait for the prompt (`capture-pane`).
  - **6(a)** -- before ANY spawn/message, observe the FS directly:
    `ssh <conn> "find ~/.claude/teams/ -maxdepth 2 \( -name 'team-lead.json' -o -name config.json \) 2>/dev/null; echo '---'; ls -la ~/.claude/teams/*/inboxes/ 2>/dev/null"` -- does `team-lead.json` (or equivalent) exist with zero spawns? Record exact path + name.
  - **6(b)** -- if a team-lead inbox exists, write a JSON entry into it from an EXTERNAL process (no member spawned):
    `ssh <conn> "python3 -c \"import json,os,glob; p=glob.glob(os.path.expanduser('~/.claude/teams/*/inboxes/team-lead.json'))[0]; d=json.load(open(p)); d.append({'from':'probe-ext','text':'P6 wake-test'}); json.dump(d,open(p,'w'))\""`
    then `ssh <conn> "tmux capture-pane -t probe:0.0 -p | tail -40"` -- did the session wake + receive (shimmering / new turn / message rendered)?
  - PASS(6a+6b) = lone session reachable with ZERO setup. If PASS, P1/P4 may be unnecessary; if 6(a) fails (no inbox without spawn), fall through to the spawn-path probes below.

- **Pre-spawn baseline (record before P1):**
  `ssh <conn> "ls -la ~/.claude/teams/ 2>/dev/null; echo '---'; cat ~/.claude/teams/*/config.json 2>/dev/null"` -- the post-P6, pre-spawn state.

- **P1 ⭐ team-name determinism:** inject a prompt telling the session to spawn a teammate with `team_name="framework-research"` (multi-line -> use the scp+load-buffer+paste+Enter sequence). Then observe directly over SSH:
  `ssh <conn> "ls ~/.claude/teams/ && for d in ~/.claude/teams/*/; do echo \"== \$d\"; jq -r '.name' \"\$d/config.json\" 2>/dev/null; done"`
  PASS = a `framework-research` dir whose `.name` == requested. RISK = `session-<id>`/random.

- **P2 inbox substrate:** after the P1 spawn, observe the per-member inbox files:
  `ssh <conn> "find ~/.claude/teams/ -maxdepth 3 -name '*.json' | sort"` -- record whether `~/.claude/teams/<name>/inboxes/<member>.json` exists and its exact path/name. (incidentally note config.json `members[]` shape -- members[]-injection is NOT a separate probe; apex confirmed SendMessage isn't members[]-gated.)

- **P3 SendMessage round-trip:** inject "use SendMessage to ping the spawned teammate; report its reply." Observe the lead pane (`capture-pane ... | tail -40`) for the reply, AND confirm delivery+wake on disk:
  `ssh <conn> "cat ~/.claude/teams/*/inboxes/<teammate>.json"`. PASS = teammate woke, replied, reply rendered in lead pane.

- **P4 lifecycle (spawn + teardown):** spawn path = the Agent-tool call from P1 (record the exact mechanism). For teardown: inject any teardown the session offers (or end the teammate), then observe what happens to its dir/inbox:
  `ssh <conn> "ls -la ~/.claude/teams/*/ ; ps -ef | grep -c '[c]laude'"` before/after -- is teardown explicit (a tool) or implicit (session-exit)? Any orphaned team dirs? (Maps FR's startup Step-2 / shutdown-S5 replacements.)

- **P5 persistence (restart):** snapshot, restart, re-snapshot:
  `ssh <conn> "find ~/.claude/teams/ | sort > /tmp/pre.txt"` -> (operator) `docker compose -f docker-compose.probe.yml restart` -> `ssh <conn> "find ~/.claude/teams/ | sort > /tmp/post.txt; diff /tmp/pre.txt /tmp/post.txt"`. Does the team survive restart? Note config.json write timing (eager at spawn vs lazy at first message).

- **Snapshot for the record (after all probes):**
  `docker cp <container>:/home/ai-teams/.claude/teams /tmp/probe-snapshot-teams` (or `tar` over SSH), then `docker compose down -v` (throwaway).

**Probe count reconciled: SIX (P6 + P1-P5).** P6 is the PO ideal-case no-spawn test added 2026-06-17 18:07 and is run FIRST; this matches the Phase-2 task's "P1-P6".

---

## 4. Summary: what's needed before Phase 2 (build+run)

1. **PO supplies/approves `ANTHROPIC_API_KEY`** for the probe (auth gate). API-key auth = clean sibling reuse, no OAuth/login.
2. **The 6 probes are confirmed** (P6 + P1-P5, team-lead-defined). No further sign-off needed on the probe set.
3. **Confirm host** (WARP rc host -> replicate CA + insecure-curl; non-WARP -> simpler recipe) and the **exact CLI version** to pin (2.1.179 or whatever latest 2.1.178+ is at build time).
4. **team-lead + PO go** -> then build the throwaway image, run, drive P6 then P1-P5, snapshot `~/.claude`, report findings, `docker compose down -v` (throwaway). Execution: Brunel builds+brings-up; Hopper drives the probes.

No host changes, no live-team impact, no touching the pinned 2.1.177 binary. The probe is fully isolated.
