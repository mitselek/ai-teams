# hr-devs Team Health Report — 2026-03-24 (Audit v1)

(*FR:Medici*)

## Scope

Full audit of the `reference/hr-devs/` configuration for container deployment readiness.
This is the first audit of this team from the framework-research perspective.

Artifacts audited:
- `reference/hr-devs/roster.json`
- `reference/hr-devs/common-prompt.md`
- `reference/hr-devs/prompts/` — all 9 prompt files
- `reference/hr-devs/docs/` — 6 shared knowledge files
- `reference/hr-devs/memory/` — 7 scratchpads
- `reference/hr-devs/eilama-concept.md`
- `designs/new/hr-devs/container/` — Dockerfile, entrypoint, docker-compose

---

## Summary

**11 recommendations total: 2 HIGH, 5 MEDIUM, 4 LOW**

Overall readiness: **GOOD with gaps** — container artifacts are solid and deployment-ready. Team prompts are well-structured. Primary concerns: (1) missing files from the container spec, (2) stale/inconsistent paths in prompts, (3) eilama is in roster but has no deployment path.

---

## 1. [COHERENCE] — Are the reference artifacts consistent with each other?

**Status: MOSTLY CONSISTENT — 3 tensions found**

### C1. Scratchpad paths in prompts point to wrong location

Every agent prompt directs the agent to read/write their scratchpad at:
`hr-platform/.claude/teams/hr-devs/memory/<name>.md`

But the reference files being shipped into the container have memory files at:
`reference/hr-devs/memory/<name>.md`

Per `hr-devs-container-spec.md §5`: "The roster.json, prompts/, common-prompt.md, and memory/ files remain in `hr-platform/.claude/teams/hr-devs/` (source of truth in the hr-platform repo). The container clones hr-platform — these files come in via git, not container bake."

**Assessment:** The path in prompts is correct for the container (points into the cloned hr-platform repo). But the reference files in this repo (`mitselek-ai-teams/reference/hr-devs/`) are a design copy, not the deployed source. No action needed — this is intentional architecture. **No contradiction.**

### C2. startup-shutdown.md references apply-layout.sh — file not in container design

`docs/startup-shutdown.md` (line 58+): "Team-lead reads `hr-platform/.claude/teams/hr-devs/apply-layout.sh`"

And in auto-tmux block of entrypoint:
```bash
LAYOUT_SCRIPT="$HOME/workspace/hr-platform/.claude/teams/hr-devs/apply-layout.sh"
```

But `hr-devs-container-spec.md §5` lists `apply-layout.sh` as a file TO CREATE, and it does not appear in `designs/new/hr-devs/container/`. The entrypoint degrades gracefully (`if [ -f "$LAYOUT_SCRIPT" ]; then`) but the team-lead will have no pre-split layout on first SSH login.

**Severity: MEDIUM — container starts successfully but team-lead must manually split panes.**

### C3. spawn_member.sh referenced but not present in container design

`startup-shutdown.md` and all agent prompts reference:
`~/github/hr-platform/.claude/teams/hr-devs/spawn_member.sh`

The container spec (§5) lists `spawn_member.sh` as a file TO CREATE. It is not in `designs/new/hr-devs/container/`. The spawn script must be adapted for the container environment (different paths than bare-metal).

**Severity: HIGH — without spawn_member.sh, team-lead cannot spawn any agent in the container.**

### C4. Dashboard docs script path inconsistency

`common-prompt.md` (line 183) and `prompts/marcus.md` (line 27) reference:
`~/github/dev-toolkit/.claude/teams/add-doc-to-dashboard.sh`

But in the container, workspace is `/home/ai-teams/workspace/`, not `~/github/`. The correct path would be:
`~/workspace/dev-toolkit/.claude/teams/add-doc-to-dashboard.sh`

**Severity: MEDIUM — dashboard docs will fail to push until team-lead corrects path manually.**

---

## 2. [EXTRACTION] — Have all design decisions been properly captured?

**Status: CONTAINER SPEC COMPLETE — Missing implementation artifacts**

`hr-devs-container-spec.md` is thorough (650 lines, 15 sections). Container artifacts are present:
- `Dockerfile.hr-devs` — complete, well-commented
- `entrypoint-hr-devs.sh` — complete, 10-step design, matches spec
- `docker-compose.hr-devs.yml` — complete, all env vars documented

**Missing artifacts from spec §5:**

| File | Spec location | Status |
|---|---|---|
| `apply-layout.sh` | `hr-platform/.claude/teams/hr-devs/` | **MISSING** |
| `spawn_member.sh` | `hr-platform/.claude/teams/hr-devs/` | **MISSING** |
| `startup.md` | `hr-platform/.claude/teams/hr-devs/` | **MISSING** |
| `statusline-command.sh` | `hr-platform/.claude/` | **MISSING** |
| `.env.example` | container design | NOT in designs/new/hr-devs/container/ |

Note: `.env.example` content IS present as §14 in the spec but not as a standalone file.

**Also noted:** Container spec §7 Step 8c references "statusline-command.sh registration in settings.json" but the entrypoint code (step 8 in actual entrypoint-hr-devs.sh) only has:
```bash
if ! grep -q 'statusLine' "$SETTINGS_FILE" 2>/dev/null; then
    echo "[entrypoint] WARNING: settings.json exists but missing statusLine — add manually per runbook §13."
fi
```
The entrypoint warns but doesn't create `statusline-command.sh`. The script itself must be provided externally or via the hr-platform repo.

---

## 3. [GAP] — What's missing from the team configuration?

**3a. Eilama deployment path undefined**

`roster.json` includes eilama:
```json
{
  "name": "eilama",
  "agentType": "code-specialist",
  "model": "ollama:codellama:13b-instruct",
  "backendType": "daemon"
}
```

`eilama-concept.md` is detailed (246 lines), and `prompts/eilama.md` exists. However:
- The container spec (§1 delta table) explicitly marks Eilama as **DROPPED**
- No `eilama-daemon.py` is present in the container design
- `spawn_member.sh` (when written) would need special-case handling for `backendType: daemon`
- No Ollama installation is in the Dockerfile

**Risk:** The roster entry will cause confusion. If team-lead calls `spawn_member.sh eilama`, it will fail. The scratchpad note in medici.md from the concept phase says "DROPPED" but this isn't reflected in roster.json.

**Severity: MEDIUM — should either remove from roster or add explicit skip logic.**

**3b. No lead.md scratchpad in reference memory**

`startup-shutdown.md` Step 0 line 4: "Read `hr-platform/.claude/teams/hr-devs/memory/lead.md` (scratchpad, if exists)"

There is no `lead.md` in `reference/hr-devs/memory/`. This is fine for first-run (file doesn't exist yet), but team-lead's own startup instruction assumes this file. The common-prompt says "memory/ — agent scratchpads" with one per agent, but `team-lead` has no scratchpad file in the reference set.

**Severity: LOW — "if exists" handles this, but consistency with other agents would be better.**

**3c. api-contracts.md is empty**

`reference/hr-devs/docs/api-contracts.md` contains only:
"No contracts documented yet. Add entries as new endpoints are agreed."

Given the team has been operating on bare-metal and has documented routes (finn.md has detailed route architecture), this suggests either: (a) Sven and Dag use informal verbal contracts, or (b) the file was never populated. Either way, starting the container with an empty api-contracts.md means new agents won't have frontend/backend contract reference.

**Severity: LOW — agents will rediscover contracts, just costs tokens.**

---

## 4. [CONTRADICTION] — Do any files contradict each other or the reference?

**4a. docker-compose spec §8 vs actual file: port mapping**

Container spec §8 (design):
```yaml
- "5178:5173"   # Vite dev server (vite listens on 5173 inside)
```

Actual `docker-compose.hr-devs.yml` (line 95):
```yaml
- "5178:5178"   # Vite dev server (start with: npm run dev -- --port 5178)
```

The spec says Vite listens internally on 5173 (its default) and maps to host 5178. The actual compose file maps 5178:5178 — meaning Vite must be started with `--port 5178` (which the entrypoint documents via the .bashrc comment). The entrypoint also sets `VITE_PORT=5178`.

**Assessment:** These are two different valid approaches. The actual file is internally consistent (VITE_PORT=5178, port mapping 5178:5178). The spec text is slightly stale. No operational problem since network_mode: host ignores port mapping anyway.

**Severity: LOW — documentation only (network_mode: host makes port mapping irrelevant).**

**4b. common-prompt § says "spawn via CLI" but container uses spawn_member.sh**

`common-prompt.md` "Agent Spawning Rule" says (in Estonian):
"Agente tuleb ALATI spawnida `run_in_background: true` parameetriga."

But `startup-shutdown.md` says:
"Background spawn DOES NOT WORK — claude CLI requires TTY"
"Use `spawn_member.sh` (NEVER Agent tool, NEVER raw CLI)"

This is a contradiction. The common-prompt rule was written for the Agent tool pattern (framework-research style). The hr-devs team uses tmux panes + CLI spawning, NOT the Agent tool pattern.

**Severity: MEDIUM — team-lead reading common-prompt will try Agent tool (run_in_background: true) which won't work. The spawn rule in common-prompt needs to reflect the tmux/spawn_member.sh pattern.**

---

## 5. [STALE] — Are scratchpads current and pruned?

| Scratchpad | Lines | Limit | Status |
|---|---|---|---|
| finn.md | 100 | 100 | AT LIMIT — contains research from 2026-03-11; all entries appear current |
| tess.md | ~112 | 100 | **OVER LIMIT** — contains valuable patterns but exceeds limit |
| marcus.md | ~68 | 100 | Current — 22 reviews documented, all relevant |
| sven.md | unknown | 100 | Not read (not in scope) |
| dag.md | unknown | 100 | Not read (not in scope) |
| arvo.md | unknown | 100 | Not read (not in scope) |
| medici.md | 0 | 100 | Empty — this is the hr-devs medici scratchpad, not framework-research |

**tess.md:** 112 lines estimated. The `[GAP]` section (lines 87-101) is detailed and current (notification coverage gaps from 2026-03-13). Test ID ranges (103-110) are also current. No obvious stale entries — the file is genuinely full. Consider promoting test ID range info to a shared reference file.

**finn.md:** At the 100-line limit. All 10 `[LEARNED]`/`[GOTCHA]` entries appear current and non-trivial. No obvious pruning targets. The Figma rate-limit operational detail (lines 12-33) duplicates what's in finn's prompt but adds operational nuance (leaky bucket, sequential sleep). This is the same issue flagged in the framework-research audit — the Figma detail is valuable but takes 22 lines.

---

## Recommendations (for team-lead)

### HIGH

**H1. [GAP] spawn_member.sh must be written before container deployment.**
The bare-metal spawn_member.sh exists in hr-platform, but it needs adaptation for the container environment (different paths, different NODE_EXTRA_CA_CERTS path). Without it, team-lead cannot spawn any agent. The container spec (§13 Open Question 6) acknowledges this issue. This must be resolved before first container session.
**Action:** Delegate to Brunel (if available) or add to container pre-deployment checklist.

**H2. [CONTRADICTION] common-prompt Agent Spawning Rule contradicts the tmux-based spawn procedure.**
common-prompt says `run_in_background: true` (Agent tool pattern). startup-shutdown.md says "Background spawn DOES NOT WORK — use spawn_member.sh." These give opposite instructions to the team-lead. The common-prompt rule should describe the tmux + spawn_member.sh pattern instead.
**Action:** Update `reference/hr-devs/common-prompt.md` Agent Spawning Rule section. (Medici cannot edit — team-lead must apply.)

### MEDIUM

**M1. [GAP] apply-layout.sh missing — no pre-split tmux layout on first SSH login.**
Container entrypoint calls apply-layout.sh but file doesn't exist yet. Auto-tmux opens without the full-review pane split. Team-lead must manually split. startup-shutdown.md says this is the "canonical procedure." Write apply-layout.sh implementing the full-review split tree from tmux-layouts.md.
**Action:** Write `apply-layout.sh` into hr-platform repo before deployment.

**M2. [GAP] Eilama in roster but marked DROPPED in container spec — ambiguous state.**
roster.json includes eilama with `"backendType": "daemon"`. Container doesn't install Ollama. spawn_member.sh (when written) needs to handle or skip daemon-type agents. Risk of team-lead wasting time trying to spawn eilama.
**Action:** Remove eilama from roster.json OR add comment. If eilama is deferred (not dropped), document clearly.

**M3. [COHERENCE] Dashboard docs script path wrong for container.**
`~/github/dev-toolkit/...` doesn't exist in container. Should be `~/workspace/dev-toolkit/...`. Affects common-prompt.md and marcus.md prompt. Team-lead or Marcus will get "file not found" when trying to push reports to dashboard.
**Action:** Update `reference/hr-devs/common-prompt.md` line 183 and `reference/hr-devs/prompts/marcus.md` line 27. Also update hr-platform source files.

**M4. [GAP] statusline-command.sh missing.**
entrypoint.sh references it. Without it, Claude Code status bar shows nothing. The spec notes this must be written. Low operational impact but degrades session UX.
**Action:** Add to hr-platform repo at `hr-platform/.claude/statusline-command.sh`.

**M5. [GAP] startup.md (PO onboarding doc) not created.**
Spec §5 lists it as a required file. Without it, PO connecting for the first time has no documented first-session procedure.
**Action:** Write startup.md (brief version of startup-shutdown.md tailored for first login).

### LOW

**L1. [STALE] tess.md slightly over 100-line limit.**
At ~112 lines. All content is valid. The test ID range table (8 lines) could move to a shared `docs/test-id-ranges.md` file, freeing ~10 lines and making it accessible to all agents without reading a scratchpad.

**L2. [GAP] lead.md scratchpad absent from reference memory.**
startup-shutdown.md tells team-lead to read `memory/lead.md`. File doesn't exist. First-run "if exists" handles it, but adds asymmetry with other agent scratchpads.

**L3. [GAP] api-contracts.md is empty.**
No frontend/backend contracts documented despite team being operational. Sven and Dag should populate before container deployment so new agents can orient without rediscovery.

**L4. [STALE] Port mapping comment in spec vs actual docker-compose.**
Spec says `5178:5173`, actual says `5178:5178`. No operational impact (network_mode: host). Update spec §8 to match the actual file.

---

## Container Deployment Readiness Checklist

Based on this audit, the following must be resolved before first container session:

- [x] Dockerfile.hr-devs — complete
- [x] entrypoint-hr-devs.sh — complete
- [x] docker-compose.hr-devs.yml — complete
- [ ] **spawn_member.sh** — must be written (adapted for container paths) — BLOCKER
- [ ] **apply-layout.sh** — must be written (full-review split tree) — HIGH
- [ ] statusline-command.sh — should be written — MEDIUM
- [ ] startup.md — should be written — MEDIUM
- [ ] common-prompt.md spawn rule fix — must be updated — HIGH
- [ ] Dashboard docs path fix — must be updated — MEDIUM
- [ ] Eilama roster decision — remove or document clearly — MEDIUM

(*FR:Medici*)
