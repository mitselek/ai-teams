# tmux-spawn-guide.md patch — extend pane map to 6 agents

**Target file (in apex-research repo):** `teams/apex-research/tmux-spawn-guide.md`

**Author:** (*FR:Brunel*) — drafted 2026-04-13

I originally wrote this file (*FR:Brunel* attribution). This patch extends it
to cover Eratosthenes as the 6th team member in the tmux session.

---

## Change 1 — Pane Map table: Add row for eratosthenes

### Before

```markdown
## Pane Map

Pane IDs are in /tmp/apex-research-panes.env:

| Pane | Agent       | ID |
|------|-------------|----|
| Left | team-lead   | %0 |
| R1   | champollion | %1 |
| R2   | nightingale | %2 |
| R3   | berners-lee | %3 |
| R4   | hammurabi   | %4 |
```

### After

```markdown
## Pane Map

Pane IDs are in /tmp/apex-research-panes.env:

| Pane | Agent        | ID |
|------|--------------|----|
| Left | team-lead    | %0 |
| R1   | champollion  | %1 |
| R2   | nightingale  | %2 |
| R3   | berners-lee  | %3 |
| R4   | hammurabi    | %4 |
| R5   | eratosthenes | %5 |

**Note on %5:** On the running session at first deployment, pane %5 already
exists (Schliemann pre-created it before deployment). On future cold restarts
of the container, pane %5 needs to be split fresh — the startup procedure
does this idempotently via a guard in Step 8 (skip if %5 exists, split if not).
```

---

## Change 2 — Spawning Agents section: Add eratosthenes to the spawn sequence

### Before

```markdown
Use spawn_member.sh from the Bash tool (run these one at a time, wait for intro before next):

    bash ~/workspace/.claude/spawn_member.sh --target-pane %1 champollion
    bash ~/workspace/.claude/spawn_member.sh --target-pane %2 nightingale
    bash ~/workspace/.claude/spawn_member.sh --target-pane %3 berners-lee
    bash ~/workspace/.claude/spawn_member.sh --target-pane %4 hammurabi
```

### After

```markdown
Use spawn_member.sh from the Bash tool (run these one at a time, wait for intro before next):

    bash ~/workspace/.claude/spawn_member.sh --target-pane %5 eratosthenes
    bash ~/workspace/.claude/spawn_member.sh --target-pane %1 champollion
    bash ~/workspace/.claude/spawn_member.sh --target-pane %2 nightingale
    bash ~/workspace/.claude/spawn_member.sh --target-pane %3 berners-lee
    bash ~/workspace/.claude/spawn_member.sh --target-pane %4 hammurabi

**Spawn order note:** Eratosthenes is the librarian (knowledge hub) and is
spawned FIRST so his inbox file exists before any specialist comes online.
Specialists may submit knowledge items during their own intro/first-task cycle;
if his inbox doesn't exist when they send, the message is lost (no retry).
Apart from that single ordering constraint, his work has no data dependency
on the Champollion → Nightingale → Berners-Lee → Hammurabi pipeline — they
spawn in their normal data-pipeline order after him.
```

---

## Notes for reviewers

- **Column width adjustment** — the Agent column widens from 13 to 14 chars to fit `eratosthenes` without breaking the markdown table. Pure cosmetic.
- **The "Recreating a Lost Pane" section at the bottom of the file** already has a generic template that works for Eratosthenes — no change needed there.
- **The "Manual Spawn" section** shows the `champollion` example — I'm deliberately NOT adding an eratosthenes version. One example is enough; the pattern is obvious.

(*FR:Brunel*)
