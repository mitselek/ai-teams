# First tasks -- `joosep` container

Tere, Joosep. This container starts **deliberately under-credentialled**: it has no GitHub token and no
Atlassian access. That is not an oversight — provisioning your own credentials is the first real job for
you and your agents, so the things this team can reach are things *you* granted it, under *your* name.

Work these in order. Each has a **verify** step; do not move on until it passes.

---

## Task 0 — Claude login (you, once, before anything else)

Nothing below works until Claude is authenticated.

```bash
claude
```

Follow the OAuth device flow in your own browser. Credentials land in the `joosep_home` volume and
survive restarts and rebuilds — you will not repeat this.

**Verify:** `claude --version` prints a version, and a `claude` session starts without prompting to log in.

---

## Task 1 — Create the GitHub PAT

A **fine-grained** personal access token on your own account (`JoosepM-565`).

**Exact scope — no wider:**

| Setting | Value |
|---|---|
| Resource owner | `Eesti-Raudtee` |
| Repository access | **Only select repositories** → `HES-integration-tests`, `rumba` |
| Repository permissions | **Contents: Read-only**, **Metadata: Read-only** (metadata is mandatory and auto-selected) |
| Everything else | leave at **No access** |
| Expiration | pick a date you will actually renew; note it somewhere |

**Deliberately NOT granted, and each for a reason:**

- **No write/push anywhere.** `HES-integration-tests` accepts direct-to-`main` pushes with no PR
  history — *the absence of a guardrail is not permission*. You are not a member of
  `vjs-code-reviewers`, the separately-gated team that can approve merges, so this team must not be
  given a path that lets it merge. **The team must not exceed its principal.**
- **No `workflow` scope.** It would let an agent edit CI definitions.
- **No org or admin permissions.**
- **Only two repos**, even though your org teams grant reach to 40+. These are the two you have
  actually committed to. Widen later against a named need, not in advance.

**Install it:** the token goes in `.env` **on the host**, not inside this container. Send it to Mihkel
over a channel you would use for a password, and he will add `GITHUB_TOKEN=...` and run
`./joosep.sh restart`. The repos then clone automatically on that boot — no rebuild.

**Verify (after the restart):**

```bash
gh auth status
ls ~/work/           # expect: HES-integration-tests  rumba
git -C ~/work/rumba log --oneline -3
```

Also confirm the ceiling actually holds — a scope that is wider than intended is the failure worth
catching now rather than later:

```bash
gh repo view Eesti-Raudtee/vjs_apex_apps 2>&1 | head -2   # expect: an error / not accessible
```

---

## Task 2 — Authenticate the EVR Atlassian connector

This replaces API tokens entirely — there is no Atlassian secret anywhere in this container, and there
should never be one. The connector covers **both Jira and Confluence** under your own account, so your
own permissions apply and every action is attributed to you.

> **The exact install/enable command depends on how the EVR connector is distributed, and I have not
> verified it from inside a container. Ask Mihkel for the precise step rather than guessing** — a
> wrong guess here can leave a half-configured MCP entry that fails in confusing ways. What follows is
> the shape and, more importantly, the verification.

Once it is connected, expect Atlassian tools to be available in your Claude session (the
`atlassianUserInfo`, `getVisibleJiraProjects`, `getConfluenceSpaces` family).

**Verify — three checks, all cheap:**

1. **Identity:** `atlassianUserInfo` returns **your** account, not a shared one.
2. **Jira by key, not display name:** `getVisibleJiraProjects` includes `VJS1`, `VEO`, `HES`, `PONY`,
   `FSM`, `D365`. **Note `VEO` displays as "VJS2"** — always grant and query by the *key*.
3. **Confluence:** `getConfluenceSpaces` includes `VJS2`. This is the check that proves the connector
   did something a Jira-only setup could not.

**A property worth internalising before you use it:** your credential sees a *different* slice of
Jira/Confluence than Mihkel's. **An empty result from a search you run is not evidence that the thing
does not exist** — it may only be evidence that it is not visible to you. When a search comes back
empty and the answer matters, say "not visible to this account" rather than "does not exist".

---

## Task 3 — Verify the container itself

```bash
type -a claude          # expect exactly ONE path, under ~/.local/bin
tmux ls                 # from a plain shell: no session (that is correct)
cat ~/FIRST-TASKS.md    # this file — edit it freely, it is yours now
```

The two connection modes, which are the point of the setup:

- `Connect-Joosep` → a plain shell. Good for git, file work, poking around.
- `Connect-Joosep -Session` → attached to your running Claude session. `Ctrl-b d` detaches and
  **leaves Claude running**; closing the terminal does the same. Reconnect and the conversation is
  where you left it.

If `type -a claude` ever shows **two** paths, stop and tell Mihkel — it means a second install crept in,
and which version you get will then depend on how you logged in.

---

## Task 4 — Team roster (after 1–3 pass)

The role set is still an open decision (seven candidates against a six-role reference shape), so this
task starts with a conversation rather than a config file. Bring to it: which of the three registers of
your work the team should serve first — E2E test automation, the SvelteKit/Worker service build, or
release reporting.

Two things your team's prompts must encode from day one, both learned the hard way:

1. **`gh search` only indexes DEFAULT branches.** It demonstrably missed 14 of your 67 commits during
   the research that shaped this container. Any tooling that surveys activity must enumerate branches
   via `repos/{owner}/{repo}/branches` then `commits?sha=<branch>`.
2. **Hygiene findings are reported, never applied.** The roll-up touches five projects you do not own.
   Bulk-editing another project's Fix Versions or due dates is the single most plausible way this team
   causes an incident.

---

## The one hard safety rule

**No write path to any VJS / HES / PONY runtime or test environment, and no ability to send messages
into them.**

The Elron/PONY message tooling can emit traffic into a **live railway dispatch system**. The reserved
train ranges (4020-4029, 4040-4049, 4120-4129, 4140-4149) exist because collision with real train
numbers is the failure mode.

**Do not rely on an `isTest` flag — it no longer exists.** Commit `39f16a83` (2026-08-26) removed the
toggle and hidden field, and the server now always sends `isTest=false`. Anything written against that
flag describes a protection that is hard-coded to the unsafe value. The as-built guardrail is
**TEST-endpoint-only routing**, and it holds only while the endpoint URL is **not configurable from
inside this container**. Do not add one, and do not reference `isTest` in any prompt, roster, or policy
file here.

Everything else this container withholds (no Docker socket, no Cloudflare credentials, no other team's
volumes, no shared credential store) is blast-radius reduction. **This one is different in kind: it is
the only real safety control in the design.**

---

*Prepared by (\*FR:Brunel\*) for the joosep container, 2026-08-28. This file is yours — edit it as you
work. A pristine copy stays at `/opt/FIRST-TASKS.md`; a rebuild will not overwrite your version.*
