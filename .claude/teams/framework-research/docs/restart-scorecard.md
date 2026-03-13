# Restart Scorecard (*FR:Volta*)

Tracks restart quality across sessions. Each restart adds a new entry. Prior entries are never modified.

**Who fills this:** Whoever analyzes the restart (typically Volta or team-lead). Fill immediately after restart analysis, before shutdown.

**Where this fits:** Medici runs knowledge health audits. This scorecard tracks **restart-specific** quality — did the startup protocol work, what broke, what improved.

---

## Scoring

Each restart is scored on issues found:

| Severity | Meaning | Examples |
|---|---|---|
| CRITICAL | Protocol failure that blocks startup or loses data | Inboxes destroyed, TeamCreate with wrong name, agents can't communicate |
| HIGH | Protocol gap that wastes significant resources | Explore agent instead of Orient phase, phases executed out of order |
| MEDIUM | Friction that slows startup but doesn't block it | workDir mismatch requiring fallback, missing file requiring extra read |
| LOW | Minor inconvenience or cosmetic issue | Mislabeled phase name, verbose output |

**Restart quality grade:**

- **A** — 0 issues (protocol worked perfectly)
- **B** — LOW/MEDIUM only (friction but no failures)
- **C** — 1+ HIGH (significant waste but startup succeeded)
- **D** — 1+ CRITICAL (startup failed or data lost)

---

## Restart Log

### Restart 1 (2026-03-13 ~17:30) — Protocol version: 6-phase

**Context:** First restart test after writing the canonical lifecycle protocol. Team-lead had context from the same session (warm context, not a true cold restart).

**Executor:** Team-lead (same session)
**Analyzer:** Volta (same session)

| # | Issue | Severity | Status |
|---|---|---|---|
| R1-1 | Phase 2 lacked diagnostic preamble — team-lead couldn't tell cold start from warm restart without extra investigation | HIGH | FIXED in v2 (Phase 2.0 Diagnose added) |
| R1-2 | Task-list-snapshot placed in Shutdown Phase 4 — worst timing, lead is cognitively loaded | HIGH | FIXED in v2 (moved to Shutdown Phase 2a) |
| R1-3 | Local teams have no spawn automation — Agent tool lacks duplicate gate, prompt loading | MEDIUM | FIXED in v2 (Path 2.5 spawn_local.sh added) |

**Grade: C** (2 HIGH, 1 MEDIUM)
**Amendments produced:** Phase 2.0 Diagnose, Shutdown Phase 2a snapshot timing, Path 2.5 spawn_local.sh

---

### Restart 2 (2026-03-13 ~18:40) — Protocol version: 6-phase + v2 amendments

**Context:** Second restart test. Shutdown executed per protocol. Team dir was preserved (Phase 5: Preserve followed). But something happened between shutdown and restart — team dir was missing at startup.

**Executor:** Team-lead (fresh session, zero prior context)
**Analyzer:** Volta (spawned after restart)

| # | Issue | Severity | Status |
|---|---|---|---|
| R2-1 | No self-orientation phase — team-lead spent 31 tool uses, 73.5k tokens, 2m18s on Explore agent to find team config | CRITICAL | FIXED in v3 (Phase 0 Orient + startup.md) |
| R2-2 | workDir in roster.json wrong — `$HOME/github/...` instead of `$HOME/Documents/github/...` — required fallback bash check | MEDIUM | FIXED in v3 (workDir Resolution in Phase 0 + roster.json corrected) |
| R2-3 | Missing team dir silently accepted as COLD START — no investigation of why dir was absent despite shutdown protocol preserving it | HIGH | FIXED in v3 (Anomaly Detection in Phase 2.0) |
| R2-4 | Phase ordering scrambled AND mislabeled — Create called "Phase 1: Sync", config reads done after Create instead of before | HIGH | FIXED in v3 (Phase Ordering Enforcement section + strict checklist in startup.md) |
| R2-5 | Team config repo location not discoverable without exploration — implicit knowledge, not in any file the team-lead would read first | HIGH | FIXED in v3 (startup.md contains all paths; team-lead prompt updated to reference startup.md) |

**Grade: D** (1 CRITICAL, 3 HIGH, 1 MEDIUM)
**Amendments produced:** Phase 0 Orient, startup.md (new file), workDir Resolution, Anomaly Detection, Phase Ordering Enforcement, restart-test.md SC-2 expansion

---

### Restart 3 (pending) — Protocol version: 7-phase + v3 amendments + startup.md

**Context:** Third restart test. Will validate whether startup.md eliminates exploration, Phase 0 Orient works, anomaly detection fires correctly, and phase ordering is followed.

**Key questions for this restart:**

- Does the team-lead read startup.md FIRST (before any exploration)?
- Is Phase 0 Orient sufficient — do the 5 file reads provide enough context?
- Does the anomaly detection in Phase 2.0 fire correctly if team dir is missing?
- Are phases executed in order with correct names?
- What is the token cost of startup compared to Restart 2's 73.5k?

**Expected improvements over Restart 2:**

- R2-1 (Explore agent) → should not happen if startup.md is read first
- R2-2 (workDir) → roster.json now fixed
- R2-3 (silent acceptance) → anomaly detection rule should trigger investigation
- R2-4 (phase ordering) → strict checklist in startup.md should prevent
- R2-5 (repo location) → startup.md contains all paths

**Executor:** Team-lead (fresh session)
**Analyzer:** (to be filled)
**Issues:** (to be filled after restart)
**Grade:** (to be filled)

---

## Trend

| Restart | Date | Protocol Version | Critical | High | Medium | Low | Grade |
|---|---|---|---|---|---|---|---|
| 1 | 2026-03-13 | 6-phase | 0 | 2 | 1 | 0 | C |
| 2 | 2026-03-13 | 6-phase + v2 | 1 | 3 | 1 | 0 | D |
| 3 | pending | 7-phase + v3 + startup.md | ? | ? | ? | ? | ? |

**Note on Restart 2 grade worsening:** Restart 2 scored worse than Restart 1 because Restart 1 was executed by a team-lead with warm context (same session), while Restart 2 was a true cold restart (fresh session, zero context). The cold restart exposed failure modes that warm context masked. This is expected — the protocol's job is to make cold restarts as smooth as warm ones.

---

## Issue Resolution Tracking

| Issue ID | Found in | Fixed in | Verified in | Description |
|---|---|---|---|---|
| R1-1 | Restart 1 | v2 | Restart 2 (Phase 2.0 was executed) | Diagnostic preamble missing |
| R1-2 | Restart 1 | v2 | pending | Task snapshot timing |
| R1-3 | Restart 1 | v2 | pending | Local spawn automation |
| R2-1 | Restart 2 | v3 | pending (Restart 3) | No self-orientation phase |
| R2-2 | Restart 2 | v3 | pending (Restart 3) | workDir mismatch |
| R2-3 | Restart 2 | v3 | pending (Restart 3) | Silent acceptance of missing dir |
| R2-4 | Restart 2 | v3 | pending (Restart 3) | Phase ordering scrambled |
| R2-5 | Restart 2 | v3 | pending (Restart 3) | Repo location not discoverable |

(*FR:Volta*)
