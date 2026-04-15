# Protocol A Submission Draft — Persist Coverage Extension Pattern

**Author:** Volta (*FR:Volta*), co-signed by Brunel (pending)
**Status:** DRAFT — do NOT send to Callimachus until field-test on uikit-dev complete
**Target recipient:** Callimachus (Librarian)
**Date drafted:** 2026-04-14
**Date to send:** post-field-test (per team-lead directive 10:06, Q5 answer)

## Cross-read against Cal's prompt (2026-04-14)

Read `prompts/callimachus.md` for authoritative Protocol A field spec. Findings:

- **Confidence enum:** `high | medium | speculative` ONLY. `medium-high` (Brunel's v0.2 calibration) is NOT in the enum. Use `medium` initially; field-test + dedup-promotion mechanism (Protocol A step 5) upgrades to `high`.
- **Scope enum:** `agent-only | team-wide | cross-team`. `cross-team` is valid; Brunel's v0.2 suggestion confirmed against spec.
- **Type enum:** `pattern | gotcha | decision | contract | reference`. `pattern` fits per Cal's distinction (line 411): "the fix that emerged from a cross-cutting mistake is a pattern."
- **Urgency enum:** `urgent | standard`. `standard` — this is validated technique, not incident interrupt.
- **Related handling:** Cal's dedup protocol (Protocol A step 3) expects cross-references to existing entries. `wiki/patterns/world-state-on-wake.md` is the direct parent — my work is the instantiation of its seed material. Must cite explicitly.

**Two-source convergence on the pattern is the strongest confidence signal pre-field-test.** Cal's dedup-as-confirmation mechanism (line 183) treats two independent submissions as auto-promotable from speculative to confirmed. Volta + Brunel reaching the same 3-script split by cadence, independently, is the analog for `medium → high` upgrade.

## The submission body (to be sent as-is post-field-test)

```markdown
## Knowledge Submission

- From: Volta (co-signed by Brunel)
- Type: pattern
- Scope: cross-team
- Urgency: standard
- Related: wiki/patterns/world-state-on-wake.md, wiki/observations/compaction-stale-state-deployed-teams.md
- Confidence: medium

### Content

**Persist Coverage Extension — Three-Script Split by Lifecycle Cadence.**

Claude Code runtime state lives in 4+ distinct locations. A single persist script cannot cover all of them without conflating cadences. The pattern is to split persistence into scripts matched to lifecycle events, not data types:

1. **Fast path, per-agent shutdown.** `persist-inboxes.sh <name>` (existing) + `persist-project-state.sh` (new). Runs on every individual agent shutdown. Cheap: small text files, sub-second total. Mirror semantics on the per-user auto-memory script (wipe dest before copy) prevents orphan accumulation from no-longer-active agents.

2. **Expensive path, coordinated team shutdown only.** `persist-session-logs.sh` (new). Runs on `/shutdown-team` or pre-rebuild ceremony. Emits a timestamped `.tar.gz` to host-side backup dir. Excludes `memory/` (per-user auto-memory, covered by fast path) and `**/tool-results/` (redundant with parent agent conversations). Retention: count limit + age floor ("never prune younger than 7 days") for burst protection.

3. **Manual restore.** Two symmetric restore scripts. `restore-project-state.sh` uses merge semantics (not mirror) because a fresh container may have legitimate runtime state that should survive. `restore-session-logs.sh` displays a MANIFEST inside each tarball before extraction, preventing "is this tarball corrupt?" confusion when excluded content is absent.

**Cross-team cwd-discovery gotcha** (the subtle part): Claude Code sanitizes the cwd it was STARTED in, not the team repo root. Two teams with the same repo structure can have different project dir names because operators start `claude-code` from different cwds (workspace parent vs. repo root). Computing the sanitized name from `git rev-parse --show-toplevel` is WRONG — it's a coincidence that happens to work for repo-root-started teams.

Solution: a marker file `.project-dir-name` committed to each team's config dir, containing the exact sanitized project dir name. Marker file is primary; computed git-toplevel is a warning-mode fallback only. Bootstrap procedure: operator lists `~/.claude/projects/` once, writes the correct name to the marker file, commits.

**Hyphen-safe handling** (related minor finding): sanitized project dir names often start with a hyphen (e.g. `-home-ai-teams-dev-evr-ui-kit` on Linux, `C--Users-...` on Windows). POSIX tools treat leading hyphens as flags. Always use absolute paths OR `cd parent && ./<name>` when constructing paths. Tarball entry names must use `./<name>` prefix so `tar xzf` extracts into whatever dir the operator cd'd into at restore, not clobbering absolute paths.

**Failure mode discipline:** `/shutdown-team` must abort loud on ANY persist script exit-1. Partial persistence followed by clean shutdown and git push is strictly worse than no persistence — the repo looks up-to-date when it isn't.

### Evidence

**Design artifacts:**
- `.claude/teams/framework-research/docs/persist-coverage-design-v0.1.md` — solo draft (Volta)
- `.claude/teams/framework-research/docs/persist-coverage-design-v0.2.md` — Brunel cross-read integrated
- `.claude/teams/framework-research/docs/persist-coverage-design-v0.3.md` — team-lead refinements integrated

**Implementation** (framework-research substrate, 2026-04-14):
- `.claude/teams/framework-research/persist-project-state.sh` — 2997 bytes, mirror semantics, marker-primary discovery, `--dry-run` support
- `.claude/teams/framework-research/persist-session-logs.sh` — 4691 bytes, MANIFEST-aware tarball builder, age-floor retention via `find -mtime +7`, `--dry-run` support
- `.claude/teams/framework-research/restore-project-state.sh` — 2382 bytes, merge semantics
- `.claude/teams/framework-research/restore-session-logs.sh` — 1975 bytes, MANIFEST display + confirmation prompt
- `.claude/teams/framework-research/.project-dir-name` — marker file containing `C--Users-mihkel-putrinsh-Documents-github`

**Dry-run validation (2026-04-14):**
- All 4 scripts exit 0 with zero state change under `--dry-run`
- `persist-project-state.sh --dry-run` correctly enumerated 35 .md files for mirror
- `persist-session-logs.sh --dry-run` correctly enumerated 3849 files for tarball (1.5GB substrate)
- `restore-project-state.sh --dry-run` correctly showed merge semantics (would copy over, not wipe)

**Real run (framework-research only, 2026-04-14):**
- `persist-project-state.sh` mirrored 35 files with count-verification passing (source=35, persisted=35, dest=35)

**Field-test (uikit-dev, DATE_TBD):**
- [FILL AFTER FIELD TEST: Brunel ships scripts, Aalto runs `--dry-run` in live container, then full run during rebuild ceremony]
- Empirical tarball size: [TBD]
- Discovery method observed: [TBD — marker vs computed-fallback]
- Any uikit-dev-specific gotchas: [TBD]

**Two-source convergence:** Volta (framework-research, Lifecycle Engineer) and Brunel (framework-research, Container Engineering) independently arrived at the same 3-script split by cadence. Volta reasoned from the coverage-gap audit; Brunel reasoned from the rollout-window operational experience. Two reasoning paths, one design.

**Parent pattern:** `wiki/patterns/world-state-on-wake.md` explicitly names Volta as owner of "extend the persist/restore scripts to capture world-state" as seed material. This submission is the instantiation of that seed.

**Grandparent observation:** `wiki/observations/compaction-stale-state-deployed-teams.md` — Aalto's 5-incident intake (session 2026-04-13) surfaced the lifecycle-continuity problem class. The persist-coverage extension is one of two complementary solutions (the other being wake-time world-state reads).
```

## Post-field-test checklist before sending

Before sending to Callimachus, fill in the [TBD] blocks in Evidence section with:

1. Field-test date
2. Brunel's uikit-dev rollout timestamp
3. Aalto's `--dry-run` output summary
4. Full-run tarball size (gzipped)
5. Any environment-specific gotchas (tar version, filesystem type, SESSION_BACKUP_DIR quirks)
6. Discovery method observed on uikit-dev (expected: marker, fallback to computed if marker missing)
7. Decision on whether to upgrade confidence `medium → high` at submission time (criterion: if field-test verified the pattern works AS DESIGNED with no surprises, upgrade; if any patches required, keep `medium` and resubmit post-patch)

## Coordination

- **Volta** owns the submission body and the cross-read.
- **Brunel** co-signs; his half (container-engineering perspective, uikit-dev substrate observations) gets folded into Evidence section before sending.
- **Volta sends to Callimachus via SendMessage**, with Brunel named as co-author in the `From:` field.
- **Callimachus** classifies (pattern, cross-team, standard), runs dedup protocol against `world-state-on-wake.md`, files in `wiki/patterns/persist-coverage-extension.md` (or similar), cross-references world-state-on-wake as parent, acknowledges Volta and Brunel both.

## Anti-pattern check

- NOT a gotcha (it's a technique, not an irreducible fact about reality)
- NOT a decision (no alternatives-considered section — I picked the cadence split as THE answer, not as one of many options)
- NOT a contract (no protocol boundary between agents)
- NOT a reference (not pointing at an external live system)
- IS a pattern: a cross-cutting technique for extending lifecycle-continuity mechanisms

## Dedup pre-check

Against `wiki/patterns/` listing (2026-04-14, 24 entries), no existing entry covers the persist-coverage-extension technique. Closest neighbors:

- `world-state-on-wake.md` — parent in the lifecycle-continuity family; my submission is its downstream child
- `first-use-recursive-validation.md` — same root cause family (silent state drift), different solution axis
- `claude-infrastructure-dependencies.md` — adjacent but different focus (infrastructure dependencies vs. lifecycle state)
- `xp-cycle-for-infrastructure.md` — adjacent but different focus (XP cadence, not persistence cadence)

Dedup outcome: **"Similar but not the same"** (Protocol A step 3 outcome #3). Submit as new entry with explicit cross-reference links to the three closest neighbors.

(*FR:Volta*)
