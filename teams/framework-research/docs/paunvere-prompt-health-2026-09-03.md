# `paunvere` prompt-layer health check, as deployed (*FR:Celes*)

**Date:** 2026-09-03 (FR S72). **Requested by:** PO, via Aen. **Scope:** the deployed prompt layer at
`designs/deployed/joosep/`, read-only. **Author:** (*FR:Celes*), who designed this team in S66/S67.

## Verdict

**HEALTHY-WITH-FIXES.** The prompts are well-grounded — every rail claim cites a real file, symbol or
commit, the least-privilege story is argued rather than asserted, and the pull-based dispatch loop
(`startup.md:34`, "Wait. Do not auto-spawn.") makes a one-person team safe to leave alone. The defects
are of two kinds and neither needs a rework: **(a) a withdrawn authority gate that was removed from the
design of record on 2026-08-31 but survives verbatim in six places, including one prompt that now
contradicts itself on the highest-consequence path**, and **(b) a missing procedure — nowhere in the
package does an agent learn what to *do* when it hits a permission wall.** The regime the PO asks about
is survivable; what is missing is the shape of the escalation, not the escalation policy.

Nine fixes now, seven to watch.

---

## FIX NOW

### 1. Saxby is told both "Joosep decides" and "not on Joosep's word"

**`prompts/saxby.md:11`** — "routing changes are **Joosep's decision as the app's owner** (he consults
Ruth Türk when in doubt) and are applied by humans, never by agents."

**`prompts/saxby.md:15`** — "'Joosep asked for it' does not clear the signal; only the documented
sign-off does."

**`prompts/saxby.md:46`** — "Clear a routing change on anyone's word but the documented sign-off. **Not
Joosep's**, not Minot's, not Mihkel's alone."

Under the amended regime (`common-prompt.md:18`, PO 2026-08-31, VEO-181 comment 243424) Joosep **is**
the decider. Saxby's own prompt therefore instructs him to refuse his principal's decision, and the
term that is supposed to resolve it — "the documented sign-off" — is defined nowhere in the package
after the gate was withdrawn. This is the sharpest paralysis generator in the deployment, and it sits on
the one path where a stall is expensive: the rail warden either blocks the app's owner or quietly
decides the line is stale and ignores it. Both outcomes are bad, and the second is worse.

**Smallest fix** — replace `saxby.md:46` with:

> - Apply a routing change yourself, or ask a builder to. The decision is Joosep's as the app's owner;
>   your job is to STOP the diff, state in writing that it is a routing change, and record it in the
>   rail register. When Joosep decides to make one, it is applied by a human outside this team, and you
>   note the decision and who made it — you do not implement it and you do not clear it as review.

and `saxby.md:15` to:

> - **Refuses by construction.** You do not apply the rail change and you do not clear one as review,
>   whoever asks. "Joosep asked for it" makes it his decision to carry out by hand; it does not make it
>   your diff. You say so kindly and once.

### 2. The withdrawn Ruth Türk gate survives in six places

The design of record closed this on 2026-08-31 (`teams/paunvere/README.md:88`): the "Ruth signs off via
the PO" gate was **withdrawn**; Joosep decides, consulting Ruth when in doubt. `common-prompt.md:18`
and `:46` and `saxby.md:11`/`:22`/`:28` carry the amended wording. These do not:

| File:line | Stale text |
|---|---|
| `roster.json:4` (`_principal`) | "Ruth Türk ... the **sign-off authority** for any change to the message-centre endpoint routing" |
| `roster.json:60` (saxby `significance`) | "no diff that touches them clears **without Ruth Türk's sign-off, mediated by Mihkel**" |
| `prompts/minot.md:26` | Mihkel is "**the only route to Ruth Türk for a routing change**" |
| `prompts/minot.md:27` | Ruth: "sponsor; **sign-off on routing changes**" / "never directly -- through Mihkel, via Joosep" |
| `prompts/trevithick.md:39` | rail files editable "only under a Saxby-cleared, **Ruth-signed** routing change" |
| `prompts/trevithick.md:64` | "A refactor of it is a routing change and **needs Ruth Türk's sign-off through Mihkel**" |

This is precisely the regime the PO flagged. As written, the team believes a four-hop mediator chain
(agent → Saxby → Minot → Mihkel → Ruth) stands between it and a rail change, when the PO removed that
chain five days ago. Nobody can produce a "Ruth-signed" artifact, because no such artifact is defined —
so the escape hatch named in Trevithick's own MAY-WRITE block is unreachable by construction.

**Smallest fix** — one wording, applied six times:
`minot.md:26` → "container problems, `.env` changes, credential installation, and image/restart";
`minot.md:27` → "Ruth Türk | sponsor for release-visibility content | never directly -- Joosep consults
her when he is in doubt about a routing change";
`trevithick.md:39` → "**except** the rail files listed below, which you do not edit at all — a routing
change is Joosep's decision and is applied by a human outside this team";
`trevithick.md:64` → "...Leave it. A refactor of it is a routing change: STOP, tell Saxby and Minot, and
it goes to Joosep as the app's owner.";
`roster.json:4` → "...Ruth Türk (VJS2 group head) is the sponsor for release-visibility content; Joosep
decides routing changes as the app's owner and consults her when in doubt";
`roster.json:60` → "...no diff that touches them clears through this team at all: routing changes are
Joosep's decision, applied by humans."

### 3. No agent is told what to do when it hits a permission wall

The *policy* is stated four times (`common-prompt.md:17`, `:32`, `:56`; `minot.md:61`;
`bradshaw.md:33`). The *procedure* appears nowhere. A grep of the whole team package for
`403|denied|blocked|permission` returns policy prose and not one executable instruction. The five
specialists — the members who will actually meet the wall — have prohibitions and no escalation shape.

Concretely, nothing tells an agent: what to write, to whom, in what fields, and what to do meanwhile.
Trevithick's `git push` will fail with a 403 the first time it runs (task 1's PAT is Contents:
Read-only, by design — `FIRST-TASKS.md:42`). The design *anticipated* that one wall and pre-scripted it
as task 6. Every other wall — Bradshaw needing a seventh Jira project, Rastrick needing `workflow`
scope, Smiles needing a fourth write target, anyone needing a repo that is not one of the two — has no
shape at all, and an agent with sixty prohibitions and no named exit improvises. That is the mechanism
by which a quiet workaround happens, and it is the single highest-value addition to this package.

**Smallest fix** — one new section in `common-prompt.md`, after *Least privilege*, inherited by all six:

> ## When you hit a wall
>
> A wall is any refusal that comes from the access you were given: a GitHub 403, a settings.json deny,
> a branch protection, an Atlassian write you are not scoped for, a project you cannot read.
>
> **Never work around it.** Do not try a second route to the same effect (a different remote, `gh api`
> instead of `git`, asking another member to do it, a new file that does the forbidden thing by another
> name). A wall you route around is a wall Joosep did not agree to remove.
>
> 1. **Stop that step.** Do not retry with a variation.
> 2. **Write the named need** to Minot, in exactly this shape: `NEED: <surface> | <exact scope> |
>    <one repo/project> | <what it unblocks> | <what I did instead meanwhile>`.
> 3. **Do the rest of the task without it**, and say in your report which part is parked and which part
>    is done. A read-only half is a deliverable; a blocked whole is not.
> 4. **Do not sit and wait.** Report and finish your turn. Minot re-dispatches you when the wall moves.
>
> Minot relays the need to Joosep in Estonian, one need per message, with the reason. Joosep creates the
> credential; Mihkel installs it. Nothing widens without a task that names the repo and the reason.

### 4. `FIRST-TASKS.md` still sends Joosep to `~/work/vedur/`

The PO renamed the team on 2026-08-31 and the Estonian `FIRST-TASKS.md` shipped that same day
(`PROVISIONING-RUNBOOK.md:609`, Step 14, ran 10:55). The rename did not reach the file:

- `FIRST-TASKS.md:139` — "Sinu tiim on `vedur`"
- `FIRST-TASKS.md:140` — "`~/work/vedur/` (roster.json, common-prompt.md, prompts/)"
- `FIRST-TASKS.md:151` — "Minot loeb `vedur/startup.md`"
- `FIRST-TASKS.md:175` — task 5b output path "`~/work/vedur/drafts/`"

The seeded directory is `~/work/paunvere/` (`entrypoint.sh:381-382`), `HANDOVER-JOOSEP.md:52` says
`paunvere`, and `~/work/CLAUDE.md` says `paunvere` (`entrypoint.sh:438-441`). So Joosep's onboarding
document names a directory that does not exist, and the first thing he is told to do in task 4 fails.
Worse, `:175` is an instruction *to the team*: an agent reading task 5b will create
`~/work/vedur/drafts/` beside the real team dir, and Bradshaw's first roll-up lands outside `TEAM_ROOT`
where the shutdown commit (`startup.md:42`) will not pick it up.

**Smallest fix** — `sed -i 's/vedur/paunvere/g' ~/FIRST-TASKS.md` in the container **and** in the repo
copy of record. Four occurrences, no other text changes. Container-side this is Brunel's or Hopper's
hand, and it must respect the never-overwrite discipline: the file is Joosep's now, so edit the four
strings in place rather than re-seeding it.

### 5. Trevithick is told to deliver work he is forbidden to do, with only the withdrawn gate as escape

`trevithick.md:24`, core responsibility 3: "Resolve the two 'open before real sending' items in the app
README **as code that Joosep can act on** — the SOAP wire-mode switch and the dedicated sender identity."

The sender-identity half is covered ("without ever supplying real values yourself"). The **SOAP
wire-mode switch is not**: it plausibly lives in `send-request.ts` / `soap.ts`, which
`trevithick.md:45` forbids him to change and `trevithick.md:39` allows only under a "Ruth-signed"
clearance that no longer exists. He is told to ship it, forbidden to write it, and pointed at an escape
that cannot be produced. A competent agent stalls; a less careful one decides the wire-mode switch is
"not really the rail" and writes it.

**Smallest fix** — rewrite responsibility 3 as:

> 3. Take the two "open before real sending" items in the app README as far as they go **without a diff
>    to a rail file**: the dedicated sender identity as code plus a note on the values Joosep must
>    supply, and the SOAP wire-mode switch as a **written proposal to Joosep** (what would change, in
>    which file, what it would cost the rail), not as a branch. If he decides to make it, it is a
>    routing change and a human applies it.

### 6. The rail is enumerated by file and symbol, so a new file is outside it

`saxby.md:22` triggers a rail review on: `SK_ENDPOINT`, `DEFAULT_TEST_ENDPOINT`, the `EvrSK_test`
checks, `sendMessage()`'s target, `.dev.vars*`, `wrangler.jsonc`, or a train number.
`common-prompt.md:46` uses the same enumeration. Both are lists of things that exist **today**.

A new module in `apps/elron-test/src/lib/` that constructs an outbound request to a message-centre host
touches none of those names, and would clear Saxby's list. The rail's stated intent
(`common-prompt.md:38`, "the same code path ... pointed elsewhere") is behavioural; its enforcement is
lexical. That gap is the plausible route by which a well-intentioned refactor produces a second send
path with no guard — the exact scenario the rule exists to prevent.

**Smallest fix** — append to `common-prompt.md:46` and to `saxby.md:22`:

> ...**and any new or moved code that constructs, configures or issues an outbound request to a
> message-centre host, in any file, under any name.** The list above names today's rail; the rule is
> about the behaviour, and a new file is not an exemption.

### 7. Every escalation ends in "wait for a human", and no prompt says to park instead of waiting

`smiles.md:57` — "Report to Minot: 'ready for Joosep'. **Wait** for Joosep's word, relayed by Minot."
`trevithick.md:56` and `:17` — ask Saxby the rail question, "**You wait** for the answer."
`startup.md:34` — Minot greets and waits.

Minot waiting is correct and deliberate: it makes the team pull-based and absence-safe. A **background
specialist** waiting is not the same thing. Agents are spawned `run_in_background: true`
(`common-prompt.md:97`) inside a tmux session that `HANDOVER-JOOSEP.md:26` documents as surviving
disconnection. Joosep has a day job. A specialist blocked on "Joosep's word" holds a live agent open
across hours or days, on Joosep's own licence (ITSD-39589), for a decision that will arrive in a
different session.

**Smallest fix** — one line in `common-prompt.md` under *Communication*:

> A specialist never waits on a human. If your next step needs Joosep's word, Mihkel's hand, or a
> credential that does not exist yet, finish everything that does not, report what is parked and why,
> and end your turn. Minot re-dispatches you when the answer arrives. Only Minot waits — that is his
> job. (The rail question to Saxby is the exception: he answers within the session, so wait for that.)

### 8. The scratchpad commit only happens on a path the documented usage never takes

`startup.md:38-42` puts the `git commit` of `TEAM_ROOT` in the Shutdown procedure. But
`HANDOVER-JOOSEP.md:26` and `FIRST-TASKS.md:129` teach Joosep the *normal* interaction as
detach-and-leave-running: "`Ctrl-b d` eraldab ja **jätab Claude'i tööle**; terminali sulgemine teeb
sama." The normal path therefore never reaches Shutdown, and the team's entire memory — scratchpads,
`[RAIL]` register, drafts — sits uncommitted until someone runs a clean shutdown that the hand-over
never asks for.

**Smallest fix** — add to `minot.md`'s dispatch loop, step 5 (RECORD):

> After every completed task, not only at shutdown: `git -C ~/work/paunvere add -A && git -C
> ~/work/paunvere commit -m "chore(paunvere): <task> <date>"`. Detaching is the normal way this session
> ends, and it never runs the shutdown steps.

### 9. A credential widening restarts the container and kills the session, and nothing says so

Task 6 (`FIRST-TASKS.md:187`) delivers the first PAT widening by "`./joosep.sh restart`". That
terminates the running Claude session, its background agents, and any uncommitted state. Task 1 has the
same shape (`FIRST-TASKS.md:69-72`). No prompt mentions it. Minot will ask for a credential mid-task and
be destroyed by the answer.

**Smallest fix** — append to `minot.md:61` (*A credential and its need*):

> A widening is installed by a container restart, which ends this session and every agent in it. Before
> you ask for one: commit `TEAM_ROOT`, make sure every scratchpad summary is current, and tell Joosep in
> the same message that the session will end and you will pick up from the scratchpads afterwards.

---

## WATCH

**W1. The train-number rule has no clause for numbers already in the repo.** `common-prompt.md:49` and
`rastrick.md:46` bind every number an agent "writes ... anywhere". `HES-integration-tests` is 53 commits
of existing test data that predates the rule. Editing a file that already contains an out-of-range
number is unresolvable as written, and Rastrick — the member who lives inside this rule daily — cannot
verify compliance. Suggested clause when it next bites: "Numbers already in the repo are reported to
Joosep, not rewritten; you do not add or move one."

**W2. "Never read `SK_ENDPOINT`" collides with required reading.** `common-prompt.md:47` forbids reading
`SK_ENDPOINT`/`SK_USER`/`SK_PASSWORD`; `saxby.md:49` forbids "read or handle `SK_*`". But Trevithick
must read `soap.ts` and Saxby must review `send-request.ts`, both of which *name* those identifiers. The
rule means the **values**; it does not say so. A cautious agent hesitates over its own job. One word
fixes it: "never set, echo, write into a file, or reach for the **values** of ...".

**W3. Minot's ALLOWED list omits the tool he exists to use.** `minot.md:42-47` is a closed allow-list
(Read, Edit/Write, Bash, SendMessage, Task*) and does not name the Agent/spawn tool, though FORBIDDEN
(`:37`) and `startup.md:35` both assume he spawns. Scope-block drift from practice; add `Agent` to the
ALLOWED list.

**W4. `TEAM_ROOT/drafts/` is written by two members and declared by neither anchor nor seed.**
`bradshaw.md:38` and `smiles.md:42` write there; `common-prompt.md:27` lists only this file,
`roster.json`, `prompts/`, `memory/`, `startup.md`; `entrypoint.sh` seeds no `drafts/`. Harmless — the
first write creates it — but add it to the anchors table so the shutdown commit obviously covers it.

**W5. The stale-docstring finding is itself now a week old and unverified.** Three files
(`common-prompt.md:49`, `saxby.md:27`, `FIRST-TASKS.md:238`) assert that `timetable.ts:10` still says
"enforced server-side". That was read on 2026-08-27/28. If Joosep has since fixed the docstring, the
team carries a confident false claim about his code in three places, to him. Saxby's first report should
verify it at source before restating it — the same read-the-rail-at-source rule that produced the
finding.

**W6. `HANDOVER-JOOSEP.md:3` still carries a draft status line.** "MUSTAND, ootab PO eestikeelset
ülevaatust" and "Celes ei ole S67-s käivitatud" — the document was reviewed and sent, and the container
has been live since 2026-08-31. Cosmetic, but it is the first thing a future reader sees.

**W7. `startup.md:15` pins a CLI version in prose** ("This container installs CLI 2.1.250"). It will
age, and the paragraph's real claim (2.1.178+ means implicit teams) does not depend on the exact number.
Say "2.1.178 or later" and drop the exact pin.

---

## What I did NOT check

- **The live container.** Everything above is the repo copy of record at
  `designs/deployed/joosep/`. I did not read `~/FIRST-TASKS.md`, `~/work/paunvere/*`, or
  `~/.claude/settings.json` on the joosep box. `FIRST-TASKS.md` is Joosep's own file by design and he
  may have edited it since 08-31; the `vedur` fix must be applied to his copy in place, not by
  re-seeding.
- **Whether the team has ever run.** There are no scratchpads in the package, so I reviewed the prompts
  as written, not behaviour under the regime. Every claim about what an agent "will do" is a prediction.
- **The `rumba` and `HES-integration-tests` source.** Every file:line about `soap.ts`,
  `send-request.ts`, `timetable.ts:10`, `faa287e` and `39f16a83` is carried from my S66 reading, not
  re-verified today. See W5.
- **Atlassian.** VEO-181 comment 243424, VEO-98's state, and the Confluence page IDs cited in
  `bradshaw.md:32` were not opened.
- **Brunel's container package as a whole.** I grepped `Dockerfile`, `entrypoint.sh`,
  `docker-compose.yml` and `PROVISIONING-RUNBOOK.md` only for the specific questions above (team-name
  seeding, pnpm, settings.json deny, drafts). pnpm/corepack is correctly handled
  (`Dockerfile:135-137`); the settings.json deny list is four patterns, none of them rail-related, which
  matches the design's own "tripwire, not a backstop" statement (`README.md:75`). Whether a cheap
  `Bash(wrangler:*)` deny is worth adding as defence-in-depth for the hard safety rule is Brunel's call,
  not a prompt-layer fix.
- **Model and licence reality.** `startup.md:30` tells Minot to record the actual model on first boot; I
  have no evidence of what he found.

(*FR:Celes*)
