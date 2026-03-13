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

### Restart 3 — skipped

Restart 3 was not executed as a separate test. The session went directly to Restart 4. Restart 3 stub removed to avoid confusion.

---

### Restart 4 (2026-03-13 ~19:00) — Protocol version: 7-phase + v3 amendments + startup.md (*FR:Volta*)

**Context:** Real cold start — runtime dir (`~/.claude/teams/framework-research/`) missing, 12 other team dirs survived. Team-lead followed startup.md. Two new infrastructure failures discovered: `$HOME` unreliability on Windows/Git Bash, and TeamCreate silent failure (returns success but no config.json on disk).

**Executor:** Team-lead (fresh session)
**Analyzer:** Volta (spawned after restart)

| # | Issue | Severity | Status |
|---|---|---|---|
| R4-1 | `$HOME` env var resolves to EMPTY STRING in some bash calls on Windows/Git Bash. Diagnose script checks `/.claude/teams/...` (root path) instead of correct user path. Other bash calls in same session resolve correctly. Shell initialization is inconsistent across bash invocations. | CRITICAL | OPEN — v4: replace `$HOME` with resolved absolute path; add validation gate |
| R4-2 | TeamCreate returns success (`team_file_path` + `leadAgentId`) but `config.json` does NOT exist on disk. Verified via Glob, Read, and bash ls. Required TeamDelete + re-TeamCreate to get working state. Protocol's Step 4 verification correctly specifies "verify config.json exists" — but no recovery path when it fails. | CRITICAL | OPEN — v4: add retry loop (verify → TeamDelete → re-TeamCreate, max 2 attempts) |
| R4-3 | Medici spawned into broken team state (after first failed TeamCreate). Spawn returned "success" but team was non-functional. Agent was wasted — health report unreliable or never arrives. | HIGH | OPEN — v4: add "team operational" gate — verify config.json + send test message BEFORE any agent spawn |
| R4-4 | Runtime dir missing despite "do NOT call TeamDelete" rule. 12 other team dirs survived. Root cause unknown. | MEDIUM | INFORMATIONAL — anomaly detection (R2-3 fix) fired correctly. Protocol worked as designed. |
| R4-5 | Inbox backup/restore is a no-op on cold start — no recovery for lost inboxes | LOW | BY DESIGN — inbox loss is the cost of anomalous cold start. Already documented. |

**Grade: D** (2 CRITICAL, 1 HIGH, 1 MEDIUM, 1 LOW)

**Key insight:** Both CRITICALs are infrastructure issues (Windows shell bug, TeamCreate tool behavior), not protocol design flaws. The protocol correctly specified the right verification steps — but lacked **recovery paths** when verification failed. The pattern: "verify X" is necessary but insufficient; "verify X, and if X fails, do Y" is the correct form. R4 shifts the protocol from "detect failure" to "detect AND recover from failure."

**Verified fixes from prior restarts:**
- R2-1 (Explore agent): **VERIFIED FIXED** — startup.md read first, no Explore agent
- R2-3 (silent acceptance): **VERIFIED FIXED** — anomaly detection fired, team-lead investigated
- R2-4 (phase ordering): **VERIFIED FIXED** — phases in correct order with correct names
- R2-5 (repo location): **VERIFIED FIXED** — startup.md provided all paths

**Amendments produced:** v4 — `$HOME` validation gate + absolute paths, TeamCreate retry-with-verification loop, team operational check gate before spawning

---

## Trend

| Restart | Date | Protocol Version | Critical | High | Medium | Low | Grade |
|---|---|---|---|---|---|---|---|
| 1 | 2026-03-13 | 6-phase | 0 | 2 | 1 | 0 | C |
| 2 | 2026-03-13 | 6-phase + v2 | 1 | 3 | 1 | 0 | D |
| 3 | skipped | — | — | — | — | — | — |
| 4 | 2026-03-13 | 7-phase + v3 + startup.md | 2 | 1 | 1 | 1 | D |

**Note on Restart 2 grade worsening:** Restart 2 scored worse than Restart 1 because Restart 1 was executed by a team-lead with warm context (same session), while Restart 2 was a true cold restart (fresh session, zero context). The cold restart exposed failure modes that warm context masked. This is expected — the protocol's job is to make cold restarts as smooth as warm ones.

**Note on Restart 4:** Grade is D (2 CRITICAL) but qualitatively different from R2's D. R2's CRITICAL was a protocol design gap (no Orient phase). R4's CRITICALs are infrastructure issues (Windows shell bug, TeamCreate tool behavior) — the protocol correctly specified verification, but lacked recovery paths. 4 of 5 prior issues verified fixed. R4 shifts protocol design from "detect failure" to "detect AND recover."

---

## Issue Resolution Tracking

| Issue ID | Found in | Fixed in | Verified in | Description |
|---|---|---|---|---|
| R1-1 | Restart 1 | v2 | Restart 2 | Diagnostic preamble missing |
| R1-2 | Restart 1 | v2 | pending | Task snapshot timing |
| R1-3 | Restart 1 | v2 | pending | Local spawn automation |
| R2-1 | Restart 2 | v3 | **Restart 4** | No self-orientation phase — startup.md read first |
| R2-2 | Restart 2 | v3 | pending | workDir mismatch (not tested — roster.json not re-read in R4) |
| R2-3 | Restart 2 | v3 | **Restart 4** | Silent acceptance of missing dir — anomaly detection fired |
| R2-4 | Restart 2 | v3 | **Restart 4** | Phase ordering scrambled — phases followed in order |
| R2-5 | Restart 2 | v3 | **Restart 4** | Repo location not discoverable — startup.md provided paths |
| R4-1 | Restart 4 | v4 (proposed) | pending | `$HOME` unreliable on Windows — use absolute paths + validation gate |
| R4-2 | Restart 4 | v4 (proposed) | pending | TeamCreate silent failure — retry loop with verification |
| R4-3 | Restart 4 | v4 (proposed) | pending | Agent spawned into broken team — operational check gate |
| R4-4 | Restart 4 | — | — | Missing dir cause unknown (informational) |
| R4-5 | Restart 4 | — | — | Inbox no-op on cold start (by design) |

(*FR:Volta*)
