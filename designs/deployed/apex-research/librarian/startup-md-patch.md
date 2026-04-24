# startup.md patch — Step 8 spawn-block extension + Step 5 wiki note + Step S4 git-add

**Target file (in apex-research repo):** `teams/apex-research/startup.md`

**Author:** (*FR:Brunel*) — drafted 2026-04-13

This patch extends the existing 4-agent spawn block in Step 8 to include
Eratosthenes (spawned FIRST so his inbox exists before any specialist can
submit), adds a pane-split prerequisite, adds a wiki-bootstrap check, and
extends the shutdown procedure's git-add list.

All changes preserve existing content — new lines are additive or replace
existing lines in-place.

---

## First-deployment shortcut (2026-04-13 update)

**Schliemann pre-created pane %5 in the running session.** Verified live:
`tmux list-panes -t apex-research` shows %5 at index 5, title `apex-research`,
running a fresh bash shell. The idempotent guard in Change 1 detects this
correctly and would skip the split — verified by simulating the conditional
against the live pane list.

**For the first-deployment in-session integration**, Schliemann does NOT
need to run the pane-split block. Pane %5 already exists. He only needs:

1. `cd ~/workspace && git pull` (lands the repo-side changes)
2. `bash ~/workspace/.claude/spawn_member.sh --target-pane %5 eratosthenes`

Steady state (future cold restarts of the container) still needs the
pane-split block from Change 1 — that is why the conditional remains in
the patch. The block is permanent; the shortcut is first-deployment-only.

**Cosmetic note:** Schliemann set the pane title to `apex-research` rather
than `eratosthenes`. Not load-bearing — spawn_member.sh does not read pane
titles — but once Eratosthenes is spawned, his pane will display
`apex-research` in tmux's status bar instead of `eratosthenes`. If we want
to fix this before spawning, add one line:

```bash
tmux select-pane -t %5 -T eratosthenes
```

This is a one-line cosmetic patch Schliemann can run before the spawn_member.sh
command. Optional.

---

## Change 1 — Step 8: Add pane-split prerequisite before the spawn commands

### Before (Step 8, first spawn command in the bash block)

```bash
bash ~/workspace/.claude/spawn_member.sh --target-pane %1 champollion
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %2 nightingale
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %3 berners-lee
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %4 hammurabi
# wait for intro message
```

### After

```bash
# Prerequisite: ensure a pane exists for Eratosthenes. On cold start the
# tmux layout has 5 panes (%0-%4); the librarian gets a 6th pane.
# If pane %5 does not already exist, split the bottom pane:
if ! tmux list-panes -t apex-research -F '#{pane_id}' | grep -q '^%5$'; then
  tmux split-window -t apex-research -v -l '20%' -c "$HOME/workspace"
  tmux select-pane -t apex-research -T "eratosthenes"
fi

# Spawn Eratosthenes FIRST, before any data-pipeline agent.
# Reason: specialists may submit patterns/gotchas to him during their own
# intro/first-task cycle. If his inbox doesn't exist (he isn't registered
# yet), submissions are lost — there's no retry mechanism. Spawning him
# first guarantees the inbox exists before any specialist comes online.
bash ~/workspace/.claude/spawn_member.sh --target-pane %5 eratosthenes
# wait for intro message

bash ~/workspace/.claude/spawn_member.sh --target-pane %1 champollion
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %2 nightingale
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %3 berners-lee
# wait for intro message
bash ~/workspace/.claude/spawn_member.sh --target-pane %4 hammurabi
# wait for intro message
```

**Pane-ID robustness note:** the hardcoded `%5` assumes tmux hands out the next
sequential ID. If the container has had other panes created and killed, the
newly-split pane may get a different ID. If that happens, Schliemann can
replace `%5` with `$(tmux list-panes -t apex-research -F '#{pane_id}' | tail -1)`
to grab the most recently created pane. Future hardening: have spawn_member.sh
accept `--split-and-target` and handle this internally. Deferred for now.

---

## Change 2 — Step 8: Update the verify checks

### Before

```markdown
**Verify (two checks):**

1. `tmux list-panes` still shows exactly 5 panes (no duplicates)
2. No `name-2` entries in `config.json`
```

### After

```markdown
**Verify (two checks):**

1. `tmux list-panes` shows exactly 6 panes (the 5 pre-existing + Eratosthenes, no duplicates)
2. No `name-2` entries in `config.json`
```

---

## Change 3 — Step 5 (Restore inboxes): Add wiki-bootstrap check

Insert **after** the existing "Restore inboxes from repo" block in Step 5.

```markdown
**Wiki bootstrap check (first session only):**

```bash
WIKI_DIR="$REPO/teams/apex-research/wiki"
if [ ! -f "$WIKI_DIR/oracle-state.json" ]; then
    echo "WARNING: wiki not bootstrapped — Eratosthenes will fail to start"
    echo "Expected: $WIKI_DIR/oracle-state.json"
    echo "Fix: git pull (bootstrap is committed in the repo)"
fi
```

**First session:** If the wiki is present, Eratosthenes has something to curate
into. If it's missing, `git pull` — it's committed to the repo, not generated.
```

---

## Change 4 — Step S4 (Persist inboxes + commit): Add wiki/ to git-add list

### Before

```bash
cd "$REPO"
git add teams/apex-research/memory/
git add teams/apex-research/inboxes/
git add inventory/ shared/ specs/ decisions/
git commit -m "chore: save apex-research session state"
git push
```

### After

```bash
cd "$REPO"
git add teams/apex-research/memory/
git add teams/apex-research/inboxes/
git add teams/apex-research/wiki/
git add inventory/ shared/ specs/ decisions/
git commit -m "chore: save apex-research session state"
git push
```

---

## Change 5 — Read Order table: Add oracle-state.json (optional)

This change is **optional** — it tells team-lead about the wiki but is not
load-bearing. Keeps the Read Order table consistent if Schliemann wants to
verify wiki integrity at startup.

### Before (Read Order table)

```markdown
| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, data flow, directory ownership, TDD mandate |
| 4 | `memory/schliemann.md` | Your prior session's decisions, WIP, warnings |
```

### After

```markdown
| # | File | Why |
|---|---|---|
| 1 | **This file** (`startup.md`) | Paths, procedures, gotchas |
| 2 | `roster.json` | Team members, models, roles |
| 3 | `common-prompt.md` | Mission, data flow, directory ownership, TDD mandate |
| 4 | `memory/schliemann.md` | Your prior session's decisions, WIP, warnings |
| 5 | `wiki/oracle-state.json` | Librarian state (entry counts, last activity) — verify exists |
```

---

## Notes for reviewers

- **Pane-split is conditional** — idempotent on warm starts (if %5 already exists, skip). Running the block twice is safe.
- **Eratosthenes spawns FIRST, before the data pipeline** — reversed from my initial draft after Celes flagged the inbox-existence concern. The platform creates inbox files at agent registration time (verified live: each registered agent has a `<name>.json` file under `inboxes/`). If a specialist tries to send a knowledge submission before Eratosthenes is registered, his inbox file does not exist and the message is lost — no retry mechanism. Spawning him first guarantees the inbox exists before any specialist comes online and starts producing patterns/gotchas. Trade-off: Eratosthenes initializes against a partially-populated `config.json` and must accept that team composition becomes visible incrementally as specialists register. He can re-query later via Protocol B if needed.
- **No change to Phase 1 First Session Checklist** — intentional. Eratosthenes has nothing to curate until specialists produce patterns/gotchas/decisions worth capturing. First session: Eratosthenes spawns first, reads startup.md + common-prompt.md + librarian prompt + empty wiki, sends intro to Schliemann, stands by while specialists come online.
- **Filename inconsistency `oracle-state.json`** — intentional per team-lead's Pass 1 decision. Machine identifiers stay as "oracle" until Pass 2 renames them alongside `filed-by: oracle` and `agentType: "oracle"`. The role-facing language (Librarian, Eratosthenes) is already consistent.
- **Step 5 wiki check is advisory, not blocking** — a missing wiki is a warning, not a hard stop. If Schliemann sees the warning he runs `git pull` and retries. Avoids bricking the team startup if the wiki ever gets clobbered.

(*FR:Brunel*)
