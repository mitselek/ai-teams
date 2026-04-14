# Persist Coverage Audit — 2026-04-14

**Target:** v0.3 (`docs/persist-coverage-design-v0.3.md`) — four scripts + `protocol-a-submission-draft.md`
**Audit date / author:** 2026-04-14 (*FR:Volta*)
**Summary:** Readiness assessment — 4 scripts, mitigation choice, protocol-a draft disposition, 4 structural-discipline flags.

---

Readiness assessment — persist/restore WIP script audit. Read-only pass, no edits, no runs, no wiki writes. Read list completed in order: Cal's gotcha (blocking prerequisite), sibling gotcha dual-team-dir-ambiguity, v0.1→v0.2→v0.3 design evolution, protocol-a-submission-draft.md, all four scripts, plus sibling `persist-inboxes.sh` for contract cross-read.

---

## 1. Per-script verdict

### `persist-project-state.sh` — **ship with 2 changes**

Against v0.3 spec: aligned on mirror semantics, marker-primary discovery, `--dry-run` arg, count verification. Small POSIX-hygiene upgrade vs. the v0.3 prose (uses `tr -d '[:space:]' < "$MARKER_FILE"` instead of `cat | tr`) — that's design-drift in the right direction, keep it.

**Required changes before ship:**

- **(a) Mitigation from Section 2 below.** The substrate-mismatch defect is in this script's body — the fix lands here.
- **(b) Add `trap` for dest-wipe atomicity.** Current script runs `find ... -delete` then `cp` in a loop. If the cp loop fails midway (disk full, permission), the dest dir is left half-wiped AND half-filled — worse than either starting state. Wrap the wipe-then-copy in a two-stage commit: copy into a sibling temp dir, then atomic-rename over the old one. Or at minimum, trap EXIT and restore a .bak if the main body exits non-zero. Not a blocker for framework-research scale (35 small files) but is a real latent failure mode per the script's own mirror-semantic contract.

### `persist-session-logs.sh` — **ship with 1 change**

Against v0.3 spec: aligned on argument parser, marker discovery, MANIFEST generation, hyphen-safe tar with `./` prefix, age-floor retention (`find -mtime +7`), `--dry-run`. The `trap` on line 45 → line 101 chain correctly replaces the earlier cleanup with the wider one; no dangling-tempdir risk on success. Good.

One minor v0.3-vs-actual drift I caught and that's harmless: v0.3 Section "Script designs" shows a `PRUNE_COUNT` accumulator inside the while loop subshell — the actual script correctly drops that variable (shell subshell wouldn't have propagated the value anyway). Actual code is the right version. v0.3 doc should be patched to match on next spec revision, but that's design-doc hygiene, not a script fix.

**Required change before ship:**

- **(a) Same mitigation from Section 2 below.** Same substrate hazard — this script also materializes per-operator session transcripts. Host-side destination (`$HOME/.claude-session-backups/...`) is outside the repo, so Cal's specific gotcha (leak-to-shared-repo) doesn't apply DIRECTLY. BUT it does cross an operator-vs-team blast-radius boundary — a workstation operator running this script on a shared team repo substrate writes their personal session transcripts to a host-side dir keyed only by `<team>/`, and the next operator on a second workstation has no visibility. That's a different defect surface (not the leak, but cross-operator tarball collision/ambiguity). Whatever guard gets chosen for persist-project-state.sh should apply here too — the scripts should share a single substrate-check helper, not each roll their own.

### `restore-project-state.sh` — **ship as-is**

Against v0.3 spec: aligned on merge semantics (not mirror — asymmetric and correct per v0.2 rationale), marker discovery, `--dry-run`. Correctly no-ops on cold start (no repo `project-memory/` dir). The merge semantic is the right call — v0.2 section "Restore is NOT mirror-semantic" justified it and v0.3 didn't re-open the decision.

Observation (not a blocker): restore will run on every `TeamCreate` bootstrap even on workstations where persist was guarded off, because this script doesn't apply the same substrate check. On a workstation with no `project-memory/` in the repo, it cleanly no-ops. On a workstation that pulled `project-memory/` committed by a different operator (hypothetically — this cannot happen if the mitigation is in place), it would write another operator's state onto this operator's `~/.claude/projects/<slug>/memory/`. The guard on the PERSIST side is load-bearing enough that the RESTORE side doesn't need its own — if persist is blocked, no rogue content ever gets into the repo to be restored. Symmetric guarding is belt-and-braces but costs real complexity. Not recommended.

### `restore-session-logs.sh` — **ship as-is**

Manual-only, no automation path, operator explicitly confirms extraction. MANIFEST display before confirmation is the right UX. `--dry-run` wired correctly, mixed positional+flag arg parser handles both orders. Hyphen-safe via `cd $HOME/.claude/projects` before `tar xzf`. Nothing drifted from v0.3.

---

## 2. Chosen mitigation — **(c) target-dir refusal, single-helper**

Pick: **option (c), target-dir refusal — implemented as a shared helper used by both persist scripts.** Not layered with (b). Not (a).

**Why (c) over (a):**

- Option (a) (container-only runtime guard via `/.dockerenv` or a planted marker) is the strongest GUARANTEE but requires a cross-team invariant — every container entrypoint has to plant the sentinel, every workstation has to NOT have it. One container-entrypoint script that forgets to plant the sentinel silently opens the defect back up. That's the exact "cross-team invariant with no enforcement mechanism" failure mode I rejected in v0.1 for env-var-primary cwd discovery. Rejecting it here for the same reason.
- Option (c) detects the actual invariant we care about: "is this script writing into a git-tracked path?" That's the ground-truth version of the substrate question, not a proxy for it. It works on any substrate without any advance setup.

**Why (c) over (b):**

- Option (b) (`.gitignore` entry) catches the leak at the git layer but — as Cal explicitly notes in his gotcha — leaves the files on disk where `git status` ignores them but the next operator sees them in `ls` output and gets confused. It also fails-open: `git add -f project-memory/` or a future operator editing `.gitignore` reopens the hole silently. The defect has to be refused at the write site, not suppressed at the git layer.
- Also: (b) only covers the narrow two-path case (`project-memory/` + `.project-dir-name`). (c) automatically covers any future artifact any future persist script tries to write to a repo-tracked location. It's the general form.

**Why NOT (a)+(b) layered:**

- Layering two defenses where the primary is already ground-truth doesn't buy blast-radius protection proportional to the complexity cost. Two mechanisms means two places to maintain, two places a future operator can misconfigure, two test surfaces. One correct check at the right layer is better than two partial checks at the wrong ones.

**Implementation sketch (for the ship session — NOT committing now):**

Add a shared helper `_substrate-check.sh` (sourced by both persist scripts) with one function:

```bash
refuse_if_target_in_git_tracked_tree() {
  local target="$1"  # absolute path the script intends to write to
  local target_dir target_git_toplevel
  target_dir="$(dirname "$target")"
  target_git_toplevel=$(git -C "$target_dir" rev-parse --show-toplevel 2>/dev/null || true)
  if [ -n "$target_git_toplevel" ]; then
    # Target is inside a git working tree. Check if specifically ignored.
    if git -C "$target_dir" check-ignore -q "$target" 2>/dev/null; then
      return 0  # explicitly ignored by .gitignore — user has opted in
    fi
    echo "ERROR: refusing to write to git-tracked path: $target" >&2
    echo "ERROR: this script mirrors per-operator state and must not write into shared repos." >&2
    echo "ERROR: resolved git toplevel: $target_git_toplevel" >&2
    exit 3
  fi
  # target is outside any git working tree — safe
  return 0
}
```

Called from `persist-project-state.sh` with `$REPO_PROJECT_MEMORY` and from `persist-session-logs.sh` with `$BACKUP_DIR` (the latter will almost always pass because `$HOME/.claude-session-backups/...` is outside the repo, but the check is cheap and catches operators who override `SESSION_BACKUP_DIR` to something clever and wrong).

**The `git check-ignore` escape hatch is deliberate.** A team that genuinely operates in container-only substrate (uikit-dev, cloudflare-builders) can add `project-memory/` to their team-local `.gitignore` as an OPT-IN signal that says "yes, we know this is in a git tree, we intend the mirror, git won't track it anyway." On a workstation shared team repo where `.gitignore` does NOT cover `project-memory/`, the script refuses. That inverts the (b) option's fail-open into a fail-closed with explicit opt-in.

**Trade-off I weighed:** (c) + git-check-ignore opt-in is slightly more complex than a flat refuse. But without the opt-in, container teams with their team repo in git (which is the common case — they all have team-configs committed to repos) would be BLOCKED by the guard. The opt-in lets them assert "this specific path is intended as a mirror destination, treat it as safe substrate." That's the correct semantic.

**Cost:** one helper file, ~15 lines, sourced by both persist scripts. Zero runtime cost on container substrate (opt-in passes fast). Clear loud refusal on workstation substrate.

### Ship-session flag added post-audit (team-lead 2026-04-14 12:54)

**Repo-root `.gitignore` footgun.** A future operator who doesn't understand the semantic could add `project-memory/` to the TOP-LEVEL repo `.gitignore` to "silence the warning," which would satisfy `git check-ignore` and open the leak back up. Thin risk (requires affirmative action and some context) but real.

- Helper comment block must call out that the opt-in is intended to be **team-local** (`.claude/teams/<team>/.gitignore` or similarly narrow-scope), NOT repo-root.
- Defensive check in the helper: verify the path that `git check-ignore` matched against is NOT at git-toplevel (i.e., the ignore pattern must live inside the team dir, not at repo root). Flag for ship session, do not implement now.

---

## 3. `protocol-a-submission-draft.md` decision

**What it is:** Volta's draft Protocol A knowledge submission to Callimachus, co-signed by Brunel, for filing the "persist-coverage-extension" pattern in `wiki/patterns/`. Already cross-read against Cal's prompt (confidence enum, scope enum, type enum, related-links dedup pre-check all done). Status field: "do NOT send until field-test on uikit-dev complete." Per team-lead directive Q5 in v0.3, the submission timing is post-field-test.

**Intended recipient:** Callimachus (the Librarian). Routing per the common-prompt dual-hub rule: knowledge submissions bypass team-lead and go direct to Cal via SendMessage Protocol A format.

**Should it go out?** **No — hold. But it is NOT stale; do NOT delete.** Three reasons:

1. The field-test prerequisite hasn't fired yet. Per v0.3 sequence, submission fires only after Brunel ships to uikit-dev and Aalto runs a shutdown-restore cycle with empirical results. That hasn't happened (framework-research is in pivot/on-demand mode, uikit-dev is the current focus team but no shutdown cycle has occurred with these scripts).
2. The submission body references specific `[TBD]` evidence fields (field-test date, discovery-method-observed, uikit-dev-specific gotchas) that cannot be filled in until that run happens.
3. **New information from this audit:** once the mitigation from Section 2 ships, the submission body changes shape. It's currently framed as a pure extension pattern — "here's how to cover the 4 lifecycle state locations." With the substrate hazard + target-dir refusal helper, the pattern now also includes "and here's why persist scripts with mirror semantics must refuse to run against git-tracked substrate unless explicitly opted-in." That's a companion gotcha class that either goes into the same pattern submission as a sibling section, or gets filed as a separate gotcha/contract. Cal's dedup protocol decides the shape. The draft needs a revision pass before sending regardless of field-test timing.

**Recommended disposition:**

- Keep the file at its current path.
- Add a `[DEFERRED]` annotation at the top or a STATUS UPDATE section below the existing status block that says: "v0.3 substrate-hazard mitigation must be integrated into submission body before sending. Draft is pre-mitigation and would ship an incomplete pattern."
- Actual annotation happens in the ship session, not this one.

**Channel (when it does ship):** via SendMessage directly to `callimachus`, with Brunel named in the `From:` field. Per common-prompt.md dual-hub rule, Protocol A submissions do NOT route through team-lead. The draft's Coordination section already has this right.

---

## 4. Structural-discipline flags

Four items. Two are hard defects, two are softer drift observations.

### Flag 1 — **Gate 4 (path-resolution) latent hit: `persist-inboxes.sh` references `$TEAM_DIR`-relative paths but v0.3 skill patches use `$TEAM_DIR` unresolved**

The v0.3 skill-integration patches (docs/persist-coverage-design-v0.3.md lines 260 and 280) show shell snippets like `bash "$TEAM_DIR/persist-inboxes.sh" "<agent-name>"` — but `$TEAM_DIR` is ambiguous per Cal's sibling gotcha `dual-team-dir-ambiguity.md`. Two valid readings: `$HOME/.claude/teams/<team>/` (runtime, ephemeral) and `$REPO/.claude/teams/<team>/` (durable). The scripts live in the REPO path (that's where we committed them), not the runtime path. If the shutdown skill file uses `$TEAM_DIR` meaning the runtime dir, the path resolves to a location where the scripts DON'T exist — skill invocation fails silently.

**Recommendation for ship session:** v0.3 skill patches must either (a) use a concrete anchor like `$REPO/.claude/teams/<team>/` in the bash snippet, or (b) declare a leading "Path Convention" section in each skill file naming which root `$TEAM_DIR` resolves to. This is exactly the fix pattern from `dual-team-dir-ambiguity.md` — the skill files are downstream consumers of the same ambiguity, not immune to it. Sibling gotcha becomes directly applicable.

**Post-audit note (team-lead 12:54):** this is substrate-invariant-mismatch n=3 territory. Cal has a pattern candidate queued; Flag 1 becomes supporting evidence. Team-lead will relay on the pattern drafting session. Volta does NOT submit directly.

### Flag 2 — **Gate 2 (producer↔consumer cross-read) latent hit: protocol-a draft asserts implementation file sizes that no longer match live files**

Protocol-a-submission-draft.md lines 61-64 assert specific file sizes (e.g. "persist-project-state.sh — 2997 bytes", "persist-session-logs.sh — 4691 bytes"). These are claims about the producer artifact (the scripts) from the consumer artifact (the submission body). If the scripts get any edits before submission — and they will, per Section 1 and Section 2 of this report — those byte counts become stale. Not a fatal typed-contract violation (wiki submissions aren't parsed), but it's the EXACT shape of the problem Gate 2 catches: a document stores a fact about another document, the other document changes, the first document silently decays. Recommend stripping absolute byte counts from the submission body and replacing with structural claims ("four scripts, each with `--dry-run` support") that don't need byte-level maintenance.

### Flag 3 — **Gate 4 (artifact existence) hit: v0.3 says framework-research marker file will be created during implementation; it does not exist today**

v0.3 says (line 24) "Framework-research marker content: `C--Users-mihkel-putrinsh-Documents-github` (verified from live project dir enumeration)." And the scripts reference `$MARKER_FILE="$SCRIPT_DIR/.project-dir-name"`. But `.project-dir-name` does NOT exist in the repo today (Cal's gotcha confirms team-lead deleted it alongside the leak — that's what unlocked this whole audit). So if someone runs any of the four scripts as-is on framework-research substrate, they'd fall through to the computed-fallback path with a warning, then fail at the git-toplevel sanitization mismatch (v0.2 "What v0.1 got wrong" section documents exactly this — git-toplevel is `.../mitselek-ai-teams` which sanitizes to `C--Users-...-mitselek-ai-teams`, which is the WRONG project dir name). Net result: computed-fallback exits cleanly (no such dir) and the operator sees a warning they might not understand.

**Recommendation for ship session:** the marker file re-creation is a deliverable, BUT it must land behind the mitigation from Section 2. If the mitigation is the target-dir refusal helper, the marker file is safe to commit because the refusal stops the write side regardless. Without the mitigation, re-creating the marker would re-enable the exact defect Cal filed. Order matters: mitigation first, marker file second, both in the same ship session.

**Post-audit note (team-lead 12:54):** ordering is load-bearing — captured as ship-session invariant. Order violation re-enables the exact defect Cal filed.

### Flag 4 — **Drift observation (NOT a gate hit): v0.3 prose in Skill integration section uses `<agent-name>` placeholder unclearly**

Not a hit — the `/shutdown` skill patches in v0.3 Section "Skill integration" use `"<agent-name>"` as a literal placeholder in the bash snippet (line 261). A skill file author copy-pasting that literally gets a broken invocation. Minor prose hygiene, worth fixing in v0.4 or whenever skill patches actually get written. Not a blocker.

---

## Summary

Four scripts audit as: 2× "ship with 1-2 changes" (both persist scripts, both require the Section 2 mitigation, `persist-project-state.sh` also wants atomic wipe-then-copy), 2× "ship as-is" (both restore scripts). Protocol-a draft is correctly held pending field-test, but needs a pre-mitigation STATUS UPDATE + a post-mitigation revision pass before sending. Four structural-discipline flags, two of which block the ship session: the `$TEAM_DIR` ambiguity in skill patches (Flag 1) and the marker-file-before-mitigation ordering hazard (Flag 3).

Mitigation choice: **(c) target-dir refusal with `git check-ignore` opt-in, implemented as a shared helper sourced by both persist scripts.** Not layered with (b). Not (a).

No scripts edited. No scripts run (not even dry-run). No wiki writes. No commits. Nothing staged. Task #2 → completed.

(*FR:Volta*)
